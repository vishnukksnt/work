'use strict';

angular.module('sntRover').service('RVPostChargeSrvV2', ['$http', '$q', 'BaseWebSrvV2', 'RVBaseWebSrv', function ($http, $q, BaseWebSrvV2, RVBaseWebSrv) {

	var that = this;

	this.fetchChargeGroups = function () {

		var deferred = $q.defer();
		var url = "/api/charge_groups.json";

		BaseWebSrvV2.getJSON(url).then(function (data) {
			deferred.resolve(data);
		}, function (data) {
			deferred.reject(data);
		});
		return deferred.promise;
	};

	this.postCharges = function (params) {

		var deferred = $q.defer();
		var url = '/staff/items/post_items_to_bill';

		RVBaseWebSrv.postJSON(url, params).then(function (data) {
			deferred.resolve(data);
		}, function (data) {
			deferred.reject(data);
		});
		return deferred.promise;
	};

	this.getReservationBillDetails = function (reservationId) {

		var deferred = $q.defer();
		var url = '/api/reservations/' + reservationId + '/bills';

		BaseWebSrvV2.getJSON(url).then(function (data) {
			deferred.resolve(data);
		}, function (data) {
			deferred.reject(data);
		});
		return deferred.promise;
	};

	this.searchChargeItems = function (params) {

		var deferred = $q.defer();
		var url = "/api/charge_codes/items_and_charge_codes.json?query=" + params.query + "&page=" + params.page + "&per_page=" + params.per_page + "&charge_group_id=" + params.charge_group_id + "&is_favorite=" + params.is_favorite;

		BaseWebSrvV2.getJSON(url).then(function (data) {
			deferred.resolve(data);
		}, function (data) {
			deferred.reject(data);
		});
		return deferred.promise;
	};
	/*
  * Post charges from AR invoice
  */

	this.postChargesFromArInvoice = function (params) {

		var deferred = $q.defer();
		var url = '/api/accounts/' + params.accountId + '/ar_transactions/' + params.arTransactionId + '/post_charge_to_invoice';

		BaseWebSrvV2.postJSON(url, params.postChargeData).then(function (data) {
			deferred.resolve(data);
		}, function (data) {
			deferred.reject(data);
		});
		return deferred.promise;
	};
}]);