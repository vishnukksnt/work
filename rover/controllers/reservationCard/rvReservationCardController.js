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
		sntRover.controller('reservationCardController', ['$rootScope', '$scope', 'RVReservationCardSrv', 'RVGuestCardSrv', 'rvPermissionSrv', '$filter', '$state', '$stateParams', function ($rootScope, $scope, RVReservationCardSrv, RVGuestCardSrv, rvPermissionSrv, $filter, $state, $stateParams) {
			BaseCtrl.call(this, $scope);
			$scope.timeline = "";
			$scope.reservationList = [];
			$scope.currentReservationId = "";
			$scope.reservationCount = 0;

			$scope.viewState.identifier = "STAY_CARD";

			$scope.heading = 'Staycard';
			$scope.setHeadingTitle($scope.heading);

			var title = "Staycard";

			$scope.setTitle(title);
			$scope.prevTimeLineEmpty = false;
			$scope.reservationCardClick = function () {
				$scope.$emit('reservationCardClicked');
			};

			$scope.isIpad = navigator.userAgent.match(/iPad/i) !== null;

			$scope.$on('SHOW_GUEST_ID_LIST', function (event, data) {
				$scope.shouldShowGuestDetails = data.shouldShowGuestDetails;
			});

			// To enable skip id scan button
			$scope.hasPermissionToSkipIdScan = rvPermissionSrv.getPermissionValue('ID_SCAN_BYPASS');

			/*
   * to get state params from resrvation details controller
   */
			$scope.$on('passReservationParams', function (event, data) {

				$scope.$emit('staycardGuestData', data);
				$scope.data = data;

				$scope.timeline = data.reservation_details.timeline;

				$scope.countCurrent = data.reservation_list.current_reservations_arr.length;
				$scope.countUpcoming = data.reservation_list.upcoming_reservations_arr.length;
				$scope.countHistory = data.reservation_list.history_reservations_arr.length;

				$scope.currentReservationId = data.confirmationNumber;

				RVReservationCardSrv.setGuestData($scope.data.guest_details);

				var fetchGuestcardDataSuccessCallback = function fetchGuestcardDataSuccessCallback(data) {

					var contactInfoData = {
						'contactInfo': data,
						'countries': $scope.data.countries,
						'userId': data.user_id,
						'avatar': $scope.data.avatar,
						'guestId': data.guest_id,
						'vip': $scope.data.vip
					};

					$scope.$emit('guestCardUpdateData', contactInfoData);
					$scope.$emit('hideLoader');
				};
				var fetchGuestcardDataFailureCallback = function fetchGuestcardDataFailureCallback(data) {
					$scope.$emit('hideLoader');
				};

				// Make this call IFF a guest is available in the card
				if (typeof $scope.data.guest_details.reservation_id !== "undefined" && $scope.data.guest_details.reservation_id !== null) {
					var param = {
						'fakeDataToAvoidCache': new Date(),
						'id': $scope.data.guest_details.reservation_id
					};
					var guestInfo = {
						"user_id": $scope.data.guest_details.user_id,
						"guest_id": $scope.data.guest_details.guest_id
					};

					$scope.$emit('SETGUESTDATA', guestInfo);
					$scope.showGuestPaymentList(guestInfo);
				}

				if ($scope.timeline === "current") {
					$scope.reservationList = data.reservation_list.current_reservations_arr;
					// This status is used to show appr message if count of reservations in selected time line is zero
					$scope.reservationDisplayStatus = $scope.countCurrent > 0 ? true : false;
				}
				if ($scope.timeline === "upcoming") {
					$scope.reservationList = data.reservation_list.upcoming_reservations_arr;
					// This status is used to show appr message if count of reservations in selected time line is zero
					$scope.reservationDisplayStatus = $scope.countUpcoming > 0 ? true : false;
				}
				if ($scope.timeline === "history") {
					$scope.reservationList = data.reservation_list.history_reservations_arr;
					// This status is used to show appr message if count of reservations in selected time line is zero
					$scope.reservationDisplayStatus = $scope.countHistory > 0 ? true : false;
				}

				RVReservationCardSrv.setGuestData($scope.data.guest_details);
			});
			/*
    * Handles time line click events
    * @param {string} time line
    */
			// CICO-9692- Changes added to intitate route state change for both PMSconnected and standalone.
			// before state change was not implemented for reservation tabs - upcoming, current a& history
			// hence back navigation will redirect to first loaded reservation staycard
			$scope.showTimeLineReservation = function (timeline) {
				$scope.timeline = timeline;
				var count = 0;

				if (timeline === "current") {
					$scope.reservationList = $scope.data.reservation_list.current_reservations_arr;
					count = $scope.countCurrent;
				} else if (timeline === "upcoming") {
					$scope.reservationList = $scope.data.reservation_list.upcoming_reservations_arr;
					count = $scope.countUpcoming;
				} else if (timeline === "history") {
					$scope.reservationList = $scope.data.reservation_list.history_reservations_arr;
					count = $scope.countHistory;
				}

				// prevTimeLineEmpty - flag indicates if the "FROM timeline" was empty
				// Bug fix CICO-10184
				if (count > 0 && !$scope.prevTimeLineEmpty) {
					$scope.reservationDisplayStatus = true;
				} else {
					$scope.reservationDisplayStatus = false;
				}

				if (count > 0) {
					$scope.prevTimeLineEmpty = false;
					$scope.currentReservationId = $scope.reservationList[0].confirmation_num;
					$scope.getReservationDetails($scope.reservationList[0].confirmation_num, $scope.reservationList[0].id);
				} else {
					$scope.prevTimeLineEmpty = true;
					$scope.currentReservationId = "";
					$scope.$broadcast("RESERVATIONDETAILS", $scope.currentReservationId);
				}

				$scope.$broadcast('RESERVATIONLISTUPDATED');
			};
			$scope.$on("REFRESH_LIST_SCROLL", function () {
				$scope.$broadcast("RESERVATIONLISTUPDATED");
			});
			/*
    * get reservation details on click each reservation
    * @param {string} current clicked confirmation number
    */
			$scope.getReservationDetails = function (currentConfirmationNumber, currentId) {
				// CICO-9709 - Reintiate reservation main data
				// $scope.initReservationData(); // commenting code as per CICO-10077

				$scope.clearArrivalAndDepartureTime();
				// set flag to show reservation is being refreshed
				$scope.$parent.refreshingReservation = true;

				if (currentId !== $scope.reservationData.reservationId) {
					$state.go("rover.reservation.staycard.reservationcard.reservationdetails", {
						"id": currentId,
						"confirmationId": currentConfirmationNumber,
						"isrefresh": true,
						"isOnlineRoomMove": ""
					});
				} else {
					$state.reload($state.$current.name);
				}
			};
			/*
    * To show the payment data list
    */
			$scope.showGuestPaymentList = function (guestInfo) {
				var userId = guestInfo.user_id,
				    guestId = guestInfo.guest_id;
				var paymentSuccess = function paymentSuccess(paymentData) {
					$scope.$emit('hideLoader');

					var paymentData = {
						"data": paymentData,
						"user_id": userId,
						"guest_id": guestId
					};

					$scope.$emit('GUESTPAYMENTDATA', paymentData);
					$scope.$emit('SHOWGUESTLIKES');
				};

				if ($stateParams.isrefresh === "true") {
					$scope.invokeApi(RVGuestCardSrv.fetchGuestPaymentData, userId, paymentSuccess, '', 'NONE');
				}
			};
		}]);
	}, {}] }, {}, [1]);