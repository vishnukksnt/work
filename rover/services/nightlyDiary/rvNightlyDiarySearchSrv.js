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
        angular.module('sntRover').service('RVNightlyDiarySearchSrv', ['$q', 'BaseWebSrvV2', function ($q, BaseWebSrvV2) {
            var that = this;

            that.searchPerPage = 50;
            that.page = 1;

            that.fetchSearchResults = function (data) {
                var deferred = $q.defer(),
                    url = 'search.json?per_page=' + that.searchPerPage + '&page=' + that.page + '&is_from_nightly_diary=true';

                data.fakeDataToAvoidCache = new Date();
                // Edit URL according to api specs.
                BaseWebSrvV2.getJSON(url, data).then(function (response) {
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });
                return deferred.promise;
            };
        }]);
    }, {}] }, {}, [1]);