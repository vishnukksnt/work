angular.module('sntRover').service('RVEndOfDayModalSrv', ['$q', 'rvBaseWebSrvV2',
	function($q, rvBaseWebSrvV2) {

		/**
		 * service function used to login
		 */
		this.login = function(data) {
			var deferred = $q.defer();
			var url = '/api/end_of_days/authenticate_user';

			rvBaseWebSrvV2.postJSON(url, data).then(function(data) {
				deferred.resolve(data);
			}, function(data) {
				deferred.reject(data);
			});
			return deferred.promise;
		};

		/**
		 * service function used to change bussiness date
		 */
		this.startProcess = function(data) {
			var deferred = $q.defer();
			var url = '/api/end_of_days/change_business_date';

			rvBaseWebSrvV2.getJSON(url).then(function(data) {
				deferred.resolve(data);
			}, function(data) {
				deferred.reject(data);
			});
			return deferred.promise;
		};
		/**
		 * service function used to re-run the failed process
		 */
		this.restartFailedProcess = function(data) {
			var deferred = $q.defer();
			var url = '/api/eod_processes/' + data.id + '/re_run';

			rvBaseWebSrvV2.postJSON(url).then(function(data) {
				deferred.resolve(data);
			}, function(data) {
				deferred.reject(data);
			});
			return deferred.promise;
		};
		/**
		 * service function used to fetch log
		 */
		this.fetchLog = function(data) {
			var deferred = $q.defer();
			var url = '/api/eod_processes';

			rvBaseWebSrvV2.getJSON(url, data).then(function(data) {
				deferred.resolve(data);
			}, function(data) {
				deferred.reject(data);
			});
			return deferred.promise;
		};


}]);