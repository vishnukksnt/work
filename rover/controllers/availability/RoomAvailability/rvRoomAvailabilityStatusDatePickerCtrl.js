angular.module('sntRover').controller('rvRoomAvailabilityDatePickerController', ['$scope', '$rootScope', 'ngDialog', '$filter', function($scope, $rootScope, ngDialog, $filter) {

	var selectedDateOnLoading = $scope.data.selectedDate;

	$scope.setUpCalendar = function() {
	   $scope.dateOptions = {
	     changeYear: true,
	     changeMonth: true,
	     minDate: tzIndependentDate($rootScope.businessDate),
	     yearRange: "-10:+10",
	     dateFormat: 'mm-dd-yy',
	     onSelect: function(dateText, inst) {

	     	if ($scope.data.selectedDate !== selectedDateOnLoading) {
	     		$scope.data.formattedSelectedDate = $filter('date')($scope.data.selectedDate, $rootScope.dateFormat);
	     		$scope.changedAvailabilityDataParams();
	     	}

	        ngDialog.close();
	      }

	    };
	};
	$scope.setUpCalendar();

}]);