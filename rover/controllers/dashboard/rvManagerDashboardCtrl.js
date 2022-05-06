sntRover.controller('RVmanagerDashboardController',
 ['$scope',
  '$rootScope',
  '$state',
  '$vault',
  'RVDashboardSrv',
  '$timeout',
  'ngDialog',
  'marketData',
  'sourceData',
  'segmentData',
  'originData',
  'rvAnalyticsHelperSrv',
  'rvAnalyticsSrv',
  '$stateParams',
  function($scope, $rootScope, $state, $vault, RVDashboardSrv, $timeout, ngDialog, marketData, sourceData, segmentData, originData, rvAnalyticsHelperSrv, rvAnalyticsSrv, $stateParams) {
  // inheriting some useful things
  BaseCtrl.call(this, $scope);
  var that = this;
  // scroller related settings
  var scrollerOptions = {
    preventDefault: false
  };

  $scope.isStatisticsOpened = false;
  $scope.setScroller('dashboard_scroller', scrollerOptions);
  var analyticsScrollerOptions = {
      preventDefaultException: {
        tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT|A|DIV)$/
      },
      preventDefault: false
    };
    
  $scope.setScroller('analytics_scroller', analyticsScrollerOptions);
  $scope.setScroller('analytics_details_scroller', analyticsScrollerOptions);

  // changing the header
  $scope.$emit("UpdateHeading", 'DASHBOARD_MANAGER_HEADING');
  $scope.showDashboard = true; // variable used to hide/show dabshboard

  // we are hiding the search results area
  $scope.$broadcast("showSearchResultsArea", false);

  $scope.tomorrow = tzIndependentDate($rootScope.businessDate);
  $scope.tomorrow.setDate($scope.tomorrow.getDate() + 1);
  $scope.dayAfterTomorrow = tzIndependentDate($scope.tomorrow);
  $scope.dayAfterTomorrow.setDate($scope.tomorrow.getDate() + 1);

  $scope.$on("$includeContentLoaded", function() {
      // we are showing the add new guest button in searhc only if it is standalone & search result is empty
      if ($rootScope.isStandAlone) {
          $scope.$broadcast("showAddNewGuestButton", true);
      }
  });


  // we are setting the header accrdoing to manager's dashboard
  $scope.$emit("UpdateHeading", 'DASHBOARD_MANAGER_HEADING');

  /*
   *    a recievable function hide/show search area.
   *    when showing the search bar, we will hide dashboard & vice versa
   *    param1 {event}, javascript event
   *    param2 {boolean}, value to determine whether dashboard should be visible
   */
  $scope.$on("showDashboardArea", function(event, showDashboard) {
    $scope.showDashboard = showDashboard;
    $scope.refreshScroller('dashboard_scroller');
  });

  /**
   *   recievalble function to update dashboard reservatin search results
   *   intended for checkin, inhouse, checkout (departed), vip buttons handling.
   *   @param {Object} javascript event
   *   @param {array of Objects} data search results
   */
  $scope.$on("updateDashboardSearchDataFromExternal", function(event, data) {
    $scope.$broadcast("updateDataFromOutside", data);
    $scope.$broadcast("showSearchResultsArea", true);
  });

  /**
   *   recievalble function to update dashboard reservatin search result's type
   *   intended for checkin, inhouse, checkout (departed), vip buttons search result handling.
   *   @param {Object} javascript event
   *   @param {array of Objects} data search results
   */
  $scope.$on("updateDashboardSearchTypeFromExternal", function(event, type) {
    $scope.$broadcast("updateReservationTypeFromOutside", type);
  });

  // show Latecheckout icon
  $scope.shouldShowLateCheckout = true;
  $scope.shouldShowQueuedRooms = true;

  /**
   *   a recievder function to show erorr message in the dashboard
   *   @param {Object} Angular event
   *   @param {String} error message to display
   */

  $scope.$on("showErrorMessage", function(event, errorMessage) {
    $scope.errorMessage = errorMessage;
  });

  /**
   * function used to check null values, especially api response from templates
   */
  $scope.escapeNull = function(value, replaceWith) {
    var newValue = "";

    if ((typeof replaceWith !== "undefined") && (replaceWith !== null)) {
      newValue = replaceWith;
    }
    var valueToReturn = ((value === null || typeof value === 'undefined') ? newValue : value);

    return valueToReturn;
  };

  /**
   * function to check whether the object is empty or not
   * @param {Object} Js Object
   * @return Boolean
   */
  $scope.isEmptyObject = $.isEmptyObject;

  $scope.$on("UPDATE_MANAGER_DASHBOARD", function() {
    $scope.$emit("UpdateHeading", 'DASHBOARD_MANAGER_HEADING');
  });
  // scroller is not appearing after coming back from other screens
  setTimeout(function() {
    $scope.refreshScroller('dashboard_scroller');
  }, 500);


  // Function to be deleted - CICO-9433 - Sample button in dashboard screen
  $scope.setReservationDataFromDiaryScreen = function() {
    var temporaryReservationDataFromDiaryScreen = {

      "arrival_date": "2014-07-15",
      "departure_date": "2014-07-16",
      "arrival_time": "04:30 AM",
      "departure_time": "09:15 PM",

      "rooms": [{
        "room_id": "245",
        "rateId": "382",
        "numAdults": "1",
        "numChildren": "2",
        "numInfants": "4",
        "amount": 300
      }]
    };

    $vault.set('temporaryReservationDataFromDiaryScreen', JSON.stringify(temporaryReservationDataFromDiaryScreen));
    $state.go("rover.reservation.staycard.mainCard.summaryAndConfirm", {
      'reservation': 'HOURLY'
    });
  };

  /**
   * Function which checks whether ADR data is shown in statistic section or not
  */
  $scope.isADRShown = function() {
    return ($scope.isStandAlone && !$scope.isHourlyRateOn && $scope.isStatisticsOpened);
  };

  /**
   * Function which handles the click of the statistic btn in dashboard
  */
 $scope.toggleStatistics = function() {
  $scope.isStatisticsOpened = !$scope.isStatisticsOpened;
  var onStatisticsFetchSuccess = function(data) {
        $scope.$emit('hideLoader');
        $scope.statistics = data;

        $scope.refreshScroller('dashboard_scroller');
        $timeout(function() {
          $scope.myScroll['dashboard_scroller'].scrollTo($scope.myScroll['dashboard_scroller'].maxScrollX,
                  $scope.myScroll['dashboard_scroller'].maxScrollY, 500);
        }, 500);

      },
      onStatisticsFetchFailure = function(error) {
        $scope.$emit('hideLoader');

      };
  // Invoke the api only when the statistic block is opened
  var requestParams = {
    'show_adr': true,
    'show_upsell': true,
    'show_rate_of_day': true
  };
  // CICO-31344

  if (!$scope.isStandAlone) {
    requestParams.show_adr = false;
  }
  if ($scope.isStatisticsOpened) {
    $scope.invokeApi(RVDashboardSrv.fetchStatisticData, requestParams, onStatisticsFetchSuccess, onStatisticsFetchFailure);
  } else {
    $timeout(function() {
      $scope.refreshScroller('dashboard_scroller');
    }, 500);

  }

 };

  var refreshAnalyticsScroller = function() {
    $timeout(function() {
      $scope.refreshScroller('analytics_scroller');
      $scope.refreshScroller('analytics_details_scroller');
    }, 500);
  };

  $scope.dashboardFilter.isManagerDashboard = true;
  $scope.$on('REFRESH_ANALTICS_SCROLLER', refreshAnalyticsScroller);

  $scope.dashboardFilter.chartTypes = [{
    "name": "Occupancy",
    "code": "occupancy"
  }, {
    "name": "Occupied Rooms",
    "code": "occupied_rooms"
  }, {
    "name": "ADR",
    "code": "adr"
  }, {
    "name": "RevPAR",
    "code": "rev_par"
  }, {
      "name": "Room Revenue",
      "code": "revenue"
  }];

  $scope.dashboardFilter.chartType = "occupancy";

  $scope.dashboardFilter.aggTypes = [{
    "name": "Room type",
    "code": "room_type_id"
  }, {
    "name": "Market",
    "code": "market_id"
  }, {
    "name": "Source",
    "code": "source_id"
  }, {
    "name": "Segment",
    "code": "segment_id"
  }, {
    "name": "Origin",
    "code": "booking_origin_id"
  }];

  $scope.dashboardFilter.toDate = angular.copy($rootScope.businessDate);
  $scope.dashboardFilter.fromDate = angular.copy(moment($scope.dashboardFilter.toDate).subtract(7, 'days').format('YYYY-MM-DD'));

  var dateOptions = {
    changeYear: true,
    changeMonth: true,
    yearRange: "-5:+5",
    dateFormat: 'yy-mm-dd',
    onSelect: function(dateText) {
      $scope.dashboardFilter.fromDate = dateText;
      $scope.$broadcast('RELOAD_DATA_WITH_DATE_FILTER_' + $scope.dashboardFilter.selectedAnalyticsMenu);
      ngDialog.close();
    }
  };

  var toDateOptions = {
    changeYear: true,
    changeMonth: true,
    yearRange: "-5:+5",
    dateFormat: 'yy-mm-dd',
    onSelect: function(dateText, inst) {
      $scope.dashboardFilter.toDate = dateText;
      $scope.$broadcast('RELOAD_DATA_WITH_DATE_FILTER_' + $scope.dashboardFilter.selectedAnalyticsMenu);
      ngDialog.close();
    }
  };

  $scope.showAnalyticsCalendar = function(type) {
    $scope.dateOptions = (type === 'toDate') ? toDateOptions : dateOptions;
    $scope.datePicked = (type === 'toDate') ?
      moment($scope.dashboardFilter.toDate).format('YYYY-MM-DD') :
      moment($scope.dashboardFilter.fromDate).format('YYYY-MM-DD');
    $scope.datePicked = (type === 'toDate') ? $scope.dashboardFilter.toDate : $scope.dashboardFilter.fromDate;

    $timeout(function() {
      ngDialog.open({
        template: '/assets/partials/search/rvDatePickerPopup.html',
        className: '',
        scope: $scope
      });
    }, 1000);
  };

  $scope.availableRoomTypes = angular.copy($scope.roomTypes);
  $scope.marketData = marketData && marketData.markets ? marketData.markets : [];
  $scope.sourceData = sourceData && sourceData.sources ? sourceData.sources : [];
  $scope.segmentData = segmentData && segmentData.segments ? segmentData.segments : [];
  $scope.originData = originData && originData.booking_origins ? originData.booking_origins : [];

  var shallowDecoded,
    shallowEncoded,
    filtersSelected = {
      "filters": {}
    };
  var generateParamsBasenOnFilters = function() {

    filtersSelected.filters.room_type_id = _.pluck($scope.selectedFilters.roomTypes, 'id');
    filtersSelected.filters.market_id = _.pluck($scope.selectedFilters.marketCodes, 'value');
    filtersSelected.filters.source_id = _.pluck($scope.selectedFilters.sourceCodes, 'value');
    filtersSelected.filters.segment_id = _.pluck($scope.selectedFilters.segmentCodes, 'value');
    filtersSelected.filters.booking_origin_id = _.pluck($scope.selectedFilters.originCodes, 'value');
    shallowEncoded = $.param(filtersSelected);
    shallowDecoded = decodeURIComponent(shallowEncoded);
    $scope.refreshScroller('analytics-filter-options-scroll');
  };

  $scope.toggleFilterView = function() {
    $scope.dashboardFilter.showFilters = !$scope.dashboardFilter.showFilters;
    var selectedAnalyticsMenu = $scope.dashboardFilter.selectedAnalyticsMenu;

    // if toggle button is clicked, only previously applied filters are to be applied to avoid confusions on 
    // what was applied before. This can vary from chart to chart
    if ((selectedAnalyticsMenu === 'HK_OVERVIEW' ||
      selectedAnalyticsMenu === 'HK_WORK_PRIRORITY' ||
      selectedAnalyticsMenu === 'FO_ARRIVALS' ||
      selectedAnalyticsMenu === 'FO_ACTIVITY' ||
      selectedAnalyticsMenu === 'FO_WORK_LOAD') && rvAnalyticsSrv.selectedRoomType !== $scope.dashboardFilter.selectedRoomType) {
        $scope.dashboardFilter.selectedRoomType = rvAnalyticsSrv.selectedRoomType;
    } 

    if (selectedAnalyticsMenu === 'FO_ACTIVITY') {
      $scope.dashboardFilter.showPreviousDayData = rvAnalyticsSrv.foChartFilterSet.showPreviousDayData;
    }

    if (selectedAnalyticsMenu === 'FO_WORK_LOAD') {
      $scope.dashboardFilter.showRemainingReservations = rvAnalyticsSrv.foChartFilterSet.showRemainingReservations;
    }

    if (selectedAnalyticsMenu === 'PERFOMANCE') {
      $scope.dashboardFilter.showLastYearData = rvAnalyticsSrv.managerChartFilterSet.showLastYearData;
      $scope.dashboardFilter.lastyearType = rvAnalyticsSrv.managerChartFilterSet.lastyearType;
    }

    if (selectedAnalyticsMenu === 'DISTRIBUTION' ||
        selectedAnalyticsMenu === 'PACE') {
      var excludeDatePickerSelection =  true;

      emptyAllChartFilters(excludeDatePickerSelection);
      
      populateSelectedFilter(rvAnalyticsSrv.managerChartFilterSet.filtersSelected.filters);
      $scope.dashboardFilter.selectedAnalyticsFilter = angular.copy(rvAnalyticsSrv.managerChartFilterSet.selectedSavedFilter);

      if ($scope.dashboardFilter.selectedAnalyticsFilter && $scope.dashboardFilter.selectedAnalyticsFilter.name) {
        $scope.dashboardFilter.showFilterName = true;
      }

      if ($scope.dashboardFilter.selectedAnalyticsMenu === 'DISTRIBUTION') {
        $scope.dashboardFilter.chartType = rvAnalyticsSrv.managerChartFilterSet.chartType;
        $scope.dashboardFilter.aggType = rvAnalyticsSrv.managerChartFilterSet.aggType;
        $scope.dashboardFilter.gridViewToggle = angular.copy(rvAnalyticsSrv.managerChartFilterSet.gridViewActive);
        $scope.dashboardFilter.gridViewActive = angular.copy(rvAnalyticsSrv.managerChartFilterSet.gridViewActive);
      } else {
        $scope.dashboardFilter.lineChartActive = angular.copy(rvAnalyticsSrv.managerChartFilterSet.lineChartActive);
        $scope.dashboardFilter.datesToCompare = angular.copy(rvAnalyticsSrv.managerChartFilterSet.datesToCompare);
      }

      $scope.refreshScroller('analytics-filter-scroll');
      $scope.refreshScroller('analytics-filter-options-scroll');
    }
  };

  var resetMangerChartFilters = function() {
    $scope.selectedFilters = {
      "roomType": "",
      "marketCode": "",
      "sourceCode": "",
      "originCode": "",
      "segmentCode": "",
      "roomTypes": [],
      "marketCodes": [],
      "sourceCodes": [],
      "originCodes": [],
      "segmentCodes": []
    };
    $scope.dashboardFilter.selectedFilters = $scope.selectedFilters;
  };

  resetMangerChartFilters();

  /* ********************** FILTER REMOVAL ACTION STARTS HERE ********************/
  var filterRemovalActions = function(mainList, filterList, value) {
    var selectedItem = rvAnalyticsHelperSrv.findSelectedFilter(filterList, value);

    mainList = rvAnalyticsHelperSrv.addToAndSortArray(mainList, selectedItem);
    filterList = _.reject(filterList, selectedItem);
    return filterList;
  };

  $scope.distributionFilterRemoved = function(type, value) {
    if (type === 'MARKET') {
      $scope.selectedFilters.marketCodes = filterRemovalActions($scope.marketData,
        $scope.selectedFilters.marketCodes,
        value);
    } else if (type === 'SOURCE') {
      $scope.selectedFilters.sourceCodes = filterRemovalActions($scope.sourceData,
        $scope.selectedFilters.sourceCodes,
        value);
    } else if (type === 'SEGMENT') {
      $scope.selectedFilters.segmentCodes = filterRemovalActions($scope.segmentData,
        $scope.selectedFilters.segmentCodes,
        value);
    } else if (type === 'ORIGIN') {
      $scope.selectedFilters.originCodes = filterRemovalActions($scope.originData,
        $scope.selectedFilters.originCodes,
        value);
    } else if (type === 'ROOM_TYPE') {
      $scope.selectedFilters.roomTypes = filterRemovalActions($scope.availableRoomTypes,
        $scope.selectedFilters.roomTypes,
        value);
    }
    generateParamsBasenOnFilters();
  };
  /* ********************** FILTER REMOVAL ACTION ENDS HERE ********************/

  /* ********************** FILTER ADDITION ACTION STARTS HERE ********************/

  var newFilterAdditionActions = function(mainList, filterList, value) {
    var selectedItem = rvAnalyticsHelperSrv.findSelectedFilter(mainList, value);

    filterList = rvAnalyticsHelperSrv.addToAndSortArray(filterList, selectedItem);
    mainList = _.reject(mainList, selectedItem);
    return mainList;
  };

  $scope.distributionFilterAdded = function(type, value) {
    if (!value) {
      return;
    } else if (type === 'MARKET') {
      $scope.marketData = newFilterAdditionActions($scope.marketData,
        $scope.selectedFilters.marketCodes,
        value);
    } else if (type === 'SOURCE') {
      $scope.sourceData = newFilterAdditionActions($scope.sourceData,
        $scope.selectedFilters.sourceCodes,
        value);
    } else if (type === 'SEGMENT') {
      $scope.segmentData = newFilterAdditionActions($scope.segmentData,
        $scope.selectedFilters.segmentCodes,
        value);
    } else if (type === 'ORIGIN') {
      $scope.originData = newFilterAdditionActions($scope.originData,
        $scope.selectedFilters.originCodes,
        value);
    } else if (type === 'ROOM_TYPE') {
      $scope.availableRoomTypes = newFilterAdditionActions($scope.availableRoomTypes,
        $scope.selectedFilters.roomTypes,
        value);
    }
    generateParamsBasenOnFilters();
  };

  /* ********************** FILTER ADDITION ACTION ENDS HERE ********************/

  var joinFiltersAndDataSet = function (dataSet, filterData) {
    dataSet = dataSet.concat(filterData);
    dataSet = _.sortBy(dataSet, function(item) {
      return item.name;
    });
    return dataSet;
  };

  var emptyAllChartFilters = function(excludeDatePickerSelection) {
    filtersSelected = {
      filters: {
        room_type_id: [],
        market_id: [],
        source_id: [],
        booking_origin_id: [],
        segment_id: []
      }
    };
    shallowEncoded = "";
    $scope.dashboardFilter.selectedRoomType = "";
    $scope.dashboardFilter.chartType = "occupancy";
    $scope.dashboardFilter.aggType = "";

    if (!excludeDatePickerSelection) {
      $scope.dashboardFilter.datePicked = $rootScope.businessDate;
      $scope.dashboardFilter.toDate = angular.copy($rootScope.businessDate);
      $scope.dashboardFilter.fromDate = angular.copy(moment($scope.dashboardFilter.toDate)
                                               .subtract(7, 'days')
                                               .format('YYYY-MM-DD'));
    }
    $scope.dashboardFilter.showRemainingReservations = false;
    $scope.dashboardFilter.showPreviousDayData = false;

    $scope.marketData = joinFiltersAndDataSet($scope.marketData, $scope.selectedFilters.marketCodes);
    $scope.sourceData = joinFiltersAndDataSet($scope.sourceData, $scope.selectedFilters.sourceCodes);
    $scope.segmentData = joinFiltersAndDataSet($scope.segmentData, $scope.selectedFilters.segmentCodes);
    $scope.originData = joinFiltersAndDataSet($scope.originData, $scope.selectedFilters.originCodes);
    $scope.availableRoomTypes = joinFiltersAndDataSet($scope.availableRoomTypes, $scope.selectedFilters.roomTypes);
    $scope.dashboardFilter.showLastYearData = false;
    $scope.dashboardFilter.gridViewActive = false;
    $scope.dashboardFilter.lastyearType = "SAME_DATE_LAST_YEAR";
    $scope.dashboardFilter.gridViewActive = false;
    $scope.dashboardFilter.lineChartActive = false;
    $scope.dashboardFilter.datesToCompare = [];
    $scope.dashboardFilter.selectedAnalyticsFilter = {};
    $scope.dashboardFilter.showFilterName = false;
    $scope.dashboardFilter.gridViewActive = false;
    $scope.dashboardFilter.gridViewToggle = false;
    resetMangerChartFilters();
  };

  $scope.$on('RESET_CHART_FILTERS', function() {
    rvAnalyticsSrv.resetChartFilterSet();
    emptyAllChartFilters();
  });

  $scope.exportAsCSV = function() {
    $scope.$broadcast('EXPORT_AS_CSV', shallowEncoded);
  };

  /** ********************** HK chart  headers **********************************/
  $scope.availableRoomTypes = angular.copy($scope.roomTypes);

  $scope.$on('ROOM_TYPE_SHORTAGE_CALCULATED', function(e, calculatedRoomTypes) {
    $scope.roomTypesForWorkPrioriy = [];
    _.each($scope.availableRoomTypes, function(roomType) {
      roomType.shortage = 0;
      roomType.overBooking = 0;
      _.each(calculatedRoomTypes, function(calculatedRoomType) {
        if (roomType.code === calculatedRoomType.code) {
          roomType.shortage = calculatedRoomType.shortage;
          roomType.overBooking = calculatedRoomType.overBooking;
        }
      });
    });
  });

  /** ********************** FO chart headers **********************************/

  $scope.onAnlayticsRoomTypeChange = function() {
    $scope.dashboardFilter.showFilters = false;
    rvAnalyticsSrv.selectedRoomType = $scope.dashboardFilter.selectedRoomType;
    $scope.$broadcast('RELOAD_DATA_WITH_SELECTED_FILTER_' + $scope.dashboardFilter.selectedAnalyticsMenu);
  };

  $scope.applyFoFilters = function () {
    $scope.dashboardFilter.showFilters = false;

    rvAnalyticsSrv.selectedRoomType = $scope.dashboardFilter.selectedRoomType;
    rvAnalyticsSrv.foChartFilterSet.showRemainingReservations = $scope.dashboardFilter.showRemainingReservations;
    rvAnalyticsSrv.foChartFilterSet.showPreviousDayData = $scope.dashboardFilter.showPreviousDayData;

    $scope.$broadcast('RELOAD_DATA_WITH_SELECTED_FILTER_' + $scope.dashboardFilter.selectedAnalyticsMenu);
  };

  /** *************** LINE CHART STARTS HERE ***************************/

  $scope.dashboardFilter.datesToCompare = [];

  $scope.showDateComparisonCalendar = function() {
    $scope.dateOptions = {
      changeYear: true,
      changeMonth: true,
      yearRange: "-5:+5",
      dateFormat: 'yy-mm-dd',
      onSelect: function(dateText) {
        // reject if the date was already selected
        if (!$scope.dashboardFilter.datesToCompare.includes(dateText)) {
          $scope.dashboardFilter.datesToCompare.push(dateText);
        }
        ngDialog.close();
      }
    };

    $timeout(function() {
      ngDialog.open({
        template: '/assets/partials/search/rvDatePickerPopup.html',
        className: '',
        scope: $scope
      });
    }, 1000);
  };

  $scope.removeDateToCompare = function(selectedDate) {
    $scope.dashboardFilter.datesToCompare = _.reject($scope.dashboardFilter.datesToCompare, function(date) {
      return date === selectedDate;
    });
  };

  /** *************** LINE CHART ENDS HERE ***************************/

  /** ************************* SAVED FILTERS CODE STARTS HERE ***********************************/

  var populateSelectedFilter = function(selectedFilter) {

    var selectedFilters = [{
      type: 'ROOM_TYPE',
      filter: selectedFilter.room_type_id
    }, {
      type: 'MARKET',
      filter: selectedFilter.market_id
    }, {
      type: 'SOURCE',
      filter: selectedFilter.source_id
    }, {
      type: 'SEGMENT',
      filter: selectedFilter.segment_id
    }, {
      type: 'ORIGIN',
      filter: selectedFilter.booking_origin_id
    }];

    _.each(selectedFilters, function(filterSet) {
      _.each(filterSet.filter, function(filter) {
        $scope.distributionFilterAdded(filterSet.type, filter);
      });
    });

    if ($scope.dashboardFilter.selectedAnalyticsMenu === 'DISTRIBUTION') {
      $scope.dashboardFilter.aggType = selectedFilter.group_by;
      $scope.dashboardFilter.chartType = selectedFilter.chart_type ? selectedFilter.chart_type : $scope.dashboardFilter.chartType;
      $scope.dashboardFilter.gridViewToggle = selectedFilter.grid_view_toggle ? selectedFilter.grid_view_toggle : $scope.dashboardFilter.gridViewToggle;
    } else {
       $scope.dashboardFilter.lineChartActive = selectedFilter.line_chart_active ? selectedFilter.line_chart_active : $scope.dashboardFilter.lineChartActive; 
       $scope.dashboardFilter.datesToCompare = selectedFilter.dates_to_compare ? selectedFilter.dates_to_compare : $scope.dashboardFilter.datesToCompare;
    }
    
  };

  // After APIs are called set base href to # for the SVG gradients to work
  var setHrefForChart = function() {
    $('base').attr('href', '#');
  };

  $scope.setScroller('analytics-filter-scroll');
  $scope.setScroller('analytics-filter-options-scroll');

  // Fetch saved filters for the chart type
  var fetchSavedAnalyticsFilters = function() {
    var params = {
      chart_type: $scope.dashboardFilter.selectedAnalyticsMenu === 'DISTRIBUTION' ? 'distribution' : 'pace'
    };
    var options = {
      params: params,
      successCallBack: function(response) {
        setHrefForChart();
        $scope.savedFilters = response;
        $scope.refreshScroller('analytics-filter-scroll');
      },
      failureCallBack: setHrefForChart
    };

    $('base').attr('href', '/');
    $scope.callAPI(rvAnalyticsSrv.fetchAnalyticsFilters, options);
  };

  $scope.$on('FETCH_SAVED_ANALYTICS_FILTERS', fetchSavedAnalyticsFilters);

  // Save currently active selections as a filter
  $scope.saveSelectedFilter = function() {

    if ($scope.dashboardFilter.selectedAnalyticsMenu === 'DISTRIBUTION') {
      filtersSelected.filters.group_by = $scope.dashboardFilter.aggType;
      filtersSelected.filters.chart_type = $scope.dashboardFilter.chartType;
      filtersSelected.filters.grid_view_toggle = $scope.dashboardFilter.gridViewToggle;
    } else {
      filtersSelected.filters.line_chart_active = $scope.dashboardFilter.lineChartActive;
      filtersSelected.filters.dates_to_compare = $scope.dashboardFilter.datesToCompare;
    }

    var params = {
      name: $scope.dashboardFilter.selectedAnalyticsFilter.name,
      filter_json: JSON.stringify(filtersSelected),
      chart_type: $scope.dashboardFilter.selectedAnalyticsMenu === 'DISTRIBUTION' ? 'distribution' : 'pace'
    };
    var options = {
      params: params,
      successCallBack: function() {
        $scope.dashboardFilter.showFilterName = false;
        setHrefForChart();
        $scope.refreshScroller('analytics-filter-scroll');

        $scope.dashboardFilter.selectedAnalyticsFilter.filter_json = JSON.stringify(filtersSelected);
        var selectedFilter = $scope.dashboardFilter.selectedAnalyticsFilter;

        if (selectedFilter.id &&
            selectedFilter.id === rvAnalyticsSrv.managerChartFilterSet.selectedSavedFilter.id &&
            selectedFilter.filter_json !== rvAnalyticsSrv.managerChartFilterSet.selectedSavedFilter.filter_json) {
            $scope.applySelectedFilter();
        } else if ($scope.dashboardFilter.selectedAnalyticsFilter.id) {
            $scope.dashboardFilter.showFilterName = true;
        }
        fetchSavedAnalyticsFilters();
      },
      failureCallBack: setHrefForChart
    };

    $('base').attr('href', '/');
    if ($scope.dashboardFilter.selectedAnalyticsFilter.id) {
      options.params.id = $scope.dashboardFilter.selectedAnalyticsFilter.id;
      $scope.callAPI(rvAnalyticsSrv.updateAnalyticsFilter, options);
    } else {
      $scope.callAPI(rvAnalyticsSrv.saveAnalyticsFilter, options);
    }
  };

  $scope.setSelectedFilter = function(selectedFilter) {
    emptyAllChartFilters();
    $scope.dashboardFilter.selectedAnalyticsFilter = selectedFilter;
    populateSelectedFilter(JSON.parse(selectedFilter.filter_json).filters);
    $scope.dashboardFilter.showFilterName = true;
  };

  $scope.deleteSelectedFilter = function($event, selectedFilter) {
    $event.stopPropagation();
    var params = {
      id: selectedFilter.id
    };
    var options = {
      params: params,
      successCallBack: function() {
        setHrefForChart();
        fetchSavedAnalyticsFilters();
        $scope.refreshScroller('analytics-filter-scroll');
      },
      failureCallBack: setHrefForChart
    };

    $('base').attr('href', '/');
    $scope.callAPI(rvAnalyticsSrv.deleteAnalyticsFilter, options);
  };

  // Store the applied filersin Srv layer for using when user toggles filter button afterwards without applying new filters
  $scope.applySelectedFilter = function() {

    $scope.dashboardFilter.showFilters = false;
    $scope.dashboardFilter.gridViewActive = angular.copy($scope.dashboardFilter.gridViewToggle);
    $scope.$broadcast('ANALYTICS_FILTER_CHANGED', shallowEncoded);

    rvAnalyticsSrv.managerChartFilterSet.filtersSelected = angular.copy(filtersSelected);
    rvAnalyticsSrv.managerChartFilterSet.selectedSavedFilter = angular.copy($scope.dashboardFilter.selectedAnalyticsFilter);

    if ($scope.dashboardFilter.selectedAnalyticsMenu === 'DISTRIBUTION') {
      rvAnalyticsSrv.managerChartFilterSet.aggType = $scope.dashboardFilter.aggType;
      rvAnalyticsSrv.managerChartFilterSet.gridViewActive = $scope.dashboardFilter.gridViewActive;
      rvAnalyticsSrv.managerChartFilterSet.chartType = $scope.dashboardFilter.chartType;
    } else {
      rvAnalyticsSrv.managerChartFilterSet.lineChartActive = angular.copy($scope.dashboardFilter.lineChartActive);
      rvAnalyticsSrv.managerChartFilterSet.datesToCompare = angular.copy($scope.dashboardFilter.datesToCompare);
    }
  };

  $scope.addNewFilter = function() {
    $scope.dashboardFilter.selectedAnalyticsFilter = {
      name: '',
      filter_json: JSON.stringify(filtersSelected)
    };
    populateSelectedFilter(filtersSelected);
    $scope.dashboardFilter.showFilterName = true;
  };

  $scope.clearAllFilters = function () {
    emptyAllChartFilters();
  };
  /** ************************* SAVED FILTERS CODE ENDS HERE ***********************************/

  if ($stateParams.onlyLoadAnalytics === 'true') {
    $scope.toggleAnalyticsView();
  }
}]);
