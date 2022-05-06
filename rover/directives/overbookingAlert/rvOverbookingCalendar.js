'use strict';

sntRover.directive('overbookingAlert', function () {
    return {
        restrict: 'AE',
        scope: {
            eventSourcesLeft: '=',
            eventSourcesRight: '=',
            leftCalendarOptions: '=',
            rightCalendarOptions: '=',
            nextButtonClickHandler: '&',
            prevButtonClickHandler: '&',
            disablePrevButton: '=disablePrevButton'
        },
        controller: function controller($scope, $compile, $http) {
            $scope.nextButtonClicked = function () {
                $scope.nextButtonClickHandler();
            };

            $scope.prevButtonClicked = function () {
                $scope.prevButtonClickHandler();
            };
        },
        templateUrl: '/assets/directives/overbookingAlert/rvOverbookingCalendar.html'
    };
});