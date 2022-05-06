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

								sntRover.controller('RVReservationNotesPopupCtrl', ['$scope', '$rootScope', function ($scope, $rootScope) {

												BaseCtrl.call(this, $scope);
												$scope.reservationnote = "";
												// CICO-24928
												$scope.editingNote = null;
												$scope.saveReservationNote = function () {
																if (!$scope.$parent.isNewsPaperPreferenceAvailable()) {
																				if (!$rootScope.isStandAlone) {
																								$scope.reservationnote = "";
																								$scope.$parent.showFeatureNotAvailableMessage();
																								return;
																				}
																}
																var successCallBackReservationNote = function successCallBackReservationNote(data) {
																				if (!data.is_already_existing) {
																								$scope.reservationnote = "";
																								data.topic = "GENERAL";
																								$scope.$parent.reservationData.reservation_card.notes.reservation_notes.splice(0, 0, data);
																								$scope.$parent.reservationCardSrv.updateResrvationForConfirmationNumber($scope.$parent.reservationData.reservation_card.confirmation_num, $scope.$parent.reservationData);
																								refreshScroller();
																				}
																				$scope.$parent.$emit('hideLoader');
																};

																var params = {};

																params.reservation_id = $scope.$parent.reservationData.reservation_card.reservation_id;
																params.text = $scope.reservationnote;
																params.note_topic = 1;
																$scope.invokeApi($scope.$parent.reservationCardSrv.saveReservationNote, params, successCallBackReservationNote);
												};

												/*
             *To delete the reservation note and update the ui accordingly
             */
												$scope.deleteReservationNote = function (event, index) {
																$scope.deletedNoteIndex = index;
																if (event !== null) {
																				event.stopPropagation();
																}
																var successCallBackDeleteReservationNote = function successCallBackDeleteReservationNote(data) {
																				$scope.$parent.reservationData.reservation_card.notes.reservation_notes.splice($scope.deletedNoteIndex, 1);
																				$scope.$parent.reservationCardSrv.updateResrvationForConfirmationNumber($scope.$parent.reservationData.reservation_card.confirmation_num, $scope.$parent.reservationData);
																				// CICO-24928
																				$scope.cancelEditModeReservationNote();
																				$scope.$parent.$emit('hideLoader');
																				refreshScroller();
																};

																var note_id = $scope.$parent.reservationData.reservation_card.notes.reservation_notes[index].note_id;

																$scope.invokeApi($scope.$parent.reservationCardSrv.deleteReservationNote, note_id, successCallBackDeleteReservationNote);
												};

												// CICO-24928
												$scope.updateActiveReservationNote = function () {
																if ($scope.reservationnote === null) {
																				$scope.errorMessage = ['Something went wrong, please try again!'];
																				return;
																}
																if (!$scope.$parent.isNewsPaperPreferenceAvailable()) {
																				if (!$rootScope.isStandAlone) {
																								$scope.reservationnote = "";
																								$scope.$parent.showFeatureNotAvailableMessage();
																								return;
																				}
																}
																$scope.errorMessage = '';
																if ($scope.reservationnote) {
																				var successCallBackReservationNote = function successCallBackReservationNote(data) {
																								$scope.editingNote.text = $scope.reservationnote;
																								var noteArrayIndex = _.findIndex($scope.$parent.reservationData.reservation_card.notes.reservation_notes, { note_id: data.note_id });

																								$scope.$parent.reservationData.reservation_card.notes.reservation_notes[noteArrayIndex] = $scope.editingNote;
																								$scope.$parent.reservationCardSrv.updateResrvationForConfirmationNumber($scope.$parent.reservationData.reservation_card.confirmation_num, $scope.$parent.reservationData);
																								refreshScroller();
																								$scope.cancelEditModeReservationNote();
																								$scope.$parent.$emit('hideLoader');
																				},
																				    failureCallBackReservationNote = function failureCallBackReservationNote(errorMessage) {
																								$scope.errorMessage = errorMessage;
																				};
																				var params = {};

																				params.id = $scope.editingNote.note_id;
																				params.text = $scope.reservationnote;
																				params.associated_id = $scope.$parent.reservationData.reservation_card.reservation_id;
																				params.associated_type = 'Reservation';
																				$scope.invokeApi($scope.$parent.reservationCardSrv.updateReservationNote, params, successCallBackReservationNote, failureCallBackReservationNote);
																}
												};
												// CICO-24928
												$scope.clickedOnNote = function (note) {
																$scope.editingNote = note;
																$scope.reservationnote = note.text;
												};
												// CICO-24928
												$scope.cancelEditModeReservationNote = function () {
																$scope.editingNote = null;
																$scope.reservationnote = '';
												};

												var refreshScroller = function refreshScroller() {
																$scope.refreshScroller('reservationNotes');
												};
								}]);
				}, {}] }, {}, [1]);