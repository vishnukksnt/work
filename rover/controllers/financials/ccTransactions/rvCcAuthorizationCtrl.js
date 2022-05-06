'use strict';

sntRover.controller('RVccAuthorizationController', ['$scope', '$filter', '$stateParams', 'ngDialog', '$rootScope', 'RVccTransactionsSrv', '$timeout', '$state', function ($scope, $filter, $stateParams, ngDialog, $rootScope, RVccTransactionsSrv, $timeout, $state) {

	BaseCtrl.call(this, $scope);
	$scope.setScroller('authorization-scroll', {});

	var fetchAuthData = function fetchAuthData() {
		var fetchAuthDataSuccess = function fetchAuthDataSuccess(data) {
			$scope.data.authData = data;
			refreshAuthorizationScroll();
		};
		var options = {
			successCallBack: fetchAuthDataSuccess
		};

		$scope.callAPI(RVccTransactionsSrv.fetchAuthData, options);
	};

	var refreshAuthorizationScroll = function refreshAuthorizationScroll() {
		setTimeout(function () {
			$scope.refreshScroller('authorization-scroll');
		}, 500);
	};

	// Do not call auth fetch API, if we are coming back from Stay Card.
	if ($stateParams.isRefresh || $scope.previousState && $scope.previousState.name !== "rover.reservation.staycard.reservationcard.reservationdetails") {
		fetchAuthData();
	} else {
		refreshAuthorizationScroll();
	}

	$scope.$on('mainTabSwiched', function () {
		if ($scope.data.activeTab === 1) {
			refreshAuthorizationScroll();
		}
	});

	$scope.clickedApprovedTab = function () {
		if (isEmptyObject($scope.data.authData.approved)) {
			return false;
		}
		$scope.data.authData.approved.active = !$scope.data.authData.approved.active;
		refreshAuthorizationScroll();
	};

	$scope.clickedDeclinedTab = function () {
		if (isEmptyObject($scope.data.authData.declined)) {
			return false;
		}
		$scope.data.authData.declined.active = !$scope.data.authData.declined.active;
		refreshAuthorizationScroll();
	};

	$scope.clickedReversalsTab = function () {
		if (isEmptyObject($scope.data.authData.reversals)) {
			return false;
		}
		$scope.data.authData.reversals.active = !$scope.data.authData.reversals.active;
		refreshAuthorizationScroll();
	};

	$scope.clickedApprovedTransactionItem = function (item) {
		if (item.cc_transactions.length === 0) {
			return false;
		}
		item.active = !item.active;
		refreshAuthorizationScroll();
	};

	$scope.clickedDeclinedTransactionItem = function (item) {
		if (item.cc_transactions.length === 0) {
			return false;
		}
		item.active = !item.active;
		refreshAuthorizationScroll();
	};

	$scope.clickedReversalTransactionItem = function (item) {
		if (item.cc_transactions.length === 0) {
			return false;
		}
		item.active = !item.active;
		refreshAuthorizationScroll();
	};
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