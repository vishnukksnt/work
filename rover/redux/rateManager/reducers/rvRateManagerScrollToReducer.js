"use strict";

var rateManagerScrollToReducer = function rateManagerScrollToReducer(state, action) {
	switch (action.type) {
		case RM_RX_CONST.RATE_VIEW_CHANGED:
		case RM_RX_CONST.ROOM_TYPE_VIEW_CHANGED:
		case RM_RX_CONST.RATE_TYPE_VIEW_CHANGED:
		case RM_RX_CONST.SINGLE_RATE_EXPANDABLE_VIEW_CHANGED:
			return action.scrollTo;

		case RM_RX_CONST.CLEAR_SCROLL_TO:
			return null;

		default:
			return state;
	}
};