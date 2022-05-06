'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

angular.module('sntRover').controller('rvRateManagerRestrictionAndAmountPopupCtrl', ['$scope', '$rootScope', 'rvRateManagerPopUpConstants', 'rvUtilSrv', '$filter', 'rvRateManagerCoreSrv', 'rvRateManagerEventConstants', 'ngDialog', function ($scope, $rootScope, rvRateManagerPopUpConstants, util, $filter, rvRateManagerCoreSrv, rvRateManagerEventConstants, ngDialog) {

    BaseCtrl.call(this, $scope);

    /**
     * IF YOU ARE HERE to DEBUG and NEW to here, start from initialization function in the bottom
     */

    /**
     * util function to check whether a string is empty
     * we are assigning it as util's isEmpty function since it is using in html
     * @param {String/Object}
     * @return {boolean}
     */
    $scope.isEmpty = util.isEmpty;

    /**
     * when clicked on week day select all button
     */
    $scope.clickedOnWeekDaySelectAllButton = function () {
        return $scope.weekDayRepeatSelection.forEach(function (weekDay) {
            return weekDay.selected = true;
        });
    };

    /**
     * when clicked on week day select none button
     */
    $scope.clickedOnWeekDaySelectNoneButton = function () {
        return $scope.weekDayRepeatSelection.forEach(function (weekDay) {
            return weekDay.selected = false;
        });
    };

    /**
     * to show select none/select all for week days selection
     * @return {Boolean}
     */
    $scope.showSelectNoneForWeekDaySelection = function () {
        return _.where($scope.weekDayRepeatSelection, { selected: true }).length === $scope.weekDayRepeatSelection.length;
    };

    /**
    * utility method for converting date object into api formated 'string' format
    * @param  {Object} date
    * @return {String}
    */
    var formatDate = function formatDate(date, format) {
        return $filter('date')(new tzIndependentDate(date), format);
    };

    /**
    * utility method for converting date object into api formated 'string' format
    * @param  {Object} date
    * @return {String}
    */
    var formatDateForAPI = function formatDateForAPI(date) {
        return formatDate(date, $rootScope.dateFormatForAPI);
    };

    /**
    * utility method for converting date object into a top header formated 'string'
    * @param  {Object} date
    * @return {String}
    */
    var formatDateForTopHeader = function formatDateForTopHeader(date) {
        return formatDate(date, 'EEEE, dd MMMM yy');
    };

    /**
     * list of price key used in tmeplates & controller
     * @type {Array}
     */
    var priceKeys = ['single', 'double', 'extra_adult', 'child'];

    /**
     * list of price overriding keys used in tmeplates & controller
     * @type {Array}
     */
    var priceOverridingKeys = ['child_overridden', 'double_overridden', 'extra_adult_overridden', 'single_overridden'];

    /**
     * week days, we use this to create default selection value
     * @type {Array}
     */
    var weekDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

    /**
     * to set the scrollers in the ui
     */
    var setScroller = function setScroller() {
        var scrollerOptions = {
            tap: true,
            preventDefault: false,
            deceleration: 0.0001,
            shrinkScrollbars: 'clip'
        };

        $scope.setScroller('scroller-restriction-list', scrollerOptions);
        $scope.setScroller('room-type-price-listing', scrollerOptions);
        $scope.setScroller('room-type-price-editing', scrollerOptions);
        $scope.setScroller('rate-price-listing', scrollerOptions);
    };

    /**
     * utility methd to refresh all scrollers
     */
    var refreshScroller = function refreshScroller() {
        $scope.refreshScroller('scroller-restriction-list');
        $scope.refreshScroller('room-type-price-listing');
        $scope.refreshScroller('room-type-price-editing');
        $scope.refreshScroller('rate-price-listing');
    };

    /**
     * to unselect the selected restriction
     */
    var deSelectAllRestriction = function deSelectAllRestriction() {
        return $scope.restrictionList.forEach(function (restriction) {
            return restriction.selected = false;
        });
    };

    /**
     * to run angular digest loop,
     * will check if it is not running
     */
    var runDigestCycle = function runDigestCycle() {
        if (!$scope.$$phase) {
            $scope.$digest();
        }
    };

    /**
     * Function to clear from until Date
     */
    $scope.clearUntilDate = function () {
        $scope.untilDate = '';
        runDigestCycle();
    };

    /**
     * when the  restriciton update api call is success
     * @param  {Object} result
     */
    var onUpdateRateRestrictionData = function onUpdateRateRestrictionData(result) {
        var dataFromPopupToParent = {
            dialogData: $scope.ngDialogData,
            isFromPopup: true
        };

        $scope.$emit(rvRateManagerEventConstants.RELOAD_RESULTS, dataFromPopupToParent);
        $scope.closeDialog();
    };

    /**
     * function to decide whether to show the applied price restriction checkbox
     * @return {Boolean}
     */
    $scope.shouldShowApplyPriceCheckbox = function () {
        return [$scope.modeConstants.RM_SINGLE_RATE_SINGLE_ROOMTYPE_RESTRICTION_AMOUNT_MODE, $scope.modeConstants.RM_SINGLE_RATE_MULTIPLE_ROOMTYPE_RESTRICTION_AMOUNT_MODE].indexOf($scope.ngDialogData.mode) > -1 && ['SINGLE_RATE_SINGLE_ROOM_TYPE_NIGHTLY_AMOUNT_EDIT', 'SINGLE_RATE_MULTIPLE_ROOM_TYPE_NIGHTLY_AMOUNT_EDIT', 'SINGLE_RATE_SINGLE_ROOM_TYPE_HOURLY_AMOUNT_EDIT', 'SINGLE_RATE_MULTIPLE_ROOM_TYPE_HOURLY_AMOUNT_EDIT'].indexOf($scope.contentMiddleMode) > -1;
    };

    /**
     * to decide whether we need to show clear override button
     * @return {Boolean}
     */
    $scope.shouldShowClearOverrideButton = function () {
        var isThereAnyPriceOverride = false,
            isInIntendedMode = false;

        // CICO-27469
        // Needn't show clear overrides button for child rates
        if (!!$scope.ngDialogData.rate && !!$scope.ngDialogData.rate.based_on_rate_id) {
            return false;
        }

        isInIntendedMode = [$scope.modeConstants.RM_SINGLE_RATE_SINGLE_ROOMTYPE_RESTRICTION_AMOUNT_MODE].indexOf($scope.ngDialogData.mode) > -1;

        priceOverridingKeys.map(function (key) {
            if (_.has($scope.priceDetails, key) && $scope.priceDetails[key]) {
                isThereAnyPriceOverride = true;
            }
        });

        return isInIntendedMode && isThereAnyPriceOverride;
    };

    /**
     * to goto default middle pane
     */
    var gotoDefaultMiddlePaneMode = function gotoDefaultMiddlePaneMode() {
        switch ($scope.ngDialogData.mode) {
            case $scope.modeConstants.RM_SINGLE_RATE_RESTRICTION_MODE:
                $scope.contentMiddleMode = 'ROOM_TYPE_PRICE_LISTING';
                break;

            case $scope.modeConstants.RM_SINGLE_ROOMTYPE_RESTRICTION_MODE:
                $scope.contentMiddleMode = 'SINGLE_ROOM_TYPE_CHOOSE_RATE';
                break;

            case $scope.modeConstants.RM_MULTIPLE_RATE_RESTRICTION_MODE:
                $scope.contentMiddleMode = 'MULTIPLE_RATE_CHOOSE_RATE';
                break;

            case $scope.modeConstants.RM_MULTIPLE_ROOMTYPE_RESTRICTION_MODE:
                $scope.contentMiddleMode = 'MULTIPLE_ROOM_TYPE_CHOOSE_RATE';
                break;

            case $scope.modeConstants.RM_SINGLE_RATE_TYPE_RESTRICTION_MODE:
            case $scope.modeConstants.RM_MULTIPLE_RATE_TYPE_RESTRICTION_MODE:
                $scope.contentMiddleMode = 'RATE_PRICE_LISTING';
                break;

            case $scope.modeConstants.RM_SINGLE_RATE_SINGLE_ROOMTYPE_RESTRICTION_AMOUNT_MODE:
                initializeSingleRateRestrictionAndAmountMiddlePane();
                break;

            case $scope.modeConstants.RM_SINGLE_RATE_MULTIPLE_ROOMTYPE_RESTRICTION_AMOUNT_MODE:
                initializeSingleRateMultipleRoomTypeRestrictionAndAmountMiddlePane();
                break;

                dafault: break;
        }
    };

    /**
     * [description]
     * @param  {[type]} key [description]
     * @return {[type]}     [description]
     */
    $scope.priceStartedToCustomize = function (key) {
        switch ($scope.ngDialogData.mode) {
            case $scope.modeConstants.RM_SINGLE_RATE_SINGLE_ROOMTYPE_RESTRICTION_AMOUNT_MODE:
            case $scope.modeConstants.RM_SINGLE_RATE_MULTIPLE_ROOMTYPE_RESTRICTION_AMOUNT_MODE:
                if (util.isNumeric($scope.priceDetails[key + '_changing_value'])) {
                    $scope.priceDetails[key] = $scope.priceDetailsCopy[key];
                } else {
                    $scope.priceDetails[key + '_changing_value'] = '';
                }
                if (!util.isNumeric($scope.priceDetails[key])) {
                    $scope.priceDetails[key] = '';
                }
                break;
        }
        refreshScroller();
    };

    /**
     * [description]
     * @param  {[type]} clickedAgainstKey [description]
     * @return {[type]}                   [description]
     */
    $scope.clickedOnApplyToAllOccupancies = function (clickedAgainstKey) {
        _.without(priceKeys, clickedAgainstKey).map(function (key) {
            $scope.priceDetails[key + '_changing_value'] = $scope.priceDetails[clickedAgainstKey + '_changing_value'];
            $scope.priceDetails[key + '_amount_operator'] = $scope.priceDetails[clickedAgainstKey + '_amount_operator'];
            $scope.priceDetails[key + '_amount_perc_cur_symbol'] = $scope.priceDetails[clickedAgainstKey + '_amount_perc_cur_symbol'];
        });
        // height will change with showing apply to all restrictin button showing
        refreshScroller();
    };

    /**
     * [description]
     * @return {[type]} [description]
     */
    $scope.clickedOnCancelRestrictionEditingButton = function () {
        deSelectAllRestriction();
        gotoDefaultMiddlePaneMode();
    };

    /**
     * on tapping the set button from restriction edit pane
     */
    $scope.clickedOnRestrictionSetButton = function (event) {
        event.stopPropagation();
        var restriction = _.findWhere($scope.restrictionList, { id: $scope.restrictionForShowingTheDetails.id });

        var restrictionValue = $scope.restrictionForShowingTheDetails.value;

        if ($scope.restrictionForShowingTheDetails.hasInputField && (!util.isNumeric(restrictionValue) || restrictionValue < 0)) {

            $scope.errorMessage = ['Please enter a valid number'];
            return;
        }

        restriction.value = $scope.restrictionForShowingTheDetails.value;
        restriction.edited = true;
        restriction.status = 'ON';
        deSelectAllRestriction();
        gotoDefaultMiddlePaneMode();
    };

    /**
     * on tapping the remove button from restriction edit pane
     */
    $scope.clickedOnRestrictionRemoveButton = function () {
        var restriction = _.findWhere($scope.restrictionList, { id: $scope.restrictionForShowingTheDetails.id });

        restriction.value = null;
        restriction.edited = true;
        restriction.status = 'OFF';
        deSelectAllRestriction();
        gotoDefaultMiddlePaneMode();
    };

    /**
     * when clciked on remove overriding icon
     */
    $scope.clickedOnClearOverrideButton = function () {
        var dialogData = $scope.ngDialogData;

        var params = {
            rate_id: dialogData.rate.id,
            room_type_id: dialogData.roomType.id,
            date: formatDateForAPI(dialogData.date)
        };
        var options = {
            params: params,
            onSuccess: onUpdateRateRestrictionData
        };

        $scope.callAPI(rvRateManagerCoreSrv.removeCustomRate, options);
    };

    /*
     * To close dialog box
     */
    $scope.closeDialog = function () {
        document.activeElement.blur();
        $scope.$emit('hideLoader');

        $rootScope.modalClosing = true;
        setTimeout(function () {
            ngDialog.close();
            $rootScope.modalClosing = false;
            window.scrollTo(0, 0);
            document.getElementById("rate-manager").scrollTop = 0;
            document.getElementsByClassName("pinnedLeft-list")[0].scrollTop = 0;
            $scope.$apply();
        }, 700);
    };

    /**
     * [description]
     * @return {[type]} [description]
     */
    var getEditedRestrictionsForAPI = function getEditedRestrictionsForAPI() {
        // CICO-42484 Only restrictions that have been edited need to be sent in the update request
        var editedRestrictions = _.filter($scope.restrictionList, function (rstrn) {
            return rstrn.edited && (rstrn.status !== rstrn.oldStatus || parseInt(rstrn.value) !== parseInt(rstrn.oldValue));
        });

        return editedRestrictions.map(function (restriction) {
            return {
                action: restriction.status === 'ON' ? 'add' : 'remove',
                restriction_type_id: restriction.id,
                days: restriction.value
            };
        });
    };

    /**
     * utility method to form api param as it is same acroos apis's
     * modifiy the params's details
     * @param  {Object} params
     */
    var formRestrictionParamDetailForWeekDaysForAPI = function formRestrictionParamDetailForWeekDaysForAPI(params) {
        var dialogData = $scope.ngDialogData,
            editedRestrictions = getEditedRestrictionsForAPI();

        if (!editedRestrictions.length) {
            return false;
        }

        if ($scope.applyRestrictionsToDates) {
            if ($scope.untilDate === '') {
                // $scope.errorMessage = ['Please choose until date'];
                return;
            }
            params.details.push({
                from_date: formatDateForAPI(util.addOneDay(tzIndependentDate(dialogData.date))),
                to_date: formatDateForAPI($scope.untilDate),
                restrictions: editedRestrictions
            });
            var index = params.details.length - 1;

            params.details[index].weekdays = {};
            $scope.weekDayRepeatSelection.filter(function (weekDay) {
                return weekDay.selected;
            }).map(function (weekDay) {
                return params.details[index].weekdays[weekDay.weekDay] = weekDay.selected;
            });
        }
    };

    /**
     * utility method to form day restriction param to api
     * modifiy the params's details
     * @param  {Object} params
     */
    var formDayRestrictionParamsForAPI = function formDayRestrictionParamsForAPI(params) {
        var dialogData = $scope.ngDialogData,
            editedRestrictions = getEditedRestrictionsForAPI();

        if (!editedRestrictions.length) {
            return;
        }

        params.details.push({
            from_date: formatDateForAPI(dialogData.date),
            to_date: formatDateForAPI(dialogData.date),
            restrictions: editedRestrictions
        });
    };

    /**
     * utility method to form day amount param to api
     * modifiy the params's details
     * @param  {Object} params
     */
    var formDayAmountParamsForAPI = function formDayAmountParamsForAPI(params) {
        var dialogData = $scope.ngDialogData;

        if (!_.isEqual($scope.priceDetails, $scope.priceDetailsCopy)) {
            params.details.push({
                from_date: formatDateForAPI(dialogData.date),
                to_date: formatDateForAPI(dialogData.date)
            });
            var index = params.details.length - 1;

            priceKeys.map(function (key) {
                return addAmountParamForAPI(key, params.details[index]);
            });
        }
    };

    /**
     * utility method to form weekday amount param to api
     * modifiy the params's details
     * @param  {Object} params
     */
    var formWeekDaysAmountParamsForAPI = function formWeekDaysAmountParamsForAPI(params) {
        var dialogData = $scope.ngDialogData;

        if ($scope.applyPriceToDates) {
            if ($scope.untilDate === '') {
                // $scope.errorMessage = ['Please choose until date'];
                return;
            }
            params.details.push({
                from_date: formatDateForAPI(util.addOneDay(tzIndependentDate(dialogData.date))),
                to_date: formatDateForAPI($scope.untilDate)
            });
            var index = params.details.length - 1;

            priceKeys.map(function (key) {
                return addAmountParamForAPI(key, params.details[index]);
            });

            params.details[index].weekdays = {};
            $scope.weekDayRepeatSelection.filter(function (weekDay) {
                return weekDay.selected;
            }).map(function (weekDay) {
                return params.details[index].weekdays[weekDay.weekDay] = weekDay.selected;
            });
        }
    };

    /**
     * utility method to form day amount param to api
     * modifiy the params's details
     * @param  {Object} params
     */
    var addAmountParamForAPI = function addAmountParamForAPI(key, paramDetail) {
        if (util.isNumeric($scope.priceDetails[key + '_changing_value'])) {
            paramDetail[key] = {
                type: $scope.priceDetails[key + '_amount_perc_cur_symbol'] === '%' ? 'percent_diff' : 'amount_diff',
                value: parseFloat($scope.priceDetails[key + '_amount_operator'] + $scope.priceDetails[key + '_changing_value'])
            };
        } else {
            if ($scope.priceDetails[key]) {
                paramDetail[key] = {
                    type: 'amount_new',
                    value: parseFloat($scope.priceDetails[key])
                };
            }
        }
    };

    /**
     * to update restriction rate
     */
    var callRateRestrictionUpdateAPI = function callRateRestrictionUpdateAPI() {
        var params = {},
            dialogData = $scope.ngDialogData,
            mode = dialogData.mode;

        if (mode === $scope.modeConstants.RM_SINGLE_RATE_RESTRICTION_MODE) {
            params.rate_id = dialogData.rate.id;
        } else if (mode === $scope.modeConstants.RM_MULTIPLE_RATE_RESTRICTION_MODE) {
            var rate_ids = _.pluck(dialogData.rates, 'id');

            // if there is no rate_ids passed, checking for rate_type is being passed
            if (!rate_ids.length && _.has(dialogData, 'rateTypes') && dialogData.rateTypes.length) {
                params.rate_type_ids = _.pluck(dialogData.rateTypes, 'id');
            } else {
                params.rate_ids = rate_ids;
            }
        }

        params.details = [];

        if (dialogData.hierarchialRateRestrictionRequired) {
            params.hierarchialRateRestrictionRequired = true;
        }

        formDayRestrictionParamsForAPI(params);

        formRestrictionParamDetailForWeekDaysForAPI(params);

        var options = {
            params: params,
            onSuccess: onUpdateRateRestrictionData
        };

        $scope.callAPI(rvRateManagerCoreSrv.updateSingleRateRestrictionData, options);
    };

    /**
     * to update restriction rate
     */
    var callRateTypeRestrictionUpdateAPI = function callRateTypeRestrictionUpdateAPI() {
        var params = {},
            dialogData = $scope.ngDialogData,
            mode = dialogData.mode;

        if (mode === $scope.modeConstants.RM_SINGLE_RATE_TYPE_RESTRICTION_MODE) {
            params.rate_type_ids = [];
            params.rate_type_ids.push(dialogData.rateType.id);
        } else {
            params.rate_type_ids = _.pluck(dialogData.rateType, 'id');
        }

        params.details = [];

        if (dialogData.hierarchialRateTypeRestrictionRequired) {
            params.hierarchialRateTypeRestrictionRequired = true;
        }

        formDayRestrictionParamsForAPI(params);

        formRestrictionParamDetailForWeekDaysForAPI(params);

        var options = {
            params: params,
            onSuccess: onUpdateRateRestrictionData
        };

        $scope.callAPI(rvRateManagerCoreSrv.updateSingleRateRestrictionData, options);
    };

    /**
     * [description]
     * @return {[type]} [description]
     */
    var callRoomTypeRestrictionUpdateAPI = function callRoomTypeRestrictionUpdateAPI() {
        var params = {},
            dialogData = $scope.ngDialogData,
            mode = dialogData.mode;

        if (mode === $scope.modeConstants.RM_SINGLE_ROOMTYPE_RESTRICTION_MODE) {
            params.room_type_id = dialogData.roomType.id;
        }

        params.details = [];

        if (dialogData.hierarchialRoomTypeRestrictionRequired) {
            params.hierarchialRoomTypeRestrictionRequired = true;
        }

        formDayRestrictionParamsForAPI(params);

        formRestrictionParamDetailForWeekDaysForAPI(params);

        var options = {
            params: params,
            onSuccess: onUpdateRateRestrictionData
        };

        $scope.callAPI(rvRateManagerCoreSrv.updateSingleRateRestrictionData, options);
    };

    /**
     * [description]
     * @return {[type]} [description]
     */
    var callRateRoomTypeRestrictionAndAmountUpdateAPI = function callRateRoomTypeRestrictionAndAmountUpdateAPI() {
        var params = {},
            dialogData = $scope.ngDialogData,
            mode = dialogData.mode;

        params.rate_id = dialogData.rate.id;
        if (mode === $scope.modeConstants.RM_SINGLE_RATE_SINGLE_ROOMTYPE_RESTRICTION_AMOUNT_MODE) {
            params.room_type_id = dialogData.roomType.id;
        }

        params.details = [];

        formDayRestrictionParamsForAPI(params);

        formRestrictionParamDetailForWeekDaysForAPI(params);

        formDayAmountParamsForAPI(params);

        formWeekDaysAmountParamsForAPI(params);

        var options = {
            params: params,
            onSuccess: onUpdateRateRestrictionData
        };

        $scope.callAPI(rvRateManagerCoreSrv.updateSingleRateRestrictionData, options);
    };

    /**
     * on fetch rate details success (case when rate details not passed from controller/not found)
     * @param  {[type]} rateDetails [description]
     * @return {[type]}             [description]
     */
    var onFetchRateDetailsAndUpdateParentRateName = function onFetchRateDetailsAndUpdateParentRateName(rateDetails) {
        $scope.parentRateName = rateDetails.name;
    };

    /**
     * to fetch missing rate name agains rate id
     * will come into matter if we not able to find in the rate list passing from rate manager ctrl
     * @param  {Integer} rate_id
     */
    var fetchRateDetailsAndUpdateParentRateName = function fetchRateDetailsAndUpdateParentRateName(rate_id) {
        var options = {
            params: { rate_id: rate_id },
            onSuccess: onFetchRateDetailsAndUpdateParentRateName
        };

        $scope.callAPI(rvRateManagerCoreSrv.fetchRateDetails, options);
    };

    /**
     * on tapping the set button
     */
    $scope.clickedOnSetButton = function (event) {
        event.stopPropagation();
        switch ($scope.ngDialogData.mode) {
            case $scope.modeConstants.RM_SINGLE_RATE_RESTRICTION_MODE:
            case $scope.modeConstants.RM_MULTIPLE_RATE_RESTRICTION_MODE:
                return callRateRestrictionUpdateAPI();

            case $scope.modeConstants.RM_SINGLE_ROOMTYPE_RESTRICTION_MODE:
            case $scope.modeConstants.RM_MULTIPLE_ROOMTYPE_RESTRICTION_MODE:
                return callRoomTypeRestrictionUpdateAPI();

            case $scope.modeConstants.RM_SINGLE_RATE_SINGLE_ROOMTYPE_RESTRICTION_AMOUNT_MODE:
            case $scope.modeConstants.RM_SINGLE_RATE_MULTIPLE_ROOMTYPE_RESTRICTION_AMOUNT_MODE:
                return callRateRoomTypeRestrictionAndAmountUpdateAPI();

            case $scope.modeConstants.RM_SINGLE_RATE_TYPE_RESTRICTION_MODE:
            case $scope.modeConstants.RM_MULTIPLE_RATE_TYPE_RESTRICTION_MODE:
                return callRateTypeRestrictionUpdateAPI();

            default:
                break;
        }
    };

    /**
     * on tapping the switch button of restriction
     * @param  {Object} restriction
     */
    $scope.changeRestrictionStatus = function (restriction) {
        if (restriction.status === 'ON' && !restriction.hasInputField) {
            restriction.status = 'OFF';
            restriction.edited = true; // will be using while calling the api ;)
            return;
        } else if (restriction.status === 'OFF' && !restriction.hasInputField) {
            restriction.status = 'ON';
            restriction.edited = true; // will be using while calling the api ;)
            return;
        } else {
            $scope.contentMiddleMode = 'RESTRICTION_EDITING';
            // deselecting the previous ones
            deSelectAllRestriction();
            restriction.selected = true;
            $scope.restrictionForShowingTheDetails = util.deepCopy(restriction);
            return;
        }
    };

    /**
     * to get restriction displaying logic based upon the restriction listing
     * @param  {Object} restriction
     * @param  {array} turnedOnRestrictions
     * @param  {array} turnedOffRestrictions
     * @param  {array} variedRestrictions
     * @return {Object}
     */
    var getDisplayingParamsForRestriction = function getDisplayingParamsForRestriction(restriction, restrictionList) {

        var restrictionFoundInList = _.findWhere(restrictionList, { 'restriction_type_id': restriction.id });

        // returning Object - default - OFF status
        var returningRestrictionDisplayParams = {
            status: 'OFF',
            value: '',
            isDisabled: $scope.isPastDate
        };

        if (restrictionFoundInList) {
            var isRestrictionOff = restrictionFoundInList.status.toLowerCase() === 'off',
                isRestrictionOn = restrictionFoundInList.status.toLowerCase() === 'on',
                isRestrictionVaried = restrictionFoundInList.status.toLowerCase() === 'varied';

            // if the restriction on the rate (set from the admin), we will disable it
            returningRestrictionDisplayParams.isDisabled = $scope.isPastDate || restrictionFoundInList.is_on_rate;

            // forming the diff. value based on the restr. status
            // restriction status - OFF
            if (isRestrictionOff) {}
            // for now, nothing to DO


            // restriction status - ON
            else if (isRestrictionOn) {
                    returningRestrictionDisplayParams.status = 'ON';
                    returningRestrictionDisplayParams.value = Number.isInteger(restrictionFoundInList.days) ? restrictionFoundInList.days : '';
                }

                // restriction status - VARIED
                else if (isRestrictionVaried) {
                        returningRestrictionDisplayParams.status = 'VARIED';
                        returningRestrictionDisplayParams.value = RateManagerRestrictionTypes[restriction.value].hasInputField ? '??' : '';
                    }
        }
        return returningRestrictionDisplayParams;
    };

    /**
     * to get the active and class and other configrtion added restriction list
     * @return {array}
     */
    var getRestrictionListForRateView = function getRestrictionListForRateView(restrictionTypes, restrictionList) {

        var restrictions = getValidRestrictionTypes(restrictionTypes).map(function (restrictionType) {
            return _extends({}, restrictionType, RateManagerRestrictionTypes[restrictionType.value], getDisplayingParamsForRestriction(restrictionType, restrictionList), {
                edited: false
            });
        });

        // CICO-42484 Keep tab of the initial values so that update request is sent only for edited restrictions
        restrictions = restrictions.map(function (restriction) {
            restriction.oldStatus = restriction.status;
            restriction.oldValue = restriction.value;

            return restriction;
        });

        return restrictions;
    };

    /**
     * to set the date picker
     */
    var setDatePicker = function setDatePicker() {
        var dialogData = $scope.ngDialogData;

        $scope.datePickerOptions = {
            dateFormat: $rootScope.jqDateFormat,
            numberOfMonths: 1,
            minDate: tzIndependentDate(util.addOneDay(tzIndependentDate(dialogData.date))),
            maxDate: tzIndependentDate(tzIndependentDate(dialogData.date).setFullYear(tzIndependentDate(dialogData.date).getFullYear() + 1)),
            defaultDate: tzIndependentDate(util.addOneDay(tzIndependentDate(dialogData.date))),
            onSelect: function onSelect(date, datePickerObj) {
                $scope.untilDate = new tzIndependentDate(util.get_date_from_date_picker(datePickerObj));
            }
        };

        $scope.untilDate = '';
    };

    /**
     * to initialize the variabes on RM_SINGLE_RATE_RESTRICTION_MODE
     */
    var initializeSingleRateRestrictionMode = function initializeSingleRateRestrictionMode() {
        var dialogData = $scope.ngDialogData;

        $scope.header = dialogData.rate.name;

        $scope.headerBottomLeftLabel = formatDateForTopHeader(dialogData.date);

        $scope.headerBottomRightLabel = 'All Room types';

        $scope.isMultiple = dialogData.isMultiple;

        $scope.restrictionList = getRestrictionListForRateView(dialogData.restrictionTypes, dialogData.variedAndCommonRestrictions);

        $scope.roomTypeAndPrices = dialogData.roomTypesAndPrices;

        $scope.contentMiddleMode = 'ROOM_TYPE_PRICE_LISTING';
    };

    /**
     * to initialize the variabes on RM_SINGLE_RATE_RESTRICTION_MODE
     */
    var initializeSingleRateTypeRestrictionMode = function initializeSingleRateTypeRestrictionMode() {
        var dialogData = $scope.ngDialogData;

        $scope.header = dialogData.rateType.name;

        $scope.headerBottomLeftLabel = formatDateForTopHeader(dialogData.date);

        $scope.headerBottomRightLabel = 'All Rates';

        $scope.isMultiple = dialogData.isMultiple;

        $scope.restrictionList = getRestrictionListForRateView(dialogData.restrictionTypes, dialogData.variedAndCommonRestrictions);

        $scope.rateAndRestrictions = dialogData.rateAndRestrictions;

        $scope.contentMiddleMode = 'RATE_PRICE_LISTING';
    };

    var initializeMultipleRateTypeRestrictionMode = function initializeMultipleRateTypeRestrictionMode() {
        var dialogData = $scope.ngDialogData;

        $scope.header = "All Rate Types";

        $scope.headerBottomLeftLabel = formatDateForTopHeader(dialogData.date);

        $scope.headerBottomRightLabel = 'All Rates';

        $scope.isMultiple = dialogData.isMultiple;

        $scope.restrictionList = getRestrictionListForRateView(dialogData.restrictionTypes, dialogData.variedAndCommonRestrictions);

        $scope.rateAndRestrictions = dialogData.rateAndRestrictions;

        $scope.contentMiddleMode = 'RATE_PRICE_LISTING';
    };

    /**
     * to initialize the multiple rate restriction mode
     */
    var initializeMultipleRateRestrictionMode = function initializeMultipleRateRestrictionMode() {
        var dialogData = $scope.ngDialogData;

        $scope.headerBottomLeftLabel = 'All Rates';

        $scope.header = formatDateForTopHeader(tzIndependentDate(dialogData.date));

        $scope.headerBottomRightLabel = '';

        $scope.isMultiple = dialogData.isMultiple;

        $scope.restrictionList = getRestrictionListForRateView(dialogData.restrictionTypes, dialogData.variedAndCommonRestrictions);

        if (_.findWhere($scope.restrictionList, { status: 'VARIED' })) {
            $scope.headerNoticeOnRight = 'Restrictions vary across Rates!';
        }

        $scope.contentMiddleMode = 'MULTIPLE_RATE_CHOOSE_RATE';
    };

    /**
     * to initialize the variabes on RM_SINGLE_ROOMTYPE_RESTRICTION_MODE
     */
    var initializeSingleRoomTypeRestrictionMode = function initializeSingleRoomTypeRestrictionMode() {
        var dialogData = $scope.ngDialogData;

        $scope.header = dialogData.roomType.name;

        $scope.headerBottomLeftLabel = formatDateForTopHeader(dialogData.date);

        $scope.headerBottomRightLabel = '';

        $scope.isMultiple = dialogData.isMultiple;

        $scope.restrictionList = getRestrictionListForRateView(dialogData.restrictionTypes, dialogData.variedAndCommonRestrictions);

        $scope.roomTypeAndPrices = dialogData.roomTypesAndPrices;

        $scope.contentMiddleMode = 'SINGLE_ROOM_TYPE_CHOOSE_RATE';
    };

    /**
     * to initialize the multiple room type restriction mode
     */
    var initializeMultipleRoomTypeRestrictionMode = function initializeMultipleRoomTypeRestrictionMode() {
        var dialogData = $scope.ngDialogData;

        $scope.header = formatDateForTopHeader(dialogData.date);

        $scope.headerBottomLeftLabel = 'All Room types';

        $scope.headerBottomRightLabel = 'All Rates';

        $scope.isMultiple = dialogData.isMultiple;

        $scope.restrictionList = getRestrictionListForRateView(dialogData.restrictionTypes, dialogData.variedAndCommonRestrictions);

        if (_.findWhere($scope.restrictionList, { status: 'VARIED' })) {
            $scope.headerNoticeOnRight = 'Restrictions vary across Room Types!';
        }

        $scope.contentMiddleMode = 'MULTIPLE_ROOM_TYPE_CHOOSE_RATE';
    };

    var initializeSingleRateRestrictionAndAmountMiddlePane = function initializeSingleRateRestrictionAndAmountMiddlePane() {
        var dialogData = $scope.ngDialogData,
            roomTypePricesAndRestrictions = dialogData.roomTypePricesAndRestrictions;

        if (dialogData.rate.is_hourly) {
            $scope.contentMiddleMode = 'SINGLE_RATE_SINGLE_ROOM_TYPE_HOURLY_AMOUNT_EDIT';
            $scope.priceDetails = _extends({}, roomTypePricesAndRestrictions.room_types[0]);

            // some defult values used in templates
            setDefaultPriceAdjustValues('single', $scope.priceDetails);

            $scope.priceDetailsCopy = _extends({}, $scope.priceDetails);
        } else {
            $scope.contentMiddleMode = 'SINGLE_RATE_SINGLE_ROOM_TYPE_NIGHTLY_AMOUNT_EDIT';
            $scope.priceDetails = _extends({}, roomTypePricesAndRestrictions.room_types[0]);

            priceKeys.map(function (priceKey) {
                return setDefaultPriceAdjustValues(priceKey, $scope.priceDetails);
            });

            $scope.priceDetailsCopy = _extends({}, $scope.priceDetails);
        }

        if (dialogData.rate.based_on_rate_id && !dialogData.rate.is_copied) {
            $scope.contentMiddleMode = 'SINGLE_RATE_ROOM_TYPE_CHILD_RATE';

            var parentRate = _.findWhere(dialogData.rates, { id: dialogData.rate.based_on_rate_id });

            if (parentRate) {
                $scope.parentRateName = parentRate.name;
            } else {
                fetchRateDetailsAndUpdateParentRateName(dialogData.rate.based_on_rate_id);
            }
        }
    };

    /**
     * [description]
     * @return {[type]} [description]
     */
    var initializeSingleRateSingleRoomTypeRestrictionAndAmountMode = function initializeSingleRateSingleRoomTypeRestrictionAndAmountMode() {
        var dialogData = $scope.ngDialogData;

        $scope.header = dialogData.roomType.name;

        $scope.headerBottomLeftLabel = formatDateForTopHeader(dialogData.date);

        $scope.headerBottomRightLabel = dialogData.rate.name;

        $scope.isMultiple = dialogData.isMultiple;

        $scope.restrictionList = getRestrictionListForRateView(dialogData.restrictionTypes, dialogData.variedAndCommonRestrictions);

        if (_.findWhere($scope.restrictionList, { status: 'VARIED' })) {
            $scope.headerNoticeOnRight = 'Restrictions vary across Room Types!';
        }

        initializeSingleRateRestrictionAndAmountMiddlePane();

        // if overriden, we need to notify in header (if it is not a child rate)
        if (!dialogData.rate.based_on_rate_id) {
            var headerToAdd = '';

            priceOverridingKeys.map(function (key) {
                if ($scope.priceDetails[key]) {
                    headerToAdd = 'Rate Amounts marked with * are edited!';
                }
            });

            if (headerToAdd !== '') {
                $scope.headerNoticeOnRight = !$scope.headerNoticeOnRight ? headerToAdd : $scope.headerNoticeOnRight + ', ' + headerToAdd;
            }
        }
    };

    /**
     * utility method to set the default
     * @param  {string} key
     * @param  {Object} priceDetails
     * will modify the price details passing
     */
    var setDefaultPriceAdjustValues = function setDefaultPriceAdjustValues(key, priceDetails) {
        // check the templates pls, you will get there, these are the model &it's values used in templates
        priceDetails[key + '_amount_operator'] = '+';
        priceDetails[key + '_amount_perc_cur_symbol'] = $rootScope.currencySymbol;
        priceDetails[key + '_changing_value'] = '';
    };

    /**
     * to initialize the MIDDLE panel of single rate's expandable view's multiple room type
     */
    var initializeSingleRateMultipleRoomTypeRestrictionAndAmountMiddlePane = function initializeSingleRateMultipleRoomTypeRestrictionAndAmountMiddlePane() {
        var dialogData = $scope.ngDialogData,
            roomTypePricesAndRestrictions = dialogData.roomTypePricesAndRestrictions;

        if (dialogData.rate.is_hourly) {
            $scope.contentMiddleMode = 'SINGLE_RATE_MULTIPLE_ROOM_TYPE_HOURLY_AMOUNT_EDIT';

            $scope.priceDetails = _extends({}, roomTypePricesAndRestrictions.room_types[0]);

            // some defult values used in templates
            setDefaultPriceAdjustValues('single', $scope.priceDetails);

            $scope.priceDetailsCopy = _extends({}, $scope.priceDetails);
        } else {
            $scope.contentMiddleMode = 'SINGLE_RATE_MULTIPLE_ROOM_TYPE_NIGHTLY_AMOUNT_EDIT';
            $scope.priceDetails = {};

            // forming the default model key value pairs used in templates
            priceKeys.map(function (priceKey) {
                return setDefaultPriceAdjustValues(priceKey, $scope.priceDetails);
            });

            $scope.priceDetailsCopy = _extends({}, $scope.priceDetails);
        }

        if (dialogData.rate.based_on_rate_id && !dialogData.rate.is_copied) {
            $scope.contentMiddleMode = 'SINGLE_RATE_ROOM_TYPE_CHILD_RATE';
            var parentRate = _.findWhere(dialogData.rates, { id: dialogData.rate.based_on_rate_id });

            if (parentRate) {
                $scope.parentRateName = parentRate.name;
            } else {
                fetchRateDetailsAndUpdateParentRateName(dialogData.rate.based_on_rate_id);
            }
        }
    };

    /**
     * AMOUNT & RESTRICTION SHOWING GRID - top header
     * ie., single rate's expandable view's top header
     * when clicked on top row of the grid (all room types)
     * this function used to initialize the popup on that mode
     */
    var initializeSingleRateMultipleRoomTypeRestrictionAndAmountMode = function initializeSingleRateMultipleRoomTypeRestrictionAndAmountMode() {
        var dialogData = $scope.ngDialogData;

        $scope.header = formatDateForTopHeader(dialogData.date);

        $scope.headerBottomLeftLabel = 'All room types';

        $scope.headerBottomRightLabel = dialogData.rate.name;

        $scope.isMultiple = dialogData.isMultiple;

        $scope.restrictionList = getRestrictionListForRateView(dialogData.restrictionTypes, dialogData.variedAndCommonRestrictions);

        if (_.findWhere($scope.restrictionList, { status: 'VARIED' })) {
            $scope.headerNoticeOnRight = 'Restrictions vary across Room Types!';
        }

        initializeSingleRateMultipleRoomTypeRestrictionAndAmountMiddlePane();
    };

    /**
     * to initialize Mode based values
     */
    var initializeModeBasedValues = function initializeModeBasedValues() {
        switch ($scope.ngDialogData.mode) {
            // when we click a restriciton cell on rate view mode
            case $scope.modeConstants.RM_SINGLE_RATE_RESTRICTION_MODE:
                initializeSingleRateRestrictionMode();
                break;

            // when we click a header restriciton cell on rate view mode
            case $scope.modeConstants.RM_MULTIPLE_RATE_RESTRICTION_MODE:
                initializeMultipleRateRestrictionMode();
                break;

            case $scope.modeConstants.RM_SINGLE_RATE_TYPE_RESTRICTION_MODE:
                initializeSingleRateTypeRestrictionMode();
                break;

            case $scope.modeConstants.RM_MULTIPLE_RATE_TYPE_RESTRICTION_MODE:
                initializeMultipleRateTypeRestrictionMode();
                break;

            // when we click a restriciton cell on room type view mode
            case $scope.modeConstants.RM_SINGLE_ROOMTYPE_RESTRICTION_MODE:
                initializeSingleRoomTypeRestrictionMode();
                break;

            case $scope.modeConstants.RM_MULTIPLE_ROOMTYPE_RESTRICTION_MODE:
                initializeMultipleRoomTypeRestrictionMode();
                break;

            case $scope.modeConstants.RM_SINGLE_RATE_SINGLE_ROOMTYPE_RESTRICTION_AMOUNT_MODE:
                initializeSingleRateSingleRoomTypeRestrictionAndAmountMode();
                break;

            case $scope.modeConstants.RM_SINGLE_RATE_MULTIPLE_ROOMTYPE_RESTRICTION_AMOUNT_MODE:
                if ($scope.ngDialogData.isHierarchyRestrictionEnabled) {
                    initializeMultipleRateRestrictionMode();
                } else {
                    initializeSingleRateMultipleRoomTypeRestrictionAndAmountMode();
                }
                break;

                dafault: break;
        }
    };

    /**
     * to initialize the data model
     */
    var initializeDataModels = function initializeDataModels() {

        $scope.isPastDate = new tzIndependentDate($scope.ngDialogData.date) < new tzIndependentDate($rootScope.businessDate);

        $scope.header = '';

        $scope.headerBottomLeftLabel = '';

        $scope.headerBottomRightLabel = '';

        $scope.headerNoticeOnRight = '';

        $scope.roomTypeAndPrices = [];

        $scope.restrictionList = [];

        $scope.contentMiddleMode = ''; // values possible: 'ROOM_TYPE_PRICE_LISTING', 'RESTRICTION_EDITING'

        $scope.modeConstants = rvRateManagerPopUpConstants;

        $scope.applyRestrictionsToDates = false;

        $scope.applyPriceToDates = false;

        $scope.weekDayRepeatSelection = weekDays.map(function (weekDay) {
            return {
                weekDay: weekDay,
                selected: false
            };
        });
    };

    /**
     * initialization stuffs
     */
    (function () {
        // variables
        initializeDataModels();

        // mode base setup values
        initializeModeBasedValues();

        // setting the scroller
        setScroller();

        // datepicker
        setDatePicker();
    })();
}]);