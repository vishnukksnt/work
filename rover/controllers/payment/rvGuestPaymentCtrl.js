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
        sntRover.controller('RVPaymentGuestCtrl', ['$rootScope', '$scope', '$state', 'RVPaymentSrv', 'ngDialog', function ($rootScope, $scope, $state, RVPaymentSrv, ngDialog) {
            BaseCtrl.call(this, $scope);

            $scope.$on('clearNotifications', function () {
                $scope.errorMessage = '';
                $scope.successMessage = '';
            });

            /*
             * To open new payment modal screen from guest card
             */

            $scope.updateErrorMessage = function (message) {
                $scope.errorMessage = message;
            };

            $scope.openAddNewPaymentModel = function () {

                // NOTE: Need to send payment methods from here
                $scope.callAPI(RVPaymentSrv.renderPaymentScreen, {
                    params: { 'direct_bill': false },
                    onSuccess: function onSuccess(response) {
                        var creditCardPaymentTypeObj = _.find(response, function (obj) {
                            return obj.name === 'CC';
                        });
                        var passData = {
                            'guest_id': $scope.guestCardData.contactInfo.user_id,
                            'isFromGuestCard': true,
                            'details': {
                                'firstName': $scope.guestCardData.contactInfo.first_name,
                                'lastName': $scope.guestCardData.contactInfo.last_name
                            }
                        };
                        var paymentData = $scope.paymentData;
                        // NOTE : As of now only guest cards can be added as payment types and associated with a guest card

                        paymentData.paymentTypes = [creditCardPaymentTypeObj];
                        $scope.openPaymentDialogModal(passData, paymentData);
                    }
                });
            };
            /*
            * To open set as as primary or delete payment
            */
            $scope.openDeleteSetAsPrimaryModal = function (id, index) {
                $scope.paymentData.payment_id = id;
                $scope.paymentData.index = index;

                ngDialog.open({
                    template: '/assets/partials/payment/rvDeleteSetAsPrimary.html',
                    controller: 'RVDeleteSetAsPrimaryCtrl',
                    scope: $scope
                });
            };

            $scope.$on('ADDEDNEWPAYMENTTOGUEST', function (event, data) {
                if (typeof $scope.paymentData.data === 'undefined') {
                    $scope.paymentData.data = [];
                }
                // In case of a duplicate addition
                if (!_.find($scope.paymentData.data, { id: data.id })) {
                    $scope.paymentData.data.push(data);
                }

                $scope.refreshScroller('paymentList');
            });

            (function () {
                var scrollerOptions = { preventDefault: false };

                $scope.setScroller('paymentList', scrollerOptions);
                $scope.$on('$viewContentLoaded', function () {
                    $scope.refreshScroller('paymentList');
                });
                $scope.$on('REFRESHLIKESSCROLL', function () {
                    $scope.refreshScroller('paymentList');
                });
            })();
        }]);
    }, {}] }, {}, [1]);