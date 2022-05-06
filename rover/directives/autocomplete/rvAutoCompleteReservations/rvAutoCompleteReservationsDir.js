'use strict';

angular.module('sntRover').directive('autoCompleteReservations', ['RVSearchSrv', 'highlightFilter', 'rvUtilSrv', function (RVSearchSrv, highlightFilter, rvUtilSrv) {

    return {
        restrict: 'A',
        require: 'ngModel',
        templateUrl: "/assets/directives/autocomplete/rvAutoCompleteReservations/rvAutoCompleteReservations.html",
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
                reservationsACSourceHandler = function reservationsACSourceHandler(request, response) {
                if (request.term.length === 0) {
                    ngModel.$setViewValue(null);
                    scope.guestName = null;
                } else if (request.term.length > 0 && lastSearchText !== request.term) {
                    ngModel.$setViewValue(null);
                    var onSearchReservationSuccess = function onSearchReservationSuccess(results) {
                        lastSearchText = request.term;
                        response(results);
                    };

                    scope.callAPI(RVSearchSrv.fetch, {
                        params: {
                            'query': request.term,
                            'is_minimal': true
                        },
                        successCallBack: onSearchReservationSuccess
                    });
                }
            },
                reservationsACSelectHandler = function reservationsACSelectHandler(event, selection) {
                scope.guestName = rvUtilSrv.escapeNull(selection.item.lastname) + ', ' + rvUtilSrv.escapeNull(selection.item.firstname);
                ngModel.$setViewValue(angular.copy(selection.item));
                scope.$emit("RESERVATION_SELECTED", selection.item);
                refreshTemplate();
                return false;
            };

            scope.guestName = "";

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
                source: reservationsACSourceHandler,
                select: reservationsACSelectHandler
            }).data('ui-autocomplete')._renderItem = function (ul, item) {
                var reservation = angular.element('<a></a>'),
                    guestImageClass = item.images && item.images.length > 1 ? 'guest-image accompany' : 'guest-image',
                    avatar = angular.element('<figure></figure>', {
                    class: guestImageClass
                }),
                    guestName = angular.element('<span></span>', {
                    class: "name",
                    html: highlightFilter(rvUtilSrv.escapeNull(item.lastname) + ', ' + rvUtilSrv.escapeNull(item.firstname), lastSearchText)
                }),
                    roomNumber = angular.element('<span></span>', {
                    class: "room",
                    html: item.room ? "Room " + highlightFilter(item.room, lastSearchText) : ''
                });
                if (!!item.is_flagged) {
                    avatar.addClass('blacklisted');
                }
                _.each(item.images, function (image) {
                    avatar.append(angular.element('<img>', {
                        src: image.guest_image
                    }));
                });

                ul.addClass("find-guest");

                // For fixing CICO-26513
                ulElement = ul;
                ul.off('touchmove').on('touchmove', function (e) {
                    e.stopPropagation();
                });

                avatar.append(angular.element('<img>'));
                reservation.append(avatar).append(guestName).append(roomNumber);

                return angular.element('<li></li>').append(reservation).appendTo(ul);
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
                // Clear up the guest name if the model is cleared from the controller end
                if (!ngModel.$viewValue) {
                    scope.guestName = null;
                }
            };
        }
    };
}]);