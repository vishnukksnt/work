'use strict';

/**
 * When the model stores number as a string, the directive converts it into number format 
 **/

angular.module('sntRover').directive('stringToNumber', function () {
    return {
        require: 'ngModel',
        link: function link(scope, element, attrs, ngModel) {
            ngModel.$parsers.push(function (value) {
                return '' + value;
            });
            ngModel.$formatters.push(function (value) {
                return parseFloat(value);
            });
        }
    };
});