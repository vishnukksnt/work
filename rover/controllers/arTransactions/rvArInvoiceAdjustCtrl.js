'use strict';

sntRover.controller('RvArInvoiceAdjustController', ['$scope', '$timeout', 'rvAccountsArTransactionsSrv', function ($scope, $timeout, rvAccountsArTransactionsSrv) {

  BaseCtrl.call(this, $scope);

  $scope.adjustData = {};
  /*
   * To get the adjustment information
   */
  var init = function init() {

    var successCallBackOfGetInfo = function successCallBackOfGetInfo(data) {
      $scope.adjustData = data.charge_details[0];
      $scope.show_reference_on_guest_invoice = data.charge_details[0].is_reference_text_shown;
    };

    var paramsToService = {},
        requestParams = {};

    requestParams.is_group_by_ref = $scope.selectedTransaction.is_group_by_ref;
    requestParams.reference_number = $scope.selectedTransaction.reference_number;
    requestParams.bill_id = $scope.selectedInvoice.is_manual_balance ? $scope.selectedTransaction.bill_id : $scope.selectedInvoice.bill_id;
    if (!$scope.selectedInvoice.is_manual_balance) {
      requestParams.financial_transaction_id = $scope.selectedTransaction.id;
    }
    requestParams.ar_transaction_id = $scope.selectedInvoice.transaction_id;
    requestParams.item_ids = $scope.selectedTransaction.item_ids;
    requestParams.is_manual_balance = $scope.selectedInvoice.is_manual_balance;
    paramsToService.requestParams = requestParams;
    paramsToService.accountId = $scope.arDataObj.accountId;
    paramsToService.arTransactionId = $scope.selectedInvoice.transaction_id;

    var options = {
      params: paramsToService,
      successCallBack: successCallBackOfGetInfo
    };

    $scope.callAPI(rvAccountsArTransactionsSrv.getAdjustmentInfo, options);
  };

  /*
   * amount to decimal
   */
  $scope.enteredAmount = function () {
    $scope.new_amount = parseFloat($scope.new_amount).toFixed(2);
  };

  /*
   * Adjust AR invoice
   */
  $scope.clickedAdjust = function () {
    var postData = {
      new_amount: $scope.adjustData.amount,
      reference_text: $scope.adjustData.reference_text,
      show_ref_on_invoice: $scope.show_reference_on_guest_invoice,
      is_manual_balance: $scope.selectedInvoice.is_manual_balance
    };

    if ($scope.selectedTransaction.is_adjustment) {
      postData.change_reference_only = $scope.selectedTransaction.is_adjustment;
    }

    if (!$scope.selectedTransaction.is_group_by_ref) {
      if ($scope.selectedInvoice.is_manual_balance) {
        postData.ar_transaction_id = $scope.selectedTransaction.id;
      } else {
        postData.financial_transaction_id = $scope.selectedTransaction.id;
      }
    } else {
      postData.financial_transaction_id = $scope.selectCharge;
    }

    var successCallBackOfAdjust = function successCallBackOfAdjust() {
      $scope.closeDialog();
      $scope.$emit('REFRESH_BALANCE_LIST');
    };

    var paramsToService = {};

    paramsToService.accountId = $scope.arDataObj.accountId;
    paramsToService.arTransactionId = $scope.selectedInvoice.transaction_id;
    paramsToService.postData = postData;

    var options = {
      params: paramsToService,
      successCallBack: successCallBackOfAdjust
    };

    $scope.callAPI(rvAccountsArTransactionsSrv.postAdjustmentInfo, options);
  };

  init();
}]);