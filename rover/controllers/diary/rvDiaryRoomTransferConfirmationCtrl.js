sntRover.controller('RVDiaryRoomTransferConfirmationCtrl', [
												'$scope',
												'$rootScope',
												'$state',
												'rvDiarySrv',
												'ngDialog',
												'rvDiaryMetadata',
												'$vault',
												'rvDiaryUtil',
												'$filter',
												'$timeout',
	function($scope, $rootScope, $state, rvDiarySrv, ngDialog, meta, $vault, util, $filter, $timeout) {

		var roomXfer = $scope.roomXfer,
			current = (roomXfer.current),
			next = (roomXfer.next),
			m = meta.occupancy,
			r = meta.room,
			oldArrivalDateComp 		= new Date(current[r.row_children][m.start_date]).toComponents(),
			oldDepartureDateComp 	= new Date(current[r.row_children][m.end_date]).toComponents(),
			newArrivalDateComp 		= new Date(next[r.row_children][m.start_date]).toComponents(),
			newDepartureDateComp 	= new Date(next[r.row_children][m.end_date]).toComponents();

		BaseCtrl.call(this, $scope);

		var formDateAndTimeForMe = function(obj) {
			var arrivalDate, departureDate;

			obj.arrivalTime 			= new Date(obj[r.row_children][m.start_date]).toLocaleTimeString();
			obj.departureTime 			= new Date(obj[r.row_children][m.end_date]).toLocaleTimeString();

			arrivalDate 				= tzIndependentDate(new Date(obj[r.row_children][m.start_date]).toComponents().date.toDateString().replace(/-/g, '/'));
			obj.arrivalDateToShow 		= $filter('date')(arrivalDate, $rootScope.dateFormat);
			obj.arrivalDate 			= $filter('date')(arrivalDate, $rootScope.mmddyyyyBackSlashFormat);

			departureDate 				= tzIndependentDate(new Date(obj[r.row_children][m.end_date]).toComponents().date.toDateString().replace(/-/g, '/'));
			obj.departureDateToShow 	= $filter('date')(departureDate, $rootScope.dateFormat);
			obj.departureDate 			= $filter('date')(departureDate, $rootScope.mmddyyyyBackSlashFormat);
		};


		// forming date & time for current to display and to pass
		formDateAndTimeForMe(current);

		// forming date & time for next to display and to pass
		formDateAndTimeForMe(next);


		$scope.price = parseFloat(roomXfer.next.room.new_price - roomXfer.current.room.old_price);

		/**
		* while reservation is moving from one date to another we have to store in some services
		* this method is to reset the data that set during trnasfer
		*/
		var resetTheDataForReservationMoveFromOneDateToAnother  = function () {
			// setting the service variables for reservation transfrer
			rvDiarySrv.isReservationMovingFromOneDateToAnother = false;
			rvDiarySrv.movingReservationData.reservation = undefined;
			rvDiarySrv.movingReservationData.room_to = undefined;
			rvDiarySrv.movingReservationData.originalRoom = undefined;
			rvDiarySrv.movingReservationData.originalReservation = undefined;
		};

		$scope.moveWithoutRateChange = function() {
			var isMoveWithoutRateChange = true;

			$scope.saveReservation ($scope.roomXfer.next.occupancy, $scope.roomXfer.next.room, isMoveWithoutRateChange);
			resetTheDataForReservationMoveFromOneDateToAnother ();
			$scope.closeDialog();
			$scope.renderGrid();
		};

		$scope.selectAdditional = function() {
			$scope.closeDialog();
		};


		$scope.confirm = function() {
			$scope.reserveRoom($scope.roomXfer.next.room, $scope.roomXfer.next.occupancy);
		};
	}
]);
