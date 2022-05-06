angular.module('sntRover').service('rvUtilSrv', ['$filter', '$rootScope', function($filter, $rootScope) {

		var self = this;
		/**
		 * utility function to take deep copy of an object
		 * @param  {Object} 	obj - Source Object
		 * @return {Object}     Deep copied object
		 */

		var daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

		this.deepCopy = function(obj) {
			return (JSON.parse (JSON.stringify (obj)));
		};

		/**
		 * util function that converts a null value to a desired string.
		 * if no replace value is passed, it returns an empty string
		 * @param  {String} value       [description]
		 * @param  {String} replaceWith [description]
		 * @return {String}             [description]
		 */
		this.escapeNull = function(value, replaceWith) {
	  		var newValue = "";

	  		if ((typeof replaceWith !== "undefined") && (replaceWith !== null)) {
	  			newValue = replaceWith;
	  		}
            var valueToReturn = ((value === null || typeof value === 'undefined' ) ? newValue : value);

	  		return valueToReturn;
		};

		/**
		* util function to check whether a string is empty
		* @param {String/Object}
		* @return {boolean}
		*/
		this.isEmpty = function(string) {
			if (typeof string === "number") {
				string = string.toString();
			}
			return (this.escapeNull(string).trim() === '');
		};

		/**
		* function to stringify a string
		* sample use case:- directive higlight filter
		* sometimes through error parsing speial charactes
		* @param {String}
		* @return {String}
		*/
		this.stringify = function(string) {
			return JSON.stringify (string);
		};

		/**
		* function to get List of dates between two dates
		* param1 {Date Object}
		* param2 {Date Object}
		* return Array of Date Objects
		*/
		this.getDatesBetweenTwoDates = function(fromDate, toDate) {
		    var datesBetween = [];

		    while (fromDate <= toDate) {
		        datesBetween.push(new Date(fromDate));
		        fromDate.setDate(fromDate.getDate() + 1);
		    }

		    return datesBetween;
		};

        /**
        * Get an array of date string belonging to a date range
        * sample use case:- group rooms report        *
        * @param1 {Date Object}
        * @param2 {Date Object}
        * @return Array of Date strings
        */
        this.getFormattedDatesBetweenTwoDates = function(fromDate, toDate) {
            var datesBetween = [],
                dateFrom = new Date(fromDate);

            while (dateFrom <= toDate) {
                datesBetween.push($filter('date')(dateFrom, 'yyyy-MM-dd'));
                dateFrom.setDate(dateFrom.getDate() + 1);
            }

            return datesBetween;
        };

        /**
        * Get an array of days belonging to a date range
        * sample use case:- group rooms report        *
        * @param1 {Date Object}
        * @param2 {Date Object}
        * @return Array of days
        */
        this.getDayBetweenTwoDates = function(fromDate, toDate) {
            var dayBetween = [],
                dateFrom = new Date(fromDate);

            while (dateFrom <= toDate) {
                dayBetween.push(dateFrom.getDate());
                dateFrom.setDate(dateFrom.getDate() + 1);
            }

            return dayBetween;
        };

        // Get month from a date string
        this.getMonthFromDateString = function(dateString) {
            return (new Date(dateString).getMonth());
        };

		/**
		 * to get the millisecond value against a date/date string
		 * @param  {Object/String} Date Obejct Or dateString [description]
		 * @return {String}            [millisecond]
		 */
		this.toMilliSecond = function(date_) {
			var type_ 	= typeof date_,
				ms 		= '';

			switch (type_) {
				case 'string':
					ms = (new tzIndependentDate(date_));
					break;
				case 'object':
					ms = date_.getTime();
					break;
			}
			return ms;
		};

		/**
		 * to add one day against a date
		 * @param  {Object/String} Date Obejct Or dateString [description]
		 * @return {String}            [millisecond]
		 */
		this.addOneDay = function(date_) {
			return (this.toMilliSecond (date_) + (24 * 3600 * 1000));
		};

		/**
		 * utility function to get key value from an array having number of other. key values
		 * @param  {array} array      	[source array to process]
		 * @param  {array} wantedKeys 	[array of keys that we wanted to extract from array]
		 * @return {array}            	[array with key values we wanted]
		 */
		this.getListOfKeyValuesFromAnArray = function(array, wantedKeys) {
			var arrayToReturn = [], eachItemToAdd;

			_.each(array, function(arrayIndexElement) {
				eachItemToAdd = {};

				_.each(wantedKeys, function(key) {
					eachItemToAdd[key] = arrayIndexElement[key];
				});
				arrayToReturn.push (eachItemToAdd);
			});

			return arrayToReturn;
		};

		/**
		 * to check whether a string is a number or not
		 * @param {Integer/String}
		 * @return {Boolean}
		 */
    	this.isNumeric = function(string) {
    		return !jQuery.isArray( string ) && (string - parseFloat( string ) + 1) >= 0;
    	};

    	/**
    	* to convert a number to a string
    	* @param {String} - string to be converted
    	* @param {Integer} - if passed string is not a number, what should be retuned
    	* @return {Integer}
    	*/
    	this.convertToInteger = function(string, withWhatToBeReplacedifNotANumber) {
    		withWhatToBeReplacedifNotANumber = withWhatToBeReplacedifNotANumber ? withWhatToBeReplacedifNotANumber : 0;
            if (self.isNumeric(string)) {
                return parseInt(string);
            }
    		return withWhatToBeReplacedifNotANumber;
    	};

    	/**
    	* to convert a number to a string
    	* @param {String} - string to be converted
    	* @param {Double} - if passed string is not a number, what should be retuned
    	* @return {Double}
    	*/
    	this.convertToDouble = function(string, withWhatToBeReplacedifNotANumber) {
    		withWhatToBeReplacedifNotANumber = withWhatToBeReplacedifNotANumber ? withWhatToBeReplacedifNotANumber : 0;
            if (self.isNumeric(string)) {
                return parseFloat(string);
            }
    		return withWhatToBeReplacedifNotANumber;
    	};

    	/**
    	 * to get date string from a date picker object
    	 * @param  {Object} date_picker_object
    	 * @param  {String} seperator   default will be /
    	 * @return {String}             date string
    	 */
		this.get_date_from_date_picker = function (date_picker, seperator) {
    		if (typeof seperator === "undefined") {
    			seperator = "/";
    		}
    		return (date_picker.selectedYear + seperator + (date_picker.selectedMonth + 1) + seperator
    				+ date_picker.selectedDay);
    	};


		/**
		 * @param date {date object}
		 * @return {dateObject}
		 */
		this.getFirstDayOfNextMonth = function(date) {
			var date = new tzIndependentDate(date),
				y = date.getFullYear(),
				m = date.getMonth();

			return (tzIndependentDate(new Date(y, m + 1, 1)));
		};

		/**
		 * to get the list for time selector like 1:00 AM, 1:15 AM, 1:30 AM..
		 * @param  {Integer} - interval in minutes - default 15 min
		 * @param  {String} - 24/12 hour mode - default 12 hour mode
		 * @return {Array of Objects}
		 */
		this.getListForTimeSelector = function(interval, mode) {
			// TODO: Add Date and check for DST
			var listOfTimeSelectors = [],
				i 		= 0,
				hours 	= 0,
				minutes = 0,
				ampm 	= null,
				value 	= '',
				text 	= '';

			// setting the defaults
			if (_.isUndefined (mode)) {
				mode = 12;
			}
			if (_.isUndefined (interval)) {
				interval = 15;
			}

			for (; i < 1440; i += interval) {
		        hours 	= Math.floor(i / 60);

		        minutes = i % 60;
		        if (minutes < 10) {
		            minutes = '0' + minutes; // adding leading zero
		        }

		        ampm 	= hours % 24 < 12 ? 'AM' : 'PM';

		        value 	= ((hours < 10) ? ("0" + hours) : hours) + ':' + minutes;

				hours 	= hours % mode;
		        if ((hours === 0 && mode === 12) || (hours === 0 && mode === 24 && i <= 60)) {
		            hours = 12;
		        }

		        text = hours + ':' + minutes;

		        // is 12 hour mode enabled
		        if (mode === 12) {
					text 	+= ' ' + ampm;
		        }

		        listOfTimeSelectors.push ({
					value: value,
					text: text
				});
		    }


		    return listOfTimeSelectors;
		};

		/** Method to check if the web app is accessed from a device */
		this.checkDevice = {
			any: function() {
				return !!navigator.userAgent.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i);
			},
			iOS: function() {
				return !!navigator.userAgent.match(/iPhone|iPad|iPod/i);
			},
			android: function() {
        		return navigator.userAgent.match(/Android/i);
    		}
		};

        /**
         * This method returns the next time quarter to the input hours and minutes
         * in hh:mm format
         * @param hours INTEGER
         * @param minutes INTEGER
         * @returns {string}
         */
        this.roundToNextQuarter = function(hours, minutes) {
                var roundedHours =  (minutes > 45 ? ++hours % 24 : hours).toString(),
                    roundedMins = ((((minutes + 14) / 15 | 0) * 15) % 60).toString();

                return (roundedHours.length === 2 ? roundedHours : "0" + roundedHours ) +
                    ":" +
                    (roundedMins.length === 2 ? roundedMins : "0" + roundedMins);
            };

		this.isEmailValid = function(email) {
			email = (_.isUndefined(email) || _.isNull(email)) ? '' : email;
			email = email.replace(/\s+/g, '');
			return (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,6})+$/.test(email));
		};

		this.retrieveFeatureDetails = function(feature_list, feature_name) {
			var feature = _.find(feature_list, function(feature) {
				return feature.feature_name === feature_name;
			});

			return feature;
		};

		/*
         *  Utility method to Generate Time Duration List.
         *  @param {string | null} [optional] - [minArrivalTime] 
         *  @param {string | null} [optional] - [maxDepartureTime]
         *  @param {Number | null} [optional] - [offset value - 15m]
         *  @return {Array} - [List of time objects having 12hr and 24hr formats]
		 *
         *  generateTimeDuration(null, '1:00')  => 
         *	[{"12":"12:00 AM","24":"00:00"},{"12":"12:15 AM","24":"00:15"},{"12":"12:30 AM","24":"00:30"},{"12":"12:45 AM","24":"00:45"},{"12":"01:00 AM","24":"01:00"}]
         *	
         *  generateTimeDuration('1:00','2:00') =>
         *	[{"12":"01:00 AM","24":"01:00"},{"12":"01:15 AM","24":"01:15"},{"12":"01:30 AM","24":"01:30"},{"12":"01:45 AM","24":"01:45"},{"12":"02:00 AM","24":"02:00"}]
         *
         *	generateTimeDuration('23:00', null) =>
         *	[{"12":"11:00 PM","24":"23:00"},{"12":"11:15 PM","24":"23:15"},{"12":"11:30 PM","24":"23:30"},{"12":"11:45 PM","24":"23:45"}]
         *	
         *	generateTimeDuration() => Full list will return.
         */
        this.generateTimeDuration = function( minArrivalTime, maxDepartureTime, offset ) {
            var timeInterval = 15, // minutes interval
                startTime = 0, // start time
                endTime = (24 * 60) - timeInterval, // end time
                ap = ['AM', 'PM'], // AM-PM

                times = [], // time array - output array
                twelveHrFormat = '',
                twentyFourHrFormat = '',
                hh = '',
                mm = '',
                obj = {},
                offset = offset || 0;

            if (minArrivalTime) {
                startTime = minArrivalTime.split(':')[0] * 60 + minArrivalTime.split(':')[1] * 1 + offset * 1;
            }
            if (maxDepartureTime) {
                endTime = maxDepartureTime.split(':')[0] * 60 + maxDepartureTime.split(':')[1] * 1 + offset * 1;
            }

            // loop to increment the time and push results in times array
            for (var i = 0; startTime <= endTime; i++) {
				hh = Math.floor(startTime / 60); // getting hours of day in 0-24 format
				mm = (startTime % 60); // getting minutes of the hour in 0-55 format
				twelveHrFormat = (("0" + hh % 12).slice(-2) === '00' ? '12' : ("0" + hh % 12).slice(-2)) + ':' + ("0" + mm).slice(-2) + " " + ap[Math.floor(hh / 12)]; // data in [12:00 AM- 12:00 PM format]
				twentyFourHrFormat = ("0" + hh).slice(-2) + ':' + ("0" + mm).slice(-2); // data in [00:00 - 24:00 format]
				obj = {
					"12": twelveHrFormat,
					"24": twentyFourHrFormat
				};
				times.push(obj);
				startTime = startTime + timeInterval;
            }

            return times;
        };

        // Utility method to extract hh, mm, ampm details from a time in 12hr (hh:mm ampm) format
        /*
		 *	extractHhMmAmPm('11:00') => {ampm: "AM", hh: "11", mm: "00"}
		 *	
		 *	extractHhMmAmPm('15:30') => {ampm: "PM", hh: "03", mm: "30"}
		 *	
		 *	extractHhMmAmPm('20:15') => {ampm: "PM", hh: "08", mm: "15"}
		 *	
		 *	extractHhMmAmPm('01:45') => {ampm: "AM", hh: "01", mm: "45"}
		 *	
        */
        this.extractHhMmAmPm = function( time ) {
        	var hh = parseInt(time.split(' ')[0].split(':')[0]),
        		ampm = hh >= 12 ? 'PM' : 'AM';

        	return {
                'ampm': ampm,
                'hh': (("0" + hh % 12).slice(-2) === '00' ? '12' : ("0" + hh % 12).slice(-2)),
                'mm': time.split(' ')[0].split(':')[1]
            };
        };

        /*
         *  @param {Object} [time in hh, mm, ampm as an object ]
         *  @return {String} [24 hr format data]
         *
         */
        this.convertTimeHhMmAmPmTo24 = function( timeHhMmAmPm ) {
            var hours = timeHhMmAmPm.hh,
                minutes = timeHhMmAmPm.mm,
                modifier = timeHhMmAmPm.ampm;

            if (hours === '12') {
                hours = '00';
            }

            if (modifier === 'PM') {
                hours = parseInt(hours, 10) + 12;
            }
            return hours + ':' + minutes;
        };

        /*
         *  Get diary modes from config.
         *  @param {Object} [hotelDiaryConfig]
         *  @return {String}
         */
        this.getDiaryMode = function() {
            var diaryMode = 'FULL',
                hotelDiaryConfig = $rootScope.hotelDiaryConfig;

            if (!hotelDiaryConfig.hourlyRatesForDayUseEnabled) {
                diaryMode = 'NIGHTLY';
            }
            else if (hotelDiaryConfig.mode === 'LIMITED') {
                diaryMode = 'DAYUSE';
            }
            return diaryMode;
        };

        /*
		 * util function to check whether weekend day
		 * @param1 {array} weekendDays
		 * @param2 {Date Object} date
		 * @return {boolean}
		*/
        this.isWeekendDay = function(weekendDays, date) {
			return _.contains(weekendDays, daysOfWeek[date.getDay()]);
		};

		this.countryFlagLangMap = {
			'EN': 'us',
			'ES': 'es',
			'DE': 'de',
			'NL': 'nl',
			'FR': 'fr',
			'IT': 'it'
		};

		this.translatableLangs = ['EN', 'ES', 'FR'];

		this.langNameTranslations = {
			'EN': 'English',
			'DE': 'Deutsch',
			'FR': 'Français',
			'ES': 'Español',
			'JA': '日本',
			'ZH': '中国人',
			'NL': 'Nederlands',
			'IT': 'Italiano',
			'FI': 'Suomalainen',
			'SV': 'Svenska',
			'NN': 'Norsk',
			'DA': 'Dansk',
			'IS': 'Íslensku',
			'TR': 'Türk',
			'AR': 'عربي',
			'PT': 'Português',
			'PL': 'Polskie',
			'HU': 'Magyar',
			'BG': 'български',
			'TL': 'Tagalog',
			'CS': 'Čeština',
			'SK': 'Slovensky',
			'ET': 'Eestlane',
			'RO': 'Română',
			'UK': 'Українська',
			'SL': 'Slovenščina',
			'HR': 'Hrvatski',
			'SR': 'Српски',
			'EL': 'Ελληνικά',
			'TH': 'ไทย',
			'YUE': '粵語',
			'CMN': '普通话',
			'ID': 'Indonesia',
			'VI': 'Tiếng Việt',
			'KO': '한국인',
			'HI': 'हिंदी',
			'RU': 'Pусский',
			'LV': 'Latvietis',
			"MS": 'Melayu'
		};
}]);
