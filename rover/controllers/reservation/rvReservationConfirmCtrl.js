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
		sntRover.controller('RVReservationConfirmCtrl', ['$scope', 'jsMappings', '$state', 'RVReservationSummarySrv', 'ngDialog', 'RVContactInfoSrv', '$filter', 'RVBillCardSrv', '$q', 'RVHkRoomDetailsSrv', '$vault', '$rootScope', 'RVReservationGuestSrv', 'rvPermissionSrv', '$timeout', '$window', function ($scope, jsMappings, $state, RVReservationSummarySrv, ngDialog, RVContactInfoSrv, $filter, RVBillCardSrv, $q, RVHkRoomDetailsSrv, $vault, $rootScope, RVReservationGuestSrv, rvPermissionSrv, $timeout, $window) {

			$scope.errorMessage = '';
			BaseCtrl.call(this, $scope);
			var totalRoomsAvailable = 0;

			$scope.reservationStatus = {
				confirmed: false // flag to show the action button (Go to staycard etc.) after confirming reservation
			};

			$rootScope.setPrevState = {
				title: $filter('translate')('RESERVATION_SUMMARY'),
				name: 'rover.reservation.staycard.mainCard.summaryAndConfirm',
				param: {
					reservation: $scope.reservationData.isHourly ? 'HOURLY' : 'DAILY'
				}
			};

			/**
    * function to check whether the user has permission
    * to make payment
    * @return {Boolean}
    */
			$scope.hasPermissionToMakePayment = function () {
				return rvPermissionSrv.getPermissionValue('MAKE_PAYMENT');
			};

			/**
    * function to determine the visibility of Make Payment button
    * @return {Boolean}
    */
			$scope.hideMakePayment = function () {
				return !$scope.hasPermissionToMakePayment();
			};
			var successCallBackForLanguagesFetch = function successCallBackForLanguagesFetch(data) {
				$scope.$emit('hideLoader');
				$scope.reservationData.languageData = data;
				refreshPageScrollers();
			};

			var refreshPageScrollers = function refreshPageScrollers() {
				$scope.refreshScroller('paymentInfo');
				$scope.refreshScroller('reservationSummary');
			};

			$scope.addListener('REFRESH_SCROLL_SUMMARY', function () {
				refreshPageScrollers();
			});

			/**
    * Fetch the guest languages list and settings
    * @return {undefined}
    */
			var fetchGuestLanguages = function fetchGuestLanguages() {
				var params = { 'reservation_id': $scope.reservationData.reservationId };
				// call api

				$scope.invokeApi(RVContactInfoSrv.fetchGuestLanguages, params, successCallBackForLanguagesFetch);
			};

			$scope.init = function () {
				$scope.heading = 'Reservations';
				$scope.setHeadingTitle($scope.heading);
				$scope.$parent.hideSidebar = true;
				$scope.time = {
					arrival: $scope.reservationData.checkinTime.hh + ':' + $scope.reservationData.checkinTime.mm + ' ' + $scope.reservationData.checkinTime.ampm,
					departure: $scope.reservationData.checkoutTime.hh + ':' + $scope.reservationData.checkoutTime.mm + ' ' + $scope.reservationData.checkoutTime.ampm
				};
				$scope.disableCheckin = true;
				totalRoomsAvailable = 0;
				$scope.isConfirmationEmailSent = $scope.otherData.isGuestPrimaryEmailChecked || $scope.otherData.isGuestAdditionalEmailChecked ? true : false;
				$scope.setScroller('reservationSummary');
				$scope.setScroller('paymentInfo');
				checkAllRoomsAreReady();
				$scope.reservationData.enable_confirmation_custom_text = false;
				fetchGuestLanguages();
				// There are sections in the page that are hidden on load; Hence refreshing scrollers after a second
				$timeout(refreshPageScrollers, 1000);
			};

			/*
    * Get the title for the billing info button,
    * on the basis of routes available or not
    */
			$scope.getBillingInfoTitle = function () {
				if ($scope.reservationData.is_routing_available) {
					return $filter('translate')('BILLING_INFO_TITLE');
				} else {
					return $filter('translate')('ADD_BILLING_INFO_TITLE');
				}
			};

			/**
    * Function to check if the the check-in time is selected by the user.
    * @return {Boolean} true if 'hours', 'minutes', 'primetime' - all are selected.
    */
			$scope.isCheckinTimeSet = function () {
				var ret = false;

				if ($scope.reservationData.checkinTime.hh !== '' && $scope.reservationData.checkinTime.mm !== '' && $scope.reservationData.checkinTime.ampm !== '') {

					ret = true;
				}
				return ret;
			};

			/**
    * Function to check if the the checkout time is selected by the user.
    * @return {Boolean} true if 'hours', 'minutes', 'primetime' - all are selected.
    */
			$scope.isCheckoutTimeSet = function () {
				var ret = false;

				if ($scope.reservationData.checkoutTime.hh !== '' && $scope.reservationData.checkoutTime.mm !== '' && $scope.reservationData.checkoutTime.ampm !== '') {

					ret = true;
				}
				return ret;
			};

			$scope.unflagConfirmation = function () {
				$scope.reservationStatus.confirmed = false;
				$rootScope.setPrevState = {
					title: $filter('translate')('RESERVATION_SUMMARY'),
					name: 'rover.reservation.staycard.mainCard.summaryAndConfirm',
					param: {
						reservation: $scope.reservationData.isHourly ? 'HOURLY' : 'DAILY'
					}
				};
			};

			$scope.confirmationMailsSent = false;

			// add the print orientation after printing
			var addPrintOrientation = function addPrintOrientation() {
				var orientation = 'portrait';

				$('head').append("<style id='print-orientation'>@page { size: " + orientation + "; }</style>");
			};
			// remove the print orientation after printing
			var removePrintOrientation = function removePrintOrientation() {
				$('#print-orientation').remove();
			};

			var printPage = function printPage() {
				// add the orientation
				addPrintOrientation();

				var onPrintCompletion = function onPrintCompletion() {
					$timeout(removePrintOrientation, 100);
				};

				$timeout(function () {
					if (sntapp.cordovaLoaded) {
						cordova.exec(onPrintCompletion, function () {
							onPrintCompletion();
						}, 'RVCardPlugin', 'printWebView', []);
					} else {
						$window.print();
						onPrintCompletion();
					}
				}, 100);
			};

			$scope.printData = {};
			var sucessCallbackPrint = function sucessCallbackPrint(response) {
				$scope.printData = response.data;
				printPage();
			},
			    failureCallbackPrint = function failureCallbackPrint(errorData) {
				$scope.errorMessage = errorData;
			};

			// To handle printConfirmationReservation button click
			$scope.printConfirmationReservation = function () {
				$scope.callAPI(RVReservationSummarySrv.fetchResservationConfirmationPrintData, {
					successCallBack: sucessCallbackPrint,
					failureCallBack: failureCallbackPrint,
					params: { 'reservation_id': $scope.reservationData.reservationId }
				});
			};

			/**
    * Call API to send the confirmation email
    */
			$scope.sendConfirmationClicked = function (isEmailValid) {

				var updateBackButton = function updateBackButton() {
					$scope.confirmationMailsSent = true;
					var paramsArray = [];
					var rooms = angular.copy($scope.reservationData.rooms);

					_.each(rooms, function (room, index) {
						var validGuests = [];

						_.each(room.accompanying_guest_details, function (guest) {
							_.each(guest, function (guestInfo) {
								if (guestInfo.first_name || guestInfo.last_name) {
									validGuests.push(guestInfo);
								}
							});
						});
						paramsArray.push(validGuests);
					});

					var onupdateSuccess = function onupdateSuccess() {
						$scope.$emit('hideLoader');
						$rootScope.setPrevState = {
							title: $filter('translate')('CONFIRM_RESERVATION'),
							name: 'rover.reservation.staycard.mainCard.reservationConfirm',
							param: {
								confirmationId: $scope.reservationData.confirmNum
							},
							callback: 'unflagConfirmation',
							scope: $scope
						};
					},
					    onUpdateFailure = function onUpdateFailure(errorMessage) {
						$scope.errorMessage = errorMessage;
						$scope.$emit('hideLoader');
					};

					_.each($scope.reservationData.rooms, function (room, index) {
						if (paramsArray[index].length > 0) {
							$scope.invokeApi(RVReservationGuestSrv.updateGuestTabDetails, {
								accompanying_guests_details: paramsArray[index],
								reservation_id: $scope.reservationData.reservationIds && $scope.reservationData.reservationIds[index] || $scope.reservationData.reservationId
							}, onupdateSuccess, onUpdateFailure);
						}
					});
					if (typeof $rootScope.searchData !== "undefined") {
						$rootScope.searchData.guestCard.email = $scope.reservationData.guest.email;
					}
				};

				if ($scope.confirmationMailsSent) {
					updateBackButton();
				} else {

					// skip sending messages if hotel settings doesn't allow.
					if (!$scope.hotelDetails.send_confirmation_letter) {
						$scope.reservationStatus.confirmed = true;
						updateBackButton();
						return false;
					}

					// skip sending messages if no mail id is provided or none of the emails are checked, go to the next screen
					if (!$scope.otherData.additionalEmail && !$scope.reservationData.guest.email || !$scope.otherData.isGuestPrimaryEmailChecked && !$scope.otherData.isGuestAdditionalEmailChecked) {
						$scope.reservationStatus.confirmed = true;
						updateBackButton();
						return false;
					}

					var postData = {};

					postData.reservationId = $scope.reservationData.reservationId;
					/**
      * CICO-7077 Confirmation Mail to have tax details
      */
					postData.tax_details = [];
					_.each($scope.reservationData.taxDetails, function (taxDetail) {
						postData.tax_details.push(taxDetail);
					});
					postData.tax_total = $scope.reservationData.totalTax;

					if (!!$scope.reservationData.guest.email && $scope.otherData.isGuestPrimaryEmailChecked) {
						postData.primary_email = $scope.reservationData.guest.email;
					}

					if (!!$scope.otherData.additionalEmail && $scope.otherData.isGuestAdditionalEmailChecked) {
						postData.booker_email = $scope.otherData.additionalEmail;
					}
					if ($scope.reservationData.isHourly) {
						postData.reservation_ids = [];
						_.each($scope.reservationData.reservations, function (reservation) {
							postData.reservation_ids.push(reservation.id);
						});
					}

					var emailSentSuccess = function emailSentSuccess(data) {
						$scope.reservationStatus.confirmed = true;
						updateBackButton();
						$scope.$emit('hideLoader');
					};
					// CICO-23139

					postData.enable_confirmation_custom_text = $scope.reservationData.enable_confirmation_custom_text;
					postData.confirmation_custom_title = $scope.reservationData.confirmation_custom_title;
					postData.confirmation_custom_text = $scope.reservationData.confirmation_custom_text;
					postData.locale = $scope.reservationData.languageData.selected_language_code;

					// CICO-35425
					postData.hide_rates = $scope.reservationData.hide_rates;

					if ($scope.reservationData.isHourly) {
						$scope.invokeApi(RVReservationSummarySrv.sendHourlyConfirmationEmail, postData, emailSentSuccess);
					} else {
						var reservations = $scope.reservationData.reservations;

						if (reservations && reservations.length) {
							reservations.forEach(function (reservation) {
								postData.reservationId = reservation.id;
								$scope.invokeApi(RVReservationSummarySrv.sendConfirmationEmail, postData, emailSentSuccess);
							});
						} else {
							$scope.invokeApi(RVReservationSummarySrv.sendConfirmationEmail, postData, emailSentSuccess);
						}
					}
				}
			};

			/*
   	If email address does not exists on Guest Card,
       and user decides to update via the Email field on the summary screen,
       this email should be linked to the guest card.
    */
			$scope.primaryEmailEntered = function () {

				if ($scope.reservationData.guest.email !== '' && $scope.reservationData.guest.email !== null) {
					return false;
				}

				var dataToUpdate = {
					"email": $scope.reservationData.guest.sendConfirmMailTo
				};

				var data = {
					'data': dataToUpdate,
					'userId': $scope.reservationData.guest.id || $scope.reservationDetails.guestCard.id
				};

				var updateGuestEmailSuccessCallback = function updateGuestEmailSuccessCallback(data) {
					$scope.reservationData.guest.email = $scope.reservationData.guest.sendConfirmMailTo;
					$scope.$emit('guestEmailChanged');
					$scope.$emit("hideLoader");
				};

				var updateGuestEmailFailureCallback = function updateGuestEmailFailureCallback(data) {
					$scope.$emit("hideLoader");
				};

				$scope.invokeApi(RVContactInfoSrv.updateGuest, data, updateGuestEmailSuccessCallback, updateGuestEmailFailureCallback);
			};

			/**
    * Navigate to the staycard for this guest
    */
			$scope.goToStaycardClicked = function () {
				var stateParams = {
					id: $scope.reservationData.reservationId,
					confirmationId: $scope.reservationData.confirmNum,
					isrefresh: true,
					justCreatedRes: true
				};

				// CICO-40207 Before navigating to the staycard make sure only one reservation's details are persisted in scope
				// Data pertaining to other reservations can be removed!
				// Stay card operates in the perspective of only one reservation at a time.
				if ($scope.reservationData.reservationIds) {
					$scope.reservationData.reservationIds.splice(1);
				}
				$scope.reservationData.rooms.splice(1);

				$scope.otherData.reservationCreated = true;
				$scope.reservationData.rateDetails = [];
				$state.go('rover.reservation.staycard.reservationcard.reservationdetails', stateParams);
				$rootScope.$broadcast('reload-loyalty-section-data', {});
			};

			/**
    * Navigate to the reservation search.
    * Retain Arrival / Departure Date / Number of nights,
    * Retain  Guest, Company & TA names
    * Retain Adults / Children / Infants
    * Retain  Previously booked room type
    * initialize all the other data.
    */
			$scope.clickedNewReservation = function () {
				$scope.reservationData.roomCount = 1;

				/**
    * CICO-40041
    * CICO-39612
    * CICO-39590
    * Reset the rate related details of all rooms, in case of the previous one being a multi-room booking
     */
				_.each($scope.reservationData.rooms, function (room) {
					room.rateId = '';
					room.rateName = '';
					room.rateAvg = '';
					room.rateTotal = '';
				});

				$scope.reservationData.totalTaxAmount = '';
				$scope.reservationData.totalTax = '';
				$scope.reservationData.totalStayCost = '';
				$scope.reservationData.guest.sendConfirmMailTo = '';

				var paymentType = {
					type: {},
					ccDetails: { // optional - only if credit card selected
						number: '',
						expMonth: '',
						expYear: '',
						nameOnCard: ''
					}
				};

				$scope.reservationData.paymentType = paymentType;
				$scope.reservationData.demographics = {
					market: '',
					source: '',
					reservationType: '',
					origin: ''
				};
				$scope.reservationData.promotion = {
					promotionCode: '',
					promotionType: ''
				};
				$scope.reservationData.reservationId = '';
				$scope.reservationData.confirmNum = '';
				// Set flag to retain the card details
				$scope.reservationData.isSameCard = true;
				$scope.otherData.reservationCreated = true;

				// As we are creating a new reservation for the same guest, we are to show the user occupancy alert popups
				_.each($scope.reservationData.rooms, function (roomData) {
					roomData.isOccupancyCheckAlerted = "";
				});

				// Clear depositData as well CICO-17912
				$scope.reservationData.depositData = false;

				$state.go('rover.reservation.search');
			};

			$scope.gotoDiaryScreen = function () {
				$scope.reservationData = {};
				$scope.initReservationDetails();
				$vault.set('temporaryReservationDataFromDiaryScreen', JSON.stringify({}));
				$state.go('rover.diary', {
					isfromcreatereservation: false
				});
			};

			// CICO-60529 : Navigate back to Room Diary
			$scope.gotoNightlyDiary = function () {
				var stateParams = {
					origin: 'RESERVATION_SUMMARY',
					reservation_id: $scope.reservationData.reservationId,
					room_id: $scope.reservationData.rooms[0].room_id
				};

				$state.go('rover.nightlyDiary', stateParams);
			};

			var allRoomDetailsFetched = function allRoomDetailsFetched(data) {
				$scope.$emit("hideLoader");
			};
			var failedInRoomDetailsFetch = function failedInRoomDetailsFetch(data) {
				$scope.$emit("hideLoader");
			};
			var successOfRoomDetailsFetch = function successOfRoomDetailsFetch(data) {
				if (data.current_hk_status === 'READY') {
					totalRoomsAvailable++;
				}
			};

			$scope.enableCheckInButton = function () {
				return _.has($scope.reservationData, "rooms") && $scope.reservationData.rooms.length === totalRoomsAvailable;
			};

			var checkAllRoomsAreReady = function checkAllRoomsAreReady() {
				var promises = [],
				    id;
				// we are following this structure bacuse of the hideloader pblm.
				// we are going to call mutilple API's paralelly. So sometimes last API may complete first
				// we need to keep loader until all api gets completed

				$scope.$emit("showLoader");
				for (var i = 0; i < $scope.reservationData.rooms.length; i++) {
					id = $scope.reservationData.rooms[i].room_id;
					// directly calling without base ctrl
					// room_id may still be undefined at this point, no need to send a bad request @ '/house/room/unidentified.json';
					if (id) {
						promises.push(RVHkRoomDetailsSrv.fetch(id).then(successOfRoomDetailsFetch));
					}
				}
				$q.all(promises).then(allRoomDetailsFetched, failedInRoomDetailsFetch);
			};

			var successOfAllCheckin = function successOfAllCheckin(data) {
				$scope.$emit("hideLoader");
				$scope.successMessage = 'Successful checking in.';
			};

			var failureOfCheckin = function failureOfCheckin(errorMessage) {
				$scope.$emit("hideLoader");
				$scope.errorMessage = errorMessage;
			};

			$scope.checkin = function () {
				/*
    	Please one min..
    	We create a list of promises against each API call
    	if it all resolved successfully then only we will proceed
    */
				var confirmationIDs = [];
				var promises = [];
				var data = null;

				$scope.$emit("showLoader");
				for (var i = 0; i < $scope.reservationData.rooms.length; i++) {
					confirmationIDs.push($scope.reservationData.rooms[i].confirm_no);
					data = {
						'reservation_id': $scope.reservationData.rooms[i].confirm_no
					};
					// directly calling without base ctrl
					promises.push(RVBillCardSrv.completeCheckin(data));
				}
				$q.all(promises).then(successOfAllCheckin, failureOfCheckin);
			};
			/**
    * Reset all reservation data and go to search
    */
			$scope.goToSearchClicked = function () {
				$scope.initReservationData();

				$state.go('rover.search', '');
			};

			$scope.modifyCheckinCheckoutTime = function () {

				var updateSuccess = function updateSuccess(data) {
					$scope.$emit('hideLoader');
				};

				var updateFailure = function updateFailure(data) {
					$scope.$emit('hideLoader');
				};

				if ($scope.reservationData.checkinTime.hh !== '' && $scope.reservationData.checkoutTime.hh !== '') {
					var postData = $scope.computeReservationDataforUpdate();

					postData.addons = $scope.existingAddons;
					$scope.invokeApi(RVReservationSummarySrv.updateReservation, postData, updateSuccess, updateFailure);
				}
			};

			/**
    * trigger the billing information popup. $scope.reservationData is the same variable used in billing info popups also.
    So we are adding the required params to the existing $scope.reservationData, so that no other functionalities in reservation confirmation breaks.
    */

			$scope.openBillingInformation = function (confirm_no) {
				// incase of multiple reservations we need to check the confirm_no to access billing
				// information
				if (confirm_no) {
					angular.forEach($scope.reservationData.reservations, function (reservation, key) {
						if (reservation.confirm_no === confirm_no) {
							$scope.reservationData.confirm_no = reservation.confirm_no;
							$scope.reservationData.reservation_id = reservation.id;
							$scope.reservationData.reservation_status = reservation.status;
						}
					});
				} else {
					$scope.reservationData.confirm_no = $scope.reservationData.confirmNum;
					$scope.reservationData.reservation_id = $scope.reservationData.reservationId;
					$scope.reservationData.reservation_status = $scope.reservationData.status;
				}

				if ($scope.reservationData.guest.id !== null) {
					$scope.reservationData.user_id = $scope.reservationData.guest.id;
				} else {
					$scope.reservationData.user_id = $scope.reservationData.company.id;
				}

				$scope.$emit('showLoader');
				jsMappings.fetchAssets(['addBillingInfo', 'directives']).then(function () {
					$scope.$emit('hideLoader');
					if ($rootScope.UPDATED_BI_ENABLED_ON['RESERVATION']) {
						console.log("##Billing-info updated version");
						ngDialog.open({
							template: '/assets/partials/billingInformation/reservation/rvBillingInfoReservationMain.html',
							controller: 'rvBillingInfoReservationMainCtrl',
							className: '',
							scope: $scope
						});
					} else {
						console.log("##Billing-info old version");
						ngDialog.open({
							template: '/assets/partials/bill/rvBillingInformationPopup.html',
							controller: 'rvBillingInformationPopupCtrl',
							className: '',
							scope: $scope
						});
					}
				});
			};

			$scope.setDemographics = function () {
				ngDialog.open({
					template: '/assets/partials/reservation/rvReservationDemographicsPopup.html',
					className: 'ngdialog-theme-default',
					scope: $scope
				});
			};

			$scope.updateAdditionalDetails = function () {
				var updateSuccess = function updateSuccess(data) {
					$scope.$emit('hideLoader');
				};

				var updateFailure = function updateFailure(data) {
					$scope.$emit('hideLoader');
					$scope.errorMessage = data;
				};

				$scope.errorMessage = [];

				var postData = $scope.computeReservationDataforUpdate();

				postData.reservationId = $scope.reservationData.reservationId;
				postData.addons = $scope.existingAddons;
				$scope.invokeApi(RVReservationSummarySrv.updateReservation, postData, updateSuccess, updateFailure);
			};

			/**
          * Function to toggle show rate checkbox value
          */
			$scope.clickedShowRate = function () {

				var sucessCallback = function sucessCallback(data) {
					$scope.reservationData.hide_rates = !$scope.reservationData.hide_rates;
					$scope.$emit('hideLoader');
					$scope.errorMessage = "";
				};
				var failureCallback = function failureCallback(errorData) {
					$scope.$emit('hideLoader');
					$scope.errorMessage = errorData;
				};
				var data = {
					'reservation_id': $scope.reservationData.reservationId,
					'hide_rates': !$scope.reservationData.hide_rates
				};

				$scope.invokeApi(RVBillCardSrv.toggleHideRate, data, sucessCallback, failureCallback);
			};

			$scope.init();

			$scope.watchEmailUpdate = function () {
				$rootScope.$broadcast('guest_email_updated', $scope.reservationData.guest.email);
			};
			// To enable/disable the confirmation title-text fields from UI.
			$scope.enableConfirmationCustomText = function () {
				$scope.reservationData.enable_confirmation_custom_text = !$scope.reservationData.enable_confirmation_custom_text;
				$scope.refreshScroller('paymentInfo');
			};

			// Checks whether the accompanying guest section should be shown or not
			$scope.shouldShowAccompanyingGuests = function (room) {
				return room.accompanying_guest_details && (room.accompanying_guest_details.ADULT.length > 0 || room.accompanying_guest_details.CHILDREN.length > 0 || room.accompanying_guest_details.INFANTS.length > 0);
			};
		}]);
	}, {}] }, {}, [1]);