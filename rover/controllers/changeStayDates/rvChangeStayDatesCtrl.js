sntRover.controller('RVchangeStayDatesController', ['$state', '$stateParams', '$rootScope', '$scope', 'stayDateDetails', 'RVChangeStayDatesSrv', '$filter', 'ngDialog', 'rvPermissionSrv', 'RVReservationBaseSearchSrv', '$timeout', 'RVNightlyDiarySrv',
    'RVReservationStateService',
    function($state, $stateParams,
             $rootScope, $scope, stayDateDetails,
             RVChangeStayDatesSrv, $filter, ngDialog,
             rvPermissionSrv, RVReservationBaseSearchSrv, $timeout, RVNightlyDiarySrv, RVReservationStateService) {
		// inheriting some useful things
        BaseCtrl.call(this, $scope);

        var RESV_LIMIT = $rootScope.maxStayLength;

        var RESPONSE_STATUS_470 = 470;

        $scope.hasOverBookRoomTypePermission = rvPermissionSrv.getPermissionValue('OVERBOOK_ROOM_TYPE');
        $scope.hasOverBookHousePermission = rvPermissionSrv.getPermissionValue('OVERBOOK_HOUSE');
        $scope.hasBorrowFromHousePermission = rvPermissionSrv.getPermissionValue('GROUP_HOUSE_BORROW');

		// set a back button on header
        $rootScope.setPrevState = {
            title: $filter('translate')('STAY_CARD'),
            callback: 'goBack',
            scope: $scope
        };

        var roomAndRatesState = 'rover.reservation.staycard.mainCard.room-rates';

		// pass in something to the next state which ever it may be
        $rootScope.setNextState = {
            data: {
                'isFromChangeStayDates': true
            }
        };

        var that = this;
		// CICO-9081
        var translatedHeading = $filter('translate')('CHANGE_STAY_DATES_TITLE');

        $scope.$emit('HeaderChanged', translatedHeading);
        $scope.setTitle(translatedHeading);

		// CICO-7897
        $scope.isChanging = false;
		// CICO-7306
        $scope.requireAuthorization = false;
        var isFirstTime = true;
		/**
		 * setting the scroll options for the room list
		 */
        var scrollerOptions = {
            preventDefault: false
        };

        $scope.setScroller('edit_staydate_updatedDetails', scrollerOptions);
        $scope.setScroller('edit_staydate_calendar', scrollerOptions);

		// Flag for CC auth permission
        $scope.hasCCAuthPermission = function() {
            return rvPermissionSrv.getPermissionValue('OVERRIDE_CC_AUTHORIZATION');
        };

        this.dataAssign = function() {
			// Data from Resolve method
            $scope.stayDetails = stayDateDetails;
            $scope.stayDetails.isOverlay = false;
            $scope.stayDetails.validDays = [];
			// For future comparison / reset
            $scope.checkinDateInCalender = $scope.confirmedCheckinDate = tzIndependentDate($scope.stayDetails.details.arrival_date);
            $scope.checkoutDateInCalender = $scope.confirmedCheckoutDate = tzIndependentDate($scope.stayDetails.details.departure_date);

			// Data for rightside Pane.
            $scope.rightSideReservationUpdates = '';
            $scope.roomSelected = $scope.stayDetails.details.room_number;
            $scope.calendarNightDiff = '';
            $scope.avgRate = '';
            $scope.availableRooms = [];
        };

        this.renderFullCalendar = function() {
			/* event source that contains custom events on the scope */
            $scope.events = $scope.getEventSourceObject($scope.checkinDateInCalender, $scope.checkoutDateInCalender);

            $scope.eventSources = [$scope.events];
			// calender options used by full calender, related settings are done here
            $scope.fullCalendarOptions = {
                height: 450,
                header: {
                    left: 'prev',
                    center: 'title',
                    right: 'next'
                },
                year: $scope.confirmedCheckinDate.getFullYear(), // Check in year
                month: $scope.confirmedCheckinDate.getMonth(), // Check in month (month is zero based)
                day: $scope.confirmedCheckinDate.getDate(), // Check in day
                editable: true,
                disableResizing: false,
                contentHeight: 320,
                weekMode: 'fixed',
                ignoreTimezone: false, // For ignoring timezone,
                eventDrop: $scope.changedDateOnCalendar,
                eventAfterRender: function(event, element) {
					// FIX FOR CICO-7897 explicitly setting draggability in touch evnvironment
                    if ('startEditable' in event && 'ontouchstart' in document.documentElement) {
                        element.draggable();
                    }
                },
				// CICO-7897's 2nd fix
                viewRender: function(event, element) {
                    if (!isFirstTime) {
                        $scope.$apply(function() {
                            $scope.isChanging = true;
                            $scope.$emit('showLoader');
                        });
                        setTimeout(function() {
                            $scope.$apply(function() {
                                $scope.isChanging = false;
                                $scope.$emit('hideLoader');
                            });
                        }, 0);
                    }
                    isFirstTime = false;
                }
            };
            setTimeout(function() {
                $scope.refreshScroller('edit_staydate_calendar');
            }, 0);
        };
        this.initialise = function() {
            that.dataAssign();

            if ($rootScope.isStandAlone) {

                if (!that.checkIfStaydatesCanBeExtended()) {
                    $scope.rightSideReservationUpdates = 'NO_HOUSE_AVAILABLE';
                    $scope.refreshMyScroller();
                }
				// CICO-37843 no longer restricating
				// else if (that.hasMultipleRates()) {
				// 	$scope.rightSideReservationUpdates = 'HAS_MULTIPLE_RATES';
				// 	$scope.refreshMyScroller();
				// }

            }
            that.renderFullCalendar();
        };

		/*
		 * If the reservation has multiple rates, then the user should not be allowed to extend the Stay dates
		 * User has to select a rate first. So display an option to go to the stayDates calendar
		 * TODO: verify if stay dates can be shortened in this case
		 */
        this.hasMultipleRates = function() {
            var calendarDetails = $scope.stayDetails.calendarDetails;
            var checkinTime = $scope.checkinDateInCalender;
            var checkoutTime = $scope.checkoutDateInCalender;
            var thisTime = '';
			// If the flag 'has_multiple_rates' is true,
			// then we do not display the dates before check in and dates after departure date as an event
			// Remove those dates fromt the available dates response

            if (calendarDetails.has_multiple_rates === 'true') {
                for (var i = calendarDetails.available_dates.length - 1; i >= 0; i--) {
                    thisTime = tzIndependentDate(calendarDetails.available_dates[i].date);
                    if (thisTime < checkinTime || thisTime > checkoutTime) {
                        $scope.stayDetails.calendarDetails.available_dates.splice(i, 1);
                    }
                }
                return true;
            }

            return false;
        };

		// Stay dates can be extended only if dates are available prior to checkin date
		// or after checkout date.
        this.checkIfStaydatesCanBeExtended = function() {
            var calendarDetails = $scope.stayDetails.calendarDetails;
            var reservationStatus = calendarDetails.reservation_status;
            var checkinTime = $scope.checkinDateInCalender;
            var checkoutTime = $scope.checkoutDateInCalender;
            var thisTime = '';
            var canExtendStay = false;

            $(calendarDetails.available_dates).each(function(index) {
				// Put time correction
                thisTime = tzIndependentDate(this.date);
				// Check if a day available for extending prior to the checkin day
				// Not applicable to inhouse reservations since they can not extend checkin date
                if (reservationStatus !== 'CHECKEDIN' && reservationStatus !== 'CHECKING_OUT') {
                    if (thisTime < checkinTime) {
                        canExtendStay = true;
                        return false; // break out of for loop
                    }
                }
				// Check if a day is available to extend after the departure date
                if (thisTime > checkoutTime) {
                    canExtendStay = true;
                    return false; // break out of for loop
                }
            });

            return canExtendStay;

        };

        $scope.errorCallbackCheckUpdateAvaibale = function(errorMessage) {
            $scope.$emit('hideLoader');
            $scope.errorMessage = errorMessage;
        };

        $scope.successCallbackCheckUpdateAvaibale = function(data) {
            $scope.stayDetails.isOverlay = true;
            $scope.$emit('hideLoader');
            $scope.availabilityDetails = data;

			// CICO-7306 Flag setting whether need Authorization or not.
            $scope.requireAuthorization = data.require_cc_auth;

            $scope.checkAvailabilityStatus();

			// if restrictions exist for the rate / room / date combination
			//					display the existing restriction
			// Only for standalone. In pms connected, restrictions handled in server
			// and will return not available status
            if ($rootScope.isStandAlone) {
                if (data.restrictions.length > 0 && ( $scope.availabilityDetails.availability_status === 'room_available' || 
                $scope.availabilityDetails.availability_status === 'room_type_available') ) {
                    $scope.rightSideReservationUpdates = 'RESTRICTION_EXISTS';
                    $scope.stayDetails.restrictions = data.restrictions;
                    $scope.refreshMyScroller();
                    return false;
                }
            }

            if (data && data.alert_user) {
                ngDialog.open({
                    template: '/assets/partials/reservation/allowanceNotConsumableDialog.html',
                    className: '',
                    controller: 'RvAllowanceNotConsumeOnStayDates',
                    closeByDocument: false,
                    closeByEscape: false,
                    scope: $scope,
                    data: { data: data, message: data.message, isChangeStayDatesPage: true }
                });
            }
        };

        var hasPermissionToOverBookRoomType = function() {
            return rvPermissionSrv.getPermissionValue('OVERBOOK_ROOM_TYPE');
        };

		/*
		 *based on the availability of room, web service will give 5 status
		 * "room_available": we need to show room details, rate, total, avg...
		 * "room_type_available": we need to show room list, after selecting that
		 * "not_available": we need to show the not available message
		 * "to_be_unassigned": Room can be unassigned from another guest
		 * 					and the guest can continue on same room
		 * "do_not_move": Do Not Move flag on reservation with the assigned room
		 * "maintenance": Room under maintenance
		 */
        $scope.checkAvailabilityStatus = function() {

            if ($scope.availabilityDetails.availability_status === 'room_available') {
                $scope.showRoomAvailable();
            } else if ($scope.availabilityDetails.availability_status === 'room_type_available') {
                that.showRoomTypeAvailable($scope.availabilityDetails);
            } else if ($scope.availabilityDetails.availability_status === 'not_available') {
                if (hasPermissionToOverBookRoomType()) {
                    // CICO-36733
                    $scope.showOverBookingAlertForStayExtension();
                }
                else {
                    that.showRoomNotAvailable();
                }
            } else if ($scope.availabilityDetails.availability_status === 'to_be_unassigned') {
                $scope.rightSideReservationUpdates = 'PREASSIGNED';
                $scope.stayDetails.preassignedGuest = $scope.availabilityDetails.preassigned_guest;
            } else if ($scope.availabilityDetails.availability_status === 'maintenance') {
                $scope.rightSideReservationUpdates = 'MAINTENANCE';
            } else if ($scope.availabilityDetails.availability_status === 'do_not_move') {
                $scope.rightSideReservationUpdates = 'ROOM_CANNOT_UNASSIGN';
            } else if ($scope.availabilityDetails.availability_status === 'room_ooo') {
                $scope.rightSideReservationUpdates = 'ROOM_OOO';
            } else if ($scope.availabilityDetails.availability_status === 'room_is_inhouse') {
				// CICO-40534
                $scope.rightSideReservationUpdates = 'ROOM_IN_HOUSE';
            } else if ($scope.availabilityDetails.availability_status === 'no_room_move') {
                // CICO-40683
                $scope.rightSideReservationUpdates = 'NO_ROOM_MOVE';
            }
            $scope.refreshMyScroller();
        };

		// function to show restricted stay range div- only available for non-standalone PMS
        this.showRestrictedStayRange = function() {
            $scope.rightSideReservationUpdates = 'STAY_RANGE_RESTRICTED';
            $scope.refreshMyScroller();
        };

		// function to show not available room types div
        this.showRoomNotAvailable = function() {
            $scope.rightSideReservationUpdates = 'ROOM_NOT_AVAILABLE';
            $scope.refreshMyScroller();
        };

		// function to show restricted stay range div- only available for non-standalone PMS
        this.showRestrictedStayRange = function() {
            $scope.rightSideReservationUpdates = 'STAY_RANGE_RESTRICTED';
            $scope.refreshMyScroller();
        };

		// function to show not available room types div
        this.showRoomNotAvailable = function() {
            $scope.rightSideReservationUpdates = 'ROOM_NOT_AVAILABLE';
            $scope.refreshMyScroller();
        };

		// function to show room list
        that.showRoomTypeAvailable = function(data) {
            $scope.availableRooms = data.rooms;
			// we are showing the right side with updates
            $scope.rightSideReservationUpdates = 'ROOM_TYPE_AVAILABLE';
            $scope.refreshMyScroller();
        };

		// function to show room details, total, avg.. after successful checking for room available
        $scope.showRoomAvailable = function() {
			// setting nights based on calender checking/checkout days
            var timeDiff = $scope.checkoutDateInCalender.getTime() - $scope.checkinDateInCalender.getTime();

            $scope.calendarNightDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

			// calculating the total rate / avg.rate
            $scope.totRate = 0;
            $scope.isStayRatesSuppressed = false;
            var checkinRate = '';

            $($scope.stayDetails.calendarDetails.available_dates).each(function(index) {
                if (this.is_sr === 'true') {
                    $scope.isStayRatesSuppressed = true;
                    return false; // Exit from loop
                }
				// we have to add rate between the calendar checkin date & calendar checkout date only
                if (tzIndependentDate(this.date).getTime() >= $scope.checkinDateInCalender.getTime()
                    && tzIndependentDate(this.date).getTime() < $scope.checkoutDateInCalender.getTime()) {
                    $scope.totRate += escapeNull(this.rate) === '' ? 0 : parseInt(this.rate);
                    $scope.totCurrencySymbol = this.rate_currency;
                }
				// if calendar checkout date is same as calendar checking date, total rate is same as that day's checkin rate
                if (this.date === $scope.stayDetails.details.arrival_date) {
                    checkinRate = $scope.escapeNull(this.rate) === '' ? 0 : parseInt(this.rate);
                }

            });
            var firstDateInAvailableDate = $scope.stayDetails.calendarDetails.available_dates[0].date;
            var indexOfFirstAvailableDateInStayDates = _.findIndex($scope.stayDetails.calendarDetails.stay_dates, {'date': firstDateInAvailableDate});
            var remainingStayDatesArray = _.first($scope.stayDetails.calendarDetails.stay_dates, parseInt(indexOfFirstAvailableDateInStayDates));

            $(remainingStayDatesArray).each(function(index) {
                $scope.totRate += escapeNull(this.rate) === '' ? 0 : parseInt(this.rate);
                $scope.totCurrencySymbol = this.rate_currency;
            });

            if (!$scope.isStayRatesSuppressed) {
				// calculating the avg. rate
                if ($scope.calendarNightDiff > 0) {
                    $scope.avgRate = Math.round(($scope.totRate / $scope.calendarNightDiff + 0.00001) * 100 / 100);
                } else {
                    $scope.totRate = checkinRate;
                    $scope.avgRate = Math.round($scope.totRate + 0.00001);
                }
            }
			// we are showing the right side with updates
            $scope.rightSideReservationUpdates = 'ROOM_AVAILABLE';
            $scope.refreshMyScroller();
        };

		// click function to execute when user selected a room from list (on ROOM_TYPE_AVAILABLE status)
        $scope.roomSelectedFromList = function(roomNumber) {
            $scope.roomSelected = roomNumber;
            $scope.showRoomAvailable();
        };

		/*
		 * success callback of ConfirmUpdates
		 */
        $scope.continueWithoutCC = function() {
            $scope.requireAuthorization = false;
            $scope.confirmUpdates();
            $scope.closeDialog();
        };

        $scope.continueAfterSuccessAuth = function() {
            $scope.goBack();
            $scope.closeDialog();
        };

        this.successCallbackConfirmUpdates = function(data) {
            $scope.$emit('hideLoader');
            $scope.closeDialog();
            $scope.goBack();
        };

        this.failureCallbackConfirmUpdates = function(errorMessage) {
            $scope.$emit('hideLoader');

            if (errorMessage.httpStatus === RESPONSE_STATUS_470 && errorMessage.results && errorMessage.results.is_borrowed_from_house) {
                var results = errorMessage.results;

                $scope.borrowData = {};

                if (!results.room_overbooked && !results.house_overbooked) {
                    $scope.borrowData.isBorrowFromHouse = true;
                }
                 
                if (results.room_overbooked && !results.house_overbooked) {
                    $scope.borrowData.shouldShowOverBookBtn = $scope.hasOverBookRoomTypePermission;
                    $scope.borrowData.isRoomTypeOverbooked = true;
                } else if (!results.room_overbooked && results.house_overbooked) {
                    $scope.borrowData.shouldShowOverBookBtn = $scope.hasOverBookHousePermission;
                    $scope.borrowData.isHouseOverbooked = true;
                } else if (results.room_overbooked && results.house_overbooked) {
                    $scope.borrowData.shouldShowOverBookBtn = $scope.hasOverBookRoomTypePermission && $scope.hasOverBookHousePermission;
                    $scope.borrowData.isHouseAndRoomTypeOverbooked = true;
                }
                

                ngDialog.open({
                    template: '/assets/partials/common/group/rvGroupBorrowPopup.html',
                    className: '',
                    closeByDocument: false,
                    closeByEscape: true,
                    scope: $scope
                });
            } else {
                $scope.errorMessage = errorMessage;
			    // Some error in date extending process - auth popup closing..
                $scope.closeDialog();
            }
            
        };

        // Close borrow popup
        $scope.closeBorrowPopup = function (shouldClearData) {
            if (shouldClearData) {
                $scope.borrowData = {};
            }
            ngDialog.close();
        };

        // Handles the borrow action
        $scope.performBorrowFromHouse = function () {
            if ($scope.borrowData.isBorrowFromHouse) {
                RVReservationStateService.setForceOverbookFlagForGroup(true);
                $scope.clickedStayRangeChangeConfirmButton();
                $scope.closeBorrowPopup(true);
            } else {
                $scope.closeBorrowPopup();
                ngDialog.open({
                    template: '/assets/partials/common/group/rvGroupOverbookPopup.html',
                    className: '',
                    closeByDocument: false,
                    closeByEscape: true,
                    scope: $scope
                });
            }
            
        };

        // Closes the current borrow dialog
        $scope.closeOverbookPopup = function() {
            $scope.borrowData = {};
            ngDialog.close();
        };

        // Perform overbook
        $scope.performOverBook = function () {
            RVReservationStateService.setForceOverbookFlagForGroup(true);
            $scope.clickedStayRangeChangeConfirmButton();
            $scope.closeOverbookPopup();
        };

        $scope.resetDates = function() {
            $scope.stayDetails.isOverlay = false;
            that.dataAssign();
            if ($rootScope.isStandAlone) {
                if (!that.checkIfStaydatesCanBeExtended()) {
                    $scope.rightSideReservationUpdates = 'NO_HOUSE_AVAILABLE';
                    $scope.refreshMyScroller();
                }
            }
			/* event source that contains custom events on the scope */
            $scope.events = $scope.getEventSourceObject($scope.checkinDateInCalender, $scope.checkoutDateInCalender);

            $scope.eventSources.length = 0;
            $scope.eventSources.push($scope.events);

        };

        $scope.goBack = function() {
            $state.go('rover.reservation.staycard.reservationcard.reservationdetails', {
                'id': $stateParams.reservationId,
                'confirmationId': $stateParams.confirmNumber,
                'isrefresh': true
            });
        };

		// function to get color class against a room based on it's status
        $scope.getColorCode = function() {
            var reservationStatus = $scope.stayDetails.details.reservation_status;
            var roomReadyStatus = $scope.stayDetails.details.room_ready_status;
            var foStatus = $scope.stayDetails.details.fo_status;
            var checkinInspectedOnly = $scope.stayDetails.details.checkin_inspected_only;

            return getMappedRoomStatusColor(reservationStatus, roomReadyStatus, foStatus, checkinInspectedOnly);
        };

		// Success after autherization
        this.successCallbackCCAuthConfirmUpdates = function(data) {
            $scope.$emit('hideLoader');

			// CICO-7306 : With Authorization flow .: Auth Success
            if (data.auth_status) {
                $scope.isInProgressScreen = false;
                $scope.isSuccessScreen = true;
                $scope.isFailureScreen = false;
                $scope.cc_auth_amount = data.cc_auth_amount;
                $scope.cc_auth_code = data.cc_auth_code;
            } else {
				// CICO-7306 : With Authorization flow .: Auth declined
                $scope.isInProgressScreen = false;
                $scope.isSuccessScreen = false;
                $scope.isFailureScreen = true;
                $scope.cc_auth_amount = data.cc_auth_amount;
            }
            $scope.goBack();
            $scope.closeDialog();
        };

		// Handle confirmUpdates process with Autherization..
        var performCCAuthAndconfirmUpdatesProcess = function(postParams) {
            var params = RVNightlyDiarySrv.getCache();

            if (params) {
                var reservationInDiary = params.currentSelectedReservation;
                var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
                var differenceToBeAddedOrRemoved = 0;

                if (reservationInDiary.isDepartureFlagVisible) {

		    	    // Get the number of days between initial day of diary grid and arrival date
	   	            var diffBtwOldAndNewDepartureDate = tzIndependentDate(reservationInDiary.dept_date).getTime() - tzIndependentDate(postParams.dep_date).getTime();
	        	    var noOfDaysBtwOldAndNewDepartureDate = Math.abs(diffBtwOldAndNewDepartureDate / oneDay);

		    	    differenceToBeAddedOrRemoved = 840 / params.no_of_days * noOfDaysBtwOldAndNewDepartureDate;

	        	    if (diffBtwOldAndNewDepartureDate > 0)
	        	    {
	        	    	reservationInDiary.departurePositionInt = reservationInDiary.departurePositionInt - differenceToBeAddedOrRemoved;
		    	    } else if (diffBtwOldAndNewDepartureDate < 0) {
            reservationInDiary.departurePositionInt = reservationInDiary.departurePositionInt + differenceToBeAddedOrRemoved;
        }
                }
                if (reservationInDiary.isArrivalFlagVisible) {
		    	    // Get the number of days between initial day of diary grid and arrival date
	    	   	    var diffBtwOldAndNewArrivalDate = tzIndependentDate(reservationInDiary.arrival_date).getTime() - tzIndependentDate(postParams.arrival_date).getTime();
		    	    var noOfDaysBtwOldAndNewArrivalDate = Math.abs(diffBtwOldAndNewArrivalDate / oneDay);

	        	    differenceToBeAddedOrRemoved = 840 / params.no_of_days * noOfDaysBtwOldAndNewArrivalDate;

		    	    if (diffBtwOldAndNewArrivalDate > 0)
		    	    {
		    	    	reservationInDiary.arrivalPositionInt = reservationInDiary.arrivalPositionInt - differenceToBeAddedOrRemoved;
		    	    } else if (diffBtwOldAndNewArrivalDate < 0) {
            reservationInDiary.arrivalPositionInt = reservationInDiary.arrivalPositionInt + differenceToBeAddedOrRemoved;
        }
                }

                setTimeout(function() {
                    reservationInDiary.departurePosition = reservationInDiary.departurePositionInt + 'px';
                    reservationInDiary.departureStyle.transform = 'translateX(' + reservationInDiary.departurePositionInt + 'px)';
                    reservationInDiary.dept_date = postParams.dep_date;
                    reservationInDiary.deptDate = moment(postParams.dep_date, 'YYYY-MM-DD').format($rootScope.dateFormat.toUpperCase());
                    reservationInDiary.arrivalPosition = reservationInDiary.arrivalPositionInt + 'px';
                    reservationInDiary.arrivalStyle.transform = 'translateX(' + reservationInDiary.arrivalPositionInt + 'px)';
                    reservationInDiary.arrival_date = postParams.arrival_date;
                    reservationInDiary.arrivalDate = moment(postParams.arrival_date, 'YYYY-MM-DD').format($rootScope.dateFormat.toUpperCase());

                    params.currentSelectedReservation = reservationInDiary;
                    RVNightlyDiarySrv.updateCache(params);
                }, 1000);

            }

            // CICO-71977
            if (RVReservationStateService.getForceOverbookForGroup()) {
                postParams.forcefully_overbook = RVReservationStateService.getForceOverbookForGroup();
                RVReservationStateService.setForceOverbookFlagForGroup(false);
            }

			// CICO-7306 authorization for CC.
            if ($scope.requireAuthorization && $scope.isStandAlone) {
				// Start authorization process...
                $scope.isInProgressScreen = true;
                $scope.isSuccessScreen = false;
                $scope.isFailureScreen = false;
                $scope.isCCAuthPermission = $scope.hasCCAuthPermission();

                ngDialog.open({
                    template: '/assets/partials/bill/ccAuthorization.html',
                    className: '',
                    closeByDocument: false,
                    scope: $scope
                });
                postParams.authorize_credit_card = true;

                $scope.invokeApi(RVChangeStayDatesSrv.confirmUpdates, postParams, that.successCallbackCCAuthConfirmUpdates, that.failureCallbackConfirmUpdates);
            } else {
                postParams.authorize_credit_card = false;
                $scope.invokeApi(RVChangeStayDatesSrv.confirmUpdates, postParams, that.successCallbackConfirmUpdates, that.failureCallbackConfirmUpdates);
            }
        };

        var setFlagForPreAuthPopup = function() {
			// CICO-17266 Setting up flags for showing messages ..
            $scope.message_incoming_from_room = false;
            $scope.message_out_going_to_room = false;
            $scope.message_out_going_to_comp_tra = false;
            $scope.enableIncedentalOnlyOption = false;

            if ($scope.availabilityDetails.routing_info !== undefined) {
                if ($scope.availabilityDetails.routing_info.incoming_from_room) {
                    $scope.message_incoming_from_room = true;
                } else if ($scope.availabilityDetails.routing_info.out_going_to_room) {
                    $scope.message_out_going_to_room = true;
                } else if ($scope.availabilityDetails.routing_info.out_going_to_comp_tra) {
                    $scope.message_out_going_to_comp_tra = true;
                }
            }
            if ($scope.availabilityDetails.is_cc_authorize_for_incidentals_active && ($scope.message_out_going_to_room || $scope.message_out_going_to_comp_tra)) {
                $scope.enableIncedentalOnlyOption = true;
            }
        };

		// CICO-17266 Considering Billing info details before Auth..
        var showPreAuthPopupWithBillingInfo = function(data) {

            $scope.clickedIncidentalsOnly = function() {
				// @params : data , isCheckinWithoutAuth: false
                data.is_cc_authorize_for_incidentals = true;
                $scope.requireAuthorization = true;
                performCCAuthAndconfirmUpdatesProcess(data);
                ngDialog.close();
            };

            $scope.clickedFullAuth = function() {
				// @params : data , isCheckinWithoutAuth: false
                $scope.requireAuthorization = true;
                performCCAuthAndconfirmUpdatesProcess(data);
                ngDialog.close();
            };

            $scope.clickedManualAuth = function() {
				// As of now , Manual auth is performed at stay card..
				// Proceeding change stay dates without authorization..
				// @params : data , isCheckinWithoutAuth :true
                $scope.requireAuthorization = false;
                performCCAuthAndconfirmUpdatesProcess(data);
                ngDialog.close();
            };

            setFlagForPreAuthPopup();

			// CICO-17266 Considering Billing info details before Auth..
            ngDialog.open({
                template: '/assets/partials/bill/ccAuthAndBillingInfoConfirm.html',
                className: '',
                closeByDocument: false,
                scope: $scope
            });
        };
        /**
         * Handles the stay range change cofirm button
         * checks whether billing information exist
         * 1.If exist, show pop up for update/billing information
         * 2.If not continue the regular flow
         * @params none
         * @returns void
         */

        $scope.clickedStayRangeChangeConfirmButton = function() {
            setFlagForPreAuthPopup();

            if ($scope.message_incoming_from_room
                || $scope.message_out_going_to_room
                || $scope.message_out_going_to_comp_tra) {
                $scope.showBillingInformationPrompt();
            } else {
                $scope.confirmUpdates();
            }
        };
        /**
         * Update the billing information when stay range changes if any billing info exist
         * @params none
         * @returns void
         */
        $scope.updateBillingInformation = function() {
            var postParams = {
                'from_date': getDateString($scope.checkinDateInCalender),
                'to_date': getDateString($scope.checkoutDateInCalender),
                'reservation_id': $scope.stayDetails.calendarDetails.reservation_id
            };

            $scope.callAPI(RVChangeStayDatesSrv.updateBillingInformation, {
                params: postParams,
                successCallBack: $scope.closeBillingInfoPopup
            });
        };

        $scope.closeBillingInfoPopup = function() {
            ngDialog.close();
            $scope.confirmUpdates();
        };

        $scope.confirmUpdates = function() {
            var postParams = {
                'room_selected': $scope.roomSelected,
                'arrival_date': getDateString($scope.checkinDateInCalender),
                'dep_date': getDateString($scope.checkoutDateInCalender),
                'reservation_id': $scope.stayDetails.calendarDetails.reservation_id
            };

            if (!$scope.message_incoming_from_room && !$scope.message_out_going_to_room && !$scope.message_out_going_to_comp_tra) {
                performCCAuthAndconfirmUpdatesProcess(postParams);
            } else if ($scope.requireAuthorization) {
				// CICO-17266 PMS: Rover - CC Auth should consider Billing Information.
                showPreAuthPopupWithBillingInfo(postParams);
            } else {
                performCCAuthAndconfirmUpdatesProcess(postParams);
            }
        };
		/*
		 this function is used to check the whether the movement of dates is valid accoriding to our reqmt.
		 */
        $scope.changedDateOnCalendar = function(event, dayDelta, minuteDelta, allDay, revertFunc, jsEvent, ui, view) {
            $scope.stayDetails.isOverlay = false;
			// the new date in calendar
            var newDateSelected = event.start;

			// we are storing the available first date & last date for easiness of the following code
            var availableStartDate = tzIndependentDate($scope.stayDetails.validDays[0].date);
            var availableLastDate = tzIndependentDate($scope.stayDetails.validDays[$scope.stayDetails.validDays.length - 1].date);

			// also we are storing the current business date for easiness of the following code
            var currentBusinessDate = tzIndependentDate($scope.stayDetails.calendarDetails.current_business_date);

            var finalCheckin = '';
            var finalCheckout = '';

            var destEventObject = event.source.events.find(function(eventObj) {
                    return event.start.getDate().toString() === eventObj.day; 
                }),
                dest = angular.copy(destEventObject);

			// we will not allow to drag before to available start date or to drag after available end date
            if ( newDateSelected < availableStartDate || newDateSelected > availableLastDate ) {
                if (!dest || !dest.onlyCheckOut) {
                    revertFunc();
                    // reverting back to it's original position
                    return false;
                }
            }
			// CICO-30310
            if (event.id === 'check-in' && $scope.stayDetails.details.reservation_status === 'CHECKEDIN') {
                revertFunc();
                return false;
            }
			// Events other than check-in and checkout should not be drag and droped
            if (event.id !== 'check-in' && event.id !== 'check-out') {
                revertFunc();
                return false;
            }

            if (event.id === 'check-in') {
				// checkin type date draging after checkout date wil not be allowed
                if (newDateSelected > $scope.checkoutDateInCalender) {
                    revertFunc();
                    return false;
                }
                finalCheckin = newDateSelected.clone();
                finalCheckout = $scope.checkoutDateInCalender.clone();
            } else if (event.id === 'check-out') {
				// checkout date draging before checkin date wil not be allowed
                if (newDateSelected < $scope.checkinDateInCalender) {
                    revertFunc();
                    return false;
                }
				// also before current busines date also not allowed
                if (newDateSelected.getTime() < currentBusinessDate.getTime()) {
                    revertFunc();
                    return false;
                }
                finalCheckin = $scope.checkinDateInCalender.clone();
                finalCheckout = newDateSelected.clone();
            }
			// we are re-assinging our new checkin/checkout date for calendar
            $scope.checkinDateInCalender = finalCheckin;
            $scope.checkoutDateInCalender = finalCheckout;

            $scope.events = $scope.getEventSourceObject($scope.checkinDateInCalender, $scope.checkoutDateInCalender, dest.onlyCheckOut);
            $scope.eventSources.length = 0;
            $scope.eventSources.push($scope.events);

			// For non standalone PMS the restrications are calculated from the
			// initital calendar data returned by server
            if (!$rootScope.isStandAlone) {
				// Check if the stay range is restricted, if so display a restrication message
                if (that.isStayRangeRestricted($scope.checkinDateInCalender,
						$scope.checkoutDateInCalender)) {
                    that.showRestrictedStayRange();
                    return false;
                }

            } else if (RESV_LIMIT < moment($scope.checkoutDateInCalender).diff(moment($scope.checkinDateInCalender), 'days')) {
                // CICO-47538 For standalone properties ensure the stay doesn't exceed 92 days
                $scope.rightSideReservationUpdates = 'MAX_LENGTH_EXCEEDED';
                $scope.refreshMyScroller();
                return false;
            }

			// calling the webservice for to check the availablity of rooms on these days
            var getParams = {
                'arrival_date': getDateString($scope.checkinDateInCalender),
                'dep_date': getDateString($scope.checkoutDateInCalender),
                'reservation_id': $scope.stayDetails.calendarDetails.reservation_id
            };

            $scope.invokeApi(RVChangeStayDatesSrv.checkUpdateAvaibale,
                getParams, $scope.successCallbackCheckUpdateAvaibale,
                $scope.errorCallbackCheckUpdateAvaibale);

        };

		/**
		 * function to check the stayrange restricted between dates
		 * We iterate through each day and see if any restriction is applied
		 */
        this.isStayRangeRestricted = function(checkinDate, checkoutDate) {
            var checkinTime = checkinDate.clone().setHours(0, 0, 0);
            var checkoutTime = checkoutDate.clone().setHours(0, 0, 0);
            var thisTime = '';
            var totalNights = 0;
            var minNumOfStay = '';

            $($scope.stayDetails.calendarDetails.available_dates).each(function(index) {
				// Put time correction
                thisTime = tzIndependentDate(this.date).setHours(0, 0, 0);
				// We calculate the minimum length of stay restriction
				// by reffering to the checkin day
                if (this.date === getDateString(checkinDate)) {
                    $(this.restriction_list).each(function(index) {
                        if (this.restriction_type === 'MINIMUM_LENGTH_OF_STAY') {
                            minNumOfStay = this.number_of_days;
                        }
                    });
                }
				// Get the number of nights of stay.
                if (thisTime < checkinTime || thisTime >= checkoutTime) {
                    return true;
                }
                totalNights++;
            });
            if (totalNights < minNumOfStay) {
                return true;
            } 
            return false;
			
        };

		/**
		 * Checks whether the given date string is equal to the group end date
		 */
        var isGroupEndDate = function (dateStr, checkoutDate) {	
            return dateStr === checkoutDate;		
        };

        /**
         * Get the event source object for the calendar
         * @param {Date} checkinDate - check in date of the reservation
         * @param {Date} checkoutDate - check out date of the reservation
         * @param {Boolean} skipAddingLastDate - flag to indicate whether the last unavailable date should be added or not to the list of available dates shown in calendar
         * @return {Array} events - array of event sources
         */
        $scope.getEventSourceObject = function(checkinDate, checkoutDate, skipAddingLastDate) {
			/**
			 * CICO-19733
			 * Kindly note that the API (calendar.json) now returns all the dates in the range
			 * Three new params added to the API:
			 * 			is_house_available: true/false
			 *  		is_room_type_available: true/false
			 *  		is_restricted: true/false
			 */

            var events = [],
                calEvt = {},
                reservationStatus = $scope.stayDetails.calendarDetails.reservation_status,
				// Check the permissions the user has
                canOverbookHouse = rvPermissionSrv.getPermissionValue('OVERBOOK_HOUSE'),
                canOverbookRoomType = rvPermissionSrv.getPermissionValue('OVERBOOK_ROOM_TYPE'),
                canBookRestrictedRate = rvPermissionSrv.getPermissionValue('BOOK_RESTRICTED_ROOM_RATE'),
				// Introducing this variable to ensure that in case of user having no permissions to go beyond; hide further dates
                extendThrough = true,
                thisDate,
                firstUnavailableDate,
                isCheckoutDateAvailable = true;

			// Reset validDays array
            $scope.stayDetails.validDays = [];

            _.each($scope.stayDetails.calendarDetails.available_dates, function(availableDateData) {
                _.each($scope.stayDetails.calendarDetails.stay_dates, function(stayDateData) {
                    if (availableDateData.date === stayDateData.date) {
                        availableDateData.rate = stayDateData.rate;
                    }
                });
            });

            $($scope.stayDetails.calendarDetails.available_dates).each(function(index) {				
                var preventOverbookHouse = !this.is_house_available && !canOverbookHouse && $rootScope.isStandAlone,
                    preventOverbookRoomType = !this.is_room_type_available && !canOverbookRoomType,
                    preventBookingRestrictedRate = this.is_restricted && !canBookRestrictedRate,
                    preventSuiteRoomOverBook = $scope.reservation.reservation_card.is_suite &&
                                               !$scope.reservation.reservation_card.group_id && !this.is_room_type_available,
                    preventGroupSuiteRoomOverBook = $scope.reservation.reservation_card.is_suite &&
                                                    !!$scope.reservation.reservation_card.group_id && 
                                                    !this.is_room_type_available && !this.is_house_available &&
                                                    !isGroupEndDate(this.date, $scope.reservation.reservation_card.group_block_to); // CICO-47200

                calEvt = {};
				

				// Fixing the timezone issue related with fullcalendar
                thisDate = tzIndependentDate(this.date);
                if (this.is_sr === 'true') {
                    calEvt.title = $filter('translate')('SUPPRESSED_RATES_TEXT');
                } else {
                    if (Number(this.rate) > 0) {
                        if (this.rate_currency !== null) {
                            calEvt.title = this.rate_currency + Math.round(this.rate);
                        } else {
                            calEvt.title = $rootScope.currencySymbol + Math.round(this.rate);
                        }
                    } else {
                        calEvt.title = '';
                    }
                }
                calEvt.start = thisDate;
                calEvt.end = thisDate;
                calEvt.day = thisDate.getDate().toString();

				// Event is check-in
                if (thisDate.getTime() === checkinDate.getTime()) {
                    calEvt.id = 'check-in';
                    calEvt.className = 'check-in';
                    if (reservationStatus !== 'CHECKEDIN' && reservationStatus !== 'CHECKING_OUT') {
                        calEvt.startEditable = 'true';
                    }
                    calEvt.durationEditable = 'false';

					// If check-in date and check-out dates are the same, show split view.
                    if (checkinDate.getTime() === checkoutDate.getTime()) {
                        calEvt.className = 'check-in split-view';
                        events.push(calEvt);
						// checkout-event
                        calEvt = {};
                        if (this.is_sr === 'true') {
                            calEvt.title = $filter('translate')('SUPPRESSED_RATES_TEXT');
                        } else {
                            if (Number(this.rate) > 0) {
                                if (this.rate_currency !== null) {
                                    calEvt.title = this.rate_currency + Math.round(this.rate);
                                } else {
                                    calEvt.title = $rootScope.currencySymbol + Math.round(this.rate);
                                }
                            } else {
                                calEvt.title = '';
                            }                            
                        }
                        calEvt.start = thisDate;
                        calEvt.end = thisDate;
                        calEvt.day = thisDate.getDate().toString();
                        calEvt.id = 'check-out';
                        calEvt.className = 'check-out split-view';
                        calEvt.startEditable = 'true';
                        calEvt.durationEditable = 'false';
                    }

					// mid-stay range
                } else if (thisDate.getTime() > checkinDate.getTime() && thisDate.getTime() < checkoutDate.getTime()) {
                    calEvt.id = 'mid-stay' + index; // Id should be unique
                    calEvt.className = 'mid-stay';
					// Event is check-out
                } else if (thisDate.getTime() === checkoutDate.getTime()) {
                    calEvt.id = 'check-out';
                    calEvt.className = 'check-out';
                    calEvt.startEditable = 'true';
                    calEvt.durationEditable = 'false';
                    
                    isCheckoutDateAvailable = !(preventGroupSuiteRoomOverBook || preventSuiteRoomOverBook || 
                                                preventOverbookHouse || preventBookingRestrictedRate || preventOverbookRoomType);
                } else {
                    calEvt.id = 'availability' + index; // Id should be unique
                    calEvt.className = 'type-available';
                }
				// CICO-47200 - preventGroupSuiteRoomOverBook
                if (preventGroupSuiteRoomOverBook || preventSuiteRoomOverBook || preventOverbookHouse || 
					preventBookingRestrictedRate || preventOverbookRoomType) {
                    extendThrough = false;
                }

                if (extendThrough || ((thisDate.getTime() >= checkinDate.getTime()) && (thisDate.getTime() <= checkoutDate.getTime()))) {
                    events.push(calEvt);
                    $scope.stayDetails.validDays.push(this);
                } else if (!skipAddingLastDate && !firstUnavailableDate && (thisDate.getTime() > checkoutDate.getTime())) {
                    firstUnavailableDate = calEvt;
                }
                
            });

            if (firstUnavailableDate && isCheckoutDateAvailable) {
                // We usually revert the move date operation, when the new date is outside the check-in and check-out date.
                // Since the first available date will be outside the check-out date and we need to be able to extend the checkout date to 
                // that date, we use this flag to override that behaviour.
                firstUnavailableDate.onlyCheckOut = true;
                events.push(firstUnavailableDate);
            }
            return events;
        };

        $scope.refreshMyScroller = function() {
            setTimeout(function() {
                $scope.refreshScroller('edit_staydate_updatedDetails');
                $scope.refreshScroller('edit_staydate_calendar');
            }, 300);
        };


        var navigateToRateAndRates = function() {
            $state.go(roomAndRatesState, {
                from_date: $scope.confirmedCheckinDate,
                to_date: $scope.confirmedCheckoutDate,
                fromState: 'STAY_CARD',
                company_id: $scope.reservationData.company.id,
                travel_agent_id: $scope.reservationData.travelAgent.id,

				// Related to CICO-27413 & CICO-17973
				// group_id passing as '' => for normal reservation and group reservation
				// rooms and rates screen - No need of group id - for both normal grp res
				// If it is coming thru 'Find Rooms and Rates' button in change staydates screen
				// borrow_for_groups - this stateParam is used in rooms and rates screen to show/hide ceratin fields
				// borrow_for_groups - from this screen - if grp id present then this flag will be false
                group_id: '',
                borrow_for_groups: $scope.reservationData.group.id ? 'true' : 'false',
                room_type_id: $scope.reservationData.tabs[$scope.viewState.currentTab].roomTypeId,
                adults: $scope.reservationData.tabs[$scope.viewState.currentTab].numAdults,
                children: $scope.reservationData.tabs[$scope.viewState.currentTab].numChildren
            });
        };

        $rootScope.$on("changeRoomAndRates", function () {
            navigateToRateAndRates();
        }); 

        $scope.goToRoomAndRates = function() {
            navigateToRateAndRates();
        };

        $scope.alertOverbooking = function(close) {
            var timer = 0;

            if (close) {
                $scope.closeDialog();
                timer = 1000;
            }
            $timeout(navigateToRateAndRates, timer);
        };

        $scope.$on('$viewContentLoaded', function() {
            $scope.refreshMyScroller();
        });

        /**
         * Shows the overbooking alert while extending the stay
         */
        $scope.showOverBookingAlertForStayExtension = function() {
            ngDialog.open({
                template: '/assets/partials/reservation/alerts/overBookingAlertStayExtension.html',
                className: '',
                closeByDocument: false,
                scope: $scope
            });
        };

        /**
         * Shows pop up to remind update the billing info
         */
        $scope.showBillingInformationPrompt = function() {
            ngDialog.open({
                template: '/assets/partials/reservation/alerts/rvShowBillingInformationPopup.html',
                className: '',
                closeByDocument: false,
                scope: $scope
            });
        };

        /**
         * Proceed to overbooking while closing the overbooking alert
         */
        $scope.proceedToOverBooking = function() {
            $scope.showRoomAvailable();
            $scope.closeDialog();
        };

        this.initialise();

    }
]);
