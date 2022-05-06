'use strict';

angular.module('sntRover').controller('rvEditOverBookingPopupCtrl', ['$scope', '$rootScope', 'ngDialog', 'rvOverBookingSrv', function ($scope, $rootScope, ngDialog, rvOverBookingSrv) {

	/*
  *  EDIT OVER BOOKING API CALL
  */
	$scope.editOverBookingApiCall = function () {
		var editData = $scope.overBookingObj.editData;

		var onEditOverBookingApiSuccess = function onEditOverBookingApiSuccess() {
			$scope.errorMessage = '';
			$scope.$emit('REFRESH_OVERBOOKING_GRID');
			$scope.closeDialog();
		},
		    onEditOverBookingApiFailure = function onEditOverBookingApiFailure(errorMessage) {
			$scope.errorMessage = errorMessage;
		},
		    dataToSend = {
			'start_date': moment(tzIndependentDate(editData.date)).format($rootScope.momentFormatForAPI),
			'end_date': moment(tzIndependentDate(editData.date)).format($rootScope.momentFormatForAPI),
			'house_overbooking': editData.type === 'HOUSE',
			'limit': editData.limitValue
		};

		if (editData.type === 'ROOM_TYPE') {
			dataToSend.room_type_ids = [editData.roomTypeId];
		}

		$scope.callAPI(rvOverBookingSrv.addOrEditOverBooking, {
			successCallBack: onEditOverBookingApiSuccess,
			failureCallBack: onEditOverBookingApiFailure,
			params: dataToSend
		});
	};
	// close dialog
	$scope.closeDialog = function () {
		ngDialog.close();
	};
}]);