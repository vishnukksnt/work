"use strict";

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _ReactRedux = ReactRedux,
    connect = _ReactRedux.connect;

// Utility function to calculate next page item count

var calculateNextPageItemCount = function calculateNextPageItemCount(state) {
    var totalPage = Math.ceil(state.paginationData.totalCount / state.paginationData.perPage);

    if (state.paginationData.page === totalPage - 1) {
        return state.paginationData.totalCount - state.paginationData.perPage * state.paginationData.page;
    }
    return state.paginationData.perPage;
};

var mapStateToNightlyDiaryGoToNextPageButtonContainerProps = function mapStateToNightlyDiaryGoToNextPageButtonContainerProps(state) {
    return {
        goToNextPage: state.callBackFromAngular.goToNextPage,
        nextPageItemCount: calculateNextPageItemCount(state)
    };
};

var mapDispatchToNightlyDiaryGoToNextPageButtonContainer = function mapDispatchToNightlyDiaryGoToNextPageButtonContainer(stateProps) {
    var goToNextButtonClicked = function goToNextButtonClicked() {};

    goToNextButtonClicked = function goToNextButtonClicked() {
        return stateProps.goToNextPage();
    };
    return _extends({
        goToNextButtonClicked: goToNextButtonClicked
    }, stateProps);
};

var GoToNextPageButtonContainer = connect(mapStateToNightlyDiaryGoToNextPageButtonContainerProps, null, mapDispatchToNightlyDiaryGoToNextPageButtonContainer)(GoToNextPageButtonComponent);