sntRover.controller('rvRouteDetailsCtrl', ['$scope', '$rootScope', '$filter', 'RVBillinginfoSrv', 'RVCompanyCardSrv', 'rvPermissionSrv', 'RVGuestCardSrv', 'ngDialog', 'RVBillCardSrv', 'RVPaymentSrv', function($scope, $rootScope, $filter, RVBillinginfoSrv, RVCompanyCardSrv, rvPermissionSrv, RVGuestCardSrv, ngDialog, RVBillCardSrv, RVPaymentSrv) {
    $scope.routeDetailsState = {
        newCard: null
    };

    BaseCtrl.call(this, $scope);
    $scope.isAddPayment = false;
    $scope.chargeCodeToAdd = "";
    $scope.showPayment = false;
    $scope.first_bill_id = "";
    $scope.showChargeCodes = false;
    $scope.isBillingGroup = true;
    $scope.paymentDetails = null;
    $scope.swipedCardDataToSave = {};
    $scope.showCreditCardDropDown = false;
    $scope.isShownExistingCCPayment = false;
    $scope.isCompanyTravelAgent = false;
    $scope.billNumberOnAddCC = '';

    if ($scope.selectedEntity.credit_card_details !== null && $scope.selectedEntity.credit_card_details !== undefined && $scope.selectedEntity.credit_card_details.hasOwnProperty('payment_type_description')) {

        $scope.renderAddedPayment = $scope.selectedEntity.credit_card_details;
        $scope.renderAddedPayment.cardExpiry = $scope.selectedEntity.credit_card_details.card_expiry;
        $scope.renderAddedPayment.endingWith = $scope.selectedEntity.credit_card_details.card_number;
        $scope.renderAddedPayment.creditCardType = $scope.selectedEntity.credit_card_details.card_code;
        $scope.showPayment = true;
        $scope.showCreditCardDropDown = false;

        $scope.isShownExistingCCPayment = true;
        setTimeout(function() {
            $scope.$broadcast('UPDATE_FLAG');
        }, 1000);
    }

    // common payment model items
    $scope.passData = {};
    $scope.passData.details = {};
    if (typeof $scope.guestCardData === 'undefined' || typeof $scope.guestCardData.contactInfo === 'undefined') {
        $scope.passData.details.firstName = '';
        $scope.passData.details.lastName = '';
    }
    else {
        $scope.passData.details.firstName = $scope.guestCardData.contactInfo.first_name;
        $scope.passData.details.lastName = $scope.guestCardData.contactInfo.last_name;
    }
    $scope.setScroller('cardsList');

    /**
     * Initializing the scrollers for the screen
     */
    var scrollerOptions = {preventDefault: false};

    $scope.setScroller('paymentList', scrollerOptions);
    $scope.setScroller('billingGroups', scrollerOptions);
    $scope.setScroller('chargeCodes', scrollerOptions);
    $scope.setScroller('routeDetails', scrollerOptions);
    var scrollerOptionsForSearch = {click: true};

    $scope.setScroller('chargeCodesList', scrollerOptionsForSearch);
    $scope.chargeCodesListDivHgt = 250;
    $scope.chargeCodesListDivTop = 0;

    if ($scope.selectedEntity.credit_limit) {
        $scope.selectedEntity.credit_limit = parseFloat($scope.selectedEntity.credit_limit).toFixed(2);
    }

    var refreshScrollers = function() {
        $scope.refreshScroller('paymentList');
        $scope.refreshScroller('billingGroups');
        $scope.refreshScroller('chargeCodes');
        $scope.refreshScroller('chargeCodesList');
        $scope.refreshScroller('routeDetails');
    };

    setTimeout(refreshScrollers, 500);

    $scope.editPaymentMethod = function() {
        $scope.refreshScroller('paymentList');
        $scope.oldPayment = $scope.renderAddedPayment;
        $scope.renderAddedPayment = null;
        $scope.isAddPayment = false;
    };

    $scope.checkBillStatus = function() {
        return $scope.reservationBillData && !$scope.reservationBillData.bills[0].is_active;
    };

    /**
     * function to show the payment list on cancelling or adding new payment
     */
    $scope.showPaymentList = function() {
        $scope.isAddPayment = false;
        $scope.refreshScroller('paymentList');
    };

    $scope.$on("CANCELLED_PAYMENT", function() {
        $scope.renderAddedPayment = $scope.oldPayment;
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
        $scope.showPayment = true;

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


    $scope.onSaveNewCard = function(data) {
        $scope.selectedEntity.selected_payment = "";
        $scope.cardData = data.cardDetails;
        $scope.renderAddedPayment = {};
        $scope.renderAddedPayment.payment_type = "CC";
        $scope.isAddPayment = false;
        $scope.showPayment = true;

        $scope.renderAddedPayment.creditCardType = data.cardDetails.card_code;
        $scope.renderAddedPayment.cardExpiry = data.cardDetails.expiry_date;
        $scope.renderAddedPayment.endingWith = data.cardDetails.ending_with;
        /**
         * This value is updated to proceed in a different workflow IFF a new card has been selected
         */
        $scope.routeDetailsState.newCard = data.cardDetails.expiry_date + data.cardDetails.ending_with + data.cardDetails.card_code;
    };

    /**
     * function to show the add payment view
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

        $scope.billNumberOnAddCC = $scope.selectedEntity.is_new ? $scope.newBillNumber : 
                                            $scope.selectedEntity.bill_no;

        $scope.isAddPayment = true;
        $scope.showCreditCardDropDown = true;
        $scope.renderAddedPayment = {};
        $scope.renderAddedPayment.creditCardType = "";
        $scope.renderAddedPayment.cardExpiry = "";
        $scope.renderAddedPayment.endingWith = "";
        $scope.renderAddedPayment.payment_type = "";
        $scope.isShownExistingCCPayment = false;
        $scope.$broadcast('showaddpayment');
        $scope.refreshScroller('routeDetails');
    };
    $scope.$on("SHOW_SWIPED_DATA_ON_BILLING_SCREEN", function(e, swipedCardDataToRender) {
        $scope.isAddPayment = true;
        $scope.$broadcast('showaddpayment');

        setTimeout(function() {
            $scope.saveData.payment_type = "CC";
            $scope.showCreditCardDropDown = true;
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

        $scope.ngDialogID = data[0].id;
    });
    $scope.closeDialog = function() {
        ngDialog.close($scope.ngDialogID);

    };
    /**
     * function to switch between the charge code and billing groups views
     */
    $scope.toggleChargeType = function() {
        $scope.isBillingGroup = !$scope.isBillingGroup;
        if ($scope.isBillingGroup) {
            $scope.refreshScroller('billingGroups');
        }
        else {
            $scope.refreshScroller('chargeCodes');
        }
        $scope.showChargeCodes = false;
    };
    /**
     * function to know if the billing grup is selected or not, to adjust the UI
     */
    $scope.isBillingGroupSelected = function(billingGroup) {
        for (var i = 0; i < $scope.selectedEntity.attached_billing_groups.length; i++) {
            if ($scope.selectedEntity.attached_billing_groups[i].id === billingGroup.id) {
                return true;
            }
        }
        return false;
    };
    /**
     * function to switch the billing group selection
     */
    $scope.toggleSelectionForBillingGroup = function(billingGroup) {
        for (var i = 0; i < $scope.selectedEntity.attached_billing_groups.length; i++) {
            if ($scope.selectedEntity.attached_billing_groups[i].id === billingGroup.id) {
                $scope.selectedEntity.attached_billing_groups.splice(i, 1);
                return;
            }
        }
        $scope.selectedEntity.attached_billing_groups.push(billingGroup);
        $scope.refreshScroller('billingGroups');
    };
    /**
     * function to remove the charge code
     */
    $scope.removeChargeCode = function(chargeCode) {
        for (var i = 0; i < $scope.selectedEntity.attached_charge_codes.length; i++) {
            if ($scope.selectedEntity.attached_charge_codes[i].id === chargeCode.id) {
                $scope.selectedEntity.attached_charge_codes.splice(i, 1);
                return;
            }
        }
    };
    /**
     * function to show available charge code list on clicking the dropdown
     */
    $scope.showAvailableChargeCodes = function() {
        $scope.clearResults();
        displayFilteredResultsChargeCodes();
        $scope.showChargeCodes = !$scope.showChargeCodes;
    };

    /**
     * function to select charge code
     */
    $scope.addChargeCode = function() {
        for (var i = 0; i < $scope.availableChargeCodes.length; i++) {
            if ($scope.availableChargeCodes[i].id === $scope.chargeCodeToAdd) {
                for (var j = 0; j < $scope.selectedEntity.attached_charge_codes.length; j++) {

                    if ($scope.selectedEntity.attached_charge_codes[j].id === $scope.chargeCodeToAdd) {
                        return;
                    }
                }
                $scope.selectedEntity.attached_charge_codes.push($scope.availableChargeCodes[i]);
                $scope.refreshScroller('chargeCodes');
                return;
            }
        }
    };
    /**
     * function to select the charge code to be used in UI
     */
    $scope.selectChargeCode = function(selected_chargecode_id) {
        $scope.chargeCodeToAdd = selected_chargecode_id;
        $scope.addChargeCode();
        $scope.chargeCodeSearchText = '';
        $scope.showChargeCodes = false;
    };
    /**
     * function to fetch available charge code from the server
     */
    $scope.fetchAvailableChargeCodes = function() {

        var successCallback = function(data) {
            $scope.availableChargeCodes = data;
            $scope.fetchAvailableBillingGroups();
        };
        var errorCallback = function(errorMessage) {
            $scope.$parent.$emit('hideLoader');
            $scope.$emit('displayErrorMessage', errorMessage);
        };
        var data = {};

        data.id = $scope.reservationData.reservation_id;
        if ($scope.reservationData.reservation_id !== $scope.selectedEntity.id && $scope.selectedEntity.entity_type === 'RESERVATION') {
            data.to_bill = $scope.first_bill_id;
        }
        else {
            data.to_bill = $scope.selectedEntity.to_bill;
        }
        data.is_new = $scope.selectedEntity.is_new;
        // CICO-22444 - Added inorder to allow the same charge codes for different date range
        data.from_date = $filter('date')(tzIndependentDate($scope.routeDates.from), "yyyy-MM-dd");
        data.to_date = $filter('date')(tzIndependentDate($scope.routeDates.to), "yyyy-MM-dd");

        $scope.invokeApi(RVBillinginfoSrv.fetchAvailableChargeCodes, data, successCallback, errorCallback);
    };
    $scope.showPaymentOption = function() {
        return (!$scope.isAddPayment && $scope.showPayment && $scope.renderAddedPayment == null);
    };
    /**
     * function to fetch available billing groups from the server
     */
    $scope.fetchAvailableBillingGroups = function() {
        var successCallback = function(data) {
            $scope.availableBillingGroups = data;
            if (data.length === 0) {
                $scope.isBillingGroup = false;
            }
            if ($scope.selectedEntity.entity_type === "ALLOTMENT" || $scope.selectedEntity.entity_type === 'GROUP' || $scope.selectedEntity.entity_type === 'HOUSE') {
                $scope.showPayment = false;
                $scope.$parent.$emit('hideLoader');
            }
            else if ($scope.selectedEntity.entity_type === "COMPANY_CARD" || $scope.selectedEntity.entity_type === "TRAVEL_AGENT" ) {
                $scope.showPayment = true;
                $scope.isCompanyTravelAgent = true;
                $scope.accountId = $scope.selectedEntity.id;
                $scope.fetchAttachedPaymentTypes();
            }
            else if ($scope.reservationData.reservation_id !== $scope.selectedEntity.id && $scope.selectedEntity.entity_type === 'RESERVATION') {
                $scope.$parent.$emit('hideLoader');
            }
            else if ($scope.reservationData.reservation_id !== $scope.selectedEntity.id && $scope.selectedEntity.entity_type !== 'RESERVATION') {
                $scope.showPayment = true;
                $scope.attachedPaymentTypes = [];
                $scope.$parent.$emit('hideLoader');
            }
            else if ($scope.selectedEntity.has_accompanying_guests) {
                $scope.showPayment = true;
                $scope.$parent.$emit('hideLoader');
            }
            else {
                $scope.showPayment = true;
                $scope.fetchAttachedPaymentTypes();
            }

        };
        var errorCallback = function(errorMessage) {
            $scope.$parent.$emit('hideLoader');
            $scope.$emit('displayErrorMessage', errorMessage);
        };
        var data = {};

        data.id = $scope.reservationData.reservation_id;
        if ($scope.reservationData.reservation_id !== $scope.selectedEntity.id && $scope.selectedEntity.entity_type === 'RESERVATION') {
            data.to_bill = $scope.first_bill_id;
        }
        else {
            data.to_bill = $scope.selectedEntity.to_bill;
        }
        data.is_new = $scope.selectedEntity.is_new;

        // CICO-22444 - Added inorder to allow the same charge codes for different date range
        data.from_date = $filter('date')(tzIndependentDate($scope.routeDates.from), "yyyy-MM-dd");
        data.to_date = $filter('date')(tzIndependentDate($scope.routeDates.to), "yyyy-MM-dd");

        $scope.invokeApi(RVBillinginfoSrv.fetchAvailableBillingGroups, data, successCallback, errorCallback);
    };
    /**
     * function to fetch attached payment types from the server
     */
    $scope.fetchAttachedPaymentTypes = function() {
        var errorCallback = function(errorMessage) {
            $scope.$parent.$emit('hideLoader');
            $scope.$emit('displayErrorMessage', errorMessage);
        };

        if ($scope.isCompanyTravelAgent) {
            var successCallback = function(data) {
                $scope.attachedPaymentTypes = data.data;
                $scope.$parent.$emit('hideLoader');
                refreshScrollers();
            };

            $scope.invokeApi(RVCompanyCardSrv.fetchAccountPaymentData, $scope.accountId, successCallback, errorCallback);
        } else {
            var successCallback = function(data) {
                $scope.attachedPaymentTypes = data;
                $scope.$parent.$emit('hideLoader');
                refreshScrollers();
            };

            $scope.invokeApi(RVGuestCardSrv.fetchGuestPaymentData, $scope.reservationData.user_id, successCallback, errorCallback);

        }
        
    };

    /**
     * function to exclude bills for already existing routings
     */
    $scope.excludeExistingBills = function(bills) {

        for (var i = 0; i < $scope.routes.length; i++) {
            for (var j = 0; j < bills.length; j++) {
                if (bills[j].id === $scope.routes[i].to_bill && $scope.selectedEntity.id !== $scope.routes[i].id) {
                    bills.splice(j, 1);
                    break;
                }
            }
        }
        return bills;
    };
    /**
     * function to fetch available bills for the reservation from the server
     */
    $scope.fetchBillsForReservation = function() {
        var successCallback = function(data) {
            $scope.bills = [];
            $scope.$parent.bills = [];
            // TODO: commented to fix the issue

            $scope.first_bill_id = typeof data[0] !== "undefined" ? data[0].id : "";
            var firstBillId = typeof data[0] !== "undefined" ? data[0].id : "";

            $scope.newBillNumber = data.length + 1;
            if (typeof $scope.reservationData !== "undefined" && $scope.reservationData.reservation_id !== $scope.selectedEntity.id && $scope.selectedEntity.entity_type === 'RESERVATION') {
                $scope.bills.push(data[0]);
                $scope.bills = $scope.excludeExistingBills($scope.bills);
                $scope.$parent.bills = $scope.bills;
            } else {
                data.splice(0, 1);
                $scope.bills = $scope.excludeExistingBills(data);

                var newBill = {};

                newBill.id = 'new';
                newBill.is_active = true;
                newBill.bill_number = '' + $scope.newBillNumber + '(new)';
                $scope.bills.push(newBill);
                $scope.$parent.bills = $scope.bills;
            }
            $scope.selectedEntity.to_bill = $scope.selectedEntity.is_new ? $scope.bills[0].id : $scope.selectedEntity.to_bill;
            // We should display all charge codes here
            // TODO: verify the logic
            if ($scope.billingEntity === "GROUP_DEFAULT_BILLING" || $scope.billingEntity === "ALLOTMENT_DEFAULT_BILLING") {
                $scope.fetchAllChargeCodes();
                return;
            }

            // default to last item when there is no bill no.
            var billNo = $scope.selectedEntity.bill_no;

            if ($scope.selectedEntity.entity_type === 'ALLOTMENT' || $scope.selectedEntity.entity_type === 'GROUP' || $scope.selectedEntity.entity_type === 'HOUSE') {
                $scope.selectedEntity.to_bill = firstBillId;
            }
            else if (billNo === "") {
                $scope.selectedEntity.to_bill = _.last($scope.bills).id;
            }
            else {
                $scope.selectedEntity.to_bill = $scope.selectedEntity.to_bill;
            }
            $scope.fetchAvailableChargeCodes();
        };

        var errorCallback = function(errorMessage) {
            $scope.$parent.$emit('hideLoader');
            $scope.$emit('displayErrorMessage', errorMessage);
        };

        var id = typeof $scope.reservationData !== "undefined" ? $scope.reservationData.reservation_id : "";
        var entity_type = "";

        if ($scope.selectedEntity.entity_type === 'ALLOTMENT' || $scope.selectedEntity.entity_type === 'GROUP' || $scope.selectedEntity.entity_type === 'HOUSE') {
            id = $scope.selectedEntity.id;
            entity_type = $scope.selectedEntity.entity_type;
        }
        else if ($scope.selectedEntity.entity_type === 'RESERVATION') {
            id = $scope.selectedEntity.id;
        }
        var sendData = {"id": id, "entity_type": entity_type};

        $scope.invokeApi(RVBillinginfoSrv.fetchBillsForReservation, sendData, successCallback, errorCallback);
    };

    $scope.fetchDefaultAccountRouting = function() {

        var successCallback = function(data) {

            if ($scope.billingEntity !== "ALLOTMENT_DEFAULT_BILLING") {
                if (data.from_date) {
                    $scope.arrivalDate = data.from_date;
                    $scope.departureDate = data.to_date;
                }
                setRoutingDateOptions();
            }

            // CICO-19848: In case of allotment
            if (!$scope.selectedEntityChanged && data.charge_routes_recipient !== undefined) {
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

            $scope.selectedEntity.isBillingGroupsPresent = data.billing_groups.length > 0;

            if (data.credit_limit) {
                $scope.selectedEntity.credit_limit = parseFloat(data.credit_limit).toFixed(2);
            }

            $scope.selectedEntity.reference_number = data.reference_number;

            if (typeof $scope.selectedEntity.is_allow_direct_debit === 'undefined') {
                $scope.selectedEntity.is_allow_direct_debit = data.is_allow_direct_debit;
            }
            // Added for CICO-22869
            $scope.selectedEntity.attached_charge_codes = data.attached_charge_codes;
            $scope.selectedEntity.isChargeCodesPresent = data.attached_charge_codes.length > 0;
            if (!isEmptyObject(data.credit_card_details)) {
                $scope.renderAddedPayment = data.credit_card_details;
                $scope.saveData.payment_type = data.credit_card_details.payment_type;

                $scope.renderAddedPayment.cardExpiry = data.credit_card_details.card_expiry;
                $scope.renderAddedPayment.endingWith = data.credit_card_details.card_number;
                $scope.renderAddedPayment.creditCardType = data.credit_card_details.card_code;
                $scope.isAddPayment = false;
                if (data.credit_card_details.payment_type !== 'CC') {
                    $scope.showCreditCardDropDown = true;
                } else {
                    $scope.showCreditCardDropDown = false;
                    $scope.isShownExistingCCPayment = true;
                }
            }
            $scope.selectedEntity.split_charge_by_guests = data.split_charge_by_guests;
            $scope.$parent.$emit('hideLoader');
        };
        var params = {};

        params.id = $scope.selectedEntity.id;
        params.entity_type = $scope.selectedEntity.entity_type;
        if ($scope.billingEntity === "ALLOTMENT_DEFAULT_BILLING") {
            params.entity_type = "ALLOTMENT";
        }
        $scope.invokeApi(RVBillinginfoSrv.fetchDefaultAccountRouting, params, successCallback);
    };

    $scope.fetchAttachedPayments = function() {

        var successCallback = function(data) {
            $scope.attachedPaymentTypes = data.data;
            $scope.$parent.$emit('hideLoader');
        };
        var errorCallback = function(errorMessage) {
            $scope.$parent.$emit('hideLoader');
            $scope.$emit('displayErrorMessage', errorMessage);
        };

        $scope.invokeApi(RVCompanyCardSrv.fetchCompanyPaymentData, $scope.contactInformation.id, successCallback, errorCallback);
    };

    /**
     * function to fetch available billing groups from the server
     */
    $scope.fetchAllBillingGroups = function() {

        var successCallback = function(data) {
            $scope.availableBillingGroups = data;
            if (data.length === 0) {
                $scope.isBillingGroup = false;
            }
            $scope.$parent.$emit('hideLoader');
            $scope.fetchDefaultAccountRouting();
            $scope.fetchAttachedPayments();

        };
        var errorCallback = function(errorMessage) {
            $scope.$parent.$emit('hideLoader');
            $scope.$emit('displayErrorMessage', errorMessage);
        };

        $scope.invokeApi(RVBillinginfoSrv.fetchAllBillingGroups, '', successCallback, errorCallback);
    };

    $scope.fetchAllChargeCodes = function() {
        var successCallback = function(data) {
            $scope.availableChargeCodes = data;
            $scope.fetchAllBillingGroups();
        };
        var errorCallback = function(errorMessage) {
            $scope.$parent.$emit('hideLoader');
            $scope.$emit('displayErrorMessage', errorMessage);
        };

        $scope.invokeApi(RVBillinginfoSrv.fetchAllChargeCodes, '', successCallback, errorCallback);
    };

    if ($scope.billingEntity !== "TRAVEL_AGENT_DEFAULT_BILLING" &&
        $scope.billingEntity !== "COMPANY_CARD_DEFAULT_BILLING" &&
        $scope.billingEntity !== "GROUP_DEFAULT_BILLING" &&
        $scope.billingEntity !== "ALLOTMENT_DEFAULT_BILLING") {

        $scope.fetchBillsForReservation();
    }
    else {
        $scope.fetchAllChargeCodes();
    }
    if ($scope.billingEntity === "TRAVEL_AGENT_DEFAULT_BILLING" ||
        $scope.billingEntity === "COMPANY_CARD_DEFAULT_BILLING" ||
        $scope.billingEntity === "GROUP_DEFAULT_BILLING" ||
        $scope.billingEntity === "ALLOTMENT_DEFAULT_BILLING") {
        $scope.showPayment = true;
    }
    /**
     * function to trigger the filtering when the search text is entered
     */
    $scope.chargeCodeEntered = function() {
        $scope.showChargeCodes = false;
        displayFilteredResultsChargeCodes();
        var queryText = $scope.chargeCodeSearchText;

        $scope.chargeCodeSearchText = queryText.charAt(0).toUpperCase() + queryText.slice(1);
    };
    /**
     * function to clear the charge code search text
     */
    $scope.clearResults = function() {
        $scope.chargeCodeSearchText = "";
    };

    /**
     * function to perform filering on results.
     * if not fouund in the data, it will request for webservice
     */
    var displayFilteredResultsChargeCodes = function() {
        // if the entered text's length < 3, we will show everything, means no filtering
        if ($scope.chargeCodeSearchText.length < 3) {
            // based on 'is_row_visible' parameter we are showing the data in the template
            for (var i = 0; i < $scope.availableChargeCodes.length; i++) {
                if ($scope.isChargeCodeSelected($scope.availableChargeCodes[i])) {
                    $scope.availableChargeCodes[i].is_row_visible = false;
                    $scope.availableChargeCodes[i].is_selected = false;
                } else {
                    $scope.availableChargeCodes[i].is_row_visible = true;
                    $scope.availableChargeCodes[i].is_selected = true;
                }

            }
            $scope.refreshScroller('chargeCodesList');
            // we have changed data, so we are refreshing the scrollerbar

        }
        else {
            var value = "";
            // searching in the data we have, we are using a variable 'visibleElementsCount' to track matching
            // if it is zero, then we will request for webservice

            for (var i = 0; i < $scope.availableChargeCodes.length; i++) {
                value = $scope.availableChargeCodes[i];
                if ((($scope.escapeNull(value.code).toUpperCase()).indexOf($scope.chargeCodeSearchText.toUpperCase()) >= 0 ||
                    ($scope.escapeNull(value.description).toUpperCase()).indexOf($scope.chargeCodeSearchText.toUpperCase()) >= 0) && (!$scope.isChargeCodeSelected($scope.availableChargeCodes[i]))) {
                    $scope.availableChargeCodes[i].is_row_visible = true;
                }
                else {
                    $scope.availableChargeCodes[i].is_row_visible = false;
                }

            }

            $scope.refreshScroller('chargeCodesList');
        }
    };

    $scope.escapeNull = function(value, replaceWith) {
        return escapeNull(value, replaceWith);
    };
    /**
     * function to know if the charge code is selected, to adjust in UI
     */
    $scope.isChargeCodeSelected = function(chargeCode) {
        if (!!$scope.selectedEntity.attached_charge_codes) {
            for (var i = 0; i < $scope.selectedEntity.attached_charge_codes.length; i++) {
                if ($scope.selectedEntity.attached_charge_codes[i].id === chargeCode.id) {
                    return true;
                }
            }
        }
        return false;
    };

    /**
     * Listener for the save button click
     * @param {object} [JS event object]
     * @return {undefined}
     */
    var listener = $scope.$on('CALL_SAVE_ROUTE', function(event) {
        event.preventDefault();
        if (event.stopPropagation) {
            event.stopPropagation();
        }
        $scope.saveRoute();
    });
    
    // Destroying listener
    $scope.$on('$destroy', listener);
    /**
     * function to update the company and travel agent in stay card header
     */
    $scope.updateCardInfo = function() {

        if (($scope.selectedEntity.entity_type === 'COMPANY_CARD' && (typeof $scope.reservationDetails.companyCard.id === 'undefined' || $scope.reservationDetails.companyCard.id === '')) ||
            ($scope.selectedEntity.entity_type === 'TRAVEL_AGENT' && ($scope.reservationDetails.travelAgent.id === 'undefined' || $scope.reservationDetails.travelAgent.id === ''))) {
            $rootScope.$broadcast('CardInfoUpdated', $scope.selectedEntity.id, $scope.selectedEntity.entity_type);
        }
    };
    /**
     * function to save the new route
     */
    $scope.saveRoute = function() {
        if ($scope.selectedEntity.attached_charge_codes.length === 0 && $scope.selectedEntity.attached_billing_groups.length === 0) {
            $scope.$emit('displayErrorMessage', [$filter('translate')('ERROR_CHARGES_EMPTY')]);
            return;
        }
        if ($scope.billingEntity !== "TRAVEL_AGENT_DEFAULT_BILLING" &&
            $scope.billingEntity !== "COMPANY_CARD_DEFAULT_BILLING" &&
            $scope.billingEntity !== "GROUP_DEFAULT_BILLING" &&
            $scope.billingEntity !== "ALLOTMENT_DEFAULT_BILLING") {
            $scope.selectedEntity.reservation_id = $scope.reservationData.reservation_id;
        }

        if ($scope.billingEntity !== "TRAVEL_AGENT_DEFAULT_BILLING" && $scope.billingEntity !== "COMPANY_CARD_DEFAULT_BILLING" && $scope.billingEntity !== "ALLOTMENT_DEFAULT_BILLING") {
            $scope.selectedEntity.from_date = $filter('date')(tzIndependentDate($scope.routeDates.from), "yyyy-MM-dd");
            $scope.selectedEntity.to_date = $filter('date')(tzIndependentDate($scope.routeDates.to), "yyyy-MM-dd");
        }

        /*
         * If user selects the new bill option,
         * we'll first create the bill and then save the route for that bill
         */

        if ($scope.selectedEntity.to_bill === 'new') {
            $scope.createNewBill();
        }
        else if ($scope.saveData.payment_type !== null && $scope.saveData.payment_type !== "" && !$scope.isShownExistingCCPayment && !$scope.routeDetailsState.newCard) {
            $scope.savePayment();
        }
        else {
            saveRouteAPICall();
        }
    };

    var showLimitExceedPopup = function() {
        ngDialog.open({
            template: '/assets/partials/bill/rvBillingInfoCreditLimitExceededPopup.html',
            className: '',
            closeByDocument: false,
            scope: $scope
        });
    };

    var saveRouteAPICall = function() {

        $scope.saveSuccessCallback = function(data) {
            $scope.$parent.$emit('hideLoader');
            if ($scope.reservationBillData && data.bill_number) {
                $scope.reservationBillData.bills[data.bill_number - 1] = {
                    bill_id: data.id,
                    bill_number: data.bill_number,
                    total_amount: 0,
                    routed_entity_type: data.routed_entity_type,
                    guest_image: data.guest_image
                };
            }

            if (data.tax_exempt_warning !== null && data.tax_exempt_warning.length > 0) {
                var message = [];

                    message.push(data.tax_exempt_warning);
                $scope.$emit('displayErrorMessage', message);
            }
            
            if (data.has_crossed_credit_limit) {
                showLimitExceedPopup();
            }
            else {
                $scope.$parent.$emit('BILLINGINFOADDED');
                $scope.setReloadOption(true);
                $scope.headerButtonClicked();
                $scope.updateCardInfo();
                $scope.$parent.$emit('REFRESH_BILLCARD_VIEW');
            }
        };

        var errorCallback = function(errorMessage) {
            $scope.$parent.$emit('hideLoader');
            $scope.$emit('displayErrorMessage', errorMessage);
        };

        var defaultRoutingSaveSuccess = function() {
            $scope.$parent.$emit('hideLoader');
            $scope.$parent.$emit('BILLINGINFOADDED');
            ngDialog.close();
        };

        if ($scope.billingEntity === "TRAVEL_AGENT_DEFAULT_BILLING" ||
            $scope.billingEntity === "COMPANY_CARD_DEFAULT_BILLING" ||
            $scope.billingEntity === "GROUP_DEFAULT_BILLING" ||
            $scope.billingEntity === "ALLOTMENT_DEFAULT_BILLING") {

            var params = angular.copy($scope.selectedEntity);

            if ($scope.billingEntity === "GROUP_DEFAULT_BILLING" && ($scope.selectedEntity.entity_type === "GROUP" || $scope.selectedEntity.entity_type === "HOUSE")) {
                params.entity_type = $scope.selectedEntity.entity_type;
            }
            if ($scope.billingEntity === "ALLOTMENT_DEFAULT_BILLING") {
                params.entity_type = "ALLOTMENT";
                $scope.invokeApi(RVBillinginfoSrv.saveAllotmentDefaultAccountRouting, params, defaultRoutingSaveSuccess, errorCallback);
            } else {
                params.attached_payment_method_id = $scope.selectedEntity.selected_payment;
                $scope.invokeApi(RVBillinginfoSrv.saveDefaultAccountRouting, params, defaultRoutingSaveSuccess, errorCallback);
            }
        }
        else {
            // CICO-12797 workaround to meet the API expected params
            var params = angular.copy($scope.selectedEntity);

            $scope.invokeApi(RVBillinginfoSrv.saveRoute, params, $scope.saveSuccessCallback, errorCallback);
        }
    };

    $scope.hasPermissionToEditCreditLimit = function() {
        return rvPermissionSrv.getPermissionValue('OVERWRITE_DIRECT_BILL_MAXIMUM_AMOUNT');
    };

    /**
     * function to create new bill
     */
    $scope.createNewBill = function() {

        if ($scope.selectedEntity.entity_type === "ALLOTMENT" || $scope.selectedEntity.entity_type === "GROUP" || $scope.selectedEntity.entity_type === "HOUSE") {
            var data = {
                "entity_type": $scope.selectedEntity.entity_type,
                "entity_id": $scope.selectedEntity.id
            };
        }
        else {
            var data = {
                "reservation_id": $scope.reservationData.reservation_id
            };
        }
        /*
         * Success Callback of create bill action
         */
        var createBillSuccessCallback = function(data) {
            $scope.$emit('hideLoader');
            if ($scope.reservationBillData) {
                $scope.reservationBillData.bills[data.bill_number - 1] = {
                    bill_id: data.id,
                    bill_number: data.bill_number,
                    total_amount: 0
                };
            }
            
            $scope.selectedEntity.to_bill = data.id;
            $scope.bills[$scope.bills.length - 1].id = data.id;
            $scope.bills[$scope.bills.length - 1].bill_number = data.bill_number;
            if ($scope.saveData.payment_type !== null && $scope.saveData.payment_type !== "") {
                $scope.savePayment();
            } else {
                saveRouteAPICall();
            }

        };

        $scope.invokeApi(RVBillCardSrv.createAnotherBill, data, createBillSuccessCallback, $scope.errorCallback);
    };

    var retrieveCardName = function() {
        var cardName = (!$scope.cardData.tokenDetails.isSixPayment) ?
            $scope.cardData.cardDetails.userName :
            ($scope.passData.details.firstName + " " + $scope.passData.details.lastName);

        return cardName;
    };

    var retrieveCardExpiryForApi = function() {
        var expiryMonth = $scope.cardData.tokenDetails.isSixPayment ? $scope.cardData.tokenDetails.expiry.substring(2, 4) : $scope.cardData.cardDetails.expiryMonth;
        var expiryYear = $scope.cardData.tokenDetails.isSixPayment ? $scope.cardData.tokenDetails.expiry.substring(0, 2) : $scope.cardData.cardDetails.expiryYear;
        var expiryDate = (expiryMonth && expiryYear ) ? ("20" + expiryYear + "-" + expiryMonth + "-01") : "";

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

        if ($scope.reservationData !== undefined) {
            if ($scope.reservationData.reservation_id !== null) {
                $scope.savePaymentToReservationOrAccount('reservation');
            }
            else if ($scope.billingEntity === "TRAVEL_AGENT_DEFAULT_BILLING" || $scope.billingEntity === "COMPANY_CARD_DEFAULT_BILLING") {
                $scope.savePaymentToReservationOrAccount('companyOrTA');
            }
            else if ($scope.billingEntity === "GROUP_DEFAULT_BILLING") {
                $scope.savePaymentToReservationOrAccount('account');
            }
            else if ($scope.billingEntity === "ALLOTMENT_DEFAULT_BILLING") {
                $scope.savePaymentToReservationOrAccount('allotment');
            }
            else {
                saveRouteAPICall();
            }
        }
        else if ($scope.billingEntity === "TRAVEL_AGENT_DEFAULT_BILLING" || $scope.billingEntity === "COMPANY_CARD_DEFAULT_BILLING") {
            $scope.savePaymentToReservationOrAccount('companyOrTA');
        }
        else if ($scope.billingEntity === "GROUP_DEFAULT_BILLING") {
            $scope.savePaymentToReservationOrAccount('account');
        }
        else if ($scope.billingEntity === "ALLOTMENT_DEFAULT_BILLING") {
            $scope.savePaymentToReservationOrAccount('allotment');
        }
        else {
            saveRouteAPICall();
        }

    };
    $scope.savePaymentToReservationOrAccount = function(toReservationOrAccount) {

        $scope.saveSuccessCallback = function(data) {
            $scope.$parent.$emit('hideLoader');
            if (data.has_crossed_credit_limit) {
                showLimitExceedPopup();
            }
            else {
                $scope.setReloadOption(true);
                $scope.headerButtonClicked();
                $scope.$parent.$emit('BILLINGINFOADDED');
                // Added for CICO-23210
                $scope.$parent.$emit('REFRESH_BILLCARD_VIEW');
            }
            if ($scope.reservationBillData && data.bill_number) {
                $scope.reservationBillData.bills[data.bill_number - 1] = {
                    bill_id: data.id,
                    bill_number: data.bill_number,
                    total_amount: 0,
                    routed_entity_type: data.routed_entity_type,
                    guest_image: data.guest_image
                };
            }
        };
        $scope.errorCallback = function(errorMessage) {
            $scope.$parent.$emit('hideLoader');
            $scope.$emit('displayErrorMessage', errorMessage);
        };
        var defaultRoutingSaveSuccess = function() {
            $scope.$parent.$emit('hideLoader');
            $scope.$parent.$emit('BILLINGINFOADDED');
            ngDialog.close();
        };
        var successCallback = function(data) {
            $scope.$parent.$emit('hideLoader');
            if ($scope.billingEntity === "TRAVEL_AGENT_DEFAULT_BILLING" ||
                $scope.billingEntity === "COMPANY_CARD_DEFAULT_BILLING" ||
                $scope.billingEntity === "GROUP_DEFAULT_BILLING" ||
                $scope.billingEntity === "ALLOTMENT_DEFAULT_BILLING") {
                var params = angular.copy($scope.selectedEntity);

                if ($scope.billingEntity === "ALLOTMENT_DEFAULT_BILLING") {
                    params.entity_type = "ALLOTMENT";
                    $scope.invokeApi(RVBillinginfoSrv.saveAllotmentDefaultAccountRouting, params, defaultRoutingSaveSuccess, $scope.errorCallback);
                } else {
                    $scope.invokeApi(RVBillinginfoSrv.saveDefaultAccountRouting, params, defaultRoutingSaveSuccess, $scope.errorCallback);
                }
            }
            else {
                $scope.invokeApi(RVBillinginfoSrv.saveRoute, $scope.selectedEntity, $scope.saveSuccessCallback, $scope.errorCallback);
            }
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

            if (toReservationOrAccount === "reservation") {
                data.reservation_id = $scope.reservationData.reservation_id;
            }
            else if (toReservationOrAccount === "companyOrTA") {
                data.account_id = $scope.selectedEntity.id;
            }
            else if (toReservationOrAccount === "allotment") {
                data.allotment_id = $scope.selectedEntity.allotment_id;
            }
            else {
                data.group_id = $scope.selectedEntity.id;
            }
            $scope.invokeApi(RVPaymentSrv.savePaymentDetails, data, successCallback, errorCallback);
        };

        if ($scope.saveData.payment_type === 'CC') {
            if ($rootScope.paymentGateway === "sixpayments" && !$scope.sixIsManual) {

                var data = {};

                if (toReservationOrAccount === "reservation") {
                    data.reservation_id = $scope.reservationData.reservation_id;
                }
                else if (toReservationOrAccount === "companyOrTA") {
                    data.account_id = $scope.selectedEntity.id;
                }
                else if (toReservationOrAccount === "allotment") {
                    data.allotment_id = $scope.selectedEntity.allotment_id;
                }
                else {
                    data.group_id = $scope.selectedEntity.id;
                }

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

                if (toReservationOrAccount === "reservation") {
                    data.reservation_id = $scope.reservationData.reservation_id;
                }
                else if (toReservationOrAccount === "companyOrTA") {
                    data.account_id = $scope.selectedEntity.id;
                }
                else if (toReservationOrAccount === "allotment") {
                    data.allotment_id = $scope.selectedEntity.allotment_id;
                }
                else {
                    data.group_id = $scope.selectedEntity.id;
                }
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

                if (toReservationOrAccount === "reservation") {
                    data.reservation_id = $scope.reservationData.reservation_id;
                }
                else if (toReservationOrAccount === "companyOrTA") {
                    data.account_id = $scope.selectedEntity.id;
                }
                else if (toReservationOrAccount === "allotment") {
                    data.allotment_id = $scope.selectedEntity.allotment_id;
                }
                else {
                    data.group_id = $scope.selectedEntity.id;
                }
                data.payment_type = $scope.saveData.payment_type;
                creditCardType = (!$scope.cardData.tokenDetails.isSixPayment) ?
                    getCreditCardType($scope.cardData.cardDetails.cardType) :
                    getSixCreditCardType($scope.cardData.tokenDetails.card_type).toLowerCase();
                data.token = (!$scope.cardData.tokenDetails.isSixPayment) ? $scope.cardData.tokenDetails.session : $scope.cardData.tokenDetails.token_no;
                data.card_name = retrieveCardName();
                data.bill_number = $scope.getSelectedBillNumber();
                data.card_expiry = retrieveCardExpiryForApi();
                data.card_code = (!$scope.cardData.tokenDetails.isSixPayment) ?
                    $scope.cardData.cardDetails.cardType :
                    getSixCreditCardType($scope.cardData.tokenDetails.card_type).toLowerCase();
                $scope.invokeApi(RVPaymentSrv.savePaymentDetails, data, successCallback, errorCallback);
            }
        }
        else {
            var data = {
                "payment_type": $scope.saveData.payment_type
            };

            if (toReservationOrAccount === "reservation") {
                data.reservation_id = $scope.reservationData.reservation_id;
            }
            else if (toReservationOrAccount === "companyOrTA") {
                data.account_id = $scope.selectedEntity.id;
            }
            else if (toReservationOrAccount === "allotment") {
                data.allotment_id = $scope.selectedEntity.allotment_id;
            }
            else {
                data.group_id = $scope.selectedEntity.id;
            }
            data.bill_number = $scope.getSelectedBillNumber();
            $scope.invokeApi(RVPaymentSrv.savePaymentDetails, data, successCallback, errorCallback);
        }
    };
    /**
     * function to get selected bill number
     */
    $scope.getSelectedBillNumber = function() {
        for (var i = 0; i < $scope.bills.length; i++) {
            if (parseInt($scope.bills[i].id) === parseInt($scope.selectedEntity.to_bill)) {
                return $scope.bills[i].bill_number;
            }
        }
    };

    $scope.shouldHideSplitCharge = function() {
        return $scope.isHourlyRateOn || $scope.billingEntity === 'GROUP_DEFAULT_BILLING' || $scope.selectedEntity.entity_type === 'GROUP' || $scope.billingEntity === 'TRAVEL_AGENT_DEFAULT_BILLING' || $scope.billingEntity === 'COMPANY_CARD_DEFAULT_BILLING' || $scope.billingEntity === 'ALLOTMENT_DEFAULT_BILLING';
    };
    $scope.sixIsManual = false;
    $scope.$on('CHANGE_IS_MANUAL', function(e, value) {
        $scope.sixIsManual = value;
    });

    var setDefaultRoutingDates = function() {
        if ($scope.billingEntity == "GROUP_DEFAULT_BILLING") {
            $scope.arrivalDate = $filter('date')(tzIndependentDate($scope.groupConfigData.summary.block_from), "yyyy-MM-dd");
            $scope.departureDate = $scope.groupConfigData.summary.block_to;
        }
        $scope.arrivalDate = $rootScope.businessDate > $scope.arrivalDate ? $rootScope.businessDate : $scope.arrivalDate;
    };

    var setRoutingDateOptions = function() {
        if ($scope.billingEntity == "GROUP_DEFAULT_BILLING") {
            $scope.routeDates = {
                from: $scope.arrivalDate,
                to: $scope.departureDate
            };

            $scope.routingDateFromOptions = {
                dateFormat: $rootScope.jqDateFormat,
                minDate: tzIndependentDate($scope.groupConfigData.summary.block_from),
                maxDate: tzIndependentDate($scope.groupConfigData.summary.block_to)
            };

            $scope.routingDateToOptions = {
                dateFormat: $rootScope.jqDateFormat,
                minDate: tzIndependentDate($scope.groupConfigData.summary.block_from),
                maxDate: tzIndependentDate($scope.groupConfigData.summary.block_to)
            };
        }
    };

    // Updates the charge codes and billing groups upon changing the route date range
    $scope.onRouteDateChange = function() {
        $scope.fetchAvailableChargeCodes();
    };

    $scope.$on("PAYMENT_SAVE_CARD_SUCCESS", function() {
        refreshScrollers();
        $scope.selectedPayment = "";
    });

    $scope.$on("PAYMENT_TYPE_CHANGED", function() {
        setTimeout(refreshScrollers, 300);
    });

    $scope.shouldShowSplitChargeAccompanyGuests = function() {
        return $scope.billingEntity === 'GROUP_DEFAULT_BILLING';
    };

}]);
