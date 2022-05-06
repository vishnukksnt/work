angular.module('sntRover').controller('RVHkRoomStatusCtrl', [
	'$scope',
	'$rootScope',
	'$timeout',
	'$state',
	'$filter',
	'$window',
	'RVHkRoomStatusSrv',
	'fetchPayload',
	'employees',
	'roomTypes',
	'floors',
	'hkStatusList',
	'ngDialog',
	'RVWorkManagementSrv',
	'RVHkRoomDetailsSrv',
	'rvUtilSrv',
	'rvPermissionSrv',
	'$stateParams',
	function(
		$scope,
		$rootScope,
		$timeout,
		$state,
		$filter,
		$window,
		RVHkRoomStatusSrv,
		fetchPayload,
		employees,
		roomTypes,
		floors,
		hkStatusList,
		ngDialog,
		RVWorkManagementSrv,
		RVHkRoomDetailsSrv,
		util,
		rvPermissionSrv,
		$stateParams
	) {
		// hook it up with base ctrl
		BaseCtrl.call( this, $scope );

		// set the previous state
		$rootScope.setPrevState = {
			title: $filter( 'translate' )( 'DASHBOARD' ),
			name: 'rover.dashboard'
		};

		var _title = $rootScope.isMaintenanceStaff ? 'MY_WORKSHEET' : 'ROOM_STATUS';

		_title = $filter( 'translate')(_title);

		// set title in header
		$scope.setTitle(_title);
		$scope.heading = _title;
		$scope.$emit( 'updateRoverLeftMenu', 'roomStatus' );
		$scope.totalRoomsSelectedForUpdate = 0;
		// set the scroller
		$scope.setScroller('room-status-filter');
		$scope.setScroller('room-service-status-update');
		$scope.setScroller('rooms-list-to-forcefully-update');
		

		setTimeout(function() {
			$scope.refreshScroller('room-status-filter');
			$scope.refreshScroller('rooms-list-to-forcefully-update');
		}, 1500);


		/* ***** ***** ***** ***** ***** */


		// reset all the filters
		if ( RVHkRoomStatusSrv.currentFilters.page < 1 ) {
			RVHkRoomStatusSrv.currentFilters.page = 1;
		}
		$scope.currentFilters = angular.copy( RVHkRoomStatusSrv.currentFilters );


		/* ***** ***** ***** ***** ***** */


		var $_roomList        = {},
			$_defaultWorkType = '',
			$_defaultEmp      = '';

		var $_page            = $scope.currentFilters.page,
			$_perPage         = $scope.currentFilters.perPage,
			$_defaultPage     = 1,
			$_defaultPerPage  = $window.innerWidth < 599 ? 25 : 50;

		var $_roomsEl         = document.getElementById( 'rooms' ),
			$_filterRoomsEl   = document.getElementById( 'filter-rooms' );

		var $_activeWorksheetData = [],
			$_tobeAssignedRoom    = {};

		var $_lastQuery = '';

		var $_oldFilterValues = angular.copy( RVHkRoomStatusSrv.currentFilters ),

			$_oldRoomTypes    = angular.copy( roomTypes );

		var $_printQueued = false;

		$scope.resultFrom         = $_page;
		$scope.resultUpto         = $_perPage;
		$scope.netTotalCount      = 0;
		$scope.uiTotalCount       = 0;
		$scope.disablePrevBtn     = true;
		$scope.disableNextBtn     = true;

		$scope.filterOpen         = false;
		$scope.query              = $scope.currentFilters.query;
		$scope.noResultsFound     = 0;

		$scope.isStandAlone         = $rootScope.isStandAlone;
		$scope.isMaintenanceStaff   = $rootScope.isMaintenanceStaff;
		$scope.isMaintenanceManager = $rootScope.isMaintenanceManager;
		$scope.hasActiveWorkSheet   = false;

		$scope.roomTypes          = roomTypes;
		$scope.floors             = floors;

		$scope.workTypes          = [];
		$scope.employees          = [];

		$scope.assignRoom         = {};

		// HK status Update popup
		$scope.isRoomStatusUpdate = true;
		$scope.isServiceStatusUpdate = false;
		$scope.updateServiceData = {};

		if (!!RVHkRoomStatusSrv.defaultViewState) {
			$scope.currentView = RVHkRoomStatusSrv.defaultViewState;
		} else {
			$scope.currentView = $scope.isMaintenanceStaff ? 'TASKS' : 'ROOMS';
		}

        var HK_STATUS = {
            INSPECTED: 'INSPECTED'
        };

		$scope.changeView = function(view) {
			$scope.currentView = view;
			RVHkRoomStatusSrv.defaultViewState = view;
		};
		var scrollCount = 0;

		$scope.hasPermissionToPutRoomOOSOrOOO = rvPermissionSrv.getPermissionValue('PUT_ROOM_OOO_OR_OOS');

		var delayedExec = function(after, fn) {

			var timer;
			
			return function() {
				scrollCount += 1;
				timer && clearTimeout(timer);
				timer = setTimeout(fn, after);
			};
		};

		var scrollStopper = delayedExec(500, function() {
		    scrollCount = 0;
			$rootScope.$emit('HIDE_ROOM_INDICATOR_POPUP');
		});

		angular.element(document.querySelector('#rooms')).bind('scroll', scrollStopper);

		$scope.toggleView = function() {
			if ($scope.currentView === 'ROOMS') {
				$scope.currentView = 'TASKS';
			} else {
				$scope.currentView = 'ROOMS';
			}

			RVHkRoomStatusSrv.defaultViewState = $scope.currentView;
			$timeout(function() {
				$scope.refreshScroller('tasks-summary-scroller');
			}, 2000);

		};

		// multiple room status change DS
		$scope.multiRoomAction = {
			rooms: [],
			indexes: {},
			anyChosen: false,
			allChosen: false,
			hkStatusId: ''
		};
        $scope.hkStatusList = hkStatusList;

        // CICO-79078 - DND status is not required anywhere except the work tab
        $scope.hkStatusList = _.filter($scope.hkStatusList, function (item) {
            return item.value !== 'DO_NOT_DISTURB';
        });

		$scope.allRoomIDs   = fetchPayload.roomList['all_room_ids'];


		/* ***** ***** ***** ***** ***** */
		// Defined pagination for dashboard search
		$scope.hkSearchPagination = {
			id: 'HK_SEARCH',
			api: $_callRoomsApi,
			perPage: $scope.currentFilters.perPage
		};
		
		// true represent that this is a fetchPayload call
		// and the worktypes and assignments has already be fetched
		$_fetchRoomListCallback(fetchPayload.roomList, true);

		/* ***** ***** ***** ***** ***** */


		$scope.loadNextPage = function(e) {
			if ( $scope.disableNextBtn ) {
				return;
			}

			$_page++;
			$_updateFilters('page', $_page);

			$_callRoomsApi($_page);
		};

		$scope.loadPrevPage = function(e) {
			if ($scope.disablePrevBtn) {
				return;
			}

			$_page--;
			$_updateFilters('page', $_page);

			$_callRoomsApi($_page);
		};

		// store the current room list scroll position
		$scope.roomListItemClicked = function(room) {
			$timeout(function() {
				if (scrollCount === 0) {
					localStorage.setItem( 'roomListScrollTopPos', $_roomsEl.scrollTop );
					$state.go("rover.housekeeping.roomDetails", {
						id: room.id,
						page: $_page,
						roomStatus: $stateParams.roomStatus
					});
				}
			}, 400);
		};

		$scope.showFilters = function() {
			$scope.filterOpen = true;
            setTimeout(function() {
                $scope.refreshScroller('room-status-filter');
            }, 1500);
		};

		$scope.refreshData = function() {
			$_callRoomsApi();
		};

		$scope.filterDoneButtonPressed = function() {
			var _hasFilterChanged   = false,
				_hasRoomTypeChanged = false;

			var _makeCall = function() {
				$scope.filterOpen = false;
				$scope.$emit( 'showLoader' );

				$_resetPageCounts();

				RVHkRoomStatusSrv.currentFilters = angular.copy( $scope.currentFilters );
				$_oldFilterValues                = angular.copy( $scope.currentFilters );

				RVHkRoomStatusSrv.roomTypes = angular.copy( $scope.roomTypes );
				$_oldRoomTypes              = angular.copy( $scope.roomTypes );

				$timeout(function() {
					$_callRoomsApi();
				}, 100);
			};

			// if other than page number any other filter has changed
			for (key in $scope.currentFilters) {
				if ( $scope.currentFilters.hasOwnProperty(key) ) {
					if ( key === 'page' ) {
						continue;
					} else if ( $scope.currentFilters[key] !== $_oldFilterValues[key] ) {
						_hasFilterChanged = true;
						break;
					}
				}
			}

			// if any room types has changed
			if ( $scope.roomTypes.length ) {
				for (var i = 0, j = $scope.roomTypes.length; i < j; i++) {
					if ( $scope.roomTypes[i]['isSelected'] !== $_oldRoomTypes[i]['isSelected'] ) {
						_hasRoomTypeChanged = true;
						break;
					}
				}
			}

			if ( _hasFilterChanged || _hasRoomTypeChanged ) {
				$timeout(_makeCall, 100);
			} else {
				$scope.filterOpen = false;
			}
		};

		var $_filterByQuery = function(forced) {
			var _makeCall = function() {
					$_updateFilters('query', $scope.query);

					$_resetPageCounts();

					$timeout(function() {
						$_callRoomsApi();
						$_lastQuery = $scope.query;
					}, 10);
				};

			if ( $rootScope.isSingleDigitSearch ) {
				if (forced || $scope.query !== $_lastQuery) {
					_makeCall();
				}
			} else {
				if ( forced ||
						($scope.query.length <= 2 && $scope.query.length < $_lastQuery.length) ||
						($scope.query.length > 2 && $scope.query !== $_lastQuery)
				) {
					_makeCall();
				}
			}
		};

		$scope.filterByQuery = _.throttle($_filterByQuery, 1000, { leading: false });

		$scope.clearSearch = function() {
			$scope.query = '';
			$_filterByQuery('forced');
		};

		$scope.isFilterChcked = function() {
			var key, ret;

			for (key in $scope.currentFilters) {
				if ( key !== 'showAllFloors' && !!$scope.currentFilters[key] ) {
					ret = true;
					break;
				} else {
					ret = false;
				}
			}
			return ret;
		};

		$scope.clearFilters = function() {
			console.log('clearFilters autocalled');
			$scope.roomTypes = RVHkRoomStatusSrv.resetRoomTypes();

			$scope.currentFilters = RVHkRoomStatusSrv.initFilters();
			if ( $scope.isStandAlone ) {
				$scope.currentFilters.filterByWorkType = "";
				$scope.currentFilters.filterByEmployeeName = "";
			}
			RVHkRoomStatusSrv.currentFilters = angular.copy( $scope.currentFilters );

			$_refreshScroll();
		};

		$scope.validateFloorSelection = function(type) {
			if (type === 'SINGLE_FLOOR') {
				$scope.currentFilters.floorFilterStart = '';
				$scope.currentFilters.floorFilterEnd = '';

			}

			if (type === 'FROM_FLOOR' || type === 'TO_FLOOR') {
				$scope.currentFilters.floorFilterSingle = '';
			}
		};

		$scope.allFloorsClicked = function() {
			$scope.currentFilters.showAllFloors = !$scope.currentFilters.showAllFloors;
			$scope.currentFilters.floorFilterStart = '';
			$scope.currentFilters.floorFilterEnd = '';
			$scope.currentFilters.floorFilterSingle = '';
		};

		$scope.closeDialog = function() {
		    $scope.errorMessage = "";
		    ngDialog.close();
		};

		var $_findEmpAry = function() {
			var workid = $scope.assignRoom.work_type_id || $scope.topFilter.byWorkType,
				ret    =  _.find($_activeWorksheetData, function(item) {
					return item.id === workid;
				});

			return !!ret ? ret.employees : [];
		};

		$scope.singleRoomTypeFiltered = function() {
			_.each($scope.roomTypes, function(item) {
				if ( item.id && item.id.toString() === $scope.currentFilters.singleRoomType ) {
					item.isSelected = true;
				} else {
					item.isSelected = false;
				}
			});
		};

		$scope.printData = function() {
			$scope.returnToPage = $_page;

			$_updateFilters('page', 1);
			$_updateFilters('perPage', 1000);

			function callback (data) {
				$_fetchRoomListCallback(data);
				$_printQueued = true;
			}

			$scope.invokeApi(RVHkRoomStatusSrv.fetchRoomListPost, {}, callback);
		};

		var allRendered = $scope.$on('ALL_RENDERED', function() {
			if ( $_printQueued ) {
				$_startPrinting();
				$_printQueued = false;
			}
		});

		$scope.$on( '$destroy', allRendered );		 

		$scope.roomSelectChange = function(item, i) {
			var _value = item.selected,
				_key   = i + '';

			// double to make sure its a truthy value
			if ( !! _value ) {
				$scope.multiRoomAction.anyChosen = true;

				// if this room has not added yet, add it
				if ( ! $scope.multiRoomAction.indexes.hasOwnProperty(_key) ) {
					$scope.multiRoomAction.rooms.push( $scope.rooms[i].id );
					$scope.multiRoomAction.indexes[_key] = i;
				}
			} else {
				if ( _.has($scope.multiRoomAction.indexes, _key) ) {
					// remove from array
					var indexToRemove = _.indexOf($scope.multiRoomAction.rooms, $scope.rooms[i].id);

					$scope.multiRoomAction.rooms.splice(indexToRemove, 1);

					// remove keyMirror
					$scope.multiRoomAction.indexes[_key] = undefined;
					delete $scope.multiRoomAction.indexes[_key];
					$scope.multiRoomAction.allChosen = false;
				}

				if ( !$scope.multiRoomAction.rooms.length ) {
					$scope.multiRoomAction.anyChosen = false;
				}
			}
			
		};

		$scope.toggleRoomSelection = function() {
			var _selection,
				_ithRoom,
				_key;

			var i, j;

			if ( $scope.multiRoomAction.allChosen ) {
				_selection = true;
			} else {
				_selection = false;
			}

			if ( $scope.multiRoomAction.anyChosen ) {
				_selection = false;
			}

			$scope.multiRoomAction.anyChosen = _selection;
			$scope.multiRoomAction.allChosen = _selection;

			// make all selected, push ids and track the indexes
			if ( _selection ) {
				$scope.multiRoomAction.rooms = [];
				$scope.multiRoomAction.indexes = {};

				for (i = 0, j = $scope.uiTotalCount; i < j; i++) {
					$scope.rooms[i]['selected'] = true;

					$scope.multiRoomAction.rooms.push( $scope.rooms[i]['id'] );
					$scope.multiRoomAction.indexes[i] = i;
				}
			}

			// loop the indexes to remove the chosen rooms
			// rather than loop in the entire array of rooms
			else {
				for ( _key in $scope.multiRoomAction.indexes ) {
					if ( ! $scope.multiRoomAction.indexes.hasOwnProperty(_key) ) {
					    continue;
					}

					_ithRoom = $scope.rooms[ $scope.multiRoomAction.indexes[_key] ];

					// remove selection
					if ( !! _ithRoom ) {
						_ithRoom['selected'] = false;
					}
				}

				$scope.multiRoomAction.rooms = [];
				$scope.multiRoomAction.indexes = {};
			}
		};


		// HK status Update popup

		$scope.openChangeHkStatusModal = function() {
			ngDialog.open({
			    template: '/assets/partials/housekeeping/rvChangeHkStatusModal.html',
			    className: 'ngdialog-theme-default',
			    closeByDocument: true,
			    scope: $scope
			});

			$scope.initilizeServiceStatus();
		};

		$scope.toggleRoomServiceStatusUpdate = function() {

			$scope.isRoomStatusUpdate = !$scope.isRoomStatusUpdate;
			$scope.isServiceStatusUpdate = !$scope.isServiceStatusUpdate;
		};


		/* ***** ***** ***** ***** ***** */

		/*
		 * fetch Maintenence resons
		 */
		var fetchMaintenanceReasons = function() {

			function $_maintenanceReasonsCallback(data) {
				$scope.$emit('hideLoader');
				$scope.maintenanceReasonsList = data;
			}

			$scope.invokeApi(RVHkRoomDetailsSrv.fetchMaintenanceReasons, {}, $_maintenanceReasonsCallback);
		};

		/*
		 * fetch all Service Status
		 */
		var fetchAllServiceStatus = function() {

			function $_allServiceStatusCallback(data) {
				$scope.$emit('hideLoader');
				$scope.serviceStatusList = data;
				$scope.updateServiceData.room_service_status_id = $scope.serviceStatusList[0].id;
			}

			$scope.invokeApi(RVHkRoomDetailsSrv.fetchAllServiceStatus, {}, $_allServiceStatusCallback);
		};

		/*
		 * Using Utilty service for Time selector
		 *
		 */
		var intervalForTimeSelector = 15,
			mode = 12;

		$scope.timeSelectorList = util.getListForTimeSelector (intervalForTimeSelector, mode);

		$scope.shouldShowTimeSelector = function() {
            var isInService = $scope.updateServiceData.room_service_status_id === 1;

            return ($rootScope.isHourlyRateOn || $rootScope.hotelDiaryConfig.mode === 'FULL') && !isInService;
		};

		$scope.closeDialog = function() {
			ngDialog.close();
		};

		var datePickerCommon = {
			dateFormat: $rootScope.jqDateFormat,
			numberOfMonths: 1,
			changeYear: true,
			changeMonth: true,
			beforeShow: function(input, inst) {
				$('#ui-datepicker-div').addClass('reservation hide-arrow');
				$('<div id="ui-datepicker-overlay">').insertAfter('#ui-datepicker-div');

				setTimeout(function() {
					$('body').find('#ui-datepicker-overlay')
						.on('click', function() {
							$('#room-out-from').blur();
							$('#room-out-to').blur();
						});
				}, 100);
			},
			onClose: function(value) {
				$('#ui-datepicker-div').removeClass('reservation hide-arrow');
				$('#ui-datepicker-overlay').off('click').remove();
			}
		};

		var adjustDates = function() {
			if (tzIndependentDate($scope.updateServiceData.from_date) > tzIndependentDate($scope.updateServiceData.to_date)) {
				$scope.updateServiceData.to_date = $filter('date')(tzIndependentDate($scope.updateServiceData.from_date), 'yyyy-MM-dd');
			}
			$scope.untilDateOptions.minDate = $filter('date')(tzIndependentDate($scope.updateServiceData.from_date), $rootScope.dateFormat);
		};

		$scope.fromDateOptions = angular.extend({
			minDate: $filter('date')($rootScope.businessDate, $rootScope.dateFormat),
			onSelect: adjustDates,
			beforeShowDay: $scope.setClass
			// onChangeMonthYear: function(year, month, instance) {
			// 	$scope.updateCalendar(year, month);
			// }
		}, datePickerCommon);

		$scope.untilDateOptions = angular.extend({
			minDate: $filter('date')($rootScope.businessDate, $rootScope.dateFormat),
			onSelect: adjustDates,
			beforeShowDay: $scope.setClass
			// onChangeMonthYear: function(year, month, instance) {
			// 	$scope.updateCalendar(year, month);
			// }
		}, datePickerCommon);

		/**
		 * @param  {Date}
		 * @return {String}
		 */
		var getApiFormattedDate = function(date) {
			return ($filter('date')(new tzIndependentDate(date), $rootScope.dateFormatForAPI));
		};


		var showUpdateResultPopup = function(roomDetails) {

			$scope.closeDialog();
			$scope.completedData = {};
			$scope.completedData.serviceName = $scope.selectedServiceStatusName;
			$scope.completedData.assignedRoomsList = roomDetails;
			$scope.completedData.successFullyUpdated = parseInt($scope.totalRoomsSelectedForUpdate) - parseInt($scope.completedData.assignedRoomsList.length);
			$scope.completedData.notSuccessFullyUpdated = parseInt($scope.completedData.assignedRoomsList.length);
			_.each($scope.completedData.assignedRoomsList, function(item) {
  				item.is_add_to_update = true;
  				if (item.reservations.length > 1) {
  					item.reservationData = "Multiple Reservations";
  					item.isMultipleReservation = true;
  				} else if ((item.reservations.length === 1)) {
  					item.reservationData = "#" + item.reservations[0].confirm_no;
					  item.GuestName = (function() {
										 var guestName = "";

										 if (item.reservations[0].last_name && item.reservations[0].first_name) {
											guestName = item.reservations[0].last_name + ", " + item.reservations[0].first_name;  
										 } else if (item.reservations[0].last_name && !item.reservations[0].first_name) {
											guestName = item.reservations[0].last_name + ", ";
										 } else if (!item.reservations[0].last_name && item.reservations[0].first_name) {
											guestName = ', ' +  item.reservations[0].first_name;
										 }

										 return guestName;
					  				  })();
					  
  					item.isMultipleReservation = false;
  				}
			});

            ngDialog.open({
                template: '/assets/partials/housekeeping/popups/rvMultipleRoomSeviceStatusResultPopup.html',
                className: '',
                closeByDocument: true,
			    scope: $scope
            });

            setTimeout(function() {
            	$scope.refreshScroller('rooms-list-to-forcefully-update');
            }, 1500);


		};

		/**
		 * Service Stauts update action
		 * API Call - Post
		 */
		$scope.updateServiceStatus = function() {

			var updateServiceStatusSuccessCallBack = function(data) {

				$scope.$emit( 'hideLoader' );
				if (typeof data.assigned_rooms != 'undefined' && data.assigned_rooms.length > 0) {
					showUpdateResultPopup(data.assigned_rooms);
				}
				else {
					$timeout( $scope.closeHkStatusDialog, 100 );
					$scope.refreshData();
				}

			};

			var params = {

   				from_date: getApiFormattedDate($scope.updateServiceData.from_date),
				to_date: getApiFormattedDate($scope.updateServiceData.to_date),
				begin_time: "",
				end_time: "",
				reason_id: $scope.updateServiceData.reason_id,
				comment: $scope.updateServiceData.comments,
				room_service_status_id: $scope.updateServiceData.room_service_status_id,
				return_status_id: $scope.updateServiceData.return_status_id
			};

			if ($scope.shouldShowTimeSelector()) {
				params.begin_time = $scope.updateServiceData.begin_time;
				params.end_time = $scope.updateServiceData.end_time;
			}

			// To check All Rooms are Choosen or not
			params.room_id = [];
			if ($scope.multiRoomAction.allChosen) {
				params.room_id = $scope.allRoomIDs;
			}
			else {
				params.room_id = $scope.multiRoomAction.rooms;
			}
			// Used - to minus from this value on status update
			$scope.totalRoomsSelectedForUpdate = parseInt(params.room_id.length);
			$scope.selectedServiceStatusName = $scope.serviceStatusList[_.findIndex
							($scope.serviceStatusList, {id: params.room_service_status_id
})].description;
			$scope.invokeApi(RVHkRoomDetailsSrv.postRoomServiceStatus, params, updateServiceStatusSuccessCallBack);
		};


		/**
		 * when the user chooses for force fully put room oos/ooo from popup
		 * @return {[type]} [description]
		 */
		$scope.forcefullyPutRoomToOOSorOOO = function() {

			var successCallBack = function() {

				$scope.$emit( 'hideLoader' );
				$timeout( $scope.closeHkStatusDialog, 100 );
				$scope.refreshData();
			};

			var params = {

   				from_date: getApiFormattedDate($scope.updateServiceData.from_date),
				to_date: getApiFormattedDate($scope.updateServiceData.to_date),
				begin_time: $scope.updateServiceData.begin_time,
				end_time: $scope.updateServiceData.end_time,
				reason_id: $scope.updateServiceData.reason_id,
				comment: $scope.updateServiceData.comments,
				is_move_forcefully: true,
				room_service_status_id: $scope.updateServiceData.room_service_status_id,
				return_status_id: $scope.updateServiceData.return_status_id
			};

            var roomsToAdd = _.filter($scope.completedData.assignedRoomsList, function(room) {
                return room.is_add_to_update;
            });

			params.room_id = _.pluck(roomsToAdd, 'id');
			// as per CICO-32168 comments
			if (params.room_id.length > 0) {
				$scope.invokeApi(RVHkRoomDetailsSrv.postRoomServiceStatus, params, successCallBack);
			} else {
				$scope.closeForcefullyUpdatePopup();
			}
		};


		var initilizeServiceStatusData = function() {

			// $scope.updateServiceData.room_service_status_id = $scope.serviceStatusList[0].id;
			$scope.updateServiceData.from_date = $rootScope.businessDate;
			$scope.updateServiceData.to_date = $scope.updateServiceData.from_date;
			$scope.updateServiceData.begin_time = "";
			$scope.updateServiceData.end_time = "";
			$scope.updateServiceData.reason_id = "";
			$scope.updateServiceData.comments = "";
		};


		$scope.initilizeServiceStatus = function() {

			fetchMaintenanceReasons();
			fetchAllServiceStatus();
			initilizeServiceStatusData();
			$scope.refreshScroller('room-service-status-update');
		};


		/* ***** ***** ***** ***** ***** */


		$scope.resetMultiRoomAction = function() {

			// we are looping the 'keyMirror' rather than the
			// entire rooms array, nice!
			var i, _ithRoom;

			for (i in $scope.multiRoomAction.indexes) {
				if ( ! $scope.multiRoomAction.indexes.hasOwnProperty(i) ) {
				    continue;
				}

				_ithRoom = $scope.rooms[ $scope.multiRoomAction.indexes[i] ];

				// remove selection
				if ( !! _ithRoom ) {
					_ithRoom['selected'] = false;
				}
			}

			// F%$K that, cant update them all togther
			$scope.multiRoomAction.rooms       = [];
			$scope.multiRoomAction.indexes     = {};
			$scope.multiRoomAction.anyChosen   = false;
			$scope.multiRoomAction.allChosen   = false;
			$scope.multiRoomAction.hkStatusId  = '';
			$scope.isRoomStatusUpdate = true;
			$scope.isServiceStatusUpdate = false;
			$scope.updateServiceData = {};

		};

		$scope.closeHkStatusDialog = function() {
			$scope.resetMultiRoomAction();
			$scope.closeDialog();
		};

		$scope.closeForcefullyUpdatePopup = function() {
			$scope.closeHkStatusDialog();
			$scope.refreshData();
		};


		$scope.submitHkStatusChange = function() {
			var _payload,
				_resetParams,
				_callback,
				_onError;


            // CICO-28117 - Restrict the change of room status to inspected based on permission
            var hkStatusTo = _.find($scope.hkStatusList, function(hkStatus) {
                                    return hkStatus.id == $scope.multiRoomAction.hkStatusId;
                                });

            if (hkStatusTo.value === HK_STATUS.INSPECTED) {
                var changeRoomStatusToInspectedPermission = rvPermissionSrv.getPermissionValue ('CHANGE_ROOM_STATUS_TO_INSPECTED');

                if (!changeRoomStatusToInspectedPermission && $rootScope.isStandAlone) {
                    ngDialog.close();
                    $timeout(function() {
                        ngDialog.open({
                        template: '/assets/partials/housekeeping/popups/rvRoomStatusChangeRestrictAlert.html',
                        className: '',
                        closeByDocument: true,
                        scope: $scope
                    });
                    }, 50);
                   return;
                }
            }


			// no need to send anything
			if ( ! $scope.multiRoomAction.rooms.length ) {
				return;
			}

			_payload = {
				'room_ids': [],
		    	'hk_status_id': $scope.multiRoomAction.hkStatusId
			};

			if ( (1 == $scope.multiRoomAction.rooms.length == $scope.uiTotalCount) &&  $scope.multiRoomAction.allChosen ) {
				_payload['room_ids'].push( $scope.multiRoomAction.rooms[0] );
			} else if ( $scope.multiRoomAction.allChosen ) {
				_payload['room_ids'] = $scope.allRoomIDs;
			} else {
				_payload['room_ids'] = $scope.multiRoomAction.rooms;
			}

			_callback = function(data) {
				$scope.$emit( 'hideLoader' );

				// get the selected hk status obj
				var hkStatusObj = _.find($scope.hkStatusList, function(item) {
					return item.id === parseInt($scope.multiRoomAction.hkStatusId);
				});

				// we are looping the 'keyMirror' rather than the
				// entire rooms array, nice!
				var i, ithSelectedRoom;

				for (i in $scope.multiRoomAction.indexes) {
					if ( ! $scope.multiRoomAction.indexes.hasOwnProperty(i) ) {
					    continue;
					}

					ithSelectedRoom = $scope.rooms[ $scope.multiRoomAction.indexes[i] ];

					// 1. update room description
					ithSelectedRoom['description'] = hkStatusObj['description'];

					// 2. update 'hk_status' of this room
					ithSelectedRoom['hk_status']['description'] = hkStatusObj['description'];
					ithSelectedRoom['hk_status']['value']       = hkStatusObj['value'];

					// 3. now call the status class update
					RVHkRoomStatusSrv.setRoomStatusClass( ithSelectedRoom );
				}

				// need the delay, since close will also clear the values
				// in '$scope.multiRoomAction', but we need the value atleast
				// untill we update the UI with the changed values
				$timeout( $scope.closeHkStatusDialog, 100 );
			};

			_onError = function(response) {
				$scope.$emit('hideLoader');
				$scope.errorMessage = response;
			};

			$scope.invokeApi(RVHkRoomStatusSrv.putHkStatusChange, _payload, _callback, _onError);
		};


		/* ***** ***** ***** ***** ***** */


		function $_startPrinting() {
			$scope.$emit('hideLoader');
			/*
			*	======[ READY TO PRINT ]======
			*/

			// add the orientation
			$( 'head' ).append( "<style id='print-orientation'>@page { size: landscape; }</style>" );
			
			var onPrintCompletion = function() {
				// remove the orientation after similar delay
				$timeout(function() {
					// remove the orientation
					$( '#print-orientation' ).remove();

					// reset params to what it was before printing
					$_page = $scope.returnToPage;
					$_updateFilters('page', $_page);
					$_updateFilters('perPage', $window.innerWidth < 599 ? 25 : 50);

					$_callRoomsApi();
				}, 150);
			};

			/*
			*	======[ PRINTING!! JS EXECUTION IS PAUSED ]======
			*/
			$timeout(function() {
				if ( sntapp.cordovaLoaded ) {
					cordova.exec(onPrintCompletion, function() {
						onPrintCompletion();
					}, 'RVCardPlugin', 'printWebView', ['hkstatus', '0', '', 'L']);
				} else {
					$window.print();
					onPrintCompletion();
				}
			}, 100);
			
		}


		function $_fetchRoomListCallback(data, alreadyFetched) {
			if ( !!_.size(data) ) {
				$_roomList = angular.copy( data );
			} else {
				$_roomList = {};
			}
			$scope.topFilter.byWorkType = '';
			$scope.topFilter.byEmployee = '';

			// clear old results and update total counts
			$scope.rooms              = [];
			$scope.summary			  = $_roomList.summary;// CICO-23419
			$scope.netTotalCount = $_roomList.total_count;
			$scope.uiTotalCount  = !!$_roomList && !!$_roomList.rooms ? $_roomList.rooms.length : 0;
			$scope.allRoomIDs    = $_roomList.hasOwnProperty('all_room_ids') ? $_roomList['all_room_ids'] : [];

			if ( $_page === 1 ) {
				$scope.resultFrom = 1;
				$scope.resultUpto = $scope.netTotalCount < $_perPage ? $scope.netTotalCount : $_perPage;
				$scope.disablePrevBtn = true;
				$scope.disableNextBtn = $scope.netTotalCount > $_perPage ? false : true;
			} else {
				$scope.resultFrom = $_perPage * ($_page - 1) + 1;
				$scope.resultUpto = ($scope.resultFrom + $_perPage - 1) < $scope.netTotalCount ? ($scope.resultFrom + $_perPage - 1) : $scope.netTotalCount;
				$scope.disablePrevBtn = false;
				$scope.disableNextBtn = $scope.resultUpto === $scope.netTotalCount ? true : false;
			}

			// filter stuff
			$scope.showPickup = $_roomList.use_pickup || false;
			$scope.showInspected = $_roomList.use_inspected || false;
			$scope.showQueued = $_roomList.is_queue_rooms_on || false;

			// need to work extra for standalone PMS
			if ( $rootScope.isStandAlone ) {
				if ( !$scope.workTypes.length ) {
					$scope.workTypes = fetchPayload.workTypes;
				}
				if ( !$scope.employees.length ) {
					$scope.employees = employees;
				}

				var _setUpWorkTypeEmployees = function() {
					$_defaultWorkType = $scope.currentFilters.filterByWorkType;
					$_defaultEmp      = $scope.currentFilters.filterByEmployeeName;

					// if already fetched assigned rooms, no need to call api again CICO-32781
					if (alreadyFetched) {

						$scope.hasActiveWorkSheet = $scope.employees && $scope.employees.room_tasks && $scope.employees.room_tasks.length || false;

						$scope.topFilter.byWorkType = $_defaultWorkType;
						$scope.topFilter.byEmployee = $_defaultEmp;
						// need delay
						$timeout(function() {
							$_postProcessRooms();
						}, 10);
					} else {
						// time to decide if this is an employee
						// who has an active work sheets
						$_checkHasActiveWorkSheet(alreadyFetched);
					}
				};

				if ( (!!$scope.workTypes && $scope.workTypes.length) && (!!$scope.employees && $scope.employees.length) ) {
					_setUpWorkTypeEmployees();
				} else {
					$scope.invokeApi(RVHkRoomStatusSrv.fetchWorkTypes, {}, function(data) {
                        var params = {
                            per_page: 9999
                        };

                        $scope.workTypes = data;
						$scope.invokeApi(RVHkRoomStatusSrv.fetchHKEmps, params, function(data) {
							$scope.employees = data;
							_setUpWorkTypeEmployees();
						});
					});
				}
			}
			// connected PMS, just process the roomList
			else {
				$timeout(function() {
					$_postProcessRooms();
				}, 10);
			}

			$_updateFilters('page', $_page);
			$timeout(function() {
				$scope.$broadcast('updatePagination', 'HK_SEARCH');
				$scope.$broadcast('updatePageNo', $_page);
			}, 700);
			
		}


		/* ***** ***** ***** ***** ***** */


		function $_checkHasActiveWorkSheet(alreadyFetched) {
			if ($scope.currentFilters.filterByEmployeeName) {
				$_defaultEmp = $scope.currentFilters.filterByEmployeeName;
			}
			var _params = {
					'date': $rootScope.businessDate,
					'employee_ids': [$_defaultEmp || $rootScope.userId] // Chances are that the $_defaultEmp may read as null while coming back to page from other pages
				},
				_callback = function(data) {
					var employee = data.employees.length && data.employees[0] || null;

					$scope.hasActiveWorkSheet = employee && employee.room_tasks && employee.room_tasks.length || false;

					$scope.topFilter.byWorkType = $_defaultWorkType;
					$scope.topFilter.byEmployee = $_defaultEmp;

					// need delay, just need it
					$timeout(function() {
						$_postProcessRooms();
					}, 10);
				},
				// it will fail if returning from admin to room status
				// directly, since the flags in $rootScope may not be ready
				// no worries since a person with active worksheet may not have access to admin screens
				_failed = function() {
					$scope.topFilter.byWorkType = '';
					$scope.topFilter.byEmployee = '';

					$scope.hasActiveWorkSheet = false;
					$scope.currentView = 'rooms';

					$timeout(function() {
						$_postProcessRooms();
					}, 10);
				};

			$scope.invokeApi(RVHkRoomStatusSrv.fetchWorkAssignments, _params, _callback, _failed);
		}

		/* ***** ***** ***** ***** ***** */


		function $_postProcessRooms() {
			var rooms = $_roomList.rooms,
				i     = 0,
				j     = 0;

			/** removed code for rendering in two phase */

			for ( i = 0, j = rooms.length; i < j; i++ ) {
				$scope.rooms.push( rooms[i] );
			}

			$_roomList = {};
			$_refreshScroll( localStorage.getItem('roomListScrollTopPos') );
			$scope.$emit( 'hideLoader' );
		}


		/* ***** ***** ***** ***** ***** */


		function $_refreshScroll(toPos) {
			if ( $_roomsEl.scrollTop === toPos ) {
				return;
			}

			if ( isNaN(parseInt(toPos)) ) {
				var toPos = 0;
			} else {
				localStorage.removeItem( 'roomListScrollTopPos' );
			}

			// must delay untill DOM is ready to jump
			$timeout(function() {
				$_roomsEl.scrollTop = toPos;
			}, 10);
		}


		/* ***** ***** ***** ***** ***** */


		function $_callRoomsApi(page) {
			var clickedPage = page || 1;

			$_page = clickedPage;

			$_updateFilters('page', clickedPage);

			$scope.hasActiveWorkSheet = false;
			$scope.rooms              = [];

			// reset any multi room action related data
			$scope.resetMultiRoomAction();

			$scope.invokeApi(RVHkRoomStatusSrv.fetchRoomListPost, {}, $_fetchRoomListCallback);
		}

		function $_updateFilters (key, value) {
			$scope.currentFilters[key]       = value;
			RVHkRoomStatusSrv.currentFilters = angular.copy( $scope.currentFilters );
		}

		function $_resetPageCounts () {
			$_page = $_defaultPage;
			$_updateFilters('page', $_defaultPage);
		}


		/* ***** ***** ***** ***** ***** */


		var $_pullUpDownModule = function() {

			// caching DOM nodes invloved
			var $rooms        = document.getElementById( 'rooms' ),
				$roomsList    = $rooms.children[0],
				$refresh      = document.getElementById( 'pull-refresh-page' ),
				$refreshArrow = document.getElementById( 'refresh-icon' ),
				$refreshTxt   = document.getElementById( 'refresh-text' ),
				$load         = document.getElementById( 'pull-load-next' ),
				$loadArrow    = document.getElementById( 'load-icon' ),
				$loadTxt      = document.getElementById( 'load-text' );

			// flags and variables necessary
			var touching       = false,
				pulling        = false,
				startY         = 0,
				nowY           = 0,
				trigger        = 110,
				scrollBarOnTop = 0,
				scrollBarOnBot = $roomsList.clientHeight - $rooms.clientHeight,
				abs            = Math.abs,
				ngScope        = $scope;

			// translate const.
			var PULL_REFRESH      = $filter( 'translate' )( 'PULL_REFRESH' ),
				RELEASE_REFRESH   = $filter( 'translate' )( 'RELEASE_REFRESH' ),
				PULL_LOAD_NEXT    = $filter( 'translate' )( 'PULL_LOAD_NEXT' ),
				RELEASE_LOAD_NEXT = $filter( 'translate' )( 'RELEASE_LOAD_NEXT' ),
				PULL_LOAD_PREV    = $filter( 'translate' )( 'PULL_LOAD_PREV' ),
				RELEASE_LOAD_PREV = $filter( 'translate' )( 'RELEASE_LOAD_PREV' );

			// methods to modify the $refreshText and rotate $refreshArrow
			var notifyPullDownAction = function(diff) {
				if ( !diff ) {
					$refreshArrow.className = '';
					$refreshTxt.innerHTML = ngScope.disablePrevBtn ? PULL_REFRESH : PULL_LOAD_PREV;
					return;
				}

				if ( diff > trigger - 40 ) {
					$refreshArrow.className = 'rotate';
				} else {
					$refreshArrow.className = '';
				}

				if ( diff > trigger - 30 ) {
					$refreshTxt.innerHTML = ngScope.disablePrevBtn ? RELEASE_REFRESH : RELEASE_LOAD_PREV;
				} else {
					$refreshTxt.innerHTML = ngScope.disablePrevBtn ? PULL_REFRESH : PULL_LOAD_PREV;
				}
			};

			var notifyPullUpAction = function(diff) {
				if ( !diff ) {
					$loadArrow.className = '';
					$loadTxt.innerHTML = PULL_LOAD_NEXT;
					return;
				}

				if ( abs(diff) > trigger - 40 ) {
					$loadArrow.className = 'rotate';
				} else {
					$loadArrow.className = '';
				}

				if ( abs(diff) > trigger - 30 ) {
					$loadTxt.innerHTML = RELEASE_LOAD_NEXT;
				} else {
					$loadTxt.innerHTML = PULL_LOAD_NEXT;
				}
			};

			var callPulldownAction = function() {
				if ( ngScope.disablePrevBtn ) {
					$_resetPageCounts();
					$_callRoomsApi();
				} else {
					ngScope.loadPrevPage();
				}
			};

			var callPullUpAction = function() {
				ngScope.loadNextPage();
			};

			var genTranslate = function(x, y, z) {
				var x = (x || 0) + 'px',
					y = (y || 0) + 'px',
					z = (z || 0) + 'px';

				return 'translate3d(' + x + ', ' + y + ', ' + z + ')';
			};

			var hideNremove = function() {

			};

			// set of excutions to be executed when
			// the user is swiping across the screen
			var touchMoveHandler = function(e) {
				e.stopPropagation();

				var touch         = e.touches ? e.touches[0] : e,
					diff          = 0,
					translateZero = genTranslate(),
					translateDiff = '';

				var commonEx = function() {
					e.preventDefault();

					pulling       = true;
					diff          = (nowY - startY);
					translateDiff = genTranslate(0, diff, 0);

					$rooms.style.WebkitTransition = '';
					$rooms.style.webkitTransform  = translateDiff;
				};

				var resetIndicators = function() {
					$rooms.style.webkitTransform   = translateZero;
					$refresh.style.webkitTransform = translateZero;
					$load.style.webkitTransform    = translateZero;

					$timeout(function() {
						$refresh.classList.remove('show');
						$load.classList.remove('show');
					}, 320);
				};

				// if not touching or we are not on top or bottom of scroll area
				if (!touching && this.scrollTop !== scrollBarOnTop && this.scrollTop !== scrollBarOnBot) {
					return;
				}

				nowY = touch.y || touch.pageY;

				// if: pull down on page start, else: pull up on page end
				if ( nowY > startY && this.scrollTop === scrollBarOnTop ) {
					commonEx();
					$refresh.classList.add('show');

					$refresh.style.WebkitTransition = '';
					$refresh.style.webkitTransform  = translateDiff;

					notifyPullDownAction(diff);
				} else if ( !ngScope.disableNextBtn && nowY < startY && parseInt(this.scrollTop + .5) === parseInt(scrollBarOnBot)) {
					commonEx();
					$load.classList.add('show');

					$load.style.WebkitTransition = '';
					$load.style.webkitTransform  = translateDiff;

					notifyPullUpAction(diff);
				} else {
					pulling = false;
					return;
				}

				// sometimes the user may manually scrol to it original state
				if ( nowY - startY === 0 ) {
					resetIndicators();
				}
			};

			// set of excutions to be executed when
			// the user stops touching the screen
			// TODO: need to bind very similar for 'touchcancel' event
			var touchEndHandler = function(e) {
				var touch         = e.touches ? e.touches[0] : e,
					diff          = 0,
					addTransition = '-webkit-transform 0.3s',
					translateZero = genTranslate(0, 0, 0);

				var commonEx = function() {
					if ( pulling ) {
						e.preventDefault();
					}

					diff     = (nowY - startY);
					touching = false;
					pulling  = false;

					$rooms.style.WebkitTransition = addTransition;
					$rooms.style.webkitTransform  = translateZero;

					$rooms.removeEventListener('touchmove', touchMoveHandler);
				};

				var resetIndicators = function() {
					$rooms.style.WebkitTransition = addTransition;
					$rooms.style.webkitTransform  = translateZero;

					$refresh.style.WebkitTransition = addTransition;
					$refresh.style.webkitTransform  = translateZero;

					$load.style.WebkitTransition = addTransition;
					$load.style.webkitTransform  = translateZero;

					$rooms.removeEventListener('touchmove', touchMoveHandler);

					$timeout(function() {
						$refresh.classList.remove('show');
						$load.classList.remove('show');
						if ( abs(diff) > trigger ) {
							$_refreshScroll();
						}
					}, 320);
				};

				nowY = touch ? (touch.y || touch.pageY) : nowY;

				// if: pull down on page start, else: pull up on page end
				if ( nowY > startY && this.scrollTop === scrollBarOnTop ) {
					commonEx();

					if ( abs(diff) > trigger ) {
						callPulldownAction();
					}

					notifyPullDownAction();
					resetIndicators();
				} else if ( !ngScope.disableNextBtn && nowY < startY && parseInt(this.scrollTop + .5) === parseInt(scrollBarOnBot)) {
					commonEx();

					if ( abs(diff) > trigger ) {
						callPullUpAction();
					}

					notifyPullUpAction();
					resetIndicators();
				} else {
					resetIndicators();
					return;
				}
			};

			// set of excutions to be executed when
			// the user touch the screen
			var touchStartHandler = function(e) {
				var touch = e.touches ? e.touches[0] : e;

				// a minor hack since we have a rooms injection throttle
				scrollBarOnBot = $roomsList.clientHeight - $rooms.clientHeight;

				touching = true;
				pulling = false;
				startY = touch.y || touch.pageY;

				$rooms.style.WebkitTransition = '';

				// if: pull down on page start, else: pull up on page end
				if ( this.scrollTop === scrollBarOnTop ) {
					$refresh.style.WebkitTransition = '';
					$refresh.classList.add('show');
					/** */
					$load.style.WebkitTransition = '';
					$load.classList.remove('show');
				} else if ( this.scrollTop === scrollBarOnBot ) {
					$load.style.WebkitTransition = '';
					$load.classList.add('show');
					/** */
					$refresh.style.WebkitTransition = '';
					$refresh.classList.remove('show');
				}

				// only bind 'touchmove' when required
				$rooms.addEventListener('touchmove', touchMoveHandler, false);
			};

			// bind the 'touchstart' handler
			$rooms.addEventListener('touchstart', touchStartHandler, false);

			// bind the 'touchstart' handler
			$rooms.addEventListener('touchend', touchEndHandler, false);

			// bind the 'touchstart' handler
			$rooms.addEventListener('touchcancel', touchEndHandler, false);

			// remove the DOM binds when this scope is distroyed
			ngScope.$on('$destroy', function() {
				!!$rooms.length && $rooms.removeEventListener('touchstart', touchStartHandler);
				!!$rooms.length && $rooms.removeEventListener('touchend', touchEndHandler);
				!!$rooms.length && $rooms.removeEventListener('touchcancel', touchEndHandler);
			});
		};

		// initiate $_pullUpDownModule
		// dont move these codes outside this controller
		// DOM node will be reported missing
		if ( $window.innerWidth < 599 ) {
			$_pullUpDownModule();
		}


		/* ***** ***** ***** ***** ***** */


		// stop browser bounce while swiping on rooms element
		angular.element( $_roomsEl )
			.on('touchmove', function(e) {
				e.stopPropagation();
			});

		// stop browser bounce while swiping on filter-options element
		angular.element( $_filterRoomsEl )
			.on('touchmove', function(e) {
				// e.stopPropagation(); - CICO-13434 Changed to iscroll from native scroll.
			});

		// There are a lot of bindings that need to cleared
		$scope.$on('$destroy', function() {
			angular.element( $_roomsEl ).off('ontouchmove');
			angular.element( $_filterRoomsEl ).off('ontouchmove');
		});

		$scope.getWidthForSummary = function() {
			var summaryWidth = 0,
				tasksLength = $scope.summary.work_types.length;

			summaryWidth = parseInt(parseInt(tasksLength + 1) * 160 + 40);
			return summaryWidth;
		};

		var scrollerOptionsForSummary = {scrollX: true, scrollY: false, click: true, preventDefault: true, mouseWheel: false};

    	$scope.setScroller ('tasks-summary-scroller', scrollerOptionsForSummary);

        // Format the given date based on the hotel date format
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

		/**
		 * Should show arriving guest count in the room listing screen
		 */
		$scope.shouldShowArrivingGuestCount = function(room) {
			return $rootScope.isStandAlone && room.guest_details && (room.reservation_status === 'RESERVED' || (room.reservation_status === 'CHECKEDIN' && !room.is_stayover));
		};

		/**
		 * Should show arriving guest count in the room listing screen
		 */
		$scope.shouldShowStayoverGuestCount = function(room) {
			return $rootScope.isStandAlone && room.guest_details && room.reservation_status === 'CHECKEDIN' && room.is_stayover;
		};

		/**
		 * Filter validation for OO and OOO, Similarly for OS and OOS 
		 * I.e If one is selected and the other is ticked the previously selected tickbox should be automatically unticked.
		 */
		$scope.checkOooAndOosFilterValidation = function(filterName) {
			if (filterName === 'OO' && !$scope.currentFilters.out_of_order) {
				$scope.currentFilters.exclude_out_of_order = false;
			} else if (filterName === 'OOO' && !$scope.currentFilters.exclude_out_of_order) {
				$scope.currentFilters.out_of_order = false;
			} else if (filterName === 'OS' && !$scope.currentFilters.out_of_service) {
				$scope.currentFilters.exclude_out_of_service = false;
			} else if (filterName === 'OOS' && !$scope.currentFilters.exclude_out_of_service) {
				$scope.currentFilters.out_of_service = false;
			}
		};

		var languageChangeListner = $rootScope.$on('LANGUAGE_CHANGED', function() {
			$timeout(function() {
				var title = $rootScope.isMaintenanceStaff ? 'MY_WORKSHEET' : 'ROOM_STATUS';

				$rootScope.setPrevState.title = $filter('translate')('DASHBOARD');
				title = $filter( 'translate')(title);
				// set title in header
				$scope.setTitle(title);
				$scope.heading = title;
			}, 100);
		});

		$scope.$on('$destroy', languageChangeListner);

		/**
		 * Handle the click of suite/connected room icon
		 * @param {Object} event the click event obj
		 * @param {Object} room the room object
		 * @return {void}
		 */
		$scope.clickSuiteConnectedRoomsIcon = function (event, room, type) {
			event.preventDefault();
			event.stopPropagation();
			
			if ($rootScope.lastShownRoomIdForIndicatorPopup !== room.id) {
				var data = {
					isSuite: room.is_suite,
					connectingRooms: room.connecting_room_no,
					clickedRoomId: room.id,
					indicatorType: type
				};
                
				$rootScope.lastShownRoomIdForIndicatorPopup = room.id;

				$scope.$emit('SHOW_ROOM_INDICATOR_POPUP', {
					event: event,
					payload: data
				});
				
			} else {
				$scope.$emit('HIDE_ROOM_INDICATOR_POPUP');
			}
		};
			
		// Should disable service update button
		$scope.shouldDisableServiceUpdateBtn = function() {
			return !$scope.hasPermissionToPutRoomOOSOrOOO;
		};
	}
]);
