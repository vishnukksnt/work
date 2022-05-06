"use strict";

var _ReactRedux = ReactRedux,
    connect = _ReactRedux.connect;


var mapStateToRateManagerNoResultsFoundComponentProps = function mapStateToRateManagerNoResultsFoundComponentProps(state) {
  return {
    shouldShow: state.mode === RM_RX_CONST.NO_RESULTS_FOUND_MODE
  };
};

var RateManagerNoResultsFoundContainer = connect(mapStateToRateManagerNoResultsFoundComponentProps)(RateManagerNoResultsFoundComponent);