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
        angular.module('sntRover').service('RVReservationNotesService', ['$q', 'rvBaseWebSrvV2', function ($q, rvBaseWebSrvV2) {
            var service = this;

            /**
             * Syncs the notes with the opera systems and returns the notes_count
             * @param {Integer} reservationID reservation_id from the stay card
             * @returns {promise|{then, catch, finally}|*|e} promise would return total notes when succeeds
             */
            service.sync = function (reservationID) {
                var deferred = $q.defer(),
                    url = '/api/reservations/' + reservationID + '/sync_notes_with_ext_pms.json';

                rvBaseWebSrvV2.getJSON(url).then(function (res) {
                    deferred.resolve(res.notes_count);
                }, function (err) {
                    deferred.reject(err);
                });

                return deferred.promise;
            };

            /**
             *
             * @param {Integer} reservationID reservationID reservation_id from the stay card
             * @returns {promise|{then, catch, finally}|*|e} returns list of notes associated with the reservation
             */
            service.fetch = function (reservationID) {
                var deferred = $q.defer(),
                    url = '/api/reservations/' + reservationID + '/notes.json';

                rvBaseWebSrvV2.getJSON(url).then(function (res) {
                    deferred.resolve(res.notes.reservation_notes);
                }, function (err) {
                    deferred.reject(err);
                });

                return deferred.promise;
            };
        }]);
    }, {}] }, {}, [1]);