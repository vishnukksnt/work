"use strict";

var rateManagerCallbacksFromAngularReducer = function rateManagerCallbacksFromAngularReducer(state, action) {
  switch (action.type) {
    case RM_RX_CONST.RATE_VIEW_CHANGED:
    case RM_RX_CONST.ROOM_TYPE_VIEW_CHANGED:
    case RM_RX_CONST.RATE_TYPE_VIEW_CHANGED:
    case RM_RX_CONST.SINGLE_RATE_EXPANDABLE_VIEW_CHANGED:
      return action.callbacksFromAngular;
    default:
      return state;
  }
};