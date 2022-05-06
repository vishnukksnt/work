"use strict";

module.exports = {
	getList: function getList() {
		var roverRoot = 'rover/',
		    companycardDetailsJsAssets = {
			minifiedFiles: [],
			nonMinifiedFiles: [roverRoot + "controllers/companycard/details/**/*.js", roverRoot + "controllers/companycard/activityLog/*.js", roverRoot + "controllers/companycard/contracts/*.js", roverRoot + "controllers/payment/*.js", roverRoot + "controllers/arTransactions/*.js", roverRoot + "controllers/arTransactions/**/*.js", roverRoot + "controllers/cardsOutside/rvCompanyCardArTransactionsCtrl.js", roverRoot + "controllers/roverPayment/*.js", roverRoot + "services/rvCompanyCardSrv.js", roverRoot + "services/companycard/*.js", roverRoot + "services/payment/rvPaymentSrv.js", roverRoot + "services/rvReservationSrv.js", roverRoot + "services/accounts/rvAccountsArTransactionsSrv.js", roverRoot + "services/postCharge/rvPostChargeSrvV2.js", roverRoot + "services/bill/rvBillCardSrv.js", 'rover/services/payment/rvPaymentSrv.js', 'rover/services/rvContactInfoSrv.js', 'rover/services/accounts/rvAccountsTransactionSrv.js', 'rover/controllers/cardsOutside/rvArTransactionsPayCreditsController.js', 'rover/controllers/cardsOutside/rvArTransactionsDatePickerController.js', 'rover/controllers/rvCommissionsDatePickerController.js', roverRoot + 'services/guestcard/rvGuestCardSrv.js', roverRoot + 'controllers/rvStatisticsBaseCtrl.js', roverRoot + 'controllers/billFormat/rvArBillFormatPopupController.js', roverRoot + 'controllers/companycard/rvCompanyCardTravelAgentStatisticsCtrl.js',

			// Eliminate all spec files
			'!**/*.spec.js']
		};
		return companycardDetailsJsAssets;
	}
};