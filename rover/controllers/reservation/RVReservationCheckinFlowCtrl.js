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
        angular.module('sntRover').controller('RVReservationCheckInFlowCtrl', ['$scope', '$rootScope', 'RVHotelDetailsSrv', '$log', 'RVCCAuthorizationSrv', 'ngDialog', '$timeout', 'RVBillCardSrv', '$state', 'sntActivity', 'sntEMVSharedSrv', function ($scope, $rootScope, RVHotelDetailsSrv, $log, RVCCAuthorizationSrv, ngDialog, $timeout, RVBillCardSrv, $state, sntActivity, sntEMVSharedSrv) {

            // NOTE rvBillCardCtrl is a parent for this controller! and a few variables and methods from the parent's scope are used in here

            // Object to store listener handles
            var listeners = {};

            var getPaymentMethodId = function getPaymentMethodId() {
                var billData = $scope.reservationBillData.bills[$scope.currentActiveBill];

                return billData.credit_card_details && billData.credit_card_details['payment_id'] || '';
            };

            var fetchAuthInfo = function fetchAuthInfo() {
                $scope.callAPI(RVCCAuthorizationSrv.fetchPendingAuthorizations, {
                    loader: false,
                    params: $scope.reservationBillData.reservation_id,
                    successCallBack: function successCallBack(response) {
                        var billRoutingInfo = $scope.reservationBillData.routing_info,
                            canPayIncidentalsOnly = response.is_cc_authorize_for_incidentals_active && (billRoutingInfo.out_going_to_room || billRoutingInfo.out_going_to_comp_tra);

                        $scope.authorizationInfo = response;
                        // Default the authorization amount to full; can be set to the incidentals if user chooses so
                        $scope.checkInState.authorizationAmount = response.pre_auth_amount_at_checkin || 0;
                        angular.extend($scope.authorizationInfo, {
                            routingToRoom: billRoutingInfo.out_going_to_room,
                            routingFromRoom: billRoutingInfo.incoming_from_room,
                            routingToAccount: billRoutingInfo.out_going_to_comp_tra,
                            canPayIncidentalsOnly: canPayIncidentalsOnly
                        });
                        $scope.checkInState.isAuthInfoFetchComplete = true;
                        sntActivity.stop('REFRESH_PRE_AUTH_INFO');
                    },
                    failureCallBack: function failureCallBack(errorMessage) {
                        $scope.errorMessage = errorMessage;
                        $scope.checkInState.isAuthInfoFetchComplete = true;
                    }
                });
            };

            // STEP A PROMPT TO SELECT AMOUNT
            var promptForAuthorizationAmount = function promptForAuthorizationAmount() {
                ngDialog.open({
                    template: '/assets/partials/authorization/rvCheckInAuthUserActionPopup.html',
                    className: '',
                    closeByDocument: false,
                    closeByEscape: false,
                    scope: $scope
                });
            };

            // STEP B PROMPT FOR SWIPE
            var promptForSwipe = function promptForSwipe() {
                if ($scope.checkInState.hasActiveEMV && !$scope.authorizationInfo.is_cc_authorize_at_checkin_enabled) {
                    completeCheckin();
                } else if (!$scope.reservationBillData.is_disabled_cc_swipe) {
                    // prompting for swipe can be disabled from admin > reservations > reservation settings
                    $scope.checkInState.isListeningSwipe = true;
                    ngDialog.open({
                        template: '/assets/partials/payment/rvPleaseSwipeModal.html',
                        className: '',
                        scope: $scope
                    });
                } else if ($scope.checkInState.hasCardOnFile && $rootScope.isStandAlone) {
                    authorize({
                        is_emv_request: false,
                        amount: $scope.checkInState.authorizationAmount,
                        payment_method_id: getPaymentMethodId()
                    });
                } else {
                    $log.info('prompt for swipe disabled in settings AND cannot authorize WITHOUT card on file');
                    // CICO-43681 Authorization is applicable only for credit cards; as there is no credit card and
                    // prompting for card is disabled; continue to check-in
                    completeCheckin();
                }
            };

            /**
             * The params should contain the following keys
             * is_emv_request - boolean; defaults to false
             * amount - number; defaults to 0
             * payment_method_id - number
             * @param {object} params as described above
             * @return {undefined}
             */
            var authorize = function authorize(params) {
                _.extend(params, {
                    reservation_id: $scope.reservationBillData.reservation_id
                });

                if (params.amount > 0 && $scope.authorizationInfo.is_cc_authorize_at_checkin_enabled) {
                    ngDialog.open({
                        template: '/assets/partials/authorization/ccAuthorization.html',
                        className: '',
                        closeByDocument: false,
                        scope: $scope,
                        controller: 'RVCheckInAuthCtrl',
                        data: angular.toJson(params)
                    });
                } else {
                    completeCheckin();
                }
            };

            var completeCheckin = function completeCheckin() {
                var signature = $scope.getSignature(),
                    params = {
                    is_promotions_and_email_set: $scope.saveData.promotions,
                    reservation_id: $scope.reservationBillData.reservation_id,
                    restrict_post: !!$scope.reservationBillData.restrict_post
                };

                $log.info('completeCheckIn', params);

                if (signature !== 'isSigned' && signature !== '[]') {
                    params.signature = $scope.getSignatureBase64Data();
                }

                // This flag is set from the rvBillCardCtrl
                if ($scope.swippedCard) {
                    _.extend(params, $scope.checkInState.swipedCardData);
                }

                // check if the T&C was shown, if shown pass true if was accepted
                if ($scope.reservationBillData.is_disabled_terms_conditions_checkin === 'false') {
                    params.accepted_terms_and_conditions = $scope.saveData.termsAndConditions;
                }

                ngDialog.close();

                $scope.callAPI(RVBillCardSrv.completeCheckin, {
                    params: params,
                    successCallBack: $scope.completeCheckinSuccessCallback,
                    failureCallBack: $scope.completeCheckinFailureCallback
                });
            };

            // ------------------------------------------------------------------------------------ state
            $scope.checkInState = {
                authorizeIncidentalOnly: false,
                authorizationAmount: 0,
                hasActiveEMV: RVHotelDetailsSrv.isActiveMLIEMV(),
                hasSuccessfulAuthorization: false,
                hasCardOnFile: $scope.billHasCreditCard(),
                isAuthInfoFetchComplete: false,
                isAuthorizationInProgress: false,
                requireSignature: $scope.signatureNeeded(),
                requireTerms: $scope.termsConditionsNeeded(),
                isListeningSwipe: false,
                swipedCardData: {}
            };

            // ------------------------------------------------------------------------------------ onUserAction
            $scope.onClickEMV = function () {
                var amountToAuth = $scope.checkInState.authorizationAmount;

                // In case of EMV, if user hasn't chosen incidentals only
                // we will have to authorize for the original Amount;
                if (!$scope.checkInState.authorizeIncidentalOnly) {
                    amountToAuth = $scope.authorizationInfo.original_pre_auth_amount_at_checkin;
                }

                authorize({
                    is_emv_request: true,
                    amount: amountToAuth
                });
            };

            var onSuccessAddCardWithEMV = function onSuccessAddCardWithEMV(data) {
                var cardDetails = data.cardDetails,
                    response = data.response,
                    paymentData = $scope.reservationBillData;

                _.extend(paymentData.bills[0].credit_card_details, {
                    card_code: cardDetails.card_code,
                    card_number: cardDetails.ending_with,
                    card_expiry: cardDetails.expiry_date,
                    payment_id: response.id,
                    is_swiped: cardDetails.is_swiped,
                    auth_color_code: cardDetails.auth_color_code
                });

                paymentData.bills[0].credit_card_details.payment_type = 'CC';

                // CICO-9739 : To update on reservation card payment section while updating from bill#1 credit card type.
                if ($scope.billNumber === 1) {
                    $rootScope.$emit('UPDATEDPAYMENTLIST', paymentData.bills[0].credit_card_details);
                }

                $rootScope.$broadcast('BALANCECHANGED', {
                    balance: response.reservation_balance,
                    confirm_no: paymentData.confirm_no
                });

                // CICO-34754: room charge enabled needs to be true if cc added.
                $rootScope.$broadcast('paymentChangedToCC');

                $timeout(completeCheckin, 300);

                $scope.$emit('UPDATECCATTACHEDBILLSTATUS', response.has_any_credit_card_attached_bill);
            };

            $scope.addCardWithEMV = function () {
                ngDialog.close();
                sntEMVSharedSrv.addCardInTerminal({
                    workstation_id: $scope.workstation_id,
                    bill_number: $scope.reservationData.bills[$scope.currentActiveBill].bill_number,
                    reservation_id: $scope.reservationData.reservationId,
                    emvTimeout: $scope.emvTimeout
                }).then(onSuccessAddCardWithEMV, function (error) {
                    $log.warn(error);
                    $scope.errorMessage = error;
                });
            };

            $scope.onClickUseCardOnFile = function () {
                authorize({
                    is_emv_request: false,
                    amount: $scope.checkInState.authorizationAmount,
                    payment_method_id: getPaymentMethodId()
                });
            };

            $scope.onClickNoSwipe = function () {
                ngDialog.close();
                completeCheckin();
            };

            var shijiAuthActions = function shijiAuthActions() {
                if ($scope.checkInState.hasCardOnFile) {
                    $scope.onClickUseCardOnFile();
                } else {
                    completeCheckin();
                }
            };

            var proceedWithAuthorizations = function proceedWithAuthorizations() {
                $timeout(promptForSwipe, 700);
            };

            $scope.onClickIncidentalsOnly = function () {
                $scope.checkInState.authorizeIncidentalOnly = true;
                // set the authorization amount to incidentals
                $scope.checkInState.authorizationAmount = $scope.authorizationInfo.pre_auth_amount_for_incidentals;
                ngDialog.close();
                proceedWithAuthorizations();
            };

            $scope.onClickFullAuth = function () {
                $scope.checkInState.authorizeIncidentalOnly = false;
                $scope.checkInState.authorizationAmount = $scope.authorizationInfo.pre_auth_amount_at_checkin;
                ngDialog.close();
                proceedWithAuthorizations();
            };

            $scope.onClickManualAuth = function () {
                completeCheckin();
            };

            // ------------------------------------------------------------------------------------ onCheckIn
            $scope.checkIn = function () {
                var errorMsg,
                    signatureData = $scope.getSignature(),
                    reservationStatus = $scope.reservationBillData.reservation_status;

                // CICO-44240 Stick to legacy flow in case of standalone!
                if (!$rootScope.isStandAlone) {
                    $scope.clickedCompleteCheckin();
                    return false;
                }

                if ($scope.signatureNeeded(signatureData) && !$scope.reservation.reservation_card.is_pre_checkin) {
                    errorMsg = 'Signature is missing';
                    $scope.showErrorPopup(errorMsg);
                    return;
                } else if ($scope.termsConditionsNeeded()) {
                    errorMsg = 'Please check agree to the Terms & Conditions';
                    $scope.showErrorPopup(errorMsg);
                    return;
                } else if ($scope.validateEmailNeeded()) {
                    ngDialog.open({
                        template: '/assets/partials/validateCheckin/rvAskEmailFromCheckin.html',
                        controller: 'RVValidateEmailPhoneCtrl',
                        className: '',
                        scope: $scope
                    });
                    return;
                }

                // CICO-36122 - Set this to keep the promos and news opt in check-in screen in sync with guest card
                if (!!$scope.guestCardData && !!$scope.guestCardData.contactInfo) {
                    $scope.guestCardData.contactInfo.is_opted_promotion_email = $scope.saveData.promotions;
                }

                if ($scope.hasAnySharerCheckedin()) {
                    // Do nothing , Keep going check-in process , it is a sharer reservation..
                } else if (($scope.reservationBillData.room_status === 'NOTREADY' || $scope.reservationBillData.fo_status === 'OCCUPIED') && !$rootScope.queuedCheckIn) {
                    // Go to room assignment view
                    $state.go('rover.reservation.staycard.roomassignment', {
                        'reservation_id': $scope.reservationBillData.reservation_id,
                        'room_type': $scope.reservationBillData.room_type,
                        'clickedButton': 'checkinButton',
                        'upgrade_available': $scope.reservationBillData.is_upsell_available && (reservationStatus === 'RESERVED' || reservationStatus === 'CHECKING_IN'),
                        "roomTypeId": $scope.reservation.reservation_card.room_type_id
                    });

                    return false;
                }

                // see if the auth info fetch has been completed! else show loader
                if ($scope.checkInState.isAuthInfoFetchComplete) {
                    sntActivity.stop('FETCH_PRE_AUTH');
                    // This step is required as the user can edit the payment method from the check-in screen
                    $scope.checkInState.hasCardOnFile = $scope.billHasCreditCard();

                    var hasAnyRouting = $scope.authorizationInfo.routingToRoom || $scope.authorizationInfo.routingFromRoom || $scope.authorizationInfo.routingToAccount;

                    // is_cc_authorize_at_checkin_enabled is returned in /api/reservations/:reservation_id/pre_auth
                    if ($scope.authorizationInfo.is_cc_authorize_at_checkin_enabled || !$scope.reservationBillData.is_disabled_cc_swipe) {
                        if (hasAnyRouting && $scope.authorizationInfo.is_cc_authorize_at_checkin_enabled && ($scope.checkInState.hasCardOnFile || !$scope.reservationBillData.is_disabled_cc_swipe)) {
                            // https://stayntouch.atlassian.net/browse/CICO-17287
                            promptForAuthorizationAmount();
                        } else {
                            promptForSwipe();
                        }
                    } else {
                        // if is_cc_authorize_at_checkin enabled is false; then needn't authorize
                        completeCheckin();
                    }
                } else {
                    sntActivity.start('FETCH_PRE_AUTH');

                    $timeout($scope.checkIn, 700);
                }
            };

            var initListeners = function initListeners() {
                listeners['CONTINUE_CHECKIN'] = $scope.$on('CONTINUE_CHECKIN', function (response) {
                    $log.info('CONTINUE_CHECKIN', response);
                    completeCheckin();
                });

                listeners['SWIPED_CARD_ADDED'] = $scope.$on('SWIPED_CARD_ADDED', function (event, swipedCardData) {
                    // Wait till the other modals have closed
                    if ($scope.checkInState.isListeningSwipe) {
                        $timeout(function () {
                            $scope.checkInState.swipedCardData = swipedCardData;
                            $scope.onClickUseCardOnFile();
                        }, 700);
                    }
                });

                listeners['STOP_CHECKIN_PROCESS'] = $scope.$on('STOP_CHECKIN_PROCESS', function () {
                    $scope.checkInState.isListeningSwipe = false;
                    $scope.checkInState.authorizationAmount = $scope.authorizationInfo.pre_auth_amount_at_checkin;
                    ngDialog.close();
                });

                listeners['FETCH_REMAINING_AUTH'] = $scope.$on('FETCH_REMAINING_AUTH', function () {
                    $scope.checkInState.isAuthInfoFetchComplete = false;
                    sntActivity.start('REFRESH_PRE_AUTH_INFO');
                    fetchAuthInfo();
                });

                // ------------------------------------------------------------------------------------ Clean up...

                $scope.$on('$destroy', listeners['CONTINUE_CHECKIN']);
                $scope.$on('$destroy', listeners['SWIPED_CARD_ADDED']);
                $scope.$on('$destroy', listeners['STOP_CHECKIN_PROCESS']);
                $scope.$on('$destroy', listeners['FETCH_REMAINING_AUTH']);
            };

            // ------------------------------------------------------------------------------------ Init
            (function () {
                $scope.authorizationInfo = null;
                // Do an async fetch of the auth info... needn't show blocker
                fetchAuthInfo();

                if ($rootScope.isStandAlone) {
                    initListeners();
                }
            })();
        }]);

        // DONE: Handle payment method update from the check-in screen; the $scope.checkInState will have to be re-computed
        // DONE: Enable complete check-in button only after the signature; terms and conditions are checked (take note of the settings)
        // DONE: Handle EMV polling
    }, {}] }, {}, [1]);