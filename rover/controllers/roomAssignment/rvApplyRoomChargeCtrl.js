sntRover.controller('rvApplyRoomChargeCtrl', [
	'$scope',
	'$rootScope',
	'$state',
	'$stateParams',
	'RVRoomAssignmentSrv',
	'RVUpgradesSrv',
	'ngDialog',
	'RVReservationCardSrv',
	'$timeout',
	'rvPermissionSrv',
	function($scope,
		$rootScope,
		$state,
		$stateParams,
		RVRoomAssignmentSrv,
		RVUpgradesSrv,
		ngDialog,
		RVReservationCardSrv,
		$timeout,
		rvPermissionSrv) {

	BaseCtrl.call(this, $scope);
	$scope.noChargeDisabled = false;
	$scope.chargeDisabled   = true;
	$scope.roomCharge       = '';

	// CICO-17082, do we need to call the the room assigning API with forcefully assign to true
	// currently used for group reservation
	var wanted_to_forcefully_assign = false;
	var choosedNoCharge = false;


	$scope.enableDisableButtons = function() {

		return !isNaN($scope.roomCharge) && $scope.roomCharge.length > 0;


	};


	$scope.clickChargeButton = function() {
		choosedNoCharge = false;

		var options = {
            params: {
				"reservation_id": $scope.reservationData.reservation_card.reservation_id,
				"room_number": $scope.assignedRoom ? $scope.assignedRoom.room_number : "",
				"without_rate_change": true,
				"upsell_amount": $scope.roomCharge,
				"forcefully_assign_room": !!$scope.overbooking.isOpted && rvPermissionSrv.getPermissionValue('OVERBOOK_ROOM_TYPE') ? true : wanted_to_forcefully_assign, // CICO-47546
				"is_preassigned": $scope.assignedRoom.is_preassigned,
				// CICO-55101
				"change_room_type_alone": !$scope.assignedRoom,
				'room_type': !$scope.assignedRoom ? $scope.getCurrentRoomType().type : ''
			},
            successCallBack: $scope.successCallbackUpgrade,
            failureCallBack: $scope.failureCallbackUpgrade
        };

        $scope.callAPI(RVRoomAssignmentSrv.assignRoom, options);
	};

	/**
	 * to open the room aleady chhosed popup
	 * @return undefined
	 */
	var openRoomAlreadyChoosedPopup = function() {
		ngDialog.open(
		{
			template: '/assets/partials/roomAssignment/rvRoomHasAutoAssigned.html',
			controller: 'rvRoomAlreadySelectedCtrl',
			className: 'ngdialog-theme-default',
			scope: $scope
        });
	};

	/**
	 * [selectUpgrade description]
	 * @return {[type]} [description]
	 */
	$scope.selectUpgrade = function() {
		$scope.closeDialog();

		$timeout(function() {
			if (choosedNoCharge) {
				$scope.clickedNoChargeButton ();
			}
			else {
				$scope.clickChargeButton ();
			}
		}, 100);
	};

	$scope.failureCallbackUpgrade = function(error) {
		// ngDialog.close();
		// since we are expecting some custom http error status in the response
		// and we are using that to differentiate among errors

        // CICO-44726 Hide Activity Indicator in case of error in room upgrade
        $scope.$emit('hideLoader');

		if (error.hasOwnProperty ('httpStatus')) {
			switch (error.httpStatus) {
				case 470:
						var dataToBorrowRoom = {
							"errorMessage": error.errorMessage[0],
							"upsell_amount": $scope.roomCharge
						};

						wanted_to_forcefully_assign = true;
						// openWantedToBorrowPopup(error);
						$scope.$emit('closeDialogWithError', dataToBorrowRoom);
				 	break;
				default:
					break;
			}
		}
		else {
			$scope.displayRoomAssignementError(error.toString());
		}
		$scope.$emit('hideLoader');

	};

	$scope.successCallbackUpgrade = function(data) {

		// CICO-10152 : To fix - Rover - Stay card - Room type change does not reflect the updated name soon after upgrading.
		var dataToUpdate 		= {},
			assignedRoom 		= $scope.assignedRoom,
			selectedRoomType 	= $scope.selectedRoomType,
			reservationData 	= $scope.reservationData.reservation_card;

		_.extend (dataToUpdate,
		{
			room_id: assignedRoom.room_id,
			room_number: assignedRoom.room_number,
			room_status: "READY",
			fo_status: "VACANT",
			room_ready_status: "INSPECTED",
			is_upsell_available: (data.is_upsell_available) ? "true" : "false"  // CICO-7904 and CICO-9628 : update the upsell availability to staycard
		});

		if (typeof $scope.selectedRoomType !== 'undefined') {
			_.extend (dataToUpdate,
			{
				room_type_description: selectedRoomType.description,
				room_type_code: selectedRoomType.type
			});
		}

		// updating in the central data model
		_.extend($scope.reservationData.reservation_card, dataToUpdate);

		RVReservationCardSrv
			.updateResrvationForConfirmationNumber(reservationData.confirmation_num, $scope.reservationData);

		// CICO-10152 : Upto here..
		$scope.goToNextView(true);

	};

	$scope.canMoveRoomWithoutCharge = function() {
		return rvPermissionSrv.getPermissionValue('MOVE_ROOM_WITHOUT_CHARGE');
	};

	$scope.clickedNoChargeButton = function() {
		choosedNoCharge = true;
		var options = {
            params: {
				"reservation_id": $scope.reservationData.reservation_card.reservation_id,
				"room_number": $scope.assignedRoom ? $scope.assignedRoom.room_number : "",
				"without_rate_change": true,
				"forcefully_assign_room": !!$scope.overbooking.isOpted && rvPermissionSrv.getPermissionValue('OVERBOOK_ROOM_TYPE') ? true : wanted_to_forcefully_assign, // CICO-47546
				"is_preassigned": $scope.assignedRoom.is_preassigned,
                upsell_amount: "0", // CICO-44174 Pass 0 in upsell_amount if they select "No Charge".
				// This will ensure that we override configured upsell amount to $0 if they select "No Charge"
				// CICO-55101
				'change_room_type_alone': !$scope.assignedRoom,
				'room_type': !$scope.assignedRoom ? $scope.getCurrentRoomType().type : '' 
			},
            successCallBack: $scope.successCallbackUpgrade,
            failureCallBack: $scope.failureCallbackUpgrade,
            loader: 'NONE'
        };

        $scope.$emit('showLoader');
        $scope.callAPI(RVRoomAssignmentSrv.assignRoom, options);
	};

}]);
