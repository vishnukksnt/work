"use strict";

var _ReactRedux = ReactRedux,
    connect = _ReactRedux.connect;


var mapStateToRateManagerGridRightSideRowsContainerProps = function mapStateToRateManagerGridRightSideRowsContainerProps(state) {
    return {
        mode: state.mode,
        action: state.action,
        list: state.list,
        expandedRows: state.expandedRows
    };
};

var mapDispatchToRateManagerGridRightSideRowsContainerProps = function mapDispatchToRateManagerGridRightSideRowsContainerProps(dispatch) {
    return {
        refreshScrollers: function refreshScrollers() {
            dispatch({
                type: RM_RX_CONST.REFRESH_SCROLLERS
            });
        },
        hideLoader: function hideLoader() {
            dispatch({
                type: RM_RX_CONST.ACT_HIDE_ACTIVITY_INDICATOR
            });
        }
    };
};

var RateManagerGridRightSideRowsContainer = connect(mapStateToRateManagerGridRightSideRowsContainerProps, mapDispatchToRateManagerGridRightSideRowsContainerProps)(RateManagerGridRightSideRowsComponent);