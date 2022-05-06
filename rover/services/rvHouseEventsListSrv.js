angular.module('sntRover').service('rvHouseEventsListSrv', [
    '$q',
    'rvBaseWebSrvV2',
    function ($q, rvBaseWebSrvV2) {

    /**
     * Fetch house events count for the given date
     * @param {Object} params - hold the request params
     * @return {Promise}
     */
    this.fetchHouseEventsByDate = function(params) {
        var url = '/api/house_events',
            deferred = $q.defer();

        rvBaseWebSrvV2.getJSON(url, params).then(function(response) {
            deferred.resolve(response.data);
        }, function(error) {
            deferred.reject(error);
        });

        return deferred.promise;
    };

    /**
     * Fetch house events count for a date range
     * @param {Object} params - hold the request params
     * @return {Promise}
     */
    this.fetchHouseEventsCount = function(params) {
        var url = '/api/house_events/count_per_day',
            deferred = $q.defer();

        rvBaseWebSrvV2.getJSON(url, params).then(function(response) {
            var formattedData = {};

            _.each(response.data, function(event) {
                formattedData[event.date] = event.count;
            });

            deferred.resolve(formattedData);
        }, function(error) {
            deferred.reject(error);
        });

        return deferred.promise;
    };

}]);
