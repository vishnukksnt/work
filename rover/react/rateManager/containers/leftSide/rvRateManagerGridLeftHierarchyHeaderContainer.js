'use strict';

var _ReactRedux = ReactRedux,
    connect = _ReactRedux.connect;


var getActiveHierarchyRestrictions = function getActiveHierarchyRestrictions(state) {
    var list = [];

    if (state.isHierarchyHouseRestrictionEnabled) {
        list.push('HOUSE');
    }
    if (state.isHierarchyRoomTypeRestrictionEnabled) {
        list.push('ROOM TYPE');
    }
    if (state.isHierarchyRateTypeRestrictionEnabled) {
        list.push('RATE TYPE');
    }
    if (state.isHierarchyRateRestrictionEnabled) {
        list.push('RATE');
    }
    if (state.mode === RM_RX_CONST.SINGLE_RATE_EXPANDABLE_VIEW_MODE) {
        list.push('All room types');
    }

    return list;
};

var mapStateToRateManagerLeftHierarchyHeaderComponentProps = function mapStateToRateManagerLeftHierarchyHeaderComponentProps(state) {
    return {
        activeRestrictions: getActiveHierarchyRestrictions(state)
    };
};

var RateManagerGridLeftHierarchyHeaderContainer = connect(mapStateToRateManagerLeftHierarchyHeaderComponentProps)(RateManagerLeftHierarchyHeaderComponent);