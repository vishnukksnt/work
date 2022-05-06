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
        sntRover.controller('rvReservationCardLoyaltyController', ['$rootScope', '$scope', 'ngDialog', 'RVLoyaltyProgramSrv', function ($rootScope, $scope, ngDialog, RVLoyaltyProgramSrv) {
            BaseCtrl.call(this, $scope);
            var GMSData = {};

            $scope.isLoyaltySelected = function () {
                $scope.showSelectedLoyalty = true;
                var selectedLoyalty = $scope.$parent.reservationData.reservation_card.loyalty_level.selected_loyalty;

                if (selectedLoyalty === null || typeof selectedLoyalty === 'undefined' || selectedLoyalty === '' || selectedLoyalty === {}) {
                    $scope.showSelectedLoyalty = false;
                }
            };
            $scope.showLoyaltyProgramDialog = function () {
                var GMSDialog = {
                    template: '/assets/partials/reservationCard/rvGMSLoyality.html',
                    controller: 'rvGMSLoyalityController',
                    className: 'ngdialog-theme-default',
                    scope: $scope,
                    data: GMSData,
                    preCloseCallback: $scope.loadLoyaltyPrograms
                },
                    AddLoyaltyProgramDiaolg = {
                    template: '/assets/partials/reservationCard/rvAddLoyaltyProgramDialog.html',
                    controller: 'rvAddLoyaltyProgramController',
                    className: 'ngdialog-theme-default',
                    scope: $scope
                };

                // Disable the feature when the reservation is checked out
                if (!$scope.$parent.isNewsPaperPreferenceAvailable()) {
                    return;
                }
                // If GMS setting and membership feature is on, show GMS iframe, else default - CICO-50633 & CICO-60486
                if (GMSData.GMSSettings && GMSData.GMSSettings.membership_feature && GMSData.GMSSettings.enabled) {
                    ngDialog.open(GMSDialog);
                } else {
                    ngDialog.open(AddLoyaltyProgramDiaolg);
                }
            };

            $scope.$on('loyaltyProgramAdded', function (e, data, source) {

                if (data.membership_class === 'HLP') {
                    $scope.$parent.reservationData.reservation_card.loyalty_level.hotelLoyaltyProgram.push(data);
                } else {
                    $scope.$parent.reservationData.reservation_card.loyalty_level.frequentFlyerProgram.push(data);
                }
                if (source === 'fromReservationCard') {
                    $scope.$parent.reservationData.reservation_card.loyalty_level.selected_loyalty = data.id;
                    $scope.selectedLoyaltyID = data.id;
                    $scope.selectedLoyalty = data;

                    if (_.isString($scope.selectedLoyalty.membership_card_number)) {
                        $scope.selectedLoyalty.membership_card_number = $scope.selectedLoyalty.membership_card_number.substr($scope.selectedLoyalty.membership_card_number.length - 4);
                    }
                }

                $scope.$parent.reservationCardSrv.updateResrvationForConfirmationNumber($scope.$parent.reservationData.reservation_card.confirmation_num, $scope.$parent.reservationData);
                $scope.isLoyaltySelected();
            });
            $scope.$on('loyaltyProgramDeleted', function (e, id, index, loyaltyProgram) {
                if (loyaltyProgram === 'FFP') {
                    $scope.$parent.reservationData.reservation_card.loyalty_level.frequentFlyerProgram.splice(index, 1);
                } else {
                    $scope.$parent.reservationData.reservation_card.loyalty_level.hotelLoyaltyProgram.splice(index, 1);
                }
                var selectedLoyalty = $scope.selectedLoyalty;

                // CICO-56459 Remove the selection when the selected FFP/HLP is deleted from guest card
                if (selectedLoyalty && id === selectedLoyalty.id) {
                    $scope.$parent.reservationData.reservation_card.loyalty_level.selected_loyalty = null;
                    $scope.selectedLoyaltyID = '';
                }
                $scope.$parent.reservationCardSrv.updateResrvationForConfirmationNumber($scope.$parent.reservationData.reservation_card.confirmation_num, $scope.$parent.reservationData);
                $scope.isLoyaltySelected();
            });
            $scope.setSelectedLoyaltyForID = function (id) {
                var hotelLoyaltyProgram = $scope.$parent.reservationData.reservation_card.loyalty_level.hotelLoyaltyProgram;
                var freequentFlyerprogram = $scope.$parent.reservationData.reservation_card.loyalty_level.frequentFlyerProgram;

                var use_ffp = $scope.$parent.reservationData.use_ffp,
                    use_hlp = $scope.$parent.reservationData.use_hlp;
                var flag = false;
                // doing null check as when, no guest card attached the hotelLoyaltyProgram variable has null

                if (hotelLoyaltyProgram !== null && $rootScope.isHLPActive) {
                    for (var i = 0; i < hotelLoyaltyProgram.length; i++) {
                        if (parseInt(id, 10) === parseInt(hotelLoyaltyProgram[i].id, 10)) {
                            flag = true;
                            $scope.selectedLoyalty = hotelLoyaltyProgram[i];
                            $scope.selectedLoyaltyID = hotelLoyaltyProgram[i].id;
                            $scope.$parent.reservationData.reservation_card.loyalty_level.selected_loyalty = hotelLoyaltyProgram[i].id;
                            break;
                        }
                    }
                }
                if (flag) {
                    return true;
                }
                if (freequentFlyerprogram !== null && $rootScope.isFFPActive) {
                    for (var i = 0; i < freequentFlyerprogram.length; i++) {
                        if (parseInt(id, 10) === parseInt(freequentFlyerprogram[i].id, 10)) {
                            flag = true;
                            $scope.selectedLoyalty = freequentFlyerprogram[i];
                            $scope.selectedLoyaltyID = freequentFlyerprogram[i].id;
                            $scope.$parent.reservationData.reservation_card.loyalty_level.selected_loyalty = freequentFlyerprogram[i].id;
                            break;
                        }
                    }
                }
                return flag;
            };

            $scope.setSelectedLoyalty = function (id) {
                var isSelectedSet = $scope.setSelectedLoyaltyForID(id);

                if (!isSelectedSet) {
                    $scope.selectedLoyalty = '';
                    $scope.selectedLoyaltyID = '';
                    $scope.$parent.reservationData.reservation_card.loyalty_level.selected_loyalty = '';
                }
                $scope.isLoyaltySelected();
            };
            $scope.loadLoyaltyPrograms = function () {
                if ($scope.$parent.$parent.refreshingReservation || $scope.reservationData.justCreatedRes) {
                    $rootScope.goToReservationCalled = true;
                    $rootScope.$broadcast('reload-loyalty-section-data', { 'reload': true });
                }
            };
            $scope.callSelectLoyaltyAPI = function (id) {
                $scope.selectedLoyaltyID = id;
                var successCallback = function successCallback() {
                    $scope.setSelectedLoyalty($scope.selectedLoyaltyID);
                    $scope.$parent.reservationCardSrv.updateResrvationForConfirmationNumber($scope.$parent.reservationData.reservation_card.confirmation_num, $scope.$parent.reservationData);
                    $scope.isLoyaltySelected();
                    var selectedLevel = '';

                    // Checking whether the selected loyalty id belongs to FFP
                    var selectedLoyalty = _.find($scope.reservationData.reservation_card.loyalty_level.frequentFlyerProgram, { id: $scope.selectedLoyaltyID });

                    // Checks whether the given loyalty id belongs to HLP
                    if (!selectedLoyalty) {
                        selectedLoyalty = _.find($scope.reservationData.reservation_card.loyalty_level.hotelLoyaltyProgram, { id: $scope.selectedLoyaltyID });
                    }

                    if (selectedLoyalty) {
                        selectedLevel = selectedLoyalty.membership_level;
                    }

                    $rootScope.$broadcast('loyaltyLevelAvailable', selectedLevel);
                    $scope.$parent.$emit('hideLoader');
                };
                var errorCallback = function errorCallback(errorMessage) {
                    $scope.setSelectedLoyalty($scope.$parent.reservationData.reservation_card.loyalty_level.selected_loyalty);
                    $scope.isLoyaltySelected();
                    $scope.$parent.$emit('hideLoader');
                    $scope.$parent.errorMessage = errorMessage;
                };
                var params = {};

                params.reservation_id = $scope.$parent.reservationData.reservation_card.reservation_id;
                params.membership_id = $scope.selectedLoyaltyID;
                $scope.invokeApi(RVLoyaltyProgramSrv.selectLoyalty, params, successCallback, errorCallback);
            };

            $scope.$on('detect-hlps-ffp-active-status', function (evt, data) {
                if (data.userMemberships.use_hlp) {
                    $scope.loyaltyProgramsActive(true);
                    $scope.$parent.reservationData.use_hlp = true;
                } else {
                    $scope.loyaltyProgramsActive(false);
                    $scope.$parent.reservationData.use_hlp = false;
                }

                if (data.userMemberships.use_ffp) {
                    $scope.ffpProgramsActive(true);
                    $scope.$parent.reservationData.use_ffp = true;
                } else {
                    $scope.ffpProgramsActive(false);
                    $scope.$parent.reservationData.use_ffp = false;
                }
            });

            $scope.loyaltyProgramsActive = function (b) {
                $scope.hotelLoyaltyProgramEnabled = b;
                $scope.$parent.reservationData.use_hlp = b;
            };
            $scope.ffpProgramsActive = function (b) {
                $scope.hotelFrequentFlyerProgramEnabled = b;
                $scope.$parent.reservationData.use_ffp = b;
            };

            // Checks whether the loyalty section section should be shown or not based on the admin settings
            // FFP/HLP can be enabled/disabled from the admin settings - Guest cards setup    
            $scope.shouldShowLoyalty = function () {
                var shouldShow = $scope.reservationData.use_hlp || $scope.reservationData.use_ffp || $scope.$parent.reservationData.use_hlp || $scope.$parent.reservationData.use_ffp || $scope.reservationData.reservation_card.loyalty_level && $scope.reservationData.reservation_card.loyalty_level.use_ffp || $scope.reservationData.reservation_card.loyalty_level && $scope.reservationData.reservation_card.loyalty_level.use_hlp;

                return shouldShow;
            };

            var getGMSSettings = function getGMSSettings() {
                var params = {},
                    successCallback = function successCallback(data) {
                    GMSData.GMSSettings = data;
                },
                    options = {
                    params: params,
                    successCallBack: successCallback
                };

                $scope.callAPI(RVLoyaltyProgramSrv.getGMSSettings, options);
            },
                init = function init() {
                $scope.selectedLoyaltyID = '';
                $scope.selectedLoyalty = {};
                GMSData.guestInfo = $scope.reservationParentData.guest;
                $scope.hotelLoyaltyProgramEnabled = true;
                $scope.setSelectedLoyaltyForID($scope.$parent.reservationData.reservation_card.loyalty_level.selected_loyalty);
                $scope.isLoyaltySelected();
                getGMSSettings();
            };

            init();
        }]);
    }, {}] }, {}, [1]);