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
		sntRover.controller('RVReservationRoomTypeCtrl', ['$rootScope', '$scope', 'roomRates', 'sortOrder', 'rateAddons', 'isAddonsConfigured', 'RVReservationBaseSearchSrv', 'RVReservationAddonsSrv', '$timeout', '$state', 'ngDialog', '$sce', '$stateParams', 'dateFilter', '$filter', 'rvPermissionSrv', 'RVReservationStateService', 'RVReservationDataService', function ($rootScope, $scope, roomRates, sortOrder, rateAddons, isAddonsConfigured, RVReservationBaseSearchSrv, RVReservationAddonsSrv, $timeout, $state, ngDialog, $sce, $stateParams, dateFilter, $filter, rvPermissionSrv, RVReservationStateService, RVReservationDataService) {
			$scope.displayData = {};
			$scope.selectedRoomType = -1;
			$scope.expandedRoom = -1;
			$scope.containerHeight = $(window).height() - 280;
			$scope.showLessRooms = true;
			$scope.showLessRates = false;
			$scope.isHouseAvailable = false;

			$scope.restrictionColorClass = {
				'CLOSED': 'red',
				'CLOSED_ARRIVAL': 'red',
				'CLOSED_DEPARTURE': 'red',
				'MIN_STAY_LENGTH': 'blue',
				'MAX_STAY_LENGTH': 'grey',
				'MIN_STAY_THROUGH': 'purple',
				'MIN_ADV_BOOKING': 'green',
				'MAX_ADV_BOOKING': 'grey',
				'DEPOSIT_REQUESTED': 'grey',
				'CANCEL_PENALTIES': 'grey',
				'LEVELS': 'grey',
				'RATE_NOT_CONFIGURED': 'red'
			};
			$scope.restrictionsMapping = {
				1: 'CLOSED',
				2: 'CLOSED_ARRIVAL',
				3: 'CLOSED_DEPARTURE',
				4: 'MIN_STAY_LENGTH',
				5: 'MAX_STAY_LENGTH',
				6: 'MIN_STAY_THROUGH',
				7: 'MIN_ADV_BOOKING',
				8: 'MAX_ADV_BOOKING',
				9: 'DEPOSIT_REQUESTED',
				10: 'CANCEL_PENALTIES',
				11: 'LEVELS'
			};

			$scope.stateCheck = {
				sortOrder: sortOrder.value,
				rateSelected: {
					allDays: false,
					oneDay: false
				},
				activeMode: $stateParams.view && $stateParams.view === "CALENDAR" ? "CALENDAR" : "ROOM_RATE",
				stayDatesMode: false,
				selectedStayDate: "",
				guestOptionsIsEditable: false,
				preferredType: "",
				rateFilterText: "",
				dateModeActiveDate: "",
				restrictedContractedRates: {},
				datesContainerWidth: $(window).width() - 180,
				dateButtonContainerWidth: $scope.reservationData.stayDays.length * 80,
				suppressedRates: [],
				showClosedRates: false,
				roomDetails: {},
				exhaustedAddons: [],
				selectedRoomRate: {
					rateId: "",
					roomId: ""
				},
				calendarState: {
					showOnlyAvailableRooms: true,
					searchWithRestrictions: true,
					calendarType: "BEST_AVAILABLE"
				}
			};

			// activate room type default view based on reservation settings
			if ($scope.otherData.defaultRateDisplayName === 'Recommended') {
				$scope.activeCriteria = "RECOMMENDED";
			} else if ($scope.otherData.defaultRateDisplayName === 'By Rate') {
				$scope.activeCriteria = "RATE";
			} else {
				// By default RoomType
				$scope.activeCriteria = "ROOM_TYPE";
			}
			var hasContractedRate = function hasContractedRate(rates) {
				var hasRate = false;

				_.each(rates, function (rateId) {
					if ($scope.displayData.allRates[rateId].account_id !== null) {
						hasRate = true;
					}
				});
				return hasRate;
			},
			    getTabRoomDetails = function getTabRoomDetails(roomIndex) {
				var currentRoomTypeId = parseInt($scope.reservationData.tabs[roomIndex].roomTypeId, 10) || "",
				    firstIndex = _.indexOf($scope.reservationData.rooms, _.findWhere($scope.reservationData.rooms, {
					roomTypeId: currentRoomTypeId
				})),
				    lastIndex = _.lastIndexOf($scope.reservationData.rooms, _.last(_.where($scope.reservationData.rooms, {
					roomTypeId: currentRoomTypeId
				})));

				return {
					roomTypeId: currentRoomTypeId,
					firstIndex: firstIndex,
					lastIndex: lastIndex
				};
			},
			    getCurrentRoomDetails = function getCurrentRoomDetails() {
				return getTabRoomDetails($scope.activeRoom);
			},
			    init = function init(isCallingFirstTime) {
				$scope.$emit('showLoader');
				var arrival = $scope.reservationData.arrivalDate;

				$scope.displayData.dates = [];
				$scope.filteredRates = [];
				$scope.stateCheck.restrictedContractedRates = [];
				$scope.isRateFilterActive = true;
				$scope.rateFiltered = false;
				$scope.otherData.taxesMeta = roomRates.tax_codes;
				// defaults and hardcoded values
				$scope.tax = roomRates.tax || 0;
				$scope.rooms = $scope.reservationData.rooms;
				$scope.activeRoom = $scope.viewState.currentTab;
				$scope.stateCheck.roomDetails = getCurrentRoomDetails();
				// CICO-21661 Never default to Room & Rates view! Unless specified in the stateparams to do so
				if ($stateParams.view === "CALENDAR" && isCallingFirstTime) {
					$scope.toggleCalendar();
				}
				// CICO-6069 Init selectedDay
				if (!$scope.stateCheck.dateModeActiveDate) {
					if ($scope.reservationData.midStay) {
						// checking if midstay and handling the expiry condition
						if (new tzIndependentDate($scope.reservationData.departureDate) > new tzIndependentDate($rootScope.businessDate)) {
							$scope.stateCheck.dateModeActiveDate = $rootScope.businessDate;
							$scope.stateCheck.selectedStayDate = $scope.reservationData.rooms[$scope.stateCheck.roomDetails.firstIndex].stayDates[$rootScope.businessDate];
						} else {
							$scope.stateCheck.dateModeActiveDate = arrival;
							$scope.stateCheck.selectedStayDate = $scope.reservationData.rooms[$scope.stateCheck.roomDetails.firstIndex].stayDates[arrival];
						}
					} else {
						$scope.stateCheck.dateModeActiveDate = arrival;
						$scope.stateCheck.selectedStayDate = $scope.reservationData.rooms[$scope.stateCheck.roomDetails.firstIndex].stayDates[arrival];
					}
				}
				// Restructure rates for easy selection
				var rates = [];

				$scope.days = roomRates.results.length;
				// Reset isSupressedField
				$scope.stateCheck.suppressedRates = [];
				$(roomRates.rates).each(function (i, d) {
					rates[d.id] = d;
					if (d.is_suppress_rate_on) {
						$scope.stateCheck.suppressedRates.push(d.id);
					}
				});
				if (!!$scope.reservationData.group.id) {
					var customRate = RVReservationStateService.getCustomRateModel($scope.reservationData.group.id, $scope.reservationData.group.name, 'GROUP');

					rates[customRate.id] = customRate;
				}

				if (!!$scope.reservationData.allotment.id) {
					var customRate = RVReservationStateService.getCustomRateModel($scope.reservationData.allotment.id, $scope.reservationData.allotment.name, 'ALLOTMENT');

					rates[customRate.id] = customRate;
				}

				$scope.displayData.allRates = rates;
				$scope.reservationData.ratesMeta = rates;

				$scope.roomAvailability = $scope.getAvailability(roomRates);
				// Filter for rooms which are available and have rate information
				$scope.displayData.allRooms = $(roomRates.room_types).filter(function () {
					return $scope.roomAvailability[this.id] && $scope.roomAvailability[this.id].availability === true && $scope.roomAvailability[this.id].rates.length > 0 && $scope.roomAvailability[this.id].level !== null;
				});
				// always list roomtypes within a level in increasing order of their default rates
				$scope.displayData.allRooms.sort(function (a, b) {
					var room1AvgPerNight = parseInt($scope.roomAvailability[a.id].averagePerNight);
					var room2AvgPerNight = parseInt($scope.roomAvailability[b.id].averagePerNight);

					if (room1AvgPerNight < room2AvgPerNight) {
						return -1;
					}
					if (room1AvgPerNight > room2AvgPerNight) {
						return 1;
					}
					return 0;
				});
				// sort the rooms by levels
				$scope.displayData.allRooms.sort(function (a, b) {
					if (a.level < b.level) {
						return -1;
					}
					if (a.level > b.level) {
						return 1;
					}
					return 0;
				});
				// CICO-7792 : Bring contracted rates to the top
				$scope.displayData.allRooms.sort(function (a, b) {
					if (hasContractedRate($scope.roomAvailability[a.id].rates)) {
						return -1;
					}
					if (hasContractedRate($scope.roomAvailability[b.id].rates)) {
						return 1;
					}
					return 0;
				});
				$scope.displayData.roomTypes = $scope.displayData.allRooms;
				$scope.stateCheck.preferredType = $scope.reservationData.tabs[$scope.activeRoom].roomTypeId;
				$scope.roomTypes = roomRates.room_types;
				$scope.filterRooms();
				$scope.$emit('hideLoader');
			};

			$scope.isCorRate = function (id) {
				var rateFlag = false;

				angular.forEach(function (d) {
					if (d.id === id && !!d.account_id) {
						rateFlag = true;
					}
				});
				return rateFlag;
			};

			var selectRoomAndRate = function selectRoomAndRate() {
				var rates = [],
				    allthesame = function allthesame(arr) {
					var L = arr.length - 1;

					while (L) {
						if (arr[L--] !== arr[L]) {
							return false;
						}
					}
					return true;
				};

				$scope.reservationData.rateDetails[$scope.activeRoom] = $scope.roomAvailability[$scope.reservationData.tabs[$scope.activeRoom].roomTypeId].ratedetails;

				_.each($scope.reservationData.rooms[0].stayDates, function (staydate, idx) {
					rates.push(staydate.rate.id);
				});
				if (allthesame(rates)) {
					$scope.reservationData.rooms[$scope.activeRoom].rateId = rates;
					$scope.reservationData.rooms[$scope.activeRoom].rateName = "Multiple Rates Selected";
				} else {
					$scope.reservationData.rooms[$scope.activeRoom].rateId = rates[0];
					$scope.reservationData.rooms[$scope.activeRoom].rateName = $scope.reservationData.rooms[0].stayDates[$scope.reservationData.arrivalDate].rate.name;
				}
				$scope.enhanceStay();
			};
			var populateStayDates = function populateStayDates(rateId, roomId, roomIndex) {
				_.each($scope.reservationData.rooms[roomIndex].stayDates, function (details, date) {
					details.rate.id = rateId;
					details.rate.name = $scope.displayData.allRates[rateId].name;
					// CICO-6079
					var calculatedAmount = $scope.roomAvailability[roomId].ratedetails[date] && $scope.roomAvailability[roomId].ratedetails[date][rateId].rate || $scope.roomAvailability[roomId].ratedetails[$scope.reservationData.arrivalDate][rateId].rate;

					calculatedAmount = Number(parseFloat(calculatedAmount).toFixed(2));
					details.rateDetails = {
						actual_amount: calculatedAmount,
						modified_amount: calculatedAmount,
						is_discount_allowed: $scope.reservationData.ratesMeta[rateId].is_discount_allowed === null ? "false" : $scope.reservationData.ratesMeta[rateId].is_discount_allowed.toString(), // API returns true / false as a string ... Hence true in a string to maintain consistency
						is_suppressed: $scope.reservationData.ratesMeta[rateId].is_suppress_rate_on === null ? "false" : $scope.reservationData.ratesMeta[rateId].is_suppress_rate_on.toString()
					};
				});
			};

			$scope.getTabTitle = function (tabIndex) {
				if (tabIndex >= $scope.reservationData.tabs.length) {
					return "INVALID TAB";
				}
				var roomDetail = getTabRoomDetails(tabIndex);

				if (roomDetail.firstIndex === roomDetail.lastIndex) {
					return "ROOM " + (roomDetail.firstIndex + 1);
				}
				return "ROOMS " + (roomDetail.firstIndex + 1) + "-" + (roomDetail.lastIndex + 1);
			};

			$scope.initRoomRates = function (isfromCalendar) {
				var fetchSuccess = function fetchSuccess(data) {
					roomRates = data;
					init();
					if (isfromCalendar) {
						populateStayDates($scope.reservationData.rooms[0].stayDates[$scope.reservationData.arrivalDate].rate.id, $scope.reservationData.rooms[0].roomTypeId, $scope.activeRoom);
						selectRoomAndRate();
					}
				};

				$scope.invokeApi(RVReservationBaseSearchSrv.fetchAvailability, {
					from_date: $scope.reservationData.arrivalDate,
					to_date: $scope.reservationData.departureDate,
					company_id: $scope.reservationData.company.id,
					travel_agent_id: $scope.reservationData.travelAgent.id,
					group_id: $scope.reservationData.group.id,
					allotment_id: $scope.reservationData.allotment.id,
					promotion_code: $scope.reservationData.searchPromoCode
				}, fetchSuccess);

				if (isfromCalendar) {
					// redo the staydays array as there is a possibility that the reservation days have changed!
					$scope.reservationData.stayDays = [];
					for (ms = new tzIndependentDate($scope.reservationData.arrivalDate) * 1, last = new tzIndependentDate($scope.reservationData.departureDate) * 1; ms <= last; ms += 24 * 3600 * 1000) {
						$scope.reservationData.stayDays.push({
							date: dateFilter(new tzIndependentDate(ms), 'yyyy-MM-dd'),
							dayOfWeek: dateFilter(new tzIndependentDate(ms), 'EEE'),
							day: dateFilter(new tzIndependentDate(ms), 'dd')
						});
					}
				}
			};

			$scope.restrictIfOverbook = function (roomId, rateId) {
				var canOverbookHouse = rvPermissionSrv.getPermissionValue('OVERBOOK_HOUSE'),
				    canOverbookRoomType = rvPermissionSrv.getPermissionValue('OVERBOOK_ROOM_TYPE');

				if (canOverbookHouse && canOverbookRoomType) {
					// CICO-17948
					// check actual hotel availability with permissions

					return false;
				}

				if (!canOverbookHouse && $scope.getLeastHouseAvailability(roomId, rateId) < 1) {
					return true;
				}

				if (!canOverbookRoomType && $scope.getLeastAvailability(roomId, rateId) < 1) {
					return true;
				}
			};

			$scope.setRates = function () {
				// CICO-5253 > Rate Types Reservartion
				// Get the rates for which rooms are available $scope.displayData.allRooms
				$scope.ratesMaster = [];
				$scope.displayData.availableRates = [];
				$($scope.displayData.allRooms).each(function (i, d) {
					var room = $scope.roomAvailability[d.id];

					$(room.rates).each(function (i, rateId) {
						if (typeof $scope.ratesMaster[rateId] === 'undefined') {
							$scope.ratesMaster[rateId] = {
								rooms: [],
								rate: $scope.displayData.allRates[rateId]
							};
						}
						$scope.ratesMaster[rateId].rooms.push(room);
					});
				});

				$($scope.ratesMaster).each(function (i, d) {
					if (typeof d !== 'undefined') {
						// Sort Rooms inside the rates so that they are in asc order of avg/day
						if ($scope.stateCheck.preferredType === null || $scope.stateCheck.preferredType === '' || typeof $scope.stateCheck.preferredType === 'undefined') {
							d.rooms.sort(function (a, b) {
								if (a.total[d.rate.id].average < b.total[d.rate.id].average) {
									return -1;
								}
								if (a.total[d.rate.id].average > b.total[d.rate.id].average) {
									return 1;
								}
								return 0;
							});
							d.preferredType = d.rooms[0].id;
							$scope.displayData.availableRates.push(d);
						} else {
							// preferred room process
							// If a contracted rate, then got to show it anyway
							if (hasContractedRate([d.rate.id])) {
								$scope.displayData.availableRates.push(d);
								d.preferredType = d.rooms[0].id;
							} else if (_.where(d.rooms, {
								id: parseInt($scope.stateCheck.preferredType)
							}).length > 0) {
								d.preferredType = parseInt($scope.stateCheck.preferredType);
								d.rooms.sort(function (a, b) {
									if (a.total[d.rate.id].average < b.total[d.rate.id].average) {
										return -1;
									}
									if (a.total[d.rate.id].average > b.total[d.rate.id].average) {
										return 1;
									}
									return 0;
								});
								$scope.displayData.availableRates.push(d);
							}
						}
					}
				});

				$scope.displayData.availableRates.sort(function (a, b) {
					if (a.rate.name.toLowerCase() < b.rate.name.toLowerCase()) {
						return -1;
					}
					if (a.rate.name.toLowerCase() > b.rate.name.toLowerCase()) {
						return 1;
					}
					return 0;
				});

				// Bring member rates to top
				if (!!$scope.reservationData.member.isSelected) {
					$scope.displayData.availableRates.sort(function (a, b) {
						if ($scope.reservationData.member.isSelected && a.rate.is_member) {
							return -1;
						}
						if ($scope.reservationData.member.isSelected && b.rate.is_member) {
							return 1;
						}
						return 0;
					});
				}

				if (!!$scope.reservationData.code && !!$scope.reservationData.code.id) {
					var isPromotionApplied = function isPromotionApplied(rate) {
						var promotionApplied = false;

						_.each(rate.rooms, function (room) {
							_.each(room.ratedetails, function (dayDetails) {
								promotionApplied = promotionApplied || dayDetails[rate.rate.id].applyPromotion;
							});
						});
						return promotionApplied;
					};

					$scope.displayData.availableRates.sort(function (a, b) {
						if (isPromotionApplied(a)) {
							return -1;
						}
						if (isPromotionApplied(b)) {
							return 1;
						}
						return 0;
					});
				}

				// Bring Promo rates to top

				/**
     * A simple utility function to move an element from one position to next in an array
     * @param  {Array} arr
     * @param  {Integer} fromIndex
     * @param  {Integer} toIndex
     */
				function arraymove(arr, fromIndex, toIndex) {
					var element = arr[fromIndex];

					arr.splice(fromIndex, 1);
					arr.splice(toIndex, 0, element);
				}

				// CICO-7792: Put contracted / corporate rates on top
				// CICO-10455
				// Iterate from last till first in the array and put the element with account_id upfront

				if ($scope.displayData.availableRates && $scope.displayData.availableRates.length > 1) {
					var ratesCopy = angular.copy($scope.displayData.availableRates);

					for (i = ratesCopy.length; i > 0; i--) {
						var currentRate = ratesCopy[i - 1].rate;

						if (currentRate.account_id !== null) {
							arraymove($scope.displayData.availableRates, i - 1, 0);
						}
					}
				}
			};

			var isRateSelected = function isRateSelected() {
				// Have to check if all the days have rates and enable the DONE button
				var allSelected = {
					allDays: true,
					oneDay: false
				};

				_.each($scope.reservationData.rooms[$scope.activeRoom].stayDates, function (staydateconfig, date) {
					if (staydateconfig.rate.id !== null && staydateconfig.rate.id !== "") {
						allSelected.oneDay = true;
					}
					if (allSelected.allDays && date !== $scope.reservationData.departureDate && (staydateconfig.rate.id === null || staydateconfig.rate.id === "")) {
						allSelected.allDays = false;
					}
				});
				return allSelected;
			};

			/*
    *	The below method is to advance to the enhancements page from
    *	the room & rates screen in the STAY_DATES mode
    */
			$scope.handleDaysBooking = function (event) {
				event.stopPropagation();
				if (!$scope.stateCheck.rateSelected.allDays) {
					// if the dates are not all set with rates
					return false;
				} else {
					// Handle multiple rates selected
					var firstIndexOfRoomType = $scope.stateCheck.roomDetails.firstIndex,
					    roomIndex;

					for (roomIndex = $scope.stateCheck.roomDetails.firstIndex; roomIndex <= $scope.stateCheck.roomDetails.lastIndex; roomIndex++) {
						if (RVReservationDataService.isVaryingRates($scope.reservationData.rooms[firstIndexOfRoomType].stayDates, $scope.reservationData.arrivalDate, $scope.reservationData.departureDate, $scope.reservationData.numNights)) {
							$scope.reservationData.rooms[roomIndex].rateName = "Multiple Rates Selected";
						} else {
							$scope.reservationData.rooms[roomIndex].rateName = $scope.displayData.allRates[$scope.reservationData.rooms[firstIndexOfRoomType].stayDates[$scope.reservationData.arrivalDate].rate.id].name;
						}
						$scope.reservationData.rateDetails[roomIndex] = $scope.roomAvailability[$scope.reservationData.tabs[$scope.activeRoom].roomTypeId].ratedetails;
						if ($stateParams.fromState === "rover.reservation.staycard.reservationcard.reservationdetails" || $stateParams.fromState === "STAY_CARD") {
							_.each($scope.reservationData.rooms[roomIndex].stayDates, function (details, date) {
								var rateId = $scope.reservationData.rooms[roomIndex].stayDates[date].rate.id,
								    roomId = $scope.reservationData.rooms[roomIndex].roomTypeId;

								details.rate.id = rateId;
								details.rate.name = $scope.displayData.allRates[rateId].name;
								var calculatedAmount = $scope.roomAvailability[roomId].ratedetails[date] && $scope.roomAvailability[roomId].ratedetails[date][rateId].rate || $scope.roomAvailability[roomId].ratedetails[$scope.reservationData.arrivalDate][rateId].rate;

								calculatedAmount = Number(parseFloat(calculatedAmount).toFixed(2));
								details.rateDetails = {
									actual_amount: calculatedAmount,
									modified_amount: calculatedAmount,
									is_discount_allowed: $scope.reservationData.ratesMeta[rateId].is_discount_allowed === null ? "false" : $scope.reservationData.ratesMeta[rateId].is_discount_allowed.toString(), // API returns true / false as a string ... Hence true in a string to maintain consistency
									is_suppressed: $scope.reservationData.ratesMeta[rateId].is_suppress_rate_on === null ? "false" : $scope.reservationData.ratesMeta[rateId].is_suppress_rate_on.toString()
								};
							});
						}
					}

					transferState();
				}
			};

			// CICO-12757 : To save and go back to stay card
			$scope.saveAndGotoStayCard = function () {
				var staycardDetails = {
					title: $filter('translate')('STAY_CARD'),
					name: 'rover.reservation.staycard.reservationcard.reservationdetails',
					param: {
						confirmationId: $scope.reservationData.confirmNum,
						id: $scope.reservationData.reservationId,
						isrefresh: true
					}
				};

				$scope.saveReservation(staycardDetails.name, staycardDetails.param);
			};

			$scope.handleNoEdit = function (event, roomId, rateId) {
				event.stopPropagation();
				$scope.reservationData.rooms[$scope.activeRoom].rateName = $scope.displayData.allRates[rateId].name;
				$scope.reservationData.rateDetails[$scope.activeRoom] = $scope.roomAvailability[roomId].ratedetails;
				if (!$scope.stateCheck.stayDatesMode) {
					$scope.navigateOut();
				}
			};

			var findExhaustedRateAddons = function findExhaustedRateAddons(roomId, rateId) {

				var arrival = $scope.reservationData.arrivalDate,
				    departure = $scope.reservationData.departureDate,
				    exhaustedRateAddons = [],
				    updateExhaustedAddonsList = function updateExhaustedAddonsList(addon) {
					// Need to see the applicable count based on the amount_type
					var applicableCount = RVReservationStateService.getApplicableAddonsCount(addon.amountType, addon.postType, parseInt(addon.postFrequency, 10), parseInt($scope.reservationData.tabs[$scope.viewState.currentTab].numAdults, 10), parseInt($scope.reservationData.tabs[$scope.viewState.currentTab].numChildren, 10), parseInt($scope.reservationData.numNights, 10)) * parseInt($scope.reservationData.tabs[$scope.viewState.currentTab].roomCount, 10);

					if (_.isNumber(addon.inventory) && addon.inventory < applicableCount) {
						var currentIndex = _.findIndex(exhaustedRateAddons, {
							id: addon.id
						});

						if (currentIndex > -1) {
							// entry exists already
							if (exhaustedRateAddons[currentIndex].inventory > addon.inventory) {
								exhaustedRateAddons[currentIndex].inventory = addon.inventory; // reset to the minimum of the counts
							}
						} else {
							exhaustedRateAddons.push(addon);
						}
					}
				};

				if (!$scope.stateCheck.stayDatesMode) {
					// Not in stay dates mode
					_.each($scope.roomAvailability[roomId].ratedetails, function (rateDetail, forDate) {
						if (forDate === arrival || forDate !== departure) {
							_.each(rateDetail[rateId].associatedAddons, function (addon) {
								updateExhaustedAddonsList(addon);
							});
						}
					});
				} else {
					// In stay dates mode
					_.each($scope.roomAvailability[roomId].ratedetails[$scope.stateCheck.dateModeActiveDate][rateId].associatedAddons, function (addon) {
						updateExhaustedAddonsList(addon);
					});
				}

				return exhaustedRateAddons;
			};

			var haveAddonsChanged = function haveAddonsChanged(entireSet, associatedAddons) {
				if ($stateParams.fromState === "rover.reservation.staycard.reservationcard.reservationdetails" || $stateParams.fromState === "STAY_CARD") {
					return associatedAddons && associatedAddons.length > 0;
				} else {
					var extraAddons = [];

					_.each(entireSet, function (addon) {
						if (!_.find(associatedAddons, {
							id: addon.id
						})) {
							extraAddons.push(addon.id);
						}
					});
					return extraAddons.length > 0;
				}
			};

			$scope.enhanceStay = function () {

				// CICO-9429: Show Addon step only if its been set ON in admin
				var navigate = function navigate() {
					if ($scope.reservationData.guest.id || $scope.reservationData.company.id || $scope.reservationData.travelAgent.id || $scope.reservationData.group.id) {
						if ($rootScope.isAddonOn && isAddonsConfigured) {
							$state.go('rover.reservation.staycard.mainCard.addons', {
								"from_date": $scope.reservationData.arrivalDate,
								"to_date": $scope.reservationData.departureDate
							});
						} else {
							$state.go('rover.reservation.staycard.mainCard.summaryAndConfirm');
						}
					}
				};

				if ($rootScope.isAddonOn && isAddonsConfigured) {
					// CICO-16874
					$state.go('rover.reservation.staycard.mainCard.addons', {
						"from_date": $scope.reservationData.arrivalDate,
						"to_date": $scope.reservationData.departureDate
					});
				} else {
					var allRatesSelected = _.reduce(_.pluck($scope.reservationData.rooms, 'rateId'), function (a, b) {
						return !!a && !!b;
					});

					if (allRatesSelected) {
						if (!$scope.reservationData.guest.id && !$scope.reservationData.company.id && !$scope.reservationData.travelAgent.id && !$scope.reservationData.group.id) {
							$scope.$emit('PROMPTCARD');
							$scope.$watch("reservationData.guest.id", navigate);
							$scope.$watch("reservationData.company.id", navigate);
							$scope.$watch("reservationData.travelAgent.id", navigate);
						} else {
							navigate();
						}
					} else {
						var roomIndexWithoutRate = _.findIndex($scope.reservationData.rooms, {
							rateId: ""
						});
						var tabIndexWithoutRate = _.findIndex($scope.reservationData.tabs, {
							roomTypeId: $scope.reservationData.rooms[roomIndexWithoutRate].roomTypeId
						});

						$scope.changeActiveRoomType(tabIndexWithoutRate || 0);
					}
				}
			};

			var updateSupressedRatesFlag = function updateSupressedRatesFlag() {
				var roomIndex = $scope.stateCheck.roomDetails.firstIndex;

				for (; roomIndex <= $scope.stateCheck.roomDetails.lastIndex; roomIndex++) {
					$scope.reservationData.rooms[roomIndex].isSuppressed = false;
					_.each($scope.reservationData.rooms[roomIndex].stayDates, function (d, i) {
						// Find if any of the selected rates is suppressed
						var currentRateSuppressed = $scope.stateCheck.suppressedRates.indexOf(d.rate.id) > -1;

						if (typeof $scope.reservationData.rooms[roomIndex].isSuppressed === 'undefined') {
							$scope.reservationData.rooms[roomIndex].isSuppressed = currentRateSuppressed;
						} else {
							$scope.reservationData.rooms[roomIndex].isSuppressed = $scope.reservationData.rooms[roomIndex].isSuppressed || currentRateSuppressed;
						}
					});
				}
			};

			var permissionCheck = function permissionCheck(roomId, rateId) {
				var BOOK_RESTRICTED_ROOM_RATE = rvPermissionSrv.getPermissionValue('BOOK_RESTRICTED_ROOM_RATE'),
				    OVERBOOK_ROOM_TYPE = rvPermissionSrv.getPermissionValue('OVERBOOK_ROOM_TYPE'); // CICO-19821

				if (BOOK_RESTRICTED_ROOM_RATE && OVERBOOK_ROOM_TYPE) {
					return true;
				} else {
					var authorization = true;
					var restrictions = $scope.stateCheck.stayDatesMode ? $scope.roomAvailability[roomId].ratedetails[$scopestateCheck.dateModeActiveDate][rateId].restrictions : $scope.getAllRestrictions(roomId, rateId);
					var roomCount = $scope.stateCheck.stayDatesMode ? $scope.roomAvailability[roomId].ratedetails[$scopestateCheck.dateModeActiveDate][rateId].availabilityCount : $scope.getLeastAvailability(roomId, rateId);

					if (restrictions.length > 0 && !BOOK_RESTRICTED_ROOM_RATE) {
						authorization = false;
					}
					if (roomCount < 1 && !OVERBOOK_ROOM_TYPE) {
						authorization = false;
					}
					return authorization;
				}
			};

			$scope.handleBooking = function (roomId, rateId, event, flags) {
				$scope.reservationData.totalStayCost = 0;
				$scope.stateCheck.preferredType = parseInt($scope.stateCheck.preferredType, 10) || "";

				if (!!event) {
					event.stopPropagation();
				}

				if (!permissionCheck(roomId, rateId)) {
					return false;
				}

				$scope.stateCheck.exhaustedAddons = [];
				// Check for addonthing
				if (!flags || !flags.skipAddonCheck) {
					$scope.stateCheck.exhaustedAddons = findExhaustedRateAddons(roomId, rateId);
				}

				if ($scope.stateCheck.exhaustedAddons.length > 0) {
					// run through the addon popup routine;
					$scope.stateCheck.selectedRoomRate = {
						roomId: roomId,
						rateId: rateId
					};
					alertAddonOverbooking();
					return false;
				}

				/*	Using the populateStayDates method, the stayDates object for the active room are
     *	are updated with the rate and rateName information
     */
				// CICO-9727: Reservations - Error thrown when user chooses SR rates for another room type
				// bypass rate selection from room type other than $scope.stateCheck.preferredType


				// Disable room type change if stay date mode is true
				if ($scope.stateCheck.preferredType > 0 && roomId !== $scope.stateCheck.preferredType && $scope.stateCheck.stayDatesMode) {
					return false;
				}
				if ($scope.stateCheck.stayDatesMode) {
					var activeDate = $scope.stateCheck.dateModeActiveDate,
					    roomIndex,
					    currentRoom;

					if (!$scope.stateCheck.rateSelected.oneDay) {
						/**
       * The first selected day must be taken as the preferredType
       * No more selection of rooms must be allowed here
       */
						$scope.stateCheck.preferredType = parseInt(roomId);
						for (roomIndex = $scope.stateCheck.roomDetails.firstIndex; roomIndex <= $scope.stateCheck.roomDetails.lastIndex; roomIndex++) {
							currentRoom = $scope.reservationData.rooms[roomIndex];
							currentRoom.roomTypeId = roomId;
							currentRoom.rateId = [];
							currentRoom.rateId.push(rateId);
							currentRoom.stayDates[$scope.stateCheck.dateModeActiveDate].rate.id = rateId;
							currentRoom.roomTypeName = $scope.roomAvailability[roomId].name;
							$scope.reservationData.rateDetails[roomIndex] = $scope.roomAvailability[roomId].ratedetails;
						}
						$scope.filterRooms();
					}

					$scope.stateCheck.selectedStayDate.rate.id = rateId;

					// CICO-6079

					var calculatedAmount = $scope.roomAvailability[roomId].ratedetails[activeDate] && $scope.roomAvailability[roomId].ratedetails[activeDate][rateId].rate || $scope.roomAvailability[roomId].ratedetails[activeDate][rateId].rate;

					calculatedAmount = Number(parseFloat(calculatedAmount).toFixed(2));
					for (roomIndex = $scope.stateCheck.roomDetails.firstIndex; roomIndex <= $scope.stateCheck.roomDetails.lastIndex; roomIndex++) {
						currentRoom = $scope.reservationData.rooms[roomIndex];
						currentRoom.stayDates[activeDate].rateDetails = {
							actual_amount: calculatedAmount,
							modified_amount: calculatedAmount,
							is_discount_allowed: $scope.reservationData.ratesMeta[rateId].is_discount_allowed === null ? "false" : $scope.reservationData.ratesMeta[rateId].is_discount_allowed.toString(), // API returns true / false as a string ... Hence true in a string to maintain consistency
							is_suppressed: $scope.reservationData.ratesMeta[rateId].is_suppress_rate_on === null ? "false" : $scope.reservationData.ratesMeta[rateId].is_suppress_rate_on.toString()
						};
						currentRoom.stayDates[activeDate].rate.id = rateId;

						if (!currentRoom.rateId) {
							currentRoom.rateId = [];
						}
						currentRoom.rateId.push(rateId);
					}
					updateSupressedRatesFlag();
					// see if the done button has to be enabled
					$scope.stateCheck.rateSelected.allDays = isRateSelected().allDays;
					$scope.stateCheck.rateSelected.oneDay = isRateSelected().oneDay;
				} else {

					var i;

					if (!$scope.reservationData.tabs[$scope.activeRoom].roomTypeId || parseInt($scope.reservationData.tabs[$scope.activeRoom].roomTypeId) !== parseInt(roomId)) {
						$scope.reservationData.tabs[$scope.activeRoom].roomTypeId = parseInt(roomId);
					}
					for (i = $scope.stateCheck.roomDetails.firstIndex; i <= $scope.stateCheck.roomDetails.lastIndex; i++) {

						_.extend($scope.reservationData.rooms[i], {
							roomTypeId: parseInt(roomId),
							roomTypeName: $scope.roomAvailability[roomId].name,
							rateId: rateId,
							isSuppressed: $scope.displayData.allRates[rateId].is_suppress_rate_on,
							rateName: $scope.displayData.allRates[rateId].name,
							rateAvg: $scope.roomAvailability[roomId].total[rateId].average,
							rateTotal: $scope.roomAvailability[roomId].total[rateId].total
						});

						populateStayDates(rateId, roomId, i);

						$scope.reservationData.rooms[i].demographics.market = $scope.displayData.allRates[rateId].market_segment.id === null ? "" : $scope.displayData.allRates[rateId].market_segment.id;
						$scope.reservationData.rooms[i].demographics.source = $scope.displayData.allRates[rateId].source.id === null ? "" : $scope.displayData.allRates[rateId].source.id;
						$scope.reservationData.rooms[i].demographics.origin = $scope.displayData.allRates[rateId].origin && $scope.displayData.allRates[rateId].origin.id === null ? "" : $scope.displayData.allRates[rateId].origin.id;

						if (i === 0) {
							$scope.reservationData.demographics.source = $scope.reservationData.rooms[i].demographics.source;
							$scope.reservationData.demographics.market = $scope.reservationData.rooms[i].demographics.market;
							$scope.reservationData.demographics.origin = $scope.reservationData.rooms[i].demographics.origin;
						}

						// 7641 - Update the rateDetails array in the reservationData
						$scope.reservationData.rateDetails[i] = $scope.roomAvailability[roomId].ratedetails;
						// Revisit all occupancyLimit warnings
						$scope.checkOccupancyLimit(null, false, i);
					}
					$scope.viewState.currentTab = $scope.activeRoom;
					if ($scope.otherData.showOverbookingAlert) {

						var leastHouseAvailability = $scope.getLeastHouseAvailability(roomId, rateId),
						    leastRoomTypeAvailability = $scope.getLeastAvailability(roomId, rateId),
						    numberOfRooms = $scope.reservationData.tabs[$scope.activeRoom].roomCount;

						if (leastHouseAvailability < 1 || leastRoomTypeAvailability < numberOfRooms) {
							// Show appropriate Popup Here
							$scope.invokeApi(RVReservationBaseSearchSrv.checkOverbooking, {
								from_date: $scope.reservationData.arrivalDate,
								to_date: $scope.reservationData.departureDate,
								group_id: $scope.reservationData.group.id
							}, function (availability) {
								$scope.availabilityData = availability;
								ngDialog.open({
									template: '/assets/partials/reservation/alerts/availabilityCheckOverbookingAlert.html',
									scope: $scope,
									controller: 'overbookingAlertCtrl',
									closeByDocument: false,
									closeByEscape: false,
									data: JSON.stringify({
										houseFull: leastHouseAvailability < 1,
										roomTypeId: roomId,
										isRoomAvailable: leastRoomTypeAvailability > 0,
										activeView: function () {
											if (leastHouseAvailability < 1) {
												return 'HOUSE';
											}
											return 'ROOM';
										}(),
										isGroupRate: !!$scope.reservationData.group.id
									})
								});
							});
						} else {
							transferState();
						}
					} else {
						transferState();
					}
				}

				// check whether any one of the rooms rate has isSuppressed on and turn on flag
				var keepGoing = true;

				$scope.reservationData.isRoomRateSuppressed = false;
				angular.forEach($scope.reservationData.rooms, function (room, index) {
					if (keepGoing) {
						if (room.isSuppressed) {
							$scope.reservationData.isRoomRateSuppressed = true;
							keepGoing = false;
						}
					}
				});
				$scope.$emit("REFRESHACCORDIAN");
			};

			$scope.alertOverbooking = function (close) {
				var timer = 0;

				if (close) {
					$scope.closeDialog();
					timer = 1000;
				}
				$timeout(transferState, timer);
			};

			$scope.showAllRooms = function () {
				$scope.showLessRooms = false;
				$scope.refreshScroll();
				$scope.filterRooms();
			};

			$scope.setSelectedType = function (val) {
				$scope.selectedRoomType = $scope.selectedRoomType === val.id ? -1 : val.id;
				$scope.refreshScroll();
			};

			// Fix for CICO-9536
			// Expected Result: Only one single room type can be applied to a reservation.
			// However, the user should be able to change the room type for the first night on the Stay Dates screen,
			// while the reservation is not yet checked in. The control should be disabled for any subsequent nights.
			$scope.resetRates = function () {
				var roomIndex = $scope.stateCheck.roomDetails.firstIndex;

				for (; roomIndex <= $scope.stateCheck.roomDetails.lastIndex; roomIndex++) {
					_.each($scope.reservationData.rooms[roomIndex].stayDates, function (stayDate, idx) {
						stayDate.rate.id = '';
						stayDate.rate.name = '';
					});
				}
				$scope.stateCheck.rateSelected.allDays = false;
				// reset value, else rate selection will get bypassed
				// check $scope.handleBooking method
				$scope.stateCheck.rateSelected.oneDay = false;
			};

			$scope.filterRooms = function () {
				if (!$scope.stateCheck.preferredType) {
					if ($scope.showLessRooms && $scope.displayData.allRooms.length > 1) {
						$scope.displayData.roomTypes = $scope.displayData.allRooms.first();
						var level = $scope.displayData.allRooms.first()[0].level;
						var firstId = $scope.displayData.allRooms.first()[0].id;

						if (level === 1 || level === 2) {
							// Append rooms from the next level
							// Get the candidate rooms of the room to be appended
							var targetlevel = level + 1;
							var candidateRooms = _.filter($scope.roomAvailability, function (room) {
								return room.level === targetlevel && room.availability === true && room.rates.length > 0;
							});
							// Check if candidate rooms are available IFF not in stayDatesMode

							if (candidateRooms.length === 0) {
								// try for candidate rooms in the same level
								candidateRooms = _.filter($scope.roomAvailability, function (room) {
									return room.level === level && room.id !== firstId && room.availability === true && room.rates.length > 0 && parseInt(room.averagePerNight) >= parseInt($scope.roomAvailability[firstId].averagePerNight);
								});
							}
							// Sort the candidate rooms to get the one with the least average rate

							candidateRooms.sort(function (a, b) {
								if (parseInt(a.averagePerNight) < parseInt(b.averagePerNight)) {
									return -1;
								}
								if (parseInt(a.averagePerNight) > parseInt(b.averagePerNight)) {
									return 1;
								}
								return 0;
							});

							// append the appropriate room to the list to be displayed
							if (candidateRooms.length > 0) {
								var selectedRoom = $($scope.displayData.allRooms).filter(function () {
									return this.id === candidateRooms[0].id;
								});

								if (selectedRoom.length > 0) {
									$scope.displayData.roomTypes.push(selectedRoom[0]);
								}
							}
						}
					} else {
						$scope.displayData.roomTypes = $scope.displayData.allRooms;
					}
					$scope.selectedRoomType = -1;
				} else {
					$scope.reservationData.tabs[$scope.activeRoom].roomTypeId = $scope.stateCheck.preferredType;
					// If a room type of category Level1 is selected, show this room type plus the lowest priced room type of the level 2 category.
					// If a room type of category Level2 is selected, show this room type plus the lowest priced room type of the level 3 category.
					// If a room type of category Level3 is selected, only show the selected room type.
					$scope.displayData.roomTypes = _.filter($scope.displayData.allRooms, function (room) {
						return room.id === parseInt($scope.stateCheck.preferredType, 10) || !$scope.reservationData.group.id && $scope.viewState.identifier === "CREATION" && hasContractedRate($scope.roomAvailability[room.id].rates); // In case of group skip this check
					});

					if ($scope.reservationData.tabs.length < 2 && // Not showing other room types in case of multiple reservations
					$scope.displayData.roomTypes.length > 0 && !$scope.stateCheck.rateSelected.oneDay && $scope.reservationData.status !== "CHECKEDIN" && $scope.reservationData.status !== "CHECKING_OUT") {
						var level = $scope.roomAvailability[$scope.displayData.roomTypes[0].id].level;

						if (level === 1 || level === 2) {
							// Append rooms from the next level
							// Get the candidate rooms of the room to be appended
							var targetlevel = level + 1;
							var candidateRooms = _.filter($scope.roomAvailability, function (room) {
								return room.level === targetlevel && room.availability === true && room.rates.length > 0 && !hasContractedRate($scope.roomAvailability[room.id].rates);
							});

							// Check if candidate rooms are available
							if (candidateRooms.length === 0) {
								// try for candidate rooms in the same level
								candidateRooms = _.filter($scope.roomAvailability, function (room) {
									return room.level === level && parseInt(room.id, 10) !== parseInt($scope.stateCheck.preferredType, 10) && room.availability === true && room.rates.length > 0 && parseInt(room.averagePerNight) >= parseInt($scope.roomAvailability[$scope.stateCheck.preferredType].averagePerNight) && !hasContractedRate($scope.roomAvailability[room.id].rates);
								});
							}
							// Sort the candidate rooms to get the one with the least average rate

							candidateRooms.sort(function (a, b) {
								if (a.averagePerNight < b.averagePerNight) {
									return -1;
								}
								if (a.averagePerNight > b.averagePerNight) {
									return 1;
								}
								return 0;
							});

							// append the appropriate room to the list to be displayed
							if (candidateRooms.length > 0) {
								var selectedRoom = $($scope.displayData.allRooms).filter(function () {
									return this.id === candidateRooms[0].id;
								});

								if (selectedRoom.length > 0) {
									$scope.displayData.roomTypes.push(selectedRoom[0]);
								}
							}
						}
					}
					$scope.selectedRoomType = $scope.stateCheck.preferredType;
				}

				$scope.setRates();
				$scope.refreshScroll();
			};

			// This method does a restriction check on the rates!
			var restrictionCheck = function restrictionCheck(roomsIn) {
				var rooms = roomsIn;

				_.each(rooms, function (room, idx) {
					var roomId = room.id;

					if (room.rates.length > 0) {
						_.each(room.rates, function (rateId) {
							/* ("now processing", {
       	roomId: roomId,
       	rateId: rateId
       })*/
							var validRate = true;
							var configuredRate = true;

							_.each(room.ratedetails, function (today, key) {
								if (key === $scope.reservationData.departureDate && key !== $scope.reservationData.arrivalDate) {
									// do nothing -CICO 17580 - Need not check for restrictions in case of departure date when the #nights > 0 (NOT a day reservation)
									// --CICO-17746 Need to include departure date only for this case
									if (typeof today[rateId].restrictions === 'undefined') {
										today[rateId].restrictions = [];
									}
									_.each(today[rateId].rateBreakUp.restrictions, function (restriction) {
										switch ($scope.restrictionsMapping[restriction.restriction_type_id]) {
											case 'CLOSED_DEPARTURE':
												// 3 CLOSED_DEPARTURE
												if (new tzIndependentDate(key) - new tzIndependentDate($scope.reservationData.departureDate) === 0) {
													validRate = false;
													today[rateId].restrictions.push({
														key: 'CLOSED_DEPARTURE',
														value: 'CLOSED FOR DEPARTURE'
													});
												}
												break;
										}
									});
								} else if (!$scope.stateCheck.stayDatesMode || $scope.stateCheck.stayDatesMode && key === $scope.stateCheck.dateModeActiveDate) {
									var currDate = key;
									// Step 1 : Check if the rates are configured for all the days of stay

									if (typeof today[rateId] === 'undefined') {
										// ("The rate " + rateId + " is not available for " + roomId + " on " + key);
										// TODO: Uncomment the following code block and comment the line after the block to show rates configured for just that day in the room and rates section under the staydates mode
										/* if ($scope.stateCheck.stayDatesMode) {
          	if (currDate === $scope.stateCheck.dateModeActiveDate) {
          		validRate = false;
          	}
          } else {
          	validRate = false;
          }*/
										validRate = false;
										configuredRate = false;
									} else {

										if (typeof today[rateId].restrictions === 'undefined') {
											today[rateId].restrictions = [];
										}

										if (today[rateId].availabilityCount < 1) {
											validRate = false;
										}

										// CICO-19098 - House Availability Check
										if (today[rateId].houseAvailability < 1) {
											validRate = false;
											today[rateId].restrictions.push({
												key: '',
												value: 'NO HOUSE AVAILABILITY'
											});
										}

										var rateConfiguration = today[rateId].rateBreakUp,
										    numAdults = parseInt($scope.reservationData.rooms[$scope.stateCheck.roomDetails.firstIndex].numAdults),
										    numChildren = parseInt($scope.reservationData.rooms[$scope.stateCheck.roomDetails.firstIndex].numChildren);
										// In case of stayDatesMode the occupancy has to be considered only for the single day

										if ($scope.stateCheck.stayDatesMode) {
											numAdults = parseInt($scope.reservationData.rooms[$scope.stateCheck.roomDetails.firstIndex].stayDates[$scope.stateCheck.dateModeActiveDate].guests.adults);
											numChildren = parseInt($scope.reservationData.rooms[$scope.stateCheck.roomDetails.firstIndex].stayDates[$scope.stateCheck.dateModeActiveDate].guests.children);
										}

										var stayLength = parseInt($scope.reservationData.numNights);
										// The below variable stores the days till the arrival date
										var daysTillArrival = Math.round((new tzIndependentDate($scope.reservationData.arrivalDate) - new tzIndependentDate($rootScope.businessDate)) / (1000 * 60 * 60 * 24));

										// Step 2 : Check if the rates are configured for the selected occupancy
										if (rateConfiguration.single === null && rateConfiguration.double === null && rateConfiguration.extra_adult === null && rateConfiguration.child === null) {
											// ("This rate has to be removed as no rates are confugured for " + key);
											validRate = false;
											configuredRate = false;
											today[rateId].restrictions.push({
												key: 'RATE_NOT_CONFIGURED',
												value: ''
											});
										} else {
											// Step 2: Check for the other constraints here
											// Step 2 A : Children
											if (numChildren > 0 && rateConfiguration.child === null) {
												// ("This rate has to be removed as no children are configured for " + key);
												validRate = false;
												configuredRate = false;
												today[rateId].restrictions.push({
													key: 'RATE_NOT_CONFIGURED',
													value: ''
												});
											} else if (numAdults === 1 && rateConfiguration.single === null) {
												// Step 2 B: one adult - single needs to be configured
												// ("This rate has to be removed as no single are configured for " + key);
												validRate = false;
												configuredRate = false;
												today[rateId].restrictions.push({
													key: 'RATE_NOT_CONFIGURED',
													value: ''
												});
											} else if (numAdults >= 2 && rateConfiguration.double === null) {
												// Step 2 C: more than one adult - double needs to be configured
												// ("This rate has to be removed as no double are configured for " + key);
												validRate = false;
												configuredRate = false;
												today[rateId].restrictions.push({
													key: 'RATE_NOT_CONFIGURED',
													value: ''
												});
											} else if (numAdults > 2 && rateConfiguration.extra_adult === null) {
												// Step 2 D: more than two adults - need extra_adult to be configured
												// ("This rate has to be removed as no adults are configured for " + key);
												validRate = false;
												configuredRate = false;
												today[rateId].restrictions.push({
													key: 'RATE_NOT_CONFIGURED',
													value: ''
												});
											}
										}

										// Step 3 : Check if the rates are configured for the selected restrictions
										if (rateConfiguration.restrictions.length > 0) {
											_.each(rateConfiguration.restrictions, function (restriction) {
												switch ($scope.restrictionsMapping[restriction.restriction_type_id]) {
													case 'CLOSED':
														// 1 CLOSED
														// Cannot book a closed room
														validRate = false;
														today[rateId].restrictions.push({
															key: 'CLOSED',
															value: 'CLOSED'
														});
														break;
													case 'CLOSED_ARRIVAL':
														// 2 CLOSED_ARRIVAL
														if (new tzIndependentDate(currDate) - new tzIndependentDate($scope.reservationData.arrivalDate) === 0) {
															validRate = false;
															today[rateId].restrictions.push({
																key: 'CLOSED_ARRIVAL',
																value: 'CLOSED FOR ARRIVAL'
															});
														}
														break;
													case 'CLOSED_DEPARTURE':
														// 3 CLOSED_DEPARTURE
														if (new tzIndependentDate(currDate) - new tzIndependentDate($scope.reservationData.departureDate) === 0) {
															validRate = false;
															today[rateId].restrictions.push({
																key: 'CLOSED_DEPARTURE',
																value: 'CLOSED FOR DEPARTURE'
															});
														}
														break;
													case 'MIN_STAY_LENGTH':
														// 4 MIN_STAY_LENGTH
														if (restriction.days !== null && stayLength < restriction.days) {
															validRate = false;
															today[rateId].restrictions.push({
																key: 'MIN_STAY_LENGTH',
																value: 'MIN. LENGTH OF STAY: ' + restriction.days + ' DAYS'
															});
														}
														break;
													case 'MAX_STAY_LENGTH':
														// 5 MAX_STAY_LENGTH
														if (restriction.days !== null && stayLength > restriction.days) {
															validRate = false;
															today[rateId].restrictions.push({
																key: 'MAX_STAY_LENGTH',
																value: 'MAX. LENGTH OF STAY: ' + restriction.days + ' DAYS'
															});
														}
														break;
													case 'MIN_STAY_THROUGH':
														// 6 MIN_STAY_THROUGH
														if (Math.round((new tzIndependentDate($scope.reservationData.departureDate) - new tzIndependentDate(currDate)) / (1000 * 60 * 60 * 24)) < restriction.days) {
															validRate = false;
															today[rateId].restrictions.push({
																key: 'MIN_STAY_THROUGH',
																value: 'MIN. STAY THROUGH: ' + restriction.days + ' DAYS'
															});
														}
														break;
													case 'MIN_ADV_BOOKING':
														// 7 MIN_ADV_BOOKING
														if (restriction.days !== null && daysTillArrival < restriction.days) {
															validRate = false;
															today[rateId].restrictions.push({
																key: 'MIN_ADV_BOOKING',
																value: 'MIN. ADVANCE BOOKING: ' + restriction.days + ' DAYS'
															});
														}
														break;
													case 'MAX_ADV_BOOKING':
														// 8 MAX_ADV_BOOKING
														if (restriction.days !== null && daysTillArrival > restriction.days) {
															validRate = false;
															today[rateId].restrictions.push({
																key: 'MAX_ADV_BOOKING',
																value: 'MAX. ADVANCE BOOKING: ' + restriction.days + ' DAYS'
															});
														}
														break;
													case 'DEPOSIT_REQUESTED':
														// 9 DEPOSIT_REQUESTED
														break;
													case 'CANCEL_PENALTIES':
														// 10 CANCEL_PENALTIES
														break;
													case 'LEVELS':
														// 11 LEVELS
														break;

												}
											});
										}

										// Step 4: Check for validity of promotions
										if (today[rateId].applyPromotion) {
											// check if currDate falls between from and to dates of the promotion
											var promoFrom = today[rateId].appliedPromotion.from,
											    promoTo = today[rateId].appliedPromotion.to,
											    validPromotion = true;

											if (!!promoFrom && !!promoTo) {
												// in case promo has a date range
												validPromotion = new tzIndependentDate(promoFrom) <= new tzIndependentDate(currDate) && new tzIndependentDate(promoTo) >= new tzIndependentDate(currDate);
											} else if (!!promoFrom) {
												// case where promo has only from_date
												validPromotion = new tzIndependentDate(promoFrom) <= new tzIndependentDate(currDate);
											} else if (!!promoTo) {
												// case where promo has only to_date
												validPromotion = new tzIndependentDate(promoTo) >= new tzIndependentDate(currDate);
											}
											if (!validPromotion) {
												today[rateId].restrictions.push({
													key: 'INVALID_PROMO',
													value: 'PROMOTION INVALID'
												});
											}
											validRate = validRate && validPromotion;
										}
									}
								}
							});
							// Remove rate from the room's list here if flag failed
							// CICO-7792 : To keep corporate rates even if not applicable on those days
							if ($scope.displayData.allRates[rateId].account_id) {
								if (!validRate) {
									if (typeof $scope.stateCheck.restrictedContractedRates[roomId] === "undefined") {
										$scope.stateCheck.restrictedContractedRates[roomId] = [];
									}
									$scope.stateCheck.restrictedContractedRates[roomId].push(rateId);
								}
							} else if (!configuredRate || !validRate && !$scope.stateCheck.showClosedRates) {
								var existingRates = roomsIn[roomId].rates;
								var afterRemoval = _.without(existingRates, rateId);

								roomsIn[roomId].rates = afterRemoval;
							}
						});
					}
				});
				return roomsIn;
			};

			var getTaxPercent = function getTaxPercent(taxes) {
				var taxTotalPercent = 0.0;
				var taxTotalDollars = 0.0;

				_.each(taxes, function (tax) {
					var taxDetails = _.where($scope.otherData.taxesMeta, {
						id: parseInt(tax.charge_code_id)
					});

					if (taxDetails.length === 0) {
						// Error condition! Tax code in results but not in meta data
						console.log("Error on tax meta data");
					} else {
						var taxData = taxDetails[0];
						// Need not consider perstay here
						var taxAmount = taxData.amount;

						if (taxData.amount_sign !== "+") {
							taxData.amount = parseFloat(taxData.amount * -1.0);
						}
						if (taxData.post_type === 'NIGHT') {
							if (taxData.amount_symbol === '%') {
								taxTotalPercent = parseFloat(taxTotalPercent) + parseFloat(taxData.amount);
							} else {
								taxTotalDollars = parseFloat(taxData.amount) + parseFloat(taxTotalDollars);
							}
						}
					}
				});
				var taxDetails = "";

				if (taxTotalPercent > 0.0) {
					taxDetails += taxTotalPercent + "%";
				}
				if (taxTotalDollars > 0.0) {
					if (taxDetails) {
						taxDetails += "+ $" + taxTotalDollars;
					} else {
						taxDetails += "$" + taxTotalDollars;
					}
				}
				return taxDetails ? taxDetails : "0%";
			};

			var isMembershipValid = function isMembershipValid() {
				var membership = $scope.reservationData.guestMemberships,
				    selectedMembership = $scope.reservationData.member.value,
				    validFFP = _.findWhere(membership.ffp, {
					membership_type: selectedMembership
				}),
				    validHLP = _.findWhere(membership.hlp, {
					membership_type: selectedMembership
				});

				return $rootScope.isFFPActive && !!validFFP || $rootScope.isHLPActive && !!validHLP;
			};

			$scope.getAvailability = function (roomRates) {
				var parsedRooms = RVReservationStateService.parseRoomRates(roomRates, $scope.reservationData.arrivalDate, $scope.reservationData.departureDate, $scope.reservationData.rooms[$scope.stateCheck.roomDetails.firstIndex].stayDates, $scope.activeRoom, $scope.reservationData.numNights, {
					code: $scope.reservationData.code,
					group: $scope.reservationData.group,
					allotment: $scope.reservationData.allotment
				}, $scope.reservationData.member.isSelected),
				    rooms = parsedRooms.rooms;

				$scope.displayData.dates = parsedRooms.displayDates;

				// STEP TWO
				rooms = restrictionCheck(rooms);

				// STEP THREE -- SORT BASED ON THE ADMIN SETTINGS [[RATE SEQ]]
				_.each(rooms, function (value) {
					// Sort according to preference
					if ($scope.stateCheck.sortOrder === "HIGH_TO_LOW") {
						value.rates.sort(function (a, b) {
							var averageA = parseFloat(value.total[a].average);
							var averageB = parseFloat(value.total[b].average);

							if (averageA > averageB) {
								return -1;
							}
							if (averageA < averageB) {
								return 1;
							}
							return 0;
						});
					} else {
						value.rates.sort(function (a, b) {
							var averageA = parseFloat(value.total[a].average);
							var averageB = parseFloat(value.total[b].average);

							if (averageA < averageB) {
								return -1;
							}
							if (averageA > averageB) {
								return 1;
							}
							return 0;
						});
					}

					// STEP FOUR - BRING CORPORATE RATES TO THE TOP
					// [CICO-7792] Bring the corporate rates to the top
					/*  https://stayntouch.atlassian.net/browse/CICO-7792
      *	If both a Travel Agent and a Company are linked to the reservation,
      *	both with active, valid contracts,
      *	display the Company first, then the Travel Agent.
      */
					if (!!$scope.reservationDetails.companyCard.id || !!$scope.reservationDetails.travelAgent.id) {
						value.rates.sort(function (a, b) {
							if ($scope.displayData.allRates[a].account_id !== null && $scope.displayData.allRates[b].account_id !== null) {
								if (parseInt($scope.displayData.allRates[a].account_id) === parseInt($scope.reservationDetails.companyCard.id)) {
									return -1;
								}
								if (parseInt($scope.displayData.allRates[b].account_id) === parseInt($scope.reservationDetails.companyCard.id)) {
									return 1;
								}
							}
							if ($scope.displayData.allRates[a].account_id !== null) {
								return -1;
							}
							if ($scope.displayData.allRates[b].account_id !== null) {
								return 1;
							}
							return 0;
						});
					}

					// STEP SIX - BRING MEMBER RATES TO THE TOP
					if (!!$scope.reservationData.member.isSelected) {
						var isValidMemberRate = function isValidMemberRate(rateId) {
							var memberRate = false;

							_.each(value.ratedetails, function (dayDetails) {
								memberRate = memberRate || dayDetails[rateId].isMember;
							});
							return memberRate;
						};

						value.rates.sort(function (a, b) {
							if (isValidMemberRate(a)) {
								return -1;
							}
							if (isValidMemberRate(b)) {
								return 1;
							}
							return 0;
						});
					}

					// STEP FIVE - BRING PROMOTION RATES TO THE TOP
					// CICO-18204
					if (!!$scope.reservationData.code) {
						var isPromotionApplied = function isPromotionApplied(rateId) {
							var promotionApplied = false;

							_.each(value.ratedetails, function (dayDetails) {
								promotionApplied = promotionApplied || dayDetails[rateId].applyPromotion;
							});
							return promotionApplied;
						};

						value.rates.sort(function (a, b) {
							if (isPromotionApplied(a)) {
								return -1;
							}
							if (isPromotionApplied(b)) {
								return 1;
							}
							return 0;
						});
					}

					// Caluculate the default ID
					if (value.rates.length > 0) {
						value.defaultRate = value.rates[0];
					} else {
						value.defaultRate = -1;
					}

					// calculate the rate differences between the rooms
					// Put the average rate in the room object
					if (typeof value.total[value.defaultRate] !== 'undefined') {
						value.averagePerNight = value.total[value.defaultRate].average;
						value.isSuppressed = $scope.displayData.allRates[value.defaultRate].is_suppress_rate_on;
					}
				});

				return rooms;
			};

			$scope.refreshScroll = function () {
				$timeout(function () {
					$scope.refreshScroller('room_types');
				}, 100);
			};

			$scope.selectRate = function (selectedRate) {
				$scope.stateCheck.rateFilterText = selectedRate.rate.name;
				$scope.filterRates();
				$scope.rateFiltered = true;
				$scope.refreshScroll();
			};

			$scope.hideResults = function () {
				$timeout(function () {
					$scope.isRateFilterActive = false;
				}, 300);
			};

			$scope.filterRates = function () {
				$scope.rateFiltered = false;
				if ($scope.stateCheck.rateFilterText.length > 0) {
					var re = new RegExp($scope.stateCheck.rateFilterText, "gi");

					$scope.filteredRates = $($scope.displayData.availableRates).filter(function () {
						return this.rate.name.match(re);
					});
					if ($scope.filteredRates.length) {
						// CICO-11119
						$scope.isRateFilterActive = true;
					}
				} else {
					$scope.filteredRates = [];
				}
				$scope.refreshScroll();
			};

			$scope.$watch('activeCriteria', function () {
				$scope.refreshScroll();
				$scope.stateCheck.rateFilterText = "";
				$scope.filterRates();
			});

			$scope.highlight = function (text, search) {
				if (!search) {
					return text;
				}
				return text.replace(new RegExp(search, 'gi'), '<span class="highlight">$&</span>');
			};

			$scope.to_trusted = function (html_code) {
				return $sce.trustAsHtml(html_code);
			};

			$scope.toggleCalendar = function () {
				$scope.stateCheck.activeMode = $scope.stateCheck.activeMode === "ROOM_RATE" ? "CALENDAR" : "ROOM_RATE";
				$scope.heading = $scope.stateCheck.activeMode === "ROOM_RATE" ? "Rooms & Rates" : " Rate Calendar";
				$scope.setHeadingTitle($scope.heading);
				$("#rooms-and-rates-header .switch-button").toggleClass("on");
			};

			$scope.showStayDateDetails = function (selectedDate) {
				// by pass departure stay date from stay dates manipulation
				if (selectedDate === $scope.reservationData.departureDate) {
					return false;
				}
				$scope.stateCheck.dateModeActiveDate = selectedDate;
				$scope.stateCheck.selectedStayDate = $scope.reservationData.rooms[$scope.stateCheck.roomDetails.firstIndex].stayDates[selectedDate];
				init();
			};

			$scope.toggleEditGuestOptions = function () {
				$scope.stateCheck.guestOptionsIsEditable = !$scope.stateCheck.guestOptionsIsEditable;
			};

			/**
    *	The below method toggles the staydates view.
    *	Also, if the user is coming in this view for the first time, the first date is auto-selected
    */
			$scope.toggleStayDaysMode = function () {
				$scope.stateCheck.stayDatesMode = !$scope.stateCheck.stayDatesMode;
				init();
				// see if the done button has to be enabled
				if ($scope.stateCheck.stayDatesMode) {
					$scope.stateCheck.rateSelected.allDays = isRateSelected().allDays;
					$scope.stateCheck.rateSelected.oneDay = isRateSelected().oneDay;
					// Adjust to the height of the stay dates container
					$scope.containerHeight = $scope.containerHeight - 70;
				} else {
					// Adjust to the height of the stay dates container
					$scope.containerHeight = $scope.containerHeight + 70;
				}
				$scope.refreshScroll();
				$timeout(function () {
					$scope.refreshScroller("stayDates");
				}, 150);
			};

			$scope.updateDayOccupancy = function (occupants) {
				$scope.reservationData.rooms[$scope.stateCheck.roomDetails.firstIndex].stayDates[$scope.stateCheck.dateModeActiveDate].guests[occupants] = parseInt($scope.stateCheck.selectedStayDate.guests[occupants]);
				/**
     * CICO-8504
     * In case of multiple rates selected, the side bar and the reservation summary need to showcase the first date's occupancy!
     *
     */
				if ($scope.reservationData.arrivalDate === $scope.stateCheck.dateModeActiveDate) {
					var occupancy = $scope.reservationData.rooms[$scope.stateCheck.roomDetails.firstIndex].stayDates[$scope.stateCheck.dateModeActiveDate].guests,
					    roomIndex = $scope.stateCheck.roomDetails.firstIndex;

					for (; roomIndex <= $scope.stateCheck.roomDetails.lastIndex; roomIndex++) {
						$scope.reservationData.rooms[roomIndex].numAdults = occupancy.adults;
						$scope.reservationData.rooms[roomIndex].numChildren = occupancy.children;
						$scope.reservationData.rooms[roomIndex].numInfants = occupancy.infants;
					}
				}

				if (!$scope.checkOccupancyLimit($scope.stateCheck.dateModeActiveDate)) {
					$scope.preferredType = "";
					// TODO : Reset other stuff as well
					$scope.stateCheck.rateSelected.oneDay = false;
					$scope.stateCheck.rateSelected.allDays = false;
					var roomIndex = $scope.stateCheck.roomDetails.firstIndex;

					for (; roomIndex <= $scope.stateCheck.roomDetails.lastIndex; roomIndex++) {
						_.each($scope.reservationData.rooms[roomIndex].stayDates, function (stayDate) {
							stayDate.rate = {
								id: ""
							};
						});
					}
				}
				init();
			};

			$scope.toggleClosedRates = function () {
				$scope.$emit('showLoader');
				$scope.stateCheck.showClosedRates = !$scope.stateCheck.showClosedRates;
				init();
			};

			$scope.getLeastAvailability = function (roomId, rateId) {
				var leastAvailability = $scope.roomAvailability[roomId].ratedetails[$scope.reservationData.arrivalDate][rateId].availabilityCount;

				angular.forEach($scope.roomAvailability[roomId].ratedetails, function (rateDetail, date) {
					if ((date === $scope.reservationData.arrivalDate || date !== $scope.reservationData.departureDate) && rateDetail[rateId].availabilityCount < leastAvailability) {
						leastAvailability = rateDetail[rateId].availabilityCount;
					}
				});
				return leastAvailability;
			};

			$scope.getLeastHouseAvailability = function (roomId, rateId) {
				var leastAvailability = $scope.roomAvailability[roomId].ratedetails[$scope.reservationData.arrivalDate][rateId].houseAvailability;

				angular.forEach($scope.roomAvailability[roomId].ratedetails, function (rateDetail, date) {
					if ((date === $scope.reservationData.arrivalDate || date !== $scope.reservationData.departureDate) && rateDetail[rateId].houseAvailability < leastAvailability) {
						leastAvailability = rateDetail[rateId].houseAvailability;
					}
				});
				return leastAvailability;
			};

			$scope.getAllRestrictions = function (roomId, rateId) {
				var restrictions = [];
				var restrictionsValues = [];

				angular.forEach($scope.roomAvailability[roomId].ratedetails, function (rateDetail, index) {
					angular.forEach(rateDetail[rateId].restrictions, function (restriction) {
						if (restrictionsValues.indexOf(restriction.value) < 0) {
							restrictions.push(restriction);
							restrictionsValues.push(restriction.value);
						}
					});
				});
				return restrictions;
			};

			// since we are going back to create reservation screen
			// mark 'isSameCard' as true on '$scope.reservationData'
			$scope.setSameCardNgo = function () {
				$scope.reservationData.isSameCard = true;
				$state.go('rover.reservation.search');
			};

			var initEventListeners = function initEventListeners() {
				$scope.$on('SIDE_BAR_OCCUPANCY_UPDATE', function () {
					init();
				});

				$scope.$on('TABS_MODIFIED', function () {
					init();
				});

				$scope.$on('resetGuestTab', function () {
					// While coming in the guest Id might be retained in reservationData.guest.id in case another reservation is created for the same guest
					$scope.invokeApi(RVReservationBaseSearchSrv.fetchUserMemberships, $scope.reservationDetails.guestCard.id || $scope.reservationData.guest.id, function (data) {
						$scope.$emit('hideLoader');
						$scope.reservationData.guestMemberships = {
							ffp: data.frequentFlyerProgram,
							hlp: data.hotelLoyaltyProgram
						};
						if ($scope.reservationData.member.isSelected && isMembershipValid()) {
							init();
						} else if ($scope.reservationData.member.isSelected) {
							ngDialog.open({
								template: '/assets/partials/reservation/alerts/rvNotMemberPopup.html',
								className: '',
								scope: $scope,
								closeByDocument: false,
								closeByEscape: false
							});
						}
					});
				});

				// 	CICO-7792 BEGIN
				$scope.$on("cardChanged", function (event, cardIds) {
					$scope.reservationData.company.id = cardIds.companyCard;
					$scope.reservationData.travelAgent.id = cardIds.travelAgent;
					$scope.initRoomRates();
					// Call the availability API and rerun the init method
				});
				// 	CICO-7792 END

				$scope.$on('switchToStayDatesCalendar', function () {
					$scope.stateCheck.activeMode = $scope.stateCheck.activeMode === "ROOM_RATE" ? "CALENDAR" : "ROOM_RATE";
					$("#rooms-and-rates-header .switch-button").toggleClass("on");
				});
			};

			var setBackButton = function setBackButton() {
				// CICO-20270: to force selection of a rate after removing a card with contracted rate.
				if ($stateParams.disable_back_staycard) {
					return;
				}

				// smart switch btw edit reservation flow and create reservation flow
				if (!!$state.params && $state.params.isFromChangeStayDates) {
					$rootScope.setPrevState = {
						title: 'Stay Dates',
						name: 'rover.reservation.staycard.changestaydates'
					};
				} else if ($scope.reservationData && $scope.reservationData.confirmNum && $scope.reservationData.reservationId) {
					$rootScope.setPrevState = {
						title: $filter('translate')('STAY_CARD'),
						name: 'rover.reservation.staycard.reservationcard.reservationdetails',
						param: {
							confirmationId: $scope.reservationData.confirmNum,
							id: $scope.reservationData.reservationId,
							isrefresh: true
						}
					};
				} else {
					$rootScope.setPrevState = {
						title: $filter('translate')('CREATE_RESERVATION'),
						callback: 'setSameCardNgo',
						scope: $scope
					};
				}
			};

			var initScrollers = function initScrollers() {
				$scope.setScroller('room_types', {
					preventDefault: false
				});
				$scope.setScroller('stayDates', {
					scrollX: true,
					scrollY: false
				});
			};

			var initializeRoomAndRates = function initializeRoomAndRates() {
				BaseCtrl.call(this, $scope);
				$scope.heading = 'Rooms & Rates';
				$scope.setHeadingTitle($scope.heading);
				// Initialize metaData in the ReservationStateService
				RVReservationStateService.metaData.rateAddons = angular.copy(rateAddons);
				RVReservationStateService.metaData.taxDetails = angular.copy(roomRates.tax_codes);
				setBackButton();
				init(true);
				initEventListeners();
				initScrollers();
			};

			$scope.navigateOut = function () {
				if ($scope.viewState.identifier !== "REINSTATE" && ($stateParams.fromState === "rover.reservation.staycard.reservationcard.reservationdetails" || $stateParams.fromState === "STAY_CARD")) {
					$scope.saveAndGotoStayCard();
				} else {
					$scope.enhanceStay();
				}
			};

			$scope.onResetAddonsAcknowledged = function () {
				$scope.navigateOut();
				$scope.closeDialog();
			};

			var transferState = function transferState() {
				// Check if there has been a rateChange
				if (!!RVReservationStateService.bookMark.lastPostedRate) {
					// Identify if there are extra addons added other than those of the associated rate's
					var firstRoom = $scope.reservationData.rooms[0],
					    currentRate = firstRoom.rateId,
					    existingAddons = firstRoom.addons,
					    // Entire set of addons for the reservation (incl rate associated addons)
					existingRateAddons = _.filter(existingAddons, function (addon) {
						return addon.is_rate_addon;
					}),
					    existingReservationAddons = _.filter(existingAddons, function (addon) {
						return !addon.is_rate_addon;
					}),
					    newRateAddons = RVReservationStateService.fetchAssociatedAddons(currentRate),
					    reservationAddonsChanged = false;

					RVReservationStateService.setReservationFlag('RATE_CHANGED', true);

					firstRoom.addons = _.map(newRateAddons, function (addon) {
						return _.extend(addon, {
							is_rate_addon: true
						});
					});

					// Go through the existingReservationAddons and retain those of which arent having the new rate
					// in their excluded list. Leave the rest
					_.each(existingReservationAddons, function (addon) {
						if (!addon.allow_rate_exclusion || addon.allow_rate_exclusion && _.indexOf(addon.excluded_rate_ids, currentRate) < 0) {
							firstRoom.addons.push(addon);
						} else {
							reservationAddonsChanged = true;
						}
					});

					// if user has added extra addons other than that of the associated rate -- alert the user!
					if (reservationAddonsChanged || haveAddonsChanged(existingAddons, existingRateAddons)) {
						ngDialog.open({
							template: '/assets/partials/reservation/alerts/rateChangeAddonsAlert.html',
							scope: $scope,
							closeByDocument: false,
							closeByEscape: false
						});
						return false;
					}
				}
				$scope.navigateOut();
			};

			initializeRoomAndRates();

			// $scope.changeActiveRoomType = function(tabIndex) {
			// 	$scope.activeRoom = tabIndex;
			// 	init();
			// };

			$scope.isRoomTypeSelected = function (roomTypeId) {
				var chosen = false;

				_.each($scope.reservationData.tabs, function (tabData, index) {
					if (parseInt(tabData.roomTypeId, 10) === roomTypeId && $scope.activeRoom != index) {
						chosen = true;
					}
				});
				return chosen;
			};

			$scope.onRoomTypeChange = function ($event) {
				var tabIndex = $scope.viewState.currentTab,
				    roomType = parseInt($scope.stateCheck.preferredType, 10) || "",
				    roomIndex;

				$scope.reservationData.tabs[tabIndex].roomTypeId = roomType;

				for (roomIndex = $scope.stateCheck.roomDetails.firstIndex; roomIndex <= $scope.stateCheck.roomDetails.lastIndex; roomIndex++) {
					$scope.reservationData.rooms[roomIndex].roomTypeId = roomType;
				}
				$scope.filterRooms($event);
				$scope.resetRates();
			};

			$scope.changeActiveRoomType = function (tabIndex) {
				if ($scope.stateCheck.stayDatesMode) {
					return false;
				}
				$scope.activeRoom = tabIndex;
				$scope.viewState.currentTab = tabIndex;
				init();
			};

			// CICO-20187
			$scope.getBookButtonStyle = function (roomId, rateId) {
				if ($scope.stateCheck.restrictedContractedRates[roomId] && $scope.stateCheck.restrictedContractedRates[roomId].indexOf(rateId) > -1) {
					return 'red';
				}

				if (!$scope.stateCheck.stayDatesMode) {
					if ($scope.getAllRestrictions(roomId, rateId).length > 0) {
						return 'brand-colors';
					} else {
						return 'green';
					}
				} else {
					// Staydates mode
					if ($scope.roomAvailability[roomId].ratedetails[$scope.stateCheck.dateModeActiveDate] && $scope.roomAvailability[roomId].ratedetails[$scope.stateCheck.dateModeActiveDate][rateId] && $scope.roomAvailability[roomId].ratedetails[$scope.stateCheck.dateModeActiveDate][rateId].restrictions.length > 0) {
						return 'white brand-text';
					} else {
						return 'white green-text';
					}
				}
			};

			var alertAddonOverbooking = function alertAddonOverbooking(close) {
				var addonIndex = 0,
				    timer = 0;

				if (close) {
					$scope.closeDialog();
					timer = 1500;
				}
				$timeout(function () {
					for (; addonIndex < $scope.stateCheck.exhaustedAddons.length; addonIndex++) {
						var addon = $scope.stateCheck.exhaustedAddons[addonIndex];

						if (!addon.isAlerted) {
							addon.isAlerted = true;
							ngDialog.open({
								template: '/assets/partials/reservationCard/rvInsufficientInventory.html',
								className: 'ngdialog-theme-default',
								closeByDocument: true,
								scope: $scope,
								data: JSON.stringify({
									name: addon.name,
									count: addon.inventory,
									canOverbookInventory: rvPermissionSrv.getPermissionValue('OVERRIDE_ITEM_INVENTORY')
								})
							});
							break;
						}
					}
					if (addonIndex === $scope.stateCheck.exhaustedAddons.length) {
						$scope.handleBooking($scope.stateCheck.selectedRoomRate.roomId, $scope.stateCheck.selectedRoomRate.rateId, false, {
							skipAddonCheck: true
						});
					}
				}, timer);
			};

			$scope.selectAddon = function () {
				alertAddonOverbooking(true);
			};

			$scope.toggleSearchWithRestrictions = function () {
				$scope.stateCheck.calendarState.searchWithRestrictions = !$scope.stateCheck.calendarState.searchWithRestrictions;
				$scope.$broadcast('availableRateFiltersUpdated');
			};

			$scope.toggleShowOnlyAvailable = function () {
				$scope.stateCheck.calendarState.showOnlyAvailableRooms = !$scope.stateCheck.calendarState.showOnlyAvailableRooms;
				$scope.$broadcast('availableRateFiltersUpdated');
			};
		}]);
	}, {}] }, {}, [1]);