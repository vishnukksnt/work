angular.module('sntRover').service('RVWorkManagementSrv', ['$q', 'rvBaseWebSrvV2',
	function($q, RVBaseWebSrvV2) {
		// Meta Data for Work Management
		// 1. Maids
		// 2. WorkTypes
		// 3. Shifts

		var srv = this;

		this.fetchMaids = function(params) {

			var deferred = $q.defer(),
				url = 'api/work_statistics/employees_list';

			params = params || {};

			RVBaseWebSrvV2.getJSON(url, params).then(function(data) {
				_.each(data.results, function(d) {
					d.ticked = false;
					d.checkboxDisabled = false;
				});
				deferred.resolve(data.results);
			}, function(data) {
				deferred.reject(data);
			});
			return deferred.promise;
		};

		this.fetchWorkTypes = function() {
			var deferred = $q.defer();


			var url = 'api/work_types';


			RVBaseWebSrvV2.getJSON(url).then(function(data) {
				deferred.resolve(data.results);
			}, function(data) {
				deferred.reject(data);
			});


			return deferred.promise;
		};

		this.fetchShifts = function() {
			var deferred = $q.defer();
			var url = 'api/shifts';

			RVBaseWebSrvV2.getJSON(url).then(function(data) {
				_.each(data.results, function(shift) {
					shift.display_name = shift.name + "(" + shift.time + ")";
				});
				deferred.resolve(data.results);
			}, function(data) {
				deferred.reject(data);
			});
			return deferred.promise;
		};


		/**
		 * CICO-8605
		 * Method used to fetch the statistics to populate the Work Management Landing Screen
		 * @return Object The statistics returned from API call
		 */
		this.fetchStatistics = function(params) {
			var deferred = $q.defer(),
				url = '/api/work_statistics?date=' + params.date;

			RVBaseWebSrvV2.getJSON(url).then(function(data) {
				deferred.resolve(data);
			}, function(data) {
				deferred.reject(data);
			});
			return deferred.promise;
		};

		// DEPRICATED!!!
		// DEPRICATED!!!
		// DEPRICATED!!!
		// DEPRICATED!!!
		// DEPRICATED!!!
		this.createWorkSheet = function(params) {
			var deferred = $q.defer();
			var url = 'api/work_sheets';

			RVBaseWebSrvV2.postJSON(url, params).then(function(data) {
				deferred.resolve(data);
			}, function(data) {
				deferred.reject(data);
			});
			return deferred.promise;
		};

		// WILL BE DEPRICATED
		// WILL BE DEPRICATED
		// WILL BE DEPRICATED
		// WILL BE DEPRICATED
		this.fetchWorkSheet = function(params) {
			var deferred = $q.defer();
			var url = 'api/work_sheets/' + params.id;

			RVBaseWebSrvV2.getJSON(url).then(function(data) {
				deferred.resolve(data);
			}, function(data) {
				deferred.reject(data);
			});
			return deferred.promise;
		};

		// WILL BE DEPRICATED
		// WILL BE DEPRICATED
		// WILL BE DEPRICATED
		// WILL BE DEPRICATED
		this.deleteWorkSheet = function(params) {
			var deferred = $q.defer();
			var url = 'api/work_sheets/' + params.id;

			RVBaseWebSrvV2.deleteJSON(url).then(function(data) {
				deferred.resolve(data);
			}, function(data) {
				deferred.reject(data);
			});
			return deferred.promise;
		};

		// DEPRICATED!!!
		// DEPRICATED!!!
		// DEPRICATED!!!
		// DEPRICATED!!!
		// DEPRICATED!!!
		this.fetchWorkSheetDetails = function(params) {
			var deferred = $q.defer();
			var url = 'api/work_assignments';
			// RVBaseWebSrvV2.postJSON(url, params).then(function(data) {
			// 	deferred.resolve(data);
			// }, function(data) {
			// 	deferred.reject(data);
			// });

			deferred.resolve([]);
			return deferred.promise;
		};

		// param changed
		this.saveWorkSheet = function(params) {
			var deferred = $q.defer();
			var url = 'api/work_assignments/assign';

			RVBaseWebSrvV2.postJSON(url, params).then(function(data) {
				deferred.resolve(data);
			}, function(data) {
				deferred.reject(data);
			});
			return deferred.promise;
		};

		// DEPRICATED FROM UI!!!
		// DEPRICATED FROM UI!!!
		// DEPRICATED FROM UI!!!
		// DEPRICATED FROM UI!!!
		// DEPRICATED FROM UI!!!
		/**
		 * Method to search Employees from the Work Management Landing page
		 * @param  Object params
		 * @return Object
		 */
		this.searchEmployees = function(params) {
			var deferred = $q.defer(),
				/**
				 * SAMPLE API CALL
				 * /api/work_statistics/employee?query=nic&date=2014-06-30&work_type_id=1
				 */
				url = '/api/work_statistics/employee?query=' + params.key + '&date=' + params.date;

			if (params.workType) {
				url += '&work_type_id=' + params.workType;
			}

			RVBaseWebSrvV2.getJSON(url).then(function(data) {
				deferred.resolve(data.results);
			}, function(data) {
				deferred.reject(data);
			});
			return deferred.promise;
		};

		// DEPRICATED FROM UI!!!
		// DEPRICATED FROM UI!!!
		// DEPRICATED FROM UI!!!
		// DEPRICATED FROM UI!!!
		// DEPRICATED FROM UI!!!
		/**
		 * Method to search Employees from the Work Management Landing page
		 * @param  Object params
		 * @return Object
		 */
		this.searchRooms = function(params) {
			var deferred = $q.defer(),
				url = '/house/search.json?query=' + params.key + '&date=' + params.date;

			RVBaseWebSrvV2.getJSON(url).then(function(data) {
				deferred.resolve(data.data.rooms);
			}, function(data) {
				deferred.reject(data);
			});
			return deferred.promise;
		};

		// MODIFIED BELOW!!!
		// MODIFIED BELOW!!!
		// MODIFIED BELOW!!!
		// MODIFIED BELOW!!!
		// MODIFIED BELOW!!!
		// method to fetch all unassigned rooms for a given date
		this.fetchAllUnassigned = function(params) {
			var deferred = $q.defer(),
				url = 'api/work_assignments/unassigned_rooms?date=' + params.date;

			deferred.resolve([]);

			// RVBaseWebSrvV2.getJSON(url)
			// 	.then(function(data) {
			// 		deferred.resolve(data.results);
			// 	}, function(data) {
			// 		deferred.reject(data);
			// 	});

			return deferred.promise;
		};


		this.fetchHKStaffs = function(params) {
			var deferred = $q.defer(),
				url = 'api/work_statistics/employees_list';
				
			params = params || {};

			var processData = function(data) {
				var results = [],
					emp_ids = [],
                    empResults;

				_.each(data.results, function(emp) {
					emp_ids
						.push( emp.id );

					empResults =  $.extend(
							{},
							emp,
							{ ticked: false },
							{ checkboxDisabled: false }
						);
                    results.push(empResults);
				});

				return {
					'results': results,
					'emp_ids': emp_ids
				};
			};

			RVBaseWebSrvV2.getJSON(url, params).then(function(data) {
				deferred.resolve( processData(data) );
			}, function(data) {
				deferred.reject(data);
			});

			return deferred.promise;
		};


		this.fetchAllTasks = function() {
			var deferred = $q.defer(),
				url = 'api/tasks';

			RVBaseWebSrvV2.getJSON(url)
				.then(function(data) {
					deferred.resolve(data.results);
				}, function(data) {
					deferred.reject(data);
				});

			return deferred.promise;
		};

		this.fetchUnassignedRoomTasks = function(params) {
			var deferred = $q.defer(),
				url = 'api/work_assignments/unassigned_rooms';

			RVBaseWebSrvV2.postJSON(url, params)
				.then(function(data) {
					deferred.resolve(data);
				}, function(data) {
					deferred.reject(data);
				});

			return deferred.promise;
		};

		this.fetchAssignedRoomTasks = function(params) {
			var deferred = $q.defer(),
				url = 'api/work_assignments/assigned_rooms';

			RVBaseWebSrvV2.postJSON(url, params)
				.then(function(data) {
					deferred.resolve(data);
				}, function(data) {
					deferred.reject(data);
				});

			return deferred.promise;
		};

		this.payload = {};
		this.processedPayload = function(unassignedRoomsParam, assignedRoomsParam) {
			var deferred = $q.defer(),
				promises = [],
				unassignedRoomsResponse,
				tasksResponse;

			var allTasksResponse, unassignedRoomsResponse, assignedRoomsResponse;

			var payload, allRooms;

			// fetch tasks and unassigned rooms
			promises.push( this.fetchAllTasks() );
			promises.push( this.fetchUnassignedRoomTasks(unassignedRoomsParam) );
			promises.push( this.fetchAssignedRoomTasks(assignedRoomsParam) );

			$q.all(promises)
				.then(function(data) {
					tasksResponse           = data[0];
					unassignedRoomsResponse = data[1];
					assignedRoomsResponse   = data[2];

					allRooms = compileAllRooms(unassignedRoomsResponse, assignedRoomsResponse);

					this.payload = {
						'allTasks': tasksResponse,
						'allRooms': allRooms,
						'unassignedRoomTasks': compileUnassignedRooms(unassignedRoomsResponse, tasksResponse, JSON.parse(JSON.stringify(allRooms))),
						'assignedRoomTasks': compileAssignedRooms(assignedRoomsResponse, tasksResponse, JSON.parse(JSON.stringify(allRooms)))
					};

					deferred.resolve( this.payload );
				}.bind(this), function(data) {
					deferred.reject(data);
				});

			return deferred.promise;
		};

		this.getRoomDetails = function(index) {
			return this.payload.allRooms[index];
		};

		this.saveWorkSheets = function(options) {
			var deferred = $q.defer(),
				url = 'api/work_assignments/assign';

			var params = compileAssignedRoomsParams( options.assignedRoomTasks, options.date, options.shouldSaveOrder );

			RVBaseWebSrvV2.postJSON(url, params)
				.then(function(data) {
					deferred.resolve(data);
				}, function(data) {
					deferred.reject(data);
				});

			return deferred.promise;
		};

		/**
		 * Sorts/Groups the assigneed empployees list with options
		 * @param {Object} employees list
		 * @param {Object} data of all rooms
		 * @param {Object} data of all tasks
		 * @param {Object} sorting options
		 * @return {Object} sorted list of employees
		 **/
		this.sortAssigned = function(assigned, allRooms, allTasks, options) {
			var length = assigned.length;
			var employee, i, pluckedTasks, roomsSorted, roomIndex, copyRoom, roomInfo;

			var getRoomInfo = function(rooms, id) {
				var match = _.find(rooms, { room_id: id });

				return angular.isDefined(match) ? match : {
					room_type: '',
					is_vip: null
				};
			};

			for (i = 0; i < length; i++) {
				employee = assigned[i];

				// Case 1: group by rooms. rooms will not repeat.
				if (options.grouping === 'room') {
					employee.rooms = _.sortBy(employee.rooms, function(room) {
						return allRooms[room.room_index]['room_no'];
					});
					if (options.sort === 'desc') {
						employee.rooms.reverse();
					}
				}
				// Case 2: group by tasks. in this case rooms will repeat.
				else {
					pluckedTasks 	= _.flatten(_.pluck(employee.rooms, 'room_tasks'));
					roomsSorted = [];

					pluckedTasks = _.sortBy(pluckedTasks,
						function(x) { return x['task_name'].toLowerCase();
					});

					if (options.sort === 'desc') {
						pluckedTasks.reverse();
					}

					// map tasks to rooms
					_.each(pluckedTasks, function(task) {
						roomIndex = _.findIndex(allRooms, { id: task.room_id });
						roomInfo = getRoomInfo(employee.rooms, task.room_id);
						copyRoom  = $.extend(
											{},
											{ 'room_id': task.room_id },
											{ 'room_type': roomInfo.room_type },
											{ 'is_vip': roomInfo.is_vip },
											{ 'room_index': roomIndex },
											{ 'room_tasks': [task] }
										);

						roomsSorted.push(copyRoom);
					});

					employee.rooms = roomsSorted;
				}
			}

			return assigned;
		};

		/**
		 * PRIVATE METHODS
		 */

		function compileAllRooms (unassignedRoomsResponse, assignedRoomsResponse) {
			var allRooms = [];

			return allRooms.concat( unassignedRoomsResponse.rooms, assignedRoomsResponse.rooms );
		}

		function compileUnassignedRooms (unassignedRooms, allTasks, allRooms) {
			var allTasks        = allTasks || [],
				unassignedRooms = $.extend({}, { 'rooms': [], 'room_tasks': [] }, unassignedRooms);

			var rooms     = unassignedRooms.rooms,
				roomTasks = unassignedRooms.room_tasks;

			var i, j, k, l;

			var compiled = [];

			var roomIndex, copyRoom, eachRoomId;

			var copyTask, eachRoomTasks;

			var thatCompiledRoom, thatRoomTypeId, thatRoomNo, thatAllTask;

			// 	creating a fresh array of room by copying rooms
			// 	and augmenting it with empty 'room_tasks'
			for (i = 0, j = rooms.length; i < j; i++) {
				if ( roomTasks[i]['tasks'].length ) {
					roomIndex = _.findIndex(allRooms, function(r) {
						return r.id == rooms[i].id;
					});

					copyRoom = $.extend(
							{},
							{ 'room_id': rooms[i].id },
							{ 'room_type': rooms[i].room_type },
							{ 'is_vip': rooms[i].is_vip },
							{ 'room_index': roomIndex },
							{ 'room_tasks': [] }
						);
					/**
					 * copyRoom
					 * ========
					 * {
					 *   ...room_details
					 *   room_tasks: []
					 * }
					 */

					compiled.push(copyRoom);
				}
			}

			// loop through roomTasks, gather much info on each tasks
			// and push it into appropriate room
			for (i = 0, j = roomTasks.length; i < j; i++) {
				if ( ! roomTasks[i]['tasks'].length ) {
					continue;
				}

				eachRoomId     = roomTasks[i]['room_id'];
				eachRoomTasks  = roomTasks[i]['tasks'];

				thatCompiledRoom = _.find(compiled, { room_id: eachRoomId });

				thatRoomTypeId = allRooms[ thatCompiledRoom.room_index ].room_type;
				thatRoomNo     = allRooms[ thatCompiledRoom.room_index ].room_no;

				for (k = 0, l = eachRoomTasks.length; k < l; k++) {
					thatAllTask = _.find(allTasks, { id: eachRoomTasks[k]['id'] });

					copyTask = $.extend(
							{},
							eachRoomTasks[k],
							{
								'task_name': thatAllTask.name,
								'work_type_id': thatAllTask.work_type_id,
								'work_type_name': thatAllTask.work_type_name,
								'time_allocated': getTimeAllocated( thatAllTask, thatRoomTypeId )
							},
							{
								'room_id': eachRoomId,
								'room_no': thatRoomNo
							}
						);
					/**
					 * copyTask
					 * ========
					 * {
					 *   id: 1,
				     *   completed: false,
					 *   ...additional_tasks_details
					 *   ...room_id & room_no
					 * }
					 */

					thatCompiledRoom
						.room_tasks
						.push( copyTask );
				}
			}

			return compiled;
		}

		function compileAssignedRooms (assignedRooms, allTasks, allRooms) {
			var allTasks      = allTasks || [],
				assignedRooms = $.extend({}, { 'employees': [], 'rooms': [] }, assignedRooms);

			var employees = assignedRooms.employees,
				rooms     = assignedRooms.rooms;

			var i, j, k, l, m, n;

			var compiled = [];

			var roomIndex, copyEmployee, roomTasksInit, copyRoom, tasksInIt, thatAllTask, copyTask, thatRoomTypeId, thatRoomNo;

			var getRoomInfo = function(roomId) {
				var match = _.find(rooms, { id: roomId });

				return match ? match : {
					room_type: '',
					is_vip: null
				};
			};
			var roomInfo;

			for (i = 0, j = employees.length; i < j; i++) {
				var displayName = employees[i].name.split(" "),
					firstname   = displayName.shift();

				displayName = firstname.charAt(0) + ". " + displayName.join(" ");
				copyEmployee = $.extend(
						{},
						{ 'id': employees[i].id, 'name': employees[i].name },
						{ 'display_name': displayName },
						{ 'rooms': [] },
						{ 'only_tasks': [] },
						{ 'touched_work_types': [] },
						{ 'shift_id': employees[i].shift_id }
					);
				/**
				 * copyEmployee
				 * ============
				 * {
				 *   id: 1,
				 *   name: 'Vijay',
				 *   rooms: [],
				 *   only_tasks: [],
				 *   touched_work_types: []
				 * }
				 */

				roomTasksInit = employees[i]['room_tasks'];

				for (k = 0, l = roomTasksInit.length; k < l; k++) {
					roomIndex = _.findIndex(allRooms, function(r) {
						return r.id == roomTasksInit[k].room_id;
					});

					roomInfo = getRoomInfo(roomTasksInit[k].room_id);

					copyRoom = $.extend(
							{},
							{ 'room_id': roomTasksInit[k].room_id },
							{ 'room_type': roomInfo.room_type },
							{ 'is_vip': roomInfo.is_vip },
							{ 'room_index': roomIndex },
							{ 'room_tasks': [] }
						);
					/**
					 * copyRoom
					 * ========
					 * {
					 *   ...room details,
					 *   room_tasks: []
					 * }
					 */

					copyEmployee
						.rooms
						.push( copyRoom );
					/**
					 * copyEmployee
					 * ============
					 * {
					 *   id: 1,
					 *   name: 'Vijay',
					 *   rooms: [{
					 *   	...room details,
					 *      room_tasks: []
					 *   }],
					 *   touched_work_types: []
					 * }
					 */

					tasksInIt = roomTasksInit[k]['tasks'];

					thatRoomTypeId = allRooms[ roomIndex ].room_type;
					thatRoomNo     = allRooms[ roomIndex ].room_no;

					for (m = 0, n = tasksInIt.length; m < n; m++) {
						thatAllTask = _.find(allTasks, { id: tasksInIt[m]['id'] });

						copyTask = $.extend(
								{},
								tasksInIt[m],
								{
									'task_name': thatAllTask.name,
									'work_type_id': thatAllTask.work_type_id,
									'work_type_name': thatAllTask.work_type_name,
									'time_allocated': getTimeAllocated( thatAllTask, thatRoomTypeId )
								},
								{
									'room_id': roomTasksInit[k].room_id,
									'room_no': thatRoomNo
								}
							);
						/**
						 * copyTask
						 * ========
						 * {
						 *   id: 1,
						 *   completed: false,
						 *   ...additional_tasks_details
						 *   ...room_id & room_no
						 * }
						 */

						// keeping a top ref of all work_types_touched
						// pushing new arrays, will flatten & uniq it just before
						// pushing to complied
						copyEmployee
							.touched_work_types
							.push( [copyTask.work_type_id] );

						copyEmployee
							.rooms[k]			// wonder why its k?
							.room_tasks
							.push( copyTask );
						copyEmployee
							.only_tasks
							.push( copyTask );
						/**
						 * copyEmployee
						 * ============
						 * {
						 *   id: 1,
						 *   name: 'Vijay',
						 *   rooms: [{
						 *   	...room details,
						 *      room_tasks: [{
						 *         id: 1,
						 *         completed: false,
						 *         ...additional_tasks_details,
						 *         ...additional_room_details
						 *      }]
						 *   }],
						 *   only_tasks: [{
						 *   	id: 1,
						 *      completed: false,
						 *      ...additional_tasks_details,
						 *      ...additional_room_details
						 *   }],
						 *   touched_work_types: [ [1], [2] ]
						 * }
						 */
					}
				}

				// flatten and remove duplicates
				copyEmployee.touched_work_types = _.uniq( _.flatten(copyEmployee.touched_work_types) );

				compiled.push(copyEmployee);
			}

			return compiled;
		}

		function getTimeAllocated (task, roomId) {
			var time = '',
				hh = 0,
				mm = 0;

			if ( task['room_types_completion_time'] && task['room_types_completion_time'].hasOwnProperty(roomId) && !! task['room_types_completion_time'][roomId] ) {
				time = task['room_types_completion_time'][roomId];
			} else if ( !! task['completion_time'] ) {
				time = task['completion_time'];
			}

			if ( time.indexOf(':') > -1 ) {
				hh = time.split(':')[0];
				mm = time.split(':')[1];
			}

			return {
				hh: isNaN(parseInt(hh)) ? 0 : parseInt(hh),
				mm: isNaN(parseInt(mm)) ? 0 : parseInt(mm)
			};
		}

		function compileAssignedRoomsParams (assignedRoomTasks, date, shouldSaveOrder) {
			var complied = $.extend(
					{},
					{ 'date': date },
					{ 'work_types': [] }
				);

			// PASS 1
			// creating just the work type id entries
			_.each(assignedRoomTasks, function(art) {
				var touched = art.touched_work_types;

				_.each(touched, function(wtid) {
					var hasWorkType = _.find(complied.work_types, { id: wtid }),
						newWorkType;

					if ( ! hasWorkType ) {
						newWorkType = {
							id: wtid,
							assignments: []
						};

						complied
							.work_types
							.push( newWorkType );
					}
				});
			});

			var workTypeId, hasThisWorkType, newAssignment, allTaskInThisWorkType, newTask;

			// PASS 2
			// dwad
			_.each(complied.work_types, function(cwt, workTypesIndex) {
				workTypeId = cwt.id;

				_.each(assignedRoomTasks, function(art) {
					hasThisWorkType = _.find(art.touched_work_types, function(id) {
						return workTypeId == id;
					});

					newAssignment = {
						employee_id: art.id,
						tasks: []
					};

					if ( !! hasThisWorkType ) {
						allTaskInThisWorkType = _.where(art.only_tasks, { 'work_type_id': workTypeId });

						_.each(allTaskInThisWorkType, function(eachTask, index) {
							newTask = {
								id: eachTask.id,
								room_id: eachTask.room_id,
								order: eachTask.order || null
							};

							newAssignment
								.tasks
								.push( newTask );
						});
					}

					complied
						.work_types[workTypesIndex]
						.assignments
						.push( newAssignment );
				});
			});

			return complied;
		}

        // Execute the auto assign functionality in task management
        this.executeAutoAssign = function (params) {
            var deferred = $q.defer(),
                url = 'api/work_assignments/auto_assign';

            RVBaseWebSrvV2.postJSON(url, params).then(function(data) {
                deferred.resolve(data);
            }, function(data) {
                deferred.reject(data);
            });
            return deferred.promise;
        };

        /**
         * Reset work assignments
         * @param {Object} params request params
         * @return {Promise}
         */
        this.resetWorkAssignments = function (params) {
            var deferred = $q.defer(),
                url = 'api/work_assignments/reset';

            RVBaseWebSrvV2.postJSON(url, params).then(function(data) {
                deferred.resolve(data);
            }, function(data) {
                deferred.reject(data);
            });
            
            return deferred.promise;
        };

		// ALL APIS
		// ========
		//
		// api/tasks to get all tasks
		// api/work_assignments/unassigned_rooms to get 'rooms' & 'room_tasks'

		// STEPS
		// =====
		//
		// 1. Loop through 'rooms' and grab { id, room_no, current_status, reservation_status, checkout_time }
		//    to create each entity in 'unassignedRooms'
		// 2. Loop through 'room_tasks' and match { room_id } to unassignedRooms[n].id.
		//    Then add { task_id } to matched unassignedRooms[n].room_tasks
		// 3. Loop through unassignedRooms and match unassignedRooms[n].room_tasks[j].id to the particular task id.
		//    Then in that task grab 'completion_time' by matching its room id to unassignedRooms[n].id

		// Confused? Yeah me too.. :(

	}
]);
