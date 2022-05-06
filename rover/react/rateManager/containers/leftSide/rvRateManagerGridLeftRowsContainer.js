'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _ReactRedux = ReactRedux,
    connect = _ReactRedux.connect;

/**
 * to convert the rates data coming from reducers to props
 * @param  {array} rates
 * @return {array}
 */

var convertRatesDataForLeftListing = function convertRatesDataForLeftListing(rates, mode) {
	var ratesToReturn = [];
	var showIndicator = mode == RM_RX_CONST.RATE_VIEW_MODE;

	rates.map(function (rate, index) {
		ratesToReturn.push({
			id: rate.id,
			name: rate.name,
			trClassName: 'cell rate ' + (index + 1 === rates.length ? 'last' : ''),
			tdClassName: '',
			leftSpanClassName: 'name ' + (rate.based_on_rate_id && !rate.is_copied ? 'gray' : 'base-rate') + (rate.is_company_card || rate.is_travel_agent ? ' contracted-rate' : ' contracted-rate contracted-rate-missing-info'),
			showIconBeforeText: !rate.based_on_rate_id,
			iconClassBeforeText: !rate.based_on_rate_id ? 'base-rate-indicator' : '',
			textInIconArea: !rate.based_on_rate_id ? 'B' : '',
			leftSpanText: rate.name,
			showRightSpan: true,
			rightSpanClassName: 'icons icon-double-arrow rotate-right',
			showIndicator: showIndicator
		});
	});

	return ratesToReturn;
};

var convertRateTypesDataForLeftListing = function convertRateTypesDataForLeftListing(rateTypes, mode, isHierarchyRateTypeRestrictionEnabled) {
	var rateTypesToReturn = [],
	    showIndicator = mode === RM_RX_CONST.RATE_TYPE_VIEW_MODE,
	    disableNavigation = mode === RM_RX_CONST.RATE_TYPE_VIEW_MODE && isHierarchyRateTypeRestrictionEnabled;

	rateTypes.map(function (rateType, index) {
		rateTypesToReturn.push({
			id: rateType.id,
			name: rateType.name,
			trClassName: 'cell rate ' + (index + 1 === rateTypes.length ? 'last' : '') + (disableNavigation ? ' disable-element' : ''),
			tdClassName: '',
			leftSpanClassName: 'name ' + (rateType.based_on_rate_id && !rateType.is_copied ? 'gray' : 'base-rate') + (rateType.is_company_card || rateType.is_travel_agent ? ' contracted-rate' : ' contracted-rate contracted-rate-missing-info'),
			showIconBeforeText: !rateType.based_on_rate_id,
			iconClassBeforeText: !rateType.based_on_rate_id ? 'base-rate-indicator' : '',
			textInIconArea: !rateType.based_on_rate_id ? 'B' : '',
			leftSpanText: rateType.name,
			showRightSpan: true,
			rightSpanClassName: disableNavigation ? '' : 'icons icon-double-arrow rotate-right',
			showIndicator: showIndicator
		});
	});

	return rateTypesToReturn;
};

/**
 * to convert the room type data coming from reducers to props
 * @param  {array} room types
 * @return {array}
 */
var convertRoomTypesDataForLeftListing = function convertRoomTypesDataForLeftListing(roomTypes) {
	var roomTypesToReturn = [];

	roomTypes.map(function (roomType, index) {
		roomTypesToReturn.push(_extends({}, roomType, {
			trClassName: 'cell rate ' + (index + 1 === roomTypes.length ? 'last' : '') + ' disable-element',
			tdClassName: '',
			leftSpanClassName: 'name ',
			showIconBeforeText: false,
			textInIconArea: '',
			leftSpanText: roomType.name,
			showRightSpan: false
		}));
	});

	return roomTypesToReturn;
};

/**
 * to convert the single rate's room type data coming from reducers to props
 * @param  {array} room types
 * @param {array} expandedRows [array containing index of row to expand]
 * @return {array}
 */
