'use strict';

angular.module('sntRover').service('RVMultiCurrencyExchangeSrv', ['$http', '$q', 'BaseWebSrvV2', function ($http, $q, BaseWebSrvV2) {

    var that = this;
    /*
     * Service function to fetch Accounts Receivables
     * @return {object} payments
     */

    that.fetchExchangeRates = function (params) {

        var deferred = $q.defer();
        var url = "/api/exchange_rates/current_exchange_rates";

        BaseWebSrvV2.getJSON(url, params).then(function (data) {
            deferred.resolve(data);
        }, function (data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };

    that.saveExchangeRates = function (params) {

        var deferred = $q.defer();
        var url = "/api/exchange_rates/save_exchange_rates";

        BaseWebSrvV2.postJSON(url, params).then(function (data) {
            deferred.resolve(data);
        }, function (data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };
}]);