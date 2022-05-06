'use strict';

sntRover.factory('RVReportParserFac', ['$rootScope', '$filter', '$timeout', 'RVReportNamesConst', function ($rootScope, $filter, $timeout, reportNames) {
    var factory = {};

    factory.parseAPI = function (reportName, apiResponse, options, resultTotalRow) {

        if (reportName === reportNames['FINANCIAL_TRANSACTIONS_ADJUSTMENT_REPORT']) {
            return _.isEmpty(apiResponse) ? apiResponse : $_parseFinTransAdjustReport(reportName, apiResponse, options);
        }

        if (reportName === reportNames['DAILY_PRODUCTION_ROOM_TYPE']) {
            return _.isEmpty(apiResponse) ? apiResponse : $_parseDailyProduction(reportName, apiResponse, options, resultTotalRow);
        }

        if (reportName === reportNames['DAILY_PRODUCTION_DEMO']) {
            return _.isEmpty(apiResponse) ? apiResponse : parseDailyProductionByDemographics(apiResponse);
        }

        // a very special parser for daily transaction report
        // in future we may make this check generic, if more
        // reports API structure follows the same pattern
        if (reportName === reportNames['DAILY_TRANSACTIONS'] || reportName === reportNames['DAILY_PAYMENTS']) {
            return _.isEmpty(apiResponse) ? apiResponse : $_parseNumeralData(reportName, apiResponse, options);
        }

        // a very special parser for daily transaction report
        // in future we may make this check generic, if more
        // reports API structure follows the same pattern
        else if (reportName == reportNames['RATE_ADJUSTMENTS_REPORT']) {
                return _.isEmpty(apiResponse) ? apiResponse : $_parseRateAdjustments(reportName, apiResponse, options);
            } else if (reportName == reportNames['GROUP_PICKUP_REPORT']) {
                return _.isEmpty(apiResponse) ? apiResponse : $_parseGroupPickupReport(reportName, apiResponse, options);
            }

            // a very special parser for guest deposit report
            else if (reportName === reportNames['DEPOSIT_REPORT']) {
                    return _.isEmpty(apiResponse) ? apiResponse : $_parseDepositReport(reportName, apiResponse, options);
                }

                // a very special parser for group deposit report
                else if (reportName === reportNames['GROUP_DEPOSIT_REPORT']) {
                        return _.isEmpty(apiResponse) ? apiResponse : $_parseDepositReport(reportName, apiResponse, options);
                    }

                    // otherwise a super parser for reports that can be grouped by
                    else if (reportName === reportNames['RESERVATIONS_BY_USER'] && !!options['groupedByKey']) {
                            return _.isEmpty(apiResponse) ? apiResponse : $_parseDataToSubArrays(reportName, apiResponse, options);
                        } else if (reportName === reportNames['ROOMS_OOO_OOS']) {
                            return _.isEmpty(apiResponse) ? apiResponse : $_parseDataForRoomOOOOOSReport(reportName, apiResponse, options);
                        }

                        // a common parser that data into meaningful info like - notes, guests, addons, compTAgrp
                        // this can be reused by the parsers defined above
                        else {
                                return _.isEmpty(apiResponse) ? apiResponse : $_parseDataToInfo(reportName, apiResponse, options);
                            }
    };

    /**
     * The normal API reponse (result) is a single array object entry
     * with two keys 'adjustments' and 'deleted_charges'. Both these
     * keys have a array of values. Each value representing an adjustment
     * or deleted charge respectively.
     *
     * The purpose of this function to filter the API reponse based on
     * created_id. So we are gonna modify the API reponse array to an object
     * with keys for "created_id_by" and value an object with 'adjustments' and 'deleted_charges'
     * So under each created_id_by all 'adjustments' and 'deleted_charges' associated.
     */
    function $_preParseFinTransAdjustReport(reportName, apiResponse, options) {
        var returnObj = {},
            adjustments = [],
            deletedCharges = [];

        var groupByIdAdjustments = {},
            groupByIdDeleteCharges = {};

        var i, j, key, idBy;

        var fillEntries = function fillEntries(source, toKey) {
            for (key in source) {
                if (!source.hasOwnProperty(key)) {
                    continue;
                }

                for (i = 0, j = source[key].length; i < j; i++) {
                    idBy = source[key].created_by + '__' + source[key].creator_id;

                    if (!returnObj.hasOwnProperty(idBy)) {
                        returnObj[idBy] = {
                            'adjustments': [],
                            'deleted_charges': []
                        };
                    }

                    returnObj[idBy][toKey].push(source[key]);
                }
            }
        };

        var fillMissingIds = function fillMissingIds(ary) {
            for (i = 0, j = ary.length; i < j; i++) {
                if (ary[i]['creator_id'] === null) {
                    ary[i]['creator_id'] = 'UNDEF';
                }
            }
        };

        if (!apiResponse.length) {
            return [];
        }

        for (i = 0, j = apiResponse.length; i < j; i++) {
            adjustments = apiResponse[i]['adjustments'], deletedCharges = apiResponse[i]['deleted_charges'];

            fillMissingIds(adjustments);
            fillMissingIds(deletedCharges);

            groupByIdAdjustments = _.groupBy(adjustments, 'creator_id');
            groupByIdDeleteCharges = _.groupBy(deletedCharges, 'creator_id');
        }

        fillEntries(groupByIdAdjustments, 'adjustments');
        fillEntries(groupByIdDeleteCharges, 'deleted_charges');

        for (key in returnObj) {
            if (!returnObj.hasOwnProperty(key)) {
                continue;
            }

            returnObj[key] = $_parseFinTransAdjustReport(reportName, returnObj[key], options);
        }

        return returnObj;
    }

    function $_parseFinTransAdjustReport(reportName, apiResponse, options) {
        var returnAry = [],
            adjustments = [],
            deletedCharges = [];

        var i, j;

        var getRemarksAry = function getRemarksAry(remark) {
            if (remark !== "" && remark !== null) {
                if (remark !== "" && remark !== null) {
                    var ary = remark.split('<br />');

                    return _.reject(ary, function (i) {
                        return i === '' || i === ' ';
                    });
                }
            }
        };

        var processAry = function processAry(source, type) {
            var k, l;

            var makeCopy,
                amt,
                totalAmount = 0;

            for (k = 0, l = source.length; k < l; k++) {
                makeCopy = angular.copy(source[k]);

                amt = parseFloat(makeCopy.amount);
                amt = isNaN(amt) ? 0 : amt;
                totalAmount += amt;

                if (0 === k) {
                    angular.extend(makeCopy, {
                        isReport: true,
                        rowspan: l + 1,
                        charge_type: type,
                        amount_class: type === 'Adjustments' ? 'purple' : 'red',
                        posted_date: makeCopy.posted.substring(0, 10),
                        posted_time: makeCopy.posted.substring(11),
                        modified_date: makeCopy.modified.substring(0, 10),
                        modified_time: makeCopy.modified.substring(11),
                        remarkAry: getRemarksAry(makeCopy.remark)
                    });
                    returnAry.push(makeCopy);
                } else {
                    angular.extend(makeCopy, {
                        isReport: true,
                        amount_class: type === 'Adjustments' ? 'purple' : 'red',
                        posted_date: makeCopy.posted.substring(0, 10),
                        posted_time: makeCopy.posted.substring(11),
                        modified_date: makeCopy.modified.substring(0, 10),
                        modified_time: makeCopy.modified.substring(11),
                        remarkAry: getRemarksAry(makeCopy.remark)
                    });
                    returnAry.push(makeCopy);
                }

                if (1 === l - k) {
                    returnAry.push({
                        isReportSubTotal: true,
                        break_class: 'row-break',
                        amount_class: type === 'Adjustments' ? 'purple' : 'red',
                        total_amount: totalAmount
                    });
                }
            }
        };

        if (!apiResponse.length) {
            return [];
        }

        for (i = 0, j = apiResponse.length; i < j; i++) {
            adjustments = apiResponse[i]['adjustments'], deletedCharges = apiResponse[i]['deleted_charges'];

            processAry(adjustments, 'Adjustments');
            processAry(deletedCharges, 'Deleted Charges');
        }

        return returnAry;
    }

    function $_parseDailyProduction(reportName, apiResponse, options, resultTotalRow) {
        /**
         * we are gonna transform the actual api response with the following strucutre:
         *
         * {
         *      '2015-04-01': [{room_type, room_type_id}, {room_type, room_type_id}],
         *      '2015-04-02': [{room_type, room_type_id}, {room_type, room_type_id}]
         * }
         *
         * to the following structure:
         *
         * {
         *      'bunk__1': {
         *          '2015-04-01': {
         *              ...
         *              ...
         *          },
         *          '2015-04-02': {
         *              ...
         *              ...
         *          }
         *      },
         *      'classic__2': {
         *          '2015-04-01': {
         *              ...
         *              ...
         *          },
         *          '2015-04-02': {
         *              ...
         *              ...
         *          }
         *      }
         * }
         *
         * WHY? Coz we have to!
         */

        var i, j, uuid;

        var returnObj = {};

        var zerothKey = _.keys(apiResponse)[0],
            zerothData = apiResponse[zerothKey];

        for (i = 0, j = zerothData.length; i < j; i++) {
            uuid = zerothData[i]['room_type'] + '__' + zerothData[i]['room_type_id'];
            returnObj[uuid] = {};
        }

        var dateData, makeCopy, ithUuid, roomName;

        for (var dateKey in apiResponse) {
            if (!apiResponse.hasOwnProperty(dateKey)) {
                continue;
            }

            var dateData = apiResponse[dateKey];

            for (i = 0, j = dateData.length; i < j; i++) {
                makeCopy = angular.copy(dateData[i]);
                ithUuid = makeCopy['room_type'] + '__' + makeCopy['room_type_id'];

                returnObj[ithUuid][dateKey] = angular.copy(makeCopy);
            }
        }

        /**
         * so we need to transform the resultTotalRow for
         * blah blah blah.. I will wirte later
         */
        var totalDatekey;

        returnObj['Totals'] = {};
        for (i = 0, j = resultTotalRow.length; i < j; i++) {
            totalDatekey = _.keys(resultTotalRow[i])[0];
            returnObj['Totals'][totalDatekey] = angular.copy(resultTotalRow[i][totalDatekey]);
        }

        return returnObj;
    }

    var initPrdDemoGrphcsRow = function initPrdDemoGrphcsRow(showInBold, displayLabel, keyInAPI) {
        return {
            'showInBold': showInBold,
            'displayLabel': displayLabel,
            'key-in-api': keyInAPI,
            'valueList': []
        };
    };

    function parseDailyProductionByDemographics(apiResponse) {
        var dateList = _.keys(apiResponse),
            firstDate = dateList[0],
            markets = _.pluck(apiResponse[firstDate].markets, "name"),
            sources = _.pluck(apiResponse[firstDate].sources, "name"),
            origins = _.pluck(apiResponse[firstDate].origins, "name"),
            segments = _.pluck(apiResponse[firstDate].segments, "name"),
            parsedDataListing = [],
            e = null;

        /* forming the left side */
        // market
        parsedDataListing.push(initPrdDemoGrphcsRow(true, 'Market', 'market_totals'));
        markets.map(function (value) {
            parsedDataListing.push(initPrdDemoGrphcsRow(false, value, 'markets'));
        });

        // sources
        parsedDataListing.push(initPrdDemoGrphcsRow(true, 'Source', 'source_totals'));
        sources.map(function (value) {
            parsedDataListing.push(initPrdDemoGrphcsRow(false, value, 'sources'));
        });

        // origins
        parsedDataListing.push(initPrdDemoGrphcsRow(true, 'Origin', 'origin_totals'));
        origins.map(function (value) {
            parsedDataListing.push(initPrdDemoGrphcsRow(false, value, 'origins'));
        });

        // segments
        parsedDataListing.push(initPrdDemoGrphcsRow(true, 'Segment', 'segment_totals'));
        segments.map(function (value) {
            parsedDataListing.push(initPrdDemoGrphcsRow(false, value, 'segments'));
        });

        _.each(parsedDataListing, function (rowData) {
            _.each(apiResponse, function (dateData) {
                e = dateData[rowData['key-in-api']];
                if (e instanceof Array) {
                    // as per db model, a demogrphics' name is a unique for hotel
                    e = _.findWhere(e, { 'name': rowData.displayLabel });
                }
                rowData.valueList = rowData.valueList.concat([{ key: 'res_count', value: e.total_reservations_count }, { key: 'available', value: e.available_rooms_count }, { key: 'future_revenue', value: $filter('currency')(e.future_revenue, $rootScope.currencySymbol, 2) }, { key: 'adr', value: $filter('currency')(e.adr, $rootScope.currencySymbol, 2) }, { key: 'rate_revenue', value: $filter('currency')(e.rate_revenue, $rootScope.currencySymbol, 2) }, { key: 'arrivals', value: e.arrivals }, { key: 'adults', value: e.adults }, { key: 'children', value: e.children }, { key: 'fnb_future_revenue', value: $filter('currency')(e.fnb_future_revenue, $rootScope.currencySymbol, 2) }, { key: 'fnb_actual_revenue', value: $filter('currency')(e.fnb_actual_revenue, $rootScope.currencySymbol, 2) }, { key: 'others_future_revenue', value: $filter('currency')(e.others_future_revenue, $rootScope.currencySymbol, 2) }, { key: 'others_actual_revenue', value: $filter('currency')(e.others_actual_revenue, $rootScope.currencySymbol, 2) }, { key: 'total_future_revenue', value: $filter('currency')(e.total_future_revenue, $rootScope.currencySymbol, 2) }, { key: 'total_actual_revenue', value: $filter('currency')(e.total_actual_revenue, $rootScope.currencySymbol, 2) }]);
            });
        });

        return {
            listing: parsedDataListing,
            dates: dateList
        };
    }

    function $_parseDataToInfo(reportName, apiResponse, options) {
        var returnAry = [],
            makeCopy = {},
            customData = [],
            guestData = {},
            noteData = {},
            actionData = {},
            cancelData = {},
            adjustData = [],
            options = options,
            guestNoteData = {},
            reservationNoteData = {};

        var i, j, m, n;

        var excludeReports = function excludeReports(names) {
            return !!_.find(names, function (n) {
                return n === reportName;
            });
        };

        var checkGuest = function checkGuest(item) {
            var check = !!options['checkGuest'] && !!item['accompanying_names'] && !!item['accompanying_names'].length;

            return check;
        };

        var checkCompTrvlGrp = function checkCompTrvlGrp(item) {
            var check = !!item['company_name'] || !!item['travel_agent_name'] || !!item['group_name'];

            return check;
        };

        var checkVechicleRegNumber = function checkVechicleRegNumber(item) {
            var check = !!item['vehicle_registration_number'];

            return check;
        };

        var checkPhoneNumber = function checkPhoneNumber(item) {
            var check = !!item['phone_number'];

            return check;
        };

        var checkAddOns = function checkAddOns(item) {
            var check = !!item['add_ons'] && !!item['add_ons'].length || !!item['addon_details'];

            return check;
        };

        var checkGuestNote = function checkGuestNote(item) {
            var check = !!options['checkGuestNote'] && !!item['guest_notes'] && !!item['guest_notes'].length;

            return check;
        };
        var checkReservationNote = function checkReservationNote(item) {
            var check = !!options['checkReservationNote'] && !!item['reservation_notes'] && !!item['reservation_notes'].length;

            return check;
        };

        var checkAction = function checkAction(item) {
            var check = !!options['checkAction'] && !!item['actions'] && !!item['actions'].length;

            return check;
        };

        var checkCancel = function checkCancel(item) {
            var check = !!options['checkCancel'] && excludeReports([reportNames['ARRIVAL'], reportNames['IN_HOUSE_GUEST']]);

            return check ? !!item['cancel_reason'] : false;
        };

        var checkRateAdjust = function checkRateAdjust(item) {
            var check = !!options['checkRateAdjust'] && !!item['rate_adjustment_reasons'] && !!item['rate_adjustment_reasons'].length;

            return check;
        };

        var isForGenericReports = function isForGenericReports(reportName) {
            var allowNames = ['ARRIVAL', 'IN_HOUSE_GUEST', 'CANCELLATION_NO_SHOW', 'DEPARTURE', 'LOGIN_AND_OUT_ACTIVITY', 'RESERVATIONS_BY_USER'];

            return !!_.find(allowNames, function (name) {
                return reportName == reportNames[name];
            });
        };

        if (isForGenericReports(reportName)) {
            for (i = 0, j = apiResponse.length; i < j; i++) {
                makeCopy = angular.copy(apiResponse[i]);
                customData = [];
                guestData = {};
                guestNoteData = {};
                reservationNoteData = {};
                cancelData = {};
                adjustData = [];

                if (checkGuest(makeCopy)) {
                    angular.extend(guestData, {
                        isGuestData: true,
                        guestNames: angular.copy(makeCopy['accompanying_names'])
                    });
                }

                if (checkCompTrvlGrp(makeCopy)) {
                    angular.extend(guestData, {
                        isGuestData: true,
                        company_name: makeCopy.company_name,
                        travel_agent_name: makeCopy.travel_agent_name,
                        group_name: makeCopy.group_name
                    });
                }

                if (checkVechicleRegNumber(makeCopy)) {
                    angular.extend(guestData, {
                        isGuestData: true,
                        vehicle_registration_number: angular.copy(makeCopy['vehicle_registration_number'])
                    });
                }

                if (checkPhoneNumber(makeCopy)) {
                    angular.extend(guestData, {
                        isGuestData: true,
                        phone_number: angular.copy(makeCopy['phone_number'])
                    });
                }

                if (checkAddOns(makeCopy)) {
                    angular.extend(guestData, {
                        isGuestData: true,
                        addOns: angular.copy(makeCopy['add_ons']),
                        addOnDetails: angular.copy(makeCopy['addon_details'])
                    });
                }

                if (_.size(guestData)) {
                    customData.push(guestData);
                }

                if (checkCancel(makeCopy)) {
                    cancelData = {
                        isCancelData: true,
                        reason: angular.copy(makeCopy['cancel_reason'])
                    };
                    customData.push(cancelData);
                }

                if (checkGuestNote(makeCopy)) {
                    guestNoteData = {
                        isGuestNoteData: true,
                        guestNotes: angular.copy(makeCopy['guest_notes'])
                    };
                    customData.push(guestNoteData);
                }
                if (checkReservationNote(makeCopy)) {
                    reservationNoteData = {
                        isReservationNoteData: true,
                        reservationNotes: angular.copy(makeCopy['reservation_notes'])
                    };
                    customData.push(reservationNoteData);
                }

                if (checkAction(makeCopy)) {
                    actionData = {
                        isActionData: true,
                        actions: angular.copy(makeCopy['actions'])
                    };
                    customData.push(actionData);
                }

                if (checkRateAdjust(makeCopy)) {
                    adjustData = {
                        isAdjustData: true,
                        reasons: angular.copy(makeCopy['rate_adjustment_reasons'])
                    };
                    customData.push(adjustData);
                }

                // IF: we found custom items
                // set row span for the parent tr a rowspan
                // mark the class that must be added to the last tr
                // ELSE: since this tr won't have any childs, mark the class that must be added to the last tr
                if (!!customData.length) {
                    makeCopy.rowspan = customData.length + 1;
                    customData[customData.length - 1]['className'] = 'row-break';
                } else {
                    makeCopy.className = 'row-break';
                }

                // do this only after the above code that adds
                // 'row-break' class to the row
                if (reportName === reportNames['LOGIN_AND_OUT_ACTIVITY']) {
                    if (makeCopy.hasOwnProperty('action_type') && makeCopy['action_type'] === 'INVALID_LOGIN') {
                        makeCopy['action_type'] = 'INVALID LOGIN';
                        makeCopy.className = 'row-break invalid';
                    }

                    if (makeCopy.hasOwnProperty('date')) {
                        makeCopy['uiDate'] = makeCopy['date'].split(', ')[0];
                        makeCopy['uiTime'] = makeCopy['date'].split(', ')[1];
                    }
                }

                // push 'makeCopy' into 'returnAry'
                makeCopy.isReport = true;
                returnAry.push(makeCopy);

                // push each item in 'customData' in to 'returnAry'
                for (m = 0, n = customData.length; m < n; m++) {
                    returnAry.push(customData[m]);
                }
            }
        } else {
            returnAry = apiResponse;
        }

        return returnAry;
    }

    function $_parseDataToSubArrays(reportName, apiResponse, options) {
        var returnObj = {};
        var groupByKey = options['groupedByKey'];

        var i, j;

        for (i = 0, j = apiResponse.length; i < j; i++) {
            if (apiResponse[i][groupByKey] === '') {
                apiResponse[i][groupByKey] = 'N/A';
            }
        }

        var returnObj = _.groupBy(apiResponse, groupByKey);

        _.each(returnObj, function (value, key, list) {
            returnObj[key] = angular.copy($_parseDataToInfo(reportName, value, options));
        });

        return returnObj;
    }

    function $_parseNumeralData(reportName, apiResponse, options) {
        var returnAry = [],
            makeCopy = {},
            objKeyName = '',
            chargeGrpObj = {},
            itemCopy = {};

        var i, j, key, k, l;

        for (i = 0, j = apiResponse.length; i < j; i++) {

            makeCopy = angular.copy(apiResponse[i]);
            objKeyName = key;

            for (key in makeCopy) {
                if (!makeCopy.hasOwnProperty(key) || key === '0' || key === 0) {
                    continue;
                }
                objKeyName = key;
                chargeGrpObj = makeCopy[key];
            }

            // loop through the "details" in api response
            if (chargeGrpObj['details'].length) {
                for (k = 0, l = chargeGrpObj['details'].length; k < l; k++) {
                    itemCopy = angular.copy(chargeGrpObj['details'][k]);

                    if (k === 0) {
                        itemCopy.chargeGroupName = objKeyName;
                        itemCopy.rowspan = l + 1; // which is chargeGrpObj['details'].length
                    }

                    itemCopy.isReport = true;

                    returnAry.push(itemCopy);
                }
            }
            // if there are no entries in "details", we need to fill 'NA'
            else {
                    itemCopy = {};

                    itemCopy.chargeGroupName = objKeyName;
                    itemCopy.rowspan = 2;
                    itemCopy.isReport = true;

                    returnAry.push(itemCopy);
                }

            // next insert "sub_total" from api response to retrunAry
            chargeGrpObj['sub_total']['isReportSubTotal'] = true;
            chargeGrpObj['sub_total']['chargeGroupName'] = objKeyName;
            chargeGrpObj['sub_total']['className'] = 'row-break';
            returnAry.push(chargeGrpObj['sub_total']);
        }

        return returnAry;
    }

    function $_parseRateAdjustments(reportName, apiResponse, options) {
        var returnAry = [],
            customData = [],
            makeCopy,
            stayDates,
            stayDatesTotal;

        var i, j, k, l;

        // loop through the api response
        for (i = 0, j = apiResponse.length; i < j; i++) {

            // we'll work with a copy of the ith item
            makeCopy = angular.copy(apiResponse[i]);

            // if we have 'stay_dates' for this reservation
            if (makeCopy.hasOwnProperty('stay_dates') && makeCopy['stay_dates'].length) {
                for (k = 0, l = makeCopy['stay_dates'].length; k < l; k++) {
                    stayDates = makeCopy['stay_dates'][k];

                    // include the first stayDates details in the
                    // same row as that of the main reservation details
                    if (k === 0) {
                        angular.extend(makeCopy, {
                            'isReport': true,
                            'rowspan': l + 1,
                            'stay_date': stayDates.stay_date,
                            'original_amount': stayDates.original_amount,
                            'adjusted_amount': stayDates.adjusted_amount,
                            'variance': stayDates.variance,
                            'reason': stayDates.reason,
                            'adjusted_by': stayDates.adjusted_by
                        });
                        returnAry.push(makeCopy);
                    }

                    // create additional sub rows to represent the
                    // rest of the stay_dates
                    else {
                            customData = {};
                            angular.extend(customData, {
                                'isSubReport': true,
                                'stay_date': stayDates.stay_date,
                                'original_amount': stayDates.original_amount,
                                'adjusted_amount': stayDates.adjusted_amount,
                                'variance': stayDates.variance,
                                'reason': stayDates.reason,
                                'adjusted_by': stayDates.adjusted_by
                            });
                            returnAry.push(customData);
                        }
                }
            } else {
                returnAry.push(makeCopy);
            }

            // if we have 'stay_dates_total' for this reservation
            if (makeCopy.hasOwnProperty('stay_dates_total') && makeCopy['stay_dates_total'].hasOwnProperty('original_amount')) {
                stayDatesTotal = makeCopy['stay_dates_total'];
                customData = {};

                angular.extend(customData, {
                    'isSubTotal': true,
                    'className': 'row-break',
                    'original_amount': stayDatesTotal.original_amount,
                    'adjusted_amount': stayDatesTotal.adjusted_amount,
                    'variance': stayDatesTotal.variance
                });
                returnAry.push(customData);
            } else {
                returnAry.push(makeCopy);
            }
        }

        return returnAry;
    }

    function $_parseGroupPickupReport(reportName, apiResponse, options) {
        var returnAry = [],
            customData = [],
            makeCopy,
            groupData,
            groupDataTotal,
            hasData;

        var i, j, k, l;

        // loop through the api response
        for (i = 0, j = apiResponse.length; i < j; i++) {

            // we'll work with a copy of the ith item
            makeCopy = angular.copy(apiResponse[i]);

            hasData = true;

            // if we have 'group_data' for this group
            if (makeCopy.hasOwnProperty('group_data') && makeCopy['group_data'].length) {
                for (k = 0, l = makeCopy['group_data'].length; k < l; k++) {
                    groupData = makeCopy['group_data'][k];

                    // include the first groupData details in the
                    // same row as that of the main group details
                    if (k === 0) {
                        angular.extend(makeCopy, {
                            'isReport': true,
                            'rowspan': l + 1,
                            'date': groupData.date,
                            'hold_status': groupData.hold_status,
                            'room_type': groupData.room_type,
                            'rooms_available': groupData.rooms_available,
                            'rooms_held_non_deduct': groupData.rooms_held_non_deduct,
                            'rooms_held_deduct': groupData.rooms_held_deduct,
                            'rooms_held_picked_up': groupData.rooms_held_picked_up,
                            'pickup_percentage': groupData.pickup_percentage
                        });
                        returnAry.push(makeCopy);
                    }

                    // create additional sub rows to represent the
                    // rest of the stay_dates
                    else {
                            customData = {};
                            angular.extend(customData, {
                                'isSubReport': true,
                                'date': groupData.date,
                                'hold_status': groupData.hold_status,
                                'room_type': groupData.room_type,
                                'rooms_available': groupData.rooms_available,
                                'rooms_held_non_deduct': groupData.rooms_held_non_deduct,
                                'rooms_held_deduct': groupData.rooms_held_deduct,
                                'rooms_held_picked_up': groupData.rooms_held_picked_up,
                                'pickup_percentage': groupData.pickup_percentage
                            });
                            returnAry.push(customData);
                        }
                }
            } else {
                hasData = false;

                angular.extend(makeCopy, {
                    'isReport': true,
                    'rowspan': 0,
                    'className': 'row-break'
                });
                returnAry.push(makeCopy);
            }

            // if we have data and 'group_total' for this group
            if (hasData && makeCopy.hasOwnProperty('group_total')) {
                groupDataTotal = makeCopy['group_total'];
                customData = {};
                angular.extend(customData, {
                    'isSubTotal': true,
                    'className': 'row-break',
                    'rooms_available': groupDataTotal.rooms_available,
                    'rooms_held_non_deduct': groupDataTotal.rooms_held_non_deduct,
                    'rooms_held_deduct': groupDataTotal.rooms_held_deduct,
                    'rooms_held_picked_up': groupDataTotal.rooms_held_picked_up,
                    'pickup_percentage': groupDataTotal.pickup_percentage
                });
                returnAry.push(customData);
                // } else {
                //     customData = {};
                //     angular.extend(customData, {
                //         'isSubTotal' : true,
                //         'isEmpty'    : true,
                //         'className'  : 'row-break'
                //     });
                //     returnAry.push( customData );
            }
        }

        return returnAry;
    }

    function $_parseDepositReport(reportName, apiResponse, options) {
        var returnAry = [],
            customData = [],
            makeCopy,
            depositData,
            depositTotals;

        var i, j, k, l;

        // loop through the api response
        for (i = 0, j = apiResponse.length; i < j; i++) {

            // we'll work with a copy of the ith item
            makeCopy = angular.copy(apiResponse[i]);

            // if we have 'deposit_data' for this reservation
            if (makeCopy.hasOwnProperty('deposit_data') && makeCopy['deposit_data'].length) {

                // loop through the 'deposit_data'
                for (k = 0, l = makeCopy['deposit_data'].length; k < l; k++) {
                    depositData = makeCopy['deposit_data'][k];

                    // include the first depositData details in the
                    // same row as that of the main reservation details
                    if (k === 0) {
                        angular.extend(makeCopy, {
                            'isReport': true,
                            'rowspan': l + 1,
                            'deposit_payment_status': depositData.deposit_payment_status,
                            'due_date': depositData.due_date,
                            'deposit_due_amount': depositData.deposit_due_amount,
                            'paid_date': depositData.paid_date,
                            'paid_amount': depositData.paid_amount
                        });
                        returnAry.push(makeCopy);
                    }

                    // create additional sub rows to represent the
                    // rest of the 'deposit_data'
                    else {
                            customData = {};
                            angular.extend(customData, {
                                'isSubReport': true,
                                'deposit_payment_status': depositData.deposit_payment_status,
                                'due_date': depositData.due_date,
                                'deposit_due_amount': depositData.deposit_due_amount,
                                'paid_date': depositData.paid_date,
                                'paid_amount': depositData.paid_amount
                            });
                            returnAry.push(customData);
                        }
                }

                // if this is the last loop
                if (makeCopy.hasOwnProperty('deposit_totals') && !_.isEmpty(makeCopy['deposit_totals'])) {
                    depositTotals = makeCopy['deposit_totals'];

                    customData = {};
                    angular.extend(customData, {
                        'isSubTotal': true,
                        'className': 'row-break',
                        'deposit_due_amount': depositTotals.deposit_due_amount,
                        'paid_amount': depositTotals.paid_amount
                    });
                    returnAry.push(customData);
                }
            } else {
                angular.extend(makeCopy, {
                    'isReport': true,
                    'className': 'row-break'
                });
                returnAry.push(makeCopy);
            }
        }
        return returnAry;
    }

    /**
     * THIS IS DEPRICATED!!!
     * KEEPING HERE FOR ANY FUTURE NEEDS
     */
    /**
     * We have to convert an array of objects 'apiResponse'
     * into a grouped by 'adjust_by' key-value pairs.
     *
     * Each key will be the 'adjust_by' username and its value
     * will be an array of objects. Each object will represent
     * an reservation (unique key 'confirmation_no')
     *
     * @param {Array} apiResponse [{}, {}, {}, {}, {}]
     * @return {Object} =>        { us1: [{}, {}, {}], us2: [{}, {}], us3: [{}] }
     */
    function $_preParseGroupedRateAdjustments(reportName, apiResponse, options) {

        /**
         * THIS IS DEPRICATED!!!
         * KEEPING HERE FOR ANY FUTURE NEEDS
         */

        var makeCopy, withOutStay, usersInThisRes;

        var kth, userId, userNa, uid, keyId;

        var tempObj = {},
            returnObj = {};

        var i, j, k, l;

        for (i = 0, j = apiResponse.length; i < j; i++) {

            // create a copy of ith apiResponse
            makeCopy = angular.copy(apiResponse[i]);

            // copy the reservation details and an empty 'stay_dates' array
            withOutStay = angular.copy({
                'guest_name': makeCopy.guest_name,
                'confirmation_no': makeCopy.confirmation_no,
                'arrival_date': makeCopy.arrival_date,
                'departure_date': makeCopy.departure_date,
                'stay_dates': []
            });

            // loop and generate an object
            // representing (same) reservation with
            // only that user, so a set of that will be
            // an object of objects
            usersInThisRes = {};
            for (k = 0, l = makeCopy['stay_dates'].length; k < l; k++) {
                kth = makeCopy['stay_dates'][k];
                userId = kth['adjusted_user_id'] || 'Unknown';
                userNa = kth['adjusted_by'] || 'Unknown';

                // create a very unique 'uid', we'll remove 'userId' from it later
                uid = userId + '__' + userNa;

                if (usersInThisRes[uid] === undefined) {
                    usersInThisRes[uid] = angular.copy(withOutStay);
                }

                // for each user just push only its associate 'stay_dates' changes
                usersInThisRes[uid]['stay_dates'].push(kth);
            }

            // inset the just found reservation
            // each with only details of 'stay_dates'
            // changes of just one user, into a 'tempObj'
            for (keyId in usersInThisRes) {
                if (!usersInThisRes.hasOwnProperty(keyId)) {
                    continue;
                }

                if (tempObj[keyId] === undefined) {
                    tempObj[keyId] = [];
                }

                tempObj[keyId].push(usersInThisRes[keyId]);
            }
        }

        // now that all the data has been grouped
        // we need to remove the 'adjusted_user_id'
        // part from 'uid', and have the 'returnObj' in that format
        returnObj = {};
        for (keyId in tempObj) {
            if (!tempObj.hasOwnProperty(keyId)) {
                continue;
            }

            // only take the user name part
            onlyUserNa = keyId.split('__')[1];

            // oh, also we will parse each entry to nG repeat format
            returnObj[onlyUserNa] = $_parseRateAdjustments(reportName, tempObj[keyId], options);
        }

        return returnObj;
    }

    function $_parseDataForRoomOOOOOSReport(reportName, apiResponse, options) {
        var groupedByKey = {},
            returnAry = [];

        var i, j, k;

        if (!!options['chosenSortBy'] && options['chosenSortBy'] === 'ROOM_NO') {
            groupedByKey = _.groupBy(apiResponse, 'room_no');

            _.each(groupedByKey, function (eachAry) {
                for (i = 0, j = eachAry.length, k = j - 1; i < j; i++) {
                    if (0 === i) {
                        returnAry.push($.extend({}, eachAry[i], {
                            rowspan: eachAry.length,
                            isMainRow: true,
                            // if there is only one entry!!
                            className: k === i ? 'row-break' : ''
                        }));
                    } else if (k === i) {
                        returnAry.push($.extend({}, _.omit(eachAry[i], ['room_no', 'room_type']), {
                            className: 'row-break'
                        }));
                    } else {
                        returnAry.push(_.omit(eachAry[i], ['room_no', 'room_type']));
                    }
                }
            });
        } else {
            _.each(apiResponse, function (result) {
                returnAry.push($.extend({}, result, {
                    className: 'row-break',
                    isMainRow: true
                }));
            });
        }

        return returnAry;
    }

    return factory;
}]);