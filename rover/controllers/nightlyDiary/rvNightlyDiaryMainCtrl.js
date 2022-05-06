'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

angular.module('sntRover').controller('rvNightlyDiaryMainController', ['$scope', '$rootScope', '$state', '$stateParams', '$filter', 'roomsList', 'datesList', 'ngDialog', '$timeout', 'reservationsList', 'RVNightlyDiarySrv', 'unassignedReservationList', 'rvPermissionSrv', 'rvUtilSrv', '$interval', 'rvHouseEventsListSrv', function ($scope, $rootScope, $state, $stateParams, $filter, roomsList, datesList, ngDialog, $timeout, reservationsList, RVNightlyDiarySrv, unassignedReservationList, rvPermissionSrv, rvUtilSrv, $interval, rvHouseEventsListSrv) {

    BaseCtrl.call(this, $scope);
    // CICO-36654 fix for touch events not getting detected iPad.
    document.removeEventListener('touchmove', window.touchmovepreventdefault, false);
    document.removeEventListener('touchmove', window.touchmovestoppropogate, false);
    $scope.$on('$destroy', function () {
        document.addEventListener('touchmove', window.touchmovepreventdefault, false);
        document.addEventListener('touchmove', window.touchmovestoppropogate, false);
    });
    var isFromStayCard = $stateParams.origin === 'STAYCARD',
        MAX_NO_OF_DAYS = 21,
        paginationDataBeforeMoveOrAssign = {},
        diaryStatusInterval = null,
        setAutoAssignStatus = function setAutoAssignStatus(data) {
        $scope.diaryData.autoAssign.status = data.auto_room_assignment_status;
        if (!$scope.diaryData.autoAssign.showHeader) {
            /**
             * Two valid cases:
             * 1. showHeader=false, isLocked=false, is_diary_locked=false
             *    normal diary view, UI not locked, no need to lock.
             * 2. showHeader=false, isLocked=false, is_diary_locked=true
             *    normal diary view, UI not locked, need to lock.
             *
             * isLocked can't be true when showHeader is false, so no need to worry about those 2 cases
             * Ultimately, is_diary_locked rewrites the other two variable if the showHeader is false
             */
            $scope.diaryData.autoAssign.showHeader = data.is_diary_locked;
            $scope.diaryData.autoAssign.isLocked = data.is_diary_locked;
        } else if ($scope.diaryData.autoAssign.showHeader && !$scope.diaryData.autoAssign.isLocked) {
            /**
             * 1. showHeader=true, isLocked=false, is_diary_locked=false
             *    The auto assignment header is on display, no need to lock UI or cancel the header
             * 2. showHeader=true, isLocked=false, is_diary_locked=true
             *    Someone is checking the header and the poll return the status as locked, we need to lock the diary
             *
             * In these cases, the auto assigne header is already on display but the UI isn't locked.
             * So only the second value needs to change depending on the value of is_diary_locked.
             */
            $scope.diaryData.autoAssign.isLocked = data.is_diary_locked;
        } else if ($scope.diaryData.autoAssign.showHeader && $scope.diaryData.autoAssign.isLocked) {
            /**
             * 1. showHeader=true, isLocked=true, is_diary_locked=false
             *    Diary UI is locked but poll returns that diary is unlocked, so need to unlock the UI.
             *    Also need to update diary view and unassigned list.
             * 2. showHeader=true, isLocked=true, is_diary_locked=true
             *    Poll result returned with locked status, maintain lock, display the header depending on the statuses
             *    pending, failed, completed, partial.
             *    Display the refresh button or unlock button.
             *
             * The second case is handled mainly by the switch block below.
             * In either of these cases also, we need to update the first two variables based on the value of is_diary_locked
             */
            $scope.diaryData.autoAssign.showHeader = data.is_diary_locked;
            $scope.diaryData.autoAssign.isLocked = data.is_diary_locked;
            if (!data.is_diary_locked) {
                refreshDiaryScreen();
                updateUnAssignedReservationList();
            }
        }

        if (data.is_diary_locked && $scope.diaryData.isEditReservationMode) {
            cancelReservationEditing();
            ngDialog.close();
            $scope.diaryData.isReservationSelected = false;
        }
        if (data.is_diary_locked && $scope.diaryData.isReservationSelected && !_.isEmpty($scope.diaryData.selectedUnassignedReservation)) {
            ngDialog.close();
            $scope.$broadcast('CANCEL_UNASSIGNED_RESERVATION');
        }
        $scope.diaryData.autoAssign.processDate = data.process_date ? data.process_date : $scope.diaryData.arrivalDate;

        switch (data.auto_room_assignment_status) {
            case 'pending':
                $scope.diaryData.autoAssign.statusText = 'Room auto assignment in progress';
                $scope.diaryData.autoAssign.statusDescription = 'Diary is locked until process is completed';
                $scope.diaryData.autoAssign.statusClass = '';
                break;
            case 'failed':
                $scope.diaryData.autoAssign.statusText = 'Room auto assignment failed';
                $scope.diaryData.autoAssign.statusDescription = '0 Rooms Assigned';
                $scope.diaryData.autoAssign.statusClass = 'failed';
                break;
            case 'partial':
                $scope.diaryData.autoAssign.statusText = 'Room auto assignment completed';
                $scope.diaryData.autoAssign.statusDescription = 'Some Reservations Remain Unassigned';
                $scope.diaryData.autoAssign.statusClass = 'semi-completed';
                break;
            case 'completed':
                if (data.is_diary_locked) {
                    $scope.diaryData.autoAssign.statusText = 'Room auto assignment completed';
                    $scope.diaryData.autoAssign.statusDescription = 'Rooms Assigned to All Reservations';
                    $scope.diaryData.autoAssign.statusClass = 'completed';
                } else {
                    $scope.diaryData.autoAssign.statusText = '';
                    $scope.diaryData.autoAssign.statusDescription = '';
                    $scope.diaryData.autoAssign.statusClass = '';
                    $scope.diaryData.autoAssign.processDate = $scope.diaryData.arrivalDate;
                }
                break;
        }
    };

    /*
     * utility method Initiate controller
     * @return {}
     */
    var initiateBasicConfig = function initiateBasicConfig() {
        $scope.heading = $filter('translate')('MENU_ROOM_DIARY');
        $scope.setTitle($filter('translate')('MENU_ROOM_DIARY'));
        $scope.$emit('updateRoverLeftMenu', 'nightlyDiaryReservation');
        var srvParams = {};

        if (isFromStayCard) {
            srvParams = RVNightlyDiarySrv.getCache();
        } else {
            if ($stateParams.start_date) {
                srvParams.start_date = moment(tzIndependentDate($stateParams.start_date)).format($rootScope.momentFormatForAPI);
            } else {
                srvParams.start_date = moment(tzIndependentDate($rootScope.businessDate)).subtract(1, 'days').format($rootScope.momentFormatForAPI);
            }
            srvParams.no_of_days = 7;
            srvParams.page = 1;
            srvParams.per_page = 50;
        }

        // data set for diary used for Angular code.
        $scope.diaryData = {
            autoAssign: {
                showHeader: false,
                isLocked: false,
                status: '',
                statusText: '',
                statusDescription: '',
                statusClass: '',
                processDate: ''
            },
            datesGridData: datesList.dates,
            businessDate: $rootScope.businessDate,
            diaryRoomsList: roomsList.rooms,
            numberOfDays: srvParams.no_of_days,
            fromDate: srvParams.start_date,
            arrivalDate: srvParams.start_date <= $rootScope.businessDate ? $rootScope.businessDate : srvParams.start_date,
            toDate: '',
            paginationData: {
                perPage: 50,
                page: srvParams.page,
                totalCount: roomsList.total_count
            },
            hasMultipleMonth: false,
            firstMonthDateList: [],
            secondMonthDateList: [],
            reservationsList: reservationsList,
            unassignedReservationList: unassignedReservationList,
            hasOverlay: false,
            isEditReservationMode: isFromStayCard,
            hideMoveButton: false,
            showUnassignedPanel: false,
            showUnassignedReservations: false,
            selectedRoomTypes: [],
            selectedFloors: [],
            selectedRoomFeatures: [],
            isFromStayCard: false,
            hideUnassignRoomButton: true,
            filterList: {},
            hideRoomType: true,
            hideFloorList: true,
            isBookRoomViewActive: false,
            showBookFilterPanel: false,
            bookRoomViewFilter: {
                fromDate: null,
                toDate: null,
                arrivalTime: datesList.hotelCheckinTime,
                arrivalTimeList: [],
                departureTime: datesList.hotelCheckoutTime,
                departureTimeList: [],
                nights: 1,
                hotelCheckinTime: datesList.hotelCheckinTime,
                hotelCheckoutTime: datesList.hotelCheckoutTime
            },
            availableSlotsForBookRooms: [],
            isAssignRoomViewActive: false,
            isMoveRoomViewActive: false,
            showSaveChangeButtonAfterShortenOrExtent: {
                arrivalChanged: false,
                departureChanged: false,
                show: false
            },
            availableSlotsForAssignRooms: {
                availableRoomList: [],
                fromDate: null,
                nights: null
            },
            requireAuthorization: false,
            isReservationSelected: false,
            selectedUnassignedReservation: {},
            roomAssignmentFilters: {},
            isCancelledMoveOrAssign: false,
            eventsCount: {}
        };
        $scope.currentSelectedReservation = {};
        $scope.currentSelectedRoom = {};
    };

    $scope.addListener('POLL_N_DIARY_AUTO_ASSIGN_STATUS', function () {
        diaryStatusInterval = $interval(diaryLockStatus, 2000);
    });
    $scope.addListener('STOP_N_DIARY_AUTO_ASSIGN_STATUS_POLLING', function () {
        $interval.cancel(diaryStatusInterval);
    });

    initiateBasicConfig();
    /**
     * method to get Pagination parametrs
     * @return {Object} with pagination params
     */
    var getPaginationParams = function getPaginationParams(offset) {
        return {
            per_page: $scope.diaryData.paginationData.perPage,
            page: offset ? $scope.diaryData.paginationData.page + offset : $scope.diaryData.paginationData.page,
            total_count: $scope.diaryData.paginationData.totalCount
        };
    };

    /**
     * method to update Pagination parametrs
     */
    var handlePaginationData = function handlePaginationData(data) {
        $scope.diaryData.paginationData.totalCount = data.roomList.total_count;
        $scope.diaryData.paginationData.page = data.roomList.page_number;
    };

    var showErrorMessagePopup = function showErrorMessagePopup(errorMessage) {
        ngDialog.open({
            template: '/assets/partials/nightlyDiary/rvNightlyDiaryErrorMessage.html',
            scope: $scope,
            className: '',
            closeByDocument: false,
            closeByEscape: false,
            data: {
                errorMessage: errorMessage
            }
        });
    },
        showWarningMessagePopup = function showWarningMessagePopup(warningMessage) {
        ngDialog.open({
            template: '/assets/partials/nightlyDiary/rvNightlyDiaryNoAvailableRooms.html',
            className: '',
            scope: $scope,
            data: {
                warningMessage: warningMessage,
                isRefresh: false
            }
        });
    };

    // Method to update room list data.
    var fetchRoomListDataAndReservationListData = function fetchRoomListDataAndReservationListData(roomId, offset, reservationId) {
        var successCallBackFetchRoomList = function successCallBackFetchRoomList(data) {
            $scope.diaryData.diaryRoomsList = data.roomList.rooms;
            $scope.diaryData.reservationsList = data.reservationList;
            handlePaginationData(data);
            $scope.diaryData.datesGridData = data.dateList.dates;
            if (data.roomList.rooms.length === 0) {
                $timeout(function () {
                    showWarningMessagePopup('No available rooms found for selected criteria');
                }, 500);
            }
            $scope.$broadcast('FETCH_COMPLETED_DATE_LIST_DATA');
            if ($scope.diaryData.isBookRoomViewActive) {
                callbackForBookedOrAvailableListner();
            } else {
                updateDiaryView();
            }

            if (roomId) {
                $scope.$broadcast('CLOSE_SEARCH_RESULT');
            }
            // Handle reservation selection.
            if (roomId && reservationId) {
                var reservationList = _.find($scope.diaryData.reservationsList.rooms, function (item) {
                    return item.id === roomId;
                }),
                    reservation = _.find(reservationList.reservations, function (item) {
                    return item.id === reservationId;
                }),
                    roomObj = { id: roomId };

                selectReservation('', reservation, roomObj);
                // Handle Navigation from N-diary with Move action.
                if ($stateParams.action === 'TRIGGER_MOVE_ROOM') {
                    $scope.$broadcast('TRIGGER_MOVE_ROOM');
                }
            }
        },
            postData = _extends({}, getPaginationParams(offset), {
            'start_date': $scope.diaryData.fromDate,
            'no_of_days': $scope.diaryData.numberOfDays,
            'selected_room_type_ids': $scope.diaryData.selectedRoomTypes,
            'selected_floor_ids': $scope.diaryData.selectedFloors,
            'selected_room_feature_ids': $scope.diaryData.selectedRoomFeatures
        });

        if ($scope.diaryData.isAssignRoomViewActive || $scope.diaryData.isMoveRoomViewActive) {
            var roomTypeId = $scope.diaryData.availableSlotsForAssignRooms.roomTypeId;

            postData.selected_room_type_ids = [roomTypeId];
            paginationDataBeforeMoveOrAssign = angular.copy(postData);
            // CICO-68767 : Handle pagination(offset) while ASSIGN or MOVE actions
            if (!(($scope.diaryData.isAssignRoomViewActive || $scope.diaryData.isMoveRoomViewActive) && !!offset)) {
                postData.page = 1;
            }
        } else if ($scope.diaryData.isCancelledMoveOrAssign) {
            postData.page = paginationDataBeforeMoveOrAssign.page ? paginationDataBeforeMoveOrAssign.page : 1;
            $scope.diaryData.isCancelledMoveOrAssign = false;
        }

        if (roomId) {
            postData.room_id = roomId;
            $scope.diaryData.selectedRoomId = roomId;
        }

        var options = {
            params: postData,
            successCallBack: successCallBackFetchRoomList
        };

        $scope.callAPI(RVNightlyDiarySrv.fetchRoomsListAndReservationList, options);
    };

    /*
     * Handle Next Button in Dairy.
     * @return {}
     */
    var goToPrevPage = function goToPrevPage() {
        cancelReservationEditing();
        fetchRoomListDataAndReservationListData(null, -1);
    };

    /*
     * Handle Prev Button in Dairy.
     * @return {}
     */
    var goToNextPage = function goToNextPage() {
        cancelReservationEditing();
        fetchRoomListDataAndReservationListData(null, 1);
    };

    var showReservationSelected = function showReservationSelected() {
        var dispatchData = {
            type: 'RESERVATION_SELECTED',
            selectedReservationId: $scope.currentSelectedReservation.id,
            reservationsList: $scope.diaryData.reservationsList.rooms,
            selectedRoomId: $scope.diaryData.selectedRoomId,
            currentSelectedReservation: $scope.currentSelectedReservation
        };

        store.dispatch(dispatchData);
    };

    /*
     * Show selected reservation highlighted and enable edit bar
     * @param reservation - Current selected reservation
     */
    var selectReservation = function selectReservation(e, reservation, room) {
        if (!$scope.diaryData.isEditReservationMode) {
            var roomDetails = _.findWhere($scope.diaryData.diaryRoomsList, { id: room.id });

            $scope.diaryData.showSaveChangeButtonAfterShortenOrExtent.show = false;
            $scope.diaryData.hideMoveButton = reservation.no_room_move;
            $scope.diaryData.hideUnassignRoomButton = reservation.status === 'CHECKEDIN' || reservation.status === 'CHECKEDOUT' || reservation.status === 'CHECKING_OUT';
            $scope.diaryData.isEditReservationMode = true;
            $scope.currentSelectedReservation = _extends({}, reservation, {
                room_type_name: roomDetails.room_type_name
            });
            $scope.currentSelectedRoom = room;
            $scope.diaryData.selectedRoomId = room.id;
            $scope.extendShortenReservationDetails = {
                'arrival_date': reservation.arrival_date,
                'dep_date': reservation.dept_date,
                'reservation_id': reservation.id,
                'room_number': roomDetails.room_no
            };

            showReservationSelected();
            $timeout(function () {
                $scope.$apply();
            }, 10);
        }
    };

    var resetUnassignedList = function resetUnassignedList() {
        $scope.diaryData.isAssignRoomViewActive = false;
        $scope.$broadcast('RESET_UNASSIGNED_LIST_SELECTION');
        $scope.diaryData.availableSlotsForAssignRooms = {};
    };

    var hideAssignOrMoveRoomSlots = function hideAssignOrMoveRoomSlots() {
        $scope.diaryData.isMoveRoomViewActive = false;
        $scope.diaryData.availableSlotsForAssignRooms = {};
        cancelReservationEditing();
        fetchRoomListDataAndReservationListData();
    };

    /*
     *  Handle API call to update reservation MOVE or ASSIGN
     *  @param {object}  [roomDetails - Current selected room details]
     *  @param {object}  [reservationDetails - Current selected reservation details]
     *  @param {string}  [type - 'MOVE' or 'ASSIGN']
     *  @return {}
     */
    var callAPIforAssignOrMoveRoom = function callAPIforAssignOrMoveRoom(roomDetails, reservationDetails, type, timeObj) {
        var successCallBackAssignRoom = function successCallBackAssignRoom() {
            $scope.errorMessage = '';
            if (type === 'ASSIGN') {
                $scope.$broadcast('SUCCESS_ROOM_ASSIGNMENT', roomDetails);
            } else if (type === 'MOVE') {
                hideAssignOrMoveRoomSlots();
            }
            if (timeObj) {
                ngDialog.close();
            }
        },
            failureCallBackAssignRoom = function failureCallBackAssignRoom(errorMessage) {
            if (errorMessage.httpStatus && errorMessage.httpStatus === 470) {
                diaryLockStatus();
            }
        },
            postData = {
            "reservation_id": reservationDetails.reservationId,
            "room_number": roomDetails.room_number,
            "without_rate_change": true,
            "is_preassigned": true,
            "forcefully_assign_room": false,
            "is_from_nightly_diary": true
        };

        if (timeObj) {
            postData.arrival_time = timeObj.arrival_time;
            postData.departure_time = timeObj.departure_time;
        }

        var options = {
            params: postData,
            successCallBack: successCallBackAssignRoom,
            failureCallBack: failureCallBackAssignRoom
        };

        $scope.callAPI(RVNightlyDiarySrv.assignRoom, options);
    };

    /*
     *  Show DiarySetTimePopup.
     *  @param {object} [roomDetails - Current selected room details]
     *  @param {object} [reservationDetails - Current selected reservation details]
     *  @param {string}  [type - 'MOVE' or 'ASSIGN']
     *  @return {}
     */
    var showDiarySetTimePopup = function showDiarySetTimePopup(roomDetails, reservationDetails, type) {

        $scope.setTimePopupData = {
            type: type,
            roomDetails: roomDetails,
            reservationDetails: reservationDetails,
            data: {}
        };

        var triggerSetTimePopup = function triggerSetTimePopup() {
            ngDialog.open({
                template: '/assets/partials/nightlyDiary/rvNightlyDiarySetTimePopup.html',
                scope: $scope,
                className: '',
                closeByDocument: false,
                closeByEscape: false,
                controller: 'rvNightlyDiarySetTimePopupCtrl'
            });
        };

        var successCallBackFetchAvailableTimeSlots = function successCallBackFetchAvailableTimeSlots(data) {
            $scope.setTimePopupData.data = data;
            // Handle ASSIGN/MOVE button click handle.
            if (type === 'MOVE' && reservationDetails.reservationStatus === 'CHECKEDIN' && roomDetails.room_ready_status === 'DIRTY') {
                showWarningMessagePopup("Cannot move occupied guest to a dirty room");
            } else if ((type === 'ASSIGN' || type === 'MOVE') && data.is_overlapping_reservations_exists) {
                triggerSetTimePopup();
            } else if ((type === 'ASSIGN' || type === 'MOVE') && !data.is_overlapping_reservations_exists) {
                callAPIforAssignOrMoveRoom(roomDetails, reservationDetails, type);
            }
        },
            postData = {
            "room_id": roomDetails.room_id,
            "start_date": reservationDetails.fromDate,
            "no_of_days": MAX_NO_OF_DAYS
        };

        if (type === 'ASSIGN' || type === 'MOVE') {
            postData.reservation_id = reservationDetails.reservationId;
            postData.no_of_days = reservationDetails.nights;
        }

        var options = {
            params: postData,
            successCallBack: successCallBackFetchAvailableTimeSlots
        };

        // API call to get available slots.
        $scope.callAPI(RVNightlyDiarySrv.fetchAvailableTimeSlots, options);
    };

    /*
     *  Method to verify whether occupancy message needed to show.
     *  @param {Object} [room details]
     *  @param {Object} [reservation details]
     *  @return {boolean} [isShowOccupancyMessagePopup flag]
     */
    var isShowOccupancyMessagePopup = function isShowOccupancyMessagePopup(roomDetails, reservationDetails) {
        var showOccupancyMessage = false;

        if (roomDetails.room_max_occupancy !== null && reservationDetails.reservationOccupancy !== null) {
            if (roomDetails.room_max_occupancy < reservationDetails.reservationOccupancy) {
                showOccupancyMessage = true;
                $scope.max_occupancy = roomDetails.room_max_occupancy;
            }
        } else if (roomDetails.room_type_max_occupancy !== null && reservationDetails.reservationOccupancy !== null) {
            if (roomDetails.room_type_max_occupancy < reservationDetails.reservationOccupancy) {
                showOccupancyMessage = true;
                $scope.max_occupancy = roomDetails.room_type_max_occupancy;
            }
        }
        return showOccupancyMessage;
    };

    /*
     *  Handle ASSIGN button click.
     *  @param {object} [roomDetails - Current selected room details]
     *  @param {object} [reservationDetails - Current selected reservation details]
     *  @return {}
     */
    var clickedAssignRoom = function clickedAssignRoom(roomDetails, reservationDetails) {
        if (isShowOccupancyMessagePopup(roomDetails, reservationDetails)) {
            ngDialog.openConfirm({
                template: '/assets/partials/nightlyDiary/rvNightlyDiaryMaxOccupancyPopup.html',
                className: 'ngdialog-theme-default',
                scope: $scope
            }).then(function () {
                showDiarySetTimePopup(roomDetails, reservationDetails, 'ASSIGN');
            }, function () {});
        } else {
            showDiarySetTimePopup(roomDetails, reservationDetails, 'ASSIGN');
        }
    };

    /*
     * Set time from rvNightlyDiarySetTimePopup.
     */
    $scope.addListener('SET_TIME_AND_SAVE', function (e, timeObj) {
        callAPIforAssignOrMoveRoom($scope.setTimePopupData.roomDetails, $scope.setTimePopupData.reservationDetails, $scope.setTimePopupData.type, timeObj);
    });

    /*
     *  Handle MOVE TO button click.
     *  @param {object} [roomDetails - Current selected room details]
     *  @param {object} [reservationDetails - Current selected reservation details]
     *  @return {}
     */
    var clickedMoveRoom = function clickedMoveRoom(roomDetails, reservationDetails) {
        if (isShowOccupancyMessagePopup(roomDetails, reservationDetails)) {
            ngDialog.openConfirm({
                template: '/assets/partials/nightlyDiary/rvNightlyDiaryMaxOccupancyPopup.html',
                className: 'ngdialog-theme-default',
                scope: $scope
            }).then(function () {
                showDiarySetTimePopup(roomDetails, reservationDetails, 'MOVE');
            }, function () {});
        } else {
            showDiarySetTimePopup(roomDetails, reservationDetails, 'MOVE');
        }
    },
        showPopupForReservationWithUnassignedRoom = function showPopupForReservationWithUnassignedRoom() {
        ngDialog.open({
            template: '/assets/partials/nightlyDiary/rvNightlyDiaryReservationWithUnassignedRoom.html',
            scope: $scope,
            className: '',
            closeByDocument: false,
            closeByEscape: false
        });
    },
        showContinueWithBookPopup = function showContinueWithBookPopup(callbackAction) {
        ngDialog.open({
            template: '/assets/partials/nightlyDiary/rvNightlyDiaryContinueWithBookPopup.html',
            scope: $scope,
            className: '',
            closeByDocument: false,
            closeByEscape: false,
            data: {
                callbackAction: callbackAction
            }
        });
    },
        handleCreateReservationFlow = function handleCreateReservationFlow(roomData, roomTypeData, bookType) {
        // Navigation directly to Reservation Creation Screen if Nightly diary.
        // startDate (strat date of diary)- is passed for back navigation purpose.
        var callbackAction = function callbackAction() {
            var roomAndRatesState = 'rover.reservation.staycard.mainCard.room-rates';

            $state.go(roomAndRatesState, {
                'from_date': roomData.fromDate,
                'to_date': roomData.toDate,
                'arrivalTime': roomData.arrivalTime,
                'departureTime': roomData.departureTime,
                'fromState': 'NIGHTLY_DIARY',
                'room_type_id': roomData.room_type_id,
                'selectedRoomId': roomData.room_id,
                'selectedRoomNo': roomData.room_no,
                'numNights': roomData.nights
            });

            ngDialog.close();
        },
            diaryMode = rvUtilSrv.getDiaryMode();

        if (bookType === 'BOOK') {

            if (diaryMode === 'FULL' && roomTypeData.unassigned_reservations_present && roomTypeData.availability <= 0) {
                // There are reservations with unassigned Rooms.
                // No additional availability exists for the selected dates / times.
                showPopupForReservationWithUnassignedRoom();
            } else if (roomTypeData.unassigned_reservations_present) {
                // There are reservations with unassigned rooms.
                // You can still proceed, but it might be good to assign those reservations first.
                showContinueWithBookPopup(callbackAction);
            } else {
                // Directly go to reservation creation flow.
                callbackAction();
            }
        } else if (bookType === 'OVERBOOK') {
            // Directly go to reservation creation flow.
            callbackAction();
        }
    };

    // Handle book room button actions.
    var clickedBookRoom = function clickedBookRoom(roomData, roomTypeData, bookType) {
        handleCreateReservationFlow(roomData, roomTypeData, bookType);
    };

    /*
     * Show Stay Changes validation popup.
     */
    var openMessagePopupForValidationStayChanges = function openMessagePopupForValidationStayChanges() {
        ngDialog.open({
            template: '/assets/partials/nightlyDiary/rvNightlyDiaryValidateStayChanges.html',
            scope: $scope,
            className: '',
            closeByDocument: false,
            closeByEscape: false,
            controller: 'rvNightlyDiaryValidationStayCtrl'
        });
    };

    /*
     * Function to check room availability.
     */
    var checkReservationAvailability = function checkReservationAvailability(arrivalDate, departureDate) {
        var successCallBackStayChanges = function successCallBackStayChanges(response) {

            $scope.popupData = {
                data: response,
                showOverBookingButton: false,
                message: '',
                diaryMode: rvUtilSrv.getDiaryMode()
            };
            var proceedSave = false;

            if (response.is_room_available && response.message === '') {
                // Proceed without any popup, save changes and updated.
                proceedSave = true;
            } else if (!response.is_room_available || !response.is_no_restrictions_exist || response.is_group_reservation && !response.is_group_available || !response.is_rate_available) {
                // Show popup
                // Show message
                // No overbooking button
                $scope.popupData.message = response.message;
                openMessagePopupForValidationStayChanges();
            } else {
                // Show popup
                // Show message
                // overbooking button
                $scope.popupData.message = response.message;
                $scope.popupData.showOverBookingButton = true;
                proceedSave = true;
                openMessagePopupForValidationStayChanges();
            }

            if (proceedSave) {
                $scope.extendShortenReservationDetails = {
                    'arrival_date': moment(arrivalDate, $rootScope.dateFormat.toUpperCase()).format('YYYY-MM-DD'),
                    'dep_date': moment(departureDate, $rootScope.dateFormat.toUpperCase()).format('YYYY-MM-DD'),
                    'reservation_id': $scope.currentSelectedReservation.id,
                    'room_number': $scope.currentSelectedReservation.room_no
                };
            }
            $scope.diaryData.requireAuthorization = response.require_cc_auth;
            $scope.diaryData.routingInfo = response.routing_info;
            $scope.extendShortenReservationDetails.authorize_credit_card = response.require_cc_auth;
        };

        var options = {
            params: {
                'new_arrival_date': moment(arrivalDate, $rootScope.dateFormat.toUpperCase()).format('YYYY-MM-DD'),
                'new_dep_date': moment(departureDate, $rootScope.dateFormat.toUpperCase()).format('YYYY-MM-DD'),
                'reservation_id': $scope.currentSelectedReservation.id,
                'room_id': $scope.currentSelectedRoom.id
            },
            successCallBack: successCallBackStayChanges
        };

        $scope.callAPI(RVNightlyDiarySrv.validateStayChanges, options);
    };

    /*
     * Function to cancel message popup.
     */
    $scope.closeDialog = function () {
        cancelReservationEditing();
        ngDialog.close();
    };

    // Flag for CC auth permission
    var hasCCAuthPermission = function hasCCAuthPermission() {
        return rvPermissionSrv.getPermissionValue('OVERRIDE_CC_AUTHORIZATION');
    },
        callbackAfterSave = function callbackAfterSave() {
        cancelReservationEditing();
        $timeout(function () {
            fetchRoomListDataAndReservationListData();
        }, 700);
        $scope.closeDialog();
    };

    // Handle continue without CC
    $scope.continueWithoutCC = function () {
        callbackAfterSave();
    };

    // Handle continue after success auth
    $scope.continueAfterSuccessAuth = function () {
        callbackAfterSave();
    };

    // Close billing info popup.
    $scope.closeBillingInfoPopup = function () {
        callbackAfterSave();
    };

    // Update billing info details.
    $scope.updateBillingInformation = function () {
        var successCallBack = function successCallBack() {
            callbackAfterSave();
        };

        var options = {
            params: {
                'from_date': $scope.extendShortenReservationDetails.arrival_date,
                'to_date': $scope.extendShortenReservationDetails.dep_date,
                'reservation_id': $scope.extendShortenReservationDetails.reservation_id,
                'is_from_diary': true
            },
            successCallBack: successCallBack
        };

        $scope.callAPI(RVNightlyDiarySrv.updateBillingInformation, options);
    };

    /**
     * Shows pop up to remind update the billing info
     */
    var showBillingInformationPrompt = function showBillingInformationPrompt() {
        ngDialog.open({
            template: '/assets/partials/reservation/alerts/rvShowBillingInformationPopup.html',
            className: '',
            closeByDocument: false,
            scope: $scope
        });
    };

    /*
     * Function to save editing of a reservation
     */
    var saveReservationEditing = function saveReservationEditing() {
        var successCallBack = function successCallBack(response) {
            var routingInfo = $scope.diaryData.routingInfo;

            if ($scope.diaryData.requireAuthorization && $scope.isStandAlone) {
                // CICO-7306 : With Authorization flow .: Auth Success
                if (response.data.auth_status) {
                    $scope.isInProgressScreen = false;
                    $scope.isSuccessScreen = true;
                    $scope.isFailureScreen = false;
                    $scope.cc_auth_amount = response.data.cc_auth_amount;
                    $scope.cc_auth_code = response.data.cc_auth_code;
                } else {
                    // CICO-7306 : With Authorization flow .: Auth declined
                    $scope.isInProgressScreen = false;
                    $scope.isSuccessScreen = false;
                    $scope.isFailureScreen = true;
                    $scope.cc_auth_amount = response.data.cc_auth_amount;
                }
            } else if (routingInfo.incoming_from_room || routingInfo.out_going_to_room || routingInfo.out_going_to_comp_tra) {
                showBillingInformationPrompt();
            } else {
                callbackAfterSave();
            }
        };

        if ($scope.diaryData.requireAuthorization && $scope.isStandAlone) {
            // Start authorization process...
            $scope.isInProgressScreen = true;
            $scope.isSuccessScreen = false;
            $scope.isFailureScreen = false;
            $scope.isCCAuthPermission = hasCCAuthPermission();

            ngDialog.open({
                template: '/assets/partials/bill/ccAuthorization.html',
                className: '',
                closeByDocument: false,
                scope: $scope
            });
        }

        var options = {
            params: $scope.extendShortenReservationDetails,
            successCallBack: successCallBack,
            failureCallBack: function failureCallBack(errorMessage) {
                if (errorMessage.httpStatus && errorMessage.httpStatus === 470) {
                    diaryLockStatus();
                }
            }
        };

        $scope.callAPI(RVNightlyDiarySrv.confirmUpdates, options);
    };

    /*
     * Show selected reservation highlighted and enable edit bar
     * @param reservation - Current selected reservation
     */
    var extendShortenReservation = function extendShortenReservation(newArrivalPosition, newDeparturePosition) {

        var dispatchData = {
            type: 'EXTEND_SHORTEN_RESERVATION',
            newArrivalPosition: newArrivalPosition,
            newDeparturePosition: newDeparturePosition
        };

        store.dispatch(dispatchData);
    };

    /*
     * Function to cancel editing of a reservation
     */
    var cancelReservationEditing = function cancelReservationEditing() {
        if ($scope.diaryData.isEditReservationMode) {
            $scope.diaryData.isEditReservationMode = false;
            $scope.currentSelectedReservation = {};
            var dispatchData = {
                type: 'CANCEL_RESERVATION_EDITING',
                reservationsList: $scope.diaryData.reservationsList.rooms,
                paginationData: angular.copy($scope.diaryData.paginationData),
                currentSelectedReservation: $scope.currentSelectedReservation
            };

            store.dispatch(dispatchData);
        }
    };

    /*
     * Function to show/hide change save after extend/shorten reservation
     */
    var showOrHideSaveChangesButton = function showOrHideSaveChangesButton(bool, isArrival) {
        if (isArrival) {
            $scope.diaryData.showSaveChangeButtonAfterShortenOrExtent.arrivalChanged = bool;
        } else {
            $scope.diaryData.showSaveChangeButtonAfterShortenOrExtent.departureChanged = bool;
        }
        if ($scope.diaryData.showSaveChangeButtonAfterShortenOrExtent.arrivalChanged || $scope.diaryData.showSaveChangeButtonAfterShortenOrExtent.departureChanged) {
            $scope.diaryData.showSaveChangeButtonAfterShortenOrExtent.show = true;
        } else {
            $scope.diaryData.showSaveChangeButtonAfterShortenOrExtent.show = false;
        }
    };

    /*
     * Cancel button click edit bar
     */
    $scope.addListener('CANCEL_RESERVATION_EDITING', function () {
        cancelReservationEditing();
    });
    /*
     * Save button click edit bar
     */
    $scope.addListener('SAVE_RESERVATION_EDITING', function () {
        saveReservationEditing();
        if (!!$scope.popupData && !$scope.popupData.disableOverBookingButton) {
            ngDialog.close();
        }
    });

    /* Handle event emitted from child controllers.
     * To update diary data - rooms & reservations according to changed date constraints.
     * @param {Number} RoomId - selected room id from search filters.
    */
    $scope.addListener('UPDATE_RESERVATIONLIST', function (event, roomId, reservationId) {
        if (!!roomId) {
            $scope.$broadcast('RESET_RIGHT_FILTER_BAR');
        }
        cancelReservationEditing();
        fetchRoomListDataAndReservationListData(roomId, null, reservationId);
    });
    var updateUnAssignedReservationList = function updateUnAssignedReservationList(event, action) {
        resetUnassignedList();
        if (action !== 'REFRESH') {
            $scope.diaryData.arrivalDate = $scope.diaryData.fromDate <= $rootScope.businessDate || action === 'RESET' ? $rootScope.businessDate : $scope.diaryData.fromDate;
        }
        $scope.$broadcast('FETCH_UNASSIGNED_LIST_DATA');
        $scope.$broadcast('RESET_UNASSIGNED_LIST_SELECTION');
    };

    $scope.addListener('UPDATE_UNASSIGNED_RESERVATIONLIST', updateUnAssignedReservationList);

    /**
     * Listener to initiate the auto assign controller
     */
    $scope.addListener('INITIATE_AUTO_ASSIGN', function () {
        $scope.$broadcast('INITIATE_AUTO_ASSIGN_CTRL');
        $scope.diaryData.autoAssign.showHeader = true;
    });

    /* Handle event emitted from child controllers.
     * To refresh diary data - rooms & reservations.
     * @param {Number} RoomId - selected room id from search filters.
    */
    $scope.addListener('REFRESH_DIARY_ROOMS_AND_RESERVATIONS', function (event, roomId) {
        $scope.$broadcast('RESET_RIGHT_FILTER_BAR');
        cancelReservationEditing();
        fetchRoomListDataAndReservationListData(roomId);
    });

    /*
     * Handle event emitted from child controller.
     * To refresh diary data - rooms and reservations after applying filter.
     */
    var refreshDiaryScreen = function refreshDiaryScreen() {
        $scope.diaryData.paginationData.page = 1;
        fetchRoomListDataAndReservationListData();
        cancelReservationEditing();
    };

    $scope.addListener('REFRESH_DIARY_SCREEN', refreshDiaryScreen);

    var resetFilterBarAndRefreshDiary = function resetFilterBarAndRefreshDiary() {
        resetUnassignedList();
        $scope.$broadcast('RESET_RIGHT_FILTER_BAR');
        $scope.diaryData.paginationData.page = 1;
        fetchRoomListDataAndReservationListData();
        cancelReservationEditing();
    };

    /*
     *  Handle event emitted from child controller.
     *  When clicking Unassigned filter button.
     *  Reset filter selections and,
     *  Refresh diary data - rooms and reservations after applying filter.
     */
    $scope.addListener('RESET_RIGHT_FILTER_BAR_AND_REFRESH_DIARY', resetFilterBarAndRefreshDiary);

    /* 
     *  To Show 'ASSIGN' or 'MOVE' room button in Diary.
     *  {object} [event]
     *  {object} [avaialble slots for ASSIGN/MOVE - data object]
     */
    $scope.addListener('SHOW_ASSIGN_ROOM_SLOTS', function (event, newData) {
        if (newData.type === 'MOVE_ROOM') {
            $scope.diaryData.isMoveRoomViewActive = true;
        } else if (newData.type === 'ASSIGN_ROOM') {
            $scope.diaryData.isAssignRoomViewActive = true;
        }
        $scope.diaryData.availableSlotsForAssignRooms = newData;
        fetchRoomListDataAndReservationListData();
    });

    /*  
     *  To Hide 'ASSIGN' or 'MOVE' room button in Diary.
     */
    $scope.addListener('HIDE_ASSIGN_ROOM_SLOTS', function () {
        $scope.diaryData.isAssignRoomViewActive = false;
        $scope.diaryData.isMoveRoomViewActive = false;
        $scope.diaryData.availableSlotsForAssignRooms = {};
        fetchRoomListDataAndReservationListData();
    });

    /*  
     *  Toggle filter section.
     */
    $scope.addListener('TOGGLE_FILTER_TOP', function (e, value) {
        $scope.$broadcast('TOGGLE_FILTER', value);
    });

    /*  
     *  Guest preference filter message
     */
    $scope.addListener('APPLY_GUEST_PREFERENCE_FILTER_TOP', function () {
        $scope.$broadcast('APPLY_GUEST_PREFERENCE_FILTER');
    });

    // Handle validation popup close.
    $scope.closeDialogAndRefresh = function (isRefresh) {
        if (!!isRefresh) {
            resetFilterBarAndRefreshDiary();
        }
        ngDialog.close();
    };

    /*  
     *  Handle error messages
     */
    $scope.addListener('SHOW_ERROR_MESSAGE', function (event, errorMessage) {
        showErrorMessagePopup(errorMessage);
    });

    /**
     * if the user has enough permission to over book House
     * @return {Boolean}
     */
    var hasPermissionToHouseOverBook = function hasPermissionToHouseOverBook() {
        return rvPermissionSrv.getPermissionValue('OVERBOOK_HOUSE');
    };

    /**
     * if the user has enough permission to over book room type
     * @return {Boolean}
     */
    var hasPermissionToRoomTypeOverBook = function hasPermissionToRoomTypeOverBook() {
        return rvPermissionSrv.getPermissionValue('OVERBOOK_ROOM_TYPE');
    };

    /**
     * utility method to call available slots API
     */
    var callbackForBookedOrAvailableListner = function callbackForBookedOrAvailableListner() {
        if ($scope.diaryData.isBookRoomViewActive) {
            $scope.diaryData.rightFilter = 'RESERVATION_FILTER';
            var bookRoomViewFilter = $scope.diaryData.bookRoomViewFilter;

            var successCallBackFunction = function successCallBackFunction(response) {
                $scope.errorMessage = '';
                $scope.diaryData.availableSlotsForBookRooms = response;
                $scope.diaryData.availableSlotsForBookRooms.fromDate = bookRoomViewFilter.fromDate;
                $scope.diaryData.availableSlotsForBookRooms.toDate = bookRoomViewFilter.toDate;
                $scope.diaryData.availableSlotsForBookRooms.nights = bookRoomViewFilter.nights;
                $scope.diaryData.availableSlotsForBookRooms.arrivalTime = bookRoomViewFilter.arrivalTime;
                $scope.diaryData.availableSlotsForBookRooms.departureTime = bookRoomViewFilter.departureTime;
                $scope.diaryData.availableSlotsForBookRooms.canOverbookHouse = hasPermissionToHouseOverBook();
                $scope.diaryData.availableSlotsForBookRooms.canOverbookRoomType = hasPermissionToRoomTypeOverBook();

                if (response.rooms.length === 0) {
                    showWarningMessagePopup('No available rooms found for selected criteria');
                }
                if ($scope.diaryData.availableSlotsForAssignRooms.hasOwnProperty('reservationId')) {
                    // Reset unassigned reservation list selection.
                    resetUnassignedList();
                    // fetch full data (res,room lists) as before it was filtered with room type id
                    fetchRoomListDataAndReservationListData();
                } else {
                    updateDiaryView();
                }
            };

            var options = {
                params: {
                    start_date: bookRoomViewFilter.fromDate,
                    end_date: bookRoomViewFilter.toDate,
                    start_time: bookRoomViewFilter.arrivalTime,
                    end_time: bookRoomViewFilter.departureTime,
                    page: $scope.diaryData.paginationData.page,
                    per_page: $scope.diaryData.paginationData.perPage,
                    selected_room_type_ids: $scope.diaryData.selectedRoomTypes,
                    selected_floor_ids: $scope.diaryData.selectedFloors,
                    selected_room_feature_ids: $scope.diaryData.selectedRoomFeatures
                },
                successCallBack: successCallBackFunction
            };

            $scope.callAPI(RVNightlyDiarySrv.retrieveAvailableFreeSlots, options);
        } else {
            fetchRoomListDataAndReservationListData();
        }
    };

    /* Handle event emitted from child controllers.
     * To toggle available and booked.
     */
    $scope.addListener('TOGGLE_BOOK_AVAILABLE', callbackForBookedOrAvailableListner);
    var reservationId = parseInt($stateParams.reservation_id) || '',
        roomId = parseInt($stateParams.room_id) || '';

    if ($stateParams.action === 'SELECT_RESERVATION' || $stateParams.action === 'TRIGGER_MOVE_ROOM') {
        fetchRoomListDataAndReservationListData(roomId, null, reservationId);
    } else if ($stateParams.action === 'SELECT_UNASSIGNED_RESERVATION') {
        // Logic for select unassigned reservation.
        $timeout(function () {
            $scope.diaryData.rightFilter = 'UNASSIGNED_RESERVATION';
            $scope.$broadcast('SELECT_UNASSIGNED_RESERVATION', reservationId);
        }, 1000);
    }

    // CICO-67534 : Handle Events from unassigned list.
    $scope.addListener('CLICKED_UNASSIGNED_RESERVATION', function (event, currentSelectedReservation) {
        $timeout(function () {
            $scope.diaryData.isEditReservationMode = true;
            $scope.currentSelectedReservation = {};
            $scope.currentSelectedReservation = currentSelectedReservation;
        }, 1000);
    });

    $scope.addListener('CANCEL_UNASSIGNED_RESERVATION_MAIN', function () {
        $scope.$broadcast('CANCEL_UNASSIGNED_RESERVATION');
    });

    /**
     * Listner to set auto assign status
     */
    $scope.addListener('SET_AUTO_ASSIGN_STATUS', function (event, data) {
        setAutoAssignStatus(data);
    });
    // As part of CICO-79488 moved the status refresh call from AutoAssign controller to the diary main.
    var diaryLockStatus = function diaryLockStatus() {
        RVNightlyDiarySrv.fetchAutoAssignStatus().then(setAutoAssignStatus);
    };

    $scope.addListener('REFRESH_AUTO_ASSIGN_STATUS', diaryLockStatus);

    /**
     * Show room status and service update popup
     * @param {Object} roomInfo room info
     * @return {void}
     */
    var showRoomStatusAndServiceUpdatePopup = function showRoomStatusAndServiceUpdatePopup(roomInfo) {
        if ($rootScope.isStandAlone) {
            ngDialog.open({
                template: '/assets/partials/diary/rvDiaryUpdateRoomStatusAndServicePopup.html',
                className: 'ngdialog-theme-default',
                closeByDocument: true,
                controller: 'rvDiaryRoomStatusAndServiceUpdatePopupCtrl',
                data: roomInfo,
                scope: $scope
            });
        }
    };

    /**
     * utility method to pass callbacks from
     * @return {Object} with callbacks
     */
    var getTheCallbacksFromAngularToReact = function getTheCallbacksFromAngularToReact() {
        return {
            goToPrevPage: goToPrevPage,
            goToNextPage: goToNextPage,
            selectReservation: selectReservation,
            extendShortenReservation: extendShortenReservation,
            checkReservationAvailability: checkReservationAvailability,
            clickedAssignRoom: clickedAssignRoom,
            clickedMoveRoom: clickedMoveRoom,
            clickedBookRoom: clickedBookRoom,
            showOrHideSaveChangesButton: showOrHideSaveChangesButton,
            showRoomStatusAndServiceUpdatePopup: showRoomStatusAndServiceUpdatePopup
        };
    };

    var mapCachedDataFromSrv = function mapCachedDataFromSrv() {
        var params = RVNightlyDiarySrv.getCache(),
            reservation = params.currentSelectedReservation;

        if (reservation.type === 'UNASSIGNED_RESERVATION') {
            // Logic for select unassigned reservation.
            $timeout(function () {
                $scope.diaryData.rightFilter = 'UNASSIGNED_RESERVATION';
                $scope.$broadcast('SELECT_UNASSIGNED_RESERVATION', reservation.reservation_id, reservation.arrival_date);
            }, 500);
        } else {
            $scope.currentSelectedReservationId = params.currentSelectedReservationId;
            $scope.diaryData.selectedRoomId = params.currentSelectedRoomId;
        }
        $scope.diaryData.unassignedReservationList = params.unassignedReservationList;
        $scope.currentSelectedReservation = params.currentSelectedReservation;
        $scope.diaryData.hideUnassignRoomButton = true;
        if (reservation && reservation.status) {
            $scope.diaryData.hideUnassignRoomButton = reservation.status === 'CHECKEDIN' || reservation.status === 'CHECKEDOUT' || reservation.status === 'CHECKING_OUT';
        }
        if (!!params.selected_floor_ids && params.selected_floor_ids.length > 0 || !!params.selected_room_type_ids && params.selected_room_type_ids.length > 0) {
            $scope.diaryData.isFromStayCard = true;
            $scope.diaryData.filterList = params.filterList;
            $scope.diaryData.selectedRoomCount = params.selectedRoomCount;
            $scope.diaryData.selectedFloorCount = params.selectedFloorCount;
            $scope.diaryData.hideRoomType = params.hideRoomType;
            $scope.diaryData.hideFloorList = params.hideFloorList;
        }
    };

    if (isFromStayCard) {
        mapCachedDataFromSrv();
    }

    // Initial State
    var initialState = {
        roomsList: roomsList.rooms,
        reservationsList: reservationsList.rooms,
        availableSlotsForAssignRooms: {},
        isAssignRoomViewActive: false,
        isMoveRoomViewActive: false,
        diaryInitialDayOfDateGrid: $scope.diaryData.fromDate,
        numberOfDays: $scope.diaryData.numberOfDays,
        currentBusinessDate: $rootScope.businessDate,
        callBackFromAngular: getTheCallbacksFromAngularToReact(),
        paginationData: $scope.diaryData.paginationData,
        selectedReservationId: $scope.currentSelectedReservationId,
        selectedRoomId: $scope.diaryData.selectedRoomId,
        isFromStayCard: isFromStayCard,
        currentSelectedReservation: $scope.currentSelectedReservation,
        dateFormat: $rootScope.dateFormat,
        isPmsProductionEnvironment: $rootScope.isPmsProductionEnv,
        diaryMode: rvUtilSrv.getDiaryMode()
    };

    var store = configureDiaryStore(initialState);
    var _ReactDOM = ReactDOM,
        render = _ReactDOM.render;
    var _ReactRedux = ReactRedux,
        Provider = _ReactRedux.Provider;

    // angular method to update diary view via react dispatch method.

    var updateDiaryView = function updateDiaryView() {
        var dispatchData = {
            type: 'DIARY_VIEW_CHANGED',
            numberOfDays: $scope.diaryData.numberOfDays,
            reservationsList: $scope.diaryData.reservationsList.rooms,
            isAssignRoomViewActive: $scope.diaryData.isAssignRoomViewActive,
            isMoveRoomViewActive: $scope.diaryData.isMoveRoomViewActive,
            availableSlotsForAssignRooms: $scope.diaryData.availableSlotsForAssignRooms,
            isBookRoomViewActive: $scope.diaryData.isBookRoomViewActive,
            availableSlotsForBookRooms: $scope.diaryData.availableSlotsForBookRooms,
            roomsList: $scope.diaryData.diaryRoomsList,
            diaryInitialDayOfDateGrid: $scope.diaryData.fromDate,
            currentBusinessDate: $rootScope.businessDate,
            callBackFromAngular: getTheCallbacksFromAngularToReact(),
            paginationData: $scope.diaryData.paginationData,
            selectedReservationId: $scope.currentSelectedReservation.id,
            selectedRoomId: $scope.diaryData.selectedRoomId,
            diaryMode: rvUtilSrv.getDiaryMode()
        };

        store.dispatch(dispatchData);
    };

    /*
     * to render the grid view
     */
    var renderDiaryView = function renderDiaryView() {
        return render(React.createElement(
            Provider,
            { store: store },
            React.createElement(NightlyDiaryRootContainer, null)
        ), document.querySelector('#nightlyDiaryMain'));
    };

    /**
     * Show events list popup
     * @param {Number} eventsCount events count
     * @param {Date} selectedDate selected date
     * @return {void}
     */
    $scope.showHouseEventsListPopup = function (eventsCount, selectedDate) {
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

    // Add listener for updating house events count
    $scope.addListener('UPDATE_EVENTS_COUNT', function () {
        fetchHouseEventsCount($scope.diaryData.fromDate, $scope.diaryData.toDate);
    });

    /**
     * Fetch house events count
     * @param {String} startDate - start date
     * @param {String} endDate - end date
     * @return {void}
     */
    var fetchHouseEventsCount = function fetchHouseEventsCount(startDate, endDate) {
        var onHouseEventsCountFetchSuccess = function onHouseEventsCountFetchSuccess(response) {
            $scope.diaryData.eventsCount = response;
            renderDiaryView();
        },
            onHouseEventsCountFetchFailure = function onHouseEventsCountFetchFailure() {
            $scope.diaryData.eventsCount = {};
            renderDiaryView();
        };

        $scope.callAPI(rvHouseEventsListSrv.fetchHouseEventsCount, {
            params: {
                start_date: startDate,
                end_date: endDate
            },
            onSuccess: onHouseEventsCountFetchSuccess,
            onFailure: onHouseEventsCountFetchFailure
        });
    };

    /**
     * initialisation function
     */
    (function () {
        var startDate = $stateParams.start_date || moment(tzIndependentDate($rootScope.businessDate)).subtract(1, 'days').toDate(),
            endDateMoment = moment(tzIndependentDate(startDate)).add(6, 'days'),
            endDate = $filter('date')(endDateMoment.toDate(), $rootScope.dateFormatForAPI);

        startDate = $filter('date')(tzIndependentDate(startDate), $rootScope.dateFormatForAPI);

        fetchHouseEventsCount(startDate, endDate);
    })();
}]);