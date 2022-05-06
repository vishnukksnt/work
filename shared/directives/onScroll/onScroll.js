angular.module('onScroll', []).directive('onScroll', function() {
    var directiveDefinitionObject = {
        restrict: 'A',
        scope: {
            method: '&onScroll'
        },
        link: function(scope, element, attrs) {
            var expressionHandler = scope.method();

            element.bind('scroll', function() {
                expressionHandler();
            });
            scope.$on("$destroy", function(e) {
                element.unbind('scroll');
            });
        }
    };

    return directiveDefinitionObject;
});