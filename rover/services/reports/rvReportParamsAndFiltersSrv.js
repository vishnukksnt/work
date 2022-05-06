'use strict';

angular.module('reportsModule').factory('dateFilterFac', ['RVReportParamsConst', '$filter', function (reportParams, $filter) {
    return {
        check: function check(report, shouldChangeFilters) {
            var fromKey,
                untilKey,
                params = {},
                filters = {};

            if (!!report.hasDateFilter) {
                if (!!report.fromDate) {
                    fromKey = reportParams['FROM_DATE'];
                    params[fromKey] = $filter('date')(report.fromDate, 'yyyy/MM/dd');
                    if (shouldChangeFilters) {
                        filters.fromDate = angular.copy(report.fromDate);
                    }
                }

                if (!!report.untilDate) {
                    untilKey = reportParams['TO_DATE'];
                    params[untilKey] = $filter('date')(report.untilDate, 'yyyy/MM/dd');
                    if (shouldChangeFilters) {
                        filters.toDate = angular.copy(report.untilDate);
                    }
                }
            }

            return {
                params: params,
                filters: filters
            };
        }
    };
}]).factory('cancelDateFilterFac', ['RVReportParamsConst', '$filter', function (reportParams, $filter) {
    return {
        check: function check(report, shouldChangeFilters) {
            var fromKey,
                untilKey,
                params = {},
                filters = {};

            if (!!report.hasCancelDateFilter) {
                fromKey = reportParams['CANCEL_FROM_DATE'];
                untilKey = reportParams['CANCEL_TO_DATE'];
                /**/
                params[fromKey] = $filter('date')(report.fromCancelDate, 'yyyy/MM/dd');
                params[untilKey] = $filter('date')(report.untilCancelDate, 'yyyy/MM/dd');
                /**/
                if (shouldChangeFilters) {
                    filters.cancelFromDate = angular.copy(report.fromCancelDate);
                    filters.cancelToDate = angular.copy(report.untilCancelDate);
                }
            }

            return {
                params: params,
                filters: filters
            };
        }
    };
}]).factory('arrivalDateFilterFac', ['RVReportParamsConst', '$filter', function (reportParams, $filter) {
    return {
        check: function check(report, shouldChangeFilters) {
            var fromKey,
                untilKey,
                params = {},
                filters = {};

            if (!!report.hasArrivalDateFilter && !!report.fromArrivalDate && !!report.untilArrivalDate) {
                fromKey = reportParams['ARRIVAL_FROM_DATE'];
                untilKey = reportParams['ARRIVAL_TO_DATE'];
                /**/
                params[fromKey] = $filter('date')(report.fromArrivalDate, 'yyyy/MM/dd');
                params[untilKey] = $filter('date')(report.untilArrivalDate, 'yyyy/MM/dd');
                /**/
                if (shouldChangeFilters) {
                    filters.arrivalFromDate = angular.copy(report.fromArrivalDate);
                    filters.arrivalToDate = angular.copy(report.untilArrivalDate);
                }
            }

            return {
                params: params,
                filters: filters
            };
        }
    };
}]).service('RVReportParamsAndFiltersSrv', ['dateFilterFac', function (dateFilterFac) {
    var params = {},
        appliedFilters = {},
        initialFilters = {
        options: [],
        display: [],
        show: [],
        markets: [],
        sources: [],
        origins: [],
        origin_urls: [],
        guarantees: [],
        chargeGroups: [],
        chargeCodes: [],
        holdStatuses: [],
        addonGroups: [],
        addons: [],
        reservationStatus: [],
        guestOrAccount: [],
        chargeTypes: [],
        users: [],
        campaign_types: [],
        floorList: [],
        rates: [],
        assigned_departments: [],
        completion_status: []
    };

    var addParams = function addParams(obj) {
        params = _.extend(params, obj);
        return params;
    };

    var resetParams = function resetParams() {
        params = {};
        return params;
    };

    var addFilter = function addFilter(obj) {
        appliedFilters = _.extend(appliedFilters, obj);
        return appliedFilters;
    };

    var resetFilters = function resetFilters() {
        appliedFilters = angular.copy(initialFilters);
        return appliedFilters;
    };

    return {
        getParams: function getParams() {
            return params;
        },
        getFilters: function getFilters() {
            return appliedFilters;
        },
        genParamsAndFilters: function genParamsAndFilters(report, page, perPage, shouldChangeFilters) {
            var shouldChangeFilters = 'boolean' === typeof shouldChangeFilters ? shouldChangeFilters : true;

            if (shouldChangeFilters) {
                resetFilters();
            }

            addParam({
                id: report.id,
                page: page,
                per_page: perPage
            });

            var dateFilter = dateFilterFac.check(report, shouldChangeFilters);

            addParam(dateFilter.params);
            addFilter(dateFilter.filters);

            var cancelDateFilter = cancelDateFilterFac.check(report, shouldChangeFilters);

            addParam(cancelDateFilter.params);
            addFilter(cancelDateFilter.filters);

            var arrivalDateFilter = arrivalDateFilterFac.check(report, shouldChangeFilters);

            addParam(arrivalDateFilter.params);
            addFilter(arrivalDateFilter.filters);

            return {
                params: params,
                filters: filters
            };
        }
    };
}]);