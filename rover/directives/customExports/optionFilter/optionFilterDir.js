'use strict';

sntRover.directive('optionFilter', [function () {
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
        templateUrl: '/assets/directives/customExports/optionFilter/optionFilter.html',
        replace: true,
        scope: {
            firstLevelData: '=',
            secondLevelData: '=',
            selectedFirstLevel: '=',
            selectedSecondLevel: '=',
            filterPos: '=',
            onRemove: '&',
            isMultiSelect: '=',
            options: '=',
            onFirstLevelFieldChange: '&',
            onSelectboxExpand: '=',
            hasDualState: '=',
            entryDisplayStyle: '='
        },
        controller: filterController

    };
}]);