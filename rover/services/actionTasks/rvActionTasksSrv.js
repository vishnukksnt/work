"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

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
        angular.module('sntRover').service('rvActionTasksSrv', ['$q', 'BaseWebSrvV2', 'rvUtilSrv', '$rootScope', 'dateFilter', '$filter', function ($q, BaseWebSrvV2, rvUtilSrv, $rootScope, dateFilter, $filter) {

            var self = this,
                filterState = null,
                dayMap = [$filter('translate')('SUNDAY'), $filter('translate')('MONDAY'), $filter('translate')('TUESDAY'), $filter('translate')('WEDNESDAY'), $filter('translate')('THURSDAY'), $filter('translate')('FRIDAY'), $filter('translate')('SATURDAY')];

            self.searchPerPage = 50;
            self.page = 1;
            self.to_date = "";

            this.getTasksCount = function (data) {
                var deferred = $q.defer();
                var url = "/api/reservations/" + data.id + '.json';

                BaseWebSrvV2.getJSON(url).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.getActionsTasksList = function (data) {
                var deferred = $q.defer();
                var url = '/api/action_tasks?associated_id=' + data.id + '&associated_type=Reservation';

                BaseWebSrvV2.getJSON(url).then(function (data) {
                    data.data.forEach(function (action) {
                        var completedTime, splitDueTimeString, splitCompletedTimeString;

                        action.assigned = action.assigned_to !== null;

                        if (_typeof(action.due_at) === _typeof('string')) {
                            splitDueTimeString = action.due_at_str.split('T');

                            // 24 hr format for the dropdown in the right panel
                            action.due_at_time_str = dateFilter(splitDueTimeString[0] + 'T' + splitDueTimeString[1].split(/[+-]/)[0], 'hh:mm a');
                            // 12 hr format for binding in the list

                            action.due_at_time = dateFilter(splitDueTimeString[0] + 'T' + splitDueTimeString[1].split(/[+-]/)[0], 'HH:mm');
                            action.due_at_date = dateFilter(splitDueTimeString[0], $rootScope.dateFormat);
                            action.hasDate = true;
                        } else {
                            action.hasDate = false;
                        }

                        if (action.action_status === 'COMPLETED') {
                            action.isCompleted = true;

                            completedTime = moment(action.completed_at);
                            splitCompletedTimeString = action.completed_at.split('T');

                            action.date_completed = completedTime.format($rootScope.dateFormat.toUpperCase());
                            action.time_completed = completedTime.format('HH:MM:A');

                            action.completed_date = dateFilter(splitCompletedTimeString[0], $rootScope.dateFormat);
                        }

                        if (action.created_at) {
                            action.created_at_time = $filter('date')(action.created_at, 'hh:mm a');
                            action.created_at_date = $filter('date')(action.created_at, $rootScope.dateFormat);
                        }
                    });

                    data.action_count = data.data.length;
                    data.pending_action_count = _.countBy(data.data, 'completed_at')["null"];
                    data.pending_action_count = data.pending_action_count || 0;
                    data.className = self.getActionsClassName(data.action_count, data.pending_action_count);

                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.fetchReportDetails = function (params) {
                var deferred = $q.defer();
                var url = "/api/reports/action_manager_report";

                BaseWebSrvV2.postJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.getActionsClassName = function (total, pending) {
                var className = '';

                if (total === 0) {
                    return 'none';
                }

                if (pending === 0) {
                    className = 'all-completed';
                } else if (total === pending) {
                    className = 'only-pending';
                } else {
                    className = 'pending';
                }

                return className;
            };

            this.syncActionCount = function (id) {
                var deferred = $q.defer();
                var url = "/api/action_tasks/sync_with_external_pms?reservation_id=" + id;

                BaseWebSrvV2.getJSON(url).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.postNewAction = function (params) {
                var deferred = $q.defer();
                var url = "/api/action_tasks.json";
                // ie::   reservation_id=1616903&action_task[description]=test

                BaseWebSrvV2.postJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.updateNewAction = function (params) {
                var deferred = $q.defer();
                var url = "/api/action_tasks/" + params.action_task.id + ".json";

                BaseWebSrvV2.putJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.completeAction = function (params) {
                var deferred = $q.defer();
                var url = "/api/action_tasks/" + params.action_task.id; // +'&is_complete='+params.is_complete;

                BaseWebSrvV2.putJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.fetchDepartments = function () {
                var deferred = $q.defer();
                var url = 'admin/departments.json';

                if (self.cache.responses['departments'] === null || Date.now() > self.cache.responses['departments']['expiryDate']) {
                    BaseWebSrvV2.getJSON(url).then(function (data) {
                        self.cache.responses['departments'] = {
                            data: data,
                            expiryDate: Date.now() + self.cache['config'].lifeSpan * 1000
                        };
                        deferred.resolve(data);
                    }, function (data) {
                        deferred.reject(data);
                    });
                } else {
                    deferred.resolve(self.cache.responses['departments']['data']);
                }
                return deferred.promise;
            };

            this.fetchGuestInfo = function (dataToSend) {
                var deferred = $q.defer();

                if (dataToSend) {
                    dataToSend.fakeDataToAvoidCache = new Date();
                }
                self.toDate = self.toDate === undefined ? "" : self.toDate;
                var url = 'search.json?per_page=' + self.searchPerPage + '&page=' + self.page;

                BaseWebSrvV2.getJSON(url, dataToSend).then(function (data) {
                    var results = data.data.results;

                    if (dataToSend.query) {
                        var first, last, room;
                        var str = dataToSend.query.toLowerCase();
                        var visible = 0;

                        for (var i in data.data.results) {
                            data.data.results[i].is_row_visible = false;
                            if (data.data.results[i].firstname) {
                                first = data.data.results[i].firstname.toLowerCase();
                                if (first.indexOf(str) !== -1) {
                                    data.data.results[i].is_row_visible = true;
                                    visible++;
                                }
                            }
                            if (data.data.results[i].lastname) {
                                last = data.data.results[i].lastname.toLowerCase();
                                if (last.indexOf(str) !== -1) {
                                    data.data.results[i].is_row_visible = true;
                                    visible++;
                                }
                            }
                            if (data.data.results[i].room) {
                                room = data.data.results[i].room.toLowerCase();
                                if (room.indexOf(str) !== -1) {
                                    data.data.results[i].is_row_visible = true;
                                    visible++;
                                }
                            }
                        }
                    }
                    data.queryTime = dataToSend.queryTime;
                    data.visibleRowCount = visible;
                    data.querySent = dataToSend.query;
                    // self.searchTypeStatus = dataToSend.status;
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });

                return deferred.promise;
            };

            this.fetchActions = function (params) {
                var deferred = $q.defer(),
                    url = "api/action_tasks/hotel_actions";

                BaseWebSrvV2.getJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.getActionDetails = function (actionId) {
                var deferred = $q.defer(),
                    url = "api/action_tasks/" + actionId;

                BaseWebSrvV2.getJSON(url).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.fetchCurrentTime = function () {
                var deferred = $q.defer();
                var url = '/api/hotel_current_time';

                BaseWebSrvV2.getJSON(url).then(function (data) {
                    deferred.resolve(rvUtilSrv.roundToNextQuarter(parseInt(data.hotel_time.hh, 10), parseInt(data.hotel_time.mm, 10)));
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.fetchGroupActions = function (params) {
                var deferred = $q.defer(),
                    url = "api/action_tasks/hotel_group_actions";

                BaseWebSrvV2.getJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };
            // Service to delete a action task
            this.deleteActionTask = function (taskId) {
                var deferred = $q.defer();
                var url = "/api/action_tasks/" + taskId;

                BaseWebSrvV2.deleteJSON(url).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            // -------------------------------------------------------------------------------------------------------------- CACHE CONTAINERS

            this.cache = {
                config: {
                    lifeSpan: 900 // in seconds
                },
                responses: {
                    departments: null
                }
            };

            self.setFilterState = function (params) {
                filterState = angular.copy(params);
            };

            self.getFilterState = function () {
                return filterState;
            };

            self.clearFilterState = function () {
                filterState = null;
            };

            self.getDateFromDate = function (d) {
                var day = new tzIndependentDate(d),
                    dayString = day.getDay();

                return dayMap[day.getDay()] || dayString;
            };

            self.getTimeFieldValues = function () {
                return ['0000', '0015', '0030', '0045', '0100', '0115', '0130', '0145', '0200', '0215', '0230', '0245', '0300', '0315', '0330', '0345', '0400', '0415', '0430', '0445', '0500', '0515', '0530', '0545', '0600', '0615', '0630', '0645', '0700', '0715', '0730', '0745', '0800', '0815', '0830', '0845', '0900', '0915', '0930', '0945', '1000', '1015', '1030', '1045', '1100', '1115', '1130', '1145', '1200', '1215', '1230', '1245', '1300', '1315', '1330', '1345', '1400', '1415', '1430', '1445', '1500', '1515', '1530', '1545', '1600', '1615', '1630', '1645', '1700', '1715', '1730', '1745', '1800', '1815', '1830', '1845', '1900', '1915', '1930', '1945', '2000', '2015', '2030', '2045', '2100', '2115', '2130', '2145', '2200', '2215', '2230', '2245', '2300', '2315', '2330', '2345'];
            };
        }]);
    }, {}] }, {}, [1]);