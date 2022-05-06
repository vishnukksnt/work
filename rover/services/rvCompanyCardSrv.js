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
        angular.module('sntRover').service('RVCompanyCardSrv', ['$q', 'rvBaseWebSrvV2', function ($q, rvBaseWebSrvV2) {

            var service = this,
                cachedResponses = {},
                lifeSpan = 60000; // In milliseconds

            service.companyTaArDetailsCached = [];
            service.companyTaNotes = [];
            service.cachedTime = '';

            // some default values
            this.DEFAULT_PER_PAGE = 10;
            this.DEFAULT_PAGE = 1;

            var openSaveAccountRequests = {},
                that = this;

            /** contact information area */

            /**
             * service function used to retreive contact information against a accound id
             * @param {Object} data payLoad
             * @return {promise|{then, catch, finally}|*|e} Promise
             */
            this.fetchContactInformation = function (data) {
                var id = data.id;
                var deferred = $q.defer();
                var url = '/api/accounts/' + id;
                var keysToRemove = ['is_eod_failed', 'is_eod_in_progress', 'is_eod_manual_started', 'is_eod_process_running'];

                rvBaseWebSrvV2.getJSON(url).then(function (data) {
                    // Remove irrelevant keys
                    deferred.resolve(_.omit(data, keysToRemove));
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.fetchCompanyPaymentData = function (accountId) {
                var deferred = $q.defer();
                var url = '/staff/payments/payment.json?account_id=' + accountId;

                rvBaseWebSrvV2.getJSON(url).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.setAsPrimary = function (data) {
                var deferred = $q.defer();

                var url = 'api/accounts/' + data.account_id + '/set_wallet_payment_method_primary';

                rvBaseWebSrvV2.postJSON(url, data).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.deletePayment = function (data) {
                var deferred = $q.defer();
                var url = 'api/accounts/' + data.account_id + '/delete_wallet_payment_methods';

                rvBaseWebSrvV2.postJSON(url, data).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.fetchContactInformationMandatoryFields = function () {
                var deferred = $q.defer(),
                    url = '/admin/co_ta_settings/current_settings.json';

                rvBaseWebSrvV2.getJSON(url).then(function (data) {
                    deferred.resolve(data);
                }, function (errorMessage) {
                    deferred.reject(errorMessage);
                });
                return deferred.promise;
            };

            this.fetchAccountPaymentData = function (accountId) {
                var deferred = $q.defer();
                var url = '/staff/payments/payment.json?account_id=' + accountId;

                rvBaseWebSrvV2.getJSON(url).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.fetchContactInformationAndMandatoryFields = function (data) {
                var deferred = $q.defer(),
                    returnData = {};

                $q.when().then(function () {
                    return that.fetchContactInformation(data).then(function (response) {
                        returnData = response;
                    });
                }).then(function () {
                    return that.fetchContactInformationMandatoryFields().then(function (response) {
                        returnData.mandatoryFields = response;
                    });
                }).then(function () {
                    deferred.resolve(returnData);
                }, function (errorMessage) {
                    deferred.reject(errorMessage);
                });

                return deferred.promise;
            };

            /**
             * getting details of commission status of travel agent card
             * @return {promise|{then, catch, finally}|*|e} Promise
             */
            this.fetchCommissionDetail = function () {
                var deferred = $q.defer();
                var url = ' /api/hotel_settings/default_agent_commission_details';

                rvBaseWebSrvV2.getJSON(url).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.fetchCommissionDetailsAndMandatoryFields = function () {
                var deferred = $q.defer(),
                    returnData = {};

                $q.when().then(function () {
                    return that.fetchCommissionDetail().then(function (response) {
                        returnData = response;
                    });
                }).then(function () {
                    return that.fetchContactInformationMandatoryFields().then(function (response) {
                        returnData.mandatoryFields = response;
                    });
                }).then(function () {
                    deferred.resolve(returnData);
                }, function (errorMessage) {
                    deferred.reject(errorMessage);
                });

                return deferred.promise;
            };

            /**
             * Fetch multiproperties under this chain
             * @return {promise|{then, catch, finally}|*|e} Promise
             */
            this.fetchMultiProperties = function (data) {
                var deferred = $q.defer();
                var url = '/api/accounts/' + data.accountId + '/subscribed_properties';

                rvBaseWebSrvV2.getJSON(url).then(function (data) {

                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            /**
             * service function used for retreive country list
             */
            var _countryList = [];

            this.fetchCountryList = function () {
                var deferred = $q.defer();
                var url = '/ui/country_list';

                if (_countryList.length) {
                    deferred.resolve(_countryList);
                } else {
                    rvBaseWebSrvV2.getJSON(url).then(function (data) {
                        _countryList = data;
                        deferred.resolve(data);
                    }, function (data) {
                        deferred.reject(data);
                    });
                }

                return deferred.promise;
            };

            /**
             * service function used to save the contact information
             * @param {Object} data payLoad
             * @return {promise|{then, catch, finally}|*|e} Promise
             */
            this.saveContactInformation = function (data) {
                var deferred = $q.defer(),
                    url = 'api/accounts/save.json',
                    accountId = parseInt(data.id, 10),
                    requests,
                    contactInformation = _.omit(data, ['workstation_id']),
                    existingRequest,
                    requestInfo = {
                    data: contactInformation,
                    deferred: deferred
                };

                openSaveAccountRequests[accountId] = openSaveAccountRequests[accountId] || [];
                requests = openSaveAccountRequests[accountId];
                existingRequest = requests.find(function (req) {
                    return angular.equals(req.data, contactInformation) && !req.resolved;
                });

                if (existingRequest) {
                    return existingRequest.deferred.promise;
                }

                requests.push(requestInfo);

                rvBaseWebSrvV2.postJSON(url, data).then(function (data) {
                    requestInfo.resolved = true;
                    deferred.resolve(data);
                }, function (data) {
                    requestInfo.resolved = true;
                    deferred.reject(data);
                });

                return deferred.promise;
            };

            /**
             * service function used for retreive rates
             * @param {Object} params payLoad
             * @return {promise|{then, catch, finally}|*|e} Promise
             */

            this.fetchRates = function (params) {
                var deferred = $q.defer(),
                    url = '/api/rates/contract_rates';

                rvBaseWebSrvV2.getJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.replaceCard = function (data) {
                var request = {
                    'old': {
                        type: data.cardType
                    },
                    'new': {
                        type: data.cardType,
                        id: data.id,
                        use_card_rate: data.useCardRate
                    },
                    'change_all_reservations': data.future
                };
                var deferred = $q.defer();
                var url = '/api/reservations/' + data.reservation + '/cards/replace';

                rvBaseWebSrvV2.putJSON(url, request).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.removeCard = function (data) {
                var request = {
                    type: data.cardType,
                    id: data.cardId
                };
                var deferred = $q.defer();
                var url = '/api/reservations/' + data.reservation + '/cards/remove';

                rvBaseWebSrvV2.deleteJSON(url, request).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.fetchArAccountDetails = function (data) {

                var id = data.id,
                    deferred = $q.defer(),
                    url = '/api/accounts/' + id + '/ar_details';

                if (!service.companyTaArDetailsCached[id] || service.companyTaArDetailsCached[id].expiry && Date.now() > service.companyTaArDetailsCached[id].expiry) {

                    service.companyTaArDetailsCached[id] = deferred;

                    rvBaseWebSrvV2.getJSON(url).then(function (data) {
                        service.companyTaArDetailsCached[id] = { "response": data, "expiry": Date.now() + lifeSpan };

                        deferred.resolve(data);
                    }, function (data) {
                        deferred.reject(data);
                    });
                } else if (!service.companyTaArDetailsCached[id].response) {
                    return service.companyTaArDetailsCached[id].promise;
                } else {
                    deferred.resolve(service.companyTaArDetailsCached[id].response);
                }
                return deferred.promise;
            };

            this.fetchArAccountNotes = function (data) {
                var id = data.id,
                    deferred = $q.defer(),
                    url = '/api/accounts/' + id + '/ar_notes';

                if (!service.companyTaNotes[id] || service.companyTaNotes[id].expiry && Date.now() > service.companyTaNotes[id].expiry) {

                    service.companyTaNotes[id] = deferred;
                    rvBaseWebSrvV2.getJSON(url).then(function (data) {
                        service.companyTaNotes[id] = {
                            'response': data,
                            'expiry': Date.now() + lifeSpan
                        };
                        deferred.resolve(data);
                    }, function (data) {
                        deferred.reject(data);
                    });
                } else if (!service.companyTaNotes[id].response) {
                    return service.companyTaNotes[id].promise;
                } else {
                    deferred.resolve(service.companyTaNotes[id].response);
                }
                return deferred.promise;
            };

            this.saveARNote = function (data) {
                var deferred = $q.defer(),
                    url = '/api/accounts/save_ar_note',
                    accountId = data.id;

                rvBaseWebSrvV2.postJSON(url, data).then(function (data) {
                    // Invalidating cache
                    service.companyTaNotes[accountId] = null;
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.saveARDetails = function (data) {
                var deferred = $q.defer(),
                    url = 'api/accounts/save_ar_details',
                    accountId = data.id;

                rvBaseWebSrvV2.postJSON(url, data).then(function (data) {
                    // Invalidating cache
                    service.companyTaArDetailsCached[accountId] = null;
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.deleteARNote = function (data) {
                var deferred = $q.defer();
                var url = '/api/accounts/delete_ar_note';
                var accountId = data.id;

                rvBaseWebSrvV2.postJSON(url, data).then(function (data) {
                    // Invalidating cache
                    service.companyTaNotes[accountId] = null;
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.deleteArAccount = function (data) {
                var id = data.id;
                var deferred = $q.defer();
                var url = 'api/accounts/' + id + '/delete_ar_detail';

                rvBaseWebSrvV2.deleteJSON(url).then(function (data) {
                    // Invalidating cache
                    service.companyTaArDetailsCached[id] = null;
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.fetchArAccountsList = function (params) {
                var deferred = $q.defer();

                var url = '/api/accounts/' + params.id + '/ar_transactions?' + 'paid=' + params.paid + '&from_date=' + params.from_date + '&to_date=' + params.to_date + '&query=' + params.query + '&page=' + params.page_no + '&per_page=' + params.per_page + '&transaction_type=' + params.transaction_type;

                rvBaseWebSrvV2.getJSON(url).then(function (data) {

                    // CICO-28089 - View detailed transactions - setting active flag
                    if (!!data.ar_transactions && data.ar_transactions.length > 0) {
                        angular.forEach(data.ar_transactions, function (item) {
                            if (item.transaction_type === 'DEBIT') {
                                item.active = false;
                            }
                        });
                    }

                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.addCreditAmount = function (params) {
                var deferred = $q.defer();
                var url = 'api/accounts/' + params.id + '/ar_transactions';

                rvBaseWebSrvV2.postJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.payForReservation = function (params) {
                var deferred = $q.defer();
                var url = 'api/accounts/' + params.id + '/ar_transactions/' + params.transaction_id + '/pay';

                rvBaseWebSrvV2.postJSON(url).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.openForReservation = function (params) {
                var deferred = $q.defer();
                var url = 'api/accounts/' + params.id + '/ar_transactions/' + params.transaction_id + '/open';

                rvBaseWebSrvV2.postJSON(url).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.payAll = function (params) {
                var deferred = $q.defer();
                var url = 'api/accounts/' + params.id + '/ar_transactions/pay_all';

                rvBaseWebSrvV2.postJSON(url).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            service.fetchHotelLoyaltiesHlps = function () {
                var deferred = $q.defer();
                var url = '/staff/user_memberships/get_available_hlps.json';

                if (cachedResponses['fetchHotelLoyaltiesHlps']) {
                    deferred.resolve(cachedResponses['fetchHotelLoyaltiesHlps']);
                } else {
                    rvBaseWebSrvV2.getJSON(url).then(function (data) {
                        cachedResponses['fetchHotelLoyaltiesHlps'] = data;
                        deferred.resolve(data);
                    }, function (data) {
                        deferred.reject(data);
                    });
                }

                return deferred.promise;
            };

            service.fetchHotelLoyaltiesFfp = function () {
                var deferred = $q.defer();
                var url = '/staff/user_memberships/get_available_ffps.json';

                if (cachedResponses['fetchHotelLoyaltiesFfp']) {
                    deferred.resolve(cachedResponses['fetchHotelLoyaltiesFfp']);
                } else {
                    rvBaseWebSrvV2.getJSON(url).then(function (data) {
                        cachedResponses['fetchHotelLoyaltiesFfp'] = data;
                        deferred.resolve(data);
                    }, function (data) {
                        deferred.reject(data);
                    });
                }
                return deferred.promise;
            };

            /**
             * Service for getting the commission details of a travel agent
             * @param {Object} reqData payLoad
             * @return {promise|{then, catch, finally}|*|e} Promise
             */
            this.fetchTACommissionDetails = function (reqData) {
                var deferred = $q.defer();
                var url = ' api/accounts/' + reqData.accountId + '/commission_details';
                // var url = "/assets/sampleJson/commissionTa"+ reqData.params.page + ".json";

                rvBaseWebSrvV2.getJSON(url, reqData.params).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            /**
             * Service for saving the commission details of travel agents
             * @param {Object} reqData payLoad
             * @return {promise|{then, catch, finally}|*|e} Promise
             */
            this.saveTACommissionDetails = function (reqData) {
                var deferred = $q.defer(),
                    params = {};

                params.reservations = reqData.commissionDetails;
                var url = 'api/accounts/' + reqData.accountId + '/save_commission_details';

                rvBaseWebSrvV2.postJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            /**
             * Service for getting the transacton details
             * @param {Object} param payLoad
             * @return {promise|{then, catch, finally}|*|e} Promise
             */
            this.fetchTransactionDetails = function (param) {
                var deferred = $q.defer(),
                    url = ' /api/bills/' + param.bill_id + '/transactions';

                rvBaseWebSrvV2.getJSON(url, param).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            // To fetch AR Statement Print data.
            this.fetchArStatementPrintData = function (params) {
                var deferred = $q.defer();
                var url = '/api/ar_transactions/print';

                rvBaseWebSrvV2.postJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            // To email the AR Statement pdf.
            this.emailArStatement = function (params) {
                var deferred = $q.defer();
                var url = '/api/ar_transactions/email';

                rvBaseWebSrvV2.postJSON(url, params).then(function (data) {
                    deferred.resolve(data);
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
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            // Service that fetches the charge details of a grouped charge - CICO-34039.
            this.groupChargeDetailsFetch = function (params) {
                var deferred = $q.defer(),
                    url = '/staff/reservation/transaction_details';

                rvBaseWebSrvV2.getJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });

                return deferred.promise;
            };

            /**
             * Service for check commission recalculation
             * @param {Object} param payLoad
             * @return {promise|{then, catch, finally}|*|e} Promise
             */
            this.recalculateCommission = function (param) {
                var deferred = $q.defer(),
                    url = '/api/reservations/recalculate_commission_details';

                rvBaseWebSrvV2.postJSON(url, param).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            /**
             * Fetch CC/TA card statistics summary
             * @param {Object} params request params
             * @return {Promise} promise
             */
            this.fetchCompanyTravelAgentStatisticsSummary = function (params) {
                var deferred = $q.defer(),
                    url = '/api/accounts/' + params.accountId + '/statistics?view=SUMMARY';

                delete params.accountId;

                rvBaseWebSrvV2.getJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            /**
             * Fetch CC/TA card statistics details
             * @param {Object} params request params
             * @return {Promise} promise
             */
            this.fetchCompanyTravelAgentStatisticsDetails = function (params) {
                var deferred = $q.defer(),
                    url = '/api/accounts/' + params.accountId + '/statistics?view=DETAILED';

                delete params.accountId;

                rvBaseWebSrvV2.getJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            /**
             * Fetch CC/TA card statistics details
             * @param {Object} params request params
             * @return {Promise} promise
             */
            this.fetchCompanyTravelAgentMonthlyReservations = function (params) {
                var deferred = $q.defer(),
                    url = '/api/accounts/' + params.accountId + '/statistics?view=RESERVATIONS';

                delete params.accountId;

                rvBaseWebSrvV2.getJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            /**
             * Verify whether the given cc/ta are eligible for being merged
             * @param {Object} params contains array of ids of the cc/ta
             * @return {Promise} promise
             */
            this.verifyTravelAgentCompanyCardMerge = function (params) {
                var deferred = $q.defer(),
                    url = '/api/accounts/validate_card_merge';

                rvBaseWebSrvV2.postJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            /**
             * Merge the non-primary cards to primary card
             * @param {Object} params contains primary card id, non-primary card ids and card type
             * @return {Promise} promise
             */
            this.mergeCards = function (params) {
                var deferred = $q.defer(),
                    url = '/api/accounts/merge_cards';

                rvBaseWebSrvV2.postJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };
        }]);
    }, {}] }, {}, [1]);