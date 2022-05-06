"use strict";

(function () {
	function r(e, n, t) {
		function o(i, f) {
			if (!n[i]) {
				if (!e[i]) {
					var c = "function" == typeof require && require;if (!f && c) return c(i, !0);if (u) return u(i, !0);var a = new Error("Cannot find module '" + i + "'");throw a.code = "MODULE_NOT_FOUND", a;
				}var p = n[i] = { exports: {} };e[i][0].call(p.exports, function (r) {
					var n = e[i][1][r];return o(n || r);
				}, p, p.exports, r, e, n, t);
			}return n[i].exports;
		}for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) {
			o(t[i]);
		}return o;
	}return r;
})()({ 1: [function (require, module, exports) {
		angular.module('sntRover').service('RVSmartBandSrv', ['$q', 'BaseWebSrvV2', function ($q, BaseWebSrvV2) {

			this.createSmartBand = function (data) {
				var deferred = $q.defer();
				var url = '/api/reservations/' + data.reservationId + '/smartbands';

				BaseWebSrvV2.postJSON(url, data.postData).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});
				return deferred.promise;
			};

			this.listSmartBands = function (data) {
				var deferred = $q.defer();
				var url = '/api/reservations/' + data.reservationId + '/smartbands.json';

				BaseWebSrvV2.getJSON(url).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});
				return deferred.promise;
			};
			this.getSmartBandDetails = function (id) {
				var deferred = $q.defer();
				var url = '/api/smartbands/' + id;

				BaseWebSrvV2.getJSON(url).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});
				return deferred.promise;
			};
			this.updateSmartBandDetails = function (data) {
				var deferred = $q.defer();
				var url = '/api/smartbands/' + data.bandId;

				BaseWebSrvV2.putJSON(url, data.postData).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});
				return deferred.promise;
			};

			this.getBalanceSmartBands = function (data) {
				var deferred = $q.defer();
				var url = 'api/reservations/' + data.reservationId + '/smartbands/with_balance.json';

				BaseWebSrvV2.getJSON(url).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});
				return deferred.promise;
			};

			this.cashOutSmartBalance = function (id) {
				var deferred = $q.defer();
				var url = '/api/reservations/' + id + '/smartbands/cash_out';
				var postData = {};

				BaseWebSrvV2.postJSON(url, postData).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});
				return deferred.promise;
			};
		}]);
	}, {}] }, {}, [1]);