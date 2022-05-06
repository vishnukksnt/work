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
		angular.module('sntRover').service('RVCompanyCardActivityLogSrv', ['$q', 'rvBaseWebSrvV2', function ($q, rvBaseWebSrvV2) {

			this.fetchActivityLog = function (params) {
				var deferred = $q.defer(),
				    url = '/api/account_actions';

				rvBaseWebSrvV2.getJSON(url, params).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});

				return deferred.promise;
			};

			this.fetchFilterData = function (params) {
				var deferred = $q.defer(),
				    url = '/api/account_actions/' + params.id + '/account_action_types';

				rvBaseWebSrvV2.getJSON(url).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});

				return deferred.promise;
			};
		}]);
	}, {}] }, {}, [1]);