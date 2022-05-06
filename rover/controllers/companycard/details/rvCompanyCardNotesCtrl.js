"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

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
        angular.module('sntRover').controller('companyCardNotesController', ['$scope', 'rvCompanyCardNotesSrv', '$timeout', '$filter', '$rootScope', function ($scope, rvCompanyCardNotesSrv, $timeout, $filter, $rootScope) {

            BaseCtrl.call(this, $scope);

            var accountID = null;

            /**
            * used to scroll to top as the user add/edits the note
            * @return {undefined}
            */
            var scrollToTop = function scrollToTop() {
                var scroller = $scope.getScroller('companycard_notes_scroller');

                $timeout(function () {
                    scroller.scrollTo(0, 0, 300);
                }, 0);
            };

            /**
            * success call back for notes list fetch
            * @param  {Array} notes [description]
            * @return {undefined}
            */
            var successCallBackOfFetchNotes = function successCallBackOfFetchNotes(notes) {
                $scope.notes = notes;
                $scope.refreshScroller('companycard_notes_scroller');
                $scope.contactInformation.account_notes_count = $scope.notes.length;
            };

            /**
            * to fetch against the
            * @return {undefined}
            */
            var fetchNotes = function fetchNotes() {
                accountID = $scope.contactInformation.id;
                var params = {
                    accountID: accountID
                };

                var options = {
                    params: params,
                    successCallBack: successCallBackOfFetchNotes
                };

                $scope.callAPI(rvCompanyCardNotesSrv.fetchNotes, options);
            };

            /**
            * @param  {Object} data [response from backend]
            * @param  {Object} successCallBackParameters
            * @return {undefined}
            */
            var successCallBackOfDeleteNote = function successCallBackOfDeleteNote(data, successCallBackParameters) {
                // we are going to stripe the note from the list
                var indexToDelete = successCallBackParameters.index;

                $scope.notes.splice(indexToDelete, 1);
                $scope.refreshScroller('companycard_notes_scroller');
                $scope.contactInformation.account_notes_count = $scope.notes.length;
            };

            /**
            * @param  {Array} [error message from backend]
            * @return {undefined}
            */
            var failureCallBackOfDeleteNote = function failureCallBackOfDeleteNote(errorMessage) {
                $scope.errorMessage = errorMessage;
                fetchNotes();
            };

            /**
            * to delete a note from the list
            * @param  {number} noteID
            * @return {undefined}
            */
            $scope.deleteNote = function (event, noteID, deletingIndex) {
                event.stopPropagation();

                $scope.cancelEditMode();

                $scope.errorMessage = '';

                var params = {
                    noteID: noteID,
                    accountID: accountID
                };

                var options = {
                    params: params,
                    successCallBack: successCallBackOfDeleteNote,
                    failureCallBack: failureCallBackOfDeleteNote,
                    successCallBackParameters: {
                        index: deletingIndex
                    }
                };

                $scope.callAPI(rvCompanyCardNotesSrv.deleteNote, options);
            };

            /**
            * @param  {Object} data [response from backend with new note id, time, user details]
            * @return {undefined}
            */
            var successCallBackOfCreateNote = function successCallBackOfCreateNote(data) {
                // we are adding to the list with the response
                var noteToAdd = {
                    'user_name': data.user_name,
                    'avatar': data.avatar,
                    'note': data.note,
                    'time': data.time,
                    'date': data.date,
                    'id': data.id,
                    'hotel_name': data.hotel_name,
                    'is_editable': data.is_editable
                };

                $scope.notes.unshift(0);
                $scope.notes[0] = noteToAdd;

                // clearing the textbox
                $scope.noteText = '';

                $scope.refreshScroller('companycard_notes_scroller');
                scrollToTop();
                $scope.contactInformation.account_notes_count = $scope.notes.length;
            };

            /**
            * to delete a note from the list
            * @param  {number} noteID
            * @return {undefined}
            */
            $scope.createNote = function () {
                accountID = $scope.contactInformation.id;
                var params = {
                    accountID: accountID,
                    text: $scope.noteText
                };

                $scope.errorMessage = '';

                var options = {
                    params: params,
                    successCallBack: successCallBackOfCreateNote
                };

                $scope.callAPI(rvCompanyCardNotesSrv.createNote, options);
            };

            /**
            * [successCallBackOfFetchUpdateActiveNote description]
            * @param  {Object} [API response]
            * @return {undefined}
            */
            var successCallBackOfFetchUpdateActiveNote = function successCallBackOfFetchUpdateActiveNote(data) {
                var indexOfNote = _.findIndex($scope.notes, { id: $scope.editingNote.id }) + 1;

                $scope.cancelEditMode();
                fetchNotes();
                var scroller = $scope.getScroller('companycard_notes_scroller');

                $timeout(function () {
                    scroller.scrollToElement('.notes.wrapper li:nth-child(' + indexOfNote + ')', 300);
                }, 0);
            };

            /**
            * to update the current the choosed note
            * @return {undefined}
            */
            $scope.updateActiveNote = function () {
                if ($scope.editingNote === null) {
                    $scope.errorMessage = ['Something went wrong, please switch tab and comeback'];
                    return;
                }

                $scope.errorMessage = '';

                var params = {
                    noteID: $scope.editingNote.id,
                    accountID: accountID,
                    text: $scope.noteText
                };

                var options = {
                    params: params,
                    successCallBack: successCallBackOfFetchUpdateActiveNote
                };

                $scope.callAPI(rvCompanyCardNotesSrv.updateNote, options);
            };

            /**
            * whenever we clicked on note, we will switch to editing mode
            * @return {undefined}
            */
            $scope.clickedOnNote = function (note) {
                if (note.is_editable) {
                    $scope.editingNote = note;
                    $scope.noteText = note.note;
                }
            };

            /**
            * to cancel edit mode
            * @return {undefined}
            */
            $scope.cancelEditMode = function () {
                $scope.editingNote = null;
                $scope.noteText = '';
            };

            /**
            * we want to display date in what format set from hotel admin
            * @param {String/DateObject}
            * @return {String}
            */
            $scope.formatDateForUI = function (date_) {
                var type_ = typeof date_ === "undefined" ? "undefined" : _typeof(date_),
                    returnString = '';

                switch (type_) {
                    // if date string passed
                    case 'string':
                        returnString = $filter('date')(new tzIndependentDate(date_), $rootScope.dateFormat);
                        break;

                    // if date object passed
                    case 'object':
                        returnString = $filter('date')(date_, $rootScope.dateFormat);
                        break;
                }
                return returnString;
            };

            /**
            * initialization Stuffs
            * @return {undefined}
            */
            var initializeMe = function () {
                $scope.editingNote = null;
                $scope.notes = [];
                $scope.noteText = '';

                $scope.setScroller('companycard_notes_scroller', {});
            }();

            $scope.$on('fetchNotes', function () {
                accountID = $scope.contactInformation && $scope.contactInformation.id || false;

                if (accountID) {
                    fetchNotes();
                }
            });
        }]);
    }, {}] }, {}, [1]);