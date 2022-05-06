'use strict';

sntRover.controller('RVCurrencyExchangeModalController', ['$scope', '$rootScope', '$filter', '$timeout', 'rvUtilSrv', 'ngDialog', 'RVMultiCurrencyExchangeSrv', 'rvPermissionSrv', function ($scope, $rootScope, $filter, $timeout, util, ngDialog, RVMultiCurrencyExchangeSrv, rvPermissionSrv) {

    BaseCtrl.call(this, $scope);

    $scope.exchangeRatesData = [];
    $scope.exchangeCurrencyList = $rootScope.exchangeCurrencyList;
    $scope.selected_rate_currency = _.first($scope.exchangeCurrencyList).id;
    $scope.selected_rate_currency_symbol = _.first($scope.exchangeCurrencyList).symbol;
    $scope.isInvoiceCurrency = $rootScope.invoiceCurrencyObject !== "" ? $scope.selected_rate_currency === _.find($rootScope.exchangeCurrencyList, { "id": $rootScope.invoiceCurrencyObject.id }).id : false;

    var delay = 200,
        noOfDays = 7,
        endDate,
        todayDate,
        daysDiff,
        checkDaysDiff = 7,
        commonDateOptions = {
        dateFormat: $rootScope.jqDateFormat,
        changeYear: true,
        changeMonth: true,
        yearRange: '-10:'
    },
        setStartDateOptions = function setStartDateOptions() {
        $scope.startDateOptions = _.extend({
            onSelect: startDateChoosed
        }, commonDateOptions);
    },
        startDateChoosed = function startDateChoosed(date, datePicker) {
        var startDate = tzIndependentDate(util.get_date_from_date_picker(datePicker));

        $scope.start_date = $filter('date')(startDate, $rootScope.dateFormatForAPI);

        var selectedEndDateAfterAddingDays = moment(moment(startDate).add(noOfDays, 'days'), "YYYY-MM-DD"),
            currentDate = moment(moment().format("YYYY-MM-DD")),
            dateDifference = currentDate.diff(selectedEndDateAfterAddingDays, 'days');

        if (dateDifference > 5) {
            $scope.end_date = $filter('date')(tzIndependentDate(moment(startDate).add(noOfDays, 'days').calendar()), $rootScope.dateFormatForAPI);
        } else {
            $scope.end_date = $filter('date')(tzIndependentDate(moment(startDate).add(noOfDays, 'days')), $rootScope.dateFormatForAPI);
        }
        fetchExhangeRates();
        $timeout(function () {
            $rootScope.apply();
        }, delay);
    },
        setEndDateOptions = function setEndDateOptions() {
        $scope.endDateOptions = _.extend({
            onSelect: endDateChoosed
        }, commonDateOptions);
    },
        endDateChoosed = function endDateChoosed(date, datePicker) {
        var endDate = tzIndependentDate(util.get_date_from_date_picker(datePicker));

        $scope.end_date = $filter('date')(endDate, $rootScope.dateFormatForAPI);

        var selectedStartDateAfterSubtractingDays = moment(moment(endDate).subtract(noOfDays, 'days'), "YYYY-MM-DD"),
            currentDate = moment(moment().format("YYYY-MM-DD")),
            dateDifference = currentDate.diff(selectedStartDateAfterSubtractingDays, 'days');

        if (dateDifference > 5) {
            $scope.start_date = $filter('date')(tzIndependentDate(moment(endDate).subtract(noOfDays, 'days').calendar()), $rootScope.dateFormatForAPI);
        } else {
            $scope.start_date = $filter('date')(tzIndependentDate(moment(endDate).subtract(noOfDays, 'days')), $rootScope.dateFormatForAPI);
        }

        fetchExhangeRates();
        $timeout(function () {
            $rootScope.apply();
        }, delay);
    },
        fetchExhangeRates = function fetchExhangeRates() {

        var successCallBackFetchAccountsReceivables = function successCallBackFetchAccountsReceivables(data) {
            if (data.length > 0) {
                $scope.exchangeRatesData = data;
                $scope.exchangeRates = constructExchangeRateArray($scope.start_date);
            } else {
                $scope.exchangeRatesData = [];
                $scope.exchangeRates = constructExchangeRateArray($scope.start_date);
            }
            $scope.refreshScroller("CURRENCY_SCROLLER");
        };

        var params = {
            'start_date': $filter('date')($scope.start_date, $rootScope.dateFormatForAPI),
            'end_date': $filter('date')($scope.end_date, $rootScope.dateFormatForAPI),
            'is_invoice_currency': $scope.isInvoiceCurrency,
            'selected_currency': $scope.selected_rate_currency
        };

        $scope.invokeApi(RVMultiCurrencyExchangeSrv.fetchExchangeRates, params, successCallBackFetchAccountsReceivables);
    },
        isDateDisabled = function isDateDisabled(startDate) {
        return startDate < $rootScope.businessDate;
    },
        constructExchangeRateArray = function constructExchangeRateArray(date) {
        var startDate = moment(date),
            startDateString = moment(startDate).format("YYYY-MM-DD"),
            ExchangeRateArray = [];

        for (var i = 0; i < noOfDays; i++) {
            var currentItemData = _.findWhere($scope.exchangeRatesData, { "date": moment(tzIndependentDate(startDate)).format($rootScope.momentFormatForAPI) });

            ExchangeRateArray[i] = {
                day: startDate.format('dddd'),
                date: $filter('date')(tzIndependentDate(startDateString), $rootScope.dateFormatForAPI),
                conversion_rate: angular.isUndefined(currentItemData) ? null : currentItemData.conversion_rate,
                isDisabled: isDateDisabled(startDateString) || !$scope.hasPermissionToMCExchangeRate
            };
            startDate = startDate.add(1, 'days');
            startDateString = moment(startDate).format("YYYY-MM-DD");
        }

        return ExchangeRateArray;
    };

    $scope.changeCurrency = function () {
        $scope.selected_rate_currency_symbol = _.find($rootScope.exchangeCurrencyList, { "id": $scope.selected_rate_currency }).symbol;
        $scope.isInvoiceCurrency = $rootScope.invoiceCurrencyObject !== "" ? $scope.selected_rate_currency === _.find($rootScope.exchangeCurrencyList, { "id": $rootScope.invoiceCurrencyObject.id }).id : false;
        fetchExhangeRates();
    };

    $scope.hasPermissionToMCExchangeRate = function () {
        return rvPermissionSrv.getPermissionValue('EDIT_MULTI_CURRENCY_EXCHANGE_RATES');
    };
    /*
     * Save Exchange Rates
     */
    $scope.saveExchangeRate = function () {
        var successCallBackFetchAccountsReceivables = function successCallBackFetchAccountsReceivables() {
            $scope.closeDialog();
        };

        angular.forEach($scope.exchangeRates, function (item) {
            item.date = moment(tzIndependentDate(item.date)).format($rootScope.momentFormatForAPI);
        });

        var params = {
            is_invoice_currency: $scope.isInvoiceCurrency,
            selected_currency: $scope.selected_rate_currency,
            exchange_rates: $scope.exchangeRates
        };

        $scope.invokeApi(RVMultiCurrencyExchangeSrv.saveExchangeRates, params, successCallBackFetchAccountsReceivables);
    };
    /*
     * copy amount to next row
     * @param clickedIndex Index of the clicked item
     */
    $scope.copyToNext = function (clickedIndex) {
        $scope.exchangeRates[clickedIndex + 1].conversion_rate = $scope.exchangeRates[clickedIndex].conversion_rate;
    };

    var scrollerOptions = {
        tap: true,
        preventDefault: false,
        showScrollbar: true
    };

    $scope.setScroller("CURRENCY_SCROLLER", scrollerOptions);

    /*
     * To close dialog box
     */
    $scope.closeDialog = function () {

        $rootScope.modalOpened = false;
        $timeout(function () {
            ngDialog.close();
        }, delay);
    };
    /*
     * Initialization method
     */
    var init = function init() {

        $scope.start_date = $filter('date')(tzIndependentDate($rootScope.businessDate), $rootScope.dateFormatForAPI);
        $scope.hasPermissionToMCExchangeRate = $scope.hasPermissionToMCExchangeRate();
        endDate = moment(tzIndependentDate($rootScope.businessDate)).add(noOfDays, 'days');
        todayDate = moment().startOf('day');
        daysDiff = moment.duration(todayDate.diff(endDate)).asDays();

        if (daysDiff < checkDaysDiff) {
            $scope.end_date = $filter('date')(tzIndependentDate(endDate.format("L")), $rootScope.dateFormatForAPI);
        } else {
            $scope.end_date = $filter('date')(tzIndependentDate(moment($rootScope.businessDate).add(noOfDays, 'days').calendar()), $rootScope.dateFormatForAPI);
        }

        setStartDateOptions();
        setEndDateOptions();
        fetchExhangeRates();
    };

    init();
}]);