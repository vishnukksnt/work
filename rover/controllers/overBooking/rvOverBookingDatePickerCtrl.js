'use strict';

angular.module('sntRover').controller('rvOverBookingDatePickerCtrl', ['$scope', '$rootScope', 'ngDialog', function ($scope, $rootScope, ngDialog) {

	var minDateSelected = moment(tzIndependentDate($rootScope.businessDate)).format($rootScope.momentFormatForAPI);

	$scope.date = moment(tzIndependentDate($scope.overBookingObj.startDate)).format($rootScope.momentFormatForAPI);

	$scope.setUpData = function () {
		$scope.dateOptions = {
			changeYear: true,
			changeMonth: true,
			minDate: tzIndependentDate(minDateSelected),
			yearRange: "1:+5",
			onSelect: function onSelect() {
				$scope.overBookingObj.startDate = $scope.date;
				$scope.$emit('DATE_CHANGED');
				ngDialog.close();
			}
		};
	};

	$scope.setUpData();
}]);