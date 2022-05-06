sntRover.controller('RVAccountsTransactionsPaymentCtrl', [
  '$scope',
  '$rootScope', 'RVPaymentSrv', 'ngDialog', '$filter', '$timeout', 'rvAccountTransactionsSrv', 'rvPermissionSrv', 'RVReservationCardSrv',
  function ($scope, $rootScope, RVPaymentSrv, ngDialog, $filter, $timeout, rvAccountTransactionsSrv, rvPermissionSrv, RVReservationCardSrv) {
    BaseCtrl.call(this, $scope);
    BasePaymentCtrl.call(this, $scope);

    var isSixPayment = false;
    var tokenDetails = {};
    var cardDetails = {};
    var zeroAmount = parseFloat("0.00");

    var checkIfARAccountisPresent = function () {
      var successArCheck = function (data) {
        $scope.ArDetails = data;
        // if both company and travel agent AR accounts are present
        if (data.company_present && data.travel_agent_present) {
          $scope.showArSelection = true;
        } else if (data.company_present) {
          if (data.company_ar_attached) {
            proceedPayment("company");
          } else {
            showCreateArAccountPopup($scope.ArDetails.company_id);
          }
        } else if (data.travel_agent_present) {
          if (data.travel_agent_ar_attached) {
            proceedPayment("travel_agent");
          } else {
            showCreateArAccountPopup($scope.ArDetails.travel_agent_id);
          }

        } else {
          // notify user that AR account is not attached
          $scope.showErrorPopup($filter('translate')('ACCOUNT_ID_NIL_MESSAGE_PAYMENT'));
          $timeout(function () {
            // close payment popup
            ngDialog.close();
          }, 100);
        }

      };
      var params = {
        account_id: $scope.accountConfigData.summary.posting_account_id
      };

      $scope.callAPI(rvAccountTransactionsSrv.checkForArAccount, {
        successCallBack: successArCheck,
        params: params
      });
    };

    var failurePayment = function (error) {
      $scope.$emit("hideLoader");
      $scope.errorMessage = error;
      $scope.showArSelection = false;
    };

    /**
     * Retrieve data to be displayed in the payment screen - payment types and credit card types
     */
    var fetchPaymentMethods = function () {
      var onPaymentFetchSuccess = function (data) {
          $scope.renderData.paymentTypes = data;
          renderDefaultValues();
        },
        onPaymentFetchFailure = function (errorMessage) {
          $scope.errorMessage = errorMessage;
        };

      $scope.callAPI(RVPaymentSrv.renderPaymentScreen, {
        successCallBack: onPaymentFetchSuccess,
        failureCallBack: onPaymentFetchFailure,
        params: {
          direct_bill: true
        }
      });

      if ($rootScope.selectedReceiptTypeValue === 'tax_payment_receipt') {
        var paramsToApi = {
          bill_holder_id: $scope.accountConfigData.summary.posting_account_id,
          bill_holder_type: 'PostingAccount'
        };

        $scope.invokeApi(RVPaymentSrv.getReceiptsList, paramsToApi, $scope.getReceiptsListSuccess);
      }
    };

    /**
     * function to check whether the user has permission
     * to make payment
     * @return {Boolean}
     */
    var hasPermissionToMakePayment = function () {
      return rvPermissionSrv.getPermissionValue('POST_PAYMENT');
    };

    /**
     * function to check whether the user has permission
     * to refund payment
     * @return {Boolean}
     */
    var hasPermissionToRefundPayment = function () {
      return rvPermissionSrv.getPermissionValue('POST_REFUND');
    };

    var proceedPayment = function (arType) {

      $scope.errorMessage = "";
      var params = setUpPaymentParams(arType);

      if ($rootScope.paymentGateway === "sixpayments" && !$scope.isManual && $scope.saveData.paymentType === "CC") {
        params.data_to_pass.is_emv_request = true;
        $scope.shouldShowWaiting = true;
        // Six payment SWIPE actions
        rvAccountTransactionsSrv.submitPaymentOnBill(params).then(function (response) {
          $scope.shouldShowWaiting = false;
          successPayment(response);
        }, function (error) {
          $scope.errorMessage = error;
          $scope.shouldShowWaiting = false;
        });

      } else {

        $scope.callAPI(rvAccountTransactionsSrv.submitPaymentOnBill, {
          successCallBack: successPayment,
          failureCallBack: failurePayment,
          params: params
        });
      }
    };

    /**
     * Initial screen - filled with default amount on bill
     * If any payment type attached to that bill then that credit card can be viewed in initial screen
     * Default payment method attached to that bill can be viewed in initial screen
     */
    var renderDefaultValues = function () {
      var defaultAmount = $scope.billsArray[$scope.currentActiveBill].balance_amount ?
        $scope.billsArray[$scope.currentActiveBill].balance_amount : zeroAmount;


      var defaultPaymentCurrencyAmount = $scope.billsArray[$scope.currentActiveBill].default_payment_amount ?
        $scope.billsArray[$scope.currentActiveBill].default_payment_amount : zeroAmount;

      $scope.renderData.defaultPaymentAmount = parseFloat(defaultAmount).toFixed(2);
      $scope.renderData.defaultPaymentCurrencyAmount = defaultPaymentCurrencyAmount;

      $scope.defaultRefundAmount = (-1) * parseFloat($scope.renderData.defaultPaymentAmount);

      if ($scope.renderData.defaultPaymentAmount < 0) {
        $scope.defaultRefundAmount = (-1) * parseFloat($scope.renderData.defaultPaymentAmount);
        $scope.shouldShowMakePaymentButton = false;
      } else {

        $scope.shouldShowMakePaymentButton = true;
      }
    };

    /**
     * to run angular digest loop,
     * will check if it is not running
     * return - None
     */
    var runDigestCycle = function () {
      if (!$scope.$$phase) {
        $scope.$digest();
      }
    };

    /*
     * To save new card
     */
    var savePayment = function (data) {

      isSixPayment = angular.copy($scope.newPaymentInfo.tokenDetails.isSixPayment);
      tokenDetails = angular.copy($scope.newPaymentInfo.tokenDetails);
      cardDetails = angular.copy($scope.newPaymentInfo.cardDetails);

      var cardToken = !isSixPayment ? tokenDetails.session : data.tokenDetails.token_no;
      var expiryMonth = isSixPayment ? tokenDetails.expiry.substring(2, 4) : cardDetails.expiryMonth;
      var expiryYear = isSixPayment ? tokenDetails.expiry.substring(0, 2) : cardDetails.expiryYear;
      var expiryDate = (expiryMonth && expiryYear) ? ("20" + expiryYear + "-" + expiryMonth + "-01") : "";
      var cardCode = isSixPayment ?
        getSixCreditCardType(tokenDetails.card_type).toLowerCase() :
        cardDetails.cardType;


      $scope.callAPI(rvAccountTransactionsSrv.savePaymentDetails, {
        successCallBack: successNewPayment,
        params: {
          "bill_id": $scope.billsArray[$scope.renderData.billNumberSelected - 1].bill_id,
          "data_to_pass": {
            "card_expiry": expiryDate,
            "name_on_card": $scope.newPaymentInfo.cardDetails.userName,
            "payment_type": "CC",
            "token": cardToken,
            "card_code": cardCode
          }
        }
      });
    };

    var showCreateArAccountPopup = function (account_id, arType) {
      ngDialog.close();
      var paymentDetails = setUpPaymentParams(arType);
      var data = {
        "account_id": account_id,
        "is_auto_assign_ar_numbers": $scope.ArDetails.is_auto_assign_ar_numbers,
        "paymentDetails": paymentDetails
      };

      $scope.$emit('arAccountWillBeCreated', data);
    };

    var setUpPaymentParams = function (arType) {
      var params = {
        "data_to_pass": {
          "bill_number": $scope.renderData.billNumberSelected,
          "payment_type": $scope.saveData.paymentType,
          "amount": $scope.renderData.defaultPaymentAmount,
          "payment_method_id": ($scope.saveData.paymentType === 'CC') ? $scope.saveData.payment_type_id : null,
          "reference_text": $scope.renderData.referanceText
        },
        "bill_id": $scope.billsArray[$scope.renderData.billNumberSelected - 1].bill_id
      };

      if (typeof arType !== "undefined" && arType !== "") {
        params.data_to_pass.ar_type = arType;
      }


      if ($scope.isShowFees()) {
        if ($scope.feeData.calculatedFee) {
          params.data_to_pass.fees_amount = $scope.feeData.calculatedFee;
        }
        if ($scope.feeData.feesInfo) {
          params.data_to_pass.fees_charge_code_id = $scope.feeData.feesInfo.charge_code_id;
        }
      }

      return params;
    };

    /**
     * Success call back of save new card
     * @param data
     */
    var successNewPayment = function (data) {

      $scope.$emit("hideLoader");
      var cardType = "";
      var cardNumberEndingWith = "";
      var cardExpiry = "";
      var swipedData = angular.copy($scope.swipedCardDataToSave);

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
              setupFeeData();
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
     * Success call back of success payment
     */
    var successPayment = function (data) {
      $scope.$emit("hideLoader");
      $scope.depositPaidSuccesFully = true;
      $scope.authorizedCode = data.authorization_code;
      data.isFromPaymentSuccess = true;
      $scope.$emit('UPDATE_TRANSACTION_DATA', data);
      $scope.showArSelection = false;
    };

    $scope.billPaymentReceiptData = {};
    $scope.billPaymentReceiptData.allBillReceiptsList = {};
    $scope.feeData = {};
    $scope.renderData = {};
    $scope.showArSelection = false;
    $scope.swipedCardDataToSave = {};
    $scope.saveData = {};
    $scope.renderData = {};
    $scope.errorMessage = '';
    $scope.saveData.payment_type_id = '';
    $scope.newPaymentInfo = {};
    $scope.renderData.billNumberSelected = '';
    $scope.renderData.defaultPaymentAmount = '';
    $scope.renderData.defaultPaymentCurrencyAmount = '';
    $scope.defaultRefundAmount = 0;

    // We are passing $scope from bill to this modal
    $scope.currentActiveBillNumber = parseInt($scope.currentActiveBill) + parseInt(1);
    $scope.renderData.billNumberSelected = $scope.currentActiveBillNumber;
    $scope.renderData.billNumberSelected = $scope.currentActiveBillNumber;
    $scope.billsArray = $scope.transactionsDetails.bills;

    // common payment model items
    $scope.passData = {};
    $scope.passData.details = {};
    $scope.renderData.referanceText = "";
    $scope.swipedCardDataToSave = {};
    $scope.cardData = {};
    $scope.newCardAdded = false;
    $scope.shouldShowWaiting = false;
    $scope.depositPaidSuccesFully = false;
    $scope.saveData.paymentType = '';
    $scope.defaultPaymentTypeOfBill = '';
    $scope.shouldShowMakePaymentButton = true;
    $scope.hasPermissionToMakePayment = hasPermissionToMakePayment();
    $scope.hasPermissionToRefundPayment = hasPermissionToRefundPayment();

    $scope.billNumberChanged = function () {
      $scope.currentActiveBill = parseInt($scope.renderData.billNumberSelected) - parseInt(1);
      $scope.billPaymentReceiptData.receiptsList = _.find($scope.billPaymentReceiptData.allBillReceiptsList.payment_receipts, {
        bill_number: $scope.billsArray[$scope.currentActiveBill].bill_number.toString()
      });
      renderDefaultValues();
    };

    /**
     * CICO-25885 Fix
     */
    $scope.changeOnsiteCallIn = function () {
      $scope.showCCPage = ($scope.isManual) ? true : false;
    };

    /**
     * Close dialog and update the parent
     */
    $scope.closeDialog = function () {
      $scope.paymentModalOpened = false;
      $scope.$emit('HANDLE_MODAL_OPENED');
      ngDialog.close();
    };

    $scope.getReceiptsListSuccess = function (data) {
      $scope.billPaymentReceiptData.allBillReceiptsList = data.data;
      $scope.billPaymentReceiptData.receiptsList = _.find($scope.billPaymentReceiptData.allBillReceiptsList.payment_receipts, {
        bill_number: $scope.billsArray[$scope.currentActiveBill].bill_number.toString()
      });
    };

    /**
     * function to check whether the user has permission
     * to make payment
     * @return {Boolean}
     */
    $scope.hasPermissionToMakePayment = function () {
      return rvPermissionSrv.getPermissionValue('MAKE_PAYMENT');
    };

    $scope.showErrorPopup = function (errorMessage) {
      $scope.$emit("showValidationErrorPopup", errorMessage);
    };

    /**
     * Action - On click submit payment button
     */
    $scope.submitPayment = function () {
      // if payment is from groups and payment type is direct bill
      // we check if AR account is present or not
      // if not present we inform the user with a popup
      if ($scope.renderData.defaultPaymentAmount > 0 || $scope.renderData.defaultPaymentAmount < 0) {
        ($scope.saveData.paymentType === "DB") ? checkIfARAccountisPresent() : proceedPayment();
      } else {
        $timeout(function () {
          $scope.errorMessage = ["Please enter amount to pay"];
        }, 200);
      }
    };

    /**
     * Select to which AR account payment has to be done
     */
    $scope.selectArAccount = function (type) {
      $scope.$broadcast("CONTINUE_DIRECT_BILL_PAYMENT", {
        ar_type: type,
        arDetails: $scope.ArDetails
      });
      $scope.showArSelection = false;
    };

    /**
     * card selection cancelled - from cards ctrl
     */
    $scope.$on('cancelCardSelection', function (e, data) {
      $scope.showCCPage = false;
      $scope.swippedCard = false;
      $scope.isManual = false;
      $scope.saveData.paymentType = "";
    });

    /**
     * CICO-25885 Fix - Function to trigger from sixpayment ONLY partial
     */
    $scope.$on('changeOnsiteCallIn', function (event) {
      $scope.isManual = !$scope.isManual;
      $scope.changeOnsiteCallIn();
    });

    $scope.$on("CLOSE_DIALOG", $scope.closeDialog);

    /**
     * MLI error - from cards ctrl
     */
    $scope.$on("MLI_ERROR", function (e, data) {
      $scope.errorMessage = data;
    });

    $scope.$on("PAYMENT_FAILED", function (e, response) {
      failurePayment(response);
    });

    $scope.$on("PAYMENT_SUCCESS", function (e, response) {
      successPayment(response);
    });

    $scope.$on("PAYMENT_TYPE_CHANGED", function (event, paymentType) {
      $scope.showCCPage = paymentType === "CC";
    });

    $scope.$on("SHOW_AR_SELECTION", function (e, arDetails) {
      $scope.ArDetails = arDetails;
      $scope.showArSelection = true;
    });

    /**
     * Success call back of MLI swipe - from cards ctrl
     */
    $scope.$on("SHOW_SWIPED_DATA_ON_PAY_SCREEN", function (e, swipedCardDataToRender) {
      // set variables to display the add mode
      $scope.showCCPage = true;
      $scope.swippedCard = true;
      $scope.addmode = true;
      $scope.$broadcast("RENDER_SWIPED_DATA", swipedCardDataToRender);
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
          "bill_id": $scope.billsArray[$scope.renderData.billNumberSelected - 1].bill_id,
          "data_to_pass": data
        }
      });

    });

    /**
     * retrieve token from payment gateway - from cards ctrl
     */
    $scope.$on("TOKEN_CREATED", function (e, data) {
      $scope.newPaymentInfo = data;
      $scope.showCCPage = false;
      $scope.swippedCard = false;
      setTimeout(function () {
        savePayment(data);
      }, 200);
      runDigestCycle();
    });

    (function () {
      fetchPaymentMethods();
    })();
  }]);
