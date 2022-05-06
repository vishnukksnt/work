angular.module('sntRover')
	.controller('rvManagerPaceChartWithZoomCtrl', ['$scope', 'rvAnalyticsHelperSrv',
		function($scope, rvAnalyticsHelperSrv) {

			$scope.drawPaceChartWithZoom = function(chartData) {

				// sizing information, including margins so there is space for labels, etc
				var margin = {
						top: 40,
						right: 20,
						bottom: 100,
						left: 40
					},
					width = window.innerWidth * 2/3,
					height = 600 - margin.top - margin.bottom,
					marginOverview = {
						top: 530,
						right: margin.right,
						bottom: 20,
						left: margin.left
					},
					heightOverview = 600 - marginOverview.top - marginOverview.bottom;

				// set up a date parsing function for future use
				var parseDate = d3.timeParse("%Y-%m-%d");
				// some colours to use for the bars
				var colour = d3.scaleOrdinal()
					.range(["green", "blue", "red"]);

				// mathematical scales for the x and y axes
				var x = d3.scaleTime()
					.range([0, width]);
				var y = d3.scaleLinear()
					.range([height - 200, 0]);
				var xOverview = d3.scaleTime()
					.range([0, width]);
				var yOverview = d3.scaleLinear()
					.range([heightOverview, 0]);

				// rendering for the x and y axes
				var xAxis = d3.axisBottom()
					.scale(x)
					.tickFormat(function() {
						return "";
					})
					.tickSizeOuter(0)
					.tickSizeInner(0);
				var xAxisBottom = d3.axisBottom()
					.scale(x);
				var yAxis = d3.axisLeft()
					.scale(y)
					.tickPadding(20)
					.tickSizeOuter(0)
					.tickSizeInner(-width);
				var xAxisOverview = d3.axisBottom()
					.scale(xOverview)
					.tickPadding(10);

				// something for us to render the chart into
				var svg = d3.select("#d3-plot")
					.append("svg") // the overall space
					.attr("width", width + margin.left + margin.right)
					.attr("height", height + margin.top + margin.bottom + 20);
				var main = svg.append("g")
					.attr("class", "main")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
				var overview = svg.append("g")
					.attr("class", "overview")
					.attr("transform", "translate(" + marginOverview.left + "," + marginOverview.top + ")");

				// by habit, cleaning/parsing the data and return a new object to ensure/clarify data object structure
				function parse(d) {
					if (!d.date) {
						return;
					}
					var value = {
						date: parseDate(d.date)
					}; // turn the date string into a date object

					// adding calculated data to each count in preparation for stacking
					var y0 = 0; // keeps track of where the "previous" value "ended"
					
					value.counts = ["on_the_books", "new", "cancellation"].map(function(name) {
						return {
							date: d.date,
							name: name,
							y0: name === "cancellation" ? (d[name]) : y0,
							// add this count on to the previous "end" to create a range, and update the "previous end" for the next iteration
							y1: name === "cancellation" ? 0 : (y0 += +d[name])
						};
					});

					// var onBooks = _.find(value.counts, function(count) {
					// 	return count.name === 'on_the_books';
					// });
					var newBookings = _.find(value.counts, function(count) {
						return count.name === 'new';
					});
					var cancellations = _.find(value.counts, function(count) {
						return count.name === 'cancellation';
					});

					value.total = newBookings.y1;
					value.cancellation = -1 * cancellations.y0;
					return value;
				}

				// zooming/panning behaviour for overview chart
				function brushed() {
					if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") {
						return; // ignore brush-by-zoom
					}
					var s = d3.event.selection || xOverview.range();

					x.domain(s.map(xOverview.invert, xOverview));
					main.selectAll(".bar.stack")
						.attr("transform", function(d) {
							return "translate(" + x(d.date) + ",0)";
						})
						.attr("style", function(d) {
							// hide bars transformed to left of axis
							return x(d.date) < 0 ? "display: none" : "";
						});
					// redraw the x axis of the main chart
					main.select(".x.axis").call(xAxis);
					main.select(".x.axis").call(xAxisBottom);
				}

				// brush tool to let us zoom and pan using the overview chart
				var brush = d3.brushX()
					.extent([
						[xOverview.range()[0], 0],
						[xOverview.range()[1], heightOverview]
					])
					.on("brush", brushed);

				// process data
				_.each(chartData, function(item) {
					item.cancellation = item.cancellation <= 0 ? item.cancellation : -1 * item.cancellation;
				});
				var data = [];

				_.each(chartData, function(d) {
					data.push(parse(d));
				});

				// data ranges for the x and y axes
				x.domain(d3.extent(data, function(d) {
					return d.date;
				}));

				var maxYValue = d3.max(data, function(d) {
					return d.total;
				});
				var minYValue = d3.max(data, function(d) {
					return d.cancellation;
				});

				y.domain([-1 * minYValue, maxYValue]);


				xOverview.domain(x.domain());
				yOverview.domain(y.domain());
				colour.domain(["on_the_books", "new", "cancellation"]);

				// draw the axes now that they are fully set up
				main.append("g")
					.attr("class", "x axis")
					.attr("transform", "translate(0," + (height - 150) + ")")
					.call(xAxisBottom);

				main.append("g")
					.attr("class", "x axis")
					.attr("transform", "translate(0," + y(0) + ")")
					.call(xAxis);

				main.append("g")
					.attr("class", "y axis grid-chart")
					.call(yAxis);
				overview.append("g")
					.attr("class", "x axis")
					.attr("transform", "translate(0," + heightOverview + ")")
					.call(xAxisOverview);

				// draw the bars
				main.append("g")
					.attr("class", "bars")
					// a group for each stack of bars, positioned in the correct x position
					.selectAll(".bar.stack")
					.data(data)
					.enter()
					.append("g")
					.attr("class", "bar stack")
					.attr("transform", function(d) {
						return "translate(" + x(d.date) + ",0)";
					})
					// a bar for each value in the stack, positioned in the correct y positions
					.selectAll("rect")
					.data(function(d) {
						return d.counts;
					})
					.enter()
					.append("rect")
					.attr("class", "bar")
					.attr("width", 6)
					.attr("y", function(d) {
						return y(d.y1);
					})
					.attr("height", function(d) {

						return y(d.y0) - y(d.y1);
					})
					.style("cursor", "pointer")
					.style("fill", function(d) {
						return colour(d.name);
					})
					.on("mouseover", function() {
						tooltip.style("display", "block");
					})
					.on("mouseout", function() {
						tooltip.style("display", "none");
					})
					.on("mousemove", function(d) {
						tooltip.select(".date-label").text(moment(d.date, 'YYYY-MM-DD').format('MMM Do, YYYY'));
						tooltip.select(".item-value").text(d.name.replace(/_/g, " ").toUpperCase() + ": " + (d.y1 - d.y0));
					});
				// Prep the tooltip bits, initial display is hidden
				var tooltip = svg.append("g")
					.attr("class", "tooltip")
					.style("display", "none");

				tooltip.append("rect")
					.attr("width", 250)
					.attr("height", 50)
					.attr("fill", "none")
					.style("opacity", 0.5)
					.attr("transform", "translate(" + width / 2 + "," + 0 + ")");

				tooltip.append("text")
					.attr('class', 'date-label')
					.attr("x", 14)
					.attr("dy", "1em")
					.style("text-anchor", "middle")
					.style("fill", "black")
					.attr("font-size", "12px")
					.attr("font-weight", "bold")
					.attr("transform", "translate(" + width / 2 + "," + 0 + ")");

				tooltip.append("text")
					.attr('class', 'item-value')
					.attr("x", 14)
					.attr("dy", "1.8em")
					.style("text-anchor", "middle")
					.style("fill", "black")
					.attr("font-size", "14px")
					.attr("font-weight", "bold")
					.attr("transform", "translate(" + width / 2 + "," + 0 + ")");

				overview.append("g")
					.attr("class", "bars")
					.selectAll(".bar")
					.data(data)
					.enter()
					.append("rect")
					.attr("class", "bar")
					.attr("x", function(d) {
						return xOverview(d.date) - 3;
					})
					.attr("width", 6)
					.attr("y", function(d) {
						// console.log(d)
						return yOverview(d.total);
					})
					.style("fill", "black")
					.attr("height", function(d) {
						return (heightOverview - (yOverview(d.cancellation + d.total)));
					});

				// add the brush target area on the overview chart
				overview.append("g")
					.attr("class", "x brush")
					.call(brush)
					.call(brush.move, x.range())
					.on("click", brushed)
					.selectAll("rect")
					// -6 is magic number to offset positions for styling/interaction to feel right
					.attr("y", -6)
					// need to manually set the height because the brush has
					// no y scale, i.e. we should see the extent being marked
					// over the full height of the overview chart
					.attr("height", heightOverview + 7); // +7 is magic number for styling


				var stackKeysTags = ["On the books", "New", "Cancellation"];
				var colors = ["green", "blue", "red"];
				var legendParentElement = d3.select("#right-side-legend");
				var legend = legendParentElement.selectAll(".legend")
					.data(colors)
					.enter()
					.append("g")
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
			};
		}
	]);