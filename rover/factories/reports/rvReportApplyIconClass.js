'use strict';

angular.module('reportsModule').factory('RVReportApplyIconClass', ['RVReportNamesConst', function (reportNames) {
    return {
        init: function init(report) {
            var classNames = {
                'CHECK_IN_CHECK_OUT': 'icon-report icon-check-in-check-out',
                'UPSELL': 'icon-report icon-upsell',
                'WEB_CHECK_OUT_CONVERSION': 'icon-report icon-check-out',
                'WEB_CHECK_IN_CONVERSION': 'icon-report icon-check-in',
                'LATE_CHECK_OUT': 'guest-status late-check-out',
                'IN_HOUSE_GUEST': 'guest-status inhouse',
                'ARRIVAL': 'guest-status check-in',
                'DEPARTURE': 'guest-status check-out',
                'CANCELLATION_NO_SHOW': 'guest-status cancel',
                'BOOKING_SOURCE_MARKET_REPORT': 'icon-report icon-booking',
                'LOGIN_AND_OUT_ACTIVITY': 'icon-report icon-activity',
                'DEPOSIT_REPORT': 'icon-report icon-deposit',
                'GROUP_DEPOSIT_REPORT': 'icon-report icon-deposit',
                'OCCUPANCY_REVENUE_SUMMARY': 'icon-report icon-occupancy',
                'RESERVATIONS_BY_USER': 'icon-report icon-reservations',
                'DAILY_TRANSACTIONS': 'icon-report icon-transactions',
                'DAILY_PAYMENTS': 'icon-report icon-transactions',
                'ROOMS_QUEUED': 'icons guest-status icon-queued',
                'FORECAST_BY_DATE': 'icon-report icon-forecast',
                'MARKET_SEGMENT_STAT_REPORT': 'icon-report icon-market',
                'FORECAST_GUEST_GROUPS': 'icon-report icon-forecast',
                'COMPARISION_BY_DATE': 'icon-report icon-comparison',
                'RATE_ADJUSTMENTS_REPORT': 'icon-report icon-rate',
                'GROUP_PICKUP_REPORT': 'icon-report icon-group',
                'DAILY_PRODUCTION_ROOM_TYPE': 'icon-report icon-forecast',
                'AR_SUMMARY_REPORT': 'icon-report icon-forecast',
                'GUEST_BALANCE_REPORT': 'icon-report icon-balance',
                'RATE_RESTRICTION_REPORT': 'icon-report icon-rate',
                'COMPANY_TA_TOP_PRODUCERS': 'icon-report icon-cards',
                'FINANCIAL_TRANSACTIONS_ADJUSTMENT_REPORT': 'icon-report icon-forecast',
                'CREDIT_CHECK_REPORT': 'icon-report icon-deposit',
                'DEPOSIT_SUMMARY': 'icon-report icon-deposit',
                'ROOMS_OOO_OOS': 'icon-report icon-room',
                'ACTIONS_MANAGER': 'icon-report icon-action',
                'VACANT_ROOMS_REPORT': 'icon-report icon-room',
                'BUSINESS_ON_BOOKS': 'icon-report icon-forecast',
                'GROUP_ROOMS_REPORT': 'icon-report icon-room',
                'YEARLY_TAX': 'icon-report icon-forecast',
                'TAX_EXEMPT': 'icon-report icon-forecast',
                'GUESTS_INHOUSE_BY_NATIONALITY': 'icons icon-adult icon-20w',
                /* default class name */
                'DEFAULT': 'icon-report'
            };

            var reportName = _.findKey(reportNames, function (value) {
                return value === report['title'];
            });

            report['reportIconCls'] = classNames[reportName] || classNames['DEFAULT'];
        }
    };
}]);