'use strict';

sntRover.directive('imgError', function () {
  return {
    link: function link(scope, element) {
      element.bind('error', function () {
        element.attr('src', '/ui/pms-ui/images/preview_not_available.png');
      });
    }
  };
});