'use strict';

var RateManagerGridLeftSideComponent = function RateManagerGridLeftSideComponent(_ref) {
	var hierarchyCount = _ref.hierarchyCount,
	    hierarchyClass = _ref.hierarchyClass,
	    panelToggleClass = _ref.panelToggleClass,
	    mode = _ref.mode;
	return React.createElement(
		'div',
		{ className: 'pinnedLeft ' + panelToggleClass + hierarchyClass },
		React.createElement(RateManagerGridLeftSideHeadButtonContainer, null),
		hierarchyCount !== 0 && React.createElement(RateManagerGridLeftHierarchyHeaderContainer, null),
		hierarchyCount === 0 && React.createElement(
			'div',
			{ className: 'pinnedLeft-select last' },
			React.createElement(RateManagerGridLeftFirstRowContainer, null)
		),
		(mode === RM_RX_CONST.RATE_VIEW_MODE || mode === RM_RX_CONST.RATE_TYPE_VIEW_MODE) && React.createElement(
			'div',
			{ className: 'pinnedLeft-select-container pinnedLeft-availability' },
			React.createElement(
				'div',
				{ className: 'pinnedLeft-select last' },
				React.createElement(
					'div',
					{ className: 'name' },
					'Available Rooms'
				)
			)
		),
		React.createElement(
			'div',
			{ className: 'pinnedLeft-list' },
			React.createElement(
				'div',
				{ className: 'wrapper' },
				React.createElement(
					'table',
					{ className: 'rate-calendar' },
					React.createElement(RateManagerGridLeftRowsContainer, null)
				)
			)
		)
	);
};