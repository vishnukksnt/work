'use strict';

angular.module('sntRover').service('RMFilterOptionsSrv', ['$q', 'BaseWebSrvV2', function ($q, RVBaseWebSrv) {

    /*
    * To fetch filter options
    * @return {object} filter options
    */
    this.fetchRates = function () {
        var deferred = $q.defer();
        var url = '/api/rates?per_page=100&is_active=true'; // CICO-17201 - Request for active rates alone

        RVBaseWebSrv.getJSON(url).then(function (data) {
            deferred.resolve(data);
        }, function (data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };
    this.fetchRateTypes = function () {
        var deferred = $q.defer();
        var url = '/api/rate_types/active';

        RVBaseWebSrv.getJSON(url).then(function (data) {
            deferred.resolve(data);
        }, function (data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };

    this.fetchCompanyCard = function (data) {
        var deferred = $q.defer();
        var url = '/api/accounts';

        RVBaseWebSrv.getJSON(url, data).then(function (data) {
            deferred.resolve(data);
        }, function (data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };

    this.fetchAllRates = function (data) {
        var deferred = $q.defer();
        var url = '/api/rates?is_fully_configured=true&is_active=true'; // CICO-17201 - Request for active rates alone

        RVBaseWebSrv.getJSON(url).then(function (data) {
            deferred.resolve(data);
        }, function (data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };
}]);