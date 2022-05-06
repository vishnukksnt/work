'use strict';

sntRover.controller('RVJournalPaymentController', ['$scope', '$rootScope', 'RVJournalSrv', '$timeout', function ($scope, $rootScope, RVJournalSrv, $timeout) {
    BaseCtrl.call(this, $scope);
    $scope.errorMessage = "";

    $scope.setScroller('payment_content', {});
    var refreshPaymentScroll = function refreshPaymentScroll() {
        setTimeout(function () {
            $scope.refreshScroller('payment_content');
        }, 500);
    };

    $scope.addListener('REFRESHPAYMENTCONTENT', function () {
        refreshPaymentScroll();
    });

    var initPaymentData = function initPaymentData(origin) {
        var successCallBackFetchPaymentData = function successCallBackFetchPaymentData(data) {
            $scope.data.paymentData = {};
            $scope.data.paymentData = data;
            $scope.data.activePaymentTypes = data.payment_types;

            $scope.errorMessage = "";
            refreshPaymentScroll();
            if (origin !== "SUMMARY_DATE_CHANGED") {
                $scope.$emit('hideLoader');
            }
            if ($scope.data.isExpandedViewPayment) {
                $scope.$emit("EXPAND_PAYMENT");
            }
        };

        var postData = {
            "from_date": $scope.data.fromDate,
            "to_date": $scope.data.toDate,
            "employee_ids": $scope.data.selectedEmployeeList,
            "department_ids": $scope.data.selectedDepartmentList,
            "type": $scope.data.activePaymentTab === "" ? "" : $scope.data.activePaymentTab.toLowerCase()
        };

        if ($scope.data.query !== "") {
            postData.filter_id = $scope.data.filterId;
            postData.query = $scope.data.query;
        }
        $scope.invokeApi(RVJournalSrv.fetchPaymentDataByPaymentTypes, postData, successCallBackFetchPaymentData);
    };

    if (!$scope.data.isExpandedViewPayment) {
        initPaymentData();
    }

    $scope.addListener('fromDateChanged', function () {
        initPaymentData("");
    });

    $scope.addListener('toDateChanged', function () {
        initPaymentData("");
    });

    $scope.addListener('PAYMENTSSEARCH', function () {
        initPaymentData();
    });

    // CICO-28060 : Update dates for Revenue & Payments upon changing summary dates
    $scope.addListener('REFRESH_REVENUE_PAYMENT_DATA', function (event, data) {
        $scope.data.fromDate = data.date;
        $scope.data.toDate = data.date;
        initPaymentData(data.origin);
    });

    // Load the transaction details
    var loadTransactionDeatils = function loadTransactionDeatils(chargeCodeItem, isFromPagination, pageNo) {

        chargeCodeItem.page_no = pageNo || 1;

        var successCallBackFetchPaymentDataTransactions = function successCallBackFetchPaymentDataTransactions(data) {

            chargeCodeItem.transactions = [];
            chargeCodeItem.transactions = data.transactions;
            chargeCodeItem.total_count = data.total_count;

            if (!isFromPagination && data.transactions.length > 0) {
                chargeCodeItem.active = !chargeCodeItem.active;
            }

            $timeout(function () {
                var paginationID = chargeCodeItem.charge_code_id;

                $scope.$broadcast('updatePagination', paginationID);

                refreshPaymentScroll();
                $scope.errorMessage = "";
                $scope.$emit('hideLoader');
            }, 500);
        };

        // Call api only while expanding the tab or on pagination Next/Prev button actions ..
        if (!chargeCodeItem.active || isFromPagination) {
            var postData = {
                "from_date": $scope.data.fromDate,
                "to_date": $scope.data.toDate,
                "charge_code_id": chargeCodeItem.charge_code_id,
                "employee_ids": $scope.data.selectedEmployeeList,
                "department_ids": $scope.data.selectedDepartmentList,
                "page_no": chargeCodeItem.page_no,
                "per_page": $scope.data.filterData.perPage,
                "type": $scope.data.activePaymentTab === "" ? "" : $scope.data.activePaymentTab.toLowerCase()
            };

            if ($scope.data.query !== "") {
                postData.filter_id = $scope.data.filterId;
                postData.query = $scope.data.query;
            }

            $scope.invokeApi(RVJournalSrv.fetchPaymentDataByTransactions, postData, successCallBackFetchPaymentDataTransactions);
        } else {
            chargeCodeItem.active = !chargeCodeItem.active;
        }
    };

    $scope.addListener('EXPAND_PAYMENT_SCREEN', function () {

        angular.forEach($scope.data.paymentData.payment_types, function (item, key) {
            if ($scope.checkHasArrowFirstLevel(key)) {
                $scope.clickedFirstLevel(key, true);
            }
        });
    });

    /** Handle Expand/Collapse of Level1 **/
    $scope.clickedFirstLevel = function (index1, shouldExpandSecondLevel) {

        var toggleItem = $scope.data.paymentData.payment_types[index1];

        if (toggleItem.payment_type !== "Credit Card") {

            // pagination data object on level-3 for credit cards.
            toggleItem.paymentTypesPagination = {
                id: toggleItem.charge_code_id,
                api: [loadTransactionDeatils, toggleItem, true],
                perPage: $scope.data.filterData.perPage
            };

            loadTransactionDeatils(toggleItem, false);
        } else {
            // For Credit cards , level-2 data already exist , so just do expand/collapse only ..
            toggleItem.active = !toggleItem.active;
            refreshPaymentScroll();
            if (shouldExpandSecondLevel) {
                angular.forEach($scope.data.paymentData.payment_types[index1].credit_cards, function (item, key) {
                    if ($scope.checkHasArrowSecondLevel(index1, key)) {
                        $scope.clickedSecondLevel(index1, key);
                    }
                });
            }
        }
    };

    // Handle Expand/Collapse of Level2  Credit card section
    $scope.clickedSecondLevel = function (index1, index2) {

        var toggleItem = $scope.data.paymentData.payment_types[index1].credit_cards[index2];

        // pagination data object on level-3 for credit cards.
        toggleItem.creditCardPagination = {
            id: toggleItem.charge_code_id,
            api: [loadTransactionDeatils, toggleItem, true],
            perPage: $scope.data.filterData.perPage
        };

        loadTransactionDeatils(toggleItem, false);
    };

    /* To hide/show arrow button for Level1 */
    $scope.checkHasArrowFirstLevel = function (index) {
        var hasArrow = false,
            item = $scope.data.paymentData.payment_types[index];

        if (typeof item.credit_cards !== 'undefined' && item.credit_cards.length > 0) {
            hasArrow = true;
        } else if (item.number > 0) {
            hasArrow = true;
        }
        return hasArrow;
    };

    /* To hide/show arrow button for Level2 */
    $scope.checkHasArrowSecondLevel = function (index1, index2) {
        var hasArrow = false,
            item = $scope.data.paymentData.payment_types[index1].credit_cards[index2];

        if (item.number > 0) {
            hasArrow = true;
        }
        return hasArrow;
    };

    // To hanlde click inside payment tab.
    $scope.clickedOnPayment = function ($event) {
        $event.stopPropagation();
        if ($scope.data.isDrawerOpened) {
            $rootScope.$broadcast("CLOSEPRINTBOX");
        }
        $scope.errorMessage = "";
    };

    // Hanlde payment group active toggle
    $scope.clickedPaymentGroup = function (activePaymentTab) {
        $scope.data.activePaymentTab = activePaymentTab;
        initPaymentData("");
    };
}]);