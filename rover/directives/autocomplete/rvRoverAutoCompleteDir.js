'use strict';

// auto complete feature
(function () {

    var highlightFilter_ = null,
        autocompleteEl = null,
        ulElement = null;

    /**
     * default process function for each item
     * @param  {Object} item
     * @param  {function (Object)} highlightFilter
     * @param  {Object} scope
     * @return {String} html against each item
     */
    var defaultProcessEachItem = function defaultProcessEachItem(item, scope) {
        var $content = highlightFilter_(item.name, scope.ngModel),
            $result = $("<a></a>").html($content);

        return $result;
    };

    /**
     * [autoCompleteLinkFn description]
     * @param  {[type]} scope [description]
     * @param  {[type]} el    [description]
     * @param  {[type]} attrs [description]
     * @return {[type]}       [description]
     */
    var autoCompleteLinkFn = function autoCompleteLinkFn(scope, el, attrs) {
        $(el).autocomplete(scope.autoOptions).data('ui-autocomplete')._renderItem = function (ul, item) {
            // CICO-26513
            ulElement = ul;
            ulElement.off('touchmove').on('touchmove', function (e) {
                e.stopPropagation();
            });

            var htmlForItem = '';

            ul.addClass(scope.ulClass);

            // if no function passed for processing each item
            if (!_.isFunction(scope.processEachItem)) {
                htmlForItem = defaultProcessEachItem(item, scope);
            } else {
                htmlForItem = scope.processEachItem(item, scope);
            }

            return $('<li></li>').append(htmlForItem).appendTo(ul);
        };

        /**
         * we've to unbind something while removing the node from dom
         */
        scope.$on('$destroy', function () {
            autocompleteEl = $(el);
            autocompleteEl.autocomplete("destroy");

            // unbinding the touch move
            if (ulElement instanceof HTMLElement) {
                ulElement.off('touchmove');
            }
        });
    };

    /**
     * auto complete directive function
     */

    angular.module('sntRover').directive('roverAutoComplete', ['highlightFilter', function (highlightFilter) {
        highlightFilter_ = highlightFilter;
        return {
            restrict: 'A',
            scope: {
                autoOptions: '=autoCompleteOptions',
                ngModel: '=',
                ulClass: '@ulClass',
                processEachItem: '=processEachItem'
            },
            link: autoCompleteLinkFn
        };
    }]);
})();