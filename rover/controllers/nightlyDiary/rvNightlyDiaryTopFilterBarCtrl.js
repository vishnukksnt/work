'use strict';

angular.module('sntRover').controller('rvNightlyDiaryTopFilterBarController', ['$scope', '$rootScope', '$state', '$stateParams', '$filter', 'ngDialog', 'rvUtilSrv', 'rvPermissionSrv', function ($scope, $rootScope, $state, $stateParams, $filter, ngDialog, rvUtilSrv, rvPermissionSrv) {

    BaseCtrl.call(this, $scope);

    var isDateChangedFromInitialState = false,
        TIME_OFFSET = 15;

    /*
     * Utility method to shift date.
     * @param {String}  - startDate : base date to be shifted.
     * @param {Number}  - shiftCount : no of days needed to shift.
     * @param {Boolean} - isRightShift : whether shift to future date or previous date.
     * @return {String} - calculated date.
     */
    var getDateShift = function getDateShift(startDate, shiftCount, isRightShift, isInclusive) {
        var date = tzIndependentDate(startDate);
        /* For calculating diaryData.toDate, the shiftCount is 6. In case of diaryData.fromDate the shiftCount is 7.
           isInclusive is true in case of toDate. */

        if (isInclusive) {
            shiftCount -= 1;
        }
        if (isRightShift) {
            date.setDate(date.getDate() + shiftCount);
        } else {
            date.setDate(date.getDate() - shiftCount);
        }
        date = $filter('date')(date, 'yyyy-MM-dd');
        return date;
    };

    // Utility method to check for a given date range spans over two months.
    var checkDateRangeHaveMultipleMonths = function checkDateRangeHaveMultipleMonths() {
        var startDate = tzIndependentDate($scope.diaryData.fromDate),
            endDate = tzIndependentDate($scope.diaryData.toDate),
            hasMultipleMonth = false;

        // if the date range having multiple months.
        if (startDate.getMonth() !== endDate.getMonth()) {
            hasMultipleMonth = true;
            if ($scope.diaryData.numberOfDays === 21) {
                var isReachedSecondMonth = false;

                $scope.diaryData.firstMonthDateList = [];
                $scope.diaryData.secondMonthDateList = [];
                angular.forEach($scope.diaryData.datesGridData, function (item) {
                    var dateObj = tzIndependentDate(item.date);

                    if (dateObj.getDate() === 1) {
                        isReachedSecondMonth = true;
                    }
                    if (isReachedSecondMonth) {
                        $scope.diaryData.secondMonthDateList.push(item);
                    } else {
                        $scope.diaryData.firstMonthDateList.push(item);
                    }
                });
            }
        }
        return hasMultipleMonth;
    };

    var init = function init() {
        $scope.diaryData.fromDate = $filter('date')(tzIndependentDate($scope.diaryData.fromDate), 'yyyy-MM-dd');
        $scope.diaryData.toDate = getDateShift($scope.diaryData.fromDate, $scope.diaryData.numberOfDays, true, true);
        $scope.diaryData.firstMonthDateList = [];
        $scope.diaryData.secondMonthDateList = [];
        $scope.diaryData.hasMultipleMonth = false;
        $scope.diaryData.rightFilter = 'RESERVATION_FILTER';
    },
        initBookFilterData = function initBookFilterData() {
        var bookRoomViewFilter = $scope.diaryData.bookRoomViewFilter;

        if ($rootScope.businessDate > $scope.diaryData.fromDate) {
            bookRoomViewFilter.fromDate = $rootScope.businessDate;
        } else {
            bookRoomViewFilter.fromDate = $scope.diaryData.fromDate;
        }
        bookRoomViewFilter.toDate = moment(tzIndependentDate(bookRoomViewFilter.fromDate)).add(1, 'days').format($rootScope.momentFormatForAPI);

        bookRoomViewFilter.arrivalTimeList = rvUtilSrv.generateTimeDuration();
        bookRoomViewFilter.departureTimeList = rvUtilSrv.generateTimeDuration();
        bookRoomViewFilter.arrivalTime = bookRoomViewFilter.hotelCheckinTime;
        bookRoomViewFilter.departureTime = bookRoomViewFilter.hotelCheckoutTime;

        $scope.diaryData.rightFilter = 'RESERVATION_FILTER';
    };

    /* 
     *  Show calendar popup.
     *  @param {string} [clicked component name - 'MAIN_FILTER', 'BOOK_FILTER_ARRIVAL', 'BOOK_FILTER_DEPARTURE']
     */
    $scope.clickedDatePicker = function (clickedFrom) {
        $scope.clickedFrom = clickedFrom;
        ngDialog.open({
            template: '/assets/partials/nightlyDiary/rvNightlyDiaryDatePicker.html',
            controller: 'RVNightlyDiaryTopFilterDatePickerController',
            className: 'single-date-picker',
            scope: $scope
        });
    };

    // Catching event from date picker controller while date is changed.
    $scope.addListener('DATE_CHANGED', function (event, clickedFrom) {
        var bookRoomViewFilter = $scope.diaryData.bookRoomViewFilter;

        if (clickedFrom === 'MAIN_FILTER') {
            var isRightShift = true;

            if ($scope.diaryData.numberOfDays === 7) {
                $scope.diaryData.toDate = getDateShift($scope.diaryData.fromDate, 7, isRightShift, true);
            } else {
                $scope.diaryData.toDate = getDateShift($scope.diaryData.fromDate, 21, isRightShift, true);
            }
            $scope.$emit('UPDATE_UNASSIGNED_RESERVATIONLIST');
            $scope.$emit('UPDATE_RESERVATIONLIST');
            $scope.$emit('UPDATE_EVENTS_COUNT');
            isDateChangedFromInitialState = true;

            // CICO-63546 : if user already selects avl tab, and then navigating to past dates 
            // Toggle back to reservation mode.
            var dateDiff = moment($rootScope.businessDate).diff(moment($scope.diaryData.fromDate), 'days');

            if ($scope.diaryData.isBookRoomViewActive && dateDiff > 6) {
                $scope.toggleBookedOrAvailable();
            }
        } else if (bookRoomViewFilter.fromDate === bookRoomViewFilter.toDate) {
            // For BOOK filter date selection.
            // Handle 0 night scenario. Reset the time selections to '09:00 AM' & '05:00 PM'.
            bookRoomViewFilter.arrivalTime = '09:00';
            bookRoomViewFilter.departureTime = '17:00';

            bookRoomViewFilter.arrivalTimeList = rvUtilSrv.generateTimeDuration(null, bookRoomViewFilter.departureTime, TIME_OFFSET * -1);
            bookRoomViewFilter.departureTimeList = rvUtilSrv.generateTimeDuration(bookRoomViewFilter.arrivalTime, null, TIME_OFFSET);
        } else if (clickedFrom === 'BOOK_FILTER_ARRIVAL' || clickedFrom === 'BOOK_FILTER_DEPARTURE') {
            if (bookRoomViewFilter.arrivalTime !== bookRoomViewFilter.hotelCheckinTime) {
                bookRoomViewFilter.arrivalTime = bookRoomViewFilter.hotelCheckinTime;
            }
            if (bookRoomViewFilter.departureTime !== bookRoomViewFilter.hotelCheckoutTime) {
                bookRoomViewFilter.departureTime = bookRoomViewFilter.hotelCheckoutTime;
            }
            bookRoomViewFilter.arrivalTimeList = rvUtilSrv.generateTimeDuration();
            bookRoomViewFilter.departureTimeList = rvUtilSrv.generateTimeDuration();
        }
    });
    // Catching event from main controller, when API is completed.
    $scope.addListener('FETCH_COMPLETED_DATE_LIST_DATA', function () {
        $scope.diaryData.hasMultipleMonth = checkDateRangeHaveMultipleMonths();
    });

    // To toggle 7/21 button.
    $scope.toggleSwitchMode = function () {
        var isRightShift = true;

        if ($scope.diaryData.numberOfDays === 21) {
            $scope.diaryData.toDate = getDateShift($scope.diaryData.fromDate, 7, isRightShift, true);
            $scope.diaryData.numberOfDays = 7;
        } else {
            $scope.diaryData.toDate = getDateShift($scope.diaryData.fromDate, 21, isRightShift, true);
            $scope.diaryData.numberOfDays = 21;
        }
        $scope.$emit('UPDATE_EVENTS_COUNT');
        $scope.$emit('UPDATE_RESERVATIONLIST');
    };

    /*
     * Method to calculate from date and to date after shifting.
     * @param {Boolean} - isRightShift : whether shift to future date or previous date.
     * @return {String} - calculated date.
     */
    var calculateFromDateAndToDate = function calculateFromDateAndToDate(isRightShift) {
        var fromDate = angular.copy(tzIndependentDate($scope.diaryData.fromDate));
        var nextShift = isRightShift;

        if (!isRightShift) {
            // If the fromDate is a shift to the left, then the toDate is a shift right from the new fromDate.
            nextShift = true;
        }
        if ($scope.diaryData.numberOfDays === 7) {
            $scope.diaryData.fromDate = getDateShift(fromDate, 7, isRightShift, false);
            $scope.diaryData.toDate = getDateShift($scope.diaryData.fromDate, 7, nextShift, true);
        } else {
            $scope.diaryData.fromDate = getDateShift(fromDate, 21, isRightShift, false);
            $scope.diaryData.toDate = getDateShift($scope.diaryData.fromDate, 21, nextShift, true);
        }
        isDateChangedFromInitialState = true;
    };

    // To handle click on left date shift.
    $scope.clickedDateLeftShift = function () {
        var isRightShift = false;

        calculateFromDateAndToDate(isRightShift);
        $scope.$emit('UPDATE_EVENTS_COUNT');
        $scope.$emit('UPDATE_UNASSIGNED_RESERVATIONLIST');
        $scope.$emit('UPDATE_RESERVATIONLIST');
    };

    // To handle click on right date shift.
    $scope.clickedDateRightShift = function () {
        var isRightShift = true;

        calculateFromDateAndToDate(isRightShift);
        $scope.$emit('UPDATE_EVENTS_COUNT');
        $scope.$emit('UPDATE_UNASSIGNED_RESERVATIONLIST');
        $scope.$emit('UPDATE_RESERVATIONLIST');
    };

    // To handle click on reset button.
    $scope.clickedResetButton = function () {
        $scope.diaryData.fromDate = moment(tzIndependentDate($rootScope.businessDate)).subtract(1, 'days').format($rootScope.momentFormatForAPI);
        init();
        $scope.$emit('RESET_RIGHT_FILTER_BAR_AND_REFRESH_DIARY');
        $scope.$emit('UPDATE_UNASSIGNED_RESERVATIONLIST', 'RESET');
        $scope.$emit('HIDE_ASSIGN_ROOM_SLOTS');

        // If book view is active, reset to reservation view
        if ($scope.diaryData.showBookFilterPanel && $scope.diaryData.isBookRoomViewActive) {
            $scope.toggleBookedOrAvailable();
        }
    };

    // To toggle filter and unassigned list.
    $scope.toggleFilter = function (activeTab) {
        var filterHasValue = $scope.diaryData.selectedRoomTypes.length > 0 || $scope.diaryData.selectedFloors.length > 0;

        // While switch from Filter Bar to Unassigned List Bar, Clear filters and Refresh Diary.
        if (filterHasValue && $scope.diaryData.rightFilter !== activeTab && activeTab === 'UNASSIGNED_RESERVATION' && !$scope.diaryData.isReservationSelected) {
            $scope.$emit('RESET_RIGHT_FILTER_BAR_AND_REFRESH_DIARY');
        } else if (activeTab === 'RESERVATION_FILTER' && $scope.diaryData.isAssignRoomViewActive && !$scope.diaryData.isReservationSelected) {
            $scope.$emit('RESET_RIGHT_FILTER_BAR_AND_REFRESH_DIARY');
        }

        // If iPad ( width < 1280 ) , we will hide side bars if we click on current active button.
        // For other resoltions ( > 1280 ) we will toggle bw/n UNASSIGNED_RESERVATIONLIST , Filter bar.
        if (window.innerWidth < 1280 && $scope.diaryData.rightFilter === activeTab) {
            $scope.diaryData.rightFilter = '';
        } else if ($scope.diaryData.rightFilter !== activeTab) {
            $scope.diaryData.rightFilter = activeTab;
        }
    };

    // Catching event from main controller, when API is completed.
    $scope.addListener('TOGGLE_FILTER', function (e, value) {
        $scope.toggleFilter(value);
    });

    // Handle Nigthtly/Hourly toggle
    $scope.toggleHourlyNightly = false;
    $scope.navigateToHourlyDiary = function () {
        var dateToSend = $scope.diaryData.fromDate,
            businessDateMinusOne = moment(tzIndependentDate($rootScope.businessDate)).subtract(1, 'days').format($rootScope.momentFormatForAPI);

        if ($scope.diaryData.fromDate === businessDateMinusOne && !isDateChangedFromInitialState) {
            dateToSend = $rootScope.businessDate;
        }
        $state.go("rover.diary", {
            checkin_date: dateToSend,
            origin: 'NIGHTLY_DIARY'
        });
        $scope.toggleHourlyNightly = true;
    };

    /*
     *  Utility method to check whether we need to show Toggle DIARY D/N
     *  Based on settings values inside Reservation settings.
     */
    $scope.hideToggleMenu = function () {

        /**
         *  A = settings.day_use_enabled (true / false)
         *  B = settings.hourly_rates_for_day_use_enabled (true / false)
         *  C = settings.hourly_availability_calculation ('FULL' / 'LIMITED')
         *
         *  A == false => 1. Default with nightly Diary. No navigation to Hourly ( we can hide the toggle from UI ).
         *  A == true && B == false => 3. Default with nightly Diary. Able to view Hourly ( we can show the toggle from UI ).
         *  A == true && B == true && C == 'FULL' => 4. Default with Hourly Diary. Able to view Nightly ( we can show the toggle from UI ).
         *  A == true && B == true && C == 'LIMITED' => 3. Default with nightly Diary. Able to view Hourly ( we can show the toggle from UI ).
         */

        var diaryConfig = $rootScope.hotelDiaryConfig,
            hideToggleMenu = false;

        // A == false => 1. Default with nightly Diary. No navigation to Hourly ( we can hide the toggle from UI ).
        if (!diaryConfig.dayUseEnabled) {
            hideToggleMenu = true;
        }

        return hideToggleMenu;
    };

    // Flag CreateReservation permission
    var hasCreateReservationPermission = function hasCreateReservationPermission() {
        return rvPermissionSrv.getPermissionValue('CREATE_RESERVATION');
    };

    // CICO-63546 : Disable RES/AVL toggle -
    // While RES mode is active & diff bw/n businessDate and FromDate > 6.
    $scope.disableAvlToggle = function () {
        var isHideAvlToggle = false,
            dateDiff = moment($rootScope.businessDate).diff(moment($scope.diaryData.fromDate), 'days');

        if (!$scope.diaryData.isBookRoomViewActive && dateDiff > 6 || !hasCreateReservationPermission()) {
            isHideAvlToggle = true;
        }

        return isHideAvlToggle;
    };

    // CICO-63546 : Disable Left Shift << button -
    // While AVL mode is active & diff bw/n businessDate and FromDate >= 0.
    $scope.disableLeftDateShift = function () {
        var isHideAvlToggle = false,
            dateDiff = moment($rootScope.businessDate).diff(moment($scope.diaryData.fromDate), 'days');

        if ($scope.diaryData.isBookRoomViewActive && dateDiff >= 0) {
            isHideAvlToggle = true;
        }

        return isHideAvlToggle;
    };

    // To toggle Booked/Available button.
    $scope.toggleBookedOrAvailable = function () {
        $scope.diaryData.showBookFilterPanel = !$scope.diaryData.showBookFilterPanel;
        if ($scope.diaryData.showBookFilterPanel) {
            initBookFilterData();
        }
        // Toggle back to VIEW mode from BOOK.
        if ($scope.diaryData.isBookRoomViewActive) {
            $scope.diaryData.isBookRoomViewActive = !$scope.diaryData.isBookRoomViewActive;
            $scope.$emit('TOGGLE_BOOK_AVAILABLE');
        }
    };

    $scope.clickedFindRooms = function () {
        $scope.diaryData.isBookRoomViewActive = true;
        // Set nights count.
        $scope.diaryData.bookRoomViewFilter.nights = moment($scope.diaryData.bookRoomViewFilter.toDate).diff(moment($scope.diaryData.bookRoomViewFilter.fromDate), 'days');
        $scope.$emit('TOGGLE_BOOK_AVAILABLE');
    };
    // Handle arrival time changes.
    $scope.arrivalTimeChanged = function () {
        var bookRoomViewFilter = $scope.diaryData.bookRoomViewFilter;

        // Handle 0 night usecse
        if (bookRoomViewFilter.fromDate === bookRoomViewFilter.toDate) {
            bookRoomViewFilter.departureTimeList = rvUtilSrv.generateTimeDuration(bookRoomViewFilter.arrivalTime, null, TIME_OFFSET);
        }
    };
    // Handle departure time changes.
    $scope.departureTimeChanged = function () {
        var bookRoomViewFilter = $scope.diaryData.bookRoomViewFilter;

        // Handle 0 night usecse
        if (bookRoomViewFilter.fromDate === bookRoomViewFilter.toDate) {
            bookRoomViewFilter.arrivalTimeList = rvUtilSrv.generateTimeDuration(null, bookRoomViewFilter.departureTime, TIME_OFFSET * -1);
        }
    };
    // Check whether Reservation Filter button needed to be active.
    $scope.checkForResFilterActiveClass = function () {
        /*
         *  If screen width is between 1280 and 1599 and no filter is choosed on screen,
         *  We will activate RESERVATION_FILTER as default.
         */
        if (window.innerWidth >= 1280 && window.innerWidth <= 1599 && $scope.diaryData.rightFilter === '') {
            $scope.diaryData.rightFilter = 'RESERVATION_FILTER';
        }

        return window.innerWidth > 1599 || $scope.diaryData.rightFilter === 'RESERVATION_FILTER';
    };
    // Check whether Unasigned Reservation button needed to be active.
    $scope.checkForUnassignedResActiveClass = function () {
        return window.innerWidth > 1599 || $scope.diaryData.rightFilter === 'UNASSIGNED_RESERVATION';
    };

    init();
}]);