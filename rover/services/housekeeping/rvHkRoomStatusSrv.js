angular.module('sntRover').service('RVHkRoomStatusSrv', [
	'$http',
	'$q',
	'rvBaseWebSrvV2',
	'$window',
	'BaseWebSrvV2',
	'$rootScope',
	'rvAngularIframeHelperSrv',
	'$vault',
	function($http, $q, RVBaseWebSrvV2, $window, BaseWebSrvV2, $rootScope, rvAngularIframeHelperSrv, $vault) {

		this.initFilters = function() {
			return {
				"dirty": false,
				"pickup": false,
				"clean": false,
				"inspected": false,
				"out_of_order": false,
				"out_of_service": false,
				"exclude_out_of_order": false,
				"exclude_out_of_service": false,
				"vacant": false,
				"occupied": false,
				"stayover": false,
				"not_reserved": false,
				"arrival": false,
				"arrived": false,
				"dueout": false,
				"departed": false,
				"dayuse": false,
				"queued": false,
				"lateCheckout": false,
				"pre_checkin": false,
				"floorFilterSingle": "",
				"floorFilterStart": "",
				"floorFilterEnd": "",
				"showAllFloors": true,
				"filterByWorkType": "",
				"filterByEmployeeName": "",
				"singleRoomType": "",
				"query": "",
				"page": 1,
				"perPage": $window.innerWidth < 599 ? 25 : 50
			};
		};

		this.currentFilters = this.initFilters();
		this.isInitialLoad = true;
		this.defaultViewState = null;

		var that = this;

		var $_prepareParams = function(passedParams) {
			var filter                 = this.currentFilters,
				reservation_status     = [],
				front_office_status    = [],
				house_keeping_status   = [],
				exclude_service_status = [],
				room_type_ids          = [],
				floor_start            = false,
				floor_end              = false,
				params                 = {
					'page': filter.page,
					'per_page': filter.perPage
				};

			// if there is a search query, ignore all other filters. Reset page to 1
			if ( filter.query ) {
				params['query'] = filter.query;
				if (passedParams.assignee_id) {
					params['assignee_id'] = passedParams.assignee_id;
				}
				else {
					params['all_employees_selected'] = true;
				}
			} else {

				if ( passedParams.isStandAlone || $rootScope.isStandAlone ) {
					// if: for initial load cases
					// else: for normal case
					if ( this.isInitialLoad ) {
						this.isInitialLoad = false;
						if ( passedParams.work_type_id ) {
							params['work_type_id']  = passedParams.work_type_id;
							filter.filterByWorkType = passedParams.work_type_id;
						}
						if ( passedParams.assignee_id ) {
							params['assignee_id']       = passedParams.assignee_id;
							filter.filterByEmployeeName = passedParams.assignee_id;
						} else {
							params['all_employees_selected'] = true;
						}
					} else {
						if ( filter.filterByWorkType ) {
							params['work_type_id'] = filter.filterByWorkType;
						}
						if ( filter.filterByEmployeeName ) {
							params['assignee_id'] = filter.filterByEmployeeName;
						} else {
							params['all_employees_selected'] = true;
						}
					}
				}

				// process the floors
				if ( !filter.showAllFloors ) {
					floor_start = filter.floorFilterStart || filter.floorFilterSingle;
					floor_end   = filter.floorFilterEnd || filter.floorFilterSingle;
				}

				// process room type ids
				_.each(this.roomTypes, function(type) {
                    if (type.isSelected) {
                        room_type_ids.push(type.id);
                    }
				});

                // process the reservation status
                if (filter.vacant) {
                    reservation_status.push('VACANT');
                }
                if (filter.occupied) {
                    reservation_status.push('OCCUPIED');
                }
                if (filter.queued) {
                    reservation_status.push('QUEUED');
                }
                if (filter.lateCheckout) {
                    reservation_status.push('LATE_CHECKOUT');
                }
                if (filter.pre_checkin) {
                    reservation_status.push('PRE_CHECKIN');
                }

                // process front office status
                if (filter.stayover) {
                    front_office_status.push('STAY_OVER');
                }
                if (filter.not_reserved) {
                    front_office_status.push('NOT_RESERVED');
                }
                if (filter.arrival) {
                    front_office_status.push('ARRIVAL');
                }
                if (filter.arrived) {
                    front_office_status.push('ARRIVED');
                }
                if (filter.dayuse) {
                    front_office_status.push('DAY_USE');
                }
                if (filter.dueout) {
                    front_office_status.push('DUE_OUT');
                }
                if (filter.departed) {
                    front_office_status.push('DEPARTED');
                }

                // process house keeping status
                if (filter.dirty) {
                    house_keeping_status.push('DIRTY');
                }
                if (filter.clean) {
                    house_keeping_status.push('CLEAN');
                }
                if (filter.inspected) {
                    house_keeping_status.push('INSPECTED');
                }
                if (filter.pickup) {
                    house_keeping_status.push('PICKUP');
                }
                if (filter.out_of_order) {
                    house_keeping_status.push('OUT_OF_ORDER');
                }
                if (filter.out_of_service) {
                    house_keeping_status.push('OUT_OF_SERVICE');
				}
				if (filter.exclude_out_of_order) {
					exclude_service_status.push('OUT_OF_ORDER');
				}
				if (filter.exclude_out_of_service) {
					exclude_service_status.push('OUT_OF_SERVICE');
				}

                // fill request param
                if (reservation_status.length) {
                    params['reservation_status'] = reservation_status;
                }
                if (front_office_status.length) {
                    params['front_office_status'] = front_office_status;
                }
                if (house_keeping_status.length) {
                    params['house_keeping_status'] = house_keeping_status;
				}
				if (exclude_service_status.length) {
					params['exclude_service_status'] = exclude_service_status;
				}
                if (room_type_ids.length) {
                    params['room_type_ids'] = room_type_ids;
                }
                if (floor_start) {
                    params['floor_start'] = floor_start;
                }
                if (floor_end) {
                    params['floor_end'] = floor_end;
                }
			}

			return params;
		}.bind(this);

		var roomList = {};

		this.fetchRoomListPost = function(passedParams) {
			var deferred     = $q.defer(),
				url          = '/house/search.json',
				params       = $_prepareParams( passedParams );

			BaseWebSrvV2.postJSON(url, params)
				.then(function(response) {
					roomList = response.data;
					roomList.summary = response.data.summary;

					var lastRoomService = $vault.get('LAST_ROOM_SERVICE');

					if ( !! lastRoomService ) {
						lastRoomService = JSON.parse(lastRoomService);
					} else {
						lastRoomService = {
							rooms: [],
							status: {}
						};
					}

					var i, j;

					for (i = 0, j = roomList.rooms.length; i < j; i++) {
						var room = roomList.rooms[i];

						// reduce scope search
						room.description = room.hk_status.description;

						room.is_occupied = room.is_occupied === 'true' ? true : false;
						room.is_vip = room.is_vip === 'true' ? true : false;

						// single calculate the class required
						// will require additional call from details page
						that.setRoomStatusClass(room);

						// set the leaveStatusClass or enterStatusClass value
						that.setReservationStatusClass(room);

						room.timeOrIn = calculateTimeOrIn(room);
						room.timeOrOut = calculateTimeOrOut(room);

						room.assigned_staff = calculateAssignedStaff(room);

						room.ooOsTitle = calculateOoOsTitle(room);

						if ( lastRoomService.rooms.length ) {
							if ( _.indexOf(lastRoomService.rooms, room.id) > -1 ) {
								room.service_status = $.extend(
									{},
									room.service_status,
									lastRoomService.status
								);
							}
						}
					}

					deferred.resolve(roomList);
				}, function(data) {
					deferred.reject(data);
				});

			return deferred.promise;
		};

		// batch loading a lot of things
		this.fetchPayload = function(passedParams) {
			var deferred           = $q.defer(),
				passedParams       = passedParams,
				paramWorkTypeId    = false,
				paramEmployeeId    = false,
				additionalParams   = {},
				fetchedWorkTypes   = {},
				fetchedAssignments = {};

			if ( passedParams.isStandAlone || $rootScope.isStandAlone ) {
				this.fetchWorkTypes().then( _fetchWorkAssignments.bind(this) );
			} else {
				_fetchRoomListPost.call(this);
			}

            function _fetchWorkAssignments(workTypes) {
                fetchedWorkTypes = workTypes;

                var params = {
                    'date': $rootScope.businessDate,
                    'employee_ids': [$rootScope.userId]
                };

                /**
                 * In case of maintenance staff (HK), the rooms assigned to him/ her are shown
                 * Hence, an additional API call is made to verify if the user has any assigned rooms for tasks
                 */

                if ($rootScope.isMaintenanceStaff) {
                    this.fetchWorkAssignments(params).then(_checkHasActiveWorkSheet.bind(this));
                } else {
                    _fetchRoomListPost.call(this);
                }
            }

			function _checkHasActiveWorkSheet (assignments) {
				var employee = assignments.employees.length && assignments.employees[0] || null,
					hasTasks = employee && employee.room_tasks && employee.room_tasks.length || false;

				if ( hasTasks ) {
					paramEmployeeId = $rootScope.userId;
				} else {
					paramEmployeeId = false;
					paramWorkTypeId = false;
				}

				fetchedAssignments = assignments;

				// make the call
				_fetchRoomListPost.call(this);
			}

			function _fetchRoomListPost () {
				if ( paramWorkTypeId ) {
					additionalParams['work_type_id'] = paramWorkTypeId;
				}

				if ( paramEmployeeId ) {
					additionalParams['assignee_id'] = paramEmployeeId;
				}

				_.extend( passedParams, additionalParams, {'initialLoad': true} );

				this.fetchRoomListPost( passedParams ).then( _resolveData, function(error) {
					deferred.reject(error);
				});
			}

			function _resolveData (roomList) {
				var payload = {
					'roomList': roomList,
					'workTypes': fetchedWorkTypes,
					'assignments': fetchedAssignments
				};

				deferred.resolve(payload);
			}

			return deferred.promise;
		};

		// Get all floors for the current hotel.
		var hotelFloors = [];

		this.fetchFloors = function() {
			var deferred = $q.defer();
			var url = '/api/floors.json';

			if (hotelFloors.length) {
				deferred.resolve(hotelFloors);
			} else {
				BaseWebSrvV2.getJSON(url)
					.then(function(data) {
						hotelFloors = data.floors;
						deferred.resolve(hotelFloors);
					}, function(data) {
						deferred.reject(data);
					});
			}

			return deferred.promise;
		};

		// fetch all room types
		this.roomTypes = [];
		this.fetchRoomTypes = function() {
			var url = 'api/room_types?exclude_pseudo=true';
			var deferred = $q.defer();

			if ( that.roomTypes.length ) {
				deferred.resolve(that.roomTypes);
			} else {
				BaseWebSrvV2.getJSON(url)
					.then(function(data) {
						this.roomTypes = data.results;

						angular.forEach(this.roomTypes, function(type, i) {
							type.isSelected = false;
						});
						rvAngularIframeHelperSrv.setHotelInitialData('ROOM_TYPES', data.results);
						deferred.resolve(this.roomTypes);
					}.bind(this), function(data) {
						deferred.reject(data);
					});
			}

			return deferred.promise;
		};
		this.resetRoomTypes = function() {
			angular.forEach(this.roomTypes, function(type, i) {
				type.isSelected = false;
			});

			return this.roomTypes;
		};
		
		this.allRoomTypes = [];
		this.fetchAllRoomTypes = function() {
			var url = 'api/room_types';
			var deferred = $q.defer();

			if ( that.allRoomTypes.length ) {
				deferred.resolve(that.allRoomTypes);
			} else {
				BaseWebSrvV2.getJSON(url)
					.then(function(data) {
						this.allRoomTypes = data.results;

						angular.forEach(this.allRoomTypes, function(type, i) {
							type.isSelected = false;
						});

						deferred.resolve(this.allRoomTypes);
					}.bind(this), function(data) {
						deferred.reject(data);
					});
			}

			return deferred.promise;
		};


		// fetch all HK cleaning staffs
		var HKEmps = [];

		this.fetchHKEmps = function(params) {
			var url = "/api/work_statistics/employees_list";
			var deferred = $q.defer();

			if (HKEmps.length) {
				deferred.resolve(HKEmps);
			} else {
				BaseWebSrvV2.getJSON(url, params)
					.then(function(data) {
						HKEmps = data.results;
						deferred.resolve(HKEmps);
					}, function(data) {
						deferred.reject(data);
					});
			}

			return deferred.promise;
		};

		// check if this room (number) has been assigned for todays business date
		// http://localhost:3000/house/search.json?query=206&date=2014-12-11
		this.checkRoomAssigned = function(params) {
			var url = "/house/search.json";
			var deferred = $q.defer();

			BaseWebSrvV2.getJSON(url, params)
				.then(function(response) {
					deferred.resolve(response);
				}, function(response) {
					deferred.reject(response);
				});

			return deferred.promise;
		};

		// fetch list of all employees with a worksheet for each work type
		this.fetchActiveWorksheetEmp = function() {
			var url = "/api/work_sheets/active";
			var deferred = $q.defer();

			BaseWebSrvV2.getJSON(url)
				.then(function(data) {
					deferred.resolve(data);
				}, function(data) {
					deferred.reject(data);
				});

			return deferred.promise;
		};

		// get all all WorkTypes
		var workTypesList = [];

		this.fetchWorkTypes = function() {
			var deferred = $q.defer(),
				url = 'api/work_types';

			if (workTypesList.length) {
				deferred.resolve(workTypesList);
			} else {
				BaseWebSrvV2.getJSON(url)
					.then(function(data) {
						workTypesList = data.results;
						deferred.resolve(workTypesList);
					}, function(data) {
						deferred.reject(data);
					});
			}

			return deferred.promise;
		};

		// get the Work Assignments for a particular emp
		this.fetchWorkAssignments = function(params) {
			var deferred = $q.defer(),
				url = 'api/work_assignments/assigned_rooms';

			BaseWebSrvV2.postJSON(url, params)
				.then(function(data) {
					deferred.resolve(data);
				}, function(data) {
					deferred.reject(data);
				});

			return deferred.promise;
		};

		this.fetchHkStatusList = function() {
			var deferred = $q.defer(),
				url = 'api/rooms/hk_status_list';

			BaseWebSrvV2.getJSON(url)
				.then(function(data) {
					deferred.resolve(data);
				}, function(data) {
					deferred.reject(data);
				});

			return deferred.promise;
		};

		// put hk status change from room status page
		// this api can update hk status for one
		// or many room at once
		this.putHkStatusChange = function(params) {
			var deferred = $q.defer(),
				url = 'house/mass_change_hk_status';

			BaseWebSrvV2.putJSON(url, params)
				.then(function(data) {
					deferred.resolve(data);
				}, function(data) {
					deferred.reject(data);
				});

			return deferred.promise;
		};

		this.fetchAllRoomIDs = function() {
			var deferred = $q.defer(),
				url = '/house/room_ids_list';

			BaseWebSrvV2.getJSON(url)
				.then(function(data) {
					deferred.resolve(data.room_ids);
				}, function(data) {
					deferred.reject(data);
				});

			return deferred.promise;
		};


		this.toggleFilter = function(item) {
			this.currentFilters[item] = !this.currentFilters[item];
		};

		this.isListEmpty = function() {
			if (roomList && roomList.rooms && roomList.rooms.length) {
				return false;
			} else {
				return true;
			}
		};


		// Moved from ctrl to srv as this is calculated only once
		// keept as msg so that it can be called from crtl if needed
		this.setRoomStatusClass = function(room) {

			var isOOSorOOO;

			if ( room.hasOwnProperty('service_status') ) {
				// new code, note: new code is not dependent on 'isStandAlone'
				isOOSorOOO = (room.service_status.value === 'OUT_OF_SERVICE' || room.service_status.value === 'OUT_OF_ORDER') ? true : false;
			} else {
				// old code, kept for just in case fallbacks
				isOOSorOOO = room.hk_status.value === 'OO' || room.hk_status.value === 'OS' || room.room_reservation_hk_status === 2 || room.room_reservation_hk_status === 3;
			}

			if (!isOOSorOOO && roomList.checkin_inspected_only === "true") {
				if (room.hk_status.value === 'INSPECTED') {
					room.roomStatusClass = 'clean';
					return;
				}
				if ((room.hk_status.value === 'CLEAN' || room.hk_status.value === 'PICKUP')) {
					room.roomStatusClass = 'pickup';
					return;
				}
				
			} else if (!isOOSorOOO) {
				if ((room.hk_status.value === 'CLEAN' || room.hk_status.value === 'INSPECTED')) {
					room.roomStatusClass = 'clean';
					return;
				}
				if ((room.hk_status.value === 'PICKUP')) {
					room.roomStatusClass = 'pickup';
					return;
				}
				
			}

			if ((room.hk_status.value === 'DIRTY') && !isOOSorOOO) {
				room.roomStatusClass = 'dirty';
				return;
			}

			if (room.hk_status.value === 'DO_NOT_DISTURB') {
				room.roomStatusClass = 'dnd';
				return;
			}

			if (isOOSorOOO) {
				room.roomStatusClass = 'out';

				if (!!room.hk_status.oo_status) {
					if (roomList.checkin_inspected_only === "true") {
						if (room.hk_status.oo_status === 'INSPECTED') {
							room.roomStatusClassWithOO = 'clean';
							return;
						}
						if ((room.hk_status.oo_status === 'CLEAN' || room.hk_status.oo_status === 'PICKUP')) {
							room.roomStatusClassWithOO = 'pickup';
							return;
						}
					} else {
						if ((room.hk_status.oo_status === 'CLEAN' || room.hk_status.oo_status === 'INSPECTED')) {
							room.roomStatusClassWithOO = 'clean';
							return;
						}
						if ((room.hk_status.oo_status === 'PICKUP')) {
							room.roomStatusClassWithOO = 'pickup';
							return;
						}
					}
					if ((room.hk_status.oo_status === 'DIRTY')) {
						room.roomStatusClassWithOO = 'dirty';
						return;
					}
				}

				return;
			}
		};


		// Moved from ctrl to srv as this is calculated only once
		// keept as msg so that it can be called from crtl if needed
		this.setReservationStatusClass = function(room) {

			// room.leaveStatusClass is for first arrow. can be red(check-out), blue(inhouse) or gray(no-show)
			// room.enterStatusClass is for second arrow. can be green(check-in) or gray(no-show)
			switch (room.room_reservation_status) {
				case 'Due out':
					room.leaveStatusClass = 'check-out';
					room.enterStatusClass = 'no-show';
					break;

				case 'Stayover':
					room.leaveStatusClass = 'inhouse';
					room.enterStatusClass = 'no-show';
					break;

				case 'Departed':
					room.leaveStatusClass = 'check-out';
					room.enterStatusClass = 'no-show';
					break;

				case 'Arrival':
					room.leaveStatusClass = 'no-show';
					room.enterStatusClass = 'check-in';
					break;

				case 'Arrived':
					room.leaveStatusClass = 'no-show';
					room.enterStatusClass = 'check-in';
					break;

				case 'Due out / Arrival':
					room.leaveStatusClass = 'check-out';
					room.enterStatusClass = 'check-in';
					break;

				case 'Departed / Arrival':
					room.leaveStatusClass = 'check-out';
					room.enterStatusClass = 'check-in';
					break;

				case 'Arrived / Departed':
					room.leaveStatusClass = 'check-out';
					room.enterStatusClass = 'check-in';
					break;

				case 'Due out / Departed':
					room.leaveStatusClass = 'check-out';
					room.enterStatusClass = 'check-out';
					break;

				case 'Arrived / Day use / Due out':
					room.leaveStatusClass = 'check-out';
					room.enterStatusClass = 'no-show';
					break;

				case 'Arrived / Day use / Due out / Departed':
					room.leaveStatusClass = 'check-out';
					room.enterStatusClass = 'check-out';
					break;

				default:
					room.leaveStatusClass = 'no-show';
					room.enterStatusClass = 'no-show';
					break;
			}

			if ( room.is_late_checkout === 'true' ) {
				room.leaveStatusClass = 'late-check-out';
			}
		};

		/**
		 * CICO-8470 QA comment : Rooms filter for OOO/OOS does not display the correct rooms
		 * The methods setWorkStatus and setRoomStatus
		 *  just updates the property param with the value param passed into it for the room specified!
		 */
		this.setRoomStatus = function(id, property, value) {
			var matchedRoom = _.find(roomList.rooms, function(room) {
				return parseInt(room.id) === id;
			});

			matchedRoom[property] = value;
			matchedRoom.ooOsTitle = calculateOoOsTitle(matchedRoom);
			this.setRoomStatusClass(matchedRoom);
		};

		this.setWorkStatus = function(id, status) {
			var matchedRoom = _.find(roomList.rooms, function(room) {
				return parseInt(room.id) === id;
			});

			matchedRoom.hk_status.description = status.description;
			matchedRoom.description = matchedRoom.hk_status.description;
			matchedRoom.hk_status.value = status.value;
			this.setRoomStatusClass(matchedRoom);
		};

		// set the arrival time or 'IN' text for arrivied
		var calculateTimeOrIn = function(room) {
			if (room.room_reservation_status.indexOf('Arrived') >= 0 && !(room.room_reservation_status.indexOf('Day use') >= 0)) {
				return 'IN';
			}
			if (room.room_reservation_status.indexOf('Arrival') >= 0) {
				return room.arrival_time;
			}
			return '';
		};

		// set the departure/latecheckout time or 'OUT' for departed
		var calculateTimeOrOut = function(room) {
			if (room.room_reservation_status.indexOf('Departed') >= 0) {
				return 'OUT';
			} else if (room.room_reservation_status.indexOf('Due out') >= 0) {
				return room.is_late_checkout === 'true' ? room.late_checkout_time : room.departure_time;
			}

			return '';
		};

		// calculate the assigned maid name and its class
		var calculateAssignedStaff = function(room) {
			if (!$rootScope.isStandAlone) {
				return false;
			}

			var assignedStaff = {
				name: 'Unassigned',
				class: 'unassigned'
			};

			room.canAssign = true;

			if ( !!room.room_tasks && room.room_tasks.length ) {
				room.canAssign = false;
				assignedStaff.class = 'assigned';

				if (_.unique(_.pluck(_.pluck(room.room_tasks, 'assignee_maid'), 'id')).length > 1) {
					assignedStaff.name = 'Multiple Assignees';
				} else {
					assignedStaff.name = room.room_tasks[0].assignee_maid.name;
				}
			}

			return assignedStaff;
		};
		// exposing the method to service

		this.calculateAssignedStaff = calculateAssignedStaff;

		// calculte the OO/OS title
		// in future the internal check may become common - to check only 'room_reservation_hk_status'
		var calculateOoOsTitle = function(room) {
			if ( room.hasOwnProperty('service_status') ) {
				// new code, note: new code is not dependent on 'isStandAlone'
				if ( room.service_status.value === 'OUT_OF_SERVICE' ) {
					return 'Out of Service';
				} else if ( room.service_status.value === 'OUT_OF_ORDER') {
					return 'Out of Order';
				} else {
					return '';
				}
			} else {
				// old code, kept for just in case fallbacks
				if ($rootScope.isStandAlone) {
					return room.room_reservation_hk_status === 2 ? 'Out of Service' :
						room.room_reservation_hk_status === 3 ? 'Out of Order' :
						false;
				} else {
					return room.hk_status.value === 'OS' ? 'Out of Service' :
						room.hk_status.value === 'OO' ? 'Out of Order' :
						false;
				}
			}
		};

	}
]);
