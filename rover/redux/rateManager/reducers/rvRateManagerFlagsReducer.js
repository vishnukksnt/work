"use strict";

var rateManagerFlagsReducer = function rateManagerFlagsReducer(state, action) {
  switch (action.type) {
    case RM_RX_CONST.RATE_VIEW_WITH_ADDRESS:
      return action.flags;
    default:
      return state;
  }
};