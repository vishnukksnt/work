'use strict';

angular.module('twoMonthscalendar', []).directive('twoMonthCalendar', function () {
    return {
        restrict: 'AE',
        scope: {
            eventSourcesLeft: '=',
            eventSourcesRight: '=',
            leftCalendarOptions: '=leftCalendarOptions',
            rightCalendarOptions: '=rightCalendarOptions',
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
        link: function link(scope, elm, attrs, controller) {},
        templateUrl: '/assets/directives/fullCalendar/twoMonthCalendar.html'
    };
});