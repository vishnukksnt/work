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
        sntRover.controller('RVShowPaymentListCtrl', ['$rootScope', '$scope', '$state', 'RVPaymentSrv', 'ngDialog', 'rvPermissionSrv', function ($rootScope, $scope, $state, RVPaymentSrv, ngDialog, rvPermissionSrv) {
            BaseCtrl.call(this, $scope);
            $scope.showNoValues = false;

            var hasCreditCardRemovalPermission = rvPermissionSrv.getPermissionValue('REMOVE_CREDIT_CARD_FROM_STAYCARD');

            $scope.paymentListSuccess = function (data) {
                $scope.$emit('hideLoader');
                $scope.paymentListData = data;

                // To remove non cc payments

                angular.forEach($scope.paymentListData.existing_payments, function (obj, index) {
                    if (!obj.is_credit_card) {
                        $scope.paymentListData.existing_payments.splice(index, 1);
                        return;
                    }
                });

                $scope.paymentListLength = $scope.paymentListData.existing_payments.length;
                if ($scope.paymentListLength === 0) {
                    $scope.showNoValues = true;
                }
            };

            var reservationId = '',
                bill_number = 1;

            if ($scope.dataToPaymentList.currentView === "billCard") {
                reservationId = $scope.dataToPaymentList.reservation_id;
                bill_number = $scope.dataToPaymentList.bills[$scope.dataToPaymentList.currentActiveBill].bill_number;
            } else {
                reservationId = $scope.dataToPaymentList.reservation_card.reservation_id;
            }

            var existingPaymentsParams = {
                reservation_id: reservationId,
                bill_number: bill_number
            };

            $scope.invokeApi(RVPaymentSrv.getExistingPaymentsForBill, existingPaymentsParams, $scope.paymentListSuccess);

            $scope.clickPaymentItem = function (paymentId, cardCode, cardNumberEndingWith, expiryDate, isSwiped, colorCode) {
                var data = {
                    "reservation_id": reservationId,
                    "user_payment_type_id": paymentId
                };

                if ($scope.dataToPaymentList.currentView === "billCard") {
                    data.bill_number = $scope.dataToPaymentList.bills[$scope.dataToPaymentList.currentActiveBill].bill_number;
                }

                var paymentMapFailure = function paymentMapFailure(errorMessage) {
                    $scope.$emit('hideLoader');
                    $scope.errorMessage = errorMessage;
                };

                var paymentMapSuccess = function paymentMapSuccess(data) {
                    var billIndex;

                    $scope.$emit('hideLoader');
                    // Added for CICO-29224
                    $rootScope.$emit('UPDATECCATTACHEDBILLSTATUS', data.has_any_credit_card_attached_bill);
                    ngDialog.close();

                    if ($scope.dataToPaymentList.currentView === 'billCard') {
                        billIndex = $scope.dataToPaymentList.currentActiveBill;

                        $scope.dataToPaymentList.bills[billIndex].credit_card_details.card_code = cardCode.toLowerCase();
                        $scope.dataToPaymentList.bills[billIndex].credit_card_details.card_number = cardNumberEndingWith;
                        $scope.dataToPaymentList.bills[billIndex].credit_card_details.card_expiry = expiryDate;

                        $scope.dataToPaymentList.bills[billIndex].credit_card_details.is_swiped = isSwiped;
                        $scope.dataToPaymentList.bills[billIndex].credit_card_details.auth_color_code = colorCode;
                        // CICO-35346
                        $scope.dataToPaymentList.bills[billIndex].credit_card_details.payment_id = data.id;
                        $scope.dataToPaymentList.bills[billIndex].credit_card_details.token = data.token;

                        // CICO-9739 : To update on reservation card payment section while updating from bill#1 credit card type.
                        if (billIndex === 0) {
                            $rootScope.$emit('UPDATEDPAYMENTLIST', $scope.dataToPaymentList.bills[billIndex].credit_card_details);
                        }
                    } else {
                        $scope.dataToPaymentList.reservation_card.payment_details.card_type_image = 'images/' + cardCode.toLowerCase() + '.png';
                        $scope.dataToPaymentList.reservation_card.payment_details.card_number = cardNumberEndingWith;
                        $scope.dataToPaymentList.reservation_card.payment_details.card_expiry = expiryDate;
                        $scope.dataToPaymentList.reservation_card.payment_method_used = "CC";
                        $scope.dataToPaymentList.reservation_card.payment_method_description = "Credit Card";

                        $scope.dataToPaymentList.reservation_card.payment_details.is_swiped = isSwiped;
                        $scope.dataToPaymentList.reservation_card.payment_details.auth_color_code = colorCode;
                        $scope.dataToPaymentList.reservation_card.payment_details.id = data.id;
                        $scope.dataToPaymentList.reservation_card.restrict_post = data.restrict_post;
                    }
                };

                $scope.invokeApi(RVPaymentSrv.mapPaymentToReservation, data, paymentMapSuccess, paymentMapFailure);
            };

            $scope.$parent.myScrollOptions = {
                'paymentList': {
                    scrollbars: true,
                    snap: false,
                    hideScrollbar: false,
                    preventDefault: false
                }
            };

            $scope.$on('$viewContentLoaded', function () {
                setTimeout(function () {
                    $scope.$parent.myScroll['paymentList'].refresh();
                }, 3000);
            });

            $scope.openAddNewPaymentModel = function () {
                $scope.closeDialog();
                $rootScope.$broadcast('OPENPAYMENTMODEL');
            };

            /**
             * Delete the given credit card
             * @param {Number} paymentMethodId - the id of the given credit card
             * @return {void}
             */
            $scope.deleteCreditCard = function (paymentMethodId) {
                var onDeleteSuccess = function onDeleteSuccess() {
                    $scope.closeDialog();
                },
                    onDeleteFailure = function onDeleteFailure(error) {
                    $scope.errorMessage = error;
                };

                $scope.callAPI(RVPaymentSrv.deleteCreditCard, {
                    onSuccess: onDeleteSuccess,
                    onFailure: onDeleteFailure,
                    params: {
                        reservation_id: reservationId,
                        payment_method_id: paymentMethodId
                    }
                });
            };

            /**
             * Should show the credit card delete btn
             */
            $scope.shouldShowCreditCardDeleteBtn = function () {
                return $rootScope.isStandAlone && hasCreditCardRemovalPermission && $state.current.name === 'rover.reservation.staycard.reservationcard.reservationdetails';
            };
        }]);
    }, {}] }, {}, [1]);