'use strict';

angular.module('sntRover').service('rvAccountTransactionsSrv', ['$q', 'rvBaseWebSrvV2', '$rootScope', function ($q, rvBaseWebSrvV2, $rootScope) {

	var self = this;

	this.fetchGroupAllowances = function (params) {
		var url = '/api/groups/' + params.id + '/group_allowance_transactions';

		return rvBaseWebSrvV2.getJSON(url, { associated_type: params.type }).then(function (response) {
			var result = {
				dataByAllowance: [],
				dataByDate: []
			};

			response.allowance_data = _.map(response.allowance_data, function (a) {
				a.ptime = parseInt(a.time.replace(':', ''), 10);
				return a;
			});
			try {
				if (response.allowance_data && response.allowance_data.length) {
					result.dataByAllowance = _.groupBy(response.allowance_data, function (entry) {
						return entry.addon_id;
					});
					result.dataByDate = _.groupBy(response.allowance_data, function (entry) {
						return entry.date;
					});

					_.each(result.dataByAllowance, function (val, k) {
						result.dataByAllowance[k] = _.sortBy(val, function (i) {
							return i.ptime;
						});
					});

					_.each(result.dataByDate, function (val, k) {
						result.dataByDate[k] = _.sortBy(val, function (i) {
							return i.ptime;
						});
					});
				}
			} catch (error) {
				console.error(error);
			}

			return result;
		}, function () {});
	};

	this.searchAllowanceShares = function (params) {
		var deferred = $q.defer(),
		    url = '/api/groups/' + params.groupId + '/group_allowance_search';

		rvBaseWebSrvV2.getJSON(url, { query: params.query, associated_type: params.type }).then(function (response) {
			deferred.resolve(response);
		}, function (data) {
			deferred.reject(data);
		});
		return deferred.promise;
	};

	this.saveAllowanceShares = function (params) {
		var deferred = $q.defer(),
		    url = '/api/groups/' + params.groupId + '/group_allowance_share';

		rvBaseWebSrvV2.postJSON(url, {
			shared_allowances: params.data,
			associated_type: params.type
		}).then(function (data) {
			deferred.resolve(data);
		}, function (data) {
			deferred.reject(data);
		});

		return deferred.promise;
	};

	this.fetchTransactionDetails = function (params) {
		var deferred = $q.defer(),
		    url = '/api/posting_accounts/' + params.account_id + '/bill_card';

		rvBaseWebSrvV2.getJSON(url).then(function (data) {
			angular.forEach(data.bills, function (bill) {
				bill.page_no = 1;
				bill.transactions = [];
				bill.activeDate = bill.days.length > 0 ? _.last(bill.days).date : null;
			});
			deferred.resolve(data);
		}, function (data) {
			deferred.reject(data);
		});

		return deferred.promise;
	};

	this.fetchBillTransactionDetails = function (params) {
		var deferred = $q.defer(),
		    url = '/api/bills/' + params.bill_id + '/transactions?date=' + params.date + '&page=' + params.page + '&per_page=' + params.per_page;

		rvBaseWebSrvV2.getJSON(url).then(function (data) {
			deferred.resolve(data);
		}, function (data) {
			deferred.reject(data);
		});

		return deferred.promise;
	};

	this.createAnotherBill = function (params) {
		var deferred = $q.defer(),
		    url = 'api/bills/create_bill';

		rvBaseWebSrvV2.postJSON(url, params).then(function (data) {
			deferred.resolve(data);
		}, function (data) {
			deferred.reject(data);
		});

		return deferred.promise;
	};

	this.moveToAnotherBill = function (params) {
		var deferred = $q.defer(),
		    url = 'api/bills/transfer_transaction';

		rvBaseWebSrvV2.postJSON(url, params).then(function (data) {
			deferred.resolve(data);
		}, function (data) {
			deferred.reject(data);
		});

		return deferred.promise;
	};

	/*
 * Service function to edit transaction
 * @method PUT
 * @param {object} data
 * @return {object} defer promise
 */

	this.transactionEdit = function (data) {

		var deferred = $q.defer();
		var trasactionId = data.id;
		var updatedDate = data.updatedDate;
		var url = 'api/financial_transactions/' + trasactionId;

		rvBaseWebSrvV2.putJSON(url, updatedDate).then(function (data) {
			deferred.resolve(data);
		}, function (data) {
			deferred.reject(data);
		});

		return deferred.promise;
	};

	/*
  * Service function to edit charge code description
  * @method POST
  * @param {object} data
  * @return {object} defer promise
  */

	this.transactionEditChargeDescription = function (params) {

		var deferred = $q.defer();
		var url = 'api/financial_transactions/' + params.id + '/save_custom_description';

		rvBaseWebSrvV2.postJSON(url, params.postData).then(function (data) {
			deferred.resolve(data);
		}, function (data) {
			deferred.reject(data);
		});
		return deferred.promise;
	};

	/*
 * Service function to delete transaction
 * @method PUT
 * @param {object} data
 * @return {object} defer promise
 */

	this.transactionDelete = function (deleteData) {

		var deferred = $q.defer();
		var trasactionId = deleteData.id;
		var url = 'api/financial_transactions/' + trasactionId;

		rvBaseWebSrvV2.putJSON(url, deleteData.data).then(function (data) {
			deferred.resolve(data);
		}, function (data) {
			deferred.reject(data);
		});

		return deferred.promise;
	};
	/*
 * Service function to split transaction
 * @method PUT
 * @param {object} data
 * @return {object} defer promise
 */

	this.transactionSplit = function (splitData) {
		var deferred = $q.defer();
		var trasactionId = splitData.id;
		var url = 'api/financial_transactions/' + trasactionId;

		rvBaseWebSrvV2.putJSON(url, splitData.data).then(function (data) {
			deferred.resolve(data);
		}, function (data) {
			deferred.reject(data);
		});
		return deferred.promise;
	};

	/*
 * Service function to add new card
 * @method POST
 * @param {object} data
 * @return {object} defer promise
 */

	this.savePaymentDetails = function (data) {
		var deferred = $q.defer();
		var url = '/api/bills/' + data.bill_id + '/add_payment_method';

		rvBaseWebSrvV2.postJSON(url, data.data_to_pass).then(function (data) {
			deferred.resolve(data);
		}, function (data) {
			deferred.reject(data);
		});
		return deferred.promise;
	};

	/*
 * Service function to submit payment
 * @method POST
 * @param {object} data
 * @return {object} defer promise
 */

	this.submitPaymentOnBill = function (postData) {
		// var deferred = $q.defer();
		// var url = '/api/bills/'+data.bill_id+'/submit_payment';
		// rvBaseWebSrvV2.postJSON(url, data.data_to_pass).then(function(data) {
		// 	    deferred.resolve(data);
		// 	},function(data){
		// 	    deferred.reject(data);
		// 	});
		// return deferred.promise;
		// 
		var timeStampInSeconds = 0;
		var incrementTimer = function incrementTimer() {
			timeStampInSeconds++;
		};
		var refreshIntervalId = setInterval(incrementTimer, 1000);

		var deferred = $q.defer();
		var url = '/api/bills/' + postData.bill_id + '/submit_payment';

		var pollToTerminal = function pollToTerminal(async_callback_url) {
			// we will continously communicate with the terminal till 
			// the timeout set for the hotel
			if (timeStampInSeconds >= $rootScope.emvTimeout) {
				var errors = ["Request timed out. Unable to process the transaction"];

				deferred.reject(errors);
			} else {
				rvBaseWebSrvV2.getJSONWithSpecialStatusHandling(async_callback_url).then(function (data) {
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

		rvBaseWebSrvV2.postJSONWithSpecialStatusHandling(url, postData.data_to_pass).then(function (data) {
			// if connect to emv terminal is neeeded
			// need to poll oftently to avoid
			// timeout issues
			if (postData.data_to_pass.is_emv_request) {
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
 * Service function to post charge
 * @method POST
 * @param {object} data
 * @return {object} defer promise
 */

	this.postCharges = function (params) {
		var deferred = $q.defer();
		var url = '/staff/items/post_items_to_bill';

		rvBaseWebSrvV2.postJSON(url, params).then(function (data) {
			deferred.resolve(data);
		}, function (data) {
			deferred.reject(data);
		});

		return deferred.promise;
	};

	/*
 * Service function to check if AR account is attached or not
 * @method POST
 * @param {object} data
 * @return {object} defer promise
 */

	this.checkForArAccount = function (params) {

		var deferred = $q.defer(),
		    url = '/api/posting_accounts/' + params.account_id + '/check_ar_account_attached';

		rvBaseWebSrvV2.getJSON(url).then(function (data) {
			deferred.resolve(data);
		}, function (data) {
			deferred.reject(data);
		});

		return deferred.promise;
	};

	/*
 * Service to get the invoice for group/house accounts
 * @method POST
 * @param {object} params
 * @return {object} defer promise
 */
	this.fetchAccountBillsForPrint = function (params) {
		var deferred = $q.defer();
		var url = '/api/posting_accounts/print_bill_card';

		rvBaseWebSrvV2.postJSON(url, params).then(function (data) {
			deferred.resolve(data);
		}, function (data) {
			deferred.reject(data);
		});

		return deferred.promise;
	};

	// Service that fetches the charge details of a grouped charge - CICO-34039.
	this.groupChargeDetailsFetch = function (params) {
		var deferred = $q.defer(),
		    url = '/api/posting_accounts/transaction_details';

		rvBaseWebSrvV2.getJSON(url, params).then(function (data) {
			deferred.resolve(data);
		}, function (data) {
			deferred.reject(data);
		});

		return deferred.promise;
	};
}]);