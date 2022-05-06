'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

angular.module('sntRover').controller('RVReportsMainCtrl', ['$rootScope', '$scope', 'payload', 'RVreportsSrv', 'RVreportsSubSrv', 'RVReportUtilsFac', 'RVReportParamsConst', 'RVReportMsgsConst', 'RVReportNamesConst', '$filter', '$timeout', 'rvUtilSrv', 'rvPermissionSrv', 'RVReportPaginationIdsConst', '$state', '$log', 'ngDialog', 'sntActivity', function ($rootScope, $scope, payload, reportsSrv, reportsSubSrv, reportUtils, reportParams, reportMsgs, reportNames, $filter, $timeout, util, rvPermissionSrv, reportPaginationIds, $state, $log, ngDialog, sntActivity) {
    var self = this,
        isNotTimeOut = false,
        timeOut,
        listTitle = $filter('translate')('STATS_&_REPORTS_TITLE');

    BaseCtrl.call(this, $scope);

    $scope.isVisible = false;

    $scope.setTitle(listTitle);
    $scope.heading = listTitle;
    $scope.$emit('updateRoverLeftMenu', 'reports');
    $scope.reportList = angular.copy(payload.reportsResponse.results);
    $scope.reportCount = angular.copy(payload.reportsResponse.total_count);
    $scope.codeSettings = angular.copy(payload.codeSettings);
    $scope.activeUserList = angular.copy(payload.activeUserList);
    $scope.schedulesList = [];
    $scope.schedulableReports = [];

    $scope.refreshReportList = function () {
        $scope.reportList = angular.copy(payload.reportsResponse.results);
    };

    $scope.selectedReport = {
        report: null
    };

    $scope.viewStatus = {
        showDetails: false
    };

    $scope.reportListCopy = JSON.parse(JSON.stringify(payload.reportsResponse.results));

    // Hold the page no when navigating back to report inbox from report details page
    $scope.reportInboxPageState = {
        returnPage: 1,
        returnDate: $rootScope.serverDate
    };

    $scope.scrollToLast = function () {
        $timeout(function () {
            if ($scope.$parent.myScroll.hasOwnProperty('FULL_REPORT_SCROLL')) {
                $scope.$parent.myScroll['FULL_REPORT_SCROLL'].scrollTo($scope.myScroll['FULL_REPORT_SCROLL'].maxScrollX, 0, 299);
            }
        }, 300);
    };

    /**
     * function to check whether the user has permission
     * to view schedule report menu
     * @return {Boolean}
     */
    $scope.hasPermissionToViewScheduleReport = function () {
        return rvPermissionSrv.getPermissionValue('ADD_EDIT_DELETE_REPORT_SCHEDULE');
    };

    /**
     * function to check whether the user has permission
     * to view export report menu
     * @return {Boolean}
     */
    $scope.hasPermissionToViewExportReport = function () {
        return rvPermissionSrv.getPermissionValue('EXPORT_REPORTS');
    };

    /**
     * should show schedule report menu
     * @return {Boolean}
     */
    $scope.shouldShowScheduleReport = function () {
        return $scope.hasPermissionToViewScheduleReport();
    };

    /**
     * should show export report menu
     * @return {Boolean}
     */
    $scope.shouldShowExportReport = function () {
        return $scope.hasPermissionToViewExportReport();
    };

    $scope.uiChosenReport = undefined;

    // CICO-21232
    // HIDE export option in ipad and other devices
    // RESTRICT to ONLY desktop
    $scope.hideExportOption = !!sntapp.cordovaLoaded || util.checkDevice.any();

    // var addonsCount = 0;
    // _.each ($scope.addons, function (each) {
    //     addonsCount += each.list_of_addons.length;
    // });

    // ctrls created for a specific reports, e.g: OccRev, may require
    // to show a modal for user to modify the report for print.
    // such ctrls can create 'showModal' and 'afterPrint' methods when initiating,
    // 'DetailsCtrl' will try and call 'showModal' and 'afterPrint',
    // before and after printing the report, allowing that ctrl to do what it
    // wants to do before bring and remove anything after print
    // NOTE: 'resetSelf' will be called by the 'ListCtrl', while opening a new report
    // in which case the old and new report IDs will be different
    $scope.printOptions = {
        resetSelf: function resetSelf() {
            this.showModal = undefined;
            this.afterPrint = undefined;
        }
    };
    $scope.printOptions.resetSelf();

    // lets fix the results per page to, user can't edit this for now
    // 25 is the current number set by backend server
    $scope.resultsPerPage = 25;

    $scope.goBackReportList = function () {
        $scope.heading = listTitle;
        $scope.showSidebar = false;

        $scope.resetFilterItemsToggle();

        // tell report list controller to refresh scroll
        $scope.$broadcast(reportMsgs['REPORT_LIST_SCROLL_REFRESH']);

        if (reportsSrv.getChoosenReport().generatedReportId) {
            $state.go('rover.reports.inbox', {
                page: $scope.reportInboxPageState.returnPage,
                date: $scope.reportInboxPageState.returnDate
            });
        } else {
            // This is for handling the case when user navigate back from the other states back to report state
            // eg: For arrival report, the user can navigate to staycard and come back again to report details screen
            // In such case, the report list should be processed again to set the flags and so
            var shouldRefresh = $scope.shouldProcessReportList ? $scope.shouldProcessReportList : false;

            $state.go('rover.reports.dashboard', { refresh: shouldRefresh });

            $scope.shouldProcessReportList = false;
        }
    };

    // keep track of any errors
    $scope.errorMessage = [];

    $scope.showSidebar = false;
    $scope.toggleSidebar = function (e) {
        if (!!e) {
            if ($(e.target).is('.ui-resizable-handle')) {
                $scope.showSidebar = $scope.showSidebar ? false : true;
            }
            e.stopPropagation();
        } else {
            $scope.showSidebar = false;
        }
    };

    $scope.filterItemsToggle = {
        item_01: false,
        item_02: false,
        item_03: false,
        item_04: false,
        item_05: false,
        item_06: false,
        item_07: false,
        item_08: false,
        item_09: false,
        item_10: false,
        item_11: false,
        item_12: false,
        item_13: false,
        item_14: false,
        item_15: false,
        item_16: false,
        item_17: false,
        item_18: false,
        item_19: false,
        item_20: false,
        item_21: false,
        item_22: false,
        item_23: false,
        item_24: false,
        item_25: false,
        item_26: false,
        item_27: false,
        item_28: false,
        item_29: false, // Exclude Options
        item_30: false, // Show Options
        item_32: false,
        item_33: false,
        item_34: false,
        item_35: false,
        item_36: false,
        item_37: false,
        item_38: false,
        item_39: false,
        item_40: false,
        item_41: false,
        item_42: false,
        item_43: false,
        item_44: false,
        item_45: false,
        item_46: false,
        item_47: false,
        item_48: false,
        item_49: false,
        item_50: false,
        item_51: false,
        item_52: false,
        item_53: false,
        item_54: false,
        item_55: false,
        item_56: false,
        item_57: false,
        item_58: false,
        item_59: false,
        item_60: false
    };
    $scope.toggleFilterItems = function (item) {
        if (!$scope.filterItemsToggle.hasOwnProperty(item)) {
            $scope.filterItemsToggle[item] = false;
        }

        $scope.filterItemsToggle[item] = !$scope.filterItemsToggle[item];

        $log.info(reportMsgs['REPORT_DETAILS_FILTER_SCROLL_REFRESH']);
        $rootScope.$broadcast(reportMsgs['REPORT_DETAILS_FILTER_SCROLL_REFRESH']);
        $rootScope.$broadcast(reportMsgs['REPORT_LIST_FILTER_SCROLL_REFRESH']);
    };
    $scope.resetFilterItemsToggle = function () {
        _.each($scope.filterItemsToggle, function (value, key) {
            $scope.filterItemsToggle[key] = false;
        });
    };

    // show only valid sort_by Options "Filter"
    $scope.showValidSortBy = function (sortBy) {
        return !!sortBy && !!sortBy.value;
    };

    // replace any char with single space " "
    // e.g -> filter:showValidSortBy:_
    $scope.replaceWithSpace = function (value, tobeReplaced) {
        return !value ? '' : value.replace(/_/g, ' ');
    };

    /**
     * inorder to refresh after list rendering
     */
    $scope.$on('NG_REPEAT_COMPLETED_RENDERING', function (event) {
        $scope.refreshScroller('report-list-scroll');
    });

    // common date picker options object
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

    // common from and untill date picker options
    // with added limits to choose dates
    $scope.fromDateOptions = angular.extend({
        maxDate: $filter('date')($rootScope.businessDate, $rootScope.dateFormat),
        onSelect: function onSelect(value) {
            $scope.untilDateOptions.minDate = value;
        }
    }, datePickerCommon);

    $scope.untilDateOptions = angular.extend({
        maxDate: $filter('date')($rootScope.businessDate, $rootScope.dateFormat),
        onSelect: function onSelect(value) {
            $scope.fromDateOptions.maxDate = value;
        }
    }, datePickerCommon);

    // common from and untill date picker options
    // with added limits to yesterday (BD - 1)
    $scope.fromDateOptionsTillYesterday = angular.extend({
        maxDate: function () {
            var currentDate = new tzIndependentDate($rootScope.businessDate);

            currentDate.setDate(currentDate.getDate() - 1);
            return $filter('date')(currentDate, $rootScope.dateFormat);
        }(),
        onSelect: function onSelect(value) {
            $scope.untilDateOptions.minDate = value;
        }
    }, datePickerCommon);

    $scope.untilDateOptionsTillYesterday = angular.extend({
        maxDate: function () {
            var currentDate = new tzIndependentDate($rootScope.businessDate);

            currentDate.setDate(currentDate.getDate() - 1);
            return $filter('date')(currentDate, $rootScope.dateFormat);
        }(),
        onSelect: function onSelect(value) {
            $scope.fromDateOptions.maxDate = value;
        }
    }, datePickerCommon);

    $scope.fromDateOptionsTillBD = angular.extend({
        maxDate: new tzIndependentDate($rootScope.businessDate),
        onSelect: function onSelect(value) {
            $scope.untilDateOptions.minDate = value;
        }
    }, datePickerCommon);

    $scope.untilDateOptionsTillBD = angular.extend({
        maxDate: new tzIndependentDate($rootScope.businessDate),
        onSelect: function onSelect(value) {
            $scope.fromDateOptions.maxDate = value;
        }
    }, datePickerCommon);

    // from and untill date picker options
    // with added limits to system (today) date
    $scope.fromDateOptionsSysLimit = angular.extend({
        maxDate: new Date(),
        onSelect: function onSelect(value) {
            $scope.untilDateOptions.minDate = value;
        }
    }, datePickerCommon);

    $scope.untilDateOptionsSysLimit = angular.extend({
        maxDate: new Date(),
        onSelect: function onSelect(value) {
            $scope.fromDateOptions.maxDate = value;
        }
    }, datePickerCommon);

    // for some of the reports we need to restrict max date selection to 1 year (eg:- daily production report)
    $scope.fromDateOptionsOneYearLimit = angular.extend({
        onSelect: function onSelect(value, datePickerObj) {
            var selectedDate = new tzIndependentDate(util.get_date_from_date_picker(datePickerObj));

            $scope.toDateOptionsOneYearLimit.minDate = selectedDate;
            $scope.toDateOptionsOneYearLimit.maxDate = reportUtils.processDate(selectedDate).aYearAfter;

            if ($scope.touchedReport.untilDate < selectedDate) {
                $scope.touchedReport.untilDate = selectedDate;
            }
            if ($scope.touchedReport.untilDate > $scope.toDateOptionsOneYearLimit.maxDate) {
                $scope.touchedReport.untilDate = $scope.toDateOptionsOneYearLimit.maxDate;
            }
        }
    }, datePickerCommon);

    // for some of the reports we need to restrict max date selection to one month (eg:- rate restriction report)
    $scope.fromDateOptionsOneMonthLimit = angular.extend({
        onSelect: function onSelect(value, datePickerObj) {
            var selectedDate = new tzIndependentDate(util.get_date_from_date_picker(datePickerObj));

            $scope.toDateOptionsOneMonthLimit.minDate = selectedDate;
            $scope.toDateOptionsOneMonthLimit.maxDate = reportUtils.processDate(selectedDate).aMonthAfter;

            if ($scope.touchedReport.untilDate < selectedDate) {
                $scope.touchedReport.untilDate = selectedDate;
            }
            if ($scope.touchedReport.untilDate > $scope.toDateOptionsOneMonthLimit.maxDate) {
                $scope.touchedReport.untilDate = $scope.toDateOptionsOneMonthLimit.maxDate;
            }
        }
    }, datePickerCommon);

    var datesUsedForCalendar = reportUtils.processDate();

    $scope.toDateOptionsOneYearLimit = angular.extend({
        minDate: datesUsedForCalendar.monthStart,
        maxDate: reportUtils.processDate(datesUsedForCalendar.monthStart).aYearAfter
    }, datePickerCommon);

    $scope.fromDateOptionsForecast = angular.extend({
        minDate: new tzIndependentDate($rootScope.businessDate),
        onSelect: function onSelect(value, datePickerObj) {
            var selectedDate = new tzIndependentDate(util.get_date_from_date_picker(datePickerObj));

            $scope.toDateOptionsForecast.minDate = selectedDate;
            $scope.toDateOptionsForecast.maxDate = reportUtils.processDate(selectedDate).aYearAfter;

            if ($scope.touchedReport.untilDate < selectedDate) {
                $scope.touchedReport.untilDate = selectedDate;
            }
            if ($scope.touchedReport.untilDate > $scope.toDateOptionsForecast.maxDate) {
                $scope.touchedReport.untilDate = $scope.toDateOptionsForecast.maxDate;
            }
        }
    }, datePickerCommon);

    $scope.toDateOptionsForecast = angular.extend({
        minDate: $scope.fromDateOptionsForecast.minDate,
        maxDate: reportUtils.processDate(datesUsedForCalendar.businessDate).aYearAfter
    }, datePickerCommon);

    $scope.toDateOptionsOneMonthLimit = angular.extend({
        minDate: new tzIndependentDate($rootScope.businessDate),
        maxDate: reportUtils.processDate($rootScope.businessDate).aMonthAfter
    }, datePickerCommon);

    // for some of the reports we need to restrict max date selection to 6 months (eg:- Business on Books report)
    $scope.fromDateOptionsSixMonthsLimit = angular.extend({
        onSelect: function onSelect(value, datePickerObj) {
            var selectedDate = new tzIndependentDate(util.get_date_from_date_picker(datePickerObj));

            $scope.toDateOptionsSixMonthsLimit.minDate = selectedDate;
            $scope.toDateOptionsSixMonthsLimit.maxDate = reportUtils.processDate(selectedDate).sixMonthsAfter;
        }
    }, datePickerCommon);

    $scope.toDateOptionsSixMonthsLimit = angular.extend({
        minDate: new tzIndependentDate($rootScope.businessDate),
        maxDate: reportUtils.processDate($rootScope.businessDate).sixMonthsAfter
    }, datePickerCommon);

    // CICO-34733 - Added for Group Rooms report
    $scope.fromDateOptionsThirtyOneDaysLimit = angular.extend({
        onSelect: function onSelect(value, datePickerObj) {
            var selectedDate = new tzIndependentDate(util.get_date_from_date_picker(datePickerObj));

            $scope.toDateOptionsThirtyOneDaysLimit.minDate = selectedDate;
            $scope.toDateOptionsThirtyOneDaysLimit.maxDate = reportUtils.processDate(selectedDate).thirtyOneDaysAfter;

            $scope.touchedReport.untilDate = $scope.toDateOptionsThirtyOneDaysLimit.maxDate;
        }
    }, datePickerCommon);

    $scope.toDateOptionsThirtyOneDaysLimit = angular.extend({
        minDate: new tzIndependentDate($rootScope.businessDate),
        maxDate: reportUtils.processDate($rootScope.businessDate).thirtyOneDaysAfter
    }, datePickerCommon);

    // custom from and untill date picker options
    // with no limits to choose dates
    $scope.fromDateOptionsNoLimit = angular.extend({}, datePickerCommon);
    $scope.untilDateOptionsNoLimit = angular.extend({}, datePickerCommon);

    var dbObj = reportUtils.processDate().businessDate;

    $scope.dateChanged = function (item, dateName) {

        // keep track of the report that has been
        // touched by the user
        $scope.touchedReport = item;
        $scope.touchedDate = dateName;

        if (item.title === reportNames['DAILY_PRODUCTION_RATE'] || item.title === reportNames['BUSINESS_ON_BOOKS']) {
            if (item.fromDate > item.untilDate) {
                item.untilDate = item.fromDate;
            }
        }

        if (item.title === reportNames['DAILY_PRODUCTION_DEMO']) {
            if (item.fromDate > item.untilDate) {
                item.untilDate = item.fromDate;
            }
        }

        if (item.title === reportNames['RATE_RESTRICTION_REPORT']) {
            if (item.fromDate > item.untilDate) {
                item.untilDate = item.fromDate;
            }
        }

        if (item.title === reportNames['DAILY_PRODUCTION_ROOM_TYPE']) {
            if (item.fromDate > item.untilDate) {
                item.untilDate = item.fromDate;
            }
        }

        if (item.title === reportNames['DAILY_PRODUCTION_ROOM_TYPE']) {
            if (item.fromDate > item.untilDate) {
                item.untilDate = item.fromDate;
            }
        }

        if (item.title === reportNames['COMPANY_TA_TOP_PRODUCERS']) {
            if (!!item.fromDate && item.untilDate === undefined) {
                item.untilDate = item.fromDate;
            }

            if (!!item.untilDate && item.fromDate === undefined) {
                item.fromDate = item.untilDate;
            }
        }

        if (item.title === reportNames['ARRIVAL']) {
            if (!angular.equals(item.fromDate, dbObj) || !angular.equals(item.untilDate, dbObj)) {
                item.chosenDueInArrivals = false;
            }
            // CICO-56206
            if (item.fromDate > item.untilDate) {
                item.untilDate = item.fromDate;
            }
        }
        if (item.title === reportNames['DEPARTURE']) {
            if (!angular.equals(item.fromDate, dbObj) || !angular.equals(item.untilDate, dbObj)) {
                item.chosenDueOutDepartures = false;
            }

            // CICO-56206
            if (item.fromDate > item.untilDate) {
                item.untilDate = item.fromDate;
            }
        }
    };

    $scope.setTomorrowDate = function (item) {
        item.fromDate = reportUtils.processDate().tomorrow;
        item.untilDate = reportUtils.processDate().tomorrow;
    };

    // logic to re-show the remove date button
    $scope.showRemoveDateBtn = function () {
        var reportItem = $scope.touchedReport,
            dateName = $scope.touchedDate,
            dateObj,
            otherDatesNames,
            otherFilledDates;

        if ('object' !== (typeof reportItem === 'undefined' ? 'undefined' : _typeof(reportItem)) || !reportItem.hasOwnProperty(dateName)) {
            return;
        } else {
            dateObj = reportItem[dateName];
        }

        // 1 - if date is valid for this 'dateItem' in this 'reportItem'
        // 2.1 - if this is the only date in this 'reportItem', enable 'showRemove'
        // 2.2 - else find out other dates available on this 'reportItem'
        //     - if any of the other dates have valid date value, enable 'showRemove'
        if (isDateValid(reportItem, dateName)) {

            if (reportItem['allDates'].length === 1) {
                dateObj['showRemove'] = true;
            } else {
                otherDatesNames = _.without(reportItem['allDates'], dateName);

                otherFilledDates = _.find(otherDatesNames, function (name) {
                    return isDateValid(reportItem, name);
                });

                if (!!otherFilledDates) {
                    dateObj['showRemove'] = true;
                    reportItem[otherFilledDates]['showRemove'] = true;
                }
            }

            forceScopeApply();
        }

        function isDateValid(report, name) {
            var from = true,
                until = true;

            var _dateObj = report[name];

            if (_dateObj.hasOwnProperty('fromModel') && report[_dateObj['fromModel']] === undefined) {
                from = false;
            }

            if (_dateObj.hasOwnProperty('untilModel') && report[_dateObj['untilModel']] === undefined) {
                until = false;
            }

            return from && until ? true : false;
        }

        function forceScopeApply() {
            var retry = function retry() {
                if ($scope && 'function' === typeof $scope.apply) {
                    $scope.apply();
                } else {
                    $timeout(retry, 100);
                }
            };

            $timeout(retry, 100);
        }
    };

    $scope.clearDateFromFilter = function (reportItem, dateName) {
        var fromModel = reportItem[dateName]['fromModel'],
            untilModel = reportItem[dateName]['untilModel'],
            otherDates = _.without(reportItem['allDates'], dateName),
            otherFilledDates = 0,
            lastDate;

        // empty dates
        if (reportItem.hasOwnProperty(fromModel)) {
            reportItem[fromModel] = undefined;
        }
        if (reportItem.hasOwnProperty(untilModel)) {
            reportItem[untilModel] = undefined;
        }

        // hide remove date button
        reportItem[dateName]['showRemove'] = false;

        // hide remove button for the last date
        if (otherDates.length === 1) {
            lastDate = otherDates[0];
            reportItem[lastDate]['showRemove'] = false;
        } else {
            _.each(otherDates, function (each) {
                if (reportItem[each]['showRemove']) {
                    lastDate = each;
                    otherFilledDates += 1;
                }
            });

            if (otherFilledDates === 1) {
                reportItem[lastDate]['showRemove'] = false;
            }
        }
    };

    // auto correct the CICO value;
    var getProperCICOVal = function getProperCICOVal(type) {
        var chosenReport = reportsSrv.getChoosenReport();

        // only do this for this report
        // I know this is ugly :(
        if (chosenReport.title !== reportNames['CHECK_IN_CHECK_OUT']) {
            return;
        }

        // if user has not chosen anything
        // both 'checked_in' & 'checked_out' must be true
        if (!chosenReport.chosenCico) {
            chosenReport.chosenCico = 'BOTH';
            return true;
        }

        // for 'checked_in'
        if (type === 'checked_in') {
            return chosenReport.chosenCico === 'IN' || chosenReport.chosenCico === 'BOTH';
        }

        // for 'checked_out'
        if (type === 'checked_out') {
            return chosenReport.chosenCico === 'OUT' || chosenReport.chosenCico === 'BOTH';
        }
    };

    $scope.sortByChanged = function (item) {
        var _sortBy;

        // un-select sort dir of others
        // and get a ref to the chosen item
        _.each(item.sortByOptions, function (each) {
            if (each && each.value !== item.chosenSortBy) {
                each.sortDir = undefined;
            } else if (each && each.value === item.chosenSortBy) {
                _sortBy = each;
            }
        });

        // select sort_dir for chosen item
        if (!!_sortBy) {
            _sortBy.sortDir = true;
        }
    };

    var formTitleAndToggleSelectAllForRestrictionDropDown = function formTitleAndToggleSelectAllForRestrictionDropDown(item) {
        var selectedRestrictions = _.where(item.hasRestrictionListFilter.data, { selected: true });

        item.hasRestrictionListFilter.selectAll = false;
        if (item.hasRestrictionListFilter.data.length === selectedRestrictions.length) {
            item.hasRestrictionListFilter.title = 'All Selected';
            item.hasRestrictionListFilter.selectAll = true;
        } else if (selectedRestrictions.length === 0) {
            item.hasRestrictionListFilter.title = item.hasRestrictionListFilter.defaultTitle;
        } else if (selectedRestrictions.length === 1) {
            item.hasRestrictionListFilter.title = selectedRestrictions[0].description;
        } else {
            item.hasRestrictionListFilter.title = selectedRestrictions.length + ' Selected';
        }
    };

    $scope.restrictionChanged = function (item) {
        formTitleAndToggleSelectAllForRestrictionDropDown(item);
        // for report details filter
        $rootScope.$broadcast(reportMsgs['REPORT_LIST_FILTER_SCROLL_REFRESH']);
    };

    $scope.toggleRestrictionSelectAll = function (item) {
        _.each(item.hasRestrictionListFilter.data, function (rateType) {
            rateType.selected = item.hasRestrictionListFilter.selectAll;
        });
        $scope.restrictionChanged(item);
    };

    var formTitleAndToggleSelectAllForRoomTypeDropDown = function formTitleAndToggleSelectAllForRoomTypeDropDown(item) {
        var selectedRoomTypes = _.where(item.hasRoomTypeFilter.data, { selected: true });

        item.hasRoomTypeFilter.selectAll = false;
        if (item.hasRoomTypeFilter.data.length === selectedRoomTypes.length) {
            item.hasRoomTypeFilter.title = 'All Selected';
            item.hasRoomTypeFilter.selectAll = true;
        } else if (selectedRoomTypes.length === 0) {
            item.hasRoomTypeFilter.title = item.hasRoomTypeFilter.defaultTitle;
        } else if (selectedRoomTypes.length === 1) {
            item.hasRoomTypeFilter.title = selectedRoomTypes[0].name;
        } else {
            item.hasRoomTypeFilter.title = selectedRoomTypes.length + ' Selected';
        }
    };

    $scope.roomTypeChanged = function (item) {
        formTitleAndToggleSelectAllForRoomTypeDropDown(item);
        // for report details filter
        $rootScope.$broadcast(reportMsgs['REPORT_LIST_FILTER_SCROLL_REFRESH']);
    };

    $scope.toggleRoomTypeSelectAll = function (item) {
        _.each(item.hasRoomTypeFilter.data, function (roomType) {
            roomType.selected = item.hasRoomTypeFilter.selectAll;
        });
        $scope.roomTypeChanged(item);
    };

    $scope.rateCodeChanged = function (item, rateCode) {
        _.each(item.hasRateCodeFilter.data, function (__rateCode) {
            if (__rateCode.id !== rateCode.id) {
                __rateCode.selected = false;
            }
        });
        var selectedRateCodes = _.where(item.hasRateCodeFilter.data, { selected: true });

        if (selectedRateCodes.length === 0) {
            item.hasRateCodeFilter.title = item.hasRateCodeFilter.defaultTitle;
        } else if (selectedRateCodes.length === 1) {
            item.hasRateCodeFilter.title = selectedRateCodes[0].description;
        }
        // for report details filter
        $rootScope.$broadcast(reportMsgs['REPORT_LIST_FILTER_SCROLL_REFRESH']);
    };

    $scope.toggleRateTypeSelectAll = function (item) {
        // whether rate type selected all or not selected all, applying to listing
        _.each(item.hasRateTypeFilter.data, function (rateType) {
            rateType.selected = item.hasRateTypeFilter.selectAll;
        });
        $scope.fauxSelectChange(item, item.hasRateTypeFilter, item.hasRateTypeFilter.selectAll);
        formTitleAndToggleSelectAllForRateDropDown(item);
        $rootScope.$broadcast(reportMsgs['REPORT_LIST_FILTER_SCROLL_REFRESH']);
    };

    $scope.rateTypeChanged = function (item) {
        $scope.fauxSelectChange(item, item.hasRateTypeFilter);
        formTitleAndToggleSelectAllForRateDropDown(item);
        $rootScope.$broadcast(reportMsgs['REPORT_LIST_FILTER_SCROLL_REFRESH']);
    };

    var formTitleAndToggleSelectAllForRateDropDown = function formTitleAndToggleSelectAllForRateDropDown(item) {
        var showingRateList = $scope.getRates(item),
            selectedRates = _.where(showingRateList, { selected: true });

        item.hasRateFilter.selectAll = false;

        if (showingRateList.length === selectedRates.length && showingRateList.length !== 0) {
            item.hasRateFilter.title = 'All Selected';
            item.hasRateFilter.selectAll = true;
        } else if (selectedRates.length === 0) {
            item.hasRateFilter.title = item.hasRateFilter.defaultTitle;
        } else if (selectedRates.length === 1) {
            item.hasRateFilter.title = selectedRates[0].rate_name;
        } else {
            item.hasRateFilter.title = selectedRates.length + ' Selected';
        }
    };

    $scope.rateChanged = function (item) {
        formTitleAndToggleSelectAllForRateDropDown(item);
        $rootScope.$broadcast(reportMsgs['REPORT_LIST_FILTER_SCROLL_REFRESH']);
    };

    $scope.toggleRateSelectAll = function (item) {
        $scope.getRates(item);

        // whether rate type selected all or not selected all, applying to listing
        _.each(item.hasRateFilter.data, function (rateType) {
            rateType.selected = item.hasRateFilter.selectAll;
        });
        formTitleAndToggleSelectAllForRateDropDown(item);
        $rootScope.$broadcast(reportMsgs['REPORT_LIST_FILTER_SCROLL_REFRESH']);
    };

    var getSelectedRateTypes = function getSelectedRateTypes(item) {
        return _.pluck(_.where(item.hasRateTypeFilter.data, { selected: true }), 'rate_type_id');
    };

    var getRateListToShow = function getRateListToShow(item) {
        // if selected some room types
        var listedRateTypes = item.hasRateTypeFilter.data,
            selectedRateTypes = _.where(listedRateTypes, { selected: true }),
            selectedRateTypesIds = _.pluck(selectedRateTypes, 'rate_type_id');

        return _.filter(item.hasRateFilter.data, function (rate) {
            return selectedRateTypesIds.indexOf(rate.rate_type_id) > -1;
        });
    };

    // Get the selected rates
    var getRatesListToShow = function getRatesListToShow(item) {
        var listedRates = item.hasRateCodeFilter.data,
            selectedRates = _.where(listedRates, { selected: true });

        return selectedRates;
    };

    $scope.shouldShowThisRate = function (rate, item) {
        var listedRateTypes = item.hasRateTypeFilter.data,
            selectedRateTypes = _.where(listedRateTypes, { selected: true }),
            selectedRateTypesIds = _.pluck(selectedRateTypes, 'rate_type_id');

        return selectedRateTypesIds.indexOf(rate.rate_type_id) > -1;
    };

    $scope.getRates = function (item) {
        // if all selected from rate type drop down
        var wantedToShowAllRates = item.hasRateTypeFilter.selectAll;

        if (wantedToShowAllRates) {
            return item.hasRateFilter.data;
        }

        return getRateListToShow(item);
    };

    $scope.catchFauxSelectClick = function (e, currentFaux) {
        e && e.stopPropagation();

        _.each($scope.reportList, function (element) {
            _.each(element, function (value, key) {
                if (key !== currentFaux && !!value && value.type === 'FAUX_SELECT') {
                    value.show = false;
                }
            });
        });
    };

    $scope.toggleFauxSelect = function (e, fauxDS) {
        $timeout(function () {
            // this is a temp fix
            // will replace faux select with <multi-option-selection>
            $scope.$$childTail.myScroll['report-filters-scroll'].refresh();
        }, 100);

        if (!e || !fauxDS) {
            return;
        }

        fauxDS.show = !fauxDS.show;
    };

    // $scope.fauxSelectChange = function(reportItem, fauxDS, allTapped) {
    //     var selectedItems = $scope.fauxSelectChange(reportItem, fauxDS, allTapped);
    // };

    $scope.fauxSelectChange = function (reportItem, fauxDS, allTapped) {
        var selectedItems;

        if (allTapped) {
            if (fauxDS.selectAll) {
                fauxDS.title = fauxDS.allTitle || 'All Selected';
            } else {
                fauxDS.title = fauxDS.defaultTitle;
            }

            _.each(fauxDS.data, function (each) {
                each.selected = fauxDS.selectAll;
            });

            selectedItems = _.where(fauxDS.data, { selected: true });
        } else {
            selectedItems = _.where(fauxDS.data, { selected: true });
            if (selectedItems.length === 0) {
                fauxDS.title = fauxDS.defaultTitle;
            } else if (selectedItems.length === 1) {
                fauxDS.selectAll = false;
                fauxDS.title = selectedItems[0].description || selectedItems[0].name || selectedItems[0].status;
            } else if (selectedItems.length === fauxDS.data.length) {
                fauxDS.selectAll = true;
                fauxDS.title = fauxDS.allTitle || 'All Selected';
            } else {
                fauxDS.selectAll = false;
                fauxDS.title = selectedItems.length + ' Selected';
            }

            $log.info(reportMsgs['REPORT_FILTER_CHANGED']);
            $scope.$broadcast(reportMsgs['REPORT_FILTER_CHANGED']);
        }

        $log.info(reportMsgs['REPORT_DETAILS_FILTER_SCROLL_REFRESH']);
        $rootScope.$broadcast(reportMsgs['REPORT_DETAILS_FILTER_SCROLL_REFRESH']);

        return selectedItems;
    };

    // Get the charge codes corresponding to selected charge groups
    $scope.chargeGroupfauxSelectChange = function (reportItem, fauxDS, allTapped) {
        var selectedItems = $scope.fauxSelectChange(reportItem, fauxDS, allTapped);

        _.each(reportItem.hasByChargeCode.originalData, function (each) {
            each.disabled = true;
        });

        _.each(reportItem.hasByChargeCode.originalData, function (each) {
            _.each(each.associcated_charge_groups, function (chargeGroup) {
                _.each(selectedItems, function (eachItem) {
                    if (chargeGroup.id === eachItem.id) {
                        each.disabled = false;
                    }
                });
            });
        });

        $scope.chargeCodeFauxSelectChange(reportItem, reportItem.hasByChargeCode, allTapped);
    };

    // Refill hasByChargeCode.data with the charge codes corresponding to selected charge groups
    $scope.chargeCodeFauxSelectChange = function (reportItem, fauxDS, allTapped) {
        var requiredChardeCodes = [];

        _.each(fauxDS.originalData, function (each) {
            if (!each.disabled) {
                requiredChardeCodes.push(each);
            }
        });

        fauxDS.data = requiredChardeCodes;
        $scope.fauxSelectChange(reportItem, fauxDS, allTapped);
    };

    $scope.toggleAddons = function () {
        $scope.isVisible = $scope.isVisible ? false : true;
    };

    $scope.getGroupName = function (groupId) {
        var groupName;

        angular.forEach($scope.addonGroups, function (key) {
            if (key.id == groupId) {
                groupName = key.name;
            }
        });
        return groupName;
    };

    $scope.getAddons = function (reportItem, fauxDS, allTapped) {
        var selectedItems = $scope.fauxSelectChange(reportItem, fauxDS, allTapped);

        if (isNotTimeOut) {
            clearTimeout(timeOut);
        }
        isNotTimeOut = true;
        timeOut = setTimeout(function () {
            isNotTimeOut = false;
            showAddons(reportItem, selectedItems);
        }, 2000);

        // calling the super
        $scope.fauxSelectChange(reportItem, fauxDS);
    };

    // fetch the addons corresponding to selected addon groups
    var showAddons = function showAddons(reportItem, selectedItems) {
        var selectedIds = [];

        angular.forEach(selectedItems, function (key) {
            selectedIds.push(key.id);
        });

        var groupIds = {
            'addon_group_ids': selectedIds
        };

        // this is very crude way of manupulating the data
        // this must some day be moved all to or atleast
        // handled by the service
        var sucssCallback = function sucssCallback(data) {
            var data = data;

            _.each(data, function (item) {
                _.each(item['list_of_addons'], function (entry) {
                    entry.selected = true;
                });
            });

            reportItem.hasAddons.data = data;

            $scope.$emit('hideLoader');
        };

        var errorCallback = function errorCallback() {
            $scope.$emit('hideLoader');
        };

        $scope.invokeApi(reportsSubSrv.fetchAddons, groupIds, sucssCallback, errorCallback);
    };

    function genParams(report, page, perPage, changeAppliedFilter) {
        var params = {
            'page': page,
            'per_page': perPage,
            'fiterFromDate': report.usedFilters && report.usedFilters.from_date ? report.usedFilters.from_date : null,
            'filterToDate': report.usedFilters && report.usedFilters.to_date ? report.usedFilters.to_date : null
        };

        // For Report Inbox, set id as generated id and skip all other params
        if (report.generatedReportId) {
            params.id = report.generatedReportId;
            return params;
        }
        params.id = report.id;
        var rawData = {};

        var key = '',
            fromKey = '',
            untilKey = '',
            checkInKey = '',
            checkOutKey = '',
            selected = [],
            chosenReport = reportsSrv.getChoosenReport();

        changeAppliedFilter = 'boolean' === typeof changeAppliedFilter ? changeAppliedFilter : true;
        perPage = chosenReport.title === reportNames['TRAVEL_AGENT_COMMISSIONS'] ? reportParams['TRAVEL_AGENTS_PER_PAGE_COUNT'] : perPage;

        // capturing the filters applied to be
        // shown on the report details footer
        if (changeAppliedFilter) {
            $scope.appliedFilter = {
                'options': [],
                'display': [],
                'show': [],
                'markets': [],
                'sources': [],
                'origins': [],
                'origin_urls': [],
                'guarantees': [],
                'chargeGroups': [],
                'chargeCodes': [],
                'holdStatuses': [],
                'addonGroups': [],
                'addons': [],
                'reservationStatus': [],
                'guestOrAccount': [],
                'chargeTypes': [],
                'users': [],
                'campaign_types': [],
                'floorList': [],
                'rates': [],
                'assigned_departments': [],
                'completion_status': [],
                'age_buckets': [],
                'account_ids': [],
                'travel_agent_ids': [],
                'segments': [],
                'market_ids': [],
                'tax_exempt_type_ids': [],
                'group_code': [],
                'country_ids': [],
                'include_long_stays': [],
                'transaction_category': [],
                'payment_types': [],
                'collapsed_or_expanded': []
            };
        }

        // include dates
        if (!!report.hasDateFilter) {
            if (!!report.fromDate) {
                fromKey = reportParams['FROM_DATE'];
                params[fromKey] = $filter('date')(report.fromDate, 'yyyy/MM/dd');
                if (changeAppliedFilter) {
                    $scope.appliedFilter['fromDate'] = angular.copy(report.fromDate);
                }
                rawData.fromDate = params[fromKey];
            }

            if (!!report.untilDate) {
                fromKey = reportParams['TO_DATE'];
                params[fromKey] = $filter('date')(report.untilDate, 'yyyy/MM/dd');
                if (changeAppliedFilter) {
                    $scope.appliedFilter['toDate'] = angular.copy(report.untilDate);
                }
                rawData.untilDate = params[fromKey];
            }
        }

        // include cancel dates
        if (!!report.hasCancelDateFilter) {
            fromKey = reportParams['CANCEL_FROM_DATE'];
            untilKey = reportParams['CANCEL_TO_DATE'];
            /**/
            params[fromKey] = $filter('date')(report.fromCancelDate, 'yyyy/MM/dd');
            params[untilKey] = $filter('date')(report.untilCancelDate, 'yyyy/MM/dd');
            /**/
            if (changeAppliedFilter) {
                $scope.appliedFilter['cancelFromDate'] = angular.copy(report.fromCancelDate);
                $scope.appliedFilter['cancelToDate'] = angular.copy(report.untilCancelDate);
            }
            rawData.fromCancelDate = params[fromKey];
            rawData.untilCancelDate = params[untilKey];
        }

        // include arrival dates -- IFF both the limits of date range have been selected
        if (!!report.hasArrivalDateFilter && !!report.fromArrivalDate && !!report.untilArrivalDate) {
            fromKey = reportParams['ARRIVAL_FROM_DATE'];
            untilKey = reportParams['ARRIVAL_TO_DATE'];
            /**/
            params[fromKey] = $filter('date')(report.fromArrivalDate, 'yyyy/MM/dd');
            params[untilKey] = $filter('date')(report.untilArrivalDate, 'yyyy/MM/dd');
            /**/
            if (changeAppliedFilter) {
                $scope.appliedFilter['arrivalFromDate'] = angular.copy(report.fromArrivalDate);
                $scope.appliedFilter['arrivalToDate'] = angular.copy(report.untilArrivalDate);
            }

            rawData.fromArrivalDate = params[fromKey];
            rawData.untilArrivalDate = params[untilKey];
        }

        // include group start dates -- IFF both the limits of date range have been selected
        if (!!report.hasGroupStartDateRange && !!report.groupStartDate && !!report.groupEndDate) {
            fromKey = reportParams['GROUP_START_DATE'];
            untilKey = reportParams['GROUP_END_DATE'];
            /**/
            params[fromKey] = $filter('date')(report.groupStartDate, 'yyyy/MM/dd');
            params[untilKey] = $filter('date')(report.groupEndDate, 'yyyy/MM/dd');
            /**/
            if (changeAppliedFilter) {
                $scope.appliedFilter['groupFromDate'] = angular.copy(report.groupStartDate);
                $scope.appliedFilter['groupToDate'] = angular.copy(report.groupEndDate);
            }

            rawData.groupStartDate = params[fromKey];
            rawData.groupEndDate = params[untilKey];
        }

        // include deposit due dates
        if (!!report.hasDepositDateFilter) {
            fromKey = reportParams['DEPOSIT_FROM_DATE'];
            untilKey = reportParams['DEPOSIT_TO_DATE'];
            /**/
            params[fromKey] = $filter('date')(report.fromDepositDate, 'yyyy/MM/dd');
            params[untilKey] = $filter('date')(report.untilDepositDate, 'yyyy/MM/dd');
            /**/
            if (changeAppliedFilter) {
                $scope.appliedFilter['depositFromDate'] = angular.copy(report.fromDepositDate);
                $scope.appliedFilter['depositToDate'] = angular.copy(report.untilDepositDate);
            }

            rawData.fromDepositDate = params[fromKey];
            rawData.untilDepositDate = params[untilKey];
        }

        // include paid dates
        if (!!report.hasPaidDateRange) {
            fromKey = reportParams['PAID_FROM_DATE'];
            untilKey = reportParams['PAID_TO_DATE'];
            /**/
            params[fromKey] = $filter('date')(report.fromPaidDate, 'yyyy/MM/dd');
            params[untilKey] = $filter('date')(report.untilPaidDate, 'yyyy/MM/dd');
            /**/
            if (changeAppliedFilter) {
                $scope.appliedFilter['paidFromDate'] = angular.copy(report.fromPaidDate);
                $scope.appliedFilter['paidToDate'] = angular.copy(report.untilPaidDate);
            }
            rawData.fromPaidDate = params[fromKey];
            rawData.untilPaidDate = params[untilKey];
        }

        // include create dates
        if (!!report.hasCreateDateFilter) {
            fromKey = reportParams['CREATE_FROM_DATE'];
            untilKey = reportParams['CREATE_TO_DATE'];
            /**/
            params[fromKey] = $filter('date')(report.fromCreateDate, 'yyyy/MM/dd');
            params[untilKey] = $filter('date')(report.untilCreateDate, 'yyyy/MM/dd');
            /**/
            if (changeAppliedFilter) {
                $scope.appliedFilter['createFromDate'] = angular.copy(report.fromCreateDate);
                $scope.appliedFilter['createToDate'] = angular.copy(report.untilCreateDate);
            }
            rawData.fromCreateDate = params[fromKey];
            rawData.untilCreateDate = params[untilKey];
        }

        // include collapsed or expanded
        if (report.hasOwnProperty('hasCollapsedOrExpanded')) {
            var selectedProperty = report['hasCollapsedOrExpanded']['selected'];

            params["summary_type"] = selectedProperty.value;
            if (changeAppliedFilter) {
                $scope.appliedFilter.collapsed_or_expanded = selectedProperty.value;
            }
        }

        // include single dates
        if (!!report.hasSingleDateFilter) {
            key = reportParams['SINGLE_DATE'];
            /**/
            params[key] = $filter('date')(report.singleValueDate, 'yyyy/MM/dd');
            /**/
            if (changeAppliedFilter) {
                $scope.appliedFilter['singleValueDate'] = angular.copy(report.singleValueDate);
            }
            rawData.singleValueDate = params[key];
        }

        // rate
        if (!!report.hasRateFilter) {
            key = reportParams['RATE_IDS'];
            params[key] = _.pluck(_.where(getRateListToShow(report), { selected: true }), 'id');
            // For the daily production rates; we are to send an array with group or allotment ids
            if (reportNames['DAILY_PRODUCTION_RATE'] === report.title) {
                var selectedCustomRates = _.pluck(_.where(getRateListToShow(report), {
                    selected: true,
                    id: null
                }), 'group_id');

                if (selectedCustomRates.length > 0) {
                    params[key] = _.without(params[key], null); // remove null entries in the rate_ids array (null entries would be there if custom rates were selected)
                    params['custom_rate_group_ids'] = selectedCustomRates;
                }
            }
        }

        /* if (!!report.hasRatesCodeFilter) {
            key = reportParams['RATE_IDS'];
            params[key] = getRatesListToShow(report);
        };*/

        // for restriction list
        if (!!report.hasRestrictionListFilter) {
            params[reportParams['RESTRICTION_IDS']] = _.pluck(_.where(report.hasRestrictionListFilter.data, { selected: true }), 'id');
        }

        if (!!report.hasDayUseFilter) {
            var inclDayUse = report[reportParams['INCLUDE_DAYUSE']];

            $scope.appliedFilter[reportParams['INCLUDE_DAYUSE']] = inclDayUse;
            params[reportParams['INCLUDE_DAYUSE']] = inclDayUse;
        }

        // for rate code
        if (!!report.hasRateCodeFilter) {
            if (report.hasRateCodeFilter.options.singleSelect) {
                var selectedRateCode = _.findWhere(report.hasRateCodeFilter.data, { selected: true });

                if (selectedRateCode) {
                    params[reportParams['RATE_ID']] = selectedRateCode.id;
                }
            } else {
                key = reportParams['RATE_IDS'];
                var selectedRates = getRatesListToShow(report);

                if (selectedRates.length > 0) {
                    params[key] = [];
                    _.each(selectedRates, function (rate) {
                        params[key].push(rate.id);
                        if (changeAppliedFilter) {
                            $scope.appliedFilter.rates.push(rate.description);
                        }
                    });

                    // in case if all rates are selected
                    if (changeAppliedFilter && report.hasRateCodeFilter.data.length === params[reportParams['RATE_IDS']].length) {
                        $scope.appliedFilter.rates = ['All Rates'];
                    }
                }
            }
        }

        // for room type filter
        if (!!report.hasRoomTypeFilter) {
            params[reportParams['ROOM_TYPE_IDS']] = _.pluck(_.where(report.hasRoomTypeFilter.data, { selected: true }), 'id');
        }

        // rate
        if (!!report.hasRateTypeFilter) {
            key = reportParams['RATE_TYPE_IDS'];
            params[key] = getSelectedRateTypes(report);
        }

        // include rate adjustment dates
        if (!!report.hasAdjustmentDateRange) {
            fromKey = reportParams['ADJUSTMENT_FROM_DATE'];
            untilKey = reportParams['ADJUSTMENT_TO_DATE'];
            /**/
            params[fromKey] = $filter('date')(report.fromAdjustmentDate, 'yyyy/MM/dd');
            params[untilKey] = $filter('date')(report.untilAdjustmentDate, 'yyyy/MM/dd');
            /**/
            if (changeAppliedFilter) {
                $scope.appliedFilter['adjustmentFromDate'] = angular.copy(report.fromAdjustmentDate);
                $scope.appliedFilter['adjustmentToDate'] = angular.copy(report.untilAdjustmentDate);
            }

            rawData.fromAdjustmentDate = params[fromKey];
            rawData.untilAdjustmentDate = params[untilKey];
        }

        // include times
        if (report.hasTimeFilter) {
            if (report.fromTime) {
                key = reportParams['FROM_TIME'];
                params[key] = report.fromTime;
                /**/
                if (changeAppliedFilter) {
                    $scope.appliedFilter['fromTime'] = angular.copy(report.fromTime);
                }
            }

            if (report.untilTime) {
                key = reportParams['TO_TIME'];
                params[key] = report.untilTime;
                /**/
                if (changeAppliedFilter) {
                    $scope.appliedFilter['toTime'] = angular.copy(report.untilTime);
                }
            }
        }

        // include VAT year
        if (report.hasLanguages) {
            key = reportParams['SELECTED_LANGUAGE'];
            params[key] = report.locale;

            if (changeAppliedFilter) {
                $scope.appliedFilter['selected_language'] = report.language;
            }
        }

        // include VAT year
        if (report.hasVatYear) {
            key = reportParams['VAT_YEAR'];
            params[key] = report.year;

            if (changeAppliedFilter) {
                $scope.appliedFilter['year'] = report.year;
            }
        }

        if (report.hasCompanyTravelAgentWithOrWithoutVat) {
            key = reportParams['WITH_VAT_NUMBER'];
            params[key] = report.with_vat_number;

            key = reportParams['WITHOUT_VAT_NUMBER'];
            params[key] = report.without_vat_number;

            if (changeAppliedFilter) {
                $scope.appliedFilter['with_vat_number'] = report.with_vat_number;
                $scope.appliedFilter['without_vat_number'] = report.without_vat_number;
            }
        }

        if (report.hasShowIncludeLongStays) {
            key = reportParams['INCLUDE_LONG_STAYS'];
            params[key] = report.include_long_stays;

            if (changeAppliedFilter) {
                $scope.appliedFilter['include_long_stays'] = report.include_long_stays;
            }
        }

        if (report.hasShowVatWithRates) {
            key = reportParams['SHOW_VAT_WITH_RATES'];
            params[key] = report.show_vat_with_rates;

            if (changeAppliedFilter) {
                $scope.appliedFilter['show_vat_with_rates'] = report.show_vat_with_rates;
            }
        }

        // include CICO filter
        if (!!report.hasCicoFilter) {
            checkInKey = reportParams['CHECKED_IN'];
            checkOutKey = reportParams['CHECKED_OUT'];
            /**/
            params[checkInKey] = getProperCICOVal('checked_in');
            params[checkOutKey] = getProperCICOVal('checked_out');
            /**/
            if (changeAppliedFilter) {
                if (params[checkInKey] && params[checkOutKey]) {
                    $scope.appliedFilter['cicoTypes'] = 'Check Ins & Check Outs';
                } else if (params[checkInKey]) {
                    $scope.appliedFilter['cicoTypes'] = 'Only Check Ins';
                } else if (params[checkOutKey]) {
                    $scope.appliedFilter['cicoTypes'] = 'Only Check Outs';
                }
            }
        }

        // include user ids
        if (report.hasUserFilter && report.empList.data.length) {
            selected = _.where(report.empList.data, { selected: true });

            if (selected.length > 0) {
                key = reportParams['USER_IDS'];
                params[key] = [];
                /**/
                _.each(selected, function (user) {
                    params[key].push(user.id);
                    /**/
                    if (changeAppliedFilter) {
                        $scope.appliedFilter.users.push(user.full_name || user.email);
                    }
                });

                // in case if all users are selected
                if (changeAppliedFilter && report.empList.data.length === selected.length) {
                    $scope.appliedFilter.users = ['All Users'];
                    // CICO-70792 - No need to pass the param, when select all is selected
                    delete params[key];
                }
            }
        }

        // include sort bys
        if (report.sortByOptions) {
            rawData.sortOptions = report.sortByOptions;
            if (!!report.chosenSortBy) {
                key = reportParams['SORT_FIELD'];
                params[key] = report.chosenSortBy;
            }
            /**/
            var _chosenSortBy = _.find(report.sortByOptions, function (item) {
                return item && item.value === report.chosenSortBy;
            });

            if (!!_chosenSortBy && 'boolean' === typeof _chosenSortBy.sortDir) {
                key = reportParams['SORT_DIR'];
                params[key] = _chosenSortBy.sortDir;
            }
            /**/
            if (changeAppliedFilter) {
                if (!!_chosenSortBy) {
                    $scope.appliedFilter['sortBy'] = _chosenSortBy.description;
                }
                if (!!_chosenSortBy && 'boolean' === typeof _chosenSortBy.sortDir) {
                    $scope.appliedFilter['sortDir'] = _chosenSortBy.sortDir ? 'Ascending' : 'Descending';
                }
            }
        }

        // include group bys
        if (report.groupByOptions) {
            key = '';
            /**/
            if ('DATE' === report.chosenGroupBy) {
                key = reportParams['GROUP_BY_DATE'];
            } else if ('USER' === report.chosenGroupBy) {
                key = reportParams['GROUP_BY_USER'];
            } else if ('GROUP_NAME' === report.chosenGroupBy) {
                key = reportParams['GROUP_BY_GROUP_NAME'];
            } else if ('CHARGE_TYPE' === report.chosenGroupBy) {
                key = reportParams['GROUP_BY_CHARGE_TYPE'];
            }

            /**/
            if (!!key) {
                params[key] = true;
                /**/
                if (changeAppliedFilter) {
                    $scope.appliedFilter['groupBy'] = key.replace('group_by_', '').replace('_', ' ');
                }
            }

            // patch
            if (report.title === reportNames['ADDON_FORECAST'] && ('ADDON' === report.chosenGroupBy || 'DATE' === report.chosenGroupBy)) {
                key = reportParams['ADDON_GROUP_BY'];
                params[key] = report.chosenGroupBy;
                rawData.chosenGroupBy = report.chosenGroupBy;
                /**/
                if (changeAppliedFilter) {
                    $scope.appliedFilter['groupBy'] = 'GROUP BY ' + report.chosenGroupBy;
                }
            }

            if (report.title === reportNames['ALLOWANCE_FORECAST'] && ('ALLOWANCE_CODE' === report.chosenGroupBy || 'DATE' === report.chosenGroupBy)) {
                key = reportParams['ADDON_GROUP_BY'];
                params[key] = report.chosenGroupBy;
                rawData.chosenGroupBy = report.chosenGroupBy;
                /**/
                if (changeAppliedFilter) {
                    $scope.appliedFilter['groupBy'] = 'GROUP BY ' + report.chosenGroupBy;
                }
            }
        }

        // reset and generate params for selected options
        if (report['hasGeneralOptions']['data'].length) {
            /**/
            _.each(report['hasGeneralOptions']['data'], function (each) {
                if (each.selected) {
                    key = each.paramKey;
                    params[key] = true;
                    /**/
                    if (changeAppliedFilter) {
                        $scope.appliedFilter.options.push(each.description);
                    }
                } else if (!each.selected && each.mustSend) {
                    key = each.paramKey;
                    params[key] = false;
                }
            });
        }

        // generate params for selected displays
        if (report['hasDisplay']['data'].length) {
            _.each(report['hasDisplay']['data'], function (each) {
                if (each.selected) {
                    key = each.paramKey;
                    params[key] = true;
                    /**/
                    if (changeAppliedFilter) {
                        $scope.appliedFilter.display.push(each.description);
                    }
                }
            });
        }

        // generate params for selected shows
        if (report['hasShow']['data'].length) {
            _.each(report['hasShow']['data'], function (each) {
                if (each.selected) {
                    key = each.paramKey;
                    params[key] = true;
                    /**/
                    if (changeAppliedFilter) {
                        $scope.appliedFilter.show.push(each.description);
                    }
                }
            });
        }

        // generate params for selected shows
        if (report['hasChargeTypes']['data'].length) {
            _.each(report['hasChargeTypes']['data'], function (each) {
                if (each.selected) {
                    key = each.paramKey;
                    params[key] = true;
                    /**/
                    if (changeAppliedFilter) {
                        $scope.appliedFilter.chargeTypes.push(each.description);
                    }
                }
            });

            // in case if all types are selected
            if (changeAppliedFilter && report['hasChargeTypes']['selectAll']) {
                $scope.appliedFilter.chargeTypes = ['Both'];
            }
        }

        // generate params for selected exclusions
        if (report['hasExclusions']['data'].length) {
            _.each(report['hasExclusions']['data'], function (each) {
                if (each.selected) {
                    key = each.paramKey;
                    params[key] = true;

                    if (changeAppliedFilter) {
                        $scope.appliedFilter.display.push(each.description);
                    }
                }
            });
        }

        // generate params for guest or account
        if (report['hasGuestOrAccountFilter']['data'].length) {
            _.each(report['hasGuestOrAccountFilter']['data'], function (each) {
                if (each.selected) {
                    key = each.paramKey;
                    params[key] = true;
                    /**/
                    if (changeAppliedFilter) {
                        $scope.appliedFilter.guestOrAccount.push(each.description);
                    }
                }
            });
        }

        // include company/ta
        if (report.hasOwnProperty('hasIncludeCompanyTa') && !!report.chosenIncludeCompanyTa) {
            key = report.hasIncludeCompanyTa.value.toLowerCase();
            params[key] = [];
            /**/
            _.each(report.chosenIncludeCompanyTa.split(', '), function (entry) {
                params[key].push(entry);
            });
            /* Note: Using the ui value here */
            if (changeAppliedFilter) {
                $scope.appliedFilter['companyTa'] = report.uiChosenIncludeCompanyTa;
            }
        }

        // include company/ta/group
        if (report.hasOwnProperty('hasIncludeCompanyTaGroup') && !!report.chosenIncludeCompanyTaGroup) {
            key = report.hasIncludeCompanyTaGroup.value.toLowerCase();
            params[key] = report.chosenIncludeCompanyTaGroup;
            params[reportParams['ENTITY_TYPE']] = report.chosenIncludeCompanyTaGroupType;
            /* Note: Using the ui value here */
            if (changeAppliedFilter) {
                $scope.appliedFilter['companyTaGroup'] = report.uiChosenIncludeCompanyTaGroup;
            }
        }

        // include company/ta/group
        if (report.hasOwnProperty('hasGroupCode') && !!report.uiChosenIncludeGroupCode) {
            key = report.hasGroupCode.value.toLowerCase();

            params[key] = [];
            /**/
            _.each(report.chosenIncludeGroupCode.split(', '), function (entry) {
                params[key].push(entry);
            });
            /* Note: Using the ui value here */
            if (changeAppliedFilter) {
                $scope.appliedFilter['groupCode'] = report.uiChosenIncludeGroupCode;
            }
        }

        // include group
        if (report.hasOwnProperty('hasIncludeGroup') && !!report.chosenIncludeGroup) {
            key = report.hasIncludeGroup.value.toLowerCase();
            params[key] = report.chosenIncludeGroup;
            /* Note: Using the ui value here */
            if (changeAppliedFilter) {
                $scope.appliedFilter['group'] = report.uiChosenIncludeGroup;
            }
        }

        // selected markets
        if (report.hasOwnProperty('hasMarketsList')) {
            selected = _.where(report['hasMarketsList']['data'], { selected: true });

            if (selected.length > 0) {
                key = reportParams['MARKET_IDS'];
                params[key] = [];
                /**/
                _.each(selected, function (market) {
                    params[key].push(market.value);
                    /**/
                    if (changeAppliedFilter) {
                        $scope.appliedFilter.markets.push(market.name);
                        $scope.appliedFilter.market_ids.push(market);
                    }
                });

                // in case if all markets are selected
                if (changeAppliedFilter && report['hasMarketsList']['data'].length === selected.length) {
                    $scope.appliedFilter.markets = ['All Markets'];
                }
            }
        }

        // selected source
        if (report.hasOwnProperty('hasSourcesList')) {
            selected = _.where(report['hasSourcesList']['data'], { selected: true });

            if (selected.length > 0) {
                key = reportParams['SOURCE_IDS'];
                params[key] = [];
                /**/
                _.each(selected, function (source) {
                    params[key].push(source.value);
                    /**/
                    if (changeAppliedFilter) {
                        $scope.appliedFilter.sources.push(source.name);
                    }
                });

                // in case if all sources are selected
                if (changeAppliedFilter && report['hasSourcesList']['data'].length === selected.length) {
                    $scope.appliedFilter.sources = ['All Sources'];
                }
            }
        }

        // selected origin
        if (report.hasOwnProperty('hasOriginsList')) {
            selected = _.where(report['hasOriginsList']['data'], { selected: true });

            if (selected.length > 0) {
                key = reportParams['BOOKING_ORIGIN_IDS'];
                params[key] = [];
                /**/
                _.each(selected, function (origin) {
                    params[key].push(origin.value);
                    /**/
                    if (changeAppliedFilter) {
                        $scope.appliedFilter.origins.push(origin.name);
                    }
                });

                // in case if all origins are selected
                if (changeAppliedFilter && report['hasOriginsList']['data'].length === selected.length) {
                    $scope.appliedFilter.origins = ['All Origins'];
                }
            }
        }

        // include guarantee type
        if (report.hasOwnProperty('hasGuaranteeType')) {
            selected = _.where(report['hasGuaranteeType']['data'], { selected: true });

            if (selected.length > 0) {
                key = reportParams['INCLUDE_GUARANTEE_TYPE'];
                params[key] = [];
                /**/
                _.each(selected, function (guarantee) {
                    params[key].push(guarantee.name);
                    /**/
                    if (changeAppliedFilter) {
                        $scope.appliedFilter.guarantees.push(guarantee.name);
                    }
                });

                // in case if all guarantee type is selected
                if (changeAppliedFilter && report['hasGuaranteeType']['data'].length === selected.length) {
                    $scope.appliedFilter.guarantees = ['All Guarantees'];
                }
            }
        }

        // include segments
        if (report.hasOwnProperty('hasSegmentsList')) {
            selected = _.where(report['hasSegmentsList']['data'], { selected: true });

            if (selected.length > 0) {
                key = reportParams['SEGMENT_IDS'];
                params[key] = [];
                /**/
                _.each(selected, function (segment) {
                    params[key].push(segment.value);
                    /**/
                    if (changeAppliedFilter) {
                        $scope.appliedFilter.segments.push(segment.name);
                    }
                });

                // in case if all guarantee type is selected
                if (changeAppliedFilter && report['hasSegmentsList']['data'].length === selected.length) {
                    $scope.appliedFilter.segments = ['All Segments'];
                }
            }
        }

        // include charge groups
        if (report.hasOwnProperty('hasByChargeGroup')) {
            selected = _.where(report['hasByChargeGroup']['data'], { selected: true });

            if (selected.length > 0) {
                key = reportParams['CHARGE_GROUP_IDS'];
                params[key] = [];
                /**/
                _.each(selected, function (cg) {
                    params[key].push(cg.id);
                    /**/
                    if (changeAppliedFilter) {
                        $scope.appliedFilter.chargeGroups.push(cg.description);
                    }
                });

                // in case if all charge groups is selected
                if (changeAppliedFilter && report['hasByChargeGroup']['data'].length === selected.length) {
                    $scope.appliedFilter.chargeGroups = ['All Groups'];
                }
            }
        }

        // include charge code
        if (report.hasOwnProperty('hasByChargeCode')) {
            selected = _.where(report['hasByChargeCode']['data'], { selected: true });

            if (selected.length > 0) {
                key = reportParams['CHARGE_CODE_IDS'];
                params[key] = [];
                /**/
                _.each(selected, function (cc) {
                    params[key].push(cc.id);
                    /**/
                    if (changeAppliedFilter) {
                        $scope.appliedFilter.chargeCodes.push(cc.description);
                    }
                });

                // in case if all charge code is selected
                if (changeAppliedFilter && report['hasByChargeCode']['data'].length === selected.length) {
                    $scope.appliedFilter.chargeCodes = ['All Codes'];
                }
            }
        }

        // include status
        if (report.hasOwnProperty('hasTransactionCategory')) {
            var selectedItem = report['hasTransactionCategory']['selected'] ? report['hasTransactionCategory']['selected'] : report['hasTransactionCategory']['data'][0];

            key = reportParams['TRANSACTION_CATEGORY'];
            params[key] = selectedItem.value;
            if (changeAppliedFilter) {
                $scope.appliedFilter.transaction_category = selectedItem.value;
            }
        }

        // include hold status
        if (report.hasOwnProperty('hasHoldStatus')) {
            selected = _.where(report['hasHoldStatus']['data'], { selected: true });

            if (selected.length > 0) {
                key = reportParams['HOLD_STATUS_IDS'];
                params[key] = [];
                /**/
                _.each(selected, function (status) {
                    params[key].push(status.id.toString());
                    /**/
                    if (changeAppliedFilter) {
                        $scope.appliedFilter.holdStatuses.push(status.name);
                    }
                });

                // in case if all charge code is selected
                if (changeAppliedFilter && report['hasHoldStatus']['data'].length === selected.length) {
                    $scope.appliedFilter.holdStatuses = ['All Status'];
                }
            }
        }

        // include addon groups
        if (report.hasOwnProperty('hasAddonGroups')) {
            selected = _.where(report['hasAddonGroups']['data'], { selected: true });

            if (selected.length > 0) {
                key = reportParams['ADDONS_GROUPS_IDS'];
                params[key] = [];
                /**/
                _.each(selected, function (group) {
                    params[key].push(group.id);
                    /**/
                    if (changeAppliedFilter) {
                        $scope.appliedFilter.addonGroups.push(group.description);
                    }
                });

                // in case if all addon groups are selected
                if (changeAppliedFilter && report['hasAddonGroups']['data'].length === selected.length) {
                    $scope.appliedFilter.addonGroups = ['All Addon Groups'];
                }
            }
        }

        // include addons
        if (report.hasOwnProperty('hasAddons')) {
            selected = _.where(report['hasAddons']['data'], { selected: true });

            if (selected.length > 0) {
                key = reportParams['ADDONS_IDS'];
                params[key] = [];
                /**/
                _.each(selected, function (each) {
                    params[key].push(each.addon_id);
                    /**/
                    if (changeAppliedFilter) {
                        $scope.appliedFilter.addons.push(each.addon_name);
                    }
                });

                // in case if all addon groups are selected
                if (changeAppliedFilter && report['hasAddons']['data'].length === selected.length) {
                    $scope.appliedFilter.addons = ['All Addons'];
                }
            }
        }

        if (report.hasOwnProperty('hasAllowanceCodes')) {
            selected = _.where(report['hasAllowanceCodes']['data'], { selected: true });

            if (selected.length > 0) {
                key = reportParams['ADDONS_IDS'];
                params[key] = [];
                /**/
                _.each(selected, function (each) {
                    params[key].push(each.id);
                    /**/
                    if (changeAppliedFilter) {
                        $scope.appliedFilter.addons.push(each.addon_name);
                    }
                });

                // in case if all addon groups are selected
                if (changeAppliedFilter && report['hasAllowanceCodes']['data'].length === selected.length) {
                    $scope.appliedFilter.addons = ['All Addons'];
                }
            }
        }

        // include addons
        if (report.hasOwnProperty('hasReservationStatus')) {
            selected = _.where(report['hasReservationStatus']['data'], { selected: true });

            if (selected.length > 0) {
                if (report['title'] === reportNames['ACTIONS_MANAGER']) {
                    key = 'reservation_status';
                    params[key] = [];
                    /**/
                    _.each(selected, function (each) {
                        params[key].push(each.value.toString());
                        /**/
                        if (changeAppliedFilter) {
                            $scope.appliedFilter.reservationStatus.push(each.value);
                        }
                    });

                    // in case if all reservation status are selected
                    if (changeAppliedFilter && report['hasReservationStatus']['data'].length === selected.length) {
                        $scope.appliedFilter.reservationStatus = ['All Reservation Status'];
                    }
                } else {
                    key = reportParams['RESERVATION_STATUS'];
                    params[key] = [];
                    /**/
                    _.each(selected, function (each) {
                        params[key].push(each.id.toString());
                        /**/
                        if (changeAppliedFilter) {
                            $scope.appliedFilter.reservationStatus.push(each.status);
                        }
                    });

                    // in case if all reservation status are selected
                    if (changeAppliedFilter && report['hasReservationStatus']['data'].length === selected.length) {
                        $scope.appliedFilter.reservationStatus = ['All Reservation Status'];
                    }
                }
            }
        }

        // include departments
        if (report.hasOwnProperty('hasDepartments')) {
            selected = _.where(report['hasDepartments']['data'], { selected: true });

            if (selected.length > 0) {
                key = reportParams['ASSIGNED_DEPARTMENTS'];
                params[key] = [];
                /**/
                _.each(selected, function (each) {
                    params[key].push(each.id.toString());
                    /**/
                    if (changeAppliedFilter) {
                        $scope.appliedFilter.assigned_departments.push(each.name);
                    }
                });

                // in case if all reservation status are selected
                if (changeAppliedFilter && report['hasDepartments']['data'].length === selected.length) {
                    $scope.appliedFilter.assigned_departments = ['All Departments'];
                }
            }
        }

        // include payment type
        if (report.hasOwnProperty('hasPaymentType')) {
            selected = _.where(report['hasPaymentType']['data'], { selected: true });

            if (selected.length > 0) {
                key = reportParams['PAYMENT_TYPES'];
                params[key] = [];
                /**/
                _.each(selected, function (each) {
                    params[key].push(each.id.toString());
                    /**/
                    if (changeAppliedFilter) {
                        $scope.appliedFilter.payment_types.push(each.description);
                    }
                });
                // in case if all status are selected
                if (changeAppliedFilter && report['hasPaymentType']['data'].length === selected.length) {
                    $scope.appliedFilter.payment_types = ['All Payments'];
                    delete params[key];
                }
            }
        }

        // include travel agents
        if (report.hasOwnProperty('hasTravelAgentsSearch')) {
            selected = _.where(report['hasTravelAgentsSearch']['data'], { selected: true });

            if (selected.length > 0) {
                key = reportParams['TRAVEL_AGENTS'];
                params[key] = [];
                /**/
                _.each(selected, function (each) {
                    params[key].push(each.id.toString());
                    /**/
                    if (changeAppliedFilter) {
                        $scope.appliedFilter.travel_agent_ids.push(each.name);
                    }
                });

                // in case if all reservation status are selected
                if (changeAppliedFilter && report['hasTravelAgentsSearch']['data'].length === selected.length) {
                    $scope.appliedFilter.travel_agent_ids = ['All Travel Agents'];
                }
            }
        }

        // include country ids
        if (report.hasOwnProperty('hasIncludeCountry')) {
            selected = _.where(report['hasIncludeCountry']['data'], { selected: true });

            if (selected.length > 0) {
                key = reportParams['COUNTRY'];
                params[key] = [];
                /**/
                _.each(selected, function (each) {
                    params[key].push(each.id.toString());
                    /**/
                    if (changeAppliedFilter) {
                        $scope.appliedFilter.country_ids.push(each.id);
                    }
                });

                // in case if all reservation status are selected
                if (changeAppliedFilter && report['hasIncludeCountry']['data'].length === selected.length) {
                    $scope.appliedFilter.hasIncludeCountry = ['All countries'];
                    params[key].push('-1'); // For the UNDEFINED entry
                }
            }
        }

        // include Aging days
        if (report.hasOwnProperty('hasIncludeAgingBalance')) {
            selected = _.where(report['hasIncludeAgingBalance']['data'], { selected: true });

            if (selected.length > 0) {
                key = reportParams['AGING_BALANCE'];
                params[key] = [];
                /**/
                _.each(selected, function (each) {
                    params[key].push(each.id.toString());
                    /**/
                    if (changeAppliedFilter) {
                        $scope.appliedFilter.age_buckets.push(each.id);
                    }
                });

                // in case if all reservation status are selected
                if (changeAppliedFilter && report['hasIncludeAgingBalance']['data'].length === selected.length) {
                    $scope.appliedFilter.age_buckets = ['All Aging Balance'];
                }
            }
        }

        // include Tax Exempt Types
        if (report.hasOwnProperty('hasIncludeTaxExempts')) {
            selected = _.where(report['hasIncludeTaxExempts']['data'], { selected: true });

            if (selected.length > 0) {
                key = reportParams['TAX_EXEMPT_TYPE'];
                params[key] = [];
                /**/
                _.each(selected, function (each) {
                    params[key].push(each.id.toString());
                    /**/
                    if (changeAppliedFilter) {
                        $scope.appliedFilter.tax_exempt_type_ids.push(each.id);
                    }
                });

                // in case if all tax exempts are selected
                if (changeAppliedFilter && report['hasIncludeTaxExempts']['data'].length === selected.length) {
                    $scope.appliedFilter.tax_exempt_type_ids = [];
                    params[key] = []; // If all tax exempts selected
                }
            }
        }

        // Include accounts
        if (report.hasOwnProperty('hasAccountSearch')) {
            selected = _.where(report['hasAccountSearch']['data'], { selected: true });

            if (selected.length > 0) {
                key = reportParams['ACCOUNT_SEARCH'];
                params[key] = [];
                /**/
                _.each(selected, function (accounts) {
                    params[key].push(accounts.id);
                    /**/
                    if (changeAppliedFilter) {
                        $scope.appliedFilter.account_ids.push(accounts.id);
                    }
                });

                // in case if all guarantee type is selected
                if (changeAppliedFilter && report['hasAccountSearch']['data'].length === selected.length) {
                    $scope.appliedFilter.guarantees = ['All Accounts'];
                }
            }
        }

        // include completion status
        if (report.hasOwnProperty('hasCompletionStatus')) {
            selected = _.where(report['hasCompletionStatus']['data'], { selected: true });

            if (selected.length > 0) {
                key = reportParams['COMPLETION_STATUS'];
                params[key] = [];
                /**/
                _.each(selected, function (each) {
                    params[key].push(each.id.toString());
                    /**/
                    if (changeAppliedFilter) {
                        $scope.appliedFilter.completion_status.push(each.id);
                    }
                });

                // in case if all reservation status are selected
                if (changeAppliedFilter && report['hasCompletionStatus']['data'].length === selected.length) {
                    $scope.appliedFilter.completion_status = ['All Status'];
                }
            }
        }

        // selected origin
        if (report.hasOwnProperty('hasOriginFilter')) {
            selected = _.where(report['hasOriginFilter']['data'], { selected: true });

            if (selected.length > 0) {
                key = reportParams['ORIGIN_VALUES'];
                params[key] = [];
                /**/
                _.each(selected, function (source) {
                    params[key].push(source.value);
                    /**/
                    if (changeAppliedFilter) {
                        $scope.appliedFilter.origins.push(source.description);
                    }
                });

                // in case if all sources are selected
                if (changeAppliedFilter && report['hasOriginFilter']['data'].length === selected.length) {
                    $scope.appliedFilter.origins = ['All Origins'];
                }
            }
        }

        // selected URLs
        if (report.hasOwnProperty('hasURLsList')) {
            selected = _.where(report['hasURLsList']['data'], { selected: true });

            if (selected.length > 0) {
                key = reportParams['ORIGIN_URLS'];
                params[key] = [];
                /**/
                _.each(selected, function (source) {
                    params[key].push(source.id);
                    /**/
                    if (changeAppliedFilter) {
                        $scope.appliedFilter.origin_urls.push(source.name);
                    }
                });

                // in case if all sources are selected
                if (changeAppliedFilter && report['hasURLsList']['data'].length === selected.length) {
                    $scope.appliedFilter.origin_urls = ['All URLs'];
                }
            }
        }
        // selected Campaign types
        if (report.hasOwnProperty('hasCampaignTypes')) {
            selected = _.where(report['hasCampaignTypes']['data'], { selected: true });

            if (selected.length > 0) {
                key = reportParams['CAMPAIGN_TYPES'];
                params[key] = [];
                /**/
                _.each(selected, function (source) {
                    params[key].push(source.value);
                    /**/
                    if (changeAppliedFilter) {
                        $scope.appliedFilter.campaign_types.push(source.name);
                    }
                });

                // in case if all sources are selected
                if (changeAppliedFilter && report['hasCampaignTypes']['data'].length === selected.length) {
                    $scope.appliedFilter.campaign_types = ['All Campaigns'];
                }
            }
        }

        //
        if (report.hasOwnProperty('hasFloorList')) {
            selected = _.where(report['hasFloorList']['data'], { selected: true });

            if (selected.length > 0 && report['hasFloorList']['data'].length !== selected.length) {
                key = reportParams['FLOOR'];
                params[key] = [];
                /**/
                _.each(selected, function (source) {
                    params[key].push(source.id);
                    /**/
                    if (changeAppliedFilter) {
                        $scope.appliedFilter.floorList.push(source.floor_number);
                    }
                });
            }
            // in case if all floors are selected
            if (changeAppliedFilter && report['hasFloorList']['data'].length === selected.length) {
                $scope.appliedFilter.floorList = ['All Floors'];
            }
        }

        // has min revenue
        if (report.hasOwnProperty('hasMinRevenue') && !!report.hasMinRevenue.data) {
            key = report.hasMinRevenue.value.toLowerCase();
            params[key] = report.hasMinRevenue.data;
            /* Note: Using the ui value here */
            if (changeAppliedFilter) {
                $scope.appliedFilter['hasMinRevenue'] = report.hasMinRevenue.data;
            }
        }

        // has min room nights
        if (report.hasOwnProperty('hasMinRoomNights') && !!report.hasMinRoomNights.data) {
            key = report.hasMinRoomNights.value.toLowerCase();
            params[key] = report.hasMinRoomNights.data;
            /* Note: Using the ui value here */
            if (changeAppliedFilter) {
                $scope.appliedFilter['hasMinRoomNights'] = report.hasMinRoomNights.data;
            }
        }

        // has min no of days not occupied
        if (report.hasOwnProperty('hasMinNoOfDaysNotOccupied') && !!report.hasMinNoOfDaysNotOccupied.data) {
            key = report.hasMinNoOfDaysNotOccupied.value.toLowerCase();
            params[key] = report.hasMinNoOfDaysNotOccupied.data;
            /* Note: Using the ui value here */
            if (changeAppliedFilter) {
                $scope.appliedFilter['hasMinNoOfDaysNotOccupied'] = report.hasMinNoOfDaysNotOccupied.data;
            }
        }

        // CICO-34650
        if (report.hasShowActionables) {
            if (report.showActionables) {
                key = reportParams['SHOW_ACTIONABLES'];
                if (report.showActionables === 'BOTH') {
                    params[key] = ['GUEST', 'GROUP'];
                } else {
                    params[key] = [report.showActionables];
                }

                if (changeAppliedFilter) {
                    if (report.showActionables === 'BOTH') {
                        $scope.appliedFilter.show.push('GUESTS');
                        $scope.appliedFilter.show.push('GROUPS');
                    } else {
                        $scope.appliedFilter.show.push(report.showActionables);
                    }
                }
            }
        }

        if (report.hasShowUpsellOnly) {
            key = reportParams['SHOW_UPSELL_ONLY'];

            params[key] = report.show_upsell_only;

            if (changeAppliedFilter) {
                $scope.appliedFilter['show_upsell_only'] = report.show_upsell_only;
            }
        }

        // CICO-35959 - show room revenue by default
        if (report.title === reportNames['MARKET_SEGMENT_STAT_REPORT']) {
            params['show_room_revenue'] = _.isUndefined(report.showRoomRevenue) ? true : report.showRoomRevenue;
        }
        // keep a copy of the current params
        $scope.oldParams = angular.copy(params);

        // We are sending the additional params to the api, as its required while view/printing
        // the report from the report inbox
        if ($rootScope.isBackgroundReportsEnabled) {
            // This is a temp fix. Once api fixes the issue this should be removed
            params.per_page = 99999;
            params.rawData = _.extend(reportUtils.reduceObject(report), rawData);
            params.appliedFilter = $scope.appliedFilter;
        }

        // for tax receipt types list
        if (!!report.hasTaxPaymentReceiptTypes) {
            params[reportParams['TAX_RECEIPT_TYPE_VALUES']] = _.pluck(_.where(report.hasTaxPaymentReceiptTypes.data, { selected: true }), 'value');
        }

        return params;
    }

    /**
     * Should we show export button
     * @return {Boolean}reportUtils
     */
    $scope.shouldShowExportButton = function (report) {
        var chosenReport = report || reportsSrv.getChoosenReport();

        return !_.isUndefined(chosenReport) && !_.isEmpty(chosenReport) && chosenReport.display_export_button;
    };

    $scope.exportCSV = function (report) {
        var chosenReport = report || reportsSrv.getChoosenReport(),
            loadPage = 1,
            resultPerPageOverride = true,
            changeAppliedFilter = false;

        $scope.invokeApi(reportsSrv.exportCSV, {
            url: $scope.getExportPOSTUrl(chosenReport),
            payload: genParams(chosenReport, loadPage, resultPerPageOverride, changeAppliedFilter)
        }, function (response) {
            $scope.$emit('hideLoader');
        }, function (errorMessage) {
            $scope.$emit('hideLoader');
            $scope.errorMessage = errorMessage;
        });
    };
    /*
     * methode generates url string for csv - for report inbox and Normal report
     * @params Object Selected report object
     * @return String generated url
     * */
    $scope.getExportPOSTUrl = function (report) {
        var chosenReport = report || reportsSrv.getChoosenReport(),
            exportUrl = '';

        if (_.isEmpty(chosenReport)) {
            // I dont know why chosenReport becoming undefined in one loop, need to check with Vijay
            return exportUrl;
        }

        if (chosenReport.generatedReportId) {
            exportUrl = 'api/generated_reports/' + chosenReport.generatedReportId + '/export';
        } else {
            exportUrl = '/api/reports/' + chosenReport.id + '/submit.csv?';
        }

        return exportUrl;
    };

    // generate reports
    $scope.genReport = function (changeView, loadPage, resultPerPageOverride, reloadreportNeeded) {
        var chosenReport = reportsSrv.getChoosenReport(),
            page = loadPage || 1,
            msg = '';

        $scope.reloadreportNeeded = reloadreportNeeded;
        changeView = 'boolean' === typeof changeView ? changeView : true;
        var params = genParams(chosenReport, page, resultPerPageOverride || $scope.resultsPerPage);

        var fetchTravelAgents = function fetchTravelAgents(travel_agent_id, pageNo) {
            var paramsToApi = {};

            paramsToApi.travel_agent_id = travel_agent_id;
            paramsToApi.page = pageNo;
            paramsToApi.from_date = params.fiterFromDate;
            paramsToApi.to_date = params.filterToDate;
            paramsToApi.per_page = reportParams['TRAVEL_AGENTS_PER_PAGE_COUNT'];
            paramsToApi.reportTitle = reportNames['TRAVEL_AGENT_COMMISSIONS'];
            if (chosenReport.generatedReportId) {
                var options = {
                    params: paramsToApi,
                    successCallBack: self.sucssCallback,
                    failureCallBack: errorCallback
                };
                $scope.callAPI(reportsSubSrv.fetchGeneratedReportDetails, options);
            }
        };

        var responseWithInsidePagination = function responseWithInsidePagination(response) {
            _.each(response.results, function (item) {
                // Pagination data added for each TA
                item.insidePaginationData = {
                    id: item.travel_agent_id,
                    api: [fetchTravelAgents, item.travel_agent_id],
                    perPage: reportParams['TRAVEL_AGENTS_PER_PAGE_COUNT']
                };
                $timeout(function () {
                    $scope.$broadcast('updatePagination', item.travel_agent_id);
                }, 1000);
            });
            return response;
        };

        var fetchReceipts = function fetchReceipts(sub_category_type_id, pageNo) {
            var paramsToApi = {};

            paramsToApi.receipt_sub_category_type_id = sub_category_type_id;
            paramsToApi.page = pageNo;
            paramsToApi.per_page = reportParams['RECEIPTS_PER_PAGE_COUNT'];
            paramsToApi.from_date = $scope.summaryCounts.vat_date_from;
            paramsToApi.to_date = $scope.summaryCounts.vat_date_to;
            $scope.$broadcast('updateReceipts', paramsToApi);
        };

        var responseForOutputTax = function responseForOutputTax(response) {
            _.each(response.results, function (item) {
                // Pagination data added for each TA
                item.insidePaginationData = {
                    id: item.sub_category_type_id,
                    api: [fetchReceipts, item.sub_category_type_id],
                    perPage: reportParams['RECEIPTS_PER_PAGE_COUNT']
                };
                $timeout(function () {
                    $scope.$broadcast('updatePagination', item.sub_category_type_id);
                }, 1000);
            });
            return response;
        };

        var responseForTaxExempt = function responseForTaxExempt(response) {

            _.each(response.results, function (item) {
                var previousTaxExemptTypeId = '',
                    taxExemptTypes = [],
                    rowSpanIndex = 0,
                    k = 0;

                _.each(item.dates, function (dateItem, dateIndex) {
                    var currentTaxExemptTypeId = dateItem.tax_exempt_type_id;

                    if (previousTaxExemptTypeId !== currentTaxExemptTypeId) {
                        taxExemptTypes.push(dateItem.tax_exempt_type_id);
                        previousTaxExemptTypeId = currentTaxExemptTypeId;
                        if (dateIndex !== 0) {
                            item.dates[dateIndex].is_next = true;
                            item.dates[rowSpanIndex].rowSpanValue = k;
                            item.dates[rowSpanIndex].isRowSpanApplied = true;
                            item.dates[rowSpanIndex].isLastTaxExemptType = false;
                            rowSpanIndex = dateIndex;
                        }
                        k = 1;
                    } else {
                        k++;
                        item.dates[dateIndex].isRowSpanApplied = false;
                    }
                    if (item.dates.length === dateIndex + 1) {
                        item.dates[rowSpanIndex].rowSpanValue = k;
                        item.dates[rowSpanIndex].isRowSpanApplied = true;
                        item.dates[rowSpanIndex].isLastTaxExemptType = true;
                    }
                });
                item.totalTaxExempts = taxExemptTypes.length;
            });
            return response;
        };

        // fill in data into seperate props
        var updateDS = function updateDS(response) {
            if (chosenReport.title === reportNames['TRAVEL_AGENT_COMMISSIONS']) {
                // Response modified to accomodate inside pagination
                // For TA reservations
                response = responseWithInsidePagination(response);
            }
            if (chosenReport.title === reportNames['TAX_OUTPUT_REPORT']) {
                // Response modified to accomodate inside pagination
                // For Category Receipts
                response = responseForOutputTax(response);
            }
            if (chosenReport.title === reportNames['TAX_EXEMPT']) {
                // Response modified to handle the different tax exempt types in each date
                response = responseForTaxExempt(response);
            }

            $scope.totals = response.totals || [];
            $scope.headers = response.headers || [];
            $scope.subHeaders = response.sub_headers || [];
            $scope.results = response.results || [];
            $scope.resultsTotalRow = response.results_total_row || [];
            $scope.summaryCounts = response.summary_counts || false;
            $scope.reportGroupedBy = response.group_by || chosenReport.chosenGroupBy || '';

            // track the total count
            $scope.totalCount = response.total_count || 0;
            $scope.currCount = response.results ? response.results.length : 0;

            // CICO-36186
            if (chosenReport.title === reportNames['COMPARISION_BY_DATE']) {
                $timeout(function () {
                    $scope.$broadcast('updatePagination', 'COMPARISION_BY_DATE');
                }, 50);
            }

            // CICO-36269
            if (chosenReport.title === reportNames['TRAVEL_AGENT_COMMISSIONS']) {
                $scope.$broadcast('UPDATE_RESULTS', $scope.results);
                $timeout(function () {
                    $scope.$broadcast('updatePagination', 'TA_COMMISSION_REPORT_MAIN');
                }, 50);
            }

            if (chosenReport.title === reportNames['TAX_OUTPUT_REPORT']) {
                $scope.$broadcast('UPDATE_TAX_OUTPUT_RESULTS', $scope.results);
            }

            if (reportPaginationIds[chosenReport.title]) {
                $timeout(function () {
                    $scope.$broadcast('updatePagination', reportPaginationIds[chosenReport.title]);
                }, 50);
            }

            var weekendDays = reportsSubSrv.weekendDays || [];

            if (chosenReport.title === reportNames['FORECAST_BY_DATE'] || chosenReport.title === reportNames['FORECAST_GUEST_GROUPS']) {
                _.each($scope.results, function (reportRow) {
                    var date = tzIndependentDate(reportRow.date);

                    reportRow.isWeekend = isWeekendDay(weekendDays, date);
                });
            }

            // CICO-39128 - Added to preserve the page no while sorting and update the page no in
            // CICO-49259
            if (page !== 1) {
                $timeout(function () {
                    $scope.$broadcast('updatePageNo', page);
                }, 50);
            }
        };

        self.sucssCallback = function (response) {
            if ($rootScope.isBackgroundReportsEnabled && $state.current.name !== 'rover.reports.inbox'
            // flag to decide whether its paginated response or not, configured from rvReportsSubSrv.js
            && !response.isPaginatedResponse) {
                $scope.$emit('hideLoader');
                ngDialog.open({
                    template: '/assets/partials/reports/backgroundReports/rvReportGenerationStatusPopup.html',
                    scope: $scope,
                    closeByDocument: true
                });
                return;
            }

            updateDS(response);

            $scope.errorMessage = [];
            $scope.$emit('hideLoader');

            if ($rootScope.isBackgroundReportsEnabled) {
                $scope.appliedFilter = chosenReport.appliedFilter;
            }

            // Checks whether the print is clicked from the report inbox
            if (reportsSrv.getPrintClickedState()) {
                sntActivity.start("PRINTING_FROM_REPORT_INBOX");
                // This flag will make the report details page and its controller
                $scope.viewStatus.showDetails = true;
                if (_.isUndefined($scope.printOptions.showModal)) {
                    $timeout(function () {
                        $scope.$broadcast('PRINT_REPORT');
                    }, 1000);
                } else {
                    $scope.$broadcast('PRINT_MODAL_REPORT');
                }
            } else {
                if ($state.current.name !== 'rover.reports.show') {

                    $state.go('rover.reports.show', {
                        action: msg || '',
                        report: angular.copy($scope.selectedReport) || chosenReport
                    });
                } else {
                    $state.go('.', {
                        page: loadPage,
                        action: msg || ''
                    }, {
                        location: true,
                        inherit: true,
                        relative: $state.$current,
                        notify: false
                    });
                }

                $scope.$broadcast('FILTER_SELECTION_UPDATED', $scope.filter_selected_value);

                if (msg) {
                    $scope.$broadcast(msg);
                }
            }
        };

        var errorCallback = function errorCallback(response) {
            updateDS(response);

            $scope.errorMessage = response;
            $scope.$emit('hideLoader');

            $log.info(reportMsgs['REPORT_API_FAILED']);
            $rootScope.$broadcast(reportMsgs['REPORT_API_FAILED'], response);
        };

        $scope.clearErrorMessage();

        params.reportTitle = chosenReport.title;

        // Load API data for the pagination directive
        var loadAPIData = function loadAPIData(pageNo) {
            $scope.currentPage = pageNo;
            $scope.genReport(false, pageNo);
        };

        // CICO-36186 - Implemented the new pagination for Comparison report
        if (chosenReport.title === reportNames['COMPARISION_BY_DATE']) {
            loadAPIData = function loadAPIData(pageNo) {
                $scope.genReport(false, pageNo);
            };

            $scope.comparisonByDatePagination = {
                id: 'COMPARISION_BY_DATE',
                api: loadAPIData,
                perPage: 25
            };
        }

        if (chosenReport.title === reportNames['TRAVEL_AGENT_COMMISSIONS']) {

            loadAPIData = function loadAPIData(pageNo) {
                $scope.genReport(false, pageNo);
                $scope.$broadcast('TRAVEL_AGENT_COMMISSIONS_SCROLL');
            };

            $scope.commisionReportTAPagination = {
                id: 'TA_COMMISSION_REPORT_MAIN',
                api: loadAPIData,
                perPage: reportParams['TRAVEL_AGENTS_PER_PAGE_COUNT']
            };
        }

        if (!changeView && !loadPage) {
            msg = reportMsgs['REPORT_UPDATED'];
        } else if (loadPage && !resultPerPageOverride) {
            msg = reportMsgs['REPORT_PAGE_CHANGED'];
        } else if (resultPerPageOverride) {
            msg = reportMsgs['REPORT_PRINTING'];
        } else {
            msg = reportMsgs['REPORT_SUBMITED'];
        }

        // CICO-35669 - Add new pagination controls for selected reports
        if (reportPaginationIds[chosenReport.title]) {
            $scope.paginationConfig = {
                id: reportPaginationIds[chosenReport.title],
                api: loadAPIData,
                perPage: 25,
                currentPage: loadPage
            };
        }

        params['action'] = $state.params.action || msg;
        // fetch generated inbox report
        if (chosenReport.generatedReportId) {
            var options = {
                params: params,
                successCallBack: self.sucssCallback,
                failureCallBack: errorCallback
            };

            $scope.callAPI(reportsSubSrv.fetchGeneratedReportDetails, options);
        } else {
            $scope.invokeApi(reportsSubSrv.fetchReportDetails, params, self.sucssCallback, errorCallback);
        }
    };

    $scope.clearErrorMessage = function () {
        $scope.errorMessage = [];
    };

    var touchedReport;

    $scope.returnuiChosenReport = function (item) {
        touchedReport = item;
    };

    $scope.removeCompTaGrpId = function (item, uiValue, modelValue) {
        if (!item[uiValue]) {
            item[modelValue] = '';
        }
    };

    var split = function split(val) {
        return val.split(/,\s*/);
    };

    var extractLast = function extractLast(term) {
        return split(term).pop();
    };

    var activeUserAutoCompleteObj = [];

    var userAutoCompleteCommon = {
        source: function source(request, response) {
            var term = extractLast(request.term);

            $scope.$emit('showLoader');
            reportsSubSrv.fetchActiveUsers(term).then(function (data) {
                var entry = {},
                    found;

                $scope.activeUserList = data;

                activeUserAutoCompleteObj = [];
                $.map(data, function (user) {
                    entry = {
                        label: user.full_name || user.email,
                        value: user.id
                    };
                    activeUserAutoCompleteObj.push(entry);
                });

                found = $.ui.autocomplete.filter(activeUserAutoCompleteObj, term);
                response(found);

                $scope.$emit('hideLoader');
            });
        },
        select: function select(event, ui) {
            var uiValue = split(this.value);

            uiValue.pop();
            uiValue.push(ui.item.label);
            uiValue.push('');

            this.value = uiValue.join(', ');
            setTimeout(function () {
                $scope.$apply(function () {
                    touchedReport.uiChosenUsers = uiValue.join(', ');
                });
            }, 100);
            return false;
        },
        close: function close() {
            var uiValues = split(this.value);
            var modelVal = [];

            _.each(activeUserAutoCompleteObj, function (user) {
                var match = _.find(uiValues, function (label) {
                    return label === user.label;
                });

                if (!!match) {
                    modelVal.push(user.value);
                }
            });

            setTimeout(function () {
                $scope.$apply(function () {
                    touchedReport.chosenUsers = modelVal;
                });
            }, 10);
        },
        change: function change() {
            var uiValues = split(this.value);
            var modelVal = [];

            _.each(activeUserAutoCompleteObj, function (user) {
                var match = _.find(uiValues, function (label) {
                    return label === user.label;
                });

                if (!!match) {
                    modelVal.push(user.value);
                }
            });

            setTimeout(function () {
                $scope.$apply(function () {
                    touchedReport.chosenUsers = modelVal;
                });
            }, 10);
        },
        focus: function focus(event, ui) {
            return false;
        }
    };

    $scope.listUserAutoCompleteOptions = angular.extend({
        position: {
            'my': 'left bottom',
            'at': 'left top',
            'collision': 'flip'
        }
    }, userAutoCompleteCommon);

    $scope.detailsUserAutoCompleteOptions = angular.extend({
        position: {
            'my': 'left bottom',
            'at': 'right+20 bottom',
            'collision': 'flip'
        }
    }, userAutoCompleteCommon);

    // for Company TA only
    var activeCompTaCompleteAry = [];
    var autoCompleteForCompTa = {
        source: function source(request, response) {
            var term = extractLast(request.term);

            $scope.$emit('showLoader');
            reportsSubSrv.fetchComTaGrp(term, true).then(function (data) {
                var found;

                _.each(data, function (item) {
                    var hasIn = _.find(activeCompTaCompleteAry, function (added) {
                        return added.value === item.id.replace('account_', '');
                    });

                    if (!hasIn) {
                        activeCompTaCompleteAry.push({
                            label: item.name,
                            value: item.id.replace('account_', ''), // remove 'account_' part and just get the id
                            type: item.type
                        });
                    }
                });

                found = $.ui.autocomplete.filter(activeCompTaCompleteAry, term);
                response(found);

                $scope.$emit('hideLoader');
            });
        },
        select: function select(event, ui) {
            var uiValue = split(this.value);

            uiValue.pop();
            uiValue.push(ui.item.label);
            uiValue.push('');

            this.value = uiValue.join(', ');
            $timeout(function () {
                $scope.$apply(function () {
                    touchedReport.uiChosenIncludeCompanyTa = uiValue.join(', ');
                });
            }, 100);
            return false;
        },
        close: function close() {
            var uiValues = split(this.value);
            var modelVal = [];

            $log.info(activeCompTaCompleteAry);

            if (!uiValues.length) {
                activeCompTaCompleteAry = [];

                $timeout(function () {
                    $scope.$apply(function () {
                        touchedReport.chosenIncludeCompanyTa = modelVal.join('');
                    });
                }, 10);
            } else {
                _.each(activeCompTaCompleteAry, function (compTa) {
                    var match = _.find(uiValues, function (label) {
                        return label === compTa.label;
                    });

                    if (!!match) {
                        modelVal.push(compTa.value);
                    }
                });

                $timeout(function () {
                    $scope.$apply(function () {
                        touchedReport.chosenIncludeCompanyTa = modelVal.join(', ');
                    });
                }, 10);
            }
        },
        change: function change() {
            var uiValues = split(this.value);
            var modelVal = [];

            $log.info(activeCompTaCompleteAry);

            _.each(activeCompTaCompleteAry, function (compTa) {
                var match = _.find(uiValues, function (label) {
                    return label === compTa.label;
                });

                if (!!match) {
                    modelVal.push(compTa.value);
                }
            });

            $timeout(function () {
                $scope.$apply(function () {
                    touchedReport.chosenIncludeCompanyTa = modelVal.join(', ');
                });
            }, 10);
        },
        focus: function focus() {
            return false;
        }
    };

    $scope.compTaAutoCompleteOnList = angular.extend({
        position: {
            my: 'left top',
            at: 'left bottom',
            collision: 'flip'
        }
    }, autoCompleteForCompTa);

    $scope.compTaAutoCompleteOnDetails = angular.extend({
        position: {
            my: 'left bottom',
            at: 'right+20 bottom',
            collision: 'flip'
        }
    }, autoCompleteForCompTa);

    // for Company TA Group
    var autoCompleteForCompTaGrp = {
        source: function source(request, response) {
            $scope.$emit('showLoader');
            reportsSubSrv.fetchComTaGrp(request.term).then(function (data) {
                var list = [];
                var entry = {};

                $.map(data, function (each) {
                    entry = {
                        label: each.name,
                        value: each.id,
                        type: each.type
                    };
                    list.push(entry);
                });

                response(list);
                $scope.$emit('hideLoader');
            });
        },
        select: function select(event, ui) {

            this.value = ui.item.label;
            $timeout(function () {
                $scope.$apply(function () {
                    touchedReport.uiChosenIncludeCompanyTaGroup = ui.item.label;
                    touchedReport.chosenIncludeCompanyTaGroup = ui.item.value;
                    touchedReport.chosenIncludeCompanyTaGroupType = ui.item.type;
                });
            }, 100);
            return false;
        },
        focus: function focus() {
            return false;
        }
    };

    $scope.compTaGrpAutoCompleteOnList = angular.extend({
        position: {
            my: 'left top',
            at: 'left bottom',
            collision: 'flip'
        }
    }, autoCompleteForCompTaGrp);

    $scope.compTaGrpAutoCompleteOnDetails = angular.extend({
        position: {
            my: 'left bottom',
            at: 'right+20 bottom',
            collision: 'flip'
        }
    }, autoCompleteForCompTaGrp);

    // for Company TA Group
    var groupCodeArray = [],
        groupCodeIds = [];

    var autoCompleteForGroupCode = {
        source: function source(request, response) {
            var term = extractLast(request.term);

            $scope.$emit('showLoader');
            reportsSubSrv.fetchGroupCode(term).then(function (data) {
                var found;

                groupCodeArray = [];
                _.each(data, function (item) {

                    groupCodeArray.push({
                        label: item.group_code,
                        value: item.id
                    });
                });

                found = $.ui.autocomplete.filter(groupCodeArray, term);
                response(found);

                $scope.$emit('hideLoader');
            });
        },
        select: function select(event, ui) {

            var uiValue = split(this.value);

            uiValue.pop();
            uiValue.push(ui.item.label);
            uiValue.push('');

            groupCodeIds.push(ui.item.value);

            this.value = uiValue.join(', ');
            $timeout(function () {
                $scope.$apply(function () {
                    touchedReport.uiChosenIncludeGroupCode = uiValue.join(', ');
                    touchedReport.chosenIncludeGroupCode = _.uniq(groupCodeIds).join(', ');
                });
            }, 100);
            return false;
        },
        focus: function focus() {
            return false;
        }
    };

    $scope.groupCodeOnList = angular.extend({
        position: {
            my: 'left top',
            at: 'left bottom',
            collision: 'flip'
        }
    }, autoCompleteForGroupCode);

    $scope.groupCodeOnDetails = angular.extend({
        position: {
            my: 'left bottom',
            at: 'right+20 bottom',
            collision: 'flip'
        }
    }, autoCompleteForGroupCode);

    // for Group
    var autoCompleteForGrp = {
        source: function source(request, response) {
            $scope.$emit('showLoader');
            var selectedReport = $scope.selectedReport.report;
            var requestParams = {},
                fromKey = '',
                toKey = '';

            requestParams.q = request.term;

            if (!!selectedReport && selectedReport.title === reportNames['GROUP_ROOMS_REPORT']) {

                if (!!selectedReport.fromDate) {
                    fromKey = reportParams['FROM_DATE'];
                    requestParams[fromKey] = $filter('date')(selectedReport.fromDate, 'yyyy/MM/dd');
                }

                if (!!selectedReport.untilDate) {
                    toKey = reportParams['TO_DATE'];
                    requestParams[toKey] = $filter('date')(selectedReport.untilDate, 'yyyy/MM/dd');
                }
            }
            reportsSubSrv.fetchGroups(requestParams).then(function (data) {
                var list = [];
                var entry = {};

                $.map(data, function (each) {
                    entry = {
                        label: each.group_name,
                        value: each.id,
                        type: 'GROUP'
                    };
                    list.push(entry);
                });

                response(list);
                $scope.$emit('hideLoader');
            });
        },
        select: function select(event, ui) {
            this.value = ui.item.label;
            $timeout(function () {
                $scope.$apply(function () {
                    touchedReport.uiChosenIncludeGroup = ui.item.label;
                    touchedReport.chosenIncludeGroup = ui.item.value;
                });
            }, 100);
            return false;
        },
        focus: function focus() {
            return false;
        }
    };

    $scope.grpAutoCompleteOnList = angular.extend({
        position: {
            my: 'left top',
            at: 'left bottom',
            collision: 'flip'
        }
    }, autoCompleteForGrp);

    $scope.grpAutoCompleteOnDetails = angular.extend({
        position: {
            my: 'left bottom',
            at: 'right+20 bottom',
            collision: 'flip'
        }
    }, autoCompleteForGrp);

    // Closes the dialog
    $scope.closeDialog = function () {
        ngDialog.close();
    };

    // Navigate to reports inbox
    $scope.navigateToReportInbox = function () {
        $scope.closeDialog();
        $state.go('rover.reports.inbox');
    };

    $scope.reload = function () {
        $state.reload();
    };

    // Listener for updating the report header
    var reportHeadingUpdateListener = $scope.$on('UPDATE_REPORT_HEADING', function (event, data) {
        $scope.heading = data.heading;
    });

    // Destroy the listener
    $scope.$on('$destroy', reportHeadingUpdateListener);

    (function () {
        var transitionParams = $state.transition.params();

        $scope.reloadreportNeeded = false;

        if (transitionParams.report) {
            $scope.selectedReport = transitionParams.report;
            $scope.genReport(true, transitionParams.page);
            // CICO-55905 - Report list should be processed again to set the flags once comming back from other unreleated states
            $scope.shouldProcessReportList = true;
        }
    })();
}]);