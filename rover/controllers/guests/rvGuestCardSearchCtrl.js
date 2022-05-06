angular.module('sntRover').controller('guestCardSearchController', 
[
  '$scope',
  'RVGuestCardsSrv',
  '$stateParams',
  'ngDialog',
  '$timeout',
  '$state',
  '$filter',
  'rvPermissionSrv',  
   function($scope, RVGuestCardsSrv, $stateParams, ngDialog, $timeout, $state, $filter, rvPermissionSrv) {

        BaseCtrl.call(this, $scope);
        var transitionParams = null;

        var GUEST_CARD_SCROLL = "guest_card_scroll",
            DEBOUNCE_SEARCH_DELAY = 600, // // Delay the function execution by this much ms
            GUEST_CARD_SEARCH_PAGINATION_ID = "guest_card_search";

        var MIN_SEARCH_TEXT_LENGTH = 3;
        
        // Refresh the guest card search scroller
        var refreshScroller = function() {
                if ( $scope.myScroll && $scope.myScroll.hasOwnProperty(GUEST_CARD_SCROLL) ) {
                    $scope.myScroll[GUEST_CARD_SCROLL].scrollTo(0, 0, 100);
                }

                $timeout(function() {
                    $scope.refreshScroller(GUEST_CARD_SCROLL);
                }, 300);
            };

        /**
         * Make the search string highlighted
         * @param {string} query string
         * @return {undefined}
         */
        var setHighlightedQueryText = function (newVal) {
            $scope.searchWords = [];
            
            if (newVal.indexOf(',') !== -1) {
                $scope.searchWords = newVal.split(',');
            } else if (newVal.indexOf(' ') !== -1) {
                $scope.searchWords = newVal.split(' ');
            } else {
                $scope.searchWords.push(newVal);
            }            
        };

        /**
         * Filtering/request data from service in change event of query box
         */
        $scope.queryEntered = _.debounce(function() {
            if ($scope.textInQueryBox === "" ) {
                $scope.results = []; 
                $scope.$apply();                               
            } else if ($scope.textInQueryBox.length < MIN_SEARCH_TEXT_LENGTH ) {
                // The current results should be shown when the length of the search query is less than MIN_SEARCH_TEXT_LENGTH
            } else {
                displayFilteredResults();
            }
            var queryText = $scope.textInQueryBox;
            
            $scope.textInQueryBox = queryText.charAt(0).toUpperCase() + queryText.slice(1);
            setHighlightedQueryText($scope.textInQueryBox);
        }, DEBOUNCE_SEARCH_DELAY);

        // Clear search results
        $scope.clearResults = function() {
            $scope.textInQueryBox = "";
            $scope.results = [];
        };
        
        /**
         * Function which get invoked on success
         * @param {Object} data response data
         * @return {undefined}
         */
        var onSearchSuccess = function (response) {
                if (response.params && response.params.query.toUpperCase() === $scope.textInQueryBox.trim().toUpperCase()) {
                    $scope.results = response.data.results;
                    $scope.totalResultCount = response.data.total_count;
                    markAlreadySelectedCards();
                    setTimeout(function() {
                        $scope.$broadcast('updatePagination', GUEST_CARD_SEARCH_PAGINATION_ID );
                        refreshScroller();
                    }, 500);
                }           
                
            },
            onSearchFailure = function () {
                $scope.results = [];
            },
            getRequestParams = function (pageNo) {
                var params = {
                    query: $scope.textInQueryBox.trim(),
                    per_page: RVGuestCardsSrv.PER_PAGE_COUNT,
                    page: pageNo || 1
                };

                return params;
            };

        // Perform guest card search for the given params
        $scope.search = function (pageNo) {  
            var options = {
                params: getRequestParams(pageNo),
                successCallBack: onSearchSuccess,
                failureCallBack: onSearchFailure
            };

            $scope.callAPI(RVGuestCardsSrv.fetchGuestList, options);
        };        

        /**
         * function to perform filering on results.
         * if not fouund in the data, it will request for webservice
         */
        var displayFilteredResults = function() {
            if (!$scope.textInQueryBox.length) {
                 $scope.results = [];
                // we have changed data, so we are refreshing the scrollerbar
                refreshScroller();
            } else {
                $scope.search();                
            }
        };

        // Click on add new btn navigates to an empty guest card page
        $scope.addNewCard = function() {
            $state.go('rover.guest.details', {
                isFromMenuGuest: true
            });
        }; 

        /**
         * Get guest name
         * @param {string} firstName
         * @param {string} lastName
         * @return {string} full name
         *
         */
        $scope.getGuestName = function(firstName, lastName) {           
            return lastName + ", " + firstName;
        };

        // Set title and heading
        var setTitleAndHeading = function () {
            var title = $filter('translate')('FIND_GUESTS'); 
            
            $scope.heading = title;
            $scope.setTitle (title);            
        };

        /**
         * Handles the switching between merge and normal search view
         */
        $scope.onViewChange = function() {
            if (!$scope.viewState.isViewSelected) {
                $scope.$broadcast('RESET_SELECTIONS_FOR_MERGE');
            }
            $scope.viewState.canMerge = null;
            $scope.queryEntered();
        };

        /**
         * Handles the selection of cards for merge from the search results
         * @param {Object} card - contains the details of guest card
         * @return {void}
         */
        $scope.onCardSelection = function(card) {
            if ($scope.viewState.selectedCardsForMerge.length === 0 && card.selected) {
                card.isPrimary = true;
                $scope.viewState.selectedPrimaryCard = card;
            }

            if (card.selected) {
                $scope.viewState.selectedCardsForMerge.push(card);				
            } else {
                var isCardPrimary = card.isPrimary;

                $scope.viewState.selectedCardsForMerge = _.reject($scope.viewState.selectedCardsForMerge, function(selectedCard) {
                    
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
        
        // Marks the card as already selected if it is added to merge cards screen
        var markAlreadySelectedCards = function() {
            if ($scope.viewState.selectedCardsForMerge.length > 0) {
                $scope.results.forEach(function(card) {
                    var selectedCard = _.find($scope.viewState.selectedCardsForMerge, {id: card.id});

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
        
        // Initialize the controller variables
        var init = function () {
            setTitleAndHeading();
            // model used in query textbox, we will be using this across
            $scope.textInQueryBox = "";
            $scope.$emit("updateRoverLeftMenu", "guests");
            $scope.results = [];
            $scope.totalResultCount = 0;
            $scope.isGuestCard = true;

            $scope.viewState = {
                isViewSelected: true,
                selectedCardsForMerge: [],
                selectedPrimaryCard: {},
                mergeStatusText: '',
                hasInitiatedMergeVerification: false,
                mergeStatusErrors: {}
            };

            var scrollerOptions = {
                tap: true,
                preventDefault: false,
                deceleration: 0.0001,
                shrinkScrollbars: 'clip'
            };

            $scope.setScroller(GUEST_CARD_SCROLL, scrollerOptions);

            $scope.guestCardPagination = {
                id: GUEST_CARD_SEARCH_PAGINATION_ID,
                perPage: 50,
                api: $scope.search
            };

            transitionParams = $state.transition && $state.transition.params('from');

            if (transitionParams && transitionParams.isMergeViewSelected) {
                $scope.viewState.isViewSelected = !transitionParams.isMergeViewSelected;
                $scope.textInQueryBox = transitionParams.query;				
                $scope.viewState.selectedCardsForMerge = transitionParams.selectedIds;
                $scope.queryEntered();
            }

            // While coming back to search screen from DISCARD button
            else if ($stateParams.textInQueryBox) {
                $scope.textInQueryBox = $stateParams.textInQueryBox;
                $scope.queryEntered();
            }

            $scope.hasMergeViewPermission = rvPermissionSrv.getPermissionValue('MERGE');
        };

        // Checks whether search results should be shown or not
        $scope.shouldHideSearchResults = function () {
            return $scope.results.length === 0 || $scope.textInQueryBox === "";
        }; 

        // Checks whether the pagination directive should be shown or not
        $scope.shouldHidePagination = function () {
            return ( ($scope.totalResultCount < $scope.guestCardPagination.perPage) && $scope.results.length > 0);
        };
        
        /**
         * 
         * @param {Number} id identifier for the card
         * @param {String} accountType CC/TA
         * @return {void}
         */
        $scope.navigateToDetails = function(guestId) {
            if ($scope.viewState.hasInitiatedMergeVerification) {
                return false;
            }

            $state.go('rover.guest.details', {
                guestId: guestId,
                query: $scope.textInQueryBox,
                selectedIds: $scope.viewState.selectedCardsForMerge || [],
                isMergeViewSelected: !$scope.viewState.isViewSelected,
                isFromMenuGuest: true			
            });
        };

        init();
    }
]);
