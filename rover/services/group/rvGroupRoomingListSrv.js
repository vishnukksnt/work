angular.module('sntRover').service('rvGroupRoomingListSrv', ['$q', 'rvBaseWebSrvV2', 'rvUtilSrv', 'sntBaseWebSrv',
	function($q, rvBaseWebSrvV2, util, sntBaseWebSrv) {

		var that = this;

		// some default values
		this.DEFAULT_PER_PAGE = 50;
		this.DEFAULT_PAGE = 1;

		/**
		 * to add number of reservations agianst a room type & group
		 * @return {Promise} [will get the reservation list]
		 */
		this.addReservations = function(params) {
			var deferred = $q.defer(),
				group_id = params.id,
				url = '/api/group_reservations/',

				params = {
					"group_id": params.group_id,
					"reservations_data": {
						"room_type_id": params.room_type_id,
						"from_date": params.from_date,
						"to_date": params.to_date,
						"occupancy": params.occupancy,
						"no_of_reservations": params.no_of_reservations
					}
				};


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

		/**
		 * to get the reservations agianst a group
		 * @return {Promise} [will get the reservation list]
		 */
		this.fetchReservations = function(params) {
			var deferred = $q.defer(),
				url = '/api/group_reservations/' + params.group_id + '/list';

			var data = $.extend(
				{},
				{
					per_page: params.per_page,
					page: params.page,
					locale: params.locale || 'en' // default locale when not set
				}
			);

			var keys = ['sort_field', 'sort_dir', 'arrival_date', 'dep_date', 'query', 'exclude_cancel', 'show_pending_only'];

			_.each(keys, function(key) {
				if ( typeof params[key] !== typeof true && !! params[key] ) {
					data[key] = params[key];
				}
				if ( typeof params[key] === typeof true ) {
					data[key] = params[key];
				}
			});

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
		 * function to perform mass checkin
		 * @return {Promise}
		 */
		this.performMassCheckin = function(params) {
			var deferred = $q.defer(),
				group_id = params.id,
				url = '/api/group_checkins/',
				params = {
					"group_id": params.group_id,
					"reservation_ids": params.reservation_ids
				};


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

		/**
		 * function to perform mass checkout
		 * @return {Promise}
		 */
		this.performMassCheckout = function(params) {
			var deferred = $q.defer(),
				group_id = params.id,
				url = '/api/group_checkouts/',
				params = {
					"group_id": params.group_id,
					"reservation_ids": params.reservation_ids
				};


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

		/**
		 * function to perform auto room assignment
		 * @return {Promise}
		 */
		this.performAutoRoomAssignment = function(params) {
			var deferred = $q.defer(),
				group_id = params.id,
				url = '/api/groups/auto_room_assignment',

				params = {
					"group_id": params.group_id,
					"reservation_ids": params.reservation_ids
				};


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

		/**
		 * to get free rooms which are able to assign to a reservation
		 * @param  {Object} params
		 * @return {promise}
		 */
		this.getFreeAvailableRooms = function(params) {
			var url = '/api/reservations/' + params.reserevation_id + '/ready_to_assign_rooms/',
				deferred = $q.defer(),
				data_for_web_service = {
					'count': params.num_of_rooms_to_fetch,
					'room_type_id': params.room_type_id
				};

			rvBaseWebSrvV2.getJSON(url, data_for_web_service).then(
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
		 * Function to get Room type configured against group
		 * @return {Promise} [will get the details]
		 */
		this.getRoomTypesConfiguredAgainstGroup = function(params) {
			var deferred = $q.defer(),
				group_id = params.id,
				url = 'api/group_rooms/' + group_id;


			rvBaseWebSrvV2.getJSON(url, params).then(
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
		 * Function to check if default charge routing is present or not
		 * @return {Promise} [will get the details]
		 */
		this.checkDefaultChargeRoutings = function(params) {
			var deferred = $q.defer(),
				group_id = params.id,
				url = '/api/groups/' + group_id + '/check_default_charge_routings';

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
		 * Function to attach BillingInfo to Reservations
		 * @return {Promise} [will get the details]
		 */
		this.attachBillingInfoToReservations = function(params) {
			var deferred = $q.defer(),
				url = '/api/default_account_routings/attach_reservation';

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

		this.emailInvoice = function(data) {
			var deferred = $q.defer(),
				url = '/api/group_reservations/email_rooming_list';

			rvBaseWebSrvV2.postJSON(url, data)
				.then(function(data) {
					deferred.resolve(data);
				}, function(data) {
					deferred.reject(data);
				});
			return deferred.promise;
		};

		this.fetchRegistrationCardPrintData = function(params) {
			var deferred = $q.defer();
			var url = '/api/registration_cards/';

			rvBaseWebSrvV2.getJSON(url, params).then(function(data) {
				deferred.resolve(data);
			}, function(data) {
				deferred.reject(data);
			});

			return deferred.promise;
		};

		this.updateGuestData = function(data) {
			var deferred = $q.defer(),
				url = '/api/group_reservations/update_guest_details';

			rvBaseWebSrvV2.postJSON(url, data)
				.then(function(data) {
					deferred.resolve(data);
				}, function(data) {
					deferred.reject(data);
				});
			return deferred.promise;
        };
        
        this.exportRoomingList = function (params) {
            var url = '/api/group_reservations/' + params.group_id + '/list.csv';

            delete params.group_id;

            return sntBaseWebSrv.download(url, params, 'GET');
        };

		/**
	 	* Fetch hotel reservation settings
	 	*/
	  	this.fetchHotelReservationSettings = function () {
			var deferred = $q.defer(),
				url = '/api/hotel_settings/show_hotel_reservation_settings';

			if (that.reservationSettings) {
				deferred.resolve(that.reservationSettings);
			} else {
				rvBaseWebSrvV2.getJSON(url).then(
					function (data) {
						that.reservationSettings = data;
						deferred.resolve(data);
					},
					function (errorMessage) {
						deferred.reject(errorMessage);
					}
				);
			}
			
			return deferred.promise;
		};

	}
]);