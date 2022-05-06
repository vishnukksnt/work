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
        sntRover.controller('RVReservationSummaryCtrl', ['$rootScope', 'jsMappings', '$scope', '$state', 'RVReservationSummarySrv', 'RVContactInfoSrv', '$filter', '$location', '$stateParams', 'dateFilter', '$vault', '$timeout', 'ngDialog', 'RVPaymentSrv', 'RVReservationCardSrv', 'RVGuestCardSrv', 'rvPermissionSrv', 'RVReservationGuestSrv', '$q', 'paymentMethods', 'RVReservationPackageSrv', 'RVAutomaticEmailSrv', function ($rootScope, jsMappings, $scope, $state, RVReservationSummarySrv, RVContactInfoSrv, $filter, $location, $stateParams, dateFilter, $vault, $timeout, ngDialog, RVPaymentSrv, RVReservationCardSrv, RVGuestCardSrv, rvPermissionSrv, RVReservationGuestSrv, $q, paymentMethods, RVReservationPackageSrv, RVAutomaticEmailSrv) {

            BaseCtrl.call(this, $scope);

            SharedMethodsBaseCtrl.call(this, $scope, $rootScope, RVAutomaticEmailSrv, ngDialog);

            $scope.isSubmitButtonEnabled = false;

            if ($scope.reservationData.reservationId !== '') {
                $scope.isSubmitButtonEnabled = true;
            }

            var that = this;

            var roomAndRatesState = 'rover.reservation.staycard.mainCard.room-rates';

            $rootScope.setPrevState = {
                title: $rootScope.getPrevStateTitle()
            };

            $scope.passData = {
                "details": {
                    "firstName": $scope.reservationData.guest.firstName,
                    "lastName": $scope.reservationData.guest.lastName
                }
            };
            $scope.isSixCardSwiped = false;
            $scope.addmode = true;
            $scope.showCCPage = false;
            $scope.addToGuestCard = false;
            if (typeof $scope.renderData === 'undefined') {
                $scope.renderData = {};
                $scope.reservationEditMode = false;
            }
            $scope.isManual = false;
            $scope.isNewCardAdded = false;
            // clear error notifications
            $scope.errorMessage = "";
            $scope.depositData = {
                "depositAttemptFailure": false,
                "attempted": false
            };

            $scope.summaryState = {
                forceDemographicsData: false,
                computedSegment: false,
                selectedCardDetails: {
                    value: ""
                }
            };

            /**
             * function to check whether the user has permission
             * to make payment
             * @return {Boolean}
             */
            $scope.hasPermissionToMakePayment = function () {
                return rvPermissionSrv.getPermissionValue('MAKE_PAYMENT');
            };

            /**
             * function to determine the visibility of Make Payment button
             * @return {Boolean}
             */
            $scope.hideMakePayment = function () {
                return !$scope.hasPermissionToMakePayment();
            };

            $scope.feeData = {};
            var zeroAmount = parseFloat("0.00");

            $scope.successPaymentList = function (data) {
                $scope.$emit("hideLoader");
                $scope.cardsList = data;
                angular.forEach($scope.cardsList, function (card, key) {
                    // For common payment HTML to work - Payment modifications story
                    card.value = card.id;
                    delete card.id;
                });
            };
            $scope.fetchGuestCreditCards = function () {
                if (typeof $scope.cardsList === 'undefined' && $scope.reservationData.guest.id !== null) {
                    $scope.invokeApi(RVGuestCardSrv.fetchGuestPaymentData, $scope.reservationData.guest.id, $scope.successPaymentList);
                }
            };
            if (!(typeof $scope.reservationData.guest.id === 'undefined' || $scope.reservationData.guest.id === '' || $scope.reservationData.guest.id === null)) {
                $scope.fetchGuestCreditCards();
            }

            // CICO-11591 : To show or hide fees calculation details.
            $scope.isShowFees = function () {
                var isShowFees = false;
                var feesData = $scope.feeData;

                if (typeof feesData === 'undefined' || typeof feesData.feesInfo === 'undefined' || feesData.feesInfo === null) {
                    isShowFees = false;
                } else if (feesData.defaultAmount >= feesData.minFees && $scope.isStandAlone && feesData.feesInfo.amount) {
                    isShowFees = true;
                }
                return isShowFees;
            };

            // CICO-9457 : To calculate fee - for standalone only
            $scope.calculateFee = function () {

                if ($scope.isStandAlone) {
                    var feesInfo = $scope.feeData.feesInfo;
                    var amountSymbol = "";
                    var feePercent = zeroAmount;
                    var minFees = zeroAmount;

                    if (typeof feesInfo !== 'undefined' && feesInfo !== null) {
                        amountSymbol = feesInfo.amount_symbol;
                        feePercent = feesInfo.amount ? parseFloat(feesInfo.amount) : zeroAmount;
                        minFees = feesInfo.minimum_amount_for_fees ? parseFloat(feesInfo.minimum_amount_for_fees) : zeroAmount;
                    }

                    var totalAmount = $scope.reservationData.depositAmount === "" ? zeroAmount : parseFloat($scope.reservationData.depositAmount);

                    $scope.feeData.minFees = minFees;
                    $scope.feeData.defaultAmount = totalAmount;

                    if ($scope.isShowFees()) {

                        if (amountSymbol === "percent") {
                            var calculatedFee = parseFloat(totalAmount * (feePercent / 100));

                            $scope.feeData.calculatedFee = parseFloat(calculatedFee).toFixed(2);
                            $scope.feeData.totalOfValueAndFee = parseFloat(calculatedFee + totalAmount).toFixed(2);
                        } else {
                            $scope.feeData.calculatedFee = parseFloat(feePercent).toFixed(2);
                            $scope.feeData.totalOfValueAndFee = parseFloat(totalAmount + feePercent).toFixed(2);
                        }
                    }
                }
            };

            $scope.$on("UPDATEFEE", function () {
                $scope.feeData.feesInfo = $scope.reservationData.fees_details;
                $scope.setupFeeData();
                $scope.calculateFee();
            });

            // CICO-9457 : Data for fees details.
            $scope.setupFeeData = function () {
                var feesInfo = $scope.feeData.feesInfo ? $scope.feeData.feesInfo : {};
                var defaultAmount = $scope.reservationData ? parseFloat($scope.reservationData.depositAmount) : zeroAmount;

                var minFees = feesInfo.minimum_amount_for_fees ? parseFloat(feesInfo.minimum_amount_for_fees) : zeroAmount;

                $scope.feeData.minFees = minFees;
                $scope.feeData.defaultAmount = defaultAmount;

                if ($scope.isShowFees()) {

                    if (typeof feesInfo.amount !== 'undefined' && feesInfo !== null) {

                        var amountSymbol = feesInfo.amount_symbol;
                        var feesAmount = feesInfo.amount ? parseFloat(feesInfo.amount) : zeroAmount;

                        $scope.feeData.actualFees = feesAmount;

                        if (amountSymbol === "percent") {
                            $scope.calculateFee();
                        } else {
                            $scope.feeData.calculatedFee = parseFloat(feesAmount).toFixed(2);
                            $scope.feeData.totalOfValueAndFee = parseFloat(feesAmount + defaultAmount).toFixed(2);
                        }
                    }
                }
            };

            // CICO-12413 : To calculate Total of fees and amount to pay.
            $scope.calculateTotalAmount = function (amount) {

                var feesAmount = typeof $scope.feeData.calculatedFee === 'undefined' || $scope.feeData.calculatedFee === '' || $scope.feeData.calculatedFee === '-' ? zeroAmount : parseFloat($scope.feeData.calculatedFee);
                var amountToPay = typeof amount === 'undefined' || amount === '' ? zeroAmount : parseFloat(amount);

                $scope.feeData.totalOfValueAndFee = parseFloat(amountToPay + feesAmount).toFixed(2);
            };

            $scope.reservationData.referanceText = "";

            var retrieveCardtype = function retrieveCardtype() {
                var cardType = $scope.newPaymentInfo.tokenDetails.isSixPayment ? getSixCreditCardType($scope.newPaymentInfo.tokenDetails.card_type).toLowerCase() : getCreditCardType($scope.newPaymentInfo.cardDetails.cardType).toLowerCase();

                return cardType;
            };

            var retrieveCardNumber = function retrieveCardNumber() {
                var cardNumber = $scope.newPaymentInfo.tokenDetails.isSixPayment ? $scope.newPaymentInfo.tokenDetails.token_no.substr($scope.newPaymentInfo.tokenDetails.token_no.length - 4) : $scope.newPaymentInfo.cardDetails.cardNumber.slice(-4);

                return cardNumber;
            };

            var retrieveExpiryDate = function retrieveExpiryDate() {
                var expiryMonth = $scope.newPaymentInfo.tokenDetails.isSixPayment ? $scope.newPaymentInfo.tokenDetails.expiry.substring(2, 4) : $scope.newPaymentInfo.cardDetails.expiryMonth;
                var expiryYear = $scope.newPaymentInfo.tokenDetails.isSixPayment ? $scope.newPaymentInfo.tokenDetails.expiry.substring(0, 2) : $scope.newPaymentInfo.cardDetails.expiryYear;
                var expiryDate = expiryMonth + " / " + expiryYear;

                return expiryDate;
            };

            var retrieveExpiryDateForSave = function retrieveExpiryDateForSave() {
                var expiryMonth = $scope.newPaymentInfo.tokenDetails.isSixPayment ? $scope.newPaymentInfo.tokenDetails.expiry.substring(2, 4) : $scope.newPaymentInfo.cardDetails.expiryMonth;
                var expiryYear = $scope.newPaymentInfo.tokenDetails.isSixPayment ? $scope.newPaymentInfo.tokenDetails.expiry.substring(0, 2) : $scope.newPaymentInfo.cardDetails.expiryYear;
                var expiryDate = "20" + expiryYear + "-" + expiryMonth + "-" + "01";

                return expiryDate;
            };

            $scope.$on('cancelCardSelection', function () {
                $scope.depositWithGiftCard = false;
                $scope.hideCancelCard = false;
                $scope.showCCPage = false;
                $scope.reservationData.paymentType.type.value = "";
                $scope.isManual = false;
            });

            $scope.$on("MLI_ERROR", function (e, data) {
                $scope.errorMessage = data;
            });

            $scope.$on("FAILURE_UPDATE_RESERVATION", function (e, data) {
                $scope.errorMessage = data;
            });

            $scope.$on("FAILURE_SAVE_RESERVATION", function (e, data) {
                $scope.errorMessage = data;
            });

            /**
             * Method to communicate to the guest card payment controller the adding of the card to the guest card
             * @param {object} data response from submit_payment API
             * @returns {undefined} undefined
             */
            function addToGuestCard(cardDetails) {
                var dataToGuestList = {
                    'id': cardDetails.value,
                    'isSelected': true,
                    'card_code': cardDetails.card_code,
                    'is_primary': false,
                    'payment_type': 'CC',
                    'card_expiry': cardDetails.expiry_date,
                    'mli_token': cardDetails.ending_with,
                    'card_name': cardDetails.holder_name,
                    'payment_type_id': 1
                };

                // Handled in rvGuestPaymentCtrl.js
                $rootScope.$broadcast('ADDEDNEWPAYMENTTOGUEST', dataToGuestList);
            }

            var savenewCc = function savenewCc() {

                var ccSaveSuccess = function ccSaveSuccess(data) {

                    $scope.showSelectedCreditCard = true;
                    $scope.reservationData.selectedPaymentId = data.id;
                    $scope.renderData.creditCardType = retrieveCardtype();
                    $scope.renderData.endingWith = retrieveCardNumber();
                    $scope.renderData.cardExpiry = retrieveExpiryDate();
                    if ($scope.isStandAlone) {
                        $scope.feeData.feesInfo = data.fees_information;
                        $scope.setupFeeData();
                    }
                    $scope.isNewCardAdded = true;
                    $scope.$emit('hideLoader');
                    refreshScrolls();
                };

                var data = {};

                data.reservation_id = $scope.reservationData.reservationId;
                data.token = !$scope.newPaymentInfo.tokenDetails.isSixPayment ? $scope.newPaymentInfo.tokenDetails.session : $scope.newPaymentInfo.tokenDetails.token_no;
                data.card_code = $scope.newPaymentInfo.tokenDetails.isSixPayment ? getSixCreditCardType($scope.newPaymentInfo.tokenDetails.card_type).toLowerCase() : $scope.newPaymentInfo.cardDetails.cardType;
                if (!$scope.newPaymentInfo.tokenDetails.isSixPayment) {
                    data.card_expiry = retrieveExpiryDateForSave();
                }
                data.card_name = !$scope.newPaymentInfo.tokenDetails.isSixPayment ? $scope.newPaymentInfo.cardDetails.userName : $scope.passData.details.firstName + " " + $scope.passData.details.lastName;
                if ($scope.newPaymentInfo.tokenDetails.isSixPayment || $scope.isGiftCard) {
                    $scope.isManual = true;
                }

                if (!$scope.isGiftCard) {
                    $scope.invokeApi(RVPaymentSrv.savePaymentDetails, data, ccSaveSuccess);
                } else {

                    $scope.showSelectedCreditCard = true;
                    $scope.reservationData.selectedPaymentId = data.id;
                    $scope.renderData.creditCardType = retrieveCardtype();
                    $scope.renderData.endingWith = retrieveCardNumber();
                    $scope.renderData.cardExpiry = retrieveExpiryDate();
                    if ($scope.isStandAlone) {
                        $scope.feeData.feesInfo = data.fees_information;
                        $scope.setupFeeData();
                    }
                    $scope.isNewCardAdded = true;

                    if ($scope.isGiftCard) {
                        // switch this back for the UI if the payment was a gift card
                        $scope.reservationData.paymentType.type.value = "GIFT_CARD";
                        var fetchGiftCardBalanceSuccess = function fetchGiftCardBalanceSuccess(giftCardData) {
                            $scope.giftCardAvailableBalance = giftCardData.amount;
                            // data.expiry_date //unused at this time
                            $scope.$emit('hideLoader');
                        };

                        $scope.invokeApi(RVReservationCardSrv.checkGiftCardBalance, {
                            'card_number': $scope.newPaymentInfo.cardDetails.cardNumber
                        }, fetchGiftCardBalanceSuccess);
                    } else {
                        $scope.$emit('hideLoader');
                    }
                    refreshScrolls();
                }
            };

            $scope.$on("TOKEN_CREATED", function (e, data) {
                $rootScope.$emit("showLoader");
                $scope.newPaymentInfo = data;
                $scope.showSelectedCreditCard = false;
                $scope.showCCPage = false;
                savenewCc();
            });

            /*
             * Commented out .if existing cards needed remove comments
             */

            var setCreditCardFromList = function setCreditCardFromList(index) {
                $scope.reservationData.selectedPaymentId = $scope.cardsList[index].value;
                $scope.renderData.creditCardType = $scope.cardsList[index].card_code.toLowerCase();
                $scope.renderData.endingWith = $scope.cardsList[index].mli_token;
                $scope.renderData.cardExpiry = $scope.cardsList[index].card_expiry;
                $scope.showCCPage = false;
                $scope.showSelectedCreditCard = true;
                // CICO-9457 : Data for fees details - standalone only.
                // CICO-13427 : API response changed from fees_information to fees_details
                if ($scope.isStandAlone) {
                    $scope.feeData.feesInfo = $scope.cardsList[index].fees_details;
                    $scope.setupFeeData();
                }

                refreshScrolls();
                $scope.isNewCardAdded = false;
            };

            $scope.$on('cardSelected', function (e, data) {
                setCreditCardFromList(data.index);
            });

            $scope.checkReferencetextAvailable = function () {
                var referenceTextAvailable = false;

                angular.forEach(paymentMethodsCopy, function (paymentMethod, key) {
                    if ($scope.reservationData.paymentType.type.value === "CC" && paymentMethod.value === "CC") {
                        angular.forEach(paymentMethod.credit_card_list, function (value, key) {
                            if (typeof $scope.renderData.creditCardType !== 'undefined' && $scope.renderData.creditCardType.toUpperCase() === value.cardcode) {
                                referenceTextAvailable = value.is_display_reference ? true : false;
                            }
                        });
                    } else if (paymentMethod.value === $scope.reservationData.paymentType.type.value) {
                        referenceTextAvailable = paymentMethod.is_display_reference ? true : false;
                    }
                });
                return referenceTextAvailable;
            };
            $scope.showSelectedCreditCardButton = function () {
                if ($scope.showSelectedCreditCard && !$scope.showCCPage && $scope.reservationData.paymentType.type.value === 'CC' && ($scope.paymentGateway !== 'sixpayments' || $scope.isManual || $scope.reservationEditMode)) {
                    return true;
                } else return false;
            };

            $scope.showCardInputType = function () {
                if ($scope.paymentGateway === 'sixpayments' && $scope.reservationData.paymentType.type.value === 'CC' && !$scope.showCCPage) {
                    return true;
                } else return false;
            };

            $scope.hidePaymentSelection = function () {
                if ($scope.showCCPage || $scope.depositData.attempted && !$scope.depositData.depositAttemptFailure) {
                    return true;
                } else return false;
            };

            $scope.tryAgain = function () {
                $scope.errorMessage = "";
                $scope.depositData.attempted = false;
                $scope.depositData.depositSuccess = false;
                $scope.depositData.depositAttemptFailure = false;
            };

            var runDigestCycle = function runDigestCycle() {
                if (!$scope.$$phase) {
                    $scope.$digest();
                }
            };

            $scope.payDeposit = function () {
                var onPaymentSuccess = function onPaymentSuccess(data) {
                    // On continue on create reservation - add to guest card - to fix undefined issue on tokendetails
                    if ($scope.reservationData.paymentType.type.value !== "CC") {
                        $scope.isNewCardAdded = false;
                    }
                    $scope.depositData.attempted = true;
                    $scope.depositData.depositSuccess = true;
                    $scope.depositData.authorizationCode = data.authorization_code;
                    $scope.reservationData.selectedPaymentId = data.payment_method.id;

                    $scope.reservationData.depositData = angular.copy($scope.depositData);
                    runDigestCycle();
                    // On continue on create reservation - add to guest card - to fix undefined issue on tokendetails - commenting the if else block below for CICO-14199
                    $scope.$emit('hideLoader');
                },
                    onPaymentFailure = function onPaymentFailure(errorMessage) {
                    $scope.depositData.attempted = true;
                    $scope.depositData.depositAttemptFailure = true;
                    $scope.reservationData.depositData = angular.copy($scope.depositData);

                    $scope.paymentErrorMessage = errorMessage[0];
                    runDigestCycle();
                    $scope.$emit('hideLoader');
                };

                var dataToMakePaymentApi = {
                    "postData": {
                        "bill_number": 1,
                        "payment_type": $scope.reservationData.paymentType.type.value,
                        "amount": $scope.reservationData.depositAmount,
                        "payment_type_id": null,
                        "reservation_ids": $scope.reservationData.reservationIds
                    },
                    "reservation_id": $scope.reservationData.reservationId
                };

                if (dataToMakePaymentApi.postData.payment_type === "CC") {
                    dataToMakePaymentApi.postData.payment_type_id = $scope.reservationData.selectedPaymentId;
                }

                if (dataToMakePaymentApi.postData.payment_type === "GIFT_CARD") {
                    delete dataToMakePaymentApi.postData.payment_type_id;
                    dataToMakePaymentApi.postData.card_number = $.trim($scope.num); // trim to remove whitespaces from copy-paste
                }

                if ($scope.isShowFees()) {
                    if ($scope.feeData.calculatedFee) {
                        dataToMakePaymentApi.postData.fees_amount = $scope.feeData.calculatedFee;
                    }
                    if ($scope.feeData.feesInfo) {
                        dataToMakePaymentApi.postData.fees_charge_code_id = $scope.feeData.feesInfo.charge_code_id;
                    }
                }

                if ($scope.checkReferencetextAvailable()) {
                    dataToMakePaymentApi.postData.reference_text = $scope.reservationData.referanceText;
                }
                if ($rootScope.paymentGateway === "sixpayments" && !$scope.isManual && $scope.reservationData.paymentType.type.value === "CC") {
                    dataToMakePaymentApi.postData.is_emv_request = true;
                    ngDialog.open({
                        template: '/assets/partials/reservation/rvWaitingDialog.html',
                        className: 'ngdialog-theme-default',
                        closeByDocument: false,
                        scope: $scope
                    });
                    $scope.shouldShowWaiting = true;
                    RVPaymentSrv.submitPaymentOnBill(dataToMakePaymentApi).then(function (response) {
                        $scope.shouldShowWaiting = false;
                        $scope.isSixCardSwiped = true;
                        $scope.closeDialog();
                        onPaymentSuccess(response);
                    }, function (error) {
                        $scope.shouldShowWaiting = false;
                        $scope.isSixCardSwiped = false;
                        onPaymentFailure(error);
                        $scope.closeDialog();
                    });
                } else {
                    $scope.invokeApi(RVPaymentSrv.submitPaymentOnBill, dataToMakePaymentApi, onPaymentSuccess, onPaymentFailure);
                }
            };

            $scope.submitReservationButtonClass = function (isSubmitButtonEnabled) {
                var buttonClass = "grey";

                if (isSubmitButtonEnabled) {
                    buttonClass = "green";
                }
                return buttonClass;
            };

            // set the previous state --

            if ($stateParams.reservation !== "HOURLY") {
                $rootScope.setPrevState = {
                    title: $filter('translate')('ROOM_RATES'),
                    name: roomAndRatesState,
                    param: {
                        from_date: $scope.reservationData.arrivalDate,
                        to_date: $scope.reservationData.departureDate,
                        view: "ROOM_RATE",
                        company_id: $scope.reservationData.company.id,
                        travel_agent_id: $scope.reservationData.travelAgent.id,
                        group_id: $scope.reservationData.group.id,
                        allotment_id: $scope.reservationData.allotment.id,
                        room_type_id: $scope.reservationData.tabs[$scope.viewState.currentTab].roomTypeId,
                        adults: $scope.reservationData.tabs[$scope.viewState.currentTab].numAdults,
                        children: $scope.reservationData.tabs[$scope.viewState.currentTab].numChildren
                    }
                };
            }

            var save = function save() {
                if ($scope.reservationData.guest.id || $scope.reservationData.company.id || $scope.reservationData.travelAgent.id || $scope.reservationData.group.id || $scope.reservationData.allotment.id) {
                    $scope.saveReservation();
                }
            };

            var createReservation = function createReservation() {
                if (!$scope.reservationData.guest.id && !$scope.reservationData.company.id && !$scope.reservationData.travelAgent.id && !$scope.reservationData.group.id && !$scope.reservationData.allotment.id) {
                    $timeout(function () {
                        $scope.$emit('PROMPTCARD');
                    }, 3000);
                    $scope.$watch("reservationData.guest.id", save);
                    $scope.$watch("reservationData.company.id", save);
                    $scope.$watch("reservationData.travelAgent.id", save);
                } else {
                    $scope.saveReservation();
                }
            };

            $scope.isContinueDisabled = function () {
                var depositPaid = false;

                if ($scope.depositData.isDepositRequired && $scope.reservationData.isValidDeposit) {
                    depositPaid = $scope.depositData.attempted ? true : false;
                } else {
                    depositPaid = true;
                }
                var idPresent = $stateParams.mode === 'OTHER' || $stateParams.mode === 'EDIT_HOURLY' ? !$scope.reservationData.guest.id && !$scope.reservationData.company.id && !$scope.reservationData.travelAgent.id && !$scope.reservationData.group.id && !$scope.reservationData.allotment.id : true;
                var isPaymentTypeNotSelected = $scope.reservationData.paymentType.type.value === null || typeof $scope.reservationData.paymentType.type.value === "undefined" || $scope.reservationData.paymentType.type.value.length === 0;
                // CICO-30786 - check the payment type selection only if deposit not paid
                var isContinueDisabled = idPresent || !depositPaid;

                if (!depositPaid) {
                    isContinueDisabled = isContinueDisabled || isPaymentTypeNotSelected;
                }
                return isContinueDisabled;
            };

            $scope.init = function () {
                if ($scope.isStandAlone) {
                    // Setup fees info
                    $scope.feeData.feesInfo = $scope.reservationData.selected_payment_fees_details;
                    $scope.setupFeeData();
                    // CICO-15107 --
                    var aptSegment = ""; // Variable to store the suitable segment ID
                    // CICO-42023
                    var segmentsSortedByLOS = _.sortBy($scope.otherData.segments, 'los');

                    angular.forEach(segmentsSortedByLOS, function (segment) {
                        if ($scope.reservationData.stayDays.length - 1 <= segment.los) {
                            if (!aptSegment) {
                                aptSegment = segment.value;
                            }
                        }
                    });

                    if (!!aptSegment) {
                        $scope.summaryState.computedSegment = true;
                    }

                    $scope.reservationData.demographics.segment = aptSegment;
                    angular.forEach($scope.reservationData.rooms, function (room) {
                        if (!!room.demographics) {
                            room.demographics.segment = $scope.reservationData.demographics.segment;
                        }
                    });
                }

                $scope.data = {};

                $scope.cards = {
                    available: false,
                    activeView: "NEW"
                };

                if ($stateParams.reservation === "HOURLY") {
                    $scope.$emit('showLoader');
                    $scope.reservationData.isHourly = true;
                    $scope.reservationData.paymentType.type.value = "";
                    /**
                     * IF ( addons are enabled AND addons are configured AND user is taken to the addons screen from diary) THEN
                     *  - The data from vault would be processed in the addons controller
                     *  - the below block need not be entered
                     *  - IFF the reservation has not be edited
                     *  -- NOTE: if EDIT_HOURLY is set as mode in stateparams, then the reservation has been edited & the vault data has to be parsed
                     *
                     */
                    if ($rootScope.previousState.name !== 'rover.reservation.staycard.mainCard.addons' || $stateParams.mode === "EDIT_HOURLY") {
                        var temporaryReservationDataFromDiaryScreen = $vault.get('temporaryReservationDataFromDiaryScreen');

                        temporaryReservationDataFromDiaryScreen = JSON.parse(temporaryReservationDataFromDiaryScreen);
                        if (temporaryReservationDataFromDiaryScreen) {
                            var getRoomsSuccess = function getRoomsSuccess(data) {
                                var roomsArray = {};

                                angular.forEach(data.rooms, function (value, key) {
                                    var roomKey = value.id;

                                    roomsArray[roomKey] = value;
                                });
                                if ($stateParams.mode === "EDIT_HOURLY") {
                                    var room = temporaryReservationDataFromDiaryScreen.rooms[0];

                                    if (!!room.payment.payment_method_used) {
                                        $scope.reservationData.paymentType.type.description = room.payment.payment_method_description;
                                        $scope.reservationData.paymentType.type.value = room.payment.payment_method_used;

                                        // To show the used card in summary screen on edit mode
                                        if ($scope.reservationData.paymentType.type.value === "CC") {
                                            $scope.renderData.creditCardType = room.payment.payment_details.card_type_image.replace(".png", "").toLowerCase();
                                            $scope.renderData.endingWith = room.payment.payment_details.card_number;
                                            $scope.renderData.cardExpiry = room.payment.payment_details.card_expiry;
                                            $scope.renderData.isSwiped = room.payment.payment_details.is_swiped;
                                            $scope.reservationData.selectedPaymentId = room.payment.payment_details.id;
                                            // CICO-11579 - To show credit card if C&P swiped or manual.
                                            // In other cases condition in HTML will work
                                            if ($rootScope.paymentGateway === "sixpayments") {
                                                if (room.payment.payment_details.is_swiped) {
                                                    // can't set manual true..that is why added this flag.. Added in HTML too
                                                    $scope.reservationEditMode = true;
                                                } else {
                                                    $scope.isManual = true;
                                                }
                                            }
                                        }
                                        $scope.showSelectedCreditCard = true;
                                    }
                                    // CICO-29487 -> Before proceeding to this; need to fetch the addons details
                                    $scope.invokeApi(RVReservationPackageSrv.getReservationPackages, room.reservation_id, function (response) {
                                        temporaryReservationDataFromDiaryScreen.addons = response.existing_packages;
                                        $scope.populateDatafromDiary(roomsArray, temporaryReservationDataFromDiaryScreen, true);
                                        createReservation();
                                        refreshScrolls();
                                    });
                                } else {
                                    // CICO-29487 -> In case of creation; The addons are not part of the flow; So whilst creation; an hourly reservation cannot have addons
                                    $scope.populateDatafromDiary(roomsArray, temporaryReservationDataFromDiaryScreen, true);
                                    createReservation();
                                    refreshScrolls();
                                }
                            };

                            $scope.invokeApi(RVReservationSummarySrv.fetchRooms, {}, getRoomsSuccess);
                        }
                    } else {
                        createReservation();
                        refreshScrolls();
                    }
                    $scope.depositData = {};
                    if (!$scope.reservationData.depositData) {
                        $scope.depositData.isDepositRequired = false;
                        $scope.depositData.description = "";
                        $scope.reservationData.depositAmount = 0.00;
                        $scope.depositData.depositSuccess = !$scope.depositData.isDepositRequired;
                        $scope.depositData.attempted = false;
                        $scope.depositData.depositAttemptFailure = false;
                    } else {
                        $scope.depositData = $scope.reservationData.depositData;
                    }
                } else {
                    if (!$scope.reservationData.depositData) {
                        $scope.depositData = {};
                        var arrivalRate = $scope.reservationData.rooms[0].stayDates[$scope.reservationData.arrivalDate].rate.id;

                        $scope.depositData.isDepositRequired = !!$scope.reservationData.ratesMeta[arrivalRate].deposit_policy.id;
                        $scope.depositData.description = $scope.reservationData.ratesMeta[arrivalRate].deposit_policy.description;
                        $scope.depositData.depositSuccess = !$scope.depositData.isDepositRequired;
                        $scope.depositData.attempted = false;
                        $scope.depositData.depositAttemptFailure = false;
                    } else {
                        $scope.depositData = $scope.reservationData.depositData;
                    }
                    createReservation();
                }
                $scope.fetchDemoGraphics();
                $scope.otherData.isGuestPrimaryEmailChecked = $scope.reservationData.guest.email !== null && $scope.reservationData.guest.email !== "" ? true : false;
                $scope.otherData.isGuestAdditionalEmailChecked = false;
                $scope.reservationData.paymentMethods = paymentMethods;
                $scope.data.MLIData = {};
                $scope.isGuestEmailAlreadyExists = $scope.reservationData.guest.email !== null && $scope.reservationData.guest.email !== "" ? true : false;
                $scope.heading = "Guest Details & Payment";
                $scope.setHeadingTitle($scope.heading);

                $scope.setScroller('reservationSummary', {
                    'click': true
                });
                $scope.setScroller('paymentInfo', {
                    preventDefaultException: {
                        tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT|A|DIV|SPAN|LABEL)$/
                    }
                });
                $scope.setScroller('cardsList', {
                    'click': true,
                    'tap': true
                });

                // fetchPaymentMethods();
                refreshScrolls();
            };

            $scope.$on("UPDATEDEPOSIT", function () {
                $scope.depositData = $scope.reservationData.depositData;
            });

            var refreshScrolls = function refreshScrolls() {
                $timeout(function () {
                    $scope.refreshScroller('reservationSummary');
                    $scope.refreshScroller('paymentInfo');
                    $scope.refreshScroller('cardsList');
                }, 2000);
            };

            /**
             * Fetches all the payment methods
             */
            var paymentMethodsCopy = {};
            // CICO-14193
            var fetchPaymentMethods = function fetchPaymentMethods() {
                var data = paymentMethods;

                $scope.reservationData.paymentMethods = angular.copy(data);

                // CICO-14193
                paymentMethodsCopy = JSON.parse(JSON.stringify($scope.reservationData.paymentMethods));

                var reservationDataPaymentTypeValue = $scope.reservationData.paymentType.type.value;
                var payments = _.where(data, {
                    value: reservationDataPaymentTypeValue
                });

                if (payments.length > 0) {
                    $scope.reservationData.paymentType.type = payments[0];
                }

                data.forEach(function (item) {
                    if (item.value === 'CC') {
                        $scope.creditCardTypes = item.credit_card_list;
                    }
                });
            };

            /**
             * Click handler for confirm email Checkbox.
             * If checked, copies the guest email to the confirm email
             */
            $scope.confirmEmailCheckboxClicked = function () {
                $scope.reservationData.guest.sendConfirmMailTo = '';
                if ($scope.data.isConfirmationEmailSameAsGuestEmail) {
                    $scope.reservationData.guest.sendConfirmMailTo = $scope.reservationData.guest.email;
                }
                $scope.refreshPaymentScroller();
            };
            $scope.goToConfirmationScreen = function () {
                $state.go('rover.reservation.staycard.mainCard.reservationConfirm', {
                    "id": $scope.reservationData.reservationId,
                    "confirmationId": $scope.reservationData.confirmNum
                });
            };

            $scope.confirmReservation = function (skipAPICall) {
                if (!$scope.isDemographicsFormValid(true)) {
                    $scope.summaryState.forceDemographicsData = true;
                    $scope.setDemographics(true);
                    return;
                }
                var postData = $scope.computeReservationDataforUpdate(true, true);

                postData.payment_type = {};
                angular.forEach($scope.reservationData.paymentMethods, function (value, key) {
                    if (value.value === $scope.reservationData.paymentType.type.value) {
                        postData.payment_type.type_id = value.id;
                    }
                });
                if ($scope.reservationData.paymentType.type.value === 'CC') {

                    postData.payment_type.payment_method_id = $scope.reservationData.selectedPaymentId;
                }
                var saveSuccess = function saveSuccess(data) {
                    console.log(data);
                    console.log($scope.reservationData);
                    // CICO-18699 credit card not saving to guest card when selecting Deposit later option.
                    if ($scope.reservationData.paymentType.type.value === 'CC' && $scope.addToGuestCard) {
                        addToGuestCard($scope.summaryState.selectedCardDetails);
                    }
                    $state.go('rover.reservation.staycard.mainCard.reservationConfirm', {
                        "id": $scope.reservationData.reservationId,
                        "confirmationId": $scope.reservationData.confirmNum
                    });
                };

                if (!!skipAPICall) {
                    saveSuccess();
                } else {

                    if ($scope.reservationData.reservationId !== "" && $scope.reservationData.reservationId !== null && typeof $scope.reservationData.reservationId !== "undefined") {
                        // creating reservation
                        postData.reservationId = $scope.reservationData.reservationId;
                        postData.reservation_ids = $scope.reservationData.reservationIds;
                        postData.addons = $scope.existingAddons;
                        postData.add_to_guest_card = $scope.addToGuestCard;
                        $scope.invokeApi(RVReservationSummarySrv.updateReservation, postData, saveSuccess);
                    } else {
                        // updating reservation
                        $scope.invokeApi(RVReservationSummarySrv.saveReservation, postData, saveSuccess);
                    }
                }
            };

            var onSavePaymentMethodSuccess = function onSavePaymentMethodSuccess() {
                if (!$scope.isDemographicsFormValid(true)) {
                    $scope.summaryState.forceDemographicsData = true;
                    $scope.setDemographics(true);
                    return;
                }
                $scope.confirmReservation(true);
            };

            var isTokenizationSuccess = true;

            var savePayment = function savePayment(callback, addToGuestCard, tokenization) {
                var promises = [];

                tokenization = typeof tokenization === 'undefined' || tokenization;
                $scope.$emit('showLoader');

                var updateSuccess = function updateSuccess(data) {
                    $scope.$emit('hideLoader');
                    callback(true);
                };

                var updateFailure = function updateFailure(data) {
                    $scope.$emit('hideLoader');
                    $scope.errorMessage = data;
                };

                var arrivalTime = $scope.reservationData.checkinTime && $scope.reservationData.checkinTime.hh ? $scope.reservationData.checkinTime.hh + ':' + $scope.reservationData.checkinTime.mm + ' ' + $scope.reservationData.checkinTime.ampm : null,
                    departureTime = $scope.reservationData.checkoutTime && $scope.reservationData.checkoutTime.hh ? $scope.reservationData.checkoutTime.hh + ':' + $scope.reservationData.checkoutTime.mm + ' ' + $scope.reservationData.checkoutTime.ampm : null,
                    checkinTime = arrivalTime !== null ? moment(arrivalTime, 'hh:mm A').format('HH:mm') : null,
                    checkoutTime = departureTime !== null ? moment(departureTime, 'hh:mm A').format('HH:mm') : null;

                var postData = {
                    arrival_time: checkinTime,
                    departure_time: checkoutTime,
                    arrival_date: $scope.reservationData.arrivalDate,
                    departure_date: $scope.reservationData.departureDate,
                    payment_type: {},
                    guest_detail_id: $scope.reservationData.guest.id // CICO-42714
                };

                var isEMVEnabled = $rootScope.paymentGateway === 'sixpayments' || $rootScope.paymentGateway === 'SHIFT4' || $rootScope.paymentGateway === 'SHIJI' && !$rootScope.hotelDetails.shiji_token_enable_offline || ($rootScope.paymentGateway === 'MLI' || $rootScope.paymentGateway === 'CBA_AND_MLI') && $rootScope.isMLIEMVEnabled || $rootScope.paymentGateway === 'STAYNTOUCHPAY';

                if ($scope.reservationData.paymentType.type.value !== null) {
                    angular.forEach($scope.reservationData.paymentMethods, function (item) {
                        if ($scope.reservationData.paymentType.type.value === item.name) {
                            if ($scope.reservationData.paymentType.type.value === "CC") {
                                postData.payment_type.payment_method_id = $scope.summaryState.selectedCardDetails.value;
                                postData.add_to_guest_card = addToGuestCard;
                                if (!$scope.isManual && isEMVEnabled && !tokenization) {
                                    var params = {
                                        workstation_id: $rootScope.workstation_id,
                                        reservation_id: $scope.reservationData.reservationId,
                                        add_to_guest_card: $scope.addToGuestCard
                                    };

                                    $rootScope.$broadcast('INITIATE_CHIP_AND_PIN_TOKENIZATION', params);
                                    isTokenizationSuccess = false;
                                }
                            } else {
                                postData.payment_type.type_id = item.id;
                            }
                        }
                    });
                }

                $scope.errorMessage = [];

                var check = function check() {
                    if (!$scope.reservationData.reservationId) {
                        setTimeout(check, 100);
                    } else {
                        _.each($scope.reservationData.rooms, function (room, currentRoomIndex) {
                            postData.reservationId = $scope.reservationData.reservationIds && $scope.reservationData.reservationIds[currentRoomIndex] || $scope.reservationData.reservationId;
                            promises.push(RVReservationSummarySrv.updateReservation(postData));
                        });

                        $q.all(promises).then(updateSuccess, updateFailure);
                    }
                };

                if (isTokenizationSuccess) {
                    check();
                }
            };

            $scope.$on('SUCCESS_LINK_PAYMENT', function () {
                isTokenizationSuccess = true;
                savePayment($scope.confirmReservation, false, true);
            });

            $scope.onPayDepositLater = function () {
                savePayment($scope.confirmReservation);
            };

            // Save the payment information initially and then proceed with the demographics check!
            $scope.clickedContinueButton = function () {
                savePayment(onSavePaymentMethodSuccess, $scope.addToGuestCard);
            };

            $scope.proceedCreatingReservation = function () {
                var postData = $scope.computeReservationDataforUpdate(false, true);
                var saveSuccess = function saveSuccess(data) {

                    /*
                     * TO DO: to handle in future when more than one confirmations are returned.
                     * For now we will be using first item for navigating to staycard
                     * Response will have an array 'reservations' in that case.
                     * Normally the data will be a plain dictionary as before.
                     */
                    if (typeof data.reservations !== 'undefined' && data.reservations instanceof Array) {

                        angular.forEach(data.reservations, function (reservation, key) {
                            angular.forEach($scope.reservationData.rooms, function (room, key) {
                                if (parseInt(reservation.room_id) === parseInt(room.room_id)) {
                                    room.confirm_no = reservation.confirm_no;
                                }
                            });
                        });
                        $scope.reservationData.reservations = data.reservations;
                        $scope.reservationData.reservationId = $scope.reservationData.reservations[0].id;
                        $scope.reservationData.confirmNum = $scope.reservationData.reservations[0].confirm_no;
                        $scope.reservationData.status = $scope.reservationData.reservations[0].status;
                        $scope.viewState.reservationStatus.number = $scope.reservationData.reservations[0].id;
                    } else {
                        $scope.reservationData.reservationId = data.id;
                        $scope.reservationData.confirmNum = data.confirm_no;
                        $scope.reservationData.rooms[0].confirm_no = data.confirm_no;
                        $scope.reservationData.status = data.status;
                        $scope.viewState.reservationStatus.number = data.id;
                    }

                    $scope.viewState.reservationStatus.confirm = true;
                    $scope.reservationData.is_routing_available = false;
                    // Change mode to stay card as the reservation has been made!
                    $scope.viewState.identifier = "CONFIRM";

                    $scope.reservation = {
                        reservation_card: {}
                    };

                    $scope.reservation.reservation_card.arrival_date = $scope.reservationData.arrivalDate;
                    $scope.reservation.reservation_card.departure_date = $scope.reservationData.departure_time;
                    $scope.$emit('hideLoader');
                };

                var saveFailure = function saveFailure(data) {
                    $scope.$emit('hideLoader');
                    var showRoomNotAvailableDialog = false;
                    var error = '';

                    angular.forEach(data, function (value, key) {
                        if (value === "Room not available for the selected number of hours. Please choose another room") {
                            showRoomNotAvailableDialog = true;
                            error = value;
                        }
                    });
                    if (showRoomNotAvailableDialog) {
                        $scope.showRoomNotAvailableDialog(error);
                    } else {
                        $scope.errorMessage = data;
                    }
                };

                var updateSuccess = function updateSuccess(data) {
                    $scope.$emit('hideLoader');
                    $scope.viewState.identifier = "UPDATED";
                    $scope.reservationData.is_routing_available = data.is_routing_available;
                    if ($scope.reservationData.paymentType.type.value === 'CC' && $scope.addToGuestCard) {
                        addToGuestCard($scope.summaryState.selectedCardDetails);
                    }

                    $state.go('rover.reservation.staycard.mainCard.reservationConfirm', {
                        "id": $scope.reservationData.reservationId,
                        "confirmationId": $scope.reservationData.confirmNum
                    });
                };

                postData.payment_type = {};
                angular.forEach($scope.reservationData.paymentMethods, function (value, key) {
                    if (value.value === $scope.reservationData.paymentType.type.value) {
                        postData.payment_type.type_id = value.id;
                    }
                });
                if ($scope.reservationData.paymentType.type.value === 'CC') {
                    postData.payment_type.payment_method_id = $scope.reservationData.selectedPaymentId;
                }

                postData.add_to_guest_card = $scope.addToGuestCard;
                if ($scope.reservationData.reservationId !== "" && $scope.reservationData.reservationId !== null && typeof $scope.reservationData.reservationId !== "undefined") {
                    postData.reservation_ids = $scope.reservationData.reservationIds;
                    // creating reservation
                    postData.reservationId = $scope.reservationData.reservationId;
                    postData.addons = $scope.existingAddons;
                    $scope.invokeApi(RVReservationSummarySrv.updateReservation, postData, updateSuccess, saveFailure);
                } else {
                    // updating reservation
                    $scope.invokeApi(RVReservationSummarySrv.saveReservation, postData, saveSuccess, saveFailure);
                }
            };
            $scope.showRoomNotAvailableDialog = function (errorMessage) {

                $scope.status = "error";
                $scope.popupMessage = errorMessage;
                ngDialog.open({
                    template: '/assets/partials/reservation/rvShowRoomNotAvailableMessage.html',
                    controller: 'RVShowRoomNotAvailableCtrl',
                    className: '',
                    scope: $scope
                });
            };

            /**
             * Click handler for confirm button -
             * Creates the reservation and on success, goes to the confirmation screen
             */
            $scope.submitReservation = function () {

                $scope.errorMessage = [];
                // CICO-9794
                if ($scope.otherData.isGuestPrimaryEmailChecked && $scope.reservationData.guest.email === "" || $scope.otherData.isGuestAdditionalEmailChecked && $scope.otherData.additionalEmail === "") {
                    $scope.errorMessage = [$filter('translate')('INVALID_EMAIL_MESSAGE')];
                }
                if ($rootScope.paymentGateway !== "sixpayments") {
                    if ($scope.reservationData.paymentType.type !== null) {
                        if ($scope.reservationData.paymentType.type.value === "CC" && ($scope.data.MLIData.session === "" || $scope.data.MLIData.session === undefined)) {
                            $scope.errorMessage = [$filter('translate')('INVALID_CREDIT_CARD')];
                        }
                    }
                }
                if ($scope.errorMessage.length > 0) {
                    return false;
                }
                $scope.proceedCreatingReservation();
            };

            /**
             * Click handler for cancel button - Go back to the reservation search screen
             * Does not save the reservation
             */
            $scope.cancelButtonClicked = function () {
                if ($scope.viewState.identifier === "STAY_CARD") {
                    var stateParams = {
                        id: $scope.reservationData.reservationId,
                        confirmationId: $scope.reservationData.confirmNum,
                        isrefresh: false,
                        justCreatedRes: true
                    };

                    $state.go('rover.reservation.staycard.reservationcard.reservationdetails', stateParams);
                } else {
                    $scope.initReservationData();
                    $state.go('rover.reservation.search');
                }
            };
            // CICO-9512

            $scope.changeOnsiteCallIn = function () {
                $scope.isManual ? $scope.showCCPage = true : "";
                refreshScrolls();
            };
            // to trigger from sixpayment partial
            $scope.$on('changeOnsiteCallIn', function (event) {
                $scope.isManual = !$scope.isManual;
                $scope.changeOnsiteCallIn();
            });

            $scope.giftCardAmountAvailable = false;
            $scope.giftCardAvailableBalance = 0;
            $scope.$on('giftCardAvailableBalance', function (e, giftCardData) {
                $scope.giftCardAvailableBalance = giftCardData.amount;
            });
            $scope.timer = null;
            $scope.cardNumberInput = function (n, e) {
                if ($scope.isGiftCard) {
                    var len = n.length;

                    $scope.num = n;
                    if (len >= 8 && len <= 22) {
                        // then go check the balance of the card
                        $('[name=card-number]').keydown(function () {
                            clearTimeout($scope.timer);
                            $scope.timer = setTimeout($scope.fetchGiftCardBalance, 1500);
                        });
                    } else {
                        // hide the field and reset the amount stored
                        $scope.giftCardAmountAvailable = false;
                    }
                }
            };
            $scope.num;
            $scope.fetchGiftCardBalance = function () {
                if ($scope.isGiftCard) {
                    // switch this back for the UI if the payment was a gift card
                    var fetchGiftCardBalanceSuccess = function fetchGiftCardBalanceSuccess(giftCardData) {
                        $scope.giftCardAvailableBalance = giftCardData.amount;
                        $scope.giftCardAmountAvailable = true;
                        $scope.$emit('giftCardAvailableBalance', giftCardData);
                        // data.expiry_date //unused at this time
                        $scope.$emit('hideLoader');
                    };

                    $scope.invokeApi(RVReservationCardSrv.checkGiftCardBalance, {
                        'card_number': $scope.num
                    }, fetchGiftCardBalanceSuccess);
                } else {
                    $scope.giftCardAmountAvailable = false;
                }
            };

            $scope.setGiftCardParams = function () {
                $scope.shouldShowIframe = false;
                $scope.addmode = false;
                $scope.shouldShowAddNewCard = false;
                $scope.showCCPage = false;
                $scope.giftCardDetails = $scope.reservationData.paymentType;
            };
            $scope.isGiftCardType = function () {
                if ($scope.reservationData.paymentType.type.value === 'GIFT_CARD') {
                    return true;
                    // act as a credit card but set the gift card flag to show/hide specific sections
                    // $scope.reservationData.paymentType.type.value = 'CC';
                } else {
                    return false;
                }
            };
            $scope.isGiftCard = false;
            $scope.changePaymentType = function () {
                $scope.isGiftCard = $scope.isGiftCardType();

                if ($scope.reservationData.paymentType.type.value === 'CC') {

                    $rootScope.paymentGateway === 'sixpayments' ? "" : $scope.showCCPage = true;
                    $scope.isNewCardAdded = $rootScope.paymentGateway === 'sixpayments' ? true : false;
                    $scope.isManual = $rootScope.paymentGateway === 'sixpayments' ? false : "";
                    refreshScrolls();
                    /*
                     * Comment out .if existing cards needed remove comments
                     */
                    $scope.cardsList = typeof $scope.cardsList !== 'undefined' ? $scope.cardsList : [];
                    $scope.addmode = $scope.cardsList.length > 0 ? false : true;
                    if ($scope.addmode) {
                        $rootScope.$broadcast('CLICK_ADD_NEW_CARD');
                    }
                    if ($scope.isGiftCard) {
                        $scope.setGiftCardParams();
                    }
                } else {
                    $scope.isSubmitButtonEnabled = true;
                    $scope.isNewCardAdded = false;
                    // To handle fees details on reservation summary,
                    // While we change payment methods.
                    // Handling Credit Cards seperately.
                    angular.forEach(paymentMethodsCopy, function (item, key) {
                        if (item.value === $scope.reservationData.paymentType.type.value && item.value !== "CC") {
                            $scope.feeData.feesInfo = item.charge_code.fees_information;
                            $scope.setupFeeData();
                        }
                    });
                }

                $scope.refreshPaymentScroller();
            };

            $scope.refreshPaymentScroller = function () {
                $scope.refreshScroller('paymentInfo');
            };

            /*
                If email address does not exists on Guest Card,
                and user decides to update via the Email field on the summary screen,
                this email should be linked to the guest card.
             */
            $scope.primaryEmailEntered = function () {
                var dataToUpdate = {
                    "email": $scope.reservationData.guest.email
                };

                var data = {
                    'data': dataToUpdate,
                    'userId': $scope.reservationData.guest.id
                };

                var updateGuestEmailSuccessCallback = function updateGuestEmailSuccessCallback(data) {
                    $scope.$emit('guestEmailChanged');
                    $scope.$emit("hideLoader");
                };

                var updateGuestEmailFailureCallback = function updateGuestEmailFailureCallback(data) {
                    $scope.$emit("hideLoader");
                };

                $scope.invokeApi(RVContactInfoSrv.updateGuest, data, updateGuestEmailSuccessCallback, updateGuestEmailFailureCallback);
            };

            $scope.clickedOnsite = function () {

                $scope.isOnsiteActive = true;
                $scope.isIframeVisible = false;
                if ($scope.reservationData.paymentType.type.value === 'CC') {
                    $scope.isSixPaymentGatewayVisible = true;
                } else {
                    $scope.isSixPaymentGatewayVisible = false;
                }

                // Hiding in develop brach
                // ONCE 9424 done value Remove below line
                $scope.isSixPaymentGatewayVisible = false;
                $scope.refreshPaymentScroller();
            };

            $scope.clickedCallIn = function () {
                var typeIndex = '';

                $scope.isOnsiteActive = false;
                $scope.isIframeVisible = true;
                $scope.isSixPaymentGatewayVisible = true;
                $scope.reservationData.paymentType.type.value = 'CC';
                $scope.refreshPaymentScroller();
            };

            /*
             * Get the title for the billing info button,
             * on the basis of routes available or not
             */
            $scope.getBillingInfoTitle = function () {
                if ($scope.reservationData.is_routing_available) {
                    return $filter('translate')('BILLING_INFO_TITLE');
                } else {
                    return $filter('translate')('ADD_BILLING_INFO_TITLE');
                }
            };

            // CICO-22544: Update billing info button after adding or deleting routes
            $scope.$on("BILLINGINFOADDED", function () {
                $scope.reservationData.is_routing_available = true;
            });

            $scope.$on("BILLINGINFODELETED", function (event, routes) {
                if (routes.length === 0) {
                    $scope.reservationData.is_routing_available = false;
                }
            });

            /**
             * trigger the billing information popup. $scope.reservationData is the same variable used in billing info popups also.
             So we are adding the required params to the existing $scope.reservationData, so that no other functionalities in reservation confirmation breaks.
             */

            $scope.openBillingInformation = function (confirm_no) {
                // incase of multiple reservations we need to check the confirm_no to access billing
                // information
                if (confirm_no) {
                    angular.forEach($scope.reservationData.reservations, function (reservation, key) {
                        if (reservation.confirm_no === confirm_no) {
                            $scope.reservationData.confirm_no = reservation.confirm_no;
                            $scope.reservationData.reservation_id = reservation.id;
                            $scope.reservationData.reservation_status = reservation.status;
                        }
                    });
                } else {
                    $scope.reservationData.confirm_no = $scope.reservationData.confirmNum;
                    $scope.reservationData.reservation_id = $scope.reservationData.reservationId;
                    $scope.reservationData.reservation_status = $scope.reservationData.status;
                }

                if ($scope.reservationData.guest.id !== null) {
                    $scope.reservationData.user_id = $scope.reservationData.guest.id;
                } else {
                    $scope.reservationData.user_id = $scope.reservationData.company.id;
                }

                $scope.$emit('showLoader');
                jsMappings.fetchAssets(['addBillingInfo', 'directives']).then(function () {
                    $scope.$emit('hideLoader');
                    if ($rootScope.UPDATED_BI_ENABLED_ON['RESERVATION']) {
                        console.log("##Billing-info updated version");
                        ngDialog.open({
                            template: '/assets/partials/billingInformation/reservation/rvBillingInfoReservationMain.html',
                            controller: 'rvBillingInfoReservationMainCtrl',
                            className: '',
                            scope: $scope
                        });
                    } else {
                        console.log("##Billing-info old version");
                        ngDialog.open({
                            template: '/assets/partials/bill/rvBillingInformationPopup.html',
                            controller: 'rvBillingInformationPopupCtrl',
                            className: '',
                            scope: $scope
                        });
                    }
                });
            };

            $scope.updateAdditionalDetails = function (reservationId, index, goToConfirmationScreen) {
                var promises = [];

                $scope.$emit('showLoader');

                var updateSuccess = function updateSuccess(data) {
                    $scope.$emit('hideLoader');
                    $scope.closeDialog();
                    if (goToConfirmationScreen) {
                        $timeout(function () {
                            $scope.confirmReservation(true);
                        }, 700);
                    }
                };

                var updateFailure = function updateFailure(data) {
                    $scope.$emit('hideLoader');
                    $scope.errorMessage = data;
                };

                var postData = {
                    'reservation_type_id': parseInt($scope.demographics.reservationType),
                    'source_id': parseInt($scope.demographics.source),
                    'market_segment_id': parseInt($scope.demographics.market),
                    'booking_origin_id': parseInt($scope.demographics.origin),
                    'segment_id': parseInt($scope.demographics.segment)
                };

                $scope.errorMessage = [];

                if (typeof index === 'undefined') {
                    // TO HANDLE OVERRIDE ALL SCENARIO
                    _.each($scope.reservationData.rooms, function (room, currentRoomIndex) {
                        room.demographics = angular.copy($scope.demographics);
                        $scope.reservationData.demographics = angular.copy($scope.demographics);
                        postData.reservationId = $scope.reservationData.reservationIds && $scope.reservationData.reservationIds[currentRoomIndex] || $scope.reservationData.reservationId;
                        promises.push(RVReservationSummarySrv.updateReservation(postData));
                    });
                } else {
                    $scope.reservationData.rooms[index].demographics = angular.copy($scope.demographics);
                    $scope.reservationData.demographics = angular.copy($scope.demographics);
                    postData.reservationId = reservationId;
                    promises.push(RVReservationSummarySrv.updateReservation(postData));
                }

                $q.all(promises).then(updateSuccess, updateFailure);
            };

            $rootScope.$on('UPDATERESERVATIONTYPE', function (e, data, paymentId) {
                $scope.reservationData.reservation_type = data;
                // CICO-24768 - Updating Payment id after adding new CC.
                if (!!paymentId) {
                    $scope.reservationData.reservation_card.payment_details.id = paymentId;
                }
            });

            $scope.setDemographics = function (showRequiredFieldsOnly, index) {
                $scope.shouldShowReservationType = $scope.otherData.reservationTypes.length > 0;
                $scope.shouldShowMarket = $scope.otherData.markets.length > 0;
                $scope.shouldShowSource = $scope.otherData.sources.length > 0;
                $scope.shouldShowOriginOfBooking = $scope.otherData.origins.length > 0;
                $scope.shouldShowSegments = $scope.otherData.segments.length > 0;

                $scope.demographics = $scope.reservationData.rooms[index] && $scope.reservationData.rooms[index].demographics || angular.copy($scope.reservationData.demographics);
                // CICO-18594 - Urgent fix
                if (typeof $scope.reservationData.reservation_type !== "undefined" && !$scope.reservationData.group.id) {
                    $scope.demographics.reservationType = $scope.reservationData.reservation_type;
                }

                if (showRequiredFieldsOnly) {
                    $scope.shouldShowReservationType = $scope.otherData.reservationTypeIsForced && $scope.otherData.reservationTypes.length > 0 ? true : false;
                    $scope.shouldShowMarket = $scope.otherData.marketIsForced && $scope.otherData.markets.length > 0 ? true : false;
                    $scope.shouldShowSource = $scope.otherData.sourceIsForced && $scope.otherData.sources.length > 0 ? true : false;
                    $scope.shouldShowOriginOfBooking = $scope.otherData.originIsForced && $scope.otherData.origins.length > 0 ? true : false;
                    $scope.shouldShowSegments = $scope.otherData.segmentsIsForced && $scope.otherData.segments.length > 0 ? true : false;
                }
                ngDialog.open({
                    template: '/assets/partials/reservation/rvReservationDemographicsPopup.html',
                    className: '',
                    scope: $scope,
                    closeByDocument: false,
                    closeByEscape: false,
                    data: JSON.stringify({
                        data: index
                    })
                });
            };

            var validateDemographicsData = function validateDemographicsData(demographicsData) {
                var isValid = true;
                // Override force demographic flag if there are no options to select from (CICO-21166) all are disabled from admin

                if ($scope.otherData.reservationTypeIsForced && $scope.otherData.reservationTypes && $scope.otherData.reservationTypes.length > 0) {
                    isValid = demographicsData.reservationType !== "" && demographicsData.reservationType !== null;
                }
                if ($scope.otherData.marketsEnabled && $scope.otherData.marketIsForced && $scope.otherData.markets.length > 0 && isValid) {
                    isValid = demographicsData.market !== "";
                }
                if ($scope.otherData.sourcesEnabled && $scope.otherData.sourceIsForced && $scope.otherData.sources.length > 0 && isValid) {
                    isValid = demographicsData.source !== "";
                }
                if ($scope.otherData.originsEnabled && $scope.otherData.originIsForced && $scope.otherData.origins.length > 0 && isValid) {
                    isValid = demographicsData.origin !== "";
                }
                if ($scope.otherData.segmentsEnabled && $scope.otherData.segmentsIsForced && $scope.otherData.segments.length > 0 && isValid) {
                    isValid = demographicsData.segment !== "";
                }
                return isValid;
            };

            $scope.isDemographicsFormValid = function (assertValidation) {
                var isValid = true,
                    demographicsData;

                if (assertValidation) {
                    if ($scope.otherData.reservationTypeIsForced || $scope.otherData.marketIsForced || $scope.otherData.sourceIsForced || $scope.otherData.originIsForced) {
                        _.each($scope.reservationData.rooms, function (room) {
                            if (!room.demographics) {
                                isValid = false;
                            } else {
                                demographicsData = room.demographics;
                                isValid = validateDemographicsData(demographicsData);
                            }
                        });
                    }
                } else {
                    _.each($scope.reservationData.rooms, function (room) {
                        demographicsData = $scope.demographics || room.demographics || $scope.reservationData.demographics;
                        isValid = validateDemographicsData(demographicsData);
                    });
                }

                return isValid;
            };

            $scope.$on("SWIPE_ACTION", function (e, swipedCardData) {
                var swipeOperationObj = new SwipeOperation();
                var getTokenFrom = swipeOperationObj.createDataToTokenize(swipedCardData);
                var tokenizeSuccessCallback = function tokenizeSuccessCallback(tokenValue) {
                    $scope.$emit('hideLoader');
                    swipedCardData.token = tokenValue;
                    var swipedCardDataToRender = swipeOperationObj.createSWipedDataToRender(swipedCardData);

                    $scope.reservationData.paymentType.type.value = "CC";
                    // $scope.showCCPage = true;
                    // $scope.addmode = true;
                    // $scope.swippedCard = true;

                    $scope.newPaymentInfo = {
                        "tokenDetails": {
                            "isSixPayment": false
                        },
                        "cardDetails": {
                            "expiryMonth": swipedCardDataToRender.cardExpiryMonth,
                            "expiryYear": swipedCardDataToRender.cardExpiryYear,
                            "userName": swipedCardDataToRender.nameOnCard,
                            "cardNumber": swipedCardDataToRender.cardNumber,
                            "cardType": swipedCardDataToRender.cardType

                        }
                    };
                    $scope.$broadcast("RENDER_SWIPED_DATA", swipedCardDataToRender);
                };

                $scope.invokeApi(RVReservationCardSrv.tokenize, getTokenFrom, tokenizeSuccessCallback);
            });
            var successSwipePayment = function successSwipePayment(data, successParams) {

                $scope.showCCPage = false;
                $scope.showSelectedCreditCard = true;
                $scope.reservationData.selectedPaymentId = data.id;
                $scope.renderData.creditCardType = successParams.cardType.toLowerCase();
                $scope.renderData.endingWith = successParams.cardNumber.slice(-4);
                $scope.renderData.cardExpiry = successParams.cardExpiryMonth + "/" + successParams.cardExpiryYear;
                $scope.isNewCardAdded = true;
            };

            $scope.$on("SWIPED_DATA_TO_SAVE", function (e, swipedCardDataToSave) {
                var data = swipedCardDataToSave;

                data.reservation_id = $scope.reservationData.reservationId;
                data.payment_credit_type = swipedCardDataToSave.cardType;
                data.credit_card = swipedCardDataToSave.cardType;
                data.card_expiry = "20" + swipedCardDataToSave.cardExpiryYear + "-" + swipedCardDataToSave.cardExpiryMonth + "-01";
                data.add_to_guest_card = swipedCardDataToSave.addToGuestCard;

                var options = {
                    params: data,
                    successCallBack: successSwipePayment,
                    successCallBackParameters: swipedCardDataToSave
                };

                $scope.callAPI(RVPaymentSrv.savePaymentDetails, options);
            });
            // To fix the issue CICO-11440
            // From diary screen create reservation guest data is available only after reaching the summary ctrl
            // At that time iframe fname and lname is set as null or undefined since data not available
            // here refreshing the iframe with name of guest
            $scope.$on("resetGuestTab", function (e, data) {
                var guestData = {
                    "fname": $scope.reservationData.guest.firstName !== undefined ? $scope.reservationData.guest.firstName : $scope.guestCardData.contactInfo.first_name,
                    "lname": $scope.reservationData.guest.lastName !== undefined ? $scope.reservationData.guest.lastName : $scope.guestCardData.contactInfo.last_name
                };
                // CICO-11413 - Since card name is taken from pass data.

                $scope.passData.details.firstName = $scope.reservationData.guest.firstName;
                $scope.passData.details.lastName = $scope.reservationData.guest.lastName;
                $scope.$broadcast("refreshIframe", guestData);
                $scope.fetchGuestCreditCards();
            });

            $scope.addGuests = function (room) {
                if (!room.accompanying_guest_details) {
                    var accompanyingGuests = {
                        ADULT: [],
                        CHILDREN: [],
                        INFANTS: []
                    };

                    $scope.applyGuestCountRuleOnAccompanyingGuests(room.numAdults, room.numChildren, room.numInfants, accompanyingGuests);
                    angular.extend(room, {
                        accompanying_guest_details: accompanyingGuests
                    });
                }
                refreshScrolls();
            };

            $scope.saveAccompanyingGuests = function (room, roomIndex) {
                $scope.errorMessage = "";
                var validGuests = [];

                _.each(room.accompanying_guest_details, function (guest, type) {

                    _.each(guest, function (guestInfo) {
                        validGuests.push({
                            first_name: guestInfo.first_name,
                            last_name: guestInfo.last_name,
                            guest_type: guestInfo.guest_type,
                            guest_type_id: guestInfo.guest_type_id
                        });
                    });
                });

                var onupdateSuccess = function onupdateSuccess() {
                    $scope.$emit('hideLoader');
                },
                    onUpdateFailure = function onUpdateFailure(errorMessage) {
                    $scope.errorMessage = errorMessage;
                    $scope.$emit('hideLoader');
                };

                if (validGuests.length > 0) {
                    $scope.invokeApi(RVReservationGuestSrv.updateGuestTabDetails, {
                        accompanying_guests_details: validGuests,
                        reservation_id: $scope.reservationData.reservationIds[roomIndex]
                    }, onupdateSuccess, onUpdateFailure);
                }
            };

            $scope.addListener('REFRESH_SCROLL_SUMMARY', function () {
                $scope.refreshScroller('reservationSummary');
            });

            $scope.$on("PAY_LATER", function (e, data) {
                $scope.reservationData.paymentType.ccDetails = data.cardDetails;
                $scope.reservationData.selectedPaymentId = data.cardDetails.value;
                $scope.reservationData.paymentType.type.value = data.paymentType;
                savePayment($scope.confirmReservation, data.addToGuestCard);
            });

            $scope.$on("PAYMENT_SUCCESS", function (e, data) {
                // On continue on create reservation - add to guest card - to fix undefined issue on tokendetails
                if ($scope.reservationData.paymentType.type.value !== "CC") {
                    $scope.isNewCardAdded = false;
                }
                $scope.depositData.attempted = true;
                $scope.depositData.depositSuccess = true;

                $scope.currentPaymentBillId = data.bill_id;
                $scope.currentPaymentTransactionId = data.transaction_id;
                $scope.isDepositPayment = data.is_deposit_payment;

                if ($rootScope.autoEmailPayReceipt || $rootScope.autoEmailDepositInvoice && $scope.isDepositPayment) {
                    $scope.autoTriggerPaymentReceiptActions();
                }

                $scope.depositData.authorizationCode = data.authorization_code;
                $scope.reservationData.selectedPaymentId = data.payment_method.id;
                $scope.isDepositPayment = data.is_deposit_payment;

                $scope.reservationData.depositData = angular.copy($scope.depositData);
                runDigestCycle();
                // On continue on create reservation - add to guest card - to fix undefined issue on tokendetails - commenting the if else block below for CICO-14199
                $scope.$emit('hideLoader');
            });

            $scope.$on("AUTO_TRIGGER_EMAIL_AFTER_PAYMENT", function (e, data) {
                $scope.guestCardData.contactInfo.email = data;
                $scope.sendAutomaticEmails(data);
            });

            $scope.$on("PAYMENT_FAILED", function (e, errorMessage) {
                $scope.depositData.attempted = true;
                $scope.depositData.depositAttemptFailure = true;
                $scope.reservationData.depositData = angular.copy($scope.depositData);

                $scope.paymentErrorMessage = errorMessage[0];
                $scope.errorMessage = errorMessage;
                runDigestCycle();
                $scope.$emit('hideLoader');
            });

            $scope.$on('PAYMENT_TOGGLE_ATTACH_TO_GUEST_CARD', function (e, addToGuestCard) {
                $scope.addToGuestCard = addToGuestCard;
            });

            $scope.$on('PAYMENT_SCREEN_MODE_CHANGED', function () {
                $timeout(function () {
                    $scope.refreshScroller('paymentInfo');
                }, 300);
            });
            $scope.shouldIncludeScrollFixClass = false;
            $scope.$on('PAYMENT_TYPE_CHANGED', function (e, paymentType) {
                if (paymentType === "CC") {
                    $scope.shouldIncludeScrollFixClass = true;
                } else {
                    $scope.shouldIncludeScrollFixClass = false;
                }
                $timeout(function () {
                    $scope.refreshScroller('paymentInfo');
                }, 700);
                isTokenizationSuccess = true;
            });

            // Find guest type id by name
            var findGuestTypeId = function findGuestTypeId(type) {
                var guestType = _.find($rootScope.guestTypes, { value: type });

                return guestType.id;
            };

            // Add the dummy accompany guests based on the guest count
            var createExtraAccompanyingGuest = function createExtraAccompanyingGuest(type, noOfExtraGuests, accompanyingGuests) {

                if (noOfExtraGuests > 0) {
                    for (var i = 0; i < noOfExtraGuests; i++) {
                        accompanyingGuests.push({ first_name: '', last_name: '', guest_type: type, guest_type_id: findGuestTypeId(type) });
                    }
                }
            };

            // Check whether the provision to add additional accompany guests should be given based on guest count
            $scope.applyGuestCountRuleOnAccompanyingGuests = function (adultCount, childCount, infantCount, accompanyingGuests) {
                adultCount = parseInt(adultCount), childCount = parseInt(childCount), infantCount = parseInt(infantCount);

                var guestCount = adultCount + childCount + infantCount;

                // Add dummy accompany guests only if the guest count is greater that 1
                if (guestCount > 1) {

                    createExtraAccompanyingGuest('ADULT', adultCount - 1, accompanyingGuests.ADULT);
                    createExtraAccompanyingGuest('CHILDREN', childCount, accompanyingGuests.CHILDREN);
                    createExtraAccompanyingGuest('INFANTS', infantCount, accompanyingGuests.INFANTS);
                }
            };

            // Get icon class based on guest type
            $scope.getGuestTypeIconClass = function (guestType) {
                var iconClass = 'adult';

                if (guestType === 'CHILDREN') {
                    iconClass = 'student';
                } else if (guestType === 'INFANTS') {
                    iconClass = 'infant';
                }
                return iconClass;
            };

            // Show accompany guest section based on guest count
            $scope.showAccompanyingGuestSectionBasedOnGuestCount = function (room) {
                return room && parseInt(room.numAdults) + parseInt(room.numChildren) + parseInt(room.numInfants) > 1;
            };

            $scope.init();

            // Create group reservation, when borrow from house is done
            $scope.addListener('CREATE_RESERVATION_AFTER_BORROW', function () {
                $scope.init();
            });

            // Navigate to room and rates screen, when borrow is declined
            $scope.addListener('SHOW_ROOM_AND_RATES_AFTER_BORROW_DECLINE', function () {
                $state.go(roomAndRatesState, $rootScope.setPrevState.param);
            });
        }]);
    }, {}] }, {}, [1]);