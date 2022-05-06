'use strict';

sntRover.controller('rvRMHierarchyRestrictionsDatePickerCtrl', ['$scope', function ($scope) {

	var minDateSelected = moment($scope.restrictionObj.cellDate).add(1, 'days'),
	    maxDateSelected = moment($scope.restrictionObj.cellDate).add(1, 'years');

	$scope.date = tzIndependentDate($scope.restrictionObj.cellDate);
	$scope.setUpData = function () {
		$scope.dateOptions = {
			changeYear: true,
			changeMonth: true,
			minDate: tzIndependentDate(minDateSelected),
			maxDate: tzIndependentDate(maxDateSelected),
			yearRange: "0:+1",
			onSelect: function onSelect() {
				$scope.restrictionObj.untilDate = $scope.date;
				$scope.$emit('UNTIL_DATE_CHANGED', $scope.date);
			}
		};
	};

	$scope.setUpData();
}]);