'use strict';

sntRover.controller('RVAddonForecastReportByDateCtrl', ['$rootScope', '$scope', 'RVreportsSrv', 'RVreportsSubSrv', 'RVReportUtilsFac', 'RVReportParamsConst', 'RVReportMsgsConst', 'RVReportNamesConst', '$filter', '$timeout', 'ngDialog', '$interval', function ($rootScope, $scope, reportsSrv, reportsSubSrv, reportUtils, reportParams, reportMsgs, reportNames, $filter, $timeout, ngDialog, $interval) {

	BaseCtrl.call(this, $scope);

	var detailsCtrlScope = $scope.$parent,
	    mainCtrlScope = detailsCtrlScope.$parent,
	    chosenReport = detailsCtrlScope.chosenReport,
	    results = {},
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

	$scope.getAddonGrpName = function (item) {
		return addonGrpHash[$scope.getKey(item)] || item;
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

	$scope.sortRes = function (field, addon) {
		var params = {};

		addon.sortField = field;
		params['sort_field'] = field;

		if ('ROOM' == field) {
			addon.roomSortDir = addon.roomSortDir == undefined || addon.roomSortDir == false ? true : false;
			addon.nameSortDir = undefined;
			params['sort_dir'] = addon.roomSortDir;
		} else if ('NAME' == field) {
			addon.nameSortDir = addon.nameSortDir == undefined || addon.nameSortDir == false ? true : false;
			addon.roomSortDir = undefined;
			params['sort_dir'] = addon.nameSortDir;
		}

		callResAPI(addon, params);
	};

	$scope.loadRes = function (type, addon) {
		if ('next' == type && !addon.disableNextBtn) {
			addon.pageNo++;
			_.extend(addon, calPagination(addon));

			callResAPI(addon);
		} else if ('prev' == type && !addon.disablePrevBtn) {
			addon.pageNo--;
			_.extend(addon, calPagination(addon));

			callResAPI(addon);
		}
	};

	function calPagination(addon) {
		var perPage = 25,
		    pageNo = addon.pageNo || 1,
		    netTotalCount = addon.total_count || 0,
		    uiTotalCount = !!addon.reservations ? addon.reservations.length : 0,
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

	function callResAPI(addon, params) {
		var params = params || {},
		    statuses,
		    key;

		var success = function success(data) {
			$scope.$emit('hideLoader');
			addon.reservations = data;
			refreshScroll();
		};

		var error = function error(data) {
			$scope.$emit('hideLoader');
			refreshScroll();
		};

		_.extend(params, {
			'id': chosenReport.id,
			'date': addon.date,
			'addon_group_id': addon.addonGroupId,
			'addon_id': addon.addonId,
			'page': addon.pageNo,
			'per_page': addon.perPage
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

			var date = reportKey,
			    addonGroups = results[reportKey]['addon_groups'];

			if (results[reportKey]['guests'] > 0) {
				results[reportKey]['hasData'] = true;
			} else {
				results[reportKey]['hasData'] = false;
			}

			var i, j;

			for (i = 0, j = addonGroups.length; i < j; i++) {
				var addonGrpObj = addonGroups[i];

				for (var addonGroupKey in addonGrpObj) {
					if ('$$hashKey' == addonGroupKey || !addonGrpObj.hasOwnProperty(addonGroupKey)) {
						continue;
					}

					var addonGroupId = addonGroupKey,
					    addons = addonGrpObj[addonGroupKey]['addons'];

					if (addonGrpObj[addonGroupKey]['guests'] > 0) {
						addonGrpObj[addonGroupKey]['hasData'] = true;
					} else {
						addonGrpObj[addonGroupKey]['hasData'] = false;
					}

					var k, l;

					for (k = 0, l = addons.length; k < l; k++) {
						var addonObj = addons[k];

						for (var addonKey in addonObj) {
							if ('$$hashKey' == addonKey || !addonObj.hasOwnProperty(addonKey)) {
								continue;
							}

							var addonId = addonKey,
							    addon = addonObj[addonKey];

							// helping template in rendering by
							// telling which addonGroups are empty
							if (0 < addonObj[addonKey]['guests']) {
								addonObj[addonKey]['hasData'] = true;

								_.extend(addon, {
									'sortField': undefined,
									'roomSortDir': undefined,
									'nameSortDir': undefined,
									/**/
									'date': date,
									'addonGroupId': addonGroupId,
									'addonId': addonId
								});

								_.extend(addon, calPagination(addon));
							} else {
								addonObj[addonKey]['hasData'] = false;
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

		$scope.printLevel.value = 'DATE';

		// show popup
		ngDialog.open({
			template: '/assets/partials/reports/addonForecastReport/rvGrpByDatePrintPopup.html',
			className: 'ngdialog-theme-default',
			closeByDocument: true,
			scope: $scope,
			data: []
		});
	};

	mainCtrlScope.printOptions.afterPrint = function () {
		// reset show alls
		$scope.openGroup = false;
		$scope.openAddon = false;
		$scope.openResrv = false;
	};

	// restore the old dates and close
	$scope.closeDialog = function () {
		mainCtrlScope.printOptions.afterPrint();
		ngDialog.close();
	};

	$scope.continueWithPrint = function () {
		switch ($scope.printLevel.value) {
			case 'GROUP':
				$scope.openGroup = true;
				break;

			case 'ADDON':
				$scope.openGroup = true;
				$scope.openAddon = true;
				break;

			case 'ALL':
				$scope.openGroup = true;
				$scope.openAddon = true;
				$scope.openResrv = true;
				break;

			default:
			// no-op
		}

		ngDialog.close();
		$scope.$emit(reportMsgs['REPORT_PRE_PRINT_DONE']);
	};
}]);