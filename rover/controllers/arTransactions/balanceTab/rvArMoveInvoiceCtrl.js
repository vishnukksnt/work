'use strict';

sntRover.controller('rvArMoveInvoiceCtrl', ['$scope', 'ngDialog', 'rvAccountsArTransactionsSrv', '$timeout', function ($scope, ngDialog, rvAccountsArTransactionsSrv, $timeout) {

    BaseCtrl.call(this, $scope);

    // Refresh scroller.
    var refreshScroll = function refreshScroll() {
        setTimeout(function () {
            $scope.refreshScroller('arMoveInvoiceListScroll');
        }, 500);
    };
    // Initialization.
    var init = function init() {
        // Data set ninitialization
        $scope.moveInvoiceData = {
            isConfirmInvoiceMoveScreen: false,
            searchResult: {},
            fromAccount: {},
            toAccount: {},
            query: '',
            perPage: 50,
            page: 1
        };
        // Setting up the account ( COMPANY/TA Card ) details
        if ($scope.contactInformation && $scope.contactInformation.account_details) {

            var accountData = $scope.contactInformation.account_details,
                addressData = $scope.contactInformation.address_details;

            // Mapping moving FROM account details.
            $scope.moveInvoiceData.fromAccount = {
                accountId: $scope.arDataObj.accountId,
                accountName: accountData.account_name,
                accountNumber: accountData.account_number,
                arNumber: accountData.accounts_receivable_number,
                type: accountData.account_type,
                location: typeof addressData === 'undefined' ? '' : addressData.location,
                ageingDate: accountData.ageing_date
            };
        }

        // Pagination options for ACCOUNT_LIST
        $scope.accountListPagination = {
            id: 'ACCOUNT_LIST',
            api: getSearchResult,
            perPage: $scope.moveInvoiceData.perPage
        };

        // Setting up scroller with refresh options.
        $scope.setScroller('arMoveInvoiceListScroll', {});
        refreshScroll();
    };

    /*
     *   Method to search the AR Overview Data set.
     *   @param { Number | undefined } - page number.
     */
    var getSearchResult = function getSearchResult(pageNo) {

        $scope.moveInvoiceData.page = !!pageNo ? pageNo : 1;

        var dataToSend = {
            params: {
                'query': $scope.moveInvoiceData.query,
                'page': $scope.moveInvoiceData.page,
                'per_page': $scope.moveInvoiceData.perPage
            },
            successCallBack: function successCallBack(data) {
                $scope.moveInvoiceData.searchResult = data;
                $scope.errorMessage = '';
                refreshScroll();
                $timeout(function () {
                    $scope.$broadcast('updatePagination', 'ACCOUNT_LIST');
                }, 1000);
            },
            failureCallBack: function failureCallBack(errorMessage) {
                $scope.errorMessage = errorMessage;
            }
        };

        $scope.callAPI(rvAccountsArTransactionsSrv.fetchAccountsReceivables, dataToSend);
    };

    // Search by query handled here.
    $scope.changedSearchQuery = function () {
        var queryLength = $scope.moveInvoiceData.query.length;

        if (queryLength > 2) {
            getSearchResult();
        } else if (queryLength === 0) {
            $scope.moveInvoiceData.searchResult = {};
            refreshScroll();
        }
    };
    // Clear search query.
    $scope.clearSearchQuery = function () {
        $scope.moveInvoiceData.query = '';
        $scope.moveInvoiceData.searchResult = {};
        refreshScroll();
    };
    // Select one card.
    $scope.clickedOnCard = function (selectedCard) {
        $scope.moveInvoiceData.isConfirmInvoiceMoveScreen = true;
        // Mapping moving TO account data.
        $scope.moveInvoiceData.toAccount = {
            accountId: selectedCard.id,
            accountName: selectedCard.account_name,
            accountNumber: selectedCard.account_number,
            arNumber: selectedCard.ar_number,
            type: selectedCard.type,
            location: selectedCard.location,
            ageingDate: selectedCard.ageing_date
        };
    };

    // Show pagination or not.
    $scope.showPagination = function () {
        var showPagination = false,
            searchResult = $scope.moveInvoiceData.searchResult,
            isConfirmInvoiceMoveScreen = $scope.moveInvoiceData.isConfirmInvoiceMoveScreen;

        if (typeof searchResult !== 'undefined' && typeof searchResult.accounts !== 'undefined') {
            if (searchResult.accounts.length < searchResult.total_result && searchResult.accounts.length > 0 && !isConfirmInvoiceMoveScreen) {
                showPagination = true;
            }
        }
        return showPagination;
    };

    // Change button click
    $scope.changeButtonClick = function () {
        $scope.moveInvoiceData.isConfirmInvoiceMoveScreen = false;
        $scope.moveInvoiceData.toAccount = {};
    };
    // Close dialog.
    $scope.closeDialog = function () {
        ngDialog.close();
    };
    // Move Invoice button click..
    $scope.moveInvoiceButtonClick = function () {

        var dataToSend = {
            params: {
                'account_id': $scope.moveInvoiceData.fromAccount.accountId,
                'to_account_id': $scope.moveInvoiceData.toAccount.accountId,
                'transaction_id': $scope.moveInvoiceHeaderData.transactionId
            },
            successCallBack: function successCallBack() {
                $scope.$emit('REFRESH_BALANCE_LIST');
                $scope.errorMessage = '';
                ngDialog.close();
            },
            failureCallBack: function failureCallBack(errorMessage) {
                $scope.errorMessage = errorMessage;
            }
        };

        $scope.callAPI(rvAccountsArTransactionsSrv.moveInvoice, dataToSend);
    };

    init();
}]);