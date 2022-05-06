angular.module('sntRover')
    .controller('rvHKOverviewAnalticsCtrl', ['$scope', 'sntActivity', '$timeout', '$filter', 'rvAnalyticsHelperSrv', 'rvAnalyticsSrv',
        function($scope, sntActivity, $timeout, $filter, rvAnalyticsHelperSrv, rvAnalyticsSrv) {
            var initialBaseHrefValue = $('base').attr('href');
            var colorMappings = {
                "arrivals_perfomed": rvAnalyticsHelperSrv.constructColorMappings('arrivals_perfomed', 'greenLight'),
                "arrivals_remaining": rvAnalyticsHelperSrv.constructColorMappings('arrivals_remaining', 'green'),

                "departures_perfomed": rvAnalyticsHelperSrv.constructColorMappings('departures_perfomed', 'redLight'),
                "departures_pending": rvAnalyticsHelperSrv.constructColorMappings('departures_pending', 'red'),

                "stayovers_perfomed": rvAnalyticsHelperSrv.constructColorMappings('stayovers_perfomed', 'blueLight'),
                "stayovers_remaining": rvAnalyticsHelperSrv.constructColorMappings('stayovers_remaining', 'blue'),

                "rooms_clean": rvAnalyticsHelperSrv.constructColorMappings('rooms_clean', 'green'),
                "rooms_inspected": rvAnalyticsHelperSrv.constructColorMappings('rooms_inspected', 'greenDark'),
                "rooms_dirty": rvAnalyticsHelperSrv.constructColorMappings('rooms_dirty', 'red'),
                "rooms_pickup": rvAnalyticsHelperSrv.constructColorMappings('rooms_pickup', 'orange')
            };

            var drawHkOverviewChart = function(chartDetails) {

                $scope.screenData.mainHeading = $filter('translate')(chartDetails.chartData.label);
                var chartAreaWidth = document.getElementById("dashboard-analytics-chart").clientWidth;
                var margin = {
                        top: 50,
                        right: 50,
                        bottom: 30,
                        left: 50
                    },
                    width = chartAreaWidth - margin.left - margin.right,
                    maxHeight = 500,
                    calculatedHeight = window.innerHeight * (1 / 2 + 2 / 3) / 2 - margin.top - margin.bottom,
                    height = calculatedHeight > maxHeight ? maxHeight : calculatedHeight;

                var yScale = d3.scaleBand()
                    .rangeRound([0, height + 10])
                    .padding(.5);

                var xScale = d3.scaleLinear()
                    .rangeRound([0, width]);

                var xAxis = d3.axisBottom()
                    .scale(xScale)
                    .tickSizeOuter(0)
                    .ticks(10)
                    .tickSizeInner(-height)
                    .tickFormat(function(d) {
                        // X axis... treat -ve values as positive
                        return (d < 0) ? (d * -1) : d === 0 ? "" : d;
                    })
                    .tickPadding(15);

                var yAxis = d3.axisLeft()
                    .scale(yScale)
                    .ticks(5)
                    .tickSizeOuter(0)
                    .tickPadding(10)
                    .tickFormat(function() {
                        return "";
                    });

                var svg = d3.select("#d3-plot").append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                // DEBUGING CODE
                // chartDetails = rvAnalyticsHelperSrv.addRandomNumbersForTesting(chartDetails);

                chartDetails = rvAnalyticsHelperSrv.processBiDirectionalChart(chartDetails);
                var maxValueInBotheDirections = chartDetails.maxValueInOneSide;

                // set scales for x axis
                xScale.domain([-1 * maxValueInBotheDirections, maxValueInBotheDirections]).nice();
                yScale.domain(chartDetails.chartData.data.map(function(chart) {
                    return chart.type;
                }));

                // Add x axis
                svg.append("g")
                    .attr("class", "x axis bottom-axis")
                    .attr("id", "bottom-axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis);

                // Add left side axis
                svg.append("g")
                    .style("font-size", "18px")
                    .attr("class", "y axis left-most")
                    .call(yAxis);

                var dataForDrawingBars = {          
                    svg: svg,
                    yScale: yScale,
                    xScale: xScale,
                    chartDetails: chartDetails,
                    maxValue: maxValueInBotheDirections,
                    onBarChartClick: chartDetails.onBarChartClick,
                    colorMappings: colorMappings
                };

                rvAnalyticsHelperSrv.drawBarChart(dataForDrawingBars);

                // Add extra Y axis to the middle of the graph
                svg.append("g")
                    .append("rect")
                    .attr("class", "chart-breakpoint-line")
                    .attr("x", xScale(0))
                    .attr("y", -40)
                    .attr("height", height + margin.top + 40)
                    .attr("width", 4);

                /************************** DRAW HORIZONTAL LINES IN GRAPH ************************/

                var horizontalRectWidths = xScale(maxValueInBotheDirections) - xScale(-1 * maxValueInBotheDirections) + 2 * xScale(50);
                var lineXOffset = xScale(-1 * (maxValueInBotheDirections + 50));
                var rectCommonAttrs = {
                    svg: svg,
                    xOffset: lineXOffset,
                    height: 4,
                    width: horizontalRectWidths
                };

                // first line 
                rvAnalyticsHelperSrv.drawRectLines(_.extend(rectCommonAttrs, {
                    yOffset: 0
                }));
                // second line
                rvAnalyticsHelperSrv.drawRectLines(_.extend(rectCommonAttrs, {
                    yOffset: yScale.bandwidth() * 2.5
                }));
                // third line
                rvAnalyticsHelperSrv.drawRectLines(_.extend(rectCommonAttrs, {
                    yOffset: yScale.bandwidth() * 4.5
                }));
                // fourth line
                rvAnalyticsHelperSrv.drawRectLines(_.extend(rectCommonAttrs, {
                    yOffset: yScale.bandwidth() * 6.5
                }));
                // fifth line
                rvAnalyticsHelperSrv.drawRectLines(_.extend(rectCommonAttrs, {
                    yOffset: height - 3
                }));

                /************************** DRAW HORIZONTAL LINES IN GRAPH ENDS ************************/

                if (maxValueInBotheDirections > 0) {

                    svg.append("text")
                        .attr("x", xScale(-1 * maxValueInBotheDirections * 3 / 4))
                        .attr("y", -20)
                        .attr("dy", ".35em")
                        .attr("class", "chart-area-label")
                        .text("Performed");

                    svg.append("text")
                        .attr("x", xScale(maxValueInBotheDirections / 4))
                        .attr("y", -20)
                        .attr("dy", ".35em")
                        .attr("class", "chart-area-label")
                        .text("Remaining");
                }

                /************************** LEFT LEGEND STARTS HERE ************************/

                var leftSideLegendDiv = d3.select("#left-side-legend");
                var yBandwidth = yScale.bandwidth();
                var leftLegendCommonData = {
                    parentElement: leftSideLegendDiv,
                    onLegendClick: chartDetails.onLegendClick
                };

                // ARRIVALS LEFT LEGEND
                var arrivalsLeftLegendData = {
                    "title": "Arrivals",
                    "id": "arrivals-right-title-left",
                    "margin_top": margin.top + yBandwidth,
                    "items": [{
                        "id": "left-legend-arrivals",
                        "class": colorMappings.arrivals_perfomed.legend_class,
                        "label": "Checked In",
                        "count": chartDetails.perfomed_arrivals_count,
                        "item_name": colorMappings.arrivals_perfomed.item_name
                    }]
                };

                rvAnalyticsHelperSrv.addLegendItemsToChart(_.extend(leftLegendCommonData, {
                    legendData: arrivalsLeftLegendData
                }));

                var singleLegendTitleHeightPlusMargin = $("#arrivals-right-title-left").height() + 10;
                var singleLegendItemHeightPlusMargin = $("#left-legend-arrivals").height() + 10;

                // DEPARTURES LEFT LEGEND
                var departuresLeftLegendData = {
                    "title": "Departures",
                    "id": "departures-left-title",
                    "margin_top": 2 * yBandwidth -
                        (singleLegendTitleHeightPlusMargin + singleLegendItemHeightPlusMargin),
                    "items": [{
                        "id": "left-legend-departures",
                        "class": colorMappings.departures_perfomed.legend_class,
                        "label": "Checked Out",
                        "count": chartDetails.perfomed_departures_count,
                        "item_name": colorMappings.departures_perfomed.item_name
                    }]
                };

                rvAnalyticsHelperSrv.addLegendItemsToChart(_.extend(leftLegendCommonData, {
                    legendData: departuresLeftLegendData
                }));

                // STAYOVERS LEFT LEGEND
                var stayOversLeftLegendData = {
                    "title": "Stayovers",
                    "id": "stayovers-left-title",
                    "margin_top": 2 * yBandwidth -
                        (singleLegendTitleHeightPlusMargin + singleLegendItemHeightPlusMargin),
                    "items": [{
                        "id": "left-legend-stayovers",
                        "class": colorMappings.stayovers_perfomed.legend_class,
                        "label": "Stays Clean",
                        "count": chartDetails.perfomed_stayovers_count,
                        "item_name": colorMappings.stayovers_perfomed.item_name
                    }]
                };

                rvAnalyticsHelperSrv.addLegendItemsToChart(_.extend(leftLegendCommonData, {
                    legendData: stayOversLeftLegendData
                }));

                // ROOMS LEFT LEGEND
                var roomsLeftLegendData = {
                    "title": "Rooms",
                    "id": "rooms-right-title",
                    "margin_top": 2 * yBandwidth -
                        (singleLegendTitleHeightPlusMargin + singleLegendItemHeightPlusMargin),
                    "items": [{
                        "id": "left-legend-clean",
                        "class": colorMappings.rooms_clean.legend_class,
                        "label": "Clean",
                        "count": chartDetails.clean_rooms_count,
                        "item_name": colorMappings.rooms_clean.item_name
                    }, {
                        "id": "left-legend-pickup",
                        "class": colorMappings.rooms_inspected.legend_class,
                        "label": "Inspected",
                        "count": chartDetails.inspected_rooms_count,
                        "item_name": colorMappings.rooms_inspected.item_name
                    }]
                };

                rvAnalyticsHelperSrv.addLegendItemsToChart(_.extend(leftLegendCommonData, {
                    legendData: roomsLeftLegendData
                }));

                /************************** LEFT LEGEND END HERE ************************/

                /************************** RIGHT LEGEND STARTS HERE ************************/

                var rightSideLegendDiv = d3.select("#right-side-legend");

                var rightLegendCommonData = {
                    parentElement: rightSideLegendDiv,
                    onLegendClick: chartDetails.onLegendClick
                };

                // ARRIVALS RIGHT LEGEND
                var arrivalsRightLegendData = {
                    "title": "Arrivals",
                    "id": "arrivals-right-title",
                    "margin_top": margin.top + yBandwidth,
                    "items": [{
                        "id": "right-legend-arrivals",
                        "class": colorMappings.arrivals_remaining.legend_class,
                        "label": "Arrivals",
                        "count": chartDetails.remaining_arrivals_count,
                        "item_name": colorMappings.arrivals_remaining.item_name
                    }]
                };

                rvAnalyticsHelperSrv.addLegendItemsToChart(_.extend(rightLegendCommonData, {
                    legendData: arrivalsRightLegendData
                }));

                // DEPARTURES RIGHT LEGEND
                var departuresRightLegendData = {
                    "title": "Departures",
                    "id": "departures-right-title",
                    "margin_top": 2 * yBandwidth -
                        (singleLegendTitleHeightPlusMargin + singleLegendItemHeightPlusMargin),
                    "items": [{
                        "id": "right-legend-departures",
                        "class": colorMappings.departures_pending.legend_class,
                        "label": "Departures",
                        "count": chartDetails.pending_departures_count,
                        "item_name": colorMappings.departures_pending.item_name
                    }]
                };

                rvAnalyticsHelperSrv.addLegendItemsToChart(_.extend(rightLegendCommonData, {
                    legendData: departuresRightLegendData
                }));

                // STAYOVERS RIGHT LEGEND
                var stayOversLegendData = {
                    "title": "Stayovers",
                    "id": "departures-right-title",
                    "margin_top": 2 * yBandwidth -
                        (singleLegendTitleHeightPlusMargin + singleLegendItemHeightPlusMargin),
                    "items": [{
                        "id": "right-legend-stayovers",
                        "class": colorMappings.stayovers_remaining.legend_class,
                        "label": "Stays Dirty",
                        "count": chartDetails.remaining_stayovers_count,
                        "item_name": colorMappings.stayovers_remaining.item_name
                    }]
                };

                rvAnalyticsHelperSrv.addLegendItemsToChart(_.extend(rightLegendCommonData, {
                    legendData: stayOversLegendData
                }));

                // ROOMS RIGHT LEGEND
                var roomsLegendData = {
                    "title": "Rooms",
                    "id": "rooms-right-title",
                    "margin_top": 2 * yBandwidth -
                        (singleLegendTitleHeightPlusMargin + singleLegendItemHeightPlusMargin),
                    "items": [{
                        "id": "right-legend-dirty",
                        "class": colorMappings.rooms_dirty.legend_class,
                        "label": "Dirty",
                        "count": chartDetails.dirty_rooms_count,
                        "item_name": colorMappings.rooms_dirty.item_name
                    }, {
                        "id": "right-legend-pickup",
                        "class": colorMappings.rooms_pickup.legend_class,
                        "label": "Pickup",
                        "count": chartDetails.pickup_rooms_count,
                        "item_name": colorMappings.rooms_pickup.item_name
                    }]
                };

                rvAnalyticsHelperSrv.addLegendItemsToChart(_.extend(rightLegendCommonData, {
                    legendData: roomsLegendData
                }));

                /************************** RIGHT LEGEND ENDS HERE ************************/

                $scope.$emit('REFRESH_ANALTICS_SCROLLER');
                $scope.screenData.hideChartData = false;
            };

            var onBarChartClick = function(type) {
                return;
            };

            var onLegendClick = function(type) {
                return;
            };

            var chartDetails;
            var drawChartAndAddHeader = function(chartDetails) {
                $timeout(function() {
                    $scope.$emit("CLEAR_ALL_CHART_ELEMENTS");
                    drawHkOverviewChart(chartDetails);
                    rvAnalyticsHelperSrv.addChartHeading($scope.screenData.mainHeading,
                        $scope.screenData.analyticsDataUpdatedTime);
                }, 50);
            };
            var renderHkOverview = function() {
                $scope.screenData.mainHeading = "";
                // Calling HK Overview Build Graph
                rvAnalyticsSrv.hkOverview($scope.dashboardFilter.datePicked, false).then(function(data) {
                    chartDetails = {
                        chartData: data,
                        onBarChartClick: onBarChartClick,
                        onLegendClick: onLegendClick
                    };
                    $scope.dashboardFilter.showFilters = false;
                    drawChartAndAddHeader(chartDetails);
                });
            };

            var fetchHKOverviewChartData = function(evt, loadNewData) {
                $scope.dashboardFilter.displayMode = 'CHART_DETAILS';
                $scope.dashboardFilter.selectedAnalyticsMenu = 'HK_OVERVIEW';
                $('base').attr('href', "/");
                var params = {
                    "date": $scope.dashboardFilter.datePicked,
                    "room_type_id": $scope.dashboardFilter.selectedRoomTypeId,
                    "loadNewData": loadNewData
                };
                var options = {
                    params: params,
                    successCallBack: function(response) {
                        $scope.$emit('CHART_API_SUCCESS', response);
                        renderHkOverview();
                    }
                };

                $scope.callAPI(rvAnalyticsSrv.initRoomAndReservationApis, options);
            };

            // Initial fetch
            $scope.$on('GET_HK_OVERVIEW', fetchHKOverviewChartData);

            // On filter changes
            $scope.$on('RELOAD_DATA_WITH_SELECTED_FILTER_HK_OVERVIEW', renderHkOverview);
            $scope.$on('RELOAD_DATA_WITH_DATE_FILTER_HK_OVERVIEW', function() {
                fetchHKOverviewChartData({}, true);
            });
            $scope.$on('REFRESH_ANALYTCIS_CHART_HK_OVERVIEW', function() {
                fetchHKOverviewChartData({}, true);
            });
            // On window resize
            $scope.$on('ON_WINDOW_RESIZE', function() {
                if ($scope.dashboardFilter.selectedAnalyticsMenu === 'HK_OVERVIEW' && chartDetails) {
                    drawChartAndAddHeader(chartDetails);
                }
            });
        }
    ]);