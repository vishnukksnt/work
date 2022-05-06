'use strict';

angular.module('sntRover').service('RVAccountsReceivablesSrv', ['$http', '$q', 'BaseWebSrvV2', function ($http, $q, BaseWebSrvV2) {

    var that = this;
    /*
     * Service function to fetch Accounts Receivables
     * @return {object} payments
     */

    that.fetchAccountsReceivables = function (params) {

        var deferred = $q.defer();
        var url = "/api/accounts/ar_overview";

        BaseWebSrvV2.getJSON(url, params).then(function (data) {
            deferred.resolve(data);
        }, function (data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };
}]);