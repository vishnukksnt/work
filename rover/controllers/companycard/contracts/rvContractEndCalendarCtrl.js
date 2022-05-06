'use strict';

sntRover.controller('rvContractEndCalendarCtrl', ['$rootScope', '$scope', 'dateFilter', 'ngDialog', function ($rootScope, $scope, dateFilter, ngDialog) {
	$scope.setUpData = function () {
		/**
   * Set the min date to business date initially
   * For add mode check if there is a start date else stick to the business date
   */
		var minDate = moment($rootScope.businessDate),
		    maxDate;

		if ($scope.contractData.mode === 'ADD') {
			minDate = $scope.addData.startDate ? moment($scope.addData.startDate) : minDate;
		} else if ($scope.contractData.mode === 'EDIT') {
			minDate = $scope.contractData.editData && $scope.contractData.editData.begin_date ? moment($scope.contractData.editData.begin_date) : minDate;
		}
		maxDate = moment(minDate).add(10, 'years');
		// Increment the minDate by 1 day as startDate can not be equal to endDate
		minDate.add(1, 'days');

		/**
   * If there is a selected endDate in either cases pick that
   * or the minDate as the active date to be displayed
   */
		if ($scope.contractData.mode === 'ADD') {
			$scope.date = $scope.addData.endDate ? tzIndependentDate($scope.addData.endDate) : tzIndependentDate(minDate);
		} else if ($scope.contractData.mode === 'EDIT') {
			if (!_.isEmpty($scope.contractData.editData)) {
				$scope.date = $scope.contractData.editData.end_date ? tzIndependentDate($scope.contractData.editData.end_date) : tzIndependentDate(minDate);
			} else {
				$scope.date = tzIndependentDate(minDate);
			}
		}

		$scope.dateOptions = {
			changeYear: true,
			changeMonth: true,
			minDate: tzIndependentDate(minDate),
			maxDate: tzIndependentDate(maxDate),
			yearRange: minDate.year() + ":" + maxDate.year(),
			onSelect: function onSelect() {
				/**
     * Set the selected date as the endDate for the forms
     */
				var endDate = moment($scope.date);

				if ($scope.contractData.mode === 'ADD') {
					$scope.addData.endDate = endDate.format('YYYY-MM-DD');
				} else if ($scope.contractData.mode === 'EDIT') {
					$scope.contractData.editData.end_date = endDate.format('YYYY-MM-DD');
				}

				ngDialog.close();
			}
		};
	};

	$scope.setUpData();
}]);