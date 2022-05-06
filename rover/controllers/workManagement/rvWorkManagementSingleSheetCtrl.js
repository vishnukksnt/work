angular.module('sntRover').controller('RVWorkManagementSingleSheetCtrl', [
    '$rootScope', '$scope', '$stateParams', 'wmWorkSheet', 'RVWorkManagementSrv',
    '$timeout', '$state', 'ngDialog', '$filter', 'allUnassigned', '$window', '$transitions',
	function($rootScope, $scope, $stateParams, wmWorkSheet, RVWorkManagementSrv,
             $timeout, $state, ngDialog, $filter, allUnassigned, $window, $transitions) {
		BaseCtrl.call(this, $scope);


		// flag to know if we interrupted the state change
		var $_shouldSaveFirst = true,
			$_afterSave = null;

		// auto save the sheet when moving away
        $transitions.onStart({}, function(transition) {
            if ( 'rover.workManagement.singleSheet' === transition.from().name && $_shouldSaveFirst) {
				$_afterSave = function() {
					$_shouldSaveFirst = false;
					$state.go(transition.to(), transition.params());
				};

				$scope.saveWorkSheet();

                // INFO: https://ui-router.github.io/ng1/docs/latest/modules/transition.html#hookresult
                // returning false would cancel this transition
				return false;
			}
		});


		// back button
		var prevState = {
			title: ('Work Management'),
			name: 'rover.workManagement.start'
		};

		if ($stateParams.from === 'multiple') {
			prevState = {
				title: ('Manage Worksheets'),
				name: 'rover.workManagement.multiSheet'
			};
		} else if (!!parseInt($stateParams.from)) {
			prevState = {
				title: ('Room Details'),
				name: 'rover.housekeeping.roomDetails',
				param: {
					id: parseInt($stateParams.from)
				}
			};
		}
		$rootScope.setPrevState = prevState;


		$scope.dropToUnassign = function(event, dropped) {
			var indexOfDropped = parseInt($(dropped.draggable).attr('id').split('-')[1]);

			$scope.unAssignRoom($scope.singleState.assigned[indexOfDropped]);
		};

		$scope.dropToAssign = function(event, dropped) {
			var indexOfDropped = parseInt($(dropped.draggable).attr('id').split('-')[1]);

			$scope.assignRoom($scope.singleState.unassigned[indexOfDropped]);
		};

		// keep a local ref, since we will update it
		var wmWorkSheet = wmWorkSheet;

		var refreshView = function() {
			$scope.refreshScroller("workSheetUnassigned");
			$scope.refreshScroller("workSheetAssigned");
		};

		var preInit = function() {
			$scope.setHeading("Work Sheet No." + wmWorkSheet.sheet_number + ", " + $filter('date')($stateParams.date, $rootScope.dateFormat));

			$scope.singleState = {
				workSheet: {
					user_id: wmWorkSheet.maid_id === null ? "" : wmWorkSheet.maid_id,
					work_type_id: wmWorkSheet.work_type_id === null ? "" : wmWorkSheet.work_type_id,
					shift_id: !wmWorkSheet.shift_id ? "" : wmWorkSheet.shift_id
				},
				unassigned: [],
				unassignedFiltered: [],
				assigned: [],
				summary: {
					timeAllocated: "00:00",
					departures: 0,
					stayovers: 0,
					completed: 0
				},
				filters: {
					selectedFloor: "",
					selectedStatus: ""
				},
				dimensions: {
					unassigned: $("#worksheet-unassigned-rooms").width() - 40,
					assigned: $("#worksheet-assigned-rooms").width() - 40
				}
			};

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
		};

		var init = function() {
			var onFetchSuccess = function(data) {

				// bluntly update the heading as this init could have been triggered
				// due to a change in any filters
				// TODO: update the shift filter in that case
				$scope.setHeading("Work Sheet No." + data.work_sheets[0].work_sheet_id + ", " + $filter('date')($stateParams.date, $rootScope.dateFormat));

				$scope.singleState.unassigned = data.unassigned;

				// we are gonna just gonna assign
				// the assigned rooms avail here

				// no more checking for worksheet id
				var assignedRooms = [];

				_.each(data.work_sheets[0].work_assignments, function(room) {
					assignedRooms.push(room.room);
				});
				$scope.singleState.assigned = assignedRooms;

				$scope.filterUnassigned();
				summarizeAssignment();
				refreshView();
				$scope.$emit('hideLoader');
			};

			var onFetchFailure = function(errorMessage) {
				$scope.errorMessage = errorMessage;
				$scope.$emit('hideLoader');
			};

			$scope.invokeApi(RVWorkManagementSrv.fetchWorkSheetDetails, {
				"date": $stateParams.date || $rootScope.businessDate,
				"employee_ids": [$scope.singleState.workSheet.user_id],
				"work_type_id": $scope.singleState.workSheet.work_type_id
			}, onFetchSuccess, onFetchFailure);
		};

		// keep a refrence on $scope
		$scope.init = init;

		var summarizeAssignment = function() {
			$scope.singleState.summary = {
				timeAllocated: "00:00",
				departures: 0,
				stayovers: 0,
				completed: 0
			};
			_.each($scope.singleState.assigned, function(room) {
				if ($scope.departureClass[room.reservation_status] === "check-out") {
					$scope.singleState.summary.departures++;
				} else if ($scope.departureClass[room.reservation_status] === "inhouse") {
					$scope.singleState.summary.stayovers++;
				}
				if (room.hk_complete) {
					$scope.singleState.summary.completed++;
				}
				// Add up the allocated time
				var existing = $scope.singleState.summary.timeAllocated.split(":"),
					current = room.time_allocated.split(":"),
					sumMinutes = parseInt(existing[1]) + parseInt(current[1]),
					sumHours = (parseInt(existing[0]) + parseInt(current[0]) + parseInt(sumMinutes / 60)).toString();

				$scope.singleState.summary.timeAllocated = (sumHours.length < 2 ? "0" + sumHours : sumHours) +
					":" +
					((sumMinutes % 60).toString().length < 2 ? "0" + (sumMinutes % 60).toString() : (sumMinutes % 60).toString());
			});
		};


		$scope.setScroller("workSheetUnassigned");
		$scope.setScroller("workSheetAssigned");

		$scope.assignRoom = function(room) {
			$scope.singleState.unassigned.splice(_.indexOf($scope.singleState.unassigned, _.find($scope.singleState.unassigned, function(item) {
				return item.room_no === room.room_no;
			})), 1);
			$scope.singleState.assigned.push(room);
			summarizeAssignment();
			refreshView();
		};

		$scope.unAssignRoom = function(room) {
			$scope.singleState.assigned.splice(_.indexOf($scope.singleState.assigned, _.find($scope.singleState.assigned, function(item) {
				return item.room_no === room.room_no;
			})), 1);
			$scope.singleState.unassigned.push(room);
			summarizeAssignment();
			refreshView();
		};

		$scope.printWorkSheet = function() {
			$scope.saveWorkSheet({
				callNextMethod: 'printAfterSave'
			});
		};

		// add the print orientation before printing
		var addPrintOrientation = function() {
			$( 'head' ).append( "<style id='print-orientation'>@page { size: landscape; }</style>" );
		};

		// add the print orientation after printing
		var removePrintOrientation = function() {
			$( '#print-orientation' ).remove();
		};

		$scope.printAfterSave = function() {
			if ($scope.$parent.myScroll['workSheetAssigned'] && $scope.$parent.myScroll['workSheetAssigned'].scrollTo) {
				$scope.$parent.myScroll['workSheetAssigned'].scrollTo(0, 0);
			}


			// add the orientation
			addPrintOrientation();

			var onPrintCompletion = function() {
				$timeout(removePrintOrientation, 100);
			};

			/*
			*	======[ READY TO PRINT ]======
			*/
			// this will show the popup with full bill
			$timeout(function() {
				/*
				*	======[ PRINTING!! JS EXECUTION IS PAUSED ]======
				*/
				if ( sntapp.cordovaLoaded ) {
					cordova.exec(onPrintCompletion, function() {
						onPrintCompletion();
					}, 'RVCardPlugin', 'printWebView', ['singleSheet', '0', '', 'L']);
				} else {
					$window.print();
					onPrintCompletion();	
				}
			}, 100);
			
		};


		$scope.deletWorkSheet = function() {
			var onDeleteSuccess = function(data) {
					$scope.$emit("hideLoader");

					// make it false so that the ctrl wont save it back again
					// when going back to the makangement dsahboard
					$_shouldSaveFirst = false;

					$timeout( function() {
						$state.go('rover.workManagement.start');
					}, 20 );
				},
				onDeleteFailure = function(errorMessage) {
					$scope.errorMessage = errorMessage;
					$scope.$emit("hideLoader");
				};

			$scope.invokeApi(RVWorkManagementSrv.deleteWorkSheet, {
				"id": $stateParams.id
			}, onDeleteSuccess, onDeleteFailure);
		};


		// for all unassigned rooms
		// we are gonna mark each rooms with
		// its associated work_type_id
		// this way while saving we can determine
		// how many different work type has been touched
		// and how many save request must be created
		var wtid = '';

		_.each(allUnassigned, function(item) {
			wtid = item.id;
			_.each(item.unassigned, function(room) {
				room.work_type_id = wtid;
			});
		});

		$scope.saveWorkSheet = function(options) {
			var assignedRooms = [],
				saveCount     = 0,
				worktypeId    = (!!options && !!options.oldWorkTypeId) ? options.oldWorkTypeId : $scope.singleState.workSheet.work_type_id,
				userId        = (!!options && !!options.oldUserId) ? options.oldUserId : $scope.singleState.workSheet.user_id,
				worktypesSet  = {};

			var afterAPIcall  = function() {
					// delay are for avoiding collisions
					if ( options && $scope[options.callNextMethod] ) {
						$timeout($scope[options.callNextMethod], 50);
					}
					if ( $_shouldSaveFirst && !!$_afterSave ) {
						$timeout($_afterSave, 60);
					}
				},
				onSaveSuccess = function(data) {
					saveCount--;
					if ( saveCount === 0 ) {
						$scope.$emit("hideLoader");
						$scope.clearErrorMessage();

						afterAPIcall();
					}
				},
				onSaveFailure = function(errorMessage) {
					$scope.errorMessage = errorMessage;

					saveCount--;
					if ( saveCount === 0 ) {
						$scope.$emit("hideLoader");
						afterAPIcall();
					}
				};

			if (!worktypeId) {
				$scope.errorMessage = ['Please select a work type.'];
				return false;
			}
			if (!$scope.singleState.workSheet.user_id) {
				$scope.errorMessage = ['Please select an employee.'];
				return false;
			}

			// lets create a set of worktypes that will hold
			// rooms under each worktype id name - e.g:


			worktypesSet = {};

			// use the worktype list to initiate
			// each worktype array that will hold
			// corresponding rooms
			_.each($scope.workTypes, function(type) {
				worktypesSet[type.id.toString()] = [];
			});

			// if a room in assigned has prop 'work_type_id' (read line #217)
			// assign it to the corresponding array
			// else assign to the array corresponding the active work type
			if ( $scope.singleState.assigned.length ) {
				_.each($scope.singleState.assigned, function(room) {
					if ( room.hasOwnProperty('work_type_id') ) {
						worktypesSet[room.work_type_id.toString()].push(room);
					} else {
						worktypesSet[worktypeId.toString()].push(room);
					}
				});

				// loop each worktypeSet
				// we only need to save it
				// if it has any room in it
				_.each(worktypesSet, function(set, key) {
					if ( set.length ) {
						_.each(set, function(room) {
							assignedRooms.push(room.room_id || room.id);
						});

						$scope.invokeApi(RVWorkManagementSrv.saveWorkSheet, {
							"date": $stateParams.date,
							"task_id": parseInt(key),
							"order": "",
							"assignments": [{
								"shift_id": $scope.singleState.workSheet.shift_id,
								"assignee_id": userId,
								"room_ids": assignedRooms,
								"work_sheet_id": ""
							}]
						}, onSaveSuccess, onSaveFailure);

						// must reset after API call
						assignedRooms = [];

						// increment API call count
						saveCount++;
					}
				});
			} else {
				_.each(worktypesSet, function(set, key) {
				$scope.invokeApi(RVWorkManagementSrv.saveWorkSheet, {
							"date": $stateParams.date,
							"task_id": parseInt(key),
							"assignments": [{
								"assignee_id": userId,
								"room_ids": []
							}]
						}, onSaveSuccess, onSaveFailure);
				});
				afterAPIcall();
			}
		};


		$scope.startLoader = function() {
			$scope.$emit('showLoader');
		};

		$scope.filterUnassigned = function() {
			$scope.$emit('showLoader');

			$timeout(function() {
				$scope.singleState.unassignedFiltered = $scope.filterUnassignedRooms($scope.filters, $scope.singleState.unassigned, allUnassigned);
				refreshView();
				$scope.closeDialog();
				$scope.$emit('hideLoader');
			}, 10);
		};


		$scope.$watch('singleState.workSheet.work_type_id', function(newVal, oldVal) {
			if (newVal !== oldVal) {
				$scope.saveWorkSheet({
					oldWorkTypeId: oldVal,
					callNextMethod: 'onWorkTypeChange'
				});
			}
		});

		$scope.onWorkTypeChange = function() {
			init();
		};

		$scope.$watch('singleState.workSheet.user_id', function(newVal, oldVal) {
			if (newVal !== oldVal) {
				$scope.saveWorkSheet({
					oldUserId: oldVal,
					callNextMethod: 'onEmployeeChange'
				});
			}
		});

		$scope.onEmployeeChange = function(options) {
			// if the work type filter is already in 'Daily Cleaning', just call init()
			// else change the work type to 'Daily Cleaning' and it will trigger init()
			init();
		};

		$scope.refreshSheet = function() {
			$scope.saveWorkSheet({
				callNextMethod: 'init'
			});
		};


		$scope.onAssignmentDragStart = function() {
			$scope.$parent.myScroll["workSheetUnassigned"].disable();
		};

		$scope.onAssignmentDragStop = function() {
			$scope.$parent.myScroll["workSheetUnassigned"].enable();
		};

		$scope.onUnassignmentDragStart = function() {
			$scope.$parent.myScroll["workSheetAssigned"].disable();
		};

		$scope.onUnassignmentDragStop = function() {
			$scope.$parent.myScroll["workSheetAssigned"].enable();
		};

		$scope.showFilter = function() {
			ngDialog.open({
				template: '/assets/partials/workManagement/popups/rvWorkManagementFilterRoomsPopup.html',
				className: 'ngdialog-theme-default',
				closeByDocument: true,
				scope: $scope
			});
		};

		$scope.idToVal = function(id, key, source) {
			var match = _.find(source, function(item) {
				return item.id === id;
			});

			return !!match && match.hasOwnProperty(key) ? match[key] : '';
		};

		preInit();
		init();
	}

]);
