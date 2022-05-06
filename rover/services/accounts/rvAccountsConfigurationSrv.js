angular.module('sntRover').service('rvAccountsConfigurationSrv', ['$q', 'rvBaseWebSrvV2',
	function($q, rvBaseWebSrvV2) {

		var self = this;

		this.baseAccountSummaryData = {
			"posting_account_id": "",
			"posting_account_name": "",
			"posting_account_number": "",
			"posting_account_type": "HOUSE",
			"posting_account_status": "OPEN",
			"demographics": {
				market_segment_id: "",
				source_id: "",
				booking_origin_id: ""
			},
			notes: [],
			"travel_agent": null,
			"company": null
		};

		// AccountSummary


		this.getAccountSummary = function(params) {
			var deferred = $q.defer();

			if (params.accountId === "NEW_ACCOUNT") {
				deferred.resolve(angular.copy(self.baseAccountSummaryData));
			} else {
				var url = 'api/posting_accounts/' + params.accountId;
				
				rvBaseWebSrvV2.getJSON(url).then(
					function(data) {
						deferred.resolve(data);
					},
					function(errorMessage) {
						deferred.reject(errorMessage);
					}
				);
			}
			return deferred.promise;
		};

		this.updateAccountSummary = function(data) {
			var deferred = $q.defer(),
				url = 'api/posting_accounts/' + data.summary.posting_account_id;

			rvBaseWebSrvV2.putJSON(url, data.summary)
				.then(function(data) {
					deferred.resolve(data);
				}, function(data) {
					deferred.reject(data);
				});

			return deferred.promise;
		};


		this.updateBillingRefNumber = function(data) {
			var deferred = $q.defer(),
				url = 'api/posting_accounts/' + data.summary.posting_account_id;

                data.summary.custom_reference_number = data.custom_reference_number;

			rvBaseWebSrvV2.putJSON(url, data.summary)
				.then(function(data) {
					deferred.resolve(data);
				}, function(data) {
					deferred.reject(data);
				});

			return deferred.promise;
		};

		this.saveAccountSummary = function(data) {
			var deferred = $q.defer(),
				url = 'api/posting_accounts';

			rvBaseWebSrvV2.postJSON(url, data.summary)
				.then(function(data) {
					deferred.resolve(data);
				}, function(data) {
					deferred.reject(data);
				});

			return deferred.promise;
		};


		// Account Notes

		this.saveAccountNote = function(data) {
			var deferred = $q.defer(),
				url = 'api/posting_accounts/save_posting_account_note';

			rvBaseWebSrvV2.postJSON(url, data)
				.then(function(data) {
					deferred.resolve(data);
				}, function(data) {
					deferred.reject(data);
				});
			return deferred.promise;
		};

		// CICO-24928
		this.updateAccountNote = function(data) {
			var deferred = $q.defer(),
				url = 'api/notes/' + data.id;

			rvBaseWebSrvV2.putJSON(url, data)
				.then(function(data) {
					deferred.resolve(data);
				}, function(data) {
					deferred.reject(data);
				});
			return deferred.promise;
		};

		this.removeAccountNote = function(data) {
			var deferred = $q.defer(),
				url = 'api/posting_accounts/delete_posting_account_note';

			rvBaseWebSrvV2.deleteJSON(url, data)
				.then(function(data) {
					deferred.resolve(data);
				}, function(data) {
					deferred.reject(data);
				});
			return deferred.promise;
		};

		this.emailInvoice = function(data) {
			var deferred = $q.defer(),
				url = 'api/posting_accounts/email_bill_card';

			rvBaseWebSrvV2.postJSON(url, data)
				.then(function(data) {
					deferred.resolve(data);
				}, function(data) {
					deferred.reject(data);
				});
			return deferred.promise;
		};
	}
]);
