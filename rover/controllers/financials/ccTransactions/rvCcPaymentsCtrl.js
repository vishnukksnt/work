'use strict';

sntRover.controller('RVccPaymentsController', ['$scope', '$filter', '$stateParams', 'ngDialog', '$rootScope', 'RVccTransactionsSrv', '$timeout', '$state', function ($scope, $filter, $stateParams, ngDialog, $rootScope, RVccTransactionsSrv, $timeout, $state) {

	BaseCtrl.call(this, $scope);

	$rootScope.manualCCEnabled = $rootScope.hotelDetails.payment_gateway === 'SHIJI' && $rootScope.hotelDetails.shiji_token_enable_offline;

	$scope.setScroller('payment_content', {});
	var refreshPaymentScroll = function refreshPaymentScroll() {
		setTimeout(function () {
			$scope.refreshScroller('payment_content');
		}, 500);
	};

	refreshPaymentScroll();

	var initPaymentData = function initPaymentData() {
		var successCallBackFetchPaymentData = function successCallBackFetchPaymentData(data) {
			$scope.data.paymentData = {};
			$scope.data.paymentData = data;
			$scope.errorMessage = "";
			$scope.$emit('hideLoader');
			refreshPaymentScroll();
		};

		$scope.invokeApi(RVccTransactionsSrv.fetchPayments, { "date": $scope.data.transactionDate }, successCallBackFetchPaymentData);
	};

	// Do not call fetch payment API, if we are coming back from Stay Card.
	if ($stateParams.isRefresh || $scope.previousState && $scope.previousState.name !== "rover.reservation.staycard.reservationcard.reservationdetails") {
		initPaymentData();
	} else {
		refreshPaymentScroll();
	}

	// Handle change transaction date
	$scope.$on('transactionDateChanged', function () {
		initPaymentData();
	});

	// Handle error message from parent
	$scope.$on('showErrorMessage', function (event, data) {
		$scope.errorMessage = data;
	});

	$scope.clickedApprovedTab = function () {
		if (isEmptyObject($scope.data.paymentData.approved)) {
			return false;
		}
		$scope.data.paymentData.approved.active = !$scope.data.paymentData.approved.active;
		refreshPaymentScroll();
	};

	$scope.clickedDeclinedTab = function () {
		if (isEmptyObject($scope.data.paymentData.declined)) {
			return false;
		}
		$scope.data.paymentData.declined.active = !$scope.data.paymentData.declined.active;
		refreshPaymentScroll();
	};

	$scope.clickedApprovedTransactionItem = function (item) {
		if (item.cc_transactions.length === 0) {
			return false;
		}
		item.active = !item.active;
		refreshPaymentScroll();
	};

	$scope.clickedDeclinedTransactionItem = function (item) {
		if (item.cc_transactions.length === 0) {
			return false;
		}
		item.active = !item.active;
		refreshPaymentScroll();
	};

	$scope.$on('mainTabSwiched', function () {
		if ($scope.data.activeTab === 0) {
			refreshPaymentScroll();
		}
	});

	/*
  * 	Method to go to stay card.
  *	@params {Number} [reservation id]
  *	@params {String} [reservation no or confirmation no]
  */
	$scope.gotoStayCard = function (reservationId, confirmationId) {
		RVccTransactionsSrv.updateCache($scope.data);
		$state.go('rover.reservation.staycard.reservationcard.reservationdetails', {
			id: reservationId,
			confirmationId: confirmationId,
			isrefresh: true
		});
	};
}]);