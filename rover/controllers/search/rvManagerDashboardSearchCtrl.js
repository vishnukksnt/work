sntRover.controller('rvManagerDashboardSearchController', ['$scope', '$transitions', '$rootScope',
    function($scope, $transitions, $rootScope) {

	/*
	* Controller class for dashboard search,
	* will be updating the heading, update data from external source...
	*/

	var that = this;

  	BaseCtrl.call( this, $scope );

	// setting the scroller for view
	var scrollerOptions = {
        tap: true,
        preventDefault: true,
        momentum: false,
        mouseWheel: false,
        shrinkScrollbars: 'clip'
    };

  	$scope.setScroller('result_showing_area', scrollerOptions);
    $scope.$broadcast("showSearchResultsArea", false);
    // Clear the from date and to date options from search box.

    // To clear date boxes when we come to dashboard through main menu
    // timeout given because rvReservationSearchWidgetCtrl init happens after some time
    setTimeout(function() {
        $scope.$broadcast("clearSearchDateValues", false);
    }, 500);

    /**
    * recieved event from search controller on focusedout.
    */
    $scope.$on("SEARCH_BOX_FOCUSED_OUT", function(event) {
        backToDashboard();
    });

    /**
    * function used to back onto dashboard screen
    */
    var backToDashboard = function() {
        // setting the backbutton & showing the caption
        $scope.$emit("UpdateSearchBackbuttonCaption", "");
        // we need to show the dashboard & hide search area
        $scope.$emit("showDashboardArea", true);
        $scope.$broadcast("showSearchResultsArea", false);
        // also need to clear results present in that & type
        $scope.$broadcast("updateReservationTypeFromOutside", 'default');
        $scope.$emit("UpdateHeading", 'DASHBOARD_MANAGER_HEADING');
    };

    /**
    * recievable function to handle backbutton click on header area
    * will backto dashboard
    */
    $scope.$on("HeaderBackButtonClicked", function(event) {
        backToDashboard();
    });

    /**
    * When leaving this, we need to reset the back button text
    */
    $transitions.onSuccess({}, function() {
        // setting the backbutton & showing the caption
        $scope.$emit("UpdateSearchBackbuttonCaption", "");
    });

    /**
    * on what action taken, on search results clearing
    */
    $scope.$on("SearchResultsCleared", function(event) {
        backToDashboard();
    });

}]);
