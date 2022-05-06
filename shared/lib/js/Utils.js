
// Function to remove unwanted key elements from hash.
var dclone = function(object, unwanted_keys){

    if(typeof unwanted_keys === "undefined"){
        unwanted_keys = [];
    }
    if(object === "undefined"){
        return object;
    } else {
            var newObject = JSON.parse(JSON.stringify(object));
            for(var i=0; i < unwanted_keys.length; i++){
                delete newObject[unwanted_keys[i]];
            }
    }

    return newObject;
};

Date.prototype.stdTimezoneOffset = function() {
    var jan = new Date(this.getFullYear(), 0, 1);
    var jul = new Date(this.getFullYear(), 6, 1);
    return Math.max(Math.abs(jan.getTimezoneOffset()), Math.abs(jul.getTimezoneOffset()));
};


Date.prototype.isOnDST = function() {
    return this.getTimezoneOffset() < this.stdTimezoneOffset();
};

Date.prototype.getDSTDifference = function() {
    var firstMonth, lastMonth, firstMonthOffset, lastMonthOffset, dstDiff;
    if(this.getMonth() >= 0 && this.getMonth() <= 6){
        firstMonth = 0;
        lastMonth  = 6;
    }
    else if(this.getMonth() >6 && this.getMonth() <= 11){
        firstMonth = 7;
        lastMonth  = 11;
    }
    firstMonth = new Date(this.getFullYear(), firstMonth, 1);
    firstMonthOffset = firstMonth.getTimezoneOffset();
    lastMonth = new Date(this.getFullYear(), lastMonth, 1);
    lastMonthOffset = lastMonth.getTimezoneOffset();
    dstDiff = (firstMonthOffset - lastMonthOffset);
    return dstDiff;
};

/**
* A public method to check if a value falls in a set of values.
* @param {string/integer} is the value to be checked
* @param {array} is the set of values to be evaluated
*/
var isAnyMatch = function(val, arr){
    var ret = false;
    for(var i=0, j= arr.length ; i<j ; i++) {
        if(arr[i] === val){
            ret = true;
            break;
        }
    }
    return ret;
};

/**
* A public method to check if the given object is empty.
* @param {object} is the object to be checked
*/
function isEmpty(obj) {
    return _.isEmpty(obj);
}

/**
* A public method to check if the given object is empty (it is recommended over the above one).
* @param {object} is the object to be checked
*/
function isEmptyObject(obj) {
    for(var key in obj) {
        return false;
    }
    return true;
}


/**
*   In case of a click or an event occured on child elements
*   of actual targeted element, we need to change it as the event on parent element
*   @param {event} is the actual event
*   @param {selector} is the selector which we want to check against that event
*   @return {Boolean} trueif the event occured on selector or it's child elements
*   @return {Boolean} false if not
*/
function getParentWithSelector($event, selector) {
    var obj = $event.target, matched = selector.contains(obj);
    if(matched){
        $event.target = selector;
    }
    return matched;

};


/**
* utils function to remove null & empty value keys from a dictionary,
* please use deepcopy of that object as parameter to function
*/

function removeNullKeys(dict){
    for(key in dict){
        if(typeof dict[key] == 'undefined' || dict[key] == "" || dict[key] == null){
            console.log('innnnnn');
            delete dict[key];
        }
    }
    return dict;
}


function getDateString(dateObj){
    var yr = dateObj.getFullYear();
    var month = dateObj.getMonth() + 1;
    var monthFormatted = (month < 10) ? ("0"+ month) : month;
    var date = dateObj.getDate();
    var dateFormatted = (date < 10) ? ("0"+ date) : date;

    var dateString = yr + '-' + monthFormatted + '-' + dateFormatted;

    return dateString;
}

function getTimeFormated(hours, minutes, ampm) {
    var time = "";
    hours = parseInt(hours);
    minutes = parseInt(minutes);

    if(ampm == "PM" && hours < 12) hours = hours + 12;
    if(ampm == "AM" && hours == 12) hours = hours - 12;
    var sHours = hours.toString();
    var sMinutes = minutes.toString();
    if(hours < 10) sHours = "0" + sHours;
    if(minutes < 10) sMinutes = "0" + sMinutes;

    var time = sHours + ":" + sMinutes;
    return time;
}

function getDateObj(dateString){
    //TODO: Handle different conditions

    return convertDateToUTC(new Date(dateString));
}

function convertDateToUTC(date) {
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
}

