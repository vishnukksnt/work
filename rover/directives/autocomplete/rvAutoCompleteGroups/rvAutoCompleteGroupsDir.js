'use strict';

angular.module('sntRover').directive('autoCompleteGroups', ['RVSearchSrv', 'highlightFilter', 'rvUtilSrv', function (RVSearchSrv, highlightFilter, rvUtilSrv) {

    return {
        restrict: 'A',
        require: 'ngModel',
        templateUrl: "/assets/directives/autocomplete/rvAutoCompleteGroups/rvAutoCompleteGroups.html",
        link: function link(scope, el, attrs, ngModel) {
            BaseCtrl.call(this, scope);
            // CICO-26513
            var ulElement = null;

            var lastSearchText = "",
                refreshTemplate = function refreshTemplate() {
                if (!scope.$$phase) {
                    scope.$digest();
                }
            },
                groupsACSourceHandler = function groupsACSourceHandler(request, response) {
                if (request.term.length === 0) {
                    ngModel.$setViewValue(null);
                    scope.groupName = null;
                } else if (request.term.length > 0 && lastSearchText !== request.term) {
                    ngModel.$setViewValue(null);
                    var onSearchGroupSuccess = function onSearchGroupSuccess(results) {
                        lastSearchText = request.term;
                        response(results);
                    };

                    scope.callAPI(RVSearchSrv.getGroupList, {
                        params: {
                            'query': request.term
                        },
                        successCallBack: onSearchGroupSuccess
                    });
                }
            },
                groupsACSelectHandler = function groupsACSelectHandler(event, selection) {
                scope.groupName = rvUtilSrv.escapeNull(selection.item.group_name);
                ngModel.$setViewValue(angular.copy(selection.item));
                scope.$emit("GROUP_SELECTED", selection.item);
                refreshTemplate();
                return false;
            };

            scope.groupName = "";

            el.find("input").autocomplete({
                delay: scope.delay ? 600 : parseInt(scope.delay),
                minLength: scope.minLengthToTrigger ? 0 : parseInt(scope.minLengthToTrigger),
                position: {
                    of: el.find("input"),
                    my: "right top",
                    at: "right bottom",
                    collision: 'flip',
                    within: 'body'
                },
                source: groupsACSourceHandler,
                select: groupsACSelectHandler
            }).data('ui-autocomplete')._renderItem = function (ul, item) {
                var group = angular.element('<a></a>'),
                    groupName = angular.element('<span></span>', {
                    class: "name",
                    html: highlightFilter(item.group_name, lastSearchText)
                });

                ul.addClass("find-guest");

                // For fixing CICO-26513
                ulElement = ul;
                ul.off('touchmove').on('touchmove', function (e) {
                    e.stopPropagation();
                });

                group.append(groupName);

                return angular.element('<li></li>').append(group).appendTo(ul);
            };

            scope.$on('$destroy', function () {
                el.find("input").autocomplete("destroy");

                // CICO-26513
                // unbinding the touch move
                if (ulElement instanceof HTMLElement) {
                    ulElement.off('touchmove');
                }
            });

            ngModel.$render = function () {
                // Clear up the group name if the model is cleared from the controller end
                if (!ngModel.$viewValue) {
                    scope.groupName = null;
                }
            };
        }
    };
}]);