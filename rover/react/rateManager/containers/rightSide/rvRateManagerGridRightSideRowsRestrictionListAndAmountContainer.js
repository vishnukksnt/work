'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _ReactRedux = ReactRedux,
    connect = _ReactRedux.connect;

/**
 * we need date related information in restriction list view(like is week end or past date..)
 * @param  {array} dateList
 * @param  {Object} businessDate
 * @return {array}
 */

var convertDateListForRestrictionAndAmountView = function convertDateListForRestrictionAndAmountView(dateList, businessDate) {
    // we will compute date related information first and will use this information in
    // the view component
    var newDateList = [],
        copiedDate = null,
        copiedDateComponents = null,
        isWeekEnd = false,
        isPastDate = false;

    dateList.map(function (date) {
        copiedDate = tzIndependentDate(date);
        copiedDateComponents = copiedDate.toComponents().date; // refer util.js in diary folder
        isWeekEnd = copiedDate.getDay() === 6 || copiedDate.getDay() === 0;
        isPastDate = copiedDate < businessDate;
        newDateList.push({
            date: copiedDate,
            isWeekEnd: isWeekEnd,
            isPastDate: isPastDate
        });
    });

    return newDateList;
};

/**
 * convert data coming from reducer to props for restriction only displaying
 * @param  {array} listingData 
 * @param  {array} restrictionTypes
 * @param  {array} expandedRows [array containing index of row to expand]
 * @return {array}
 */
var applyRestrictionLogicForSingleRateView = function applyRestrictionLogicForSingleRateView(listingData, restrictionTypes, expandedRows) {

    // adding the css class and all stuff for restriction types
    restrictionTypes = restrictionTypes.map(function (restrictionType) {
        return _extends({}, restrictionType, RateManagerRestrictionTypes[restrictionType.value]);
    });

    var restrictionTypeIDS = _.pluck(restrictionTypes, 'id'),
        restrictionTypesBasedOnIDs = _.object(restrictionTypeIDS, restrictionTypes); // for quicker access

    var restrictionForMoreThanMaxAllowed = RateManagerRestrictionTypes['MORE_RESTRICTIONS'];

    restrictionForMoreThanMaxAllowed.days = restrictionForMoreThanMaxAllowed.defaultText;
    var listingDataToReturn = [];

    listingData.map(function (data, index) {
        listingDataToReturn.push(_extends({}, data, {
            expanded: expandedRows.indexOf(index) > -1,
            restrictionList: data.restrictionList.map(function (dayRestrictionList) {
                // If we cross max restriction allowed in a single column, we will replace with single restriction
                if (dayRestrictionList.length >= RM_RX_CONST.MAX_RESTRICTION_IN_COLUMN) {
                    return [_extends({}, restrictionForMoreThanMaxAllowed)];
                }
                return dayRestrictionList.map(function (restriction) {
                    return _extends({}, restriction, restrictionTypesBasedOnIDs[restriction.restriction_type_id]);
                });
            })
        }));
    });

    return listingDataToReturn;
};

var mapStateToRateManagerGridRightSideRowsRestrictionListAndAmountContainerProps = function mapStateToRateManagerGridRightSideRowsRestrictionListAndAmountContainerProps(state) {
    var shouldFormRowsData = state.mode === RM_RX_CONST.SINGLE_RATE_EXPANDABLE_VIEW_MODE,
        roomTypeRowsData = shouldFormRowsData ? applyRestrictionLogicForSingleRateView(state.list, state.restrictionTypes, state.expandedRows) : [];

    return {
        roomTypeRowsData: roomTypeRowsData,
        mode: state.mode,
        dateList: convertDateListForRestrictionAndAmountView(state.dates, state.businessDate),
        dates: state.dates,
        clickedOnRoomTypeAndAmountCell: state.callBacksFromAngular.clickedOnRoomTypeAndAmountCell,
        showAvailability: state.showAvailability
    };
};

var mapDispatchToRateManagerGridRightSideRowsRestrictionListAndAmountContainerContainer = function mapDispatchToRateManagerGridRightSideRowsRestrictionListAndAmountContainerContainer(stateProps, dispatchProps, ownProps) {
    var onTdClick = function onTdClick() {};

    switch (stateProps.mode) {
        case RM_RX_CONST.SINGLE_RATE_EXPANDABLE_VIEW_MODE:
            onTdClick = function onTdClick(e, rowIndex, colIndex) {
                var date = stateProps.dates[colIndex],
                    roomTypeIDs = [stateProps.roomTypeRowsData[rowIndex].id];

                return stateProps.clickedOnRoomTypeAndAmountCell({
                    roomTypeIDs: roomTypeIDs,
                    date: date
                });
            };
            break;
    }

    return _extends({
        onTdClick: onTdClick
    }, stateProps);
};
var RateManagerGridRightSideRowsRestrictionListAndAmountContainer = connect(mapStateToRateManagerGridRightSideRowsRestrictionListAndAmountContainerProps, null, mapDispatchToRateManagerGridRightSideRowsRestrictionListAndAmountContainerContainer)(RateManagerGridRightSideRowsRestrictionListAndAmountComponent);