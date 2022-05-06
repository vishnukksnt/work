sntRover.controller('rvAccountsConfigurationCtrl', [
	'$scope',
	'$rootScope',
	'rvGroupSrv',
	'$filter',
	'$stateParams',
	'rvAccountsConfigurationSrv',
	'rvGroupConfigurationSrv',
	'accountData',
	'$state',
	'rvPermissionSrv',
	'rvAccountTransactionsSrv',
	'$vault',
	'$timeout',
	'transitions',
	function($scope, $rootScope, rvGroupSrv, $filter, 
		$stateParams, rvAccountsConfigurationSrv, 
		rvGroupConfigurationSrv, accountData, $state, 
		rvPermissionSrv, rvAccountTransactionsSrv, $vault, $timeout, transitions) {

    BaseCtrl.call(this, $scope);

		/**
		 * to run angular digest loop,
		 * will check if it is not running
		 * return - None
		 */
		var runDigestCycle = function() {
			if (!$scope.$$phase) {
				$scope.$digest();
			}
		};

		/**
		 * whether current screen is in Add Mode
		 * @return {Boolean}
		 */
		$scope.isInAddMode = function() {
			return ($stateParams.id === "NEW_ACCOUNT");
		};


		/**
		 * function to set title and things
		 * @return - None
		 */
		var setTitle = function() {
			var title = $filter('translate')('ACCOUNT_DETAILS');

			// we are changing the title if we are in Add Mode
			if ($scope.isInAddMode()) {
				title = $filter('translate')('NEW_ACCOUNT');
			}

			// yes, we are setting the headting and title
			$scope.setHeadingTitle(title);
		};

		$scope.updateAndBackFlag = false;
		$scope.updateAndBack = function() {
			if ($scope.isInAddMode) {
				$state.go('rover.accounts.search');
			} else {
				$scope.$broadcast('UPDATE_ACCOUNT_SUMMARY');
				$scope.updateAccountSummary();
				$scope.updateAndBackFlag = true;
			}

		};


		/**
		 * function to set Back Navigation params
		 */
		var setBackNavigation = function() {
			// TODO : Currently hardcoded to go to groups search..
			// Change the same according to the requirements
      // CICO-17777: added isFromCards to $stateParams from rvAccountRouter
			if ($stateParams.isFromCards) {
				$rootScope.setPrevState = {
					title: $filter('translate')('ACCOUNTS'),
					callback: 'updateAndBack',
					scope: $scope
				};
			}
			else if ($stateParams.isFromArTransactions) {
				var fromArTab = $stateParams.isFromArTab;

				$rootScope.setPrevState = {
					title: 'AR Transactions',
					name: 'rover.companycarddetails',
					param: {
						id: $vault.get('cardId'),
						type: $vault.get('type'),
						query: $vault.get('query'),
						isBackFromStaycard: true,
						isBackFromStaycardToARTab: fromArTab
					}
				};
			} else if ($scope.previousState.name === 'rover.financials.invoiceSearch') {
				$rootScope.setPrevState = {
					title: 'INVOICE SEARCH',
					name: 'rover.financials.invoiceSearch',
					param: {
						isFromStayCard: true
					}
				};
			} else if ((transitions.get().from()['name'].match(/rover\.reports/))) {
				$rootScope.setPrevState = {
						title: 'REPORTS',
						name: transitions.get().from()['name'],
						param: angular.extend(
								angular.copy(transitions.get().params('from')), {
										action: 'report.show.last'
								})
				};
			}
            // setting title and things
			setTitle();
		};

		/**
		 * Function to check the mandatory values while saving the reservation
		 * Handling in client side owing to alleged issues on import if handled in the server side
		 * @return boolean [true if all the mandatory values are present]
		 */
		var ifMandatoryValuesEntered = function() {
			var summary = $scope.accountConfigData.summary;

			return !!summary.posting_account_name;
		};

		/**
		 * function to form data model for add/edit mode
		 * @return - None
		 */
		$scope.initializeDataModelForSummaryScreen = function() {
			$scope.accountConfigData = {
				activeTab: $stateParams.activeTab, // Possible values are ACCOUNT, TRANSACTIONS, ACTIVITY
				summary: accountData
			};
		};

		/**
		 * function to check whether the user has permission
		 * to make view the transactions tab
		 * @return {Boolean}
		 */
		$scope.hasPermissionToViewTransactionsTab = function() {
			return rvPermissionSrv.getPermissionValue('ACCESS_GROUP_ACCOUNT_TRANSACTIONS');
		};

		/**
		 * TAB - to swicth tab
		 * @return - None
		 */
		$scope.switchTabTo = function(tab) {
			// if there was any error message there, we are clearing
			$scope.errorMessage = '';

			// allow to swith to "transactions" tab only if the user has its permission
			if (tab === "TRANSACTIONS" && !$scope.hasPermissionToViewTransactionsTab()) {
				$scope.errorMessage = ["Sorry, you don't have the permission to access the transactions"];
				return;
			}

			var isInAccountsTab = $scope.accountConfigData.activeTab === "ACCOUNT";

			// we will restrict tab swithing if we are in add mode
			var tryingFromAccountsToOther = isInAccountsTab && tab !== 'ACCOUNT';

			if ($scope.isInAddMode() && tryingFromAccountsToOther) {
				$scope.errorMessage = ['Sorry, Please save the entered information and try to switch the tab'];
				return;
			}

			// Save summary data on tab switch (UI)
			if (isInAccountsTab && !$scope.isInAddMode()) {

			}

			// Reload the summary tab contents before switching to it
			if (tab === "ACCOUNT") {

			} else if (tab === "TRANSACTIONS") { // Preload the transaction data when we switch to transactions tab


			} else {
				// Switching from SUMMARY tab -
				// Check for any updation => lets save it.
				$scope.$broadcast('UPDATE_ACCOUNT_SUMMARY');
			}

			$scope.accountConfigData.activeTab = tab;

			// propogating an event that next clients are
			$timeout(function() {
				$scope.$broadcast('ACCOUNT_TAB_SWITCHED', $scope.accountConfigData.activeTab);
			}, 100);
		};

		/**
		 * Save the new Group
		 * @return undefined
		 */
		$scope.saveNewAccount = function() {
			$scope.errorMessage = "";
			if (rvPermissionSrv.getPermissionValue('CREATE_ACCOUNT')) {
				if (ifMandatoryValuesEntered()) {
					var onAccountSaveSuccess = function(data) {
							$scope.accountConfigData.summary.posting_account_id = data.posting_account_id;
							$state.go('rover.accounts.config', {
								id: data.posting_account_id
							});
							$stateParams.id = data.posting_account_id;
						},
						onAccountSaveFailure = function(errorMessage) {
							$scope.errorMessage = errorMessage;
						};

					$scope.callAPI(rvAccountsConfigurationSrv.saveAccountSummary, {
						successCallBack: onAccountSaveSuccess,
						failureCallBack: onAccountSaveFailure,
						params: {
							summary: $scope.accountConfigData.summary
						}
					});
				} else {
					$scope.errorMessage = ["Account's name is mandatory"];
				}
			} else {
				console.warn('No Permission for CREATE_GROUP_SUMMARY');
			}
		};


		/**
		 * Discard the new Group
		 * @return undefined
		 */
		$scope.discardNewAccount = function() {
			$scope.accountConfigData.summary = angular.copy(rvAccountsConfigurationSrv.baseAccountSummaryData);
		};

		/**
		 * Autocompletions for company/travel agent
		 * @return {None}
		 */
		var initializeAutoCompletions = function() {
			// this will be common for both company card & travel agent
			var cardsAutoCompleteCommon = {

				focus: function(event, ui) {
					return false;
				}
			};

			// merging auto complete setting for company card with common auto cmplt options
			$scope.companyAutoCompleteOptions = angular.extend({
				source: function(request, response) {
					rvGroupConfigurationSrv.searchCompanyCards(request.term)
						.then(function(data) {
							var list = [];
							var entry = {};

							$.map(data, function(each) {
								entry = {
									label: each.account_name,
									value: each.id,
									address: each.account_address,
									type: each.account_type,
									contract_access_code: each.current_contracts.length > 0 ? each.current_contracts[0].access_code : null
								};
								list.push(entry);
							});

							response(list);
						});
				},
				select: function(event, ui) {
					this.value = ui.item.label;
					$scope.accountConfigData.summary.company.name = ui.item.label;
					$scope.accountConfigData.summary.company.id = ui.item.value;
					if (!$scope.isInAddMode()) {
						$scope.updateAccountSummary();
					}
					runDigestCycle();
					return false;
				},
				change: function() {
					if (!$scope.isInAddMode() && !$scope.accountConfigData.summary.company.name) {
						$scope.accountConfigData.summary.company.id = "";
						$scope.updateAccountSummary();
					}
				}
			}, cardsAutoCompleteCommon);

			// merging auto complete setting for travel agent with common auto cmplt options
			$scope.travelAgentAutoCompleteOptions = angular.extend({
				source: function(request, response) {
					rvGroupConfigurationSrv.searchTravelAgentCards(request.term)
						.then(function(data) {
							var list = [];
							var entry = {};

							$.map(data, function(each) {
								entry = {
									label: each.account_name,
									value: each.id,
									address: each.account_address,
									type: each.account_type,
									contract_access_code: each.current_contracts.length > 0 ? each.current_contracts[0].access_code : null
								};
								list.push(entry);
							});

							response(list);
						});
				},
				select: function(event, ui) {
					this.value = ui.item.label;
					$scope.accountConfigData.summary.travel_agent.name = ui.item.label;
					$scope.accountConfigData.summary.travel_agent.id = ui.item.value;
					if (!$scope.isInAddMode()) {
						$scope.updateAccountSummary();
					}
					runDigestCycle();
					return false;
				},
				change: function() {
					if (!$scope.isInAddMode() && !$scope.accountConfigData.summary.travel_agent.name) {
						$scope.accountConfigData.summary.travel_agent.id = "";
						$scope.updateAccountSummary();
					}
				}
			}, cardsAutoCompleteCommon);
		};

		/**
		 * Update the account data
		 * @return undefined
		 */
		$scope.updateAccountSummary = function() {
			if (rvPermissionSrv.getPermissionValue('EDIT_ACCOUNT')) {
				var onAccountUpdateSuccess = function(data) {
						// client controllers should get an infromation whether updation was success
						$scope.$broadcast("UPDATED_ACCOUNT_INFO");
						if($scope.updateAndBackFlag) {
							$state.go('rover.accounts.search');
						}
						else {
							$scope.$emit('hideLoader');
						}
					},
					onAccountUpdateFailure = function(errorMessage) {
						// client controllers should get an infromation whether updation was a failure
						$scope.$broadcast("FAILED_TO_UPDATE_ACCOUNT_INFO");
						$scope.$emit('showErrorMessage', errorMessage);
						$scope.$emit('hideLoader');
					};

				$scope.callAPI(rvAccountsConfigurationSrv.updateAccountSummary, {
					successCallBack: onAccountUpdateSuccess,
					failureCallBack: onAccountUpdateFailure,
					params: {
						summary: $scope.accountConfigData.summary
					}
				});
			} else {
				$scope.$emit('showErrorMessage', ['Sorry, Changes will not get saved as you don\'t have enough permission']);
			}
		};

		/**
		 * When we recieve the error message from its child controllers, we have to show them
		 * @param  {Object} event
		 * @param  {String} errorMessage)
		 * @return undefined
		 */
		$scope.$on('showErrorMessage', function(event, errorMessage) {
			$scope.errorMessage = errorMessage;
			runDigestCycle();
		});

		/**
         * Show company card navigation icon only if cc is attached to group
         * @return {Boolean} should show or not
         */
		$scope.shouldShowCompanyCardNavigationButton = function() {
            return (!$scope.isInAddMode() && $scope.accountConfigData.summary.company && !!$scope.accountConfigData.summary.company.id);
		};
		
		/**
         * Show show the ta navigation icon only if ta is attached to group
         * @return {Boolean} should show or not
         */
		$scope.shouldShowTravelAgentNavigationButton = function() {
            return (!$scope.isInAddMode() && $scope.accountConfigData.summary.travel_agent && !!$scope.accountConfigData.summary.travel_agent.id);
        };

		// Navigate to ta card screen
        $scope.goToTACard = function() {
            $state.go('rover.companycarddetails', {
                id: $scope.accountConfigData.summary.travel_agent.id,
                type: 'TRAVELAGENT'
            });
        };

		// Navigate to cc screen
        $scope.goToCompanyCard = function() {
            $state.go('rover.companycarddetails', {
                id: $scope.accountConfigData.summary.company.id,
                type: 'COMPANY'
            });
        };
		/**
		 * function to initialize things for group config.
		 * @return - None
		 */
		var initGroupConfig = function() {

			// forming the data model if it is in add mode or populating the data if it is in edit mode
			$scope.initializeDataModelForSummaryScreen();

			initializeAutoCompletions();

			// back navigation
			setBackNavigation();

			if ($scope.previousState.name === 'rover.financials.invoiceSearch') {
				$scope.switchTabTo("TRANSACTIONS");
			}
		};

		initGroupConfig();
	}
]);
