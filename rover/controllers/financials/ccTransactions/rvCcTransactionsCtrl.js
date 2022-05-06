'use strict';

sntRover.controller('RVccTransactionsController', ['$scope', '$filter', '$stateParams', 'ngDialog', '$rootScope', 'RVccTransactionsSrv', '$timeout', '$window', 'rvPermissionSrv', function ($scope, $filter, $stateParams, ngDialog, $rootScope, RVccTransactionsSrv, $timeout, $window, rvPermissionSrv) {

	BaseCtrl.call(this, $scope);
	// Setting up the screen heading and browser title.
	$scope.$emit('HeaderChanged', $filter('translate')('MENU_CC_TRANSACTIONS'));
	$scope.setTitle($filter('translate')('MENU_CC_TRANSACTIONS'));
	$scope.$emit("updateRoverLeftMenu", "ccTransactions");

	var init = function init() {
		$scope.data = {};
		$scope.data.activeTab = 0;
		$scope.data.transactionDate = $rootScope.businessDate;
		$scope.data.paymentData = {};
		$scope.data.authData = {};
	};

	// Handling TransactionDate date picker click
	$scope.clickedTransactionDate = function () {
		$scope.popupCalendar('TRANSACTIONS');
	};

	// Handling TransactionDate date picker click
	$scope.clickedSubmitBatch = function () {
		var successCallBackSubmitBatch = function successCallBackSubmitBatch(data) {
			$scope.$broadcast('showErrorMessage', "");
			$scope.$emit('hideLoader');
		};
		var failureCallBackSubmitBatch = function failureCallBackSubmitBatch(data) {
			$scope.$broadcast('showErrorMessage', data);
			$scope.$emit('hideLoader');
		};

		$scope.invokeApi(RVccTransactionsSrv.submitBatch, {}, successCallBackSubmitBatch, failureCallBackSubmitBatch);
	};

	// Show calendar popup.
	$scope.popupCalendar = function (clickedOn) {
		$scope.clickedOn = clickedOn;
		ngDialog.open({
			template: '/assets/partials/financials/journal/rvJournalCalendarPopup.html',
			controller: 'RVJournalDatePickerController',
			className: 'single-date-picker',
			scope: $scope
		});
	};

	// Handle Tab switch
	$scope.activatedTab = function (index) {
		$scope.data.activeTab = index;
		$scope.$broadcast('mainTabSwiched');
		$scope.$broadcast('CLOSEPRINTBOX');
	};

	$scope.clickedOnTransactionContents = function () {
		$scope.$broadcast('CLOSEPRINTBOX');
	};

	$scope.hasAnyElements = function (object) {
		var hasAnyElements = true;

		if (isEmptyObject(object)) {
			hasAnyElements = false;
		}
		return hasAnyElements;
	};

	$scope.hasPermissionToSubmitCCBatch = function () {
		return rvPermissionSrv.getPermissionValue('SUBMIT_CC_BATCH');
	};

	if ($stateParams.isRefresh) {
		init();
	} else {
		// Restrore the data when coming back from stay card.
		$scope.data = RVccTransactionsSrv.getCache();
	}
}]);