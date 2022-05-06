'use strict';

sntRover.controller('RvArOnHoldController', ['$scope', '$timeout', 'rvAccountsArTransactionsSrv', 'RVCompanyCardSrv', '$vault', '$stateParams', '$state', 'sntActivity', 'ngDialog', function ($scope, $timeout, rvAccountsArTransactionsSrv, RVCompanyCardSrv, $vault, $stateParams, $state, sntActivity, ngDialog) {

	BaseCtrl.call(this, $scope);

	var scrollOptions = { preventDefaultException: { tagName: /^(INPUT|LI)$/ }, preventDefault: false };

	$scope.setScroller('onhold-list', scrollOptions);

	var refreshScroll = function refreshScroll() {
		$timeout(function () {
			$scope.refreshScroller('onhold-list');
		}, 1000);
	};

	// Refresh scroll after completing fetch data
	$scope.addListener("FETCH_COMPLETE_ONHOLD_LIST", function () {
		refreshScroll();
		$scope.arDataObj.totalOfAllInvoicesInOnHoldTab = 0;
		_.each($scope.arDataObj.onHoldList, function (eachItem) {
			$scope.arDataObj.totalOfAllInvoicesInOnHoldTab = parseFloat($scope.arDataObj.totalOfAllInvoicesInOnHoldTab) + parseFloat(eachItem.amount);
		});
	});

	/*
  * Select individual invoices in balance tab
  * update the selected invoices variable
  */
	var selectInvoice = function selectInvoice(transactionId) {
		$timeout(function () {
			_.each($scope.arDataObj.onHoldList, function (eachItem) {
				if (eachItem.transaction_id === transactionId) {
					eachItem.isonHoldSelected = !eachItem.isonHoldSelected;
					var selectedInvoiceObj = {};

					selectedInvoiceObj.invoice_id = transactionId;
					if (eachItem.isonHoldSelected) {
						$scope.arDataObj.selectedOnHoldInvoices.push(selectedInvoiceObj);
					} else {
						$scope.arDataObj.selectedOnHoldInvoices = _.filter($scope.arDataObj.selectedOnHoldInvoices, function (item) {
							return item.invoice_id !== transactionId;
						});
					}
				}
			});
		}, 400);
	};

	// Handle balance tab api call.
	var callExpansionAPI = function callExpansionAPI(item) {
		sntActivity.start('EXPAND_BALANCE');
		var successCallbackOfExpansionAPI = function successCallbackOfExpansionAPI(data) {
			sntActivity.stop('EXPAND_BALANCE');
			item.active = true;
			item.debits = data.debits;
			item.payments = data.payments;
			refreshScroll();
		},
		    failureCallbackOfExpansionAPI = function failureCallbackOfExpansionAPI(errorMessage) {
			sntActivity.stop('EXPAND_BALANCE');
			$scope.$emit('SHOW_ERROR_MSG', errorMessage);
		};

		var dataToSend = {
			'id': item.transaction_id,
			'account_id': $scope.arDataObj.accountId
		};

		var options = {
			params: dataToSend,
			successCallBack: successCallbackOfExpansionAPI,
			failureCallBack: failureCallbackOfExpansionAPI
		};

		$scope.callAPI(rvAccountsArTransactionsSrv.expandPaidAndUnpaidList, options);
	};

	// Handle click events on balance list
	$scope.clickedOnParentList = function (event, index) {
		var clikedItem = $scope.arDataObj.onHoldList[index],
		    element = event.target,
		    amount = clikedItem.amount;

		event.stopImmediatePropagation();
		event.stopPropagation();

		if (amount >= 0 && (element.parentElement.classList.contains('checkbox') || element.classList.contains('checkbox'))) {
			// Checkbox selection logic will be called here..
			selectInvoice(clikedItem.transaction_id, index);
		} else if (!element.parentElement.classList.contains('actions') && !element.classList.contains('icon-edit-40') && !element.classList.contains('icon-double-arrow') && !element.classList.contains("text-box") && !element.classList.contains('button-edit')) {
			// Expand-collapse logic..
			clickedBalanceListItem(index);
		}
	};

	// Handle Toggle button click to expand list item
	var clickedBalanceListItem = function clickedBalanceListItem(index) {
		var clikedItem = $scope.arDataObj.onHoldList[index];

		if (!clikedItem.active) {
			callExpansionAPI(clikedItem);
		} else {
			clikedItem.active = false;
			refreshScroll();
		}
	};

	/*
  * function to execute on clicking on each result
  */
	$scope.goToReservationDetails = function (index) {

		var item = $scope.arDataObj.onHoldList[index];

		if ($scope.arFlags.viewFromOutside) {
			$vault.set('cardId', $stateParams.id);
			$vault.set('type', $stateParams.type);
			$vault.set('query', $stateParams.query);

			var associatedType = item.associated_type,
			    associatedId = item.associated_id;

			if (associatedType === 'Reservation') {
				$state.go("rover.reservation.staycard.reservationcard.reservationdetails", {
					id: associatedId,
					confirmationId: item.reservation_confirm_no,
					isrefresh: true,
					isFromCards: true,
					isFromArTab: 'on-hold'
				});
			} else if (associatedType === 'PostingAccount') {
				$state.go('rover.accounts.config', {
					id: associatedId,
					activeTab: 'ACCOUNT',
					isFromArTransactions: true,
					isFromArTab: 'on-hold'
				});
			}
		}
	};

	/*
  * Handle unallocate button click
  */
	$scope.clickedUnallocateButton = function (payment) {

		var successCallBackOfUnallocateData = function successCallBackOfUnallocateData(data) {
			$scope.selectedUnAllocatedItem = data;
			ngDialog.open({
				template: '/assets/partials/companyCard/arTransactions/rvCompanyTravelAgentUnallocatePopup.html',
				scope: $scope
			});
		};

		var requestParams = {},
		    paramsToService = {};

		requestParams.allocation_id = payment.id;
		paramsToService.account_id = $scope.arDataObj.accountId;
		paramsToService.data = requestParams;

		var options = {
			params: paramsToService,
			successCallBack: successCallBackOfUnallocateData
		};

		$scope.callAPI(rvAccountsArTransactionsSrv.unAllocateData, options);
	};
	/*
  * Un allocate selected payment
  */
	$scope.unAllocate = function () {
		var requestParams = {},
		    paramsToService = {},
		    successCallBackOfUnallocate = function successCallBackOfUnallocate() {
			$scope.$emit('REFRESH_BALANCE_LIST');
			ngDialog.close();
		};

		requestParams.allocation_id = $scope.selectedUnAllocatedItem.allocation_id;
		requestParams.credit_id = $scope.selectedUnAllocatedItem.from_bill.transaction_id;
		requestParams.debit_id = $scope.selectedUnAllocatedItem.to_payment.transaction_id;
		requestParams.amount = $scope.selectedUnAllocatedItem.amount;

		paramsToService.account_id = $scope.arDataObj.accountId;
		paramsToService.data = requestParams;

		var options = {
			params: paramsToService,
			successCallBack: successCallBackOfUnallocate
		};

		$scope.callAPI(rvAccountsArTransactionsSrv.unAllocateSelectedPayment, options);
	};

	/*
  *Function which fetches and returns the charge details of a grouped charge.
 */
	$scope.expandGroupedCharge = function (item) {

		// If the flag for toggle is false, perform api call to get the data.
		if (!item.isExpanded) {
			$scope.callAPI(RVCompanyCardSrv.groupChargeDetailsFetch, {
				params: {
					'reference_number': item.reference_number,
					'date': item.date,
					'bill_id': item.bill_id
				},
				successCallBack: function successCallBack(data) {
					item.light_speed_data = data.data;
					item.isExpanded = true;
					refreshScroll();
				},
				failureCallBack: function failureCallBack(errorMessage) {
					$scope.$emit('SHOW_ERROR_MSG', errorMessage);
				}
			});
		} else {
			// If the flag for toggle is true, then it is simply reverted to hide the data.
			item.isExpanded = false;
			refreshScroll();
		}
	};

	// CICO-43352 : Handle MOVE INVOICE.
	$scope.moveInvoiceButtonClick = function (data) {
		// Mapping the data to be passed to move invoice popup.
		var passData = {
			firstName: data.guest_first_name,
			lastName: data.guest_last_name,
			accountName: data.account_name,
			invoiceNumber: data.invoice_number,
			confirmationNumber: data.reservation_confirm_no,
			arrivalDate: data.reservation_arrival_date,
			arrivalTime: data.reservation_arrival_time,
			departureDate: data.reservation_dep_date,
			departureTime: data.reservation_dep_time,
			amount: data.amount,
			image: data.icon_url,
			transactionId: data.transaction_id,
			associatedType: data.associated_type
		};

		$scope.moveInvoiceHeaderData = passData;

		ngDialog.open({
			template: '/assets/partials/companyCard/arTransactions/rvArMoveInvoiceToArPopup.html',
			controller: 'rvArMoveInvoiceCtrl',
			className: '',
			closeByDocument: false,
			scope: $scope
		});
	};

	/*
  *Function to open adjust invoiece dialog
  */
	$scope.clickedEditIconToAdjustInvoice = function (invoiceIndex, transactionIndex) {
		$scope.selectedInvoice = $scope.arDataObj.onHoldList[invoiceIndex];
		$scope.selectedTransaction = $scope.arDataObj.onHoldList[invoiceIndex].debits[transactionIndex];
		// $scope.isManualBalance = $scope.arDataObj.onHoldList[invoiceIndex].is_manual_balance;
		ngDialog.open({
			template: '/assets/partials/companyCard/arTransactions/rvArInvoiceAdjustPopup.html',
			scope: $scope,
			controller: 'RvArInvoiceAdjustController'
		});
	};
	/*
 * Open dialog to post charge
 * @param index - index of the item
 */
	$scope.clickedPostCharge = function (index) {
		$scope.selectedItemToPostCharge = $scope.arDataObj.onHoldList[index];
		ngDialog.open({
			template: '/assets/partials/companyCard/arTransactions/rvArTransactionPostCharge.html',
			controller: 'RvArPostChargeController',
			scope: $scope
		});
	};

	/* 
  *	CICO-50150 : Handle Move To Credit actions.
  *	@param {object} [balance data object]
  *	@return {undefined}
  */
	$scope.moveToCreditButtonClicked = function (item) {

		$scope.callAPI(rvAccountsArTransactionsSrv.moveToCreditInvoice, {
			params: {
				'invoice_id': item.transaction_id,
				'account_id': $scope.arDataObj.accountId,
				'amount': item.amount
			},
			successCallBack: function successCallBack() {
				$scope.$emit('REFRESH_BALANCE_LIST');
			},
			failureCallBack: function failureCallBack(errorMessage) {
				$scope.$emit('SHOW_ERROR_MSG', errorMessage);
			}
		});
	};
}]);