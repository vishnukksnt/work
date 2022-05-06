'use strict';

sntRover.directive('rvSetTextboxValue', [function () {
	var requiredThings, linkFunction;

	// what we need to use this directive
	requiredThings = {
		listenThis: '=listenThis'
	};

	// our link function, will clear value if model is undefined or false or blank string or null
	linkFunction = function linkFunction(scope, element, attrs) {
		var watcherFn = scope.$watch('listenThis', function (newVal, oldVal) {

			if (typeof scope.listenThis === 'undefined' || scope.listenThis === null || scope.listenThis.toString().trim() === '' || !scope.listenThis) {
				// yes we are clearing
				element.val('');
			} else {
				element.val(newVal);
			}
		});

		scope.$on('$destroy', watcherFn);
	};

	return {
		restrict: 'A',
		scope: requiredThings,
		link: linkFunction
	};
}]);