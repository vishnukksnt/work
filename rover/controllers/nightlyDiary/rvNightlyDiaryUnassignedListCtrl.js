'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

angular.module('sntRover').controller('rvNightlyDiaryUnassignedListController', ['$scope', '$rootScope', 'RVNightlyDiarySrv', 'ngDialog', function ($scope, $rootScope, RVNightlyDiarySrv, ngDialog) {

    BaseCtrl.call(this, $scope);
    $scope.diaryData.selectedUnassignedReservation = {};
    $scope.businessDate = $rootScope.businessDate;
    $scope.searchQuery = '';
    var initialUnassignedListData = angular.copy($scope.diaryData.unassignedReservationList.reservations);

    var selectUnassignedListItem = function selectUnassignedListItem(item) {
        // If we are in selected reservation mode, going to cancel the selection.
        if ($scope.diaryData.isEditReservationMode && $scope.currentSelectedReservation.type !== 'UNASSIGNED_RESERVATION') {
            $scope.$emit('CANCEL_RESERVATION_EDITING');
        }
        $scope.diaryData.isReservationSelected = true;
        $scope.diaryData.selectedUnassignedReservation = item;
        $scope.diaryData.roomAssignmentFilters = {};
        var successCallBack = function successCallBack(responce) {
            $scope.diaryData.roomAssignmentFilters = responce.data;
            $scope.diaryData.roomAssignmentFilters.roomTypeId = item.room_type_id;
            $scope.diaryData.roomAssignmentFilters.floorId = '';
            $scope.diaryData.roomAssignmentFilters.roomFeatureIds = [];
            $scope.diaryData.roomAssignmentFilters.type = 'ASSIGN_ROOM';
            $scope.$emit('APPLY_GUEST_PREFERENCE_FILTER_TOP');
        },
            postData = {
            'reservation_id': item.reservation_id
        },
            options = {
            params: postData,
            successCallBack: successCallBack
        };

        $scope.callAPI(RVNightlyDiarySrv.getPreferences, options);
    },
        unSelectUnassignedListItem = function unSelectUnassignedListItem() {
        $scope.diaryData.selectedUnassignedReservation = {};
        $scope.diaryData.isReservationSelected = false;
        $scope.diaryData.isCancelledMoveOrAssign = true;
        $scope.$emit("RESET_RIGHT_FILTER_BAR_AND_REFRESH_DIARY");
    };

    /**
     *  Handle unassigned reservation items
     *  @param {int} - [index value of reservations]
     */
    $scope.clickedUnassignedItem = function (index) {
        var item = $scope.diaryData.unassignedReservationList.reservations[index];

        if (item.reservation_id === $scope.diaryData.selectedUnassignedReservation.reservation_id) {
            unSelectUnassignedListItem();
        } else {
            selectUnassignedListItem(item);
            var currentSelectedReservation = _extends({}, item, {
                id: item.reservation_id,
                guest_details: {
                    full_name: item.fullName,
                    image: ''
                },
                type: 'UNASSIGNED_RESERVATION'
            });

            $scope.$emit('CLICKED_UNASSIGNED_RESERVATION', currentSelectedReservation);
        }
    };

    $scope.addListener('SUCCESS_ROOM_ASSIGNMENT', function () {
        var unassignedReservationList = $scope.diaryData.unassignedReservationList.reservations;

        // Update unassigned reservation list...
        unassignedReservationList = _.reject(unassignedReservationList, function (obj) {
            return obj.reservation_id === $scope.diaryData.selectedUnassignedReservation.reservation_id;
        });

        $scope.diaryData.unassignedReservationList.reservations = [];
        $scope.diaryData.unassignedReservationList.reservations = unassignedReservationList;
        $scope.diaryData.selectedUnassignedReservation = {};
        initialUnassignedListData = angular.copy(unassignedReservationList);

        $scope.$emit('HIDE_ASSIGN_ROOM_SLOTS');
        $scope.$emit('CANCEL_UNASSIGNED_RESERVATION_MAIN');
    });

    // Method to fetch Unassigned reservations list.
    // reservationId - id which needed to be selected by default.
    var fetchUnassignedReservationList = function fetchUnassignedReservationList(reservationId) {
        var successCallBackFetchList = function successCallBackFetchList(data) {
            $scope.errorMessage = '';
            $scope.diaryData.unassignedReservationList = data;
            initialUnassignedListData = angular.copy(data.reservations);
            $scope.searchQuery = '';

            // Select an unassigned reservation from here if reservationId is passed.
            if (reservationId) {
                var unassignedReservationList = $scope.diaryData.unassignedReservationList.reservations,
                    reservationItem = _.find(unassignedReservationList, function (item) {
                    return item.reservation_id === reservationId;
                });

                if (reservationItem) {
                    selectUnassignedListItem(reservationItem);
                } else {
                    $scope.diaryData.selectedUnassignedReservation = {};
                    $scope.diaryData.isReservationSelected = false;
                    $scope.$emit('CANCEL_RESERVATION_EDITING');
                }
            }
        },
            postData = {
            'date': $scope.diaryData.arrivalDate
        },
            options = {
            params: postData,
            successCallBack: successCallBackFetchList
        };

        $scope.callAPI(RVNightlyDiarySrv.fetchUnassignedReservationList, options);
    };

    $scope.addListener('RESET_UNASSIGNED_LIST_SELECTION', function () {
        $scope.diaryData.selectedUnassignedReservation = {};
        $scope.diaryData.isReservationSelected = false;
    });

    $scope.addListener('FETCH_UNASSIGNED_LIST_DATA', function () {
        fetchUnassignedReservationList();
    });

    $scope.addListener('UNASSIGNED_LIST_DATE_CHANGED', function () {
        fetchUnassignedReservationList();
        if ($scope.diaryData.isAssignRoomViewActive) {
            unSelectUnassignedListItem();
        }
    });

    // Show calendar popup.
    $scope.clickedDatePicker = function () {
        ngDialog.open({
            template: '/assets/partials/nightlyDiary/rvNightlyDiaryDatePicker.html',
            controller: 'RVNightlyDiaryUnassignedListDatePickerController',
            className: 'single-date-picker',
            scope: $scope
        });
    };

    // To handle click on left date shift.
    $scope.clickedDateLeftShift = function () {
        $scope.diaryData.arrivalDate = moment(tzIndependentDate($scope.diaryData.arrivalDate)).subtract(1, 'days').format($rootScope.momentFormatForAPI);
        fetchUnassignedReservationList();
        if ($scope.diaryData.isAssignRoomViewActive) {
            unSelectUnassignedListItem();
        }
    };

    // To handle click on right date shift.
    $scope.clickedDateRightShift = function () {
        $scope.diaryData.arrivalDate = moment(tzIndependentDate($scope.diaryData.arrivalDate)).add(1, 'days').format($rootScope.momentFormatForAPI);
        fetchUnassignedReservationList();
        if ($scope.diaryData.isAssignRoomViewActive) {
            unSelectUnassignedListItem();
        }
    };
    // Show/Hide unassigned list based on screen width and filter type
    $scope.isShowUnassignedList = function () {
        return window.innerWidth > 1599 || window.innerWidth <= 1599 && $scope.diaryData.rightFilter === 'UNASSIGNED_RESERVATION' ? 'visible' : '';
    };
    // CICO-73889 : Handle unassigned reservation selection.
    $scope.addListener('SELECT_UNASSIGNED_RESERVATION', function (event, reservationId, arrivalDate) {
        $scope.diaryData.arrivalDate = arrivalDate;
        fetchUnassignedReservationList(reservationId);
    });

    $scope.addListener('CANCEL_UNASSIGNED_RESERVATION', function () {
        unSelectUnassignedListItem();
    });

    // CICO-65962 : Handle searchUnassignedList logic.
    $scope.searchUnassignedList = function () {
        var displayResults = [];

        if ($scope.searchQuery && $scope.searchQuery.length > 0) {
            displayResults = initialUnassignedListData.filter(function (reservation) {
                // check if the querystring is number or string
                var result = isNaN($scope.searchQuery) && reservation.fullName.toUpperCase().includes($scope.searchQuery.toUpperCase()) || !isNaN($scope.searchQuery) && reservation.confirm_no.toString().includes($scope.searchQuery);

                return result;
            });

            $scope.diaryData.unassignedReservationList.reservations = displayResults;
        } else {
            fetchUnassignedReservationList();
        }
    };

    /**
     * This functions initiates the auto assign call.
     * Setting necessary classes to the respective container,
     * Display the autoassign overlay and header
     */
    $scope.initiateAutoAssign = function () {
        $scope.$emit('INITIATE_AUTO_ASSIGN');
    };

    /**
     * hide the auto-assign button for FULL HOURLY hotels
     */
    $scope.enableAutoAssign = function () {
        return $rootScope.hotelDiaryConfig.mode !== 'FULL' && !_.isEmpty($scope.diaryData.unassignedReservationList) && $scope.diaryData.unassignedReservationList.reservations.length !== 0;
    };

    // CICO-65962 : Handle Clear Query.
    $scope.clearQuery = function () {
        $scope.searchQuery = '';
        $scope.searchUnassignedList();
    };
}]);