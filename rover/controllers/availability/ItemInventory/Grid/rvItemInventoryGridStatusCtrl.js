angular.module('sntRover').controller('rvItemInventoryGridStatusController', [
	'$scope',
	'rvAvailabilitySrv',
	function($scope, rvAvailabilitySrv) {

		BaseCtrl.call(this, $scope);

		$scope.hideMeBeforeFetching = false;
		$scope.showRoomTypeWiseAvailableRooms = false;
		$scope.showRoomTypeWiseBookedRooms = false;

		$scope.data = rvAvailabilitySrv.getGridDataForInventory();
		
		// if already fetched we will show without calling the API
		if (!isEmptyObject($scope.data)) {
			$scope.refreshScroller('room_availability_scroller');
			$scope.hideMeBeforeFetching = true;
			$scope.$emit("hideLoader");
		}

		// we need horizonat scroller so adding option 'scrollX', also need to get the click event on toggling button on available room
		var scrollerOptions = {scrollX: true, preventDefault: false};

  		$scope.setScroller ('room_availability_scroller', scrollerOptions);

		$scope.$on('$includeContentLoaded', function(event) {
			$scope.$emit("hideLoader");
			$scope.refreshScroller('room_availability_scroller');
		});

		/**
		* when data changed from super controller, it will broadcast an event 'changedRoomAvailableData'
		*/
		$scope.$on("changedRoomAvailableData", function (event) {
			$scope.data = rvAvailabilitySrv.getGridDataForInventory();
			$scope.refreshScroller('room_availability_scroller');
			$scope.hideMeBeforeFetching = true;
			$scope.$emit("hideLoader");
		});

		/*
		* function to toggle the display of individual room type booked list on clicking
		* the toogle button
		*/
		$scope.toggleShowRoomTypeWiseBookedRooms = function() {
			$scope.showRoomTypeWiseBookedRooms  = !$scope.showRoomTypeWiseBookedRooms ;
			$scope.refreshScroller('room_availability_scroller');
		};


		/*
		* function to toggle the display of individual room type available list on clicking
		* the toogle button
		*/
		$scope.toggleShowRoomTypeWiseAvailableRooms = function() {
			$scope.showRoomTypeWiseAvailableRooms  = !$scope.showRoomTypeWiseAvailableRooms ;
			$scope.refreshScroller('room_availability_scroller');
		};

		/**
		 * For iScroll, we need width of the table
		 * @return {Integer}
		 */
		$scope.getWidthForTable = function() {
			// if no data exist we will just return 0
			if (!_.has($scope.data, 'dates')) {
				return 0;
			}
			var leftMostRowCaptionWidth = 273,
				totalColumns 			= $scope.data && $scope.data.dates && $scope.data.dates.length,
				individualColWidth 		= 0;

			// on each column length, width is different
			if (totalColumns <= 14) {
				individualColWidth = 71;
			}
			else if (totalColumns <= 30) {
				individualColWidth = 100;
			}			
			return (totalColumns * individualColWidth + leftMostRowCaptionWidth);
		};
	}
]);