'use strict';

/**
 * Created by shahulhameed on 3/10/16.
 */
sntRover.directive('rvIncludeTemplate', function () {
    return {
        restrict: 'AE',
        replace: true,
        templateUrl: function templateUrl(ele, attrs) {
            return attrs.rvIncludeTemplate;
        }
    };
});