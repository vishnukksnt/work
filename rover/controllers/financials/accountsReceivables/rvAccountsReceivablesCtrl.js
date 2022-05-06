'use strict';

sntRover.controller('RVAccountsReceivablesController', ['$scope', '$rootScope', '$stateParams', '$filter', 'rvAccountsArTransactionsSrv', '$timeout', function ($scope, $rootScope, $stateParams, $filter, rvAccountsArTransactionsSrv, $timeout) {

    BaseCtrl.call(this, $scope);
    // Setting up the screen heading and browser title.
    $scope.$emit('HeaderChanged', $filter('translate')('MENU_ACCOUNTS_RECEIVABLES'));
    $scope.setTitle($filter('translate')('MENU_ACCOUNTS_RECEIVABLES'));
    $scope.$emit("updateRoverLeftMenu", "accountsReceivables");
    /**
     * Setting up scroller with refresh options..
     */
    $scope.setScroller('arOverViewScroll', {});
    var refreshArOverviewScroll = function refreshArOverviewScroll() {
        setTimeout(function () {
            $scope.refreshScroller('arOverViewScroll');
        }, 500);
    };

    refreshArOverviewScroll();

    /*
     *   Method to initialize the AR Overview Data set.
     */
    var fetchArOverviewData = function fetchArOverviewData(pageNo) {

        $scope.filterData.page = pageNo || 1;

        var successCallBackFetchAccountsReceivables = function successCallBackFetchAccountsReceivables(data) {

            $scope.arOverviewData = {};
            $scope.arOverviewData = data;
            $scope.filterData.totalCount = data.total_result;

            $timeout(function () {
                $scope.$broadcast('updatePagination', 'AR_PAGINATION');
                $scope.errorMessage = "";
                $scope.$emit('hideLoader');
                refreshArOverviewScroll();
            }, 500);

            // Condition to show/hide header bar - with OPEN GUEST BILL & UNPAID BALANCE.
            if ($scope.filterData.searchQuery !== "" || $scope.filterData.minAmount !== "" || $scope.filterData.ageingDays !== "" || $scope.filterData.showOptions !== "ALL") {
                $scope.filterData.hideArHeader = true;
            } else {
                $scope.filterData.hideArHeader = false;
            }
        };

        var params = {
            'query': $scope.filterData.searchQuery,
            'page': $scope.filterData.page,
            'per_page': $scope.filterData.perPage,
            'min_amount': $scope.filterData.minAmount,
            'ageing_days': $scope.filterData.ageingDays,
            'sort_by': $scope.filterData.sortBy,
            'ar_balance_type': $scope.filterData.showOptions
        };

        $scope.invokeApi(rvAccountsArTransactionsSrv.fetchAccountsReceivables, params, successCallBackFetchAccountsReceivables);
    };

    // Setting filter data set for pagination and filter options..
    $scope.filterData = {

        'page': 1,
        'perPage': 50,
        'totalCount': 0,
        'searchQuery': '',
        'minAmount': '',
        'sortBy': 'NAME_ASC',
        'ageingDays': '',
        'hideArHeader': false,
        'showOptions': 'ALL',

        'ageingDaysList': [{ 'value': '', 'name': '' }, { 'value': '30', 'name': '30' }, { 'value': '60', 'name': '60' }, { 'value': '90', 'name': '90' }, { 'value': '120', 'name': '120' }],
        'sortList': [{ 'value': 'NAME_ASC', 'name': 'NAME ASC' }, { 'value': 'NAME_DESC', 'name': 'NAME DESC' }, { 'value': 'AMOUNT_ASC', 'name': 'AMOUNT ASC' }, { 'value': 'AMOUNT_DESC', 'name': 'AMOUNT DESC' }],
        'showOptionsList': [{ 'value': 'ALL', 'name': 'All' }, { 'value': 'ZERO_BALANCE_ONLY', 'name': 'Zero Balance Only' }, { 'value': 'OPEN_BALANCE_ONLY', 'name': 'Open Balance Only' }]
    };

    // Setting pagination object
    $scope.arPaginationObj = {
        id: 'AR_PAGINATION',
        api: fetchArOverviewData,
        perPage: $scope.filterData.perPage
    };

    // Filter block starts here ..
    $scope.changedSearchQuery = function () {

        if ($scope.filterData.searchQuery.length > 2 || $scope.filterData.searchQuery === "") {
            $scope.filterData.minAmount = "";
            $scope.filterData.ageingDays = "";
            fetchArOverviewData();
        }
    };

    $scope.clearSearchQuery = function () {
        $scope.filterData.searchQuery = '';
        fetchArOverviewData();
    };

    $scope.changedMinAmount = function () {
        fetchArOverviewData();
    };

    $scope.changedSortBy = function () {
        fetchArOverviewData();
    };

    $scope.changedAgeingDays = function () {
        fetchArOverviewData();
    };

    $scope.changedShowOptions = function () {
        fetchArOverviewData();
    };
    // Filter block ends here ..

    fetchArOverviewData();

    /*
     *	Utility function that converts a null value to a desired string.
     *	@param 	{ String } [value to be checked for null string]
     *	@param 	{ String } [value to be replaced for null string]
     *	@return { String } 
     */
    $scope.escapeNullStr = function (value, replaceWith) {
        var newValue = "";

        if (typeof replaceWith !== "undefined" && replaceWith !== null) {
            newValue = replaceWith;
        }
        var valueToReturn = value === null || typeof value === 'undefined' ? newValue : value;

        if (valueToReturn.indexOf('null') !== -1) {
            valueToReturn = ''; // removes unwanted ", null" type of values
        }
        return valueToReturn;
    };

    /* 	Is show pagination tab
     *	@return { boolean } 
     */
    $scope.isShowPagination = function () {
        var arOverviewData = $scope.arOverviewData;

        return !!arOverviewData && arOverviewData.total_result >= $scope.filterData.perPage && arOverviewData.accounts.length > 0;
    };
}]);