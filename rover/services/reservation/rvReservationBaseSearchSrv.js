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
        angular.module('sntRover').service('RVReservationBaseSearchSrv', ['$q', 'rvBaseWebSrvV2', 'sntBaseWebSrv', 'dateFilter', function ($q, RVBaseWebSrvV2, sntBaseWebSrv, dateFilter) {

            var that = this;

            this.reservation = {
                'settings': {},
                'roomTypes': {},
                'businessDate': {}
            };
            this.rateDetailsList = {};

            // -------------------------------------------------------------------------------------------------------------- CACHE CONTAINERS

            this.cache = {
                config: {
                    lifeSpan: 3600 // in seconds
                },
                responses: {
                    restrictionTypes: null,
                    rateDetails: null,
                    sortOrder: null,
                    taxMeta: null,
                    customMeta: null
                }
            };

            // -------------------------------------------------------------------------------------------------------------- CACHE CONTAINERS


            // This method returns the default view chosen in the Admin/Reservation/Reservation Settings
            this.getRoomRatesDefaultView = function () {
                var view = "ROOM_TYPE";

                if (that.reservation.settings && that.reservation.settings.default_rate_display_name) {
                    if (that.reservation.settings.default_rate_display_name === 'Recommended') {
                        view = "RECOMMENDED";
                    } else if (that.reservation.settings.default_rate_display_name === 'By Rate') {
                        view = "RATE";
                    }
                }
                return view;
            };

            this.getRoomTypeLevel = function (roomTypeId) {
                var level = -1;

                if (!!that.reservation.roomTypes) {
                    var roomTypeDetails = _.find(that.reservation.roomTypes, {
                        id: roomTypeId
                    });

                    level = roomTypeDetails.level;
                }
                return level;
            };

            this.timeSlots = [{ value: '12:00 AM', label: '12:00 AM', fullDayValue: 0 }, { value: '12:15 AM', label: '12:15 AM', fullDayValue: 15 }, { value: '12:30 AM', label: '12:30 AM', fullDayValue: 30 }, { value: '12:45 AM', label: '12:45 AM', fullDayValue: 45 }, { value: '01:00 AM', label: '01:00 AM', fullDayValue: 100 }, { value: '01:15 AM', label: '01:15 AM', fullDayValue: 115 }, { value: '01:30 AM', label: '01:30 AM', fullDayValue: 130 }, { value: '01:45 AM', label: '01:45 AM', fullDayValue: 145 }, { value: '02:00 AM', label: '02:00 AM', fullDayValue: 200 }, { value: '02:15 AM', label: '02:15 AM', fullDayValue: 215 }, { value: '02:30 AM', label: '02:30 AM', fullDayValue: 230 }, { value: '02:45 AM', label: '02:45 AM', fullDayValue: 245 }, { value: '03:00 AM', label: '03:00 AM', fullDayValue: 300 }, { value: '03:15 AM', label: '03:15 AM', fullDayValue: 315 }, { value: '03:30 AM', label: '03:30 AM', fullDayValue: 330 }, { value: '03:45 AM', label: '03:45 AM', fullDayValue: 345 }, { value: '04:00 AM', label: '04:00 AM', fullDayValue: 400 }, { value: '04:15 AM', label: '04:15 AM', fullDayValue: 415 }, { value: '04:30 AM', label: '04:30 AM', fullDayValue: 430 }, { value: '04:45 AM', label: '04:45 AM', fullDayValue: 445 }, { value: '05:00 AM', label: '05:00 AM', fullDayValue: 500 }, { value: '05:15 AM', label: '05:15 AM', fullDayValue: 515 }, { value: '05:30 AM', label: '05:30 AM', fullDayValue: 530 }, { value: '05:45 AM', label: '05:45 AM', fullDayValue: 545 }, { value: '06:00 AM', label: '06:00 AM', fullDayValue: 600 }, { value: '06:15 AM', label: '06:15 AM', fullDayValue: 615 }, { value: '06:30 AM', label: '06:30 AM', fullDayValue: 630 }, { value: '06:45 AM', label: '06:45 AM', fullDayValue: 645 }, { value: '07:00 AM', label: '07:00 AM', fullDayValue: 700 }, { value: '07:15 AM', label: '07:15 AM', fullDayValue: 715 }, { value: '07:30 AM', label: '07:30 AM', fullDayValue: 730 }, { value: '07:45 AM', label: '07:45 AM', fullDayValue: 745 }, { value: '08:00 AM', label: '08:00 AM', fullDayValue: 800 }, { value: '08:15 AM', label: '08:15 AM', fullDayValue: 815 }, { value: '08:30 AM', label: '08:30 AM', fullDayValue: 830 }, { value: '08:45 AM', label: '08:45 AM', fullDayValue: 845 }, { value: '09:00 AM', label: '09:00 AM', fullDayValue: 900 }, { value: '09:15 AM', label: '09:15 AM', fullDayValue: 915 }, { value: '09:30 AM', label: '09:30 AM', fullDayValue: 930 }, { value: '09:45 AM', label: '09:45 AM', fullDayValue: 945 }, { value: '10:00 AM', label: '10:00 AM', fullDayValue: 1000 }, { value: '10:15 AM', label: '10:15 AM', fullDayValue: 1015 }, { value: '10:30 AM', label: '10:30 AM', fullDayValue: 1030 }, { value: '10:45 AM', label: '10:45 AM', fullDayValue: 1045 }, { value: '11:00 AM', label: '11:00 AM', fullDayValue: 1100 }, { value: '11:15 AM', label: '11:15 AM', fullDayValue: 1115 }, { value: '11:30 AM', label: '11:30 AM', fullDayValue: 1130 }, { value: '11:45 AM', label: '11:45 AM', fullDayValue: 1145 }, { value: '12:00 PM', label: '12:00 PM', fullDayValue: 1200 }, { value: '12:15 PM', label: '12:15 PM', fullDayValue: 1215 }, { value: '12:30 PM', label: '12:30 PM', fullDayValue: 1230 }, { value: '12:45 PM', label: '12:45 PM', fullDayValue: 1245 }, { value: '01:00 PM', label: '01:00 PM', fullDayValue: 1300 }, { value: '01:15 PM', label: '01:15 PM', fullDayValue: 1315 }, { value: '01:30 PM', label: '01:30 PM', fullDayValue: 1330 }, { value: '01:45 PM', label: '01:45 PM', fullDayValue: 1345 }, { value: '02:00 PM', label: '02:00 PM', fullDayValue: 1400 }, { value: '02:15 PM', label: '02:15 PM', fullDayValue: 1415 }, { value: '02:30 PM', label: '02:30 PM', fullDayValue: 1430 }, { value: '02:45 PM', label: '02:45 PM', fullDayValue: 1445 }, { value: '03:00 PM', label: '03:00 PM', fullDayValue: 1500 }, { value: '03:15 PM', label: '03:15 PM', fullDayValue: 1515 }, { value: '03:30 PM', label: '03:30 PM', fullDayValue: 1530 }, { value: '03:45 PM', label: '03:45 PM', fullDayValue: 1545 }, { value: '04:00 PM', label: '04:00 PM', fullDayValue: 1600 }, { value: '04:15 PM', label: '04:15 PM', fullDayValue: 1615 }, { value: '04:30 PM', label: '04:30 PM', fullDayValue: 1630 }, { value: '04:45 AM', label: '04:45 PM', fullDayValue: 1645 }, { value: '05:00 PM', label: '05:00 PM', fullDayValue: 1700 }, { value: '05:15 PM', label: '05:15 PM', fullDayValue: 1715 }, { value: '05:30 PM', label: '05:30 PM', fullDayValue: 1730 }, { value: '05:45 PM', label: '05:45 PM', fullDayValue: 1745 }, { value: '06:00 PM', label: '06:00 PM', fullDayValue: 1800 }, { value: '06:15 PM', label: '06:15 PM', fullDayValue: 1815 }, { value: '06:30 PM', label: '06:30 PM', fullDayValue: 1830 }, { value: '06:45 PM', label: '06:45 PM', fullDayValue: 1845 }, { value: '07:00 PM', label: '07:00 PM', fullDayValue: 1900 }, { value: '07:15 PM', label: '07:15 PM', fullDayValue: 1915 }, { value: '07:30 PM', label: '07:30 PM', fullDayValue: 1930 }, { value: '07:45 PM', label: '07:45 PM', fullDayValue: 1945 }, { value: '08:00 PM', label: '08:00 PM', fullDayValue: 2000 }, { value: '08:15 PM', label: '08:15 PM', fullDayValue: 2015 }, { value: '08:30 PM', label: '08:30 PM', fullDayValue: 2030 }, { value: '08:45 PM', label: '08:45 PM', fullDayValue: 2045 }, { value: '09:00 PM', label: '09:00 PM', fullDayValue: 2100 }, { value: '09:15 PM', label: '09:15 PM', fullDayValue: 2115 }, { value: '09:30 PM', label: '09:30 PM', fullDayValue: 2130 }, { value: '09:45 PM', label: '09:45 PM', fullDayValue: 2145 }, { value: '10:00 PM', label: '10:00 PM', fullDayValue: 2200 }, { value: '10:15 PM', label: '10:15 PM', fullDayValue: 2215 }, { value: '10:30 PM', label: '10:30 PM', fullDayValue: 2230 }, { value: '10:45 PM', label: '10:45 PM', fullDayValue: 2245 }, { value: '11:00 PM', label: '11:00 PM', fullDayValue: 2300 }, { value: '11:15 PM', label: '11:15 PM', fullDayValue: 2315 }, { value: '11:30 PM', label: '11:30 PM', fullDayValue: 2330 }, { value: '11:45 PM', label: '11:45 PM', fullDayValue: 2345 }];

            this.fetchBaseSearchData = function () {
                var deferred = $q.defer();

                that.fetchBussinessDate = function () {
                    var url = '/api/business_dates/active';

                    RVBaseWebSrvV2.getJSON(url).then(function (data) {
                        that.reservation.businessDate = data.business_date;
                        deferred.resolve(that.reservation);
                    }, function (errorMessage) {
                        deferred.reject(errorMessage);
                    });
                    return deferred.promise;
                };

                that.fetchRoomTypes = function () {
                    var url = 'api/room_types.json?exclude_pseudo=true&per_page=100';

                    RVBaseWebSrvV2.getJSON(url).then(function (data) {
                        that.reservation.roomTypes = data.results;
                        that.fetchBussinessDate();
                    }, function (errorMessage) {
                        deferred.reject(errorMessage);
                    });
                    return deferred.promise;
                };

                if (isEmpty(that.reservation.settings) && isEmpty(that.reservation.roomTypes) && isEmpty(that.reservation.businessDate)) {
                    var url = '/api/hotel_settings/show_hotel_reservation_settings';

                    RVBaseWebSrvV2.getJSON(url).then(function (data) {
                        that.reservation.settings = data;
                        that.fetchRoomTypes();
                    }, function (errorMessage) {
                        deferred.reject(errorMessage);
                    });
                } else {
                    deferred.resolve(that.reservation);
                }

                return deferred.promise;
            };

            this.fetchCompanyCard = function (data) {
                var deferred = $q.defer();
                var url = '/api/accounts';

                RVBaseWebSrvV2.getJSON(url, data).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.autoCompleteCodes = function (data) {
                var deferred = $q.defer();
                var url = '/api/code_search';

                RVBaseWebSrvV2.getJSON(url, data).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.fetchCurrentTime = function (start_date) {
                var deferred = $q.defer(),
                    url = '/api/hotel_current_time';

                RVBaseWebSrvV2.getJSON(url).then(function (data) {
                    if (start_date && typeof start_date === 'string') {
                        data.hotel_time.date = start_date;
                    }
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.fetchAvailability = function (param) {
                var deferred = $q.defer();
                var url = '/api/availability?from_date=' + param.from_date + '&to_date=' + param.to_date + '&override_restrictions=true';

                if (!!param.company_id) {
                    url += '&company_id=' + param.company_id;
                }

                if (!!param.travel_agent_id) {
                    url += '&travel_agent_id=' + param.travel_agent_id;
                }

                if (!!param.group_id) {
                    url += '&group_id=' + param.group_id;
                }

                if (!!param.promotion_code) {
                    url += '&promotion_code=' + encodeURI(param.promotion_code); // to handle special characters
                }

                if (!!param.allotment_id) {
                    url += '&allotment_id=' + encodeURI(param.allotment_id);
                }

                RVBaseWebSrvV2.getJSON(url).then(function (data) {
                    deferred.resolve(data);
                }, function (errorMessage) {
                    deferred.reject(errorMessage);
                });
                return deferred.promise;
            };
            this.fetchMinTime = function () {
                var deferred = $q.defer();
                var url = '/api/hourly_rate_min_hours';

                RVBaseWebSrvV2.getJSON(url).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.fetchSortPreferences = function () {
                var deferred = $q.defer(),
                    url = '/api/sort_preferences/list_selections';

                if (that.cache.responses['sortOrder'] === null || Date.now() > that.cache.responses['sortOrder']['expiryDate']) {
                    RVBaseWebSrvV2.getJSON(url).then(function (data) {
                        that.cache.responses['sortOrder'] = {
                            data: data.room_rates,
                            expiryDate: Date.now() + that.cache['config'].lifeSpan * 1000
                        };
                        deferred.resolve(data.room_rates);
                    }, function (data) {
                        deferred.reject(data);
                    });
                } else {
                    deferred.resolve(that.cache.responses['sortOrder']['data']);
                }
                return deferred.promise;
            };

            this.fetchAddonsForRates = function (params) {
                var deferred = $q.defer(),
                    url = '/api/addons/rate_addons';

                RVBaseWebSrvV2.getJSON(url, params).then(function (data) {
                    deferred.resolve(data.rate_addons);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.hasAnyConfiguredAddons = function (params) {
                var deferred = $q.defer();
                var url = '/api/addons/configured';

                RVBaseWebSrvV2.getJSON(url, params).then(function (data) {
                    deferred.resolve(data.addons_configured);
                }, function (errorMessage) {
                    deferred.reject(errorMessage);
                });
                return deferred.promise;
            };

            this.getActivePromotions = function () {
                var deferred = $q.defer();
                var url = '/api/promotions?is_active=true';

                RVBaseWebSrvV2.getJSON(url).then(function (data) {
                    deferred.resolve(data);
                }, function (errorMessage) {
                    deferred.reject(errorMessage);
                });
                return deferred.promise;
            };

            this.fetchUserMemberships = function (guestId) {
                var deferred = $q.defer();
                var url = '/staff/user_memberships.json?user_id=' + guestId;

                RVBaseWebSrvV2.getJSON(url).then(function (response) {
                    deferred.resolve(response.data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.checkOverbooking = function (params) {
                var deferred = $q.defer();
                var url = '/api/availability/overbooking_check';

                RVBaseWebSrvV2.getJSON(url, params).then(function (response) {
                    deferred.resolve(response.results);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.checkDiaryAvailability = function (params) {
                var deferred = $q.defer(),
                    url = '/api/nightly_diary/availability';

                RVBaseWebSrvV2.postJSON(url, params).then(function (response) {
                    deferred.resolve(response);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.fetchOrdinaryRates = function (params) {
                var deferred = $q.defer();
                var url = '/api/availability/rates';

                RVBaseWebSrvV2.getJSON(url, params).then(function (response) {
                    deferred.resolve(response);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.fetchContractRates = function (params) {
                var deferred = $q.defer();
                var url = '/api/availability/contracts';

                RVBaseWebSrvV2.getJSON(url, params).then(function (response) {
                    deferred.resolve(response);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.fetchGroupRates = function (params) {
                var deferred = $q.defer(),
                    groupId = params.group_id || params.allotment_id;

                var url = '/api/availability/groups/' + groupId;

                RVBaseWebSrvV2.getJSON(url, params).then(function (response) {
                    deferred.resolve(response);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.fetchRates = function (params) {
                var deferred = $q.defer(),
                    promises = [];

                that['rates'] = [];

                // Make this call IFF there is a group/ allotment attached
                if (params.group_id) {
                    promises.push(that.fetchGroupRates(params).then(function (response) {
                        _.each(response.rates, function (rate) {
                            if (rate.id === null) {
                                rate.id = '_CUSTOM_' + params.group_id;
                            }
                        });
                        that['rates'] = that['rates'].concat(response.rates);
                    }));
                } else {
                    promises.push(that.fetchOrdinaryRates(params).then(function (response) {

                        that['rates'] = that['rates'].concat(response.rates);
                    }));

                    // Make this call IFF there is a company / TA card attached
                    if (!!params.company_id || !!params.travel_agent_id) {
                        promises.push(that.fetchContractRates(params).then(function (response) {
                            _.each(response.rates, function (rate) {
                                rate.isCorporate = true;
                            });
                            that['rates'] = that['rates'].concat(response.rates);
                        }));
                    }
                }

                $q.all(promises).then(function () {
                    deferred.resolve(that['rates']);
                }, function (errorMessage) {
                    deferred.reject(errorMessage);
                });

                return deferred.promise;
            };

            this.fetchRestricitonTypes = function () {
                var deferred = $q.defer(),
                    url = '/api/restriction_types';

                if (that.cache.responses['restrictionTypes'] === null || Date.now() > that.cache.responses['restrictionTypes'].expiryDate) {
                    RVBaseWebSrvV2.getJSON(url).then(function (data) {
                        data.results.push({
                            id: 98,
                            value: "INVALID_PROMO",
                            description: "PROMOTION INVALID",
                            activated: true
                        });

                        data.results.push({
                            id: 99,
                            activated: true,
                            value: 'HOUSE_FULL',
                            description: 'NO HOUSE AVAILABILITY'
                        });

                        var restriction_types = {};

                        _.each(data.results, function (resType) {
                            restriction_types[resType.id] = {
                                key: resType.value,
                                value: ['CLOSED', 'CLOSED_ARRIVAL', 'CLOSED_DEPARTURE', 'HOUSE_FULL', 'INVALID_PROMO'].indexOf(resType.value) > -1 ? resType.description : resType.description + ':'
                            };
                        });

                        that.cache.responses['restrictionTypes'] = {
                            data: restriction_types,
                            expiryDate: Date.now() + that.cache['config'].lifeSpan * 1000
                        };

                        deferred.resolve(restriction_types);
                    }, function (data) {
                        deferred.reject(data);
                    });
                } else {
                    deferred.resolve(that.cache.responses['restrictionTypes']['data']);
                }
                return deferred.promise;
            };
            /**
             * Method for remove rate id's with cache.
             * @constructor
             * @param {Object} params - Object with rate id's
             * @return {Array} list of rate id's which are not available in cache
             */
            var formFilteredRateIds = function formFilteredRateIds(params) {
                var fetchList = _.reject(params.rate_ids, function (rate_id) {
                    if (!!that.rateDetailsList[rate_id] && Date.now() < that.rateDetailsList[rate_id]['expiryDate']) {
                        return true;
                    }
                    return false;
                });

                return fetchList;
            };

            /**
             * Method for fetch rate details.
             * @constructor
             * @param {Object} params - Object with rate id's
             * @return {Object} promise
             */
            this.fetchRatesDetails = function (params) {
                var fetchRateListIds = formFilteredRateIds(params),
                    deferred = $q.defer(),
                    url = '/api/rates/search.json',
                    payload = {};

                payload['rate_ids'] = fetchRateListIds;
                if (fetchRateListIds.length === 0) {
                    deferred.resolve({});
                } else {
                    RVBaseWebSrvV2.postJSON(url, payload).then(function (response) {
                        _.each(response.results, function (rate) {
                            that.rateDetailsList[rate.id] = {
                                expiryDate: Date.now() + that.cache['config'].lifeSpan * 1000,
                                details: rate };
                        });
                        deferred.resolve(response.results);
                    }, function (data) {
                        deferred.reject(data);
                    });
                }

                return deferred.promise;
            };

            this.fetchCustomRateConfig = function () {
                var deferred = $q.defer(),
                    url = 'api/rates/custom_group_rate_taxes';

                if (that.cache.responses['customMeta'] === null || Date.now() > that.cache.responses['customMeta']['expiryDate']) {
                    RVBaseWebSrvV2.getJSON(url).then(function (response) {
                        var customMeta = response;

                        that.cache.responses['customMeta'] = {
                            data: customMeta,
                            expiryDate: Date.now() + that.cache['config'].lifeSpan * 1000
                        };
                        deferred.resolve(customMeta);
                    }, function (data) {
                        deferred.reject(data);
                    });
                } else {
                    deferred.resolve(that.cache.responses['customMeta']['data']);
                }
                return deferred.promise;
            };

            this.fetchRatesMeta = function (params) {
                var deferred = $q.defer(),
                    promises = [];

                that['rates-restrictions'] = {};
                promises.push(that.fetchRestricitonTypes(params).then(function (response) {
                    that['rates-restrictions']['restrictions'] = response;
                }));

                promises.push(that.fetchCustomRateConfig().then(function (response) {
                    that['rates-restrictions']['customRates'] = response;
                }));

                $q.all(promises).then(function () {
                    deferred.resolve(that['rates-restrictions']);
                }, function (errorMessage) {
                    deferred.reject(errorMessage);
                });

                return deferred.promise;
            };

            this.fetchTaxInformation = function () {
                var deferred = $q.defer(),
                    url = 'api/rates/tax_information';

                if (that.cache.responses['taxMeta'] === null || Date.now() > that.cache.responses['taxMeta']['expiryDate']) {
                    RVBaseWebSrvV2.getJSON(url).then(function (response) {
                        var taxMeta = response.tax_codes;

                        that.cache.responses['taxMeta'] = {
                            data: taxMeta,
                            expiryDate: Date.now() + that.cache['config'].lifeSpan * 1000
                        };
                        deferred.resolve(taxMeta);
                    }, function (data) {
                        deferred.reject(data);
                    });
                } else {
                    deferred.resolve(that.cache.responses['taxMeta']['data']);
                }
                return deferred.promise;
            };

            this.fetchHouseAvailability = function (params) {
                var deferred = $q.defer(),
                    url = 'api/availability/house';

                RVBaseWebSrvV2.getJSON(url, params).then(function (response) {
                    var houseAvailbility = {};

                    _.each(response.results, function (availability) {
                        houseAvailbility[availability.date] = availability.availability;
                    });
                    deferred.resolve(houseAvailbility);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.fetchHouseRestrictions = function (params) {
                var deferred = $q.defer(),
                    url = '/api/availability/house_restrictions';

                RVBaseWebSrvV2.getJSON(url, params).then(function (response) {
                    deferred.resolve(response.restrictions);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.fetchTaxRateAddonMeta = function (params) {
                var deferred = $q.defer(),
                    promises = [];

                that['meta'] = {};

                promises.push(that.fetchTaxInformation().then(function (response) {
                    that['meta']['taxInfo'] = response;
                }));
                promises.push(that.fetchAddonsForRates(params).then(function (response) {
                    that['meta']['rateAddons'] = response;
                }));

                $q.all(promises).then(function () {
                    deferred.resolve(that['meta']);
                }, function (errorMessage) {
                    deferred.reject(errorMessage);
                });

                return deferred.promise;
            };

            /**
             * Fetches hotel settings configured in admin
             */
            this.fetchHotelReservationSettings = function () {
                var deferred = $q.defer(),
                    url = "/api/hotel_settings/show_hotel_reservation_settings";

                RVBaseWebSrvV2.getJSON(url).then(function (data) {
                    deferred.resolve(data);
                }, function (errorMessage) {
                    deferred.reject(errorMessage);
                });

                return deferred.promise;
            };
            /**
             * Method for searching rate.
             * @constructor
             * @param {Object} params - Object with query .
             */
            this.searchForRates = function (params) {
                var deferred = $q.defer(),
                    payload = {},
                    url = "/api/rates.json?&sort_dir=true&sort_field=rate";

                payload['query'] = params.query;
                payload['per_page'] = 25;
                payload['page'] = 1;
                RVBaseWebSrvV2.getJSON(url, payload).then(function (data) {
                    deferred.resolve(data);
                }, function (errorMessage) {
                    deferred.reject(errorMessage);
                });

                return deferred.promise;
            };

            this.fetchRateDetailsForIds = function (params) {
                var fetchRateListIds = formFilteredRateIds(params),
                    deferred = $q.defer(),
                    url = '/api/rates/search.json',
                    payload = {};

                payload['rate_ids'] = fetchRateListIds;
                if (fetchRateListIds.length === 0) {
                    deferred.resolve({});
                } else {
                    RVBaseWebSrvV2.postJSON(url, payload).then(function (response) {
                        _.each(response.results, function (rate) {
                            that.rateDetailsList[rate.id] = {
                                expiryDate: Date.now() + that.cache['config'].lifeSpan * 1000,
                                details: rate };
                        });
                        var cachedRateIds = _.difference(params.rate_ids, fetchRateListIds);

                        _.each(cachedRateIds, function (rateId) {
                            response.results.push(that.rateDetailsList[rateId].details);
                        });
                        deferred.resolve(response.results);
                    }, function (data) {
                        deferred.reject(data);
                    });
                }

                return deferred.promise;
            };

            /**
             * checkTimeBasedAvailability for FULL mode hotels.
             */
            this.checkTimeBasedAvailabilityAPI = function (params) {
                var deferred = $q.defer(),
                    url = "api/availability/time_based_room_type_and_house_avl";

                sntBaseWebSrv.postJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function (errorMessage) {
                    deferred.reject(errorMessage);
                });

                return deferred.promise;
            };
        }]);
    }, {}] }, {}, [1]);