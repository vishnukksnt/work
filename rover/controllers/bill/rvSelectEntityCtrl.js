sntRover.controller('rvSelectEntityCtrl', ['$scope', '$rootScope', '$filter', 'RVBillinginfoSrv', 'ngDialog', 'RVCompanyCardSearchSrv', 'RVSearchSrv', '$timeout', function($scope, $rootScope, $filter, RVBillinginfoSrv, ngDialog, RVCompanyCardSearchSrv, RVSearchSrv, $timeout) {
	BaseCtrl.call(this, $scope);

	$scope.textInQueryBox = "";
  	$scope.isReservationActive = true;
  	$scope.results.accounts = [];
	$scope.results.posting_accounts  = [];
	$scope.results.reservations = [];
	$scope.showPagination = false;

  	var scrollerOptions = {click: true, preventDefault: false};

    $scope.setScroller('cards_search_scroller', scrollerOptions);
    $scope.setScroller('res_search_scroller', scrollerOptions);
    $scope.refreshScroller('cards_search_scroller');
	$scope.refreshScroller('res_search_scroller');
	$scope.paginationData = {
		'page': 1,
		'perPage': 10,
		'totalCount': 0
		};
	$scope.paginationAccData = {
		'page': 1,
		'perPage': 10,
		'totalCount': 0
		};
	

    var scrollerOptions = { preventDefault: false};

    $scope.setScroller('entities', scrollerOptions);

    setTimeout(function() {
        $scope.refreshScroller('entities');
        },
    500);

    $scope.hasArNumber = false;

    /**
    * Single digit search done based on the settings in admin
    * The single digit search is done only for numeric characters.
    * CICO-10323
    */
    var isSearchOnSingleDigit = function(searchTerm) {
    	if ($rootScope.isSingleDigitSearch) {
    		return isNaN(searchTerm);
    	} else {
    		return true;
    	}
	};
	
	$scope.filterArAccounts = function() {
		$scope.hasArNumber = !$scope.hasArNumber;
		$scope.paginationAccData = {
			'page': 1,
			'perPage': 10,
			'totalCount': 0
			};
		var dataDict = {
			'page': $scope.paginationAccData.page,
			'per_page': $scope.paginationAccData.perPage,
			'query': $scope.textInQueryBox.trim(),
			'is_from_bill_routing': true,
			'has_ar_number': $scope.hasArNumber};

	    $scope.invokeApi(RVCompanyCardSearchSrv.fetch, dataDict, searchSuccessCards);	
	};
    /**
  	* function to perform filtering/request data from service in change event of query box
  	*/
	$scope.queryEntered = function() {
		if (!$scope.hasArNumber && $scope.textInQueryBox.length < 3 && isSearchOnSingleDigit($scope.textInQueryBox)) {
			$scope.results.accounts = [];
			$scope.results.posting_accounts  = [];
			$scope.results.reservations = [];
		}
		else {
	    	($scope.isReservationActive) ? displayFilteredResultsReservations() : displayFilteredResultsCards();
	   	}
	   	var queryText = $scope.textInQueryBox;

	   	$scope.textInQueryBox = queryText.charAt(0).toUpperCase() + queryText.slice(1);
  	};
  	/**
  	* function to clear the entity search text
  	*/
	$scope.clearResults = function() {
		$scope.textInQueryBox = "";
		$scope.showPagination = false;
		$scope.isReservationActive = true;
	  	$scope.refreshScroller('entities');
	};
  	var searchSuccessCards = function(data) {
		$scope.$emit("hideLoader");
		$scope.results.accounts = [];
		$scope.results.accounts = data.accounts;
		$scope.results.posting_accounts = [];
		$scope.results.posting_accounts = data.posting_accounts;
		$scope.totalCards = angular.copy(data.total_count);
		$scope.paginationAccData.totalCount = data.total_count;
		$scope.showPagination = $scope.isShowPagination();
		$timeout(function() {
			$scope.$broadcast('updatePagination', 'ACC_PAGINATION');
        }, 100);    
        setTimeout(function() {
            $scope.refreshScroller('cards_search_scroller');
        }, 750);
	};
  	/**
  	* function to perform filering on results.
  	* if not fouund in the data, it will request for webservice
  	*/
  	var displayFilteredResultsCards = function( pageNo ) {
		$scope.paginationAccData.page = pageNo || 1;
		var dataDict = {
			'page': $scope.paginationAccData.page,
			'per_page': $scope.paginationAccData.perPage,
			'query': $scope.textInQueryBox.trim(),
			'is_from_bill_routing': true,
			'has_ar_number': $scope.hasArNumber};

	    $scope.invokeApi(RVCompanyCardSearchSrv.fetch, dataDict, searchSuccessCards);	      
  	};

  	/**
	* remove the parent reservation from the search results
	*/
	$scope.excludeActivereservationFromsSearch = function() {
		var filteredResults = [];

	  	for (var i = 0; i < $scope.results.reservations.length; i++) {
            // CICO-26728 Added the future reservations as well in the search results
	  		if (($scope.results.reservations[i].id !== $scope.reservationData.reservation_id) && ($scope.results.reservations[i].reservation_status === 'CHECKING_IN' || $scope.results.reservations[i].reservation_status === 'CHECKEDIN' || $scope.results.reservations[i].reservation_status === 'CHECKING_OUT' || $scope.results.reservations[i].reservation_status === 'RESERVED')) {

	  			filteredResults.push($scope.results.reservations[i]);
	  		}
  		}
  		$scope.results.reservations = filteredResults;
	};

	/**
	* Success call back of data fetch from webservice
	*/
	var searchSuccessReservations = function(data) {
        $scope.$emit('hideLoader');
        $scope.results.reservations = [];
		$scope.results.reservations = data.results;
		$scope.paginationData.totalCount = data.total_count;
		$scope.totalReservation = data.total_count;
		$scope.showPagination = $scope.isShowPagination();
		if ($scope.billingEntity !== "TRAVEL_AGENT_DEFAULT_BILLING" &&
                $scope.billingEntity !== "COMPANY_CARD_DEFAULT_BILLING" &&
                $scope.billingEntity !== "GROUP_DEFAULT_BILLING" &&
                $scope.billingEntity !== "ALLOTMENT_DEFAULT_BILLING") {

				$scope.excludeActivereservationFromsSearch();
		}
		$timeout(function() {
			$scope.$broadcast('updatePagination', 'RES_PAGINATION');
        }, 100); 
        setTimeout(function() {
            $scope.refreshScroller('res_search_scroller');
        }, 750);
	};

	/**
	* failure call back of search result fetch
	*/
	var failureCallBackofDataFetch = function(errorMessage) {
		$scope.$emit('hideLoader');
		$scope.errorMessage = errorMessage;
	};
	/**
  	* function to perform filering on results for reservations.
  	* if not fouund in the data, it will request for webservice
  	*/
	var displayFilteredResultsReservations = function() {
	    fetchSearchResults();	    
	};

	var fetchSearchResults = function( pageNo ) {
		$scope.paginationData.page = pageNo || 1;
		var dataDict = {
			'page': $scope.paginationData.page,
			'per_page': $scope.paginationData.perPage,
			'is_from_bill_routing': true,
			'query': $scope.textInQueryBox.trim()
		};
		
		dataDict.is_from_bill_routing = true;

		if ($rootScope.isSingleDigitSearch && !isNaN($scope.textInQueryBox) && $scope.textInQueryBox.length < 3) {
			dataDict.room_search = true;
		}
		$scope.invokeApi(RVSearchSrv.fetchReservationForBillingInfo, dataDict, searchSuccessReservations, failureCallBackofDataFetch);
	};

	// Toggle between Reservations , Cards
	$scope.toggleClicked = function(flag) {
		$scope.isReservationActive = flag;
		($scope.isReservationActive) ? displayFilteredResultsReservations() : displayFilteredResultsCards();
	};

	// Setting pagination object for reaservation
    $scope.reservationPaginationObj = {
        id: 'RES_PAGINATION',
        api: fetchSearchResults,
        perPage: $scope.paginationData.perPage
	};
	
	// Setting pagination object for accounts
    $scope.accountsPaginationObj = {
        id: 'ACC_PAGINATION',
        api: displayFilteredResultsCards,
        perPage: $scope.paginationAccData.perPage
	};

	/* 	Is show pagination tab
	 *	@return { boolean } 
	 */
	$scope.isShowPagination = function() {
		$scope.showPagination = false;
		var searchResult = $scope.results;
		if ($scope.isReservationActive ) {
				return searchResult.reservations && $scope.textInQueryBox && searchResult.reservations.length < $scope.totalReservation && searchResult.reservations.length > 0;
			} else  {
				var totalCardsLength = searchResult.accounts.length + searchResult.posting_accounts.length;
				return (searchResult.accounts || searchResult.posting_accounts) && $scope.textInQueryBox && totalCardsLength < $scope.totalCards &&  totalCardsLength > 0;
			}
	};

}]);