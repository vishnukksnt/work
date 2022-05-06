angular.module('sntRover').service('RVOWSTestSrv', ['$http', '$q', '$window', function($http, $q, $window) {

    this.checkOWSConnection = function() {
        var deferred = $q.defer(),
            url = '/admin/test_pms_connection';

        $http.post(url).then(function(res) {
            var response = res.data;

            deferred.resolve(response.data);
        }, function(res) {
            var response = res.data,
                status = res.status;

            if (status === 401) {
                // 401- Unauthorized
                // so lets redirect to login page
                $window.location.href = '/house/logout';
            } else {
                deferred.reject(response);
            }
        });
        return deferred.promise;
    };

}]);
