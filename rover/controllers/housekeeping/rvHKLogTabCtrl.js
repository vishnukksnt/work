angular.module('sntRover').controller('RVHKLogTabCtrl', [
	'$scope',
	'$rootScope',
	'RVHkRoomDetailsSrv',
	'roomDetailsLogData',
	'$filter',
	'$timeout',
	'$stateParams',
	function($scope, $rootScope, RVHkRoomDetailsSrv, roomDetailsLogData, $filter, $timeout, $stateParams) {

		BaseCtrl.call(this, $scope);
		// set the previous state
		$rootScope.setPrevState = {
			title: $filter('translate')('ROOM_STATUS'),
			name: 'rover.housekeeping.roomStatus',
			param: {
				roomStatus: $stateParams.roomStatus
			}
		};

		$scope.setScroller('LOG_TAB_SCROLL');

		var refreshScroll = function(goTop) {
				$scope.refreshScroller('LOG_TAB_SCROLL');
				goTop && $scope.getScroller('LOG_TAB_SCROLL').scrollTo(0, 0);
			},
			// Configure page options for the directive
			configurePagination = function () {
				$scope.pageOptions = {
					id: 'ROOM_LOG',
					perPage: $scope.perPage,
					api: updateLog
				};
			},
			// Refresh the pagination controls after changing the results
			refreshPagination = function () {
				$timeout(function () {
      				$scope.$broadcast('updatePagination', 'ROOM_LOG' );
				}, 100 );
			},
			// Get total log count
			getTotalResultCount = function (roomLogs) {
				return roomLogs.total_count;
			},
			// Process room data
			processRoomData = function () {
				angular.forEach($scope.roomLogData, function(item, keyValue) {
					item.front_office_status = _.findWhere(item.details, {key: "fo_status"});
					item.room_status = _.findWhere(item.details, {key: "room_status"});
					item.service_status = _.findWhere(item.details, {key: "service_status"});
					if (item.service_status) {
						item.service_status.old_value = getServiceStatusValue(item.service_status.old_value);
						item.service_status.new_value = getServiceStatusValue(item.service_status.new_value);
					}
					
				});
			};

		var init = function() {
			$scope.perPage = 50;
			$scope.roomDetails = $scope.$parent.roomDetails;			
			configurePagination();
			$scope.roomLogData = roomDetailsLogData.results;
			processRoomData();			
	        $scope.totalResultCount = getTotalResultCount(roomDetailsLogData);	        
	        refreshScroll(false);
	        refreshPagination();
		};

		/**
		 * Fetches the log for the room actions
		 * @param {Number} pageNo
		 * @return {void}
		 */
		var updateLog = function(pageNo) {			
			pageNo = pageNo || 1;					

	        var onLogFetchSuccess = function(data) {
	                $scope.roomLogData = data.results;
	                processRoomData();
	                $scope.totalResultCount = getTotalResultCount(roomDetailsLogData); 

	                refreshScroll(true);
	                refreshPagination();
	        	},
	        	params = {
	                id: $scope.roomDetails.id,
	                page: pageNo,
	                per_page: $scope.perPage
	        	},
	        	options = {
	        		onSuccess: onLogFetchSuccess,
	        		params: params
	        	};	       

	        $scope.callAPI(RVHkRoomDetailsSrv.getRoomLog, options);
	    };

	    $scope.getRoomStatusClass = function(roomStatus) {
		 if (roomStatus === 'DO NOT DISTURB') {
			return 'dnd';
		 }

		 return roomStatus.toLowerCase();
	    };
	    
	    init();

	    // Listener for activating the log tab
	    var unSubscrbeOpenLog = $scope.$on('OPEN_LOG', function () {
	    	configurePagination();
	    	updateLog();
	    });

	    $scope.$on('$destroy', unSubscrbeOpenLog);
	}

	]);