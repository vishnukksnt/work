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
        sntRover.service('RVSelectRoomRateSrv', ['$q', 'rvBaseWebSrvV2', 'dateFilter', function ($q, RVBaseWebSrvV2, dateFilter) {
            var self = this;

            self.restrictionColorClass = {
                'CLOSED': 'red',
                'CLOSED_ARRIVAL': 'red',
                'CLOSED_DEPARTURE': 'red',
                'MIN_STAY_LENGTH': 'blue',
                'MAX_STAY_LENGTH': 'grey',
                'MIN_STAY_THROUGH': 'purple',
                'MIN_ADV_BOOKING': 'grey',
                'MAX_ADV_BOOKING': 'green',
                'DEPOSIT_REQUESTED': 'grey',
                'CANCEL_PENALTIES': 'grey',
                'LEVELS': 'grey',
                'RATE_NOT_CONFIGURED': 'red'
            };

            // HOUSE AVAILABILITY IS SET EVERY TIME CALL IS MADE FOR RESTRICTIONS FROM THE CALLING METHOD IN THE RVSELECTROOMANDRATECTRL
            self.houseAvailability;
            self.promotionValidity;
            self.isGroupReservation;

            self.getRateDetails = function (params) {
                var deferred = $q.defer();
                var url = '/api/availability/rate_details';

                RVBaseWebSrvV2.getJSON(url, params).then(function (data) {
                    var restrictions = {},
                        amounts = {},
                        summary = [];

                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });

                return deferred.promise;
            };
        }]);
    }, {}] }, {}, [1]);