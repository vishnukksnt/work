'use strict';

angular.module('reportsModule').factory('rvReportsCache', ['$cacheFactory', function ($cacheFactory) {
    return $cacheFactory('REPORTS');
}]);