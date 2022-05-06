sntRover.controller('rvDashboardRoomsWidgetController', ['$scope', 'RVSearchSrv', '$state', function($scope, RVSearchSrv, $state) {
	/**
	* controller class for dashbaord's rooms area
	*/
	var that = this;

  	BaseCtrl.call(this, $scope);

    this.clickedType = '';

    /*
    * function to exceute on clicking the guest today buttons
    * we will call the webservice with given type and
    * will update search results and show search area
    */
   $scope.clickedOnRoomButton = function(event, filterType) {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
        $state.go('rover.housekeeping.roomStatus', {'roomStatus': filterType});
   };


}]);