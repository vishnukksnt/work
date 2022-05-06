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
        angular.module('sntRover').service('RVRoomRatesSrv', ['$q', 'rvBaseWebSrvV2', 'RVReservationBaseSearchSrv', function ($q, RVBaseWebSrvV2, RVReservationBaseSearchSrv) {

            var service = this;
            // --------------------------------------------------------------------------------------------------------------
            // A. Private Methods
            var getInitialRoomTypeWithUpSell = function getInitialRoomTypeWithUpSell(params) {
                var deferred = $q.defer();

                service.fetchRoomTypeADRs(params, true).then(function (response) {
                    if (response.results.length > 0) {
                        var levelOfBestRoom = RVReservationBaseSearchSrv.getRoomTypeLevel(response.results[0].id);

                        if (levelOfBestRoom > 0 && levelOfBestRoom < 3) {
                            var baseResults = response;
                            // Get the best room from the next level; If not found; stick to the original set of two

                            service.fetchRoomTypeADRs(params, false, levelOfBestRoom + 1).then(function (response) {
                                if (response.results > 0) {
                                    baseResults.results[2] = response.results[1];
                                }
                                deferred.resolve(baseResults);
                            }, function (err) {
                                deferred.reject(err);
                            });
                        } else {
                            deferred.resolve(response);
                        }
                    } else {
                        deferred.resolve(response);
                    }
                }, function (err) {
                    deferred.reject(err);
                });
                return deferred.promise;
            };

            /**
            * Prepare the parameters for the room type and rate tab request
            */
            var processParamsForRoomTypeAndRateRequest = function processParamsForRoomTypeAndRateRequest(params) {
                var currentRoomAndRateActiveView = service.getRoomAndRateActiveTab();

                if (currentRoomAndRateActiveView === "RATE" || currentRoomAndRateActiveView === "ROOM_TYPE") {
                    params.is_member = "false";

                    if (params.company_id) {
                        delete params.company_id;
                    }
                    if (params.travel_agent_id) {
                        delete params.travel_agent_id;
                    }
                    if (params.promotion_code) {
                        delete params.promotion_code;
                    }
                    if (params.promotion_id) {
                        delete params.promotion_id;
                    }
                }
            };

            // --------------------------------------------------------------------------------------------------------------
            // B. Private Methods

            service.fetchRoomTypeADRs = function (params, isInitial, level) {
                var deferred = $q.defer(),
                    url = "/api/availability/room_type_adrs";

                if (isInitial) {
                    params.per_page = 2;
                    params.page = 1;
                    params.order = "ROOM_LEVEL";
                }
                if (level) {
                    params.per_page = 1;
                    params.page = 1;
                    params.level = level;
                }
                // CICO-27146
                params.exclude_pseudo = true;
                params.exclude_suite = true;

                processParamsForRoomTypeAndRateRequest(params);

                RVBaseWebSrvV2.getJSON(url, params).then(function (response) {
                    var payload = {};

                    payload.rate_ids = _.uniq(_.pluck(response.results, 'rate_id'));
                    RVReservationBaseSearchSrv.fetchRatesDetails(payload).then(function () {
                        if (!!params.group_id) {
                            _.each(response.results, function (roomType) {
                                if (roomType.rate_id === null) {
                                    roomType.rate_id = '_CUSTOM_' + params.group_id;
                                }
                            });
                        }
                        deferred.resolve(response);
                    });
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            service.fetchRateADRs = function (params) {
                var deferred = $q.defer(),
                    url = "/api/availability/rate_adrs";
                // CICO-27146

                params.exclude_pseudo = true;
                params.exclude_suite = true;

                processParamsForRoomTypeAndRateRequest(params);

                RVBaseWebSrvV2.getJSON(url, params).then(function (response) {
                    var payload = {};

                    payload.rate_ids = _.pluck(response.results, 'id');

                    if (params.arrivalDateRateId) {
                        payload.rate_ids.push(params.arrivalDateRateId);
                    }
                    RVReservationBaseSearchSrv.fetchRatesDetails(payload).then(function () {
                        if (!!params.group_id) {
                            _.each(response.results, function (roomType) {
                                if (roomType.id === null) {
                                    roomType.rate_id = '_CUSTOM_' + params.group_id;
                                    roomType.id = '_CUSTOM_' + params.group_id;
                                }
                            });
                        }
                        deferred.resolve(response);
                    });
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            service.fetchRatesInitial = function (params) {
                var activeView = service.getRoomAndRateActiveTab(),
                    promises = [],
                    deferred = $q.defer(),
                    data = [];

                if (activeView === "RATE" || activeView === "RECOMMENDED" && (params.company_id || params.travel_agent_id || params.group_id || params.promotion_code || params.promotion_id || params.is_member)) {
                    params.order = "RATE";
                    promises.push(service.fetchRateADRs(params, true).then(function (response) {
                        data = response;
                    }));
                } else if (activeView === "ROOM_TYPE") {
                    promises.push(getInitialRoomTypeWithUpSell(params, true).then(function (response) {
                        data = response;
                    }));
                }

                $q.all(promises).then(function () {
                    deferred.resolve(data);
                }, function (errorMessage) {
                    deferred.reject(errorMessage);
                });

                return deferred.promise;
            };

            // Set the room and rates active tab
            service.setRoomAndRateActiveTab = function (view) {
                service.roomAndRateActiveTab = view;
            };

            // Get the current active tab in room and rates screen
            service.getRoomAndRateActiveTab = function () {
                return service.roomAndRateActiveTab;
            };

            // --------------------------------------------------------------------------------------------------------------
            // C. Cache
        }]);
    }, {}] }, {}, [1]);