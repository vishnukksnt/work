'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _ReactRedux = ReactRedux,
    connect = _ReactRedux.connect;


var convertDateDataForHeader = function convertDateDataForHeader(dates, businessDate, eventsCount) {
    var headerDateData = [],
        copiedDate = null,
        copiedDateComponents = null,
        day = null,
        isWeekEnd = false,
        isPastDate = false,
        headerConditionalClass = '',
        cellConditionalClass = '',
        dailyEventData;

    dates.map(function (date) {
        copiedDate = tzIndependentDate(date);
        copiedDateComponents = copiedDate.toComponents().date; // refer util.js in diary folder

        day = copiedDateComponents.day.toString();
        isWeekEnd = copiedDate.getDay() === 6 || copiedDate.getDay() === 0;
        isPastDate = copiedDate < businessDate;

        headerConditionalClass = isWeekEnd ? 'weekend_day' : '';
        cellConditionalClass = isWeekEnd ? 'weekend_day' : '';

        if (isPastDate) {
            headerConditionalClass = '';
            cellConditionalClass = 'isHistory-cell-content';
        }

        dailyEventData = _.find(eventsCount, { date: date });

        headerDateData.push({
            'headerClass': headerConditionalClass,
            'cellClass': cellConditionalClass,
            'topLabel': copiedDateComponents.weekday,
            'topLabelContainerClass': 'week-day',
            'bottomLabel': copiedDateComponents.monthName + ' ' + (day.length === 1 ? '0' + day : day),
            'bottomLabelContainerClass': '',
            'eventCount': dailyEventData && dailyEventData.count || 0,
            'date': date
        });
    });

    return headerDateData;
};

var mapStateToRateManagerGridRightSideHeaderContainerProps = function mapStateToRateManagerGridRightSideHeaderContainerProps(state) {
    // app/assets/rover/react/rateManager/utils/rvRateManagerGridRightSideContainerUtils.js
    var utilMethods = new rvRateManagerRightSideContainerUtils();
    // for every mode (all rate view, room type, single rate view), this is same
    var propsToReturn = {
        mode: state.mode,
        headerDataList: convertDateDataForHeader(state.dates, state.businessDate, state.eventsCount),
        summary: utilMethods.convertDataForRestrictionListing(state.summary, state.restrictionTypes),
        dateList: utilMethods.convertDateListForRestrictionView(state.dates, state.businessDate, state.weekendDays),
        dates: state.dates,
        hideTopHeader: false,
        onDailyEventCountClick: state.callBacksFromAngular.onDailyEventCountClick
    };

    switch (state.mode) {
        case RM_RX_CONST.RATE_VIEW_MODE:
            propsToReturn.clickedOnRateCellOnRateView = state.callBacksFromAngular.clickedOnRateViewCell;
            break;

        case RM_RX_CONST.ROOM_TYPE_VIEW_MODE:
            propsToReturn.clickedOnRoomTypeViewCell = state.callBacksFromAngular.clickedOnRoomTypeViewCell;
            propsToReturn.hideTopHeader = !state.isHierarchyHouseRestrictionEnabled && state.isHierarchyRoomTypeRestrictionEnabled;
            break;

        case RM_RX_CONST.SINGLE_RATE_EXPANDABLE_VIEW_MODE:
            propsToReturn.clickedOnRoomTypeAndAmountCell = state.callBacksFromAngular.clickedOnRoomTypeAndAmountCell;
            break;

        case RM_RX_CONST.RATE_TYPE_VIEW_MODE:
            propsToReturn.hideTopHeader = !state.isHierarchyHouseRestrictionEnabled && state.isHierarchyRateTypeRestrictionEnabled;
            propsToReturn.clickedOnRateTypeViewCell = state.callBacksFromAngular.clickedOnRateTypeViewCell;
            break;

        default:
            break;
    }

    return propsToReturn;
};

var mapDispatchToRateManagerGridRightSideHeaderContainerProps = function mapDispatchToRateManagerGridRightSideHeaderContainerProps(stateProps, dispatch) {

    var onTdClick = function onTdClick() {};

    switch (stateProps.mode) {
        case RM_RX_CONST.RATE_VIEW_MODE:
            onTdClick = function onTdClick(e, rowIndex, colIndex) {
                var date = stateProps.dates[colIndex],
                    rateIDs = [];

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

                return stateProps.clickedOnRoomTypeViewCell({
                    roomTypeIDs: roomTypeIDs,
                    date: date
                });
            };
            break;
        case RM_RX_CONST.SINGLE_RATE_EXPANDABLE_VIEW_MODE:
            onTdClick = function onTdClick(e, rowIndex, colIndex) {
                var date = stateProps.dates[colIndex],
                    roomTypeIDs = [];

                return stateProps.clickedOnRoomTypeAndAmountCell({
                    roomTypeIDs: roomTypeIDs,
                    date: date
                });
            };
            break;

        case RM_RX_CONST.RATE_TYPE_VIEW_MODE:
            onTdClick = function onTdClick(e, rowIndex, colIndex) {
                var date = stateProps.dates[colIndex],
                    rateTypeIDs = [];

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
    }, stateProps, {
        refreshScrollers: function refreshScrollers() {
            dispatch({
                type: RM_RX_CONST.REFRESH_SCROLLERS
            });
        }
    });
};

var RateManagerGridRightSideHeaderContainer = connect(mapStateToRateManagerGridRightSideHeaderContainerProps, null, mapDispatchToRateManagerGridRightSideHeaderContainerProps)(RateManagerGridRightSideHeaderComponent);