'use strict';

sntRover.controller('RVReceiptPopupController', ['$scope', '$rootScope', 'RVBillCardSrv', 'RVContactInfoSrv', 'ngDialog', '$filter', function ($scope, $rootScope, RVBillCardSrv, RVContactInfoSrv, ngDialog, $filter) {

    BaseCtrl.call(this, $scope);
    /*
     * Function to get email button class
     */
    $scope.getEmailButtonClass = function () {

        var emailButtonClass = "blue";

        if (!$scope.data.mailto_address) {
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
        }
        return isEmailButtonDisabled;
    };

    /*
     * print receipt method
     */
    $scope.printReceipt = function () {
        var printReceiptSuccess = function printReceiptSuccess(response) {
            var data = response.data;

            if (!data.is_copy_of_receipt) {
                data.receiptHeading = data.receipt_translations.payment_receipt;
            } else {
                var count = data.copy_counter || '';

                data.receiptHeading = data.receipt_translations.copy_of_receipt.replace("#count", count);
            }

            $scope.$emit("PRINT_RECEIPT", data);
        },
            dataToSend = {
            params: {
                bill_id: $scope.billId,
                transaction_id: $scope.transactionId,
                locale: $scope.data.locale
            },
            successCallBack: printReceiptSuccess
        };

        $scope.callAPI(RVBillCardSrv.printReceiptData, dataToSend);
    };

    $scope.closeDialog = function () {
        ngDialog.close();
    };
    /*
     * email receipt method
     */
    $scope.showEmailSentStatusPopup = function () {
        ngDialog.open({
            template: '/assets/partials/popups/rvEmailSentStatusPopup.html',
            className: '',
            scope: $scope
        });
    };
    $scope.emailReceipt = function () {
        var emailReceiptFailure = function emailReceiptFailure() {
            $scope.statusMsg = $filter('translate')('EMAIL_SEND_FAILED');
            $scope.status = "alert";
            $scope.showEmailSentStatusPopup();
        },
            emailReceiptSuccess = function emailReceiptSuccess(response) {
            $scope.statusMsg = $filter('translate')('EMAIL_SENT_SUCCESSFULLY');
            $scope.status = "success";
            $scope.showEmailSentStatusPopup();
        },
            dataToSend = {
            params: {
                bill_id: $scope.billId,
                transaction_id: $scope.transactionId,
                to_address: $scope.data.mailto_address,
                locale: $scope.data.locale
            },
            successCallBack: emailReceiptSuccess,
            failureCallBack: emailReceiptFailure
        };

        $scope.callAPI(RVBillCardSrv.emailReceiptData, dataToSend);
    };

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
    var init = function init() {
        $scope.data = {};

        var dataToSend = {
            successCallBack: successCallBackForLanguagesFetch
        };

        $scope.callAPI(RVContactInfoSrv.fetchGuestLanguages, dataToSend);
    };

    init();
}]);