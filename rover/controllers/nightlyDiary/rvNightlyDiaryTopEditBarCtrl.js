'use strict';

angular.module('sntRover').controller('rvNightlyDiaryTopEditBarController', ['$scope', '$state', 'RVNightlyDiarySrv', 'ngDialog', function ($scope, $state, RVNightlyDiarySrv, ngDialog) {

    BaseCtrl.call(this, $scope);

    $scope.cancelEditReservation = function () {
        $scope.$emit('CANCEL_RESERVATION_EDITING');
        $scope.diaryData.isReservationSelected = false;
    };

    // Handle validation popup close.
    $scope.closeDialogAndRefresh = function () {
        $scope.$emit('CANCEL_RESERVATION_EDITING');
        ngDialog.close();
    };

    $scope.saveEditedReservation = function () {
        $scope.$emit('SAVE_RESERVATION_EDITING');
    };

    $scope.goToStayCard = function (currentSelectedReservation, currentSelectedRoom) {

        var params = RVNightlyDiarySrv.getCache();

        params.currentSelectedReservationId = currentSelectedReservation.id;
        params.currentSelectedRoomId = currentSelectedRoom.id;
        params.currentSelectedReservation = currentSelectedReservation;
        params.filterList = $scope.diaryData.filterList;
        params.selectedRoomCount = $scope.diaryData.selectedRoomCount;
        params.selectedFloorCount = $scope.diaryData.selectedFloorCount;
        params.hideRoomType = $scope.diaryData.hideRoomType;
        params.hideFloorList = $scope.diaryData.hideFloorList;
        params.selected_floor_ids = $scope.diaryData.selectedFloors;
        params.selected_room_type_ids = $scope.diaryData.selectedRoomTypes;
        params.unassignedReservationList = $scope.diaryData.unassignedReservationList;

        RVNightlyDiarySrv.updateCache(params);

        $state.go("rover.reservation.staycard.reservationcard.reservationdetails", {
            id: currentSelectedReservation.id,
            confirmationId: currentSelectedReservation.confirm_no,
            isrefresh: true
        });
    };

    // CICO-36015 Handle room move button click.
    $scope.moveRoomButtonClick = function () {
        $scope.diaryData.isReservationSelected = true;
        $scope.diaryData.roomAssignmentFilters = {};
        var successCallBack = function successCallBack(responce) {
            $scope.diaryData.roomAssignmentFilters = responce.data;
            $scope.diaryData.roomAssignmentFilters.roomTypeId = _.findWhere($scope.diaryData.diaryRoomsList, { id: $scope.diaryData.selectedRoomId }).room_type_id;
            $scope.diaryData.roomAssignmentFilters.floorId = '';
            $scope.diaryData.roomAssignmentFilters.roomFeatureIds = [];
            $scope.diaryData.roomAssignmentFilters.type = 'MOVE_ROOM';
            $scope.$emit('APPLY_GUEST_PREFERENCE_FILTER_TOP');
        },
            failureCallBack = function failureCallBack(errorMessage) {
            $scope.$emit('SHOW_ERROR_MESSAGE', errorMessage[0]);
        },
            postData = {
            'reservation_id': $scope.currentSelectedReservation.id
        },
            options = {
            params: postData,
            successCallBack: successCallBack,
            failureCallBack: failureCallBack
        };

        $scope.callAPI(RVNightlyDiarySrv.getPreferences, options);
    };

    // CICO-36015 Handle cancel room move button click.
    $scope.cancelMoveRoomButtonClick = function () {
        $scope.diaryData.isCancelledMoveOrAssign = true;
        $scope.diaryData.isReservationSelected = false;
        $scope.$emit('HIDE_ASSIGN_ROOM_SLOTS');
    };

    // CICO-62103 Handle Unassign Room button click.
    $scope.unAssignRoomButtonClick = function () {
        var successCallBack = function successCallBack() {
            $scope.$emit('UPDATE_UNASSIGNED_RESERVATIONLIST', 'REFRESH');
            $scope.$emit('UPDATE_RESERVATIONLIST');
        },
            failureCallBack = function failureCallBack(errorMessage) {
            if (errorMessage.httpStatus && errorMessage.httpStatus === 470) {
                $scope.$emit('REFRESH_AUTO_ASSIGN_STATUS');
                return;
            }
            $scope.$emit('SHOW_ERROR_MESSAGE', errorMessage[0]);
        },
            postData = {
            'id': $scope.currentSelectedReservation.id,
            'is_from_diary': true
        },
            options = {
            params: postData,
            successCallBack: successCallBack,
            failureCallBack: failureCallBack
        };

        $scope.callAPI(RVNightlyDiarySrv.unAssignRoom, options);
    };

    /*
     * Set time from rvNightlyDiarySetTimePopup.
     */
    $scope.addListener('TRIGGER_MOVE_ROOM', function () {
        $scope.moveRoomButtonClick();
    });

    $scope.cancelEditUnassignedReservation = function () {
        $scope.$emit('CANCEL_UNASSIGNED_RESERVATION_MAIN');
    };
}]);