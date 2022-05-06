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
		angular.module('sntRover').service('RVPaymentSrv', ['$http', '$q', 'RVBaseWebSrv', 'rvBaseWebSrvV2', '$rootScope', 'sntBaseWebSrv', function ($http, $q, RVBaseWebSrv, RVBaseWebSrvV2, $rootScope, sntBaseWebSrv) {

			var that = this;

			var cache = {
				'PAYMENT_TYPES': {}
			};

			this.renderPaymentScreen = function (data) {
				var deferred = $q.defer(),
				    url = '/staff/payments/addNewPayment.json',
				    stringifiedParams = angular.toJson(data || 'default');

				if (cache['PAYMENT_TYPES'][stringifiedParams]) {
					deferred.resolve(cache['PAYMENT_TYPES'][stringifiedParams]);
				} else {
					RVBaseWebSrv.getJSON(url, data).then(function (data) {
						cache['PAYMENT_TYPES'][stringifiedParams] = data;
						deferred.resolve(data);
					}, function (data) {
						deferred.reject(data);
					});
				}

				return deferred.promise;
			};

			this.fetchAvailPayments = function (data) {
				var deferred = $q.defer();
				var url = '/staff/payments/addNewPayment.json';

				RVBaseWebSrv.getJSON(url, data).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});
				return deferred.promise;
			};
			this.savePaymentDetails = function (data) {
				var deferred = $q.defer();
				var url = 'staff/reservation/save_payment';

				RVBaseWebSrv.postJSON(url, data).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});
				return deferred.promise;
			};
			this.saveGuestPaymentDetails = function (data) {
				var deferred = $q.defer();
				var url = 'staff/payments/save_new_payment';

				RVBaseWebSrv.postJSON(url, data).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});
				return deferred.promise;
			};
			this.setAsPrimary = function (data) {
				var deferred = $q.defer();

				var url = '/staff/payments/setCreditAsPrimary';

				RVBaseWebSrv.postJSON(url, data).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});
				return deferred.promise;
			};
			this.deletePayment = function (data) {
				var deferred = $q.defer();
				var url = '/staff/payments/deleteCreditCard';

				RVBaseWebSrv.postJSON(url, data).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});
				return deferred.promise;
			};
			this.getPaymentList = function (reservationId) {
				var deferred = $q.defer();
				var url = '/staff/staycards/get_credit_cards.json?reservation_id=' + reservationId;

				RVBaseWebSrv.getJSON(url).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});
				return deferred.promise;
			};

			this.getReceiptsList = function (params) {
				var deferred = $q.defer();
				var url = '/api/bills/payment_receipts';

				RVBaseWebSrvV2.getJSON(url, params).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});

				return deferred.promise;
			};

			this.getExistingPaymentsForBill = function (data) {
				var deferred = $q.defer();
				var url = '/staff/staycards/get_credit_cards.json';

				RVBaseWebSrv.getJSON(url, data).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});
				return deferred.promise;
			};
			this.mapPaymentToReservation = function (data) {
				var deferred = $q.defer();

				var url = '/staff/reservation/link_payment';

				RVBaseWebSrv.postJSON(url, data).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});
				return deferred.promise;
			};

			this.submitPaymentOnBill = function (dataToSrv) {

				var timeStampInSeconds = 0;
				var incrementTimer = function incrementTimer() {
					timeStampInSeconds++;
				};
				var refreshIntervalId = setInterval(incrementTimer, 1000);

				var deferred = $q.defer();
				var url = 'api/reservations/' + dataToSrv.reservation_id + '/submit_payment';

				var pollToTerminal = function pollToTerminal(async_callback_url) {
					// we will continously communicate with the terminal till
					// the timeout set for the hotel
					if (timeStampInSeconds >= $rootScope.emvTimeout) {
						var errors = ["Request timed out. Unable to process the transaction"];

						deferred.reject(errors);
					} else {
						RVBaseWebSrvV2.getJSONWithSpecialStatusHandling(async_callback_url).then(function (data) {
							// if the request is still not proccesed
							if (!!data.status && data.status === 'processing_not_completed' || data === "null") {
								// is this same URL ?
								setTimeout(function () {
									console.info("POLLING::-> for emv terminal response");
									pollToTerminal(async_callback_url);
								}, 5000);
							} else {
								clearInterval(refreshIntervalId);
								deferred.resolve(data);
							}
						}, function (data) {
							if (typeof data === 'undefined') {
								pollToTerminal(async_callback_url);
							} else {
								clearInterval(refreshIntervalId);
								deferred.reject(data);
							}
						});
					}
				};

				RVBaseWebSrvV2.postJSONWithSpecialStatusHandling(url, dataToSrv.postData).then(function (data) {
					// if connect to emv terminal is neeeded
					// need to poll oftently to avoid
					// timeout issues
					if (dataToSrv.postData.is_emv_request) {
						if (!!data.status && data.status === 'processing_not_completed') {
							pollToTerminal(data.location_header);
						} else {
							clearInterval(refreshIntervalId);
							deferred.resolve(data);
						}
					} else {
						clearInterval(refreshIntervalId);
						deferred.resolve(data);
					}
				}, function (data) {
					clearInterval(refreshIntervalId);
					deferred.reject(data);
				});
				return deferred.promise;
			};
			/*
    * Make payment from deposit balance modal
    */
			this.makePaymentOnDepositBalance = function (dataToApiToDoPayment) {
				var deferred = $q.defer();
				var url = 'staff/reservation/post_payment';

				RVBaseWebSrv.postJSON(url, dataToApiToDoPayment).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});
				return deferred.promise;
			};
			this.chipAndPinGetToken = function (postData) {
				var timeStampInSeconds = 0;
				var incrementTimer = function incrementTimer() {
					timeStampInSeconds++;
				};
				var refreshIntervalId = setInterval(incrementTimer, 1000);

				var deferred = $q.defer();
				var url = '/api/cc/get_token.json';

				var pollToTerminal = function pollToTerminal(async_callback_url) {
					// we will continously communicate with the terminal till
					// the timeout set for the hotel
					if (timeStampInSeconds >= $rootScope.emvTimeout) {
						var errors = ["Request timed out. Unable to process the transaction"];

						deferred.reject(errors);
					} else {
						RVBaseWebSrvV2.getJSONWithSpecialStatusHandling(async_callback_url).then(function (data) {
							// if the request is still not proccesed
							if (!!data.status && data.status === 'processing_not_completed' || data === "null") {
								// is this same URL ?
								setTimeout(function () {
									console.info("POLLING::-> for emv terminal response");
									pollToTerminal(async_callback_url);
								}, 5000);
							} else {
								clearInterval(refreshIntervalId);
								deferred.resolve(data);
							}
						}, function (data) {
							if (typeof data === 'undefined') {
								pollToTerminal(async_callback_url);
							} else {
								clearInterval(refreshIntervalId);
								deferred.reject(data);
							}
						});
					}
				};

				RVBaseWebSrvV2.postJSONWithSpecialStatusHandling(url, postData).then(function (data) {
					// if connect to emv terminal is neeeded
					// need to poll oftently to avoid
					// timeout issues
					if (!!data.status && data.status === 'processing_not_completed') {
						pollToTerminal(data.location_header);
					} else {
						clearInterval(refreshIntervalId);
						deferred.resolve(data);
					}
				}, function (data) {
					clearInterval(refreshIntervalId);
					deferred.reject(data);
				});
				return deferred.promise;
			};

			/**
    * Delete a credit card 
    * @param {Object} data contains reservation id and payment method id
    * @return {Promise}
    */
			this.deleteCreditCard = function (data) {
				var deferred = $q.defer(),
				    url = 'api/reservations/' + data.reservation_id + '/delete_credit_card';

				delete data.reservation_id;

				sntBaseWebSrv.postJSON(url, data).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});
				return deferred.promise;
			};
		}]);
	}, {}] }, {}, [1]);