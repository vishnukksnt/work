'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

angular.module('reportsModule').factory('RVReportUtilsFac', ['$rootScope', '$filter', '$timeout', '$q', 'RVReportNamesConst', 'RVReportFiltersConst', 'RVreportsSubSrv', 'rvUtilSrv', 'RVReportParamsConst', function ($rootScope, $filter, $timeout, $q, reportNames, reportFilters, reportsSubSrv, rvUtilSrv, reportParams) {
    var factory = {};

    var DATE_FILTERS = ['fromCancelDate', 'untilCancelDate', 'fromDepositDate', 'untilDepositDate', 'fromPaidDate', 'untilPaidDate', 'fromDate', 'untilDate', 'fromCreateDate', 'untilCreateDate', 'fromAdjustmentDate', 'untilAdjustmentDate', 'fromArrivalDate', 'untilArrivalDate', 'groupStartDate', 'groupEndDate', 'singleValueDate'];

    var OTHER_FILTERS = ['year', 'with_vat_number', 'without_vat_number', 'fromTime', 'untilTime', 'chosenCico', 'chosenIncludeCompanyTa', 'chosenIncludeCompanyTaGroup', 'chosenIncludeGroup', 'hasMinRoomNights', 'hasMinRevenue', 'showActionables', 'show_vat_with_rates', 'show_upsell_only'];

    var HK_RESERVATION_STATUS_LIST = [{
        status: 'VACANT',
        description: 'Show Vacant'
    }, {
        status: 'OCCUPIED',
        description: 'Show Occupied'
    }, {
        status: 'QUEUED',
        description: 'Show Queued'
    }, {
        status: 'LATE_CHECKOUT',
        description: 'Late Checkout'
    }, {
        status: 'PRE_CHECKIN',
        description: 'Pre Checkin'
    }];

    var HK_FO_STATUS_LIST = [{
        status: 'STAY_OVER',
        description: 'Show Stayover'
    }, {
        status: 'NOT_RESERVED',
        description: 'Show Not Reserved'
    }, {
        status: 'ARRIVAL',
        description: 'Show Arrival'
    }, {
        status: 'ARRIVED',
        description: 'Show Arrived'
    }, {
        status: 'DAY_USE',
        description: 'Show Day Use'
    }, {
        status: 'DUE_OUT',
        description: 'Show Due Out'
    }, {
        status: 'DEPARTED',
        description: 'Show Departed'
    }];

    var ALT_RESERVATION_STATUS = [{ id: -2, status: "DUE IN", selected: true }, // This status is not a default status in the DB. It is a subset of "Reserved"
    { id: -1, status: "DUE OUT", selected: true }, // This status is not a default status in the DB. It is a subset of "Checked In"
    { id: 1, status: "RESERVED", selected: true }, { id: 2, status: "CHECKED IN", selected: true }, { id: 3, status: "CHECKED OUT", selected: true }, { id: 4, status: "NO SHOW", selected: true }, { id: 5, status: "CANCEL", selected: true }];

    var RESERVATION_STATUS_GUEST_BALANCE_REPORT = [{ id: -1, status: "DUE OUT", selected: true }, { id: 2, status: "CHECKED IN", selected: true }, { id: 3, status: "CHECKED OUT", selected: true }, { id: 4, status: "NO SHOW", selected: true }, { id: 5, status: "CANCEL", selected: true }];

    // Extract rate types and rates list
    var extractRateTypesFromRateTypesAndRateList = function extractRateTypesFromRateTypesAndRateList(rateTypesAndRateList) {
        var rateTypeListIds = _.pluck(rateTypesAndRateList, "rate_type_id"),
            rateTypeListIds = _.unique(rateTypeListIds),
            rateTypeObject = {},
            rateTypeListToReturn = rateTypeListIds.map(function (id) {
            rateTypeObject = _.findWhere(rateTypesAndRateList, { rate_type_id: id });
            if (rateTypeObject) {
                rateTypeObject.name = rateTypeObject.rate_type_name;
                rateTypeObject = _.pick(rateTypeObject, "name", "rate_type_id", "selected");
            }
            return rateTypeObject;
        });

        return rateTypeListToReturn;
    };

    // Extract rates from rate types
    var extractRatesFromRateTypesAndRateList = function extractRatesFromRateTypesAndRateList(rateTypesAndRateList) {
        return rateTypesAndRateList.map(function (rate) {
            rate.name = rate.rate_name;
            return _.omit(rate, "rate_type_name");
        });
    };

    /**
     * This function canshowActionables return CG & CC with no payment entries or with only payment entries
     * @param  {Array} chargeGroyearupsAry Array of charge groups
     * @param  {Array} chargeCodesAry  Array of charge codehasMinRevenues
     * @param  {String} setting         Remove payments or only payments
     * @return {Object}                 Processed CG & CC
     */
    var __adjustChargeGroupsCodes = function __adjustChargeGroupsCodes(chargeGroupsAry, chargeCodesAry, setting, selected) {
        var chargeGroupsAryCopy,
            chargeCodesAryCopy,
            newChargeGroupsAry = [],
            newChargeCodesAry = [],
            paymentId = null,
            cgAssociated = false,
            paymentEntry = {};

        var selected = 'boolean' === typeof selected ? selected : true;

        chargeGroupsAryCopy = angular.copy(chargeGroupsAry);
        chargeCodesAryCopy = angular.copy(chargeCodesAry);

        if ('REMOVE_PAYMENTS' === setting) {
            _.each(chargeGroupsAryCopy, function (each) {
                if (each.name !== 'Payments') {
                    each.selected = selected;
                    newChargeGroupsAry.push(each);
                } else {
                    paymentId = each.id;
                }
            });

            _.each(chargeCodesAryCopy, function (each) {
                cgAssociated = _.find(each['associcated_charge_groups'], function (idObj) {
                    return idObj.id === paymentId;
                });

                if (!cgAssociated) {
                    each.selected = selected;
                    newChargeCodesAry.push(each);
                }
            });
        } else if ('ONLY_PAYMENTS' === setting) {
            paymentEntry = _.find(chargeGroupsAryCopy, function (each) {
                return 'Payments' === each.name;
            });

            if (!!paymentEntry) {
                paymentId = paymentEntry.id;
                paymentEntry.selected = selected;
                newChargeGroupsAry.push(paymentEntry);

                _.each(chargeCodesAryCopy, function (each) {
                    cgAssociated = _.find(each['associcated_charge_groups'], function (idObj) {
                        return idObj.id === paymentId;
                    });

                    if (!!cgAssociated) {
                        each.selected = selected;
                        newChargeCodesAry.push(each);
                    }
                });
            }
        } else {
            _.each(chargeGroupsAryCopy, function (each) {
                each.selected = selected;
                newChargeGroupsAry.push(each);
            });

            _.each(chargeCodesAryCopy, function (each) {
                each.selected = selected;
                newChargeCodesAry.push(each);
            });
        }

        return {
            'chargeGroups': newChargeGroupsAry,
            'chargeCodes': newChargeCodesAry
        };
    };

    var selectAllAddonGroups = function selectAllAddonGroups(data) {
        var data = data;

        _.each(data, function (item) {
            item.selected = true;
        });

        return data;
    };

    var selectAllAddons = function selectAllAddons(data) {
        var data = data;

        _.each(data, function (item) {
            _.each(item['list_of_addons'], function (entry) {
                entry.selected = true;
            });
        });

        return data;
    };

    /**
     * A generic method to properly and effeciently set data for report filters, or anything for that matter
     * @param  {Object} objRef   The Object where we are going to set/update the key value
     * @param  {String} key      The name of the key
     * @param  {Anything} value  The value to be set in objRef
     */
    var __setData = function __setData(objRef, key, value) {

        // if the key doesnt exist on the objRef, create it
        if (!objRef.hasOwnProperty(key)) {
            objRef[key] = {};
        }

        // merge value when its an object, else just assign
        if ('object' === (typeof value === 'undefined' ? 'undefined' : _typeof(value))) {
            // DAMN! Our Angular version is very very old. Cant use this:
            // angular.merge( {}, objRef[key], value );
            $.extend(true, objRef[key], value);
        } else {
            objRef[key] = value;
        }
    };

    /** @type {Object} Array of all the filter values, new values added in future can be included here */
    var __optionFilterNames = {
        'INCLUDE_GUEST_NOTES': true,
        'INCLUDE_RESERVATION_NOTES': true,
        'VIP_ONLY': true,
        'INCLUDE_VARIANCE': true,
        'INCLUDE_LAST_YEAR': true,
        'INCLUDE_CANCELLED': true,
        'INCLUDE_CANCELED': true,
        'INCLUDE_NO_SHOW': true,
        'SHOW_GUESTS': true,
        'ROVER': true,
        'ZEST': true,
        'ZEST_WEB': true,
        'DEPOSIT_PAID': true,
        'DEPOSIT_DUE': true,
        'DEPOSIT_PAST': true,
        'DUE_IN_ARRIVALS': true,
        'DUE_OUT_DEPARTURES': true,
        'INCLUDE_NEW': true,
        'INCLUDE_BOTH': true,
        'EXCLUDE_NON_GTD': true,
        'SHOW_RATE_ADJUSTMENTS_ONLY': true,
        'INCLUDE_TAX': true,
        'INCLUDE_TAX_RATE': true,
        'INCLUDE_ADDON_RATE': true,
        'INCLUDE_ADDONS': true,
        'INCLUDE_ADDON_REVENUE': true,
        'INCLUDE_ACTIONS': true,
        'INCLUDE_LEDGER_DATA': true,
        'HAS_VEHICLE_REG_NO': true,
        'SHOW_PHONE_NUMBER': true
    };

    var __excludeFilterNames = {
        'EXCLUDE_TAX': true
    };

    var __displayFilterNames = {
        'INCLUDE_MARKET': true,
        'INCLUDE_SOURCE': true,
        'INCLUDE_ORIGIN': true,
        'INCLUDE_SEGMENT': true
    };

    var __guestOrAccountFilterNames = {
        'GUEST': true,
        'ACCOUNT': true
    };

    var __showFilterNames = {
        'SHOW_COMPANY': true,
        'SHOW_TRAVEL_AGENT': true,

        // for CREDIT_CHECK_REPORT
        'INCLUDE_DUE_OUT': true,
        'INCLUDE_INHOUSE': true,
        'RESTRICTED_POST_ONLY': true,
        'EXCEEDED_ONLY': true,

        // for room ooo oos report
        OOO: true,
        OOS: true
    };

    var __chargeTypeFilterNames = {
        SHOW_DELETED_CHARGES: true,
        SHOW_ADJUSTMENTS: true
    };

    /**
     * Create a DS representing the found filter into the general options DS
     * @param {Object} report The ith report object
     * @param {Object} filter The ith report's filter object
     */
    var __pushGeneralOptionData = function __pushGeneralOptionData(report, filter, selected) {
        var selected = (typeof selected === 'undefined' ? 'undefined' : _typeof(selected)) === _typeof(true) ? selected : false,
            mustSend = false,
            isRadioOption = false;

        var includeCancelled = {
            'INCLUDE_CANCELLED': true,
            'INCLUDE_CANCELED': true
        },
            dueInDueOut = {
            'DUE_IN_ARRIVALS': true,
            'DUE_OUT_DEPARTURES': true
        },
            depositStatus = {
            'DEPOSIT_PAID': true,
            'DEPOSIT_DUE': true,
            'DEPOSIT_PAST': true
        };

        // if filter is this, make it selected by default
        if (report['title'] === reportNames['CANCELLATION_NO_SHOW'] && includeCancelled[filter.value]) {
            selected = true;
        }

        // if filter value is either of these, make it selected by default
        if (dueInDueOut[filter.value]) {
            selected = true;
        }

        // if filter value is either of these, must include when report submit
        if (depositStatus[filter.value]) {
            mustSend = true;
        }

        // if filter value is either of these, must include when report submit
        if (report['title'] === reportNames['FORECAST_GUEST_GROUPS'] && filter.value === 'EXCLUDE_NON_GTD') {
            selected = true;
        }

        if (report['title'] === reportNames['DAILY_PRODUCTION_DEMO'] && filter.value === 'EXCLUDE_TAX') {
            selected = true;
        }

        // if filter is this, make it selected by default
        if (report['title'] === reportNames['DAILY_PRODUCTION_ROOM_TYPE'] && filter.value === 'INCLUDE_ADDONS') {
            selected = true;
        }

        //  Include New option the default selected option CICO-34593
        if (report['title'] === reportNames['RESERVATIONS_BY_USER'] && filter.value === 'INCLUDE_NEW') {
            if (filter.value === 'INCLUDE_NEW') {
                selected = true;
            }

            if (filter.value === 'SHOW_RATE_ADJUSTMENTS_ONLY') {
                report.hasGeneralOptions.options.selectiveSingleSelectKey = filter.value.toLowerCase();
                report.hasGeneralOptions.options.noSelectAll = true;
            }
        }

        if (report['title'] === reportNames['IN_HOUSE_GUEST']) {
            if (filter.value === 'VIP_ONLY' || filter.value === 'RESTRICTED_POST_ONLY') {
                isRadioOption = true;
            }
        }

        report['hasGeneralOptions']['data'].push({
            id: filter.value.toLowerCase(),
            paramKey: filter.value.toLowerCase(),
            description: filter.description,
            selected: selected,
            mustSend: mustSend,
            isRadioOption: isRadioOption
        });

        // if filter value is either of these, selectAll should be false
        if (report['title'] === reportNames['ARRIVAL'] || report['title'] === reportNames['DEPARTURE']) {
            report.hasGeneralOptions.options.noSelectAll = true;
        }
    };

    /**
     * Create a DS representing the found filter into the display DS
     * @param {Object} report The ith report object
     * @param {Object} filter The ith report's filter object
     */
    var __pushDisplayData = function __pushDisplayData(report, filter) {
        var selected = false;

        if (report['title'] === reportNames['DAILY_PRODUCTION_DEMO'] && filter.value === 'INCLUDE_MARKET') {
            selected = true;
        }

        report['hasDisplay']['data'].push({
            paramKey: filter.value.toLowerCase(),
            description: filter.description,
            selected: selected
        });
    };

    /**
     * Create a DS representing the found filter into the display DS
     * @param {Object} report The ith report object
     * @param {Object} filter The ith report's filter object
     */
    var __pushGuestOrAccountData = function __pushGuestOrAccountData(report, filter) {
        report['hasGuestOrAccountFilter']['data'].push({
            paramKey: filter.value.toLowerCase(),
            description: filter.description,
            selected: true
        });
    };

    var __pushShowData = function __pushShowData(report, filter) {
        report['hasShow']['data'].push({
            paramKey: filter.value.toLowerCase(),
            description: filter.description,
            selected: filter.value === 'EXCEEDED_ONLY' ? false : true
        });
    };

    var __pushChargeTypeData = function __pushChargeTypeData(report, filter) {
        report['hasChargeTypes']['data'].push({
            paramKey: filter.value.toLowerCase(),
            description: filter.description,
            selected: true
        });
    };

    factory.addIncludeUserFilter = function (report) {
        switch (report['title']) {
            case reportNames['LOGIN_AND_OUT_ACTIVITY']:
            case reportNames['RATE_ADJUSTMENTS_REPORT']:
            case reportNames['RESERVATIONS_BY_USER']:
                report['filters'].push({
                    'value': "INCLUDE_USER_NAMES",
                    'description': "Include User Names"
                });
                break;
            case reportNames['ACTIONS_MANAGER']:
                report['filters'].push({
                    'value': "INCLUDE_COMPLETION_STATUS",
                    'description': "Include Completion status"
                }, {
                    'value': "INCLUDE_DEPARTMENTS",
                    'description': "Include Departments"
                });
                break;
            case reportNames['A/R_AGING']:
                report['filters'].push({
                    'value': "INCLUDE_AGING_BALANCE",
                    'description': "Include Aging Balance"
                }, {
                    'value': "ACCOUNT_SEARCH",
                    'description': "Include Account Search"
                });
                break;
            case reportNames['FOLIO_TAX_REPORT']:
                report['filters'].push({
                    'value': "INCLUDE_LANGUAGE",
                    'description': "Include Language"
                });
                break;
            case reportNames['TAX_EXEMPT']:
                report['filters'].push({
                    'value': "SHOW_VAT_WITH_RATES",
                    'description': "VAT"
                });
                break;
            default:
                // no op
                break;
        }
    };
    factory.addIncludeOtherFilter = function (report) {
        switch (report['title']) {
            case reportNames['TRAVEL_AGENT_COMMISSIONS']:
                report['filters'].push({
                    'value': "INCLUDE_TRAVEL_AGENT",
                    'description': "Include Travel Agent"
                });
                break;

            case reportNames['YEARLY_TAX']:
                report['filters'].push({
                    'value': "VAT_YEAR",
                    'description': "Year"
                }, {
                    'value': "CO_TA_WITH_OR_WITHOUT_VAT",
                    'description': "company_travelagent_with_without_vat"
                });
                break;

            case reportNames['TAX_EXEMPT']:
                report['filters'].push({
                    'value': "INCLUDE_LONG_STAYS",
                    'description': "include_long_stays"
                });
                break;

            default:
                // no op
                break;
        }
    };

    /**
     * Process the filters and create proper DS to show and play in UI
     * @param  {Object} report The ith report
     * @param  {Object} data       Additonal data sources like CG, CC, Markets, Source etc
     */
    factory.processFilters = function (report, data) {

        if (report.hasUserFilter) {
            // label change as per CICO-29528
            report.filterTitle = report.title === reportNames['RESERVATIONS_BY_USER'] ? 'Users' : 'Employees';
            report.empList = {
                data: angular.copy(data.activeUserList),
                options: {
                    selectAll: true,
                    hasSearch: true,
                    key: 'full_name',
                    altKey: 'email'
                }
            };
        }

        // create DS for options combo box
        report.hasGeneralOptions = {
            data: [],
            options: {
                selectAll: false,
                hasSearch: false,
                key: 'description'
            }
        };

        // create a name space for chosen options
        report.chosenOptions = {};

        report.hasDisplay = {
            data: [],
            options: {
                selectAll: true,
                hasSearch: false,
                key: 'description',
                defaultValue: 'Select displays'
            }
        };

        // create DS for Exclude combo box
        report.hasExclusions = {
            data: [],
            options: {
                selectAll: false,
                hasSearch: false,
                key: 'description',
                defaultValue: 'Exclude',
                visible: true
            }
        };

        // create DS for guest or account
        report.hasGuestOrAccountFilter = {
            data: [],
            options: {
                selectAll: true,
                hasSearch: false,
                key: 'description'
            },
            affectsFilter: {
                name: 'hasReservationStatus',
                process: function process(filter, selectedItems) {
                    if (report['title'] === reportNames['GUEST_BALANCE_REPORT']) {
                        var hasGuest = !!_.find(selectedItems, { paramKey: 'guest' });
                        filter.updateData(!hasGuest);
                    }
                }
            }
        };

        // create DS for options combo box
        report.hasShow = {
            data: [],
            options: {
                selectAll: false,
                hasSearch: false,
                key: 'description',
                allValue: 'Both',
                defaultValue: 'Select options'
            }
        };

        // create DS for options combo box
        report.hasChargeTypes = {
            data: [],
            options: {
                selectAll: true,
                hasSearch: false,
                key: 'description'
            }
        };

        // going around and taking a note on filters
        _.each(report['filters'], function (filter) {

            if (filter.value === 'RATE_TYPE') {
                report['hasRateTypeFilter'] = filter;
            }

            if (filter.value === 'RATE') {
                report['hasRateFilter'] = filter;
            }

            if (filter.value === 'INCLUDE_DAY_USE') {
                report['hasDayUseFilter'] = filter;
            }

            if (filter.value === 'RATE_CODE') {
                report['hasRateCodeFilter'] = filter;
            }

            if (filter.value === 'ROOM_TYPE') {
                report['hasRoomTypeFilter'] = filter;
            }

            if (filter.value === 'RESTRICTION') {
                report['hasRestrictionListFilter'] = filter;
            }

            if (filter.value === 'ORIGIN') {
                report['hasOriginFilter'] = filter;
            }

            if (filter.value === 'URLS') {
                report['hasURLsList'] = filter;
            }

            if (filter.value === 'CAMPAIGN_TYPES') {
                report['hasCampaignTypes'] = filter;
            }

            // check for time filter and keep a ref to that item
            // create std 15min stepped time slots
            if (filter.value === 'TIME_RANGE') {
                report['hasTimeFilter'] = filter;
                report['timeFilterOptions'] = factory.createTimeSlots();
            }

            // check for CICO filter and keep a ref to that item
            // create the CICO filter options
            if (filter.value === 'CICO') {
                report['hasCicoFilter'] = filter;
                report['cicoOptions'] = [{
                    value: 'BOTH',
                    label: 'Show Check Ins and  Check Outs'
                }, {
                    value: 'IN',
                    label: 'Show only Check Ins'
                }, {
                    value: 'OUT',
                    label: 'Show only Check Outs'
                }];
            }

            if (filter.value === 'DAYS_0_30') {
                report['hasIncludeAgingBalance'] = filter;
            }

            if (filter.value === 'TAX_EXEMPT_TYPE') {
                report['hasIncludeTaxExempts'] = filter;
            }

            if (filter.value === 'ACCOUNT_SEARCH') {
                report['hasAccountSearch'] = filter;
            }

            if (filter.value === 'TRAVEL_AGENTS') {
                report['hasTravelAgentsSearch'] = filter;
            }

            // check for include company/ta filter and keep a ref to that item
            if (filter.value === 'INCLUDE_COMPANYCARD_TA' || filter.value === 'TA_CC_CARD') {
                report['hasIncludeCompanyTa'] = filter;
            }

            if (filter.value === 'INCLUDE_GROUP') {
                report['hasIncludeGroup'] = filter;
            }

            // check for include company/ta/group filter and keep a ref to that item
            if (filter.value === 'INCLUDE_COMPANYCARD_TA_GROUP' || filter.value === 'GROUP_COMPANY_TA_CARD') {
                report['hasIncludeCompanyTaGroup'] = filter;
            }

            if (filter.value === 'GROUP_CODE') {
                report['hasGroupCode'] = filter;
            }

            if (filter.value === 'MIN_REVENUE') {
                report['hasMinRevenue'] = filter;
            }
            if (filter.value === 'MIN_ROOM_NIGHTS') {
                report['hasMinRoomNights'] = filter;
            }

            if (filter.value === 'ACCOUNT_NAME') {
                report['hasIncludeAccountName'] = filter;
            }

            if (filter.value === 'COUNTRY') {
                report['hasIncludeCountry'] = filter;
            }

            if (filter.value === 'CO_TA_WITH_OR_WITHOUT_VAT') {
                report['hasCompanyTravelAgentWithOrWithoutVat'] = filter;
            }

            if (filter.value === 'SHOW_VAT_WITH_RATES') {
                report['hasShowVatWithRates'] = filter;
            }

            if (filter.value === 'INCLUDE_LONG_STAYS') {
                report['hasShowIncludeLongStays'] = filter;
            }

            if (filter.value === 'VAT_YEAR') {
                report['hasVatYear'] = filter;
                report['yearFilter'] = Array.from({ length: 10 }, function (v, i) {
                    return {
                        "value": moment().add(-1 * i, 'y').format('YYYY')
                    };
                });
                report['year'] = moment().format('YYYY');
            }

            if (filter.value === 'MIN_NUMBER_OF_DAYS_NOT_OCCUPIED') {
                report['hasMinNoOfDaysNotOccupied'] = filter;
            }

            if (filter.value === 'ACTIONS_BY') {
                var customData = [{
                    value: "GUEST",
                    name: "Guests"
                }];

                report.showActionables = "GUEST";

                if (!$rootScope.isHourlyRateOn) {
                    customData.push({ value: "GROUP", name: "Groups" });
                    customData.push({ value: "BOTH", name: "Both" });
                    report.showActionables = "BOTH";
                }
                report['hasShowActionables'] = {
                    data: customData,
                    options: {
                        key: 'name'
                    }
                };
            }

            if (filter.value === 'SHOW_UPSELL_ONLY') {
                report['hasShowUpsellOnly'] = filter;
            }

            // fill up DS for options combo box
            if (__optionFilterNames[filter.value]) {
                __pushGeneralOptionData(report, filter);
            }
            if (report.title === reportNames['IN_HOUSE_GUEST'] && filter.value === 'INCLUDE_DUE_OUT') {
                __pushGeneralOptionData(report, filter, true);
            }
            if (report.title === reportNames['IN_HOUSE_GUEST'] && filter.value === 'RESTRICTED_POST_ONLY' && $rootScope.isStandAlone) {
                __pushGeneralOptionData(report, filter, false);
            }

            if (report.title === reportNames['IN_HOUSE_GUEST'] && filter.value === 'NO_NATIONALITY') {
                __pushGeneralOptionData(report, filter, false);
            }

            // fill up DS for options combo box
            if (__excludeFilterNames[filter.value]) {
                var selected = false;

                if (report['title'] === reportNames['DAILY_PRODUCTION_DEMO'] || reportNames['DAILY_PRODUCTION_RATE'] || reportNames['DAILY_PRODUCTION_ROOM_TYPE']) {
                    report['hasExclusions'].options.selectAll = true;
                    report['hasExclusions'].options.visible = false;
                }

                report['hasExclusions'].data.push({
                    paramKey: filter.value.toLowerCase(),
                    description: filter.description,
                    selected: selected
                });
            }

            // fill up DS for display combo box
            if (__displayFilterNames[filter.value]) {

                // __pushDisplayData( report, filter );
                //
                // QUICK PATCH
                // TODO: replace with a better solution
                if (report.title === reportNames['MARKET_SEGMENT_STAT_REPORT']) {
                    if (filter.value === 'INCLUDE_MARKET' && data.codeSettings['is_market_on']) {
                        __pushDisplayData(report, filter);
                    } else if (filter.value === 'INCLUDE_ORIGIN' && data.codeSettings['is_origin_on']) {
                        __pushDisplayData(report, filter);
                    } else if (filter.value === 'INCLUDE_SEGMENT' && data.codeSettings['is_segments_on']) {
                        __pushDisplayData(report, filter);
                    } else if (filter.value === 'INCLUDE_SOURCE' && data.codeSettings['is_source_on']) {
                        __pushDisplayData(report, filter);
                    }
                } else {
                    __pushDisplayData(report, filter);
                }
            }

            // fill up DS for options combo box
            if (__guestOrAccountFilterNames[filter.value]) {
                __pushGuestOrAccountData(report, filter);
            }

            if (__showFilterNames[filter.value] && report.title !== reportNames['IN_HOUSE_GUEST']) {
                __pushShowData(report, filter);
            }

            if (__chargeTypeFilterNames[filter.value]) {
                __pushChargeTypeData(report, filter);
            }
        });
    };

    factory.findFillFilters = function (reportItem, reportList) {
        var deferred = $q.defer();

        var requested = 0,
            completed = 0;

        var checkAllCompleted = function checkAllCompleted() {
            if (completed === requested) {

                // tryin to figure out if all the filters for this
                // reportItem has been filled, if so make it 'allFiltersProcessed'
                anyFilterLeft = _.find(filters, function (each) {
                    return !each.hasOwnProperty('filled');
                });

                if (undefined === anyFilterLeft) {
                    reportItem.allFiltersProcessed = true;
                }

                // finally resolve the promise
                deferred.resolve();
            }
        };

        var filters = reportItem['filters'],
            anyFilterLeft = undefined;

        _.each(filters, function (filter) {

            if ('INCLUDE_GUARANTEE_TYPE' === filter.value && !filter.filled) {
                requested++;
                reportsSubSrv.fetchGuaranteeTypes().then(fillGarntTypes);
            } else if ('INCLUDE_GUARANTEE_TYPE' === filter.value && !filter.filled) {
                requested++;
                reportsSubSrv.fetchGuaranteeTypes().then(fillGarntTypes);
            } else if ('CHOOSE_MARKET' === filter.value && !filter.filled) {
                requested++;
                reportsSubSrv.fetchMarkets().then(fillMarkets);
            } else if ('CHOOSE_SEGMENT' === filter.value && !filter.filled) {
                requested++;
                reportsSubSrv.fetchSegments().then(fillSegments);
            } else if ('CHOOSE_SOURCE' === filter.value && !filter.filled) {
                requested++;
                reportsSubSrv.fetchSources().then(fillSources);
            } else if ('CHOOSE_BOOKING_ORIGIN' === filter.value && !filter.filled) {
                requested++;
                reportsSubSrv.fetchBookingOrigins().then(fillBookingOrigins);
            } else if ('HOLD_STATUS' === filter.value && !filter.filled) {
                requested++;
                reportsSubSrv.fetchHoldStatus().then(fillHoldStatus);
            } else if ('RESERVATION_STATUS' === filter.value && !filter.filled) {
                requested++;
                if (reportItem['title'] === reportNames['ACTIONS_MANAGER']) {
                    reportsSubSrv.getReservationStatus().then(fillResStatus);
                } else {
                    reportsSubSrv.fetchReservationStatus().then(fillResStatus);
                }
            } else if ('RATE' === filter.value && !filter.filled) {
                requested++;
                reportsSubSrv.fetchRateTypesAndRateList() // This would include custom rates
                .then(fillRateTypesAndRateList);
            } else if ('RATE_CODE' === filter.value && !filter.filled) {
                requested++;
                reportsSubSrv.fetchRateCode().then(fillRateCodeList);
            } else if ('ROOM_TYPE' === filter.value && !filter.filled) {
                requested++;
                reportsSubSrv.fetchRoomTypeList().then(fillRoomTypeList);
            } else if ('RATE_TYPE' === filter.value && !filter.filled) {
                requested++;
                reportsSubSrv.fetchRateTypesAndRateList().then(fillRateTypesAndRateList);
            } else if ('RESTRICTION' === filter.value && !filter.filled) {
                requested++;
                reportsSubSrv.fetchRestrictionList().then(fillRestrictionList);
            } else if ('INCLUDE_CHARGE_GROUP' === filter.value && !filter.filled || 'INCLUDE_CHARGE_CODE' === filter.value && !filter.filled || 'ADDON_GROUPS' === filter.value && !filter.filled || 'SHOW_CHARGE_CODES' === filter.value && !filter.filled) {
                requested++;
                reportsSubSrv.fetchChargeNAddonGroups({ for_addon_forecast_report: reportItem.title === 'Add-On Forecast', include_payment: reportItem.title === 'Financial Transaction - Revenue Report' }).then(function (chargeNAddonGroups) {

                    // then fetch charge code
                    requested++;
                    reportsSubSrv.fetchChargeCodes().then(fillCGCC.bind(null, chargeNAddonGroups));

                    // along with that fetch addons
                    requested++;
                    reportsSubSrv.fetchAddons({ 'addon_group_ids': _.pluck(chargeNAddonGroups, 'id') }).then(fillAGAs.bind(null, chargeNAddonGroups));
                });
            } else if ('ALLOWANCE_CODE' === filter.value && !filter.filled) {
                requested++;
                reportsSubSrv.fetchAllowances().then(fillAllowances);
            } else if ('URLS' === filter.value && !filter.filled) {
                requested++;
                reportsSubSrv.fetchURLs().then(fillURLs);
            } else if ('ORIGIN' === filter.value && !filter.filled) {
                requested++;
                reportsSubSrv.fetchOrigins().then(fillOrigins);
            } else if ('CAMPAIGN_TYPES' === filter.value && !filter.filled) {
                requested++;
                reportsSubSrv.fetchCampaignTypes().then(fillCampaignTypes);
            } else if ('FLOOR' === filter.value && !filter.filled) {
                requested++;
                reportsSubSrv.fetchFloors().then(fillFloors);
            } else if ('INCLUDE_DEPARTMENTS' === filter.value && !filter.filled) {
                requested++;
                reportsSubSrv.fetchDepartments().then(fillDepartments);
            } else if ('TRANSACTION_CATEGORY' === filter.value && !filter.filled) {
                fillTransactionCategory();
            } else if ('SHOW_EMPLOYEES_INCLUDING_EOD' === filter.value && !filter.filled) {
                requested++;
                reportsSubSrv.fetchEmployees().then(fillEmployeeList);
            } else if ('INCLUDE_COMPLETION_STATUS' === filter.value && !filter.filled) {
                fillCompletionStatus();
            } else if ('INCLUDE_AGING_BALANCE' === filter.value && !filter.filled) {
                fillAgingBalance();
            } else if ('PAYMENT_TYPES' === filter.value && !filter.filled) {
                requested++;
                reportsSubSrv.fetchPaymentTypes().then(fillPaymentType);
            } else if ('INCLUDE_LANGUAGE' === filter.value && !filter.filled) {
                requested++;
                reportsSubSrv.fetchLanguages().then(fillLanguages);
            } else if ('TAX_EXEMPT_TYPE' === filter.value && !filter.filled) {
                requested++;
                reportsSubSrv.fetchTaxExemptTypes().then(fillTaxExemptTypes);
            } else if ('ACCOUNT_SEARCH' === filter.value && !filter.filled) {
                requested++;
                reportsSubSrv.fetchAccounts().then(fillAccounts);
            } else if ('INCLUDE_TRAVEL_AGENT' === filter.value && !filter.filled) {
                requested++;
                reportsSubSrv.fetchTravelAgents().then(fillTravelAgents);
            } else if ('COUNTRY' === filter.value && !filter.filled) {
                requested++;
                reportsSubSrv.fetchCountries().then(fillCountries);
            } else if ('INCLUDE_DAY_USE' === filter.value && !filter.filled) {
                setIncludeDayuseFlag();
            } else if ('SHOW_UPSELL_ONLY' === filter.value) {
                reportItem[reportParams['SHOW_UPSELL_ONLY']] = true;
            } else if ('TAX_PAYMENT_RECEIPT_TYPE' === filter.value && !filter.filled) {
                requested++;
                reportsSubSrv.fetchTaxPaymentReceiptTypes().then(fillTaxPaymentReceiptTypes);
            } else if ('EXPANDED_OR_COLLAPSED' === filter.value && !filter.filled) {
                fillCollapsedOrExpanded();
            } else {
                // no op
            }
        });

        // lets just resolve the deferred already!
        if (0 === requested) {
            checkAllCompleted();
        }

        function fillGarntTypes(data) {
            var foundFilter;

            // Add UNDEFINED option to garantee drop down CICO-34593
            var UNDEFINED = {
                is_active: true,
                name: 'UNDEFINED',
                value: -1
            };

            var undefinedEntry = _.find(data, { name: 'UNDEFINED' });

            if (!undefinedEntry) {
                data.push(UNDEFINED);
            }
            _.each(reportList, function (report) {
                foundFilter = _.find(report['filters'], { value: 'INCLUDE_GUARANTEE_TYPE' });

                if (!!foundFilter) {
                    foundFilter['filled'] = true;

                    report.hasGuaranteeType = {
                        data: angular.copy(data),
                        options: {
                            selectAll: report['title'] === reportNames['RESERVATIONS_BY_USER'] ? true : false,
                            hasSearch: true,
                            key: 'name',
                            defaultValue: 'Select guarantees'
                        }
                    };
                }
            });

            completed++;
            checkAllCompleted();
        }

        function fillTaxPaymentReceiptTypes(data) {
            var foundFilter;

            _.each(reportList, function (report) {
                foundFilter = _.find(report['filters'], { value: 'TAX_PAYMENT_RECEIPT_TYPE' });

                if (!!foundFilter) {
                    foundFilter['filled'] = true;

                    report.hasTaxPaymentReceiptTypes = {
                        data: angular.copy(data),
                        options: {
                            selectAll: report['title'] === reportNames['TAX_OUTPUT_REPORT'] ? true : false,
                            hasSearch: false,
                            key: 'name',
                            defaultValue: 'Select payment receipt'
                        }
                    };
                }
            });

            completed++;
            checkAllCompleted();
        }

        function fillCollapsedOrExpanded() {
            var customData = [{ id: 1, value: "Expanded", description: "Expanded" }, { id: 2, value: "Collapsed", description: "Collapsed" }],
                foundFilter;

            _.each(reportList, function (report) {
                foundFilter = _.find(report['filters'], { value: 'EXPANDED_OR_COLLAPSED' });
                if (!!foundFilter) {
                    foundFilter['filled'] = true;

                    report.hasCollapsedOrExpanded = {
                        data: customData,
                        selected: customData[0]
                    };
                }
            });
        }

        function fillAccounts(data) {
            var foundFilter;

            _.each(reportList, function (report) {
                foundFilter = _.find(report['filters'], { value: 'ACCOUNT_SEARCH' });

                if (!!foundFilter) {
                    foundFilter['filled'] = true;

                    report.hasAccountSearch = {
                        data: angular.copy(data),
                        options: {
                            selectAll: false,
                            hasSearch: true,
                            key: 'account_name',
                            defaultValue: 'Select Accounts'
                        }
                    };
                }
            });

            completed++;
            checkAllCompleted();
        }

        function fillTravelAgents(data) {
            var foundFilter;

            _.each(reportList, function (report) {
                foundFilter = _.find(report['filters'], { value: 'TRAVEL_AGENTS' });

                if (!!foundFilter) {
                    foundFilter['filled'] = true;

                    report.hasTravelAgentsSearch = {
                        data: angular.copy(data),
                        options: {
                            selectAll: false,
                            hasSearch: true,
                            key: 'account_name',
                            defaultValue: 'Select TA'
                        }
                    };
                }
            });

            completed++;
            checkAllCompleted();
        }

        function fillCountries(data) {
            var foundFilter;

            _.each(reportList, function (report) {
                foundFilter = _.find(report['filters'], { value: 'COUNTRY' });

                if (!!foundFilter) {
                    foundFilter['filled'] = true;

                    report.hasIncludeCountry = {
                        data: angular.copy(data),
                        options: {
                            selectAll: false,
                            hasSearch: true,
                            key: 'value',
                            defaultValue: 'Select Country'
                        }
                    };
                }
            });

            completed++;
            checkAllCompleted();
        }

        function fillMarkets(data) {
            var foundFilter;

            // Add UNDEFINED option to market drop down CICO-34593
            var UNDEFINED = {
                is_active: true,
                name: 'UNDEFINED',
                value: -1
            };

            var undefinedEntry = _.find(data, { name: 'UNDEFINED' });

            if (!undefinedEntry) {
                data.push(UNDEFINED);
            }

            _.each(reportList, function (report) {
                foundFilter = _.find(report['filters'], { value: 'CHOOSE_MARKET' });

                if (!!foundFilter) {
                    foundFilter['filled'] = true;
                    report.hasMarketsList = {
                        data: angular.copy(data),
                        options: {
                            selectAll: report['title'] === reportNames['RESERVATIONS_BY_USER'] ? true : false,
                            hasSearch: false,
                            key: 'name'
                        }
                    };
                }
            });

            completed++;
            checkAllCompleted();
        }

        function fillSegments(data) {
            var foundFilter;

            // Add UNDEFINED option to segment drop down CICO-34593
            var UNDEFINED = {
                is_active: true,
                name: 'UNDEFINED',
                value: -1
            };

            var undefinedEntry = _.find(data, { name: 'UNDEFINED' });

            if (!undefinedEntry) {
                data.push(UNDEFINED);
            }

            _.each(reportList, function (report) {
                foundFilter = _.find(report['filters'], { value: 'CHOOSE_SEGMENT' });

                if (!!foundFilter) {
                    foundFilter['filled'] = true;
                    report.hasSegmentsList = {
                        data: angular.copy(data),
                        options: {
                            selectAll: report['title'] === reportNames['RESERVATIONS_BY_USER'] ? true : false,
                            hasSearch: false,
                            key: 'name'
                        }
                    };
                }
            });

            completed++;
            checkAllCompleted();
        }

        function fillSources(data) {
            var foundFilter;

            // Add UNDEFINED option to source drop down CICO-34593
            var UNDEFINED = {
                is_active: true,
                name: 'UNDEFINED',
                value: -1
            };

            var undefinedEntry = _.find(data, { name: 'UNDEFINED' });

            if (!undefinedEntry) {
                data.push(UNDEFINED);
            }

            _.each(reportList, function (report) {
                foundFilter = _.find(report['filters'], { value: 'CHOOSE_SOURCE' });

                if (!!foundFilter) {
                    foundFilter['filled'] = true;
                    report.hasSourcesList = {
                        data: angular.copy(data),
                        options: {
                            selectAll: report['title'] === reportNames['RESERVATIONS_BY_USER'] ? true : false,
                            hasSearch: false,
                            key: 'name'
                        }
                    };
                    report['filters']['filled'] = true;
                }
            });

            completed++;
            checkAllCompleted();
        }

        function fillBookingOrigins(data) {
            var foundFilter;

            // Add UNDEFINED option to origin drop down CICO-34593
            var UNDEFINED = {
                is_active: true,
                name: 'UNDEFINED',
                value: -1
            };

            var undefinedEntry = _.find(data, { name: 'UNDEFINED' });

            if (!undefinedEntry) {
                data.push(UNDEFINED);
            }

            _.each(reportList, function (report) {
                foundFilter = _.find(report['filters'], { value: 'CHOOSE_BOOKING_ORIGIN' });

                if (!!foundFilter) {
                    foundFilter['filled'] = true;
                    report.hasOriginsList = {
                        data: angular.copy(data),
                        options: {
                            selectAll: report['title'] === reportNames['RESERVATIONS_BY_USER'] ? true : false,
                            hasSearch: false,
                            key: 'name'
                        }
                    };
                }
            });

            completed++;
            checkAllCompleted();
        }

        function fillHoldStatus(data) {
            var foundFilter;

            _.each(reportList, function (report) {
                foundFilter = _.find(report['filters'], { value: 'HOLD_STATUS' });

                if (!!foundFilter) {
                    foundFilter['filled'] = true;
                    report.hasHoldStatus = {
                        data: angular.copy(data),
                        options: {
                            hasSearch: false,
                            selectAll: true,
                            key: 'name'
                        }
                    };
                }
            });

            completed++;
            checkAllCompleted();
        }

        function fillResStatus(data) {
            var foundFilter, customData;

            _.each(reportList, function (report) {
                foundFilter = _.find(report['filters'], { value: 'RESERVATION_STATUS' });
                if (!!foundFilter) {
                    foundFilter['filled'] = true;

                    // CICO-20405: Required custom data for only deposit reports ¯\_(ツ)_/¯
                    customData = angular.copy(data);
                    if (report['title'] === reportNames['DEPOSIT_REPORT']) {
                        customData = angular.copy(ALT_RESERVATION_STATUS);
                    } else if (report['title'] === reportNames['GUEST_BALANCE_REPORT']) {
                        customData = angular.copy(RESERVATION_STATUS_GUEST_BALANCE_REPORT);
                    } else if (reportItem['title'] === reportNames['ACTIONS_MANAGER']) {
                        customData.push({ id: null, value: "DUE_IN", description: "Due In" }, { id: null, value: "DUE_OUT", description: "Due Out" });
                    }

                    report.hasReservationStatus = {
                        data: customData,
                        options: {
                            hasSearch: false,
                            selectAll: true,
                            key: reportItem['title'] === reportNames['ACTIONS_MANAGER'] ? 'value' : 'status',
                            defaultValue: 'Select Status'
                        },
                        originalData: angular.copy(customData),
                        updateData: function updateData(shouldHide) {
                            if (shouldHide && this.data.length > 0) {
                                this.data = [];
                            } else if (!shouldHide && this.data.length === 0) {
                                this.data = angular.copy(this.originalData);
                                _.each(this.data, function (v) {
                                    v.selected = true;
                                });
                            }
                        }
                    };
                }
            });

            completed++;
            checkAllCompleted();
        }

        function fillCompletionStatus() {
            var customData = [{ id: "UNASSIGNED", status: "UNASSIGNED", selected: true }, { id: "ASSIGNED", status: "ASSIGNED", selected: true }, { id: "COMPLETED", status: "COMPLETED", selected: true }],
                foundFilter;

            _.each(reportList, function (report) {
                foundFilter = _.find(report['filters'], { value: 'INCLUDE_COMPLETION_STATUS' });
                if (!!foundFilter) {
                    foundFilter['filled'] = true;

                    report.hasCompletionStatus = {
                        data: customData,
                        options: {
                            hasSearch: false,
                            selectAll: true,
                            key: 'status',
                            defaultValue: 'Select Status'
                        }
                    };
                }
            });
        }

        function fillTaxExemptTypes(data) {

            var foundFilter;

            _.each(reportList, function (report) {
                foundFilter = _.find(report['filters'], { value: 'TAX_EXEMPT_TYPE' });
                if (!!foundFilter) {
                    foundFilter['filled'] = true;
                    report.hasIncludeTaxExempts = {
                        data: data,
                        options: {
                            hasSearch: true,
                            selectAll: true,
                            key: 'name'
                        }
                    };
                }
            });
            completed++;
            checkAllCompleted();
        }

        function fillAgingBalance() {
            var customData = [{ id: "0to30", status: "0-30 DAYS", selected: true }, { id: "31to60", status: "31-60 DAYS", selected: true }, { id: "61to90", status: "61-90 DAYS", selected: true }, { id: "91to120", status: "91-120 DAYS", selected: true }, { id: "120plus", status: "120+ DAYS", selected: true }],
                foundFilter;
            _.each(reportList, function (report) {
                foundFilter = _.find(report['filters'], { value: 'INCLUDE_AGING_BALANCE' });
                if (!!foundFilter) {
                    foundFilter['filled'] = true;

                    report.hasIncludeAgingBalance = {
                        data: customData,
                        options: {
                            hasSearch: false,
                            selectAll: true,
                            key: 'status',
                            defaultValue: 'Select Aging Balance'
                        }
                    };
                }
            });
        }

        function fillTransactionCategory() {
            var customData = [{ id: 1, value: "TOTAL", description: "Total" }, { id: 2, value: "PRE STAY", description: "Pre Stay" }, { id: 3, value: "IN HOUSE", description: "In House" }, { id: 4, value: "POST STAY", description: "Post Stay" }],
                foundFilter;

            _.each(reportList, function (report) {
                foundFilter = _.find(report['filters'], { value: 'TRANSACTION_CATEGORY' });
                if (!!foundFilter) {
                    foundFilter['filled'] = true;

                    report.hasTransactionCategory = {
                        data: customData
                    };
                }
            });
        }

        function fillEmployeeList(data) {
            var foundFilter;

            _.each(reportList, function (report) {
                foundFilter = _.find(report['filters'], { value: 'SHOW_EMPLOYEES_INCLUDING_EOD' });
                if (!!foundFilter) {
                    foundFilter['filled'] = true;

                    report.filterTitle = 'Employees';
                    report.empList = {
                        data: angular.copy(data),
                        options: {
                            hasSearch: true,
                            selectAll: true,
                            key: 'full_name',
                            defaultValue: 'Selected Employee'
                        }
                    };
                }
            });

            completed++;
            checkAllCompleted();
        }

        function fillPaymentType(data) {
            var foundFilter;

            _.each(reportList, function (report) {

                foundFilter = _.find(report['filters'], { value: 'PAYMENT_TYPES' });
                if (!!foundFilter) {
                    foundFilter['filled'] = true;

                    report.hasPaymentType = {
                        data: angular.copy(data),
                        options: {
                            hasSearch: false,
                            selectAll: true,
                            noSelectAll: true,
                            key: 'description',
                            defaultValue: 'Show All'
                        }

                    };
                }
            });

            completed++;
            checkAllCompleted();
        }

        function fillDepartments(data) {
            var foundFilter, customData;

            _.each(data, function (departmentData) {
                departmentData.id = departmentData.value;
            });

            _.each(reportList, function (report) {
                foundFilter = _.find(report['filters'], { value: 'INCLUDE_DEPARTMENTS' });
                if (!!foundFilter) {
                    foundFilter['filled'] = true;

                    report.hasDepartments = {
                        data: angular.copy(data),
                        options: {
                            hasSearch: false,
                            selectAll: true,
                            key: 'name',
                            defaultValue: 'Select Department'
                        }
                    };
                }
            });

            completed++;
            checkAllCompleted();
        }

        function fillLanguages(data) {
            var foundFilter, customData;

            _.each(reportList, function (report) {
                foundFilter = _.find(report['filters'], { value: 'INCLUDE_LANGUAGE' });
                if (!!foundFilter) {
                    foundFilter['filled'] = true;

                    report.hasLanguages = {
                        data: angular.copy(data),
                        options: {
                            hasSearch: false,
                            selectAll: true,
                            key: 'language',
                            defaultValue: 'Select Language'
                        }
                    };
                }
            });

            completed++;
            checkAllCompleted();
        }

        function fillRateCodeList(data) {
            var foundFilter;

            data[0].selected = true;
            _.each(reportList, function (report) {
                foundFilter = _.find(report['filters'], { value: 'RATE_CODE' });
                if (!!foundFilter) {
                    foundFilter['filled'] = true;

                    // CICO-37341 - Added new entry UNDEFINED for custom rate
                    if (report['title'] === reportNames['RESERVATIONS_BY_USER']) {
                        var hasCustomRateItemPresent = _.find(data, { id: -1 });

                        if (!hasCustomRateItemPresent) {
                            var customRate = {
                                id: -1,
                                description: "UNDEFINED"
                            };

                            data.push(customRate);
                        }
                    }

                    report.hasRateCodeFilter = {
                        data: angular.copy(data),
                        options: {
                            hasSearch: true,
                            selectAll: report['title'] === reportNames['RESERVATIONS_BY_USER'] ? true : false,
                            singleSelect: report['title'] === reportNames['RESERVATIONS_BY_USER'] ? false : true,
                            key: 'description',
                            defaultValue: 'Select Rate'
                        }
                    };
                }
            });

            completed++;
            checkAllCompleted();
        }

        function fillRoomTypeList(data) {
            var foundFilter;

            _.each(reportList, function (report) {
                foundFilter = _.find(report['filters'], { value: 'ROOM_TYPE' });
                if (!!foundFilter) {
                    // hidden since we need to go through the list for diff reports
                    // foundFilter['filled'] = true;

                    //  we need suite room type for reservation by user report
                    if (reportItem['title'] !== reportNames['RESERVATIONS_BY_USER'] && reportItem['title'] !== reportNames['RATE_RESTRICTION_REPORT']) {
                        var selectedData = _.filter(data, function (rooms) {
                            return !rooms.is_suite && !rooms.is_pseudo;
                        });

                        data = selectedData;
                    }

                    report.hasRoomTypeFilter = {
                        data: angular.copy(data),
                        options: {
                            hasSearch: false,
                            selectAll: true,
                            key: 'name'
                        }
                    };
                }
            });

            completed++;
            checkAllCompleted();
        }

        function setIncludeDayuseFlag() {
            var foundFilter;

            _.each(reportList, function (report) {
                foundFilter = _.find(report['filters'], { value: 'INCLUDE_DAY_USE' });
                if (!!foundFilter) {
                    foundFilter['filled'] = true;
                    report[reportParams['INCLUDE_DAYUSE']] = true;
                }
            });
        }

        function fillRestrictionList(data) {
            var foundFilter;

            _.each(reportList, function (report) {
                foundFilter = _.find(report['filters'], { value: 'RESTRICTION' });
                if (!!foundFilter) {
                    foundFilter['filled'] = true;

                    report.hasRestrictionListFilter = {
                        data: angular.copy(data),
                        options: {
                            hasSearch: false,
                            selectAll: true,
                            key: 'description',
                            defaultValue: 'Select Restriction(s)'
                        }
                    };
                }
            });

            completed++;
            checkAllCompleted();
        }

        function fillOrigins(data) {
            var foundFilter;

            _.each(reportList, function (report) {
                foundFilter = _.find(report['filters'], { value: 'ORIGIN' });
                if (!!foundFilter) {
                    foundFilter['filled'] = true;
                    report.hasOriginFilter = {
                        data: angular.copy(data),
                        options: {
                            hasSearch: false,
                            selectAll: true,
                            key: 'description',
                            defaultValue: 'Select Origin(s)'
                        },
                        affectsFilter: {
                            name: 'hasURLsList',
                            process: function process(filter, selectedItems) {
                                var hasUrl = _.find(selectedItems, { value: 'URL' }),
                                    hasUrlFilter = _.find(report['filters'], { value: 'URLS' });

                                //CICO-59057
                                if (hasUrlFilter) {
                                    filter.updateData(!hasUrl);
                                }
                            }
                        }
                    };
                }
            });

            completed++;
            checkAllCompleted();
        }

        function fillURLs(data) {
            var foundFilter;

            _.each(reportList, function (report) {
                foundFilter = _.find(report['filters'], { value: 'URLS' });
                if (!!foundFilter) {
                    foundFilter['filled'] = true;
                    report.hasURLsList = {
                        data: angular.copy(data),
                        originalData: angular.copy(data),
                        options: {
                            hasSearch: false,
                            selectAll: true,
                            key: 'name',
                            defaultValue: 'Select URL(s)'
                        },
                        updateData: function updateData(shouldHide) {
                            this.data = shouldHide ? [] : this.originalData;
                        }
                    };
                }
            });

            completed++;
            checkAllCompleted();
        }

        function fillAllowances(data) {
            var foundFilter;

            _.each(reportList, function (report) {
                foundFilter = _.find(report['filters'], { value: 'ALLOWANCE_CODE' });
                if (!!foundFilter) {
                    foundFilter['filled'] = true;
                    report.hasAllowanceCodes = {
                        data: angular.copy(data),
                        originalData: angular.copy(data),
                        options: {
                            hasSearch: false,
                            selectAll: true,
                            key: 'name',
                            defaultValue: 'Select Allowance(-s)'
                        },
                        updateData: function updateData(shouldHide) {
                            this.data = shouldHide ? [] : this.originalData;
                        }
                    };
                }
            });

            completed++;
            checkAllCompleted();
        }

        function fillCampaignTypes(data) {
            var foundFilter;

            _.each(reportList, function (report) {
                foundFilter = _.find(report['filters'], { value: 'CAMPAIGN_TYPES' });
                if (!!foundFilter) {
                    foundFilter['filled'] = true;
                    report.hasCampaignTypes = {
                        data: angular.copy(data),
                        originalData: angular.copy(data),
                        options: {
                            hasSearch: false,
                            selectAll: true,
                            key: 'name',
                            defaultValue: 'Select Campaign Type(s)'
                        },
                        updateData: function updateData(shouldHide) {
                            this.data = shouldHide ? [] : this.originalData;
                        }
                    };
                }
            });

            completed++;
            checkAllCompleted();
        }

        function fillFloors(data) {
            var foundFilter;

            _.each(reportList, function (report) {
                foundFilter = _.find(report['filters'], { value: 'FLOOR' });
                if (!!foundFilter) {
                    foundFilter['filled'] = true;
                    report.hasFloorList = {
                        data: angular.copy(data),
                        options: {
                            hasSearch: false,
                            selectAll: true,
                            key: 'floor_number',
                            defaultValue: 'Select Floors(s)'
                        }
                    };
                }
            });

            completed++;
            checkAllCompleted();
        }

        //
        function fillRateTypesAndRateList(data) {
            var foundFilter;

            // default all are selected for rate & rate types
            _.each(data, function (rate) {
                rate.selected = true;
            });

            _.each(reportList, function (report) {
                foundFilter = _.find(report['filters'], { value: 'RATE' });
                if (!!foundFilter) {
                    foundFilter['filled'] = true;

                    report.hasRateTypeFilter = {
                        data: angular.copy(extractRateTypesFromRateTypesAndRateList(data)),
                        options: {
                            selectAll: true,
                            hasSearch: true,
                            key: 'name'
                        }
                    };

                    report.hasRateFilter = {
                        data: angular.copy(extractRatesFromRateTypesAndRateList(data)),
                        options: {
                            selectAll: true,
                            hasSearch: true,
                            key: 'name'
                        }
                    };
                }
            });

            completed++;
            checkAllCompleted();
        }

        // fill charge group and charge codes
        function fillCGCC(chargeNAddonGroups, chargeCodes) {
            var foundCG, foundCC, processedCGCC;

            var title, selected;

            var foundCCC;

            _.each(reportList, function (report) {

                if (report['title'] === reportNames['DAILY_TRANSACTIONS']) {
                    selected = true;
                    processedCGCC = __adjustChargeGroupsCodes(chargeNAddonGroups, chargeCodes, 'REMOVE_PAYMENTS', selected);
                }
                /**/
                else if (report['title'] === reportNames['DAILY_PAYMENTS']) {
                        selected = true;
                        processedCGCC = __adjustChargeGroupsCodes(chargeNAddonGroups, chargeCodes, 'ONLY_PAYMENTS', selected);
                    }
                    /**/
                    else if (report['title'] === reportNames['DAILY_PRODUCTION_ROOM_TYPE']) {
                            selected = false;
                            processedCGCC = __adjustChargeGroupsCodes(chargeNAddonGroups, chargeCodes, 'NONE', selected);
                        }
                        /**/
                        else {
                                selected = true;
                                processedCGCC = __adjustChargeGroupsCodes(chargeNAddonGroups, chargeCodes, 'NONE', selected);
                            }

                foundCG = _.find(report['filters'], { value: 'INCLUDE_CHARGE_GROUP' });

                if (!!foundCG) {
                    foundCG['filled'] = true;
                    report.hasByChargeGroup = {
                        data: angular.copy(processedCGCC.chargeGroups),
                        options: {
                            selectAll: selected,
                            hasSearch: false,
                            key: 'name'
                        },
                        affectsFilter: {
                            name: 'hasByChargeCode',
                            process: function process(filter, selectedItems) {
                                _.each(filter.originalData, function (od) {
                                    od.disabled = true;
                                });
                                /**/
                                _.each(filter.originalData, function (od) {
                                    _.each(od.associcated_charge_groups, function (cg) {
                                        _.each(selectedItems, function (si) {
                                            if (cg.id === si.id) {
                                                od.disabled = false;
                                            }
                                        });
                                    });
                                });
                                /**/
                                filter.updateData();
                            }
                        }
                    };
                }

                foundCC = _.find(report['filters'], { value: 'INCLUDE_CHARGE_CODE' }) || _.find(report['filters'], { value: 'SHOW_CHARGE_CODES' });

                if (!!foundCC) {
                    foundCC['filled'] = true;
                    report.hasByChargeCode = {
                        data: angular.copy(processedCGCC.chargeCodes),
                        originalData: angular.copy(processedCGCC.chargeCodes),
                        options: {
                            selectAll: selected,
                            hasSearch: false,
                            key: 'name'
                        },
                        updateData: function updateData() {
                            var enabled = [];

                            _.each(this.originalData, function (od) {
                                if (!od.disabled) {
                                    enabled.push(od);
                                }
                            });
                            this.data = enabled;
                        }
                    };

                    if (report['title'] === reportNames['FINANCIAL_TRANSACTION_REVENUE_REPORT']) {
                        report.hasByChargeCode.options.key = 'description';
                    }
                }
            });

            completed += 2;
            checkAllCompleted();
        }

        // fill addon group and addons
        function fillAGAs(chargeNAddonGroups, addons) {
            var foundAG, foundAs;

            var flattenAddons = function flattenAddons(addons) {
                var data = [];

                _.each(addons, function (addon) {
                    if (!addon.disabled) {
                        _.each(addon.list_of_addons, function (la) {
                            data.push(la);
                        });
                    }
                });
                return data;
            };

            _.each(reportList, function (report) {
                foundAG = _.find(report['filters'], { value: 'ADDON_GROUPS' });

                if (!!foundAG) {
                    foundAG['filled'] = true;
                    report.hasAddonGroups = {
                        data: angular.copy(chargeNAddonGroups),
                        options: {
                            selectAll: true,
                            hasSearch: true,
                            key: 'name'
                        },
                        affectsFilter: {
                            name: 'hasAddons',
                            process: function process(filter, selectedItems) {
                                _.each(filter.originalData, function (od) {
                                    od.disabled = true;
                                });
                                /**/
                                _.each(filter.originalData, function (od) {
                                    _.each(selectedItems, function (si) {
                                        if (od.group_id === si.id) {
                                            od.disabled = false;
                                        }
                                    });
                                });
                                /**/
                                filter.updateData();
                            }
                        }
                    };
                }

                foundAs = _.find(report['filters'], { value: 'ADDONS' });

                if (!!foundAs) {
                    foundAs['filled'] = true;
                    report.hasAddons = {
                        data: flattenAddons(addons),
                        originalData: angular.copy(addons),
                        options: {
                            selectAll: true,
                            hasSearch: true,
                            key: 'addon_name'
                        },
                        updateData: function updateData() {
                            this.data = flattenAddons(this.originalData);
                        }
                    };
                }
            });

            completed++;
            checkAllCompleted();
        }

        return deferred.promise;
    };

    // to process the report group by
    factory.processGroupBy = function (report) {
        // remove the value for 'BLANK'
        if (report['group_fields'] && report['group_fields'].length) {
            report['groupByOptions'] = _.reject(report['group_fields'], { value: 'BLANK' });
        }

        // patch
        if (report['title'] === reportNames['FINANCIAL_TRANSACTIONS_ADJUSTMENT_REPORT']) {
            report['groupByOptions'] = undefined;
        }
    };

    // to reorder the sort by to match the report details column positon
    factory.reOrderSortBy = function (report) {
        var user;

        // for (arrival, departure) report the sort by items must be
        // ordered in a specific way as per the design
        // [date - name - room] > TO > [room - name - date]
        if (report['title'] === reportNames['ARRIVAL'] || report['title'] === reportNames['DEPARTURE']) {
            var arrivalDateSortBy = angular.copy(report['sort_fields'][1]),
                roomSortBy = angular.copy(report['sort_fields'][4]),
                nameSortBy = angular.copy(report['sort_fields'][2]),
                departureDateSortBy = angular.copy(report['sort_fields'][0]),
                rateSortBy = angular.copy(report['sort_fields'][3]),
                balanceSortBy = angular.copy(report['sort_fields'][5]);

            // CICO-57477 - This is done to disable sorts in column header for some fields
            departureDateSortBy.disableSort = true;
            balanceSortBy.disableSort = true;

            arrivalDateSortBy['colspan'] = 2;
            roomSortBy['colspan'] = 0;

            report['sort_fields'][0] = roomSortBy;
            report['sort_fields'][1] = nameSortBy;
            report['sort_fields'][2] = arrivalDateSortBy;
            report['sort_fields'][3] = departureDateSortBy;
            report['sort_fields'][4] = rateSortBy;
            report['sort_fields'][5] = balanceSortBy;
        }

        // for AR Summary report the sort by items must be
        // ordered in a specific way as per the design
        // [name - account - balance] > TO > [balance - account - name]
        if (report['title'] === reportNames['AR_SUMMARY_REPORT']) {
            var nameSortBy = angular.copy(_.find(report['sort_fields'], { 'value': 'ACCOUNT_NAME' })),
                accountSortBy = angular.copy(_.find(report['sort_fields'], { 'value': 'ACCOUNT_NO' })),
                openBalanceSortBy = angular.copy(_.find(report['sort_fields'], { 'value': 'OPEN_BALANCE' })),
                creditSortBy = angular.copy(_.find(report['sort_fields'], { 'value': 'CREDIT' }));

            report['sort_fields'][0] = nameSortBy;
            report['sort_fields'][1] = accountSortBy;
            report['sort_fields'][2] = null;
            report['sort_fields'][3] = null;
            report['sort_fields'][4] = openBalanceSortBy;
            report['sort_fields'][5] = creditSortBy;
        }

        // for in-house report the sort by items must be
        // ordered in a specific way as per the design
        // [name - room] > TO > [room - name]
        if (report['title'] === reportNames['IN_HOUSE_GUEST']) {
            var nameSortBy = angular.copy(report['sort_fields'][1]),
                roomSortBy = angular.copy(report['sort_fields'][3]),
                rateSortBy = angular.copy(report['sort_fields'][2]),
                arrivalDateSortBy = angular.copy(report['sort_fields'][0]),
                departureDateSortBy = angular.copy(report['sort_fields'][4]);

            // CICO-57477 - This is done to disable sorts in column header for some fields
            arrivalDateSortBy.disableSort = true;
            departureDateSortBy.disableSort = true;
            balanceSortBy = { disableSort: true };

            nameSortBy['colspan'] = 2;
            roomSortBy['colspan'] = 0;

            report['sort_fields'][0] = roomSortBy;
            report['sort_fields'][1] = nameSortBy;
            report['sort_fields'][2] = arrivalDateSortBy;
            report['sort_fields'][3] = departureDateSortBy;
            report['sort_fields'][4] = rateSortBy;
            report['sort_fields'][5] = balanceSortBy;
        }

        // for Login and out Activity report
        // the colspans should be adjusted
        // the sort descriptions should be update to design
        //    THIS MUST NOT BE CHANGED IN BACKEND
        if (report['title'] === reportNames['LOGIN_AND_OUT_ACTIVITY']) {
            report['sort_fields'][0]['description'] = 'Date & Time';

            report['sort_fields'][0]['colspan'] = 2;
            report['sort_fields'][1]['colspan'] = 2;
        }

        // need to reorder the sort_by options
        // for deposit report in the following order
        if (report['title'] === reportNames['DEPOSIT_REPORT']) {
            var reservationSortBy = angular.copy(report['sort_fields'][4]),
                dueDateSortBy = angular.copy(report['sort_fields'][1]),
                paidDateSortBy = angular.copy(report['sort_fields'][2]);

            report['sort_fields'][0] = reservationSortBy;
            report['sort_fields'][1] = null;
            report['sort_fields'][2] = dueDateSortBy;
            report['sort_fields'][3] = null;
            report['sort_fields'][4] = paidDateSortBy;
            report['sort_fields'][5] = null;
        }

        // need to reorder the sort_by options
        // for group deposit report in the following order
        if (report['title'] === reportNames['GROUP_DEPOSIT_REPORT']) {
            var reservationSortBy = angular.copy(report['sort_fields'][4]),
                dueDateSortBy = angular.copy(report['sort_fields'][1]),
                paidDateSortBy = angular.copy(report['sort_fields'][2]);

            report['sort_fields'][0] = reservationSortBy;
            report['sort_fields'][1] = null;
            report['sort_fields'][2] = dueDateSortBy;
            report['sort_fields'][3] = null;
            report['sort_fields'][4] = paidDateSortBy;
            report['sort_fields'][5] = null;
        }

        // need to reorder the sort_by options
        // for Reservation by User in the following order
        if (report['title'] === reportNames['RESERVATIONS_BY_USER']) {
            var reservationType = angular.copy(report['sort_fields'][6]),
                guestName = angular.copy(report['sort_fields'][3]),
                arrivalDate = angular.copy(report['sort_fields'][1]),
                rateAmount = angular.copy(report['sort_fields'][5]),
                createdOn = angular.copy(report['sort_fields'][0]),
                guranteeType = angular.copy(report['sort_fields'][2]),
                overrideAmount = angular.copy(report['sort_fields'][4]);

            report['sort_fields'][0] = reservationType;
            report['sort_fields'][1] = guestName;
            report['sort_fields'][2] = arrivalDate;
            report['sort_fields'][3] = rateAmount;
            report['sort_fields'][4] = createdOn;
            report['sort_fields'][5] = guranteeType;
            report['sort_fields'][6] = overrideAmount;
            report['sort_fields'][7] = null;
        }

        // need to reorder the sort_by options
        // for daily transactions in the following order
        if (report['title'] === reportNames['DAILY_TRANSACTIONS'] || report['title'] === reportNames['DAILY_PAYMENTS']) {
            var chargeGroup = angular.copy(report['sort_fields'][1]),
                chargeCode = angular.copy(report['sort_fields'][0]),
                revenue = angular.copy(report['sort_fields'][3]),
                mtd = angular.copy(report['sort_fields'][2]),
                ytd = angular.copy(report['sort_fields'][4]);

            report['sort_fields'][0] = chargeGroup;
            report['sort_fields'][1] = chargeCode;
            report['sort_fields'][2] = null;
            report['sort_fields'][3] = revenue;
            report['sort_fields'][4] = null;
            report['sort_fields'][5] = null;
            report['sort_fields'][6] = mtd;
            report['sort_fields'][7] = null;
            report['sort_fields'][8] = null;
            report['sort_fields'][9] = ytd;
        }

        // need to reorder the sort_by options
        // for rate adjustment report in the following order
        if (report['title'] === reportNames['RATE_ADJUSTMENTS_REPORT']) {
            var date = angular.copy(report['sort_fields'][1]),
                guestUser = angular.copy(report['sort_fields'][0]);

            user = angular.copy(report['sort_fields'][2]);

            report['sort_fields'][0] = guestUser;
            report['sort_fields'][1] = date;
            report['sort_fields'][2] = null;
            report['sort_fields'][3] = null;
            report['sort_fields'][4] = null;
            report['sort_fields'][5] = null;
            report['sort_fields'][6] = user;
        }

        // need to reorder the sort_by options
        // for group pick report in the following order
        if (report['title'] === reportNames['GROUP_PICKUP_REPORT']) {
            var groupName = angular.copy(report['sort_fields'][1]),
                date = angular.copy(report['sort_fields'][0]),
                holdStatus = angular.copy(report['sort_fields'][2]);

            report['sort_fields'][0] = groupName;
            report['sort_fields'][1] = date;
            report['sort_fields'][2] = holdStatus;
            report['sort_fields'][3] = null;
            report['sort_fields'][4] = null;
            report['sort_fields'][5] = null;
            report['sort_fields'][6] = null;
            report['sort_fields'][7] = null;
            report['sort_fields'][8] = null;
        }

        // need to reorder the sort_by options
        // for guest balance report in the following order
        if (report['title'] === reportNames['GUEST_BALANCE_REPORT']) {
            var balance = angular.copy(_.find(report['sort_fields'], { 'value': 'BALANCE' })),
                name = angular.copy(_.find(report['sort_fields'], { 'value': 'NAME' })),
                room = angular.copy(_.find(report['sort_fields'], { 'value': 'ROOM_NO' })),
                resstatus = angular.copy(_.find(report['sort_fields'], { 'value': 'RESERVATION_STATUS' }));

            report['sort_fields'][0] = name;
            report['sort_fields'][1] = room;
            report['sort_fields'][2] = null;
            report['sort_fields'][3] = null;
            report['sort_fields'][4] = balance;
            report['sort_fields'][5] = resstatus;
        }

        // need to reorder the sort_by options
        // for guest balance report in the following order
        if (report['title'] === reportNames['COMPANY_TA_TOP_PRODUCERS']) {
            var accountName = angular.copy(_.find(report['sort_fields'], { 'value': 'COMPANY_TA_NAME' })),
                roomNights = angular.copy(_.find(report['sort_fields'], { 'value': 'ROOM_NIGHTS' })),
                revenue = angular.copy(_.find(report['sort_fields'], { 'value': 'REVENUE' }));

            report['sort_fields'][0] = accountName;
            report['sort_fields'][1] = null;
            report['sort_fields'][2] = null;
            report['sort_fields'][3] = null;
            report['sort_fields'][4] = roomNights;
            report['sort_fields'][5] = null;
            report['sort_fields'][6] = null;
            report['sort_fields'][7] = revenue;
            report['sort_fields'][8] = null;
            report['sort_fields'][9] = null;
        }

        // need to reorder the sort_by options
        // for guest balance report in the following order
        if (report['title'] === reportNames['FINANCIAL_TRANSACTIONS_ADJUSTMENT_REPORT']) {
            var chargeCode = angular.copy(_.find(report['sort_fields'], { 'value': 'CHARGE_CODE' })),
                date = angular.copy(_.find(report['sort_fields'], { 'value': 'DATE' }));

            user = angular.copy(_.find(report['sort_fields'], { 'value': 'USER' }));

            report['sort_fields'][0] = null;
            report['sort_fields'][1] = chargeCode;
            report['sort_fields'][2] = null;
            report['sort_fields'][3] = null;
            report['sort_fields'][4] = null;
            report['sort_fields'][5] = user;
            report['sort_fields'][6] = null;
            report['sort_fields'][7] = date;
            report['sort_fields'][8] = null;
            report['sort_fields'][9] = null;
        }

        // need to reorder the sort_by options
        // for guest balance report in the following order
        if (report['title'] === reportNames['DEPOSIT_SUMMARY']) {
            var credit = angular.copy(_.find(report['sort_fields'], { 'value': 'CREDIT' })),
                debit = angular.copy(_.find(report['sort_fields'], { 'value': 'DEBIT' })),
                name = angular.copy(_.find(report['sort_fields'], { 'value': 'NAME' }));

            report['sort_fields'][0] = name;
            report['sort_fields'][1] = null;
            report['sort_fields'][2] = null;
            report['sort_fields'][3] = null;
            report['sort_fields'][4] = debit;
            report['sort_fields'][5] = credit;
        }

        // need to reorder the sort_by options
        // for guest balance report in the following order
        if (report['title'] === reportNames['ROOMS_OOO_OOS']) {
            var roomNo, roomType, startDate, endDate;

            _.each(report['sort_fields'], function (field) {
                if (!!field) {
                    if ('ROOM_NO' === field.value) {
                        roomNo = angular.copy(field);
                    }
                    if ('ROOM_TYPE' === field.value) {
                        roomType = angular.copy(field);
                    }
                    if ('START_DATE' === field.value) {
                        startDate = angular.copy(field);
                    }
                    if ('END_DATE' === field.value) {
                        endDate = angular.copy(field);
                    }
                }
            });

            report['sort_fields'] = [roomNo, roomType, null, startDate, endDate, null, null];
        }

        if (report['title'] === reportNames['VACANT_ROOMS_REPORT']) {
            var roomNo = angular.copy(_.find(report['sort_fields'], { 'value': 'ROOM_NUMBER' })),
                roomType = angular.copy(_.find(report['sort_fields'], { 'value': 'ROOM_TYPE' })),
                daysVacant = angular.copy(_.find(report['sort_fields'], { 'value': 'NO_OF_DAYS_VACANT' })),
                lastCheckoutDate = angular.copy(_.find(report['sort_fields'], { 'value': 'LAST_CHECK_OUT_DATE' }));

            report['sort_fields'][0] = roomNo;
            report['sort_fields'][1] = roomType;
            report['sort_fields'][2] = daysVacant;
            report['sort_fields'][3] = lastCheckoutDate;
        }
    };

    // to process the report sort by
    factory.processSortBy = function (report) {
        // adding custom name copy for easy access
        report['sortByOptions'] = angular.copy(report['sort_fields']);
        // show sortBy in filters - default
        report['showSort'] = true;
        // sort by options - include sort direction
        if (report['sortByOptions'] && report['sortByOptions'].length) {
            _.each(report['sortByOptions'], function (item, index, list) {

                if (!!item) {
                    item['sortDir'] = undefined;
                }
            });

            // making sort by room type default
            if (report['title'] === reportNames['DAILY_PRODUCTION_ROOM_TYPE']) {
                var roomType = _.find(report['sortByOptions'], { 'value': 'ROOM_TYPE' });

                if (!!roomType) {
                    roomType['sortDir'] = true;
                    report['chosenSortBy'] = roomType['value'];
                }
            }

            // making sort by Revenue [desc] default
            if (report['title'] === reportNames['COMPANY_TA_TOP_PRODUCERS']) {
                var revenue = _.find(report['sortByOptions'], { 'value': 'REVENUE' });

                if (!!revenue) {
                    revenue['sortDir'] = false;
                    report['chosenSortBy'] = revenue['value'];
                }
            }

            // making sort by Room Number [asc] default
            if (report['title'] === reportNames['CREDIT_CHECK_REPORT']) {
                var roomNo = _.find(report['sortByOptions'], { 'value': 'ROOM_NO' });

                if (!!roomNo) {
                    roomNo['sortDir'] = true;
                    report['chosenSortBy'] = roomNo['value'];
                }
            }

            // hide sort by from filter CICO-29257
            if (report['title'] === reportNames['COMPLIMENTARY_ROOM_REPORT']) {
                report['showSort'] = false;
            }

            // CICO-34733 Set default sort
            if (report['title'] === reportNames['GROUP_ROOMS_REPORT']) {
                var arrivalDate = _.find(report['sortByOptions'], { 'value': 'GROUP_ARRIVAL_DATE' });

                if (!!arrivalDate) {
                    arrivalDate['sortDir'] = true;
                    report['chosenSortBy'] = arrivalDate['value'];
                }
            }
        }
    };

    // to assign inital date values for this report
    factory.initDateValues = function (report) {
        var _getDates = factory.processDate();

        switch (report['title']) {

            // dates range must be the current business date
            case reportNames['ARRIVAL']:
            case reportNames['DEPARTURE']:
                report['fromDate'] = _getDates.businessDate;
                report['untilDate'] = _getDates.businessDate;
                break;

            // arrival date range must be from business date to a week after
            // deposit date range must the current business date
            case reportNames['DEPOSIT_REPORT']:
                report['fromArrivalDate'] = _getDates.businessDate;
                report['untilArrivalDate'] = _getDates.aWeekAfter;
                /**/
                report['fromDepositDate'] = _getDates.businessDate;
                report['untilDepositDate'] = _getDates.businessDate;
                /**/
                report['fromPaidDate'] = _getDates.businessDate;
                report['untilPaidDate'] = _getDates.businessDate;
                break;

            // arrival date range must be from business date to a week after
            // deposit date range must the current business date
            case reportNames['GROUP_DEPOSIT_REPORT']:
                report['groupStartDate'] = _getDates.businessDate;
                report['groupEndDate'] = _getDates.twentyEightDaysAfter;
                /**/
                /* report['fromDepositDate']  = _getDates.businessDate;
                report['untilDepositDate'] = _getDates.businessDate;*/
                /**/
                report['fromPaidDate'] = _getDates.twentyEightDaysBefore;
                report['untilPaidDate'] = _getDates.businessDate;
                break;

            // date range must be yesterday - relative to current business date
            case reportNames['OCCUPANCY_REVENUE_SUMMARY']:
                report['fromDate'] = _getDates.yesterday;
                report['untilDate'] = _getDates.yesterday;
                break;

            // date range must be yesterday - relative to current business date
            case reportNames['DAILY_TRANSACTIONS']:
            case reportNames['DAILY_PAYMENTS']:
            case reportNames['MARKET_SEGMENT_STAT_REPORT']:
            case reportNames['COMPARISION_BY_DATE']:
                report['singleValueDate'] = _getDates.yesterday;
                break;

            // dates range must be the current business date
            case reportNames['FORECAST_BY_DATE']:
            case reportNames['FORECAST_GUEST_GROUPS']:
                report['fromDate'] = _getDates.businessDate;
                report['untilDate'] = _getDates.aMonthAfter;
                break;

            case reportNames['ADDON_FORECAST']:
            case reportNames['ALLOWANCE_FORECAST']:
                report['showSort'] = true;
                report['isForecast'] = true;
                report['fromDate'] = _getDates.businessDate;
                report['untilDate'] = _getDates.businessDate;
                break;

            case reportNames['DAILY_PRODUCTION_ROOM_TYPE']:
                report['fromDate'] = _getDates.monthStart;
                report['untilDate'] = _getDates.businessDate;
                break;

            case reportNames['DAILY_PRODUCTION_DEMO']:
                report['fromDate'] = _getDates.monthStart;
                report['untilDate'] = _getDates.businessDate;
                break;

            case reportNames['DAILY_PRODUCTION_RATE']:
                report['fromDate'] = _getDates.monthStart;
                report['untilDate'] = _getDates.businessDate;
                break;

            case reportNames['RATE_RESTRICTION_REPORT']:
                report['fromDate'] = _getDates.businessDate;
                report['untilDate'] = _getDates.businessDate;
                break;

            case reportNames['IN_HOUSE_GUEST']:
                report['singleValueDate'] = _getDates.businessDate;
                break;

            // by default date range must be from a week ago to current business date
            default:
                report['fromDate'] = _getDates.aWeekAgo;
                report['fromCancelDate'] = _getDates.aWeekAgo;
                report['fromArrivalDate'] = _getDates.aWeekAgo;
                report['fromCreateDate'] = _getDates.aWeekAgo;
                report['fromAdjustmentDate'] = _getDates.aWeekAgo;
                /**/
                report['untilDate'] = _getDates.businessDate;
                report['untilCancelDate'] = _getDates.businessDate;
                report['untilArrivalDate'] = _getDates.businessDate;
                report['untilCreateDate'] = _getDates.businessDate;
                report['untilAdjustmentDate'] = _getDates.businessDate;
                break;
        }
    };

    // HELPER: create meaningful date names
    factory.processDate = function (customDate, xDays) {
        var _dateVal = customDate ? tzIndependentDate(customDate) : $rootScope.businessDate,
            _businessDate = $filter('date')(_dateVal, 'yyyy-MM-dd'),
            _dateParts = _businessDate.match(/(\d+)/g);

        var _year = parseInt(_dateParts[0]),
            _month = parseInt(_dateParts[1]) - 1,
            _date = parseInt(_dateParts[2]);

        var returnObj = {
            'businessDate': new Date(_year, _month, _date),
            'today': new Date(_year, _month, _date),
            'yesterday': new Date(_year, _month, _date - 1),
            'tomorrow': new Date(_year, _month, _date + 1),
            'aWeekAgo': new Date(_year, _month, _date - 7),
            'aWeekAfter': new Date(_year, _month, _date + 7),
            'aMonthAfter': new Date(_year, _month, _date + 30),
            'monthStart': new Date(_year, _month, 1),
            'twentyEightDaysBefore': new Date(_year, _month, _date - 28),
            'twentyEightDaysAfter': new Date(_year, _month, _date + 28),
            'aYearAfter': new Date(_year + 1, _month, _date - 1),
            'sixMonthsAfter': new Date(_year, _month + 6, _date),
            'thirtyOneDaysAfter': new Date(_year, _month, _date + 30)
        };

        if (parseInt(xDays) !== NaN) {
            returnObj.xDaysBefore = new Date(_year, _month, _date - xDays);
            returnObj.xDaysAfter = new Date(_year, _month, _date + xDays);
        }

        return returnObj;
    };

    // HELPER: create time slots
    factory.createTimeSlots = function (step) {
        var _ret = [],
            _hh = '',
            _mm = '',
            _step,
            _parts,
            _total;

        if (step === 30) {
            _step = step;
            _parts = 2;
        } else {
            _step = 15;
            _parts = 4;
        }

        _total = _parts * 24;

        var i = 0,
            m = 0,
            h = -1;

        // 4/2 parts in each of 24 hours (00 -> 23)
        for (i = 0; i < _total; i++) {

            // each hour is split into 4 parts
            // x:00, x:15, x:30, x:45
            if (i % _parts === 0) {
                h++;
                m = 0;
            } else {
                m += _step;
            }

            // converting h -> HH and m -> MM
            _hh = h < 10 ? '0' + h : h;
            _mm = m < 10 ? '0' + m : m;

            _ret.push({
                'value': _hh + ':' + _mm,
                'name': _hh + ':' + _mm
            });
        }

        return _ret;
    };

    /**
     * Generate a subset of object with the given set of keys
     * @param {Object} obj source object
     * @param {Array} keys array of keys
     * @return subset of object
     */
    factory.reduceObject = function (obj, keys) {
        keys = keys || DATE_FILTERS.concat(OTHER_FILTERS);

        return _.pick(obj, keys);
    };

    /**
     * Parses the date string in the object
     * @params {Object} obj object with keys having date string
     * @return void
     *
     */
    factory.parseDatesInObject = function (obj) {
        for (var key in obj) {
            if (DATE_FILTERS.indexOf(key) !== -1) {
                obj[key] = tzIndependentDate(obj[key]);
            }
        }
    };

    /**
     * Marke the element in Object array which matches the ids as selected
     * @params {Array} objArr object array
     * @params {Array} filterArr array of selected ids
     * @params {String} key the value to be compared
     * @return void
     *
     */
    factory.markAsSelected = function (objArr, filterArr, key) {
        _.each(objArr, function (obj) {
            if (filterArr.indeOf(obj[key]) > -1) {
                obj.selected = true;
            }
        });
    };

    // Mark the selected entries in the filter
    factory.markSelectedEntriesForFilter = function (report) {

        if (report.filters[reportParams['RESTRICTION_IDS']] && report.filters[reportParams['RESTRICTION_IDS']].length > 0) {
            factory.markAsSelected(report.hasRestrictionListFilter.data, report.filters[reportParams['RESTRICTION_IDS']], 'id');
        }

        if (report.filters[reportParams['ROOM_TYPE_IDS']] && report.filters[reportParams['ROOM_TYPE_IDS']].length > 0) {
            factory.markAsSelected(report.hasRestrictionListFilter.data, report.filters[reportParams['ROOM_TYPE_IDS']], 'id');
        }
    };

    // Fill rate types and rates for scheduled reports
    factory.fillRateTypesAndRatesForScheduledReports = function (filter, filterValues, reportName) {
        var getSelectAllValForRateTypes = function getSelectAllValForRateTypes(rateTypes) {
            var selectAll = false;

            if (filterValues && !!filterValues.rate_type_ids) {
                selectAll = filterValues.rate_type_ids.length === rateTypes.length;
            } else if (filterValues && !filterValues.rate_type_ids) {
                selectAll = false;
            } else if (!filterValues && reportName === reportNames['DAILY_PRODUCTION_RATE']) {
                selectAll = true;
            }

            return selectAll;
        },
            getSelectAllValForRates = function getSelectAllValForRates(rates) {
            var selectAll = false;

            if (filterValues && !!filterValues.rate_ids) {
                selectAll = filterValues.rate_ids.length === rates.length;
            } else if (filterValues && !filterValues.rate_ids) {
                selectAll = false;
            } else if (!filterValues && reportName === reportNames['DAILY_PRODUCTION_RATE']) {
                selectAll = true;
            }

            return selectAll;
        };
        var populateRateTypesAndRates = function populateRateTypesAndRates(data) {
            var rateTypes = extractRateTypesFromRateTypesAndRateList(data),
                rates = extractRatesFromRateTypesAndRateList(data),
                selectedRateType,
                selectedRate;

            if (filterValues && filterValues.rate_type_ids) {
                _.each(filterValues.rate_type_ids, function (id) {
                    selectedRateType = _.findWhere(rateTypes, { rate_type_id: id });
                    selectedRateType.selected = true;
                });
            } else if (!filterValues && reportName === reportNames['DAILY_PRODUCTION_RATE']) {
                _.each(rateTypes, function (rateType) {
                    rateType.selected = true;
                });
            }

            if (filterValues && filterValues.rate_ids) {
                _.each(filterValues.rate_ids, function (id) {
                    selectedRate = _.findWhere(rates, { id: id });
                    selectedRate.selected = true;
                });
            } else if (!filterValues && reportName === reportNames['DAILY_PRODUCTION_RATE']) {
                _.each(rates, function (rate) {
                    rate.selected = true;
                });
            }

            filter.hasRateTypeFilter = {
                data: rateTypes,
                options: {
                    selectAll: getSelectAllValForRateTypes(rateTypes),
                    hasSearch: true,
                    key: 'name'
                }
            };

            filter.hasRateFilter = {
                data: rates,
                options: {
                    selectAll: getSelectAllValForRates(rates),
                    hasSearch: true,
                    key: 'name'
                }
            };
        };

        reportsSubSrv.fetchRateTypesAndRateList() // This would include custom rates
        .then(populateRateTypesAndRates);
    };

    /**
     * Fill charge groups and charge codes values
     * @param {Object} filter filter object
     * @param {Object} filterValues - object holding filter values
     * @param {String} reportName - name of the report
     * @return {void}
     */
    factory.fillChargeGroupsAndChargeCodes = function (filter, filterValues, reportName) {
        // Get the value of selectall checkbox for the charge groups
        var getChargeGroupSelectAllVal = function getChargeGroupSelectAllVal(chargeGroups) {
            var selectAll = true;

            if (filterValues && !!filterValues.charge_group_ids) {
                selectAll = filterValues.charge_group_ids.length === chargeGroups.length;
            } else if (filterValues && !filterValues.charge_group_ids) {
                selectAll = false;
            }

            return selectAll;
        },

        // Get the value of selectall checkbox for the charge codes
        getChargeCodeSelectAllVal = function getChargeCodeSelectAllVal(chargeCodes) {
            var selectAll = true;

            if (filterValues && !!filterValues.charge_code_ids) {
                selectAll = filterValues.charge_code_ids.length === chargeCodes.length;
            } else if (filterValues && !filterValues.charge_code_ids) {
                selectAll = false;
            }

            return selectAll;
        };

        // Populate charge groups and charge codes
        var populateChargeGroupsAndChargeCodes = function populateChargeGroupsAndChargeCodes(chargeGroupsArr, excludeChargeGroup, shouldPopulateChargeGroups, shouldPopulateChargeCodes, chargeCodesArr) {
            var processedCGCC = __adjustChargeGroupsCodes(chargeGroupsArr, chargeCodesArr, excludeChargeGroup, true),
                chargeGroupsCopy = angular.copy(processedCGCC.chargeGroups),
                chargeCodesCopy = angular.copy(processedCGCC.chargeCodes),
                selectedChargeGroupIdx,
                selectedChargeCodeIdx;

            delete filter.hasByChargeGroup;
            delete filter.hasByChargeCode;

            if (shouldPopulateChargeGroups) {
                if (filterValues && filterValues.charge_group_ids) {

                    chargeGroupsCopy = _.map(chargeGroupsCopy, function (chargeGroup) {
                        selectedChargeGroupIdx = _.indexOf(filterValues.charge_group_ids, chargeGroup.id);
                        chargeGroup.selected = false;
                        if (selectedChargeGroupIdx > -1) {
                            chargeGroup.selected = true;
                        }

                        return chargeGroup;
                    });
                } else if (filterValues && !filterValues.charge_group_ids) {
                    chargeGroupsCopy = _.map(chargeGroupsCopy, function (chargeGroup) {
                        chargeGroup.selected = false;

                        return chargeGroup;
                    });
                }

                filter.hasByChargeGroup = {
                    data: chargeGroupsCopy,
                    options: {
                        selectAll: getChargeGroupSelectAllVal(chargeGroupsCopy),
                        hasSearch: false,
                        key: 'name'
                    },
                    affectsFilter: {
                        name: 'hasByChargeCode',
                        process: function process(filter, selectedItems) {
                            _.each(filter.originalData, function (od) {
                                od.disabled = true;
                            });
                            /**/
                            _.each(filter.originalData, function (od) {
                                _.each(od.associcated_charge_groups, function (cg) {
                                    _.each(selectedItems, function (si) {
                                        if (cg.id === si.id) {
                                            od.disabled = false;
                                        }
                                    });
                                });
                            });
                            /**/
                            filter.updateData();
                        }
                    }
                };
            }

            if (shouldPopulateChargeCodes) {
                if (filterValues && !!filterValues.charge_code_ids) {

                    chargeCodesCopy = _.map(chargeCodesCopy, function (chargeCode) {
                        selectedChargeCodeIdx = _.indexOf(filterValues.charge_code_ids, chargeCode.id);
                        chargeCode.selected = false;
                        if (selectedChargeCodeIdx > -1) {
                            chargeCode.selected = true;
                        }
                        return chargeCode;
                    });
                } else if (filterValues && !filterValues.charge_code_ids) {
                    chargeCodesCopy = _.map(chargeCodesCopy, function (chargeCode) {
                        chargeCode.selected = false;

                        return chargeCode;
                    });
                }

                filter.hasByChargeCode = {
                    data: chargeCodesCopy,
                    originalData: chargeCodesCopy,
                    options: {
                        selectAll: getChargeCodeSelectAllVal(chargeCodesCopy),
                        hasSearch: false,
                        key: 'name'
                    },
                    updateData: function updateData() {
                        var enabled = [];

                        _.each(this.originalData, function (od) {
                            if (!od.disabled) {
                                enabled.push(od);
                            }
                        });
                        this.data = enabled;
                    }
                };

                if (reportName === reportNames['FINANCIAL_TRANSACTION_REVENUE_REPORT']) {
                    filter.hasByChargeCode.options.key = 'description';
                }
            }
        };

        var excludeChargeGroup = 'NONE',
            shouldPopulateChargeGroups = true,
            shouldPopulateChargeCodes = true;

        if (reportName === reportNames['DAILY_TRANSACTIONS']) {
            excludeChargeGroup = 'REMOVE_PAYMENTS';
        }

        if (reportName === reportNames['FINANCIAL_TRANSACTIONS_ADJUSTMENT_REPORT']) {
            shouldPopulateChargeGroups = false;
            shouldPopulateChargeCodes = true;
        }

        reportsSubSrv.fetchChargeNAddonGroups().then(function (chargeGroupsArr) {
            reportsSubSrv.fetchChargeCodes().then(populateChargeGroupsAndChargeCodes.bind(null, chargeGroupsArr, excludeChargeGroup, shouldPopulateChargeGroups, shouldPopulateChargeCodes));
        });
    };

    /**
     * Fill completion status options
     * @param {Object} filter - holding filter details
     * @return {void}
     */
    factory.fillCompletionStatus = function (filter) {
        var completionStatusList = [{
            id: 'UNASSIGNED',
            status: 'UNASSIGNED',
            selected: true
        }, {
            id: 'ASSIGNED',
            status: 'ASSIGNED',
            selected: true
        }, {
            id: 'COMPLETED',
            status: 'COMPLETED',
            selected: true
        }];

        filter.hasCompletionStatus = {
            data: completionStatusList,
            options: {
                hasSearch: false,
                selectAll: true,
                key: 'status',
                defaultValue: 'Select Status'
            }
        };
    };

    /**
     * Fill employees for Journal
     * @param {Object} filter - holding filter details
     * @param {Object} filterValues -contain filter values
     * @return {void} 
     */
    factory.fillEmployees = function (filter, filterValues) {
        var getSelectAllVal = function getSelectAllVal(employees) {
            var selectAll = true;

            if (filterValues && filterValues.all_users_selected) {
                return selectAll;
            } else if (filterValues && filterValues.user_ids) {
                selectAll = employees.length === filterValues.user_ids.length;
            }

            return selectAll;
        };

        reportsSubSrv.fetchEmployees().then(function (data) {
            var employeesCopy = angular.copy(data);

            if (filterValues && filterValues.user_ids) {
                employeesCopy = employeesCopy.map(function (employee) {
                    employee.selected = false;

                    if (filterValues.user_ids.indexOf(employee.id) > -1) {
                        employee.selected = true;
                    }
                    return employee;
                });
            }
            filter.filterTitle = 'Employees';

            filter.empList = {
                title: 'Employees',
                data: employeesCopy,
                options: {
                    selectAll: getSelectAllVal(employeesCopy),
                    hasSearch: true,
                    key: 'full_name',
                    altKey: 'email'
                }
            };
        });
    };

    /**
     * Fill Transaction Category
     * @param {Object} filter - holding filter details
     * @param {Object} filterValues -contain filter values
     * @return {void} set filter values
     */
    factory.fillTransactionCategory = function (filter, filterValues) {
        var tempSelection,
            transactionCategory = [{ id: "TOTAL", description: "Show Totals" }, { id: "PRE STAY", description: "Pre Stay" }, { id: "IN HOUSE", description: "In House" }, { id: "POST STAY", description: "Post Stay" }];

        if (filterValues && filterValues.transaction_category) {
            tempSelection = _.find(transactionCategory, {
                id: filterValues.transaction_category
            });
        } else {
            tempSelection = transactionCategory[0];
        }

        filter.hasTransactionCategory = {
            data: transactionCategory,
            selected: tempSelection,
            options: {
                key: 'description',
                defaultValue: 'Select Transaction Category'
            }
        };
    };

    /**
     * Fill payment types
     * @param {Object} filter - holding filter details
     * @param {Object} filterValues -contain filter values
     * @return {void} 
     */
    factory.fillPaymentTypes = function (filter, filterValues) {
        var getSelectAllVal = function getSelectAllVal(paymentTypes) {
            var selectAll = true;

            if (filterValues && filterValues.payment_types) {
                selectAll = paymentTypes.length === filterValues.payment_types.length;
            }

            return selectAll;
        };

        reportsSubSrv.fetchPaymentTypes().then(function (data) {
            var PTCopy = angular.copy(data);

            if (filterValues && filterValues.payment_types) {
                PTCopy = PTCopy.map(function (paymentTypes) {
                    paymentTypes.selected = false;

                    if (filterValues.payment_types.indexOf(paymentTypes.id) > -1) {
                        paymentTypes.selected = true;
                    }
                    return paymentTypes;
                });
            }

            filter.hasPaymentType = {
                data: PTCopy,
                options: {
                    hasSearch: false,
                    selectAll: getSelectAllVal(PTCopy),
                    noSelectAll: true,
                    key: 'description',
                    defaultValue: 'Show All'
                }
            };
        });
    };

    /**
     * Fill Collapsed or Expanded
     * @param {Object} filter - holding filter details
     * @param {Object} filterValues -contain filter values
     * @return {void} set filter values
     */
    factory.fillCollapsedOrExpanded = function (filter, filterValues) {
        var tempSelection,
            collapsedOrExpanded = [{ id: 1, value: "EXPANDED", description: "Expanded" }, { id: 2, value: "COLLAPSED", description: "Collapsed" }];

        if (filterValues && filterValues.summary_type) {
            tempSelection = _.find(collapsedOrExpanded, {
                value: filterValues.summary_type
            });
        } else {
            tempSelection = collapsedOrExpanded[0];
        }

        filter.hasCollapsedOrExpanded = {
            data: collapsedOrExpanded,
            selected: tempSelection,
            options: {
                key: 'description'
            }
        };
    };

    /**
     * Fill departments
     * @param {Object} filter - holding filter details
     * @return {void}
     */
    factory.fillDepartments = function (filter, filterValues) {
        var getSelectAllVal = function getSelectAllVal(departments) {
            var selectAll = true;

            if (filterValues && filterValues.assigned_departments) {
                selectAll = departments.length === filterValues.assigned_departments.length;
            }

            return selectAll;
        };

        reportsSubSrv.fetchDepartments().then(function (data) {
            _.each(data, function (departmentData) {
                departmentData.id = departmentData.value;
            });

            var departmentCopy = angular.copy(data);

            if (filterValues && filterValues.assigned_departments) {
                departmentCopy = departmentCopy.map(function (department) {
                    department.selected = false;

                    if (filterValues.assigned_departments.indexOf(department.id) > -1) {
                        department.selected = true;
                    }
                    return department;
                });
            }

            filter.hasDepartments = {
                data: departmentCopy,
                options: {
                    hasSearch: false,
                    selectAll: getSelectAllVal(departmentCopy),
                    key: 'name',
                    defaultValue: 'Select Department'
                }
            };
        });
    };

    /**
     * Fill markets
     * @param {Object} report - has the selected report details
     * @return {void}
     */
    factory.fillMarkets = function (filter, filterValues, reportName) {
        var getSelectAllVal = function getSelectAllVal(markets) {
            var selectAll = reportName === reportNames['RESERVATIONS_BY_USER'] || reportName === reportNames['OCCUPANCY_REVENUE_SUMMARY'];

            if (filterValues && filterValues.market_ids) {
                selectAll = markets.length === filterValues.market_ids.length;
            }

            return selectAll;
        };

        reportsSubSrv.fetchMarkets().then(function (data) {
            var UNDEFINED = {
                is_active: true,
                name: 'UNDEFINED',
                value: -1
            };

            var undefinedEntry = _.find(data, { name: 'UNDEFINED' });

            if (!undefinedEntry) {
                data.push(UNDEFINED);
            }

            _.each(data, function (marketData) {
                marketData.id = marketData.value;
            });

            var marketCopy = angular.copy(data);

            if (filterValues && filterValues.market_ids) {
                marketCopy = marketCopy.map(function (market) {
                    market.selected = false;

                    if (filterValues.market_ids.indexOf(market.id) > -1) {
                        market.selected = true;
                    }
                    return market;
                });
            }

            filter.hasMarketsList = {
                data: marketCopy,
                options: {
                    selectAll: getSelectAllVal(marketCopy),
                    hasSearch: false,
                    key: 'name'
                }
            };
        });
    };

    /**
     * Fill origin
     * @param {Object} filter - holding filter details
     * @return {void} 
     */
    factory.fillBookingOrigins = function (filter, filterValues, reportName) {
        var getSelectAllVal = function getSelectAllVal(bookingOrigin) {
            var selectAll = reportName === reportNames['RESERVATIONS_BY_USER'];

            if (filterValues && filterValues.booking_origin_ids) {
                selectAll = bookingOrigin.length === filterValues.booking_origin_ids.length;
            }

            return selectAll;
        };

        reportsSubSrv.fetchBookingOrigins().then(function (data) {
            var UNDEFINED = {
                is_active: true,
                name: 'UNDEFINED',
                value: -1
            };

            var undefinedEntry = _.find(data, { name: 'UNDEFINED' });

            if (!undefinedEntry) {
                data.push(UNDEFINED);
            }

            _.each(data, function (originData) {
                originData.id = originData.value;
            });

            var originCopy = angular.copy(data);

            if (filterValues && filterValues.booking_origin_ids) {
                originCopy = originCopy.map(function (bookingOrigin) {
                    bookingOrigin.selected = false;

                    if (filterValues.booking_origin_ids.indexOf(bookingOrigin.id) > -1) {
                        bookingOrigin.selected = true;
                    }
                    return bookingOrigin;
                });
            }

            filter.hasOriginsList = {
                data: originCopy,
                options: {
                    selectAll: getSelectAllVal(originCopy),
                    hasSearch: false,
                    key: 'name'
                }
            };
        });
    };

    /**
     * Fill sources
     * @param {Object} filter - holding filter details
     * @return {void} 
     */
    factory.fillSources = function (filter, filterValues, reportName) {
        var getSelectAllVal = function getSelectAllVal(sources) {
            var selectAll = reportName === reportNames['RESERVATIONS_BY_USER'];

            if (filterValues && filterValues.source_ids) {
                selectAll = sources.length === filterValues.source_ids.length;
            }

            return selectAll;
        };

        reportsSubSrv.fetchSources().then(function (data) {
            var UNDEFINED = {
                is_active: true,
                name: 'UNDEFINED',
                value: -1
            };

            var undefinedEntry = _.find(data, { name: 'UNDEFINED' });

            if (!undefinedEntry) {
                data.push(UNDEFINED);
            }

            _.each(data, function (sourceData) {
                sourceData.id = sourceData.value;
            });

            var sourceCopy = angular.copy(data);

            if (filterValues && filterValues.source_ids) {
                sourceCopy = sourceCopy.map(function (source) {
                    source.selected = false;

                    if (filterValues.source_ids.indexOf(source.id) > -1) {
                        source.selected = true;
                    }
                    return source;
                });
            }

            filter.hasSourcesList = {
                data: sourceCopy,
                options: {
                    selectAll: getSelectAllVal(sourceCopy),
                    hasSearch: false,
                    key: 'name'
                }
            };
        });
    };

    /**
     * Fill country
     * @param {Object} filter - holding filter details
     * @return {void}
     */
    factory.fillCountries = function (filter, filterValues) {
        var getSelectAllVal = function getSelectAllVal(countries) {
            var selectAll = true;

            if (filterValues && filterValues.country_ids) {
                selectAll = countries.length === filterValues.country_ids.length;
            }

            return selectAll;
        };

        reportsSubSrv.fetchCountries().then(function (data) {
            var countryCopy = angular.copy(data);

            if (filterValues && filterValues.country_ids) {
                countryCopy = countryCopy.map(function (country) {
                    country.selected = false;

                    if (filterValues.country_ids.indexOf(country.id) > -1) {
                        country.selected = true;
                    }
                    return country;
                });
            }

            filter.hasIncludeCountry = {
                data: countryCopy,
                options: {
                    selectAll: false,
                    hasSearch: true,
                    key: 'value',
                    defaultValue: 'Select Country'
                }
            };
        });
    };

    /**
     * Fill Work Types
     * @param {Object} filter - holding filter details
     * @return {void}
     */
    factory.fillWorkTypes = function (filter, filterValues) {
        var getSelectAllVal = function getSelectAllVal(workType) {
            var selectAll = true;

            if (filterValues && filterValues.work_type_ids) {
                selectAll = workType.length === filterValues.work_type_ids.length;
            }

            return selectAll;
        };

        reportsSubSrv.fetchWorkTypes().then(function (data) {
            _.each(data, function (workType) {
                workType.value = workType.name.toUpperCase();
            });

            var workCopy = angular.copy(data);

            if (filterValues && filterValues.work_type_ids) {
                workCopy = workCopy.map(function (workType) {
                    workType.selected = false;

                    if (filterValues.work_type_ids.indexOf(workType.id) > -1) {
                        workType.selected = true;
                    }
                    return workType;
                });
            }

            filter.hasIncludeWorkTypes = {
                data: workCopy,
                options: {
                    selectAll: getSelectAllVal(workCopy),
                    hasSearch: true,
                    key: 'value',
                    defaultValue: 'Select Work Type'
                }
            };
        });
    };

    /**
     * Fill Front Office Status
     * @param {Object} filter - holding filter details
     * @return {void}
     */
    factory.fillFrontOfficeStatus = function (filter, filterValues) {
        var getSelectAllVal = function getSelectAllVal(officeStatus) {
            var selectAll = true;

            if (filterValues && filterValues.hk_fo_statuses) {
                selectAll = officeStatus.length === filterValues.hk_fo_statuses.length;
            }

            return selectAll;
        };

        var officeCopy = angular.copy(HK_FO_STATUS_LIST);

        if (filterValues && filterValues.hk_fo_statuses) {
            officeCopy = officeCopy.map(function (status) {
                status.selected = false;

                if (filterValues.hk_fo_statuses.indexOf(status.status) > -1) {
                    status.selected = true;
                }
                return status;
            });
        }

        filter.hasFrontOfficeStatus = {
            data: officeCopy,
            options: {
                selectAll: getSelectAllVal(officeCopy),
                hasSearch: false,
                key: 'description',
                defaultValue: 'Select Front Office Status'
            }
        };
    };

    /**
     * Fill Floors
     * @param {Object} filter - holding filter details
     * @return {void}
     */
    factory.fillFloors = function (filter, filterValues) {
        var getSelectAllVal = function getSelectAllVal(floors) {
            var selectAll = true;

            if (filterValues && filterValues.floor) {
                selectAll = floors.length === filterValues.floor.length;
            }

            return selectAll;
        };

        reportsSubSrv.fetchFloors().then(function (data) {

            var floorCopy = angular.copy(data);

            if (filterValues && filterValues.floor) {
                floorCopy = floorCopy.map(function (floorItem) {
                    floorItem.selected = false;

                    if (filterValues.floor.indexOf(floorItem.id) > -1) {
                        floorItem.selected = true;
                    }
                    return floorItem;
                });
            }

            filter.hasFloorList = {
                data: floorCopy,
                options: {
                    selectAll: getSelectAllVal(floorCopy),
                    hasSearch: true,
                    key: 'floor_number',
                    defaultValue: 'Select Floor'
                }
            };
        });
    };

    /**
     * Fill Housekeeping Status
     * @param {Object} filter - holding filter details
     * @return {void} 
     */
    factory.fillHouseKeepingStatus = function (filter, filterValues, reportName) {
        var getSelectAllVal = function getSelectAllVal(hkStatus) {
            var selectAll = true;

            if (filterValues && filterValues.hk_status_ids) {
                selectAll = hkStatus.length === filterValues.hk_status_ids.length;
            }

            return selectAll;
        },

        // Process each hk status entry
        processStatusEntries = function processStatusEntries(statuses) {
            var statusClone = angular.copy(statuses);

            if (reportName === reportNames['ROOM_STATUS_REPORT']) {
                statusClone = statusClone.map(function (status) {
                    if (status.value === 'OO') {
                        status.value = 'Show Out of Order';
                    } else if (status.value === 'OS') {
                        status.value = 'Show Out of Service';
                    } else {
                        status.value = 'Show ' + status.value;
                    }

                    return status;
                });
            }

            return statusClone;
        };

        reportsSubSrv.fetchHouseKeepingStatus().then(function (data) {
            var statusCopy = processStatusEntries(data);

            if (filterValues && filterValues.hk_status_ids) {
                statusCopy = statusCopy.map(function (hkStatus) {
                    hkStatus.selected = false;

                    if (filterValues.hk_status_ids.indexOf(hkStatus.id) > -1) {
                        hkStatus.selected = true;
                    }
                    return hkStatus;
                });
            }

            filter.hasHouseKeepingStatus = {
                data: statusCopy,
                options: {
                    selectAll: getSelectAllVal(statusCopy),
                    hasSearch: false,
                    key: 'value',
                    defaultValue: 'Select Status'
                }
            };
        });
    };

    /**
    * Fill Reservation Status
    * @param {Object} filter - holding filter details
    * @return {void}
    */
    factory.fillReservationStatus = function (filter, filterValues) {
        var getSelectAllVal = function getSelectAllVal(resStatus) {
            var selectAll = true;

            if (filterValues && filterValues.hk_reservation_statuses) {
                selectAll = resStatus.length === filterValues.hk_reservation_statuses.length;
            }

            return selectAll;
        };

        var statusCopy = angular.copy(HK_RESERVATION_STATUS_LIST);

        if (filterValues && filterValues.hk_reservation_statuses) {
            statusCopy = statusCopy.map(function (resStatus) {
                resStatus.selected = false;

                if (filterValues.hk_reservation_statuses.indexOf(resStatus.status) > -1) {
                    resStatus.selected = true;
                }
                return resStatus;
            });
        }

        filter.hasHkReservationStatus = {
            data: statusCopy,
            options: {
                selectAll: getSelectAllVal(statusCopy),
                hasSearch: false,
                key: 'description',
                defaultValue: 'Select Status'
            }
        };
    };

    /**
     * Fill actionables options
     * @param {Object} filter - holding filter details
     * @return {void}
     */
    factory.fillActionsBy = function (filter) {
        var customData = [{
            value: 'GUEST',
            name: 'Guests'
        }];

        if (!$rootScope.isHourlyRateOn) {
            customData.push({
                value: 'GROUP',
                name: 'Groups'
            });
            customData.push({
                value: 'BOTH',
                name: 'Both'
            });
        }

        filter['hasShowActionables'] = {
            data: customData,
            options: {
                key: 'name'
            }
        };
    };

    /**
     * Fill rate codes
     * @param {Object} filter - holding filter details
     * @param {Object} filterValues -contain filter values
     * @param {String} reportName name of the report
     * @return {void} 
     */
    factory.fillRateCodesList = function (filter, filterValues, reportName) {
        var getSelectAllVal = function getSelectAllVal(rateCodes) {
            var selectAll = reportName === reportNames['RESERVATIONS_BY_USER'];

            if (filterValues && filterValues.rate_ids) {
                selectAll = rateCodes.length === filterValues.rate_ids.length;
            }

            return selectAll;
        };

        reportsSubSrv.fetchRateCode().then(function (data) {
            if (reportName === reportNames['RESERVATIONS_BY_USER']) {
                var hasCustomRateItemPresent = _.find(data, { id: -1 });

                if (!hasCustomRateItemPresent) {
                    var customRate = {
                        id: -1,
                        description: "UNDEFINED"
                    };

                    data.push(customRate);
                }
            }

            var rateCodesCopy = angular.copy(data);

            if (filterValues && filterValues.rate_ids) {
                rateCodesCopy = rateCodesCopy.map(function (rateCode) {
                    rateCode.selected = false;

                    if (filterValues.rate_ids.indexOf(rateCode.id) > -1) {
                        rateCode.selected = true;
                    }
                    return rateCode;
                });
            }

            filter.hasRateCodeList = {
                data: rateCodesCopy,
                options: {
                    hasSearch: true,
                    selectAll: getSelectAllVal(rateCodesCopy),
                    singleSelect: reportName !== reportNames['RESERVATIONS_BY_USER'],
                    key: 'description',
                    defaultValue: 'Select Rate'
                }
            };
        });
    };

    /**
     * Fill room types
     * @param {Object} filter - holding filter details
     * @param {Object} filterValues -contain filter values
     * @param {String} reportName name of the report
     * @return {void} 
     */
    factory.fillRoomTypes = function (filter, filterValues, reportName) {
        var getSelectAllVal = function getSelectAllVal(roomTypes) {
            var selectAll = true;

            if (filterValues && filterValues.room_type_ids) {
                selectAll = roomTypes.length === filterValues.room_type_ids.length;
            }

            return selectAll;
        };

        reportsSubSrv.fetchRoomTypeList().then(function (data) {
            if (reportName !== reportNames['RESERVATIONS_BY_USER']) {
                var selectedData = _.filter(data, function (rooms) {
                    return !rooms.is_suite && !rooms.is_pseudo;
                });

                data = selectedData;
            }

            var roomTypesCopy = angular.copy(data);

            if (filterValues && filterValues.room_type_ids) {
                roomTypesCopy = roomTypesCopy.map(function (roomType) {
                    roomType.selected = false;

                    if (filterValues.room_type_ids.indexOf(roomType.id) > -1) {
                        roomType.selected = true;
                    }
                    return roomType;
                });
            }

            filter.hasRoomTypeList = {
                data: roomTypesCopy,
                options: {
                    hasSearch: false,
                    selectAll: getSelectAllVal(roomTypesCopy),
                    key: 'name'
                }
            };
        });
    };

    /**
     * Fill segments
     * @param {Object} filter - holding filter details
     * @param {Object} filterValues -contain filter values
     * @param {String} reportName name of the report
     * @return {void} 
     */
    factory.fillSegments = function (filter, filterValues, reportName) {
        var getSelectAllVal = function getSelectAllVal(segments) {
            var selectAll = reportName === reportNames['RESERVATIONS_BY_USER'];

            if (filterValues && filterValues.segment_ids) {
                selectAll = segments.length === filterValues.segment_ids.length;
            }

            return selectAll;
        };

        reportsSubSrv.fetchSegments().then(function (data) {
            var UNDEFINED = {
                is_active: true,
                name: 'UNDEFINED',
                value: -1
            };

            var undefinedEntry = _.find(data, { name: 'UNDEFINED' });

            if (!undefinedEntry) {
                data.push(UNDEFINED);
            }

            _.each(data, function (segmentData) {
                segmentData.id = segmentData.value;
            });

            var segmentCopy = angular.copy(data);

            if (filterValues && filterValues.segment_ids) {
                segmentCopy = segmentCopy.map(function (segment) {
                    segment.selected = false;

                    if (filterValues.segment_ids.indexOf(segment.id) > -1) {
                        segment.selected = true;
                    }
                    return segment;
                });
            }

            filter.hasSegmentList = {
                data: segmentCopy,
                options: {
                    selectAll: getSelectAllVal(segmentCopy),
                    hasSearch: false,
                    key: 'name'
                }
            };
        });
    };

    /**
     * Fill guarantee Types
     * @param {Object} filter - holding filter details
     * @param {Object} filterValues -contain filter values
     * @param {String} reportName name of the report
     * @return {void} 
     */
    factory.fillGuaranteeTypes = function (filter, filterValues, reportName) {
        var getSelectAllVal = function getSelectAllVal(guranteeTypes) {
            var selectAll = reportName === reportNames['RESERVATIONS_BY_USER'];

            if (filterValues && filterValues.include_guarantee_type) {
                selectAll = guranteeTypes.length === filterValues.include_guarantee_type.length;
            }

            return selectAll;
        };

        reportsSubSrv.fetchGuaranteeTypes().then(function (data) {
            var UNDEFINED = {
                is_active: true,
                name: 'UNDEFINED',
                value: -1
            };

            var undefinedEntry = _.find(data, { name: 'UNDEFINED' });

            if (!undefinedEntry) {
                data.push(UNDEFINED);
            }

            _.each(data, function (guaranteeTypeData) {
                guaranteeTypeData.id = guaranteeTypeData.name;
            });

            var guaranteeTypesCopy = angular.copy(data);

            if (filterValues && filterValues.include_guarantee_type) {
                guaranteeTypesCopy = guaranteeTypesCopy.map(function (guaranteeType) {
                    guaranteeType.selected = false;

                    if (filterValues.include_guarantee_type.indexOf(guaranteeType.id) > -1) {
                        guaranteeType.selected = true;
                    }
                    return guaranteeType;
                });
            }

            filter.hasGuaranteeTypeList = {
                data: guaranteeTypesCopy,
                options: {
                    selectAll: getSelectAllVal(guaranteeTypesCopy),
                    hasSearch: true,
                    key: 'name',
                    defaultValue: 'Select guarantees'
                }
            };
        });
    };

    /**
     * Fill employeeList
     * @param {Object} filter - holding filter details
     * @param {Object} filterValues -contain filter values
     * @return {void} 
     */
    factory.fillEmployeeList = function (filter, filterValues) {
        var getSelectAllVal = function getSelectAllVal(employees) {
            var selectAll = true;

            if (filterValues && filterValues.user_ids) {
                selectAll = employees.length === filterValues.user_ids.length;
            }

            return selectAll;
        };

        reportsSubSrv.fetchEmployeeList().then(function (data) {
            var employeesCopy = angular.copy(data.results);

            if (filterValues && filterValues.user_ids) {
                employeesCopy = employeesCopy.map(function (employee) {
                    employee.selected = false;

                    if (filterValues.user_ids.indexOf(employee.id) > -1) {
                        employee.selected = true;
                    }
                    return employee;
                });
            }

            filter.hasUsers = {
                title: 'Employees',
                data: employeesCopy,
                options: {
                    selectAll: getSelectAllVal(employeesCopy),
                    hasSearch: true,
                    key: 'maid_name',
                    altKey: 'email'
                }
            };
        });
    };

    /**
     * Fill AddonGroups and addons
     * @param {Object} filter - holding filter details
     * @param {Object} filterValues -contain filter values
     * @param {String} reportName - name of the report
     * @return {void} 
     */
    factory.fillAddonGroups = function (filter, filterValues, reportName) {
        var getSelectAllVal = function getSelectAllVal(addOnGroups) {
            var selectAll = true;

            if (filterValues && filterValues.addon_group_ids) {
                selectAll = addOnGroups.length === filterValues.addon_group_ids.length;
            } else if (filterValues && !filterValues.addon_group_ids) {
                selectAll = false;
            }
            return selectAll;
        };

        var getSelectAllValAddons = function getSelectAllValAddons(addons) {
            var selectAll = true;

            if (filterValues && filterValues.addon_ids) {
                var originalAddonGroupIds = filterValues.addon_ids,
                    addonLength = 0;

                _.each(addons, function (ag) {
                    if (originalAddonGroupIds.indexOf(ag.group_id) > -1) {
                        addonLength = addonLength + ag.list_of_addons.length;
                    }
                });
                selectAll = filterValues.addon_ids.length === addonLength;
            }

            return selectAll;
        };

        var flattenAddons = function flattenAddons(addons) {
            var data = [];

            _.each(addons, function (addon) {
                if (!addon.disabled) {
                    _.each(addon.list_of_addons, function (la) {
                        la.selected = false;
                        if (filterValues && !!filterValues.addon_ids && filterValues.addon_ids.indexOf(la.addon_id) > -1 || angular.isUndefined(filterValues)) {
                            la.selected = true;
                        }
                        data.push(la);
                    });
                }
            });
            return data;
        };

        var fillAGAs = function fillAGAs(data, addonData) {
            var addonGroupsCopy = angular.copy(data),
                addonsCopy = angular.copy(addonData);

            if (filterValues && filterValues.addon_group_ids) {
                addonGroupsCopy = addonGroupsCopy.map(function (addonGroup) {
                    addonGroup.selected = false;
                    if (filterValues.addon_group_ids.indexOf(addonGroup.id) > -1) {
                        addonGroup.selected = true;
                    }
                    return addonGroup;
                });
            }
            filter.hasAddonGroups = {
                title: 'Addon Groups',
                data: addonGroupsCopy,
                options: {
                    selectAll: getSelectAllVal(addonGroupsCopy),
                    hasSearch: true,
                    key: 'name'
                },
                affectsFilter: {
                    name: 'hasAddons',
                    process: function process(filter, selectedItems) {
                        _.each(filter.originalData, function (od) {
                            od.disabled = true;
                        });
                        _.each(filter.originalData, function (od) {
                            _.each(selectedItems, function (si) {
                                if (od.group_id === si.id) {
                                    od.disabled = false;
                                }
                            });
                        });
                        filter.updateData();
                    }
                }
            };
            filter.hasAddons = {
                data: flattenAddons(addonData),
                originalData: addonsCopy,
                options: {
                    selectAll: getSelectAllValAddons(addonsCopy),
                    hasSearch: true,
                    key: 'addon_name'
                },
                updateData: function updateData() {
                    this.data = flattenAddons(this.originalData);
                    this.options.selectAll = getSelectAllValAddons(addonsCopy);
                }
            };
        };

        reportsSubSrv.fetchChargeNAddonGroups({ for_addon_forecast_report: reportName === 'Add-On Forecast', include_payment: reportName === 'Financial Transaction - Revenue Report' }).then(function (data) {
            reportsSubSrv.fetchAddons({ 'addon_group_ids': _.pluck(data, 'id') }).then(fillAGAs.bind(null, data));
        });
    };

    /**
     * Fill reservation statuses
     * @param {Object} filter - holding filter details
     * @param {Object} filterValues -contain filter values
     * @return {void} 
     */
    factory.fillResStatus = function (filter, filterValues) {
        var showAltStatuses = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
        var isGuestBalanceReport = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
        var reportName = arguments[4];

        var processReservationStatus = function processReservationStatus(data) {
            var resStatusCopy = angular.copy(data);

            var getSelectAllVal = function getSelectAllVal(resStatus) {
                var selectAll = true;

                if (filterValues && filterValues.status_ids) {
                    selectAll = resStatus.length === filterValues.status_ids.length;
                } else if (angular.isDefined(filterValues) && !filterValues.status_ids) {
                    selectAll = false;
                }

                return selectAll;
            };

            if (filterValues && filterValues.status_ids) {
                resStatusCopy = resStatusCopy.map(function (resStatus) {
                    resStatus.selected = false;

                    if (filterValues.status_ids.indexOf(resStatus.id.toString()) > -1) {
                        resStatus.selected = true;
                    }
                    return resStatus;
                });
            }

            filter.hasReservationStatus = {
                data: resStatusCopy,
                options: {
                    selectAll: getSelectAllVal(resStatusCopy),
                    hasSearch: false,
                    key: 'status',
                    defaultValue: 'Select status'
                }
            };
        };

        var fillReservationStatus = function fillReservationStatus(data) {
            var reservationData;
            reservationData = angular.copy(data);

            var getSelectAll = function getSelectAll(resStatus) {
                var selectAll = true;

                if (filterValues && filterValues.reservation_status) {
                    selectAll = resStatus.length === filterValues.reservation_status.length;
                } else if (angular.isDefined(filterValues) && !filterValues.reservation_status) {
                    selectAll = false;
                }

                return selectAll;
            };

            var dueInExists = function dueInExists() {
                return reservationData.some(function (data) {
                    return data.value === 'DUE_IN';
                });
            };
            var dueOutExists = function dueOutExists() {
                return reservationData.some(function (data) {
                    return data.value === 'DUE_OUT';
                });
            };

            if (!dueInExists() && !dueOutExists()) {
                reservationData.push({ id: null, value: "DUE_IN", description: "Due In" }, { id: null, value: "DUE_OUT", description: "Due Out" });
            }

            if (filterValues && filterValues.reservation_status) {
                reservationData = reservationData.map(function (resStatus) {
                    resStatus.selected = false;

                    if (filterValues.reservation_status.indexOf(resStatus.value) > -1) {
                        resStatus.selected = true;
                    }
                    return resStatus;
                });
            }

            filter.hasReservationStatus = {
                data: reservationData,
                options: {
                    hasSearch: false,
                    selectAll: getSelectAll(reservationData),
                    key: 'value',
                    defaultValue: 'Select Status'
                }
            };
        };

        if (showAltStatuses) {
            // This is to display an alternate version of the statuses (see top of file)
            processReservationStatus(ALT_RESERVATION_STATUS);
        } else if (isGuestBalanceReport) {
            processReservationStatus(RESERVATION_STATUS_GUEST_BALANCE_REPORT);
        } else if (reportName === reportNames['ACTIONS_MANAGER']) {
            reportsSubSrv.getReservationStatus().then(fillReservationStatus);
        } else {
            reportsSubSrv.fetchReservationStatus().then(processReservationStatus);
        }
    };

    /**
     * Fill hold status
     * @param {Object} filter - holding filter details
     * @param {Object} filterValues -contain filter values
     * @return {void}
     */
    factory.fillHoldStatus = function (filter, filterValues) {
        var processHoldStatus = function processHoldStatus(data) {
            var resStatusCopy = angular.copy(data);

            var getSelectAllVal = function getSelectAllVal(resStatus) {
                var selectAll = true;

                if (filterValues && filterValues.hold_status_ids) {
                    selectAll = resStatus.length === filterValues.hold_status_ids.length;
                } else if (angular.isDefined(filterValues) && !filterValues.hold_status_ids) {
                    selectAll = false;
                }

                return selectAll;
            };

            if (filterValues && filterValues.hold_status_ids) {
                resStatusCopy = resStatusCopy.map(function (resStatus) {
                    resStatus.selected = false;

                    if (filterValues.hold_status_ids.indexOf(resStatus.id.toString()) > -1) {
                        resStatus.selected = true;
                    }
                    return resStatus;
                });
            }

            filter.hasHoldStatus = {
                data: resStatusCopy,
                options: {
                    hasSearch: false,
                    selectAll: getSelectAllVal(resStatusCopy),
                    key: 'name',
                    value_key: 'name'
                }
            };
        };
        reportsSubSrv.fetchHoldStatus().then(processHoldStatus);
    };

    /**
     * Fill Rate codes
     * @param {Object} filter - holding filter details
     * @param {Object} filterValues -contain filter values
     * @return {Object} params - params
     */
    factory.fillRateCodes = function (filter, filterValues, params) {

        if (filterValues && filterValues.rate_id) {
            params.rate_code = filterValues.rate_id;
        }
        reportsSubSrv.fetchRateCode().then(function (data) {
            filter.hasRateCode = {
                title: 'Rate Codes',
                data: data
            };
        });
    };

    /**
     * Fill Aging balances
     * @param {Object} filter - holding filter details
     * @param {Object} filterValues -contain filter values
     * @return {void} set filter values
     */
    factory.fillAgingBalances = function (filter, filterValues) {
        var ageBuckets = [{ id: "0to30", status: "0-30 DAYS" }, { id: "31to60", status: "31-60 DAYS" }, { id: "61to90", status: "61-90 DAYS" }, { id: "91to120", status: "91-120 DAYS" }, { id: "120plus", status: "120+ DAYS" }],
            getSelectAllVal = function getSelectAllVal(ages) {
            var selectAll = true;

            if (filterValues && filterValues.age_buckets) {
                selectAll = ages.length === filterValues.age_buckets.length;
            } else if (angular.isDefined(filterValues) && !filterValues.age_buckets) {
                selectAll = false;
            }

            return selectAll;
        },
            data = angular.copy(ageBuckets);

        if (filterValues && filterValues.age_buckets) {
            data = data.map(function (age) {
                age.selected = false;

                if (filterValues.age_buckets.indexOf(age.id) > -1) {
                    age.selected = true;
                }
                return age;
            });
        }

        filter.hasIncludeAgingBalance = {
            data: data,
            options: {
                hasSearch: false,
                selectAll: getSelectAllVal(data),
                key: 'status',
                defaultValue: 'Select Aging Balance'
            }
        };
    };

    /**
     * Fill account names
     * @param {Object} filter - holding filter details
     * @param {Object} filterValues -contain filter values
     * @return {void} set filter values
     */
    factory.fillAccountNames = function (filter, filterValues) {
        var getSelectAllVal = function getSelectAllVal(accounts) {
            var selectAll = false;

            if (filterValues && filterValues.account_ids) {
                selectAll = accounts.length === filterValues.account_ids.length;
            } else if (angular.isDefined(filterValues) && !filterValues.account_ids) {
                selectAll = false;
            }

            return selectAll;
        };

        reportsSubSrv.fetchAccounts().then(function (data) {
            var accounts = angular.copy(data);

            if (filterValues && filterValues.account_ids) {
                accounts = accounts.map(function (account) {
                    accounts.selected = false;

                    if (filterValues.account_ids.indexOf(account.id) > -1) {
                        account.selected = true;
                    }
                    return account;
                });
            }
            filter.hasAccountSearch = {
                data: accounts,
                options: {
                    selectAll: getSelectAllVal(accounts),
                    hasSearch: true,
                    key: 'account_name',
                    defaultValue: 'Select Accounts'
                }
            };
        });
    };

    return factory;
}]);