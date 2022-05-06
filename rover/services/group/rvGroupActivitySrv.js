angular.module('sntRover').service('rvGroupActivitySrv', [
	'$q',
	'rvBaseWebSrvV2',
	function($q, rvBaseWebSrvV2) {

		this.cacheReportList = {};

		this.fetchActivityLog = function(params) {
			var deferred = $q.defer();
			var url = '/ui/show?format=json&json_input=activityLog/activity_log.json';


			rvBaseWebSrvV2.getJSON(url, params)
			.then(function(data) {
				this.cacheReportList = data;
				deferred.resolve(this.cacheReportList);
			}.bind(this), function(data) {
				deferred.reject(data);
			});

			return deferred.promise;
		};
		this.fetchActivityLog1 = function(params) {
			var deferred = $q.defer();
			var url = '/ui/show?format=json&json_input=activityLog/activity_log1.json';


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