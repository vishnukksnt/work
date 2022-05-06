sntRover.controller('rvBillingInfoAllotmentRouteDetailsCtrl', ['$scope', '$rootScope', '$filter', 'RVBillinginfoSrv', 'rvPermissionSrv', 'RVGuestCardSrv', 'ngDialog', 'RVBillCardSrv', 'RVPaymentSrv', '$q', function($scope, $rootScope, $filter, RVBillinginfoSrv, rvPermissionSrv, RVGuestCardSrv, ngDialog, RVBillCardSrv, RVPaymentSrv, $q) {
    BaseCtrl.call(this, $scope);

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
     * On adding a credit card, refresh the route details scroller
     */
    $scope.$on('REFRESH_ROUTE_DETAILS_SCROLLER', function() {
        $scope.refreshScroller('routeDetails');
    });

    // retrieve card expiry based on paymnet gateway
    var retrieveExpiryDate = function() {

        var expiryDate = $scope.cardData.tokenDetails.isSixPayment ?
                    $scope.cardData.tokenDetails.expiry.substring(2, 4) + " / " + $scope.cardData.tokenDetails.expiry.substring(0, 2) :
                    $scope.cardData.cardDetails.expiryMonth + " / " + $scope.cardData.cardDetails.expiryYear

                    ;
        return expiryDate;
    };

    // retrieve card number based on paymnet gateway
    var retrieveCardNumber = function() {
        var cardNumber = $scope.cardData.tokenDetails.isSixPayment ?
                $scope.cardData.tokenDetails.token_no.substr($scope.cardData.tokenDetails.token_no.length - 4) :
                $scope.cardData.cardDetails.cardNumber.slice(-4);

        return cardNumber;
    };

    /**
     * function to show the newly added payment
     */
    $scope.paymentAdded = function(data) {
        $scope.selectedEntity.selected_payment = "";
        $scope.cardData = data;
        $scope.renderAddedPayment = {};
        $scope.renderAddedPayment.payment_type = "CC";
        $scope.isAddPayment = false;
        $scope.showPayment  = true;

        $scope.renderAddedPayment.creditCardType = (!$scope.cardData.tokenDetails.isSixPayment) ?
                                        getCreditCardType($scope.cardData.cardDetails.cardType).toLowerCase() :
                                        getSixCreditCardType($scope.cardData.tokenDetails.card_type).toLowerCase();
        $scope.renderAddedPayment.cardExpiry = retrieveExpiryDate();
        $scope.renderAddedPayment.endingWith = retrieveCardNumber();
    };

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
     * We save the id for the ngDialog to close nested dialog for disabling manual payment addition.
    */
    $scope.$on("ngDialog.opened", function(event, data) {

           $scope.ngDialogID =  data[0].id;
    });

    $scope.closeDialog = function() {
        ngDialog.close($scope.ngDialogID);

    };

    /**
     * Set entity details when we have data from API.
     * @param {Object} API response
     * @return {undefined}
     */
    var fetchDefaultAccountRoutingsuccessCallback = function(data) {
        // CICO-19848: In case of allotment
        if (data.charge_routes_recipient !== undefined) {
            if (data.type === "TRAVELAGENT") {
                data.type = "TRAVEL_AGENT";
            }
            else if (data.type === "COMPANY") {
                data.type = "COMPANY_CARD";
            }
            else if (data.posting_account_type) {
                data.type = data.posting_account_type;
            } else {
                data.type = data.charge_routes_recipient.type;
                data.reservation_status = data.status;
                if (data.images) data.images[0].guest_image = data.images[0].image;
            }
            $scope.selectedEntity = _.extend($scope.selectedEntity, data);
            $scope.selectedEntity.entity_type = data.type;
            $scope.attachedEntities = [$scope.selectedEntity];
        }
        $scope.selectedEntity.attached_billing_groups = data.billing_groups;

        if (data.credit_limit) {
            $scope.selectedEntity.credit_limit = parseFloat(data.credit_limit).toFixed(2);
        }

        $scope.selectedEntity.reference_number = data.reference_number;
        // Added for CICO-22869
        $scope.selectedEntity.attached_charge_codes = data.attached_charge_codes;
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
    };

    /**
     * Fetch the route details
     * @return {undefined}
     */
    $scope.fetchDefaultAccountRouting = function() {
        var params = {};

        params.id = $scope.allotmentId;
        params.entity_type = "ALLOTMENT";
        $scope.invokeApi(RVBillinginfoSrv.fetchDefaultAccountRouting, params, fetchDefaultAccountRoutingsuccessCallback);
    };

    var fetchAllBillingGroupsSuccessCallback = function(data) {
        $scope.availableBillingGroups = data;
        if (data.length === 0) {
            $scope.isBillingGroup = false;
        }
    };

    var fetchAllBillingGroupsFailureCallback = function(errorMessage) {
        $scope.$parent.$emit('hideLoader');
        $scope.$emit('displayErrorMessage', errorMessage);
    };

    /**
     * Function to fetch available billing groups from the server
     * @return {undefined}
     */
    $scope.fetchAllBillingGroups = function() {
        $scope.invokeApi(RVBillinginfoSrv.fetchAllBillingGroups, '',
            fetchAllBillingGroupsSuccessCallback,
            fetchAllBillingGroupsFailureCallback);
    };

    var fetchAllChargeCodesSuccessCallBack = function(data) {
        $scope.availableChargeCodes = data;
    };

    var fetchAllChargeCodesFailureCallBack = function(errorMessage) {
        $scope.$parent.$emit('hideLoader');
        $scope.$emit('displayErrorMessage', errorMessage);
    };

    /**
     * Fetch the available charge codes
     * @return {undefined}
     */
    $scope.fetchAllChargeCodes = function() {
        $scope.invokeApi(RVBillinginfoSrv.fetchAllChargeCodes, '',
            fetchAllChargeCodesSuccessCallBack,
            fetchAllChargeCodesFailureCallBack);
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
    */
    $scope.$on('routeSaveClicked', function(event) {
        $scope.saveRoute();
    });

    /**
     * Save the route details. if payment data exists then save payment also.
     * @return {undefined}
     */
    $scope.saveRoute = function() {
        var saveData = $scope.saveData,
            entity   = $scope.selectedEntity;

        // If no charge codes and billing group selected abort saving.
        if (entity.attached_charge_codes.length === 0 &&
            entity.attached_billing_groups.length === 0) {

            $scope.$emit('displayErrorMessage', [$filter('translate')('ERROR_CHARGES_EMPTY')]);
            return;
        }

        if ( $scope.saveData.payment_type !== null &&
            $scope.saveData.payment_type !== "" &&
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

    $scope.saveSuccessCallback = function (data) {
        $scope.$parent.$emit('hideLoader');
        if (data.has_crossed_credit_limit) {
            ngDialog.open({
                template: '/assets/partials/bill/rvBillingInfoCreditLimitExceededPopup.html',
                className: '',
                closeByDocument: false,
                scope: $scope
            });
        }
        else {
            $scope.$parent.$emit('BILLINGINFOADDED');
            $scope.setReloadOption(true);
            $scope.headerButtonClicked();
            $scope.updateCardInfo();
            $scope.$parent.$emit('REFRESH_BILLCARD_VIEW');
        }
    };

    var saveRouteAPICall = function() {

        var errorCallback = function(errorMessage) {
            $scope.$parent.$emit('hideLoader');
            $scope.$emit('displayErrorMessage', errorMessage);
        };

        var defaultRoutingSaveSuccess = function () {
            $scope.$parent.$emit('hideLoader');
            $scope.$parent.$emit('BILLINGINFOADDED');
            ngDialog.close();
        };

        var params =  angular.copy($scope.selectedEntity);

        params.entity_type  = "ALLOTMENT";
        params.allotment_id = $scope.allotmentId;
        $scope.invokeApi(RVBillinginfoSrv.saveAllotmentDefaultAccountRouting, params, defaultRoutingSaveSuccess);
    };

    $scope.hasPermissionToEditCreditLimit = function () {
        return rvPermissionSrv.getPermissionValue ('OVERWRITE_DIRECT_BILL_MAXIMUM_AMOUNT');
    };

    var retrieveCardName = function() {
        var cardName = (!$scope.cardData.tokenDetails.isSixPayment) ?
                            $scope.cardData.cardDetails.userName :
                            ($scope.passData.details.firstName + " " + $scope.passData.details.lastName);

        return cardName;
    };

    var retrieveCardExpiryForApi =  function() {
        var expiryMonth = $scope.cardData.tokenDetails.isSixPayment ? $scope.cardData.tokenDetails.expiry.substring(2, 4) : $scope.cardData.cardDetails.expiryMonth;
        var expiryYear  = $scope.cardData.tokenDetails.isSixPayment ? $scope.cardData.tokenDetails.expiry.substring(0, 2) : $scope.cardData.cardDetails.expiryYear;
        var expiryDate  = (expiryMonth && expiryYear ) ? ("20" + expiryYear + "-" + expiryMonth + "-01") : "";

        return expiryDate;
    };

    /**
     * function to save a new payment type for the bill
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

        $scope.savePaymentToReservationOrAccount('allotment');
    };

    $scope.savePaymentToReservationOrAccount = function(toReservationOrAccount) {

        var successCallback = function(data) {
            saveRouteAPICall();
        };

        var errorCallback = function(errorMessage) {
            $scope.$parent.$emit('hideLoader');
            $scope.$emit('displayErrorMessage', errorMessage);
        };

        var successSixSwipe = function(response) {

            var data = {
                "token": response.token,
                "is_swiped": true
            };

            data.allotment_id = $scope.allotmentId;
            $scope.invokeApi(RVPaymentSrv.savePaymentDetails, data, successCallback, errorCallback);
        };

        if ($scope.saveData.payment_type === 'CC') {
            if ($rootScope.paymentGateway === "sixpayments" && !$scope.paymentFlags.sixIsManual) {

                var data = {};

                data.allotment_id = $scope.allotmentId;
                data.add_to_guest_card = false;
                data.bill_number = $scope.getSelectedBillNumber();

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

                data.allotment_id = $scope.allotmentId;
                data.bill_number = $scope.getSelectedBillNumber();
                data.payment_credit_type = $scope.swipedCardDataToSave.cardType;
                data.credit_card = $scope.swipedCardDataToSave.cardType;
                data.card_expiry = "20" + $scope.swipedCardDataToSave.cardExpiryYear + "-" + $scope.swipedCardDataToSave.cardExpiryMonth + "-01";
                $scope.invokeApi(RVPaymentSrv.savePaymentDetails, data, successCallback, errorCallback);
            }
            else {
                var data = {
                    "add_to_guest_card": false
                };

                data.allotment_id = $scope.allotmentId;
                data.payment_type = $scope.saveData.payment_type;
                creditCardType = (!$scope.cardData.tokenDetails.isSixPayment) ?
                                getCreditCardType($scope.cardData.cardDetails.cardType) :
                                getSixCreditCardType($scope.cardData.tokenDetails.card_type).toLowerCase();
                data.token = (!$scope.cardData.tokenDetails.isSixPayment) ? $scope.cardData.tokenDetails.session : $scope.cardData.tokenDetails.token_no;
                data.card_name = retrieveCardName();
                data.bill_number = $scope.getSelectedBillNumber();
                data.card_expiry =  retrieveCardExpiryForApi();
                data.card_code   = (!$scope.cardData.tokenDetails.isSixPayment) ?
                                $scope.cardData.cardDetails.cardType :
                                getSixCreditCardType($scope.cardData.tokenDetails.card_type).toLowerCase();
                $scope.invokeApi(RVPaymentSrv.savePaymentDetails, data, successCallback, errorCallback);
            }
        }
        else {
            var data = {
                    "payment_type": $scope.saveData.payment_type
            };

            data.allotment_id = $scope.allotmentId;
            data.bill_number = $scope.getSelectedBillNumber();
            $scope.invokeApi(RVPaymentSrv.savePaymentDetails, data, successCallback, errorCallback);
        }
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
     * Fired when all promises are completed
     * @return {undefined}
     */
    var fetchAllInitialDataSuccessCallBack = function(data) {
        $scope.$emit('hideLoader');
    };

    var fetchAllInitialDataFailureCallBack = function(error) {
        $scope.$emit('hideLoader');
        $scope.errorMessage = error;
    };

    /**
     * Call all api needed for rendering route details.
     * 1. Billing groups
     * 2. Charge codes
     * 3. Default routing
     * @return {undefined}
     */
    var fetchInitialData = function() {
        var promises = [];

        // we are not using our normal API calling since we have multiple API calls needed
        $scope.$emit('showLoader');

        // fetch billing groups
        promises.push(RVBillinginfoSrv
            .fetchAllBillingGroups('')
            .then(fetchAllBillingGroupsSuccessCallback, fetchAllBillingGroupsFailureCallback)
        );

        // fetch charge codes
        promises.push(RVBillinginfoSrv
            .fetchAllChargeCodes('')
            .then(fetchAllChargeCodesSuccessCallBack, fetchAllChargeCodesFailureCallBack)
        );

        // fetch default routing if entity not set
        if (!$scope.selectedEntity.entity_type) {
            var params = {};

            params.id = $scope.allotmentId;
            params.entity_type = "ALLOTMENT";
            promises.push(RVBillinginfoSrv
                .fetchDefaultAccountRouting(params)
                .then(fetchDefaultAccountRoutingsuccessCallback)
            );
        }

        // Lets start the processing
        $q.all(promises)
            .then(fetchAllInitialDataSuccessCallBack, fetchAllInitialDataFailureCallBack);
    };

    /**
     * Bootstrap logic here
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

    // rock and roll
    init();

}]);