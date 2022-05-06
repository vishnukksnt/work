'use strict';

sntRover.controller('rvNightlyDiaryValidationStayCtrl', ['$scope', 'rvPermissionSrv', function ($scope, rvPermissionSrv) {

    /**
     * if the user has enough permission to over book House
     * @return {Boolean}
     */
    var hasPermissionToHouseOverBook = function hasPermissionToHouseOverBook() {
        return rvPermissionSrv.getPermissionValue('OVERBOOK_HOUSE');
    };

    /**
     * if the user has enough permission to over book room type
     * @return {Boolean}
     */
    var hasPermissionToOverBook = function hasPermissionToOverBook() {
        return rvPermissionSrv.getPermissionValue('OVERBOOK_ROOM_TYPE');
    };

    /* Utility method to check overbooking status
       * @param {Object} [470 error data with is_house_available ,room_type_available flags ]
       * @return {String} [Overbooking status message]
       */
    var checkOverBooking = function checkOverBooking() {
        var isHouseOverbooked = !$scope.popupData.data.is_house_available,
            isRoomTypeOverbooked = !$scope.popupData.data.is_room_type_available,
            canOverbookHouse = hasPermissionToHouseOverBook(),
            canOverbookRoomType = hasPermissionToOverBook(),
            canOverBookBoth = canOverbookHouse && canOverbookRoomType,
            overBookingStatusOutput = '';

        if (isHouseOverbooked && isRoomTypeOverbooked && canOverBookBoth) {
            overBookingStatusOutput = 'HOUSE_AND_ROOMTYPE_OVERBOOK';
        } else if (isRoomTypeOverbooked && canOverbookRoomType && (!isHouseOverbooked || isHouseOverbooked && canOverbookHouse)) {
            overBookingStatusOutput = 'ROOMTYPE_OVERBOOK';
        } else if (isHouseOverbooked && canOverbookHouse && (!isRoomTypeOverbooked || isRoomTypeOverbooked && canOverbookRoomType)) {
            overBookingStatusOutput = 'HOUSE_OVERBOOK';
        } else {
            overBookingStatusOutput = 'NO_PERMISSION_TO_OVERBOOK';
        }

        return overBookingStatusOutput;
    };

    // Disable the overBooking button if there is no permission..
    if ($scope.popupData.showOverBookingButton) {
        $scope.popupData.disableOverBookingButton = checkOverBooking() === 'NO_PERMISSION_TO_OVERBOOK';
    }

    // Handle overbook button click actions.
    $scope.clickedOverBookButton = function () {
        $scope.$emit('SAVE_RESERVATION_EDITING');
    };
}]);