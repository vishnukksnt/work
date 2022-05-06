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
        sntRover.controller('RVPleaseSwipeCtrl', ['$rootScope', '$scope', 'sntPaymentSrv', function ($rootScope, $scope, sntPaymentSrv) {
            BaseCtrl.call(this, $scope);

            $scope.state = {
                numAttempts: 0
            };

            $scope.addCardOWS = function () {
                $scope.$emit("SHOW_SIX_PAY_LOADER");

                $scope.callAPI(sntPaymentSrv.getSixPaymentToken, {
                    params: {
                        reservation_id: $scope.reservationBillData.reservation_id,
                        workstation_id: $scope.workstation_id
                    },
                    successCallBack: function successCallBack() {
                        $scope.$emit('REFRESH_BILLCARD_VIEW');
                        $scope.$emit("HIDE_SIX_PAY_LOADER");
                        $scope.closeDialog();
                    },
                    failureCallBack: function failureCallBack(err) {
                        $scope.state.numAttempts++;
                        $scope.errorMessage = err;
                        $scope.$emit("HIDE_SIX_PAY_LOADER");
                    }
                });
            };
        }]);
    }, {}] }, {}, [1]);