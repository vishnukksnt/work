angular.module('sntRover').controller('rvItemInventoryGraphStatusController', [
	'$scope',
	'rvAvailabilitySrv',
	'dateFilter',
	'$rootScope',
	'$timeout',
	function($scope, rvAvailabilitySrv, dateFilter, $rootScope, $timeout) {
		BaseCtrl.call(this, $scope);

		var plottedChart = null;
		var isAlreadyRemoved = false;

  		$scope.hideMeBeforeFetching = false;

  		$scope.graphWidth = '1000';
		// we need horizonat scroller so adding option 'scrollX', also need to get the click event on toggling button on available room
		var scrollerOptionsForGraph = {scrollX: true, click: true, preventDefault: false};

  		$scope.setScroller ('graph-scroller', scrollerOptionsForGraph);


 		var colors = ['#c1c1c1', '#dc829c', '#83c3df', '#82de89', '#f6981a', '#f2d6af'];
 		var legendClasses = [];
 		var timeoutFunction = null;

 		for (var i = 0 ;i < colors.length; i++) {
 			legendClasses.push("background: " + colors[i] + " !important;");
		}

		$scope.returnLegendStyle  = function (index, legendModel) {
			if (legendModel) {
				return legendClasses[index];
			}
			else {
				return "";
			}
		};

		var resizedWindow = function() {
			/*
			 *	Caution, DOM accessing, TODO: try to convert it into angular way
			 */
			var navListNode = $("#graph-showing-area #nav-listing");
			var LabelElements = navListNode.find("ul li");

        	navListNode.css({"left": plottedChart.plotLeft, "width": plottedChart.plotSizeX});
        	var labelWidthToSet = 0;

        	$scope.graphWidth = getMaxSeriesLengthData() * 75;
        	if (getMaxSeriesLengthData() !== 0) {
        		labelWidthToSet = (100 / getMaxSeriesLengthData());
        	}
        	else {
        		navListNode.css("width", 0);
        	}
        	LabelElements.css("width", labelWidthToSet + "%");
        	$scope.refreshScroller('graph-scroller');

		};
		
		var getMaxSeriesLengthData = function() {
			var max = 0;

			for (var i = 0; i < plottedChart.series.length; i++) {
				if (plottedChart.series[i].visible) {
					max = max < plottedChart.series[i].data.length ? plottedChart.series[i].data.length  : max;
				}
			}
			return max;
		};


		var formGraphData = function() {
			$scope.graphData = [{
				name: 'Bookable Rooms',
				data: $scope.data.bookableRooms,
				yAxis: 0,
				checked: false,
				color: colors[0]
			}, {
				name: 'Out of Order Rooms',
				data: $scope.data.outOfOrderRooms,
				yAxis: 0,
				checked: false,
				color: colors[1]
			}, {
				name: 'Total Reserved',
				data: $scope.data.reservedRooms,
				yAxis: 0,
				checked: true,
				color: colors[2]
			}, {
				name: 'Available Rooms',
				data: $scope.data.availableRooms,
				yAxis: 0,
				checked: false,
				color: colors[3]
			}, {
				name: 'Occupancy Actual',
				data: $scope.data.occupanciesActual,
				yAxis: 0,
				checked: false,
				marker: {
					symbol: 'circle',
					radius: 5
				},
				color: colors[4]
			}];

			// we are adding occupancy target between if it has setuped in rate manager
			if ($scope.data.IsOccupancyTargetSetBetween) {
				$scope.graphData.push({
					name: 'Occupancy Target',
					data: $scope.data.occupanciesTargeted,
					yAxis: 0,
					checked: false
				});
			}

 		};

 		$scope.clickedOnLegend = function(legendName, model) {
 			for (var i = 0; i < plottedChart.series.length; i++) {
 				if (plottedChart.series[i].name === legendName) {
 					if (model) {
 						plottedChart.series[i].hide();
 					}
 					else {
 						plottedChart.series[i].show();
 					}
 					break;
 				}
 			}
 			resizedWindow();

 		};


		var doInitialOperation = function () {
			$scope.data = rvAvailabilitySrv.getGraphData();
			formGraphData();

			Highcharts.theme = {
				colors: colors,
				chart: {
					backgroundColor: 'white',
					borderColor: '#FFFF',
					borderWidth: 2,
					plotBackgroundColor: '#F7F7F7',
					plotBorderColor: '#FFF',
					plotBorderWidth: 2,
					marginLeft: 4

				},

				xAxis: {
					gridLineColor: '#FFF',
					gridLineWidth: 2,
					labels: {
						useHTML: true
					},
					lineColor: '#FFF',
					tickColor: '#FFF',
					title: {
						style: {
							color: '#CCC',
							fontWeight: 'bold',
							fontSize: '12px',
							fontFamily: 'Trebuchet MS, Verdana, sans-serif'

						}
					},
					opposite: true
				},
				yAxis: [
				{
					gridLineColor: '#dedede',
					labels: {
			            style: {
				            color: '#f6981a',
				            fontWeight: 'bold'
				         }
					},
					lineColor: '#A0A0A0',
					minorTickInterval: null,
					tickColor: '#A0A0A0',
					tickWidth: 1,
					title: {
						style: {
							color: '#CCC',
							fontWeight: 'bold',
							fontSize: '12px',
							fontFamily: 'Trebuchet MS, Verdana, sans-serif'
						}
					}
				}],
				tooltip: {
					backgroundColor: 'rgba(0, 0, 0, 0.75)',
					style: {
						color: '#F0F0F0'
					}
				},

				plotOptions: {
					series: {
						fillOpacity: .25
					}


				}


			   // scroll charts

			};


			// Apply the theme
			var highchartsOptions = Highcharts.setOptions(Highcharts.theme);

			$scope.availabilityGraphCongif = {
				options: {
					chart: {
						type: 'area'
					},
					legend: {
						enabled: false
					},
					tooltip: {
			            formatter: function () {
			                return '<b>' + dateFilter(this.x.dateObj, $rootScope.dayInWeek) + " " + dateFilter(this.x.dateObj, $rootScope.shortMonthAndDate) + '</b><br/>' +
			                       this.series.name +  ': ' + Math.round((this.y / 100) * $scope.data.totalRooms) + " Rooms (" + this.y.toFixed(2) + "%)";
			            }
				    }
				},

				title: {
					text: ''
				},
				xAxis: {

					showLastLabel: true,
    				endOnTick: true,
					min: 0,
					categories: $scope.data.dates,
					type: 'category',
					labels: {
						enabled: false,
						x: 0,
						y: -50,
						useHTML: true,
						opposite: true
					},
					tickPosition: 'inside',
					tickWidth: 0
				},
				yAxis: [
				{
					showLastLabel: true,
    				endOnTick: true,
					floor: 0,
					ceiling: 100,
					title: {
						text: ''
					},
					max: 100,
					minRange: 100,
					tickInterval: 10,
					labels: {
						    align: 'left',
                			x: 0,
               				y: -2,
               				style: {
				            	color: '#f6981a'
				         	},
				         	formatter: function() {
				         		return this.value + "%";
				         	}
					},
					tickPosition: 'outside',
					tickWidth: 0

				}
				],

				series: $scope.graphData,
			    func: function (chart) { // on complete
			        	plottedChart = chart;
			        	setTimeout(function() {
			        		$scope.$apply(function() {

					        	for (var i = 0; i < $scope.graphData.length; i++) {
					        		$scope.clickedOnLegend($scope.graphData[i].name, !$scope.graphData[i].checked);
					        	}
					        	$scope.graphWidth = getMaxSeriesLengthData() * 75;
					        	resizedWindow();

			        		});

			        	}, 150);

			        	$(window).resize(function() {
			        		timeoutFunction = $timeout(function() {
			        			resizedWindow();
			        			$scope.refreshScroller('graph-scroller');
			        		}, 500);
			        	});

			        }

			    };

			$scope.$emit("hideLoader");
		};

		$scope.data = rvAvailabilitySrv.getGraphData();
  		// if already fetched we will show without calling the API
		if (!isEmptyObject($scope.data)) {
			formGraphData();
			doInitialOperation();

			$scope.$emit("hideLoader");

	       setTimeout(function() {

        		$scope.$apply(function() {
        			resizedWindow();
        			$scope.hideMeBeforeFetching = true;
        		});
        		$(window).resize();

        	}, 500);

		}

		/**
		* when data changed from super controller, it will broadcast an event 'changedRoomAvailableData'
		*/
		var cr = $scope.$on("changedRoomAvailableData", function (event) {
			if (!isAlreadyRemoved) {
				$scope.hideMeBeforeFetching = false;
				doInitialOperation();
	        	setTimeout (function () {
		        	for (var i = 0; i < $scope.graphData.length; i++) {
		        		$scope.clickedOnLegend($scope.graphData[i].name, !$scope.graphData[i].checked);
		        	}
		        	$scope.$apply (function () {
		        		resizedWindow();
		        		$scope.hideMeBeforeFetching = true;
		        	});
		        	$(window).resize();
	        	}, 1000);
        	}
		});

		$scope.$on("$destroy", function() {
			isAlreadyRemoved = true;
			$(window).unbind('resize');
			if (timeoutFunction) {
				$timeout.cancel(timeoutFunction);
			}
		});


	}
]);