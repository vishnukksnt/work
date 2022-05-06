'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

sntRover.controller('RVBudgetsController', ['$scope', '$rootScope', '$timeout', 'ngDialog', '$filter', '$window', 'RVBudgetsSrv', function ($scope, $rootScope, $timeout, ngDialog, $filter, $window, RVBudgetsSrv) {

    BaseCtrl.call(this, $scope);

    var businessDate = tzIndependentDate($rootScope.businessDate),
        businessMonth = businessDate.getMonth(),
        businessYear = businessDate.getFullYear(),

    // Scroll object variables
    timeLineScrollEndReached = false,
        shouldResetToYearlyView = true,
        isBudgetUpload = false,
        MARKET_SEGMENTS = 'market_segments',
        HEADER_HORIZONTAL_SCROLL = 'budget-header-horizontal',
        GRID_DUAL_SCROLL = 'budget-content-dual',
        VERTICAL_SCROLL = 'left-vertical-scroll',
        MODAL_SCROLLER = 'modal-vertical-scroll';

    // To differentiate b/w yearly and monthly view
    $scope.isYearlyView = true;

    $scope.showNights = false;
    $scope.isRoomRevenueSelected = true;
    $scope.defaultWeekDays = _.map(daysInWeek, function (weekDay, index) {
        return {
            dayName: weekDay,
            dayIndex: index,
            selected: true
        };
    });
    // Initialise weekdays
    $scope.weekDays = angular.copy($scope.defaultWeekDays);
    // Initialise budget object
    $scope.budgetOption = {
        value: MARKET_SEGMENTS,
        selectedYear: businessYear
    };
    // Initialise month object
    $scope.selectedMonth = {
        month: businessMonth,
        startDate: '',
        endDate: '',
        monthDays: []
    };

    $scope.budgetCSV = {
        base64Data: ''
    };

    // To get scroller object
    var getScrollerObject = function getScrollerObject(key) {
        var scrollerObject = $scope.$parent.myScroll && $scope.$parent.myScroll[key];

        if (_.isUndefined(scrollerObject)) {
            scrollerObject = $scope.myScroll[key];
        }
        return scrollerObject;
    };

    // Set/Initialise all the scrollers
    var setAllScrollers = function setAllScrollers() {
        // Base scroller options
        var scrollerOptions = {
            tap: true,
            preventDefault: false,
            probeType: 3,
            mouseWheel: true
        };

        // Horizontal scroller options
        var horizontalScrollerOptions = _.extend({
            scrollX: true,
            scrollY: false
        }, angular.copy(scrollerOptions));

        // Dual scroller options
        var dualScrollerOptions = _.extend({
            scrollY: true,
            scrollX: true
        }, angular.copy(scrollerOptions));

        // Set scrollers
        $scope.setScroller(HEADER_HORIZONTAL_SCROLL, horizontalScrollerOptions);
        $scope.setScroller(GRID_DUAL_SCROLL, dualScrollerOptions);
        $scope.setScroller(VERTICAL_SCROLL, scrollerOptions);
        $scope.setScroller(MODAL_SCROLLER, scrollerOptions);

        // Run digest cycle
        var runDigestCycle = function runDigestCycle() {
            if (!$scope.$$phase) {
                $scope.$digest();
            }
        };

        $timeout(function () {
            getScrollerObject(HEADER_HORIZONTAL_SCROLL).on('scroll', function () {
                var xPos = this.x,
                    block = getScrollerObject(GRID_DUAL_SCROLL);

                block.scrollTo(xPos, block.y);
                // check if edge reached next button
                if (Math.abs(this.maxScrollX) - Math.abs(this.x) <= 150) {
                    if (!timeLineScrollEndReached) {
                        timeLineScrollEndReached = true;
                        runDigestCycle();
                    }
                } else {
                    if (timeLineScrollEndReached) {
                        timeLineScrollEndReached = false;
                        runDigestCycle();
                    }
                }
            });
            getScrollerObject(VERTICAL_SCROLL).on('scroll', function () {
                var yPos = this.y,
                    block = getScrollerObject(GRID_DUAL_SCROLL);

                block.scrollTo(block.x, yPos);
            });
            getScrollerObject(GRID_DUAL_SCROLL).on('scroll', function () {
                var xPos = this.x,
                    yPos = this.y;

                getScrollerObject(HEADER_HORIZONTAL_SCROLL).scrollTo(xPos, 0);
                getScrollerObject(VERTICAL_SCROLL).scrollTo(0, yPos);
                // check if edge reached and enable next button
                if (Math.abs(this.maxScrollX) - Math.abs(this.x) <= 150) {
                    if (!timeLineScrollEndReached) {
                        timeLineScrollEndReached = true;
                        runDigestCycle();
                    }
                } else {
                    if (timeLineScrollEndReached) {
                        timeLineScrollEndReached = false;
                        runDigestCycle();
                    }
                }
            });
        }, 1000);
    };

    setAllScrollers();

    // Refresh all the scrollers
    var refreshGridScrollers = function refreshGridScrollers() {
        $scope.refreshScroller(HEADER_HORIZONTAL_SCROLL);
        $scope.refreshScroller(GRID_DUAL_SCROLL);
        $scope.refreshScroller(VERTICAL_SCROLL);

        var horizontalScroll = $scope.getScroller(HEADER_HORIZONTAL_SCROLL),
            verticalScroll = $scope.getScroller(GRID_DUAL_SCROLL);

        horizontalScroll.scrollTo(0, 0, 0);
        verticalScroll.scrollTo(0, 0, 0);
    };

    // Fetch budget data for selected year and process data
    var fetchAndProcessBudgetData = function fetchAndProcessBudgetData() {
        var params = {
            year: $scope.budgetOption.selectedYear,
            budget_for: $scope.budgetOption.value
        };

        var successCallBackFetchBudgetData = function successCallBackFetchBudgetData(budgetData) {
            if (shouldResetToYearlyView) {
                $scope.isYearlyView = true;
            }
            $scope.budgetData = budgetData.budgets;
            $scope.totals = {
                totalMonthlyRevColumn: budgetData.total_market_segment_or_charge_code_by_year,
                totalDailyRevColumn: budgetData.total_market_segment_or_charge_code_by_month,
                totalMonthlyNightColumn: budgetData.total_room_nights_market_segment_or_charge_code_by_year,
                totalDailyNightColumn: budgetData.total_room_nights_market_segment_or_charge_code_by_month,
                totalMonthlyRevenue: budgetData.total_revenue_by_month,
                totalDailyRevenue: budgetData.total_revenue_by_day,
                totalMonthlyNight: budgetData.total_room_nights_by_month,
                totalDailyNight: budgetData.total_room_nights_by_day,
                totalRevenue: budgetData.total_revenue_by_year,
                totalNight: budgetData.total_room_nights_by_year
            };

            initialiseMarketSegmentAndChargeCode();
            filterMonthsAndYears();
            $scope.gridContentData = $scope.isMarketView() ? initialiseGridData($scope.marketSegmentGridData) : initialiseGridData($scope.chargeCodeGridData);

            processMonthData($scope.selectedMonth.month);
            $scope.leftDataList = angular.copy($scope.leftColumnData);
            if (isBudgetUpload) {
                openImportCSVModal();
                isBudgetUpload = false;
            }
        };

        $scope.invokeApi(RVBudgetsSrv.getBudgetData, params, successCallBackFetchBudgetData);
    };

    var initialiseMarketSegmentAndChargeCode = function initialiseMarketSegmentAndChargeCode() {
        $scope.marketSegmentGridData = [];
        $scope.chargeCodeGridData = [];
        // Initialise market segment grid data with empty data
        _.each($scope.marketSegments, function (marketSegment) {
            $scope.marketSegmentGridData.push({
                "id": marketSegment.id,
                "budgets": [],
                "months": [],
                "dates": []
            });
        });
        // Initialise charge code grid data with empty data
        _.each($scope.chargeCodes, function (chargeCode) {
            $scope.chargeCodeGridData.push({
                "id": chargeCode.id,
                "budgets": [],
                "months": [],
                "dates": []
            });
        });
    };

    var filterMonthsAndYears = function filterMonthsAndYears() {
        $scope.monthOptions = [];
        $scope.yearOptions = [];

        // Budget feature for +/- 2 years from business date
        var minYear = businessYear - 2,
            maxYear = businessYear + 2,
            startMonthIndex = 0,
            endMonthIndex = 11;

        // List of years
        for (var year = minYear; year <= maxYear; year++) {
            $scope.yearOptions.push(year);
        }
        // List of months
        for (var index = startMonthIndex; index <= endMonthIndex; index++) {
            $scope.monthOptions.push({
                monthIndex: index,
                monthName: getMonthName(index),
                selected: true
            });
        }
        // Get all dates and attach to each months
        _.each($scope.monthOptions, function (month) {
            var date = new Date($scope.budgetOption.selectedYear, month.monthIndex, 1),
                monthDays = [];

            while (date.getMonth() === month.monthIndex) {
                monthDays.push(new Date(date));
                date.setDate(date.getDate() + 1);
            }
            month.monthDays = monthDays;
        });
    };

    // Initialise budget grid data
    var initialiseGridData = function initialiseGridData(filteredData) {
        var itemIdType = $scope.isMarketView() ? 'market_segment_id' : 'charge_code_id',
            leftColumnData = $scope.isMarketView() ? $scope.marketSegments : $scope.chargeCodes;

        _.each(leftColumnData, function (dataItem) {
            _.each($scope.budgetData, function (budget) {
                if (dataItem.id === budget[itemIdType]) {
                    _.each(filteredData, function (data) {
                        if (data.id === dataItem.id) {
                            data.budgets.push(budget);
                        }
                    });
                }
            });
        });

        _.each(filteredData, function (dataItem) {
            _.each($scope.monthOptions, function (month) {
                var totalRevenue = 0,
                    totalNights = 0,
                    leftColumnItem,
                    isBudgetCreated = false;

                _.each(dataItem.budgets, function (budget) {
                    var budgetMonthName = getMonthName(tzIndependentDate(budget.date).getMonth());

                    if (month.monthName === budgetMonthName) {
                        isBudgetCreated = true;
                        // totalRevenue += parseFloat(budget.revenue);
                        // totalNights += parseFloat(budget.room_nights);
                    }
                });

                _.each($scope.totals.totalDailyRevColumn, function (revenueElement, index) {
                    if (Number(index) === Number(month.monthIndex) + 1) {
                        totalRevenue = parseFloat(revenueElement[dataItem.id]);
                    }
                });

                _.each($scope.totals.totalDailyNightColumn, function (nightElement, index) {
                    if (Number(index) === Number(month.monthIndex) + 1) {
                        totalNights = parseFloat(nightElement[dataItem.id]);
                    }
                });

                leftColumnItem = _.find($scope.leftColumnData, function (item) {
                    return item.id === dataItem.id;
                });
                dataItem.months.push({
                    monthIndex: month.monthIndex,
                    monthName: month.monthName,
                    budgetData: {
                        totalRevenue: totalRevenue.toFixed(2),
                        totalNights: totalNights.toFixed(2)
                    },
                    isPastMonth: $scope.isPastMonth(month.monthIndex),
                    itemId: dataItem.id,
                    itemName: leftColumnItem.name,
                    isBudgetCreated: isBudgetCreated
                });
            });
        });

        return filteredData;
    };

    // While changing budget type (market/charge code)
    $scope.onChangeBudgetOption = function () {
        shouldResetToYearlyView = true;
        $scope.leftColumnData = $scope.isMarketView() ? $scope.marketSegments : $scope.chargeCodes;
        fetchAndProcessBudgetData();
    };

    // ON/OFF nights toggle
    $scope.onChangeShowNights = function () {
        $scope.showNights = !$scope.showNights;
        $timeout(function () {
            refreshGridScrollers();
        }, 100);
    };

    $scope.openAddBudgetModal = function () {
        // Start date and End date to show in the from/to in the modal
        var currentYear = new Date($rootScope.businessDate).getFullYear();
        var selectedYear = new Date($scope.selectedMonth.startDate).getFullYear();

        $scope.selectedMonth.fromDate = $filter('date')(tzIndependentDate($scope.selectedMonth.startDate, $rootScope.dateFormat));
        if ($scope.selectedMonth.month === businessMonth && currentYear === selectedYear) {
            var tomorrow = new Date($scope.budgetOption.selectedYear, $scope.selectedMonth.month, businessDate.getDate() + 1);

            // Set from date as businessdate + 1
            $scope.selectedMonth.fromDate = $filter('date')(tzIndependentDate(tomorrow, $rootScope.dateFormat));
        }
        $scope.selectedMonth.toDate = $filter('date')(tzIndependentDate($scope.selectedMonth.endDate, $rootScope.dateFormat));
        // Copy of the Start/End dates
        $scope.selectedMonth.fromDateObj = tzIndependentDate($scope.selectedMonth.fromDate);
        $scope.selectedMonth.toDateObj = tzIndependentDate($scope.selectedMonth.toDate);

        $scope.selectedMonth.fromDate = $scope.selectedMonth.fromDateObj;
        $scope.selectedMonth.toDate = $scope.selectedMonth.toDateObj;

        $scope.selectedMonth.start_date = $filter('date')($scope.selectedMonth.fromDate, $rootScope.dateFormat);
        $scope.selectedMonth.end_date = $filter('date')($scope.selectedMonth.toDate, $rootScope.dateFormat);

        resetPostingParams();
        updateWeekDays($scope.selectedMonth.fromDate, $scope.selectedMonth.toDate);

        // Add budget modal
        ngDialog.open({
            template: '/assets/partials/financials/budgets/rvAddBudgetModal.html',
            controller: '',
            className: '',
            scope: $scope
        });
    };

    // Update budget modal
    $scope.openUpdateModal = function (data) {
        resetPostingParams();
        $scope.selectedCellData = data;
        var shouldOpenUpdateModal = $scope.isYearlyView ? !$scope.isPastMonth(data.monthIndex) : !$scope.isPastDate(data.date);

        if (shouldOpenUpdateModal) {
            ngDialog.open({
                template: '/assets/partials/financials/budgets/rvUpdateBudgetModal.html',
                controller: '',
                className: '',
                scope: $scope
            });
        }
    };

    // While changing year
    $scope.onChangeYear = function () {
        shouldResetToYearlyView = true;
        filterMonthsAndYears();
        fetchAndProcessBudgetData();
    };

    // Check whethe marke segment selected
    $scope.isMarketView = function () {
        return $scope.budgetOption.value === MARKET_SEGMENTS;
    };

    $scope.switchBudgetType = function (selection) {
        if ($scope.isRoomRevenueSelected && !selection || !$scope.isRoomRevenueSelected && selection) {
            $scope.isRoomRevenueSelected = !$scope.isRoomRevenueSelected;
        }
    };

    // For one month filter and process each dates budget
    var processMonthData = function processMonthData(monthIndex) {
        $scope.monthGridData = [];
        $scope.dayGridData = [];

        _.each($scope.gridContentData, function (dataItem) {
            dataItem.dates = [];
            _.each($scope.monthOptions, function (month) {
                if (monthIndex === month.monthIndex) {
                    _.each(month.monthDays, function (monthDay) {

                        var matchedBudget = _.filter(dataItem.budgets, function (budget) {
                            return tzIndependentDate(budget.date).getTime() === tzIndependentDate(monthDay).getTime();
                        });

                        var leftColumnItem = _.find($scope.leftColumnData, function (item) {
                            return item.id === dataItem.id;
                        });

                        var budgetCellData = {
                            date: tzIndependentDate(monthDay),
                            rawDate: $filter('date')(monthDay, $rootScope.dateFormatForAPI),
                            isPastDate: $scope.isPastDate(tzIndependentDate(monthDay)),
                            itemId: leftColumnItem.id,
                            itemName: leftColumnItem.name,
                            isWeekEnd: isWeekendDay($scope.weekEndDays, tzIndependentDate(monthDay))
                        };

                        if (matchedBudget.length !== 0) {
                            budgetCellData = _extends({}, budgetCellData, {
                                budget: {
                                    revenue: parseFloat(matchedBudget[0].revenue).toFixed(2),
                                    room_nights: parseFloat(matchedBudget[0].room_nights).toFixed(2),
                                    budget_id: matchedBudget[0].id
                                },
                                isBudgetCreated: true
                            });
                        } else {
                            if ($scope.isMarketView()) {
                                budgetCellData = _extends({}, budgetCellData, {
                                    budget: {
                                        revenue: 0,
                                        room_nights: 0,
                                        market_segment_id: dataItem.id
                                    },
                                    isBudgetCreated: false
                                });
                            } else {
                                budgetCellData = _extends({}, budgetCellData, {
                                    budget: {
                                        revenue: 0,
                                        room_nights: 0,
                                        charge_code_id: dataItem.id
                                    },
                                    isBudgetCreated: false
                                });
                            }
                        }
                        dataItem.dates.push(budgetCellData);
                    });
                }
            });
        });
        // Data to show as grid
        _.each($scope.gridContentData, function (data) {
            $scope.monthGridData.push({
                id: data.id,
                months: data.months
            });
            $scope.dayGridData.push({
                id: data.id,
                dates: data.dates
            });
        });
        // Refresh scrollers after month data are extracted
        $timeout(function () {
            refreshGridScrollers();
        }, 100);
    };

    // On clicking on month on grid
    $scope.onSelectMonth = function (monthIndex) {
        $scope.isYearlyView = false;
        $scope.selectedMonth.month = monthIndex;

        _.each($scope.monthOptions, function (month) {
            if (month.monthIndex === monthIndex) {
                $scope.selectedMonth.startDate = month.monthDays[0];
                $scope.selectedMonth.monthDays = month.monthDays;

                $scope.selectedMonth.endDate = month.monthDays[month.monthDays.length - 1];
            }
        });
        $scope.totals.totalRevenue = $scope.totals.totalMonthlyRevenue[monthIndex + 1];
        $scope.totals.totalNight = $scope.totals.totalMonthlyNight[monthIndex + 1];
        processMonthData($scope.selectedMonth.month);
        // Refresh scrollers after month data are processed
        $timeout(function () {
            refreshGridScrollers();
        }, 100);
    };

    $scope.getDayName = function (date) {
        return daysInWeek[date.getDay()];
    };

    $scope.monthName = function (monthIndex) {
        return getMonthName(monthIndex);
    };

    $scope.backToYearlyView = function () {
        $scope.isYearlyView = true;
        $timeout(function () {
            refreshGridScrollers();
        }, 100);
    };

    // Calendar
    var datePicker;

    $scope.clickedOnDatePicker = function (datePickerFor) {
        $scope.datePickerFor = datePickerFor;
        datePicker = ngDialog.open({
            template: '/assets/partials/common/rvDatePicker.html',
            controller: 'RVBudgetDatePickerController',
            className: '',
            scope: $scope,
            closeByDocument: true
        });
    };

    // On selecting a date on calendar
    $scope.dateSelected = function (dateText) {
        if ($scope.datePickerFor === 'startDate') {
            $scope.selectedMonth.fromDate = tzIndependentDate(dateText);
        } else {
            $scope.selectedMonth.toDate = tzIndependentDate(dateText);
        }
        updateWeekDays($scope.selectedMonth.fromDate, $scope.selectedMonth.toDate);
    };

    $scope.closeModal = function () {
        ngDialog.close();
    };

    $scope.closeCalendar = function () {
        datePicker.close();
    };

    $scope.isPastMonth = function (monthIndex) {
        var dateToCheck = new Date($scope.budgetOption.selectedYear, monthIndex, 1),
            businessDate = new Date(businessYear, businessMonth, 1);

        return dateToCheck < businessDate;
    };

    $scope.isPastDate = function (date) {
        var businessDateWithoutTime = new Date(businessDate.getFullYear(), businessDate.getMonth(), businessDate.getDate()),
            dateWithoutTime = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        return dateWithoutTime <= businessDateWithoutTime;
    };

    $scope.isPastWeekday = function (weekDay) {
        var isPastWeekday = true;

        _.each($scope.selectedMonth.monthDays, function (monthDay) {
            if (!$scope.isPastDate(monthDay)) {
                if (weekDay.dayIndex === monthDay.getDay()) {
                    isPastWeekday = false;
                }
            }
        });
        return isPastWeekday;
    };

    var isPastYear = function isPastYear(year) {
        return year < businessYear;
    };

    var createBudget = function createBudget() {
        var selectedIds = [],
            selectedMonths = [],
            params;

        // To get all the selected market segments/charge codes
        _.each($scope.leftColumnData, function (data) {
            if (data.selected) {
                selectedIds.push(data.id.toString());
            }
        });
        // Params for POST budget
        params = {
            budget_for: $scope.budgetOption.value,
            market_segment_ids: selectedIds,
            revenue: $scope.roomBudget.revenue,
            room_nights: $scope.roomBudget.nights
        };

        if ($scope.isYearlyView) {
            _.each($scope.monthOptions, function (month) {
                if (month.selected && !$scope.isPastMonth(month.monthIndex)) {
                    var date = new Date($scope.budgetOption.selectedYear, month.monthIndex, 1);

                    selectedMonths.push($filter('date')(date, $rootScope.dateFormatForAPI));
                }
            });
            params['date_format'] = 'months';
            params['months'] = selectedMonths;
            shouldResetToYearlyView = true;
        } else {
            var weekDays = [];

            _.each($scope.weekDays, function (weekDay) {
                if (weekDay.selected) {
                    weekDays.push(weekDay.dayIndex);
                }
            });
            params = _extends({}, params, {
                date_format: 'range',
                weekdays: weekDays,
                from_date: $filter('date')(tzIndependentDate($scope.selectedMonth.fromDate), $rootScope.dateFormatForAPI),
                to_date: $filter('date')(tzIndependentDate($scope.selectedMonth.toDate), $rootScope.dateFormatForAPI)
            });
            shouldResetToYearlyView = false;
        }

        var successCallback = function successCallback() {
            selectedIds = [];
            resetPostingParams();
            fetchAndProcessBudgetData();
            if ($scope.shouldCloseModal) {
                $scope.closeModal();
            }
        },
            failureCallback = function failureCallback(error) {
            $scope.errorMessage = error;
        };

        $scope.invokeApi(RVBudgetsSrv.saveBudget, params, successCallback, failureCallback);
    };

    $scope.saveBudgetAndReset = function () {
        $scope.shouldCloseModal = false;
        createBudget();
    };

    $scope.saveBudgetAndCloseModal = function () {
        $scope.shouldCloseModal = true;
        createBudget();
    };

    $scope.onCSVUpload = function () {
        var params = {
            file: $scope.budgetCSV.base64Data,
            type: $scope.isYearlyView ? 'monthly' : 'daily'
        },
            successCallback = function successCallback(data) {
            if (data.status === 'failed') {
                $scope.importResult = {
                    icon: 'icon-popup-error',
                    title: 'Budget not uploaded',
                    status: 'failed',
                    errorMsg: data.error_message
                };
            } else if (data.status === 'success') {
                $scope.importResult = {
                    icon: 'icon-popup-success',
                    title: 'Upload completed',
                    status: 'success'
                };
            } else if (data.status === 'partially') {
                $scope.importResult = {
                    icon: 'icon-popup-alert',
                    title: 'Budget partially uploaded',
                    status: 'partial',
                    notice: data.error_message
                };
            }
            shouldResetToYearlyView = false;
            isBudgetUpload = true;
            fetchAndProcessBudgetData();
        },
            failureCallback = function failureCallback(data) {
            $scope.importResult = {
                icon: 'icon-popup-error',
                title: 'Budget not uploaded',
                status: 'failed',
                errorMsg: data.error_message
            };
            openImportCSVModal();
        };

        var fileElement = angular.element('#uploadBudget');

        // Remove CSV file
        angular.element(fileElement).val(null);
        $scope.budgetCSV = {
            base64Data: ''
        };

        $scope.invokeApi(RVBudgetsSrv.uploadBudgetCSV, params, successCallback, failureCallback);
    };

    var openImportCSVModal = function openImportCSVModal() {
        ngDialog.open({
            template: '/assets/partials/financials/budgets/rvImportCSVModal.html',
            controller: '',
            className: '',
            scope: $scope
        });
    };

    $scope.uploadCSV = function () {
        $timeout(function () {
            angular.element('#uploadBudget').trigger('click');
        }, 0, false);
    };

    var isRevenueOrNightsEntered = function isRevenueOrNightsEntered(roomRevenue, roomNights) {
        return $scope.isRoomRevenueSelected ? !_.isNull(roomRevenue) : !_.isNull(roomNights);
    };

    $scope.shouldDisableAddBudgetButton = function () {
        return $scope.isYearlyView ? isPastYear($scope.budgetOption.selectedYear) : $scope.isPastMonth($scope.selectedMonth.month);
    };

    // Check to enable/disable SAVE buttons
    $scope.disableSaveButtons = function () {
        var isAnyItemSelected = false,
            isAnyWeekOrMonthSelected = false;

        _.each($scope.leftColumnData, function (data) {
            if (data.selected) {
                isAnyItemSelected = true;
            }
        });
        if ($scope.isYearlyView) {
            _.each($scope.monthOptions, function (month) {
                if (!$scope.isPastMonth(month.monthIndex) && month.selected) {
                    isAnyWeekOrMonthSelected = true;
                }
            });
        } else {
            _.each($scope.weekDays, function (weekDay) {
                if (!$scope.isPastWeekday(weekDay) && weekDay.selected) {
                    isAnyWeekOrMonthSelected = true;
                }
            });
        }
        return !isAnyItemSelected || !isAnyWeekOrMonthSelected || !isRevenueOrNightsEntered($scope.roomBudget.revenue, $scope.roomBudget.nights);
    };

    // Check to enable/disable UPDATE buttons
    $scope.disableUpdateButtons = function () {
        return !isRevenueOrNightsEntered($scope.roomBudget.updateRevenue, $scope.roomBudget.updateNights);
    };

    // Budget UPDATE  
    $scope.updateBudget = function () {
        var successCallback = function successCallback() {
            resetPostingParams();
            fetchAndProcessBudgetData();
            $scope.closeModal();
        },
            failureCallback = function failureCallback(error) {
            $scope.errorMessage = error;
        },
            params = {
            budget_for: $scope.budgetOption.value,
            revenue: $scope.roomBudget.updateRevenue,
            room_nights: $scope.roomBudget.updateNights
        };

        if (!$scope.isYearlyView) {
            params['budget_id'] = $scope.selectedCellData.isBudgetCreated ? $scope.selectedCellData.budget.budget_id : '';
            params['date'] = $filter('date')($scope.selectedCellData.date, $rootScope.dateFormatForAPI);
            if ($scope.isMarketView()) {
                params['market_segment_id'] = $scope.selectedCellData.itemId;
            } else {
                params['charge_code_id'] = $scope.selectedCellData.itemId;
            }
            shouldResetToYearlyView = false;

            $scope.invokeApi(RVBudgetsSrv.updateBudget, params, successCallback, failureCallback);
        } else {
            var monthsList = [],
                itemList = [],
                monthDate = new Date($scope.budgetOption.selectedYear, $scope.selectedCellData.monthIndex, 1);

            monthsList.push($filter('date')(monthDate, $rootScope.dateFormatForAPI));
            params['months'] = angular.copy(monthsList);
            params['date_format'] = 'months';
            if ($scope.isMarketView()) {
                itemList.push($scope.selectedCellData.itemId);
                params['market_segment_ids'] = angular.copy(itemList);
            } else {
                itemList.push($scope.selectedCellData.itemId);
                params['charge_code_ids'] = angular.copy(itemList);
            }
            shouldResetToYearlyView = true;

            $scope.invokeApi(RVBudgetsSrv.saveBudget, params, successCallback, failureCallback);
        }
    };

    var updateWeekDays = function updateWeekDays(startDate, endDate) {
        startDate = tzIndependentDate(startDate);
        endDate = tzIndependentDate(endDate);

        // Number of days in b/w Start/End dates
        var noOfDays = (moment(endDate) - moment(startDate)) / 86400000,
            startDayIndex;

        if (noOfDays <= 6) {
            $scope.weekDaysCopy = [];
            startDayIndex = startDate.getDay();

            for (var index = 0; index <= noOfDays; index++) {
                if (startDayIndex < 7) {
                    $scope.weekDaysCopy.push({
                        dayIndex: startDayIndex,
                        dayName: daysInWeek[startDayIndex],
                        selected: true
                    });
                } else {
                    $scope.weekDaysCopy.push({
                        dayIndex: startDayIndex - 7,
                        dayName: daysInWeek[startDayIndex - 7],
                        selected: true
                    });
                }
                startDayIndex++;
            }
            $scope.weekDays = angular.copy($scope.weekDaysCopy);
        } else {
            $scope.weekDays = angular.copy($scope.defaultWeekDays);
        }
    };

    var resetPostingParams = function resetPostingParams() {
        $scope.roomBudget = {
            revenue: null,
            nights: null,
            updateRevenue: null,
            updateNights: null
        };
        $scope.roomNights = 0;
        $scope.isRoomRevenueSelected = true;
        _.each($scope.leftColumnData, function (item) {
            item.selected = false;
        });
    };

    $scope.getFontClassForValues = function (value, isBudgetValue) {
        var realDigitsCount = parseInt(value, 10).toString().length,
            className;

        if (isBudgetValue) {
            className = realDigitsCount <= 6 ? '' : realDigitsCount === 7 ? 'small-text' : 'tiny-text';
        } else {
            className = realDigitsCount <= 3 ? '' : realDigitsCount === 4 ? 'small-text' : 'tiny-text';
        }
        return className;
    };

    /*
    * Initialization
    */
    var init = function init() {
        var successCallBackFetchTypesData = function successCallBackFetchTypesData(data) {
            $scope.marketSegments = data.market_segment;
            $scope.chargeCodes = data.charge_codes;
            $scope.leftColumnData = data.market_segment;
            $scope.weekEndDays = data.weekend_days;

            fetchAndProcessBudgetData();
        };

        $scope.invokeApi(RVBudgetsSrv.getBudgetAssociatedTypes, {}, successCallBackFetchTypesData);
    };

    init();
}]);