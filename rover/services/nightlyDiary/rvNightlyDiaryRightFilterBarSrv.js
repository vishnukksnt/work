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
        angular.module('sntRover').service('RVNightlyDiaryRightFilterBarSrv', ['$q', 'sntBaseWebSrv', function ($q, sntBaseWebSrv) {
            var service = this;

            /*
             * Fetch room type list
             * @param {data} object
             * return object
             */
            service.fetchRoomType = function (params) {
                var deferred = $q.defer(),
                    url = '/api/room_types.json?exclude_pseudo=true&exclude_suite=true';

                sntBaseWebSrv.getJSON(url, params).then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });
                return deferred.promise;
            };

            /*
             * Fetch Floor list
             * @param {data} object
             * return object
             */
            service.fetchFloorList = function (params) {
                var deferred = $q.defer(),
                    url = '/api/floors.json';

                sntBaseWebSrv.getJSON(url, params).then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });
                return deferred.promise;
            };

            /*
             *  Get prefrences of a reservation for filter
             */
            service.getPreferences = function () {
                var deferred = $q.defer(),
                    url = '/staff/preferences/room_assignment.json';

                sntBaseWebSrv.getJSON(url).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            service.fetchFilterList = function (params) {
                var deferred = $q.defer(),
                    promises = [],
                    response = {};

                promises.push(service.fetchFloorList(params).then(function (data) {
                    response.floors = data.floors;
                }));

                promises.push(service.fetchRoomType(params).then(function (data) {
                    response.rooms = data.results;
                }));

                promises.push(service.getPreferences().then(function (data) {
                    response.roomFeatures = data.data.room_features;
                }));

                $q.all(promises).then(function () {
                    deferred.resolve(response);
                });
                return deferred.promise;
            };
        }]);
    }, {}] }, {}, [1]);