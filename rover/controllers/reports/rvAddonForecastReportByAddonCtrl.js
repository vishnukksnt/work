'use strict';

sntRover.controller('RVAddonForecastReportByAddonCtrl', ['$rootScope', '$scope', 'RVreportsSrv', 'RVreportsSubSrv', 'RVReportUtilsFac', 'RVReportParamsConst', 'RVReportMsgsConst', 'RVReportNamesConst', '$filter', '$timeout', 'ngDialog', '$interval', function ($rootScope, $scope, reportsSrv, reportsSubSrv, reportUtils, reportParams, reportMsgs, reportNames, $filter, $timeout, ngDialog, $interval) {

	BaseCtrl.call(this, $scope);

	var detailsCtrlScope = $scope.$parent,
	    mainCtrlScope = detailsCtrlScope.$parent,
	    chosenReport = detailsCtrlScope.chosenReport,
	    results = [],
	    addonGrpHash = {},
	    addonHash = {},
	    addonGroups,
	    addons;

	var SCROLL_NAME = 'addon-forecast-report-scroll',
	    timer;

	var refreshScroll = function refreshScroll(scrollUp) {
		$scope.refreshScroller(SCROLL_NAME);
		if (!!scrollUp && $scope.$parent.myScroll.hasOwnProperty(SCROLL_NAME)) {
			$scope.$parent.myScroll[SCROLL_NAME].scrollTo(0, 0, 100);
		}
	};

	var setScroller = function setScroller() {
		$scope.setScroller(SCROLL_NAME, {
			probeType: 3,
			tap: true,
			preventDefault: false,
			scrollX: false,
			scrollY: true
		});
	};

	var clearTimer = function clearTimer() {
		if (!!timer) {
			$interval.cancel(timer);
			timer = undefined;
		}
	};

	var setScrollListner = function setScrollListner() {
		if ($scope.$parent.myScroll.hasOwnProperty(SCROLL_NAME)) {
			refreshScroll();

			if (!timer) {
				timer = $interval(refreshScroll, 1000);
			}

			$scope.$parent.myScroll[SCROLL_NAME].on('scroll', function () {
				clearTimer();
			});
		} else {
			$timeout(setScrollListner, 1000);
		}
	};

	$scope.getKey = function (item) {
		return _.keys(item)[0];
	};

	$scope.getKeyValues = function (item) {
		return item[$scope.getKey(item)];
	};

	$scope.getKeyName = function (item) {
		return allAddonHash[$scope.getKey(item)] || item;
	};

	$scope.getAddonGrpName = function (id) {
		return addonGrpHash[id] || id;
	};

	$scope.getAddonName = function (item) {
		return addonHash[$scope.getKey(item)] || item;
	};

	$scope.toggleSub = function (item) {
		if (!item.hasOwnProperty('hidden')) {
			item.hidden = true;
		} else {
			item.hidden = !item.hidden;
		}

		refreshScroll();
	};

	var resClassNames = {
		'DUE IN': 'check-in',
		'INHOUSE': 'inhouse',
		'DUE OUT': 'check-out',
		'CHECKEDOUT': 'check-out',
		'CANCELLED': 'cancel',
		'NOSHOW': 'no-show'
	};

	$scope.getStatusClass = function (status) {
		return resClassNames[status] || '';
	};

	function calPagination(eachDate) {
		var perPage = 25,
		    pageNo = eachDate.pageNo || 1,
		    netTotalCount = eachDate.total_count || 0,
		    uiTotalCount = !!eachDate.reservations ? eachDate.reservations.length : 0,
		    disablePrevBtn = false,
		    disableNextBtn = false,
		    resultFrom,
		    resultUpto;

		if (netTotalCount === 0 && uiTotalCount === 0) {
			disablePrevBtn = true;
			disableNextBtn = true;
		} else if (pageNo === 1) {
			resultFrom = 1;
			resultUpto = netTotalCount < perPage ? netTotalCount : perPage;
			disablePrevBtn = true;
			disableNextBtn = netTotalCount > perPage ? false : true;
		} else {
			resultFrom = perPage * (pageNo - 1) + 1;
			resultUpto = resultFrom + perPage - 1 < netTotalCount ? resultFrom + perPage - 1 : netTotalCount;
			disablePrevBtn = false;
			disableNextBtn = resultUpto === netTotalCount ? true : false;
		}

		return {
			'perPage': perPage,
			'pageNo': pageNo,
			'netTotalCount': netTotalCount,
			'uiTotalCount': uiTotalCount,
			'disablePrevBtn': disablePrevBtn,
			'disableNextBtn': disableNextBtn,
			'resultFrom': resultFrom,
			'resultUpto': resultUpto
		};
	}

	$scope.sortRes = function (field, eachDate) {
		var params = {};

		eachDate.sortField = field;
		params['sort_field'] = field;

		if ('ROOM' == field) {
			eachDate.roomSortDir = eachDate.roomSortDir == undefined || eachDate.roomSortDir == false ? true : false;
			eachDate.nameSortDir = undefined;
			params['sort_dir'] = eachDate.roomSortDir;
		} else if ('NAME' == field) {
			eachDate.nameSortDir = eachDate.nameSortDir == undefined || eachDate.nameSortDir == false ? true : false;
			eachDate.roomSortDir = undefined;
			params['sort_dir'] = eachDate.nameSortDir;
		}

		callResAPI(eachDate, params);
	};

	$scope.loadRes = function (type, eachDate) {
		if ('next' == type && !eachDate.disableNextBtn) {
			eachDate.pageNo++;
			_.extend(eachDate, calPagination(eachDate));

			callResAPI(eachDate);
		} else if ('prev' == type && !eachDate.disablePrevBtn) {
			eachDate.pageNo--;
			_.extend(eachDate, calPagination(eachDate));

			callResAPI(eachDate);
		}
	};

	function callResAPI(eachDate, params) {
		var params = params || {},
		    statuses,
		    key;

		var success = function success(data) {
			$scope.$emit('hideLoader');
			eachDate.reservations = data;
			refreshScroll();
		};

		var error = function error(data) {
			$scope.$emit('hideLoader');
			refreshScroll();
		};

		_.extend(params, {
			'id': chosenReport.id,
			'date': eachDate.date,
			'addon_group_id': eachDate.addonGroupId,
			'addon_id': eachDate.addonId,
			'page': eachDate.pageNo,
			'per_page': eachDate.perPage
		});

		statuses = _.where(chosenReport['hasReservationStatus']['data'], { selected: true });
		if (statuses.length > 0) {
			key = reportParams['RESERVATION_STATUS_ARRAY'];
			params[key] = [];
			/**/
			_.each(statuses, function (each) {
				params[key].push(each.id);
			});
		}

		$scope.invokeApi(reportsSubSrv.fetchAddonReservations, params, success, error);
	}

	function setup() {
		try {
			addonGroups = $scope.chosenReport.hasAddonGroups.data;
		} catch (err) {
			addonGroups = [];
		}
		try {
			addons = $scope.chosenReport.hasAddons.data;
		} catch (err) {
			addons = [];
		}
		results = mainCtrlScope.results;
		addonGrpHash = {};
		addonHash = {};

		_.each(addonGroups, function (item) {
			addonGrpHash[item.id] = item.description;
		});

		_.each(addons, function (item) {
			addonHash[item.addon_id] = item.addon_name;
		});

		$scope.modifiedResults = {};
		for (var reportKey in results) {
			if (!results.hasOwnProperty(reportKey)) {
				continue;
			}

			var addonGroupId = reportKey,
			    addonsAry = results[reportKey]['addons'];

			if (results[reportKey]['guests'] > 0) {
				results[reportKey]['hasData'] = true;
			} else {
				results[reportKey]['hasData'] = false;
			}

			var i, j;

			for (i = 0, j = addonsAry.length; i < j; i++) {
				var addonObj = addonsAry[i];

				for (var addonKey in addonObj) {
					if ('$$hashKey' == addonKey || !addonObj.hasOwnProperty(addonKey)) {
						continue;
					}

					var addonId = addonKey,
					    datesAry = addonObj[addonKey]['dates'];

					if (addonObj[addonKey]['guests'] > 0) {
						addonObj[addonKey]['hasData'] = true;
					} else {
						addonObj[addonKey]['hasData'] = false;
					}

					var k, l;

					for (k = 0, l = datesAry.length; k < l; k++) {
						var dateObj = datesAry[k];

						for (var dateKey in dateObj) {
							if ('$$hashKey' == dateKey || !dateObj.hasOwnProperty(dateKey)) {
								continue;
							}

							var date = dateKey,
							    addonData = dateObj[dateKey];

							if (addonObj[addonKey]['guests'] > 0) {
								_.extend(addonData, {
									'sortField': undefined,
									'roomSortDir': undefined,
									'nameSortDir': undefined,
									/**/
									'date': date,
									'addonGroupId': addonGroupId,
									'addonId': addonId
								});

								_.extend(addonData, calPagination(addonData));
							}
						}
					}
				}
			}
		}
		/* LOOP ENDS */
		$scope.modifiedResults = angular.copy(results);

		$scope.hasResults = !!_.find($scope.modifiedResults, function (data) {
			return data.hasData;
		});
	}

	var init = function init() {
		setup();
		setScroller();
		/**/
		$timeout(function () {
			refreshScroll('scrollUp');
		});
	};

	init();

	var reInit = function reInit() {
		setup();
		/**/
		$timeout(function () {
			refreshScroll('scrollUp');
		});
	};

	// re-render must be initiated before for taks like printing.
	// thats why timeout time is set to min value 50ms
	var reportSubmited = $scope.$on(reportMsgs['REPORT_SUBMITED'], reInit);
	var reportPrinting = $scope.$on(reportMsgs['REPORT_PRINTING'], reInit);
	var reportUpdated = $scope.$on(reportMsgs['REPORT_UPDATED'], reInit);
	var reportPageChanged = $scope.$on(reportMsgs['REPORT_PAGE_CHANGED'], reInit);
	var allRendered = $scope.$on('ALL_RENDERED', setScrollListner);

	$scope.$on('$destroy', reportSubmited);
	$scope.$on('$destroy', reportUpdated);
	$scope.$on('$destroy', reportPrinting);
	$scope.$on('$destroy', reportPageChanged);

	$scope.$on('$destroy', allRendered);
	$scope.$on('$destroy', clearTimer);

	mainCtrlScope.printOptions.showModal = function () {
		$scope.printLevel = {};
		$scope.levelValues = {
			'date': 'DATE',
			'group': 'GROUP',
			'addon': 'ADDON',
			'all': 'ALL'
		};

		$scope.printLevel.value = 'GROUP';

		// show popup
		ngDialog.open({
			template: '/assets/partials/reports/addonForecastReport/rvGrpByGroupPrintPopup.html',
			className: 'ngdialog-theme-default',
			closeByDocument: true,
			scope: $scope,
			data: []
		});
	};

	mainCtrlScope.printOptions.afterPrint = function () {
		// reset show alls
		$scope.openAddon = false;
		$scope.openDate = false;
		$scope.openResrv = false;
	};

	// restore the old dates and close
	$scope.closeDialog = function () {
		mainCtrlScope.printOptions.afterPrint();
		ngDialog.close();
	};

	$scope.continueWithPrint = function () {
		switch ($scope.printLevel.value) {
			case 'ADDON':
				$scope.openAddon = true;
				break;

			case 'DATE':
				$scope.openAddon = true;
				$scope.openDate = true;
				break;

			case 'ALL':
				$scope.openAddon = true;
				$scope.openDate = true;
				$scope.openResrv = true;
				break;

			default:
			// no-op
		}

		ngDialog.close();
		$scope.$emit(reportMsgs['REPORT_PRE_PRINT_DONE']);
	};
}]);