"use strict";

var _ReactRedux = ReactRedux,
    connect = _ReactRedux.connect;


var mapStateToRateManagerGridLeftFirstRowComponentProps = function mapStateToRateManagerGridLeftFirstRowComponentProps(state) {
  return {
    text: RM_RX_CONST.VIEW_MODE_TEXT_MAPPINGS[state.mode]
  };
};

var RateManagerGridLeftFirstRowContainer = connect(mapStateToRateManagerGridLeftFirstRowComponentProps)(RateManagerGridLeftFirstRowComponent);