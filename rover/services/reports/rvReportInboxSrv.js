'use strict';

angular.module('sntRover').service('RVReportsInboxSrv', ['$q', 'rvBaseWebSrvV2', 'RVReportApplyIconClass', 'RVReportApplyFlags', 'RVReportSetupDates', 'RVReportParamsConst', 'RVReportInboxFilterLabelConst', 'RVReservationBaseSearchSrv', 'RVreportsSubSrv', '$filter', '$rootScope', 'RVReportNamesConst', 'RVReportUtilsFac', function ($q, rvBaseWebSrvV2, applyIconClass, applyFlags, setupDates, reportParamsConst, reportInboxFilterLabelConst, RVReservationBaseSearchSrv, RVreportsSubSrv, $filter, $rootScope, reportNames, reportUtils) {

    var self = this;

    this.PER_PAGE = 50;

    var RESERVATION_STATUS_DEPOSIT_REPORT = [{ id: -2, status: "DUE IN", selected: true }, { id: -1, status: "DUE OUT", selected: true }, { id: 1, status: "RESERVED", selected: true }, { id: 2, status: "CHECKED IN", selected: true }, { id: 3, status: "CHECKED OUT", selected: true }, { id: 4, status: "NO SHOW", selected: true }, { id: 5, status: "CANCEL", selected: true }];

    var UNDEFINED_ENTRY = {
        is_active: true,
        name: 'UNDEFINED',
        value: -1
    };

    /**
     * Fetches the list of generated reports
     * @param {Object} contain the params used in api
     * @return {Promise} promise
     */
    this.fetchReportInbox = function (params) {
        var deferred = $q.defer(),
            url = '/api/generated_reports';

        if (_.isEmpty(params.generated_date)) {
            params.generated_date = $filter('date')($rootScope.serverDate, 'yyyy-MM-dd');
        }

        rvBaseWebSrvV2.getJSON(url, params).then(function (data) {
            deferred.resolve(data);
        }, function (error) {
            deferred.reject(error);
        });

        return deferred.promise;
    };

    /**
     * Apply additional flags on the report which we got from the reports api
     * @param {Object} report the instance of a report
     * @return {void}
     */
    this.processReports = function (report) {
        for (var i = 0, j = report.length; i < j; i++) {

            // apply icon class based on the report name
            applyIconClass.init(report[i]);
        }
    };

    /**
     * Add the from date and to date that needs to shown in report inbox summary
     * @param {Object} report generated report object
     * @return {void}
     */
    this.fillReportDates = function (generatedReport) {
        var fromDate = 'N/A',
            toDate = 'N/A',
            filters = generatedReport.filters;

        if (filters[reportParamsConst['FROM_DATE']]) {
            fromDate = filters[reportParamsConst['FROM_DATE']];
        } else if (filters[reportParamsConst['CANCEL_FROM_DATE']]) {
            fromDate = filters[reportParamsConst['CANCEL_FROM_DATE']];
        } else if (filters[reportParamsConst['ARRIVAL_FROM_DATE']]) {
            fromDate = filters[reportParamsConst['ARRIVAL_FROM_DATE']];
        } else if (filters[reportParamsConst['GROUP_START_DATE']]) {
            fromDate = filters[reportParamsConst['GROUP_START_DATE']];
        } else if (filters[reportParamsConst['DEPOSIT_FROM_DATE']]) {
            fromDate = filters[reportParamsConst['DEPOSIT_FROM_DATE']];
        } else if (filters[reportParamsConst['PAID_FROM_DATE']]) {
            fromDate = filters[reportParamsConst['PAID_FROM_DATE']];
        } else if (filters[reportParamsConst['CREATE_FROM_DATE']]) {
            fromDate = filters[reportParamsConst['CREATE_FROM_DATE']];
        } else if (filters[reportParamsConst['ADJUSTMENT_FROM_DATE']]) {
            fromDate = filters[reportParamsConst['ADJUSTMENT_FROM_DATE']];
        } else if (filters[reportParamsConst['SINGLE_DATE']]) {
            fromDate = filters[reportParamsConst['SINGLE_DATE']];
        }

        if (filters[reportParamsConst['TO_DATE']]) {
            toDate = filters[reportParamsConst['TO_DATE']];
        } else if (filters[reportParamsConst['CANCEL_TO_DATE']]) {
            toDate = filters[reportParamsConst['CANCEL_TO_DATE']];
        } else if (filters[reportParamsConst['ARRIVAL_TO_DATE']]) {
            toDate = filters[reportParamsConst['ARRIVAL_TO_DATE']];
        } else if (filters[reportParamsConst['GROUP_END_DATE']]) {
            toDate = filters[reportParamsConst['GROUP_END_DATE']];
        } else if (filters[reportParamsConst['DEPOSIT_TO_DATE']]) {
            toDate = filters[reportParamsConst['DEPOSIT_TO_DATE']];
        } else if (filters[reportParamsConst['PAID_TO_DATE']]) {
            toDate = filters[reportParamsConst['PAID_TO_DATE']];
        } else if (filters[reportParamsConst['CREATE_TO_DATE']]) {
            toDate = filters[reportParamsConst['CREATE_TO_DATE']];
        } else if (filters[reportParamsConst['ADJUSTMENT_TO_DATE']]) {
            toDate = filters[reportParamsConst['ADJUSTMENT_TO_DATE']];
        } else if (filters[reportParamsConst['SINGLE_DATE']]) {
            toDate = filters[reportParamsConst['SINGLE_DATE']];
        }

        generatedReport.fromDate = fromDate !== 'N/A' ? $filter('date')(tzIndependentDate(fromDate), $rootScope.dateFormat) : fromDate;
        generatedReport.toDate = toDate !== 'N/A' ? $filter('date')(tzIndependentDate(toDate), $rootScope.dateFormat) : toDate;
    };

    /**
     * Filter values from a base array based on another array of values and the key to compare
     * @param {Array} dataArr Array of objects which should be filtered
     * @param {Array} filterArr array of values
     * @param {String} filterKey the key in the object whose values needs to be compared
     */
    this.filterArrayValues = function (dataArr, filterArr, filterKey) {
        var index = -1;
        var filteredList = _.filter(dataArr, function (data) {
            index = _.findIndex(filterArr, function (val) {
                return val == data[filterKey];
            });
            return index !== -1;
        });

        return filteredList;
    };

    /**
     * Fill rate names form array of ids
     * @param {Array} value array of rate ids
     * @param {String} key the key to be used in the formatted filter
     * @param {Promises} promises array of promises
     * @param {Object} formatedFilter the formatted filter object
     * @return {void} 
     */

    this.processRateIds = function (value, key, promises, formatedFilter) {
        if (!_.isArray(value)) {
            value = [value];
        }

        var params = {
            "ids": value
        };

        promises.push(RVreportsSubSrv.fetchRateDetailsByIds(params).then(function (rates) {
            formatedFilter[reportInboxFilterLabelConst[key]] = _.pluck(rates, 'rate_name').join(', ');
        }));
    };

    /**
     * Fill department names from array of ids
     * @param {Array} value array of department ids
     * @param {String} key the key to be used in the formatted filter
     * @param {Promises} promises array of promises
     * @param {Object} formatedFilter the formatted filter object
     * @return {void} 
     */
    this.fillDepartmentNames = function (value, key, promises, formatedFilter) {

        promises.push(RVreportsSubSrv.fetchDepartments().then(function (departments) {
            formatedFilter[reportInboxFilterLabelConst[key]] = _.pluck(self.filterArrayValues(departments, value, 'value'), 'name').join(', ');
        }));
    };

    /**
     * Fill market names from array of ids
     * @param {Array} value array of market ids
     * @param {String} key the key to be used in the formatted filter
     * @param {Promises} promises array of promises
     * @param {Object} formatedFilter the formatted filter object
     * @return {void} 
     */
    this.processMarkets = function (value, key, promises, formatedFilter) {

        promises.push(RVreportsSubSrv.fetchMarkets().then(function (markets) {
            formatedFilter[reportInboxFilterLabelConst[key]] = _.pluck(markets, 'name').join(', ');
        }));
    };

    /**
     * Fill options item
     * @param {String} value of the option
     * @param {String} key the key to be used in the formatted filter 
     * @param {Object} formatedFilter the formatted filter object        
     * @return {void} 
     */
    this.processOptions = function (value, key, formatedFilter) {

        if (!formatedFilter[reportInboxFilterLabelConst['OPTIONS']]) {
            formatedFilter[reportInboxFilterLabelConst['OPTIONS']] = [];
        }

        if (value) {
            formatedFilter[reportInboxFilterLabelConst['OPTIONS']].push(reportInboxFilterLabelConst[key]);
        }
    };

    /**
     * Fill display items
     * @param {String} value of the option
     * @param {String} key the key to be used in the formatted filter 
     * @param {Object} formatedFilter the formatted filter object        
     * @return {void} 
     */
    this.processDisplayFilter = function (value, key, formatedFilter) {
        if (!formatedFilter[reportInboxFilterLabelConst['DISPLAY']]) {
            formatedFilter[reportInboxFilterLabelConst['DISPLAY']] = [];
        }

        if (value) {
            formatedFilter[reportInboxFilterLabelConst['DISPLAY']].push(reportInboxFilterLabelConst[key]);
        }
    };

    /**
     * Fill account(TA/CC) names
     * @param {String} value of the option
     * @param {String} key the key to be used in the formatted filter 
     * @param {Promises} promises array of promises
     * @param {Object} formatedFilter the formatted filter object        
     * @return {void} 
     */
    this.fillTaCCDetails = function (value, key, promises, formatedFilter) {
        promises.push(RVreportsSubSrv.fetchAccountsById(value).then(function (accountInfo) {
            formatedFilter[reportInboxFilterLabelConst[key]] = accountInfo.account_details.account_name;
        }));
    };

    /**
     * Fill aeging balance details
     * @param {Array} value array of values
     * @param {String} key the key to be used in the formatted filter 
     * @param {Object} formatedFilter the formatted filter object        
     * @return {void} 
     */
    this.processAgingBalance = function (value, key, formatedFilter) {
        var ageBuckets = [];

        _.each(value, function (bucket) {
            ageBuckets.push(reportInboxFilterLabelConst[bucket]);
        });

        formatedFilter[reportInboxFilterLabelConst[key]] = ageBuckets.join(', ');
    };

    /**
     * Generic function to process array of values with no formatting required
     * @param {Array} value array of values
     * @param {String} key the key to be used in the formatted filter 
     * @param {Object} formatedFilter the formatted filter object        
     * @return {void} 
     */
    this.processArrayValuesWithNoFormating = function (value, key, formatedFilter) {
        formatedFilter[reportInboxFilterLabelConst[key]] = value.join(', ');
    };

    /**
    * Fill origin info details
    * @param {Array} value array of values
    * @param {String} key the key to be used in the formatted filter 
    * @param {Promises} promises array of promises
    * @param {Object} formatedFilter the formatted filter object        
    * @return {void} 
    */
    this.fillOriginInfo = function (value, key, promises, formatedFilter) {
        promises.push(RVreportsSubSrv.fetchOrigins().then(function (origins) {
            var filteredOrigins = _.filter(origins, function (origin) {
                return _.contains(value, origin.value);
            });

            formatedFilter[reportInboxFilterLabelConst[key]] = _.pluck(filteredOrigins, 'description').join(', ');
        }));
    };

    /**
     * Fill origin urls info details
     * @param {Array} value array of values
     * @param {String} key the key to be used in the formatted filter 
     * @param {Promises} promises array of promises
     * @param {Object} formatedFilter the formatted filter object        
     * @return {void} 
     */
    this.processOriginUrls = function (value, key, promises, formatedFilter) {
        promises.push(RVreportsSubSrv.fetchURLs().then(function (urls) {
            var filteredUrls = _.filter(urls, function (url) {
                return _.contains(value, url.id);
            });

            formatedFilter[reportInboxFilterLabelConst[key]] = _.pluck(filteredUrls, 'name').join(', ');
        }));
    };

    /**
    * Fill addon group names form array of ids
    * @param {Array} value array of addon group ids
    * @param {String} key the key to be used in the formatted filter
    * @param {Promises} promises array of promises
    * @param {Object} formatedFilter the formatted filter object
    * @return {void} 
    */
    this.fillAddonGroups = function (value, key, promises, formatedFilter) {
        promises.push(RVreportsSubSrv.fetchChargeNAddonGroups().then(function (addonGroups) {
            formatedFilter[reportInboxFilterLabelConst[key]] = _.pluck(self.filterArrayValues(addonGroups, value, 'id'), 'name').join(', ');
        }));
    };

    /**
     * Fill addon names form array of ids
     * @param {Array} value array of addon ids
     * @param {String} key the key to be used in the formatted filter
     * @param {Promises} promises array of promises
     * @param {Object} formatedFilter the formatted filter object
     * @return {void} 
     */
    this.fillAddons = function (value, key, promises, formatedFilter) {
        var params = {
            addon_ids: value
        };

        promises.push(RVreportsSubSrv.fetchAddonsByIds(params).then(function (addonNames) {
            formatedFilter[reportInboxFilterLabelConst[key]] = addonNames.join(', ');
        }));
    };

    /**
     * Fill reservation status names from array of ids
     * @param {Array} value array of reservation status ids
     * @param {String} key the key to be used in the formatted filter
     * @param {Promises} promises array of promises
     * @param {Object} formatedFilter the formatted filter object
     * @param {Object} report selected report
     * @return {void} 
     */
    this.fillReservationStatus = function (value, key, promises, formatedFilter, report) {
        if (report.name === reportNames['DEPOSIT_REPORT'] || report.name === reportNames['GUEST_BALANCE_REPORT']) {
            formatedFilter[reportInboxFilterLabelConst[key]] = _.pluck(self.filterArrayValues(RESERVATION_STATUS_DEPOSIT_REPORT, value, 'id'), 'status').join(', ');
        } else if (report.name === reportNames['ACTIONS_MANAGER']) {
            promises.push(RVreportsSubSrv.getReservationStatus().then(function (statuses) {
                statuses.push({ id: null, value: "DUE_IN", description: "Due In" }, { id: null, value: "DUE_OUT", description: "Due Out" });

                formatedFilter[reportInboxFilterLabelConst[key]] = _.pluck(self.filterArrayValues(statuses, value, 'value'), 'description').join(', ');
            }));
        } else {
            promises.push(RVreportsSubSrv.fetchReservationStatus().then(function (statuses) {
                formatedFilter[reportInboxFilterLabelConst[key]] = _.pluck(self.filterArrayValues(statuses, value, 'id'), 'status').join(', ');
            }));
        }
    };

    /**
     * Fill options with no formatting required
     * @param {String} value of the option
     * @param {String} key the key to be used in the formatted filter
     * @param {Object} formatedFilter the formatted filter object
     * @return {void} 
     */
    this.fillOptionsWithoutFormating = function (value, key, formatedFilter) {
        formatedFilter[reportInboxFilterLabelConst[key]] = value;
    };

    /**
     * Fill company/ta/group details
     * @param {String} value of the option
     * @param {String} key the key to be used in the formatted filter
     * @param {Promises} promises array of promises
     * @param {Object} formatedFilter the formatted filter object
     * @return {void} 
     */
    this.fillCompanyTaGroupDetails = function (value, key, promises, formatedFilter) {
        var entity = value.split("_");

        if (entity.length === 2 && entity[0] === 'account') {
            promises.push(RVreportsSubSrv.fetchAccountsById(entity[1]).then(function (response) {
                formatedFilter[reportInboxFilterLabelConst[key]] = response.account_details.account_name;
            }));
        } else if (entity.length === 2 && entity[0] === 'group') {
            promises.push(RVreportsSubSrv.fetchGroupById(entity[1]).then(function (response) {
                formatedFilter[reportInboxFilterLabelConst[key]] = response.group_name;
            }));
        }
    };

    /**
     * Fill group codes
     * @param {String} value of the option
     * @param {String} key the key to be used in the formatted filter
     * @param {Promises} promises array of promises
     * @param {Object} formatedFilter the formatted filter object
     * @return {void} 
     */
    this.fillGroupCodes = function (value, key, promises, formatedFilter) {
        var groupNameArray = [];

        _.each(value, function (id) {
            promises.push(RVreportsSubSrv.fetchGroupById(parseInt(id)).then(function (response) {
                groupNameArray.push(response.group_name);
                formatedFilter[reportInboxFilterLabelConst[key]] = groupNameArray.join(', ');
            }));
        });
    };

    /**
     * Fill company/ta details
     * @param {String} value of the option
     * @param {String} key the key to be used in the formatted filter
     * @param {Promises} promises array of promises
     * @param {Object} formatedFilter the formatted filter object
     * @return {void} 
     */
    this.fillCompanyTaDetails = function (value, key, promises, formatedFilter) {
        if (!formatedFilter[reportInboxFilterLabelConst['COMPANY/TA']]) {
            formatedFilter[reportInboxFilterLabelConst['COMPANY/TA']] = [];
        }

        _.each(value, function (id, idx) {
            promises.push(RVreportsSubSrv.fetchAccountsById(id).then(function (response) {
                formatedFilter[reportInboxFilterLabelConst['COMPANY/TA']].push(response.account_details.account_name);
            }));
        });
    };

    /**
     * Fill checkin checkout details
     * @param {String} value of the option
     * @param {String} key the key to be used in the formatted filter
     * @param {Object} formatedFilter the formatted filter object
     * @return {void} 
     */
    this.fillCheckedInCheckedOut = function (value, key, formatedFilter) {
        if (!formatedFilter[reportInboxFilterLabelConst['CHECK IN/ CHECK OUT']]) {
            formatedFilter[reportInboxFilterLabelConst['CHECK IN/ CHECK OUT']] = [];
        }
        if (value) {
            formatedFilter[reportInboxFilterLabelConst['CHECK IN/ CHECK OUT']].push(reportInboxFilterLabelConst[key]);
        }
    };

    /**
     * Fill show fields
     * @param {String} value of the option
     * @param {String} key the key to be used in the formatted filter
     * @param {Object} formatedFilter the formatted filter object
     * @return {void} 
     */
    this.fillShowFields = function (value, key, formatedFilter) {
        if (!formatedFilter[reportInboxFilterLabelConst['SHOW']]) {
            formatedFilter[reportInboxFilterLabelConst['SHOW']] = [];
        }

        if (value) {
            formatedFilter[reportInboxFilterLabelConst['SHOW']].push(reportInboxFilterLabelConst[key]);
        }
    };

    /**
     * Fill values with no formatting required
     * @param {String} value of the option
     * @param {String} key the key to be used in the formatted filter
     * @param {Object} formatedFilter the formatted filter object
     * @return {void} 
     */
    this.fillValueWithoutFormating = function (value, key, formatedFilter) {
        formatedFilter[reportInboxFilterLabelConst[key]] = value;
    };

    /**
     * Fill rates types name
     * @param {Array} value array of rate type ids
     * @param {String} key the key to be used in the formatted filter
     * @param {Promises} promises array of promises
     * @param {Object} formatedFilter the formatted filter object
     * @return {void} 
     */
    this.fillRateTypes = function (value, key, promises, formatedFilter) {

        promises.push(RVreportsSubSrv.fetchRateTypes().then(function (rates) {
            formatedFilter[reportInboxFilterLabelConst[key]] = _.pluck(self.filterArrayValues(rates.results, value, "id"), 'name').join(', ');
        }));
    };

    /**
     * Fill charge code names from the array of ids
     * @param {Array} value array of charge code ids
     * @param {String} key the key to be used in the formatted filter
     * @param {Promises} promises array of promises
     * @param {Object} formatedFilter the formatted filter object
     * @return {void} 
     */
    this.fillChargeCodes = function (value, key, promises, formatedFilter) {

        promises.push(RVreportsSubSrv.fetchChargeCodes().then(function (chargeCodes) {
            formatedFilter[reportInboxFilterLabelConst[key]] = _.pluck(self.filterArrayValues(chargeCodes, value, 'id'), 'name').join(', ');
        }));
    };

    /**
     * Fill charge group names from the array of ids
     * @param {Array} value array of charge group ids
     * @param {String} key the key to be used in the formatted filter
     * @param {Promises} promises array of promises
     * @param {Object} formatedFilter the formatted filter object
     * @return {void} 
     */
    this.fillChargeGroups = function (value, key, promises, formatedFilter) {

        promises.push(RVreportsSubSrv.fetchChargeNAddonGroups().then(function (chargeGroups) {
            formatedFilter[reportInboxFilterLabelConst[key]] = _.pluck(self.filterArrayValues(chargeGroups, value, 'id'), 'description').join(', ');
        }));
    };

    /**
     * Fill guest/account selection
     * @param {Array} value either guest or account
     * @param {String} key the key to be used in the formatted filter        
     * @param {Object} formatedFilter the formatted filter object
     * @return {void} 
     */
    this.fillGuestAccount = function (value, key, formatedFilter) {
        if (!formatedFilter[reportInboxFilterLabelConst['GUEST/ACCOUNT']]) {
            formatedFilter[reportInboxFilterLabelConst['GUEST/ACCOUNT']] = [];
        }

        if (value) {
            formatedFilter[reportInboxFilterLabelConst['GUEST/ACCOUNT']].push(reportInboxFilterLabelConst[key]);
        }
    };

    /**
     * Fill user names from the array of ids
     * @param {Array} value array of user ids
     * @param {String} key the key to be used in the formatted filter
     * @param {Promises} promises array of promises
     * @param {Object} formatedFilter the formatted filter object
     * @return {void} 
     */
    this.fillUserInfo = function (value, key, promises, formatedFilter) {

        promises.push(RVreportsSubSrv.fetchActiveUsers().then(function (users) {
            var selectedUsers = self.filterArrayValues(users, value, 'id');

            selectedUsers = _.map(selectedUsers, function (user) {
                return user.full_name || user.email;
            });
            formatedFilter[reportInboxFilterLabelConst[key]] = selectedUsers.join(', ');
        }));
    };

    /**
     * Fill origin names from the array of ids
     * @param {Array} value array of origin ids
     * @param {String} key the key to be used in the formatted filter
     * @param {Promises} promises array of promises
     * @param {Object} formatedFilter the formatted filter object
     * @return {void} 
     */
    this.fillBookingOrigins = function (value, key, promises, formatedFilter) {

        promises.push(RVreportsSubSrv.fetchBookingOrigins().then(function (origins) {
            var undefinedEntry = _.find(origins, { name: 'UNDEFINED' });

            if (!undefinedEntry) {
                origins.push(UNDEFINED_ENTRY);
            }

            formatedFilter[reportInboxFilterLabelConst[key]] = _.pluck(self.filterArrayValues(origins, value, 'value'), 'name').join(', ');
        }));
    };

    /**
     * Fill market names from the array of ids
     * @param {Array} value array of market ids
     * @param {String} key the key to be used in the formatted filter
     * @param {Promises} promises array of promises
     * @param {Object} formatedFilter the formatted filter object
     * @return {void} 
     */
    this.fillMarkets = function (value, key, promises, formatedFilter) {

        promises.push(RVreportsSubSrv.fetchMarkets().then(function (markets) {
            var undefinedEntry = _.find(markets, { name: 'UNDEFINED' });

            if (!undefinedEntry) {
                markets.push(UNDEFINED_ENTRY);
            }

            formatedFilter[reportInboxFilterLabelConst[key]] = _.pluck(self.filterArrayValues(markets, value, 'value'), 'name').join(', ');
        }));
    };

    /**
     * Fill source names from the array of ids
     * @param {Array} value array of source ids
     * @param {String} key the key to be used in the formatted filter
     * @param {Promises} promises array of promises
     * @param {Object} formatedFilter the formatted filter object
     * @return {void} 
     */
    this.fillSources = function (value, key, promises, formatedFilter) {

        promises.push(RVreportsSubSrv.fetchSources().then(function (sources) {
            var undefinedEntry = _.find(sources, { name: 'UNDEFINED' });

            if (!undefinedEntry) {
                sources.push(UNDEFINED_ENTRY);
            }

            formatedFilter[reportInboxFilterLabelConst[key]] = _.pluck(self.filterArrayValues(sources, value, 'value'), 'name').join(', ');
        }));
    };

    /**
     * Fill segment names from the array of ids
     * @param {Array} value array of segment ids
     * @param {String} key the key to be used in the formatted filter
     * @param {Promises} promises array of promises
     * @param {Object} formatedFilter the formatted filter object
     * @return {void} 
     */
    this.fillSegments = function (value, key, promises, formatedFilter) {

        promises.push(RVreportsSubSrv.fetchSegments().then(function (segments) {
            var undefinedEntry = _.find(segments, { name: 'UNDEFINED' });

            if (!undefinedEntry) {
                segments.push(UNDEFINED_ENTRY);
            }

            formatedFilter[reportInboxFilterLabelConst[key]] = _.pluck(self.filterArrayValues(segments, value, 'value'), 'name').join(', ');
        }));
    };

    /**
     * Fill hold status names from the array of ids
     * @param {Array} value array of hold status ids
     * @param {String} key the key to be used in the formatted filter
     * @param {Promises} promises array of promises
     * @param {Object} formatedFilter the formatted filter object
     * @return {void} 
     */
    this.fillHoldStatuses = function (value, key, promises, formatedFilter) {

        promises.push(RVreportsSubSrv.fetchHoldStatus().then(function (statuses) {
            formatedFilter[reportInboxFilterLabelConst[key]] = _.pluck(self.filterArrayValues(statuses, value, 'id'), 'name').join(', ');
        }));
    };

    /**
     * Fill the group name from id
     * @param {String} value id of the group
     * @param {String} key the key to be used in the formatted filter
     * @param {Promises} promises array of promises
     * @param {Object} formatedFilter the formatted filter object
     * @return {void} 
     */
    this.fillGroupInfo = function (value, key, promises, formatedFilter) {

        promises.push(RVreportsSubSrv.fetchGroupById(value).then(function (groupInfo) {
            formatedFilter[reportInboxFilterLabelConst[key]] = groupInfo.group_name;
        }));
    };

    /**
     * Fill room type names from the array of ids
     * @param {Array} value array of room type ids
     * @param {String} key the key to be used in the formatted filter
     * @param {Promises} promises array of promises
     * @param {Object} formatedFilter the formatted filter object
     * @return {void} 
     */
    this.fillRoomTypes = function (value, key, promises, formatedFilter) {
        var params = {
            "ids[]": value
        };

        promises.push(self.fetchRoomtypesByIds(params).then(function (roomTypes) {
            formatedFilter[reportInboxFilterLabelConst[key]] = _.pluck(roomTypes, 'name').join(', ');
        }));
    };

    /**
    * Fill floor names from the array of ids
    * @param {Array} value array of floor ids
    * @param {String} key the key to be used in the formatted filter
    * @param {Promises} promises array of promises
    * @param {Object} formatedFilter the formatted filter object
    * @return {void} 
    */
    this.fillFloors = function (value, key, promises, formatedFilter) {

        promises.push(RVreportsSubSrv.fetchFloors().then(function (floors) {
            formatedFilter[reportInboxFilterLabelConst[key]] = _.pluck(self.filterArrayValues(floors, value, 'id'), 'floor_number').join(', ');
        }));
    };

    /**
     * Fill travel agent names from an array of ids
     * @param {Array} value array of ta ids
     * @param {String} key the key to be used in the formatted filter
     * @param {Promises} promises array of promises
     * @param {Object} formatedFilter the formatted filter object
     * @return {void} 
     */
    this.fillTravelAgentInfo = function (value, key, promises, formatedFilter) {
        var params = {
            "ids[]": value
        };

        promises.push(RVreportsSubSrv.fetchTravelAgentsByIds(params).then(function (travelAgents) {
            formatedFilter[reportInboxFilterLabelConst[key]] = _.pluck(travelAgents, 'account_name').join(', ');
        }));
    };

    /**
     * Fill vat info
     * @param {String} value 
     * @param {String} key the key to be used in the formatted filter
     * @param {Object} formatedFilter the formatted filter object
     * @return {void} 
     */
    this.fillVatInfo = function (value, key, formatedFilter) {
        if (!formatedFilter[reportInboxFilterLabelConst['COMPANY/TRAVEL_AGENT']]) {
            formatedFilter[reportInboxFilterLabelConst['COMPANY/TRAVEL_AGENT']] = [];
        }

        if (value) {
            formatedFilter[reportInboxFilterLabelConst['COMPANY/TRAVEL_AGENT']].push(reportInboxFilterLabelConst[key]);
        }
    };

    /**
     * Fill campaign type names from an array of ids
     * @param {Array} value array of campaign ids
     * @param {String} key the key to be used in the formatted filter
     * @param {Promises} promises array of promises
     * @param {Object} formatedFilter the formatted filter object
     * @return {void} 
     */
    this.fillCampaignTypesInfo = function (value, key, promises, formatedFilter) {

        promises.push(RVreportsSubSrv.fetchCampaignTypes().then(function (campaignTypes) {
            formatedFilter[reportInboxFilterLabelConst[key]] = _.pluck(self.filterArrayValues(campaignTypes, value, 'value'), 'name').join(', ');
        }));
    };

    /**
     * Fill sort direction
     * @param {String} value sort direction
     * @param {String} key the key to be used in the formatted filter
     * @param {Object} formatedFilter the formatted filter object
     * @return {void} 
     */
    this.fillSortDir = function (value, key, formatedFilter) {
        var sortDir = "ASC";

        if (!value) {
            sortDir = "DESC";
        }

        formatedFilter[reportInboxFilterLabelConst[key]] = sortDir;
    };

    /**
     * Fill sort field
     * @params {String} value sort field
     * @params {String} key the key to be used in the formatted filter
     * @params {Object} formatedFilter the formatted filter object
     * @params {Object} report selected report
     * @return {void} 
     */
    this.fillSortField = function (value, key, formatedFilter, report) {
        var sortFieldDesc = '';

        if (report.filters.rawData && _.isArray(report.filters.rawData.sortOptions)) {
            var sortField = _.find(report.filters.rawData.sortOptions, { value: value });

            sortFieldDesc = sortField.description;
        } else {
            sortFieldDesc = value.replace(/_/g, " ");
        }

        formatedFilter[reportInboxFilterLabelConst[key]] = sortFieldDesc;
    };

    /**
     * Get from/to date range label based on report
     * @params {String} key filter name in api
     * @params {String} reportName name of the report
     * @return {String} label name of the filter based on report
     */
    this.getDateRangeLabelName = function (key, reportName) {
        var label = reportInboxFilterLabelConst[key];

        if (key === reportParamsConst['FROM_DATE']) {
            switch (reportName) {
                case reportNames['BOOKING_SOURCE_MARKET_REPORT']:
                    label = reportInboxFilterLabelConst['BOOKED_DATE_FROM'];
                    break;
                case reportNames['CANCELLATION_NO_SHOW']:
                    label = reportInboxFilterLabelConst['arrival_from_date'];
                    break;

            }
        } else if (key === reportParamsConst['TO_DATE']) {
            switch (reportName) {
                case reportNames['BOOKING_SOURCE_MARKET_REPORT']:
                    label = reportInboxFilterLabelConst['BOOKED_DATE_TO'];
                    break;
                case reportNames['CANCELLATION_NO_SHOW']:
                    label = reportInboxFilterLabelConst['arrival_to_date'];
                    break;

            }
        } else if (key === reportParamsConst['DEPOSIT_FROM_DATE']) {
            switch (reportName) {
                case reportNames['DEPOSIT_REPORT']:
                    label = reportInboxFilterLabelConst['DEPOSIT_DUE_FROM_DATE'];
                    break;
            }
        } else if (key === reportParamsConst['DEPOSIT_TO_DATE']) {
            switch (reportName) {
                case reportNames['DEPOSIT_REPORT']:
                    label = reportInboxFilterLabelConst['DEPOSIT_DUE_TO_DATE'];
                    break;
            }
        }
        return label;
    };

    /**
     * Fill Due Out status name based on report
     * @params {String} value value of the filter
     * @params {String} key the key to be used in the formatted filter
     * @params {Object} formatedFilter the formatted filter object
     * @params {Object} report selected report
     * @return {void} 
     */
    self.processDueOut = function (value, key, formatedFilter, report) {
        if (value) {
            var displayLabel = reportInboxFilterLabelConst[key];

            if (report.name === reportNames['CREDIT_CHECK_REPORT']) {
                if (!formatedFilter[reportInboxFilterLabelConst['SHOW']]) {
                    formatedFilter[reportInboxFilterLabelConst['SHOW']] = [displayLabel];
                } else {
                    formatedFilter[reportInboxFilterLabelConst['SHOW']].push(displayLabel);
                }
            } else {
                if (!formatedFilter[reportInboxFilterLabelConst['OPTIONS']]) {
                    formatedFilter[reportInboxFilterLabelConst['OPTIONS']] = [displayLabel];
                } else {
                    formatedFilter[reportInboxFilterLabelConst['OPTIONS']].push(displayLabel);
                }
            }
        }
    };

    /**
     * Fill restriction names from an array of ids
     * @param {Array} value array of restriction ids
     * @param {String} key the key to be used in the formatted filter
     * @param {Promises} promises array of promises
     * @param {Object} formatedFilter the formatted filter object
     * @return {void} 
     */
    this.fillRestrictions = function (value, key, promises, formatedFilter) {

        promises.push(RVreportsSubSrv.fetchRestrictionList().then(function (restrictions) {
            formatedFilter[reportInboxFilterLabelConst[key]] = _.pluck(self.filterArrayValues(restrictions, value, 'id'), 'description').join(',');
        }));
    };

    /**
     * Fill Group by field
     * @param {Array} value 
     * @param {String} key the key to be used in the formatted filter
     * @param {Object} formatedFilter the formatted filter object
     * @return {void} 
     */
    this.fillGroupByInfo = function (value, key, formatedFilter) {
        if (value) {
            formatedFilter[reportInboxFilterLabelConst['GROUP_BY']] = reportInboxFilterLabelConst[key];
        }
    };

    /**
     * Fill Account names
     * @param {Array} value 
     * @param {String} key the key to be used in the formatted filter
     * @param {Promises} promises array of promises
     * @param {Object} formatedFilter the formatted filter object
     * @return {void} 
     */
    this.fillAccountInfo = function (value, key, promises, formatedFilter) {
        if (!formatedFilter[reportInboxFilterLabelConst[key]]) {
            formatedFilter[reportInboxFilterLabelConst[key]] = [];
        }
        promises.push(RVreportsSubSrv.fetchAccounts().then(function (accounts) {
            formatedFilter[reportInboxFilterLabelConst[key]] = _.pluck(self.filterArrayValues(accounts, value, 'id'), 'account_name').join(',');
        }));
    };

    /**
     * Fill selected countries
     * @param {Array} value 
     * @param {String} key the key to be used in the formatted filter
     * @param {Promises} promises array of promises
     * @param {Object} formatedFilter the formatted filter object
     * @return {void} 
     */
    this.fillSelectedCountries = function (value, key, promises, formatedFilter) {
        if (!formatedFilter[reportInboxFilterLabelConst[key]]) {
            formatedFilter[reportInboxFilterLabelConst[key]] = [];
        }
        promises.push(RVreportsSubSrv.fetchCountries().then(function (countries) {
            // Here -1 is for UNDEFINED entry
            if (value.length === countries.length + 1) {
                formatedFilter[reportInboxFilterLabelConst[key]] = 'All Countries';
            } else {
                formatedFilter[reportInboxFilterLabelConst[key]] = _.pluck(self.filterArrayValues(countries, value, 'id'), 'value').join(',');
            }
        }));
    };

    /**
     * Fill show upsells only
     * @param {Boolean} value 
     * @param {String} key the key to be used in the formatted filter
     * @param {Object} formatedFilter the formatted filter object
     * @return {void} 
     */
    this.fillShowUpsellsOnly = function (value, key, formatedFilter) {
        if (value) {
            formatedFilter[reportInboxFilterLabelConst[key]] = 'Yes';
        }
    };

    /**
     * Process filters for the given generated report
     * @param {Object} report generated report
     * @return {void}
     */
    this.processFilters = function (report) {
        var processedFilter = {},
            promises = [],
            deferred = $q.defer();

        _.each(report.filters, function (value, key) {
            switch (key) {
                case reportParamsConst['FROM_DATE']:
                case reportParamsConst['TO_DATE']:
                case reportParamsConst['DEPOSIT_FROM_DATE']:
                case reportParamsConst['DEPOSIT_TO_DATE']:
                    processedFilter[self.getDateRangeLabelName(key, report.name)] = value ? $filter('date')(tzIndependentDate(value), $rootScope.dateFormat) : value;
                    break;
                case reportParamsConst['CANCEL_FROM_DATE']:
                case reportParamsConst['CANCEL_TO_DATE']:
                case reportParamsConst['ARRIVAL_FROM_DATE']:
                case reportParamsConst['ARRIVAL_TO_DATE']:
                case reportParamsConst['GROUP_START_DATE']:
                case reportParamsConst['GROUP_END_DATE']:
                case reportParamsConst['PAID_FROM_DATE']:
                case reportParamsConst['PAID_TO_DATE']:
                case reportParamsConst['CREATE_FROM_DATE']:
                case reportParamsConst['CREATE_TO_DATE']:
                case reportParamsConst['ADJUSTMENT_FROM_DATE']:
                case reportParamsConst['ADJUSTMENT_TO_DATE']:
                case reportParamsConst['SINGLE_DATE']:
                    processedFilter[reportInboxFilterLabelConst[key]] = value ? $filter('date')(tzIndependentDate(value), $rootScope.dateFormat) : value;
                    break;
                case reportParamsConst['FROM_TIME']:
                case reportParamsConst['TO_TIME']:
                case reportParamsConst['INCLUDE_DAYUSE']:
                    processedFilter[reportInboxFilterLabelConst[key]] = value;
                    break;
                case reportParamsConst['RATE_IDS']:
                case reportParamsConst['RATE_ID']:
                    self.processRateIds(value, key, promises, processedFilter);
                    break;
                case reportParamsConst['ASSIGNED_DEPARTMENTS']:
                    self.fillDepartmentNames(value, key, promises, processedFilter);
                    break;
                case reportParamsConst['CHOOSE_MARKET']:
                    self.processMarkets(value, key, promises, processedFilter);
                    break;
                case reportParamsConst['DEPOSIT_DUE']:
                case reportParamsConst['DEPOSIT_PAID']:
                case reportParamsConst['DEPOSIT_PAST']:
                case reportParamsConst['INCLUDE_CANCELLED']:
                case reportParamsConst['INCLUDE_CANCELED']:
                case reportParamsConst['INCLUDE_NO_SHOW']:
                case reportParamsConst['INCLUDE_TAX']:
                case reportParamsConst['DUE_IN_ARRIVALS']:
                case reportParamsConst['INCLUDE_ACTIONS']:
                case reportParamsConst['INCLUDE_LEDGER_DATA']:
                case reportParamsConst['INCLUDE_GUEST_NOTES']:
                case reportParamsConst['INCLUDE_RESERVATION_NOTES']:
                case reportParamsConst['SHOW_GUESTS']:
                case reportParamsConst['VIP_ONLY']:
                case reportParamsConst['EXCLUDE_NON_GTD']:
                case reportParamsConst['RESTRICTED_POST_ONLY']:
                case reportParamsConst['ROVER']:
                case reportParamsConst['ZEST']:
                case reportParamsConst['ZEST_WEB']:
                case reportParamsConst['INCLUDE_LAST_YEAR']:
                case reportParamsConst['INCLUDE_VARIANCE']:
                case reportParamsConst['INCLUDE_BOTH']:
                case reportParamsConst['INCLUDE_NEW']:
                case reportParamsConst['SHOW_RATE_ADJUSTMENTS_ONLY']:
                case reportParamsConst['NO_NATIONALITY']:
                case reportParamsConst['DUE_OUT_DEPARTURES']:
                case reportParamsConst['HAS_VEHICLE_REG_NO']:
                case reportParamsConst['SHOW_PHONE_NUMBER']:
                    self.processOptions(value, key, processedFilter);
                    break;
                case reportParamsConst['SHOW_DELETED_CHARGES']:
                case reportParamsConst['SHOW_ADJUSTMENTS']:
                case reportParamsConst['INCLUDE_MARKET']:
                case reportParamsConst['INCLUDE_ORIGIN']:
                case reportParamsConst['INCLUDE_SEGMENT']:
                case reportParamsConst['INCLUDE_SOURCE']:
                    //   case reportParamsConst['SHOW_ROOM_REVENUE']:
                    self.processDisplayFilter(value, key, processedFilter);
                    break;
                case reportParamsConst['ACCOUNT_SEARCH']:
                    self.fillAccountInfo(value, key, promises, processedFilter);
                    break;
                case reportParamsConst['AGING_BALANCE']:
                    self.processAgingBalance(value, key, processedFilter);
                    break;
                case reportParamsConst['COMPLETION_STATUS']:
                case reportParamsConst['SHOW_ACTIONABLES']:
                case reportParamsConst['INCLUDE_GUARANTEE_TYPE']:
                    self.processArrayValuesWithNoFormating(value, key, processedFilter);
                    break;
                case reportParamsConst['ORIGIN_VALUES']:
                    self.fillOriginInfo(value, key, promises, processedFilter);
                    break;
                case reportParamsConst['ORIGIN_URLS']:
                    self.processOriginUrls(value, key, promises, processedFilter);
                    break;
                case reportParamsConst['ADDONS_GROUPS_IDS']:
                    self.fillAddonGroups(value, key, promises, processedFilter);
                    break;
                case reportParamsConst['ADDONS_IDS']:
                    self.fillAddons(value, key, promises, processedFilter);
                    break;
                case reportParamsConst['RESERVATION_STATUS']:
                    self.fillReservationStatus(value, key, promises, processedFilter, report);
                    break;
                case 'reservation_status':
                    self.fillReservationStatus(value, key, promises, processedFilter, report);
                    break;
                case reportParamsConst['ADDON_GROUP_BY']:
                    self.fillOptionsWithoutFormating(value, key, processedFilter);
                    break;
                case reportParamsConst['INCLUDE_COMPANYCARD_TA_GROUP']:
                case reportParamsConst['GROUP_COMPANY_TA_CARD']:
                    self.fillCompanyTaGroupDetails(value, key, promises, processedFilter);
                    break;
                case reportParamsConst['INCLUDE_COMPANYCARD_TA']:
                case reportParamsConst['TA_CC_CARD']:
                    self.fillCompanyTaDetails(value, key, promises, processedFilter, report);
                    break;
                case reportParamsConst['GROUP_CODE']:
                    self.fillGroupCodes(value, key, promises, processedFilter, report);
                    break;
                case reportParamsConst['CHECKED_IN']:
                case reportParamsConst['CHECKED_OUT']:
                    self.fillCheckedInCheckedOut(value, key, processedFilter);
                    break;
                case reportParamsConst['SHOW_TRAVEL_AGENT']:
                case reportParamsConst['SHOW_COMPANY']:
                case reportParamsConst['INCLUDE_INHOUSE']:
                case reportParamsConst['OOO']:
                case reportParamsConst['OOS']:
                case reportParamsConst['EXCEEDED_ONLY']:
                    self.fillShowFields(value, key, processedFilter);
                    break;
                case reportParamsConst['MIN_REVENUE']:
                case reportParamsConst['MIN_NIGHTS']:
                case reportParamsConst['MIN_NO_OF_DAYS_NOT_OCCUPIED']:
                case reportParamsConst['VAT_YEAR']:
                    self.fillValueWithoutFormating(value, key, processedFilter);
                    break;
                case reportParamsConst['RATE_TYPE_IDS']:
                    self.fillRateTypes(value, key, promises, processedFilter);
                    break;
                case reportParamsConst['CHARGE_CODE_IDS']:
                    self.fillChargeCodes(value, key, promises, processedFilter);
                    break;
                case reportParamsConst['CHARGE_GROUP_IDS']:
                    self.fillChargeGroups(value, key, promises, processedFilter);
                    break;
                case reportParamsConst['ACCOUNT']:
                case reportParamsConst['GUEST']:
                    self.fillGuestAccount(value, key, processedFilter);
                    break;
                case reportParamsConst['USER_IDS']:
                    self.fillUserInfo(value, key, promises, processedFilter);
                    break;
                case reportParamsConst['BOOKING_ORIGIN_IDS']:
                    self.fillBookingOrigins(value, key, promises, processedFilter);
                    break;
                case reportParamsConst['MARKET_IDS']:
                    self.fillMarkets(value, key, promises, processedFilter);
                    break;
                case reportParamsConst['SOURCE_IDS']:
                    self.fillSources(value, key, promises, processedFilter);
                    break;
                case reportParamsConst['HOLD_STATUS_IDS']:
                    self.fillHoldStatuses(value, key, promises, processedFilter);
                    break;
                case reportParamsConst['INCLUDE_GROUP']:
                    self.fillGroupInfo(value, key, promises, processedFilter);
                    break;
                case reportParamsConst['ROOM_TYPE_IDS']:
                    self.fillRoomTypes(value, key, promises, processedFilter);
                    break;
                case reportParamsConst['FLOOR']:
                    self.fillFloors(value, key, promises, processedFilter);
                    break;
                case reportParamsConst['TRAVEL_AGENTS']:
                    self.fillTravelAgentInfo(value, key, promises, processedFilter);
                    break;
                case reportParamsConst['WITH_VAT_NUMBER']:
                case reportParamsConst['WITHOUT_VAT_NUMBER']:
                    self.fillVatInfo(value, key, processedFilter);
                    break;
                case reportParamsConst['CAMPAIGN_TYPES']:
                    self.fillCampaignTypesInfo(value, key, promises, processedFilter);
                    break;
                case reportParamsConst['SORT_DIR']:
                    self.fillSortDir(value, key, processedFilter);
                    break;
                case reportParamsConst['SORT_FIELD']:
                    self.fillSortField(value, key, processedFilter, report);
                    break;
                case reportParamsConst['INCLUDE_DUE_OUT']:
                    self.processDueOut(value, key, processedFilter, report);
                    break;
                case reportParamsConst['SEGMENT_IDS']:
                    self.fillSegments(value, key, promises, processedFilter);
                    break;
                case reportParamsConst['RESTRICTION_IDS']:
                    self.fillRestrictions(value, key, promises, processedFilter);
                    break;
                case reportParamsConst['GROUP_BY_DATE']:
                case reportParamsConst['GROUP_BY_USER']:
                case reportParamsConst['GROUP_BY_GROUP_NAME']:
                    self.fillGroupByInfo(value, key, processedFilter);
                    break;
                case reportParamsConst['COUNTRY']:
                    self.fillSelectedCountries(value, key, promises, processedFilter);
                    break;
                case reportParamsConst['SHOW_UPSELL_ONLY']:
                    self.fillShowUpsellsOnly(value, key, processedFilter);
                    break;
            }
        });

        if (processedFilter[reportInboxFilterLabelConst['OPTIONS']] && processedFilter[reportInboxFilterLabelConst['OPTIONS']].length > 0) {
            processedFilter[reportInboxFilterLabelConst['OPTIONS']] = processedFilter[reportInboxFilterLabelConst['OPTIONS']].join(',');
        } else {
            delete processedFilter[reportInboxFilterLabelConst['OPTIONS']];
        }

        if (processedFilter[reportInboxFilterLabelConst['SHOW']]) {
            processedFilter[reportInboxFilterLabelConst['SHOW']] = processedFilter[reportInboxFilterLabelConst['SHOW']].join(',');
        }

        if (processedFilter[reportInboxFilterLabelConst['COMPANY/TRAVEL_AGENT']]) {
            processedFilter[reportInboxFilterLabelConst['COMPANY/TRAVEL_AGENT']] = processedFilter[reportInboxFilterLabelConst['COMPANY/TRAVEL_AGENT']].join(',');
        }

        if (processedFilter[reportInboxFilterLabelConst['GUEST/ACCOUNT']]) {
            processedFilter[reportInboxFilterLabelConst['GUEST/ACCOUNT']] = processedFilter[reportInboxFilterLabelConst['GUEST/ACCOUNT']].join(',');
        }

        if (processedFilter[reportInboxFilterLabelConst['CHECK IN/ CHECK OUT']]) {
            if (processedFilter[reportInboxFilterLabelConst['CHECK IN/ CHECK OUT']].length === 2) {
                processedFilter[reportInboxFilterLabelConst['CHECK IN/ CHECK OUT']] = reportInboxFilterLabelConst['SHOW_CHECKINS_AND_CHECKOUTS'];
            } else {
                processedFilter[reportInboxFilterLabelConst['CHECK IN/ CHECK OUT']] = processedFilter[reportInboxFilterLabelConst['CHECK IN/ CHECK OUT']].join(',');
            }
        }

        if (processedFilter[reportInboxFilterLabelConst['DISPLAY']]) {
            processedFilter[reportInboxFilterLabelConst['DISPLAY']] = processedFilter[reportInboxFilterLabelConst['DISPLAY']].join(',');
        }

        $q.all(promises).then(function () {
            self.formatResponseOnPromiseResolve(processedFilter);
            deferred.resolve(processedFilter);
        }, function () {
            deferred.reject(processedFilter);
        });

        return deferred.promise;
    };

    // Formats filters after resolving the promise
    self.formatResponseOnPromiseResolve = function (formatedFilter) {
        if (formatedFilter[reportInboxFilterLabelConst['COMPANY/TA']]) {
            formatedFilter[reportInboxFilterLabelConst['COMPANY/TA']] = formatedFilter[reportInboxFilterLabelConst['COMPANY/TA']].join(", ");
        }
    };

    /**
     * Add the missing report details in the generated reports data
     * @param {Array} generatedReports holding  the list of generated reports
     * @param {Array} reportList report list master data
     * @return {Array} generatedReports processed array of generated reports
     */
    this.formatReportList = function (generatedReports, reportList) {
        var selectedReport = void 0;

        _.each(generatedReports, function (report, key) {
            selectedReport = _.find(reportList, { id: report.report_id });
            if (selectedReport) {
                report.name = selectedReport.title;
                report.reportIconCls = selectedReport.reportIconCls;
                report.shouldShowExport = selectedReport.display_export_button;
                report.shouldDisplayView = selectedReport.display_show_button;
                report.isExpanded = false;
                reportUtils.parseDatesInObject(report.filters.rawData);
                report.rawData = report.filters.rawData;
                report.appliedFilter = report.filters.appliedFilter;
                self.fillReportDates(report);
            } else {
                delete generatedReports[key];
            }
        });

        return generatedReports;
    };

    /**
     * Fetches the list of of room types by their ids
     * @param {Object} contain the params used in api
     * @return {Promise} promise
     */
    this.fetchRoomtypesByIds = function (params) {
        var deferred = $q.defer(),
            url = '/api/room_types';

        rvBaseWebSrvV2.getJSON(url, params).then(function (data) {
            deferred.resolve(data.results);
        }, function (error) {
            deferred.reject(error);
        });

        return deferred.promise;
    };
}]);