sntRover.controller('rvAccountDatepickerCtrl', ['$scope', 'ngDialog', function($scope, ngDialog) {
        
    $scope.date = $scope.ngDialogData.activeDate;

	$scope.setUpData = function() {
		$scope.dateOptions = {
			changeYear: true,
			changeMonth: true,
			minDate: tzIndependentDate($scope.ngDialogData.minDate),
            maxDate: tzIndependentDate($scope.ngDialogData.maxDate),
			yearRange: "-100:+5",
			onSelect: function() {
				$scope.$emit('DATE_CHANGED', $scope.date);
				ngDialog.close();
			}
		};
	};

	$scope.setUpData();
}]);