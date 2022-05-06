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
        angular.module('sntRover').service('rvCompanyCardContractsSrv', ['$q', 'sntBaseWebSrv', function ($q, sntBaseWebSrv) {

            this.fetchRateContract = function (params) {
                return sntBaseWebSrv.getJSON('/api/rates/contract_rates', params);
            };

            this.deleteContract = function (data) {
                var url = '/api/accounts/' + data.account_id + '/contracts/' + data.contract_id;

                return sntBaseWebSrv.deleteJSON(url);
            };

            this.fetchContractsDetails = function (data) {
                var url = '/api/accounts/' + data.account_id + '/contracts/' + data.contract_id;

                return sntBaseWebSrv.getJSON(url);
            };

            var contractRates = [];

            this.fetchContractsList = function (data) {
                var deferred = $q.defer(),
                    url = '/api/accounts/' + data.account_id + '/contracts';

                sntBaseWebSrv.getJSON(url).then(function (data) {
                    contractRates = data;
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.getContractedRates = function () {
                return contractRates;
            };

            /**
             * service function used to add new contracts
             * @param {Object} data payLoad
             * @return {promise|{then, catch, finally}|*|e} Promise
             */
            this.addNewContract = function (data) {
                var url = '/api/accounts/' + data.account_id + '/contracts';

                return sntBaseWebSrv.postJSON(url, data.postData);
            };

            /**
             * service function used to update the contracts
             * @param {Object} data payLoad
             * @return {promise|{then, catch, finally}|*|e} Promise
             */
            this.updateContract = function (data) {
                var url = '/api/accounts/' + data.account_id + '/contracts/' + data.contract_id;

                return sntBaseWebSrv.putJSON(url, data.postData);
            };

            this.updateNight = function (data) {
                var url = '/api/accounts/' + data.account_id + '/contracts/' + data.contract_id + '/contract_nights';

                return sntBaseWebSrv.postJSON(url, data.postData);
            };

            this.fetchContractsForLinking = function (params) {
                return sntBaseWebSrv.getJSON('/api/contracts/search_contracts', params);
            };

            this.linkContract = function (params) {
                return sntBaseWebSrv.postJSON('/api/contracts/link_contract', params);
            };

            this.unLinkContract = function (params) {
                return sntBaseWebSrv.postJSON('/api/contracts/unlink_contract', params);
            };

            this.linkRate = function (params) {
                return sntBaseWebSrv.postJSON('/api/contracts/link_rate', params);
            };

            this.unlinkRate = function (params) {
                return sntBaseWebSrv.postJSON('/api/contracts/unlink_rate', params);
            };

            this.fetchOwners = function (params) {
                params.id = params.contract_id;
                return sntBaseWebSrv.getJSON('/api/contracts/contract_owners', params);
            };

            var that = this;

            this.fetchDetailsWithOwnersList = function (params) {
                var promises = [],
                    response = {},
                    deferred = $q.defer();

                promises.push(that.fetchOwners(params).then(function (data) {
                    response.ownersList = data.data;
                }));

                promises.push(that.fetchContractsDetails(params).then(function (data) {
                    response.contractDetails = data;
                }));

                $q.all(promises).then(function () {
                    deferred.resolve(response);
                });

                return deferred.promise;
            };
        }]);
    }, {}] }, {}, [1]);