"use strict";

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _ReactRedux = ReactRedux,
    connect = _ReactRedux.connect;


var mapStateToRateManagerGridLeftSideHeadButtonContainerProps = function mapStateToRateManagerGridLeftSideHeadButtonContainerProps(state) {

    var propsToReturn = {
        mode: state.mode,
        fromDate: state.dates[0],
        toDate: state.dates[state.dates.length - 1]
    };

    if (state.mode === RM_RX_CONST.SINGLE_RATE_EXPANDABLE_VIEW_MODE) {
        propsToReturn.shouldShowPagination = false;
    } else if (state.mode === RM_RX_CONST.RATE_VIEW_MODE) {
        propsToReturn.shouldShowPagination = true;
        propsToReturn.goToPrevPage = state.callBacksFromAngular.goToPrevPage;
        propsToReturn.goToNextPage = state.callBacksFromAngular.goToNextPage;
        propsToReturn.paginationStateData = state.paginationState;
    } else if (state.mode === RM_RX_CONST.ROOM_TYPE_VIEW_MODE) {
        propsToReturn.shouldShowPagination = false;
    } else if (state.mode === RM_RX_CONST.RATE_TYPE_VIEW_MODE) {
        propsToReturn.shouldShowPagination = true;
        propsToReturn.goToPrevPage = state.callBacksFromAngular.goToPrevPage;
        propsToReturn.goToNextPage = state.callBacksFromAngular.goToNextPage;
        propsToReturn.paginationStateData = state.paginationState;
    }

    return propsToReturn;
};

var getPreviousPageButtonText = function getPreviousPageButtonText(mode, paginationStateData) {
    var previousPageButtonText = "PREVIOUS ";

    switch (mode) {
        case RM_RX_CONST.RATE_VIEW_MODE:
            previousPageButtonText += paginationStateData.perPage + " RATES";
            break;
        case RM_RX_CONST.RATE_TYPE_VIEW_MODE:
            previousPageButtonText += paginationStateData.perPage + " RATE TYPES";
            break;
        default:
            break;
    }
    return previousPageButtonText;
};

var getNextPageButtonText = function getNextPageButtonText(mode, paginationStateData) {
    var nextPageButtonText = "NEXT ";

    switch (mode) {
        case RM_RX_CONST.RATE_VIEW_MODE:
            if (Math.ceil(paginationStateData.totalRows / paginationStateData.perPage) === paginationStateData.page + 1) {
                // In case of navigation to last page; show remaining
                nextPageButtonText += paginationStateData.totalRows - paginationStateData.perPage * paginationStateData.page + " RATES";
            } else {
                nextPageButtonText += paginationStateData.perPage + " RATES";
            }
            break;
        case RM_RX_CONST.RATE_TYPE_VIEW_MODE:
            if (Math.ceil(paginationStateData.totalRows / paginationStateData.perPage) === paginationStateData.page + 1) {
                // In case of navigation to last page; show remaining
                nextPageButtonText += paginationStateData.totalRows - paginationStateData.perPage * paginationStateData.page + " RATE TYPES";
            } else {
                nextPageButtonText += paginationStateData.perPage + " RATE TYPES";
            }
            break;
        default:
            break;
    }
    return nextPageButtonText;
};

var mapActionToRateManagerGridLeftSideHeadButtonContainerProps = function mapActionToRateManagerGridLeftSideHeadButtonContainerProps(stateProps, dispatchProps, ownProps) {
    var isFirstPage = false,
        isLastPage = false;

    if (stateProps.mode === RM_RX_CONST.RATE_VIEW_MODE || stateProps.mode === RM_RX_CONST.RATE_TYPE_VIEW_MODE) {
        if (stateProps.paginationStateData.page === 1) {
            isFirstPage = true;
        }
        if (Math.ceil(stateProps.paginationStateData.totalRows / stateProps.paginationStateData.perPage) === stateProps.paginationStateData.page) {
            isLastPage = true;
        }
    }

    return _extends({}, stateProps, {
        goToPrevPage: stateProps.goToPrevPage,
        goToNextPage: stateProps.goToNextPage,
        isFirstPage: isFirstPage,
        isLastPage: isLastPage,
        prevPageButtonText: getPreviousPageButtonText(stateProps.mode, stateProps.paginationStateData),
        nextPageButtonText: getNextPageButtonText(stateProps.mode, stateProps.paginationStateData)
    });
};

var RateManagerGridLeftSideHeadButtonContainer = connect(mapStateToRateManagerGridLeftSideHeadButtonContainerProps, null, mapActionToRateManagerGridLeftSideHeadButtonContainerProps)(RateManagerGridLeftSideHeadButtonComponent);