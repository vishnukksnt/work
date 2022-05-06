'use strict';

sntRover.controller('RvArPostChargeController', ['$rootScope', '$scope', 'ngDialog', '$timeout', 'RVPostChargeSrvV2', function ($rootScope, $scope, ngDialog, $timeout, RVPostChargeSrvV2) {
    BaseCtrl.call(this, $scope);
    $scope.searchedItems = [];
    $scope.isItemsToShow = false;
    $scope.queryValue = "";
    $scope.selectedItem = {};
    $scope.totalAmount = 0;
    $scope.showCalculationArea = false;
    $scope.quantity = 1;
    $scope.show_reference_on_guest_invoice = true;

    // Close popup
    $scope.closeDialog = function () {
        ngDialog.close();
    };

    // jquery autocomplete Souce handler
    // get two arguments - request object and response callback function
    var autoCompleteSourceHandler = function autoCompleteSourceHandler(request, response) {

        var chargeCodeResults = [];
        /*
         * Successcallback 
         */
        var successCallBackFetchChargeCodes = function successCallBackFetchChargeCodes(data) {

            angular.forEach(data.results, function (item) {
                item.label = item.name;
                item.curreny = $rootScope.currencySymbol;
                item.unit_price = parseFloat(item.unit_price).toFixed(2);
            });
            chargeCodeResults = data.results;
            response(chargeCodeResults);
        };

        // fetch data from server
        var queryEntered = function queryEntered() {

            var params = {
                "query": $scope.queryValue ? $scope.queryValue.toLowerCase() : '',
                "page": 1,
                "per_page": 50,
                "charge_group_id": '',
                "is_favorite": 0
            };

            var options = {
                params: params,
                successCallBack: successCallBackFetchChargeCodes
            };

            $scope.callAPI(RVPostChargeSrvV2.searchChargeItems, options);
        };

        if (request.term.length === 0) {
            chargeCodeResults = [];
        } else if (request.term.length > 2) {
            queryEntered();
        }
    };
    /*
     * auto complete select handler
     */
    var autoCompleteSelectHandler = function autoCompleteSelectHandler(event, ui) {
        $scope.selectedItem = ui.item;
        $scope.totalAmount = ui.item.unit_price;
        $timeout(function () {
            $scope.showCalculationArea = true;
        }, 200);
    };

    /*
     * Options - for auto completion
     */
    $scope.autocompleteOptions = {
        delay: 0,
        minLength: 0,
        position: {
            of: "#new-charge-input",
            my: 'left top',
            at: 'left bottom',
            collision: 'flip',
            within: '#new-charge'
        },
        source: autoCompleteSourceHandler,
        select: autoCompleteSelectHandler
    };
    /*
     * Post charges to invoice
     */
    $scope.postCharge = function () {

        var successCallBackOfPostCharge = function successCallBackOfPostCharge() {
            $scope.$emit('REFRESH_BALANCE_LIST');
            $scope.closeDialog();
        };

        var postChargeData = {},
            dataToSrv = {};

        postChargeData.item_id = $scope.selectedItem.id;
        postChargeData.quantity = parseInt($scope.quantity);
        postChargeData.reference = $scope.reference;
        postChargeData.is_item = $scope.selectedItem.type === "ITEM";
        postChargeData.amount = parseFloat($scope.selectedItem.unit_price);
        postChargeData.show_ref_on_invoice = $scope.show_reference_on_guest_invoice;

        dataToSrv.postChargeData = postChargeData;
        dataToSrv.accountId = $scope.arDataObj.accountId;
        dataToSrv.arTransactionId = $scope.selectedItemToPostCharge.transaction_id;

        var options = {
            params: dataToSrv,
            successCallBack: successCallBackOfPostCharge
        };

        $scope.callAPI(RVPostChargeSrvV2.postChargesFromArInvoice, options);
    };
    /*
     * Calculating total amount on changing quantity
     */
    $scope.changedQuantity = function () {
        $scope.totalAmount = ($scope.selectedItem.unit_price * $scope.quantity).toFixed(2);
    };
    /*
     * amount to decimal
     */
    $scope.enteredAmount = function () {
        $scope.selectedItem.unit_price = parseFloat($scope.selectedItem.unit_price).toFixed(2);
    };
}]);