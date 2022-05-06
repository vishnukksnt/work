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
		angular.module('sntRover').service('RVReservationCardSrv', ['$http', '$q', 'RVBaseWebSrv', 'rvBaseWebSrvV2', 'RVGAHelperSrv', '$rootScope', function ($http, $q, RVBaseWebSrv, rvBaseWebSrvV2, RVGAHelperSrv, $rootScope) {

			this.reservationData = {};

			var that = this;

			/**
    * To fetch the list of users
    * @return {object} users list json
    */
			this.fetch = function (data) {

				var deferred = $q.defer();
				var reservationId = data.reservationId;
				var isRefresh = data.isRefresh;
				var isReservationIdAlreadyCalled = false;

				angular.forEach(that.reservationIdsArray, function (value, key) {
					if (!isRefresh || isRefresh === null || isRefresh === '') {
						if (value === reservationId) {
							isReservationIdAlreadyCalled = true;
						}
					}
				});
				if (!isReservationIdAlreadyCalled) {
					that.storeReservationIds(reservationId);
					var url = 'api/reservations/' + reservationId + '.json';

					RVBaseWebSrv.getJSON(url).then(function (data) {
						that.reservationData[reservationId] = data;
						deferred.resolve(data);
					}, function (data) {
						deferred.reject(data);
					});
				} else {
					deferred.resolve(that.reservationData[reservationId]);
				}

				return deferred.promise;
			};

			this.reservationDetails = {};
			this.confirmationNumbersArray = [];

			this.reservationIdsArray = [];
			var that = this;

			this.emptyConfirmationNumbers = function () {
				that.confirmationNumbersArray = [];
				that.reservationDetails = {};
			};
			this.storeConfirmationNumbers = function (confirmationNumber) {
				that.confirmationNumbersArray.push(confirmationNumber);
			};

			this.storeReservationIds = function (reservationID) {
				that.reservationIdsArray.push(reservationID);
			};

			this.fetchReservationDetails = function (data) {
				var confirmationNumber = data.confirmationNumber;
				var isRefresh = data.isRefresh;
				var isConfirmationNumberAlreadyCalled = false;
				var is_dep_date_allowed = true;

				angular.forEach(that.confirmationNumbersArray, function (value, key) {
					if (!isRefresh || isRefresh === null) {
						if (value === confirmationNumber) {
							isConfirmationNumberAlreadyCalled = true;
						}
					}
				});

				var deferred = $q.defer();

				if (!isConfirmationNumberAlreadyCalled) {
					that.storeConfirmationNumbers(confirmationNumber);
					var url = '/staff/staycards/reservation_details.json?reservation=' + confirmationNumber + '&is_dep_date_allowed=' + is_dep_date_allowed;

					RVBaseWebSrv.getJSON(url).then(function (data) {
						that.reservationDetails[confirmationNumber] = data;
						RVGAHelperSrv.sendEventToGA('LOAD_RESERVATION', confirmationNumber);
						deferred.resolve(data);
					}, function (data) {
						deferred.reject(data);
					});
				} else {
					deferred.resolve(that.reservationDetails[confirmationNumber]);
				}

				return deferred.promise;
			};

			this.updateResrvationForConfirmationNumber = function (confirmationNumber, reservationData) {
				that.reservationDetails[confirmationNumber] = reservationData;
			};
			this.getResrvationForConfirmationNumber = function (confirmationNumber) {
				return that.reservationDetails[confirmationNumber];
			};
			this.guestData = "";
			this.setGuestData = function (data) {
				this.guestData = data;
			};
			this.getGuestData = function () {
				return this.guestData;
			};

			this.fetchGuestcardData = function (param) {
				var deferred = $q.defer();
				var url = '/staff/guestcard/show.json';

				RVBaseWebSrv.getJSON(url, param).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});
				return deferred.promise;
			};

			this.fetchCancellationPolicies = function (param) {
				var deferred = $q.defer();
				var url = '/api/reservations/' + param.id + '/cancellation_policies';

				rvBaseWebSrvV2.getJSON(url, param).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});
				return deferred.promise;
			};

			this.cancelReservation = function (param) {
				var deferred = $q.defer();
				var url = '/api/reservations/' + param.id + '/cancel';

				rvBaseWebSrvV2.postJSON(url, param).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});
				return deferred.promise;
			};

			this.tokenize = function (data) {
				var deferred = $q.defer();
				var url = '/staff/payments/tokenize';

				RVBaseWebSrv.postJSON(url, data).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});
				return deferred.promise;
			};

			/**
    * to get the last rate adjustment reason against a reservation
    * @return {Promise} - After resolving we will get reason
    */
			this.getLastRateAdjustmentReason = function (params) {
				var deferred = $q.defer();
				var url = 'api/reservations/' + params.reservation_id + '/reason_for_last_adjusted_rate';

				rvBaseWebSrvV2.getJSON(url).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});
				return deferred.promise;
			};

			this.saveReservationNote = function (data) {
				var deferred = $q.defer();
				var url = '/reservation_notes';

				RVBaseWebSrv.postJSON(url, data).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});
				return deferred.promise;
			};
			this.deleteReservationNote = function (reservationID) {
				var deferred = $q.defer();
				var url = '/reservation_notes/' + reservationID;

				RVBaseWebSrv.deleteJSON(url, "").then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});
				return deferred.promise;
			};

			// CICO-24928
			this.updateReservationNote = function (data) {
				var deferred = $q.defer(),
				    url = '/reservation_notes/' + data.id;

				rvBaseWebSrvV2.putJSON(url, data).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});
				return deferred.promise;
			};

			this.getGuestDetails = function (guestData) {
				var deferred = $q.defer(),
				    url = '/api/guest_details/' + guestData.id;

				if (guestData.id === null) {
					deferred.reject([""]);
				} else {
					rvBaseWebSrvV2.getJSON(url).then(function (data) {
						deferred.resolve(data);
					}, function (data) {
						deferred.reject(data);
					});
				}

				return deferred.promise;
			};
			this.modifyRoomQueueStatus = function (data) {
				var deferred = $q.defer();
				var postData = {
					"status": data.status
				};

				if (data.viaAdvancedQueue) {
					postData.signature = data.signature;
					postData.is_promotions_and_email_set = data.is_promotions_and_email_set;
				}

				var url = '/api/reservations/' + data.reservationId + '/queue';

				rvBaseWebSrvV2.postJSON(url, postData).then(function (postData) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});
				return deferred.promise;
			};
			this.fetchDepositDetails = function (id) {
				var deferred = $q.defer();
				var url = 'api/reservations/' + id + '/deposit_policy';

				rvBaseWebSrvV2.getJSON(url).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});
				return deferred.promise;
			};

			this.sendConfirmationEmail = function (data) {
				var deferred = $q.defer();
				var url = '/api/reservations/' + data.reservationId + '/email_confirmation';

				rvBaseWebSrvV2.postJSON(url, data.postData).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});
				return deferred.promise;
			};

			this.validateStayDateChange = function (param) {
				var deferred = $q.defer();
				var url = '/staff/change_stay_dates/validate_stay_dates_change';

				rvBaseWebSrvV2.postJSON(url, param).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});
				return deferred.promise;
			};
			this.detachGroupReservation = function (param) {
				var deferred = $q.defer();
				var url = '/api/group_reservations/' + param.id + '/detach_group_reservation';

				rvBaseWebSrvV2.postJSON(url, param).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});
				return deferred.promise;
			};

			this.reinstateReservation = function (param) {
				var deferred = $q.defer(),
				    url = '/api/reservations/' + param.reservationId + '/reinstate';

				rvBaseWebSrvV2.postJSON(url, param).then(function (response) {
					deferred.resolve(response);
				}, function (response) {
					deferred.reject(response);
				});
				return deferred.promise;
			};

			this.checkReinstationAvailbility = function (reservationId) {
				var deferred = $q.defer(),
				    url = '/api/reservations/' + reservationId + '/check_reinstate_availability';

				rvBaseWebSrvV2.getJSON(url).then(function (response) {
					deferred.resolve(response);
				}, function (response) {
					deferred.reject(response);
				});
				return deferred.promise;
			};

			this.checkGiftCardBalance = function (params) {
				var data = {
					'card_number': params.card_number
				};
				var deferred = $q.defer(),
				    url = '/api/gift_cards/balance_inquiry';

				rvBaseWebSrvV2.postJSON(url, data).then(function (response) {
					if (response) {
						if (_typeof(response.amount) === _typeof(123)) {
							response.amount = parseFloat(response.amount).toFixed(2);
						}
					}

					deferred.resolve(response);
				}, function (response) {
					deferred.reject(response);
				});
				return deferred.promise;
			};

			this.fetchGuestIdentity = function (data) {
				var deferred = $q.defer(),
				    url = '/api/guest_identity/' + data.reservation_id;

				rvBaseWebSrvV2.getJSON(url, data).then(function (response) {
					deferred.resolve(response);
				}, function (response) {
					deferred.reject(response);
				});
				return deferred.promise;
			};

			/**
    * Service to perform the reverse check-in process
    * @param {Object} param reservation id
    * @return {Promise}
    */
			this.reverseCheckIn = function (param) {
				var deferred = $q.defer(),
				    url = '/api/reservations/' + param.reservationId + '/reverse_check_in';

				rvBaseWebSrvV2.postJSON(url).then(function (response) {
					deferred.resolve(response);
				}, function (response) {
					deferred.reject(response);
				});
				return deferred.promise;
			};

			/**
    * Attach a specific guest to a reservation
    * @param {Object} params - holding request params
    * @return {Promise}
    */
			this.attachGuestToReservation = function (params) {
				var deferred = $q.defer(),
				    url = '/api/reservations/' + params.reservation_id + '/reservations_guest_details/attach_guest_details';

				delete params.reservation_id;

				rvBaseWebSrvV2.postJSON(url, params).then(function (response) {
					deferred.resolve(response);
				}, function (response) {
					deferred.reject(response);
				});
				return deferred.promise;
			};

			this.getConfirmationData = function (params) {
				var deferred = $q.defer(),
				    url = '/api/reservations/' + params.reservation_id + '/confirmation_data';

				rvBaseWebSrvV2.getJSON(url).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});
				return deferred.promise;
			};

			this.createActivityLog = function (params) {
				var deferred = $q.defer();

				rvBaseWebSrvV2.postJSON('/api/reservation_actions', params).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});

				return deferred.promise;
			};
		}]);
	}, {}] }, {}, [1]);