function getCurrencySymbol(currenyCode){
      var symbol = "";
      if(currenyCode == "USD"){
        symbol = "$";
      }
      return symbol;
};

var getMappedRoomStatusColor = function(reservationStatus, roomReadyStatus, foStatus, checkinInspectedOnly) {

    var reservationRoomStatusClass = "";
    if(reservationStatus == 'CHECKING_IN' && roomReadyStatus!=''){

        if(foStatus == 'VACANT'){
            switch(roomReadyStatus) {
                case "INSPECTED":
                    reservationRoomStatusClass = ' room-green';
                    break;
                case "CLEAN":
                    if (checkinInspectedOnly == "true") {
                        reservationRoomStatusClass = ' room-orange';
                        break;
                    } else {
                        reservationRoomStatusClass = ' room-green';
                        break;
                    }
                    break;
                case "PICKUP":
                    reservationRoomStatusClass = " room-orange";
                    break;

                case "DIRTY":
                    reservationRoomStatusClass = " room-red";
                    break;
                default:
                    reservationRoomStatusClass = " ";
                    break;
            }

        } else {
            reservationRoomStatusClass = "room-red";
        }

    }
    return reservationRoomStatusClass;
};

var restrictionCssClasses = {
    "CLOSED" : "red",
    "CLOSED_ARRIVAL" : "red",
    "CLOSED_ARRIVAL_RESTRICTION" : "red",
    "CLOSED_DEPARTURE" : "red",
    "CLOSED_DEPARTURE_RESTRICTION": "red",
    "MIN_STAY_LENGTH" : "blue",
    "MIN_LENGTH_OF_STAY": "blue",
    "MAX_STAY_LENGTH" : "blue-dark",//no need of colors for some restriction -CICO-28657 - check HTML
    "MAX_LENGTH_OF_STAY": "blue-dark",
    "MIN_STAY_THROUGH" : "violet",
    "MIN_ADV_BOOKING" : "green",
    "MIN_ADVANCED_BOOKING": "green",
    "MAX_ADV_BOOKING" : "orange",
    "MAX_ADVANCED_BOOKING": "orange"
};

function getRestrictionClass(restriction) {
    return restrictionCssClasses[restriction] || '';
};

var restrictionIcons = {
    "CLOSED" : "icon-cross",
    "CLOSED_ARRIVAL" : "icon-block",
    "CLOSED_ARRIVAL_RESTRICTION": "icon-block"
};

function getRestrictionIcon(restriction) {
    return restrictionIcons[restriction] || '';
};

var serviceStatus = {
    "IN_SERVICE" : "IN SERVICE",
    "OUT_OF_SERVICE" : "OUT OF SERVICE",
    "OUT_OF_ORDER" : "OUT OF ORDER"
};

function getServiceStatusValue(service_status) {
    return serviceStatus[service_status];
};

var reservationStatusClassesDiary = {
    "RESERVED" : "check-in",
    "CANCELED" : "cancel",
    "CHECKEDIN" : "inhouse",
    "CHECKEDOUT" : "departed",
    "NOSHOW" : "no-show",
    "PRE_CHECKIN" : "pre-check-in",
    "CHECKING_OUT" : "check-out",
    "CHECKING_IN": "check-in"
};

function getReservationStatusClass(status) {
    return reservationStatusClassesDiary[status];
};

var avatharImgs = {
    'mr' : 'avatar-male.png',
    'mrs': 'avatar-female.png',
    'ms': 'avatar-female.png',
    'miss': 'avatar-female.png',
    '': 'avatar-trans.png',
};

function getAvatharUrl(title) {
    //function to get avathar image url by giving title
    title = $.trim(title).toLowerCase().split('.')[0];
    try{
        if((title == "mr") || (title == "mrs") || (title == "miss")|| (title == "ms"))
            return ('/ui/pms-ui/images/' + avatharImgs[title]);
        else
            return ('/ui/pms-ui/images/' + avatharImgs['']);
    }
    catch (e) {
        console.log(e.message);
        // TODO: handle exception
    }
}

var creditCardTypes = {
      "AMEX": 'AX',
      "DINERS_CLUB": 'DC',
      "DISCOVER": 'DS',
      "JCB": 'JCB',
      "MASTERCARD": 'MC',
      "VISA": 'VA'
};

