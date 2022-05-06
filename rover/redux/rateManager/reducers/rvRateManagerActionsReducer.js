'use strict';

var rateManagerActionReducer = function rateManagerActionReducer(state, action) {
  switch (action.type) {
    case RM_RX_CONST.RATE_VIEW_CHANGED:
    case RM_RX_CONST.ROOM_TYPE_VIEW_CHANGED:
    case RM_RX_CONST.RATE_TYPE_VIEW_CHANGED:
    case RM_RX_CONST.SINGLE_RATE_EXPANDABLE_VIEW_CHANGED:
    case RM_RX_CONST.SINGLE_RATE_EXPANDABLE_VIEW_CHANGED:
    case RM_RX_CONST.SHOW_NO_RESULTS:
      return '';
    case RM_RX_CONST.REFRESH_SCROLLERS:
      return RM_RX_CONST.REFRESH_SCROLLERS;
    case RM_RX_CONST.TOGGLE_EXPAND_COLLAPSE_ROW:
      return '';
    default:
      return state;
  }
};