'use strict';

sntRover.controller('rvOccupancyRevenueReportCtrl', ['$scope', '$rootScope', '$filter', 'RVreportsSrv', '$timeout', 'dateFilter', 'ngDialog', 'RVReportMsgsConst', function ($scope, $rootScope, $filter, RVreportsSrv, $timeout, dateFilter, ngDialog, reportMsgs) {
	$scope.occupanyRevenueState = {
		name: "Occupancy & Revenue Summary"
	};

	$scope.stateStore = {
		occupancy: [{
			key: "available_rooms",
			name: "Available Rooms"
		}, {
			key: "out_of_order_rooms",
			name: "Out of Order Rooms"
		}, {
			key: "occupied_rooms",
			name: "Occupied Rooms"
		}, {
			key: "complimentary_rooms",
			name: "Complimentary Rooms"
		}, {
			key: "occupied_minus_comp",
			name: "Occupied Rooms (Excl. Comp.)"
		}],
		dayUseOccupancy: [{
			key: 'occupied_day_use_rooms',
			name: 'Occupied Day Use Reservations'
		}, {
			key: 'complimentary_day_use_rooms',
			name: 'Day Use Complimentary Rooms'
		}, {
			key: 'occupied_day_use_minus_comp',
			name: 'Occupied Day Use Rooms (Excl. Comp.)'
		}],
		occupancyTotals: [{
			key: "total_occupancy_in_percentage",
			name: "Total Occ."
		}, {
			key: "total_occupancy_minus_comp_in_percentage",
			name: "Total Occ. (Excl. Comp.)"
		}],
		dayUseOccTotals: [{
			key: 'total_day_use_occupancy_in_percentage',
			name: 'Total Day Use Occ.'
		}, {
			key: 'total_day_use_occupancy_minus_comp_in_percentage',
			name: 'Total Day Use Occ. (Excl. Comp.)'
		}],
		revenues: [{
			key: "rev_par",
			name: "RevPar"
		}, {
			key: "adr_inclusive_complimentary_rooms",
			name: "ADR (Incl. Comp.)"
		}, {
			key: "adr_exclusive_complimentary_rooms",
			name: "ADR (Excl. Comp.)"
		}],
		dayUseRevenue: [{
			key: 'day_use_adr_inclusive_complimentary_rooms',
			name: 'Day Use ADR (Incl. Comp.)'
		}, {
			key: 'day_use_adr_exclusive_complimentary_rooms',
			name: 'Day Use ADR (Excl. Comp.)'
		}],
		revenueTotals: [{
			key: "total_revenue",
			name: "Total Revenue"
		}]
	};

	$scope.setScroller('leftPanelScroll', {
		preventDefault: false,
		probeType: 3
	});

	$scope.setScroller('rightPanelScroll', {
		preventDefault: false,
		probeType: 3,
		scrollX: true
	});

	// keep a quick ref to flags way up in the sky
	$scope.chosenLastYear = $scope.$parent.chosenReport.chosenOptions.include_last_year || $scope.$parent.chosenReport.usedFilters && $scope.$parent.chosenReport.usedFilters.include_last_year;
	$scope.chosenVariance = $scope.$parent.chosenReport.chosenOptions.include_variance || $scope.$parent.chosenReport.usedFilters && $scope.$parent.chosenReport.usedFilters.include_variance;

	$scope.selectedDays = [];

	$scope.absoulte = Math.abs;

	$timeout(function () {
		$scope.$parent.myScroll['leftPanelScroll'].on('scroll', function () {
			var yPos = this.y;

			$scope.$parent.myScroll['rightPanelScroll'].scrollTo(0, yPos);
		});
		$scope.$parent.myScroll['rightPanelScroll'].on('scroll', function () {
			var yPos = this.y;

			$scope.$parent.myScroll['leftPanelScroll'].scrollTo(0, yPos);
		});
	}, 1000);

	$scope.getNumber = function () {
		return new Array((1 + !!$scope.chosenLastYear + !!$scope.chosenVariance) * $scope.selectedDays.length);
	};

	$scope.getHeader = function (indexValue) {
		if (!!$scope.chosenLastYear && !!$scope.chosenVariance) {
			return indexValue % 3 === 0 ? "This Year" : indexValue % 3 === 2 ? "Variance" : "Last Year";
		} else if (!!$scope.chosenLastYear || !!$scope.chosenVariance) {
			return indexValue % 2 === 0 ? "This Year" : !!$scope.chosenVariance ? "Variance" : "Last Year";
		} else {
			return "This Year";
		}
	};

	$scope.getValue = function (key, columnIndex) {
		var candidate = $scope.results[key][$scope.selectedDays[parseInt(columnIndex / (1 + !!$scope.chosenLastYear + !!$scope.chosenVariance))]];

		if (candidate) {
			if (!!$scope.chosenLastYear && !!$scope.chosenVariance) {
				return columnIndex % 3 === 0 ? candidate.this_year : columnIndex % 3 === 2 ? candidate.this_year - candidate.last_year : candidate.last_year;
			} else if (!!$scope.chosenLastYear || !!$scope.chosenVariance) {
				return columnIndex % 2 === 0 ? candidate.this_year : !!$scope.chosenVariance ? candidate.this_year - candidate.last_year : candidate.last_year;
			} else {
				return candidate.this_year;
			}
		} else {
			return -1;
		}
	};

	$scope.getNigtlyValue = function (key, columnIndex) {
		var candidate = $scope.results.nightly[key][$scope.selectedDays[parseInt(columnIndex / (1 + !!$scope.chosenLastYear + !!$scope.chosenVariance))]];

		if (candidate) {
			if (!!$scope.chosenLastYear && !!$scope.chosenVariance) {
				return columnIndex % 3 === 0 ? candidate.this_year : columnIndex % 3 === 2 ? candidate.this_year - candidate.last_year : candidate.last_year;
			} else if (!!$scope.chosenLastYear || !!$scope.chosenVariance) {
				return columnIndex % 2 === 0 ? candidate.this_year : !!$scope.chosenVariance ? candidate.this_year - candidate.last_year : candidate.last_year;
			} else {
				return candidate.this_year;
			}
		} else {
			return -1;
		}
	};

	$scope.getClass = function (columnIndex) {
		if (!!$scope.chosenLastYear && !!$scope.chosenVariance) {
			return columnIndex % 3 === 0 ? "" : columnIndex % 3 === 2 ? "day-end" : "last-year";
		} else if (!!$scope.chosenLastYear || !!$scope.chosenVariance) {
			return columnIndex % 2 === 0 ? "" : !!$scope.chosenVariance ? "day-end" : "last-year day-end";
		} else {
			return "day-end";
		}
	};

	$scope.getChargeCodeValue = function (chargeGroupIndex, columnIndex) {
		var candidate = $scope.results.charge_groups[chargeGroupIndex][$scope.selectedDays[parseInt(columnIndex / (1 + !!$scope.chosenLastYear + !!$scope.chosenVariance))]];

		if (candidate) {
			if (!!$scope.chosenLastYear && !!$scope.chosenVariance) {
				return columnIndex % 3 === 0 ? candidate.this_year : columnIndex % 3 === 2 ? candidate.this_year - candidate.last_year : candidate.last_year;
			} else if (!!$scope.chosenLastYear || !!$scope.chosenVariance) {
				return columnIndex % 2 === 0 ? candidate.this_year : !!$scope.chosenVariance ? candidate.this_year - candidate.last_year : candidate.last_year;
			} else {
				return candidate.this_year;
			}
		} else {
			return '';
		}
	};

	/*
 *  
 *  @param {number}  [chargeGroupIndex - index of chargeGroup]
 *  @param {number}  [columnIndex - index corresponding to date]
 *  @return {number} [revenue for the chargeCode corresponding to the date]
 */
	$scope.getChargeCodeDayUseValue = function (chargeGroupIndex, columnIndex) {
		var candidate = $scope.results.day_use_charge_groups[chargeGroupIndex][$scope.selectedDays[parseInt(columnIndex / (1 + !!$scope.chosenLastYear + !!$scope.chosenVariance))]],
		    returnVal = '';

		if (candidate) {
			if (!!$scope.chosenLastYear && !!$scope.chosenVariance) {
				returnVal = columnIndex % 3 === 0 ? candidate.this_year : columnIndex % 3 === 2 ? candidate.this_year - candidate.last_year : candidate.last_year;
			} else if (!!$scope.chosenLastYear || !!$scope.chosenVariance) {
				returnVal = columnIndex % 2 === 0 ? candidate.this_year : !!$scope.chosenVariance ? candidate.this_year - candidate.last_year : candidate.last_year;
			} else {
				returnVal = candidate.this_year;
			}
		}
		return returnVal;
	};

	$scope.getMarketOccupancyValue = function (marketIndex, columnIndex) {
		var candidate = $scope.results.market_room_number[marketIndex][$scope.selectedDays[parseInt(columnIndex / (1 + !!$scope.chosenLastYear + !!$scope.chosenVariance))]];

		if (candidate) {
			if (!!$scope.chosenLastYear && !!$scope.chosenVariance) {
				return columnIndex % 3 === 0 ? candidate.this_year : columnIndex % 3 === 2 ? candidate.this_year - candidate.last_year : candidate.last_year;
			} else if (!!$scope.chosenLastYear || !!$scope.chosenVariance) {
				return columnIndex % 2 === 0 ? candidate.this_year : !!$scope.chosenVariance ? candidate.this_year - candidate.last_year : candidate.last_year;
			} else {
				return candidate.this_year;
			}
		} else {
			return -1;
		}
	};

	$scope.getMarketRevenueValue = function (marketIndex, columnIndex) {
		var candidate = $scope.results.market_revenue[marketIndex][$scope.selectedDays[parseInt(columnIndex / (1 + !!$scope.chosenLastYear + !!$scope.chosenVariance))]];

		if (candidate) {
			if (!!$scope.chosenLastYear && !!$scope.chosenVariance) {
				return columnIndex % 3 === 0 ? candidate.this_year : columnIndex % 3 === 2 ? candidate.this_year - candidate.last_year : candidate.last_year;
			} else if (!!$scope.chosenLastYear || !!$scope.chosenVariance) {
				return columnIndex % 2 === 0 ? candidate.this_year : !!$scope.chosenVariance ? candidate.this_year - candidate.last_year : candidate.last_year;
			} else {
				return candidate.this_year;
			}
		} else {
			return '';
		}
	};

	/*
 *  
 *  @param {number}  [marketIndex - index of market]
 *  @param {number}  [columnIndex - index corresponding to date]
 *  @return {number} [revenue for the market corresponding to the date]
 */
	$scope.getDayUseMarketRevenueValue = function (marketIndex, columnIndex) {
		var candidate = $scope.results.day_use_market_revenue[marketIndex][$scope.selectedDays[parseInt(columnIndex / (1 + !!$scope.chosenLastYear + !!$scope.chosenVariance))]],
		    returnVal = '';

		if (candidate) {
			if (!!$scope.chosenLastYear && !!$scope.chosenVariance) {
				returnVal = columnIndex % 3 === 0 ? candidate.this_year : columnIndex % 3 === 2 ? candidate.this_year - candidate.last_year : candidate.last_year;
			} else if (!!$scope.chosenLastYear || !!$scope.chosenVariance) {
				returnVal = columnIndex % 2 === 0 ? candidate.this_year : !!$scope.chosenVariance ? candidate.this_year - candidate.last_year : candidate.last_year;
			} else {
				returnVal = candidate.this_year;
			}
		}
		return returnVal;
	};

	function refreshScrollers() {
		$scope.refreshScroller('rightPanelScroll');
		$scope.refreshScroller('leftPanelScroll');
	}

	// Add selected attribute to those markets which were chosen while running the report
	var tagSelectedMarkets = function tagSelectedMarkets(selectedMarketIds) {
		if (!selectedMarketIds) {
			return;
		}
		_.each($scope.markets.data, function (market) {
			var isSelected = _.find(selectedMarketIds, { value: market.value });

			if (isSelected) {
				market.selected = true;
			}
		});
	};

	function init() {

		// dont init if there is an API error
		if ($scope.$parent.errorMessage.length) {
			return;
		}

		var chosenReport = RVreportsSrv.getChoosenReport();

		var ms = new tzIndependentDate(chosenReport.fromDate) * 1,
		    last = new tzIndependentDate(chosenReport.untilDate) * 1,
		    step = 24 * 3600 * 1000;

		$scope.marketExists = false;
		// since we moved these from main controller
		// CICO-38515 - Copied the market list which is already set
		$scope.markets = JSON.parse(JSON.stringify(chosenReport.hasMarketsList));

		$scope.isUndefinedMarketSelected = false;

		// CICO-54574
		if ($rootScope.isBackgroundReportsEnabled) {
			tagSelectedMarkets(chosenReport.appliedFilter.market_ids);
		}

		angular.forEach($scope.markets.data, function (marketValue, index) {
			if (marketValue.hasOwnProperty("selected") && marketValue.selected) {
				$scope.marketExists = true;
				return true;
			}
		});

		// CICO-38515 - Removed the last item in the list "UNDEFINED" which is "UNASSIGNED" here
		// Here the api provides the data for the "UNASSIGNED" ones
		_.find($scope.markets.data, { name: 'UNDEFINED' }).name = "Unassigned";

		// deep check if we have these flags choosen by the user
		var hasIncludeLastYear = _.find(chosenReport.hasGeneralOptions.data, { paramKey: 'include_last_year' });

		$scope.chosenLastYear = !!hasIncludeLastYear ? hasIncludeLastYear.selected : false;
		$scope.chosenLastYear = $scope.chosenLastYear || $scope.$parent.chosenReport.usedFilters && $scope.$parent.chosenReport.usedFilters.include_last_year;

		var hasIncludeVariance = _.find(chosenReport.hasGeneralOptions.data, { paramKey: 'include_variance' });

		$scope.chosenVariance = !!hasIncludeVariance ? hasIncludeVariance.selected : false;
		$scope.chosenVariance = $scope.chosenVariance || $scope.$parent.chosenReport.usedFilters && $scope.$parent.chosenReport.usedFilters.include_variance;

		$scope.showDayUseComponent = chosenReport.usedFilters ? chosenReport.usedFilters.include_day_use : chosenReport.include_day_use;

		$scope.selectedDays = [];
		for (; ms <= last; ms += step) {
			$scope.selectedDays.push(dateFilter(new tzIndependentDate(ms), 'yyyy-MM-dd'));
		}

		$timeout(function () {
			refreshScrollers();
		}, 400);
	}

	init();

	// re-render must be initiated before for taks like printing.
	// thats why timeout time is set to min value 50ms
	var reportSubmited = $scope.$on(reportMsgs['REPORT_SUBMITED'], init);
	var reportPrinting = $scope.$on(reportMsgs['REPORT_PRINTING'], init);
	var reportUpdated = $scope.$on(reportMsgs['REPORT_UPDATED'], init);
	var reportPageChanged = $scope.$on(reportMsgs['REPORT_PAGE_CHANGED'], init);
	var reportFilterChanged = $scope.$on(reportMsgs['REPORT_FILTER_CHANGED'], function () {
		$timeout(function () {
			refreshScrollers();
		}, 400);
	});

	$scope.$on('$destroy', reportSubmited);
	$scope.$on('$destroy', reportUpdated);
	$scope.$on('$destroy', reportPrinting);
	$scope.$on('$destroy', reportPageChanged);
	$scope.$on('$destroy', reportFilterChanged);

	var detailsCtrlScope = $scope.$parent,
	    mainCtrlScope = detailsCtrlScope.$parent,
	    chosenReport = detailsCtrlScope.chosenReport;

	var checkDateGap = function checkDateGap() {
		var allowedDateRange = 0,
		    chosenDateRange,
		    chosenVariance,
		    chosenLastYear;

		// get date range
		// READ MORE: http://stackoverflow.com/questions/3224834/get-difference-between-2-dates-in-javascript#comment-3328094
		chosenDateRange = chosenReport.untilDate.getTime() - chosenReport.fromDate.getTime();
		chosenDateRange = chosenDateRange / (1000 * 60 * 60 * 24) | 0;

		// find out the user selection choices
		chosenVariance = chosenReport.chosenOptions['include_variance'] ? true : false;
		chosenLastYear = chosenReport.chosenOptions['include_last_year'] ? true : false;

		// fromdate <- 5 days -> untildate
		// diff should be 4 (5 - 1), including fromdate
		if (chosenVariance && chosenLastYear) {
			allowedDateRange = 4;
		}

		// fromdate <- 10 days -> untildate
		// diff should be 9 (10 - 1), including fromdate
		else if (chosenVariance || chosenLastYear) {
				allowedDateRange = 9;
			}

			// fromdate <- 15 days -> untildate,
			// diff should be 14 (15 - 1), including fromdate
			else {
					allowedDateRange = 14;
				}

		// if the current chosen dates are within
		// the allowedDateRange, dont show pop
		// go straight to printing
		// (allowedDateRange + 1) -> since we reduced it above
		return chosenDateRange > allowedDateRange ? true : false;
	};

	mainCtrlScope.printOptions.showModal = function () {

		// make a copy of the from and until dates
		chosenReport.fromDateCopy = angular.copy(chosenReport.fromDate);
		chosenReport.untilDateCopy = angular.copy(chosenReport.untilDate);

		// show popup
		if (checkDateGap()) {
			ngDialog.open({
				controller: 'RVOccRevPrintPopupCtrl',
				template: '/assets/partials/reports/occupancyRevenueReport/rvOccRevPrintPopup.html',
				className: 'ngdialog-theme-default',
				closeByDocument: true,
				scope: $scope,
				data: []
			});
		} else {
			$scope.$emit(reportMsgs['REPORT_PRE_PRINT_DONE']);
		}
	};

	mainCtrlScope.printOptions.afterPrint = function () {
		chosenReport.fromDate = angular.copy(chosenReport.fromDateCopy);
		chosenReport.untilDate = angular.copy(chosenReport.untilDateCopy);

		$timeout(function () {
			chosenReport.fromDateCopy = undefined;
			chosenReport.untilDateCopy = undefined;
		}, 0);
	};

	// restore the old dates and close
	$scope.closeDialog = function () {
		mainCtrlScope.printOptions.afterPrint();
		ngDialog.close();
	};

	$scope.continueWithPrint = function () {
		ngDialog.close();
		$scope.$emit(reportMsgs['REPORT_PRE_PRINT_DONE']);
	};
}]);