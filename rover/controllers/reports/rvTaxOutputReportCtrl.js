'use strict';

angular.module('sntRover').controller('RVTaxOutputReportCtrl', ['$scope', '$timeout', 'RVreportsSubSrv', function ($scope, $timeout, RVreportsSubSrv) {
    BaseCtrl.call(this, $scope);

    var SCROLL_NAME = 'report-details-scroll',
        refreshScroll = function refreshScroll() {
        $timeout(function () {
            $scope.refreshScroller(SCROLL_NAME);
            $scope.myScroll[SCROLL_NAME].scrollTo(0, 0, 100);
        }, 1000);
    };

    // Param added - only to refresh these Category
    // While click on the pagination
    var selectedCategoryId,
        successFetch = function successFetch(response) {
        $scope.results = _.each($scope.results, function (category) {
            if (category.sub_category_type_id === selectedCategoryId) {
                category.receipt_details = response;
            }
            return category;
        });

        refreshScroll();
    };

    // Invoke API to fetch Receipts of the Category.
    $scope.addListener('updateReceipts', function (e, paramsToApi) {
        selectedCategoryId = paramsToApi.receipt_sub_category_type_id;
        $scope.callAPI(RVreportsSubSrv.getReceiptsOfCategories, {
            params: paramsToApi,
            onSuccess: successFetch
        });
    });

    // Set result values from main ctrl.
    $scope.addListener('UPDATE_TAX_OUTPUT_RESULTS', function (e, results) {
        $scope.results = results;
        refreshScroll();
    });

    // Method to sum up grand totals.
    var calculateGrandTotal = function calculateGrandTotal() {
        var grandTotalObj = {
            nonVatableSum: 0,
            vatableSum: 0,
            vatSum: 0,
            totalAggregate: 0
        };

        _.each($scope.results, function (category) {
            grandTotalObj.nonVatableSum += parseFloat(category.sub_category_total.sub_category_non_vatable_sum);
            grandTotalObj.vatableSum += parseFloat(category.sub_category_total.sub_category_vatable_sum);
            grandTotalObj.vatSum += parseFloat(category.sub_category_total.sub_category_vat_sum);
            grandTotalObj.totalAggregate += parseFloat(category.sub_category_total.sub_category_total_aggregate);
        });

        return grandTotalObj;
    };

    $scope.calculateNonVatGrandTotal = function () {
        return parseFloat(calculateGrandTotal().nonVatableSum).toFixed(2);
    };

    $scope.calculateVatableAmountGrandTotal = function () {
        return parseFloat(calculateGrandTotal().vatableSum).toFixed(2);
    };

    $scope.calculateVatGrandTotal = function () {
        return parseFloat(calculateGrandTotal().vatSum).toFixed(2);
    };

    $scope.calculateGrandTotal = function () {
        return parseFloat(calculateGrandTotal().totalAggregate).toFixed(2);
    };

    refreshScroll();
}]);