"use strict";

(function () {
	function r(e, n, t) {
		function o(i, f) {
			if (!n[i]) {
				if (!e[i]) {
					var c = "function" == typeof require && require;if (!f && c) return c(i, !0);if (u) return u(i, !0);var a = new Error("Cannot find module '" + i + "'");throw a.code = "MODULE_NOT_FOUND", a;
				}var p = n[i] = { exports: {} };e[i][0].call(p.exports, function (r) {
					var n = e[i][1][r];return o(n || r);
				}, p, p.exports, r, e, n, t);
			}return n[i].exports;
		}for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) {
			o(t[i]);
		}return o;
	}return r;
})()({ 1: [function (require, module, exports) {
		sntRover.controller('rvReservationGuestController', ['$scope', '$rootScope', 'RVReservationGuestSrv', '$stateParams', '$state', '$timeout', 'ngDialog', 'dateFilter', 'RVGuestCardsSrv', 'RVReservationCardSrv', function ($scope, $rootScope, RVReservationGuestSrv, $stateParams, $state, $timeout, ngDialog, dateFilter, RVGuestCardsSrv, RVReservationCardSrv) {

			BaseCtrl.call(this, $scope);

			$scope.guestData = {};
			var presentGuestInfo = {};
			var initialGuestInfo = {},
			    initialAccompanyGuests = {};

			$scope.isSRRate = $scope.reservationData.reservation_card.is_rate_suppressed_present_in_stay_dates === 'true';

			$scope.errorMessage = '';

			$scope.setScroller('accompanyGuestList');

			var GUEST_SEARCH_RESULTS_SCROLLER = 'guestSearchResultsScroller';

			// Refresh accompany guest section scroller
			var refreshMyScroller = function refreshMyScroller() {
				$timeout(function () {
					$scope.refreshScroller('accompanyGuestList');
				}, 500);
			};

			$scope.$on("UPDATE_ACCOMPANY_SCROLL", function () {
				refreshMyScroller();
			});

			/**
    * To check the currently entered occupancy and display prompt if it is over the allowed max occupancy for the room / room type
    * @return boolean [description]
    */
			function isWithinMaxOccupancy() {
				var maxOccupancy = $scope.reservationData.reservation_card.max_occupancy; // TODO: Get the max occupancy here

				if (!!maxOccupancy) {
					var currentTotal = parseInt($scope.guestData.adult_count || 0) + parseInt($scope.guestData.children_count || 0);

					return currentTotal > parseInt(maxOccupancy);
				} else {
					// If the max occupancy aint configured DONT CARE -- Just pass it thru
					return false;
				}
			}

			/**
    * To check if the currently entered occupancy has been configured.
    * @return boolean [description]
    */
			function isOccupancyRateConfigured() {

				if ($scope.reservationData.reservation_card.is_hourly_reservation) {
					// check if current staydate object has a single rate configured
					var stayDate = _.findWhere($scope.reservationData.reservation_card.stay_dates, {
						date: $scope.reservationData.reservation_card.arrival_date
					});

					return !!(stayDate && stayDate.rate_config && stayDate.rate_config.single);
				} else {
					var flag = true;

					angular.forEach($scope.reservationData.reservation_card.stay_dates, function (item, index) {
						if (flag) {
							if ($scope.guestData.adult_count && parseInt($scope.guestData.adult_count) === 1) {
								flag = !!item.rate_config.single;
							} else if ($scope.guestData.adult_count && parseInt($scope.guestData.adult_count) === 2) {
								flag = !!item.rate_config.double;
							} else if ($scope.guestData.adult_count && parseInt($scope.guestData.adult_count) > 2) {
								flag = !!(item.rate_config.double && item.rate_config.extra_adult);
							}

							if (flag && $scope.guestData.children_count && !!parseInt($scope.guestData.children_count)) {
								flag = !!item.rate_config.child;
							}
						}
					});
					return flag;
				}
			}

			// CICO-13491
			$scope.customRate = "";
			$scope.rateForCurrentGuest = "";

			var saveReservation = function saveReservation() {
				$scope.saveReservation("rover.reservation.staycard.reservationcard.reservationdetails", {
					"id": $scope.reservationData.reservation_card.reservation_id,
					"confirmationId": $scope.reservationData.reservation_card.confirmation_num,
					"isrefresh": true
				});
			};

			var calculateRateForCurrentGuest = function calculateRateForCurrentGuest() {
				var rateDetails;

				if (new tzIndependentDate($scope.reservationData.reservation_card.arrival_date) >= new tzIndependentDate($rootScope.businessDate)) {
					rateDetails = _.filter($scope.reservationData.reservation_card.stay_dates, function (item) {
						return new tzIndependentDate(item.date).getTime() === new tzIndependentDate($scope.reservationData.reservation_card.arrival_date).getTime();
					});
				} else {
					rateDetails = _.filter($scope.reservationData.reservation_card.stay_dates, function (item) {
						return new tzIndependentDate(item.date).getTime() === new tzIndependentDate($rootScope.businessDate).getTime();
					});
				}

				var adults = parseInt($scope.guestData.adult_count || 0),
				    children = parseInt($scope.guestData.children_count || 0),
				    rateToday = rateDetails[0].rate_config,
				    roomAmount = 0;

				if (!$scope.reservationData.reservation_card.is_hourly_reservation) {
					var baseRoomRate = adults >= 2 ? rateToday.double : rateToday.single;

					roomAmount = parseFloat(baseRoomRate);

					var extraAdults = adults >= 2 ? adults - 2 : 0;

					if (extraAdults > 0) {
						roomAmount += extraAdults * parseFloat(rateToday.extra_adult);
					}
					if (children > 0) {
						roomAmount += children * parseFloat(rateToday.child);
					}

					$scope.rateForCurrentGuest = parseFloat(roomAmount).toFixed(2);
				}
			};

			var confirmForRateChange = function confirmForRateChange() {

				ngDialog.open({
					template: '/assets/partials/reservation/rvCustomRateSelectPopup.html',
					className: '',
					scope: $scope,
					closeByDocument: false,
					closeByEscape: false
				});
			};

			$scope.keepCurrentRate = function () {
				// Save data variables keeping the Current Rate .
				saveChanges(false, true, { "isBackToStayCard": true });
				closeDialog();
			};

			$scope.ChangeToNewRate = function () {
				// Save data variables taking the New Rate .
				saveChanges(undefined, undefined, { "isBackToStayCard": true });
				closeDialog();
			};

			var isRateChangeOccurred = function isRateChangeOccurred() {
				var isRateChangeOccurred = false,
				    rateDetails;

				if (new tzIndependentDate($scope.reservationParentData.arrivalDate) >= new tzIndependentDate($rootScope.businessDate)) {
					rateDetails = _.filter($scope.reservationParentData.rooms[0].stayDates, function (item, date) {
						return new tzIndependentDate(date).getTime() === new tzIndependentDate($scope.reservationParentData.arrivalDate).getTime();
					});
				} else {
					rateDetails = _.filter($scope.reservationParentData.rooms[0].stayDates, function (item, date) {
						return new tzIndependentDate(date).getTime() === new tzIndependentDate($rootScope.businessDate).getTime();
					});
				}
				if (rateDetails[0].rateDetails.actual_amount !== rateDetails[0].rateDetails.modified_amount) {
					isRateChangeOccurred = true;
					$scope.customRate = rateDetails[0].rateDetails.modified_amount;
				}

				return isRateChangeOccurred;
			};

			function saveChanges(override, keepCurrentRate, params) {

				$scope.$emit('showLoader');
				angular.forEach($scope.reservationData.reservation_card.stay_dates, function (item, index) {
					// Note: when editing number of guests for an INHOUSE reservation, the new number of guests should only apply from this day onwards, any previous days need to retain the previous guest count.
					if (new tzIndependentDate(item.date) >= new tzIndependentDate($rootScope.businessDate)) {
						var adults = parseInt($scope.guestData.adult_count || 0),
						    children = parseInt($scope.guestData.children_count || 0),
						    rateToday = angular.copy(item.rate_config);

						rateToday.single = rateToday.single || 0;
						rateToday.double = rateToday.double || 0;
						rateToday.extra_adult = rateToday.extra_adult || 0;
						rateToday.child = rateToday.child || 0;

						$scope.reservationParentData.rooms[0].stayDates[dateFilter(new tzIndependentDate(item.date), 'yyyy-MM-dd')].guests = {
							adults: adults,
							children: children,
							infants: parseInt($scope.guestData.infants_count || 0)
						};
						if (!$scope.reservationData.reservation_card.is_hourly_reservation) {
							// CICO-30358: clicked on apply current rate button if custom rate is set keep it else keep actual rate.
							if (override) {
								var rateForDay = $scope.reservationParentData.rooms[0].stayDates[dateFilter(new tzIndependentDate(item.date), 'yyyy-MM-dd')].rateDetails,
								    actual_amount = parseFloat(rateForDay.actual_amount),
								    modified_amount = parseFloat(rateForDay.modified_amount);

								if (actual_amount > 0.00 && !(modified_amount > 0.00)) {
									rateDetails.modified_amount = actual_amount;
								}
								$scope.reservationParentData.rooms[0].stayDates[dateFilter(new tzIndependentDate(item.date), 'yyyy-MM-dd')].rateDetails.actual_amount = 0;
							} else if (keepCurrentRate) {
								// Keep current Rate.
								// Keeping modified amount (Custom rate) as it is , calculating the Actual Amount.
								var baseRoomRate = adults >= 2 ? rateToday.double : rateToday.single;
								var extraAdults = adults >= 2 ? adults - 2 : 0;
								var roomAmount = parseFloat(baseRoomRate) + extraAdults * parseFloat(rateToday.extra_adult) + children * parseFloat(rateToday.child);

								$scope.reservationParentData.rooms[0].stayDates[dateFilter(new tzIndependentDate(item.date), 'yyyy-MM-dd')].rateDetails.actual_amount = roomAmount;
							} else {
								var baseRoomRate = adults >= 2 ? rateToday.double : rateToday.single;
								var extraAdults = adults >= 2 ? adults - 2 : 0;
								var roomAmount = parseFloat(baseRoomRate) + extraAdults * parseFloat(rateToday.extra_adult) + children * parseFloat(rateToday.child);

								$scope.rateForCurrentGuest = roomAmount;

								$scope.reservationParentData.rooms[0].stayDates[dateFilter(new tzIndependentDate(item.date), 'yyyy-MM-dd')].rateDetails.actual_amount = roomAmount;
								$scope.reservationParentData.rooms[0].stayDates[dateFilter(new tzIndependentDate(item.date), 'yyyy-MM-dd')].rateDetails.modified_amount = roomAmount;
							}
						}
					}
				});

				presentGuestInfo = JSON.parse(JSON.stringify($scope.guestData));
				initialGuestInfo = JSON.parse(JSON.stringify($scope.guestData));

				var successCallback = function successCallback(data) {
					$scope.errorMessage = '';
					if (params.isBackToStayCard) {
						saveReservation();
					} else {
						$scope.$emit('hideLoader');
					}
				};

				var errorCallback = function errorCallback(errorMessage) {
					$scope.$emit('hideLoader');
					$scope.errorMessage = errorMessage;
					if (params.isBackToStayCard) {
						$scope.$emit("OPENGUESTTAB");
					}
				};

				var dataToSend = dclone($scope.guestData, ["primary_guest_details", "accompanying_guests_details"]);

				dataToSend.accompanying_guests_details = [];
				dataToSend.reservation_id = $scope.reservationData.reservation_card.reservation_id;

				_.each($scope.accompanyingGuests, function (guest, type) {

					_.each($scope.accompanyingGuests[type], function (guestInfo) {
						dataToSend.accompanying_guests_details.push({
							first_name: guestInfo.first_name,
							last_name: guestInfo.last_name,
							guest_type: guestInfo.guest_type,
							guest_type_id: guestInfo.guest_type_id
						});
					});
				});

				$scope.invokeApi(RVReservationGuestSrv.updateGuestTabDetails, dataToSend, successCallback, errorCallback);
			}

			function closeDialog() {
				ngDialog.close();
			}

			$scope.applyCurrentRate = function () {
				saveChanges(true, undefined, { "isBackToStayCard": true }); // override
				closeDialog();
			};

			$scope.cancelOccupancyChange = function () {
				// RESET
				$scope.guestData = JSON.parse(JSON.stringify(initialGuestInfo));
				presentGuestInfo = JSON.parse(JSON.stringify(initialGuestInfo));
				angular.copy(initialAccompanyGuests, $scope.accompanyingGuests);
				closeDialog();
			};

			// Checks whether there is any rate change due to adults/children count change
			var checkForRateChangeForOccupancyChange = function checkForRateChangeForOccupancyChange(params) {
				var reqParams = {};

				reqParams.reservation_id = $scope.reservationData.reservation_card.reservation_id;
				reqParams.adults = $scope.guestData.adult_count;
				reqParams.children = $scope.guestData.children_count;

				var successCallback = function successCallback(response) {
					$scope.$emit('hideLoader');

					// CICO-63171 - Discard the guest change part when the user is not currently in the staycard
					if ($state.current.name !== 'rover.reservation.staycard.reservationcard.reservationdetails') {
						return;
					}

					if (response.is_rate_changed) {
						calculateRateForCurrentGuest();

						$scope.customRate = response.rate_amount;
						$scope.rateForCurrentGuest = response.calculated_rate_amount;
						$scope.isSRRate = response.is_sr;

						confirmForRateChange();
					} else {
						saveChanges('', '', params);
					}
				};

				$scope.invokeApi(RVReservationGuestSrv.verifyRateChange, reqParams, successCallback);
			};

			/* To save guest details */
			$scope.saveGuestDetails = function (params) {
				var data = JSON.parse(JSON.stringify($scope.guestData));

				if (!angular.equals(data, initialGuestInfo) || !angular.equals(initialAccompanyGuests, $scope.accompanyingGuests)) {
					$scope.$emit('showLoader');

					if (isOccupancyRateConfigured()) {
						var isRateChanged = isRateChangeOccurred();

						// CICO-13491
						// If the occupancy Rate is configured and a rate change occured
						// We have to show the popup for 'Keep Current Rate' & 'Change to new Rate'
						// As per CICO-34496 - hide this pop up in hourly mode. Custom rate should never get updated as a result.
						if (isRateChanged && !$scope.reservationData.reservation_card.is_hourly_reservation) {
							calculateRateForCurrentGuest();
							confirmForRateChange();
						}
						// CICO-37895 - Added this to show the popup which allows 'Keep Current Rate' and 'Change to new Rate'
						// while changing the guest count
						else if (!isRateChanged && !$scope.reservationData.reservation_card.is_hourly_reservation) {
								checkForRateChangeForOccupancyChange(params);
							} else {
								saveChanges('', '', params);
							}
						$scope.$emit('hideLoader');
					} else {
						$scope.$emit('hideLoader');
						ngDialog.open({
							template: '/assets/partials/reservation/alerts/notConfiguredOccupancyInStayCard.html',
							className: '',
							scope: $scope,
							closeByDocument: false,
							closeByEscape: false
						});
					}
				}
			};

			// Find guest type id by name
			var findGuestTypeId = function findGuestTypeId(type) {
				var guestType = _.find($rootScope.guestTypes, { value: type });

				return guestType.id;
			};

			// Check whether the provision to add additional accompany guests should be given based on guest count
			var applyGuestCountRuleOnAccompanyingGuests = function applyGuestCountRuleOnAccompanyingGuests(adultCount, childCount, infantCount, accompanyingGuests) {
				var accompanyGuestCount = $scope.guestData.accompanying_guests_details.length,
				    guestCount = adultCount + childCount + infantCount;

				// Add dummy accompany guests only if the guest count is greater that accompany guests
				if (guestCount - 1 > accompanyGuestCount) {

					var noExtraAdultsToBeAdded = adultCount - 1 - accompanyingGuests.ADULT.length,
					    noExtraChildToBeAdded = childCount - accompanyingGuests.CHILDREN.length,
					    noExtraInfantToBeAdded = infantCount - accompanyingGuests.INFANTS.length;

					createExtraAccompanyingGuest('ADULT', noExtraAdultsToBeAdded, accompanyingGuests.ADULT);
					createExtraAccompanyingGuest('CHILDREN', noExtraChildToBeAdded, accompanyingGuests.CHILDREN);
					createExtraAccompanyingGuest('INFANTS', noExtraInfantToBeAdded, accompanyingGuests.INFANTS);

					$scope.$emit('UPDATE_ACCOMPANY_SCROLL');
				}
			};

			/**
    * CICO-12672 Occupancy change from the staycard --
    */
			$scope.onStayCardOccupancyChange = function () {
				if (isWithinMaxOccupancy()) {
					// //////
					// Step 1 : Check against max occupancy and let know the user if the occupancy is not allowed
					// //////
					ngDialog.open({
						template: '/assets/partials/reservation/alerts/occupancy.html',
						className: '',
						scope: $scope,
						closeByDocument: false,
						closeByEscape: false,
						data: JSON.stringify({
							roomType: $scope.reservationData.reservation_card.room_type_description,
							roomMax: $scope.reservationData.reservation_card.max_occupancy
						})
					});
				}
				presentGuestInfo.adult_count = $scope.guestData.adult_count;
				presentGuestInfo.children_count = $scope.guestData.children_count;
				presentGuestInfo.infants_count = $scope.guestData.infants_count;

				applyGuestCountRuleOnAccompanyingGuests(presentGuestInfo.adult_count, presentGuestInfo.children_count, presentGuestInfo.infants_count, $scope.accompanyingGuests);
			};

			// Group accompany guests by type
			var groupAccompanyingGuestsByType = function groupAccompanyingGuestsByType(accompanyingGuests) {
				var accompanyGuestByType = _.groupBy(accompanyingGuests, 'guest_type');

				if (!accompanyGuestByType['ADULT']) {
					accompanyGuestByType['ADULT'] = [];
				}

				if (!accompanyGuestByType['CHILDREN']) {
					accompanyGuestByType['CHILDREN'] = [];
				}

				if (!accompanyGuestByType['INFANTS']) {
					accompanyGuestByType['INFANTS'] = [];
				}

				return accompanyGuestByType;
			};

			// Add the dummy accompany guests based on the guest count
			var createExtraAccompanyingGuest = function createExtraAccompanyingGuest(type, noOfExtraGuests, accompanyingGuests) {

				if (noOfExtraGuests > 0) {
					for (var i = 0; i < noOfExtraGuests; i++) {
						accompanyingGuests.push({ first_name: '', last_name: '', guest_type: type, guest_type_id: findGuestTypeId(type) });
					}
				}
			};

			$scope.init = function () {

				$scope.accompanyingGuests = {
					ADULT: [],
					CHILDREN: [],
					INFANTS: []
				};

				var successCallback = function successCallback(data) {
					$scope.maxAdultsForReservation = $scope.otherData.maxAdults;
					$scope.$emit('hideLoader');
					$scope.$parent.guestData = data;
					$scope.guestData = data;
					$scope.guestCardData.contactInfo.is_flagged = data.primary_guest_details.is_flagged;

					// CICO-51935
					if ($scope.guestCardData && $scope.guestCardData.contactInfo) {
						$scope.guestCardData.contactInfo.stayCount = data.primary_guest_details && data.primary_guest_details.stay_count;

						$rootScope.$broadcast('UPDATE_STAY_COUNT', {
							stayCount: $scope.guestCardData.contactInfo.stayCount
						});
					}

					$scope.accompanyingGuests = $scope.guestData.accompanying_guests_details ? groupAccompanyingGuestsByType($scope.guestData.accompanying_guests_details) : $scope.accompanyingGuests;
					applyGuestCountRuleOnAccompanyingGuests($scope.guestData.adult_count, $scope.guestData.children_count, $scope.guestData.infants_count, $scope.accompanyingGuests);
					presentGuestInfo = JSON.parse(JSON.stringify($scope.guestData)); // to revert in case of exceeding occupancy
					initialGuestInfo = JSON.parse(JSON.stringify($scope.guestData)); // to make API call to update if some change has been made
					angular.copy($scope.accompanyingGuests, initialAccompanyGuests);
					$scope.reservationParentData.rooms[0].accompanying_guest_details = data.accompanying_guests_details;
					$scope.errorMessage = '';

					if ($scope.reservationParentData.group.id || $scope.reservationParentData.allotment.id) {
						if ($scope.otherData.maxAdults > 4) {
							$scope.maxAdultsForReservation = 4;
						} else {
							$scope.maxAdultsForReservation = $scope.otherData.maxAdults;
						}
					}

					// $scope.otherData.maxAdults = (guestMaxSettings.max_adults === null || guestMaxSettings.max_adults === '') ? defaultMaxvalue : guestMaxSettings.max_adults;
					// if($scope)
				};

				var errorCallback = function errorCallback(errorMessage) {
					$scope.$emit('hideLoader');
					$scope.errorMessage = errorMessage;
				};

				var data = {
					"reservation_id": $scope.reservationData.reservation_card.reservation_id
				};

				$scope.invokeApi(RVReservationGuestSrv.fetchGuestTabDetails, data, successCallback, errorCallback);

				var fetchGuestPrefSuccess = function fetchGuestPrefSuccess(data) {
					if (data.data) {
						for (var i in data.data) {
							if (data.data[i].name === 'wakeup_call') {
								$scope.activeWakeUp = data.data[i].active;
								$scope.$emit("wakeup_call_ON", { 'active': data.data[i].active });
							}
						}
					}
				};

				$scope.invokeApi(RVReservationGuestSrv.fetchGuestPrefList, data, fetchGuestPrefSuccess, errorCallback);
			};
			$scope.activeWakeUp = false;
			$scope.activeNewsPapaer = false;

			$scope.init();

			$scope.$on("UPDATEGUESTDEATAILS", function (e, params) {
				$scope.saveGuestDetails(params);
			});

			$scope.$on("FAILURE_UPDATE_RESERVATION", function (e, data) {
				$scope.$emit("OPENGUESTTAB");
				$scope.errorMessage = data;
			});

			// Checks whether the accompany guest label should be shown or not
			$scope.showAccompanyingGuestLabel = function () {
				// Initial loading doesn't contain the accompanying_guests_details
				$scope.guestData.accompanying_guests_details = $scope.guestData.accompanying_guests_details || [];
				return $scope.guestData.adult_count + $scope.guestData.children_count + $scope.guestData.infants_count + $scope.guestData.accompanying_guests_details.length > 1;
			};

			/**
    * Navigate to guest card details view
    */
			$scope.navigateToGuestCard = function (guestId) {
				$state.go('rover.guest.details', {
					guestId: guestId,
					reservationId: $scope.reservationData.reservation_card.reservation_id,
					confirmationNo: $scope.reservationData.reservation_card.confirmation_num,
					fromStaycard: true,
					isFromMenuGuest: true
				});
			};

			/**
    * Filter guests by guest type
    * @param {Array} guestList all guests irrespective of type
    * @param {String} guestType type of guest ADULT/CHILDREN/INFANTS
    * @return {Array} guestList list of given guest type
    */
			var getGuestsByType = function getGuestsByType(guestList, guestType) {
				guestList = _.filter(guestList, function (guest) {
					return guest.guest_type === guestType;
				});

				return guestList;
			};

			/**
    * Search guests by first name / last name
    * @param {Boolean} isPrimary searching for creating a primary guest or not
    * @return {void}
    */
			$scope.searchGuest = function (isPrimary) {
				isPrimary = isPrimary || false;

				var openGuestSearchResultsPopup = function openGuestSearchResultsPopup(isPrimary) {
					ngDialog.open({
						template: '/assets/partials/reservationCard/reservationGuestSearchPopup.html',
						className: '',
						scope: $scope,
						closeByDocument: true,
						closeByEscape: false,
						data: {
							isPrimary: isPrimary
						}
					});
					$scope.setScroller(GUEST_SEARCH_RESULTS_SCROLLER);
				},
				    onGuestsFetchSuccess = function onGuestsFetchSuccess(data) {
					$scope.guestList = [];
					if (data.results.length > 0) {
						angular.forEach(getGuestsByType(data.results, $scope.searchData.guestType), function (item) {
							var guestData = {};

							guestData.id = item.id;
							guestData.firstName = item.first_name;
							guestData.lastName = item.last_name;
							guestData.image = item.image_url;
							guestData.vip = item.vip;
							if (item.address !== null) {
								guestData.address = {};
								guestData.address.city = item.address.city;
								guestData.address.state = item.address.state;
								guestData.address.postalCode = item.address.postal_code;
							}
							guestData.stayCount = item.stay_count;
							guestData.lastStay = {};
							guestData.phone = item.home_phone;
							guestData.email = item.email;
							guestData.lastStay.date = item.last_stay.date;
							guestData.lastStay.room = item.last_stay.room;
							guestData.lastStay.roomType = item.last_stay.room_type;
							guestData.lastStay.confirmationNo = item.last_stay.confirm_no;
							$scope.guestList.push(guestData);
						});

						$timeout(function () {
							$scope.refreshScroller(GUEST_SEARCH_RESULTS_SCROLLER);
						}, 500);
					}
					openGuestSearchResultsPopup(isPrimary);
				},
				    onGuestsFetchFailure = function onGuestsFetchFailure() {
					$scope.guestList = [];
				};

				$scope.callAPI(RVGuestCardsSrv.fetchGuests, {
					onSuccess: onGuestsFetchSuccess,
					onFailure: onGuestsFetchFailure,
					params: {
						first_name: $scope.searchData.firstName,
						last_name: $scope.searchData.lastName,
						guest_type: $scope.searchData.guestType
					}
				});
			};

			/**
    * Find guests by first/last name
    * @param {String} firstName first name of guest
    * @param {String} lastName  last name of guest
    * @param {Boolean} isPrimary should the guest should be linked as primary/accompany guest
    * @return {void}
    */
			$scope.findGuests = function (firstName, lastName, isPrimary, guestType) {
				$scope.searchData = {
					firstName: firstName,
					lastName: lastName,
					guestType: guestType
				};

				$scope.searchGuest(isPrimary);
			};

			/**
    * Close the open dialog
    */
			$scope.closePopup = function () {
				closeDialog();
			};

			/**
    * Attaches a primary/accompany guest to a reservation
    * @param {Number} guestId identifier for guest
    * @param {Boolean} isPrimary should be attaced as a primary/accompany guest
    * @return {void}
    */
			$scope.attachGuestToReservation = function (guestId, isPrimary) {
				var onGuestLinkedToReservationSuccess = function onGuestLinkedToReservationSuccess() {
					closeDialog();
					$state.reload($state.current.name);
				},
				    onGuestLinkToReservationFailure = function onGuestLinkToReservationFailure() {
					closeDialog();
				};

				$scope.callAPI(RVReservationCardSrv.attachGuestToReservation, {
					onSuccess: onGuestLinkedToReservationSuccess,
					onFailure: onGuestLinkToReservationFailure,
					params: {
						reservation_id: $scope.reservationData.reservation_card.reservation_id,
						guest_detail_id: guestId,
						is_primary: isPrimary,
						guest_type: $scope.searchData.guestType
					}
				});
			};

			/**
    * Navigate to new guest creation screen
    * @param {Boolean} isPrimary primary guest or not
    * @return {void}
    */
			$scope.navigateToCreateGuest = function (isPrimary) {
				closeDialog();
				$state.go('rover.guest.details', {
					reservationId: $scope.reservationData.reservation_card.reservation_id,
					fromStaycard: true,
					isPrimary: isPrimary,
					firstName: $scope.searchData.firstName,
					lastName: $scope.searchData.lastName,
					confirmationNo: $scope.reservationData.reservation_card.confirmation_num,
					guestType: $scope.searchData.guestType,
					isFromMenuGuest: true
				});
			};

			/**
    * Should show create guest button
    * @param {Number} guestId if of the guest if already exists
    * @param {String} firstName first name of guest
    * @param {String} lastName last name of guest
    */
			$scope.shouldShowCreateGuestBtn = function (guestId, firstName, lastName) {
				return !guestId && $rootScope.isStandAlone && (firstName || lastName);
			};
		}]);
	}, {}] }, {}, [1]);