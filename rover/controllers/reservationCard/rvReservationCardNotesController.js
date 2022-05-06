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
        sntRover.controller('rvReservationCardNotesController', ['$scope', '$filter', '$rootScope', 'ngDialog', '$state', 'RVReservationNotesService', 'sntActivity', function ($scope, $filter, $rootScope, ngDialog, $state, RVReservationNotesService, sntActivity) {

            BaseCtrl.call(this, $scope);

            $scope.reservationNotes = '';
            $scope.isCountUpdated = $rootScope.isStandAlone;

            /*
             *To save the reservation note and update the ui accordingly
             */
            var init = function init() {
                $scope.setScroller('reservationNotes');

                $scope.notesCount = $scope.reservationListData.note_count;

                // CICO-22355 Initiate a sync in case of overlays!
                if (!$rootScope.isStandAlone) {
                    $scope.callAPI(RVReservationNotesService.sync, {
                        loader: 'NONE',
                        params: $scope.reservationData.reservation_card.reservation_id,
                        successCallBack: function successCallBack(notesCount) {
                            $scope.notesCount = notesCount;
                            $scope.isCountUpdated = true;
                        },
                        failureCallBack: function failureCallBack(err) {
                            $scope.errorMessage = err;
                            $scope.isCountUpdated = true;
                        }
                    });
                }
            };

            $scope.openNotesPopup = function () {
                if ($scope.isCloudStorageEnabledForCardType('stay_card')) {
                    ngDialog.open({
                        template: '/assets/directives/fileCloudStorage/partials/rvReservationCardNotesAndFiles.html',
                        className: 'ngdialog-theme-default',
                        scope: $scope,
                        closeByDocument: false,
                        closeByEscape: false
                    });
                } else {
                    sntActivity.start('FETCH_NOTES');
                    $scope.callAPI(RVReservationNotesService.fetch, {
                        params: $scope.reservationData.reservation_card.reservation_id,
                        successCallBack: function successCallBack(notes) {
                            // The following step is reqd as the reservation details response no longer holds notes information
                            $scope.reservationData.reservation_card.notes = $scope.reservationData.reservation_card.notes || {};
                            $scope.reservationData.reservation_card.notes.reservation_notes = notes;
                            ngDialog.open({
                                template: '/assets/partials/reservationCard/rvReservationCardNotesPopup.html',
                                className: 'ngdialog-theme-default',
                                scope: $scope,
                                closeByDocument: false,
                                closeByEscape: false
                            });
                            sntActivity.stop('FETCH_NOTES');
                        },
                        failureCallBack: function failureCallBack(err) {
                            $scope.errorMessage = err;
                            sntActivity.stop('FETCH_NOTES');
                        }
                    });
                }
            };

            $scope.navigateToGroup = function (event) {
                if ($rootScope.isStandAlone && !!$scope.reservationData.reservation_card.group_id) {
                    // Navigate to Groups
                    $state.go('rover.groups.config', {
                        id: $scope.reservationData.reservation_card.group_id,
                        activeTab: "SUMMARY"
                    });
                } else {
                    event.preventDefault();
                }
            };

            /**
             * whether the group card attached to reservation
             * @return {Boolean}
             */
            $scope.isGroupCardAttachedToReservation = function () {
                return $scope.reservationDetails && $scope.reservationDetails.group && $scope.reservationDetails.group.id.trim() !== '';
            };

            /**
             * whether the group card attached to reservation
             * @return {Boolean}
             */
            $scope.isCompanyCardAttachedToReservation = function () {
                return $scope.reservationDetails && $scope.reservationDetails.companyCard && $scope.reservationDetails.companyCard.id.toString().trim() !== '';
            };

            /**
             * whether the travel agent attached to reservation
             * @return {Boolean}
             */
            $scope.isTravelAgentAttachedToReservation = function () {
                return $scope.reservationDetails && $scope.reservationDetails.travelAgent && $scope.reservationDetails.travelAgent.id.toString().trim() !== '';
            };

            /**
             * whether the allotment card attached to reservation
             * @return {Boolean}
             */
            $scope.isAllotmentCardAttachedToReservation = function () {
                return $scope.reservationDetails && $scope.reservationDetails.allotment && $scope.reservationDetails.allotment.id.toString().trim() !== '';
            };

            /**
             * if no cards has attached to reservation
             * @return {Boolean}
             */
            $scope.noCardAttachedToReservation = function () {
                return !$scope.isGroupCardAttachedToReservation() && !$scope.isCompanyCardAttachedToReservation() && !$scope.isTravelAgentAttachedToReservation() && !$scope.isAllotmentCardAttachedToReservation();
            };

            $scope.closeDialog = function () {
                // CICO-22355 Update the notesCount to be shown
                // NOTE This is necessary as we are binding the notesCount with a sepearte variable! The list of notes won't
                // be available to the UI till the user opens the notes popup for the first time!
                if ($scope.reservationData.reservation_card.notes && _.isArray($scope.reservationData.reservation_card.notes.reservation_notes)) {
                    $scope.notesCount = $scope.reservationData.reservation_card.notes.reservation_notes.length;
                }
                ngDialog.close();
            };

            $scope.$on('NOTES_COUNT_UPDATED', function (evt, notes) {
                if (notes) {
                    $scope.notesCount = notes.length;
                }
            });

            init();
        }]);
    }, {}] }, {}, [1]);