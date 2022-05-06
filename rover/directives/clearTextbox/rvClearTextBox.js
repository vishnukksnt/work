'use strict';

/**
* utility directive to clear the textbox
* usecase eg:- when we have a input box with a datepicker directive associated with it
* but we dont wanted to associate ng-model with textbox, we just wanted to set the value to ng-model value
* and we wanted to clear the value sometimes but datepicker object is not available to controller to clear
* we have to access node element to clear value
* Here is a directive to overcome that
*/
sntRover.directive('rvClearTextBox', [function () {
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