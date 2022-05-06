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
		sntRover.controller('RVValidateEmailCtrl', ['$scope', '$state', 'ngDialog', 'RVContactInfoSrv', function ($scope, $state, ngDialog, RVContactInfoSrv) {
			BaseCtrl.call(this, $scope);

			$scope.saveData = {};
			$scope.saveData.email = "";
			// To handle ignore & goto checkout click
			$scope.ignoreAndGoToCheckout = function () {
				// Callback method
				if ($scope.callBackMethodCheckout) {
					$scope.callBackMethodCheckout();
				}
				ngDialog.close();
			};
			// To handle submit & goto checkout click
			$scope.submitAndGoToCheckout = function () {
				if ($scope.saveData.email === "") {
					return false;
				}

				$scope.saveData.guest_id = $scope.guestCardData.guestId;
				$scope.saveData.user_id = $scope.guestCardData.userId;

				var data = { 'data': $scope.saveData, 'userId': $scope.guestCardData.userId };

				$scope.invokeApi(RVContactInfoSrv.saveContactInfo, data, $scope.submitAndGoToCheckoutSuccessCallback);
			};
			// Success callback for submit & goto checkout
			$scope.submitAndGoToCheckoutSuccessCallback = function () {
				$scope.guestCardData.contactInfo.email = $scope.saveData.email;
				$scope.saveData.isEmailPopupFlag = true;
				$scope.$emit('hideLoader');
				ngDialog.close();
				// Callback method
				if ($scope.callBackMethodCheckout) {
					$scope.callBackMethodCheckout();
				}
			};
			// Failure callback for submit & goto checkout
			$scope.saveUserInfoFailureCallback = function (data) {
				$scope.$emit('hideLoader');
				$scope.errorMessage = data;
			};
		}]);
	}, {}] }, {}, [1]);