"use strict";

module.exports = {
	getList: function getList() {
		var roverRoot = 'rover/',
		    guestcardsearchJsAssets = {
			minifiedFiles: [],
			nonMinifiedFiles: [roverRoot + "controllers/rvStatisticsBaseCtrl.js", roverRoot + "controllers/guests/*.js", roverRoot + "services/guestcard/rvGuestCardSrv.js", roverRoot + "services/guestcard/rvGuestCardActivityLogSrv.js", roverRoot + "controllers/rvMergeCardsCtrl.js", roverRoot + 'services/rvMergeCardsSrv.js',
			// Eliminate all spec files
			'!**/*.spec.js']
		};
		return guestcardsearchJsAssets;
	}
};