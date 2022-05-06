"use strict";

var rateManagerShowAvailabilityReducer = function rateManagerShowAvailabilityReducer(state, action) {
    switch (action.type) {
        case RM_RX_CONST.SHOW_AVAILABILITY:
            return action.showAvailability;
        default:
            return state.showAvailability;
    }
};