'use strict';

angular.module('sntRover').service('RateMgrOccupancyGraphSrv', ['$q', 'BaseWebSrvV2', function ($q, BaseWebSrvV2) {

    this.fetch = function (params) {
        var deferred = $q.defer();
        var url = '/api/daily_occupancies';

        BaseWebSrvV2.getJSON(url, params).then(function (data) {
            deferred.resolve(data);
        }, function (data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };

    this.setTargets = function (params) {
        var deferred = $q.defer();
        var url = '/api/daily_occupancies/targets';

        BaseWebSrvV2.postJSON(url, params).then(function (data) {
            deferred.resolve(data);
        }, function (data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };
}]);