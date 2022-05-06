'use strict';

var nightlyDiaryRootReducer = function nightlyDiaryRootReducer(state, action) {
    return {
        roomsList: nightlyDiaryRoomsListReducer(state, action),
        reservationsList: nightlyDiaryReservationsListReducer(state, action),
        diaryInitialDayOfDateGrid: action.type === 'DIARY_VIEW_CHANGED' ? action.diaryInitialDayOfDateGrid : state.diaryInitialDayOfDateGrid,
        numberOfDays: action.type === 'DIARY_VIEW_CHANGED' ? action.numberOfDays : state.numberOfDays,
        currentBusinessDate: action.type === 'DIARY_VIEW_CHANGED' ? action.currentBusinessDate : state.currentBusinessDate,
        isAssignRoomViewActive: action.isAssignRoomViewActive,
        isMoveRoomViewActive: action.isMoveRoomViewActive,
        availableSlotsForAssignRooms: action.availableSlotsForAssignRooms,
        isBookRoomViewActive: action.isBookRoomViewActive,
        availableSlotsForBookRooms: action.availableSlotsForBookRooms,
        callBackFromAngular: callBackReducer(state, action),
        paginationData: paginationDataReducer(state, action),
        selectedReservationId: action.type === 'RESERVATION_SELECTED' || action.type === 'CANCEL_RESERVATION_EDITING' ? action.selectedReservationId : state.selectedReservationId,
        currentSelectedReservation: action.type === 'RESERVATION_SELECTED' || action.type === 'CANCEL_RESERVATION_EDITING' ? action.currentSelectedReservation : state.currentSelectedReservation,
        selectedRoomId: action.type === 'DIARY_VIEW_CHANGED' || action.type === 'RESERVATION_SELECTED' ? action.selectedRoomId : state.selectedRoomId,
        isFromStayCard: state.isFromStayCard,
        dateFormat: state.dateFormat,
        newArrivalPosition: action.type === 'EXTEND_SHORTEN_RESERVATION' ? action.newArrivalPosition : '',
        newDeparturePosition: action.type === 'EXTEND_SHORTEN_RESERVATION' ? action.newDeparturePosition : '',
        isPmsProductionEnvironment: state.isPmsProductionEnvironment,
        diaryMode: state.diaryMode
    };
};