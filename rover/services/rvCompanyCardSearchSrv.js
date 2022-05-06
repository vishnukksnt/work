angular.module('sntRover').service('RVCompanyCardSearchSrv', ['$q', 'rvBaseWebSrvV2', function($q, rvBaseWebSrvV2) {

	var self = this;

	this.fetch = function(data) {
		var deferred = $q.defer();
		var url =  '/api/accounts';

		rvBaseWebSrvV2.getJSON(url, data).then(function(data) {
			deferred.resolve(data);
		}, function(data) {
			deferred.reject(data);
		});
		return deferred.promise;
	};


}]);
