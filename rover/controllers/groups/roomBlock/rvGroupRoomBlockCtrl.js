angular.module('sntRover').controller('rvGroupRoomBlockCtrl', [
    '$scope',
    '$rootScope',
    '$filter',
    'rvPermissionSrv',
    'ngDialog',
    'rvGroupConfigurationSrv',
    '$timeout',
    'rvUtilSrv',
    '$interval',
    '$q',
    'dateFilter',
    'Toggles',
    function($scope,
		$rootScope,
		$filter,
		rvPermissionSrv,
		ngDialog,
		rvGroupConfigurationSrv,
		$timeout,
		util,
	 	$interval,
		$q,
        dateFilter,
        Toggles) {

        var summaryMemento;
        var update_existing_reservations_rate = false;
        var roomsAndRatesSelected;

        var timeLineScrollEndReached = false,
            massUpdateOverbookingOccurs = false,
            lastCalledMassUpdateConfig = null;

        var SINGLE_DAY_IN_MS = 86400000;

		/**
		 * util function to check whether a string is empty
		 * @param {String/Object}
		 * @return {boolean}
		 */
        $scope.isEmpty = util.isEmpty;

		/**
		 * Function to decide whether to hide Hold status selection box
		 * if from date & to date is not defined,
		 * we will hide hold status area
		 * @return {Boolean}
		 */
        $scope.shouldHideHoldStatus = function() {
            var addModeCondition = !$scope.shouldHideCreateBlockButton() && $scope.isInAddMode();
            var editModeCondition = $scope.isInAddMode();

            return addModeCondition || editModeCondition;
        };

		/**
		 * Function to decide whether to hide rooms & pick up area
		 * if from date & to date is not defined and it is in Add mode will return true
		 * @return {Boolean}
		 */
        $scope.shouldHideRoomsAndPickUpArea = function() {
            var addModeCondition = !$scope.shouldHideCreateBlockButton() && $scope.isInAddMode();
            var editModeCondition = $scope.isInAddMode();

            return addModeCondition || editModeCondition;
        };

		/**
		 * Function to get whethere from date & to date is filled or not
		 * @return {Boolean}
		 */
        var startDateOrEndDateIsEmpty = function() {
            var isStartDateIsEmpty = $scope.isEmpty($scope.startDate.toString());
            var isEndDateIsEmpty = $scope.isEmpty($scope.endDate.toString());

            return isEndDateIsEmpty && isEndDateIsEmpty;
        };

		/**
		 * Function to decide whether to disable Create block button
		 * if from date & to date is not defined, will return true
		 * @return {Boolean}
		 */
        $scope.shouldDisableCreateBlockButton = function() {
            return startDateOrEndDateIsEmpty();
        };

		/**
		 * Function to decide whether to disable Update block button
		 * if nopermission to update grp summary
		 * @return {Boolean}
		 */
        $scope.shouldDisableUpdateBlockButton = function() {
            return !hasPermissionToEditSummaryGroup();
        };

		/**
		 * Function to decide whether to hide Create block button
		 * once click the create button, it become hidden
		 * @return {Boolean}
		 */
        $scope.shouldHideCreateBlockButton = function() {
            return $scope.createButtonClicked;
        };

		/**
		 * Function to decide whether to hide Update button
		 * if from date & to date is not defined will return true
		 * @return {Boolean}
		 */
        $scope.shouldHideUpdateButton = function() {
            return !$scope.createButtonClicked;
        };

		/**
		 * Function to decide whether to hide 'Add Rooms Button'
		 * @return {Boolean}
		 */
        $scope.shouldHideAddRoomsButton = function() {
            return $scope.groupConfigData.summary.is_cancelled ||
                    ($scope.isRoomViewActive && $scope.groupConfigData.summary.selected_room_types_and_bookings.length > 0) || 
                    (!$scope.isRoomViewActive && $scope.groupConfigData.summary.selected_room_types_and_daily_rates.length > 0);
        };

		/**
		 * Function to decide whether to hide 'Rooms and Rates Button'
		 * @return {Boolean}
		 */
        $scope.shouldShowRoomsRates = function() {
            if ($scope.isRoomViewActive) {
                return $scope.groupConfigData.summary.selected_room_types_and_bookings.length > 0;
            }
            return $scope.groupConfigData.summary.selected_room_types_and_daily_rates.length > 0;
            
        };

		/**
		 * we will change the total pickup rooms to readonly if it is on add mode
		 * @return {Booean}
		 */
        $scope.shouldChangeTotalPickUpToReadOnly = function() {
            return !$scope.isInAddMode();
        };

		/**
		 * we will change the total rooms to readonly if it is on add mode
		 * @return {Booean}
		 */
        $scope.shouldChangeTotalRoomsToReadOnly = function() {
            return !$scope.isInAddMode();
        };

		/**
		 * Has Permission To EditSummaryGroup
		 * @return {Boolean}
		 */
        var hasPermissionToEditSummaryGroup = function() {
            return rvPermissionSrv.getPermissionValue('EDIT_GROUP_SUMMARY');
        };

		/**
		 * CICO-16821: Check permission to overbook room type and house separately.
		 * @return {Boolean}
		 */
        var hasPermissionToOverBookRoomType = function() {
            return rvPermissionSrv.getPermissionValue('OVERBOOK_ROOM_TYPE');
        };

        var hasPermissionToOverBookHouse = function() {
            return rvPermissionSrv.getPermissionValue('OVERBOOK_HOUSE');
        };

		/**
		 * Function to decide whether to disable start date
		 * for now we are checking only permission
		 * @return {Boolean}
		 */
        $scope.shouldDisableStartDate = function() {
            var sData 					= $scope.groupConfigData.summary,
                noOfInhouseIsNotZero 	= sData.total_checked_in_reservations > 0,
                cancelledGroup 			= sData.is_cancelled,
                is_A_PastGroup 			= sData.is_a_past_group,
                inEditMode 				= !$scope.isInAddMode(),
                hasCheckedoutReservations = sData.total_checked_out_reservations_count > 0;

            return inEditMode &&
				   	(
				   	  noOfInhouseIsNotZero 	||
					  cancelledGroup 		||
                      is_A_PastGroup || 
                      hasCheckedoutReservations
					)
				   ;
        };

		/**
		 * Function to decide whether to disable hold status change
		 * if the permission is false will return true
		 * @return {Boolean}
		 */
        $scope.shouldDisableHoldStatusChange = function() {
            return !hasPermissionToEditSummaryGroup() || !!$scope.groupConfigData.summary.is_cancelled;
        };

		/**
		 * should we wanted to show the save button for room type booking change
		 * @return {Boolean}
		 */
        $scope.shouldShowSaveButton = function() {
            return $scope.hasBookingDataChanged && $scope.shouldHideAddRoomsButton();
        };

		/**
		 * should we wanted to show the save button for room type booking change
		 * @return {Boolean}
		 */
        $scope.shouldShowDiscardButton = function() {
            return $scope.hasBookingDataChanged && $scope.shouldHideAddRoomsButton();
        };

		/**
		 * Should we show buttons in roomblock
		 */
        $scope.shouldShowRoomBlockActions = function() {
            return !$scope.groupConfigData.summary.is_cancelled && $scope.shouldHideAddRoomsButton();
        };

		/**
		 * Function to decide whether to disable end date
		 * for now we are checking only permission
		 * @return {Boolean}
		 */
        $scope.shouldDisableEndDate = function() {
            var sData 					= $scope.groupConfigData.summary,
                endDateHasPassed 		= new tzIndependentDate(sData.block_to) < new tzIndependentDate($rootScope.businessDate),
                cancelledGroup 			= sData.is_cancelled,
                inEditMode 				= !$scope.isInAddMode();

            return inEditMode &&
                (
                    endDateHasPassed ||
                    cancelledGroup
                )
                ;
        };

		/**
		 * Has Permission To Create group room block
		 * @return {Boolean}
		 */
        var hasPermissionToCreateRoomBlock = function() {
            return rvPermissionSrv.getPermissionValue('CREATE_GROUP_ROOM_BLOCK');
        };


		/**
		 * Has Permission To Edit group room block
		 * @return {Boolean}
		 */
        var hasPermissionToEditRoomBlock = function() {
            return rvPermissionSrv.getPermissionValue('EDIT_GROUP_ROOM_BLOCK');
        };

		/**
		 * Function to decide whether to disable Add Rooms & Rates button
		 * for now we are checking only permission
		 * @return {Boolean}
		 */
        $scope.shouldDisableAddRoomsAndRate = function() {
            return ( (!hasPermissionToCreateRoomBlock() &&
				!hasPermissionToEditRoomBlock()) || (!$scope.isRoomViewActive && $scope.groupConfigData.summary.selected_room_types_and_daily_rates.length === 0));
        };

        /**
		 * @return {Boolean} checking if the single entry row needs to be displayed
		 */
        $scope.shouldHideSingleEntryRow = function() {
            var hasScopeItems = !!$scope.roomtype_rate && $scope.groupConfigData;

            return hasScopeItems &&
                !! $scope.roomtype_rate.can_edit &&
                ! $scope.groupConfigData.summary.rate !== -1 &&
                !$scope.roomtype_rate.rate_config.is_single_rate_configured;
        };

        /**
		 * @return {Boolean} checking if the doulbe entry row needs to be displayed
		 */
        $scope.shouldHideDoubleEntryRow = function() {
            var hasScopeItems = !!$scope.roomtype_rate && $scope.groupConfigData;

            return hasScopeItems &&
                !! $scope.roomtype_rate.can_edit &&
                ! $scope.groupConfigData.summary.rate !== -1 &&
                !$scope.roomtype_rate.rate_config.is_double_rate_configured;
        };

		/**
		 * well, do we wanted to show triple button
		 * if there is any key 'triple' found in room type.dates (array of objects),
		 * it means some entry is found
		 * @param {Object} - Room Type data row
		 * @return {Boolean}
		 */
        $scope.shouldShowTripleEntryRow = function(roomType) {
            var customRateSelected = parseInt($scope.groupConfigData.summary.rate) === -1,
                isBorrowedRoomType = roomType.can_edit === false;

            if ($scope.shouldShowQuadrupleEntryRow(roomType)) {
                return true;
            }
            else if (customRateSelected || isBorrowedRoomType) {
                var list_of_triples = _.pluck(roomType.dates, 'triple');

				// throwing undefined items
                list_of_triples = _.filter(list_of_triples, function(element) {
                    return typeof element !== 'undefined';
                });

                return list_of_triples.length > 0;
            } else {
                return roomType.rate_config.is_extra_adult_rate_configured &&
						roomType.rate_config.is_double_rate_configured;
            }
        };

		/**
		 * should we wanted to show quadruple button
		 * if there is any key 'quadruple' found in room type.dates (array of objects),
		 * it means some entry is found
		 * @param {Object} - Room Type data row
		 * @return {Boolean}
		 */
        $scope.shouldShowQuadrupleEntryRow = function(roomType) {
            var customRateSelected = parseInt($scope.groupConfigData.summary.rate) === -1,
                isBorrowedRoomType = roomType.can_edit === false;

            if (customRateSelected || isBorrowedRoomType) {
                var list_of_quadruples = _.pluck(roomType.dates, 'quadruple');

				// throwing undefined items
                list_of_quadruples = _.filter(list_of_quadruples, function(element) {
                    return typeof element !== 'undefined';
                });

                return list_of_quadruples.length > 0;
            } else {
                return roomType.rate_config.is_extra_adult_rate_configured &&
						roomType.rate_config.is_double_rate_configured;
            }
        };

		/**
		 * To add triple entry row to a room type
		 * @return undefined
		 */
        $scope.addTripleEntryRow = function(roomType) {
            if (!!$scope.groupConfigData.summary.is_cancelled || !roomType.can_edit) {
                return false;
            }
            _.each(roomType.dates, function(element) {
                element.triple = 0;
                element.triple_pickup = 0;
            });

			// we added something
            $scope.bookingDataChanging();
            refreshScroller();
        };

		/**
		 * To add quadruple entry row to a room type
		 * @return undefined
		 */
        $scope.addQuadrupleEntryRow = function(roomType) {
            if (!!$scope.groupConfigData.summary.is_cancelled || !roomType.can_edit) {
                return false;
            }
            _.each(roomType.dates, function(element) {
                element.quadruple = 0;
                element.quadruple_pickup = 0;
            });

			// we added something
            $scope.bookingDataChanging();
            refreshScroller();
        };

		/**
		 * should we wanted to disable single box entry
		 * @param {Object} [dateData] [description]
		 * @param {Object} - Room Type data row
		 * @return {Boolean}
		 */
        $scope.shouldDisableSingleEntryBox = function(dateData, roomType) {
            return !roomType.can_edit || !!$scope.groupConfigData.summary.is_cancelled || !dateData.isModifiable;
        };

		/**
		 * should we wanted to disable double box entry
		 * @param {Object} [dateData] [description]
		 * @param {Object} - Room Type data row
		 * @return {Boolean}
		 */
        $scope.shouldDisableDoubleEntryBox = function(dateData, roomType) {
            // Fix for CICO-35779 added.
            return !roomType.can_edit || !!$scope.groupConfigData.summary.is_cancelled || !dateData.isModifiable;
        };

		/**
		 * should we wanted to disable triple box entry
		 * @param {Object} [dateData] [description]
		 * @param {Object} - Room Type data row
		 * @return {Boolean}
		 */
        $scope.shouldDisableTripleEntryBox = function(dateData, roomType) {
            // Fix for CICO-35779 added.
            return !roomType.can_edit || !!$scope.groupConfigData.summary.is_cancelled || !dateData.isModifiable;
        };

		/**
		 * should we wanted to disable Quadruple box entry
		 * @param {Object} [dateData] [description]
		 * @param {Object} - Room Type data row
		 * @return {Boolean}
		 */
        $scope.shouldDisableQuadrupleEntryBox = function(dateData, roomType) {
            // Fix for CICO-35779 added.
            return !roomType.can_edit || !!$scope.groupConfigData.summary.is_cancelled || !dateData.isModifiable;
        };

		/**
		 * should we wanted to disable add triple button
		 * @param {Object} [dateData] [description]
		 * @param {Object} - Room Type data row
		 * @return {Boolean}
		 */
        $scope.shouldDisableAddTripleButton = function(roomType) {
            return !roomType.can_edit || !!$scope.groupConfigData.summary.is_cancelled;
        };

		/**
		 * should we wanted to disable add triple button
		 * @param {Object} [dateData] [description]
		 * @param {Object} - Room Type data row
		 * @return {Boolean}
		 */
        $scope.shouldDisableAddQuadrupleButton = function(roomType) {
            return !roomType.can_edit || !!$scope.groupConfigData.summary.is_cancelled;
        };

		/**
		 * to copy the single & single_pick up value entered in the column
		 * to the row
		 * @param {Object} - cell data
		 * @param {Object} - row data
		 * @return undefined
		 */
        $scope.copySingleValueToOtherBlocks = function(cellData, rowData) {
            _.each(rowData.dates, function(element) {
                if (!element.is_shoulder_date) {
                    element.single = cellData.single;
                    element.single_pickup = cellData.single_pickup;
                }
            });

            var data = {
                occupancy: 'single',
                value: cellData.single
            };

            $scope.selectedRoomType = rowData;
            $scope.showMassUpdateEndDateConfirmation(data);
			// we chnged something
            $scope.bookingDataChanging();
        };

		/**
		 * to copy the double & double_pick up value entered in the column
		 * to the row
		 * @param {Object} - cell data
		 * @param {Object} - row data
		 * @return undefined
		 */
        $scope.copyDoubleValueToOtherBlocks = function(cellData, rowData) {
            _.each(rowData.dates, function(element) {
                element.double = cellData.double;
                element.double_pickup = cellData.double_pickup;
            });

            var data = {
                occupancy: 'double',
                value: cellData.double
            };

            $scope.selectedRoomType = rowData;
            $scope.showMassUpdateEndDateConfirmation(data);
			// we chnged something
            $scope.bookingDataChanging();
        };

		/**
		 * to copy the triple & triple_pick up value entered in the column
		 * to the row
		 * @param {Object} - cell data
		 * @param {Object} - row data
		 * @return undefined
		 */
        $scope.copyTripleValueToOtherBlocks = function(cellData, rowData) {
            _.each(rowData.dates, function(element) {
                element.triple = cellData.triple;
                element.triple_pickup = cellData.triple_pickup;
            });

            var data = {
                occupancy: 'triple',
                value: cellData.triple
            };

            $scope.selectedRoomType = rowData;
            $scope.showMassUpdateEndDateConfirmation(data);
			// we chnged something
            $scope.bookingDataChanging();
        };

		/**
		 * to copy the quadruple & quadruple_pick up value entered in the column
		 * to the row
		 * @param {Object} - cell data
		 * @param {Object} - row data
		 * @return undefined
		 */
        $scope.copyQuadrupleValueToOtherBlocks = function(cellData, rowData) {
            _.each(rowData.dates, function(element) {
                element.quadruple = cellData.quadruple;
                element.quadruple_pickup = cellData.quadruple_pickup;
            });

            var data = {
                occupancy: 'quadruple',
                value: cellData.quadruple
            };

            $scope.selectedRoomType = rowData;
            $scope.showMassUpdateEndDateConfirmation(data);
			// we chnged something
            $scope.bookingDataChanging();
        };

		/**
		 * Shows the confirmation popup with ability to select an end date defaulting to allotment
		 * end date for mass update.
		 */
        $scope.showMassUpdateEndDateConfirmation = function(data) {
            $scope.overBookingMessage = '';
            setDatePickers();

            ngDialog.open({
                template: '/assets/partials/groups/roomBlock/rvGroupConfirmMassUpdatePopup.html',
                scope: $scope,
                className: '',
                closeByDocument: false,
                closeByEscape: false,
                data: JSON.stringify(data)
            });
        };

		/**
		 * Return true when user reaches end of horizontal scroll.
		 * @return {Boolean}
		 */
        $scope.shouldShowLoadNextSetButton = function() {
            var nextStart = new tzIndependentDate($scope.timeLineStartDate),
                endDate = $scope.groupConfigData.summary.shoulder_to_date || $scope.groupConfigData.summary.block_to;

            nextStart.setDate(nextStart.getDate() + 14);
            var hasNextSet = nextStart < new tzIndependentDate(endDate);

            return timeLineScrollEndReached && hasNextSet && $scope.shouldShowRoomsRates();
        };

		/**
		 * function to load next 14 days data.
		 */
        $scope.fetchNextSetOfRoomBlockData = function() {
            $scope.timeLineStartDate.setDate($scope.timeLineStartDate.getDate() + 14);
            $scope.fetchCurrentSetOfRoomBlockData();
        };

        /**
         * 
         */
        var processTimeLineDates = function() {
            // for pagination in group room block CICO-20097
            var summary = $scope.groupConfigData.summary,
                perPage = 14; // days

            // shoulder_from_date and shoulder_to_date in summary are JS Date objects;
            // they are assigned at populateShoulderDates in rvGroupConfigurationSummaryTab controller

            // ensure the start and end dates are within the shoulder boundaries
            if (($scope.timeLineStartDate < summary.shoulder_from_date) || ($scope.timeLineStartDate < tzIndependentDate(summary.shoulder_from_date))) {
                $scope.timeLineStartDate = summary.shoulder_from_date;
            } else if (($scope.timeLineStartDate > summary.shoulder_to_date) || ($scope.timeLineStartDate > tzIndependentDate(summary.shoulder_to_date))) {
                $scope.timeLineStartDate = summary.shoulder_to_date;
            }

            // 14 days are shown by default.
            $scope.timeLineEndDate = moment($scope.timeLineStartDate).add(perPage, 'days');
            $scope.timeLineEndDate = $scope.timeLineEndDate.toDate();
            // restrict end_date in request to shoulder boundary
            if (($scope.timeLineEndDate > summary.shoulder_to_date) || ($scope.timeLineEndDate > tzIndependentDate(summary.shoulder_to_date))) {
                $scope.timeLineEndDate = summary.shoulder_to_date;
            }

        };

        $scope.fetchCurrentSetOfRoomBlockData = function() {
			processTimeLineDates();

            $scope.fetchRoomBlockGridDetails({
                start_date: formatDateForAPI($scope.timeLineStartDate),
                end_date: formatDateForAPI($scope.timeLineEndDate)
            });
        };

        var formatDateForAPI = function(date) {
            return $filter('date')(date, $rootScope.dateFormatForAPI);
        };

		/**
		 * Function to fire when user selects date
		 * @return {undefined}
		 */
        $scope.onTimeLineStartDatePicked = function(date, datePickerObj) {
            $scope.timeLineStartDate = new tzIndependentDate(util.get_date_from_date_picker(datePickerObj));
            if ($scope.isRoomViewActive) {
                $scope.fetchCurrentSetOfRoomBlockData();
            } else {
                $scope.fetchRoomTypesDailyRates(); 
            }
        };

		/**
		 * Function to fire when user selects end date for mass update
		 * @return {undefined}
		 */
        $scope.onMassUpdateEndDatePicked = function (date, datePickerObj) {
            $scope.massUpdateEndDate = new tzIndependentDate(util.get_date_from_date_picker(datePickerObj));
        };

        /**
         * Function to fire when user selects end date for mass rate update
         */
        $scope.onMassRateUpdateEndDatePicked = function (date, datePickerObj) {
            $scope.massRateUpdateEndDate = new tzIndependentDate(util.get_date_from_date_picker(datePickerObj));
        };

		/**
		 * when the booking data changing
		 * @return undefined
		 */
        $scope.bookingDataChanging = function() {
			// we are changing the model to
            $scope.hasBookingDataChanged = true;
            runDigestCycle();
            $scope.getTotalBookedRooms();
        };

		/**
		 * to run angular digest loop,
		 * will check if it is not running
		 * return - None
		 */
        var runDigestCycle = function() {
            if (!$scope.$$phase) {
                $scope.$digest();
            }
        };

		/**
		 * when the start Date choosed,
		 * will assign fromDate to using the value got from date picker
		 * will change the min Date of end Date
		 * return - None
		 */
        var onStartDatePicked = function(date, datePickerObj) {
            $scope.startDate = new tzIndependentDate(util.get_date_from_date_picker(datePickerObj));
            $scope.groupConfigData.summary.block_from = $scope.startDate;

			// referring data source
            var refData 		= $scope.groupConfigData.summary,
                newBlockFrom 	= refData.block_from,
                oldBlockFrom	= new tzIndependentDate(summaryMemento.block_from),
                chActions 		= $scope.changeDatesActions;

            if (refData.release_date.toString().trim() === '') {
                $scope.groupConfigData.summary.release_date = refData.block_from;
            }
			// if it is is Move Date mode
            if ($scope.changeDatesActions.isInCompleteMoveMode()) {
                var originalStayLength = util.getDatesBetweenTwoDates (new tzIndependentDate(util.deepCopy(summaryMemento.block_from)), new tzIndependentDate(util.deepCopy(summaryMemento.block_to))).length - 1;

                $scope.groupConfigData.summary.block_to = new tzIndependentDate(util.get_date_from_date_picker(datePickerObj));
                $scope.groupConfigData.summary.block_to.setDate(refData.block_to.getDate() + originalStayLength);
                $scope.endDate = $scope.groupConfigData.summary.block_to;
				// for goto and mass update calender popup on group move
                $scope.timeLineStartDate = $scope.groupConfigData.summary.block_from;
                $scope.timeLineEndDate = $scope.endDate;
                $scope.massUpdateEndDate = new tzIndependentDate($scope.endDate - 86400000);
            }

			// arrival left date change
            else if (newBlockFrom < oldBlockFrom && chActions.arrDateLeftChangeAllowed()) {
                triggerEarlierArrivalDateChange();

            }

			// arrival right date change
            else if (newBlockFrom > oldBlockFrom && chActions.arrDateRightChangeAllowed()) {
				// check move validity
                if (new tzIndependentDate(refData.first_dep_date) < newBlockFrom) {
                    triggerLaterArrivalDateChangeInvalidError();
                }
                else {
                    triggerLaterArrivalDateChange();
                }
            }

			// let the date update if it is future group as well is in edit mode
            else if (!$scope.isInAddMode() && !refData.is_a_past_group) {
                $timeout(function() {
                    var options = {},
                        requestData = {};

                    requestData.changeInArr = true;
                    requestData.oldFromDate = oldBlockFrom;
                    requestData.fromDate = newBlockFrom;
                    options['dataset'] = requestData;
                    options['successCallBack'] = successCallBackOfEarlierArrivalDateChange;
                    options['failureCallBack'] = failureCallBackOfEarlierArrivalDateChange;

                    $scope.setCallBacks(options);
                    $scope.callChangeDatesAPI(options);

                }, 100);
            }

			// we will clear end date if chosen start date is greater than end date
            if ($scope.startDate > $scope.endDate) {
                $scope.endDate = '';
            }
			// setting the min date for end Date
            $scope.endDateOptions.minDate = $scope.startDate;

            // make room view active
            $scope.isRoomViewActive = true;
			// we have to show create button


            runDigestCycle();
        };

        /**
         * Check whether a group is completely past
         */
        var isCompletelyPastGroup = function() {
            var businessDate = tzIndependentDate($rootScope.businessDate),
                shoulderEndDate = $scope.groupConfigData.summary.shoulder_to_date;

            if (typeof shoulderEndDate === 'string' || shoulderEndDate instanceof String) {
                shoulderEndDate = new tzIndependentDate(shoulderEndDate);
            }

            return shoulderEndDate <= businessDate;

        };

		/**
		 * when the end Date choosed,
		 * will assign endDate to using the value got from date picker
		 * return - None
		 */
        var onEndDatePicked = function(date, datePickerObj) {
            $scope.endDate = new tzIndependentDate(util.get_date_from_date_picker(datePickerObj));
            $scope.groupConfigData.summary.block_to = $scope.endDate;
            var shoulderEndDate = $scope.endDate.addDays(parseInt($scope.groupConfigData.summary.shoulder_to));

            $scope.groupConfigData.summary.shoulder_to_date = $filter('date')(shoulderEndDate, $rootScope.dateFormatForAPI);

			// referring data source
            var refData 	= $scope.groupConfigData.summary,
                newBlockTo 	= refData.block_to,
                oldBlockTo	= new tzIndependentDate(summaryMemento.block_to),
                chActions 	= $scope.changeDatesActions;

			// departure left date change
            if (newBlockTo < oldBlockTo && chActions.depDateLeftChangeAllowed()) {
				// check move validity
                if (new tzIndependentDate(refData.last_arrival_date) > newBlockTo)
    {triggerEarlierDepartureDateChangeInvalidError();}
                else
					{triggerEarlierDepartureDateChange();}
            }

			// departure right date change
            else if (newBlockTo > oldBlockTo && chActions.depDateRightChangeAllowed()) {
                triggerLaterDepartureDateChange();
            }

			// let the date update if it is future group as well is in edit mode
            else if (!$scope.isInAddMode() && !isCompletelyPastGroup() ) {
                $timeout(function() {
                    var options = {},
                        requestData = {};

                    requestData.changeInDep = true;
                    requestData.oldToDate = oldBlockTo;
                    requestData.toDate = newBlockTo;
                    options['dataset'] = requestData;
                    options['successCallBack'] = successCallBackOfLaterDepartureDateChange;
                    options['failureCallBack'] = failureCallBackOfLaterDepartureDateChange;

                    $scope.setCallBacks(options);
                    $scope.callChangeDatesAPI(options);


					// for updating the room block after udating the summary
                    $scope.hasBlockDataUpdated = true; // as per variable name, it should be false, but in this contrler it should be given as true other wise its not working
                }, 100);
            }

			// setting the max date for start Date
            $scope.startDateOptions.maxDate = $scope.endDate;

			// we have to show create button


            runDigestCycle();
        };

		/**
		 * every logic to disable the from date picker should be here
		 * @return {Boolean} [description]
		 */
        var shouldDisableStartDatePicker = function() {
            var sData 					= $scope.groupConfigData.summary,
                noOfInhouseIsNotZero 	= sData.total_checked_in_reservations > 0,
                cancelledGroup 			= sData.is_cancelled,
                is_A_PastGroup 			= sData.is_a_past_group,
                inEditMode 				= !$scope.isInAddMode();

            return inEditMode &&
				   	(
				   	  noOfInhouseIsNotZero 	||
					  cancelledGroup 		||
					  is_A_PastGroup
					)
				   ;
        };

		/**
		 * every logic to disable the end date picker should be here
		 * @return {Boolean} [description]
		 */
        var shouldDisableEndDatePicker = function() {
            var sData 					= $scope.groupConfigData.summary,
                endDateHasPassed 		= new tzIndependentDate(sData.block_to) < new tzIndependentDate($rootScope.businessDate),
                cancelledGroup 			= sData.is_cancelled,
                inEditMode 				= !$scope.isInAddMode();

            return inEditMode &&
                (
                    endDateHasPassed ||
                    cancelledGroup
                )
                ;
        };

        // Get timeline min date
        var getTimeLineMinDate = function () {
                var shoulderStartDate = new tzIndependentDate($scope.groupConfigData.summary.shoulder_from_date),
                    minDate;

                if (shoulderStartDate) {
                    minDate = shoulderStartDate;
                }

                if (!minDate) {
                    minDate = new tzIndependentDate($rootScope.businessDate);
                }

                return minDate;
            
            },
            // Get time line max date
            getTimeLineMaxDate = function () {
                var shoulderEndDate = new tzIndependentDate($scope.groupConfigData.summary.shoulder_to_date),
                    maxDate;

                if (shoulderEndDate) {
                    maxDate = new tzIndependentDate(shoulderEndDate - 86400000);
                }

                if (!maxDate) {
                    maxDate = new tzIndependentDate($scope.endDate - 86400000);
                }

                return maxDate;
            },
            // Get default end date min date
            getEndDateMinDate = function(startDate) {
                var minDate = startDate;

                if (!startDate || (startDate < tzIndependentDate($rootScope.businessDate))) {
                    minDate = new tzIndependentDate($rootScope.businessDate);
                } 

                return minDate;
            };

		/**
		 * function used to set date picker
		 * will create date picker options & initial values
		 * @return - None
		 */
        var setDatePickers = function() {

			// default start date
            $scope.startDate = '';

			// default to date
            $scope.endDate = '';
            var maxEndDate = '';

			// referring data model -> from group summary
            var refData = $scope.groupConfigData.summary;

			// default to goto date
            if (!$scope.timeLineStartDate) {
                $scope.timeLineStartDate = refData.block_from !== '' ? new tzIndependentDate(refData.block_from) : new tzIndependentDate($rootScope.businessDate);
            }

            $scope.timeLineEndDate = new tzIndependentDate(refData.block_to);


			// if from date is not null from summary screen, we are setting it as busines date
            if (!$scope.isEmpty(refData.block_from.toString())) {
                $scope.startDate = refData.block_from;
            }

			// if to date is null from summary screen, we are setting it from date
            if (!$scope.isEmpty(refData.block_to.toString())) {
                $scope.endDate = refData.block_to;
                maxEndDate = new tzIndependentDate($scope.endDate - 86400000);
            }

            $scope.massUpdateEndDate = maxEndDate;

			// date picker options - Common
            var commonDateOptions = {
                dateFormat: $rootScope.jqDateFormat,
                numberOfMonths: 1
            };

			// date picker options - Start Date
            $scope.startDateOptions = _.extend({
                minDate: new tzIndependentDate($rootScope.businessDate),
                maxDate: $scope.groupConfigData.summary.block_to,
                disabled: shouldDisableStartDatePicker(),
                onSelect: onStartDatePicked
            }, commonDateOptions);

			// date picker options - End Date
            $scope.endDateOptions = _.extend({
                minDate: getEndDateMinDate($scope.startDate),
                disabled: shouldDisableEndDatePicker(),
                onSelect: onEndDatePicked
            }, commonDateOptions);

			// date picker options - Goto Date
            $scope.timeLineStartDateOptions = _.extend({
                minDate: getTimeLineMinDate(),
                maxDate: getTimeLineMaxDate(),
                onSelect: $scope.onTimeLineStartDatePicked
            }, commonDateOptions);

			// date picker options - mass update end Date
            $scope.massUpdateEndDateOptions = _.extend({
                minDate: refData.block_from !== '' ? new tzIndependentDate(refData.block_from) : new tzIndependentDate($rootScope.businessDate),
                maxDate: maxEndDate,
                onSelect: $scope.onMassUpdateEndDatePicked
            }, commonDateOptions);

            var massRateUpdateEndDateOptionMinDate = function() {
                 var businessDate = new tzIndependentDate($rootScope.businessDate),
                    minDate = businessDate;

                    if (refData.shoulder_from_date !== '' && (tzIndependentDate(refData.shoulder_from_date) > businessDate)) {
                        minDate =  new tzIndependentDate(refData.shoulder_from_date);
                    }

                    return minDate;

                },
                massRateUpdateEndDateOptionMaxDate = new tzIndependentDate(refData.shoulder_to_date - SINGLE_DAY_IN_MS);

            // Mass rate update end date options
            $scope.massRateUpdateEndDateOptions = _.extend({
                minDate: massRateUpdateEndDateOptionMinDate(),
                maxDate: massRateUpdateEndDateOptionMaxDate,
                onSelect: $scope.onMassRateUpdateEndDatePicked
            }, commonDateOptions);

            $scope.massRateUpdateEndDate = massRateUpdateEndDateOptionMaxDate;

        };

		/**
		 * when create button clicked, we will show the 'Hold Status and more section'
		 * @return None
		 */
        $scope.clickedOnCreateButton = function() {
            $scope.createButtonClicked = true;
        };


		/**
		 * when save button clicked,
		 * @return None
		 */
        $scope.clickedOnSaveButton = function() {
			// do not force overbooking for the first time
            // CICO-42325 Bring loader straight-away to protect from multi-clicks
            $scope.$emit('showLoader');
            $scope.saveRoomBlock(false);
        };

		/**
		 * when discard button clicked, we will set the booking data with old copy
		 * @return None
		 */
        $scope.clickedOnDiscardButton = function() {
            $scope.groupConfigData.summary.selected_room_types_and_bookings =
				util.deepCopy($scope.copy_selected_room_types_and_bookings);

			// and our isn't changed
            $scope.hasBookingDataChanged = false;
        };

        $scope.checkOverBooking = function(error) {
            var isHouseOverbooked  	 	= error.is_house_overbooked,
                isRoomTypeOverbooked   	= error.is_room_type_overbooked,
                canOverbookHouse		= hasPermissionToOverBookHouse(),
                canOverbookRoomType		= hasPermissionToOverBookRoomType(),
                canOverBookBoth			= canOverbookHouse && canOverbookRoomType;

            if ( !(isRoomTypeOverbooked || isHouseOverbooked) ) {
                return false;
            }

			// show appropriate overbook message.
            if (isHouseOverbooked && isRoomTypeOverbooked && canOverBookBoth) {
                return 'HOUSE_AND_ROOMTYPE_OVERBOOK';
            }
            else if (isRoomTypeOverbooked && canOverbookRoomType && (!isHouseOverbooked || (isHouseOverbooked && canOverbookHouse) )) {
                return 'ROOMTYPE_OVERBOOK';
            }
            else if (isHouseOverbooked && canOverbookHouse && (!isRoomTypeOverbooked || (isRoomTypeOverbooked && canOverbookRoomType) )) {
                return 'HOUSE_OVERBOOK';
            }
                        
			// Overbooking occurs and has no permission.
            else {
                return 'NO_PERMISSION_TO_OVERBOOK';
            }

        };

        var successCallBackOfSaveRoomBlock = function(data) {
			// CICO-18621: Assuming room block will be saved if I call
			// it with force flag.
            if (!data.saved_room_block) {
                $scope.saveRoomBlock(true);
                return false;
            }

			// we have saved everything we have
			// so our data is new
            $scope.copy_selected_room_types_and_bookings =
				angular.copy($scope.groupConfigData.summary.selected_room_types_and_bookings);

            $scope.hasBookingDataChanged = false;
            $scope.groupConfigData.summary.rooms_total = $scope.getMaxOfBookedRooms();

			// as per CICO-16087, we have to refetch the occupancy and availability after saving
			// so, callinng the API again
            $scope.fetchCurrentSetOfRoomBlockData();
        };

		/**
		 * Handles the failure case of inventory save
		 * A 407 status for response means overbooking occurs.
		 * @param 	{object} 	API response
		 * @returns {undefined}
		 */
        var failureCallBackOfSaveRoomBlock = function(error) {
            if (error.hasOwnProperty ('httpStatus')) {
                if (error.httpStatus === 470) {
                    var message = $scope.checkOverBooking(error);

                    if (!message) {
						// overbooking condition does not exist
                        $scope.saveRoomBlock(true);
                    }
                    else {
                        if (message === 'NO_PERMISSION_TO_OVERBOOK') {
                            showNoPermissionOverBookingPopup();
                        } else {
                            showOverBookingPopup(message);
                        }
                    }
                }
            } else {
                $scope.errorMessage = error;
            }
        };

		/**
		 * Method to make the API call to save the room block grid
		 * Will be called from
		 * 	1. The controller $scope.onBlockRoomGrid
		 * 	2. The warnReleaseRoomsPopup.html template
		 * @param {boolean} forceOverbook
		 * @return undefined
		 */
        $scope.saveRoomBlock = function(forceOverbook, isOverbooking) {
            forceOverbook = forceOverbook || false;

            $timeout(function() {
				// TODO : Make API call to save the room block.
                var params = {
                    group_id: $scope.groupConfigData.summary.group_id,
                    results: $scope.groupConfigData.summary.selected_room_types_and_bookings,
                    forcefully_overbook_and_assign_rooms: forceOverbook,
                    overbook_chosen: isOverbooking
                };

                var options = {
                    params: params,
                    successCallBack: successCallBackOfSaveRoomBlock,
                    failureCallBack: failureCallBackOfSaveRoomBlock
                };

                $scope.callAPI(rvGroupConfigurationSrv.saveRoomBlockBookings, options);
            }, 0);
        };

		/**
		 * Method to show oerbooking popup - No permission popup
		 * @return undefined
		 */
        var showNoPermissionOverBookingPopup = function() {
			// Show overbooking message
            ngDialog.open({
                template: '/assets/partials/groups/roomBlock/rvGroupNoPermissionOverBookingPopup.html',
                className: '',
                scope: $scope,
                closeByDocument: false,
                closeByEscape: false
            });
        };

		/**
		 * Method to show oerbooking popup
		 * @return undefined
		 */
        var showOverBookingPopup = function(message) {
			// Show overbooking message
            var dialogData = {
                message: message
            };

            ngDialog.open({
                template: '/assets/partials/groups/roomBlock/rvGroupWarnOverBookingPopup.html',
                className: '',
                scope: $scope,
                closeByDocument: false,
                closeByEscape: false,
                data: JSON.stringify(dialogData)
            });
        };

		/**
		 * To open Add Rooms & Rates popup
		 * @return - undefined
		 */
        var openAddRoomsAndRatesPopup = function() {
           // CICO-40537
           $rootScope.$broadcast('UPDATE_POPUP_STATE', { isActive: true}); 
            ngDialog.open({
                template: '/assets/partials/groups/roomBlock/rvGroupAddRoomAndRatesPopup.html',
                scope: $scope,
                controller: 'rvGroupAddRoomsAndRatesPopupCtrl',
                preCloseCallback: function() {
                    $rootScope.$broadcast('UPDATE_POPUP_STATE', { isActive: false}); 
                }
            });
        };

		/**
		 * to get the room type name against a room id
		 * @param  {Integer} id - of the room type
		 * @return {String}    Room type name, will return blank string if room type not found
		 */
        $scope.getRoomTypeName = function(id) {
            id = parseInt(id);
            var roomType = _.findWhere($scope.roomTypes, {
                id: id
            });

            if (roomType) {
                return roomType.name;
            }
            return '';
        };

		/**
		 * to get the total booked agsint a indivual room type
		 * @param {Object} - room type data
		 * @return {Integer}
		 */
        $scope.getTotalBookedOfIndividualRoomType = function(roomType) {
            var cInt = util.convertToInteger;

			// since user may have entered wrong input
            roomType.single = roomType.single !== '' ? cInt(roomType.single) : '';
            roomType.double = roomType.double !== '' ? cInt(roomType.double) : '';

			// the area of 'night watch man', they may be active or sleeping
            var quadruple = 0;

            if (roomType.quadruple) {
                roomType.quadruple = cInt(roomType.quadruple);
                quadruple = roomType.quadruple;
            }
            var triple = 0;

            if (roomType.triple) {
                roomType.triple = cInt(roomType.triple);
                triple = roomType.triple;
            }
            var totalIndividual = cInt(roomType.single) + cInt(roomType.double) + triple + quadruple;

            return totalIndividual;
        };

		/**
		 * to get the total picked up agsint a indivual room type
		 * @param {Object} - room type
		 * @return {Integer}
		 */
        $scope.getTotalPickedUpOfIndividualRoomType = function(roomType) {
            var cInt = util.convertToInteger;

			// since user may have entered wrong input
            roomType.single_pickup = roomType.single_pickup !== '' ? cInt(roomType.single_pickup) : '';
            roomType.double_pickup = roomType.double_pickup !== '' ? cInt(roomType.double_pickup) : '';

			// the area of 'night watch man', they may be active or sleeping
            var quadruple_pickup = 0;

            if (roomType.quadruple_pickup) {
                roomType.quadruple_pickup = cInt(roomType.quadruple_pickup);
                quadruple_pickup = roomType.quadruple_pickup;
            }
            var triple_pickup = 0;

            if (roomType.triple_pickup) {
                roomType.triple_pickup = cInt(roomType.triple_pickup);
                triple_pickup = roomType.triple_pickup;
            }

            return cInt(roomType.single_pickup) + cInt(roomType.double_pickup) + triple_pickup + quadruple_pickup;

        };

		/**
		 * To get the max booked rooms among dates
		 * @return {Integer}
		 */
        $scope.getMaxOfBookedRooms = function() {
            var ref = $scope.groupConfigData.summary.selected_room_types_and_bookings,
                totalBookedOfEachDate = [],
                arrayOfDateData = [],
                dateWiseGroupedData = {},
                sum = 0;

            if (!ref.length) {
                return 0;
            }
			// first of all, we need group by 'date' data as our current data is room type row based
			// we need these 'datewisedata' in single array
            _.each(ref, function(el) {
                _.each(el.dates, function(el1) {
                    arrayOfDateData.push(el1);
                });
            });

			// now we have all 'tomatoes' in a single bag
			// we are going to group by them on the basis of quality :D (date)
            dateWiseGroupedData = _.groupBy(arrayOfDateData, 'date');

			// forming sum of individual
            _.each(dateWiseGroupedData, function(el) {
                sum = 0;
                _.each(el, function(eachDateData) {
                    sum += $scope.getTotalBookedOfIndividualRoomType(eachDateData);
                });
                totalBookedOfEachDate.push(sum);
            });

			// returning max among them, simple
            var max = _.max(totalBookedOfEachDate);

            return max;
        };

		/**
		 * When availability and BAR fetch completed
		 * @param  {Objects} data of All Room Type
		 * @return undefined
		 */
        var successCallBackOfRoomTypeAndRatesFetch = function(data) {
            $scope.groupConfigData.summary.selected_room_types_and_rates = data.room_type_and_rates;
            _.each($scope.groupConfigData.summary.selected_room_types_and_rates, function(roomTypeInfo) {
                roomTypeInfo.isRateConfigured = roomTypeInfo.single_rate || roomTypeInfo.double_rate || roomTypeInfo.extra_adult_rate;
            });
        };

		/**
		 * When all things reqd to open popup is completed
		 * @return undefined
		 */
        var successFetchOfAllReqdForRoomAndRatesPopup = function() {
            $scope.$emit('hideLoader');
            openAddRoomsAndRatesPopup();
        };

		/**
		 * When any of the things reqd to open popup is failed
		 * @return undefined
		 */
        var failedToFetchAllReqdForRoomAndRatesPopup = function(errorMessage) {
            $scope.errorMessage = errorMessage;
            $scope.$emit('hideLoader');
        };

		/**
		 * when Add Room & Rates button clicked, we will fetch all room types, fetch BAR
		 * (BEST AVAILABLE RATE) & Availabiolity
		 * then we will show the Add Room & Rates popup
		 * @return None
		 */
        $scope.clickedOnAddRoomsAndRatesButton = function() {
			// if it has no permission to do this, we will not alloq
            var hasNoPermissionToProceed = $scope.shouldDisableAddRoomsAndRate();

            if (hasNoPermissionToProceed) {
                return;
            }

            var promises = [];
			// we are not using our normal API calling since we have multiple API calls needed

            $scope.$emit('showLoader');

			// get Room type & rates for this group
            var paramsForRoomTypeAndRates = {
                id: $scope.groupConfigData.summary.group_id
            };

            promises.push(rvGroupConfigurationSrv
				.getSelectedRoomTypesAndRates(paramsForRoomTypeAndRates)
				.then(successCallBackOfRoomTypeAndRatesFetch)
			);

			// Lets start the processing
            $q.all(promises)
				.then(successFetchOfAllReqdForRoomAndRatesPopup, failedToFetchAllReqdForRoomAndRatesPopup);
        };

		/**
		 * To open Room Block Pickedup Reservations Popup. Called from within the room and rates popup
		 */
        $scope.confirmUpdateRatesWithPickedReservations = function(selectedRoomTypeAndRates, data) {
            roomsAndRatesSelected = selectedRoomTypeAndRates;
            var data = data || {};

            ngDialog.open({
                template: '/assets/partials/groups/roomBlock/rvGroupRoomBlockPickedupReservationsPopup.html',
                scope: $scope,
                className: '',
                closeByDocument: false,
                closeByEscape: false,
                data: JSON.stringify(data)
            });
        };

		/**
		 * To check whether inhouse reservations exists.
		 */
        $scope.checkIfInhouseReservationsExists = function (dialogData) {
            ngDialog.close();
            var isInhouseReservationsExists = false;

            angular.forEach (roomsAndRatesSelected, function (row) {
                if (row.total_inhouse_reservations_count > 0) {
                    isInhouseReservationsExists = true;
                }
            });

            if (isInhouseReservationsExists) {
                openInhouseReservationsExistsPopup(dialogData);
            } else if (dialogData.isBulkUpdate) {
                performMassRateUpdateIfReservationExists(dialogData, true);
            } else if (dialogData.isGroupDailyRatesEnabled) {
                $scope.saveRoomTypesDailyRates();
            } else {
                $scope.saveNewRoomTypesAndRates();
            }
        };

		/*
		 * Open popup to inform if inhouse reservations exists.
		 */
        var openInhouseReservationsExistsPopup = function (dialogData) {
            var data = dialogData || {};

            ngDialog.open({
                template: '/assets/partials/groups/roomBlock/rvGroupInhouseReservationsExistsPopup.html',
                scope: $scope,
                className: '',
                closeByDocument: false,
                closeByEscape: false,
                data: JSON.stringify(data)
            });
        };

        /**
 		 * Perform update if inhouse reservation exists.
 		 */
         $scope.updateIfInHouseReservationExists = function(dialogData) {
            if (dialogData.isBulkUpdate) {
                performMassRateUpdateIfReservationExists(dialogData, true);
            } else if (dialogData.isGroupDailyRatesEnabled) {
                $scope.saveRoomTypesDailyRates();
            } else {
                $scope.saveNewRoomTypesAndRates();
            }
        };

		/*
		 * To apply rate change only to new reservations by setting flag update_existing_reservations_rate.
		 */
        $scope.updateRateToNewReservations = function (dialogData) {
            ngDialog.close();
            angular.forEach (roomsAndRatesSelected, function (row) {
                if (row.is_configured_in_group) {
                    row.update_existing_reservations_rate = false;
                }
            });
            if (dialogData.isBulkUpdate) {
                performMassRateUpdateIfReservationExists(dialogData, false);
            } else if (dialogData.isGroupDailyRatesEnabled) {
                $scope.saveRoomTypesDailyRates();
            } else {
                $scope.saveNewRoomTypesAndRates();
            }
        };

        /**
         * Perform mass update operation for rates if reservation exists
         */
         var performMassRateUpdateIfReservationExists = function(dialogData, shouldUpdateExistingReservationRate) {
            var value = dialogData.amount,
                groupShoulderFromDate = $scope.groupConfigData.summary.shoulder_from_date,
                timeLineStart = $scope.timeLineStartDate < groupShoulderFromDate ? groupShoulderFromDate : $scope.timeLineStartDate;

            var requestParams = {
                start_date: formatDateForAPI(timeLineStart),
                end_date: formatDateForAPI($scope.massRateUpdateEndDate),
                bulk_updated_for: dialogData.occupancy.toUpperCase(),
                room_type_id: $scope.selectedRoomType.room_type_id,
                amount: value,
                groupId: $scope.groupConfigData.summary.group_id,
                update_existing_reservations_rate: shouldUpdateExistingReservationRate
            };

            $scope.processMassRateUpdate(requestParams);
        };

		/**
		 * To update selected room types and rates.
		 */
        $scope.saveNewRoomTypesAndRates = function () {
            ngDialog.close();
            var options = {
                params: formSaveNewRoomTypesAndRatesParams(roomsAndRatesSelected),
                successCallBack: successCallBackOfSaveNewRoomTypesAndRates
            };

            $scope.callAPI(rvGroupConfigurationSrv.updateSelectedRoomTypesAndRates, options);
        };

        var successCallBackOfSaveNewRoomTypesAndRates = function () {
            if ($scope.isRoomViewActive) {
                $scope.fetchCurrentSetOfRoomBlockData();
            } else {
                $scope.fetchRoomTypesDailyRates();
            }
            
        };

		/**
		 * function to form save roomtype and rates API params
		 * @return {Object}
		 */
        var formSaveNewRoomTypesAndRatesParams = function(roomsAndRatesSelected) {
			// we only want rows who have room type choosed
            var selectedRoomTypeAndRates = _.filter(roomsAndRatesSelected, function(obj) {
                return typeof obj.room_type_id !== 'undefined' && obj.room_type_id !== '';
            });
			// since selectedRoomTypeAndRates containst some unwanted keys
            var wanted_keys = ['room_type_id', 'single_rate', 'double_rate', 'extra_adult_rate', 'rate_id', 'best_available_rate_id', 'update_existing_reservations_rate'];

            selectedRoomTypeAndRates = util.getListOfKeyValuesFromAnArray(selectedRoomTypeAndRates, wanted_keys);

            var params = {
                group_id: $scope.groupConfigData.summary.group_id,
                room_type_and_rates: selectedRoomTypeAndRates
            };

            return params;
        };


		/**
		 * when Add Room & Rates button clicked, we will save new room Block
		 * @return None
		 */
        $scope.clickedOnUpdateButton = function() {
			// we dont wanted to show room block details for some time
            $scope.groupConfigData.summary.selected_room_types_and_bookings = [];
            $scope.groupConfigData.summary.selected_room_types_and_occupanies = [];

			// unsetting the copied details
            $scope.copy_selected_room_types_and_bookings = [];

			// updating central model with newly formed data
            _.extend($scope.groupConfigData.summary, {
                block_from: $scope.startDate,
                block_to: $scope.endDate,
                hold_status: $scope.selectedHoldStatus
            });

			// callinng the update API calling
            $scope.updateGroupSummary();
			// has data updated from this view, block from date or to date
            $scope.hasBlockDataUpdated = true;
        };

        // Update time line dates
        var updateTimeLineDates = function () {
            $scope.timeLineStartDateOptions.minDate = getTimeLineMinDate();
            $scope.timeLineStartDateOptions.maxDate = getTimeLineMaxDate();
        };

		/**
		 * Success callback of room block details API
		 */
        var successCallBackOfFetchRoomBlockGridDetails = function(data) {

            // Fix for CICO-35779.
            var businessDate = new tzIndependentDate($rootScope.businessDate);

            // We have resetted the data.

            $scope.hasBookingDataChanged = false;

			// we need indivual room type total bookings of each date initially,
			// we are using this for overbooking calculation
            _.each(data.results, function(eachRoomType) {
                eachRoomType.start_date = formatDateForAPI($scope.timeLineStartDate);
                _.each(eachRoomType.dates, function(dateData) {
                    var formattedDate = new tzIndependentDate(dateData.date);

                    /* Fix for CICO-35779 - flag which denotes whether the fields are modifiable or not
                        based on comparison of the date with current business date.*/
                    dateData.isModifiable = formattedDate >= businessDate;
                    dateData.old_total = $scope.getTotalBookedOfIndividualRoomType(dateData);
				// need to keep track of old single,double and triple values
                });
            });

            $scope.groupConfigData.summary.selected_room_types_and_bookings = data.results;
            $scope.groupConfigData.summary.selected_room_types_and_occupanies = data.occupancy;

			// our total pickup count may change on coming from other tab (CICO-16835)
            $scope.totalPickups = data.total_picked_count;
            $scope.totalBlockedCount = data.total_blocked;
            $scope.groupConfigData.summary.rooms_total = data.total_blocked;
            
			// we need the copy of selected_room_type, we ned to use these to show save/discard button
            $scope.copy_selected_room_types_and_bookings = util.deepCopy(data.results);

            $scope.eventsCount = data.eventsCount;

            $scope.getTotalBookedRooms();

            // Need to update the timeline date options if shoulder dates have changed
            updateTimeLineDates();
			// we changed data, so
            refreshScroller();
        };

        /**
		 * Event propogated by ngrepeatend directive
		 * we used to hide activity indicator & refresh scroller
		 */
		$scope.$on('NG_REPEAT_COMPLETED_RENDERING', function() {
			$timeout(function() {
				refreshScroller();
			}, 0);
		});

		/**
		 * To fetch room block details
		 * @param {object} [paginationOptions] [pagination options]
		 * @return {undefined}
		 */
        $scope.fetchRoomBlockGridDetails = function(paginationOptions) {
            paginationOptions = paginationOptions || {};
            var hasNeccessaryPermission = hasPermissionToCreateRoomBlock() &&
				hasPermissionToEditRoomBlock();

            if (!hasNeccessaryPermission) {
                return;
            }

            var params = _.extend(paginationOptions, {
                group_id: $scope.groupConfigData.summary.group_id
            });

            var options = {
                params: params,
                successCallBack: successCallBackOfFetchRoomBlockGridDetails
            };

            $scope.callAPI(rvGroupConfigurationSrv.getRoomBlockGridDetails, options);
        };

        /**
         * [successFetchOfAllReqdForRoomBlock description]
         * @param  {object} data
         * @return {undefined}
         */
        var successFetchOfAllReqdForRoomBlock = function(data) {
            $scope.$emit('hideLoader');
        };

        /**
         * [successFetchOfAllReqdForRoomBlock description]
         * @param  {object} error message from API
         * @return {undefined}
         */
        var failedToFetchOfAllReqdForRoomBlock = function(errorMessage) {
            $scope.$emit('hideLoader');
            $scope.errorMessage = errorMessage;
        };

        /**
		 * Save roomblock data with selected mass update end date.
		 * @return {undefined}
		 */
        $scope.clickedOnMassUpdateSaveButton = function (ngDialogData, isOverbooking) {

            var value 		  = ngDialogData.value,
                groupStart    = $scope.groupConfigData.summary.block_from,
                timeLineStart = ($scope.timeLineStartDate < groupStart) ? groupStart : $scope.timeLineStartDate,
                endDate 	  = $scope.massUpdateEndDate;

            var roomTypeData  	 = $scope.selectedRoomType,
                occupancy 	  	 = ngDialogData.occupancy;

            var data = _.omit(roomTypeData, ['dates']);

            data = _.extend(data, roomTypeData.dates[0]);
            data[occupancy] = value;

            var config = _.extend(data, {
                start_date: formatDateForAPI(timeLineStart),
                end_date: formatDateForAPI($scope.massUpdateEndDate),
                bulk_updated_for: occupancy.toUpperCase(),
                overbook_chosen: isOverbooking
            });

			// Save room block now.
            $scope.saveMassUpdate(massUpdateOverbookingOccurs, config);
        };

        var successCallBackOfSaveMassUpdate = function(data) {
            if (!data.saved_room_block) {
                $scope.saveMassUpdate(true, lastCalledMassUpdateConfig);
                return false;
            }
			// Room block saved
            $scope.fetchCurrentSetOfRoomBlockData();
            $scope.closeDialog();
        };

        var failureCallBackOfSaveMassUpdate = function(error) {
            if (error.hasOwnProperty ('httpStatus')) {
                if (error.httpStatus === 470) {
                    var message = $scope.checkOverBooking(error);

                    if (!message) {
						// overbooking condition does not exist
                        $scope.saveMassUpdate(true, lastCalledMassUpdateConfig);
                    }
                    else {
                        if (message === 'NO_PERMISSION_TO_OVERBOOK') {
                            $scope.overBookingMessage = message;
                            $scope.disableButtons = true;
                        } else {
                            $scope.overBookingMessage = message;
                            massUpdateOverbookingOccurs = true;
                        }
                    }
                }
            } else {
                $scope.errorMessage = error;
                $scope.closeDialog();
            }
        };

		/**
		 * For mass update triggered by clicking > button
		 */
        $scope.saveMassUpdate = function(forceOverbook, config) {
            forceOverbook = forceOverbook || false;
            config = config || {};
            config = _.pick(config, ['group_id', 'overbook_chosen', 'forcefully_overbook_and_assign_rooms', 'start_date', 'end_date',
                'bulk_updated_for', 'room_type_id', 'room_type_name',
                'single', 'double', 'quadruple', 'triple', 'old_total']);

            var params = _.extend(config, {
                group_id: $scope.groupConfigData.summary.group_id,
                forcefully_overbook_and_assign_rooms: forceOverbook,
                results: config.data
            });

            var options = {
                params: params,
                successCallBack: successCallBackOfSaveMassUpdate,
                failureCallBack: failureCallBackOfSaveMassUpdate
            };

            $scope.callAPI(rvGroupConfigurationSrv.saveMassUpdate, options);

            lastCalledMassUpdateConfig = config;
            massUpdateOverbookingOccurs = false;
        };

        /**
         * Reset the timeline dates
         */
        var resetTimelineDates = function() {
            // default start date
            var businessDate = new tzIndependentDate($rootScope.businessDate).getDate();
            var startDateValue = new tzIndependentDate($scope.groupConfigData.summary.block_from).getDate();
            var endDateValue = new tzIndependentDate($scope.groupConfigData.summary.block_to).getDate();

            // Fixed as per CICO-35639, case: if end date equal to business date and start date not equal to business date
            if (endDateValue === businessDate && startDateValue !== businessDate) {
                // Goto date should not be business date
               $scope.timeLineStartDate = new tzIndependentDate(new tzIndependentDate($rootScope.businessDate) - 86400000);
            } else {
                $scope.timeLineStartDate = new tzIndependentDate($rootScope.businessDate);
            }
        };

        /**
         * we have to call multiple API on initial screen, which we can't use our normal function in teh controller
         * depending upon the API fetch completion, loader may disappear.
         * @return {[type]} [description]
         */
        var callInitialAPIs = function() {
			// call API. date range end will be calculated in next function.
            $scope.fetchCurrentSetOfRoomBlockData();

        };

		/**
		 * when a tab switch is there, parant controller will propogate
		 * API, we will get this event, we are using this to fetch new room block deails
		 */
        $scope.$on('GROUP_TAB_SWITCHED', function(event, activeTab) {
            if (activeTab !== 'ROOM_BLOCK') {
                return;
            }
            $scope.isRoomViewActive = true;
            $scope.hasRateChanged = false;
            setDatePickers();
            resetTimelineDates();
            callInitialAPIs();

			// end date picker will be in disabled in move mode
			// in order to fix the issue of keeping that state even after coming back to this
			// tab after going to some other tab
            _.extend($scope.endDateOptions,
                {
                    disabled: shouldDisableEndDatePicker()
                });

            initializeChangeDateActions ();
        });

		/**
		 * When group summary is updated by some trigger, parant controller will propogate
		 * API, we will get this event, we are using this to fetch new room block deails
		 */
        $scope.$on('UPDATED_GROUP_INFO', function(event) {
            var isShoulderFromChanged = parseInt($scope.groupConfigData.summary.shoulder_from) !== parseInt(summaryMemento.shoulder_from),
                isShoulderToChanged = parseInt($scope.groupConfigData.summary.shoulder_to) !== parseInt(summaryMemento.shoulder_to);

            summaryMemento = _.extend({}, $scope.groupConfigData.summary);
			// to prevent from initial API calling and only exectutes when group from_date, to_date,status updaet success
            if ($scope.hasBlockDataUpdated || isShoulderFromChanged || isShoulderToChanged) {
                $scope.fetchCurrentSetOfRoomBlockData();
            }
        });

		/**
		 * when failed to update data
		 */
        $scope.$on('FAILED_TO_UPDATE_GROUP_INFO', function(event, errorMessage) {
            var isShoulderFromChanged = parseInt($scope.groupConfigData.summary.shoulder_from) !== parseInt(summaryMemento.shoulder_from),
                isShoulderToChanged = parseInt($scope.groupConfigData.summary.shoulder_to) !== parseInt(summaryMemento.shoulder_to);

            $scope.$parent.errorMessage = errorMessage;

            if ($scope.groupConfigData.activeTab === 'ROOM_BLOCK' && ( isShoulderFromChanged || isShoulderToChanged)) {
                $scope.fetchCurrentSetOfRoomBlockData();
            }
        });

		/**
		 * we want to display date in what format set from hotel admin
		 * @param {String/DateObject}
		 * @return {String}
		 */
        $scope.formatDateForUI = function(date_, dateFormat) {
            var type_ = typeof date_,
                returnString = '',
                dateFormat = dateFormat ? dateFormat : $rootScope.dateFormat;

            switch (type_) {
				// if date string passed
            case 'string':
                returnString = $filter('date')(new tzIndependentDate(date_), dateFormat);
                break;

					// if date object passed
            case 'object':
                returnString = $filter('date')(date_, dateFormat);
                break;
            }
            return returnString;
        };

        // Get the day of the week from date
        $scope.getDayOfWeek = function(inputDate, dateFormat) {
            var type_ = typeof inputDate,
                returnString = '',
                dateFormat = dateFormat ? dateFormat : $rootScope.dateFormat;

            switch (type_) {
                // if date string passed
            case 'string':
                returnString = $filter('date')(new tzIndependentDate(inputDate), dateFormat);
                break;

                    // if date object passed
            case 'object':
                returnString = $filter('date')(inputDate, dateFormat);
                break;
            }
            return returnString;
        };


		/**
		 * To get css width for grid timeline
		 * For each column 190px is predefined
		 * @return {String} [with px]
		 */
        $scope.getWidthForRoomBlockTimeLine = function() {
            var width;

            if ($scope.isRoomViewActive) {
                width = $scope.groupConfigData.summary.selected_room_types_and_occupanies.length * 180 + 40;
            } else {
                width = $scope.groupConfigData.summary.selected_room_types_rate_view_occupancies.length * 180 + 40; 
            }
            
            if ($scope.shouldShowLoadNextSetButton()) {
				width += 80;
			}
			return width + 'px';
        };

		/**
		 * set up accordion
		 * @return {undefined}
		 */
        var setUpAccordion = function() {
			// accordion options, will add/remove class on toggling
            $scope.accordionInitiallyNotCollapsedOptions = {
                header: 'p.line-toggle',
                heightStyle: 'content',
                collapsible: true,
                activate: function(event, ui) {
                    if (isEmpty(ui.newHeader) && isEmpty(ui.newPanel)) { // means accordion was previously collapsed, activating..
                        ui.oldHeader.removeClass('open');
                    } else if (isEmpty(ui.oldHeader)) { // means activating..
                        ui.newHeader.addClass('open');
                    }

					// we have to refresh scroller afetr that
                    refreshScroller();


                }

            };
        };
		/**
		 * We have a list of variables to identify to initialize depending the mode (Add/Edit)
		 * @return None
		 */
        var initializeAddOrEditModeVariables = function() {
			// variable used to track Create Button, as per sice we are only handling edit mode we are
			// proceeding with true TODO: Add reference here
            $scope.createButtonClicked = true;

			// total pickup & rooms
            $scope.totalPickups = $scope.totalRooms = 0;

			// has data updated from this view, block from date or to date
            $scope.hasBlockDataUpdated = false;

			// selected Hold status:
            $scope.selectedHoldStatus = '';

            var isInEditMode = !$scope.isInAddMode(),
                refData = $scope.groupConfigData;

			// room block grid data
            $scope.roomBlockGridTimeLine = [];

			// whether the booking data changed
            $scope.hasBookingDataChanged = false;

            _.extend($scope.groupConfigData.summary, {
                selected_room_types_and_bookings: [],
                selected_room_types_and_occupanies: [],
                selected_room_types_and_rates: [],
                selected_room_types_and_daily_rates: [],
                selected_room_types_rate_view_occupancies: []
            });

            if (isInEditMode) {
                $scope.createButtonClicked = true;
                $scope.totalPickups = refData.summary.rooms_pickup;
                $scope.totalRooms = refData.summary.rooms_total;

                $scope.selectedHoldStatus = util.convertToInteger(refData.summary.hold_status);
            }

			// list of holding status list
            $scope.holdStatusList = refData.holdStatusList;
        };

        var RATE_GRID_SCROLL = 'room_rates_grid_scroller',
            BLOCK_SCROLL = 'room_block_scroller',
            RATE_TIMELINE 	 = 'room_rates_timeline_scroller',
            timer;

        /**
         * Get scroller object by key
         * @param {String} key identifier for scroller
         * @return {Object} scroller object
         */
        var getScrollerObject = function (key) {
            var scrollerObject = $scope.$parent.myScroll && $scope.$parent.myScroll[key];

            if (_.isUndefined(scrollerObject)) {
                scrollerObject = $scope.myScroll[key];
            }
            return scrollerObject;
        };

		/**
		 * utiltiy function for setting scroller and things
		 * return - None
		 */
        var setScroller = function() {
			// setting scroller things
            var scrollerOptions = {
                tap: true,
                preventDefault: false,
                probeType: 3
            };

            $scope.setScroller(BLOCK_SCROLL, scrollerOptions);

            var scrollerOptionsForRoomRatesTimeline = _.extend({
                scrollX: true,
                scrollY: false,
                scrollbars: false
            }, util.deepCopy(scrollerOptions));

            $scope.setScroller(RATE_TIMELINE, scrollerOptionsForRoomRatesTimeline);

            var scrollerOptionsForRoomRatesGrid = _.extend({
                scrollY: true,
                scrollX: true
            }, util.deepCopy(scrollerOptions));

            $scope.setScroller(RATE_GRID_SCROLL, scrollerOptionsForRoomRatesGrid);
        };

        var clearTimer = function() {
            if ( !! timer ) {
                $interval.cancel(timer);
                timer = undefined;
            }
        };

        var setScrollListner = function() {
            if ( $scope.$parent.myScroll.hasOwnProperty(RATE_TIMELINE) ) {
                refreshScroller();
                timer = $interval(refreshScroller, 1000);

                $scope.$parent.myScroll[RATE_TIMELINE].on('scroll', function() {
                    var xPos = this.x;
                    var block = $scope.$parent.myScroll[RATE_GRID_SCROLL];

                    clearTimer();

                    block.scrollTo(xPos, block.y);
					// check if edge reached next button
                    if (Math.abs(this.maxScrollX) - Math.abs(this.x) <= 150 ) {
                        if (!timeLineScrollEndReached) {
                            timeLineScrollEndReached = true;
                            runDigestCycle();
                        }
                    } else {
                        if (timeLineScrollEndReached) {
                            timeLineScrollEndReached = false;
                            runDigestCycle();
                        }
                    }
                });
                $scope.$parent.myScroll[BLOCK_SCROLL].on('scroll', function() {
                    var yPos = this.y;
                    var block = $scope.$parent.myScroll[RATE_GRID_SCROLL];

                    block.scrollTo(block.x, yPos);
                });
                $scope.$parent.myScroll[RATE_GRID_SCROLL].on('scroll', function() {
                    var xPos = this.x;
                    var yPos = this.y;


                    $scope.$parent.myScroll[RATE_TIMELINE].scrollTo(xPos, 0);
                    $scope.$parent.myScroll[BLOCK_SCROLL].scrollTo(0, yPos);
					// check if edge reached next button
                    if (Math.abs(this.maxScrollX) - Math.abs(this.x) <= 150 ) {
                        if (!timeLineScrollEndReached) {
                            timeLineScrollEndReached = true;
                            runDigestCycle();
                        }
                    } else {
                        if (timeLineScrollEndReached) {
                            timeLineScrollEndReached = false;
                            runDigestCycle();
                        }
                    }

                });
            } else {
                $timeout(setScrollListner, 1000);
            }
        };

        var allRendered = $scope.$on( 'ALL_RENDERED', setScrollListner );

        $scope.$on( '$destroy', allRendered );
        $scope.$on( '$destroy', clearTimer );

		/**
		 * utiltiy function to refresh scroller
		 * return - None
		 */
        var refreshScroller = function() {
            $scope.refreshScroller(BLOCK_SCROLL);
			$scope.refreshScroller(RATE_TIMELINE);
            $scope.refreshScroller(RATE_GRID_SCROLL);
        };

		/**
		 * to set the active left side menu
		 * @return {undefined}
		 */
        var setActiveLeftSideMenu = function () {
            var activeMenu = $scope.isInAddMode() ? 'menuCreateGroup' : 'menuManageGroup';

            $scope.$emit('updateRoverLeftMenu', activeMenu);
        };

		/**
		 * Call to reset the calender dates to the actual one.
		 * @return {undefined}
		 */
        var resetDatePickers = function() {
			// resetting the calendar date's to actual one
            $scope.groupConfigData.summary.block_from 	= new tzIndependentDate(summaryMemento.block_from);
            $scope.groupConfigData.summary.block_to  	= new tzIndependentDate(summaryMemento.block_to);
            $scope.startDate = $scope.groupConfigData.summary.block_to;
            $scope.endDate = $scope.groupConfigData.summary.block_to;

			// setting the min date for end Date
            $scope.endDateOptions.minDate = $scope.groupConfigData.summary.block_from;

			// setting max date of from date
            $scope.startDateOptions.maxDate = $scope.groupConfigData.summary.block_to;
        };


		/**
		 * Initialize scope variables
		 * @return {undefined}
		 */
        var initializeVariables = function () {

            $scope.changeDatesActions = {};

			// we use this to ensure that we will call the API only if there is any change in the data
            summaryMemento = _.extend({}, $scope.groupConfigData.summary);

			// since we are recieving two ouside click event on tapping outside, we wanted to check and act
            $scope.isUpdateInProgress = false;
            $scope.isRoomViewActive = true;
        };

		/**
		 * Our Move date, start date, end date change are defined in parent controller
		 * We need to share those actions with room block
		 * @return undefined
		 */
        var initializeChangeDateActions = function () {
			// things are defined in parent controller (getMoveDatesActions)
            $scope.changeDatesActions = $scope.getMoveDatesActions();

			// initially we will be in DEFAULT mode
            $scope.changeDatesActions.setToDefaultMode();
        };

        var successCallBackOfMoveButton = function() {
            $scope.reloadPage('ROOM_BLOCK');
        };

        var failureCallBackOfMoveButton = function(errorMessage) {

        };

		/**
		 * when clicked on Save move button. this will triggr
		 * @return {undefined}
		 */
        $scope.clickedOnSaveMoveButton = function() {
            var sumryData = $scope.groupConfigData.summary,
                oldSumryData = summaryMemento,
                options = {
                    fromDate: sumryData.block_from,
                    toDate: sumryData.block_to,
                    oldFromDate: oldSumryData.block_from,
                    oldToDate: oldSumryData.block_to,
                    successCallBack: successCallBackOfMoveButton,
                    failureCallBack: failureCallBackOfMoveButton,
                    cancelPopupCallBack: cancelCallBackofDateChange
                };

            $scope.changeDatesActions.clickedOnMoveSaveButton (options);
        };

		/**
		 * when clicked on move button. this will triggr
		 * @return {undefined}
		 */
        $scope.clickedOnMoveButton = function() {
            _.extend($scope.endDateOptions,
                {
                    disabled: true
                });

			// resetting the calendar date's to actual one
            resetDatePickers();

			// setting max date of from date
            $scope.startDateOptions.maxDate = '';

            $scope.changeDatesActions.clickedOnMoveButton ();
            $scope.actionStatus.isMoveBtnClicked = true;

        };
        var getTotalOfIndividualDate = function(passedDate) {
            var totalRoomsBlockedCountIndividualDate = 0;
            var totalRoomsPickedIndividulaDate 		 = 0;
            var cInt = util.convertToInteger;

            angular.forEach($scope.groupConfigData.summary.selected_room_types_and_bookings, function(value, key) {

                angular.forEach(value.dates, function(eachDateValue, eachDateKey) {
                    if (eachDateValue.date === passedDate) {
                        totalRoomsBlockedCountIndividualDate = totalRoomsBlockedCountIndividualDate + cInt(eachDateValue.single) + cInt(eachDateValue.double) + cInt(eachDateValue.triple) + cInt(eachDateValue.quadruple);
                        totalRoomsPickedIndividulaDate = totalRoomsPickedIndividulaDate + cInt(eachDateValue.single_pickup) + cInt(eachDateValue.double_pickup) + cInt(eachDateValue.triple_pickup) + cInt(eachDateValue.quadruple_pickup);
                    }
                });
            });
            var totalOfIndividualDateData = [];

            totalOfIndividualDateData['totalBlocked'] = totalRoomsBlockedCountIndividualDate;
            totalOfIndividualDateData['totalPicked'] = totalRoomsPickedIndividulaDate;
            return totalOfIndividualDateData;
        };

        $scope.getTotalBookedRooms = function() {

            angular.forEach($scope.groupConfigData.summary.selected_room_types_and_occupanies, function(value, key) {
                value.totalRoomsBlockedCountPerDay = getTotalOfIndividualDate(value.date)['totalBlocked'];
                value.totalRoomsPickedCountPerDay = getTotalOfIndividualDate(value.date)['totalPicked'];
            });

        };


		/**
		 * when clicked on cancel move button. this will triggr
		 * @return {undefined}
		 */
        $scope.clickedOnCancelMoveButton = function() {
            _.extend($scope.endDateOptions,
                {
                    disabled: false
                });

            $scope.reloadPage('ROOM_BLOCK');
        };

        var cancelCallBackofDateChange = function () {
            resetDatePickers();
        };

        var successCallBackOfEarlierArrivalDateChange = function() {
            $scope.reloadPage('ROOM_BLOCK');
        };

        var failureCallBackOfEarlierArrivalDateChange = function(errorMessage) {
            $scope.reloadPage('ROOM_BLOCK');
        };

		/**
		 * called when start date changed to an earlier date
		 * @return {undefined}
		 */
        var triggerEarlierArrivalDateChange = function() {
            var sumryData = $scope.groupConfigData.summary,
                oldSumryData = summaryMemento,
                options = {
                    fromDate: sumryData.block_from,
                    oldFromDate: oldSumryData.block_from,
                    successCallBack: successCallBackOfEarlierArrivalDateChange,
                    failureCallBack: failureCallBackOfEarlierArrivalDateChange,
                    cancelPopupCallBack: cancelCallBackofDateChange
                };

            $scope.changeDatesActions.triggerdChangeDateActions();
            $scope.changeDatesActions.triggerEarlierArrDateChange (options);
        };

        var successCallBackOfLaterArrivalDateChange = function() {
            $scope.reloadPage('ROOM_BLOCK');
        };

        var failureCallBackOfLaterArrivalDateChange = function(errorMessage) {

        };

        var triggerEarlierDepartureDateChangeInvalidError = function() {
            var options = {
                cancelPopupCallBack: cancelCallBackofDateChange,
                message: 'GROUP_EARLIER_DEP_DATE_CHANGE_WARNING'
            };

            $scope.changeDatesActions.triggerdChangeDateActions();
            $scope.changeDatesActions.showDateChangeInvalidWarning(options);
        };

        var triggerLaterArrivalDateChangeInvalidError = function() {
            var options = {
                cancelPopupCallBack: cancelCallBackofDateChange,
                message: 'GROUP_LATER_ARR_DATE_CHANGE_WARNING'
            };

            $scope.changeDatesActions.triggerdChangeDateActions();
            $scope.changeDatesActions.showDateChangeInvalidWarning(options);
        };

		/**
		 * called when start date changed to a later date
		 * @return {undefined}
		 */
        var triggerLaterArrivalDateChange = function() {
            var sumryData = $scope.groupConfigData.summary,
                oldSumryData = summaryMemento,
                options = {
                    fromDate: sumryData.block_from,
                    oldFromDate: oldSumryData.block_from,
                    successCallBack: successCallBackOfEarlierArrivalDateChange,
                    failureCallBack: failureCallBackOfEarlierArrivalDateChange,
                    cancelPopupCallBack: cancelCallBackofDateChange
                };

            $scope.changeDatesActions.triggerdChangeDateActions();
            $scope.changeDatesActions.triggerLaterArrDateChange (options);
        };

		/**
		 * DEPATURE CHANGE
		 */
		/**
		 * [successCallBackOfEarlierDepartureDateChange description]
		 * @return {[type]} [description]
		 */
        var successCallBackOfEarlierDepartureDateChange = function() {
            $scope.reloadPage('ROOM_BLOCK');
        };

		/**
		 * [failureCallBackOfEarlierDepartureDateChange description]
		 * @param  {[type]} errorMessage [description]
		 * @return {[type]}              [description]
		 */
        var failureCallBackOfEarlierDepartureDateChange = function(errorMessage) {

        };

		/**
		 * when clicked on Save move button. this will triggr
		 * @return {undefined}
		 */
        var triggerEarlierDepartureDateChange = function() {
            var sumryData = $scope.groupConfigData.summary,
                oldSumryData = summaryMemento,
                options = {
                    toDate: sumryData.block_to,
                    oldToDate: oldSumryData.block_to,
                    successCallBack: successCallBackOfEarlierDepartureDateChange,
                    failureCallBack: failureCallBackOfEarlierDepartureDateChange,
                    cancelPopupCallBack: cancelCallBackofDateChange
                };

            $scope.changeDatesActions.triggerdChangeDateActions();
            $scope.changeDatesActions.triggerEarlierDepDateChange (options);
        };

		/**
		 * [successCallBackOfLaterDepartureDateChange description]
		 * @return {[type]} [description]
		 */
        var successCallBackOfLaterDepartureDateChange = function() {
            $scope.reloadPage('ROOM_BLOCK');
        };

		/**
		 * [failureCallBackOfLaterDepartureDateChange description]
		 * @param  {[type]} errorMessage [description]
		 * @return {[type]}              [description]
		 */
        var failureCallBackOfLaterDepartureDateChange = function(errorMessage) {

        };

		/**
		 * when clicked on Save move button. this will triggr
		 * @return {undefined}
		 */
        var triggerLaterDepartureDateChange = function() {
            var sumryData = $scope.groupConfigData.summary,
                oldSumryData = summaryMemento,
                options = {
                    toDate: sumryData.block_to,
                    oldToDate: oldSumryData.block_to,
                    successCallBack: successCallBackOfLaterDepartureDateChange,
                    failureCallBack: failureCallBackOfLaterDepartureDateChange,
                    cancelPopupCallBack: cancelCallBackofDateChange
                };

            $scope.changeDatesActions.triggerdChangeDateActions();
            $scope.changeDatesActions.triggerLaterDepDateChange (options);
        };


		/**
		 * This function sets tab data
		 * @return {undefined}
		 */
        var initializeRoomBlockDetails = function() {
            resetTimelineDates();
            callInitialAPIs();
			// on tab switching, we have change min date
            setDatePickers();

        };

		/**
		 * Function to initialise room block details
		 * @return - None
		 */
        var initializeMe = (function() {
            BaseCtrl.call(this, $scope);

			// updating the left side menu
            setActiveLeftSideMenu();

			// we have a list of scope varibales which we wanted to initialize
            initializeVariables();

			// IF you are looking for where the hell the API is CALLING
			// scroll above, and look for the event 'GROUP_TAB_SWITCHED'

			// start date change, end date change, move date actions
            initializeChangeDateActions();

			// date related setups and things
            setDatePickers();

			// setting rooms view scrollers
            setScroller();

			// accoridion
            setUpAccordion();

			// we have a list of scope varibales which we wanted to assign when it is in add/edit mode
            initializeAddOrEditModeVariables();

			// as per CICO-17081 we can enter a tab directly without TAB_SWITCHING
            if ($scope.groupConfigData.activeTab === 'ROOM_BLOCK') {
                initializeRoomBlockDetails();
            }

            $scope.isGroupDailyRatesEnabled = Toggles.isEnabled('group_daily_rates');


        }());

        /**
         * Checks whether the tripple button should be shown or not
         */
        $scope.shouldShowAddTrippleButton = function (roomTypeRate) {
            var showTrippleBtn = $scope.groupConfigData.summary.rate == -1 && roomTypeRate.can_edit && roomTypeRate.rate_config.is_extra_adult_rate_configured &&
                                 !$scope.shouldShowTripleEntryRow(roomTypeRate);

            return showTrippleBtn;
        };

        /**
         * Checks whether the quadruple button should be shown or not
         */
        $scope.shouldShowAddQuadrupleButton = function (roomTypeRate) {
            var showQuadrupleBtn = $scope.groupConfigData.summary.rate == -1 && roomTypeRate.can_edit && 
                                   roomTypeRate.rate_config.is_extra_adult_rate_configured &&
                                   !$scope.shouldShowQuadrupleEntryRow(roomTypeRate) && $scope.shouldShowTripleEntryRow(roomTypeRate);                                  

            return showQuadrupleBtn;
        };

        // Should show copy btn
        $scope.shouldShowCopyButton = function (date, index) {
            var dateObject;
            
            switch (typeof date) {
                case 'string': 
                    dateObject = new tzIndependentDate(date); 
                    break;
                case 'object': 
                    dateObject = new tzIndependentDate(date.date);
                    break;
                default:
            }
            
            if (dateObject.getTime() === $scope.groupConfigData.summary.block_from.getTime()) {
                return true;
            }

            if (!index && !date.is_shoulder_date) {
                return true;
            }

            return false;
        };

        /**
         * Show house events list popup
         * @param {Number} eventsCount events count
         * @param {Date} selectedDate selected date
         * @return {void}
         */
        $scope.showHouseEventsListPopup = function(eventsCount, selectedDate) {
            getScrollerObject(RATE_TIMELINE).disable();
            if (!eventsCount) {
                return;
            }

            $scope.selectedEventDisplayDate = selectedDate;
            ngDialog.open({
                template: '/assets/partials/popups/rvHouseEventsListPopup.html',
                scope: $scope,
                controller: 'rvHouseEventsListPopupCtrl',
                className: 'ngdialog-theme-default',
                closeByDocument: false,
                closeByEscape: true
            });
        };

        /**
         * Toggle room rate switch
         */
        $scope.toggleRoomRateBtn = function() {
            $scope.isRoomViewActive = !$scope.isRoomViewActive;
            if (!$scope.isRoomViewActive) {
                $scope.fetchRoomTypesDailyRates();
            } else {
                setDatePickers();
                callInitialAPIs();
                refreshScroller();
            }
        };

        /**
         * Get request params for the roomtyps/rate request
         */
        var getParamsForRoomTypeRatesRequest = function() {
            processTimeLineDates();
            
            return {
                start_date: formatDateForAPI($scope.timeLineStartDate),
                end_date: formatDateForAPI($scope.timeLineEndDate)
            };
        };

        /**
		 * Load next 14 rates data
		 */
        $scope.fetchNextSetOfRoomTypesRateData = function() {
            $scope.timeLineStartDate.setDate($scope.timeLineStartDate.getDate() + 14);
            $scope.fetchRoomTypesDailyRates();
        };

        $scope.addListener('RENDERING_COMPLETE', setScrollListner);

        /**
		 * Flag that rate has been changed
		 */
        $scope.rateChanging = function() {
            $scope.hasRateChanged = true;
            runDigestCycle();
        };

        // Checks whether single rate is configured for the room types added
 		var isSingleRateConfigured = function (selectedRoomTypeAndRates) {
            var isSingleRateConfigured = true;

            _.each(selectedRoomTypeAndRates, function (roomAndRate) {
                _.each(roomAndRate.dates, function(row) {
                    if (row.single_amount === "") {
                        isSingleRateConfigured = false;
                    }
                });  
            });

            return isSingleRateConfigured;
        };

        /**
         * Check whether group custom rate is changed and open new popup if true, otherwise updates room
         * types and rates.  
         */ 
        $scope.checkIfGroupCustomRateChanged = function() {
            var selectedRoomTypeAndRates = $scope.groupConfigData.summary.selected_room_types_and_daily_rates,
                data = {
                    isGroupDailyRatesEnabled: $scope.isGroupDailyRatesEnabled
                };

            if (!isSingleRateConfigured(selectedRoomTypeAndRates)) {
                $scope.errorMessage = [$filter('translate')('NO_SINGLE_RATE_CONFIGURED')];
                return;
            }
            if (isGroupCustomRateChangedAndReservationExists(selectedRoomTypeAndRates)) { 
                $scope.confirmUpdateRatesWithPickedReservations(selectedRoomTypeAndRates, data); 
            }
            else {
                $scope.saveRoomTypesDailyRates();
            }
        };

        /**
 		 * Checks whether group custom rate is changed and reservations already exists
 		 */
 		var isGroupCustomRateChangedAndReservationExists = function (selectedRoomTypeAndRates) {
            var updateExistingReservationsRate = false;

            angular.forEach (selectedRoomTypeAndRates, function (roomAndRate) {
                if (roomAndRate.total_reservations_count > 0) {
                    _.each(roomAndRate.dates, function(row) {
                        if (row.single_amount !== row.old_single_amount || row.double_amount !== row.old_double_amount || row.extra_adult_amount !== row.old_extra_adult_amount) {
                            updateExistingReservationsRate = true;
                            roomAndRate.update_existing_reservations_rate = true;
                        }
                    });
                }
            });
            return updateExistingReservationsRate;
        };

		/**
		 * Process mass rate upate
         * @param {Object} params - request params
         * @return {void}
		 */
        $scope.processMassRateUpdate = function(params) {
            var onRateMassUpdateSuccess = function() {
                    $scope.fetchRoomTypesDailyRates();
                    $scope.closeDialog();
                },
                onRateMassUpdateFailure = function(error) {
                    $scope.errorMessage = error;
                    $scope.closeDialog();
                },
                options = {
                    params: params,
                    successCallBack: onRateMassUpdateSuccess,
                    failureCallBack: onRateMassUpdateFailure
                };

            $scope.callAPI(rvGroupConfigurationSrv.performRateMassUpdate, options);
        };

        /**
		 * Handler for performing rate mass update
         * @param {Object} ngDialogData - dialog data
		 * @return {void}
		 */
        $scope.clickedOnMassRateUpdateButton = function (ngDialogData) {
            var value = ngDialogData.value,
                groupShoulderFromDate = $scope.groupConfigData.summary.shoulder_from_date,
                timeLineStart = $scope.timeLineStartDate < groupShoulderFromDate ? groupShoulderFromDate : $scope.timeLineStartDate;

            var requestParams = {
                start_date: formatDateForAPI(timeLineStart),
                end_date: formatDateForAPI($scope.massRateUpdateEndDate),
                bulk_updated_for: ngDialogData.occupancy.toUpperCase(),
                room_type_id: $scope.selectedRoomType.room_type_id,
                amount: value,
                groupId: $scope.groupConfigData.summary.group_id
            };
			
            if (isGroupCustomRateChangedAndReservationExists($scope.groupConfigData.summary.selected_room_types_and_daily_rates)) {
                var data = {
                    amount: value,
                    isBulkUpdate: true,
                    occupancy: ngDialogData.occupancy
                };

                $scope.confirmUpdateRatesWithPickedReservations($scope.groupConfigData.summary.selected_room_types_and_daily_rates, data);
            } else {
                $scope.processMassRateUpdate(requestParams);
            }
        };

        /**
		 * to close the popup
		 * @return undefined
		 */
        $scope.clickedOnCancelButton = function() {
            $scope.closeDialog();
        };

        /**
		 * Copy the rates for the corresponding room type occupancy to other dates
		 * @param {Object} - cell data
		 * @param {Object} - row data
		 * @return undefined
		 */
        $scope.copySingleCellRateValueToOtherBlocks = function(cellData, rowData, occupancyType) {
            var data = {};

            _.each(rowData.dates, function(element) {
                    switch (occupancyType) {
                        case 'single_amount':
                            element.single_amount = cellData.single_amount;
                            data.value = cellData.single_amount;
                            break;
                        case 'double_amount':
                            element.double_amount = cellData.double_amount;
                            data.value = cellData.double_amount;
                            break;
                        case 'extra_adult_amount':
                            element.extra_adult_amount = cellData.extra_adult_amount;
                            data.value = cellData.extra_adult_amount;
                            break;
                        default:
                              
                    }
            });
            data.occupancy = occupancyType;

            $scope.selectedRoomType = rowData;
            $scope.showMassUpdateEndDateConfirmation(data);
			// we chnged something
            $scope.rateChanging();
        };

        /**
		 * should we wanted to disable single box entry
		 * @param {Object} [dateData] [description]
		 * @return {Boolean}
		 */
        $scope.shouldDisableRateEntryBox = function(dateData, roomType) {
            return !!$scope.groupConfigData.summary.is_cancelled || !dateData.isModifiable || !roomType.can_edit;
        };

        /**
		 * Invoke when rates view is active and save button is clicked
		 */
        $scope.clickedOnSaveRatesButton = function() {
			// do not force overbooking for the first time
            // CICO-42325 Bring loader straight-away to protect from multi-clicks
            $scope.$emit('showLoader');
            $scope.saveRoomBlock(false);
        };

		/**
		 * when discard button clicked, we will set the booking data with old copy
		 * @return None
		 */
        $scope.clickedOnDiscardButtonInRatesView = function() {
            $scope.groupConfigData.summary.selected_room_types_and_daily_rates =
				util.deepCopy($scope.copy_selected_room_types_and_daily_rates);

            $scope.hasRateChanged = false;
        };

		/**
         * Save room types daily rates
         */
        $scope.saveRoomTypesDailyRates = function() {
            var onDailyRateSaveSuccess = function() {
                    $scope.copy_selected_room_types_and_daily_rates = angular.copy($scope.groupConfigData.summary.selected_room_types_and_bookings);
                    $scope.hasRateChanged = false;
                    $scope.fetchRoomTypesDailyRates();
                    $scope.closeDialog();
                },
                onDailyRateSaveFailure = function(error) {
                    $scope.errorMessage = error;
                    $scope.closeDialog();
                };

            $timeout(function() {
                var params = {
                    group_id: $scope.groupConfigData.summary.group_id,
                    room_types_and_rates: $scope.groupConfigData.summary.selected_room_types_and_daily_rates
                };

                var options = {
                    params: params,
                    successCallBack: onDailyRateSaveSuccess,
                    failureCallBack: onDailyRateSaveFailure
                };

                $scope.callAPI(rvGroupConfigurationSrv.saveRoomTypesDailyRates, options);
            }, 0);
        };

        /**
         * Fetch the rates for all occupancies corresponding to the room types configured
         */
        $scope.fetchRoomTypesDailyRates = function() {
            var onDailyRatesFetchSuccess = function(response) {
                    var businessDate = new tzIndependentDate($rootScope.businessDate);
        
                    _.each(response.results.data.daily_rates, function(eachRoomType) {
                        eachRoomType.start_date = formatDateForAPI($scope.timeLineStartDate);
                        eachRoomType.update_existing_reservations_rate = false;
                        _.each(eachRoomType.dates, function(dateData) {
                            var formattedDate = new tzIndependentDate(dateData.date);
                            
                            dateData.isModifiable = formattedDate >= businessDate;
                            dateData.old_single_amount = dateData.single_amount;
                            dateData.old_double_amount = dateData.double_amount;
                            dateData.old_extra_adult_amount = dateData.extra_adult_amount;
                        });
                    });
                    $scope.groupConfigData.summary.selected_room_types_and_daily_rates = response.results.data.daily_rates;
                    $scope.groupConfigData.summary.selected_room_types_rate_view_occupancies = response.results.data.occupancy;
                    $scope.eventsCount = response.eventsCount;
        
                    // we need the copy of selected_room_type/rates, as we need to use these to show save/discard button
                    $scope.copy_selected_room_types_and_daily_rates = util.deepCopy(response.results.data.daily_rates);
                    $scope.hasRateChanged = false;
                    $interval(refreshScroller, 1000);
                },
                onDailyRatesFetchFailure = function(error) {
                    $scope.errorMessage = error;
                },
                hasNeccessaryPermission = hasPermissionToCreateRoomBlock() && hasPermissionToEditRoomBlock();

            if (!hasNeccessaryPermission) {
                return;
            }

            var params = _.extend(getParamsForRoomTypeRatesRequest(), {
                group_id: $scope.groupConfigData.summary.group_id
            });

            var options = {
                params: params,
                successCallBack: onDailyRatesFetchSuccess,
                failureCallBack: onDailyRatesFetchFailure
            };

            $scope.callAPI(rvGroupConfigurationSrv.getRoomTypesOccupancyRateDetailsAndEventsCount, options);
        };

        /**
         * Should disable the room/rates toggle button
         */
        $scope.shouldDisableRoomRatesToggleBtn = function() {
            return !$scope.isGroupDailyRatesEnabled || $scope.groupConfigData.summary.is_cancelled;
        };

        /**
         * Should disable the bulk room block count update option for room view
         * @param {Object} dateData date data
         * @return {Boolean}
         */
        $scope.shouldDisableBulkUpdateButton = function(dateData) {
            var pastDate = new tzIndependentDate(dateData.date) < new tzIndependentDate($rootScope.businessDate);

            return !!$scope.groupConfigData.summary.is_cancelled || pastDate;
        };

        /**
         * Should disable bulk rate update option in rates view
         * @param {Object} dateData date data
         * @return {Boolean}
         */
        $scope.shouldDisableBulkRateUpdateButton = function(dateData) {
            var pastDate = new tzIndependentDate(dateData.date) < new tzIndependentDate($rootScope.businessDate);

            return !!$scope.groupConfigData.summary.is_cancelled || pastDate || $scope.groupConfigData.summary.rate != -1; 
        };

        $scope.addListener('RESET_DATE_PICKERS', function() {
            resetDatePickers();
        });

        // Should show copy rate btn
        $scope.shouldShowCopyRateButton = function (date, index) {
            if (!index) {
                return true;
            }

            return false;
        };

        $scope.addListener('DATE_MOVE_FAILED', function(event, data) {
            if (data && data.activeTab === 'ROOM_BLOCK') {
                $scope.clickedOnCancelMoveButton();
            }
        });
        
    }
]);
