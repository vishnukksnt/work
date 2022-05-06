'use strict';

var RateManagerRootComponent = function RateManagerRootComponent() {
	return React.createElement(
		'div',
		{ className: 'calendar' },
		React.createElement(RateManagerNotConfiguredContainer, null),
		React.createElement(RateManagerNoResultsFoundContainer, null),
		React.createElement(RateManagerActivityIndicatorContainer, null),
		React.createElement(RateManagerGridViewRootContainer, null)
	);
};