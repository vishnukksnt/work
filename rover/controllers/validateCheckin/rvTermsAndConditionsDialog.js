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
				sntRover.controller('RVTermsAndConditionsDialogCtrl', ['$rootScope', '$scope', '$state', 'ngDialog', 'RVValidateCheckinSrv', function ($rootScope, $scope, $state, ngDialog, RVValidateCheckinSrv) {
						BaseCtrl.call(this, $scope);

						var scrollerOptions = { preventDefault: false };

						$scope.setScroller('termsandconditions', scrollerOptions);
						setTimeout(function () {
								$scope.refreshScroller('termsandconditions');
						}, 500);

						$scope.clickCancel = function () {
								ngDialog.close();
						};

						$scope.agreeButtonClicked = function () {
								$scope.saveData.termsAndConditions = true;
								ngDialog.close();
						};

						$scope.disagreeButtonClicked = function () {
								$scope.saveData.termsAndConditions = false;
								ngDialog.close();
						};
				}]);
		}, {}] }, {}, [1]);