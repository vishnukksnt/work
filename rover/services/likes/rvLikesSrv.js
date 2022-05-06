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
        "use strict";

        exports.__esModule = true;
        exports.LikesSrv = void 0;
        function LikesSrv($q, RVBaseWebSrv) {
            /**
             *
             */
            function fetchLikes(params) {
                return RVBaseWebSrv.getJSON('/staff/preferences/likes.json', { user_id: params.userId });
            }
            /**
             *
             */
            function saveLikes(payLoad) {
                // save user preferences for room
                // --
                return RVBaseWebSrv.postJSON('/staff/guest_cards/' + payLoad.userId + '/update_preferences', payLoad.data);
            }
            return {
                fetchLikes: fetchLikes,
                saveLikes: saveLikes
            };
        }
        exports.LikesSrv = LikesSrv;
    }, {}], 2: [function (require, module, exports) {
        angular.module('sntRover').service('RVLikesSrv', ['$q', 'RVBaseWebSrv', '$http', require('../../modules/snt/services/likes/rvLikesSrv').LikesSrv]);
    }, { "../../modules/snt/services/likes/rvLikesSrv": 1 }] }, {}, [2]);