'use strict';

var RateManagerGridRightSideBottomComponent = function RateManagerGridRightSideBottomComponent(_ref) {
	var hierarchyRestrictionClass = _ref.hierarchyRestrictionClass;
	return React.createElement(
		'div',
		{ id: 'rateViewCalendar', className: 'calendar-rate-table calendar-rate-table-grid scrollable ' + hierarchyRestrictionClass },
		React.createElement(
			'div',
			{ className: 'wrapper' },
			React.createElement(
				'table',
				{ className: 'rate-calendar' },
				React.createElement(RateManagerGridRightSideRowsContainer, null)
			)
		)
	);
};