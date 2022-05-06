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
		sntRover.controller('RVCancelReservation', ['$rootScope', '$scope', '$stateParams', 'RVPaymentSrv', '$timeout', 'RVReservationCardSrv', '$state', '$filter', '$q', 'RVReservationSummarySrv', '$window', 'RVNightlyDiarySrv', function ($rootScope, $scope, $stateParams, RVPaymentSrv, $timeout, RVReservationCardSrv, $state, $filter, $q, RVReservationSummarySrv, $window, RVNightlyDiarySrv) {

			BaseCtrl.call(this, $scope);
			$scope.errorMessage = '';
			$scope.showCancelCardSelection = true;
			$scope.showAddtoGuestCard = true;
			$scope.addmode = false;
			$scope.showCCPage = false;
			$scope.referanceText = "";
			$scope.isDisplayReference = false;
			$scope.newCardAdded = false;

			$scope.cancellationData = {
				selectedCard: -1,
				reason: "",
				viewCardsList: false,
				existingCard: false,
				cardId: "",
				cardNumber: "",
				expiry_date: "",
				card_type: "",
				addToGuestCard: false,
				locale: $scope.languageData.selected_language_code
			};
			$scope.cancellationData.paymentType = "";
			$scope.DailogeState = typeof $scope.$parent.DailogeState !== 'undefined' ? $scope.$parent.DailogeState : {};
			$scope.DailogeState.sendConfirmatonMailTo = typeof $scope.$parent.DailogeState !== 'undefined' ? $scope.$parent.DailogeState.sendConfirmatonMailTo : "";
			$scope.DailogeState.isCancelled = false;

			if ($scope.ngDialogData.penalty > 0) {
				$scope.$emit("UPDATE_CANCEL_RESERVATION_PENALTY_FLAG", true);
				$scope.ngDialogData.penalty = parseFloat($scope.ngDialogData.penalty).toFixed(2);
			}

			$scope.setScroller('cardsList', {
				'click': true,
				'tap': true
			});

			var checkReferencetextAvailableForCC = function checkReferencetextAvailableForCC() {
				if ($scope.cancellationData.paymentType !== "CC") {

					angular.forEach($scope.passData.details.paymentTypes, function (value, key) {

						if (value.name === $scope.cancellationData.paymentType) {
							$scope.isDisplayReference = value.is_display_reference ? true : false;

							// To handle fees details on reservation cancel,
							// While we change payment methods
							// Handling Credit Cards seperately.
							if (value.name !== "CC") {
								$scope.feeData.feesInfo = value.charge_code.fees_information;
							}
							$scope.setupFeeData();
						}
					});
				} else {
					angular.forEach($scope.passData.details.creditCardTypes, function (value, key) {
						if ($scope.cancellationData.card_type.toUpperCase() === value.cardcode) {
							$scope.isDisplayReference = value.is_display_reference ? true : false;
						}
					});
				}
			};

			$scope.changeOnsiteCallIn = function () {
				$scope.isManual ? $scope.showCCPage = true : "";
			};
			// to trigger from sixpayment partial
			$scope.$on('changeOnsiteCallIn', function (event) {
				$scope.isManual = !$scope.isManual;
				$scope.changeOnsiteCallIn();
			});

			$scope.changePaymentType = function () {

				if ($scope.cancellationData.paymentType === "CC") {
					$rootScope.paymentGateway === 'sixpayments' ? "" : $scope.showCCPage = true;
				} else {
					checkReferencetextAvailableForCC();
				}
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

			// CICO-9457 : To calculate fee - for standalone only
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
					var totalAmount = $scope.ngDialogData.penalty === "" ? zeroAmount : parseFloat($scope.ngDialogData.penalty);

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

			// CICO-9457 : Data for fees details.
			$scope.setupFeeData = function () {

				var feesInfo = $scope.feeData.feesInfo ? $scope.feeData.feesInfo : {};
				var defaultAmount = $scope.ngDialogData ? parseFloat($scope.ngDialogData.penalty) : zeroAmount;

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

			// CICO-12408 : To calculate Total of fees and amount to pay.
			$scope.calculateTotalAmount = function (amount) {

				var feesAmount = typeof $scope.feeData.calculatedFee === 'undefined' || $scope.feeData.calculatedFee === '' || $scope.feeData.calculatedFee === '-' ? zeroAmount : parseFloat($scope.feeData.calculatedFee);
				var amountToPay = typeof amount === 'undefined' || amount === '' ? zeroAmount : parseFloat(amount);

				$scope.feeData.totalOfValueAndFee = parseFloat(amountToPay + feesAmount).toFixed(2);
			};

			var refreshCardsList = function refreshCardsList() {
				$timeout(function () {
					$scope.refreshScroller('cardsList');
				}, 2000);
			};

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
				var cardName = $scope.newPaymentInfo.tokenDetails.isSixPayment ? '' : $scope.newPaymentInfo.cardDetails.userName;

				return cardName;
			};

			var savePayment = function savePayment() {

				var expiryMonth = $scope.newPaymentInfo.tokenDetails.isSixPayment ? $scope.newPaymentInfo.tokenDetails.expiry.substring(2, 4) : $scope.newPaymentInfo.cardDetails.expiryMonth;
				var expiryYear = $scope.newPaymentInfo.tokenDetails.isSixPayment ? $scope.newPaymentInfo.tokenDetails.expiry.substring(0, 2) : $scope.newPaymentInfo.cardDetails.expiryYear;
				var cardExpiry = expiryMonth && expiryYear ? "20" + expiryYear + "-" + expiryMonth + "-01" : "";

				var cardToken = !$scope.newPaymentInfo.tokenDetails.isSixPayment ? $scope.newPaymentInfo.tokenDetails.session : $scope.newPaymentInfo.tokenDetails.token_no;
				var onSaveSuccess = function onSaveSuccess(data) {
					$scope.$emit('hideLoader');
					$scope.cancellationData.selectedCard = data.id;
					$scope.cancellationData.cardNumber = retrieveCardNumber();
					$scope.cancellationData.expiry_date = retrieveExpiryDate();
					$scope.cancellationData.card_type = retrieveCardtype();
					checkReferencetextAvailableForCC();
					$scope.showCCPage = false;
					$scope.newCardAdded = true;
				};
				var paymentData = {
					add_to_guest_card: $scope.newPaymentInfo.cardDetails.addToGuestCard,
					name_on_card: retrieveName(),
					payment_type: "CC",
					reservation_id: $scope.passData.reservationId,
					token: cardToken
				};

				paymentData.card_code = $scope.newPaymentInfo.tokenDetails.isSixPayment ? getSixCreditCardType($scope.newPaymentInfo.tokenDetails.card_type).toLowerCase() : $scope.newPaymentInfo.cardDetails.cardType;
				if (!$scope.newPaymentInfo.tokenDetails.isSixPayment) {
					paymentData.card_expiry = cardExpiry;
				}

				$scope.invokeApi(RVPaymentSrv.savePaymentDetails, paymentData, onSaveSuccess);
			};

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
				$scope.addmode = $scope.cardsList.length > 0 ? false : true;
				refreshCardsList();
				$scope.ngDialogData.state = 'PENALTY';
			};

			$scope.completeCancellationProcess = function () {
				if ($scope.DailogeState.isCancelled) {
					if ($state.current.name === 'rover.reservation.staycard.reservationcard.reservationdetails') {
						$stateParams.isrefresh = true;
						$state.reload($state.current.name);
					} else {
						// CICO-58191
						$state.go('rover.reservation.staycard.reservationcard.reservationdetails', {
							id: $scope.reservationData.reservationId || $scope.reservationData.reservation_card.reservation_id,
							confirmationId: $scope.reservationData.confirmNum || $scope.reservationData.reservation_card.confirmation_num,
							isrefresh: true
						});
					}
				}

				$scope.closeReservationCancelModal();
			};

			var cancelReservation = function cancelReservation(isWithoutPenalty) {
				var onEachCancelSuccess = function onEachCancelSuccess(data) {
					// Handle individual cancellations here if reqd.
				},
				    onCancelSuccess = function onCancelSuccess(data) {
					// OnCancelsuccess NgDialog shows sendcancelation as well as printcancelation pop up
					// Since RVCancelReservation and RVCancelReservationDepositController do the same above,
					// its functions are written in parent controller.Ie reservationActionsController
					$scope.$emit('hideLoader');
					$scope.DailogeState.isCancelled = true;
					var params = RVNightlyDiarySrv.getCache();

					if (typeof params !== 'undefined') {
						params.currentSelectedReservationId = "";
						params.currentSelectedRoomId = "";
						params.currentSelectedReservation = "";
					}

					RVNightlyDiarySrv.updateCache(params);
				},
				    onCancelFailure = function onCancelFailure(data) {
					$scope.$emit('hideLoader');
					$scope.errorMessage = data;
				};
				// CICO-15808
				// In case of multiple reservations - all reservations need to be cancelled

				if ($scope.reservationData && $scope.reservationData.reservationIds && $scope.reservationData.reservationIds.length > 1) {
					var promises = []; // Use this array to push the promises returned for every call

					$scope.$emit('showLoader');
					// Loop through the reservation ids and call the cancel API for each of them
					_.each($scope.reservationData.reservationIds, function (reservationId) {
						var cancellationParameters = {
							reason: $scope.cancellationData.reason,
							payment_method_id: parseInt($scope.cancellationData.selectedCard) === -1 ? null : parseInt($scope.cancellationData.selectedCard),
							id: reservationId,
							application: "ROVER",
							is_with_penalty: isWithoutPenalty
						};

						if ($scope.ngDialogData.isDisplayReference) {
							cancellationParameters.reference_text = $scope.referanceText;
						}
						promises.push(RVReservationCardSrv.cancelReservation(cancellationParameters).then(onEachCancelSuccess));
					});
					$q.all(promises).then(onCancelSuccess, onCancelFailure);
				} else {
					var cancellationParameters = {
						reason: $scope.cancellationData.reason,
						payment_method_id: parseInt($scope.cancellationData.selectedCard) === -1 ? null : parseInt($scope.cancellationData.selectedCard),
						id: $scope.reservationData.reservationId || $scope.reservationParentData.reservationId || $scope.passData.reservationId,
						application: "ROVER",
						is_with_penalty: isWithoutPenalty
					};

					if ($scope.ngDialogData.isDisplayReference) {
						cancellationParameters.reference_text = $scope.referanceText;
					}
					$scope.invokeApi(RVReservationCardSrv.cancelReservation, cancellationParameters, onCancelSuccess, onCancelFailure);
				}
			};

			var successPayment = function successPayment(data) {
				$scope.$emit('hideLoader');
				if ($scope.cancellationData.addToGuestCard) {
					var cardCode = $scope.cancellationData.card_type;
					var cardNumber = $scope.cancellationData.cardNumber;
					var dataToGuestList = {
						"card_code": cardCode,
						"mli_token": cardNumber,
						"card_expiry": $scope.cancellationData.expiry_date,
						"card_name": $scope.newPaymentInfo.cardDetails.userName,
						"id": data.id,
						"isSelected": true,
						"is_primary": false,
						"payment_type": "CC",
						"payment_type_id": 1
					};

					$scope.cardsList.push(dataToGuestList);
					$rootScope.$broadcast('ADDEDNEWPAYMENTTOGUEST', dataToGuestList);
				}
				$scope.depositPaidSuccesFully = true;
				$scope.authorizedCode = data.authorization_code;
			};

			$scope.cancelReservation = function (isWithoutPenalty) {
				cancelReservation(isWithoutPenalty);
			};
			/*
    * Action - On click submit payment button
    */
			$scope.submitPayment = function () {
				$scope.errorMessage = "";
				$scope.depositInProcess = true;
				var dataToSrv = {
					"postData": {
						"bill_number": 1,
						"payment_type": $scope.cancellationData.paymentType,
						"amount": $scope.ngDialogData.penalty,
						"payment_type_id": $scope.cancellationData.paymentType === 'CC' && $scope.cancellationData.selectedCard !== -1 ? $scope.cancellationData.selectedCard : null
					},
					"reservation_id": $scope.passData.reservationId
				};

				if ($scope.isShowFees()) {
					if ($scope.feeData.calculatedFee) {
						dataToSrv.postData.fees_amount = $scope.feeData.calculatedFee;
					}
					if ($scope.feeData.feesInfo) {
						dataToSrv.postData.fees_charge_code_id = $scope.feeData.feesInfo.charge_code_id;
					}
				}
				// add to guest card only if new card is added and checkbox is selected
				if ($scope.newCardAdded) {
					dataToSrv.postData.add_to_guest_card = $scope.cancellationData.addToGuestCard;
				} else {
					dataToSrv.postData.add_to_guest_card = false;
				}
				if ($scope.isDisplayReference) {
					dataToSrv.postData.reference_text = $scope.referanceText;
				}
				if ($rootScope.paymentGateway === "sixpayments" && !$scope.isManual && $scope.cancellationData.paymentType === 'CC') {
					dataToSrv.postData.is_emv_request = true;
					$scope.shouldShowWaiting = true;
					RVPaymentSrv.submitPaymentOnBill(dataToSrv).then(function (response) {
						$scope.shouldShowWaiting = false;
						successPayment(response);
					}, function (error) {
						$scope.errorMessage = error;
						$scope.shouldShowWaiting = false;
					});
				} else {
					$scope.invokeApi(RVPaymentSrv.submitPaymentOnBill, dataToSrv, successPayment);
				}
			};

			$scope.applyPenalty = function () {
				var reservationId = $scope.passData.reservationId;

				$scope.ngDialogData.applyPenalty = true;
				$scope.invokeApi(RVPaymentSrv.getPaymentList, reservationId, onFetchPaymentsSuccess);
			};

			$scope.onCardClick = function () {
				$scope.showCCPage = true;
				$scope.addmode = $scope.cardsList.length > 0 ? false : true;
			};
			var setCreditCardFromList = function setCreditCardFromList(index) {
				$scope.cancellationData.selectedCard = $scope.cardsList[index].value;
				$scope.cancellationData.cardNumber = $scope.cardsList[index].mli_token;
				$scope.cancellationData.expiry_date = $scope.cardsList[index].card_expiry;
				$scope.cancellationData.card_type = $scope.cardsList[index].card_code;
				checkReferencetextAvailableForCC();
				$scope.showCCPage = false;
				// CICO-9457 : Data for fees details - standalone only.
				if ($scope.isStandAlone) {
					$scope.feeData.feesInfo = $scope.cardsList[index].fees_information;
					$scope.setupFeeData();
				}
				$scope.newCardAdded = false;
			};

			$scope.$on("TOKEN_CREATED", function (e, data) {
				$scope.newPaymentInfo = data;
				$scope.showCCPage = false;
				savePayment();
			});

			$scope.$on("MLI_ERROR", function (e, data) {
				$scope.errorMessage = data;
			});

			$scope.$on('cancelCardSelection', function (e, data) {
				$scope.showCCPage = false;
				$scope.cancellationData.paymentType = "";
				$scope.isManual = false;
			});

			$scope.$on('cardSelected', function (e, data) {
				setCreditCardFromList(data.index);
			});

			$scope.$on("SHOW_SWIPED_DATA_ON_CANCEL_RESERVATION_PENALTY_SCREEN", function (e, swipedCardDataToRender) {

				$scope.$broadcast("RENDER_SWIPED_DATA", swipedCardDataToRender);
				$scope.ngDialogData.state = 'PENALTY';
				$scope.showCCPage = true;
				$scope.addmode = true;
			});

			var successSwipePayment = function successSwipePayment(data, successParams) {
				$scope.$emit('hideLoader');
				$scope.cancellationData.selectedCard = data.id;
				$scope.cancellationData.cardNumber = successParams.cardNumber.slice(-4);
				$scope.cancellationData.expiry_date = successParams.cardExpiryMonth + "/" + successParams.cardExpiryYear;
				$scope.cancellationData.card_type = successParams.cardType.toLowerCase();
				$scope.showCCPage = false;
			};

			$scope.$on("SWIPED_DATA_TO_SAVE", function (e, swipedCardDataToSave) {
				var data = swipedCardDataToSave;

				data.reservation_id = $scope.reservationData.reservation_card.reservation_id;
				data.payment_credit_type = swipedCardDataToSave.cardType;
				data.credit_card = swipedCardDataToSave.cardType;
				data.card_expiry = "20" + swipedCardDataToSave.cardExpiryYear + "-" + swipedCardDataToSave.cardExpiryMonth + "-01";
				data.add_to_guest_card = swipedCardDataToSave.addToGuestCard;

				var options = {
					params: data,
					successCallBack: successSwipePayment,
					successCallBackParameters: swipedCardDataToSave
				};

				$scope.callAPI(RVPaymentSrv.savePaymentDetails, options);
			});
			$scope.closeReservationCancelModal = function () {
				$scope.$emit("UPDATE_CANCEL_RESERVATION_PENALTY_FLAG", false);
				$scope.closeDialog();
			};

			// CICO-66822
			var cancelOriginalData = dclone($scope.DailogeState);

			// -- CICO-17706 --//
			$scope.DailogeState = {};
			$scope.DailogeState.successMessage = '';
			$scope.DailogeState.failureMessage = '';
			$scope.DailogeState.isCancelled = $scope.passData.isCancelled || false;

			// CICO-66822
			$scope.DailogeState.bookerEmail = cancelOriginalData.bookerEmail;
			$scope.DailogeState.isGuestEmailSelected = cancelOriginalData.isGuestEmailSelected;
			$scope.DailogeState.isBookerEmailSelected = cancelOriginalData.isBookerEmailSelected;
			$scope.DailogeState.guestEmail = cancelOriginalData.guestEmail;

			// Checking whether email is attached with guest card or not
			$scope.isEmailAttached = function () {
				var isEmailAttachedFlag = false;

				if ($scope.guestCardData.contactInfo.email !== null && $scope.guestCardData.contactInfo.email !== "") {
					isEmailAttachedFlag = true;
				}
				return isEmailAttachedFlag;
			};
			var succesfullCallbackForEmailCancellation = function succesfullCallbackForEmailCancellation(data) {
				$scope.$emit('hideLoader');
				$scope.DailogeState.successMessage = data.message;
				$scope.DailogeState.failureMessage = '';
			};
			var failureCallbackForEmailCancellation = function failureCallbackForEmailCancellation(error) {
				$scope.$emit('hideLoader');
				$scope.DailogeState.failureMessage = error[0];
				$scope.DailogeState.successMessage = '';
			};

			// Action against email button in staycard.
			$scope.sendReservationCancellation = function (locale) {
				var postData = {
					"type": "cancellation",
					"locale": locale
				};

				if ($scope.DailogeState.isGuestEmailSelected) {
					postData.primary_email = $scope.DailogeState.guestEmail;
				}

				if ($scope.DailogeState.isBookerEmailSelected) {
					postData.booker_email = $scope.DailogeState.bookerEmail;
				}

				if (!$scope.hasEmails() && $scope.DailogeState.sendConfirmatonMailTo) {
					postData.primary_email = $scope.DailogeState.sendConfirmatonMailTo;
				}

				var data = {
					"postData": postData,
					"reservationId": $scope.passData.reservationId
				};

				$scope.invokeApi(RVReservationCardSrv.sendConfirmationEmail, data, succesfullCallbackForEmailCancellation, failureCallbackForEmailCancellation);
			};

			// add the print orientation after printing
			var addPrintOrientation = function addPrintOrientation() {
				var orientation = 'portrait';

				$('head').append("<style id='print-orientation'>@page { size: " + orientation + "; }</style>");
			};
			// remove the print orientation after printing
			var removePrintOrientation = function removePrintOrientation() {
				$('#print-orientation').remove();
			};

			var printPage = function printPage() {
				// add the orientation
				addPrintOrientation();

				// CICO-35320: header logo needs to be hidden.
				$("header .logo").hide();
				$("header .h2").hide();

				var onPrintCompletion = function onPrintCompletion() {
					$timeout(function () {
						$("header .logo").show();
						$("header .h2").show();
						removePrintOrientation();
					}, 100);
				};

				$timeout(function () {
					if (sntapp.cordovaLoaded) {
						cordova.exec(onPrintCompletion, function () {
							onPrintCompletion();
						}, 'RVCardPlugin', 'printWebView', []);
					} else {
						$window.print();
						onPrintCompletion();
					}
				}, 400);
				// remove the orientation after similar delay
				$timeout(removePrintOrientation, 100);
			};

			// Action against print button in staycard.
			$scope.printReservationCancellation = function (locale) {
				var succesfullCallback = function succesfullCallback(data) {
					$scope.printData = data.data;
					printPage();
				};
				var failureCallbackPrint = function failureCallbackPrint(error) {
					$scope.DailogeState.failureMessage = error[0];
				};

				$scope.callAPI(RVReservationSummarySrv.fetchResservationCancellationPrintData, {
					successCallBack: succesfullCallback,
					failureCallBack: failureCallbackPrint,
					params: {
						'reservation_id': $scope.passData.reservationId,
						'locale': locale
					}
				});
			};

			// -- CICO-17706 --//

			$scope.$on('PAYMENT_FAILED', function (e, errorMessage) {
				$scope.errorMessage = errorMessage;
			});

			$scope.$on("CLOSE_DIALOG", $scope.closeReservationCancelModal);

			$scope.$on("PAYMENT_ACTION_CONTINUE", function (e, data) {
				$scope.cancelReservation(data);
			});

			/**
    * Should disable the send email btn in the cancellation popup
    * @param {String} locale - locale chosen from the popup
    */
			$scope.shouldDisableSendCancellationEmailBtn = function () {
				return !$scope.DailogeState.isGuestEmailSelected && !$scope.DailogeState.isBookerEmailSelected && !$scope.DailogeState.sendConfirmatonMailTo;
			};

			/**
    * Checks whether there are any emails configured
    */
			$scope.hasEmails = function () {
				return !!$scope.guestCardData.contactInfo.email || !!$scope.reservationData.reservation_card.booker_email;
			};
		}]);
	}, {}] }, {}, [1]);