angular.module('sntCurrencyFilter', []).filter('sntCurrency', function() {
	return function(input, scope, customCurrencySymbol, isWithoutSymbol, precision) {

		var DEFAULT_PRECISION = 2;

		if (typeof input !== 'undefined' && scope) {
			// If passing custom currency (eg: rate currency).
			var currencySymbol = customCurrencySymbol ? customCurrencySymbol : scope.currencySymbol,
				precisionValue = precision ? precision : DEFAULT_PRECISION;

			if (isNaN(input) || input === '' || input === null) {
				return currencySymbol;
			}
			// Update the input value based on precision.
			input = parseFloat(input).toFixed(precisionValue);

			var paramObj = {
				input: input,
				symbol: currencySymbol,
				isWithoutSymbol: !!isWithoutSymbol
			};

			switch (scope.currencyFormat) {
				case '1.222,00': 
					// EG : 1234567.89 => 1.234.567,89
					paramObj.integerSeperatorType  = 'DOT';
					paramObj.fractionSeperatorType = 'COMMA';
					break;
				case '1,222.00': 
					// EG : 1234567.89 => 1,234,567.89
					paramObj.integerSeperatorType  = 'COMMA';
					paramObj.fractionSeperatorType = 'DOT';
					break;
				case '1.222':
					// EG : 1234567.89 => 1.234.567 
					paramObj.integerSeperatorType  = 'DOT';
					paramObj.fractionSeperatorType = null;
					break;
				case '1,222': 
					// EG : 1234567.89 => 1,234,567
					paramObj.integerSeperatorType  = 'COMMA';
					paramObj.fractionSeperatorType = null;
					break;
				default:
					// EG : 1234567.89 => 1,234,567.89
					paramObj.integerSeperatorType  = 'COMMA';
					paramObj.fractionSeperatorType = 'DOT';
			}

			return processSntCurrency(paramObj);
		}
	};
});

/**
 * Utility method to reverse a given string value.
 * @param {string} [string input ]
 * @return {string}
 */
function reverseString(str) {
    return str.split("").reverse()
    .join("");
}

// CICO-35453 - Mapping of various Currency Formats.
var CurrencyFormatSeperatorMappings = {
    'COMMA': [',', '1,222,00'],
    'DOT': ['.', '1,222.00']
};

/**
 *  Get seperator type symbol
 *  @param {string}
 *  @return {string}
 */
var getSeperatorType = function(seperator) {
    return (seperator === null) ? '' : CurrencyFormatSeperatorMappings[seperator][0];
};

/**
 *	process integer array to append with seperator type
 *	@param {Array} - Array of string as integer part
 *	@param {string} - seperatort type
 *	@return {string} - amount appended by sepeartor.
 */
var processIntegerPart = function( integerPart, seperatorType ) {
	var i = 0, j = 0, data = '';

	// Eg : integerPart => [ '1234567' ] and let seperatorType => ','.
	for ( i = integerPart.length - 1, j = 0 ; i >= 0; i --, j ++ ) {
		if (j % 3 === 0 && j > 2 && integerPart[i] !== '-') {
			data = data + getSeperatorType(seperatorType) + integerPart[i];
		}
		else {
			data = data + integerPart[i];
		}
	}

	// After the above process data => '765,432,1'
	// Then reversing the resultant data to get actual result => '1,234,567'
	data = reverseString(data);
	return data;
};

/**
 *	Method to process currency data.
 *	@param {object} [input data contains input, symbol, isWithoutSymbol]
 */
function processSntCurrency( paramObj ) {

	var inputArray = [],
		integerPart = null, fractionPart = null,
		processData = '', sntCurrency = '';

	/**
	 *	STEP-1 : Splitting the given input value (type {string}) into two pieces - Integer part & Fractional part,
	 * 	Eg : '1234567.89' =>  [ '1234567', '89' ]
	 */
	inputArray = paramObj.input.split('.');

	if (inputArray.length > 1) {
		integerPart    = inputArray[0];
		fractionPart = inputArray[1];
	}
	else {
		integerPart  = inputArray[0];
	}

	// STEP-2 : Process Interger part and add appropriate seperator type.
	// Eg : processIntegerPart( ['1234567'], ',') => '1,234,567'
	processData = processIntegerPart(integerPart, paramObj.integerSeperatorType);

	if ( fractionPart !== null && paramObj.fractionSeperatorType !== null) {
		// STEP-3 : Appending central seperator and fractional part.
		// Eg : '1,234,567' + '.' + '89' => '1,234,567.89'
		processData = processData + getSeperatorType(paramObj.fractionSeperatorType) + fractionPart;
	}

	// STEP-4 : Append currency symbol based on isWithoutSymbol flag.
	if (paramObj.isWithoutSymbol) {
		sntCurrency = processData;
	}
	else {
		sntCurrency = '<span class="currency">' + paramObj.symbol + '</span> ' + processData;
	}

	return sntCurrency;
}
