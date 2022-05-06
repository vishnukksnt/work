'use strict';

sntRover.controller('RVBudgetDatePickerController', ['$scope', '$rootScope', '$filter', function ($scope, $rootScope, $filter) {

    var minDateSelected = '',
        maxDateSelected = '';

    $scope.data = {};

    if ($scope.datePickerFor === 'startDate') {
        $scope.data.selectedDate = tzIndependentDate($scope.selectedMonth.fromDate);
        minDateSelected = tzIndependentDate($scope.selectedMonth.fromDateObj);
        maxDateSelected = tzIndependentDate($scope.selectedMonth.toDate);
    } else {
        $scope.data.selectedDate = tzIndependentDate($scope.selectedMonth.toDate);
        minDateSelected = tzIndependentDate($scope.selectedMonth.fromDate);
        maxDateSelected = tzIndependentDate($scope.selectedMonth.toDateObj);
    }

    $scope.setUpData = function () {
        $scope.dateOptions = {
            minDate: minDateSelected,
            maxDate: maxDateSelected,
            onSelect: function onSelect() {
                if ($scope.datePickerFor === 'startDate') {
                    $scope.selectedMonth.start_date = $filter('date')($scope.data.selectedDate, $rootScope.dateFormat);
                    $scope.selectedMonth.fromDate = tzIndependentDate($scope.data.selectedDate);
                } else {
                    $scope.selectedMonth.end_date = $filter('date')($scope.data.selectedDate, $rootScope.dateFormat);
                    $scope.selectedMonth.toDate = tzIndependentDate($scope.data.selectedDate);
                }
                $scope.dateSelected($scope.data.selectedDate);
                $scope.closeCalendar();
            }
        };
    };
    $scope.setUpData();
}]);