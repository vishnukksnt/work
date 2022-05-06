 angular.module('touchPress', []).directive('touchPress', function($timeout, $parse) {
  return {
    restrict: 'AE',
    link: function(scope, element, attrs, opt) {
         element.bind('tap touchend click', function(event) {

            // touch end triggeres after a grag n drop also
            if (scope.isDragging) {
                return;
            }
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
                if (event.stopPropagation) {
                    event.stopPropagation();
                }
                
            }
            scope.$apply(attrs['touchPress']);
      });

    }
  };
});