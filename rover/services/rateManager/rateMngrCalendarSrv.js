'use strict';

angular.module('sntRover').service('RateMngrCalendarSrv', ['$q', 'BaseWebSrvV2', function ($q, BaseWebSrvV2) {
	var that = this;

	that.allRestrictionTypes = [];

	this.restrictionsIndependentOfDays = []; // CICO-21942

	this.fetchAllRestrictionTypes = function (onComplete, params, url) {
		// TODO: Modify to handle case of date range changes, if needed.
		var url = '/api/restriction_types';
		var deferred = $q.defer();

		if (that.allRestrictionTypes.length > 0) {
			deferred.resolve(that.allRestrictionTypes);
		} else {
			BaseWebSrvV2.getJSON(url).then(function (data) {
				// Only the editable restrictions should be shown in the UI
				for (var i in data.results) {
					if (data.results[i].activated && !data.results[i].editable) {
						that.allRestrictionTypes.push(data.results[i]);
						if (['CLOSED', 'CLOSED_ARRIVAL', 'CLOSED_DEPARTURE'].indexOf(data.results[i].value) >= 0) {
							that.restrictionsIndependentOfDays.push(data.results[i].id);
						}
					}
				}
				deferred.resolve(data);
			}, function (data) {
				deferred.reject(data);
			});
		}
		return deferred.promise;
	};

	this.fetchSortPreferences = function () {
		var deferred = $q.defer(),
		    url = '/api/sort_preferences/list_selections';

		BaseWebSrvV2.getJSON(url).then(function (data) {
			deferred.resolve(data.rate_manager);
		}, function (data) {
			deferred.reject(data);
		});
		return deferred.promise;
	};

	this.fetchSortOptions = function () {
		var deferred = $q.defer(),
		    url = '/api/sort_preferences/';

		BaseWebSrvV2.getJSON(url).then(function (data) {
			deferred.resolve(data.rate_manager);
		}, function (data) {
			deferred.reject(data);
		});
		return deferred.promise;
	};

	this.updateRoomTypeOverride = function (data) {
		data.date = data.selectedDate;
		data.rate_id = data.selectedRate;
		// rate_id, date, room_type_id need to be included to clear rates
		var url = '/api/daily_rates/' + data.selectedRate + '/remove_custom_rate?';
		var deferred = $q.defer();

		BaseWebSrvV2.postJSON(url, data).then(function (data) {
			deferred.resolve(data);
		}, function (data) {
			deferred.reject(data);
		});
		return deferred.promise;
	};

	/**
    * To fetch All Calendar data
    */

	this.isFetchingRooms = function (params) {
		var fetchingRooms;

		if (params) {
			if (params.roomrate === 'ROOMS') {
				fetchingRooms = true;
			} else {
				fetchingRooms = false;
			}
		} else {
			fetchingRooms = false;
		}
		that.fetchingRooms = fetchingRooms;
		return fetchingRooms;
	};
	this.getUrlEnd = function (url, params) {
		var dateString = url + '?from_date=' + params.from_date + '&to_date=' + params.to_date + '&per_page=' + params.per_page + '&order_id=' + params.order_id;
		var rateString = "";

		for (var i in params.rate_ids) {
			rateString = rateString + "&rate_ids[]=" + params.rate_ids[i];
		}
		var rateTypeString = "";

		for (var i in params.rate_type_ids) {
			rateTypeString = rateTypeString + "&rate_type_ids[]=" + params.rate_type_ids[i];
		}

		var nameCardString = "";

		for (var i in params.name_card_ids) {
			nameCardString = nameCardString + "&name_card_ids[]=" + params.name_card_ids[i];
		}

		return dateString + rateString + rateTypeString + nameCardString;
	};
	this.fetchCalendarData = function (params) {
		var url = "/api/daily_rates",
		    fetchingRooms = that.isFetchingRooms(params);

		if (fetchingRooms) {
			url = url + '/room_restrictions';
		}

		var deferred = $q.defer();
		var rejectDeferred = function rejectDeferred(data) {
			deferred.reject(data);
		};

		that.fetchAllRestrictionTypes().then(that.getDailyRates(params, url, deferred, rejectDeferred), rejectDeferred);

		return deferred.promise;
	};

	this.getDailyRates = function (params, url, deferred, rejectDeferred) {
		var urlString = that.getUrlEnd(url, params);

		BaseWebSrvV2.getJSON(urlString).then(function (data) {
			var fetchingRooms = that.isFetchingRooms(params);

			that.dailyRates = data;
			if (fetchingRooms) {
				data.room_type_restrictions = data.result.room_types;
				that.dailyRates.results = data.result.room_types;
			}

			var calendarData = that.calculateRateViewCalData();

			if (fetchingRooms) {
				calendarData.room_type_restrictions = data.room_type_restrictions;
				calendarData.total_room_types = data.room_type_restrictions[0].room_types.length;
			}
			calendarData.room_types_all = [];
			calendarData.isChildRate = [];

			var rateObj;

			if (data.results[0]) {
				for (var c in data.results[0].rates) {
					rateObj = data.results[0].rates[c];
					if (!rateObj.can_modify) {
						calendarData.isChildRate.push(rateObj.id);
					}
				}
			}

			if (fetchingRooms) {
				for (var i in data.room_type_restrictions[0].room_types) {
					calendarData.room_types_all.push({
						room_type_id: data.room_type_restrictions[0].room_types[i].room_type.id,
						name: data.room_type_restrictions[0].room_types[i].room_type.name
					});
				}
			}

			// If only one rate exists in the search results,
			// then room type calendar for that rate should be displayed.
			// Fetch the room type details for that rate.
			if (calendarData.data.length === 1) {
				var roomDetailsParams = {};

				roomDetailsParams.from_date = params.from_date;
				roomDetailsParams.to_date = params.to_date;
				roomDetailsParams.id = calendarData.data[0].id;
				roomDetailsParams.rate = calendarData.data[0].name;
				roomDetailsParams.isHourly = calendarData.data[0].is_hourly;

				that.fetchRoomTypeCalendarData(roomDetailsParams, url, deferred);
			} else {
				calendarData.type = "RATES_LIST";
				deferred.resolve(calendarData);
			}
		}, rejectDeferred);
	};

	this.fetchRoomTypeCalendarData = function (params, url, deferred) {
		if (typeof deferred === 'undefined') {
			deferred = $q.defer();
		}
		var rejectDeferred = function rejectDeferred(data) {
			deferred.reject(data);
		};

		that.fetchAllRestrictionTypes().then(that.getRoomTypeRates(params, url, deferred, rejectDeferred), rejectDeferred);

		return deferred.promise;
	};

	this.getRoomTypeRates = function (params, url, deferred, rejectDeferred) {
		/* It is the case of All-Rates from Rate Calendar.
   * TODO: Handle this case at the calling place itself.
   */
		if (typeof params.id === "undefined") {
			deferred.resolve({});
			return;
		}
		url = "/api/daily_rates/" + params.id;
		// To pass the selected rate id and name to the controller.
		// In situations where the rate is not manually selected by user,
		// but single rate is returned in the webservice fetch for rates list.
		// So we fetch the room details for that rate id and display the room type calendar
		if (typeof params.id !== "undefined" && typeof params.rate !== "undefined") {
			var selectedRate = {};

			selectedRate.id = params.id;
			selectedRate.name = params.rate;
		}
		delete params['id'];
		delete params['rate'];

		BaseWebSrvV2.getJSON(url, params).then(function (data) {
			that.roomTypeRates = data;
			var calendarData = that.calculateRoomTypeViewCalData();

			calendarData.type = "ROOM_TYPES_LIST";
			calendarData.room_type_restrictions = data.room_type_restrictions;
			// Pass the rate details to the controller
			calendarData.selectedRateDetails = selectedRate;
			calendarData.is_child = data.can_modify !== undefined && !data.modify || data.is_child;
			calendarData.parentRateName = data.parent_rate_name;
			deferred.resolve(calendarData);
		}, rejectDeferred);
	};

	this.updateRestrictions = function (params) {
		var url = '/api/daily_rates';
		var deferred = $q.defer();

		BaseWebSrvV2.postJSON(url, params).then(function (data) {
			deferred.resolve(data);
		}, function (data) {
			deferred.reject(data);
		});
		return deferred.promise;
	};

	this.checkIfAnyHourlyRatePresent = function (rateData) {
		var fetchingRooms = that.fetchingRooms;

		if (fetchingRooms) {
			return false;
		}
		var hasHourly = false;

		angular.forEach(rateData, function (rate) {
			if (rate.is_hourly === true) {
				hasHourly = true;
				return false;
			}
		});
		return hasHourly;
	};

	this.calculateRoomTypeViewCalData = function () {
		var calendarData = {};

		this.hasAnyHourlyRate = this.checkIfAnyHourlyRatePresent(that.roomTypeRates.results[0].room_rates);
		// Format restriction Types as required by UI, and make it a dict for easy lookup
		var formattedRestrictionTypes = {};

		angular.forEach(that.allRestrictionTypes, function (item) {
			formattedRestrictionTypes[item.id] = that.getRestrictionUIElements(item);
		});
		var totalRestrictions = formattedRestrictionTypes.length;
		// ADD ONE MORE ITEM, FOR ZOOM 7; CICO-10668
		var baseRestrictionItem = {
			'activated': true,
			'background_class': "bg-drk",
			'description': "Has Restrictions",
			'editable': false,
			'hideOnHourly': false,
			'isOnRate': true, // hide when on adding/removing restrictions screen
			'icon': "R",
			'days': "R",
			'id': totalRestrictions,
			'value': "HAS_RESTRICTIONS" };

		formattedRestrictionTypes[totalRestrictions] = baseRestrictionItem;
		calendarData.restriction_types = formattedRestrictionTypes;

		// In UI, tables are represented as rows of columns.
		// Input data is in opposite structure, restructuring here
		var datesList = [];
		var ratesRestrictions = {};
		var roomRateData = [];

		angular.forEach(that.roomTypeRates.results, function (item) {
			datesList.push(item.date);

			// CICO-21942 Set days count of restrictionsIndependentOfDays to be null
			_.each(item.rate_restrictions, function (rate) {
				if (_.indexOf(that.restrictionsIndependentOfDays, parseInt(rate.restriction_type_id, 10)) > -1) {
					rate.days = null;
				}
			});

			// UI requires al-rates separated from daily rates.
			ratesRestrictions[item.date] = item.rate_restrictions;

			// Adjusting Daily Rate Data - we require rows of colums - not the other way.
			for (var ri in item.room_rates) {
				var rate = item.room_rates[ri];
				// Check if this rate is already pushed.
				var rateData = null;

				for (var i in roomRateData) {
					if (roomRateData[i].id === rate.room_type.id) {
						rateData = roomRateData[i];
						// break;
					}
				}

				if (rateData === null) {
					rateData = {
						id: rate.room_type.id,
						name: rate.room_type.name,
						is_hourly: rate.is_hourly
					};
					roomRateData.push(rateData);
				}
				var rr = {};
				// CICO-21942 Set days count of restrictionsIndependentOfDays to be null

				_.each(rate.restrictions, function (rate) {
					if (_.indexOf(that.restrictionsIndependentOfDays, parseInt(rate.restriction_type_id, 10)) > -1) {
						rate.days = null;
					}
				});
				rr.restrictions = rate.restrictions;
				rr.single = rate.rate_currency + "-" + rate.single;
				rr["double"] = rate.rate_currency + "-" + rate["double"];
				rr.extra_adult = rate.rate_currency + "-" + rate.extra_adult;
				rr.child = rate.rate_currency + "-" + rate.child;
				// ( CICO-9555
				rr.isHourly = rate.rate_currency + "-" + rate.is_hourly;
				rr.nightly = rate.rate_currency + "-" + rate.nightly_rate;
				// CICO-9555 )
				rateData[item.date] = rr;
			}
		});

		calendarData.dates = datesList;
		calendarData.rate_restrictions = ratesRestrictions;
		calendarData.data = roomRateData;

		// close all/open all restriction status
		var enableDisableCloseAll = that.getCloseAllEnableDisableStatus(calendarData.data, "ROOM_TYPE");

		calendarData.disableCloseAllBtn = !enableDisableCloseAll.enableCloseAll;
		calendarData.disableOpenAllBtn = !enableDisableCloseAll.enableOpenAll;

		return calendarData;
	};

	this.calculateRateViewCalData = function () {
		var calendarData = {};

		if (!that.fetchingRooms) {
			this.hasAnyHourlyRate = this.checkIfAnyHourlyRatePresent(that.dailyRates.results[0].rates);
			// Format restriction Types as required by UI, and make it a dict for easy lookup
		}
		var formattedRestrictionTypes = {};

		angular.forEach(that.allRestrictionTypes, function (item) {
			formattedRestrictionTypes[item.id] = that.getRestrictionUIElements(item);
		});

		var totalRestrictions = formattedRestrictionTypes.length;
		// ADD ONE MORE ITEM, FOR ZOOM 7; CICO-10668
		var baseRestrictionItem = {
			'activated': true,
			'background_class': "bg-drk",
			'description': "Has Restrictions",
			'editable': false,
			'isOnRate': true, // hide when on adding/removing restrictions screen
			'hideOnHourly': false,
			'icon': "R",
			'days': "R",
			'id': totalRestrictions,
			'value': "HAS_RESTRICTIONS" };

		formattedRestrictionTypes[totalRestrictions] = baseRestrictionItem;

		calendarData.restriction_types = formattedRestrictionTypes;

		// In UI, tables are represented as rows of columns.
		// Input data is in opposite structure, restructuring here
		var datesList = [];
		var allRatesData = {};
		var dailyRatesData = [];

		angular.forEach(that.dailyRates.results, function (item) {
			datesList.push(item.date);

			// UI requires al-rates separated from daily rates.
			allRatesData[item.date] = item.all_rate_restrictions;
			var rates;

			if (!that.fetchingRooms) {
				rates = 'rates';
			} else {
				rates = 'room_types';
			}
			// Adjusting Daily Rate Data - we require rows of colums - not the other way.
			for (var ri in item[rates]) {
				var rate = item[rates][ri];

				if (that.fetchingRooms) {
					rate.name = rate.room_type.name;
					rate.id = rate.room_type.id;
					rate.is_hourly = false;
					rate.is_child = false;
					rate.is_suppress_rate_on = false;
				}
				// Check if this rate is already pushed.
				var rateData = null;

				for (var i in dailyRatesData) {
					if (dailyRatesData[i].id === rate.id) {
						rateData = dailyRatesData[i];
					}
				}

				if (rateData === null) {
					rateData = {
						id: rate.id,
						name: rate.name,
						isHourly: rate.is_hourly
					};
					dailyRatesData.push(rateData);
				}
				rateData[item.date] = rate.restrictions;
			}
		});
		calendarData.dates = datesList;
		calendarData.all_rates = allRatesData;
		calendarData.data = dailyRatesData;
		// close all/open all restriction status
		var enableDisableCloseAll = that.getCloseAllEnableDisableStatus(calendarData.data, "RATE_TYPE");

		calendarData.disableCloseAllBtn = !enableDisableCloseAll.enableCloseAll;
		calendarData.disableOpenAllBtn = !enableDisableCloseAll.enableOpenAll;

		return calendarData;
	};

	// compute the closeall/openall restriction status beased on the total number of
	// closed restrictions in the all_rates/all_restrictions section
	that.getCloseAllEnableDisableStatus = function (rateData, type) {
		// Check if CLOSE ALL restriction is available in all_rates section
		var closedRestrictionId = -1,
		    dict = {};

		dict.enableOpenAll = false;
		dict.enableCloseAll = false;

		// Get the id for 'CLOSED' restriction
		for (var i in that.allRestrictionTypes) {
			if (that.allRestrictionTypes[i].value === 'CLOSED') {
				closedRestrictionId = that.allRestrictionTypes[i].id;
				break;
			}
		}

		// Iterate through each calendar cell to find if 'CLOSED' restricion is available
		for (var i in rateData) {
			var rate = rateData[i];
			var isDate = false;

			for (var date in rate) {

				// Ignore keys other date object
				if (date === "id" || date === "name" || date === 'is_hourly' || date === 'isHourly') {
					continue;
				}

				// Ignore keys other date object


				// We don't want to check the history dates
				if (new Date(date).getTime() < new Date(that.businessDate).getTime()) {
					continue;
				}

				var item = rate[date];

				if (type === "ROOM_TYPE") {
					var item = rate[date].restrictions;
				}
				// If the 'CLOSED' restriction is available in any of the cell, the openall button is enabled
				// If 'CLOSED' restriction is absent in any cell, close all button is enabled
				var isDateClosed = false;

				for (var j in item) {
					if (item[j].restriction_type_id === closedRestrictionId) {
						dict.enableOpenAll = true;
						isDateClosed = true;
						break;
					}
				}
				if (isDateClosed === false) {
					dict.enableCloseAll = true;
				}
			}
		}
		return dict;
	};

	this.getRestrictionUIElements = function (restriction_type) {
		var restriction_type_updated = {};
		// TODO: Add UI condition checks using "restrVal"

		restriction_type_updated.icon = "";
		// (CICO-9555
		restriction_type_updated.hideOnHourly = false;
		// CICO-9555)
		if ('CLOSED' === restriction_type.value) {
			restriction_type_updated.icon = "icon-cross";
		}
		if ('CLOSED_ARRIVAL' === restriction_type.value) {
			restriction_type_updated.icon = "icon-block";
		}
		restriction_type_updated.background_class = "";
		if (['CLOSED', 'CLOSED_ARRIVAL', 'CLOSED_DEPARTURE'].indexOf(restriction_type.value) >= 0) {
			restriction_type_updated.background_class = "bg-red";
		}
		if ('MIN_STAY_LENGTH' === restriction_type.value) {
			restriction_type_updated.background_class = "bg-blue";
			if (that.hasAnyHourlyRate) {
				restriction_type_updated.hideOnHourly = true; // CICO-9555
			}
		}
		if ('MAX_STAY_LENGTH' === restriction_type.value) {
			if (that.hasAnyHourlyRate) {
				restriction_type_updated.hideOnHourly = true; // CICO-9555
			}
		}
		if ('MIN_ADV_BOOKING' === restriction_type.value) {
			restriction_type_updated.background_class = "bg-green";
		}
		if ('MIN_STAY_THROUGH' === restriction_type.value) {
			restriction_type_updated.background_class = "bg-violet";
			if (that.hasAnyHourlyRate) {
				restriction_type_updated.hideOnHourly = true; // CICO-9555
			}
		}
		restriction_type_updated.id = restriction_type.id;
		restriction_type_updated.description = restriction_type.description;
		restriction_type_updated.value = restriction_type.value;
		restriction_type_updated.activated = restriction_type.activated;
		restriction_type_updated.editable = restriction_type.editable;

		return restriction_type_updated;
	};
}]);