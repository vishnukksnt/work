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
        angular.module('sntRover').service('RVNightlyDiarySrv', ['$q', 'sntBaseWebSrv', '$rootScope', function ($q, sntBaseWebSrv, $rootScope) {

            var that = this;

            this.updateCache = function (data) {
                that.searchParamsCached = data;
            };
            this.getCache = function () {
                return that.searchParamsCached;
            };

            /*
             * To fetch the rooms list
             * @param {data} object
             * return object
             */
            this.fetchRoomsList = function (data) {

                var deferred = $q.defer(),
                    url = '/api/nightly_diary/room_list';

                sntBaseWebSrv.postJSON(url, data).then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });
                return deferred.promise;
            };

            /*
             * Service function to fetch date list
             * UI calculations to check the date is weekend or not.
             * Creating new array of objects with 'isWeekend' flag.
             * @return {Array} dates
             */
            this.fetchDatesList = function (data) {
                var deferred = $q.defer(),
                    dateArray = [];
                var url = '/api/nightly_diary/date_list';

                var paramsToApi = {},
                    responseObj = {};

                paramsToApi.start_date = data.start_date;
                paramsToApi.no_of_days = data.no_of_days;

                sntBaseWebSrv.getJSON(url, paramsToApi).then(function (response) {
                    angular.forEach(response.dates, function (item) {
                        var dateObj = tzIndependentDate(item);
                        var isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6 ? true : false;
                        var itemObj = {
                            'date': item,
                            'isWeekend': isWeekend
                        };

                        dateArray.push(itemObj);
                    });
                    responseObj = {
                        dates: dateArray,
                        hotelCheckinTime: response.hotel_checkin_time,
                        hotelCheckoutTime: response.hotel_checkout_time
                    };

                    deferred.resolve(responseObj);
                }, function (error) {
                    deferred.reject(error);
                });
                return deferred.promise;
            };
            /*
             * To fetch the reservations list
             * @param {data} object
             * return object
             */
            this.fetchReservationsList = function (data) {
                that.updateCache(data);
                var deferred = $q.defer();
                var url = '/api/nightly_diary/reservation_list';

                var paramsToApi = {};

                paramsToApi.start_date = data.start_date;
                paramsToApi.no_of_days = data.no_of_days;
                paramsToApi.page = data.page;
                paramsToApi.per_page = data.per_page;
                paramsToApi.selected_room_type_ids = data.selected_room_type_ids;
                paramsToApi.selected_floor_ids = data.selected_floor_ids;
                paramsToApi.selected_room_feature_ids = data.selected_room_feature_ids;

                sntBaseWebSrv.postJSON(url, paramsToApi).then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });
                return deferred.promise;
            };
            /*
             * To check room is available between dates
             * @param {data} object
             * return object
             */

            this.checkUpdateAvaibale = function (data) {
                var url = '/staff/change_stay_dates/' + data.reservation_id + '/update.json';

                var params = {
                    'arrival_date': data.arrival_date,
                    'dep_date': data.dep_date
                };
                var deferred = $q.defer();

                sntBaseWebSrv.getJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function (errorMessage) {
                    deferred.reject(errorMessage);
                });
                return deferred.promise;
            };

            /*
             * To check room is available between dates
             * @param {data} object
             * return object
             */
            this.validateStayChanges = function (params) {
                var url = '/api/nightly_diary/validate_stay_change',
                    deferred = $q.defer();

                sntBaseWebSrv.getJSON(url, params).then(function (data) {
                    deferred.resolve(data.result);
                }, function (errorMessage) {
                    deferred.reject(errorMessage);
                });
                return deferred.promise;
            };

            /*
             * updating the reservation
             * @param {data} object
             * return object
             */
            this.confirmUpdates = function (data) {
                var url = '/staff/change_stay_dates/' + data.reservation_id + '/confirm';

                var postData = {
                    'arrival_date': data.arrival_date,
                    'dep_date': data.dep_date,
                    'room_number': data.room_number,
                    'authorize_credit_card': data.authorize_credit_card,
                    'is_from_diary': true
                };
                var deferred = $q.defer();

                sntBaseWebSrv.postJSON(url, postData).then(function (data) {
                    deferred.resolve(data);
                }, function (errorMessage) {
                    deferred.reject(errorMessage);
                });
                return deferred.promise;
            };

            this.fetchRoomsListAndReservationList = function (params) {
                var deferred = $q.defer(),
                    data = {
                    roomList: null,
                    reservationList: null,
                    dateList: null
                };

                $q.when().then(function () {
                    return that.fetchRoomsList(params).then(function (response) {
                        data.roomList = response;
                    });
                }).then(function () {
                    params.page = data.roomList.page_number;
                    return that.fetchReservationsList(params).then(function (response) {
                        data.reservationList = response;
                    });
                }).then(function () {
                    return that.fetchDatesList(params).then(function (response) {
                        data.dateList = response;
                    });
                }).then(function () {
                    deferred.resolve(data);
                }, function (errorMessage) {
                    deferred.reject(errorMessage);
                });

                return deferred.promise;
            };

            /*
             * Fetch unassigned reservation lists
             * @param {data} object
             * return object
             */
            this.fetchUnassignedReservationList = function (params) {
                var deferred = $q.defer(),
                    url = '/api/nightly_diary/unassigned_reservations',
                    businessDate = $rootScope.businessDate;

                sntBaseWebSrv.getJSON(url, params).then(function (data) {
                    angular.forEach(data.reservations, function (item) {
                        item.statusClass = item.arrival_date === businessDate ? 'check-in' : 'no-status';
                        item.fullName = item.last_name + ' ' + item.first_name;
                    });
                    deferred.resolve(data);
                }, function (error) {
                    deferred.reject(error);
                });
                return deferred.promise;
            };

            /*
             * Fetch Available Rooms
             * @param {data} object
             * return object
             */
            this.retrieveAvailableRooms = function (params) {
                var deferred = $q.defer(),
                    url = '/api/nightly_diary/retrieve_available_rooms';

                sntBaseWebSrv.postJSON(url, params).then(function (data) {
                    deferred.resolve(data.data);
                }, function (error) {
                    deferred.reject(error);
                });
                return deferred.promise;
            };

            /*
             * Fetch Available free slots for booking reservation
             * @param {data} object
             * return object
             */
            this.retrieveAvailableFreeSlots = function (params) {
                var deferred = $q.defer(),
                    url = '/api/nightly_diary/availability';

                sntBaseWebSrv.postJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function (error) {
                    deferred.reject(error);
                });
                return deferred.promise;
            };

            /*
             * Assign Room in Diary
             * @param {data} object
             * return object
             */
            this.assignRoom = function (params) {
                var deferred = $q.defer(),
                    url = '/staff/reservation/modify_reservation';

                sntBaseWebSrv.postJSON(url, params).then(function (data) {
                    deferred.resolve(data.data);
                }, function (error) {
                    deferred.reject(error);
                });
                return deferred.promise;
            };

            /*
             * Fetch available time slots in Diary
             * @param {data} object
             * return object
             */
            this.fetchAvailableTimeSlots = function (params) {
                var deferred = $q.defer(),
                    url = '/api/nightly_diary/available_time_slots';

                sntBaseWebSrv.postJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function (error) {
                    deferred.reject(error);
                });
                return deferred.promise;
            };

            /*
             * Un-Assign Room in Diary
             * @param {data} object
             * return object
             */
            this.unAssignRoom = function (params) {
                var deferred = $q.defer(),
                    url = '/api/reservations/' + params.id + '/unassign_room';

                sntBaseWebSrv.postJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function (error) {
                    deferred.reject(error);
                });
                return deferred.promise;
            };

            /*
             *  Get prefrences of a reservation for filter
             */
            this.getPreferences = function (param) {
                var deferred = $q.defer(),
                    url = '/staff/preferences/room_assignment.json';

                sntBaseWebSrv.getJSON(url, param).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            // update billing info details
            this.updateBillingInformation = function (params) {
                var deferred = $q.defer(),
                    url = "api/bill_routings/update_dates";

                sntBaseWebSrv.postJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            /**
             * Initiate auoto-assign of rooms
             */
            this.initiateAutoAssignRooms = function (params) {
                var url = 'api/auto_room_assign_processes/auto_room_assignment';

                return sntBaseWebSrv.postJSON(url, params);
            };

            /**
             * Fetch auto-assign status
             */
            this.fetchAutoAssignStatus = function () {
                var url = 'api/auto_room_assign_processes/status';

                return sntBaseWebSrv.getJSON(url);
            };

            /**
             * Unlock Diary after auto-assign process
             */
            this.unlockRoomDiary = function () {
                var url = 'api/auto_room_assign_processes/unlock_diary';

                return sntBaseWebSrv.postJSON(url);
            };
        }]);
    }, {}] }, {}, [1]);