function getCreditCardType(cardBrand) {
    var card = (typeof cardBrand  ==="undefined") ? "":cardBrand.toUpperCase();
    var cardArray = ['AX','DC','DS','JCB','MC','VA'];
    return (cardArray.indexOf(card) != -1 ) ? card : (typeof creditCardTypes[card]!='undefined') ? creditCardTypes[card] : 'credit-card';
}


var sixCreditCardTypes = {
      "AX": 'AX',
      "DI": 'DS',
      "DN": 'DC',
      "JC": 'JCB',
      "MC": 'MC',
      "VS": 'VA',
      "VX": 'VA',
      "MX": 'DS',//Six iframe reurns MX for discover. not good,
      "MV": 'MC'
};

function getSixCreditCardType(cardCode) {
    var card = cardCode.toUpperCase();
    return ( !!sixCreditCardTypes[card] ? sixCreditCardTypes[card] : card );
}

/**
* utils function convert any number to number with two decimal points.
*/
function precisionTwo(value) {
    var parsed = value === '' || value === null || typeof value === 'undefined' ? '': parseFloat(value).toFixed(2);
    return parsed;
}

/*
 * Please use this to get create date for a dayString.
 */
tzIndependentDate = function(st) {
    var d = new Date(st);
    var r = d.getTime();

    if ( (d.getHours() != 0) || (d.getMinutes() != 0) ) {
        r += d.getTimezoneOffset() * 60 * 1000;
    }

    if ( d.getTimezoneOffset() < 0 ) {
        r -= d.getTimezoneOffset() * 60 * 1000;
    }

    var adjustedDate = new Date(r)

    if(adjustedDate.isOnDST()){
        return new Date(r += Math.abs(d.getDSTDifference()) * 60 * 1000);
    }

    return adjustedDate;
};


//To add n days to the current date
Date.prototype.addDays = function(days) {
   var dat = new Date(this.valueOf());
   dat.setDate(dat.getDate() + days);
   return dat;
};

/**
* A public method to check if the given object is empty (it is recommended over the above one).
* @param {object} is the object to be checked
*/
function isEmptyObject(obj) {
    for(var key in obj) {
        return false;
    }
    return true;
}

/** Returns a deep copy of the date object**/
Date.prototype.clone = function() {
    return new Date(this.getTime());
};

/**
* function to get List of dates between two dates
* param1 {Date Object}
* param2 {Date Object}
* return Array of Date Objects
*/
var getDatesBetweenTwoDates = function(fromDate, toDate) {
    var datesBetween = [];

    while(fromDate <= toDate){
        datesBetween.push(new Date(fromDate));
        fromDate.setDate(fromDate.getDate() + 1);
    }

    return datesBetween;
}


function getWeekDayName(dayIndexInWeek, minLetterCount) {
    if(typeof minLetterCount === 'undefined'){
        minLetterCount = 0;
    }
    var weekday = new Array(7);
    weekday[0]=  "Sunday";
    weekday[1] = "Monday";
    weekday[2] = "Tuesday";
    weekday[3] = "Wednesday";
    weekday[4] = "Thursday";
    weekday[5] = "Friday";
    weekday[6] = "Saturday";

    var n = weekday[dayIndexInWeek];
    return n.substr(0, minLetterCount);
}

function getTextWidth(text) {
        // create a dummy span, we'll use this to measure text.
        var tester = $('<span>'),

          // get the computed style of the input
         elemStyle = window.document.defaultView
          .getComputedStyle(tester[0], '');

        // apply any styling that affects the font to the tester span.
        tester.css({
          'font-family': elemStyle.fontFamily,
          'line-height': elemStyle.lineHeight,
          'font-size': elemStyle.fontSize,
          'font-weight': elemStyle.fontWeight,
          'width': 'auto',
          'position': 'absolute',
          'top': '-99999px',
          'left': '-99999px'
        });

        // put the tester next to the input temporarily.
        $('body').append(tester);

        // update the text of the tester span
        tester.text(text);

        // measure!
        var r = tester[0].getBoundingClientRect();

        var w = r.width;

        // remove the tester.
        tester.remove();
        return w;
}
/*
 * Function to get the number of days between two days
 * firstDate{date object} will be the first data
 * Second date{date object} will be the second date
 */
var getNumberOfDaysBetweenTwoDates = function(firstDate, secondDate) {
    var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    //Get the number of days between initial day of diary grid and arrival date
    var noOfDaysBtwFirstDateAndSecondDate = Math.abs((secondDate.getTime() - firstDate.getTime()) / (oneDay));
    return noOfDaysBtwFirstDateAndSecondDate

};

