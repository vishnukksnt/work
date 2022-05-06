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
        angular.module('sntRover').service('RVContactInfoSrv', ['$q', 'RVBaseWebSrv', 'rvBaseWebSrvV2', function ($q, RVBaseWebSrv, rvBaseWebSrvV2) {

            var service = this;

            service.saveContactInfo = function (param) {
                var deferred = $q.defer(),
                    dataToSend = param.data,
                    userId = param.userId,
                    url = '/staff/guest_cards/' + userId;

                RVBaseWebSrv.putJSON(url, dataToSend).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            service.createGuest = function (param) {
                var deferred = $q.defer();
                var dataToSend = param.data;
                var url = '/api/guest_details';

                rvBaseWebSrvV2.postJSON(url, dataToSend).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            service.updateGuest = function (param) {
                var deferred = $q.defer(),
                    url = '/api/guest_details/' + param.userId;

                if (param.check_validation_only) {
                    url += '?check_validation_only=true';
                }

                rvBaseWebSrvV2.putJSON(url, param.data).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            service.fetchGuestLanguages = function (param) {
                var deferred = $q.defer();
                var url = '/api/guest_languages';

                rvBaseWebSrvV2.getJSON(url, param).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            /**
             * Remove guest details except first name and last name
             * @param {Number} guestId id of the guest
             * @return {Promise} Promise
             */
            service.removeGuestDetails = function (guestId) {
                var deferred = $q.defer(),
                    url = '/api/guest_details/' + guestId + '/anonymize';

                rvBaseWebSrvV2.putJSON(url).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            /**
             * Get guest details info by id
             * @param {Number} guestId id of the guest
             * @return {Promise} Promise
             */
            service.getGuestDetailsById = function (guestId) {
                var deffered = $q.defer(),
                    url = '/api/guest_details/' + guestId;

                if (guestId === null) {
                    deffered.reject([""]);
                } else {
                    rvBaseWebSrvV2.getJSON(url).then(function (data) {
                        deffered.resolve(data);
                    }, function (error) {
                        deffered.reject(error);
                    });
                }

                return deffered.promise;
            };

            /**
             * Parse the api response data and convert it into the format required for view
             * @param {object} apiResponseData data from API
             * @return {object} guestData formatted data
             */
            service.parseGuestData = function (apiResponseData, guestId) {
                var guestData = {};

                guestData.id = guestId;
                guestData.firstName = apiResponseData.first_name;
                guestData.lastName = apiResponseData.last_name;
                guestData.image = apiResponseData.image_url;
                guestData.vip = apiResponseData.vip;
                if (apiResponseData.address) {
                    guestData.address = {};
                    guestData.address.city = apiResponseData.address.city;
                    guestData.address.state = apiResponseData.address.state;
                    guestData.address.postalCode = apiResponseData.address.postal_code;
                }
                guestData.stayCount = apiResponseData.stay_count;
                guestData.lastStay = {};
                guestData.phone = apiResponseData.home_phone;
                guestData.email = apiResponseData.email;

                if (apiResponseData.last_stay) {
                    guestData.lastStay.date = apiResponseData.last_stay.date;
                    guestData.lastStay.room = apiResponseData.last_stay.room;
                    guestData.lastStay.roomType = apiResponseData.last_stay.room_type;
                }

                return guestData;
            };

            /**
             * Delete guest by id
             * @param {Number} guestId id of the guest
             * @return {Promise} Promise
             */
            service.deleteGuest = function (guestId) {
                var deffered = $q.defer(),
                    url = '/api/guest_details/' + guestId;

                rvBaseWebSrvV2.deleteJSON(url).then(function (data) {
                    deffered.resolve(data);
                }, function (error) {
                    deffered.reject(error);
                });

                return deffered.promise;
            };

            service.checkIfCommisionWasRecalculated = function (param) {
                var deferred = $q.defer();
                var url = '/api/reservations/' + param.reservation_id + '/commission_transaction_info';

                rvBaseWebSrvV2.getJSON(url).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };
        }]);
    }, {}] }, {}, [1]);