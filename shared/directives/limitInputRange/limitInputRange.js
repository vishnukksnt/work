/**
 * A directive to limit the numeric input value between a from-to value
 * For better UX: The directive will throttle user inputs and will process from last input
 *
 * USAGE:
 * ======
 * <input ng-model="" limit-input-range="{from: 0, to: 12, callback: 'afterUpdate'}" ...
 *
 * REQUIRED:
 * =========
 * ng-model is required, otherwise it wont work and will throw error
 *
 * @param {number}  'from'       - (optional) the from value
 * @param {number}  'to'         - (optional) the to value
 * @param {boolean} 'zeroPrefix' - (optional) should prefix with zero if value < 10
 * @param {number}  'toFixed'    - (optional) factions portion should be how many digits, if not replace with '0's
 * @param {string}  'callback'   - (optional) the method on scope that must be called after updating the value
 */
angular
.module('limitInputRange', [])
.directive('limitInputRange', ['$timeout', function($timeout) {
    return {
    	restrict: 'A',
        require: 'ngModel',
    	link: function(scope, elem, attrs, ngModel) {
            var options,
                processIt,
                debounced;

            var hasBlured = false;

            options = scope.$eval( attrs.limitInputRange );

            if ( options.hasOwnProperty('from') && typeof options.from !== 'number' ) {
                console.error( "'from' value should be numeric" );
                return;
            }

            if ( options.hasOwnProperty('to') && typeof options.to !== 'number' ) {
                console.error( "'to' value should be numeric" );
                return;
            }

            if ( options.hasOwnProperty('toFixed') && typeof options.toFixed !== 'number' ) {
                console.error( "'toFixed' value should be numeric" );
                return;
            }

            processIt = function() {
                var value = parseInt( ngModel.$viewValue ),
                    apply = value;

                if ( isNaN(value) ) {
                    apply = options.hasOwnProperty('from') ? options.from : '';
                } else if ( options.hasOwnProperty('from') && value < options.from ) {
                    apply = options.from;
                } else if ( options.hasOwnProperty('to') && value > options.to ) {
                    apply = options.to;
                }

                if ( !! apply || apply === 0) {
                    if ( options.hasOwnProperty('zeroPrefix') && options.zeroPrefix && apply < 10 ) {
                        apply = '0' + apply;
                    } else if ( options.hasOwnProperty('toFixed') ) {
                        apply = apply.toFixed( options.toFixed );
                    } else {
                        apply = apply.toString();
                    }
                }

                ngModel.$setViewValue(apply);
                ngModel.$render();
                scope.$digest();

                scope[options.callback] && scope[options.callback]();
                scope[options.onBlur] && hasBlured && scope[options.onBlur]();
            };

            debounced = _.debounce(processIt, 1000);

            angular.element(elem).on('keyup', debounced);

            angular.element(elem).on('blur', function() {
                hasBlured = true;
            });
            angular.element(elem).on('focus', function() {
                hasBlured = false;
            });

            scope.$on('$destroy', function() {
                angular.element(elem).off('keyup');
                angular.element(elem).off('blur');
                angular.element(elem).off('focus');
            });
        }
    };

}]);