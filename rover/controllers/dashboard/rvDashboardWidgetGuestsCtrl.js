sntRover.controller('rvDashboardGuestWidgetController', ['$scope', 'RVSearchSrv', '$state', function($scope, RVSearchSrv, $state) {
	/**
	* controller class for dashbaord's guest's area
	*/
	var that = this;

  	BaseCtrl.call(this, $scope);

    this.clickedType = '';

    /*
    * function to exceute on clicking the guest today buttons
    * we will call the webservice with given type and
    * will update search results and show search area
    */
    $scope.clickedOnGuestsToday = function(event, type, numberOfReservation, isMobileCheckin) {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
        // disable reservation search for house keeping
        // TODO: Enable click when mobile style updates are stable
        if (!$scope.disableReservations) {
            // as we dont have a status called Mobile checkin, we still need to pass as PRE_CHECKIN
            // along with that we will pass is mobile checkin variable. This will be null if not send
            var stateParams = {'type': type, 'from_page': 'DASHBOARD', 'isMobileCheckin': isMobileCheckin};

            $state.go('rover.search', stateParams);
        }
        else {
            return;
        }
    };


}]);