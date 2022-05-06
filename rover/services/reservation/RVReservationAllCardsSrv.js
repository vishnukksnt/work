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
        angular.module('sntRover').service('RVReservationAllCardsSrv', ['$q', 'rvBaseWebSrvV2', function ($q, RVBaseWebSrvV2) {

            this.fetchGuests = function (data) {
                var deferred = $q.defer();
                var url = '/api/guest_details';

                RVBaseWebSrvV2.getJSON(url, data, true).then(function (response) {
                    var resp = {
                        data: response.data,
                        params: response.config && response.config.params
                    };

                    deferred.resolve(resp);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.fetchCompaniesOrTravelAgents = function (data) {
                var deferred = $q.defer();
                var url = '/api/accounts';

                RVBaseWebSrvV2.getJSON(url, data).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };
        }]);
    }, {}] }, {}, [1]);