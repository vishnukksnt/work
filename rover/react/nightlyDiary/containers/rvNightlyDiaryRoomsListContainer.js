"use strict";

var _ReactRedux = ReactRedux,
    connect = _ReactRedux.connect;


var convertRoomsListReadyToComponent = function convertRoomsListReadyToComponent(roomsList, selectedRoomId, state) {
    roomsList.map(function (room, index) {

        room.room_class = room.service_status === 'IN_SERVICE' ? "room-number " + room.hk_status : "room-number out";
        room.main_room_class = room.id === selectedRoomId ? 'room not-clickable highlighted' : 'room not-clickable';
        switch (room.hk_status) {
            case 'CLEAN':
                room.main_room_class += ' clean';
                break;
            case 'DIRTY':
                room.main_room_class += ' dirty';
                break;
            case 'INSPECTED':
                room.main_room_class += ' inspected';
                break;
            case 'PICKUP':
                room.main_room_class += ' pickup';
                break;
            case 'DO_NOT_DISTURB':
                room.main_room_class += ' dnd';
                break;
            default:
        }
        // For Inspected Only Hotel, Adding class for clean not-inspected case
        room.main_room_class += room.hk_status === 'CLEAN' && !room.is_inspected ? ' not-inspected' : '';
        // Add class when room is OOO/OOS
        if (room.service_status === 'OUT_OF_ORDER' || room.service_status === 'OUT_OF_SERVICE') {
            room.main_room_class = 'room unavailable';
        }
        room.isSuitesAvailable = room.suite_room_details.length > 0;

        // CICO-70115 (N Diary - Stack N bookings in room diary when overlapping) Logic Goes here..
        var dateList = [];
        var reservationList = state.reservationsList[index];

        if (reservationList.reservations.length !== 0) {
            /*
             *  Retrieve Date List in a row ( against each room)
             *  where reservations present in it.
             */
            _.each(reservationList.reservations, function (item) {
                dateList.push(item.arrival_date);
            });
            dateList = _.unique(dateList);

            /*
             *  Mapping dateList Vs reservations
             *  Find overlap count ( how many reservations exist in a day the selected room )
             */
            _.each(dateList, function (date) {
                var count = 0;

                _.each(reservationList.reservations, function (reservation) {
                    if (date === reservation.arrival_date) {
                        reservation.overlapCount = count;
                        count++;
                    }
                });
            });

            /*
             *  Find Max overlap count
             *  Max no of overlaps in a row.
             */
            room.maxOverlap = _.max(reservationList.reservations, function (item) {
                return item.overlapCount;
            }).overlapCount;

            if (reservationList.hourly_reservations.length > 0) {
                room.maxOverlap++;
            }
        }

        if (room.maxOverlap >= 0) {
            room.main_room_class += ' overlap-' + room.maxOverlap;
        }
        // CICO-70115 (N Diary - Stack N bookings in room diary when overlapping) Logic Ends here..
    });

    return roomsList;
};

var mapStateToNightlyDiaryRoomsListContainerProps = function mapStateToNightlyDiaryRoomsListContainerProps(state) {
    return {
        roomListToComponent: convertRoomsListReadyToComponent(state.roomsList, state.selectedRoomId, state),
        selectedRoomId: state.selectedRoomId,
        showUpdateRoomStatusAndServicePopup: state.callBackFromAngular.showRoomStatusAndServiceUpdatePopup
    };
};

var NightlyDiaryRoomsListContainer = connect(mapStateToNightlyDiaryRoomsListContainerProps)(NightlyDiaryRoomsListComponent);