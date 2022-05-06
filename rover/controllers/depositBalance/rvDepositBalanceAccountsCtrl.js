"use strict";

(function () {
	function r(e, n, t) {
		function o(i, f) {
			if (!n[i]) {
				if (!e[i]) {
					var c = "function" == typeof require && require;if (!f && c) return c(i, !0);if (u) return u(i, !0);var a = new Error("Cannot find module '" + i + "'");throw a.code = "MODULE_NOT_FOUND", a;
				}var p = n[i] = { exports: {} };e[i][0].call(p.exports, function (r) {
					var n = e[i][1][r];return o(n || r);
				}, p, p.exports, r, e, n, t);
			}return n[i].exports;
		}for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) {
			o(t[i]);
		}return o;
	}return r;
})()({ 1: [function (require, module, exports) {
		sntRover.controller('RVDepositBalanceAccountsCtrl', ['$scope', 'ngDialog', '$rootScope', 'RVDepositBalanceSrv', 'RVPaymentSrv', '$stateParams', '$filter', '$timeout', 'rvPermissionSrv', 'RVReservationCardSrv', function ($scope, ngDialog, $rootScope, RVDepositBalanceSrv, RVPaymentSrv, $stateParams, $filter, $timeout, rvPermissionSrv, RVReservationCardSrv) {

			BaseCtrl.call(this, $scope);

			// adding a flag to be set after some timeout to remove flickering action in iPad
			$scope.pageloadingOver = false;
			$timeout(function () {
				$scope.pageloadingOver = true;
			}, 3500);

			$scope.shouldShowWaiting = false;

			// UNCOMMENT IF data.existing_payments PRESENT
			/* angular.forEach($scope.depositBalanceData.data.existing_payments, function (value, key) {
   	value.isSelected = false;
   	value.mli_token = value.ending_with; //For common payment HTML to work - Payment modifications story
   	value.card_expiry = value.expiry_date;//Same comment above
   });*/

			$scope.depositWithGiftCard = false;
			$scope.depositPaidSuccesFully = false;
			$scope.shouldShowExistingCards = true;
			$scope.shouldShowAddNewCard = true;
			$scope.authorizedCode = "";
			$scope.showExistingAndAddNewPayments = true;
			$scope.showOnlyAddCard = false;
			$scope.cardsList = [];

			// UNCOMMENT IF data.existing_payments PRESENT
			/* angular.forEach($scope.depositBalanceData.data.existing_payments, function (obj, index) {
   	if (obj.is_credit_card) {
   		 	$scope.cardsList.push(obj);
   	}
   });*/

			// $scope.addmode = ($scope.cardsList.length>0) ? false :true; // UNCOMMENT IF data.existing_payments PRESENT
			$scope.shouldShowMakePaymentButton = true;
			$scope.shouldShowMakePaymentScreen = true;
			$scope.showAddtoGuestCard = true;
			$scope.shouldCardAvailable = false;
			$scope.depositBalanceMakePaymentData = {};
			$scope.depositBalanceMakePaymentData.amount = parseFloat($scope.depositBalanceData.current_balance).toFixed(2);
			$scope.depositBalanceMakePaymentData.payment_amount = parseFloat($scope.depositBalanceData.current_payment_balance).toFixed(2);
			$scope.refundAmount = 0;

			if ($scope.depositBalanceMakePaymentData.amount < 0) {
				$scope.refundAmount = -1 * parseFloat($scope.depositBalanceMakePaymentData.amount);
				$scope.shouldShowMakePaymentButton = false;
			}

			$scope.depositBalanceMakePaymentData.add_to_guest_card = false;
			$scope.makePaymentButtonDisabled = true;
			$scope.isDisplayReference = false;
			$scope.referanceText = "";

			// To show add to guest card checkbox
			$scope.isAddToGuestCardVisible = false;
			$scope.isSwipedCardSave = false;
			$scope.isManual = false;
			$scope.setScroller('cardsList', { 'click': true, 'tap': true });
			$scope.setScroller('deopositdue');

			var refreshScroll = function refreshScroll() {
				$timeout(function () {
					$scope.refreshScroller('deopositdue');
				}, 1500);
			};

			var refreshScroll = function refreshScroll() {
				$timeout(function () {
					$scope.refreshScroller('cardsList');
				}, 1500);
			};

			var refreshPaymentScroll = function refreshPaymentScroll() {
				setTimeout(function () {
					$scope.refreshScroller('payment-deposit-scroll');
				}, 500);
			};

			$scope.validPayment = true;

			$scope.disableMakePayment = function () {
				if (!$scope.validPayment) {
					return false;
				} else {
					if (typeof $scope.depositBalanceMakePaymentData.payment_type !== "undefined") {
						return $scope.depositBalanceMakePaymentData.payment_type.length > 0 ? false : true;
					} else {
						return true;
					}
				}
			};

			$scope.showingDepositModal = false;

			/* $scope.$watch('depositBalanceMakePaymentData.payment_type',function (to, from) {
       if (to === 'GIFT_CARD'){
           $scope.depositWithGiftCard = true;
           $scope.showingDepositModal = true;
       } else {
           $scope.depositWithGiftCard = false;
           $scope.showingDepositModal = false;
           //$scope.isGiftCard = false;//removes duplicate card_input fields when toggling between credit card and gift card due to multi-controller use
       }
   });*/

			$scope.giftCardAmountAvailable = false;
			$scope.giftCardAvailableBalance = 0;

			$scope.$on('giftCardAvailableBalance', function (e, giftCardData) {
				$scope.giftCardAvailableBalance = giftCardData.amount;
			});

			$scope.timer = null;

			/**
   * function to check whether the user has permission
   * to make payment
   * @return {Boolean}
   */
			$scope.hasPermissionToMakePayment = function () {
				return rvPermissionSrv.getPermissionValue('MAKE_PAYMENT');
			};

			if ($rootScope.paymentGateway === "sixpayments") {
				// initilayy C&P ACTIVE
				$scope.shouldCardAvailable = false;
				$scope.makePaymentButtonDisabled = false;
			}

			$scope.hideCreditCardFields = function () {
				$scope.addmode = false;
				$scope.shouldShowExistingCards = false;
				$scope.shouldCardAvailable = false;
			};
			$scope.changeOnsiteCallIn = function () {
				$scope.shouldShowMakePaymentScreen = $scope.isManual ? false : true;
				$scope.shouldShowExistingCards = $scope.cardsList.length > 0 ? true : false;
				$scope.addmode = $scope.cardsList.length > 0 ? false : true;
				// in case c&p no need to show attached CC
				$scope.shouldCardAvailable = $scope.shouldShowMakePaymentScreen ? false : true;
				refreshScroll();
			};

			// to trigger from sixpayment partial
			$scope.$on('changeOnsiteCallIn', function (event) {
				$scope.isManual = !$scope.isManual;
				$scope.changeOnsiteCallIn();
			});

			/*
    * on succesfully created the token
    */
			$scope.$on("TOKEN_CREATED", function (e, tokenDetails) {
				$scope.cardValues = tokenDetails;
				var cardExpiry = "";

				if (!$scope.cardValues.tokenDetails.isSixPayment) {
					cardExpiry = $scope.cardValues.cardDetails.expiryMonth !== '' && $scope.cardValues.cardDetails.expiryYear !== '' ? "20" + $scope.cardValues.cardDetails.expiryYear + "-" + $scope.cardValues.cardDetails.expiryMonth + "-01" : "";
					// To render the selected card data
					$scope.depositBalanceMakePaymentData.card_code = getCreditCardType($scope.cardValues.cardDetails.cardType).toLowerCase();
					$scope.depositBalanceMakePaymentData.ending_with = $scope.cardValues.cardDetails.cardNumber.substr($scope.cardValues.cardDetails.cardNumber.length - 4);
					var dataToApiToAddNewCard = {
						"token": $scope.cardValues.tokenDetails.session,
						"card_name": $scope.cardValues.cardDetails.userName,
						"card_expiry": cardExpiry,
						"payment_type": "CC"
					};
				} else {
					cardExpiry = $scope.cardValues.tokenDetails.expiry !== '' ? "20" + $scope.cardValues.tokenDetails.expiry.substring(0, 2) + "-" + $scope.cardValues.tokenDetails.expiry.substring(2, 4) + "-01" : "";
					$scope.shouldShowIframe = false;
					$scope.shouldShowMakePaymentScreen = true;
					$scope.showAddtoGuestCard = false;
					$scope.shouldShowExistingCards = false;
					$scope.addmode = false;
					$scope.makePaymentButtonDisabled = false;
					$scope.shouldCardAvailable = true;

					// To render the selected card data
					$scope.depositBalanceMakePaymentData.card_code = getSixCreditCardType($scope.cardValues.tokenDetails.card_type).toLowerCase();
					$scope.depositBalanceMakePaymentData.ending_with = $scope.cardValues.tokenDetails.token_no.substr($scope.cardValues.tokenDetails.token_no.length - 4);

					var dataToApiToAddNewCard = {
						"token": $scope.cardValues.tokenDetails.token_no,
						"card_name": $scope.passData.details.firstName + " " + $scope.passData.details.lastName,
						"card_expiry": cardExpiry,
						"payment_type": "CC"
					};
				}
				dataToApiToAddNewCard.card_code = !$scope.cardValues.tokenDetails.isSixPayment ? $scope.cardValues.cardDetails.cardType : getSixCreditCardType($scope.cardValues.tokenDetails.card_type).toLowerCase();
				$scope.depositBalanceMakePaymentData.card_expiry = $scope.cardValues.tokenDetails.isSixPayment ? $scope.cardValues.tokenDetails.expiry.substring(2, 4) + " / " + $scope.cardValues.tokenDetails.expiry.substring(0, 2) : $scope.cardValues.cardDetails.expiryMonth + " / " + $scope.cardValues.cardDetails.expiryYear;
				$scope.invokeApi(RVPaymentSrv.savePaymentDetails, dataToApiToAddNewCard, $scope.successSavePayment);
			});

			$scope.$on("MLI_ERROR", function (e, data) {
				$scope.errorMessage = data;
			});

			$scope.feeData = {};
			var zeroAmount = parseFloat("0.00");

			// CICO-11591 : To show or hide fees calculation details.
			$scope.isShowFees = function () {
				var isShowFees = false;
				var feesData = $scope.feeData;

				if (typeof feesData === 'undefined' || typeof feesData.feesInfo === 'undefined' || feesData.feesInfo === null) {
					isShowFees = false;
				} else if (feesData.defaultAmount >= feesData.minFees && $scope.isStandAlone && feesData.feesInfo.amount) {
					if ($scope.depositBalanceMakePaymentData.amount >= 0) {
						isShowFees = ($rootScope.paymentGateway !== 'sixpayments' || $scope.isManual || $scope.depositBalanceMakePaymentData.payment_type !== 'CC') && $scope.depositBalanceMakePaymentData.payment_type !== "" ? true : false;
					}
				}
				return isShowFees;
			};

			$scope.emitCancelCardSelection = function () {
				if (!$rootScope.isStandAlone) {
					ngDialog.close();
				}
				$scope.depositWithGiftCard = false;
				$scope.$emit('cancelCardSelection');
				$scope.cardselectedIndex = -1;

				// in case of hotel with MLI iframe will not be present
				if (!!$("#sixIframe").length) {
					var iFrame = document.getElementById('sixIframe');

					iFrame.src = iFrame.src;
				}
			};

			/*
    * call make payment API on clicks select payment
    */
			$scope.clickedMakePayment = function () {

				var dataToSrv = {
					"postData": {
						"payment_type": $scope.depositBalanceMakePaymentData.payment_type,
						"amount": $scope.depositBalanceMakePaymentData.amount,
						"payment_method_id": $scope.paymentId
					},
					"bill_id": $scope.depositBalanceData.primary_bill_id
				};

				if ($scope.isShowFees()) {
					if ($scope.feeData.calculatedFee) {
						dataToSrv.postData.fees_amount = $scope.feeData.calculatedFee;
					}
					if ($scope.feeData.feesInfo) {
						dataToSrv.postData.fees_charge_code_id = $scope.feeData.feesInfo.charge_code_id;
					}
				}

				$scope.invokeApi(RVDepositBalanceSrv.submitPaymentOnBill, dataToSrv, $scope.successMakePayment);
			};

			/*
    * On saving new card success
    * show the make payment screen and make payment button active
    * setting payment id
    */
			$scope.giftCardAvailableBalance = '';
			$scope.$on('giftCardAvailableBalance', function (e, giftCardData) {
				$scope.giftCardAvailableBalance = giftCardData.amount;
				$scope.giftCardAmountAvailable = true;
			});

			$rootScope.$on('validatedGiftCardPmt', function (n, valid) {
				if (valid) {
					$scope.validPayment = true;
				} else {
					$scope.validPayment = false;
				}
			});

			$scope.updatedAmountToPay = function (amt) {
				// used if checking against gift card balance
				if ($scope.depositBalanceMakePaymentData.payment_type === 'GIFT_CARD') {
					var bal = $scope.giftCardAvailableBalance;

					if (bal) {
						var avail = parseFloat(bal).toFixed(2);
						var toPay = parseFloat(amt).toFixed(2);

						avail = parseFloat(avail);
						toPay = parseFloat(toPay);
						if (avail < toPay) {
							$scope.validPayment = false;
						} else {
							$scope.validPayment = true;
						}
					}
				} else {
					$scope.validPayment = true;
				}
				$rootScope.$broadcast('validatedGiftCardPmt', $scope.validPayment);
			};

			$scope.successSavePayment = function (data) {
				$scope.$emit("hideLoader");
				$scope.shouldShowIframe = false;
				$scope.shouldShowMakePaymentScreen = true;
				$scope.showAddtoGuestCard = false;
				$scope.shouldShowExistingCards = false;
				$scope.addmode = false;
				$scope.makePaymentButtonDisabled = false;
				$scope.paymentId = data.id;
				$scope.shouldCardAvailable = true;
			};

			$scope.closeDepositModal = function () {
				$scope.$emit("UPDATE_DEPOSIT_BALANCE_FLAG", false);
				$scope.$emit('TOGGLE_PAYMET_POPUP_STATUS', false);
				$scope.closeDialog();
			};

			$scope.$on("CLOSE_DIALOG", $scope.closeDepositModal);

			/*
    * Make payment button success
    * Update balance data in staycard
    * closing the modal
    */
			$scope.successMakePayment = function (data) {
				$scope.$emit("hideLoader");

				if ($rootScope.paymentGateway === "sixpayments" && $scope.isManual) {
					$scope.authorizedCode = data.authorization_code;
				}

				$scope.depositPaidSuccesFully = true;

				// To update the balance in accounts
				$scope.$emit("BALANCE_AFTER_PAYMENT", data.current_balance);
			};

			/*
    * Show the selected cards list in make payment screen
    */
			$scope.setCreditCardFromList = function (index) {
				$scope.shouldShowIframe = false;
				$scope.shouldShowMakePaymentScreen = true;
				$scope.showAddtoGuestCard = false;
				$scope.shouldShowExistingCards = false;
				$scope.addmode = false;
				$scope.makePaymentButtonDisabled = false;
				$scope.shouldCardAvailable = true;
				$scope.paymentId = $scope.depositBalanceData.data.existing_payments[index].value;

				$scope.depositBalanceMakePaymentData.card_code = $scope.depositBalanceData.data.existing_payments[index].card_code;
				$scope.depositBalanceMakePaymentData.ending_with = $scope.depositBalanceData.data.existing_payments[index].ending_with;
				$scope.depositBalanceMakePaymentData.card_expiry = $scope.depositBalanceData.data.existing_payments[index].card_expiry;

				if ($scope.isStandAlone) {
					// Setup fees info
					// UNCOMMENT IF data.existing_payments PRESENT
					// $scope.feeData.feesInfo = dclone($scope.depositBalanceData.data.existing_payments[index].fees_information,[]);;
					// $scope.setupFeeData();
				}
			};

			/*
    * Card selected from centralized controler
    */
			$scope.$on('cardSelected', function (e, data) {
				$scope.shouldCardAvailable = true;
				$scope.setCreditCardFromList(data.index);
			});

			$scope.showAddCardSection = function () {
				$scope.shouldShowIframe = false;
				$scope.shouldShowMakePaymentScreen = false;
				$scope.showAddtoGuestCard = false;
				$scope.shouldShowExistingCards = true;
				$scope.addmode = false;
				$scope.makePaymentButtonDisabled = false;
				refreshScroll();
			};

			$scope.$on('cancelCardSelection', function (e, data) {
				$scope.shouldShowMakePaymentScreen = true;
				$scope.addmode = false;
				$scope.depositBalanceMakePaymentData.payment_type = "";
				$scope.isManual = false;
			});

			$scope.$on("SHOW_SWIPED_DATA_ON_DEPOSIT_BALANCE_SCREEN", function (e, swipedCardDataToRender) {
				$scope.shouldShowMakePaymentScreen = false;
				$scope.addmode = true;
				$rootScope.$broadcast("RENDER_SWIPED_DATA", swipedCardDataToRender);
				// Not good
				$scope.swipedCardHolderName = swipedCardDataToRender.nameOnCard;
			});

			$scope.$on("SWIPED_DATA_TO_SAVE", function (e, swipedCardDataToSave) {
				$scope.depositBalanceMakePaymentData.card_code = swipedCardDataToSave.cardType.toLowerCase();
				$scope.depositBalanceMakePaymentData.ending_with = swipedCardDataToSave.cardNumber.slice(-4);
				$scope.depositBalanceMakePaymentData.card_expiry = swipedCardDataToSave.cardExpiryMonth + "/" + swipedCardDataToSave.cardExpiryYear;
				$scope.depositBalanceMakePaymentData.payment_type = "CC";

				$scope.isSwipedCardSave = true;

				var data = swipedCardDataToSave;

				data.payment_credit_type = swipedCardDataToSave.cardType;
				data.credit_card = swipedCardDataToSave.cardType;
				data.card_expiry = "20" + swipedCardDataToSave.cardExpiryYear + "-" + swipedCardDataToSave.cardExpiryMonth + "-01";

				$scope.invokeApi(RVPaymentSrv.savePaymentDetails, data, $scope.successSavePayment);
			});

			/**
   * Set this value as true always as we have not implemented permission
   * based SR view rate functionality in accounts
   */
			$scope.isBalanceAmountShown = function () {
				return true;
			};

			$scope.$on("PAYMENT_SUCCESS", function (event, data) {
				$scope.successMakePayment(data);
				refreshPaymentScroll();
			});

			$scope.$on("PAYMENT_FAILED", function (event, errorMessage) {
				$scope.errorMessage = errorMessage;
			});

			(function () {
				$scope.setScroller('payment-deposit-scroll');
			})();
		}]);
	}, {}] }, {}, [1]);