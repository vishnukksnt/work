angular.module('sntRover').service('rvAllotmentSrv', ['$q', 'rvBaseWebSrvV2',
	function($q, rvBaseWebSrvV2) {

		// some default values
		this.DEFAULT_PER_PAGE = 50;
		this.DEFAULT_PAGE = 1;

		/**
		 * functio to get list of groups against a query, from date, to date
		 * @param {Object} with search query, from_date, to_date
		 * @return {Promise} - After resolving it will return the list of groups
		 */
		this.getAllotmentList = function(params) {
			var deferred = $q.defer(),

				url = '/api/allotments/search';

			var data = {
				'q': params.query,
				'from_date': params.from_date,
				'to_date': params.to_date,
				'per_page': params.per_page,
				'page': params.page
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

		/**
		 * function to get business date
		 * @return {Promise} - After resolving it will return the business date
		 */
		this.fetchHotelBusinessDate = function() {
			var deferred = $q.defer(),
				url = '/api/business_dates/active';

			rvBaseWebSrvV2.getJSON(url).then(
				function(data) {
					deferred.resolve(data);
				},
				function(errorMessage) {
					deferred.reject(errorMessage);
				}
			);

			return deferred.promise;
		};

		/**
		 * function to attach an allotment to a reservation
		 * @param {Object} with search reservationId, allotmentId
		 * @return {Promise}       
		 */
		this.attachAllotmentToReservation = function(params) {
			var deferred = $q.defer(),
				url = '/api/reservations/' + params.reservationId + '/add_allotment';

			rvBaseWebSrvV2.postJSON(url, {
				allotment_id: params.allotmentId
			}).then(
				function(data) {
					deferred.resolve(data);
				},
				function(errorMessage) {
					deferred.reject(errorMessage);
				}
			);

			return deferred.promise;
		};

		/**
		 * function to attach an allotment to a reservation
		 * @param {Object} with search reservationId, allotmentId
		 * @return {Promise}       
		 */
		this.detachAllotmentFromReservation = function(reservationId) {
			var deferred = $q.defer(),
				url = '/api/reservations/' + reservationId + '/remove_allotment';

			rvBaseWebSrvV2.postJSON(url).then(
				function(data) {
					deferred.resolve(data);
				},
				function(errorMessage) {
					deferred.reject(errorMessage);
				}
			);

			return deferred.promise;
		};

		// CICO-81923: Methods to update cache filter data of allotment list
		this.updateCache = function(data) {
			this.filterParams = data;
		};

		// CICO-81923 : Methods to fetch cache filter data of allotment list
		this.getCache = function() {
			return this.filterParams;
		};

		// CICO-81923 : Methods to clear cache filter data of allotment list
		this.clearCache = function() {
			this.filterParams = {};
		};
	}
]);