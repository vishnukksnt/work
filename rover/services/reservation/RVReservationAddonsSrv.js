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
        angular.module('sntRover').service('RVReservationAddonsSrv', ['$q', 'rvBaseWebSrvV2', function ($q, RVBaseWebSrvV2) {

            var that = this;

            this.addonData = {};

            this.fetchAddonData = function (params) {
                var deferred = $q.defer();
                var url = '/api/charge_groups/for_addons';

                RVBaseWebSrvV2.getJSON(url, params).then(function (data) {
                    that.addonData.addonCategories = data.results;
                    deferred.resolve(that.addonData);
                }, function (errorMessage) {
                    deferred.reject(errorMessage);
                });
                return deferred.promise;
            };

            this.fetchAddons = function (params) {
                var deferred = $q.defer();
                var url = 'api/addons';

                RVBaseWebSrvV2.getJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function (errorMessage) {
                    deferred.reject(errorMessage);
                });
                return deferred.promise;
            };

            this.checkInventory = function (params) {
                var deferred = $q.defer();
                var url = '/api/addons/' + params.addon_id + '/inventory_details';

                RVBaseWebSrvV2.getJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function (errorMessage) {
                    deferred.reject(errorMessage);
                });
                return deferred.promise;
            };
        }]);
    }, {}] }, {}, [1]);