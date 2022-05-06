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
		sntRover.controller('RVShowValidationErrorCtrl', ['$rootScope', '$scope', 'ngDialog', 'RVBillCardSrv', '$state', function ($rootScope, $scope, ngDialog, RVBillCardSrv, $state) {
			BaseCtrl.call(this, $scope);

			var init = function init() {
				$scope.flag = {};
				$scope.flag.roomStatusReady = false;
			};

			var cancelPopup = function cancelPopup(redirectTo) {
				if (redirectTo === 'bill') {
					$scope.$emit("STAY_ON_BILL");
				} else {
					$state.go("rover.dashboard.manager");
				}
				ngDialog.close();
			};

			$scope.okButtonClicked = function (redirectTo) {
				// If we chose the room status as ready, then we should make an API call to change the HK status
				if ($scope.flag.roomStatusReady) {
					/*
      * "hkstatus_id": 1 for CLEAN
      * "hkstatus_id": 2 for INSPECTED
      */
					if ($scope.reservationBillData.checkin_inspected_only === "true") {
						var data = { "hkstatus_id": 2, "room_no": $scope.reservationBillData.room_number };
					} else {
						var data = { "hkstatus_id": 1, "room_no": $scope.reservationBillData.room_number };
					}

					var houseKeepingStatusUpdateSuccess = function houseKeepingStatusUpdateSuccess(data) {
						$scope.$emit('hideLoader');
						cancelPopup(redirectTo);
					};

					$scope.invokeApi(RVBillCardSrv.changeHousekeepingStatus, data, houseKeepingStatusUpdateSuccess);
					// Room is set to be not ready by default in checkout process. So we don't need to change the HK status
				} else {
					cancelPopup(redirectTo);
				}
			};
			init();
		}]);
	}, {}] }, {}, [1]);