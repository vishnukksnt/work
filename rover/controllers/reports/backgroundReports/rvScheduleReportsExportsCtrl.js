'use strict';

angular.module('sntRover').controller('RVScheduleReportsAndExportsCtrl', ['$scope', '$timeout', '$state', '$filter', '$stateParams', '$rootScope', 'Toggles', 'ngDialog', function ($scope, $timeout, $state, $filter, $stateParams, $rootScope, Toggles, ngDialog) {

    BaseCtrl.call(this, $scope);

    var intialReportViewStore = {
        showingAllReport: false,
        showingScheduledReports: false,
        showingScheduleAReport: false,
        showingExportReports: false,
        showingExportAReport: false,
        showingCustomExports: false,
        showingCustomNewExport: false
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
        } else if ($scope.reportViewStore.showingCustomExports) {
            source = $scope.customExportsData.scheduledCustomExports;
        } else if ($scope.reportViewStore.showingCustomNewExport) {
            source = $scope.customExportsData.customExportDataSpaces;
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
            if ($scope.myScroll && $scope.myScroll['report-list-scroll']) {
                $scope.myScroll['report-list-scroll'].refresh();
            }

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
        var styles = [];

        styles.push(angular.isDefined(action) ? 'cols-' + action : 'cols-' + $scope.reportViewActions.ONE);

        if ($scope.reportViewStore && ($scope.reportViewStore.showingCustomNewExport || $scope.reportViewStore.showingCustomExports) && action === $scope.viewColsActions.SIX) {
            styles.push('with-bottom-form');
        }

        return styles;
    };

    $scope.viewColsActions = {
        ONE: 1,
        TWO: 2,
        THREE: 3,
        FOUR: 4,
        FIVE: 5,
        SIX: 6
    };

    /**
     * Common action const names for keeping same standard
     */
    $scope.reportViewActions = {
        SHOW_ALL_REPORTS: 'SHOW_ALL_REPORTS',
        SHOW_SCHEDULED_REPORTS: 'SHOW_SCHEDULED_REPORTS',
        SHOW_SCHEDULE_A_REPORT: 'SHOW_SCHEDULE_A_REPORT',
        SHOW_EXPORT_REPORTS: 'SHOW_EXPORT_REPORTS',
        SHOW_EXPORT_A_REPORT: 'SHOW_EXPORT_A_REPORT',
        SHOW_CUSTOM_EXPORTS: 'SHOW_CUSTOM_EXPORTS',
        SHOW_CUSTOM_NEW_EXPORT: 'SHOW_CUSTOM_NEW_EXPORT'
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

            case $scope.reportViewActions.SHOW_CUSTOM_EXPORTS:
                return angular.extend({}, intialReportViewStore, { showingCustomExports: true });

            case $scope.reportViewActions.SHOW_CUSTOM_NEW_EXPORT:
                return angular.extend({}, intialReportViewStore, { showingCustomNewExport: true });

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
            }

            refreshScroller();
            return;
        }

        if ($scope.uiChosenReport) {
            $scope.uiChosenReport.uiChosen = false;
        }

        for (i = 0, j = source.length; i < j; i++) {
            title = source[i].title || source[i].name || source[i].report && source[i].report.title;
            title = title.toLowerCase();
            source[i].filteredOut = title.indexOf(query) === -1;
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
        $scope.$broadcast('RESET_CURRENT_STAGE');
    };

    $scope.updateViewCol = function (cols, noReset) {
        $scope.viewColClassName = viewColsReducer(cols);
        refreshScroll(noReset);
    };

    $scope.$on('REPORT_LIST_FILTER_SCROLL_REFRESH', refreshScroller);

    /**
     * Set title and heading
     * @param {Boolean} isFromReportsInbox - indication whether navigating from inbox
     * @return {void}
     */
    var setTitleAndHeading = function setTitleAndHeading() {
        var title = '';

        if ($scope.reportViewStore.showingScheduledReports || $scope.reportViewStore.showingExportReports) {
            title = $filter('translate')('SCHEDULED_REPORTS_AND_EXPORTS');
        } else if ($scope.reportViewStore.showingScheduleAReport) {
            title = $filter('translate')('SCHEDULE_REPORT');
        } else if ($scope.reportViewStore.showingExportAReport) {
            title = $filter('translate')('SCHEDULE_EXPORT');
        }

        $scope.setTitle(title);
        $scope.$parent.heading = title;
    };

    // Reload the current state
    $scope.reloadState = function () {
        $state.reload();
    };

    /**
     * Set the navigation to previous screen
     * @param {Boolean} showScheduledReports should show scheduled reports
     * @param {Boolean} showScheduledExports should show scheduled exports
     * @param {Boolean} showCustomExports should show custom exports
     * return {void} set the previous state object
     */
    var setPrevState = function setPrevState(showScheduledReports, showScheduledExports, showCustomExports) {
        var backNaviagtionLabel = $filter('translate')('SCHEDULED_REPORTS');

        if (showScheduledExports) {
            backNaviagtionLabel = $filter('translate')('SCHEDULED_EXPORTS');
        } else if (showCustomExports) {
            backNaviagtionLabel = $filter('translate')('CUSTOM_EXPORTS');
        }
        // Reload the current state when there is no change in the state params
        if ($stateParams && $stateParams.showScheduledReports === showScheduledReports && $stateParams.showScheduledExports === showScheduledExports && $stateParams.showCustomExports === showCustomExports) {
            $rootScope.setPrevState = {
                title: backNaviagtionLabel,
                callback: 'reloadState',
                scope: $scope
            };
        } else {
            $rootScope.setPrevState = {
                title: backNaviagtionLabel,
                name: 'rover.reports.scheduleReportsAndExports',
                param: {
                    showScheduledReports: showScheduledReports,
                    showScheduledExports: showScheduledExports,
                    showCustomExports: showCustomExports
                }
            };
        }
    };

    // Navigate to new report schedule creation screen
    $scope.createNewReportSchedule = function () {
        $scope.$broadcast('CREATE_NEW_REPORT_SCHEDULE');
        setPrevState(true, false, false);
    };

    // Navigate to new export schedule creation screen
    $scope.createNewExportSchedule = function () {
        $scope.$broadcast('CREATE_NEW_EXPORT_SCHEDULE');
        setPrevState(false, true, false);
    };

    // Update title and heading
    $scope.$on('UPDATE_TITLE_AND_HEADING', function () {
        setTitleAndHeading();
    });

    // Create new custom export
    $scope.createNewCustomExport = function () {
        $scope.$broadcast('CREATE_NEW_CUSTOM_EXPORT');
        setPrevState(false, false, true);
    };

    // Should show the reporter form or not
    $scope.shouldShowReportFooterForm = function () {
        return $scope.reportViewStore && ($scope.reportViewStore.showingCustomNewExport || $scope.reportViewStore.showingCustomExports) && $scope.viewColClassName && $scope.viewColClassName.indexOf('with-bottom-form') > -1;
    };

    // Create new custom export
    $scope.createCustomExport = function () {
        $scope.$broadcast('CREATE_NEW_CUSTOM_EXPORT_SCHEDULE');
    };

    // Save the given export
    $scope.saveCustomExport = function () {
        $scope.$broadcast('UPDATE_CUSTOM_EXPORT_SCHEDULE');
    };

    // Navigate to the export listing page
    $scope.navigateToExportListing = function () {
        $scope.$broadcast('SHOW_EXPORT_LISTING');
    };

    // Listener for showing the error msg
    $scope.addListener('SHOW_ERROR_MSG_EVENT', function (event, msg) {
        $scope.errorMessage = msg || [];
    });

    // Clear the error msg
    $scope.clearErrorMsg = function () {
        $scope.errorMessage = '';
    };

    // Handler for changing the output format
    $scope.onOutputFormatChange = function () {
        var selectedFormat = _.find($scope.customExportsData.exportFormats, { id: $scope.customExportsScheduleParams.format });

        if (selectedFormat && (selectedFormat.value === 'XML' || selectedFormat.value === 'JSON')) {
            ngDialog.open({
                template: '/assets/partials/common/rvWarningPopup.html',
                scope: $scope
            });
        }
    };

    $scope.addListener('CLEAR_ERROR_MSG', function () {
        $scope.errorMessage = [];
    });

    // Handler for deleting the custom exports schedule
    $scope.deleteCustomExportSchedule = function () {
        $scope.$broadcast('DELETE_CUSTOM_EXPORT_SCHEDULE');
    };

    // Show custom exports menu based on permission and toggle feature settings
    $scope.shouldShowCustomExports = function () {
        return $scope.isCustomExportsEnabled && $scope.hasPermissionToViewScheduleReport();
    };

    (function () {
        $scope.updateViewCol($scope.viewColsActions.ONE);
        if ($stateParams.showScheduledReports) {
            $scope.updateView($scope.reportViewActions.SHOW_SCHEDULED_REPORTS);
        } else if ($stateParams.showScheduledExports) {
            $scope.updateView($scope.reportViewActions.SHOW_EXPORT_REPORTS);
        } else if ($stateParams.showCustomExports) {
            $scope.updateView($scope.reportViewActions.SHOW_CUSTOM_EXPORTS);
        } else {
            $scope.updateView($scope.reportViewActions.SHOW_SCHEDULED_REPORTS);
        }

        setupScroll();

        setTitleAndHeading();

        // Feature toggle decides whether the custom export menu should be shown or not
        $scope.isCustomExportsEnabled = Toggles.isEnabled('custom_exports');
        $scope.customExportsScheduleParams = {};
        $scope.isToastEnabled = Toggles.isEnabled('show_toast_notifications');

        // Holds the data for custom exports
        $scope.customExportsData = {
            isNewExport: false,
            scheduledCustomExports: [],
            customExportDataSpaces: [],
            exportFormats: [],
            deliveryTypes: []
        };

        $scope.showingErrMsg = false;
        $scope.errorMessage = '';
    })();
}]);