//function that converts a null value to a desired string.
//if no replace value is passed, it returns an empty string
var escapeNull = function(value, replaceWith) {
    var newValue = "";
    if((typeof replaceWith != "undefined") && (replaceWith != null)){
        newValue = replaceWith;
    }
    var valueToReturn = ((value == null || typeof value == 'undefined' ) ? newValue : value);
    return valueToReturn;
};

var DateFormatInfoMappings = {

    'MM-DD-YYYY': ['MM-dd-yyyy','mm-dd-yy'],
    'MM/DD/YYYY': ['MM/dd/yyyy','mm/dd/yy'],
    'DD-MM-YYYY': ['dd-MM-yyyy','dd-mm-yy'],
    'DD/MM/YYYY': ['dd/MM/yyyy','dd/mm/yy']

};

var getDateFormat = function(dateFormat) {

    if(typeof dateFormat === 'undefined'){
        return DateFormatInfoMappings['MM-DD-YYYY'][0];
    }
    else{
        return DateFormatInfoMappings[dateFormat][0];
    }
};

var getJqDateFormat = function(dateFormat) {
    if(typeof dateFormat === 'undefined'){
        return DateFormatInfoMappings['MM-DD-YYYY'][1];
    }
    else{
        return DateFormatInfoMappings[dateFormat][1];
    }
};

/**
 * Convert 24hr format into 12hr (am/pm) format.
 * @param {string} time string in format 'HH:MM' may contain blanks
 * @returns {object} converted time array
 */
var tConvert = function(time) {
	if(time == '' || time == undefined){
		return {};
	}
    tDict = {};
    var t = time.match(/[0-9]+/g);  // can also handle HH:MM AM as input and blank spaces
    tDict.hh = (t[0] >= 12) ? (t[0] - 12) : t[0];
    tDict.hh = tDict.hh == 0 ? 12 : tDict.hh;
    tDict.mm = t[1];
    tDict.ampm = (t[0] >= 12) ? 'PM' : 'AM';

    return tDict;
}
/** Convert 12hr format to 24 hr format **/
var tConvertToAPIFormat = function(hh, mm, ampm){
	var time = "";
	if(parseInt(mm) < 10){
		mm = '0' + parseInt(mm);
	}
	if(ampm == "PM"){
		time = ( parseInt(hh) + 12) + ":" + mm;
	} else {
		time = (parseInt(hh) == 12 ? '00': hh) + ":" + mm;
	}

	return time;

}

//retrieve month name from index
function getMonthName(monthIndex){
    var monthName = new Array(12);
    monthName[0]=  "January";
    monthName[1] = "February";
    monthName[2] = "March";
    monthName[3] = "April";
    monthName[4] = "May";
    monthName[5] = "June";
    monthName[6] = "July";
    monthName[7] = "August";
    monthName[8] = "September";
    monthName[9] = "October";
    monthName[10] = "November";
    monthName[11] = "December";
    return monthName[monthIndex];
};
//retrieve card expiry based on paymnet gateway
var retrieveCardExpiryDate = function(isSixPayment,tokenDetails,cardDetails){
    var expiryDate = isSixPayment?
                    tokenDetails.expiry.substring(2, 4)+" / "+tokenDetails.expiry.substring(0, 2):
                    cardDetails.expiryMonth+" / "+cardDetails.expiryYear
                    ;
    return expiryDate;
};

//retrieve card number based on paymnet gateway
var retrieveCardNumber = function(isSixPayment,tokenDetails,cardDetails){
    var cardNumber = isSixPayment?
            tokenDetails.token_no.substr(tokenDetails.token_no.length - 4):
            cardDetails.cardNumber.slice(-4);
    return cardNumber;
};

//retrieve card type based on paymnet gateway
var retrieveCardtype = function(isSixPayment,tokenDetails,cardDetails){
    var cardType = isSixPayment?
                getSixCreditCardType(tokenDetails.card_type).toLowerCase():
                getCreditCardType(cardDetails.cardType).toLowerCase()
                ;
    return cardType;
};


var checkIfReferencetextAvailable = function(paymentTypes,selectedPaymentType){
    var displayReferance = false;
    angular.forEach(paymentTypes, function(value, key) {
        if(value.name == selectedPaymentType){
            displayReferance = (value.is_display_reference)? true:false;
        };
    });
    return displayReferance;
};


