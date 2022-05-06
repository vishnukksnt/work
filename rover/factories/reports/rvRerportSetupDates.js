'use strict';

angular.module('reportsModule').factory('RVReportSetupDates', ['RVReportNamesConst', 'RVReportUtilsFac', function (reportNames, reportUtils) {
    return {
        init: function init(report) {
            var getDates = reportUtils.processDate();

            var DATE_CONFIGS = {
                'ARRIVAL': {
                    'fromDate': getDates.businessDate,
                    'untilDate': getDates.businessDate
                },
                'DEPARTURE': {
                    'fromDate': getDates.businessDate,
                    'untilDate': getDates.businessDate
                },
                'DEPOSIT_REPORT': {
                    'fromArrivalDate': getDates.businessDate,
                    'untilArrivalDate': getDates.aWeekAfter,
                    /**/
                    'fromDepositDate': getDates.businessDate,
                    'untilDepositDate': getDates.businessDate,
                    /**/
                    'fromPaidDate': getDates.businessDate,
                    'untilPaidDate': getDates.businessDate
                },
                'GROUP_DEPOSIT_REPORT': {
                    'groupStartDate': getDates.businessDate,
                    'groupEndDate': getDates.twentyEightDaysAfter,
                    /**/
                    'fromPaidDate': getDates.twentyEightDaysBefore,
                    'untilPaidDate': getDates.businessDate
                },
                'OCCUPANCY_REVENUE_SUMMARY': {
                    'fromDate': getDates.yesterday,
                    'untilDate': getDates.yesterday
                },
                'DAILY_TRANSACTIONS': {
                    'singleValueDate': getDates.yesterday
                },
                'DAILY_PAYMENTS': {
                    'singleValueDate': getDates.yesterday
                },
                'MARKET_SEGMENT_STAT_REPORT': {
                    'singleValueDate': getDates.yesterday
                },
                'COMPARISION_BY_DATE': {
                    'singleValueDate': getDates.yesterday
                },
                'FORECAST_BY_DATE': {
                    'fromDate': getDates.businessDate,
                    'untilDate': getDates.aMonthAfter
                },
                'FORECAST_GUEST_GROUPS': {
                    'fromDate': getDates.businessDate,
                    'untilDate': getDates.aMonthAfter
                },
                'ADDON_FORECAST': {
                    'fromDate': getDates.businessDate,
                    'untilDate': getDates.businessDate
                },
                'ALLOWANCE_FORECAST': {
                    'fromDate': getDates.tomorrow,
                    'untilDate': getDates.tomorrow
                },
                'DAILY_PRODUCTION_ROOM_TYPE': {
                    'fromDate': getDates.monthStart,
                    'untilDate': getDates.businessDate
                },
                'DAILY_PRODUCTION_DEMO': {
                    'fromDate': getDates.monthStart,
                    'untilDate': getDates.businessDate
                },
                'DAILY_PRODUCTION_RATE': {
                    'fromDate': getDates.monthStart,
                    'untilDate': getDates.businessDate
                },
                'RATE_RESTRICTION_REPORT': {
                    'fromDate': getDates.businessDate,
                    'untilDate': getDates.businessDate
                },
                'IN_HOUSE_GUEST': {
                    'singleValueDate': getDates.businessDate
                },
                'COMPANY_TA_TOP_PRODUCERS': {
                    'fromDate': getDates.aWeekAgo,
                    'untilDate': getDates.yesterday
                },
                'FINANCIAL_TRANSACTIONS_ADJUSTMENT_REPORT': {
                    'fromDate': getDates.businessDate,
                    'untilDate': getDates.businessDate
                },
                'A/R_AGING': {
                    'untilDate': getDates.yesterday
                },
                'COMPLIMENTARY_ROOM_REPORT': {
                    'fromDate': getDates.businessDate,
                    'untilDate': getDates.businessDate
                },
                'GROUP_ROOMS_REPORT': {
                    'fromDate': getDates.businessDate,
                    'untilDate': getDates.thirtyOneDaysAfter
                },
                'FINANCIAL_TRANSACTION_REVENUE_REPORT': {
                    'fromDate': getDates.yesterday,
                    'untilDate': getDates.yesterday
                },
                'FINANCIAL_TRANSACTION_PAYMENT_REPORT': {
                    'fromDate': getDates.yesterday,
                    'untilDate': getDates.yesterday
                },
                'FINANCIAL_TRANSACTION_SUMMARY_REPORT': {
                    'singleValueDate': getDates.yesterday
                },
                /**/
                'DEFAULT': {
                    'fromDate': getDates.aWeekAgo,
                    'untilDate': getDates.businessDate,
                    /**/
                    'fromCancelDate': getDates.aWeekAgo,
                    'untilCancelDate': getDates.businessDate,
                    /**/
                    'fromArrivalDate': getDates.aWeekAgo,
                    'untilArrivalDate': getDates.businessDate,
                    /**/
                    'fromCreateDate': getDates.aWeekAgo,
                    'untilCreateDate': getDates.businessDate,
                    /**/
                    'fromAdjustmentDate': getDates.aWeekAgo,
                    'untilAdjustmentDate': getDates.businessDate
                }
            };

            var reportName = _.findKey(reportNames, function (value, key) {
                return value === report['title'];
            });

            var dates = DATE_CONFIGS[reportName] || DATE_CONFIGS['DEFAULT'];

            _.each(dates, function (value, key) {
                report[key] = value;
            });

            // track all dates avaiable in a report
            report.allDates = [];
        },
        execFilter: function execFilter(report, filter) {
            var setUp = function setUp(dateKey, fromModel, untilModel) {
                report[dateKey] = filter;

                angular.extend(report[dateKey], {
                    showRemove: true,
                    fromModel: fromModel
                });

                if (!!untilModel) {
                    report[dateKey]['untilModel'] = untilModel;
                }

                report.allDates.push(dateKey);
            };

            /** DATE_RANGE */

            if ('DATE_RANGE' === filter.value) {
                setUp('hasDateFilter', 'fromDate', 'untilDate');

                // for 'Cancellation & No Show' report the description should be 'Arrival Date Range'
                if (report['title'] === reportNames['CANCELLATION_NO_SHOW']) {
                    report['hasDateFilter']['description'] = 'Arrival Date Range';
                }

                // for 'Booking Source & Market Report' report the description should be 'Booked Date'
                if (report['title'] === reportNames['BOOKING_SOURCE_MARKET_REPORT']) {
                    report['hasDateFilter']['description'] = 'Booked Date';
                }
            }

            /** CANCELATION_DATE_RANGE */

            if ('CANCELATION_DATE_RANGE' === filter.value || 'CANCELLATION_DATE_RANGE' === filter.value) {
                setUp('hasCancelDateFilter', 'fromCancelDate', 'untilCancelDate');
            }

            /** ARRIVAL_DATE_RANGE */

            if ('ARRIVAL_DATE_RANGE' === filter.value) {
                setUp('hasArrivalDateFilter', 'fromArrivalDate', 'untilArrivalDate');
            }

            /** GROUP_START_DATE_RANGE */

            if ('GROUP_START_DATE_RANGE' === filter.value) {
                setUp('hasGroupStartDateRange', 'groupStartDate', 'groupEndDate');
            }

            /** DEPOSIT_DATE_RANGE */

            if ('DEPOSIT_DATE_RANGE' === filter.value) {
                setUp('hasDepositDateFilter', 'fromDepositDate', 'untilDepositDate');
            }

            /** CREATE_DATE_RANGE */

            if ('CREATE_DATE_RANGE' === filter.value) {
                setUp('hasCreateDateFilter', 'fromCreateDate', 'untilCreateDate');
            }

            /** PAID_DATE_RANGE */

            if ('PAID_DATE_RANGE' === filter.value) {
                setUp('hasPaidDateRange', 'fromPaidDate', 'untilPaidDate');
            }

            /** SINGLE_DATE */

            if ('SINGLE_DATE' === filter.value) {
                setUp('hasSingleDateFilter', 'singleValueDate');
            }

            /** ADJUSTMENT_DATE_RANGE */

            if ('ADJUSTMENT_DATE_RANGE' === filter.value) {
                setUp('hasAdjustmentDateRange', 'fromAdjustmentDate', 'untilAdjustmentDate');
            }
        }
    };
}]);