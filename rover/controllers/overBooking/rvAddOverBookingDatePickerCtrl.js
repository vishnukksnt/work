'use strict';

angular.module('sntRover').controller('rvAddOverBookingDatePickerCtrl', ['$scope', '$rootScope', function ($scope, $rootScope) {
	var that = this;

	// Init values
	that.init = function () {
		that.minDateSelected = moment(tzIndependentDate($rootScope.businessDate)).format($rootScope.momentFormatForAPI), that.type = $scope.addOverBookingObj.type;

		// Setup default selected date.
		if (that.type === 'FROM') {
			$scope.date = $scope.addOverBookingObj.fromDate;
		} else if (that.type === 'TO') {
			$scope.date = $scope.addOverBookingObj.toDate;
		}
	};

	// Setup options.
	that.setUpData = function () {
		$scope.dateOptions = {
			changeYear: true,
			changeMonth: true,
			minDate: tzIndependentDate(that.minDateSelected),
			yearRange: "1:+5",
			onSelect: function onSelect() {
				$scope.$emit('DATE_CHANGED', that.type, $scope.date);
			}
		};
	};

	that.init();
	that.setUpData();
}]);