var convertSingleRateRoomTypesDataForLeftListing = function convertSingleRateRoomTypesDataForLeftListing(roomTypes, expandedRows) {
	var roomTypesToReturn = [],
	    isExpandedRow = false;

	roomTypes.map(function (roomType, index) {
		isExpandedRow = expandedRows.indexOf(index) > -1;
		roomTypesToReturn.push(_extends({}, roomType, {
			trClassName: 'cell rate' + (index + 1 === roomTypes.length ? ' last' : '') + (isExpandedRow ? ' expanded-row' : ''),
			tdClassName: '',
			leftSpanClassName: 'name ',
			showIconBeforeText: false,
			textInIconArea: '',
			leftSpanText: roomType.name,
			showRightSpan: true,
			rightSpanClassName: 'icons icon-double-arrow' + (isExpandedRow ? ' rotate-up' : ' rotate-down')
		}));
	});
	return roomTypesToReturn;
};

var mapStateToRateManagerGridLeftRowsContainerProps = function mapStateToRateManagerGridLeftRowsContainerProps(state) {
	if (state.mode === RM_RX_CONST.RATE_VIEW_MODE) {
		return {
			leftListingData: convertRatesDataForLeftListing(state.list, state.mode),
			mode: state.mode,
			fromDate: state.dates[0],
			toDate: state.dates[state.dates.length - 1],
			callBackForSingleRateFetch: state.callBacksFromAngular.singleRateViewCallback
		};
	} else if (state.mode === RM_RX_CONST.RATE_TYPE_VIEW_MODE) {
		return {
			leftListingData: convertRateTypesDataForLeftListing(state.list, state.mode, state.isHierarchyRateTypeRestrictionEnabled),
			mode: state.mode,
			fromDate: state.dates[0],
			toDate: state.dates[state.dates.length - 1],
			callBackForSingleRateTypeFetch: state.callBacksFromAngular.singleRateTypeViewCallback
		};
	} else if (state.mode === RM_RX_CONST.ROOM_TYPE_VIEW_MODE) {
		return {
			leftListingData: convertRoomTypesDataForLeftListing(state.list)
		};
	} else if (state.mode === RM_RX_CONST.SINGLE_RATE_EXPANDABLE_VIEW_MODE) {
		return {
			leftListingData: convertSingleRateRoomTypesDataForLeftListing(state.list, state.expandedRows),
			mode: state.mode
		};
	}
};

var mapDispatchToRateManagerGridLeftRowsContainerProps = function mapDispatchToRateManagerGridLeftRowsContainerProps(stateProps, dispatchProps, ownProps) {
	return {
		onItemClick: function onItemClick(e, index) {
			var dispatch = dispatchProps.dispatch;


			if (stateProps.mode === RM_RX_CONST.SINGLE_RATE_EXPANDABLE_VIEW_MODE) {
				dispatch({
					type: RM_RX_CONST.TOGGLE_EXPAND_COLLAPSE_ROW,
					payLoad: {
						index: index
					}
				});
			} else if (stateProps.mode === RM_RX_CONST.RATE_VIEW_MODE) {
				var clickedRate = stateProps.leftListingData[index];

				stateProps.callBackForSingleRateFetch({
					fromDate: stateProps.fromDate,
					toDate: stateProps.toDate,
					selectedRates: [{ id: clickedRate.id, name: clickedRate.name, accountName: clickedRate.accountName, address: clickedRate.address }]
				});
			} else if (stateProps.mode === RM_RX_CONST.RATE_TYPE_VIEW_MODE) {
				var clickedRateType = stateProps.leftListingData[index];

				stateProps.callBackForSingleRateTypeFetch({
					fromDate: stateProps.fromDate,
					toDate: stateProps.toDate,
					selectedRateTypes: [{ id: clickedRateType.id, name: clickedRateType.name }]
				});
			}
		},
		leftListingData: stateProps.leftListingData
	};
};

var RateManagerGridLeftRowsContainer = connect(mapStateToRateManagerGridLeftRowsContainerProps, null, mapDispatchToRateManagerGridLeftRowsContainerProps)(RateManagerGridLeftRowsComponent);