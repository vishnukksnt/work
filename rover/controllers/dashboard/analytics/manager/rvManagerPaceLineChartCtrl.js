angular.module('sntRover')
	.controller('rvManagerPaceLineChartCtrl', ['$scope', 'rvAnalyticsHelperSrv', 'rvManagersAnalyticsSrv', '$rootScope', '$log', '$filter',
		function ($scope, rvAnalyticsHelperSrv, rvManagersAnalyticsSrv, $rootScope, $log, $filter) {

			var dataForDateInfo = [],
				numberOfDateInfoFetched = 0,
				datesToCompare = [];

			var fetchPaceChartData = function (selectedData, shallowDecodedParams) {
				var options = {
					params: {
						date: selectedData,
						shallowDecodedParams: shallowDecodedParams
					},
					successCallBack: function (data) {
						if (data && data.length === 0) {
							data = [{
								new: 0,
								cancellation: 0,
								on_the_books: 0,
								date: selectedData
							}];
						}
						$scope.screenData.analyticsDataUpdatedTime = moment().format("dddd, MMMM Do YYYY, h:mm:ss a");

						dataForDateInfo.push({
							date: selectedData,
							chartData: data
						});
						numberOfDateInfoFetched++;
						// if numberOfDateInfoFetched reached the dates to compare array length +  1 which the selected date ($scope.dashboardFilter.datePicked)
						if ((datesToCompare.length + 1) === numberOfDateInfoFetched) {
							drawPaceLineChart();
						}
					}
				};

				$scope.callAPI(rvManagersAnalyticsSrv.pace, options);
			};

			$scope.startDrawingPaceLineChart = function (chartData, shallowDecodedParams) {
				// chartData will have one set of data with date $scope.dashboardFilter.datePicked
				numberOfDateInfoFetched = 0;
				dataForDateInfo = [];
				dataForDateInfo.push({
					date: $scope.dashboardFilter.datePicked,
					chartData: chartData
				});
				numberOfDateInfoFetched++;
				// If more dates are selected to compare, fetch data corresponding to all those dates
				// and upon fetching all data, draw the chart
				datesToCompare = $scope.dashboardFilter.datesToCompare;

				if (datesToCompare.length > 0) {
					if (datesToCompare.includes($scope.dashboardFilter.datePicked)) {
						// If only picked filetr date is current selected date, we don't have to fetch  again
						// Draw with already fetched data 
						if (datesToCompare.length === 1) {
							drawPaceLineChart();
							return;
						}
						datesToCompare = _.reject(datesToCompare, function (date) {
							return date === $scope.dashboardFilter.datePicked;
						});
					}
					_.each(datesToCompare, function (dateToCompare) {
						fetchPaceChartData(dateToCompare, shallowDecodedParams);
					});
				} else {
					drawPaceLineChart();
				}
			};

			var checkIfDayIsToday = function (dateToCompare) {
				var today = $rootScope.businessDate;
				var date = moment(dateToCompare).format('YYYY-MM-DD');

				return today === date;
			};

			var drawPaceLineChart = function () {
				// draw line chart using the array dataForDateInfo				
				$log.info("[dataForDateInfo]........." + JSON.stringify(dataForDateInfo));
				$scope.$emit("CLEAR_ALL_CHART_ELEMENTS");

				// iterate through array dataForDateInfo to draw line charts
				// Also draw avg line chart which comprises of all the selected data (only if dataForDateInfo.length > 0)
				// Show selected dates as legends on rights ride (only if dataForDateInfo.length > 0)

				var initPaceLineChart = {
					draw: function (configData) {
						var domElement = configData.element,
							chartLines = configData.key,
							colors = configData.colors,
							margin = {
								top: 40,
								right: 50,
								bottom: 100,
								left: 70
							},
							xAxisDates = [],
							yAxisValues = [],
							chartDatum = [],
							colorMap = {};

						$scope.screenData.mainHeading = $filter('translate')("AN_PACE");
						// extract date and values, remove -ve values coming for some reason
						_.each(dataForDateInfo, function (dataObject) {
							_.each(dataObject.chartData, function (chartData) {
								for (var key in chartData) {
									// check if the property/key is defined in the object itself, not in parent
									if (chartData.hasOwnProperty(key) && key !== "date") {
										chartData[key] = chartData[key] > 0 ? chartData[key] : 0;
									}
								}
								chartDatum.push(chartData);
								xAxisDates.push(chartData.date);
								yAxisValues.push(chartData.new + chartData.on_the_books);
							});
						});
						_.each(xAxisDates, function (date) {
							_.each(dataForDateInfo, function (dataObject) {
								var isDatePresent = false;

								_.each(dataObject.chartData, function (chartData) {
									if (date === chartData.date) {
										isDatePresent = true;
										return;
									}
								});
								if (!isDatePresent) {
									yAxisValues.push(0);
									dataObject.chartData.push({
										new: 0,
										cancellation: 0,
										on_the_books: 0,
										date: date
									});
								}
							});
						});
						// remove duplicate dates and values
						xAxisDates = _.uniq(xAxisDates);
						yAxisValues = _.uniq(yAxisValues);

						// calculate the mean chart data
						if (chartLines.length > 1) {
							var meanChartData = {
								date: "Mean",
								chartData: []
							};

							if (chartLines.length > 1) {
								chartLines.push("Mean");
							}
							_.each(xAxisDates, function (xDate) {
								var meanChartValue = {
									date: xDate,
									new: 0,
									cancellation: 0,
									on_the_books: 0
								};

								_.each(chartDatum, function (chartData) {
									if (xDate === chartData.date) {
										meanChartValue.new += chartData.new;
										meanChartValue.cancellation += chartData.cancellation;
										meanChartValue.on_the_books += chartData.on_the_books;
									}
								});
								meanChartValue.new /= (chartLines.length - 1);
								meanChartValue.cancellation /= (chartLines.length - 1);
								meanChartValue.on_the_books /= (chartLines.length - 1);
								meanChartData.chartData.push(meanChartValue);
							});
							dataForDateInfo.push(meanChartData);

							_.each(meanChartData.chartData, function (chartData) {
								yAxisValues.push(chartData.new + chartData.on_the_books);
							});

						} else {
							// no longer need color for mean
							colors.pop();
						}
						_.each(chartLines, function (date, index) {
							colorMap[date] = colors[index];
						});

						xAxisDates = _.uniq(xAxisDates);
						yAxisValues = _.uniq(yAxisValues);

						dataForDateInfo = _.sortBy(dataForDateInfo, function (data) {
							return data.date;
						});

						xAxisDates = _.sortBy(xAxisDates, function (date) {
							return date;
						});
						yAxisValues = _.sortBy(yAxisValues, function (value) {
							return value;
						});

						_.each(dataForDateInfo, function (dataObject) {
							dataObject.chartData = _.sortBy(dataObject.chartData, function (chartData) {
								return chartData.date;
							});
						});

						// max and min values for domain
						var maxValue = _.max(yAxisValues) + 1,
							minValue = _.min(yAxisValues) | 0;

						var width = document.getElementById("dashboard-analytics-chart").clientWidth - margin.left - margin.right,
							height = 500 - margin.top - margin.bottom;

						var xScaleDomain = xAxisDates.map(function (d) {
							return d;
						});

						var xScale = d3.scaleBand()
							.domain(xScaleDomain)
							.range([0, width - 100])
							.padding(0.5);

						var yScale = d3.scaleLinear()
							.range([height, 0])
							.domain([minValue, maxValue]
							);

						var drawGridLines = function () {
							return d3.axisLeft(yScale)
								.ticks(10);
						};

						// define X axis
						var xAxis = d3.axisBottom(xScale)
							.ticks(5)
							.tickSizeOuter(0)
							.tickFormat(function (date, i) {
								var multiple;
								var dateFormat = 'DD MMM';

								// if there are more days, show only some dates to make it less crowded
								if (xAxisDates.length > 200) {
									multiple = 30;
									dateFormat = 'DD MMM  YY';
								} else if (xAxisDates.length > 100) {
									multiple = 10;
									dateFormat = 'DD MMM  YY';
								} else if (xAxisDates.length > 60) {
									multiple = 5;
								}

								if (checkIfDayIsToday(date)) {
									return "Today";
								} else if (multiple && i % multiple !== 0) {
									return "";
								}

								return moment(date).format(dateFormat);
							})
							.tickPadding(20)
							.tickSizeInner(0);

						// define Y axis
						var yAxis = d3.axisLeft(yScale)
							.tickSizeOuter(0)
							.tickPadding(5);

						// svg element
						var svg = d3.select("#" + domElement)
							.append("svg")
							.attr("width", width + margin.left + margin.right)
							.attr("height", height + margin.top + margin.bottom)
							.append("g")
							.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

						// tooltip
						var tooltip;

						var initToolTip = function () {
							tooltip = svg.append("g")
								.attr("class", "tooltip")
								.style("display", "none");

							tooltip.append("rect")
								.attr("width", 80)
								.attr("height", 40)
								.attr("fill", "white")
								.style("opacity", 0.5);

							tooltip.append("text")
								.attr('class', 'date-label')
								.attr("x", 14)
								.attr("dx", "2.4em")
								.attr("dy", "1.4em")
								.style("text-anchor", "middle")
								.style("fill", "black")
								.attr("font-size", "12px")
								.attr("font-weight", "bold");

							tooltip.append("text")
								.attr('class', 'item-qty')
								.attr("x", 12)
								.attr("dx", "2.4em")
								.attr("dy", "2.6em")
								.style("text-anchor", "middle")
								.attr("font-size", "12px")
								.attr("font-weight", "bold")
								.style("fill", "#000");
						};

						initToolTip();
						// draw line with tooltip over circles
						var drawSingleLine = function (cordinateData, keyDate) {
							svg.append("path")
								.datum(cordinateData)
								.attr("fill", "none")
								.attr("stroke", function () { return colorMap[keyDate]; })
								.attr("stroke-width", 3)
								.attr("d", d3.line()
									.curve(d3.curveLinear)
									.x(function (d) { return xScale(d.date); })
									.y(function (d) { return yScale(d.new + d.on_the_books); })
								);

							svg.selectAll("dot")
								.data(cordinateData)
								.enter()
								.append("circle")
								.attr("r", 3.5)
								.attr("cx", function (d) { return xScale(d.date); })
								.attr("cy", function (d) { return yScale(d.new + d.on_the_books); })
								.attr("fill", function () {
									return colorMap[keyDate];
								})
								.style("cursor", "pointer")
								.on("mouseover", function () {
									tooltip.style("display", null);
								})
								.on("mouseout", function () {
									tooltip.style("display", "none");
								})
								.on("mousemove", function (d) {
									var xPosition = d3.mouse(this)[0] - 35,
										yPosition = d3.mouse(this)[1] - 42,
										dateText = moment(d.date, 'YYYY-MM-DD').format('MMM Do'),
										activeCount = keyDate === 'Mean' ? parseFloat(d.new + d.on_the_books).toFixed(2) :
											parseInt(d.new + d.on_the_books);

									tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
									tooltip.select(".item-qty")
										.text(dateText + " - " + activeCount);
									tooltip.select(".date-label")
										.text(keyDate);
								});
							initToolTip();
						};

						// draw grid lines
						svg.append("g")
							.attr("class", "grid")
							.call(drawGridLines()
								.tickSize(-width)
								.tickFormat("")
								.tickSizeOuter(0));

						// X axis
						svg.append("g")
							.attr("transform", "translate(0," + height + ")")
							.call(xAxis)
							.selectAll("text")
							.style("text-anchor", "end")
							.attr("dx", "-.8em")
							.attr("dy", xAxisDates.length > 20 ? "-.7em" : "-.15em")
							.attr("transform", "rotate(-65)")
							.attr("fill", function (date) {
								return checkIfDayIsToday(date) ? "#FFAB18" : "#000";
							})
							.attr("font-weight", function (date) {
								return checkIfDayIsToday(date) ? "bold" : "normal";
							});

						// Y axis
						svg.append("g")
							.attr("class", "axis axis--y")
							.attr("transform", "translate(0,0)")
							.call(yAxis);

						// draw rect on top of X axis
						rvAnalyticsHelperSrv.drawRectLines({
							svg: svg,
							xOffset: 0,
							height: 4,
							width: width,
							yOffset: height
						});
						// draw rect on top of Y axis
						rvAnalyticsHelperSrv.drawRectLines({
							svg: svg,
							xOffset: 0,
							height: height,
							width: 4,
							yOffset: 0
						});

						// draw line graphs
						_.each(dataForDateInfo, function (dataObject) {
							drawSingleLine(dataObject.chartData, dataObject.date);
						});

						// add right side legend
						var legendParentElement = d3.select("#right-side-legend");

						var legend = legendParentElement.selectAll(".legend")
							.data(colors)
							.enter()
							.append("g")
							.attr("class", "legend-item")
							.attr("transform", function (d, i) {
								return "translate(-100," + i * 30 + ")";
							})
							.on("click", function (d, i) {
								tooltip.remove();
								drawSingleLine(dataForDateInfo[i].chartData, dataForDateInfo[i].date);
							});

						legend.append("span")
							.attr("class", "bar")
							.style("background-color", function (d, i) {
								return colorMap[dataForDateInfo[i].date];
							});
						legend.append("span")
							.attr("class", "bar-label")
							.text(function (d, i) {
								return rvAnalyticsHelperSrv.textTruncate(dataForDateInfo[i].date, 35, '...');
							});

						rvAnalyticsHelperSrv.addChartHeading($scope.screenData.mainHeading,
							$scope.screenData.analyticsDataUpdatedTime);

					}
				};

				// The keys for the chart are dynamic and need to found out on fly and used for chart and in legends
				var chartDataKeys = [];

				_.each(dataForDateInfo, function (data) {
					chartDataKeys.push(data.date);
				});

				chartDataKeys = _.sortBy(chartDataKeys, function (date) {
					return date;
				});

				var colors = ['#F76707', '#FCC419', '#74B816', '#2B8A3E', '#12B886', '#1098AD',
					'#1864AB', '#4263EB', '#5F3DC4', '#9C36B5', '#E64980', '#E03131',

					'#F87A26', '#FCCB36', '#85C133', '#469956', '#30C195', '#2EA5B7',
					'#3577B5', '#5A77ED', '#7355CB', '#A84FBE', '#E96090', '#E44B4B',

					'#F98D45', '#FDD353', '#97CA50', '#60A76E', '#4DCAA4', '#4CB2C2',
					'#528BC0', '#718AF0', '#876ED3', '#B568C8', '#EC77A0', '#E86565',

					'#FAA064', '#FDDA6F', '#A8D36D', '#7AB686', '#6BD3B3', '#6ABFCC',
					'#6F9ECA', '#899EF2', '#9B86DA', '#C181D1', '#EF8DB0', '#EC7E7E',

					'#FBB383', '#FEE28C', '#BADB8B', '#95C59F', '#89DBC3', '#88CCD6',
					'#8BB2D5', '#A1B1F5', '#AF9EE2', '#CE9BDA', '#F2A4CO', '#EF9898'
				];

				// Till 50, use above color. After that use random colors
				if (colors.length > chartDataKeys.length) {
					colors = colors.slice(0, chartDataKeys.length + 1);
				} else {
					for (var i = colors.length; i <= chartDataKeys.length; i++) {
						colors.push('#' + Math.floor(Math.random() * 16777215).toString(16));
					}
				}

				initPaceLineChart.draw({
					key: chartDataKeys,
					colors: colors,
					element: 'd3-plot'
				});

				$scope.screenData.hideChartData = false;
				$scope.dashboardFilter.showFilters = false;
				$scope.$emit('REFRESH_ANALTICS_SCROLLER');
			};
		}
	]);