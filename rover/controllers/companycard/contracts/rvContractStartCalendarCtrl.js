'use strict';

sntRover.controller('rvContractStartCalendarCtrl', ['$rootScope', '$scope', 'ngDialog', function ($rootScope, $scope, ngDialog) {
	$scope.setUpData = function () {
		$scope.isDateSelected = false;
		var minDate = '';

		/**
   * We need the businessDate as the min date,
   * irrespective of whether a startDate exists or not
   */
		minDate = $rootScope.businessDate;
		/**
   * Select the date to be displayed as the start date in the form, if any
   * else stick with the minDate
   */
		if ($scope.contractData.mode === 'ADD') {
			$scope.date = $scope.addData.startDate || minDate;
		} else if ($scope.contractData.mode === 'EDIT') {
			if (!_.isEmpty($scope.contractData.editData)) {
				$scope.date = $scope.contractData.editData.begin_date || minDate;
			} else {
				$scope.date = minDate;
			}
		}

		$scope.dateOptions = {
			changeYear: true,
			changeMonth: true,
			minDate: tzIndependentDate(minDate),
			yearRange: "0:+10",
			onSelect: function onSelect() {
				var endDate = moment($scope.date).add(1, 'days'),
				    beginDate = moment($scope.date);

				if ($scope.contractData.mode === 'ADD') {
					$scope.addData.startDate = beginDate.format('YYYY-MM-DD');
					if (!$scope.addData.endDate || $scope.addData.startDate >= $scope.addData.endDate) {
						$scope.addData.endDate = endDate.format('YYYY-MM-DD');
					}
				} else if ($scope.contractData.mode === 'EDIT') {
					$scope.contractData.editData.begin_date = beginDate.format('YYYY-MM-DD');
					if ($scope.contractData.editData.begin_date >= $scope.contractData.editData.end_date) {
						$scope.contractData.editData.end_date = endDate.format('YYYY-MM-DD');
					}
				}

				ngDialog.close();
			}
		};
	};

	$scope.setUpData();
}]);