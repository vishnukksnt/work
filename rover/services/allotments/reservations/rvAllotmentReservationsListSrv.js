angular.module('sntRover').service('rvAllotmentReservationsListSrv', ['$q', 'rvBaseWebSrvV2', 'rvUtilSrv',
	function($q, rvBaseWebSrvV2, util) {
        
        var that = this;

		// some default values
		this.DEFAULT_PER_PAGE = 50;
		this.DEFAULT_PAGE = 1;
		/**
		 * to get the reservations agianst a group
		 * @return {Promise} [will get the reservation list]
		 */
		this.fetchReservations = function(params) {
			var deferred = $q.defer(),
				allotment_id = params.id,
				url = '/api/allotments/' + allotment_id + "/reservations";

			rvBaseWebSrvV2.getJSON(url, params.payLoad).then(
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
		 * function to perform auto room assignment
		 * @return {Promise}
		 */
		this.performAutoRoomAssignment = function(params) {
			var deferred = $q.defer(),
				allotment_id = params.id,
				url = '/api/allotments/' + allotment_id + '/auto_room_assignment',
				params = {
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
		 * Function to get Room type configured against allotment
		 * @return {Promise} [will get the details]
		 */
		this.getRoomTypesConfiguredAgainstGroup = function(params) {
			var deferred = $q.defer(),
				allotment_id = params.id,
				data = _.omit(params, 'id'),
				url = '/api/group_rooms/' + allotment_id ;


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

		this.removeReservation = function(data) {
			var deferred = $q.defer(),
				url = 'api/group_reservations/' + data.id + '/cancel';

			rvBaseWebSrvV2.postJSON(url, data)
				.then(function(data) {
					deferred.resolve(data);
				}, function(data) {
					deferred.reject(data);
				});
			return deferred.promise;
		};

		/**
		 * to send reservation list to some email
		 * @param  {[type]} data [description]
		 * @return {[type]}      [description]
		 */
		this.emailInvoice = function(data) {
			var deferred = $q.defer(),
				url = '/api/allotments/email_rooming_list';
			
			rvBaseWebSrvV2.postJSON(url, data).then(
				function(data) {
					deferred.resolve(data);
				}, 
				function(data) {
					deferred.reject(data);
				}
			);

			return deferred.promise;
		};

		/**
		 * to add number of reservations agianst a room type & allotment
		 * @return {Promise} [will get the reservation list]
		 */
		this.addReservations = function(params) {
			var deferred = $q.defer(),
				allotment_id = params.id,
				url = '/api/allotments/' + allotment_id + '/reservations';

			var params = {
				reservations_data: {
					room_type_id: params.room_type_id,
					from_date: params.from_date,
					to_date: params.to_date,
					occupancy: params.occupancy,
					no_of_reservations: params.no_of_reservations,
					is_from_allotment: true
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
	 * [toggleHideRate description]
	 * @param  {[type]} params [description]
	 * @return {[type]}        [description]
	 */
	this.toggleHideRate = function( params ) {
		var deferred = $q.defer(),
			url = 'api/allotments/' + params.id + '/hide_rates';

			rvBaseWebSrvV2.postJSON(url, _.without(params, 'id')).then(function(data) {
			   	 deferred.resolve(data);
			}, function(data) {
			    deferred.reject(data);
			});
		return deferred.promise;
	};

	this.fetchRegistrationCardPrintData = function(params) {
		var deferred = $q.defer();
		var url = '/api/allotments/' + params.id + '/batch_print_registration_cards';

		rvBaseWebSrvV2.getJSON(url).then(function(data) {
			deferred.resolve(data);
		}, function(data) {
			deferred.reject(data);
		});

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
}]);