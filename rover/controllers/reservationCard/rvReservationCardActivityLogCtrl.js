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
        sntRover.controller('rvReservationCardActivityLogCtrl', ['$scope', '$filter', '$stateParams', '$rootScope', '$state', '$timeout', function ($scope, $filter, $stateParams, $rootScope, $state, $timeout) {
            $scope.activityLog = "";

            var init = function init() {

                var hideLog = true;

                $scope.activityLog = {
                    hideDetails: hideLog
                };
            };

            $scope.toggleActivityLogDetails = function () {
                $scope.activityLog.hideDetails = !$scope.activityLog.hideDetails;
                $scope.refreshScroller('resultDetails');
                $timeout(function () {
                    $scope.$parent.myScroll['resultDetails'].scrollTo($scope.$parent.myScroll['resultDetails'].maxScrollX, $scope.$parent.myScroll['resultDetails'].maxScrollY, 500);
                }, 500);
            };

            $scope.showDetails = function () {
                $state.go('rover.reservation.staycard.activitylog', {
                    id: $scope.reservationData.reservation_card.reservation_id
                });
            };
            init();
        }]);
    }, {}] }, {}, [1]);