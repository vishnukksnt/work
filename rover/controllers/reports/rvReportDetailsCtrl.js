'use strict';

sntRover.controller('RVReportDetailsCtrl', ['$scope', '$rootScope', '$filter', '$timeout', '$window', 'RVreportsSrv', 'RVReportParserFac', 'RVReportMsgsConst', 'RVReportNamesConst', 'ngDialog', '$state', 'RVReportPaginationIdsConst', '$log', 'RVReportUtilsFac', 'sntActivity', '$q', 'RVReportsInboxSrv', 'RVreportsSubSrv', function ($scope, $rootScope, $filter, $timeout, $window, reportsSrv, reportParser, reportMsgs, reportNames, ngDialog, $state, reportPaginationIds, $log, reportUtils, sntActivity, $q, RVReportsInboxSrv, reportsSubSrv) {

    BaseCtrl.call(this, $scope);

    var REPORT_DETAILS_SCROLL = 'report-details-scroll';
    var REPORT_FILTER_SIDEBAR_SCROLL = 'report-filter-sidebar-scroll';

    var datePickerCommon = {
        dateFormat: $rootScope.jqDateFormat,
        numberOfMonths: 1,
        changeYear: true,
        changeMonth: true,
        beforeShow: function beforeShow(input, inst) {
            $('#ui-datepicker-div');
            $('<div id="ui-datepicker-overlay">').insertAfter('#ui-datepicker-div');
        },
        onClose: function onClose(value) {
            $('#ui-datepicker-div');
            $('#ui-datepicker-overlay').remove();
            $scope.showRemoveDateBtn();
        }
    };

    function $_onSelect(value, dayOffset, effectObj) {
        if (value instanceof Date) {
            return value;
        }

        var format = $rootScope.dateFormat.toUpperCase(),
            day,
            month,
            year,
            date;

        if (format === 'MM-DD-YYYY' || format === 'MM/DD/YYYY') {
            day = parseInt(value.substring(3, 5));
            month = parseInt(value.substring(0, 2));
        } else if (format === 'DD-MM-YYYY' || format === 'DD/MM/YYYY') {
            day = parseInt(value.substring(0, 2));
            month = parseInt(value.substring(3, 5));
        }

        year = parseInt(value.substring(6, 10));
        date = new Date(year, month - 1, day + dayOffset);

        if (effectObj) {
            effectObj.maxDate = date;
        } else {
            return date;
        }
    }

    var setScroller = function setScroller() {
        // setting scroller things
        var scrollerOptions = {
            tap: true,
            preventDefault: false
        };

        $scope.setScroller(REPORT_DETAILS_SCROLL, scrollerOptions);
        $scope.setScroller(REPORT_FILTER_SIDEBAR_SCROLL, scrollerOptions);
    };

    setScroller();

    $scope.refreshScroll = function (stay) {
        $scope.refreshScroller(REPORT_DETAILS_SCROLL);
        if (!stay && $scope.myScroll && $scope.myScroll.hasOwnProperty(REPORT_DETAILS_SCROLL)) {
            $scope.myScroll[REPORT_DETAILS_SCROLL].scrollTo(0, 0, 100);
        }
    };

    $scope.refreshSidebarScroll = function () {
        $scope.refreshScroller(REPORT_FILTER_SIDEBAR_SCROLL);
    };

    var reportDetailsFilterScrollRefresh = $scope.$on(reportMsgs['REPORT_DETAILS_FILTER_SCROLL_REFRESH'], function () {
        $scope.refreshSidebarScroll();
    });

    $scope.$on('$destroy', reportDetailsFilterScrollRefresh);

    var $_pageNo = 1;
    var $_resultsPerPage = 25;

    /**
     * inorder to refresh after list rendering
     */
    $scope.$on('NG_REPEAT_COMPLETED_RENDERING', function () {
        $timeout($scope.refreshScroll, 1000);
    });

    $scope.parsedApiFor = undefined;
    $scope.currencySymbol = $rootScope.currencySymbol;

    // CICO-39558 - Setting flags for commission print.
    $scope.printTACommissionFlag = {
        'summary': false,
        'agent': false
    };

    // common methods to do things after fetch report
    var afterFetch = function afterFetch() {
        var totals = $scope.$parent.totals,
            headers = $scope.$parent.headers,
            subHeaders = $scope.$parent.subHeaders,
            results = $scope.$parent.results,
            resultsTotalRow = $scope.$parent.resultsTotalRow,
            totalCount = $scope.$parent.totalCount;

        $scope.chosenReport = reportsSrv.getChoosenReport();

        $scope.setTitle($scope.chosenReport.title + ' ' + ($scope.chosenReport.sub_title ? $scope.chosenReport.sub_title : ''));
        $scope.$parent.heading = $scope.chosenReport.title + ' ' + ($scope.chosenReport.sub_title ? $scope.chosenReport.sub_title : '');

        // reset this
        $scope.parsedApiFor = undefined;

        // reset flags
        $scope.isGuestReport = false;
        $scope.isLargeReport = false;
        $scope.isLogReport = false;
        $scope.isTransactionReport = false;
        $scope.isDepositReport = false;
        $scope.isCondensedPrint = false;
        $scope.isBalanceReport = false;
        $scope.isDepositBalanceReport = false;
        $scope.isCancellationReport = false;
        $scope.isActionsManager = false;
        $scope.isArAgingReport = false;
        $scope.isVacantRoomsReport = false;
        $scope.isForecastGuestGroup = false;

        $scope.hasNoSorting = false;
        $scope.hasNoTotals = false;
        $scope.hasPagination = true;

        switch ($scope.chosenReport.title) {
            case reportNames['IN_HOUSE_GUEST']:
            case reportNames['DEPARTURE']:
            case reportNames['ARRIVAL']:
                $scope.hasNoTotals = true;
                $scope.isGuestReport = true;
                break;

            case reportNames['EARLY_CHECKIN']:
                $scope.isGuestReport = true;
                break;

            case reportNames['CANCELLATION_NO_SHOW']:
                $scope.hasNoTotals = true;
                $scope.isGuestReport = true;
                $scope.isCancellationReport = true;
                $scope.hasNoSorting = true;
                break;

            case reportNames['LOGIN_AND_OUT_ACTIVITY']:
                $scope.hasNoTotals = true;
                $scope.isGuestReport = true;
                $scope.isLogReport = true;
                break;

            case reportNames['RESERVATIONS_BY_USER']:
                $scope.hasNoTotals = true;
                $scope.isGuestReport = true;
                break;

            case reportNames['LATE_CHECK_OUT']:
                $scope.hasNoTotals = true;
                break;

            case reportNames['CHECK_IN_CHECK_OUT']:
                if ($scope.chosenReport.chosenCico === 'IN' || $scope.chosenReport.chosenCico === 'OUT') {
                    $scope.hasNoTotals = true;
                }
                break;

            case reportNames['EMAIL_CHECKIN_SUMMARY']:
                $scope.hasNoTotals = true;
                break;

            case reportNames['WEB_CHECK_IN_CONVERSION']:
            case reportNames['WEB_CHECK_OUT_CONVERSION']:
            case reportNames['MARKET_SEGMENT_STAT_REPORT']:
                $scope.isLargeReport = true;
                break;

            case reportNames['BOOKING_SOURCE_MARKET_REPORT']:
                $scope.hasPagination = false;
                break;

            case reportNames['DAILY_TRANSACTIONS']:
            case reportNames['DAILY_PAYMENTS']:
                $scope.hasNoTotals = true;
                $scope.isTransactionReport = true;
                break;

            case reportNames['DEPOSIT_REPORT']:
            case reportNames['RATE_ADJUSTMENTS_REPORT']:
                $scope.hasNoTotals = true;
                $scope.isDepositReport = true;
                break;

            case reportNames['GROUP_PICKUP_REPORT']:
                $scope.hasNoTotals = true;
                $scope.isDepositReport = true;
                $scope.isCondensedPrint = true;
                break;

            case reportNames['GROUP_DEPOSIT_REPORT']:
                $scope.isDepositReport = true;
                break;

            case reportNames['AR_SUMMARY_REPORT']:
                $scope.hasNoTotals = false;
                $scope.isBalanceReport = true;
                break;

            case reportNames['GUEST_BALANCE_REPORT']:
                $scope.hasNoTotals = false;
                $scope.isBalanceReport = true;
                break;

            case reportNames['DEPOSIT_SUMMARY']:
                $scope.hasNoTotals = true;
                $scope.isDepositBalanceReport = true;
                $scope.isBalanceReport = true;
                break;

            case reportNames['FINANCIAL_TRANSACTION_REVENUE_REPORT']:
            case reportNames['FINANCIAL_TRANSACTION_PAYMENT_REPORT']:
            case reportNames['FINANCIAL_TRANSACTION_SUMMARY_REPORT']:
            case reportNames['FINANCIAL_TRANSACTIONS_ADJUSTMENT_REPORT']:
                $scope.hasPagination = false;
                break;

            case reportNames['MOBILE_CHECKIN_NOW']:
                $scope.hasReportTotals = true;
                $scope.hasNoResults = false;
                $scope.hasNoTotals = false;
                break;
            case reportNames['MOBILE_CHECKIN']:
                $scope.hasReportTotals = true;
                $scope.hasNoResults = false;
                $scope.hasNoTotals = false;
                break;

            case reportNames['ROOM_UPSELL']:
                $scope.hasReportTotals = true;
                $scope.hasNoResults = false;
                $scope.hasNoTotals = false;
                break;
            case reportNames['ACTIONS_MANAGER']:
                $scope.isActionsManager = true;
                break;
            case reportNames['A/R_AGING']:
                $scope.hasNoTotals = false;
                $scope.isBalanceReport = true;
                $scope.isArAgingReport = true;
                break;
            case reportNames['FOLIO_TAX_REPORT']:
                $scope.hasNoTotals = false;
                $scope.isFolioTaxReport = true;
                break;
            case reportNames['FORECAST_GUEST_GROUPS']:
                $scope.isForecastGuestGroup = true;
                break;
            default:
                break;
        }

        // TODO: 49259 Move this to a constant and set ColSpan values from the provider
        // hack to set the colspan for reports details tfoot
        switch ($scope.chosenReport.title) {
            case reportNames['CHECK_IN_CHECK_OUT']:
                if ($scope.chosenReport.chosenCico === 'BOTH') {
                    $scope.leftColSpan = 6;
                    $scope.rightColSpan = 5;
                } else {
                    $scope.leftColSpan = 4;
                    $scope.rightColSpan = 5;
                }
                break;

            case reportNames['EMAIL_CHECKIN_SUMMARY']:
                $scope.leftColSpan = 4;
                $scope.rightColSpan = 5;
                break;

            case reportNames['UPSELL']:
                $scope.leftColSpan = 6;
                $scope.rightColSpan = 6;
                break;

            case reportNames['LOGIN_AND_OUT_ACTIVITY']:
                $scope.leftColSpan = 2;
                $scope.rightColSpan = 3;
                break;

            case reportNames['DEPARTURE']:
                $scope.leftColSpan = 3;
                $scope.rightColSpan = 3;
                break;

            case reportNames['ARRIVAL']:
            case reportNames['IN_HOUSE_GUEST']:
            case reportNames['DEPOSIT_REPORT']:
            case reportNames['RESERVATIONS_BY_USER']:
                $scope.leftColSpan = 3;
                $scope.rightColSpan = 3;
                break;
            case reportNames['ZEST_CAMPAIGN_REPORT']:
            case reportNames['ADDON_FORECAST']:
                $scope.leftColSpan = 3;
                $scope.rightColSpan = 4;
                break;

            case reportNames['CANCELLATION_NO_SHOW']:
                $scope.leftColSpan = 3;
                $scope.rightColSpan = 3;
                break;

            case reportNames['DAILY_TRANSACTIONS']:
            case reportNames['DAILY_PAYMENTS']:
                $scope.leftColSpan = 5;
                $scope.rightColSpan = 5;
                break;

            case reportNames['WEB_CHECK_IN_CONVERSION']:
            case reportNames['WEB_CHECK_OUT_CONVERSION']:
            case reportNames['WEB_CHECK_IN_CONV_BY_DAY']:
                $scope.leftColSpan = 8;
                $scope.rightColSpan = 8;
                break;

            case reportNames['ROOMS_QUEUED']:
                $scope.leftColSpan = 3;
                $scope.rightColSpan = 3;
                break;

            case reportNames['FORECAST_BY_DATE']:
                $scope.leftColSpan = 8;
                $scope.rightColSpan = 4;
                break;

            case reportNames['FORECAST_GUEST_GROUPS']:
                $scope.leftColSpan = 9;
                $scope.rightColSpan = 5;
                break;

            case reportNames['MARKET_SEGMENT_STAT_REPORT']:
                $scope.leftColSpan = 8;
                $scope.rightColSpan = 8;
                break;

            case reportNames['COMPARISION_BY_DATE']:
                $scope.leftColSpan = 4;
                $scope.rightColSpan = 4;
                break;

            case reportNames['RATE_ADJUSTMENTS_REPORT']:
                $scope.leftColSpan = 3;
                $scope.rightColSpan = 4;
                break;

            case reportNames['GROUP_PICKUP_REPORT']:
                $scope.leftColSpan = 6;
                $scope.rightColSpan = 3;
                break;

            case reportNames['GROUP_DEPOSIT_REPORT']:
                $scope.leftColSpan = 3;
                $scope.rightColSpan = 3;
                break;

            case reportNames['AR_SUMMARY_REPORT']:
                $scope.leftColSpan = 2;
                $scope.rightColSpan = 3;
                break;

            case reportNames['GUEST_BALANCE_REPORT']:
                $scope.leftColSpan = 2;
                $scope.rightColSpan = 3;
                break;

            case reportNames['COMPANY_TA_TOP_PRODUCERS']:
                $scope.leftColSpan = 4;
                $scope.rightColSpan = 6;
                break;

            case reportNames['FINANCIAL_TRANSACTIONS_ADJUSTMENT_REPORT']:
                $scope.leftColSpan = 5;
                $scope.rightColSpan = 5;
                break;

            case reportNames['CREDIT_CHECK_REPORT']:
                $scope.leftColSpan = 5;
                $scope.rightColSpan = 2;
                break;

            case reportNames['DEPOSIT_SUMMARY']:
                $scope.leftColSpan = 3;
                $scope.rightColSpan = 3;
                break;

            case reportNames['ROOM_UPSELL']:
            case reportNames['MOBILE_CHECKIN']:
            case reportNames['MOBILE_CHECKIN_NOW']:
                $scope.leftColSpan = 3;
                $scope.rightColSpan = 4;
                break;

            case reportNames['ROOMS_OOO_OOS']:
                $scope.leftColSpan = 3;
                $scope.rightColSpan = 4;
                break;

            case reportNames['COMPLIMENTARY_ROOM_REPORT']:
                $scope.leftColSpan = 5;
                $scope.rightColSpan = 3;
                break;

            case reportNames['TAX_EXEMPT']:
                $scope.leftColSpan = 5;
                $scope.rightColSpan = 3;
                break;

            case reportNames['ACTIONS_MANAGER']:
                $scope.leftColSpan = 2;
                $scope.rightColSpan = 4;
                break;

            default:
                $scope.leftColSpan = 2;
                $scope.rightColSpan = 2;
                break;
        }

        // modify the summary count for certain reports as per the report totals
        // these are done for old reports as for old reports 'totals' is what we
        // today know as 'summaryCounts'. So we are gonna map 'totals' into 'summaryCounts'
        // for the following reports
        switch ($scope.chosenReport.title) {
            case reportNames['CHECK_IN_CHECK_OUT']:
                if ('Total Check Ins' == totals[0]['label']) {
                    if (totals.length == 10) {
                        $scope.$parent.summaryCounts = {
                            'has_both': true,
                            'check_ins': totals[0]['value'],
                            'ins_via_rover': totals[1]['value'],
                            'ins_via_web': totals[2]['value'],
                            'ins_via_zest': totals[3]['value'],
                            'ins_via_kiosk': totals[4]['value'],
                            'check_outs': totals[5]['value'],
                            'outs_via_rover': totals[6]['value'],
                            'outs_via_web': totals[7]['value'],
                            'outs_via_zest': totals[8]['value'],
                            'outs_via_kiosk': totals[9]['value']
                        };
                    } else {
                        $scope.$parent.summaryCounts = {
                            'has_in': true,
                            'check_ins': totals[0]['value'],
                            'ins_via_rover': totals[1]['value'],
                            'ins_via_web': totals[2]['value'],
                            'ins_via_zest': totals[3]['value'],
                            'ins_via_kiosk': totals[4]['value']
                        };
                    }
                } else if ('Total Check Outs' == totals[0]['label']) {
                    $scope.$parent.summaryCounts = {
                        'has_out': true,
                        'check_outs': totals[0]['value'],
                        'outs_via_rover': totals[1]['value'],
                        'outs_via_web': totals[2]['value'],
                        'outs_via_zest': totals[3]['value'],
                        'outs_via_kiosk': totals[4]['value']
                    };
                }
                break;

            case reportNames['EMAIL_CHECKIN_SUMMARY']:
                $scope.$parent.summaryCounts = totals;
                break;

            case reportNames['UPSELL']:
                $scope.$parent.summaryCounts = {
                    'rooms_upsold': totals[0]['value'],
                    'upsell_revenue': totals[1]['value'],
                    'rover_revenue': totals[2]['value'],
                    'zest_app_revenue': totals[3]['value'],
                    'zest_station_revenue': totals[4]['value'],
                    'zest_web_revenue': totals[5]['value']
                };
                break;

            case reportNames['WEB_CHECK_IN_CONVERSION']:
                $scope.$parent.summaryCounts = {
                    'emails_sent': totals[0]['value'],
                    'up_sell_conv': totals[1]['value'],
                    'revenue': totals[2]['value'],
                    'conversion': totals[4]['value'],
                    'total_checkin': totals[3]['value']
                };
                break;

            case reportNames['WEB_CHECK_OUT_CONVERSION']:
                $scope.$parent.summaryCounts = {
                    'emails_sent': totals[0]['value'],
                    'late_checkout_conv': totals[1]['value'],
                    'revenue': totals[2]['value'],
                    'conversion': totals[4]['value'],
                    'total_checkout': totals[3]['value']
                };
                break;

            case reportNames['WEB_CHECK_IN_CONV_BY_DAY']:
                $scope.$parent.summaryCounts = {
                    'emails_sent': totals[0]['value'],
                    'up_sell_conv': totals[1]['value'],
                    'revenue': totals[2]['value'],
                    'conversion': totals[4]['value'],
                    'total_checkin': totals[3]['value']
                };
                break;

            case reportNames['LATE_CHECK_OUT']:
                $scope.$parent.summaryCounts = {
                    'rooms': totals[0]['value'],
                    'revenue': totals[1]['value']
                };
                break;
            default:
            // no op
        }

        // change date format for all
        for (var i = 0, j = results.length; i < j; i++) {
            results[i][0] = $filter('date')(results[i][0], $rootScope.dateFormat);

            if ($scope.chosenReport.title === reportNames['LATE_CHECK_OUT']) {

                // hack to add curency ($) symbol in front of values
                results[i][results[i].length - 1] = $rootScope.currencySymbol + results[i][results[i].length - 1];

                // hack to append ':00 PM' to time
                // thus makin the value in template 'X:00 PM'
                results[i][results[i].length - 2] += ':00 PM';
            }
        }

        // hack to edit the title 'LATE CHECK OUT TIME' to 'SELECTED LATE CHECK OUT TIME'
        // notice the text case, they are as per api response and ui
        if ($scope.chosenReport.title === reportNames['LATE_CHECK_OUT']) {
            for (var i = 0, j = headers.length; i < j; i++) {
                if (headers[i] === 'Late Check Out Time') {
                    headers[i] = 'Selected Late Check Out Time';
                    break;
                }
            }
        }

        // For addon Upsell, we don't have to show Revenue, But as we are using common methods to retrieve data
        // revenue details are also returned from API. We have to filter out revenue details for this report
        if ($scope.chosenReport.title === reportNames['ADDON_UPSELLS']) {
            // remove Revenue from header
            headers.splice(_.indexOf(headers, function () {
                return value === 'Revenue';
            }), 1);
            // remove values corresponding to revenue in each row (will be the last element in each row)
            _.each(results, function (result) {
                result.pop();
            });
            // remove Revenue from the totals row
            $scope.$parent.resultsTotalRow.splice(_.indexOf($scope.$parent.resultsTotalRow, function () {
                return label === 'Revenue';
            }), 1);
        }

        // new more detailed reports
        $scope.parsedApiFor = $scope.chosenReport.title;

        // send the recived data to the API parser module
        // with additional user selected options
        // the API parser will look throught the report name
        // to make sure API that doesnt requires any parsing will be returned with any parse
        var checkGeneralOptions = function () {
            var retObj = {
                include_actions: false,
                include_guest_notes: false,
                include_reservation_notes: false,
                show_guests: false,
                include_cancelled: false,
                show_rate_adjustments_only: false
            };

            var isBackgroundReportsEnabled = $rootScope.isBackgroundReportsEnabled,
                appliedFilters = $scope.chosenReport.usedFilters;

            if ($scope.chosenReport.hasGeneralOptions) {
                _.each($scope.chosenReport.hasGeneralOptions.data, function (each) {
                    if (each.paramKey === 'include_actions') {
                        if (isBackgroundReportsEnabled && !!appliedFilters.include_actions || each.selected) {
                            retObj.include_actions = true;
                        }
                    }
                    if (each.paramKey === 'include_guest_notes') {
                        if (isBackgroundReportsEnabled && !!appliedFilters.include_guest_notes || each.selected) {
                            retObj.include_guest_notes = true;
                        }
                    }
                    if (each.paramKey === 'include_reservation_notes') {
                        if (isBackgroundReportsEnabled && !!appliedFilters.include_reservation_notes || each.selected) {
                            retObj.include_reservation_notes = true;
                        }
                    }
                    if (each.paramKey === 'show_guests') {
                        if (isBackgroundReportsEnabled && !!appliedFilters.show_guests || each.selected) {
                            retObj.show_guests = true;
                        }
                    }
                    if (each.paramKey === 'include_cancelled') {
                        if (isBackgroundReportsEnabled && !!appliedFilters.include_cancelled || each.selected) {
                            retObj.include_cancelled = true;
                        }
                    }
                    if (each.paramKey === 'show_rate_adjustments_only') {
                        if (isBackgroundReportsEnabled && !!appliedFilters.show_rate_adjustments_only || each.selected) {
                            retObj.show_rate_adjustments_only = true;
                        }
                    }
                });
            }

            return retObj;
        }();
        var parseAPIoptions = {
            'groupedByKey': $scope.$parent.reportGroupedBy,
            'checkAction': checkGeneralOptions.include_actions,
            'checkGuestNote': checkGeneralOptions.include_guest_notes,
            'checkReservationNote': checkGeneralOptions.include_reservation_notes,
            'checkNote': checkGeneralOptions.include_notes,
            'checkGuest': checkGeneralOptions.show_guests,
            'checkCancel': checkGeneralOptions.include_cancelled,
            'checkRateAdjust': checkGeneralOptions.show_rate_adjustments_only,
            'chosenSortBy': $scope.chosenReport.chosenSortBy
        };

        $scope.$parent.results = angular.copy(reportParser.parseAPI($scope.parsedApiFor, $scope.$parent.results, parseAPIoptions, $scope.$parent.resultsTotalRow));
        // if there are any results
        $scope.hasNoResults = _.isEmpty($scope.$parent.results);
        $scope.showPrintOption = true;

        // a very different parent template / row template / content template for certain reports
        // otherwise they all will share the same template

        switch ($scope.parsedApiFor) {
            case reportNames['UPSELL']:
                $scope.hasReportTotals = true;
                $scope.showReportHeader = _.isEmpty($scope.$parent.results) ? false : true;
                $scope.detailsTemplateUrl = '/assets/partials/reports/upsellReport/rvUpsellReport.html';
                break;

            case reportNames['BOOKING_SOURCE_MARKET_REPORT']:
                $scope.hasReportTotals = false;
                $scope.showReportHeader = !_.isEmpty($scope.$parent.results.market) || !_.isEmpty($scope.$parent.results.source) ? true : false;
                $scope.detailsTemplateUrl = '/assets/partials/reports/bookingSourceMarketReport/rvBookingSourceMarketReport.html';
                break;

            case reportNames['OCCUPANCY_REVENUE_SUMMARY']:
                $scope.hasReportTotals = false;
                $scope.showReportHeader = _.isEmpty($scope.$parent.results) ? false : true;
                $scope.detailsTemplateUrl = '/assets/partials/reports/occupancyRevenueReport/rvOccupancyRevenueReport.html';
                break;

            case reportNames['RESERVATIONS_BY_USER']:
                if (!!$scope.$parent.reportGroupedBy) {
                    $scope.hasReportTotals = true;
                    $scope.showReportHeader = _.isEmpty($scope.$parent.results) ? false : true;
                    $scope.detailsTemplateUrl = '/assets/partials/reports/reservationByUserReport/rvReservationByUserReport.html';
                } else {
                    $scope.hasReportTotals = true;
                    $scope.showReportHeader = _.isEmpty($scope.$parent.results) ? false : true;
                    $scope.detailsTemplateUrl = '/assets/partials/reports/shared/rvCommonReportDetails.html';
                }
                break;
            case reportNames['DEPOSIT_SUMMARY']:
                $scope.hasReportTotals = true;
                $scope.showReportHeader = _.isEmpty($scope.$parent.results) ? false : true;
                $scope.detailsTemplateUrl = '/assets/partials/reports/depositBalanceSummary/rvGuestAndGroupDepositBalanceDetails.html';

                break;

            case reportNames['FORECAST_BY_DATE']:
                $scope.hasReportTotals = false;
                $scope.showReportHeader = true;
                $scope.detailsTemplateUrl = '/assets/partials/reports/forecastByDateReport/rvForecastByDateReport.html';
                break;

            case reportNames['FORECAST_GUEST_GROUPS']:
                $scope.hasReportTotals = false;
                $scope.showReportHeader = true;
                $scope.detailsTemplateUrl = '/assets/partials/reports/forecastGuestGroupReport/rvForecastGuestGroupReport.html';
                break;

            case reportNames['MARKET_SEGMENT_STAT_REPORT']:
                $scope.hasReportTotals = true;
                $scope.showReportHeader = _.isEmpty($scope.$parent.results) ? false : true;
                $scope.detailsTemplateUrl = '/assets/partials/reports/marketSegmentStatReport/rvMarketSegmentStatReport.html';
                break;

            case reportNames['COMPARISION_BY_DATE']:
                $scope.hasReportTotals = false;
                $scope.showReportHeader = true;
                $scope.showPrintOption = true;
                $scope.detailsTemplateUrl = '/assets/partials/reports/comparisonStatReport/rvComparisonStatReport.html';
                break;

            case reportNames['ADDON_FORECAST']:
                $scope.hasReportTotals = false;
                $scope.showReportHeader = true;
                if ('ADDON' == $scope.chosenReport.chosenGroupBy) {
                    $scope.detailsTemplateUrl = '/assets/partials/reports/addonForecastReport/rvAddonForecastReportByAddon.html';
                } else {
                    $scope.detailsTemplateUrl = '/assets/partials/reports/addonForecastReport/rvAddonForecastReportByDate.html';
                }
                break;

            case reportNames['ALLOWANCE_FORECAST']:
                $scope.hasReportTotals = true;
                $scope.hasNoResults = false;
                $scope.showReportHeader = true;
                if ('DATE' == $scope.chosenReport.chosenGroupBy) {
                    $scope.detailsTemplateUrl = '/assets/partials/reports/allowanceForecastReport/rvAllowanceForecastReportByDate.html';
                } else {
                    $scope.detailsTemplateUrl = '/assets/partials/reports/allowanceForecastReport/rvAllowanceForecastReportByAllowance.html';
                }
                break;

            case reportNames['DAILY_PRODUCTION_ROOM_TYPE']:
                $scope.hasReportTotals = true;
                $scope.showReportHeader = true;
                $scope.detailsTemplateUrl = '/assets/partials/reports/dailyProduction/rvDailyProductionRoomTypeReport.html';
                break;

            case reportNames['DAILY_PRODUCTION_DEMO']:
                $scope.hasReportTotals = true;
                $scope.showReportHeader = true;
                $scope.detailsTemplateUrl = '/assets/partials/reports/dailyProduction/rvDailyProductionDemographics.html';
                break;

            case reportNames['DAILY_PRODUCTION_RATE']:
                $scope.hasReportTotals = true;
                $scope.showReportHeader = true;
                $scope.detailsTemplateUrl = '/assets/partials/reports/dailyProduction/rvDailyProductionRateReport.html';
                break;

            case reportNames['COMPANY_TA_TOP_PRODUCERS']:
                $scope.hasReportTotals = true;
                $scope.showReportHeader = true;
                $scope.detailsTemplateUrl = '/assets/partials/reports/compayTaTopProducers/rvCompayTaTopProducers.html';
                break;

            case reportNames['FINANCIAL_TRANSACTION_SUMMARY_REPORT']:
                $scope.hasReportTotals = true;
                $scope.showReportHeader = true;
                $scope.showPrintOption = true;
                $scope.detailsTemplateUrl = '/assets/partials/reports/financialTransactionsSummaryReport/reportDetails.html';
                break;

            case reportNames['FINANCIAL_TRANSACTIONS_ADJUSTMENT_REPORT']:
                $scope.hasReportTotals = true;
                $scope.showReportHeader = true;
                $scope.detailsTemplateUrl = '/assets/partials/reports/financialTransactionsAdjustmentReport/reportMain.html';
                break;

            case reportNames['FINANCIAL_TRANSACTION_REVENUE_REPORT']:
                $scope.hasReportTotals = true;
                $scope.showReportHeader = true;
                $scope.showPrintOption = true;
                $scope.detailsTemplateUrl = '/assets/partials/reports/financialTransactionRevenueReport/reportDetails.html';
                break;

            case reportNames['FINANCIAL_TRANSACTION_PAYMENT_REPORT']:
                $scope.hasReportTotals = true;
                $scope.showReportHeader = true;
                $scope.showPrintOption = true;
                $scope.detailsTemplateUrl = '/assets/partials/reports/financialTransactionsPaymentReport/reportDetails.html';
                break;

            case reportNames['CREDIT_CHECK_REPORT']:
                $scope.hasReportTotals = true;
                $scope.showReportHeader = true;
                $scope.detailsTemplateUrl = '/assets/partials/reports/creditCheckReport/rvCreditCheckReport.html';
                break;

            case reportNames['ROOMS_OOO_OOS']:
                $scope.hasReportTotals = true;
                $scope.showReportHeader = true;
                $scope.detailsTemplateUrl = '/assets/partials/reports/roomOooOosReport/rvRoomOooOosReport.html';
                break;

            case reportNames['BUSINESS_ON_BOOKS']:
                $scope.showReportHeader = true;
                $scope.detailsTemplateUrl = '/assets/partials/reports/businessOnBooks/rvBusinessOnBooksReport.html';
                break;

            case reportNames['TRAVEL_AGENT_COMMISSIONS']:
                $scope.hasReportTotals = true;
                $scope.showReportHeader = true;
                $scope.showPrintOption = true;
                $scope.detailsTemplateUrl = '/assets/partials/reports/travelAgentCommission/rvTravelAgentCommissionReportRow.html';
                break;

            case reportNames['COMPLIMENTARY_ROOM_REPORT']:

                $scope.hasReportTotals = true;
                $scope.showReportHeader = true;
                $scope.detailsTemplateUrl = '/assets/partials/reports/complimentaryRoomReport/rvComplimentaryRoomReport.html';

                break;

            case reportNames['GROUP_ROOMS_REPORT']:
                $scope.showReportHeader = true;
                $scope.detailsTemplateUrl = '/assets/partials/reports/groupRoomsReport/rvGroupRoomsReport.html';
                break;

            case reportNames['YEARLY_TAX']:
                $scope.hasReportTotals = true;
                $scope.showReportHeader = true;
                $scope.detailsTemplateUrl = '/assets/partials/reports/yearlyVat/yearlyVatReportDetails.html';
                break;

            case reportNames['TAX_EXEMPT']:
                $scope.hasReportTotals = true;
                $scope.showReportHeader = true;
                $scope.showPrintOption = true;
                $scope.detailsTemplateUrl = '/assets/partials/reports/taxExempt/taxExemptReportDetails.html';
                break;

            case reportNames['FOLIO_TAX_REPORT']:
                $scope.hasReportTotals = true;
                $scope.showReportHeader = true;
                $scope.showPrintOption = true;
                $scope.detailsTemplateUrl = '/assets/partials/reports/folioTax/folioTaxReportDetails.html';
                break;

            case reportNames['TAX_OUTPUT_REPORT']:
                $scope.hasReportTotals = true;
                $scope.showReportHeader = true;
                $scope.showPrintOption = true;
                $scope.detailsTemplateUrl = '/assets/partials/reports/taxOutput/rvTaxOutputReport.html';
                break;

            default:
                $scope.hasReportTotals = true;
                $scope.showReportHeader = _.isEmpty($scope.$parent.results) ? false : true;
                $scope.detailsTemplateUrl = '/assets/partials/reports/shared/rvCommonReportDetails.html';
                break;
        }
    };

    /*
     * @param arrayData - data
     * isAccountCollapsed - param used to check data in collapsed state or not
     */
    var setVatReportCollapseData = function setVatReportCollapseData(arrayData) {
        _.each(arrayData, function (item) {
            item.isAccountCollapsed = false;
        });
        return arrayData;
    };

    $scope.parsedApiTemplate = function () {
        var template = '';

        switch ($scope.parsedApiFor) {

            // general reports rows
            case reportNames['AR_SUMMARY_REPORT']:
                template = '/assets/partials/reports/accountsReceivablesSummary/rvAccountsReceivablesSummaryRow.html';
                break;
            case reportNames['ARRIVAL']:
                template = '/assets/partials/reports/generalReportRows/rvArrivalReportRow.html';
                break;
            case reportNames['CANCELLATION_NO_SHOW']:
                template = '/assets/partials/reports/generalReportRows/rvCancellationReportRow.html';
                break;
            case reportNames['DAILY_TRANSACTIONS']:
            case reportNames['DAILY_PAYMENTS']:
                template = '/assets/partials/reports/generalReportRows/rvDailyTransPaymentsReportRow.html';
                break;
            case reportNames['DEPARTURE']:
                template = '/assets/partials/reports/generalReportRows/rvDepartureReportRow.html';
                break;
            case reportNames['DEPOSIT_REPORT']:
                template = '/assets/partials/reports/generalReportRows/rvDepositReportRow.html';
                break;
            case reportNames['GROUP_DEPOSIT_REPORT']:
                template = '/assets/partials/reports/generalReportRows/rvGroupDepositReportRow.html';
                break;
            case reportNames['IN_HOUSE_GUEST']:
                template = '/assets/partials/reports/generalReportRows/rvInHouseReportRow.html';
                break;
            case reportNames['RATE_ADJUSTMENTS_REPORT']:
                template = '/assets/partials/reports/generalReportRows/rvRateAdjustmentReportRow.html';
                break;
            case reportNames['ROOMS_QUEUED']:
                template = '/assets/partials/reports/generalReportRows/rvRoomQueuedReportRow.html';
                break;
            case reportNames['LOGIN_AND_OUT_ACTIVITY']:
                template = '/assets/partials/reports/generalReportRows/rvLoginActivityReportRow.html';
                break;
            case reportNames['GROUP_PICKUP_REPORT']:
                template = '/assets/partials/reports/generalReportRows/rvGroupPickupReportRow.html';
                break;

            case reportNames['GUEST_BALANCE_REPORT']:
                template = '/assets/partials/reports/guestBalanceReport/rvGuestBalanceReportRow.html';
                break;

            // RESERVATIONS_BY_USER report row
            case reportNames['RESERVATIONS_BY_USER']:
                template = '/assets/partials/reports/reservationByUserReport/rvReservationByUserReportRow.html';
                break;

            // FORECAST_BY_DATE report row
            case reportNames['FORECAST_BY_DATE']:
                template = '/assets/partials/reports/forecastByDateReport/rvForecastByDateReportRow.html';
                break;

            // FORECAST_GUEST_GROUPS report row
            case reportNames['FORECAST_GUEST_GROUPS']:
                template = '/assets/partials/reports/forecastGuestGroupReport/rvForecastGuestGroupReportRow.html';
                break;

            // MARKET_SEGMENT_STAT_REPORT report row
            case reportNames['MARKET_SEGMENT_STAT_REPORT']:
                template = '/assets/partials/reports/marketSegmentStatReport/rvMarketSegmentStatReportRow.html';
                break;

            // COMPANY_TA_TOP_PRODUCERS report row
            case reportNames['COMPANY_TA_TOP_PRODUCERS']:
                template = '/assets/partials/reports/compayTaTopProducers/rvCompayTaTopProducersRow.html';
                break;

            // FINANCIAL_TRANSACTIONS_ADJUSTMENT_REPORT report row
            case reportNames['FINANCIAL_TRANSACTIONS_ADJUSTMENT_REPORT']:
                template = '/assets/partials/reports/financialTransactionsAdjustmentReport/reportRow.html';
                break;

            case reportNames['ACTIONS_MANAGER']:
                template = '/assets/partials/reports/actionManager/reportRow.html';
                break;

            case reportNames['A/R_AGING']:
                template = '/assets/partials/reports/aging/reportRow.html';
                break;

            case reportNames['VACANT_ROOMS_REPORT']:
                template = '/assets/partials/reports/vacantRoomsReport/rvVacantRoomsReportRow.html';
                break;

            case reportNames['COMPLIMENTARY_ROOM_REPORT']:
                template = '/assets/partials/reports/complimentaryRoomReport/rvComplimentaryRoomReport.html';
                break;

            case reportNames['TAX_EXEMPT']:
                template = '/assets/partials/reports/taxExempt/rvComplimentaryRoomReport.html';
                break;

            case reportNames['GUESTS_INHOUSE_BY_NATIONALITY']:
                template = '/assets/partials/reports/guestInhouseByNationalityReport/reportRow.html';
                break;

            // Default report row
            default:
                template = '/assets/partials/reports/shared/rvCommonReportRow.html';
                break;
        }

        return template;
    };

    // simple method to allow checking for report title from the template
    // by matching it against the report names constant
    $scope.isThisReport = function (name) {
        if ('string' == typeof name) {
            return $scope.parsedApiFor == reportNames[name];
        } else {
            return !!_.find(name, function (each) {
                return $scope.parsedApiFor == reportNames[each];
            });
        }
    };

    // we are gonna need to drop some pagination
    // this is done only once when the report details is loaded
    // and when user updated the filters
    var calPagination = function calPagination() {
        if (!$scope.hasPagination) {
            return;
        }

        // clear old results and update total counts
        $scope.netTotalCount = $scope.$parent.totalCount;

        if (angular.isArray($scope.$parent.results)) {
            $scope.uiTotalCount = $scope.$parent.results.length;
        } else if (angular.isObject($scope.$parent.results)) {
            $scope.uiTotalCount = 0;
            _.each($scope.$parent.results, function (item) {
                if (typeof item === 'array') {
                    $scope.uiTotalCount += item.length;
                }
            });
        }

        if ($scope.netTotalCount === 0 && $scope.uiTotalCount === 0) {
            $scope.disablePrevBtn = true;
            $scope.disableNextBtn = true;
        } else if ($_pageNo === 1) {
            $scope.resultFrom = 1;
            $scope.resultUpto = $scope.netTotalCount < $_resultsPerPage ? $scope.netTotalCount : $_resultsPerPage;
            $scope.disablePrevBtn = true;
            $scope.disableNextBtn = $scope.netTotalCount > $_resultsPerPage ? false : true;
        } else {
            $scope.resultFrom = $_resultsPerPage * ($_pageNo - 1) + 1;
            $scope.resultUpto = $scope.resultFrom + $_resultsPerPage - 1 < $scope.netTotalCount ? $scope.resultFrom + $_resultsPerPage - 1 : $scope.netTotalCount;
            $scope.disablePrevBtn = false;
            $scope.disableNextBtn = $scope.resultUpto === $scope.netTotalCount ? true : false;
        }
    };

    // hacks to track back the chosenCico & chosenUsers names
    // from their avaliable values
    var findBackNames = function findBackNames() {

        // keep track of the transcation type for UI
        if ($scope.chosenReport.chosenCico === 'BOTH') {
            $scope.transcationTypes = 'check In, Check Out';
        } else if ($scope.chosenReport.chosenCico === 'IN') {
            $scope.transcationTypes = 'check In';
        } else if ($scope.chosenReport.chosenCico === 'OUT') {
            $scope.transcationTypes = 'check OUT';
        }

        // keep track of the Users chosen for UI
        // if there is just one user
        if ($scope.chosenReport.chosenUsers) {
            var _userNames = [];

            _.each($scope.activeUserList, function (user) {
                var match = _.find($scope.chosenReport.chosenUsers, function (id) {
                    return id === user.id;
                });

                if (!!match) {
                    _userNames.push(user.full_name);
                }
            });

            $scope.userNames = _userNames.join(', ');
        }
    };

    // fetch next page on pagination change
    $scope.fetchNextPage = function (returnToPage) {
        // returning to the previous page before print
        if (!!returnToPage) {
            $_pageNo = returnToPage;
            $scope.genReport(false, $_pageNo);
        } else {
            if ($scope.disableNextBtn) {
                return;
            }

            $_pageNo++;
            $scope.genReport(false, $_pageNo);
        }
    };

    // fetch prev page on pagination change
    $scope.fetchPrevPage = function () {
        if ($scope.disablePrevBtn) {
            return;
        }

        $_pageNo--;
        $scope.genReport(false, $_pageNo);
    };

    // refetch the report while sorting with..
    // Note: we are resetting page to page #1
    $scope.sortResultBy = function (sortBy, report) {
        if (!sortBy) {
            return;
        }

        // if there a group by filter applied, reset it
        if (!!$scope.chosenReport.chosenGroupBy) {
            $scope.chosenReport.chosenGroupBy = 'BLANK';
        }

        // un-select sort dir of others
        _.each($scope.chosenReport.sortByOptions, function (item) {
            if (item && item.value !== sortBy.value) {
                item.sortDir = undefined;
            }
        });

        // select sort_dir for clicked item
        // **
        // $#@$@#$@# Super Creepy business logic forced to be here in UI :(
        if (report['title'] === reportNames['COMPANY_TA_TOP_PRODUCERS'] && sortBy['value'] === 'ROOM_NIGHTS') {
            sortBy.sortDir = sortBy.sortDir === undefined || sortBy.sortDir === true ? false : true;
        } else {
            sortBy.sortDir = sortBy.sortDir === undefined || sortBy.sortDir === false ? true : false;
        }

        $scope.chosenReport.chosenSortBy = sortBy.value;

        // reset the page
        $_pageNo = 1;

        var pageNo = 1;

        // CICO-39128 - Added to preserve the page no while sorting
        if ($scope.chosenReport.title === reportNames['COMPLIMENTARY_ROOM_REPORT']) {
            pageNo = $scope.currentPage;
        }

        // should-we-change-view, specify-page, per-page-value
        $scope.genReport(false, pageNo);
    };

    // refetch the reports with new filter values
    // Note: not resetting page to page #1
    $scope.fetchUpdatedReport = function () {
        // hide sidebar
        $scope.$parent.showSidebar = false;

        // reset the page
        $_pageNo = 1;

        // should-we-change-view, specify-page, per-page-value
        $scope.genReport(false);
    };

    // basically refetching reports but for 1000 results
    // Also if a specific report ctrl has created a pre-print
    // 'showModal' method to get some inputs from user before print
    // call the method here.
    // READ MORE: rvReportsMainCtrl:L#:61-75
    $scope.fetchFullReport = function () {
        var currentReport = reportsSrv.getSelectedReport();

        if ('function' == typeof $scope.printOptions.showModal) {
            $scope.printOptions.showModal();
        } else if (!$rootScope.isBackgroundReportsEnabled) {
            $_fetchFullReport();
        } else {
            $scope.printReport(currentReport, false);
        }
    };

    // when user press submit from pre-print modal, continue our calls to '$_fetchFullReport'
    // READ MORE: rvReportsMainCtrl:L#:61-75
    var prePrintDone = $rootScope.$on(reportMsgs['REPORT_PRE_PRINT_DONE'], $_fetchFullReport);

    $scope.$on('$destroy', prePrintDone);

    function $_fetchFullReport() {

        // since we are loading the entire report and show its print preview
        // we need to keep a back up of the original report with its pageNo
        $scope.returnToPage = $_pageNo;
        var perPageCount = 1000;

        if ($rootScope.isBackgroundReportsEnabled) {
            perPageCount = 99999;
        }

        // should-we-change-view, specify-page, per-page-value
        $scope.genReport(false, 1, perPageCount);
    }

    // Get print orientation for each report
    var getPrintOrientation = function getPrintOrientation() {
        var orientation = 'portrait';

        switch ($scope.chosenReport.title) {
            case reportNames['AR_SUMMARY_REPORT']:
            case reportNames['ARRIVAL']:
            case reportNames['IN_HOUSE_GUEST']:
            case reportNames['DEPARTURE']:
            case reportNames['DEPOSIT_REPORT']:
            case reportNames['GROUP_DEPOSIT_REPORT']:
            case reportNames['CANCELLATION_NO_SHOW']:
            case reportNames['WEB_CHECK_OUT_CONVERSION']:
            case reportNames['WEB_CHECK_IN_CONVERSION']:
            case reportNames['WEB_CHECK_IN_CONV_BY_DAY']:
            case reportNames['OCCUPANCY_REVENUE_SUMMARY']:
            case reportNames['DAILY_TRANSACTIONS']:
            case reportNames['DAILY_PAYMENTS']:
            case reportNames['FORECAST_BY_DATE']:
            case reportNames['FORECAST_GUEST_GROUPS']:
            case reportNames['GROUP_PICKUP_REPORT']:
            case reportNames['MARKET_SEGMENT_STAT_REPORT']:
            case reportNames['RATE_ADJUSTMENTS_REPORT']:
            case reportNames['DAILY_PRODUCTION_ROOM_TYPE']:
            case reportNames['GUEST_BALANCE_REPORT']:
            case reportNames['ADDON_FORECAST']:
            case reportNames['ALLOWANCE_FORECAST']:
            case reportNames['CREDIT_CHECK_REPORT']:
            case reportNames['DEPOSIT_SUMMARY']:
            case reportNames['FINANCIAL_TRANSACTIONS_ADJUSTMENT_REPORT']:
            case reportNames['A/R_AGING']:
            case reportNames['BUSINESS_ON_BOOKS']:
            case reportNames['COMPLIMENTARY_ROOM_REPORT']:
            case reportNames['GROUP_ROOMS_REPORT']:
            case reportNames['TRAVEL_AGENT_COMMISSIONS']:
            case reportNames['DAILY_PRODUCTION_RATE']:
            case reportNames['DAILY_PRODUCTION_DEMO']:
            case reportNames['FOLIO_TAX_REPORT']:
                orientation = 'landscape';
                break;

            default:
            // no op
        }

        return orientation;
    };

    // add the print orientation before printing
    // TODO: 49259 Move Print Orientation to a constant ---
    var addPrintOrientation = function addPrintOrientation() {
        var orientation = getPrintOrientation();

        $('head').append('<style id=\'print-orientation\'>@page { size: ' + orientation + '; }</style>');

        // hide #loader by adding '.ng-hide' class
        $('#loading').addClass('ng-hide');
    };

    // add the print orientation after printing
    var removePrintOrientation = function removePrintOrientation() {
        $('#print-orientation').remove();
    };

    // print the page
    var printReport = function printReport() {

        var reportName = $scope.chosenReport.title,
            isProductionReport = false;

        // add the orientation
        addPrintOrientation();

        // CICO-39558
        if ($scope.chosenReport.title === reportNames['TRAVEL_AGENT_COMMISSIONS']) {
            $scope.printTACommissionFlag.summary = true;
        }

        /**
         * CICO-32471: icons are background image they are loaded async after render
         * solving this issue by adding an img tag and waiting for it to load (< 100kb)
         * this is taken from  Groups->rooming list print.
         */
        var bg = $('#print-orientation').css('background-image'),
            src = bg.replace(/(^url\()|(\)$|[\"\'])/g, ''),
            img = $('<img>').attr('src', src);

        img.on('load', function () {
            // unbinding the events & removing the elements inorder to prevent memory leaks
            $(this).off('load');
            $(this).remove();

            var onPrintCompletion = function onPrintCompletion() {
                // CICO-65855 - Introduced this to prevent the user from doing other activities before the state is restored
                sntActivity.start('POST_PRINT_STATE_RESTORE');
                // in background we need to keep the report with its original state
                $timeout(function () {
                    // remove the orientation
                    removePrintOrientation();

                    // CICO-39558
                    if ($scope.chosenReport.title === reportNames['TRAVEL_AGENT_COMMISSIONS']) {
                        $scope.printTACommissionFlag.summary = false;
                    }

                    if ($scope.chosenReport.title === reportNames['YEARLY_TAX']) {
                        $scope.$broadcast('YEARLY_TAX_PRINT_COMPLETED');
                    }

                    // If a specific report ctrl has created a pre-print 'afterPrint' method
                    // to get clear/remove anything after print
                    // READ MORE: rvReportsMainCtrl:L#:61-75
                    if ('function' == typeof $scope.printOptions.afterPrint) {
                        $scope.printOptions.afterPrint();
                    }
                    sntActivity.stop('POST_PRINT_STATE_RESTORE');
                    if (reportsSrv.getPrintClickedState()) {
                        $scope.$emit('UPDATE_REPORT_HEADING', { heading: $filter('translate')('MENU_REPORTS_INBOX') });
                        reportsSrv.setPrintClicked(false);
                        $scope.viewStatus.showDetails = false;
                        if ($state.$current.name !== 'rover.reports.show' && reportsSrv.getChoosenReport()) {
                            reportsSrv.setChoosenReport({});
                        }
                        sntActivity.stop("PRINTING_FROM_REPORT_INBOX");
                    } else {
                        // load the report with the original page
                        $scope.fetchNextPage($scope.returnToPage);
                    }
                }, 2000);

                if (reportName === reportNames['DAILY_PRODUCTION_ROOM_TYPE'] || reportName === reportNames['DAILY_PRODUCTION_DEMO'] || reportName === reportNames['DAILY_PRODUCTION_RATE']) {

                    isProductionReport = true;
                }
                if ($scope.reportDatesInitialized && isProductionReport) {
                    $scope.showGeneratedReport();
                }
            };

            // this will show the popup with full report
            $timeout(function () {
                if (sntapp.cordovaLoaded) {
                    var mode = getPrintOrientation() === 'landscape' ? 'L' : 'P';

                    cordova.exec(onPrintCompletion, function () {
                        onPrintCompletion();
                    }, 'RVCardPlugin', 'printWebView', ['', '0', '', mode]);
                } else {
                    $window.print();
                    onPrintCompletion();
                }
            }, 1000);
        });
    };

    $scope.emailReport = function () {
        $log.warn('Email Report API yet to be completed/implemented/integrated');
    };

    $scope.saveFullReport = function () {
        $log.warn('Download Full Report API yet to be completed/implemented/integrated');
    };

    $scope.hasSubString = function (subString, string) {
        var string = string.toLowerCase(),
            subString = subString.toLowerCase();

        return string.indexOf(subString) > -1;
    };

    $scope.hasSort = function (index) {
        var s = $scope.chosenReport.sortByOptions || [];

        return !!s[index];
    };

    $scope.isAsc = function (index) {
        var s = $scope.chosenReport.sortByOptions || [];

        return !!s[index] && s[index]['sortDir'] === true;
    };

    $scope.isDesc = function (index) {
        var s = $scope.chosenReport.sortByOptions || [];

        return !!s[index] && s[index]['sortDir'] === false;
    };

    /**
     * function to get reservation class against reservation status
     * @param {String} [reservationStatus] [description]
     * @return {String} [class name]
     */
    $scope.getReservationClass = function (reservationStatus) {
        var class_ = '';

        switch (reservationStatus.toUpperCase()) {
            case 'RESERVED':
                class_ = 'arrival';
                break;

            case 'DUE IN':
                class_ = 'check-in';
                break;

            case 'CHECKEDIN':
                class_ = 'inhouse';
                break;

            case 'DUE OUT':
                class_ = 'check-out';
                break;

            case 'CHECKEDOUT':
                class_ = 'departed';
                break;

            case 'CANCELED':
                class_ = 'cancel';
                break;

            case 'NOSHOW':
            case 'NOSHOW_CURRENT':
                class_ = 'no-show';
                break;

            case 'IN HOUSE':
                class_ = 'inhouse';
                break;

            default:
                class_ = '';
                break;
        }
        return class_;
    };

    /**
     * to goto staycard
     * @param {Object} reservation
     * @return {undefined}
     */
    $scope.gotoStayCard = function (reservation) {
        $state.go('rover.reservation.staycard.reservationcard.reservationdetails', {
            'id': reservation.reservation_id,
            'confirmationId': reservation.confirm_no,
            'isrefresh': true
        });
    };

    /**
     * to goto account
     * @param {Object} account
     * @return {undefined}
     */
    $scope.gotoAccount = function (account) {
        $state.go('rover.accounts.config', {
            id: account.posting_account_id,
            activeTab: 'ACCOUNT'
        });
    };

    /**
     * Define navigation based on Guest / Account
     * @param {Object} data
     * @return {undefined}
     */
    $scope.gotoNavigation = function (data) {
        if (data.entity_type === 'Reservation') {
            // Navigate to Guest Account
            var reservation = {
                'reservation_id': data.entity_id,
                'confirm_no': data.number
            };

            $scope.gotoStayCard(reservation);
        } else if (data.entity_type === 'PostingAccount') {
            // Navigate to Posting Account
            var account = {
                'posting_account_id': data.entity_id
            };

            $scope.gotoAccount(account);
        }
    };

    var onReportSubmit = function onReportSubmit() {
        $_pageNo = 1;
        $scope.errorMessage = [];
        setScroller();
        afterFetch();
        findBackNames();
        calPagination();
        $scope.refreshScroll();
    };

    var onReportPageChange = function onReportPageChange() {
        $scope.errorMessage = [];
        afterFetch();
        calPagination();
        $scope.refreshScroll();
    };

    var reportSubmitted = $scope.$on(reportMsgs['REPORT_SUBMITED'], onReportSubmit);
    var reportPageChanged = $scope.$on(reportMsgs['REPORT_PAGE_CHANGED'], onReportPageChange);

    var reportUpdated = $scope.$on(reportMsgs['REPORT_UPDATED'], function () {
        $scope.errorMessage = [];
        /**/
        setScroller();
        afterFetch();
        findBackNames();
        calPagination();
        $scope.refreshScroll();
    });

    var reportPrinting = $scope.$on(reportMsgs['REPORT_PRINTING'], function () {
        $scope.errorMessage = [];
        /**/
        afterFetch();
        findBackNames();
        printReport();
    });

    var reportAPIfailed = $scope.$on(reportMsgs['REPORT_API_FAILED'], function () {
        $scope.errorMessage = $scope.$parent.errorMessage;
        /**/
        afterFetch();
        calPagination();
        $scope.refreshScroll();
    });

    var onPrintYearlyTax = $scope.$on("PRINT_SELECTED_REPORT", function () {
        printReport();
    });

    // removing event listners when scope is destroyed
    $scope.$on('$destroy', reportSubmitted);
    $scope.$on('$destroy', reportUpdated);
    $scope.$on('$destroy', reportPageChanged);
    $scope.$on('$destroy', reportPrinting);
    $scope.$on('$destroy', reportAPIfailed);
    $scope.$on('$destroy', onPrintYearlyTax);

    // Added for CICO-33172
    $scope.isRoomRevenueSelected = true;
    $scope.isBookingsSelected = true;

    /**
     * Toggle Revenue columns for market segment statistics report
     */
    $scope.toggleRevenue = function () {
        $scope.isRoomRevenueSelected = !$scope.isRoomRevenueSelected;
        reportsSrv.setReportRequestParam('showRoomRevenue', $scope.isRoomRevenueSelected);
        $scope.genReport(false);
    };

    /**
     * Toggle Bookings columns for market segment statistics report
     */
    $scope.toggleBookings = function () {
        $scope.isBookingsSelected = !$scope.isBookingsSelected;
    };

    // Check whether we need to show or not the totals
    $scope.showTotals = function () {
        return _.isArray($scope.resultsTotalRow) ? $scope.resultsTotalRow.length : $scope.resultsTotalRow;
    };

    // Checks whether new pagination should be used for the report
    $scope.shouldShowNewPagination = function () {
        return !!reportPaginationIds[$scope.chosenReport.title];
    };

    $scope.fetchFullYearlyTaxReport = function () {
        $scope.$broadcast("FETCH_FULL_YEARLY_TAX_REPORT");
    };

    /*
     * Method to get the reservations status
     */
    $scope.getReservationStatus = function (reservationStatus) {
        return getReservationStatusClass(reservationStatus);
    };

    var printReportFromInboxListner = $rootScope.$on('PRINT_INBOX_REPORT', function () {
        var currentReport = reportsSrv.getSelectedReport();

        $scope.reportDatesInitialized = false;
        $scope.printReport(currentReport, true);
    });

    // destroy listners
    $scope.$on('$destroy', printReportFromInboxListner);

    // Invokes actual print 
    var invokePrint = function invokePrint() {
        $timeout(function () {
            sntActivity.stop("PRINTING_FROM_REPORT_INBOX");
            if ('function' == typeof $scope.printOptions.showModal) {
                $scope.printOptions.showModal();
            } else {
                printReport();
            }
        }, 2000);
    };

    // Setting up the data for the report for printing
    var loadPrintView = function loadPrintView(reloadReportNeeded) {
        $scope.errorMessage = [];

        afterFetch();
        $scope.$emit('UPDATE_REPORT_HEADING', { heading: $scope.heading });
        findBackNames();
        if (reloadReportNeeded) {
            $rootScope.$broadcast('RELOAD_RESULTS');
        }
        invokePrint();
    };

    // Listener for the printing the report
    var printReportListener = $scope.$on('PRINT_REPORT', function (flagParam) {
        loadPrintView(flagParam.targetScope.reloadreportNeeded);
    });

    // Listener for printing the report having modal with options
    var printModalReportListener = $scope.$on('PRINT_MODAL_REPORT', function () {
        printReport();
    });

    /**
    * Print the report from the report inbox
    * @params Object report selected generated report
    * @return void
    */
    $scope.printReport = function (report, isFromReportInbox) {
        var reportName = report.name,
            fromDate;

        reportsSrv.setSelectedReport(report);
        $scope.currentReport = report;

        if (reportName === reportNames['DAILY_PRODUCTION_RATE']) {
            $scope.maxDateRange = 2;
        } else {
            $scope.maxDateRange = 1;
        }

        if (reportName === reportNames['DAILY_PRODUCTION_ROOM_TYPE'] || reportName === reportNames['DAILY_PRODUCTION_DEMO'] || reportName === reportNames['DAILY_PRODUCTION_RATE']) {

            $scope.fromDateOptions = angular.extend({}, datePickerCommon);
            $scope.untilDateOptions = angular.extend({}, datePickerCommon);

            $scope.fromDateOptions.minDate = $scope.currentReport.fromDate;
            $scope.fromDateOptions.maxDate = $scope.currentReport.toDate;

            // initialize until date base on the from date
            // CICO-33536 - fix for date format
            fromDate = $filter('date')($scope.currentReport.fromDate, $rootScope.dateFormat);

            $scope.currentReport.filterToDate = $_onSelect($scope.fromDateOptions.maxDate, 0);
            $scope.currentReport.filterFromDate = $_onSelect(fromDate, 0);

            // set min and max limits for until date
            $scope.untilDateOptions.minDate = $scope.currentReport.fromDate;
            $scope.untilDateOptions.maxDate = $scope.currentReport.toDate;

            ngDialog.open({
                template: '/assets/partials/reports/rvPrintReportSelectDatePopup.html',
                className: 'ngdialog-theme-default',
                scope: $scope
            });
        } else {
            setChoosenReport($scope.currentReport).then(function () {
                $_fetchFullReport();
            });
            if (isFromReportInbox) {
                reportsSrv.setPrintClicked(true);
            }
        }
    };

    // Perform the actual print
    $scope.continuePrint = function () {
        var mainCtrlScope = $scope.$parent,
            startDate = moment($scope.currentReport.filterFromDate, 'D/M/YYYY'),
            untilDate = moment($scope.currentReport.filterToDate, 'D/M/YYYY'),
            numberOfDays = untilDate.diff(startDate, 'days') + 1;

        $scope.errorMsg = '';

        if (numberOfDays > $scope.maxDateRange) {
            $scope.errorMsg = 'Allowed limit exceeded';
        } else {
            ngDialog.close();
            setChoosenReport($scope.currentReport).then(function () {
                mainCtrlScope.genReport(false, 1, 99999, true);
            });
            reportsSrv.setPrintClicked(true);
        }
    };

    // Adjust start date filter
    $scope.adjustStartDate = function () {
        if ($scope.currentReport.filterFromDate > $scope.currentReport.filterToDate) {
            $scope.currentReport.filterFromDate = $scope.currentReport.filterToDate;
        }
        $scope.errorMsg = '';
        $scope.errorMessage = [];
    };

    // Adjust to date filter
    $scope.adjustUntilDate = function () {
        if ($scope.currentReport.filterFromDate > $scope.currentReport.filterToDate) {
            $scope.currentReport.filterFromDate = $scope.currentReport.filterToDate;
        }
        $scope.errorMessage = [];
        $scope.errorMsg = '';
    };

    // Close the modal
    $scope.deleteModal = function () {
        $scope.errorMsg = '';
        ngDialog.close();
    };

    /**
     * Fill the necessary data from the report list into each of the generated report
     * @param {Array} generatedReportList array of generated reports
     * @param {Array} reportList - array of reports available
     * @return {Array} array of processed generated reports
     *
     */
    self.getFormatedGeneratedReports = function (generatedReportList, reportList) {
        return RVReportsInboxSrv.formatReportList(generatedReportList, reportList);
    };

    /**
     * Decides when to disable the report inbox item
     * @param {Object} report selected generated report
     * @return {Boolean} true/fals based on the status
     */
    $scope.shouldDisableInboxItem = function (report) {
        return report.message || report.status.value === 'IN_PROGRESS' || report.status.value === 'REQUESTED';
    };

    /*
    * handle Show Button action's in report inbox screen
    * @params Object Selected report object
    * @return none
    * */
    $scope.showGeneratedReport = function () {

        var mainCtrlScope = $scope.$parent,
            selectedreport = reportsSrv.getSelectedReport();

        delete selectedreport.filterFromDate;
        delete selectedreport.filterToDate;
        delete selectedreport.filters.from_date;
        delete selectedreport.filters.to_date;

        $timeout(function () {
            setChoosenReport(selectedreport).then(function () {
                mainCtrlScope.genReport(null, null, null, false);
            });
        }, 1000);
    };

    /*
    * store selected report to service,
    *  Case 1: For Inbox Report, append generatedReportId for choosenReport
    *  Case 2: For normal Report, use default id
    * @params Object Selected report object
    * @return none
    * */
    var setChoosenReport = function setChoosenReport(selectedreport) {
        var lastReportID = reportsSrv.getChoosenReport() ? reportsSrv.getChoosenReport().id : null,
            mainCtrlScope = $scope.$parent,
            choosenReport = _.find($scope.reportList, function (report) {
            return selectedreport.report_id === report.id;
        }),
            deffered = $q.defer(),
            reportName = selectedreport.name;

        choosenReport.usedFilters = selectedreport.filters;

        if (reportName === reportNames['DAILY_PRODUCTION_ROOM_TYPE'] || reportName === reportNames['DAILY_PRODUCTION_DEMO'] || reportName === reportNames['DAILY_PRODUCTION_RATE']) {
            choosenReport.usedFilters.to_date = $filter('date')(selectedreport.filterToDate, 'yyyy-MM-dd');
            choosenReport.usedFilters.from_date = $filter('date')(selectedreport.filterFromDate, 'yyyy-MM-dd');
        }

        // generatedReportId is required make API call
        choosenReport.generatedReportId = selectedreport.id;
        // if the two reports are not the same, just call
        // 'resetSelf' on printOption to clear out any method
        // that may have been created a specific report ctrl
        // READ MORE: rvReportsMainCtrl:L#:61-75
        if (lastReportID !== selectedreport.id) {
            mainCtrlScope.printOptions.resetSelf();
        }
        reportsSrv.processSelectedReport(choosenReport, reportsSrv.getCofigurationData());

        reportUtils.findFillFilters(choosenReport, $scope.$parent.reportList).then(function () {
            // Setting the raw data containing the filter state while running the report
            // These filter data is used in some of the reports controller 
            choosenReport = _.extend(JSON.parse(JSON.stringify(choosenReport)), selectedreport.rawData);
            choosenReport.appliedFilter = selectedreport.appliedFilter;

            reportsSrv.setChoosenReport(choosenReport);
            deffered.resolve();
        });

        return deffered.promise;
    };

    // Destroying the listeners
    $scope.$on('$destroy', printReportListener);
    $scope.$on('$destroy', printModalReportListener);

    (function () {

        var chosenDate = $state.params.date ? $state.params.date : $rootScope.serverDate;

        $scope.reportDatesInitialized = true;

        $scope.reportInboxData = {
            selectedReportAppliedFilters: {},
            generatedReports: [],
            filter: {
                selectedDate: $filter('date')(chosenDate, 'yyyy-MM-dd'),
                searchTerm: ''
            },
            isReportInboxOpen: false
        };
        // Don't need to set the back button during print from report inbox
        if (!reportsSrv.getPrintClickedState()) {
            var title = $filter('translate')('REPORTS');

            // Coming from report inbox
            if (reportsSrv.getChoosenReport().generatedReportId) {
                title = $filter('translate')('MENU_REPORTS_INBOX');
            }
            $rootScope.setPrevState = {
                title: title,
                callback: 'goBackReportList',
                name: 'rover.reports.dashboard',
                scope: $scope
            };
        }

        switch ($state.params.action) {
            case reportMsgs['REPORT_SUBMITED']:
                onReportSubmit();
                break;
            case reportMsgs['REPORT_PAGE_CHANGED']:
                onReportPageChange();
                break;
            case reportMsgs['REPORT_LOAD_LAST_REPORT']:
            default:
            // do nothing .. wait for event from rvReportsMainCtrl.js
        }
    })();
}]);