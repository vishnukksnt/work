'use strict';

sntRover.directive('rvCheckbox', function ($timeout) {

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
            isDisabled: '=isDisabled',
            index: '@index'
        },

        templateUrl: '/assets/directives/checkBox/rvCheckbox.html'
    };
});