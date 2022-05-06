angular.module('sntRover').service('rvGroupAccountActivitySrv', [
	'$q',
	'rvBaseWebSrvV2',
	function($q, rvBaseWebSrvV2) {

		this.cacheReportList = {};

		this.fetchActivityLog = function(params) {
			var deferred = $q.defer();

			var url = '/api/group_actions/'	+ params.id;

			params = _.omit(params, 'id');
			rvBaseWebSrvV2.getJSON(url, params)
			.then(function(data) {
				this.cacheReportList = data;
				deferred.resolve(this.cacheReportList);
			}.bind(this), function(data) {
				deferred.reject(data);
			});

			return deferred.promise;
		};
	}
]);