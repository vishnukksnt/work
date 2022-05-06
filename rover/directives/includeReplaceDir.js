'use strict';

sntRover.directive('includeReplace', function () {
    return {
        require: 'ngInclude',
        restrict: 'A', /* optional */
        link: function link(scope, el, attrs) {
            el.replaceWith(el.children());
        }
    };
});