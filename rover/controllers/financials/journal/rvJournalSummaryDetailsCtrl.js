'use strict';

sntRover.controller('RVJournalSummaryDetailsController', ['$scope', '$rootScope', 'RVJournalSrv', '$timeout', function ($scope, $rootScope, RVJournalSrv, $timeout) {
    BaseCtrl.call(this, $scope);
    $scope.errorMessage = "";

    $scope.setScroller('summary_content', {});

    var refreshSummaryScroller = function refreshSummaryScroller() {
        setTimeout(function () {
            $scope.refreshScroller('summary_content');
        }, 500);
    };

    $scope.$on("INITIALIZESUMMARYDETAILS", function () {
        initSummaryData();
    });

    var getSummaryItemByBalanceType = function getSummaryItemByBalanceType(balance_type) {
        var summaryItem = "";

        switch (balance_type) {
            case 'DEPOSIT_BALANCE':
                summaryItem = $scope.details.summaryData.deposit_balance;
                break;
            case 'GUEST_BALANCE':
                summaryItem = $scope.details.summaryData.guest_balance;
                break;
            case 'AR_BALANCE':
                summaryItem = $scope.details.summaryData.ar_balance;
                break;
        }
        return summaryItem;
    };

    var updateTotalForBalanceType = function updateTotalForBalanceType(balance_type, opening_balance, debit_sum, credit_sum, closing_balance) {
        switch (balance_type) {
            case 'DEPOSIT_BALANCE':
                $scope.details.summaryData.deposit_closing_balance = closing_balance;
                $scope.details.summaryData.deposit_credits = credit_sum;
                $scope.details.summaryData.deposit_debits = debit_sum;
                $scope.details.summaryData.deposit_opening_balance = opening_balance;
                break;
            case 'GUEST_BALANCE':
                $scope.details.summaryData.guest_closing_balance = closing_balance;
                $scope.details.summaryData.guest_credits = credit_sum;
                $scope.details.summaryData.guest_debits = debit_sum;
                $scope.details.summaryData.guest_opening_balance = opening_balance;
                break;
            case 'AR_BALANCE':
                $scope.details.summaryData.ar_closing_balance = closing_balance;
                $scope.details.summaryData.ar_credits = credit_sum;
                $scope.details.summaryData.ar_debits = debit_sum;
                $scope.details.summaryData.ar_opening_balance = opening_balance;
                break;
        }
    };

    var initSummaryData = function initSummaryData() {

        var successCallBackFetchSummaryData = function successCallBackFetchSummaryData(responce) {
            $scope.details = {};
            $scope.details.summaryData = {};
            $scope.details.summaryData = responce.data;
            $scope.data.printDate = "";
            $scope.data.printTime = "";

            // Initializing objetcs for DEPOSIT_BALANCE/ GUEST_BALANCE/ AR_BALANCE sections.
            $scope.details.summaryData.deposit_balance = { 'active': false, 'page_no': 1, 'start': 1, 'end': 1, 'nextAction': false, 'prevAction': false };
            $scope.details.summaryData.guest_balance = { 'active': false, 'page_no': 1, 'start': 1, 'end': 1, 'nextAction': false, 'prevAction': false };
            $scope.details.summaryData.ar_balance = { 'active': false, 'page_no': 1, 'start': 1, 'end': 1, 'nextAction': false, 'prevAction': false };

            $scope.errorMessage = "";

            fetchBalanceDetails("DEPOSIT_BALANCE", function () {
                fetchBalanceDetails("GUEST_BALANCE", function () {
                    fetchBalanceDetails("AR_BALANCE", function () {
                        refreshSummaryScroller();
                        $scope.$emit('hideLoader');
                        $rootScope.$broadcast('PRINTSUMMARY');
                    });
                });
            });
        };

        var params = {
            "date": $scope.data.summaryDate
        };

        $scope.invokeApi(RVJournalSrv.fetchSummaryData, params, successCallBackFetchSummaryData);
    };

    /* To fetch the details on each balance tab
        @param  {string} will be { DEPOSIT_BALANCE/ GUEST_BALANCE/ AR_BALANCE }
        @return {object}
     */
    var fetchBalanceDetails = function fetchBalanceDetails(balance_type, callback) {

        var summaryItem = getSummaryItemByBalanceType(balance_type);

        var successCallBackFetchBalanceDetails = function successCallBackFetchBalanceDetails(responce) {

            summaryItem.transactions = [];
            summaryItem.transactions = responce.transactions;
            summaryItem.total_count = responce.total_count;

            summaryItem.end = summaryItem.start + summaryItem.transactions.length - 1;

            $scope.data.printDate = responce.print_date;
            $scope.data.printTime = responce.print_time;

            updateTotalForBalanceType(balance_type, responce.opening_balance, responce.debit_sum, responce.credit_sum, responce.closing_balance);

            summaryItem.active = summaryItem.transactions.length > 0;
            callback();
        };

        var params = {
            "date": $scope.data.summaryDate,
            "page_no": summaryItem.page_no,
            "per_page": 2000, // Giving this value to fetch all the records without making any changes in API
            "type": balance_type
        };

        $scope.invokeApi(RVJournalSrv.fetchBalanceDetails, params, successCallBackFetchBalanceDetails);
    };
}]);