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
        sntRover.controller('RVAllContactInfoDatePickerController', ['$scope', '$rootScope', 'ngDialog', 'dateFilter', function ($scope, $rootScope, ngDialog, dateFilter) {

            $scope.setUpData = function () {
                $scope.dateOptions = {
                    changeYear: true,
                    changeMonth: true,
                    maxDate: tzIndependentDate($rootScope.businessDate),
                    yearRange: "-100:+0",
                    onSelect: function onSelect(dateText, inst) {
                        dateText = moment(dateText, "MM/DD/YYYY").format("YYYY-MM-DD");
                        if ($scope.calenderFor === 'idDate') {
                            $scope.guestCardData.contactInfo.id_issue_date = dateText;
                        }
                        if ($scope.calenderFor === 'entryDate') {
                            $scope.guestCardData.contactInfo.entry_date = dateText;
                        }
                        if ($scope.calenderFor === 'birthday') {
                            $scope.guestCardData.contactInfo.birthday = dateText;
                        }
                        if ($scope.calenderFor === 'validate') {
                            $scope.saveData.birth_day = dateText;
                        }
                        if ($scope.datePicker) {
                            ngDialog.close($scope.datePicker.id);
                        } else {
                            ngDialog.close();
                        }
                    }
                };
                if ($scope.calenderFor === 'idExpirationDate' || $scope.calenderFor === 'idExpirationDateValidate') {
                    $scope.dateOptions = {
                        changeYear: true,
                        changeMonth: true,
                        yearRange: "-100:+10",
                        onSelect: function onSelect(dateText, inst) {
                            dateText = moment(dateText, "MM/DD/YYYY").format("YYYY-MM-DD");
                            $scope.guestCardData.contactInfo.id_expiration_date = dateText;
                            if ($scope.calenderFor === 'idExpirationDateValidate') {
                                $scope.saveData.id_expiration_date = dateText;
                            }
                            if ($scope.datePicker) {
                                ngDialog.close($scope.datePicker.id);
                            } else {
                                ngDialog.close();
                            }
                        }
                    };
                }
            };
            $scope.setUpData();
        }]);
    }, {}] }, {}, [1]);