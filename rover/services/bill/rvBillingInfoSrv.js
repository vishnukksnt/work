'use strict';

angular.module('sntRover').service('RVBillinginfoSrv', ['$http', '$q', 'BaseWebSrvV2', 'RVBaseWebSrv', function ($http, $q, BaseWebSrvV2, RVBaseWebSrv) {

	this.fetchRoutes = function (reservationId) {
		var deferred = $q.defer();
		var url = 'api/bill_routings/' + reservationId + '/attached_entities';

		BaseWebSrvV2.getJSON(url).then(function (data) {

			deferred.resolve(data);
		}, function (data) {
			deferred.reject(data);
		});

		return deferred.promise;
	};

	this.fetchAttachedCards = function (reservationId) {
		var deferred = $q.defer();
		var url = 'api/bill_routings/' + reservationId + '/attached_cards';

		BaseWebSrvV2.getJSON(url).then(function (data) {

			deferred.resolve(data);
		}, function (data) {
			deferred.reject(data);
		});

		return deferred.promise;
	};

	this.fetchAvailableBillingGroups = function (data) {
		var deferred = $q.defer();

		var url = 'api/bill_routings/billing_groups?id=' + data.id + '&to_bill=' + data.to_bill + '&is_new=' + data.is_new;

		if (!!data.from_date) {
			url = url + '&from_date=' + data.from_date;
		}
		if (!!data.to_date) {
			url = url + '&to_date=' + data.to_date;
		}
		BaseWebSrvV2.getJSON(url).then(function (data) {

			deferred.resolve(data);
		}, function (data) {
			deferred.reject(data);
		});

		return deferred.promise;
	};

	this.fetchAvailableChargeCodes = function (data) {
		var deferred = $q.defer();

		var url = 'api/bill_routings/charge_codes?id=' + data.id + '&to_bill=' + data.to_bill + '&is_new=' + data.is_new;

		if (!!data.from_date) {
			url = url + '&from_date=' + data.from_date;
		}
		if (!!data.to_date) {
			url = url + '&to_date=' + data.to_date;
		}

		BaseWebSrvV2.getJSON(url).then(function (data) {

			deferred.resolve(data);
		}, function (data) {
			deferred.reject(data);
		});

		return deferred.promise;
	};

	this.fetchAllBillingGroups = function () {
		var deferred = $q.defer();
		var url = '/api/bill_routings/billing_groups?is_default_routing=true';

		BaseWebSrvV2.getJSON(url).then(function (data) {

			deferred.resolve(data);
		}, function (data) {
			deferred.reject(data);
		});

		return deferred.promise;
	};

	this.fetchAllChargeCodes = function () {
		var deferred = $q.defer();
		var url = '/api/bill_routings/charge_codes?is_default_routing=true';

		BaseWebSrvV2.getJSON(url).then(function (data) {

			deferred.resolve(data);
		}, function (data) {
			deferred.reject(data);
		});

		return deferred.promise;
	};

	this.fetchBillsForReservation = function (data) {
		var deferred = $q.defer();

		var url = 'api/bill_routings/' + data.id + '/bills.json';

		if (data.entity_type !== "") {
			url = 'api/bill_routings/' + data.id + '/bills.json?entity_type=' + data.entity_type;
		}
		BaseWebSrvV2.getJSON(url).then(function (data) {

			deferred.resolve(data);
		}, function (data) {
			deferred.reject(data);
		});

		return deferred.promise;
	};

	this.saveRoute = function (data) {
		var deferred = $q.defer();
		var url = 'api/bill_routings/save_routing';

		BaseWebSrvV2.postJSON(url, data).then(function (data) {

			deferred.resolve(data);
		}, function (data) {
			deferred.reject(data);
		});

		return deferred.promise;
	};

	this.saveDefaultAccountRouting = function (data) {
		var deferred = $q.defer();
		var url = 'api/default_account_routings/save';

		BaseWebSrvV2.postJSON(url, data).then(function (data) {
			deferred.resolve(data);
		}, function (data) {
			deferred.reject(data);
		});

		return deferred.promise;
	};

	this.saveAllotmentDefaultAccountRouting = function (data) {
		var deferred = $q.defer();
		var url = 'api/default_account_routings/save_allotment_default_billing_info';

		BaseWebSrvV2.postJSON(url, data).then(function (data) {
			deferred.resolve(data);
		}, function (data) {
			deferred.reject(data);
		});

		return deferred.promise;
	};

	this.deleteRoute = function (data) {
		var deferred = $q.defer();
		var url = 'api//bill_routings/delete_routing';

		BaseWebSrvV2.postJSON(url, data).then(function (data) {

			deferred.resolve(data);
		}, function (data) {
			deferred.reject(data);
		});

		return deferred.promise;
	};

	this.fetchDefaultAccountRouting = function (params) {

		var deferred = $q.defer();
		var url = typeof params.entity_type !== "undefined" && params.entity_type !== "" ? '/api/default_account_routings/' + params.id + '?entity_type=' + params.entity_type : '/api/default_account_routings/' + params.id;

		BaseWebSrvV2.getJSON(url).then(function (data) {

			deferred.resolve(data);
		}, function (data) {
			deferred.reject(data);
		});

		return deferred.promise;
	};
	// CICO-14951 to delete default routings
	this.deleteDefaultRouting = function (data) {
		var deferred = $q.defer();
		var url = 'api/default_account_routings/' + data.id;

		BaseWebSrvV2.deleteJSON(url).then(function (data) {
			deferred.resolve(data);
		}, function (data) {
			deferred.reject(data);
		});

		return deferred.promise;
	};
}]);