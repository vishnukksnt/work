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
      angular.module('sntRover').service('rvCardStatisticsSrv', ['$q', 'sntBaseWebSrv', function ($q, sntBaseWebSrv) {

         /**
          * Fetch property groups associated with the hotel chain of the current user
          * @return {Promise}
          */
         this.fetchPropertyGroups = function () {
            var deffered = $q.defer(),
                url = 'api/property_groups';

            sntBaseWebSrv.getJSON(url).then(function (data) {
               deffered.resolve(data);
            }, function (error) {
               deffered.resolve(error);
            });

            return deffered.promise;
         };

         /**
          * Fetch property groups associated with the hotel chain of the current user
          * @return {Promise}
          */
         this.fetchCurrentChainHotelList = function () {
            var deffered = $q.defer(),
                url = 'api/chains/current';

            sntBaseWebSrv.getJSON(url).then(function (data) {
               deffered.resolve(data);
            }, function (error) {
               deffered.resolve(error);
            });

            return deffered.promise;
         };

         /**
          * Fetch hotels belonging to a particular property group
          * @params {Object} params - hold the request parameters
          * @return {Promise}
          */
         this.fetchHotelListByPropertyGroup = function (params) {
            var deffered = $q.defer(),
                url = 'api/property_groups/' + params.propertyGroupId;

            sntBaseWebSrv.getJSON(url).then(function (data) {
               deffered.resolve(data);
            }, function (error) {
               deffered.resolve(error);
            });

            return deffered.promise;
         };
      }]);
   }, {}] }, {}, [1]);