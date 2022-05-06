angular.module('sntRover')
  .controller('rvFrontOfficeActivityCtrl', ['$scope', 'sntActivity', '$timeout', '$filter', 'rvAnalyticsHelperSrv', 'rvAnalyticsSrv', 'rvFrontOfficeAnalyticsSrv',
    function($scope, sntActivity, $timeout, $filter, rvAnalyticsHelperSrv, rvAnalyticsSrv, rvFrontOfficeAnalyticsSrv) {

      var drawFrontOfficeActivity = function(chartData) {

        $scope.screenData.mainHeading = $filter('translate')(chartData.label);

        var legendColorMappings = {        
          "Early Check in": "bar bar-green bar-dark",
          "Checkin": "bar bar-green bar-light",
          "VIP checkin": "bar  bar-yellow",
          "VIP checkout": "bar bar-yellow bar-dark",
          "Late checkout": "bar bar-red bar-dark",
          "Checkout": "bar bar-red",
                
        };

        var colorMappings = {
          "earlyCheckin": {
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
          "vipCheckin": {
            "legend_class": "bar bar-yellow",
            "fill": "yellow",
            "onmouseover_fill": "yellowHover",
            "onmouseout_fill": "yellow"
          },
          "vipCheckout": {
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
          "lateCheckout": {
            "legend_class": "bar bar-red bar-dark",
            "fill": "redDark",
            "onmouseover_fill": "redDarkHover",
            "onmouseout_fill": "redDark"
          }
        };

        // TO DELETE
        // rvAnalyticsHelperSrv.addDebugDataForFoActivity(chartData);

        var emptyElement = {
          "earlyCheckin": 0,
          "checkin": 0,
          "vipCheckin": 0,
          "vipCheckout": 0,
          "checkout": 0,
          "lateCheckout": 0,
          "time": ""
        };

        var totalActionsCount = {
          earlyCheckin: 0,
          vipCheckin: 0,
          checkin: 0,
          vipCheckout: 0,
          checkout: 0,
          lateCheckout: 0
        };

        _.each(chartData.todays_data, function(timeData) {
          totalActionsCount['earlyCheckin'] = totalActionsCount['earlyCheckin'] + timeData.earlyCheckin;
          totalActionsCount['checkin'] = totalActionsCount['checkin'] + timeData.checkin;
          totalActionsCount['vipCheckin'] = totalActionsCount['vipCheckin'] + timeData.vipCheckin;
          totalActionsCount['vipCheckout'] = totalActionsCount['vipCheckout'] + timeData.vipCheckout;
          totalActionsCount['checkout'] = totalActionsCount['checkout'] + timeData.checkout;
          totalActionsCount['lateCheckout'] = totalActionsCount['lateCheckout'] + timeData.lateCheckout;
        });

        if ($scope.dashboardFilter.showPreviousDayData) {
          _.each(chartData.yesterdays_data, function(timeData) {
            totalActionsCount['earlyCheckin'] = totalActionsCount['earlyCheckin'] + timeData.earlyCheckin;
            totalActionsCount['checkin'] = totalActionsCount['checkin'] + timeData.checkin;
            totalActionsCount['vipCheckin'] = totalActionsCount['vipCheckin'] + timeData.vipCheckin;
            totalActionsCount['vipCheckout'] = totalActionsCount['vipCheckout'] + timeData.vipCheckout;
            totalActionsCount['checkout'] = totalActionsCount['checkout'] + timeData.checkout;
            totalActionsCount['lateCheckout'] = totalActionsCount['lateCheckout'] + timeData.lateCheckout;
          });
        }

        chartData.todays_data.unshift(emptyElement);
        chartData.yesterdays_data.unshift(emptyElement);

        var w = document.getElementById("dashboard-analytics-chart").clientWidth * 3/4,
          h = 500,
          padding = 40;

        var svg = d3.select("#d3-plot")
          .append("svg")
          .attr('width', w)
          .attr('height', h);

        var chartKeys = ['earlyCheckin', 'checkin', 'vipCheckin', 'vipCheckout', 'checkout', 'lateCheckout'];
        var stack = d3.stack()
          .keys(chartKeys);

        var datasets;

        if ($scope.dashboardFilter.showPreviousDayData) {
          datasets = [d3.stack().keys(chartKeys)(chartData.yesterdays_data),
            d3.stack().keys(chartKeys)(chartData.todays_data)
          ];
        } else {
          datasets = [d3.stack().keys(chartKeys)(chartData.todays_data)];
        }

        var num_groups = datasets.length;

        var xlabels = chartData.todays_data.map(function(d) {
          return d['time'];
        });
        var xscale = d3.scaleBand()
          .domain(xlabels)
          .range([padding, w - padding])
          .paddingInner(0.5);

        var ydomain_min = d3.min(datasets.flat()
          .map(function(row) {
            return d3.min(row.map(function(d) {
              return d[1];
            }));
          }));

        var ydomain_max = d3.max(datasets.flat().map(function(row) {
          return d3.max(row.map(function(d) {
            return d[1];
          }));
        }));

        var yscale = d3.scaleLinear().domain([0, ydomain_max]).range([h - padding, padding]);

        var colorMapping = d3.scaleOrdinal()
          .range(["#569819", "#9BD472", "#6ED420", "#E42715", "#E53318", "#E58A75"])
          .domain(chartKeys);

        var xaxis = d3.axisBottom()
          .scale(xscale)
          .tickSizeOuter(0)
          .ticks(5)
          .tickPadding(15);
        var yaxis = d3.axisLeft()
          .scale(yscale)
          .ticks(10)
          .tickSizeOuter(0)
          .tickFormat(function(d) {
            return d === 0 ? "" : d;
          });

        svg.append('g')
          .attr('class', 'axis x')
          .attr('transform', 'translate(0,' + (h - padding) + ")")
          .call(xaxis);

        svg.append('g')
          .attr('class', 'axis y')
          .attr('transform', 'translate(' + padding + ",0)")
          .call(yaxis);

        d3.range(num_groups).forEach(function(gnum) {
          svg.selectAll('g.group' + gnum)
            .data(datasets[gnum])
            .enter()
            .append('g')
            .attr("fill", function(item) {
              var fillColor = colorMappings[item.key].fill;

              return "url(#" + fillColor + ")";
            })
            .attr("onmouseover", function(item) {
              var mouseoverColor = colorMappings[item.key].onmouseover_fill;

              return "evt.target.setAttribute('fill', 'url(#" + mouseoverColor + " )');";
            })
            .attr("onmouseout", function(item) {
              var mouseoutColor = colorMappings[item.key].onmouseout_fill;

              return "evt.target.setAttribute('fill', 'url(#" + mouseoutColor + " )');";
            })
            .attr('fill-opacity', function(d) {
              return $scope.dashboardFilter.showPreviousDayData && gnum === 0 ? 0.3 : 1;
            })
            .attr('class', 'group' + gnum)
            .selectAll('rect').data(function(d) {
              return d;
            }).enter()
            .append('rect')
            .attr("class", "rect-bars")
            .attr('x', function(d, i) {
              var xOffset = xscale(xlabels[i]) + xscale.bandwidth() / 2 * gnum;

              return xOffset + gnum * 2; // xOffset + some margin
            })
            .style("margin-right", "10px")
            .attr('y', function(d) {
              return yscale(d[1]);
            })
            .attr('width', function() {
              return (xscale.bandwidth() / num_groups);
            });
        });
        d3.selectAll(".rect-bars")
          .transition()
          .duration(800)
          .attr('height', function(d) {
            return yscale(d[0]) - yscale(d[1]);
          });

        rvAnalyticsHelperSrv.drawRectLines({
          svg: svg,
          xOffset: 0,
          height: 4,
          width: w,
          yOffset: h - padding
        });

        rvAnalyticsHelperSrv.drawRectLines({
          svg: svg,
          xOffset: 0 + padding,
          height: h,
          width: 4,
          yOffset: 0
        });

        /************************** RIGHT LEGEND STARTS HERE ************************/

        var rightSideLegendDiv = d3.select("#right-side-legend");
        var arrivalsLegendData = {
          "title": "Arrivals",
          "id": "arrivals-right-title",
          "margin_top": 0,
          "items": [{
            "id": "right-legend-early-checkin",
            "class": legendColorMappings["Early Check in"],
            "label": "Early Check in",
            "count": totalActionsCount.earlyCheckin
          }, {
            "id": "right-legend-checkin",
            "class": legendColorMappings["Checkin"],
            "label": "Checkin",
            "count": totalActionsCount.checkin
          }, {
            "id": "right-legend-vip-checkin",
            "class": legendColorMappings["VIP checkin"],
            "label": "VIP checkin",
            "count": totalActionsCount.vipCheckin
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
            "count": totalActionsCount.vipCheckout
          }, {
            "id": "right-legend-checkout",
            "class": legendColorMappings["Checkout"],
            "label": "Checkout",
            "count": totalActionsCount.checkout
          }, {
            "id": "right-legend-late-checkout",
            "class": legendColorMappings["Late checkout"],
            "label": "Late checkout",
            "count": totalActionsCount.lateCheckout
          }]
        };

        rvAnalyticsHelperSrv.addLegendItems(legendColorMappings, rightSideLegendDiv, arrivalsLegendData);
        rvAnalyticsHelperSrv.addLegendItems(legendColorMappings, rightSideLegendDiv, departuresLegendData);

        d3.selectAll(".axis.y .tick line").attr("x2", w);
        /************************** RIGHT LEGEND END HERE ************************/

        $scope.$emit('REFRESH_ANALTICS_SCROLLER');
        $scope.screenData.hideChartData = false;
      };
      var chartData;
      var drawChartAndAddHeading = function(chartData) {
        $timeout(function() {
          $scope.$emit("CLEAR_ALL_CHART_ELEMENTS");
          drawFrontOfficeActivity(chartData);
          rvAnalyticsHelperSrv.addChartHeading($scope.screenData.mainHeading,
            $scope.screenData.analyticsDataUpdatedTime);
        }, 50);
      };
      var renderFrontOfficeActivity = function() {
        rvFrontOfficeAnalyticsSrv.fdFoActivity($scope.dashboardFilter.datePicked).then(function(data) {
          chartData = data;
          drawChartAndAddHeading(chartData);
        });
      };

      var getFoActivityChartData = function(date) {
        $scope.dashboardFilter.displayMode = 'CHART_DETAILS';
        $scope.dashboardFilter.selectedAnalyticsMenu = 'FO_ACTIVITY';
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
            renderFrontOfficeActivity();
          }
        };

        $scope.callAPI(rvAnalyticsSrv.initRoomAndReservationApis, options);
      };

      // Initial fetch
      $scope.$on('GET_FO_ACTIVITY', getFoActivityChartData);

      // On filter changes
      $scope.$on('RELOAD_DATA_WITH_SELECTED_FILTER_FO_ACTIVITY', renderFrontOfficeActivity);
      $scope.$on('RELOAD_DATA_WITH_DATE_FILTER_FO_ACTIVITY', getFoActivityChartData);
      $scope.$on('REFRESH_ANALYTCIS_CHART_FO_ACTIVITY', getFoActivityChartData);

      $scope.$on('ON_WINDOW_RESIZE', function() {
        if ($scope.dashboardFilter.selectedAnalyticsMenu === 'FO_ACTIVITY' && chartData) {
          drawChartAndAddHeading(chartData);
        }
      });
    }
  ]);