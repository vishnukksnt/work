'use strict';

sntRover.controller('RVArTransactionsDatePickerController', ['$scope', '$rootScope', 'ngDialog', function ($scope, $rootScope, ngDialog) {

    if ($scope.clickedOn === 'FROM') {
        $scope.date = $scope.filterData.fromDate ? tzIndependentDate($scope.filterData.fromDate) : tzIndependentDate($rootScope.businessDate);
    } else if ($scope.clickedOn === 'TO') {
        $scope.date = $scope.filterData.toDate ? tzIndependentDate($scope.filterData.toDate) : tzIndependentDate($rootScope.businessDate);
    }

    $scope.setUpData = function () {
        $scope.dateOptions = {
            changeYear: true,
            changeMonth: true,
            yearRange: "-5:+5", // Show 5 years in past & 5 years in future
            onSelect: function onSelect() {
                if ($scope.clickedOn === 'FROM') {
                    $scope.filterData.fromDate = $scope.date;
                    $scope.$emit('fromDateChanged');
                } else if ($scope.clickedOn === 'TO') {
                    $scope.filterData.toDate = $scope.date;
                    $scope.$emit('toDateChanged');
                }
                ngDialog.close();
            }
        };
    };

    $scope.setUpData();
}]);