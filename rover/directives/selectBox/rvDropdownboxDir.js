'use strict';

sntRover.directive('rvDropdown', function ($timeout) {

    return {
        restrict: 'AE',
        replace: 'true',
        scope: {
            divStyle: '@divStyle',
            selboxStyle: '@selboxStyle',
            divClass: '@divClass',
            selboxClass: '@selboxClass',
            required: '@required',
            id: '@id',
            label: '@label',
            labelInDropDown: '@labelInDropDown',
            list: '=list',
            name: '@name',
            selectedId: '=selectedId'
        },
        templateUrl: '/assets/directives/selectBox/rvDropdownbox.html'
    };
});