'use strict';

var _ReactRedux = ReactRedux,
    connect = _ReactRedux.connect;


var getListValues = function getListValues() {
	var list = [{
		name: 'House Restrictions',
		value: 'HOUSE'
	}];

	return list;
};

var mapStateToRateManagerHierarchyRestrictionsComponentProps = function mapStateToRateManagerHierarchyRestrictionsComponentProps(state) {
	return {
		listValues: getListValues(),
		changedHeirarchyRestriction: state.callBacksFromAngular.changedHeirarchyRestriction
	};
};

var RateManagerHierarchyRestrictionsContainer = connect(mapStateToRateManagerHierarchyRestrictionsComponentProps)(RateManagerHierarchyRestrictionsComponent);