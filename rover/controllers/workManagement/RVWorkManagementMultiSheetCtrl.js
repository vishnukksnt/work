angular.module('sntRover').controller('RVWorkManagementMultiSheetCtrl', ['$rootScope', '$scope', 'ngDialog',
    'RVWorkManagementSrv', '$state', '$stateParams', '$timeout', 'allUnassigned', 'fetchHKStaffs', 'allRoomTypes',
    'payload', '$window', '$filter', 'sntActivity', '$transitions',
	function($rootScope, $scope, ngDialog,
             RVWorkManagementSrv, $state, $stateParams, $timeout, allUnassigned, fetchHKStaffs, allRoomTypes,
             payload, $window, $filter, sntActivity, $transitions) {
		BaseCtrl.call(this, $scope);

		// saving in local variable, since it will be updated when user changes the date
		var $_allUnassigned = allUnassigned;

		// flag to know if we interrupted the state change
		var $_stateChangeInterrupted = false,
			$_afterSave = null;

		// Updated when employee selections change
		var selectionHistory = [],
			employeeIndexHash = {};

        var quickMatchCache;

        var lastBulkRemovedTasksEmployeeId;

		// auto save the sheet when moving away
        $transitions.onStart({}, function (transition) {
            var fromState = transition.from(),
                toState = transition.to();

			if ('rover.workManagement.multiSheet' === fromState.name && $scope.workSheetChanged) {
                sntActivity.stop('STATE_CHANGE' + toState.name.toUpperCase());
				$scope.$emit("hideLoader");
				$_stateChangeInterrupted = true;

				$_afterSave = function() {
					$scope.closeDialog();
					$scope.workSheetChanged = false;
					$_stateChangeInterrupted = false;
					$state.go(toState, transition.params());
				};

				openSaveConfirmationPopup();

				// INFO: https://ui-router.github.io/ng1/docs/latest/modules/transition.html#hookresult
                // returning false would cancel this transition
                return false;
			}


		});

		$scope.closeSaveConfirmationDialog = function(options) {
			if ($_stateChangeInterrupted) {
				$_stateChangeInterrupted = false;
				$_afterSave && $_afterSave();
			} else {
				options && options.callNextMethod && $scope[options.callNextMethod] && $scope[options.callNextMethod]();
				$scope.closeDialog();
			}

		};

		$scope.closeDialog = function() {
			$scope.errorMessage = "";
			ngDialog.close();
		};

		/**
		 * Utility function to calculate the width of worksheet content
		 * Method: (220 x number of employees show) + 20)px
		 * @return {Integer}
		 */
		$scope.getWidthForWorkSheetContent = function() {
			return ((220 * $scope.multiSheetState.selectedEmployees.length) + 20) + 'px';
		};

		/**
		 * Handles RESTRICTING selected employees not to exceed $scope.multiSheetState.maxColumns
		 */
		$scope.selectEmployee = function() {
			// no op
			return;
		};

		$scope.onEmployeeListOpen = function() {
			$scope.multiSheetState.dndEnabled = false;
		};

		/**
		 * UPDATE the view IFF the list has been changed
		 */
		$scope.onEmployeeListClosed = function() {
			$scope.multiSheetState.dndEnabled = true;

			var currIds = _.where($scope.employeeList, { ticked: true });

			currIds     = _.pluck(currIds, 'id');

			// if there is any changes made by user
			if ( _.difference(currIds, $scope.multiSheetState._lastSelectedIds) ) {
				// Since we are changing selectedEmployees while doing drag drop,
				// we need to put back the changed object to assigned list.
				_.each($scope.multiSheetState._selectedIndexMap, function(valueAsAsssignIndex, keyAsSelectedIndex) {
					$scope.multiSheetState.assigned[valueAsAsssignIndex] = $scope.multiSheetState.selectedEmployees[keyAsSelectedIndex];
				});

				// reinit Employee list
				reInitEmployeesList();

				// refresh scrollers and update summary
				refreshView();
			}
		};


		$scope.filterUnassigned = function() {
			$scope.filterUnassignedRooms($scope.filters, $scope.multiSheetState.unassigned, $scope.multiSheetState.allRooms);
			$scope.multiSheetState.unassignedFiltered = $scope.multiSheetState.unassigned;
			refreshView();
			$scope.closeDialog();

			// DO NOTHING FOR NOW!
			// $scope.$emit('showLoader');
			// $timeout(function() {
			// 	$scope.multiSheetState.unassignedFiltered = $scope.filterUnassignedRooms($scope.filters, $scope.multiSheetState.unassigned, $_allUnassigned, $scope.multiSheetState.assignments);
			// 	refreshView();
			// 	$scope.closeDialog();
			// 	$scope.$emit('hideLoader');
			// }, 10);
		};

		$scope.showCalendar = function(controller) {
			ngDialog.open({
				template: '/assets/partials/workManagement/popups/rvWorkManagementMultiDateFilter.html',
				controller: controller,
				className: 'ngdialog-theme-default single-date-picker',
				closeByDocument: true,
				scope: $scope
			});
		};

		$scope.showFilter = function() {
			ngDialog.open({
				template: '/assets/partials/workManagement/popups/rvWorkManagementFilterRoomsPopup.html',
				className: 'ngdialog-theme-default',
				closeByDocument: true,
				scope: $scope
			});
		};

		// turn off 'save first' and state change
		$scope.onCancel = function() {
			$_shouldSaveFirst = false;
			$state.go('rover.workManagement.start');
		};

		/**
		 * Assign room to the respective maid on drop
		 * @param  {Event} event
		 * @param  {Draggable} dropped  Dropped room draggable
		 */
		$scope.dropToAssign = function(event, dropped) {
			// "event" has info of the column to which it is dropped to
			// "dropped" has info of what has been dragged
			// yeah, the wording is totally confusing :S

			var dragged = $(dropped.draggable).attr('id'),
				fromEmpIndex = dragged.split('-')[1],
				fromRoomIndex = parseInt( dragged.split('-')[2] ),
				fromTaskIndex = parseInt( dragged.split('-')[3] );

			var source, fromEmp;

			var draggedRoom, draggedTask;

			var dropped, toEmpIndex, toEmp;

			var hasRoom, hasRoomIndex, roomCopy, roomInfoToCopy = {};

			var inOnlyTask, hasOtherTaskWithSameWtid;

			if ( 'UA' === fromEmpIndex ) {
				source = $scope.multiSheetState.unassignedFiltered;
				draggedRoom = source[fromRoomIndex];
				draggedTask = draggedRoom['room_tasks'][fromTaskIndex];
			} else {
				source = $scope.multiSheetState.selectedEmployees;
				fromEmp = source[fromEmpIndex];
				draggedRoom = fromEmp['rooms'][fromRoomIndex];
				draggedTask = draggedRoom['room_tasks'][fromTaskIndex];
			}

			dropped  = $(event.target).attr('id');
			toEmpIndex = parseInt( dropped.split('-')[0] );
			toEmp = $scope.multiSheetState.selectedEmployees[toEmpIndex];

			hasRoom = _.find(toEmp.rooms, { 'room_id': draggedRoom.room_id });
			hasRoomIndex = _.findIndex(toEmp.rooms, { 'room_id': draggedRoom.room_id });
			roomCopy = [];
			roomInfoToCopy = {};

			function move(array, from, to) {
				var target = array[from];
				var increment = to < from ? -1 : 1;
				var k = 0;

				if ( to === from ) return;

				for (k = from; k != to; k += increment) {
					array[k] = array[k + increment];
				}
				array[to] = target;

				return array;
			}

			if ( !! hasRoom ) {
				roomCopy = angular.copy(toEmp.rooms);

				// only insert if this task doesnt exist already
				if ( ! _.find(hasRoom.room_tasks, { 'id': draggedTask.id }) ) {
					roomCopy[hasRoomIndex].room_tasks.push( draggedTask );
				}

				if ( $scope.dropIndex !== undefined ) {
					if ( hasRoomIndex > $scope.dropIndex ) {
						move(roomCopy, hasRoomIndex, $scope.dropIndex);
					} else {
						if ( $scope.dropIndex === 0 ) {
							move(roomCopy, hasRoomIndex, $scope.dropIndex);
						} else {
							move(roomCopy, hasRoomIndex, $scope.dropIndex - 1);
						}
					}
				}

				toEmp.rooms = roomCopy;
			} else {
				roomInfoToCopy = {
					'room_id': draggedRoom.room_id,
					'room_type': draggedRoom.room_type,
					'is_vip': draggedRoom.is_vip,
					'room_index': draggedRoom.room_index,
					'room_tasks': [draggedTask]
				};

				if ( $scope.dropIndex === undefined || $scope.dropIndex === toEmp.rooms - 1 ) {
					toEmp.rooms.push(roomInfoToCopy);
				} else if ( $scope.dropIndex === 0 ) {
					toEmp.rooms.unshift(roomInfoToCopy);
				} else {
					toEmp.rooms = [].concat(
							toEmp.rooms.slice( 0, $scope.dropIndex ),
							roomInfoToCopy,
							toEmp.rooms.slice( $scope.dropIndex )
						);
				}
			}

			if ( parseInt(fromEmpIndex) !== toEmpIndex ) {
				// add the task to "only_tasks" and work_type_id to "touched_work_types"
				toEmp.only_tasks.push(draggedTask);
				toEmp.touched_work_types.push( draggedTask.work_type_id );
				toEmp.touched_work_types = _.uniq( _.flatten(toEmp.touched_work_types) );

				// if task removed from an toEmp =>
				// remove the task from "only_tasks"
				// and if the "work_type_id" in the removed task is not avail
				// on toEmp's "room_tasks" anymore then remove it from "touched_work_types"

				if ( 'UA' !== fromEmpIndex ) {
					// that task with matches the id and room id of dragged task
					inOnlyTask = _.findIndex(fromEmp.only_tasks, function(task) {
						return task.id === draggedTask.id && task.room_id === draggedTask.room_id;
					});

					if ( inOnlyTask > -1 ) {
						fromEmp.only_tasks.splice(inOnlyTask, 1);
					}

					hasOtherTaskWithSameWtid = _.find(fromEmp.only_tasks, { work_type_id: draggedTask.work_type_id });
					if ( ! hasOtherTaskWithSameWtid ) {
						fromEmp.touched_work_types = _.without(fromEmp.touched_work_types, draggedTask.work_type_id);
					}
				}


				// remove task from draggedRoom
				draggedRoom['room_tasks'].splice(fromTaskIndex, 1);

				// if the room was dragged off an fromEmp and
				// if there are no more tasks in the room's room_tasks
				// remove the room iself!
				if ( 'UA' !== fromEmpIndex && ! draggedRoom['room_tasks'].length ) {
					fromEmp['rooms'].splice(fromRoomIndex, 1);
				}
			}

			// THE ABOVE CODE COULD BETTER BE HIDDEN IN SERVICE

			// Refresh the scrollers and summary
			$scope.workSheetChanged = true;
			refreshView();
		};

		/**
		 * Unassign room to the respective maid on drop
		 * @param  {Event} event
		 * @param  {Draggable} dropped  Dropped room draggable
		 */
		$scope.dropToUnassign = function(event, dropped) {
			// "event" has info of the column to which it is dropped to
			// "dropped" has info of what has been dragged
			// yeah, the wording is totally confusing :S

			var dragged = $(dropped.draggable).attr('id'),
				draggedIndex = dragged.split('-')[1],
				roomIndex = parseInt( dragged.split('-')[2] ),
				taskIndex = parseInt( dragged.split('-')[3] );

			var source      = $scope.multiSheetState.selectedEmployees,
				destination = $scope.multiSheetState.unassignedFiltered;

			var thatEmpl = source[draggedIndex],
				draggedRoom = thatEmpl['rooms'][roomIndex],
				draggedTask = draggedRoom['room_tasks'][taskIndex];

			var destinationHasRoom = _.find(destination, { 'room_id': draggedTask.room_id });

			if ( !! destinationHasRoom ) {
				destinationHasRoom
					.room_tasks
					.push( draggedTask );
			} else {
				destination.push({
					'room_id': draggedRoom.room_id,
					'room_index': draggedRoom.room_index,
					'room_tasks': [draggedTask],
					'show': true
				});
			}

			$scope.filterUnassigned();

			// if task removed from an employee =>
			// remove the task from "only_tasks"
			// and if the "work_type_id" in the removed task is not avail
			// on employee's "room_tasks" anymore then remove it from "touched_work_types"
			var inOnlyTask, hasOtherTaskWithSameWtid;
			// that task with matches the id and room id of dragged task

			inOnlyTask = _.findIndex(thatEmpl.only_tasks, function(task) {
				return task.id === draggedTask.id && task.room_id === draggedTask.room_id;
			});
			if ( inOnlyTask > -1 ) {
				thatEmpl.only_tasks.splice(inOnlyTask, 1);
			}

			hasOtherTaskWithSameWtid = _.find(thatEmpl.only_tasks, { work_type_id: draggedTask.work_type_id });
			if ( ! hasOtherTaskWithSameWtid ) {
				thatEmpl.touched_work_types = _.without(thatEmpl.touched_work_types, draggedTask.work_type_id);
			}


			// remove task from draggedRoom
			draggedRoom['room_tasks'].splice(taskIndex, 1);

			// if the room was dragged off an employee and
			// if there are no more tasks in the room's room_tasks
			// remove the room iself!
			if ( ! draggedRoom['room_tasks'].length ) {
				thatEmpl['rooms'].splice(roomIndex, 1);
			}

			// THE ABOVE CODE COULD BETTER BE HIDDEN IN SERVICE

			// Refresh the scrollers and summary
			$scope.workSheetChanged = true;
			refreshView();
		};

		$scope.onDateChanged = function() {

			// Ask for save confirmation if unchanged changes are there.
			if ($scope.workSheetChanged) {
				openSaveConfirmationPopup({
					date: $scope.dateSelected,
					callNextMethod: 'updateView'
				});
			} else {
				updateView(true);
			}

			$scope.dateSelected = $scope.multiSheetState.selectedDate;

		};

		$scope.onWorkTypeChanged = function() {
			$scope.workTypeSelected = $scope.multiSheetState.header.work_type_id;
			refreshView();
		};

		$scope.refreshSheet = function() {
			$scope.saveMultiSheet({
				callNextMethod: 'updateView'
			});
		};

		var openSaveConfirmationPopup = function(options) {
			ngDialog.open({
				template: '/assets/partials/workManagement/popups/rvWorkManagementSaveConfirmationPopup.html',
				className: '',
				scope: $scope,
				closeByDocument: false,
				closeByEscape: false,
				data: JSON.stringify(options)
			});
		};

		var lastSaveConfig = null;
		/**
		 * Function to delegate calling custom call back function,
		 * after save api call is completed.
		 * @return {Undefiend}
		 */
		var afterSaveAPIcall = function() {
			// delay are for avoiding collisions
			if (!$_stateChangeInterrupted && lastSaveConfig && $scope[lastSaveConfig.callNextMethod]) {
				$timeout($scope[lastSaveConfig.callNextMethod].bind(null, lastSaveConfig.nexMethodArgs), 50);
			}
			if ($_stateChangeInterrupted && !!$_afterSave) {
				$timeout($_afterSave, 60);
			}
			lastSaveConfig = null;
		};

		/**
		 * Success callback of save api.
		 * @param {Object} API response
		 * @return {Undefined}
		 */
		var saveMultiSheetSuccessCallBack = function(data) {
			$scope.$emit("hideLoader");
			$scope.clearErrorMessage();
			$scope.workSheetChanged = false;
			afterSaveAPIcall();
		};

		/**
		 * Failure callback of save api.
		 * @param {Object} Error messages
		 * @return {Undefined}
		 */
		var saveMultiSheetFailureCallBack = function(error) {
			$scope.errorMessage = error;
			$scope.$emit("hideLoader");
			afterSaveAPIcall();
		};

		/**
		 * Saves the current state of the Multi sheet view
		 * @param {Object} options
		 * @return {Undefined}
		 */
		$scope.saveMultiSheet = function(config) {

			// Since we are changing selectedEmployees while doing drag drop,
			// we need to put back the changed object to assigned list.
			_.each($scope.multiSheetState._selectedIndexMap, function(valueAsAsssignIndex, keyAsSelectedIndex) {
				$scope.multiSheetState.assigned[valueAsAsssignIndex] = $scope.multiSheetState.selectedEmployees[keyAsSelectedIndex];
			});

			lastSaveConfig = config || null;
			if ($scope.multiSheetState.selectedEmployees.length) {

				var options = {
					successCallBack: saveMultiSheetSuccessCallBack,
					failureCallBack: saveMultiSheetFailureCallBack,
					params: {
						assignedRoomTasks: $scope.multiSheetState.assigned,
						date: (config && config.date) || $scope.multiSheetState.selectedDate,
						shouldSaveOrder: isAllWorktypeView()
					}
				};

				// now assign room "order" to the tasks inside "only_tasks" based on their index in "rooms"
				if ( isAllWorktypeView() ) {
					_.each($scope.multiSheetState.assigned, function(emp) {
						_.each(emp.only_tasks, function(task) {
							var roomIndex = _.findIndex(emp.rooms, { room_id: task.room_id });

							task.order = roomIndex + 1;
						});
					});
				}

				$scope.callAPI(RVWorkManagementSrv.saveWorkSheets, options);

			} else {
				afterSaveAPIcall(config);
			}
		};


		// Printing related methods and logics
		/**
		 * Utility function to add the print orientation before printing
		 */
		var addPrintOrientation = function() {
			$( 'head' ).append( "<style id='print-orientation'>@page { size: landscape; }</style>" );
		};

		// add the print orientation after printing
		var removePrintOrientation = function() {
			$( '#print-orientation' ).remove();
		};


		var employeeListBackup = null;

		/**
		 * Opens a popup to select the configurations to print the worksheet.
		 * @return {undefined}
		 */
		$scope.openPrintWorkSheetPopup = function() {
			employeeListBackup = angular.copy($scope.employeeList);

			ngDialog.open({
				template: '/assets/partials/workManagement/popups/rvWorkManagementPrintOptionsPopup.html',
				className: '',
				scope: $scope,
				closeByDocument: false,
				closeByEscape: false
			});
		};

		$scope.cancelPopupDialog = function() {
			$scope.employeeList = angular.copy(employeeListBackup);
			$scope.onEmployeeListClosed();

			ngDialog.close();
		};

		/**
		 * Transform data model for printing.
		 */
		var configureMultisheetForPrinting = function(options) {
			var multiSheetState 		= $scope.multiSheetState;

			multiSheetState.selectedEmployees = RVWorkManagementSrv.sortAssigned(multiSheetState.selectedEmployees,
										multiSheetState.allRooms,
										multiSheetState.allTasks,
										options);

			// Add an event to fire when the next digest cycle completes.
			var listner = $rootScope.$watch(function() {
				listner();
				$timeout(startPrinting, 0);
			});

			runDigestCycle();
		};

		var startPrinting = function() {
			/*
			*	======[ READY TO PRINT ]======
			*/
			/*
			*	======[ PRINTING!! JS EXECUTION IS PAUSED ]======
			*/
			$scope.$emit('hideLoader');

			var onPrintCompletion = function() {
				$timeout(function() {
					removePrintOrientation();
	
					$scope.multiSheetState = angular.copy(multiSheetStateBackup);
					$scope.employeeList = angular.copy(employeeListBackup);
					$scope.onEmployeeListClosed();
	
					multiSheetStateBackup = null;
					runDigestCycle();
				}, 150);
			};
			
			$timeout(function() {
				if ( sntapp.cordovaLoaded ) {
					cordova.exec(onPrintCompletion, function() {
						onPrintCompletion();
					}, 'RVCardPlugin', 'printWebView', ['worksheet', '0', '', 'L']);
				} else {
					$window.print();
					onPrintCompletion();	
				}
				
			}, 100);

		};

		var multiSheetStateBackup = null;

		/**
		 * Prints the worksheet according to options configured in the $scope.printSettings.
		 * @return {undefined}
		 */
		$scope.printWorkSheet = function() {
			$scope.closeDialog();
			// CICO-42146, loading image inside print-view, is showLoader required here?
			// even with slow browser/network, loading is < 1sec
			// $scope.$emit('showLoader');
			$timeout(function() {// provides just enough time for the dialog to close and also prompt for printing in safari/chrome
				multiSheetStateBackup = angular.copy($scope.multiSheetState);

				// set the sheet according to print settings.
				configureMultisheetForPrinting($scope.printSettings);

				// reset scroll bars to top
				var i;

				for (i = $scope.multiSheetState.selectedEmployees.length - 1; i >= 0; i--) {
					$scope.$parent.myScroll[ 'assignedRoomList-' + $scope.multiSheetState.selectedEmployees[i].id ].scrollTo(0, 0);
				}

				// add the orientation
				addPrintOrientation();
			}, 750);

		};

		/**
		 * to run angular digest loop,
		 * will check if it is not running
		 * return - None
		 */
		var runDigestCycle = function() {
			if (!$scope.$$phase) {
				$scope.$digest();
			}
		};

		/**
		 * Set previous state and heading.
		 */
		var setBackNavAndTitle = function() {
			$rootScope.setPrevState = {
				title: $filter('translate')('WORK_MANAGEMENT'),
				name: 'rover.workManagement.start'
			};
			$scope.setHeading($filter('translate')('WORK_MANAGEMENT'));
		};

		var hoz;

		/**
		 * Utility function to set up scrollers
		 */
		var setScroller = function() {
			var commonScrollerOptions = {
				tap: true,
				preventDefault: false,
				probeType: 3,
				bounce: false
			};
			var horizontal = _.extend({
				scrollX: true,
				scrollY: false
			}, commonScrollerOptions);
			var vertical = _.extend({
				scrollX: false,
				scrollY: true
			}, commonScrollerOptions);

			$scope.setScroller('unAssignedRoomList', vertical);
			$scope.setScroller("multiSelectWorkSheet", commonScrollerOptions);
			$scope.setScroller("multiSelectPrintPopup", commonScrollerOptions);
			$scope.setScroller("worksheetHorizontal", horizontal);

			var addVerScroller = function(index, employees, scrollObj) {
                // CICO-46772
                for (var i = 0; i < employees.length; i++) {
                    $scope.setScroller('assignedRoomList-' + employees[i].id, scrollObj);
                }
			};

			addVerScroller(0, $scope.employeeList, vertical);
		};

		var refreshScrollers = function() {
			$scope.refreshScroller('unAssignedRoomList');
			$scope.refreshScroller('worksheetHorizontal');
			for (var i = 0; i < $scope.employeeList.length; i++) {
				$scope.refreshScroller('assignedRoomList-' + $scope.employeeList[i].id);
			}
		};

		/**
		 * Add all scope watchers here
		 */
		var setupWatchers = function() {
			$scope.$watch('multiSheetState.header.work_type_id', function(newVal, oldVal) {
				if (newVal !== oldVal) {
					$scope.onWorkTypeChanged();
				}
			});
		};

		var isAllWorktypeView = function() {
        	return ! $scope.multiSheetState.header.work_type_id;
        };


		// common computation part of below 2 functions
		var initingEmpList = function(emp) {
			var foundIndex, key;

			foundIndex = _.findIndex($scope.multiSheetState.assigned, function(assign) {
				return assign.id == emp.id;
			});

			if ( foundIndex > -1 ) {
                // CICO-44442
                $scope.multiSheetState.assigned[foundIndex].shiftId = emp.shift_id;
				// push employee from assigned to selected
				$scope.multiSheetState.selectedEmployees.push( $scope.multiSheetState.assigned[foundIndex] );

				// add the index mapping to '_selectedIndexMap'
				key = $scope.multiSheetState.selectedEmployees.length - 1;
				$scope.multiSheetState._selectedIndexMap[key] = foundIndex;

				// push employee id into '_lastSelectedIds'
				$scope.multiSheetState._lastSelectedIds.push( $scope.multiSheetState.assigned[foundIndex]['id'] );
			}
		};

		/**
		 * Auto select employees based on daily worksheet employee data
		 */
		var initializeEmployeesList = function(employeeIds) {
			var foundIndex, key;

			$scope.multiSheetState.selectedEmployees = [];
			$scope.multiSheetState._selectedIndexMap = {};
			$scope.multiSheetState._lastSelectedIds  = [];


            if (fetchHKStaffs) {
                $scope.employeeList = fetchHKStaffs.results;
            }

            var isSelectedEmp = false;

            _.each($scope.employeeList, function (emp) {
                if (employeeIds) {
                     isSelectedEmp = employeeIds.indexOf(emp.id) > -1;

                    if (isSelectedEmp) {
                        emp.ticked = true;
                        initingEmpList(emp);
                    }
                } else {
                    emp.ticked = true;
                    initingEmpList(emp);
                }

            });

		};

		var reInitEmployeesList = function() {
			var foundIndex, key;

			$scope.multiSheetState.selectedEmployees = [];
			$scope.multiSheetState._selectedIndexMap = {};
			$scope.multiSheetState._lastSelectedIds  = [];

			_.each($scope.employeeList, function(emp) {
				if ( emp.ticked ) {
					initingEmpList(emp);
				}
			});
        };
        
        /**
         * Get selected employees id
         */
        var getSelectedEmployeeIds = function() {
            var selectedEmployees = _.where($scope.employeeList, { ticked: true });

            selectedEmployees = _.pluck(selectedEmployees, 'id');
            
            return selectedEmployees;
        };

        var resetEmployeeTasksByWorkTypeAndGetAssignedTasks = function(employeeData) {
				var removedRoomTasks = {};

				_.each(employeeData.rooms, function (room) {
					var roomTasks = [];

					_.each(room.room_tasks, function (task) {
						if (task.status !== 'COMPLETED' && task.status !== 'IN_PROGRESS') {
							if ($scope.multiSheetState.header.work_type_id) {
								if (task.work_type_id != $scope.multiSheetState.header.work_type_id) {
									roomTasks.push(task);
								}
							}
						} else {
							roomTasks.push(task);
						}

					});

					room.room_tasks = roomTasks;
				});


				var preservedTasks = [];

				_.each(employeeData.only_tasks, function (task) {
					if (!removedRoomTasks[task.room_id]) {
						removedRoomTasks[task.room_id] = [];
					}

					if (task.status !== 'COMPLETED' && task.status !== 'IN_PROGRESS') {
						if ($scope.multiSheetState.header.work_type_id) {
							if (task.work_type_id == $scope.multiSheetState.header.work_type_id) {
								removedRoomTasks[task.room_id].push(task);
							} else {
								preservedTasks.push(task);
							}

						} else {
							removedRoomTasks[task.room_id].push(task);
						}
					} else {
						preservedTasks.push(task);
					}


				});

				employeeData.only_tasks = preservedTasks;

				return removedRoomTasks;
            },
            addAssignedTaskToUnassignedSection = function(unassignedList, removedRoomTasks) {
                _.each(unassignedList, function(room) {
                    if (removedRoomTasks[room.room_id]) {
                        room.room_tasks = room.room_tasks.concat(removedRoomTasks[room.room_id]);
                    }

                });
            };

		var fetchWorkSheetPayloadSuccess = function(data) {
            sntActivity.stop('RELOAD_WORKSHEET');
            if (lastBulkRemovedTasksEmployeeId && $scope.workSheetChanged) {
                var selectedEmployeeDataBeforeReset = _.find(payload.assignedRoomTasks, {id: lastBulkRemovedTasksEmployeeId});

                var assignedTasks = resetEmployeeTasksByWorkTypeAndGetAssignedTasks(selectedEmployeeDataBeforeReset);

                addAssignedTaskToUnassignedSection(payload.unassignedRoomTasks, assignedTasks);
                
            } else {
                payload = data;
                $scope.workSheetChanged = false;
            }
            
            initializeMultiSheetDataModel(false);
            initializeEmployeesList(getSelectedEmployeeIds());
            $scope.filterUnassigned();
            refreshView();
            lastBulkRemovedTasksEmployeeId = null;
		};

		var fetchWorkSheetPayloadFailure = function(error) {
            sntActivity.stop('RELOAD_WORKSHEET');
            $scope.errorMessage = error;
		};

		/**
		 * Fetch payload once again and re init data models to refresh view completely.
		 * To Do: ask for save if dirty.
		 * @return {Undefined}
		 */
		var updateView = function() {
            sntActivity.start('RELOAD_WORKSHEET');

            var unassignedRoomsParam = {
                date: $scope.multiSheetState.selectedDate
            };

            var assignedRoomsParam = {
                date: $scope.multiSheetState.selectedDate,
                employee_ids: fetchHKStaffs.emp_ids
            };

            RVWorkManagementSrv.processedPayload(unassignedRoomsParam, assignedRoomsParam)
            	.then(fetchWorkSheetPayloadSuccess, fetchWorkSheetPayloadFailure);
		};

		/**
		 * Call to refresh view, scrollers and employee summary
		 * @return {Undefined}
		 */
		var refreshView = function() {
			updateSummary();
			runDigestCycle();
			setScroller();
			refreshScrollers();
		};

		/**
		 * Utility function to calculate the work summary of and employee based on
		 * assigned tasks
		 * @param {Object} details of employee from payload
		 * @return {Object} object containing summary data
		 */
		var calculateSummary = function(employee) {
			var summaryModel = {
				tasksAssigned: 0,
				tasksCompleted: 0,
				timeAllocated: "00:00",
				shiftLength: "00:00"
			};

			var allTasks,
				completed,
				totalTime,
				doneTime,
				time,
				shift;

				/* Shift length to be calculated from api/shifts. need shift_id for that.
				   Displaying full shift length for now.*/
				// shift = _.findWhere($scope.shifts, { id: employee.shift_id });
				shift = _.findWhere($scope.shifts, { id: employee.shiftId });
				summaryModel.shiftLength    = (shift && shift.time) || "00:00";
				// Shift length must be corrected in future

			var i;

			for ( i = employee.rooms.length - 1; i >= 0; i-- ) {
				allTasks  = employee.rooms[i].room_tasks;

				completed = _.where(allTasks, { is_completed: true }) || [];

				totalTime = _.reduce(allTasks, function(s, task) {
					time = task.time_allocated;
					return $scope.addDuration(s, time.hh + ":" + time.mm);
				}, "0:0");

				summaryModel.tasksAssigned  += allTasks.length;
				summaryModel.tasksCompleted += completed.length;
				summaryModel.timeAllocated  = $scope.addDuration(summaryModel.timeAllocated, totalTime);
			}

			return summaryModel;
		};

		/**
		 * Creates a data structure to show employee work assignments summary.
		 * Updates all employee summary if param not given.
		 * @param {Number} employee id (optional)
		 * @return {Undefined}
		 */
		var	updateSummary = function(employeeId) {
			var refData 	 = $scope.multiSheetState;

			if (typeof employeeId === "number") {
				var employee = _.findWhere(refData.assigned, {id: employeeId});

				refData.summary[employeeId] = calculateSummary(employee);

			} else {
				_.each(refData.assigned, function(employee) {
					refData.summary[employee.id] = calculateSummary(employee);
				});
			}
		};

		// keeping a reference in $scope
		$scope.updateView = updateView;

		/**
		 * initialize variables for the multi sheet state
		 * @return {Undefined}
		 */
		var initializeMultiSheetDataModel = function(shouldResetFilter) {
			// Object for holding sheet data on scope.

			$scope.multiSheetState = $.extend(
					{}, {
						'unassigned': payload.unassignedRoomTasks,
						'assigned': payload.assignedRoomTasks,
						'allTasks': payload.allTasks,
						'allRooms': payload.allRooms
					}, {
						'unassignedFiltered': [],
						'_unassignIndexMap': {}
					}, {
						'selectedEmployees': [],
						'_selectedIndexMap': {},
						'_lastSelectedIds': []
					}, {
						'dndEnabled': true,
						'selectedDate': ($stateParams.filterParams && $stateParams.filterParams.selectedDate) || $scope.dateSelected || $stateParams.date || $rootScope.businessDate,
						'summary': {},
						'header': {
							work_type_id: ($stateParams.filterParams && $stateParams.filterParams.worktype_id) || $scope.workTypeSelected || ""
						}
					}
                );
                
            if (shouldResetFilter) {
                $scope.filters = {
                    selectedFloor: "",
                    selectedReservationStatus: "",
                    selectedFOStatus: "",
                    vipsOnly: false,
                    showAllRooms: false,
                    checkin: {
                        after: {
                            hh: "",
                            mm: "",
                            am: "AM"
                        },
                        before: {
                            hh: "",
                            mm: "",
                            am: "AM"
                        }
                    },
                    checkout: {
                        after: {
                            hh: "",
                            mm: "",
                            am: "AM"
                        },
                        before: {
                            hh: "",
                            mm: "",
                            am: "AM"
                        }
                    }
                };
            }
			

            // Clear the date once its used for preserving the previous state before load
            if ($stateParams.filterParams) {
                $stateParams.filterParams.selectedDate = null;
            }
		};

		var initializeVariables = function() {
			$scope.dateSelected = $scope.multiSheetState.selectedDate;
			$scope.workTypeSelected = $scope.multiSheetState.header.work_type_id;
			$scope.workSheetChanged = false;

			// print options
			$scope.printSettings = {
				grouping: 'room',
				sort: 'asc',
				employees: 1
			};
		};

		var callRefreshScroll = function() {
			refreshScrollers();
		};
		var handler = $scope.$on( 'ALL_RENDER_COMPLETE', callRefreshScroll );

		$scope.$on( '$destroy', handler );

		$scope.getReservationStatusClass = function(room) {
			if ( angular.isUndefined(room) ) {
				return 'guest';
			}

			switch (room.reservation_status) {
				case 'Due out':
				case 'Arrived / Day use / Due out':
				case 'Arrived / Day use / Due out / Departed':
				case 'Due out / Arrival':
				case 'Due out / Departed':
				case 'Arrived / Departed':
				case 'Departed':
					return 'guest red';

				case 'Stayover':
					return 'guest blue';

				case 'Arrival':
				case 'Arrived':
                case 'Departed / Arrival':
					return 'guest green';

				case 'Not Reserved':
					return 'guest gray';

				default:
					return 'guest';
			}
		};

		$scope.getReservationStatusValue = function(room) {
			if ( angular.isUndefined(room) ) {
				return 'default';
			}

			switch (room.reservation_status) {
				case 'Due out / Departed':
				case 'Arrived / Day use / Due out / Departed':
				case 'Arrived / Departed':
				case 'Departed':
					return 'OUT';

				case 'Due out':
				case 'Arrived / Day use / Due out':
				case 'Due out / Arrival':
					return room.checkout_time ? room.checkout_time : 'DUE OUT';

				case 'Stayover':
					return 'STAYOVER';

				case 'Arrived':
					return 'IN';

				case 'Arrival':
                case 'Departed / Arrival':
					return room.checkin_time ? room.checkin_time : 'DUE IN';

                case 'Not Reserved':
                    return 'NOT RESERVED';

				default:
					return 'default';
			}
		};

		$scope.getCurrentStatusClass = function(room) {
			if ( angular.isUndefined(room) ) {
				return 'room';
			}

			switch (room.current_status) {
				case 'DIRTY':
					return 'room red';

				case 'PICKUP':
					return 'room orange';

				case 'CLEAN':
				case 'INSPECTED':
					return 'room green';
				case 'DO_NOT_DISTURB':
					return 'room purple';

				default:
					return 'room';
			}
		};

		var setUpAutoScroller = function() {
            var LEFT  = 'LEFT',
                RIGHT = 'RIGHT',
                TOP = 'TOP',
                BOTTOM = 'BOTTOM',
                UNDEF = undefined;

            var dragDir    = UNDEF,
                timer      = UNDEF,
                dim        = UNDEF;

            // to drop the room/task based on the order
            var orderState = (function() {
                var base = {};

                var clientX = 0,
                    clientY = 0,
                    $empNode = undefined,
                    $lastEmpNode = undefined;

                base.getClientPos = function() {
                    return {
                        x: clientX,
                        y: clientY
                    };
                };
                /**/
                base.setClientPos = function(x, y) {
                    clientX = x;
                    clientY = y;
                };

                base.removePlaceholder = function(delayed) {
                    var $node, $placeholder;

                    var remove = function() {
                    	if ( !! $node ) {
                    	    $placeholder = $node.find('.placeholder');
                    	    $placeholder.remove();
                    	}
                    };

                    if ( !! $empNode ) {
                    	$node = $empNode;
                    } else if ( !! $lastEmpNode ) {
                    	$node = $lastEmpNode;
                    } else {
                    	$node = undefined;
                    }

                    if ( delayed ) {
                    	setTimeout( remove, 10 );
                    } else {
                    	remove();
                    }
                };

                base.findCurrCol = function() {
                    var clientx = this.getClientPos().x;

                    var scrollInst = $scope.$parent.myScroll['worksheetHorizontal'];
                    var scrollInstX = scrollInst.x;

                    var LEFT_OFFSET = 20;
                    var COL_WIDTH   = 220;

                    var currX = clientx - (LEFT_OFFSET + scrollInstX);
                    var colIndex;

					var maxColCount = $scope.multiSheetState.selectedEmployees.length;

                    if ( currX < 0 ) {
                        colIndex = -1;
                    } else {
                        colIndex = Math.floor(currX / COL_WIDTH);

						if ( maxColCount === 0 ) {
							colIndex = 0;
						} else if ( colIndex >= maxColCount ) {
							colIndex = maxColCount - 1;
						} else if ( colIndex > 0 ) {
							colIndex = colIndex - 1;
						}
                    }

                    return colIndex;
                };

                base.findCurrColNode = function() {
                    var colIndex = this.findCurrCol(),
                    	selectedEmp;

                    this.removePlaceholder();

                    $lastEmpNode = $empNode;
                    if ( colIndex > -1 ) {
                    	selectedEmp = $scope.multiSheetState.selectedEmployees[colIndex];
                        $empNode = $( '#' + colIndex + '-' + selectedEmp.id );
                    } else {
                        $empNode = undefined;
                    }

                    return $empNode;
                }.bind(base);

                base.checkOnOverRoom = function(room, index, prevHeight) {
                    var $thisRoom, $nextRoom, nextIndex;

                    var TOP_OFFSET = 280, ROOM_MARGIN = 20;

                    var roomHeight, nextHeight, top, mid, bot, clienty;

                    var retObj;

                    $thisRoom = $(room);
                    $nextRoom = $thisRoom.next('.worksheet-room');
                    nextIndex = index + 1;
                    if ( $nextRoom.hasClass('.placeholder')  ) {
                        this.addPlaceholder();
                    }

                    roomHeight = $thisRoom.height();
                    /**/
                    if ( index === 0 ) {
                        top = TOP_OFFSET;
                    } else {
                        top = prevHeight;
                    }
                    mid = top + roomHeight / 2;
                    bot = top + roomHeight + ROOM_MARGIN;
                    nextHeight = top + roomHeight;

                    clienty = this.getClientPos().y;

                    if ( clienty < top && index === 0 ) {
                        return {
                            method: 'BEFORE',
                            node: $thisRoom,
                            index: index
                        };
                    } else if ( clienty > bot ) {
                        if ( $nextRoom.length ) {
                            return this.checkOnOverRoom($nextRoom, nextIndex, nextHeight);
                        } else {
                            return {
                                method: 'AFTER',
                                node: $thisRoom,
                                index: nextIndex
                            };
                        }
                    } else {
                        if ( clienty < mid && clienty >= top ) {
                            return {
                                method: 'BEFORE',
                                node: $thisRoom,
                                index: index
                            };
                        } else {
                            return {
                                method: 'AFTER',
                                node: $thisRoom,
                                index: nextIndex
                            };
                        }
                    }
                }.bind(base);

                base.addPlaceholder = function() {
                    var $col = this.findCurrColNode(),
                        firstRoom,
                        index = 0,
                        prevHeight = 0;

                    var $placeholder = $('<div class="worksheet-room placeholder">Drop Here</div>');

                    this.removePlaceholder();

                    if ( $col === undefined ) {
                        return;
                    } else {
                        firstRoom = $col.find('.worksheet-room')[0];

                        if ( firstRoom === undefined ) {
                            $col.find('.wrapper')
                                .append( $placeholder );

                            $scope.dropIndex = 0;
                        } else {
                            var onOverData = this.checkOnOverRoom(firstRoom, index, prevHeight);

                            switch ( onOverData.method ) {
                                case 'BEFORE':
                                    $placeholder.insertBefore( onOverData.node  );
                                    break;

                                case 'AFTER':
                                    $placeholder.insertAfter( onOverData.node );
                                    break;

                                default:
                                    $col.find('.wrapper')
                                        .append( $placeholder );
                                    break;
                            }

                            $scope.dropIndex = onOverData.index;
                        }
                    }
                }.bind(base);

                return base;
            })();

            var getDimentions = function() {
                var LEFT_OFFSET = 200,
                    TOP_OFFSET  = 260,
                    COL_WIDTH   = 220,
                    TASK_OFFSET = 110,
                    AVG_TASK_HEIGHT = 100;

                var winWidth = $(window).width(),
                    winHeight = $(window).height();

                return {
                    screenStart: {
                        x: LEFT_OFFSET + TASK_OFFSET,
                        y: TOP_OFFSET + AVG_TASK_HEIGHT
                    },
                    screenEnd: {
                        x: winWidth - LEFT_OFFSET,
                        y: winHeight - AVG_TASK_HEIGHT
                    }
                };
            };

            // setup dim and update on screen change, also remove listener when scope dies
            var dimOnResize = function() {
                dim = getDimentions();
            };

            dimOnResize();
            window.addEventListener( 'resize', dimOnResize, false );
            $scope.$on('$destroy', function() {
                window.removeEventListener( 'resize', dimOnResize );
            });

            // call this method when we need to scroll the tm screen
            // horzontally while the user is dragging a task outside the visible screen
            // vertically for similar case
            var checkScrollBy = function() {
                var hozScrollInst = $scope.$parent.myScroll['worksheetHorizontal'],
                    verScrollInst = undefined,
                    colIndex = -1;

                var isHozCheckRequired = function () {
                    return dragDir === LEFT || dragDir === RIGHT;
                };
                /**/
                var hasHozScroll = function() {
                    return !! hozScrollInst.hasHorizontalScroll;
                };
                /**/
                var scrollTowardsHozStart = function () {
                    return dragDir === LEFT && hozScrollInst.x < 0;
                };
                /**/
                var scrollTowardsHozEnd = function () {
                    return dragDir === RIGHT && hozScrollInst.x > hozScrollInst.maxScrollX;
                };

                var isVerCheckRequired = function () {
                    return dragDir === TOP || dragDir === BOTTOM;
                };
                /**/
                var hasVerScroll = function() {
                    return !! verScrollInst && !! verScrollInst.hasVerticalScroll;
                };
                /**/
                var scrollTowardsVerStart = function() {
                    return dragDir === TOP && verScrollInst.y < 0;
                };
                /**/
                var scrollTowardsVerEnd = function () {
                    return dragDir === BOTTOM && verScrollInst.y > verScrollInst.maxScrollY;
                };

                if ( isHozCheckRequired() && hasHozScroll() ) {
                    if ( scrollTowardsHozStart() ) {
                        hozScrollInst.scrollBy(10, 0, 1);
                    } else if ( scrollTowardsHozEnd() ) {
                        hozScrollInst.scrollBy(-10, 0, 1);
                    }
                } else if ( isVerCheckRequired() ) {
                    colIndex = orderState.findCurrCol();

                    if ( colIndex > -1 ) {
                        verScrollInst = $scope.getScroller('assignedRoomList-' + colIndex);

                        if ( hasVerScroll() ) {
                            if ( scrollTowardsVerStart() ) {
                                verScrollInst.scrollBy(0, 8, 1);
                            } else if ( scrollTowardsVerEnd() ) {
                                verScrollInst.scrollBy(0, -8, 1);
                            }
                        }
                    }
                }
            };

            var draggedItem;

            $scope.dragStart = function(event) {
            	draggedItem = $(event.target).parent();
            	draggedItem.hide();

                timer = setInterval( checkScrollBy, 1 );
                $scope.dropIndex = undefined;
            };

            $scope.dragDrop = function() {
            	var delayed = true;

            	draggedItem.show();

                if ( isAllWorktypeView() ) {
                	orderState.removePlaceholder(delayed);
                }

                if ( !! timer ) {
                    window.clearInterval(timer);
                    timer = UNDEF;
                }
            };

            var addPlaceholderThrottled = _.throttle(orderState.addPlaceholder, 250, {leading: true, trailing: false});

            $scope.userDragging = function(e) {

            	if ( isAllWorktypeView() ) {

					// ask orderState to get a load of latest clientX and clientY
					// throttle the calls to addplaceholder
					orderState.setClientPos(e.clientX, e.clientY);
					addPlaceholderThrottled();
            	}

                // Priority for detect for horizontal scroll requirement
                // only if the check are not positive we check for vertical scrolls
                if ( e.clientX > dim.screenEnd.x ) {
                    dragDir = RIGHT;
                    return;
                } else if ( e.clientX < dim.screenStart.x ) {
                    dragDir = LEFT;
                    return;
                } else if ( e.clientY > dim.screenEnd.y ) {
                    dragDir = BOTTOM;
                    return;
                } else if ( e.clientY < dim.screenStart.y ) {
                    dragDir = TOP;
                    return;
                } else {
                    dragDir = UNDEF;
                    return;
                }
            };
        };

		var checkAutoScroll = function() {
			if (!!$scope.getScroller('worksheetHorizontal')) {
				setUpAutoScroller();
			} else {
				setTimeout(checkAutoScroll, 100);
			}
		};

		/**
		 * Function to bootstrap multisheet.
		 * @return {Undefined}
		 */
		var init = function(employeeIds) {
			// state settings
			setBackNavAndTitle();

			// scope variable watchers
			setupWatchers();

			// Data model for multisheet state
			initializeMultiSheetDataModel(true);

			// Update employee selection list
			initializeEmployeesList(employeeIds);

			// Update filters
			$scope.filterUnassigned();

			initializeVariables();

			// Add scrollers and listners
			refreshView();

			// check for scroll instance and setup auto scroll
			checkAutoScroll();
		};

		init();

		quickMatchCache = {};
		$scope.getRoomType = function (id) {
			var quick = quickMatchCache[id];
			var match, found;

			if ( angular.isDefined(quick) ) {
				found = quick;
			} else {
				match = _.find(allRoomTypes, {id: id});

				if ( angular.isDefined(match) ) {
					quickMatchCache[id] = match.name;
					found = match.name;
				} else {
					found = '';
				}
			}

			return found;
		};

        // Formats the given date based on the hotel date format
        $scope.formatDateForUI = function(date_) {
            var type_ = typeof date_,
                returnString = '';

          switch (type_) {
              // if date string passed
            case 'string':
              returnString = $filter('date')(new tzIndependentDate(date_), $rootScope.dateFormat);
              break;

              // if date object passed
            case 'object':
              returnString = $filter('date')(date_, $rootScope.dateFormat);
              break;
          }
          return (returnString);
        };

        // Get the ids of the selected employees
        var getSelectedEmployees = function () {
            var currIds = _.pluck(_.where($scope.employeeList, { ticked: true }), 'id');

            return currIds;
        };

        // CICO-45485 - Get all the rooms which are having tasks for the given work type
        var getUnAssignedRoomTasksByWorkType = function (workTypeId, unAssignedRoomTasks) {
                var rooms = [];

                _.each (unAssignedRoomTasks, function (roomInfo) {
                    var roomCloned = angular.copy(roomInfo),
                        roomDetails = _.find ($scope.multiSheetState.allRooms, function (room) {
                                            return room.id == roomCloned.room_id;
                                      });

                    if (roomDetails) {
                        roomCloned.hk_section_id = roomDetails.hk_section_id;
                    }

                    if (workTypeId) {
                       roomCloned.room_tasks = _.filter(roomCloned.room_tasks, function (task) {
                            return task.work_type_id == $scope.multiSheetState.header.work_type_id;
                        });
                    }

                    if (roomCloned.room_tasks.length) {
                        rooms.push(roomCloned);
                    }

                });
                return rooms;
        };

        // Get the room info from the unassigned list
        var populateRoomInfo = function (roomId) {
            var room = _.find (payload.unassignedRoomTasks, function(unAssignedRoom) {
                            return unAssignedRoom.room_id == roomId;
                        });

            return JSON.parse(JSON.stringify(room));
        };

        // // Update the assignment list after auto assignment
        var updateAssignedRoomList = function (data) {
            var assignedTasks = data;

            _.each (assignedTasks, function (tasks, empId) {

                var employee = _.find(payload.assignedRoomTasks, function (assignedTask) {
                                        return assignedTask.id == empId;
                                    });

                employee.only_tasks = employee.only_tasks.concat(tasks);

                var taskRooms = _.uniq(_.pluck(tasks, 'room_id'));

                _.each (taskRooms, function (roomId) {
                    var selectedRoom = _.find(employee.rooms, function (room) {
                        return room.id == roomId;
                    });

                    var selectedRoomIndex = _.findIndex(employee.rooms, function(roomInfo) {
                            return roomInfo.id == roomId;
                        });

                    var roomCloned = angular.copy(selectedRoom);

                    if (selectedRoom) {
                        roomCloned.room_tasks = roomCloned.room_tasks.concat(_.filter(tasks, function(task) {
                            return task.room_id == roomId;
                         }));
                        employee.rooms[selectedRoomIndex] = roomCloned;
                    } else {
                        var roomInfo = populateRoomInfo(roomId);

                        roomInfo.room_tasks = _.filter(tasks, function(task) {
                            return task.room_id == roomId;
                         });
                        employee.rooms.push(roomInfo);
                    }

                });
                employee.touched_work_types = _.uniq(_.pluck(employee.only_tasks, 'work_type_id'));

            });
        };

        // Update the unassigned list after auto assignment
        var updateUnAssignedRoomList = function (data) {

            var assignedTasks = [];

            _.each (data, function (tasks) {
                assignedTasks = assignedTasks.concat(tasks);
            });

            var roomIds = _.uniq(_.pluck(assignedTasks, 'room_id'));

            _.each (roomIds, function (roomId) {
                    var room = _.find (payload.unassignedRoomTasks, function (roomTask) {
                                    return roomTask.room_id == roomId;
                                 }),

                        roomIdx = _.findIndex(payload.unassignedRoomTasks, function(roomInfo) {
                            return roomInfo.room_id == roomId;
                        });

                        var roomTasks = _.filter(assignedTasks, function (task) {
                                            return task.room_id == roomId;

                                        });

                        var roomTaskIds = _.pluck(roomTasks, 'id'),
                            roomCloned = angular.copy(room);

                        roomCloned.room_tasks = _.filter(roomCloned.room_tasks, function (roomTask) {
                                         return roomTaskIds.indexOf(roomTask.id) < 0 ;
                                    });
                         payload.unassignedRoomTasks[roomIdx] = roomCloned;

            });

        };

        // Process the response after the auto assignment to update the UI
        var processDataAfterAutoAssign = function (data) {
            updateAssignedRoomList(data.assigned_tasks);
            updateUnAssignedRoomList(data.assigned_tasks);
            init(getSelectedEmployees());
        };

        // Execute auto assign from work management screen based on the admin configuration
        $scope.executeAutoAssign = function () {

            // CICO-45459 - Prompt the user to save the worksheet first before proceeding for auto assignment
            if ($scope.workSheetChanged) {
               openSaveConfirmationPopup();
               return false;
            }

            var onAutoAssignSuccess = function(data) {
                    processDataAfterAutoAssign(data);
                    refreshView();
                },
                onAutoAssignFailure = function (error) {
                    $scope.errorMessage = error;
                };

            var options = {
                successCallBack: onAutoAssignSuccess,
                failureCallBack: onAutoAssignFailure,
                params: {
                    date: $scope.dateSelected,
                    employee_ids: getSelectedEmployees(),
                    worktype_id: $scope.multiSheetState.header.work_type_id,
                    unassigned_room_tasks: getUnAssignedRoomTasksByWorkType($scope.multiSheetState.header.work_type_id, payload.unassignedRoomTasks)
                }
            };

            $scope.callAPI(RVWorkManagementSrv.executeAutoAssign, options);
        };

        // Hack to return custom label for DND status
        $scope.getHKStatus = function (status) {
            if (status === 'DO_NOT_DISTURB') {
                return 'DND';
            }

            return status;
		};

		/**
		 * Get the first filtered task
		 * @param {String} filterWorkTypeId - filter work type id
		 * @param {String} taskWorkTypeId - task work type id
		 * @param {Array} tasks - array of tasks
		 * @return {Number} id of the task
		 */
		$scope.getFirstFilteredTaskId = function(filterWorkTypeId, taskWorkTypeId, tasks) {
			if (!filterWorkTypeId) {
				return ((tasks && tasks.length > 0 && tasks[0].id) || null);
			}
			var filteredTask = _.filter(tasks, function(task) {
					return task.work_type_id == filterWorkTypeId;
			});
			
			return ((filteredTask && filteredTask.length > 0 && filteredTask[0].id) || null);

		};

		var languageChangeListner = $rootScope.$on('LANGUAGE_CHANGED', function() {
			$timeout(function() {
				$rootScope.setPrevState.title = $filter('translate')('WORK_MANAGEMENT');
				$scope.setHeading($filter('translate')('WORK_MANAGEMENT'));
			}, 100);
        });

        $scope.$on('$destroy', languageChangeListner);

        /**
         * Reset worksheets for the given employees
         * @param {Array} employeeIds list of employeed ids
         * @return {void}
         */
        var resetWorkSheetsByEmployees = function(employeeIds) {
            var requestParams = {
                date: $scope.multiSheetState.selectedDate,
                employee_ids: employeeIds,
                work_type_id: $scope.multiSheetState.header.work_type_id
            };

            $scope.callAPI(RVWorkManagementSrv.resetWorkAssignments, {
                params: requestParams,
                onSuccess: updateView,
                onFailure: updateView
            });
        };

        /**
         * Reset work assignments
         */
        $scope.resetWorkAssignments = function() {
            if ($scope.workSheetChanged) {
                updateView();
            } else {
                resetWorkSheetsByEmployees(getSelectedEmployeeIds());
            }

        };

        /**
         * Checks whether reset button should be disabled or not
         */
        $scope.shouldDisableResetButton = function() {
            return getSelectedEmployeeIds().length < 1;
        };

        /**
         * Checks whether remove button should be shown or not
         * @param {Array} rooms - array of rooms
         * @return {Boolean} task assigned or not
         */
        $scope.shouldShowRemoveTasksButton = function(rooms) {
            var hasTasks = false;

            _.find(rooms, function(room) {
                if ($scope.multiSheetState.header.work_type_id) {
                    hasTasks = _.filter(room.room_tasks, function(task) {
                        return task.work_type_id == $scope.multiSheetState.header.work_type_id;
                    });
                    hasTasks = hasTasks.length > 0;

                } else {
                    hasTasks = room.room_tasks.length > 0;  
                }

                if (hasTasks) {
                    return true;
                }
            });
            
            return hasTasks;
        };

        /*
         * Reset worksheet for the given employee
         * @param {Number} employeeId - id of the employee
         * @return {void}
         */
        $scope.unassignAllTasks = function(employeeId) {
            lastBulkRemovedTasksEmployeeId = employeeId;
            resetWorkSheetsByEmployees([employeeId]);
        };

	}
]);
