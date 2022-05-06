angular.module('sntRover').controller('rvReservationGuestDataPopupCtrl', [
    '$rootScope',
    '$scope',
    '$timeout',
    'rvGroupRoomingListSrv',
    '$state',
    function ($rootScope,
            $scope,
            $timeout,
            rvGroupRoomingListSrv,
            $state) {
        // To set the title
    $scope.title = ($scope.isUpdateReservation) ? "Edit" : "Add";

    // Updating and adding some params to show in screen
    // accompanyingLength, occupancyName etc are not there in API
    _.each($scope.selected_reservations, function(eachData) {
            eachData.isOpenAccompanyingGuest = false;
            var cnt = 0;

            angular.forEach(eachData.accompanying_guests_details, function(value, key) {
              if ((value.first_name !== "" && value.first_name !== null) || (value.last_name !== "" && value.last_name !== null) ) {
                  cnt = cnt + 1;
              }
        });
        eachData.accompanyingLength = cnt;
        var occupancyName = "";

        if (eachData.occupancy === 1) {
            occupancyName = "Single";
        } else if (eachData.occupancy === 2) {
            occupancyName = "Double";
        } else if (eachData.occupancy === 3) {
            occupancyName = "Triple";
        } else if (eachData.occupancy === 4) {
            occupancyName = "Quadruple";
        }
        eachData.occupancyName = occupancyName;
    });
    $scope.setScroller('guest-data-scroll');

    var refreshScroll = function() {
        $timeout(function() {
            $scope.refreshScroller('guest-data-scroll');
        }, 1500);
    };

    refreshScroll();
    /*
     * Toggle action of accompanying guest
     */
    $scope.toggleAccompanyingGuest = function(index) {
        var target = event.target;

        if (target.type === "text")
            return false;
        _.each($scope.selected_reservations, function(eachData, resIndex) {
            if (resIndex !== index)
                eachData.isOpenAccompanyingGuest = false;
        });
        $scope.selected_reservations[index].isOpenAccompanyingGuest = !$scope.selected_reservations[index].isOpenAccompanyingGuest;
        refreshScroll();
    };
    var successCallBackOfUpdateGuestData = function() {
        $scope.closeDialog();

        $scope.$emit("REFRESH_GROUP_ROOMING_LIST_DATA");
        $scope.$emit("FETCH_SUMMARY");
    };
    var failureCallBackOfUpdateGuestData = function(error) {
        $scope.errorMessage = error;
    };
    /*
     * To update all selected reservations guest data
     */

    $scope.updateCompleteGuestData = function() {

        var unWantedKeysToRemove = ['confirm_no', 'reservation_status', 'arrival_date',
                                    'departure_date', 'guest_card_id', 'rate_id', 'room_type_id', 'room_type_name',
                                    'room_rate_amount', 'can_checkin', 'can_checkout', 'is_guest_name_added',
                                    'is_room_number_present', 'is_room_ready', 'due_in', 'room_id', 'room_no',
                                    'fostatus', 'roomstatus', 'checkin_inspected_only', 'room_ready_status',
                                    'isOpenAccompanyingGuest', 'accompanyingLength', 'occupancyName'];
        var guestData = [];

        _.each($scope.selected_reservations, function(eachData, resIndex) {
            if (!eachData.is_accompanying_guest) {
                angular.forEach(eachData.accompanying_guests_details, function(guest) {
                    if (!guest.first_name && !guest.last_name) {
                      guest.first_name = null;
                      guest.last_name = null;
                    }
                });
                guestData.push(dclone(eachData, unWantedKeysToRemove));
            }
            
        });
        var data = {};

        data.guest_data = guestData;
        $scope.errorMessage = "";
        var options = {
            params: data,
            successCallBack: successCallBackOfUpdateGuestData,
            failureCallBack: failureCallBackOfUpdateGuestData
        };

        $scope.callAPI(rvGroupRoomingListSrv.updateGuestData, options);

    };
    /*
     * Even the screen is cancelled. We have to create the reservations.
     * CICO-23144
     */
    $scope.refreshScreenWithNewReservations = function() {
        $scope.closeDialog();
        $scope.$emit("REFRESH_GROUP_ROOMING_LIST_DATA");
    };
    /*
     * check reservation status
     */
    $scope.isDataEditable = function(reservation) {
        var rStatus = reservation.reservation_status;
        var isDisabled = false;

        if (rStatus === "CANCELED") {
            isDisabled = true;
        }
        return isDisabled;
    };


}]);