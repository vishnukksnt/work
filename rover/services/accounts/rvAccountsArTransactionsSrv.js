'use strict';

angular.module('sntRover').service('rvAccountsArTransactionsSrv', ['$q', 'rvBaseWebSrvV2', function ($q, rvBaseWebSrvV2) {
    // To fetch the AR transaction for all tabs
    this.fetchTransactionDetails = function (data) {
        var deferred = $q.defer(),
            url = '/api/accounts/' + data.account_id + '/ar_transactions';

        rvBaseWebSrvV2.getJSON(url, data.getParams).then(function (data) {
            deferred.resolve(data);
        }, function (errorMessage) {
            deferred.reject(errorMessage);
        });

        return deferred.promise;
    };

    this.fetchBillPrintData = function (params) {
        var deferred = $q.defer();
        var url = '/api/accounts/' + params.account_id + '/ar_transactions/' + params.id + '/print_ar_invoice';

        rvBaseWebSrvV2.postJSON(url, params).then(function (data) {
            // Manually creating charge details list & credit deatils list.
            data.charge_details_list = [];
            data.credit_details_list = [];
            angular.forEach(data.fee_details, function (fees, index1) {
                angular.forEach(fees.charge_details, function (charge, index2) {
                    charge.date = fees.date;
                    data.charge_details_list.push(charge);
                });
                angular.forEach(fees.credit_details, function (credit, index3) {
                    credit.date = fees.date;
                    data.credit_details_list.push(credit);
                });
            });
            deferred.resolve(data);
        }, function (data) {
            deferred.reject(data);
        });

        return deferred.promise;
    };

    this.sendEmail = function (params) {
        var deferred = $q.defer();
        var url = '/api/accounts/' + params.account_id + '/ar_transactions/' + params.id + '/email_ar_invoice';

        rvBaseWebSrvV2.postJSON(url, params).then(function (data) {
            deferred.resolve(data);
        }, function (data) {
            deferred.reject(data);
        });

        return deferred.promise;
    };

    // Save AR Balance details.
    this.saveArBalance = function (data) {
        var deferred = $q.defer(),
            url = '/api/accounts/' + data.account_id + '/ar_transactions/create_manual_balances';

        rvBaseWebSrvV2.postJSON(url, data).then(function (data) {
            deferred.resolve(data);
        }, function (errorMessage) {
            deferred.reject(errorMessage);
        });

        return deferred.promise;
    };
    // To fetch the payments - to show in dialog
    this.fetchPaymentMethods = function (data) {
        var deferred = $q.defer(),
            url = 'api/accounts/' + data.id + '/ar_transactions/payments_for_allocation';

        rvBaseWebSrvV2.getJSON(url).then(function (data) {
            deferred.resolve(data);
        }, function (errorMessage) {
            deferred.reject(errorMessage);
        });

        return deferred.promise;
    };
    // To pay/allocate the selected invoices amount
    this.paySelected = function (data) {
        var deferred = $q.defer(),
            url = '/api/accounts/' + data.account_id + '/ar_transactions/allocate_payment';

        rvBaseWebSrvV2.postJSON(url, data.data).then(function (data) {
            deferred.resolve(data);
        }, function (errorMessage) {
            deferred.reject(errorMessage);
        });

        return deferred.promise;
    };

    // hold selected invoices
    this.holdSelectedInvoices = function (data) {
        var deferred = $q.defer(),
            url = '/api/accounts/' + data.account_id + '/ar_transactions/add_hold';

        rvBaseWebSrvV2.putJSON(url, data.data).then(function (data) {
            deferred.resolve(data);
        }, function (errorMessage) {
            deferred.reject(errorMessage);
        });

        return deferred.promise;
    };

    // release selected invoices
    this.releaseSelectedInvoices = function (data) {
        var deferred = $q.defer(),
            url = '/api/accounts/' + data.account_id + '/ar_transactions/release_hold';

        rvBaseWebSrvV2.putJSON(url, data.data).then(function (data) {
            deferred.resolve(data);
        }, function (errorMessage) {
            deferred.reject(errorMessage);
        });

        return deferred.promise;
    };

    // Expand Manual Balance & Paid Listing
    this.expandPaidAndUnpaidList = function (param) {
        var deferred = $q.defer(),
            url = '/api/accounts/' + param.account_id + '/ar_transactions/' + param.id + '/invoice_details';

        rvBaseWebSrvV2.getJSON(url).then(function (data) {
            deferred.resolve(data.data);
        }, function (data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };
    // To fetch statement data
    this.fetchArStatementData = function (params) {
        var deferred = $q.defer();
        var url = '/api/ar_transactions/get_email?id=' + params.id;

        rvBaseWebSrvV2.getJSON(url).then(function (data) {
            deferred.resolve(data.data);
        }, function (data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };

    // Fetch AR satement print data
    this.fetchArStatementPrintData = function (data) {
        var deferred = $q.defer(),
            url = '/api/ar_transactions/print';

        rvBaseWebSrvV2.postJSON(url, data).then(function (data) {
            deferred.resolve(data);
        }, function (errorMessage) {
            deferred.reject(errorMessage);
        });

        return deferred.promise;
    };

    // Send email AR statement
    this.emailArStatement = function (data) {
        var deferred = $q.defer(),
            url = '/api/ar_transactions/email';

        rvBaseWebSrvV2.postJSON(url, data).then(function (data) {
            deferred.resolve(data);
        }, function (errorMessage) {
            deferred.reject(errorMessage);
        });

        return deferred.promise;
    };

    // Expand Manual Balance & Paid Listing
    this.expandPaidAndUnpaidList = function (param) {
        var deferred = $q.defer(),
            url = '/api/accounts/' + param.account_id + '/ar_transactions/' + param.id + '/invoice_details';

        rvBaseWebSrvV2.getJSON(url, param).then(function (data) {
            deferred.resolve(data);
        }, function (errorMessage) {
            deferred.reject(errorMessage);
        });

        return deferred.promise;
    };

    // Expand Allocated & Unallocated Listing
    this.expandAllocateAndUnallocatedList = function (param) {
        var deferred = $q.defer(),
            url = '/api/accounts/' + param.account_id + '/ar_transactions/' + param.id + '/payment_details';

        rvBaseWebSrvV2.getJSON(url, param).then(function (data) {
            deferred.resolve(data);
        }, function (errorMessage) {
            deferred.reject(errorMessage);
        });

        return deferred.promise;
    };
    // Get Unallocate data
    this.getUnAllocateDetails = function (param) {
        var deferred = $q.defer(),
            url = '/api/accounts/' + param.account_id + '/ar_transactions/' + param.id + '/payment_details';

        rvBaseWebSrvV2.getJSON(url).then(function (data) {
            deferred.resolve(data);
        }, function (errorMessage) {
            deferred.reject(errorMessage);
        });
        return deferred.promise;
    };

    // To unallocate the selected invoices amount
    this.unAllocateSelectedPayment = function (data) {
        var deferred = $q.defer(),
            url = '/api/accounts/' + data.account_id + '/ar_transactions/unallocate_payment';

        rvBaseWebSrvV2.postJSON(url, data.data).then(function (data) {
            deferred.resolve(data);
        }, function (errorMessage) {
            deferred.reject(errorMessage);
        });

        return deferred.promise;
    };

    // Show unallocate popup data
    this.unAllocateData = function (data) {
        var deferred = $q.defer(),
            url = '/api/accounts/' + data.account_id + '/ar_transactions/unallocate_info';

        rvBaseWebSrvV2.getJSON(url, data.data).then(function (data) {
            deferred.resolve(data);
        }, function (errorMessage) {
            deferred.reject(errorMessage);
        });

        return deferred.promise;
    };

    /*
     * Service function to fetch Accounts Receivables
     * @return {object} payments
     */

    this.fetchAccountsReceivables = function (params) {

        var deferred = $q.defer(),
            url = "/api/accounts/ar_overview";

        rvBaseWebSrvV2.getJSON(url, params).then(function (data) {
            deferred.resolve(data);
        }, function (data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };

    /*
     * Service function to Move invoices
     * @return {object}
     */

    this.moveInvoice = function (params) {

        var deferred = $q.defer(),
            url = "/api/accounts/" + params.account_id + "/ar_transactions/move_invoice";

        rvBaseWebSrvV2.postJSON(url, params).then(function (data) {
            deferred.resolve(data);
        }, function (data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };

    /*
     * To get the adjustment onfo - to show in dialog
     */
    this.getAdjustmentInfo = function (data) {
        var deferred = $q.defer(),
            url = 'api/accounts/' + data.accountId + '/ar_transactions/' + data.arTransactionId + '/adjustment_info';

        rvBaseWebSrvV2.postJSON(url, data.requestParams).then(function (data) {
            deferred.resolve(data);
        }, function (errorMessage) {
            deferred.reject(errorMessage);
        });

        return deferred.promise;
    };
    /*
     * POst adjustment
     */
    this.postAdjustmentInfo = function (data) {
        var deferred = $q.defer(),
            url = 'api/accounts/' + data.accountId + '/ar_transactions/' + data.arTransactionId + '/post_adjustment';

        rvBaseWebSrvV2.postJSON(url, data.postData).then(function (data) {
            deferred.resolve(data);
        }, function (errorMessage) {
            deferred.reject(errorMessage);
        });

        return deferred.promise;
    };

    /*
     * Service function to Move To credits
     * @param {object} [balance data object]
     * @return {object}
     */
    this.moveToCreditInvoice = function (params) {
        var deferred = $q.defer(),
            url = '/api/accounts/' + params.account_id + '/ar_transactions/post_manual_credit';

        rvBaseWebSrvV2.postJSON(url, params).then(function (data) {
            deferred.resolve(data);
        }, function (data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };

    this.lockBill = function (params) {
        var deferred = $q.defer(),
            url = '/api/accounts/' + params.account_id + '/ar_transactions/' + params.id + '/ar_final_invoice_settlement';

        rvBaseWebSrvV2.postJSON(url, params).then(function (data) {
            deferred.resolve(data);
        }, function (data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };
    /*
     * Service function to Move Zero Invoice to Paid Tab.
     * @param {object} [object contains account_id]
     * @return {object}
     */
    this.moveZeroInvoiceAsPaid = function (params) {
        var deferred = $q.defer(),
            url = '/api/accounts/' + params.account_id + '/ar_transactions/move_zero_invoices_as_paid';

        rvBaseWebSrvV2.postJSON(url, params).then(function (data) {
            deferred.resolve(data);
        }, function (data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };
}]);