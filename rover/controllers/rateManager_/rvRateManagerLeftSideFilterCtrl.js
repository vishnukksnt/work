'use strict';

/**
 * Created by shahulhameed on 3/10/16.
 */
angular.module('sntRover').controller('rvRateManagerLeftSideFilterCtrl', ['$scope', '$filter', 'ngDialog', 'rvUtilSrv', '$rootScope', 'rvRateManagerOrderByConstants', 'rvTwoMonthCalendarEventConstants', 'rvRateManagerGroupByConstants', 'rvRateManagerEventConstants', 'RMFilterOptionsSrv', 'RateMngrCalendarSrv', '$q', 'rvRateManagerCoreSrv', function ($scope, $filter, ngDialog, util, $rootScope, rvRateManagerOrderByConstants, rvTwoMonthCalendarEventConstants, rvRateManagerGroupByConstants, rvRateManagerEventConstants, RMFilterOptionsSrv, RateMngrCalendarSrv, $q, rvRateManagerCoreSrv) {

  BaseCtrl.call(this, $scope);

  /**
   * toggle filter visibility
   */
  $scope.toggleFilterVisibility = function () {
    $scope.isFilterVisible = !$scope.isFilterVisible;
  };

  /**
   * to referesh the scroller objects
   */
  var refreshScroller = function refreshScroller() {
    $scope.refreshScroller('filter_details');
  };

  /**
   * function for initializing the scrollers
   */
  var setScroller = function setScroller() {
    $scope.setScroller('filter_details', {
      tap: true,
      preventDefault: false
    });
  };

  /**
   * to get a date in a format set from hotel admin
   * @param {String/DateObject}
   * @return {String}
   */
  var formatDateForUI = function formatDateForUI(date_) {
    return $filter('date')(new tzIndependentDate(date_), $rootScope.dateFormat);
  };

  /**
   * to close filter section from somewhere
   */
  $scope.$on(rvRateManagerEventConstants.CLOSE_FILTER_SECTION, function (event) {
    $scope.isFilterVisible = false;
  });

  /**
   * on choosing the rate type from list, we will be adding to selected list
   */
  $scope.rateTypeSelected = function () {
    if ($scope.selectedRateTypeID.trim === '') {
      return;
    }

    var conditionToTest = { id: parseInt($scope.selectedRateTypeID) },
        selectedRateType = _.findWhere($scope.rateTypes, conditionToTest),
        alreadyExistInSelectedRateTypeList = _.findIndex($scope.selectedRateTypes, conditionToTest) > -1;

    if (!!selectedRateType && !alreadyExistInSelectedRateTypeList) {
      $scope.selectedRateTypes.push(selectedRateType);
    }

    $scope.deleteAllSelectedCards();
  };

  /**
   * Rate type selected from rate types tab.
   * on choosing the rate type from list, we will be adding to selected list
   */
  $scope.rateTypeSelectedFromRTT = function () {
    if ($scope.selectedRateTypeIDFromRTT.trim === '') {
      return;
    }

    var conditionToTest = { id: parseInt($scope.selectedRateTypeIDFromRTT) },
        selectedRateTypeFromRTT = _.findWhere($scope.rateTypes, conditionToTest),
        alreadyExistInSelectedRateTypeListFromRTT = _.findIndex($scope.selectedRateTypesFromRTT, conditionToTest) > -1;

    if (!!selectedRateTypeFromRTT && !alreadyExistInSelectedRateTypeListFromRTT) {
      $scope.selectedRateTypesFromRTT.push(selectedRateTypeFromRTT);

      // adding the elements will change the height
      refreshScroller();

      // setting the focus to newly added rate type
      scrollTo('#selected-rate-type-list br');
    }

    $scope.deleteAllSelectedCards();
  };

  /**
   * to delete
   * @param  {LongInteger} rateTypeID [selected rate type's id to delete]
   */
  $scope.deleteSelectedRateType = function (rateTypeID) {
    var indexToDelete = _.findIndex($scope.selectedRateTypes, { id: parseInt(rateTypeID) });

    $scope.selectedRateTypes.splice(indexToDelete, 1);

    $scope.selectedRateTypeID = '';

    // deleting the node will change the height
    refreshScroller();
  };

  /**
   * to delete a rate type selected, from Rate Type Tab
   * @param  {LongInteger} rateTypeID [selected rate type's id to delete]
   */
  $scope.deleteSelectedRateTypeFromRTT = function (rateTypeID) {
    var indexToDelete = _.findIndex($scope.selectedRateTypesFromRTT, { id: parseInt(rateTypeID) });

    $scope.selectedRateTypesFromRTT.splice(indexToDelete, 1);

    $scope.selectedRateTypeIDFromRTT = '';

    // deleting the node will change the height
    refreshScroller();
  };

  /**
   * to remove all selected rate type in one take
   */
  $scope.deleteAllSelectedRateTypes = function () {
    $scope.selectedRateTypes = [];
    $scope.selectedRateTypeID = '';
  };

  /**
   * to remove all selected rate type in one take from Rate Type Tab
   */
  $scope.deleteAllSelectedRateTypesFromRTT = function () {
    $scope.selectedRateTypesFromRTT = [];
    $scope.selectedRateTypeIDFromRTT = '';
  };

  /**
   * utility mehtod to scroll to a node element
   * @param {node} [cssSelector]
   */
  var scrollTo = function scrollTo(cssSelector) {
    // scrolling to bottom
    var scroller = $scope.getScroller('filter_details');

    setTimeout(function () {
      scroller.scrollToElement(cssSelector, 700);
    }, 301);
  };

  /**
   * on choosing the rate from list, we will be adding to selected list
   */
  $scope.rateSelected = function () {
    if ($scope.selectedRateID.trim !== '') {
      var conditionToTest = { id: parseInt($scope.selectedRateID) },
          selectedRate = _.findWhere($scope.rates, conditionToTest),
          alreadyExistInSelectedRateList = _.findIndex($scope.selectedRates, conditionToTest) > -1;

      if (!!selectedRate && !alreadyExistInSelectedRateList) {
        $scope.selectedRates.push(selectedRate);

        // adding the elements will change the height
        refreshScroller();

        // setting the focus to newly added rate
        scrollTo('#selected-rate-list br');
      }

      $scope.deleteAllSelectedCards();
    }
  };

  /**
   * to delete
   * @param  {LongInteger} rateID [selected rate's id to delete]
   */
  $scope.deleteSelectedRate = function (rateID) {
    var indexToDelete = _.findIndex($scope.selectedRates, { id: parseInt(rateID) });

    $scope.selectedRates.splice(indexToDelete, 1);

    $scope.selectedRateID = '';

    // deleting the node will change the height
    refreshScroller();
  };

  /**
   * to remove all selected rates in one take
   */
  $scope.deleteAllSelectedRates = function () {
    $scope.selectedRates = [];
    $scope.selectedRateID = '';

    // deleting the node will change the height
    refreshScroller();
  };

  /**
   * we will show the rates conditionalyy
   * @param  {Object} rate Object
   * @return {Boolean}
   */
  $scope.shouldShowRate = function (rate) {
    // if "'Select Rate Type' choosed from Rate type down choosed"
    if ($scope.selectedRateTypeID === '' && !$scope.selectedRateTypes.length) {
      return true;
    }

    return parseInt($scope.selectedRateTypeID) === rate.rate_type.id;
  };

  /**
   * clear all selected values on changing tab
   */

  $scope.deleteAllSelectedValues = function () {
    $scope.deleteAllSelectedRates();
    $scope.deleteAllSelectedRateTypes();
    $scope.deleteAllSelectedRateTypesFromRTT();
    $scope.deleteAllSelectedCards();
  };

  /**
   * when we click the set button from calendar popup, we will get this popup
   */
  $scope.$on(rvTwoMonthCalendarEventConstants.TWO_MONTH_CALENDAR_DATE_UPDATED, function (event, data) {
    $scope.fromDate = data.fromDate;
    $scope.toDate = data.toDate;

    $scope.selectedDateRange = formatDateForUI(data.fromDate) + ' to ' + formatDateForUI(data.toDate);
  });

  /**
  * to switch the tab from left side filter's show all/select rate
  * @param  {[type]} tab [description]
  * @return {[type]}     [description]
  */
  $scope.switchTabAndCorrespondingActions = function (tab) {
    $scope.chosenTab = tab;
    refreshScroller();
    scrollTo('.filters');

    switch (tab) {
      case 'RATES':
        $scope.deleteAllSelectedRateTypesFromRTT();
        break;

      case 'RATE_TYPES':
        $scope.deleteAllSelectedRates();
        $scope.deleteAllSelectedRateTypes();
        break;

      case 'ROOM_TYPES':
        $scope.deleteAllSelectedValues();
        break;
    }
  };

  $scope.getButtonText = function () {
    var buttonText = '';

    switch ($scope.chosenTab) {

      case 'RATES':
        if ($scope.selectedRates.length === 0 && $scope.selectedCards.length === 0) {
          buttonText = 'Show All Rates';
        } else if ($scope.selectedCards.length > 0) {
          buttonText = 'Show Contract Rates';
        } else {
          buttonText = 'Show Selected Rates';
        }
        break;

      case 'RATE_TYPES':
        if ($scope.selectedRateTypesFromRTT.length === 0) {
          buttonText = 'Show All Rate Types';
        } else {
          buttonText = 'Show Selected Rate Types';
        }
        break;

      case 'ROOM_TYPES':
        buttonText = 'Show All Room Types';
        break;

      default:
        buttonText = 'Show All Rates';
    }

    return buttonText;
  };

  /**
   * inorder to show the two month calendar on tapping the date range button
   */
  $scope.showCalendar = function () {
    var maxRangeBetweenFromAndToDate = {
      month: 3
    };

    var dataForCalendar = {
      fromDate: new tzIndependentDate($rootScope.businessDate),
      toDate: util.getFirstDayOfNextMonth($rootScope.businessDate),
      maxRange: maxRangeBetweenFromAndToDate
    };

    // if there is already two date choosed
    if ($scope.selectedDateRange !== '') {
      dataForCalendar.fromDate = new tzIndependentDate($scope.fromDate);
      dataForCalendar.toDate = new tzIndependentDate($scope.toDate);
    }

    ngDialog.open({
      template: '/assets/partials/rateManager_/dateRangeModal/rvDateRangeModal.html',
      controller: 'rvDateRangeModalCtrl',
      className: 'ngdialog-theme-default calendar-modal',
      scope: $scope,
      data: dataForCalendar
    });
  };

  /**
   * utility method to clear all selection from tabs
   */
  var clearAllRatesAllRoomTypesAllRateTypes = function clearAllRatesAllRoomTypesAllRateTypes() {
    $scope.deleteAllSelectedRates();
    $scope.deleteAllSelectedRateTypes();
    $scope.deleteAllSelectedRateTypesFromRTT();

    // deleting the node will change the height
    refreshScroller();
  };

  /**
   * on choosing the card from search result
   */
  $scope.cardSelected = function (event, ui) {
    if (!$scope.selectedCards.length) {
      $scope.selectedCards.push(ui.item);
    } else {
      var selectedCardIDs = _.pluck($scope.selectedCards, 'id');

      if (selectedCardIDs.indexOf(ui.item.id) < 0) {
        $scope.selectedCards.push(ui.item);
      }
    }

    clearAllRatesAllRoomTypesAllRateTypes();

    $scope.chosenTab = 'RATES';

    runDigestCycle();

    // we're adding nodes
    refreshScroller();

    // scrolling to the added position
    scrollTo('#rm-selected-card-list span:last-child');
  };

  /**
   * to delete
   * @param  {LongInteger} rateTypeID [selected rate type's id to delete]
   */
  $scope.deleteSelectedCard = function (cardID) {
    var indexToDelete = _.findIndex($scope.selectedCards, { id: parseInt(cardID) });

    $scope.selectedCards.splice(indexToDelete, 1);

    $scope.cardSearchText = '';

    // deleting the node will change the height
    refreshScroller();
  };

  /**
   * to remove all selected card in one take
   */
  $scope.deleteAllSelectedCards = function () {
    $scope.selectedCards = [];
    $scope.cardSearchText = '';
    // deleting the nodes will change the height
    refreshScroller();
  };

  /**
   * @return {Boolean}
   */
  $scope.shouldDisableShowRateButton = function () {
    return !$scope.fromDate || !$scope.toDate;
  };

  /**
   * to run angular digest loop,
   * will check if it is not running
   */
  var runDigestCycle = function runDigestCycle() {
    if (!$scope.$$phase) {
      $scope.$digest();
    }
  };

  /**
   * when all api reqd to fill drop down successfully completed
   */
  var successFetchOfFillAndSetRateRateTypesAndSortOptions = function successFetchOfFillAndSetRateRateTypesAndSortOptions() {
    $scope.$emit('hideLoader');
  };

  /**
   * when something got wrong during the api reqd to fill drop down
   */
  var failedToFillAndSetRateRateTypesAndSortOptions = function failedToFillAndSetRateRateTypesAndSortOptions() {
    $scope.$emit('hideLoader');
    $scope.$emit('showErrorMessage', ['Sorry, something got wrong while trying to fill the rate, rate type, sorting preference values']);
  };

  /**
   * on success of sort preference api call
   * @param {Object} data
   */
  var successCallBackOfSortPreferenceFetch = function successCallBackOfSortPreferenceFetch(data) {
    $scope.orderBySelectedValue = data.id;
  };

  /**
   * on success of sort options api call
   * @param {array} data
   */
  var successCallBackOfSortOptionsFetch = function successCallBackOfSortOptionsFetch(data) {
    $scope.orderByValues = data;
  };

  /**
   * on success of rate api call
   * @param {array} data
   */
  var successCallBackOfRatesFetch = function successCallBackOfRatesFetch(data) {
    $scope.rates = _.sortBy(data.results, 'name');
  };

  /**
   * on success of ratetype list api call
   * @param {array} data
   */
  var successCallBackOfRateTypeFetch = function successCallBackOfRateTypeFetch(data) {
    $scope.rateTypes = _.sortBy(data, 'name');
  };

  /**
   * filling the drop down values from the API
   */
  var fillAndSetRateRateTypesAndSortOptions = function fillAndSetRateRateTypesAndSortOptions() {
    var promises = [];

    // we are not using our normal API calling since we have multiple API calls needed
    $scope.$emit('showLoader');

    // sort values
    promises.push(RateMngrCalendarSrv.fetchSortOptions().then(successCallBackOfSortOptionsFetch));

    // sort preference
    promises.push(RateMngrCalendarSrv.fetchSortPreferences().then(successCallBackOfSortPreferenceFetch));

    // rates
    promises.push(RMFilterOptionsSrv.fetchAllRates().then(successCallBackOfRatesFetch));

    // rate types
    promises.push(RMFilterOptionsSrv.fetchRateTypes().then(successCallBackOfRateTypeFetch));

    // Fire
    $q.all(promises).then(successFetchOfFillAndSetRateRateTypesAndSortOptions, failedToFillAndSetRateRateTypesAndSortOptions);
  };

  var prepareDataForViewUpdate = function prepareDataForViewUpdate(results) {
    var selectedRateTypeList;

    if ($scope.chosenTab === 'RATES') {
      selectedRateTypeList = [];
    }
    if ($scope.chosenTab === 'RATE_TYPES') {
      selectedRateTypeList = $scope.selectedRateTypesFromRTT;
    }

    var valuesChoosed = {
      fromDate: $scope.fromDate,
      toDate: $scope.toDate,

      orderID: $scope.orderBySelectedValue,

      groupBy: $scope.groupBySelectedValue,

      chosenTab: $scope.chosenTab,

      selectedRateTypes: selectedRateTypeList,
      selectedRates: $scope.selectedRates,

      selectedCards: $scope.selectedCards,

      fromLeftFilter: true,
      houseAvailability: results.houseAvailability || [],
      weekendDays: results.weekendDays || [],
      eventsCount: results.eventsCount || []
    };

    $scope.$emit(rvRateManagerEventConstants.UPDATE_RESULTS, valuesChoosed);
  };

  var fetchHouseAvailabilityAndEventsCount = function fetchHouseAvailabilityAndEventsCount() {

    $scope.callAPI(rvRateManagerCoreSrv.fetchHouseAvailabilityAndEventsCount, {
      params: {
        from_date: $filter('date')($scope.fromDate, $rootScope.dateFormatForAPI),
        to_date: $filter('date')($scope.toDate, $rootScope.dateFormatForAPI),
        is_include_overbooking: false
      },
      successCallBack: prepareDataForViewUpdate
    });
  };

  var fetchHouseEventsCount = function fetchHouseEventsCount() {

    $scope.callAPI(rvRateManagerCoreSrv.fetchEventsCount, {
      params: {
        from_date: $filter('date')($scope.fromDate, $rootScope.dateFormatForAPI),
        to_date: $filter('date')($scope.toDate, $rootScope.dateFormatForAPI)
      },
      successCallBack: prepareDataForViewUpdate
    });
  };

  /**
   * This method handles on-click of the SHOW RATES BUTTON
   */
  $scope.clickedOnShowRates = function () {
    if ($scope.chosenTab === 'RATES' || $scope.chosenTab === 'RATE_TYPES') {
      fetchHouseAvailabilityAndEventsCount();
    } else {
      fetchHouseEventsCount();
    }
  };

  /**
   * data model for UI will be initialized from here
   */
  var initializeDataModelForMe = function initializeDataModelForMe() {
    // we have to open the filter on the left side
    $scope.isFilterVisible = true;

    // date range
    $scope.fromDate = null;
    $scope.toDate = null;
    $scope.selectedDateRange = '';

    // order by values
    $scope.orderBySelectedValue = null; // will be assigning to the preferred from the admin
    $scope.orderByValues = []; // will be filled from API
    $scope.orderByValueMappings = rvRateManagerOrderByConstants;

    // group by values
    $scope.groupBySelectedValue = ''; // default unselected
    $scope.groupByValues = rvRateManagerGroupByConstants;

    // tab selection
    $scope.chosenTab = 'RATES';

    // rate type related
    $scope.rateTypes = []; // will be filled from API once we get to th = view
    $scope.selectedRateTypes = [];
    $scope.selectedRateTypeID = ''; // ng-model for rate type selection

    // rate type from Rate Type Tab
    $scope.selectedRateTypeIDFromRTT = ''; // ng-model for rate type selection
    $scope.selectedRateTypesFromRTT = [];

    // rate related
    $scope.rates = []; // will be filled from API once we get to th = view
    $scope.selectedRates = [];
    $scope.selectedRateID = ''; // ng-model for rate selection

    // card search area
    $scope.selectedCards = [];
    $scope.cardSearchResults = [];
    $scope.cardSearchText = '';
  };

  /**
   * initialisation function
   */
  (function () {

    setScroller();

    initializeDataModelForMe();

    fillAndSetRateRateTypesAndSortOptions();

    refreshScroller();
  })();
}]);