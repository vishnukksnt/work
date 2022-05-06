/*
 * rvFullscreen Directive usage :-
 * 1.Apply directive to the expand button.ie
 *  <button rv-fullscreen fs-sub-header="sub-header-name">Fullscreen</button>
 * 2.include rvFullscreenHeader.html in the specified container.
 *  a.<div ng-include="'/assets/partials/common/rvFullscreenHeader.html'" class="fullscreen-header"></div>
 */
sntRover.directive('rvFullscreen', [
    '$rootScope',
    '$transitions',
    function($rootScope, $transitions) {
        return {
            restrict: 'A',
            link: function(scope, element, attr) {
                var bodyEl = angular.element(document.querySelector('body'))[0],
                    fullscreenData = {};

                ['click', 'touchstart'].map(function(type) {
                    element.on(type, function(e) {
                        e.stopPropagation();

                        fullscreenData.subHeader = attr.fsSubHeader;
                        fullscreenData.toggleClass = attr.fsToggleClass ? attr.fsToggleClass
                            : $rootScope.fullscreenData.toggleClass;
                        $rootScope.fullscreenData = fullscreenData;

                        bodyEl.classList.toggle('is-fullscreen');
                        bodyEl.classList.toggle($rootScope.fullscreenData.toggleClass);

                        Object.keys($rootScope.myScrollOptions).forEach(function (key) {
                            scope.refreshScroller(key);
                        });
                        $rootScope.$digest();
                        return false;
                    });
                });

                /**
                 * Fix for CICO-50759, Removing all full-screen related styles body element
                 * when state changes
                 */

                $transitions.onStart({}, function() {
                    try {
                        bodyEl.classList.remove('is-fullscreen', $rootScope.fullscreenData.toggleClass);
                    } catch (e) {
                        bodyEl.classList.remove('is-fullscreen');
                    }
                });
            }
        };
    }
]);
