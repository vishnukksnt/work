'use strict';

sntRover.controller('RVReportListCrl', ['$scope', '$rootScope', '$filter', 'RVreportsSrv', 'RVreportsSubSrv', 'RVReportUtilsFac', 'RVReportMsgsConst', '$timeout', 'RVReportApplyIconClass', 'RVReportApplyFlags', 'RVReportSetupDates', 'RVReportNamesConst', '$state', function ($scope, $rootScope, $filter, reportsSrv, reportsSubSrv, reportUtils, reportMsgs, $timeout, applyIconClass, applyFlags, setupDates, reportNames, $state) {

    BaseCtrl.call(this, $scope);

    var REPORT_LIST_SCROLL = 'report-list-scroll',
        REPORT_FILTERS_SCROLL = 'report-filters-scroll';

    var reportAPIfailed = $scope.$on(reportMsgs['REPORT_API_FAILED'], function () {
        $scope.errorMessage = $scope.$parent.errorMessage;
    });

    $scope.refreshFilterScroll = function (scrollUp) {
        $scope.refreshScroller(REPORT_FILTERS_SCROLL);
        if (!!scrollUp && $scope.myScroll.hasOwnProperty(REPORT_FILTERS_SCROLL)) {
            $scope.myScroll[REPORT_FILTERS_SCROLL].scrollTo(0, 0, 100);
        }
    };

    $scope.refreshAllScroll = function () {
        $scope.refreshScroller(REPORT_LIST_SCROLL);
        if ($scope.myScroll.hasOwnProperty(REPORT_LIST_SCROLL)) {
            $scope.myScroll[REPORT_LIST_SCROLL].scrollTo(0, 0, 100);
        }
        $scope.refreshFilterScroll();
    };

    var setScroller = function setScroller() {
        var scrollerOptions = {
            tap: true,
            preventDefault: false
        };

        $scope.setScroller(REPORT_LIST_SCROLL, scrollerOptions);
        $scope.setScroller(REPORT_FILTERS_SCROLL, scrollerOptions);

        // NOTE Intentional timeout to give a moment for the scroll bar to be initialized!
        $timeout(function () {
            $scope.getScroller(REPORT_LIST_SCROLL).scrollToElement('.report-item.active', 500, 0, 0);
        }, 300);
    };

    /**
     *   Post processing fetched data to modify and add additional data
     *   @param {Array} - report: which points to $scope.$parent.report, see end of this function
     */
    var postProcess = function postProcess(report) {
        for (var i = 0, j = report.length; i < j; i++) {

            report[i].filteredOut = false;

            if (!$rootScope.isFolioTaxEnabled && report[i].method === "folio_tax_report" || report[i].method === 'room_status') {
                report[i].filteredOut = true;
            }

            // apply icon class based on the report name
            applyIconClass.init(report[i]);

            // apply certain flags based on the report name
            applyFlags.init(report[i]);

            // add users filter for needed reports
            // unfortunately this is not sent from server
            reportUtils.addIncludeUserFilter(report[i]);
            reportUtils.addIncludeOtherFilter(report[i]);

            setupDates.init(report[i]);
            _.each(report[i]['filters'], function (filter) {
                setupDates.execFilter(report[i], filter);
            });

            // to process the filters for this report
            reportUtils.processFilters(report[i], {
                'guaranteeTypes': $scope.$parent.guaranteeTypes,
                'markets': $scope.$parent.markets,
                'sources': $scope.$parent.sources,
                'origins': $scope.$parent.origins,
                'codeSettings': $scope.$parent.codeSettings,
                'holdStatus': $scope.$parent.holdStatus,
                'chargeNAddonGroups': $scope.$parent.chargeNAddonGroups,
                'chargeCodes': $scope.$parent.chargeCodes,
                'addons': $scope.$parent.addons,
                'reservationStatus': $scope.$parent.reservationStatus,
                'assigned_departments': $scope.$parent.assigned_departments,
                'activeUserList': $scope.$parent.activeUserList,
                'travel_agent_ids': $scope.$parent.travel_agents
            });

            // to reorder & map the sort_by to report details columns - for this report
            // re-order must be called before processing
            reportUtils.reOrderSortBy(report[i]);

            // to process the sort by for this report
            // processing must be called after re-odering
            reportUtils.processSortBy(report[i]);

            // to assign inital date values for this report
            // reportUtils.initDateValues( report[i] );

            // to process the group by for this report
            reportUtils.processGroupBy(report[i]);

            // CICO-8010: for Yotel make "date" default sort by filter
            if ($rootScope.currentHotelData === 'Yotel London Heathrow') {
                var sortDate = _.find(report[i].sortByOptions, function (item) {
                    return item.value === 'DATE';
                });

                if (sortDate) {
                    report[i].chosenSortBy = sortDate.value;
                }
            }
        }

        // SUPER forcing scroll refresh!
        // 2000 is the delay for slide anim, so firing again after 2010
        $timeout(function () {
            if (!$scope.$parent.uiChosenReport) {
                $scope.refreshAllScroll();
            }
        }, 2010);
    };

    // Clear the date restrictions
    var clearDateRestrictions = function clearDateRestrictions(report) {
        var datesUsedForCalendar = reportUtils.processDate();
        $scope.fromDateOptions.maxDate = $filter('date')($rootScope.businessDate, $rootScope.dateFormat);
        $scope.untilDateOptions.maxDate = $filter('date')($rootScope.businessDate, $rootScope.dateFormat);
        $scope.fromDateOptionsTillYesterday = function () {
            var currentDate = new tzIndependentDate($rootScope.businessDate);

            currentDate.setDate(currentDate.getDate() - 1);
            return $filter('date')(currentDate, $rootScope.dateFormat);
        }();
        $scope.untilDateOptionsTillYesterday.maxDate = function () {
            var currentDate = new tzIndependentDate($rootScope.businessDate);

            currentDate.setDate(currentDate.getDate() - 1);
            return $filter('date')(currentDate, $rootScope.dateFormat);
        }();
        $scope.fromDateOptionsForecast.minDate = function () {
            var currentDate = new tzIndependentDate($rootScope.businessDate);

            currentDate.setDate(currentDate.getDate() + 1);
            return $filter('date')(currentDate, $rootScope.dateFormat);
        }();
        $scope.fromDateOptionsTillBD.maxDate = new tzIndependentDate($rootScope.businessDate);
        $scope.untilDateOptionsTillBD.maxDate = new tzIndependentDate($rootScope.businessDate);
        $scope.fromDateOptionsSysLimit.maxDate = new Date();
        $scope.untilDateOptionsSysLimit.maxDate = new Date();
        $scope.toDateOptionsOneYearLimit.minDate = datesUsedForCalendar.monthStart;
        $scope.toDateOptionsOneYearLimit.maxDate = reportUtils.processDate(datesUsedForCalendar.monthStart).aYearAfter;
        $scope.toDateOptionsOneMonthLimit.minDate = new tzIndependentDate($rootScope.businessDate);
        $scope.toDateOptionsOneMonthLimit.maxDate = reportUtils.processDate($rootScope.businessDate).aMonthAfter;
        $scope.toDateOptionsSixMonthsLimit.minDate = new tzIndependentDate($rootScope.businessDate);
        $scope.toDateOptionsSixMonthsLimit.maxDate = reportUtils.processDate($rootScope.businessDate).sixMonthsAfter;
        $scope.toDateOptionsThirtyOneDaysLimit.minDate = new tzIndependentDate($rootScope.businessDate);
        $scope.toDateOptionsThirtyOneDaysLimit.maxDate = reportUtils.processDate($rootScope.businessDate).thirtyOneDaysAfter;

        // Initialize report default dates
        setupDates.init(report);
    };

    // show hide filter toggle
    $scope.toggleFilter = function (e, report) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        var callback = function callback() {
            // deselect all reports
            _.map($scope.$parent.reportList, function (report) {
                report.uiChosen = false;
            });

            report.uiChosen = true;
            $scope.$parent.uiChosenReport = report;
            $scope.selectedReport.report = report;

            // CICO-55843 Clear the date restrictions when each report is invoked
            // Otherwise restrictions for the previously chosen report will be there as the date
            // options are shared across the reports
            clearDateRestrictions(report);

            $scope.updateViewCol($scope.viewColsActions.TWO);

            $timeout(function () {
                $scope.refreshFilterScroll('scrollUp');
                $scope.$emit('hideLoader');
            }, 1000);
        };

        $scope.$emit('showLoader');
        if (report.allFiltersProcessed) {
            callback();
        } else {
            reportUtils.findFillFilters(report, $scope.$parent.reportList).then(callback);
        }
    };

    $scope.setnGenReport = function (report) {
        var lastReportID = reportsSrv.getChoosenReport().id,
            mainCtrlScope = $scope.$parent;

        // if the two reports are not the same, just call
        // 'resetSelf' on printOption to clear out any method
        // that may have been created a specific report ctrl
        // READ MORE: rvReportsMainCtrl:L#:61-75
        if (lastReportID != report.id) {
            mainCtrlScope.printOptions.resetSelf();
        }
        // CICO-51146 Clear the generatedreportid while submitting the report
        if (report.generatedReportId) {
            report.generatedReportId = null;
        }

        reportsSrv.setChoosenReport(report);
        mainCtrlScope.genReport();
    };

    /** event when backbutton clicked, fixing as part of CICO-31031 */
    var serveRefresh = $scope.$on(reportMsgs['REPORT_LIST_SCROLL_REFRESH'], function () {
        $timeout($scope.refreshScroller.bind($scope, REPORT_LIST_SCROLL), 200);
    });

    // removing event listners when scope is destroyed
    $scope.$on('$destroy', serveRefresh);
    $scope.$on('$destroy', reportAPIfailed);

    /**
     * init method
     */
    (function () {

        if ($state.params.refresh) {
            $scope.$parent.refreshReportList();
            postProcess($scope.$parent.reportList);
        }

        var chosenReport = _.find($scope.$parent.reportList, { uiChosen: true });

        if (chosenReport) {
            $scope.toggleFilter(null, chosenReport);
        }

        setScroller();
    })();
}]);