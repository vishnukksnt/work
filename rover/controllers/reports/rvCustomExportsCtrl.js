'use strict';

angular.module('sntRover').controller('RVCustomExportCtrl', ['$scope', 'RVCustomExportSrv', '$timeout', '$rootScope', 'RVreportsSrv', 'RVCustomExportsUtilFac', 'RVReportUtilsFac', '$filter', 'ngDialog', function ($scope, RVCustomExportSrv, $timeout, $rootScope, reportsSrv, RVCustomExportsUtilFac, reportUtils, $filter, ngDialog) {

    BaseCtrl.call(this, $scope);

    var STAGES = {
        SHOW_CUSTOM_EXPORT_LIST: 'SHOW_CUSTOM_EXPORT_LIST',
        SHOW_PARAMETERS: 'SHOW_PARAMETERS'
    };

    var REPORT_COLS_SCROLLER = 'report-cols-scroller';
    var REPORT_SELECTED_COLS_SCROLLER = 'report-selected-cols-scroller';
    var EXPORT_LIST_SCROLLER = 'exports-list-scroller';
    var SCHEDULE_DETAILS_SCROLLER = 'schedule-details-scroller';
    var DELIVERY_OPTIONS_SCROLLER = 'delivery-options-scroller';
    var SCROLL_REFRESH_DELAY = 100;
    var SHOW_ERROR_MSG_EVENT = 'SHOW_ERROR_MSG_EVENT';

    var runDuringEodScheduleFrequencyId;

    // Initialize the scrollers
    var initializeScrollers = function initializeScrollers() {
        var scrollerOptions = {
            tap: true,
            preventDefault: false
        };

        $scope.setScroller(REPORT_COLS_SCROLLER, scrollerOptions);
        $scope.setScroller(REPORT_SELECTED_COLS_SCROLLER, scrollerOptions);
        $scope.setScroller(EXPORT_LIST_SCROLLER, scrollerOptions);
        $scope.setScroller(SCHEDULE_DETAILS_SCROLLER, scrollerOptions);
        $scope.setScroller(DELIVERY_OPTIONS_SCROLLER, scrollerOptions);
    };

    $scope.sortableOptions = {
        start: function start() {
            $scope.getScroller(REPORT_SELECTED_COLS_SCROLLER).disable();
            $scope.$parent.myScroll['FULL_REPORT_SCROLL'].disable();
        },
        stop: function stop() {
            $scope.getScroller(REPORT_SELECTED_COLS_SCROLLER).enable();
            $scope.$parent.myScroll['FULL_REPORT_SCROLL'].enable();
        }
    };

    // Refresh the given scroller
    var refreshScroll = function refreshScroll(name, reset) {
        if (!!reset && $scope.myScroll.hasOwnProperty(name)) {
            $scope.myScroll[name].scrollTo(0, 0, SCROLL_REFRESH_DELAY);
        }
        $scope.refreshScroller(name);
    };

    // helper function
    var findOccurance = function findOccurance(item) {
        var occurance = 'Runs ',
            frequency = _.find($scope.customExportsData.scheduleFrequencies, { id: item.frequency_id }),
            description = '',
            value = '';

        var FREQ_VALUES = {
            DAILY: 'DAILY',
            HOURLY: 'HOURLY',
            WEEKLY: 'WEEKLY',
            MONTHLY: 'MONTHLY',
            RUN_ONCE: 'RUN_ONCE',
            EVERY_MINUTE: 'MINUTES'
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
                } else if (value === FREQ_VALUES.EVERY_MINUTE) {
                    occurance += item.repeats_every === 1 ? 'minute' : 'minutes';
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

    var areReportFilersValid = function areReportFilersValid() {
        // For Financial Transacton report, we need to ensure that the duration filter is always selected with some value
        // for other reports, we need to ignore this validation
        if ($scope.selectedEntityDetails.report.title === 'Financial Transaction') {
            var durationFilter = _.find($scope.filterData.appliedFilters, function (filter) {
                return filter.isDuration;
            });

            return durationFilter && durationFilter.selectedFirstLevel && durationFilter.selectedSecondLevel;
        }

        return true;
    };

    var validateSchedule = function validateSchedule() {

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

        var hasExportName = function hasExportName() {
            return !!$scope.customExportsScheduleParams.exportName;
        },
            hasOutputFormat = function hasOutputFormat() {
            return !!$scope.customExportsScheduleParams.format;
        },
            hasSelectedColumns = function hasSelectedColumns() {
            return $scope.selectedColumns.length;
        };

        return hasFrequency() && hasValidDistribution() && hasExportName() && hasOutputFormat() && hasSelectedColumns() && areReportFilersValid();
    };

    var fillValidationErrors = function fillValidationErrors() {
        $scope.createErrors = [];

        if ($scope.selectedColumns.length === 0) {
            $scope.createErrors.push('No columns selected for the export');
        }
        if (!$scope.scheduleParams.frequency_id) {
            $scope.createErrors.push('Repeat frequency in details');
        }
        if (!$scope.emailList.length && !$scope.scheduleParams.selectedFtpRecipient && !$scope.scheduleParams.selectedCloudAccount) {
            $scope.createErrors.push('Emails/SFTP/Dropbox/Google Drive in distribution list');
        }
        if (!$scope.customExportsScheduleParams.exportName) {
            $scope.createErrors.push('No export name entered');
        }
        if (!$scope.customExportsScheduleParams.format) {
            $scope.createErrors.push('No format selected');
        }

        if (!areReportFilersValid()) {
            $scope.createErrors.push('No Duration Filter Selected');
        }
    };

    // Should show the export list
    $scope.shouldShowExportListOnly = function () {
        return $scope.viewState.currentStage === STAGES.SHOW_CUSTOM_EXPORT_LIST;
    };

    // Create new export
    var configureNewExport = function configureNewExport() {
        fetchDataSpaces();
        $scope.viewState.currentStage = STAGES.SHOW_CUSTOM_EXPORT_LIST;
    };

    var processScheduleDetails = function processScheduleDetails() {
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

        var startsOn = $scope.selectedEntityDetails.starts_on || $rootScope.businessDate,
            endsOnDate = $scope.selectedEntityDetails.ends_on_date || $rootScope.businessDate,
            exportDate = $scope.selectedEntityDetails.from_date || $rootScope.businessDate,
            exportToDate = $scope.selectedEntityDetails.to_date || $rootScope.businessDate;

        $scope.scheduleParams = {};

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
        /*
         * Export Calender Options
         * max date is business date
         */
        $scope.exportFromCalenderOptions = angular.extend({
            maxDate: tzIndependentDate($rootScope.businessDate),
            onSelect: function onSelect(value) {
                $scope.exportCalenderToOptions.minDate = value;
            }
        }, datePickerCommon);
        $scope.scheduleParams.from_date = reportUtils.processDate(exportDate).today;

        $scope.exportCalenderToOptions = angular.extend({
            maxDate: tzIndependentDate($rootScope.businessDate)
        }, datePickerCommon);
        $scope.scheduleParams.to_date = reportUtils.processDate(exportToDate).today;

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

        $scope.timeSlots = reportUtils.createTimeSlots(TIME_SLOTS);

        $scope.customExportsScheduleParams.includeTitleHeader = $scope.selectedEntityDetails.include_title_header;
    };

    /**
     * Fetch available data spaces for custom exports
     */
    var fetchDataSpaces = function fetchDataSpaces() {
        var onDataSpaceFetchSuccess = function onDataSpaceFetchSuccess(data) {

            _.each(data, function (dataSpace) {
                $scope.customExportsData.customExportDataSpaces.push({
                    id: dataSpace.id,
                    report: {
                        id: dataSpace.id,
                        title: dataSpace.title,
                        description: dataSpace.description
                    },
                    active: false,
                    filteredOut: false,
                    filters: dataSpace.filters
                });
            });

            $timeout(function () {
                refreshScroll(EXPORT_LIST_SCROLLER, true);
            }, 500);
        },
            onDataSpaceFetchFailure = function onDataSpaceFetchFailure() {
            $scope.customExportsData.customExportDataSpaces = [];
        };

        $scope.callAPI(RVCustomExportSrv.getAvailableDataSpaces, {
            onSuccess: onDataSpaceFetchSuccess,
            onFailure: onDataSpaceFetchFailure
        });
    };

    // Fetch scheduled custom exports
    var fetchCustomExportsAndExportFrequencies = function fetchCustomExportsAndExportFrequencies() {
        var onScheduledExportsFetchSuccess = function onScheduledExportsFetchSuccess(data) {
            $scope.customExportsData.scheduledCustomExports = data.customExports;
            data.scheduleFrequencies = _.sortBy(data.scheduleFrequencies, function (obj) {
                return obj.id;
            });

            $scope.customExportsData.scheduleFrequencies = angular.copy(data.scheduleFrequencies);
            $scope.customExportsData.scheduleFrequencies = _.filter($scope.customExportsData.scheduleFrequencies, function (scheduleFrequency) {
                return scheduleFrequency.value === 'RUN_DURING_EOD' ? $rootScope.isStandAlone : true;
            });
            runDuringEodScheduleFrequencyId = _.find($scope.customExportsData.scheduleFrequencies, { value: 'RUN_DURING_EOD' }).id;

            _.each($scope.customExportsData.scheduledCustomExports, function (schedule) {
                schedule.filteredOut = false;
                schedule.report.description = schedule.name;
                schedule.occurance = findOccurance(schedule);
            });

            $scope.viewState.currentStage = STAGES.SHOW_CUSTOM_EXPORT_LIST;

            $timeout(function () {
                refreshScroll(EXPORT_LIST_SCROLLER, true);
            }, 800);
        },
            onScheduledExportsFetchFailure = function onScheduledExportsFetchFailure() {
            $scope.customExportsData.scheduledCustomExports = [];
        };

        $scope.callAPI(RVCustomExportSrv.getCustomExportsAndScheduleFrequencies, {
            onSuccess: onScheduledExportsFetchSuccess,
            onFailure: onScheduledExportsFetchFailure
        });
    };

    // Populate the selected value for delivery type and format for already saved schedule
    var applySelectedFormatAndDeliveryTypes = function applySelectedFormatAndDeliveryTypes() {
        $scope.customExportsScheduleParams.format = $scope.selectedEntityDetails.format && $scope.selectedEntityDetails.format.id;
        $scope.customExportsScheduleParams.deliveryType = $scope.selectedEntityDetails.delivery_type && $scope.selectedEntityDetails.delivery_type.id;
    },

    // mark the selected columns
    updateSelectedColumns = function updateSelectedColumns() {

        _.each($scope.selectedEntityDetails.mapped_name, function (value) {
            var selectedColumn = _.find($scope.selectedEntityDetails.columns, {
                name: value.field_name
            }),
                columnPos = parseInt(value.sequence_order) - 1;

            if (selectedColumn) {
                selectedColumn.selected = true;
                selectedColumn.customColLabel = value.mapped_name;

                $scope.selectedColumns[columnPos] = selectedColumn;
            }
        });
    },
        getValue = function getValue(value) {
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
            case 'MINUTES':
                return 'Minute';
            default:
                return 'Per';
        }
    },
        createExportFrequencyTypes = function createExportFrequencyTypes() {
        $scope.customExportsData.scheduleFreqTypes = _.map($scope.customExportsData.scheduleFrequencies, function (freq) {
            return {
                id: freq.id,
                value: getValue(freq.value),
                originalValue: freq.value
            };
        });
    };

    /**
     * Loads all the data required for the exports
     * @param {Number} reportId - id of the report
     * @return {void}
     */
    var loadReqData = function loadReqData(reportId, isSavedSchedule) {
        var onSuccess = function onSuccess(payload) {
            $scope.selectedEntityDetails.columns = angular.copy(payload.columns);
            $scope.selectedEntityDetails.active = true;
            $scope.viewState.currentStage = STAGES.SHOW_PARAMETERS;
            $scope.customExportsData.exportFormats = angular.copy(payload.exportFormats);
            $scope.customExportsData.deliveryTypes = angular.copy(payload.deliveryTypes);
            $scope.customExportsData.durations = angular.copy(payload.durations);
            $scope.ftpServerList = payload.ftpServerList;
            $scope.dropBoxAccountList = payload.dropBoxAccounts;
            $scope.googleDriveAccountList = payload.googleDriveAccounts;
            $scope.customExportsData.CSV_FORMAT_ID = _.find($scope.customExportsData.exportFormats, { value: 'CSV' }).id;

            if (!$scope.customExportsData.isNewExport) {
                applySelectedFormatAndDeliveryTypes();
                updateSelectedColumns();
            }
            createExportFrequencyTypes();
            processScheduleDetails($scope.selectedEntityDetails);
            $scope.updateViewCol($scope.viewColsActions.SIX);

            var reportFilters = angular.copy($scope.selectedEntityDetails.filters);

            $scope.selectedEntityDetails.processedFilters = RVCustomExportsUtilFac.processFilters(reportFilters);
            if (isSavedSchedule) {
                $scope.$broadcast('UPDATE_FILTER_SELECTIONS');
            }

            $timeout(function () {
                refreshScroll(EXPORT_LIST_SCROLLER);
                refreshScroll(REPORT_COLS_SCROLLER, true);
                refreshScroll(REPORT_SELECTED_COLS_SCROLLER, true);
                refreshScroll(SCHEDULE_DETAILS_SCROLLER, true);
                refreshScroll(DELIVERY_OPTIONS_SCROLLER, true);
            }, 1000);
        },
            onFailure = function onFailure(error) {
            $scope.errorMessage = error;
        };

        $scope.callAPI(RVCustomExportSrv.getRequestData, {
            onSuccess: onSuccess,
            onFailure: onFailure,
            params: {
                reportId: reportId
            }
        });
    };

    // Click handler for the given data space
    $scope.clickDataSpace = function (selectedDataSpace) {
        // Set the previous data space as non-active
        if ($scope.selectedEntityDetails) {
            $scope.selectedEntityDetails.active = false;
        }
        $scope.selectedEntityDetails = selectedDataSpace;
        resetPreviousSelections();
        loadReqData(selectedDataSpace.id);
    };

    // Handle the selection of fields belonging to the data space
    $scope.selectColumn = function (column) {
        if (column.selected) {
            $scope.selectedColumns.push(column);
        } else {
            $scope.selectedColumns = _.reject($scope.selectedColumns, function (col) {
                return col.name === column.name;
            });
        }

        $timeout(function () {
            refreshScroll(REPORT_SELECTED_COLS_SCROLLER);
            refreshScroll(SCHEDULE_DETAILS_SCROLLER, true);
            refreshScroll(DELIVERY_OPTIONS_SCROLLER, true);
        }, 1000);
    };

    /**
     * Get selected item values for multi select option
     * @param {Array} items - array of items
     * @param {String} key -the key to used as value
     * @return {Array} selectedIds - array of selected ids
     */
    var getSelectedItemValues = function getSelectedItemValues(filter) {
        var key = filter.options.value_key || 'value';

        var selectedItems = _.where(filter.secondLevelData, { selected: true }),
            selectedIds = _.pluck(selectedItems, key);

        return selectedIds || [];
    };

    /**
     * Construct the request params required while saving the export
     * @param {Number} reportId - id of the report
     * @return {Object} params - holding the request parameters
     */
    var getScheduleParams = function getScheduleParams(reportId) {
        var params = {
            report_id: reportId,
            hotel_id: $rootScope.hotelDetails.userHotelsData.current_hotel_id,
            format_id: $scope.customExportsScheduleParams.format,
            delivery_type_id: '',
            name: $scope.customExportsScheduleParams.exportName
        };

        var fieldMappings = [],
            selectedField;

        _.each($scope.selectedColumns, function (column, index) {
            selectedField = {
                field_name: column.name,
                mapped_name: column.customColLabel || column.name,
                sequence_order: index + 1
            };
            fieldMappings.push(selectedField);
        });

        params.mapped_names = fieldMappings;

        // Process the applied filters
        var filterValues = {},
            paramKey;

        _.each($scope.filterData.appliedFilters, function (filter) {
            paramKey = filter.selectedFirstLevel.toLowerCase();
            if (filter.isDuration || filter.isGeneral) {
                if (filter.selectedSecondLevel) {
                    filterValues[paramKey] = filter.selectedSecondLevel;
                }
            } else if (filter.isOption) {
                if (filter.hasDualState) {
                    if (filter.selectedSecondLevel) {
                        filterValues[paramKey] = filter.selectedSecondLevel;
                    }
                } else if (filter.isMultiSelect) {
                    if (!_.isEmpty(getSelectedItemValues(filter))) {
                        filterValues[paramKey] = getSelectedItemValues(filter);
                    }
                }
            } else if (filter.isRange) {
                if (!filterValues[paramKey]) {
                    filterValues[paramKey] = [];
                }

                if (filter.selectedSecondLevel && filter.rangeValue) {
                    filterValues[paramKey].push({
                        operator: filter.selectedSecondLevel,
                        value: filter.rangeValue
                    });
                }
            }
        });
        params.filter_values = filterValues;

        var runOnceId = _.find($scope.customExportsData.scheduleFrequencies, { value: 'RUN_ONCE' }).id;

        if ($scope.scheduleParams.time) {
            params.time = $scope.scheduleParams.time;
        }

        if ($scope.scheduleParams.from_date) {
            params.from_date = $filter('date')($scope.scheduleParams.from_date, 'yyyy/MM/dd');
        }

        // fill 'frequency_id', 'starts_on', 'repeats_every' and 'ends_on_date'
        params.frequency_id = $scope.scheduleParams.frequency_id;

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

        var deliveryType = _.find($scope.customExportsData.deliveryTypes, {
            value: $scope.scheduleParams.delivery_id
        });

        if (deliveryType) {
            params.delivery_type_id = parseInt(deliveryType.id);
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

        if ($scope.customExportsScheduleParams.includeTitleHeader && $scope.customExportsScheduleParams.format === $scope.customExportsData.CSV_FORMAT_ID) {
            params.include_title_header = $scope.customExportsScheduleParams.includeTitleHeader;
        }

        return params;
    };

    /**
     * Create a new schedule
     */
    var createSchedule = function createSchedule() {
        var requestParams = getScheduleParams($scope.selectedEntityDetails.id),
            onScheduleCreateSuccess = function onScheduleCreateSuccess() {
            $scope.errorMessage = '';
            processDataSpaceListing();
        },
            onScheduleCreateFailure = function onScheduleCreateFailure(error) {
            $scope.errorMessage = error;
            $scope.$emit(SHOW_ERROR_MSG_EVENT, error);
        };

        $scope.callAPI(reportsSrv.createSchedule, {
            params: requestParams,
            onSuccess: onScheduleCreateSuccess,
            onFailure: onScheduleCreateFailure
        });
    };

    /**
     * Select a particular schedule
     * @param {Object} selectedSchedule - selected schedule
     * @return {void}
     */
    $scope.pickSchedule = function (selectedSchedule) {
        // Set the previous schedule as non-active
        if ($scope.selectedEntityDetails) {
            $scope.selectedEntityDetails.active = false;
        }
        $scope.selectedEntityDetails = selectedSchedule;
        $scope.customExportsData.isNewExport = false;
        resetPreviousSelections();
        $scope.customExportsScheduleParams.exportName = selectedSchedule.name;
        selectedSchedule.active = true;
        loadReqData(selectedSchedule.report.id, true);
    };

    // Save the given schedule
    var saveSchedule = function saveSchedule() {
        var requestParams = getScheduleParams($scope.selectedEntityDetails.report.id),
            onScheduleSaveSuccess = function onScheduleSaveSuccess() {
            $scope.errorMessage = '';
            $scope.updateViewCol($scope.viewColsActions.ONE);
            $scope.customExportsData.isNewExport = false;
            $scope.viewState.currentStage = STAGES.SHOW_CUSTOM_EXPORT_LIST;
            fetchCustomExportsAndExportFrequencies();
        },
            onScheduleSaveFailure = function onScheduleSaveFailure(error) {
            $scope.errorMessage = error;
            $scope.$emit(SHOW_ERROR_MSG_EVENT, error);
        };

        requestParams.id = $scope.selectedEntityDetails.id;

        $scope.callAPI(reportsSrv.updateSchedule, {
            params: requestParams,
            onSuccess: onScheduleSaveSuccess,
            onFailure: onScheduleSaveFailure
        });
    };

    // Process data space listing
    var processDataSpaceListing = function processDataSpaceListing() {
        initializeData();
        configureNewExport();
        $scope.customExportsData.isNewExport = true;
        $scope.updateView($scope.reportViewActions.SHOW_CUSTOM_NEW_EXPORT);
        $scope.updateViewCol($scope.viewColsActions.ONE);
    };

    // Set up all the listeners here
    var setUpListeners = function setUpListeners() {
        $scope.addListener('UPDATE_CUSTOM_EXPORT_SCHEDULE', function () {
            if (validateSchedule()) {
                saveSchedule();
            } else {
                fillValidationErrors();
                ngDialog.open({
                    template: '/assets/partials/reports/scheduleReport/rvCantCreateSchedule.html',
                    scope: $scope
                });
            }
        });

        $scope.addListener('SHOW_EXPORT_LISTING', function () {
            $scope.updateViewCol($scope.viewColsActions.ONE);
            $scope.viewState.currentStage = STAGES.SHOW_CUSTOM_EXPORT_LIST;
            $scope.selectedEntityDetails.active = false;
            resetPreviousSelections();
            $timeout(function () {
                refreshScroll(EXPORT_LIST_SCROLLER, true);
            }, 300);
        });

        $scope.addListener('CREATE_NEW_CUSTOM_EXPORT_SCHEDULE', function () {
            if (validateSchedule()) {
                createSchedule();
            } else {
                fillValidationErrors();
                ngDialog.open({
                    template: '/assets/partials/reports/scheduleReport/rvCantCreateSchedule.html',
                    scope: $scope
                });
            }
        });

        // Listener for creating new custom export
        $scope.addListener('CREATE_NEW_CUSTOM_EXPORT', function () {
            processDataSpaceListing();
        });

        $scope.addListener('RESET_CURRENT_STAGE', function () {
            $scope.viewState.currentStage = STAGES.SHOW_CUSTOM_EXPORT_LIST;
        });

        $scope.addListener('DELETE_CUSTOM_EXPORT_SCHEDULE', function () {
            confirmDelete();
        });
    };

    // Checks not run once case
    $scope.notRunOnce = function () {
        var match = _.find($scope.customExportsData.scheduleFrequencies, { id: $scope.scheduleParams.frequency_id }) || {};

        return match.value !== 'RUN_ONCE';
    };

    // Get repeats per string value
    $scope.getRepeatPer = function () {
        var found = _.find($scope.customExportsData.scheduleFreqTypes, { id: $scope.scheduleParams.frequency_id });

        return found ? found.value : 'Per';
    };

    // Checks the delivery type for the specific one passed as param
    $scope.checkDeliveryType = function (checkFor) {
        return checkFor === $scope.scheduleParams.delivery_id;
    };

    // Run digest cycle explicitly
    var runDigestCycle = function runDigestCycle() {
        if (!$scope.$$phase) {
            $scope.$digest();
        }
    };

    // Autocomplete options for user search
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
            var alreadyPresent = _.find($scope.emailList, function (email) {
                return email === ui.item.value;
            });

            if (!alreadyPresent) {
                $scope.emailList.push(ui.item.value);
            }
            this.value = '';

            runDigestCycle();
            refreshScroll(DELIVERY_OPTIONS_SCROLLER, true);

            return false;
        },
        focus: function focus() {
            return false;
        }
    };

    // Remove specific email from the emailing list
    $scope.removeEmail = function (index) {
        $scope.emailList = [].concat($scope.emailList.slice(0, index), $scope.emailList.slice(index + 1));

        refreshScroll(DELIVERY_OPTIONS_SCROLLER, true);
    };

    // Change handler for delivery options
    $scope.onDeliveryOptionChange = function () {
        // We are just clearing the cloud drive id only because the given id belongs to 
        // a single cloud drive account and if not cleared it will shows empty <option>
        // when the cloud account type is changed from the delivery options
        $scope.scheduleParams.selectedCloudAccount = null;
    };

    $scope.hasMinutesRepeat = function () {
        var freqType = _.find($scope.customExportsData.scheduleFreqTypes, {
            id: $scope.scheduleParams.frequency_id
        });

        return freqType && freqType.value === 'Minute';
    };

    /**
     * Reset previous selections
     */
    var resetPreviousSelections = function resetPreviousSelections() {
        $scope.customExportsScheduleParams.format = '';
        $scope.customExportsScheduleParams.exportName = '';
        $scope.selectedColumns = [];
        $scope.filterData = {
            appliedFilters: [],
            primaryFilter: ''
        };
        $scope.scheduleParams = {};
        $scope.emailList = [];
    };

    // Confirm user before deleting the schedule
    var confirmDelete = function confirmDelete() {
        ngDialog.open({
            template: '/assets/partials/reports/scheduleReport/rvConfirmDeleteSchedule.html',
            scope: $scope
        });
    };

    // Delete a schedule
    $scope.deleteSchedule = function () {
        var success = function success() {
            $scope.errorMessage = '';
            $scope.updateViewCol($scope.viewColsActions.ONE);
            $scope.customExportsData.isNewExport = false;
            $scope.viewState.currentStage = STAGES.SHOW_CUSTOM_EXPORT_LIST;
            fetchCustomExportsAndExportFrequencies();
        };

        var failed = function failed(errors) {
            $scope.errorMessage = errors;
        };

        $scope.closeDialog();
        $scope.callAPI(reportsSrv.deleteSchedule, {
            params: {
                id: $scope.selectedEntityDetails.id
            },
            onSuccess: success,
            onFailure: failed
        });
    };

    // Run the schedule now
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
        },
            getCloudAccountDetails = function getCloudAccountDetails(id) {
            var has;
            var ret = {
                description: ''
            };

            if ($scope.scheduleParams.delivery_id === 'GOOGLE DRIVE' && $scope.googleDriveAccountList.length) {
                has = _.find($scope.googleDriveAccountList, { id: id }) || ret;
                ret = {
                    description: has.description
                };
            }

            if ($scope.scheduleParams.delivery_id === 'DROPBOX' && $scope.dropBoxAccountList.length) {
                has = _.find($scope.dropBoxAccountList, { id: id }) || ret;
                ret = {
                    description: has.description
                };
            }

            return ret;
        };

        var showResponse = function showResponse() {
            $scope.runNowData = {
                isEmail: $scope.checkDeliveryType('EMAIL'),
                isFtp: $scope.checkDeliveryType('SFTP'),
                isGoogleDrive: $scope.checkDeliveryType('GOOGLE DRIVE'),
                isDropbox: $scope.checkDeliveryType('DROPBOX'),
                isSingleEmail: $scope.emailList.length === 1,
                ftpAddress: getFtpAddress($scope.scheduleParams.selectedFtpRecipient),
                cloudDetails: getCloudAccountDetails($scope.scheduleParams.selectedCloudAccount)
            };

            ngDialog.open({
                template: '/assets/partials/reports/scheduleReport/rvRunScheduleNowUpdate.html',
                scope: $scope
            });
        };

        var success = function success() {
            $scope.errorMessage = '';

            $scope.runScheduleNowSuccess = true;
            showResponse();
        };

        var failed = function failed(errors) {
            $scope.errorMessage = errors;

            $scope.runScheduleNowSuccess = false;
            showResponse();
        };

        $scope.callAPI(reportsSrv.runScheduleNow, {
            params: params,
            onSuccess: success,
            onFailure: failed
        });
    };

    /**
     *  Change handler for repeats 
     */
    $scope.changeRepeats = function () {
        refreshScroll(SCHEDULE_DETAILS_SCROLLER, true);
    };

    // Initialize the data
    var initializeData = function initializeData() {
        resetPreviousSelections();
        $scope.customExportsData.scheduledCustomExports = [];
        $scope.customExportsData.customExportDataSpaces = [];
        $scope.customExportsData.exportFormats = [];
        $scope.customExportsData.deliveryTypes = [];
        $scope.customExportsData.durations = [];
        $scope.viewState = {
            currentStage: STAGES.SHOW_CUSTOM_EXPORT_LIST
        };
        $scope.repeatMinutesMinVal = 0;
    };

    /**
     * Disable repeats every section
     */
    $scope.shallDisableRepeatsEvery = function () {
        return $scope.customExportsData.scheduleFrequencies && $scope.scheduleParams.frequency_id === _.find($scope.customExportsData.scheduleFrequencies, { value: 'RUN_DURING_EOD' }).id;
    };

    // Initialize the controller
    var init = function init() {
        $scope.customExportsData.isNewExport = false;
        initializeData();
        fetchCustomExportsAndExportFrequencies();
        initializeScrollers();
        setUpListeners();
    };

    init();
}]);