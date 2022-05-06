"use strict";

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

(function () {
	function r(e, n, t) {
		function o(i, f) {
			if (!n[i]) {
				if (!e[i]) {
					var c = "function" == typeof require && require;if (!f && c) return c(i, !0);if (u) return u(i, !0);var a = new Error("Cannot find module '" + i + "'");throw a.code = "MODULE_NOT_FOUND", a;
				}var p = n[i] = { exports: {} };e[i][0].call(p.exports, function (r) {
					var n = e[i][1][r];return o(n || r);
				}, p, p.exports, r, e, n, t);
			}return n[i].exports;
		}for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) {
			o(t[i]);
		}return o;
	}return r;
})()({ 1: [function (require, module, exports) {
		sntRover.controller('RVRoomRatesCalendarCtrl', ['$state', '$stateParams', '$rootScope', '$scope', 'RVStayDatesCalendarSrv', '$filter', '$timeout', function ($state, $stateParams, $rootScope, $scope, RVStayDatesCalendarSrv, $filter, $timeout) {
			// inheriting some useful things
			BaseCtrl.call(this, $scope);

			var that = this,
			    availabilityData = null;

			var getFirstDayOfMonth = function getFirstDayOfMonth(date) {
				return getDayOfMonth(date);
			};

			var getDayOfMonth = function getDayOfMonth(date) {
				var date = new Date(date),
				    y = date.getFullYear(),
				    m = date.getMonth(),
				    businessDate = tzIndependentDate($rootScope.businessDate),
				    businessM = businessDate.getMonth(),
				    businessY = businessDate.getFullYear(),
				    day = m + y * 100 > businessM + businessY * 100 ? 1 : parseInt(tzIndependentDate($rootScope.businessDate).getDate());

				return $filter('date')(new Date(y, m, day), $rootScope.dateFormatForAPI);
			};

			var getLastDayOfMonth = function getLastDayOfMonth(date) {
				var date = new Date(date),
				    y = date.getFullYear(),
				    m = date.getMonth();

				return $filter('date')(new Date(y, m + 1, 0), $rootScope.dateFormatForAPI);
			};

			var getLastDayOfNextMonth = function getLastDayOfNextMonth(date) {
				var date = new Date(date),
				    y = date.getFullYear(),
				    m = date.getMonth();

				return $filter('date')(new Date(y, m + 2, 0), $rootScope.dateFormatForAPI);
			};

			/**
    * for each day in calendar, we need to form day data for event source
    * @param  {Object} dailyData
    * @return {String}
    */
			var getDayDataAgainstDailyData = function getDayDataAgainstDailyData(dailyData) {
				var arrivalDateString = $scope.reservationData.arrivalDate,
				    departureDateString = $scope.reservationData.departureDate;

				if (dailyData.date === arrivalDateString || dailyData.date === departureDateString) {
					return new tzIndependentDate(dailyData.date).getDate().toString();
				}
				return "";
			};

			var isClosedArrivalRestrictionPresent = function isClosedArrivalRestrictionPresent(dailyData) {

				var restriction_list,
				    room_rates,
				    filtered_rate = _.findWhere(dailyData.rates, { id: $scope.stateVariables.selectedRate });

				if (!isInBestAvailableMode() && $scope.stateVariables.selectedRoom !== '' && $scope.stateVariables.selectedRate !== '') {

					var filtered_room = typeof filtered_rate !== 'undefined' ? _.findWhere(filtered_rate.room_rates, { room_type_id: $scope.stateVariables.selectedRoom }) : undefined;

					if (typeof filtered_room != 'undefined' && typeof _.findWhere(filtered_room.restrictions, { restriction_type_id: 2 }) === 'undefined') return false;else return true;
				} else {

					room_rates = _.reduceRight(dailyData.rates, function (a, b) {
						return a.concat(b.room_rates);
					}, []);
					if (isInRoomTypeSelectedMode() && $scope.stateVariables.selectedRoom !== '') {
						room_rates = _.filter(room_rates, function (room_rate) {
							return room_rate.id === $scope.stateVariables.selectedRoom;
						});
					} else if (isInRoomTypeSelectedMode() && $scope.stateVariables.selectedRate !== '') {
						room_rates = typeof filtered_rate !== 'undefined' ? filtered_rate.room_rates : [];
					}
				}

				var restrictions_list = _.pluck(room_rates, "restrictions");

				for (var j = 0; j < restrictions_list.length; j++) {
					if (typeof _.findWhere(restrictions_list[j], { restriction_type_id: 2 }) === 'undefined') return false;
				}

				return true;
			};

			/**
    * According to each day, we need to pass seperate CSS class
    * @param  {Object} dailyData
    * @return {String}
    */
			var getClassNameAgainstDailyData = function getClassNameAgainstDailyData(dailyData) {
				var classes = "",
				    rData = $scope.reservationData,
				    dayHouseAvailability = dailyData.house.availability;

				// if the date is checkin/checkout 
				if (dailyData.date === rData.arrivalDate) {
					classes += 'check-in ';
					if (isClosedArrivalRestrictionPresent(dailyData)) return classes += 'unavailable ';
				}
				if (dailyData.date === rData.departureDate) {
					classes += 'check-out ';
				}

				var title = getTitleAgainstDailyData(dailyData);
				// if day house availability is 0 or less

				if (title !== "" || title == "undefined") {
					classes += 'unavailable ';
				} else if (dailyData.date !== rData.departureDate) {
					classes += 'available ';
				}
				return classes;
			};

			/**
    * Will form the title from here
    * @param  {Object} dailyData
    * @return {String}
    */
			var getTitleAgainstDailyData = function getTitleAgainstDailyData(dailyData) {
				var dayHouseAvailability = dailyData.house.availability;

				$scope.stateVariables.selectedRoom = $scope.stateVariables.selectedRoom == null ? "" : $scope.stateVariables.selectedRoom;
				$scope.stateVariables.selectedRate = $scope.stateVariables.selectedRate == null ? "" : $scope.stateVariables.selectedRate;
				if (dayHouseAvailability <= 0) {
					return dayHouseAvailability.toString();
				} else if (isInBestAvailableMode()) {
					return "";
				} else if (!isRoomTypeAvailable(dailyData)) {
					return dailyData.room_types[$scope.stateVariables.selectedRoom].toString();
				} else if ($scope.stateVariables.selectedRate !== "" && $scope.stateVariables.selectedRoom !== "") {
					var rate = _.findWhere(dailyData.rates, { id: $scope.stateVariables.selectedRate });
					var room_rate = typeof rate !== "undefined" ? _.findWhere(rate.room_rates, { room_type_id: $scope.stateVariables.selectedRoom }) : undefined;

					return typeof room_rate !== "undefined" ? "" : "undefined";
				} else if ($scope.stateVariables.selectedRate !== "") {
					var rate = _.findWhere(dailyData.rates, { id: $scope.stateVariables.selectedRate });

					if (rate && _.reduce(rate.room_rates, function (a, b) {
						return b.availability > 0 ? a.concat(b) : a;
					}, []).length > 0) return "";else return "undefined";
				}
				return "";
			};

			var isRoomTypeAvailable = function isRoomTypeAvailable(dailyData) {

				if ($scope.stateVariables.selectedRoom !== "" && dailyData.room_types[$scope.stateVariables.selectedRoom] <= 0) return false;
				return true;
			};

			var getEmptyRateDetails = function getEmptyRateDetails() {
				var bestRateData = {};

				bestRateData.room_type_name = "";
				bestRateData.rate_name = "";
				bestRateData.availability = "";
				bestRateData.restrictions = [];
				return bestRateData;
			};

			/**
    * [findBestAvailableRateAgainstDate description]
    * @return {[type]} [description]
    */
			var findBestAvailableRateAgainstDate = function findBestAvailableRateAgainstDate(dailyData) {

				var availabileRates = _.reject(dailyData.rates, function (rate) {
					$scope.stateVariables.selectedRate = $scope.stateVariables.selectedRate == null ? "" : $scope.stateVariables.selectedRate;
					return isInRoomTypeSelectedMode() && rate.id !== $scope.stateVariables.selectedRate && $scope.stateVariables.selectedRate != "";
				}),
				    availableRoomRates = _.pluck(availabileRates, "room_rates"),
				    firstAvailableRoomRate = _.reject(availableRoomRates[0], function (room_rate) {
					return !isRoomRateFiltered(room_rate, dailyData);
				}),
				    minAvailableRoomRate = availableRoomRates[0],
				    minAmongRate = _.min(_.pluck(firstAvailableRoomRate, 'single')),
				    min_room_rate = _.findWhere(firstAvailableRoomRate, { single: minAmongRate }),
				    minAmongRate = minAmongRate === null ? 0 : minAmongRate,
				    bestAvailableRate = minAmongRate,
				    eachAvailableRoomRate = null;

				for (var i = 1; i < availableRoomRates.length; i++) {
					eachAvailableRoomRate = _.reject(availableRoomRates[i], function (room_rate) {
						return !isRoomRateFiltered(room_rate, dailyData);
					});
					minAmongRate = _.min(_.pluck(eachAvailableRoomRate, 'single'));
					if (minAmongRate !== null && minAmongRate <= bestAvailableRate) {
						bestAvailableRate = minAmongRate;
						minAvailableRoomRate = availableRoomRates[i];
						min_room_rate = _.findWhere(eachAvailableRoomRate, { single: minAmongRate });
					}
				}
				bestAvailableRate = bestAvailableRate == Infinity ? "" : bestAvailableRate;
				var bestRateData = {};

				bestRateData.bestAvailableRate = bestAvailableRate.toString();
				if (bestAvailableRate != '') {
					bestRateData.room_type_name = _.findWhere($scope.stateVariables.rooms, { id: min_room_rate.room_type_id }).name;
					bestRateData.rate_name = _.findWhere($scope.stateVariables.rates, { id: _.findWhere(availabileRates, { room_rates: minAvailableRoomRate }).id }).name;
					bestRateData.rateCurrency = _.findWhere($scope.stateVariables.rates, { id: _.findWhere(availabileRates, { room_rates: minAvailableRoomRate }).id }).rate_currency;
					bestRateData.availability = min_room_rate.availability;
					_.each(min_room_rate.restrictions, function (restriction) {

						restriction.description = _.findWhere($scope.stateVariables.restriction_types, { id: restriction.restriction_type_id }).description;
					});
					bestRateData.restrictions = min_room_rate.restrictions;
				} else {
					bestRateData = _.extend(bestRateData, getEmptyRateDetails());
				}
				return bestRateData;
			};

			/** To filter the room rates
    * [isRoomRateFiltered description]
    * @return {object} [description]
    */
			var isRoomRateFiltered = function isRoomRateFiltered(room_rate, dailyData) {
				if (room_rate.single == null) return false;else {

					$scope.stateVariables.selectedRoom = $scope.stateVariables.selectedRoom == null ? "" : $scope.stateVariables.selectedRoom;

					if (typeof _.findWhere(room_rate.restrictions, { restriction_type_id: 1 }) !== 'undefined') return false;else if (isInRoomTypeSelectedMode() && room_rate.room_type_id !== $scope.stateVariables.selectedRoom && $scope.stateVariables.selectedRoom != "") return false;else if (!isRestrictionIncludedInSearch() && room_rate.restrictions.length > 0) return false;else if (isInBestAvailableMode() && isShowAvailableRoomsSelected() && room_rate.availability <= 0) return false;else if (isInRoomTypeSelectedMode() && $scope.stateVariables.selectedRoom === "" && room_rate.availability <= 0) return false;else if (dailyData.date === $scope.reservationData.arrivalDate && typeof _.findWhere(room_rate.restrictions, { restriction_type_id: 2 }) !== 'undefined') return false;
				}
				return true;
			};

			/**
    * when a day is rendered, this callback will fire
    * @param  {Object} date
    * @param  {DOMNode} cell
    */
			var dayRendered = function dayRendered(date, cell) {
				var formattedDate = $filter('date')(date, $rootScope.dateFormatForAPI);
				var correspondingEventData = _.findWhere(availabilityData.results, { 'date': formattedDate });

				if (typeof correspondingEventData !== "undefined") {}
			};

			/**
    * against each day, we need to form event data
    * @param  {Object} dailyData
    * @return {Object}
    */
			var formEventData = function formEventData(dailyData) {

				var bestRateData = findBestAvailableRateAgainstDate(dailyData);
				var title = getTitleAgainstDailyData(dailyData);
				var eventData = {
					day: new tzIndependentDate(dailyData.date).getDate().toString(),
					className: getClassNameAgainstDailyData(dailyData),
					start: new tzIndependentDate(dailyData.date),
					end: new tzIndependentDate(dailyData.date),
					editable: false,
					title: title == "" || title == 'undefined' ? bestRateData.bestAvailableRate.toString() : title,
					toolTipData: bestRateData,
					currencySymbol: bestRateData.rateCurrency,
					currentCalendar: ''
				};

				return eventData;
			};

			/**
    * whether we are processing on the left side calendar
    * @param  {Object}  dailyData
    * @return {Boolean}
    */
			var isProcessingLeftSideCalendar = function isProcessingLeftSideCalendar(dailyData) {
				// if the month of left calndr and date are same, it means
				// add 12 to the 'month' value in the options to tackle negative values
				return ($scope.leftCalendarOptions.month + 12) % 12 === new tzIndependentDate(dailyData.date).getMonth() % 12;
			};

			/**
    * whether we are processing on the right side calendar
    * @param  {Object}  dailyData
    * @return {Boolean}
    */
			var isProcessingRightSideCalendar = function isProcessingRightSideCalendar(dailyData) {
				// if the month of right calndr and date are same, it means
				// add 12 to the 'month' value in the options to tackle negative values
				return ($scope.rightCalendarOptions.month + 12) % 12 === new tzIndependentDate(dailyData.date).getMonth() % 12;
			};

			/**
    * ui-calendar requires an array of events to render
    * this method is to form those events	
    */
			var formCalendarEvents = function formCalendarEvents() {
				var calendarData = {
					left: [],
					right: []
				},
				    eventData = null;

				_.each(availabilityData.results, function (dailyData) {
					eventData = formEventData(dailyData);

					if (isProcessingLeftSideCalendar(dailyData)) {
						eventData.currentCalendar = "left";
						calendarData.left.push(eventData);
					} else if (isProcessingRightSideCalendar(dailyData)) {
						eventData.currentCalendar = "right";
						calendarData.right.push(eventData);
					}
				});

				// updating the left, right side calendar data model with new ones
				$scope.eventSources.left.push(calendarData.left);
				$scope.eventSources.right.push(calendarData.right);
				refreshScroller();
			};

			/**
    * success call back of calendar details fetch
    * @param  {Object} API response	 
    */
			var successCallBackOfFetchCalendarAvailabilityData = function successCallBackOfFetchCalendarAvailabilityData(data) {
				$scope.stateVariables.rooms = data.room_types;
				$scope.stateVariables.rates = data.rates;
				$scope.stateVariables.restriction_types = data.restriction_types;
				availabilityData = data;
				$scope.showCalender = true;

				renderFullCalendar();
				formCalendarEvents();
			};

			/**
    * to fetch calendar availability data
    * @param  {String} from date
    * @param  {String} to date
    */
			var fetchCalendarAvailabilityData = function fetchCalendarAvailabilityData(from, to) {
				var params = {
					from_date: from,
					to_date: to
				};

				var options = {
					params: params,
					successCallBack: successCallBackOfFetchCalendarAvailabilityData
				};

				$scope.callAPI(RVStayDatesCalendarSrv.fetchCalendarData, options);
			};

			/**
    * to reset the event model that we are passing to calendar
    */
			var resetCalenarEventModel = function resetCalenarEventModel() {
				$scope.eventSources.left.length = 0;
				$scope.eventSources.right.length = 0;
			};

			/**
    * to set title & iScroll object
    */
			var setTitleAndScroller = function setTitleAndScroller() {
				// heading & title
				$scope.heading = $filter('translate')('CHANGE_STAY_DATES_TITLE');
				$scope.setTitle($scope.heading);

				// scroller options
				$scope.setScroller('room-rates-calendar');
			};

			/**
    * method to refresh scroller
    */
			var refreshScroller = function refreshScroller() {
				$timeout(function () {
					$scope.refreshScroller('room-rates-calendar');
				}, 100);
			};

			/**
    * Set the calendar options to display the calendar
    */
			var renderFullCalendar = function renderFullCalendar() {
				var _fullCalendarOptions;

				// calender options used by full calender, related settings are done here
				var fullCalendarOptions = (_fullCalendarOptions = {
					height: 450,
					editable: true,
					droppable: true,
					header: {
						left: '',
						center: 'title',
						right: ''
					},
					year: $scope.confirmedCheckinDate.getFullYear(), // Check in year
					month: typeof $scope.leftCalendarOptions == 'undefined' ? $scope.confirmedCheckinDate.getMonth() : $scope.leftCalendarOptions.month, // Check in month (month is zero based)
					day: $scope.confirmedCheckinDate.getDate() }, _defineProperty(_fullCalendarOptions, "editable", true), _defineProperty(_fullCalendarOptions, "disableResizing", false), _defineProperty(_fullCalendarOptions, "contentHeight", 320), _defineProperty(_fullCalendarOptions, "weekMode", 'fixed'), _defineProperty(_fullCalendarOptions, "ignoreTimezone", false), _defineProperty(_fullCalendarOptions, "dayRender", dayRendered), _fullCalendarOptions);

				$scope.leftCalendarOptions = _.extend({}, fullCalendarOptions);

				$scope.rightCalendarOptions = _.extend({}, fullCalendarOptions);

				// //Set month of rigt calendar
				$scope.rightCalendarOptions.month = $scope.leftCalendarOptions.month + 1;

				$scope.disablePrevButton = $scope.isPrevButtonDisabled();

				refreshScroller();
			};

			$scope.$on('availableRateFiltersUpdated', function (event) {
				resetCalenarEventModel();
				formCalendarEvents();
			});

			$scope.selectedBestAvailableRatesCalOption = function () {
				switchToBestAvailableRateMode();
				resetCalenarEventModel();
				formCalendarEvents();
			};

			/**
    * Event handler for Room type view selecton
    */
			$scope.selectedRoomTypesCalOption = function () {
				switchToRoomTypeMode();
				resetCalenarEventModel();
				formCalendarEvents();
			};

			$scope.filtersUpdated = function () {
				resetCalenarEventModel();
				formCalendarEvents();
			};

			$scope.isPrevButtonDisabled = function () {
				var startDate = new Date($scope.leftCalendarOptions.year, $scope.leftCalendarOptions.month),
				    calFrom = new tzIndependentDate(getFirstDayOfMonth(startDate)),
				    calTo = new tzIndependentDate(getLastDayOfNextMonth(startDate)),
				    busDate = new tzIndependentDate($rootScope.businessDate);
				// Disable prev button if current business date is visible in the calendar

				return busDate <= calTo && busDate >= calFrom;
			};

			/**
    * Handles the forward and backward change for the calendar months
    */
			var changeMonth = function changeMonth(direction) {
				var startDate;

				if (direction === 'FORWARD') {
					$scope.leftCalendarOptions.month = parseInt($scope.leftCalendarOptions.month) + 1;
					$scope.rightCalendarOptions.month = parseInt($scope.rightCalendarOptions.month) + 1;
				} else {
					$scope.leftCalendarOptions.month = parseInt($scope.leftCalendarOptions.month) - 1;
					$scope.rightCalendarOptions.month = parseInt($scope.rightCalendarOptions.month) - 1;
				}
				$scope.disablePrevButton = $scope.isPrevButtonDisabled();
				startDate = new Date($scope.leftCalendarOptions.year, $scope.leftCalendarOptions.month);
				resetCalenarEventModel();
				fetchCalendarAvailabilityData(getFirstDayOfMonth(startDate), getLastDayOfNextMonth(startDate));
			};

			/**
    * Click handler for the next month arrow
    * Fetches the details for the next set of dates -
    * Starting from last fetched date to the max visible date in calendar when we change month
    */
			$scope.nextButtonClickHandler = function () {
				changeMonth('FORWARD');
			};

			/**
    * Click handler for the next month arrow
    * Fetches the details for the next set of dates -
    * Stars from the first visible date in calendar when go back a month
    * to the start date available in the availability details
    */
			$scope.prevButtonClickHandler = function () {
				changeMonth('BACKWARD');
			};

			/**
    * to switch to Room type selected mode
    */
			var switchToRoomTypeMode = function switchToRoomTypeMode() {
				$scope.stateCheck.calendarState.calendarType = "ROOM_TYPE";
			};

			/**
    * to switch to best available rate mode
    */
			var switchToBestAvailableRateMode = function switchToBestAvailableRateMode() {
				$scope.stateCheck.calendarState.calendarType = "BEST_AVAILABLE";
			};

			/**
    * [isInBestAvailableMode description]
    * @return {Boolean}
    */
			var isInBestAvailableMode = function isInBestAvailableMode() {
				return $scope.stateCheck.calendarState.calendarType === "BEST_AVAILABLE";
			};

			/**
    * [isInRoomTypeSelectedMode description]
    * @return {Boolean}
    */
			var isInRoomTypeSelectedMode = function isInRoomTypeSelectedMode() {
				return $scope.stateCheck.calendarState.calendarType === "ROOM_TYPE";
			};

			/**
    * [isRestrictionIncludeInSearch description]
    * @return {Boolean}
    */
			var isRestrictionIncludedInSearch = function isRestrictionIncludedInSearch() {
				return $scope.stateCheck.calendarState.searchWithRestrictions;
			};

			/**
    * [isShowAvailableRoomsSelected description]
    * @return {Boolean}
    */
			var isShowAvailableRoomsSelected = function isShowAvailableRoomsSelected() {
				return $scope.stateCheck.calendarState.showOnlyAvailableRooms;
			};

			/**
    * to initialize variables in controllers
    */
			var initializeVariables = function initializeVariables() {
				var resData = $scope.reservationData;

				$scope.showCalender = false;
				$scope.eventSources = {
					left: [],
					right: []
				};

				$scope.stateVariables = {
					selectedRoom: parseInt(resData.tabs[$scope.viewState.currentTab].roomTypeId, 10) || "",
					selectedRate: parseInt(resData.rooms[$scope.stateCheck.roomDetails.firstIndex].rateId, 10) || "",
					rooms: [],
					rates: []
				};

				$scope.checkinDateInCalender = $scope.confirmedCheckinDate = tzIndependentDate(resData.arrivalDate);
				$scope.checkoutDateInCalender = $scope.confirmedCheckoutDate = tzIndependentDate(resData.departureDate);

				// finalRoomType - Room type finally selected by the user. corresponds to the bottom select box
				// roomTypeForCalendar - Room type which specifies the calendar data
				$scope.finalRoomType = $scope.roomTypeForCalendar = resData.rooms[0].roomTypeId;
			};

			/**
    * we need to set mode initialliy
    */
			var chooseMode = function chooseMode() {
				if (!!$scope.stateVariables.selectedRoom) {
					switchToRoomTypeMode();
				} else {
					switchToBestAvailableRateMode();
				}
				$scope.$emit('roomTypesCalOptionSelected');
			};

			/**
    * to show calender initially
    */
			var fetchAndShowCalendar = function fetchAndShowCalendar() {
				var firstDayOfCal = getDayOfMonth($scope.checkinDateInCalender),
				    lastDayOfNextMonth = getLastDayOfNextMonth($scope.checkinDateInCalender);

				fetchCalendarAvailabilityData(firstDayOfCal, lastDayOfNextMonth);
			};

			/**
    * to what we need to in initial time
    */
			var initializeMe = function () {

				initializeVariables();

				setTitleAndScroller();

				chooseMode();

				fetchAndShowCalendar();
			}();
		}]);
	}, {}] }, {}, [1]);