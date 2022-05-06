angular.module('sntRover').controller('RVHKGuestTabCtrl', [
	'$scope',
	'$rootScope',
	'$state',
	'$stateParams',
	'RVHkRoomDetailsSrv',
	'$filter',
	'rvPermissionSrv',
	'ngDialog',
	'$timeout',
	function($scope, $rootScope, $state, $stateParams, RVHkRoomDetailsSrv, $filter, rvPermissionSrv, ngDialog, $timeout) {

		BaseCtrl.call(this, $scope);
		// keep ref to room details in local scope
		$scope.roomDetails = $scope.$parent.roomDetails;

		var $_updateRoomDetails = $scope.$parent.updateRoomDetails;

		var ROOM_DETAILS_SCROLLER = 'room-details-scroller';

        // Set scroller for room details
        var setScroller = function () {
            var scrollerOptions = {
                tap: true,
                preventDefault: false,
                scrollX: false,
                scrollY: true
            };

            $scope.setScroller(ROOM_DETAILS_SCROLLER, scrollerOptions);
        };

		$scope.hasCheckOutReservationPermission = function() {
        	return rvPermissionSrv.getPermissionValue('CHECK_OUT_RESERVATION');
    	};
		/*
		Arrived - Show both departure date & departure time (if any)
		Stayover - Show both departure date & departure time (if any)
		Day use or Due out - Show departure time(or late check out time) alone. No need of showing date.
		*/
		$scope.checkOutReservation = function() {
			var Params = {
				id: $scope.roomDetails.reservation_id
			};

			$scope.invokeApi(RVHkRoomDetailsSrv.postCheckOutReservation, Params, successCheckout, failureCheckout);
		};

		var successCheckout = function(Message) {
			$scope.message = Message.data ;
			$scope.roomDetails.reservation_is_due_out = false;
			$scope.isSuccess = true;
			$scope.roomDetails.is_occupied = 'false';
			$scope.$emit('hideLoader');

            if ( 'true' === $scope.roomDetails.enable_room_status_at_checkout ) {
				ngDialog.open({
					template: '/assets/partials/housekeeping/rvCheckoutDialogWithHkStatusPopup.html',
					scope: $scope,
					closeByDocument: true
				});
			} else {
				ngDialog.open({
					template: '/assets/partials/housekeeping/rvCheckoutDialogPopup.html',
					scope: $scope,
					closeByDocument: true
				});
			}
		};

		var failureCheckout = function(Errors) {
			if ( !!Errors && Errors.hasOwnProperty('errors') ) {
				$scope.message = Errors.errors[0];
			}
			$scope.isSuccess = false;
			$scope.$emit('hideLoader');

			ngDialog.open({
				template: '/assets/partials/housekeeping/rvCheckoutDialogPopup.html',
				scope: $scope,
				closeByDocument: true
			});
		};

		$scope.flag = {
			roomStatusReady: false
		};

		$scope.manualRoomStatusChange = function() {
			var callback = function(data) {
				$scope.$emit('hideLoader');
				$_updateRoomDetails( 'current_hk_status', $scope.roomDetails.current_hk_status );
			};

			var hkStatusId;

			if ( !! $scope.flag.roomStatusReady ) {
                // CICO-28117 - Allow only the user with permission to change the room status to inspected
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

				if ( 'true' === $scope.roomDetails.checkin_inspected_only ) {
					hkStatusId = 2;
				}
				else {
					hkStatusId = 1;
				}
			} else {
				hkStatusId = 3;
			}

			$scope.roomDetails.current_hk_status = _.find($scope.roomDetails.hk_status_list, { id: hkStatusId }).value;

			var data = {
				'room_no': $scope.roomDetails.current_room_no,
				'hkstatus_id': hkStatusId
			};

			$scope.closeDialog();
			$scope.invokeApi(RVHkRoomDetailsSrv.updateHKStatus, data, callback);
		};

		$scope.$on('reloadPage', function (event, data) {
			$scope.roomDetails = data;
			init();
		});

		$scope.changeHouseKeepingStatus = function() {
			var success = function(data) {
				$scope.$emit('hideLoader');
				$scope.reloadPage();
			};

			var error = function(error) {
				if ( !!error && error.hasOwnProperty('errors') ) {
					$scope.message = error.errors[0];
				}

				$scope.$emit('hideLoader');
			};

			var data = {
				id: $scope.roomDetails.id
			};

			$scope.invokeApi(RVHkRoomDetailsSrv.changeHouseKeepingStatus, data, success, error);
		};

		var init = function() {
            setScroller();
            var currentStatus = $scope.roomDetails.current_room_reservation_status;

			switch (currentStatus) {
				case 'ARRIVED':
				case 'STAYOVER':
					$scope.roomDetails.hasDept = !!$scope.roomDetails.dept_date || $scope.roomDetails.departure_time ? true : false;
					$scope.roomDetails.departure = { 'date': $scope.roomDetails.dept_date, 'time': $scope.roomDetails.departure_time };
					break;
				case 'DUE OUT':
				case 'DUE OUT / ARRIVAL':
				case 'DUE OUT / DEPARTED':
				case 'ARRIVED / DAY USE / DUE OUT':
				case 'ARRIVED / DAY USE / DUE OUT / DEPARTED':
					$scope.roomDetails.hasDept = !!$scope.roomDetails.late_checkout_time || $scope.roomDetails.departure_time ? true : false;
					$scope.roomDetails.departure = { 'time': $scope.roomDetails.is_late_checkout === 'true' ? $scope.roomDetails.late_checkout_time : $scope.roomDetails.departure_time };
					break;
				default:
					$scope.roomDetails.hasDept = false;
					break;
            }
            
            $timeout(function () {
                $scope.refreshScroller(ROOM_DETAILS_SCROLLER);
            }, 1000);
		};

		init();

        $scope.setProfileImageForAccompanyingGuests = function (guestType) {
            switch (guestType) {
                case 'ADULT':
                    return 'adult';
                case 'CHILDREN':
                    return 'student';
                case 'INFANTS':
                    return 'infant';
                default:
                    return '';
            }
        };

	}
]);
