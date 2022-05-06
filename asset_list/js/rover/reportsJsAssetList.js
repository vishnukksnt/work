'use strict';

module.exports = {
	getList: function getList() {
		var jsLibRoot = 'shared/lib/js/',
		    roverRoot = 'rover/',
		    reportReactViewRoot = roverRoot + 'react/reports/',
		    diaryViewRoot = roverRoot + 'react/diary/',
		    reportJsAssets = {
			minifiedFiles: [],
			nonMinifiedFiles: [diaryViewRoot + "util.js", roverRoot + "services/reports/**/*.js", roverRoot + "factories/reports/**/*.js", roverRoot + "constants/reports/**/*.js", roverRoot + "controllers/reports/**/*.js", reportReactViewRoot + "**/*.js", 'shared/directives/numbersOnly/numbersOnly.js', roverRoot + 'services/reservation/rvReservationBaseSearchSrv.js', 'shared/sntUtils/sntFeatureToggles.js', roverRoot + 'directives/customExports/durationFilter/durationFilterDir.js', roverRoot + 'directives/customExports/rangeFilter/rangeFilterDir.js', roverRoot + 'directives/customExports/optionFilter/optionFilterDir.js', roverRoot + 'directives/customExports/generalFilter/generalFilterDir.js',
			// Eliminate all spec files
			'!**/*.spec.js']
		};
		return reportJsAssets;
	}
};