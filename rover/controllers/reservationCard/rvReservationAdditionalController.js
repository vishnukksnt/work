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
		sntRover.controller('rvReservationAdditionalController', ['$rootScope', '$scope', 'RVReservationSummarySrv', 'rvPermissionSrv', function ($rootScope, $scope, RVReservationSummarySrv, rvPermissionSrv) {
			BaseCtrl.call(this, $scope);

			$scope.additionalDetails = {
				segmentAvailable: !!$scope.reservationParentData.demographics.segment,
				hideDetails: true,
				isTaxExemptEnabled: $scope.reservationData.reservation_card.tax_exempt,
				isDayUse: $scope.reservationData.reservation_card.is_day_use,
				taxExemptType: $scope.reservationData.reservation_card.tax_exempt_type.id,
				taxExemptRefText: $scope.reservationData.reservation_card.tax_exempt_ref_text
			};
			$scope.isEmptyObject = isEmptyObject;

			var originalBookerEmail = angular.copy($scope.reservationData.reservation_card).booker_email;

			$scope.hasPermissionToEditCommission = rvPermissionSrv.getPermissionValue('UPDATE_COMMISSION') && $scope.reservationData.reservation_card.reservation_status !== 'CHECKEDOUT' && !$scope.reservationData.reservation_card.allotment_id && !$scope.reservationData.reservation_card.group_id;

			$scope.isSegmentAutoComputed = function () {
				var currentSegment = $scope.reservationParentData.demographics.segment,
				    aptSegment = "";

				if (!!currentSegment) {
					angular.forEach($scope.otherData.segments, function (segment) {
						if ($scope.reservationData.reservation_card.total_nights < segment.los) {
							if (!aptSegment) {
								aptSegment = segment.value;
							}
						}
					});
					return !!aptSegment && aptSegment === currentSegment;
				} else {
					return false;
				}
			};
			var eventTimestamp = "";

			$scope.clickedAdditionalDetails = function ($event) {
				$event.preventDefault();
				$event.stopImmediatePropagation();
				$event.stopPropagation();
				var toggleAction = function toggleAction() {
					$scope.additionalDetails.hideDetails = !$scope.additionalDetails.hideDetails;
					$scope.refreshReservationDetailsScroller(300);
					eventTimestamp = $event.timeStamp;
				};

				if (parseInt(eventTimestamp)) {
					if ($event.timeStamp - eventTimestamp < 500) {
						return;
					} else {
						toggleAction();
					}
				} else {
					toggleAction();
				}
			};

			$scope.updateAdditionalDetails = function () {
				var updateSuccess = function updateSuccess(data) {
					// Set the Reservation Type in the sntCode/app/assets/rover/partials/reservationCard/rvReservationCardPayment.html partial

					var selectedReservationGuaranteeType = _.where($scope.otherData.reservationTypes, {
						value: parseInt($scope.reservationParentData.demographics.reservationType)
					});

					if (selectedReservationGuaranteeType.length > 0) {
						$scope.reservationData.reservation_card.guarentee_type = selectedReservationGuaranteeType[0].name;
					} else {
						$scope.reservationData.reservation_card.guarentee_type = "";
					}
					$scope.$emit('hideLoader');
				};
				var updateFailure = function updateFailure(data) {
					$scope.$emit('hideLoader');
					$scope.errorMessage = data;
				};

				$scope.errorMessage = [];

				$scope.invokeApi(RVReservationSummarySrv.updateReservation, {
					'reservationId': $scope.reservationParentData.reservationId,
					'reservation_type_id': parseInt($scope.reservationParentData.demographics.reservationType),
					'source_id': parseInt($scope.reservationParentData.demographics.source),
					'market_segment_id': parseInt($scope.reservationParentData.demographics.market),
					'booking_origin_id': parseInt($scope.reservationParentData.demographics.origin),
					'segment_id': parseInt($scope.reservationParentData.demographics.segment)
				}, updateSuccess, updateFailure);
			};

			/*
    * Update tax exempt data for a reservation
    */
			$scope.updateTaxExemptData = function () {
				$scope.additionalDetails.taxExemptRefText = $scope.additionalDetails.isTaxExemptEnabled ? $scope.additionalDetails.taxExemptRefText : "";
				var paramsToApi = {
					"id": $scope.reservationParentData.reservationId,
					"tax_exempt": $scope.additionalDetails.isTaxExemptEnabled,
					"tax_exempt_ref_text": $scope.additionalDetails.taxExemptRefText
				},
				    successCallBackOfUpdate = function successCallBackOfUpdate(response) {

					$scope.isUpdateDone = false;

					if (response.errors && response.errors.length > 0) {
						$scope.errorMessage = response.errors;
					}
					if (!$scope.additionalDetails.isTaxExemptEnabled) {
						$scope.additionalDetails.taxExemptType = '';
					}
					$scope.reservationData.reservation_card.balance_amount = response.data.current_balance;
				},
				    failureCallBackOfUpdate = function failureCallBackOfUpdate(response) {
					$scope.isUpdateDone = false;
					$scope.errorMessage = response.errors;
				};

				if ($scope.additionalDetails.isTaxExemptEnabled) {
					if ($scope.additionalDetails.taxExemptType) {
						paramsToApi.tax_exempt_type_id = parseInt($scope.additionalDetails.taxExemptType);
					} else {
						paramsToApi.tax_exempt_type_id = parseInt($scope.defaultTaxExemptTypeId);
						$scope.additionalDetails.taxExemptType = parseInt($scope.defaultTaxExemptTypeId);
					}
				}

				var options = {
					params: paramsToApi,
					successCallBack: successCallBackOfUpdate,
					failureCallBack: failureCallBackOfUpdate
				};

				// Condition added - onblur of ref text this method invoked.
				// At that time make sure tax exempt type added
				if ($scope.additionalDetails.isTaxExemptEnabled) {
					if ($scope.additionalDetails.taxExemptType) {
						$scope.callAPI(RVReservationSummarySrv.saveTaxExempt, options);
					}
				} else {
					$scope.callAPI(RVReservationSummarySrv.saveTaxExempt, options);
				}
			};

			/*
    * on ng change wait for 5 seconds if the user typing or not and then invoke update API
    */
			$scope.doUpdateTaxExemptData = _.debounce(function () {
				$scope.updateTaxExemptData();
			}, 5000);
			/*
    * Toggle action tax exempt
    */
			$scope.toggleTaxExempt = function () {
				$scope.additionalDetails.isTaxExemptEnabled = !$scope.additionalDetails.isTaxExemptEnabled;
				if ($scope.additionalDetails.isTaxExemptEnabled && $scope.defaultTaxExemptTypeId !== '' || !$scope.additionalDetails.isTaxExemptEnabled) {
					$scope.updateTaxExemptData();
				}
			};
			/*
    * Toggle commission
    */
			$scope.toggleCommission = function () {
				$scope.reservationData.reservation_card.commission_details.is_on = !$scope.reservationData.reservation_card.commission_details.is_on;
				$scope.updateCommissionFromStaycard();
			};

			/*
    * Save commission details
    */
			$scope.updateCommissionFromStaycard = function () {
				var params = $scope.reservationData.reservation_card.commission_details;

				params.reservationId = $scope.reservationParentData.reservationId;

				var options = {
					params: params,
					successCallBack: function successCallBack(data) {
						$scope.reservationData.reservation_card.commission_details = data.commission_details;
					},
					failureCallBack: function failureCallBack(errorMessage) {
						$scope.errorMessage = errorMessage;
					}
				};

				$scope.callAPI(RVReservationSummarySrv.updateCommission, options);
			};

			$rootScope.$on('UPDATERESERVATIONTYPE', function (e, data, paymentId) {
				$scope.reservationParentData.demographics.reservationType = data;
				// CICO-24768 - Updating Payment id after adding new CC.
				if (!!paymentId) {
					$scope.reservationData.reservation_card.payment_details.id = paymentId;
				}
				var selectedReservationGuaranteeType = _.where($scope.otherData.reservationTypes, {
					value: parseInt($scope.reservationParentData.demographics.reservationType)
				});

				if (selectedReservationGuaranteeType.length > 0) {
					$scope.reservationData.reservation_card.guarentee_type = selectedReservationGuaranteeType[0].name;
				} else {
					$scope.reservationData.reservation_card.guarentee_type = "";
				}
			});

			$scope.$on('travelagentcardreplaced', function (event, data) {
				$scope.reservationData.reservation_card.commission_details = data.commission_details;
			});
			$scope.$on('travelagentcardremoved', function () {
				$scope.reservationData.reservation_card.commission_details = {};
			});

			/**
    * Update booker email for the given reservation
    */
			$scope.updateBookerEmail = function () {
				if ($scope.reservationData.reservation_card.booker_email === originalBookerEmail) {
					return;
				}

				$scope.callAPI(RVReservationSummarySrv.updateBookerEmail, {
					onSuccess: function onSuccess() {
						originalBookerEmail = $scope.reservationData.reservation_card.booker_email;
					},
					onFailure: function onFailure(errorMessage) {
						$scope.errorMessage = errorMessage;
					},
					params: {
						reservationId: $scope.reservationData.reservation_card.reservation_id,
						booker_email: $scope.reservationData.reservation_card.booker_email || ''
					}
				});
			};
		}]);
	}, {}] }, {}, [1]);