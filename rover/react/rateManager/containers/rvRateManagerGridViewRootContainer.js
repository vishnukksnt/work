'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _ReactRedux = ReactRedux,
    connect = _ReactRedux.connect;

/**
 * to determine whether we need to show Grid view
 * @param  {Object} state
 * @return {Boolean}
 */

var shouldShowGridViewRootContainer = function shouldShowGridViewRootContainer(state) {
    var listOfModesNotShowing = [RM_RX_CONST.NO_RESULTS_FOUND_MODE, RM_RX_CONST.NOT_CONFIGURED_MODE];

    return listOfModesNotShowing.indexOf(state.mode) === -1;
};

var hierarchyRestrictionsActive = function hierarchyRestrictionsActive(state) {
    return state.isHierarchyHouseRestrictionEnabled || state.isHierarchyRoomTypeRestrictionEnabled || state.isHierarchyRateTypeRestrictionEnabled || state.isHierarchyRateRestrictionEnabled;
};

var mapStateToRateManagerGridViewRootComponentProps = function mapStateToRateManagerGridViewRootComponentProps(state) {
    return {
        shouldShow: shouldShowGridViewRootContainer(state),
        mode: state.mode,
        refreshScrollers: state.action === RM_RX_CONST.REFRESH_SCROLLERS,
        scrollTo: state.scrollTo,
        paginationStateData: state.paginationState,
        hierarchyRestrictionClass: state.hierarchyRestrictionClass,
        showHierarchyHeader: hierarchyRestrictionsActive(state),
        toggleFunction: state.callBacksFromAngular && state.callBacksFromAngular.handlePanelToggle,
        frozenPanelClass: state.frozenPanelClass,
        houseAvailability: state.houseAvailability,
        showAvailability: state.showAvailability,
        eventsCount: state.eventsCount
    };
};

var mapDispatchToRateManagerGridViewRootComponentProps = function mapDispatchToRateManagerGridViewRootComponentProps(stateProps, dispatchProps, ownProps) {
    var wrapperClass = 'calendar-wraper',
        isLastPage = stateProps.mode === RM_RX_CONST.RATE_VIEW_MODE && Math.ceil(stateProps.paginationStateData.totalRows / stateProps.paginationStateData.perPage) === stateProps.paginationStateData.page;

    if (stateProps.mode === RM_RX_CONST.RATE_VIEW_MODE && stateProps.paginationStateData.page > 1) {
        wrapperClass += ' load-top';
    }

    if (stateProps.mode === RM_RX_CONST.RATE_VIEW_MODE && !isLastPage) {
        wrapperClass += ' load-bottom';
    }

    if (stateProps.mode === RM_RX_CONST.RATE_VIEW_MODE || stateProps.mode === RM_RX_CONST.RATE_TYPE_VIEW_MODE) {
        wrapperClass += ' with-availability';
    }

    if (stateProps.toggleFunction) {
        var handleToggler = function handleToggler() {
            stateProps.toggleFunction(stateProps.frozenPanelClass);
        };
    }

    return _extends({}, stateProps, {
        wrapperClass: wrapperClass,
        handleToggler: handleToggler
    });
};

var RateManagerGridViewRootContainer = connect(mapStateToRateManagerGridViewRootComponentProps, null, mapDispatchToRateManagerGridViewRootComponentProps)(RateManagerGridViewRootComponent);