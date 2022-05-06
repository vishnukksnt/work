sntRover.controller('rvSearchAndAttachEntityCtrl', ['$scope', '$rootScope', '$filter', 'RVBillinginfoSrv', 'ngDialog', 'RVCompanyCardSearchSrv', 'RVSearchSrv', function($scope, $rootScope, $filter, RVBillinginfoSrv, ngDialog, RVCompanyCardSearchSrv, RVSearchSrv) {
	
	BaseCtrl.call(this, $scope);

	/**
	 * Initialize the controller
	 * @return {undefined}
	 */
	var init = function() {
		$scope.textInQueryBox      = "";
	  	$scope.isReservationActive = true;

	  	// Setting scroller
	  	var scrollerOptions = {click: true, preventDefault: false};

	    $scope.setScroller('cards_search_scroller', scrollerOptions);
	    $scope.setScroller('res_search_scroller', scrollerOptions);
	    $scope.refreshScroller('cards_search_scroller');
	    $scope.refreshScroller('res_search_scroller');

	    var scrollerOptions = { preventDefault: false};

	    $scope.setScroller('entities', scrollerOptions);

	    setTimeout(function() {
	        $scope.refreshScroller('entities');
	    }, 500);
	};

    /**
     * Single digit search done based on the settings in admin
     * The single digit search is done only for numeric characters.
     * CICO-10323
     * @param {String} or {Number} the text in the search box
     * @return {Boolean}
     */
    var isSearchOnSingleDigit = function(searchTerm) {
    	if ($rootScope.isSingleDigitSearch) {
    		return isNaN(searchTerm);
    	} else {
    		return true;
    	}
    };

  	/**
     * Function to perform filtering/request data from service
     * in change event of query box.
     * @return {undefined}
     */
	$scope.queryEntered = function() {
		if ($scope.textInQueryBox.length < 3 && isSearchOnSingleDigit($scope.textInQueryBox)) {
			$scope.searchResults.cards            = [];
			$scope.searchResults.posting_accounts = [];
			$scope.searchResults.reservations     = [];
		}
		else {
	    	displayFilteredResultsCards();
	    	displayFilteredResultsReservations();
	   	}
	   	var queryText = $scope.textInQueryBox;

	   	$scope.textInQueryBox = queryText.charAt(0).toUpperCase() + queryText.slice(1);
  	};

  	/**
     * Function to clear the entity search text.
     * @return {undefined}
     */
	$scope.clearResults = function() {
	  	$scope.textInQueryBox = "";
	  	$scope.refreshScroller('entities');
	};

	/**
	 * Success call back of filtered results fetch.
	 * @return {undefined}
	 */
  	var searchSuccessCards = function(data) {
		$scope.$emit("hideLoader");
		$scope.searchResults.cards            = [];
		$scope.searchResults.cards            = data.accounts;
		$scope.searchResults.posting_accounts = [];
		$scope.searchResults.posting_accounts = data.posting_accounts;

		setTimeout(function() {
			$scope.refreshScroller('cards_search_scroller');
		}, 750);
	};

  	/**
     * Function to perform filering on results.
     * if not found in the data, it will request for webservice.
     * @return {undefined}
     */
  	var displayFilteredResultsCards = function() {

	    // show everything, means no filtering
	    if ($scope.textInQueryBox.length < 3 && isSearchOnSingleDigit($scope.textInQueryBox)) {

			// based on 'is_row_visible' parameter we are showing the data in the template
			for (var i = 0; i < $scope.searchResults.cards.length; i++) {
				$scope.searchResults.cards[i].is_row_visible = true;
			}

			for (var i = 0; i < $scope.searchResults.posting_accounts.length; i++) {
				$scope.searchResults.posting_accounts[i].is_row_visible = true;
			}

			// we have changed data, so we are refreshing the scrollerbar
			$scope.refreshScroller('cards_search_scroller');
	    }
	    else {
			var value = "";
			var visibleElementsCount = 0;

			// searching in the data we have, we are using a variable 'visibleElementsCount' to track matching
			// if it is zero, then we will request for webservice
			for (var i = 0; i < $scope.searchResults.cards.length; i++) {
				value = $scope.searchResults.cards[i];

				if (($scope.escapeNull(value.account_first_name).toUpperCase()).indexOf($scope.textInQueryBox.toUpperCase()) >= 0 ||
				    ($scope.escapeNull(value.account_last_name).toUpperCase()).indexOf($scope.textInQueryBox.toUpperCase()) >= 0 )
				    {
				       $scope.searchResults.cards[i].is_row_visible = true;
				       visibleElementsCount++;
				}
				else {
				  $scope.searchResults.cards[i].is_row_visible = false;
				}
			}

			for (var i = 0; i < $scope.searchResults.posting_accounts.length; i++) {
				value = $scope.searchResults.posting_accounts[i];

				if (($scope.escapeNull(value.account_name).toUpperCase()).indexOf($scope.textInQueryBox.toUpperCase()) >= 0 ) {
					$scope.searchResults.posting_accounts[i].is_row_visible = true;
					visibleElementsCount++;
				}
				else {
					$scope.searchResults.posting_accounts[i].is_row_visible = false;
				}
			}

			// last hope, we are looking in webservice.
			if (visibleElementsCount === 0) {
				var dataDict = {'query': $scope.textInQueryBox.trim()};

				$scope.invokeApi(RVCompanyCardSearchSrv.fetch, dataDict, searchSuccessCards);
			}

			// we have changed data, so we are refreshing the scrollerbar
			$scope.refreshScroller('cards_search_scroller');
	    }
  	};

	/**
     * Function to remove the parent reservation from the search results.
     * @return {undefined}
     */
	var excludeActiveReservationFromsSearch = function() {
		var filteredResults = [];

	  	for (var i = 0; i < $scope.searchResults.reservations.length; i++) {
	  		if (($scope.searchResults.reservations[i].id !== $scope.reservationData.reservation_id) && 
	  			($scope.searchResults.reservations[i].reservation_status === 'CHECKING_IN' || 
	  			$scope.searchResults.reservations[i].reservation_status === 'CHECKEDIN' || 
	  			$scope.searchResults.reservations[i].reservation_status === 'CHECKING_OUT')) {

	  			filteredResults.push($scope.searchResults.reservations[i]);
	  		}
  		}
  		$scope.searchResults.reservations = filteredResults;
	};

	/**
	 * Success call back of data fetch from webservice
	 */
	var searchSuccessReservations = function(data) {
        $scope.$emit('hideLoader');
        $scope.searchResults.reservations = [];
		$scope.searchResults.reservations = data;

		if ($scope.billingEntity !== "TRAVEL_AGENT_DEFAULT_BILLING" &&
            $scope.billingEntity !== "COMPANY_CARD_DEFAULT_BILLING" &&
            $scope.billingEntity !== "GROUP_DEFAULT_BILLING" &&
            $scope.billingEntity !== "ALLOTMENT_DEFAULT_BILLING") {

				excludeActiveReservationFromsSearch();
		}
        setTimeout(function() {
            $scope.refreshScroller('res_search_scroller');
        }, 750);
	};

	/**
	 * failure call back of search result fetch
	 */
	var failureCallBackofDataFetch = function(errorMessage) {
		$scope.$emit('hideLoader');
		$scope.$emit('displayErrorMessage', errorMessage);
	};

  	/**
     * Function to perform filering on results for reservations.
     * if not found in the data, it will request for webservice.
     * @return {undefined}
     */
	var displayFilteredResultsReservations = function() {

	    // show everything, means no filtering
	    if ($scope.textInQueryBox.length < 3 && isSearchOnSingleDigit($scope.textInQueryBox)) {

	      	// based on 'is_row_visible' parameter we are showing the data in the template
	      	for (var i = 0; i < $scope.searchResults.length; i++) {
	        	$scope.searchResults.reservations[i].is_row_visible = true;
	      	}

			$scope.refreshScroller('res_search_scroller');
	    }
	    else {

	    	if ($rootScope.isSingleDigitSearch && !isNaN($scope.textInQueryBox) && 
	    		$scope.textInQueryBox.length === 3) {

					fetchSearchResults();
					return false;
			}

		    if ($scope.textInQueryBox.indexOf($scope.textInQueryBox) === 0 && 
		    	$scope.searchResults.reservations.length > 0) {

		        var value = "";
		        // searching in the data we have, we are using a variable 'visibleElementsCount' to track matching
		        // if it is zero, then we will request for webservice
		        var totalCountOfFound = 0;

		        for (var i = 0; i < $scope.searchResults.reservations.length; i++) {
		          	value = $scope.searchResults.reservations[i];
		          	if (($scope.escapeNull(value.firstname).toUpperCase()).indexOf($scope.textInQueryBox.toUpperCase()) >= 0 ||
		              	($scope.escapeNull(value.lastname).toUpperCase()).indexOf($scope.textInQueryBox.toUpperCase()) >= 0 ||
		              	($scope.escapeNull(value.group).toUpperCase()).indexOf($scope.textInQueryBox.toUpperCase()) >= 0 ||
		              	($scope.escapeNull(value.room).toString()).indexOf($scope.textInQueryBox) >= 0 ||
		              	($scope.escapeNull(value.confirmation).toString()).indexOf($scope.textInQueryBox) >= 0 )
		              	{
		                 	$scope.searchResults.reservations[i].is_row_visible = true;
		                 	totalCountOfFound++;
		            }
		          	else {
		            	$scope.searchResults.reservations[i].is_row_visible = false;
		          	}
		        }

		        if (totalCountOfFound === 0) {
		        	fetchSearchResults();
		        }
		    }
		    else {
		    	fetchSearchResults();
		    }

	      	// we have changed data, so we are refreshing the scrollerbar
	      	$scope.refreshScroller('res_search_scroller');
	    }
	};

	/**
     * Function to fetch search results.
     * @return {undefined}
     */
	var fetchSearchResults = function() {
		var dataDict = {'query': $scope.textInQueryBox.trim()};

		if ($rootScope.isSingleDigitSearch && !isNaN($scope.textInQueryBox) && 
			$scope.textInQueryBox.length < 3) {

			dataDict.room_search = true;
		}
		$scope.invokeApi(RVSearchSrv.fetch, dataDict, searchSuccessReservations, failureCallBackofDataFetch);
	};

	/**
     * Function to toggle between Reservations, Cards
     * @param {Boolean}
     * @return {undefined}
     */
	$scope.toggleClicked = function(flag) {
		$scope.isReservationActive = flag;
	};

	/**
     * Function to handle entity selection from the 'select entity' screen
     * @param {Number} index of selected entity
     * @param {String} type of selected entity
     * @return {undefined}
     */
	$scope.selectEntityFromSearchResults = function(index, type) {
        $scope.setDefaultRoutingDates();
        $scope.setRoutingDateOptions();

		$scope.billingInfoFlags.isEntitySelected  = true;
        $scope.billingInfoFlags.isInAddRoutesMode = false;
        $scope.billingInfoFlags.isInitialPage     = false;

        if (type === 'RESERVATIONS') {
        	var data = $scope.searchResults.reservations[index];
        	var selectedEntityDetails = {
			    "attached_charge_codes": [],
			    "attached_billing_groups": [],
                "images": data.images,
                "reservation_status": data.reservation_status,
                "is_opted_late_checkout": data.is_opted_late_checkout,
                "name": data.firstname + " " + data.lastname,
                "entity_type": "RESERVATION",
                "has_accompanying_guests": ( data.images.length > 1 ) ? true : false,
                "bill_no": "",
                "is_new": true,
                "credit_card_details": {},
                "id": data.id
			};

			$scope.setSelectedEntity(selectedEntityDetails, type);
        }
        else if (type === 'ACCOUNT') {
        	var data = $scope.searchResults.cards[index];
        	var selectedEntityDetails = {
			    "id": data.id,
			    "name": data.account_name,
			    "bill_no": "",
			    "images": [{
                                            "is_primary": true,
		                                    "guest_image": data.company_logo
		                                  }],
			    "attached_charge_codes": [],
			    "attached_billing_groups": [],
                "is_new": true,
                "is_allow_direct_debit": data.is_allow_direct_debit,
                "selected_payment": "",
                "credit_card_details": {}
			};

    		if (data.account_type === 'COMPANY') {
    			selectedEntityDetails.entity_type = 'COMPANY_CARD';
    		}
            else if (data.account_type === 'TRAVELAGENT') {
                selectedEntityDetails.entity_type = 'TRAVEL_AGENT';
            }
            $scope.setSelectedEntity(selectedEntityDetails, type);

        }
        else if (type === 'GROUP' || type === 'HOUSE') {
            if ($scope.isRoutingForPostingAccountExist()) {
                var errorMessage = ["Routing to account already exists for this reservation. Please edit or remove existing routing to add new."];

                $scope.$emit('displayErrorMessage', errorMessage);
                $scope.billingInfoFlags.isEntitySelected = false;
                $scope.billingInfoFlags.isInitialPage    = true;
            }
            else {
                var data = $scope.searchResults.posting_accounts[index];
                var selectedEntityDetails = {
                    "id": data.id,
                    "name": data.account_name,
                    "bill_no": "",
                    "attached_charge_codes": [],
                    "attached_billing_groups": [],
                    "is_new": true,
                    "selected_payment": "",
                    "credit_card_details": {},
                    "entity_type": data.account_type
                };

                $scope.setSelectedEntity(selectedEntityDetails, type);
            }
        }
	};

	/**
     * Function to select entity from attached entities
     * @param {Number} index of entity
     * @param {Number} type of entity
     * @return {undefined}
     */
    $scope.selectAttachedEntity = function(index, type) {
    	$scope.setDefaultRoutingDates();
        $scope.setRoutingDateOptions();
        $scope.billingInfoFlags.isEntitySelected = true;
        $scope.billingInfoFlags.isInitialPage = false;

        var selectedEntityDetails = {
            "bill_no": "",
            "has_accompanying_guests": false,
            "attached_charge_codes": [],
            "attached_billing_groups": [],
            "is_new": true,
            "credit_card_details": {}
        };

        $scope.setSelectedEntity(selectedEntityDetails);

        if (type === 'GUEST') {
            $scope.selectedEntity.id       = $scope.reservationData.reservation_id;
            $scope.selectedEntity.guest_id = $scope.attachedEntities.primary_guest_details.id;
            $scope.selectedEntity.name     = $scope.attachedEntities.primary_guest_details.name;

  			$scope.selectedEntity.reservation_status     = $scope.reservationData.reservation_status;
       		$scope.selectedEntity.is_opted_late_checkout = $scope.reservationData.is_opted_late_checkout;

            $scope.selectedEntity.images = [{
                "is_primary": true,
                "guest_image": $scope.attachedEntities.primary_guest_details.avatar
            }];
            $scope.selectedEntity.entity_type = "RESERVATION";
        }
        else if (type === 'ACCOMPANY_GUEST') {
            $scope.selectedEntity.id       = $scope.reservationData.reservation_id;
            $scope.selectedEntity.guest_id = $scope.attachedEntities.accompanying_guest_details[index].id;
            $scope.selectedEntity.name     = $scope.attachedEntities.accompanying_guest_details[index].name;

  			$scope.selectedEntity.reservation_status     = $scope.reservationData.reservation_status;
        	$scope.selectedEntity.is_opted_late_checkout = $scope.reservationData.is_opted_late_checkout;

            $scope.selectedEntity.images = [{
                "is_primary": false,
                "guest_image": $scope.attachedEntities.accompanying_guest_details[index].avatar
            }];

            $scope.selectedEntity.has_accompanying_guests = true;
            $scope.selectedEntity.entity_type = "RESERVATION";
        }
        else if (type === 'COMPANY_CARD') {
            $scope.selectedEntity.id   = $scope.attachedEntities.company_card.id;
            $scope.selectedEntity.name = $scope.attachedEntities.company_card.name;

            $scope.selectedEntity.images = [{
                "is_primary": true,
                "guest_image": $scope.attachedEntities.company_card.logo
            }];
            $scope.selectedEntity.entity_type = "COMPANY_CARD";
            $scope.selectedEntity.is_allow_direct_debit = $scope.attachedEntities.company_card.is_allow_direct_debit;
        }
        else if (type === 'TRAVEL_AGENT') {
            $scope.selectedEntity.id   = $scope.attachedEntities.travel_agent.id;
            $scope.selectedEntity.name = $scope.attachedEntities.travel_agent.name;

            $scope.selectedEntity.images = [{
                "is_primary": true,
                "guest_image": $scope.attachedEntities.travel_agent.logo
            }];
            $scope.selectedEntity.entity_type = "TRAVEL_AGENT";
            $scope.selectedEntity.is_allow_direct_debit = $scope.attachedEntities.travel_agent.is_allow_direct_debit;
        }
        else if (type === 'GROUP' || type === 'HOUSE') {
            if ($scope.isRoutingForPostingAccountExist()) {
                var errorMessage = ["Routing to account already exists for this reservation. Please edit or remove existing routing to add new."];

                $scope.$emit('displayErrorMessage', errorMessage);
                $scope.billingInfoFlags.isEntitySelected = false;
                $scope.billingInfoFlags.isInitialPage    = true;
            }
            else {
                $scope.selectedEntity.id          = $scope.attachedEntities.posting_account.id;
                $scope.selectedEntity.name        = $scope.attachedEntities.posting_account.name;
                $scope.selectedEntity.entity_type = type;
            }
        }
    };

    /**
     * Function shows 'no results found' if no search results found
     * in case of accounts and cards.
     * @return {Boolean} true if no search results found
     */
    $scope.noSearchResultsFoundInAccountsAndCards = function() {
    	return ($scope.searchResults.posting_accounts.length === 0 &&
    	 	   $scope.searchResults.cards.length === 0 && $scope.textInQueryBox !== '' &&
    	  	   !$scope.isReservationActive);
    };

    /**
     * Function shows 'no results found' if no search results found
     * in case reservation.
     * @return {Boolean} true if no search results found
     */
    $scope.noSearchResultsFoundInReservations = function() {
    	return ($scope.searchResults.reservations.length === 0 && 
    		   $scope.textInQueryBox !== '' && $scope.isReservationActive);
    };

    init();

}]);
