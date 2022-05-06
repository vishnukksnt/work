'use strict';

angular.module('sntRover').controller('RVCustomExportFilterCtrl', ['$scope', 'RVCustomExportSrv', '$timeout', 'RVCustomExportsUtilFac', 'sntActivity', function ($scope, RVCustomExportSrv, $timeout, RVCustomExportsUtilFac, sntActivity) {

    BaseCtrl.call(this, $scope);

    var filterTypes = {
        OPTIONS: 'OPTION',
        DURATION: 'DURATION',
        RANGE: 'RANGE',
        GENERAL: 'GENERAL'
    };

    var CUSTOM_EXPORT_FILTERS_SCROLLER = 'custom-export-filters-scroller';
    var SCROLL_REFRESH_DELAY = 100;

    // Set the scroller
    $scope.setScroller(CUSTOM_EXPORT_FILTERS_SCROLLER, {
        tap: true,
        preventDefault: false
    });

    // Refreshes the scroller
    $scope.refreshFilterScroller = function (reset) {
        $timeout(function () {
            $scope.refreshScroller(CUSTOM_EXPORT_FILTERS_SCROLLER);
        }, 1000);

        if (!!reset && $scope.myScroll.hasOwnProperty(CUSTOM_EXPORT_FILTERS_SCROLLER)) {
            $scope.myScroll[CUSTOM_EXPORT_FILTERS_SCROLLER].scrollTo(0, 0, SCROLL_REFRESH_DELAY);
        }
    };

    var createDurationEntry = function createDurationEntry(filterType, selectedFirstLevel, selectedSecondLevel) {
        var fieldsCopy = angular.copy($scope.selectedEntityDetails.processedFilters[filterType]),
            filterFields = removeAlreadyExistsDurationFieldNames(fieldsCopy),
            filterConfig = {
            firstLevelData: filterFields,
            secondLevelData: $scope.customExportsData.durations,
            selectedFirstLevel: selectedFirstLevel || '',
            selectedSecondLevel: selectedSecondLevel || '',
            isDuration: true
        };

        return filterConfig;
    },
        createRangeEntry = function createRangeEntry(filterType, selectedFirstLevel, selectedSecondLevel, rangeValue) {
        var fieldsCopy = angular.copy($scope.selectedEntityDetails.processedFilters[filterType]),
            filterFields = removeAlreadyExistsRangeFieldNames(fieldsCopy),
            filterConfig = {
            firstLevelData: filterFields,
            secondLevelData: RVCustomExportsUtilFac.getRangeOperators(),
            selectedFirstLevel: selectedFirstLevel || '',
            selectedSecondLevel: selectedSecondLevel || '',
            isRange: true,
            rangeValue: rangeValue || ''
        };

        return filterConfig;
    },
        createOptionEntry = function createOptionEntry(filterType, selectedFirstLevel, selectedSecondLevel) {
        var fieldsCopy = angular.copy($scope.selectedEntityDetails.processedFilters[filterType]),
            filterFields = removeAlreadyExistsOptionFieldNames(fieldsCopy),
            filterConfig = {
            firstLevelData: filterFields,
            secondLevelData: [],
            selectedFirstLevel: selectedFirstLevel || '',
            selectedSecondLevel: selectedSecondLevel || '',
            options: [],
            isOption: true
        };

        return filterConfig;
    },
        removeAlreadyExistsOptionFieldNames = function removeAlreadyExistsOptionFieldNames(fields) {
        var selectedOptionsFilter = _.filter($scope.filterData.appliedFilters, { isOption: true }),
            selectedOptionsName = _.pluck(selectedOptionsFilter, 'selectedFirstLevel'),
            availableFields = [];

        availableFields = _.filter(fields, function (each) {
            return selectedOptionsName.indexOf(each.value) === -1;
        });

        return availableFields;
    },
        removeAlreadyExistsRangeFieldNames = function removeAlreadyExistsRangeFieldNames(fields) {
        var availableRangeFieldNames = [];

        _.each(fields, function (each) {
            var selectedRangeFieldNames = _.filter($scope.filterData.appliedFilters, {
                isRange: true,
                selectedFirstLevel: each.value
            });

            if (selectedRangeFieldNames.length !== RVCustomExportsUtilFac.getRangeOperators().length) {
                availableRangeFieldNames.push(each);
            }
        });

        return availableRangeFieldNames;
    },
        removeAlreadyExistsDurationFieldNames = function removeAlreadyExistsDurationFieldNames(fields) {
        var availableDurationFieldNames = [];

        _.each(fields, function (each) {
            var selectedDurationFieldName = _.find($scope.filterData.appliedFilters, {
                selectedFirstLevel: each.value
            });

            if (!selectedDurationFieldName) {
                availableDurationFieldNames.push(each);
            }
        });

        return availableDurationFieldNames;
    },
        createGeneralFilterEntry = function createGeneralFilterEntry(filterType, selectedFirstLevel, selectedSecondLevel) {
        var fieldsCopy = angular.copy($scope.selectedEntityDetails.processedFilters[filterType]),
            filterFields = removeAlreadyExistsGeneralFilterFields(fieldsCopy),
            filterConfig = {
            firstLevelData: filterFields,
            secondLevelData: [],
            selectedFirstLevel: selectedFirstLevel || '',
            selectedSecondLevel: selectedSecondLevel || '',
            options: [],
            isGeneral: true
        };

        return filterConfig;
    },
        removeAlreadyExistsGeneralFilterFields = function removeAlreadyExistsGeneralFilterFields(fields) {
        var availableGeneralFilterFieldNames = [];

        _.each(fields, function (each) {
            var selectedGeneralFilterFieldNames = _.filter($scope.filterData.appliedFilters, {
                isGeneral: true,
                selectedFirstLevel: each.value
            });

            if (selectedGeneralFilterFieldNames.length !== RVCustomExportsUtilFac.getGeneralOperators().length) {
                availableGeneralFilterFieldNames.push(each);
            }
        });

        return availableGeneralFilterFieldNames;
    };

    // Creates new filter entry object
    var createNewFilterEntry = function createNewFilterEntry(filterType) {
        var filter;

        if (filterTypes.DURATION === filterType) {
            filter = createDurationEntry(filterType);
        } else if (filterTypes.RANGE === filterType) {
            filter = createRangeEntry(filterType);
        } else if (filterTypes.OPTIONS === filterType) {
            filter = createOptionEntry(filterType);
        } else if (filterTypes.GENERAL === filterType) {
            filter = createGeneralFilterEntry(filterType);
        }

        return filter;
    };

    // Handler for primary filter change
    $scope.changePrimaryFilter = function () {
        $scope.filterData.appliedFilters.push(createNewFilterEntry($scope.filterData.primaryFilter));
        $scope.filterData.primaryFilter = '';
        $scope.refreshFilterScroller();
    };

    // Remove a particular filter
    $scope.removeFilter = function (filterPos) {
        $scope.filterData.appliedFilters.splice(filterPos, 1);
    };

    // Handler for first level field change
    $scope.onFirstLevelFieldChange = function (selectedFieldName, filterPos, selectedSecondLevel, rangeValue) {
        var selectedFilter = $scope.filterData.appliedFilters[filterPos];

        if (!selectedFieldName && selectedFilter) {
            selectedFilter.options = {};
            selectedFilter.secondLevelData = [];
            selectedFilter.selectedFirstLevel = selectedFieldName;
            selectedFilter.isMultiSelect = false;
            selectedFilter.hasDualState = false;
            return;
        }

        if (selectedFilter.isOption) {
            sntActivity.start('LOAD_FILTERS');
            removeKeysFromObj(selectedFilter, ['isRange', 'isDuration', 'secondLevelData', 'selectedSecondLevel', 'options', 'rangeValue', 'isMultiSelect', 'hasDualState', 'isGeneral']);
            RVCustomExportsUtilFac.populateOptions(selectedFieldName, selectedFilter, selectedSecondLevel).then(function (filter) {
                selectedFilter = filter;
                sntActivity.stop('LOAD_FILTERS');
            });
        } else if (selectedFilter.isRange) {
            removeKeysFromObj(selectedFilter, ['isOption', 'isDuration', 'secondLevelData', 'selectedSecondLevel', 'options', 'rangeValue', 'isMultiSelect', 'hasDualState', 'isGeneral']);
            RVCustomExportsUtilFac.populateRangeOperators(selectedFieldName, selectedFilter, $scope.filterData.appliedFilters, selectedSecondLevel, rangeValue);
        } else if (selectedFilter.isGeneral) {
            removeKeysFromObj(selectedFilter, ['isOption', 'isDuration', 'secondLevelData', 'selectedSecondLevel', 'options', 'rangeValue', 'isMultiSelect', 'hasDualState', 'isRange']);
            RVCustomExportsUtilFac.populateGeneralOperators(selectedFieldName, selectedFilter, $scope.filterData.appliedFilters, selectedSecondLevel);
        }
    };

    // Remove all the selected filters
    $scope.removeAllFilters = function () {
        $scope.filterData.appliedFilters = [];
        $scope.refreshFilterScroller();
    };

    // Process the filters which are already added and populate the dropdowns
    var processFilterSelections = function processFilterSelections() {
        var filterValues = $scope.selectedEntityDetails.filter_values,
            filterFields = $scope.selectedEntityDetails.filters,
            filterType,
            filter;

        RVCustomExportSrv.processFilterSelections(filterValues).then(function () {
            _.each(filterValues, function (value, key) {
                key = key.toUpperCase();
                filterType = _.find(filterFields, { value: key }).filter_type;
                if (filterType === filterTypes.DURATION) {
                    filter = createDurationEntry(filterType, key, value);
                    $scope.filterData.appliedFilters.push(filter);
                } else if (filterType === filterTypes.RANGE) {
                    _.each(value, function (each) {
                        filter = createRangeEntry(filterType, key, each.operator, each.value);
                        $scope.filterData.appliedFilters.push(filter);
                        $scope.onFirstLevelFieldChange(key, $scope.filterData.appliedFilters.length - 1, each.operator, each.value);
                    });
                } else if (filterType === filterTypes.OPTIONS) {
                    filter = createOptionEntry(filterType, key);
                    $scope.filterData.appliedFilters.push(filter);
                    $scope.onFirstLevelFieldChange(key, $scope.filterData.appliedFilters.length - 1, value);
                } else if (filterType === filterTypes.GENERAL) {
                    filter = createGeneralFilterEntry(filterType, key);
                    $scope.filterData.appliedFilters.push(filter);
                    $scope.onFirstLevelFieldChange(key, $scope.filterData.appliedFilters.length - 1, value);
                }
            });
        });
    };

    // Listener for the update filter selections during edit
    $scope.addListener('UPDATE_FILTER_SELECTIONS', function () {
        processFilterSelections();
    });

    // Hide condition for option filter
    $scope.shouldHideOptionFilter = function () {
        var appliedOptionFilters = _.filter($scope.filterData.appliedFilters, function (filter) {
            return filter.isOption;
        }),
            availableOptionsFilters = $scope.selectedEntityDetails && $scope.selectedEntityDetails.processedFilters && $scope.selectedEntityDetails.processedFilters['OPTION'];

        return !availableOptionsFilters || availableOptionsFilters && availableOptionsFilters.length === appliedOptionFilters.length;
    };

    // Hide condition for range filter
    $scope.shouldHideRangeFilter = function () {
        var appliedRangeFilters = _.filter($scope.filterData.appliedFilters, function (filter) {
            return filter.isRange;
        }),
            availableRangeFilters = $scope.selectedEntityDetails && $scope.selectedEntityDetails.processedFilters && $scope.selectedEntityDetails.processedFilters['RANGE'];

        // We can choose 3 operators for each of the field, and hence the 3 in the condition below
        return !availableRangeFilters || availableRangeFilters && availableRangeFilters.length * RVCustomExportsUtilFac.getRangeOperators().length === appliedRangeFilters.length;
    };

    // Hide condition for duration filter
    $scope.shouldHideDurationFilter = function () {
        var appliedDurationFilters = _.filter($scope.filterData.appliedFilters, function (filter) {
            return filter.isDuration;
        }),
            availableDurationFilters = $scope.selectedEntityDetails && $scope.selectedEntityDetails.processedFilters && $scope.selectedEntityDetails.processedFilters['DURATION'];

        return !availableDurationFilters || availableDurationFilters && availableDurationFilters.length === appliedDurationFilters.length;
    };

    // Hide condition for add filter btn
    $scope.shouldHideAddFilter = function () {
        var optionFilterCount = $scope.selectedEntityDetails && $scope.selectedEntityDetails.processedFilters && $scope.selectedEntityDetails.processedFilters['OPTION'] && $scope.selectedEntityDetails.processedFilters['OPTION'].length || 0,
            durationFilterCount = $scope.selectedEntityDetails && $scope.selectedEntityDetails.processedFilters && $scope.selectedEntityDetails.processedFilters['DURATION'] && $scope.selectedEntityDetails.processedFilters['DURATION'].length || 0,
            rangeFiltersCount = $scope.selectedEntityDetails && $scope.selectedEntityDetails.processedFilters && $scope.selectedEntityDetails.processedFilters['RANGE'] && $scope.selectedEntityDetails.processedFilters['RANGE'].length * RVCustomExportsUtilFac.getRangeOperators().length || 0,
            generalFiltersCount = $scope.selectedEntityDetails && $scope.selectedEntityDetails.processedFilters && $scope.selectedEntityDetails.processedFilters['GENERAL'] && $scope.selectedEntityDetails.processedFilters['GENERAL'].length * RVCustomExportsUtilFac.getGeneralOperators().length || 0;

        return $scope.filterData.appliedFilters.length === optionFilterCount + durationFilterCount + rangeFiltersCount + generalFiltersCount;
    };

    // This will be called when the last item in the filter list is rendered
    $scope.onFilterProcessComplete = function () {
        $scope.refreshFilterScroller(true);
    };

    // Hide condition for general filter
    $scope.shouldHideGeneralFilter = function () {
        var appliedGeneralFilters = _.filter($scope.filterData.appliedFilters, function (filter) {
            return filter.isGeneral;
        }),
            availableGeneralFilters = $scope.selectedEntityDetails && $scope.selectedEntityDetails.processedFilters && $scope.selectedEntityDetails.processedFilters['GENERAL'];

        return !availableGeneralFilters || availableGeneralFilters && availableGeneralFilters.length * RVCustomExportsUtilFac.getGeneralOperators().length === appliedGeneralFilters.length;
    };
}]);