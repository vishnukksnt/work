"use strict";

var _ReactRedux = ReactRedux,
    connect = _ReactRedux.connect;


var mapStateToRateManagerActivityIndicatorComponentProps = function mapStateToRateManagerActivityIndicatorComponentProps(state) {
  return {
    showLoader: state.loader === RM_RX_CONST.ACTIVATE_LOADER
  };
};
var RateManagerActivityIndicatorContainer = connect(mapStateToRateManagerActivityIndicatorComponentProps)(RateManagerActivityIndicatorComponent);