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
        sntRover.controller('RVPaymentAddPaymentCtrl', ['$rootScope', '$scope', function ($rootScope, $scope) {

            BaseCtrl.call(this, $scope);

            $scope.savePayment = {};
            $scope.isFromGuestCard = typeof $scope.passData.isFromGuestCard !== "undefined" && $scope.passData.isFromGuestCard ? true : false;

            $scope.initCardSwipeRenderData = function () {
                $scope.isNewCardAdded = false;
                $scope.shouldShowIframe = false;
                $scope.addmode = true;
                $scope.isGiftCard = false;
                $scope.useDepositGiftCard = false;
                $scope.hideCancelCard = false;
                $scope.depositWithGiftCard = false;
                setTimeout(function () {
                    $scope.$broadcast('addNewCardClicked'); // child element is the rvCardOptions.html
                    $scope.$broadcast('hidePayCardToggles', { 'isFromSwipe': true }); // child element is the rvCardOptions.html
                }, 100);
            };

            /**
             *
             */
            $scope.$on('CLOSE_DIALOG', function () {
                $scope.closeDialog();
            });

            /**
             *
             * @returns {*}
             */
            $scope.getAddActionType = function () {
                if ($scope.isFromGuestCard) {
                    return 'ADD_PAYMENT_GUEST_CARD';
                } else if ($scope.paymentData.isFromBillCard || $scope.passData.fromView === "billcard") {
                    return 'ADD_PAYMENT_BILL';
                } else if ($scope.passData.fromView === "companyTravelAgent") {
                    return 'ADD_PAYMENT_CO_TA';
                }
                return 'ADD_PAYMENT_STAY_CARD';
            };

            /**
             * Handles successful payment addition in the bill screen
             * @param response
             * @param paymentType
             * @param cardDetails
             */
            var handleBillCardAddPaymentSuccess = function handleBillCardAddPaymentSuccess(response, paymentType, cardDetails) {
                var billIndex = $scope.billNumber - 1;

                if (paymentType === "CC") {
                    // in case of card payment
                    _.extend($scope.paymentData.bills[billIndex].credit_card_details, {
                        card_code: cardDetails.card_code,
                        card_number: cardDetails.ending_with,
                        card_expiry: cardDetails.expiry_date,
                        payment_id: response.id,
                        is_swiped: cardDetails.is_swiped,
                        auth_color_code: cardDetails.auth_color_code,
                        token: cardDetails.token
                    });

                    $scope.paymentData.bills[billIndex].credit_card_details.payment_type = paymentType;

                    // CICO-9739 : To update on reservation card payment section while updating from bill#1 credit card type.
                    if ($scope.billNumber === 1) {
                        $rootScope.$emit('UPDATEDPAYMENTLIST', $scope.paymentData.bills[billIndex].credit_card_details);
                    }

                    $rootScope.$broadcast('BALANCECHANGED', {
                        "balance": response.reservation_balance,
                        "confirm_no": $scope.paymentData.confirm_no
                    });

                    // CICO-34754: room charge enabled needs to be true if cc added.
                    $rootScope.$broadcast('paymentChangedToCC');

                    $scope.$emit('UPDATECCATTACHEDBILLSTATUS', response.has_any_credit_card_attached_bill);

                    if (response.addToGuestCard) {
                        $rootScope.$broadcast('ADDEDNEWPAYMENTTOGUEST', {
                            "card_code": cardDetails.card_code,
                            "mli_token": cardDetails.ending_with,
                            "card_expiry": cardDetails.expiry_date,
                            "card_name": cardDetails.card_name,
                            "id": response.guest_payment_method_id,
                            "isSelected": true,
                            "is_primary": false,
                            "payment_type": paymentType || "CC",
                            "payment_type_id": 1
                        });
                    }
                } else {
                    // For non CC Payments
                    $scope.paymentData.bills[billIndex].credit_card_details.payment_type = paymentType;
                    $scope.paymentData.bills[billIndex].credit_card_details.payment_type_description = response.payment_type;
                }

                /*
                 * CICO-74474: Close the add payment dialog by id to prevent the
                 * unintentional closing of the credit card authorization dialog
                 * that follows which can lead to double authorizations.
                 */
                $scope.closeDialog($scope.ngDialogId);
            };

            /**
             * Handles successful payment addition in the guest card
             * @param response
             * @param paymentType
             * @param cardDetails
             */
            var handleGuestCardAddPaymentSuccess = function handleGuestCardAddPaymentSuccess(response, paymentType, cardDetails) {
                // NOTE: For Guest Cards - ONLY CC can be added as a payment
                $rootScope.$broadcast('ADDEDNEWPAYMENTTOGUEST', {
                    "card_code": cardDetails.card_code,
                    "mli_token": cardDetails.ending_with,
                    "card_expiry": cardDetails.expiry_date,
                    "card_name": cardDetails.card_name,
                    "id": response.id,
                    "isSelected": true,
                    "is_primary": false,
                    "payment_type": paymentType || "CC",
                    "payment_type_id": 1
                });

                $scope.closeDialog();
            };

            /**
             * Handles successful payment addition in the guest card
             * @param response
             * @param paymentType
             * @param cardDetails
             */
            var handleStayCardAddPaymentSuccess = function handleStayCardAddPaymentSuccess(response, paymentType, cardDetails) {
                if (paymentType === "CC") {
                    $scope.paymentData.reservation_card.payment_method_used = paymentType;
                    _.extend($scope.paymentData.reservation_card.payment_details, {
                        card_type_image: 'images/' + cardDetails.card_code + ".png",
                        card_number: cardDetails.ending_with,
                        card_expiry: cardDetails.expiry_date,
                        is_swiped: cardDetails.is_swiped,
                        auth_color_code: cardDetails.auth_color_code
                    });
                } else {
                    // For non cc payment types
                    $scope.paymentData.reservation_card.payment_method_description = response.payment_type;
                    $scope.paymentData.reservation_card.payment_method_used = paymentType;
                }
                $scope.paymentData.reservation_card.restrict_post = response.restrict_post;
                // Update reservation type
                $rootScope.$broadcast('UPDATERESERVATIONTYPE', response.reservation_type_id, response.id);
                $scope.$emit('UPDATECCATTACHEDBILLSTATUS', response.has_any_credit_card_attached_bill || response.usedEMV && paymentType === "CC");

                if (response.addToGuestCard) {
                    $rootScope.$broadcast('ADDEDNEWPAYMENTTOGUEST', {
                        "card_code": cardDetails.card_code,
                        "mli_token": cardDetails.ending_with,
                        "card_expiry": cardDetails.expiry_date,
                        "card_name": cardDetails.card_name,
                        "id": response.guest_payment_method_id,
                        "isSelected": true,
                        "is_primary": false,
                        "payment_type": paymentType || "CC",
                        "payment_type_id": 1
                    });
                }
                $scope.closeDialog();
            };

            /**
             * Handles successful payment addition in the Company Travel Agent
             * @param response
             * @param paymentType
             * @param cardDetails
             */
            var handleCompanyAddPaymentSuccess = function handleCompanyAddPaymentSuccess(response, paymentType, cardDetails) {
                // NOTE: For Guest Cards - ONLY CC can be added as a payment
                $rootScope.$broadcast('ADDEDNEWPAYMENTTOCOTA', {
                    "card_code": cardDetails.card_code,
                    "mli_token": cardDetails.ending_with,
                    "card_expiry": cardDetails.expiry_date,
                    "card_name": cardDetails.card_name,
                    "id": response.id,
                    "isSelected": true,
                    "is_primary": false,
                    "payment_type": paymentType || "CC",
                    "payment_type_id": 1
                });

                $scope.closeDialog();
            };

            /**
             * Listener for add payment success
             * Event would be emitted from the directive in the PAYMENT MODULE
             */
            $scope.$on('SUCCESS_LINK_PAYMENT', function (event, params) {
                switch ($scope.getAddActionType()) {
                    case 'ADD_PAYMENT_BILL':
                        handleBillCardAddPaymentSuccess(params.response, params.selectedPaymentType, params.cardDetails);
                        break;
                    case 'ADD_PAYMENT_GUEST_CARD':
                        handleGuestCardAddPaymentSuccess(params.response, params.selectedPaymentType, params.cardDetails);
                        break;
                    case 'ADD_PAYMENT_CO_TA':
                        handleCompanyAddPaymentSuccess(params.response, params.selectedPaymentType, params.cardDetails);
                        break;
                    default:
                        handleStayCardAddPaymentSuccess(params.response, params.selectedPaymentType, params.cardDetails);
                }
            });

            $scope.$on('ERROR_OCCURED', function (event, errorMessage) {
                $scope.errorMessage = errorMessage;
            });

            $scope.$on('PAYMENT_FAILED', function (event, errorMessage) {
                $scope.errorMessage = errorMessage;
            });

            /**
             * Initialization Method
             *
             */
            (function () {
                // In case this is opened on a swipe;
                // TODO : Tell the directive that this is from a swipe
                if (!isEmptyObject($scope.passData.details.swipedDataToRenderInScreen)) {
                    $scope.selectedPaymentType = "CC";
                    $scope.swipedCardData = $scope.passData.details.swipedDataToRenderInScreen;
                }

                $scope.billNumber = $scope.passData.fromBill || 1;
            })();
        }]);
    }, {}] }, {}, [1]);