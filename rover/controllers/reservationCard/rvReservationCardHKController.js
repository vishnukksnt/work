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
        sntRover.controller('rvReservationCardHKController', ['$scope', '$filter', '$stateParams', '$rootScope', '$state', '$timeout', 'rvReservationHouseKeepingSrv', function ($scope, $filter, $stateParams, $rootScope, $state, $timeout, rvReservationHouseKeepingSrv) {

            BaseCtrl.call(this, $scope);

            /**
             * Callled when the switch is changed. calls save api
             */
            $scope.toggleService = function () {
                $scope.houseKeeping.serviceEnabled = $scope.houseKeeping.serviceEnabled ? false : true;

                $scope.save({
                    is_room_service_opted: $scope.houseKeeping.serviceEnabled
                });
            };

            /**
             * Calls save api. fired when selecting task for a work type
             */
            $scope.selectDefaultTask = function (workType) {
                var params;

                if (!workType.default_task && workType.old_default_task == workType.default_task) {
                    return;
                }

                params = {
                    old_task_id: workType.old_default_task,
                    new_task_id: workType.default_task
                };

                workType.old_default_task = workType.default_task;
                $scope.save(params);
            };

            var toggleDetails = function toggleDetails() {
                $scope.houseKeeping.hideDetails = $scope.houseKeeping.hideDetails ? false : true;

                $scope.refreshScroller('resultDetails');
                $timeout(function () {
                    $scope.$parent.myScroll['resultDetails'].scrollTo($scope.$parent.myScroll['resultDetails'].maxScrollX, $scope.$parent.myScroll['resultDetails'].maxScrollY, 500);
                }, 500);
            };

            var saveTasksSuccessCallBack = function saveTasksSuccessCallBack(data) {
                // ..
            };

            var saveTasksFailureCallBack = function saveTasksFailureCallBack(error) {
                $scope.errorMessage = error;
            };

            /**
             * [Description]
             * @return {undefined}
             */
            $scope.save = function (extraParams) {
                // call put api
                var params = _.extend(extraParams, {
                    reservation_id: $scope.reservationData.reservation_card.reservation_id
                });

                var options = {
                    params: params,
                    successCallBack: saveTasksSuccessCallBack,
                    failureCallBack: saveTasksFailureCallBack
                };

                $scope.callAPI(rvReservationHouseKeepingSrv.save, options);
            };

            var fetchInitialDataSuccessCallBack = function fetchInitialDataSuccessCallBack(data) {
                $scope.houseKeeping.workTypes = data.work_types;
                $scope.houseKeeping.serviceEnabled = data.is_room_service_opted;
                $scope.houseKeeping.reservationTasks = data.reservation_tasks;
                $scope.houseKeeping.defaultWorkTyoe = data.default_work_type;

                // pair up data.
                $scope.houseKeeping.workTypes.forEach(function (workType) {
                    workType.default_task = '';
                    workType.old_default_task = '';
                    var configured = _.findWhere($scope.houseKeeping.reservationTasks, {
                        work_type_id: workType.id
                    });

                    if (configured) {
                        workType.default_task = configured.task_id;
                        workType.old_default_task = configured.task_id;
                    }
                });

                // since we successfuly fetched the api
                apiInit = true;

                // show details after initial api load
                // since we fetch data after opening
                toggleDetails();
            };

            var fetchInitialDataFailureCallBack = function fetchInitialDataFailureCallBack(error) {
                $scope.errorMessage = error;
            };

            // has api called atleast once
            var apiInit = false;

            /**
             * All inital API calls.
             * 1. Fetch list of work types and tasks configured to show on show card
             * @return {undefined}
             */
            var callInitialAPIs = function callInitialAPIs() {
                var options = {
                    params: { reservation_id: $scope.reservationData.reservation_card.reservation_id },
                    successCallBack: fetchInitialDataSuccessCallBack,
                    failureCallBack: fetchInitialDataFailureCallBack
                };

                $scope.callAPI(rvReservationHouseKeepingSrv.fetch, options);
            };

            // Note: self executing
            var init = function () {
                $scope.houseKeeping = {};
                $scope.houseKeeping.serviceEnabled = true;
                $scope.houseKeeping.hideDetails = true;
                $scope.roomAttendance = false;
            }();

            // keep here since we have few var dependecies
            $scope.toggleHKDetails = function () {
                $scope.roomAttendance = !$scope.roomAttendance;
                if (apiInit) {
                    toggleDetails();
                } else {
                    callInitialAPIs();
                }
            };
        }]);
    }, {}] }, {}, [1]);