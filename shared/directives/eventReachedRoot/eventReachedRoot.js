angular.module('eventReachedRootModule', [])
  .directive('eventReachedRoot', ['$window', function($window) {
      return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            if ( ! attrs.ngApp ) {
                console.warn( "'event-reached-root' must be added to the element where 'ng-app' is declared!" );
                return;
            }

            if ( $window.eventReachedRootBind ) {
                console.warn( "'event-reached-root' must be added only once, on element where 'ng-app' is declared!" );
                return;
            }

            var TAP_EV = 'ontouchstart' in $window ? 'touchstart' : 'mousedown';

            var tapHandler = function(e) {
                scope.$emit("EVENT_REACHED_ROOT", e.target);
                scope.$broadcast("EVENT_REACHED_ROOT", e.target);
            };

            element.on( TAP_EV, tapHandler );

            $window.eventReachedRootBind = true;
        }
      };
    }]);