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
		sntRover.controller('RVSelectRoomAndRateCtrl', ['$rootScope', '$scope', 'areReservationAddonsAvailable', '$stateParams', 'rates', 'ratesMeta', '$timeout', '$state', 'RVReservationBaseSearchSrv', 'RVReservationStateService', 'RVReservationDataService', 'house', 'RVSelectRoomRateSrv', 'rvPermissionSrv', 'ngDialog', '$filter', 'RVRoomRatesSrv', 'rvGroupConfigurationSrv', 'rvAllotmentConfigurationSrv', 'dateFilter', 'houseRestrictions', function ($rootScope, $scope, areReservationAddonsAvailable, $stateParams, rates, ratesMeta, $timeout, $state, RVReservationBaseSearchSrv, RVReservationStateService, RVReservationDataService, house, RVSelectRoomRateSrv, rvPermissionSrv, ngDialog, $filter, RVRoomRatesSrv, rvGroupConfigurationSrv, rvAllotmentConfigurationSrv, dateFilter, houseRestrictions) {
			BaseCtrl.call(this, $scope);
			$scope.borrowForGroups = $stateParams.borrow_for_groups === 'true' ? true : false;

			$scope.stateCheck = {
				pagination: {
					roomType: {
						perPage: 25,
						page: 1,
						ratesList: {
							perPage: 25
						}
					},
					rate: {
						perPage: 25,
						page: 1,
						roomsList: {
							perPage: 25
						}
					}
				},
				house: house, // house availability
				baseInfo: {
					roomTypes: [],
					totalCount: rates.total_count,
					rates: [],
					maxAvblRates: rates.total_count
				},
				activeMode: $stateParams.view && $stateParams.view === 'CALENDAR' ? 'CALENDAR' : 'ROOM_RATE',
				activeView: '', // RECOMMENDED, ROOM_TYPE and RATE
				stayDatesMode: false,
				calendarState: {
					showOnlyAvailableRooms: true,
					searchWithRestrictions: true,
					calendarType: 'BEST_AVAILABLE'
				},
				roomDetails: {},
				preferredType: '',
				taxInfo: null,
				showClosedRates: false,
				rateSelected: {
					allDays: false,
					oneDay: false
				},
				selectedStayDate: '',
				dateModeActiveDate: '',
				dateButtonContainerWidth: $scope.reservationData.stayDays.length * 120,
				guestOptionsIsEditable: false,
				exhaustedAddons: [],
				showLessRooms: !$stateParams.room_type_id,
				maxRoomsToShow: 0,
				selectedRoomType: -1,
				stayDates: {},
				isFromNightlyDiary: $stateParams.fromState === 'NIGHTLY_DIARY',
				roomTypeIdFromNightlyDiary: $stateParams.fromState === 'NIGHTLY_DIARY' ? $stateParams.room_type_id : ''
			};

			$scope.display = {
				roomFirstGrid: [],
				rateFirstGrid: []
			};

			// --
			$scope.restrictionColorClass = RVSelectRoomRateSrv.restrictionColorClass;
			$scope.restrictionsMapping = ratesMeta['restrictions'];

			// mapping unhandled data set while coming directly from nightly diary
			if ($scope.stateCheck.isFromNightlyDiary) {
				$scope.reservationData.isFromNightlyDiary = true;
				$scope.reservationData.arrivalDate = $stateParams.from_date;
				$scope.reservationData.departureDate = $stateParams.to_date;
				$scope.reservationData.tabs[0].checkinTime = $stateParams.arrivalTime;
				$scope.reservationData.tabs[0].checkoutTime = $stateParams.departureTime;
				$scope.reservationData.tabs[0].roomCount = 1;
				$scope.reservationData.numNights = $stateParams.numNights;
				$scope.reservationData.roomTypeIdFromNightlyDiary = $stateParams.room_type_id;

				/*  The following method helps to initiate the staydates object across the period of
           *  stay. The occupany selected for each room is taken assumed to be for the entire period of the
           *  stay at this state.
           *  The rates for these days have to be popuplated in the subsequent states appropriately
           */
				var initStayDates = function initStayDates(roomNumber) {
					if (roomNumber === 0) {
						$scope.reservationData.stayDays = [];
					}

					$scope.reservationData.rooms[roomNumber].stayDates = {};

					for (var d = [], ms = new tzIndependentDate($scope.reservationData.arrivalDate) * 1, last = new tzIndependentDate($scope.reservationData.departureDate) * 1; ms <= last; ms += 24 * 3600 * 1000) {
						if (roomNumber === 0) {
							$scope.reservationData.stayDays.push({
								date: dateFilter(new tzIndependentDate(ms), 'yyyy-MM-dd'),
								dayOfWeek: dateFilter(new tzIndependentDate(ms), 'EEE'),
								day: dateFilter(new tzIndependentDate(ms), 'dd')
							});
						}
						$scope.reservationData.rooms[roomNumber].stayDates[dateFilter(new tzIndependentDate(ms), 'yyyy-MM-dd')] = {
							guests: {
								adults: parseInt($scope.reservationData.rooms[roomNumber].numAdults),
								children: parseInt($scope.reservationData.rooms[roomNumber].numChildren),
								infants: parseInt($scope.reservationData.rooms[roomNumber].numInfants)
							},
							rate: {
								id: "",
								name: ""
							}
						};
					}
				};

				for (var roomNumber = 0; roomNumber < $scope.reservationData.rooms.length; roomNumber++) {
					initStayDates(roomNumber);
				}
			}

			if ($stateParams.fromState === "STAY_CARD") {
				angular.forEach($scope.reservation.reservation_card.stay_dates, function (detail) {
					$scope.reservationData.rooms[0].stayDates[detail.date].contractId = detail.contract_id;
				});
			}

			// -- REFERENCES
			var TABS = $scope.reservationData.tabs,
			    ROOMS = $scope.reservationData.rooms,
			    ARRIVAL_DATE = $scope.reservationData.arrivalDate,
			    DEPARTURE_DATE = $scope.reservationData.departureDate,
			    scrollPosition = 0,
			    isRoomTypeChangePopupShown = false;

			// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// --- ***************************
			// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// --- PRIVATE METHODS
			// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// --- ***************************

			var getScrollerObject = function getScrollerObject(key) {
				var scrollerObject = $scope.$parent.myScroll && $scope.$parent.myScroll[key];

				if (_.isUndefined(scrollerObject)) {
					scrollerObject = $scope.myScroll[key];
				}
				return scrollerObject;
			},

			/**
    * set dafault active view from hotel settings
    */
			setDefaultViewByHotelSettings = function setDefaultViewByHotelSettings() {
				// By default RoomType
				$scope.stateCheck.activeView = 'ROOM_TYPE';
				if ($scope.otherData.defaultRateDisplayName === 'Recommended') {
					$scope.stateCheck.activeView = 'RECOMMENDED';
				} else if ($scope.otherData.defaultRateDisplayName === 'By Rate') {
					$scope.stateCheck.activeView = 'RATE';
				}
			},
			    shouldRecommend = function shouldRecommend() {
				// This method checks if there are groups or cards attached
				return $state.params.travel_agent_id || $scope.reservationData.travelAgent.id || $state.params.company_id || $scope.reservationData.company.id || $state.params.group_id || $scope.reservationData.group.id || $state.params.allotment_id || $scope.reservationData.allotment.id || $state.params.promotion_id || $scope.reservationData.promotionId || $scope.reservationData.numNights === 0 || $state.params.is_member;
			},
			    isMembershipValid = function isMembershipValid() {
				var membership = $scope.reservationData.guestMemberships,
				    selectedMembership = $scope.reservationData.member.value,
				    validFFP = _.findWhere(membership.ffp, {
					membership_type: selectedMembership
				}),
				    validHLP = _.findWhere(membership.hlp, {
					membership_type: selectedMembership
				});

				return $rootScope.isFFPActive && !!validFFP || $rootScope.isHLPActive && !!validHLP;
			},
			    evaluatePromotion = function evaluatePromotion() {
				var promoFrom = $scope.reservationData.code.from,
				    promoTo = $scope.reservationData.code.to,
				    isValid = true,
				    validityTable = {};

				_.each(ROOMS[$scope.stateCheck.roomDetails.firstIndex].stayDates, function (dateInfo, currDate) {
					if (currDate !== DEPARTURE_DATE || currDate === ARRIVAL_DATE) {
						if (!!promoFrom) {
							isValid = new tzIndependentDate(promoFrom) <= new tzIndependentDate(currDate);
						}
						if (!!promoTo) {
							isValid = new tzIndependentDate(promoTo) >= new tzIndependentDate(currDate);
						}
					}
					validityTable[currDate] = isValid;
				});
				return validityTable;
			},
			    getTabRoomDetails = function getTabRoomDetails(roomIndex) {
				var currentRoomTypeId = parseInt(TABS[roomIndex].roomTypeId, 10) || '',
				    firstIndex = _.indexOf(ROOMS, _.findWhere(ROOMS, {
					roomTypeId: currentRoomTypeId
				})),
				    lastIndex = _.lastIndexOf(ROOMS, _.last(_.where(ROOMS, {
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
			    isRateSelected = function isRateSelected() {
				// Have to check if all the days have rates and enable the DONE button
				var allSelected = {
					allDays: true,
					oneDay: false
				};

				_.each(ROOMS[$scope.stateCheck.roomDetails.firstIndex].stayDates, function (dateConfig, date) {
					if (!!dateConfig.rate.id) {
						allSelected.oneDay = true;
					}
					if (allSelected.allDays && date !== DEPARTURE_DATE && !dateConfig.rate.id) {
						allSelected.allDays = false;
					}
				});
				return allSelected;
			},
			    getRoomsADR = function getRoomsADR(cb, forRate, page) {
				var occupancies = _.pluck(ROOMS[$scope.stateCheck.roomDetails.firstIndex].stayDates, 'guests');

				if (occupancies.length > 1) {
					// No need to send last day's occupancy to the rate's API
					occupancies.splice(-1, 1);
				}

				var payLoad = {
					from_date: ARRIVAL_DATE,
					to_date: DEPARTURE_DATE,
					company_id: $scope.stateCheck.activeView == 'RECOMMENDED' ? $scope.reservationData.company.id : null,
					travel_agent_id: $scope.stateCheck.activeView == 'RECOMMENDED' ? $scope.reservationData.travelAgent.id : null,
					group_id: $scope.reservationData.group.id || $scope.reservationData.allotment.id,
					promotion_code: $scope.stateCheck.activeView == 'RECOMMENDED' ? $scope.reservationData.searchPromoCode : null,
					promotion_id: $scope.stateCheck.activeView == 'RECOMMENDED' ? $scope.reservationData.promotionId : null,
					override_restrictions: $scope.stateCheck.showClosedRates,
					adults: occupancies[0] ? occupancies[0].adults : 1,
					children: occupancies[0] ? occupancies[0].children : '',
					include_expired_promotions: !!$scope.reservationData.promotionId && $scope.stateCheck.showClosedRates,
					per_page: $scope.stateCheck.pagination.rate.roomsList.perPage,
					page: page,
					is_member: $scope.stateCheck.activeView === 'RECOMMENDED' ? !!$scope.reservationData.member.isSelected || $stateParams.is_member : "",
					is_zero_night: $scope.stateCheck.activeView === 'RECOMMENDED' && $scope.reservationData.numNights === 0
				};

				if ($scope.stateCheck.stayDatesMode) {
					var dayOccupancy = ROOMS[$scope.stateCheck.roomDetails.firstIndex].stayDates[$scope.stateCheck.dateModeActiveDate].guests;

					payLoad['restrictions_on_date'] = $scope.stateCheck.dateModeActiveDate;
					payLoad.adults = dayOccupancy.adults;
					payLoad.children = dayOccupancy.children;
					if ($scope.stateCheck.rateSelected.oneDay) {
						payLoad.room_type_id = $scope.stateCheck.preferredType;
						payLoad.per_page = 1;
						payLoad.page = page;
					}
				}

				if ($scope.stateCheck.activeView === "RATE") {
					payLoad.order = "LOW_TO_HIGH";
				} else if ($scope.stateCheck.activeView === "ROOM_TYPE") {
					payLoad.order = "ROOM_LEVEL";
				}

				if (!!$scope.stateCheck.preferredType) {
					payLoad['room_type_id'] = $scope.stateCheck.preferredType;
				}
				// if (forRate) {
				// 	//To fix issue when clicks on each rate in recommended or rate tab - issue only for custom group
				// 	//No need to pass these values along with rate id
				// 	//CICO-30723
				if (forRate) {
					if (typeof forRate !== "string") {
						payLoad['rate_id'] = forRate;
					}
				}
				if ($scope.stateCheck.stayDatesMode && $scope.reservationData.numNights > 1 && $scope.reservationData.currentSelectedRateCurrencyId !== "") {
					payLoad.rate_currency_id = $scope.reservationData.currentSelectedRateCurrencyId;
				}

				// }

				$scope.callAPI(RVRoomRatesSrv.fetchRoomTypeADRs, {
					params: payLoad,
					successCallBack: cb
				});
			},

			/**
    * Updates rate details from service.
    */
			updateReservationDataRateMeta = function updateReservationDataRateMeta() {
				_.each(RVReservationBaseSearchSrv.rateDetailsList, function (rate) {
					$scope.reservationData.ratesMeta[rate.details.id] = rate.details;
				});
			},
			    fetchRoomTypesList = function fetchRoomTypesList(append) {
				if (!append) {
					$scope.stateCheck.pagination.roomType.page = 1;
				}
				var occupancies = _.pluck(ROOMS[$scope.stateCheck.roomDetails.firstIndex].stayDates, 'guests');

				if (occupancies.length > 1) {
					// No need to send last day's occupancy to the rate's API
					occupancies.splice(-1, 1);
				}

				var payLoad = {
					from_date: ARRIVAL_DATE,
					to_date: DEPARTURE_DATE,
					// CICO-28657 Removed all params - company id, grp id, tr ag id, etc
					group_id: $scope.reservationData.group.id || $scope.reservationData.allotment.id,
					override_restrictions: $scope.stateCheck.showClosedRates,
					adults: occupancies[0] ? occupancies[0].adults : 1,
					children: occupancies[0] ? occupancies[0].children : '',
					include_expired_promotions: !!$scope.reservationData.promotionId && $scope.stateCheck.showClosedRates,
					per_page: $scope.stateCheck.pagination.roomType.perPage,
					page: $scope.stateCheck.pagination.roomType.page,
					is_member: !!$scope.reservationData.member.isSelected
				},
				    isRoomDetailsInvalidated = TABS[0].room_id === null;

				if ($scope.stateCheck.isFromNightlyDiary && !isRoomDetailsInvalidated) {
					payLoad.room_type_id = $stateParams.room_type_id;
				}

				if ($scope.stateCheck.stayDatesMode) {
					var dayOccupancy = ROOMS[$scope.stateCheck.roomDetails.firstIndex].stayDates[$scope.stateCheck.dateModeActiveDate].guests;

					payLoad['restrictions_on_date'] = $scope.stateCheck.dateModeActiveDate;
					payLoad.adults = dayOccupancy.adults;
					payLoad.children = dayOccupancy.children;
					if ($scope.stateCheck.rateSelected.oneDay) {
						payLoad.room_type_id = $scope.stateCheck.preferredType;
						payLoad.per_page = 1;
						payLoad.page = 1;
					}
				}

				if (!!$scope.stateCheck.preferredType) {
					payLoad['room_type_id'] = $scope.stateCheck.preferredType;
				}

				if ($scope.stateCheck.activeView === "ROOM_TYPE") {
					payLoad.order = "ROOM_LEVEL";
				}

				if ($scope.stateCheck.stayDatesMode && $scope.reservationData.numNights > 1 && $scope.reservationData.currentSelectedRateCurrencyId !== "") {
					payLoad.rate_currency_id = $scope.reservationData.currentSelectedRateCurrencyId;
				}

				$scope.invokeApi(RVRoomRatesSrv.fetchRoomTypeADRs, payLoad, function (response) {
					if (append) {
						$scope.stateCheck.baseInfo.roomTypes = $scope.stateCheck.baseInfo.roomTypes.concat(response.results);
					} else {
						$scope.stateCheck.baseInfo.totalCount = response.total_count;
						$scope.stateCheck.baseInfo.roomTypes = response.results;
					}

					generateRoomTypeGrid();
					$scope.stateCheck.showLessRooms = false;
					$scope.$emit('hideLoader');
				});
			},
			    updateMetaInfoWithCustomRates = function updateMetaInfoWithCustomRates() {
				var customRate;

				if (!!$scope.reservationData.group.id) {
					customRate = RVReservationStateService.getCustomRateModel($scope.reservationData.group.id, $scope.reservationData.group.name, 'GROUP');
					if (!!ratesMeta.customRates.custom_group_taxes) {
						customRate.taxes = ratesMeta.customRates.custom_group_taxes;
					}
					$scope.reservationData.ratesMeta[customRate.id] = customRate;
				}

				if (!!$scope.reservationData.allotment.id) {
					customRate = RVReservationStateService.getCustomRateModel($scope.reservationData.allotment.id, $scope.reservationData.allotment.name, 'ALLOTMENT');
					$scope.reservationData.ratesMeta[customRate.id] = customRate;
				}
			},
			    fetchRatesList = function fetchRatesList(roomTypeId, rateId, page, cb) {
				var occupancies = _.pluck(ROOMS[$scope.stateCheck.roomDetails.firstIndex].stayDates, 'guests');

				// CICO-59948 - For in-house reservation, we should the rates corresponding to the current room type
				if ($scope.reservationData.inHouse || $scope.stateCheck.isFromNightlyDiary) {
					roomTypeId = $stateParams.room_type_id;
				}

				var payLoad = {
					page: page,
					from_date: ARRIVAL_DATE,
					to_date: DEPARTURE_DATE,
					room_type_id: roomTypeId,
					rate_id: rateId,
					override_restrictions: $scope.stateCheck.showClosedRates,
					adults: occupancies[0] ? occupancies[0].adults : 1,
					children: occupancies[0] ? occupancies[0].children : '',
					include_expired_promotions: !!$scope.reservationData.promotionId && $scope.stateCheck.showClosedRates
				};

				if ($scope.stateCheck.stayDatesMode) {
					var dayOccupancy = ROOMS[$scope.stateCheck.roomDetails.firstIndex].stayDates[$scope.stateCheck.dateModeActiveDate].guests;

					payLoad['restrictions_on_date'] = $scope.stateCheck.dateModeActiveDate;
					payLoad.adults = dayOccupancy.adults;
					payLoad.children = dayOccupancy.children;
				}

				if ($scope.stateCheck.activeView === 'ROOM_TYPE') {
					payLoad.per_page = $scope.stateCheck.pagination.roomType.ratesList.perPage;
				} else {
					payLoad.per_page = $scope.stateCheck.pagination.rate.perPage;
					payLoad.order = "RATE";
					if (!!$scope.stateCheck.preferredType && !roomTypeId) {
						payLoad.room_type_id = $scope.stateCheck.preferredType;
					}
				}
				// Add these params to API - only in Reccommended tab. CICO-28657
				if ($scope.stateCheck.activeView === 'RECOMMENDED') {

					payLoad.company_id = $scope.reservationData.company.id;
					payLoad.travel_agent_id = $scope.reservationData.travelAgent.id;
					payLoad.group_id = $scope.reservationData.group.id || $scope.reservationData.allotment.id;
					payLoad.promotion_code = $stateParams.promotion_code;
					payLoad.is_member = !!$scope.reservationData.member.isSelected || $stateParams.is_member;
					payLoad.promotion_id = $scope.reservationData.promotionId;
					payLoad.is_zero_night = $scope.reservationData.numNights === 0;
				}
				payLoad.is_promotion_selected = $scope.reservationData.promotionId ? true : false;
				if ($scope.stateCheck.stayDatesMode && $scope.reservationData.numNights > 1 && $scope.reservationData.currentSelectedRateCurrencyId !== "") {
					payLoad.rate_currency_id = $scope.reservationData.currentSelectedRateCurrencyId;
				}

				if (ROOMS && ROOMS.length && ROOMS[0].stayDates && ROOMS[0].stayDates[ARRIVAL_DATE] && ROOMS[0].stayDates[ARRIVAL_DATE].rate && ROOMS[0].stayDates[ARRIVAL_DATE].rate.id) {
					payLoad.arrivalDateRateId = ROOMS[0].stayDates[ARRIVAL_DATE].rate.id;
				}

				$scope.callAPI(RVRoomRatesSrv.fetchRateADRs, {
					params: payLoad,
					successCallBack: cb
				});
			},
			    generateRoomTypeGrid = function generateRoomTypeGrid() {
				updateReservationDataRateMeta();
				$scope.display.roomFirstGrid = [];

				if (!$scope.stateCheck.preferredType) {
					$scope.stateCheck.selectedRoomType = -1;
				}

				_.each($scope.stateCheck.baseInfo.roomTypes, function (roomType) {
					// var proccesedRestrictions = processRestrictions(roomType.first_restriction, roomType.multiple_restrictions, roomType.rate_id),
					// 	datesInitial = RVReservationDataService.getDatesModel(ARRIVAL_DATE, DEPARTURE_DATE);
					var proccesedRestrictions = processRestrictions(roomType.multiple_restrictions, roomType.rate_id),
					    datesInitial = RVReservationDataService.getDatesModel(ARRIVAL_DATE, DEPARTURE_DATE);

					if (!$scope.reservationData.ratesMeta[roomType.rate_id]) {
						// -- Note: This should optimally come inside this condition only if a group/allotment is added in the Room & Rates screen. Else this would have been done in initialization itself.
						updateMetaInfoWithCustomRates();
					}

					var isGroupRate = $scope.stateCheck.activeView == 'RECOMMENDED' && $scope.reservationData.group.id ? !!$scope.reservationData.group.id : false;
					var isSuppressed = $scope.stateCheck.activeView == 'RECOMMENDED' && $scope.reservationData.ratesMeta[roomType.rate_id].is_suppress_rate_on ? !!$scope.reservationData.ratesMeta[roomType.rate_id].is_suppress_rate_on : false;
					var isMember = $scope.stateCheck.activeView == 'RECOMMENDED' && $scope.reservationData.member.isSelected && $scope.reservationData.ratesMeta[roomType.rate_id].is_member ? !!$scope.reservationData.member.isSelected && $scope.reservationData.ratesMeta[roomType.rate_id].is_member : false;
					var isPromotion = $scope.stateCheck.activeView == 'RECOMMENDED' && !proccesedRestrictions.isPromoInvalid && _.indexOf($scope.reservationData.ratesMeta[roomType.rate_id].linked_promotion_ids, $scope.reservationData.code.id) > -1 ? !proccesedRestrictions.isPromoInvalid && _.indexOf($scope.reservationData.ratesMeta[roomType.rate_id].linked_promotion_ids, $scope.reservationData.code.id) > -1 : false;

					_.each(roomType.restrictions, function (restrictionObject) {
						var restrictionKey = restrictionObject.restriction_type_id;

						restrictionObject.restrictionBgClass = "bg-" + getRestrictionClass(ratesMeta.restrictions[restrictionKey].key);
						//  restrictionObject.restrictionBgColor = getRestrictionClass(ratesMeta.restrictions[restrictionKey].key);
						restrictionObject.restrictionIcon = getRestrictionIcon(ratesMeta.restrictions[restrictionKey].key);
					});
					var restrictionsLength = typeof roomType.restrictions !== "undefined" ? roomType.restrictions.length : 0;
					var roomTypeInfo = {
						isCollapsed: $scope.stateCheck.selectedRoomType != roomType.id,
						name: $scope.reservationData.roomsMeta[roomType.id].name,
						id: roomType.id,
						rateCurrency: roomType.rate_currency,
						ratesArray: [],
						restriction: roomType.restrictions,
						availability: roomType.availability,
						isSuiteUnavailable: $scope.reservationData.roomsMeta[roomType.id].is_suite && (roomType.availability <= 0 || roomType.availability < $scope.reservationData.rooms.length)
					},

					// Assigning 'restriction' to new param 'bestAvailableRateRestrictions' - since issue when colapse each room type
					// CICO-29156

					rateInfo = {
						id: roomType.rate_id,
						name: $scope.reservationData.ratesMeta[roomType.rate_id].name,
						rateCurrency: roomType.rate_currency,
						rateCurrencyId: roomType.rate_currency_id,
						adr: roomType.adr,
						dates: angular.copy(datesInitial),
						bestAvailableRateRestrictions: roomType.restrictions,
						numRestrictions: restrictionsLength,
						forRoomType: roomType.id,
						buttonClass: getBookButtonStyle(restrictionsLength, roomType.rate_id, roomType.availability),
						showDays: false,
						totalAmount: 0.0,
						isGroupRate: isGroupRate,
						isSuppressed: isSuppressed,
						isMember: isMember,
						isPromotion: isPromotion
					},
					    rates = {};

					roomTypeInfo.ratesArray.push(rateInfo);
					_.extend(roomTypeInfo.ratesArray[0].dates[$scope.reservationData.arrivalDate], {
						availability: roomType.availability
					});
					roomTypeInfo.defaultRate = roomTypeInfo.ratesArray[0];
					$scope.display.roomFirstGrid.push(roomTypeInfo);
				});
				$scope.refreshScroll();
			},
			    generateRatesGrid = function generateRatesGrid(ratesSet, append) {
				updateReservationDataRateMeta();
				if (!append) {
					$scope.display.rateFirstGrid = [];
				}
				_.each(ratesSet, function (rate) {
					// CICO-28657 - SHOW these rates only in Recommended tab
					var isGroupRate = $scope.stateCheck.activeView == 'RECOMMENDED' && $scope.reservationData.group.id,
					    isAllotmentRate = $scope.stateCheck.activeView == 'RECOMMENDED' && $scope.reservationData.allotment.id,
					    isCorporate = false,
					    isSuppressed = rate.id && $scope.reservationData.ratesMeta[rate.id].is_suppress_rate_on,
					    isMember = false,
					    isPromotion = false;

					if (rate.id && $scope.stateCheck.activeView == 'RECOMMENDED') {
						isCorporate = !!rate.contract_name;
						isMember = $scope.reservationData.member.isSelected && $scope.reservationData.ratesMeta[rate.id].is_member ? !!$scope.reservationData.member.isSelected && $scope.reservationData.ratesMeta[rate.id].is_member : false;
						isPromotion = _.indexOf($scope.reservationData.ratesMeta[rate.id].linked_promotion_ids, $scope.reservationData.code.id) > -1 ? _.indexOf($scope.reservationData.ratesMeta[rate.id].linked_promotion_ids, $scope.reservationData.code.id) > -1 : false;
					}

					_.each(rate.restrictions, function (restrictionObject) {
						var restrictionKey = restrictionObject.restriction_type_id;

						restrictionObject.restrictionBgClass = "bg-" + getRestrictionClass(ratesMeta.restrictions[restrictionKey].key);
						// restrictionObject.restrictionBgColor = getRestrictionClass(ratesMeta.restrictions[restrictionKey].key);
						restrictionObject.restrictionIcon = getRestrictionIcon(ratesMeta.restrictions[restrictionKey].key);
					});

					var proccesedRestrictions = processRestrictions(rate.multiple_restrictions, rate.id),
					    rateInfo = {
						isCollapsed: true,
						name: rate.id ? $scope.reservationData.ratesMeta[rate.id].name : "Custom Rate for " + $scope.reservationData.group.name,
						id: rate.id,
						rateCurrency: rate.rate_currency,
						rateCurrencyId: rate.rate_currency_id,
						defaultRoomTypeId: rate.room_type_id,
						defaultRoomTypeAvailability: rate.availability,
						defaultADR: rate.adr,
						contractName: isCorporate ? rate.contract_name : '',
						contractId: isCorporate ? rate.contract_id : '',
						rooms: [],
						restriction: rate.restrictions,
						hasRoomsList: false,
						buttonClass: getBookButtonStyle(proccesedRestrictions.restrictionCount || 0, rate.id, rate.availability),
						isGroupRate: isGroupRate,
						isAllotmentRate: isAllotmentRate,
						isCorporate: isCorporate,
						isSuppressed: isSuppressed,
						isMember: isMember,
						isPromotion: isPromotion,
						isDefaultRoomTypeSuiteUnavailable: $scope.reservationData.roomsMeta[rate.room_type_id].is_suite && (rate.availability <= 0 || rate.availability < $scope.reservationData.rooms.length),
						isDayUse: $scope.reservationData.ratesMeta[rate.id].is_day_use
					};

					rateInfo.rooms.push({
						id: rate.room_type_id,
						name: $scope.reservationData.roomsMeta[rate.room_type_id].name,
						availability: rate.availability,
						forRate: rate.id
					});
					$scope.display.rateFirstGrid.push(rateInfo);
				});
				$scope.refreshScroll();
			},
			    goToAddonsView = function goToAddonsView() {

				$state.go('rover.reservation.staycard.mainCard.addons', {
					'from_date': ARRIVAL_DATE,
					'to_date': DEPARTURE_DATE,
					'rate_id': $scope.stateCheck.selectedStayDate.rate.id
				});
			},
			    enhanceStay = function enhanceStay() {
				// CICO-9429: Show Addon step only if its been set ON in admin
				var navigate = function navigate() {
					if ($scope.reservationData.guest.id || $scope.reservationData.company.id || $scope.reservationData.travelAgent.id || $scope.reservationData.group.id) {
						if ($rootScope.isAddonOn && areReservationAddonsAvailable && ($rootScope.hotelDiaryConfig.mode !== 'FULL' || !$scope.stateCheck.isFromNightlyDiary)) {
							goToAddonsView();
						} else {

							$state.go('rover.reservation.staycard.mainCard.summaryAndConfirm');
						}
					}
				};

				if ($rootScope.isAddonOn && areReservationAddonsAvailable && ($rootScope.hotelDiaryConfig.mode !== 'FULL' || !$scope.stateCheck.isFromNightlyDiary)) {
					// CICO-16874
					goToAddonsView();
				} else {
					var allRatesSelected = _.reduce(_.pluck(ROOMS, 'rateId'), function (a, b) {
						return !!a && !!b;
					});

					if (allRatesSelected) {
						if (!$scope.reservationData.guest.id && !$scope.reservationData.company.id && !$scope.reservationData.travelAgent.id && !$scope.reservationData.group.id) {
							$scope.$emit('PROMPTCARD');
							$scope.$watch('reservationData.guest.id', navigate);
							$scope.$watch('reservationData.company.id', navigate);
							$scope.$watch('reservationData.travelAgent.id', navigate);
						} else {
							navigate();
						}
					} else {
						var roomIndexWithoutRate = _.findIndex(ROOMS, {
							rateId: ''
						});
						var tabIndexWithoutRate = _.findIndex(TABS, {
							roomTypeId: ROOMS[roomIndexWithoutRate].roomTypeId
						});

						$scope.changeActiveRoomType(tabIndexWithoutRate || 0);
					}
				}
			},

			// Fix for CICO-9536
			// Expected Result: Only one single room type can be applied to a reservation.
			// However, the user should be able to change the room type for the first night on the Stay Dates screen,
			// while the reservation is not yet checked in. The control should be disabled for any subsequent nights.
			resetRates = function resetRates() {
				var roomIndex = $scope.stateCheck.roomDetails.firstIndex;

				for (; roomIndex <= $scope.stateCheck.roomDetails.lastIndex; roomIndex++) {
					_.each(ROOMS[roomIndex].stayDates, function (stayDate, idx) {
						stayDate.rate.id = '';
						stayDate.rate.name = '';
					});
				}
				$scope.stateCheck.rateSelected.allDays = false;
				// reset value, else rate selection will get bypassed
				// check $scope.handleBooking method
				$scope.stateCheck.rateSelected.oneDay = false;
				$scope.stateCheck.stayDates = angular.copy(ROOMS[$scope.stateCheck.roomDetails.firstIndex].stayDates);
			},
			    navigateOut = function navigateOut() {
				if ($scope.viewState.identifier !== 'REINSTATE' && ($stateParams.fromState === 'rover.reservation.staycard.reservationcard.reservationdetails' || $stateParams.fromState === 'STAY_CARD')) {

					if ($stateParams.isGroupDetachmentRequested) {
						$rootScope.$broadcast('DETACH_GROUP_FROM_RESERVATION');
					} else {
						saveAndGotoStayCard();
					}
				} else {

					enhanceStay();
				}
			},
			    initScrollers = function initScrollers() {
				$scope.setScroller('room_types', {
					preventDefault: false,
					probeType: 3
				});
				$scope.setScroller('stayDates', {
					scrollX: true,
					scrollY: false
				});
				$timeout(function () {
					getScrollerObject('room_types').on('scroll', function () {
						var sc = $scope.stateCheck,
						    roomsCount = $scope.display.roomFirstGrid.length,
						    ratesCount = $scope.display.rateFirstGrid.length;

						if (this.y < scrollPosition - 10 && Math.abs(this.y - this.maxScrollY) < Math.abs(this.maxScrollY / 4)) {
							if (!sc.showLessRooms && sc.activeView === 'ROOM_TYPE' && sc.baseInfo.totalCount > roomsCount) {
								sc.pagination.roomType.page++;
								fetchRoomTypesList(true); // The param tells the method to append the response to the existing list
							} else if (sc.activeView === 'RATE' && sc.baseInfo.maxAvblRates > ratesCount) {
								sc.pagination.rate.page++;
								fetchRatesList(null, null, sc.pagination.rate.page, function (response) {
									$scope.stateCheck.baseInfo.maxAvblRates = response.total_count;
									generateRatesGrid(response.results, true);
									$scope.refreshScroll();
								});
							} else if (sc.activeView === 'RECOMMENDED' && sc.baseInfo.maxAvblRates > ratesCount) {
								sc.pagination.rate.page++;
								fetchRatesList(null, null, sc.pagination.rate.page, function (response) {
									$scope.stateCheck.baseInfo.maxAvblRates = response.total_count;
									generateRatesGrid(response.results, true);
									$scope.refreshScroll();
								});
							}
						}
						scrollPosition = this.y;
					});
				}, 3000);
			},
			    setBackButton = function setBackButton() {
				// CICO-20270: to force selection of a rate after removing a card with contracted rate.
				if ($stateParams.disable_back_staycard) {
					return;
				}

				// smart switch btw edit reservation flow and create reservation flow
				if ($scope.stateCheck.isFromNightlyDiary) {
					$rootScope.setPrevState = {
						title: 'ROOM DIARY',
						name: 'rover.nightlyDiary'
					};
				} else if (!!$state.params && $state.params.isFromChangeStayDates) {
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
			},
			    updateSupressedRatesFlag = function updateSupressedRatesFlag() {
				var roomIndex = $scope.stateCheck.roomDetails.firstIndex;

				for (; roomIndex <= $scope.stateCheck.roomDetails.lastIndex; roomIndex++) {
					$scope.reservationData.rooms[roomIndex].isSuppressed = false;
					_.each($scope.reservationData.rooms[roomIndex].stayDates, function (d, i) {
						// Find if any of the selected rates is suppressed
						var currentRateSuppressed = !!d.rate.id && $scope.reservationData.ratesMeta[d.rate.id] && !!$scope.reservationData.ratesMeta[d.rate.id].is_suppress_rate_on;

						if (typeof $scope.reservationData.rooms[roomIndex].isSuppressed === 'undefined') {
							$scope.reservationData.rooms[roomIndex].isSuppressed = currentRateSuppressed;
						} else {
							$scope.reservationData.rooms[roomIndex].isSuppressed = $scope.reservationData.rooms[roomIndex].isSuppressed || currentRateSuppressed;
						}
					});
				}
			},
			    updateRateMetaOnLoad = function updateRateMetaOnLoad() {
				var rateList = [],
				    params = {};

				// params.isForceRefresh = true;
				_.each(rates.results, function (rate) {
					rateList.push(rate.rate_id ? rate.rate_id : rate.id);
				});
				params.rate_ids = rateList;
				params.is_zero_night = $scope.reservationData.numNights === 0;
				RVReservationBaseSearchSrv.fetchRatesDetails(params).then(function () {
					$scope.reservationData.ratesMeta = {};
					initialize();
				});
			},
			    initialize = function initialize() {
				$scope.heading = 'Rooms & Rates';
				$scope.setHeadingTitle($scope.heading);

				$scope.activeRoom = $scope.viewState.currentTab;
				$scope.stateCheck.preferredType = TABS[$scope.activeRoom].roomTypeId;

				$scope.stateCheck.roomDetails = getCurrentRoomDetails();

				if (RVReservationDataService.isVaryingRates(ROOMS[$scope.stateCheck.roomDetails.firstIndex].stayDates, ARRIVAL_DATE, DEPARTURE_DATE, $scope.reservationData.numNights) || RVReservationDataService.isVaryingOccupancy(ROOMS[$scope.stateCheck.roomDetails.firstIndex].stayDates, ARRIVAL_DATE, DEPARTURE_DATE, $scope.reservationData.numNights)) {
					if ($stateParams.fromState === "rover.reservation.staycard.reservationcard.reservationdetails") {
						$scope.reservationData.currentSelectedRateCurrencyId = $stateParams.selectedCurrencyId;
					}
				}
				// --
				if (!$scope.stateCheck.dateModeActiveDate) {
					var stayDates = ROOMS[$scope.stateCheck.roomDetails.firstIndex].stayDates;
					// --

					if ($scope.reservationData.midStay) {
						// checking if midstay and handling the expiry condition
						if (new tzIndependentDate(DEPARTURE_DATE) > new tzIndependentDate($rootScope.businessDate)) {
							$scope.stateCheck.dateModeActiveDate = $rootScope.businessDate;
							$scope.stateCheck.selectedStayDate = stayDates[$rootScope.businessDate];
						} else {
							$scope.stateCheck.dateModeActiveDate = ARRIVAL_DATE;
							$scope.stateCheck.selectedStayDate = stayDates[ARRIVAL_DATE];
						}
					} else {
						$scope.stateCheck.dateModeActiveDate = ARRIVAL_DATE;
						$scope.stateCheck.selectedStayDate = stayDates[ARRIVAL_DATE];
					}
				}

				updateMetaInfoWithCustomRates();

				$scope.stateCheck.stayDates = angular.copy(ROOMS[$scope.stateCheck.roomDetails.firstIndex].stayDates);

				_.each($scope.stateCheck.stayDates, function (dayInfo) {
					dayInfo.amount = dayInfo.rateDetails && dayInfo.rateDetails.modified_amount || null;
					dayInfo.rateCurrency = dayInfo.rateDetails && (dayInfo.rateDetails.rateCurrency || dayInfo.rateDetails.rate_currency);
				});

				if (RVReservationDataService.isVaryingRates(ROOMS[$scope.stateCheck.roomDetails.firstIndex].stayDates, ARRIVAL_DATE, DEPARTURE_DATE, $scope.reservationData.numNights) || RVReservationDataService.isVaryingOccupancy(ROOMS[$scope.stateCheck.roomDetails.firstIndex].stayDates, ARRIVAL_DATE, DEPARTURE_DATE, $scope.reservationData.numNights)) {
					$scope.stateCheck.stayDatesMode = true;
					$scope.stateCheck.rateSelected.allDays = isRateSelected().allDays;
					$scope.stateCheck.rateSelected.oneDay = isRateSelected().oneDay;
				}

				setDefaultViewByHotelSettings();
				if ($stateParams.travel_agent_id || $stateParams.company_id || $stateParams.group_id || $stateParams.allotment_id || $stateParams.is_member || $stateParams.promotion_id) {
					$scope.stateCheck.activeView = 'RECOMMENDED';
				}
				if ($scope.reservationData.numNights === 0) {
					$scope.stateCheck.activeView = 'RECOMMENDED';
					$scope.setActiveView('RECOMMENDED');
				} else if ($scope.stateCheck.isFromNightlyDiary) {
					$scope.stateCheck.activeView = 'ROOM_TYPE';
					$scope.setActiveView('ROOM_TYPE');
				}

				if (!!$scope.reservationData.code && !!$scope.reservationData.code.id) {
					$scope.stateCheck.promotionValidity = evaluatePromotion();
				}

				setBackButton();

				if ($scope.stateCheck.activeView === 'ROOM_TYPE') {
					$scope.stateCheck.baseInfo.roomTypes = rates.results;
					generateRoomTypeGrid();
				} else if ($scope.stateCheck.activeView === 'RATE' || $scope.stateCheck.activeView === 'RECOMMENDED' && shouldRecommend()) {
					$scope.stateCheck.baseInfo.rates = rates.results;
					generateRatesGrid($scope.stateCheck.baseInfo.rates);
				}
				// --
				initScrollers();
				initEventListeners();
				// --
			},

			/**
    * [findExhaustedRateAddons description]
    * @param  {[type]} roomId [description]
    * @param  {[type]} rateId [description]
    * @return {[type]}        [description]
    */
			findExhaustedRateAddons = function findExhaustedRateAddons(roomId, rateId) {
				var exhaustedRateAddons = [],
				    updateExhaustedAddonsList = function updateExhaustedAddonsList(addon) {
					// Need to see the applicable count based on the amount_type
					var applicableCount = RVReservationStateService.getApplicableAddonsCount(addon.amountType, addon.postType, parseInt(addon.postFrequency, 10), parseInt(TABS[$scope.viewState.currentTab].numAdults, 10), parseInt(TABS[$scope.viewState.currentTab].numChildren, 10), parseInt($scope.reservationData.numNights, 10)) * parseInt(TABS[$scope.viewState.currentTab].roomCount, 10);

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
				},
				    dayLoop = function dayLoop(forDate) {
					if (forDate === ARRIVAL_DATE || forDate !== DEPARTURE_DATE) {
						var associatedAddons = RVReservationStateService.fetchAssociatedAddons(rateId);

						_.each(associatedAddons, function (addon) {
							var inventoryForDay = _.findWhere(addon.inventory, {
								date: forDate
							});

							updateExhaustedAddonsList({
								name: addon.name,
								postType: addon.post_type.value,
								amountType: addon.amount_type.value,
								postFrequency: addon.post_type.frequency,
								id: addon.id,
								inventory: inventoryForDay && _.isNumber(inventoryForDay.available_count) ? inventoryForDay.available_count : null
							});
						});
					}
				};

				if (!$scope.stateCheck.stayDatesMode) {
					// Not in stay dates mode
					_.each($scope.reservationData.stayDays, function (day) {
						dayLoop(day.date);
					});
				} else {
					// In stay dates mode
					dayLoop($scope.stateCheck.dateModeActiveDate);
				}

				return exhaustedRateAddons;
			},
			    alertAddonOverbooking = function alertAddonOverbooking(close) {
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
			},

			/**
    * [fetchTaxRateAddonMeta description]
    * @param  {Function} callback [description]
    * @return {[type]}            [description]
    */
			fetchTaxRateAddonMeta = function fetchTaxRateAddonMeta(rateId, callback) {
				if (!callback) {
					callback = function callback() {
						console.log('No call back for tax and rate addon meta fetching');
					};
				}

				$scope.invokeApi(RVReservationBaseSearchSrv.fetchTaxRateAddonMeta, {
					from_date: ARRIVAL_DATE,
					to_date: DEPARTURE_DATE,
					rate_id: rateId
				}, function (response) {
					$scope.stateCheck.taxInfo = true;
					RVReservationStateService.metaData.taxDetails = angular.copy(response.taxInfo);
					RVReservationStateService.updateRateAddonsMeta(response.rateAddons);
					callback();
					$scope.$emit('hideLoader');
				});
			},
			    haveAddonsChanged = function haveAddonsChanged(entireSet, associatedAddons) {
				// TODO: Clear this up... fromState should have only the name of this state
				if ($stateParams.fromState === 'rover.reservation.staycard.reservationcard.reservationdetails' || $stateParams.fromState === 'STAY_CARD') {
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
			},
			    transferState = function transferState() {
				updateSupressedRatesFlag();
				// Set flag for suppressed rates
				$scope.reservationData.isRoomRateSuppressed = _.reduce(_.pluck(ROOMS, 'isSuppressed'), function (a, b) {
					return a || b;
				});
				// Check if there has been a rateChange
				if (!!RVReservationStateService.bookMark.lastPostedRate) {
					// Identify if there are extra addons added other than those of the associated rate's
					var firstRoom = ROOMS[0],
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

				navigateOut();
			},
			    populateStayDates = function populateStayDates(stayDetails, rateId, roomIndex, roomTypeId, contractId) {
				var businessDate = tzIndependentDate($rootScope.businessDate);

				_.each(ROOMS[roomIndex].stayDates, function (details, date) {
					if (tzIndependentDate(date) >= businessDate) {
						details.rate.id = rateId;
						var dayInfo = stayDetails[date],
						    calculatedAmount = dayInfo && dayInfo.rate || stayDetails[ARRIVAL_DATE].rate,
						    rateCurrency = dayInfo && dayInfo.rate_currency || stayDetails[ARRIVAL_DATE].rate_currency;

						calculatedAmount = Number(parseFloat(calculatedAmount).toFixed(2));
						details.rateDetails = {
							actual_amount: calculatedAmount,
							modified_amount: calculatedAmount,
							rate_currency: rateCurrency
						};

						if (rateId) {
							details.rateDetails.is_discount_allowed = $scope.reservationData.ratesMeta[rateId].is_discount_allowed_on === null ? 'false' : $scope.reservationData.ratesMeta[rateId].is_discount_allowed_on.toString(); // API returns true / false as a string ... Hence true in a string to maintain consistency
							details.rateDetails.is_suppressed = $scope.reservationData.ratesMeta[rateId].is_suppress_rate_on === null ? 'false' : $scope.reservationData.ratesMeta[rateId].is_suppress_rate_on.toString();
						}
						// CICO-59948 Updating the selected room type for the stay dates from business date onwards
						details.roomTypeId = roomTypeId;
						details.contractId = contractId;
					}
				});
			},
			    saveAndGotoStayCard = function saveAndGotoStayCard() {
				var staycardDetails = {
					title: $filter('translate')('STAY_CARD'),
					name: 'rover.reservation.staycard.reservationcard.reservationdetails',
					param: {
						confirmationId: $scope.reservationData.confirmNum,
						id: $scope.reservationData.reservationId,
						isrefresh: true,
						isGroupDetachmentRequested: $stateParams.isGroupDetachmentRequested
					}
				};

				if ($scope.borrowForGroups) {
					RVReservationStateService.setReservationFlag('borrowForGroups', true);
				}
				$scope.saveReservation(staycardDetails.name, staycardDetails.param);
			},
			    getBookButtonStyle = function getBookButtonStyle(numRestrictions, rateId, roomsCount) {

				var isRoomAvailable = roomsCount !== undefined && roomsCount > 0;

				// CICO-71977 - Book button should display in red when there is no availability for the group reservation
				if (rateId && numRestrictions > 0 && !isRoomAvailable || !!$scope.reservationData.group.id && !isRoomAvailable) {
					return 'red';
				}

				if (!$scope.stateCheck.stayDatesMode) {
					if (numRestrictions > 0 || !isRoomAvailable) {
						return 'brand-colors';
					} else {
						return 'green';
					}
				} else {
					// Staydates mode
					if (numRestrictions > 0 || !isRoomAvailable) {
						return 'white brand-text';
					} else {
						return 'white green-text';
					}
				}
			},
			    // reset Page
			reInitialize = function reInitialize(tabClicked) {
				$scope.stateCheck.roomDetails = getCurrentRoomDetails();

				$scope.stateCheck.pagination.roomType.page = 1;
				$scope.stateCheck.pagination.rate.page = 1;

				if ($scope.stateCheck.activeView === "RATE" || $scope.stateCheck.activeView === "RECOMMENDED") {
					$scope.stateCheck.rateFilterText = "";
					var isRateApiRequired = false;

					if ($scope.stateCheck.activeView === "RATE") {
						isRateApiRequired = true;
					} else if ($scope.stateCheck.activeView === "RECOMMENDED") {
						if (shouldRecommend()) {
							isRateApiRequired = true;
						} else {
							if (!tabClicked) {
								setDefaultViewByHotelSettings();
							}
						}
					}
					if (isRateApiRequired) {
						fetchRatesList(null, null, $scope.stateCheck.pagination.rate.page, function (response) {
							$scope.stateCheck.baseInfo.maxAvblRates = response.total_count;
							generateRatesGrid(response.results);
							$scope.refreshScroll();
						});
					} else {
						//  if the activeView has changed under shouldRecommend()
						if ($scope.stateCheck.activeView === "ROOM_TYPE") {
							fetchRoomTypesList();
						} else {
							generateRatesGrid([]);
						}
					}
				} else if ($scope.stateCheck.activeView === "ROOM_TYPE") {
					fetchRoomTypesList();
				}
				scrollTop();
			};

			// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// --- ***************************
			// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// --- PUBLIC METHODS
			// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// --- ***************************

			$scope.refreshScroll = function () {
				$timeout(function () {
					$scope.refreshScroller('room_types');
					$scope.$parent && $scope.$parent.myScroll['room_types'] && $scope.$parent.myScroll['room_types'].refresh();
				}, 700);
			};

			var scrollTop = function scrollTop() {
				$scope.$parent && $scope.$parent.myScroll['room_types'] && $scope.$parent.myScroll['room_types'].scrollTo(0, 0);
			};

			// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// --- PERMISSIONS

			$scope.restrictIfOverbook = function (roomId, rateId, availability) {
				var canOverbookHouse = rvPermissionSrv.getPermissionValue('OVERBOOK_HOUSE'),
				    canOverbookRoomType = rvPermissionSrv.getPermissionValue('OVERBOOK_ROOM_TYPE'),
				    groupHouseBorrowPermission = rvPermissionSrv.getPermissionValue('GROUP_HOUSE_BORROW'),
				    roomCount = parseInt(TABS[$scope.viewState.currentTab].roomCount);

				if (typeof availability === 'undefined') {
					throw new Error("availability cannot be undefined here");
				}

				if (!!$scope.reservationData.allotment.id) {
					// CICO-26707 Skip house avbl check for group/allotment reservations
					canOverbookHouse = true;
					// CICO-24923 TEMPORARY : Dont let overbooking of Groups from Room and Rates
					if (availability < roomCount) {
						return true;
					}
					// CICO-24923 TEMPORARY
				}

				if (!!$scope.reservationData.group.id) {

					if (availability >= roomCount || availability < roomCount && groupHouseBorrowPermission) {
						return false;
					}
					return true;
				}

				// CICO-53368 : If there is no Room Type Permission & availability <= 0, ie OverBooking - hide BOOK button.
				if (availability < roomCount && !canOverbookRoomType) {
					return true;
				}

				if (canOverbookHouse && canOverbookRoomType) {
					// CICO-17948
					// check actual hotel availability with permissions
					return false;
				}

				if (!canOverbookHouse && $scope.getLeastHouseAvailability() < ROOMS.length) {
					return true;
				}

				// Default
				return false;
			};

			// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// --- RESTRICTIONS
			$scope.toggleClosedRates = function () {
				$scope.stateCheck.showClosedRates = !$scope.stateCheck.showClosedRates;
				// reset Page
				$scope.stateCheck.pagination.roomType.page = 1;
				$scope.stateCheck.pagination.rate.page = 1;

				if ($scope.stateCheck.activeView === "RATE" || $scope.stateCheck.activeView === "RECOMMENDED" && shouldRecommend()) {
					// Reset search
					$scope.stateCheck.rateFilterText = "";
					fetchRatesList(null, null, $scope.stateCheck.pagination.rate.page, function (response) {
						$scope.stateCheck.baseInfo.maxAvblRates = response.total_count;
						generateRatesGrid(response.results);
						$scope.refreshScroll();
					});
				} else if ($scope.stateCheck.activeView === "ROOM_TYPE") {
					fetchRoomTypesList();
				}
			};

			// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// --- STAY DATES MODE
			$scope.toggleStayDaysMode = function () {

				$scope.stateCheck.stayDatesMode = !$scope.stateCheck.stayDatesMode;

				if (!$scope.stateCheck.stayDatesMode) {
					$scope.reservationData.currentSelectedRateCurrencyId = "";
				}

				// see if the done button has to be enabled
				if ($scope.stateCheck.stayDatesMode) {
					$scope.stateCheck.rateSelected.allDays = isRateSelected().allDays;
					$scope.stateCheck.rateSelected.oneDay = isRateSelected().oneDay;
				} else {
					// CICO-44156 - Reset selected rates when the show   stay dates option is set to off
					$scope.stateCheck.preferredType = "";
					$scope.stateCheck.dateModeActiveDate = ARRIVAL_DATE;
					// CICO-59948 For inhouse reservation, set the preffered room type as the curret room type
					if ($scope.reservationData.inHouse) {
						$scope.stateCheck.preferredType = $stateParams.room_type_id;
					}
					resetRates();
				}

				$scope.refreshScroll();

				$timeout(function () {
					$scope.refreshScroller('stayDates');
				}, 150);

				reInitialize();
			};

			$scope.showStayDateDetails = function (selectedDate) {
				// by pass departure stay date from stay dates manipulation
				// Disable the past dates on the stay dates grid, so that it can'be updated
				if (selectedDate === DEPARTURE_DATE || selectedDate.shouldDisable) {
					return false;
				}
				$scope.stateCheck.dateModeActiveDate = selectedDate;
				$scope.stateCheck.selectedStayDate = ROOMS[$scope.stateCheck.roomDetails.firstIndex].stayDates[selectedDate];
				var stayDateIndex = Object.keys(ROOMS[$scope.stateCheck.roomDetails.firstIndex].stayDates).indexOf(selectedDate);

				if (stayDateIndex > 0) {
					if ($scope.stateCheck.stayDatesMode && $scope.reservationData.rateCurrencyId !== null && $scope.reservationData.rateCurrencyId !== '') {
						$scope.reservationData.currentSelectedRateCurrencyId = $scope.reservationData.rateCurrencyId;
					}
				}
				reInitialize();
			};

			$scope.toggleEditGuestOptions = function () {
				$scope.stateCheck.guestOptionsIsEditable = !$scope.stateCheck.guestOptionsIsEditable;
			};

			$scope.updateDayOccupancy = function (occupants) {
				ROOMS[$scope.stateCheck.roomDetails.firstIndex].stayDates[$scope.stateCheck.dateModeActiveDate].guests[occupants] = parseInt($scope.stateCheck.selectedStayDate.guests[occupants]);
				/**
     * CICO-8504
     * In case of multiple rates selected, the side bar and the reservation summary need to showcase the first date's occupancy!
     *
     */
				if (ARRIVAL_DATE === $scope.stateCheck.dateModeActiveDate) {
					var occupancy = ROOMS[$scope.stateCheck.roomDetails.firstIndex].stayDates[$scope.stateCheck.dateModeActiveDate].guests,
					    roomIndex = $scope.stateCheck.roomDetails.firstIndex;

					for (; roomIndex <= $scope.stateCheck.roomDetails.lastIndex; roomIndex++) {
						ROOMS[roomIndex].numAdults = occupancy.adults;
						ROOMS[roomIndex].numChildren = occupancy.children;
						ROOMS[roomIndex].numInfants = occupancy.infants;
					}
				}

				if (!$scope.checkOccupancyLimit($scope.stateCheck.dateModeActiveDate)) {
					$scope.preferredType = '';
					// TODO : Reset other stuff as well
					$scope.stateCheck.rateSelected.oneDay = false;
					$scope.stateCheck.rateSelected.allDays = false;
					var roomIndex = $scope.stateCheck.roomDetails.firstIndex;

					for (; roomIndex <= $scope.stateCheck.roomDetails.lastIndex; roomIndex++) {
						_.each(ROOMS[roomIndex].stayDates, function (stayDate) {
							stayDate.rate = {
								id: ''
							};
						});
					}
				}
				fetchRoomTypesList();
			};

			$scope.setActiveView = function (view) {
				$scope.stateCheck.activeView = view;
				RVRoomRatesSrv.setRoomAndRateActiveTab(view);
				reInitialize(true);
			};

			// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// --- COMPUTE TAX AND DAY BREAKUP
			/* This is method is shared betweent the views */
			var computeDetails = function computeDetails(secondary, cb) {
				// secondary may either be a room or a rate within which the dates is updated
				RVSelectRoomRateSrv.houseAvailability = $scope.stateCheck.house;
				RVSelectRoomRateSrv.isGroupReservation = !!$scope.reservationData.group.id || !!$scope.reservationData.allotment.id;

				var occupancies = _.pluck(ROOMS[$scope.stateCheck.roomDetails.firstIndex].stayDates, 'guests'),
				    payLoad = {
					from_date: ARRIVAL_DATE,
					to_date: DEPARTURE_DATE,
					group_id: $scope.reservationData.group.id || $scope.reservationData.allotment.id,
					promotion_id: $scope.reservationData.promotionId,
					is_rate_for_dep_date_allowed: secondary.is_rate_for_dep_date_allowed || null,
					include_expired_promotions: !!$scope.reservationData.promotionId && $scope.stateCheck.showClosedRates,
					adults: occupancies[0] ? occupancies[0].adults : 1,
					children: occupancies[0] ? occupancies[0].children : ''
				};

				if ($scope.stateCheck.activeView === 'RATE' || $scope.stateCheck.activeView === 'RECOMMENDED') {
					payLoad.room_type_id = secondary.id;
					payLoad.rate_id = secondary.forRate;
				} else if ($scope.stateCheck.activeView === 'ROOM_TYPE') {
					payLoad.rate_id = secondary.id;
					payLoad.room_type_id = secondary.forRoomType;
				}

				if ($scope.reservationData.code && // ------------------------------------------------------------------- Place INVALID PROMO to be set IFF
				$scope.reservationData.code.id && // ---------------------------------------------------------------- a) A promotion has been entered [AND]
				!_.reduce($scope.stateCheck.promotionValidity, function (a, b) {
					// ---------------------------------  b) The entered promo has expired [AND]
					return a && b;
				}) && _.indexOf($scope.reservationData.ratesMeta[payLoad.rate_id].linked_promotion_ids, $scope.reservationData.code.id) > -1) {
					// ------  c) rate is linked to the promo
					RVSelectRoomRateSrv.promotionValidity = $scope.stateCheck.promotionValidity;
				} else {
					RVSelectRoomRateSrv.promotionValidity = null; // ---------------------------------------------------  ELSE set this as NULL
				}

				if (!secondary.dates) {
					secondary.dates = angular.copy(RVReservationDataService.getDatesModel(ARRIVAL_DATE, DEPARTURE_DATE));
				}

				if ($scope.stateCheck.stayDatesMode) {
					var dayOccupancy = ROOMS[$scope.stateCheck.roomDetails.firstIndex].stayDates[$scope.stateCheck.dateModeActiveDate].guests;

					payLoad['restrictions_on_date'] = $scope.stateCheck.dateModeActiveDate;
					payLoad.adults = dayOccupancy.adults;
					payLoad.children = dayOccupancy.children;
					if ($scope.stateCheck.rateSelected.oneDay) {
						payLoad.room_type_id = $scope.stateCheck.preferredType;
					}
				}
				// CICO-65314 - Group id is not required while fetching the rate details from the rates tab upons chosing a rate
				if ($scope.stateCheck.activeView === 'RATE') {
					delete payLoad.group_id;
				}

				$scope.invokeApi(RVSelectRoomRateSrv.getRateDetails, payLoad, function (rateDetails) {
					$scope.$emit('hideLoader');
					angular.forEach(rateDetails.dates, function (item) {
						item.rate_currency = secondary.rateCurrency;
					});

					secondary.dates = rateDetails.dates;
					secondary.total = rateDetails.total_room_cost;
					secondary.stayTaxExcl = rateDetails.excl_stay_tax;
					secondary.stayTaxIncl = rateDetails.incl_stay_tax;
					secondary.restrictions = rateDetails.summary;
					secondary.is_rate_for_dep_date_allowed = null;
					cb && cb();
					$scope.refreshScroll();
				}, function (errorMessage) {
					$scope.$emit('hideLoader');
					$scope.errorMessage = errorMessage;
				});
			};

			/* This method is shared by both the views*/
			$scope.viewRateBreakUp = function (secondary, updateOnly) {
				// secondary can either be a Room or a Rate based on the primary view selected
				var toggle = function toggle() {
					secondary.showDays = !secondary.showDays;
					$scope.refreshScroll();
				};

				if (updateOnly) {
					computeDetails(secondary);
					return;
				}

				// NOTE: Total is computed and added to the secondary object ONLY on the first expansion
				if (!secondary.showDays && !secondary.total) {
					fetchTaxRateAddonMeta(secondary.forRate || secondary.id, function () {
						computeDetails(secondary, toggle);
					});
				} else {
					$timeout(toggle, 300);
				}
			};

			// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// --- BOOKING

			$scope.handleNoEdit = function (event, roomId, rateId) {
				$scope.reservationData.totalStayCost = 0;
				event.stopPropagation();
				ROOMS[$scope.stateCheck.roomDetails.firstIndex].rateName = $scope.reservationData.ratesMeta[rateId].name;
				$scope.reservationData.rateDetails[$scope.activeRoom] = angular.copy(ROOMS[$scope.stateCheck.roomDetails.firstIndex].stayDates);
				if (!$scope.stateCheck.stayDatesMode) {
					navigateOut();
				}
			};

			$scope.handleDaysBooking = function (event) {
				event.stopPropagation();
				if (!$scope.stateCheck.rateSelected.allDays) {
					// if the dates are not all set with rates
					return false;
				} else {
					// Handle multiple rates selected
					var isGroupReservation = !!$scope.reservationData.group.id || !!$scope.reservationData.allotment.id,
					    firstIndexOfRoomType = $scope.stateCheck.roomDetails.firstIndex,
					    roomIndex,
					    lastFetchedGroup;

					if (isGroupReservation) {
						lastFetchedGroup = angular.copy(rvGroupConfigurationSrv.lastFetchedGroup);
					}

					for (roomIndex = $scope.stateCheck.roomDetails.firstIndex; roomIndex <= $scope.stateCheck.roomDetails.lastIndex; roomIndex++) {
						if (RVReservationDataService.isVaryingRates(ROOMS[firstIndexOfRoomType].stayDates, ARRIVAL_DATE, DEPARTURE_DATE, $scope.reservationData.numNights)) {
							ROOMS[roomIndex].rateName = 'Multiple Rates Selected';
						} else {
							ROOMS[roomIndex].rateName = $scope.reservationData.ratesMeta[ROOMS[firstIndexOfRoomType].stayDates[ARRIVAL_DATE].rate.id].name;
						}

						var firstRateMetaData = $scope.reservationData.ratesMeta[ROOMS[firstIndexOfRoomType].stayDates[ARRIVAL_DATE].rate.id];

						if (isGroupReservation) {

							if (lastFetchedGroup.id === $scope.reservationData.group.id && $scope.viewState.identifier === "CREATION") {
								// In case of a group reservation; copy the group's demographics to the reservation
								var groupDemographics = lastFetchedGroup.demographics;

								ROOMS[roomIndex].demographics.market = groupDemographics.market_segment_id === null ? '' : groupDemographics.market_segment_id;
								ROOMS[roomIndex].demographics.source = groupDemographics.source_id === null ? '' : groupDemographics.source_id;
								ROOMS[roomIndex].demographics.origin = groupDemographics.booking_origin_id === null ? '' : groupDemographics.booking_origin_id;
								ROOMS[roomIndex].demographics.reservationType = groupDemographics.reservation_type_id === null ? '' : groupDemographics.reservation_type_id;
								ROOMS[roomIndex].demographics.segment = groupDemographics.segment_id === null ? '' : groupDemographics.segment_id;

								if (roomIndex === 0) {
									$scope.reservationData.demographics = angular.copy(ROOMS[roomIndex].demographics);
								}
							}
						} else {

							ROOMS[roomIndex].demographics.market = firstRateMetaData.market_segment_id === null ? '' : firstRateMetaData.market_segment_id;
							ROOMS[roomIndex].demographics.source = firstRateMetaData.source_id === null ? '' : firstRateMetaData.source_id;
							ROOMS[roomIndex].demographics.origin = firstRateMetaData.booking_origin_id === null ? '' : firstRateMetaData.booking_origin_id;

							if (roomIndex === 0) {
								$scope.reservationData.demographics.source = ROOMS[roomIndex].demographics.source;
								$scope.reservationData.demographics.market = ROOMS[roomIndex].demographics.market;
								$scope.reservationData.demographics.origin = ROOMS[roomIndex].demographics.origin;
							}
						}

						$scope.reservationData.rateDetails[roomIndex] = angular.copy(ROOMS[$scope.stateCheck.roomDetails.firstIndex].stayDates);

						if ($stateParams.fromState === 'rover.reservation.staycard.reservationcard.reservationdetails' || $stateParams.fromState === 'STAY_CARD') {
							_.each(ROOMS[roomIndex].stayDates, function (details, date) {
								var rateId = ROOMS[roomIndex].stayDates[date].rate.id,
								    roomId = ROOMS[roomIndex].roomTypeId;

								details.rate.id = rateId;

								if (rateId) {
									var curRate = $scope.reservationData.ratesMeta[rateId];

									details.rate.name = curRate && curRate.name;
									var rateAmount = Number(parseFloat($scope.stateCheck.stayDates[date].amount).toFixed(2));

									details.rateDetails = {
										actual_amount: rateAmount,
										modified_amount: rateAmount,
										rateCurrency: details.rateCurrency
									};

									details.rateDetails.is_discount_allowed = curRate && curRate.is_discount_allowed_on === null ? 'false' : curRate && curRate.is_discount_allowed_on.toString(); // API returns true / false as a string ... Hence true in a string to maintain consistency
									details.rateDetails.is_suppressed = curRate && curRate.is_suppress_rate_on === null ? 'false' : curRate && curRate.is_suppress_rate_on.toString();
								}
							});
						}
					}
					transferState();
				}
			};

			/* This method is shared between the RATE and ROOM TYPE views */
			$scope.handleBooking = function (roomId, rateId, event, flags, afterFetch, contractId, selectedCurrency) {
				$scope.reservationData.totalStayCost = 0;
				if (!!event) {
					event.stopPropagation();
				}

				var secondary, roomInfo, rateInfo;

				if ($scope.stateCheck.activeView === 'ROOM_TYPE') {
					var roomType = _.find($scope.display.roomFirstGrid, {
						id: roomId
					});

					secondary = _.find(roomType.ratesArray, {
						id: rateId
					});
					secondary.rateCurrency = selectedCurrency;
					roomInfo = roomType;
					rateInfo = secondary;
				} else if ($scope.stateCheck.activeView === 'RATE' || $scope.stateCheck.activeView === 'RECOMMENDED') {
					var rate = _.find($scope.display.rateFirstGrid, {
						id: rateId,
						contractId: contractId || ''
					});

					secondary = _.find(rate.rooms, {
						id: roomId
					});
					secondary.rateCurrency = selectedCurrency;
					roomInfo = secondary;
					rateInfo = rate;
				}

				if (flags === 'INCLUDE_DEP_DATE') {
					secondary.is_rate_for_dep_date_allowed = true;
				} else {
					secondary.is_rate_for_dep_date_allowed = null;
				}

				$scope.reservationData.rateCurrency = selectedCurrency;
				$scope.reservationData.rateCurrencyId = rateInfo.rateCurrencyId;
				if ($scope.stateCheck.stayDatesMode && $scope.reservationData.numNights > 1) {
					$scope.reservationData.currentSelectedRateCurrencyId = rateInfo.rateCurrencyId;
				}

				// CICO-44842 - Plugging in the max occupancy check while booking from room & rates screen
				$scope.checkOccupancyLimit(null, null, null, roomId);

				// Load Meta Data on the first call to this method if it hasn't been loaded yet
				if (!afterFetch) {
					fetchTaxRateAddonMeta(rateId, function () {
						computeDetails(secondary, function () {
							$scope.handleBooking(roomId, rateId, event, flags, true, contractId, selectedCurrency);
						});
					});
				} else {

					$scope.stateCheck.preferredType = parseInt($scope.stateCheck.preferredType, 10) || '';

					/**
      * Get a list of exhausted addons for the selected rate and id
      */

					$scope.stateCheck.exhaustedAddons = [];
					// Check for add onthing
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

					if ($scope.stateCheck.stayDatesMode) {
						// Handle StayDatesMode
						// Disable room type change if stay date mode is true
						if ($scope.stateCheck.preferredType > 0 && roomId !== $scope.stateCheck.preferredType) {
							return false;
						}

						var activeDate = $scope.stateCheck.dateModeActiveDate,
						    roomIndex,
						    currentRoom;

						if (!$scope.stateCheck.rateSelected.oneDay) {
							/**
        * The first selected day must be taken as the preferredType
        * No more selection of rooms must be allowed here
        */
							$scope.stateCheck.preferredType = parseInt(roomId);
							// Put the selected room as the tab's room type
							TABS[$scope.activeRoom].roomTypeId = $scope.stateCheck.preferredType;

							for (roomIndex = $scope.stateCheck.roomDetails.firstIndex; roomIndex <= $scope.stateCheck.roomDetails.lastIndex; roomIndex++) {
								currentRoom = ROOMS[roomIndex];
								currentRoom.roomTypeId = roomId;
								currentRoom.rateId = [];
								currentRoom.rateId.push(rateId);
								currentRoom.stayDates[$scope.stateCheck.dateModeActiveDate].rate.id = rateId;
								currentRoom.stayDates[$scope.stateCheck.dateModeActiveDate].contractId = contractId;
								currentRoom.roomTypeName = $scope.reservationData.roomsMeta[roomId].name;
								$scope.reservationData.rateDetails[i] = angular.copy(ROOMS[$scope.stateCheck.roomDetails.firstIndex].stayDates);
							}
						}

						$scope.stateCheck.selectedStayDate.rate.id = rateId;

						$scope.stateCheck.selectedStayDate.roomType = {
							id: roomId
						};
						$scope.stateCheck.selectedStayDate.contractId = contractId;

						var amount = secondary.dates[activeDate].rate,
						    rateAmount = Number(parseFloat(amount).toFixed(2));

						$scope.stateCheck.stayDates[$scope.stateCheck.dateModeActiveDate].amount = rateAmount;
						$scope.stateCheck.stayDates[$scope.stateCheck.dateModeActiveDate].rateCurrency = rateInfo.rateCurrency;
						for (roomIndex = $scope.stateCheck.roomDetails.firstIndex; roomIndex <= $scope.stateCheck.roomDetails.lastIndex; roomIndex++) {
							currentRoom = ROOMS[roomIndex];
							currentRoom.stayDates[activeDate].rateCurrency = rateInfo.rateCurrency;
							currentRoom.stayDates[activeDate].contractId = rateInfo.contractId;
							currentRoom.stayDates[activeDate].rateDetails = {
								actual_amount: rateAmount,
								modified_amount: rateAmount,
								rate_currency: rateInfo.rateCurrency,
								is_discount_allowed: $scope.reservationData.ratesMeta[rateId].is_discount_allowed_on === null ? 'false' : $scope.reservationData.ratesMeta[rateId].is_discount_allowed_on.toString(), // API returns true / false as a string ... Hence true in a string to maintain consistency
								is_suppressed: $scope.reservationData.ratesMeta[rateId].is_suppress_rate_on === null ? 'false' : $scope.reservationData.ratesMeta[rateId].is_suppress_rate_on.toString()
							};
							currentRoom.stayDates[activeDate].rate.id = rateId;

							if (!currentRoom.rateId) {
								currentRoom.rateId = [];
							}
							currentRoom.rateId.push(rateId);
						}

						// see if the done button has to be enabled
						$scope.stateCheck.rateSelected.allDays = isRateSelected().allDays;
						$scope.stateCheck.rateSelected.oneDay = isRateSelected().oneDay;
					} else {
						var isGroupReservation = !!$scope.reservationData.group.id || !!$scope.reservationData.allotment.id,
						    i,
						    lastFetchedGroup,
						    lastFetchedAllotment;

						if (!!$scope.reservationData.group.id) {
							lastFetchedGroup = angular.copy(rvGroupConfigurationSrv.lastFetchedGroup);
						} else if (!!$scope.reservationData.allotment.id) {
							lastFetchedAllotment = angular.copy(rvAllotmentConfigurationSrv.lastFetchedAllotment);
						}

						if (!TABS[$scope.activeRoom].roomTypeId || parseInt(TABS[$scope.activeRoom].roomTypeId) !== parseInt(roomId)) {
							TABS[$scope.activeRoom].roomTypeId = parseInt(roomId);
						}

						for (i = $scope.stateCheck.roomDetails.firstIndex; i <= $scope.stateCheck.roomDetails.lastIndex; i++) {

							_.extend(ROOMS[i], {
								roomTypeId: parseInt(roomId),
								roomTypeName: roomInfo.name,
								rateId: rateId,
								isSuppressed: rateInfo.isSuppressed,
								rateName: rateInfo.name,
								rateAvg: rateInfo.adr,
								rateTotal: rateInfo.totalAmount
							});

							populateStayDates(secondary.dates, rateId, i, roomId, rateInfo.contractId);

							$scope.reservationData.rateDetails[i] = angular.copy(ROOMS[$scope.stateCheck.roomDetails.firstIndex].stayDates);

							if (isGroupReservation) {
								var demographics;

								if (!!$scope.reservationData.group.id && lastFetchedGroup.id === $scope.reservationData.group.id && $scope.viewState.identifier === "CREATION") {
									// In case of a group reservation; copy the group's demographics to the reservation
									demographics = lastFetchedGroup.demographics;
								} else if (!!$scope.reservationData.allotment.id && lastFetchedAllotment.id === $scope.reservationData.allotment.id && $scope.viewState.identifier === "CREATION") {
									demographics = lastFetchedAllotment.demographics;
								}

								if (!!demographics) {
									ROOMS[i].demographics.market = demographics.market_segment_id === null ? '' : demographics.market_segment_id;
									ROOMS[i].demographics.source = demographics.source_id === null ? '' : demographics.source_id;
									ROOMS[i].demographics.origin = demographics.booking_origin_id === null ? '' : demographics.booking_origin_id;
									ROOMS[i].demographics.reservationType = demographics.reservation_type_id === null ? '' : demographics.reservation_type_id;
									ROOMS[i].demographics.segment = demographics.segment_id === null ? '' : demographics.segment_id;

									if (i === 0) {
										$scope.reservationData.demographics = angular.copy(ROOMS[i].demographics);
									}
								}
							} else {
								ROOMS[i].demographics.market = $scope.reservationData.ratesMeta[rateId].market_segment_id === null ? '' : $scope.reservationData.ratesMeta[rateId].market_segment_id;
								ROOMS[i].demographics.source = $scope.reservationData.ratesMeta[rateId].source_id === null ? '' : $scope.reservationData.ratesMeta[rateId].source_id;
								ROOMS[i].demographics.origin = $scope.reservationData.ratesMeta[rateId].booking_origin_id === null ? '' : $scope.reservationData.ratesMeta[rateId].booking_origin_id;

								if (i === 0) {
									$scope.reservationData.demographics.source = ROOMS[i].demographics.source;
									$scope.reservationData.demographics.market = ROOMS[i].demographics.market;
									$scope.reservationData.demographics.origin = ROOMS[i].demographics.origin;
								}
							}
						}

						// IFF Overbooking Alert is configured to be shown
						// NOTE: The overbooking house alert is not to be shown for group reservations. CICO-24923

						if ($scope.otherData.showOverbookingAlert && !isGroupReservation) {

							var leastHouseAvailability = $scope.getLeastHouseAvailability(),
							    leastRoomTypeAvailability = $scope.getLeastAvailability(roomId, rateId),
							    numberOfRooms = TABS[$scope.activeRoom].roomCount;

							if (leastHouseAvailability < 1 || leastRoomTypeAvailability < numberOfRooms) {
								// Show appropriate Popup Here
								$scope.invokeApi(RVReservationBaseSearchSrv.checkOverbooking, {
									from_date: ARRIVAL_DATE,
									to_date: DEPARTURE_DATE,
									group_id: $scope.reservationData.group.id || $scope.reservationData.allotment.id
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
				}
			};

			// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// --- ADDONS & OVERBOOKING

			$scope.isBookingRestricted = function (restriction) {
				return restriction && restriction.length > 0 && !rvPermissionSrv.getPermissionValue('BOOK_RESTRICTED_ROOM_RATE');
			};

			$scope.selectAddon = function () {
				alertAddonOverbooking(true);
			};

			$scope.onResetAddonsAcknowledged = function () {
				navigateOut();
				$scope.closeDialog();
			};

			$scope.alertOverbooking = function (close) {
				var timer = 0;

				if (close) {
					$scope.closeDialog();
					timer = 1000;
				}
				$timeout(transferState, timer);
			};

			$scope.getLeastAvailability = function (roomId, rateId) {
				var secondary;
				var availabilityCount = 0;

				if ($scope.stateCheck.activeView === 'ROOM_TYPE') {
					var roomType = _.find($scope.display.roomFirstGrid, {
						id: roomId
					});

					secondary = _.find(roomType.ratesArray, {
						id: rateId
					});
					availabilityCount = roomType && roomType.availability || 0;
				} else if ($scope.stateCheck.activeView === 'RATE' || $scope.stateCheck.activeView === 'RECOMMENDED') {

					var rate = _.find($scope.display.rateFirstGrid, {
						id: rateId
					});

					secondary = _.find(rate.rooms, {
						id: roomId
					});
					availabilityCount = secondary && secondary.availability || 0;
				}

				return availabilityCount;
			};

			$scope.getLeastHouseAvailability = function () {
				var nights = $scope.reservationData.numNights || 1;

				return _.min(_.first(_.toArray($scope.stateCheck.house), nights));
			};

			// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// --- ROOMTYPE TAB
			$scope.showAllRooms = function () {
				$scope.stateCheck.showLessRooms = false;
				$scope.refreshScroll();
				$scope.stateCheck.pagination.roomType.page = 1;
				fetchRoomTypesList();
			};

			$scope.isRoomTypeSelected = function (roomTypeId) {
				var chosen = false;

				_.each(TABS, function (tabData, index) {
					if (parseInt(tabData.roomTypeId, 10) === roomTypeId && $scope.activeRoom != index) {
						chosen = true;
					}
				});
				return chosen;
			};

			// CICO-61893 : showValidationPopup
			var showValidationPopup = function showValidationPopup() {
				ngDialog.open({
					template: '/assets/partials/reservation/alerts/reseravtionFromDiaryValidation.html',
					scope: $scope,
					className: '',
					closeByDocument: false,
					closeByEscape: false
				});
			},
			    setRoomDetailsForDiaryFlow = function setRoomDetailsForDiaryFlow() {
				TABS[0].room_id = $stateParams.selectedRoomId;
				ROOMS[0].room_id = $stateParams.selectedRoomId;

				TABS[0].roomTypeId = $stateParams.room_type_id;
				ROOMS[0].roomTypeId = $stateParams.room_type_id;

				TABS[0].roomName = $stateParams.selectedRoomNo;
				ROOMS[0].roomName = $stateParams.selectedRoomNo;
			},

			// CICO-61893 : Reset the room details if the user changes the room type.
			resetRoomDetailsIfInvalid = function resetRoomDetailsIfInvalid() {
				TABS[0].room_id = null;
				ROOMS[0].room_id = null;
				TABS[0].roomName = null;
				ROOMS[0].roomName = null;
				TABS[0].roomTypeId = null;
				ROOMS[0].roomTypeId = null;
			};

			// Init data for chackin flow if coming via Nightly Diary
			if ($scope.stateCheck.isFromNightlyDiary) {
				setRoomDetailsForDiaryFlow();
			}
			$scope.onRoomTypeChange = function ($event) {
				var tabIndex = $scope.viewState.currentTab,
				    roomType = parseInt($scope.stateCheck.preferredType, 10) || '',
				    roomIndex;

				var roomTypeChanged = roomType !== $scope.stateCheck.roomTypeIdFromNightlyDiary,
				    isRoomDetailsInvalidated = TABS[0].room_id === null;

				if ($scope.stateCheck.isFromNightlyDiary && roomTypeChanged && !isRoomTypeChangePopupShown && !isRoomDetailsInvalidated) {
					$scope.validationMsg = 'Room number will be unassigned by changing the room type';
					isRoomTypeChangePopupShown = true;
					resetRoomDetailsIfInvalid();
					showValidationPopup();
				}

				TABS[tabIndex].roomTypeId = roomType;

				for (roomIndex = $scope.stateCheck.roomDetails.firstIndex; roomIndex <= $scope.stateCheck.roomDetails.lastIndex; roomIndex++) {
					ROOMS[roomIndex].roomTypeId = roomType;
				}
				$scope.stateCheck.pagination.roomType.page = 1;
				fetchRoomTypesList();
				resetRates();
			};

			var processRestrictions = function processRestrictions(hasMultipleRestrictions, rateId) {

				var restrictionCount = 0,
				    isPromoInvalid = $scope.reservationData.code && $scope.reservationData.code.id && !_.reduce($scope.stateCheck.promotionValidity, function (a, b) {
					return a && b;
				});

				return {
					isPromoInvalid: isPromoInvalid
				};
			};
			var previousPage = 0; // CICO-47537

			$scope.showRoomsList = function (rate, append) {
				if (!rate.isCollapsed && !append) {
					rate.isCollapsed = true;
				} else {
					var pageToFetch;

					if (!rate.hasRoomsList || !append) {
						rate.rooms = [];
						pageToFetch = 1;
					} else {
						if ($scope.stateCheck.stayDatesMode) {
							pageToFetch = previousPage + 1;
						} else {
							pageToFetch = rate.rooms.length / $scope.stateCheck.pagination.rate.roomsList.perPage + 1;
						}
					}
					previousPage = pageToFetch;
					getRoomsADR(function (response) {
						rate.totalRoomsCount = response.total_count;
						rate.hasRoomsList = true;
						_.each(response.results, function (room) {
							_.each(room.restrictions, function (restrictionObject) {
								var restrictionKey = restrictionObject.restriction_type_id;

								restrictionObject.restrictionBgClass = "bg-" + getRestrictionClass(ratesMeta.restrictions[restrictionKey].key);
								// restrictionObject.restrictionBgColor = getRestrictionClass(ratesMeta.restrictions[restrictionKey].key);
								restrictionObject.restrictionIcon = getRestrictionIcon(ratesMeta.restrictions[restrictionKey].key);
							});

							var proccesedRestrictions = processRestrictions(room.multiple_restrictions, rate.id),
							    roomInfo = {
								id: room.id,
								name: $scope.reservationData.roomsMeta[room.id].name,
								availability: room.availability,
								showDays: false,
								adr: room.adr,
								rateCurrency: room.rate_currency,
								forRate: rate.id,
								numRestrictions: proccesedRestrictions.restrictionCount || 0,
								restriction: room.restrictions,
								buttonClass: getBookButtonStyle(proccesedRestrictions.restrictionCount || 0, rate.id, room.availability),
								isSuiteUnavailable: $scope.reservationData.roomsMeta[room.id].is_suite && (room.availability <= 0 || room.availability < $scope.reservationData.rooms.length)
							};

							rate.rooms.push(roomInfo);
							$timeout(function () {
								if (!append) {
									rate.isCollapsed = false;
								} // else keep it open just refresh the scroll
								$scope.refreshScroll();
							}, 100);
						});
					}, rate.id, pageToFetch);
				}
			};

			$scope.showRatesList = function (room, showMoreRates) {
				if ($scope.borrowForGroups) {
					return;
				}

				var toggle = function toggle() {
					room.isCollapsed = !room.isCollapsed;
					$scope.refreshScroll();
				};
				// Only one best available rate for a room type
				// CICO-29156
				var bestAvailableRateOfSelectedRoom = room.ratesArray[0].id;

				if (!room.totalRatesCount || showMoreRates) {
					// Need to get the rates list before making it visible
					var pageToFetch = 1;

					if (showMoreRates) {
						pageToFetch = room.ratesArray.length / $scope.stateCheck.pagination.roomType.ratesList.perPage + 1;
					}
					fetchRatesList(room.id, null, pageToFetch, function (response) {
						var datesInitial = RVReservationDataService.getDatesModel(ARRIVAL_DATE, DEPARTURE_DATE);

						updateReservationDataRateMeta();
						room.totalRatesCount = response.total_count;

						if (!showMoreRates) {
							room.ratesArray = [];
						}
						_.each(response.results, function (rate) {

							if (!$scope.reservationData.ratesMeta[rate.id]) {
								// -- Note: This should optimally come inside this condition only if a group/allotment is added in the Room & Rates screen. Else this would have been done in initialization itself.
								updateMetaInfoWithCustomRates();
							}
							_.each(rate.restrictions, function (restrictionObject) {
								var restrictionKey = restrictionObject.restriction_type_id;

								restrictionObject.restrictionBgClass = "bg-" + getRestrictionClass(ratesMeta.restrictions[restrictionKey].key);
								// restrictionObject.restrictionBgColor = getRestrictionClass(ratesMeta.restrictions[restrictionKey].key);
								restrictionObject.restrictionIcon = getRestrictionIcon(ratesMeta.restrictions[restrictionKey].key);
							});

							proccesedRestrictions = processRestrictions(rate.multiple_restrictions, rate.id);
							var isGroupRate = $scope.stateCheck.activeView == 'RECOMMENDED' && $scope.reservationData.group.id ? !!$scope.reservationData.group.id : false;
							var isAllotmentRate = $scope.stateCheck.activeView == 'RECOMMENDED' && $scope.reservationData.allotment.id ? !!$scope.reservationData.allotment.id : false;
							var isCorporate = $scope.stateCheck.activeView == 'RECOMMENDED' && rate.contract_name ? !!rate.contract_name : false;
							var isMember = $scope.stateCheck.activeView == 'RECOMMENDED' && $scope.reservationData.member.isSelected && $scope.reservationData.ratesMeta[rate.id].is_member ? !!$scope.reservationData.member.isSelected && $scope.reservationData.ratesMeta[rate.id].is_member : false;
							var isPromotion = $scope.stateCheck.activeView == 'RECOMMENDED' && !proccesedRestrictions.isPromoInvalid && _.indexOf($scope.reservationData.ratesMeta[rate.id].linked_promotion_ids, $scope.reservationData.code.id) > -1 ? !proccesedRestrictions.isPromoInvalid && _.indexOf($scope.reservationData.ratesMeta[rate.id].linked_promotion_ids, $scope.reservationData.code.id) > -1 : false;

							var restrictionsLength = typeof rate.restrictions !== "undefined" ? rate.restrictions.length : 0;

							var rateInfo = {
								id: rate.id,
								name: $scope.reservationData.ratesMeta[rate.id].name,
								adr: rate.adr,
								rateCurrency: rate.rate_currency,
								rateCurrencyId: rate.rate_currency_id,
								dates: angular.copy(datesInitial),
								totalAmount: 0.0,
								restriction: rate.restrictions,
								numRestrictions: restrictionsLength,
								forRoomType: rate.room_type_id,
								buttonClass: getBookButtonStyle(proccesedRestrictions.restrictionCount || 0, rate.id, room.availability),
								showDays: false,
								isGroupRate: isGroupRate,
								isAllotmentRate: isAllotmentRate,
								isCorporate: isCorporate,
								isSuppressed: $scope.reservationData.ratesMeta[rate.id].is_suppress_rate_on,
								isMember: isMember,
								isPromotion: isPromotion,
								isSuiteUnavailable: room.isSuiteUnavailable,
								isDayUse: $scope.reservationData.ratesMeta[rate.id].is_day_use
							};

							if (bestAvailableRateOfSelectedRoom === rate.id) {
								rateInfo.bestAvailableRateRestrictions = rate.restrictions;
							}

							_.extend(rateInfo.dates[$scope.reservationData.arrivalDate], {
								availability: rate.availability
							});
							room.ratesArray.push(rateInfo);
						});
					});
					room.defaultRate = room.ratesArray[0];

					if (!showMoreRates) {
						$timeout(toggle, 300);
					}

					$scope.refreshScroll();
				} else {
					toggle();
				}
			};

			// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// --- RATE TAB
			// /


			$scope.rateAutoCompleteOptions = {
				delay: 500,
				minLength: 0,
				position: {
					my: "left top",
					at: "left bottom",
					of: "input#find-rates",
					collision: 'fit'
				},
				source: function source(request, response) {
					var payLoad = {
						query: request.term
					};

					$scope.callAPI(RVReservationBaseSearchSrv.searchForRates, {
						params: payLoad,
						successCallBack: function successCallBack(data) {
							var results = [];

							_.each(data.results, function (rate) {
								results.push({
									label: rate.name,
									value: rate.name,
									id: rate.id
								});
							});
							response(results);
						}
					});
				},
				select: function select(event, ui) {

					// Reset Pagination
					$scope.stateCheck.pagination.rate.page = 1;
					// Populate with the selected
					fetchRatesList(null, ui.item.id, 1, function (response) {
						generateRatesGrid(response.results);
						$scope.refreshScroll();
					});
				}
			};

			$scope.changeSelectedRoom = function (rate) {
				rate.selectedRoom = _.find(rate.rooms, {
					id: parseInt(rate.selectedRoomId, 10)
				});

				if (!!rate.showDays) {
					$scope.viewRateBreakUp(rate, true);
				}
			};

			$scope.selectRate = function (selectedRate) {
				$scope.stateCheck.rateFilterText = selectedRate.name;
				// Reset Pagination
				$scope.stateCheck.pagination.rate.page = 1;
				// Populate with the selected
				fetchRatesList(null, selectedRate.id, 1, function (response) {
					generateRatesGrid(response.results);
					$scope.refreshScroll();
				});
			};

			$scope.hideResults = function () {
				$timeout(function () {
					$scope.isRateFilterActive = false;
				}, 300);
			};

			$scope.filterRates = function () {
				$scope.rateFiltered = false;
				if ($scope.stateCheck.rateFilterText.length > 0) {
					var re = new RegExp($scope.stateCheck.rateFilterText, 'gi');

					$scope.filteredRates = $($scope.reservationData.ratesMeta).filter(function () {
						return this.name.match(re);
					});
					if ($scope.filteredRates.length) {
						// CICO-11119
						$scope.isRateFilterActive = true;
					}
				} else {
					$scope.filteredRates = [];
					fetchRatesList(null, null, 1, function (response) {

						generateRatesGrid(response.results);
						$scope.refreshScroll();
					});
				}
				$scope.refreshScroll();
			};

			// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// --- CALENDAR VIEW

			$scope.toggleCalendar = function () {
				$scope.stateCheck.activeMode = $scope.stateCheck.activeMode === 'ROOM_RATE' ? 'CALENDAR' : 'ROOM_RATE';
				$scope.heading = $scope.stateCheck.activeMode === 'ROOM_RATE' ? 'Rooms & Rates' : ' Rate Calendar';
				$scope.setHeadingTitle($scope.heading);
				$('#rooms-and-rates-header .switch-button').toggleClass('on');
			};

			$scope.toggleSearchWithRestrictions = function () {
				$scope.stateCheck.calendarState.searchWithRestrictions = !$scope.stateCheck.calendarState.searchWithRestrictions;
				$scope.$broadcast('availableRateFiltersUpdated');
			};

			$scope.toggleShowOnlyAvailable = function () {
				$scope.stateCheck.calendarState.showOnlyAvailableRooms = !$scope.stateCheck.calendarState.showOnlyAvailableRooms;
				$scope.$broadcast('availableRateFiltersUpdated');
			};

			// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// --- MULTI RESERVATIONS

			$scope.changeActiveRoomType = function (tabIndex) {
				if ($scope.stateCheck.stayDatesMode) {
					return false;
				}
				$scope.activeRoom = tabIndex;
				$scope.stateCheck.preferredType = TABS[$scope.activeRoom].roomTypeId;
				$scope.viewState.currentTab = tabIndex;
				reInitialize();
			};

			$scope.getTabTitle = function (tabIndex) {
				if (tabIndex >= TABS.length) {
					return 'INVALID TAB';
				}
				var roomDetail = getTabRoomDetails(tabIndex);

				if (roomDetail.firstIndex === roomDetail.lastIndex) {
					return 'ROOM ' + (roomDetail.firstIndex + 1);
				}
				return 'ROOMS ' + (roomDetail.firstIndex + 1) + '-' + (roomDetail.lastIndex + 1);
			};

			// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// --- NAVI
			// since we are going back to create reservation screen
			// mark 'isSameCard' as true on '$scope.reservationData'
			$scope.setSameCardNgo = function () {
				$scope.reservationData.isSameCard = true;
				$state.go('rover.reservation.search');
			};

			// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// --- EVENT LISTENER
			var initEventListeners = function initEventListeners() {
				$scope.$on('SIDE_BAR_OCCUPANCY_UPDATE', function () {
					reInitialize();
				});

				$scope.$on('TABS_MODIFIED', function () {
					reInitialize();
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
							reInitialize();
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
				$scope.$on('cardChanged', function (event, cardIds) {
					$scope.reservationData.company.id = cardIds.companyCard;
					$scope.reservationData.travelAgent.id = cardIds.travelAgent;
					// CICO-32856
					$state.params.company_id = cardIds.companyCard;
					$state.params.travel_agent_id = cardIds.travelAgent;
					reInitialize();
					// Call the availability API and rerun the init method
				});
				// 	CICO-7792 END

				$scope.$on('switchToStayDatesCalendar', function () {
					$scope.stateCheck.activeMode = $scope.stateCheck.activeMode === 'ROOM_RATE' ? 'CALENDAR' : 'ROOM_RATE';
					$('#rooms-and-rates-header .switch-button').toggleClass('on');
				});
			};

			// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// --- END
			$scope.errorMessage = '';
			$scope.$on('FAILURE_UPDATE_RESERVATION', function (e, data) {
				$scope.errorMessage = data;
			});

			var restrictionsArray = [{ "key": "CLOSED", "name": "CLOSED" }, { "key": "CLOSED_ARRIVAL", "name": "CLOSED TO ARRIVAL" }, { "key": "CLOSED_DEPARTURE", "name": "CLOSED TO DEPARTURE" }, { "key": "MIN_STAY_LENGTH", "name": "MIN LENGTH OF STAY" }, { "key": "MAX_STAY_LENGTH", "name": "MAX LENGTH OF STAY" }, { "key": "MIN_STAY_THROUGH", "name": "MIN STAY THROUGH" }, { "key": "MIN_ADV_BOOKING", "name": "MIN ADVANCED BOOKING" }, { "key": "MAX_ADV_BOOKING", "name": "MAX ADVANCED BOOKING" }];

			_.each(restrictionsArray, function (restrictionObject) {
				var restrictionKey = restrictionObject.key.toUpperCase(),
				    restrictionClass = getRestrictionClass(restrictionKey);

				restrictionObject.restrictionBgClass = restrictionClass !== '' ? "bg-" + restrictionClass : restrictionClass;
				restrictionObject.restrictionIcon = getRestrictionIcon(restrictionKey);
			});
			$scope.legendRestrictionsArray = restrictionsArray;

			$scope.houseRestrictionArray = [];
			if (houseRestrictions) {
				_.mapObject(houseRestrictions, function (value, key) {
					var restrictionKey = key.toUpperCase(),
					    activeHouseRestriction = {},
					    restrictionClass = getRestrictionClass(restrictionKey);

					if (typeof value === 'boolean' && value || typeof value === 'number') {
						activeHouseRestriction.value = typeof value === 'boolean' ? '' : value;
						activeHouseRestriction.restrictionBgClass = restrictionClass !== '' ? "bg-" + restrictionClass : restrictionClass;
						activeHouseRestriction.restrictionIcon = getRestrictionIcon(restrictionKey);
						$scope.houseRestrictionArray.push(activeHouseRestriction);
					}
				});
			}

			updateRateMetaOnLoad();

			// CICO-47056
			$scope.$on("FAILURE_UPDATE_RESERVATION", function (e, data) {
				$scope.errorMessage = data;
			});

			// CICO-47056
			$scope.clearErrorMessage = function () {
				$scope.errorMessage = [];
			};

			// CICO-65967
			$scope.addListener('UPDATE_RATE_POST_GROUP_DETACH', function () {
				saveAndGotoStayCard();
			});
		}]);
	}, {}] }, {}, [1]);