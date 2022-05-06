'use strict';

sntRover.controller('RvArAddBalanceController', ['$scope', '$rootScope', 'ngDialog', 'rvAccountsArTransactionsSrv', '$stateParams', '$timeout', '$log', function ($scope, $rootScope, ngDialog, rvAccountsArTransactionsSrv, $stateParams, $timeout, $log) {

	BaseCtrl.call(this, $scope);
	// Method to refresh the scrollbar
	var refreshScroller = function refreshScroller() {
		$timeout(function () {
			$scope.refreshScroller('arAddBalanceScroller');
		}, 500);
	};

	$scope.setScroller('arAddBalanceScroller');

	var init = function init() {
		// Data object to add new manual balance.
		$scope.manualBalanceObj = {
			'manualBalanceList': [{
				'name': 'Manual Balance',
				'invoiceNo': '',
				'departureDate': '',
				'amount': ''
			}],
			'selectedIndex': 0
		};
		refreshScroller();
	};

	// Remove a row from balance add screen.
	$scope.removeBalanceRow = function (index) {
		$scope.manualBalanceObj.manualBalanceList.splice(index, 1);
		refreshScroller();
	};
	// Add a new row from balance add screen.
	$scope.addBalanceRow = function () {
		var newBalanceRowObj = {
			'name': 'Manual Balance',
			'invoiceNo': '',
			'departureDate': '',
			'amount': ''
		};

		$scope.manualBalanceObj.manualBalanceList.push(newBalanceRowObj);
		refreshScroller();
	};
	// Handle balance tab cancel action.
	$scope.clickedCancelAddBalance = function () {
		init();
		$scope.arFlags.isAddBalanceScreenVisible = false;
	};
	// Checks whether a balance object is empty.
	var isBalanceObjEmpty = function isBalanceObjEmpty(index) {
		var obj = $scope.manualBalanceObj.manualBalanceList[index],
		    isBalanceObjIsEmpty = false;

		if (obj.name === '' && obj.invoiceNo === '' && obj.departureDate === '' && obj.amount === '') {
			isBalanceObjIsEmpty = true;
		}
		return isBalanceObjIsEmpty;
	};

	// Generate data to send.
	var getDataToSend = function getDataToSend() {
		var manualBalanceList = [];

		_.each($scope.manualBalanceObj.manualBalanceList, function (value, key) {

			if (!isBalanceObjEmpty(key)) {
				var obj = {
					'manual_charge_name': value.name,
					'invoice_number': value.invoiceNo,
					'aging_date': value.departureDate,
					'amount': value.amount
				};

				manualBalanceList.push(obj);
			}
		});

		var dataToSend = {
			'manual_balance_data': manualBalanceList,
			'account_id': $scope.arDataObj.accountId
		};

		return dataToSend;
	};

	// Handle balance tab save action.
	// manual balance save is applicable only on payable tab
	$scope.clickedSaveAddBalance = function () {

		var successCallbackOfSaveArBalanceAPI = function successCallbackOfSaveArBalanceAPI() {
			$scope.$emit('hideLoader');
			$scope.$emit('REFRESH_PAYABLE_LIST');
			$scope.arFlags.isAddBalanceScreenVisible = false;
		},
		    failureCallbackOfSaveArBalanceAPI = function failureCallbackOfSaveArBalanceAPI(errorMessage) {
			$scope.$emit('hideLoader');
			$scope.$emit('SHOW_ERROR_MSG', errorMessage);
		};

		var dataToSend = getDataToSend();

		if (dataToSend.manual_balance_data.length > 0) {
			$scope.invokeApi(rvAccountsArTransactionsSrv.saveArBalance, dataToSend, successCallbackOfSaveArBalanceAPI, failureCallbackOfSaveArBalanceAPI);
		} else {
			$log.info('Data Validation :: No data to save !!');
		}
	};

	// Show calendar popup.
	$scope.popupArDateCalendar = function (index) {

		$scope.manualBalanceObj.selectedIndex = index;

		ngDialog.open({
			template: '/assets/partials/companyCard/contracts/rvCompanyCardContractsCalendar.html',
			controller: 'RVArAddBalanceDatePickerController',
			className: '',
			scope: $scope
		});
	};
	// Clear date selected.
	$scope.clearDateSelection = function (index) {
		$scope.manualBalanceObj.manualBalanceList[index].departureDate = '';
	};
	// Check whether we need to disable the add new row button (+),
	// If the row having all fields empty.
	$scope.balanceObjIsEmpty = function (index) {
		return isBalanceObjEmpty(index);
	};
	// Method to find total balance amount.
	$scope.calculateTotalBalance = function () {
		var totalBalance = 0.00,
		    manualBalanceList = $scope.manualBalanceObj.manualBalanceList;

		if (manualBalanceList.length > 0) {
			_.each(manualBalanceList, function (value) {
				if (value.amount !== '') {
					totalBalance += parseFloat(value.amount);
				}
			});
		}
		return totalBalance;
	};

	/*
  * Loading of this Add Balance Tab by +ADD BALANCE button.
  */
	$scope.$on('ADD_BALANCE_TAB', function () {
		init();
	});

	init();
}]);