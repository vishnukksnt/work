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
        angular.module('sntRover').service('RVLoyaltyProgramSrv', ['$q', 'RVBaseWebSrv', 'BaseWebSrvV2', function ($q, RVBaseWebSrv, BaseWebSrvV2) {

            var cache = {
                'ZDIRECT_SETTINGS': null
            };

            this.addLoyaltyProgram = function (param) {
                var deferred = $q.defer(),
                    url = '/staff/user_memberships';

                RVBaseWebSrv.postJSON(url, param).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.getGMSSettings = function () {
                var deferred = $q.defer(),
                    url = '/api/integrations/gms_settings';

                if (cache['ZDIRECT_SETTINGS']) {
                    deferred.resolve(cache['ZDIRECT_SETTINGS']);
                } else {
                    BaseWebSrvV2.getJSON(url).then(function (data) {
                        cache['ZDIRECT_SETTINGS'] = data;
                        deferred.resolve(data);
                    }, function (data) {
                        deferred.reject(data);
                    });
                }

                return deferred.promise;
            };

            this.getLoyaltyDetails = function (param) {
                var deferred = $q.defer(),
                    url = '/staff/user_memberships/new_loyalty';

                RVBaseWebSrv.getJSON(url, param).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };
            this.getAvailableFFPS = function () {
                var deferred = $q.defer(),
                    url = ' /staff/user_memberships/get_available_ffps.json';

                RVBaseWebSrv.getJSON(url, '').then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };
            this.getAvailableHLPS = function () {
                var deferred = $q.defer(),
                    url = '/staff/user_memberships/get_available_hlps.json';

                RVBaseWebSrv.getJSON(url, '').then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };
            this.selectLoyalty = function (params) {
                var deferred = $q.defer(),
                    url = '/staff/user_memberships/link_to_reservation';

                RVBaseWebSrv.postJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };
        }]);
    }, {}] }, {}, [1]);