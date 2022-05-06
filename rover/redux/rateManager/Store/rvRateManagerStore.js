'use strict';

var _Redux = Redux,
    createStore = _Redux.createStore,
    applyMiddleware = _Redux.applyMiddleware,
    compose = _Redux.compose;


var finalCreateStore = compose(applyMiddleware(ReduxThunk.default), window.devToolsExtension ? window.devToolsExtension() : function (f) {
  return f;
})(createStore);

var configureStore = function configureStore() {
  var initialState = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { 'mode': RM_RX_CONST.NOT_CONFIGURED };

  return finalCreateStore(rateManagerRootReducer, initialState);
};