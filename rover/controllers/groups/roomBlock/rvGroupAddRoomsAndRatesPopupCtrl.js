angular.module('sntRover').controller('rvGroupAddRoomsAndRatesPopupCtrl', [
	'$scope',
	'$rootScope',
	'$filter',
	'rvPermissionSrv',
	'ngDialog',
	'$timeout',
	'rvUtilSrv',
	'rvGroupConfigurationSrv',
	function($scope,
		$rootScope,
		$filter,
		rvPermissionSrv,
		ngDialog,
		$timeout,
		util,
		rvGroupConfigurationSrv) {

		var updateExistingReservationsRate;

		/**
		 * to initialize rooms & rates popup
		 * @return undefined
		 */
		var initializeMe = (function() {
			BaseCtrl.call(this, $scope);

			// setting the scroller
			$scope.setScroller('room_type_scroller');

			$scope.defaultRoomTypeDetails = {
				"best_available_rate_amount": '',
				"single_rate": '',
				"double_rate": '',
				"extra_adult_rate": '',
				"rate_id": ''
			};

			// selected room types & its rates
			$scope.selectedRoomTypeAndRates = util.deepCopy($scope.groupConfigData.summary.selected_room_types_and_rates);

			angular.forEach ($scope.selectedRoomTypeAndRates, function (row) {
				if (row.is_configured_in_group) {
					row.update_existing_reservations_rate = false;
					row.old_single_rate = row.single_rate;
					row.old_double_rate = row.double_rate;
					row.old_extra_adult_rate = row.extra_adult_rate;
				}
			});

			var wanted_keys = ["room_type_id", "room_type_name", "best_available_rate_amount", "rate_id", "best_available_rate_id", "update_existing_reservations_rate"];

			$scope.roomTypes = util.getListOfKeyValuesFromAnArray($scope.selectedRoomTypeAndRates, wanted_keys);

			// adding currency symbol to best available rate
			$scope.roomTypes = _.map($scope.roomTypes, function(roomType) {
				roomType.best_available_rate_amount = ($rootScope.currencySymbol +
					roomType.best_available_rate_amount);
				return roomType;
			});

			// we only showing if associated with that group
			$scope.selectedRoomTypeAndRates = _.where($scope.selectedRoomTypeAndRates, {
				is_configured_in_group: true
            });
            
            $scope.originalConfiguredRoomTypeAndRates = util.deepCopy($scope.selectedRoomTypeAndRates);

			// if nothing is configured, we have to add a new row
			if ($scope.selectedRoomTypeAndRates.length === 0) {
				$scope.selectedRoomTypeAndRates = [];
				$scope.selectedRoomTypeAndRates.push(util.deepCopy($scope.groupConfigData.summary.selected_room_types_and_rates[0]));
			}

            _.each($scope.selectedRoomTypeAndRates, function(selectedRoomTypeAndRate) {
                selectedRoomTypeAndRate.room_type_id = selectedRoomTypeAndRate.room_type_id.toString();
            });

			// adding currency symbol to best available rate
			$scope.selectedRoomTypeAndRates = _.map($scope.selectedRoomTypeAndRates, function(row) {
				row.best_available_rate_amount = ((row.rate_currency !== null ? row.rate_currency : $rootScope.currencySymbol) +
					row.best_available_rate_amount);
				return row;
			});
		}());

		/**
		 * [getBestAvailableRate description]
		 * @param  {[type]} room_type_id [description]
		 * @return {[type]}              [description]
		 */
		$scope.changeBestAvailableRate = function(row) {
			var roomType = _.find($scope.roomTypes, function (roomType) {
				return roomType.room_type_id == row.room_type_id;
			});

			if (roomType) {
				row.best_available_rate_amount = roomType.best_available_rate_amount;
				row.best_available_rate_id = roomType.best_available_rate_id;
				row.rate_id = roomType.rate_id;
				if ($scope.groupConfigData.summary.rate !== -1) {
					var selectedRateDetails = _.findWhere($scope.groupConfigData.summary.selected_room_types_and_rates, {
						room_type_id: parseInt(roomType.room_type_id, 10)
					});

					row.single_rate = selectedRateDetails.single_rate;
					row.double_rate = selectedRateDetails.double_rate;
					row.extra_adult_rate = selectedRateDetails.extra_adult_rate;
					row.room_type_name = selectedRateDetails.room_type_name;
				}
			} else {
				row.best_available_rate_amount = "";
			}
		};

		/**
		 * Wnated to show add new button against a row
		 * @param  {Object} 	obj - room type & rate details
		 * @return {Boolean}
		 */
		$scope.shouldShowAddNewButton = function(obj) {
			return (!util.isEmpty(obj.room_type_id) &&
				(_.pluck($scope.selectedRoomTypeAndRates, "room_type_id").length < $scope.roomTypes.length) && !$scope.groupConfigData.summary.is_cancelled);
		};

		/**
		 * Wanetd to show delete button
		 * @return {Boolean}
		 */
		$scope.shouldShowDeleteButton = function() {
			return ($scope.selectedRoomTypeAndRates.length >= 2 && !$scope.groupConfigData.summary.is_cancelled);
		};

		/**
		 * to Add a new Room Type & Rates row
		 * @return undefined
		 */
		$scope.addNewRoomTypeAndRatesRow = function() {
			$scope.selectedRoomTypeAndRates.push(util.deepCopy($scope.defaultRoomTypeDetails));
			// refreshing the scroller
			$scope.refreshScroller('room_type_scroller');
			scrollToEnd();
		};

		/**
		 * utility function to scroll to end
		 * @return undefined
		 */
		var scrollToEnd = function() {
			var scroller = $scope.$parent.myScroll['room_type_scroller'];

			$timeout(function() {
				scroller.scrollTo(scroller.maxScrollX, scroller.maxScrollY, 500);
			}, 300);

		};

		/**
		 * to delete Room Type & Rates row
		 * @return undefined
		 */
		$scope.deleteRoomTypeAndRatesRow = function($index) {
			$scope.selectedRoomTypeAndRates.splice($index, 1);
			// refreshing the scroller
			$scope.refreshScroller('room_type_scroller');
		};

		/**
		 * to close the popup
		 * @return undefined
		 */
		$scope.clickedOnCancelButton = function() {
			$scope.closeDialog();
		};

		var successCallBackOfSaveNewRoomTypesAndRates = function() {
            if ($scope.isRoomViewActive) {
                $scope.fetchCurrentSetOfRoomBlockData();
            } else {
                $scope.fetchRoomTypesDailyRates();
            }
            $scope.closeDialog();
		};

		var failureCallBackOfSaveNewRoomTypesAndRates = function(error) {
			$scope.errorMessage = error;
		};

		/**
		 * function to form save roomtype and rates API params
		 * @return {Object}
		 */
		var formSaveNewRoomTypesAndRatesParams = function() {
			// we only want rows who have room type choosed
			var selectedRoomTypeAndRates = _.filter($scope.selectedRoomTypeAndRates, function(obj) {
				return (typeof obj.room_type_id !== "undefined" && obj.room_type_id !== '');
			});
			// since selectedRoomTypeAndRates containst some unwanted keys
			var wanted_keys = ["room_type_id", "single_rate", "double_rate", "extra_adult_rate", "rate_id", "best_available_rate_id", "update_existing_reservations_rate"];

			selectedRoomTypeAndRates = util.getListOfKeyValuesFromAnArray(selectedRoomTypeAndRates, wanted_keys);

			var params = {
				group_id: $scope.groupConfigData.summary.group_id,
				room_type_and_rates: selectedRoomTypeAndRates
			};

			return params;
		};

		// Checks whether single rate is configured for the room types added
		var isSingleRateConfigured = function () {
			var isSingleRateConfigured = _.every($scope.selectedRoomTypeAndRates, function (roomAndRate) {
											return roomAndRate.single_rate !== null;
										});

			return isSingleRateConfigured;
        };

		/**
		 * Check whether group custom rate is changed and open new popup if true, otherwise updates room
		 * types and rates.  
		 */ 
		$scope.checkIfGroupCustomRateChanged = function() {
			var data = {
				isGroupDailyRatesEnabled: $scope.isGroupDailyRatesEnabled
			};

			if (!isSingleRateConfigured()) {
				$scope.errorMessage = [$filter('translate')('NO_SINGLE_RATE_CONFIGURED')];
				return;
			}

			if (isGroupCustomRateChangedAndReservationExists()) {
				$scope.confirmUpdateRatesWithPickedReservations($scope.selectedRoomTypeAndRates, data);
			} else {
                var options = {
					params: formSaveNewRoomTypesAndRatesParams(),
					successCallBack: successCallBackOfSaveNewRoomTypesAndRates,
					failureCallBack: failureCallBackOfSaveNewRoomTypesAndRates
				};

				$scope.callAPI(rvGroupConfigurationSrv.updateSelectedRoomTypesAndRates, options);
            }
			
		};

		/**
		 * Checks whether group custom rate is changed and reservations already exists
		 */
		var isGroupCustomRateChangedAndReservationExists = function () {
			updateExistingReservationsRate = false;
			angular.forEach ($scope.selectedRoomTypeAndRates, function (row) {
				if (row.total_reservations_count > 0) {
					if (row.single_rate !== row.old_single_rate || row.double_rate !== row.old_double_rate || row.extra_adult_rate !== row.old_extra_adult_rate) {
						updateExistingReservationsRate = true;
						row.update_existing_reservations_rate = true;
					}
				}
			});
			return updateExistingReservationsRate;
		};

		/**
		 * wanted to hide a particular room type from the list of room types we are showing
		 * @param  {Integer} mySelectedID
		 * @param  {Object} roomType
		 * @return {Boolean}              [Will decide whether to show/not]
		 */
		$scope.hideRoomType = function(mySelectedID, roomType) {
			// if it is mine room type, we will show that
			if (parseInt(mySelectedID) === parseInt(roomType.room_type_id)) {
				return false;
			}

			// we are removing other selected
			// list of selecetd room types' ids
			var selectedIdList = _.pluck($scope.selectedRoomTypeAndRates, "room_type_id");
			
			// CICO-46352
			var isRoomTypeAlreadyAdded = _.find(selectedIdList, function (selectedId) {
											return selectedId == roomType.room_type_id;
										});
			
			return !!isRoomTypeAlreadyAdded;
        };
        
        /**
         * Should disable edit of rates in room types/rate popup
         * @param {Object} rateInfo rate info
         * @return {Boolean} flag indicating whether to disable edit
         */
        $scope.shouldDisableRateEdit = function(rateInfo) {
            return ($scope.groupConfigData.summary.is_cancelled || (rateInfo.isRateConfigured && $scope.isGroupDailyRatesEnabled) );
        };
	}
]);
