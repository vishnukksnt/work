'use strict';

sntRover.controller('RVAllowanceForecastReportByAllowanceCtrl', ['$scope', 'RVReportMsgsConst', '$timeout', '$interval', '$stateParams', 'RVreportsSrv', function ($scope, reportMsgs, $timeout, $interval, $stateParams, reportsSrv) {

	BaseCtrl.call(this, $scope);

	var detailsCtrlScope = $scope.$parent,
	    mainCtrlScope = detailsCtrlScope.$parent,
	    results = {};

	var SCROLL_NAME = 'allowance-forecast-report-scroll',
	    timer;

	var refreshScroll = function refreshScroll(scrollUp) {
		$scope.refreshScroller(SCROLL_NAME);
		if (!!scrollUp && $scope.$parent.myScroll.hasOwnProperty(SCROLL_NAME)) {
			$scope.$parent.myScroll[SCROLL_NAME].scrollTo(0, 0, 100);
		}
	};

	var setScroller = function setScroller() {
		$scope.setScroller(SCROLL_NAME, {
			probeType: 3,
			tap: true,
			preventDefault: false,
			scrollX: false,
			scrollY: true
		});
	};

	var clearTimer = function clearTimer() {
		if (!!timer) {
			$interval.cancel(timer);
			timer = undefined;
		}
	};

	var setScrollListner = function setScrollListner() {
		if ($scope.$parent.myScroll.hasOwnProperty(SCROLL_NAME)) {
			refreshScroll();

			if (!timer) {
				timer = $interval(refreshScroll, 1000);
			}

			$scope.$parent.myScroll[SCROLL_NAME].on('scroll', function () {
				clearTimer();
			});
		} else {
			$timeout(setScrollListner, 1000);
		}
	};

	$scope.sortedResults = {};
	$scope.sortedTotals = {};
	$scope.totalsPerDay = {};
	$scope.sortedTotalsArray = [];

	$scope.isSortByAllowance = function () {
		var report = reportsSrv.getSelectedReport();

		if (report && report.filters && report.filters.appliedFilter.sortBy) {
			return report.filters.appliedFilter.sortBy === 'Allowance';
		} else if ($stateParams.report && $stateParams.report.report && $stateParams.report.report.sortByOptions) {
			var sortOptions = $stateParams.report.report.sortByOptions;

			return sortOptions.findIndex(function (o) {
				return o.value === 'ALLOWANCE' && o.sortDir === true;
			}) !== -1;
		} else {
			return false;
		}
	};
	$scope.currentSort = $scope.isSortByAllowance() ? 'Allowance' : 'Arrival';

	$scope.fieldSetup = {
		'Arrival': {
			sort: 'asc',
			mapping: 'arrival_date'
		},
		'Departure': {
			sort: false,
			mapping: 'dep_date'
		},
		'Room Type': {
			sort: false,
			mapping: 'room_type'
		},
		'Room': {
			sort: false,
			mapping: 'room_no'
		},
		'Rate Code': {
			sort: false,
			mapping: 'rate_code'
		},
		'Allowance': {
			sort: 'asc',
			mapping: 'allowance'
		},
		'Guest': {
			sort: false,
			mapping: 'guest_name'
		}
	};

	$scope.toggleSort = function (header) {
		if ($scope.fieldSetup[header].sort) {
			if ($scope.currentSort !== header) {
				$scope.currentSort = header;
				$scope.fieldSetup[header].sort = 'asc';
			} else {
				$scope.fieldSetup[header].sort = $scope.fieldSetup[header].sort === 'asc' ? 'desc' : 'asc';
			}
		}

		$scope.reSort();
	};

	$scope.reSort = function () {
		_.each($scope.sortedResults, function (result, key) {
			$scope.sortedResults[key] = baseOrderBy(result, [$scope.fieldSetup[$scope.currentSort].mapping, 'guest_name'], [$scope.fieldSetup[$scope.currentSort].sort, 'asc']);
		});
	};

	var setup = function setup() {
		results = mainCtrlScope.results;

		$scope.sortedResults = angular.copy(results);
		$scope.sortedTotals = {};
		_.each(angular.copy(results.total_allowance), function (v, k) {
			delete v.total;
			$scope.sortedTotals[k] = v;
		});
		delete $scope.sortedResults.total_allowance;
		_.each($scope.sortedTotals, function (val, key) {
			$scope.totalsPerDay[key] = Object.values(val).reduce(function (prev, cur) {
				return prev + cur;
			});
		});
		angular.forEach($scope.sortedTotals, function (allowances, date) {
			var allowanceData = [];

			angular.forEach(allowances, function (count, allowance) {
				allowanceData.push({
					count: count,
					name: allowance
				});
			});
			$scope.sortedTotalsArray.push({
				date: date,
				allowances: allowanceData
			});
		});
		$scope.hasResults = Object.keys($scope.sortedResults).length;
	};

	var init = function init() {
		setup();
		setScroller();
		$timeout(function () {
			refreshScroll('scrollUp');
		});
	};

	init();

	var reInit = function reInit() {
		setup();
		$timeout(function () {
			refreshScroll('scrollUp');
		});
	};

	// re-render must be initiated before for taks like printing.
	// thats why timeout time is set to min value 50ms
	var reportSubmited = $scope.$on(reportMsgs['REPORT_SUBMITED'], reInit);
	var reportPrinting = $scope.$on(reportMsgs['REPORT_PRINTING'], reInit);
	var reportUpdated = $scope.$on(reportMsgs['REPORT_UPDATED'], reInit);
	var reportPageChanged = $scope.$on(reportMsgs['REPORT_PAGE_CHANGED'], reInit);
	var allRendered = $scope.$on('ALL_RENDERED', setScrollListner);

	$scope.$on('$destroy', reportSubmited);
	$scope.$on('$destroy', reportUpdated);
	$scope.$on('$destroy', reportPrinting);
	$scope.$on('$destroy', reportPageChanged);

	$scope.$on('$destroy', allRendered);
	$scope.$on('$destroy', clearTimer);

	mainCtrlScope.printOptions.showModal = function () {
		$scope.continueWithPrint();
	};

	$scope.continueWithPrint = function () {
		$scope.$emit(reportMsgs['REPORT_PRE_PRINT_DONE']);
	};
}]);