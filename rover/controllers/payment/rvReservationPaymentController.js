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
		sntRover.controller('reservationPaymentController', ['$scope', '$rootScope', 'RVReservationSummarySrv', 'rvPermissionSrv', function ($scope, $rootScope, RVReservationSummarySrv, rvPermissionSrv) {

			// To add class based on number of buttons present.
			$scope.getHasButtonClass = function () {

				var isCC = $scope.reservationData.reservation_card.has_any_credit_card_attached_bill,
				    hasButtonClass = "has-button";

				if (isCC && $scope.showCCAuthButton()) {
					hasButtonClass = "has-buttons";
				}
				return hasButtonClass;
			};

			// To show button based on resrvation status
			$scope.displayButton = function () {
				var status = $scope.reservationData.reservation_card.reservation_status,
				    display = true;

				if (status === 'NOSHOW' || status === 'CHECKEDOUT' || status === 'CANCELED') {
					display = false;
				}
				return display;
			};

			// To hide/show CCAuthButton
			$scope.showCCAuthButton = function () {
				if ($scope.reservationData.reservation_card.has_any_credit_card_attached_bill && $scope.isStandAlone) {
					return true;
				} else {
					return false;
				}
			};

			var successCallBackOfUpdateAllowPostWithNoCredit = function successCallBackOfUpdateAllowPostWithNoCredit() {
				$scope.reservationData.reservation_card.restrict_post = !$scope.reservationData.reservation_card.restrict_post;
			};
			/*
    * Allow post with no credit
    *
    */

			$scope.setAllowPostWithNoCredit = function () {

				if (rvPermissionSrv.getPermissionValue('ALLOW_POST_WHEN_RESTRICTED')) {
					var updateParams = {
						"restrict_post": !$scope.reservationData.reservation_card.restrict_post,
						"reservationId": $scope.reservationData.reservation_card.reservation_id
					};

					var options = {
						params: updateParams,
						successCallBack: successCallBackOfUpdateAllowPostWithNoCredit
					};

					// CICO-36919 for optimizing
					$scope.callAPI(RVReservationSummarySrv.updateRestrictPost, options);
				}
			};
			$scope.showPostWithNoCreditButton = function () {
				var isPostWithNoCreditButtonVisible = true;

				if (!$rootScope.isStandAlone || $scope.reservationData.reservation_card.payment_method_used === '' || $scope.reservationData.reservation_card.payment_method_used === null) {
					isPostWithNoCreditButtonVisible = false;
				}
				return isPostWithNoCreditButtonVisible;
			};

			// Update while changing credit card from bill screen.
			$rootScope.$on('UPDATEDPAYMENTLIST', function (event, data) {
				$scope.reservationData.reservation_card.payment_details.card_type_image = data.card_code + ".png";
				$scope.reservationData.reservation_card.payment_details.card_number = data.card_number;
				$scope.reservationData.reservation_card.payment_details.card_expiry = data.card_expiry;
				$scope.reservationData.reservation_card.payment_details.is_swiped = data.is_swiped;
			});

			// CICO-29224 - Listener to update the CC attached bill status to show/hide CC Auth btn in staycard
			$rootScope.$on('UPDATECCATTACHEDBILLSTATUS', function (event, isCCAttachedToBill) {
				$scope.reservationData.reservation_card.has_any_credit_card_attached_bill = isCCAttachedToBill;
			});
		}]);
	}, {}] }, {}, [1]);