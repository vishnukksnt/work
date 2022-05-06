angular.module('sntRover').controller('rvGroupReservationEditCtrl', [
    '$rootScope',
    '$scope',
    'rvGroupRoomingListSrv',
    '$filter',
    '$timeout',
    'rvUtilSrv',
    'rvGroupConfigurationSrv',
    'RVBillCardSrv',
    '$state',
    'ngDialog',
    'rvPermissionSrv',
    function ($rootScope,
        $scope,
        rvGroupRoomingListSrv,
        $filter,
        $timeout,
        util,
        rvGroupConfigurationSrv,
        RVBillCardSrv,
        $state,
        ngDialog,
        rvPermissionSrv) {

    BaseCtrl.call(this, $scope);
    var parentScope = $scope.$parent;
    // variables
    var initialPopupData = {},
        bulkCheckoutPopup;

    var fieldsEnabled = {
      date: true,
      room: true,
      occupancy: true,
      roomType: true
    };
    var RESPONSE_STATUS_470 = 470;

    var borrowPopup, overbookPopup;
    
    $scope.hasOverBookRoomTypePermission = rvPermissionSrv.getPermissionValue('OVERBOOK_ROOM_TYPE');
    $scope.hasOverBookHousePermission = rvPermissionSrv.getPermissionValue('OVERBOOK_HOUSE');
    $scope.hasBorrowFromHousePermission = rvPermissionSrv.getPermissionValue('GROUP_HOUSE_BORROW');

    var calculateDisableCondition = function(field, value) {
      fieldsEnabled[field] = value;
      for (var key in fieldsEnabled) {
        if (key !== field) {
          fieldsEnabled[key] = !value;
        }
      }
    };

    /**
     * should we allow to change the room of a particular reservation
     * @param {Object} reservation
     * @return {Boolean}
     */
    $scope.shouldDisableChangeRoom = function(reservation) {
        var rStatus = reservation.reservation_status,
            validResStatuses = ["RESERVED", "CHECKING_IN"];

        return !(fieldsEnabled['room'] && _.contains(validResStatuses, rStatus));
    };

    /**
     * should we allow to change from date of a particular reservation
     * @param {Object} reservation
     * @return {Boolean}
     */
    $scope.shouldDisableFromDateChange = function(reservation) {
        var rStatus = reservation.reservation_status,
            validResStatuses = ["RESERVED", "CHECKING_IN"];

        return !(fieldsEnabled['date'] && _.contains(validResStatuses, rStatus));
    };

    /**
     * should we allow to change to date of a particular reservation
     * @param {Object} reservation
     * @return {Boolean}
     */
    $scope.shouldDisableToDateChange = function(reservation) {
        var rStatus = reservation.reservation_status,
            validResStatuses = ["RESERVED", "CHECKING_IN", "CHECKEDIN", "CHECKING_OUT"];

        return !(fieldsEnabled['date'] && _.contains(validResStatuses, rStatus));
    };

    /**
     * Put all logic to show/hide the checkout button here.
     * @param {object} Reservation
     * @return {undefined}
     */
    $scope.shouldShowCheckoutButton = function(reservation) {
        return (!$scope.reservationStatusFlags.isExpected &&
                 $scope.reservationStatusFlags.isPastArrival);
    };

    /**
     * Conditionally disable the checkout button
     * @param {object} Reservation
     */
     $scope.shouldDisableCheckoutButton = function(reservation) {
        return (!$scope.reservationStatusFlags.isStaying ||
                $scope.reservationStatusFlags.isUneditable ||
                !reservation.can_checkout);
     };

    /**
     * Put all logic to show/hide the checkin button here.
     * @param {object} Reservation
     * @return {undefined}
     */
    $scope.shouldShowCheckinButton = function(reservation) {
        return (!$scope.reservationStatusFlags.isExpected &&
                 $scope.reservationStatusFlags.isPastArrival);
    };

    /**
     * Conditionally disable the checkout button
     * @param {object} Reservation
     */
     $scope.shouldDisableCheckinButton = function(reservation) {
        return (!$scope.reservationStatusFlags.canChekin ||
                $scope.reservationStatusFlags.isUneditable ||
                !reservation.can_checkin);
     };

     $scope.shouldDisableStaycardButton = function(reservation) {
        return (!$scope.reservationStatusFlags.isGuestAttached);
     };

     $scope.shouldDisableRemoveButton = function(reservation) {
        return !$scope.reservationStatusFlags.isExpected;
     };

     $scope.shouldDisableNameField = function(reservation) {
        return $scope.reservationStatusFlags.isUneditable;
     };

    /**
     * Function to decide whether to disable room type changing from edit reservation popup
     * @param {Object} - reservation
     * @return {Boolean}
     */
    $scope.shouldDisableReservationRoomTypeChange = function(reservation) {
        // as per CICO-17082, we need to show the room type in select box of edit with others
        // but should be disabled
        var room_type_id_list = _.pluck($scope.roomTypesAndData, 'room_type_id'),
            containNonEditableRoomType = !_.contains(room_type_id_list, parseInt(reservation.room_type_id)),
            rStatus = reservation.reservation_status,
            basicDisableCondition = !( rStatus === "RESERVED" || rStatus === "CHECKING_IN") || containNonEditableRoomType;

        // CICO-18717: disable room type switch once a user checks in
        return (!fieldsEnabled['roomType'] || basicDisableCondition);
    };

    $scope.shouldDisableReservationOccuppancyChange = function(reservation) {
      var basicDisableCondition = $scope.reservationStatusFlags.isUneditable ||
                                  $scope.reservationStatusFlags.isCheckedOut;

        return !fieldsEnabled['occupancy'] || basicDisableCondition;
    };

    /**
     * Function to decide whether to show a particular occupancy
     * based on the key that we getting from the function we are deciding
     * @return {Boolean}
     */
    $scope.shouldShowThisOccupancyAgainstRoomType = function(keyToCheck) {
        // finding the selected room type data
        var selectedRoomType = _.findWhere($scope.ngDialogData.allowedRoomTypes, {
            room_type_id: parseInt($scope.ngDialogData.room_type_id)
        });
        // we are hiding the occupancy if selected room type is undefined

        if (typeof selectedRoomType === "undefined") {
            return false;
        }
        return selectedRoomType[keyToCheck];
    };

    /**
     * is Room Number is empty
     * @return {Boolean} [description]
     */
    $scope.isEmptyRoomNumber = function(roomNo) {
        return (roomNo === null || roomNo === '');
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
    * utility method to get the formmated date for API
    * @param  {String} dateString
    * @return {String} [formatted date]
    */
    var getFormattedDateForAPI = function (dateString) {
        return $filter('date')(tzIndependentDate(dateString), $rootScope.dateFormatForAPI);
    };

    /**
    * we need to update the reservation listing after updation
    */
    var onUpdateReservationSuccess = function(data) {
        $scope.closeDialog();
        $scope.$emit("REFRESH_GROUP_ROOMING_LIST_DATA");
        $scope.$emit("FETCH_SUMMARY");
    };

    /**
    * Method to update the reservation
    * @param  {object} reservation
    * @return {undefined}
    */

    $scope.updateReservation = function(reservation, forcefullyOverbook) {

            $scope.errorMessage = "";

            _.extend(reservation, {
              group_id: $scope.groupConfigData.summary.group_id,
              arrival_date: getFormattedDateForAPI($scope.roomingListState.editedReservationStart),
              departure_date: getFormattedDateForAPI($scope.roomingListState.editedReservationEnd),
              room_type_id: parseInt(reservation.room_type_id),
              room_id: parseInt(reservation.room_id)
            });

            if (forcefullyOverbook) {
                reservation.forcefully_overbook = true;
  
            }
            angular.forEach(reservation.accompanying_guests_details, function(guest, index) {

                if (!guest.first_name && !guest.last_name) {
                  guest.first_name = null;
                  guest.last_name = null;
                }

            });

            // Reservation update failure
            var onUpdateReservationFailure = function( error ) {
                if (error.status === RESPONSE_STATUS_470 && error.results.is_borrowed_from_house) {
                    
                    var results = error.results;
                
                    $scope.borrowData = {};
                    $scope.borrowData.currentReservation = reservation;

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

                    borrowPopup = ngDialog.open({
                        template: '/assets/partials/common/group/rvGroupBorrowPopup.html',
                        className: '',
                        closeByDocument: false,
                        closeByEscape: true,
                        scope: $scope
                    });

                } else {
                    $scope.errorMessage = error; 
                }

            };


            var options = {
              params: reservation,
              successCallBack: onUpdateReservationSuccess,
              failureCallBack: onUpdateReservationFailure
            };

            $scope.callAPI(rvGroupConfigurationSrv.updateRoomingListItem, options);

    };

    // Handles the borrow action
    $scope.performBorrowFromHouse = function () {

        if ($scope.borrowData.isBorrowFromHouse) {
            $scope.updateReservation($scope.borrowData.currentReservation, true);
            $scope.closeBorrowPopup(true);
        } else {
            $scope.closeBorrowPopup();
            overbookPopup = ngDialog.open({
                template: '/assets/partials/common/group/rvGroupOverbookPopup.html',
                className: '',
                closeByDocument: false,
                closeByEscape: true,
                scope: $scope
            });
        }
        
    };

    // Close borrow popup
    $scope.closeBorrowPopup = function (shouldClearData) {
        if (shouldClearData) {
            $scope.borrowData = {};
        }
        borrowPopup.close();
    };

    // Closes the current borrow dialog
    $scope.closeOverbookPopup = function() {
        $scope.borrowData = {};
        overbookPopup.close();
    };

    // Perform over book
    $scope.performOverBook = function () {
        $scope.updateReservation($scope.borrowData.currentReservation, true);
        $scope.closeOverbookPopup();
    };

    var showCheckoutConfirmationPopup = function(data) {
        ngDialog.open({
            template: '/assets/partials/groups/rooming/popups/editReservation/rvGroupEditRoomingListItemCheckoutConfirmation.html',
            className: '',
            scope: parentScope,
            closeByDocument: false,
            closeByEscape: false,
            controller: 'rvGroupReservationCheckoutCtrl',
            data: JSON.stringify(data)
        });
    };

    var showCheckinConfirmationPopup = function(data) {
        ngDialog.open({
            template: '/assets/partials/groups/rooming/popups/editReservation/rvGroupEditRoomingListItemCheckinConfirmation.html',
            className: '',
            scope: parentScope,
            closeByDocument: false,
            closeByEscape: false,
            controller: 'rvGroupReservationCheckinCtrl',
            data: JSON.stringify(data)
        });
    };

    /**
     * Call to checkout a single reservation
     * @param {object} Selected Reservation
     */
    $scope.checkoutReservation = function(reservation) {
        if (reservation.is_bulk_checkout_in_progress) {
            var data = {
                message: 'BULK_CHECKOUT_PROCESS_IN_PROGRESS',
                isFailure: true
            };

            bulkCheckoutPopup = ngDialog.open({
                                    template: '/assets/partials/popups/rvInfoPopup.html',
                                    closeByDocument: true,
                                    scope: $scope,
                                    data: JSON.stringify(data)
                                });

            return;
        }

        var summaryData     = $scope.groupConfigData.summary,
            dataForPopup    = {
                                group_name: summaryData.group_name,
                                group_id: summaryData.group_id,
                                reservation_id: reservation.id
                              };

        $scope.closeDialog();
        $timeout(function() {
            showCheckoutConfirmationPopup(dataForPopup);
        }, 800);
    };

    /**
     * Call to checkin a single reservation
     * @param {object} Selected Reservation
     */
    $scope.checkinReservation = function(reservation) {
        var summaryData     = $scope.groupConfigData.summary,
            dataForPopup    = {
                                group_name: summaryData.group_name,
                                group_id: summaryData.group_id,
                                reservation_id: reservation.id
                              };

        $scope.closeDialog();
        $timeout(function() {
            showCheckinConfirmationPopup(dataForPopup);
        }, 800);
    };

    /**
     * to goto staycard
     * @param {Object} reservation
     * @return {undefined}
     */
    $scope.navigateStayCard = function(reservation) {
        // Navigate to StayCard
        if ($scope.reservationStatusFlags.isGuestAttached) {
            $scope.closeDialog();
            $timeout(function() {

                $state.go('rover.reservation.staycard.reservationcard.reservationdetails', {
                    "id": reservation.id,
                    "confirmationId": reservation.confirm_no,
                    "isrefresh": true
                });
            }, 750);
        }
    };

    /**
    * when we completed the fetching of free rooms available
    * @param  {Object} - free rooms available
    * @return {undefined}
    */
    var successCallBackOfListOfFreeRoomsAvailable = function (data) {
        var roomId = initialPopupData.room_id,
            assignedRoom = [],
            isSameRoomType = (initialPopupData.room_type_id === $scope.ngDialogData.room_type_id);

        if (roomId !== null && roomId !== '' && isSameRoomType) {
            assignedRoom = [{
                id: roomId,
                room_number: initialPopupData.room_no
            }];
        }

        // Since we have to include already assigned rooms in the select box, merging with rooms coming from the api
        $scope.ngDialogData.roomsFreeToAssign = assignedRoom.concat(data.rooms);
    };

    /**
    * when the room type changed from edit reservation popup
    * @param  {Object} ngDialogData [reservation data]
    * @return {undefined}
    */
    $scope.changedReservationRoomType = function () {
        var rData = $scope.ngDialogData;

        var paramsForListOfFreeRooms = {
            reserevation_id: rData.id,
            num_of_rooms_to_fetch: 5,
            room_type_id: rData.room_type_id
        };

        var options = {
            params: paramsForListOfFreeRooms,
            successCallBack: successCallBackOfListOfFreeRoomsAvailable
        };

        calculateDisableCondition('roomType', true);
        $scope.callAPI(rvGroupRoomingListSrv.getFreeAvailableRooms, options);
    };

    $scope.changedReservationOccupancy = function() {
      calculateDisableCondition('occupancy', true);
    };

    $scope.changedReservationRoom = function() {
      calculateDisableCondition('room', true);
    };

    /**
    * when the reservation remove success
    * @param  {Object} data [API response]
    * @return {undefined}
    */
    var onRemoveReservationSuccess = function(data) {
        // calling initially required APIs
        $scope.$emit("REFRESH_GROUP_ROOMING_LIST_DATA");

        $timeout(function() {
            $scope.closeDialog();
        }, 700);
    };

    /**
    * Method to remove the reservation
    * @param  {object} reservation
    * @return {undefined}
    */
    $scope.removeReservation = function(reservation) {
        var rStatusFlags = $scope.reservationStatusFlags,
            options = null,
            params = null;

        if (!rStatusFlags.isExpected) {
            return false;
        }
        else {
            params = {
                id: reservation.id,
                group_id: $scope.groupConfigData.summary.group_id
            };

            options = {
                params: params,
                successCallBack: onRemoveReservationSuccess
            };
            $scope.callAPI(rvGroupConfigurationSrv.removeRoomingListItem, options);
        }
    };

    /**
     * when the reservation from choosed
     * @return {undefined}
     */
    var reservationFromDateChoosed = function(date, datePickerObj) {
        calculateDisableCondition('date', true);
        $scope.roomingListState.editedReservationStart = new tzIndependentDate(util.get_date_from_date_picker(datePickerObj));
        $scope.reservationToDateOptions.maxDate = getReservationMaxDate($scope.roomingListState.editedReservationStart);
        $scope.reservationToDateOptions.minDate = $scope.roomingListState.editedReservationStart;
        runDigestCycle();
    };

    /**
     * when the reservation to choosed
     * @return {undefined}
     */
    var reservationToDateChoosed = function(date, datePickerObj) {
        calculateDisableCondition('date', true);
        $scope.roomingListState.editedReservationEnd = new tzIndependentDate(util.get_date_from_date_picker(datePickerObj));
        $scope.reservationFromDateOptions.minDate = getReservationMinDate($scope.roomingListState.editedReservationEnd);
        $scope.reservationFromDateOptions.maxDate = $scope.roomingListState.editedReservationEnd;
        runDigestCycle();
    };

    var computeReservationStatusFlags = function(reservation) {
        var rStatus = reservation.reservation_status;

        return {
            isCheckedOut: rStatus === "CHECKEDOUT",
            isUneditable: rStatus === "CANCELED",
            isExpected: rStatus === "RESERVED" || rStatus === "CHECKING_IN",
            isStaying: rStatus === "CHECKEDIN" || rStatus === "CHECKING_OUT",
            canChekin: !!reservation.room_no && rStatus === "CHECKING_IN",
            isNoShow: rStatus === "NOSHOW",
            isGuestAttached: !!reservation.lastname,
            isPastArrival: new tzIndependentDate($rootScope.businessDate) >= new tzIndependentDate(reservation.arrival_date.split('T')[0])
        };
    };

    /**
     * Initialize important variables here
     * @return {undefined}
     */
    var initializeVariables = function() {
        _.extend(initialPopupData, $scope.ngDialogData);
        $scope.reservationStatusFlags = computeReservationStatusFlags($scope.ngDialogData);
    };

    // CICO-49191 Get the min date that can be chosen for a group reservation
    var getReservationMinDate = function (dateInfo) {
        var shoulderStartDate = tzIndependentDate($scope.groupConfigData.summary.shoulder_from_date),
            reservationEndDate = tzIndependentDate(dateInfo),
            businessDate = tzIndependentDate($rootScope.businessDate),
            dateString = $filter('date')(reservationEndDate, 'yyyy-MM-dd'),
            dateParts = dateString.match(/(\d+)/g),
            minStartDate = new Date(dateParts[0], parseInt(dateParts[1]) - 1, parseInt(dateParts[2], 10) - $scope.maxStayLength),
            minDate = shoulderStartDate > businessDate ? shoulderStartDate : businessDate;
            minDate = minStartDate > minDate ? minStartDate : minDate;

        return minDate;
    };

    // CICO-89019 validate max reservation date
    var getReservationMaxDate = function (dateInfo) {
        var reservationStartDate = tzIndependentDate(dateInfo),
            shoulderEndDate = tzIndependentDate($scope.groupConfigData.summary.shoulder_to_date),
            dateString = $filter('date')(reservationStartDate, 'yyyy-MM-dd'),
            dateParts = dateString.match(/(\d+)/g),
            maxEndDate = new Date(dateParts[0], parseInt(dateParts[1]) - 1, parseInt(dateParts[2], 10) + $scope.maxStayLength),
            maxDate = shoulderEndDate < maxEndDate ? shoulderEndDate : maxEndDate;

        return maxDate;
    };

    /**
     * utility function to set datepicker options
     * return - None
     */
    var setDatePickerOptions = function() {
        // date picker options - Common
        var commonDateOptions = {
            dateFormat: $rootScope.jqDateFormat,
            numberOfMonths: 1,
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

        // date picker options - From
        $scope.reservationFromDateOptions = _.extend({
            onSelect: reservationFromDateChoosed,
            minDate: getReservationMinDate($scope.ngDialogData.departure_date),
            maxDate: new tzIndependentDate($scope.ngDialogData.departure_date)
        }, commonDateOptions);

        // date picker options - Departute
        $scope.reservationToDateOptions = _.extend({
            onSelect: reservationToDateChoosed,
            minDate: tzIndependentDate($scope.ngDialogData.arrival_date) < tzIndependentDate($rootScope.businessDate) ? tzIndependentDate($rootScope.businessDate) : tzIndependentDate($scope.ngDialogData.arrival_date),
            maxDate: getReservationMaxDate($scope.ngDialogData.arrival_date)
        }, commonDateOptions);
    };
        /**
         * Close the bulk checkout status popup
         */
        $scope.closeErrorDialog = function() {
            if (bulkCheckoutPopup) {
                bulkCheckoutPopup.close();
            }
        };
    /**
    * Initialization of pop
    * @return {[type]} [description]
    */

    (function initilizeMe() {
        // variable initilizations
        initializeVariables();

        // date picker
        setDatePickerOptions();
    }());
}]);