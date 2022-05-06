angular.module('sntRover').controller('rvGroupReservationCheckoutCtrl', [
    '$rootScope',
    '$scope',
    '$timeout',
    'RVBillCardSrv',
    'ngDialog',
    function ($rootScope,
            $scope,
            $timeout,
            RVBillCardSrv,
            ngDialog) {

    var completeCheckoutSuccessCallback = function(data) {
        // calling initially required APIs
        $scope.$emit("REFRESH_GROUP_ROOMING_LIST_DATA");
        $timeout(function() {
            $scope.closeDialog();
        }, 700);
    };

    // Call back for checkout failure
    var completeCheckoutFailureCallback = function(error) {
        $scope.$emit('showErrorMessage', error[0]);
        ngDialog.close();
    };

    /**
     * Checks the selected reservation out. fires when user confirms checkout action.
     */
    $scope.completeCheckOut = function(reservationID) {
        var params = {
            "reservation_id": reservationID
        };

        var options = {
            params: params,
            successCallBack: completeCheckoutSuccessCallback,
            failureCallBack: completeCheckoutFailureCallback
        };

        $scope.callAPI(RVBillCardSrv.completeCheckout, options);
    };

}]);