'use strict';

angular.module('sntRover').controller('rvCardContractsMainCtrl', ['rvPermissionSrv', '$rootScope', '$scope', 'rvCompanyCardContractsSrv', '$stateParams', '$timeout', function (rvPermissionSrv, $rootScope, $scope, rvCompanyCardContractsSrv, $stateParams, $timeout) {

	BaseCtrl.call(this, $scope);

	/**
  * Initialize contract object
  */
	var init = function init() {
		$scope.contractData = {
			mode: '',
			contractsList: [],
			editData: {},
			disableFields: false,
			isPastContract: false,
			noContracts: true,
			selectedContractId: '',
			rateSearchResult: [],
			rateSearchQuery: '',
			selectedRateList: [],
			selectedRateIdList: [],
			accountId: '',
			hasEditAccessCodePermission: rvPermissionSrv.getPermissionValue('EDIT_CONTRACT_ACCESS_CODE'),
			hasDeleteContractPermission: rvPermissionSrv.getPermissionValue('DELETE_CONTRACT'),
			linkContractsSearch: {
				query: '',
				results: []
			},
			contractOwner: {
				results: [],
				isInactive: false,
				selectedOwner: {
					id: null
				}
			}
		};
	},
	    that = this;

	/**
  * Function to set error message
  * @param {Array} data - error list
  * @returns void
  */
	var setErrorMessage = function setErrorMessage(data) {
		$scope.errorMessage = data;
	};

	/**
  * function to set the contractsList object
  * @param {Array} currentContracts - array of present contracts
  * @param {Array} futureContracts
  * @param {Array} pastContracts
  * @returns void
  */
	var setSideListCount = function setSideListCount(currentContracts, futureContracts, pastContracts) {
		$scope.contractData.contractsList = [{
			contracts: futureContracts,
			type: 'FUTURE',
			count: futureContracts.length
		}, {
			contracts: currentContracts,
			type: 'CURRENT',
			count: currentContracts.length
		}, {
			contracts: pastContracts,
			type: 'PAST',
			count: pastContracts.length
		}];
	},

	/**
  * success callback for fetch contracts
  * @param {Object} - accepts the API response as parameter
  * @return void
  */
	fetchContractsListSuccessCallback = function fetchContractsListSuccessCallback(data, params) {
		var currentContracts = data.current_contracts || [],
		    pastContracts = data.history_contracts || [],
		    futureContracts = data.future_contracts || [];

		setErrorMessage([]);
		setSideListCount(currentContracts, futureContracts, pastContracts);

		if (currentContracts.length !== 0 || pastContracts.length !== 0 || futureContracts.length !== 0) {
			if (params.action === 'UNLINK' || $scope.contractData.selectedContractId === '') {
				$scope.contractData.selectedContractId = data.contract_selected || '';
			}
			$scope.contractData.mode = 'EDIT';
			$scope.contractData.noContracts = false;
			that.fetchContractDetails($scope.contractData.selectedContractId);
		} else {
			// Reset the data object
			init();
		}
		if ($scope.contractData.selectedContractId !== '' && $scope.contractData.mode !== '') {
			refreshContractScrollers();
		}
	},

	/**
  * Success callback for contract detail fetch
  * @param {Object} data - API response of detail fetch
  */
	fetchContractDetailsSuccessCallback = function fetchContractDetailsSuccessCallback(data) {
		$scope.contractData.contractOwner.results = data.ownersList;
		setErrorMessage([]);
		$scope.contractData.editData = data.contractDetails;
		$scope.contractData.selectedRateList = data.contractDetails.contract_rates;
		$scope.contractData.disableFields = data.contractDetails.end_date < $rootScope.businessDate || !data.contractDetails.is_master_contract;
		$scope.contractData.isPastContract = data.contractDetails.end_date < $rootScope.businessDate;
		$scope.$broadcast('addDataReset');
		$scope.$broadcast('refreshEditScroller');

		$timeout(function () {
			if (data.contractDetails.selected_contract_owner !== null) {
				var owner = data.contractDetails.selected_contract_owner;

				$scope.contractData.contractOwner.selectedOwner.id = owner.id.toString();
				$scope.contractData.contractOwner.selectedOwner.name = owner.name ? owner.name : 'No contract owner';
				$scope.contractData.contractOwner.isInactive = !owner.is_active;
			} else {
				$scope.contractData.contractOwner.selectedOwner.id = null;
				$scope.contractData.contractOwner.selectedOwner.name = 'No contract owner';
				$scope.contractData.contractOwner.isInactive = false;
			}
		}, 100);
	},

	/**
  * Failure callback for contracts detail fetch
  * @param {Array} error - array of errors
  */
	fetchContractDetailsFailureCallback = function fetchContractDetailsFailureCallback(error) {
		setErrorMessage(error);
		$scope.$broadcast('addDataReset');
	};

	/**
  * Function to fetch the currently selected contract details
  */
	that.fetchContractDetails = function (contractId) {
		var accountId = !_.isEmpty($scope.contactInformation) ? $scope.contactInformation.id : $stateParams.id;

		$scope.contractData.selectedContractId = contractId;
		var options = {
			successCallBack: fetchContractDetailsSuccessCallback,
			failureCallback: fetchContractDetailsFailureCallback,
			params: {
				"account_id": accountId,
				"contract_id": contractId
			}
		};

		$scope.callAPI(rvCompanyCardContractsSrv.fetchDetailsWithOwnersList, options);
	};
	/*
  * Failure callback for contracts fetch API
  * @param {String} response - error message
  * @return void
  */
	var fetchContractsListFailureCallback = function fetchContractsListFailureCallback(response) {
		setErrorMessage(response);
	};

	/**
  * Function fetches the contracts on page load
  */
	that.fetchContracts = function (action) {
		$scope.contractData.accountId = !_.isEmpty($scope.contactInformation) ? $scope.contactInformation.id : $stateParams.id;
		var options = {
			successCallBack: fetchContractsListSuccessCallback,
			failureCallBack: fetchContractsListFailureCallback,
			successCallBackParameters: {
				'action': action
			},
			params: {
				"account_id": $scope.contractData.accountId
			}
		};

		if (!!$scope.contractData.accountId) {
			$scope.callAPI(rvCompanyCardContractsSrv.fetchContractsList, options);
		}
	};

	/**
  * Refresh the appropriate scroller based on mode
  */
	var refreshContractScrollers = function refreshContractScrollers() {
		if ($scope.contractData.mode === 'ADD') {
			$scope.$broadcast('refreshAddScroller');
		} else if ($scope.contractData.mode === 'EDIT') {
			$scope.$broadcast('refreshEditScroller');
			$scope.$broadcast('initContractsList');
		}
	};

	/**
  * Listener to call on new contracts form closure
  */
	$scope.addListener('fetchContractsList', function (event, action) {
		that.fetchContracts(action);
	});

	/**
  * Listener for fetch event from the contract list 
  */
	$scope.addListener('fetchContract', function (event, data) {
		that.fetchContractDetails(data);
	});
	/*	
  * Listener for displaying error message
  */
	$scope.addListener('setErrorMessage', function (event, data) {
		setErrorMessage(data);
	});
	/**
  * Listener for refreshing appropriate scrollers
  */
	$scope.addListener('refreshContractsScroll', refreshContractScrollers);

	/**
  * Listener for updating contracted nights
  */
	$scope.addListener('updateContractedNights', function (event, data) {
		var saveContractNightsSuccessCallback = function saveContractNightsSuccessCallback() {
			setErrorMessage([]);
		},
		    saveContractNightsFailureCallback = function saveContractNightsFailureCallback(error) {
			setErrorMessage(error);
		},
		    accountId = !_.isEmpty($scope.contactInformation) ? $scope.contactInformation.id : $stateParams.id,
		    options = {
			successCallBack: saveContractNightsSuccessCallback,
			failureCallBack: saveContractNightsFailureCallback,
			params: {
				"account_id": accountId,
				"contract_id": $scope.contractData.selectedContractId,
				"postData": { 'occupancy': data }
			}
		};

		$scope.callAPI(rvCompanyCardContractsSrv.updateNight, options);
	});

	/**
  * Function to load the new contracts form
  */
	$scope.createFirstContract = function () {
		$scope.contractData.mode = 'ADD';
		refreshContractScrollers();
	};

	/**
  * Function to load Link Contracts screen.
  */
	$scope.moveToLinkContract = function () {
		$scope.contractData.mode = 'LINK';
		refreshContractScrollers();
	};

	init();
	that.fetchContracts();
}]);