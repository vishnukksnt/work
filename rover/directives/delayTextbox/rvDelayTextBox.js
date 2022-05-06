'use strict';

sntRover.directive('rvDelayTextbox', function ($timeout) {

    return {
        restrict: 'A',
        scope: {
            delay: '@delay',
            ngModel: '=ngModel',
            functionToFire: '=functionToFire',
            functionParam: '=functionParam'
        },
        link: function link(scope, element, attrs) {
            // we are setting delay to 2sec. if it is undefined
            if (typeof scope.delay === "undefined") {
                scope.delay = 2000;
            }
            element.bind('keyup', function (event) {
                if (scope.currentTimeoutFn) {
                    clearTimeout(scope.currentTimeoutFn);
                    scope.currentTimeoutFn = setTimeout(function () {
                        scope.functionToFire(scope.functionParam);
                    }, scope.delay);
                } else {
                    scope.currentTimeoutFn = setTimeout(function () {
                        scope.functionToFire(scope.functionParam);
                    }, scope.delay);
                }
            });
        }
    };
});