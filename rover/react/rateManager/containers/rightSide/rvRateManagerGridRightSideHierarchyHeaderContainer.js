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

var mapStateToRateManagerGridRightSideHierarchyHeaderContainerProps = function mapStateToRateManagerGridRightSideHierarchyHeaderContainerProps(state) {
    // for every mode (all rate view, room type, single rate view), this is same
    var propsToReturn = {
        headerDataList: convertDateDataForHeader(state.dates, state.businessDate, state.eventsCount),
        showHouse: state.isHierarchyHouseRestrictionEnabled,
        showRoomType: state.isHierarchyRoomTypeRestrictionEnabled,
        showRateType: state.isHierarchyRateTypeRestrictionEnabled,
        showRate: state.isHierarchyRateRestrictionEnabled,
        showAllRoomTypes: state.mode === RM_RX_CONST.SINGLE_RATE_EXPANDABLE_VIEW_MODE,
        hierarchyRestrictionClass: state.hierarchyRestrictionClass,
        frozenPanelClass: state.frozenPanelClass,
        mode: state.mode,
        onDailyEventCountClick: state.callBacksFromAngular.onDailyEventCountClick
    };

    return propsToReturn;
};

var mapDispatchToRateManagerGridRightSideHierarchyHeaderContainerProps = function mapDispatchToRateManagerGridRightSideHierarchyHeaderContainerProps(stateProps, dispatch) {
    return _extends({}, stateProps, {
        refreshScrollers: function refreshScrollers() {
            dispatch({
                type: RM_RX_CONST.REFRESH_SCROLLERS
            });
        }
    });
};

var RateManagerGridRightSideHierarchyHeaderContainer = connect(mapStateToRateManagerGridRightSideHierarchyHeaderContainerProps, null, mapDispatchToRateManagerGridRightSideHierarchyHeaderContainerProps)(RateManagerGridRightSideHierarchyHeaderComponent);