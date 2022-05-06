'use strict';

angular.module('reportsModule').factory('RVCustomExportsUtilFac', ['$rootScope', 'RVCustomExportFilterParamsConst', 'RVreportsSubSrv', '$q', 'RVCustomExportSrv', function ($rootScope, customExportFilterParamsConst, reportSubSrv, $q, rvCustomExportSrv) {

    var boolStateOptions = [{
        label: 'Yes',
        value: true
    }, {
        label: 'No',
        value: false
    }];

    var dayNightUseIndicator = [{
        label: 'D',
        value: 'D'
    }, {
        label: 'N',
        value: 'N'
    }];

    var rangeOperators = [{ label: 'Greater than', value: 'greater_than' }, { label: 'Equal to', value: 'equal_to' }, { label: 'Less than', value: 'less_than' }];

    var noTextTransformStyle = {
        'text-transform': 'none'
    };

    var GENERAL_FILTERS = [{ label: 'Has values', value: 'is not null' }];

    /**
     * Group the filter fields by filter type
     * @param {Array} filters all filter fields
     * @return {Object} filterOptions
     */
    var processFilters = function processFilters(filters) {
        var filterOptions = {};

        _.each(filters, function (filter) {
            if (!filterOptions[filter.filter_type]) {
                filterOptions[filter.filter_type] = [];
            }

            filterOptions[filter.filter_type].push({
                label: filter.description,
                value: filter.value
            });
        });

        return filterOptions;
    };

    /**
     * Mark the the objects in the array as selected when values matches
     * @param {Array} list array of object
     * @param {Array} selectedValues array of selected values
     * @param {String} key key to be used in comparison
     * @return {Array} list - list with selected property added
     */
    var markAsSelected = function markAsSelected(list, selectedValues, key) {
        key = key || 'value';
        if (!selectedValues || selectedValues.length === 0) {
            return list;
        }
        _.each(list, function (each) {
            if (selectedValues.indexOf(each[key]) !== -1) {
                each.selected = true;
            }
        });

        return list;
    };

    /**
     * Populate booking origins
     * @param {Object} selectedFilter selected filter
     * @param {Array} selectedValues array of selected values
     * @param {Object} deferred - deferred object
     * @param {String} displayKey - key used to display label
     * @param {String} valueKey - key used to display value
     * @return {void}
     */
    var populateBookingOrigins = function populateBookingOrigins(selectedFilter, selectedValues, deferred, displayKey, valueKey) {
        reportSubSrv.fetchBookingOrigins(true).then(function (data) {
            selectedFilter.secondLevelData = markAsSelected(angular.copy(data), selectedValues, valueKey);
            selectedFilter.options = {
                selectAll: selectedValues ? data.length === selectedValues.length : true,
                hasSearch: false,
                key: displayKey,
                value_key: valueKey
            };
            selectedFilter.isMultiSelect = true;

            deferred.resolve(selectedFilter);
        });
    },


    /**
     * Populate markets
     * @param {Object} selectedFilter selected filter
     * @param {Array} selectedValues array of selected values
     * @param {Object} deferred - deferred object
     * @param {String} displayKey - key used to display label
     * @param {String} valueKey - key used to display value
     * @return {void}
     */
    populateMarkets = function populateMarkets(selectedFilter, selectedValues, deferred, displayKey, valueKey) {
        reportSubSrv.fetchMarkets(true).then(function (data) {
            selectedFilter.secondLevelData = markAsSelected(angular.copy(data), selectedValues, valueKey);
            selectedFilter.options = {
                selectAll: selectedValues ? data.length === selectedValues.length : true,
                hasSearch: false,
                key: displayKey,
                value_key: valueKey
            };
            selectedFilter.isMultiSelect = true;
            deferred.resolve(selectedFilter);
        });
    },


    /**
     * Populate reservation status
     * @param {Object} selectedFilter selected filter
     * @param {Array} selectedValues array of selected values
     * @param {Object} deferred - deferred object
     * @return {void}
     */
    populateReservationStatus = function populateReservationStatus(selectedFilter, selectedValues, deferred) {
        rvCustomExportSrv.getReferenceValuesByType('reservation_status').then(function (data) {
            selectedFilter.secondLevelData = markAsSelected(angular.copy(data), selectedValues, 'value');
            selectedFilter.options = {
                hasSearch: false,
                selectAll: selectedValues ? data.length === selectedValues.length : true,
                key: 'value',
                defaultValue: 'Select Status',
                value_key: 'value'
            };
            selectedFilter.isMultiSelect = true;
            deferred.resolve(selectedFilter);
        });
    },


    /**
     * Populate sources
     * @param {Object} selectedFilter selected filter
     * @param {Array} selectedValues array of selected values
     * @param {Object} deferred - deferred object
     * @param {String} displayKey - key used to display label
     * @param {String} valueKey - key used to display value
     * @return {void}
     */
    populateSource = function populateSource(selectedFilter, selectedValues, deferred, displayKey, valueKey) {
        reportSubSrv.fetchSources(true).then(function (data) {
            selectedFilter.secondLevelData = markAsSelected(angular.copy(data), selectedValues, valueKey);
            selectedFilter.options = {
                hasSearch: false,
                selectAll: selectedValues ? data.length === selectedValues.length : true,
                key: displayKey,
                value_key: valueKey
            };
            selectedFilter.isMultiSelect = true;
            deferred.resolve(selectedFilter);
        });
    },


    /**
     * Populate segments
     * @param {Object} selectedFilter selected filter
     * @param {Array} selectedValues array of selected values
     * @param {Object} deferred - deferred object
     * @param {String} displayKey - key used to display label
     * @param {String} valueKey - key used to display value
     * @return {void}
     */
    populateSegments = function populateSegments(selectedFilter, selectedValues, deferred, displayKey, valueKey) {
        reportSubSrv.fetchSegments(true).then(function (data) {
            selectedFilter.secondLevelData = markAsSelected(angular.copy(data), selectedValues, valueKey);
            selectedFilter.options = {
                hasSearch: false,
                selectAll: selectedValues ? data.length === selectedValues.length : true,
                key: displayKey,
                value_key: valueKey
            };
            selectedFilter.isMultiSelect = true;
            deferred.resolve(selectedFilter);
        });
    },


    /**
     * Populate room types
     * @param {Object} selectedFilter selected filter
     * @param {Array} selectedValues array of selected values
     * @param {Object} deferred - deferred object
     * @return {void}
     */
    populateRoomTypes = function populateRoomTypes(selectedFilter, selectedValues, deferred) {
        reportSubSrv.fetchRoomTypeList().then(function (data) {
            selectedFilter.secondLevelData = markAsSelected(angular.copy(data), selectedValues, 'code');
            selectedFilter.options = {
                hasSearch: false,
                selectAll: selectedValues ? data.length === selectedValues.length : true,
                key: 'name',
                value_key: 'code'
            };
            selectedFilter.isMultiSelect = true;
            deferred.resolve(selectedFilter);
        });
    },


    /**
     * Populate dual state options
     * @param {Object} selectedFilter selected filter
     * @param {Array} selectedValues array of selected values
     * @param {Object} deferred - deferred object
     * @return {void}
     */
    populateDualStates = function populateDualStates(stateOptions, selectedFilter, selectedValues, deferred) {
        selectedFilter.secondLevelData = angular.copy(stateOptions);
        selectedFilter.hasDualState = true;
        selectedFilter.selectedSecondLevel = selectedValues || '';
        deferred.resolve(selectedFilter);
    },


    /**
     * Populate room nos
     * @param {Object} selectedFilter selected filter
     * @param {Array} selectedValues array of selected values
     * @param {Object} deferred - deferred object
     * @return {void}
     */
    populateRoomNos = function populateRoomNos(selectedFilter, selectedValues, deferred) {
        rvCustomExportSrv.getRoomNos().then(function (data) {
            selectedFilter.secondLevelData = markAsSelected(angular.copy(data), selectedValues, 'name');
            selectedFilter.options = {
                hasSearch: false,
                selectAll: selectedValues ? data.length === selectedValues.length : true,
                key: 'name',
                value_key: 'name'
            };
            selectedFilter.isMultiSelect = true;
            deferred.resolve(selectedFilter);
        });
    },


    /**
     * Populate rates list
     * @param {Object} selectedFilter selected filter
     * @param {Array} selectedValues array of selected values
     * @param {Object} deferred - deferred object
     * @return {void}
     */
    populateRateList = function populateRateList(selectedFilter, selectedValues, deferred) {
        rvCustomExportSrv.getRateList().then(function (data) {
            selectedFilter.secondLevelData = markAsSelected(angular.copy(data), selectedValues, 'code');
            selectedFilter.options = {
                hasSearch: false,
                selectAll: selectedValues ? data.length === selectedValues.length : true,
                key: 'name',
                value_key: 'code'
            };
            selectedFilter.isMultiSelect = true;
            deferred.resolve(selectedFilter);
        });
    },


    /**
     * Populate Tax exempt types
     * @param {Object} selectedFilter selected filter
     * @param {Array} selectedValues array of selected values
     * @param {Object} deferred - deferred object
     * @return {void}
     */
    populateTaxExemptType = function populateTaxExemptType(selectedFilter, selectedValues, deferred) {
        rvCustomExportSrv.getTaxExemptType().then(function (data) {
            selectedFilter.secondLevelData = markAsSelected(angular.copy(data.results), selectedValues, 'name');
            selectedFilter.options = {
                hasSearch: false,
                selectAll: selectedValues ? data.length === selectedValues.length : true,
                key: 'name',
                value_key: 'name'
            };
            selectedFilter.isMultiSelect = true;
            deferred.resolve(selectedFilter);
        });
    },


    /**
     * Populate CI/CO agents
     * @param {Object} selectedFilter selected filter
     * @param {Array} selectedValues array of selected values
     * @param {Object} deferred - deferred object
     * @return {void}
     */
    populateCICOAgents = function populateCICOAgents(selectedFilter, selectedValues, deferred) {
        rvCustomExportSrv.getCICOAgents().then(function (data) {
            selectedFilter.secondLevelData = markAsSelected(angular.copy(data), selectedValues, 'full_name');
            selectedFilter.options = {
                hasSearch: true,
                selectAll: selectedValues ? data.length === selectedValues.length : true,
                key: 'full_name',
                value_key: 'full_name',
                altKey: 'email'
            };
            selectedFilter.isMultiSelect = true;
            deferred.resolve(selectedFilter);
        });
    },


    /**
     * Populate CI/CO applications
     * @param {Object} selectedFilter selected filter
     * @param {Array} selectedValues array of selected values
     * @param {Object} deferred - deferred object
     * @return {void}
     */
    populateCICOApplications = function populateCICOApplications(selectedFilter, selectedValues, deferred) {
        rvCustomExportSrv.getCICOApplications().then(function (data) {
            selectedFilter.secondLevelData = markAsSelected(angular.copy(data), selectedValues, 'value');
            selectedFilter.options = {
                hasSearch: false,
                selectAll: selectedValues ? data.length === selectedValues.length : true,
                key: 'value',
                value_key: 'value',
                altKey: 'description'
            };
            selectedFilter.isMultiSelect = true;
            deferred.resolve(selectedFilter);
        });
    },


    /**
     * Populate nationality/countries
     * @param {Object} selectedFilter selected filter
     * @param {Array} selectedValues array of selected values
     * @param {Object} deferred - deferred object
     * @return {void}
     */
    populateCountryOrNationality = function populateCountryOrNationality(selectedFilter, selectedValues, deferred, displayKey, valueKey) {
        rvCustomExportSrv.getCountries().then(function (data) {
            selectedFilter.secondLevelData = markAsSelected(angular.copy(data), selectedValues, valueKey);
            selectedFilter.options = {
                hasSearch: true,
                selectAll: selectedValues ? data.length === selectedValues.length : true,
                key: displayKey,
                value_key: valueKey
            };
            selectedFilter.isMultiSelect = true;
            deferred.resolve(selectedFilter);
        });
    },


    /**
     * Populate guest languages
     * @param {Object} selectedFilter selected filter
     * @param {Array} selectedValues array of selected values
     * @param {Object} deferred - deferred object
     * @return {void}
     */
    populateLanguage = function populateLanguage(selectedFilter, selectedValues, deferred) {
        rvCustomExportSrv.getGuestLanguages().then(function (data) {
            selectedFilter.secondLevelData = markAsSelected(angular.copy(data), selectedValues, 'value');
            selectedFilter.options = {
                hasSearch: true,
                selectAll: selectedValues ? data.length === selectedValues.length : true,
                key: 'value',
                value_key: 'value'
            };
            selectedFilter.isMultiSelect = true;
            deferred.resolve(selectedFilter);
        });
    },


    /**
     * Populate primary payment methods
     * @param {Object} selectedFilter selected filter
     * @param {Array} selectedValues array of selected values
     * @param {Object} deferred - deferred object
     * @return {void}
     */
    populatePaymentMethods = function populatePaymentMethods(selectedFilter, selectedValues, deferred) {
        rvCustomExportSrv.getPaymentMethods().then(function (data) {
            selectedFilter.secondLevelData = markAsSelected(angular.copy(data), selectedValues, 'description');
            selectedFilter.options = {
                hasSearch: false,
                selectAll: selectedValues ? data.length === selectedValues.length : true,
                key: 'description',
                value_key: 'description'
            };
            selectedFilter.isMultiSelect = true;
            deferred.resolve(selectedFilter);
        });
    },


    /**
     * Populate memberships
     * @param {Object} selectedFilter selected filter
     * @param {Array} selectedValues array of selected values
     * @param {Object} deferred - deferred object
     * @return {void}
     */
    populateMemberships = function populateMemberships(selectedFilter, selectedValues, deferred) {
        rvCustomExportSrv.getMemberShips().then(function (data) {
            selectedFilter.secondLevelData = markAsSelected(angular.copy(data), selectedValues, 'value');
            selectedFilter.options = {
                hasSearch: false,
                selectAll: selectedValues ? data.length === selectedValues.length : true,
                key: 'desc',
                value_key: 'value'
            };
            selectedFilter.isMultiSelect = true;
            deferred.resolve(selectedFilter);
        });
    },


    /**
     * Populate membership levels
     * @param {Object} selectedFilter selected filter
     * @param {Array} selectedValues array of selected values
     * @param {Object} deferred - deferred object
     * @return {void}
     */
    populateMembershipLevels = function populateMembershipLevels(selectedFilter, selectedValues, deferred) {
        rvCustomExportSrv.getMemberShipLevels().then(function (data) {
            selectedFilter.secondLevelData = markAsSelected(angular.copy(data), selectedValues, 'value');
            selectedFilter.options = {
                hasSearch: false,
                selectAll: selectedValues ? data.length === selectedValues.length : true,
                key: 'value',
                value_key: 'value'
            };
            selectedFilter.isMultiSelect = true;
            selectedFilter.entryStyle = noTextTransformStyle;
            deferred.resolve(selectedFilter);
        });
    },

    /**
     * Populate charge groups
     * @param {Object} selectedFilter selected filter
     * @param {Array} selectedValues array of selected values
     * @param {Object} deferred - deferred object
     * @return {void}
     */
    populateChargeGroups = function populateChargeGroups(selectedFilter, selectedValues, deferred) {
        reportSubSrv.fetchChargeNAddonGroups().then(function (data) {
            selectedFilter.secondLevelData = markAsSelected(angular.copy(data), selectedValues, 'name');
            selectedFilter.options = {
                hasSearch: false,
                selectAll: selectedValues ? data.length === selectedValues.length : true,
                key: 'name',
                value_key: 'name'
            };
            selectedFilter.isMultiSelect = true;
            deferred.resolve(selectedFilter);
        });
    },

    /**
     * Populate charge codes
     * @param {Object} selectedFilter selected filter
     * @param {Array} selectedValues array of selected values
     * @param {Object} deferred - deferred object
     * @return {void}
     */
    populateChargeCodes = function populateChargeCodes(selectedFilter, selectedValues, deferred) {
        reportSubSrv.fetchChargeCodes().then(function (data) {
            selectedFilter.secondLevelData = markAsSelected(angular.copy(data), selectedValues, 'name');
            selectedFilter.options = {
                hasSearch: false,
                selectAll: selectedValues ? data.length === selectedValues.length : true,
                key: 'name',
                value_key: 'name'
            };
            selectedFilter.isMultiSelect = true;
            deferred.resolve(selectedFilter);
        });
    },

    /**
     * Populate charge code description
     * @param {Object} selectedFilter selected filter
     * @param {Array} selectedValues array of selected values
     * @param {Object} deferred - deferred object
     * @return {void}
     */
    populateChargeCodeDescription = function populateChargeCodeDescription(selectedFilter, selectedValues, deferred) {
        reportSubSrv.fetchChargeCodes().then(function (data) {
            selectedFilter.secondLevelData = markAsSelected(angular.copy(data), selectedValues, 'description');
            selectedFilter.options = {
                hasSearch: false,
                selectAll: selectedValues ? data.length === selectedValues.length : true,
                key: 'description',
                value_key: 'description'
            };
            selectedFilter.isMultiSelect = true;
            deferred.resolve(selectedFilter);
        });
    },


    /**
     * Populate charge code types
     * @param {Object} selectedFilter selected filter
     * @param {Array} selectedValues array of selected values
     * @param {Object} deferred - deferred object
     * @return {void}
     */
    populateChargeCodeTypes = function populateChargeCodeTypes(selectedFilter, selectedValues, deferred) {
        rvCustomExportSrv.getReferenceValuesByType('charge_code_type').then(function (data) {
            selectedFilter.secondLevelData = markAsSelected(angular.copy(data), selectedValues, 'value');
            selectedFilter.options = {
                hasSearch: false,
                selectAll: selectedValues ? data.length === selectedValues.length : true,
                key: 'description',
                value_key: 'value'
            };
            selectedFilter.isMultiSelect = true;
            deferred.resolve(selectedFilter);
        });
    },


    /**
     * Populate hold status
     * @param {Object} selectedFilter selected filter
     * @param {Array} selectedValues array of selected values
     * @param {Object} deferred - deferred object
     * @return {void}
     */
    populateHoldStatus = function populateHoldStatus(selectedFilter, selectedValues, deferred) {
        reportSubSrv.fetchHoldStatus().then(function (data) {
            selectedFilter.secondLevelData = markAsSelected(angular.copy(data), selectedValues, 'name');
            selectedFilter.options = {
                hasSearch: false,
                selectAll: selectedValues ? data.length === selectedValues.length : true,
                key: 'name',
                value_key: 'name'
            };
            selectedFilter.isMultiSelect = true;
            deferred.resolve(selectedFilter);
        });
    },


    /**
     * Populate reservation types
     * @param {Object} selectedFilter selected filter
     * @param {Array} selectedValues array of selected values
     * @param {Object} deferred - deferred object
     * @return {void}
     */
    populateReservationTypes = function populateReservationTypes(selectedFilter, selectedValues, deferred) {
        rvCustomExportSrv.getReservationTypes().then(function (data) {
            selectedFilter.secondLevelData = markAsSelected(angular.copy(data), selectedValues, 'value');
            selectedFilter.options = {
                hasSearch: false,
                selectAll: selectedValues ? data.length === selectedValues.length : true,
                key: 'name',
                value_key: 'value'
            };
            selectedFilter.isMultiSelect = true;
            deferred.resolve(selectedFilter);
        });
    },


    /**
     * Populate groups
     * @param {Object} selectedFilter selected filter
     * @param {Array} selectedValues array of selected values
     * @param {Object} deferred - deferred object
     * @return {void}
     */
    populateGroups = function populateGroups(selectedFilter, selectedValues, deferred) {
        rvCustomExportSrv.getGroupsList().then(function (data) {
            selectedFilter.secondLevelData = markAsSelected(angular.copy(data), selectedValues, 'id');
            selectedFilter.options = {
                hasSearch: true,
                selectAll: selectedValues ? data.length === selectedValues.length : true,
                key: 'name',
                value_key: 'id'
            };
            selectedFilter.isMultiSelect = true;
            deferred.resolve(selectedFilter);
        });
    },


    /**
     * Populate multi select dual state options
     * @param {Object} selectedFilter selected filter
     * @param {Array} selectedValues array of selected values
     * @param {Object} deferred - deferred object
     * @return {void}
     */
    populateMultiSelectDualStates = function populateMultiSelectDualStates(stateOptions, selectedFilter, selectedValues, deferred) {
        selectedFilter.secondLevelData = markAsSelected(angular.copy(stateOptions), selectedValues, 'value');
        selectedFilter.options = {
            hasSearch: false,
            selectAll: selectedValues ? boolStateOptions.length === selectedValues.length : true,
            key: 'label',
            value_key: 'value'
        };
        selectedFilter.isMultiSelect = true;
        deferred.resolve(selectedFilter);
    },


    /**
     * Populate external reference
     * @param {Object} selectedFilter selected filter
     * @param {Array} selectedValues array of selected values
     * @param {Object} deferred - deferred object
     * @return {void}
     */
    populateExternalReference = function populateExternalReference(selectedFilter, selectedValues, deferred) {
        reportSubSrv.fetchExternalReferenceList().then(function (data) {
            selectedFilter.secondLevelData = markAsSelected(angular.copy(data), selectedValues, 'name');
            selectedFilter.options = {
                hasSearch: false,
                selectAll: selectedValues ? data.length === selectedValues.length : true,
                key: 'name',
                value_key: 'name'
            };
            selectedFilter.isMultiSelect = true;
            deferred.resolve(selectedFilter);
        });
    };

    /**
     * Populate option filter values
     * @param {String} selectedFieldName selected field name
     * @param {Object} selectedFilter selected filter
     * @param {Array} selectedValues array of selected values
     * @return {Promise} promise
     */
    var populateOptions = function populateOptions(selectedFieldName, selectedFilter, selectedValues) {
        var deferred = $q.defer();

        switch (selectedFieldName) {
            case customExportFilterParamsConst['BOOKING_ORIGIN_CODE']:
            case customExportFilterParamsConst['ORIGIN_CODE']:
                populateBookingOrigins(selectedFilter, selectedValues, deferred, 'name', 'value');
                break;
            case customExportFilterParamsConst['MARKET_CODE']:
                populateMarkets(selectedFilter, selectedValues, deferred, 'name', 'value');
                break;
            case customExportFilterParamsConst['RESERVATION_STATUS']:
                populateReservationStatus(selectedFilter, selectedValues, deferred);
                break;
            case customExportFilterParamsConst['SOURCE_CODE']:
                populateSource(selectedFilter, selectedValues, deferred, 'name', 'value');
                break;
            case customExportFilterParamsConst['SEGMENT_CODE']:
                populateSegments(selectedFilter, selectedValues, deferred, 'name', 'value');
                break;
            case customExportFilterParamsConst['ROOM_TYPE']:
            case customExportFilterParamsConst['ARRIVAL_ROOM_TYPE']:
            case customExportFilterParamsConst['DEPARTURE_ROOM_TYPE']:
                populateRoomTypes(selectedFilter, selectedValues, deferred);
                break;
            case customExportFilterParamsConst['ACTIVE']:
            case customExportFilterParamsConst['VIP']:
            case customExportFilterParamsConst['POST_STAY']:
            case customExportFilterParamsConst['PRE_STAY']:
            case customExportFilterParamsConst['TAX_EXEMPT']:
            case customExportFilterParamsConst['GLOBAL']:
            case customExportFilterParamsConst['IS_FLAGGED']:
                populateDualStates(boolStateOptions, selectedFilter, selectedValues, deferred);
                break;
            case customExportFilterParamsConst['TAX_EXEMPT_TYPE']:
                populateTaxExemptType(selectedFilter, selectedValues, deferred);
                break;
            case customExportFilterParamsConst['ROOM_NO']:
                populateRoomNos(selectedFilter, selectedValues, deferred);
                break;
            case customExportFilterParamsConst['ARRIVAL_RATE_CODE']:
            case customExportFilterParamsConst['RATE_CODE']:
                populateRateList(selectedFilter, selectedValues, deferred);
                break;
            case customExportFilterParamsConst['CI_AGENT']:
            case customExportFilterParamsConst['CO_AGENT']:
            case customExportFilterParamsConst['USER_NAME']:
                populateCICOAgents(selectedFilter, selectedValues, deferred);
                break;
            case customExportFilterParamsConst['CI_APPLICATION']:
            case customExportFilterParamsConst['CO_APPLICATION']:
                populateCICOApplications(selectedFilter, selectedValues, deferred);
                break;
            case customExportFilterParamsConst['COUNTRY']:
                populateCountryOrNationality(selectedFilter, selectedValues, deferred, 'value', 'value');
                break;
            case customExportFilterParamsConst['LANGUAGE']:
                populateLanguage(selectedFilter, selectedValues, deferred);
                break;
            case customExportFilterParamsConst['PRIMARY_PAYMENT_METHOD']:
                populatePaymentMethods(selectedFilter, selectedValues, deferred);
                break;
            case customExportFilterParamsConst['MEMBERSHIP']:
                populateMemberships(selectedFilter, selectedValues, deferred);
                break;
            case customExportFilterParamsConst['MEMBERSHIP_LEVEL']:
                populateMembershipLevels(selectedFilter, selectedValues, deferred);
                break;
            case customExportFilterParamsConst['STAY_TYPE']:
                populateDualStates(dayNightUseIndicator, selectedFilter, selectedValues, deferred);
                break;
            case customExportFilterParamsConst['CHARGE_GROUP']:
                populateChargeGroups(selectedFilter, selectedValues, deferred);
                break;
            case customExportFilterParamsConst['CHARGE_CODE']:
                populateChargeCodes(selectedFilter, selectedValues, deferred);
                break;
            case customExportFilterParamsConst['CHARGE_CODE_DESC']:
                populateChargeCodeDescription(selectedFilter, selectedValues, deferred);
                break;
            case customExportFilterParamsConst['ORIGIN']:
                populateBookingOrigins(selectedFilter, selectedValues, deferred, 'name', 'name');
                break;
            case customExportFilterParamsConst['MARKET']:
                populateMarkets(selectedFilter, selectedValues, deferred, 'name', 'name');
                break;
            case customExportFilterParamsConst['SOURCE']:
                populateSource(selectedFilter, selectedValues, deferred, 'name', 'name');
                break;
            case customExportFilterParamsConst['SEGMENT']:
                populateSegments(selectedFilter, selectedValues, deferred, 'name', 'name');
                break;
            case customExportFilterParamsConst['NATIONALITY']:
                populateCountryOrNationality(selectedFilter, selectedValues, deferred, 'value', 'code');
                break;
            case customExportFilterParamsConst['CHARGE_TYPE']:
                populateChargeCodeTypes(selectedFilter, selectedValues, deferred);
                break;
            case customExportFilterParamsConst['HOLD_STATUS']:
                populateHoldStatus(selectedFilter, selectedValues, deferred);
                break;
            case customExportFilterParamsConst['RESERVATION_TYPE']:
                populateReservationTypes(selectedFilter, selectedValues, deferred);
                break;
            case customExportFilterParamsConst['GROUP_NAME']:
                populateGroups(selectedFilter, selectedValues, deferred);
                break;
            case customExportFilterParamsConst['DO_NOT_MOVE']:
                populateMultiSelectDualStates(boolStateOptions, selectedFilter, selectedValues, deferred);
                break;
            case customExportFilterParamsConst['EXTERNAL_SYSTEM']:
                populateExternalReference(selectedFilter, selectedValues, deferred);
                break;
            default:

        }

        return deferred.promise;
    };

    /**
     * Populated range filter values
     * @param {String} selectedFieldName selected field name
     * @param {Object} selectedFilter selected filter
     * @param {Array} appliedFilters array of appliedfilters
     * @param {String} selectedSecondLevel selected second level
     * @param {Number} rangeValue range value
     */
    var populateRangeOperators = function populateRangeOperators(selectedFieldName, selectedFilter, appliedFilters, selectedSecondLevel, rangeValue) {
        var appliedRangeOperators = _.filter(appliedFilters, function (each) {
            return each.selectedFirstLevel === selectedFieldName;
        }),
            appliedRangeOperatorNames = _.pluck(appliedRangeOperators, 'selectedSecondLevel');

        var availableOperators = _.filter(getRangeOperators(), function (each) {
            return appliedRangeOperatorNames.indexOf(each.value) === -1;
        });

        selectedFilter.secondLevelData = availableOperators;
        selectedFilter.selectedSecondLevel = selectedSecondLevel;
        selectedFilter.rangeValue = rangeValue;
    };

    /**
     * Populated range filter values
     * @param {String} selectedFieldName selected field name
     * @param {Object} selectedFilter selected filter
     * @param {Array} appliedFilters array of appliedfilters
     * @param {String} selectedSecondLevel selected second level
     * @param {Number} rangeValue range value
     */
    var populateGeneralOperators = function populateGeneralOperators(selectedFieldName, selectedFilter, appliedFilters, selectedSecondLevel) {
        var appliedGeneralOperators = _.filter(appliedFilters, function (each) {
            return each.selectedFirstLevel === selectedFieldName;
        }),
            appliedGeneralOperatorNames = _.pluck(appliedGeneralOperators, 'selectedSecondLevel');

        var availableOperators = _.filter(GENERAL_FILTERS, function (each) {
            return appliedGeneralOperatorNames.indexOf(each.value) === -1;
        });

        selectedFilter.secondLevelData = availableOperators;
        selectedFilter.selectedSecondLevel = selectedSecondLevel;
    };

    // Get available range operators
    var getRangeOperators = function getRangeOperators() {
        return rangeOperators;
    };

    // Get available range operators
    var getGeneralOperators = function getGeneralOperators() {
        return GENERAL_FILTERS;
    };

    // Object holding factory functions
    var factory = {
        processFilters: processFilters,
        populateOptions: populateOptions,
        getRangeOperators: getRangeOperators,
        populateRangeOperators: populateRangeOperators,
        populateGeneralOperators: populateGeneralOperators,
        getGeneralOperators: getGeneralOperators
    };

    return factory;
}]);