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
    angular.module('sntRover').service('rvGuestCardNotesSrv', ['$q', 'rvBaseWebSrvV2', function ($q, rvBaseWebSrvV2) {

      this.fetchNotesForGuest = function (params) {
        var url = '/api/guest_details/' + params.guestID + '/notes',
            deferred = $q.defer();

        rvBaseWebSrvV2.getJSON(url).then(function (data) {
          deferred.resolve(data.notes);
        }, function (errorMessage) {
          deferred.reject(errorMessage);
        });
        return deferred.promise;
      };

      this.updateNoteFromGuestCard = function (params) {
        var url = '/api/guest_details/' + params.guestID + '/notes/' + params.noteID,
            deferred = $q.defer(),
            data = { 'text': params.text };

        rvBaseWebSrvV2.putJSON(url, data).then(function (data) {
          deferred.resolve(data);
        }, function (errorMessage) {
          deferred.reject(errorMessage);
        });
        return deferred.promise;
      };

      this.deleteNoteFromGuestCard = function (params) {
        var url = '/api/guest_details/' + params.guestID + '/notes/' + params.noteID,
            deferred = $q.defer();

        rvBaseWebSrvV2.deleteJSON(url).then(function (data) {
          deferred.resolve(data);
        }, function (errorMessage) {
          deferred.reject(errorMessage);
        });
        return deferred.promise;
      };

      this.createNoteFromGuestCard = function (params) {
        var data = { 'text': params.text },

        // url 		= 'ui/show?json_input=cards/new_note.json&format=json',
        url = '/api/guest_details/' + params.guestID + '/notes',
            deferred = $q.defer();

        rvBaseWebSrvV2.postJSON(url, data).then(function (data) {
          deferred.resolve(data);
        }, function (errorMessage) {
          deferred.reject(errorMessage);
        });
        return deferred.promise;
      };
    }]);
  }, {}] }, {}, [1]);