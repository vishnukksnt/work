'use strict';

var nightlyDiaryRoomsListReducer = function nightlyDiaryRoomsListReducer() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var action = arguments[1];

  switch (action.type) {
    case 'DIARY_VIEW_CHANGED':
      return action.roomsList;
    default:
      return state.roomsList;
  }
};