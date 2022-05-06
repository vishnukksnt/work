/**
 * Base controller for guest card contact tab, can be used to share functionalities shared
 * in guest card related sections
 * @param {object} $scope Scope object
 * @param {object} RVSearchSrv Search Service
 * @return {void}
 */
window.SharedMethodsBaseCtrl = function ($scope, $rootScope, RVAutomaticEmailSrv, ngDialog) {

    /*
     * Send emails after payment
     */

    $scope.sendAutomaticEmails = function(data) {

        var sendSuccessCallback = function() {
            $scope.closeDialog();
        },
        params = {
            "bill_id": $scope.currentPaymentBillId,
            "transaction_id": $scope.currentPaymentTransactionId,
            "locale": $rootScope.hotelDefaultLanguageCode
        };

        if (data) {
            params.to_address = data;
        }

        var dataToSend = {
            params: params,
            successCallBack: sendSuccessCallback
        };

        $scope.callAPI(RVAutomaticEmailSrv.sendAutomaticEmails, dataToSend);
    };


    /*
     * Open popup to enter email address
     */

    $scope.openEnterEmailPopup = function() {
        ngDialog.open({
            template: '/assets/partials/bill/rvValidateEmailOnPayment.html',
            controller: 'RVValidateEmailOnPaymentCtrl',
            className: '',
            closeByDocument: false,
            scope: $scope
        });
    };
    /*
     * If autotrigger option selected, show popup to enter email if not saved
     */
    $scope.autoTriggerPaymentReceiptActions = function() {

        var successCallbackEmailPresence = function(response) {
                if (response.data.email_present) {
                    $scope.sendAutomaticEmails();
                } else {
                    $scope.openEnterEmailPopup();
                }
            };


        var dataToSend = {
            params: {
                "bill_id": $scope.currentPaymentBillId
            },
            successCallBack: successCallbackEmailPresence
        };

        $scope.callAPI(RVAutomaticEmailSrv.verifyEmailPresence, dataToSend);
        
    };

};
