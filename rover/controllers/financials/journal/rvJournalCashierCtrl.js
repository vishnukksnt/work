'use strict';

sntRover.controller('RVJournalCashierController', ['$scope', 'RVJournalSrv', '$rootScope', function ($scope, RVJournalSrv, $rootScope) {

    /**
    * fetch history details corresponding to selected user
    *
    */
    var fetchHistoryDetails = function fetchHistoryDetails(data) {

        var fetchDetailsSuccessCallback = function fetchDetailsSuccessCallback(data) {
            $scope.$emit('hideLoader');
            $scope.lastCashierId = data.last_cashier_period_id;
            $scope.detailsList = data.history;
            $scope.selectedHistory = $scope.detailsList.length > 0 ? 0 : "";
            $scope.details = $scope.detailsList.length > 0 ? $scope.detailsList[0] : {}; // set first one as selected
            $scope.selectedHistoryId = $scope.detailsList.length > 0 ? $scope.detailsList[0].id : "";
            $scope.isLoading = false;

            $scope.details.opening_balance_cash = $scope.details.opening_balance_cash || 0;
            $scope.details.total_cash_received = $scope.details.total_cash_received || 0;
            $scope.details.cash_submitted = $scope.details.cash_submitted || 0;

            $scope.details.opening_balance_check = $scope.details.opening_balance_check || 0;
            $scope.details.total_check_received = $scope.details.total_check_received || 0;
            $scope.details.check_submitted = $scope.details.check_submitted || 0;

            $scope.totalClosingBalanceInCash = parseFloat($scope.details.opening_balance_cash) + parseFloat($scope.details.total_cash_received) - parseFloat($scope.details.cash_submitted);
            $scope.totalClosingBalanceInCheck = parseFloat($scope.details.opening_balance_check) + parseFloat($scope.details.total_check_received) - parseFloat($scope.details.check_submitted);

            setTimeout(function () {
                $scope.refreshScroller('cashier_history');
                $scope.refreshScroller('cashier_shift');
            }, 200);
        };
        $scope.data.filterData.selectedCashier = $scope.data.filterData.selectedCashier || $scope.data.filterData.loggedInUserId;
        var data = { "user_id": $scope.data.filterData.selectedCashier, "date": $scope.data.cashierDate, "report_type_id": $scope.data.reportType };

        $scope.invokeApi(RVJournalSrv.fetchCashierDetails, data, fetchDetailsSuccessCallback);
    };

    // init
    var init = function init() {

        BaseCtrl.call(this, $scope);
        $scope.errorMessage = "";
        $scope.selectedHistory = 0;
        $scope.setScroller('cashier_history', {});
        $scope.setScroller('cashier_shift', {});
        $scope.isLoading = true;

        fetchHistoryDetails();
    };

    init();

    $scope.isDateBeforeBusinnesDate = function (date) {
        return $rootScope.businessDate !== date ? true : false;
    };

    $scope.isLastCashierPeriod = function (date) {
        return parseInt($scope.lastCashierId) === parseInt($scope.details.id) ? true : false;
    };

    /**
    * click action of individual history
    *
    */
    $scope.historyClicked = function (index) {
        $scope.selectedHistory = index;
        $scope.details = $scope.detailsList[index];
        $scope.details.cash_submitted = $scope.details.cash_submitted === null || $scope.details.cash_submitted === "" ? 0 : $scope.details.cash_submitted;
        $scope.details.check_submitted = $scope.details.check_submitted === null || $scope.details.check_submitted === "" ? 0 : $scope.details.check_submitted;
        $scope.selectedHistoryId = $scope.detailsList[index].id;
        $scope.totalClosingBalanceInCash = parseFloat($scope.details.opening_balance_cash) + parseFloat($scope.details.total_cash_received) - parseFloat($scope.details.cash_submitted);
        $scope.totalClosingBalanceInCheck = parseFloat($scope.details.opening_balance_check) + parseFloat($scope.details.total_check_received) - parseFloat($scope.details.check_submitted);
    };

    /**
    * click action close shift
    *
    */
    $scope.closeShift = function () {

        var closeShiftSuccesCallback = function closeShiftSuccesCallback(data) {
            $scope.$emit('hideLoader');
            $scope.detailsList[$scope.selectedHistory] = data;
            $scope.details = data;
            $scope.lastCashierId = $scope.details.id;
            $scope.data.filterData.cashierStatus = 'CLOSED';
        };
        var updateData = {};

        updateData.id = $scope.selectedHistoryId;
        var closing_balance_cash = parseFloat($scope.details.opening_balance_cash) + parseFloat($scope.details.total_cash_received) - parseFloat($scope.details.cash_submitted);
        var closing_balance_check = parseFloat($scope.details.opening_balance_check) + parseFloat($scope.details.total_check_received) - parseFloat($scope.details.check_submitted);

        updateData.data = { "cash_submitted": $scope.details.cash_submitted, "check_submitted": $scope.details.check_submitted, "closing_balance_cash": closing_balance_cash, "closing_balance_check": closing_balance_check };
        $scope.invokeApi(RVJournalSrv.closeCashier, updateData, closeShiftSuccesCallback);
    };

    /**
    * click action reopen shift
    *
    */
    $scope.reOpen = function () {

        var reOpenSuccesCallback = function reOpenSuccesCallback(data) {
            $scope.$emit('hideLoader');
            $scope.detailsList[$scope.selectedHistory] = data;
            $scope.details = data;
            $scope.data.filterData.cashierStatus = 'OPEN';
        };
        var updateData = {};

        updateData.id = $scope.selectedHistoryId;
        $scope.invokeApi(RVJournalSrv.reOpenCashier, updateData, reOpenSuccesCallback);
    };

    /**
    * refresh scrollers on tab active
    *
    */

    $scope.$on('cashierTabActive', function () {
        setTimeout(function () {
            $scope.refreshScroller('cashier_history');
        }, 200);
        setTimeout(function () {
            $scope.refreshScroller('cashier_shift');
        }, 200);
    });

    /**
    * refresh data on filter change
    *
    */

    $scope.$on('refreshDetails', function () {
        fetchHistoryDetails();
    });
    /*
     * Calculate total when cash amount change
     */
    $scope.changedCash = function () {
        $scope.totalClosingBalanceInCash = parseFloat($scope.details.opening_balance_cash) + parseFloat($scope.details.total_cash_received) - parseFloat($scope.details.cash_submitted);
    };
    /*
     * Calculate total when check amount change
     */
    $scope.changedCheck = function () {
        $scope.totalClosingBalanceInCheck = parseFloat($scope.details.opening_balance_check) + parseFloat($scope.details.total_check_received) - parseFloat($scope.details.check_submitted);
    };
}]);