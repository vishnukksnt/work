'use strict';

angular.module('sntRover').service('rvRateManagerHierarchyRestrictionsSrv', ['$q', 'BaseWebSrvV2', function ($q, BaseWebSrvV2) {
    // Exclusive service for hierarchy restrictions
    var service = this,
        houseUrl = '/api/restrictions/house',
        roomTypeUrl = '/api/restrictions/room_types',
        rateTypeUrl = '/api/restrictions/rate_types',
        rateUrl = '/api/restrictions/rates';

    service.saveHouseRestrictions = function (params) {
        return BaseWebSrvV2.postJSON(houseUrl, params);
    };

    service.saveRoomTypeRestrictions = function (params) {
        return BaseWebSrvV2.postJSON(roomTypeUrl, params);
    };

    service.saveRateTypeRestrictions = function (params) {
        return BaseWebSrvV2.postJSON(rateTypeUrl, params);
    };

    service.saveRateRestrictions = function (params) {
        return BaseWebSrvV2.postJSON(rateUrl, params);
    };

    service.fetchHierarchyRestrictions = function (params) {
        return BaseWebSrvV2.getJSON('/api/restrictions/hierarchy', params);
    };

    service.fetchAllRoomTypes = function (params) {
        return BaseWebSrvV2.getJSON('/api/room_types.json', params);
    };

    service.fetchAllRateTypes = function (params) {
        return BaseWebSrvV2.getJSON('/api/rate_types/active', params);
    };

    service.fetchAllRates = function (params) {
        return BaseWebSrvV2.getJSON('/api/rates', params);
    };
}]);