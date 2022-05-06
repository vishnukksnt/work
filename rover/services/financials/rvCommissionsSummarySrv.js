'use strict';

sntRover.service('RVCommissionsSrv', ['$http', '$q', 'BaseWebSrvV2', function ($http, $q, BaseWebSrvV2) {

    var that = this;
    /*
     * Service function to fetch Accounts Receivables
     * @return {object} payments
     */

    that.fetchCommissions = function (params) {

        var deferred = $q.defer();
        var url = '/api/accounts/commission_overview';
        // var url = 'ui/show?json_input=commissions/commissons.json&format=json';

        BaseWebSrvV2.getJSON(url, params).then(function (data) {
            deferred.resolve(data);
        }, function (data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };

    that.printCommissionOverview = function (params) {

        var deferred = $q.defer();
        var url = '/api/accounts/print_commission_overview';
        // var url = 'ui/show?json_input=commissions/commissons.json&format=json';

        BaseWebSrvV2.postJSON(url, params).then(function (data) {
            deferred.resolve(data);
        }, function (data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };

    that.fetchReservationOfCommissions = function (params) {

        var deferred = $q.defer();
        var url = '/api/accounts/' + params.id + '/commissionable_reservations_data';
        // var url = 'ui/show?json_input=commissions/commissons.json&format=json';

        BaseWebSrvV2.getJSON(url, params).then(function (data) {
            deferred.resolve(data);
        }, function (data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };

    that.updateCommissionPaidStatus = function (params) {
        var deferred = $q.defer();
        var url = '/api/accounts/update_commission_paid_status';

        BaseWebSrvV2.postJSON(url, params).then(function (data) {
            deferred.resolve(data);
        }, function (data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };

    that.exportCommissions = function (params) {

        var deferred = $q.defer();
        var url = '/api/reports/unpaid_commission_export';

        BaseWebSrvV2.postJSON(url, params).then(function (data) {
            deferred.resolve(data);
        }, function (data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };

    this.filterData = {
        'page': 1,
        'perPage': 50,
        'innerPerPage': 25,
        'searchQuery': '',
        'minAmount': '',
        'selectedExportType': 'standard',
        'receipientEmail': '',
        'billStatus': {
            'value': 'PAID',
            'name': 'PAID'
        },
        'sort_by': {
            'value': 'NAME_ASC',
            'name': 'NAME_ASC'
        },
        'filterTab': 'PAYABLE',
        'billStatusOptions': [{
            'value': 'OPEN',
            'name': 'OPEN'
        }, {
            'value': 'PAID',
            'name': 'PAID'
        }, {
            'value': 'ALL',
            'name': 'ALL'
        }],
        'sortOptions': [{
            'value': 'NAME_ASC',
            'name': 'NAME ASC'
        }, {
            'value': 'NAME_DESC',
            'name': 'NAME DESC'
        }, {
            'value': 'AMOUNT_ASC',
            'name': 'AMOUNT ASC'
        }, {
            'value': 'AMOUNT_DESC',
            'name': 'AMOUNT DESC'
        }],
        'non_commissionable': false
    };

    that.onyxExportCommissions = function (params) {

        var deferred = $q.defer();
        var url = '/api/reports/onyx_commission_export';

        BaseWebSrvV2.postJSON(url, params).then(function (data) {
            deferred.resolve(data);
        }, function (data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };

    that.fetchExportTypeData = function () {

        var deferred = $q.defer();
        var url = '/api/accounts/fetch_enabled_commission_interface';

        BaseWebSrvV2.getJSON(url).then(function (data) {
            deferred.resolve(data);
        }, function (data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };

    this.fetchHotelBusinessDate = function () {
        var deferred = $q.defer(),
            url = '/api/business_dates/active';

        BaseWebSrvV2.getJSON(url).then(function (data) {
            deferred.resolve(data);
        }, function (errorMessage) {
            deferred.reject(errorMessage);
        });

        return deferred.promise;
    };
}]);