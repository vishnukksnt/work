angular.module('sntRover')
    .controller('rvFrontOfficeManagementAnalyticsCtrl', ['$scope', 'sntActivity', '$timeout', '$filter', 'rvAnalyticsHelperSrv', 'rvAnalyticsSrv', 'rvFrontOfficeAnalyticsSrv',
        function($scope, sntActivity, $timeout, $filter, rvAnalyticsHelperSrv, rvAnalyticsSrv, rvFrontOfficeAnalyticsSrv) {

            var cssClassMappings = {
                "Checked In": "bar bar-green bar-light",
                "Early Check in": "bar bar-green bar-dark",
                "Remaining": "bar bar-green",

                "Checked Out": "bar bar-red bar-light",
                "Late checkout": "bar bar-red bar-dark",
                "Pending": "bar bar-red",

                "Clean": "bar bar-green",
                "Inspected": "bar bar-green bar-dark",
                "Dirty": "bar bar-red",
                "Pickup": "bar bar-orange",
                "OverBooking": "bar bar-warning"
            };

            var colorMappings = {
                "arrivals_perfomed": rvAnalyticsHelperSrv.gradientMappings['greenLight'],
                "arrivals_early_checkin": rvAnalyticsHelperSrv.gradientMappings['greenDark'],
                "arrivals_remaining": rvAnalyticsHelperSrv.gradientMappings['green'],

                "departures_perfomed": rvAnalyticsHelperSrv.gradientMappings['redLight'],
                "departures_pending": rvAnalyticsHelperSrv.gradientMappings['red'],
                "departures_late_checkout": rvAnalyticsHelperSrv.gradientMappings['redDark'],

                "rooms_clean": rvAnalyticsHelperSrv.gradientMappings['green'],
                "rooms_inspected": rvAnalyticsHelperSrv.gradientMappings['greenDark'],
                "rooms_dirty": rvAnalyticsHelperSrv.gradientMappings['red'],
                "rooms_pickup": rvAnalyticsHelperSrv.gradientMappings['orange'],
                "rooms_overbooked_rooms": rvAnalyticsHelperSrv.gradientMappings['warning']
            };

            var drawArrivalManagementChart = function(chartDetails) {
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
                    .padding(.4);

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
                    .tickFormat("");

                var svg = d3.select("#d3-plot").append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .attr("id", "d3-plot")
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

                var yInnerPadding = (height - yScale.bandwidth() * 3) / 4;

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
                    // colorScheme: colorScheme,
                    maxValue: maxValueInBotheDirections,
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

                /************************** DRAW HORIZONTAL LINES IN GRAPH ENDS ************************/

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
                var secondHorizontalLineYoffset = 1.5 * yInnerPadding + yScale.bandwidth();

                // second line
                rvAnalyticsHelperSrv.drawRectLines(_.extend(rectCommonAttrs, {
                    yOffset: secondHorizontalLineYoffset
                }));

                var thirdHorizontalLineYoffset = 2.5 * yInnerPadding + 2 * yScale.bandwidth();

                // third line
                rvAnalyticsHelperSrv.drawRectLines(_.extend(rectCommonAttrs, {
                    yOffset: thirdHorizontalLineYoffset
                }));
                // fourth line
                rvAnalyticsHelperSrv.drawRectLines(_.extend(rectCommonAttrs, {
                    yOffset: height - 3
                }));

                /************************** DRAW HORIZONTAL LINES IN GRAPH ENDS ************************/


                /************************** ADD TEXTS INSIDE CHART ************************/

                if (maxValueInBotheDirections > 0) {

                    var leftSideXOffset = xScale(-1 * maxValueInBotheDirections * 7 / 8);
                    var rightSideXOffset = xScale(maxValueInBotheDirections / 8);
                    var textLabels = [{
                        "side": "left",
                        "yOffset": 15,
                        "text": "PERFORMED"
                    }, {
                        "side": "right",
                        "yOffset": 15,
                        "text": "REMAINING"
                    }, {
                        "side": "left",
                        "yOffset": secondHorizontalLineYoffset + 15,
                        "text": "NOT READY"
                    }, {
                        "side": "right",
                        "yOffset": secondHorizontalLineYoffset + 15,
                        "text": "READY"
                    }, {
                        "side": "left",
                        "yOffset": thirdHorizontalLineYoffset + 15,
                        "text": "PERFORMED"
                    }, {
                        "side": "right",
                        "yOffset": thirdHorizontalLineYoffset + 15,
                        "text": "REMAINING"
                    }];

                    _.each(textLabels, function(textLabel) {
                        rvAnalyticsHelperSrv.addTextsToChart({
                            svg: svg,
                            xOffset: textLabel.side === "left" ? leftSideXOffset : rightSideXOffset,
                            yOffset: textLabel.yOffset,
                            label: textLabel.text
                        });
                    });
                }

                /************************** LEFT LEGEND STARTS HERE ************************/

                var leftSideLegendDiv = d3.select("#left-side-legend");
                var yBandwidth = yScale.bandwidth();

                var arrivalsLeftLegendData = {
                    "title": "Arrivals",
                    "id": "arrivals-right-title-left",
                    "margin_top": secondHorizontalLineYoffset - yInnerPadding / 2 - yBandwidth / 2,
                    "items": [{
                        "id": "left-legend-arrivals",
                        "class": cssClassMappings["Checked In"],
                        "label": "Checked In",
                        "count": chartDetails.perfomed_arrivals_count
                    }]
                };

                rvAnalyticsHelperSrv.addLegendItems(cssClassMappings, leftSideLegendDiv, arrivalsLeftLegendData);

                var singleLegendTitleHeightPlusMargin = $("#arrivals-right-title-left").height() + 10;
                var singleLegendItemHeightPlusMargin = $("#left-legend-arrivals").height() + 10;

                var vacantLeftLegendData = {
                    "title": "Vacant",
                    "id": "vacant-left-title",
                    "margin_top": yBandwidth - singleLegendTitleHeightPlusMargin,
                    "items": [{
                        "id": "left-legend-dirty",
                        "class": cssClassMappings["Dirty"],
                        "label": "Dirty",
                        "count": chartDetails.dirty_rooms_count
                    }, {
                        "id": "left-legend-pickup",
                        "class": cssClassMappings["Pickup"],
                        "label": "Pickup",
                        "count": chartDetails.pickup_rooms_count
                    }, {
                        "id": "left-legend-clean",
                        "class": cssClassMappings["Clean"],
                        "label": "Clean",
                        "count": chartDetails.clean_rooms_count
                    }]
                };

                rvAnalyticsHelperSrv.addLegendItems(cssClassMappings, leftSideLegendDiv, vacantLeftLegendData);
                var calculatedMarginTop = yBandwidth - 3 * singleLegendTitleHeightPlusMargin;

                var departuresLeftLegendData = {
                    "title": "Departures",
                    "id": "departures-left-title",
                    "margin_top": calculatedMarginTop > 0 ? calculatedMarginTop : 0,
                    "items": [{
                        "id": "left-legend-departures",
                        "class": cssClassMappings["Checked Out"],
                        "label": "Checked Out",
                        "count": chartDetails.perfomed_departures_count
                    }]
                };

                rvAnalyticsHelperSrv.addLegendItems(cssClassMappings, leftSideLegendDiv, departuresLeftLegendData);

                /************************** LEFT LEGEND END HERE ************************/

                /************************** RIGHT LEGEND STARTS HERE ************************/

                var rightSideLegendDiv = d3.select("#right-side-legend");

                var arrivalsRightLegendData = {
                    "title": "Arrivals",
                    "id": "arrivals-right-title",
                    "margin_top": secondHorizontalLineYoffset - yInnerPadding / 2 - yBandwidth / 2,
                    "items": [{
                        "id": "right-legend-early-checkin",
                        "class": cssClassMappings["Early Check in"],
                        "label": "Early Check in",
                        "count": chartDetails.early_checkin_arrivals_count
                    }, {
                        "id": "right-legend-remaining",
                        "class": cssClassMappings["Remaining"],
                        "label": "Remaining",
                        "count": chartDetails.remaining_arrivals_count
                    }]
                };

                rvAnalyticsHelperSrv.addLegendItems(cssClassMappings, rightSideLegendDiv, arrivalsRightLegendData);

                var vacantRightLegendData = {
                    "title": "Vacant",
                    "id": "vacnt-right-title",
                    "margin_top": yBandwidth - 2 * singleLegendTitleHeightPlusMargin,
                    "items": [{
                        "id": "right-legend-dirty",
                        "class": cssClassMappings["Inspected"],
                        "label": "Inspected",
                        "count": chartDetails.inspected_rooms_count
                    }]
                };

                var marginTopForRightSideDeps;

                var vacantRoomsData = _.find(chartDetails.chartData.data, function(chart) {
                    return chart.type === "rooms";
                });
                var overBookedRooms = _.find(vacantRoomsData.contents.right_side, function(chart) {
                    return chart.type === "overbooked_rooms";
                });

                if (overBookedRooms) {
                    var pendingInspected = {
                        "id": "right-legend-pending-inspected",
                        "class": cssClassMappings["OverBooking"],
                        "label": "OverBooking",
                        "count": overBookedRooms.count,
                        "item_name": colorMappings.rooms_overbooked_rooms.item_name
                    };

                    vacantRightLegendData.items.push(pendingInspected);
                    marginTopForRightSideDeps = yBandwidth - 2 * singleLegendTitleHeightPlusMargin;
                } else {
                    marginTopForRightSideDeps = yBandwidth - singleLegendTitleHeightPlusMargin;
                }

                rvAnalyticsHelperSrv.addLegendItems(cssClassMappings, rightSideLegendDiv, vacantRightLegendData);

                var departuresRightLegendData = {
                    "title": "Departures",
                    "id": "departures-right-title",
                    "margin_top": marginTopForRightSideDeps,
                    "items": [{
                        "id": "right-legend-pending",
                        "class": cssClassMappings["Pending"],
                        "label": "Pending",
                        "count": chartDetails.pending_departures_count
                    }, {
                        "id": "right-legend-lc",
                        "class": cssClassMappings["Late checkout"],
                        "label": "Late checkout",
                        "count": chartDetails.late_checkout_departures_count
                    }]
                };

                rvAnalyticsHelperSrv.addLegendItems(cssClassMappings, rightSideLegendDiv, departuresRightLegendData);

                /************************** RIGHT LEGEND ENDS HERE ************************/


                $scope.$emit('REFRESH_ANALTICS_SCROLLER');
                $scope.screenData.hideChartData = false;
            };

            var onBarChartClick = function() {
                return;
            };

            var drawChartAndAddHeading = function() {
                $timeout(function() {
                    $scope.$emit("CLEAR_ALL_CHART_ELEMENTS");
                    drawArrivalManagementChart(chartDetails);
                    rvAnalyticsHelperSrv.addChartHeading($scope.screenData.mainHeading,
                        $scope.screenData.analyticsDataUpdatedTime);
                }, 50);
            };
            var chartDetails;

            var renderFrontOfficeManagementChart = function() {
                rvFrontOfficeAnalyticsSrv.fdArrivalsManagement($scope.dashboardFilter.datePicked).then(function(data) {
                    chartDetails = {
                        chartData: data,
                        onBarChartClick: onBarChartClick
                    };
                    $scope.$emit('ROOM_TYPE_SHORTAGE_CALCULATED', rvAnalyticsSrv.roomTypesWithShortageData);
                    $scope.dashboardFilter.showFilters = false;
                    drawChartAndAddHeading(chartDetails);
                });
            };

            var getArrivalManagementChartData = function(evt, loadNewData) {
                $scope.dashboardFilter.displayMode = 'CHART_DETAILS';
                $scope.dashboardFilter.selectedAnalyticsMenu = 'FO_ARRIVALS';
                $('base').attr('href', "/");
                var params = {
                    "date": $scope.dashboardFilter.datePicked,
                    "isFromFrontDesk": true,
                    "loadNewData": loadNewData
                };
                var options = {
                    params: params,
                    successCallBack: function(response) {
                        $scope.$emit('CHART_API_SUCCESS', response);
                        renderFrontOfficeManagementChart();
                    }
                };

                $scope.callAPI(rvAnalyticsSrv.initRoomAndReservationApis, options);
            };

            // Initial fetch
            $scope.$on('GET_FO_ARRIVAL_MANAGEMENT', getArrivalManagementChartData);
            $scope.$on('RELOAD_DATA_WITH_SELECTED_FILTER_FO_ARRIVALS', renderFrontOfficeManagementChart);
            $scope.$on('RELOAD_DATA_WITH_DATE_FILTER_FO_ARRIVALS', function() {
                getArrivalManagementChartData({}, true);
            });
            $scope.$on('REFRESH_ANALYTCIS_CHART_FO_ARRIVALS', function() {
                getArrivalManagementChartData({}, true);
            });

            $scope.$on('ON_WINDOW_RESIZE', function() {
                if ($scope.dashboardFilter.selectedAnalyticsMenu === 'FO_ARRIVALS' && chartDetails) {
                    drawChartAndAddHeading(chartDetails);
                }
            });
        }
    ]);