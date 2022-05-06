angular.module('sntRover').service('RVHkDashboardSrv', [
	'RVBaseWebSrv',
	'$q',
	'$window',
	function(RVBaseWebSrv, $q, $window) {

		this.fetch = function() {
			var deferred = $q.defer();
			var url = '/house/dashboard.json';

			RVBaseWebSrv.getJSON(url).then(function(response) {
				deferred.resolve(response);
			},
			function(errorMessage) {
				deferred.reject(errorMessage);
			});
			return deferred.promise;
		};
	}
]);