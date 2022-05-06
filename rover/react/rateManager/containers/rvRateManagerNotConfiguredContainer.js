"use strict";

var _ReactRedux = ReactRedux,
    connect = _ReactRedux.connect;


var mapStateToRateManagerNotConfiguredComponentProps = function mapStateToRateManagerNotConfiguredComponentProps(state) {
  return {
    shouldShow: state.mode === RM_RX_CONST.NOT_CONFIGURED_MODE
  };
};

var RateManagerNotConfiguredContainer = connect(mapStateToRateManagerNotConfiguredComponentProps)(RateManagerNotConfiguredComponent);