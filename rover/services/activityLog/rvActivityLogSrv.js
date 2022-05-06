angular.module('sntRover').service('RVActivityLogSrv', [
	'$q',
	'rvBaseWebSrvV2',
	function($q, rvBaseWebSrvV2) {

		this.cacheReportList = {};

		this.fetchActivityLog = function(params) {
			var deferred = $q.defer();

			var url = '/api/reservation_actions/' + params;

			rvBaseWebSrvV2.getJSON(url, {per_page: 50, page: 1})
			.then(function(data) {
				this.cacheReportList = data;
				deferred.resolve(this.cacheReportList);
			}.bind(this), function(data) {
				deferred.reject(data);
			});

			return deferred.promise;
		};

		this.filterActivityLog = function(params) {
			var deferred = $q.defer();
			var url = '/api/reservation_actions/' + params.id;

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

		this.fetchActiveUsers = function() {
			var deferred = $q.defer(),
				url = '/api/users/active';

			rvBaseWebSrvV2.getJSON(url)
				.then(function(data) {
					deferred.resolve(data);
				}, function(data) {
					deferred.reject(data);
				});

			return deferred.promise;
		};


	}
]);
