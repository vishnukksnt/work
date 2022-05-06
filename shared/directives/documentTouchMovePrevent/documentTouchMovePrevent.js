angular.module('documentTouchMovePrevent', []).directive('documentTouchMovePrevent', function($window) {
    return {

        link: function(scope, element) {
            var isIpad = navigator.userAgent.match(/iPad/i) !== null,
                hasTouch = 'ontouchstart' in window,
                url = window.location.href;

            // CICO-36654 fix for touch events not getting detected iPad.
            window.touchmovepreventdefault = function(event) {
                if (isIpad || event.target.hasAttribute("iscroll-target") || url.indexOf("/admin/h/") === -1) {
                    event.preventDefault();
                }
            };
            if (isIpad) {
                document.addEventListener('touchmove', touchmovepreventdefault);
            }
            else if (hasTouch) {
                document.addEventListener('touchmove', touchmovepreventdefault, {passive: false});
            }
        }
    };
});
