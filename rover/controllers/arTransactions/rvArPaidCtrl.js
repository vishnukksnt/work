'use strict';

sntRover.controller('RvArPaidController', ['$scope', '$timeout', 'RVCompanyCardSrv', 'rvAccountsArTransactionsSrv', '$vault', '$stateParams', '$state', 'sntActivity', 'ngDialog', function ($scope, $timeout, RVCompanyCardSrv, rvAccountsArTransactionsSrv, $vault, $stateParams, $state, sntActivity, ngDialog) {

	BaseCtrl.call(this, $scope);

	var scrollOptions = { preventDefaultException: { tagName: /^(INPUT|LI)$/ }, preventDefault: false };

	$scope.setScroller('paid-list', scrollOptions);
	var refreshScroll = function refreshScroll() {
		$timeout(function () {
			$scope.refreshScroller('paid-list');
		}, 700);
	};

	// Refresh scroll after completing fetch data
	$scope.$on("FETCH_COMPLETE_PAID_LIST", function () {
		refreshScroll();
	});

	// Handle paid tab expansion api call.
	var callExpansionAPI = function callExpansionAPI(item) {
		sntActivity.start('EXPAND_PAID');
		var successCallbackOfExpansionAPI = function successCallbackOfExpansionAPI(data) {
			sntActivity.stop('EXPAND_PAID');
			item.active = true;
			item.debits = data.debits;
			item.payments = data.payments;
			refreshScroll();
		},
		    failureCallbackOfExpansionAPI = function failureCallbackOfExpansionAPI(errorMessage) {
			sntActivity.stop('EXPAND_PAID');
			$scope.$emit('SHOW_ERROR_MSG', errorMessage);
		};

		var dataToSend = {
			'id': item.transaction_id,
			'account_id': $scope.arDataObj.accountId
		};

		$scope.invokeApi(rvAccountsArTransactionsSrv.expandPaidAndUnpaidList, dataToSend, successCallbackOfExpansionAPI, failureCallbackOfExpansionAPI);
	};

	// Handle Toggle button click to expand list item
	$scope.clickedPaidListItem = function (index) {
		var clikedItem = $scope.arDataObj.paidList[index];

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

		var item = $scope.arDataObj.paidList[index];

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
					isFromArTab: 'paid-bills'
				});
			} else if (associatedType === 'PostingAccount') {
				$state.go('rover.accounts.config', {
					id: associatedId,
					activeTab: 'ACCOUNT',
					isFromArTransactions: true,
					isFromArTab: 'paid-bills'
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
			$scope.$emit('REFRESH_PAID_BILLS');
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
					$scope.errorMessage = errorMessage;
				}
			});
		} else {
			// If the flag for toggle is true, then it is simply reverted to hide the data.
			item.isExpanded = false;
			refreshScroll();
		}
	};
}]);