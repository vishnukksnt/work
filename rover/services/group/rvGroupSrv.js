angular.module('sntRover').service('rvGroupSrv', ['$q', 'rvBaseWebSrvV2',
	function($q, rvBaseWebSrvV2) {

		// some default values
		this.DEFAULT_PER_PAGE = 50;
		this.DEFAULT_PAGE = 1;

		/**
		 * functio to get list of groups against a query, from date, to date
		 * @param {Object} with search query, from_date, to_date
		 * @return {Promise} - After resolving it will return the list of groups
		 */
		this.getGroupList = function(params) {
			var deferred = $q.defer(),
				url = '/api/groups/search';

			params.q = params.q || params.query;

			rvBaseWebSrvV2.postJSON(url, params).then(
				function(data) {
					deferred.resolve(data);
				},
				function(errorMessage) {
					deferred.reject(errorMessage);
				}
			);

			return deferred.promise;
		};

		this.searchGroupCard = function(params) {
			var deferred = $q.defer(),
				url = '/api/groups/group_search';

			var data = {
				'name': params.name,
				'code': params.code,
				'from_date': params.from_date,
				'to_date': params.to_date,
				'per_page': params.per_page,
				'page': params.page
			};

            // Groups that are not deducted from inventory are exculded from card searches in Reservation module
            if (params.is_take_from_inventory) {
                data.is_take_from_inventory = true;
            }

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
		 * to attach a group to a particular reservation
		 * @return {undefined}
		 */
		this.attachGroupToReservation = function(params) {
			var deferred = $q.defer(),
				url = '/api/reservations/' + params.reservation_id + '/add_group',
				data = {
					'group_id': params.group_id
				};

			if (params.forcefully_overbook) {
				data.forcefully_overbook = params.forcefully_overbook;
			}

			rvBaseWebSrvV2.postJSON(url, data).then(
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
		 * to attach a group to a particular reservation
		 * @return {undefined}
		 */
		this.detachGroupFromReservation = function(params) {
			var deferred = $q.defer(),
				url = '/api/reservations/' + params.reservation_id + '/remove_group',
				data = {
					'group_id': params.group_id
				};

			rvBaseWebSrvV2.postJSON(url, data).then(
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

		var isCancelledGroup = function(group) {
			return (group.hold_status.toLowerCase() === 'cancel');
		};

		this.getClassAgainstPickedStatus = function(group) {
			var classes = '';

			// Add class "green" if No. > 0
			if (group.total_picked_count > 0) {
				classes = 'green';
			}
			// Add class "red" if cancelled
			if (isCancelledGroup(group)) {
				classes += ' red';
			}
			return classes;
		};

        this.getGuestClassForArrival = function(group) {
            // "cancel" if cancelled, "check-in" if not cancelled
            var classes = isCancelledGroup(group) ? 'cancel' : 'check-in';

            return classes;
        };

		this.getGuestClassForDeparture = function(group) {
            // "cancel" if cancelled, 'check-out' if not cancelled
            var classes = isCancelledGroup(group) ? 'cancel' : 'check-out';

            return classes;
        };

        this.getClassAgainstHoldStatus = function(group) {
            // https://stayntouch.atlassian.net/browse/CICO-13899?focusedCommentId=42708&page=com.atlassian.jira.plugin.system.issuetabpanels:comment-tabpanel#comment-42708
            // API returns a string value for 'is_take_from_inventory'
            return group.is_take_from_inventory === 'true' ? '' : 'tentative';
        };

        /**
		 * Function to get list of Hold status to display
		 * @return {Promise} - After resolving it will return the list of Hold status
		 */
		this.getHoldStatusList = function(params) {
			var deferred = $q.defer(),
				url = '/api/group_hold_statuses';

			rvBaseWebSrvV2.getJSON(url, params).then(
				function(data) {
                    _.each(data.data.hold_status, function( item ) {
						item.active = true;
					});
					deferred.resolve(data.data);
				},
				function(errorMessage) {
					deferred.reject(errorMessage);
				}
			);

			return deferred.promise;
		};

		// CICO-77203: Methods to update cache filter data of group list
		this.updateCache = function(data) {
			this.filterParams = data;
		};

		// CICO-77203 : Methods to fetch cache filter data of group list
		this.getCache = function() {
			return this.filterParams;
		};

		// CICO-77203 : Methods to clear cache filter data of group list
		this.clearCache = function() {
			this.filterParams = {};
		};
	}
]);
