'use strict';

sntRover.directive('durationFilter', [function () {
    var filterController = function filterController($scope) {

        $scope.removeFilter = function () {
            $scope.onRemove({ filterPos: $scope.filterPos });
        };
    };

    return {
        restrict: 'E',
        templateUrl: '/assets/directives/customExports/durationFilter/durationFilter.html',
        replace: true,
        scope: {
            firstLevelData: '=',
            secondLevelData: '=',
            selectedFirstLevel: '=',
            selectedSecondLevel: '=',
            filterPos: '=',
            onRemove: '&'

        },
        controller: filterController

    };
}]);