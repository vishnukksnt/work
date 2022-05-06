'use strict';

var RateManagerBottomRestrictionListComponent = function RateManagerBottomRestrictionListComponent(_ref) {
	var divClassNames = _ref.divClassNames,
	    ulClassNames = _ref.ulClassNames,
	    restrictionTypes = _ref.restrictionTypes;
	return React.createElement(
		'ul',
		{ className: ulClassNames },
		restrictionTypes.map(function (restrictionType, index) {
			return React.createElement(
				'li',
				{ key: 'restriction-type-' + index },
				React.createElement(RateManagerRestrictionIconComponent, {
					className: restrictionType.className,
					text: restrictionType.defaultText }),
				React.createElement(
					'span',
					null,
					restrictionType.description
				)
			);
		})
	);
};