"use strict";

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _ReactRedux = ReactRedux,
    connect = _ReactRedux.connect;


var mapStateToRateManagerGridRightSideRestrictionRowsContainerProps = function mapStateToRateManagerGridRightSideRestrictionRowsContainerProps(state) {
    var utilMethods = new rvRateManagerRightSideContainerUtils(),
        restrictionRows = utilMethods.convertDataForRestrictionListing(state.list, state.restrictionTypes),
        propsToReturn = {};

    propsToReturn = {
        restrictionRows: restrictionRows,
        mode: state.mode,
        dateList: utilMethods.convertDateListForRestrictionView(state.dates, state.businessDate, state.weekendDays),
        dates: state.dates,
        showAvailability: state.showAvailability
    };
    switch (state.mode) {
        case RM_RX_CONST.RATE_VIEW_MODE:
            propsToReturn.clickedOnRateCellOnRateView = state.callBacksFromAngular.clickedOnRateViewCell;
            break;

        case RM_RX_CONST.ROOM_TYPE_VIEW_MODE:
            propsToReturn.clickedOnRoomTypeViewCell = state.callBacksFromAngular.clickedOnRoomTypeViewCell;
            break;

        case RM_RX_CONST.RATE_TYPE_VIEW_MODE:
            propsToReturn.clickedOnRateTypeViewCell = state.callBacksFromAngular.clickedOnRateTypeViewCell;
            break;

        default:
            break;
    }

    return propsToReturn;
};

var mapDispatchToRateManagerGridRightSideRowsRestrictionContainer = function mapDispatchToRateManagerGridRightSideRowsRestrictionContainer(stateProps, dispatchProps, ownProps) {
    var onTdClick = function onTdClick() {};

    switch (stateProps.mode) {
        case RM_RX_CONST.RATE_VIEW_MODE:
            onTdClick = function onTdClick(e, rowIndex, colIndex) {
                var date = stateProps.dates[colIndex],
                    rateIDs = [];

                rateIDs = [stateProps.restrictionRows[rowIndex].id];

                return stateProps.clickedOnRateCellOnRateView({
                    rateIDs: rateIDs,
                    date: date
                });
            };
            break;

        case RM_RX_CONST.ROOM_TYPE_VIEW_MODE:
            onTdClick = function onTdClick(e, rowIndex, colIndex) {
                var date = stateProps.dates[colIndex],
                    roomTypeIDs = [];

                roomTypeIDs = [stateProps.restrictionRows[rowIndex].id];
                return stateProps.clickedOnRoomTypeViewCell({
                    roomTypeIDs: roomTypeIDs,
                    date: date
                });
            };
            break;
        case RM_RX_CONST.RATE_TYPE_VIEW_MODE:
            onTdClick = function onTdClick(e, rowIndex, colIndex) {
                var date = stateProps.dates[colIndex],
                    rateTypeIDs = [];

                rateTypeIDs = [stateProps.restrictionRows[rowIndex].id];
                return stateProps.clickedOnRateTypeViewCell({
                    rateTypeIDs: rateTypeIDs,
                    date: date
                });
            };
            break;
        default:
            break;
    };

    return _extends({
        onTdClick: onTdClick
    }, stateProps);
};

var RateManagerGridRightSideRowsRestrictionContainer = connect(mapStateToRateManagerGridRightSideRestrictionRowsContainerProps, null, mapDispatchToRateManagerGridRightSideRowsRestrictionContainer)(RateManagerGridRightSideRowsRestrictionComponent);