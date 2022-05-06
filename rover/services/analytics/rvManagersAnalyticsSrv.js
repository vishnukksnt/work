angular.module('sntRover').service('rvManagersAnalyticsSrv', [
    '$q',
    'sntActivity',
    'rvBaseWebSrvV2',
    function($q, sntActivity, rvBaseWebSrvV2) {

        this.roomPerformanceKPR = function(params) {
            var deferred = $q.defer();

            var url = '/redshift/analytics/room_performance_kpr';

            rvBaseWebSrvV2.getJSON(url, params)
                .then(function(data) {
                    deferred.resolve(data);
                }, function(data) {
                    deferred.reject(data);
                });

            return deferred.promise;
        };

        this.distributions = function(params) {
            var deferred = $q.defer();

            var url = '/redshift/analytics/distributions';

            if (params.shallowDecodedParams) {
                url = url + '?' + params.shallowDecodedParams;
                delete params.shallowDecodedParams;
            }

            rvBaseWebSrvV2.getJSON(url, params)
                .then(function(data) {
                    var isAggregated = params.group_by !== undefined;

                    deferred.resolve(formatDistribution(data, params.chart_type, isAggregated));
                }, function(data) {
                    deferred.reject(data);
                });

            return deferred.promise;
        };

        this.pace = function(params) {
            var deferred = $q.defer();

            var url = '/redshift/analytics/pace';

            if (params.shallowDecodedParams) {
                url = url + '?' + params.shallowDecodedParams;
                delete params.shallowDecodedParams;
            }

            rvBaseWebSrvV2.getJSON(url, params)
                .then(function(data) {
                    // TODO: delete after testing
                    // data = processPaceData(data);
                    deferred.resolve(data);
                }, function(data) {
                    deferred.reject(data);
                });

            return deferred.promise;
        };

        var processPaceData = function(data) {
            // TODO: Till we have zoomable chart, limit data for 1 month
            if (data.length >= 30) {
                var lastDay = data[data.length - 1];
                var oneMonthBefore = moment(lastDay.date)
                    .subtract(1, 'month')
                    .format("YYYY-MM-DD");

                data = _.filter(data, function(day) {
                    return day.date >= oneMonthBefore;
                });
            };

            return data;
        };

        var formatDistribution = function(distributions, resultType, isAggregated) {
            var dataByDate = {};

            distributions.forEach(function(distribution) {
                if (dataByDate[distribution.date] === undefined) {
                    dataByDate[distribution.date] = [];
                }
                dataByDate[distribution.date].push(distribution);
            });

            var formatedData = [];

            Object.keys(dataByDate).forEach(function(date) {
                var dateElement = { date: date };
                var dateDatas = dataByDate[date];

                dateDatas.forEach(function(dateData) {
                    if (isAggregated) {
                        var key = dateData.value ? dateData.value : "N/A";
                        
                        dateElement[key] = dateData[resultType];
                    } else {
                        dateElement[resultType] = dateData[resultType];
                    }
                });
                formatedData.push(dateElement);
            });

            return formatedData;
        };

        this.exportAsCsv = function(params) {

            var url = '/redshift/analytics/distributions.csv';

            if (params.shallowDecodedParams) {
                url = url + '?' + params.shallowDecodedParams;
                delete params.shallowDecodedParams;
            }

            return rvBaseWebSrvV2.getJSON(url, params);
        };

    }
]);
