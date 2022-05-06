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
		sntRover.controller('RVAccountReceivableMessagePopupCtrl', ['$rootScope', '$scope', '$state', 'ngDialog', '$timeout', 'RVCompanyCardSrv', 'rvPermissionSrv', function ($rootScope, $scope, $state, ngDialog, $timeout, RVCompanyCardSrv, rvPermissionSrv) {
			BaseCtrl.call(this, $scope);

			$scope.isCreateNewARAccountMode = false;
			$scope.data = {};
			$scope.isCreateButtonDisabled = false;

			$scope.createAccountAction = function () {

				if (typeof $scope.reservationBillData !== "undefined" && $scope.reservationBillData.is_auto_assign_ar_numbers === "true" || typeof $scope.is_auto_assign_ar_numbers !== "undefined" && $scope.is_auto_assign_ar_numbers) {
					var isAutoAssignARNumber = true;

					$scope.createAccountReceivable(isAutoAssignARNumber);
				} else {
					$scope.isCreateNewARAccountMode = true;
				}
			};

			$scope.successCreate = function (data) {

				if (typeof $scope.reservationBillData !== "undefined") {
					$scope.reservationBillData.ar_number = data.ar_number;
					$scope.reservationBillData.bills[$scope.currentActiveBill].ar_number = data.ar_number;
					$scope.reservationBillData.bills[$scope.currentActiveBill].has_ar_account = true;
				}
				ngDialog.close();
				$timeout(function () {
					$rootScope.$emit('arAccountCreated');
				}, 500);
			};

			$scope.failureCreate = function (errorMessage) {
				$scope.$emit("hideLoader");
				$scope.errorMessage = errorMessage;
				$scope.isCreateButtonDisabled = false;
				if ($scope.errorMessage[0] === "Please complete required AR Account Information") {
					$scope.isCreateButtonDisabled = true;
				}
			};

			$scope.createAccountReceivable = function (isAutoAssignARNumber) {

				var data = {
					"id": $scope.reservationBillData.bills[$scope.currentActiveBill].account_id,
					"ar_number": isAutoAssignARNumber ? "" : $scope.data.ar_number
				};

				$scope.invokeApi(RVCompanyCardSrv.saveARDetails, data, $scope.successCreate, $scope.failureCreate);
			};

			$scope.closeDialog = function () {
				ngDialog.close();
			};

			$scope.cancelButtonClick = function () {
				$scope.errorMessage = "";
				$scope.isCreateNewARAccountMode = false;
			};

			/**
   * function to check whether the user has permission
   * to create/edit AR Account.
   * @return {Boolean}
   */
			$scope.hasPermissionToCreateArAccount = function () {
				return rvPermissionSrv.getPermissionValue('CREATE_AR_ACCOUNT');
			};
		}]);
	}, {}] }, {}, [1]);