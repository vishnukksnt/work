'use strict';

var nightlyDiaryReservationsListReducer = function nightlyDiaryReservationsListReducer() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var action = arguments[1];

  switch (action.type) {
    case 'DIARY_VIEW_CHANGED':
    case 'RESERVATION_SELECTED':
      return action.reservationsList; // Getting reservations in each room
    default:
      return state.reservationsList;
  }
};