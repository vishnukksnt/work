'use strict';

angular.module('reportsModule').factory('RVReportSetupOptions', ['RVReportNamesConst', function (reportNames) {
    var factory = {};

    var options = {
        'ARRIVAL': [{
            uuid: 100,
            title: 'Option(s)',
            defaultValue: 'Select Option',
            allValue: 'All Selected',
            actualFilter: undefined,
            matchFilters: ['DUE_IN_ARRIVALS', 'INCLUDE_CANCELLED', 'INCLUDE_NO_SHOW', 'INCLUDE_NOTES', 'INCLUDE_ACTIONS', 'SHOW_GUESTS', 'VIP_ONLY'],
            initialSelected: ['DUE_IN_ARRIVALS'],
            data: []
        }, {
            uuid: 101,
            title: 'Gurantee(s)',
            defaultValue: 'Select Gurantees',
            allValue: 'All Selected',
            actualFilter: 'INCLUDE_GUARANTEE_TYPE',
            allSelected: true
        }]
    };

    var configs = {
        hasShowOptions: {
            SHOW_COMPANY: true,
            SHOW_TRAVEL_AGENT: true
        },
        hasChargeTypeOptions: {
            SHOW_ADJUSTMENTS: true,
            SHOW_DELETED_CHARGES: true
        },
        hasGeneralOptions: {
            INCLUDE_ACTIONS: true,
            INCLUDE_NOTES: true,
            VIP_ONLY: true,
            INCLUDE_VARIANCE: true,
            INCLUDE_LAST_YEAR: true,
            INCLUDE_CANCELLED: true,
            INCLUDE_CANCELED: true,
            INCLUDE_NO_SHOW: true,
            SHOW_GUESTS: true,
            ROVER: true,
            ZEST: true,
            ZEST_WEB: true,
            DEPOSIT_PAID: true,
            DEPOSIT_DUE: true,
            DEPOSIT_PAST: true,
            DUE_IN_ARRIVALS: true,
            DUE_OUT_DEPARTURES: true,
            INCLUDE_NEW: true,
            INCLUDE_BOTH: true,
            EXCLUDE_NON_GTD: true,
            SHOW_RATE_ADJUSTMENTS_ONLY: true,
            INCLUDE_TAX: true,
            INCLUDE_TAX_RATE: true,
            INCLUDE_ADDON_RATE: true,
            INCLUDE_ADDONS: true,
            INCLUDE_ADDON_REVENUE: true
        }
    };

    var overrides = {
        hasShowOptions: {
            title: 'Show',
            allValue: 'Both'
        },
        hasChargeTypeOptions: {
            title: 'Charge Types',
            allValue: 'Both'
        }
    };

    var changers = {
        CANCELLATION_NO_SHOW: function CANCELLATION_NO_SHOW(filter) {
            if (filter === 'INCLUDE_CANCELLED' || filter === 'INCLUDE_CANCELED') {
                return {
                    selected: true
                };
            }
        },
        FORECAST_GUEST_GROUPS: function FORECAST_GUEST_GROUPS(filter) {
            if (filter == 'EXCLUDE_NON_GTD') {
                return {
                    selected: true
                };
            }
        },
        DAILY_PRODUCTION_DEMO: function DAILY_PRODUCTION_DEMO(filter) {
            if (filter === 'EXCLUDE_TAX') {
                return {
                    selected: true
                };
            }
        },
        DAILY_PRODUCTION_ROOM_TYPE: function DAILY_PRODUCTION_ROOM_TYPE(filter) {
            if (filter === 'INCLUDE_ADDONS') {
                return {
                    selected: true
                };
            }
        },
        DEFAULT: function DEFAULT(filter) {
            var ret = {};

            if (filter === 'DUE_IN_ARRIVALS' || filter === 'DUE_OUT_DEPARTURES') {
                ret.selected = true;
            }

            if (filter === 'DEPOSIT_PAID' || filter === 'DEPOSIT_DUE' || filter === 'DEPOSIT_PAST') {
                ret.mustSend = true;
            }

            if (filter === 'SHOW_COMPANY' || filter === 'SHOW_TRAVEL_AGENT') {
                ret.selected = true;
            }

            return ret;
        }
    };

    factory.init = function (report) {
        var reportName = _.findKey(reportNames, function (value, key) {
            return value === report['title'];
        });
        var changer = changers[reportName] || changers['DEFAULT'];

        report.allOptions = [];

        _.each(report.filters, function (filter) {
            _.each(configs, function (config, key) {
                if (config[filter.value]) {
                    pushFilterData(key, overrides[key], changer(filter.value), report, filter);

                    report.allOptions.push(key);
                }
            });
        });

        _.each(report.allOptions, function (option) {
            updateOption(report[option]);
        });
    };

    function pushFilterData(key, override, change, report, filter) {
        if (!report.hasOwnProperty(key)) {
            report[key] = $.extend({
                title: 'Option(s)',
                isOpen: false,
                selectAll: false,
                value: 'Select Options',
                allValue: 'All Selected',
                defaultValue: 'Select Options',
                valueKey: 'description',
                data: []
            }, override);
        }

        data = $.extend({
            paramKey: filter.value.toLowerCase(),
            description: filter.description,
            selected: false
        }, change);

        report[key]['data'].push(data);
    }

    function updateOption(option) {
        var selectedItems = _.where(option.data, { selected: true });

        if (selectedItems.length === 1) {
            option.value = selectedItems[0]['description'];
        } else if (selectedItems.length === option.data.length) {
            option.value = option.allValue;
            option.selectAll = true;
        } else {
            option.value = selectedItems.length + ' Selected';
        }
    }

    return factory;
}]);