angular.module('sntRover').service('RVAutomaticEmailSrv', 
	['$http', '$q', 'sntBaseWebSrv',
	function($http, $q, sntBaseWebSrv) {

	var that = this;

	that.verifyEmailPresence = function(params) {
		var deferred = $q.defer(),
			url = '/api/bills/' + params.bill_id + '/verify_email_presence';

		sntBaseWebSrv.postJSON(url).then(function(data) {

			deferred.resolve(data);
		}, function(data) {
			deferred.reject(data);
		});

		return deferred.promise;
	};

	that.sendAutomaticEmails = function(params) {
		var deferred = $q.defer(),
			url = '/api/bills/' + params.bill_id + '/auto_trigger_receipt';

		sntBaseWebSrv.postJSON(url, params).then(function(data) {

			deferred.resolve(data);
		}, function(data) {
			deferred.reject(data);
		});

		return deferred.promise;
	};
}]);
