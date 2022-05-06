'use strict';

sntRover.controller('rvContractedNightsCtrl', ['$rootScope', '$scope', 'dateFilter', 'ngDialog', function ($rootScope, $scope, dateFilter, ngDialog) {
	$scope.nightsData = {};
	$scope.nightsData.occupancy = [];
	$scope.nightsData.allNights = "";
	var myDate = tzIndependentDate($rootScope.businessDate),
	    beginDate,
	    endDate,
	    currentOccupancy;

	if ($scope.contractData.mode === 'ADD') {
		myDate = $scope.addData.startDate ? tzIndependentDate($scope.addData.startDate) : myDate;
		beginDate = dateFilter(myDate, 'yyyy-MM-dd');
		endDate = $scope.addData.endDate || dateFilter(myDate.setDate(myDate.getDate() + 1), 'yyyy-MM-dd');
		currentOccupancy = $scope.addData.occupancy;
	} else if ($scope.contractData.mode === 'EDIT') {
		myDate = $scope.contractData.editData && $scope.contractData.editData.begin_date ? tzIndependentDate($scope.contractData.editData.begin_date) : myDate;
		beginDate = dateFilter(myDate, 'yyyy-MM-dd');
		endDate = $scope.contractData.editData.end_date || dateFilter(myDate.setDate(myDate.getDate() + 1), 'yyyy-MM-dd');
		currentOccupancy = $scope.contractData.editData.occupancy;
	}
	var firstDate = tzIndependentDate(beginDate),
	    lastDate = tzIndependentDate(endDate),
	    monthArray = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
	    newOccupancy = [],
	    startPoint = firstDate.getFullYear() * 12 + firstDate.getMonth(),
	    endPoint = lastDate.getFullYear() * 12 + lastDate.getMonth(),
	    myPoint = startPoint;

	while (myPoint <= endPoint) {
		var year = Math.floor(myPoint / 12),
		    month = myPoint - year * 12,
		    obj = {
			"contracted_occupancy": 0,
			"year": year.toString(),
			"actual_occupancy": 0,
			"month": monthArray[month]
		};

		newOccupancy.push(obj);
		myPoint += 1;
	}

	// Taking deep copy of current occupancy data
	angular.forEach(currentOccupancy, function (item) {
		angular.forEach(newOccupancy, function (item2) {
			if (item2.year === item.year && item2.month === item.month) {
				item2.contracted_occupancy = item.contracted_occupancy;
				item2.actual_occupancy = item.actual_occupancy;
			}
		});
	});
	$scope.nightsData.occupancy = newOccupancy;

	/**
  * Calculate total contracted nights
  */
	var getTotalNights = function getTotalNights() {
		var totalNights = 0;

		angular.forEach($scope.nightsData.occupancy, function (item) {
			totalNights += item.contracted_occupancy;
		});

		return totalNights;
	};

	/*
  * To save contract Nights.
  */
	$scope.saveContractedNights = function () {
		if ($scope.contractData.mode === 'ADD') {
			$scope.addData.occupancy = $scope.nightsData.occupancy;
			$scope.addData.contractedNights = getTotalNights();
		} else if ($scope.contractData.mode === 'EDIT') {
			$scope.contractData.editData.occupancy = $scope.nightsData.occupancy;
			$scope.contractData.editData.total_contracted_nights = getTotalNights();
		}
		ngDialog.close();
	};

	$scope.clickedCancel = function () {
		ngDialog.close();
	};
	/*
  * To update all nights contract nights.
  */
	$scope.updateAllNights = function () {
		angular.forEach($scope.nightsData.occupancy, function (item) {
			item.contracted_occupancy = $scope.nightsData.allNights;
		});
	};

	var init = function init() {
		$scope.setScroller('contractedNightsScroller');
	};

	init();
}]);