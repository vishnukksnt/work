angular.module('sntRover').service('rvAccountsSrv',
	['$q', 'rvBaseWebSrvV2',
	function($q, rvBaseWebSrvV2) {

		// some default values
		this.DEFAULT_PER_PAGE 	= 50;
		this.DEFAULT_PAGE 		= 1;

		/**
		* functio to get list of groups against a query, from date, to date
		* @param {Object} with search query, from_date, to_date
		* @return {Promise} - After resolving it will return the list of groups
		*/
		this.getAccountsList = function(params) {
			var deferred = $q.defer(),

				url = '/api/posting_accounts/search';

			var data = {
				'q': params.query,
				'status': params.status,
				'per_page': params.per_page,
				'page': params.page,
				'account_type': params.account_type,
				'is_non_zero': params.is_non_zero
			};

			rvBaseWebSrvV2.getJSON(url, data).then(
				function(data) {
					deferred.resolve(data);
				},
				function(errorMessage) {
					deferred.reject(errorMessage);
				}
			);

			return deferred.promise;
		};

	}]);