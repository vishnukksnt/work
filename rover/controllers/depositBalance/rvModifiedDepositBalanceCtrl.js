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
        sntRover.controller('RVDepositBalanceCtrl', ['$scope', 'ngDialog', '$rootScope', 'RVDepositBalanceSrv', 'RVPaymentSrv', '$stateParams', '$filter', '$timeout', 'rvPermissionSrv', 'RVReservationCardSrv', '$state', 'RVAutomaticEmailSrv', function ($scope, ngDialog, $rootScope, RVDepositBalanceSrv, RVPaymentSrv, $stateParams, $filter, $timeout, rvPermissionSrv, RVReservationCardSrv, $state, RVAutomaticEmailSrv) {

            BaseCtrl.call(this, $scope);

            SharedMethodsBaseCtrl.call(this, $scope, $rootScope, RVAutomaticEmailSrv, ngDialog);

            // NOTE: For connected hotels, the deposit policy is not available inside this controller.
            // CICO-34705 in case no deposit policy is set; then the API will not provide the deposit_policy key
            $scope.isDepositEditable = $scope.depositDetails.deposit_policy === undefined || !!$scope.depositDetails.deposit_policy && !!$scope.depositDetails.deposit_policy.allow_deposit_edit;

            // NOTE: The deposit is always editable for connected hotels
            if (!$rootScope.isStandAlone) {
                $scope.isDepositEditable = true;
            }

            // adding a flag to be set after some timeout to remove flickering action in iPad
            $scope.pageloadingOver = false;
            $timeout(function () {
                $scope.pageloadingOver = true;
            }, 3500);

            $scope.shouldShowWaiting = false;
            $scope.$emit("UPDATE_DEPOSIT_BALANCE_FLAG", true);

            angular.forEach($scope.depositBalanceData.data.existing_payments, function (value, key) {
                value.isSelected = false;
                value.mli_token = value.ending_with; // For common payment HTML to work - Payment modifications story
                value.card_expiry = value.expiry_date; // Same comment above
            });

            $scope.depositWithGiftCard = false;
            $scope.depositPaidSuccesFully = false;
            $scope.shouldShowExistingCards = true;
            $scope.shouldShowAddNewCard = true;
            $scope.authorizedCode = "";
            $scope.showExistingAndAddNewPayments = true;
            $scope.showOnlyAddCard = false;
            $scope.cardsList = [];

            angular.forEach($scope.depositBalanceData.data.existing_payments, function (obj, index) {
                if (obj.is_credit_card) {
                    $scope.cardsList.push(obj);
                }
            });

            $scope.addmode = $scope.cardsList.length > 0 ? false : true;
            $scope.shouldShowMakePaymentButton = true;
            $scope.shouldShowMakePaymentScreen = true;
            $scope.showAddtoGuestCard = true;
            $scope.shouldCardAvailable = false;
            $scope.depositBalanceMakePaymentData = {};
            $scope.depositBalanceMakePaymentData.rateCurrency = $scope.depositBalanceData.data.rate_currency;
            $scope.depositBalanceMakePaymentData.amount = parseFloat($scope.depositBalanceData.data.balance_deposit_amount).toFixed(2);
            $scope.depositBalanceMakePaymentData.payment_amount = parseFloat($scope.depositBalanceData.data.balance_deposit_payment_amount).toFixed(2);
            $scope.refundAmount = 0;

            if ($scope.depositBalanceMakePaymentData.amount < 0) {
                $scope.refundAmount = -1 * parseFloat($scope.depositBalanceMakePaymentData.amount);
                $scope.shouldShowMakePaymentButton = false;
            }

            $scope.depositBalanceMakePaymentData.add_to_guest_card = false;
            $scope.makePaymentButtonDisabled = true;
            $scope.isDisplayReference = false;
            $scope.referanceText = "";
            $scope.depositPolicyName = "";

            if ($scope.depositDetails.deposit_policy && $scope.depositDetails.deposit_policy.description) {
                $scope.depositPolicyName = $scope.depositDetails.deposit_policy.description;
            }

            // To show add to guest card checkbox
            $scope.isAddToGuestCardVisible = false;
            $scope.isSwipedCardSave = false;
            $scope.isManual = false;
            $scope.setScroller('cardsList', { 'click': true, 'tap': true });
            $scope.setScroller('deopositdue');
            $scope.setScroller('payment-deposit-scroll', {
                'preventDefaultException': {
                    tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT|A|LABEL|FIGURE|SPAN|IMG)$/
                }
            });

            var refreshScroll = function refreshScroll() {
                $timeout(function () {
                    $scope.refreshScroller('deopositdue');
                }, 1500);
            };

            var refreshScroll = function refreshScroll() {
                $timeout(function () {
                    $scope.refreshScroller('cardsList');
                }, 1500);
            };

            var refreshPaymentScroll = function refreshPaymentScroll() {
                setTimeout(function () {
                    $scope.refreshScroller('payment-deposit-scroll');
                }, 500);
            };

            /*
             * Refresh scroll on changing the payment type
             */
            $scope.$on("PAYMENT_TYPE_CHANGED", function () {
                refreshPaymentScroll();
            });

            $scope.reservationData.reservation_card.payment_method_used = $scope.reservationData.reservation_card.payment_method_used ? $scope.reservationData.reservation_card.payment_method_used : "";
            $scope.validPayment = true;

            $scope.disableMakePayment = function () {
                if (!$scope.validPayment) {
                    return false;
                } else {
                    if (typeof $scope.depositBalanceMakePaymentData.payment_type !== "undefined") {
                        return $scope.depositBalanceMakePaymentData.payment_type.length > 0 ? false : true;
                    } else {
                        return true;
                    }
                }
            };

            $scope.showingDepositModal = false;

            /**
             * function to check whether the user has permission
             * to make payment
             * @return {Boolean}
             */
            $scope.hasPermissionToMakePayment = function () {
                return rvPermissionSrv.getPermissionValue('MAKE_PAYMENT');
            };

            /*
             * class based on the make payment button status
             */
            $scope.showMakePaymentButtonStatus = function () {
                var buttonClass = "";

                if (typeof $scope.depositBalanceMakePaymentData.payment_type !== "undefined") {
                    buttonClass = $scope.depositBalanceMakePaymentData.payment_type.length > 0 && $scope.validPayment ? "green" : "grey";
                } else {
                    if (!$scope.validPayment) {
                        buttonClass = "grey overlay";
                    } else {
                        buttonClass = "grey";
                    }
                }

                return buttonClass;
            };

            $scope.showRefundButtonStatus = function () {
                var buttonClass = "";

                if (typeof $scope.depositBalanceMakePaymentData.payment_type !== "undefined") {
                    buttonClass = $scope.depositBalanceMakePaymentData.payment_type.length > 0 ? "blue" : "grey";
                } else {
                    buttonClass = "grey";
                }

                return buttonClass;
            };

            if ($scope.reservationData.reservation_card.payment_method_used === "CC" || $scope.reservationData.reservation_card.payment_method_used === 'GIFT_CARD') {
                $scope.shouldCardAvailable = true;
                $scope.depositBalanceMakePaymentData.payment_type = "CC";
                if ($scope.reservationData.reservation_card.payment_method_used === 'GIFT_CARD') {
                    $scope.depositBalanceMakePaymentData.payment_type = "GIFT_CARD";
                }
                $scope.depositBalanceMakePaymentData.card_code = $scope.reservationData.reservation_card.payment_details.card_type_image.replace(".png", "");
                $scope.depositBalanceMakePaymentData.ending_with = $scope.reservationData.reservation_card.payment_details.card_number;
                $scope.depositBalanceMakePaymentData.card_expiry = $scope.reservationData.reservation_card.payment_details.card_expiry;
                $scope.paymentId = $scope.reservationData.reservation_card.payment_details.id;
            } else {
                // Please check CICO-12046
                if ($scope.isStandAlone) {
                    $scope.depositBalanceMakePaymentData.payment_type = angular.copy($scope.reservationData.reservation_card.payment_method_used);
                }
            }

            $scope.showSixPayCardInput = function () {
                if ($scope.paymentGateway == 'sixpayments' && $scope.depositBalanceMakePaymentData.payment_type == 'CC' && $scope.shouldShowMakePaymentScreen && !$scope.depositPaidSuccesFully && !$scope.depositWithGiftCard) {
                    return true;
                } else return false;
            };
            $scope.showCCPage = false;
            $scope.showPaymentTypeBox = function (v) {
                $scope.showCCPage = !v;
            };

            $scope.changeOnsiteCallIn = function () {
                $scope.shouldShowMakePaymentScreen = $scope.isManual ? false : true;
                $scope.shouldShowExistingCards = $scope.cardsList.length > 0 ? true : false;
                $scope.addmode = $scope.cardsList.length > 0 ? false : true;
                // in case c&p no need to show attached CC
                $scope.shouldCardAvailable = $scope.shouldShowMakePaymentScreen ? false : true;
                refreshScroll();
            };
            // to trigger from sixpayment partial
            $scope.$on('changeOnsiteCallIn', function (event) {
                $scope.isManual = !$scope.isManual;
                $scope.changeOnsiteCallIn();
            });

            $scope.feeData = {};

            $scope.emitCancelCardSelection = function () {
                if (!$rootScope.isStandAlone) {
                    ngDialog.close();
                }
                $scope.depositWithGiftCard = false;
                $scope.$emit('cancelCardSelection');
                $scope.cardselectedIndex = -1;

                // in case of hotel with MLI iframe will not be present
                if (!!$("#sixIframe").length) {
                    var iFrame = document.getElementById('sixIframe');

                    iFrame.src = iFrame.src;
                }
            };

            /*
             * On saving new card success
             * show the make payment screen and make payment button active
             * setting payment id
             */
            $scope.giftCardAvailableBalance = '';
            $scope.$on('giftCardAvailableBalance', function (e, giftCardData) {
                $scope.giftCardAvailableBalance = giftCardData.amount;
                $scope.giftCardAmountAvailable = true;
            });

            $rootScope.$on('validatedGiftCardPmt', function (n, valid) {
                if (valid) {
                    $scope.validPayment = true;
                } else {
                    $scope.validPayment = false;
                }
            });

            $scope.updatedAmountToPay = function (amt) {
                // used if checking against gift card balance
                if ($scope.depositBalanceMakePaymentData.payment_type === 'GIFT_CARD') {
                    var bal = $scope.giftCardAvailableBalance;

                    if (bal) {
                        var avail = parseFloat(bal).toFixed(2);
                        var toPay = parseFloat(amt).toFixed(2);

                        avail = parseFloat(avail);
                        toPay = parseFloat(toPay);
                        if (avail < toPay) {
                            $scope.validPayment = false;
                        } else {
                            $scope.validPayment = true;
                        }
                    }
                } else {
                    $scope.validPayment = true;
                }
                $rootScope.$broadcast('validatedGiftCardPmt', $scope.validPayment);
            };

            $scope.successSavePayment = function (data) {
                $scope.$emit("hideLoader");
                $scope.shouldShowIframe = false;
                $scope.shouldShowMakePaymentScreen = true;
                $scope.showAddtoGuestCard = false;
                $scope.shouldShowExistingCards = false;
                $scope.addmode = false;
                $scope.makePaymentButtonDisabled = false;
                $scope.paymentId = data.id;
                $scope.shouldCardAvailable = true;
                $scope.isAddToGuestCardVisible = true;
                // CICO-25882 - Fixing the issue of make payment btn not visible
                refreshPaymentScroll();
            };

            $scope.closeDepositModal = function () {
                $scope.$emit("UPDATE_DEPOSIT_BALANCE_FLAG", false);
                $scope.closeDialog();
            };

            $scope.$on("CLOSE_DIALOG", function () {
                $state.reload($state.$current.name);
                $scope.closeDepositModal();
            });

            var onPaymentFailure = function onPaymentFailure(data) {
                $scope.$emit("hideLoader");
                $scope.errorMessage = data;
            };

            /**
             * Make payment button success
             * Update balance data in staycard
             * closing the modal
             */
            var onPaymentSuccess = function onPaymentSuccess(data) {
                /**
                 * Expects the following JSON - response from submit payment API
                 * {
                 *     authorization_code : "",
                 *     bill_balance: "0.0",
                 *     reservation_balance: "100.00",
                 *     reservation_id: 123456
                 *     reservation_type_id: 4,
                 *     payment_method: {
                 *         card_type: null,
                 *         ending_with: null,
                 *         expiry_date: null,
                 *         id: null,
                 *         token: null
                 *     }
                 * }
                 *
                 * In case of cards, payment_method would contain
                 * {
                 *     card_type: "VA",
                 *     ending_with: "1234",
                 *     expiry_date: "12/17",
                 *     id: 35102,
                 *     token: "222555588889996663336"
                 * }
                 */

                $scope.$emit("hideLoader");
                $scope.errorMessage = [];

                $scope.currentPaymentBillId = data.bill_id;
                $scope.currentPaymentTransactionId = data.transaction_id;
                $scope.isDepositPayment = data.is_deposit_payment;

                if ($rootScope.autoEmailPayReceipt || $rootScope.autoEmailDepositInvoice && $scope.isDepositPayment) {
                    $scope.autoTriggerPaymentReceiptActions();
                }

                var cardDetails = data.payment_type || {};

                var reservationCard = $scope.reservationData.reservation_card;

                if (reservationCard.is_rates_suppressed === "false" || reservationCard.is_rates_suppressed === false) {
                    reservationCard.deposit_attributes.outstanding_stay_total = parseInt(reservationCard.deposit_attributes.outstanding_stay_total) - parseInt($scope.depositBalanceMakePaymentData.amount);
                }

                if ($scope.isAddToGuestCardVisible) {
                    var cardCode = cardDetails.card_code.toLowerCase();
                    var cardNumber = cardDetails.ending_with;
                    var cardName = "";

                    if ($scope.isSwipedCardSave) {
                        cardName = $scope.swipedCardHolderName;
                    } else {
                        cardName = $scope.cardValues.tokenDetails.isSixPayment ? $scope.passData.details.firstName + " " + $scope.passData.details.lastName : $scope.cardValues.cardDetails.userName;
                    }

                    var dataToGuestList = {
                        "card_code": cardCode,
                        "mli_token": cardNumber,
                        "card_expiry": cardDetails.expiry_date,
                        "card_name": cardName,
                        "id": cardDetails.id,
                        "isSelected": true,
                        "is_primary": false,
                        "payment_type": "CC",
                        "payment_type_id": 1
                    };

                    $scope.cardsList.push(dataToGuestList);
                    $rootScope.$broadcast('ADDEDNEWPAYMENTTOGUEST', dataToGuestList);
                }

                if ($rootScope.paymentGateway === "sixpayments" && $scope.isManual) {
                    $scope.authorizedCode = data.authorization_code;
                }

                $scope.depositPaidSuccesFully = true;

                $rootScope.$broadcast("UPDATE_DEPOSIT_BALANCE", data);
                // Update reservation type
                $rootScope.$broadcast('UPDATERESERVATIONTYPE', data.reservation_type_id);
                $rootScope.$broadcast('UPDATE_DEPOSIT_BALANCE_FLAG', false);
            };

            $scope.$on("AUTO_TRIGGER_EMAIL_AFTER_PAYMENT", function (e, data) {
                $scope.guestCardData.contactInfo.email = data;
                $scope.sendAutomaticEmails(data);
                $state.reload($state.$current.name);
            });

            $scope.$on("PAYMENT_SUCCESS", function (event, data) {
                onPaymentSuccess(data);
                refreshPaymentScroll();
            });

            $scope.$on("PAYMENT_FAILED", function (event, errorMessage) {
                onPaymentFailure(errorMessage);
                refreshPaymentScroll();
            });

            // Listen to swipe events
            $scope.$on("SHOW_SWIPED_DATA_ON_DEPOSIT_BALANCE_SCREEN", function (e, swipedCardDataToRender) {
                $scope.$broadcast("RENDER_SWIPED_DATA", swipedCardDataToRender);
            });

            $scope.$on('PAYMENT_SCREEN_MODE_CHANGED', function () {
                refreshPaymentScroll();
            });
        }]);
    }, {}] }, {}, [1]);