var checkIfReferencetextAvailableForCC = function(paymentTypes,selectedPaymentTypeCard){
    var displayReferance = false;
    angular.forEach(paymentTypes, function(paymentType, key) {
        if(paymentType.name == 'CC'){
            angular.forEach(paymentType.values, function(value, key) {
                if(selectedPaymentTypeCard.toUpperCase() === value.cardcode){
                    displayReferance = (value.is_display_reference)? true:false;
                };
            });
        }
    });
    return displayReferance;
};

// Get the length of an object
var getObjectLength = function(obj) {
    return Object.keys(obj).length;
}

// Replace a value with in object with another value
var replaceValueWithinObject = function (obj, findStr, replaceObj ) {

    Object.keys(obj).forEach(function (key) {
        if ( obj[key] != null && typeof obj[key] === 'object') {
            return replaceValueWithinObject(obj[key], findStr, replaceObj);
        } else if (obj[key] === findStr) {
            obj[key] = replaceObj;
        }
    });
};

// Check whether the object has got all key values as empty
var isObjectAllValuesEmpty = function (obj) {
    if (!obj) return obj;
    var emptyKeys = [];

    _.each ( obj, function (value, key) {
        if (value == "") {
            emptyKeys.push(key);
        }
    });
    return ( emptyKeys.length == Object.keys(obj).length );
};
// Convert the given date object to timezone independent date
var getTzIndependentDate = function(dateObj) {   

    var r = dateObj.getTime();

    if ( (dateObj.getHours() != 0) || (dateObj.getMinutes() != 0) ) {
        r += dateObj.getTimezoneOffset() * 60 * 1000;
    }

    if ( dateObj.getTimezoneOffset() < 0 ) {
        r -= dateObj.getTimezoneOffset() * 60 * 1000;
    }

    var adjustedDate = new Date(r)

    if(adjustedDate.isOnDST()){
        return new Date(r += Math.abs(dateObj.getDSTDifference()) * 60 * 1000);
    }

    return adjustedDate;
};
// Get timezone independent date for the given day, month and year
var getTZIndependentDateFromDayMonthYear = function(day, month, year) {
    var d = new Date(year, month-1, day);

    return getTzIndependentDate(d);

};

var isValidEmail = function(email) {
    var  regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    
    return regex.test(email);
};

// Get display password to show in the password form fields
var getTemporaryDisplayPassword = function() {
    // Strong password generated randomly for display purpose only
    return '-R#h!bVsALm-';
};

/**
 * Checks whether the given array is empty or not
 * @param {Array} arr 
 * @return {Boolean}
 */
var isEmptyArray = function (arr) {
    return arr.length === 0;
};

/**
 * Remove the passed keys from the object
 * @param {Object} obj object from which the keys needs to be removed
 * @param {Array} keys arr of keys
 * @return {void}
 */
var removeKeysFromObj = function (obj, keys) {
    for (var i = 0; i < keys.length; i++) {
        delete obj[keys[i]];
    }
};

/**
 * Replace the object properties value with the replace value
 * @param {Object} obj the object whose property value needs to be changed
 * @param {Object|String|number|Null|Undefined} replaceVal can be any value
 * @return {void}
 */
var resetObject = function(obj, replaceVal) {
    for (key in obj) {
        if(obj.hasOwnProperty(key)) {
            obj[key] = replaceVal;
        }
    }
};
var getDateDifferenceInDays = function (initialDate,finalDate) {
    return Math.ceil((finalDate-initialDate)/(1000 * 60 * 60 * 24));
};

var daysInWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
];

var isWeekendDay = function(weekendDays, date) {
    return _.contains(weekendDays, daysInWeek[date.getDay()]);
};

/**
 * Checks the given array is a subset of other
 * @param {Array} arr - main array
 * @param {Array} subArr sub array
 * @return {Boolean}
 */
var isSubsetOf = function(arr, subArr) {
    if (!arr.length) {
        return false;
    }

    var result = arr.every(function(val) {
        return subArr.indexOf(val) >= 0;      
    });

    return result;
}

/**
 * Checks whether one array contains atleast one element from other array
 * @param {Array} arr main array
 * @param {Array} subArr array items to compare
 * @return {Boolean}
 */
var atleastOneMatch = function(arr, subArr) {
    var present  = false;

    for(var i = 0; i < subArr.length; i++) {
        present = arr.indexOf(subArr[i]) > -1;

        if (present) {
            break;
        }
    }

    return present;    
};