angular.module('clickTouch', []).directive('clickTouch', function($timeout, $parse) {
    return {
        restrict: 'AE',
        link: function(scope, element, attrs, opt) {
            var eventShallPass = scope.$eval( attrs.eventShallPass );

            element.bind('touchstart click', function(event) {
                try {
                    if (element) {
                        if (arguments[0].target.nodeName === 'INPUT') {
                            element.focus(); 
                        }
                    }
                } catch (err) {

                }

                // bind any touch start event to the element
                if (typeof event === typeof {}) {
                    if (event.preventDefault) {
                        event.preventDefault();
                    }
                    if ( ! eventShallPass && event.stopPropagation ) {
                        event.stopPropagation();
                    }
                }
                scope.$apply(attrs['clickTouch']);
            });

            scope.$on('$destroy', function() {
                element.unbind('touchstart click');
            });
        }
    };
});