sntRover.controller('RVPostChargeControllerV2',
	[
		'$rootScope',
		'$scope',
		'RVSearchSrv',
		'$timeout', 'RVBillCardSrv', 'ngDialog', 'rvPermissionSrv', 'rvAccountTransactionsSrv', 'RVPostChargeSrvV2',
		function($rootScope, $scope, RVSearchSrv,
			$timeout, RVBillCardSrv, ngDialog, rvPermissionSrv, rvAccountTransactionsSrv, RVPostChargeSrvV2 ) {

			// hook up the basic things
			BaseCtrl.call( this, $scope );

			$scope.selectedChargeItem = null;
			$scope.selectedChargeItemHash = {};

			// fetch adjustment reason
			$scope.callAPI(RVBillCardSrv.fetchAdjustmentReasons, {
				successCallBack: function(response) {
					$scope.adjustmentReasonOptions = response.force_adjustment_reasons;
					$scope.showAdjustmentReason = response.force_adjustment_reason_enabled;
				}
			});

			$scope.disablePostChargeButton = false;
			$scope.showReason = false;
			$scope.warningMessage = "";
			
			var scrollerOptions = { preventDefault: false };

			$scope.setScroller ('items_list', scrollerOptions);
			$scope.setScroller ('items_summary', scrollerOptions);
			var isFromAccounts = ( typeof $scope.account_id !== "undefined" && $scope.account_id !== "" ) ? true : false;

			// CICO-46502 : Handle passing reservation id on post charge API call.
			if (!!$scope.reservation_id) {
				isFromAccounts = false;
			}
			// make favorite selected by default
			$scope.chargeGroup = 'FAV';
			$scope.net_total_price = 0;
			// set the default toggle to 'QTY'
			$scope.calToggle = 'QTY';

			// need to keep track of the last pressed
			// button or number on the numberpad
			var lastInput = null,
			// need to keep track of the price
			// entered by the user
			userEnteredPrice = '';

			// Setting up fetched data obj
			$scope.fetchedData.charge_groups = [];
			$scope.fetchedData.pageNo = 1;
			$scope.fetchedData.perPage = 50;

			$scope.isMobileView = window.innerWidth < 1024;
			$scope.hideActionsForMobile = false;
			$scope.singleItemViewForMobile = false;

			var fetchChargeGroups = function() {
				var successCallBackFetchChargeGroups = function( data ) {
					$scope.fetchedData.charge_groups = data.results;
					$scope.$emit('hideLoader');
				};

				$scope.invokeApi( RVPostChargeSrvV2.fetchChargeGroups, {}, successCallBackFetchChargeGroups );
			};

			fetchChargeGroups();

			// To fetch charge code items - via search query or filter by charge group ..
			var searchChargeCodeItems = function( pageNo ) {
				$scope.fetchedData.pageNo = pageNo || 1;
				var params = {
					"query": $scope.query ? $scope.query.toLowerCase() : '',
					"page": $scope.fetchedData.pageNo,
					"per_page": $scope.fetchedData.perPage,
					"charge_group_id": $scope.chargeGroup !== 'FAV' ? $scope.chargeGroup : '',
					"is_favorite": $scope.chargeGroup === 'FAV' ? 1 : 0
				};

				var successCallBackFetchChargeCodes = function( data ) {

					$scope.fetchedItems = [];
					$scope.fetchedItems = data.results;
					$scope.fetchedData.totalCount = data.total_result;

					for ( var i in $scope.selectedChargeItemHash ) {

						var match = _.find( data.results, function( item ) {
							return $scope.selectedChargeItemHash[i].id === item.id;
						});

						if ( typeof match !== "undefined" ) {
							match.count = $scope.selectedChargeItemHash[i].count;
						}
					}

					$timeout(function () {
						$scope.$broadcast('updatePagination', 'POST_CHARGE_PAGINATION');
						$scope.errorMessage = "";
						$scope.$emit('hideLoader');
						$scope.refreshScroller('items_list');
					}, 500 );
				};

				$scope.invokeApi( RVPostChargeSrvV2.searchChargeItems, params, successCallBackFetchChargeCodes );
			};

			$scope.$on("$destroy", function() {
				$scope.selectedChargeItemHash = {};
            });

			// Setting pagination object
			$scope.postChargePaginationObj = {
				id: 'POST_CHARGE_PAGINATION',
				api: searchChargeCodeItems,
				perPage: $scope.fetchedData.perPage
			};

			searchChargeCodeItems();

			/**
			* function to check whether the user has permission to Post charge
			* @return {Boolean}
			*/
			$scope.hasPostChargePermission = function () {
				return isFromAccounts ? rvPermissionSrv.getPermissionValue ('POST_TRANSACTION') : rvPermissionSrv.getPermissionValue ('ADD_CHARGE');
			};

			/*
  			* whether we want to disable the POST charge button
  			* @return {Boolean}
  			*/
			$scope.shouldDisablePostCharge = function () {
				return (!$scope.hasPostChargePermission());
			};

			// filter the items based on the chosen charge group
			$scope.filterbyChargeGroup = function() {
				searchChargeCodeItems();
			};

			var resetPostCharge = function() {

				// selected item is not deleting from DOM even after deleting from the hash.
				// Work around - removing the item manually..
				setTimeout(function() {
					$('#items-summary li.ng-leave.ng-leave-active').remove();
				}, 100);

				$scope.query = '';
				$scope.chargeGroup = 'FAV';
				searchChargeCodeItems();

				$scope.refreshScroller('items_summary');
				$scope.refreshScroller('items_list');
			};

			// filter the items based on the search query
			// will search on all items, discard chosen 'chargeGroup'
			$scope.filterByQuery = function() {
				if ( $rootScope.isSingleDigitSearch ) {
					$scope.chargeGroup = '';
					searchChargeCodeItems();
				}
				else if ( $scope.query.length >= 3 ) {
					$scope.chargeGroup = '';
					searchChargeCodeItems();
				}
			};

			// clear the filter query
			$scope.clearQuery = function() {
				$scope.query = '';
				searchChargeCodeItems();

				$scope.refreshScroller('items_summary');
				$scope.refreshScroller('items_list');
			};

			var calNetTotalPrice = function() {
				var totalPrice = 0;

				for ( var i in $scope.selectedChargeItemHash ) {
					totalPrice += $scope.selectedChargeItemHash[i].total_price;
				}
				$scope.net_total_price = totalPrice;
			};

			/**
			*	Method to add single charge to charged item list
			*
			*	Thing to do:
			*	1. modify the count
			*	2. track the item as selected
			*	3. update the net total price
			*/
			$scope.addItem = function( clickedItem ) {
				$scope.showReason = false;
				$scope.warningMessage = "";
				$scope.calToggle = ( clickedItem.type === "ITEM" ) ? 'QTY' : 'PR';

				if (typeof $scope.selectedChargeItemHash[ clickedItem.id ] === 'undefined') {
					$scope.selectedChargeItemHash[ clickedItem.id ] = clickedItem ;
					$scope.selectedChargeItemHash[ clickedItem.id ].count = 1;
					$scope.selectedChargeItemHash[ clickedItem.id ].unit_price = parseFloat($scope.selectedChargeItemHash[ clickedItem.id ].unit_price);
					$scope.selectedChargeItemHash[ clickedItem.id ].modifiedPrice = $scope.selectedChargeItemHash[ clickedItem.id ].unit_price;
					$scope.selectedChargeItemHash[ clickedItem.id ].userEnteredPrice = '';
					$scope.selectedChargeItemHash[ clickedItem.id ].show_ref_on_invoice = true;
					$scope.selectedChargeItemHash[ clickedItem.id ].reference_text = '';
				}
				else {
					$scope.selectedChargeItemHash[ clickedItem.id ].count ++ ;
				}

				$scope.selectedChargeItemHash[ clickedItem.id ].total_price = $scope.selectedChargeItemHash[ clickedItem.id ].modifiedPrice * $scope.selectedChargeItemHash[ clickedItem.id ].count;

				$scope.selectedChargeItem = $scope.selectedChargeItemHash[ clickedItem.id ];

				calNetTotalPrice();
				$scope.refreshScroller('items_summary');
				/*
				* TO solve CICO-10251
				*/
				angular.forEach(angular.element("#numpad-numbers button"), function(value, key) {
					new FastClick(value);
				});
				angular.forEach(angular.element("#numpad-options button"), function(value, key) {
					new FastClick(value);
				});

				$scope.clickedOnViewCharges();

				$scope.hideActionsForMobile = false;
				$scope.shouldShowChargesForMobile = false;
				$scope.singleItemViewForMobile = true;
			};

			/**
			*	Method to remove the chosen charge from charged list
			*
			*	Things to do:
			*	1. mark it as not chosen
			*	2. reset its count
			*	3. reset its modified price
			*	4. untrack
			*	5. update the net total price
			*/

			$scope.removeItem = function() {

				for ( var i in $scope.selectedChargeItemHash ) {

					var match = _.find( $scope.fetchedItems, function( item ) {
						return $scope.selectedChargeItem.id === item.id;
					});

					if (typeof match !== "undefined") {
						match.count = 0;
					}
				}

				delete $scope.selectedChargeItemHash[ $scope.selectedChargeItem.id ];

				// selected item is not deleting from DOM even after deleting from the hash.
				// Work around - removing the item manually..
				setTimeout(function() {
					angular.element(document.querySelector('#items-summary li.selected')).remove();
				}, 100);

				$scope.selectedChargeItem = {};

				// recalculate net price
				calNetTotalPrice();
				$scope.refreshScroller('items_summary');
				// CICO-10013 fix
				$scope.calToggle = 'QTY';

				if ($scope.isMobileView) {
					$scope.showAllSelectedChargesForMobile();
				}
			};

			/**
			*	Method to select/un-select current selected item
			*/
			$scope.selectUnselect = function(item) {

				// yep we have a selected item, gonna un-select
				if ( $scope.selectedChargeItem && $scope.selectedChargeItem.name === item.name ) {
					$scope.selectedChargeItem = null;
				}

				// nope we dont have a selected item
				else {
					$scope.selectedChargeItem = item;
				}

				// since we moved reset this value
				userEnteredPrice = '';

				// since we are unselecting
				lastInput = null;

				// to select the adjustment reason
				if (!item.adjustmentReason && item['total_price'] < 0 && $scope.showAdjustmentReason) {
					$scope.showReason = true;
				} else {
					$scope.showReason = false;
				}
			};

			// actions to be taken for numberpad number press
			$scope.calNumAction = function(input) {

				// if user is trying to update the quantity
				if ( $scope.calToggle === 'QTY' ) {
					var countStr = $scope.selectedChargeItem.count.toString();

					switch (input) {
						case 1:
							if ( $scope.selectedChargeItem.count === 1 && (lastInput === null || lastInput === 'CLR' || lastInput === 'QTY') ) {
								// do nothing
								// hard to explain in words
								// try it out in rover and see
							} else if ( $scope.selectedChargeItem.count === 1 && lastInput === 1 ) {
								$scope.selectedChargeItem.count = 11;
							} else {
								countStr += 1;
								$scope.selectedChargeItem.count = parseInt( countStr );
							}
							break;

						case '.':
							// do nothing, but should be catched here
							// else will be processed in default
							break;

						default:
							if ( $scope.selectedChargeItem.count === 1 && lastInput !== 1 ) {
								if (input !== '0') {
									$scope.selectedChargeItem.count = parseInt( input );
								}
							} else {
								countStr += input;
								$scope.selectedChargeItem.count = parseInt( countStr );
							}
							break;
					}

					// update price of the chosenChargedItem
					$scope.selectedChargeItem.total_price = $scope.selectedChargeItem.modifiedPrice * $scope.selectedChargeItem.count;
				}

				// user is trying to update the price
				else {
					switch (input) {
						case '.':
							if ( $scope.selectedChargeItem.userEnteredPrice.length && $scope.selectedChargeItem.userEnteredPrice.indexOf('.') === -1 ) {
								$scope.selectedChargeItem.userEnteredPrice += '.';
							}
							break;

						default:

							// normal senario user must no be allowed to make the price as 0
							// as soon as it choosen
							if ( $scope.selectedChargeItem.modifiedPrice === $scope.selectedChargeItem.unit_price ) {
								// CICO-17276 - add provision to add amount < $1

									$scope.selectedChargeItem.userEnteredPrice += input;
									$scope.selectedChargeItem.modifiedPrice = parseFloat( $scope.selectedChargeItem.userEnteredPrice );

							} else {
								$scope.selectedChargeItem.userEnteredPrice += input;

								// additional check
								// if there are decimals and are not limited to 2 place
								// chop off the 3 palce decimal
								if ( $scope.selectedChargeItem.userEnteredPrice.split('.')[1] && $scope.selectedChargeItem.userEnteredPrice.split('.')[1].length > 2 ) {
									$scope.selectedChargeItem.userEnteredPrice = $scope.selectedChargeItem.userEnteredPrice.slice(0, -1);
								}

								$scope.selectedChargeItem.modifiedPrice = parseFloat( $scope.selectedChargeItem.userEnteredPrice );

								// please note:
								// 1. user cannot enter anymore after e.g: "65.89"
								// 2. after this, user cant enter anymore after selecting some other charge then this "65.89" charge
								// 3. user will have to first clear added "65.89" before adding a new value.
							}
							break;
					}

					// update price of the chosenChargedItem
					$scope.selectedChargeItem.total_price = $scope.selectedChargeItem.modifiedPrice * $scope.selectedChargeItem.count;
				}

				// update net total price
				calNetTotalPrice();
				
				$scope.showReason = $scope.showAdjstmentDropdown();

				// for numbers save current input to lastInput only
				// after processing the current input
				lastInput = input;
			};

			$scope.showAdjstmentDropdown = function(input) {
				if ( $scope.selectedChargeItem.total_price < 0 && $scope.showAdjustmentReason) {
					return true;
				} else {
					return false;
				}
			};


			// actions to be taken for numberpad button press
			$scope.calBtnAction = function(input) {

				lastInput = input;
				$scope.warningMessage = "";
				$scope.showReason = $scope.showAdjstmentDropdown();

				// toggle 'QTY' and 'PR' as required and exit
				if ( input === 'QTY' || input === 'PR' ) {
					$scope.calToggle = input;
					return;
				}

				// toggle total_price of 'selectedChargeItem' sign value and exit
				if ( input === 'SIGN' ) {
					// change
					if ( $scope.selectedChargeItem.total_price < 0 ) {
						$scope.selectedChargeItem.total_price = Math.abs( $scope.selectedChargeItem.total_price );
						if ($scope.showAdjustmentReason) {
							$scope.showReason = false;
						}
					} else {
						$scope.selectedChargeItem.total_price = -Math.abs( $scope.selectedChargeItem.total_price );
						if ($scope.showAdjustmentReason) {
							$scope.showReason = true;
						}
					}

					// update net total price
					calNetTotalPrice();
					return;
				}

				// clear input numbers
				if ( input === 'CLR' ) {

					var valueStr = '';

					// user trying to clear the count
					if ( $scope.calToggle === 'QTY' && $scope.selectedChargeItem.count > 1 ) {
						valueStr = $scope.selectedChargeItem.count.toString();
						valueStr = parseInt( valueStr.slice(0, -1) );

						// update countStr
						$scope.selectedChargeItem.count = isNaN(valueStr) ? 1 : valueStr;

						// update price of the chosenChargedItem
						$scope.selectedChargeItem.total_price = $scope.selectedChargeItem.modifiedPrice * $scope.selectedChargeItem.count;

						// update net total price
						calNetTotalPrice();
					}

					// user tryin to clear price he entered
					else {

						// reduce the last char
						$scope.selectedChargeItem.userEnteredPrice = $scope.selectedChargeItem.userEnteredPrice.slice(0, -1);

						// if we are left e.g "12." remove the last "."
						if ( $scope.selectedChargeItem.userEnteredPrice.charAt($scope.selectedChargeItem.userEnteredPrice.length - 1) === '.' ) {
							$scope.selectedChargeItem.userEnteredPrice = $scope.selectedChargeItem.userEnteredPrice.slice(0, -1);
						}

						// if there is any char left
						if ( $scope.selectedChargeItem.userEnteredPrice.length ) {
							$scope.selectedChargeItem.modifiedPrice = parseFloat( $scope.selectedChargeItem.userEnteredPrice );
						}

						// nope everything is cleared
						else {
							$scope.selectedChargeItem.modifiedPrice = $scope.selectedChargeItem.unit_price;
						}

						// update price of the chosenChargedItem
						$scope.selectedChargeItem.total_price = $scope.selectedChargeItem.modifiedPrice * $scope.selectedChargeItem.count;

						// update net total price
						calNetTotalPrice();
					}
					$scope.showReason = $scope.showAdjstmentDropdown();
					return;
				}
			};

			$scope.selectedAdjReason = function(reasonId) {
				$scope.warningMessage = "";
				$scope.disablePostChargeButton = false;
				$scope.adjustmentReason = reasonId;
			};		

			$scope.clearWarningMessage = function () {
				$scope.warningMessage = '';
			};	

			$scope.postCharges = function() {

				var failureCallback = function(errorMessage) {
					$scope.$emit('hideLoader');
					$scope.errorMessage = errorMessage;
					// CICO-23196 : Enable POST CHARGE button on error.
					$scope.disablePostChargeButton = false;
				};

				var items = [],
					each = {};

				for ( var i in $scope.selectedChargeItemHash ) {

					each = {};

					each['value']    = $scope.selectedChargeItemHash[i]['id'];
					each['is_item']  = $scope.selectedChargeItemHash[i].type === "ITEM" ? true : false;
					each['amount']   = $scope.selectedChargeItemHash[i]['total_price'];
					each['quantity'] = $scope.selectedChargeItemHash[i]['count'];
					each['reference_text'] = $scope.selectedChargeItemHash[i].reference_text;
					each['adjustment_reason'] = $scope.selectedChargeItemHash[i].adjustmentReason;
					each['show_ref_on_invoice'] = $scope.selectedChargeItemHash[i].show_ref_on_invoice;
					items.push( each );
					if (!each['adjustment_reason'] && each['amount'] < 0 && $scope.showAdjustmentReason) {
						$scope.warningMessage = 'Please fill adjustment reason';
						$scope.showReason = true;
						$scope.disablePostChargeButton = true;
						return;
					}
				}

				// CICO-23196 => to disable Multiple Postings/API requests from UI.
				// We are disabling the POST CHARGE button on the click itself.
				$scope.disablePostChargeButton = true;

				var data = {
					fetch_total_balance: $scope.fetchTotalBal,
					bill_no: $scope.passActiveBillNo || $scope.billNumber,
					total: $scope.net_total_price,
					items: items
				};
				
				// accounts or reservation bill screen check
				isFromAccounts ? (data.account_id = $scope.account_id) :  (data.reservation_id = $scope.reservation_id);

				/** **    CICO-6094    **/
				var needToCreateNewBill = false;

				if ($scope.billNumber > $scope.fetchedData.bill_numbers.length) {
					needToCreateNewBill = true;
				}
				/** **    CICO-6094    **/
				var callback = function(data) {
					$scope.$emit( 'hideLoader' );
					// CICO-21768 - Alert to show Credit Limit has exceeded.
					if ( data.has_crossed_credit_limit ) {
						ngDialog.open({
							template: '/assets/partials/bill/rvBillingInfoCreditLimitAlert.html',
							className: '',
							closeByDocument: false,
							scope: $scope
						});
					}
					// update the price in staycard
					else if (!$scope.isOutsidePostCharge) {
						$scope.$emit('postcharge.added', data);
						$scope.closeDialog();						
					}
					else {
						$rootScope.$emit( 'CHARGEPOSTED' );
						$rootScope.$broadcast('postcharge.added'); // To reload the View bill Screen.						
					}
				};

				var callbackApplyToBillOne = function() {
					$scope.$emit( 'hideLoader' );
					// update the price in staycard
					if (!$scope.isOutsidePostCharge) {
						$scope.$emit('postcharge.added', data.total_balance_amount);
					}
					else {
						$rootScope.$emit( 'CHARGEPOSTED' );
						$rootScope.$broadcast('postcharge.added'); // To reload the View bill Screen.
					}
					$scope.closeDialog();
				};
				// CICO-21768 - Forcefully posting to Bill#1 while Credit Limit has exceeded.

				$scope.applyToBillOne = function() {
					data.bill_no = "1";
					data.post_to_bill_one = true;
					$scope.invokeApi(RVPostChargeSrvV2.postCharges, data, callbackApplyToBillOne, failureCallback);
				};

				var accountsPostcallback = function(response) {
					data.response_data = response.data;
					$scope.$emit( 'hideLoader' );
					$scope.closeDialog();
					$scope.$emit('UPDATE_TRANSACTION_DATA', data);
				};

				if (!isFromAccounts) {
					if (!!$scope.restrict_post && $scope.hasPermissionToAllowPostWithNoCredit()) {
						data.post_anyway = true;
					}
				}

				var updateParam = data;

				var taxExemptTypeId = $scope.groupConfigData && $scope.groupConfigData.summary.is_tax_exempt ? $scope.groupConfigData.summary.tax_exempt_type_id : '',
					groupTaxExemptChargeCodeList = [],
					isChargeCodeInTaxExempt = false;

				_.each ($scope.taxExemptTypes, function(type) {
					if (type.id === taxExemptTypeId) {
						_.each (type.charge_codes, function(chargeCode) {
							groupTaxExemptChargeCodeList.push(chargeCode.charge_code);
						});
					}
				});

				_.each ($scope.selectedChargeItemHash, function(item) {
					isChargeCodeInTaxExempt = _.contains(groupTaxExemptChargeCodeList, item.charge_code);
				});

				if (isChargeCodeInTaxExempt) {
					$scope.errorMessage = ['Charge codes belongs to tax exempt type can not be posted'];
					$scope.disablePostChargeButton = false;

				} else if (!needToCreateNewBill) {         /** **    CICO-6094    **/
					if (isFromAccounts) {
						$scope.invokeApi(rvAccountTransactionsSrv.postCharges, updateParam, accountsPostcallback, failureCallback);
					}
					else {
						$scope.invokeApi(RVPostChargeSrvV2.postCharges, updateParam, callback, failureCallback);
					}
				}
				else {

					var billData = {};
					
					// accounts or reservation bill screen check

					isFromAccounts ? (billData.account_id = $scope.account_id) : (billData.reservation_id = $scope.reservation_id);

					if (isFromAccounts) {
						/*
						 * Success Callback of create bill action
						 */
						var createBillSuccessCallback = function() {
							$scope.$emit('hideLoader');
							// Fetch data again to refresh the screen with new data
							$scope.invokeApi(rvAccountTransactionsSrv.postCharges, updateParam, accountsPostcallback, failureCallback);

						};

						$scope.invokeApi(rvAccountTransactionsSrv.createAnotherBill, billData, createBillSuccessCallback, failureCallback);
					}
					else {
						/*
						 * Success Callback of create bill action
						 */
						var createBillSuccessCallback = function(successData) {
							$scope.$emit('hideLoader');
							// Fetch data again to refresh the screen with new data
							$scope.invokeApi(RVPostChargeSrvV2.postCharges, updateParam, callback);
							// Update Review status array.
							if (!$scope.isOutsidePostCharge) {
								$scope.reservationBillData.bills[successData.bill_number - 1] = {
									bill_id: successData.id,
									bill_number: successData.bill_number,
									total_amount: 0
								};

								var data = {};

								data.reviewStatus = false;
								data.billNumber = $scope.billNumber;
								data.billIndex = $scope.reservationBillData.bills.length;
								$scope.isAllBillsReviewed = false;
								$scope.reviewStatusArray.push(data);
							}
						};

						$scope.invokeApi(RVBillCardSrv.createAnotherBill, billData, createBillSuccessCallback, failureCallback);
					}
				}
			};

			// Will be invoked only if triggered from the menu.
			// So always the default bill no will be 1
			$rootScope.$on("UPDATED_BILLNUMBERS", function( event, data ) {
				$scope.fetchedData.bill_numbers = data.bills;
				$scope.billNumber = "1";
				$scope.chargeGroup = 'FAV';
				searchChargeCodeItems();
			});

			$scope.convertToJSONString = function ( string ) {
				return JSON.stringify (string);
			};

			$scope.$on('POSTCHARGE', function( event, data ) {
				$scope.postCharges();
			});

			$rootScope.$on('RESETPOSTCHARGE', function( event, data ) {
				$scope.selectedChargeItem = null;
				$scope.fetchedData.bill_numbers = null;
				$scope.selectedChargeItemHash = {};
				resetPostCharge();
			});

			$scope.closeDialog = function() {
				// to add stjepan's popup showing animation
					$rootScope.modalOpened = false;
					$timeout(function() {
						ngDialog.close();
					}, 200);
				};

			$scope.showItemSummaryList = function() {
				var size = _.size($scope.selectedChargeItemHash),
					IsShowItemSummaryList = false;

				if ( size > 0 ) {
					IsShowItemSummaryList = true;
				}
				return IsShowItemSummaryList;
			};

			$scope.clickedOnViewCharges = function() {
				$rootScope.$emit('CLICKED_VIEW_CHARGES');
				$scope.showAllSelectedChargesForMobile();
			};

			$scope.clickedOnBack = function() {
				$scope.shouldShowChargesForMobile = false;
				$scope.hideActionsForMobile = false;
				$scope.singleItemViewForMobile = false;
				$rootScope.$emit('BACK_TO_CHARGES_LIST');
			};

			$scope.showAllSelectedChargesForMobile = function() {
				$scope.hideActionsForMobile = true;
				$scope.shouldShowChargesForMobile = true;
				$scope.refreshScroller('items_summary');
			};

			$scope.getClassNameForItem = function(each, selectedChargeItem) {
				var className = $scope.isMobileView ? ((each.name === selectedChargeItem.name && !$scope.hideActionsForMobile) ? 'selected' : '') :
					((each.name === selectedChargeItem.name) ? 'selected' : '');
				
				return className;
			};
		}
	]
);