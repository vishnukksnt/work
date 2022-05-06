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
        sntRover.controller('rvTACardPropertiesCommissionsPopupCtrl', ['$scope', '$rootScope', '$filter', '$timeout', 'rvUtilSrv', 'ngDialog', function ($scope, $rootScope, $filter, $timeout, util, ngDialog) {
            BaseCtrl.call(this, $scope);
            var scrollerOptions = {
                tap: true,
                preventDefault: false,
                showScrollbar: true
            };

            $scope.clickedCancel = function () {
                ngDialog.close();
            };

            $scope.saveChanges = function () {
                $scope.$emit("saveContactInformation", {
                    'hotel_info_changed_from_popup': true,
                    'other_hotels_info': $scope.hotelCommissionDetails
                });
            };

            /*
            * Initialization method
            */
            var init = function init() {
                // Create deep copy for elimintaing the outside click event which checks for changes in the model
                $scope.hotelCommissionDetails = angular.copy($scope.contactInformation.commission_details.other_hotels_info);
                $scope.setScroller('rvTACardPropertiesCommissionsScroll', scrollerOptions);
                $timeout(function () {
                    $scope.refreshScroller('rvTACardPropertiesCommissionsScroll');
                }, 2000);
            };

            init();
        }]);
    }, {}] }, {}, [1]);