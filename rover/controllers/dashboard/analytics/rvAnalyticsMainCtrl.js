sntRover.controller('rvAnalyticsMainController', ['$scope',
	'$rootScope',
	'$state',
	'rvAnalyticsSrv',
	'$controller',
	'$timeout',
	'$filter',
	function($scope, $rootScope, $state, rvAnalyticsSrv, $controller, $timeout, $filter) {

		BaseCtrl.call(this, $scope);

		// Available charts in sorted order
		$scope.availableCharts = ['managerPerfomance',
			'managerDistribution',
			'managerPace',
			'hkOverview'
		];

		var includeHKCharts = $scope.dashboardFilter.isHkDashboard || $scope.dashboardFilter.isManagerDashboard;
		var includeFOCharts = $scope.dashboardFilter.isFrontDeskDashboard || $scope.dashboardFilter.isManagerDashboard;
		var incluseManagerCharts = $scope.dashboardFilter.isManagerDashboard;

		$scope.availableChartsList = [];

		if (includeHKCharts) {
			$controller('rvHKOverviewAnalticsCtrl', {
				$scope: $scope
			});
			$controller('rvHkWokrPriorityCtrl', {
				$scope: $scope
			});

			var houseKeepingCharts = [{
				name: 'Overview',
				department: 'HOUSEKEEPING',
				fetchDataEvent: 'GET_HK_OVERVIEW',
				tileDescription: 'HK_OVERVIEW_DESC'
			}, {
				name: 'Priority',
				department: 'HOUSEKEEPING',
				fetchDataEvent: 'GET_HK_WORK_PRIORITY',
				tileDescription: 'HK_PRIORITY_DESC'
			}];

			$scope.availableChartsList = $scope.availableChartsList.concat(houseKeepingCharts);
		}

		if (includeFOCharts) {
			$controller('rvFrontOfficeManagementAnalyticsCtrl', {
				$scope: $scope
			});
			$controller('rvFrontOfficeActivityCtrl', {
				$scope: $scope
			});
			$controller('rvFrontOfficeWorkloadCtrl', {
				$scope: $scope
			});

			var foCharts = [{
				name: 'Arrivals',
				department: 'FRONT OFFICE',
				fetchDataEvent: 'GET_FO_ARRIVAL_MANAGEMENT',
				tileDescription: 'FO_ARRIVAL_MANAGEMENT_DESC'
			}, {
				name: 'Activity',
				department: 'FRONT OFFICE',
				fetchDataEvent: 'GET_FO_ACTIVITY',
				tileDescription: 'FO_ACTIVITY_DESC'
			}];

			if ($rootScope.includeManagementInformation) {
				var WorkloadChart = {
					name: 'Workload',
					department: 'FRONT OFFICE',
					fetchDataEvent: 'GET_FO_WORKLOAD',
					tileDescription: 'FO_WORKLOAD_DESC'
				};

				foCharts.push(WorkloadChart);
			}

			$scope.availableChartsList = $scope.availableChartsList.concat(foCharts);
		}


		if (incluseManagerCharts) {
			$controller('rvManagerSpiderChartCtrl', {
				$scope: $scope
			});
			$controller('rvManagerDistributionAnalyticsCtrl', {
				$scope: $scope
			});
			$controller('rvMangerPaceChart', {
				$scope: $scope
			});

			var managerCharts = [{
				name: 'Room Performance',
				department: 'GENERAL',
				fetchDataEvent: 'GET_MANAGER_PERFOMANCE',
				tileDescription: 'MANAGER_PERFOMANCE_DESC'
			}, {
				name: 'Distribution',
				department: 'GENERAL',
				fetchDataEvent: 'GET_MANAGER_DISTRIBUTION',
				tileDescription: 'MANAGER_DISTRIBUTION_DESC'
			}, {
				name: 'Pace',
				department: 'GENERAL',
				fetchDataEvent: 'GET_MANAGER_PACE',
				tileDescription: 'MANAGER_PACE_DESC'
			}];

			$scope.availableChartsList = $scope.availableChartsList.concat(managerCharts);
		}

		$scope.$on("CLEAR_ALL_CHART_ELEMENTS", function() {
			d3.select('#d3-plot')
				.selectAll('svg')
				.remove();
			d3.select('#d3-plot')
				.selectAll('p')
				.remove();
			var divElements = d3.select('#d3-plot').selectAll('div');

			if (divElements) {
				divElements.remove();
			}
			if (document.getElementById("left-side-legend")) {
				document.getElementById("left-side-legend").innerHTML = "";
			}
			if (document.getElementById("right-side-legend")) {
				document.getElementById("right-side-legend").innerHTML = "";
			}
		});

		$scope.$on('CHART_API_SUCCESS', function(ev, response) {
			$('base').attr('href', '#');
			$scope.screenData.analyticsDataUpdatedTime = response && response.lastUpatedTime ?
				response.lastUpatedTime : moment().format("dddd, MMMM Do YYYY, h:mm:ss a");
			$scope.$emit("CLEAR_ALL_CHART_ELEMENTS");
		});

		$scope.updateAndBack = function() {
			$rootScope.setPrevState = {
				hide: true
			};
			$scope.dashboardFilter.showFilters = false;
			$scope.dashboardFilter.selectedAnalyticsMenu = '';
			$scope.$emit("CLEAR_ALL_CHART_ELEMENTS");
			$scope.$emit('REFRESH_ANALTICS_SCROLLER');
			$scope.$emit('RESET_CHART_FILTERS');
			$scope.dashboardFilter.displayMode = 'DASHBOARD_LIST';
		};

		$scope.onClickOnChartTile = function(fetchDataEvent) {
			$scope.$emit("CLEAR_ALL_CHART_ELEMENTS");
			$scope.$emit('RESET_CHART_FILTERS');
			$scope.dashboardFilter.displayMode = 'CHART_DETAILS';
			// reset filters
			$scope.selectedFilters.roomTypes = [];
			$scope.dashboardFilter.selectedRoomType = '';
			rvAnalyticsSrv.selectedRoomType = '';
			$scope.dashboardFilter.showPreviousDayData = false;

			$scope.$broadcast(fetchDataEvent);
			$rootScope.setPrevState = {
				title: $filter('translate')('ANALYTICS'),
				callback: 'updateAndBack',
				scope: $scope
			};

			var scroller = $scope.getScroller('analytics_details_scroller');
			
			rvAnalyticsSrv.resetChartFilterSet();

			$timeout(function() {
				if (scroller) {
					scroller.scrollTo(0, 0, 300);
				}
			}, 0);
		};

		$scope.showRightSideLegends = function() {
			return $scope.dashboardFilter.selectedAnalyticsMenu !== 'PERFOMANCE';
		};

		$scope.showLeftSideLegends = function() {
			return $scope.dashboardFilter.selectedAnalyticsMenu === 'HK_OVERVIEW' ||
				$scope.dashboardFilter.selectedAnalyticsMenu === 'HK_WORK_PRIRORITY' ||
				$scope.dashboardFilter.selectedAnalyticsMenu === 'FO_ARRIVALS';
		};

		$(window).on("resize.doResize", function() {
			$scope.$apply(function() {
				$timeout(function() {
					// Clear existing chart
					$scope.$emit("CLEAR_ALL_CHART_ELEMENTS");
					$scope.$broadcast('ON_WINDOW_RESIZE');
				}, 0);
			});
		});

		$scope.$on("$destroy", function() {
			$(window).off("resize.doResize");
			$('base').attr('href', "/");
			$rootScope.setPrevState = {
				hide: true,
				title: ''
			};
		});

		$scope.$on("SIDE_MENU_TOGGLE", function(e, data) {
			if (data.menuOpen) {
				$('base').attr('href', "/");
			}
		});

		$scope.$on('RESET_CHART_FILTERS', function () {
			rvAnalyticsSrv.resetChartFilterSet();
		});

		(function() {
			$scope.dashboardFilter.displayMode = 'DASHBOARD_LIST';
			$scope.screenData = {
				displayMode: 'DASHBOARD_LIST'
			};
			$scope.dashboardFilter.showRemainingReservations = false;
			$scope.dashboardFilter.gridViewActive = false;
			$scope.dashboardFilter.lineChartActive = false;
			$scope.$emit('REFRESH_ANALTICS_SCROLLER');
		})();
	}
]);