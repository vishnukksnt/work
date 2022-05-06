sntRover.controller('RVhouseKeepingDashboardController', ['$scope', '$rootScope', '$state', '$timeout', 'ngDialog', 'rvAnalyticsHelperSrv','rvAnalyticsSrv', '$stateParams', function($scope, $rootScope, $state, $timeout, ngDialog, rvAnalyticsHelperSrv, rvAnalyticsSrv, $stateParams) {
	// inheriting some useful things
	BaseCtrl.call(this, $scope);
    var that = this;
	// scroller related settings
	var scrollerOptions = {click: true, preventDefault: false};

  	$scope.setScroller('dashboard_scroller', scrollerOptions);
    $scope.setScroller('analytics_scroller', scrollerOptions);
    $scope.setScroller('analytics_details_scroller', {
      preventDefaultException: {
        tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT|A|DIV)$/
      },
      preventDefault: false
    });


  	$scope.showDashboard = true; // variable used to hide/show dabshboard

    $scope.disableReservations = true;

    // we are hiding the search results area
    $scope.$broadcast("showSearchResultsArea", false);

    $scope.tomorrow = tzIndependentDate ($rootScope.businessDate);
    $scope.tomorrow.setDate ($scope.tomorrow.getDate() + 1);
    $scope.dayAfterTomorrow = tzIndependentDate ($scope.tomorrow);
    $scope.dayAfterTomorrow.setDate ($scope.tomorrow.getDate() + 1);


    // we are setting the header accrdoing to house keeping dashboard
    $scope.$emit("UpdateHeading", 'DASHBOARD_HOUSEKEEPING_HEADING');

  	/*
  	*    a recievable function hide/show search area.
  	*    when showing the search bar, we will hide dashboard & vice versa
  	*    param1 {event}, javascript event
  	*    param2 {boolean}, value to determine whether dashboard should be visible
  	*/
  	$scope.$on("showDashboardArea", function(event, showDashboard) {
  		$scope.showDashboard = showDashboard;
  		$scope.refreshScroller('dashboard_scroller');
  	});

    /**
    *   recievalble function to update dashboard reservatin search results
    *   intended for checkin, inhouse, checkout (departed), vip buttons handling.
    *   @param {Object} javascript event
    *   @param {array of Objects} data search results
    */
    $scope.$on("updateDashboardSearchDataFromExternal", function(event, data) {
        $scope.$broadcast("updateDataFromOutside", data);
        $scope.$broadcast("showSearchResultsArea", true);
    });

    /**
    *   recievalble function to update dashboard reservatin search result's type
    *   intended for checkin, inhouse, checkout (departed), vip buttons search result handling.
    *   @param {Object} javascript event
    *   @param {array of Objects} data search results
    */
    $scope.$on("updateDashboardSearchTypeFromExternal", function(event, type) {
        $scope.$broadcast("updateReservationTypeFromOutside", type);
    });

    // dont show Latecheckout icon
    $scope.shouldShowLateCheckout = false;
    $scope.shouldShowQueuedRooms  = false;

    /**
    *   a recievder function to show erorr message in the dashboard
    *   @param {Object} Angular event
    *   @param {String} error message to display
    */

    $scope.$on("showErrorMessage", function(event, errorMessage) {
        $scope.errorMessage = errorMessage;
    });

    /**
    * function used to check null values, especially api response from templates
    */
    $scope.escapeNull = function(value, replaceWith) {
        var newValue = "";

        if ((typeof replaceWith !== "undefined") && (replaceWith !== null)) {
            newValue = replaceWith;
        }
        var valueToReturn = ((value === null || typeof value === 'undefined' ) ? newValue : value);

        return valueToReturn;
   };

   $scope.clickedOnRoomButton = function(event, filterType) {
        $state.go('rover.housekeeping.roomStatus', {'roomStatus': filterType});
   };

   // scroller is not appearing after coming back from other screens
    setTimeout(function() {
      $scope.refreshScroller('dashboard_scroller');
      $scope.refreshScroller('analytics_details_scroller');
    }, 500);


  $scope.$on('SHOW_ANALYTICS_DASHBOARD', function() {
    // call API and on Success show Analytics page
    $timeout(function() {
      $scope.dashboardFilter.analyticsActive = true;
    }, 500);
  });

  $scope.$emit('SET_DEFAULT_ANALYTICS_MENU' , 'HK_OVERVIEW');

  $scope.onHkAnlayticsRoomTypeChange = function() {
    $scope.$broadcast('RELOAD_DATA_WITH_SELECTED_FILTER', {
      "room_type": $scope.dashboardFilter.selectedRoomType,
      "date": $scope.dashboardFilter.datePicked
    });
  };

  var refreshAnalyticsScroller = function() {
    $timeout(function() {
      $scope.refreshScroller('analytics_scroller');
    }, 500);
  };

  $scope.$on('REFRESH_ANALTICS_SCROLLER', refreshAnalyticsScroller);

  $scope.dashboardFilter.isHkDashboard = true;

  $scope.selectedFilters = {
    "roomType": "",
    "roomTypes": []
  };

  $scope.availableRoomTypes = angular.copy($scope.roomTypes);

  $scope.$on('ROOM_TYPE_SHORTAGE_CALCULATED', function(e, calculatedRoomTypes) {
    $scope.roomTypesForWorkPrioriy = [];
    _.each($scope.availableRoomTypes, function(roomType) {
      roomType.shortage = 0;
      roomType.overBooking = 0;
      _.each(calculatedRoomTypes, function(calculatedRoomType) {
        if (roomType.code === calculatedRoomType.code) {
          roomType.shortage = calculatedRoomType.shortage;
          roomType.overBooking = calculatedRoomType.overBooking;
        }
      });
    });
  });

  $scope.onAnlayticsRoomTypeChange = function() {
    rvAnalyticsSrv.selectedRoomType = $scope.dashboardFilter.selectedRoomType;
    $scope.$broadcast('RELOAD_DATA_WITH_SELECTED_FILTER_' + $scope.dashboardFilter.selectedAnalyticsMenu);
  };

  $scope.toggleFilterView = function() {
    $scope.dashboardFilter.showFilters = !$scope.dashboardFilter.showFilters;
    // reset filters if was not applied
    if (rvAnalyticsSrv.selectedRoomType !== $scope.dashboardFilter.selectedRoomType) {
      $scope.dashboardFilter.selectedRoomType = rvAnalyticsSrv.selectedRoomType;
    }
  };

  var resetHKFilters = function () {
    $scope.dashboardFilter.selectedRoomType = "";
    rvAnalyticsSrv.selectedRoomType = "";
  };

  $scope.$on('RESET_CHART_FILTERS', resetHKFilters);

  $scope.clearAllFilters = function () {
    $scope.dashboardFilter.selectedRoomType = "";
  };

  if ($stateParams.onlyLoadAnalytics === 'true') {
    $scope.toggleAnalyticsView();
  }

}]);
