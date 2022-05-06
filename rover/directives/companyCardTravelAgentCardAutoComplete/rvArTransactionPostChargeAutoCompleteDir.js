'use strict';

// This code will be assimilated, resistance is futile
// Code will be assimilated to become part of a better IMH234
// auto complete feature
sntRover.directive('arTransactionPostChargeAutoComplete', ['highlightFilter', function (highlightFilter) {
    return {
        restrict: 'A',
        scope: {
            autoOptions: '=autoOptions',
            ngModel: '=',
            ulClass: '@ulClass',
            insertEmail: '=insertEmail'
        },
        link: function link(scope, el) {
            var ulElement = null;

            $(el).autocomplete(scope.autoOptions).data('ui-autocomplete')._renderItem = function (ul, item) {
                ul.addClass(scope.ulClass);

                ulElement = ul;
                ul.off('touchmove').on('touchmove', function (e) {
                    e.stopPropagation();
                });

                var $content = highlightFilter(item.label, scope.ngModel),
                    $result = $("<a></a>").html($content);

                var $liItem = "<span class='info'><span class='code'>" + item.charge_code + "</span><span class='price'><span class='currency'>" + item.curreny + "</span>" + item.unit_price + "</span></span>";

                $result.append($liItem);

                return $('<li></li>').append($result).appendTo(ul);
            };

            $(el).autocomplete("instance")._resizeMenu = function () {
                this.menu.element.css('height', 'auto');
                if ($(el).offset().top - $(document).scrollTop() - this.menu.element.outerHeight() <= 0) {
                    this.menu.element.outerHeight($(el).offset().top - $(document).scrollTop() - 10);
                }
            };
        }
    };
}]);