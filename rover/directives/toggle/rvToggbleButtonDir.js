'use strict';

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

sntRover.directive('rvToggleButton', function ($timeout) {

    return {
        restrict: 'E',
        replace: 'true',
        scope: _defineProperty({
            label: '@label',
            isChecked: '=isChecked',
            divClass: '@divClass'
        }, 'label', '@label'),

        templateUrl: '/assets/directives/toggle/rvToggleButton.html'
    };
});