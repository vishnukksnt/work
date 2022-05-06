'use strict';

sntRover.directive('forceDecimalZeroDir', ['$timeout', '$filter', function ($timeout, $filter) {
    return {
        restrict: 'A',
        scope: {
            ngModel: '='
        },
        link: function link(scope, el) {
            var value, dec, exec;

            exec = function exec(val) {
                value = $filter('number')(scope.ngModel, 2);
                el.val(value);
            };

            $timeout(exec, 10, false);
        }
    };
}]);