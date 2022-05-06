"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var rateManagerExpandedRowsReducer = function rateManagerExpandedRowsReducer(state, action) {
  switch (action.type) {
    case RM_RX_CONST.RATE_VIEW_CHANGED:
      return [];
    case RM_RX_CONST.ROOM_TYPE_VIEW_CHANGED:
      return [];
    case RM_RX_CONST.SINGLE_RATE_EXPANDABLE_VIEW_CHANGED:
      return [];
    case RM_RX_CONST.TOGGLE_EXPAND_COLLAPSE_ROW:
      var indexToDelete = state.indexOf(action.payLoad.index);

      if (indexToDelete === -1) {
        return [].concat(_toConsumableArray(state), [action.payLoad.index]);
      } else {
        return [].concat(_toConsumableArray(state.slice(0, indexToDelete)), _toConsumableArray(state.slice(indexToDelete + 1)));
      }
    default:
      return state;
  }
};