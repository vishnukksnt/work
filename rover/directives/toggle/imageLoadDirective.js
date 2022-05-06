'use strict';

sntRover.directive('imageLoad', function () {
    return {
        scope: {
            imageLoaded: '&'
        },
        link: function link(scope, element, attrs) {

            element.bind("load", function (e) {
                try {
                    scope.imageLoaded();
                } catch (err) {}
            });
        }

    };
});