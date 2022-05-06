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
		sntRover.controller('RVAddNewHotelLoyaltyController', ['$scope', '$rootScope', 'RVGuestCardLoyaltySrv', 'ngDialog', function ($scope, $rootScope, RVGuestCardLoyaltySrv, ngDialog) {

			BaseCtrl.call(this, $scope);
			$scope.userMembershipTypes = $scope.loyaltyData.hotelLoyaltyData;
			$scope.userMembershipNumber = "";
			$scope.userMembershipType = "";
			$scope.userMembershipClass = "HLP";
			$scope.userMembershipLevels = [];
			$scope.userMembershipLevel = "";
			$scope.isLevelsAvailable = false;

			$scope.memberShipTypeChanged = function () {

				angular.forEach($scope.userMembershipTypes, function (userMembershipType, index) {

					if ($scope.userMembershipType === userMembershipType.hl_value) {
						$scope.userMembershipLevels = userMembershipType.levels;
						if ($scope.userMembershipLevels.length > 0) {
							$scope.isLevelsAvailable = true;
						} else {
							$scope.isLevelsAvailable = false;
						}
					}
				});
			};

			$scope.save = function () {

				var loyaltyPostsuccessCallback = function loyaltyPostsuccessCallback(data) {
					$scope.newLoyalty.id = data.id;
					$scope.$emit('hideLoader');
					$scope.cancel();
					$rootScope.$broadcast('loyaltyProgramAdded', $scope.newLoyalty);
					$scope.$emit('REFRESH_CONTACT_INFO', { guestId: $scope.$parent.guestCardData.guestId });
					$rootScope.$broadcast('loyaltyLevelAvailable', $scope.userMembershipLevel);
				};

				var loyaltyPostErrorCallback = function loyaltyPostErrorCallback(errorMessage) {
					$scope.$emit('hideLoader');
					$scope.errorMessage = errorMessage;
				};
				var user_membership = {};

				user_membership.membership_card_number = $scope.userMembershipNumber;
				user_membership.membership_class = $scope.userMembershipClass;
				user_membership.membership_type = $scope.userMembershipType;
				user_membership.membership_level = $scope.userMembershipLevel;
				$scope.newLoyalty = user_membership;

				var reservationId = $scope.reservationData && $scope.reservationData.reservationId ? $scope.reservationData.reservationId : "";

				var data = { 'user_id': $scope.$parent.guestCardData.userId,
					'guest_id': $scope.$parent.guestCardData.guestId,
					'user_membership': user_membership,
					'reservation_id': reservationId
				},
				    options = {
					params: data,
					successCallBack: loyaltyPostsuccessCallback,
					failureCallBack: loyaltyPostErrorCallback
				};

				$scope.callAPI(RVGuestCardLoyaltySrv.createLoyalties, options);
			};

			$scope.cancel = function () {
				$scope.closeDialog();
			};
		}]);
	}, {}] }, {}, [1]);