sntRover.controller('rvHouseKeepingDashboardRoomSearchCtrl', [
	'$scope',
	'$rootScope',
	'$timeout',
	'$state',
	'$filter',
	'RVHkRoomStatusSrv',
	function($scope, $rootScope, $timeout, $state, $filter, RVHkRoomStatusSrv) {

		BaseCtrl.call(this, $scope);
		$scope.query = '';
		$scope.isSearchResultsShowing = false;

		$scope.rooms = [];

		// whether we need to show the search results area
		$scope.showSearchResultsArea = false;

		$scope.queryFunctionProccessing = null;
		// inorder to hide/show searhc results area from outide we can use this
		$scope.$on("showSearchResultsArea", function(event, showSearchResultsArea) {
			$scope.showSearchResultsArea = showSearchResultsArea;
		});

		// setting the scroller for view
		var scrollerOptions = { click: true, preventDefault: false };

	  	$scope.setScroller('result_showing_area', scrollerOptions);

	  	var refreshScroller = function() {
			$scope.refreshScroller('result_showing_area');
		};


	  	// internal variables
	  	var $_roomList,
	  		$_page = 1,
	  		$_perPage = 50,
	  		$_defaultPage = 0,
	  		$_lastQuery = '';

	  	// inital page related properties
	  	$scope.resultFrom     = $_page;
	  	$scope.resultUpto     = $_perPage;
	  	$scope.netTotalCount  = 0;
	  	$scope.uiTotalCount   = 0;
	  	$scope.disablePrevBtn = true;
	  	$scope.disableNextBtn = true;


	  function $_fetchRoomListCallback(data) {
	  	if ( !!_.size(data) ) {
			$_roomList = _.extend({}, data);
		} else {
			$_roomList = {};
		}

		// clear old results and update total counts
		$scope.rooms         = [];
		$scope.netTotalCount = $_roomList.total_count;
		$scope.uiTotalCount  = !!$_roomList && !!$_roomList.rooms ? $_roomList.rooms.length : 0;

		if ( $_page === 1 ) {
			$scope.resultFrom = 1;
			$scope.resultUpto = $scope.netTotalCount < $_perPage ? $scope.netTotalCount : $_perPage;
			$scope.disablePrevBtn = true;
			$scope.disableNextBtn = $scope.netTotalCount > $_perPage ? false : true;
		} else {
			$scope.resultFrom = $_perPage * ($_page - 1) + 1;
			$scope.resultUpto = ($scope.resultFrom + $_perPage - 1) < $scope.netTotalCount ? ($scope.resultFrom + $_perPage - 1) : $scope.netTotalCount;
			$scope.disablePrevBtn = false;
			$scope.disableNextBtn = $scope.resultUpto === $scope.netTotalCount ? true : false;
		}


  		$timeout(function() {
  			$_postProcessRooms();
  		}, 10);

	  	RVHkRoomStatusSrv.currentFilters.page = $_page;
	  }


	  	function $_postProcessRooms() {
	  		var _roomCopy     = {},
	  			_processCount = 0,
	  			_minCount     = 13,
	  			i             = 0;

	  		// if   : results -> load 0 to '_processCount' after a small delay
	  		// else : empty and hide loader
	  		if ( $scope.uiTotalCount ) {
	  			_processCount = Math.min( $scope.uiTotalCount, _minCount );
	  			$timeout(_firstInsert, 100);
	  		} else {
	  			$scope.rooms = [];
	  			_hideLoader();
	  		}

	  		function _firstInsert () {
	  			for ( i = 0; i < _processCount; i++ ) {
	  				_roomCopy = _.extend( {}, $_roomList.rooms[i] );
	  				$scope.rooms.push( _roomCopy );
	  			}

	  			// if   : more than '_minCount' results -> load '_processCount' to last
	  			// else : hide loader
	  			if ( $scope.uiTotalCount > _minCount ) {
	  				$timeout(_secondInsert, 100);
	  			} else {
	  				_hideLoader();
	  			}
	  		}

	  		function _secondInsert () {
	  			for ( i = _processCount; i < $scope.uiTotalCount; i++ ) {
	  				_roomCopy = _.extend( {}, $_roomList.rooms[i] );
	  				$scope.rooms.push( _roomCopy );
	  			}

	  			_hideLoader();
	  		}

	  		function _hideLoader () {
	  			$_roomList = {};
	  			refreshScroller();
	  			$scope.$emit( 'hideLoader' );
	  		}
		}


	  	$scope.loadNextPage = function() {
			if ( $scope.disableNextBtn ) {
				return;
			}

			$_page++;
			RVHkRoomStatusSrv.currentFilters.page = $_page;

			$_callRoomsApi();
		};

	  	$scope.loadPrevPage = function() {
			if ($scope.disablePrevBtn) {
				return;
			}

			$_page--;
			RVHkRoomStatusSrv.currentFilters.page = $_page;

			$_callRoomsApi();
		};


		function $_callRoomsApi() {
			$scope.invokeApi(RVHkRoomStatusSrv.fetchRoomListPost, {}, $_fetchRoomListCallback);
		}


		var $_filterByQuery = function(forced) {
			var _makeCall = function() {
					RVHkRoomStatusSrv.currentFilters.query = $scope.query;

					$_resetPageCounts();

					$timeout(function() {
						$_callRoomsApi();
						$_lastQuery = $scope.query;
					}, 10);
				};

			if ( $rootScope.isSingleDigitSearch ) {
				if (forced || $scope.query !== $_lastQuery) {
					_makeCall();
				}
			} else {
				if ( forced ||
						($scope.query.length <= 2 && $scope.query.length < $_lastQuery.length) ||
						($scope.query.length > 2 && $scope.query !== $_lastQuery)
				) {
					_makeCall();
				}
			}
		};

		$scope.filterByQuery = _.throttle($_filterByQuery, 1000, { leading: false });

		$scope.clearResults = function() {
			$scope.query = '';
			$scope.rooms = [];
			$scope.$emit("showDashboardArea", true);
		  	 // we are setting the header accrdoing to house keeping dashboard
   			$scope.$emit("UpdateHeading", 'DASHBOARD_HOUSEKEEPING_HEADING');
		  	$scope.showSearchResultsArea = false;
		  	$scope.isSearchResultsShowing = false;
		  	if ($scope.queryFunctionProccessing) {
		  		clearTimeout($scope.queryFunctionProccessing);
		  		$scope.queryFunctionProccessing = null;
		  	}
		};

		function $_resetPageCounts () {
			$_page = $_defaultPage;
			RVHkRoomStatusSrv.currentFilters.page = $_page;
		}


		/**
		* when focused on query box, we need to show the search results area
		* and need to hide the dashboard area
		*/
		$scope.focusedOnQueryBox = function() {
			$scope.showSearchResultsArea = true;
			refreshScroller();
			$scope.$emit("showDashboardArea", false);
			$scope.$emit("UpdateHeading", 'MENU_ROOM_STATUS');
		};
		/**
		* when focusedout on query box, we need to hide the search results area
		* and need to show the dashboard area only if there is no data displaying
		*/
		$scope.focusedOutOnQueryBox = function() {

			$timeout(function() {
				if (!$scope.isSearchResultsShowing && $scope.query.length === 0) {
					$scope.query = "";
					$scope.rooms = [];
					$scope.showSearchResultsArea = false;
					$scope.$emit("showDashboardArea", true);
					$scope.$emit("UpdateHeading", 'DASHBOARD_HOUSEKEEPING_HEADING');
				}
			}, 100);

		};

		$scope.$on('ANALYTICS_VIEW_ACTIVE', $scope.clearResults);
}]);