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
		sntRover.controller('companyCardArAccountCtrl', ['$scope', 'RVCompanyCardSrv', '$timeout', 'rvPermissionSrv', function ($scope, RVCompanyCardSrv, $timeout, rvPermissionSrv) {

			BaseCtrl.call(this, $scope);

			$scope.setScroller('cardAccountsScroller');

			var refreshScroller = function refreshScroller() {
				$timeout(function () {
					if ($scope.myScroll && $scope.myScroll['cardAccountsScroller']) {
						$scope.myScroll['cardAccountsScroller'].refresh();
					}
					$scope.refreshScroller('cardAccountsScroller');
				}, 500);
			};

			$scope.$on('refreshAccountsScroll', refreshScroller);

			var init = function init() {
				$scope.ARData = {};
				$scope.ARData.note = "";
				$scope.shouldValidate = true;
			};

			init();
			var presentArDetails = {};

			$scope.$on('setgenerateNewAutoAr', function (e, bool) {
				$scope.$parent.generateNewAutoAr = bool;
				if (!$scope.arAccountDetails.is_auto_assign_ar_numbers && bool) {
					updateArAccount(true);
				}
			});

			var updateArAccount = function updateArAccount(initialUpdate) {

				var successCallbackOfsaveARDetails = function successCallbackOfsaveARDetails(data) {
					$scope.$emit("hideLoader");
					$scope.errorMessage = "";
					if ($scope.arAccountDetails.is_auto_assign_ar_numbers && !$scope.arAccountDetails.ar_number) {
						$scope.arAccountDetails.ar_number = data.ar_number;
						$scope.$parent.generateNewAutoAr = false;
					}
					$scope.$emit('ARNumberChanged', {
						'newArNumber': $scope.arAccountDetails.ar_number
					});
				};

				var successCallbackOfsaveARDetailsWithoutARNumber = function successCallbackOfsaveARDetailsWithoutARNumber(data) {
					$scope.$emit("hideLoader");
					$scope.errorMessage = "";
				};

				var failureCallback = function failureCallback(errorMessage) {
					$scope.$emit("hideLoader");
					$scope.errorMessage = errorMessage;
					if (errorMessage[0] === 'Please complete required AR Account Information' || errorMessage[0] === 'Please provide payment due days since it is mandatory') {
						$scope.$emit("MANDATORY_CHECK_FAILED", $scope.errorMessage);
					}
				};

				var dataToSend = $scope.arAccountDetails;

				if (_.isEmpty(presentArDetails)) {
					presentArDetails = angular.fromJson(angular.toJson($scope.arAccountDetails));
				}

				if (!!$scope.contactInformation.id) {
					dataToSend.id = $scope.contactInformation.id;
					presentArDetails.id = $scope.contactInformation.id;
				}
				var presentArDetailsAfterEdit = JSON.parse(JSON.stringify($scope.arAccountDetails));
				var dataNotUpdated = false;

				// check if data was edited
				var ignoredKeys = ['workstation_id'];
				if (!angular.equals(_.omit(presentArDetailsAfterEdit, ignoredKeys), _.omit(presentArDetails, ignoredKeys))) {
					dataNotUpdated = true;
					presentArDetails = presentArDetailsAfterEdit;
				}

				if ($scope.$parent.generateNewAutoAr && $scope.arAccountDetails.is_auto_assign_ar_numbers || dataNotUpdated) {
					$scope.invokeApi(RVCompanyCardSrv.saveARDetails, dataToSend, successCallbackOfsaveARDetails, failureCallback);
				} else if (!$scope.arAccountDetails.is_auto_assign_ar_numbers && dataNotUpdated || initialUpdate) {
					// CICO-24472 => If is_auto_assign_ar_numbers property is OFF and some data updated on AR TAB ,
					// we call save API without AR Number.
					$scope.invokeApi(RVCompanyCardSrv.saveARDetails, dataToSend, successCallbackOfsaveARDetailsWithoutARNumber, failureCallback);
				}
			};

			$scope.$on("arAccountTabActive", function () {
				setTimeout(function () {
					refreshScroller();
				}, 500);
				// if automatic mode is on,call save action to generate a random number
				if (!!$scope.arAccountDetails && !!$scope.arAccountDetails.is_auto_assign_ar_numbers && !$scope.arAccountDetails.ar_number) {
					updateArAccount();
				}
			});

			// to set data to be compared from time to time
			// to check if data has been edited or not
			$scope.$on('ARDetailsRecieved', function () {
				presentArDetails = JSON.parse(JSON.stringify($scope.arAccountDetails));
			});

			$scope.checkboxModelChanged = function () {
				refreshScroller();
			};

			$scope.saveNote = function () {

				var successCallbackOfsaveARNote = function successCallbackOfsaveARNote(data) {
					$scope.$emit("hideLoader");
					$scope.arAccountNotes.ar_notes.push(data);
					$scope.ARData.note = "";
					refreshScroller();
				};

				var dataToSend = {
					"id": $scope.contactInformation.id,
					"note": $scope.ARData.note,
					"ar_number": $scope.arAccountDetails.ar_number
				};

				$scope.invokeApi(RVCompanyCardSrv.saveARNote, dataToSend, successCallbackOfsaveARNote);
			};

			$scope.deletePost = function (note_id, index) {

				var deleteARNoteSuccess = function deleteARNoteSuccess() {
					$scope.$emit("hideLoader");
					$scope.arAccountNotes.ar_notes.splice(index, 1);
					refreshScroller();
				};

				var dataToSend = {
					"id": $scope.contactInformation.id,
					"note_id": note_id
				};

				$scope.invokeApi(RVCompanyCardSrv.deleteARNote, dataToSend, deleteARNoteSuccess);
			};

			$scope.$on("UPDATE_AR_ACCOUNT_DETAILS", function (e, data) {
				$scope.arAccountDetails = data;
				$scope.arAccountDetails.payment_due_days = data.payment_due_days === null ? "" : data.payment_due_days;
			});

			/**
    * recieving function for save AR accounts with data
    */
			$scope.$on('saveArAccount', function (event) {
				event.preventDefault();
				updateArAccount();
			});

			$scope.$on('ArAccountDeleted', function (event) {
				var bool = $scope.arAccountDetails.is_auto_assign_ar_numbers;

				$scope.arAccountDetails = {};
				$scope.arAccountDetails.is_use_main_contact = true;
				$scope.arAccountDetails.is_use_main_address = true;
				$scope.arAccountDetails.is_auto_assign_ar_numbers = bool;
				$scope.arAccountDetails.ar_number = "";
				$scope.arAccountDetails.payment_due_days = "";
				$scope.arAccountNotes.ar_notes = [];
				$scope.$emit('UPDATE_AR_ACCOUNT_DETAILS_AFTER_DELETE', $scope.arAccountDetails);
			});

			$scope.clearErrorMessage = function () {
				$scope.errorMessage = "";
			};

			/**
   * function to check whether the user has permission
   * to edit the direct bill restriction
   * @return {Boolean}
   */
			$scope.hasPermissionToEditDirectBillRestriction = function () {
				return rvPermissionSrv.getPermissionValue('EDIT_DIRECT_BILL_RESTRICTION');
			};

			/**
   * function to check whether the user has permission
   * to create/edit AR Account.
   * @return {Boolean}
   */
			$scope.hasPermissionToCreateArAccount = function () {
				return rvPermissionSrv.getPermissionValue('CREATE_AR_ACCOUNT');
			};
		}]);
	}, {}] }, {}, [1]);