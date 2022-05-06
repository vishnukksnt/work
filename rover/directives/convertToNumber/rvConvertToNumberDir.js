'use strict';

/**
 * REF: CICO-37906
 *
 * Section Binding select to a non-string value via ngModel parsing / formatting in
 * https://code.angularjs.org/1.6.1/docs/api/ng/directive/select
 *
 * NOTE: http://stackoverflow.com/questions/28114970/angularjs-ng-options-using-number-for-model-does-not-select-initial-value
 * For binding numeric values to select elements, we will have to use this directive on select elements with ng-model
 *
 */

angular.module('sntRover').directive('convertToNumber', function () {
    return {
        require: 'ngModel',
        link: function link(scope, element, attrs, ngModel) {
            ngModel.$parsers.push(function (val) {
                return isFinite(parseInt(val, 10)) ? parseInt(val, 10) : val;
            });
            ngModel.$formatters.push(function (val) {
                if (angular.isUndefined(val)) {
                    return '';
                }
                return '' + val;
            });
        }
    };
});