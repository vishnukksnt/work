'use strict';

angular.module('sntRover').service('RVAutoChargeSrv', ['$http', '$q', 'rvBaseWebSrvV2', function ($http, $q, RVBaseWebSrvV2) {

    var that = this;

    that.stateData = {};
    that.getStateData = function () {
        return that.stateData;
    };

    that.setStateData = function (data) {
        that.stateData = data;
    };
    /*
     * Service function to fetch Accounts Receivables
     * @return {object} payments
     */

    that.fetchAutoCharge = function (params) {
        var url = '/api/hotels/auto_charge_deposit_report';

        return RVBaseWebSrvV2.getJSON(url, params);
    };

    /*
     * Service function to fetch Accounts Receivables
     * @return {object} payments
     */

    that.fetchEodAutoCharge = function (params) {
        var url = '/api/auto_charge/auto_charge_checkout';

        return RVBaseWebSrvV2.getJSON(url, params);
    };
    /*
     * Service function to start autocharge process
     * @return {object}
     */
    that.processAutoCharges = function (params) {
        var url = '/api/reservations/re_process_auto_charge';

        return RVBaseWebSrvV2.postJSON(url, params);
    };
}]);