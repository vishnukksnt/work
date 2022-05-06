"use strict";

var rateManagerListReducer = function rateManagerListReducer() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var action = arguments[1];

  switch (action.type) {
    case RM_RX_CONST.RATE_VIEW_CHANGED:
      return action.rateRestrictionData;
    case RM_RX_CONST.ROOM_TYPE_VIEW_CHANGED:
      return action.roomTypeRestrictionData;
    case RM_RX_CONST.RATE_TYPE_VIEW_CHANGED:
      return action.rateTypeRestrictionData;
    case RM_RX_CONST.SINGLE_RATE_EXPANDABLE_VIEW_CHANGED:
      return action.singleRateRestrictionData;
    default:
      return state;
  }
};