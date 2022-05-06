'use strict';

angular.module('sntRover').service('RVMoveChargeSrv', ['$http', '$q', 'BaseWebSrvV2', function ($http, $q, BaseWebSrvV2) {

	this.fetchSearchedItems = function (data) {
		var deferred = $q.defer();
		var url = '/api/bills/search_for_associated?search_by_no=' + data.number_search + '&search_by_name=' + data.text_search + '&bill_id=' + data.bill_id;

		BaseWebSrvV2.getJSON(url).then(function (data) {
			deferred.resolve(data);
		}, function (data) {
			deferred.reject(data);
		});

		return deferred.promise;
	};

	this.moveChargesToTargetEntity = function (data) {
		var deferred = $q.defer();
		var url = '/api/bills/move_txn_diff_accounts';

		BaseWebSrvV2.postJSON(url, data).then(function (data) {
			deferred.resolve(data);
		}, function (data) {
			deferred.reject(data);
		});

		return deferred.promise;
	};
}]);