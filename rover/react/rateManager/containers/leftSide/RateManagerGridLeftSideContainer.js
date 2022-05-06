"use strict";

var _ReactRedux = ReactRedux,
    connect = _ReactRedux.connect;


var mapStateToRateManagerGridLeftFirstRowComponentProps = function mapStateToRateManagerGridLeftFirstRowComponentProps(state) {
  var hideTopHeader = state.isHierarchyHouseRestrictionEnabled || state.isHierarchyRoomTypeRestrictionEnabled && state.mode === RM_RX_CONST.ROOM_TYPE_VIEW_MODE || state.isHierarchyRateTypeRestrictionEnabled && state.mode === RM_RX_CONST.RATE_TYPE_VIEW_MODE;

  var hierarchyCount = (state.isHierarchyHouseRestrictionEnabled && 1) + (state.isHierarchyRoomTypeRestrictionEnabled && 1) + (state.isHierarchyRateTypeRestrictionEnabled && 1) + (state.isHierarchyRateRestrictionEnabled && 1);

  return {
    hideTopHeader: hideTopHeader,
    hierarchyCount: hierarchyCount,
    hierarchyClass: state.hierarchyRestrictionClass,
    panelToggleClass: state.frozenPanelClass,
    mode: state.mode
  };
};

var RateManagerGridLeftSideContainer = connect(mapStateToRateManagerGridLeftFirstRowComponentProps)(RateManagerGridLeftSideComponent);