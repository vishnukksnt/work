'use strict';

angular.module('reportsModule').factory('RVReportApplyFlags', ['RVReportNamesConst', function (reportNames) {
    return {
        init: function init(report) {
            var flags = {
                'BOOKING_SOURCE_MARKET_REPORT': ['canRemoveDate'],
                'LOGIN_AND_OUT_ACTIVITY': ['hasUserFilter'],
                'DEPOSIT_REPORT': ['canRemoveDate'],
                'IN_HOUSE_GUEST': ['canRemoveDate', 'hasOneMonthLimit'],
                'OCCUPANCY_REVENUE_SUMMARY': ['hasPrevDateLimit'],
                'RESERVATIONS_BY_USER': ['hasUserFilter', 'canRemoveDate'],
                'MARKET_SEGMENT_STAT_REPORT': ['hasSysDateLimit'],
                'ROOMS_QUEUED': ['hasSysDateLimit'],
                'RATE_ADJUSTMENTS_REPORT': ['hasDateLimit', 'canRemoveDate'],
                'ADDON_FORECAST': ['canRemoveDate', 'hasOneYearLimit'],
                'ALLOWANCE_FORECAST': ['canRemoveDate', 'isForecast'],
                'DAILY_PRODUCTION_ROOM_TYPE': ['canRemoveDate', 'hasOneYearLimit'],
                'DAILY_PRODUCTION_DEMO': ['hasOneYearLimit'],
                'DAILY_PRODUCTION_RATE': ['hasOneYearLimit'],
                'RATE_RESTRICTION_REPORT': ['hasOneYearLimit'],
                'FINANCIAL_TRANSACTIONS_ADJUSTMENT_REPORT': ['hasUserFilter'],
                'CANCELLATION_NO_SHOW': ['canRemoveDate'],
                'COMPARISION_BY_DATE': ['hasSysDateLimit'],
                'BUSINESS_ON_BOOKS': ['hasOneYearLimit'],
                'COMPANY_TA_TOP_PRODUCERS': ['hasPrevDateLimit'],
                'GROUP_ROOMS_REPORT': ['hasOneYearLimit'],
                'ADDON_UPSELLS': ['hasOneYearLimit'],
                'FORECAST_BY_DATE': ['hasOneYearLimit'],
                'FORECAST_GUEST_GROUPS': ['hasOneYearLimit'],
                'ARRIVAL': ['hasOneMonthLimit'],
                'DEPARTURE': ['hasOneMonthLimit'],
                'FINANCIAL_TRANSACTION_REVENUE_REPORT': ['hasUserFilter', 'hasBDLimit'],
                'FINANCIAL_TRANSACTION_PAYMENT_REPORT': ['hasUserFilter', 'hasBDLimit'],
                'FINANCIAL_TRANSACTION_SUMMARY_REPORT': ['hasDateLimit'],
                'TAX_OUTPUT_REPORT': ['hasOneYearLimit']
            };

            var reportName = _.findKey(reportNames, function (value, key) {
                return value === report['title'];
            });

            if (!!reportName) {
                _.each(flags[reportName], function (flag) {
                    report[flag] = true;
                });
            }
        }
    };
}]);