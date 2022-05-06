'use strict';

sntRover.controller('RvArAllocatedController', ['$scope', '$timeout', 'ngDialog', 'rvAccountsArTransactionsSrv', 'sntActivity', function ($scope, $timeout, ngDialog, rvAccountsArTransactionsSrv, sntActivity) {

    BaseCtrl.call(this, $scope);

    var scrollOptions = { preventDefaultException: { tagName: /^(INPUT|LI)$/ }, preventDefault: false };

    $scope.setScroller('allocated-list-scroller', scrollOptions);

    // Refreshes the scroller for the allocated lists
    var refreshScroll = function refreshScroll() {
        $timeout(function () {
            $scope.refreshScroller('allocated-list-scroller');
        }, 700);
    };

    // Refresh scroller while updating the results from parent controller
    $scope.$on('REFRESH_ALLOCATED_LIST_SCROLLER', function () {
        refreshScroll();
    });

    // Handle allocated tab expansion api call.
    var callExpansionAPI = function callExpansionAPI(item) {
        sntActivity.start('EXPAND_ALLOCATED');
        var successCallbackOfExpansionAPI = function successCallbackOfExpansionAPI(data) {
            sntActivity.stop('EXPAND_ALLOCATED');
            item.transactions = data.allocated_transactions;
            item.active = true;
            refreshScroll();
        },
            failureCallbackOfExpansionAPI = function failureCallbackOfExpansionAPI(errorMessage) {
            sntActivity.stop('EXPAND_ALLOCATED');
            $scope.$emit('SHOW_ERROR_MSG', errorMessage);
        };

        var dataToSend = {
            'id': item.transaction_id,
            'account_id': $scope.arDataObj.accountId
        };

        $scope.invokeApi(rvAccountsArTransactionsSrv.expandAllocateAndUnallocatedList, dataToSend, successCallbackOfExpansionAPI, failureCallbackOfExpansionAPI);
    };

    // Handle Toggle button click to expand list item
    $scope.clickedAllocatedListItem = function (index) {
        var clikedItem = $scope.arDataObj.allocatedList[index];

        if (!clikedItem.active) {
            callExpansionAPI(clikedItem);
        } else {
            clikedItem.active = false;
            refreshScroll();
        }
    };

    /*
     * Handle unallocate button click
     */
    $scope.clickedUnallocateButton = function (payment) {
        var successCallBackOfUnallocateData = function successCallBackOfUnallocateData(data) {
            $scope.selectedUnAllocatedItem = data;
            ngDialog.open({
                template: '/assets/partials/companyCard/arTransactions/rvCompanyTravelAgentUnallocatePopup.html',
                scope: $scope
            });
        };

        var requestParams = {},
            paramsToService = {};

        requestParams.allocation_id = payment.id;
        paramsToService.account_id = $scope.arDataObj.accountId;
        paramsToService.data = requestParams;

        var options = {
            params: paramsToService,
            successCallBack: successCallBackOfUnallocateData
        };

        $scope.callAPI(rvAccountsArTransactionsSrv.unAllocateData, options);
    };
    /*
     * Un allocate selected payment
     */
    $scope.unAllocate = function () {
        var requestParams = {},
            paramsToService = {},
            successCallBackOfUnallocate = function successCallBackOfUnallocate() {
            $scope.$emit('REFRESH_ALLOCATED');
            ngDialog.close();
        };

        requestParams.allocation_id = $scope.selectedUnAllocatedItem.allocation_id;
        requestParams.credit_id = $scope.selectedUnAllocatedItem.from_bill.transaction_id;
        requestParams.debit_id = $scope.selectedUnAllocatedItem.to_payment.transaction_id;
        requestParams.amount = $scope.selectedUnAllocatedItem.amount;

        paramsToService.account_id = $scope.arDataObj.accountId;
        paramsToService.data = requestParams;

        var options = {
            params: paramsToService,
            successCallBack: successCallBackOfUnallocate
        };

        $scope.callAPI(rvAccountsArTransactionsSrv.unAllocateSelectedPayment, options);
    };
}]);