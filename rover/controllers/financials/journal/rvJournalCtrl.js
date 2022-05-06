'use strict';

sntRover.controller('RVJournalController', ['$scope', '$filter', '$stateParams', 'ngDialog', '$rootScope', 'RVJournalSrv', 'journalResponse', '$timeout', 'rvPermissionSrv', 'journalFilters', function ($scope, $filter, $stateParams, ngDialog, $rootScope, RVJournalSrv, journalResponse, $timeout, rvPermissionSrv, journalFilters) {

    BaseCtrl.call(this, $scope);
    // Setting up the screen heading and browser title.
    $scope.$emit('HeaderChanged', $filter('translate')('MENU_JOURNAL'));
    $scope.setTitle($filter('translate')('MENU_JOURNAL'));

    $scope.data = {};
    $scope.data.filterData = {};
    $scope.data.summaryData = {};
    $scope.data.revenueData = {};
    $scope.data.paymentData = {};
    $scope.data.filterData = journalResponse;
    $scope.data.filterData.checkedAllDepartments = true;
    $scope.data.filterData.checkedAllEmployees = true;
    $scope.data.filterData.isSelectButtonActive = false;
    $scope.data.filterData.perPage = 50; // For pagination
    $scope.data.selectedChargeGroup = '';
    $scope.data.selectedChargeCode = '';
    $scope.data.selectedPaymentType = '';
    $scope.data.filterTitle = "All Departments and All Employees";
    $scope.data.isExpandedViewSummary = false;
    $scope.data.isExpandedViewRevenue = false;
    $scope.data.isExpandedViewPayment = false;

    $scope.data.isActiveRevenueFilter = false;
    $scope.data.activeChargeGroups = [];
    $scope.data.activeChargeCodes = [];
    $scope.data.activePaymentTypes = [];
    $scope.data.selectedDepartmentList = [];
    $scope.data.selectedEmployeeList = [];
    $scope.data.reportType = "";
    $scope.data.isInactiveCashier = false;
    $scope.data.query = "";
    $scope.data.isShowSummaryTab = true;
    $scope.data.isDrawerOpened = true;

    $scope.data.isRevenueToggleSummaryActive = true;
    $scope.data.isPaymentToggleSummaryActive = true;
    $scope.data.selectedCashier = "";
    $scope.data.activePaymentTab = "";
    $scope.setScroller('employee-content');
    $scope.setScroller('department-content');

    $scope.data.selectedDepartmentName = [];
    $scope.data.selectedDepartmentName.push('ALL');
    $scope.data.selectedEmployeesName = [];
    $scope.data.selectedEmployeesName.push('ALL');

    $scope.isDetailsSelected = false;
    $scope.isPrintClicked = false;

    var retrieveCashierName = function retrieveCashierName() {
        if ($scope.data.filterData.selectedCashier !== "") {
            angular.forEach($scope.data.filterData.cashiers, function (item, index) {
                if (item.id === $scope.data.filterData.selectedCashier) {
                    $scope.data.selectedCashier = item.name;
                }
            });
        }
    };

    retrieveCashierName();

    // Show calendar popup.
    var popupCalendar = function popupCalendar(clickedOn) {
        $scope.clickedOn = clickedOn;
        ngDialog.open({
            template: '/assets/partials/financials/journal/rvJournalCalendarPopup.html',
            controller: 'RVJournalDatePickerController',
            className: 'single-date-picker',
            scope: $scope
        });
    };

    /* Handling different date picker clicks */
    $scope.clickedFromDate = function () {
        popupCalendar('FROM');
    };
    $scope.clickedToDate = function () {
        popupCalendar('TO');
    };
    $scope.clickedCashierDate = function () {
        popupCalendar('CASHIER');
    };

    $scope.clickedSummaryDate = function () {
        popupCalendar('SUMMARY');
    };

    $scope.clickedBalanceDate = function () {
        popupCalendar('BALANCE');
    };
    // Filter by Logged in user id.
    var filterByLoggedInUser = function filterByLoggedInUser() {
        angular.forEach($scope.data.filterData.employees, function (item, index) {
            if (item.id === $scope.data.filterData.loggedInUserId) {
                item.checked = true;
                $scope.data.filterData.isSelectButtonActive = true;
                $scope.clickedSelectButton();
            }
        });
    };

    $scope.clickedJournalToggle = function (isFromSearch, isFromClick) {
        var tabName = $scope.data.activeTab;

        if (tabName === 'SUMMARY') {
            if ($scope.data.query !== "" && !isFromClick) {
                $scope.data.isExpandedViewSummary = true;
            } else {
                $scope.data.isExpandedViewSummary = !$scope.data.isExpandedViewSummary;
            }
            $scope.$broadcast("EXPAND_SUMMARY_SCREEN");
        } else if (tabName === 'PAYMENTS') {
            if (!isFromSearch) {
                $scope.data.isExpandedViewPayment = !$scope.data.isExpandedViewPayment;
            }

            $scope.$broadcast("EXPAND_PAYMENT_SCREEN");
        } else if (tabName === 'REVENUE') {
            if (!isFromSearch) {
                $scope.data.isExpandedViewRevenue = !$scope.data.isExpandedViewRevenue;
            }

            if (!$scope.data.isExpandedViewRevenue) {
                $scope.searchJournal();
            } else {
                $scope.$broadcast("EXPAND_REVENUE_SCREEN");
            }
        }
    };

    // To toggle revenue filter box.
    $scope.clickedRevenueFilter = function () {
        $scope.data.isActiveRevenueFilter = !$scope.data.isActiveRevenueFilter;
        setTimeout(function () {
            $scope.refreshScroller('employee-content');
            $scope.refreshScroller('department-content');
        }, 200);
    };

    // Checking whether all department checkboxes are unchecked or not
    var isAllDepartmentsUnchecked = function isAllDepartmentsUnchecked() {
        var flag = true;

        angular.forEach($scope.data.filterData.departments, function (item, index) {
            if (item.checked) {
                flag = false;
            }
        });
        return flag;
    };

    var getSelectButtonStatus = function getSelectButtonStatus() {
        if (isAllEmployeesUnchecked() && isAllDepartmentsUnchecked()) {
            $scope.data.filterData.isSelectButtonActive = false;
        } else {
            $scope.data.filterData.isSelectButtonActive = true;
        }
    };

    // Unchecking all checkboxes on Departments.
    var clearAllDeptSelection = function clearAllDeptSelection(index) {
        angular.forEach($scope.data.filterData.departments, function (item, index) {
            item.checked = false;
        });
    };

    // Unchecking all checkboxes on Employees.
    var clearAllEmployeeSelection = function clearAllEmployeeSelection(index) {
        angular.forEach($scope.data.filterData.employees, function (item, index) {
            item.checked = false;
        });
    };

    // Checking whether all employees checkboxes are unchecked or not
    var isAllEmployeesUnchecked = function isAllEmployeesUnchecked() {
        var flag = true;

        angular.forEach($scope.data.filterData.employees, function (item, index) {
            if (item.checked) {
                flag = false;
            }
        });
        return flag;
    };

    // On selecting 'All Departments' radio button.
    $scope.selectAllDepartment = function () {
        $scope.data.filterData.checkedAllDepartments = true;
        $scope.data.selectedDepartmentName = [];
        $scope.data.selectedDepartmentName.push('ALL');
        clearAllDeptSelection();
        $scope.data.selectedDepartmentList = [];
        getSelectButtonStatus();

        if ($scope.data.selectedDepartmentList.length === 0 && $scope.data.selectedEmployeeList.length === 0) {
            $scope.data.filterTitle = "All Departments and All Employees";
        } else if ($scope.data.selectedDepartmentList.length === 0 && $scope.data.selectedEmployeeList.length !== 0) {
            $scope.data.filterTitle = "Multiple";
        }

        if ($scope.data.activeTab === "PAYMENTS") {
            $scope.$broadcast("PAYMENTSSEARCH");
        }
        if ($scope.data.activeTab === "REVENUE") {
            $scope.$broadcast("REVENUESEARCH");
        }
    };

    // On selecting 'All Employees' radio button.
    $scope.selectAllEmployees = function () {
        $scope.data.filterData.checkedAllEmployees = true;
        $scope.data.selectedEmployeesName = [];
        $scope.data.selectedEmployeeList = [];
        $scope.data.selectedEmployeesName.push('ALL');
        clearAllEmployeeSelection();
        getSelectButtonStatus();

        if ($scope.data.selectedDepartmentList.length === 0 && $scope.data.selectedEmployeeList.length === 0) {
            $scope.data.filterTitle = "All Departments and All Employees";
        } else if ($scope.data.selectedDepartmentList.length !== 0 && $scope.data.selectedEmployeeList.length === 0) {
            $scope.data.filterTitle = "Multiple";
        }

        if ($scope.data.activeTab === "PAYMENTS") {
            $scope.$broadcast("PAYMENTSSEARCH");
        }
        if ($scope.data.activeTab === "REVENUE") {
            $scope.$broadcast("REVENUESEARCH");
        }
    };

    // Clicking each checkbox on Departments
    $scope.clickedDepartment = function (index) {

        $scope.data.filterData.departments[index].checked = !$scope.data.filterData.departments[index].checked;
        getSelectButtonStatus();

        if (isAllDepartmentsUnchecked()) {
            $scope.selectAllDepartment();
        } else {
            $scope.data.filterData.checkedAllDepartments = false;
        }
    };

    // Clicking on each Employees check boxes.
    $scope.clickedEmployees = function (selectedIndex) {
        $scope.data.filterData.employees[selectedIndex].checked = !$scope.data.filterData.employees[selectedIndex].checked;
        getSelectButtonStatus();

        if (isAllEmployeesUnchecked()) {
            $scope.selectAllEmployees();
        } else {
            $scope.data.filterData.checkedAllEmployees = false;
        }
    };

    // To setup Lists of selected ids of employees and departments.
    var setupDeptAndEmpList = function setupDeptAndEmpList() {
        var filterTitle = "";
        // To get the list of departments id selected.

        $scope.data.selectedDepartmentList = [];
        $scope.data.selectedDepartmentName = [];
        angular.forEach($scope.data.filterData.departments, function (item, index) {
            if (item.checked) {
                $scope.data.selectedDepartmentList.push(item.id);
                $scope.data.selectedDepartmentName.push(item.name);
                filterTitle = item.name;
            }
        });

        // To get the list of employee id selected.
        $scope.data.selectedEmployeeList = [];
        $scope.data.selectedEmployeesName = [];
        angular.forEach($scope.data.filterData.employees, function (item, index) {
            if (item.checked) {
                $scope.data.selectedEmployeeList.push(item.id);
                $scope.data.selectedEmployeesName.push(item.name);
                filterTitle = item.name;
            }
        });

        if ($scope.data.selectedDepartmentList.length + $scope.data.selectedEmployeeList.length > 1) {
            $scope.data.filterTitle = "Multiple";
        } else if ($scope.data.selectedDepartmentList.length === 0 && $scope.data.selectedEmployeeList.length === 0) {
            $scope.data.filterTitle = "All Departments and All Employees";
            $scope.data.selectedDepartmentName = [];
            $scope.data.selectedDepartmentName.push('ALL');
        } else {
            $scope.data.filterTitle = filterTitle;
        }

        if ($scope.data.selectedEmployeesName.length === 0) {
            $scope.data.selectedEmployeesName = [];
            $scope.data.selectedEmployeesName.push('ALL');
        }

        if ($scope.data.activeTab === "PAYMENTS") {
            $scope.$broadcast("PAYMENTSSEARCH");
        }
        if ($scope.data.activeTab === "REVENUE") {
            $scope.$broadcast("REVENUESEARCH");
        }
    };

    // On selecting select button.
    $scope.clickedSelectButton = function () {

        if ($scope.data.filterData.isSelectButtonActive) {
            setupDeptAndEmpList();
            $scope.data.isActiveRevenueFilter = false; // Close the entire filter box
        }
    };

    if ($stateParams.id === 'CASHIER') {
        // if we come from the cashier scenario, we should not display the summary screen at all
        $scope.data.isShowSummaryTab = false;
        // 1. Go to Front Office -> Cashier
        // a) Upon logging in, default Tab should be Cashier
        $scope.data.activeTab = 'CASHIER';
        $scope.$emit("updateRoverLeftMenu", "cashier");
        // c) All date fields should default to Business Date
        $scope.data.fromDate = $rootScope.businessDate;
        $scope.data.toDate = $rootScope.businessDate;
        $scope.data.cashierDate = $rootScope.businessDate;
        $scope.data.summaryDate = $rootScope.businessDate;
        $scope.data.balanceDate = moment(tzIndependentDate($rootScope.businessDate)).subtract(1, 'days').format($rootScope.momentFormatForAPI);
        $scope.data.isDrawerOpened = false;
        // b) All employee fields should default to logged in user
        $timeout(function () {
            filterByLoggedInUser();
        }, 2000);
    } else {
        // 2. Go to Financials -> Journal.
        // a) Upon logging in, default Tab should be =>
        // REVENUE (If Hourly) or SUMMARY.
        $scope.data.activeTab = $rootScope.isHourlyRateOn ? 'REVENUE' : 'SUMMARY';
        $scope.$emit("updateRoverLeftMenu", "journals");
        // b) All employee fields should default to ALL users
        // c) All date fields should default to yesterday's date
        var yesterday = tzIndependentDate($rootScope.businessDate);

        yesterday.setDate(yesterday.getDate() - 1);
        $scope.data.fromDate = $filter('date')(yesterday, 'yyyy-MM-dd');
        $scope.data.toDate = $filter('date')(yesterday, 'yyyy-MM-dd');
        $scope.data.cashierDate = $filter('date')(yesterday, 'yyyy-MM-dd');
        $scope.data.summaryDate = $filter('date')(yesterday, 'yyyy-MM-dd');
        $scope.data.balanceDate = moment(tzIndependentDate($rootScope.businessDate)).subtract(1, 'days').format($rootScope.momentFormatForAPI);
        // CICO-20294 : Hide summary tab if the reservation is of type Hourly.
        if ($rootScope.isHourlyRateOn) $scope.data.isShowSummaryTab = false;
    }

    /** Employee/Departments Filter ends here .. **/

    /* Cashier filter starts here */
    var callCashierFilterService = function callCashierFilterService() {
        $scope.$broadcast('refreshDetails');
    };

    $scope.$on('cashierDateChanged', function () {
        // call filter service
        callCashierFilterService();
    });

    $scope.toggleInactiveCashier = function () {
        $scope.data.isInactiveCashier = !$scope.data.isInactiveCashier;
    };

    $scope.cashierFilterChanged = function () {
        // call filter service
        if ($scope.data.filterData.selectedCashier) {
            callCashierFilterService();
            retrieveCashierName();
        } else {
            callCashierFilterService();
        }
    };

    /* Cashier filter ends here */

    $scope.activatedTab = function (tabName) {
        $scope.data.activeTab = tabName;
        if (tabName === 'REVENUE') {
            $scope.data.searchFilterOptions.splice(5, 1);
            if (!$scope.data.isExpandedViewRevenue) {
                $rootScope.$broadcast('REFRESHREVENUECONTENT');
            }
        } else if (tabName === 'CASHIER') {
            $scope.$broadcast('cashierTabActive');
        } else if (tabName === 'PAYMENTS') {
            $rootScope.$broadcast('REFRESHPAYMENTCONTENT');
            $scope.data.searchFilterOptions.splice(5, 1);
        } else if (tabName === 'SUMMARY') {
            $rootScope.$broadcast('REFRESHSUMMARYCONTENT');
            if (_.indexOf($scope.data.searchFilterOptions, _.findWhere($scope.data.searchFilterOptions, {
                value: "AR_INVOICE_NUMBER"
            })) === -1) {
                $scope.data.searchFilterOptions.push($scope.data.arInvoiceFilter);
            }

            $scope.data.isDrawerOpened = true;
        }
        if (tabName !== 'SUMMARY') {
            $scope.$broadcast("CLOSEPRINTBOX");
        }
        $scope.data.isActiveRevenueFilter = false;
        clearAllDeptSelection();
        clearAllEmployeeSelection();
    };

    // Utility method use to check data being blank or undefined.
    $scope.escapeNullData = function (data) {

        var returnData = data;

        if (data === "" || typeof data === 'undefined' || data === null) {
            returnData = '-';
        }

        return returnData;
    };

    $scope.searchJournal = function () {
        var tabName = $scope.data.activeTab;

        $scope.data.filterName = $filter('filter')($scope.data.searchFilterOptions, $scope.data.filterId)[0].name;
        if (tabName === 'SUMMARY') {
            $rootScope.$broadcast('SUMMARYSEARCH');
        } else if (tabName === 'PAYMENTS') {
            $rootScope.$broadcast('PAYMENTSSEARCH');
        } else if (tabName === 'REVENUE') {
            $rootScope.$broadcast('REVENUESEARCH');
        }
    };
    /* 
     * Toggle Action 
     */
    // $scope.toggleCollapsedOrExpandedSummary = function() {
    //     $scope.data.isExpandedView = !$scope.data.isExpandedView;
    // }; 

    /* get the time string from the date-time string */

    $scope.getTimeString = function (date, time) {
        var date = $filter('date')(date, $rootScope.dateFormat);

        return date + ', ' + time;
    };

    /* To PRINT Summary Deatils */
    $scope.printSummary = function () {
        if ($scope.isDetailsSelected) {
            $rootScope.$broadcast("INITIALIZESUMMARYDETAILS");
            $scope.isPrintClicked = true;
        } else {
            $scope.$broadcast("PRINTSUMMARY");
        }
    };

    $scope.addListener('EXPAND_PAYMENT', function () {
        $scope.clickedJournalToggle(true);
    });

    $scope.addListener('EXPAND_REVENUE', function () {
        $scope.clickedJournalToggle(true);
    });

    var init = function init() {
        // $scope.data.isExpandedViewSummary = false;
        $scope.data.arInvoiceFilter = journalFilters.filters[5];
        $scope.data.searchFilterOptions = journalFilters.filters;
        $scope.data.filterId = _.first($scope.data.searchFilterOptions).id;
        $scope.data.filterName = _.first($scope.data.searchFilterOptions).name;
        if ($stateParams.tab === "BALANCE") {
            $scope.activatedTab("BALANCE");
        }
    };

    init();
}]);