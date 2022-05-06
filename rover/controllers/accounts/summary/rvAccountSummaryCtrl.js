sntRover.controller('rvAccountSummaryCtrl', ['$scope', '$rootScope', '$filter', '$stateParams', 'RVPaymentSrv', 'RVDepositBalanceSrv', 'rvAccountsConfigurationSrv', 'RVReservationSummarySrv', 'ngDialog', 'rvPermissionSrv', 'RVReservationCardSrv',
	function($scope, $rootScope, $filter, $stateParams, RVPaymentSrv, RVDepositBalanceSrv, rvAccountsConfigurationSrv, RVReservationSummarySrv, ngDialog, rvPermissionSrv, RVReservationCardSrv) {
		BaseCtrl.call(this, $scope);

		var summaryMemento = {};

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
		 * Update the account data
		 * @return undefined
		 */
		$scope.updateAccountSummary = function() {
			if (rvPermissionSrv.getPermissionValue('EDIT_ACCOUNT')) {
				var onAccountUpdateSuccess = function(data) {
						// client controllers should get an infromation whether updation was success
						$scope.$broadcast("UPDATED_ACCOUNT_INFO");
						$scope.$emit('hideloader');
					},
					onAccountUpdateFailure = function(errorMessage) {
						// client controllers should get an infromation whether updation was a failure
						$scope.$broadcast("FAILED_TO_UPDATE_ACCOUNT_INFO");
						$scope.$emit('showErrorMessage', errorMessage);
						$scope.$emit('hideloader');
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
		 * Whether our summary data has changed
		 * used to remove the unneccessary API calls
		 * @return {Boolean} [description]
		 */
		var whetherSummaryDataChanged = function () {
			var currentSummaryData = $scope.accountConfigData.summary,
				key;

			for (key in summaryMemento) {
				if (!angular.equals(currentSummaryData[key], summaryMemento[key])) {
					return false;
				}
			}
			return true;
		};

		var initAccountSummaryView = function() {

			$scope.setScroller("rvAccountSummaryScroller");

			$scope.accountSummaryData = {
				promptMandatoryDemographics: false,
				isDemographicsPopupOpen: false,
				newNote: "",
				// CICO-24928
				editingNote: null,
				demographics: null
			};
			summaryMemento = angular.copy($scope.accountConfigData.summary);
			// Have a handler to update the summary - IFF in edit mode
			var callUpdate = function() {
				if (!whetherSummaryDataChanged() && !$scope.accountSummaryData.isDemographicsPopupOpen) {
					// data has changed
					summaryMemento = angular.copy($scope.accountConfigData.summary);
					// call the updateAccountSummary method from the parent controller
					$scope.updateAccountSummary();
				}
			};

			if (!$scope.isInAddMode()) {
				$scope.$on("OUTSIDECLICKED", function(event, targetElement) {
					if (targetElement.id !== 'AccountTab') {
						callUpdate();
					}
				});
				$scope.$on("UPDATE_ACCOUNT_SUMMARY", function(event, targetElement) {
					callUpdate();
				});
			}
		};

		/**
		 * get Balance Amount in format
		 * @return {undefined}
		 */
		$scope.getBalanceAmount = function(amount) {
			if (typeof amount === 'undefined') {
				return "";
			}
			return $rootScope.currencySymbol + $filter('number')(amount, 2);
		};

		// Update the balance after payment
		var balanceAfterPaymentListener = $scope.$on("BALANCE_AFTER_PAYMENT", function (event, balance) {
			$scope.accountConfigData.summary.balance = balance;			
		});

		/**
		 * Place holder method for future implementation of mandatory demographic data
		 * @return {Boolean} Currently hardcoded to true
		 */
		$scope.isDemographicsFormValid = function() {
			return true;
		};

		$scope.closeDemographicsPopup = function() {
			$scope.accountSummaryData.isDemographicsPopupOpen = false;
			$scope.closeDialog();
		};

		/**
		 * Demographics Popup Handler
		 * @return undefined
		 */
		var demographicsMemento = {};

		$scope.openDemographicsPopup = function() {
			$scope.errorMessage = "";
			var showDemographicsPopup = function() {
					$scope.accountSummaryData.isDemographicsPopupOpen = true;
					demographicsMemento = angular.copy($scope.accountConfigData.summary.demographics);
					ngDialog.open({
						template: '/assets/partials/accounts/accountsTab/rvAccountDemographics.html',
						className: '',
						scope: $scope,
						closeByDocument: false,
						closeByEscape: false
					});
				},
				onFetchDemographicsSuccess = function(demographicsData) {
					$scope.accountSummaryData.demographics = demographicsData.demographics;
					showDemographicsPopup();
				},
				onFetchDemographicsFailure = function(errorMessage) {
				};

			if ($scope.accountSummaryData.demographics === null) {
				$scope.callAPI(RVReservationSummarySrv.fetchInitialData, {
					successCallBack: onFetchDemographicsSuccess,
					failureCallBack: onFetchDemographicsFailure
				});

			} else {
				showDemographicsPopup();
			}

		};

		$scope.saveDemographicsData = function() {
			if ($scope.isInAddMode()) {
				// If the account has not been saved yet, prompt user for the same
				$scope.errorMessage = ["Account needs to be saved first"];
				return;
			}

			$scope.updateAccountSummary();
			$scope.closeDemographicsPopup();
		};

		$scope.cancelDemographicChanges = function() {
			$scope.accountConfigData.summary.demographics = demographicsMemento;
		};

		/**
		 * Method to save a note
		 * @return undefined
		 */
		$scope.saveAccountNote = function() {
			if ($scope.isInAddMode()) {
				// If the account has not been saved yet, prompt user for the same
				$scope.errorMessage = ["Account needs to be saved first'"];
				return;
			}

			$scope.errorMessage = "";

			if ($scope.accountSummaryData.newNote) {
				var onSaveAccountNoteSuccess = function(data) {
						$scope.accountConfigData.summary.notes = data.notes;
						$scope.accountSummaryData.newNote = "";
						$scope.refreshScroller("rvAccountSummaryScroller");
					},
					onSaveAccountNoteFailure = function(errorMessage) {
						$scope.errorMessage = errorMessage;
					};

				$scope.callAPI(rvAccountsConfigurationSrv.saveAccountNote, {
					successCallBack: onSaveAccountNoteSuccess,
					failureCallBack: onSaveAccountNoteFailure,
					params: {
						"notes": $scope.accountSummaryData.newNote,
						"posting_account_id": $scope.accountConfigData.summary.posting_account_id
					}
				});
			} else {
			}
		};

		$scope.removeAccountNote = function(event, noteId) {
			var onRemoveAccountNoteSuccess = function(data, params) {
					$scope.accountConfigData.summary.notes = _.without($scope.accountConfigData.summary.notes, _.findWhere($scope.accountConfigData.summary.notes, {
						note_id: params.noteId
					}));
					$scope.refreshScroller("rvAccountSummaryScroller");
					// CICO-24928
					$scope.cancelEditModeAccountNote();
				},
				onRemoveAccountNoteFailure = function(errorMessage) {
					$scope.errorMessage = errorMessage;
				};

			event.stopPropagation();
			$scope.callAPI(rvAccountsConfigurationSrv.removeAccountNote, {
				successCallBack: onRemoveAccountNoteSuccess,
				failureCallBack: onRemoveAccountNoteFailure,
				params: {
					"note_id": noteId
				},
				successCallBackParameters: {
					"noteId": noteId
				}
			});
		};

		// CICO-24928
		$scope.updateActiveAccountNote = function() {
			if (!$scope.accountSummaryData.editingNote) {
	            $scope.errorMessage = ['Something went wrong, please switch tab and comeback'];
	            return;
        	}
      		$scope.errorMessage = '';
      		if ($scope.accountSummaryData.newNote) {
				var onUpdateAccountNoteSuccess = function(data) {
					$scope.accountSummaryData.editingNote.description = $scope.accountSummaryData.newNote;
					var noteArrayIndex = _.findIndex($scope.accountConfigData.summary.notes, {note_id: data.note_id});

					$scope.accountConfigData.summary.notes[noteArrayIndex] = $scope.accountSummaryData.editingNote;
					$scope.refreshScroller("rvAccountSummaryScroller");
					$scope.cancelEditModeAccountNote();
				},
				onUpdateAccountNoteFailure = function(errorMessage) {
					$scope.errorMessage = errorMessage;
				};

				$scope.callAPI(rvAccountsConfigurationSrv.updateAccountNote, {
					successCallBack: onUpdateAccountNoteSuccess,
					failureCallBack: onUpdateAccountNoteFailure,
					params: {
						"id": $scope.accountSummaryData.editingNote.note_id,
						"text": $scope.accountSummaryData.newNote,
						"associated_id": $scope.accountConfigData.summary.posting_account_id,
						"associated_type": 'PostingAccount'
					}
				});
			}
		};
		// CICO-24928
		$scope.clickedOnNote = function(note) {
	      $scope.accountSummaryData.editingNote  = note;
	      $scope.accountSummaryData.newNote = note.description.replace(new RegExp('<br/>', 'g'), '\n');
    	};
    	// CICO-24928
	    $scope.cancelEditModeAccountNote = function() {
	      $scope.accountSummaryData.editingNote  = null;
	      $scope.accountSummaryData.newNote = '';
	    };

		$scope.onCloseWarningPopup = function() {
			$scope.accountConfigData.summary.posting_account_status = "OPEN";
			$scope.closeDialog();
		};

		$scope.onAccountTypeModification = function() {
			if ($scope.accountConfigData.summary.posting_account_type === "GROUP") {
				$scope.accountConfigData.summary.posting = false;
			}			
			// Call only if the account is already saved
			if (!!$scope.accountConfigData.summary.posting_account_id) {
				$scope.updateAccountSummary();
			}
		};

		$scope.onAccountStatusModification = function() {
			//  dont allow to close account with balance -gt 0
			if (!!parseFloat($scope.accountConfigData.summary.balance) && "CLOSED" === $scope.accountConfigData.summary.posting_account_status) {
				ngDialog.open({
					template: '/assets/partials/accounts/accountsTab/rvAccountAlertCloseWithBalance.html',
					className: '',
					scope: $scope,
					closeByDocument: false,
					closeByEscape: false
				});
			} else {
				$scope.updateAccountSummary();
			}
		};

		/**
		 * success call back of summary details fetch
		 * @param  {[type]} data [description]
		 * @return {[type]}      [description]
		 */
		var onAccountSummaryDetailsFetchSuccess = function(data) {
			$scope.accountConfigData.summary = data;
			summaryMemento = angular.copy($scope.accountConfigData.summary);
		};

		/**
		 * when we are switching between tabs, we need to update the summary data
		 * @return undefined
		 */
		var refreshSummaryData = function() {
			var params = {
				"accountId": $scope.accountConfigData.summary.posting_account_id
			};
			var options = {
				params: params,
				successCallBack: onAccountSummaryDetailsFetchSuccess
			};

			$scope.callAPI(rvAccountsConfigurationSrv.getAccountSummary, options);
		};

		initAccountSummaryView();

		/**
		 * When there is a TAB switch, we will get this. We will initialize things from here
		 * @param  {Object} event
		 * @param  {String} currentTab - Active tab in the view
		 * @return undefined
		 */
		$scope.$on ('ACCOUNT_TAB_SWITCHED', function(event, currentTab) {
			if (currentTab === "ACCOUNT") {
				initAccountSummaryView();
				refreshSummaryData();
			}
		});

		/**
		 * When there is a TAB switch, we will get this. We will initialize things from here
		 * @param  {Object} event
		 * @param  {String} currentTab - Active tab in the view
		 * @return undefined
		 */
		$scope.$on ('GROUP_TAB_SWITCHED', function(event, currentTab) {
			if (currentTab === "ACCOUNT") {
				initAccountSummaryView();
				refreshSummaryData();
			}
		});

		// -- CICO-16913 - Implement Deposit / Balance screen in Accounts -- //

		$scope.paymentTypes = [];
		$scope.creditCardTypes = [];

		// Prefetching payment details
		var successCallBackOfFetchPayment = function (data) {
			$scope.$emit('hideLoader');
			$scope.paymentTypes = data;
			angular.forEach($scope.paymentTypes, function (item, key) {
				if (item.name == 'CC') {
					$scope.creditCardTypes = item.values;
				}
			});
		};

		$scope.invokeApi(RVPaymentSrv.fetchAvailPayments, {}, successCallBackOfFetchPayment);
		// Show DEPOSIT/BALANCE popup
		$scope.openDepositBalanceModal = function() {
			$scope.$emit('showErrorMessage', []);
			var dataToSrv = {
				"posting_account_id": $scope.accountConfigData.summary.posting_account_id
				},
				onBalanceFetchFailure = function (error) {
					$scope.$emit('showErrorMessage', error);
				};
			
			$scope.callAPI(RVDepositBalanceSrv.getRevenueDetails, {
				params: dataToSrv,
				onSuccess: $scope.successCallBackFetchDepositBalance,
				onFailure: onBalanceFetchFailure
			});

		};

		$scope.successCallBackFetchDepositBalance = function(data) {
			$scope.$emit('hideLoader');
			$scope.depositBalanceData = data;
			$scope.$emit('TOGGLE_PAYMET_POPUP_STATUS', true);
			$scope.passData = {
				"origin": "GROUP",
				"details": {
					"firstName": "",
					"lastName": "",
					"paymentTypes": $scope.paymentTypes,
					"accountId": $scope.accountConfigData.summary.posting_account_id
				}
			};

			ngDialog.open({
				template: '/assets/partials/depositBalance/rvModifiedDepositBalanceModal.html',
				controller: 'RVDepositBalanceAccountsCtrl',
				className: 'ngdialog-theme-default1',
				closeByDocument: false,
				scope: $scope
			});
		};

		/*
		 *	MLI SWIPE actions
		 */
		var processSwipedData = function(swipedCardData) {
			var swipeOperationObj = new SwipeOperation();
			var swipedCardDataToRender = swipeOperationObj.createSWipedDataToRender(swipedCardData);

			$scope.$broadcast('SHOW_SWIPED_DATA_ON_DEPOSIT_BALANCE_SCREEN', swipedCardDataToRender);
		};
		// Catching Swipe here

		$scope.$on('SWIPE_ACTION', function(event, swipedCardData) {
			var swipeOperationObj = new SwipeOperation();
			var getTokenFrom = swipeOperationObj.createDataToTokenize(swipedCardData);
			var tokenizeSuccessCallback = function(tokenValue) {
				$scope.$emit('hideLoader');
				swipedCardData.token = tokenValue;
				processSwipedData(swipedCardData);
			};

			$scope.invokeApi(RVReservationCardSrv.tokenize, getTokenFrom, tokenizeSuccessCallback );
		});

		$scope.$on('$destroy', balanceAfterPaymentListener);

		// -- CICO-16913 - Implement Deposit / Balance screen in Accounts -- //
	}
]);