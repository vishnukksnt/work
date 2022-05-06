sntRover.controller('RVbillCardController',
	['$scope',
		'$rootScope',
		'$state',
		'$stateParams',
		'RVBillCardSrv',
		'reservationBillData',
		'RVReservationCardSrv',
		'ngDialog',
		'$filter',
		'$window',
		'$timeout',
		'$sce',
		'RVKeyPopupSrv',
		'RVPaymentSrv',
		'RVSearchSrv',
		'rvPermissionSrv',
		'jsMappings',
		'$q',
		'sntActivity',
		'RVReservationStateService',
		'$log',
		'sntAuthorizationSrv',
		'RVAutomaticEmailSrv',
		'PAYMENT_CONFIG',
		function ($scope, $rootScope,
			$state, $stateParams,
			RVBillCardSrv, reservationBillData,

			RVReservationCardSrv,
			ngDialog, $filter,

			$window, $timeout,
			$sce,

			RVKeyPopupSrv, RVPaymentSrv,
			RVSearchSrv, rvPermissionSrv, jsMappings, $q, sntActivity, RVReservationStateService, $log, sntAuthorizationSrv, RVAutomaticEmailSrv, PAYMENT_CONFIG) {


			BaseCtrl.call(this, $scope);

			SharedMethodsBaseCtrl.call(this, $scope, $rootScope, RVAutomaticEmailSrv, ngDialog);
			var that = this;


			// set a back button on header
			$rootScope.setPrevState = {
				title: $filter('translate')('STAY_CARD'),
				callback: 'goBackToStayCard',
				scope: $scope
			};
			$scope.encoderTypes = [];
			$scope.isSRViewRateBtnClicked = RVReservationStateService.getReservationFlag("isSRViewRateBtnClicked");
			$scope.isFromBillCard = true;

			$scope.isMobileView = window.innerWidth < 1024;

			// Flag for CC auth permission
			$scope.hasCCAuthPermission = function () {
				return rvPermissionSrv.getPermissionValue('OVERRIDE_CC_AUTHORIZATION');
			};

			// Setup ng-scroll for 'registration-content' , 'bill-tab-scroller' , 'billDays'
			var scrollerOptionsForGraph = { scrollX: true, click: true, preventDefault: true, mouseWheel: false },
				scrollerOptionForSummary = { scrollX: true, scrollY: false },
				scrollOptions = { preventDefaultException: { tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT|A|DIV)$/ }, preventDefault: false },
				// CICO-49105 - Blackbox enabled or not.
				isBlackBoxEnabled = reservationBillData.is_infrasec_activated_for_hotel && reservationBillData.is_infrasec_activated_for_workstation;

			$scope.hasPrintFolioEnabled = reservationBillData.is_print_folio_enabled;

			// Log to track the issue.
			$log.info('is_infrasec_activated_for_hotel', reservationBillData.is_infrasec_activated_for_hotel);
			$log.info('is_infrasec_activated_for_workstation', reservationBillData.is_infrasec_activated_for_workstation);

			$scope.setScroller('registration-content', scrollOptions);
			$scope.setScroller('bill-tab-scroller', scrollerOptionsForGraph);

			$scope.clickedButton = $stateParams.clickedButton;
			$scope.saveData = {};
			$scope.signatureData = "";
			$scope.saveData.promotions = !!reservationBillData.is_promotions_and_email_set ? true : false;
			$scope.saveData.termsAndConditions = $scope.reservation.reservation_card.is_pre_checkin ? $scope.reservation.reservation_card.is_pre_checkin : false;
			$scope.reviewStatusArray = [];
			$scope.isAllBillsReviewed = false;
			$scope.isLastBillSucceededWithBlackBoxAPI = false;
			$scope.saveData.isEarlyDepartureFlag = false;
			$scope.saveData.isEmailPopupFlag = false;
			$scope.isRefreshOnBackToStaycard = false;
			$scope.paymentModalOpened = false;
			$scope.billingInfoModalOpened = false;
			$scope.showPayButton = false;
			$scope.paymentModalSwipeHappened = false;
			$scope.isSwipeHappenedDuringCheckin = false;
			$scope.do_not_cc_auth = false;

			var isAlreadyShownPleaseSwipeForCheckingIn = false,
				isDuringCheckoutPayment = false,
				callGenerateFolioNumberApiAfterLoadingCurrentBill = false,
				toBillIndex = '';

			// Scope variable to set active bill
			$scope.currentActiveBill = 0;
			// Scope variable used for show/hide rate per day when clicks on each day in calender
			$scope.dayRates = -1;
			// Scope variable used to show addon data
			$scope.showAddonIndex = -1;
			// Scope variable used to show group data
			$scope.showGroupItemIndex = -1;
			// Scope variable used to show room details
			$scope.showRoomDetailsIndex = -1;
			$scope.showActiveBillFeesDetails = 0;
			$scope.showFeesDetails = true;
			$scope.moveToBill = 0;
			// Variable used to show signed signature
			$scope.showSignedSignature = false;
			$scope.showBillingInfo = false;
			$scope.showIncomingBillingInfo = false;
			$scope.reservationBillData = reservationBillData;
			$scope.performCompleteCheckoutAction = false;
			// CICO-6089 : Flag for Guest Bill: Check out without Settlement
			$scope.isCheckoutWithoutSettlement = false;

			// Catching event boradcasted : arAccountCreated
			var listnerArAccount = $rootScope.$on('arAccountCreated', function () {
				var isViaReviewProcess = true;

				$timeout(function () {
					$scope.showAdvancedBillDialog(isViaReviewProcess);
					$scope.$emit("hideLoader");
				}, 100);
			});

			// the listner must be destroyed when no needed anymore
			$scope.$on('$destroy', listnerArAccount);

			// set up flags for checkbox actions
			$scope.hasMoveToOtherBillPermission = function () {
				return ($rootScope.isStandAlone && rvPermissionSrv.getPermissionValue('MOVE_CHARGES_RESERVATION_ACCOUNT'));
			};

			// only for standalone
			var setChargeCodesSelectedStatus = function (bool) {
				if (!$rootScope.isStandAlone) {
					return;
				}
				else {
					var billTabsData = $scope.reservationBillData.bills;
					var chargeCodes = billTabsData[$scope.currentActiveBill].total_fees[0].fees_details;

					var chargeCodesId = [];

					_.each(chargeCodes, function (chargeCode) {
						chargeCode.isSelected = bool;
						chargeCodesId.push(chargeCode.id);
					});
					$scope.reservationBillData.isAllChargeCodeSelected = bool;
				}
			};

			setChargeCodesSelectedStatus(false);

			/*
			* Check if all the items are selected
			*/
			$scope.isAllChargeCodesSelected = function () {
				var isAllChargeCodesSelected = true;
				var billTabsData = $scope.reservationBillData.bills;

				if (!$rootScope.isStandAlone) {
					isAllChargeCodesSelected = false;
				}
				else {
					var chargeCodes = billTabsData[$scope.currentActiveBill].total_fees[0].fees_details;

					if (chargeCodes) {
						if (chargeCodes.length > 0) {
							_.each(chargeCodes, function (chargeCode) {
								if (!chargeCode.isSelected) {
									isAllChargeCodesSelected = false;
								}
							});
						} else {
							isAllChargeCodesSelected = false;
						}
					} else {
						isAllChargeCodesSelected = false;
					}
				}
				return isAllChargeCodesSelected;
			};

			/*
				* Check if selection is partial
				*/
			$scope.isAnyOneChargeCodeIsExcluded = function () {
				var isAnyOneChargeCodeIsExcluded = false;
				var isAnyOneChargeCodeIsIncluded = false;
				var billTabsData = $scope.reservationBillData.bills;

				if (!$rootScope.isStandAlone) {
					isAnyOneChargeCodeIsExcluded = false;
					isAnyOneChargeCodeIsIncluded = false;
				}
				else {
					var chargeCodes = billTabsData[$scope.currentActiveBill].total_fees[0].fees_details;

					if (chargeCodes.length > 0) {
						_.each(chargeCodes, function (chargeCode, index) {
							if (!chargeCode.isSelected) {
								isAnyOneChargeCodeIsExcluded = true;
							}
							else {
								isAnyOneChargeCodeIsIncluded = true;
							}
						});
					}
					else {
						isAnyOneChargeCodeIsExcluded = false;
						isAnyOneChargeCodeIsIncluded = false;
					}
				}

				return isAnyOneChargeCodeIsExcluded && isAnyOneChargeCodeIsIncluded;
			};

			$scope.selectAllChargeCodeToggle = function () {
				$scope.reservationBillData.isAllChargeCodeSelected ? setChargeCodesSelectedStatus(true) : setChargeCodesSelectedStatus(false);
			};


			$scope.moveChargesClicked = function () {
				var billTabsData = $scope.reservationBillData.bills;
				var chargeCodes = billTabsData[$scope.currentActiveBill].total_fees[0].fees_details;
				// Data to pass to the popup
				// 1. Selected transaction ids
				// 2. Confirmation number
				// 3. GuestName
				// 4. CurrentBillNumber
				// 5. Current Bill id

				$scope.moveChargeData = {};
				$scope.moveChargeData.selectedTransactionIds = [];
				var firtName = (typeof $scope.guestCardData.contactInfo.first_name !== "undefined") ? $scope.guestCardData.contactInfo.first_name : "";
				var lastName = (typeof $scope.guestCardData.contactInfo.last_name !== "undefined") ? $scope.guestCardData.contactInfo.last_name : "";

				$scope.moveChargeData.displayName = $scope.reservationBillData.confirm_no + ' ' + lastName + ' ' + firtName;
				$scope.moveChargeData.currentActiveBillNumber = parseInt($scope.currentActiveBill) + parseInt(1);
				$scope.moveChargeData.fromBillId = billTabsData[$scope.currentActiveBill].bill_id;


				if (chargeCodes.length > 0) {
					_.each(chargeCodes, function (chargeCode, index) {
						if (chargeCode.isSelected) {
							if (chargeCode.is_group_by_ref) {
								var concatObject = $scope.moveChargeData.selectedTransactionIds.concat(chargeCode.item_ids);

								$scope.moveChargeData.selectedTransactionIds = concatObject;
							}
							else {
								$scope.moveChargeData.selectedTransactionIds.push(chargeCode.id);
							}
						}
					});
					ngDialog.open({
						template: '/assets/partials/bill/rvMoveTransactionPopup.html',
						controller: 'RVMoveChargeCtrl',
						className: '',
						scope: $scope
					});
				}
				else {
					return;
				}
			};


			$scope.isPrintRegistrationCard = false;

			$scope.isRegistrationCardEnabledFor = {
				austria: $scope.reservationBillData.austrian_registration_card_enabled,
				arabia: $scope.reservationBillData.arabic_registration_card_enabled
			};

			// To send track details on checkin button
			var swipedTrackDataForCheckin = {};

			$scope.reservationBillData.roomChargeEnabled = "";
			$scope.billingData = {};

			$scope.printData = {};
			// This value changes when clicks on pay button
			$scope.fromViewToPaymentPopup = "billcard";
			// options fo signature plugin
			var screenWidth = angular.element($window).width(); // Calculating screen width.

			$scope.signaturePluginOptions = {
				'width': screenWidth - 60,
				'decor-color': 'transparent',
				'height': '320px'
			};

			if ($scope.clickedButton === "checkoutButton") {
				$scope.$emit('HeaderChanged', $filter('translate')('GUEST_BILL_TITLE'));
				$scope.setTitle($filter('translate')('GUEST_BILL_TITLE'));
			} else if ($scope.clickedButton === "checkinButton") {
				$scope.$emit('HeaderChanged', $filter('translate')('REGISTRATION'));
				$scope.setTitle($filter('translate')('REGISTRATION'));
			}
			else {
				$scope.$emit('HeaderChanged', $filter('translate')('GUEST_BILL_TITLE'));
				$scope.setTitle($filter('translate')('GUEST_BILL_TITLE'));
			}

			/**
			* function to get smartband creation along with key creation enabled
			* @return Boolean
			*/
			var isSmartBandKeyCreationAlongWithKeyCreationEnabled = function () {
				return ($scope.reservationBillData.icare_enabled === "true" &&
					$scope.reservationBillData.combined_key_room_charge_create === "true") ? "true" : "false";
			};

			/**
			* function to check whether the user has permission
			* to Edit/Split/Move/Delete charges
			* @return {Boolean}
			*/
			var hasPermissionToChangeCharges = function (type) {
				// hide edit and remove options in case type is  payment
				var hasRemoveAndEditPermission = (type !== "PAYMENT") ? true : false;
				var splitPermission = rvPermissionSrv.getPermissionValue('SPLIT_CHARGES'),
					editChargeCodeDescription = $scope.hasPermissionToEditChargeCodeDescription(),
					editPermission = rvPermissionSrv.getPermissionValue('EDIT_CHARGES'),
					deletePermission = rvPermissionSrv.getPermissionValue('DELETE_CHARGES');

				return ((hasRemoveAndEditPermission && (editPermission || deletePermission)) || splitPermission || editChargeCodeDescription);
			};

			/**
			* function to check whether the user has permission
			* to Edit charge code description.
			* @return {Boolean}
			*/
			$scope.hasPermissionToEditChargeCodeDescription = function () {
				return rvPermissionSrv.getPermissionValue('EDIT_CHARGECODE_DESCRIPTION');
			};

			/**
			* function to check whether the user has permission
			* to Split charges
			* @return {Boolean}
			*/
			$scope.hasPermissionToSplitCharges = function () {
				return rvPermissionSrv.getPermissionValue('SPLIT_CHARGES');
			};

			/**
			* function to check whether the user has permission
			* to Edit charges
			* @return {Boolean}
			*/
			$scope.hasPermissionToEditCharges = function () {
				return rvPermissionSrv.getPermissionValue('EDIT_CHARGES');
			};

			/**
			* function to check whether the user has permission
			* to Delete charges
			* @return {Boolean}
			*/
			$scope.hasPermissionToDeleteCharges = function () {
				return rvPermissionSrv.getPermissionValue('DELETE_CHARGES');
			};

			/**
			* function to check whether the user has permission
			* to make payment
			* @return {Boolean}
			*/
			$scope.hasPermissionToMakePayment = function () {
				return rvPermissionSrv.getPermissionValue('MAKE_PAYMENT');
			};

			/**
			* function to check whether the user has permission
			* to move charges
			* @return {Boolean}
			*/
			$scope.hasPermissionToMoveCharges = function () {
				return rvPermissionSrv.getPermissionValue('MOVE_CHARGES');
			};

			/**
			* function to check whether the user has permission
			* to detokenize CC
			* @return {Boolean}
			*/
			$scope.hasPermissionToDetokenizeCC = function () {
				return rvPermissionSrv.getPermissionValue('DETOKENIZE');
			};
			/**
				* Method to decide whether the signature box should show or not
				* @param {none}
				* @return {Boolean}
				*/
			$scope.showSignaturePad = function () {
				if ($scope.clickedButton === 'checkinButton' && $scope.currentActiveBill === 0) {
					if ($scope.reservationBillData.required_signature_at === 'CHECKIN'
						&& $scope.reservationBillData.signature_details.is_signed === 'false'
						&& !$scope.reservation.reservation_card.is_pre_checkin) {
						return true;
					}
				}

				if (($scope.clickedButton === 'checkoutButton') &&
					($scope.reservationBillData.reservation_status === 'CHECKING_OUT'
						|| $scope.reservationBillData.reservation_status === 'CHECKEDIN')) {
					if ($scope.reservationBillData.required_signature_at === 'CHECKOUT'
						&& (($scope.currentActiveBill + 1) === $scope.reservationBillData.bills.length)) {
						return true;
					}
				}
				return false;
			};
			/**
			* function to check whether the user has permission
			* to Post Room Charge
			* @return {Boolean}
			*/
			$scope.hasPermissionToPostRoomCharge = function () {
				return rvPermissionSrv.getPermissionValue('ENABLE_DISABLE_POST_CHARGES');
			};

			/**
			* function to decide whether to show Move Charge Drop Down
			* @return {Boolean}
			*/
			$scope.showMoveChargeDropDown = function () {
				return ($rootScope.isStandAlone && $scope.hasPermissionToMoveCharges());
			};

			/**
			* function to decide whether to show Enable/Disable Charge Button
			* @return {Boolean}
			*/
			$scope.shouldShowEnableDisableChargeButton = function () {
				return (!$rootScope.isStandAlone && $scope.clickedButton === 'checkinButton' &&
					!$scope.reservationBillData.is_res_posting_control_disabled);
			};

			/**
			* function to decide whether to show Edit charge button
			* @param {String} - Fees type value
			* @return {Boolean}
			*/
			$scope.showEditChargeButton = function (feesType) {
				return ($rootScope.isStandAlone &&
					feesType !== 'TAX' && hasPermissionToChangeCharges(feesType));
			};

			// Refresh registration-content scroller.
			$scope.calculateHeightAndRefreshScroll = function () {
				$timeout(function () {
					$scope.refreshScroller('registration-content');
				}, 500);
			};


			// Whatever permission of Make Payment we are assigning that
			// removing standalone thing here
			$scope.showPayButton = $scope.hasPermissionToMakePayment() && $rootScope.isStandAlone;

			// Calculate the scroll width for bill tabs in all the cases
			$scope.getWidthForBillTabsScroll = function () {
				var width = 0;

				if ($scope.routingArrayCount > 0) {
					width = width + 200;
				}
				if ($scope.incomingRoutingArrayCount > 0) {
					width = width + 275;
				}
				if ($scope.clickedButton === 'checkinButton') {
					width = width + 230;
				}

				width = 168 * $scope.reservationBillData.bills.length + width + 160;
				return width;
			};

			// Initializing reviewStatusArray
			$scope.reviewStatusArray = [];
			$scope.caculateExpenseAmountForPackageAddon = function (expense_details, returnAmount) {
				var inclLength = 0;

				angular.forEach(expense_details, function (elem) {
					if (elem.is_inclusive === true) {
						inclLength++;
					}
				});
				if (inclLength === expense_details.length) {
					return 'INCL';
				} else if (inclLength > 0 && inclLength < expense_details.length) {
					return 'MULTI';
				} else {
					return returnAmount;
				}
			};

			var setBillValue = function (billIndex) {
				var currentBillTabData = reservationBillData.bills[billIndex];

				currentBillTabData.isOpenFeesDetails = (billIndex === 0);
				currentBillTabData.hasFeesArray = true;
				if (currentBillTabData.total_fees.length > 0) {
					currentBillTabData.hasFeesArray = false;
					angular.forEach(currentBillTabData.total_fees[0].fees_details, function (feesValue, feesKey) {

						feesValue.billValue = currentBillTabData.bill_number;// Bill value append with bill details
						feesValue.oldBillValue = currentBillTabData.bill_number;// oldBillValue used to identify the old billnumber
					});
				}
			};

			/*
				 * set the status for the room charge no post button,
				 * on the basis of payment type
				 */
			$scope.setNoPostStatus = function () {

				$scope.reservationBillData.roomChargeEnabled = "";

				if ($scope.reservationBillData.restrict_post) {
					$scope.reservationBillData.roomChargeEnabled = false;
				} else {
					$scope.reservationBillData.roomChargeEnabled = true;
				}
			};

			$scope.getNoPostButtonTiltle = function () {
				return $scope.reservationBillData.roomChargeEnabled ? $filter('translate')('NO_POST_ENABLED') : $filter('translate')('NO_POST_DISABLED');
			};
			var buttonClicked = false;

			$scope.noPostButtonClicked = function () {
				if (!$scope.hasPermissionToPostRoomCharge()) {
					$scope.errorMessage = ["You have no permission to enable or disbable this button!"];
					return false;
				}

				if (buttonClicked) {
					return;
				}
				buttonClicked = true;
				setTimeout(function () {
					buttonClicked = false;
				}, 200);
				$scope.reservationBillData.roomChargeEnabled = !$scope.reservationBillData.roomChargeEnabled;
			};

			$scope.$on('REFRESH_BILLCARD_VIEW', function () {
				setTimeout(function () {
					$scope.isRefreshOnBackToStaycard = true;
					getBillHeaderDetails();
					$scope.$apply();
				}, 1000);
			});

			$scope.refreshBillView = function () {
				$scope.init($scope.lastResBillData);
			};

			$scope.openPleaseSwipe = function () {
				ngDialog.open({
					template: '/assets/partials/payment/rvInitialPleaseSwipeModal.html',
					controller: 'RVPleaseSwipeCtrl',
					className: '',
					scope: $scope,
					closeByDocument: false
				});
			};
			$scope.setNightsString = function () {
				return (reservationBillData.number_of_nights > 1) ? $filter('translate')('NIGHTS') : $filter('translate')('NIGHT');
			};

			/*
			 * Get the title for the billing info button,
			 * on the basis of routes available or not
			 */

			/*
			 * Adding class for active bill
			 */
			$scope.showActiveBill = function (index) {

				var activeBillClass = "",
					activeBill = $scope.reservationBillData.bills[index],
					billCount = $scope.reservationBillData.bills.length,
					isTransactionsExist = activeBill.is_transactions_exist;

				// CICO-37047 : We need to show Remove Bill icon ('X') for -
				// a last bill window having no transactions exist.
				if (index !== 0 && index === $scope.currentActiveBill && (billCount === index + 1) && !isTransactionsExist) {
					activeBillClass = "ui-tabs-active ui-state-active with-button";
				}
				else if (index === $scope.currentActiveBill) {
					activeBillClass = "ui-tabs-active ui-state-active";
				}
				return activeBillClass;

			};
			/*
			 * Remove class hidden for day rates
			 * @param {int} index of calender days
			 * @param {string} clickedDate
			 * @param {string} checkoutDate
			 */
			$scope.showDayRates = function (dayIndex, clickedDate, checkoutDate, numberOfNights) {
				// In this condition show the last clicked days item
				// OR if checkout date clicked first do not show anything
				if (clickedDate === checkoutDate) {
					if (numberOfNights === 0) {
						$scope.dayRates = dayIndex;
					} else {
						$scope.dayRates = $scope.dayRates;
					}

				} else if ($scope.dayRates !== dayIndex) {
					$scope.dayRates = dayIndex;

				} else {
					$scope.dayRates = -1;
				}
				$scope.showAddonIndex = -1;
				$scope.showGroupItemIndex = -1;
				$scope.calculateHeightAndRefreshScroll();

			};
			/*
			 * To get the clicked bill data
			 * @param billIndex index of bill
			 */
			$scope.getBillData = function (billIndex) {

				var getBillDataSuccess = function (data) {

					$scope.reservationBillData.bills[billIndex] = data;

					setBillValue(billIndex);
					$scope.setActiveBill(billIndex);
					$scope.setupReviewStatusArray();
					if (isDuringCheckoutPayment) {
						$scope.moveToNextBillAfterSuccessPaymentDuringCheckout();
					}
					if (callGenerateFolioNumberApiAfterLoadingCurrentBill) {
						that.callGenerateFolioNumberApi();
					}

					$scope.refreshScroller('bill-tab-scroller');
				};

				var	dataToSend = {
					params: reservationBillData.bills[billIndex].bill_id,
					successCallBack: getBillDataSuccess
				};

				$scope.callAPI(RVBillCardSrv.fetchBillData, dataToSend);
			};

			$scope.setBillAddressType = function () {
				$scope.reservationBillData.bills[0].bill_address_type = $scope.reservationBillData.bills[0].bill_address_type === 'COMPANY' ? 'GUEST' : 'COMPANY';
				$timeout(function () {
					var dataToSend = {
						params: {
							"parmasToApi": {
								"bill_address_type": $scope.reservationBillData.bills[0].bill_address_type
							},
							"bill_id": $scope.reservationBillData.bills[$scope.currentActiveBill].bill_id
						}
					};

					$scope.callAPI(RVBillCardSrv.setBillAddressType, dataToSend);
				}, 800);
			};
			/*
			 * Set clicked bill active and show corresponding days/packages/addons calender
			 * @param {int} index of bill
			 */
			$scope.setActiveBill = function (billIndex) {

				$scope.currentActiveBill = billIndex;
				$scope.showActiveBillFeesDetails = billIndex;
				$scope.calculateHeightAndRefreshScroll();
				setChargeCodesSelectedStatus(false);
				$scope.selectedAllowanceReference = '';
			};
			/* $state
			 * Show Addons
			 * @param {int} addon index
			 */
			$scope.showAddons = function (addonIndex) {
				$scope.showAddonIndex = ($scope.showAddonIndex !== addonIndex) ? addonIndex : -1;
				$scope.dayRates = -1;
				$scope.showGroupItemIndex = -1;
				$scope.calculateHeightAndRefreshScroll();
				$scope.selectedAllowanceReference = '';
			};
			/*
			 * Show Group Items
			 * @param {int} group index
			 */
			$scope.showGroupItems = function (groupIndex) {
				$scope.dayRates = -1;
				$scope.showGroupItemIndex = ($scope.showGroupItemIndex !== groupIndex) ? groupIndex : -1;
				$scope.showAddonIndex = -1;
				$scope.calculateHeightAndRefreshScroll();
				$scope.selectedAllowanceReference = '';
			};
			/*
			 * Show Room Details
			 * @param {int} each day room index
			 */
			$scope.showRoomDetails = function (roomDetailsIndex) {
				$scope.selectedAllowanceReference = '';
				// Condition added to do toggle action - Room details area
				if ($scope.showRoomDetailsIndex === roomDetailsIndex) {
					$scope.showRoomDetailsIndex = -1;
				} else {
					$scope.showRoomDetailsIndex = roomDetailsIndex;
				}
				$scope.calculateHeightAndRefreshScroll();
			};

			$scope.showAllowanceDetails = function (billNumber) {
				$scope.dayRates = -1;
				$scope.showGroupItemIndex = -1;
				$scope.showRoomDetailsIndex = -1;
				$scope.showAddonIndex = -1;
				if ($scope.selectedAllowanceReference === billNumber) {
					$scope.selectedAllowanceReference = '';
					return;
				}
				$scope.selectedAllowanceReference = billNumber;
			};
			/*
			 * To get class of balance red/green
			 * @param {string} balance amount
			 */
			$scope.getBalanceClass = function (balanceAmount) {
				var balanceClass = "";

				if (balanceAmount === 0 || balanceAmount === "0.00" || balanceAmount === "0.0") {
					balanceClass = "green";
				} else {
					balanceClass = "red";
				}
				return balanceClass;
			};
			/*
			 * To show not defined in payment display area
			 * @param {string} payment Type
			 */
			$scope.showNotDefined = function (paymentType) {
				var isShowNotDefined = true;

				if (paymentType === 'CC' || paymentType === 'CC' || paymentType === 'CC' || paymentType === 'CC') {
					isShowNotDefined = false;
				}
			};
			$scope.toggleFeesDetails = function (billIndex) {
				var length = 0;

				if (typeof $scope.reservationBillData.bills[$scope.currentActiveBill].total_fees[0] !== 'undefined') {
					length = $scope.reservationBillData.bills[$scope.currentActiveBill].total_fees[0].fees_details.length;
					if (length > 0) {
						$scope.reservationBillData.bills[billIndex].isOpenFeesDetails = !$scope.reservationBillData.bills[billIndex].isOpenFeesDetails;
						$scope.calculateHeightAndRefreshScroll();
					}
				}
			};
			/*
			 * Set up the data to generate folio number
			 */
			that.callGenerateFolioNumberApi = function (index) {
				callGenerateFolioNumberApiAfterLoadingCurrentBill = false;
				var billIndex = (index) ? index : $scope.currentActiveBill;

				var currentActiveBill = $scope.reservationBillData.bills[billIndex];

				that.generateFolioNumber(currentActiveBill.bill_id, currentActiveBill.total_fees[0].balance_amount, currentActiveBill.is_folio_number_exists, billIndex);
				if (index) {
					callGenerateFolioNumberApiAfterLoadingCurrentBill = true;
					$scope.getBillData($scope.currentActiveBill);
				}
			};

			/*
			* Success callback of fetch - After moving fees item from one bill to another
			*/
			$scope.fetchSuccessCallback = function (data) {
				$scope.$emit('hideLoader');
				reservationBillData = data;
				$scope.init(data);
				$scope.calculateBillDaysWidth();
			};

			$scope.moveToBillActionfetchSuccessCallback = function (data) {
				$scope.fetchSuccessCallback(data);
			};
			/*
			 * MOve fees item from one bill to another
			 * @param {int} old Bill Value
			 * @param {int} fees index
			 */
			$scope.moveToBillAction = function (oldBillValue, feesIndex) {
				var parseOldBillValue = parseInt(oldBillValue) - 1;
				var feesDetails = $scope.reservationBillData.bills[parseOldBillValue].total_fees[0].fees_details;
				var newBillValue = feesDetails[feesIndex].billValue,
					transactionId = feesDetails[feesIndex].transaction_id,
					id = (feesDetails[feesIndex].id) ? feesDetails[feesIndex].id : null,
					itemIdList = (feesDetails[feesIndex].item_ids) ? feesDetails[feesIndex].item_ids : [],
					isGroupByRef = feesDetails[feesIndex].is_group_by_ref;
				var dataToMove = {
					'reservation_id': $scope.reservationBillData.reservation_id,
					'to_bill': newBillValue,
					'from_bill': oldBillValue,
					'transaction_id': transactionId,
					'id': id,
					'item_ids': itemIdList
				};

				/*
				 * Success Callback of move action
				 */
				var moveToBillSuccessCallback = function (response) {
					$scope.$emit('hideLoader');
					$scope.movedIndex = parseInt(newBillValue) - 1;
					if (parseInt(response.data[0].to_bill_number) === parseInt(newBillValue)) {
						$scope.reservationBillData.bills[parseInt(response.data[0].to_bill_number) - 1] = {
							bill_id: response.data[0].to_bill_id,
							bill_number: response.data[0].to_bill_number,
							total_amount: response.data[0].bill_amount,
							routed_entity_type: response.data[0].routed_entity_type,
							guest_image: response.data[0].guest_image
						};
					}

					var reservationStatus = $scope.reservationBillData.reservation_status;

					$scope.getBillData($scope.currentActiveBill);

				};

				/*
				 * Failure Callback of move action
				 */
				var moveToBillFailureCallback = function (errorMessage) {
					$scope.$emit('hideLoader');
					$scope.errorMessage = errorMessage;
				};

				$scope.invokeApi(RVBillCardSrv.movetToAnotherBill, dataToMove, moveToBillSuccessCallback, moveToBillFailureCallback);
			};
			/*
			 * To add class active if fees is open
			 * @param {bool} - new data added along with bill data for each bill
			 */
			$rootScope.allowPmtWithGiftCard = false;
			$scope.cardsListSuccess = function (data) {
				$scope.fetchPmtList = true;
				$scope.allowPmtWithGiftCard = false;
				$rootScope.allowPmtWithGiftCard = false;
				$scope.$emit('hideLoader');
				for (var i in data) {
					if (data[i].name === "GIFT_CARD") {
						$scope.allowPmtWithGiftCard = true;
						$rootScope.allowPmtWithGiftCard = true;
					}
				}
			};
			$scope.fetchPmtList = false;
			$scope.showFeesDetailsOpenClose = function (openCloseStatus) {
				if (!$rootScope.isStandAlone) {// CICO-19009 adding gift card support, used to validate gift card is enabled
					if (!$scope.fetchPmtList) {
						$scope.fetchPmtList = true;
						$scope.invokeApi(RVPaymentSrv.fetchAvailPayments, {}, $scope.cardsListSuccess);
					}
				}

				var length = 0;
				var openCloseClass = " ";

				if (typeof $scope.reservationBillData.bills[$scope.currentActiveBill].total_fees[0] !== 'undefined') {
					length = $scope.reservationBillData.bills[$scope.currentActiveBill].total_fees[0].fees_details.length;
				}
				if (openCloseStatus && length === 0) {
					openCloseClass = " ";
				}
				else if (openCloseStatus && length > 0) {
					openCloseClass = "has-arrow active";
				}
				else if (!openCloseStatus && length > 0) {
					openCloseClass = "has-arrow";
				}

				return openCloseClass;
			};
			/*
			 * To show/hide fees details on click arrow
			 */
			$scope.showFeesDetailsClass = function (showFeesStatus) {
				var showFeesClass = "hidden";

				if (showFeesStatus) {
					showFeesClass = "";
				}
				return showFeesClass;
			};
			/*
			 * Show guest balance OR balance depends on reservation status
			 * @param {string} reservation status
				 */
			$scope.showGuestBalance = function (reservationStatus) {
				var showGuestBalance = false;

				if (reservationStatus === 'CHECKING_IN' || reservationStatus === 'NOSHOW_CURRENT') {
					showGuestBalance = true;
				}
				return showGuestBalance;
			};

			/**
			* function to check whether the user has permission
			* to to proceed Direct Bill payment
			* @return {Boolean}
			*/
			$scope.hasPermissionToDirectBillPayment = function () {
				return rvPermissionSrv.getPermissionValue('DIRECT_BILL_PAYMENT');
			};

			// Method to check whether the current active bill is having payment type = DB and,
			// attached with a company/ta card , which is having a AR Account.
			$scope.checkPaymentTypeIsDirectBill = function () {
				var isPaymentTypeDirectBill = false,
					currentActiveBill = $scope.reservationBillData.bills[$scope.currentActiveBill];

				if (currentActiveBill.is_account_attached && (currentActiveBill.credit_card_details.payment_type === 'DB') && $scope.hasPermissionToDirectBillPayment()) {
					isPaymentTypeDirectBill = true;
				}

				return isPaymentTypeDirectBill;
			};

			var fetchPaymentTypesAndOpenPaymentModal = function (passData, paymentData) {

				$scope.callAPI(RVPaymentSrv.renderPaymentScreen, {
					params: {
						direct_bill: $scope.checkPaymentTypeIsDirectBill()
					},
					onSuccess: function (response) {
						paymentData.paymentTypes = response;
						// close any ngDialogs if opened (work around fix)
						ngDialog.close($rootScope.LastngDialogId, "");
						$scope.openPaymentDialogModal(passData, paymentData);
					}
				});
			};

			$scope.addNewPaymentModal = function (swipedCardData) {
				// Current active bill is index - adding 1 to get billnumber
				var billNumber = parseInt($scope.currentActiveBill) + parseInt(1);
				var passData = {
					"reservationId": $scope.reservationBillData.reservation_id,
					"fromView": $scope.fromViewToPaymentPopup,
					"fromBill": billNumber,
					"is_swiped": false,
					"details": {
						"firstName": $scope.guestCardData.contactInfo.first_name,
						"lastName": $scope.guestCardData.contactInfo.last_name
					}
				};
				var paymentData = $scope.reservationBillData;

				if ($scope.clickedButton === "checkinButton") {
					if (!$scope.paymentModalSwipeHappened && swipedCardData !== undefined) {
						$scope.isSwipeHappenedDuringCheckin = true;
						swipedTrackDataForCheckin = swipedCardData;
						if (!$scope.putInQueue) passData.details.isClickedCheckin = true;
					}
				}

				if (swipedCardData === undefined) {
					passData.showDoNotAuthorize = ($scope.clickedButton === "checkinButton" && $rootScope.isStandAlone);
					$scope.setScroller('cardsList');
					$scope.addmode = false;
					passData.details.hideDirectBill = true;
					fetchPaymentTypesAndOpenPaymentModal(passData, paymentData);

				} else {

					var swipeOperationObj = new SwipeOperation();
					var swipedCardDataToRender = swipeOperationObj.createSWipedDataToRender(swipedCardData);

					passData.details.swipedDataToRenderInScreen = swipedCardDataToRender;
					if (swipedCardDataToRender.swipeFrom !== "payButton" && swipedCardDataToRender.swipeFrom !== 'billingInfo') {
						fetchPaymentTypesAndOpenPaymentModal(passData, paymentData);
					} else if (swipedCardDataToRender.swipeFrom === "payButton") {
						$scope.$broadcast('SHOW_SWIPED_DATA_ON_PAY_SCREEN', swipedCardDataToRender);
					}
					else if (swipedCardDataToRender.swipeFrom === "billingInfo") {
						$scope.$broadcast('SHOW_SWIPED_DATA_ON_BILLING_SCREEN', swipedCardDataToRender);
					}

				}
			};

			/*
			 * Refresh scroll once page is loaded.
			 */
			$scope.$on('$viewContentLoaded', function () {
				setTimeout(function () {
					$scope.refreshScroller('registration-content');
					$scope.refreshScroller('billDays');
					$scope.refreshScroller('bill-tab-scroller');
				},
					3000);
			});

			$scope.addListener('STAY_ON_BILL', function () {
				$scope.isMessagePopupDuringCheckout = false;
				$scope.reservationBillData.reservation_status = "CHECKEDOUT";
				$scope.getBillData($scope.currentActiveBill);
			});


			/*
		 * Handle swipe action in bill card
		 */

			$scope.$on('SWIPE_ACTION', function (event, swipedCardData) {
				if (!$scope.isGuestCardVisible) {

					// commenting out the below code to close ngDialog which is wrong
					// The broadcast event will not happpen if the dialog is closed. - CICO-21772

					// ngDialog.close();//close the dialog if one exists, set data after, so duplicates are not created
					// this needs to be moved after 1.13.0 to better detect where the swipe happens and do proper broadcasts to set carddata
					if ($scope.paymentModalOpened) {
						swipedCardData.swipeFrom = "payButton";
					} else if ($scope.billingInfoModalOpened) {
						swipedCardData.swipeFrom = "billingInfo";
					} else {
						swipedCardData.swipeFrom = "viewBill";
					}
					var swipeOperationObj = new SwipeOperation();
					var getTokenFrom = swipeOperationObj.createDataToTokenize(swipedCardData);
					var tokenizeSuccessCallback = function (tokenValue) {
						$scope.$emit('hideLoader');
						swipedCardData.token = tokenValue;
						$scope.addNewPaymentModal(swipedCardData);
						$scope.swippedCard = true;
					};

					$scope.invokeApi(RVReservationCardSrv.tokenize, getTokenFrom, tokenizeSuccessCallback);
				}
			});

			/*
			 * Clicked pay button function
			 */
			$scope.clickedPayButton = function (isViaReviewProcess) {

				// To check for ar account details in case of direct bills
				if ($scope.isArAccountNeeded($scope.currentActiveBill)) {
					return;
				}

				$scope.paymentModalOpened = true;
				$scope.removeDirectPayment = true;

				if (isViaReviewProcess) {
					$scope.isViaReviewProcess = true;
				}
				else {
					$scope.isViaReviewProcess = false;
				}

				// changes for CICO-13763
				var reservationData = { "reservation_id": $scope.reservationData.reservationId, "is_checkout": $scope.reservationBillData.isCheckout };

				var paymentParams = $scope.reservationBillData.isCheckout ? reservationData : {};

				paymentParams.direct_bill = $scope.checkPaymentTypeIsDirectBill();
				paymentParams.bill_id = $scope.reservationBillData.bills[$scope.currentActiveBill].bill_id;

				$scope.invokeApi(RVPaymentSrv.renderPaymentScreen, paymentParams, function (data) {
					// NOTE: Obtain the payment methods and then open the payment popup
					$scope.paymentTypes = data;
					ngDialog.open({
						template: '/assets/partials/payment/rvReservationBillPaymentPopup.html',
						className: '',
						controller: 'RVBillPayCtrl',
						closeByDocument: false,
						scope: $scope
					});
				});
			};
			$scope.clickedAddUpdateCCButton = function () {
				$scope.fromViewToPaymentPopup = "billcard";
				$scope.isRefreshOnBackToStaycard = true; // CICO-17739 Refresh view when returning from staycard after altering the payment method.
				$scope.addNewPaymentModal();
			};
			$scope.$on('OPENPAYMENTMODEL', function () {
				$scope.clickedAddUpdateCCButton();
			});
			/*
			 * Toggle signature display
			 */
			$scope.showSignature = function () {
				$scope.showSignedSignature = !$scope.showSignedSignature;
				$scope.calculateHeightAndRefreshScroll();
			};

			var openPaymentList = function (data) {
				$scope.dataToPaymentList = data;
				$scope.dataToPaymentList.isFromBillCard = true;
				ngDialog.open({
					template: '/assets/partials/payment/rvShowPaymentList.html',
					controller: 'RVShowPaymentListCtrl',
					className: '',
					scope: $scope
				});
			};

			$scope.openDetokenizationPopup = function () {
				var jwt = localStorage.getItem('jwt') || '';

				$scope.detokenizeUrl = PAYMENT_CONFIG[$scope.hotelDetails.payment_gateway].iFrameUrl + '?' + "reservation_id=" + $scope.reservationBillData.reservation_id +
					"&token=" + $scope.reservationBillData.bills[$scope.currentActiveBill].credit_card_details.token +
					"&auth_token=" + jwt + "&hotel_uuid=" + sntAuthorizationSrv.getProperty();
				ngDialog.open({
					template: '/assets/partials/payment/rvDetokenizeCC.html',
					className: '',
					scope: $scope
				});
				$scope.startActivity("iframe");
				$timeout(function () {
					$scope.stopActivity("iframe");
				}, 8000);
			};
			/*
			 * Show the payment list of guest card for selection
			 */

			$scope.showPaymentList = function () {
				$scope.reservationBillData.currentView = "billCard";
				$scope.reservationBillData.currentActiveBill = $scope.currentActiveBill;
				openPaymentList($scope.reservationBillData);
			};

			$scope.$on('paymentChangedToCC', function () {
				$scope.reservationBillData.restrict_post = false;
				$scope.reservationBillData.roomChargeEnabled = true;
			});

			$scope.clickedAddCharge = function (activeBillNo) {
				if (!!$scope.reservationBillData.restrict_post) {
					$scope.selectedBillNumber = activeBillNo;
					$scope.restrict_post = $scope.reservationBillData.restrict_post;
					ngDialog.open({
						template: '/assets/partials/postCharge/restrictPost.html',
						className: '',
						scope: $scope
					});
				} else {
					$scope.openPostCharge(activeBillNo);
				}

			};

			$scope.openPostCharge = function (activeBillNo) {

				$scope.callAPI(RVBillCardSrv.fetchAdjustmentReasons, {
					successCallBack: function (response) {
						$scope.adjustmentReasonOptions = response.force_adjustment_reasons;
						$scope.showAdjustmentReason = response.force_adjustment_reason_enabled;
					}
				});
				// Show a loading message until promises are not resolved
				$scope.$emit('showLoader');

				jsMappings.fetchAssets(['postcharge', 'directives'])
					.then(function () {

						$scope.$emit('hideLoader');

						// pass on the reservation id
						$scope.reservation_id = $scope.reservationBillData.reservation_id;

						// pass down active bill no

						$scope.billNumber = activeBillNo;

						// translating this logic as such from old Rover
						// api post param 'fetch_total_balance' must be 'false' when posted from 'staycard'
						// Also passing the available bills to the post charge modal
						$scope.fetchTotalBal = false;

						var bills = [];

						for (var i = 0; i < $scope.reservationBillData.bills.length; i++) {
							bills.push(i + 1);
						}

						$scope.fetchedData = {};
						$scope.fetchedData.bill_numbers = bills;
						$scope.isOutsidePostCharge = false;
						$scope.shouldShowChargesForMobile = false;

						ngDialog.open({
							template: '/assets/partials/postCharge/rvPostChargeV2.html',
							className: '',
							scope: $scope
						});
					});


			};

			$scope.$on('paymentTypeUpdated', function () {
				$scope.getBillData($scope.currentActiveBill);
			});

			$scope.$on('cc_auth_updated', function ($event, do_not_cc_auth) {
				$scope.do_not_cc_auth = do_not_cc_auth;
			});
			/*
			 * Show tax exempt waring message in a popup
			 * @data response data
			 */
			var showTaxExemptAlertMessage = function (data) {
				$scope.message = data.message;
				$timeout(function () {
					ngDialog.open({
						template: '/assets/partials/bill/rvShowMessagePopup.html',
						className: '',
						closeByDocument: false,
						scope: $scope
					});
				}, 1000);
			};

			// just fetch the bills again ;)
			var postchargeAdded = $scope.$on('postcharge.added', function (event, data) {

				$scope.refreshScroller('bill-tab-scroller');

				// cos' we are gods, and this is what we wish
				// just kidding.. :P
				$scope.isRefreshOnBackToStaycard = true;

				if (data.message) {
					showTaxExemptAlertMessage(data);
				}

				var reservationStatus = $scope.reservationBillData.reservation_status;
				
				// To update the bill headers, after post charges added
				getBillHeaderDetails();
			});

			var routingAdded = $scope.$on('SHOW_TAX_EXEMPT_ALERT_MESSAGE', function (event, data) {

				if (data.tax_exempt_warning) {
					showTaxExemptAlertMessage();
				}
			});

			// Reload bill card when routing popup is dismissed
			$scope.$on('routingPopupDismissed', function (event) {

				$scope.isRefreshOnBackToStaycard = true;
				$scope.getBillData($scope.currentActiveBill);
			});

			/*
		 * Go back to staycard - Depends on changes in bill do refresh or not
		 */
			$scope.goBackToStayCard = function () {
				var reservationId = $scope.reservationBillData.reservation_id,
					confirmationNumber = $scope.reservationBillData.confirm_no;

				if ($scope.isRefreshOnBackToStaycard) {
					$state.go("rover.reservation.staycard.reservationcard.reservationdetails", { "id": reservationId, "confirmationId": confirmationNumber, "isrefresh": true });
				} else {
					$state.go("rover.reservation.staycard.reservationcard.reservationdetails", { "id": reservationId, "confirmationId": confirmationNumber });
				}
			};

			// the listner must be destroyed when no needed anymore
			$scope.$on('$destroy', postchargeAdded);
			$scope.$on('$destroy', routingAdded);

			$scope.closeDialog = function () {
				ngDialog.close();
			};

			/*
			 * Used to add class with respect to different status
			 * @param {string} reservationStatus
			 * @param {string} room status
			 * @param {string} fo status
			 */
			$scope.getRoomClass = function (reservationStatus, roomStatus, foStatus, roomReadyStatus, checkinInspectedOnly) {
				var reservationRoomStatusClass = "";

				if (reservationStatus === 'CHECKING_IN') {

					if (roomReadyStatus !== '') {
						if (foStatus === 'VACANT') {
							switch (roomReadyStatus) {

								case "INSPECTED":
									reservationRoomStatusClass = ' room-green';
									break;
								case "CLEAN":
									if (checkinInspectedOnly === "true") {
										reservationRoomStatusClass = ' room-orange';
										break;
									} else {
										reservationRoomStatusClass = ' room-green';
										break;
									}
									break;
								case "PICKUP":
									reservationRoomStatusClass = " room-orange";
									break;

								case "DIRTY":
									reservationRoomStatusClass = " room-red";
									break;

							}

						} else {
							reservationRoomStatusClass = "room-red";
						}

					}
				}
				return reservationRoomStatusClass;
			};

			$scope.showDays = function (date, checkoutDate, numberOfNights, place) {
				var showDay = false;

				if (place === 'checkout') {
					if (date === checkoutDate && numberOfNights !== 0) {
						showDay = true;
					}
				} else {
					if (date === checkoutDate && numberOfNights === 0) {
						showDay = true;
					} else if (date !== checkoutDate) {
						showDay = true;
					}
				}
				return showDay;

			};
			$scope.getDaysClass = function (index, dayDate, checkinDate, checkoutDate, businessDate) {
				var dayClass = "";

				if (index !== 0) {
					dayClass = "hidden";
				}
				if (dayDate === checkinDate) {
					dayClass = "check-in active";
				}
				if (dayDate !== checkoutDate) {
					if (dayDate <= businessDate) {
						dayClass = "active";
					}
				}
				if (dayDate === checkoutDate && dayDate !== checkinDate) {
					if (reservationBillData.bills[$scope.currentActiveBill]) {
						if (reservationBillData.bills[$scope.currentActiveBill].addons !== undefined && reservationBillData.bills[$scope.currentActiveBill].addons.length > 0) {
							dayClass = "check-out last";
						} else {
							dayClass = "check-out";
						}
					}
				}
				return dayClass;
			};

			$scope.caculateExpenseAmountForPackageAddon = function (expense_details, returnAmount) {
				var inclLength = 0;

				angular.forEach(expense_details, function (elem) {
					if (elem.is_inclusive === true) {
						inclLength++;
					}
				});
				if (inclLength === expense_details.length) {
					return 'INCL';
				} else if (inclLength > 0 && inclLength < expense_details.length) {
					return 'MULTI';
				} else {
					return returnAmount;
				}
			};
			$scope.showBillingInfoHandle = function () {
				$scope.showBillingInfo = !$scope.showBillingInfo;
				$scope.calculateHeightAndRefreshScroll();
			};
			$scope.showIncomingBillingInfoHandle = function () {
				$scope.showIncomingBillingInfo = !$scope.showIncomingBillingInfo;
				$scope.calculateHeightAndRefreshScroll();
			};

			// To enable scroll
			$scope.enableScroll = function () {
				$scope.$parent.myScroll['registration-content'].enable();
			};
			// To disable scroll
			$scope.disableScroll = function () {
				$scope.$parent.myScroll['registration-content'].disable();
				// Adding class 'pad' for styling the cursor for signature pad on initial hover on signature pad.
				if (!angular.element($("#signature canvas")).hasClass('pad')) {
					angular.element($("#signature canvas")).addClass('pad');
				}
			};
			// To clear signature
			$scope.clickedClearSignature = function () {
				$("#signature").jSignature("clear");	// Against angular js practice ,TODO: check proper solution using ui-jq to avoid this.
			};
			/*
			 * success callback ofcomplete checkin
			 */

			$scope.continueWithoutCC = function () {
				$scope.reservationBillData.is_cc_authorize_at_checkin_enabled = false;
				$scope.clickedCompleteCheckin(true);
				$scope.closeDialog();
			};

			$scope.continueAfterSuccessAuth = function () {
				$scope.triggerKeyCreationProcess();
				$scope.closeDialog();
			};

			// Normal checkin process success.
			$scope.completeCheckinSuccessCallback = function (data) {
				// CICO-6109 : Without Authorization flow ..
				$scope.$emit('hideLoader');
				$scope.reservationBillData.room_pin = data.room_pin;
				$scope.triggerKeyCreationProcess();
			};

			// Success after autherization
			$scope.completeCheckinAuthSuccessCallback = function (data) {

				$scope.$emit('hideLoader');

				// CICO-6109 : With Authorization flow .: Auth Success
				if (data.check_in_status === "Success") {
					$scope.isInProgressScreen = false;
					$scope.isSuccessScreen = true;
					$scope.isFailureScreen = false;
					$scope.cc_auth_amount = data.cc_auth_amount;
					$scope.cc_auth_code = data.cc_auth_code;
					$scope.reservationBillData.bills[$scope.currentActiveBill].credit_card_details.auth_color_code = 'green';
				}
				else {
					// CICO-6109 : With Authorization flow .: Auth declined
					$scope.isInProgressScreen = false;
					$scope.isSuccessScreen = false;
					$scope.isFailureScreen = true;
					$scope.cc_auth_amount = data.cc_auth_amount;
					$scope.reservationBillData.bills[$scope.currentActiveBill].credit_card_details.auth_color_code = 'red';
				}
			};

			$scope.triggerKeyCreationProcess = function () {

				var keySettings = $scope.reservationBillData.key_settings;

				$scope.viewFromBillScreen = true;
				$scope.fromView = "checkin";
				// As per CICO-29735
				if (keySettings !== "no_key_delivery" && keySettings !== "pin") {
					// show email popup
					if (keySettings === "email") {

						ngDialog.open({
							template: '/assets/partials/keys/rvKeyEmailPopup.html',
							controller: 'RVKeyEmailPopupController',
							className: '',
							closeByDocument: false,
							scope: $scope
						});
					}
					else if (keySettings === "qr_code_tablet") {

						// Fetch and show the QR code in a popup
						var reservationId = $scope.reservationBillData.reservation_id;

						var successCallback = function (data) {
							$scope.$emit('hideLoader');
							$scope.data = data;
							ngDialog.open({
								template: '/assets/partials/keys/rvKeyQrcodePopup.html',
								controller: 'RVKeyQRCodePopupController',
								className: '',
								scope: $scope
							});
						};

						$scope.invokeApi(RVKeyPopupSrv.fetchKeyQRCodeData, { "reservationId": reservationId }, successCallback);
					}

					// Display the key encoder popup
					// https://stayntouch.atlassian.net/browse/CICO-21898?focusedCommentId=58632&page=com.atlassian.jira.plugin.system.issuetabpanels:comment-tabpanel#comment-58632
					else if (keySettings === "encode" || keySettings === "mobile_key_encode") {
						// when checking in we are creating a new key, popup controller expects this flag.
						if ($scope.reservationData && $scope.reservationData.status && $scope.reservationData.status === 'CHECKING_IN') {
							$scope.keyType = 'New';
							$rootScope.$broadcast('MAKE_KEY_TYPE', { type: 'New' });
						}

						if ($scope.reservationBillData.is_remote_encoder_enabled && $scope.encoderTypes !== undefined && $scope.encoderTypes.length <= 0) {
							fetchEncoderTypes();
						} else {
							openKeyEncodePopup();
						}
					}
				} else {
					// if No key encode chosen, skip key display and proceed straight to stay card
					$scope.isRefreshOnBackToStaycard = true;
					$scope.goBackToStayCard();
				}
			};

			var openKeyEncodePopup = function () {
				$scope.isSmartbandCreateWithKeyWrite = isSmartBandKeyCreationAlongWithKeyCreationEnabled();
				ngDialog.open({
					template: '/assets/partials/keys/rvKeyEncodePopup.html',
					controller: 'RVKeyEncodePopupCtrl',
					className: '',
					closeByDocument: false,
					scope: $scope
				});
			};

			// Fetch encoder types for SAFLOK_MSR
			var fetchEncoderTypes = function () {
				var encoderFetchSuccess = function (data) {
					$scope.$emit('hideLoader');
					$scope.encoderTypes = data;
					openKeyEncodePopup();
				};

				$scope.invokeApi(RVKeyPopupSrv.fetchActiveEncoders, {}, encoderFetchSuccess);
			};


			$scope.completeCheckinFailureCallback = function (data) {
				$scope.$emit('hideLoader');
				$scope.errorMessage = data;
				// Some error in checkin process - auth popup closing..
				$scope.closeDialog();
			};

			$scope.goToStayCardFromAddToQueue = function () {
				$scope.isRefreshOnBackToStaycard = true;
				$scope.goBackToStayCard();
			};


			$scope.checkGuestInFromQueue = false;
			if (!$rootScope.reservationBillWatch) {// alternative to $destroy, this is an init-once method
				$rootScope.reservationBillWatch = 1;

				$rootScope.$on('goToStayCardFromAddToQueue', function () {
					$scope.goToStayCardFromAddToQueue();

				});
				$rootScope.$on('checkGuestInFromQueue', function () {
					$scope.checkGuestInFromQueue = true;
					// if checking guest in from queue, then signature details should have already been collected, dont re-submit the signature, this will fix an issue getting internal server error
					var signature = 'isSigned';
					//  signature = $scope.reservationBillData.signature_details.signed_image;

					$scope.initCompleteCheckin(false, signature);
				});
			}

			// CICO-13907
			$scope.hasAnySharerCheckedin = function () {
				var isSharerCheckedin = false;

				angular.forEach($scope.reservationBillData.sharer_information, function (sharer, key) {
					if (sharer.reservation_status === 'CHECKEDIN' || sharer.reservation_status === 'CHECKING_OUT') {
						isSharerCheckedin = true;
						return false;
					}
				});
				return isSharerCheckedin;
			};

			$scope.putInQueueAdvanced = function (saveData) {
				var reservationId = $scope.reservationBillData.reservation_id;

				$scope.reservationData.check_in_via_queue = false;// set flag for checking in via put-in-queue

				var data = {
					"reservationId": reservationId,
					"status": "true"
				};

				if (saveData && saveData.signature !== '[]') {
					data.signature = saveData.signature;
				}
				if (saveData.is_promotions_and_email_set !== undefined) {
					data.is_promotions_and_email_set = saveData.is_promotions_and_email_set;
				}
				data.viaAdvancedQueue = true;

				$scope.invokeApi(RVReservationCardSrv.modifyRoomQueueStatus, data, $scope.successPutInQueueCallBack, $scope.failPutInQueueCallBack);
			};

			$scope.successPutInQueueCallBack = function () {
				var useAdvancedQueueFlow = $rootScope.advanced_queue_flow_enabled;
				var roomKeyDelivery = $scope.reservationBillData.key_settings; // as per CICO-29735

				$scope.$emit('hideLoader');
				$scope.reservationData.reservation_card.is_reservation_queued = "true";
				$scope.$emit('UPDATE_QUEUE_ROOMS_COUNT', 'add');
				RVReservationCardSrv.updateResrvationForConfirmationNumber($scope.reservationData.reservation_card.reservation_id, $scope.reservationData);

				if (useAdvancedQueueFlow && roomKeyDelivery !== "no_key_delivery") {
					setTimeout(function () {
						// signal rvReservationRoomStatusCtrl to init the keys popup
						$rootScope.$broadcast('clickedIconKeyFromQueue');
					}, 1250);
					$scope.goToStayCardFromAddToQueue();
				} else {
					$scope.goToStayCardFromAddToQueue();
				}
			};
			$scope.failPutInQueueCallBack = function (err) {
				$scope.$emit('hideLoader');
				$scope.errorMessage = err;
			};


			// Handle checkin process with Autherization..
			var performCCAuthAndCheckinProcess = function (data, isCheckinWithoutAuth, queueRoom) {
				/*
				 * put in Queue should not attempt to auth CC during normal workflow in Overlay,
				 * in Standalone, $scope.putInQueue should always be false; (until we start supporting standalone put in queue)
				 */

				// check if the T&C was shown, if shown pass true if was accepted
				if ($scope.reservationBillData.is_disabled_terms_conditions_checkin === 'false') {
					data.accepted_terms_and_conditions = $scope.saveData.termsAndConditions;
				}

				if (isCheckinWithoutAuth || ($scope.putInQueue && !$scope.checkGuestInFromQueue) || queueRoom === true) {
					// $scope.putInQueue is set to true when going through the overlay -> put in queue advanced flow process (basically the same as check-in, without CC auth-CICO-19673)
					// --- also the guest is not checked-in, so the user gets redirected back to the stay card, where they will see the option to "remove from queue"
					// --- this also updates the flow for check-in, if (reservation was queue'd, then we will skip upgrade page, T&C page and credit card authorization
					// ----> upon check-in w/ res. queued, Immediately check-in guest in Opera and advance Rover to key generation screen
					data.authorize_credit_card = false;
					if ($scope.putInQueue || queueRoom === true) {
						$scope.putInQueueAdvanced(data);
						// Now, we need to go ahead and produce the keys so the user doesn't need key creation at check-in if (queued room)

					} else {
						// Perform checkin process without authorization..
						$scope.invokeApi(RVBillCardSrv.completeCheckin, data, $scope.completeCheckinSuccessCallback, $scope.completeCheckinFailureCallback);
					}
				}
				else if ($scope.reservationBillData.is_cc_authorize_at_checkin_enabled && $scope.reservationBillData.bills[$scope.currentActiveBill].credit_card_details.payment_type === "CC") {
					// Performing cc autherization process..
					$scope.isInProgressScreen = true;
					$scope.isSuccessScreen = false;
					$scope.isFailureScreen = false;
					$scope.isCCAuthPermission = $scope.hasCCAuthPermission();

					ngDialog.open({
						template: '/assets/partials/bill/ccAuthorization.html',
						className: '',
						closeByDocument: false,
						scope: $scope
					});
					data.authorize_credit_card = true;
					$scope.invokeApi(RVBillCardSrv.completeCheckin, data, $scope.completeCheckinAuthSuccessCallback, $scope.completeCheckinFailureCallback);
				}
				else {
					// Perform checkin process without authorization..
					data.authorize_credit_card = false;
					$scope.invokeApi(RVBillCardSrv.completeCheckin, data, $scope.completeCheckinSuccessCallback, $scope.completeCheckinFailureCallback);
				}
			};

			var setFlagForPreAuthPopup = function () {
				// CICO-17266 Setting up flags for showing messages ..
				$scope.message_incoming_from_room = false;
				$scope.message_out_going_to_room = false;
				$scope.message_out_going_to_comp_tra = false;
				$scope.enableIncedentalOnlyOption = false;

				if ($scope.reservationBillData.routing_info.incoming_from_room) {
					$scope.message_incoming_from_room = true;
				}
				else if ($scope.reservationBillData.routing_info.out_going_to_room) {
					$scope.message_out_going_to_room = true;
				}
				else if ($scope.reservationBillData.routing_info.out_going_to_comp_tra) {
					$scope.message_out_going_to_comp_tra = true;
				}
				if ($scope.reservationBillData.is_cc_authorize_for_incidentals_active && ($scope.message_out_going_to_room || $scope.message_out_going_to_comp_tra)) {
					$scope.enableIncedentalOnlyOption = true;
				}
			};

			// CICO-17266 Considering Billing info details before Auth..
			var showPreAuthPopupWithBillingInfo = function (data) {

				$scope.clickedIncidentalsOnly = function () {
					// @params : data , isCheckinWithoutAuth: false
					data.is_cc_authorize_for_incidentals = true;
					performCCAuthAndCheckinProcess(data, false);
					ngDialog.close();
				};

				$scope.clickedFullAuth = function () {
					// @params : data , isCheckinWithoutAuth: false
					performCCAuthAndCheckinProcess(data, false);
					ngDialog.close();
				};

				$scope.clickedManualAuth = function () {
					// As of now , Manual auth is performed at stay card..
					// Proceeding checkin without authorization..
					// @params : data , isCheckinWithoutAuth :true
					$scope.reservationBillData.is_cc_authorize_at_checkin_enabled = false;
					performCCAuthAndCheckinProcess(data, true);
					ngDialog.close();
				};

				setFlagForPreAuthPopup();

				// CICO-17266 Considering Billing info details before Auth..
				ngDialog.open({
					template: '/assets/partials/bill/ccAuthAndBillingInfoConfirm.html',
					className: '',
					closeByDocument: false,
					scope: $scope
				});
			};


			$scope.getSignature = function () {
				// moved here for easier cleanup later
				// Against angular js practice ,TODO: check proper solution using ui-jq to avoid this.
				var signatureData = JSON.stringify($("#signature").jSignature("getData", "native"));

				return signatureData;
			};

			// CICO-36696 : Method to get canvas data in Base64 Format, includes the line inside canvas.
			$scope.getSignatureBase64Data = function () {
				var canvasElement = angular.element(document.querySelector('canvas.jSignature'))[0],
					signatureURL = (canvasElement) ? canvasElement.toDataURL() : '';

				return signatureURL;
			};

			$scope.signatureNeeded = function (signatureData) {
				if ($scope.reservationBillData.signature_details.is_signed === 'true') {
					signatureData = $scope.reservationBillData.signature_details.signed_image;
					return false;
				}

				if (signatureData === "[]" && $scope.reservationBillData.required_signature_at === "CHECKIN") {
					return true;
				} else return false;
			};

			$scope.termsConditionsNeeded = function () {
				if (!$scope.saveData.termsAndConditions &&
					(
						$scope.reservationBillData.is_disabled_terms_conditions_checkin === "false" ||
						$scope.reservationBillData.is_disabled_terms_conditions_checkin === "" ||
						$scope.reservationBillData.is_disabled_terms_conditions_checkin === null
					)
				) {
					return true;
				} else return false;
			};

			$scope.validateEmailNeeded = function () {
				if ($scope.saveData.promotions && $scope.guestCardData.contactInfo.email === '') {
					return true;
				} else return false;
			};

			$scope.getCheckinSwipeData = function (signatureData, addToGuest) {

				var cardExpiry = "20" + swipedTrackDataForCheckin.RVCardReadExpDate.substring(0, 2) + "-" + swipedTrackDataForCheckin.RVCardReadExpDate.slice(-2) + "-01";
				var data = {
					"is_promotions_and_email_set": $scope.saveData.promotions,
					"signature": signatureData,
					"reservation_id": $scope.reservationBillData.reservation_id,
					"payment_type": "CC",
					"mli_token": swipedTrackDataForCheckin.token,
					"et2": swipedTrackDataForCheckin.RVCardReadTrack2,
					"etb": swipedTrackDataForCheckin.RVCardReadETB,
					"ksn": swipedTrackDataForCheckin.RVCardReadTrack2KSN,
					"pan": swipedTrackDataForCheckin.RVCardReadMaskedPAN,
					"card_name": swipedTrackDataForCheckin.RVCardReadCardName,
					"name_on_card": swipedTrackDataForCheckin.RVCardReadCardName,
					"card_expiry": cardExpiry,
					"credit_card": swipedTrackDataForCheckin.RVCardReadCardType,
					"do_not_cc_auth": true,
					"restrict_post": ($scope.reservationBillData.roomChargeEnabled === "") ? false : !$scope.reservationBillData.roomChargeEnabled,
					"add_to_guest_card": addToGuest
				};
				// CICO-12554 indicator if the track data is encrypted or not

				data.is_encrypted = true;
				if (swipedTrackDataForCheckin.RVCardReadIsEncrypted === 0 || swipedTrackDataForCheckin.RVCardReadIsEncrypted === '0') {
					data.is_encrypted = false;
					data.card_number = swipedTrackDataForCheckin.RVCardReadPAN;
				}
				// CICO-12554 Adding the KSN conditionally
				data.ksn = swipedTrackDataForCheckin.RVCardReadTrack2KSN;

				if (swipedTrackDataForCheckin.RVCardReadETBKSN !== "" && typeof swipedTrackDataForCheckin.RVCardReadETBKSN !== "undefined") {
					data.ksn = swipedTrackDataForCheckin.RVCardReadETBKSN;
				}
				return data;
			};

			$scope.getCheckinNonSwipeData = function (signatureData) {
				var data = {
					"is_promotions_and_email_set": $scope.saveData.promotions,
					"signature": signatureData,
					"reservation_id": $scope.reservationBillData.reservation_id,
					"do_not_cc_auth": $scope.do_not_cc_auth,
					"restrict_post": ($scope.reservationBillData.roomChargeEnabled === "") ? false : !$scope.reservationBillData.roomChargeEnabled
				};

				return data;
			};


			// To handle complete checkin button click
			$scope.clickedCompleteCheckin = function (isCheckinWithoutPreAuthPopup, checkInQueuedRoom) {
				// CICO-36122 - Set this to keep the promos and news opt in check-in screen in sync with guest card
				if (!!$scope.guestCardData && !!$scope.guestCardData.contactInfo) {
					$scope.guestCardData.contactInfo.is_opted_promotion_email = $scope.saveData.promotions;
				}

				if ($scope.hasAnySharerCheckedin()) {
					// Do nothing , Keep going checkin process , it is a sharer reservation..
				}
				else if (($scope.reservationBillData.room_status === 'NOTREADY' || $scope.reservationBillData.fo_status === 'OCCUPIED') && !$rootScope.queuedCheckIn) {
					var reservationStatus = $scope.reservationBillData.reservation_status;
					var isUpgradeAvaiable = $scope.reservationBillData.is_upsell_available && (reservationStatus === 'RESERVED' || reservationStatus === 'CHECKING_IN');
					// TO DO:Go to room assignemt view

					$state.go("rover.reservation.staycard.roomassignment", {
						"reservation_id": $scope.reservationBillData.reservation_id,
						"room_type": $scope.reservationBillData.room_type,
						"clickedButton": "checkinButton",
						"upgrade_available": isUpgradeAvaiable,
						"roomTypeId": $scope.reservation.reservation_card.room_type_id
					});
					return false;
				}

				var errorMsg = "", signatureData = $scope.getSignature();

				if ($scope.signatureNeeded(signatureData) && !$scope.reservation.reservation_card.is_pre_checkin) {
					errorMsg = "Signature is missing";
					$scope.showErrorPopup(errorMsg);


				} else if ($scope.termsConditionsNeeded()) {
					errorMsg = "Please check agree to the Terms & Conditions";
					$scope.showErrorPopup(errorMsg);


				} else {
					if (signatureData !== 'isSigned' && signatureData !== '[]') {
						signatureData = $scope.getSignatureBase64Data();
					}

					$scope.initCompleteCheckin(isCheckinWithoutPreAuthPopup, signatureData);
				}

			};
			$scope.clickedCompleteAddToQueue = function (isCheckinWithoutPreAuthPopup, checkInQueuedRoom) {

				if ($scope.hasAnySharerCheckedin()) {
					// Do nothing , Keep going checkin process , it is a sharer reservation..
				}

				var errorMsg = "", signatureData = $scope.getSignature();

				if ($scope.signatureNeeded(signatureData) && !$scope.reservation.reservation_card.is_pre_checkin) {
					errorMsg = "Signature is missing";
					$scope.showErrorPopup(errorMsg);


				} else if ($scope.termsConditionsNeeded()) {
					errorMsg = "Please check agree to the Terms & Conditions";
					$scope.showErrorPopup(errorMsg);


				} else {
					var queueRoom = true,
						signature = $scope.getSignatureBase64Data();

					$scope.initCompleteCheckin(isCheckinWithoutPreAuthPopup, signature, queueRoom);
				}

			};

			$scope.initCompleteCheckin = function (isCheckinWithoutPreAuthPopup, signatureData, queueRoom) {
				if ($scope.validateEmailNeeded()) {
					ngDialog.open({
						template: '/assets/partials/validateCheckin/rvAskEmailFromCheckin.html',
						controller: 'RVValidateEmailPhoneCtrl',
						className: '',
						scope: $scope
					});
				} else {
					var addToGuest = false;

					if ($scope.isAddToGuestCardEnabledDuringCheckin !== undefined) {
						addToGuest = $scope.isAddToGuestCardEnabledDuringCheckin;
					}


					var data;

					if ($scope.isSwipeHappenedDuringCheckin) {
						data = $scope.getCheckinSwipeData(signatureData, addToGuest);
					} else if ($scope.checkGuestInFromQueue) {
						data = $scope.getCheckinNonSwipeData(signatureData);
					} else {
						data = $scope.getCheckinNonSwipeData(signatureData);
					}
					if (!$scope.putInQueue) {
						setFlagForPreAuthPopup();
					}
					if (signatureData === 'isSigned' || signatureData === '[]') {
						delete data.signature;
					}

					if (typeof isCheckinWithoutPreAuthPopup !== 'undefined' && isCheckinWithoutPreAuthPopup) {
						// Directly performing checkin process without pre-auth popup.
						performCCAuthAndCheckinProcess(data, true, queueRoom);
					}
					else if (!$scope.message_incoming_from_room && !$scope.message_out_going_to_room && !$scope.message_out_going_to_comp_tra) {
						performCCAuthAndCheckinProcess(data, false, queueRoom);
					}
					else if ($scope.reservationBillData.is_cc_authorize_at_checkin_enabled && $scope.reservationBillData.bills[$scope.currentActiveBill].credit_card_details.payment_type === "CC") {
						// CICO-17266 PMS: Rover - CC Auth should consider Billing Information.
						showPreAuthPopupWithBillingInfo(data);
					}
					else {
						performCCAuthAndCheckinProcess(data, true, queueRoom);
					}
				}
			};
			/**
		* function to check whether the user has permission
		* to Show 'Checkout Without Settlement' checkbox.
		* @return {Boolean}
		*/
			$scope.hasPermissionToShowCheckoutWithoutSettlement = function () {
				return rvPermissionSrv.getPermissionValue('ALLOW_CHECKOUT_WITHOUT_SETTLEMENT');
			};
			/**
			* function to check whether the user has permission to allow post with no credit
			* @return {Boolean}
			*/
			$scope.hasPermissionToAllowPostWithNoCredit = function () {
				return rvPermissionSrv.getPermissionValue('ALLOW_POST_WHEN_RESTRICTED');
			};
			// CICO-6089 : Handle toggle button.
			$scope.toggleCheckoutWithoutSettlement = function () {
				$scope.isCheckoutWithoutSettlement = !$scope.isCheckoutWithoutSettlement;
			};
			// CICO-43344 : Handle toggle email opt button.
			$scope.toggleOptedForEmail = function () {
				var currentItem = $scope.emailOptedStatusList[$scope.currentActiveBill];

				currentItem.isOptedForEmail = !currentItem.isOptedForEmail;
			};

			/*
		 * Function to generate folio number
		 * @param billId is the bill id
		 * @param balanceAmount is the balance Amount
		 */
			that.generateFolioNumber = function (billId, balanceAmount, isFolioNumberExists, billIndex) {

				if (balanceAmount === "0.00" && !isFolioNumberExists) {

					var successCallBackOfGenerateFolioNumber = function (data) {
						if ($scope.reservationBillData.is_bill_lock_enabled) {
							$scope.reservationBillData.bills[billIndex].is_active = false;
						}
						$scope.reservationBillData.bills[billIndex].is_folio_number_exists = true;
					},
						paramsToService = {
							'bill_id': billId
						},
						options = {
							params: paramsToService,
							successCallBack: successCallBackOfGenerateFolioNumber
						};

					$scope.callAPI(RVBillCardSrv.generateFolioNumber, options);
				}
			};

			// To handle success callback of complete checkout
			$scope.completeCheckoutSuccessCallback = function (response) {
				// Once we checkout we need to fetch summary bill details which is already done in moveCharges event	
				$scope.$emit('moveChargeSuccsess', {});
				$scope.showSuccessPopup(response);
				$timeout(function () {
					// slight delay on-success so user doesnt re-click review & checkout again and initiate an error
					// CICO-45029
					$scope.checkoutInProgress = false;
				}, 500);
			};
			// To handle failure callback of complete checkout
			$scope.completeCheckoutFailureCallback = function (data) {
				sntActivity.stop('COMPLETE_CHECKOUT');
				$scope.errorMessage = data;
				$scope.checkoutInProgress = false;
			};

			// To handle ar account details in case of direct bills
			$scope.isArAccountNeeded = function (index) {
				var isArAccountNeeded = false;

				// CICO-15493: A reservation being linked to a Group Account should be sufficient to be able to check out to Direct Bill; no need to check for AR account
				if ($scope.reservationBillData.is_linked_to_group_account) {
					return isArAccountNeeded;
				}
				// Prompt for AR account
				if ($scope.reservationBillData.bills[index].credit_card_details.payment_type === "DB" && $scope.reservationBillData.bills[index].ar_number === null && $rootScope.isStandAlone) {

					if ($scope.reservationBillData.bills[index].account_id === null || typeof $scope.reservationBillData.bills[index].account_id === 'undefined') {
						$scope.showErrorPopup($filter('translate')('ACCOUNT_ID_NIL_MESSAGE'));
					}
					else {
						$scope.account_id = $scope.reservationBillData.account_id;
						ngDialog.open({
							template: '/assets/partials/payment/rvAccountReceivableMessagePopup.html',
							controller: 'RVAccountReceivableMessagePopupCtrl',
							className: '',
							scope: $scope
						});
					}
					isArAccountNeeded = true;
				}

				return isArAccountNeeded;
			};

			// CICO-49105 Blackbox API on each bill having payments exist..
			var callBlackBoxAPI = function () {

				var currentActiveBill = $scope.reservationBillData.bills[$scope.currentActiveBill],
					billCount = $scope.reservationBillData.bills.length;

				var successCallBackOfApiCall = function (data) {
					// If the user is on last Bill - proceed CHECKOUT PROCESS.
					// Else proceed REVIEW PROCESS.
					if ($scope.isViaReviewProcess && (billCount === $scope.currentActiveBill + 1)) {
						// Set isLastBillSucceededWithBlackBoxAPI flag to true in order to proceed further checkout process.
						$scope.isLastBillSucceededWithBlackBoxAPI = true;
						$scope.clickedCompleteCheckout();
					}
					else if ($scope.isViaReviewProcess) {
						// Updating review status of the bill.
						$scope.reviewStatusArray[$scope.currentActiveBill].reviewStatus = true;
						// Locking the bill.
						if ($scope.reservationBillData.is_bill_lock_enabled) {
							currentActiveBill.is_active = false;
						}
						// Moving to next bill to review
						$scope.findNextBillToReview();
					}
					else {
						// Locking the bill. - Call after payment.
						if ($scope.reservationBillData.is_bill_lock_enabled) {
							currentActiveBill.is_active = false;
						}
					}
				},
					failureCallBackOfApiCall = function (errorMessage) {
						$scope.errorMessage = errorMessage;
					},
					paramsToService = {
						'bill_id': currentActiveBill.bill_id
					};

				var options = {
					params: paramsToService,
					successCallBack: successCallBackOfApiCall,
					failureCallBack: failureCallBackOfApiCall
				};

				$scope.callAPI(RVBillCardSrv.callBlackBoxApi, options);
			};

			// CICO-45029 - handle check-out in progress tracking so user doesnt initiate errors
			// due to having already clicked the review bill & complete check-out button
			$scope.checkoutInProgress = false;
			$scope.isMessagePopupDuringCheckout = false;
			// To handle complete checkout button click
			$scope.clickedCompleteCheckout = function () {
				$scope.checkoutInProgress = true;

				$scope.findNextBillToReview();	// Verifying wheather any bill is remaing for reviewing.
				if (!$scope.isAllBillsReviewed) {
					$scope.checkoutInProgress = false;
					return;
				}
				var isPaymentExist = $scope.reservationBillData.bills[$scope.currentActiveBill].is_payment_exist,
					isControlCodeExist = $scope.reservationBillData.bills[$scope.currentActiveBill].is_control_code_exist;

				// CICO-49105 : Calling blackbox API prior to checkout API if :
				// 1. Blackbox enabled.
				// 2. There should be payment exist in the bill.
				// 3. Not opted checkoutWithoutSettlement.
				// 4. Not having existing control code.
				// NB : blackbox API Needed to be success inorder to proceed on further complete checkout API call.
				if (isBlackBoxEnabled && isPaymentExist && !$scope.isLastBillSucceededWithBlackBoxAPI && !$scope.isCheckoutWithoutSettlement && !isControlCodeExist) {
					$scope.isViaReviewProcess = true;
					callBlackBoxAPI();
					return;
				}

				// To check for ar account details in case of direct bills
				var index = $scope.reservationBillData.bills.length - 1,
					signatureBase64Data = $scope.getSignatureBase64Data();

				if ($scope.isArAccountNeeded(index)) {
					$scope.checkoutInProgress = false;
					return;
				}

				// Against angular js practice ,TODO: check proper solution using ui-jq to avoid this.
				if ($scope.signatureData === "" || $scope.signatureData === "[]") {
					var signatureData = JSON.stringify($("#signature").jSignature("getData", "native"));
				}
				else {
					var signatureData = $scope.signatureData;
				}
				var errorMsg = "", totalBal = 0, optedBillForEmail = [];

				// calculate total and CICO-43344 : fetch optedBillForEmail list.
				for (var i = 0; i < reservationBillData.bills.length; i++) {
					totalBal += reservationBillData.bills[i].total_amount * 1;

					if ($scope.emailOptedStatusList[i].isOptedForEmail) {
						optedBillForEmail.push($scope.emailOptedStatusList[i].billId);
					}
				}
				var finalBillBalance = "0.00",
					paymentType = reservationBillData.bills[$scope.currentActiveBill].credit_card_details.payment_type,
					isAllowDirectDebit = reservationBillData.bills[$scope.currentActiveBill].is_allow_direct_debit;

				if (typeof $scope.reservationBillData.bills[$scope.currentActiveBill].total_fees[0] !== 'undefined') {
					finalBillBalance = $scope.reservationBillData.bills[$scope.currentActiveBill].total_fees[0].balance_amount;
				}
				var directBillWithBalanceFlag = $rootScope.isStandAlone && finalBillBalance !== "0.00" && paymentType === "DB" && !$scope.performCompleteCheckoutAction;

				if ($scope.isCheckoutWithoutSettlement) {
					// CICO-86441: we want to show the dialog to go back to dashboard or stay on guest bill when checking out w/o settlement
					$scope.isMessagePopupDuringCheckout = true;
					var data = {
						"reservation_id": $scope.reservationBillData.reservation_id,
						"email": $scope.guestCardData.contactInfo.email,
						"signature": signatureBase64Data,
						"allow_checkout_without_settlement": true,
						"opted_bills_for_email": optedBillForEmail
					};

					sntActivity.start('COMPLETE_CHECKOUT');
					$scope.invokeApi(RVBillCardSrv.completeCheckout, data, $scope.completeCheckoutSuccessCallback, $scope.completeCheckoutFailureCallback);
				} else if (directBillWithBalanceFlag && !isAllowDirectDebit) {
					$scope.checkoutInProgress = false;
					showDirectDebitDisabledPopup();
				} else if (directBillWithBalanceFlag && isAllowDirectDebit && isBlackBoxEnabled) {
					$scope.checkoutInProgress = false;
					$scope.reservationBillData.isCheckout = true;
					$scope.clickedPayButton(true);
				}
				else if ($rootScope.isStandAlone && finalBillBalance !== "0.00" && paymentType !== "DB") {
					$scope.reservationBillData.isCheckout = true;
					$scope.clickedPayButton(true);
					$scope.checkoutInProgress = false;
				}
				else if (!$scope.guestCardData.contactInfo.email && !$scope.saveData.isEmailPopupFlag) {
					// Popup to accept and save email address.
					$scope.callBackMethodCheckout = function () {
						$scope.saveData.isEmailPopupFlag = true;
						$scope.clickedCompleteCheckout();
					};
					ngDialog.open({
						template: '/assets/partials/validateCheckout/rvValidateEmail.html',
						controller: 'RVValidateEmailCtrl',
						className: '',
						closeByDocument: false,
						scope: $scope
					});
				}
				else if ($scope.reservationBillData.reservation_status === "CHECKEDIN" && !$scope.saveData.isEarlyDepartureFlag && !$scope.reservationBillData.is_early_departure_penalty_disabled) {
					// If reservation status in INHOUSE - show early checkout popup
					$scope.callBackMethodCheckout = function () {
						$scope.clickedCompleteCheckout();
					};
					ngDialog.open({
						template: '/assets/partials/earlyCheckout/rvEarlyCheckout.html',
						controller: 'RVEarlyCheckoutCtrl',
						className: '',
						closeByDocument: false,
						scope: $scope
					});
				}
				else if (signatureData === "[]" && $scope.reservationBillData.required_signature_at === "CHECKOUT") {
					errorMsg = "Signature is missing";
					$scope.showErrorPopup(errorMsg);
					$scope.checkoutInProgress = false;
				}
				else if (!$scope.saveData.acceptCharges) {
					errorMsg = "Please check the box to accept the charges";
					$scope.showErrorPopup(errorMsg);
					$scope.checkoutInProgress = false;
				}
				else {
					$scope.isMessagePopupDuringCheckout = true;
					var data = {
						"reservation_id": $scope.reservationBillData.reservation_id,
						"email": $scope.guestCardData.contactInfo.email,
						"signature": signatureBase64Data,
						"opted_bills_for_email": optedBillForEmail
					};

					sntActivity.start('COMPLETE_CHECKOUT');
					$scope.invokeApi(RVBillCardSrv.completeCheckout, data, $scope.completeCheckoutSuccessCallback, $scope.completeCheckoutFailureCallback);
				}
			};

			/**
			* function to check whether the user has permission
			* to to proceed checkout
			* @return {Boolean}
			*/
			$scope.hasPermissionToProceedCheckout = function () {
				return rvPermissionSrv.getPermissionValue('OVERWRITE_DEBIT_RESTRICTION');
			};

			// CICO-12983 Restrict Debits for Company / TA cards.
			var showDirectDebitDisabledPopup = function () {
				ngDialog.open({
					template: '/assets/partials/validateCheckout/rvDirectDebitDisabled.html',
					className: '',
					scope: $scope
				});
			};

			// CICO-12983 To handle procced with checkout on DirectDebitDisabledPopup.
			$scope.proceedWithCheckout = function () {
				$scope.closeDialog();
				/*
				 *	For the Final bill => If all bills already reviewed -> proceed complete checkout process.
				 *	In all other bills => proceed the review process.
				 */
				if ($scope.isAllBillsReviewed) {
					$scope.performCompleteCheckoutAction = true;
					$scope.clickedCompleteCheckout();
				}
				else {
					// Updating review status for the bill.
					$scope.reviewStatusArray[$scope.currentActiveBill].reviewStatus = true;
					$scope.findNextBillToReview();
				}
			};
			// To handle review button click
			$scope.clickedReviewButton = function (index) {
				// To check for ar account details in case of direct bills
				if ($scope.isArAccountNeeded(index)) {
					return;
				}
				// CICO-9721 : Payment should be prompted on Bill 1 first before moving to review Bill 2 when balance is not 0.00.
				var ActiveBillBalance = $scope.reservationBillData.bills[$scope.currentActiveBill].total_fees[0].balance_amount,
					paymentType = reservationBillData.bills[$scope.currentActiveBill].credit_card_details.payment_type,
					isPaymentExist = $scope.reservationBillData.bills[$scope.currentActiveBill].is_payment_exist,
					isControlCodeExist = $scope.reservationBillData.bills[$scope.currentActiveBill].is_control_code_exist;


				if ($rootScope.isStandAlone && (ActiveBillBalance === "0.00" || $scope.isCheckoutWithoutSettlement)) {
					// CICO-49105 : Calling blackbox API in review process if :
					// 1. Blackbox enabled.
					// 2. There should be payment exist in the bill.
					// 3. Not opted checkoutWithoutSettlement.
					// 4. Not having existing control code.
					if (isBlackBoxEnabled && isPaymentExist && !$scope.isCheckoutWithoutSettlement && !isControlCodeExist) {
						$scope.isViaReviewProcess = true;
						callBlackBoxAPI();
					}
					else {
						// Checking bill balance for stand-alone only.
						$scope.reviewStatusArray[index].reviewStatus = true;
						$scope.getBillData($scope.currentActiveBill + 1);
						$scope.findNextBillToReview();
					}
				}
				else if ($rootScope.isStandAlone && ActiveBillBalance !== "0.00" && paymentType === "DB" && !reservationBillData.bills[$scope.currentActiveBill].is_allow_direct_debit) {
					showDirectDebitDisabledPopup();
				}
				else if ($rootScope.isStandAlone && ActiveBillBalance !== "0.00" && paymentType === "DB" && reservationBillData.bills[$scope.currentActiveBill].is_allow_direct_debit) {
					// Show payment popup for stand-alone only.
					$scope.reservationBillData.isCheckout = true;
					$scope.clickedPayButton(true);
				}
				else if (ActiveBillBalance !== "0.00" && paymentType !== "DB") {
					// Show payment popup for stand-alone only.
					$scope.reservationBillData.isCheckout = true;
					$scope.clickedPayButton(true);
				}
				else {
					$scope.reviewStatusArray[index].reviewStatus = true;
					$scope.getBillData($scope.currentActiveBill + 1);
					$scope.findNextBillToReview();
				}
			};

			// To find next tab which is not reviewed before.
			$scope.findNextBillToReview = function () {
				var billIndex = 0;

				$timeout(function () {
					var billNumber = $scope.reservationBillData.bills[$scope.currentActiveBill].bill_number,
						scroller = $scope.$parent.myScroll['bill-tab-scroller'];

					if (billNumber > 7) {
						scroller.scrollTo(-133 * (billNumber - 6), scroller.maxScrollY);
					}
				}, 100);

				for (var i = 0; i < $scope.reviewStatusArray.length; i++) {
					// Checking last bill balance for stand-alone only.
					if (typeof $scope.reservationBillData.bills[i].total_fees[0] !== 'undefined') {
						var billBalance = $scope.reservationBillData.bills[i].total_fees[0].balance_amount,
							paymentType = $scope.reservationBillData.bills[i].credit_card_details.payment_type;

						if (billBalance !== "0.00" && paymentType !== "DB" && !$scope.isCheckoutWithoutSettlement) {
							$scope.reviewStatusArray[i].reviewStatus = false;
						}
					}
					if (!$scope.reviewStatusArray[i].reviewStatus) {
						// when all bills reviewed and reached final bill
						if ($scope.reviewStatusArray.length === $scope.reservationBillData.bills.length) {
							$scope.isAllBillsReviewed = true;
						}
						billIndex = $scope.reviewStatusArray[i].billIndex;
						break;
					}
				}

			};
			/*
			 * to show error message - Error message signature and T&C
			 * @param {string} errormessage
			 */
			$scope.showErrorPopup = function (errorMessage) {
				$scope.status = "error";
				$scope.popupMessage = errorMessage;
				ngDialog.open({
					template: '/assets/partials/validateCheckin/rvShowValidation.html',
					controller: 'RVShowValidationErrorCtrl',
					className: '',
					scope: $scope
				});
			};

			$scope.showSuccessPopup = function (successMessage) {
				$scope.status = "success";
				$scope.popupMessage = successMessage;
				$scope.checkoutStatus = $scope.status; // CICO-45029 handle room status dialog after checkout (see jira notes)

				$scope.callBackMethod = function () {
					// CICO-11807 issue fixed
					if ($scope.saveData.isEarlyDepartureFlag === true) {
						var stateParams = { 'type': 'INHOUSE', 'from_page': 'DASHBOARD' };
					}
					else {
						var stateParams = { 'type': 'DUEOUT', 'from_page': 'DASHBOARD' };
					}
					if (RVSearchSrv.searchTypeStatus === undefined) {
						var stateParams = { 'useCache': true };

						$scope.reservationBillData.reservation_status = "CHECKEDOUT";
						RVSearchSrv.updateRoomDetails($scope.reservationBillData.confirm_no, $scope.reservationBillData);
					}
					if (RVSearchSrv.totalSearchResults === '1') {
						$state.go('rover.dashboard');
					}
					else {
						$state.go('rover.search', stateParams);
					}
				};
				sntActivity.stop('COMPLETE_CHECKOUT');
				ngDialog.open({
					template: '/assets/partials/validateCheckin/rvShowValidation.html',
					controller: 'RVShowValidationErrorCtrl',
					className: '',
					closeByDocument: false,
					scope: $scope
				});
			};

			$scope.$on('BALANCECHANGED', function (event, data) {
				var dataToSrv = {
					"confirmationNumber": data.confirm_no,
					"isRefresh": false
				};
				var getReservationDetailsSuccessCallback = function (successData) {
					$scope.$emit('hideLoader');
					var reservationData = successData,
						swipeOperationObj,
						swipedCardDataToRender;

					if ($scope.swippedCard) {
						swipeOperationObj = new SwipeOperation();
						swipedCardDataToRender = swipeOperationObj.createSWipedDataToRender(swipedTrackDataForCheckin);
						$scope.$broadcast('SWIPED_CARD_ADDED', swipeOperationObj.createSWipedDataToSave(swipedCardDataToRender));
					}

					reservationData.reservation_card.balance_amount = data.balance;
					RVReservationCardSrv.updateResrvationForConfirmationNumber(data.confirm_no, reservationData);
				};

				$scope.invokeApi(RVReservationCardSrv.fetchReservationDetails, dataToSrv, getReservationDetailsSuccessCallback);

			});

			$scope.HIDE_LOADER_FROM_POPUP = function () {
				$scope.$emit("hideLoader");
			};

			/**
			 * Opens allowances modal
			 * 
			 * @returns void
			 */
			$scope.openAllowances = function () {
				$scope.$emit('showLoader');
				jsMappings.fetchAssets(['rover.allowances', 'directives'])
					.then(function() {
						$scope.callAPI(RVBillCardSrv.fetchReservationAllowanceTransactions, {
							params: $scope.reservationBillData.reservation_id,
							successCallBack: function (result) {
								$scope.reservationBillData.groupedAllowances = result;
								ngDialog.open({
									template: '/assets/partials/allowances/rvAllowances.html',
									controller: 'rvAllowancesCtrl',
									controllerAs: 'file',
									className: '',
									scope: $scope
								});
							},
							failureCallBack: function () {
								$scope.groupedAllowanceData = false;
							}
						});
					})
					.then(function () {
						$scope.$emit('hideLoader');
					});
			};

			// trigger the billing information popup
			$scope.openBillingInformation = function () {

				$scope.reservationData = {};
				$scope.reservationData.confirm_no = $scope.reservationBillData.confirm_no;
				$scope.reservationData.reservation_id = $scope.reservationBillData.reservation_id;
				$scope.reservationData.reservation_status = $scope.reservationBillData.reservation_status;
				$scope.reservationData.user_id = $stateParams.userId;
				$scope.reservationData.is_opted_late_checkout = false;
				$scope.billingInfoModalOpened = true;

				$scope.$emit('showLoader');
				jsMappings.fetchAssets(['addBillingInfo', 'directives'])
					.then(function () {
						$scope.$emit('hideLoader');
						if ($rootScope.UPDATED_BI_ENABLED_ON['RESERVATION']) {
							ngDialog.open({
								template: '/assets/partials/billingInformation/reservation/rvBillingInfoReservationMain.html',
								controller: 'rvBillingInfoReservationMainCtrl',
								className: '',
								scope: $scope
							});
						}
						else {
							ngDialog.open({
								template: '/assets/partials/bill/rvBillingInformationPopup.html',
								controller: 'rvBillingInformationPopupCtrl',
								className: '',
								scope: $scope
							});
						}
					});
			};

			/*
			 * To show the advance bill confirmation dialog
			 * @param  {Boolean} [is Via ReviewProcess or not ]
			 * @return {undefined}
			 */
			$scope.showAdvancedBillDialog = function (isViaReviewProcess) {
				$scope.clickedPayButton(isViaReviewProcess);
			};

			/*
			 * Open Advance Bill pop-up
			 * @param  none
			 * @return void
			 */
			$scope.clickedAdvanceBill = function () {
				ngDialog.open({
					template: '/assets/partials/bill/rvAdvanceBillConfirmPopup.html',
					className: '',
					scope: $scope
				});
			};
			/*
			 * to invoke the api on opting the advance bill and fetch the advanced bill details
			 *
			 */
			$scope.generateAdvanceBill = function () {
				sntActivity.start('GENERATE_ADVANCE_BILL');
				var data = {};

				data.id = $scope.reservationBillData.reservation_id;
				var getAdvanceBillSuccessCallback = function (successData) {
					ngDialog.close();
					sntActivity.stop('GENERATE_ADVANCE_BILL');
					var reservation = RVReservationCardSrv.getResrvationForConfirmationNumber($scope.reservationBillData.confirm_no);

					reservation.reservation_card.balance_amount = successData.reservation_balance;
					RVReservationCardSrv.updateResrvationForConfirmationNumber($scope.reservationBillData.confirm_no, reservation);
					$scope.reservationBillData.is_advance_bill = true;
					getBillHeaderDetails();
				};
				var getAdvanceBillErrorCallback = function (error) {
					ngDialog.close();
					sntActivity.stop('GENERATE_ADVANCE_BILL');
					$scope.errorMessage = error;
				};

				$scope.invokeApi(RVBillCardSrv.getAdvanceBill, data, getAdvanceBillSuccessCallback, getAdvanceBillErrorCallback);
			};

			/*
			 * to invoke the payment dialogs on closing the advance bill dialog.
			 *
			 */
			$scope.closeAdanceBillDialog = function () {
				ngDialog.close();
			};


			/* ------------- edit/remove/split starts here --------------*/

			$scope.splitTypeisAmount = true;
			$scope.chargeCodeActive = false;
			$scope.selectedChargeCode = {};

			$scope.availableChargeCodes = [];

			$scope.setchargeCodeActive = function (bool) {
				$scope.chargeCodeActive = bool;
			};

			/*
			* open popup for edit/split/remove transaction
			*/
			$scope.openActionsPopup = function (id, desc, amount, type, credits, reference_text, show_ref_on_invoice, show_split_payment) {

				$scope.errorMessage = "";
				// hide edit and remove options in case type is  payment
				$scope.hideRemoveAndEdit = (type === "PAYMENT") ? true : false;
				$scope.selectedTransaction = {};
				$scope.selectedTransaction.id = id;
				$scope.selectedTransaction.desc = desc;
				$scope.reference_text = reference_text;
				$scope.show_ref_on_invoice = show_ref_on_invoice;
				$scope.show_split_payment = show_split_payment;

				if (amount) {
					$scope.selectedTransaction.amount = amount;
				}
				else if (credits) {
					$scope.selectedTransaction.amount = credits;
				}

				ngDialog.open({
					template: '/assets/partials/bill/rvBillActionsPopup.html',
					className: '',
					scope: $scope
				});
			};

			/*
			 * open popup for remove transaction
			 */

			$scope.openRemoveChargePopup = function () {
				ngDialog.open({
					template: '/assets/partials/bill/rvRemoveChargePopup.html',
					controller: 'rvBillCardPopupCtrl',
					className: '',
					scope: $scope
				});
			};

			/*
			 * open popup for split transaction
			 */

			$scope.openSplitChargePopup = function () {
				ngDialog.open({
					template: '/assets/partials/bill/rvSplitChargePopup.html',
					controller: 'rvBillCardPopupCtrl',
					className: '',
					scope: $scope
				});
			};

			/*
			 * open popup for edit charge code
			 */
			$scope.openEditChargeDescPopup = function () {
				ngDialog.open({
					template: '/assets/partials/bill/rvEditChargePopup.html',
					controller: 'rvBillCardPopupCtrl',
					className: '',
					scope: $scope
				});
			};

			/*
			 * open popup for edit transaction
			 */

			$scope.openEditChargePopup = function () {
				$scope.selectedChargeCode = {
					"id": "",
					"name": "",
					"description": "",
					"associcated_charge_groups": []
				};
				ngDialog.open({
					template: '/assets/partials/bill/rvEditPostingPopup.html',
					className: '',
					controller: 'rvBillCardPopupCtrl',
					scope: $scope
				});
				$scope.setScroller('chargeCodesList');
			};


			$scope.callActionsPopupAction = function (action) {

				ngDialog.close();
				if (action === "custom_description") {
					$scope.openEditChargeDescPopup();
				} else if (action === "remove") {
					$scope.openRemoveChargePopup();
				} else if (action === "split") {
					$scope.openSplitChargePopup();
				} else if (action === "edit") {
					$scope.callAPI(RVBillCardSrv.fetchAdjustmentReasons, {
						successCallBack: function (response) {
							$scope.adjustmentReasonOptions = response.force_adjustment_reasons;
							$scope.showAdjustmentReason = response.force_adjustment_reason_enabled;
						}
					});

					if ($scope.availableChargeCodes.length) {
						$scope.openEditChargePopup();
					} else {
						$scope.callAPI(RVBillCardSrv.fetchChargeCodes, {
							successCallBack: function (response) {
								$scope.availableChargeCodes = response.results;
								$scope.openEditChargePopup();
							}
						});
					}
				}


			};

			/*
			 *	Method to show Invoice pending while fiskilazation in progress.
			 *	This is for EFSTA only.
			 */
			var showInvoicePendingInfoPopup = function () {
				ngDialog.open({
					template: '/assets/partials/popups/billFormat/rvInvoicePendingInfoPopup.html',
					className: '',
					scope: $scope
				});
			};

			/* ----------- edit/remove/split ends here ---------------*/

			$scope.clickedEmail = function (data) {
				if ($scope.shouldGenerateFinalInvoice && !$scope.billFormat.isInformationalInvoice) {
					finalInvoiceSettlement(data, false);
				} else {
					$scope.closeDialog();
					var sendEmailSuccessCallback = function (successData) {
						$scope.$emit('hideLoader');
						$scope.statusMsg = $filter('translate')('EMAIL_SENT_SUCCESSFULLY');
						if (successData.is_invoice_issued) {
							$scope.status = "success";
							$scope.showEmailSentStatusPopup();
							$scope.reloadCurrentActiveBill();
						}
						else {
							showInvoicePendingInfoPopup();
						}
					};
					var sendEmailFailureCallback = function (errorData) {
						$scope.$emit('hideLoader');
						$scope.statusMsg = $filter('translate')('EMAIL_SEND_FAILED');
						$scope.status = "alert";
						$scope.showEmailSentStatusPopup();
					};

					$scope.invokeApi(RVBillCardSrv.sendEmail, data, sendEmailSuccessCallback, sendEmailFailureCallback);
				}
			};


			// print bill
			$scope.clickedPrint = function (requestData) {
				$scope.closeDialog();
				printBill(requestData);
				scrollToTop();
			};

			var scrollToTop = function () {
				$scope.$parent.myScroll['registration-content'].scrollTo(0, 0, 100);
			};
			/*
			 * Settle invoice
			 */
			var finalInvoiceSettlement = function (data, isPrint) {
				var settleInvoiceSuccess = function () {
					$scope.shouldGenerateFinalInvoice = false;
					$scope.getBillData($scope.currentActiveBill);
					if (isPrint) {
						printBill(data);
					} else {
						$scope.clickedEmail(data);
					}
				},
					options = {
						params: { "bill_id": $scope.reservationBillData.bills[$scope.currentActiveBill].bill_id },
						successCallBack: settleInvoiceSuccess
					};

				$scope.callAPI(RVBillCardSrv.settleFinalInvoice, options);
			};


			// add the print orientation before printing
			var addPrintOrientation = function () {
				$('head').append("<style id='print-orientation'>@page { size: portrait; }</style>");
			};

			// add the print orientation after printing
			var removePrintOrientation = function () {
				$('#print-orientation').remove();
			};

			var billCardPrintCompleted = function () {
				// CICO-9569 to solve the hotel logo issue
				$("header .logo").removeClass('logo-hide');
				$("header .h2").addClass('text-hide');

				// remove the orientation after similar delay
				removePrintOrientation();
				$scope.printBillCardActive = false;
				$("body #loading").html('<div id="loading-spinner" ></div>');// CICO-56119
			};

			// print the page
			var printBill = function (data) {
				if ($scope.shouldGenerateFinalInvoice && !$scope.billFormat.isInformationalInvoice) {
					finalInvoiceSettlement(data, true);
				} else {
					var getCopyCount = function (successData) {
						var copyCount = "";

						if (successData.is_copy_counter) {
							copyCount = parseInt(successData.print_counter) - parseInt(successData.no_of_original_invoices);
						}
						return copyCount;
					},
						printDataFetchSuccess = function (successData) {
							var copyCount = "",
								copyLabel = "",
								arInvoiceNumberActivatedDate = moment(successData.print_ar_invoice_number_activated_at, "YYYY-MM-DD"),
								arTransactionDate = moment(successData.ar_transaction_date, "YYYY-MM-DD"),
								dateDifference = arTransactionDate.diff(arInvoiceNumberActivatedDate, 'days');

							$scope.shouldShowArInvoiceNumber = true;
							if (dateDifference < 0) {
								$scope.shouldShowArInvoiceNumber = false;
							}

							$scope.isPrintRegistrationCard = false;
							$scope.printBillCardActive = true;
							$scope.$emit('hideLoader');

							if (successData.is_deposit_invoice) {
								successData.invoiceLabel = successData.translation.deposit_invoice;
							}
							else if ($scope.billFormat.isInformationalInvoice) {
								successData.invoiceLabel = successData.translation.information_invoice;
							}
							else if (successData.no_of_original_invoices === null && !$scope.reservationBillData.bills[$scope.currentActiveBill].is_void_bill) {
								successData.invoiceLabel = successData.guest_bill_invoice_label || successData.translation.invoice;
							}
							else if ($scope.reservationBillData.bills[$scope.currentActiveBill].is_void_bill) {
								if ((successData.no_of_original_invoices === null || parseInt(successData.print_counter) <= parseInt(successData.no_of_original_invoices))) {
									successData.invoiceLabel = successData.translation.void_invoice;
								}
								else if (parseInt(successData.print_counter) > parseInt(successData.no_of_original_invoices)) {
									copyCount = getCopyCount(successData);
									successData.invoiceLabel = successData.translation.copy_of_void_invoice.replace("#count", copyCount);
								}
							}
							else if (parseInt(successData.print_counter) <= parseInt(successData.no_of_original_invoices)) {
								successData.invoiceLabel = successData.guest_bill_invoice_label || successData.translation.invoice;
							}
							else if (parseInt(successData.print_counter) > parseInt(successData.no_of_original_invoices)) {
								copyCount = getCopyCount(successData);
								copyLabel = successData.guest_bill_invoice_copy_label || successData.translation.copy_of_invoice;
								successData.invoiceLabel = copyLabel.replace("#count", copyCount);
							}

							if (successData.is_invoice_issued) {
								$scope.printData = successData;
								$scope.errorMessage = "";

								// CICO-9569 to solve the hotel logo issue
								$("header .logo").addClass('logo-hide');
								$("header .h2").addClass('text-hide');
								$("body #loading").html("");// CICO-56119

								// add the orientation

								addPrintOrientation();
								/*
								*	======[ READY TO PRINT ]======
								*/
								$timeout(function () {
									/*
									*	======[ PRINTING!! JS EXECUTION IS PAUSED ]======
									*/
									$window.print();
									if (sntapp.cordovaLoaded) {
										cordova.exec(function (success) { }, function (error) { }, 'RVCardPlugin', 'printWebView', []);
									}
									/*
									*	======[ PRINTING COMPLETE. JS EXECUTION WILL UNPAUSE ]======
									*/
									$timeout(function () {
										billCardPrintCompleted();
									}, 3000);
								}, 700);
							}
							else {
								showInvoicePendingInfoPopup();
							}
						};

					var printDataFailureCallback = function (errorData) {
						$scope.$emit('hideLoader');
						$scope.errorMessage = errorData;
					};

					$scope.invokeApi(RVBillCardSrv.fetchBillPrintData, data, printDataFetchSuccess, printDataFailureCallback);
				}
			};

			$scope.printRegistrationCard = function () {
				ngDialog.close();
				scrollToTop();

				var sucessCallback = function (data) {

					$scope.isPrintRegistrationCard = true;
					$scope.printRegistrationCardActive = true;

					$scope.$emit('hideLoader');
					$scope.printRegCardData = data;
					$scope.errorMessage = "";
					$scope.printRegCardData.rowspanAustrianRegCardChild = data.guest_details.accompanying_children && data.guest_details.accompanying_children.length > 4 ? 3 : 2;
					if ($scope.isRegistrationCardEnabledFor.austria) {
						var docDetails = "";

						if (data.guest_details.id_type !== "" && data.guest_details.id_type !== null) {
							docDetails = docDetails + data.guest_details.id_type;
						}
						if (data.guest_details.id_number !== "" && data.guest_details.id_number !== null) {
							docDetails = docDetails + ";" + data.guest_details.id_number;
						}
						if (data.guest_details.id_issue_date !== "" && data.guest_details.id_issue_date !== null) {
							docDetails = docDetails + ";" + $filter('date')(new tzIndependentDate(data.guest_details.id_issue_date), $rootScope.dateFormat);
						}
						if (data.guest_details.id_place_of_issue !== "" && data.guest_details.id_place_of_issue !== null) {
							docDetails = docDetails + ";" + data.guest_details.id_place_of_issue;
						}
						if (data.guest_details.id_country_of_issue !== "" && data.guest_details.id_country_of_issue !== null) {
							docDetails = docDetails + ";" + data.guest_details.id_country_of_issue;
						}
						$scope.printRegCardData.documentDetails = docDetails;
					}
					// CICO-25012 - checking for signature dispaly on Reg'n Card PRINT
					if ($scope.reservationBillData.signature_details.is_signed === "true") {
						$scope.printRegCardData.signature_url = $scope.reservationBillData.signature_details.signed_image;
					}
					else {
						var canvasElement = angular.element(document.querySelector('canvas.jSignature'))[0],
							signatureURL = (!!canvasElement) ? canvasElement.toDataURL() : '';

						$scope.printRegCardData.signature_url = signatureURL;
					}

					// CICO-9569 to solve the hotel logo issue
					$("header .logo").addClass('logo-hide');
					$("header .h2").addClass('text-hide');

					// add the orientation
					addPrintOrientation();

					/*
					*	======[ READY TO PRINT ]======
					*/
					// this will show the popup with full bill
					$timeout(function () {
						// For some reason the loader is not getting hidden
						$("#loading").addClass('ng-hide');
						/*
						 *	======[ PRINTING!! JS EXECUTION IS PAUSED ]======
						 */
						$window.print();
						if (sntapp.cordovaLoaded) {
							cordova.exec(function (success) { }, function (error) { }, 'RVCardPlugin', 'printWebView', []);
						}
						/*
						 *	======[ PRINTING COMPLETE. JS EXECUTION WILL UNPAUSE ]======
						 */
						$timeout(function () {

							$scope.printRegistrationCardActive = false;
							// CICO-9569 to solve the hotel logo issue
							$("header .logo").removeClass('logo-hide');
							$("header .h2").addClass('text-hide');
							// remove the orientation after similar delay
							removePrintOrientation();
						}, 1000);
					}, 600);
				};

				var failureCallback = function (errorData) {
					$scope.isPrintRegistrationCard = false;
					$scope.$emit('hideLoader');
					$scope.errorMessage = errorData;
				};
				var params = {
					'reservation_id': $scope.reservationBillData.reservation_id,
					'locale': $scope.regCardData.selectedLocale
				};

				$scope.invokeApi(RVBillCardSrv.fetchRegistrationCardPrintData, params, sucessCallback, failureCallback);
			};

			$scope.openRegCardPopup = function () {
				$scope.regCardData = {};
				var failureCallback = function (errorData) {
					$scope.isPrintRegistrationCard = false;
					$scope.$emit('hideLoader');
					$scope.errorMessage = errorData;
				};
				var onLanguageFetchSuccess = function (data) {
					$scope.$emit('hideLoader');
					$scope.languageData = data;
					$scope.regCardData.selectedLocale = data.selected_language_code;
					ngDialog.open({
						template: '/assets/partials/popups/billFormat/rvRegCardPopup.html',
						className: '',
						scope: $scope
					});
				};
				var options = {
					params: { 'reservation_id': $scope.reservationBillData.reservation_id },
					successCallBack: onLanguageFetchSuccess,
					failureCallBack: failureCallback
				};

				$scope.callAPI(RVBillCardSrv.fetchGuestLanguages, options);
			};

			$scope.moveToNextBillAfterSuccessPaymentDuringCheckout = function () {
				isDuringCheckoutPayment = false;
				$scope.reservationBillData = reservationBillData;
				$scope.calculateBillDaysWidth();
				var billCount = $scope.reservationBillData.bills.length,
					reservationStatus = $scope.reservationBillData.reservation_status;

				if (!$scope.reservationBillData.is_bill_lock_enabled) {
					that.callGenerateFolioNumberApi();
				}
				// CICO-10906 review process continues after payment.
				if (($scope.reservationBillData.bills[$scope.currentActiveBill].total_fees[0].balance_amount === 0.00 || $scope.reservationBillData.bills[$scope.currentActiveBill].total_fees[0].balance_amount === "0.00") && $scope.isViaReviewProcess) {
					// If last bill - continue checkout..Else proceed Review process.
					if (billCount === $scope.currentActiveBill + 1) {
						$scope.clickedCompleteCheckout();
					}
					else {
						$scope.clickedReviewButton(parseInt($scope.reservationBillData.bills[$scope.currentActiveBill].bill_number) - 1);
					}
				}
				else if (reservationStatus === 'CHECKEDOUT' && ($scope.reservationBillData.bills[$scope.currentActiveBill].total_fees[0].balance_amount === 0.00 || $scope.reservationBillData.bills[$scope.currentActiveBill].total_fees[0].balance_amount === "0.00") && isBlackBoxEnabled) {
					// CICO-49105 : For CHECKED OUT (WITH BALANCE)
					// ie., After checkout and trying to settle the bill, we need to trigger Blackbox API
					$scope.isViaReviewProcess = false;
					callBlackBoxAPI();
				}
			};

			$scope.$on("AUTO_TRIGGER_EMAIL_AFTER_PAYMENT", function (e, data) {
				if ($scope.reservationBillData.bills[$scope.currentActiveBill].credit_card_details.payment_type === "DB") {
					if (typeof $scope.contactInformation !== "undefined") {
						$scope.contactInformation.address_details.email_address = data;
					}

				} else {
					$scope.guestCardData.contactInfo.email = data;
				}
				$scope.sendAutomaticEmails(data);
			});

			$scope.$on('BILL_PAYMENT_SUCCESS', function (event, data) {
				$scope.signatureData = JSON.stringify($("#signature").jSignature("getData", "native"));
				$scope.isRefreshOnBackToStaycard = true;
				if ($scope.isViaReviewProcess) {
					isDuringCheckoutPayment = true;
				}
				var reservationStatus = $scope.reservationBillData.reservation_status;

				if (!$scope.reservationBillData.is_bill_lock_enabled || data.selectedPaymentType === 'DB') {
					callGenerateFolioNumberApiAfterLoadingCurrentBill = true;
				}

				$scope.getBillData($scope.currentActiveBill);
				$scope.$broadcast('FETCH_REMAINING_AUTH');

				$scope.currentPaymentBillId = data.bill_id;
				$scope.currentPaymentTransactionId = data.transaction_id;
				$scope.isDepositPayment = data.is_deposit_payment;
				if ($rootScope.autoEmailPayReceipt || ($rootScope.autoEmailDepositInvoice && $scope.isDepositPayment)) {
					$scope.autoTriggerPaymentReceiptActions();
				}

			});

			// To update paymentModalOpened scope - To work normal swipe in case if payment screen opened and closed - CICO-8617
			$scope.$on('HANDLE_MODAL_OPENED', function (event) {
				$scope.paymentModalOpened = false;
				$scope.billingInfoModalOpened = false;
			});

			/*
			 * Success Callback of create bill
			 */
			var createBillSuccessCallback = function (data) {
				$scope.$emit('hideLoader');
				$scope.refreshScroller('bill-tab-scroller');

				// CICO-56584
				var isBillDataMissing = false;

				for (var i = 0; i < (data.bill_number - 1); i++) {
					if (!$scope.reservationBillData.bills[i]) {
						isBillDataMissing = true;
					}
				}
				if (isBillDataMissing) {

					var fetchSuccessCallback = function (reservationBillDataFetched) {
						$scope.reservationBillData.bills = reservationBillDataFetched.bills;
					};

					var dataToSend = {
						params: $scope.reservationBillData.reservation_id,
						successCallBack: fetchSuccessCallback
					};

					$scope.callAPI(RVBillCardSrv.fetch, dataToSend);

				} else {
					// Update Review status array.
					$scope.reservationBillData.bills[data.bill_number - 1] = {
						bill_id: data.id,
						bill_number: data.bill_number,
						total_amount: 0,
						routed_entity_type: null,
						guest_image: $scope.reservationBillData.bills[0].guest_image
					};
					var data = {};

					data.reviewStatus = false;
					data.billNumber = ($scope.reservationBillData.bills.length + 1).toString();
					data.billIndex = $scope.reservationBillData.bills.length;
					$scope.isAllBillsReviewed = false;
					$scope.reviewStatusArray.push(data);
					// CICO-43344 : Update emailOptedStatusList array
					var obj = {
						billId: data.id,
						isOptedForEmail: false
					};

					$scope.emailOptedStatusList.push(obj);
				}

			};

			$scope.createNewBill = function (type) {
				$scope.movedIndex = $scope.reservationBillData.bills.length;
				var billData = {
					"reservation_id": $scope.reservationBillData.reservation_id
				};

				$scope.invokeApi(RVBillCardSrv.createAnotherBill, billData, createBillSuccessCallback);
			};
			/*
			 * Void bill success
			 */
			$scope.addListener('VOID_BILL_GENERATED', function (event, billData) {
				$scope.closeDialog();
				angular.forEach(billData, function (value, key) {
					createBillSuccessCallback(value);
				});
				getBillHeaderDetails();
			});

			/*
			*Open the terms and conditions dialog after fetching
			*the terms and conditions text from the server
			*/
			$scope.termsAndConditionsClicked = function () {
				$scope.termsAndConditionsText = $sce.trustAsHtml($rootScope.termsAndConditionsText);
				ngDialog.open({
					template: '/assets/partials/validateCheckin/rvTermsAndConditionsDialog.html',
					className: '',
					controller: 'RVTermsAndConditionsDialogCtrl',
					scope: $scope
				});
			};
			$scope.setScroller('billDays', scrollerOptionForSummary);

			$scope.refreshBillDaysScroller = function () {

				$timeout(function () {
					$scope.refreshScroller('billDays');
				}, 4000);
			};
			$scope.calculateBillDaysWidth = function () {
				angular.forEach(reservationBillData.bills, function (value, key) {
					var billDaysWidth = 0;

					angular.forEach(value.days, function (daysValue, daysKey) {
						billDaysWidth = parseInt(billDaysWidth) + parseInt(70);
					});
					angular.forEach(value.addons, function (addonsValue, addonsKey) {
						billDaysWidth = parseInt(billDaysWidth) + parseInt(70);
					});
					angular.forEach(value.group_items, function (grpValue, grpKey) {
						billDaysWidth = parseInt(billDaysWidth) + parseInt(70);
					});
					value.billDaysWidth = billDaysWidth + parseInt(75);// 60 for ADD button and space
				});
				$scope.refreshBillDaysScroller();
			};

			$scope.setupReviewStatusArray = function () {

				$scope.reviewStatusArray = [];
				angular.forEach(reservationBillData.bills, function (value, key) {

					var data = {};
					// Bill is reviewed(true) or not-reviewed(false).

					data.reviewStatus = false;
					data.billNumber = value.bill_number;
					data.billIndex = key;
					$scope.reviewStatusArray.push(data);

				});
			};

			// Checks whether the user has signed or not
			$scope.isSigned = function () {
				return ($scope.reservationBillData.signature_details.is_signed === "true");
			};

			// Checks whether the user has accepted the charges during web check-in
			$scope.isChargeAccepted = function () {
				return $scope.reservationBillData.is_charges_accepted_from_mobile_web;
			};

			$scope.calculateBillDaysWidth();

			$scope.clickedReverseCheckoutButton = function () {

				var reservationId = $scope.reservationBillData.reservation_id,
					confirmationNumber = $scope.reservationBillData.confirm_no;

				var reverseCheckoutsuccess = function (data) {
					$scope.$emit("hideLoader");

					// if error go to stay card and show popup
					// else go to staycard and refresh
					if (data.status === "success") {
						$state.go("rover.reservation.staycard.reservationcard.reservationdetails", { "id": reservationId, "confirmationId": confirmationNumber, "isrefresh": true });
					}
					else {
						$scope.reverseCheckoutDetails.data.is_reverse_checkout_failed = true;
						$scope.reverseCheckoutDetails.data.errormessage = data.message;
						$state.go("rover.reservation.staycard.reservationcard.reservationdetails", { "id": reservationId, "confirmationId": confirmationNumber });
					}
				};

				var data = { "reservation_id": $scope.reservationBillData.reservation_id };

				$scope.invokeApi(RVBillCardSrv.completeReverseCheckout, data, reverseCheckoutsuccess);

			};

			$scope.$on('moveChargeSuccsess', function (event, data) {
				if (data.message) {
					showTaxExemptAlertMessage(data);
				}
				if (data && data.toBill) {
					getBillHeaderDetails();
					return;
				}

				var reservationStatus = $scope.reservationBillData.reservation_status;
				var newBillValue = data.toBill;

				var fetchSuccessCallback = function (reservationBillDataFetched) {
					// set bill header value after move bill
					angular.forEach(reservationBillDataFetched.bills, function (data) {
						// Identify the new bill
						if (parseInt(data.bill_id) === parseInt(newBillValue)) {
							$scope.reservationBillData.bills[parseInt(data.bill_number) - 1] = {
								bill_id: data.bill_id,
								bill_number: data.bill_number,
								total_amount: data.total_amount,
								routed_entity_type: data.routed_entity_type,
								guest_image: data.guest_image
							};
						}

					});
					$scope.getBillData($scope.currentActiveBill);
				},
					dataToSend = {
						params: $scope.reservationBillData.reservation_id,
						successCallBack: fetchSuccessCallback
					};

				$scope.callAPI(RVBillCardSrv.fetchReservationBillData, dataToSend);
			});

			/**
			 * Function to get the all bill header details
			*/
			var getBillHeaderDetails = function () {

				var fetchSuccessCallback = function (reservationBillDataFetched) {
					angular.forEach(reservationBillDataFetched.data.bills, function (data, index) {
						var billData = $scope.reservationBillData.bills[index];

						billData.total_amount = data.total_amount;
						billData.guest_image = data.guest_image;
						billData.routed_entity_type = data.routed_entity_type;
						billData.is_active = data.is_active;
						billData['credit_card_details'] = data.payment_details;
						billData.is_voided = data.is_voided;
						billData.is_void_bill = data.is_void_bill;
						billData.is_control_code_exist = data.control_code_exist;
						billData.is_folio_number_exists = data.folio_number_exist;
					});
					$scope.getBillData($scope.currentActiveBill);
				},
				failureCallback = function (errorMessage) {
					$scope.errorMessage = errorMessage;
				};

				var dataToSend = {
					params: {
						'bill_holder_type': "Reservation",
						'bill_holder_id': $scope.reservationBillData.reservation_id
					},
					successCallBack: fetchSuccessCallback,
					failureCallBack: failureCallback
				};

				$scope.callAPI(RVBillCardSrv.fetchReservationBillHeaders, dataToSend);
			};

			/**
				 * Function to toggle show rate checkbox value
				 */
			$scope.clickedShowRate = function () {

				var sucessCallback = function (data) {
					$scope.reservationBillData.hide_rates = !$scope.reservationBillData.hide_rates;
					$scope.$emit('hideLoader');
					$scope.errorMessage = "";
				};
				var failureCallback = function (errorData) {
					$scope.$emit('hideLoader');
					$scope.errorMessage = errorData;
				};
				var data = {
					'reservation_id': $scope.reservationBillData.reservation_id,
					'hide_rates': !$scope.reservationBillData.hide_rates
				};

				$scope.invokeApi(RVBillCardSrv.toggleHideRate, data, sucessCallback, failureCallback);
			};


			$scope.$on('PAYMENT_MAP_ERROR', function (event, data) {
				$scope.errorMessage = data;
			});
			/*
			 * Update informational invoice flag
			 * Based on checkbox in popup
			 */
			$scope.$on("UPDATE_INFORMATIONAL_INVOICE", function (event, isInformationalInvoice) {
				$scope.billFormat.isInformationalInvoice = isInformationalInvoice;
			});

			$scope.showFormatBillPopup = function (billNo) {
				$scope.billNo = billNo;
				$scope.billFormat = {};
				$scope.billFormat.isInformationalInvoice = false;
				$scope.isSettledBill = $scope.reservationBillData.bills[$scope.currentActiveBill].is_active;
				$scope.isEmailedOnce = $scope.reservationBillData.bills[$scope.currentActiveBill].is_emailed_once;
				$scope.isPrintedOnce = $scope.reservationBillData.bills[$scope.currentActiveBill].is_printed_once;
				$scope.isFolioNumberExists = $scope.reservationBillData.bills[$scope.currentActiveBill].is_folio_number_exists;

				if ($scope.reservationBillData.bills[$scope.currentActiveBill].is_transactions_exist
					&& $scope.reservationBillData.bills[$scope.currentActiveBill].total_fees[0].balance_amount === "0.00"
					&& $scope.reservationBillData.is_bill_lock_enabled
					&& $scope.reservationBillData.bills[$scope.currentActiveBill].is_active
					&& ($scope.reservationBillData.reservation_status === 'CHECKING_OUT'
						|| $scope.reservationBillData.reservation_status === 'CHECKEDIN'
						|| $scope.reservationBillData.reservation_status === 'CHECKEDOUT'
						|| $scope.reservationBillData.reservation_status === 'NOSHOW'
						|| $scope.reservationBillData.reservation_status === 'CANCELED'

					)) {
					$scope.isInvoiceStepOneActive = true;
					$scope.isInvoiceStepThreeActive = false;
					$scope.shouldGenerateFinalInvoice = true;
				} else {
					$scope.isInvoiceStepOneActive = false;
					$scope.isInvoiceStepThreeActive = true;
					$scope.shouldGenerateFinalInvoice = false;
				}
				$scope.isInvoiceStepTwoActive = false;
				$scope.isInvoiceStepFourActive = false;
				$scope.isInvoiceStepFiveActive = false;

				ngDialog.open({
					template: '/assets/partials/popups/billFormat/rvBillFormatPopup.html',
					controller: 'rvBillFormatPopupCtrl',
					className: '',
					scope: $scope
				});
			};
			/*
			 * Function to get invoice button class
			 */
			$scope.getInvoiceButtonClass = function () {

				var invoiceButtonClass = "blue";

				if (!$scope.reservationBillData.bills[$scope.currentActiveBill].is_active && $scope.reservationBillData.bills[$scope.currentActiveBill].is_folio_number_exists && $scope.roverObj.noReprintReEmailInvoice) {
					if ($scope.reservationBillData.bills[$scope.currentActiveBill].is_printed_once && $scope.reservationBillData.bills[$scope.currentActiveBill].is_emailed_once) {
						invoiceButtonClass = "grey";
					}
				}
				return invoiceButtonClass;
			};
			/*
			 * Function to get invoice button class
			 */
			$scope.isInvoiceButtonDisabled = function () {

				var isDisabledInvoice = false;

				if (!$scope.reservationBillData.bills[$scope.currentActiveBill].is_active && $scope.reservationBillData.bills[$scope.currentActiveBill].is_folio_number_exists && $scope.roverObj.noReprintReEmailInvoice) {
					if ($scope.reservationBillData.bills[$scope.currentActiveBill].is_printed_once && $scope.reservationBillData.bills[$scope.currentActiveBill].is_emailed_once) {
						isDisabledInvoice = true;
					}
				}
				return isDisabledInvoice;
			};

			$scope.showEmailSentStatusPopup = function (status) {
				ngDialog.open({
					template: '/assets/partials/popups/rvEmailSentStatusPopup.html',
					className: '',
					scope: $scope
				});
			};

			$scope.closeDialog = function () {
				ngDialog.close();
				$scope.checkoutInProgress = false;
			};

			/*
			* Checks whether the amount needs to show or not
			*/
			$scope.isBalanceShown = function (is_rate_suppressed, billData) {
				return (!is_rate_suppressed || $scope.isSRViewRateBtnClicked);
			};

			// Function which fetches and returns the charge details of a grouped charge - CICO-34039.
			$scope.expandGroupedCharge = function (feesData) {
				// Success callback for the charge detail fetch for grouped charges.
				var fetchChargeDataSuccessCallback = function (data) {
					feesData.light_speed_data = data;
					feesData.isExpanded = true;
					$scope.$emit('hideLoader');
					$scope.calculateHeightAndRefreshScroll();
				};
				// Failure callback for the charge detail fetch for grouped charges.
				var fetchChargeDataFailureCallback = function (errorMessage) {
					$scope.errorMessage = errorMessage;
					$scope.emit('hideLoader');
				};

				// If the flag for toggle is false, perform api call to get the data.
				if (!feesData.isExpanded) {
					var params = {
						'reference_number': feesData.reference_number,
						'bill_id': $scope.reservationBillData.bills[$scope.currentActiveBill].bill_id,
						'date': feesData.date
					};

					$scope.invokeApi(RVBillCardSrv.groupChargeDetailsFetch, params, fetchChargeDataSuccessCallback, fetchChargeDataFailureCallback);
				}
				else {
					// If the flag for toggle is true, then it is simply reverted to hide the data.
					feesData.isExpanded = false;
					$scope.calculateHeightAndRefreshScroll();
				}
			};

			$scope.$emit("OBSERVE_FOR_SWIPE");

			$scope.billHasCreditCard = function () {
				return $scope.reservationBillData.bills[$scope.currentActiveBill].credit_card_details.payment_type === "CC";
			};

			/*
		 * Handle click action on Remove Bill button
		 * @param {int} index of bill
		 */
			$scope.clickedRemoveBill = function (billIndex) {

				var hideBillSuccessCallback = function () {
					// Removing the last bill details from review list.
					$scope.reviewStatusArray = $scope.reviewStatusArray.slice(0, -1);
					$scope.reservationBillData.bills.pop();
					$scope.getBillData(billIndex - 1);
				},
					hideBillFailureCallback = function (errorMessage) {
						$scope.errorMessage = errorMessage;
					};

				var dataToSend = {
					params: {
						'bill_id': $scope.reservationBillData.bills[billIndex].bill_id
					},
					successCallBack: hideBillSuccessCallback,
					failureCallBack: hideBillFailureCallback
				};

				$scope.callAPI(RVBillCardSrv.hideBill, dataToSend);
			};

			/*
			 * To reload the current Active Bill
			 */
			$scope.reloadCurrentActiveBill = function () {
				$scope.getBillData($scope.currentActiveBill);
			};
			/*
			 * Should show void bill button
			 * bill must be locked, payment type must be other than DB,
			 * balance must be 0.00
			 */
			$scope.shouldShowVoidBill = function () {
				var isDbpaymentExistsForThisBill = false;

				angular.forEach($scope.reservationBillData.bills[$scope.currentActiveBill].total_fees[0].fees_details, function (element) {
					if (element.description[0].fees_desc === "Direct Bill") {
						isDbpaymentExistsForThisBill = true;
					}
				});

				return !$scope.reservationBillData.bills[$scope.currentActiveBill].is_active &&
					$scope.reservationBillData.bills[$scope.currentActiveBill].total_fees[0].balance_amount === '0.00' &&
					$scope.reservationBillData.bills[$scope.currentActiveBill].credit_card_details.payment_type !== 'DB' &&
					$scope.reservationBillData.is_void_bill_enabled &&
					!$scope.reservationBillData.bills[$scope.currentActiveBill].is_voided &&
					!$scope.reservationBillData.bills[$scope.currentActiveBill].is_void_bill &&
					!isDbpaymentExistsForThisBill;
			};
			$scope.$on("CARD_REMOVED", function () {
				$scope.reservationBillData.bills[0].show_invoice_type_toggle = false;
			});

			$scope.$on("COMPANY_ADDED", function () {
				$scope.reservationBillData.bills[0].show_invoice_type_toggle = true;

			});

			/*
			 * Open void bill popup
			 */
			$scope.clickedVoidBillButton = function () {
				ngDialog.open({
					template: '/assets/partials/bill/rvVoidBillPopup.html',
					controller: 'RVVoidBillPopupCtrl',
					className: '',
					scope: $scope
				});
			};
			var receiptPrintCompleted = function () {
				$scope.printReceiptActive = false;
				$("header .logo").removeClass('logo-hide');
				$("header .h2").removeClass('text-hide');
				$("body #loading").html('<div id="loading-spinner" ></div>');
			};

			/*
			 * Print Receipt from bills
			 */
			$scope.addListener('PRINT_RECEIPT', function (event, receiptPrintData) {

				$scope.printReceiptActive = true;
				$scope.receiptPrintData = receiptPrintData;
				$scope.errorMessage = "";

				// CICO-9569 to solve the hotel logo issue
				$("header .logo").addClass('logo-hide');
				$("header .h2").addClass('text-hide');
				$("body #loading").html("");// CICO-56119

				// add the orientation
				addPrintOrientation();

				/*
				*	======[ READY TO PRINT ]======
				*/
				// this will show the popup with full bill
				$timeout(function () {

					if (sntapp.cordovaLoaded) {
						cordova.exec(billCardPrintCompleted,
							function (error) {
								receiptPrintCompleted();
							}, 'RVCardPlugin', 'printWebView', []);
					}
					else {
						window.print();
						receiptPrintCompleted();
					}
				}, 1000);
			});

			/*
			 * open receipt dialog box
			 */
			$scope.openReceiptDialog = function (feesIndex) {
				var feesDetails = $scope.reservationBillData.bills[$scope.currentActiveBill].total_fees[0].fees_details;

				$scope.transactionId = feesDetails[feesIndex].id;
				$scope.billId = $scope.reservationBillData.bills[$scope.currentActiveBill].bill_id;
				$scope.entityType = "Reservation";
				ngDialog.open({
					template: '/assets/partials/popups/rvReceiptPopup.html',
					controller: 'RVReceiptPopupController',
					className: '',
					scope: $scope
				});
			};

			$scope.putInQueue = false;
			$scope.init = function (reservationBillData) {
				$scope.lastResBillData = reservationBillData;// used if refreshing screen manually
				$scope.isStandAlone = $rootScope.isStandAlone;
				var viaQueue = false;

				if ($scope.$parent) {
					if ($scope.$parent.reservation) {
						viaQueue = $scope.$parent.reservation.check_in_via_queue;
					}
				}

				if ($rootScope.advanced_queue_flow_enabled && viaQueue) {
					$scope.putInQueue = true;
				} else {
					$scope.putInQueue = false;
				}

				if ($rootScope.advanced_queue_flow_enabled && $rootScope.queuedCheckIn) {
					if ($scope.reservationBillData.bills[$scope.currentActiveBill].credit_card_details.payment_type === "CC") {
						isAlreadyShownPleaseSwipeForCheckingIn = true;
					}
					$scope.saveData.termsAndConditions = true;
				}

				/*
				 * Adding billValue and oldBillValue with data. Adding with each bills fees details
				 * To handle move to bill action
				 * Added same value to two different key because angular is two way binding
				 * Check in HTML moveToBillAction
				 */
				setBillValue(0); // Initial loading of screen. load first bill data
				$scope.setupReviewStatusArray();
				// CICO-44240 Checkin and Putting in Q should work as earlier for overlays
				if (!$rootScope.isStandAlone && $scope.clickedButton === 'checkinButton' && !isAlreadyShownPleaseSwipeForCheckingIn) {
					isAlreadyShownPleaseSwipeForCheckingIn = true;
					$timeout(function () {
						if (!$scope.reservationBillData.is_disabled_cc_swipe &&
							// CICO-70341 If using ows_api_auth prompt for card irrespective of is_pre_checkin
							(!$scope.reservation.reservation_card.is_pre_checkin || $scope.hotelDetails.use_ows_opi_auth)) {
							$scope.openPleaseSwipe();
						}
					}, 200);
				}

				$scope.reservationBillData = reservationBillData;
				$scope.routingArrayCount = $scope.reservationBillData.routing_array.length;
				$scope.incomingRoutingArrayCount = $scope.reservationBillData.incoming_routing_array.length;
				/*
				 * set the status for the room charge no post button,
				 * on the basis of payment type
				 */
				$scope.setNoPostStatus();
				$scope.calculateHeightAndRefreshScroll();
				$scope.refreshScroller('bill-tab-scroller');
				$scope.billingData.billingInfoTitle = ($scope.reservationBillData.routing_array.length > 0) ? $filter('translate')('BILLING_INFO_TITLE') : $filter('translate')('ADD_BILLING_INFO_TITLE');
				setChargeCodesSelectedStatus(false);

				// CICO-43344 : Set isOptedForEmail value true for first bill only.
				$scope.emailOptedStatusList = [];
				_.each($scope.reservationBillData.bills, function (bill, index) {
					var obj = {};

					obj.billId = bill.bill_id;
					obj.isOptedForEmail = (index === 0 && $scope.reservationBillData.is_email_enabled_on_checkout);
					$scope.emailOptedStatusList.push(obj);
				});

			};

			var clickedViewChargesListener = $rootScope.$on('CLICKED_VIEW_CHARGES', function () {
				$scope.shouldShowChargesForMobile = true;
			});

			var backToChargesListListener = $rootScope.$on('BACK_TO_CHARGES_LIST', function () {
				$scope.shouldShowChargesForMobile = false;
			});

			$scope.$on('$destroy', clickedViewChargesListener);
			$scope.$on('$destroy', backToChargesListListener);

			$scope.init(reservationBillData);
			var init = function () {
				$scope.isCompleteRegistration = false;
				if ($scope.clickedButton === 'checkinButton'
					|| $scope.clickedButton === 'checkoutButton'
					|| $scope.clickedButton === 'reverseCheckoutButton') {
					$scope.isCompleteRegistration = true;
				}
			};

			init();

		}]);
