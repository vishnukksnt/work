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
		sntRover.controller('reservationDetailsController', ['$scope', '$rootScope', 'rvPermissionSrv', 'RVReservationCardSrv', 'RVCCAuthorizationSrv', '$stateParams', 'reservationListData', 'reservationDetails', 'ngDialog', 'RVSaveWakeupTimeSrv', '$filter', 'RVNewsPaperPreferenceSrv', 'RVLoyaltyProgramSrv', '$state', 'RVSearchSrv', '$vault', 'RVReservationSummarySrv', 'baseData', '$timeout', 'paymentTypes', 'reseravationDepositData', 'dateFilter', 'RVReservationStateService', 'RVReservationBaseSearchSrv', 'RVReservationPackageSrv', 'transitions', 'taxExempts', 'sntActivity', '$ocLazyLoad', function ($scope, $rootScope, rvPermissionSrv, RVReservationCardSrv, RVCCAuthorizationSrv, $stateParams, reservationListData, reservationDetails, ngDialog, RVSaveWakeupTimeSrv, $filter, RVNewsPaperPreferenceSrv, RVLoyaltyProgramSrv, $state, RVSearchSrv, $vault, RVReservationSummarySrv, baseData, $timeout, paymentTypes, reseravationDepositData, dateFilter, RVReservationStateService, RVReservationBaseSearchSrv, RVReservationPackageSrv, transitions, taxExempts, sntActivity, $ocLazyLoad) {
			// pre setups for back button
			var backTitle,
			    backParam,
			    titleDict = {
				'DUEIN': 'DASHBOARD_SEARCH_CHECKINGIN',
				'DUEOUT': 'DASHBOARD_SEARCH_CHECKINGOUT',
				'INHOUSE': 'DASHBOARD_SEARCH_INHOUSE',
				'LATE_CHECKOUT': 'DASHBOARD_SEARCH_LATECHECKOUT',
				'VIP': 'DASHBOARD_SEARCH_VIP',
				'NORMAL_SEARCH': 'SEARCH_NORMAL'
			};

			var roomAndRatesState = 'rover.reservation.staycard.mainCard.room-rates',
			    ALLOWED_RESV_LIMIT = $rootScope.maxStayLength;

			// Putting this hash in parent as we have to maintain the back button in stay card even after navigating to states from stay card and coming back to the stay card.
			var setNavigationBookMark = function setNavigationBookMark() {
				$rootScope.stayCardStateBookMark = {
					previousState: $scope.previousState.name,
					previousStateParams: $scope.previousStateParams
				};
			};

			var RESPONSE_STATUS_470 = 470;

			$scope.hasOverBookRoomTypePermission = rvPermissionSrv.getPermissionValue('OVERBOOK_ROOM_TYPE');
			$scope.hasOverBookHousePermission = rvPermissionSrv.getPermissionValue('OVERBOOK_HOUSE');
			$scope.hasBorrowFromHousePermission = rvPermissionSrv.getPermissionValue('GROUP_HOUSE_BORROW');

			// For mobile view - To toggle b/w left and right content on the popup
			$scope.showRightContentForMobile = false;

			$scope.shouldShowTaxExempt = function () {
				return rvPermissionSrv.getPermissionValue('TAX_EXEMPT') && $scope.taxExemptTypes.length;
			};

			$scope.taxExemptTypes = taxExempts.results;
			var defaultTaxExemptObject = _.findWhere($scope.taxExemptTypes, { is_default: true });

			$scope.defaultTaxExemptTypeId = '';
			if (typeof defaultTaxExemptObject !== "undefined") {
				$scope.defaultTaxExemptTypeId = defaultTaxExemptObject.id;
			}

			// CICO-29343 - Set the flag to false initially and checking the View SR permission
			$scope.hasSRViewPermission = rvPermissionSrv.getPermissionValue('VIEW_SUPPRESSED_RATE');
			RVReservationStateService.setReservationFlag("isSRViewRateBtnClicked", false);

			// CICO-38714 / CICO-41313 - Set the Guest ID Permission flag and check if each guest has an id scanned or not
			// set to false if the hotel admin switch is turned off

			$scope.guestIdAdminEnabled = $rootScope.hotelDetails.guest_id_scan.view_scanned_guest_id;
			$scope.hasGuestIDPermission = rvPermissionSrv.getPermissionValue('ACCESS_GUEST_ID_DETAILS');

			if (!$rootScope.stayCardStateBookMark) {
				setNavigationBookMark();
			}

			if ($scope.previousState.name === "rover.financials.ccTransactions" || $rootScope.stayCardStateBookMark.previousState === 'rover.financials.ccTransactions') {
				setNavigationBookMark();
				$rootScope.setPrevState = {
					title: 'CC TRANSACTIONS',
					name: 'rover.financials.ccTransactions',
					param: {
						isRefresh: false
					}
				};
			} else if ($scope.previousState.name === "rover.actionsManager") {
				setNavigationBookMark();
				$rootScope.setPrevState = {
					title: 'ACTIONS MANAGER',
					name: 'rover.actionsManager',
					param: {
						restore: true
					}
				};
			} else if ($scope.previousState.name === "rover.groups.config" || $rootScope.stayCardStateBookMark.previousState === 'rover.groups.config') {
				if ($scope.previousState.name === "rover.groups.config") {
					setNavigationBookMark();
				}

				$rootScope.setPrevState = {
					title: 'GROUP DETAILS',
					name: 'rover.groups.config',
					param: {
						id: $rootScope.stayCardStateBookMark.previousStateParams.id,
						activeTab: "ROOMING"
					}
				};
			} else if ($scope.previousState.name === 'rover.financials.autoCharge') {
				$rootScope.setPrevState = {
					title: 'AUTO CHARGE',
					name: 'rover.financials.autoCharge',
					param: {
						isFromStayCard: true
					}
				};
			} else if ($scope.previousState.name === 'rover.financials.invoiceSearch') {
				$rootScope.setPrevState = {
					title: 'INVOICE SEARCH',
					name: 'rover.financials.invoiceSearch',
					param: {
						isFromStayCard: true
					}
				};
			} else if ($scope.previousState.name === "rover.allotments.config" || $rootScope.stayCardStateBookMark.previousState === 'rover.allotments.config') {
				if ($scope.previousState.name === "rover.allotments.config") {
					setNavigationBookMark();
				}
				$rootScope.setPrevState = {
					title: 'ALLOTMENT DETAILS',
					name: 'rover.allotments.config',
					param: {
						id: $rootScope.stayCardStateBookMark.previousStateParams.id,
						activeTab: "RESERVATIONS"
					}
				};
			} else if ($stateParams.isFromCards) {
				var fromArTab = $stateParams.isFromArTab;

				setNavigationBookMark();
				$rootScope.setPrevState = {
					title: 'AR Transactions',
					name: 'rover.companycarddetails',
					param: {
						id: $vault.get('cardId'),
						type: $vault.get('type'),
						query: $vault.get('query'),
						isBackFromStaycard: true,
						isBackFromStaycardToARTab: fromArTab
					}
				};
			} else if ($scope.previousState.name === "rover.nightlyDiary" || $rootScope.stayCardStateBookMark.previousState === 'rover.nightlyDiary') {
				if ($scope.previousState.name === "rover.nightlyDiary") {
					setNavigationBookMark();
				}
				$rootScope.setPrevState = {
					title: 'ROOM DIARY',
					name: 'rover.nightlyDiary',
					param: {
						id: $rootScope.stayCardStateBookMark.previousStateParams.id,
						activeTab: "DIARY",
						origin: 'STAYCARD'
					}
				};
			} else if ($scope.previousState.name === 'rover.diary') {
				setNavigationBookMark();
				$rootScope.setPrevState = {
					title: 'ROOM DIARY',
					name: 'rover.diary',
					param: {
						id: $rootScope.stayCardStateBookMark.previousStateParams.id,
						activeTab: "DIARY",
						origin: 'STAYCARD'
					}
				};
			} else if ($stateParams.isFromDiary && !$rootScope.isReturning()) {
				setNavigationBookMark();
				$rootScope.setPrevState = {
					title: 'Room Diary'

				};
			} else if (transitions.get().from()['name'].match(/rover\.reports/)) {
				$rootScope.setPrevState = {
					title: 'REPORTS',
					name: transitions.get().from()['name'],
					param: angular.extend(angular.copy(transitions.get().params('from')), {
						action: 'report.show.last'
					})
				};
			} else if ($stateParams.isFromCardStatistics) {
				setNavigationBookMark();
				$rootScope.setPrevState = {
					title: 'Card Statistics',
					name: 'rover.companycarddetails',
					param: {
						id: $vault.get('cardId'),
						type: $vault.get('type'),
						isBackToStatistics: true,
						isBackFromStaycard: true,
						selectedStatisticsYear: $vault.get('selectedYear')
					}
				};
			} else if ($scope.previousState.name === "rover.companycarddetails" || $scope.$parent.reservationData.wasFromCard) {

				setNavigationBookMark();
				var isBackToTACommission = $stateParams.isFromTACommission || $scope.$parent.reservationData.isFromTACommission;

				$rootScope.setPrevState = {
					title: 'TRAVEL Agent',
					name: 'rover.companycarddetails',
					param: {
						id: $vault.get('travelAgentId'),
						type: $vault.get('travelAgentType'),
						query: $vault.get('travelAgentQuery'),
						isBackToTACommission: isBackToTACommission,
						isBackFromStaycard: true,
						origin: isBackToTACommission ? 'COMMISION_SUMMARY' : ''
					}
				};
				$scope.$parent.reservationData.wasFromCard = true;
				$scope.$parent.reservationData.isFromTACommission = angular.copy($stateParams.isFromTACommission);
			} else if ($stateParams.isFromGuestStatistics) {
				$rootScope.setPrevState = {
					title: 'Guest Statistics',
					name: 'rover.guest.details',
					param: {
						guestId: $vault.get('guestId'),
						selectedStatisticsYear: $vault.get('selectedYear'),
						isBackToStatistics: true
					}
				};
			} else {
				setNavigationBookMark();
				// if we just created a reservation and came straight to staycard
				// we should show the back button with the default text "Find Reservations"
				if ($stateParams.justCreatedRes || $scope.otherData.reservationCreated) {
					backTitle = titleDict['NORMAL_SEARCH'];
					backParam = {
						type: 'RESET'
					}; // CICO-9726 --- If a newly created reservation / go back to plain search page
				} else {
					backTitle = !!titleDict[$vault.get('searchType')] ? titleDict[$vault.get('searchType')] : titleDict['NORMAL_SEARCH'];
					backParam = {
						type: $vault.get('searchType')
					};
					// Special case - In case of search by CC, the title has to display the card number as well.
					// The title is already stored in $vault
					if ($vault.get('searchType') === "BY_SWIPE") {
						backParam = {
							type: "BY_SWIPE"
						};
					}
				};

				// setup a back button
				$rootScope.setPrevState = {
					title: $filter('translate')(backTitle),
					scope: $scope,
					callback: 'goBackSearch'
				};

				// we need to update any changes to the room
				// before going back to search results
				$scope.goBackSearch = function () {
					$scope.$emit('showLoader');
					$scope.updateSearchCache();
					// With the previous version of ui-router, this useCache state param was
					// set to true in case of a back navigation in the $rootScope.loadPrevState method of rvApp.js file
					// With the upgraded ui-router the stateparams cannot be changed in the middle of a transition
					backParam = backParam || {};
					backParam.useCache = true;
					backParam.isBulkCheckoutSelected = $stateParams.isBulkCheckoutSelected;
					backParam.isAllowOpenBalanceCheckoutSelected = $stateParams.isAllowOpenBalanceCheckoutSelected;
					backParam.isBulkCheckinSelected = $vault.get('isBulkCheckinSelected') === 'true';
					$state.go('rover.search', backParam);
				};
			}

			var datePickerCommon = {
				dateFormat: $rootScope.jqDateFormat,
				minDate: $filter('date')($rootScope.businessDate, $rootScope.dateFormat),
				numberOfMonths: 1,
				changeYear: true,
				changeMonth: true,
				beforeShow: function beforeShow(input, inst) {
					$('#ui-datepicker-div').addClass('reservation hide-arrow');
					$('<div id="ui-datepicker-overlay">').insertAfter('#ui-datepicker-div');

					setTimeout(function () {
						$('body').find('#ui-datepicker-overlay').on('click', function () {
							$('#room-out-from').blur();
							$('#room-out-to').blur();
						});
					}, 100);
				},
				onClose: function onClose(value) {
					$('#ui-datepicker-div').removeClass('reservation hide-arrow');
					$('#ui-datepicker-overlay').off('click').remove();
				}
			};

			var guestIdList;

			var fetchGuestIDs = function fetchGuestIDs() {
				var successCallBack = function successCallBack(response) {
					guestIdList = response;
					sntActivity.stop('GUEST_ID_FETCH');
				};

				var failureCallBack = function failureCallBack() {
					sntActivity.stop('GUEST_ID_FETCH');
				};

				var data = {
					"reservation_id": $scope.reservationData.reservation_card.reservation_id
				};

				sntActivity.start('GUEST_ID_FETCH');
				$scope.invokeApi(RVReservationCardSrv.fetchGuestIdentity, data, successCallBack, failureCallBack);
			};

			var fetchAddonsDetails = function fetchAddonsDetails() {
				var reservationId = $scope.reservationData.reservation_card.reservation_id;

				var initAddonsDatasuccessCallBack = function initAddonsDatasuccessCallBack(data) {
					$scope.$emit('hideLoader');
					$scope.packageData = data;
					angular.forEach($scope.packageData.existing_packages, function (item, index) {
						item.totalAmount = item.addon_count * item.amount;
					});
				};
				$scope.invokeApi(RVReservationPackageSrv.getReservationPackages, reservationId, initAddonsDatasuccessCallBack);
			};

			// CICO-16013, moved from rvReservationGuestCtrl.js to de-duplicate api calls

			$scope.activeWakeUp = false;

			// CICO-10568
			$scope.reservationData.isSameCard = false;

			// CICO-10006 assign the avatar image
			$scope.guestCardData.cardHeaderImage = reservationListData.guest_details.avatar;
			$scope.guestCardData.nationality_id = reservationListData.guest_details.nationality_id;
			if (!$scope.guestCardData.contactInfo.address) {
				$scope.guestCardData.contactInfo.address = {};
				$scope.guestCardData.contactInfo.address.country_id = reservationListData.guest_details.country_id;
			}

			/**
    *	We have moved the fetching of 'baseData' form 'rover.reservation' state
    *	to the state where this controller is set as the state controller
    *
    *	Now we do want the original parent controller 'RVReservationMainCtrl' to bind that data
    *	so we have created a 'callFromChildCtrl' method on the 'RVReservationMainCtrl' $scope.
    *
    *	Once we fetch the baseData here we are going call 'callFromChildCtrl' method
    *	while passing the data, this way all the things 'RVReservationMainCtrl' was doing with
    *	'baseData' will be processed again
    *
    *	The number of '$parent' used is based on how deep this state is wrt 'rover.reservation' state
    */
			var rvReservationMainCtrl = $scope.$parent.$parent.$parent.$parent;

			rvReservationMainCtrl.callFromChildCtrl(baseData);

			BaseCtrl.call(this, $scope);

			$scope.reservationCardSrv = RVReservationCardSrv;
			/*
    * success call back of fetch reservation details
    */
			// Data fetched using resolve in router
			var reservationMainData = $scope.$parent.reservationData;

			$scope.reservationParentData = $scope.$parent.reservationData;
			$scope.reservationData = reservationDetails;

			/**
       * Get the max value of the departure date for the given arrival date
       * @param - fromDate Arrival Date
       * @return - departure Date
       */
			$scope.getReservationMaxDepartureDate = function (arrivalDate) {
				var dateObj = tzIndependentDate(arrivalDate),
				    dateString = $filter('date')(dateObj, 'yyyy-MM-dd'),
				    dateParts = dateString.match(/(\d+)/g);

				return new Date(dateParts[0], parseInt(dateParts[1]) - 1, parseInt(dateParts[2], 10) + ALLOWED_RESV_LIMIT);
			};

			// CICO-13564
			$scope.editStore = {
				arrival: $scope.reservationData.reservation_card.arrival_date,
				departure: $scope.reservationData.reservation_card.departure_date
			};

			// CICO-49191 - Get the min date for showing in the arrival/departure calendar for group reservation
			var getMinDateForGroupReservation = function getMinDateForGroupReservation() {
				var businessDate = tzIndependentDate($rootScope.businessDate),
				    groupShoulderStartDate = tzIndependentDate($scope.reservationData.reservation_card.group_shoulder_block_from);

				var minDate = businessDate > groupShoulderStartDate ? businessDate : groupShoulderStartDate;

				if ($scope.reservationData.reservation_card.reservation_status === 'CHECKEDIN') {
					minDate = $scope.editStore.arrival;
				}

				return $filter('date')(minDate, $rootScope.dateFormat);
			},
			    getMinDateForAllotmentReservation = function getMinDateForAllotmentReservation() {
				var businessDate = tzIndependentDate($rootScope.businessDate),
				    allotmentStartDate = tzIndependentDate($scope.reservationData.reservation_card.allotment_block_from);

				var minDate = businessDate > allotmentStartDate ? businessDate : allotmentStartDate;

				if ($scope.reservationData.reservation_card.reservation_status === 'CHECKEDIN') {
					minDate = $scope.editStore.arrival;
				}

				return $filter('date')(minDate, $rootScope.dateFormat);
			},
			    getMaxDepartureDate = function getMaxDepartureDate() {
				var departureDate;

				if (!!$scope.reservationData.reservation_card.group_id) {
					departureDate = $filter('date')($scope.reservationData.reservation_card.group_shoulder_block_to, $rootScope.dateFormat);
				} else if (!!$scope.reservationData.reservation_card.allotment_id) {
					departureDate = $filter('date')($scope.reservationData.reservation_card.allotment_block_to, $rootScope.dateFormat);
				} else {
					departureDate = $scope.getReservationMaxDepartureDate($scope.editStore.arrival);
				}

				return departureDate;
			};

			// for groups this date picker must not allow user to pick
			// a date that is after the group end date.
			// and before the group start date
			if (!!$scope.reservationData.reservation_card.group_id) {
				datePickerCommon = angular.extend(datePickerCommon, {
					minDate: getMinDateForGroupReservation(),
					maxDate: $filter('date')($scope.reservationData.reservation_card.group_shoulder_block_to, $rootScope.dateFormat)
				});
			}

			if (!!$scope.reservationData.reservation_card.allotment_id) {
				datePickerCommon = angular.extend(datePickerCommon, {
					minDate: getMinDateForAllotmentReservation(),
					maxDate: $filter('date')($scope.reservationData.reservation_card.allotment_block_to, $rootScope.dateFormat)
				});
			}

			$scope.arrivalDateOptions = angular.copy(datePickerCommon);
			$scope.departureDateOptions = angular.copy(datePickerCommon);

			// CICO-46933
			$scope.departureDateOptions.maxDate = getMaxDepartureDate();

			// CICO-46933
			$scope.arrivalDateChanged = function () {
				$scope.departureDateOptions.maxDate = !!$scope.reservationData.reservation_card.group_id ? $filter('date')($scope.reservationData.reservation_card.group_shoulder_block_to, $rootScope.dateFormat) : $scope.getReservationMaxDepartureDate($scope.editStore.arrival);
				$scope.editStore.departure = tzIndependentDate($scope.editStore.departure) <= $scope.getReservationMaxDepartureDate($scope.editStore.arrival) ? $scope.editStore.departure : $scope.getReservationMaxDepartureDate($scope.editStore.arrival);
			};

			$scope.reservationData.paymentTypes = paymentTypes;
			$scope.reservationData.paymentMethods = paymentTypes;
			$scope.reservationData.reseravationDepositData = reseravationDepositData;

			$scope.reservationData.justCreatedRes = typeof $stateParams.justCreatedRes !== "undefined" && $stateParams.justCreatedRes !== "" && $stateParams.justCreatedRes !== null && $stateParams.justCreatedRes === "true" ? true : false;
			// update the room details to RVSearchSrv via RVSearchSrv.updateRoomDetails - params: confirmation, data
			$scope.updateSearchCache = function () {
				// room related details
				var data = {
					'room': $scope.reservationData.reservation_card.room_number,
					'reservation_status': $scope.reservationData.reservation_card.reservation_status,
					'roomstatus': $scope.reservationData.reservation_card.room_status,
					'fostatus': $scope.reservationData.reservation_card.fo_status,
					'room_ready_status': $scope.reservationData.reservation_card.room_ready_status,
					'is_reservation_queued': $scope.reservationData.reservation_card.is_reservation_queued,
					'is_queue_rooms_on': $scope.reservationData.reservation_card.is_queue_rooms_on,
					'late_checkout_time': $scope.reservationData.reservation_card.late_checkout_time,
					'is_opted_late_checkout': $scope.reservationData.reservation_card.is_opted_late_checkout,
					'departure_date': $scope.reservationData.reservation_card.departure_date
					// Fix for CICO-33114 where the departure_date value in cache wasn't getting updated.
				};

				RVSearchSrv.updateRoomDetails($scope.reservationData.reservation_card.confirmation_num, data);
			};

			// update any room related data to search service also
			$scope.updateSearchCache();

			$scope.$parent.$parent.reservation = reservationDetails;
			$scope.reservationnote = "";
			$scope.selectedLoyalty = {};
			$scope.$emit('HeaderChanged', $filter('translate')('STAY_CARD_TITLE'));
			$scope.$watch(function () {
				return typeof $scope.reservationData.reservation_card.wake_up_time.wake_up_time !== 'undefined' ? $scope.reservationData.reservation_card.wake_up_time.wake_up_time : $filter('translate')('NOT_SET');
			}, function (wakeuptime) {
				$scope.wake_up_time = wakeuptime;
			});

			//  showing Guest button arrow as part of CICO-25774

			// $scope.shouldShowGuestDetails = false;
			fetchAddonsDetails();
			$scope.toggleGuests = function (isFromCheckin) {

				$scope.isFromCheckin = isFromCheckin;
				$scope.shouldShowGuestDetails = !$scope.shouldShowGuestDetails;
				if ($scope.shouldShowGuestDetails) {
					$scope.shouldShowTimeDetails = false;
					fetchGuestIDs();
				}
				$scope.$broadcast("UPDATE_ACCOMPANY_SCROLL");
				// CICO-12454: Upon close the guest tab - save api call for guest details for standalone
				if (!$scope.shouldShowGuestDetails && $scope.isStandAlone) {
					$scope.$broadcast("UPDATEGUESTDEATAILS", { "isBackToStayCard": true });
				}

				$scope.$emit("SHOW_GUEST_ID_LIST", {
					"shouldShowGuestDetails": isFromCheckin
				});
			};

			$scope.saveAccGuestDetails = function ($event) {
				setTimeout(function () {
					// CICO-60110 - Save the accompany guests only while in staycard. 
					// The additional check is to prevent the save while navigating to some other states
					if (document.activeElement.getAttribute("type") != "text" && $state.$current.name === "rover.reservation.staycard.reservationcard.reservationdetails" && !document.activeElement.className.search(/prevent-api-call/)) {
						$scope.$broadcast("UPDATEGUESTDEATAILS", { "isBackToStayCard": false });
					}
				}, 800);
			};

			$scope.$on("OPENGUESTTAB", function (e) {
				$scope.toggleGuests();
			});

			$scope.shouldShowTimeDetails = false;
			$scope.toggleTime = function () {
				$scope.showEditDates = false;
				$scope.shouldShowTimeDetails = !$scope.shouldShowTimeDetails;
			};

			$scope.showEditDates = false;
			$scope.toggleReservationDates = function () {
				$scope.shouldShowTimeDetails = false;
				$scope.showEditDates = !$scope.showEditDates;
			};

			angular.forEach($scope.reservationData.reservation_card.loyalty_level.frequentFlyerProgram, function (item, index) {
				if ($scope.reservationData.reservation_card.loyalty_level.selected_loyalty === item.id) {
					$scope.selectedLoyalty = item;
					if (_.isString($scope.selectedLoyalty.membership_card_number)) {
						$scope.selectedLoyalty.membership_card_number = $scope.selectedLoyalty.membership_card_number.substr($scope.selectedLoyalty.membership_card_number.length - 4);
					}
				}
			});
			angular.forEach($scope.reservationData.reservation_card.loyalty_level.hotelLoyaltyProgram, function (item, index) {
				if ($scope.reservationData.reservation_card.loyalty_level.selected_loyalty === item.id) {
					$scope.selectedLoyalty = item;
					if (_.isString($scope.selectedLoyalty.membership_card_number)) {
						$scope.selectedLoyalty.membership_card_number = $scope.selectedLoyalty.membership_card_number.substr($scope.selectedLoyalty.membership_card_number.length - 4);
					}
				}
			});

			// Update the balance amount in staycard
			$scope.$on('UPDATE_DEPOSIT_BALANCE', function (e, data) {
				$scope.reservationData.reservation_card.balance_amount = data.reservation_balance;
			});

			$scope.$on("updateWakeUpTime", function (e, data) {

				$scope.reservationData.reservation_card.wake_up_time = data;
				RVReservationCardSrv.updateResrvationForConfirmationNumber($scope.reservationData.reservation_card.confirmation_num, $scope.reservationData);
				$scope.wake_up_time = typeof $scope.reservationData.reservation_card.wake_up_time.wake_up_time !== 'undefined' ? $scope.reservationData.reservation_card.wake_up_time.wake_up_time : $filter('translate')('NOT_SET');
			});
			$scope.setScroller('resultDetails', {
				'click': true
			});

			// CICO-7078 : Initiate company & travelagent card info
			// temporarily store the exiting card ids
			var existingCards = {
				guest: $scope.reservationDetails.guestCard.id,
				company: $scope.reservationDetails.companyCard.id,
				agent: $scope.reservationDetails.travelAgent.id,
				group: $scope.reservationDetails.group.id,
				allotment: $scope.reservationDetails.allotment.id
			};
			// also reload the loyalty card / frequent flyer section

			$rootScope.$broadcast('reload-loyalty-section-data', {});

			$scope.reservationDetails.guestCard.id = reservationListData.guest_details.user_id === null ? "" : reservationListData.guest_details.user_id;
			$scope.reservationDetails.companyCard.id = reservationListData.company_id === null ? "" : reservationListData.company_id;
			$scope.reservationDetails.travelAgent.id = reservationListData.travel_agent_id === null ? "" : reservationListData.travel_agent_id;
			$scope.reservationDetails.group.id = reservationDetails.reservation_card.group_id || '';
			$scope.reservationDetails.allotment.id = reservationDetails.reservation_card.allotment_id || '';

			angular.copy(reservationListData, $scope.reservationListData);
			// CICO-32546, flag to check if atleast one external reference number exists.
			$scope.externalReferencesExist = $scope.reservationListData.external_references.length > 0 ? true : false;
			// Reset to firstTab in case in case of coming into staycard from the create reservation screens
			// after creating multiple reservations
			$scope.viewState.currentTab = 0;

			$scope.populateDataModel(reservationDetails);

			$scope.$emit('cardIdsFetched', {
				guest: $scope.reservationDetails.guestCard.id === existingCards.guest,
				company: $scope.reservationDetails.companyCard.id === existingCards.company,
				agent: $scope.reservationDetails.travelAgent.id === existingCards.agent,
				group: $scope.reservationDetails.group.id === existingCards.group,
				allotment: $scope.reservationDetails.allotment.id === existingCards.allotment
			});
			// CICO-7078

			$scope.refreshReservationDetailsScroller = function (timeoutSpan) {
				setTimeout(function () {
					$scope.refreshScroller('resultDetails');
					$scope.$emit("REFRESH_LIST_SCROLL");
				}, timeoutSpan);
			};

			$scope.$on('$viewContentLoaded', function () {
				$scope.refreshReservationDetailsScroller(500);
			});

			/**
    * (CICO-16893)
    * Whene there is any click happened reservation area, we have to refresh scroller
    * we will use this event to refresh scroller
    */
			$scope.$on('refreshScrollerReservationDetails', function () {
				$scope.refreshReservationDetailsScroller(500);
			});

			$scope.reservationDetailsFetchSuccessCallback = function (data) {

				$scope.$emit('hideLoader');
				$scope.$parent.$parent.reservation = data;
				$scope.reservationData = data;
				// To move the scroller to top after rendering new data in reservation detals.
				$scope.$parent.myScroll['resultDetails'].scrollTo(0, 0);
				// upate the new room number to RVSearchSrv via RVSearchSrv.updateRoomNo - params: confirmation, room
				$scope.updateSearchCache();
			};
			/*
    * Fetch reservation details on selecting or clicking each reservation from reservations list
    * @param {int} confirmationNumber => confirmationNumber of reservation
    */
			$scope.$on("RESERVATIONDETAILS", function (event, confirmationNumber) {
				if (confirmationNumber) {

					var data = {
						"confirmationNumber": confirmationNumber,
						"isRefresh": false
					};

					$scope.invokeApi(RVReservationCardSrv.fetchReservationDetails, data, $scope.reservationDetailsFetchSuccessCallback);
				} else {
					$scope.reservationData = {};
					$scope.reservationData.reservation_card = {};
				}
			});
			// To pass confirmation number and resrvation id to reservation Card controller.

			var passData = reservationListData;

			passData.avatar = reservationListData.guest_details.avatar;
			passData.vip = reservationListData.guest_details.vip;
			passData.confirmationNumber = reservationDetails.reservation_card.confirmation_num;

			$scope.$emit('passReservationParams', passData);

			$rootScope.$on('clearErroMessages', function () {
				$scope.errorMessage = "";
			});

			$scope.openPaymentList = function () {
				// Disable the feature when the reservation is checked out
				if (!$scope.isNewsPaperPreferenceAvailable()) {
					return;
				}
				$scope.reservationData.currentView = "stayCard";
				$scope.$emit('SHOWPAYMENTLIST', $scope.reservationData);
			};
			/*
    * Handle swipe action in reservationdetails card
    */

			$scope.$on('UPDATE_DEPOSIT_BALANCE_FLAG', function (evt, val) {
				$scope.isDepositBalanceScreenOpened = val;
			});

			$scope.$on('SWIPE_ACTION', function (event, swipedCardData) {
				if ($scope.isDepositBalanceScreenOpened) {
					swipedCardData.swipeFrom = "depositBalance";
				} else if ($scope.isCancelReservationPenaltyOpened) {
					swipedCardData.swipeFrom = "cancelReservationPenalty";
				} else if ($scope.isStayCardDepositScreenOpened) {
					swipedCardData.swipeFrom = "stayCardDeposit";
				} else if ($scope.isGuestCardVisible) {
					swipedCardData.swipeFrom = "guestCard";
				} else {
					swipedCardData.swipeFrom = "stayCard";
				}
				if (swipedCardData.swipeFrom !== 'guestCard') {
					$scope.$emit('isFromGuestCardFalse');
				}

				var swipeOperationObj = new SwipeOperation();
				var getTokenFrom = swipeOperationObj.createDataToTokenize(swipedCardData);

				var tokenizeSuccessCallback = function tokenizeSuccessCallback(tokenValue) {
					$scope.$emit('hideLoader');
					swipedCardData.token = tokenValue;

					$scope.showAddNewPaymentModel(swipedCardData);
					$scope.swippedCard = true;
					if (swipedCardData.swipeFrom !== 'guestCard') {
						$scope.$emit('isFromGuestCardFalse');
					}
				};

				$scope.invokeApi(RVReservationCardSrv.tokenize, getTokenFrom, tokenizeSuccessCallback);
			});

			$scope.failureNewspaperSave = function (errorMessage) {
				$scope.errorMessage = errorMessage;
				$scope.$emit('hideLoader');
			};
			$scope.successCallback = function () {
				RVReservationCardSrv.updateResrvationForConfirmationNumber($scope.reservationData.reservation_card.confirmation_num, $scope.reservationData);

				// upate the new room number to RVSearchSrv via RVSearchSrv.updateRoomNo - params: confirmation, room
				$scope.updateSearchCache();
				$scope.$emit('hideLoader');
			};
			$scope.isWakeupCallAvailable = function () {
				var status = $scope.reservationData.reservation_card.reservation_status;

				return status === "CHECKEDIN" || status === "CHECKING_OUT" || status === "CHECKING_IN";
			};
			$scope.isNewsPaperPreferenceAvailable = function () {
				var status = $scope.reservationData.reservation_card.reservation_status;

				return status === "CHECKEDIN" || status === "CHECKING_OUT" || status === "CHECKING_IN" || status === "RESERVED";
			};

			$scope.saveNewsPaperPreference = function () {
				var params = {};

				params.reservation_id = $scope.reservationData.reservation_card.reservation_id;
				params.selected_newspaper = $scope.reservationData.reservation_card.news_paper_pref.selected_newspaper;

				$scope.invokeApi(RVNewsPaperPreferenceSrv.saveNewspaperPreference, params, $scope.successCallback, $scope.failureNewspaperSave);
			};
			$scope.showFeatureNotAvailableMessage = function () {
				ngDialog.open({
					template: '/assets/partials/reservationCard/rvFeatureNotAvailableDialog.html',
					className: 'ngdialog-theme-default',
					scope: $scope
				});
			};
			$scope.deleteModal = function () {
				ngDialog.close();
			};

			$scope.showWakeupCallDialog = function () {
				if (!$scope.isWakeupCallAvailable()) {
					$scope.showFeatureNotAvailableMessage();
					return;
				}

				$scope.wakeupData = $scope.reservationData.reservation_card.wake_up_time;
				ngDialog.open({
					template: '/assets/partials/reservationCard/rvSetWakeupTimeDialog.html',
					controller: 'rvSetWakeupcallController',
					className: 'ngdialog-theme-default',
					scope: $scope
				});
			};

			/**
    * CICO-29324: disable duests button for cancel and no show
    * @return {Boolean} disable or not.
    */
			$scope.shouldDisableGuestsButton = function () {
				var reservationStatus = $scope.reservation.reservation_card.reservation_status;

				return reservationStatus === 'CANCELED' || reservationStatus === 'NOSHOW';
			};

			/**
    * we will not show "Nights" button in case of hourly, isNightsEnabled()
    * as part of CICO-17712, we are hiding it for now (group rservation)
    * @return {Boolean}
    */
			$scope.shouldShowChangeStayDatesButton = function () {
				return $scope.isNightsEnabled() && !$scope.reservationData.reservation_card.is_hourly_reservation;
			};

			$scope.isNightsEnabled = function () {
				var reservationStatus = $scope.reservationData.reservation_card.reservation_status;

				if (reservationStatus === 'RESERVED' || reservationStatus === 'CHECKING_IN') {
					return true;
				}
				if ($rootScope.isStandAlone && (reservationStatus === 'CHECKEDIN' || reservationStatus === 'CHECKING_OUT')) {
					return true;
				}
				return false;
			};

			var hasPermissionToChangeStayDates = function hasPermissionToChangeStayDates() {
				return rvPermissionSrv.getPermissionValue('EDIT_RESERVATION');
			};

			$scope.isStayDatesChangeAllowed = function () {
				var is_hourly_reservation = $scope.reservationData.reservation_card.is_hourly_reservation,
				    reservation_status = $scope.reservationData.reservation_card.reservation_status,
				    group_id = $scope.reservationData.reservation_card.group_id,
				    isStayDatesChangeAllowed = false;

				var is_full_mode = $rootScope.hotelDiaryConfig.mode === 'FULL' ? true : false,
				    checking_in_reserved = { 'CHECKING_IN': true, 'RESERVED': true }[reservation_status],
				    group_checked_in = { 'CHECKEDIN': true, 'CHECKING_OUT': true }[reservation_status] && !!group_id;

				isStayDatesChangeAllowed = false;

				if ($rootScope.isStandAlone && !is_full_mode && !is_hourly_reservation && hasPermissionToChangeStayDates() && (checking_in_reserved || group_checked_in)) {
					isStayDatesChangeAllowed = true;
				}

				return isStayDatesChangeAllowed;
			};

			/**
    * CICO-17693: should be disabled on the Stay Card for Group reservations, until we have the complete functionality working:
    * CICO-25179: should be disabled for allotment as well
    * @return {Boolean} flag to disable button
    */
			$scope.shouldDisableExtendNightsButton = function () {
				var isAllotmentPresent = $scope.reservationData.allotment_id || $scope.reservationData.reservation_card.allotment_id;

				return isAllotmentPresent;
			};

			// Handle Navigation to Nightly Diary
			var navigateToNightlyDiary = function navigateToNightlyDiary() {
				var navigationParams = {
					start_date: $scope.reservationData.reservation_card.arrival_date,
					reservation_id: $scope.reservationData.reservation_card.reservation_id,
					confirm_id: $scope.reservationData.reservation_card.confirmation_num,
					room_id: $scope.reservationData.reservation_card.room_id,
					origin: 'STAYCARD_NIGHTS'
				};

				if (navigationParams.room_id === '') {
					// Reservation with Room is not assigned.
					navigationParams.action = 'SELECT_UNASSIGNED_RESERVATION';
				} else {
					// Reservation with Room is assigned already.
					navigationParams.action = 'SELECT_RESERVATION';
				}

				$state.go('rover.nightlyDiary', navigationParams);
			};

			$scope.extendNights = function () {
				// CICO-17693: should be disabled on the Stay Card for Group reservations, until we have the complete functionality working:
				if ($scope.shouldDisableExtendNightsButton()) {
					return false;
				};
				if ($rootScope.hotelDiaryConfig.mode === 'FULL' && $scope.reservationData.reservation_card.is_hourly_reservation) {
					// Go to D-Diary
					$scope.showDiaryScreen();
				} else if ($rootScope.hotelDiaryConfig.mode === 'FULL' && !$scope.reservationData.reservation_card.is_hourly_reservation) {
					// Go to N-Diary
					navigateToNightlyDiary();
				} else {
					$state.go("rover.reservation.staycard.changestaydates", {
						reservationId: reservationMainData.reservationId,
						confirmNumber: reservationMainData.confirmNum
					});
				}
			};

			var editPromptDialogId;

			$scope.showEditReservationPrompt = function () {
				if ($rootScope.isStandAlone) {
					if ($scope.reservationData.reservation_card.is_hourly_reservation) {
						$scope.applyCustomRate();
					} else {
						editPromptDialogId = ngDialog.open({
							template: '/assets/partials/reservation/rvStayCardEditRate.html',
							className: 'ngdialog-theme-default',
							scope: $scope,
							closeByDocument: false,
							closeByEscape: false
						});
					}
				} else {
					$state.go('rover.reservation.staycard.billcard', {
						reservationId: $scope.reservationData.reservation_card.reservation_id,
						clickedButton: "viewBillButton",
						userId: $scope.guestCardData.userId
					});
				}
			};

			$scope.applyCustomRate = function () {
				$scope.closeDialog(editPromptDialogId);
				$timeout(function () {
					$scope.editReservationRates($scope.reservationParentData.rooms[0], 0);
				}, 1000);
			};

			var navigateToRoomAndRates = function navigateToRoomAndRates(arrival, departure) {
				var roomTypeId = $scope.$parent.reservationData.tabs[$scope.viewState.currentTab].roomTypeId;
				// CICO-59948 For in-house reservation, set the room type id as the current room type id(API response)
				if ($scope.reservationData.reservation_card.reservation_status === 'CHECKEDIN') {
					roomTypeId = $scope.reservationData.reservation_card.room_type_id;
				}

				angular.forEach($scope.reservationData.reservation_card.stay_dates, function (detail) {
					$scope.$parent.reservationData.rooms[0].stayDates[detail.date].contractId = detail.contract_id;
				});

				$state.go(roomAndRatesState, {
					from_date: arrival || reservationMainData.arrivalDate,
					to_date: departure || reservationMainData.departureDate,
					view: 'DEFAULT',
					fromState: $state.current.name,
					company_id: $scope.$parent.reservationData.company.id,
					travel_agent_id: $scope.$parent.reservationData.travelAgent.id,
					group_id: $scope.borrowForGroups ? '' : $scope.$parent.reservationData.group.id,
					borrow_for_groups: $scope.borrowForGroups,
					room_type_id: roomTypeId,
					adults: $scope.$parent.reservationData.tabs[$scope.viewState.currentTab].numAdults,
					children: $scope.$parent.reservationData.tabs[$scope.viewState.currentTab].numChildren,
					is_member: $scope.guestData.primary_guest_details.is_member,
					selectedCurrencyId: $scope.reservationData.reservation_card.rate_currency_id
				});
			};

			$scope.alertOverbooking = function (close) {
				var timer = 0;

				if (close) {
					$scope.closeDialog();
					timer = 1000;
				}
				$timeout(navigateToRoomAndRates, timer);
			};

			$scope.updateRoomRate = function () {
				$scope.invokeApi(RVReservationPackageSrv.getReservationPackages, $scope.reservationData.reservation_card.reservation_id, function (response) {

					$scope.$emit('hideLoader');

					var roomData = $scope.$parent.reservationData.rooms[0]; // Accessing from staycard -> ONLY one room/reservation!

					// Reset addons package
					roomData.addons = [];

					angular.forEach(response.existing_packages, function (addon) {
						roomData.addons.push({
							quantity: addon.addon_count,
							id: addon.id,
							price: parseFloat(addon.amount),
							amountType: addon.amount_type,
							postType: addon.post_type,
							title: addon.name,
							totalAmount: addon.addon_count * parseFloat(addon.amount),
							is_inclusive: addon.is_inclusive,
							taxes: addon.taxes,
							is_rate_addon: addon.is_rate_addon,
							allow_rate_exclusion: addon.allow_rate_exclusion,
							excluded_rate_ids: addon.excluded_rate_ids
						});
					});

					$scope.goToRoomAndRates('ROOM_RATE');
				});
			};

			$scope.goToRoomAndRates = function (state) {
				// CICO-17693: should be disabled on the Stay Card for Group reservations, until we have the complete functionality working:
				if ($scope.reservationData.group_id || $scope.reservationData.reservation_card.group_id) {
					return false;
				};

				$scope.closeDialog(editPromptDialogId);
				if ($scope.reservationData.reservation_card.is_hourly_reservation) {
					return false;
				} else if ($rootScope.isStandAlone) {
					navigateToRoomAndRates();
				} else {
					$state.go('rover.reservation.staycard.billcard', {
						reservationId: $scope.reservationData.reservation_card.reservation_id,
						clickedButton: "viewBillButton",
						userId: $scope.guestCardData.userId
					});
				}
			};

			$scope.modifyCheckinCheckoutTime = function () {
				var updateSuccess = function updateSuccess(data) {
					$scope.$emit('hideLoader');
					if ($scope.reservationParentData.checkinTime.hh !== '' && $scope.reservationParentData.checkinTime.mm !== '') {
						$scope.reservationData.reservation_card.arrival_time = $scope.reservationParentData.checkinTime.hh + ":" + ($scope.reservationParentData.checkinTime.mm !== '' ? $scope.reservationParentData.checkinTime.mm : '00') + " " + $scope.reservationParentData.checkinTime.ampm;
					} else {
						$scope.reservationData.reservation_card.arrival_time = null;
					}
					if ($scope.reservationParentData.checkoutTime.hh !== '' && $scope.reservationParentData.checkoutTime.mm !== '') {
						$scope.reservationData.reservation_card.departure_time = $scope.reservationParentData.checkoutTime.hh + ":" + ($scope.reservationParentData.checkoutTime.mm !== '' ? $scope.reservationParentData.checkoutTime.mm : '00') + " " + $scope.reservationParentData.checkoutTime.ampm;
					} else {
						$scope.reservationData.reservation_card.departure_time = null;
					}
				};
				var updateFailure = function updateFailure(data) {
					$scope.errorMessage = data;
					$scope.$emit('hideLoader');
				};

				if ($scope.reservationParentData.checkinTime.hh !== '' && $scope.reservationParentData.checkinTime.mm !== '' || $scope.reservationParentData.checkoutTime.hh !== '' && $scope.reservationParentData.checkoutTime.mm !== '' || $scope.reservationParentData.checkinTime.hh === '' && $scope.reservationParentData.checkinTime.mm === '' || $scope.reservationParentData.checkoutTime.hh === '' && $scope.reservationParentData.checkoutTime.mm === '') {
					var postData = $scope.computeReservationDataforUpdate(true);
					// CICO-11705

					postData.reservationId = $scope.reservationParentData.reservationId;
					$scope.invokeApi(RVReservationSummarySrv.updateReservation, postData, updateSuccess, updateFailure);
				}
			};
			/**
    * we are capturing model opened to add some class mainly for animation
    */
			$rootScope.$on('ngDialog.opened', function (e, $dialog) {
				// to add stjepan's popup showing animation
				$rootScope.modalOpened = false;
				$timeout(function () {
					$rootScope.modalOpened = true;
				}, 300);
			});
			$rootScope.$on('ngDialog.closing', function (e, $dialog) {
				// to add stjepan's popup showing animation
				$rootScope.modalOpened = false;
			});

			$scope.closeAddOnPopup = function () {
				// to add stjepan's popup showing animation
				$rootScope.modalOpened = false;
				$timeout(function () {
					ngDialog.close();
				}, 300);
			};

			$scope.showAddNewPaymentModel = function (swipedCardData) {

				var passData = {
					"reservationId": $scope.reservationData.reservation_card.reservation_id,
					"guest_id": $scope.data.guest_details.user_id,
					"details": {
						"firstName": $scope.data.guest_details.first_name,
						"lastName": $scope.data.guest_details.last_name,
						"hideDirectBill": true
					}
				};
				var paymentData = $scope.reservationData;

				if (swipedCardData !== undefined) {
					var swipeOperationObj = new SwipeOperation();
					var swipedCardDataToRender = swipeOperationObj.createSWipedDataToRender(swipedCardData);

					passData.details.swipedDataToRenderInScreen = swipedCardDataToRender;
					if (swipedCardDataToRender.swipeFrom !== "depositBalance" && swipedCardDataToRender.swipeFrom !== "cancelReservationPenalty" && swipedCardDataToRender.swipeFrom !== "stayCardDeposit") {
						console.info('doing open pmt window with pass data');
						if (swipedCardDataToRender.swipeFrom === 'guestCard') {
							passData.isFromGuestCard = true;
						}
						// close any ngDialogs if opened (work around fix)
						ngDialog.close($rootScope.LastngDialogId, "");

						$scope.openPaymentDialogModal(passData, paymentData);
					} else if (swipedCardDataToRender.swipeFrom === "stayCardDeposit") {
						$scope.$broadcast('SHOW_SWIPED_DATA_ON_STAY_CARD_DEPOSIT_SCREEN', swipedCardDataToRender);
					} else if (swipedCardDataToRender.swipeFrom === "depositBalance") {
						$scope.$broadcast('SHOW_SWIPED_DATA_ON_DEPOSIT_BALANCE_SCREEN', swipedCardDataToRender);
					} else {
						$scope.$broadcast('SHOW_SWIPED_DATA_ON_CANCEL_RESERVATION_PENALTY_SCREEN', swipedCardDataToRender);
					}
				} else {
					passData.details.swipedDataToRenderInScreen = {};
					$scope.openPaymentDialogModal(passData, paymentData);
				}
			};

			$scope.showDiaryScreen = function () {
				RVReservationCardSrv.checkinDateForDiary = $scope.reservationData.reservation_card.arrival_date.replace(/-/g, '/');
				$state.go('rover.diary', {
					reservation_id: $scope.reservationData.reservation_card.reservation_id,
					checkin_date: $scope.reservationData.reservation_card.arrival_date,
					is_nightly_reservation: !$scope.reservationData.reservation_card.is_hourly_reservation
				});
			};

			$scope.handleAddonsOnReservation = function (isPackageExist) {
				$scope.addonPopUpData = {
					addonPostingMode: 'staycard',
					cancelLabel: "Cancel",
					saveLabel: "Save",
					shouldShowAddMoreButton: true,
					number_of_adults: $scope.reservationData.reservation_card.number_of_adults,
					number_of_children: $scope.reservationData.reservation_card.number_of_children,
					duration_of_stay: $scope.packageData.duration_of_stay
				};
				if (isPackageExist) {
					ngDialog.open({
						template: '/assets/partials/packages/showPackages.html',
						controller: 'RVReservationPackageController',
						scope: $scope
					});
				} else {
					$state.go('rover.reservation.staycard.mainCard.addons', {
						'from_date': $scope.reservation.reservation_card.arrival_date,
						'to_date': $scope.reservation.reservation_card.departure_date,
						'is_active': true,
						'is_not_rate_only': true,
						'from_screen': 'staycard'

					});
				}
			};
			// CICO-13907
			$scope.hasAnySharerCheckedin = function () {
				var isSharerCheckedin = false;

				angular.forEach($scope.reservationData.reservation_card.sharer_information, function (sharer, key) {
					if (sharer.reservation_status === 'CHECKEDIN' || sharer.reservation_status === 'CHECKING_OUT') {
						isSharerCheckedin = true;
						return false;
					}
				});
				return isSharerCheckedin;
			};

			$scope.responseValidation = {};

			$scope.editStayDates = function () {
				// reservation_id, arrival_date, departure_date
				$scope.errorMessage = "";

				var onValidationSuccess = function onValidationSuccess(response) {

					$scope.responseValidation = {};
					if (response.errors.length === 0) {
						$scope.responseValidation = response.data;
						// CICO-39997 - Check the group reservation date is outside the group date only for standalone
						$scope.stayDatesExtendedForOutsideGroup = response.data.is_group_reservation && response.data.outside_group_stay_dates && $rootScope.isStandAlone ? true : false;
						$scope.borrowForGroups = response.data.is_group_reservation && !response.data.is_room_type_available ? true : false;
						// if user has over book permission, allow to extend even when room type not available CICO-35615
						$scope.shouldAllowDateExtend = response.data.is_room_type_available || rvPermissionSrv.getPermissionValue('OVERBOOK_ROOM_TYPE') ? true : false;
						$scope.showNotAvailableMessage = !response.data.is_room_type_available && !rvPermissionSrv.getPermissionValue('OVERBOOK_ROOM_TYPE') ? true : false;

						// CICO-36733
						$scope.showOverBookingAlert = !response.data.is_room_type_available && response.data.is_house_available && rvPermissionSrv.getPermissionValue('OVERBOOK_ROOM_TYPE');
						$scope.showChangeDatesPopup = !rvPermissionSrv.getPermissionValue('OVERBOOK_ROOM_TYPE') || response.data.is_room_type_available || !response.data.is_house_available;
						// CICO-44842 Show message when trying to overbook a suite reservation
						$scope.restrictSuiteOverbooking = !response.data.is_room_type_available && response.data.is_suite_reservation;
						$scope.isSuiteReservation = response.data.is_suite_reservation;
						$scope.routingInfo = response.data.routing_info;

						// CICO-71977 - Borrow from house for a group reservation
						if (response.results.status === RESPONSE_STATUS_470 && response.results.is_borrowed_from_house) {
							var results = response.results;

							$scope.borrowData = {};

							if (!results.room_overbooked && !results.house_overbooked) {
								$scope.borrowData.isBorrowFromHouse = true;
							}

							if (results.room_overbooked && !results.house_overbooked) {
								$scope.borrowData.shouldShowOverBookBtn = $scope.hasOverBookRoomTypePermission;
								$scope.borrowData.isRoomTypeOverbooked = true;
							} else if (!results.room_overbooked && results.house_overbooked) {
								$scope.borrowData.shouldShowOverBookBtn = $scope.hasOverBookHousePermission;
								$scope.borrowData.isHouseOverbooked = true;
							} else if (results.room_overbooked && results.house_overbooked) {
								$scope.borrowData.shouldShowOverBookBtn = $scope.hasOverBookRoomTypePermission && $scope.hasOverBookHousePermission;
								$scope.borrowData.isHouseAndRoomTypeOverbooked = true;
							}

							ngDialog.open({
								template: '/assets/partials/common/group/rvGroupBorrowPopup.html',
								className: '',
								closeByDocument: false,
								closeByEscape: true,
								scope: $scope
							});
						} else {
							ngDialog.open({
								template: '/assets/partials/reservation/alerts/editDatesInStayCard.html',
								className: '',
								scope: $scope,
								data: JSON.stringify({
									is_stay_cost_changed: response.data.is_stay_cost_changed,
									is_assigned_room_available: response.data.is_room_available,
									is_rate_available: response.data.is_room_type_available,
									is_group_reservation: response.data.is_group_reservation,
									is_outside_group_stay_dates: response.data.outside_group_stay_dates,
									group_name: response.data.group_name,
									is_invalid_move: response.data.is_invalid_move,
									is_house_available: !!response.data.is_house_available
								})
							});
						}
					} else {
						$scope.responseValidation = {};
						$scope.errorMessage = response.errors;
					}

					$scope.$emit('hideLoader');
				},
				    onValidationFaliure = function onValidationFaliure(error) {
					$scope.$emit('hideLoader');
				};

				$scope.invokeApi(RVReservationCardSrv.validateStayDateChange, {
					arrival_date: $filter('date')(tzIndependentDate($scope.editStore.arrival), 'yyyy-MM-dd'),
					dep_date: $filter('date')(tzIndependentDate($scope.editStore.departure), 'yyyy-MM-dd'),
					reservation_id: $scope.reservationData.reservation_card.reservation_id
				}, onValidationSuccess, onValidationFaliure);
			};

			// Close borrow popup
			$scope.closeBorrowPopup = function (shouldClearData) {
				if (shouldClearData) {
					$scope.borrowData = {};
				}
				ngDialog.close();
			};

			// Handles the borrow action
			$scope.performBorrowFromHouse = function () {
				if ($scope.borrowData.isBorrowFromHouse) {
					RVReservationStateService.setForceOverbookFlagForGroup(true);
					$scope.clickedOnStayDateChangeConfirmButton();
					$scope.closeBorrowPopup(true);
				} else {
					$scope.closeBorrowPopup();
					ngDialog.open({
						template: '/assets/partials/common/group/rvGroupOverbookPopup.html',
						className: '',
						closeByDocument: false,
						closeByEscape: true,
						scope: $scope
					});
				}
			};

			// Closes the current borrow dialog
			$scope.closeOverbookPopup = function () {
				$scope.borrowData = {};
				ngDialog.close();
			};

			// Perform overbook
			$scope.performOverBook = function () {
				RVReservationStateService.setForceOverbookFlagForGroup(true);
				$scope.clickedOnStayDateChangeConfirmButton();
				$scope.closeOverbookPopup();
			};

			$scope.moveToRoomRates = function () {

				var initStayDates = function initStayDates(roomNumber) {
					if (roomNumber === 0) {
						$scope.reservationParentData.stayDays = [];
					}
					for (var d = [], ms = new tzIndependentDate($scope.reservationParentData.arrivalDate) * 1, last = new tzIndependentDate($scope.reservationParentData.departureDate) * 1; ms <= last; ms += 24 * 3600 * 1000) {
						if (roomNumber === 0) {
							$scope.reservationParentData.stayDays.push({
								date: dateFilter(new tzIndependentDate(ms), 'yyyy-MM-dd'),
								dayOfWeek: dateFilter(new tzIndependentDate(ms), 'EEE'),
								day: dateFilter(new tzIndependentDate(ms), 'dd')
							});
						}
						$scope.reservationParentData.rooms[roomNumber].stayDates[dateFilter(new tzIndependentDate(ms), 'yyyy-MM-dd')] = {
							guests: {
								adults: parseInt($scope.reservationParentData.rooms[roomNumber].numAdults),
								children: parseInt($scope.reservationParentData.rooms[roomNumber].numChildren),
								infants: parseInt($scope.reservationParentData.rooms[roomNumber].numInfants)
							},
							rate: {
								id: "",
								name: ""
							}
						};
					};
				};

				var arrivalDate = tzIndependentDate($scope.editStore.arrival),
				    departureDate = tzIndependentDate($scope.editStore.departure);

				$scope.reservationParentData.arrivalDate = $filter('date')(arrivalDate, 'yyyy-MM-dd');
				$scope.reservationParentData.departureDate = $filter('date')(departureDate, 'yyyy-MM-dd');
				$scope.reservationParentData.numNights = Math.floor((Date.parse(departureDate) - Date.parse(arrivalDate)) / 86400000);
				initStayDates(0);
				getReservationPackageDetails();
				navigateToRoomAndRates($filter('date')(tzIndependentDate($scope.editStore.arrival), 'yyyy-MM-dd'), $filter('date')(tzIndependentDate($scope.editStore.departure), 'yyyy-MM-dd'));
				$scope.closeDialog();
			};

			var getReservationPackageDetails = function getReservationPackageDetails() {

				var roomData = $scope.$parent.reservationData.rooms[0];

				// Reset addons package
				roomData.addons = [];

				angular.forEach($scope.packageData.existing_packages, function (addon) {
					roomData.addons.push({
						quantity: addon.addon_count,
						id: addon.id,
						price: parseFloat(addon.amount),
						amountType: addon.amount_type,
						postType: addon.post_type,
						title: addon.name,
						totalAmount: addon.addon_count * parseFloat(addon.amount),
						is_inclusive: addon.is_inclusive,
						taxes: addon.taxes,
						is_rate_addon: addon.is_rate_addon,
						allow_rate_exclusion: addon.allow_rate_exclusion,
						excluded_rate_ids: addon.excluded_rate_ids
					});
				});
			};

			var alertAddonOverbooking = function alertAddonOverbooking(close) {
				var addonIndex = 0,
				    timer = 0;

				if (close) {
					$scope.closeDialog();
					timer = 1500;
				}
				$timeout(function () {
					for (; addonIndex < $scope.responseValidation.addons_to_overbook.length; addonIndex++) {
						var addon = $scope.responseValidation.addons_to_overbook[addonIndex];

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
					if (addonIndex === $scope.responseValidation.addons_to_overbook.length) {
						$scope.changeStayDates({
							skipAddonCheck: true
						});
					}
				}, timer);
			};

			$scope.selectAddon = function () {
				alertAddonOverbooking(true);
			};
			/**
          * Shows pop up to remind update the billing info
          *  @params none
          * @returns void
          */
			$scope.showBillingInformationPrompt = function () {
				ngDialog.close();
				ngDialog.open({
					template: '/assets/partials/reservation/alerts/rvShowBillingInformationPopup.html',
					className: '',
					closeByDocument: false,
					scope: $scope
				});
			};
			/**
    * Update the billing information when stay range changes if any billing info exist
    * @params none
    * @returns void
    */
			$scope.updateBillingInformation = function () {
				var postParams = {
					'from_date': $filter('date')(tzIndependentDate($scope.editStore.arrival), 'yyyy-MM-dd'),
					'to_date': $filter('date')(tzIndependentDate($scope.editStore.departure), 'yyyy-MM-dd'),
					'reservation_id': $scope.reservationData.reservation_card.reservation_id
				};

				$scope.callAPI(RVReservationSummarySrv.updateBillingInformation, {
					params: postParams,
					successCallBack: $scope.closeBillingInfoPopup
				});
			};
			/**
    * Handle click on staydate change confirm button
    * @params none
    * @returns void
    */
			$scope.clickedOnStayDateChangeConfirmButton = function () {
				var routingInfo = $scope.routingInfo;

				if (routingInfo.incoming_from_room || routingInfo.out_going_to_room || routingInfo.out_going_to_comp_tra) {
					$scope.showBillingInformationPrompt();
				} else {
					$scope.closeBillingInfoPopup();
				}
			};
			/**
    * Close the dailoge and proceed to change stay date process.
    * @params none
    * @returns void
    */
			$scope.closeBillingInfoPopup = function () {
				ngDialog.close();
				$scope.changeStayDates();
			};

			$scope.changeStayDates = function (flags) {

				if (!flags || !flags.skipAddonCheck) {
					if (!!$scope.responseValidation.new_stay_dates && $scope.responseValidation.new_stay_dates.length > 0 && $scope.responseValidation.addons_to_overbook && $scope.responseValidation.addons_to_overbook.length > 0) {
						alertAddonOverbooking(true);
						return false;
					}
				}

				var newArrivalDate = $filter('date')(tzIndependentDate($scope.editStore.arrival), 'yyyy-MM-dd');
				var newDepartureDate = $filter('date')(tzIndependentDate($scope.editStore.departure), 'yyyy-MM-dd');
				var existingStayDays = $scope.reservationParentData.rooms[0].stayDates;
				var modifiedStayDays = $scope.responseValidation.new_stay_dates || [];
				var newStayDates = {};

				for (var d = [], ms = new tzIndependentDate(newArrivalDate) * 1, last = new tzIndependentDate(newDepartureDate) * 1; ms <= last; ms += 24 * 3600 * 1000) {
					var currentDate = $filter('date')(tzIndependentDate(ms), 'yyyy-MM-dd');
					var isModifiedCurrentDate = _.filter(modifiedStayDays, function (row) {
						return row.reservation_date === currentDate;
					});

					if (!!existingStayDays[currentDate] && isModifiedCurrentDate.length === 0) {
						newStayDates[currentDate] = existingStayDays[currentDate];
					} else {
						// go to take information from the new_stay_dates coming from the API response

						var newDateDetails = _.where(modifiedStayDays, {
							reservation_date: currentDate
						})[0];

						newStayDates[currentDate] = {
							guests: {
								adults: newDateDetails.adults,
								children: newDateDetails.children,
								infants: newDateDetails.infants || 0
							},
							rate: {
								id: newDateDetails.rate_id
							},
							rateDetails: {
								actual_amount: newDateDetails.rate_amount,
								modified_amount: newDateDetails.rate_amount
							},
							roomTypeId: newDateDetails.room_type_id
						};
					}
				}

				// change the reservationData model to have the newer values
				$scope.reservationParentData.numNights = Math.floor((Date.parse(newDepartureDate) - Date.parse(newArrivalDate)) / 86400000);
				$scope.reservationParentData.arrivalDate = newArrivalDate;
				$scope.reservationParentData.departureDate = newDepartureDate;
				$scope.reservationParentData.rooms[0].stayDates = newStayDates;

				// If it is a group reservation, which has extended the stay beyond the group staydates, then we will be taking the user to the room and rates screen after confirming the staydates
				if ($scope.stayDatesExtendedForOutsideGroup) {
					var stateParams = {
						from_date: $scope.reservationParentData.arrivalDate,
						to_date: $scope.reservationParentData.departureDate,
						fromState: $state.current.name,
						company_id: $scope.$parent.reservationData.company.id,
						travel_agent_id: $scope.$parent.reservationData.travelAgent.id
					};

					RVReservationStateService.setReservationFlag('outsideStaydatesForGroup', true);
					$scope.saveReservation(roomAndRatesState, stateParams);
				} else {
					$scope.saveReservation('rover.reservation.staycard.reservationcard.reservationdetails', {
						"id": $stateParams.id,
						"confirmationId": $stateParams.confirmationId,
						"isrefresh": false
					});
				}

				$scope.closeDialog();
			};

			// reverse checkout process-
			// show room already occupied popup
			var openRoomOccupiedPopup = function openRoomOccupiedPopup() {
				ngDialog.open({
					template: '/assets/partials/reservation/alerts/rvReverseNotPossible.html',
					className: '',
					scope: $scope,
					data: JSON.stringify($scope.reverseCheckoutDetails.data)
				});
			};

			if ($scope.reverseCheckoutDetails.data.is_reverse_checkout_failed) {
				openRoomOccupiedPopup();
				$scope.initreverseCheckoutDetails();
			};

			$rootScope.$on('SETPREV_RESERVATION', function (evt, fullname) {
				setNavigationBookMark();
				$rootScope.setPrevState = {
					title: fullname
				};
			});

			// CICO-17067 PMS: Rover - Stay Card: Add manual authorization
			// CICO-24426 - multiple authorizations
			$scope.authData = {

				'authAmount': '0.00',
				'manualCCAuthPermission': true,
				'billData': [],
				'isManual': false,
				'manualAuthCode': '',
				'selectedCardDetails': { // To keep the selected/active card details
					'name': '', // card - name
					'number': '', // card - number
					'payment_id': '', // card - payment method id
					'last_auth_date': '', // card - last autheticated date
					'bill_no': '', // bill - number
					'bill_balance': '' // bill - balance amount
				}
			};

			// Flag for CC auth permission
			var hasManualCCAuthPermission = function hasManualCCAuthPermission() {
				return rvPermissionSrv.getPermissionValue('MANUAL_CC_AUTH');
			};

			/**
   * Method to show Authentication popup.
   * Fetching cards data before showing the popup.
   */
			$scope.showAuthAmountPopUp = function () {

				var fetchCreditCardAuthInfoSuccess = function fetchCreditCardAuthInfoSuccess(data) {
					sntActivity.stop('FETCH_AUTH_DETAILS');
					$scope.$emit('hideLoader');
					$scope.authData.manualCCAuthPermission = hasManualCCAuthPermission();
					$scope.authData.billData = _.sortBy(data.bill_data, function (cc_info) {
						if (cc_info.number === 'N/A') {
							return 100;
						}
						return parseInt(cc_info.number);
					});

					if ($scope.authData.billData.length > 0) {
						// Show Multiple Credit card auth popup
						ngDialog.open({
							template: '/assets/partials/authorization/rvManualAuthorizationPopup.html',
							className: '',
							closeByEscape: false,
							closeByDocument: false,
							scope: $scope
						});
						// Default to select the first CC as active one.
						$scope.selectCCforAuth(0);
						if ($rootScope.hotelDetails.payment_gateway === 'SHIJI' && $rootScope.hotelDetails.shiji_token_enable_offline) {
							$scope.authData.manualAuthCode = $scope.authData.billData[0].last_authorization.code;
						}
						// Handle scroller
						var scrollerOptions = { preventDefault: false };

						$scope.setScroller('cardsList', scrollerOptions);
						$scope.refreshScroller('cardsList');
					} else {
						console.warn("There should be atleast one credit card needed");
						$scope.closeDialog();
					}
					$scope.showRightContentForMobile = false;
				};

				var fetchCreditCardAuthInfoFaliure = function fetchCreditCardAuthInfoFaliure(errorMessage) {
					sntActivity.stop('FETCH_AUTH_DETAILS');
					$scope.$emit('hideLoader');
					$scope.errorMessage = errorMessage;
				};

				// CICO-28042 - Flag added to show/hide between credit card and
				// auth release for credit card sections
				$scope.hasShownReleaseConfirm = false;

				var data = {
					"reservation_id": $scope.reservationData.reservation_card.reservation_id
				};
				sntActivity.start('FETCH_AUTH_DETAILS');
				$scope.invokeApi(RVCCAuthorizationSrv.fetchCreditCardAuthInfo, data, fetchCreditCardAuthInfoSuccess, fetchCreditCardAuthInfoFaliure);
			};

			/**
   * Method to hanlde each credit card click.
   * @param {int} index of the selected card
   */
			$scope.selectCCforAuth = function (index) {
				var selectedCardData = $scope.authData.billData[index];
				var selectedCardDetails = {
					'name': selectedCardData.card_name,
					'number': selectedCardData.card_number,
					'payment_id': selectedCardData.payment_method_id,
					'last_auth_date': selectedCardData.last_authorization.date ? selectedCardData.last_authorization.date : '',
					'bill_no': selectedCardData.number,
					'bill_balance': selectedCardData.balance ? parseFloat(selectedCardData.balance).toFixed(2) : 0.00
				};

				$scope.authData.selectedCardDetails = selectedCardDetails;

				_.each($scope.authData.billData, function (card) {
					card.active = false;
				});
				$scope.authData.billData[index].active = true;
			};

			// To set right content for mobile view
			$scope.onSelectCCforAuth = function () {
				$scope.showRightContentForMobile = true;
			};

			// To set left content for mobile view
			$scope.setLeftSideContent = function () {
				$scope.showRightContentForMobile = false;
			};

			var authInProgress = function authInProgress() {
				// Manual auth in progress status
				$scope.isInProgressScreen = true;
				$scope.isSuccessScreen = false;
				$scope.isFailureScreen = false;
				$scope.isCCAuthPermission = true;
			};

			var authSuccess = function authSuccess(data) {
				// With Authorization flow .: Auth success
				$scope.isInProgressScreen = false;
				$scope.isSuccessScreen = true;
				$scope.isFailureScreen = false;
				$scope.cc_auth_amount = $scope.authData.authAmount;
				$scope.cc_auth_code = data.auth_code;
				$scope.reservationData.reservation_card.payment_details.auth_color_code = 'green';
			};

			var authFailure = function authFailure() {
				// With Authorization flow .: Auth declined
				$scope.isInProgressScreen = false;
				$scope.isSuccessScreen = false;
				$scope.isFailureScreen = true;
				$scope.cc_auth_amount = $scope.authData.authAmount;
				$scope.reservationData.reservation_card.payment_details.auth_color_code = 'red';
			};

			// Manual Auth API call ..
			var manualAuthAPICall = function manualAuthAPICall() {

				var onAuthorizationSuccess = function onAuthorizationSuccess(response) {
					$scope.$emit('hideLoader');
					authSuccess(response);
					if ($scope.authData.isManual || $rootScope.hotelDetails.payment_gateway === 'SHIJI' && $rootScope.hotelDetails.shiji_token_enable_offline) {
						$scope.authData.isManual = false; // reset 
						$scope.authData.authAmount = ''; // reset
						if ($rootScope.hotelDetails.payment_gateway === 'SHIJI' && $rootScope.hotelDetails.shiji_token_enable_offline) {
							$scope.authData.manualAuthCode = response.auth_code;
						} else {
							$scope.authData.manualAuthCode = ''; // reset
						}
						ngDialog.close(); // reload popup with new data from the API
						$scope.showAuthAmountPopUp();
					}
				};

				var onAuthorizationFaliure = function onAuthorizationFaliure(errorMessage) {
					$scope.$emit('hideLoader');
					if ($scope.authData.isManual) {
						ngDialog.close(); // close the initial popup and display error
						$scope.isCCAuthPermission = true;
						ngDialog.open({
							template: '/assets/partials/authorization/rvManualAuthorizationProcess.html',
							className: '',
							closeByDocument: false,
							scope: $scope
						});
					}
					authFailure();
				};

				var postData = {
					"payment_method_id": $scope.authData.selectedCardDetails.payment_id,
					"amount": $scope.authData.authAmount,
					"auth_code": $scope.authData.manualAuthCode,
					"isShift4Request": $rootScope.hotelDetails.payment_gateway === 'SHIFT4'
				};

				if ($scope.authData.isManual) {
					$scope.invokeApi(RVCCAuthorizationSrv.manualVoiceAuth, postData, onAuthorizationSuccess, onAuthorizationFaliure);
				} else {
					$scope.invokeApi(RVCCAuthorizationSrv.manualAuthorization, postData, onAuthorizationSuccess, onAuthorizationFaliure);
				}
			};

			// To handle close/cancel button click after success/declined of auth process.
			$scope.cancelButtonClick = function () {
				$scope.showAuthAmountPopUp();
			};

			$scope.disableAuthorizeButton = function () {
				return $scope.isShijiOfflineAuthCodeEmpty() || !$scope.authData.manualCCAuthPermission || parseFloat($scope.authData.authAmount) <= 0 || $scope.authData.selectedCardDetails.bill_no === 'N/A' || isNaN(parseInt($scope.authData.authAmount));
			};

			// To handle authorize button click on 'auth amount popup' ..
			$scope.authorize = function () {
				if ($scope.authData.isManual || $rootScope.hotelDetails.payment_gateway === 'SHIJI' && $rootScope.hotelDetails.shiji_token_enable_offline) {
					manualAuthAPICall(); // No need to show Auth in progress message
				} else {
					ngDialog.close(); // Closing the 'auth amount popup' ..

					authInProgress();

					setTimeout(function () {

						ngDialog.open({
							template: '/assets/partials/authorization/rvManualAuthorizationProcess.html',
							className: '',
							closeByDocument: false,
							scope: $scope
						});

						manualAuthAPICall();
					}, 100);
				}
			};

			$scope.isShijiOfflineAuthCodeEmpty = function () {
				if ($rootScope.hotelDetails.payment_gateway === 'SHIJI' && $rootScope.hotelDetails.shiji_token_enable_offline) {
					if (!$scope.authData.manualAuthCode) {
						return true;
					}
				}
				return false;
			};

			// Handle TRY AGAIN on auth failure popup.
			$scope.tryAgain = function () {
				authInProgress();
				manualAuthAPICall();
			};
			// CICO-17067 PMS: Rover - Stay Card: Add manual authorization ends here...

			// >>wakeup call check after guest prefs are fetched
			$scope.$on('wakeup_call_ON', function (evt, data) {
				if (data) {
					$scope.activeWakeUp = data.active;
				}
			});

			$scope.updateGiftCardNumber = function (n) {
				$rootScope.$broadcast('GIFTCARD_DETAILS', n);
			};

			$scope.giftCardAmountAvailable = false;
			$scope.giftCardAvailableBalance = 0;
			$scope.$on('giftCardAvailableBalance', function (e, giftCardData) {
				$scope.giftCardAvailableBalance = giftCardData.amount;
			});
			$scope.timer = null;
			$scope.cardNumberInput = function (n, e) {
				var len = n.length;

				$scope.num = n;
				if (len >= 8 && len <= 22) {
					// then go check the balance of the card
					$('[name=card-number]').keydown(function () {
						clearTimeout($scope.timer);
						$scope.updateGiftCardNumber(n);
						$scope.timer = setTimeout($scope.fetchGiftCardBalance, 1500);
					});
				} else {
					// hide the field and reset the amount stored
					$scope.giftCardAmountAvailable = false;
				}
			};
			$scope.num;
			$scope.fetchGiftCardBalance = function () {
				// if ($scope.depositData.paymentType === 'GIFT_CARD'){
				// switch this back for the UI if the payment was a gift card
				$scope.giftCardAmountAvailable = false;
				var fetchGiftCardBalanceSuccess = function fetchGiftCardBalanceSuccess(giftCardData) {
					$scope.giftCardAvailableBalance = giftCardData.amount;
					$scope.giftCardAmountAvailable = true;
					$scope.$emit('giftCardAvailableBalance', giftCardData);
					// data.expiry_date //unused at this time
					$scope.$emit('hideLoader');
				};

				$scope.invokeApi(RVReservationCardSrv.checkGiftCardBalance, { 'card_number': $scope.num }, fetchGiftCardBalanceSuccess);
				// } else {
				//     $scope.giftCardAmountAvailable = false;
				// }
			};

			var unbindChildContentModListener = $scope.$on('CHILD_CONTENT_MOD', function (event, timer) {
				event.stopPropagation();
				$scope.refreshReservationDetailsScroller(timer || 0);
			});

			$scope.$on('$destroy', unbindChildContentModListener);

			/**
   * Method to invoke when release btn on each authorized cards are clicked
   * @param {object} selected card with auth details
   */
			$scope.onReleaseBtnClick = function (cardData) {
				$scope.selectedCardData = cardData;
				$scope.hasShownReleaseConfirm = true;
			};

			/**
   * Method to invoke while clicking on cancel btn in release confirm section
   */
			$scope.onCancelClick = function () {
				$scope.showRightContentForMobile = false;
				$scope.hasShownReleaseConfirm = false;
			};

			/**
   * Method to release the authorization of a credit card
   * @param {int} payment method id
   */
			$scope.releaseAuthorization = function (paymentMethodId) {
				var onReleaseAuthorizationSuccess = function onReleaseAuthorizationSuccess(response) {
					$scope.$emit('hideLoader');
					$scope.hasShownReleaseConfirm = false;
					$scope.showAuthAmountPopUp();
				};

				var onReleaseAuthorizationFaliure = function onReleaseAuthorizationFaliure(errorMessage) {
					$scope.$emit('hideLoader');
					$scope.errorMessage = errorMessage;
					$scope.hasShownReleaseConfirm = false;
				};

				$scope.errorMessage = "";
				var postData = {
					"payment_method_id": paymentMethodId
				};

				$scope.invokeApi(RVCCAuthorizationSrv.releaseAuthorization, postData, onReleaseAuthorizationSuccess, onReleaseAuthorizationFaliure);
			};

			/*
   * Function which get invoked while clicking the SR  View Rate btn
   */
			$scope.onSRViewRateBtnClick = function () {
				RVReservationStateService.setReservationFlag("isSRViewRateBtnClicked", true);
			};

			/*
   * Checks whether the balance amount section needs to show or not
   */
			$scope.isBalanceAmountShown = function () {
				return !$scope.reservationData.reservation_card.is_rate_suppressed_present_in_stay_dates || RVReservationStateService.getReservationFlag("isSRViewRateBtnClicked");
			};

			/*
   * Checks whether the SR View Rate btn needs to show or not
   */
			$scope.isSRViewRateBtnShown = function () {
				return $scope.isStandAlone && $scope.hasSRViewPermission && $scope.reservationData.reservation_card.is_rate_suppressed_present_in_stay_dates && !RVReservationStateService.getReservationFlag("isSRViewRateBtnClicked");
			};

			/*
   * Checks whether the rate amount needs to show or not
   */
			$scope.isRateAmountShown = function () {
				return $scope.reservationData.reservation_card.is_rates_suppressed == 'false' || RVReservationStateService.getReservationFlag("isSRViewRateBtnClicked");
			};

			/**
   * Toggle the overbooking alert section visibility
   */
			$scope.toggleOverBookingAlert = function () {
				$scope.showOverBookingAlert = !$scope.showOverBookingAlert;
			};

			var retrieveGuestDocDetails = function retrieveGuestDocDetails(guestId) {
				var guestIdInfo = _.find(guestIdList, function (guestIdData) {
					return guestIdData.guest_id === guestId;
				});

				return guestIdInfo;
			};

			$scope.isIdRequiredForGuest = function (guest, isPrimaryGuest) {
				if (isPrimaryGuest) {
					return $scope.hotelDetails.id_collection.rover.enabled && !$scope.isGuestIdUploaded(guest, true);
				}
				return $scope.hotelDetails.id_collection.rover.enabled && $scope.hotelDetails.id_collection.rover.scan_all_guests && !$scope.isGuestIdUploaded(guest, false);
			};

			$scope.isGuestIdUploaded = function (guest, isPrimaryGuest) {

				var guestId = isPrimaryGuest ? $scope.reservationParentData.guest.id : guest.id;
				var uploadedIdDetails = retrieveGuestDocDetails(guestId);
				var isGuestIdUploaded = uploadedIdDetails && uploadedIdDetails.front_image_data && !uploadedIdDetails.id_proof_expired;

				return isGuestIdUploaded;
			};

			$scope.isGuestIdRequiredForCheckin = function () {
				if (!$scope.hotelDetails.id_collection.rover.enabled) {
					return false;
				}
				if ($scope.guestData && !$scope.isGuestIdUploaded($scope.guestData.primary_guest_details, true)) {
					return true;
				}
				if (!$scope.hotelDetails.id_collection.rover.scan_all_guests) {
					return false;
				}
				var guestIdRequired = false;
				if ($scope.guestData) {
					_.each($scope.guestData.accompanying_guests_details, function (guestInfo) {
						if (!$scope.isGuestIdUploaded(guestInfo, false)) {
							guestIdRequired = true;
						}
					});
				}

				return guestIdRequired;
			};

			$scope.continueToCheckinAfterIdScan = function () {
				$scope.$broadcast('PROCEED_CHECKIN');
			};

			/*
       * Clicked skip ID scan and thus record actions in activity logs and proceed checkin
       */
			$scope.continueToCheckinAfterSkipIdScan = function () {
				var dataToApi = {
					id: $scope.reservationData.reservation_card.reservation_id,
					action_type: 'ID_DETAILS',
					details: [{
						key: 'Skipped ID Scan',
						new_value: true
					}]
				};
				$scope.invokeApi(RVReservationCardSrv.createActivityLog, dataToApi, function (data) {
					$scope.$broadcast('PROCEED_CHECKIN');
				});
			};

			$scope.showScannedGuestID = function (isPrimaryGuest, guestData) {

				$scope.$emit('hideLoader');
				guestData = guestData ? guestData : {};

				var guestId = isPrimaryGuest ? $scope.reservationParentData.guest.id : guestData.id;
				var guestDocData = retrieveGuestDocDetails(guestId);

				if (!$scope.hasGuestIDPermission) {
					return;
				} else if (guestDocData) {
					guestDocData.guest_id = guestId;
					guestDocData.is_primary_guest = isPrimaryGuest;
					$scope.guestIdData = angular.copy(guestDocData);
				} else {
					$scope.guestIdData = {
						'last_name': '',
						'first_name': '',
						'date_of_birth': '',
						'nationality_id': '',
						'document_number': '',
						'expiration_date': '',
						'guest_id': guestId,
						'back_image_data': '',
						'front_image_data': '',
						'signature': '',
						'is_manual_upload': true,
						'is_primary_guest': isPrimaryGuest
					};
				}

				try {
					angular.module("sntIDCollection");
				} catch (err) {
					$ocLazyLoad.inject('sntIDCollection');
				}

				ngDialog.open({
					template: '/assets/partials/guestId/rvGuestId.html',
					className: 'guest-id-dialog',
					controller: 'rvGuestIdScanCtrl',
					scope: $scope
				});
			};

			$scope.$on('ON_GUEST_ID_POPUP_CLOSE', function () {
				fetchGuestIDs();
			});

			var buildGuestInfo = function buildGuestInfo(guestDocData) {
				var firstName = _.isEmpty(guestDocData.first_name) ? '' : guestDocData.first_name;
				var lastName = _.isEmpty(guestDocData.last_name) ? '' : guestDocData.last_name;
				var docExpiry = _.isEmpty(guestDocData.expiration_date) ? '' : guestDocData.expiration_date;
				var guestInfo = $filter('translate')('GUEST_FIRST_NAME') + ": " + firstName + "\r\n" + $filter('translate')('GUEST_LAST_NAME') + ": " + lastName + "\r\n" + $filter('translate')('DOB') + ": " + guestDocData.date_of_birth + "\r\n" + $filter('translate')('NATIONALITY') + ": " + guestDocData.nationality + "\r\n" + $filter('translate')('ID_NUMBER') + ": " + guestDocData.document_number + "\r\n";

				if (guestDocData.id_scan_info && guestDocData.id_scan_info.personal_id_no) {
					guestInfo = guestInfo + $filter('translate')('PERSONAL_NUMBER') + ": " + guestDocData.id_scan_info.personal_id_no + "\r\n";
				}
				guestInfo = guestInfo + $filter('translate')('ID_EXPIRY') + ": " + docExpiry;

				return guestInfo;
			};

			$scope.dowloadDocumnetDetails = function (guestData, isPrimaryGuest) {
				var guestId = isPrimaryGuest ? $scope.reservationParentData.guest.id : guestData.id;
				var guestDocData = retrieveGuestDocDetails(guestId);

				guestDocData.first_name = guestDocData.first_name ? guestDocData.first_name : guestData.first_name;
				guestDocData.last_name = guestDocData.last_name ? guestDocData.last_name : guestData.last_name;

				var zip = new JSZip();
				var createImageFile = function createImageFile(image, imageFileName) {
					if (image && image.length > 0) {
						zip.file(imageFileName, image.split(',')[1], {
							base64: true
						});
					}
				};
				var fileNamePrefix;

				if (_.isEmpty(guestDocData.last_name)) {
					fileNamePrefix = guestDocData.first_name;
				} else if (_.isEmpty(guestDocData.first_name)) {
					fileNamePrefix = guestDocData.last_name;
				} else if (_.isEmpty(guestDocData.first_name) && _.isEmpty(guestDocData.last_name)) {
					fileNamePrefix = 'document';
				} else {
					fileNamePrefix = guestDocData.first_name + '-' + guestDocData.last_name;
				}
				// Add the guest details to a txt file
				zip.file(fileNamePrefix + "-info.txt", buildGuestInfo(guestDocData));

				createImageFile(guestDocData.front_image_data, fileNamePrefix + "-ID.png");
				createImageFile(guestDocData.back_image_data, fileNamePrefix + "-ID-back-side.png");
				createImageFile(guestDocData.signature, fileNamePrefix + "-signature.png");

				zip.generateAsync({
					type: "blob"
				}).then(function (blob) {
					saveAs(blob, fileNamePrefix + ".zip");
				});
			};

			$scope.navigateToAddons = function () {
				ngDialog.close();
				$state.go('rover.reservation.staycard.mainCard.addons', {
					'from_date': $scope.reservation.reservation_card.arrival_date,
					'to_date': $scope.reservation.reservation_card.departure_date,
					'is_active': true,
					'is_not_rate_only': true,
					'from_screen': 'staycard'
				});
			};

			var saveAddonPosting = function saveAddonPosting(selectedPurchesedAddon) {

				var addonPostingSaveSuccess = function addonPostingSaveSuccess(data) {
					$scope.$emit('hideLoader');
					fetchAddonsDetails();
				};

				var dataToApi = {
					'addon_id': selectedPurchesedAddon.id,
					'reservation_id': $scope.reservationData.reservation_card.reservation_id,
					'post_instances': selectedPurchesedAddon.post_instances,
					'start_date': $filter('date')(tzIndependentDate(selectedPurchesedAddon.start_date), $rootScope.dateFormatForAPI),
					'end_date': $filter('date')(tzIndependentDate(selectedPurchesedAddon.end_date), $rootScope.dateFormatForAPI),
					'selected_post_days': selectedPurchesedAddon.selected_post_days
				};

				$scope.invokeApi(RVReservationPackageSrv.updateAddonPosting, dataToApi, addonPostingSaveSuccess);
			};

			var removeSelectedAddons = function removeSelectedAddons(index, addonId) {

				var reservationId = $scope.reservationData.reservation_card.reservation_id;

				var successDelete = function successDelete() {
					$scope.$emit('hideLoader');
					$scope.packageData.existing_packages.splice(index, 1);
					$scope.addonsData.existingAddons.splice(index, 1);
					$scope.reservationData.reservation_card.package_count = parseInt($scope.reservationData.reservation_card.package_count) - parseInt(1);
					if ($scope.reservationData.reservation_card.package_count === 0) {
						$scope.reservationData.reservation_card.is_package_exist = false;
					}
					shouldReloadState = true;
				},
				    failureCallBack = function failureCallBack(errorMessage) {
					$scope.errorMessage = errorMessage;
				},
				    addonArray = [];

				addonArray.push(addonId);
				var dataToApi = {
					"postData": {
						"addons": addonArray
					},

					"reservationId": reservationId
				};

				$scope.invokeApi(RVReservationPackageSrv.deleteAddonsFromReservation, dataToApi, successDelete, failureCallBack);
			};

			$scope.$on('PRIMARY_GUEST_ID_CHANGED', function (event, data) {
				if (data && data.faceImage) {
					$scope.guestData.primary_guest_details.image = data.faceImage;
				}
			});

			var navigateToAddonsListner = $rootScope.$on('NAVIGATE_TO_ADDONS', function (event, data) {
				if (data.addonPostingMode === 'staycard') {
					$scope.navigateToAddons();
				}
			});

			var removeSelectedAddonsListner = $rootScope.$on('REMOVE_ADDON', function (event, data) {
				if (data.addonPostingMode === 'staycard') {
					removeSelectedAddons(data.index, data.addon.id);
				}
			});

			var proceedBookingListner = $scope.$on('PROCEED_BOOKING', function (event, data) {
				if (data.addonPostingMode === 'staycard') {
					saveAddonPosting(data.selectedPurchesedAddon);
				}
			});

			// Should disable arrrival date
			$scope.shouldDisableArrivalDate = function () {
				var disable = false;

				if ($scope.reservationData.reservation_card.reservation_status === 'CHECKEDIN') {
					if (tzIndependentDate($scope.editStore.arrival) <= tzIndependentDate($rootScope.businessDate)) {
						disable = true;
					}
				}

				return disable;
			};

			$scope.$on('$destroy', proceedBookingListner);
			$scope.$on('$destroy', removeSelectedAddonsListner);
			$scope.$on('$destroy', navigateToAddonsListner);

			// CICO-65967
			if ($stateParams.isGroupDetachmentRequested) {
				$scope.searchData.groupCard.name = '';
			}
		}]);
	}, {}] }, {}, [1]);