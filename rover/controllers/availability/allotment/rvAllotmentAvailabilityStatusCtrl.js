angular.module('sntRover').controller('rvAllotmentAvailabilityStatusController', [
	'$scope',
	'rvAvailabilitySrv',
	'$state',
	'ngDialog',
	'rvAllotmentConfigurationSrv',
	'$timeout',
	function($scope, rvAvailabilitySrv, $state, ngDialog, rvAllotmentConfigurationSrv, $timeout) {

		BaseCtrl.call(this, $scope);		

		$scope.togleHoldStatusVisibility = function(eventSource) {
			if (eventSource === "groupRoomTotal") {
				$scope.hideHoldStatusOf["groupRoomTotal"] = !$scope.hideHoldStatusOf["groupRoomTotal"];
			} else if (eventSource === "groupRoomPicked") {
				$scope.hideHoldStatusOf["groupRoomPicked"] = !$scope.hideHoldStatusOf["groupRoomPicked"];
			}
			$scope.refreshScroller('groupscroller');
		};
		/**
		* when data changed from super controller, it will broadcast an event 'changedRoomAvailableData'
		*/
		$scope.$on("changedRoomAvailableData", function(event) {
			$scope.hideBeforeDataFetch = false;
			$scope.data = rvAvailabilitySrv.getGridDataForAllotmentAvailability();
			$scope.refreshScroller('groupscroller');
			$scope.$emit("hideLoader");
		});
		/**
		* Setting scroller
		*/
		var setScroller = function() {
			// we need horizontal scroller so adding option 'scrollX', also need to get the click event on toggling button on available room
			var scrollerOptions = {scrollX: true, preventDefault: false};

  			$scope.setScroller ('groupscroller', scrollerOptions);
		};
		/**
		* Function to send notification for close availiblity slider
		* Param  - Group id
		*/		

		$scope.gotoAllotmentScreen = function(GroupId) {
			$scope.selectedAllotmentId = GroupId;
			$scope.$emit("CLOSE_AVAILIBILTY_SLIDER");
		};
		/**
		*  On getting backword notification after CLOSE_AVAILIBILTY_SLIDER, state changes to group screen 
		*/
		$scope.$on('CLOSED_AVAILIBILTY_SLIDER', function(event) {
			var GroupId = $scope.selectedAllotmentId;

			$timeout(function() {
				$state.go('rover.allotments.config', {
					id: GroupId,
					activeTab: 'RESERVATIONS'	
				},
				{
					reload: true
				});
				$scope.$emit('showLoader');
			}, 1000);
		});
		$scope.showDropDownForGroup = function(index) {
			return _.contains($scope.idsOfDropDownOpenedGroups, $scope.data.groupDetails[index].id);
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
			if (totalColumns <= 7) {
				individualColWidth = 147;
			}
			else if (totalColumns <= 14) {
				individualColWidth = 71;
			}
			else if (totalColumns <= 30) {
				individualColWidth = 100;
			}			
			return (totalColumns * individualColWidth + leftMostRowCaptionWidth);
		};

		/*
		* param - Holdstatus id
		* return Hold status name
		*/
		$scope.getGroupName = function(id) {
			var group = _.findWhere($scope.data.holdStatus, {id: id});

			return group && group.name;
		};

		/*
		* return class name for holdstatus row in picked up
		* DEFAULT: must always show 'CANCEL'
		*/
		$scope.getClassForHoldStatusRowInPickedUp = function(id) {
			var group,
				isDeduct,
				retCls;

			if ( $scope.hideHoldStatusOf.groupRoomPicked ) {
				retCls = 'hidden';
			} else {
				group    = _.findWhere($scope.data.holdStatus, { id: id });
				isDeduct = group && group['is_take_from_inventory'];

				if ( group && isDeduct ) {
					retCls = '';
				} else {
					retCls = 'hidden';
				}
			}

			return retCls;
		};

		/*
		* param - Hold status id
		* return - true if taken from inventory else false
		*/
		 var isTakenFromInventory = function(id) {
		 	var group = _.findWhere($scope.data.holdStatus, {id: id});

		 	return group && group.is_take_from_inventory;
		};
		/*
		* Function for show/hide Room status of Groups
		* param - index of clicked row
		* return Null
		*/

		$scope.toggleButtonClicked = function(index) {
			if (_.contains($scope.idsOfDropDownOpenedGroups, $scope.data.groupDetails[index].id)) {
				var temp = _.filter($scope.idsOfDropDownOpenedGroups, 
					function(num) { 
						return num !== $scope.data.groupDetails[index].id; 
					});

				$scope.idsOfDropDownOpenedGroups = temp;
			} else {
				$scope.idsOfDropDownOpenedGroups.push($scope.data.groupDetails[index].id);
			}
			$scope.refreshScroller('groupscroller');
		};
		/*
		* Function for release Warn popup
		* Param - Object contain details of curresponding group.
		*/
		$scope.roomHeldButtonClicked = function(detail) {
			$scope.data.clickedHeldRoomDetail = detail;
			ngDialog.open({
				template: '/assets/partials/availability/releaseRoomPopup.html',
				scope: $scope,
				closeByDocument: true
			});
		};
		/**
		 * Handle release rooms
		 * @return undefined
		 */
		$scope.releaseRooms = function() {
			var onReleaseRoomsSuccess = function(data) {
					$scope.$emit( 'hideLoader' );
					$scope.closeDialog();
					$scope.$parent.changedAvailabilityDataParams();
				},
				onReleaseRoomsFailure = function(errorMessage) {
					$scope.$emit( 'hideLoader' );
					$scope.closeDialog();
					$scope.errorMessage = errorMessage;
				},
				params = {
					allotmentId: $scope.data.clickedHeldRoomDetail.id,
					date: $scope.data.clickedHeldRoomDetail.date
				};

			$scope.$emit( 'showLoader' );
			$timeout(function() {
				$scope.invokeApi(rvAllotmentConfigurationSrv.releaseRooms, params, onReleaseRoomsSuccess, onReleaseRoomsFailure);
			}, 0);
		};
		/*
		* Initialisation goes here!
		*/
		var init = function() {
			$scope.idsOfDropDownOpenedGroups = [];
			$scope.hideBeforeDataFetch = true;
			$scope.hideHoldStatusOf = {};
			$scope.hideHoldStatusOf["groupRoomTotal"] = true;
			$scope.hideHoldStatusOf["groupRoomPicked"] = true;

			// we need to store the clicked group id since there is an issue with closing of availablity 
			$scope.selectedAllotmentId = null;

			$scope.data = rvAvailabilitySrv.getGridDataForAllotmentAvailability();
			setScroller();	
			// if already fetched we will show without calling the API
			if (!isEmptyObject($scope.data)) {
				$scope.hideBeforeDataFetch = false;
				$scope.refreshScroller('groupscroller');
				$scope.$emit("hideLoader");
			}
		};

		init();
	}
]);