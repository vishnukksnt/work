'use strict';

sntRover.controller('RVCompanyCardActivityLogCtrl', ['$scope', '$rootScope', '$stateParams', '$timeout', 'RVCompanyCardActivityLogSrv', 'ngDialog', function ($scope, $rootScope, $stateParams, $timeout, RVCompanyCardActivityLogSrv, ngDialog) {

	BaseCtrl.call(this, $scope);
	var that = this,
	    CONST_INTERVAL = 1000;

	// Refresh scroller.
	var refreshScroll = function refreshScroll() {
		$timeout(function () {
			$scope.refreshScroller('rvCompanyCardActivityLogScroll');
		}, 500);
	};

	// Initialization.
	var init = function init() {
		// Data set ninitialization
		$scope.activityLogObj = {
			response: {},
			perPage: 50,
			page: 1,
			sortField: 'DATE',
			sortOrder: 'asc',
			accountId: typeof $scope.contactInformation === 'undefined' ? $stateParams.id : $scope.contactInformation.id
		};

		$scope.activityLogFilter = {
			user: '',
			date: 'asc',
			action: '',
			actionsList: [],
			selectedAction: '',
			fromDate: new Date(),
			toDate: new Date(),
			query: ''
		};

		// Pagination options for Activity Log
		$scope.activityLogPagination = {
			id: 'ACTIVITY_LOG',
			api: that.loadAPIData,
			perPage: $scope.activityLogObj.perPage
		};

		// Setting up scroller with refresh options.
		$scope.setScroller('rvCompanyCardActivityLogScroll', {});
		refreshScroll();
	};

	/*
  *	Fetch Action filter data
  *	@return {undefined}
  */
	that.fetchFilterData = function () {

		var dataToSend = {
			params: {
				'id': $scope.activityLogObj.accountId
			},
			successCallBack: function successCallBack(data) {
				$scope.activityLogFilter.actionsList = data.results;
			},
			failureCallBack: function failureCallBack(errorMessage) {
				$scope.errorMessage = errorMessage;
			}
		};

		$scope.callAPI(RVCompanyCardActivityLogSrv.fetchFilterData, dataToSend);
	};

	// -------/ PAGINATION LOGIC /----------- //

	// Show pagination or not.
	$scope.showPagination = function () {
		var showPagination = false,
		    response = $scope.activityLogObj.response;

		if (typeof response !== 'undefined' && typeof response.results !== 'undefined') {
			if (response.results.length < response.total_count && response.results.length > 0) {
				showPagination = true;
			}
		}
		return showPagination;
	};

	/*
  * Fetch transactions APIs
  * @param  { String } [Page No to API]
  */
	that.loadAPIData = function (pageNo) {

		$scope.activityLogObj.page = pageNo ? pageNo : 1;
		$scope.activityLogObj.accountId = typeof $scope.contactInformation === 'undefined' ? $stateParams.id : $scope.contactInformation.id;

		var dataToSend = {
			params: {
				'page': $scope.activityLogObj.page,
				'per_page': $scope.activityLogObj.perPage,
				'sort_field': $scope.activityLogObj.sortField,
				'sort_order': $scope.activityLogObj.sortOrder,
				'id': $scope.activityLogObj.accountId,
				'action_type_id': $scope.activityLogFilter.selectedAction,
				'from_date': $scope.activityLogFilter.fromDate,
				'to_date': $scope.activityLogFilter.toDate,
				'query': $scope.activityLogFilter.query
			},
			successCallBack: function successCallBack(data) {
				$scope.activityLogObj.response = data;
				$scope.errorMessage = '';
				refreshScroll();
				$timeout(function () {
					$scope.$broadcast('updatePagination', 'ACTIVITY_LOG');
				}, CONST_INTERVAL);
			},
			failureCallBack: function failureCallBack(errorMessage) {
				$scope.errorMessage = errorMessage;
			}
		};

		$scope.callAPI(RVCompanyCardActivityLogSrv.fetchActivityLog, dataToSend);
	};

	/*
 *	Handle sortby action..
 *	@param  - {String} - [Filter type value]
 */
	var toggleFilterAction = function toggleFilterAction(type) {
		$scope.activityLogObj.sortField = type;
		var filterObj = $scope.activityLogFilter;

		switch (type) {

			case 'USERNAME':
				if (filterObj.user === '' || filterObj.user === 'asc') {
					filterObj.user = 'desc';
				} else {
					filterObj.user = 'asc';
				}
				$scope.activityLogObj.sortOrder = filterObj.user;
				break;

			case 'DATE':
				if (filterObj.date === '' || filterObj.date === 'asc') {
					filterObj.date = 'desc';
				} else {
					filterObj.date = 'asc';
				}
				$scope.activityLogObj.sortOrder = filterObj.date;
				break;

			case 'ACTION':
				if (filterObj.action === '' || filterObj.action === 'asc') {
					filterObj.action = 'desc';
				} else {
					filterObj.action = 'asc';
				}
				$scope.activityLogObj.sortOrder = filterObj.action;
				break;
		}

		that.loadAPIData();
	};

	/*
 * Sort by User/Date/Action
 *	@param  - {String} - [Filter type value]
 */
	$scope.sortByAction = function (type) {
		toggleFilterAction(type);
	};

	// Refresh the scroller when the tab is active.
	var listener = $scope.$on('activityLogTabActive', function () {
		$timeout(function () {
			that.loadAPIData();
			that.fetchFilterData();
		}, CONST_INTERVAL);
	});

	/**
 *	checking Whether oldvalue of detail have any value
 *	@param  - {Any type} - [input value]
 *	@return - {Boolean}
 */
	$scope.isOldValue = function (value) {
		var isOldValue = true;

		if (value === "" || typeof value === "undefined" || value === null) {
			isOldValue = false;
		}
		return isOldValue;
	};

	/*
  * 	Show calendar popup.
  *	@param {string} [clicked FROM/TO]
  *	@return {undefined}
  */
	var popupCalendar = function popupCalendar(clickedOn) {
		$scope.clickedOn = clickedOn;
		ngDialog.open({
			template: '/assets/partials/companyCard/contracts/rvCompanyCardContractsCalendar.html',
			controller: 'RVCompanyCardActivityLogDatePickerController',
			className: '',
			scope: $scope
		});
	};

	/* Handling different date picker clicks */
	$scope.clickedFromDate = function () {
		popupCalendar('FROM');
	};
	$scope.clickedToDate = function () {
		popupCalendar('TO');
	};

	/*
  * 	Handle CLEAR DATES.
  *	@param {string} [clicked FROM/TO]
  *	@return {undefined}
  */
	$scope.clearDate = function (type) {
		if (type === 'FROM') {
			$scope.activityLogFilter.fromDate = '';
		} else {
			$scope.activityLogFilter.toDate = '';
		}
	};
	// Handle CLEAR QUERY
	$scope.clearQuery = function () {
		$scope.activityLogFilter.query = '';
	};

	// Handle FILTER button click
	$scope.clickedFilterButton = function () {
		that.loadAPIData();
	};

	init();

	$scope.$on('$destroy', listener);
}]);