'use strict';

angular.module('sntRover').controller('RVExportReportsCtrl', ['$rootScope', '$scope', 'RVreportsSrv', 'RVReportUtilsFac', 'RVReportParamsConst', '$filter', '$timeout', 'ngDialog', function ($rootScope, $scope, reportsSrv, reportUtils, reportParams, $filter, $timeout, ngDialog) {
    var scheduleTimePeriods = [];

    var REPORT_SCHEDULES_SCROLL = 'REPORT_SCHEDULES_SCROLL';
    var SECOND_COLUMN_SCROLL = 'SECOND_COLUMN_SCROLL';
    var THIRD_COLUMN_SCROLL = 'THIRD_COLUMN_SCROLL';
    var FOURTH_COLUMN_SCROLL = 'FOURTH_COLUMN_SCROLL';
    var SHOW_ERROR_MSG_EVENT = 'SHOW_ERROR_MSG_EVENT';

    var runDuringEodScheduleFrequencyId;

    var setupScrolls = function setupScrolls() {
        var scrollerOptions = {
            tap: true,
            preventDefault: false
        };

        $scope.setScroller(REPORT_SCHEDULES_SCROLL, scrollerOptions);
        $scope.setScroller(SECOND_COLUMN_SCROLL, scrollerOptions);
        $scope.setScroller(THIRD_COLUMN_SCROLL, scrollerOptions);
        $scope.setScroller(FOURTH_COLUMN_SCROLL, scrollerOptions);
    };
    var refreshScroll = function refreshScroll(name, reset) {
        var DELAY = 100;

        $scope.refreshScroller(name);
        /**/
        if (!!reset && $scope.myScroll.hasOwnProperty(name)) {
            $scope.myScroll[name].scrollTo(0, 0, DELAY);
        }
    };

    // helper function
    var findOccurance = function findOccurance(item) {
        var occurance = 'Runs ',
            frequency = _.find($scope.originalScheduleFrequency, { id: item.frequency_id }),
            description = '',
            value = '';

        var FREQ_VALUES = {
            DAILY: 'DAILY',
            HOURLY: 'HOURLY',
            WEEKLY: 'WEEKLY',
            MONTHLY: 'MONTHLY',
            RUN_ONCE: 'RUN_ONCE'
        };

        if (frequency) {
            description = frequency.description;
            value = frequency.value;
        }

        if (value === FREQ_VALUES.RUN_ONCE) {
            occurance += 'once';
        } else {
            if (item.repeats_every === 0 || !item.repeats_every) {
                occurance += description.toLowerCase();
            } else {
                occurance += 'after every ' + item.repeats_every + ' ';

                if (value === FREQ_VALUES.DAILY) {
                    occurance += item.repeats_every === 1 ? 'day' : 'days';
                } else if (value === FREQ_VALUES.HOURLY) {
                    occurance += item.repeats_every === 1 ? 'hour' : 'hours';
                } else if (value === FREQ_VALUES.WEEKLY) {
                    occurance += item.repeats_every === 1 ? 'week' : 'weeks';
                } else if (value === FREQ_VALUES.MONTHLY) {
                    occurance += item.repeats_every === 1 ? 'month' : 'months';
                } else if (value === FREQ_VALUES.MONTHLY) {
                    occurance += item.repeats_every === 1 ? 'month' : 'months';
                }
            }
        }

        if (item.time) {
            occurance += ' at ' + item.time + '. ';
        } else {
            occurance += '. ';
        }

        if (item.starts_on) {
            occurance += 'Started on ' + $filter('date')(item.starts_on, $rootScope.dateFormat) + '. ';
        }

        if (value !== FREQ_VALUES.RUN_ONCE) {
            if (item.ends_on_after) {
                occurance += 'Ends after ' + item.ends_on_after + ' times.';
            } else if (item.ends_on_date) {
                occurance += 'Ends on ' + $filter('date')(item.ends_on_date, $rootScope.dateFormat) + '.';
            } else {
                occurance += 'Runs forever.';
            }
        }

        return occurance;
    };

    var validateSchedule = function validateSchedule() {
        var hasTimePeriod = function hasTimePeriod() {
            return angular.isDefined($scope.scheduleParams.time_period_id) && !_.isNull($scope.scheduleParams.time_period_id);
        };

        var hasFrequency = function hasFrequency() {
            return !!$scope.scheduleParams.frequency_id;
        };

        var hasValidDistribution = function hasValidDistribution() {
            var hasEmail = $scope.checkDeliveryType('EMAIL') && $scope.emailList.length,
                hasFTP = $scope.checkDeliveryType('SFTP') && !!$scope.scheduleParams.selectedFtpRecipient,
                hasDropbox = $scope.checkDeliveryType('DROPBOX') && !!$scope.scheduleParams.selectedCloudAccount,
                hasGoogleDrive = $scope.checkDeliveryType('GOOGLE DRIVE') && !!$scope.scheduleParams.selectedCloudAccount;

            return hasEmail || hasFTP || hasDropbox || hasGoogleDrive;
        };

        var isExtraChecksValid = function isExtraChecksValid() {
            var valid = true;

            valid = $scope.isAdNotumExport ? !!$scope.scheduleParams.rate_code : true;

            return valid;
        };

        return hasTimePeriod() && hasFrequency() && hasValidDistribution() && isExtraChecksValid();
    };

    var fillValidationErrors = function fillValidationErrors() {
        $scope.createErrors = [];

        if (!$scope.isGuestBalanceReport && !$scope.scheduleParams.time_period_id) {
            $scope.createErrors.push('Time period in parameters');
        }
        if (!$scope.scheduleParams.frequency_id) {
            $scope.createErrors.push('Repeat frequency in details');
        }

        if (!$scope.emailList.length && !$scope.scheduleParams.selectedFtpRecipient && !$scope.scheduleParams.selectedCloudAccount) {
            $scope.createErrors.push('Emails/SFTP/Dropbox/Google Drive in distribution list');
        }

        if ($scope.isAdNotumExport && !$scope.scheduleParams.rate_code) {
            $scope.createErrors.push('No Rate Code Selected');
        }
    };

    /**
     * Navigate to the schedulable report list
     */
    $scope.navigateToSchedulableReportList = function () {
        ngDialog.close();
        if (!!$scope.selectedReport && $scope.selectedReport.active) {
            $scope.selectedReport.active = false;
        }
        $scope.updateViewCol($scope.viewColsActions.ONE);
        $scope.addingStage = STAGES.SHOW_SCHEDULE_LIST;

        fetchReqDatas();
    };

    var getFileFormatId = function getFileFormatId() {
        var formatId = 1;

        if ($scope.selectedEntityDetails.report.title === 'Police Report Export' || $scope.selectedEntityDetails.report.title === 'HESTA Switzerland') {
            formatId = 3;
        } else if ($scope.selectedEntityDetails.report.title === 'Spain Barcelona Police Export' || $scope.selectedEntityDetails.report.title === 'Monthly Nationality Statistics') {
            formatId = 4;
        }
        return formatId;
    };

    var createSchedule = function createSchedule() {
        var params = {
            report_id: $scope.selectedEntityDetails.id,
            hotel_id: $rootScope.hotelDetails.userHotelsData.current_hotel_id,
            /**/
            format_id: getFileFormatId(),
            delivery_type_id: ''
        };

        var success = function success(data) {
            $scope.errorMessage = '';
            $scope.$emit('hideLoader');
            if (data.is_export_already_exist) {
                ngDialog.open({
                    template: '/assets/partials/reports/rvDuplicateScheduleWarningPopup.html',
                    scope: $scope,
                    closeByEscape: false,
                    data: {
                        isUpdate: false
                    }
                });
            } else {
                $scope.navigateToSchedulableReportList();
            }
        };

        var failed = function failed(errors) {
            $scope.errorMessage = errors;
            $scope.$emit(SHOW_ERROR_MSG_EVENT, errors);
            $scope.$emit('hideLoader');
        };

        var filter_values = {};

        var runOnceId = _.find($scope.originalScheduleFrequency, { value: 'RUN_ONCE' }).id;

        // fill 'time' and 'time_period_id'
        if ($scope.scheduleParams.time) {
            params.time = $scope.scheduleParams.time;
        }
        if ($scope.scheduleParams.time_period_id) {
            params.time_period_id = $scope.scheduleParams.time_period_id;
        }
        if ($scope.scheduleParams.from_date) {
            params.from_date = $filter('date')($scope.scheduleParams.from_date, $rootScope.dateFormatForAPI);
        }
        if ($scope.scheduleParams.to_date) {
            params.to_date = $filter('date')($scope.scheduleParams.to_date, $rootScope.dateFormatForAPI);
        }

        // fill 'frequency_id', 'starts_on', 'repeats_every' and 'ends_on_date'
        params.frequency_id = $scope.scheduleParams.frequency_id;
        /**/
        if ($scope.scheduleParams.starts_on) {
            params.starts_on = $filter('date')($scope.scheduleParams.starts_on, 'yyyy/MM/dd');
        }

        if ($scope.scheduleParams.frequency_id === runOnceId || $scope.scheduleParams.frequency_id === runDuringEodScheduleFrequencyId) {
            params.repeats_every = null;
        } else if ($scope.scheduleParams.repeats_every) {
            params.repeats_every = $scope.scheduleParams.repeats_every;
        } else {
            params.repeats_every = 0;
        }

        if ($scope.scheduleParams.frequency_id === runOnceId) {
            params.ends_on_after = null;
            params.ends_on_date = null;
        } else if ($scope.scheduleParams.scheduleEndsOn === 'NUMBER') {
            params.ends_on_after = $scope.scheduleParams.ends_on_after;
            params.ends_on_date = null;
        } else if ($scope.scheduleParams.scheduleEndsOn === 'DATE') {
            params.ends_on_date = $filter('date')($scope.scheduleParams.ends_on_date, 'yyyy/MM/dd');
            params.ends_on_after = null;
        } else {
            params.ends_on_after = null;
            params.ends_on_date = null;
        }

        var deliveryType = _.find($scope.scheduleDeliveryTypes, {
            value: $scope.scheduleParams.delivery_id
        });

        if (deliveryType) {
            params.delivery_type_id = parseInt(deliveryType.id);
        }

        if ($scope.scheduleParams.format_id) {
            params.format_id = $scope.scheduleParams.format_id;
        }

        // fill emails/FTP
        if ($scope.checkDeliveryType('EMAIL') && $scope.emailList.length) {
            params.emails = $scope.emailList.join(', ');
        } else if ($scope.checkDeliveryType('SFTP') && !!$scope.scheduleParams.selectedFtpRecipient) {
            params.sftp_server_id = $scope.scheduleParams.selectedFtpRecipient;
        } else if (($scope.checkDeliveryType('GOOGLE DRIVE') || $scope.checkDeliveryType('DROPBOX')) && !!$scope.scheduleParams.selectedCloudAccount) {
            params.cloud_drive_id = $scope.scheduleParams.selectedCloudAccount;
        } else {
            params.emails = '';
            params.sftp_server_id = '';
        }

        // fill sort_field and filters
        if ($scope.scheduleParams.sort_field) {
            filter_values.sort_field = $scope.scheduleParams.sort_field;
        }
        _.each($scope.filters, function (filter, keyName) {
            if (keyName === 'hasRateCode') {
                filter_values[reportParams['RATE_ID']] = $scope.scheduleParams.rate_code;
            }
        });
        params.filter_values = filter_values;

        if ($scope.scheduleParams.includeTitleHeader) {
            params.include_title_header = $scope.scheduleParams.includeTitleHeader;
        }

        $scope.invokeApi(reportsSrv.createSchedule, params, success, failed);
    };

    // Navigates to schedule list
    $scope.navigateToSchedulesList = function (params) {
        ngDialog.close();
        var updatedIndex = _.findIndex($scope.$parent.$parent.schedulesList, { id: params.id });

        if (!!$scope.selectedSchedule && $scope.selectedSchedule.active) {
            $scope.selectedSchedule.active = false;
        }
        $scope.updateViewCol($scope.viewColsActions.ONE);

        if (updatedIndex >= 0) {
            $scope.$parent.$parent.schedulesList[updatedIndex].frequency_id = params.frequency_id;
            $scope.$parent.$parent.schedulesList[updatedIndex].repeats_every = params.repeats_every;
            $scope.$parent.$parent.schedulesList[updatedIndex].time = params.time;
            $scope.$parent.$parent.schedulesList[updatedIndex].starts_on = params.starts_on;
            $scope.$parent.$parent.schedulesList[updatedIndex].ends_on_after = params.ends_on_after;
            $scope.$parent.$parent.schedulesList[updatedIndex].ends_on_date = params.ends_on_date;

            $scope.$parent.$parent.schedulesList[updatedIndex].occurance = findOccurance($scope.$parent.$parent.schedulesList[updatedIndex]);
        }
        $scope.addingStage = STAGES.SHOW_SCHEDULE_LIST;
    };

    var saveSchedule = function saveSchedule() {

        var params = {
            id: $scope.selectedEntityDetails.id,
            report_id: $scope.selectedEntityDetails.report.id,
            hotel_id: $rootScope.hotelDetails.userHotelsData.current_hotel_id,
            /**/
            format_id: getFileFormatId(),
            delivery_type_id: ''
        };

        var success = function success(data) {
            $scope.errorMessage = '';
            $scope.$emit('hideLoader');
            if (data.is_export_already_exist) {
                ngDialog.open({
                    template: '/assets/partials/reports/rvDuplicateScheduleWarningPopup.html',
                    scope: $scope,
                    closeByEscape: false,
                    data: {
                        isUpdate: true,
                        params: params
                    }
                });
            } else {
                $scope.navigateToSchedulesList(params);
            }
        };

        var failed = function failed(errors) {
            $scope.errorMessage = errors;
            $scope.$emit(SHOW_ERROR_MSG_EVENT, errors);
            $scope.$emit('hideLoader');
        };

        var filter_values = {};

        var runOnceId = _.find($scope.originalScheduleFrequency, { value: 'RUN_ONCE' }).id;

        // fill 'time' and 'time_period_id'
        if ($scope.scheduleParams.time) {
            params.time = $scope.scheduleParams.time;
        }
        if ($scope.scheduleParams.time_period_id) {
            params.time_period_id = $scope.scheduleParams.time_period_id;
        }
        if ($scope.scheduleParams.from_date) {
            params.from_date = $filter('date')($scope.scheduleParams.from_date, 'yyyy/MM/dd');
        }

        if ($scope.scheduleParams.to_date) {
            params.to_date = $filter('date')($scope.scheduleParams.to_date, 'yyyy/MM/dd');
        }

        // fill 'frequency_id', 'starts_on', 'repeats_every' and 'ends_on_date'
        params.frequency_id = $scope.scheduleParams.frequency_id;
        /**/
        if ($scope.scheduleParams.starts_on) {
            params.starts_on = $filter('date')($scope.scheduleParams.starts_on, 'yyyy/MM/dd');
        }

        if ($scope.scheduleParams.frequency_id === runOnceId || $scope.scheduleParams.frequency_id === runDuringEodScheduleFrequencyId) {
            params.repeats_every = null;
        } else if ($scope.scheduleParams.repeats_every) {
            params.repeats_every = $scope.scheduleParams.repeats_every;
        } else {
            params.repeats_every = 0;
        }

        if ($scope.scheduleParams.frequency_id === runOnceId) {
            params.ends_on_after = null;
            params.ends_on_date = null;
        } else if ($scope.scheduleParams.scheduleEndsOn === 'NUMBER') {
            params.ends_on_after = $scope.scheduleParams.ends_on_after;
            params.ends_on_date = null;
        } else if ($scope.scheduleParams.scheduleEndsOn === 'DATE') {
            params.ends_on_date = $filter('date')($scope.scheduleParams.ends_on_date, 'yyyy/MM/dd');
            params.ends_on_after = null;
        } else {
            params.ends_on_after = null;
            params.ends_on_date = null;
        }

        var deliveryType = _.find($scope.scheduleDeliveryTypes, {
            value: $scope.scheduleParams.delivery_id
        });

        if (deliveryType) {
            params.delivery_type_id = parseInt(deliveryType.id);
        }

        if ($scope.scheduleParams.format_id) {
            params.format_id = $scope.scheduleParams.format_id;
        }

        // fill emails/FTP
        if ($scope.checkDeliveryType('EMAIL') && $scope.emailList.length) {
            params.emails = $scope.emailList.join(', ');
        } else if ($scope.checkDeliveryType('SFTP') && !!$scope.scheduleParams.selectedFtpRecipient) {
            params.sftp_server_id = $scope.scheduleParams.selectedFtpRecipient;
        } else if (($scope.checkDeliveryType('GOOGLE DRIVE') || $scope.checkDeliveryType('DROPBOX')) && !!$scope.scheduleParams.selectedCloudAccount) {
            params.cloud_drive_id = $scope.scheduleParams.selectedCloudAccount;
        } else {
            params.emails = '';
            params.sftp_server_id = '';
        }

        // fill sort_field and filters
        if ($scope.scheduleParams.sort_field) {
            filter_values.sort_field = $scope.scheduleParams.sort_field;
        }
        _.each($scope.filters, function (filter, keyName) {
            if (keyName === 'hasRateCode') {
                filter_values[reportParams['RATE_ID']] = $scope.scheduleParams.rate_code;
            }
        });
        params.filter_values = filter_values;

        if ($scope.scheduleParams.includeTitleHeader) {
            params.include_title_header = $scope.scheduleParams.includeTitleHeader;
        }

        $scope.invokeApi(reportsSrv.updateSchedule, params, success, failed);
    };

    var matchGeneralOptions = {
        DUE_IN_ARRIVALS: 'DUE_IN_ARRIVALS',
        DUE_OUT_DEPARTURES: 'DUE_OUT_DEPARTURES',
        INCLUDE_CANCELED: 'INCLUDE_CANCELED',
        INCLUDE_NO_SHOW: 'INCLUDE_NO_SHOW',
        INCLUDE_GUEST_NOTES: 'INCLUDE_GUEST_NOTES',
        INCLUDE_RESERVATION_NOTES: 'INCLUDE_RESERVATION_NOTES',
        INCLUDE_ACTIONS: 'INCLUDE_ACTIONS',
        SHOW_GUESTS: 'SHOW_GUESTS',
        VIP_ONLY: 'VIP_ONLY',
        HAS_VEHICLE_REG_NO: 'HAS_VEHICLE_REG_NO',
        SHOW_PHONE_NUMBER: 'SHOW_PHONE_NUMBER',
        // this filter for few reports could also be listed
        // under SHOW and not OPTIONS
        INCLUDE_DUE_OUT: 'INCLUDE_DUE_OUT',
        RESTRICTED_POST_ONLY: 'RESTRICTED_POST_ONLY',
        INCLUDE_TAX: 'INCLUDE_TAX'
    };

    var matchSortFields = {
        DATE: 'DATE',
        NAME: 'NAME',
        ROOM: 'ROOM',
        BALANCE: 'BALANCE',
        ROOM_NO: 'ROOM_NO',
        CONFIRMATION_NUMBER: 'CONFIRMATION_NUMBER',
        CHECKOUT_DATE: 'CHECKOUT_DATE',
        TRAVEL_AGENT: 'TRAVEL_AGENT',
        LAST_NAME: 'LAST_NAME',
        RESERVATION_STATUS: 'RESERVATION_STATUS'
    };

    var reportIconCls = {
        'Arriving Guests': 'guest-status check-in',
        'Departing Guests': 'guest-status check-out',
        'All In-House Guests': 'guest-status inhouse',
        'Balance for all Outstanding Accounts': 'icon-report icon-balance',
        'Statistics Report by Comparison': 'icon-report icon-comparison'
    };

    // this is a temporary setup
    // may have to share logic with
    // rvReportUtilsFac.js in future
    var setupFilters = function setupFilters() {
        $scope.filters = {};

        $scope.filters.hasGeneralOptions = {
            data: [],
            options: {
                selectAll: false,
                hasSearch: false,
                key: 'description'
            }
        };
        if (angular.isUndefined($scope.selectedEntityDetails.filters) || $scope.selectedEntityDetails.filters === null) {
            $scope.selectedEntityDetails.filters = [];
        }
        if ($scope.isAdNotumExport) {
            var rateFilter = {
                description: 'RATE_CODE',
                value: 'RATE_CODE'
            };
            if (!_.find($scope.selectedEntityDetails.filters, rateFilter)) {
                $scope.selectedEntityDetails.filters.push(rateFilter);
            }
        }
        _.each($scope.selectedEntityDetails.filters, function (filter) {
            var selected = false,
                mustSend = false,
                filteredTimePeriods;

            if (filter.value === 'ACCOUNT' || filter.value === 'GUEST') {
                selected = true;
                $scope.filters.hasGeneralOptions.data.push({
                    paramKey: filter.value.toLowerCase(),
                    description: filter.description,
                    selected: selected,
                    mustSend: mustSend
                });
            }

            selected = false;
            if (matchGeneralOptions[filter.value]) {
                if ($scope.selectedEntityDetails.report.description === 'Arriving Guests' && filter.value === 'DUE_IN_ARRIVALS') {
                    selected = true;
                }

                if ($scope.selectedEntityDetails.report.description === 'Departing Guests' && filter.value === 'DUE_OUT_DEPARTURES') {
                    selected = true;
                }

                if ($scope.selectedEntityDetails.report.description === 'All In-House Guests' && filter.value === 'INCLUDE_DUE_OUT') {
                    selected = true;
                }

                if ($scope.selectedEntityDetails.report.description === 'Restricted Post only' && filter.value === 'RESTRICTED_POST_ONLY') {
                    selected = false;
                }

                if ($scope.selectedEntityDetails.report.description === 'Statistics Report by Comparison') {
                    filteredTimePeriods = _.filter(scheduleTimePeriods, function (item) {
                        return item.value === 'YESTERDAY';
                    });

                    $scope.scheduleTimePeriods = filteredTimePeriods;
                } else {
                    filteredTimePeriods = _.filter(scheduleTimePeriods, function (item) {
                        return item.value !== 'YESTERDAY';
                    });

                    $scope.scheduleTimePeriods = filteredTimePeriods;
                }

                $scope.filters.hasGeneralOptions.data.push({
                    paramKey: filter.value.toLowerCase(),
                    description: filter.description,
                    selected: selected,
                    mustSend: mustSend
                });

                if ($scope.selectedEntityDetails.report.description === 'Arriving Guests' || $scope.selectedEntityDetails.report.description === 'Departing Guests') {
                    $scope.filters.hasGeneralOptions.options.noSelectAll = true;
                }
            } else if (filter.value === 'RATE_CODE') {
                reportUtils.fillRateCodes($scope.filters, $scope.selectedEntityDetails.filter_values, $scope.scheduleParams);
            }
        });

        runDigestCycle();
    };

    var applySavedFilters = function applySavedFilters() {
        _.each($scope.selectedEntityDetails.filter_values, function (value, key) {
            var optionFilter, upperCaseKey;

            upperCaseKey = key.toUpperCase();
            if (matchGeneralOptions[upperCaseKey] && !!value) {
                optionFilter = _.find($scope.filters.hasGeneralOptions.data, { paramKey: key });
                if (angular.isDefined(optionFilter)) {
                    optionFilter.selected = true;
                }
            }

            if (matchSortFields[value]) {
                $scope.scheduleParams.sort_field = value;
            }
        });

        runDigestCycle();
    };

    var filterScheduleFrequency = function filterScheduleFrequency(item) {
        var dailyOnly = _.find($scope.originalScheduleFrequency, { value: 'DAILY' });
        var runOnceOnly = _.find($scope.originalScheduleFrequency, { value: 'RUN_ONCE' });

        var dailyTypeOnly = _.find($scope.originalScheduleFreqType, { originalValue: 'DAILY' }),
            weeklyTypeOnly = _.find($scope.originalScheduleFreqType, { originalValue: 'WEEKLY' }),
            monthlyTypeOnly = _.find($scope.originalScheduleFreqType, { originalValue: 'MONTHLY' }),
            hourlyTypeOnly = _.find($scope.originalScheduleFreqType, { originalValue: 'HOURLY' });

        var weeklyOnly = _.find($scope.originalScheduleFrequency, { value: 'WEEKLY' }),
            monthlyOnly = _.find($scope.originalScheduleFrequency, { value: 'MONTHLY' }),
            hourlyOnly = _.find($scope.originalScheduleFrequency, { value: 'HOURLY' }),
            runDuringEod = _.find($scope.originalScheduleFrequency, { value: 'RUN_DURING_EOD' });

        $scope.scheduleFrequency = [];
        $scope.scheduleFreqType = [];

        var forDaily = {
            'Financial Transactions': true,
            'Stash Rewards Membership Export': true,
            'Reservations': true,
            'Rooms': true,
            'Future Reservations': true,
            'Journal Export': true,
            'Clairvoyix Stays Export': true,
            'Clairvoyix Reservations Export': true,
            'Synxis - Reservations': true,
            'Synxis - Upcoming Reservation Export (Future Reservation Export)': true,
            'Police Report Export': true,
            'Switzerland Zurich Police Export': true,
            'Spain Barcelona Police Export': true,
            'Invoice / Folio Export': true,
            'Nationality Export - France': true,
            'Criterion Hospitality CC Export': true,
            'Guest Details by Arrival Date': true,
            'Cancellations by Arrival Date': true,
            'Cancellations by Cancel Date': true,
            'HESTA Switzerland': true,
            'Ad Notum - Rate of the Day Export': true
        };

        var forRunOnceOnly = {
            'Financial Transactions': true,
            'Stash Rewards Membership Export': true,
            'Reservations': true,
            'Rooms': true,
            'Future Reservations': true,
            'Last Week Reservations': true,
            'Past Reservations - Monthly': true,
            'Nationality Statistics': true,
            'Commissions': true,
            'Clairvoyix Stays Export': true,
            'Clairvoyix Reservations Export': true,
            'Synxis - Reservations': true,
            'Synxis - Upcoming Reservation Export (Future Reservation Export)': true,
            'Police Report Export': true,
            'Switzerland Zurich Police Export': true,
            'Spain Barcelona Police Export': true,
            'Austria Residence Country Export': true,
            'Nationality Export - France': true,
            'Criterion Hospitality CC Export': true,
            'GOBD Export': true,
            'GOBD Admin Charge Code Actions Export': true,
            'Cancellations by Arrival Date': true,
            'Cancellations by Cancel Date': true,
            'HESTA Switzerland': true,
            'Monthly Nationality Statistics': true
        };

        var forWeekly = {
            'Future Reservations': true,
            'Last Week Reservations': true,
            'Clairvoyix Reservations Export': true,
            'Synxis - Upcoming Reservation Export (Future Reservation Export)': true,
            'Police Report Export': true,
            'Switzerland Zurich Police Export': true,
            'Spain Barcelona Police Export': true,
            'Invoice / Folio Export': true,
            'Cancellations by Arrival Date': true,
            'Cancellations by Cancel Date': true,
            'HESTA Switzerland': true
        };
        var forMonthly = {
            'Future Reservations': true,
            'Past Reservations - Monthly': true,
            'Nationality Statistics': true,
            'Commissions': true,
            'Clairvoyix Reservations Export': true,
            'Synxis - Upcoming Reservation Export (Future Reservation Export)': true,
            'Police Report Export': true,
            'Belgium Nationality Export': true,
            'Switzerland Zurich Police Export': true,
            'Spain Barcelona Police Export': true,
            'Austria Nationality Export': true,
            'Invoice / Folio Export': true,
            'Nationality Export - France': true,
            'Criterion Hospitality CC Export': true,
            'Cancellations by Arrival Date': true,
            'Cancellations by Cancel Date': true,
            'HESTA Switzerland': true,
            'Austria Residence Country Export': true,
            'Monthly Nationality Statistics': true
        };

        var forHourly = {
            'Future Reservations': true,
            'Clairvoyix Reservations Export': true,
            'Synxis - Upcoming Reservation Export (Future Reservation Export)': true,
            'Police Report Export': true,
            'Synxis - Reservations': true,
            'Switzerland Zurich Police Export': true,
            'Spain Barcelona Police Export': true,
            'Cancellations by Arrival Date': true,
            'Cancellations by Cancel Date': true,
            'HESTA Switzerland': true,
            'Ad Notum - Rate of the Day Export': true
        };

        if (forHourly[item.report.title]) {
            $scope.scheduleFrequency.push(hourlyOnly);
            $scope.scheduleFreqType.push(hourlyTypeOnly);
        }

        if (forDaily[item.report.title]) {
            $scope.scheduleFrequency.push(dailyOnly);
            $scope.scheduleFreqType.push(dailyTypeOnly);
        }

        if (forWeekly[item.report.title]) {
            $scope.scheduleFrequency.push(weeklyOnly);
            $scope.scheduleFreqType.push(weeklyTypeOnly);
        }

        if (forMonthly[item.report.title]) {
            $scope.scheduleFrequency.push(monthlyOnly);
            $scope.scheduleFreqType.push(monthlyTypeOnly);
        }

        if (forRunOnceOnly[item.report.title]) {
            $scope.scheduleFrequency.push(runOnceOnly);
        }

        if ($rootScope.isStandAlone) {
            $scope.scheduleFrequency.push(runDuringEod);
        }
    };

    // Configure the time periods for the given report
    var filterScheduleTimePeriod = function filterScheduleTimePeriod(item) {

        $scope.scheduleTimePeriods = [];

        var reportTimePeriods = reportsSrv.getReportExportTimePeriods(item.report.title);

        _.each(reportTimePeriods, function (timePeriod) {
            $scope.scheduleTimePeriods.push(_.find($scope.originalScheduleTimePeriods, { value: timePeriod }));
        });
    };

    var processScheduleDetails = function processScheduleDetails(report) {
        var TIME_SLOTS = 30;

        var datePickerCommon = {
            dateFormat: $rootScope.jqDateFormat,
            numberOfMonths: 1,
            changeYear: true,
            changeMonth: true,
            beforeShow: function beforeShow() {
                angular.element('#ui-datepicker-div');
                angular.element('<div id="ui-datepicker-overlay">').insertAfter('#ui-datepicker-div');
            },
            onClose: function onClose() {
                angular.element('#ui-datepicker-div');
                angular.element('#ui-datepicker-overlay').remove();
            }
        };

        var businessDateMinusOne = moment(tzIndependentDate($rootScope.businessDate)).subtract(1, 'days').format($rootScope.momentFormatForAPI);

        var startsOn = $scope.selectedEntityDetails.starts_on || $rootScope.businessDate,
            endsOnDate = $scope.selectedEntityDetails.ends_on_date || $rootScope.businessDate,
            exportDate = $scope.selectedEntityDetails.from_date || null,
            exportToDate = $scope.selectedEntityDetails.to_date || businessDateMinusOne;

        var hasAccOrGuest, todayTimePeriod;

        hasAccOrGuest = _.find(report.filters, function (filter) {
            return filter.value === 'ACCOUNT' || filter.value === 'GUEST';
        });

        $scope.scheduleParams = {};

        if (angular.isDefined(hasAccOrGuest)) {
            todayTimePeriod = _.find($scope.scheduleTimePeriods, function (each) {
                return each.value === 'TODAY';
            });

            $scope.scheduleParams.time_period_id = todayTimePeriod.id;
            $scope.isGuestBalanceReport = true;
        } else if (angular.isDefined($scope.selectedEntityDetails.time_period_id)) {
            $scope.scheduleParams.time_period_id = $scope.selectedEntityDetails.time_period_id;
        } else {
            $scope.scheduleParams.time_period_id = undefined;
        }

        if (angular.isDefined($scope.selectedEntityDetails.from_date)) {
            $scope.scheduleParams.from_date = $scope.selectedEntityDetails.from_date;
        } else {
            $scope.scheduleParams.from_date = moment(tzIndependentDate($rootScope.businessDate)).subtract(1, 'days');

            var todayDate = moment().startOf('day'),
                daysDiff = moment.duration(todayDate.diff($scope.scheduleParams.from_date)).asDays();

            if (daysDiff < 7) {
                $scope.scheduleParams.from_date = $scope.scheduleParams.from_date.format("L");
            } else {
                $scope.scheduleParams.from_date = $scope.scheduleParams.from_date.calendar();
            }
        }

        if (angular.isDefined($scope.selectedEntityDetails.to_date)) {
            $scope.scheduleParams.to_date = $scope.selectedEntityDetails.to_date;
        } else {
            $scope.scheduleParams.to_date = moment(tzIndependentDate($rootScope.businessDate)).subtract(1, 'days');

            var todayDate = moment().startOf('day'),
                daysDiff = moment.duration(todayDate.diff($scope.scheduleParams.to_date)).asDays();

            if (daysDiff < 7) {
                $scope.scheduleParams.to_date = $scope.scheduleParams.to_date.format("L");
            } else {
                $scope.scheduleParams.to_date = $scope.scheduleParams.to_date.calendar();
            }
        }

        if (angular.isDefined($scope.selectedEntityDetails.time)) {
            $scope.scheduleParams.time = $scope.selectedEntityDetails.time;
        } else {
            $scope.scheduleParams.time = undefined;
        }

        if (angular.isDefined($scope.selectedEntityDetails.frequency_id)) {
            $scope.scheduleParams.frequency_id = $scope.selectedEntityDetails.frequency_id;
        } else {
            $scope.scheduleParams.frequency_id = undefined;
        }

        if (angular.isDefined($scope.selectedEntityDetails.repeats_every)) {
            $scope.scheduleParams.repeats_every = $scope.selectedEntityDetails.repeats_every;
        } else {
            $scope.scheduleParams.repeats_every = undefined;
        }

        if ($scope.selectedEntityDetails.ends_on_date !== null && $scope.selectedEntityDetails.ends_on_after === null) {
            $scope.scheduleParams.scheduleEndsOn = 'DATE';
        } else if ($scope.selectedEntityDetails.ends_on_date === null && $scope.selectedEntityDetails.ends_on_after !== null) {
            $scope.scheduleParams.ends_on_after = $scope.selectedEntityDetails.ends_on_after;
            $scope.scheduleParams.scheduleEndsOn = 'NUMBER';
        } else {
            $scope.scheduleParams.scheduleEndsOn = 'NEVER';
        }

        var businessDateMinusOne = moment(tzIndependentDate($rootScope.businessDate)).subtract(1, 'days').format($rootScope.momentFormatForAPI);

        var todayDate = moment().startOf('day');

        var businessDateMinusNinety = moment(tzIndependentDate(todayDate)).subtract(90, 'days').format($rootScope.momentFormatForAPI);
        /*
         * Export Calender Options
         * max date is business date
         */
        if ($scope.selectedEntityDetails.report.title === 'Cancellations by Arrival Date' || $scope.selectedEntityDetails.report.title === 'Cancellations by Cancel Date' || $scope.selectedEntityDetails.report.title === 'Guest Details by Arrival Date') {
            $scope.exportFromCalenderOptions = angular.extend({
                maxDate: null,
                minDate: null,
                onSelect: function onSelect(value) {
                    $scope.exportCalenderToOptions.minDate = value;
                }
            }, datePickerCommon);
        } else if ($scope.selectedEntityDetails.report.title !== 'GOBD Export' && $scope.selectedEntityDetails.report.title !== 'GOBD Admin Charge Code Actions Export') {
            $scope.exportFromCalenderOptions = angular.extend({
                maxDate: tzIndependentDate(businessDateMinusOne),
                minDate: tzIndependentDate(null),
                onSelect: function onSelect(value) {
                    $scope.exportCalenderToOptions.minDate = value;
                }
            }, datePickerCommon);
        } else {
            $scope.exportFromCalenderOptions = angular.extend({
                maxDate: tzIndependentDate(todayDate),
                minDate: tzIndependentDate(businessDateMinusNinety),
                onSelect: function onSelect(value) {
                    $scope.exportCalenderToOptions.minDate = value;
                }
            }, datePickerCommon);
        }

        $scope.scheduleParams.from_date = exportDate === null ? null : reportUtils.processDate(exportDate).today;

        if ($scope.selectedEntityDetails.report.title === 'GOBD Export' || $scope.selectedEntityDetails.report.title === 'GOBD Admin Charge Code Actions Export') {
            if (exportDate === null) {
                exportDate = businessDateMinusNinety;
            }
            $scope.exportCalenderToOptions = angular.extend({
                maxDate: tzIndependentDate(todayDate),
                minDate: tzIndependentDate(exportDate)
            }, datePickerCommon);
        } else if ($scope.selectedEntityDetails.report.title === 'Cancellations by Arrival Date' || $scope.selectedEntityDetails.report.title === 'Cancellations by Cancel Date') {
            $scope.exportCalenderToOptions = angular.extend({
                maxDate: null,
                minDate: null
            }, datePickerCommon);
        } else {
            $scope.exportCalenderToOptions = angular.extend({
                maxDate: tzIndependentDate(businessDateMinusOne),
                minDate: tzIndependentDate(exportDate)
            }, datePickerCommon);
        }
        $scope.scheduleParams.to_date = exportDate === null ? null : reportUtils.processDate(exportToDate).today;

        $scope.startsOnOptions = angular.extend({
            minDate: tzIndependentDate($rootScope.businessDate),
            onSelect: function onSelect(value) {
                $scope.endsOnOptions.minDate = value;
                if ($scope.scheduleParams.ends_on_date < $scope.scheduleParams.starts_on) {
                    $scope.scheduleParams.ends_on_date = $scope.scheduleParams.starts_on;
                }
            }
        }, datePickerCommon);
        $scope.scheduleParams.starts_on = reportUtils.processDate(startsOn).today;
        /**/
        $scope.endsOnOptions = angular.extend({
            onSelect: function onSelect(value) {
                $scope.startsOnOptions.maxDate = value;
            }
        }, datePickerCommon);
        $scope.scheduleParams.ends_on_date = reportUtils.processDate(endsOnDate).today;

        $scope.scheduleParams.delivery_id = $scope.selectedEntityDetails.delivery_type ? $scope.selectedEntityDetails.delivery_type.value : null;
        $scope.scheduleParams.format_id = $scope.selectedEntityDetails.format ? $scope.selectedEntityDetails.format.id : getFileFormatId();

        if ($scope.scheduleParams.delivery_id === 'CLOUD_DRIVE') {
            $scope.scheduleParams.delivery_id = $scope.selectedEntityDetails.cloud_drive_type;
        }

        if ($scope.scheduleParams.delivery_id === 'EMAIL') {
            $scope.emailList = $scope.selectedEntityDetails.emails.split(', ');
        } else if ($scope.scheduleParams.delivery_id === 'SFTP') {
            $scope.scheduleParams.selectedFtpRecipient = $scope.selectedEntityDetails.sftp_server_id;
        } else if ($scope.scheduleParams.delivery_id === 'GOOGLE DRIVE' || $scope.scheduleParams.delivery_id === 'DROPBOX') {
            $scope.scheduleParams.selectedCloudAccount = $scope.selectedEntityDetails.cloud_drive_id;
        }

        if ($scope.selectedEntityDetails.report.title === 'Ad Notum - Rate of the Day Export') {
            $scope.isAdNotumExport = true;
        }

        $scope.scheduleParams.includeTitleHeader = $scope.selectedEntityDetails.include_title_header;

        $scope.timeSlots = reportUtils.createTimeSlots(TIME_SLOTS);
    };

    var fetchReqDatas = function fetchReqDatas() {
        var reset = true;

        var success = function success(payload) {
            $scope.originalScheduleFrequency = payload.scheduleFrequency;
            runDuringEodScheduleFrequencyId = _.find($scope.originalScheduleFrequency, { value: 'RUN_DURING_EOD' }).id;
            $scope.originalScheduleTimePeriods = payload.scheduleTimePeriods;
            $scope.$parent.$parent.schedulesList = [];
            $scope.$parent.$parent.schedulableReports = [];
            $scope.ftpServerList = payload.ftpServerList;
            $scope.dropBoxAccountList = payload.dropBoxAccounts;
            $scope.googleDriveAccountList = payload.googleDriveAccounts;
            $scope.scheduleDeliveryTypes = payload.scheduleDeliveryTypes;
            $scope.scheduleFormat = payload.scheduleFormat;
            $scope.CSV_FORMAT_ID = _.find($scope.scheduleFormat, { value: 'CSV' }).id;

            // sort schedule list by report name
            $scope.$parent.$parent.schedulesList = _.sortBy(payload.schedulesList, function (item) {
                return item.report.title;
            });

            // add filtered out and occurance
            _.each($scope.$parent.$parent.schedulesList, function (item) {

                item.filteredOut = false;
                item.occurance = findOccurance(item);
            });

            // structure the schedulable reports exactly like the
            // schedules list, then we can re-use the support functions
            _.each(payload.schedulableReports, function (each) {
                $scope.$parent.$parent.schedulableReports.push({
                    id: each.id,
                    report: {
                        id: each.id,
                        description: each.description,
                        title: each.title
                    },
                    sort_fields: each.sort_fields,
                    active: false,
                    filteredOut: false
                });
            });

            // sort schedulable reports by report name
            $scope.$parent.$parent.schedulableReports = _.sortBy($scope.$parent.$parent.schedulableReports, function (item) {
                return item.report.title;
            });

            /**
             * Convert sys value to human
             *
             * @param {String} value the sys value
             * @returns {String} converted value
             */
            function getValue(value) {
                switch (value) {
                    case 'DAILY':
                        return 'Day';
                    case 'HOURLY':
                        return 'Hour';
                    case 'WEEKLY':
                        return 'Week';
                    case 'MONTHLY':
                        return 'Month';
                    case 'RUN_ONCE':
                        return 'Once';
                    default:
                        return 'Per';
                }
            }

            $scope.originalScheduleFreqType = _.map($scope.originalScheduleFrequency, function (freq) {
                return {
                    id: freq.id,
                    value: getValue(freq.value),
                    originalValue: freq.value
                };
            });

            _.each($scope.$parent.$parent.schedulesList, function (item) {
                if (angular.isDefined(reportIconCls[item.report.description])) {
                    item.reportIconCls = reportIconCls[item.report.description];
                }
            });

            $scope.refreshReportSchedulesScroll(reset);
            $scope.$emit('hideLoader');
        };

        var failed = function failed(errors) {
            $scope.errors = errors;
            $scope.$emit('hideLoader');
        };

        $scope.invokeApi(reportsSrv.reportExportPayload, {}, success, failed);
    };

    var runDigestCycle = function runDigestCycle() {
        if (!$scope.$$phase) {
            $scope.$digest();
        }
    };

    var STAGES = {
        SHOW_SCHEDULE_LIST: 'SHOW_SCHEDULE_LIST',
        SHOW_PARAMETERS: 'SHOW_PARAMETERS',
        SHOW_DETAILS: 'SHOW_DETAILS',
        SHOW_DISTRIBUTION: 'SHOW_DISTRIBUTION'
    };

    BaseCtrl.call(this, $scope);

    $scope.runScheduleNow = function () {
        var params = {
            id: $scope.selectedEntityDetails.id
        };

        var getFtpAddress = function getFtpAddress(id) {
            var has;
            var ret = {
                description: '',
                url: ''
            };

            if ($scope.ftpServerList.length) {
                has = _.find($scope.ftpServerList, { id: id }) || ret;
                ret = {
                    description: has.description,
                    url: has.url
                };
            }

            return ret;
        };

        var showResponse = function showResponse() {
            $scope.runNowData = {
                isEmail: $scope.checkDeliveryType('EMAIL'),
                isFtp: $scope.checkDeliveryType('SFTP'),
                isSingleEmail: $scope.emailList.length === 1,
                ftpAddress: getFtpAddress($scope.scheduleParams.selectedFtpRecipient)
            };

            ngDialog.open({
                template: '/assets/partials/reports/scheduleReport/rvRunScheduleNowUpdate.html',
                scope: $scope
            });
        };

        var success = function success() {
            $scope.errorMessage = '';
            $scope.$emit('hideLoader');
            // if ( !! $scope.selectedSchedule && $scope.selectedSchedule.active ) {
            //     $scope.selectedSchedule.active = false;
            // }
            // $scope.updateViewCol($scope.viewColsActions.ONE);

            $scope.runScheduleNowSuccess = true;
            showResponse();
        };

        var failed = function failed(errors) {
            $scope.errorMessage = errors;
            $scope.$emit('hideLoader');

            $scope.runScheduleNowSuccess = false;
            showResponse();
        };

        $scope.invokeApi(reportsSrv.runScheduleNow, params, success, failed);
    };

    $scope.removeEmail = function (index) {
        var RESET = true;

        $scope.emailList = [].concat($scope.emailList.slice(0, index), $scope.emailList.slice(index + 1));

        $scope.refreshFourthColumnScroll(RESET);
    };

    $scope.userAutoCompleteSimple = {
        minLength: 3,
        source: function source(request, response) {
            var mapedUsers, found;

            mapedUsers = _.map($scope.activeUserList, function (user) {
                return {
                    label: user.full_name || user.email,
                    value: user.email
                };
            });
            found = $.ui.autocomplete.filter(mapedUsers, request.term);
            response(found);
        },
        select: function select(event, ui) {
            var RESET = true;
            var alreadyPresent = _.find($scope.emailList, function (email) {
                return email === ui.item.value;
            });

            if (!alreadyPresent) {
                $scope.emailList.push(ui.item.value);
            }
            this.value = '';

            runDigestCycle();
            $scope.refreshFourthColumnScroll(RESET);

            return false;
        },
        focus: function focus() {
            return false;
        }
    };
    $scope.userEmailTyped = function () {};

    $scope.pickSchedule = function (item, index) {
        var success = function success(data) {
            $scope.selectedEntityDetails = data;
            $scope.isGuestBalanceReport = false;
            $scope.isAdNotumExport = false;

            if (!!$scope.selectedSchedule && $scope.selectedSchedule.active) {
                $scope.selectedSchedule.active = false;
            }
            $scope.selectedSchedule = $scope.$parent.$parent.schedulesList[index];
            $scope.selectedSchedule.active = true;
            /**/
            $scope.selectedReport.active = false;

            $scope.addingStage = STAGES.SHOW_DISTRIBUTION;
            $scope.updateViewCol($scope.viewColsActions.FOUR);

            filterScheduleTimePeriod($scope.selectedEntityDetails);
            filterScheduleFrequency($scope.selectedEntityDetails);
            processScheduleDetails(item);
            setupFilters();
            applySavedFilters();

            $scope.refreshAllOtherColumnScrolls();

            $scope.$emit('hideLoader');
        };

        var failed = function failed(errors) {
            $scope.errors = errors;
            $scope.$emit('hideLoader');
        };

        var params = {
            id: item.id
        };

        $scope.invokeApi(reportsSrv.fetchOneSchedule, params, success, failed);
    };

    $scope.check = function () {
        ngDialog.open({
            template: '/assets/partials/reports/scheduleReport/rvConfirmDiscard.html',
            scope: $scope
        });
    };

    $scope.pickReport = function (item, index) {
        $scope.selectedEntityDetails = $scope.$parent.$parent.schedulableReports[index];
        $scope.isGuestBalanceReport = false;
        $scope.isAdNotumExport = false;
        if (!!$scope.selectedReport && $scope.selectedReport.active) {
            $scope.selectedReport.active = false;
        }
        $scope.selectedReport = $scope.$parent.$parent.schedulableReports[index];
        $scope.selectedReport.active = true;
        /**/
        $scope.selectedSchedule.active = false;

        $scope.addingStage = STAGES.SHOW_PARAMETERS;
        $scope.updateViewCol($scope.viewColsActions.TWO);

        filterScheduleTimePeriod($scope.selectedEntityDetails);
        filterScheduleFrequency($scope.selectedEntityDetails);
        processScheduleDetails(item);
        setupFilters();
        applySavedFilters();

        $scope.refreshAllOtherColumnScrolls();
    };

    $scope.getRepeatPer = function () {
        var found = _.find($scope.scheduleFreqType, { id: $scope.scheduleParams.frequency_id });

        return found ? found.value : 'Per';
    };

    $scope.checkCanCreateSchedule = function () {
        if (validateSchedule()) {
            createSchedule();
        } else {
            fillValidationErrors();
            ngDialog.open({
                template: '/assets/partials/reports/scheduleReport/rvCantCreateSchedule.html',
                scope: $scope
            });
        }
    };

    $scope.checkCanSaveSchedule = function () {
        if (validateSchedule()) {
            saveSchedule();
        } else {
            fillValidationErrors();
            ngDialog.open({
                template: '/assets/partials/reports/scheduleReport/rvCantCreateSchedule.html',
                scope: $scope
            });
        }
    };

    $scope.confirmDelete = function () {
        ngDialog.open({
            template: '/assets/partials/reports/scheduleReport/rvConfirmDeleteSchedule.html',
            scope: $scope
        });
    };

    $scope.deleteSchedule = function () {
        var success = function success() {
            $scope.errorMessage = '';
            $scope.$emit('hideLoader');
            if (!!$scope.selectedReport && $scope.selectedReport.active) {
                $scope.selectedReport.active = false;
            }
            $scope.updateViewCol($scope.viewColsActions.ONE);
            $scope.addingStage = STAGES.SHOW_SCHEDULE_LIST;

            fetchReqDatas();
        };

        var failed = function failed(errors) {
            $scope.errorMessage = errors;
            $scope.$emit('hideLoader');
        };

        $scope.closeDialog();
        $scope.invokeApi(reportsSrv.deleteSchedule, { id: $scope.selectedEntityDetails.id }, success, failed);
    };

    $scope.refreshReportSchedulesScroll = function (reset) {
        refreshScroll(REPORT_SCHEDULES_SCROLL, reset);
    };
    $scope.refreshSecondColumnScroll = function (reset) {
        refreshScroll(SECOND_COLUMN_SCROLL, reset);
    };
    $scope.refreshThirdColumnScroll = function (reset) {
        refreshScroll(THIRD_COLUMN_SCROLL, reset);
    };
    $scope.refreshFourthColumnScroll = function (reset) {
        refreshScroll(FOURTH_COLUMN_SCROLL, reset);
    };
    $scope.refreshAllOtherColumnScrolls = function () {
        var reset = true;

        $scope.refreshSecondColumnScroll(reset);
        $scope.refreshThirdColumnScroll(reset);
        $scope.refreshFourthColumnScroll(reset);
    };

    $scope.scheduleReport = function () {
        var reset = true;

        $scope.isAddingNew = true;

        $scope.selectedSchedule.active = false;

        $scope.updateView($scope.reportViewActions.SHOW_EXPORT_A_REPORT);
        $scope.updateViewCol($scope.viewColsActions.ONE);

        $scope.refreshReportSchedulesScroll(reset);
        $scope.addingStage = STAGES.SHOW_SCHEDULE_LIST;

        $scope.$emit('UPDATE_TITLE_AND_HEADING');
    };

    $scope.checkCanCancel = function () {
        if (!!$scope.selectedReport && $scope.selectedReport.active) {
            ngDialog.open({
                template: '/assets/partials/reports/scheduleReport/rvConfirmDiscard.html',
                scope: $scope
            });
        } else {
            $scope.cancelScheduleReport();
        }
    };

    $scope.cancelScheduleReport = function () {
        var reset = true;

        $scope.isAddingNew = false;
        $scope.addingStage = STAGES.SHOW_SCHEDULE_LIST;

        $scope.selectedReport.active = false;

        $scope.updateView($scope.reportViewActions.SHOW_EXPORT_REPORTS);
        $scope.updateViewCol($scope.viewColsActions.ONE);

        $scope.refreshReportSchedulesScroll(reset);

        $scope.closeDialog();
    };

    $scope.goToNext = function () {
        var noReset = true;
        var verReset = true;

        if ($scope.addingStage === STAGES.SHOW_PARAMETERS) {
            $scope.addingStage = STAGES.SHOW_DETAILS;
            $scope.updateViewCol($scope.viewColsActions.THREE, noReset);
            $scope.refreshThirdColumnScroll(verReset);
        } else if ($scope.addingStage === STAGES.SHOW_DETAILS) {
            $scope.addingStage = STAGES.SHOW_DISTRIBUTION;
            $scope.updateViewCol($scope.viewColsActions.FOUR, noReset);
            $scope.refreshFourthColumnScroll(verReset);
        }

        $scope.scrollToLast();
    };

    $scope.shouldHideParametersCol = function () {
        return $scope.addingStage === STAGES.SHOW_SCHEDULE_LIST;
    };

    $scope.shouldHideDetailsCol = function () {
        return $scope.addingStage === STAGES.SHOW_SCHEDULE_LIST || $scope.addingStage === STAGES.SHOW_PARAMETERS;
    };

    $scope.shouldHideDistributionCol = function () {
        return $scope.addingStage === STAGES.SHOW_SCHEDULE_LIST || $scope.addingStage === STAGES.SHOW_PARAMETERS || $scope.addingStage === STAGES.SHOW_DETAILS;
    };

    $scope.updateScrollOnUpdate = function () {
        $timeout(function () {
            $scope.refreshSecondColumnScroll(true);
        }, 1000);
    };

    var findExportTimePeriod = function findExportTimePeriod(value) {
        return _.find($scope.originalScheduleTimePeriods, function (timePeriod) {
            return timePeriod.value === value;
        });
    };

    $scope.shouldShowExportCalenderFromDate = function () {
        var shouldShowFromDate = false;
        var timePeriod;

        if (_.isEmpty($scope.selectedEntityDetails.report)) {
            return shouldShowFromDate;
        }

        switch ($scope.selectedEntityDetails.report.title) {
            case 'Guest Details by Arrival Date':
            case 'Journal Export':
                timePeriod = findExportTimePeriod('DATE');
                break;
            case 'Cancellations by Arrival Date':
            case 'Cancellations by Cancel Date':
            case 'GOBD Admin Charge Code Actions Export':
            case 'GOBD Export':
            case 'Invoice / Folio Export':
                timePeriod = findExportTimePeriod('DATE_RANGE');
                break;
        }

        if (timePeriod && timePeriod.id === $scope.scheduleParams.time_period_id) {
            shouldShowFromDate = true;
        }

        return shouldShowFromDate;
    };

    $scope.shouldShowExportCalenderToDate = function () {
        var shouldShowToDate = false;
        var timePeriod;

        if (_.isEmpty($scope.selectedEntityDetails.report)) {
            return shouldShowToDate;
        }

        switch ($scope.selectedEntityDetails.report.title) {
            case 'Cancellations by Arrival Date':
            case 'Cancellations by Cancel Date':
            case 'GOBD Admin Charge Code Actions Export':
            case 'GOBD Export':
            case 'Invoice / Folio Export':
                timePeriod = findExportTimePeriod('DATE_RANGE');
                break;
        }

        if (timePeriod && timePeriod.id === $scope.scheduleParams.time_period_id) {
            shouldShowToDate = true;
        }

        return shouldShowToDate;
    };

    $scope.notRunOnce = function () {
        var match = _.find($scope.originalScheduleFrequency, { id: $scope.scheduleParams.frequency_id }) || {};

        return match.value !== 'RUN_ONCE';
    };

    $scope.checkDeliveryType = function (checkFor) {
        return checkFor === $scope.scheduleParams.delivery_id;
    };

    $scope.getDeliveryId = function (checkFor) {
        var match = _.find($scope.scheduleDeliveryTypes, { value: checkFor }) || {};

        return match.id;
    };

    // Listener for scheduling new report
    var createNewExportScheduleListener = $scope.$on('CREATE_NEW_EXPORT_SCHEDULE', function () {
        $scope.scheduleReport();
    });

    $scope.$on('$destroy', createNewExportScheduleListener);

    $scope.addListener('RESET_CURRENT_STAGE', function () {
        $scope.addingStage = STAGES.SHOW_SCHEDULE_LIST;
    });

    // Change handler for delivery options
    $scope.onDeliveryOptionChange = function () {
        // We are just clearing the cloud drive id only because the given id belongs to 
        // a single cloud drive account and if not cleared it will shows empty <option>
        // when the cloud account type is changed from the delivery options
        $scope.scheduleParams.selectedCloudAccount = null;
    };

    /**
     * Checks whether the file format dropdown should be shown or not
     * @param {Object} selectedEntity - selected report
     * @return {boolean} value for show/hide dropdown
     */
    $scope.shouldShowFileFormat = function (selectedEntity) {
        if (selectedEntity.report && selectedEntity.report.title === 'Journal Export' && $rootScope.isGOBDExportEnabled) {
            $scope.scheduleFormat = _.filter($scope.scheduleFormat, function (object) {
                return object.value === 'CSV';
            });
        }

        return selectedEntity.report && selectedEntity.report.title === 'Journal Export' && $rootScope.isGOBDExportEnabled;
    };

    /**
     * Disable repeats every section
     */
    $scope.shallDisableRepeatsEvery = function () {
        return $scope.originalScheduleFrequency && $scope.scheduleParams.frequency_id === _.find($scope.originalScheduleFrequency, { value: 'RUN_DURING_EOD' }).id;
    };

    /**
     * Start everything
     * @return {Object} undefined
     *
     */
    function init() {
        $scope.isAddingNew = false;
        $scope.addingStage = STAGES.SHOW_SCHEDULE_LIST;

        $scope.selectedSchedule = {};
        $scope.selectedReport = {};
        $scope.selectedEntityDetails = {};

        $scope.$parent.$parent.schedulesList = [];
        $scope.$parent.$parent.scheduleReport = [];
        $scope.scheduleTimePeriods = [];
        $scope.scheduleFrequency = [];
        $scope.scheduleFreqType = [];
        $scope.emailList = [];

        $scope.scheduleParams = {};

        setupScrolls();

        fetchReqDatas();
    }

    init();
}]);