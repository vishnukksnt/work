'use strict';

sntRover.controller('RVArTransactionsPayCreditsController', ['$scope', 'RVPaymentSrv', 'ngDialog', '$rootScope', '$timeout', '$filter', 'rvAccountTransactionsSrv', 'rvPermissionSrv', function ($scope, RVPaymentSrv, ngDialog, $rootScope, $timeout, $filter, rvAccountTransactionsSrv, rvPermissionSrv) {
    BaseCtrl.call(this, $scope);

    var defaultPaymentAmount = $scope.passData.isRefundClick ? (-1 * parseFloat($scope.passData.payment.amount)).toFixed(2) : parseFloat($scope.arDataObj.unpaidAmount).toFixed(2),
        defaultPaymentCurrencyAmount = $scope.passData.isRefundClick ? (-1 * parseFloat($scope.passData.payment.amount)).toFixed(2) : parseFloat($scope.arDataObj.unpaidPaymentAmount).toFixed(2);

    $scope.feeData = {};
    $scope.selectedCC = {};
    $scope.saveData = { 'paymentType': '' };
    $scope.billNumber = 1;
    $scope.renderData = {};
    $scope.renderData.defaultPaymentAmount = parseFloat(defaultPaymentAmount).toFixed(2);
    $scope.renderData.defaultPaymentCurrencyAmount = parseFloat(defaultPaymentCurrencyAmount);
    $scope.saveData.paymentType = $scope.passData.isRefundClick ? $scope.passData.payment.payment_type_value : '';
    $scope.actionType = $scope.passData.isRefundClick ? "AR_REFUND_PAYMENT" : "AR_SUBMIT_PAYMENT";
    if ($scope.passData.isRefundClick && $scope.passData.payment.payment_type_value === "CC") {
        $scope.selectedCC = $scope.passData.payment.card_details;
    }
    var bill_id = $scope.arDataObj.company_or_ta_bill_id;

    $scope.cardsList = [];

    var isSixPayment = false,
        tokenDetails = {},
        cardDetails = {};

    $scope.addmode = $scope.cardsList.length > 0;
    /*
     * if no payment type is selected disable payment button
     */
    $scope.disableMakePayment = function () {
        return $scope.saveData.paymentType.length;
    };
    $scope.handleCloseDialog = function () {
        $scope.$emit('HANDLE_MODAL_OPENED');
        $scope.closeDialog();
    };

    $scope.$on("CLOSE_DIALOG", $scope.handleCloseDialog);
    /*
     * Success call back - for initial screen
     */
    $scope.getPaymentListSuccess = function (data) {
        $scope.$emit('hideLoader');
        $scope.renderData.paymentTypes = _.filter(data, function (paymentType) {
            return paymentType.name !== "GIFT_CARD";
        });

        renderDefaultValues();
    };

    var init = function init() {

        $scope.referenceTextAvailable = false;
        $scope.showInitalPaymentScreen = true;
        $scope.depositPaidSuccesFully = false;
        var options = {
            successCallBack: $scope.getPaymentListSuccess
        };

        $scope.callAPI(RVPaymentSrv.renderPaymentScreen, options);
    };

    init();
    /*
     * Success call back of success payment
     */
    var successPayment = function successPayment(data) {

        $scope.depositPaidSuccesFully = true;
        $scope.arDataObj.availableAmount = parseFloat(data.amountPaid).toFixed(2);
        $scope.depositPaidSuccesFully = true;
        $scope.authorizedCode = data.authorization_code;

        $scope.allocatedPayment.payment_type = data.selectedPaymentTypeDescription;
        $scope.allocatedPayment.transaction_id = data.ar_transaction_id;
        if (data.selectedPaymentType === "CC") {
            data.cc_details.last_digits = data.cc_details.ending_with;
            data.cc_details.expire_date = data.cc_details.expiry_date;
            $scope.allocatedPayment.card_details = data.cc_details;
        } else {
            $scope.allocatedPayment = _.omit($scope.allocatedPayment, 'card_details');
        }
        $scope.arFlags.shouldShowPayAllButton = $scope.arDataObj.balanceList.length > 0;
        if (data.allocatePaymentAfterPosting) {
            $scope.arFlags.currentSelectedArTab = 'balance';
            $scope.arFlags.isFromAddPaymentOrAllocateButton = true;
            var totalAllocatedAmount = 0;

            _.each($scope.arDataObj.balanceList, function (eachItem) {
                totalAllocatedAmount = parseFloat(totalAllocatedAmount) + parseFloat(eachItem.amount);
            });
            $scope.arDataObj.totalAllocatedAmount = totalAllocatedAmount;
        }
        $scope.arFlags.isPaymentSelected = true;
        $scope.arFlags.insufficientAmount = false;
        $scope.arDataObj.selectedInvoices = [];

        // Reload the ar transaction listing after payment
        // Allocate Payment after posting checkbox is applicable only on payable tab
        if (data.allocatePaymentAfterPosting) {
            $scope.$emit('REFRESH_PAYABLE_LIST');
        } else {
            $scope.$emit('REFRESH_SELECTED_LIST');
        }
    };
    /*
     * Failure call back of submitpayment
     */
    var failedPayment = function failedPayment(data) {
        //  $scope.$emit("hideLoader");
        $scope.errorMessage = data;
    };

    var paymentSuccess = $scope.$on("PAYMENT_SUCCESS", function (e, response) {
        successPayment(response);
    });

    var paymentFailed = $scope.$on("PAYMENT_FAILED", function (e, response) {
        failedPayment(response);
    });

    $scope.$on('$destroy', paymentSuccess);
    $scope.$on('$destroy', paymentFailed);

    /*
     * Clears paymentErrorMessage
     */
    $scope.clearPaymentErrorMessage = function () {
        $scope.paymentErrorMessage = '';
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
     * retrieve token from paymnet gateway - from cards ctrl
     */
    $scope.$on("TOKEN_CREATED", function (e, data) {
        $scope.newPaymentInfo = data;
        $scope.showCCPage = false;
        $scope.swippedCard = false;
        $timeout(function () {
            savePayment(data);
        }, 200);
    });
    /*
     * To save new card
     */
    var savePayment = function savePayment(data) {

        isSixPayment = angular.copy($scope.newPaymentInfo.tokenDetails.isSixPayment);
        tokenDetails = angular.copy($scope.newPaymentInfo.tokenDetails);
        cardDetails = angular.copy($scope.newPaymentInfo.cardDetails);

        var cardToken = !isSixPayment ? tokenDetails.session : data.tokenDetails.token_no,
            expiryMonth = isSixPayment ? tokenDetails.expiry.substring(2, 4) : cardDetails.expiryMonth,
            expiryYear = isSixPayment ? tokenDetails.expiry.substring(0, 2) : cardDetails.expiryYear,
            expiryDate = expiryMonth && expiryYear ? "20" + expiryYear + "-" + expiryMonth + "-01" : "",
            cardCode = isSixPayment ? getSixCreditCardType(tokenDetails.card_type).toLowerCase() : cardDetails.cardType;

        var paymentPostData = {
            "bill_id": bill_id,
            "data_to_pass": {
                "card_expiry": expiryDate,
                "name_on_card": $scope.newPaymentInfo.cardDetails.userName,
                "payment_type": "CC",
                "token": cardToken,
                "card_code": cardCode
            }
        };

        $scope.callAPI(rvAccountTransactionsSrv.savePaymentDetails, {
            successCallBack: successNewPayment,
            params: paymentPostData
        });
    };
    /*
     * Success call back of save new card
     */
    var successNewPayment = function successNewPayment(data) {

        $scope.$emit("hideLoader");
        var cardType = "",
            cardNumberEndingWith = "",
            cardExpiry = "",
            swipedData = angular.copy($scope.swipedCardDataToSave);

        if (!isEmptyObject(swipedData)) {
            cardType = swipedData.cardType.toLowerCase();
            cardNumberEndingWith = swipedData.cardNumber.slice(-4);
            cardExpiry = swipedData.cardExpiryMonth + "/" + swipedData.cardExpiryYear;
            $scope.saveData.paymentType = "CC";
        } else {
            cardType = retrieveCardtype(isSixPayment, tokenDetails, cardDetails);
            cardNumberEndingWith = retrieveCardNumber(isSixPayment, tokenDetails, cardDetails);
            cardExpiry = retrieveCardExpiryDate(isSixPayment, tokenDetails, cardDetails);
        }

        $scope.defaultPaymentTypeCard = cardType;
        $scope.defaultPaymentTypeCardNumberEndingWith = cardNumberEndingWith;
        $scope.defaultPaymentTypeCardExpiry = cardExpiry;

        // check if the selected card has reference
        checkReferencetextAvailableForCC();
        // check if the selected card has fees
        _.each($scope.renderData.paymentTypes, function (paymentType) {
            if (paymentType.name === "CC") {
                _.each(paymentType.values, function (paymentType) {
                    if (cardType.toUpperCase() === paymentType.cardcode) {
                        $scope.feeData.feesInfo = paymentType.charge_code.fees_information;
                        $scope.setupFeeData();
                    }
                });
            }
        });

        $scope.saveData.payment_type_id = data.id;
        $scope.showCCPage = false;
        $scope.swippedCard = false;
        $scope.showCreditCardInfo = true;
        $scope.newCardAdded = true;
        $scope.swipedCardDataToSave = {};
    };

    /*
     * Checks whether the selected credit card btn needs to show or not
     */
    $scope.showSelectedCreditCardButton = function () {
        return $scope.showCreditCardInfo && !$scope.showCCPage && ($scope.paymentGateway !== 'sixpayments' || $scope.isManual) && $scope.saveData.paymentType === 'CC' && !$scope.depositPaidSuccesFully;
    };
    /*
     * Checks whether reference text is available for CC
     */
    var checkReferencetextAvailableForCC = function checkReferencetextAvailableForCC() {
        // call utils fn
        $scope.referenceTextAvailable = checkIfReferencetextAvailableForCC($scope.renderData.paymentTypes, $scope.defaultPaymentTypeCard);
    };

    // Added for CICO-26730
    $scope.changeOnsiteCallIn = function () {
        $scope.showCCPage = !!$scope.isManual;
    };
    // Added for CICO-26730
    $scope.$on('changeOnsiteCallIn', function () {
        $scope.isManual = !$scope.isManual;
        $scope.changeOnsiteCallIn();
    });
    /*
     * Success call back of MLI swipe - from cards ctrl
     */
    $scope.$on("SHOW_SWIPED_DATA_ON_PAY_SCREEN", function (e, swipedCardDataToRender) {
        // set variables to display the add mode
        $scope.showCCPage = true;
        $scope.swippedCard = true;
        $scope.addmode = true;
        $scope.$broadcast("RENDER_SWIPED_DATA", swipedCardDataToRender);
    });

    $scope.$on("PAYMENT_TYPE_CHANGED", function (event, paymentType) {
        $scope.showCCPage = paymentType === "CC";
    });

    $scope.$on("SWIPED_DATA_TO_SAVE", function (e, swipedCardDataToSave) {

        $scope.swipedCardDataToSave = swipedCardDataToSave;
        var data = swipedCardDataToSave;

        data.payment_credit_type = swipedCardDataToSave.cardType;
        data.credit_card = swipedCardDataToSave.cardType;
        data.card_expiry = "20" + swipedCardDataToSave.cardExpiryYear + "-" + swipedCardDataToSave.cardExpiryMonth + "-01";
        $scope.callAPI(rvAccountTransactionsSrv.savePaymentDetails, {
            successCallBack: successNewPayment,
            params: {
                "bill_id": bill_id,
                "data_to_pass": data
            }
        });
    });
    /**
     * MLI error - from cards ctrl
     */
    $scope.$on("MLI_ERROR", function (e, data) {
        $scope.errorMessage = data;
    });
    /*
     * Invoke this method to show the refund amount on the button in the payment screen
     */
    var renderDefaultValues = function renderDefaultValues() {
        $scope.defaultRefundAmount = (-1 * parseFloat($scope.renderData.defaultPaymentAmount)).toFixed(2);
        if ($scope.renderData.defaultPaymentAmount < 0) {
            $scope.defaultRefundAmount = (-1 * parseFloat($scope.renderData.defaultPaymentAmount)).toFixed(2);
            $scope.shouldShowMakePaymentButton = false;
        } else {
            $scope.shouldShowMakePaymentButton = true;
        }
    };
}]);