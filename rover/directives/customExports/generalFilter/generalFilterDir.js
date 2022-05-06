'use strict';

sntRover.directive('generalFilter', [function () {
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
        templateUrl: '/assets/directives/customExports/generalFilter/generalFilter.html',
        replace: true,
        scope: {
            firstLevelData: '=',
            secondLevelData: '=',
            selectedFirstLevel: '=',
            selectedSecondLevel: '=',
            filterPos: '=',
            onRemove: '&',
            onFirstLevelFieldChange: '&'
        },
        controller: filterController

    };
}]);