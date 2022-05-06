'use strict';

module.exports = {
	getList: function getList() {
		var jsLibRoot = 'shared/lib/js/',
		    roverRoot = 'rover/',
		    diaryViewRoot = roverRoot + 'react/diary/',
		    diaryJsAssets = {
			minifiedFiles: [],
			nonMinifiedFiles: [roverRoot + "services/diary/**/*.js", roverRoot + "services/reservation/rvReservationBaseSearchSrv.js", roverRoot + "services/reservation/rvReservationSummarySrv.js", roverRoot + "services/rateManager/rmFilterOptionsSrv.js", roverRoot + "services/payment/rvGuestPaymentSrv.js", roverRoot + "services/housekeeping/rvHkRoomStatusSrv.js", roverRoot + "services/housekeeping/rvHkRoomDetailsSrv.js", roverRoot + "services/util/rvUtilSrv.js", roverRoot + "controllers/diary/**/*.js", roverRoot + "controllers/rvDiaryRoomStatusAndServiceUpdatePopupCtrl.js",
			//please dont change the order
			diaryViewRoot + "util.js", diaryViewRoot + "diary-toggle.js", diaryViewRoot + "diary-grid-row-inactive-rooms.js", diaryViewRoot + "diary-toggle-panel.js", diaryViewRoot + "diary-grid-row-item-drag.js", diaryViewRoot + "diary-grid-row-item.js", diaryViewRoot + "diary-grid-row.js", diaryViewRoot + "diary-room.js", diaryViewRoot + "diary-rooms.js", diaryViewRoot + "diary-room-panel.js", diaryViewRoot + "diary-grid.js", diaryViewRoot + "diary-timeline-resize-grip.js", diaryViewRoot + "diary-timeline-resize.js", diaryViewRoot + "diary-timeline-occupancy.js", diaryViewRoot + "diary-timeline.js", diaryViewRoot + "diary-timeline-panel.js", diaryViewRoot + "diary-grid-panel.js", diaryViewRoot + "diary-content.js",

			// Eliminate all spec files
			'!**/*.spec.js']
		};

		return diaryJsAssets;
	}
};