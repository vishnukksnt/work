angular.module('sntRover')
	.controller('rvMangerPaceChart', ['$scope', 'sntActivity', '$timeout', '$filter', 'rvManagersAnalyticsSrv', 'rvAnalyticsHelperSrv', '$rootScope', '$controller',
		function($scope, sntActivity, $timeout, $filter, rvManagersAnalyticsSrv, rvAnalyticsHelperSrv, $rootScope, $controller) {

			$controller('rvManagerPaceChartWithZoomCtrl', {
				$scope: $scope
			});
			$controller('rvManagerPaceLineChartCtrl', {
				$scope: $scope
			});
			var checkIfDayIsToday = function(dateToCompare) {
				var today = $rootScope.businessDate;
				var date = moment(dateToCompare).format('YYYY-MM-DD');

				return today === date;
			};
			var isPaceChartActive = function() {
				return $scope.dashboardFilter.selectedAnalyticsMenu === 'PACE';
			};
			var shallowDecodedParams = "";
			var paceChartData;

			var drawPaceChart = function(chartData, shallowDecodedParams) {
				$scope.dashboardFilter.showFilters = false;
				$scope.screenData.mainHeading = $filter('translate')("AN_PACE");
				$scope.screenData.isZoomedChart = false;

				if ($scope.dashboardFilter.lineChartActive) {
					$scope.startDrawingPaceLineChart(chartData, shallowDecodedParams);
					return;
				}
				else if (chartData.length > 60) {
					$scope.drawPaceChartWithZoom(chartData);
					$scope.screenData.isZoomedChart = true;
					return;
				}

				var chartDataMaxArray = [];
				var cancellationArray = [];

				// find maximum value that will appear in both side of X- axis
				_.each(chartData, function(data) {

					if (parseInt(data.new) + parseInt(data.on_the_books) > parseInt(data.cancellation)) {
						chartDataMaxArray.push(parseInt(data.new) + parseInt(data.on_the_books));
					} else {
						chartDataMaxArray.push(parseInt(data.cancellation));
					}
					data.cancellation = data.cancellation > 0 ? -1 * data.cancellation : data.cancellation;
					cancellationArray.push(data.cancellation < 0 ? -1 * data.cancellation : data.cancellation);
				});

				var data = chartData;
				var stackKeys = ["on_the_books", "new", "cancellation"];
				var stackKeysTags = ["On the books", "New", "Cancellation"];

				var series = d3.stack()
					.keys(stackKeys)
					.offset(d3.stackOffsetDiverging)
					(data);
				var maxValueInBothDirections = _.max(chartDataMaxArray);

				maxValueInBothDirections = maxValueInBothDirections + 1; // to add some extra spacing

				var maxValueInNegDirection = cancellationArray.length ? _.max(cancellationArray) : 0;
				var isNegativeSideVerySmall = maxValueInBothDirections / maxValueInNegDirection > 25;

				maxValueInNegDirection = maxValueInBothDirections / maxValueInNegDirection > 50 ? maxValueInNegDirection * 10 : maxValueInNegDirection;
				maxValueInNegDirection = maxValueInNegDirection + 1; // to add some extra spacing
				var margin = {
						top: 20,
						right: 30,
						bottom: 30,
						left: 60
					},
					width = document.getElementById("dashboard-analytics-chart").clientWidth,
					height = 500 - margin.top - margin.bottom;
					
				var svg = d3.select("#d3-plot").append("svg")
					.attr("width", width + margin.left + margin.right + 150)
					.attr("height", height + margin.top + margin.bottom)
					.append("g");

				var xScaleDomain = data.map(function(d) {
					return d.date;
				});
				var xScale = d3.scaleBand()
					.domain(xScaleDomain)
					.range([margin.left, width - 150])
					.padding(0.5);

				window.xScale = xScale;

				var yScale = d3.scaleLinear()
					.domain([-1 * maxValueInNegDirection, maxValueInBothDirections])
					.rangeRound([height - margin.bottom, margin.top]);

				var colors = ["#4185F4", "#6AA84F", "#FF0A00"];

				svg.append("g")
					.selectAll("g")
					.data(series)
					.enter().append("g")
					.attr("fill", function(d, i) {
						return colors[i];
					})
					.selectAll("rect")
					.data(function(d) {
						return d;
					})
					.enter()
					.append("rect")
					.attr("class", "rect-bars")
					.attr("width", xScale.bandwidth)
					.attr("x", function(d) {
						return xScale(d.data.date);
					})
					.attr("y", function(d) {
						return yScale(d[1]);
					})
					.style("cursor", "pointer")
					.on("mouseover", function() {
						tooltip.style("display", null);
					})
					.on("mouseout", function() {
						tooltip.style("display", "none");
					})
					.on("mousemove", function(d) {
						var xPosition = d3.mouse(this)[0] - 15;
						var yPosition = d3.mouse(this)[1] - 25;

						tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
						tooltip.select("text").text(d[1] - d[0]);
					});

				// Add transition before setting height for animation
				d3.selectAll(".rect-bars")
					.transition()
					.duration(800)
					.attr("height", function(d) {
						return yScale(d[0]) - yScale(d[1]);
					});

				var tooltip = svg.append("g")
					.attr("class", "tooltip")
					.style("display", "none");

				tooltip.append("rect")
					.attr("width", 30)
					.attr("height", 20)
					.attr("fill", "white")
					.style("opacity", 0.5);

				tooltip.append("text")
					.attr("x", 15)
					.attr("dy", "1.2em")
					.style("text-anchor", "middle")
					.attr("font-size", "12px")
					.attr("font-weight", "bold")
					.style("fill", "#000");

				var xAxis = d3.axisBottom(xScale)
					.tickSizeOuter(0)
					.tickSizeInner(0)
					.tickFormat(function() {
						return "";
					});

				var xAxisBottom = d3.axisBottom(xScale)
					.ticks(5)
					.tickSizeOuter(0)
					.tickFormat(function(date, i) {
						var multiple;
						var dateFormat = 'DD MMM';

						// if there are more days, show only some dates to make it less crowded
						if (chartData.length > 200) {
							multiple = 30;
							dateFormat = 'DD MMM  YY';
						} else if (chartData.length > 100) {
							multiple = 10;
							dateFormat = 'DD MMM  YY';
						} else if (chartData.length > 60) {
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

				var yAxis = d3.axisLeft(yScale)
					.tickSizeOuter(0)
					.tickPadding(10)
					.tickSizeInner(0)
					.tickFormat(function(count) {
						return count < 0 ? -1 * count : count;
					});

				// Original X axis
				svg.append("g")
					.attr("transform", "translate(0," + yScale(0) + ")")
					.call(xAxis);
				// Original Y axis
				svg.append("g")
					.attr("transform", "translate(" + margin.left + ",0)")
					.call(yAxis);
				// Extra X axis to show ticks
				svg.append("g")
					.attr("transform", "translate(0," + yScale(-1 * maxValueInNegDirection) + ")")
					.call(xAxisBottom)
					.selectAll("text")
					.style("text-anchor", "end")
					.attr("dx", "-.8em")
					.attr("dy", data.length > 20 ? "-.7em" : "-.15em")
					.attr("transform", "rotate(-65)")
					.attr("fill", function(date) {
						return checkIfDayIsToday(date) ? "#FFAB18" : "#000";
					})
					.attr("font-weight", function(date) {
						return checkIfDayIsToday(date) ? "bold" : "normal";
					});

				// Draw rect on top of the original X axis
				var axisHeight = isNegativeSideVerySmall ? 2 : 4;

				rvAnalyticsHelperSrv.drawRectLines({
					svg: svg,
					xOffset: margin.left,
					height: axisHeight,
					width: width - 150,
					yOffset: yScale(0)
				});
				// Draw rect on top of the extra X axis
				rvAnalyticsHelperSrv.drawRectLines({
					svg: svg,
					xOffset: margin.left,
					height: 4,
					width: width - 150,
					yOffset: yScale(-1 * maxValueInNegDirection)
				});
				// Draw rect on top of the Y axis
				rvAnalyticsHelperSrv.drawRectLines({
					svg: svg,
					xOffset: margin.left,
					height: yScale(-1 * maxValueInNegDirection) - yScale(maxValueInBothDirections),
					width: 4,
					yOffset: margin.top
				});

				var legendParentElement = d3.select("#right-side-legend");
				var legend = legendParentElement.selectAll(".legend")
					.data(colors)
					.enter().append("g")
					.attr("class", "legend-item")
					.attr("transform", function(d, i) {
						return "translate(-100," + i * 30 + ")";
					});

				legend.append("span")
					.attr("class", "bar")
					.style("background-color", function(d, i) {
						return colors[i];
					});
				legend.append("span")
					.attr("class", "bar-label")
					.text(function(d, i) {
						return rvAnalyticsHelperSrv.textTruncate(stackKeysTags[i], 35, '...');
					});

				$scope.screenData.hideChartData = false;
				rvAnalyticsHelperSrv.addChartHeading($scope.screenData.mainHeading,
					$scope.screenData.analyticsDataUpdatedTime);
				$scope.$emit('REFRESH_ANALTICS_SCROLLER');
			};

			var fetchPaceChartData = function() {
				$scope.dashboardFilter.displayMode = 'CHART_DETAILS';
				$scope.dashboardFilter.selectedAnalyticsMenu = 'PACE';
				$scope.$emit('FETCH_SAVED_ANALYTICS_FILTERS');
				var options = {
					params: {
						date: $scope.dashboardFilter.datePicked,
						shallowDecodedParams: shallowDecodedParams
					},
					successCallBack: function(data) {
						if (data && data.length === 0) {
							data = [{
								new: 0,
								cancellation: 0,
								on_the_books: 0,
								date: $scope.dashboardFilter.datePicked
							}];
						}
						$scope.$emit("CLEAR_ALL_CHART_ELEMENTS");
						$scope.screenData.analyticsDataUpdatedTime = moment().format("dddd, MMMM Do YYYY, h:mm:ss a");
						paceChartData = data;
						drawPaceChart(data, shallowDecodedParams);
					}
				};
				$scope.callAPI(rvManagersAnalyticsSrv.pace, options);

			};

			var redrawPaceChartIfNeeded = function() {
				if (!isPaceChartActive()) {
					return;
				}
				fetchPaceChartData();
			};

			$scope.$on('GET_MANAGER_PACE', function() {
				shallowDecodedParams = "";
				$scope.dashboardFilter.selectedAnalyticsMenu = 'PACE';
				redrawPaceChartIfNeeded();
			});
			$scope.$on('ANALYTICS_FILTER_CHANGED', function(e, data) {
				shallowDecodedParams = data;
				redrawPaceChartIfNeeded();
			});

			$scope.$on('RELOAD_DATA_WITH_DATE_FILTER_PACE', redrawPaceChartIfNeeded);
			$scope.$on('CHART_AGGGREGATION_CHANGED', redrawPaceChartIfNeeded);
			$scope.$on('REFRESH_ANALYTCIS_CHART_PACE', function() {
				shallowDecodedParams = "";
				$scope.$emit('RESET_CHART_FILTERS');
				fetchPaceChartData();
			});
			$scope.$on('ON_WINDOW_RESIZE', function() {
				if (!isPaceChartActive()) {
					return;
				} else if (paceChartData) {
					drawPaceChart(paceChartData);
				} else {
					redrawPaceChartIfNeeded();
				}
			});

			$scope.$on('PACE_CHART_CHANGED', redrawPaceChartIfNeeded);

		}
	]);