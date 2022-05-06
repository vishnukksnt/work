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
		sntRover.controller('RVEditRatesCtrl', ['$scope', '$rootScope', '$stateParams', '$timeout', 'ngDialog', 'RVReservationCardSrv', 'rvPermissionSrv', function ($scope, $rootScope, $stateParams, $timeout, ngDialog, RVReservationCardSrv, rvPermissionSrv) {

			BaseCtrl.call(this, $scope);

			var stayDatesOriginal = dclone($scope.ngDialogData.room.stayDates);

			$scope.refreshRateDetails = function () {
				$timeout(function () {
					$scope.refreshScroller('rateDetails');
				}, 2000);
			};

			/**
    * utility function to get reservation ID
    * @return {String} - reservationID
    */
			var getReservationID = function getReservationID() {
				if ($scope.ngDialogData.index === 0) {
					// when there is only reservation in reservation summary screen and 			
					// on accessing from staycard
					return $scope.reservationData.reservationId || $scope.reservationParentData.reservationId;
				} else {
					// when accesing from multiple reservations in summary screen
					return $scope.reservationData.reservationIds[$scope.ngDialogData.index];
				}
			};

			/**
    * utility function to get confirmation Number
    * @return {String} - confirmation Number
    */
			var getConfirmationNumber = function getConfirmationNumber() {
				return $scope.reservationData.confirmNum || $scope.reservationParentData.confirmNum;
			};

			/**
    * function to save comment against rate change
    * will save comment if something entered
    */
			$scope.saveCommentAgainstRateChange = function (callback) {
				// forming the API params
				var params = {},
				    onReservationNoteSuccess = function onReservationNoteSuccess() {
					callback();
				};

				params.reservation_id = getReservationID();
				params.text = $scope.adjustment_reason;
				params.is_from_rate_adjustment = true;
				params.note_topic = 1;

				var options = {
					params: params,
					onSuccess: onReservationNoteSuccess
				};

				$scope.callAPI(RVReservationCardSrv.saveReservationNote, options);
			};

			$scope.save = function (room, index) {
				// CICO-17731
				$scope.errorMessage = '';
				if (!$scope.otherData.forceAdjustmentReason || $scope.otherData.forceAdjustmentReason && !!$scope.adjustment_reason && !!$scope.adjustment_reason.trim()) {
					var isRateModified = false;

					_.each(room.stayDates, function (stayDate, idx) {
						if (stayDatesOriginal[idx] && stayDatesOriginal[idx].rateDetails) {
							if (stayDatesOriginal[idx] && stayDatesOriginal[idx].rateDetails.modified_amount !== stayDate.rateDetails.modified_amount) {
								isRateModified = true;
							}
							stayDate.rateDetails.modified_amount = parseFloat(stayDate.rateDetails.modified_amount).toFixed(2);
							if (isNaN(stayDate.rateDetails.modified_amount)) {
								stayDate.rateDetails.modified_amount = parseFloat(stayDate.rateDetails.actual_amount).toFixed(2);
							}
						}
					});

					$scope.reservationData.rooms[index] = room;
					$scope.reservationData.has_reason = !!$scope.adjustment_reason.trim();

					var reservationUpdateCallback = function reservationUpdateCallback() {

						if ($stateParams.id) {
							// IN STAY CARD .. Reload staycard
							$scope.saveReservation('rover.reservation.staycard.reservationcard.reservationdetails', {
								"id": getReservationID(),
								"confirmationId": getConfirmationNumber(),
								"isrefresh": false
							});
						} else {
							$scope.saveReservation('', '', index);
						}
						$scope.closeDialog();
					};

					if (isRateModified) {
						if ($scope.adjustment_reason.trim() === "") {
							reservationUpdateCallback();
						} else {
							$scope.saveCommentAgainstRateChange(reservationUpdateCallback);
						}
					} else {
						$scope.closeDialog();
					}
				} else {
					$scope.errorMessage = ['Please enter Adjustment Reason'];
				}
			};

			/**
    * [shouldDisableRateChange description]
    * @param  {Object} stayDetails
    * @param  {String} date
    * @return {Boolean}
    */
			$scope.shouldDisableRateChange = function (stayDetails, date) {
				var resData = $scope.reservationData,
				    isGroupReservtn = resData.group_id || resData.reservation_card.group_id,
				    pastDay = new tzIndependentDate($rootScope.businessDate) > new tzIndependentDate(date);

				// CICO-17693: should be disabled on the Stay Card for Group reservations, until we have the complete functionality working:
				// Just to clarify: User should be able to enter custom rates at any time for a group reservation
				if (isGroupReservtn) {
					pastDay = new tzIndependentDate($rootScope.businessDate) >= new tzIndependentDate(date);
				}

				return !rvPermissionSrv.getPermissionValue('UPDATE_AND_OVERWRITE_RATE_AMOUNT') || stayDetails.rateDetails.is_discount_allowed == 'false' || pastDay;
			};

			/**
    * whether to allow editing rate or not.
    * CICO-31868 - also check for permission - update and overwrite rate amout.
    * @param {object} stayDay data for date
    * @return {boolean}
    */
			$scope.shouldSupressRateInput = function (stayDay) {
				if (rvPermissionSrv.getPermissionValue('UPDATE_AND_OVERWRITE_RATE_AMOUNT')) {
					return false;
				} else if (stayDay.rateDetails.is_suppressed == 'true') {
					return true;
				}
				return false;
			};

			/**
    * things we need to do while initializing
    * @return {[type]} [description]
    */
			var initializeMe = function () {
				// As per CICO-14354, we are setting adjustment reason as the last one we entered
				$scope.adjustment_reason = $scope.ngDialogData.lastReason;
				$scope.setScroller('rateDetails');
				$scope.refreshRateDetails();
			}();
		}]);
	}, {}] }, {}, [1]);