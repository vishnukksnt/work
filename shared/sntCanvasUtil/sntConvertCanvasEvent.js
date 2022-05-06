angular.module('sntCanvasUtil', []).
    directive('sntConvertCanvasEvent', function() {
        /**
         * attaches listeners that convert touch events to mouse events
         * @param {Element} canvas for signature collection
         * @return {undefined}
         */
        function hookTouchToMouseEvent(canvas) {
            canvas.addEventListener('touchstart', function(e) {
                var touch = e.touches[0];
                var mouseEvent = new MouseEvent('mousedown', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });

                canvas.dispatchEvent(mouseEvent);
            }, false);

            canvas.addEventListener('touchend', function() {
                var mouseEvent = new MouseEvent('mouseup', {});

                canvas.dispatchEvent(mouseEvent);
            }, false);

            canvas.addEventListener('touchmove', function(e) {
                var touch = e.touches[0];
                var mouseEvent = new MouseEvent('mousemove', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });

                canvas.dispatchEvent(mouseEvent);
            }, false);
        }

        return {
            restrict: 'A',
            link: function(scope, el) {
                const observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        // The canvas element is created with class jSignature - identify the created canvas and hook events
                        _.each(mutation.addedNodes, function(node) {
                            if (angular.element(node).
                                hasClass('jSignature')) {
                                hookTouchToMouseEvent(node);
                            }
                        });
                    });
                });

                // Observe parent element for modifications to the children.
                observer.observe(el[0], {
                    childList: true
                });
            }
        };
    });
