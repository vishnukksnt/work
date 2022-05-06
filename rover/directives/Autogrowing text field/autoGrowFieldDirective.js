'use strict';

sntRover.directive("autoGrowField", function ($window) {
  return {
    require: 'ngModel',
    scope: {
      value: '=ngModel'
    },
    link: function link(scope, element, attr) {
      // a method to update the width of an input
      // based on it's value.
      var updateWidth = function updateWidth() {
        // create a dummy span, we'll use this to measure text.
        var tester = angular.element('<div>'),


        // get the computed style of the input
        elemStyle = $window.document.defaultView.getComputedStyle(element[0], '');

        // apply any styling that affects the font to the tester span.
        tester.css({
          'font-family': elemStyle.fontFamily,
          'line-height': elemStyle.lineHeight,
          'font-size': elemStyle.fontSize,
          'font-weight': elemStyle.fontWeight,
          'width': 'auto',
          'position': 'absolute',
          'top': '-99999px',
          'left': '-99999px'
        });

        // put the tester next to the input temporarily.
        $('body').append(tester);

        // update the text of the tester span
        tester.text(element.val());

        // Fix it for placeholders
        if (!element.val() && !!element.attr('placeholder')) {
          tester.text(element.attr('placeholder'));
        }

        // measure!
        var r = tester[0].getBoundingClientRect();

        var w = r.width + 40;

        // apply the new width!
        element.css('width', w + 'px');

        // remove the tester.
        tester.remove();
      };

      // initalize the input
      updateWidth();

      scope.$watch('value', function (newVal, oldVal) {
        updateWidth();
      });

      // Need to fire event once again as the fields in the card headers
      // in the create reservation screens
      // arent of right width
      $window.setTimeout(updateWidth, 3000); // changed from 0 to 2000 becauze the lazy loading


      // do it on keydown so it updates "real time"
      element.bind("keydown", function () {

        // set an immediate timeout, so the value in
        // the input has updated by the time this executes.
        $window.setTimeout(updateWidth, 0);
      });
      // sat as active
      element.bind("focus", function () {
        element.addClass('active');
      });
      element.bind("blur", function () {
        element.removeClass('active');
      });
    }
  };
});