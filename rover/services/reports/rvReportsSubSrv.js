'use strict';

angular.module('sntRover').service('RVreportsSubSrv', ['$q', 'rvBaseWebSrvV2', 'rvReportsCache', 'RVReportMsgsConst', 'RVReportNamesConst', '$rootScope', function ($q, rvBaseWebSrvV2, reportsCache, RVReportMsgsConst, reportNames, $rootScope) {
    var service = {};

    var store = {};

    service.availInStore = function (key) {
        return !!store.hasOwnProperty(key);
    };

    service.getfromStore = function (key) {
        return store.hasOwnProperty(key) ? store[key] : false;
    };

    service.setIntoStore = function (key, value) {
        store[key] = value;
    };
    // Holds data for Generated Inbox report for pagination
    service.cachedInboxReport = {};
    // holds weekend days
    service.weekendDays = [];

    var reportHasDateFilters = function reportHasDateFilters(reportName) {
        return reportName === reportNames["DAILY_PRODUCTION_DEMO"] || reportName === reportNames["DAILY_PRODUCTION_RATE"] || reportName === reportNames["DAILY_PRODUCTION_ROOM_TYPE"];
    };

    /**
     * Handle pagination for generated Inbox report
     * in the below service methods
     * @param  {Object} params {page: per_page}
     * @return {Object} processed response with paginated result
     */
    service.processResults = function (params) {
        var results = angular.copy(service.cachedInboxReport).results,
            start = (params.page - 1) * params.per_page,
            end = start + params.per_page,
            hasDateFilters = false,
            paginatedResult,
            fromDate,
            toDate;

        if (reportHasDateFilters(params.reportTitle)) {
            hasDateFilters = true;
        }
        if (params.fiterFromDate && params.filterToDate && hasDateFilters) {
            fromDate = new Date(params.fiterFromDate);
            toDate = new Date(params.filterToDate);
            var itemDate;

            results = Object.keys(results).reduce(function (obj, k) {
                itemDate = new Date(k);

                if (itemDate >= fromDate && itemDate <= toDate) {
                    obj[k] = results[k];
                }
                return obj;
            }, {});
        }
        if (params.reportTitle === reportNames['TRAVEL_AGENT_COMMISSIONS']) {
            if (results.length) {
                var reservations = results[0].reservation_details.reservations;

                results[0].reservation_details.reservations = reservations.length ? reservations.slice(start, end) : [];
            }

            paginatedResult = results;
        } else {
            paginatedResult = _.isArray(results) ? results.slice(start, end) : results;
        }

        return paginatedResult;
    };
    /**
     * Process Total Result Row vallue- Returns null
     * until the page is NOT last one
     * @param  {Object} params {page: per_page}
     * @return {Object} processed total result row or Null
     */
    service.processTotalResultRow = function (params) {
        var response = angular.copy(service.cachedInboxReport),
            resultsTotalRow = response.results_total_row,
            totalCount = response.total_count,
            hasDateFilters = false,
            lastPage = Math.ceil(totalCount / params.per_page);

        if (reportHasDateFilters(params.reportTitle)) {
            hasDateFilters = true;
        }
        if (params.fiterFromDate && params.filterToDate && hasDateFilters) {
            var itemDate,
                fromDate = new Date(params.fiterFromDate),
                toDate = new Date(params.filterToDate);

            resultsTotalRow = _.filter(resultsTotalRow, function (obj) {
                itemDate = new Date(Object.keys(obj)[0]);
                return itemDate >= fromDate && itemDate <= toDate;
            });
        }

        return totalCount < params.per_page || params.page === lastPage ? resultsTotalRow : null;
    };

    /**
     * Abstract the response based on params
     * @param  {Object} params {page: per_page}
     * @return {Object} processed response
     */
    service.getcachedInboxReportByParams = function (params) {
        var response = angular.copy(service.cachedInboxReport);

        if (params.reportTitle === reportNames['TRAVEL_AGENT_COMMISSIONS']) {
            var totalCount = response.results.length ? response.results[0].reservation_details.total_reservations : 0;

            response.results_total_row = totalCount;
            response.total_count = totalCount;
        }
        response.results = service.processResults(params);
        response.results_total_row = service.processTotalResultRow(params);
        response.isPaginatedResponse = true;
        return response;
    };

    /**
    * centralised method for making api request and managing promises
    * the only reason I end up created this is to avoid code repetition
    * in the below service methods
    * @param  {Object} options {method on 'rvBaseWebSrvV2', request params, request url, response key}
    * @return {Object}         a promise object, which when resolved/rejected will return the data
    * @private
    */
    var callApi = function callApi(options) {
        var deferred = $q.defer();
        var timeStampInSeconds = 0;
        var incrementTimer = function incrementTimer() {
            timeStampInSeconds++;
        };
        var refreshIntervalId = setInterval(incrementTimer, 1000);

        var pollToReport = function pollToReport(async_callback_url) {
            // we will continously communicate with the server
            // the timeout set for the hotel
            if (timeStampInSeconds >= 300) {
                var errors = ['Request timed out. Unable to process report !!'];

                deferred.reject(errors);
            } else {
                rvBaseWebSrvV2.getJSONWithSpecialStatusHandling(async_callback_url).then(function (data) {
                    // if the request is still not proccesed
                    if (!!data.status && data.status === 'processing_not_completed' || data === 'null') {
                        // is this same URL ?
                        setTimeout(function () {
                            console.info('POLLING::-> for print response');
                            pollToReport(async_callback_url);
                        }, 5000);
                    } else {
                        clearInterval(refreshIntervalId);
                        deferred.resolve(data);
                    }
                }, function (data) {
                    if (typeof data === 'undefined') {
                        pollToReport(async_callback_url);
                    } else {
                        clearInterval(refreshIntervalId);
                        deferred.reject(data);
                    }
                });
            }
        };

        var success = function success(data) {
            var resolveData;

            if (!!data.status && data.status === 'processing_not_completed') {
                pollToReport(data.location_header);
            } else {

                if (!!options.resKey2 && !!options.resKey) {
                    resolveData = data[options.resKey][options.resKey2];
                } else if (options.resKey) {
                    resolveData = data[options.resKey];
                } else {
                    resolveData = data;
                }

                // push it into store
                if (options.hasOwnProperty('name')) {
                    service.setIntoStore(options.name, resolveData);
                }
                clearInterval(refreshIntervalId);

                if ([RVReportMsgsConst['REPORT_SUBMITED'], RVReportMsgsConst['REPORT_UPDATED'], RVReportMsgsConst['REPORT_PAGE_CHANGED'], RVReportMsgsConst['REPORT_FILTER_CHANGED']].indexOf(options.action) >= 0) {
                    reportsCache.put('LAST_FETCHED_REPORT', resolveData);
                }

                deferred.resolve(resolveData);
            }
        };

        var failed = function failed(data) {
            deferred.reject(data || {});
        };

        // if config is incorrect
        if (!options.url || !options.method || !rvBaseWebSrvV2.hasOwnProperty(options.method)) {
            failed();
        }

        // if it has been fetched already
        else if (service.availInStore(options.name)) {
                deferred.resolve(service.getfromStore(options.name));
            }

            // if there is a request params object
            else if (options.params) {
                    if (options.action === RVReportMsgsConst['REPORT_LOAD_LAST_REPORT']) {
                        deferred.resolve(reportsCache.get('LAST_FETCHED_REPORT'));
                    } else if (options.params.reportTitle === 'Credit Check Report') {
                        options.params = _.omit(options.params, 'reportTitle');
                        rvBaseWebSrvV2.postJSONWithSpecialStatusHandling(options.url, options.params).then(success, failed);
                    } else {
                        options.params = _.omit(options.params, 'reportTitle');
                        rvBaseWebSrvV2[options.method](options.url, options.params).then(success, failed);
                    }
                }

                // else simple call
                else {
                        rvBaseWebSrvV2[options.method](options.url).then(success, failed);
                    }

        return deferred.promise;
    };

    service.fetchReportList = function () {
        return callApi({
            name: 'reportList',
            method: 'getJSON',
            url: '/api/reports'
        });
    };

    service.fetchReportDetails = function (params) {
        return callApi({
            // no name here since we dont want to cache it in the store ever
            method: 'postJSON',
            url: '/api/reports/' + params.id + '/submit',
            params: _.omit(params, ['id', 'action']),
            action: params.action
        });
    };

    service.fetchGeneratedReportDetails = function (params) {
        var deferred = $q.defer(),
            url = '/api/generated_reports/' + params.id + '/view';

        if (params.reportTitle === 'Tax Output Report - Tax Payment Receipts') {
            rvBaseWebSrvV2.getJSON(url).then(function (data) {
                if (params.per_page !== 99999) {
                    _.each(data.results, function (subCategory) {
                        if (subCategory.receipt_details && subCategory.receipt_details.receipts && subCategory.receipt_details.receipts.length > params.per_page) {
                            subCategory.receipt_details.receipts = subCategory.receipt_details.receipts.slice(0, params.per_page);
                        }
                    });
                }
                service.cachedInboxReport = data;
                service.weekendDays = data.weekend_days || ["Saturday", "Sunday"];
                deferred.resolve(service.getcachedInboxReportByParams(params));
            }, function (data) {
                deferred.reject(data);
            });
        } else if (params.page === 1) {
            rvBaseWebSrvV2.getJSON(url).then(function (data) {
                service.cachedInboxReport = data;
                service.weekendDays = data.weekend_days || ["Saturday", "Sunday"];
                deferred.resolve(service.getcachedInboxReportByParams(params));
            }, function (data) {
                deferred.reject(data);
            });
        } else {
            deferred.resolve(service.getcachedInboxReportByParams(params));
        }
        return deferred.promise;
    };

    service.getReservationsOfTravelAgents = function (params) {
        return callApi({
            // no name here since we dont want to cache it in the store ever
            method: 'getJSON',
            url: 'api/reports/list_travel_agent_reservations',
            params: params
        });
    };

    service.getReceiptsOfCategories = function (params) {
        return callApi({
            // no name here since we dont want to cache it in the store ever
            method: 'getJSON',
            url: 'api/reports/list_tax_payment_receipts',
            params: params
        });
    };

    service.fetchActiveUsers = function () {
        return callApi({
            name: 'activeUsers',
            method: 'getJSON',
            url: '/api/users/active'
        });
    };

    service.fetchTaxPaymentReceiptTypes = function () {
        return callApi({
            name: 'paymentReceiptTypes',
            method: 'getJSON',
            url: '/api/payment_receipts/tax_payment_receipt_types',
            resKey: 'results'
        });
    };

    service.fetchGuaranteeTypes = function () {
        return callApi({
            name: 'guaranteeTypes',
            method: 'getJSON',
            url: '/api/reservation_types.json?is_active=true',
            resKey: 'reservation_types'
        });
    };

    service.fetchChargeNAddonGroups = function (reportParams) {
        return callApi({
            name: 'chargeNAddonGroups',
            method: 'getJSON',
            url: 'api/charge_groups',
            resKey: 'results',
            params: reportParams
        });
    };

    service.fetchChargeCodes = function () {
        return callApi({
            name: 'chargeCodes',
            method: 'getJSON',
            url: 'api/charge_codes',
            resKey: 'results'
        });
    };

    service.fetchAllowances = function () {
        return callApi({
            name: 'allowances',
            method: 'getJSON',
            url: 'api/addons',
            params: {
                allowance_only: true,
                no_pagination: true
            },
            resKey: 'results'
        });
    };

    service.fetchAddons = function (params) {
        return callApi({
            name: 'addons',
            method: 'postJSON',
            url: 'api/addons/detail',
            params: params,
            resKey: 'results'
        });
    };

    service.fetchMarkets = function (shouldIncludeInactive) {
        var url = '/api/market_segments?is_active=true';

        if (shouldIncludeInactive) {
            url = '/api/market_segments';
        }

        return callApi({
            name: 'markets',
            method: 'getJSON',
            url: url,
            resKey: 'markets'
        });
    };

    service.fetchSegments = function (shouldIncludeInactive) {
        var url = '/api/segments?is_active=true';

        if (shouldIncludeInactive) {
            url = '/api/segments';
        }

        return callApi({
            name: 'segments',
            method: 'getJSON',
            url: url,
            resKey: 'segments'
        });
    };

    service.fetchSources = function (shouldIncludeInactive) {
        var url = 'api/sources?is_active=true';

        if (shouldIncludeInactive) {
            url = 'api/sources';
        }

        return callApi({
            name: 'sources',
            method: 'getJSON',
            url: url,
            resKey: 'sources'
        });
    };

    service.fetchBookingOrigins = function (shouldIncludeInactive) {
        var url = 'api/booking_origins?is_active=true';

        if (shouldIncludeInactive) {
            url = 'api/booking_origins';
        }

        return callApi({
            name: 'bookingOrigins',
            method: 'getJSON',
            url: url,
            resKey: 'booking_origins'
        });
    };

    service.fetchCodeSettings = function () {
        return callApi({
            name: 'codeSettings',
            method: 'getJSON',
            url: '/api/reports/code_settings'
        });
    };

    service.fetchComTaGrp = function (query, exclude_groups) {
        var urlPrams = '?query=' + query;

        if (exclude_groups) {
            urlPrams += '&exclude_groups=true';
        }

        return callApi({
            // no name here since we dont want to cache it in the store ever
            method: 'getJSON',
            url: 'api/reports/search_by_company_agent_group' + urlPrams,
            resKey: 'results'
        });
    };

    service.fetchGroupCode = function (query) {
        var urlPrams = '?query=' + query;

        return callApi({
            // no name here since we dont want to cache it in the store ever
            method: 'getJSON',
            url: 'api/reports/search_group_by_code' + urlPrams,
            resKey: 'results'
        });
    };

    service.fetchHoldStatus = function () {
        return callApi({
            name: 'holdStatus',
            method: 'getJSON',
            url: 'api/group_hold_statuses',
            resKey: 'data',
            resKey2: 'hold_status'
        });
    };

    service.fetchReservationStatus = function () {
        return callApi({
            name: 'reservationStatus',
            method: 'getJSON',
            url: 'api/reservations/status',
            resKey: 'reservation_status'
        });
    };

    service.fetchAddonReservations = function (params) {
        return callApi({
            method: 'getJSON',
            url: '/api/reports/' + params.id + '/addon_reservations',
            params: _.omit(params, 'id'),
            resKey: 'results'
        });
    };

    service.fetchRateTypesAndRateList = function () {
        return callApi({
            name: 'rateTypeAndRateList',
            method: 'postJSON',
            url: '/api/rates/list',
            resKey: 'rates'
            // params: {
            //     include_custom_rates: true
            //     // This service is used ONLY for the Daily Production Rate Report Filters & hence this param is added to the request
            // }
        });
    };

    service.fetchRateCode = function () {
        return callApi({
            name: 'rateCodeList',
            method: 'getJSON',
            url: '/api/rates/codes',
            resKey: 'rate_codes'
        });
    };

    service.fetchRoomTypeList = function (params) {
        params = params || {};
        return callApi({
            name: 'roomTypeList',
            method: 'getJSON',
            url: 'api/room_types',
            resKey: 'results',
            params: params
        });
    };

    service.fetchRestrictionList = function () {
        return callApi({
            name: 'restrictionList',
            method: 'getJSON',
            url: '/api/restriction_types?is_activated=true',
            resKey: 'results'
        });
    };
    service.fetchOrigins = function () {
        return callApi({
            name: 'origins',
            method: 'getJSON',
            url: 'api/reports/origins',
            resKey: 'origins'
        });
    };

    service.fetchURLs = function () {
        return callApi({
            name: 'URLs',
            method: 'getJSON',
            url: 'api/guest_web_urls/?application=URL&guest_web_url_type=CHECKIN',
            resKey: 'data'
        });
    };

    service.fetchScheduleFrequency = function (exportOnly) {
        var url = exportOnly ? 'admin/export_frequencies.json?export_only=true' : 'admin/export_frequencies.json';

        return callApi({
            method: 'getJSON',
            url: url,
            resKey: 'results'
        });
    };

    service.fetchScheduleFormat = function () {
        var url = 'admin/export_formats.json';

        return callApi({
            method: 'getJSON',
            url: url,
            resKey: 'results'
        });
    };

    service.fetchTimePeriods = function () {
        return callApi({
            name: 'scheduleTimePeriods',
            method: 'getJSON',
            url: 'admin/export_time_periods.json',
            resKey: 'results'
        });
    };
    service.fetchSchedules = function (exportOnly) {
        var url = 'admin/export_schedules.json',
            params = {
            page: 1,
            per_page: 9999
        };

        if (exportOnly) {
            params.export_only = true;
        }

        return callApi({
            method: 'getJSON',
            url: url,
            resKey: 'results',
            params: params
        });
    };
    service.fetchOneSchedule = function (params) {
        return callApi({
            method: 'getJSON',
            url: 'admin/export_schedules/' + params.id
        });
    };
    service.fetchDeliveryTypes = function (params) {
        return callApi({
            name: 'scheduleDeliveryTypes',
            method: 'getJSON',
            url: 'admin/export_delivery_types.json',
            resKey: 'results'
        });
    };
    service.fetchFtpServers = function () {
        return callApi({
            name: 'ftpServerList',
            method: 'getJSON',
            url: '/api/sftp_servers',
            resKey: 'results'
        });
    };

    service.runNowExport = function (param) {
        var url = 'admin/export_schedules/' + param.id + '.json';

        // start_on: now.date
        // time: now.time;

        return callApi({
            method: 'putJSON',
            url: url,
            resKey: 'results'
        });
    };

    service.createExport = function () {
        var url = 'admin/export_schedules.json';

        return callApi({
            method: 'postJSON',
            url: url,
            resKey: 'results'
        });
    };
    service.updateAnExport = function (param) {
        var url = 'admin/export_schedules/' + param.id + '.json';

        return callApi({
            method: 'putJSON',
            url: url,
            resKey: 'results'
        });
    };
    service.fetchAnExport = function (param) {
        var url = 'admin/export_schedules/' + param.id + '.json';

        return callApi({
            method: 'getJSON',
            url: url,
            resKey: 'results'
        });
    };

    service.fetchCampaignTypes = function () {
        return callApi({
            name: 'campaign_types',
            method: 'getJSON',
            url: 'api/campaigns/campaign_types',
            resKey: 'campaign_types'
        });
    };

    service.fetchSchedulableReports = function (exportOnly) {
        var url = exportOnly ? 'admin/export_reports.json?export_only=true' : 'admin/export_reports.json';

        return callApi({
            method: 'getJSON',
            url: url,
            resKey: 'results'
        });
    };

    service.fetchFloors = function () {
        return callApi({
            name: 'houseFloors',
            method: 'getJSON',
            url: 'api/floors.json',
            resKey: 'floors'
        });
    };

    service.fetchDepartments = function () {
        return callApi({
            name: 'departments',
            method: 'getJSON',
            url: 'admin/departments.json',
            resKey: 'data',
            resKey2: 'departments'
        });
    };

    service.fetchEmployees = function () {
        return callApi({
            name: 'employees',
            method: 'getJSON',
            url: '/api/users/active.json?journal=true'
        });
    };

    service.fetchPaymentTypes = function () {
        return callApi({
            name: 'paymentTypes',
            method: 'getJSON',
            url: '/api/hotel_payment_types',
            resKey: 'results'
        });
    };

    service.fetchTaxExemptTypes = function () {
        return callApi({
            name: 'taxExempts',
            method: 'getJSON',
            url: 'api/tax_exempt_types',
            resKey: 'results'
        });
    };

    service.fetchLanguages = function () {
        return callApi({
            name: 'languages',
            method: 'getJSON',
            url: 'api/guest_languages',
            resKey: 'languages'
        });
    };

    service.getChargeCodes = function (params) {
        return callApi({
            method: 'getJSON',
            url: 'api/reports/' + params.report_id + '/revenue_by_charge_codes',
            params: _.omit(params, 'report_id')
        });
    };

    service.getPaymentValues = function (params) {
        return callApi({
            method: 'getJSON',
            url: 'api/reports/' + params.report_id + '/payment_by_charge_codes',
            params: _.omit(params, 'report_id')
        });
    };

    service.fetchAccounts = function () {
        return callApi({
            name: 'accounts',
            method: 'getJSON',
            url: '/api/accounts/list',
            resKey: 'accounts'
        });
    };

    service.fetchTravelAgents = function (params) {
        params = params || {};

        return callApi({
            name: 'accounts',
            method: 'getJSON',
            url: ' /api/reports/list_travel_agents',
            resKey: 'travel_agents',
            params: params
        });
    };

    service.fetchCountries = function (params) {
        params = params || {};

        return callApi({
            name: 'accounts',
            method: 'getJSON',
            url: ' /ui/country_list',
            resKey: '',
            params: params
        });
    };

    service.fetchExternalReferenceList = function (params) {
        params = params || {};
        return callApi({
            name: 'externalReferenceList',
            method: 'getJSON',
            url: 'api/reference_values/manual_external_reference_interfaces?workstation_id=' + $rootScope.workstation_id,
            resKey: 'external_interface_types',
            params: params
        });
    };

    // Search groups based on query string
    service.fetchGroups = function (params) {

        return callApi({
            // no name here since we dont want to cache it in the store ever
            method: 'getJSON',
            url: '/api/groups/search',
            resKey: 'groups',
            params: params
        });
    };

    /**
     * Fetch group by id
     * @param {Number} id identifier for the group
     * @return {Promise} promise
     */
    service.fetchGroupById = function (id) {
        return callApi({
            method: 'getJSON',
            url: '/api/groups/' + id + '/group_name'
        });
    };

    /**
     * Fetch accounts (CC/TA) by id
     * @param {Number} id identifier for the account
     * @return {Promise} promise
     */
    service.fetchAccountsById = function (id) {
        return callApi({
            method: 'getJSON',
            url: '/api/accounts/' + id
        });
    };

    /**
     * Fetch rate types
     * @return {Promise} promise
     */
    service.fetchRateTypes = function () {
        return callApi({
            method: 'getJSON',
            url: '/api/rate_types.json?sort_field=is_active&sort_dir=false&per_page=1000&page=1'
        });
    };

    /**
     * Fetch employee list for room status report
     * @return {Promise} promise
     */
    service.fetchEmployeeList = function () {
        return callApi({
            method: 'getJSON',
            url: '/api/work_statistics/employees_list?per_page=9999'
        });
    };

    /**
     * Fetch rate info for an array of rate ids
     * @param {Object} params hold array of rate ids
     * @return {Promise}
     */
    service.fetchRateDetailsByIds = function (params) {
        var deferred = $q.defer(),
            url = '/api/rates/list';

        rvBaseWebSrvV2.postJSON(url, params).then(function (response) {
            deferred.resolve(response.rates);
        }, function (error) {
            deferred.reject(error);
        });

        return deferred.promise;
    };

    /**
     * Fetch addons name for given array of addon ids
     * @param {Object} contains an array of ids
     * @return {Promise}
     */
    service.fetchAddonsByIds = function (params) {
        var deferred = $q.defer(),
            url = '/api/addons/names_list';

        rvBaseWebSrvV2.postJSON(url, params).then(function (response) {
            deferred.resolve(response.results);
        }, function (error) {
            deferred.reject(error);
        });

        return deferred.promise;
    };

    /**
     * Fetch travel agents by ids
     * @params {Object} contains an array of ids
     * @return {Promise}
     */
    service.fetchTravelAgentsByIds = function (params) {
        var deferred = $q.defer(),
            url = '/api/reports/list_travel_agents';

        rvBaseWebSrvV2.getJSON(url, params).then(function (response) {
            deferred.resolve(response.travel_agents);
        }, function (error) {
            deferred.reject(error);
        });

        return deferred.promise;
    };

    /**
     * Fetch work types 
     * @return {Promise}
     */
    service.fetchWorkTypes = function () {
        var deferred = $q.defer(),
            url = 'api/work_types';

        rvBaseWebSrvV2.getJSON(url).then(function (data) {
            deferred.resolve(data.results);
        }, function (data) {
            deferred.reject(data);
        });

        return deferred.promise;
    };

    /**
     * Fetch Front Office Status
     * @return {Promise}
     */
    service.fetchFrontOfficeStatus = function () {
        var deferred = $q.defer(),
            url = 'api/reference_values?type=front_office_status';

        rvBaseWebSrvV2.getJSON(url).then(function (data) {
            deferred.resolve(data);
        }, function (data) {
            deferred.reject(data);
        });

        return deferred.promise;
    };

    /**
     * Fetch Housekeeping Status
     * @return {Promise}
     */
    service.fetchHouseKeepingStatus = function () {
        var deferred = $q.defer(),
            url = 'api/reference_values?type=housekeeping_status';

        rvBaseWebSrvV2.getJSON(url).then(function (data) {
            deferred.resolve(data);
        }, function (data) {
            deferred.reject(data);
        });

        return deferred.promise;
    };

    /**
     * Fetch Reservation Status
     * @return {Promise}
     */
    service.getReservationStatus = function () {
        var deferred = $q.defer(),
            url = 'api/reservation/statuses';

        rvBaseWebSrvV2.getJSON(url).then(function (data) {
            deferred.resolve(data.reservation_status);
        }, function (data) {
            deferred.reject(data);
        });

        return deferred.promise;
    };

    return service;
}]);