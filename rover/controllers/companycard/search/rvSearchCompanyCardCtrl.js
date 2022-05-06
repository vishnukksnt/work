'use strict';

angular.module('sntRover').controller('searchCompanyCardController', ['$scope', 'RVCompanyCardSearchSrv', '$stateParams', 'ngDialog', '$timeout', 'RVCompanyCardSrv', '$state', 'rvPermissionSrv', function ($scope, RVCompanyCardSearchSrv, $stateParams, ngDialog, $timeout, RVCompanyCardSrv, $state, rvPermissionSrv) {
	var transitionParams = null;

	var filterValues = {
		ALL: 'ALL',
		AR_ONLY: 'AR_ONLY'
	};

	var COMPANY_CARD_SCROLL = 'company_card_scroll',
	    PER_PAGE = 50;

	BaseCtrl.call(this, $scope);
	$scope.heading = "Find Cards";

	$scope.hasArNumber = false;
	$scope.$emit("updateRoverLeftMenu", "cards");

	var applyPreviousSelections = function applyPreviousSelections() {
		if (transitionParams && transitionParams.selectedIds && transitionParams.selectedIds.length > 0) {
			$scope.results.forEach(function (card) {
				var selectedCard = _.find(transitionParams.selectedIds, { id: card.id });

				if (selectedCard) {
					card.selected = true;
					card.isPrimary = selectedCard.isPrimary;
					if (card.isPrimary) {
						$scope.viewState.selectedPrimaryCard = card;
					}
				}
			});
		}
		transitionParams = null;
	},

	// Marks the card as already selected if it is added to merge cards screen
	markAlreadySelectedCards = function markAlreadySelectedCards() {
		if ($scope.viewState.selectedCardsForMerge.length > 0) {
			$scope.results.forEach(function (card) {
				var selectedCard = _.find($scope.viewState.selectedCardsForMerge, { id: card.id });

				if (selectedCard) {
					card.selected = true;
					card.isPrimary = selectedCard.isPrimary;
					if (card.isPrimary) {
						$scope.viewState.selectedPrimaryCard = card;
					}
				}
			});
		}
	};

	/**
  * function used for refreshing the scroller
  */
	// setting the scroller for view
	var scrollerOptions = {
		tap: true,
		preventDefault: false,
		deceleration: 0.0001,
		shrinkScrollbars: 'clip'
	};

	$scope.setScroller(COMPANY_CARD_SCROLL, scrollerOptions);

	var refreshScroller = function refreshScroller() {
		if ($scope.myScroll && $scope.myScroll.hasOwnProperty(COMPANY_CARD_SCROLL)) {
			$scope.myScroll[COMPANY_CARD_SCROLL].scrollTo(0, 0, 100);
		}
		$timeout(function () {
			$scope.refreshScroller(COMPANY_CARD_SCROLL);
		}, 300);
	};

	// function that converts a null value to a desired string.
	// if no replace value is passed, it returns an empty string

	$scope.escapeNull = function (value, replaceWith) {
		var newValue = "";

		if (typeof replaceWith !== "undefined" && replaceWith !== null) {
			newValue = replaceWith;
		}
		var valueToReturn = value === null || typeof value === 'undefined' ? newValue : value;

		return valueToReturn;
	};

	var debounceSearchDelay = 600;

	/**
  * function to perform filtering/request data from service in change event of query box
  */
	$scope.queryEntered = _.debounce(function () {
		if ($scope.textInQueryBox.length < 3) {
			$scope.results = [];
			refreshScroller();
		} else {
			displayFilteredResults();
		}
		var queryText = $scope.textInQueryBox;

		$scope.textInQueryBox = queryText.charAt(0).toUpperCase() + queryText.slice(1);
	}, debounceSearchDelay);

	$scope.clearResults = function () {
		$scope.textInQueryBox = "";
		$scope.results = [];
	};

	/**
  * Get request params for the accounts search
  */
	var getRequestParams = function getRequestParams() {
		var dataDict = {
			'query': $scope.textInQueryBox.trim(),
			'per_page': $scope.perPage,
			'page': $scope.page
		};

		dataDict.has_ar_number = false;
		if ($scope.cardFilter === filterValues.AR_ONLY) {
			dataDict.has_ar_number = true;
		}

		if (!$scope.viewState.isViewSelected) {
			dataDict.account_type = 'COMPANY';
			if (!$scope.viewState.isCompanyCardSelected) {
				dataDict.account_type = 'TRAVELAGENT';
			}
		}

		return dataDict;
	};

	/*
 * to Search for companycards
 * @return - None
 */
	$scope.search = function (page) {
		$scope.page = page || 1;
		$scope.errorMessage = '';

		var options = {
			params: getRequestParams(),
			successCallBack: successCallBackOfSearch,
			failureCallBack: failureCallBackOfSearch
		};

		$scope.callAPI(RVCompanyCardSearchSrv.fetch, options);
	};

	/*
 * on success of search API
 * @param {Array} - array of objects - accounts
 * @return {None}
 */
	var successCallBackOfSearch = function successCallBackOfSearch(data) {
		$scope.results = data.accounts;
		applyPreviousSelections();
		markAlreadySelectedCards();

		// total result count
		$scope.totalResultCount = data.total_count;
		$timeout(function () {
			$scope.$broadcast('updatePagination', 'COMPANYCARD_SEARCH');
			refreshScroller();
		}, 800);
	},


	/*
 * on success of search API
 * @param {Array} - error messages
 * @return {None}
 */
	failureCallBackOfSearch = function failureCallBackOfSearch(error) {
		$scope.errorMessage = error;
	};

	/**
  * function to perform filering on results.
  * if not fouund in the data, it will request for webservice
  */
	var displayFilteredResults = function displayFilteredResults() {
		if (!$scope.textInQueryBox.length) {
			// based on 'is_row_visible' parameter we are showing the data in the template
			for (var i = 0; i < $scope.results.length; i++) {
				$scope.results[i].is_row_visible = true;
			}

			// we have changed data, so we are refreshing the scrollerbar
			refreshScroller();
		} else {
			var value = "";
			var visibleElementsCount = 0;
			// searching in the data we have, we are using a variable 'visibleElementsCount' to track matching
			// if it is zero, then we will request for webservice

			for (var i = 0; i < $scope.results.length; i++) {
				value = $scope.results[i];
				if ($scope.escapeNull(value.account_first_name).toUpperCase().indexOf($scope.textInQueryBox.toUpperCase()) >= 0 || $scope.escapeNull(value.account_last_name).toUpperCase().indexOf($scope.textInQueryBox.toUpperCase()) >= 0) {
					$scope.results[i].is_row_visible = true;
					visibleElementsCount++;
				} else {
					$scope.results[i].is_row_visible = false;
				}
			}
			// last hope, we are looking in webservice.
			if (visibleElementsCount === 0) {
				$scope.search();
			}
			// we have changed data, so we are refreshing the scrollerbar
			refreshScroller();
		}
	};

	// To impelement popup to select add new - COMPANY / TRAVEL AGENT CARD
	$scope.addNewCard = function () {
		ngDialog.open({
			template: '/assets/partials/companyCard/rvSelectCardType.html',
			controller: 'selectCardTypeCtrl',
			className: 'ngdialog-theme-default1 calendar-single1',
			closeByDocument: false,
			scope: $scope
		});
	};

	// While coming back to search screen from DISCARD button
	if ($stateParams.textInQueryBox) {
		$scope.textInQueryBox = $stateParams.textInQueryBox;
		$scope.queryEntered();
	}

	/**
  * Handles the switching between merge and normal search view
  */
	$scope.onViewChange = function () {
		if (!$scope.viewState.isViewSelected) {
			$scope.viewState.isCompanyCardSelected = true;
		}
		$scope.$broadcast('RESET_SELECTIONS_FOR_MERGE');
		$scope.viewState.canMerge = null;
		$scope.queryEntered();
	};

	/**
  * Handles the selection of cards for merge from the search results
  * @param {Object} card - contains the details of CC/TA card
  * @return {void}
  */
	$scope.onCardSelection = function (card) {
		if ($scope.viewState.selectedCardsForMerge.length === 0 && card.selected) {
			card.isPrimary = true;
			$scope.viewState.selectedPrimaryCard = card;
		}

		if (card.selected) {
			$scope.viewState.selectedCardsForMerge.push(card);
		} else {
			var isCardPrimary = card.isPrimary;

			$scope.viewState.selectedCardsForMerge = _.reject($scope.viewState.selectedCardsForMerge, function (selectedCard) {

				if (selectedCard.id === card.id) {
					card.isPrimary = false;
					if (isCardPrimary) {
						$scope.viewState.selectedPrimaryCard = {};
					}
				}
				return selectedCard.id === card.id;
			});

			if (isCardPrimary && $scope.viewState.selectedCardsForMerge.length > 0) {
				$scope.viewState.selectedCardsForMerge[0].isPrimary = true;
				$scope.viewState.selectedPrimaryCard = $scope.viewState.selectedCardsForMerge[0];
			}
		}
		$scope.$broadcast('REFRESH_SELECTED_CARDS_FOR_MERGE_SCROLLER');
	};

	/**
  * Handles the switch between cc/ta views
  */
	$scope.onTravelAgentCompanyCardSwitch = function () {
		$scope.$broadcast('RESET_SELECTIONS_FOR_MERGE');
		$scope.results = [];
		$scope.viewState.canMerge = null;
		$scope.queryEntered();
	};

	/**
  * 
  * @param {Number} id identifier for the card
  * @param {String} accountType CC/TA
  * @return {void}
  */
	$scope.navigateToDetails = function (id, accountType) {
		if ($scope.viewState.hasInitiatedMergeVerification) {
			return false;
		}

		$state.go('rover.companycarddetails', {
			id: id,
			type: accountType,
			query: $scope.textInQueryBox,
			selectedIds: $scope.viewState.selectedCardsForMerge || [],
			isMergeViewSelected: !$scope.viewState.isViewSelected,
			activeSubView: $scope.viewState.isCompanyCardSelected ? 'CC' : 'TA',
			cardType: $scope.cardFilter
		});
	};

	var singleRateName = '';

	/**
  * Function to return the single rate's name is any
  * @return {String}
  */
	$scope.getRateName = function () {
		return singleRateName;
	};

	/**
  * Function to check if multiple rates exists on any of the contracts
  * @param {Object} account the account object
  * @return {Boolean}
  */
	$scope.ratesCount = function (account) {
		var rateCount = false;

		if (account.current_contracts && account.current_contracts.length !== 0) {
			angular.forEach(account.current_contracts, function (contract) {
				if (contract.contract_rates.length !== 0) {
					rateCount += contract.contract_rates.length;
					singleRateName = contract.contract_rates[0].rate_name;
				}
			});
		}
		return rateCount;
	};

	/**
  *  Get style class for the pagination control
  */
	$scope.getStyleClasses = function () {
		var styleClasses = '';

		if (!$scope.viewState.isViewSelected && ($scope.results.length > 0 || $scope.viewState.selectedCardsForMerge.length > 0)) {
			styleClasses = 'show-merge';
		}

		return styleClasses;
	};

	// Initialize the co/ta search view
	var init = function init() {
		// model used in query textbox, we will be using this across
		$scope.textInQueryBox = "";
		$scope.results = [];
		$scope.cardFilter = filterValues.ALL;
		$scope.viewState = {
			isViewSelected: true,
			isCompanyCardSelected: true,
			selectedCardsForMerge: [],
			selectedPrimaryCard: {},
			mergeStatusText: '',
			hasInitiatedMergeVerification: false,
			mergeStatusErrors: {}
		};

		transitionParams = $state.transition && $state.transition.params('from');

		if (transitionParams && transitionParams.isMergeViewSelected) {
			$scope.viewState.isViewSelected = !transitionParams.isMergeViewSelected;
			$scope.textInQueryBox = transitionParams.query;
			$scope.viewState.isCompanyCardSelected = transitionParams.activeSubView === 'CC';
			$scope.cardFilter = transitionParams.cardType;
			$scope.viewState.selectedCardsForMerge = transitionParams.selectedIds;
			$scope.queryEntered();
		}
		$scope.hasMergeViewPermission = rvPermissionSrv.getPermissionValue('MERGE');

		$scope.perPage = PER_PAGE;
		$scope.companyCardSearchPagination = {
			id: 'COMPANYCARD_SEARCH',
			api: $scope.search,
			perPage: $scope.perPage
		};

		$scope.hasCompanyCardCreatePermission = rvPermissionSrv.getPermissionValue('CREATE_COMPANY_CARD');
		$scope.hasTravelAgentCreatePermission = rvPermissionSrv.getPermissionValue('CREATE_TRAVEL_AGENT_CARD');
	};

	init();
}]);