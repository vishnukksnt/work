sntRover.controller('rvAllotmentReservationCheckoutCtrl', [
    '$rootScope',
    '$scope',
    '$timeout',
    'RVBillCardSrv',
    '$state',
    function($rootScope,
            $scope,
            $timeout,
            RVBillCardSrv,
            $state) {

      var completeCheckoutSuccessCallback = function(data) {
        // calling initially required APIs
        $scope.$emit('REFRESH_ALLOTMENT_RESERVATIONS_LIST_DATA');
        $timeout(function() {
          $scope.closeDialog();
        }, 700);
      };

      var completeCheckoutFailureCallback = function(error) {

      };

      /**
       * Checks the selected reservation out. fires when user confirms checkout action.
       */
      $scope.completeCheckOut = function(reservationID) {
        var params = {
          'reservation_id': reservationID
        };

        var options = {
          params: params,
          successCallBack: completeCheckoutSuccessCallback,
          failureCallBack: completeCheckoutFailureCallback
        };

        $scope.callAPI(RVBillCardSrv.completeCheckout, options);
      };

    }]);
