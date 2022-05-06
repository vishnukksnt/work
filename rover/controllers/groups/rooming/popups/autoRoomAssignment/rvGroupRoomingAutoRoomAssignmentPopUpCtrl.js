angular.module('sntRover').controller('rvGroupRoomingAutoRoomAssignPopUpCtrl', ['$scope', function($scope) {

	// This controller is only for setting the SCROLLER, we are not using this for any other purpose
	// because every function that we need to use on closing or some other action residing in rvGroupRoomingListCtrl.js
	// Please have a look at there.
	// We are forced to create this controller for this scroller refreshing & it's creattion
	// (since we dont want to interfer with this rooming list scroller)
	BaseCtrl.call(this, $scope);

	var setScroller = (function() {
		// scroller options
        var scrollerOptions = {};

        $scope.setScroller('failed_reservations_scroller', scrollerOptions);
	}());

	/**
     * event triggered by ngrepeatend directive
     * mainly used to referesh scroller
     */
    $scope.$on('NG_REPEAT_COMPLETED_RENDERING', function(event) {
    	$scope.refreshScroller('failed_reservations_scroller');
    });

}]);