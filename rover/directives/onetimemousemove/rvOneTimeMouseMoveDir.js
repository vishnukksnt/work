'use strict';

sntRover.directive('onetimemousemove', ['$window', function ($window) {
    return {

        link: function link(scope, element) {

            var w = $(element);

            w.on('mousemove', function (e) {
                scope.$emit("MOUSEMOVEDOVERME", e.target);
                scope.$broadcast("MOUSEMOVEDOVERME", e.target);
                w.off('mousemove');
            });
        }
    };
}]);