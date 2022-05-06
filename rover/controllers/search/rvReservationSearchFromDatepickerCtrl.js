sntRover.controller('RVReservationSearchFromDatepickerCtrl', ['$scope', '$rootScope', 'ngDialog',
	function($scope, $rootScope, ngDialog) {
		$scope.setUpData = function() {
			$scope.datePicked = $scope.fromDate ? $scope.fromDate : $rootScope.businessDate;
			$scope.dateOptions = {
				changeYear: true,
				changeMonth: true,
				yearRange: "-5:+5",
				onSelect: function(dateText, inst) {
					$scope.onFromDateChanged($scope.datePicked);
					ngDialog.close();
				}
			};
		};
		$scope.setUpData();
	}
]);