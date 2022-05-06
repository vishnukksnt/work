'use strict';

module.exports = {
	getList: function getList() {
		var controllerRoot = 'rover/controllers/',
		    servicesRoot = 'rover/services/',
		    assetsForScreen = {
			minifiedFiles: [],
			nonMinifiedFiles: [controllerRoot + 'groups/activity/**/*.js', controllerRoot + 'accounts/**/*.js', controllerRoot + 'depositBalance/rvDepositBalanceAccountsCtrl.js', controllerRoot + 'roverPayment/rvCardOptionsCtrl.js', controllerRoot + "billFormat/rvBillFormatPopupController.js", controllerRoot + "paymentReceipt/**/*.js", controllerRoot + "payment/**/**.js", controllerRoot + "bill/rvVoidBillPopupCtrl.js", servicesRoot + "rvCompanyCardSrv.js", servicesRoot + 'accounts/**/*.js', servicesRoot + 'group/**/*.js', servicesRoot + "reservation/rvReservationSummarySrv.js", servicesRoot + "payment/rvPaymentSrv.js", servicesRoot + "rvReservationSrv.js", servicesRoot + "depositBalance/rvDepositBalanceSrv.js", servicesRoot + "bill/rvBillCardSrv.js", servicesRoot + "rvContactInfoSrv.js", servicesRoot + "payment/**/**.js",
			// Eliminate all spec files
			'!**/*.spec.js']
		};
		return assetsForScreen;
	}
};