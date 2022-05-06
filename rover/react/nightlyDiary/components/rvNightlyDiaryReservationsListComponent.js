'use strict';

var isRoomAvailable = function isRoomAvailable(roomId, state, type) {

    var unAssignedRoomList = [];
    var roomTypeList = [];
    var flagforAvailable = false;
    var roomDetails = {};
    var roomTypeDetails = {};
    var bookType = 'BOOK';
    var diaryMode = state.diaryMode;
    var houseDetails = {};

    var checkOverBooking = function checkOverBooking() {
        var isHouseOverbookable = houseDetails.house_availability <= 0 && houseDetails.unassigned_reservations_present,
            isRoomTypeOverbookable = roomTypeDetails.availability <= 0 && roomTypeDetails.unassigned_reservations_present,
            canOverbookHouse = state.availableSlotsForBookRooms.canOverbookHouse,
            canOverbookRoomType = state.availableSlotsForBookRooms.canOverbookRoomType,
            canOverBookBoth = canOverbookHouse && canOverbookRoomType,
            overBookingStatusOutput = '';

        if (isHouseOverbookable && isRoomTypeOverbookable && canOverBookBoth) {
            overBookingStatusOutput = 'HOUSE_AND_ROOMTYPE_OVERBOOK';
        } else if (isRoomTypeOverbookable && canOverbookRoomType && (!isHouseOverbookable || isHouseOverbookable && canOverbookHouse)) {
            overBookingStatusOutput = 'ROOMTYPE_OVERBOOK';
        } else if (isHouseOverbookable && canOverbookHouse && (!isRoomTypeOverbookable || isRoomTypeOverbookable && canOverbookRoomType)) {
            overBookingStatusOutput = 'HOUSE_OVERBOOK';
        } else {
            overBookingStatusOutput = 'NO_PERMISSION_TO_OVERBOOK';
        }
        return overBookingStatusOutput;
    };

    if (type === 'BOOK') {
        unAssignedRoomList = state.availableSlotsForBookRooms.rooms;
        roomTypeList = state.availableSlotsForBookRooms.room_types;
        houseDetails = state.availableSlotsForBookRooms.house;
    } else if (type === 'ASSIGN' || type === 'MOVE') {
        unAssignedRoomList = state.availableSlotsForAssignRooms.availableRoomList;
    }

    unAssignedRoomList.forEach(function (item) {
        if (item.room_id === roomId) {
            flagforAvailable = true;
            roomDetails = item;
        }
    });

    if (flagforAvailable && type === 'ASSIGN') {
        return React.createElement(NightlyDiaryAssignRoomContainer, { roomDetails: roomDetails });
    }
    if (flagforAvailable && type === 'MOVE') {
        return React.createElement(NightlyDiaryMoveRoomContainer, { roomDetails: roomDetails });
    }
    if (flagforAvailable && type === 'BOOK') {

        roomTypeList.forEach(function (item) {
            if (item.room_type_id === roomDetails.room_type_id) {
                roomTypeDetails = item;
            }
        });

        roomDetails.fromDate = state.availableSlotsForBookRooms.fromDate;
        roomDetails.toDate = state.availableSlotsForBookRooms.toDate;
        roomDetails.nights = state.availableSlotsForBookRooms.nights;
        roomDetails.arrivalTime = state.availableSlotsForBookRooms.arrivalTime;
        roomDetails.departureTime = state.availableSlotsForBookRooms.departureTime;

        if (diaryMode === 'FULL') {
            bookType = 'BOOK';
        } else if (diaryMode === 'NIGHTLY' || diaryMode === 'DAYUSE') {

            if (roomTypeDetails.availability > 0 && houseDetails.house_availability > 0) {
                bookType = 'BOOK';
            } else if (checkOverBooking() === 'NO_PERMISSION_TO_OVERBOOK') {
                bookType = 'OVERBOOK_DISABLED';
            } else {
                bookType = 'OVERBOOK';
            }
        }

        return React.createElement(NightlyDiaryBookRoomContainer, { roomDetails: roomDetails, roomTypeDetails: roomTypeDetails, type: bookType });
    }

    return false;
};

var NightlyDiaryReservationsListComponent = function NightlyDiaryReservationsListComponent(_ref) {
    var reservationsListToComponent = _ref.reservationsListToComponent,
        roomRowClass = _ref.roomRowClass,
        showAssignRooms = _ref.showAssignRooms,
        showMoveRooms = _ref.showMoveRooms,
        showBookRooms = _ref.showBookRooms,
        state = _ref.state;


    return React.createElement(
        'div',
        { className: roomRowClass },
        reservationsListToComponent.map(function (item) {
            return React.createElement(
                'div',
                { className: item.roomClass },
                item.reservations.length > 0 ? item.reservations.map(function (reservationItem) {
                    return React.createElement(NightlyDiaryReservationContainer, { reservation: reservationItem, room: item, overlapCount: reservationItem.overlapCount, isHourlyPresent: item.hourly_reservations.length });
                }) : '',
                item.ooo_oos_details.length > 0 ? item.ooo_oos_details.map(function (oooOosItem) {
                    return React.createElement(NightlyDiaryOutOfOrderOutOfServiceContainer, { ooo_oos: oooOosItem, room: item });
                }) : '',
                showAssignRooms ? isRoomAvailable(item.id, state, 'ASSIGN') : '',
                showMoveRooms ? isRoomAvailable(item.id, state, 'MOVE') : '',
                showBookRooms ? isRoomAvailable(item.id, state, 'BOOK') : '',
                item.hourly_reservations.length > 0 ? item.hourly_reservations.map(function (hourlyItem) {
                    return React.createElement(NightlyDiaryHourlyContainer, { hourlyItem: hourlyItem, isNightlyPresent: item.reservations.length });
                }) : ''
            );
        })
    );
};

var _React = React,
    PropTypes = _React.PropTypes;


NightlyDiaryReservationsListComponent.propTypes = {
    reservationsListToComponent: PropTypes.array.isRequired
};