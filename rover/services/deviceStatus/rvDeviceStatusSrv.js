angular.module('sntRover').service('rvDeviceStatusSrv', ['$http', '$q', 'BaseWebSrvV2', function($http, $q, BaseWebSrvV2) {

    this.sendLastReceipt = function(params) {

        var deferred = $q.defer();
        var url = "/guest/email_last_receipt";

        BaseWebSrvV2.getJSON(url, params).then(function(data) {
            deferred.resolve(data);
        }, function(data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };

}]);