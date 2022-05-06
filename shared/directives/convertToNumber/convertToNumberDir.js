angular.module('convertToNumber', []).directive('convertToNumber', function() {
    return {
        scope: {
            skipConversion: '@'
        },
        require: 'ngModel',
        link: function(scope, element, attrs, ngModel) {
            ngModel.$parsers.push(function(val) {
                return scope.skipConversion !== 'true' && isFinite(parseInt(val, 10)) && /^\d+$/.test(val) ? parseInt(val, 10) : val;
            });
            ngModel.$formatters.push(function(val) {
                if (angular.isUndefined(val)) {
                    return '';
                }
                return '' + val;
            });
        }
    };
});
