'use strict';

sntRover.controller('RVNightlyDiaryTopFilterDatePickerController', ['$scope', '$rootScope', 'ngDialog', function ($scope, $rootScope, ngDialog) {

	var minDateSelected = '',
	    maxDateSelected = '',
	    MAX_NIGHTS_TO_ALLOW_BOOK = 92;

	if ($scope.clickedFrom === 'MAIN_FILTER') {
		$scope.date = $scope.diaryData.fromDate;
	} else if ($scope.clickedFrom === 'BOOK_FILTER_ARRIVAL') {
		$scope.date = $scope.diaryData.bookRoomViewFilter.fromDate;
		minDateSelected = tzIndependentDate($scope.diaryData.fromDate) > tzIndependentDate($rootScope.businessDate) ? tzIndependentDate($scope.diaryData.fromDate) : tzIndependentDate($rootScope.businessDate);
		maxDateSelected = tzIndependentDate($scope.diaryData.toDate);
	} else if ($scope.clickedFrom === 'BOOK_FILTER_DEPARTURE') {
		$scope.date = $scope.diaryData.bookRoomViewFilter.toDate;
		minDateSelected = $scope.diaryData.bookRoomViewFilter.fromDate;
		maxDateSelected = moment(tzIndependentDate($scope.diaryData.bookRoomViewFilter.fromDate)).add(MAX_NIGHTS_TO_ALLOW_BOOK, 'days').format($rootScope.momentFormatForAPI);
	}

	$scope.setUpData = function () {
		$scope.dateOptions = {
			changeYear: true,
			changeMonth: true,
			minDate: tzIndependentDate(minDateSelected),
			maxDate: tzIndependentDate(maxDateSelected),
			yearRange: "-100:+5",
			onSelect: function onSelect() {

				if ($scope.clickedFrom === 'MAIN_FILTER') {
					$scope.diaryData.fromDate = $scope.date;
				} else if ($scope.clickedFrom === 'BOOK_FILTER_ARRIVAL') {
					$scope.diaryData.bookRoomViewFilter.fromDate = $scope.date;
					$scope.diaryData.bookRoomViewFilter.toDate = moment(tzIndependentDate($scope.date)).add(1, 'days').format($rootScope.momentFormatForAPI);
				} else if ($scope.clickedFrom === 'BOOK_FILTER_DEPARTURE') {
					$scope.diaryData.bookRoomViewFilter.toDate = $scope.date;
				}

				$scope.$emit('DATE_CHANGED', $scope.clickedFrom);
				ngDialog.close();
			}
		};
	};

	$scope.setUpData();
}]);