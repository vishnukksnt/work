'use strict';

var RateManagerNoResultsFoundComponent = function RateManagerNoResultsFoundComponent(_ref) {
	var shouldShow = _ref.shouldShow;

	if (!shouldShow) {
		return React.createElement('noscript', null);
	}

	return React.createElement(
		'div',
		{ id: 'rate-manager-not-configured', className: 'no-content' },
		React.createElement(
			'div',
			{ className: 'info' },
			React.createElement('span', { className: 'icon-no-content icon-rates' }),
			React.createElement(
				'strong',
				{ className: 'h1' },
				'No Results'
			),
			React.createElement(
				'span',
				{ className: 'h2' },
				'Please change the selected filters and try again'
			)
		)
	);
};

var _React = React,
    PropTypes = _React.PropTypes;


RateManagerNoResultsFoundComponent.propTypes = {
	shouldShow: PropTypes.bool.isRequired
};