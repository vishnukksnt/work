angular.module('orientationInputBlurModule', [])
	.directive('orientationInputBlur', [
		'$window',
		function($window) {
		    return {
		        restrict: 'A',
		        link: function(scope, $el) {
		            var hasMatchMedia = 'matchMedia' in $window,
		                media = null,
		                blurEl = function(l) {

		                    // FUTURE NOTE: if 'matchMedia' is found, blurEl will be passed a 'l' param
		                    // and l.matches will be true when we switch to landscape, since read below...

		                    // trigger blur
		                    $el[0].blur();
		                };

		            if ( hasMatchMedia ) {
		                media = $window.matchMedia( '(orientation: landscape)' );
		                media.addListener( blurEl );
		            } else {
		                $window.addEventListner( 'resize', blurEl, false );
		            }

		            // destroy the the instance when the $scope is destroyed
		            scope.$on('$destroy', function() {
		                if ( hasMatchMedia ) {
		                	media.removeListener( blurEl );
		                } else {
		                	$window.removeEventListener( 'resize', blurEl );
		                }
		            });
		        }
		    };
		}
	]);