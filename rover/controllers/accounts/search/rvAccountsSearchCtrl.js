sntRover.controller('rvAccountsSearchCtrl',	[
	'$scope',
	'$rootScope',
	'rvAccountsSrv',
	'initialAccountsListing',
	'$filter',
	'$timeout',
	'$state',
	'rvUtilSrv',
	'rvPermissionSrv',
	function($scope,
			$rootScope,
			rvAccountsSrv,
			initialAccountsListing,
			$filter,
			$timeout,
			$state,
			util,
			rvPermissionSrv) {

		BaseCtrl.call(this, $scope);

		/**
		* util function to check whether a string is empty
		* we are assigning it as util's isEmpty function since it is using in html
		* @param {String/Object}
		* @return {boolean}
		*/
		$scope.isEmpty = util.isEmpty;

		/**
		* util function to get CSS class against diff. Hold status
		* @param {Object} - account
		* @return {String}
		*/
		$scope.getClassAgainstBalance = function(account) {
			var classes = '';

			// Add class "red" if status OPEN
			if (util.convertToDouble (account.balance) > 0) {
				classes = 'red';
			}
			return classes;
		};

		/**
		* util function to get CSS class against diff. account status
		* @param {Object} - account
		* @return {String}
		*/
		$scope.getClassAgainstAccountStatus = function(account) {
			var classes = '';

			// Add class "green" if status OPEN
			if (account.status && account.status.toLowerCase() === "open") {
				classes = 'green';
			}

			return classes;
		};

		/**
		* Function to clear to search query
		* @return {None}
		*/
		$scope.clearSearchQuery = function(event) {
			event.preventDefault();
			event.stopPropagation();

			$scope.query = '';

			// we have to search on changing the from date
			$scope.search();
		};

		/**
		* function to stringify a string
		* sample use case:- directive higlight filter
		* sometimes through error parsing speial charactes
		* @param {String}
		* @return {String}
		*/
		$scope.stringify = util.stringify;

		/**
		 * Event propogated by ngrepeatstart directive
		 * we used to show activity indicator
		 */
		$scope.$on('NG_REPEAT_STARTED_RENDERING', function(event) {
			$scope.$emit('showLoader');
		});

		/**
		 * Event propogated by ngrepeatend directive
		 * we used to hide activity indicator & refresh scroller
		 */
		$scope.$on('NG_REPEAT_COMPLETED_RENDERING', function(event) {
			$timeout(function() {
				refreshScrollers();
			}, 300);
			$scope.$emit('hideLoader');
		});

		/**
		* when there is any change in search query
		* this function will execute
		* @return {None}
		*/
		$scope.hasPermissionToAddNewAccount = function() {
			return (rvPermissionSrv.getPermissionValue("CREATE_ACCOUNT"));
		};

		/**
		* when there is any change in search query
		* this function will execute
		* @return {None}
		*/
		$scope.searchQueryChanged = function() {
			if ($scope.isEmpty ($scope.query)) {
				return false;
			}

			if ($scope.query.length < 3) {
				return false;
			}

			$scope.search ();
		};

		/**
		* utility function to form API params for account search
		* return {Object}
		*/
		var formAccountSearchParams = function() {
			var params = {
				query: $scope.query,
				status: $scope.status,
				to_date: $scope.toDate,
				per_page: $scope.perPage,
				page: $scope.page,
				account_type: $scope.accountType,
				is_non_zero: $scope.isNonZero
			};

			return params;
		};

		/**
		* to Search for accounts
		* @return - None
		*/
		$scope.search = function(page) {
			// am trying to search something, so we have to change the initial search helping screen if no rsults
			$scope.amFirstTimeHere = false;
			$scope.page = page || 1;
			// resetting error message
			$scope.errorMessage = '';

			var params = formAccountSearchParams();
			var options = {
				params: params,
				successCallBack: successCallBackOfSearch,
				failureCallBack: failureCallBackOfSearch
			};

			$scope.callAPI(rvAccountsSrv.getAccountsList, options);
		};

		/**
		* on success of search API
		* @param {Array} - array of objects - accounts
		* @return {None}
		*/
		var successCallBackOfSearch = function(data) {
			// accountList
			$scope.accountList = data.posting_accounts;

			// total result count
			$scope.totalResultCount = data.total_count;
			$timeout (function() {
				$scope.$broadcast('updatePagination', 'ACCOUNT_SEARCH');
			}, 800);			

			// we have changed the data
			refreshScrollers ();
		};

		/**
		* on success of search API
		* @param {Array} - error messages
		* @return {None}
		*/
		var failureCallBackOfSearch = function(error) {
			$scope.errorMessage = error;
		};

		/**
		* utiltiy function for setting scroller and things
		* return - None
		*/
		var setScrollerForMe = function() {
			// setting scroller things
			var scrollerOptions = {
				tap: true,
				preventDefault: false,
				deceleration: 0.0001,
				shrinkScrollbars: 'clip'
			};

			$scope.setScroller('result_showing_area', scrollerOptions);
		};

		/**
		* utiltiy function for setting scroller and things
		* return - None
		*/
		var refreshScrollers = function() {
			$scope.refreshScroller('result_showing_area');
		};

		/**
		* should we show pagination area
		* @return {Boolean}
		*/
		$scope.shouldShowPagination = function() {
			return ($scope.totalResultCount >= $scope.perPage);
		};

		/**
		* has there any search results?
		* @return {Boolean}
		*/
		var hasSomeSearchResults = function() {
			return ($scope.accountList.length > 0);
		};

		/**
		 * [isFirstTimeWithNoResult description]
		 * @return {Boolean} [description]
		 */
		$scope.isFirstTimeWithNoResult = function() {
			return ($scope.amFirstTimeHere && !hasSomeSearchResults());
		};

		/**
		 * [shouldShowNoResult description]
		 * @return {[type]} [description]
		 */
		$scope.shouldShowNoResult = function() {
			return (!$scope.amFirstTimeHere && !hasSomeSearchResults());
		};


		/**
		* should show add new button
		* @return {Boolean}
		*/
		$scope.shouldShowAddNewButton = function() {
			return ($scope.hasPermissionToAddNewAccount());
		};		

		/**
		 * Navigate to the account configuration state for editing the account
		 * @return undefined
		 */
		$scope.gotoEditAccountConfiguration = function(accountID) {
			$state.go('rover.accounts.config', {
				id: accountID,
				activeTab: 'ACCOUNT',
        		isFromCards: true
			});
		};

		/**
		 * Navigate to the account configuration state for adding the account
		 * @return undefined
		 */
		$scope.gotoAddNewAccount = function() {
			$state.go ('rover.accounts.config', {'id': "NEW_ACCOUNT", isFromCards: true});
		};

		/**
		* function used to set initlial set of values
		* @return {None}
		*/
		var initializeMe = (function() {
			// chnaging the heading of the page
			$scope.setHeadingTitle ('MENU_ACCOUNTS');

			// updating the left side menu
	    	$scope.$emit("updateRoverLeftMenu", "accounts");


			// accountList
			$scope.accountList = initialAccountsListing.posting_accounts;

			// total result count
			$scope.totalResultCount = initialAccountsListing.total_count;

			// Yes am first time here
			$scope.amFirstTimeHere = true;

			$scope.query = '';
			// Initial search param
			$scope.isNonZero = false;
			$scope.status = 'OPEN';


			// scroller and related things
			setScrollerForMe();
			// Set pagination
			$scope.perPage 	= rvAccountsSrv.DEFAULT_PER_PAGE;
			$scope.accountSearchPagination = {
				id: 'ACCOUNT_SEARCH',
				api: $scope.search,
				perPage: rvAccountsSrv.DEFAULT_PER_PAGE
			};
			$scope.search();

		}());


	}]);
