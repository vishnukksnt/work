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
		sntRover.controller('RVSmartBandsController', ['$scope', '$state', '$stateParams', 'RVSmartBandSrv', function ($scope, $state, $stateParams, RVSmartBandSrv) {
			BaseCtrl.call(this, $scope);
			$scope.smartBandData = {};
			$scope.bandData = {};
			$scope.selectedReservationStatus = $scope.reservationData.reservation_card.reservation_status;
			$scope.smartBandData.firstName = JSON.parse(JSON.stringify($scope.data.guest_details.first_name));
			$scope.smartBandData.lastName = JSON.parse(JSON.stringify($scope.data.guest_details.last_name));
			$scope.smartBandLength = 0;
			$scope.showAddNewSmartBandScreen = false;
			$scope.isFixedAmount = false;
			$scope.showWriteToBand = false;
			$scope.showSuccess = false;
			$scope.showSmartBandListView = false;
			// Used to not to call list API again
			$scope.firstTimeClick = true;
			$scope.showBandEditScreen = false;

			var that = this;
			// since smartband api is returning reversed id, we are using a vairble to keep that locally and use that for band type writing.

			that.lastSuccessfulIDReaded = '';
			$scope.addNewSmartband = function () {
				if ($scope.selectedReservationStatus !== 'CHECKEDOUT') {
					$scope.errorMessage = '';
					$scope.showSmartBandListView = false;
					$scope.showAddNewSmartBandScreen = true;
					$scope.showSuccess = false;
					$scope.showWriteToBand = false;
					if ($scope.smartBandLength > 0) {
						$scope.smartBandData.firstName = "";
						$scope.smartBandData.lastName = "";
					}
					$scope.smartBandData.fixedAmount = "";
				}
			};
			$scope.setPaymentType = function () {
				$scope.isFixedAmount = !$scope.isFixedAmount;
			};
			$scope.createSmartBandFailure = function (errorMessage) {
				$scope.$emit('hideLoader');
				$scope.errorMessage = errorMessage;
				$scope.showSmartBandListView = false;
			};
			$scope.createSmartBandSuccess = function (data) {
				$scope.$emit('hideLoader');

				that.newBandInfo = {
					"id": data.id,
					"first_name": $scope.smartBandData.firstName,
					"last_name": $scope.smartBandData.lastName,
					"is_fixed": $scope.isFixedAmount,
					"amount": $scope.smartBandData.fixedAmount,
					"account_number": data.account_number
				};
				$scope.smartBands.push(that.newBandInfo);
				$scope.smartBandLength = $scope.smartBands.length;
				$scope.reservationData.reservation_card.balance_amount = data.balance_amount;
				$scope.$apply();
				$scope.writeBandType();
			};

			$scope.fetchSuccessKeyRead = function (accountNumber) {
				$scope.$emit('hideLoader');
				that.lastSuccessfulIDReaded = accountNumber;
				var postData = {
					'first_name': $scope.smartBandData.firstName,
					'last_name': $scope.smartBandData.lastName,
					'account_number': accountNumber,
					'is_fixed': $scope.isFixedAmount
				};

				if ($scope.isFixedAmount) {
					postData.amount = $scope.smartBandData.fixedAmount;
				}
				var dataToApi = {
					'postData': postData,
					'reservationId': $scope.reservation.reservation_card.reservation_id
				};

				$scope.invokeApi(RVSmartBandSrv.createSmartBand, dataToApi, $scope.createSmartBandSuccess, $scope.createSmartBandFailure);
			};
			$scope.fetchFailedKeyRead = function (errorObject) {
				$scope.$emit('hideLoader');
				$scope.errorMessage = [errorObject.RVErrorDesc];
				$scope.$apply(); // since this function is calling from out of angular scope
			};
			$scope.clickContinueButton = function () {
				document.activeElement.blur();
				setTimeout(function () {
					window.scrollTo(0, 0);
				}, 700);
				var blankKeys = "";

				that.lastSuccessfulIDReaded = '';
				if ($scope.isFixedAmount) {
					if ($scope.smartBandData.fixedAmount === '' || $scope.smartBandData.fixedAmount === null) {
						blankKeys = blankKeys === '' ? "Amount" : blankKeys + ", " + "Amount";
					} else {
						var pattern = /^(0|[1-9][0-9]{0,2}(?:(,[0-9]{3})*|[0-9]*))(\.[0-9]+){0,1}$/;

						if (!pattern.test($scope.smartBandData.fixedAmount)) {
							blankKeys = blankKeys === '' ? "Amount is not valid" : blankKeys + ", " + "Amount is not valid";
						}
					}
				}
				if (blankKeys !== "") {
					$scope.errorMessage = ['Please enter ' + blankKeys];
				} else {
					var options = {
						'successCallBack': $scope.fetchSuccessKeyRead,
						'failureCallBack': $scope.fetchFailedKeyRead
					};

					$scope.$emit('showLoader');
					$scope.showWriteToBand = true;
					if (sntapp.cardSwipeDebug) {
						sntapp.cardReader.retrieveUserIDDebug(options);
					} else {
						sntapp.cardReader.retrieveUserID(options);
					}
				}
			};
			$scope.listSmartBandSuccess = function (data) {
				$scope.showAddNewSmartBandScreen = false;
				$scope.isFixedAmount = false;
				$scope.showWriteToBand = false;
				$scope.showSuccess = false;
				$scope.showSmartBandListView = true;
				$scope.showBandEditScreen = false;
				$scope.$emit('hideLoader');
				if ($scope.firstTimeClick) {
					$scope.firstTimeClick = false;
					$scope.smartBands = data.results;
				} else {
					$scope.smartBands = data;
				}
				$scope.smartBandLength = $scope.smartBands.length;
			};
			$scope.seeAllBands = function () {
				$scope.errorMessage = '';

				if ($scope.firstTimeClick) {
					var dataToApi = {
						'reservationId': $scope.reservation.reservation_card.reservation_id
					};

					$scope.invokeApi(RVSmartBandSrv.listSmartBands, dataToApi, $scope.listSmartBandSuccess);
				} else {
					$scope.listSmartBandSuccess($scope.smartBands);
				}
			};
			$scope.seeAllBands();
			$scope.getSmartBandSuccess = function (data) {
				$scope.bandData = data;
				$scope.$emit('hideLoader');
				$scope.showBandEditScreen = true;
				$scope.showAddNewSmartBandScreen = false;
				$scope.isFixedAmount = false;
				$scope.showWriteToBand = false;
				$scope.showSuccess = false;
				$scope.showSmartBandListView = false;
			};
			/*
    * Edit bands
    * @param {int} id of the band
    */
			$scope.editBandDetails = function (id) {
				if ($scope.selectedReservationStatus !== 'CHECKEDOUT') {
					$scope.bandEditId = id;
					$scope.invokeApi(RVSmartBandSrv.getSmartBandDetails, id, $scope.getSmartBandSuccess);
				}
			};
			/*
    * Success call back on updating smart band
    * updating new amount to the band data
    */
			$scope.updateSmartBandSuccess = function (data) {
				$scope.$emit('hideLoader');
				angular.forEach($scope.smartBands, function (value, key) {
					if (value.id === $scope.bandEditId) {
						if ($scope.bandData.additionalCredit !== undefined) {
							value.amount = parseInt(value.amount) + parseInt($scope.bandData.additionalCredit);
						}
						value.first_name = $scope.bandData.first_name;
						value.last_name = $scope.bandData.last_name;
					}
				});
				$scope.reservationData.reservation_card.balance_amount = data.balance_amount;
				$scope.$apply();
				$scope.seeAllBands();
			};
			/*
    * Handle continue button on edit screen
    * @param {bool} isFixed
    */
			$scope.clickContinueEdit = function (isFixed) {
				document.activeElement.blur();
				setTimeout(function () {
					window.scrollTo(0, 0);
				}, 700);
				if (isFixed) {

					var dataToApi = {
						"postData": {
							"credit": parseInt($scope.bandData.additionalCredit),
							"first_name": $scope.bandData.first_name,
							"last_name": $scope.bandData.last_name
						},
						"bandId": $scope.bandEditId
					};

					$scope.invokeApi(RVSmartBandSrv.updateSmartBandDetails, dataToApi, $scope.updateSmartBandSuccess);
				} else {
					$scope.seeAllBands();
				}
			};
			/*
    * Set the selected band type - fixed room/open charge to the band
    *
    */
			$scope.writeBandType = function () {
				var args = [];
				// Fixed amount - bandtype code : 00000001
				// Open room charge - bandtype code : 00000002
				var bandType = '00000002';

				if (that.newBandInfo.is_fixed) {
					bandType = '00000001';
				}
				args.push(bandType);
				args.push(that.lastSuccessfulIDReaded);
				args.push('19'); // Block Address - hardcoded

				var options = {
					// Cordova write success callback
					'successCallBack': function successCallBack() {
						$scope.$emit('hideLoader');
						$scope.showSuccess = true;
						$scope.$apply(); // since it is calling from outside of Angular scope, we need to call this one
						that.lastSuccessfulIDReaded = '';
					},
					'failureCallBack': function failureCallBack(errorObject) {
						var message = [errorObject.RVErrorDesc];

						that.lastSuccessfulIDReaded = '';
						$scope.createSmartBandFailure(message);
						$scope.$apply(); // since it is calling from outside of Angular scope, we need to call this one
					},
					arguments: args
				};

				if (sntapp.cardSwipeDebug) {
					sntapp.cardReader.setBandTypeDebug(options);
				} else {
					sntapp.cardReader.setBandType(options);
				}
			};
		}]);
	}, {}] }, {}, [1]);