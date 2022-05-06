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
        angular.module('sntRover').controller('RVCheckInAuthCtrl', ['$scope', '$rootScope', '$log', 'RVCCAuthorizationSrv', 'rvPermissionSrv', function ($scope, $rootScope, $log, RVCCAuthorizationSrv, rvPermissionSrv) {

            var isShijiOffline = function isShijiOffline() {
                return $rootScope.hotelDetails.payment_gateway === 'SHIJI' && $rootScope.hotelDetails.shiji_token_enable_offline;
            };

            $scope.onClickContinueWithoutCC = function () {
                $scope.$emit('CONTINUE_CHECKIN', $scope.authResponse);
            };

            $scope.authorize = function () {
                var params = {};

                // CICO-43933
                if ($scope.checkInState.swipedCardData) {
                    params = angular.copy($scope.checkInState.swipedCardData);
                }

                params = _.extend(params, {
                    is_emv_request: $scope.ngDialogData.is_emv_request,
                    amount: $scope.ngDialogData.amount || 0,
                    payment_method_id: $scope.ngDialogData.payment_method_id,
                    reservation_id: $scope.ngDialogData.reservation_id
                });

                if (isShijiOffline()) {
                    params.auth_code = $scope.authData.auth_code;
                    params.amount = $scope.authData.amount;
                }
                params.isShift4Request = $rootScope.hotelDetails.payment_gateway === 'SHIFT4';

                $scope.callAPI(RVCCAuthorizationSrv.manualAuthorization, {
                    params: params,
                    successCallBack: function successCallBack(response) {
                        $scope.authResponse = response;
                        $scope.authState = 'SUCCESS';
                        if (isShijiOffline()) {
                            $scope.onClickContinueWithoutCC();
                        }
                    },
                    failureCallBack: function failureCallBack(response) {
                        $scope.authResponse = response;
                        $scope.authState = 'FAILURE';
                    }
                });
            };

            $scope.onClickContinue = function () {
                $scope.$emit('CONTINUE_CHECKIN', $scope.authResponse);
            };

            $scope.cancelAuthProcess = function () {
                $scope.$emit('STOP_CHECKIN_PROCESS');
            };

            (function () {
                $scope.authState = 'IN_PROGRESS';
                $scope.authResponse = {};
                $scope.canCheckInWithoutCC = rvPermissionSrv.getPermissionValue('OVERRIDE_CC_AUTHORIZATION');
                if (isShijiOffline()) {
                    $scope.authData = {
                        amount: angular.copy($scope.ngDialogData.amount),
                        auth_code: ''
                    };
                } else {
                    $scope.authorize();
                }
            })();
        }]);
    }, {}] }, {}, [1]);