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
		sntRover.controller('RVKeyEmailPopupController', ['$rootScope', '$scope', 'ngDialog', 'RVKeyPopupSrv', '$state', '$filter', function ($rootScope, $scope, ngDialog, RVKeyPopupSrv, $state, $filter) {
			BaseCtrl.call(this, $scope);
			$scope.errorMessage = '';
			// Set up data for view
			var setupData = function setupData() {
				var reservationId = "";
				var reservationStatus = "";

				if ($scope.fromView === "checkin") {
					reservationId = $scope.reservationBillData.reservation_id;
					reservationStatus = $scope.reservationBillData.reservation_status;
				} else {
					reservationId = $scope.reservationData.reservation_card.reservation_id;
					reservationStatus = $scope.reservationData.reservation_card.reservation_status;
				}

				var successCallback = function successCallback(data) {

					$scope.$emit('hideLoader');
					$scope.data = {};
					$scope.data = data;
					$scope.errorMessage = '';

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

				var failureCallback = function failureCallback(data) {
					$scope.$emit('hideLoader');
					$scope.errorMessage = data;
				};

				$scope.invokeApi(RVKeyPopupSrv.fetchKeyEmailData, { "reservationId": reservationId }, successCallback, failureCallback);
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