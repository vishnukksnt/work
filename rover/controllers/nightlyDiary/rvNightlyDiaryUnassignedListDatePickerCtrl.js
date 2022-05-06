'use strict';

sntRover.controller('RVNightlyDiaryUnassignedListDatePickerController', ['$scope', '$rootScope', 'ngDialog', function ($scope, $rootScope, ngDialog) {

	var minDateSelected = $scope.diaryData.fromDate < $rootScope.businessDate ? $rootScope.businessDate : $scope.diaryData.fromDate,
	    maxDateSelected = $scope.diaryData.toDate;

	$scope.date = $scope.diaryData.arrivalDate;

	$scope.setUpData = function () {
		$scope.dateOptions = {
			changeYear: true,
			changeMonth: true,
			minDate: tzIndependentDate(minDateSelected),
			maxDate: tzIndependentDate(maxDateSelected),
			onSelect: function onSelect() {
				$scope.diaryData.arrivalDate = $scope.date;
				$scope.$emit('UNASSIGNED_LIST_DATE_CHANGED');
				ngDialog.close();
			}
		};
	};

	$scope.setUpData();
}]);