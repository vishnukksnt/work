sntRover.controller('rvAllotmentRoomBlockMassUpdatePopupCtrl', [
	'$scope',
	'$rootScope',
	'$filter',
	'rvPermissionSrv',
	'ngDialog',
	'$timeout',
	'rvUtilSrv',
	'rvAllotmentConfigurationSrv',
	function($scope,
		$rootScope,
		$filter,
		rvPermissionSrv,
		ngDialog,
		$timeout,
		util,
		rvAllotmentConfigurationSrv) {

		var overbookingOccurs = false,
			isContractUpdate  = false;

		var formatDateForAPI = function(date) {
			return $filter('date')(date, $rootScope.dateFormatForAPI);
		};

		/**
		 * Utility for checking date validity.
		 * @param {String} Date in API format
		 * @return {Boolean} validity
		 */
		var isDateInsideLimit = function(date) {
			var day = new tzIndependentDate(date);

			return (day <= $scope.massUpdateEndDate);
		};

		/**
		 * Utility function to propogate a value of a property through an array
		 * @param {Array} Array containing objects
		 * @param {String} property whose value is to be changed
		 * @param {Integer} new value
		 * @return {undefined}
		 */
		var copyValuesThroughDates = function(dates, property, value) {
			dates.every(function(each) {
				if (isDateInsideLimit(each.date)) {
					each[property] = parseInt(value);
					return true;
				}
				return false;
			});
		};

		/**
		 * Tells room block controller to save roomblock data with selected end date.
		 * @return {undefined}
		 */
		$scope.clickedOnSaveButton = function (isOverbooking) {

			var roomBlockData = $scope.allotmentConfigData.roomblock,
				isReleaseDays = $scope.ngDialogData.isReleaseDays || false,
				value 		  = $scope.ngDialogData.value,
				timeLineStart = $scope.massUpdateStartDate,
				endDate 	  = $scope.massUpdateEndDate;

			// If we are updating release days the logic defers.
			if (isReleaseDays) {
				// copy values horizontally
				copyValuesThroughDates(roomBlockData.selected_room_types_and_occupanies, 'ui_release_days', value);

				_.each(roomBlockData.selected_room_types_and_bookings, function(each) {
					// propogate values
					copyValuesThroughDates(each.dates, 'release_days', value);
					each.copy_values_to_all = true;
				});

				// Save room block now.
				$scope.saveReleaseDays(value, $scope.massUpdateEndDate);
				$timeout($scope.closeDialog, 100);

			}
			// Copying contract or held counts
			else {
				var roomTypeData  	 = $scope.selectedRoomType,
					occupancy 	  	 = $scope.ngDialogData.occupancy,
					isContractUpdate = $scope.ngDialogData.isContract || false;

				var data = _.omit(roomTypeData, ['dates']);

				data = _.extend(data, roomTypeData.dates[0]);
				data[occupancy] = value;

				var config = _.extend(data, {
					start_date: formatDateForAPI(timeLineStart),
					end_date: formatDateForAPI($scope.massUpdateEndDate),
					bulk_updated_for: occupancy.toUpperCase(),
					overbook_chosen: isOverbooking
				});

				// Save room block now.
				$scope.saveMassUpdate(overbookingOccurs, isContractUpdate, config);
			}

		};

		var successCallBackOfSaveMassUpdate = function(data) {
			// CICO-18621: Assuming room block will be saved if I call
			// it with force flag.
			if (!data.saved_room_block) {
				$scope.saveMassUpdate(true, false, lastCalledMassUpdateConfig);
				return false;
			}

			// Room block saved
			$scope.fetchCurrentSetOfRoomBlockData();
			$scope.closeDialog();
		};

		var failureCallBackOfSaveMassUpdate = function(error) {
			if (error.hasOwnProperty ('httpStatus')) {
				if (error.httpStatus === 470) {
					var message = $scope.checkOverBooking(error);

					if (!message) {
						// overbooking condition does not exist
						$scope.saveMassUpdate(true, false, lastCalledMassUpdateConfig);
					}
					else {
						if (message === "NO_PERMISSION") {
							$scope.disableButtons = true;
						} else {
							$scope.overBookingMessage = message;
							overbookingOccurs = true;
						}
					}
				}
			} else {
                $scope.$emit('UPDATE_ERR_MSG', error);
                $scope.closeDialog();
			}
		};

		var lastCalledMassUpdateConfig = null;

		/**
		 * For mass update triggered by clicking > button
		 */
		$scope.saveMassUpdate = function(forceOverbook, isContratUpdate, config) {
			forceOverbook = forceOverbook || false;
			isContratUpdate = isContratUpdate || false;
			config = config || {};
			config = _.pick(config, ["allotment_id", "overbook_chosen", "forcefully_overbook_and_assign_rooms", "start_date",
					"end_date", "is_contract_save", 'bulk_updated_for', "room_type_id", "room_type_name",
            		"release_days", "single", "single_contract", "double", "double_contract",
            		"old_total", "old_double", "old_double_contract", "old_release_days", "old_single", "old_single_contract",
            		"quadruple", "quadruple_contract", "triple", "triple_contract", "old_quadruple", "old_quadruple_contract", "old_triple", "old_triple_contract"]);

			var params = _.extend(config, {
				allotment_id: $scope.allotmentConfigData.summary.allotment_id,
				forcefully_overbook_and_assign_rooms: forceOverbook,
				is_contract_save: isContratUpdate,
				results: config.data
			});

			var options = {
				params: params,
				successCallBack: successCallBackOfSaveMassUpdate,
				failureCallBack: failureCallBackOfSaveMassUpdate
			};

			$scope.callAPI(rvAllotmentConfigurationSrv.saveMassUpdate, options);
			lastCalledMassUpdateConfig = config;
			overbookingOccurs = false;
		};

		var onEndDatePicked = function (date, datePickerObj) {
			$scope.massUpdateEndDate = new tzIndependentDate(util.get_date_from_date_picker(datePickerObj));
		};

		/**
		 * Set end date selection options. default to allotment end date.
		 * @return {undefined}
		 */
		var setDatePickers = function () {
			var summaryData = $scope.allotmentConfigData.summary;
			var commonDateOptions = {
				dateFormat: $rootScope.jqDateFormat,
				numberOfMonths: 1
			};
			var maxDate = new tzIndependentDate(summaryData.block_to);

			maxDate.setDate(maxDate.getDate() - 1);
			$scope.massUpdateEndDate = new tzIndependentDate(maxDate);

			$scope.massUpdateEndDateOptions = _.extend({
				minDate: $scope.timeLineStartDate,
				maxDate: maxDate,
				onSelect: onEndDatePicked
			}, commonDateOptions);
		};

		var init = function () {
			BaseCtrl.call(this, $scope);
			setDatePickers();

			$scope.massUpdateStartDate = $scope.timeLineStartDate;
			$scope.showSaveButton = true;
			$scope.overBookingMessage = '';
		};

		init();
	}
]);
