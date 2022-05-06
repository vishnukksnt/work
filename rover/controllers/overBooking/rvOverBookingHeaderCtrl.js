'use strict';

angular.module('sntRover').controller('RvOverBookingHeaderCtrl', ['$scope', '$rootScope', 'ngDialog', '$timeout', function ($scope, $rootScope, ngDialog, $timeout) {

	BaseCtrl.call(this, $scope);
	$scope.setScroller('roomTypeFilterList');
	$scope.businessDate = $rootScope.businessDate;
	var DATE_SHIFT_LIMIT = 13;

	// To popup contract start date
	$scope.showDatePicker = function () {
		ngDialog.open({
			template: '/assets/partials/overBooking/rvOverBookingDatePicker.html',
			controller: 'rvOverBookingDatePickerCtrl',
			className: '',
			scope: $scope,
			closeByDocument: true
		});
	};
	// Catching event from date picker controller while date is changed.
	var listenerDateChanged = $scope.$on('DATE_CHANGED', function () {
		var currentStartDate = $scope.overBookingObj.startDate;

		$scope.overBookingObj.endDate = moment(tzIndependentDate(currentStartDate)).add(DATE_SHIFT_LIMIT, 'd').format($rootScope.momentFormatForAPI);
		$scope.$emit('REFRESH_OVERBOOKING_GRID');
	});

	// Handle SHOW ROOMS LEFT TO SELL button click action
	$scope.clickedShowRoomsLeftTosell = function () {
		$scope.$emit('REFRESH_SCROLLBARS');
		$timeout(function () {
			$scope.overBookingObj.isShowRoomsLeftToSell = !$scope.overBookingObj.isShowRoomsLeftToSell;
			$scope.$emit('REFRESH_OVERBOOKING_GRID');
		}, 300);
	};
	// Handle PREV DATE button click action
	$scope.clickedPrevDateButton = function () {
		var currentStartDate = $scope.overBookingObj.startDate;

		$scope.overBookingObj.startDate = moment(tzIndependentDate(currentStartDate)).add(-1 * DATE_SHIFT_LIMIT, 'd').format($rootScope.momentFormatForAPI);
		$scope.overBookingObj.endDate = moment(tzIndependentDate(currentStartDate)).format($rootScope.momentFormatForAPI);
		$scope.$emit('REFRESH_OVERBOOKING_GRID');
	};
	// Handle NEXT DATE button click action
	$scope.clickedNextDateButton = function () {
		var currentEndDate = $scope.overBookingObj.endDate;

		$scope.overBookingObj.startDate = moment(tzIndependentDate(currentEndDate)).format($rootScope.momentFormatForAPI);
		$scope.overBookingObj.endDate = moment(tzIndependentDate(currentEndDate)).add(DATE_SHIFT_LIMIT, 'd').format($rootScope.momentFormatForAPI);
		$scope.$emit('REFRESH_OVERBOOKING_GRID');
	};
	// Handle ROOM TYPE FILTER toggle.
	$scope.toggleRoomTypeFilter = function () {
		$scope.overBookingObj.isShowRoomTypeFilter = !$scope.overBookingObj.isShowRoomTypeFilter;
		$scope.refreshScroller('roomTypeFilterList');
	};
	// Handle click action on each checkbox inside filter.
	$scope.clickedRoomTypeCheckbox = function (index) {
		var item = $scope.overBookingObj.roomTypeList[index];

		item.isChecked = !item.isChecked;
		$scope.$emit('REFRESH_OVERBOOKING_GRID');
	};
	// Logic for Disable PREV DATE button.
	$scope.disablePrevDateButton = function () {
		var dateLimit = moment(tzIndependentDate($rootScope.businessDate)).add(DATE_SHIFT_LIMIT, 'd'),
		    currentDate = moment(tzIndependentDate($scope.overBookingObj.startDate)),
		    disablePrevDateButton = false;

		if (dateLimit > currentDate) {
			disablePrevDateButton = true;
		}

		return disablePrevDateButton;
	};
	// Method to get selection count, last selected item
	var getSelectedItemCount = function getSelectedItemCount() {
		var selectedItemDetails = {
			count: 0,
			lastItem: ''
		};

		_.map($scope.overBookingObj.roomTypeList, function (value) {
			if (value.isChecked) {
				selectedItemDetails.count++;
				selectedItemDetails.lastItem = value.name;
			}
		});

		return selectedItemDetails;
	};

	// Showing custom message on selecting room types.
	$scope.showRoomTypeSelectionStatus = function () {
		var totalCount = $scope.overBookingObj.roomTypeList.length,
		    selectedItemObj = getSelectedItemCount(),
		    message = '';

		if (selectedItemObj.count === 0) {
			message = 'NOT SHOWING';
		} else if (selectedItemObj.count === totalCount) {
			message = 'SHOW ALL';
		} else if (selectedItemObj.count === 1) {
			message = selectedItemObj.lastItem;
		} else if (selectedItemObj.count > 0) {
			message = selectedItemObj.count + ' OF ' + totalCount + ' SELECTED';
		}

		return message;
	};

	// Handle Add OverBooking button click
	$scope.clickedAddOverBookingButton = function () {
		ngDialog.open({
			template: '/assets/partials/overBooking/rvAddOverBookingPopup.html',
			controller: 'rvAddOverBookingPopupCtrl',
			className: '',
			scope: $scope,
			closeByDocument: false
		});
	};

	var sellLimitPrintCompleted = function sellLimitPrintCompleted() {
		$('#print-orientation').remove();
	};

	// print the sell limit page
	var printSellLimit = function printSellLimit() {

		$timeout(function () {

			// add the orientation
			var orientation = 'landscape';

			$('head').append("<style id='print-orientation'>@page { size: " + orientation + "; }</style>");

			/*
    *	======[ READY TO PRINT ]======
    */
			// this will show the popup with full bill			

			$timeout(function () {

				if (sntapp.cordovaLoaded) {
					cordova.exec(sellLimitPrintCompleted, function () {
						sellLimitPrintCompleted();
					}, 'RVCardPlugin', 'printWebView', []);
				} else {
					window.print();
					sellLimitPrintCompleted();
				}
			}, 100);
		}, 250);
	};

	// Handle print action
	$scope.clickedPrintButton = function () {
		printSellLimit();
	};

	// Cleaning listener.
	$scope.$on('$destroy', listenerDateChanged);
}]);