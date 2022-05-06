'use strict';

angular.module('sntRover').service('rvRateManagerRestrictionsSrv', ['Toggles', 'rvRateManagerUtilitySrv', function (Toggles, rvRateManagerUtilitySrv) {

    var service = this;

    // service object that handles various hierarchy Restrictions feature toggle values.
    service.hierarchyRestrictions = {
        houseEnabled: Toggles.isEnabled('hierarchical_house_restrictions'),
        roomTypeEnabled: Toggles.isEnabled('hierarchical_room_type_restrictions'),
        rateTypeEnabled: Toggles.isEnabled('hierarchical_rate_type_restrictions'),
        rateEnabled: Toggles.isEnabled('hierarchical_rate_restrictions')
    };

    // CICO-77044 - for rate only
    service.processRateRestrictionResponse = function (response, isForPopup) {
        _.each(response, function (item) {
            _.each(item.rates, function (rate) {
                rate.restrictions = rvRateManagerUtilitySrv.generateOldGetApiResponseFormat(rate.restrictions, rate.locked_restrictions, isForPopup);
            });
        });

        return response;
    };

    /*
     *  Concat two lists for restrictions list values and rate amount.
     *  @param {Array}  [ rateAmountList - API response with amount and currency values ]
     *  @param {Array}  [ rate restrictions list ]
     *  @return {Array} [ Merged list ]
     */
    service.concatRateWithAmount = function (rateAmountList, rateRestrictionsList) {
        if (rateAmountList.length > 0) {
            var i = 0,
                j = 0;

            for (i = 0; i < rateAmountList.length; i++) {
                var newList = [];

                for (j = 0; j < rateAmountList[i].rates.length; j++) {
                    var merged = Object.assign(rateAmountList[i].rates[j], rateRestrictionsList[i].rates[j]);

                    newList.push(merged);
                }

                rateRestrictionsList[i].rates = newList;
            }
        }

        return rateRestrictionsList;
    };

    // check if any of the hierarchy restrictions are enabled
    service.activeHierarchyRestrictions = function () {
        return [{ level: 'House', active: service.hierarchyRestrictions.houseEnabled }, { level: 'RateType', active: service.hierarchyRestrictions.rateTypeEnabled }, { level: 'RoomType', active: service.hierarchyRestrictions.roomTypeEnabled }, { level: 'Rate', active: service.hierarchyRestrictions.rateEnabled }];
    };

    // CICO-76337 - for rateType only
    service.processRateTypeRestrictionResponse = function (response) {
        _.each(response, function (item) {
            _.each(item.rate_types, function (rateType) {
                rateType.restrictions = rvRateManagerUtilitySrv.generateOldGetApiResponseFormat(rateType.restrictions);
            });
        });

        return response;
    };

    // CICO-76339 - for roomtype only
    service.processRoomTypeRestrictionResponse = function (response) {
        _.each(response, function (item) {
            _.each(item.room_types, function (roomType) {
                roomType.restrictions = rvRateManagerUtilitySrv.generateOldGetApiResponseFormat(roomType.restrictions);
            });
        });

        return response;
    };

    // Handle GET api while loading RM with various filters in House Level ( Frozen Panel).
    // Handle GET api, for individual cell click & popup in House Level ( Frozen Panel).
    service.formatRestrictionsData = function (restrictionsList, params) {
        // CICO-76813 : New API for hierarchyRestrictions
        if (params.forPanel) {
            _.each(restrictionsList, function (item) {
                item.restrictions = rvRateManagerUtilitySrv.generateOldGetApiResponseFormatForPanel(item.restrictions);
            });
        }

        return restrictionsList;
    };

    // CICO-76337 rateType restrictions API
    service.rateRestrictionsUrl = function (params) {
        var url = params.hierarchialRateRestrictionRequired ? '/api/restrictions/rates' : '/api/daily_rates';

        return url;
    };

    // CICO-76337 rateType restrictions API
    service.rateTypeRestrictionsUrl = function (params) {
        var url = params.hierarchialRateTypeRestrictionRequired ? '/api/restrictions/rate_types' : '/api/daily_rates/rate_types';

        return url;
    };

    // CICO-76339 roomType restriction API
    service.roomTypeRestrictionUrl = function (params) {
        return params.hierarchialRoomTypeRestrictionRequired ? '/api/restrictions/room_types' : '/api/daily_rates/room_restrictions';
    };

    // Handle GET api, for individual cell click & popup in House Level ( Frozen Panel).
    service.getURLforAllRestrictionsWithStatus = function (params) {
        var url = '/api/daily_rates/all_restriction_statuses';

        // CICO-76813 : New API for hierarchyRestrictions
        if (params.hierarchialRateTypeRestrictionRequired) {
            url = '/api/restrictions/rate_types';
        } else if (params.hierarchialRoomTypeRestrictionRequired) {
            url = '/api/restrictions/room_types';
        } else if (params.hierarchialRateRestrictionRequired) {
            url = '/api/restrictions/rates';
        }
        return url;
    };

    // Handle POST api, for individual cell click & popup in House Level ( Frozen Panel).
    service.getURLforApplyAllRestrictions = function (params) {
        var url = '/api/daily_rates';

        // CICO-76813 : New API for hierarchyRestrictions
        if (service.hierarchyRestrictions.houseEnabled && params.restrictionType === 'HOUSE') {
            url = '/api/restrictions/house';
        } else if (params.hierarchialRateTypeRestrictionRequired) {
            url = '/api/restrictions/rate_types';
        } else if (params.hierarchialRoomTypeRestrictionRequired) {
            url = '/api/restrictions/room_types';
        } else if (params.hierarchialRateRestrictionRequired) {
            url = '/api/restrictions/rates';
        }
        return url;
    };

    // Handle POST api, for individual cell click & popup in House Level ( Frozen Panel).
    service.processParamsforApplyAllRestrictions = function (params) {
        if (service.hierarchyRestrictions.houseEnabled && params.restrictionType === 'HOUSE' || params.hierarchialRoomTypeRestrictionRequired || params.hierarchialRateTypeRestrictionRequired || params.hierarchialRateRestrictionRequired) {
            params = rvRateManagerUtilitySrv.generateNewPostApiParams(params);
        }
        return params;
    };
}]);