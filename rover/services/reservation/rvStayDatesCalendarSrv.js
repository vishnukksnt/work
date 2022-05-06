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
        angular.module('sntRover').service('RVStayDatesCalendarSrv', ['$q', 'rvBaseWebSrvV2', 'RVBaseWebSrv', '$filter', function ($q, RVBaseWebSrvV2, RVBaseWebSrv, $filter) {

            var that = this;

            this.availabilityData = {};

            this.lastFetchedDate = "";

            var calendarDataCache = {
                expiryLimit: 60, // seconds
                reponses: []
            };

            this.fetchCalendarData = function (params) {
                var deferred = $q.defer();
                var url = '/api/calendar_availability',
                    cachedData = _.findWhere(calendarDataCache.reponses, {
                    from: params.from_date,
                    to: params.to_date
                });

                if (cachedData && Math.floor(Date.now() / 1000) - cachedData.timeStamp < calendarDataCache.expiryLimit) {
                    deferred.resolve(cachedData.response);
                } else {

                    if (!cachedData) {
                        calendarDataCache.reponses.push({
                            from: params.from_date,
                            to: params.to_date
                        });
                    }

                    RVBaseWebSrvV2.getJSON(url, params).then(function (response) {
                        deferred.resolve(response);

                        cachedData = _.findWhere(calendarDataCache.reponses, {
                            from: params.from_date,
                            to: params.to_date
                        });

                        cachedData.response = response;
                        cachedData.timeStamp = Math.floor(Date.now() / 1000);
                    }, function (errorMessage) {
                        deferred.reject(errorMessage);
                    });
                }

                return deferred.promise;
            };

            this.fetchAvailability = function (params) {
                // If its a request to fetch the additional, then fetch the next set of availability data
                // based on the last_fetched date
                var deferred = $q.defer();
                var url = '/api/availability';

                RVBaseWebSrvV2.getJSON(url, params).then(function (response) {
                    // We save the last fetched date info to enable caching.
                    // For every subsequent fetch requensts we fetch next set of dates
                    that.lastFetchedDate = tzIndependentDate(params.to_date);
                    if (params.status !== 'FETCH_ADDITIONAL') {

                        that.availabilityData = dclone(response);
                        // response.results is an array. We would keep it as a hash indexed with date
                        that.availabilityData.results = {};
                    }
                    that.manipulateAvailabilityForEasyLookup(response);
                    deferred.resolve(that.availabilityData);
                }, function (errorMessage) {
                    deferred.reject(errorMessage);
                });
                return deferred.promise;
            };

            /**
             * Manipulate the availability API response for the availablility
             * Instead of arrays, we create hash with date as index.
             * Also the rates are grouped for each room type - again a hash with room_type_id as index
             * Also we calculate the best available rate - the lowest rate for a day
             */
            this.manipulateAvailabilityForEasyLookup = function (data) {
                var availability = {};
                // loop1

                angular.forEach(data.results, function (dayDetails, index) {
                    var dayInfo = {};

                    dayInfo.date = dayDetails.date;
                    dayInfo.house = dayDetails.house;
                    dayInfo.BAR = that.getBestAvailableRateForTheDay(dayDetails.rates, dayDetails.room_types);
                    // loop2
                    angular.forEach(dayDetails.room_types, function (roomType, i) {
                        // Get the lowest rate for the room type
                        dayInfo[roomType.id] = that.getLowestRateForRoomType(roomType, dayDetails.rates);
                    });
                    that.availabilityData.results[dayDetails.date] = dayInfo;
                });
            };

            /**
             * @return {hash} The rate_id and the lowest roomrate for the rate
             * irrespective of the room type
             */
            this.getBestAvailableRateForTheDay = function (ratesForTheDay, allRoomTypes) {
                var rateForSingleRoom = null;
                var lowestRate = {};
                var rateId = "";

                angular.forEach(ratesForTheDay, function (rate, rateIndex) {
                    // loop1 - we have to search among all room rates
                    // not considering the room type and find the lowest rate
                    angular.forEach(rate.room_rates, function (roomRate, roomRateIndex) {
                        if (rateForSingleRoom === null) {
                            rateForSingleRoom = roomRate.single;
                        }
                        if (parseFloat(roomRate.single) <= parseFloat(rateForSingleRoom)) {
                            rateForSingleRoom = roomRate.single;
                            lowestRate = roomRate;
                            rateId = rate.id;
                        }
                    });
                });

                var dict = {};

                dict.rate_id = rateId;
                dict.room_type_availability = {};
                // Get the room type availability details looping through all room types.
                angular.forEach(allRoomTypes, function (roomType, roomTypeIndex) {
                    if (roomType.id === lowestRate.room_type_id) {
                        dict.room_type_availability = roomType;
                        return false; // exit from the loop
                    }
                });

                dict.room_rates = lowestRate;
                return dict;
            };

            /**
             * @return {hash} The rate_id and the lowest roomrate for the rate
             * for the given room type
             */
            this.getLowestRateForRoomType = function (roomType, ratesForDay) {
                var rateForSingleRoom = null;
                var lowestRate = {};
                var rateId = "";

                angular.forEach(ratesForDay, function (rate, rateIndex) {
                    // loop1 - we need to display only the lowest rate in the UI. For a room type
                    angular.forEach(rate.room_rates, function (roomRate, roomRateIndex) {
                        if (roomRate.room_type_id === roomType.id) {
                            if (rateForSingleRoom === null) {
                                rateForSingleRoom = roomRate.single;
                            }
                            if (parseFloat(roomRate.single) <= parseFloat(rateForSingleRoom)) {
                                rateForSingleRoom = roomRate.single;
                                lowestRate = roomRate;
                                rateId = rate.id;
                            }
                            return false; // exit form loop1 - //we are searching for rates with a room type id.
                            // other room rates in this loop will be having different room types.
                            // so go to the next rate.
                        }
                    });
                });

                var dict = {};

                dict.rate_id = rateId;
                dict.room_type_availability = roomType;
                dict.room_rates = lowestRate;
                return dict;
            };
        }]);
    }, {}] }, {}, [1]);