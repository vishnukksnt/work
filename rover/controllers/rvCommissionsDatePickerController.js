'use strict';

sntRover.controller('RVCommissionsDatePickerController', ['$scope', '$rootScope', 'ngDialog', 'dateFilter', function ($scope, $rootScope, ngDialog, dateFilter) {

    var businessDate = tzIndependentDate($rootScope.businessDate);

    if ($scope.clickedOn === 'FROM') {
        $scope.date = !!$scope.filterData.fromDate ? $scope.filterData.fromDate : businessDate;
    } else if ($scope.clickedOn === 'TO') {
        $scope.date = !!$scope.filterData.toDate ? $scope.filterData.toDate : businessDate;
    }

    $scope.setUpData = function () {
        $scope.dateOptions = {
            changeYear: true,
            changeMonth: true,
            yearRange: "-5:+5",
            onSelect: function onSelect(dateText, inst) {
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