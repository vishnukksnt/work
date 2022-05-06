'use strict';

sntRover.directive('rvCheckboxgrp', function ($timeout) {

    return {
        restrict: 'AE',
        scope: {
            label: '@label',
            isChecked: '=isChecked',
            deleteAction: '&deleteAction',
            toggle: '&toggle',
            optionId: '=optionId'
        },
        templateUrl: '/assets/directives/checkBox/rvCheckboxGroup.html'
    };
});