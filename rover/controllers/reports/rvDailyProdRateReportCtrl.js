'use strict';

/**
 * HOW DOES "chunkStoreComposer" (CSC) WORK?
 *
 * CSC is a composer function. It takes the API data and chunks it into months
 * The chunks itself is private protected within the closure generated when CSC is invoked
 * CSC returns a pure object (no inheritance) with three methods to interact with the protected chunks:
 *
 * getChunkNames
 * getCurChunk
 * jumpToChunk
 *
 * The next section will explain the flow of API -> chunksStore -> render & pagination
 */

/**
 * UNDERSTANDING THE FLOW
 *
 * Please read the previous section to undersand "chunkStoreComposer"
 *
 * In the sprit of writing functional programming, everything is spread across as pure function (almost)
 * Each function does one job and job only. It recieves a set of arguments, process and returns a new value.
 * Trying to be as pure as possible, meaning, DONT modify the arguments or other out of scope variables.
 *
 * 1. Generate "refDat" once. Recalculating can be tedious.
 * 2. Invote "init". Which creates the "chunkStore" an invoke "startProcessChunk"
 * 3. "startProcessChunk" calculates data for pagination and invokes "processChunk"
 * 3. "processChunk" invokes a set of functions to generate the yAxis rates, xAxis headers, xAxis data matrix
 * .. these datas are then loaded onto $scope. Finally it invokes "renderReact"
 * 4. "renderReact" takes the data from scope and renders the react component on screen
 *
 * FUNCTIONS INVOKED BY "processChunk"
 *
 * 1. "generateXaxisData"
 * .. recieves -> [ uiFilter, chosenReport, getFromUntilDates(chunk), shortMonthAndDate ]
 * .. returns -> { headerTop, headerBot, colSpan, colspanArray, rightPaneWidth }
 * 2. "genYaxisDataAndResults"
 * .. recieves -> [ chunk, refData ]
 * .. returns -> { yAxisLabels, modifiedResults }
 * .. modifiedResults is each report post filled with actual values of rate_id & rate_type_id and finally indexed with rate_id
 * 3. "generateResultData"
 * .. recieves -> [ yAxisLabels, modifiedResults ]
 * .. returns => { reportData } (for the current chunk)
 * .. reportData is 2D matrix representation of the actual data. Please read the code to understand its construction
 */

