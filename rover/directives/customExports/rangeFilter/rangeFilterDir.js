'use strict';

sntRover.directive('rangeFilter', [function () {
    var filterController = function filterController($scope) {

        $scope.removeFilter = function () {
            $scope.onRemove({ filterPos: $scope.filterPos });
        };

        $scope.onFieldNameChange = function () {
            $scope.onFirstLevelFieldChange({
                fieldName: $scope.selectedFirstLevel,
                filterPos: $scope.filterPos
            });
        };
    };

    return {
        restrict: 'E',
        templateUrl: '/assets/directives/customExports/rangeFilter/rangeFilter.html',
        replace: true,
        scope: {
            firstLevelData: '=',
            secondLevelData: '=',
            selectedFirstLevel: '=',
            selectedSecondLevel: '=',
            filterPos: '=',
            rangeValue: '=',
            onRemove: '&',
            onFirstLevelFieldChange: '&'
        },
        controller: filterController

    };
}]);