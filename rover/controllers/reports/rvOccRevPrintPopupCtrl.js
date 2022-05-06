'use strict';

sntRover.controller('RVOccRevPrintPopupCtrl', ['$rootScope', '$scope', '$filter', '$timeout', 'RVReportUtilsFac', function ($rootScope, $scope, $filter, $timeout, reportUtils) {
	var chosenReport = $scope.$parent.chosenReport;

	$scope.occupancyMaxDate = 0;

	// fromdate <- 5 days -> untildate, so including fromdate, diff should be 4 (5 - 1)
	if (chosenReport.chosenVariance && chosenReport.chosenLastYear) {
		$scope.occupancyMaxDate = 4;
	}

	// fromdate <- 10 days -> untildate, so including fromdate, diff should be 9 (10 - 1)
	else if (chosenReport.chosenVariance || chosenReport.chosenLastYear) {
			$scope.occupancyMaxDate = 9;
		}

		// fromdate <- 15 days -> untildate, so including fromdate, diff should be 14 (15 - 1)
		else {
				$scope.occupancyMaxDate = 14;
			}

	// common date picker options object
	var datePickerCommon = {
		dateFormat: $rootScope.jqDateFormat,
		numberOfMonths: 1,
		changeYear: true,
		changeMonth: true,
		beforeShow: function beforeShow(input, inst) {
			$('#ui-datepicker-div');
			$('<div id="ui-datepicker-overlay">').insertAfter('#ui-datepicker-div');
		},
		onClose: function onClose(value) {
			$('#ui-datepicker-div');
			$('#ui-datepicker-overlay').remove();
			$scope.showRemoveDateBtn();
		}
	};

	$scope.fromDateOptions = angular.extend({}, datePickerCommon);
	$scope.untilDateOptions = angular.extend({}, datePickerCommon);

	// initialize until date base on the from date
	// CICO-33536 - fix for date format
	var fromDate = $filter('date')(chosenReport.fromDate, $rootScope.dateFormat);

	chosenReport.untilDate = $_onSelect(fromDate, $scope.occupancyMaxDate);

	// set min and max limits for until date
	$scope.untilDateOptions.minDate = chosenReport.fromDate;
	$scope.untilDateOptions.maxDate = chosenReport.untilDate;

	// re-adjust min and max limits for until date
	// when the from date is changed
	$scope.adjustUntilDate = function () {
		var fromDate = $filter('date')(chosenReport.fromDate, $rootScope.dateFormat);

		$scope.untilDateOptions.minDate = chosenReport.fromDate;
		$scope.untilDateOptions.maxDate = $_onSelect(fromDate, $scope.occupancyMaxDate);
	};

	function $_onSelect(value, dayOffset, effectObj) {
		var format = $rootScope.dateFormat.toUpperCase(),
		    day,
		    month,
		    year,
		    date;

		if (format === 'MM-DD-YYYY' || format === 'MM/DD/YYYY') {
			day = parseInt(value.substring(3, 5));
			month = parseInt(value.substring(0, 2));
		} else if (format === 'DD-MM-YYYY' || format === 'DD/MM/YYYY') {
			day = parseInt(value.substring(0, 2));
			month = parseInt(value.substring(3, 5));
		}

		year = parseInt(value.substring(6, 10));
		date = new Date(year, month - 1, day + dayOffset);

		if (effectObj) {
			effectObj.maxDate = date;
		} else {
			return date;
		}
	}
}]);