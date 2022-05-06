'use strict';

sntRover.controller('RVJournalRevenueController', ['$scope', '$rootScope', 'RVJournalSrv', '$timeout', function ($scope, $rootScope, RVJournalSrv, $timeout) {
    BaseCtrl.call(this, $scope);
    $scope.errorMessage = "";

    $scope.setScroller('revenue_content', {});

    $scope.data.activeRevenueTab = "";
    var refreshRevenueScroller = function refreshRevenueScroller() {
        $timeout(function () {
            $scope.refreshScroller('revenue_content');
        }, 500);
    };

    var fetchDepartments = function fetchDepartments() {
        var successCallBackFetchDepartment = function successCallBackFetchDepartment(data) {
            $scope.data.filterData.departments = data.departments;
            $scope.$emit('hideLoader');
        };

        $scope.invokeApi(RVJournalSrv.fetchDepartments, {}, successCallBackFetchDepartment);
    };

    var initRevenueData = function initRevenueData(origin) {

        var successCallBackFetchRevenueData = function successCallBackFetchRevenueData(data) {
            $scope.data.revenueData = {};
            $scope.data.revenueData = data;
            if ($scope.data.selectedChargeGroup === "") {
                $scope.data.activeChargeGroups = [];
                $scope.data.activeChargeGroups = data.charge_groups;
            }
            $scope.errorMessage = "";
            refreshRevenueScroller();
            if (origin !== "SUMMARY_DATE_CHANGED") {
                $scope.$emit('hideLoader');
            }
            if ($scope.data.isExpandedViewRevenue) {
                $scope.$emit("EXPAND_REVENUE");
            }
        };

        var postData = {
            "from_date": $scope.data.fromDate,
            "to_date": $scope.data.toDate,
            "employee_ids": $scope.data.selectedEmployeeList,
            "department_ids": $scope.data.selectedDepartmentList,
            "charge_group_id": $scope.data.selectedChargeGroup,
            "type": $scope.data.activeRevenueTab === "" ? "" : $scope.data.activeRevenueTab.toLowerCase()
        };

        if ($scope.data.query !== "") {
            postData.filter_id = $scope.data.filterId;
            postData.query = $scope.data.query;
        }
        $scope.invokeApi(RVJournalSrv.fetchRevenueDataByChargeGroups, postData, successCallBackFetchRevenueData);
    };

    if (!$scope.data.isExpandedViewRevenue) {
        initRevenueData();
    }
    fetchDepartments();

    $scope.addListener('REFRESHREVENUECONTENT', function () {
        refreshRevenueScroller();
    });

    $scope.addListener('fromDateChanged', function () {
        initRevenueData("");
    });

    $scope.addListener('toDateChanged', function () {
        initRevenueData("");
    });

    $scope.addListener('REVENUESEARCH', function () {
        initRevenueData();
    });

    // CICO-28060 : Update dates for Revenue & Payments upon changing summary dates
    $scope.addListener('REFRESH_REVENUE_PAYMENT_DATA', function (event, data) {
        $scope.data.fromDate = data.date;
        $scope.data.toDate = data.date;
        initRevenueData(data.origin);
    });

    $scope.addListener('EXPAND_REVENUE_SCREEN', function () {

        angular.forEach($scope.data.revenueData.charge_groups, function (item, key) {
            if ($scope.checkHasArrowFirstLevel(key)) {
                $scope.clickedFirstLevel(key, true);
            }
        });
    });

    /** Handle Expand/Collapse on Level1 **/
    $scope.clickedFirstLevel = function (index1, shouldExpandSecondLevel) {

        var toggleItem = $scope.data.revenueData.charge_groups[index1];

        var successCallBackFetchRevenueDataChargeCodes = function successCallBackFetchRevenueDataChargeCodes(data) {
            if (data.charge_codes.length > 0) {
                toggleItem.charge_codes = data.charge_codes;
                toggleItem.active = !toggleItem.active;
                refreshRevenueScroller();
                $scope.data.selectedChargeCode = '';
                if (shouldExpandSecondLevel) {
                    angular.forEach(toggleItem.charge_codes, function (item, key) {
                        if ($scope.checkHasArrowSecondLevel(index1, key)) {
                            $scope.clickedSecondLevel(index1, key);
                        }
                    });
                }
            }
            $scope.errorMessage = "";
            $scope.$emit('hideLoader');
        };

        // Call api only while expanding the tab ..
        if (!toggleItem.active) {

            var postData = {
                "from_date": $scope.data.fromDate,
                "to_date": $scope.data.toDate,
                "charge_group_id": toggleItem.id,
                "employee_ids": $scope.data.selectedEmployeeList,
                "department_ids": $scope.data.selectedDepartmentList,
                "type": $scope.data.activeRevenueTab === "" ? "" : $scope.data.activeRevenueTab.toLowerCase()
            };

            if ($scope.data.query !== "") {
                postData.filter_id = $scope.data.filterId;
                postData.query = $scope.data.query;
            }

            $scope.invokeApi(RVJournalSrv.fetchRevenueDataByChargeCodes, postData, successCallBackFetchRevenueDataChargeCodes);
        } else {
            toggleItem.active = !toggleItem.active;
        }
    };

    // Load the transaction details
    var loadTransactionDeatils = function loadTransactionDeatils(chargeCodeItem, isFromPagination, pageNo) {

        chargeCodeItem.page_no = pageNo || 1;

        var successCallBackFetchRevenueDataTransactions = function successCallBackFetchRevenueDataTransactions(data) {

            chargeCodeItem.transactions = [];
            chargeCodeItem.transactions = data.transactions;
            chargeCodeItem.total_count = data.total_count;

            if (!isFromPagination && data.transactions.length > 0) {
                chargeCodeItem.active = !chargeCodeItem.active;
            }

            $timeout(function () {
                var paginationID = chargeCodeItem.id;

                $scope.$broadcast('updatePagination', paginationID);

                refreshRevenueScroller();
                $scope.errorMessage = "";
                $scope.$emit('hideLoader');
            }, 500);
        };

        // Call api only while expanding the tab or on pagination Next/Prev button actions ..
        if (!chargeCodeItem.active || isFromPagination) {
            var postData = {
                "from_date": $scope.data.fromDate,
                "to_date": $scope.data.toDate,
                "charge_code_id": chargeCodeItem.id,
                "employee_ids": $scope.data.selectedEmployeeList,
                "department_ids": $scope.data.selectedDepartmentList,
                "page_no": chargeCodeItem.page_no,
                "per_page": $scope.data.filterData.perPage,
                "type": $scope.data.activeRevenueTab === "" ? "" : $scope.data.activeRevenueTab.toLowerCase()
            };

            if ($scope.data.query !== "") {
                postData.filter_id = $scope.data.filterId;
                postData.query = $scope.data.query;
            }

            $scope.invokeApi(RVJournalSrv.fetchRevenueDataByTransactions, postData, successCallBackFetchRevenueDataTransactions);
        } else {
            chargeCodeItem.active = !chargeCodeItem.active;
        }
    };

    /** Handle Expand/Collapse on Level2 **/
    $scope.clickedSecondLevel = function (index1, index2) {

        var toggleItem = $scope.data.revenueData.charge_groups[index1].charge_codes[index2];

        // pagination data object on level-3 for charge codes.
        toggleItem.chargeCodePagination = {
            id: toggleItem.id,
            api: [loadTransactionDeatils, toggleItem, true],
            perPage: $scope.data.filterData.perPage
        };

        loadTransactionDeatils(toggleItem, false);
    };

    // To show/hide expandable arrow to level1
    $scope.checkHasArrowFirstLevel = function (index) {
        var hasArrow = false;
        var count = $scope.data.revenueData.charge_groups[index].charge_codes_count;

        if (count > 0) {
            hasArrow = true;
        }
        return hasArrow;
    };

    // To show/hide expandable arrow to level2
    $scope.checkHasArrowSecondLevel = function (index1, index2) {
        var hasArrow = false;
        var count = $scope.data.revenueData.charge_groups[index1].charge_codes[index2].number;

        if (count > 0) {
            hasArrow = true;
        }
        return hasArrow;
    };

    // To hanlde click inside revenue tab.
    $scope.clickedOnRevenue = function ($event) {
        $event.stopPropagation();
        if ($scope.data.isDrawerOpened) {
            $rootScope.$broadcast("CLOSEPRINTBOX");
        }
        $scope.errorMessage = "";
    };

    // Hanlde revenue group active toggle
    $scope.clickedRevenueGroup = function (activeRevenueTab) {
        $scope.data.activeRevenueTab = activeRevenueTab;
        initRevenueData("");
    };
}]);