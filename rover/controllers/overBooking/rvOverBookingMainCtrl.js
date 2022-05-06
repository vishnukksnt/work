'use strict';

angular.module('sntRover').controller('RvOverBookingMainCtrl', ['$scope', 'rvOverBookingSrv', '$rootScope', 'ngDialog', '$filter', '$timeout', 'completeRoomTypeListData', 'overBookingGridData', function ($scope, rvOverBookingSrv, $rootScope, ngDialog, $filter, $timeout, completeRoomTypeListData, overBookingGridData) {

	BaseCtrl.call(this, $scope);
	var that = this;

	var LEFT_PANE_SCROLL = 'overBookingLeftSectionScroll',
	    RIGHT_PANE_SCROLL = 'overBookingGridScroll',
	    DATE_PANE_SCROLL = 'overBookingDateScroll',
	    DELAY_1000 = 1000,
	    DATE_SHIFT_LIMIT = 13;

	// Set scrollers for left and right pane
	var setScroller = function setScroller() {
		$scope.setScroller(LEFT_PANE_SCROLL, {
			'preventDefault': false,
			'probeType': 3
		});

		$scope.setScroller(RIGHT_PANE_SCROLL, {
			'preventDefault': false,
			'probeType': 3,
			'scrollX': true
		});

		$scope.setScroller(DATE_PANE_SCROLL, {
			'preventDefault': false,
			'probeType': 3,
			'scrollX': true,
			'scrollY': false
		});
	};

	// Set up scroll listeners for date, left and right pane
	var setupScrollListner = function setupScrollListner() {
		$scope.myScroll[LEFT_PANE_SCROLL].on('scroll', function () {
			$scope.myScroll[RIGHT_PANE_SCROLL].scrollTo(0, this.y);
		});

		$scope.myScroll[RIGHT_PANE_SCROLL].on('scroll', function () {
			$scope.myScroll[LEFT_PANE_SCROLL].scrollTo(0, this.y);
		});

		$scope.myScroll[DATE_PANE_SCROLL].on('scroll', function () {
			$scope.myScroll[RIGHT_PANE_SCROLL].scrollTo(this.x, 0);
		});

		$scope.myScroll[RIGHT_PANE_SCROLL].on('scroll', function () {
			$scope.myScroll[DATE_PANE_SCROLL].scrollTo(this.x, 0);
		});
	};

	// Check whether scroll is ready
	var isScrollReady = function isScrollReady() {
		if (!!$scope.myScroll && !!$scope.myScroll.hasOwnProperty(LEFT_PANE_SCROLL) && !!$scope.myScroll.hasOwnProperty(RIGHT_PANE_SCROLL) && !!$scope.myScroll.hasOwnProperty(DATE_PANE_SCROLL)) {
			setupScrollListner();
		} else {
			$timeout(isScrollReady, DELAY_1000);
		}
	};

	// Refresh scrollers for the left and right pane
	var refreshScrollers = function refreshScrollers() {
		if ($scope.myScroll.hasOwnProperty(LEFT_PANE_SCROLL)) {
			$scope.refreshScroller(LEFT_PANE_SCROLL);
		}

		if ($scope.myScroll.hasOwnProperty(RIGHT_PANE_SCROLL)) {
			$scope.refreshScroller(RIGHT_PANE_SCROLL);
		}

		if ($scope.myScroll.hasOwnProperty(DATE_PANE_SCROLL)) {
			$scope.refreshScroller(DATE_PANE_SCROLL);
		}
	};

	// Initialization..
	that.init = function () {

		$scope.heading = $filter('translate')('MENU_SELL_LIMITS');
		$scope.setTitle($filter('translate')('MENU_SELL_LIMITS'));
		$scope.$emit('updateRoverLeftMenu', 'overbooking');

		setScroller();
		isScrollReady();

		$scope.overBookingObj = {
			roomTypeList: dclone(completeRoomTypeListData.isCheckedTrue, []), // Used for ROOM TYPES filter in header.
			completeRoomTypeListData: dclone(completeRoomTypeListData.isCheckedFalse, []), // Used for APPLY TO ROOM TYPES filter in Add Over Booking popup.
			overBookingGridData: overBookingGridData,
			startDate: moment(tzIndependentDate($rootScope.businessDate)).format($rootScope.momentFormatForAPI),
			endDate: moment(tzIndependentDate($rootScope.businessDate)).add(DATE_SHIFT_LIMIT, 'd').format($rootScope.momentFormatForAPI),
			isShowRoomsLeftToSell: true,
			isShowRoomTypeFilter: false,
			editData: {}
		};
	};

	/*
  *	Generating List of Selected Room Type Ids, used for calling fetchGridData API.
  *  @return { Array }
  */
	that.getSelectedRoomTypeIdList = function () {
		var selectedRommTypeIdList = [];

		_.map($scope.overBookingObj.roomTypeList, function (value) {
			if (value.isChecked) {
				selectedRommTypeIdList.push(value.id);
			}
		});
		return selectedRommTypeIdList;
	};

	/*
  *  Common Handler method for Genearting the RoomType - Date grid data.
  *	Responce from API is modified in Service Layer - Ref : rvOverBookingSrv.js
  */
	var fetchGridData = function fetchGridData() {

		var onFetchGridDataSuccess = function onFetchGridDataSuccess(data) {
			$scope.overBookingObj.overBookingGridData = data;
			$timeout(function () {
				refreshScrollers();
			}, DELAY_1000);
		},
		    onFetchGridDataFailure = function onFetchGridDataFailure(errorMessage) {
			$scope.$errorMessage = errorMessage;
		},
		    dataToSend = {
			'start_date': moment(tzIndependentDate($scope.overBookingObj.startDate)).format($rootScope.momentFormatForAPI),
			'end_date': moment(tzIndependentDate($scope.overBookingObj.endDate)).format($rootScope.momentFormatForAPI),
			'show_rooms_left_to_sell': $scope.overBookingObj.isShowRoomsLeftToSell,
			'room_type_ids': that.getSelectedRoomTypeIdList()
		};

		$scope.callAPI(rvOverBookingSrv.fetchOverBookingGridData, {
			successCallBack: onFetchGridDataSuccess,
			failureCallBack: onFetchGridDataFailure,
			params: dataToSend
		});
	};

	// Catching the REFRESH_OVERBOOKING_GRID event from child controllers..
	var listenerOverbooking = $scope.$on('REFRESH_OVERBOOKING_GRID', function () {
		fetchGridData();
	});

	// Catching the REFRESH_OVERBOOKING_GRID event from child controllers..
	var listenerRefreshScroll = $scope.$on('REFRESH_SCROLLBARS', function () {
		$timeout(function () {
			refreshScrollers();
		}, DELAY_1000);
	});

	// Handle Edit OverBooking cell click - ROOM_TYPE
	$scope.clickedEditOverBookingCell = function (type, indexOne, indexTwo) {
		$scope.overBookingObj.editData.type = type;
		var gridData = $scope.overBookingObj.overBookingGridData;

		if (type === 'HOUSE') {
			$scope.overBookingObj.editData.date = gridData.houseSellLimits[indexOne].date;
			$scope.overBookingObj.editData.limitValue = gridData.houseSellLimits[indexOne].sell_limit;
		} else if (type === 'ROOM_TYPE') {
			$scope.overBookingObj.editData.date = gridData.roomTypeSellLimits[indexOne].overbooking_details[indexTwo].date;
			$scope.overBookingObj.editData.roomTypeId = gridData.roomTypeSellLimits[indexOne].id;
			$scope.overBookingObj.editData.roomTypeName = gridData.roomTypeSellLimits[indexOne].name;
			$scope.overBookingObj.editData.limitValue = gridData.roomTypeSellLimits[indexOne].overbooking_details[indexTwo].sell_limit;
		}
		ngDialog.open({
			template: '/assets/partials/overBooking/rvEditOverBookingPopup.html',
			controller: 'rvEditOverBookingPopupCtrl',
			className: '',
			scope: $scope,
			closeByDocument: false
		});
	};

	// Cleaning listener.
	$scope.$on('$destroy', listenerOverbooking);
	$scope.$on('$destroy', listenerRefreshScroll);

	that.init();
}]);