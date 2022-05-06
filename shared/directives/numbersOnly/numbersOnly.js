'use strict';

angular.module('numbersOnly', []).directive('numbersOnly', function () {
    return {
        require: 'ngModel',
        link: function link(scope, element, attr, ngModelCtrl) {
            function fromUser(text) {
                if (text) {
                    var transformedInput = text.replace(/[^0-9]/g, '');

                    if (transformedInput !== text) {
                        ngModelCtrl.$setViewValue(transformedInput);
                        ngModelCtrl.$render();
                    }
                    return parseInt(transformedInput);
                }
                return undefined;
            }
            ngModelCtrl.$parsers.push(fromUser);
        }
    };
});