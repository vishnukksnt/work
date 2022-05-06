sntRover.controller('rvReservationSearchController', ['$scope', '$rootScope', '$state', '$stateParams', '$filter', '$timeout', 'searchResultdata', '$vault', 'RVSearchSrv',
  function($scope, $rootScope, $state, $stateParams, $filter, $timeout, searchResultdata, $vault, RVSearchSrv) {

    /*
     * Controller class for search,
     * will be updating the heading
     */

    var that = this;

    BaseCtrl.call(this, $scope);
    $scope.shouldShowLateCheckout = true;
    $scope.shouldShowQueuedRooms = true;
    // changing the header
    $scope.heading = 'SEARCH_TITLE';
    // updating the left side menu
    $scope.$emit("updateRoverLeftMenu", "reservationSearch");

    // setting search back button caption
    $scope.$emit("UpdateSearchBackbuttonCaption", "");

    var headingDict = {
      'DUEIN': 'DASHBOARD_SEARCH_CHECKINGIN',
      'DUEOUT': 'DASHBOARD_SEARCH_CHECKINGOUT',
      'INHOUSE': 'DASHBOARD_SEARCH_INHOUSE',
      'LATE_CHECKOUT': 'DASHBOARD_SEARCH_LATECHECKOUT',
      'QUEUED_ROOMS': 'QUEUED_ROOMS_TITLE',
      'VIP': 'DASHBOARD_SEARCH_VIP',
      'NORMAL_SEARCH': 'SEARCH_NORMAL',
      'PRE_CHECKIN': 'PRE_CHECKIN',
      'MOBILE_CHECKIN': 'MOBILE_CHECKIN'
    };

    var heading;

    // Special case: Search by swipe in back navigation. We have to display the card number as well.
    // So we store the title as sucn in $vault
    if ($stateParams.type === "BY_SWIPE") {
      heading = $vault.get('title');
    } else {
      if ($stateParams.type in headingDict) {
        heading = headingDict[$stateParams.type];
      } else {
        heading = headingDict['NORMAL_SEARCH'];
      }

    }


    heading = !!$stateParams.isMobileCheckin ? 'MOBILE_CHECKIN' : heading;

    // set up a back button
    if ($stateParams.type !== '' && $stateParams.type !== null) {
      $rootScope.setPrevState = {
        title: $filter('translate')('DASHBOARD'),

        scope: $scope,
        callback: 'backtoDash'
      };
    }

    $scope.backtoDash = function() {
      $vault.set('searchType', '');
      // $scope.$broadcast("showSearchResultsArea", false);

      setTimeout(function() {
         $state.go('rover.dashboard', {
          useCache: true
        });

      }, 150);

    };
    // saving/reseting search params to $vault
    $vault.set('searchType', !!$stateParams.type ? $stateParams.type : '');

    // resetting the scroll position to 0, so that it dont jump anywhere else
    // check CICO-9247
    $vault.set('result_showing_area', 0);


    $scope.heading = heading;

    // setting the scroller for view
    var scrollerOptions = {
      click: true,
      preventDefault: false,
      probeType: 2,
      scrollEndCallback: function() {
        $vault.set('result_showing_area', this.y);
      }
    };

    // Defined pagination for dashboard search
    $scope.dashboardSearchPagination = {
      id: 'DASHBOARD_SEARCH',
      api: $scope.fetchSearchResults,
      perPage: RVSearchSrv.searchPerPage
    };

    // we are returning to this screen
    if ($rootScope.isReturning()) {
      scrollerOptions.scrollToPrevLoc = !!$vault.get('result_showing_area') ? $vault.get('result_showing_area') : 0;
    }

    // finally
    $scope.setScroller('result_showing_area', scrollerOptions);
    $timeout(function() { 
      $scope.$broadcast('updatePagination', 'DASHBOARD_SEARCH');
    }, 1000);
    var totalNgIncludeRequested = 0;
    // click function on search area, mainly for closing the drawer

    $scope.clickedOnSearchArea = function($event) {
      $scope.$emit("closeDrawer");
    };

    /**
    * When the ng-include content request started, we will show activity indicator
    */
    $scope.$on("$includeContentRequested", function(event) {
      totalNgIncludeRequested++; // variable used to track total number of nginlude requested
      $scope.$emit('showLoader');
    });

    /**
    * When the ng-include content loaded, we will hide activity indicator
    */
    $scope.$on("$viewContentLoaded", function(event) {
      totalNgIncludeRequested--;
      if (totalNgIncludeRequested === 0) {
        $scope.$emit('hideLoader');
      }
      setTimeout(function() {
        $scope.$apply(function() {
          // we are showing the search results area
          $scope.$broadcast("showSearchResultsArea", true);
          // we are showing the data in search results area
          if (typeof searchResultdata !== 'undefined') {
            $scope.$broadcast("updateDataFromOutside", searchResultdata);
          }
        });

      }, 100);

    });

    $scope.$on("SearchResultsCleared", function(event, data) {
      $scope.heading = headingDict['NORMAL_SEARCH'];
    });
    $scope.$on("UpdateHeading", function(event, data) {
      $scope.heading = data;
    });
    $scope.$on("UPDATE_MANAGER_DASHBOARD", function() {
      $scope.heading = headingDict['NORMAL_SEARCH'];
    });
    
    // Regarding rvReservationSearchWidgetCtrl.js's ng-repeat on large data set
    // Even though we are showing loader on ng-repeat start, it is not showing :(, so adding here
    // we are hiding this loader on data ng-repeat complete in rvReservationSearchWidgetCtrl.js
    $scope.$emit('showLoader'); // Please see above comment

  }
]);