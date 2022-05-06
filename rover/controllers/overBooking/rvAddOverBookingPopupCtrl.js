'use strict';

angular.module('sntRover').controller('rvAddOverBookingPopupCtrl', ['$scope', '$rootScope', 'ngDialog', 'rvOverBookingSrv', function ($scope, $rootScope, ngDialog, rvOverBookingSrv) {

	var that = this;

	BaseCtrl.call(this, $scope);

	// Initialization
	that.init = function () {
		$scope.addOverBookingObj = {
			fromDate: moment(tzIndependentDate($rootScope.businessDate)).format($rootScope.momentFormatForAPI),
			toDate: moment(tzIndependentDate($rootScope.businessDate)).format($rootScope.momentFormatForAPI),
			weekDayList: [{ name: 'MON', id: 1, isChecked: true }, { name: 'TUE', id: 2, isChecked: true }, { name: 'WED', id: 3, isChecked: true }, { name: 'THU', id: 4, isChecked: true }, { name: 'FRI', id: 5, isChecked: true }, { name: 'SAT', id: 6, isChecked: true }, { name: 'SUN', id: 0, isChecked: true }],
			applyForHouse: true,
			applyForRoomTypes: false,
			limitType: 'RMS', // Value will be 'RMS' or 'PERCENT' ( future story )
			roomTypeList: dclone($scope.overBookingObj.completeRoomTypeListData, []),
			limitValue: ''
		};
		$scope.setScroller('roomTypeFilterList');
	}, that.datePickerDialogId = '';

	// To popup contract start date
	$scope.showDatePicker = function (type) {
		$scope.addOverBookingObj.type = type;
		that.datePickerDialogId = ngDialog.open({
			template: '/assets/partials/overBooking/rvOverBookingDatePicker.html',
			controller: 'rvAddOverBookingDatePickerCtrl',
			className: '',
			scope: $scope,
			closeByDocument: true
		});
	};

	/* 
  *	Catching event from date picker controller while date is changed.
  *	@param { object } - js event.
  *	@param { string } - 'FROM' or 'TO'.
  *	@param { string } - Selected date value.
  */
	var listenerDateChanged = $scope.$on('DATE_CHANGED', function (event, type, date) {

		var formattedDate = moment(tzIndependentDate(date)).format($rootScope.momentFormatForAPI);

		if (type === 'FROM') {
			$scope.addOverBookingObj.fromDate = formattedDate;
			$scope.addOverBookingObj.toDate = formattedDate;
		} else if (type === 'TO') {
			$scope.addOverBookingObj.toDate = formattedDate;
			if (new tzIndependentDate(date) < new tzIndependentDate($scope.addOverBookingObj.fromDate)) {
				$scope.addOverBookingObj.fromDate = formattedDate;
			}
		}
		ngDialog.close(that.datePickerDialogId.id);
	});

	// Apply for house checkbox click action.
	$scope.clickedApplyForHouse = function () {
		$scope.addOverBookingObj.applyForHouse = !$scope.addOverBookingObj.applyForHouse;
	};
	// Reset room type list
	var resetRoomTypesList = function resetRoomTypesList() {
		var roomTypeList = $scope.addOverBookingObj.roomTypeList;

		_.each(roomTypeList, function (obj) {
			obj.isChecked = $scope.addOverBookingObj.applyForRoomTypes;
		});
	};

	// Apply for room types checkbox click action.
	$scope.clickedApplyForRoomTypes = function () {
		$scope.addOverBookingObj.applyForRoomTypes = !$scope.addOverBookingObj.applyForRoomTypes;
		resetRoomTypesList();
		$scope.refreshScroller('roomTypeFilterList');
	};

	// Handle click action on each checkbox inside filter.
	$scope.clickedRoomTypeCheckbox = function (index) {
		var item = $scope.addOverBookingObj.roomTypeList[index];

		item.isChecked = !item.isChecked;
	};
	// Handle click action on each checkbox in week days.
	$scope.clickedWeekDay = function (index) {
		var item = $scope.addOverBookingObj.weekDayList[index];

		item.isChecked = !item.isChecked;
	};
	/*
 *	Generating List of Selected Ids from inputList.
 *  @input [Array] conatains 'id' as one key.
 *  @return { Array }
 */
	that.getSelectedIdList = function (inputList) {
		var selectedIdList = [];

		_.map(inputList, function (value) {
			if (value.isChecked) {
				selectedIdList.push(value.id);
			}
		});
		return selectedIdList;
	};

	/*
  *  ADD OVER BOOKING API CALL
  *	Responce from API is modified in Service Layer - Ref : rvOverBookingSrv.js
  */
	$scope.addOverBookingApiCall = function () {

		var onAddOverBookingApiSuccess = function onAddOverBookingApiSuccess() {
			$scope.errorMessage = '';
			$scope.$emit('REFRESH_OVERBOOKING_GRID');
			$scope.closeDialog();
		},
		    onAddOverBookingApiFailure = function onAddOverBookingApiFailure(errorMessage) {
			$scope.errorMessage = errorMessage;
		},
		    weekDaysSelected = that.getSelectedIdList($scope.addOverBookingObj.weekDayList),
		    dataToSend = {
			'start_date': moment(tzIndependentDate($scope.addOverBookingObj.fromDate)).format($rootScope.momentFormatForAPI),
			'end_date': moment(tzIndependentDate($scope.addOverBookingObj.toDate)).format($rootScope.momentFormatForAPI),
			'house_overbooking': $scope.addOverBookingObj.applyForHouse,
			'wdays_selected': weekDaysSelected,
			'room_type_ids': that.getSelectedIdList($scope.addOverBookingObj.roomTypeList),
			'limit': $scope.addOverBookingObj.limitValue
		};

		if (weekDaysSelected.length === 0) {
			$scope.errorMessage = ['Please select days to apply sell limit'];
		} else if (!$scope.addOverBookingObj.applyForHouse && !$scope.addOverBookingObj.applyForRoomTypes) {
			$scope.errorMessage = ['Please select House or Room Type(s)'];
		} else {
			$scope.callAPI(rvOverBookingSrv.addOrEditOverBooking, {
				successCallBack: onAddOverBookingApiSuccess,
				failureCallBack: onAddOverBookingApiFailure,
				params: dataToSend
			});
		}
	};
	// close dialog
	$scope.closeDialog = function () {
		ngDialog.close();
	};

	that.init();
	// Cleaning listener.
	$scope.$on('$destroy', listenerDateChanged);
}]);