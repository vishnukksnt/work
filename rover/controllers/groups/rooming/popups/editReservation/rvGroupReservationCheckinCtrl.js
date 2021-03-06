angular.module('sntRover').controller('rvGroupReservationCheckinCtrl', [
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

    var completeCheckinSuccessCallback = function(data) {
        // As we have checked in a reservation we need to update rooming list data.
        $scope.$emit("REFRESH_GROUP_ROOMING_LIST_DATA");
        $scope.$emit("FETCH_SUMMARY");
        $timeout(function() {
            $scope.closeDialog();
        }, 700);
    };

    var completeCheckinFailureCallback = function(error) {

    };

    /**
     * Checks the selected reservation out. fires when user confirms checkout action.
     * Calls group checkin API with one reservation id.
     */
    $scope.completeCheckIn = function(groupID, reservationID) {
        var params = {
            group_id: groupID,
            reservation_ids: [reservationID]
        };

        var options = {
            params: params,
            successCallBack: completeCheckinSuccessCallback,
            failureCallBack: completeCheckinFailureCallback
        };

        $scope.callAPI(rvGroupRoomingListSrv.performMassCheckin, options);
    };
}]);