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
		sntRover.controller('RVStayDatesCalendarCtrl', ['$state', '$stateParams', '$rootScope', '$scope', 'RVStayDatesCalendarSrv', '$filter', 'ngDialog', function ($state, $stateParams, $rootScope, $scope, RVStayDatesCalendarSrv, $filter, ngDialog) {
			// inheriting some useful things
			BaseCtrl.call(this, $scope);
			var that = this;

			$scope.heading = $filter('translate')('CHANGE_STAY_DATES_TITLE');
			$scope.setTitle($scope.heading);
			// scroller options
			$scope.setScroller('stay-dates-calendar');

			this.init = function () {
				$scope.eventSources = [];

				$scope.calendarType = "ROOM_TYPE";
				if ($scope.reservationData.rooms[0].roomTypeId === "") {
					$scope.calendarType = "BEST_AVAILABLE";
				}
				$scope.checkinDateInCalender = $scope.confirmedCheckinDate = tzIndependentDate($scope.reservationData.arrivalDate);
				$scope.checkoutDateInCalender = $scope.confirmedCheckoutDate = tzIndependentDate($scope.reservationData.departureDate);

				// finalRoomType - Room type finally selected by the user. corresponds to the bottom select box
				// roomTypeForCalendar - Room type which specifies the calendar data
				$scope.finalRoomType = $scope.roomTypeForCalendar = $scope.reservationData.rooms[0].roomTypeId;
				// Stay nights in calendar
				$scope.nights = getNumOfStayNights();
				that.renderFullCalendar();
				fetchAvailabilityDetails();
				$scope.reservationData.searchPromoCode = ''; // clear last used promo
			};

			var fetchAvailabilityDetails = function fetchAvailabilityDetails() {
				var fromDate;
				var toDate;
				var availabilityFetchSuccess = function availabilityFetchSuccess(data) {
					$scope.$emit('hideLoader');
					$scope.availabilityDetails = data;
					$scope.fetchedStartDate = tzIndependentDate(fromDate);
					$scope.fetchedEndDate = tzIndependentDate(toDate);

					// Refresh the calendar with the arrival, departure dates
					$scope.refreshCalendarEvents();
					// Display Calendar
				};

				// From date is the 22nd of the previous month of arrival date
				// arrival_date - 6 days (we can have max 6 days of the previous month displayed in calendar)
				fromDate = $scope.checkinDateInCalender.clone();
				fromDate.setMonth(fromDate.getMonth() - 1);
				fromDate.setDate(22);

				if (fromDate < new Date($rootScope.businessDate)) {
					fromDate = $rootScope.businessDate;
				}

				// We can see two calendars in a row. The 2nd calendar can display
				// max 13(6+7) days(the calendar has 6 rows) of its coming month
				toDate = $scope.checkinDateInCalender.clone();
				toDate.setMonth(toDate.getMonth() + 2);
				toDate.setDate(13);

				var params = {};

				params.from_date = $filter('date')(fromDate, $rootScope.dateFormatForAPI);
				// The maximum number of results we expect - 31+31+6+13
				params.per_page = 81;
				params.to_date = $filter('date')(toDate, $rootScope.dateFormatForAPI);
				params.status = "";
				if ($scope.reservationData.travelAgent.id !== "") {
					params.travel_agent_id = $scope.reservationData.travelAgent.id;
				}
				if ($scope.reservationData.company.id !== "") {
					params.company_id = $scope.reservationData.company.id;
				}
				if ($scope.reservationData.searchPromoCode !== "") {
					params.promotion_code = $scope.reservationData.searchPromoCode;
				}
				// Initialise data
				RVStayDatesCalendarSrv.availabilityData = {};
				$scope.invokeApi(RVStayDatesCalendarSrv.fetchAvailability, params, availabilityFetchSuccess);
			};

			/**
    * @Return {Array} Dates of the stayrange - excludes the departure date
    */
			var getDatesOfTheStayRange = function getDatesOfTheStayRange() {
				var startDate = $scope.checkinDateInCalender;
				var stopDate = $scope.checkoutDateInCalender;

				var dateArray = new Array();
				var currentDate = startDate;

				while (currentDate <= stopDate) {
					dateArray.push($filter('date')(currentDate, $rootScope.dateFormatForAPI));
					currentDate = currentDate.addDays(1);
				}
				return dateArray;
			};

			// We have to update the staydetails in 'reservationData' hash data modal
			// for each day of reservation
			$scope.updateDataModel = function () {
				var availabilityDetails = dclone($scope.availabilityDetails);
				// Update the arrival_date and departure_dates

				$scope.reservationData.arrivalDate = $filter('date')($scope.checkinDateInCalender, $rootScope.dateFormatForAPI);
				$scope.reservationData.departureDate = $filter('date')($scope.checkoutDateInCalender, $rootScope.dateFormatForAPI);

				// nights
				$scope.reservationData.numNights = $scope.dates.length - 1;

				// Update the room type details
				$scope.reservationData.rooms[0].roomTypeId = $scope.finalRoomType;
				var roomTypeName = "";

				for (var i in availabilityDetails.room_types) {
					if (availabilityDetails.room_types[i].id === $scope.finalRoomType) {
						roomTypeName = availabilityDetails.room_types[i].name;
						break;
					}
				}
				$scope.reservationData.rooms[0].roomTypeName = roomTypeName;

				// Update the rate details - we need to update for each stay day
				var stayDates = {};

				var date;

				for (var i in $scope.dates) {
					date = $scope.dates[i];

					stayDates[date] = {};
					// Guests hash
					stayDates[date].guests = {};
					stayDates[date].guests.adults = $scope.reservationData.rooms[0].numAdults;
					stayDates[date].guests.children = $scope.reservationData.rooms[0].numChildren;
					stayDates[date].guests.infants = $scope.reservationData.rooms[0].numInfants;

					// rate details
					stayDates[date].rate = {};

					// We need to get the lowest rate for that room type from the availability details
					// Even if we are in BAR calendar. we have to select a room type to make the reservation
					var rateIdForTheDate = availabilityDetails.results[date][$scope.finalRoomType].rate_id;

					stayDates[date].rate.id = rateIdForTheDate;
					var rateName = "";

					for (var j in availabilityDetails.rates) {
						if (availabilityDetails.rates[j].id === rateIdForTheDate) {
							rateName = availabilityDetails.rates[j].name;
							break;
						}
					}
					stayDates[date].rate.name = rateName;
				}

				$scope.reservationData.rooms[0].stayDates = stayDates;

				// Updating the room and rates data model to be consistent with the stay dates selected in the calendar
				// Setting parameter to be true to ensure navigation to enhanceStay
				$scope.initRoomRates(true);
			};

			/**
    * Event handler for set dates button
    * Confirms the staydates in calendar
    */
			$scope.setDatesClicked = function () {

				// Get the staydates from the calendar
				$scope.houseNotAvailableForBooking = false;
				$scope.roomTypeNotAvailableForBooking = false;
				$scope.dates = getDatesOfTheStayRange();

				// Check if the staydates has overbooking. if yes display a popup
				if (isOverBooking()) {
					ngDialog.open({
						template: '/assets/partials/reservation/alerts/overBookingAlert.html',
						className: 'ngdialog-theme-default',
						closeByDocument: false,
						scope: $scope
					});

					return false;
				}
				// If not overbooking, update the datamodals
				$scope.updateDataModel();
			};
			/**
    * Check if the stayrange has house & room type available
    * If for any of the staydates, house or room type not available, then it is overbooking
    */
			var isOverBooking = function isOverBooking(dates) {
				var dateDetails;
				var roomTypeAvailbilityForTheDay;
				var isOverBooking = false;
				var date;
				// Check for each stayday, whether it is overbooking

				for (var i in $scope.dates) {
					date = $scope.dates[i];
					dateDetails = $scope.availabilityDetails.results[date];

					// Check if houe available for the day
					houseAvailabilityForTheDay = dateDetails['house'].availability;
					if (houseAvailabilityForTheDay <= 0) {
						$scope.houseNotAvailableForBooking = true;
						isOverBooking = true;
						break;
					}
					// check if selected room type available for the day
					roomTypeAvailbilityForTheDay = dateDetails[$scope.finalRoomType].room_type_availability.availability;
					if (roomTypeAvailbilityForTheDay <= 0) {
						$scope.roomTypeNotAvailableForBooking = true;
						isOverBooking = true;
						break;
					}
				}
				return isOverBooking;
			};

			/**
    * Set the calendar options to display the calendar
    */
			this.renderFullCalendar = function () {
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
					month: $scope.confirmedCheckinDate.getMonth(), // Check in month (month is zero based)
					day: $scope.confirmedCheckinDate.getDate() }, _defineProperty(_fullCalendarOptions, "editable", true), _defineProperty(_fullCalendarOptions, "disableResizing", false), _defineProperty(_fullCalendarOptions, "contentHeight", 320), _defineProperty(_fullCalendarOptions, "weekMode", 'fixed'), _defineProperty(_fullCalendarOptions, "ignoreTimezone", false), _fullCalendarOptions);

				$scope.leftCalendarOptions = dclone(fullCalendarOptions);
				// Setting events for left calendar - same for both calendars
				// But we can not deep clone the events
				$scope.leftCalendarOptions.eventDrop = changedDateOnCalendar;
				$scope.leftCalendarOptions.drop = dateDroppedToExternalCalendar;

				// Setting events for right calendar
				$scope.rightCalendarOptions = dclone(fullCalendarOptions);
				$scope.rightCalendarOptions.eventDrop = changedDateOnCalendar;
				$scope.rightCalendarOptions.drop = dateDroppedToExternalCalendar;

				// Set month of rigt calendar
				$scope.rightCalendarOptions.month = $scope.leftCalendarOptions.month + 1;

				$scope.disablePrevButton = $scope.isPrevButtonDisabled();

				setTimeout(function () {
					$scope.refreshScroller('stay-dates-calendar');
				}, 1500);
			};

			// Drag and drop handler for drag and drop to an external calendar
			dateDroppedToExternalCalendar = function dateDroppedToExternalCalendar(event, jsEvent, ui) {
				var finalCheckin;
				var finalCheckout;

				// checkin date/ checkout date can not be moved prior to current business date
				if (event.getTime() < tzIndependentDate($rootScope.businessDate).getTime()) {

					return false;
				}

				if ($(ui.target).attr('class').indexOf("check-in") >= 0) {
					// If drag and drop carried in same calendar, we don't want to handle here.
					// will be handled in 'eventDrop' (changedDateOnCalendar fn)
					if (event.getMonth === $scope.checkinDateInCalender.getMonth()) {
						return false;
					}
					// checkin type date draging after checkout date wil not be allowed
					if (event > $scope.checkoutDateInCalender) {
						return false;
					}
					finalCheckin = event;
					finalCheckout = $scope.checkoutDateInCalender;
				} else if ($(ui.target).attr('class').indexOf("check-out") >= 0) {
					// If drag and drop carried in same calendar, we don't want to handle here.
					// will be handled in 'eventDrop' (changedDateOnCalendar fn)
					if (event.getMonth === $scope.checkoutDateInCalender.getMonth()) {
						return false;
					}
					// checkout date draging before checkin date wil not be allowed
					if (event < $scope.checkinDateInCalender) {
						return false;
					}
					finalCheckin = $scope.checkinDateInCalender;
					finalCheckout = event;
				}
				// we are re-assinging our new checkin/checkout date for calendar
				$scope.checkinDateInCalender = finalCheckin;
				$scope.checkoutDateInCalender = finalCheckout;
				$scope.nights = getNumOfStayNights();

				// Reload the calendar with new arrival, departure dates
				$scope.refreshCalendarEvents();
			};

			/**
    * return the rate for a given date
    */
			var getRateForTheDay = function getRateForTheDay(availabilityDetails) {
				// If no room type is selected for the room type calendar,
				// then no need to display the rate
				var rate = {};

				rate.name = '';
				rate.value = '';
				if ($scope.roomTypeForCalendar === "" && $scope.calendarType === "ROOM_TYPE") {
					return rate;
				} else if (typeof availabilityDetails.room_rates.single !== 'undefined') {
					rate.value = $rootScope.currencySymbol + availabilityDetails.room_rates.single;
					// Get the rate value iterating throught the rates array
					angular.forEach($scope.availabilityDetails.rates, function (rateDetails, i) {
						if (rateDetails.id === availabilityDetails.rate_id) {
							rate.name = rateDetails.name;
							return false;
						}
					});
				}
				return rate;
			};

			// Get the room type name looping through the room type details
			var getRoomTypeForBAR = function getRoomTypeForBAR(availabilityDetails) {
				var roomTypeId = availabilityDetails.room_rates.room_type_id;
				var roomTypeName = "";

				angular.forEach($scope.availabilityDetails.room_types, function (roomType, i) {
					if (roomType.id === roomTypeId) {
						roomTypeName = roomType.description;
						return false;
					}
				});
				return roomTypeName;
			};

			/**
   * Compute the fullcalendar events object from the availability details
   */
			var computeEventSourceObject = function computeEventSourceObject(checkinDate, checkoutDate) {

				var availabilityKey;
				var dateAvailability;

				if ($scope.calendarType === "BEST_AVAILABLE") {
					availabilityKey = 'BAR';
				} else {
					availabilityKey = $scope.roomTypeForCalendar;
				}
				var events = [];

				var thisDate;
				var calEvt = {};
				var rate = '';

				angular.forEach($scope.availabilityDetails.results, function (dateDetails, date) {
					calEvt = {};
					// instead of new Date(), Fixing the timezone issue related with fullcalendar
					thisDate = tzIndependentDate(date);
					rate = getRateForTheDay(dateDetails[availabilityKey]);
					calEvt.title = typeof rate.value === 'undefined' ? '' : rate.value;
					calEvt.rate = typeof rate.name === 'undefined' ? '' : rate.name; // Displayed in tooltip
					calEvt.start = thisDate;
					calEvt.end = thisDate;
					calEvt.day = thisDate.getDate().toString();
					// Displayed in tooltip
					if ($scope.calendarType === "BEST_AVAILABLE") {
						calEvt.roomType = getRoomTypeForBAR(dateDetails[availabilityKey]);
					}

					// Event is check-in
					if (thisDate.getDate() === checkinDate.getDate() && thisDate.getMonth() === checkinDate.getMonth() && thisDate.getYear() === checkinDate.getYear()) {
						calEvt.id = "check-in";
						calEvt.className = "check-in";

						if ($scope.reservationData.status !== "CHECKEDIN" && $scope.reservationData.status !== "CHECKING_OUT") {
							calEvt.startEditable = "true";
						}
						calEvt.durationEditable = "false";
						// If check-in date and check-out dates are the same, show split view.
						if (checkinDate.getDate() === checkoutDate.getDate() && checkinDate.getMonth() === checkoutDate.getMonth() && checkinDate.getYear() === checkoutDate.getYear()) {
							calEvt.className = "check-in split-view";
							events.push(calEvt);
							// checkout-event
							calEvt = {};
							calEvt.title = getRateForTheDay(dateDetails[availabilityKey]).value;
							calEvt.start = thisDate;
							calEvt.end = thisDate;
							calEvt.day = thisDate.getDate().toString();
							calEvt.id = "check-out";
							calEvt.className = "check-out split-view";
							calEvt.startEditable = "true";
							calEvt.durationEditable = "false";
						}

						// mid-stay range
					} else if (thisDate.getTime() > checkinDate.getTime() && thisDate.getTime() < checkoutDate.getTime()) {
						calEvt.id = "availability";
						calEvt.className = "mid-stay";
						// Event is check-out
					} else if (thisDate.getDate() === checkoutDate.getDate() && thisDate.getMonth() === checkoutDate.getMonth() && thisDate.getYear() === checkoutDate.getYear()) {
						calEvt.id = "check-out";
						calEvt.className = "check-out";
						calEvt.startEditable = "true";
						calEvt.durationEditable = "false";
						/** Following are for dates prior to check-in and dates after checkout*/
					} else if ($scope.calendarType === "BEST_AVAILABLE" && dateDetails[availabilityKey].room_type_availability.availability > 0 || $scope.calendarType === "ROOM_TYPE" && $scope.roomTypeForCalendar !== "" && dateDetails[availabilityKey].room_type_availability.availability > 0) {
						calEvt.className = "type-available";
						calEvt.durationEditable = "false";
						// TODO: verify class name
						// room type not available but house available
					} else if (dateDetails["house"].availability > 0) {
						// calEvt.className = ""; //TODO: verify class name from stjepan
						// house not available(no room available in the hotel for any room type)
					} else {
						calEvt.className = "house-unavailable";
					}

					events.push(calEvt);
				});
				return events;
			};

			/**
    * Event handler for the room type dropdown in top
    * - the dropdown which defines the data for calendar.
    */
			$scope.roomTypeForCalendarChanged = function () {
				$scope.finalRoomType = $scope.roomTypeForCalendar;
				$scope.resetCalendarDates();
				$scope.refreshCalendarEvents();
			};

			/**
    * This function is used to check the whether the movement of dates is valid
    * accoriding to our reqmt.
    */
			var changedDateOnCalendar = function changedDateOnCalendar(event, dayDelta, minuteDelta, allDay, revertFunc, jsEvent, ui, view) {
				var newDateSelected = event.start; // the new date in calendar

				// also we are storing the current business date for easiness of the following code
				var currentBusinessDate = tzIndependentDate($rootScope.businessDate);

				var finalCheckin = "";
				var finalCheckout = "";

				// checkin date/ checkout date can not be moved prior to current business date
				if (newDateSelected.getTime() < currentBusinessDate.getTime()) {
					revertFunc();
					return false;
				}

				if (event.id === 'check-in') {
					// checkin type date draging after checkout date wil not be allowed
					if (newDateSelected > $scope.checkoutDateInCalender) {
						revertFunc();
						return false;
					}
					finalCheckin = newDateSelected;
					finalCheckout = $scope.checkoutDateInCalender;
				} else if (event.id === "check-out") {
					// checkout date draging before checkin date wil not be allowed
					if (newDateSelected < $scope.checkinDateInCalender) {
						revertFunc();
						return false;
					}

					finalCheckin = $scope.checkinDateInCalender;
					finalCheckout = newDateSelected;
				}
				// we are re-assinging our new checkin/checkout date for calendar
				$scope.checkinDateInCalender = finalCheckin;
				$scope.checkoutDateInCalender = finalCheckout;
				$scope.nights = getNumOfStayNights();

				// Reload the calendar with new arrival, departure dates
				$scope.refreshCalendarEvents();
			};

			$scope.refreshCalendarEvents = function () {
				$scope.eventSources.length = 0;
				$scope.events = computeEventSourceObject($scope.checkinDateInCalender, $scope.checkoutDateInCalender);
				$scope.eventSources.length = 0;
				$scope.eventSources.push($scope.events);
			};

			var getNumOfStayNights = function getNumOfStayNights() {
				// setting nights based on calender checking/checkout days
				var timeDiff = $scope.checkoutDateInCalender.getTime() - $scope.checkinDateInCalender.getTime();

				return Math.ceil(timeDiff / (1000 * 3600 * 24));
			};

			$scope.resetCalendarDates = function () {
				$scope.checkinDateInCalender = $scope.confirmedCheckinDate;
				$scope.checkoutDateInCalender = $scope.confirmedCheckoutDate;
			};

			/**
   * Event handler for BAR option
   */
			$scope.selectedBestAvailableRatesCalOption = function () {
				$scope.calendarType = 'BEST_AVAILABLE';
				$scope.resetCalendarDates();
				$scope.refreshCalendarEvents();
			};
			/**
   * Event handler for Room type view selecton
   */
			$scope.selectedRoomTypesCalOption = function () {
				$scope.calendarType = 'ROOM_TYPE';
				$scope.resetCalendarDates();
				$scope.refreshCalendarEvents();
			};

			/**
   * Room type dropdown should be disabled for inhouse reservations
   */
			$scope.isRoomTypeChangeAllowed = function () {
				var ret = true;

				if ($scope.reservationData.status === "CHECKEDIN" || $scope.reservationData.status === "CHECKING_OUT") {
					ret = false;
				}
				return ret;
			};
			// Click handler for cancel button in calendar screen
			$scope.handleCancelAction = function () {
				if ($stateParams.fromState === 'STAY_CARD') {
					$state.go("rover.reservation.staycard.reservationcard.reservationdetails", { "id": $scope.reservationData.reservationId, "confirmationId": $scope.reservationData.confirmNum, "isrefresh": true });
				} else {
					$state.go($stateParams.fromState, {});
				}
			};

			/**
   * @return {Boolean} true if the month of left calendar is equal to current business date
   * we can not navigate further to the left
   */
			$scope.isPrevButtonDisabled = function () {
				var disabled = false;

				if (parseInt(tzIndependentDate($rootScope.businessDate).getMonth()) === parseInt($scope.leftCalendarOptions.month)) {
					disabled = true;
				}
				return disabled;
			};

			/**
   * Handles the forward and backward change for the calendar months
   */
			var changeMonth = function changeMonth(direction) {
				if (direction === 'FORWARD') {
					$scope.leftCalendarOptions.month = parseInt($scope.leftCalendarOptions.month) + 1;
					$scope.rightCalendarOptions.month = parseInt($scope.rightCalendarOptions.month) + 1;
				} else {
					$scope.leftCalendarOptions.month = parseInt($scope.leftCalendarOptions.month) - 1;
					$scope.rightCalendarOptions.month = parseInt($scope.rightCalendarOptions.month) - 1;
				}
				$scope.disablePrevButton = $scope.isPrevButtonDisabled();
			};

			/**
   * Click handler for the next month arrow
   * Fetches the details for the next set of dates -
   * Starting from last fetched date to the max visible date in calendar when we change month
   */
			$scope.nextButtonClickHandler = function () {
				// Get the start date and end date of availability details fetched so far.
				var fetchedStartDate = $scope.fetchedStartDate.clone();
				var fetchedEndDate = $scope.fetchedEndDate.clone();
				var nextMonthLastVisibleDate;

				var nextMonthDetailsFetchSuccess = function nextMonthDetailsFetchSuccess(data) {
					$scope.$emit('hideLoader');
					$scope.availabilityDetails = data;
					$scope.refreshCalendarEvents();
					// Update the end date value
					$scope.fetchedEndDate = nextMonthLastVisibleDate;
					changeMonth('FORWARD');
				};
				// When we move the month forward, the last date visible would be
				// The 13th of next month. We should fetch the availability upto that date

				nextMonthLastVisibleDate = new Date($scope.rightCalendarOptions.year, $scope.rightCalendarOptions.month);
				nextMonthLastVisibleDate.setMonth(nextMonthLastVisibleDate.getMonth() + 2);
				nextMonthLastVisibleDate.setDate(13);
				if (fetchedStartDate <= nextMonthLastVisibleDate && nextMonthLastVisibleDate <= fetchedEndDate) {
					changeMonth('FORWARD');
					return false;
				}

				var params = {};
				var fromDate = fetchedEndDate.setDate(fetchedEndDate.getDate() + 1);

				params.from_date = $filter('date')(fromDate, $rootScope.dateFormatForAPI);
				// Number of items to be fetched - 31+13
				params.per_page = 44;
				params.to_date = $filter('date')(nextMonthLastVisibleDate, $rootScope.dateFormatForAPI);
				params.status = 'FETCH_ADDITIONAL';
				if ($scope.reservationData.travelAgent.id !== "") {
					params.travel_agent_id = $scope.reservationData.travelAgent.id;
				}
				if ($scope.reservationData.company.id !== "") {
					params.company_id = $scope.reservationData.company.id;
				}
				$scope.invokeApi(RVStayDatesCalendarSrv.fetchAvailability, params, nextMonthDetailsFetchSuccess);
			};

			/**
   * Click handler for the next month arrow
   * Fetches the details for the next set of dates -
   * Stars from the first visible date in calendar when go back a month
   * to the start date available in the availability details
   */
			$scope.prevButtonClickHandler = function () {
				var fetchedStartDate = $scope.fetchedStartDate.clone();
				var fetchedEndDate = $scope.fetchedEndDate.clone();

				var prevMonthLastVisibleDate;

				var prevMonthDetailsFetchSuccess = function prevMonthDetailsFetchSuccess(data) {
					$scope.$emit('hideLoader');
					$scope.availabilityDetails = data;
					$scope.refreshCalendarEvents();
					$scope.fetchedStartDate = prevMonthLastVisibleDate;
					changeMonth('BACKWARD');
				};

				// The max visible date in calendar could be 22nd of the previous month
				prevMonthLastVisibleDate = new Date($scope.leftCalendarOptions.year, $scope.leftCalendarOptions.month);
				prevMonthLastVisibleDate.setMonth(prevMonthLastVisibleDate.getMonth() - 2);
				prevMonthLastVisibleDate.setDate(22);

				// Limit the start date to the current business date
				if (prevMonthLastVisibleDate <= tzIndependentDate($rootScope.businessDate)) {
					prevMonthLastVisibleDate = tzIndependentDate($rootScope.businessDate);
				}
				// If the data is already fetched for the visble dates, then just swith the months
				if (fetchedStartDate <= prevMonthLastVisibleDate && prevMonthLastVisibleDate <= fetchedEndDate) {
					changeMonth('BACKWARD');
					return false;
				}
				// Fetch the availability details if not already fetched
				var params = {};

				params.from_date = $filter('date')(prevMonthLastVisibleDate, $rootScope.dateFormatForAPI);
				// The max possible count - 31 + 6
				params.per_page = 37;
				var toDate = fetchedStartDate.setDate(fetchedStartDate.getDate() - 1);

				params.to_date = $filter('date')(toDate, $rootScope.dateFormatForAPI);
				params.status = 'FETCH_ADDITIONAL';
				if ($scope.reservationData.travelAgent.id !== "") {
					params.travel_agent_id = $scope.reservationData.travelAgent.id;
				}
				if ($scope.reservationData.company.id !== "") {
					params.company_id = $scope.reservationData.company.id;
				}
				$scope.invokeApi(RVStayDatesCalendarSrv.fetchAvailability, params, prevMonthDetailsFetchSuccess);
			};

			this.init();
		}]);
	}, {}] }, {}, [1]);