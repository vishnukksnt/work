'use strict';

var RateManagerNotConfiguredComponent = function RateManagerNotConfiguredComponent(_ref) {
	var shouldShow = _ref.shouldShow;

	if (!shouldShow) {
		return false;
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
				'Rate Manager not configured'
			),
			React.createElement(
				'span',
				{ className: 'h2' },
				'Please select filter options to begin'
			)
		)
	);
};

var _React = React,
    PropTypes = _React.PropTypes;


RateManagerNotConfiguredComponent.propTypes = {
	shouldShow: PropTypes.bool.isRequired
};