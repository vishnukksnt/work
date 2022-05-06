'use strict';

sntRover.controller('RVCompanyCardArTransactionsMainCtrl', ['$scope', '$rootScope', '$stateParams', 'ngDialog', '$timeout', 'rvAccountsArTransactionsSrv', 'RVReservationCardSrv', '$window', '$filter', 'RVContactInfoSrv', 'rvPermissionSrv', 'sntActivity', function ($scope, $rootScope, $stateParams, ngDialog, $timeout, rvAccountsArTransactionsSrv, RVReservationCardSrv, $window, $filter, RVContactInfoSrv, rvPermissionSrv, sntActivity) {
	BaseCtrl.call(this, $scope);
	$scope.errorMessage = '';

	var DEBOUNCE_DELAY = 800,
	    // Delay the function execution by this much ms
	that = this; // Reference to this pointer.

	$scope.showSortFilter = true;
	$scope.showToggleFilter = true;

	$scope.arFlags = {
		'currentSelectedArTab': 'balance',
		'isAddBalanceScreenVisible': false,
		'isArTabActive': false,
		'isPaymentSelected': false,
		'viewFromOutside': typeof $stateParams.type !== 'undefined' ? true : false,
		'shouldShowPayAllButton': false,
		'shouldShowFooter': false,
		'insufficientAmount': false,
		'isFromAddPaymentOrAllocateButton': false,
		'shouldShowRefundButton': false,
		'hasAllocateUnallocatePermission': rvPermissionSrv.getPermissionValue('ALLOCATE_UNALLOCATE_PAYMENT'),
		'isPayableTab': true,
		'shouldShowOnHoldFooter': false,
		'showSelectAllOpenBills': true
	};

	$scope.filterData = {
		'query': '',
		'fromDate': '',
		'toDate': '',
		'includePayments': false,
		'isSummary': false,
		'statementEmailAddress': '',
		'sortField': 'aging_date',
		'sortOptions': [{
			'value': 'aging_date',
			'name': 'AGING DATE'
		}, {
			'value': 'invoice_num',
			'name': 'INVOICE #'
		}, {
			'value': 'ar_invoice',
			'name': 'AR INVOICE #'
		}, {
			'value': 'name',
			'name': 'NAME'
		}]
	};

	/*
  * Data Object set to handle various AR transaction lists.
  */
	$scope.arDataObj = {
		'balanceList': [],
		'paidList': [],
		'unallocatedList': [],
		'allocatedList': [],
		'onHoldList': [],

		'unpaidAmount': '',
		'paidAmount': '',
		'allocatedCredit': '',
		'unallocatedCredit': '',
		'company_or_ta_bill_id': '',

		'perPage': 15,
		'balancePageNo': 1,
		'paidPageNo': 1,
		'allocatePageNo': 1,
		'unallocatePageNo': 1,
		'onHoldPageNo': 1,

		'balanceTotalCount': 0,
		'paidTotalCount': 0,
		'allocatedTotalCount': 0,
		'unallocatedTotalCount': 0,
		'totalOfAllInvoicesInBalanceTab': 0,
		'OnHoldTotalCount': 0,
		'selectedOnHoldInvoices': [],
		// Params - Balance tab
		'selectedInvoices': [],
		'totalAllocatedAmount': 0,
		'availableAmount': 0,
		'accountId': typeof $scope.contactInformation === 'undefined' ? $stateParams.id : $scope.contactInformation.id
	};
	// List of listner values as object hash.
	var listeners = {};

	/*
  * To create the parameters which is to be passed to API
  */

	that.createParametersFetchTheData = function () {
		$scope.arDataObj.accountId = typeof $scope.contactInformation === 'undefined' ? $stateParams.id : $scope.contactInformation.id;
		var dataToSend = {
			account_id: $scope.arDataObj.accountId,
			getParams: {
				per_page: $scope.arDataObj.perPage,
				from_date: $scope.filterData.fromDate,
				to_date: $scope.filterData.toDate,
				query: $scope.filterData.query
			}
		};

		switch ($scope.arFlags.currentSelectedArTab) {
			case 'balance':
				dataToSend.getParams.transaction_type = 'CHARGES';
				dataToSend.getParams.paid = false;
				dataToSend.getParams.page = $scope.arDataObj.balancePageNo;
				dataToSend.getParams.sort_field = $scope.filterData.sortField;
				dataToSend.getParams.on_hold = false;
				break;
			case 'paid-bills':
				dataToSend.getParams.transaction_type = 'CHARGES';
				dataToSend.getParams.paid = true;
				dataToSend.getParams.page = $scope.arDataObj.paidPageNo;
				dataToSend.getParams.sort_field = $scope.filterData.sortField;
				break;
			case 'unallocated':
				dataToSend.getParams.transaction_type = 'PAYMENTS';
				dataToSend.getParams.allocated = false;
				dataToSend.getParams.page = $scope.arDataObj.unallocatePageNo;
				break;
			case 'allocated':
				dataToSend.getParams.transaction_type = 'PAYMENTS';
				dataToSend.getParams.allocated = true;
				dataToSend.getParams.page = $scope.arDataObj.allocatePageNo;
				break;
			case 'on-hold':
				dataToSend.getParams.transaction_type = 'CHARGES';
				dataToSend.getParams.paid = false;
				dataToSend.getParams.page = $scope.arDataObj.onHoldPageNo;
				dataToSend.getParams.sort_field = $scope.filterData.sortField;
				dataToSend.getParams.on_hold = true;
				break;
		}

		return dataToSend;
	};

	// Append active class
	var appendActiveClass = function appendActiveClass(list) {
		_.each(list, function (obj) {
			obj.active = false;
		});
	};

	// Allocated payment object
	$scope.allocatedPayment = {};

	/*
  * Successcallback of API after fetching Ar Transaction details.
  * Handling data based on tabs currently active.
  */
	var successCallbackOfFetchAPI = function successCallbackOfFetchAPI(data) {
		$scope.transactionsDetails = data;
		if (data.ar_transactions.length === 0) {
			if ($scope.arFlags.currentSelectedArTab === 'balance' && $scope.arDataObj.balancePageNo !== 1) {
				loadAPIData('BALANCE', 1);
			}
		}

		$scope.arDataObj.unpaidAmount = data.unpaid_amount;
		$scope.arDataObj.unpaidPaymentAmount = data.unpaid_payment_amount;
		$scope.arDataObj.unpaidPayableAmount = data.unpaid_payable_amount;
		$scope.arDataObj.paidAmount = data.paid_amount;
		$scope.arDataObj.allocatedCredit = data.allocated_credit;
		$scope.arDataObj.unallocatedCredit = data.unallocated_credit;
		$scope.arDataObj.company_or_ta_bill_id = data.company_or_ta_bill_id;
		$scope.arDataObj.arBalance = data.ar_balance;
		$scope.arDataObj.isPrintArInvoiceNumberEnabled = data.is_print_ar_invoice_number_enabled;
		$scope.arDataObj.arInvoiceLabel = data.ar_invoice_label;
		$scope.arDataObj.is_bill_lock_enabled = data.is_bill_lock_enabled;
		$scope.arDataObj.selectAllOpenBills = false;
		if ($scope.arFlags.currentSelectedArTab === 'balance') {
			$scope.arDataObj.total_count = data.total_count;
		}

		switch ($scope.arFlags.currentSelectedArTab) {
			case 'balance':
				_.each(data.ar_transactions, function (eachItem) {
					eachItem.amount = parseFloat(eachItem.amount).toFixed(2);
					eachItem.isSelected = false;
					eachItem.balanceNow = eachItem.amount;
					eachItem.balanceAfter = 0;
					eachItem.initialAmount = eachItem.amount;
				});
				$scope.arDataObj.balanceList = [];
				$scope.arDataObj.balanceList = data.ar_transactions;
				$scope.arDataObj.balanceTotalCount = data.total_count;
				appendActiveClass($scope.arDataObj.balanceList);
				$scope.$broadcast("FETCH_COMPLETE_BALANCE_LIST");

				$timeout(function () {
					$scope.$broadcast('updatePagination', 'BALANCE');
				}, 1000);

				break;
			case 'paid-bills':
				$scope.arDataObj.paidList = [];
				$scope.arDataObj.paidList = data.ar_transactions;
				$scope.arDataObj.paidTotalCount = data.total_count;
				appendActiveClass($scope.arDataObj.paidList);
				$scope.$broadcast("FETCH_COMPLETE_PAID_LIST");

				$timeout(function () {
					$scope.$broadcast('updatePagination', 'PAID');
				}, 1000);

				break;
			case 'unallocated':
				$scope.arDataObj.unallocatedList = [];
				$scope.arDataObj.unallocatedList = data.ar_transactions;
				$scope.arDataObj.unallocatedTotalCount = data.total_count;
				appendActiveClass($scope.arDataObj.unallocatedList);
				$scope.$broadcast('REFRESH_UNALLOCATED_LIST_SCROLLER');

				$timeout(function () {
					$scope.$broadcast('updatePagination', 'UNALLOCATE');
				}, 1000);

				break;
			case 'allocated':
				$scope.arDataObj.allocatedList = [];
				$scope.arDataObj.allocatedList = data.ar_transactions;
				$scope.arDataObj.allocatedTotalCount = data.total_count;
				appendActiveClass($scope.arDataObj.allocatedList);
				$scope.$broadcast('REFRESH_ALLOCATED_LIST_SCROLLER');

				$timeout(function () {
					$scope.$broadcast('updatePagination', 'ALLOCATE');
				}, 1000);

				break;
			case 'on-hold':
				_.each(data.ar_transactions, function (eachItem) {
					eachItem.onHoldAmount = parseFloat(eachItem.amount).toFixed(2);
					eachItem.isonHoldSelected = false;
					eachItem.onHoldInitialAmount = eachItem.onHoldAmount;
				});
				$scope.arDataObj.onHoldList = [];
				$scope.arDataObj.onHoldList = data.ar_transactions;
				$scope.arDataObj.onHoldTotalCount = data.total_count;
				appendActiveClass($scope.arDataObj.onHoldList);
				$scope.$broadcast("FETCH_COMPLETE_ONHOLD_LIST");

				$timeout(function () {
					$scope.$broadcast('updatePagination', 'ONHOLD');
				}, 1000);

				break;
		}

		// CICO-53406 : Workaround to focus textbox
		var input = document.getElementById('arTransactionQuery');

		input.focus();
	};

	/*
 * Fetch transactions API
 * @param dataToSend data object to API
 */
	that.fetchTransactions = function () {
		$scope.errorMessage = '';
		$scope.callAPI(rvAccountsArTransactionsSrv.fetchTransactionDetails, {
			successCallBack: successCallbackOfFetchAPI,
			params: that.createParametersFetchTheData()
		});
	};

	/*
 Select all open bills
 */
	$scope.clickedSelectAllBills = function () {
		$scope.arDataObj.selectedInvoices = [];
		if ($scope.arDataObj.selectAllOpenBills) {
			_.each($scope.arDataObj.balanceList, function (eachItem) {
				eachItem.isSelected = false;
			});
		}
	};

	/*
  * Here is the method to fetch the data in each tab
  * Params will be different on each tab
  */
	that.filterChanged = function () {
		$scope.arDataObj.selectAllOpenBills = false;
		$scope.arFlags.showSelectAllOpenBills = $scope.filterData.query === '' && $scope.filterData.fromDate === '' && $scope.filterData.toDate === '';

		switch ($scope.arFlags.currentSelectedArTab) {
			case 'balance':
				$scope.arDataObj.balancePageNo = 1;
				break;
			case 'paid-bills':
				$scope.arDataObj.paidPageNo = 1;
				break;
			case 'unallocated':
				$scope.arDataObj.unallocatePageNo = 1;
				break;
			case 'allocated':
				$scope.arDataObj.allocatePageNo = 1;
				break;
			case 'on-hold':
				$scope.arDataObj.onHoldPageNo = 1;
				break;
		}

		that.fetchTransactions();

		// CICO-53406 : Workaround to blur textbox
		var input = document.getElementById('arTransactionQuery');

		input.blur();
	};

	// CICO-53406 : Handle search action with debounce.
	$scope.queryEntered = _.debounce(that.filterChanged, DEBOUNCE_DELAY);

	/*
  * Switching btw different tabs in AR transaction screen
  * @param tab is selected tab
  */
	$scope.switchArTransactionTab = function (tab) {
		$scope.arFlags.currentSelectedArTab = tab;
		// sort option available for open and paid bill screens
		if (tab === 'balance' || tab === 'paid-bills' || tab === 'on-hold') {
			$scope.showSortFilter = true;
		} else {
			$scope.showSortFilter = false;
		}
		// toggle option available for open bill and on hold screens
		if (tab === 'balance' || tab === 'on-hold') {
			$scope.showToggleFilter = true;
		} else {
			$scope.showToggleFilter = false;
			// switch tab back to payable
			$scope.arFlags.isPayableTab = true;
		}
		if (tab !== 'balance') {
			$scope.arFlags.isAddBalanceScreenVisible = false;
		}
		$scope.arDataObj.balancePageNo = $scope.arDataObj.paidPageNo = $scope.arDataObj.unallocatePageNo = $scope.arDataObj.allocatePageNo = $scope.arDataObj.onHoldPageNo = 1;

		that.fetchTransactions();
	};

	var clearFilters = function clearFilters() {
		$scope.filterData.query = '';
		$scope.filterData.fromDate = '';
		$scope.filterData.toDate = '';
		$scope.filterData.sortField = 'aging_date';
		$scope.arFlags.showSelectAllOpenBills = true;
	};

	$scope.switchArTransactionOpenBillTab = function () {
		clearFilters();
		// switch to payable tab
		if ($scope.arFlags.isPayableTab) {
			$scope.switchArTransactionTab('balance');
		} else {
			// Clear selected checkbox and switch to on hold Tab
			$scope.arDataObj.selectedOnHoldInvoices = [];
			$scope.switchArTransactionTab('on-hold');
		}
	};

	/*
  * Show Add balance screen
  */
	$scope.showAddBalanceScreen = function () {
		$scope.arFlags.isAddBalanceScreenVisible = true;
		$scope.$broadcast('ADD_BALANCE_TAB');
	};

	/* Handle Sort filter change */
	$scope.changedSortBy = function () {
		that.filterChanged();
	};

	/* Handling different date picker clicks */
	$scope.clickedFromDate = function () {
		$scope.popupCalendar('FROM');
	};

	$scope.clickedToDate = function () {
		$scope.popupCalendar('TO');
	};
	// Clear from date
	$scope.clearFromDate = function () {
		$scope.filterData.fromDate = '';
		that.filterChanged();
	};
	// Clear to date
	$scope.clearToDate = function () {
		$scope.filterData.toDate = '';
		that.filterChanged();
	};
	// To handle from date change
	$scope.$on('fromDateChanged', function () {
		that.filterChanged();
	});

	// To handle to date change
	$scope.$on('toDateChanged', function () {
		that.filterChanged();
	});
	// Show calendar popup.
	$scope.popupCalendar = function (clickedOn) {
		$scope.clickedOn = clickedOn;
		ngDialog.open({
			template: '/assets/partials/companyCard/contracts/rvCompanyCardContractsCalendar.html',
			controller: 'RVArTransactionsDatePickerController',
			className: '',
			scope: $scope
		});
	};
	// Show payment allocate popup.
	$scope.popupPaymentForAllocation = function () {
		$scope.type = 'ALLOCATE';
		ngDialog.open({
			template: '/assets/partials/companyCard/arTransactions/rvCompanyTravelAgentCardArPaymentPopup.html',
			controller: 'RVArPaymentForAllocationController',
			scope: $scope
		});
	};
	// update allocated payment.
	$scope.updateAllocatedPayment = function (payment) {
		$scope.allocatedPayment = payment;
		$scope.arDataObj.availableAmount = payment.available_amount;
		$scope.arFlags.isPaymentSelected = true;
		ngDialog.close();
	};

	/*
  * Add payment method
  */
	$scope.addPayment = function () {
		$scope.passData = getPassData();
		ngDialog.open({
			template: '/assets/partials/companyCard/arTransactions/rvArTransactionsPayCredits.html',
			controller: 'RVArTransactionsPayCreditsController',
			className: '',
			scope: $scope
		});
		$scope.paymentModalOpened = true;
	};

	/*
  * Success callback of payment
  */
	var successCallBackOfPayment = function successCallBackOfPayment() {
		$scope.arFlags.insufficientAmount = false;
		$scope.arDataObj.selectedInvoices = [];
		$scope.arFlags.isPaymentSelected = false;
		$scope.arFlags.shouldShowPayAllButton = false;
		$scope.arFlags.shouldShowFooter = false;
		$scope.arDataObj.availableAmount = 0;

		that.fetchTransactions();
	};

	/*
  * Failure callback of payment
  */
	var failureCallBackOfPayment = function failureCallBackOfPayment(errorMessage) {
		$scope.arDataObj.selectedInvoices = [];
		// In this case - we have to show the error in footer
		if (errorMessage[0] === "Insufficient Funds.Please 'Add payment' first") {
			$scope.errorMessage = [];
			$scope.arFlags.insufficientAmount = true;
		} else {
			$scope.errorMessage = errorMessage;
		}
	};

	/*
  * Pay selected invoices
  */
	$scope.paySelectedInvoices = function () {
		var postParamsToPay = {},
		    postData = {};

		postData.credit_id = $scope.allocatedPayment.transaction_id;
		postData.select_all = $scope.arDataObj.selectAllOpenBills;
		if (!$scope.arDataObj.selectAllOpenBills) {
			postData.selected_amount = $scope.arDataObj.totalAllocatedAmount;
			postData.available_amount = $scope.arDataObj.availableAmount;
			postData.invoices = $scope.arDataObj.selectedInvoices;
		}
		postParamsToPay.account_id = $scope.arDataObj.accountId;
		postParamsToPay.data = postData;

		var options = {
			params: postParamsToPay,
			successCallBack: successCallBackOfPayment,
			failureCallBack: failureCallBackOfPayment
		};

		$scope.callAPI(rvAccountsArTransactionsSrv.paySelected, options);
	};
	/*
  * Pay All Button click
  */
	$scope.clickedPayAllButton = function () {
		var postParamsToPay = {},
		    postData = {},
		    totalAllocatedAmount = 0;

		$scope.arDataObj.selectedInvoices = [];
		_.each($scope.arDataObj.balanceList, function (eachItem) {
			var selectedInvoiceObj = {};

			selectedInvoiceObj.invoice_id = eachItem.transaction_id;
			selectedInvoiceObj.amount = eachItem.amount;
			$scope.arDataObj.selectedInvoices.push(selectedInvoiceObj);
			totalAllocatedAmount = parseInt(totalAllocatedAmount) + parseInt(eachItem.amount);
		});
		$scope.arDataObj.totalAllocatedAmount = totalAllocatedAmount;

		postData.credit_id = $scope.allocatedPayment.transaction_id;
		postData.invoices = $scope.arDataObj.selectedInvoices;
		postData.selected_amount = $scope.arDataObj.totalAllocatedAmount;
		postData.available_amount = $scope.arDataObj.availableAmount;
		postParamsToPay.account_id = $scope.arDataObj.accountId;
		postParamsToPay.data = postData;
		var options = {
			params: postParamsToPay,
			successCallBack: successCallBackOfPayment,
			failureCallBack: failureCallBackOfPayment
		};

		$scope.callAPI(rvAccountsArTransactionsSrv.paySelected, options);
	};
	/*
  * Clicked Cancel from footer
  */
	$scope.clickCancelFromFooter = function () {
		$scope.arFlags.isPaymentSelected = false;
		$scope.arFlags.shouldShowFooter = false;
		$scope.arFlags.insufficientAmount = false;
		$scope.arFlags.shouldShowPayAllButton = false;
		$scope.arDataObj.selectedInvoices = [];
		$scope.arFlags.isFromAddPaymentOrAllocateButton = false;
		$scope.arDataObj.availableAmount = 0;
		_.each($scope.arDataObj.balanceList, function (eachItem) {
			eachItem.isSelected = false;
		});
		that.fetchTransactions();
	};
	// ON HOLD TAB FUNCTIONALITIES

	/* Should show footer instead of pagination
 * 1 case - if invoice selected
 */
	$scope.shouldShowOnHoldFooter = function () {
		return $scope.arDataObj.selectedOnHoldInvoices.length !== 0;
	};

	/*
 * Clicked Cancel from  on hold footer
 */
	$scope.clickCancelFromOnHoldFooter = function () {
		$scope.arFlags.shouldShowOnHoldFooter = false;
		$scope.arDataObj.selectedOnHoldInvoices = [];
		_.each($scope.arDataObj.onHoldList, function (eachItem) {
			eachItem.isonHoldSelected = false;
		});
		that.fetchTransactions();
	};

	/*
 * Success callback of hold invoices
 */
	var successCallBackOfHoldInvoice = function successCallBackOfHoldInvoice() {
		$scope.arDataObj.selectedInvoices = [];
		$scope.arFlags.shouldShowFooter = false;

		that.fetchTransactions();
	};

	/*
  * Failure callback of hold invoices
  */
	var failureCallBackOfHoldInvoice = function failureCallBackOfHoldInvoice(errorMessage) {
		$scope.arDataObj.selectedInvoices = [];
		// In this case - we have to show the error in footer
		$scope.errorMessage = errorMessage;
	};

	/* Hold selected invoices */
	$scope.holdSelectedInvoices = function () {
		var postData = {},
		    postParams = {},
		    selectedInvoiceId = [];

		_.each($scope.arDataObj.selectedInvoices, function (eachItem) {
			selectedInvoiceId.push(eachItem.invoice_id);
		});

		postData.selected_invoice_ids = selectedInvoiceId;

		postParams.account_id = $scope.arDataObj.accountId;
		postParams.data = postData;

		var options = {
			params: postParams,
			successCallBack: successCallBackOfHoldInvoice,
			failureCallBack: failureCallBackOfHoldInvoice
		};

		$scope.callAPI(rvAccountsArTransactionsSrv.holdSelectedInvoices, options);
	};

	/*
  * Success callback of release invoices
  */
	var successCallBackOfReleaseInvoice = function successCallBackOfReleaseInvoice() {
		$scope.arDataObj.selectedOnHoldInvoices = [];
		$scope.arFlags.shouldShowOnHoldFooter = false;

		that.fetchTransactions();
	};

	/*
  * Failure callback of hold invoices
  */
	var failureCallBackOfReleaseInvoice = function failureCallBackOfReleaseInvoice(errorMessage) {
		$scope.arDataObj.selectedOnHoldInvoices = [];
		// In this case - we have to show the error in footer
		$scope.errorMessage = errorMessage;
	};

	/* Release selected Invoices */
	$scope.releaseSelectedInvoices = function () {
		var postData = {},
		    postParams = {},
		    selectedReleaseInvoiceId = [];

		_.each($scope.arDataObj.selectedOnHoldInvoices, function (eachItem) {
			selectedReleaseInvoiceId.push(eachItem.invoice_id);
		});

		postData.selected_invoice_ids = selectedReleaseInvoiceId;

		postParams.account_id = $scope.arDataObj.accountId;
		postParams.data = postData;

		var options = {
			params: postParams,
			successCallBack: successCallBackOfReleaseInvoice,
			failureCallBack: failureCallBackOfReleaseInvoice
		};

		$scope.callAPI(rvAccountsArTransactionsSrv.releaseSelectedInvoices, options);
	};

	/*
  * Should show footer instead of pagination
  * 2 cases - one if invoice selected
  *         - if selected payment from add payment or from unallocate tab
  */
	$scope.shouldShowFooter = function () {
		var flag = true;

		if ($scope.arDataObj.selectedInvoices.length === 0 && !$scope.arFlags.isFromAddPaymentOrAllocateButton && !$scope.arDataObj.selectAllOpenBills) {
			flag = false;
		}
		return flag;
	};
	/*
 * Data object to pass to the credit pay controller
 */
	var getPassData = function getPassData() {
		var passData = {
			"account_id": $scope.arDataObj.accountId,
			"is_swiped": false,
			"details": {
				"firstName": "",
				"lastName": ""
			}
		};

		return passData;
	};

	/*
  *	MLI SWIPE actions
  */
	var processSwipedData = function processSwipedData(swipedCardData) {

		var passData = getPassData();
		var swipeOperationObj = new SwipeOperation();
		var swipedCardDataToRender = swipeOperationObj.createSWipedDataToRender(swipedCardData);

		passData.details.swipedDataToRenderInScreen = swipedCardDataToRender;
		$scope.$broadcast('SHOW_SWIPED_DATA_ON_PAY_SCREEN', swipedCardDataToRender);
	};

	/*
  * Handle swipe action
  * @param {Object} - [event object]
  * @param {Object} - [swipedCardData object]
  * @return {undefined}
  */
	listeners['SWIPE_ACTION'] = $scope.$on('SWIPE_ACTION', function (event, swipedCardData) {
		if ($scope.paymentModalOpened) {
			var swipeOperationObj = new SwipeOperation(),
			    getTokenFrom = swipeOperationObj.createDataToTokenize(swipedCardData),
			    tokenizeSuccessCallback = function tokenizeSuccessCallback(tokenValue) {
				$scope.$emit('hideLoader');
				swipedCardData.token = tokenValue;
				processSwipedData(swipedCardData);
			};

			$scope.invokeApi(RVReservationCardSrv.tokenize, getTokenFrom, tokenizeSuccessCallback);
		} else {
			return;
		}
	});

	/*
  * Initial loading of the screen
  *
  */
	var init = function init() {
		that.fetchTransactions();
	};

	// Catch error messges from child controllers.
	listeners['SHOW_ERROR_MSG'] = $scope.$on('SHOW_ERROR_MSG', function (event, errorMessage) {
		$scope.errorMessage = errorMessage;
	});
	// Refresh payable balance list - after adding new manual balance
	// and after succesfull payment with Allocate payment after posting checked
	listeners['REFRESH_PAYABLE_LIST'] = $scope.addListener('REFRESH_PAYABLE_LIST', function () {
		$scope.arFlags.currentSelectedArTab = 'balance';
		$scope.arDataObj.balancePageNo = 1;
		$scope.arFlags.isPayableTab = true;
		$scope.showToggleFilter = true;
		that.fetchTransactions();
	});

	// Refresh payable OR on-hold balance list - move invoice, post charge
	// and invoice adjust charge code, invoice unallocate charge
	listeners['REFRESH_BALANCE_LIST'] = $scope.addListener('REFRESH_BALANCE_LIST', function () {
		$scope.switchArTransactionOpenBillTab();
	});

	// Refresh balance list - after adding new manual balance
	// and after succesfull payment with Allocate payment after posting checked
	listeners['REFRESH_UNALLOCATED'] = $scope.$on('REFRESH_UNALLOCATED', function () {
		$scope.arFlags.currentSelectedArTab = 'unallocated';
		that.fetchTransactions();
	});
	// Refresh paid bills list - after adding new manual balance
	// and after succesfull payment with Allocate payment after posting checked
	listeners['REFRESH_PAID_BILLS'] = $scope.$on('REFRESH_PAID_BILLS', function () {
		$scope.arFlags.currentSelectedArTab = 'paid-bills';
		that.fetchTransactions();
	});
	// Refresh allacated list - After unallocate
	listeners['REFRESH_ALLOCATED'] = $scope.$on('REFRESH_ALLOCATED', function () {
		$scope.arFlags.currentSelectedArTab = 'allocated';
		that.fetchTransactions();
	});

	// Refresh selected list
	listeners['REFRESH_SELECTED_LIST'] = $scope.$on('REFRESH_SELECTED_LIST', function () {
		that.fetchTransactions();
	});
	// Clicked allocate button from unallocated tab
	listeners['CLICKED_ALLOCATE_BUTTON'] = $scope.$on('CLICKED_ALLOCATE_BUTTON', function (event, selectedPaymentData) {
		$scope.arFlags.shouldShowPayAllButton = true;
		$scope.arFlags.currentSelectedArTab = 'balance';
		$scope.showToggleFilter = true; // show toggle in openbills
		$scope.arFlags.isPayableTab = true; // show payable tab selected
		$scope.allocatedPayment = selectedPaymentData;
		$scope.arFlags.isPaymentSelected = true;
		$scope.arDataObj.availableAmount = selectedPaymentData.available_amount ? parseFloat(selectedPaymentData.available_amount).toFixed(2) : "0.00";
		$scope.arFlags.isFromAddPaymentOrAllocateButton = true;
		var totalAllocatedAmount = 0;

		_.each($scope.arDataObj.balanceList, function (eachItem) {
			totalAllocatedAmount = parseFloat(totalAllocatedAmount) + parseFloat(eachItem.amount);
		});
		$scope.arDataObj.totalOfAllInvoicesInBalanceTab = totalAllocatedAmount.toFixed(2);
		$scope.arDataObj.totalAllocatedAmount = totalAllocatedAmount;
	});

	/*
  * Initial loading of this AR transactions tab
  */
	listeners['arTransactionTabActive'] = $scope.$on('arTransactionTabActive', function () {
		init();
		$scope.arFlags.isArTabActive = true;
	});

	// -------/ PAGINATION LOGIC /----------- //

	/*
  * Fetch transactions APIs
  * @param pageType { String } , Page No { String }to API
  */
	var loadAPIData = function loadAPIData(pageType, pageNo) {
		switch (pageType) {
			case 'BALANCE':
				$scope.arDataObj.balancePageNo = pageNo;
				break;
			case 'PAID':
				$scope.arDataObj.paidPageNo = pageNo;
				break;
			case 'ALLOCATE':
				$scope.arDataObj.allocatePageNo = pageNo;
				break;
			case 'UNALLOCATE':
				$scope.arDataObj.unallocatePageNo = pageNo;
				break;
			case 'ONHOLD':
				$scope.arDataObj.onHoldPageNo = pageNo;
				break;
		}

		$scope.callAPI(rvAccountsArTransactionsSrv.fetchTransactionDetails, {
			successCallBack: successCallbackOfFetchAPI,
			params: that.createParametersFetchTheData()
		});
	};

	// Pagination options for BALANCE
	$scope.balancePagination = {
		id: 'BALANCE',
		api: [loadAPIData, 'BALANCE'],
		perPage: $scope.arDataObj.perPage
	};

	// Pagination options for PAID
	$scope.paidPagination = {
		id: 'PAID',
		api: [loadAPIData, 'PAID'],
		perPage: $scope.arDataObj.perPage
	};

	// Pagination options for AR_BALANCE
	$scope.allocatePagination = {
		id: 'ALLOCATE',
		api: [loadAPIData, 'ALLOCATE'],
		perPage: $scope.arDataObj.perPage
	};

	// Pagination options for AR_BALANCE
	$scope.unallocatePagination = {
		id: 'UNALLOCATE',
		api: [loadAPIData, 'UNALLOCATE'],
		perPage: $scope.arDataObj.perPage
	};

	// Pagination options for ONHOLD
	$scope.onHoldPagination = {
		id: 'ONHOLD',
		api: [loadAPIData, 'ONHOLD'],
		perPage: $scope.arDataObj.perPage
	};

	// -------/ PAGINATION LOGIC /----------- //

	// Handler for statement button click
	var successCallBackForLanguagesFetch = function successCallBackForLanguagesFetch(data) {
		$scope.$emit('hideLoader');
		if (data.languages) {
			data.languages = _.filter(data.languages, {
				is_show_on_guest_card: true
			});
		}
		$scope.languageData = data;
		$scope.filterData.locale = data.selected_language_code;
		ngDialog.open({
			template: '/assets/partials/companyCard/arTransactions/rvArStatementPopup.html',
			className: '',
			closeByDocument: false,
			scope: $scope
		});
	};
	/**
 * Fetch the guest languages list and settings
 * @return {undefined}
 */
	var fetchGuestLanguages = function fetchGuestLanguages() {
		// call api
		$scope.invokeApi(RVContactInfoSrv.fetchGuestLanguages, {}, successCallBackForLanguagesFetch);
	};

	// Handle Ar Statement button actions.
	$scope.clickedArStatementButton = function () {
		$scope.filterData.statementEmailAddress = $scope.contactInformation.address_details.email_address;
		var dataFetchSuccess = function dataFetchSuccess(data) {
			$scope.statementEmailAddress = !!data.to_address ? data.to_address : '';
			fetchGuestLanguages();
		},
		    dataFailureCallback = function dataFailureCallback(errorData) {
			$scope.errorMessage = errorData;
		};

		var params = { 'id': $scope.arDataObj.accountId };

		var options = {
			params: params,
			successCallBack: dataFetchSuccess,
			failureCallBack: dataFailureCallback
		};

		$scope.callAPI(rvAccountsArTransactionsSrv.fetchArStatementData, options);
	};

	// Checks whether include payment checkbox should be shown or not
	$scope.showIncludePayments = function () {
		return $scope.arFlags.currentSelectedArTab === 'balance' || $scope.arFlags.currentSelectedArTab === 'paid-bills';
	};

	// Get parameters for fetch data
	var getParamsToSend = function getParamsToSend() {
		var paramsToSend = {
			"id": $scope.arDataObj.accountId,
			"from_date": $scope.filterData.fromDate,
			"to_date": $scope.filterData.toDate,
			"query": $scope.filterData.query
		};

		if ($scope.arFlags.currentSelectedArTab === 'balance') {
			paramsToSend.paid = false;
			paramsToSend.transaction_type = 'CHARGES';
			paramsToSend.include_payments = $scope.filterData.includePayments;
			paramsToSend.sort_field = $scope.filterData.sortField;
		} else if ($scope.arFlags.currentSelectedArTab === 'paid-bills') {
			paramsToSend.paid = true;
			paramsToSend.transaction_type = 'CHARGES';
			paramsToSend.include_payments = $scope.filterData.includePayments;
			paramsToSend.sort_field = $scope.filterData.sortField;
		} else if ($scope.arFlags.currentSelectedArTab === 'unallocated') {
			paramsToSend.transaction_type = 'PAYMENTS';
			paramsToSend.allocated = false;
		} else if ($scope.arFlags.currentSelectedArTab === 'allocated') {
			paramsToSend.transaction_type = 'PAYMENTS';
			paramsToSend.allocated = true;
		}
		// CICO-10323. for hotels with single digit search,
		// If it is a numeric query with less than 3 digits, then lets assume it is room serach.

		if ($rootScope.isSingleDigitSearch && !isNaN($scope.filterData.textInQueryBox) && $scope.filterData.textInQueryBox.length < 3) {

			paramsToSend.room_search = true;
		}
		paramsToSend.locale = $scope.filterData.locale;
		paramsToSend.is_summary = $scope.filterData.isSummary;
		return paramsToSend;
	};

	// add the print orientation before printing
	var addPrintOrientation = function addPrintOrientation() {
		$('head').append("<style id='print-orientation'>@page { size: portrait; }</style>");
	};

	// add the print orientation after printing
	var removePrintOrientation = function removePrintOrientation() {
		$('#print-orientation').remove();
	};

	var arTransactionPrintCompleted = function arTransactionPrintCompleted() {
		$("header .logo").removeClass('logo-hide');
		// inoder to re-set/remove class 'print-statement' on rvCompanyCardDetails.html
		$scope.$emit("PRINT_AR_STATEMENT", false);
		// remove the orientation after similar delay
		removePrintOrientation();
	};
	/* 
 * Should print AR invoice number
 * @param printData response
 * @param statement individual item
 */
	$scope.shouldPrintArInvoiceNumber = function (printData, statement) {
		var printArInvNo = false;

		if (printData.is_print_ar_invoice_number_enabled && statement.ar_invoice_number) {
			printArInvNo = true;
		}

		return printArInvNo;
	};
	/* 
  * Should print folio number
  * @param printData response
  * @param statement individual item
  */
	$scope.shouldPrintFolioNumber = function (printData, statement) {
		var printFolioNo = false;

		if (!statement.ar_invoice_number) {
			if (printData.is_print_folio_enabled && statement.folio_number) {
				printFolioNo = true;
			} else if (!printData.is_print_folio_enabled && (statement.folio_number || !statement.folio_number)) {
				printFolioNo = false;
			}
		} else {
			if (!printData.is_print_ar_invoice_number_enabled && printData.is_print_folio_enabled && statement.folio_number) {
				printFolioNo = true;
			} else if (!printData.is_print_folio_enabled && (statement.folio_number || !statement.folio_number)) {
				printFolioNo = false;
			}
		}

		return printFolioNo;
	};
	/* 
  * Should print Invoice number
  * @param printData response
  * @param statement individual item
  */

	$scope.shouldPrintInvoiceNumber = function (printData, statement) {
		var printInvNo = false;
		// only show invoice number when print invoice number is enabled and statement has invoice number data
		// CICO-83139
		if (printData.is_print_invoice_enabled && statement.invoice_number) {
			if (!printData.is_print_ar_invoice_number_enabled && !printData.is_print_folio_enabled) {
				printInvNo = true;
			} else if (!printData.is_print_ar_invoice_number_enabled && printData.is_print_folio_enabled && !statement.folio_number) {
				printInvNo = true;
			} else if (printData.is_print_ar_invoice_number_enabled && !statement.ar_invoice_number && printData.is_print_folio_enabled && !statement.folio_number) {
				printInvNo = true;
			} else if (!statement.ar_invoice_number && !statement.folio_number) {
				printInvNo = true;
			}
		}

		return printInvNo;
	};

	// print AR Statement
	var printArStatement = function printArStatement(params) {
		var printDataFetchSuccess = function printDataFetchSuccess(successData) {
			$scope.printData = successData;
			$scope.printData.is_summary = $scope.filterData.isSummary;
			$scope.errorMessage = "";
			// hide hotel logo
			$("header .logo").addClass('logo-hide');
			// inoder to set class 'print-statement' on rvCompanyCardDetails.html
			$scope.$emit("PRINT_AR_STATEMENT", true);
			// add the orientation
			addPrintOrientation();
			/*
   *   ======[ READY TO PRINT ]======
   */
			// this will show the popup with full bill
			$timeout(function () {

				if (sntapp.cordovaLoaded) {
					cordova.exec(arTransactionPrintCompleted, function () {
						arTransactionPrintCompleted();
					}, 'RVCardPlugin', 'printWebView', []);
				} else {
					window.print();
					arTransactionPrintCompleted();
				}
			}, 100);

			/*
   *   ======[ PRINTING COMPLETE. JS EXECUTION WILL UNPAUSE ]======
   */
		};

		var printDataFailureCallback = function printDataFailureCallback(errorData) {
			$scope.errorMessage = errorData;
		};

		var options = {
			params: params,
			successCallBack: printDataFetchSuccess,
			failureCallBack: printDataFailureCallback
		};

		$scope.callAPI(rvAccountsArTransactionsSrv.fetchArStatementPrintData, options);
	};

	// Handler for AR statement print
	$scope.pritArStatement = function () {
		var params = getParamsToSend();

		printArStatement(params);
	};

	// To show email sent callbacks
	$scope.showEmailSentStatusPopup = function () {
		ngDialog.open({
			template: '/assets/partials/popups/rvEmailSentStatusPopup.html',
			className: '',
			scope: $scope
		});
	};
	// Popup for AR invoice print flow
	$scope.showFormatBillPopup = function (index, is_from) {
		$scope.is_from_ar = true;
		$scope.is_bill_lock_enabled = $scope.arDataObj.is_bill_lock_enabled;
		$scope.billFormat = {};
		$scope.billFormat.isInformationalInvoice = false;
		$scope.arTransactionsData = $scope.arDataObj;
		// Print invoice from paid list
		if (is_from === 'paid') {
			$scope.item = $scope.arDataObj.paidList[index];
		} else if (is_from === 'payable') {
			$scope.item = $scope.arDataObj.balanceList[index];
		} else {
			$scope.item = $scope.arDataObj.onHoldList[index];
		}

		if ($scope.item.paid) {
			if ($scope.item.is_locked || !$scope.is_bill_lock_enabled) {
				$scope.isInvoiceStepOneActive = false;
				$scope.isInvoiceStepThreeActive = true;
				$scope.shouldGenerateFinalInvoice = false;
				$scope.disableInformationCheckBox = true;
			} else {
				$scope.isInvoiceStepOneActive = true;
				$scope.isInvoiceStepThreeActive = false;
				$scope.shouldGenerateFinalInvoice = true;
				$scope.disableInformationCheckBox = true;
			}
		} else {
			$scope.isInvoiceStepOneActive = false;
			$scope.isInvoiceStepThreeActive = true;
			$scope.shouldGenerateFinalInvoice = false;
			$scope.disableInformationCheckBox = false;
		}
		$scope.isInvoiceStepTwoActive = false;
		$scope.isInvoiceStepFourActive = false;
		$scope.isInvoiceStepFiveActive = false;
		ngDialog.open({
			template: '/assets/partials/popups/billFormat/rvBillFormatPopup.html',
			controller: 'rvArBillFormatPopupCtrl',
			className: '',
			scope: $scope
		});
	};

	/*
 *	Method to show Invoice pending while fiskilazation in progress.
 *	This is for EFSTA only.
 */
	var showInvoicePendingInfoPopup = function showInvoicePendingInfoPopup() {
		ngDialog.open({
			template: '/assets/partials/popups/billFormat/rvInvoicePendingInfoPopup.html',
			className: '',
			scope: $scope
		});
	};
	// Send email AR statement
	$scope.emailArStatement = function () {
		var params = getParamsToSend();

		params.to_address = $scope.filterData.statementEmailAddress;
		$scope.closeDialog();

		var emailSuccess = function emailSuccess() {
			$scope.errorMessage = "";
			$scope.statusMsg = $filter('translate')('EMAIL_SENT_SUCCESSFULLY');
			$scope.status = "success";
			$scope.showEmailSentStatusPopup();
		},
		    emailFailureCallback = function emailFailureCallback(errorData) {
			$scope.errorMessage = errorData;
			$scope.statusMsg = $filter('translate')('EMAIL_SEND_FAILED');
			$scope.status = "alert";
			$scope.showEmailSentStatusPopup();
		};

		var options = {
			params: params,
			successCallBack: emailSuccess,
			failureCallBack: emailFailureCallback
		};

		$scope.callAPI(rvAccountsArTransactionsSrv.emailArStatement, options);
	};

	$scope.clickedEmail = function (data) {
		$scope.closeDialog();
		if ($scope.arDataObj.paidList.length > 0 && data.is_locked) {
			$scope.item.is_locked = data.is_locked;
		}
		var sendEmailSuccessCallback = function sendEmailSuccessCallback(successData) {
			if (successData.is_invoice_issued) {
				$scope.statusMsg = $filter('translate')('EMAIL_SENT_SUCCESSFULLY');
				$scope.status = "success";
				$scope.showEmailSentStatusPopup();
				$scope.switchArTransactionTab($scope.arFlags.currentSelectedArTab);
			} else {
				$scope.switchArTransactionTab($scope.arFlags.currentSelectedArTab);
				$timeout(function () {
					showInvoicePendingInfoPopup();
				}, 500);
			}
		},
		    sendEmailFailureCallback = function sendEmailFailureCallback(errorData) {
			$scope.statusMsg = $filter('translate')('EMAIL_SEND_FAILED');
			$scope.status = "alert";
			$scope.showEmailSentStatusPopup();
		},
		    options = {
			params: data,
			successCallBack: sendEmailSuccessCallback,
			failureCallBack: sendEmailFailureCallback
		};
		$scope.callAPI(rvAccountsArTransactionsSrv.sendEmail, options);
	};

	$scope.clickedPrint = function (requestParams) {
		sntActivity.start("PRINT_STARTED");
		if ($scope.arDataObj.paidList.length > 0 && requestParams.is_locked) {
			$scope.item.is_locked = requestParams.is_locked;
		}
		$scope.closeDialog();
		printBill(requestParams);
	};

	var billCardPrintCompleted = function billCardPrintCompleted() {
		$('.nav-bar').removeClass('no-print');
		$('.cards-header').removeClass('no-print');
		$('.card-tabs-nav').removeClass('no-print');
		$("header .nav-bar").removeClass('no-print');
		$(".billing-sidebar").removeClass('no-print');
		$(".reservation-transaction").removeClass('no-print');
		$(".tab-header").removeClass('no-print');
		$("#add-balance").removeClass('no-print');
		if ($scope.shouldGenerateFinalInvoice && !$scope.billFormat.isInformationalInvoice) {
			$scope.$broadcast("UPDATE_WINDOW");
		}
		$scope.closeDialog();
		$scope.printBillCardActive = false;
		$("body #loading").html('<div id="loading-spinner" ></div>');
		$scope.switchArTransactionTab($scope.arFlags.currentSelectedArTab);
		sntActivity.stop("PRINT_STARTED");
	};

	// print the page
	var printBill = function printBill(data) {
		var getCopyCount = function getCopyCount(successData) {
			var copyCount = "";

			if (successData.is_copy_counter && successData.no_of_original_invoices === 0) {
				copyCount = parseInt(successData.print_counter) - 1;
			} else if (successData.is_copy_counter && successData.no_of_original_invoices > 0) {
				copyCount = parseInt(successData.print_counter) - parseInt(successData.no_of_original_invoices);
			}
			return copyCount;
		},
		    printDataFetchSuccess = function printDataFetchSuccess(successData) {
			sntActivity.stop("PRINT_STARTED");
			successData = successData.data;
			var copyCount = "",
			    copyLabel = "",
			    arInvoiceNumberActivatedDate = moment(successData.print_ar_invoice_number_activated_at, "YYYY-MM-DD"),
			    arTransactionDate = moment(successData.ar_transaction_date, "YYYY-MM-DD"),
			    dateDifference = arTransactionDate.diff(arInvoiceNumberActivatedDate, 'days');

			$scope.shouldShowArInvoiceNumber = true;
			if (dateDifference < 0) {
				$scope.shouldShowArInvoiceNumber = false;
			}

			$scope.isPrintRegistrationCard = false;
			$scope.printBillCardActive = true;

			if ($scope.billFormat.isInformationalInvoice) {
				successData.invoiceLabel = successData.translation.information_invoice;
			} else if (parseInt(successData.print_counter) <= parseInt(successData.no_of_original_invoices)) {
				successData.invoiceLabel = successData.ar_invoice_label || successData.translation.ar_invoice;
			} else if (parseInt(successData.print_counter) === 1 && parseInt(successData.no_of_original_invoices) === 0) {
				successData.invoiceLabel = successData.ar_invoice_label || successData.translation.ar_invoice;
			} else if (parseInt(successData.print_counter) > parseInt(successData.no_of_original_invoices) && !$scope.roverObj.noReprintReEmailInvoice) {
				if (successData.is_copy_counter) {
					copyCount = getCopyCount(successData);
				}
				copyLabel = successData.ar_invoice_copy_label || successData.translation.copy_of_ar_invoice;
				successData.invoiceLabel = copyLabel.replace("#count", copyCount);
			} else if (!$scope.billFormat.isInformationalInvoice) {
				successData.invoiceLabel = successData.ar_invoice_label || successData.translation.ar_invoice;
			}
			if (successData.is_invoice_issued) {
				$scope.printData = successData;
				$scope.errorMessage = "";

				// CICO-9569 to solve the hotel logo issue
				$("header .logo").addClass('logo-hide');
				$("header .h2").addClass('text-hide');
				$("body #loading").html(""); // CICO-56119
				$("header .nav-bar").addClass('no-print');
				$(".cards-header").addClass('no-print');
				$("#cards-header-id").addClass('no-print');
				$(".billing-sidebar").addClass('no-print');
				$(".reservation-transaction").addClass('no-print');
				$(".card-tabs-nav").addClass('no-print');
				$(".tab-header").addClass('no-print');
				$("#add-balance").addClass('no-print');

				// add the orientation
				// addPrintOrientation();

				/*
    *	======[ READY TO PRINT ]======
    */
				// this will show the popup with full bill
				$timeout(function () {

					if (sntapp.cordovaLoaded) {
						cordova.exec(billCardPrintCompleted, function (error) {
							billCardPrintCompleted();
						}, 'RVCardPlugin', 'printWebView', []);
					} else {
						window.print();
						billCardPrintCompleted();
					}
				}, 700);
			} else {
				$scope.switchArTransactionTab($scope.arFlags.currentSelectedArTab);
				showInvoicePendingInfoPopup();
			}
		};

		var printDataFailureCallback = function printDataFailureCallback(errorData) {
			$scope.errorMessage = errorData;
			sntActivity.stop("PRINT_STARTED");
		},
		    options = {
			params: data,
			successCallBack: printDataFetchSuccess,
			failureCallBack: printDataFailureCallback
		};
		$scope.callAPI(rvAccountsArTransactionsSrv.fetchBillPrintData, options);
	};

	/**
 * function to check whether the user has permission
 * to create/edit AR Account.
 * @return {Boolean}
 */
	$scope.hasPermissionToCreateArAccount = function () {
		return rvPermissionSrv.getPermissionValue('CREATE_AR_ACCOUNT');
	};
	// CICO-45342 Handle clear search button click
	$scope.clearResults = function () {
		$scope.filterData.query = '';
		that.filterChanged();
	};
	/*
  * To list all allocated payments on click refund button
  * Same popup used for listing payments from 'Please select payment' - in Balance tab
  */
	$scope.getAllocatedPayments = function () {
		$scope.type = 'REFUND';
		ngDialog.open({
			template: '/assets/partials/companyCard/arTransactions/rvCompanyTravelAgentCardArPaymentPopup.html',
			controller: 'RVArPaymentForAllocationController',
			scope: $scope
		});
	};
	/*
  * Clicked refund button action
  * Open new dialog to show refund payment screen
  */
	listeners['CLICKED_REFUND_BUTTON'] = $scope.$on('CLICKED_REFUND_BUTTON', function (event, payment) {
		if (payment.payment_type_value === "CC") {
			payment.card_details.ending_with = payment.card_details.last_digits;
			payment.card_details.expiry_date = payment.card_details.expire_date;
		}

		var passData = {
			"account_id": $scope.arDataObj.accountId,
			"isRefundClick": true,
			"is_swiped": false,
			"details": {
				"firstName": "",
				"lastName": ""
			},
			payment: payment
		};

		$scope.passData = passData;

		$timeout(function () {

			ngDialog.open({
				template: '/assets/partials/companyCard/arTransactions/rvArTransactionsPayCredits.html',
				controller: 'RVArTransactionsPayCreditsController',
				className: '',
				scope: $scope
			});
			$scope.paymentModalOpened = true;
		}, 500);
	});

	// CICO-47819: Handling action after navigation back from Staycard
	listeners['BACK_FROM_STAY_CARD'] = $scope.$on('BACK_FROM_STAY_CARD', function () {
		if (typeof $scope.arDataObj.accountId === 'undefined') {
			$timeout(function () {
				// Switch back to on-hold tab
				if ($stateParams.isBackFromStaycardToARTab === 'on-hold') {
					$scope.arFlags.isPayableTab = false;
				}
				// switch back to previous AR Tab
				$scope.switchArTransactionTab($stateParams.isBackFromStaycardToARTab);
				init();
			}, 2000);
		}
	});
	/*
  * CICO-50427 : AR: Move zero invoices to the Paid tab even if no allocations exist.
  * Handle the Move Zero Invoice As Paid button click.
  */
	$scope.clickedMoveZeroInvoicesAsPaid = function () {
		var params = {
			account_id: $scope.arDataObj.accountId
		},
		    moveZeroInvoiceSuccessCallback = function moveZeroInvoiceSuccessCallback() {
			$scope.errorMessage = '';
			that.fetchTransactions();
		},
		    moveZeroInvoiceFailureCallback = function moveZeroInvoiceFailureCallback(errorData) {
			$scope.errorMessage = errorData;
		},
		    options = {
			params: params,
			successCallBack: moveZeroInvoiceSuccessCallback,
			failureCallBack: moveZeroInvoiceFailureCallback
		};

		$scope.callAPI(rvAccountsArTransactionsSrv.moveZeroInvoiceAsPaid, options);
	};

	// Destory listeners
	angular.forEach(listeners, function (listener) {
		$scope.$on('$destroy', listener);
	});
}]);