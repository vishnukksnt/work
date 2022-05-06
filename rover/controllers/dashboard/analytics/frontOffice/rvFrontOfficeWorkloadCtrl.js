angular.module('sntRover')
	.controller('rvFrontOfficeWorkloadCtrl', ['$scope', 'sntActivity', '$timeout', '$filter', 'rvAnalyticsHelperSrv', 'rvAnalyticsSrv', 'rvFrontOfficeAnalyticsSrv',
		function($scope, sntActivity, $timeout, $filter, rvAnalyticsHelperSrv, rvAnalyticsSrv, rvFrontOfficeAnalyticsSrv) {

			var colorMappings = {
				"early_checkin": {
					"legend_class": "bar bar-green bar-dark",
					"fill": "greenDark",
					"onmouseover_fill": "greenDarkHover",
					"onmouseout_fill": "greenDark"
				},
				"checkin": {
					"legend_class": "bar bar-green bar-light",
					"fill": "greenLight",
					"onmouseover_fill": "greenLightHover",
					"onmouseout_fill": "greenLight"
				},
				"vip_checkin": {
					"legend_class": "bar bar-yellow",
					"fill": "yellow",
					"onmouseover_fill": "yellow",
					"onmouseout_fill": "yellow"
				},
				"vip_checkout": {
					"legend_class": "bar bar-yellow bar-dark",
					"fill": "yellowDark",
					"onmouseover_fill": "yellowDarkHover",
					"onmouseout_fill": "yellowDark"
				},
				"checkout": {
					"legend_class": "bar bar-red",
					"fill": "red",
					"onmouseover_fill": "redHover",
					"onmouseout_fill": "red"
				},
				"late_checkout": {
					"legend_class": "bar bar-red bar-dark",
					"fill": "redDark",
					"onmouseover_fill": "redDarkHover",
					"onmouseout_fill": "redDark"
				}
			};

			var legendColorMappings = {        
				"Early Check in": "bar bar-green bar-dark",
				        "Checkin": "bar bar-green bar-light",
				        "VIP checkin": "bar  bar-yellow",

				        "VIP checkout": "bar bar-yellow bar-dark",
				        "Late checkout": "bar bar-red bar-dark",
				        "Checkout": "bar bar-red",
				      
			};

			var drawWorkLoadChart = function(chartDetails) {
				$scope.screenData.mainHeading = $filter('translate')(chartDetails.chartData.label);
				var chartAreaWidth = document.getElementById("dashboard-analytics-chart").clientWidth;
				var margin = {
						top: 50,
						right: 20,
						bottom: 30,
						left: 300
					},
					width = chartAreaWidth - margin.left - margin.right,
					height = window.innerHeight * (2 / 3 + 1 / 2) / 2 - margin.top - margin.bottom;

				var yScale = d3.scaleBand()
					.rangeRound([0, height])
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
						return (d < 0) ? (d * -1) : d;
					})
					.tickPadding(15);

				var yAxis = d3.axisLeft()
					.scale(yScale)
					.ticks(5)
					.tickSizeOuter(0)
					.tickPadding(10)
					.tickFormat(function(d) {
						d = d ? rvAnalyticsHelperSrv.textTruncate(d, 35, '...') : '';
						return (d === 'REMAINING' && !$scope.dashboardFilter.showRemainingReservations) ? '' : d.toUpperCase();
					});

				var svgHeight = height + margin.top + margin.bottom;
				var svg = d3.select("#d3-plot").append("svg")
					.attr("width", width + margin.left + margin.right)
					.attr("height", svgHeight)
					.attr("id", "d3-plot")
					.append("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

				// sort right side items in ascending order
				chartDetails.chartData.data = _.sortBy(chartDetails.chartData.data, function(item, index) {
					return item.type === 'REMAINING' ? 0 : 1;
				});

				// DEBUGING CODE
				// chartDetails = rvAnalyticsHelperSrv.addRandomNumbersForTesting(chartDetails);
				
				var totalActionsCount = {
					early_checkin: 0,
					vip_checkin: 0,
					checkin: 0,
					vip_checkout: 0,
					checkout: 0,
					late_checkout: 0
				};

				chartDetails.chartData.data.forEach(function(chart) {
					var chartName = chart.type;

					// Let count be 10, 25, 35 - based on calculation below the following will the calculated values
					// item 1 = { xOrigin : 0  , xFinal : 10 }
					// item 2 = { xOrigin : item 1 xFinal = 10 , xFinal : item 2 xOrigin + count = 10 + 25 = 35 }
					// item 2 = { xOrigin : item 2 xFinal = 35 , xFinal : item 3 xOrigin + count = 35 + 35 = 70 }

					chart.contents.right_side = _.each(chart.contents.right_side, function(item, index) {
						// For first item X origin is 0 and xFinal is count 
						if (index === 0) {
							item.origin = 0;
							item.xFinal = item.count;
						} else {
							// For all other elements, X origin  is count of previous item and X final is count of the item
							item.origin = chart.contents.right_side[index - 1].xFinal;
							item.xFinal = item.origin + chart.contents.right_side[index].count;
						}
						totalActionsCount[item.type] = totalActionsCount[item.type] + item.count;
					});

					chart.boxes = chart.contents.right_side.map(function(item) {
						return {
							type: item.type,
							label: item.label,
							xOrigin: item.origin,
							xFinal: item.xFinal,
							count: item.count,
							chartName: chartName,
							elementId: chartName + "-" + item.type
						};
					});
				});

				// get minimum and maximum values to plot
				chartDetails.min_val = d3.min(chartDetails.chartData.data, function(chart) {
					return chart.boxes["0"].xOrigin;
				});
				chartDetails.max_val = d3.max(chartDetails.chartData.data, function(chart) {
					return chart.boxes[chart.boxes.length - 1].xFinal;
				});

				var maxValueInBotheDirections = chartDetails.min_val > chartDetails.max_val ?
					chartDetails.min_val : chartDetails.max_val;

				// set scales for x axis
				xScale.domain([0, maxValueInBotheDirections]).nice();
				yScale.domain(chartDetails.chartData.data.map(function(chart) {
					return chart.type;
				}));

				var setFontSizeBasedOnNumberOfRows = function(isBarText) {
					var totalRowsPresent = chartDetails.chartData.data.length;
					var fontSize;

					if (totalRowsPresent > 20) {
						fontSize = isBarText ? "0px" : "10px";
					} else if (totalRowsPresent > 15) {
						fontSize = isBarText ? "8px" : "12px";
					} else {
						fontSize = isBarText ? "10px" : "13px";
					}

					return fontSize;
				};

				// Add x axis
				svg.append("g")
					.attr("class", "x axis")
					.attr("transform", "translate(0," + height + ")")
					.call(xAxis);

				// Add left side axis
				svg.append("g")
					.attr("class", "y axis left-most")
					.call(yAxis)
					.style("font-size", function() {
						return setFontSizeBasedOnNumberOfRows();
					});

				var remainingTypeYoffset;

				var workloadData = angular.copy(chartDetails.chartData.data);

				if (!$scope.dashboardFilter.showRemainingReservations) {
					workloadData = _.reject(chartDetails.chartData.data, function(item) {
						return item.type === 'REMAINING';
					});
				}

				var vakken = svg.selectAll(".type")
					.data(workloadData)
					.enter()
					.append("g")
					.attr("class", "bar")
					.attr("transform", function(chart) {

						if (chart.type === 'REMAINING') {
							remainingTypeYoffset = yScale(chart.type);
						}
						return "translate(0," + yScale(chart.type) + ")";
					});

				var bars = vakken.selectAll("rect")
					.data(function(mainItem) {
						return mainItem.boxes;
					})
					.enter()
					.append("g")
					.attr("class", "subbar")
					.attr("id", function(item) {
						return item.elementId;
					});

				bars.append("rect")
					.attr("height", yScale.bandwidth())
					.attr("class", "rect-bars")
					.attr("x", function(item) {
						return xScale(item.xOrigin);
					})
					.attr("fill", function(item) {
						var fillColor = colorMappings[item.type].fill;

						return "url(#" + fillColor + ")";
					})
					.attr("onmouseover", function(item) {
						var mouseoverColor = colorMappings[item.type].onmouseover_fill;

						return "evt.target.setAttribute('fill', 'url(#" + mouseoverColor + " )');";
					})
					.attr("onmouseout", function(item) {
						var mouseoutColor = colorMappings[item.type].onmouseout_fill;

						return "evt.target.setAttribute('fill', 'url(#" + mouseoutColor + " )');";
					})
					.on("click", function(e) {
						chartDetails.onBarChartClick(e);
					});

				d3.selectAll(".rect-bars")
					.transition()
					.duration(300)
					.attr("width", function(item) {
						return xScale(item.xFinal) - xScale(item.xOrigin);
					});

				// TODO: Delete commented code after verifying total count

				// var isSmallBarItem = function(item) {
				// 	var itemPercantage = item.count * 100 / maxValueInBotheDirections;

				// 	return itemPercantage < 3;
				// };

				// bars.append("text")
				// 	.attr("x", function(item) {
				// 		return ((xScale(item.xOrigin) + xScale(item.xFinal)) / 2);
				// 	})
				// 	.attr("y", function() {
				// 		return yScale.bandwidth() / 2;
				// 	})
				// 	.attr("dy", function(item) {
				// 		return isSmallBarItem(item) ? -1 * (yScale.bandwidth() / 2 + 10) : "0.5em";
				// 	})
				// 	.attr("dx", function(item) {
				// 		return isSmallBarItem(item) && item.xOrigin < 0 ? "-0.5em" : "0em";
				// 	})
				// 	.style("font-size", function(item) {
				// 		var fontSize = setFontSizeBasedOnNumberOfRows(true);

				// 		return isSmallBarItem(item) ? "0px" : fontSize;
				// 	})
				// 	.style("text-anchor", "middle")
				// 	.text(function(item) {
				// 		return item.count !== 0  || chartDetails.chartData.data.length < 15 ? item.count : '';
				// 	});

				// Draw horizontal line on top of REMAINING

				if (maxValueInBotheDirections > 0) {

					// var horizontalRectWidths = xScale(maxValueInBotheDirections) - xScale(-1 * maxValueInBotheDirections) + 2 * xScale(50);
					//             var lineXOffset = xScale(-1 * (maxValueInBotheDirections + 50));

					var rectCommonAttrs = {
						svg: svg,
						xOffset: -100,
						height: 2,
						width: xScale(maxValueInBotheDirections) + xScale(100)
					};

					if ($scope.dashboardFilter.showRemainingReservations) {
						var yPositionOfRemainingTopLine = remainingTypeYoffset - yScale.bandwidth() / 2;
						// first line 
						rvAnalyticsHelperSrv.drawRectLines(_.extend(rectCommonAttrs, {
							yOffset: yPositionOfRemainingTopLine
						}));

						var yPositionOfRemainingBottomLine = yPositionOfRemainingTopLine + 2 * yScale.bandwidth();

						rvAnalyticsHelperSrv.drawRectLines(_.extend(rectCommonAttrs, {
							yOffset: yPositionOfRemainingBottomLine
						}));
					}

					rvAnalyticsHelperSrv.drawRectLines({
						svg: svg,
						xOffset: 0,
						height: 2,
						width: xScale(maxValueInBotheDirections),
						yOffset: height
					});

					rvAnalyticsHelperSrv.drawRectLines({
						svg: svg,
						xOffset: 0,
						height: height,
						width: 2,
						yOffset: 0
					});
				}

				var rightSideLegendDiv = d3.select("#right-side-legend");
				var arrivalsLegendData = {
					"title": "Arrivals",
					"id": "arrivals-right-title",
					"margin_top": 0,
					"items": [{
						"id": "right-legend-early-checkin",
						"class": legendColorMappings["Early Check in"],
						"label": "Early Check in",
						"count": totalActionsCount.early_checkin
					}, {
						"id": "right-legend-checkin",
						"class": legendColorMappings["Checkin"],
						"label": "Checkin",
						"count": totalActionsCount.checkin
					}, {
						"id": "right-legend-vip-checkin",
						"class": legendColorMappings["VIP checkin"],
						"label": "VIP checkin",
						"count": totalActionsCount.vip_checkin
					}]
				};
				var departuresLegendData = {
					"title": "Departures",
					"id": "departures-right-title",
					"margin_top": 10,
					"items": [{
						"id": "right-legend-vip-checkout",
						"class": legendColorMappings["VIP checkout"],
						"label": "VIP checkout",
						"count": totalActionsCount.vip_checkout
					}, {
						"id": "right-legend-checkout",
						"class": legendColorMappings["Checkout"],
						"label": "Checkout",
						"count": totalActionsCount.checkout
					}, {
						"id": "right-legend-late-checkout",
						"class": legendColorMappings["Late checkout"],
						"label": "Late checkout",
						"count": totalActionsCount.late_checkout
					}]
				};

				rvAnalyticsHelperSrv.addLegendItems(legendColorMappings, rightSideLegendDiv, arrivalsLegendData);
				rvAnalyticsHelperSrv.addLegendItems(legendColorMappings, rightSideLegendDiv, departuresLegendData);

				d3.select(".x.axis path").style("stroke", "#D8D8D8");

				$scope.$emit('REFRESH_ANALTICS_SCROLLER');
				$scope.screenData.hideChartData = false;
			};

			var onBarChartClick = function() {
				return;
			};
			var chartDetails;
			var drawChartAndAddHeading = function(chartDetails) {
				$timeout(function() {
					$scope.$emit("CLEAR_ALL_CHART_ELEMENTS");
					drawWorkLoadChart(chartDetails);
					rvAnalyticsHelperSrv.addChartHeading($scope.screenData.mainHeading,
						$scope.screenData.analyticsDataUpdatedTime);
				}, 50);
			};
			var renderfdWorkloadChart = function() {
				rvFrontOfficeAnalyticsSrv.fdWorkload($scope.dashboardFilter.datePicked).then(function(data) {
					chartDetails = {
						chartData: data,
						onBarChartClick: onBarChartClick
					};
					drawChartAndAddHeading(chartDetails);
				});
			};
			var getArrivalManagementChartData = function() {
				$scope.dashboardFilter.displayMode = 'CHART_DETAILS';
				$scope.dashboardFilter.selectedAnalyticsMenu = 'FO_WORK_LOAD';
				$('base').attr('href', "/");
				var params = {
					"date": $scope.dashboardFilter.datePicked,
					"isFromFrontDesk": true,
					"loadNewData": true
				};
				var options = {
					params: params,
					successCallBack: function(response) {
						$scope.$emit('CHART_API_SUCCESS', response);
						renderfdWorkloadChart();
					}
				};

				$scope.callAPI(rvAnalyticsSrv.initRoomAndReservationApis, options);
			};

			$scope.$on('GET_FO_WORKLOAD', getArrivalManagementChartData);
			$scope.$on('RELOAD_DATA_WITH_SELECTED_FILTER_FO_WORK_LOAD', renderfdWorkloadChart);
			$scope.$on('RELOAD_DATA_WITH_DATE_FILTER_FO_WORK_LOAD', getArrivalManagementChartData);
			$scope.$on('REFRESH_ANALYTCIS_CHART_FO_WORK_LOAD', getArrivalManagementChartData);

			$scope.$on('ON_WINDOW_RESIZE', function() {
				if ($scope.dashboardFilter.selectedAnalyticsMenu === 'FO_WORK_LOAD' && chartDetails) {
					drawChartAndAddHeading(chartDetails);
				}
			});
		}
	]);