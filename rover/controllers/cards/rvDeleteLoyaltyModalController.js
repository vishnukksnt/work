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
		sntRover.controller('rvDeleteLoyaltyModalController', ['$scope', '$rootScope', '$filter', 'RVGuestCardLoyaltySrv', 'ngDialog', function ($scope, $rootScope, $filter, RVGuestCardLoyaltySrv, ngDialog) {
			BaseCtrl.call(this, $scope);

			$scope.closeDialog = function () {
				ngDialog.close();
			};

			$scope.dimissLoaderAndDialog = function () {
				$scope.$emit('hideLoader');
				$scope.closeDialog();
			};

			$scope.deleteLoyalty = function () {
				var successCallbackDeleteLoyalty = function successCallbackDeleteLoyalty() {
					$scope.loyaltyProgramDeleted($scope.loaytyID, $scope.loyaltyIndexToDelete, $scope.loyaltyProgramToDelete);
					$rootScope.$broadcast('loyaltyProgramDeleted', $scope.loaytyID, $scope.loyaltyIndexToDelete, $scope.loyaltyProgramToDelete);
					$rootScope.$broadcast('loyaltyLevelAvailable', "");
					$scope.$emit('REFRESH_CONTACT_INFO', { guestId: $scope.$parent.guestCardData.userId });
					$scope.dimissLoaderAndDialog();
				};
				var errorCallbackDeleteLoyalty = function errorCallbackDeleteLoyalty(error) {
					$scope.dimissLoaderAndDialog();
					$scope.$emit('loyaltyDeletionError', error);
				};

				$scope.invokeApi(RVGuestCardLoyaltySrv.deleteLoyalty, $scope.loaytyID, successCallbackDeleteLoyalty, errorCallbackDeleteLoyalty);
			};

			$scope.validate = function () {};
		}]);
	}, {}] }, {}, [1]);