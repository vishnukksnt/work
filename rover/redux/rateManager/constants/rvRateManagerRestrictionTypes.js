'use strict';

var RateManagerRestrictionTypes = {
	/*
  restrictionTypeName: {
  	'className': 'className'List,
 	 	'description': 'description',
  	'defaultText': 'defaultText'
  }
 */
	'CLOSED': {
		'className': 'restriction-icon bg-red icon-cross',
		'description': 'Closed',
		'defaultText': '',
		'hasInputField': false
	},
	'CLOSED_ARRIVAL': {
		'className': 'restriction-icon bg-red icon-block',
		'description': 'Closed to Arrival',
		'defaultText': '',
		'hasInputField': false
	},
	'CLOSED_DEPARTURE': {
		'className': 'restriction-icon bg-red',
		'description': 'Closed to Departure',
		'defaultText': '',
		'hasInputField': false
	},
	'MIN_STAY_LENGTH': {
		'className': 'restriction-icon bg-blue',
		'description': 'Min Length of Stay',
		'defaultText': '',
		'hasInputField': true
	},
	'MAX_STAY_LENGTH': {
		'className': 'restriction-icon bg-blue-dark',
		'description': 'Max Length of Stay',
		'defaultText': '',
		'hasInputField': true
	},
	'MIN_STAY_THROUGH': {
		'className': 'restriction-icon bg-violet',
		'description': 'Min Stay Through',
		'defaultText': '',
		'hasInputField': true
	},
	'MIN_ADV_BOOKING': {
		'className': 'restriction-icon bg-green',
		'description': 'Min Advance Booking',
		'defaultText': '',
		'hasInputField': true
	},
	'MAX_ADV_BOOKING': {
		'className': 'restriction-icon bg-orange',
		'description': 'Max Advance Booking',
		'defaultText': '',
		'hasInputField': true
	},
	'MORE_RESTRICTIONS': {
		'className': 'restriction-icon bg-drk R',
		'description': RM_RX_CONST.MAX_RESTRICTION_IN_COLUMN + ' or more Restrictions',
		'defaultText': 'R',
		'hasInputField': true
	}
};