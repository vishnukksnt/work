sntRover.controller('RVReservationSearchToDatepickerCtrl', ['$scope', '$rootScope', 'ngDialog',
	function($scope, $rootScope, ngDialog) {
		$scope.setUpData = function() {
			$scope.datePicked = $scope.toDate ? $scope.toDate : $rootScope.businessDate;
			$scope.dateOptions = {
				changeYear: true,
				changeMonth: true,
				yearRange: "-5:+5",
				onSelect: function(dateText, inst) {
					$scope.onToDateChanged($scope.datePicked);
					ngDialog.close();
				}
			};
		};
		$scope.setUpData();
	}
]);