angular.module('divTouchMoveStopPropogate', []).directive('divTouchMoveStopPropogate', function($window) {
  return {

    link: function(scope, element) {
        var hasTouch = 'ontouchstart' in window,
            isIpad = navigator.userAgent.match(/iPad/i) !== null;

        // CICO-36654 fix for touch events not getting detected iPad.
        window.touchmovestoppropogate = function(event) {
            event.stopPropagation();
        };
        if (isIpad) {
            element.on('touchmove',window.touchmovestoppropogate);
        }
        else if (hasTouch) {
            element.on('touchmove',window.touchmovestoppropogate, {passive: false} );
        }
    }
  };
});
