'use strict';

sntRover.controller('rvMarketSourceReportCtrl', ['$scope', '$rootScope', '$filter', 'RVreportsSrv', '$timeout', function ($scope, $rootScope, $filter, RVreportsSrv, $timeout) {

	/**
  * Method to get the
  */
	var getRange = function getRange(numbers) {
		if (!numbers) {
			return {
				maxValue: 10,
				breakingPoint: 10,
				upperLimit: 10,
				ticks: 1
			};
		}
		var maxValue = Math.max.apply(null, numbers);

		var breakingPoint = 10;

		if (maxValue > 100 && maxValue <= 200) {
			breakingPoint = 20;
		} else if (maxValue > 200 && maxValue <= 400) {
			breakingPoint = 40;
		} else if (maxValue > 400 && maxValue <= 800) {
			breakingPoint = 80;
		} else if (maxValue > 800 && maxValue <= 1000) {
			breakingPoint = 100;
		} else if (maxValue > 1000 && maxValue <= 1500) {
			breakingPoint = 200;
		} else if (maxValue > 1500) {
			breakingPoint = 300;
		}
		var ticks = Math.ceil(maxValue / breakingPoint);

		var upperLimit = ticks * breakingPoint;

		return {
			maxValue: maxValue,
			breakingPoint: breakingPoint,
			upperLimit: upperLimit,
			ticks: ticks
		};
	};

	$scope.reportStatus = {
		sort: {
			source: {
				name: undefined,
				ascending: undefined
			},
			market: {
				name: undefined,
				ascending: undefined
			}
		}
	};

	$scope.sort = function (market, values) {
		var status = $scope.reportStatus;
		// Market Source Name Sort

		if (!values) {
			if (!!market) {
				status.sort.market.name = true;
				if (status.sort.market.ascending) {
					$scope.markets.sort();
					status.sort.market.ascending = false;
				} else {
					$scope.markets.reverse();
					status.sort.market.ascending = true;
				}
			} else {
				status.sort.source.name = true;
				if (status.sort.source.ascending) {
					$scope.sources.reverse();
					status.sort.source.ascending = false;
				} else {
					$scope.sources.sort();
					status.sort.source.ascending = true;
				}
			}
		} else {
			// Market Source Values Sort
			if (!!market) {
				status.sort.market.name = false;
				if (status.sort.market.ascending) {
					$scope.markets.sort(function (a, b) {
						if ($scope.results.market[a] > $scope.results.market[b]) {
							return -1;
						} else if ($scope.results.market[a] < $scope.results.market[b]) {
							return 1;
						} else {
							return 0;
						}
					});
					status.sort.market.ascending = false;
				} else {
					$scope.markets.sort(function (a, b) {
						if ($scope.results.market[a] > $scope.results.market[b]) {
							return 1;
						} else if ($scope.results.market[a] < $scope.results.market[b]) {
							return -1;
						} else {
							return 0;
						}
					});
					status.sort.market.ascending = true;
				}
			} else {
				status.sort.source.name = false;
				if (status.sort.source.ascending) {
					$scope.sources.sort(function (a, b) {
						if ($scope.results.source[a] > $scope.results.source[b]) {
							return -1;
						} else if ($scope.results.source[a] < $scope.results.source[b]) {
							return 1;
						} else {
							return 0;
						}
					});
					status.sort.source.ascending = false;
				} else {
					$scope.sources.sort(function (a, b) {
						if ($scope.results.source[a] > $scope.results.source[b]) {
							return 1;
						} else if ($scope.results.source[a] < $scope.results.source[b]) {
							return -1;
						} else {
							return 0;
						}
					});
					status.sort.source.ascending = true;
				}
			}
		}
		// put 'Not Defined' to the end
		if ($scope.sources && $scope.sources.indexOf('Not Defined') > -1) {
			$scope.sources = _.without($scope.sources, 'Not Defined');
			$scope.sources.push('Not Defined');
		}
		if ($scope.markets && $scope.markets.indexOf('Not Defined') > -1) {
			$scope.markets = _.without($scope.markets, 'Not Defined');
			$scope.markets.push('Not Defined');
		}
	};

	$scope.setScroller('report-details-scroll');

	$scope.getTimes = function (n) {
		return new Array(n);
	};

	$scope.getPercentage = function (dividend, divisor, percentage) {
		var ret = dividend / divisor * percentage;

		return Math.min(ret, 100) + '%';
	};

	var init = function init() {

		// remove old values
		$scope.sources = [];
		$scope.markets = [];

		if (_.isEmpty($scope.results.source) && _.isEmpty($scope.results.market)) {
			$scope.hasNoData = true;
		} else {
			$scope.hasNoData = false;

			if (!_.isEmpty($scope.results.source)) {
				$scope.sources = _.keys($scope.results.source);
				var sourcesValues = _.values($scope.results.source);

				$scope.sourcesValuesTotal = sourcesValues.reduce(function (a, b) {
					return a + b;
				});
				var sourcesValuesPercentage = [];

				_.each(sourcesValues, function (sourceValue) {
					sourcesValuesPercentage.push(sourceValue / $scope.sourcesValuesTotal);
				});
			}

			if (!_.isEmpty($scope.results.market)) {
				$scope.markets = _.keys($scope.results.market);
				var marketsValues = _.values($scope.results.market);

				$scope.marketsValuesTotal = marketsValues.reduce(function (a, b) {
					return a + b;
				});
				var marketsValuesPercentage = [];

				_.each(marketsValues, function (marketValue) {
					marketsValuesPercentage.push(marketValue / $scope.marketsValuesTotal);
				});
			}

			$scope.reportStatus.graph = {
				sourceNumber: getRange(sourcesValues),
				marketNumber: getRange(marketsValues)
			};
		}

		$timeout(function () {
			$scope.refreshScroller('report-details-scroll');
		}, 1000);
	};

	$scope.$on('report.updated', function () {
		init();
	});
	$scope.$on('report.submited', function () {
		$scope.sources && init();
	});

	init();
}]);