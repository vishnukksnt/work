angular.module('sntRover').controller('rvHkServiceStatusDateSelectorCtrl', ['$scope', '$rootScope', 'ngDialog', 'dateFilter', '$filter',
	function($scope, $rootScope, ngDialog, dateFilter, $filter) {

		$scope.setUpData = function() {
			$scope.dateOptions = {
				changeYear: true,
				changeMonth: true,
				onSelect: function(dateText, inst) {
					$scope.onViewDateChanged();
					if ($scope.serviceStatus[$filter('date')(new Date(dateText), "yyyy-MM-dd")]) {
						$scope.updateService.room_service_status_id = $scope.serviceStatus[$filter('date')(new Date(dateText), "yyyy-MM-dd")].id;
					}
					ngDialog.close();
				},
				beforeShowDay: $scope.setClass,
				onChangeMonthYear: function(year, month, instance) {
					$scope.updateCalendar(year, month);
				}
			};
		};
		$scope.setUpData();

	}
]);