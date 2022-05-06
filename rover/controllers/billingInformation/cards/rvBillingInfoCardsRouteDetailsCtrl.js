sntRover.controller('rvBillingInfoCardsRouteDetailsCtrl', ['$scope', '$rootScope', '$filter', 'RVBillinginfoSrv', 'RVGuestCardSrv', 'ngDialog', 'RVBillCardSrv', 'RVPaymentSrv', 'rvPermissionSrv', function($scope, $rootScope, $filter, RVBillinginfoSrv, RVGuestCardSrv, ngDialog, RVBillCardSrv, RVPaymentSrv, rvPermissionSrv) {

    BaseCtrl.call(this, $scope);

    /**
     * Function to initialize the controller
     * @return {undefined}
     */
    var init = function() {
        $scope.chargeCodeToAdd      = "";
        $scope.swipedCardDataToSave = {};

        $scope.paymentFlags         = {
            isAddPayment: false,
            showPaymentDropDown: false,
            isShownExistingCCPayment: false,
            sixIsManual: false
        };

        setCreditCardDetails();
        setCommonPaymentModelItems();
        fetchInitialData();

        initializeScrollers();
        refreshScrollers();     
    };

    /**
     * Call all api to fetch initial data here.
     * @return {Undefined}
     */
    var fetchInitialData = function() {
        $scope.fetchAllChargeCodes();
        $scope.fetchDefaultAccountRouting();
        $scope.fetchAllBillingGroups();
    };

    /**
     * Function to set credit card details if the selected entity has a CC attached previously
     * @return {undefined}
     */
    var setCreditCardDetails = function() {
        var entity = $scope.selectedEntity;

        if (entity.credit_card_details !== null &&
            entity.credit_card_details !== undefined &&
            entity.credit_card_details.hasOwnProperty('payment_type_description')) {

            $scope.renderAddedPayment                = entity.credit_card_details;
            $scope.renderAddedPayment.cardExpiry     = entity.credit_card_details.card_expiry;
            $scope.renderAddedPayment.endingWith     = entity.credit_card_details.card_number;
            $scope.renderAddedPayment.creditCardType = entity.credit_card_details.card_code;

            $scope.paymentFlags.showPaymentDropDown   = false;
            $scope.paymentFlags.isShownExistingCCPayment = true;

            setTimeout(function() {
                $scope.$broadcast('UPDATE_FLAG');
            }, 1000);
        }
    };

    /**
     * Set common payment model items
     * @return {undefined}
     */   
    var setCommonPaymentModelItems = function() {
        $scope.passData = {};
        $scope.passData.details = {
            firstName: "",
            lastName: ""
        };
        $scope.setScroller('cardsList');
    };

    /**
     * Initialize scrollers for the screen
     * @return {undefined}
     */
    var initializeScrollers = function() {
        var scrollerOptions = { preventDefault: false};

        $scope.setScroller('paymentList', scrollerOptions);
        $scope.setScroller('billingGroups', scrollerOptions);
        $scope.setScroller('chargeCodes', scrollerOptions);
        $scope.setScroller('routeDetails', scrollerOptions);

        var scrollerOptionsForSearch = {click: true};

        $scope.setScroller('chargeCodesList', scrollerOptionsForSearch);

        $scope.chargeCodesListDivHgt = 250;
        $scope.chargeCodesListDivTop = 0;
    };

    /**
     * Refresh scrollers in the screen
     * @return {undefined}
     */
    var refreshScrollers = function() {
        setTimeout(function() {
            $scope.refreshScroller('paymentList');
            $scope.refreshScroller('billingGroups');
            $scope.refreshScroller('chargeCodes');
            $scope.refreshScroller('chargeCodesList');
            $scope.refreshScroller('routeDetails');
        }, 500);
    };

    /**
     * Save the old payment details and move to add new payment screen
     * on clicking the edit payment button.
     * @return {undefined}
     */
    $scope.editPaymentMethod = function() {
        $scope.oldPayment = $scope.renderAddedPayment;
        $scope.renderAddedPayment = null;
        $scope.paymentFlags.isAddPayment = false;
    };

    /**
     * Function to show the payment list on cancelling or adding new payment
     * @return {undefined}
     */
    $scope.showPaymentList = function() {
        $scope.paymentFlags.isAddPayment = false;
        $scope.refreshScroller('paymentList');
    };

    /**
     * On cancelling new payment, set old payment as payment
     */
    $scope.$on("CANCELLED_PAYMENT", function () {
        $scope.renderAddedPayment = $scope.oldPayment;
        $scope.refreshScroller('routeDetails');
    });

    /**
     * Retrieve credit card expiry based on payment gateway
     * @return {DateObject}
     */
    var retrieveExpiryDate = function() {
        var expiryDate = $scope.cardData.tokenDetails.isSixPayment ?
                         $scope.cardData.tokenDetails.expiry.substring(2, 4) + " / " + $scope.cardData.tokenDetails.expiry.substring(0, 2) :
                         $scope.cardData.cardDetails.expiryMonth + " / " + $scope.cardData.cardDetails.expiryYear;

        return expiryDate;
    };

    /**
     * Retrieve credit card number based on payment gateway
     * @return {Number} credit card number
     */
    var retrieveCardNumber = function() {
        var cardNumber = $scope.cardData.tokenDetails.isSixPayment ?
                         $scope.cardData.tokenDetails.token_no.substr($scope.cardData.tokenDetails.token_no.length - 4) :
                         $scope.cardData.cardDetails.cardNumber.slice(-4);

        return cardNumber;
    };

    /**
     * Function to retrieve name on credit card
     * @return {card name}
     */
    var retrieveCardName = function() {
        var cardName = (!$scope.cardData.tokenDetails.isSixPayment) ?
                       $scope.cardData.cardDetails.userName :
                       ($scope.passData.details.firstName + " " + $scope.passData.details.lastName);

        return cardName;
    };

    /**
     * Retrieve the credit card expiry date
     * @return {String} card expiry date
     */
    var retrieveCardExpiryForApi =  function() {
        var cardInfo    = $scope.cardData;
        var expiryMonth = cardInfo.tokenDetails.isSixPayment ? 
                          cardInfo.tokenDetails.expiry.substring(2, 4) :
                          cardInfo.cardDetails.expiryMonth;
        var expiryYear  = cardInfo.tokenDetails.isSixPayment ? 
                          cardInfo.tokenDetails.expiry.substring(0, 2) :
                          cardInfo.cardDetails.expiryYear;
        var expiryDate  = (expiryMonth && expiryYear ) ? ("20" + expiryYear + "-" + expiryMonth + "-01") : "";

        return expiryDate;
    };

    /**
     * Function to show the newly added payment
     * @param {Object} credit card details
     * @return {undefined}
     */
    $scope.paymentAdded = function(data) {
        $scope.selectedEntity.selected_payment = "";
        $scope.cardData = data;
        $scope.renderAddedPayment = {};
        $scope.renderAddedPayment.payment_type = "CC";
        $scope.paymentFlags.isAddPayment = false;

        $scope.renderAddedPayment.creditCardType = (!$scope.cardData.tokenDetails.isSixPayment) ?
                                                   getCreditCardType($scope.cardData.cardDetails.cardType).toLowerCase() :
                                                   getSixCreditCardType($scope.cardData.tokenDetails.card_type).toLowerCase();
        $scope.renderAddedPayment.cardExpiry = retrieveExpiryDate();
        $scope.renderAddedPayment.endingWith = retrieveCardNumber();
    };

    /**
     * Function to add payment through MLI swipe
     * @param {object} swiped card data
     * @return {undefined}
     */
    $scope.paymentAddedThroughMLISwipe = function(swipedCardDataToSave) {
        $scope.renderAddedPayment = {};
        $scope.renderAddedPayment.payment_type = "CC";
        $scope.swipedCardDataToSave = swipedCardDataToSave;
        $scope.renderAddedPayment.creditCardType = swipedCardDataToSave.cardType.toLowerCase();
        $scope.renderAddedPayment.cardExpiry = swipedCardDataToSave.cardExpiryMonth + "/" + swipedCardDataToSave.cardExpiryYear;
        $scope.renderAddedPayment.endingWith = swipedCardDataToSave.cardNumber.slice(-4);
    };

    /**
     * Function to show the add payment view
     * @return {undefined}
     */
    $scope.showAddPayment = function() {
        if (!$rootScope.isManualCCEntryEnabled) {
            $scope.isManualCCEntryEnabled = false;
            var dialog = ngDialog.open({
                template: '/assets/partials/payment/rvPaymentModal.html',
                controller: '',
                scope: $scope
            });

            return;
        }

        $scope.renderAddedPayment = {
            creditCardType: "",
            cardExpiry: "",
            endingWith: "",
            payment_type: ""
        };

        $scope.paymentFlags.isAddPayment = true;
        $scope.paymentFlags.showPaymentDropDown   = true;
        $scope.paymentFlags.isShownExistingCCPayment = false;

        $scope.$broadcast('showaddpayment');
        $scope.refreshScroller('routeDetails');
    };

    $scope.$on("SHOW_SWIPED_DATA_ON_BILLING_SCREEN", function(e, swipedCardDataToRender) {
        $scope.paymentFlags.isAddPayment = true;
        $scope.$broadcast('showaddpayment');

        setTimeout(function() {
            $scope.saveData.payment_type = "CC";
            $scope.paymentFlags.showPaymentDropDown = true;
            $scope.swippedCard = true;
            $scope.$broadcast('RENDER_DATA_ON_BILLING_SCREEN', swipedCardDataToRender);
            $scope.$digest();
        }, 2000);
    });

    /**
     * Listener to track the ngDialog open event.
     * We save the id for the ngDialog to close nested dialog for 
     * disabling manual payment addition.
     */
    $scope.$on("ngDialog.opened", function(event, data) {
        $scope.ngDialogID =  data[0].id;
    });

    /**
     * Function to close the billing information popup
     * @return {undefined}
     */
    $scope.closeDialog = function() {
        ngDialog.close($scope.ngDialogID);
    };

    /**
     * Function to fetch default Routing Account from server
     * @return {undefined}
     */
    $scope.fetchDefaultAccountRouting = function() {

        var successCallback = function(data) {
            $scope.selectedEntity.attached_billing_groups = data.billing_groups;
            $scope.selectedEntity.attached_charge_codes   = data.attached_charge_codes;
            $scope.selectedEntity.reference_number        = data.reference_number;
            $scope.selectedEntity.is_allow_direct_debit   = data.is_allow_direct_debit;

            if (data.credit_limit) {
                $scope.selectedEntity.credit_limit     = parseFloat(data.credit_limit).toFixed(2);
            }

            if (!isEmptyObject(data.credit_card_details)) {
                $scope.renderAddedPayment                = data.credit_card_details;
                $scope.renderAddedPayment.cardExpiry     = data.credit_card_details.card_expiry;
                $scope.renderAddedPayment.endingWith     = data.credit_card_details.card_number;
                $scope.renderAddedPayment.creditCardType = data.credit_card_details.card_code;

                $scope.saveData.payment_type     = data.credit_card_details.payment_type;
                $scope.paymentFlags.isAddPayment = false;

                if (data.credit_card_details.payment_type !== 'CC') {
                    $scope.paymentFlags.showPaymentDropDown = true;
                }
                else {
                    $scope.paymentFlags.showPaymentDropDown   = false;
                    $scope.paymentFlags.isShownExistingCCPayment = true;
                }
            }
            $scope.$parent.$emit('hideLoader');
        };

        var params = {
            id: $scope.selectedEntity.id,
            entity_type: $scope.selectedEntity.entity_type
        };

        $scope.invokeApi(RVBillinginfoSrv.fetchDefaultAccountRouting, params, successCallback);
    };

    /**
     * Function to fetch all billing groups from server
     * @return {undefined}
     */
    $scope.fetchAllBillingGroups = function() {

        var successCallback = function(data) {
            $scope.availableBillingGroups = data;
            if (data.length === 0) {
                $scope.isBillingGroup = false;
            }
            $scope.$parent.$emit('hideLoader');
        };

        var errorCallback = function(errorMessage) {
            $scope.$parent.$emit('hideLoader');
            $scope.$emit('displayErrorMessage', errorMessage);
        };

        $scope.invokeApi(RVBillinginfoSrv.fetchAllBillingGroups, '', successCallback, errorCallback);
    };

    /**
     * Function to fetch all charge codes from server
     * @return {undefined}
     */
    $scope.fetchAllChargeCodes = function() {

        var successCallback = function(data) {
            $scope.availableChargeCodes = data;
        };

        var errorCallback = function(errorMessage) {
            $scope.$parent.$emit('hideLoader');
            $scope.$emit('displayErrorMessage', errorMessage);
        };

        $scope.invokeApi(RVBillinginfoSrv.fetchAllChargeCodes, '', successCallback, errorCallback);
    };

    /**
     * Function that converts a null value to a desired string.
     * if no replace value is passed, it returns an empty string.
     * @return {String}
     */
    $scope.escapeNull = function(value, replaceWith) {
        return escapeNull(value, replaceWith);
    };

    /**
     * Listener for the save button click
     * @return {undefined}
     */
    $scope.$on('routeSaveClicked', function(event) {
        $scope.saveRoute();
    });

    /**
     * Function to save the new route
     * @return {undefined}
     */
    $scope.saveRoute = function() {
        if ($scope.selectedEntity.attached_charge_codes.length === 0 && 
            $scope.selectedEntity.attached_billing_groups.length === 0) {

            $scope.$emit('displayErrorMessage', [$filter('translate')('ERROR_CHARGES_EMPTY')]);
            return;
        }

        if ( $scope.saveData.payment_type !== null && $scope.saveData.payment_type !== "" &&
            !$scope.paymentFlags.isShownExistingCCPayment) {

            /**
             * If new payment type is added, save the payment first,
             * then save the route.
             */
            $scope.savePayment();
        }
        else {
            saveRouteAPICall();
        }
    };

    /**
     * Calls API to save new route
     * @return {undefined}
     */
    var saveRouteAPICall = function() {

        var defaultRoutingSaveSuccess = function(data) {
            $scope.$parent.$emit('hideLoader');
            if (data.has_crossed_credit_limit) {
                showCreditLimitExceededPopup();
            }
            else {
                $scope.$parent.$emit('BILLINGINFOADDED');
                ngDialog.close();
            }
        };

        var errorCallback = function(errorMessage) {
            $scope.$parent.$emit('hideLoader');
            $scope.$emit('displayErrorMessage', errorMessage);
        };

        var params = angular.copy($scope.selectedEntity);            

        $scope.invokeApi(RVBillinginfoSrv.saveDefaultAccountRouting, params, defaultRoutingSaveSuccess, errorCallback);
    };

    /**
     * Function to save a new payment type for the bill
     * @return {undefined}
     */
    $scope.savePayment = function() {

        $scope.saveSuccessCallback = function(data) {
            $scope.$parent.$emit('hideLoader');
            $scope.$parent.$emit('BILLINGINFOADDED');
        };

        $scope.errorCallback = function(errorMessage) {
            $scope.$parent.$emit('hideLoader');
            $scope.$emit('displayErrorMessage', errorMessage);
        };

        $scope.savePaymentToReservationOrAccount();
    };

    /**
     * Function to save payment type to a reservation or to an account
     * @param {account}
     * @return {undefined}
     */
    $scope.savePaymentToReservationOrAccount = function() {

        $scope.errorCallback = function(errorMessage) {
            $scope.$parent.$emit('hideLoader');
            $scope.$emit('displayErrorMessage', errorMessage);
        };

        var defaultRoutingSaveSuccess = function(data) {
            $scope.$parent.$emit('hideLoader');
            if (data.has_crossed_credit_limit) {
                showCreditLimitExceededPopup();
            }
            else {
                $scope.$parent.$emit('BILLINGINFOADDED');
                ngDialog.close();
            }
        };

        var successCallback = function(data) {
            $scope.$parent.$emit('hideLoader');
            var params = angular.copy( $scope.selectedEntity);

            $scope.invokeApi(RVBillinginfoSrv.saveDefaultAccountRouting, params, defaultRoutingSaveSuccess, $scope.errorCallback);
        };

        var successSixSwipe = function(response) {
            var data = {
                "token": response.token,
                "is_swiped": true
            };

            data.account_id = $scope.selectedEntity.id;
            $scope.invokeApi(RVPaymentSrv.savePaymentDetails, data, successCallback, $scope.errorCallback);
        };

        if ($scope.saveData.payment_type === 'CC') {
            if ($rootScope.paymentGateway === "sixpayments" && 
               !$scope.paymentFlags.sixIsManual) {

                var data = {};

                data.account_id = $scope.selectedEntity.id;
                data.add_to_guest_card = false;

                $scope.$emit('UPDATE_SHOULD_SHOW_WAITING', true);
                RVPaymentSrv.chipAndPinGetToken(data).then(function(response) {
                    $scope.$emit('UPDATE_SHOULD_SHOW_WAITING', false);
                    successSixSwipe(response);
                }, function(error) {
                    $scope.errorMessage = error;
                    $scope.$emit('UPDATE_SHOULD_SHOW_WAITING', false);
                });
            }
            else if (!isEmptyObject($scope.swipedCardDataToSave)) {
                var data = $scope.swipedCardDataToSave;

                data.account_id = $scope.selectedEntity.id;
                data.payment_credit_type = $scope.swipedCardDataToSave.cardType;
                data.credit_card = $scope.swipedCardDataToSave.cardType;
                data.card_expiry = "20" + $scope.swipedCardDataToSave.cardExpiryYear + "-" + $scope.swipedCardDataToSave.cardExpiryMonth + "-01";

                $scope.invokeApi(RVPaymentSrv.savePaymentDetails, data, successCallback, $scope.errorCallback);
            }
            else {
                var data = {
                    "add_to_guest_card": false
                };

                data.account_id   = $scope.selectedEntity.id;
                data.payment_type = $scope.saveData.payment_type;
                creditCardType    = (!$scope.cardData.tokenDetails.isSixPayment) ?
                                    getCreditCardType($scope.cardData.cardDetails.cardType) :
                                    getSixCreditCardType($scope.cardData.tokenDetails.card_type).toLowerCase();
                data.token        = (!$scope.cardData.tokenDetails.isSixPayment) ?
                                    $scope.cardData.tokenDetails.session : $scope.cardData.tokenDetails.token_no;
                data.card_name    = retrieveCardName();
                data.card_expiry  = retrieveCardExpiryForApi();
                data.card_code    = (!$scope.cardData.tokenDetails.isSixPayment) ?
                                    $scope.cardData.cardDetails.cardType :
                                    getSixCreditCardType($scope.cardData.tokenDetails.card_type).toLowerCase();

                $scope.invokeApi(RVPaymentSrv.savePaymentDetails, data, successCallback, $scope.errorCallback);
            }
        }
        else {
            var data = {
                "payment_type": $scope.saveData.payment_type
            };

            data.account_id = $scope.selectedEntity.id;
            $scope.invokeApi(RVPaymentSrv.savePaymentDetails, data, successCallback, $scope.errorCallback);
        }
    };

    /**
     * Function to open credit limit exceeded popup
     * @return {undefined}
     */
    var showCreditLimitExceededPopup = function() {
       ngDialog.open({
            template: '/assets/partials/billingInformation/sharedPartials/rvBillingInfoCreditLimitExceededPopup.html',
            className: '',
            closeByDocument: false,
            scope: $scope
        });
    };

    /**
     * Function to get permission to edit credit limit
     * @return {undefined}
     */
    $scope.hasPermissionToEditCreditLimit = function() {
        return rvPermissionSrv.getPermissionValue('OVERWRITE_DIRECT_BILL_MAXIMUM_AMOUNT');
    };

    $scope.$on('CHANGE_IS_MANUAL', function(e, value) {
        $scope.paymentFlags.sixIsManual = value;
    });

    /**
     * Function to show/hide credit card
     * @return {undefined}
     */
    $scope.showAvailableCreditCard = function() {
        return (!isEmptyObject($scope.renderAddedPayment) &&
               !$scope.paymentFlags.isAddPayment &&
               !$scope.saveData.newPaymentFormVisible);
    };

    init();

}]);
