angular.module('sntRover')
	.controller('rvManagerSpiderChartCtrl', ['$scope', '$rootScope', 'sntActivity', '$timeout', '$filter', 'rvAnalyticsHelperSrv', 'rvAnalyticsSrv', 'rvManagersAnalyticsSrv',
		function($scope, $rootScope, sntActivity, $timeout, $filter, rvAnalyticsHelperSrv, rvAnalyticsSrv, rvManagersAnalyticsSrv) {

			var perfomanceData,
				combinedPerfomanceData = {};
			var initialBaseHrefValue = $('base').attr('href');
			var addChartHeading = function() {
				rvAnalyticsHelperSrv.addChartHeading($scope.screenData.mainHeading, $scope.screenData.analyticsDataUpdatedTime);
			};
			$scope.dashboardFilter.lastyearType = 'SAME_DATE_LAST_YEAR';

			rvAnalyticsSrv.setHotelCiCoTime($rootScope.hotelDetails);

			/** ****************************** DRAW CHART STARTS HERE ********************************************/

			var drawPerfomceChart = function(chartData) {
				$scope.$emit('CLEAR_ALL_CHART_ELEMENTS');
				$scope.screenData.mainHeading = $filter('translate')("AN_ROOM_PERFOMANCE_KPR");
				$scope.dashboardFilter.selectedAnalyticsMenu = 'PERFOMANCE';
				var hasLastYearData = $scope.dashboardFilter.showLastYearData;
				// convert data into array
				var chartDataArray = Object.keys(chartData).map(function(key) {
					return _.extend({
						type: key
					}, chartData[key]);
				});

				var maxAdr = _.max(chartDataArray, function(data) {
					return parseFloat(data.adr);
				});
				var maxRevPar = _.max(chartDataArray, function(data) {
					return parseFloat(data.rev_par);
				});
				var isThumbNail = false;
				var textFontSize = isThumbNail ? "3px" : "15px";
				// Find max value for all of the four quadrants
				var maxValueForChart = parseInt(maxAdr.adr) > parseInt(maxRevPar.rev_par) ? maxAdr.adr : maxRevPar.rev_par;
				var chartWidth = isThumbNail ? 300 : 800;
				var chartHeight = isThumbNail ? 300 : 800;
				var padding = 50;
				var leftPadding = 50;

				var svg = d3.select("#d3-plot")
					.append("svg")
					.attr("width", chartWidth + 100) // Add additional width to show last year details
					.attr("height", chartHeight);

				var x = d3.scaleLinear().
				domain([-1, 1])
					.range([leftPadding, chartWidth - padding]);

				var y = d3.scaleLinear()
					.domain([1, -1])
					.range([padding, chartHeight - padding * 2]);

				var xAxis = d3.axisBottom()
					.scale(x)
					.ticks([])
					.tickSizeOuter(0);
				var yAxis = d3
					.axisLeft()
					.scale(y)
					.ticks([])
					.tickSizeOuter(0);

				svg.append("g")
					.attr("class", "axis")
					.attr("transform", "translate(0, " + y(0) + ")")
					.call(xAxis);

				svg.append("g")
					.attr("class", "axis")
					.attr("transform", "translate(" + x(0) + ", 0)")
					.call(yAxis);

				// Round the scales to nearest multiples of 10 based on the values present
				var baseValue = 1;
				maxValueForChart = parseInt(maxValueForChart);
				var maxValueForChartLength = maxValueForChart.toString().length;

				if (maxValueForChartLength > 1) {
					for (var i = 0; i < maxValueForChartLength - 1; i++) {
						baseValue = baseValue * 10;
					}
				}

				function roundToNextThousand(x) {
					return Math.ceil(x / baseValue) * baseValue;
				}
				var individual = parseInt(maxValueForChart) / 6;
				var roundedInvidual = roundToNextThousand(individual);

				var axisValues;

				if (baseValue >= 1000) {
					var factor = baseValue / 1000;

					axisValues = [roundedInvidual / baseValue + "k",
						roundedInvidual * 2 / baseValue * factor + "k",
						roundedInvidual * 3 / baseValue * factor + "k",
						roundedInvidual * 4 / baseValue * factor + "k",
						roundedInvidual * 5 / baseValue * factor + "k",
						roundedInvidual * 6 / baseValue * factor + "k"
					];
				} else {
					axisValues = [roundedInvidual,
						roundedInvidual * 2,
						roundedInvidual * 3,
						roundedInvidual * 4,
						roundedInvidual * 5,
						roundedInvidual * 6
					];
				}

				var valueOfOne = 0.1 / roundedInvidual;

				// Draw 10 squares
				for (var i = 0; i < 10; i++) {

					var width = x(.1 * (i + 1)) - x(-.1 * (i + 1));
					var height = y(-.1 * (i + 1)) - y(.1 * (i + 1));

					svg.append("g")
						.append("rect")
						.attr("class", "chart-rect")
						.attr("id", "line_" + i)
						.attr("stroke-width", function() {
							// for the fourth sqaures, add thick lines
							return i === 3 ? 2 : 1;
						})
						.style("stroke", function() {
							// for the fourth sqaures, paint black
							return i === 3 ? "black" : "lightgray";
						})
						.attr("x", x(-.1 * (i + 1)))
						.attr("y", y(.1 * (i + 1)))
						.transition()
						.duration(1000)
						.attr("height", height)
						.attr("width", width)
				}


				var addAxisLabelsToChart = function(textData, isXaxis) {
					var label = (textData.type === "occupany") ?
						(textData.label ? textData.label + "%" : "") :
						$rootScope.currencySymbol + textData.label;

					svg.append("text")
						.attr("x", textData.xOffset)
						.attr("y", textData.yOffset)
						.attr("dx", function() {
							return isXaxis ? "-1em" : ".35em";
						})
						.attr("dy", function() {
							return isXaxis ? "1em" : ".35em"
						})
						.attr("class", "")
						.style("font-size", isThumbNail ? "1px" : "10px")
						.style("fill", "black")
						.text(label);
				};

				var addTextToTheChart = function(textData, isLeftSide, isDownSide) {
					var label = (textData.type === "occupany") ?
						(textData.label ? textData.label + "%" : "") :
						"$" + textData.label;

					svg.append("text")
						.attr("x", textData.xOffset)
						.attr("y", textData.yOffset)
						.attr("dx", function() {
							return isLeftSide ? "-2em" : "2em";
						})
						.attr("dy", function() {
							return isDownSide ? "2em" : "-1em";
						})
						.attr("class", "")
						.style("font-size", isThumbNail ? "1px" : "10px")
						.style("fill", "black")
						.style("font-weight", "bold")
						.text(label);
				};

				var yAxisLabels = rvAnalyticsHelperSrv.getYAxisValues(axisValues, x, y);

				for (var i = 0; i <= yAxisLabels.length - 1; i++) {
					addAxisLabelsToChart(yAxisLabels[i]);
				};

				var xAxisLabels = rvAnalyticsHelperSrv.getXAxisValues(axisValues, x, y);

				for (var i = 0; i <= xAxisLabels.length - 1; i++) {
					addAxisLabelsToChart(xAxisLabels[i], true);
				};

				var labelMappings;
				var getElementSuffixesOnChart = function() {
					// The elements on the chart for labels will have ids in the following format
					// left-top-rev-par-rect ,  left-top-rev-adr-label1 etc where position is left-top

					var elementsSuffixOnChart = ["-adr-rect",
						"-adr-label1",
						"-adr-label2",
						"-rev-par-rect",
						"-rev-par-label1",
						"-rev-par-label2"
					];

					if (hasLastYearData) {
						var lastYearSuffixOnChart = ["-adr-rect-2",
							"-adr-labe3",
							"-adr-label4",
							"-rev-par-rect-2",
							"-rev-par-label3",
							"-rev-par-label4"
						];

						elementsSuffixOnChart = elementsSuffixOnChart.concat(lastYearSuffixOnChart);
					}

					return elementsSuffixOnChart;
				};

				var bindClickEvents = function(position, suffix) {
					$("#" + position + suffix).click(onClickOnLabel);
				};

				var unBindClickEventsAndRemove = function(position, suffix) {
					$("#" + position + suffix).unbind("click");
					$("#" + position + suffix).remove();
				};

				var addClickEvents = function(position, isRedraw) {
					// To make sure the elements are drawn before click event is attached
					var animationDuration = isRedraw ? 250 : 1050;
					var elementsSuffixOnChart = getElementSuffixesOnChart();

					$timeout(function() {
						_.each(elementsSuffixOnChart, function(suffix) {
							bindClickEvents(position, suffix)
						});
					}, animationDuration);
				};

				var getQuadrantPosition = function(e) {
					var position;

					if (e.target.id && e.target.id.includes("left-top")) {
						position = "left-top";
					} else if (e.target.id && e.target.id.includes("right-top")) {
						position = "right-top";
					} else if (e.target.id && e.target.id.includes("left-bottom")) {
						position = "left-bottom";
					} else if (e.target.id && e.target.id.includes("right-bottom")) {
						position = "right-bottom";
					}

					return position;
				};


				var getOccupanyDetailsElements = function() {
					var occupancyLabelElements = ['-occupancy-group',
						'-occupancy-rect',
						'-occupancy-label-1',
						'-occupancy-label-2'
					];

					if (hasLastYearData) {
						var lastYearOccupancyElements = ['-occupancy-rect-2',
							'-occupancy-label-3',
							'-occupancy-label-4'
						];
						occupancyLabelElements = occupancyLabelElements.concat(lastYearOccupancyElements);
					}

					return occupancyLabelElements;
				};

				var deleteExistingOccupanyLabel = function(position) {

					var occupancyLabelElements = getOccupanyDetailsElements();

					_.each(occupancyLabelElements, function(suffix) {
						if ($("#" + position + suffix)) {
							$("#" + position + suffix).remove();
						}
					});
				};

				var onClickOnOccupanyLabels = function(e) {
					var position = getQuadrantPosition(e);

					deleteExistingOccupanyLabel(position);
				};

				var addClickEventsForOccupanyLabels = function(position) {
					var occupancyLabelElements = getOccupanyDetailsElements();

					_.each(occupancyLabelElements, function(suffix) {
						$("#" + position + suffix).click(onClickOnOccupanyLabels);
					});
				};


				var onClickOnOccupany = function(e) {

					var position = getQuadrantPosition(e);
					var occupancy,
						occupancy_diff,
						occupancyLabelFill;

					var xOffset,
						yOffset;

					if (position === "left-top") {
						occupancy = parseFloat(chartData.yesterday.occupancy);
						occupancy_diff = parseFloat(chartData.yesterday.occupancy_diff);
						occupancyLabelFill = '#E63838';
						xOffset = x(-1 * occupancy * 0.1 / 25);
						yOffset = y(occupancy * 0.1 / 25) - (y(0) - y(0.15));
					} else if (position === "right-top") {
						occupancy = parseFloat(chartData.today.occupancy);
						occupancy_diff = parseFloat(chartData.today.occupancy_diff);
						occupancyLabelFill = '#89BD55';
						xOffset = x(occupancy * 0.1 / 25);
						yOffset = y(occupancy * 0.1 / 25) - (y(0) - y(0.15));
					} else if (position === "left-bottom") {
						occupancy = parseFloat(chartData.mtd.occupancy);
						occupancy_diff = parseFloat(chartData.mtd.occupancy_diff);
						occupancyLabelFill = '#F6991B';
						xOffset = x(-1 * occupancy * 0.1 / 25);
						yOffset = y(-1 * occupancy * 0.1 / 25) - (y(0) - y(0.15));
					} else if (position === "right-bottom") {
						occupancy = parseFloat(chartData.ytd.occupancy);
						occupancy_diff = parseFloat(chartData.ytd.occupancy_diff);
						occupancyLabelFill = '#497D8E';
						xOffset = x(occupancy * 0.1 / 25);
						yOffset = y(-1 * occupancy * 0.1 / 25) - (y(0) - y(0.15));
					}
					occupancy = occupancy > 25 ? occupancy : parseInt(occupancy);
					deleteExistingOccupanyLabel(position);

					var rectWidth = x(0.3) - x(0);
					var xOffsetText = xOffset + rectWidth / 4;
					var yOffsetText = yOffset + (y(0) - y(0.25)) / 4;
					var yOffsetText2 = yOffsetText + (y(0) - y(0.25)) / 4;


					var textLabelGroup = svg.append("g")
						.attr('id', position + '-occupancy-group');
					var animationDuration = 200;

					textLabelGroup.append('rect')
						.attr("class", "rect-bars")
						.attr('x', function(d, i) {
							return xOffset; // xOffset + some margin
						})
						.style("margin-right", "10px")
						.attr('y', function(d) {
							return yOffset;
						})
						.transition()
						.duration(animationDuration)
						.attr('width', function() {
							return rectWidth;
						})
						.attr('height', function() {
							return y(0) - y(0.15);
						})
						.attr("id", position + "-occupancy-rect")
						.attr("fill", occupancyLabelFill)
						.attr("stroke-width", "1")
						.attr("stroke", "#000")
						.style("cursor", "pointer");


					textLabelGroup.append("text")
						.attr('x', xOffsetText)
						.attr('y', yOffsetText)
						.attr("id", position + "-occupancy-label-1")
						.style("font-size", textFontSize)
						.style("fill", "#FFFFFF")
						.text("ACTUAL")
						.style("cursor", "pointer");

					textLabelGroup.append("text")
						.attr('x', xOffsetText)
						.attr('y', yOffsetText2)
						.attr("id", position + "-occupancy-label-2")
						.style("font-size", textFontSize)
						.style("fill", "#FFFFFF")
						.text(occupancy)
						.style("cursor", "pointer");

					if (hasLastYearData) {
						var lastYearXoffset = xOffset + rectWidth;

						textLabelGroup.append('rect')
							.attr("class", "rect-bars")
							.attr('x', function(d, i) {
								return lastYearXoffset; // xOffset + some margin
							})
							.style("margin-right", "10px")
							.attr('y', function(d) {
								return yOffset;
							})
							.transition()
							.duration(animationDuration)
							.attr('width', function() {
								return rectWidth;
							})
							.attr('height', function() {
								return y(0) - y(0.15);
							})
							.attr("id", position + "-occupancy-rect-2")
							.attr("fill", "#F5F5F5")
							.attr("stroke-width", "1")
							.attr("stroke", "#000")
							.style("cursor", "pointer");

						var lastYearTextXoffset = lastYearXoffset + rectWidth / 8;

						textLabelGroup.append("text")
							.attr('x', lastYearTextXoffset)
							.attr('y', yOffsetText)
							.attr("id", position + "-occupancy-label-3")
							.style("font-size", isThumbNail ? "2px" : "12px")
							.style("fill", "black")
							.text("LAST YEAR")
							.style("cursor", "pointer");

						var occupancyDiff = parseFloat(occupancy_diff).toFixed(2);
						var textColor = occupancyDiff >= 0 ? 'green' : 'red';

						occupancyDiff = occupancyDiff >= 0 ? '+' + occupancyDiff + '%' : occupancyDiff + '%';

						textLabelGroup.append("text")
							.attr('x', lastYearTextXoffset)
							.attr('y', yOffsetText2)
							.attr("id", position + "-occupancy-label-4")
							.style("font-size", textFontSize)
							.style("fill", textColor)
							.text(occupancyDiff)
							.style("cursor", "pointer");
					}

					addClickEventsForOccupanyLabels(position);

				};

				var addClickEventForOccupany = function(id) {
					if (hasLastYearData) {
						$("#" + id).click(onClickOnOccupany);
					}
				};

				var onClickOnLabel = function(e) {
					var position = getQuadrantPosition(e);
					var labelAttrs = labelMappings[position]

					if (position) {
						var elementsSuffixOnChart = getElementSuffixesOnChart();

						_.each(elementsSuffixOnChart, function(suffix) {
							unBindClickEventsAndRemove(position, suffix)
						});

						if (e.target.id.includes("rev-par")) {
							addDualLabelToChart(labelAttrs.revPar, labelAttrs.isLeftSide, labelAttrs.isDownSide, true);
							addDualLabelToChart(labelAttrs.adr, labelAttrs.isLeftSide, labelAttrs.isDownSide, true);
						} else {
							addDualLabelToChart(labelAttrs.adr, labelAttrs.isLeftSide, labelAttrs.isDownSide, true);
							addDualLabelToChart(labelAttrs.revPar, labelAttrs.isLeftSide, labelAttrs.isDownSide, true);
						}

						addClickEvents(position, true);
					}
				};


				var addDualLabelToChart = function(label, isLeftSide, isDownSide, isRedraw) {

					if (parseFloat(label.value) === 0) {
						// don't Draw
						return;
					}
					var xValue = 0.5 + (parseInt(label.value) - parseInt(roundedInvidual)) * valueOfOne;

					xValue = isLeftSide ? -1 * xValue : xValue;
					var rectYvalue = 0.5 + (parseInt(label.value) - parseInt(roundedInvidual)) * valueOfOne;

					rectYvalue = isDownSide ? -1 * rectYvalue : rectYvalue;

					var rectWidth = x(0.3) - x(0);
					var xOffset = x(xValue) - rectWidth / 2,
						yOffset = y(rectYvalue) - (y(0) - y(0.15)) / 2,

						xOffsetText = x(xValue) - rectWidth / 4,

						yOffsetText = y(rectYvalue) - (y(0) - y(0.15)) / 6,
						yOffsetText2 = y(rectYvalue) + (y(0) - y(0.15)) / 4;


					var textLabelGroup = svg.append("g");
					var animationDuration = isRedraw ? 200 : 1000;

					textLabelGroup.append('rect')
						.attr("class", "rect-bars")
						.attr('x', function(d, i) {
							return xOffset; // xOffset + some margin
						})
						.style("margin-right", "10px")
						.attr('y', function(d) {
							return yOffset;
						})
						.transition()
						.duration(animationDuration)
						.attr('width', function() {
							return rectWidth;
						})
						.attr('height', function() {
							return y(0) - y(0.15);
						})
						.attr("id", label.id + "-rect")
						.attr("fill", label.backgroundColor)
						.attr("stroke-width", "1")
						.attr("stroke", "#000")
						.style("cursor", "pointer");


					textLabelGroup.append("text")
						.attr('x', xOffsetText)
						.attr('y', yOffsetText)
						.attr("id", label.id + "-label1")
						.style("font-size", textFontSize)
						.style("fill", "white")
						.text(label.label)
						.style("cursor", "pointer");


					var labelText = label.value;
					if (baseValue >= 1000) {
						var factor = 1 / 1000;

						labelText = labelText * factor;
					};
					labelText = parseFloat(labelText).toFixed(2);
					if (baseValue >= 1000) {
						labelText = labelText + "k";
					}

					textLabelGroup.append("text")
						.attr('x', xOffsetText)
						.attr('y', yOffsetText2)
						.attr("id", label.id + "-label2")
						.style("font-size", textFontSize)
						.style("fill", "white")
						.text($rootScope.currencySymbol + labelText)
						.style("cursor", "pointer");

					if (hasLastYearData) {
						var lastYearXoffset = xOffset + rectWidth;

						textLabelGroup.append('rect')
							.attr("class", "rect-bars")
							.attr('x', function(d, i) {
								return lastYearXoffset; // xOffset + some margin
							})
							.style("margin-right", "10px")
							.attr('y', function(d) {
								return yOffset;
							})
							.transition()
							.duration(animationDuration)
							.attr('width', function() {
								return rectWidth;
							})
							.attr('height', function() {
								return y(0) - y(0.15);
							})
							.attr("id", label.id + "-rect-2")
							.attr("fill", "#EFEFEF")
							.attr("stroke-width", "1")
							.attr("stroke", "#000")
							.style("cursor", "pointer");

						var lastYearTextXoffset = lastYearXoffset + rectWidth / 8;

						textLabelGroup.append("text")
							.attr('x', lastYearTextXoffset)
							.attr('y', yOffsetText)
							.attr("id", label.id + "-label3")
							.style("font-size", isThumbNail ? "2px" : "12px")
							.style("fill", "black")
							.text("FROM LAST YEAR")
							.style("cursor", "pointer");

						var diffText = parseFloat(label.diff).toFixed(2);
						var textColor;

						if (parseFloat(diffText) > 0) {
							diffText = '+' + $rootScope.currencySymbol + diffText;
							textColor = 'green';
						} else if (parseFloat(diffText) === 0) {
							diffText = '+/-' + $rootScope.currencySymbol + 0;
							textColor = 'grey';
						} else {
							diffText = -1 * diffText;
							diffText = '-' + $rootScope.currencySymbol + diffText;
							textColor = 'red';
						}

						textLabelGroup.append("text")
							.attr('x', lastYearTextXoffset)
							.attr('y', yOffsetText2)
							.attr("id", label.id + "-label4")
							.style("font-size", textFontSize)
							.style("fill", textColor)
							.text(diffText)
							.style("cursor", "pointer");
					}
				};

				var lowestValue = maxValueForChart / 5;
				var oneDivisonConversion = .0001;

				// TODO: use in future
				// var setColorBasedOnOccupancy = function(occupancy) {
				// 	if (parseFloat(occupancy) > 75) {
				// 		return "green";
				// 	} else if (parseFloat(occupancy) > 25) {
				// 		return "orange";
				// 	} 
				// 	return "red";
				// };

				/**  ****************************  Let Top Quadrant ******************************/
				var yesterDaysOccupany = parseFloat(chartData.yesterday.occupancy);

				yesterDaysOccupany = yesterDaysOccupany > 25 ? yesterDaysOccupany : yesterDaysOccupany.toFixed(1);

				svg.append("circle").
				attr("cx", x(-1 * yesterDaysOccupany * 0.1 / 25))
					.attr("cy", y(yesterDaysOccupany * 0.1 / 25))
					.attr("r", yesterDaysOccupany > 25 ? 8 : 4)
					.attr("fill", "#E63838")
					.attr("id", "left-top-occupany")
					.style("cursor", "pointer");

				var leftTopQuadrantOccupany = {
					"type": "occupany",
					"label": yesterDaysOccupany,
					"xOffset": x(-1 * yesterDaysOccupany * 0.1 / 25),
					"yOffset": y(yesterDaysOccupany * 0.1 / 25)
				};

				addTextToTheChart(leftTopQuadrantOccupany, true, false);
				addClickEventForOccupany("left-top-occupany");

				var leftTopQuadrantADR = {
					"top": y(0.6) + "px",
					"backgroundColor": "#E63838",
					"label": "ADR",
					"value": chartData.yesterday.adr,
					"value_last_year": "-$300",
					"id": "left-top-adr",
					"diff": chartData.yesterday.adr_diff
				};

				addDualLabelToChart(leftTopQuadrantADR, true, false);

				var leftTopQuadrantRevPar = {
					"backgroundColor": "#E63838",
					"label": "RevPAR",
					"value": chartData.yesterday.rev_par,
					"id": "left-top-rev-par",
					"diff": chartData.yesterday.rev_par_diff
				};

				addDualLabelToChart(leftTopQuadrantRevPar, true, false);
				addClickEvents("left-top", false);



				/**  ****************************  Let Top Quadrant ends here ******************************/

				/**  ****************************  Right Top Quadrant ******************************/

				var todaysOccupany = parseFloat(chartData.today.occupancy);

				todaysOccupany = todaysOccupany > 25 ? todaysOccupany : todaysOccupany.toFixed(1);
				svg.append("circle").
				attr("cx", x(todaysOccupany * 0.1 / 25))
					.attr("cy", y(todaysOccupany * 0.1 / 25))
					.attr("r", todaysOccupany > 25 ? 8 : 4)
					.attr("fill", "#89BD55")
					.attr("id", "right-top-occupany")
					.style("cursor", "pointer");

				var rightTopQuadrantOccupany = {
					"type": "occupany",
					"label": todaysOccupany,
					"xOffset": x(todaysOccupany * 0.1 / 25),
					"yOffset": y(todaysOccupany * 0.1 / 25)
				};

				addTextToTheChart(rightTopQuadrantOccupany, false, false);
				addClickEventForOccupany("right-top-occupany");

				var rightTopQuadrantAdr = {
					"class": "bottomRight",
					"backgroundColor": "#89BD55",
					"label": "ADR",
					"value": chartData.today.adr,
					"id": "right-top-adr",
					"diff": chartData.today.adr_diff
				};

				var rightTopQuadrantRevPar = {
					"class": "bottomRight",
					"top": y(0.5) + "px",
					"backgroundColor": "#89BD55",
					"label": "RevPAR",
					"value": chartData.today.rev_par,
					"id": "right-top-rev-par",
					"diff": chartData.today.rev_par_diff
				};

				addDualLabelToChart(rightTopQuadrantAdr, false, false);
				addDualLabelToChart(rightTopQuadrantRevPar, false, false);
				addClickEvents("right-top", false);

				/**  ****************************  Right Top Quadrant ends here ******************************/

				/**  ****************************  Let Bottom Quadrant ******************************/

				var mtdOccupany = parseFloat(chartData.mtd.occupancy);

				mtdOccupany = mtdOccupany > 25 ? mtdOccupany : mtdOccupany.toFixed(1);

				svg.append("circle").
				attr("cx", x(-1 * mtdOccupany * 0.1 / 25))
					.attr("cy", y(-1 * mtdOccupany * 0.1 / 25))
					.attr("r", mtdOccupany > 25 ? 8 : 4)
					.attr("fill", "#F6991B")
					.attr("id", "left-bottom-occupany")
					.style("cursor", "pointer");

				var leftBottomOccupancy = {
					"type": "occupany",
					"label": mtdOccupany,
					"xOffset": x(-1 * mtdOccupany * 0.1 / 25),
					"yOffset": y(-1 * mtdOccupany * 0.1 / 25)
				};

				addTextToTheChart(leftBottomOccupancy, true, true);
				addClickEventForOccupany("left-bottom-occupany");

				var leftBottomAdr = {
					"class": "bottomRight",
					"top": y(-0.8) + "px",
					"backgroundColor": "#F6991B",
					"label": "ADR",
					"value": chartData.mtd.adr,
					"id": "left-bottom-adr",
					"diff": chartData.mtd.adr_diff
				};
				addDualLabelToChart(leftBottomAdr, true, true);

				var leftBottomRevPar = {
					"class": "bottomRight",
					"top": y(-0.5) + "px",
					"backgroundColor": "#F6991B",
					"label": "RevPAR",
					"value": chartData.mtd.rev_par,
					"id": "left-bottom-rev-par",
					"diff": chartData.mtd.rev_par_diff
				};

				addDualLabelToChart(leftBottomRevPar, true, true);
				addClickEvents("left-bottom", false);

				/**  ****************************  Left Bottom Quadrant ends here ******************************/

				/**  ****************************  Right Bottom Quadrant ******************************/
				var ytdOccupany = parseFloat(chartData.ytd.occupancy);

				ytdOccupany = ytdOccupany > 25 ? ytdOccupany : ytdOccupany.toFixed(1);
				svg.append("circle").
				attr("cx", x(ytdOccupany * 0.1 / 25))
					.attr("cy", y(-1 * ytdOccupany * 0.1 / 25))
					.attr("r", ytdOccupany > 25 ? 8 : 4)
					.attr("fill", "#497D8E")
					.attr("id", "right-bottom-occupany")
					.style("cursor", "pointer");

				var rightBottomOccupancy = {
					"type": "occupany",
					"label": ytdOccupany,
					"xOffset": x(ytdOccupany * 0.1 / 25),
					"yOffset": y(-1 * ytdOccupany * 0.1 / 25)
				};

				addTextToTheChart(rightBottomOccupancy, false, true);
				addClickEventForOccupany("right-bottom-occupany");

				var rightBottomAdr = {
					"class": "bottomRight",
					"top": y(-0.7) + "px",
					"backgroundColor": "#497D8E",
					"label": "ADR",
					"value": chartData.ytd.adr,
					"id": "right-bottom-adr",
					"diff": chartData.ytd.adr_diff
				};

				addDualLabelToChart(rightBottomAdr, false, true);

				var rightBottomRevPar = {
					"class": "bottomRight",
					"top": y(-0.5) + "px",
					"backgroundColor": "#497D8E",
					"label": "RevPAR",
					"value": chartData.ytd.rev_par,
					"id": "right-bottom-rev-par",
					"diff": chartData.mtd.rev_par_diff
				};

				addDualLabelToChart(rightBottomRevPar, false, true);
				addClickEvents("right-bottom", false);

				/**  ****************************  Right Bottom Quadrant ends here ******************************/

				labelMappings = {
					"right-top": {
						"position": "right-top",
						"adr": rightTopQuadrantAdr,
						"revPar": rightTopQuadrantRevPar,
						"isLeftSide": false,
						"isDownSide": false
					},
					"left-top": {
						"position": "left-top",
						"adr": leftTopQuadrantADR,
						"revPar": leftTopQuadrantRevPar,
						"isLeftSide": true,
						"isDownSide": false
					},
					"left-bottom": {
						"position": "left-bottom",
						"adr": leftBottomAdr,
						"revPar": leftBottomRevPar,
						"isLeftSide": true,
						"isDownSide": true
					},
					"right-bottom": {
						"position": "right-bottom",
						"adr": rightBottomAdr,
						"revPar": rightBottomRevPar,
						"isLeftSide": false,
						"isDownSide": true
					}
				};
				/**  ****************************  Let Bottom Quadrant ******************************/


				var addMainLabelsOnGraph = function(label) {

					var xValue = label.isLeftSide ? -0.3 : 0;
					var rectYvalue = label.isDownSide ? -1.05 : 1.15;
					var textrectYvalue = label.isDownSide ? -1.1 : 1.1;

					var textLabelGroup = svg.append("g");

					textLabelGroup.append('rect')
						.attr("class", "rect-bars")
						.attr('x', x(xValue))
						.style("margin-right", "10px")
						.attr('y', y(rectYvalue))
						.attr('width', x(0.3) - x(0))
						.attr('height', y(0) - y(0.1))
						.attr("fill", "#6B6C6E")
						.style("fill-opacity", "0.8");

					textLabelGroup.append("text")
						.attr('x', x(xValue + 0.05))
						.attr('y', y(textrectYvalue))
						.style("font-size", textFontSize)
						.style("fill", "white")
						.text(label.text);
				};

				var chartMainLabels = [{
					"text": "YESTERDAY",
					"isLeftSide": true,
					"isDownSide": false
				}, {
					"text": "TODAY",
					"isLeftSide": false,
					"isDownSide": false
				}, {
					"text": "MTD",
					"isLeftSide": true,
					"isDownSide": true
				}, {
					"text": "YTD",
					"isLeftSide": false,
					"isDownSide": true
				}];

				_.each(chartMainLabels, function(mainLabel) {
					addMainLabelsOnGraph(mainLabel);
				});

				$scope.$emit('REFRESH_ANALTICS_SCROLLER');
				$scope.screenData.hideChartData = false;

				addChartHeading();
			};
			/** ****************************** DRAW CHART ENDS HERE ********************************************/

			var fetchPerfomanceChartData = function() {
				$('base').attr('href', initialBaseHrefValue);

				var options = {
					params: {
						date: $scope.dashboardFilter.datePicked
					},
					successCallBack: function(data) {
						$('base').attr('href', '#');
						perfomanceData = data;
						$scope.screenData.analyticsDataUpdatedTime = moment().format("dddd, MMMM Do YYYY, h:mm:ss a");
						$scope.$emit("CLEAR_ALL_CHART_ELEMENTS");
						if (rvAnalyticsSrv.managerChartFilterSet.showLastYearData) {
							handleFilterChangeForPerfomanceChart();
						} else {
							drawPerfomceChart(data);
						}
						
						$scope.dashboardFilter.displayMode = 'CHART_DETAILS';
					}
				};

				$scope.callAPI(rvManagersAnalyticsSrv.roomPerformanceKPR, options);
			};
			// Fetch perfomance date on clicking on the chart tile
			$scope.$on('GET_MANAGER_PERFOMANCE', fetchPerfomanceChartData);


			var calculateDifferenceInPerfomance = function(lastYeardata, isMixed) {
				for (var key in perfomanceData) {
					for (var key1 in lastYeardata) {
						if (((key === key1) && (key === "mtd" || !isMixed)) ||
							((key === key1) && (key === "ytd" || !isMixed))) {

							combinedPerfomanceData[key] = angular.copy(perfomanceData[key]);
							combinedPerfomanceData[key].adr_diff = parseFloat(perfomanceData[key].adr) -
								parseFloat(lastYeardata[key].adr);
							combinedPerfomanceData[key].rev_par_diff = parseFloat(perfomanceData[key].rev_par) -
								parseFloat(lastYeardata[key].rev_par);
							combinedPerfomanceData[key].occupancy_diff = parseFloat(perfomanceData[key].occupancy) -
								parseFloat(lastYeardata[key].occupancy);
						}
					}
				}
			};

			var handleChangesForMixedFilter = function() {
				var lastYeardate = moment($scope.dashboardFilter.datePicked)
					.subtract(1, 'years')
					.format("YYYY-MM-DD");
				var options = {
					params: {
						date: lastYeardate
					},
					successCallBack: function(lastYeardata) {
						calculateDifferenceInPerfomance(lastYeardata, true);
						drawPerfomceChart(combinedPerfomanceData);
					}
				};

				$scope.callAPI(rvManagersAnalyticsSrv.roomPerformanceKPR, options);
			};

			var handleFilterChangeForPerfomanceChart = function() {
				$scope.$emit("CLEAR_ALL_CHART_ELEMENTS");
				if (!$scope.dashboardFilter.showLastYearData) {
					$('base').attr('href', '#');
					drawPerfomceChart(perfomanceData);
					addChartHeading();
					return;
				}

				$('base').attr('href', initialBaseHrefValue);

				// for SAME_DATE_LAST_YEAR the date will be 1 year before and 
				// for SAME_DAY_LAST_YEAR the date will be the nearest weekday 1 year before
				// for MIXED, we will use mixture of the above two,  'Same Day LY' logic for the upper (Today, Yesterday) quadrants and
				// 'Same Date LY' logic for the lower (MTD, YTD) quadrants
				var lastYeardate;

				if ($scope.dashboardFilter.lastyearType === "SAME_DATE_LAST_YEAR") {
					lastYeardate = moment($scope.dashboardFilter.datePicked)
						.subtract(1, 'years')
						.format("YYYY-MM-DD");
				} else if ($scope.dashboardFilter.lastyearType === "SAME_DAY_LAST_YEAR" || $scope.dashboardFilter.lastyearType === "MIXED") {
					lastYeardate = rvAnalyticsHelperSrv.getClosetDayOftheYearInPastYear($scope.dashboardFilter.datePicked);
				}


				var options = {
					params: {
						date: lastYeardate
					},
					successCallBack: function(lastYeardata) {
						calculateDifferenceInPerfomance(lastYeardata, false);
						if ($scope.dashboardFilter.lastyearType === "MIXED") {
							handleChangesForMixedFilter();
						} else {
							drawPerfomceChart(combinedPerfomanceData);
						}
					}
				};

				$scope.callAPI(rvManagersAnalyticsSrv.roomPerformanceKPR, options);
			};

			// On filter chage, fetch the perfomance date correspoding to the selected filter
			$scope.$on('ANALYTICS_FILTER_CHANGED', function(e, data) {
				if ($scope.dashboardFilter.selectedAnalyticsMenu === 'PERFOMANCE') {
					$scope.dashboardFilter.showFilters = false;
					rvAnalyticsSrv.managerChartFilterSet.showLastYearData = $scope.dashboardFilter.showLastYearData;
      				rvAnalyticsSrv.managerChartFilterSet.lastyearType = $scope.dashboardFilter.lastyearType;
					handleFilterChangeForPerfomanceChart();
				}
			});
			$scope.$on('REFRESH_ANALYTCIS_CHART_PERFOMANCE', function() {
				$scope.dashboardFilter.showLastYearData = false;
				$scope.dashboardFilter.lastyearType = "SAME_DATE_LAST_YEAR";
				fetchPerfomanceChartData();
			});

			$scope.$on('RELOAD_DATA_WITH_DATE_FILTER_PERFOMANCE', function() {
				// When date changes, hide opened filter view	
				$scope.dashboardFilter.showFilters = false;
				fetchPerfomanceChartData();
			});

			$scope.$on('ON_WINDOW_RESIZE', function() {
				if ($scope.dashboardFilter.selectedAnalyticsMenu === 'PERFOMANCE') {
					if ($scope.dashboardFilter.showLastYearData) {
						handleFilterChangeForPerfomanceChart();
					} else {
						fetchPerfomanceChartData();
					}
				}
			});
		}
	]);