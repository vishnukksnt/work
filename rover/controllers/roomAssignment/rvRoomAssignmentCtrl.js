
sntRover.controller('RVroomAssignmentController', [
	'$scope',
	'$rootScope',
	'$state',
	'$stateParams',
	'RVRoomAssignmentSrv',
	'$filter',
	'RVReservationCardSrv',
	'roomsList',
	'roomPreferences',
	'roomUpgrades',
	'$timeout',
	'ngDialog',
	'RVSearchSrv',
	'rvPermissionSrv',
	'RVNightlyDiarySrv',
	'RVUpgradesSrv',
	function($scope, $rootScope, $state, $stateParams, RVRoomAssignmentSrv, $filter, RVReservationCardSrv, roomsList, roomPreferences, roomUpgrades, $timeout, ngDialog, RVSearchSrv, rvPermissionSrv, RVNightlyDiarySrv, RVUpgradesSrv) {

	// set a back button on header
	$rootScope.setPrevState = {
		title: $filter('translate')('STAY_CARD'),
		callback: 'backToStayCard',
		scope: $scope
	};

	var self = this;

	var PRE_DEFINED_FILTERS = {
			includeNotReady: {
				id: -100,
				name: $filter('translate')('INCLUDE_NOTREADY_LABEL'),
				selected: false,
				param: 'include_not_ready'
			},
			includeDueOut: {
				id: -101,
				name: $filter('translate')('INCLUDE_DUEOUT_LABEL'),
				selected: false,
				param: 'include_dueout'
			},
			includePreassigned: {
				id: -102,
				name: $filter('translate')('INCLUDE_PREASSIGNED_LABEL'),
				selected: false,
				param: 'include_preassigned'
			},
			includeClean: {
				id: -103,
				name: $filter('translate')('INCLUDE_CLEAN_LABEL'),
				selected: false,
				param: 'include_clean'
			}

		},
		ROOMS_LISTING_PAGE_SIZE = 25,
		ROOM_LIST_SCROLLER = 'roomlist';

	BaseCtrl.call(this, $scope);

	// do we need to call the the room assigning API with forcefully assign to true
	// currently used for group reservation
	var wanted_to_forcefully_assign = false;
	var isOnlineRoomMove = "";
	var isKeySystemAvailable = false;

	var oldRoomType = '';
	var selectedRoomObject = null;

	$scope.errorMessage = '';

	var title = $filter('translate')('ROOM_ASSIGNMENT_TITLE');

	$scope.setTitle(title);

	setTimeout(function() {
				$scope.refreshScroller(ROOM_LIST_SCROLLER);
				$scope.refreshScroller('filterlist');
				},
			3000);
	$timeout(function() {
    	roomUpgrades.length === 0 ? "" : $scope.$broadcast('roomUpgradesLoaded', roomUpgrades);
		$scope.$broadcast('roomFeaturesLoaded', $scope.roomFeatures);
	});

	/* To fix the unassign button flasing issue during checkin
	*/
	$scope.roomAssgnment = {};
	$scope.roomAssgnment.inProgress = false;
	$scope.roomTransfer = {};
	$scope.isRoomLockedForThisReservation = $stateParams.cannot_move_room;

	// CICO-47546 Overbooking selection flag
	$scope.overbooking = {
		isOpted: false
	};
	/**
	* function to to get the rooms based on the selected room type
	*/
	$scope.getRooms = function() {
		$scope.searchText = '';
		var changedRoomType = _.find($scope.roomTypes, {type: $scope.roomType});

		$scope.currentRoomTypeId = changedRoomType.id;
		$scope.currentRoomTypeName = changedRoomType.description;
		$scope.currentRoomTypeCode = changedRoomType.type;
		$scope.isSearchActive = false;
		self.getRoomsByRoomType(1);
	};

	$scope.getCurrentRoomType = function() {
		for (var i = 0; i < $scope.roomTypes.length; i++) {
			if ($scope.roomTypes[i].type === $scope.roomType)
			{
				return $scope.roomTypes[i];
			}
		}
	};

	// Search for rooms having the query text irrespective of the room type
	$scope.searchRoom = _.debounce(function() {
		$scope.searchText = $scope.searchText.toUpperCase();

		if ($scope.searchText !== '' ) {
			if (($rootScope.isSingleDigitSearch && $scope.searchText.length >= 1) || (!$rootScope.isSingleDigitSearch && $scope.searchText.length >= 2)) {
				$scope.isSearchActive = true;
				self.resetFilters();
				self.doSearch(1);
			}
		} else {
			$scope.filteredRooms = [];
			$scope.isSearchActive = false;
			self.getRoomsByRoomType(1);
		}

	}, 1000);

	$scope.moveInHouseRooms = function() {
		$scope.selectedRoomType = $scope.getCurrentRoomType();
		var successCallbackMoveInHouseRooms = function(response) {
			$scope.roomTransfer.newRoomRate = response.data.new_rate_amount;
			$scope.roomTransfer.oldRoomRate = response.data.old_rate_amount;
			$scope.$emit('hideLoader');

			if ($scope.roomTransfer.newRoomRate !== $scope.roomTransfer.oldRoomRate) {
				$scope.roomTransfer.newRoomType = $scope.selectedRoomType.description;
				$scope.roomTransfer.isNewRoomType = true;
			}
			else {
				$scope.roomTransfer.newRoomType = $scope.selectedRoomType.description;
				$scope.roomTransfer.isNewRoomType = false;
			}
			ngDialog.open({
	          template: '/assets/partials/roomAssignment/rvRoomTransferConfirmation.html',
	          controller: 'rvRoomTransferConfirmationCtrl',
	          scope: $scope
        	});
		};
		var errorCallbackMoveInHouseRooms = function(error) {
			$scope.$emit('hideLoader');
			$scope.errorMessage = error;
		};
		var params = {};

		params.reservation_id = $scope.reservationData.reservation_card.reservation_id;
		params.room_type_id = $scope.selectedRoomType.id;
		params.room_number = $scope.roomTransfer.newRoomNumber;
		$scope.invokeApi(RVRoomAssignmentSrv.moveInHouseRooms, params, successCallbackMoveInHouseRooms, errorCallbackMoveInHouseRooms);

	};


	$scope.checkRoomTypeAvailability = function(roomObject) {
		if ($scope.isRoomLockedForThisReservation === "true" || roomObject.donot_move_room) {
			ngDialog.open({
                template: '/assets/partials/roomAssignment/rvRoomLocked.html',
                className: 'ngdialog-theme-default',
                scope: $scope
            });
		} else {
			var availabilityCount = _.findWhere($scope.roomTypes, {"id": roomObject.room_type_id}).availability;
			var currentRoomType = $scope.getCurrentRoomType();
			var isAvailablityExist = (availabilityCount > 0) ? true : false;
			var isOverBookPermission = rvPermissionSrv.getPermissionValue('OVERBOOK_ROOM_TYPE');

			$scope.currentRoomObject = roomObject;

			// as per CICO-34310 if room type in dropdown and room type of chosen room are same as old room type
			// No need to check availability or overbooking
			if ( currentRoomType.type === oldRoomType && roomObject.room_type_code === oldRoomType) {
				$scope.showMaximumOccupancyDialog(roomObject);
			}
			// if room type of chosen room is different from old room type, check for overbooking
			else if (!isAvailablityExist) {
				if (roomObject.is_suite_room || !isOverBookPermission) {
					ngDialog.open({
						template: '/assets/partials/roomAssignment/rvRoomTypeNotAvailable.html',
						className: 'ngdialog-theme-default',
						scope: $scope
					});
				} else {
					ngDialog.open({
						template: '/assets/partials/roomAssignment/rvOverBookRoom.html',
						controller: 'RVOverBookRoomDialogController',
						className: 'ngdialog-theme-default',
						scope: $scope
					});
				}
			} else {
				$scope.showMaximumOccupancyDialog(roomObject);
			}
		}
	};

	/**
	* function to check occupancy for the reservation
	*/
	$scope.showMaximumOccupancyDialog = function(roomObject) {
			if (!roomObject) {
				showMaxOccupancyDialogForRoomTypeChange();
			} else {
				var reservationStatus = $scope.reservationData.reservation_card.reservation_status;

				var showOccupancyMessage = false;

				if (roomObject.room_max_occupancy != null && $scope.reservation_occupancy != null) {
					if (roomObject.room_max_occupancy < $scope.reservation_occupancy) {
						showOccupancyMessage = true;
						$scope.max_occupancy = roomObject.room_max_occupancy;
					}
				} else if (roomObject.room_type_max_occupancy != null && $scope.reservation_occupancy != null) {
					if (roomObject.room_type_max_occupancy < $scope.reservation_occupancy) {
						showOccupancyMessage = true;
						$scope.max_occupancy = roomObject.room_type_max_occupancy;
					}
				}

				$scope.assignedRoom = roomObject;
				$scope.is_overbooking = true;
				if ($scope.assignedRoom.is_upgrade_room === "true") {
					var selectedRoomIndex = '';

					angular.forEach(roomUpgrades.upsell_data, function (value, key) {
						if ($scope.assignedRoom.room_number === value.upgrade_room_number) {
							selectedRoomIndex = key;
						}
					});
					$scope.$broadcast('UPGRADE_ROOM_SELECTED_FROM_ROOM_ASSIGNMENT', selectedRoomIndex);
				} else {
					$scope.roomTransfer.newRoomNumber = roomObject.room_number;
					if (showOccupancyMessage) {
						selectedRoomObject = roomObject;
						$scope.oldRoomType = oldRoomType;
						ngDialog.open({
							template: '/assets/partials/roomAssignment/rvMaximumOccupancyDialog.html',
							controller: 'rvMaximumOccupancyDialogController',
							className: 'ngdialog-theme-default',
							scope: $scope
						});
					} else {
						if (reservationStatus === "CHECKEDIN") {
							$scope.moveInHouseRooms();
						} else {
							if ($rootScope.isUpsellTurnedOn && oldRoomType !== roomObject.room_type_code) {
								$scope.oldRoomType = oldRoomType;
								$scope.openApplyChargeDialog();
							} else {
								$scope.roomTransfer.withoutRateChange = true;
								$scope.assignRoom();
							}
						}
					}
				}
			}

	};

	$scope.$on('closeDialogWithError', function(event, error) {
		ngDialog.close();
		openWantedToBorrowPopup(error);
	});

	/**
	 * to open the room aleady chhosed popup
	 * @return undefined
	 */
	var openWantedToBorrowPopup = function(dataToBorrowRoom) {
		$scope.passingParams = {
			"errorMessage": (typeof dataToBorrowRoom.errorMessage === "object") ? dataToBorrowRoom.errorMessage[0] : dataToBorrowRoom.errorMessage,
			"upsell_amount": dataToBorrowRoom.upsell_amount
		};
		ngDialog.open(
		{
			template: '/assets/partials/roomAssignment/rvGroupRoomTypeNotConfigured.html',
			controller: 'rvBorrowRoomTypeCtrl',
			scope: $scope
        });
	};

	$scope.openApplyChargeDialog = function() {
		ngDialog.open({
	          template: '/assets/partials/roomAssignment/rvApplyRoomCharge.html',
	          controller: 'rvApplyRoomChargeCtrl',
	          className: 'ngdialog-theme-default',
	          scope: $scope
        });
	};

	var changeRoomWithNoCharge = function() {
		
		var options = {
            params: {
				"reservation_id": $scope.reservationData.reservation_card.reservation_id,
				"room_no": $scope.assignedRoom ? $scope.assignedRoom.room_number : "",
				"upsell_amount": '0',
				"forcefully_assign_room": !!$scope.overbooking.isOpted && rvPermissionSrv.getPermissionValue('OVERBOOK_ROOM_TYPE') ? true : wanted_to_forcefully_assign, // CICO-47546
				"is_preassigned": $scope.assignedRoom.is_preassigned,
				"change_room_type_alone": !$scope.assignedRoom,
				'room_type': !$scope.assignedRoom ? $scope.getCurrentRoomType().type : ''
			},
            successCallBack: successCallbackUpgrade
        };

        $scope.callAPI(RVUpgradesSrv.selectUpgrade, options);
	};
	 
	var successCallbackUpgrade = function(data) {

		var dataToUpdate 		= {},
			assignedRoom 		= $scope.assignedRoom,
			selectedRoomType 	= $scope.selectedRoomType,
			reservationData 	= $scope.reservationData.reservation_card;

		_.extend (dataToUpdate,
		{
			room_id: assignedRoom.room_id,
			room_number: assignedRoom.room_number,
			room_status: "READY",
			fo_status: "VACANT",
			room_ready_status: "INSPECTED",
			is_upsell_available: (data.is_upsell_available) ? "true" : "false"
		});

		if (typeof $scope.selectedRoomType !== 'undefined') {
			_.extend (dataToUpdate,
			{
				room_type_description: selectedRoomType.description,
				room_type_code: selectedRoomType.type
			});
		}

		_.extend($scope.reservationData.reservation_card, dataToUpdate);

		RVReservationCardSrv
			.updateResrvationForConfirmationNumber(reservationData.confirmation_num, $scope.reservationData);

		$scope.goToNextView(true);

	};
	
	$scope.occupancyDialogSuccess = function() {

		var reservationStatus = $scope.reservationData.reservation_card.reservation_status;

		if (reservationStatus === "CHECKEDIN") {
				$scope.moveInHouseRooms();
		} else {
			if ($rootScope.isUpsellTurnedOn && (
						(selectedRoomObject && oldRoomType !== selectedRoomObject.room_type_code) 
						|| !$scope.assignedRoom)
					) {
				$scope.oldRoomType = oldRoomType;
				$scope.openApplyChargeDialog();
			} else {
				$scope.roomTransfer.withoutRateChange = true;
				$scope.assignRoom();
			}
			selectedRoomObject = null;
		}
	};
	// update the room details to RVSearchSrv via RVSearchSrv.updateRoomDetails - params: confirmation, data
	var updateSearchCache = function() {

		// room related details
		var data = {
			'room': ''
		};

		RVSearchSrv.updateRoomDetails($scope.reservationData.reservation_card.confirmation_num, data);
	};

	/**
	* click function to unassing rooms
	*/
	$scope.unassignRoom = function() {
		if ($scope.isRoomLockedForThisReservation === "true") {
			ngDialog.open({
                template: '/assets/partials/roomAssignment/rvRoomLocked.html',
                className: 'ngdialog-theme-default',
                scope: $scope
            });
		} else {
			var params = {
				'reservationId': parseInt($stateParams.reservation_id, 10)
			};

			// success call of un-assigningb rooms
			var successCallbackOfUnAssignRoom = function(data) {
				$scope.$emit('hideLoader');
				$scope.reservationData.reservation_card.room_id = '';
				$scope.reservationData.reservation_card.room_number = '';

				$scope.reservationData.reservation_card.room_status = '';
				$scope.reservationData.reservation_card.fo_status = '';
				$scope.reservationData.reservation_card.room_ready_status = '';
				RVReservationCardSrv.updateResrvationForConfirmationNumber($scope.reservationData.reservation_card.confirmation_num, $scope.reservationData);

				updateSearchCache();

				var params = RVNightlyDiarySrv.getCache();

                params.currentSelectedReservationId = "";
                params.currentSelectedReservation = "";
                RVNightlyDiarySrv.updateCache(params);

				$scope.backToStayCard();

			};

			// failujre call of un-assigningb rooms
			var failureCallBackOfUnAssignRoom = function(errorMessage) {

				$scope.$emit('hideLoader');
				$scope.errorMessage = errorMessage;
			};

			$scope.invokeApi(RVRoomAssignmentSrv.UnAssignRoom, params, successCallbackOfUnAssignRoom, failureCallBackOfUnAssignRoom);

		}
	};

	/**
	 * to open the room aleady chhosed popup
	 * @return undefined
	 */
	var openRoomAlreadyChoosedPopup = function() {
		ngDialog.open(
		{
			template: '/assets/partials/roomAssignment/rvRoomHasAutoAssigned.html',
			controller: 'rvRoomAlreadySelectedCtrl',
			className: 'ngdialog-theme-default',
			scope: $scope
        });
	};

	/**
	 * to open the room aleady chhosed popup
	 * @return undefined
	 */
	$scope.roomAssignedByOpera = "";
	var openPopupForErrorMessageShowing = function(errorMessage) {
		ngDialog.open(
		{
			template: '/assets/partials/roomAssignment/rvRoomAssignmentShowErrorMessage.html',
			controller: 'rvRoomAlreadySelectedCtrl',
			className: 'ngdialog-theme-default',
			scope: $scope,
			data: JSON.stringify(errorMessage)
        });
	};

	/**
	 * [successCallbackAssignRoom description]
	 * @param  {[type]} data [description]
	 * @return {[type]}      [description]
	 */

	var successCallbackAssignRoom = function(data) {
		var dataToUpdate 		= {},
			assignedRoom 		= $scope.assignedRoom,
			selectedRoomType 	= $scope.selectedRoomType,
			reservationData 	= $scope.reservationData.reservation_card;

		isOnlineRoomMove    = data.is_online_move_allowed;
		isKeySystemAvailable = (typeof data.is_online_move_allowed !== 'undefined') ? true : false;


		_.extend (dataToUpdate,
		{
			room_id: assignedRoom.room_id,
			room_status: assignedRoom.room_status,
			fo_status: assignedRoom.fo_status,
			room_ready_status: assignedRoom.room_ready_status,
			is_upsell_available: (data.is_upsell_available) ? "true" : "false"  // CICO-7904 and CICO-9628 : update the upsell availability to staycard
		});

		if (typeof $scope.selectedRoomType !== 'undefined') {
			_.extend (dataToUpdate,
			{
				room_type_description: selectedRoomType.description,
				room_type_code: selectedRoomType.type
			});
		}

		if (data.is_room_auto_assigned && !$scope.isStandAlone) {
			$scope.roomAssignedByOpera 	= data.room; // Shahul: I don't know who named this variable, What the...
			dataToUpdate.room_number 	= data.room;
			openRoomAlreadyChoosedPopup ();
		}
		else {
                    /*
                    var useAdvancedQueFlow = $rootScope.advanced_queue_flow_enabled;
                    if (useAdvancedQueFlow && ($scope.putGuestInQueue || $rootScope.putGuestInQueue)){
                        $rootScope.$emit('putInQueueAdvanced');
                        $scope.backToStayCard();
                        return;
                    }
                    */

			if ($scope.clickedButton === "checkinButton") {
				$state.go('rover.reservation.staycard.billcard',
					{
						"reservationId": reservationData.reservation_id,
						"clickedButton": "checkinButton"
					});
			}
			else {
				$scope.backToStayCard();
			}
			dataToUpdate.room_number = assignedRoom.room_number;
		}

		// updating in the central data model
		_.extend($scope.reservationData.reservation_card, dataToUpdate);

		RVReservationCardSrv
			.updateResrvationForConfirmationNumber(reservationData.confirmation_num, $scope.reservationData);

		// Yes, its over
		$scope.roomAssgnment.inProgress = false;
	};


	/**
	 * [errorCallbackAssignRoom description]
	 * @param  {[type]} error [description]
	 * @return {[type]}       [description]
	 */
	var errorCallbackAssignRoom = function(error) {
		$scope.roomAssgnment.inProgress = false;
		// since we are expecting some custom http error status in the response
		// and we are using that to differentiate among errors
		if (error.hasOwnProperty ('httpStatus')) {
			switch (error.httpStatus) {
				case 470:
						wanted_to_forcefully_assign = true;
						$timeout(openWantedToBorrowPopup.bind(null, error), 500);
				 	break;
				default:
					break;
			}
		}
		else {
				if (!$rootScope.isStandAlone) {
					$timeout(openRoomAlreadyChoosedPopup, 400);
				}
				else {
					var errorMessagePopup = {
						error: error.toString()
					};

					$timeout(openPopupForErrorMessageShowing.bind(null, errorMessagePopup), 500);
				}
		}

	};

	/**
	 * function to assign the new room for the reservation
	 * @return undefined [description]
	 */
	$scope.assignRoom = function() {

		$scope.roomAssgnment.inProgress = true;

		// API params
		var params = {};

		params.reservation_id 		= parseInt($stateParams.reservation_id, 10);
		params.room_number 			= $scope.assignedRoom.room_number;
		params.without_rate_change 	= $scope.roomTransfer.withoutRateChange;
		params.new_rate_amount 		= $scope.roomTransfer.newRoomRateChange;
		// Added for CICO-35102
		params.is_preassigned       = $scope.assignedRoom.is_preassigned;

		// CICO-17082 - As per design pattern
		params.forcefully_assign_room = wanted_to_forcefully_assign;

		wanted_to_forcefully_assign = false;
		// yes. ALL set. Go!
		var options = {
            params: params,
            successCallBack: successCallbackAssignRoom,
            failureCallBack: errorCallbackAssignRoom
        };

        $scope.callAPI(RVRoomAssignmentSrv.assignRoom, options);
	};


        $scope.goToStayCardFromAddToQueue = false;
        if (!$rootScope.reservationRoomWatch) {// alternative to $destroy, this is an init-once method
            $rootScope.reservationRoomWatch = 1;

            $rootScope.$on('putGuestInQueue', function() {
                $scope.goToStayCardFromAddToQueue = true;
                $rootScope.goToStayCardFromAddToQueue = true;

            });
        }


	$scope.goToNextView = function(shouldCloseDialog) {
		// CICO-44115
		$timeout( function() {
                if (shouldCloseDialog) {
                    ngDialog.close();
                }
        }, 500);

		if ($scope.clickedButton === "checkinButton") {
			$scope.$emit('hideLoader');
			$state.go('rover.reservation.staycard.billcard', {"reservationId": $scope.reservationData.reservation_card.reservation_id, "clickedButton": "checkinButton"});
        } else {
			$scope.backToStayCard();
		}
	};

	/**
	* setting the scroll options for the room list
	*/
	var scrollerOptions = { 
		preventDefault: false,
		probeType: 3,
		mouseWheel: true
	};

  	$scope.setScroller(ROOM_LIST_SCROLLER, scrollerOptions);
  	$scope.setScroller('filterlist', scrollerOptions);

	/**
	* Listener to update the room list when the filters changes
	*/
	$scope.$on('roomFeaturesUpdated', function(event, data) {
		$scope.isSearchActive = false;
		$scope.searchText = '';
		$scope.roomFeatures = data;
		$scope.setSelectedFiltersList();
		self.getRoomsByRoomType(1);
	});
	/**
	* Listener to update the reservation details on upgrade selection
	*/
	$scope.$on('upgradeSelected', function(event, data) {
			$scope.upgradeRoomClicked(data);
	});

	$scope.upgradeRoomClicked = function(data) {
		$scope.reservationData.reservation_card.room_id = data.room_id;
		$scope.reservationData.reservation_card.room_number = data.room_no;
		$scope.reservationData.reservation_card.room_type_description = data.room_type_name;
		$scope.reservationData.reservation_card.room_type_code = data.room_type_code;
		$scope.reservationData.reservation_card.room_status = "READY";
		$scope.reservationData.reservation_card.fo_status = "VACANT";
		$scope.reservationData.reservation_card.room_ready_status = "INSPECTED";
		// CICO-7904 and CICO-9628 : update the upsell availability to staycard
		$scope.reservationData.reservation_card.is_upsell_available = data.is_upsell_available ? "true" : "false";
		RVReservationCardSrv.updateResrvationForConfirmationNumber($scope.reservationData.reservation_card.confirmation_num, $scope.reservationData);
		if ($scope.clickedButton === "checkinButton") {
			$state.go('rover.reservation.staycard.billcard', {"reservationId": $scope.reservationData.reservation_card.reservation_id, "clickedButton": "checkinButton"});
		} else {
			$scope.backToStayCard();
		}
	};

        /**
         * function to go back to reservation details
         */
        $scope.backToStayCard = function() {
            $state.go(
                'rover.reservation.staycard.reservationcard.reservationdetails',
                {
                    id: $scope.reservationData.reservation_card.reservation_id,
                    confirmationId: $scope.reservationData.reservation_card.confirmation_num,
                    isrefresh: true,
                    isOnlineRoomMove: isOnlineRoomMove,
                    isKeySystemAvailable: isKeySystemAvailable
                });
        };

	/**
	* function to show and hide the filters view
	*/
	$scope.toggleFiltersView = function() {
		$scope.isFiltersVisible = !$scope.isFiltersVisible;
		setTimeout(function() {
				$scope.refreshScroller('filterlist');
				},
			1000);
	};
	/**
	* function to set the color coding for the room number based on the room status
	*/
	$scope.getRoomStatusClass = function() {
		var reservationStatus = $scope.reservationData.reservation_card.reservation_status;
		var roomReadyStatus = $scope.reservationData.reservation_card.room_ready_status;
		var foStatus = $scope.reservationData.reservation_card.fo_status;
		var checkinInspectedOnly = $scope.reservationData.reservation_card.checkin_inspected_only;

		return getMappedRoomStatusColor(reservationStatus, roomReadyStatus, foStatus, checkinInspectedOnly);
	};

	$scope.getNotReadyRoomTag = function(room) {
		if (!room.is_in_future) {
			if (room.room_ready_status === "PICKUP" || room.room_ready_status === "CLEAN") {
				return room.room_ready_status;
			} else {
				return room.fo_status;
			}
		} else {
			return "";
		}
	};

	$scope.getRoomStatusClassForRoom = function(room) {

		if (room.is_oos === "true") {
			return "room-grey";
		}
		var reservationRoomStatusClass = "";
		// CICO-9063 no need to show the color coding if future reservation

		if ($scope.reservationData.reservation_card.reservation_status === 'RESERVED') {
			return reservationRoomStatusClass;
		}

		var roomReadyStatus = room.room_ready_status;
		var foStatus = room.fo_status;
		var checkinInspectedOnly = room.checkin_inspected_only;

	    if (roomReadyStatus !== '') {
				if (foStatus === 'VACANT') {
					switch (roomReadyStatus) {

						case "INSPECTED":
							reservationRoomStatusClass = ' room-green';
							break;
						case "CLEAN":
							if (checkinInspectedOnly) {
								reservationRoomStatusClass = ' room-orange';
								break;
							} else {
								reservationRoomStatusClass = ' room-green';
								break;
							}
							break;
						case "PICKUP":
							reservationRoomStatusClass = " room-orange";
							break;

						case "DIRTY":
							reservationRoomStatusClass = " room-red";
							break;

		        }

				} else {
					reservationRoomStatusClass = "room-red";
				}

			}

		return reservationRoomStatusClass;
	};
	/**
	* function to change text according to the number of nights
	*/
	$scope.setNightsText = function() {
		return ($scope.reservationData.reservation_card.total_nights === 1) ? $filter('translate')('NIGHT_LABEL') : $filter('translate')('NIGHTS_LABEL');
	};
	/**
	* Moved this function to RVUpgradesCtrl#26 to fix CICO-33338
	* function to decide whether or not to show the upgrades
	*/
	// $scope.isUpsellAvailable = function(){
	// 	var showUpgrade = false;
	// 	if(!$scope.reservationData.reservation_card.is_suite && (($scope.reservationData.reservation_card.is_upsell_available === 'true') && ($scope.reservationData.reservation_card.reservation_status === 'RESERVED' || $scope.reservationData.reservation_card.reservation_status === 'CHECKING_IN'))){
	// 		showUpgrade = true;
	// 	}
	// 	return showUpgrade;
	// };

	/**
	* function to add the predefined filters to the filterlist
	*/
	$scope.addPredefinedFilters = function() {
		var group = {};

		group.group_name = "predefined";
		group.multiple_allowed = true;
		group.items = [];

		// CICO-9063 we should not show Not Ready and Due Out filter if future reservation
		if ($scope.reservationData.reservation_card.reservation_status !== 'RESERVED') {
			group.items.push(PRE_DEFINED_FILTERS.includeNotReady);
			group.items.push(PRE_DEFINED_FILTERS.includeDueOut);
		}
		group.items.push(PRE_DEFINED_FILTERS.includePreassigned);
		if ($scope.checkInInspectedOnly) {
			group.items.push(PRE_DEFINED_FILTERS.includeClean);
		}
		$scope.roomFeatures.splice(0, 0, group);
	};

	/**
	* function to prepare the array of room ids of selected floors.
	*/
	$scope.getRoomIdsInSelectedFloor = function() {
		var roomsInSelectedFloor = [];

		$scope.floors.forEach(function(element) {
					if (element.id === parseInt($scope.floorFilterData.selectedFloorId)) {
							roomsInSelectedFloor = element.room_ids;
						}
					});
		return roomsInSelectedFloor;
	};
	/**
	* function to prepare the array of selected filters' ids
	*/
	$scope.setSelectedFiltersList = function() {
		$scope.selectedFiltersList = [];
		$scope.selectedPredefinedFiltersList = [];
		var length = $scope.roomFeatures.length && $scope.roomFeatures[0].items.length,
		roomFeatures = $scope.roomFeatures;

		for (var j = 0; j < length; j++) {
			if ($scope.roomFeatures[0].items[j].selected) {
				$scope.selectedPredefinedFiltersList.push(roomFeatures[0].items[j].id);
			}
		}

		for (var i = 1; i < roomFeatures.length; i++) {
			for (var j = 0; j < roomFeatures[i].items.length; j++) {
				if (roomFeatures[i].items[j].selected) {
					$scope.selectedFiltersList.push(roomFeatures[i].items[j].id);
				}
			}
		}
	};
	/**
	* function to return the rooms list status
	*/
	$scope.isRoomListEmpty = function() {
		return ($scope.filteredRooms.length === 0);
	};

	/**
	 * Get the request params for fetching the available rooms
	 * @param {Number} pageNo - current page no
	 * @return {Object} requestParams - contains the params required for the API call
	 */
	self.getRequestParams = function( pageNo, isSearch ) {
			var requestParams = {
				per_page: ROOMS_LISTING_PAGE_SIZE,
				page_no: pageNo,
				reservation_id: $scope.reservationData.reservation_card.reservation_id
			};

			if ( isSearch ) {
				requestParams.query = $scope.searchText;
				requestParams[PRE_DEFINED_FILTERS.includeNotReady.param] = true;
				requestParams[PRE_DEFINED_FILTERS.includeDueOut.param] = true;
				requestParams[PRE_DEFINED_FILTERS.includePreassigned.param] = true;
				requestParams[PRE_DEFINED_FILTERS.includeClean.param] = true;

			} else {
				requestParams.room_type_ids = [$scope.currentRoomTypeId];
				requestParams.floor_id = $scope.selectedFloorId;

				_.each($scope.selectedPredefinedFiltersList, function( filterId ) {
					switch (filterId) {
						case PRE_DEFINED_FILTERS.includeNotReady.id:
							 requestParams[PRE_DEFINED_FILTERS.includeNotReady.param] = true;
							 break;
						case PRE_DEFINED_FILTERS.includeDueOut.id:
							 requestParams[PRE_DEFINED_FILTERS.includeDueOut.param] = true;
							 break;
						case PRE_DEFINED_FILTERS.includePreassigned.id:
							 requestParams[PRE_DEFINED_FILTERS.includePreassigned.param] = true;
							 break;
						case PRE_DEFINED_FILTERS.includeClean.id:
							 requestParams[PRE_DEFINED_FILTERS.includeClean.param] = true;
							 break;
					}
				});

				requestParams.selected_room_features = [];

				_.each($scope.selectedFiltersList, function( filterId ) {
					requestParams.selected_room_features.push(filterId);
				});
			}

			return requestParams;
		},
		// Rooms list fetch success processing
		self.onRoomsFetchSuccess = function (response) {
			$scope.filteredRooms = response.rooms;
			$scope.reservation_occupancy = response.reservation_occupancy;
			$scope.totalCount = response.total_count;
			$scope.checkInInspectedOnly = response.checkin_inspected_only;
			self.refreshScroller();
			if ($scope.myScroll.hasOwnProperty(ROOM_LIST_SCROLLER) ) {
				$scope.myScroll[ROOM_LIST_SCROLLER].scrollTo(0, 0, 100);
			}
			self.refreshPagination();
		},
		// Room fetch failure callback
		self.onRoomFetchFailure = function () {
			$scope.filteredRooms = [];
		},
		// Search rooms for the given query string
		self.doSearch = function( pageNo ) {
			var params = self.getRequestParams(pageNo, true);

			$scope.callAPI(RVRoomAssignmentSrv.searchRooms, {
                params: params,
                onSuccess: self.onRoomsFetchSuccess,
                onFailure: self.onRoomFetchFailure
            });

		},
		// Get filtered rooms based on the room type selected
	    self.getRoomsByRoomType = function( pageNo ) {
			var params = self.getRequestParams(pageNo, false);

			$scope.callAPI(RVRoomAssignmentSrv.getRoomsByRoomType, {
                params: params,
                onSuccess: self.onRoomsFetchSuccess,
                onFailure: self.onRoomFetchFailure
            });

		},
		// Load the room listing data from the API response
		self.loadAPIData = function( pageNo ) {
			if ( $scope.isSearchActive ) {
				self.doSearch( pageNo );
			} else {
				self.getRoomsByRoomType( pageNo );
			}
		},
		// Initialize the pagination control
	    self.initPagination = function() {
			$scope.paginationConfig = {
	            id: 'roomsList',
	            api: self.loadAPIData,
	            perPage: ROOMS_LISTING_PAGE_SIZE
	        };
		},
		// Refresh pagination
		self.refreshPagination = function() {
			$timeout(function () {
              $scope.$broadcast('updatePagination', 'roomsList');
        	}, 50);
		},
		// Refresh scroller
		self.refreshScroller = function() {
			$timeout(function() {
				$scope.refreshScroller(ROOM_LIST_SCROLLER);
			}, 50);
		},
		// Reset filters
		self.resetFilters = function () {
			_.each($scope.roomFeatures, function (roomFeature) {
				_.each( roomFeature.items, function (item) {
					item.selected = false;
				});
			});
			$scope.selectedPredefinedFiltersList = [];
			$scope.selectedFiltersList = [];
		},
		self.setScrollListener = function() {
			if ($scope.myScroll && $scope.myScroll.hasOwnProperty(ROOM_LIST_SCROLLER)) {
				$scope.myScroll[ROOM_LIST_SCROLLER]
					.on('scroll', function () {
						$rootScope.$emit('HIDE_ROOM_INDICATOR_POPUP');
					});
			} else {
				$timeout(self.setScrollListener, 1000);
			}
		};

	$scope.init = function() {
		$scope.roomTypes = roomPreferences.room_types;

		// CICO-54354 - Exclude suite room types for allotment reservations in room assignment screen as its not implemented
		if ( $scope.reservationData.allotment && $scope.reservationData.allotment.id) {
			$scope.roomTypes = _.filter( $scope.roomTypes, function( roomType) {
									return !roomType.is_suite;
							 });
		}

		$scope.roomFeatures = roomPreferences.room_features;
		$scope.filteredRooms = roomsList.rooms;

		$scope.floors = roomPreferences.floors.floor_details;
		$scope.reservationData = $scope.$parent.reservation;
		$scope.checkInInspectedOnly = roomsList.checkin_inspected_only;
		$scope.addPredefinedFilters();
		$scope.setSelectedFiltersList();
		$scope.reservation_occupancy = roomsList.reservation_occupancy;
		$scope.clickedButton = $stateParams.clickedButton;
		$scope.assignedRoom = "";
		oldRoomType = $scope.roomType = $stateParams.room_type;
		$scope.isStandAlone = $rootScope.isStandAlone;
		$scope.isFiltersVisible = false;
		$scope.$emit('HeaderChanged', $filter('translate')('ROOM_ASSIGNMENT_TITLE'));
		$scope.roomTransfer.oldRoomNumber = $scope.reservationData.reservation_card.room_number;
		$scope.roomTransfer.oldRoomType = $scope.reservationData.reservation_card.room_type_description;

		$scope.currentRoomTypeId = $stateParams.roomTypeId || '';
		self.initPagination();
		$scope.totalCount = roomsList.total_count;
		self.refreshScroller();
		self.refreshPagination();
		$scope.isSearchActive = false;
		$scope.searchText = '';
		$scope.currentRoomTypeCode = $scope.reservationData.reservation_card.room_type_code;
		self.setScrollListener();
	};
	$scope.init();

	/**
	* function to handle floor filter.
	*/
	$scope.applyFloorFilter = function(floorFilterData) {
		$scope.floorFilterData = floorFilterData;

		if (floorFilterData.selectedFloorId) {
			$scope.selectedFloorId = floorFilterData.selectedFloorId;
		} else {
			$scope.selectedFloorId = '';
		}
	};

	$scope.showUnassignedButton = function() {
		return $scope.reservationData.reservation_card.reservation_status.indexOf(['CHECKING_OUT']); 
	};
	/**
	* function to determine whether to show unassignroom
	*/
	$scope.showUnAssignRoom = function() {
		var r_data = $scope.reservationData.reservation_card;

		return (r_data.reservation_status.indexOf(['CHECKING_IN', 'RESERVED']) &&
			!!r_data.room_number &&
			// $rootScope.isStandAlone &&	// CICO-31323: add unassing in connected hotel
			!$scope.roomAssgnment.inProgress &&
			!r_data.is_hourly_reservation &&
			r_data.reservation_status !== "CHECKEDIN");
	};

	/**
	 * to open the room aleady chhosed popup
	 * @return undefined
	 */
	$scope.displayRoomAssignementError = function(errorMessage) {
		ngDialog.open(
		{
			template: '/assets/partials/roomAssignment/rvRoomAssignmentShowErrorMessage.html',
			className: 'ngdialog-theme-default',
			scope: $scope,
			data: JSON.stringify({
                                error: errorMessage
                          })
        });
	};

	$scope.clickedCancelButton = function() {
		$scope.assignedRoom = "";
		$scope.currentRoomObject = "";
		$scope.getRooms(true);
		$scope.closeDialog();
	};

	// Checks whether pagination should be shown or not
	$scope.shouldShowPagination = function() {
		return $scope.totalCount > ROOMS_LISTING_PAGE_SIZE;
	};

	// Checks whether room change room type button should be shown or not
	$scope.shouldShowChangeRoomTypeBtn = function() {
		return $rootScope.isStandAlone && 
			   !$rootScope.isHourlyRateOn && 
			   ($scope.reservationData.reservation_card.room_type_code !== $scope.currentRoomTypeCode) &&
			   $scope.reservationData.reservation_card.reservation_status !== 'CHECKEDIN';
	};

	// Implement the functionality to change only the room type for due-in/future reservations
	$scope.changeRoomType = function() {
		if ($scope.isRoomLockedForThisReservation === "true") {
			ngDialog.open({
                template: '/assets/partials/roomAssignment/rvRoomLocked.html',
                className: 'ngdialog-theme-default',
                scope: $scope
            });
		} else {
			var availabilityCount = (_.find($scope.roomTypes, {type: $scope.roomType})).availability,
				currentRoomType = $scope.getCurrentRoomType(),
			    isAvailablityExist = availabilityCount > 0,
			    isOverBookPermission = rvPermissionSrv.getPermissionValue('OVERBOOK_ROOM_TYPE');
			
			if (!isAvailablityExist) {
				if (currentRoomType.is_suite_room || !isOverBookPermission) {
					ngDialog.open({
						template: '/assets/partials/roomAssignment/rvRoomTypeNotAvailable.html',
						className: 'ngdialog-theme-default',
						scope: $scope
					});
				} else {
					ngDialog.open({
						template: '/assets/partials/roomAssignment/rvOverBookRoom.html',
						controller: 'RVOverBookRoomDialogController',
						className: 'ngdialog-theme-default',
						scope: $scope
					});
				}
			} else {
				showMaxOccupancyDialogForRoomTypeChange();
			}
		}
	};

	// Shows the occupancy dialog during room change
	var showMaxOccupancyDialogForRoomTypeChange = function() {
		var showOccupancyMessage = false,
				currentRoomType = $scope.getCurrentRoomType();

		if (currentRoomType.max_occupancy !== null && $scope.reservation_occupancy !== null) {
				if (currentRoomType.max_occupancy < $scope.reservation_occupancy) {
					showOccupancyMessage = true;
					$scope.max_occupancy = currentRoomType.max_occupancy;
				}
		}
			
		if (showOccupancyMessage) {
			ngDialog.open({
					template: '/assets/partials/roomAssignment/rvMaximumOccupancyDialog.html',
					controller: 'rvMaximumOccupancyDialogController',
					className: 'ngdialog-theme-default',
					scope: $scope
				});
		} else if ($rootScope.isUpsellTurnedOn) {
			$scope.openApplyChargeDialog();
		}
		else {
			changeRoomWithNoCharge();
		}
	};

	/**
	 * Handles the click on connected room icon
	 * @param {Object} event - hold the click event object
	 * @param {Object} room - selected room
	 * @return {void}
	 */
	$scope.clickRoomIndicator = function(event, room, type) {
		event.preventDefault();
		event.stopPropagation();

		if ($rootScope.lastShownRoomIdForIndicatorPopup !== room.room_id) {
			var data = {
				isSuite: room.is_suite,
				connectingRooms: room.connecting_room_no,
				clickedRoomId: room.room_id,
				indicatorType: type,
				isFromRoomAssignment: true
			};
			
			$rootScope.lastShownRoomIdForIndicatorPopup = room.room_id;

			$scope.$emit('SHOW_ROOM_INDICATOR_POPUP', {
				event: event,
				payload: data
			});

		} else {
			$scope.$emit('HIDE_ROOM_INDICATOR_POPUP');
		}
	};

}]);
