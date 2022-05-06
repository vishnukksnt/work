"use strict";

var rateManagerLoaderReducer = function rateManagerLoaderReducer(state, action) {
	switch (action.type) {
		case RM_RX_CONST.RATE_VIEW_CHANGED:
		case RM_RX_CONST.ROOM_TYPE_VIEW_CHANGED:
		case RM_RX_CONST.RATE_TYPE_VIEW_CHANGED:
		case RM_RX_CONST.SINGLE_RATE_EXPANDABLE_VIEW_CHANGED:
		case RM_RX_CONST.TOGGLE_EXPAND_COLLAPSE_ROW:
			return RM_RX_CONST.ACTIVATE_LOADER;
		case RM_RX_CONST.ACT_SHOW_ACTIVITY_INDICATOR:
			return RM_RX_CONST.ACTIVATE_LOADER;
		case RM_RX_CONST.ACT_HIDE_ACTIVITY_INDICATOR:
			return RM_RX_CONST.HIDE_LOADER;
		default:
			return state;
	}
};