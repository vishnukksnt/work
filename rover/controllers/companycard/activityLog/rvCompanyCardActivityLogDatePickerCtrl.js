'use strict';

sntRover.controller('RVCompanyCardActivityLogDatePickerController', ['$scope', '$rootScope', 'ngDialog', function ($scope, $rootScope, ngDialog) {

    var minDateValue = '';

    if ($scope.clickedOn === 'FROM') {
        $scope.date = $scope.activityLogFilter.fromDate ? tzIndependentDate($scope.activityLogFilter.fromDate) : tzIndependentDate($rootScope.businessDate);
    } else if ($scope.clickedOn === 'TO') {
        minDateValue = tzIndependentDate($scope.activityLogFilter.fromDate);
        $scope.date = $scope.activityLogFilter.toDate ? tzIndependentDate($scope.activityLogFilter.toDate) : tzIndependentDate($rootScope.businessDate);
    }

    $scope.setUpData = function () {
        $scope.dateOptions = {
            changeYear: true,
            changeMonth: true,
            minDate: minDateValue,
            yearRange: "-5:+5", // Show 5 years in past & 5 years in future
            onSelect: function onSelect() {
                if ($scope.clickedOn === 'FROM') {
                    $scope.activityLogFilter.fromDate = $scope.date;
                    $scope.activityLogFilter.toDate = $scope.date;
                    $scope.$emit('fromDateChanged');
                } else if ($scope.clickedOn === 'TO') {
                    $scope.activityLogFilter.toDate = $scope.date;
                    $scope.$emit('toDateChanged');
                }
                ngDialog.close();
            }
        };
    };

    $scope.setUpData();
}]);