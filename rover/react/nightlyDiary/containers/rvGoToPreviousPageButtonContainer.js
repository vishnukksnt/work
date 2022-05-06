"use strict";

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _ReactRedux = ReactRedux,
    connect = _ReactRedux.connect;

var mapStateToNightlyDiaryGoToPreviousPageButtonContainerProps = function mapStateToNightlyDiaryGoToPreviousPageButtonContainerProps(state) {
    return {
        goToPrev: state.callBackFromAngular.goToPrevPage,
        perPage: state.paginationData.perPage
    };
};

var mapDispatchToNightlyDiaryGoToPreviousPageButtonContainer = function mapDispatchToNightlyDiaryGoToPreviousPageButtonContainer(stateProps) {
    var goToPrevButtonClicked = function goToPrevButtonClicked() {};

    goToPrevButtonClicked = function goToPrevButtonClicked() {
        return stateProps.goToPrev();
    };
    return _extends({
        goToPrevButtonClicked: goToPrevButtonClicked
    }, stateProps);
};

var GoToPreviousPageButtonContainer = connect(mapStateToNightlyDiaryGoToPreviousPageButtonContainerProps, null, mapDispatchToNightlyDiaryGoToPreviousPageButtonContainer)(GoToPreviousPageButtonComponent);