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
		sntRover.controller('RVReservationDepositController', ['$rootScope', '$scope', '$stateParams', 'RVPaymentSrv', '$timeout', 'RVReservationCardSrv', '$state', '$filter', 'ngDialog', 'rvPermissionSrv', 'RVAutomaticEmailSrv', function ($rootScope, $scope, $stateParams, RVPaymentSrv, $timeout, RVReservationCardSrv, $state, $filter, ngDialog, rvPermissionSrv, RVAutomaticEmailSrv) {

			BaseCtrl.call(this, $scope);

			SharedMethodsBaseCtrl.call(this, $scope, $rootScope, RVAutomaticEmailSrv, ngDialog);
			// adding a flag to be set after some timeout to remove flickering action in iPad
			$scope.pageloadingOver = false;
			$timeout(function () {
				$scope.pageloadingOver = true;
			}, 1000);

			var runDigestCycle = function runDigestCycle() {
				if (!$scope.$$phase) {
					$scope.$digest();
				}
			};

			$scope.errorMessage = '';
			$scope.showCancelCardSelection = true;
			$scope.addmode = false;
			$scope.referanceText = "";
			$scope.showCCPage = false;
			$scope.showAddtoGuestCard = true;
			$scope.cardSelected = false;
			$scope.isDisplayReference = false;
			$scope.depositInProcess = false;
			$scope.errorOccured = false;
			$scope.errorMessage = "";
			$scope.depositPaidSuccesFully = false;
			$scope.successMessage = "";
			$scope.authorizedCode = "";
			$scope.swippedCard = false;
			$scope.newCardAdded = false;
			$scope.shouldShowWaiting = false;
			$scope.isSwipedCardSave = false;
			$scope.cardsList = [];
			$scope.$emit("UPDATE_STAY_CARD_DEPOSIT_FLAG", true);

			$scope.depositData = {
				selectedCard: -1,
				amount: "",
				viewCardsList: false,
				existingCard: false,
				cardId: "",
				cardNumber: "",
				expiry_date: "",
				card_type: "",
				isDisplayReference: false,
				referanceText: "",
				addToGuestCard: false
			};

			// CICO-30207
			$scope.isReservationRateSuppressed = $scope.reservationData.reservation_card.is_rate_suppressed_present_in_stay_dates;
			$scope.depositData.paymentType = $scope.reservationData.reservation_card.payment_method_used ? $scope.reservationData.reservation_card.payment_method_used : "";

			$scope.reservationData = {};
			$scope.reservationData.depositAmount = "";
			$scope.reservationData.depositPaymentAmount = "";
			$scope.depositPolicyName = "";
			$scope.reservationData.referanceText = "";
			$scope.isDepositEditable = !!$scope.depositDetails.deposit_policy.allow_deposit_edit;
			$scope.rateCurrency = $scope.depositDetails.deposit_policy.rate_currency;
			$scope.depositPolicyName = $scope.depositDetails.deposit_policy.description;
			$scope.reservationData.depositAmount = parseFloat($scope.depositDetails.deposit_amount).toFixed(2);
			$scope.reservationData.depositPaymentAmount = parseFloat($scope.depositDetails.deposit_payment_amount).toFixed(2);

			$scope.closeDialog = function () {
				$scope.$emit("UPDATE_STAY_CARD_DEPOSIT_FLAG", false);
				// to add stjepan's popup showing animation
				$rootScope.modalOpened = false;
				$timeout(function () {
					ngDialog.close();
				}, 250);
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
   * function to decide visibility of Pay now button modal popup
   * @return {Boolean}
   */
			$scope.shouldHidePayNowButtonInPopUp = function () {
				var paymentType = $scope.depositData.paymentType,
				    resData = $scope.reservationData;

				return paymentType === '' || paymentType === null || !$scope.hasPermissionToMakePayment();
			};

			$scope.setScroller('cardsList', { 'click': true, 'tap': true });
			var refreshCardsList = function refreshCardsList() {
				$timeout(function () {
					$scope.refreshScroller('cardsList');
				}, 3000);
			};

			var showCardOptions = function showCardOptions() {
				$scope.showCCPage = true;
				$scope.swippedCard = true;
				$scope.addmode = $scope.cardsList.length > 0 ? false : true;
				if ($scope.addmode) {
					$scope.$broadcast('CLICK_ADD_NEW_CARD');
				}
			};

			$scope.changeOnsiteCallIn = function () {
				$scope.isManual ? showCardOptions() : "";
				refreshCardsList();
			};
			// to trigger from sixpayment partial
			$scope.$on('changeOnsiteCallIn', function (event) {
				$scope.isManual = !$scope.isManual;
				$scope.changeOnsiteCallIn();
			});

			$scope.changePaymentType = function () {
				$scope.checkReferencetextAvailable();

				if ($scope.depositData.paymentType === "CC") {
					$rootScope.paymentGateway === 'sixpayments' ? "" : showCardOptions();
				}
			};

			$scope.proceedCheckin = function () {

				$scope.closeDialog();
				$scope.$emit("PROCEED_CHECKIN");
			};

			$scope.tryAgain = function () {
				$scope.depositInProcess = false;
				$scope.errorMessage = "";
				$scope.errorOccured = false;
			};

			/*
    * card details based on six payment/MLI
    *
    */

			var retrieveCardtype = function retrieveCardtype() {
				var cardType = $scope.newPaymentInfo.tokenDetails.isSixPayment ? getSixCreditCardType($scope.newPaymentInfo.tokenDetails.card_type).toLowerCase() : getCreditCardType($scope.newPaymentInfo.cardDetails.cardType).toLowerCase();
				return cardType;
			};

			var retrieveCardNumber = function retrieveCardNumber() {
				var cardNumber = $scope.newPaymentInfo.tokenDetails.isSixPayment ? $scope.newPaymentInfo.tokenDetails.token_no.substr($scope.newPaymentInfo.tokenDetails.token_no.length - 4) : $scope.newPaymentInfo.cardDetails.cardNumber.slice(-4);

				return cardNumber;
			};

			var retrieveExpiryDate = function retrieveExpiryDate() {
				var expiryMonth = $scope.newPaymentInfo.tokenDetails.isSixPayment ? $scope.newPaymentInfo.tokenDetails.expiry.substring(2, 4) : $scope.newPaymentInfo.cardDetails.expiryMonth;
				var expiryYear = $scope.newPaymentInfo.tokenDetails.isSixPayment ? $scope.newPaymentInfo.tokenDetails.expiry.substring(0, 2) : $scope.newPaymentInfo.cardDetails.expiryYear;
				var expiryDate = expiryMonth + " / " + expiryYear;

				return expiryDate;
			};

			var retrieveName = function retrieveName() {
				var cardName = $scope.newPaymentInfo.tokenDetails.isSixPayment ? $scope.passData.details.firstName + " " + $scope.passData.details.lastName : $scope.newPaymentInfo.cardDetails.userName;

				return cardName;
			};

			$scope.feeData = {};
			var zeroAmount = parseFloat("0.00");

			// CICO-11591 : To show or hide fees calculation details.
			$scope.isShowFees = function () {
				var isShowFees = false;
				var feesData = $scope.feeData;

				if (typeof feesData === 'undefined' || typeof feesData.feesInfo === 'undefined' || feesData.feesInfo === null) {
					isShowFees = false;
				} else if (feesData.defaultAmount >= feesData.minFees && $scope.isStandAlone && feesData.feesInfo.amount) {
					isShowFees = true;
				}
				return isShowFees;
			};

			// CICO-6068 : To calculate fee
			$scope.calculateFee = function () {
				if ($scope.isStandAlone) {

					var feesInfo = $scope.feeData.feesInfo;
					var amountSymbol = "";
					var feePercent = zeroAmount;
					var minFees = zeroAmount;

					if (typeof feesInfo !== 'undefined' && feesInfo !== null) {
						amountSymbol = feesInfo.amount_symbol;
						feePercent = feesInfo.amount ? parseFloat(feesInfo.amount) : zeroAmount;
						minFees = feesInfo.minimum_amount_for_fees ? parseFloat(feesInfo.minimum_amount_for_fees) : zeroAmount;
					}

					var totalAmount = $scope.reservationData.depositAmount === "" ? zeroAmount : parseFloat($scope.reservationData.depositAmount);

					$scope.feeData.minFees = minFees;
					$scope.feeData.defaultAmount = totalAmount;

					if ($scope.isShowFees()) {

						if (amountSymbol === "percent") {
							var calculatedFee = parseFloat(totalAmount * (feePercent / 100));

							$scope.feeData.calculatedFee = parseFloat(calculatedFee).toFixed(2);
							$scope.feeData.totalOfValueAndFee = parseFloat(calculatedFee + totalAmount).toFixed(2);
						} else {
							$scope.feeData.calculatedFee = parseFloat(feePercent).toFixed(2);
							$scope.feeData.totalOfValueAndFee = parseFloat(totalAmount + feePercent).toFixed(2);
						}
					}
				}
			};

			// CICO-6068 : Data for fees details.
			$scope.setupFeeData = function () {

				var feesInfo = $scope.feeData.feesInfo ? $scope.feeData.feesInfo : {};
				var defaultAmount = $scope.reservationData ? parseFloat($scope.reservationData.depositAmount) : zeroAmount;

				var minFees = feesInfo.minimum_amount_for_fees ? parseFloat(feesInfo.minimum_amount_for_fees) : zeroAmount;

				$scope.feeData.minFees = minFees;
				$scope.feeData.defaultAmount = defaultAmount;

				if ($scope.isShowFees()) {

					if (typeof feesInfo.amount !== 'undefined' && feesInfo !== null) {

						var amountSymbol = feesInfo.amount_symbol;
						var feesAmount = feesInfo.amount ? parseFloat(feesInfo.amount) : zeroAmount;

						$scope.feeData.actualFees = feesAmount;

						if (amountSymbol === "percent") {
							$scope.calculateFee();
						} else {
							$scope.feeData.calculatedFee = parseFloat(feesAmount).toFixed(2);
							$scope.feeData.totalOfValueAndFee = parseFloat(feesAmount + defaultAmount).toFixed(2);
						}
					}
				}
			};

			// CICO-12413 : To calculate Total of fees and amount to pay.
			$scope.calculateTotalAmount = function (amount) {

				var feesAmount = typeof $scope.feeData.calculatedFee === 'undefined' || $scope.feeData.calculatedFee === '' || $scope.feeData.calculatedFee === '-' ? zeroAmount : parseFloat($scope.feeData.calculatedFee);
				var amountToPay = typeof amount === 'undefined' || amount === '' ? zeroAmount : parseFloat(amount);

				$scope.feeData.totalOfValueAndFee = parseFloat(amountToPay + feesAmount).toFixed(2);
			};

			if ($scope.isStandAlone) {
				$scope.feeData.feesInfo = $scope.passData.fees_information;
				$scope.setupFeeData();
			}

			/*
    * check if reference text is available for the selected card type
    *
    */
			$scope.isReservationDeposit = true;
			$scope.renderData = {};
			$scope.renderData.paymentTypes = $scope.passData.details.paymentTypes;

			$scope.checkReferencetextAvailable = function () {

				angular.forEach($scope.passData.details.paymentTypes, function (value, key) {
					if (value.name === $scope.depositData.paymentType) {
						if ($scope.depositData.paymentType !== "CC") {
							$scope.isDisplayReference = value.is_display_reference ? true : false;

							// To handle fees details on reservation deposits,
							// While we change payment methods
							// Handling Credit Cards seperately.
							if (value.name !== "CC") {
								$scope.feeData.feesInfo = value.charge_code.fees_information;
							}
							$scope.setupFeeData();
						} else {
							angular.forEach($scope.passData.details.creditCardTypes, function (value, key) {
								if ($scope.depositData.card_type.toUpperCase() === value.cardcode) {
									$scope.isDisplayReference = value.is_display_reference ? true : false;
								}
							});
						}
					}
				});
			};

			/*
    * set selected card if any card is attached to the reservation
    *
    */
			var setReservationCreditCard = function setReservationCreditCard(cardValue) {

				var attached_card = $scope.depositDetails.attached_card;

				$scope.depositData.selectedCard = attached_card.value;
				$scope.depositData.cardNumber = attached_card.ending_with;
				$scope.depositData.expiry_date = attached_card.expiry_date;
				$scope.depositData.card_type = attached_card.card_code.toLowerCase();
				$scope.cardSelected = true;
				$scope.depositData.paymentType = "CC";
			};

			if (typeof $scope.depositDetails.attached_card !== "undefined" && $scope.depositDetails.attached_card.value !== "" && $scope.depositDetails.attached_card.is_credit_card) {
				setReservationCreditCard($scope.depositDetails.attached_card.value);
			}

			var savePayment = function savePayment(attach_to_reservation) {

				var expiryMonth = $scope.newPaymentInfo.tokenDetails.isSixPayment ? $scope.newPaymentInfo.tokenDetails.expiry.substring(2, 4) : $scope.newPaymentInfo.cardDetails.expiryMonth;
				var expiryYear = $scope.newPaymentInfo.tokenDetails.isSixPayment ? $scope.newPaymentInfo.tokenDetails.expiry.substring(0, 2) : $scope.newPaymentInfo.cardDetails.expiryYear;
				var cardExpiry = expiryMonth && expiryYear ? "20" + expiryYear + "-" + expiryMonth + "-01" : "";
				var cardToken = !$scope.newPaymentInfo.tokenDetails.isSixPayment ? $scope.newPaymentInfo.tokenDetails.session : $scope.newPaymentInfo.tokenDetails.token_no;

				var onSaveSuccess = function onSaveSuccess(data) {
					$scope.$emit('hideLoader');
					// if the param passed attach_to_reservation is undefined, this will be used to 
					// render the card details ito the screen only
					if (typeof attach_to_reservation === "undefined") {
						$scope.depositData.selectedCard = data.id;
						$scope.depositData.cardNumber = retrieveCardNumber();
						$scope.depositData.expiry_date = retrieveExpiryDate();
						$scope.depositData.card_type = retrieveCardtype();
						$scope.swippedCard = false;
						$scope.showCCPage = false;
						$scope.cardSelected = true;

						if ($scope.isStandAlone) {
							$scope.feeData.feesInfo = data.fees_information;
							$scope.setupFeeData();
						}
					}
					$scope.newCardAdded = true;
					// if the param passed attach_to_reservation is defined, this will be used to 
					// update the payment in the staycard
					if (typeof attach_to_reservation !== "undefined") {
						// set data in the staycard
						$scope.$parent.reservationData.reservation_card.payment_method_used = 'CC';
						$scope.$parent.reservationData.reservation_card.payment_details.card_number = angular.copy($scope.depositData.cardNumber);
						$scope.$parent.reservationData.reservation_card.payment_details.card_expiry = angular.copy($scope.depositData.expiry_date);
						$scope.$parent.reservationData.reservation_card.payment_details.card_type_image = 'images/' + angular.copy($scope.depositData.card_type.toLowerCase()) + '.png';
					}
				};

				var paymentData = {
					add_to_guest_card: $scope.newPaymentInfo.cardDetails.addToGuestCard,
					name_on_card: retrieveName(),
					payment_type: "CC",
					token: cardToken
				};
				// if new card is added and payment is success, add the card to reservation

				if (typeof attach_to_reservation !== "undefined") {
					paymentData.reservation_id = $scope.passData.reservationId;
				}
				paymentData.card_code = $scope.newPaymentInfo.tokenDetails.isSixPayment ? getSixCreditCardType($scope.newPaymentInfo.tokenDetails.card_type).toLowerCase() : $scope.newPaymentInfo.cardDetails.cardType;

				if (!$scope.newPaymentInfo.tokenDetails.isSixPayment) {
					paymentData.card_expiry = cardExpiry;
				}

				if ($scope.depositData.isDisplayReference) {
					paymentData.referance_text = $scope.depositData.referanceText;
				}

				$scope.invokeApi(RVPaymentSrv.savePaymentDetails, paymentData, onSaveSuccess);
			};
			/*
    * fetch reservation's cards list
    *
    */

			var onFetchPaymentsSuccess = function onFetchPaymentsSuccess(data) {
				$scope.$emit('hideLoader');
				$scope.cardsList = _.where(data.existing_payments, {
					is_credit_card: true
				});
				$scope.cardsList.forEach(function (card) {
					card.mli_token = card.ending_with;
					delete card.ending_with;
					card.card_expiry = card.expiry_date;
					delete card.expiry_date;
				});
				if ($scope.cardsList.length > 0) {
					$scope.addmode = false;
					refreshCardsList();
				}
			};

			var reservationId = $stateParams.id;

			$scope.invokeApi(RVPaymentSrv.getPaymentList, reservationId, onFetchPaymentsSuccess);

			var successPayment = function successPayment(data, cardAddedBySixPaySWipe) {
				$scope.$emit('hideLoader');
				$scope.successMessage = "Deposit paid";
				$scope.authorizedCode = data.authorization_code;
				$scope.errorOccured = false;
				$scope.depositPaidSuccesFully = true;
				$scope.isLoading = false;
				$scope.$parent.reservationData.reservation_card.deposit_attributes.outstanding_stay_total = parseInt($scope.$parent.reservationData.reservation_card.deposit_attributes.outstanding_stay_total) - parseInt($scope.$parent.depositDetails.deposit_amount);
				runDigestCycle();
				var cardName = "";

				if ($scope.depositData.addToGuestCard && $scope.newCardAdded) {

					if ($scope.isSwipedCardSave) {
						cardName = $scope.swipedCardHolderName;
					} else {
						cardName = $scope.newPaymentInfo.tokenDetails.isSixPayment ? $scope.passData.details.firstName + " " + $scope.passData.details.lastName : $scope.newPaymentInfo.cardDetails.userName;
					}

					var cardCode = $scope.depositData.card_type;
					var cardNumber = $scope.depositData.cardNumber;
					var dataToGuestList = {
						"card_code": cardCode,
						"mli_token": cardNumber,
						"card_expiry": $scope.depositData.expiry_date,
						"card_name": cardName,
						"id": $scope.depositData.selectedCard,
						"isSelected": true,
						"is_primary": false,
						"payment_type": "CC",
						"payment_type_id": 1,
						"is_credit_card": true
					};

					$scope.cardsList.push(dataToGuestList);
					$rootScope.$broadcast('ADDEDNEWPAYMENTTOGUEST', dataToGuestList);
				}

				if (typeof cardAddedBySixPaySWipe !== "undefined") {
					var paymentDetails = data.payment_method;

					$scope.newPaymentInfo = {
						"tokenDetails": {
							"isSixPayment": true
						}
					};
					$scope.depositData.cardNumber = paymentDetails.ending_with;
					$scope.depositData.expiry_date = paymentDetails.expiry_date;
					$scope.newPaymentInfo.tokenDetails.session = paymentDetails.session;
					$scope.depositData.selectedCard = paymentDetails.id;
					$scope.depositData.card_type = paymentDetails.card_type;
				}

				// the below code is commented as the payment linkage is now done i backend

				// if the rservation payment methode is Cash and deposit is 
				// paid by CC, add that CC as payment method to the reservation
				// if($scope.$parent.reservationData.reservation_card.payment_method_used === 'CA' &&
				//    $scope.depositData.paymentType === 'CC'){
				// 	if($scope.newCardAdded && typeof cardAddedBySixPaySWipe === "undefined")
				// 	{
				// 		//if new card is added and payment is success, add the card to reservation
				// 		var addPaymentTypeToReservation = true;
				// 		savePayment(addPaymentTypeToReservation);
				// 	}
				// 	//if old card is used for payment
				// 	else {
				// 		var onLinkPaymentSuccess = function(data) {
				// 			$scope.$emit('hideLoader');
				// 			//set data in the staycard
				// 			$scope.$parent.reservationData.reservation_card.payment_method_used = 'CC';
				// 			$scope.$parent.reservationData.reservation_card.payment_details.card_number = angular.copy($scope.depositData.cardNumber);
				// 			$scope.$parent.reservationData.reservation_card.payment_details.card_expiry = angular.copy($scope.depositData.expiry_date);
				// 			$scope.$parent.reservationData.reservation_card.payment_details.card_type_image = 'images/'+angular.copy($scope.depositData.card_type.toLowerCase())+'.png';
				// 		};
				// 		var linkPaymentData = {};
				// 		linkPaymentData.payment_type = "CC";
				// 		linkPaymentData.user_payment_type_id = ($scope.depositData.paymentType === 'CC' && $scope.depositData.selectedCard !== -1) ? $scope.depositData.selectedCard :null;
				// 		linkPaymentData.reservation_id = parseInt($stateParams.id);
				// 		$scope.invokeApi(RVPaymentSrv.mapPaymentToReservation, linkPaymentData, onLinkPaymentSuccess);
				// 	}
				// }

				// if the existing payment method is not CC or Direct BIll and the selected payment method is CC
				// The submit payment will update the payment type for the bill
				if ($scope.$parent.reservationData.reservation_card.payment_method_used !== 'CC' && $scope.$parent.reservationData.reservation_card.payment_method_used !== 'DB' && $scope.depositData.paymentType === 'CC') {
					$scope.$parent.reservationData.reservation_card.payment_method_used = 'CC';
					$scope.$parent.reservationData.reservation_card.payment_details.card_number = angular.copy($scope.depositData.cardNumber);
					$scope.$parent.reservationData.reservation_card.payment_details.card_expiry = angular.copy($scope.depositData.expiry_date);
					$scope.$parent.reservationData.reservation_card.payment_details.card_type_image = 'images/' + angular.copy($scope.depositData.card_type.toLowerCase()) + '.png';
				}

				$rootScope.$broadcast("UPDATE_DEPOSIT_BALANCE", data);
				// Update reservation type
				$rootScope.$broadcast('UPDATERESERVATIONTYPE', data.reservation_type_id);
			};

			var paymentFailed = function paymentFailed(data) {
				$scope.$emit('hideLoader');
				$scope.paymentErrorMessage = data[0];
				$scope.errorOccured = true;
				$scope.depositPaidSuccesFully = false;
				$scope.isLoading = false;
			};

			$scope.$on("AUTO_TRIGGER_EMAIL_AFTER_PAYMENT", function (e, data) {
				$scope.guestCardData.contactInfo.email = data;
				$scope.sendAutomaticEmails(data);
			});

			/*
   * Action - On click submit payment button
   */
			$rootScope.$on('GIFTCARD_DETAILS', function (e, n) {
				$scope.cardData.cardNumber = n;
			});
			$scope.submitPayment = function () {

				if ($scope.reservationData.depositAmount === '' || $scope.reservationData.depositAmount === null) {
					$scope.errorMessage = ["Please enter amount"];
				} else {
					$scope.errorMessage = "";
					$scope.depositInProcess = true;
					var dataToSrv = {
						"postData": {
							"bill_number": 1,
							"payment_type": $scope.depositData.paymentType,
							"amount": $scope.reservationData.depositAmount,
							"payment_type_id": $scope.depositData.paymentType === 'CC' && $scope.depositData.selectedCard !== -1 ? $scope.depositData.selectedCard : null
						},
						"reservation_id": $stateParams.id
					};
					// add to guest card only if new card is added and checkbox is selected

					if ($scope.newCardAdded) {
						dataToSrv.postData.add_to_guest_card = $scope.depositData.addToGuestCard;
					} else {
						dataToSrv.postData.add_to_guest_card = false;
					}
					if ($scope.depositData.paymentType === 'GIFT_CARD') {
						delete dataToSrv.postData.payment_type_id;
						dataToSrv.postData.card_number = $scope.cardData.cardNumber;
					}

					if ($scope.isShowFees()) {
						if ($scope.feeData.calculatedFee) {
							dataToSrv.postData.fees_amount = $scope.feeData.calculatedFee;
						}
						if ($scope.feeData.feesInfo) {
							dataToSrv.postData.fees_charge_code_id = $scope.feeData.feesInfo.charge_code_id;
						}
					}
					if ($scope.isDisplayReference) {
						dataToSrv.postData.reference_text = $scope.reservationData.referanceText;
					}
					$scope.isLoading = true;
					if ($rootScope.paymentGateway === "sixpayments" && !$scope.isManual && $scope.depositData.paymentType === 'CC') {
						dataToSrv.postData.is_emv_request = true;
						$scope.shouldShowWaiting = true;
						// the card will be added to reservation if existing payment methid is cash
						// and six pay is succes by passing reservation_id
						// if($scope.$parent.reservationData.reservation_card.payment_method_used !== 'CC' &&
						//    $scope.$parent.reservationData.reservation_card.payment_method_used !== 'DB'){
						dataToSrv.postData.reservation_id = $stateParams.id;
						// }
						RVPaymentSrv.submitPaymentOnBill(dataToSrv).then(function (response) {
							$scope.shouldShowWaiting = false;
							var cardAddedBySixPaySWipe = true;
							// the card will be added to reservation if existing payment methid is cash
							// and six pay is succes by passing reservation_id

							$scope.newCardAdded = true;
							successPayment(response, cardAddedBySixPaySWipe);
						}, function (error) {

							$scope.shouldShowWaiting = false;
							paymentFailed(error);
						});
					} else {
						$scope.invokeApi(RVPaymentSrv.submitPaymentOnBill, dataToSrv, successPayment, paymentFailed);
					}
				}
			};

			$scope.payDeposit = function () {
				$scope.submitPayment();
			};

			$scope.onCardClick = function () {
				$scope.showAddtoGuestCard = false;
				$scope.showCCPage = true;
				$scope.swippedCard = true;
				$scope.addmode = $scope.cardsList.length > 0 ? false : true;
				refreshCardsList();
			};

			$scope.showAddtoGuestCardBox = function () {
				if ($scope.cardSelected && !$scope.showCCPage && $scope.depositData.paymentType === 'CC' && ($scope.paymentGateway !== 'sixpayments' || $scope.isManual) && !$scope.depositPaidSuccesFully && !$scope.errorOccured && $scope.newCardAdded) {
					return true;
				} else return false;
			};

			$scope.isNewCard = function () {
				var newCard = true;

				for (var i in $scope.cardsList) {
					if ($scope.depositData.cardNumber === $scope.cardsList[i].mli_token) {
						newCard = false;
					}
				}
				return newCard;
			};

			$scope.showSelectedCard = function () {
				var showingSelectedCardScreen = false;

				if ($scope.cardSelected && !$scope.showCCPage && $scope.depositData.paymentType === 'CC' && ($scope.paymentGateway !== 'sixpayments' || $scope.isManual)) {
					showingSelectedCardScreen = true;
				} else {
					showingSelectedCardScreen = false;
				}

				if (showingSelectedCardScreen) {
					if ($scope.showCCPage || $scope.depositData.paymentType !== 'CC' || !$scope.newCardAdded) {
						$scope.showAddtoGuestCard = false;
					}

					if ($scope.depositData.paymentType === 'CC' && $scope.isNewCard()) {
						// check if the card added is new
						$scope.showAddtoGuestCard = true;
					} else {
						$scope.showAddtoGuestCard = false;
					}
				}
				return showingSelectedCardScreen;
			};

			var setCreditCardFromList = function setCreditCardFromList(index) {
				$scope.depositData.selectedCard = $scope.cardsList[index].value;
				$scope.depositData.cardNumber = $scope.cardsList[index].mli_token;
				$scope.depositData.expiry_date = $scope.cardsList[index].card_expiry;
				$scope.depositData.card_type = $scope.cardsList[index].card_code;
				$scope.swippedCard = false;
				$scope.showCCPage = false;
				$scope.cardSelected = true;

				if ($scope.isStandAlone) {
					$scope.feeData.feesInfo = $scope.cardsList[index].fees_information;
					$scope.setupFeeData();
				}

				$scope.newCardAdded = false;
			};

			$scope.$on("TOKEN_CREATED", function (e, data) {
				$scope.newPaymentInfo = data;
				$scope.showCCPage = false;
				$scope.swippedCard = false;
				$scope.cardSelected = false;
				savePayment();
			});

			$scope.$on("MLI_ERROR", function (e, data) {
				$scope.errorMessage = data;
				setTimeout(function () {
					$scope.errorMessage = "";
					$scope.$digest();
				}, 4000);
			});

			$scope.$on('cancelCardSelection', function (e, data) {
				$scope.swippedCard = false;
				$scope.showCCPage = false;
				$scope.depositData.paymentType = "";
				$scope.isManual = false;
			});
			$scope.$on('cardSelected', function (e, data) {
				setCreditCardFromList(data.index);
			});

			$scope.$on("SHOW_SWIPED_DATA_ON_STAY_CARD_DEPOSIT_SCREEN", function (e, swipedCardDataToRender) {
				$scope.swippedCard = true;
				$scope.showCCPage = true;
				$scope.addmode = true;
				$scope.depositData.paymentType = "CC";
				$scope.swipedCardHolderName = swipedCardDataToRender.nameOnCard;
				runDigestCycle();
				$scope.$broadcast("RENDER_SWIPED_DATA", swipedCardDataToRender);
			});
			$scope.$on("SWIPED_DATA_TO_SAVE", function (e, swipedCardDataToSave) {
				var data = swipedCardDataToSave;

				data.payment_credit_type = swipedCardDataToSave.cardType;
				data.credit_card = swipedCardDataToSave.cardType;
				data.card_expiry = "20" + swipedCardDataToSave.cardExpiryYear + "-" + swipedCardDataToSave.cardExpiryMonth + "-01";
				data.add_to_guest_card = swipedCardDataToSave.addToGuestCard;
				$scope.isSwipedCardSave = true;

				var options = {
					params: data,
					successCallBack: successSwipePayment,
					successCallBackParameters: swipedCardDataToSave
				};

				$scope.callAPI(RVPaymentSrv.savePaymentDetails, options);
			});
			var successSwipePayment = function successSwipePayment(data, successParams) {
				$scope.$emit('hideLoader');
				$scope.depositData.selectedCard = data.id;
				$scope.depositData.cardNumber = successParams.cardNumber.slice(-4);
				$scope.depositData.expiry_date = successParams.cardExpiryMonth + "/" + successParams.cardExpiryYear;
				$scope.depositData.card_type = successParams.cardType.toLowerCase();
				$scope.showCCPage = false;
				$scope.swippedCard = false;
				$scope.cardSelected = true;
			};

			// CICO-12488 : Handle initial case of change Payment type.
			$scope.checkReferencetextAvailable();

			$scope.showDepositNotice = function () {
				if ($scope.showCCPage || $scope.depositInProcess || $scope.depositPaidSuccesFully) {
					if ($scope.isStandAlone) {
						if ($scope.cardsList.length === 0) {
							$scope.$broadcast('CLICK_ADD_NEW_CARD');
						}
					}
					return true;
				} else return false;
			};
		}]);
	}, {}] }, {}, [1]);