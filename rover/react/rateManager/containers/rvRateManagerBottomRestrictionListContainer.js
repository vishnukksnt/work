'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _ReactRedux = ReactRedux,
    connect = _ReactRedux.connect;


var convertRestrictionsIntoProps = function convertRestrictionsIntoProps(restrictionTypes) {
	var restrictionTypeConstObj = null,
	    _restrictionTypes = [];

	_restrictionTypes = restrictionTypes.map(function (restrictionType) {
		restrictionTypeConstObj = RateManagerRestrictionTypes[restrictionType.value];
		return _extends({}, restrictionType, restrictionTypeConstObj);
	});

	// 'more restrictions' will not be in API, it is adding from the UI

	restrictionTypeConstObj = RateManagerRestrictionTypes['MORE_RESTRICTIONS'];

	_restrictionTypes.push(_extends({}, restrictionTypeConstObj));

	return _restrictionTypes;
};

var mapStateToRateManagerBottomRestrictionListProps = function mapStateToRateManagerBottomRestrictionListProps(state) {
	return {
		ulClassNames: 'restriction-legends',
		restrictionTypes: convertRestrictionsIntoProps(state.restrictionTypes)
	};
};

var RateManagerBottomRestrictionListContainer = connect(mapStateToRateManagerBottomRestrictionListProps)(RateManagerBottomRestrictionListComponent);