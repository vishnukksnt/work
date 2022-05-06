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
		sntRover.controller('RVKeyQRCodePopupController', ['$rootScope', '$scope', '$state', 'ngDialog', 'RVKeyPopupSrv', '$filter', '$window', function ($rootScope, $scope, $state, ngDialog, RVKeyPopupSrv, $filter, window) {
			BaseCtrl.call(this, $scope);

			var isMobileView = window.innerWidth < 1024;

			$scope.shouldEnableDrag = !isMobileView;

			// Set/Initialise the scroller
			var setScroller = function setScroller() {
				var scrollerOptions = {
					tap: true,
					preventDefault: false
				};

				// Set scroller
				$scope.setScroller("qrPopupScroller", scrollerOptions);
			};

			setScroller();

			// Set up data for view
			var setupData = function setupData() {
				var reservationStatus = "";

				if ($scope.fromView === "checkin") {
					reservationStatus = $scope.reservationBillData.reservation_status;
				} else {
					reservationStatus = $scope.reservationData.reservation_card.reservation_status;
				}
				// To check reservation status and select corresponding texts and classes.
				if (reservationStatus === 'CHECKING_IN') {
					$scope.data.reservationStatusText = $filter('translate')('KEY_CHECKIN_STATUS');
					$scope.data.colorCodeClass = 'check-in';
					$scope.data.colorCodeClassForClose = 'green';
				} else if (reservationStatus === 'CHECKEDIN') {
					$scope.data.reservationStatusText = $filter('translate')('KEY_INHOUSE_STATUS');
					$scope.data.colorCodeClass = 'inhouse';
					$scope.data.colorCodeClassForClose = 'blue';
				} else if (reservationStatus === 'CHECKING_OUT') {
					$scope.data.reservationStatusText = $filter('translate')('KEY_CHECKOUT_STATUS');
					$scope.data.colorCodeClass = 'check-out';
					$scope.data.colorCodeClassForClose = 'red';
				}
			};

			setupData();

			// To handle close button click
			$scope.goToStaycard = function () {
				$scope.closeDialog();
				$state.go('rover.reservation.staycard.reservationcard.reservationdetails', { "id": $scope.reservationBillData.reservation_id, "confirmationId": $scope.reservationBillData.confirm_no, "isrefresh": true });
			};
			$scope.goToSearch = function () {
				$scope.closeDialog();
				$state.go('rover.search');
			};
			// Close popup
			$scope.closeDialog = function () {
				ngDialog.close();
			};
		}]);
	}, {}] }, {}, [1]);