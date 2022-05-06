'use strict';

module.exports = {
	getStateMappingList: function getStateMappingList() {
		var roverJsListRoot = '../../asset_list/js/rover/';

		return {
			'rover.diary': {
				filename: roverJsListRoot + 'diaryJsAssetList.js',
				babelify: false
			},
			'rover.dashboard': {
				filename: roverJsListRoot + 'dashboardJsAssetList.js',
				babelify: false
			},
			'rover.reservation': {
				filename: roverJsListRoot + 'stayCardJsAssetList.js',
				modules: true,
				babelify: true
			},
			'rover.availability': {
				filename: roverJsListRoot + 'availabilityJsAssetList.js',
				babelify: false
			},
			'rover.reports': {
				filename: roverJsListRoot + 'reportsJsAssetList.js',
				babelify: true
			},
			'rover.rateManager': {
				filename: roverJsListRoot + 'newRateManagerJsAssetList.js',
				babelify: true
			},
			'rover.nightlyDiary': {
				filename: roverJsListRoot + 'nightlyDiaryJsAssetList.js',
				babelify: true
			},

			'rover.housekeeping': {
				filename: roverJsListRoot + 'houseKeepingJsAssetList.js',
				babelify: false
			},
			'rover.groups': {
				filename: roverJsListRoot + 'groupJsAssetList.js',
				babelify: false
			},
			'rover.allotments': {
				filename: roverJsListRoot + 'allotmentJsAssetList.js',
				babelify: false
			},
			'rover.financials': {
				filename: roverJsListRoot + 'financialsJsAssetList.js',
				babelify: true
			},
			'postcharge': {
				filename: roverJsListRoot + 'postChargeJsAssetList.js',
				babelify: false
			},
			'endofday': {
				filename: roverJsListRoot + 'endOfDayJsAssetList.js',
				babelify: false
			},
			'sociallobby': {
				filename: roverJsListRoot + 'socialLobbyJsAssetList.js',
				babelify: false
			},
			'directives': {
				filename: roverJsListRoot + 'directivesJsAssetList.js',
				babelify: true
			},
			'react.files': {
				filename: roverJsListRoot + 'reactJsAssetList.js',
				babelify: false
			},
			'redux.files': {
				filename: roverJsListRoot + 'reduxJsAssetList.js',
				babelify: false
			},
			'highcharts': {
				filename: roverJsListRoot + 'highchartsJsAssetList.js',
				babelify: false
			},
			'addBillingInfo': {
				filename: roverJsListRoot + 'addBillingInfoPopupJsAssetList.js',
				babelify: false
			},
			'rover.allowances': {
				filename: roverJsListRoot + 'allowancesJsAssetList.js',
				babelify: false
			},
			'changestaydates': {
				filename: roverJsListRoot + 'changeDatesJsAssetList.js',
				babelify: false
			},
			'rover.accounts': {
				filename: roverJsListRoot + 'accountsJsAssetList.js',
				babelify: false
			},
			'rover.workManagement': {
				filename: roverJsListRoot + 'workManagementJsAssetList.js',
				babelify: false
			},
			'staffpasswordchange': {
				filename: roverJsListRoot + 'staffPasswordChangeJsAssetList.js',
				babelify: false
			},
			'rover.actionsManager': {
				filename: roverJsListRoot + 'actionJsAssetList.js',
				babelify: true
			},
			'rover.quicktext': {
				filename: roverJsListRoot + 'quicktextJsAssetList.js',
				babelify: true
			},
			'rover.companycardsearch': {
				filename: roverJsListRoot + 'companyCardSearchJsAssetList.js',
				babelify: true
			},
			'rover.companycarddetails': {
				filename: roverJsListRoot + 'companyCardDetailsJsAssetList.js',
				babelify: true
			},
			'rover.reservation.staycard.activitylog': {
				filename: roverJsListRoot + 'activityLogJsAssetList.js',
				babelify: false
			},
			'rover.reservation.staycard.billcard': {
				filename: roverJsListRoot + 'billScreenJsAssetList.js',
				babelify: false
			},
			'rover.reservation.staycard.roomassignment': {
				filename: roverJsListRoot + 'roomAssignmentJsAssetList.js',
				babelify: false
			},
			'rover.overbooking': {
				filename: roverJsListRoot + 'overBookingJsAssetList.js',
				babelify: true
			},
			'rover.guestcardsearch': {
				filename: roverJsListRoot + 'guestCardSearchJsAssetList.js',
				babelify: false
			},
			'rover.guestcarddetails': {
				filename: roverJsListRoot + 'guestCardDetailsJsAssetList.js',
				modules: true,
				babelify: true
			},
			'rover.reportAnalytics': {
				filename: roverJsListRoot + 'reportsAnalyticsAssetsList.js',
				babelify: false
			},
			'rover.houseEvents': {
				filename: roverJsListRoot + 'houseEventsJsAssetList.js',
				babelify: false
			}
		};
	}
};