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
        angular.module('sntRover').service('RVGuestCardsSrv', ['$q', 'rvBaseWebSrvV2', 'sntBaseWebSrv', '$rootScope', '$log', '$http', function ($q, RVBaseWebSrvV2, sntBaseWebSrv, $rootScope, $log, $http) {

            var guestFieldData = {},
                service = this,
                governmentIdTypes,
                _guest = {
                id: null,
                isFetched: false
            };

            service.setGuest = function (id) {
                service.resetGuest();
                _guest.id = parseInt(id, 10);
            };

            service.isGuestFetchComplete = function (id) {
                id = parseInt(id, 10);
                return _guest.id === id && _guest.isFetched;
            };

            service.resetGuest = function () {
                _guest.id = null;
                _guest.isFetched = false;
            };

            this.PER_PAGE_COUNT = 50;

            service.fetchGuestDetails = function (param) {
                var deferred = $q.defer(),
                    url = '/api/guest_details/' + param;

                if (!$rootScope.isStandAlone) {
                    url += "?sync_with_external_pms=true";
                }

                if (!_guest.id) {
                    $log.debug('Guest not set!');
                    deferred.reject(['Guest not set']);
                } else {
                    sntBaseWebSrv.getJSON(url).then(function (data) {
                        _guest.isFetched = true;
                        deferred.resolve(data);
                    }, function (data) {
                        deferred.reject(data);
                    });
                }
                return deferred.promise;
            };
            /*
             * Fetch admin settings
             *
             */
            service.fetchGuestAdminSettings = function () {
                var deferred = $q.defer();
                var url = '/admin/guest_card_settings/current_settings';

                sntBaseWebSrv.getJSON(url).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.fetchGuestAdminSettingsAndGender = function (param) {

                var deferred = $q.defer(),
                    data = {},
                    promises = [];

                promises.push($q.when().then(function () {
                    return service.fetchGuestAdminSettings(param).then(function (response) {
                        data.guest_admin_settings = response;
                    });
                }));
                promises.push($q.when().then(function () {
                    return service.fetchGenderTypes().then(function (response) {
                        data.genderTypeList = response;
                    });
                }));
                promises.push($q.when().then(function () {
                    return service.fetchIdTypes().then(function (response) {
                        data.idTypeList = response;
                    });
                }));
                $q.all(promises).then(function () {
                    deferred.resolve(data);
                }, function (errorMessage) {
                    deferred.reject(errorMessage);
                });

                return deferred.promise;
            };

            this.fetchGuestDetailsInformation = function (param) {

                var deferred = $q.defer(),
                    data = {},
                    promises = [];

                promises.push(service.fetchGuestDetails(param));
                promises.push(service.fetchGuestAdminSettingsAndGender());

                $q.all(promises).then(function (response) {
                    data = response[0];
                    data.guest_admin_settings = response[1].guest_admin_settings;
                    data.genderTypeList = response[1].genderTypes;
                    deferred.resolve(data);
                }, function (errorMessage) {
                    deferred.reject(errorMessage);
                });

                return deferred.promise;
            };

            /**
             * Fetch guest details
             * @param {object} param request object
             * @return {Promise} promise
             */
            this.fetchGuests = function (param) {

                var deferred = $q.defer(),
                    url = '/api/guest_details';

                sntBaseWebSrv.getJSON(url, param).then(function (data) {
                    // _guest.isFetched = true;
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };
            /*
             * CICO-63251
             * @return object
             */
            this.setGuestFields = function () {
                return guestFieldData;
            };

            /*
             * CICO-63251
             * @return object
             */
            this.setGuestFields = function () {
                return guestFieldData;
            };

            /**
             * Fetch guest card statistics summary
             * @param {Object} params request params
             * @return {Promise} promise
             */
            this.fetchGuestCardStatisticsSummary = function (params) {
                var deferred = $q.defer(),
                    url = '/api/guest_details/' + params.guestId + '/statistics?view=SUMMARY';

                delete params.guestId;

                RVBaseWebSrvV2.getJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            /**
             * Fetch guest card statistics details
             * @param {Object} params request params
             * @return {Promise} promise
             */
            this.fetchGuestCardStatisticsDetails = function (params) {
                var deferred = $q.defer(),
                    url = '/api/guest_details/' + params.guestId + '/statistics?view=DETAILED';

                delete params.guestId;

                RVBaseWebSrvV2.getJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            var _countryList = [];

            this.fetchNationsList = function () {
                var deferred = $q.defer();
                var url = '/ui/country_list';

                if (_countryList.length) {
                    deferred.resolve(_countryList);
                } else {
                    RVBaseWebSrvV2.getJSON(url).then(function (data) {
                        _countryList = data;
                        deferred.resolve(data);
                    }, function (data) {
                        deferred.reject(data);
                    });
                }

                return deferred.promise;
            };

            this.saveGuestIdDetails = function (params) {
                //var url = '/api/guest_identity/'+ params.reservation_id +'/save_id_details';

                var url = '/api/guest_identity';

                return RVBaseWebSrvV2.postJSON(url, params);
            };

            this.saveFaceImage = function (params) {
                var url = '/staff/guest_cards/' + params.guest_id + '.json';

                return RVBaseWebSrvV2.putJSON(url, params);
            };

            /**
             * Verify whether the given guest cards are eligible for being merged
             * @param {Object} params contains array of ids of the guest cards
             * @return {Promise} promise
             */
            this.verifyGuestCardMerge = function (params) {
                var deferred = $q.defer(),
                    url = '/api/guest_details/validate_card_merge';

                RVBaseWebSrvV2.postJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            /**
             * Merge the non-primary cards to primary card
             * @param {Object} params contains primary card id, non-primary card ids and card type
             * @return {Promise} promise
             */
            this.mergeCards = function (params) {
                var deferred = $q.defer(),
                    url = '/api/guest_details/merge_cards';

                RVBaseWebSrvV2.postJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.fetchGenderTypes = function () {
                var deffered = $q.defer(),
                    url = 'api/guest_details/gender_types';

                sntBaseWebSrv.getJSON(url).then(function (data) {
                    deffered.resolve(data.gender_list);
                }, function (error) {
                    deffered.resolve(error);
                });

                return deffered.promise;
            };

            /**
             * Service to get the government id types
             * @return {Promise} promise
             */
            this.fetchIdTypes = function () {
                var deffered = $q.defer(),
                    url = 'api/guest_details/government_id_types';

                if (governmentIdTypes) {
                    deffered.resolve(governmentIdTypes);
                } else {
                    sntBaseWebSrv.getJSON(url).then(function (data) {
                        governmentIdTypes = data.id_type_list;
                        deffered.resolve(governmentIdTypes);
                    }, function (error) {
                        deffered.resolve(error);
                    });
                }

                return deffered.promise;
            };

            /**
             * Fetch guest list 
             * @param {object} param request object
             * @return {Promise} promise
             */
            this.fetchGuestList = function (data) {
                var url = '/api/guest_details',
                    deferred = $q.defer();

                var httpConfig = {
                    method: 'GET',
                    url: url,
                    params: data
                };

                $http(httpConfig).then(function (response) {
                    var resp = {
                        data: response.data,
                        params: response.config && response.config.params
                    };

                    deferred.resolve(resp);
                }, function (response) {
                    RVBaseWebSrvV2.webserviceErrorActions(url, deferred, response.data, response.status);
                });

                return deferred.promise;
            };
        }]);
    }, {}] }, {}, [1]);