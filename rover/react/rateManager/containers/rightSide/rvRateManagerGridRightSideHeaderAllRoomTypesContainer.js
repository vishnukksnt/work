"use strict";

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _ReactRedux = ReactRedux,
    connect = _ReactRedux.connect;


var mapStateForRateManagerGridRightSideHeaderAllRoomTypesContainerProps = function mapStateForRateManagerGridRightSideHeaderAllRoomTypesContainerProps(state) {
    var rvRMUtils = new rvRateManagerRightSideContainerUtils();
    // for every mode (all rate view, room type, single rate view), this is same
    var propsToReturn = {
        mode: state.mode,
        restrictionSummary: rvRMUtils.convertDataForRestrictionListing(state.summary[0].allRoomTypeSummary, state.restrictionTypes),
        dateList: rvRMUtils.convertDateListForRestrictionView(state.dates, state.businessDate, state.weekendDays),
        dates: state.dates,
        cellClicked: state.callBacksFromAngular.clickedOnRoomTypeAndAmountCell
    };

    return propsToReturn;
};

var mapDispatchForRateManagerGridRightSideHeaderAllRoomTypesContainerProps = function mapDispatchForRateManagerGridRightSideHeaderAllRoomTypesContainerProps(stateProps, dispatch) {
    var onTdClick = function onTdClick(e, colIndex) {
        var date = stateProps.dates[colIndex],
            roomTypeIDs = [];

        return stateProps.cellClicked({
            roomTypeIDs: roomTypeIDs,
            date: date
        });
    };

    return _extends({
        onTdClick: onTdClick
    }, stateProps, {
        refreshScrollers: function refreshScrollers() {
            dispatch({
                type: RM_RX_CONST.REFRESH_SCROLLERS
            });
        }
    });
};

var RateManagerGridRightSideHeaderAllRoomTypesContainer = connect(mapStateForRateManagerGridRightSideHeaderAllRoomTypesContainerProps, null, mapDispatchForRateManagerGridRightSideHeaderAllRoomTypesContainerProps)(RateManagerGridRightSideHierarchyHeaderCellComponent);