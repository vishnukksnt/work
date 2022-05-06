/**
 *  https://github.com/angular/angular.js/blob/v1.7.x/src/ng/directive/ngOptions.js#L31-L33
 *  https://github.com/angular/angular.js/blob/v1.7.x/src/ng/directive/select.js#L526-L528
 *  https://github.com/angular/angular.js/blob/v1.7.x/src/ng/directive/select.js#L10
 *
 *  According to Angular src/documentation to unset a select element's model, it has to be set to null
 *  However, throughout our code base, it can be found that we are prone to use '' (empty string)
 *  This stopped working when we upgraded to version 1.7.7 (CICO-68625)
 *
 *  An ideal solution would be to handle this at our controllers changing all instances where the model is set to
 *  '' to be changed to null.
 *
 *  This is currently done as a workaround
 *  To use this directive, add snt-placeholder="select an option" attribute to the select element
 *
 *  This initializes the value to null if it is falsy, and keeps watch over the value to assign to null if ever it
 *  is set to ''
 */
angular.module('snt.utils').directive('sntPlaceholder', function () {
    return {
        restrict: 'A',
        scope: {
            model: '=ngModel',
            text: '@sntPlaceholder'
        },
        link: function (scope, element) {
            scope.model = scope.model || null;
            scope.text = scope.text || 'SELECT';

            scope.$watch('model', function () {
                scope.model = scope.model || null;
            });

            element.append('<option value="" disabled translate>' + scope.text + '</option>');
        }
    };
});
