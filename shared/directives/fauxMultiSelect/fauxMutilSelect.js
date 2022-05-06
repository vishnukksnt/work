angular.module('fauxMultiSelectModule', [])
  .directive('fauxMultiSelect', ['$window', function($window) {
      return {
        restrict: 'EA',
        templateUrl: '../../assets/directives/fauxMultiSelect/fauxMultiSelect.html',
        scope: {
        	model: '=ngModel',
        	source: '=fauxSource'
        },
        link: function(scope, element, attrs) {
            var updateTitle = function() {
                if ( scope.model.length === scope.source.length ) {
                    scope.fauxTitle = 'All Selected';
                } else if ( scope.model.length > 1 ) {
                    scope.fauxTitle = scope.model.length + ' Selected';
                } else if ( scope.model.length === 0 ) {
                    scope.fauxTitle = 'Select';
                }
            };

            var setupSelections = function() {
                _.each(scope.source, function(item) {
                    var match = _.find(scope.model, function(id) {
                        return id === item.id;
                    });

                    item.selected = !!match ? true : false;
                    item.itemName = item[attrs.fauxItemName];
                });
            };

            scope.fauxTitle = 'Select';
            scope.hidden = true;

            scope.fauxToggle = function() {
                scope.hidden = scope.hidden ? false : true;
            };

            scope.fauxOptionChosen = function() {
                var modelAry = [],
                    newTitle = '';

                _.each(scope.source, function(item) {
                    if ( item.selected ) {
                        modelAry.push( item.id );
                        newTitle = item.itemName;
                    }
                });

                scope.model = modelAry;
                scope.fauxTitle = newTitle;

                updateTitle();
            };

            // this watch must be called once the model get updated.
            scope.$watch('model', function(newVal, oldVal) {
                setupSelections();
                updateTitle();
            });

            scope.$on('EVENT_REACHED_ROOT', function() {
                scope.hidden = true;
            });

            var TAP_EV = 'ontouchstart' in $window ? 'touchstart' : 'mousedown';

            element.on(TAP_EV, function(e) {
                e.stopPropagation();
            });
        }

      };
    }]);