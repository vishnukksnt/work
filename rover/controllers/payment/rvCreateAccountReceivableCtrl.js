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
		sntRover.controller('RVCreateAccountReceivableCtrl', ['$rootScope', '$scope', '$state', 'RVCompanyCardSrv', 'ngDialog', function ($rootScope, $scope, $state, RVCompanyCardSrv, ngDialog) {
			BaseCtrl.call(this, $scope);
			$scope.ar_number = "";
			// CICO-25247 => Based on this ticket, controller restructured on "RVAccountReceivableMessagePopupCtrl" itself.
			// This controller is no more used.
			$scope.createAccountReceivable = function () {

				var data = {
					"id": $scope.account_id,
					"ar_number": $scope.ar_number
				};

				$scope.invokeApi(RVCompanyCardSrv.saveARDetails, data, $scope.successCreate, $scope.failureCreate);
			};

			$scope.closeDialog = function () {
				ngDialog.close();
			};
		}]);
	}, {}] }, {}, [1]);