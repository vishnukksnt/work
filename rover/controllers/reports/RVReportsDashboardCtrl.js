'use strict';

angular.module('sntRover').controller('RVReportsDashboardCtrl', ['$scope', '$timeout', '$state', '$filter', '$rootScope', function ($scope, $timeout, $state, $filter, $rootScope) {

    var intialReportViewStore = {
        showingAllReport: false,
        showingScheduledReports: false,
        showingScheduleAReport: false,
        showingExportReports: false,
        showingExportAReport: false
    };

    /**
     * returns reference to the appropriate list bound in the selected view
     *
     * @return {Object} reference to the list bound in the selected view
     */
    var getSource = function getSource() {
        var source = $scope.reportList;

        if ($scope.reportViewStore.showingScheduledReports || $scope.reportViewStore.showingExportReports) {
            source = $scope.schedulesList;
        } else if ($scope.reportViewStore.showingScheduleAReport || $scope.reportViewStore.showingExportAReport) {
            source = $scope.schedulableReports;
        }

        return source;
    };

    /**/
    var setupScroll = function setupScroll() {
        $scope.setScroller('FULL_REPORT_SCROLL', {
            tap: true,
            preventDefault: false,
            scrollX: true,
            scrollY: false
        });
    };

    /**/
    var refreshScroll = function refreshScroll(noReset) {
        $scope.refreshScroller('FULL_REPORT_SCROLL');

        if (!noReset && $scope.$parent.myScroll && $scope.$parent.myScroll.hasOwnProperty('FULL_REPORT_SCROLL')) {
            $scope.$parent.myScroll['FULL_REPORT_SCROLL'].scrollTo(0, 0, 100);
        }
    };

    /**
     * Method to refresh the lists in the reports dash
     *
     * @returns {undefined}
     */
    var refreshScroller = function refreshScroller() {
        $timeout(function () {
            $scope.refreshScroller('report-list-scroll');
            $scope.myScroll['report-list-scroll'].refresh();

            if ($scope.myScroll && $scope.myScroll['report-filter-sidebar-scroll']) {
                $scope.myScroll['report-filter-sidebar-scroll'].refresh();
            }
        }, 200);
    };

    /**
     *
     * @param action
     * @returns {string}
     */
    var viewColsReducer = function viewColsReducer(action) {
        return angular.isDefined(action) ? 'cols-' + action : 'cols-' + $scope.reportViewActions.ONE;
    };

    $scope.viewColsActions = {
        ONE: 1,
        TWO: 2,
        THREE: 3,
        FOUR: 4
    };

    /**
     * Common action const names for keeping same standard
     */
    $scope.reportViewActions = {
        SHOW_ALL_REPORTS: 'SHOW_ALL_REPORTS',
        SHOW_SCHEDULED_REPORTS: 'SHOW_SCHEDULED_REPORTS',
        SHOW_SCHEDULE_A_REPORT: 'SHOW_SCHEDULE_A_REPORT',
        SHOW_EXPORT_REPORTS: 'SHOW_EXPORT_REPORTS',
        SHOW_EXPORT_A_REPORT: 'SHOW_EXPORT_A_REPORT'
    };

    /**
     * reduces the next state for $scope.reportViewStore based on incomming action
     *
     * @param  {String} action clicked menu action name
     * @return {Object}      the next state of $scope.reportViewStore
     */
    var reportViewReducer = function reportViewReducer(action) {
        switch (action) {
            case $scope.reportViewActions.SHOW_ALL_REPORT:
                return angular.extend({}, intialReportViewStore, { showingAllReport: true });

            case $scope.reportViewActions.SHOW_SCHEDULED_REPORTS:
                return angular.extend({}, intialReportViewStore, { showingScheduledReports: true });

            case $scope.reportViewActions.SHOW_SCHEDULE_A_REPORT:
                return angular.extend({}, intialReportViewStore, { showingScheduleAReport: true });

            case $scope.reportViewActions.SHOW_EXPORT_REPORTS:
                return angular.extend({}, intialReportViewStore, { showingExportReports: true });

            case $scope.reportViewActions.SHOW_EXPORT_A_REPORT:
                return angular.extend({}, intialReportViewStore, { showingExportAReport: true });

            default:
                return angular.extend({}, intialReportViewStore, { showingAllReport: true });
        }
    };

    /**
     * init reducing the next state of $scope.reportViewStore based on the action
     *
     * @param  {String} view name of the action
     */
    $scope.updateView = function (view) {
        $scope.reportViewStore = reportViewReducer(view);
    };

    $scope.filterByQuery = function () {
        var query = $scope.query.toLowerCase().trim(),
            source = getSource(),
            title,
            i,
            j;

        $scope.updateViewCol($scope.viewColsActions.ONE);

        if (query.length < 3) {
            for (i = 0, j = source.length; i < j; i++) {
                source[i].filteredOut = false;
                if (!$rootScope.isFolioTaxEnabled && source[i].method === "folio_tax_report") {
                    source[i].filteredOut = true;
                }
            }

            refreshScroller();
            return;
        }

        if ($scope.uiChosenReport) {
            $scope.uiChosenReport.uiChosen = false;
        }

        for (i = 0, j = source.length; i < j; i++) {
            title = $scope.reportViewStore.showingAllReport ? source[i].title.toLowerCase() : source[i].report.description.toLowerCase();

            source[i].filteredOut = title.indexOf(query) === -1;
            if (!$rootScope.isFolioTaxEnabled && source[i].method === "folio_tax_report" || source[i].method === 'room_status') {
                source[i].filteredOut = true;
            }
        }

        refreshScroller();
    };

    $scope.clearQuery = function () {
        $scope.query = '';

        getSource().map(function (item) {
            item.filteredOut = false;
        });

        refreshScroller();
    };

    $scope.reportMainMenuChange = function (nextMenu) {
        $scope.updateViewCol($scope.viewColsActions.ONE);
        $scope.updateView(nextMenu);
    };

    $scope.updateViewCol = function (cols, noReset) {
        $scope.viewColClassName = viewColsReducer(cols);
        refreshScroll(noReset);
    };

    $scope.$on('REPORT_LIST_FILTER_SCROLL_REFRESH', refreshScroller);

    /**
     * Set title and heading 
     */
    var setTitleAndHeading = function setTitleAndHeading() {
        var listTitle = $filter('translate')('MENU_NEW_REPORT');

        $scope.setTitle(listTitle);
        $scope.$parent.heading = listTitle;
    };

    // Create new report schedule
    $scope.createNewReportSchedule = function () {
        $scope.fromReportInbox = true;
        $scope.$broadcast("CREATE_NEW_SCHEDULE");
    };

    /**
     * Set the navigation to previous screen
     * 
     */
    var setPrevState = function setPrevState() {
        if ($rootScope.isBackgroundReportsEnabled) {
            $rootScope.setPrevState = {
                title: $filter('translate')('MENU_REPORTS_INBOX'),
                name: 'rover.reports.inbox'
            };
        }
    };

    (function () {
        $scope.updateViewCol($scope.viewColsActions.ONE);
        $scope.updateView($scope.reportViewActions.SHOW_ALL_REPORT);
        setupScroll();
        setTitleAndHeading();
        setPrevState();
    })();
}]);