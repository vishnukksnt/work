sntRover.controller('RVfrontDeskDashboardController',
    ['$scope', '$rootScope', 'RVDashboardSrv', '$timeout', 'ngDialog', 'rvAnalyticsSrv', '$stateParams',
        function($scope, $rootScope, RVDashboardSrv, $timeout, ngDialog, rvAnalyticsSrv, $stateParams) {
	// inheriting some useful things
	BaseCtrl.call(this, $scope);
    var that = this;

    var requestParams = {
        'show_adr': false,
        'show_upsell': true,
        'show_rate_of_day': false
    };

    RVDashboardSrv.fetchStatisticData(requestParams).then(function(data) {
        $scope.statistics = data;
    });
    
	// scroller related settings
	var scrollerOptions = {click: true, preventDefault: false};

  	$scope.setScroller('dashboard_scroller', scrollerOptions);
    var analyticsScrollerOptions = {
      preventDefaultException: {
        tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT|A|DIV)$/
      },
      preventDefault: false
    };

    $scope.setScroller('analytics_scroller', analyticsScrollerOptions);
    $scope.setScroller('analytics_details_scroller', analyticsScrollerOptions);

  	$scope.showDashboard = true; // variable used to hide/show dabshboard
    // changing the header
    $scope.$emit("UpdateHeading", 'DASHBOARD_FRONTDESK_HEADING');

    // we are hiding the search results area
    $scope.$broadcast("showSearchResultsArea", false);

    $scope.tomorrow = tzIndependentDate ($rootScope.businessDate);
    $scope.tomorrow.setDate ($scope.tomorrow.getDate() + 1);
    $scope.dayAfterTomorrow = tzIndependentDate ($scope.tomorrow);
    $scope.dayAfterTomorrow.setDate ($scope.tomorrow.getDate() + 1);

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

    // show Latecheckout icon
    $scope.shouldShowLateCheckout = true;
    $scope.shouldShowQueuedRooms  = true;
    // scroller is not appearing after coming back from other screens
    setTimeout(function() {
      $scope.refreshScroller('dashboard_scroller');
    }, 500);

    $scope.$emit('SET_DEFAULT_ANALYTICS_MENU', 'FO_ARRIVALS');

    var refreshAnalyticsScroller = function() {
      $timeout(function() {
        $scope.refreshScroller('analytics_scroller');
        $scope.refreshScroller('analytics_details_scroller');
      }, 500);
    };

    $scope.dashboardFilter.isFrontDeskDashboard = true;
    $scope.$on('REFRESH_ANALTICS_SCROLLER', refreshAnalyticsScroller);
    $scope.selectedFilters = {
      "roomType": "",
      "roomTypes": []
    };

    $scope.toggleFilterView = function() {
      $scope.dashboardFilter.showFilters = !$scope.dashboardFilter.showFilters;
      var selectedAnalyticsMenu = $scope.dashboardFilter.selectedAnalyticsMenu;

      // reset filters if was not applied
      if (rvAnalyticsSrv.selectedRoomType !== $scope.dashboardFilter.selectedRoomType) {
        $scope.dashboardFilter.selectedRoomType = rvAnalyticsSrv.selectedRoomType;
      }
      if (selectedAnalyticsMenu === 'FO_ACTIVITY') {
        $scope.dashboardFilter.showPreviousDayData = rvAnalyticsSrv.foChartFilterSet.showPreviousDayData;
      }

      if (selectedAnalyticsMenu === 'FO_WORK_LOAD') {
        $scope.dashboardFilter.showRemainingReservations = rvAnalyticsSrv.foChartFilterSet.showRemainingReservations;
      }
    };
    
    $scope.applyFoFilters = function () {
      $scope.dashboardFilter.showFilters = false;

      rvAnalyticsSrv.selectedRoomType = $scope.dashboardFilter.selectedRoomType;
      rvAnalyticsSrv.foChartFilterSet.showRemainingReservations = $scope.dashboardFilter.showRemainingReservations;
      rvAnalyticsSrv.foChartFilterSet.showPreviousDayData = $scope.dashboardFilter.showPreviousDayData;

      $scope.$broadcast('RELOAD_DATA_WITH_SELECTED_FILTER_' + $scope.dashboardFilter.selectedAnalyticsMenu);
    };

    var resetFoFilters = function() {
      $scope.dashboardFilter.datePicked = $rootScope.businessDate;
      $scope.dashboardFilter.showRemainingReservations = false;
      $scope.dashboardFilter.selectedRoomType = "";
      $scope.dashboardFilter.showPreviousDayData = false;
    };

    $scope.$on('RESET_CHART_FILTERS', function() {
      resetFoFilters();
      rvAnalyticsSrv.selectedRoomType = "";
    });

    $scope.clearAllFilters = function() {
      resetFoFilters();
    };

    if ($stateParams.onlyLoadAnalytics === 'true') {
      $scope.toggleAnalyticsView();
    }
}]);
