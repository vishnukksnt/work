'use strict';

angular.module('sntRover').service('UpdatePriceAndRestrictionsSrv', ['$q', 'BaseWebSrvV2', function ($q, BaseWebSrvV2) {

    this.savePriceAndRestrictions = function (data) {
        var deferred = $q.defer();
        var url = "/api/daily_rates";

        BaseWebSrvV2.postJSON(url, data).then(function (data) {
            deferred.resolve(data);
        }, function (data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };
}]);