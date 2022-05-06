'use strict';

sntRover.directive('rvCheckboxtextLeft', function ($timeout) {

    return {
        restrict: 'AE',
        replace: 'true',
        scope: {
            label: '@label',
            required: '@required',
            isChecked: '=isChecked',
            parentLabelClass: '@parentLabelClass',
            divClass: '@divClass',
            change: '=change',
            datagroup: '@datagroup',
            index: '@index',
            isDisabled: '@isDisabled',
            width: '@'
        },

        templateUrl: '/assets/directives/checkBox/rvCheckboxLeftText.html'
    };
});