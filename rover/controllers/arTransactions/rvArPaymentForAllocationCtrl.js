'use strict';

sntRover.controller('RVArPaymentForAllocationController', ['$scope', '$rootScope', '$stateParams', '$timeout', 'rvAccountsArTransactionsSrv', 'sntActivity', 'ngDialog', function ($scope, $rootScope, $stateParams, $timeout, rvAccountsArTransactionsSrv, sntActivity, ngDialog) {

    BaseCtrl.call(this, $scope);

    // Initialization
    var init = function init() {
        $scope.setScroller('payment-allocation');
        if ($scope.type === 'REFUND') {
            fetchRefundPaymentMethods();
        } else {
            fetchPaymentMethods();
        }
    };
    // refresh scroller
    var refreshScroll = function refreshScroll() {
        $timeout(function () {
            $scope.refreshScroller('payment-allocation');
        }, 500);
    };
    // Function to fetch payment methods
    var fetchPaymentMethods = function fetchPaymentMethods() {
        var dataToApi = {
            id: $scope.arDataObj.accountId
        },
            successCallback = function successCallback(data) {
            $scope.payments = data.payments;
            refreshScroll();
            $scope.$emit('hideLoader');
        };

        $scope.invokeApi(rvAccountsArTransactionsSrv.fetchPaymentMethods, dataToApi, successCallback);
    };
    // Successcallbackof listing popup
    var successCallbackOfGetAllocatedAPI = function successCallbackOfGetAllocatedAPI(data) {
        $scope.payments = data.ar_transactions;
        refreshScroll();
    };

    // Function to fetch payments done
    var fetchRefundPaymentMethods = function fetchRefundPaymentMethods() {
        var dataToSend = {
            account_id: $scope.arDataObj.accountId,
            getParams: {
                per_page: 1000,
                page: 1,
                transaction_type: 'PAYMENTS',
                allocated: false
            }
        };

        var options = {
            params: dataToSend,
            successCallBack: successCallbackOfGetAllocatedAPI
        };

        $scope.callAPI(rvAccountsArTransactionsSrv.fetchTransactionDetails, options);
    };

    // Close popup
    $scope.closePopup = function () {
        ngDialog.close();
    };
    // Clicked refund button from list popup
    $scope.clickedRefundButton = function (payment) {

        $scope.$emit("CLICKED_REFUND_BUTTON", payment);
        $scope.closePopup();
    };

    init();
}]);