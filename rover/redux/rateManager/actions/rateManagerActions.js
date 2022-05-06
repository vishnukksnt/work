"use strict";

var rateManagerActions = {
	rateViewChanged: function rateViewChanged(ratesAndRestrictions) {
		return {
			mode: RM_RX_CONST.RATE_VIEW_CHANGED
		};
	}
};