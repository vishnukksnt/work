sntRover.controller('rvBorrowRoomTypeCtrl', [
    '$scope',
    'RVUpgradesSrv',
    'ngDialog',
    'RVRoomAssignmentSrv',
    function($scope, RVUpgradesSrv, ngDialog, RVRoomAssignmentSrv) {

    // BaseCtrl.call(this, $scope);
    $scope.selectedUpgrade = {};

    _.extend($scope.selectedUpgrade,
        {
            room_id: $scope.assignedRoom.room_id,
            room_no: $scope.assignedRoom.room_number,
            room_type_name: $scope.assignedRoom.room_type_name,
            room_type_code: $scope.assignedRoom.room_type_code
          //  room_type_level : parseInt(selectedListItem.room_type_level)
        });
    var successCallbackselectUpgrade = function(data) {
        $scope.closeDialog();
        $scope.$emit('upgradeSelected', $scope.selectedUpgrade);
    };

    var failureCallbackselectUpgrade = function(error) {
        $scope.$emit('hideLoader');
        $scope.$parent.errorMessage = error;
        $scope.closeDialog();
    };

    $scope.clickedBorrowButton = function() {
        var resData     = $scope.reservationData.reservation_card,
            apiToCall   = RVRoomAssignmentSrv.assignRoom,
            params      = {};

        // CICO-25067
        params.forcefully_assign_room   = true;
        params.reservation_id   = resData.reservation_id;
        params.room_number  = $scope.assignedRoom.room_number;
        params.is_preassigned   = $scope.assignedRoom.is_preassigned;
        params.is_overbooking   = $scope.is_overbooking;
        params.without_rate_change = true;
        // CICO-55101
        params.room_type = $scope.getCurrentRoomType().type;

        var options = {
            params: params,
            successCallBack: successCallbackselectUpgrade,
            failureCallBack: failureCallbackselectUpgrade

        };

        $scope.callAPI(apiToCall, options);

    };


}]);