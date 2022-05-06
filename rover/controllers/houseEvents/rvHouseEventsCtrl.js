angular.module('houseEventsModule').controller('houseEventsController', [
'$scope', 
'$filter',
'RVHouseEventsSrv',
'eventTypes',
'$rootScope',
'ngDialog',
'$timeout',
function ($scope, $filter, eventsSrv, eventTypes, $rootScope, ngDialog, $timeout) {

    BaseCtrl.call(this, $scope);

    var that = this,
        PER_PAGE = 50,
        EVENT_LIST_SCROLLER = 'events_list_scroller',
        EVENT_DETAILS_SCROLLER = 'event_details_scroller',
        EVENT_DESC_LENGTH_LIMIT = 255,
        MANDATORY_FIELD_MISSING_ERR_MSG = 'Some mandatory fields are missing - please fill them in.';

    /**
     * when the start date is choosed,
     * will assign startDate to using the value got from date picker
     * @param {Date} date object
     * @param {Object} datePickerObj date picker object
     * @return {void}
     */
    that.startDateSelected = function() {
        $scope.filter.startDate = $scope.filterStartDate;
        $scope.endDateOptions.minDate = $scope.filter.startDate;
        // we have to search on changing the start date
        $scope.search();
    };

    /**
     * when the end date is choosed,
     * will assign endDate to using the value got from date picker
     * @param {Date} date object
     * @param {Object} datePickerObj date picker object
     * @return {void}
     */
    that.endDateSelected = function() {
        $scope.filter.endDate = $scope.filterEndDate;
        $scope.startDateOptions.maxDate = $scope.filter.endDate;
        
        // we have to search on changing the end date
        $scope.search();
    };

    /**
     * Get date picker common options
     */
    that.getCommonDateOptions = function () {
        // date picker options - Common
        var commonDateOptions = {
            showOn: 'button',
            dateFormat: $rootScope.jqDateFormat,
            numberOfMonths: 1
        };

        return commonDateOptions;
    };

    /**
     * utility function to set datepicker options
     * return - None
     */
    that.setDatePickerOptions = function() {
        
        // date picker options - From
        $scope.startDateOptions = _.extend({
            onSelect: that.startDateSelected
        }, that.getCommonDateOptions());

        // date picker options - Departute
        $scope.endDateOptions = _.extend({
            onSelect: that.endDateSelected,
            minDate: tzIndependentDate($rootScope.businessDate)
        }, that.getCommonDateOptions());

        $scope.filterStartDate = tzIndependentDate($rootScope.businessDate);
        $scope.filter.startDate = $scope.filterStartDate;
    };

    /**
     * Reset event date options
     */
    that.resetEventMinMaxDates = function () {
        $scope.eventStartDateOptions.minDate = tzIndependentDate($rootScope.businessDate);
        $scope.eventStartDateOptions.maxDate = null;
        $scope.eventEndDateOptions.minDate = tzIndependentDate($rootScope.businessDate);
        $scope.eventEndDateOptions.maxDate = null;
    };

    /**
     * Configure the date picker options for the event details
     */
    $scope.setEventDetailsDateOptions = function () {
        // date picker options - from date
        $scope.eventStartDateOptions = angular.extend({
            onSelect: function() {
                $scope.eventEndDateOptions.minDate = $scope.eventDates.start;
                $scope.eventData.startDate = $scope.eventDates.start; 
                
                if ($scope.eventDates.end !== null && ($scope.eventData.startDate > $scope.eventDates.end)) {
                    $scope.eventData.endDate = $scope.eventData.startDate;
                    $scope.eventDates.end = $scope.eventData.startDate;
                }
            }
        }, that.getCommonDateOptions());

        // date picker options - toDate
        $scope.eventEndDateOptions = angular.extend({   
            onSelect: function() {
                $scope.eventStartDateOptions.maxDate = $scope.eventDates.end;
                $scope.eventData.endDate = $scope.eventDates.end;    
            }     
        }, that.getCommonDateOptions());

    };

    /**
     * Set the error object with the required fields
     */
    that.setErrorFields = function() {
        $scope.fieldErrors = {
            eventType: false,
            eventName: false,
            startDate: false,
            endDate: false
        };
    };

    /**
     * Prepare the data for adding an event and show the popup
     */
    $scope.addEvent = function () {
        $scope.eventData = {
            eventType: '',
            eventName: '',
            startDate: null,
            endDate: null,
            description: ''
        };

        that.setErrorFields();
        $scope.errorMsg = '';

        $scope.eventDates.start = null;
        $scope.eventDates.end = null;
        that.resetEventMinMaxDates();

        $scope.lastSelectedEvent.active = false; 
        $scope.shouldShowEventDetails = false;
        
        ngDialog.open({
            template: '/assets/partials/houseEvents/rvAddHouseEventPopup.html',
            className: '',
            scope: $scope
        });

    };

    /**
     * Get request params
     * @param {Object} eventObj - event info object
     * @return {Object} request params
     */
    that.getParams = function (eventObj) {
        var params = {
            id: eventObj.id ? eventObj.id : undefined,
            name: eventObj.eventName,
            description: eventObj.description,
            house_event_type_id: eventObj.eventType,
            start_date: eventObj.startDate ? $filter('date')(tzIndependentDate(eventObj.startDate), $rootScope.dateFormatForAPI) : null,
            end_date: eventObj.endDate ? $filter('date')(tzIndependentDate(eventObj.endDate), $rootScope.dateFormatForAPI) : null
        };

        return params;
    };

    /**
     * Create new event
     */
    $scope.onCreateEvent = function () {
        $scope.errorMsg = '';
        if (!that.isEventValid($scope.eventData)) {
            $scope.errorMsg = MANDATORY_FIELD_MISSING_ERR_MSG;
        } else {
            $scope.callAPI(eventsSrv.addEvent, {
                params: that.getParams($scope.eventData),
                onSuccess: function () {
                    ngDialog.close();
                    $scope.eventData = {};
                    $scope.errorMsg = '';
                    $scope.search();
                },
                onFailure: function (error) {
                    $scope.errorMsg = error && error[0];
                }
            });
        }
    };
    
    /**
     * Refresh pagination
     */
    that.refreshPagination = function () {
        $timeout (function() {
            $scope.$broadcast('updatePagination', 'EVENTS_SEARCH');
        }, 500);
    };

    /**
     * Search the events based on the selected filters
     * @param {Number} page - current page no
     * @return {void}
     */
    $scope.search = function (page) {
        var startDate = _.isEmpty($scope.filter.startDate) ? $scope.filter.startDate : tzIndependentDate($scope.filter.startDate),
            endDate   = _.isEmpty($scope.filter.endDate) ? $scope.filter.endDate : tzIndependentDate($scope.filter.endDate);

        // Close the edit view while navigating between pages
        $scope.shouldShowEventDetails = false;
        $scope.page = page || 1;

        $scope.callAPI(eventsSrv.searchEvents, {
            params: {
                name: $scope.filter.eventName,
                house_event_type_id: $scope.filter.eventType,
                start_date: $filter('date')(startDate, $rootScope.dateFormatForAPI),
                end_date: $filter('date')(endDate, $rootScope.dateFormatForAPI),
                per_page: PER_PAGE,
                page: $scope.page
            },
            onSuccess: function (data) {
                var events = [],
                    eventObj;

                data.results.forEach(function (item) {
                    eventObj = {};
                    eventObj.id = item.id;
                    eventObj.eventTypeDesc = (_.find($scope.eventTypes, {id: item.house_event_type_id})).description;
                    eventObj.startDate = new tzIndependentDate(item.start_date);
                    eventObj.endDate = new tzIndependentDate(item.end_date);
                    eventObj.eventName = item.name;
                    eventObj.description = item.description;
                    eventObj.eventType = item.house_event_type_id;

                    events.push(eventObj);
                });
                $scope.events = events;
                $scope.totalResultCount = data.total_count;

                that.refreshPagination();

                that.refreshListScroller();
            },
            onFailure: function () {
                $scope.events = [];
                $scope.totalResultCount = 0;
                that.refreshPagination();
            }
        });
    };

    // Initialize pagination
    that.initializePagination = function () {
        $scope.eventsSearchPagination = {
            id: 'EVENTS_SEARCH',
            api: $scope.search,
            perPage: PER_PAGE
        };
    };

    // Set scroller options
    that.setScroller = function() {
        // setting scroller things
        var scrollerOptions = {
            tap: true,
            preventDefault: false,
            shrinkScrollbars: 'clip'
        };

        $scope.setScroller(EVENT_LIST_SCROLLER, scrollerOptions);
        $scope.setScroller(EVENT_DETAILS_SCROLLER, scrollerOptions);
    };

    /**
     * Refresh events list scroller
     */
    that.refreshListScroller = function() {
        $scope.refreshScroller(EVENT_LIST_SCROLLER);
    };

    /**
     * Refresh event details scroller
     */
    that.refreshEventDetailsScroller = function() {
        $timeout(function () {
            $scope.refreshScroller(EVENT_DETAILS_SCROLLER);
        }, 200);
        
    };


    /**
    * should show pagination
    * @return {Boolean}
    */
    $scope.shouldShowPagination = function() {
        return ($scope.totalResultCount > PER_PAGE);
    };

    /**
     * Prepare event edit section
     * @param {Object} event - edited event object
     */
    $scope.showEventDetails = function (event) {
        if ($scope.lastSelectedEvent) {
            $scope.lastSelectedEvent.active = false;  
        }
        event.active = true;
        $scope.lastSelectedEvent = event;
        $scope.eventDates.start = new tzIndependentDate(event.startDate);
        $scope.eventDates.end = new tzIndependentDate(event.endDate);

        $scope.eventData = dclone(event);
        $scope.eventData.disableStartDate = $scope.eventDates.start < tzIndependentDate($rootScope.businessDate);
        $scope.eventData.disableEndDate = $scope.eventDates.end < tzIndependentDate($rootScope.businessDate);
        $scope.errorMsg = '';

        that.setErrorFields();
        
        if ($scope.eventData.disableStartDate) {
            $scope.eventStartDateOptions.minDate = null;
            $scope.eventStartDateOptions.maxDate = null;
        } else {
            $scope.eventStartDateOptions.minDate = tzIndependentDate($rootScope.businessDate);
            $scope.eventStartDateOptions.maxDate = null;
        }

        if ($scope.eventData.disableEndDate) {
            $scope.eventEndDateOptions.minDate = null;
            $scope.eventEndDateOptions.maxDate = null;  
        } else {
            $scope.eventEndDateOptions.minDate = tzIndependentDate($rootScope.businessDate);
            $scope.eventEndDateOptions.maxDate = null;
        }

        $scope.shouldShowEventDetails = true;

        that.refreshEventDetailsScroller();
    };

    /**
     * Checks whether all mandatory fields are entered for the event
     * @param {Object} event - event object
     */
    that.isEventValid = function (event) {
        var isValid = event.eventType;

        $scope.fieldErrors = {
            eventType: false,
            eventName: false,
            startDate: false,
            endDate: false,
            description: false
        };

        if (!event.eventType) {
            $scope.fieldErrors.eventType = true;
        }

        isValid = isValid && event.eventName;

        if (!event.eventName) {
            $scope.fieldErrors.eventName = true;
        }

        isValid = isValid && event.startDate;

        if (!event.startDate) {
            $scope.fieldErrors.startDate = true;
        }

        isValid = isValid && event.endDate;

        if (!event.endDate) {
            $scope.fieldErrors.endDate = true;
        }

        if (event.description && event.description.length > EVENT_DESC_LENGTH_LIMIT) {
            isValid = false;
            $scope.fieldErrors.description = true;
        }

        return isValid;
    };

    /**
     * Update a particular event
     */
    $scope.updateEvent = function () {
        $scope.errorMessage = [];
        if (!that.isEventValid($scope.eventData)) {
            $scope.errorMsg = MANDATORY_FIELD_MISSING_ERR_MSG;
            that.refreshEventDetailsScroller();
        } else {
            $scope.callAPI(eventsSrv.updateEvent, {
                params: that.getParams($scope.eventData),
                onSuccess: function () {
                    $scope.eventData = {};
                    $scope.shouldShowEventDetails = false;
                    $scope.errorMsg = '';
                    $scope.search();
                },
                onFailure: function (error) {
                    $scope.errorMsg = error && error[0];
                    that.refreshEventDetailsScroller();
                }
            });
        }
    };

    /**
     * Discard edit of a particular event
     */
    $scope.discardEdit = function () {
        $scope.eventData = {};
        $scope.shouldShowEventDetails = false;
        $scope.lastSelectedEvent.active = false;
    };

    /**
     * Show delete confirmation popup
     */
    $scope.showDeleteConfirmationPopup = function () {
        ngDialog.open({
            template: '/assets/partials/houseEvents/rvDeleteHouseEventConfirmationPopup.html',
            className: '',
            scope: $scope
        });
    };

    /**
     * Delete a particular event
     */
    $scope.deleteEvent = function () {
        $scope.callAPI(eventsSrv.deleteEvent, {
            params: {
                id: $scope.eventData.id
            },
            onSuccess: function () {
                $scope.shouldShowEventDetails = false;
                $scope.lastSelectedEvent.active = false;
                $scope.closeDialog();
                $scope.search();
            },
            onFailure: function (error) {
                $scope.errorMessage = error;
            }
        });
    };

    /**
     * Close popup
     */
    $scope.closeDialog = function () {
        $scope.errorMessage = [];
        $scope.errorMsg = '';
        ngDialog.close();
    };

    /**
     * Reset filter min/max dates
     */
    that.resetFilterMinMaxDates = function () {
        $scope.startDateOptions.minDate = null;
        $scope.startDateOptions.maxDate = null;
        $scope.endDateOptions.minDate = null;
        $scope.endDateOptions.maxDate = null;
    };

    /**
     * Clear top level filters
     * @param {Object} event - event object
     * @param {String} fieldName - filter field name
     * @param {Object} obj - event object
     * @param {Boolean} reload - reload the results or not
     * @param {Boolean} validate - should validate the field or not
     * @return {void}
     */
    $scope.clearFilter = function (event, fieldName, obj, modelName, reload, validate) {
        event.preventDefault();

        obj[fieldName] = undefined;

        if (modelName === 'startDate') {
            $scope.filterStartDate = null;
            if (!$scope.filterStartDate && !$scope.filterEndDate) {
                that.resetFilterMinMaxDates();
            }
        } else if (modelName === 'endDate') {
            $scope.filterEndDate = null;
            if (!$scope.filterStartDate && !$scope.filterEndDate) {
                that.resetFilterMinMaxDates();
            }
        } else if (modelName === 'start') {
            $scope.eventDates.start = null;
        } else if (modelName === 'end') {
            $scope.eventDates.end = null;
        }

        if (validate) {
            $scope.onFieldChange(obj[fieldName], fieldName);
        }

        if (reload) {
            $scope.search();
        }
    };
    /**
     * Debounced version of the search function
     */
    $scope.onEventNameSearch = _.debounce($scope.search, 1000);

    /**
     * Validates the given field
     * @param {*} fieldVal 
     * @param {*} fieldName 
     */
    $scope.onFieldChange = function (fieldVal, fieldName) {
        if (fieldName === 'description') {
            $scope.fieldErrors[fieldName] = fieldVal && fieldVal.length > EVENT_DESC_LENGTH_LIMIT;
        } else if (fieldVal) {
            $scope.fieldErrors[fieldName] = false;
        } else {
            $scope.fieldErrors[fieldName] = true;
        }
    };

    /**
     * Refresh event list
     */
    $scope.refreshEventsList = function() {
        $scope.lastSelectedEvent.active = false; 
        $scope.shouldShowEventDetails = false;

        $scope.search(1);
    };

    that.init = function () {
        $scope.heading = $filter('translate')('MENU_EVENTS');
        $scope.setTitle($filter('translate')('MENU_EVENTS'));
        $scope.$emit('updateRoverLeftMenu', 'events');
        
        $scope.eventTypes = eventTypes;

        $scope.filter = {
            eventType: '',
            eventName: '',
            startDate: '',
            endDate: ''
        };

        $scope.eventDates = {
            start: null,
            end: null
        };

        $scope.events = [];

        that.setDatePickerOptions();
        that.initializePagination();
        that.setScroller();
        $scope.setEventDetailsDateOptions();
        $scope.eventData = {};
        $scope.lastSelectedEvent = {};

        $scope.search();
    };

    that.init();

}]);