angular.module('sntRover').controller('RVDailyProdRateReport.Controller', ['$rootScope', '$scope', 'RVreportsSrv', 'RVreportsSubSrv', 'RVReportUtilsFac', 'RVReportParamsConst', 'RVReportMsgsConst', 'RVReportNamesConst', '$filter', '$timeout', '$state',
// eslint-disable-next-line max-params
function ($rootScope, $scope, reportsSrv, reportsSubSrv, reportUtils, reportParams, reportMsgs, reportNames, $filter, $timeout, $state) {
    var refData;
    var chunksStore;

    var UNDEFINED = {
        id: 'UNDEFINED',
        rate_type_id: 'UNDEFINED',
        name: 'Undefined'
    };

    var detailsCtrlScope = $scope.$parent,
        mainCtrlScope = detailsCtrlScope.$parent;

    var LEFT_PANE_SCROLL = 'left-pane-scroll',
        RIGHT_PANE_SCROLL = 'right-pane-scroll',
        TIMEOUT = 300,
        POLL = 1000;

    var refreshScrollers = function refreshScrollers() {
        if (mainCtrlScope.myScroll.hasOwnProperty(LEFT_PANE_SCROLL)) {
            $scope.refreshScroller(LEFT_PANE_SCROLL);
        }

        if (mainCtrlScope.myScroll.hasOwnProperty(RIGHT_PANE_SCROLL)) {
            $scope.refreshScroller(RIGHT_PANE_SCROLL);
        }
    };

    var setupScrollListner = function setupScrollListner() {
        mainCtrlScope.myScroll[LEFT_PANE_SCROLL].on('scroll', function () {
            mainCtrlScope.myScroll[RIGHT_PANE_SCROLL].scrollTo(0, this.y);
        });

        mainCtrlScope.myScroll[RIGHT_PANE_SCROLL].on('scroll', function () {
            mainCtrlScope.myScroll[LEFT_PANE_SCROLL].scrollTo(0, this.y);
        });
    };

    var isScrollReady = function isScrollReady() {
        if (mainCtrlScope.myScroll.hasOwnProperty(LEFT_PANE_SCROLL) && mainCtrlScope.myScroll.hasOwnProperty(RIGHT_PANE_SCROLL)) {
            setupScrollListner();
        } else {
            $timeout(isScrollReady, POLL);
        }
    };

    var destroyScrolls = function destroyScrolls() {
        mainCtrlScope.myScroll[LEFT_PANE_SCROLL].destroy();
        delete mainCtrlScope.myScroll[LEFT_PANE_SCROLL];

        mainCtrlScope.myScroll[RIGHT_PANE_SCROLL].destroy();
        delete mainCtrlScope.myScroll[RIGHT_PANE_SCROLL];
    };

    var watchShowAvailability, watchshowRevenue;

    var reportSubmited;
    var reportPrinting;
    var reportUpdated;
    var reportPageChanged;
    var reloadResultsListner;

    BaseCtrl.call(this, $scope);

    $scope.setScroller(LEFT_PANE_SCROLL, {
        'preventDefault': false,
        'probeType': 3
    });

    $scope.setScroller(RIGHT_PANE_SCROLL, {
        'preventDefault': false,
        'probeType': 3,
        'scrollX': true
    });

    $scope.$on('$destroy', destroyScrolls);

    isScrollReady();

    // default colspan value
    $scope.colSpan = 5;

    // ui filter by default showing both avail. and rev.
    $scope.uiFilter = {
        'showAvailability': true,
        'showRevenue': true
    };

    // cant disable both, when one disabled one the other should be enabled
    watchShowAvailability = $scope.$watch('uiFilter.showAvailability', function (newValue, oldValue) {
        if (newValue === oldValue) {
            return;
        }

        if (false === newValue && !$scope.uiFilter.showRevenue) {
            $scope.uiFilter.showRevenue = true;
        }

        $scope.$emit('showLoader');
        $timeout(reInit.bind(this, 'uiFilter.showAvailability'), TIMEOUT);
    });

    // cant disable both, when one disabled one the other should be enabled
    watchshowRevenue = $scope.$watch('uiFilter.showRevenue', function (newValue, oldValue) {
        if (newValue === oldValue) {
            return;
        }

        if (false === newValue && !$scope.uiFilter.showAvailability) {
            $scope.uiFilter.showAvailability = true;
        }

        $scope.$emit('showLoader');
        $timeout(reInit.bind(this, 'uiFilter.showRevenue'), TIMEOUT);
    });

    $scope.$on('$destroy', watchShowAvailability);
    $scope.$on('$destroy', watchshowRevenue);

    $scope.reactRenderDone = function () {
        refreshScrollers();
        $scope.$emit('hideLoader');
    };

    /**
     * initiates the rendering of the react component
     * @param  {any} args any additional config data
     * @return {object}      undefined
     */
    function renderReact(args) {
        var options = args || {},
            props = _.extend(options, {
            'rightPaneWidth': $scope.rightPaneWidth,
            'colspan': $scope.colSpan,
            'headerTop': $scope.headerTop,
            'headerBot': $scope.headerBot,
            'reportData': $scope.reportData,
            'colspanArray': $scope.colspanArray,
            'isLastRowSum': false,
            reactRenderDone: $scope.reactRenderDone
        });

        ReactDOM.render(
        // eslint-disable-next-line no-undef
        React.createElement(DPContent, props),
        // eslint-disable-next-line angular/document-service
        document.getElementById('daily-production-render'));
    }

    /**
     * generated the header data with dates and each sub-header values
     * this also allows to calculate few other things like total width
     * @param  {object} uiFilter          the two ui filter status
     * @param  {object} chosenReport      the choosen report from the report list page
     * @param  {object} dates             the duration of the report
     * @param  {string} shortMonthAndDate info on how we want to show the date
     * @return {object}                   computed datas { headerTop, headerBot, colSpan, colspanArray, rightPaneWidth }
     */
    function generateXaxisData(uiFilter, chosenReport, dates, shortMonthAndDate) {
        var SUB_HEADER_NAMES = {
            'ROOMS': 'Rooms #',
            'AVAILABLE_ROOMS': 'Avl. Rooms',
            /**/
            'FORECAST': 'Forecast.',
            'ADR': 'ADR',
            'ACTUAL': 'Actual Rev.',
            /**/
            'ADDON': 'Add-on', // >> This is to be shown IFF 'Options'->'Include Add-on Revenue' is checked
            'ARRIVALS': 'Arrivals',
            'ADULTS': 'Adults',
            'CHILDREN': 'Children',
            'FORECAST_FNB_REV': 'Forecast F&B Rev.',
            'ACTUAL_FNB_REV': 'Actual F&B Rev.',
            'FORECAST_OTHER_REV': 'Forecast Other Rev.',
            'ACTUAL_OTHER_REV': 'Actual Other Rev.',
            'FORECAST_TOTAL_REV': 'Forecast Total Rev.',
            'ACTUAL_TOTAL_REV': 'Actual Total Rev.'
        },
            headers,
            noOfDays = 0,
            cellWidth = 100;

        var headerTop = [];
        var headerBot = [];
        var colspanArray = [];
        var rightPaneWidth = 0;
        var colSpan = 0;

        var ms = new tzIndependentDate(dates.fromDate) * 1;
        var last = new tzIndependentDate(dates.untilDate) * 1;
        var ONE_DAY = 86400000;
        var isPastDay, currentHeaders;

        if (uiFilter.showAvailability && uiFilter.showRevenue) {
            headers = ['ROOMS', 'AVAILABLE_ROOMS', 'FORECAST', 'ADR'];
            // Header is initialized to FORECAST, If past date is selected it will be replaced with ACTUAL column
        } else if (!uiFilter.showAvailability && uiFilter.showRevenue) {
            headers = ['FORECAST', 'ADR'];
        } else if (uiFilter.showAvailability && !uiFilter.showRevenue) {
            headers = ['ROOMS', 'AVAILABLE_ROOMS'];
        }

        colSpan = headers.length;

        // compute Number of Days here!
        for (; ms <= last; ms += ONE_DAY) {
            isPastDay = new tzIndependentDate(ms) < new tzIndependentDate($rootScope.businessDate);

            headerTop.push({
                ms: ms,
                name: $filter('date')(ms, shortMonthAndDate)
            });
            currentHeaders = angular.copy(headers);

            if (isPastDay && uiFilter.showRevenue) {
                // Remove FORECAST header and push ACTUAL
                currentHeaders = _.without(currentHeaders, 'FORECAST').concat(['ACTUAL']);
                if (chosenReport.chosenOptions['include_addon_revenue']) {
                    currentHeaders.push('ADDON');
                }
            }
            currentHeaders.push('ARRIVALS', 'ADULTS', 'CHILDREN');

            if (uiFilter.showRevenue) {
                currentHeaders.push('FORECAST_FNB_REV', 'ACTUAL_FNB_REV', 'FORECAST_OTHER_REV', 'ACTUAL_OTHER_REV', 'FORECAST_TOTAL_REV', 'ACTUAL_TOTAL_REV');
            }

            colSpan = currentHeaders.length;

            colspanArray.push(currentHeaders.length);

            _.each(currentHeaders, function (idx) {
                headerBot.push({
                    'name': SUB_HEADER_NAMES[idx],
                    'cls': idx === headers.length - 1 ? 'day-end' : ''
                });
            });

            noOfDays += 1;
        }

        rightPaneWidth = noOfDays * cellWidth * _.max(colspanArray);

        return {
            headerTop: headerTop,
            headerBot: headerBot,
            colSpan: colSpan,
            colspanArray: colspanArray,
            rightPaneWidth: rightPaneWidth
        };
    }

    /**
     * generate the rate type name and in it the child rate name data which is
     * drawn on the left side as yAxis
     * generated a modified copy of results with each entry having its -
     * rate_name, rate_type_id and rate_type_name augmented.
     * @param  {array} results      results from the api
     * @param  {object} refData     processed data
     * @return {object}             computed data { yAxis, modifiedResults }
     */
    function genYaxisDataAndResults(results, refData) {
        var yAxis = [];
        var resultCopy = {};

        var matchedRate;
        var matchedRateType;
        var rateTypesInResults = {};
        var rateTypeId, rateId;

        _.each(results, function (dateObj, date) {
            _.each(dateObj, function (post) {
                rateId = post.rate_id;
                matchedRate = refData.allMappedRates[rateId];

                if (_.isUndefined(matchedRate)) {
                    post.rate_name = UNDEFINED.name;
                    matchedRateType = UNDEFINED;
                } else {
                    post.rate_name = matchedRate.rate_name || matchedRate.name;
                    matchedRateType = refData.allMappedRateTypes[matchedRate.rate_type_id];
                }

                rateTypeId = matchedRateType.rate_type_id;
                post.rate_type_id = matchedRateType.rate_type_id;
                post.rate_type_name = matchedRateType.name;

                if (!rateTypesInResults.hasOwnProperty(rateTypeId)) {
                    rateTypesInResults[rateTypeId] = {
                        id: rateTypeId,
                        name: post.rate_type_name,
                        rates_data: {}
                    };
                }

                rateTypesInResults[rateTypeId].rates_data[rateId] = {
                    id: rateId,
                    name: post.rate_name
                };
            });

            resultCopy[date] = _.indexBy(dateObj, 'rate_id');
        });

        _.each(rateTypesInResults, function (rateType) {
            yAxis.push({
                rate_type_id: rateType.id,
                name: rateType.name,
                is_rate_type: true
            });

            if (rateType.name !== UNDEFINED.name) {
                _.each(rateType.rates_data, function (rates) {
                    yAxis.push({
                        rate_id: rates.id,
                        name: rates.name,
                        is_rate_type: false
                    });
                });
            }
        });

        return {
            yAxis: yAxis,
            modifiedResults: resultCopy
        };
    }

    /**
     * generate the 2D matrix data that will fill the content part of the report
     * @param  {array} yAxis     generated yAxis data with rate types and rates to help fill horizontally
     * @param  {array} results   modified api results that will help fill vertically
     * @return {array}           composed array of array representing the data
     */
    function generateResultData(yAxis, results) {
        var resultData = [];
        var matchedPost;
        var currDateData;
        var allDateData;

        _.each(yAxis, function (yAxisItem) {
            allDateData = [];

            _.each(results, function (dateObj, date) {
                currDateData = {
                    date: date,
                    businessDate: $rootScope.businessDate,
                    currencySymbol: $rootScope.currencySymbol,
                    showAvailability: $scope.uiFilter.showAvailability,
                    showRevenue: $scope.uiFilter.showRevenue
                };

                // if is a rate type there is not actual data
                // fill the placeholders anyway
                if (yAxisItem.is_rate_type) {
                    currDateData.isRateType = true;
                    currDateData.data = valueAdder(groupByKeyValue(dateObj, 'rate_type_id', yAxisItem.rate_type_id));
                } else {
                    matchedPost = _.find(dateObj, { rate_id: yAxisItem.rate_id });
                    currDateData.isRateType = false;
                    currDateData.data = matchedPost;
                }

                allDateData.push(insertOneDateData(currDateData)); // [ [{}, {}..], [{}, {}...], ... ]
            });

            resultData.push(_.flatten(allDateData));
        });

        return resultData;
    }

    /**
     * insert one date's rate / rate type data into the 2D matrix horizontally
     * called repeatedly to fill horizontally (for a rate/type), filling each date each time
     * @param  {object} options config and data passed in
     * @return {array}         partial array containing data of a single date
     */
    function insertOneDateData(options) {
        var limiter = 2,
            eachDateVal = [],
            isPastDay = new tzIndependentDate(options.date) < new tzIndependentDate(options.businessDate);

        var data = _.extend({
            adr: 0,
            available_rooms_count: 0,
            occupied_rooms_count: 0,
            rate_id: 0,
            room_revenue: 0
        }, options.data);

        if (options.showAvailability && !options.showRevenue) {
            eachDateVal.push({
                value: data.occupied_rooms_count,
                isAvail: true,
                isRateType: options.isRateType
            });
            eachDateVal.push({
                value: data.available_rooms_count,
                isAvail: true,
                isRateType: options.isRateType
            });
        } else if (!options.showAvailability && options.showRevenue) {
            if (!isPastDay) {
                eachDateVal.push({
                    value: $filter('currency')(data.room_revenue, options.currencySymbol, limiter),
                    isRev: true,
                    isRateType: options.isRateType
                });
            }
            eachDateVal.push({
                value: $filter('currency')(data.adr, options.currencySymbol, limiter),
                isRev: true,
                isRateType: options.isRateType
            });
            if (isPastDay) {
                eachDateVal.push({
                    value: $filter('currency')(data.room_revenue, options.currencySymbol, limiter),
                    isRev: true,
                    isRateType: options.isRateType
                });
            }
        } else if (options.showAvailability && options.showRevenue) {
            eachDateVal.push({
                value: data.occupied_rooms_count,
                isAvail: true,
                isRateType: options.isRateType
            });
            eachDateVal.push({
                value: data.available_rooms_count,
                isAvail: true,
                isRateType: options.isRateType
            });
            if (!isPastDay) {
                eachDateVal.push({
                    value: $filter('currency')(data.room_revenue, options.currencySymbol, limiter),
                    isRev: true,
                    isRateType: options.isRateType
                });
            }
            eachDateVal.push({
                value: $filter('currency')(data.adr, options.currencySymbol, limiter),
                isRev: true,
                isRateType: options.isRateType
            });

            if (isPastDay) {
                eachDateVal.push({
                    value: $filter('currency')(data.room_revenue, options.currencySymbol, limiter),
                    isRev: true,
                    isRateType: options.isRateType
                });
            }
        }

        eachDateVal.push({
            value: data.arrivals,
            isAvail: true,
            isRateType: options.isRateType
        });
        eachDateVal.push({
            value: data.adults,
            isAvail: true,
            isRateType: options.isRateType
        });
        eachDateVal.push({
            value: data.children,
            isAvail: true,
            isRateType: options.isRateType
        });

        if (options.showRevenue) {
            eachDateVal.push({
                value: $filter('currency')(data.fnb_future_revenue, options.currencySymbol, limiter),
                isRev: true,
                isRateType: options.isRateType
            });
            eachDateVal.push({
                value: $filter('currency')(data.fnb_actual_revenue, options.currencySymbol, limiter),
                isRev: true,
                isRateType: options.isRateType
            });
            eachDateVal.push({
                value: $filter('currency')(data.others_future_revenue, options.currencySymbol, limiter),
                isRev: true,
                isRateType: options.isRateType
            });
            eachDateVal.push({
                value: $filter('currency')(data.others_actual_revenue, options.currencySymbol, limiter),
                isRev: true,
                isRateType: options.isRateType
            });
            eachDateVal.push({
                value: $filter('currency')(data.total_future_revenue, options.currencySymbol, limiter),
                isRev: true,
                isRateType: options.isRateType
            });
            eachDateVal.push({
                value: $filter('currency')(data.total_actual_revenue, options.currencySymbol, limiter),
                isRev: true,
                isRateType: options.isRateType
            });
        }

        return eachDateVal;
    }

    /**
     * Take each chunk passed onto and generate the data (yaxis, headers, xaxis) etc
     * for just that chunk. After processing trigger React to re-render
     * @param  {object} chunk the month long chunk
     * @return {object}       undefined
     */
    function processChunks(chunk) {
        var genXAxis, genYAxis, modifiedResults;

        if (!_.has($scope.chosenReport, 'hasRateFilter')) {
            return;
        }

        genXAxis = generateXaxisData($scope.uiFilter, $scope.chosenReport, getFromUntilDates(chunk), $rootScope.shortMonthAndDate);
        $scope.headerTop = genXAxis.headerTop;
        $scope.headerBot = genXAxis.headerBot;
        $scope.colSpan = genXAxis.colSpan;
        $scope.colspanArray = genXAxis.colspanArray;
        $scope.rightPaneWidth = genXAxis.rightPaneWidth;

        genYAxis = genYaxisDataAndResults(chunk, refData);
        $scope.yAxisLabels = genYAxis.yAxis;
        modifiedResults = genYAxis.modifiedResults;

        $scope.reportData = generateResultData($scope.yAxisLabels, modifiedResults);

        renderReact();
    }

    $scope.jumpToMonth = function (index) {
        chunksStore.jumpToChunk(index);
        startProcessChunk();
    };
    /**
     * called immediatly after the chunk store is created.
     * @return {object} undefined
     */
    function startProcessChunk() {
        $scope.$emit('showLoader');
        $timeout(function () {
            var currentMonthIndex;

            processChunks(chunksStore.getCurChunk());
            $scope.reportMonths = [];
            $scope.reportMonths = chunksStore.getChunkNames();
            $scope.reportMonthTrack = {};

            currentMonthIndex = _.findIndex($scope.reportMonths, { isActive: true });
            $scope.reportMonthTrack.curr = $scope.reportMonths[currentMonthIndex];

            if (currentMonthIndex > 0) {
                $scope.reportMonthTrack.prev = $scope.reportMonths[currentMonthIndex - 1];
            } else {
                $scope.reportMonthTrack.prev = false;
            }

            if (currentMonthIndex < $scope.reportMonths.length) {
                $scope.reportMonthTrack.next = $scope.reportMonths[currentMonthIndex + 1];
            } else {
                $scope.reportMonthTrack.next = false;
            }
        }, TIMEOUT);
    }

    /**
     * initialization, entry
     * @return {object} undefined
     */
    function init() {
        var results = mainCtrlScope.results;

        // If the controller is invoked from report inbox, its for print only
        if ($state.current.name === 'rover.reports.inbox') {
            $scope.isPrintClicked = true;
        }

        chunksStore = chunksStoreComposer(results);
        startProcessChunk();
    }

    /**
     * re-initialize everything
     * @return {object} undefined
     */
    function reInit() {
        init();
    }

    refData = processOnce($scope.chosenReport.hasRateFilter.data, $scope.chosenReport.hasRateTypeFilter.data);
    init();

    /**
     * Utility helper functions used by the above code
     * keeping this section seperated from above
     */

    /**
     * preform these just once
     * @param  {array} allRates     all rates
     * @param  {array} allRateTypes all rate types
     * @return {object}              processed data source
     */
    function processOnce(allRates, allRateTypes) {
        return {
            allMappedRates: _.indexBy(allRates, 'id'),
            allMappedRateTypes: _.indexBy(allRateTypes, 'rate_type_id')
        };
    }

    /**
     * similar to the groupBy method on Underscore, except we specify the
     * exact value we are looking for in the subset/modified-set groupBy creates
     * @param  {array} source array of items
     * @param  {string} key    name of the key in each item
     * @param  {number|string} value  the exact value we are looking for
     * @return {array}        the found sub-set of source
     */
    function groupByKeyValue(source, key, value) {
        var grouped = [];

        _.each(source, function (item) {
            if (item[key] === value) {
                grouped.push(item);
            }
        });

        return grouped;
    }

    /**
     * adds up the key-values of entries in an array, specifically for rate postings
     * @param  {array} source the array of entries
     * @return {object}        calculated totals
     */
    function valueAdder(source) {
        var adr;
        var totals = {
            adr: 0,
            available_rooms_count: 0,
            occupied_rooms_count: 0,
            room_revenue: 0,
            arrivals: 0,
            adults: 0,
            children: 0,
            fnb_future_revenue: 0,
            fnb_actual_revenue: 0,
            others_future_revenue: 0,
            others_actual_revenue: 0,
            total_future_revenue: 0,
            total_actual_revenue: 0
        };
        var parser = function parser(value) {
            var parsed = parseFloat(value);

            return isNaN(parsed) ? 0 : parsed;
        };

        _.each(source, function (item) {
            totals.available_rooms_count = item.available_rooms_count;
            totals.occupied_rooms_count += parser(item.occupied_rooms_count);
            totals.room_revenue += parser(item.room_revenue);
            totals.arrivals += item.arrivals;
            totals.adults += item.adults;
            totals.children += item.children;
            totals.fnb_future_revenue += parser(item.fnb_future_revenue);
            totals.fnb_actual_revenue += parser(item.fnb_actual_revenue);
            totals.others_future_revenue += parser(item.others_future_revenue);
            totals.others_actual_revenue += parser(item.others_actual_revenue);
            totals.total_future_revenue += parser(item.total_future_revenue);
            totals.total_actual_revenue += parser(item.total_actual_revenue);
        });
        adr = totals.room_revenue / totals.occupied_rooms_count;
        totals.adr = _.isFinite(adr) ? adr : 0;

        return totals;
    }

    /**
     * find the start date and end date of the chunk
     * it may not start from day one to day end;
     * @param  {object} chunk a month chunk
     * @return {object}       processed dates
     */
    function getFromUntilDates(chunk) {
        var fullDates = _.keys(chunk),
            singleDate,
            dayNum,
            monNum,
            mapData = [],
            maxMonthDates = [],
            minMonthDates = [],
            dateObject;

        _.map(fullDates, function (date) {
            singleDate = date;
            dateObject = {
                dayNum: parseInt(date.split('-')[2], 10),
                monNum: parseInt(date.split('-')[1], 10)
            };

            mapData.push(dateObject);
            return isNaN(dayNum) ? 1 : dayNum;
        });

        var months = _.map(fullDates, function (date) {
            monNum = parseInt(date.split('-')[1], 10);
            return isNaN(monNum) ? 1 : monNum;
        });

        var minMonth = _.min(months),
            maxMonth = _.max(months);

        _.each(mapData, function (dateObj) {
            if (dateObj.monNum === minMonth) {
                minMonthDates.push(dateObj);
            }
            if (dateObj.monNum === maxMonth) {
                maxMonthDates.push(dateObj);
            }
        });

        var minMonthDatesArr = _.map(minMonthDates, function (dateObj) {
            return isNaN(dateObj.dayNum) ? 1 : dateObj.dayNum;
        });

        var maxMonthDatesArr = _.map(maxMonthDates, function (dateObj) {
            return isNaN(dateObj.dayNum) ? 1 : dateObj.dayNum;
        });

        var minDay = _.min(minMonthDatesArr);
        var maxDay = _.max(maxMonthDatesArr);

        var sdSplit = singleDate.split('-');

        return {
            fromDate: sdSplit[0] + '-' + minMonth + '-' + minDay,
            untilDate: sdSplit[0] + '-' + maxMonth + '-' + maxDay
        };
    }

    /**
     * takes in the full api data and chunks it out into smaller pieces for each month
     * the chunks is private to the closure created when this funtion is invokes
     * the returned pure object provides method to interact with the private chunks
     *
     * @param  {object} data the full api response recieved
     * @return {object}      the composed object that can access the private data
     */
    function chunksStoreComposer(data) {
        var apiData = data || {};

        var chunks = {};
        var meta = {
            keys: [],
            length: 0,
            index: 0
        };

        var beautifyName = function beautifyName(date) {
            var split = date.split('-');
            var year = split[0];
            var month = split[1];
            var monthName = 'Default';

            switch (month) {
                case '01':
                    monthName = 'Jan';
                    break;

                case '02':
                    monthName = 'Feb';
                    break;

                case '03':
                    monthName = 'Mar';
                    break;

                case '04':
                    monthName = 'Apr';
                    break;

                case '05':
                    monthName = 'May';
                    break;

                case '06':
                    monthName = 'Jun';
                    break;

                case '07':
                    monthName = 'Jul';
                    break;

                case '08':
                    monthName = 'Aug';
                    break;

                case '09':
                    monthName = 'Sep';
                    break;

                case '10':
                    monthName = 'Oct';
                    break;

                case '11':
                    monthName = 'Nov';
                    break;

                case '12':
                    monthName = 'Dec';
                    break;

                default:
                    break;
            }

            return monthName + ' ' + year;
        };

        var getChunkNamesGetter = function getChunkNamesGetter(meta) {
            return function () {
                var names = [];

                names = _.map(meta.keys, function (key, index) {
                    return {
                        isActive: index === meta.index,
                        index: index,
                        name: beautifyName(key)
                    };
                });

                return names;
            };
        };

        var getCurChunkGetter = function getCurChunkGetter(chunks, meta) {
            return function () {
                return chunks[meta.keys[meta.index]] || {};
            };
        };

        var jumpToChunkGetter = function jumpToChunkGetter(chunks, meta) {
            return function (index) {
                var chunk;

                if (index >= 0 && index < meta.length) {
                    meta.index = index;
                    chunk = chunks[meta.keys[index]];
                } else {
                    chunk = {};
                }

                return chunk;
            };
        };

        var YM_LEN = 7;
        var yymm;

        _.each(apiData, function (dateObj, date) {
            yymm = date.slice(0, YM_LEN);

            if (!chunks.hasOwnProperty(yymm)) {
                chunks[yymm] = {};
            }

            chunks[yymm][date] = dateObj;
        });

        meta.keys = _.keys(chunks);
        meta.length = meta.keys.length;

        if ($scope.isPrintClicked) {
            var mergedData = {};

            if (meta.length > 1) {
                _.each(chunks, function (dateObj) {
                    _.each(dateObj, function (dataObj, date) {
                        if (!mergedData[date]) {
                            mergedData[date] = dataObj;
                        }
                    });
                });
                chunks[meta.keys[0]] = mergedData;
            }
        }

        meta.index = 0;

        return {
            getChunkNames: getChunkNamesGetter(meta),
            getCurChunk: getCurChunkGetter(chunks, meta),
            jumpToChunk: jumpToChunkGetter(chunks, meta)
        };
    }

    reportSubmited = $scope.$on(reportMsgs['REPORT_SUBMITED'], function () {
        $scope.isPrintClicked = false;
        reInit();
    });
    reportPrinting = $scope.$on(reportMsgs['REPORT_PRINTING'], reInit);
    reportUpdated = $scope.$on(reportMsgs['REPORT_UPDATED'], reInit);
    reportPageChanged = $scope.$on(reportMsgs['REPORT_PAGE_CHANGED'], reInit);
    reloadResultsListner = $rootScope.$on('RELOAD_RESULTS', function () {
        $scope.isPrintClicked = true;
        reInit();
    });

    $scope.$on('$destroy', reportSubmited);
    $scope.$on('$destroy', reportUpdated);
    $scope.$on('$destroy', reportPrinting);
    $scope.$on('$destroy', reportPageChanged);
    $scope.$on('$destroy', reloadResultsListner);
}]);