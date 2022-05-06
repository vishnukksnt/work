'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

angular.module('sntRover').service('rvRateManagerUtilitySrv', [function () {

    var service = this;

    service.restrictionColorAndIconMapping = [{
        title: 'CLOSED',
        iconClass: 'icon-cross',
        bgClass: 'bg-red',
        key: 'closed',
        type: 'boolean',
        value: null
    }, {
        title: 'CLOSED TO ARRIVAL',
        iconClass: 'icon-block',
        bgClass: 'bg-red',
        key: 'closed_arrival',
        type: 'boolean',
        value: null
    }, {
        title: 'CLOSED TO DEPARTURE',
        iconClass: '',
        bgClass: 'bg-red',
        key: 'closed_departure',
        type: 'boolean',
        value: null
    }, {
        title: 'MIN LENGTH OF STAY',
        iconClass: '',
        bgClass: 'bg-blue',
        key: 'min_length_of_stay',
        type: 'number',
        value: null
    }, {
        title: 'MAX LENGTH OF STAY',
        iconClass: '',
        bgClass: 'bg-blue-dark',
        key: 'max_length_of_stay',
        type: 'number',
        value: null
    }, {
        title: 'MIN STAY THROUGH',
        iconClass: '',
        bgClass: 'bg-violet',
        key: 'min_stay_through',
        type: 'number',
        value: null
    }, {
        title: 'MIN ADVANCE BOOKING',
        iconClass: '',
        bgClass: 'bg-green',
        key: 'min_advanced_booking',
        type: 'number',
        value: null
    }, {
        title: 'MAX ADVANCE BOOKING',
        iconClass: '',
        bgClass: 'bg-orange',
        key: 'max_advanced_booking',
        type: 'number',
        value: null
    }];

    service.repeatOnDatesList = [{
        name: 'MON',
        value: 1,
        isChecked: false
    }, {
        name: 'TUE',
        value: 2,
        isChecked: false
    }, {
        name: 'WED',
        value: 3,
        isChecked: false
    }, {
        name: 'THU',
        value: 4,
        isChecked: false
    }, {
        name: 'FRI',
        value: 5,
        isChecked: false
    }, {
        name: 'SAT',
        value: 6,
        isChecked: false
    }, {
        name: 'SUN',
        value: 0,
        isChecked: false
    }];

    // Mapping of restriction key to code/id.
    service.restrictionKeyToCodeMapping = {
        'closed': [1, 'CLOSED'],
        'closed_arrival': [2, 'CLOSED_ARRIVAL'],
        'closed_departure': [3, 'CLOSED_DEPARTURE'],
        'min_length_of_stay': [4, 'MIN_STAY_LENGTH'],
        'max_length_of_stay': [5, 'MAX_STAY_LENGTH'],
        'min_stay_through': [6, 'MIN_STAY_THROUGH'],
        'min_advanced_booking': [7, 'MIN_ADV_BOOKING'],
        'max_advanced_booking': [8, 'MAX_ADV_BOOKING']
    };

    // Mapping of restriction code/id to key and data type.
    // [0] - key
    // [1] - data type
    // [2] - lockedRestrictions key
    service.restrictionCodeToKeyMapping = {
        1: ['closed', 'boolean', 'closed'],
        2: ['closed_arrival', 'boolean', 'closed_arrival'],
        3: ['closed_departure', 'boolean', 'closed_departure'],
        4: ['min_length_of_stay', 'number', 'min_stay_length'],
        5: ['max_length_of_stay', 'number', 'max_stay_length'],
        6: ['min_stay_through', 'number', 'min_stay_through'],
        7: ['min_advanced_booking', 'number', 'min_adv_booking'],
        8: ['max_advanced_booking', 'number', 'max_adv_booking']
    };

    // Mapping of weekdays code and id for API.
    service.weekDaysMapping = {
        'sun': [0],
        'mon': [1],
        'tue': [2],
        'wed': [3],
        'thu': [4],
        'fri': [5],
        'sat': [6]
    };

    /*
     *  Method to check lockedRestrictions present.
     *  @param {Array} [lockedRestrictions]
     *  @param {String} [key for the lockedRestriction ]
     *  @return {Boolean}
     */
    service.checkLockedRestriction = function (lockedRestrictions, key) {
        key = key.toLowerCase();
        var isPresent = false;

        if (lockedRestrictions.length > 0) {
            isPresent = _.contains(lockedRestrictions, key);
        }

        return isPresent;
    };

    /*
     *  Method to process new restrcion data structure to convert into old structure.
     *  @param [Object] [input value as key value pair]
     *  @return [Array] [output - converted values into array structure]
     */
    service.generateOldGetApiResponseFormat = function (input, lockedRestrictions, isForPopup) {
        var output = [],
            key = '',
            value = '',
            obj = {};

        for (key in input) {
            value = input[key];
            obj = {};

            if (typeof value === "boolean" && value) {
                // closed, closed_arrival, closed_departure - these will always have a boolean value assigned.
                obj.status = 'ON';
                obj.restriction_type_id = service.restrictionKeyToCodeMapping[key][0];
                obj.is_on_rate = false;
                obj.days = null;
                output.push(obj);
            } else if (typeof value === "number") {
                // min_length_of_stay, max_length_of_stay, min_stay_through, min_advanced_booking, max_advanced_booking
                obj.status = value !== null ? 'ON' : '';
                obj.restriction_type_id = service.restrictionKeyToCodeMapping[key][0];
                obj.is_on_rate = lockedRestrictions ? service.checkLockedRestriction(lockedRestrictions, service.restrictionKeyToCodeMapping[key][1]) : false;
                obj.days = value;
                output.push(obj);
            } else if (isForPopup && value === null) {
                // Inorder to disable locked restrictions (values set from admin screen)
                // we need to include all restrictions even that has null value.
                // Include - min_length_of_stay, max_length_of_stay, min_stay_through, min_advanced_booking, max_advanced_booking
                obj.status = '';
                obj.restriction_type_id = service.restrictionKeyToCodeMapping[key][0];
                obj.is_on_rate = lockedRestrictions ? service.checkLockedRestriction(lockedRestrictions, service.restrictionKeyToCodeMapping[key][1]) : false;
                obj.days = null;
                output.push(obj);
            }
        }

        return output;
    };

    /**
     * Conversion function exclusively for the panel
     * 
     */
    service.generateOldGetApiResponseFormatForPanel = function (input, lockedRestrictions) {
        var output = [],
            key = '',
            restrictionData = '',
            obj = {};

        for (key in input) {
            restrictionData = input[key];
            obj = {};

            if ((typeof restrictionData === 'undefined' ? 'undefined' : _typeof(restrictionData)) === "object" && !_.isEmpty(restrictionData)) {
                obj.status = 'ON';
                obj.restriction_type_id = service.restrictionKeyToCodeMapping[key][0];
                obj.is_on_rate = lockedRestrictions ? service.checkLockedRestriction(lockedRestrictions, service.restrictionKeyToCodeMapping[key][1]) : false;
                if (restrictionData.length === undefined) {
                    obj.days = null;
                } else {
                    obj.days = restrictionData.map(function (item) {
                        return item.value;
                    });
                }
                output.push(obj);
            }
        }

        return output;
    };

    /*
     *  Method to Restructure restriction data, Array to Object format.
     *  @param {Array}  [restrcionsList]
     *  @return {Object} [restrictionsObj]
     */
    service.convertRestrictionsToNewApiFormat = function (restrcionsList) {
        var restrictionsObj = {};

        _.each(restrcionsList, function (item) {
            if (service.restrictionCodeToKeyMapping[item.restriction_type_id][1] === 'boolean') {
                restrictionsObj[service.restrictionCodeToKeyMapping[item.restriction_type_id][0]] = item.action === 'add';
            } else if (service.restrictionCodeToKeyMapping[item.restriction_type_id][1] === 'number') {
                restrictionsObj[service.restrictionCodeToKeyMapping[item.restriction_type_id][0]] = parseInt(item.days);
            }
        });

        return restrictionsObj;
    };

    /*
     *  Method to convert current weekday Object format into new Array format.
     *  @param {Objects} : Eg: { 'sun':true, 'thu': true }
     *  @return {Array}  : Eg: [0, 4]
     */
    service.convertWeekDaysToNewApiFormat = function (weekdays) {
        var weekdaysList = [],
            day = '';

        for (day in weekdays) {
            weekdaysList.push(service.weekDaysMapping[day][0]);
        }

        return weekdaysList;
    };

    /*
     *  Method to convert current POST param to new format.
     *  @param {Object} [old post params]
     *  @return {Object} [new post params]
     */
    service.generateNewPostApiParams = function (params) {
        var newPostApiParams = {
            from_date: '',
            to_date: '',
            restrictions: {}
        };

        if (params.details.length > 0) {
            newPostApiParams = {
                from_date: params.details[0].from_date,
                to_date: params.details[1] ? params.details[1].to_date : params.details[0].to_date,
                restrictions: service.convertRestrictionsToNewApiFormat(params.details[0].restrictions)
            };

            if (params.details[1] && Object.keys(params.details[1].weekdays).length > 0) {
                newPostApiParams.weekdays = service.convertWeekDaysToNewApiFormat(params.details[1].weekdays);
            }

            if (params.rate_type_ids) {
                newPostApiParams.rate_type_ids = params.rate_type_ids;
            }

            if (params.room_type_id) {
                newPostApiParams.room_type_ids = [params.room_type_id];
            }

            if (params.rate_id) {
                newPostApiParams.rate_ids = [params.rate_id];
            }
        }
        return newPostApiParams;
    };

    // Utility method to pick up selected week days for API.
    service.getSelectedWeekDays = function (daysList) {
        var weekDays = [];

        _.each(daysList, function (day) {
            if (day.isChecked) {
                weekDays.push(day.value);
            }
        });

        return weekDays;
    };

    /*  
     *  Utility method to map active restrictions from admin side with the RestrictionColorAndIconMapping list.
     *  When a restriction marked as OFF from admin side, it should not shown in set restriction list to choose it.
     * 
     *  @param {Array} [ activeRestrictionsList - all restriction from admin side with activated flag ]
     *  @return {Array} [ filtered RestrictionColorAndIconMapping list ]
     */
    service.getActiveRestrictionColorAndIconMapping = function (activeRestrictionsList) {
        var activeRestrictionColorAndIconMapping = [];

        _.each(activeRestrictionsList, function (activeItemObj) {
            _.each(service.restrictionColorAndIconMapping, function (iconMappingObj, index) {
                if (activeItemObj.id === service.restrictionKeyToCodeMapping[service.restrictionColorAndIconMapping[index].key][0] && activeItemObj.activated) {
                    activeRestrictionColorAndIconMapping.push(iconMappingObj);
                }
            });
        });

        return activeRestrictionColorAndIconMapping;
    };
}]);