'use strict';

angular.module('sntRover').controller('rvDateRangeModalCtrl', ['$scope', 'ngDialog', '$filter', 'dateFilter', '$rootScope', 'rvUtilSrv', 'rvTwoMonthCalendarEventConstants', function ($scope, ngDialog, $filter, dateFilter, $rootScope, util, rvTwoMonthCalendarEventConstants) {
    'use strict';

    var VERTICAL_SCROLL = 'vertical-scroll';

    // Set/Initialise all the scrollers
    var setScroller = function setScroller() {
        var scrollerOptions = {
            tap: true,
            preventDefault: false
        };

        // Set scrollers
        $scope.setScroller(VERTICAL_SCROLL, scrollerOptions);
    };

    setScroller();

    /**
    * on tapping set button
    */
    $scope.updateClicked = function () {
        var updatedData = {
            fromDate: $scope.fromDate,
            toDate: $scope.toDate
        };

        $scope.$emit(rvTwoMonthCalendarEventConstants.TWO_MONTH_CALENDAR_DATE_UPDATED, updatedData);
        $scope.closeDialog();
    };

    /**
     * callback when to date choosed
     * @param  {Object} dateText
     * @param  {Object} datePicker
     */
    var toDateSelected = function toDateSelected(dateText, datePicker) {
        $scope.toDate = new tzIndependentDate(util.get_date_from_date_picker(datePicker));
        $scope.fromDate = $scope.fromDate > $scope.toDate ? $scope.toDate : $scope.fromDate;
    };

    /**
     * callback when from date choosed
     * @param  {Object} dateText
     * @param  {Object} datePicker
     */
    var fromDateSelected = function fromDateSelected(dateText, datePicker) {
        $scope.fromDate = new tzIndependentDate(util.get_date_from_date_picker(datePicker));
        $scope.toDate = $scope.fromDate > $scope.toDate ? $scope.fromDate : $scope.toDate;
        $scope.toDateOptions.minDate = tzIndependentDate($scope.fromDate);
        $scope.toDateOptions.maxDate = formMaxDateRangeForToDate();
        if ($scope.toDate > $scope.toDateOptions.maxDate) {
            $scope.toDate = $scope.toDateOptions.maxDate;
        }
    };

    /**
     * @return {String/Date Object} [description]
     */
    var formMaxDateRangeForToDate = function formMaxDateRangeForToDate() {
        if (_.isEmpty($scope.maxRange)) {
            return '';
        }
        var date = new tzIndependentDate($scope.fromDate);
        // year

        if (!_.isUndefined($scope.maxRange.year)) {
            date.setFullYear(date.getFullYear() + $scope.maxRange.year);
        }

        // months
        if (!_.isUndefined($scope.maxRange.month)) {
            date.setMonth(date.getMonth() + $scope.maxRange.month);
        }

        // days
        if (!_.isUndefined($scope.maxRange.day)) {
            date.setDate(date.getDate() + $scope.maxRange.day);
        }

        // to adjust the 1+30, or 1+365
        date.setDate(date.getDate() - 1);
        return date;
    };

    /**
    * will set the date picker options
    */
    var initializeDatePicker = function initializeDatePicker() {
        var commonDateOptions = {
            firstDay: 1,
            changeYear: true,
            changeMonth: true
        };

        $scope.fromDateOptions = Object.assign({
            onSelect: fromDateSelected
        }, commonDateOptions);

        $scope.toDateOptions = Object.assign({
            minDate: tzIndependentDate($scope.fromDate),
            maxDate: formMaxDateRangeForToDate(),
            onSelect: toDateSelected
        }, commonDateOptions);
    };

    (function () {

        var allParamsForCalendarExist = !!$scope.ngDialogData && 'fromDate' in $scope.ngDialogData && 'toDate' in $scope.ngDialogData;

        if (!allParamsForCalendarExist) {
            // if some of the params is missing from ngDialog initialization
            console.error('Unable to initialize two month calendar, you may have missed the required params to initalize the calendar view');
            return;
        }

        if (!_.isDate($scope.ngDialogData.fromDate) || !_.isDate($scope.ngDialogData.toDate)) {
            console.error('Unable to initialize two month calendar, from date or to date expecting a date object ');
            return;
        }

        var dialogData = $scope.ngDialogData;

        $scope.fromDate = new tzIndependentDate(dialogData.fromDate);
        $scope.toDate = new tzIndependentDate(dialogData.toDate);

        $scope.maxRange = !_.isUndefined(dialogData.maxRange) ? {
            year: dialogData.maxRange.year,
            month: dialogData.maxRange.month,
            day: dialogData.maxRange.day
        } : {};

        initializeDatePicker();
    })();
}]);