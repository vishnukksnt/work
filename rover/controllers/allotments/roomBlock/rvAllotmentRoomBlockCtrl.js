sntRover.controller('rvAllotmentRoomBlockCtrl', [
	'$scope',
	'$rootScope',
	'$filter',
	'rvPermissionSrv',
	'ngDialog',
	'rvAllotmentConfigurationSrv',
	'$timeout',
	'rvUtilSrv',
	'$q',
	'dateFilter',
	function($scope,
		$rootScope,
		$filter,
		rvPermissionSrv,
		ngDialog,
		rvAllotmentConfigurationSrv,
		$timeout,
		util,
		$q,
		dateFilter) {

		BaseCtrl.call(this, $scope);

		var self = this,
			summaryMemento,
			update_existing_reservations_rate = false,
			roomsAndRatesSelected,
			updated_contract_counts = false,
			updated_current_counts = false,
			timeLineScrollEndReached = false;

		/**
		 * util function to check whether a string is empty
		 * @param {String/Object}
		 * @return {boolean}
		 */
		$scope.isEmpty = util.isEmpty;

		/**
		 * Function to decide whether to hide 'Add Rooms Button'
		 * @return {Boolean}
		 */
		$scope.shouldHideAddRoomsButton = function() {
			return ($scope.allotmentConfigData.summary.is_cancelled ||
					$scope.allotmentConfigData.roomblock.selected_room_types_and_bookings.length > 0);
		};

		/**
		 * Function to decide whether to hide 'Rooms and Rates Button'
		 * @return {Boolean}
		 */
		$scope.shouldShowRoomsRates = function() {
			return ($scope.allotmentConfigData.roomblock.selected_room_types_and_bookings.length > 0);
		};

		/**
		 * Has Permission To EditSummaryAllotment
		 * @return {Boolean}
		 */
		var hasPermissionToEditSummaryAllotment = function() {
			return (rvPermissionSrv.getPermissionValue('EDIT_ALLOTMENT_SUMMARY'));
		};

		/**
		 * CICO-16821: Check permission to overbook room type and house separately.
		 * @return {Boolean}
		 */
		var hasPermissionToOverBookRoomType = function() {
			return (rvPermissionSrv.getPermissionValue('OVERBOOK_ROOM_TYPE'));
		};

		var hasPermissionToOverBookHouse = function() {
			return (rvPermissionSrv.getPermissionValue('OVERBOOK_HOUSE'));
		};

		/**
		 * Has Permission To Create group room block
		 * @return {Boolean}
		 */
		var hasPermissionToCreateRoomBlock = function() {
			return (rvPermissionSrv.getPermissionValue('CREATE_ALLOTMENT_ROOM_BLOCK'));
		};

		/**
		 * Has Permission To Edit group room block
		 * @return {Boolean}
		 */
		var hasPermissionToEditRoomBlock = function() {
			return (rvPermissionSrv.getPermissionValue('EDIT_ALLOTMENT_ROOM_BLOCK'));
		};

		var isContractHeld = function() {
			var contractIsHeld = true;

			_.each($scope.allotmentConfigData.roomblock.selected_room_types_and_bookings, function(roomData) {
				_.each(roomData.dates, function(config) {
					contractIsHeld = contractIsHeld && config.single === config.single_contract &&
						config.double === config.double_contract &&
						  config.triple === config.triple_contract &&
						  	config.quadruple === config.quadruple_contract;

				});
			});

			return contractIsHeld;
		};

		/**
		 * Function to decide whether to disable Add Rooms & Rates button
		 * for now we are checking only permission
		 * @return {Boolean}
		 */
		$scope.shouldDisableAddRoomsAndRate = function() {
			return (!hasPermissionToCreateRoomBlock() &&
				!hasPermissionToEditRoomBlock());
		};

		/**
		 * Logic to decide whether the room block grid view select box should be disabled.
		 * @return {Boolean}
		 */
		 $scope.shouldDisableGridViewSwitch = function() {
		 	var roomTypesConfigured = $scope.allotmentConfigData.roomblock.selected_room_types_and_bookings.length > 0;

		 	return (!roomTypesConfigured);
		 };


		 /**
		  * Apply to held counts to contract button will be disabled by default.
		  * It should be enabled after clicking apply to current button.
		  * @return {Boolean} Whether button should be disabled or not
		  */
		 $scope.shouldDisableApplyToHeldToContractButton = function() {
		 	return (!updated_current_counts);
		 };

		 $scope.shouldDisableApplyToCurrrentButton = function() {
		 	return (updated_current_counts);
		 };

		/**
		 * should we wanted to show the discard button for room type booking change
		 * @return {Boolean}
		 */
		$scope.shouldShowDiscardButton = function() {
			return ( $scope.hasBookingDataChanged &&
				  	$scope.shouldHideAddRoomsButton() );
		};

		/**
		 * Should we show buttons in roomblock
		 */
		$scope.shouldShowRoomBlockActions = function() {
			return !$scope.allotmentConfigData.summary.is_cancelled && $scope.shouldHideAddRoomsButton();
		};

		$scope.shouldShowApplyToHeldCountsButton = function() {
			// CICO-22506: simplified the functionality of the apply to held
			return $scope.activeGridView === 'CONTRACT';
		};

		$scope.shouldShowApplyToContractButton = function() {
			var hasBookingDataChanged = $scope.hasBookingDataChanged,
				isInContractGridView  = $scope.activeGridView === 'CONTRACT';

			return ( hasBookingDataChanged && isInContractGridView );
		};

		$scope.shouldShowApplyToCurrentButton = function() {
			var hasBookingDataChanged = $scope.hasBookingDataChanged,
				isInCurrentGridView  = $scope.activeGridView === 'CURRENT';

			return ( hasBookingDataChanged && isInCurrentGridView );
		};

		/**
		 * well, do we wanted to show triple button
		 * if there is any key 'triple' found in room type.dates (array of objects),
		 * it means some entry is found
		 * @param {Object} - Room Type data row
		 * @return {Boolean}
		 */
		$scope.shouldShowTripleEntryRow = function(roomType) {
			if ($scope.allotmentConfigData.summary.rate === -1) {
				var list_of_triples = _.pluck(roomType.dates, 'triple');

				// throwing undefined items
				list_of_triples = _.filter(list_of_triples, function(element) {
					return (typeof element !== "undefined");
				});

				return (list_of_triples.length > 0);
			} else {
				return roomType.rate_config.is_extra_adult_rate_configured && roomType.rate_config.is_double_rate_configured;
			}
		};

		/**
		 * should we wanted to show quadruple button
		 * if there is any key 'quadruple' found in room type.dates (array of objects),
		 * it means some entry is found
		 * @param {Object} - Room Type data row
		 * @return {Boolean}
		 */
		$scope.shouldShowQuadrupleEntryRow = function(roomType) {
			if ($scope.allotmentConfigData.summary.rate === -1) {
				var list_of_quadruples = _.pluck(roomType.dates, 'quadruple');

				// throwing undefined items
				list_of_quadruples = _.filter(list_of_quadruples, function(element) {
					return (typeof element !== "undefined");
				});

				return (list_of_quadruples.length > 0 && $scope.shouldShowTripleEntryRow(roomType));
			} else {
				return roomType.rate_config.is_extra_adult_rate_configured && roomType.rate_config.is_double_rate_configured;
			}
		};

		/**
		 * To add triple entry row to a room type
		 * @return undefined
		 */
		$scope.addTripleEntryRow = function(roomType) {
			if (!!$scope.allotmentConfigData.summary.is_cancelled || !roomType.can_edit) {
				return false;
			}
			_.each(roomType.dates, function(element) {
				element.triple = 0;
				element.triple_pickup = 0;
			});

			// we added something
			$scope.bookingDataChanging();
			refreshScroller();
		};

		/**
		 * To add quadruple entry row to a room type
		 * @return undefined
		 */
		$scope.addQuadrupleEntryRow = function(roomType) {
			if (!!$scope.allotmentConfigData.summary.is_cancelled || !roomType.can_edit) {
				return false;
			}
			_.each(roomType.dates, function(element) {
				element.quadruple = 0;
				element.quadruple_pickup = 0;
			});

			// we added something
			$scope.bookingDataChanging();
			refreshScroller();
		};

		/**
         * Checks whether the tripple button should be shown or not
         */
        $scope.shouldShowAddTrippleButton = function (roomTypeRate) {
            var showTrippleBtn = $scope.allotmentConfigData.summary.rate === -1 && !$scope.shouldShowTripleEntryRow(roomTypeRate);

            return showTrippleBtn;
        };

        /**
         * Checks whether the quadruple button should be shown or not
         */
        $scope.shouldShowAddQuadrupleButton = function (roomTypeRate) {
            var showQuadrupleBtn = $scope.allotmentConfigData.summary.rate === -1 && !$scope.shouldShowQuadrupleEntryRow(roomTypeRate) && $scope.shouldShowTripleEntryRow(roomTypeRate);                                  

            return showQuadrupleBtn;
        };

		/**
		 * should we wanted to disable single box entry
		 * @param {Object} [dateData] [description]
		 * @param {Object} - Room Type data row
		 * @return {Boolean}
		 */
		$scope.shouldDisableSingleEntryBox = function(dateData, roomType) {			
			return (!roomType.can_edit || !!$scope.allotmentConfigData.summary.is_cancelled || !dateData.isModifiable ) ;
		};

		/**
		 * should we wanted to disable double box entry
		 * @param {Object} [dateData] [description]
		 * @param {Object} - Room Type data row
		 * @return {Boolean}
		 */
		$scope.shouldDisableDoubleEntryBox = function(dateData, roomType) {
			return (!roomType.can_edit || !!$scope.allotmentConfigData.summary.is_cancelled || !dateData.isModifiable );
		};

		/**
		 * should we wanted to disable triple box entry
		 * @param {Object} [dateData] [description]
		 * @param {Object} - Room Type data row
		 * @return {Boolean}
		 */
		$scope.shouldDisableTripleEntryBox = function(dateData, roomType) {
			return (!roomType.can_edit || !!$scope.allotmentConfigData.summary.is_cancelled || !dateData.isModifiable );
		};

		/**
		 * should we wanted to disable Quadruple box entry
		 * @param {Object} [dateData] [description]
		 * @param {Object} - Room Type data row
		 * @return {Boolean}
		 */
		$scope.shouldDisableQuadrupleEntryBox = function(dateData, roomType) {
			return (!roomType.can_edit || !!$scope.allotmentConfigData.summary.is_cancelled || !dateData.isModifiable );
		};

		/**
		 * to check if any value is configured
		 * @param  {[type]}  value [description]
		 * @return {Boolean}       [description]
		 */
		$scope.isValueConfigured = function(value) {
			return _.isNumber(value) || parseInt(value) >= 0;
		};

		/**
		 * should we wanted to disable add triple button
		 * @param {Object} [dateData] [description]
		 * @param {Object} - Room Type data row
		 * @return {Boolean}
		 */
		$scope.shouldDisableAddTripleButton = function(roomType) {
			return (!roomType.can_edit || !!$scope.allotmentConfigData.summary.is_cancelled);
		};

		/**
		 * should we wanted to disable add triple button
		 * @param {Object} [dateData] [description]
		 * @param {Object} - Room Type data row
		 * @return {Boolean}
		 */
		$scope.shouldDisableAddQuadrupleButton = function(roomType) {
			return (!roomType.can_edit || !!$scope.allotmentConfigData.summary.is_cancelled);
		};

		/**
		 * to copy the single-contract value entered in the column
		 * to the row
		 * @param {Object} - cell data
		 * @param {Object} - row data
		 * @return undefined
		 */
		$scope.copySingleContractValueToOtherBlocks = function(cellData, rowData) {
			var data = {
				occupancy: 'single_contract',
				value: cellData.single_contract,
				isContract: true
			};

			$scope.selectedRoomType = rowData;
			$scope.showMassUpdateEndDateConfirmation(data);
		};

		$scope.copySingleHeldValueToOtherBlocks = function(cellData, rowData) {
			var data = {
				occupancy: 'single',
				value: cellData.single
			};

			$scope.selectedRoomType = rowData;
			$scope.showMassUpdateEndDateConfirmation(data);
		};

		/**
		 * to copy the double & double_pick up value entered in the column
		 * to the row
		 * @param {Object} - cell data
		 * @param {Object} - row data
		 * @return undefined
		 */
		$scope.copyDoubleContractValueToOtherBlocks = function(cellData, rowData) {
			var data = {
				occupancy: 'double_contract',
				value: cellData.double_contract,
				isContract: true
			};

			$scope.selectedRoomType = rowData;
			$scope.showMassUpdateEndDateConfirmation(data);
		};

		$scope.copyDoubleHeldValueToOtherBlocks = function(cellData, rowData) {
			var data = {
				occupancy: 'double',
				value: cellData.double
			};

			$scope.selectedRoomType = rowData;
			$scope.showMassUpdateEndDateConfirmation(data);
		};

		/**
		 * to copy the triple & triple_pick up value entered in the column
		 * to the row
		 * @param {Object} - cell data
		 * @param {Object} - row data
		 * @return undefined
		 */
		$scope.copyTripleContractValueToOtherBlocks = function(cellData, rowData) {
			var data = {
				occupancy: 'triple_contract',
				value: cellData.triple_contract,
				isContract: true
			};

			$scope.selectedRoomType = rowData;
			$scope.showMassUpdateEndDateConfirmation(data);
		};

		$scope.copyTripleHeldValueToOtherBlocks = function(cellData, rowData) {
			var data = {
				occupancy: 'triple',
				value: cellData.triple
			};

			$scope.selectedRoomType = rowData;
			$scope.showMassUpdateEndDateConfirmation(data);
		};

		/**
		 * to copy the quadruple & quadruple_pick up value entered in the column
		 * to the row
		 * @param {Object} - cell data
		 * @param {Object} - row data
		 * @return undefined
		 */
		$scope.copyQuadrupleContractValueToOtherBlocks = function(cellData, rowData) {
			var data = {
				occupancy: 'quadruple_contract',
				value: cellData.quadruple_contract,
				isContract: true
			};

			$scope.selectedRoomType = rowData;
			$scope.showMassUpdateEndDateConfirmation(data);
		};

		$scope.copyQuadrupleHeldValueToOtherBlocks = function(cellData, rowData) {
			var data = {
				occupancy: 'quadruple',
				value: cellData.quadruple
			};

			$scope.selectedRoomType = rowData;
			$scope.showMassUpdateEndDateConfirmation(data);
		};

		/**
		 * Shows the confirmation popup with ability to select an end date defaulting to allotment
		 * end date for mass update.
		 */
		$scope.showMassUpdateEndDateConfirmation = function(data) {
			ngDialog.open({
				template: '/assets/partials/allotments/details/rvAllotmentConfirmMassUpdatePopup.html',
				scope: $scope,
				className: '',
				closeByDocument: false,
				closeByEscape: false,
				data: JSON.stringify(data),
				controller: "rvAllotmentRoomBlockMassUpdatePopupCtrl"
			});
		};

		/**
		 * Return true when user reaches end of horizontal scroll.
		 * @return {Boolean}
		 */
		$scope.shouldShowLoadNextSetButton = function() {
			var nextStart = new tzIndependentDate($scope.timeLineStartDate);

					nextStart.setDate(nextStart.getDate() + 14);
			var hasNextSet = nextStart < $scope.allotmentConfigData.summary.block_to;

			return timeLineScrollEndReached && hasNextSet;
		};

		/**
		 * CICO-21222
		 * function to load next 14 days data.
		 */
		$scope.fetchNextSetOfRoomBlockData = function() {
			$scope.timeLineStartDate.setDate($scope.timeLineStartDate.getDate() + 14);
			$scope.fetchCurrentSetOfRoomBlockData();
		};

		/**
		 * Calls API to fetch room block data for a specific date range
		 * Start date is selected from date picker, End date is computed
		 */
		$scope.fetchCurrentSetOfRoomBlockData = function() {
			// CICO-21222 Introduced pagination in room block timeline.
			var allotmentStartDate = $scope.allotmentConfigData.summary.block_from,
				allotmentEndDate   = $scope.allotmentConfigData.summary.block_to;

			// check lower  bound
			if (allotmentStartDate > $scope.timeLineStartDate) {
				$scope.timeLineStartDate = new tzIndependentDate(allotmentStartDate);
			}

			// 14 days are shown by default.
			$scope.timeLineEndDate = new tzIndependentDate($scope.timeLineStartDate);
			$scope.timeLineEndDate.setDate($scope.timeLineStartDate.getDate() + 14);

			// check upper bound
			if ($scope.timeLineStartDate > allotmentEndDate) {
				$scope.timeLineStartDate = new tzIndependentDate(allotmentEndDate);
			}
			if ($scope.timeLineEndDate > allotmentEndDate) {
				$scope.timeLineEndDate = new tzIndependentDate(allotmentEndDate);
			}

			var options = {
				start_date: formatDateForAPI($scope.timeLineStartDate),
				end_date: formatDateForAPI($scope.timeLineEndDate)
			};

			$scope.fetchRoomBlockGridDetails(options);
		};

		/**
		 * Function to fire when user selects date
		 * @return {undefined}
		 */
		$scope.onTimeLineStartDatePicked = function(date, datePickerObj) {
			$scope.timeLineStartDate = new tzIndependentDate(util.get_date_from_date_picker(datePickerObj));
			$scope.fetchCurrentSetOfRoomBlockData();
		};

		/**
		 * when the booking data changing
		 * @return undefined
		 */
		$scope.bookingDataChanging = function() {
			// we are changing the model to
			$scope.hasBookingDataChanged = true;
			updated_contract_counts = false;
			updated_current_counts = false;
			runDigestCycle();
		};

		/**
		 * to run angular digest loop,
		 * will check if it is not running
		 * return - None
		 */
		var runDigestCycle = function() {
			if (!$scope.$$phase) {
				$scope.$digest();
			}
		};

		(function() {
			var gridViewTemplates = {
				CONTRACT: '/assets/partials/allotments/details/grids/rvAllotmentConfigurationContractGrid.html',
				CURRENT: '/assets/partials/allotments/details/grids/rvAllotmentConfigurationCurrentGrid.html',
				RELEASE: '/assets/partials/allotments/details/grids/rvAllotmentConfigurationReleaseGrid.html'
			};

			$scope.getGridViewTemplateurl = function(mode) {
				return gridViewTemplates[mode] || gridViewTemplates.CONTRACT;
			};

		})();

		$scope.setActiveGridView = function(mode) {
			$scope.activeGridView = mode;
			$scope.gridViewTemplateUrl = $scope.getGridViewTemplateurl($scope.activeGridView);
			$timeout(reinit, 500);
		};

		/**
		 * Fired when user changes the active grid view from the select box
		 * @return {undefined}
		 */
		$scope.activeGridViewChanged = function() {
			$scope.$emit('showLoader');
			$timeout(function() {
				// Discard all the changes in current view
				// only if there are any changes
				if ( $scope.shouldShowDiscardButton() ) {
					$scope.clickedOnDiscardButton();
				}

				$scope.gridViewTemplateUrl = $scope.getGridViewTemplateurl($scope.activeGridView);

				$scope.$emit("hideLoader");
				$timeout(reinit, 100);
			}, 0);

			// reset data flags
			updated_current_counts = false;
			updated_contract_counts = false;
			$scope.hasBookingDataChanged = false;
		};

		/**
		 * when create button clicked, we will show the 'Hold Status and more section'
		 * @return None
		 */
		$scope.clickedOnCreateButton = function() {
			$scope.createButtonClicked = true;
		};

		/**
		 * when save button clicked,
		 * @return None
		 */
		$scope.clickedOnSaveButton = function() {
			// do not force overbooking for the first time
			$scope.saveRoomBlock(false);
		};

		/**
		 * CICO-22506:
		 * Copy entire contract to held once the user is ready to do so.
		 */
		$scope.clickedOnApplyToHeldCountsButton = function() {
			var params = {
				allotment_id: $scope.allotmentConfigData.summary.allotment_id,
				forcefully_overbook_and_assign_rooms: true
			};

			var successCallback = function() {
				$scope.fetchCurrentSetOfRoomBlockData();
			};

			var errorCallback = function(error) {
				$scope.errorMessage = error;
			};

			var options = {
				params: params,
				successCallBack: successCallback,
				failureCallBack: errorCallback
			};

			$scope.callAPI(rvAllotmentConfigurationSrv.copyContactToHeld, options);
		};

		/**
		 * CICO-19121:
		 * Fired when user clickes on the button in contract view.
		 * Saving updated contract count does not affect inventory.
		 */
		$scope.clickedOnUpdateContractButton = function() {
			$scope.saveRoomBlock(false, true);
		};

		$scope.clickedOnUpdateCurrentButton = function() {
			// Saving updated contract count does not affect inventory.
			$scope.saveRoomBlock(false);
		};

		/**
		 * when discard button clicked, we will set the booking data with old copy
		 * @return None
		 */
		$scope.clickedOnDiscardButton = function() {

			// $scope.allotmentConfigData.roomblock.selected_room_types_and_bookings = util.deepCopy($scope.copy_selected_room_types_and_bookings);
			// put back the original data, not using deep copy since its bad :(
			// this can be improved further if we can know which fields have been changed
			_.each($scope.allotmentConfigData.roomblock.selected_room_types_and_bookings, function(eachRoomType) {
				_.each(eachRoomType.dates, function(dateData) {
					dateData['double']          = dateData['old_double'];
					dateData['double_contract'] = dateData['old_double_contract'];
					dateData['double_pickup']   = dateData['old_double_pickup'];
					dateData['release_days']    = dateData['old_release_days'];
					dateData['single']          = dateData['old_single'];
					dateData['single_contract'] = dateData['old_single_contract'];
					dateData['single_pickup']   = dateData['old_single_pickup'];
					dateData['triple']   		= dateData['old_triple'];
					dateData['triple_contract'] = dateData['old_triple_contract'];
					dateData['triple_pickup'] 	= dateData['old_triple_pickup'];
					dateData['quadruple']   	= dateData['old_quadruple'];
					dateData['quadruple_contract'] = dateData['old_quadruple_contract'];
					dateData['quadruple_pickup'] = dateData['old_quadruple_pickup'];
				});
			});

			// and our isn't changed
			$scope.hasBookingDataChanged = false;
			updated_contract_counts = false;
			updated_current_counts = false;
		};

		var successCallBackOfSaveRoomBlock = function(data) {
			// CICO-18621: Assuming room block will be saved if I call
			// it with force flag.
			if (!data.saved_room_block) {
				$scope.saveRoomBlock(true);
				return false;
			}

			// reset flags
			updated_contract_counts = !updated_contract_counts;
			updated_current_counts = !updated_current_counts;

			// we have saved everything we have
			// so our data is new
			// $scope.copy_selected_room_types_and_bookings =
			// 	angular.copy($scope.allotmentConfigData.roomblock.selected_room_types_and_bookings);

			// since deep suxx
			_.each($scope.allotmentConfigData.roomblock.selected_room_types_and_bookings, function(eachRoomType) {
				_.each(eachRoomType.dates, function(dateData) {
					dateData['old_double']          = dateData['double'];
					dateData['old_double_contract'] = dateData['double_contract'];
					dateData['old_double_pickup']   = dateData['double_pickup'];
					dateData['old_release_days']    = dateData['release_days'];
					dateData['old_single']          = dateData['single'];
					dateData['old_single_contract'] = dateData['single_contract'];
					dateData['old_single_pickup']   = dateData['single_pickup'];
					dateData['old_triple']   		= dateData['triple'];
					dateData['old_triple_contract'] = dateData['triple_contract'];
					dateData['old_triple_pickup'] 	= dateData['triple_pickup'];
					dateData['old_quadruple']   	= dateData['quadruple'];
					dateData['old_quadruple_contract'] = dateData['quadruple_contract'];
					dateData['old_quadruple_pickup'] = dateData['quadruple_pickup'];
				});
			});

			$scope.hasBookingDataChanged = false;
			$scope.allotmentConfigData.summary.rooms_total = $scope.getMaxOfBookedRooms();

			// as per CICO-16087, we have to refetch the occupancy and availability after saving
			// so, callinng the API again
			$scope.fetchCurrentSetOfRoomBlockData();
		};

		$scope.checkOverBooking = function(error) {
			var isHouseOverbooked  	 	= error.is_house_overbooked,
				isRoomTypeOverbooked   	= error.is_room_type_overbooked,
				canOverbookHouse		= hasPermissionToOverBookHouse(),
				canOverbookRoomType		= hasPermissionToOverBookRoomType(),
				canOverBookBoth			= canOverbookHouse && canOverbookRoomType;

			if ( !(isRoomTypeOverbooked || isHouseOverbooked) ) {
				return false;
			}

			// show appropriate overbook message.
			if (isHouseOverbooked && isRoomTypeOverbooked && canOverBookBoth) {
				return "HOUSE_AND_ROOMTYPE_OVERBOOK";
			}
			else if (isHouseOverbooked && canOverbookHouse) {
				return "HOUSE_OVERBOOK";
			}
			else if (isRoomTypeOverbooked && canOverbookRoomType) {
				return "ROOMTYPE_OVERBOOK";
			}
			// Overbooking occurs and has no permission.
			else {
				return "NO_PERMISSION";
			}

		};

		/**
		 * Handles the failure case of inventory save
		 * A 470 status for response means overbooking occurs.
		 * @param 	{object} 	API response
		 * @returns {undefined}
		 */
		var failureCallBackOfSaveRoomBlock = function(error) {
			if (error.hasOwnProperty ('httpStatus')) {
				if (error.httpStatus === 470) {
					var message = $scope.checkOverBooking(error);

					if (!message) {
						// overbooking condition does not exist
						$scope.saveRoomBlock(true);
					}
					else {
						if (message === "NO_PERMISSION") {
							showNoPermissionOverBookingPopup();
						} else {
							showOverBookingPopup(message);
						}
					}
				}
			} else {
				$scope.errorMessage = error;
			}
		};

		/**
		 * Method to make the API call to save the room block grid
		 * Will be called from
		 * 	1. The controller $scope.onBlockRoomGrid
		 * 	2. The warnReleaseRoomsPopup.html template
		 * @param {boolean} forceOverbook
		 * @param {boolean} if only contract counts updated
		 * @return undefined
		 */
		$scope.saveRoomBlock = function(forceOverbook, isContratUpdate, isOverbooking) {
			forceOverbook = forceOverbook || false;
			isContratUpdate = isContratUpdate || false;

			var data = $scope.allotmentConfigData.roomblock.selected_room_types_and_bookings;
			var params = {
				allotment_id: $scope.allotmentConfigData.summary.allotment_id,
				results: data,
				forcefully_overbook_and_assign_rooms: forceOverbook,
				is_contract_save: isContratUpdate,
				overbook_chosen: isOverbooking
			};

			var options = {
				params: params,
				successCallBack: successCallBackOfSaveRoomBlock,
				failureCallBack: failureCallBackOfSaveRoomBlock
			};

			$scope.callAPI(rvAllotmentConfigurationSrv.saveRoomBlockBookings, options);
		};

		$scope.saveReleaseDays = function(massUpdateReleaseDays, massUpdateEndDate) {
			var params = {
				allotment_id: $scope.allotmentConfigData.summary.allotment_id,
				results: $scope.allotmentConfigData.roomblock.selected_room_types_and_bookings
			},
			allotmentStartDate = $scope.allotmentConfigData.summary.block_from,
			businessDate = new tzIndependentDate($rootScope.businessDate);

			if (massUpdateReleaseDays) {
				params.start_date = allotmentStartDate;
				if (allotmentStartDate < businessDate) {
					params.start_date = businessDate;
				}
				params.start_date = formatDateForAPI(params.start_date);
				params.release_days = parseInt(massUpdateReleaseDays);				
				params.end_date = formatDateForAPI(massUpdateEndDate);
			}

			var options = {
				params: params,
				successCallBack: successCallBackOfSaveRoomBlock,
				failureCallBack: failureCallBackOfSaveRoomBlock
			};

			$scope.callAPI(rvAllotmentConfigurationSrv.saveRoomBlockReleaseDays, options);
		};

		/**
		 * Method to show oerbooking popup - No permission popup
		 * @return undefined
		 */
		var showNoPermissionOverBookingPopup = function() {
			// Show overbooking message
			ngDialog.open({
				template: '/assets/partials/allotments/details/rvAllotmentNoPermissionOverBookingPopup.html',
				className: '',
				scope: $scope,
				closeByDocument: false,
				closeByEscape: false
			});
		};

		/**
		 * Method to show oerbooking popup
		 * @return undefined
		 */
		var showOverBookingPopup = function(message) {
			// Show overbooking message
			var dialogData = {
				message: message
			};

			ngDialog.open({
				template: '/assets/partials/allotments/details/rvAllotmentWarnOverBookingPopup.html',
				className: '',
				scope: $scope,
				closeByDocument: false,
				closeByEscape: false,
				data: JSON.stringify(dialogData)
			});
		};

		/**
		 * To open Add Rooms & Rates popup
		 * @return - undefined
		 */
		var openAddRoomsAndRatesPopup = function() {
			ngDialog.open({
				template: '/assets/partials/allotments/details/rvAllotmentAddRoomAndRatesPopup.html',
				scope: $scope,
				controller: 'rvAllotmentAddRoomsAndRatesPopupCtrl'
			});
		};

		/**
		 * to get the room type name against a room id
		 * @param  {Integer} id - of the room type
		 * @return {String}    Room type name, will return blank string if room type not found
		 */
		$scope.getRoomTypeName = function(id) {
			id = parseInt(id);
			var roomType = _.findWhere($scope.roomTypes, {
				id: id
			});

			if (roomType) {
				return roomType.name;
			}
			return "";
		};

		/**
		 * to get the total contracted agsint all room types for a day
		 * @param {integer} - nth Day
		 * @return {Integer}
		 */
		$scope.getTotalContractedOfDay = function(dateIndex) {
			var cInt 			= util.convertToInteger,
				total 			= 0,
		    	roomBlockData 	= $scope.allotmentConfigData.roomblock.selected_room_types_and_bookings;

		    // Loop each roomtype and calculate the total contracted number for the date
			_.each(roomBlockData, function(roomType) {
				var dateData 		= roomType.dates[dateIndex],
					roomtypeTotal 	= $scope.getTotalContractedOfIndividualRoomType(dateData);

				total += roomtypeTotal;
			});

			return total;
		};

		/**
		 * to get the total held agsint all room types for a day
		 * @param {Object} - room type data
		 * @return {Integer}
		 */
		$scope.getTotalHeldOfDay = function(dateIndex) {
			var cInt 			= util.convertToInteger,
				total 			= 0,
		    	roomBlockData 	= $scope.allotmentConfigData.roomblock.selected_room_types_and_bookings;

		    // Loop each roomtype and calculate the total contracted number for the date
			_.each(roomBlockData, function(roomType) {
				var dateData 		= roomType.dates[dateIndex],
					roomtypeTotal 	= $scope.getTotalHeldOfIndividualRoomType(dateData);

				total += roomtypeTotal;
			});

			return total;
		};

		/**
		 * to get the total picked up agsint all room types for a day
		 * @param {Object} - room type data
		 * @return {Integer}
		 */
		$scope.getTotalPickedUpOfDay = function(dateIndex) {
			var cInt 			= util.convertToInteger,
				total 			= 0,
		    	roomBlockData 	= $scope.allotmentConfigData.roomblock.selected_room_types_and_bookings;

		    // Loop each roomtype and calculate the total contracted number for the date
			_.each(roomBlockData, function(roomType) {
				var dateData 		= roomType.dates[dateIndex],
					roomtypeTotal 	= $scope.getTotalPickedUpOfIndividualRoomType(dateData);

				total += roomtypeTotal;
			});

			return total;
		};

		/**
		 * to get the total contracted agsint a indivual room type
		 * @param {Object} - room type data
		 * @return {Integer}
		 */
		$scope.getTotalContractedOfIndividualRoomType = function(roomType) {
			var cInt = util.convertToInteger;

			// since user may have entered wrong input
			roomType.single_contract = (roomType.single_contract !== '') ? cInt(roomType.single_contract) : '';
			roomType.double_contract = (roomType.double_contract !== '') ? cInt(roomType.double_contract) : '';

			// the area of 'night watch man', they may be active or sleeping
			var quadruple = 0;

			if (roomType.quadruple_contract) {
				roomType.quadruple_contract = cInt(roomType.quadruple_contract);
				quadruple = roomType.quadruple_contract;
			}
			var triple = 0;

			if (roomType.triple_contract) {
				roomType.triple_contract = cInt(roomType.triple_contract);
				triple = roomType.triple_contract;
			}

			return (cInt(roomType.single_contract) + cInt(roomType.double_contract) + (triple) + (quadruple));
		};

		/**
		 * to get the total held agsint a indivual room type
		 * @param {Object} - room type data
		 * @return {Integer}
		 */
		$scope.getTotalHeldOfIndividualRoomType = function(roomType) {
			var cInt = util.convertToInteger;

			// since user may have entered wrong input
			roomType.single = (roomType.single !== '') ? cInt(roomType.single) : '';
			roomType.double = (roomType.double !== '') ? cInt(roomType.double) : '';

			// the area of 'night watch man', they may be active or sleeping
			var quadruple = 0;

			if (roomType.quadruple) {
				roomType.quadruple = cInt(roomType.quadruple);
				quadruple = roomType.quadruple;
			}
			var triple = 0;

			if (roomType.triple) {
				roomType.triple = cInt(roomType.triple);
				triple = roomType.triple;
			}

			return (cInt(roomType.single) + cInt(roomType.double) + (triple) + (quadruple));
		};

		/**
		 * to get the total picked up agsint a indivual room type
		 * @param {Object} - room type
		 * @return {Integer}
		 */
		$scope.getTotalPickedUpOfIndividualRoomType = function(roomType) {
			var cInt = util.convertToInteger;

			// since user may have entered wrong input
			roomType.single_pickup = (roomType.single_pickup !== '') ? cInt(roomType.single_pickup) : '';
			roomType.double_pickup = (roomType.double_pickup !== '') ? cInt(roomType.double_pickup) : '';

			// the area of 'night watch man', they may be active or sleeping
			var quadruple_pickup = 0;

			if (roomType.quadruple_pickup) {
				roomType.quadruple_pickup = cInt(roomType.quadruple_pickup);
				quadruple_pickup = roomType.quadruple_pickup;
			}
			var triple_pickup = 0;

			if (roomType.triple_pickup) {
				roomType.triple_pickup = cInt(roomType.triple_pickup);
				triple_pickup = roomType.triple_pickup;
			}

			return (cInt(roomType.single_pickup) + cInt(roomType.double_pickup) + (triple_pickup) + (quadruple_pickup));

		};

		/**
		 * To get the max booked rooms among dates
		 * @return {Integer}
		 */
		$scope.getMaxOfBookedRooms = function() {
			var ref = $scope.allotmentConfigData.roomblock.selected_room_types_and_bookings,
				totalBookedOfEachDate = [],
				arrayOfDateData = [],
				dateWiseAllotmentedData = {},
				sum = 0;

			if (!ref.length) {
				return 0;
			}
			// first of all, we need group by 'date' data as our current data is room type row based
			// we need these 'datewisedata' in single array
			_.each(ref, function(el) {
				_.each(el.dates, function(el1) {
					arrayOfDateData.push(el1);
				});
			});

			// now we have all 'tomatoes' in a single bag
			// we are going to group by them on the basis of quality :D (date)
			dateWiseAllotmentedData = _.groupBy(arrayOfDateData, 'date');

			// forming sum of individual
			_.each(dateWiseAllotmentedData, function(el) {
				sum = 0;
				_.each(el, function(eachDateData) {
					sum += $scope.getTotalHeldOfIndividualRoomType(eachDateData);
				});
				totalBookedOfEachDate.push(sum);
			});

			// returning max among them, simple
			var max = _.max(totalBookedOfEachDate);

			return max;
		};

		/**
		 * When availability and BAR fetch completed
		 * @param  {Objects} data of All Room Type
		 * @return undefined
		 */
		var successCallBackOfRoomTypeAndRatesFetch = function(data) {
			$scope.allotmentConfigData.roomblock.selected_room_types_and_rates = data.room_type_and_rates;
		};

		/**
		 * When all things reqd to open popup is completed
		 * @return undefined
		 */
		var successFetchOfAllReqdForRoomAndRatesPopup = function() {
			$scope.$emit('hideLoader');
			openAddRoomsAndRatesPopup();
		};

		/**
		 * When any of the things reqd to open popup is failed
		 * @return undefined
		 */
		var failedToFetchAllReqdForRoomAndRatesPopup = function(errorMessage) {
			$scope.errorMessage = errorMessage;
			$scope.$emit('hideLoader');
		};

		/**
		 * when Add Room & Rates button clicked, we will fetch all room types, fetch BAR
		 * (BEST AVAILABLE RATE) & Availabiolity
		 * then we will show the Add Room & Rates popup
		 * @return None
		 */
		$scope.clickedOnAddRoomsAndRatesButton = function() {
			// if it has no permission to do this, we will not alloq
			var hasNoPermissionToProceed = $scope.shouldDisableAddRoomsAndRate();

			if (hasNoPermissionToProceed) {
				return;
			}

			var promises = [];
			// we are not using our normal API calling since we have multiple API calls needed

			$scope.$emit('showLoader');

			// get Room type & rates for this group
			var paramsForRoomTypeAndRates = {
				id: $scope.allotmentConfigData.summary.allotment_id
			};

			promises.push(rvAllotmentConfigurationSrv
				.getSelectedRoomTypesAndRates(paramsForRoomTypeAndRates)
				.then(successCallBackOfRoomTypeAndRatesFetch)
			);

			// Lets start the processing
			$q.all(promises)
				.then(successFetchOfAllReqdForRoomAndRatesPopup, failedToFetchAllReqdForRoomAndRatesPopup);
		};

		/**
		 * To open Room Block Pickedup Reservations Popup.
		 */
		$scope.confirmUpdateRatesWithPickedReservations = function(selectedRoomTypeAndRates) {
			roomsAndRatesSelected = selectedRoomTypeAndRates;
			ngDialog.open({
				template: '/assets/partials/allotments/details/rvAllotmentRoomBlockPickedupReservationsPopup.html',
				scope: $scope,
				className: '',
				closeByDocument: false,
				closeByEscape: false
			});
		};

		/**
		 * To check whether inhouse reservations exists.
		 */
		$scope.checkIfInhouseReservationsExists = function () {
			ngDialog.close();
			var isInhouseReservationsExists = false;

			angular.forEach (roomsAndRatesSelected, function (row) {
				if (row.total_inhouse_reservations_count > 0) {
					isInhouseReservationsExists = true;
				}
			});

			if (isInhouseReservationsExists) {
				openInhouseReservationsExistsPopup();
			}
			else {
				$scope.saveNewRoomTypesAndRates();
			}
		};

		/*
		 * Open popup to inform if inhouse reservations exists.
		 */
		var openInhouseReservationsExistsPopup = function () {
			ngDialog.open({
				template: '/assets/partials/allotments/details/rvAllotmentInhouseReservationsExistsPopup.html',
				scope: $scope,
				className: '',
				closeByDocument: false,
				closeByEscape: false
			});
		};

		/*
		 * To apply rate change only to new reservations by setting flag update_existing_reservations_rate.
		 */
		$scope.updateRateToNewReservations = function () {
			ngDialog.close();
			angular.forEach (roomsAndRatesSelected, function (row) {
				if (row.is_configured_in_allotment) {
					row.update_existing_reservations_rate = false;
				}
			});
			$scope.saveNewRoomTypesAndRates();
		};

		/**
		 * To update selected room types and rates.
		 */
		$scope.saveNewRoomTypesAndRates = function () {
			ngDialog.close();
			var options = {
				params: formSaveNewRoomTypesAndRatesParams(roomsAndRatesSelected),
				successCallBack: successCallBackOfSaveNewRoomTypesAndRates
			};

			$scope.callAPI(rvAllotmentConfigurationSrv.updateSelectedRoomTypesAndRates, options);
		};

		var successCallBackOfSaveNewRoomTypesAndRates = function () {
			$scope.fetchCurrentSetOfRoomBlockData();
		};

		/**
		 * function to form save roomtype and rates API params
		 * @return {Object}
		 */
		var formSaveNewRoomTypesAndRatesParams = function(roomsAndRatesSelected) {
			// we only want rows who have room type choosed
			var selectedRoomTypeAndRates = _.filter(roomsAndRatesSelected, function(obj) {
				return (typeof obj.room_type_id !== "undefined" && obj.room_type_id !== '');
			});
			// since selectedRoomTypeAndRates containst some unwanted keys
			var wanted_keys = ["room_type_id", "single_rate", "double_rate", "extra_adult_rate", "rate_id", "best_available_rate_id", "update_existing_reservations_rate"];

			selectedRoomTypeAndRates = util.getListOfKeyValuesFromAnArray(selectedRoomTypeAndRates, wanted_keys);

			var params = {
				allotment_id: $scope.allotmentConfigData.summary.allotment_id,
				room_type_and_rates: selectedRoomTypeAndRates
			};

			return params;
		};

		/**
		 * Success callback of room block details API
		 */
		var successCallBackOfFetchRoomBlockGridDetails = function(data) {
			$scope.$emit("showLoader");
			$timeout(function() {
				var roomBlockData = $scope.allotmentConfigData.roomblock,
					businessDate = new tzIndependentDate($rootScope.businessDate);

				// We have resetted the data.
				$scope.hasBookingDataChanged = false;

				_.each(data.results, function(eachRoomType) {
					eachRoomType.copy_values_to_all = false;
					eachRoomType.start_date = formatDateForAPI($scope.timeLineStartDate);
					_.each(eachRoomType.dates, function(dateData) {
						// CICO-43700
						var formattedDate = new tzIndependentDate(dateData.date);

						dateData.isModifiable = formattedDate >= businessDate;
						// we need indivual room type total bookings of each date initially,
						// we are using this for overbooking calculation
						dateData.old_total = $scope.getTotalHeldOfIndividualRoomType(dateData);

						// keeping original data
						dateData['old_double']          = dateData['double'];
						dateData['old_double_contract'] = dateData['double_contract'];
						dateData['old_double_pickup']   = dateData['double_pickup'];
						dateData['old_release_days']    = dateData['release_days'];
						dateData['old_single']          = dateData['single'];
						dateData['old_single_contract'] = dateData['single_contract'];
						dateData['old_single_pickup']   = dateData['single_pickup'];
						dateData['old_triple']   		= dateData['triple'];
						dateData['old_triple_contract'] = dateData['triple_contract'];
						dateData['old_triple_pickup'] 	= dateData['triple_pickup'];
						dateData['old_quadruple']   	= dateData['quadruple'];
						dateData['old_quadruple_contract'] = dateData['quadruple_contract'];
						dateData['old_quadruple_pickup'] = dateData['quadruple_pickup'];
					});
				});

				// adding DS for ui release days for each occupancy and
				// for common
				_.each(data.occupancy, function(eachOcc) {
					eachOcc['ui_release_days'] = '';
				});

				_.extend($scope.allotmentConfigData.roomblock, {
					common_ui_release_days: '',
					selected_room_types_and_bookings: data.results,
					selected_room_types_and_occupanies: data.occupancy
				});

				// our total pickup count may change on coming from other tab (CICO-16835)
				$scope.totalPickups = data.total_picked_count;

				$scope.eventsCount = data.eventsCount;

				// we need the copy of selected_room_type, we ned to use these to show save/discard button
				// not using any more!
				// $scope.copy_selected_room_types_and_bookings = util.deepCopy(data.results);

				// we changed data, so
				refreshScroller();
				$scope.$emit("hideLoader");

				var ROOM_BLOCK_SCROLL 	= "room_block_scroller",
					TIMELINE_SCROLL 	= "room_rates_timeline_scroller",
					RATE_GRID_SCROLL 	= "room_rates_grid_scroller";

				var timeline = getScrollerObject(TIMELINE_SCROLL),
					rategrid = getScrollerObject(RATE_GRID_SCROLL),
					roomblock = getScrollerObject(ROOM_BLOCK_SCROLL);

				timeline.scrollTo(9999, 0);
				rategrid.scrollTo(9999, 0);
				roomblock.scrollTo(9999, 0);

				runDigestCycle();
			}, 0);
		};

		/**
		 * Event propogated by ngrepeatend directive
		 * we used to hide activity indicator & refresh scroller
		 */
		$scope.$on('NG_REPEAT_COMPLETED_RENDERING', function(event) {
			$timeout(function() {
				refreshScroller();
			}, 0);
		});

		$scope.releaseDaysEdited = false;

		$scope.copyReleaseRangeDown = function(days, index) {
			var value = days * 1;

			if ( '' == days || isNaN(value) ) {
				return;
			}

			_.each($scope.allotmentConfigData.roomblock.selected_room_types_and_bookings, function(each) {
				if ( each.hasOwnProperty('dates') && each['dates'][index] ) {
					each['dates'][index]['release_days'] = value;
					$scope.releaseDaysEdited = true;
				}
			});
		};

		/**
		 * Allotment release view
		 * Propogate release range entry across all dates and room types.
		 */
		$scope.copyReleaseRangeToAllBlocks = function(days) {
			var value = days * 1;

			if ( '' == days || isNaN(value) ) {
				return;
			}
			var data = {
				value: days,
				isReleaseDays: true
			};

			$scope.showMassUpdateEndDateConfirmation(data);

		};

		$scope.releaseDateChanging = function() {
			$scope.releaseDaysEdited = true;
			runDigestCycle();
		};

		$scope.resetReleaseDaysEdit = function() {
			var roomBlockData = $scope.allotmentConfigData.roomblock;

			roomBlockData.common_ui_release_days = '';
			_.each(roomBlockData.selected_room_types_and_occupanies, function(each) {
				each['ui_release_days'] = '';
			});

			_.each(roomBlockData.selected_room_types_and_bookings, function(each) {
				_.each(each['dates'], function(date) {
					date['release_days'] = date['old_release_days'];
				});
			});

			$scope.releaseDaysEdited = false;
		};

		$scope.saveReleaseDaysEdit = function() {
			$scope.saveReleaseDays();
			$scope.releaseDaysEdited = false;
		};

		var failureCallBackOfFetchRoomBlockGridDetails = function(errorMessage) {
			$scope.errorMessage = errorMessage;
		};

		/**
		 * To fetch room block details
		 * @param {Object} Pagination Options
		 * @return {undefined}
		 */
		$scope.fetchRoomBlockGridDetails = function(paginationOptions) {
			paginationOptions = paginationOptions || {};
			var hasNeccessaryPermission = (hasPermissionToCreateRoomBlock() &&
				hasPermissionToEditRoomBlock());

			if (!hasNeccessaryPermission) {
				return;
			}

			var params = _.extend(paginationOptions, {
				allotment_id: $scope.allotmentConfigData.summary.allotment_id
			});

			var options = {
				params: params,
				successCallBack: successCallBackOfFetchRoomBlockGridDetails,
				failureCallBack: failureCallBackOfFetchRoomBlockGridDetails
			};

			$scope.callAPI(rvAllotmentConfigurationSrv.getRoomBlockGridDetails, options);
		};

		/**
		 * when a tab switch is there, we will get this event,
		 * we are using this to fetch/refresh room block deails
		 */
		var tabSwitchEvent = $scope.$on("ALLOTMENT_TAB_SWITCHED", function(event, activeTab) {
			if (activeTab !== 'ROOM_BLOCK') {
				return;
			}
			$scope.$emit("FETCH_SUMMARY");

			$scope.timeLineStartDate = new tzIndependentDate($rootScope.businessDate);
			$scope.fetchCurrentSetOfRoomBlockData();

			// If allotment does not have room block configured change grid view to contract.
			if ($scope.allotmentConfigData.summary.rooms_total === 0) {
				$scope.setActiveGridView('CONTRACT');
			}
			else {
				$scope.setActiveGridView('CURRENT');
			}
		});

		/**
		 * When group summary is updated by some trigger, parant controller will propogate
		 * API, we will get this event, we are using this to fetch new room block deails
		 */
		var summaryUpdateEvent = $scope.$on("UPDATED_ALLOTMENT_INFO", function(event) {
			summaryMemento = _.extend({}, $scope.allotmentConfigData.summary);
			// to prevent from initial API calling and only exectutes when group from_date, to_date,status updaet success
			if ($scope.hasBlockDataUpdated) {
				$scope.fetchCurrentSetOfRoomBlockData();
			}
			setDatePickers();
		});

		/**
		 * when failed to update data
		 */
		var summaryUpdateFailEvent = $scope.$on("FAILED_TO_UPDATE_ALLOTMENT_INFO", function(event, errorMessage) {
			$scope.$parent.errorMessage = errorMessage;
		});

		// removing event listners when scope is destroyed
		$scope.$on( '$destroy', tabSwitchEvent );
		$scope.$on( '$destroy', summaryUpdateEvent );
		$scope.$on( '$destroy', summaryUpdateFailEvent );

		/**
		 * we want to display date in what format set from hotel admin
		 * @param {String/DateObject}
		 * @return {String}
		 */
		$scope.formatDateForUI = function(date_, dateFormat) {
			var type_ = typeof date_,
				returnString = '',
				dateFormat = (dateFormat ? dateFormat : $rootScope.dateFormat);

			switch (type_) {
				// if date string passed
				case 'string':
					returnString = $filter('date')(new tzIndependentDate(date_), dateFormat);
					break;

					// if date object passed
				case 'object':
					returnString = $filter('date')(date_, dateFormat);
					break;
			}
			return (returnString);
		};

		var formatDateForAPI = function(date) {
			return $filter('date')(date, $rootScope.dateFormatForAPI);
		};

		/**
		 * To get css width for grid timeline
		 * For each column 280px is predefined
		 * @return {String} [with px]
		 */
		$scope.getWidthForContractViewTimeLine = function() {
			var width = $scope.allotmentConfigData.roomblock.selected_room_types_and_occupanies.length * 280 + 140;

			if ($scope.shouldShowLoadNextSetButton()) {
				width += 80;
			}
			return width + 'px';
		};

		/**
		 * For each column 190px is predefined
		 * @return {String} [with px]
		 */
		$scope.getWidthForCurrentViewTimeLine = function() {
			var width = $scope.allotmentConfigData.roomblock.selected_room_types_and_occupanies.length * 180 + 40;

			if ($scope.shouldShowLoadNextSetButton()) {
				width += 80;
			}
			return width + 'px';
		};

		/**
		 * For each column 190px is predefined
		 * @return {String} [with px]
		 */
		$scope.getWidthForReleaseViewTimeLine = function() {
			var width = $scope.allotmentConfigData.roomblock.selected_room_types_and_occupanies.length * 180 + 40;

			if ($scope.shouldShowLoadNextSetButton()) {
				width += 80;
			}
			return width + 'px';
		};

		/**
		 * set up accordion
		 * @return {undefined}
		 */
		var setUpAccordion = function() {
			// accordion options, will add/remove class on toggling
			$scope.accordionInitiallyNotCollapsedOptions = {
				header: 'p.line-toggle',
				heightStyle: 'content',
				collapsible: true,
				activate: function(event, ui) {
					if (isEmpty(ui.newHeader) && isEmpty(ui.newPanel)) { // means accordion was previously collapsed, activating..
						ui.oldHeader.removeClass('open');
					} else if (isEmpty(ui.oldHeader)) { // means activating..
						ui.newHeader.addClass('open');
					}

					// we have to refresh scroller afetr that
					refreshScroller();
				}

			};
		};
		/**
		 * We have a list of variables to identify to initialize depending the mode (Add/Edit)
		 * @return None
		 */
		var initializeAddOrEditModeVariables = function() {
			// variable used to track Create Button, as per sice we are only handling edit mode we are
			// proceeding with true TODO: Add reference here
			$scope.createButtonClicked = true;

			// total pickup & rooms
			$scope.totalPickups = $scope.totalRooms = 0;

			// has data updated from this view, block from date or to date
			$scope.hasBlockDataUpdated = false;

			// selected Hold status:
			$scope.selectedHoldStatus = "";

			var isInEditMode = !$scope.isInAddMode(),
				refData = $scope.allotmentConfigData;

			// room block grid data
			$scope.detailsGridTimeLine = [];

			// whether the booking data changed
			$scope.hasBookingDataChanged = false;

			_.extend($scope.allotmentConfigData.roomblock, {
				selected_room_types_and_bookings: [],
				selected_room_types_and_occupanies: [],
				selected_room_types_and_rates: []
			});

			if (isInEditMode) {
				$scope.createButtonClicked = true;
				$scope.totalPickups = refData.summary.rooms_pickup;
				$scope.totalRooms = refData.summary.rooms_total;

				$scope.selectedHoldStatus = util.convertToInteger(refData.summary.hold_status);
			}

			// list of holding status list
			$scope.holdStatusList = refData.holdStatusList;
		};

		/**
		 * utiltiy function to refresh scroller
		 * return - None
		 */
		var refreshScroller = function() {
			getScrollerObject('room_block_scroller') && getScrollerObject('room_block_scroller').refresh();
			getScrollerObject('room_rates_timeline_scroller') && getScrollerObject('room_rates_timeline_scroller').refresh();
			getScrollerObject('room_rates_grid_scroller') && getScrollerObject('room_rates_grid_scroller').refresh();
		};

		/**
		 * [getScrollerObject description]
		 * @param  {[type]} key [description]
		 * @return {[type]}     [description]
		 */
		var getScrollerObject = function(key) {
			var scrollerObject = $scope.$parent.myScroll && $scope.$parent.myScroll[key];

			if (_.isUndefined (scrollerObject)) {
				scrollerObject = $scope.myScroll[key];
			}
			return scrollerObject;
		};

		/**
		 * utiltiy function to set scroller
		 * return - None
		 */
		var setScroller = function() {
			var ROOM_BLOCK_SCROLL 	= "room_block_scroller",
				TIMELINE_SCROLL 	= "room_rates_timeline_scroller",
				RATE_GRID_SCROLL 	= "room_rates_grid_scroller";

			// setting scroller things
			var commonScrollerOptions = {
				tap: true,
				preventDefault: false,
				probeType: 3,
				mouseWheel: true				
			};
			var scrollerOptionsForRoomRatesTimeline = _.extend({
				scrollX: true,
				scrollY: false,
				scrollbars: false
			}, util.deepCopy(commonScrollerOptions));

			var scrollerOptionsForRoomRatesGrid = _.extend({
				scrollY: true,
				scrollX: true
			}, util.deepCopy(commonScrollerOptions));

			$scope.setScroller(ROOM_BLOCK_SCROLL, commonScrollerOptions);
			$scope.setScroller(TIMELINE_SCROLL, scrollerOptionsForRoomRatesTimeline);
			$scope.setScroller(RATE_GRID_SCROLL, scrollerOptionsForRoomRatesGrid);

			// CICO-45501 - Disable the scrolling when the focus is on input
			// This is to solve the issue which happens when we enter values on the input box towards the end of the screen for release grid
			$("#allotment-room-block-content input").on('focus', function (event) {
				getScrollerObject (TIMELINE_SCROLL).disable();
			});

			// CICO-45501
			$("#allotment-room-block-content").on('scroll', function (event) {
				var horizontalScroll = event.currentTarget.scrollLeft;

				if (horizontalScroll > 0) {
					$(this).scrollLeft(0);
				}				
			});	
			

			$timeout(function() {
				getScrollerObject (TIMELINE_SCROLL)
					.on('scroll', function() {						
						var xPos = this.x;
						var block = getScrollerObject (RATE_GRID_SCROLL);

						block.scrollTo(xPos, block.y);

						// check if edge reached next button
						if (Math.abs(this.maxScrollX) - Math.abs(this.x) <= 150 ) {
							if (!timeLineScrollEndReached) {
									timeLineScrollEndReached = true;
									runDigestCycle();
								}
							} else {
								if (timeLineScrollEndReached) {
								 	timeLineScrollEndReached = false;
									runDigestCycle();
							}
						}
					});				
				getScrollerObject (ROOM_BLOCK_SCROLL)
					.on('scroll', function() {						
						var yPos = this.y;
						var block = getScrollerObject (RATE_GRID_SCROLL);

						block.scrollTo(block.x, yPos);
					});
				getScrollerObject (RATE_GRID_SCROLL)
					.on('scroll', function() {
						var xPos = this.x;
						var yPos = this.y;

						getScrollerObject (TIMELINE_SCROLL).scrollTo(xPos, 0);
						getScrollerObject (ROOM_BLOCK_SCROLL).scrollTo(0, yPos);

						// check if edge reached and enable next button
						if (Math.abs(this.maxScrollX) - Math.abs(this.x) <= 150 ) {
							if (!timeLineScrollEndReached) {
									timeLineScrollEndReached = true;
									runDigestCycle();
								}
							} else {
								if (timeLineScrollEndReached) {
								 	timeLineScrollEndReached = false;
									runDigestCycle();
							}
						}
					});
			}, 1000);
		};


		/**
		 * to set the active left side menu
		 * @return {undefined}
		 */
		var setActiveLeftSideMenu = function () {
			var activeMenu = ($scope.isInAddMode()) ? "menuCreateAllotment" : "menuManageAllotment";

			$scope.$emit("updateRoverLeftMenu", activeMenu);
		};

		/**
		 * function used to set date picker
		 * will create date picker options & initial values
		 * @return - None
		 */
		var setDatePickers = function() {
			var summaryData = $scope.allotmentConfigData.summary,
				businessDate = new tzIndependentDate($rootScope.businessDate);

			// default start date
			$scope.timeLineStartDate = new tzIndependentDate(summaryData.block_from);

			if (summaryData.block_from < businessDate) {
				$scope.timeLineStartDate = businessDate;
			}

			$scope.timeLineEndDate = new tzIndependentDate(summaryData.block_to);

			// referring data model -> from allotment summary
			var refData = $scope.allotmentConfigData.summary;

			// date picker options - Common
			var commonDateOptions = {
				dateFormat: $rootScope.jqDateFormat,
				numberOfMonths: 1
			};

			var maxDate = new tzIndependentDate(summaryData.block_to);

			maxDate.setDate(maxDate.getDate() - 1);

			// date picker options - Start Date
			$scope.timeLineStartDateOptions = _.extend({
				minDate: summaryData.block_from,
				maxDate: maxDate,
				onSelect: $scope.onTimeLineStartDatePicked
			}, commonDateOptions);

		};


		/**
		 * Initialize scope variables
		 * @return {undefined}
		 */
		var initializeVariables = function () {
			// If allotment does not have room block configured change grid view to contract.
			if ($scope.allotmentConfigData.summary.rooms_total === 0) {
				$scope.setActiveGridView('CONTRACT');
			}
			else {
				$scope.setActiveGridView('CURRENT');
			}

			// we use this to ensure that we will call the API only if there is any change in the data
			summaryMemento = _.extend({}, $scope.allotmentConfigData.summary);

			// since we are recieving two ouside click event on tapping outside, we wanted to check and act
			$scope.isUpdateInProgress = false;

		};


		/**
		 * This function sets tab data
		 * @return {undefined}
		 */
		var initializeRoomBlockDetails = function() {
			// CICO-21222 Introduced pagination in room block timeline.
			// default start date
			$scope.timeLineStartDate = new tzIndependentDate($rootScope.businessDate);

			// call API. date range end will be calculated in next function.
			$scope.fetchCurrentSetOfRoomBlockData();
		};

		/**
         * Show house events list popup
         * @param {Number} eventsCount events count
         * @param {Date} selectedDate selected date
         * @return {void}
         */
        $scope.showHouseEventsListPopup = function(eventsCount, selectedDate) {
            if (!eventsCount) {
                return;
            }

            $scope.selectedEventDisplayDate = selectedDate;
            ngDialog.open({
                template: '/assets/partials/popups/rvHouseEventsListPopup.html',
                scope: $scope,
                controller: 'rvHouseEventsListPopupCtrl',
                className: 'ngdialog-theme-default',
                closeByDocument: false,
                closeByEscape: true
            });
        };

		/**
		 * Function to initialise room block details
		 * @return - None
		 */
		var initializeMe = (function() {
			// updating the left side menu
			setActiveLeftSideMenu();

			// we have a list of scope varibales which we wanted to initialize
			initializeVariables();

			// date related setups and things
			if (!$scope.isInAddMode()) {
				setDatePickers();
			}

			// setting scrollers
			setScroller();

			// accoridion
			setUpAccordion();

			// we have a list of scope varibales which we wanted to assign when it is in add/edit mode
			initializeAddOrEditModeVariables();

			// as per CICO-17081 we can enter a tab directly without TAB_SWITCHING
			if ($scope.allotmentConfigData.activeTab === "ROOM_BLOCK") {
				initializeRoomBlockDetails();
			}

		}());

		var reinit = function() {

			// setting scrollers
			setScroller();

			// accoridion
			setUpAccordion();
		};

        // Update error message from popup
        $scope.$on("UPDATE_ERR_MSG", function(event, error) {
            $scope.errorMessage = error;
		});
		
		// Should show the copy btn
		$scope.shouldShowCopyButton = function (date) {
            var dateObject;

            switch (typeof date) {
				case 'string': 
					dateObject = new tzIndependentDate(date); 
                    break;
				case 'object':
				 	dateObject = new tzIndependentDate(date.date);
            }
            
            if (dateObject.getTime() === $scope.allotmentConfigData.summary.block_from.getTime()) {
				return true;	
            } else {
            	return false;
            }
        };
	}
]);
