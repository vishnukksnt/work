'use strict';

var RateManagerCellsRateComponent = function RateManagerCellsRateComponent(_ref) {
	var amount = _ref.amount;
	return React.createElement(
		'span',
		{ className: 'rate-single' },
		amount ? React.createElement(
			'span',
			{ className: 'rate-single-text' },
			'From'
		) : '',
		amount
	);
};