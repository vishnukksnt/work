'use strict';

var RateManagerActivityIndicatorComponent = function RateManagerActivityIndicatorComponent(_ref) {
	var showLoader = _ref.showLoader;
	return React.createElement(
		'div',
		{ style: { display: showLoader ? 'block' : 'none' }, id: 'loading' },
		React.createElement('div', { id: 'loading-spinner' })
	);
};