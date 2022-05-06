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
        angular.module('sntRover').service('RVExternalReferencesSrv', ['$q', 'rvBaseWebSrvV2', function ($q, RVBaseWebSrvV2) {

            var self = this;

            var fetchExternalSystems = function fetchExternalSystems() {
                var deferred = $q.defer(),
                    url = "/api/reference_values/manual_external_reference_interfaces";

                RVBaseWebSrvV2.getJSON(url).then(function (response) {
                    deferred.resolve(response.external_interface_types);
                }, function (errorMessage) {
                    deferred.reject(errorMessage);
                });
                return deferred.promise;
            };

            var fetchExternalReferences = function fetchExternalReferences(reservationId) {
                var deferred = $q.defer(),
                    url = "/api/reservations/" + reservationId + "/external_references";

                RVBaseWebSrvV2.getJSON(url).then(function (response) {
                    var references = response.external_references;

                    if (references.length === 0) {
                        references.push(self.getEmptyRow());
                    }
                    deferred.resolve(references);
                }, function (errorMessage) {
                    deferred.reject(errorMessage);
                });
                return deferred.promise;
            };

            self.save = function (payLoad) {
                var deferred = $q.defer(),
                    url = "/api/reservations/" + payLoad.reservationId + "/external_references";

                RVBaseWebSrvV2.postJSON(url, {
                    external_confirm_no: payLoad.reference.external_confirm_no,
                    external_interface_type_id: payLoad.reference.external_interface_type_id
                }).then(function (response) {
                    deferred.resolve(response);
                }, function (errorMessage) {
                    deferred.reject(errorMessage);
                });
                return deferred.promise;
            };

            self.update = function (payLoad) {
                var deferred = $q.defer(),
                    url = "/api/reservations/" + payLoad.reservationId + "/external_references/" + payLoad.reference.id;

                RVBaseWebSrvV2.putJSON(url, {
                    external_confirm_no: payLoad.reference.external_confirm_no,
                    external_interface_type_id: payLoad.reference.external_interface_type_id
                }).then(function (response) {
                    deferred.resolve(response);
                }, function (errorMessage) {
                    deferred.reject(errorMessage);
                });
                return deferred.promise;
            };

            self.remove = function (payLoad) {
                var deferred = $q.defer(),
                    url = "/api/reservations/" + payLoad.reservationId + "/external_references/" + payLoad.referenceId;

                RVBaseWebSrvV2.deleteJSON(url).then(function (response) {
                    deferred.resolve(response);
                }, function (errorMessage) {
                    deferred.reject(errorMessage);
                });
                return deferred.promise;
            };

            self.getEmptyRow = function () {
                return {
                    external_interface_type_id: "",
                    external_confirm_no: "",
                    id: "",
                    is_from_rover: true
                };
            };

            self.getExternalData = function (reservationId) {
                var deferred = $q.defer(),
                    promises = [];

                self['extRef'] = {};

                promises.push(fetchExternalSystems().then(function (response) {
                    self['extRef']['systems'] = response;
                }));
                promises.push(fetchExternalReferences(reservationId).then(function (response) {
                    self['extRef']['references'] = response;
                }));

                $q.all(promises).then(function () {
                    deferred.resolve(self['extRef']);
                }, function (errorMessage) {
                    deferred.reject(errorMessage);
                });

                return deferred.promise;
            };
        }]);
    }, {}] }, {}, [1]);