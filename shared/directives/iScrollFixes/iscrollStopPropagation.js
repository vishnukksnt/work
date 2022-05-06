angular.module('iscrollStopPropagation', [])
.directive('iscrollStopPropagation', function($window) {
  return {
    link: function(scope, element, attr) {

        element.on('pointermove', function(e) {
            e.stopPropagation();
        });

        element.on('mousedown', function(e) {
            e.stopPropagation();
        });

        scope.$on('$destroy', function(e) {
            element.off('mousedown');
            element.off('pointermove');
        });

    }
  };
});
