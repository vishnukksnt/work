'use strict';

sntRover.controller('rvBillFormatPopupCtrl', ['$scope', '$rootScope', '$filter', 'RVBillCardSrv', 'RVContactInfoSrv', 'ngDialog', '$timeout', function ($scope, $rootScope, $filter, RVBillCardSrv, RVContactInfoSrv, ngDialog, $timeout) {

    var delay = 200,
        delayScreen = 500;

    BaseCtrl.call(this, $scope);
    $scope.isCompanyCardInvoice = true;
    $scope.disableCompanyCardInvoice = false;
    $scope.disableCompanyGuestToggle = false;
    $scope.hideCompanyCardInvoiceToggle = true;
    $scope.billFormat.isInformationalInvoice = !$scope.shouldGenerateFinalInvoice && $scope.isSettledBill && $scope.reservationBillData.is_bill_lock_enabled;
    $scope.billFormat.isInformationalInvoiceDisabled = $scope.isSettledBill && $scope.reservationBillData.is_bill_lock_enabled;
    $scope.disableToggleAccount = false;
    /*
    *  Get the request params for bill settings info
    */
    var getBillSettingsInfoRequestParams = function getBillSettingsInfoRequestParams() {
        var params = {};

        if ($scope.reservationBillData && $scope.reservationBillData.reservation_id) {
            params.id = $scope.reservationBillData.reservation_id;
            params.is_type = "Reservation";
        } else {
            $scope.hideCompanyCardInvoiceToggle = false;
            if ($scope.isFromInvoiceSearchScreen) {
                if ($scope.clickedInvoiceData.associated_item.company_card === null && $scope.clickedInvoiceData.associated_item.travel_agent_card === null) {
                    $scope.hideCompanyCardInvoiceToggle = true;
                } else if ($scope.clickedInvoiceData.associated_item.company_card === null && $scope.clickedInvoiceData.associated_item.travel_agent_card !== null) {
                    // Only TA card is attached.
                    $scope.isCompanyCardInvoice = false;
                    $scope.disableCompanyCardInvoice = true;
                } else if ($scope.clickedInvoiceData.associated_item.company_card !== null && $scope.clickedInvoiceData.associated_item.travel_agent_card === null) {
                    // Only Company card is attached.
                    $scope.disableCompanyCardInvoice = true;
                }
            }
            if (!!$scope.groupConfigData) {
                params.id = $scope.groupConfigData.summary.group_id;
                params.is_group = true;
                params.is_type = "Account";
                handleGenerateToggleWidgetVisibility($scope.groupConfigData.summary);
            } else {
                params.id = $scope.accountConfigData ? $scope.accountConfigData.summary.posting_account_id : $scope.clickedInvoiceData.associated_item.item_id;
                params.is_group = false;
                params.is_type = "Account";
                if ($scope.accountConfigData) {
                    handleGenerateToggleWidgetVisibility($scope.accountConfigData.summary);
                }
            }
        }
        params.bill_no = $scope.billNo;

        return params;
    };

    /*
     * To close dialog box
     */
    $scope.closeDialog = function () {

        $rootScope.modalOpened = false;
        $timeout(function () {
            ngDialog.close();
        }, delay);
    };
    /**
     * handles Generate toggle visibilty
     * @return none
     */
    var handleGenerateToggleWidgetVisibility = function handleGenerateToggleWidgetVisibility(card) {
        if (!isEmpty(card.company) && !isEmpty(card.travel_agent)) {
            // Both cards are attached.
        } else if (isEmpty(card.company) && isEmpty(card.travel_agent)) {
            // Both cards are not attached.
            $scope.hideCompanyCardInvoiceToggle = true;
        } else if (!isEmpty(card.company) && isEmpty(card.travel_agent)) {
            // Only Company card is attached.
            $scope.isCompanyCardInvoice = true;
            $scope.disableCompanyCardInvoice = true;
        } else {
            $scope.isCompanyCardInvoice = false;
            // Only TA card is attached.
            $scope.disableCompanyCardInvoice = true;
        }
    },
        isEmpty = function isEmpty(str) {
        return !str || 0 === str.length;
    };

    var successCallBackForLanguagesFetch = function successCallBackForLanguagesFetch(data) {
        $scope.$emit('hideLoader');
        if (data.languages) {
            data.languages = _.filter(data.languages, {
                is_show_on_guest_card: true
            });
        }
        $scope.languageData = data;
        $scope.data.locale = data.selected_language_code;
    };

    /**
     * Fetch the guest languages list and settings
     * @return {undefined}
     */
    var fetchGuestLanguages = function fetchGuestLanguages() {
        var params = {};

        if ($scope.reservationBillData && $scope.reservationBillData.reservation_id) {
            params.reservation_id = $scope.reservationBillData.reservation_id;
        }
        // call api
        $scope.invokeApi(RVContactInfoSrv.fetchGuestLanguages, params, successCallBackForLanguagesFetch);
    };

    /*
    *  Fetches the bill settings info for the guest/account bills
    */
    var fetchBillSettingsInfo = function fetchBillSettingsInfo() {
        var params = getBillSettingsInfoRequestParams();
        var onBillSettingsInfoFetchSuccess = function onBillSettingsInfoFetchSuccess(response) {

            fetchGuestLanguages();
            /** CICO-38736
             *
             * The default_bill_settings in the response defaults to numeric 1, the value of which is a string otherwise
             * Hence, we cast the value as a string
             *
             */
            if (response.data && response.data.default_bill_settings) {
                response.data.default_bill_settings = response.data.default_bill_settings.toString();
            }
            /** CICO-80096
             * Disable the invoice company/TA toggle based on the direct bill settlement account type 
             */
            var dbAccountType = response.data && response.data.bill_paid_account_type;

            if (dbAccountType === 'COMPANY') {
                $scope.isCompanyCardInvoice = true;
                $scope.disableToggleAccount = true;
            } else if (dbAccountType === 'TRAVELAGENT') {
                $scope.isCompanyCardInvoice = false;
                $scope.disableToggleAccount = true;
            }

            $scope.data = response.data;
            $scope.setEmailAddress();
        };

        $scope.invokeApi(RVBillCardSrv.getBillSettingsInfo, params, onBillSettingsInfoFetchSuccess);
    };

    /*
    *  Get the request params for the email and print bill request
    */
    var getPrintEmailRequestParams = function getPrintEmailRequestParams() {
        var params = {};

        if ($scope.reservationBillData && $scope.reservationBillData.reservation_id) {
            params.reservation_id = $scope.reservationBillData.reservation_id;
        } else {
            if (!!$scope.groupConfigData) {
                params.group_id = $scope.groupConfigData.summary.group_id;
                params.is_group = true;
            } else {
                params.account_id = $scope.isFromInvoiceSearchScreen ? $scope.clickedInvoiceData.associated_item.item_id : $scope.accountConfigData.summary.posting_account_id;
                params.is_group = false;
            }
            params.type = $scope.isCompanyCardInvoice ? 'COMPANY' : 'TRAVELAGENT';
        }
        params.bill_number = $scope.billNo;
        params.locale = $scope.data.locale;
        $scope.$emit('hideLoader');
        return params;
    };

    /*
     *  Function which get invoked when the print btn from bill format popup is clicked
     */
    $scope.printBill = function () {
        var printRequest = getPrintEmailRequestParams();

        $scope.$emit("UPDATE_INFORMATIONAL_INVOICE", $scope.billFormat.isInformationalInvoice);
        printRequest.bill_layout = $scope.data.default_bill_settings;
        printRequest.is_informational_invoice = $scope.billFormat.isInformationalInvoice;
        $scope.clickedPrint(printRequest);
    };

    /*
     * click action Continue button
     *
     */
    $scope.clickedContinueButtonPrintOrEmail = function () {
        if ($scope.isClickedPrint) {
            $scope.printBill();
        } else {
            $scope.sendEmail();
        }
    };
    /*
     * click action Print button
     * show proceed popup - if infrasec enabled
     */
    $scope.clickedPrintBill = function () {
        if ($scope.shouldGenerateFinalInvoice && !$scope.billFormat.isInformationalInvoice) {
            $scope.isClickedPrint = true;
            $scope.isInvoiceStepThreeActive = false;

            $timeout(function () {
                $scope.isInvoiceStepFourActive = true;
            }, delayScreen);
        } else {
            $scope.printBill();
        }
    };

    $scope.sendEmail = function () {
        var emailRequest = getPrintEmailRequestParams();

        emailRequest.bill_layout = $scope.data.default_bill_settings;
        emailRequest.to_address = $scope.data.mailto_address;
        emailRequest.is_informational_invoice = $scope.billFormat.isInformationalInvoice;
        $scope.clickedEmail(emailRequest);
    };

    /*
    *  Function which get invoked when the email btn from bill format popup is clicked
    */
    $scope.emailBill = function () {

        if ($scope.shouldGenerateFinalInvoice && !$scope.billFormat.isInformationalInvoice) {
            $scope.isClickedPrint = false;
            $scope.isInvoiceStepThreeActive = false;

            $timeout(function () {
                $scope.isInvoiceStepFourActive = true;
            }, delayScreen);
        } else {
            $scope.sendEmail();
        }
    };
    /*
     * Clicked final invoice button - initial popup
     */
    $scope.clickedFinalInvoiceButton = function () {
        $scope.isInvoiceStepOneActive = false;
        $timeout(function () {
            $scope.isInvoiceStepTwoActive = true;
        }, delayScreen);
    };
    /*
     * Clicked Proceed button
     */
    $scope.clickedProceedButton = function () {
        $scope.isInvoiceStepTwoActive = false;
        $scope.isInvoiceStepFourActive = false;

        $timeout(function () {
            $scope.isInvoiceStepThreeActive = true;
        }, delayScreen);
    };
    /*
     * Clicked cancel button of proceed screen
     */
    $scope.clickedCancelButtonProceedScreen = function () {
        $scope.isInvoiceStepTwoActive = false;

        $timeout(function () {
            $scope.isInvoiceStepOneActive = true;
        }, delayScreen);
    };

    /*
     * Once print done show the popup of success message
     */
    var updateWindow = $scope.$on("UPDATE_WINDOW", function () {
        $scope.isInvoiceStepFourActive = false;

        $timeout(function () {
            $scope.isInvoiceStepFiveActive = true;
        }, delayScreen);
    });

    /*
     * Function to get print button class
     */
    $scope.getPrintButtonClass = function () {

        var printButtonClass = "blue";

        if (!$scope.billFormat.isInformationalInvoice && parseInt($scope.reservationBillData.bills[$scope.currentActiveBill].print_counter, 10) >= parseInt($scope.reservationBillData.no_of_original_invoices, 10) && $scope.roverObj.noReprintReEmailInvoice && parseInt($scope.reservationBillData.no_of_original_invoices, 10) !== 0) {

            printButtonClass = "grey";
        }

        return printButtonClass;
    };
    /*
     * Function to get print button class
     */
    $scope.isPrintButtonDisabled = function () {

        var isPrintButtonDisabled = false;

        if (!$scope.billFormat.isInformationalInvoice && parseInt($scope.reservationBillData.bills[$scope.currentActiveBill].print_counter, 10) >= parseInt($scope.reservationBillData.no_of_original_invoices, 10) && $scope.roverObj.noReprintReEmailInvoice && parseInt($scope.reservationBillData.no_of_original_invoices, 10) !== 0) {

            isPrintButtonDisabled = true;
        }
        return isPrintButtonDisabled;
    };

    /*
     * Function to get email button class
     */
    $scope.getEmailButtonClass = function () {

        var emailButtonClass = "blue";

        if (!$scope.data.mailto_address) {
            emailButtonClass = "grey";
        } else if (!$scope.billFormat.isInformationalInvoice && parseInt($scope.reservationBillData.bills[$scope.currentActiveBill].email_counter, 10) >= parseInt($scope.reservationBillData.no_of_original_emails, 10) && $scope.roverObj.noReprintReEmailInvoice && parseInt($scope.reservationBillData.no_of_original_invoices, 10) !== 0) {

            emailButtonClass = "grey";
        }
        return emailButtonClass;
    };
    /*
     * Function to get email button disabled or not
     */
    $scope.isEmailButtonDisabled = function () {

        var isEmailButtonDisabled = false;

        if (!$scope.data.mailto_address) {
            isEmailButtonDisabled = true;
        } else if (!$scope.billFormat.isInformationalInvoice && parseInt($scope.reservationBillData.bills[$scope.currentActiveBill].email_counter, 10) >= parseInt($scope.reservationBillData.no_of_original_emails, 10) && $scope.roverObj.noReprintReEmailInvoice && parseInt($scope.reservationBillData.no_of_original_invoices, 10) !== 0) {

            isEmailButtonDisabled = true;
        }
        return isEmailButtonDisabled;
    };

    $scope.clickedInformationalButton = function () {
        $scope.billFormat.isInformationalInvoice = true;
        $scope.isInvoiceStepOneActive = false;

        $timeout(function () {
            $scope.isInvoiceStepThreeActive = true;
        }, delayScreen);
    };

    /*
    *  Set email address to send invoice, according to cards attached.
    */
    $scope.setEmailAddress = function () {
        if ($scope.isCompanyCardInvoice) {
            $scope.data.mailto_address = $scope.data.company_address ? $scope.data.company_address : $scope.data.to_address;
        } else {
            $scope.data.mailto_address = $scope.data.travel_agent_address ? $scope.data.travel_agent_address : $scope.data.to_address;
        }
    };

    /*
    *  Initialize the controller
    */
    var init = function init() {
        $scope.data = {};
        fetchBillSettingsInfo();
    };
    // Toggle on COMPANY/TA-CARD invoice generation tab.

    $scope.changeCompanyCardInvoiceToggle = function () {
        $scope.isCompanyCardInvoice = !$scope.isCompanyCardInvoice;
        $scope.setEmailAddress();
    };

    $scope.$on('$destroy', updateWindow);

    init();
}]);