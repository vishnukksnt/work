angular.module('sntRover').service('RVDropdownDataSrv', [
    '$q',
    'rvBaseWebSrvV2',
    function($q, rvBaseWebSrvV2) {

    var countryList = [];

    this.fetchCountryList = function() {
        var deferred = $q.defer(),
            url = '/ui/country_list';

        if (countryList.length) {
            deferred.resolve(countryList);
        } else {
            rvBaseWebSrvV2.getJSON(url).then(function(data) {
                countryList = data;
                deferred.resolve(data);
            }, function(data) {
                deferred.reject(data);
            });
        }

        return deferred.promise;
    };

}]);