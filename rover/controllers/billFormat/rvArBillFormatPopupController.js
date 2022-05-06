'use strict';

sntRover.controller('rvArBillFormatPopupCtrl', ['$scope', '$rootScope', '$filter', 'RVBillCardSrv', 'RVContactInfoSrv', 'rvAccountsArTransactionsSrv', 'ngDialog', '$timeout', function ($scope, $rootScope, $filter, RVBillCardSrv, RVContactInfoSrv, rvAccountsArTransactionsSrv, ngDialog, $timeout) {

    var delay = 200,
        delayScreen = 500;

    BaseCtrl.call(this, $scope);
    $scope.isCompanyCardInvoice = true;
    $scope.disableCompanyCardInvoice = false;
    $scope.hideCompanyCardInvoiceToggle = true;
    $scope.billFormat.isInformationalInvoice = !$scope.shouldGenerateFinalInvoice;
    $scope.billFormat.isInformationalInvoiceDisabled = !$scope.disableInformationCheckBox;
    /*
    *  Get the request params for bill settings info
    */
    var getBillSettingsInfoRequestParams = function getBillSettingsInfoRequestParams() {
        var params = {};

        params.is_type = "ArAccount";
        params.id = $scope.item.transaction_id;
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

    var successCallBackForLanguagesFetch = function successCallBackForLanguagesFetch(data) {
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
        var options = {
            params: {},
            successCallBack: successCallBackForLanguagesFetch
        };

        $scope.callAPI(RVContactInfoSrv.fetchGuestLanguages, options);
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

            $scope.data = response.data;
            $scope.setEmailAddress();
        };

        var options = {
            params: params,
            successCallBack: onBillSettingsInfoFetchSuccess
        };

        $scope.callAPI(RVBillCardSrv.getBillSettingsInfo, options);
    };

    /*
    *  Get the request params for the email and print bill request
    */
    var getPrintEmailRequestParams = function getPrintEmailRequestParams() {
        var params = {};

        params.id = $scope.item.transaction_id;
        params.account_id = $scope.arTransactionsData.accountId;
        params.locale = $scope.data.locale;
        return params;
    };

    /*
     *  Function which get invoked when the print btn from bill format popup is clicked
     */
    $scope.printBill = function (is_locked) {
        var printRequest = getPrintEmailRequestParams();

        printRequest.is_locked = is_locked;
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
        var data = {},
            is_locked = false;

        data.id = $scope.item.transaction_id;
        data.account_id = $scope.arTransactionsData.accountId;
        var lockBillSuccess = function lockBillSuccess() {
            if ($scope.is_bill_lock_enabled) {
                is_locked = true;
            }
            if ($scope.isClickedPrint) {
                $scope.printBill(is_locked);
            } else {
                $scope.sendEmail(is_locked);
            }
        },
            lockBillFailureCallback = function lockBillFailureCallback(errorData) {
            is_locked = false;
            $scope.errorMessage = errorData;
        },
            options = {
            params: data,
            successCallBack: lockBillSuccess,
            failureCallBack: lockBillFailureCallback
        };

        $scope.callAPI(rvAccountsArTransactionsSrv.lockBill, options);
    };
    /*
     * click action Print button
     * show proceed popup - if infrasec enabled
     */
    $scope.clickedPrintBill = function () {
        if ($scope.shouldGenerateFinalInvoice && !$scope.billFormat.isInformationalInvoice && !$scope.item.is_locked) {
            $scope.isClickedPrint = true;
            $scope.isInvoiceStepThreeActive = false;

            $timeout(function () {
                $scope.isInvoiceStepFourActive = true;
            }, delayScreen);
        } else {
            $scope.printBill();
        }
    };

    $scope.sendEmail = function (is_locked) {
        var emailRequest = getPrintEmailRequestParams();

        emailRequest.is_locked = is_locked;
        emailRequest.bill_layout = $scope.data.default_bill_settings;
        emailRequest.to_address = $scope.data.mailto_address;
        emailRequest.is_informational_invoice = $scope.billFormat.isInformationalInvoice;
        $scope.clickedEmail(emailRequest);
    };

    /*
    *  Function which get invoked when the email btn from bill format popup is clicked
    */
    $scope.emailBill = function () {
        if ($scope.shouldGenerateFinalInvoice && !$scope.billFormat.isInformationalInvoice && !$scope.item.is_locked) {
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
            if (!$scope.item.is_locked) {
                $scope.isInvoiceStepFiveActive = true;
            }
        }, delayScreen);
    });

    /*
     * Function to get print button class
     */
    $scope.getPrintButtonClass = function () {
        var printButtonClass = "blue";

        if (parseInt($scope.item.print_counter, 10) === 0 && parseInt($scope.transactionsDetails.no_of_original_invoices, 10) === 0 && $scope.roverObj.noReprintReEmailInvoice) {
            printButtonClass = "blue";
        } else if (!$scope.billFormat.isInformationalInvoice && parseInt($scope.item.print_counter, 10) > 0 && parseInt($scope.transactionsDetails.no_of_original_invoices, 10) === 0 && $scope.roverObj.noReprintReEmailInvoice) {

            printButtonClass = "grey";
        } else if (!$scope.billFormat.isInformationalInvoice && parseInt($scope.item.print_counter, 10) >= parseInt($scope.transactionsDetails.no_of_original_invoices, 10) && $scope.roverObj.noReprintReEmailInvoice) {

            printButtonClass = "grey";
        }

        return printButtonClass;
    };
    /*
     * Function to get print button class
     */
    $scope.isPrintButtonDisabled = function () {
        var isPrintButtonDisabled = false;

        if (parseInt($scope.item.print_counter, 10) === 0 && parseInt($scope.transactionsDetails.no_of_original_invoices, 10) === 0 && $scope.roverObj.noReprintReEmailInvoice) {
            isPrintButtonDisabled = false;
        } else if (!$scope.billFormat.isInformationalInvoice && parseInt($scope.item.print_counter, 10) > 0 && parseInt($scope.transactionsDetails.no_of_original_invoices, 10) === 0 && $scope.roverObj.noReprintReEmailInvoice) {

            isPrintButtonDisabled = true;
        } else if (!$scope.billFormat.isInformationalInvoice && parseInt($scope.item.print_counter, 10) >= parseInt($scope.transactionsDetails.no_of_original_invoices, 10) && $scope.roverObj.noReprintReEmailInvoice) {

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
        } else if (parseInt($scope.item.email_counter, 10) === 0 && parseInt($scope.transactionsDetails.no_of_original_emails, 10) === 0 && $scope.roverObj.noReprintReEmailInvoice) {
            emailButtonClass = "blue";
        } else if (!$scope.billFormat.isInformationalInvoice && parseInt($scope.item.email_counter, 10) > 0 && parseInt($scope.transactionsDetails.no_of_original_emails, 10) === 0 && $scope.roverObj.noReprintReEmailInvoice) {

            emailButtonClass = "grey";
        } else if (!$scope.billFormat.isInformationalInvoice && parseInt($scope.item.email_counter, 10) >= parseInt($scope.transactionsDetails.no_of_original_emails, 10) && $scope.roverObj.noReprintReEmailInvoice && parseInt($scope.transactionsDetails.no_of_original_emails, 10) !== 0) {

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
        } else if (parseInt($scope.item.email_counter, 10) === 0 && parseInt($scope.transactionsDetails.no_of_original_emails, 10) === 0 && $scope.roverObj.noReprintReEmailInvoice) {
            isEmailButtonDisabled = false;
        } else if (!$scope.billFormat.isInformationalInvoice && parseInt($scope.item.email_counter, 10) > 0 && parseInt($scope.transactionsDetails.no_of_original_emails, 10) === 0 && $scope.roverObj.noReprintReEmailInvoice) {

            isEmailButtonDisabled = true;
        } else if (!$scope.billFormat.isInformationalInvoice && parseInt($scope.item.email_counter, 10) >= parseInt($scope.transactionsDetails.no_of_original_emails, 10) && $scope.roverObj.noReprintReEmailInvoice && parseInt($scope.transactionsDetails.no_of_original_emails, 10) !== 0) {

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
    };
    $scope.$on('$destroy', updateWindow);

    init();
}]);