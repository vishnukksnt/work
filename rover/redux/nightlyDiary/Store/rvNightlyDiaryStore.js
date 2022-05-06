"use strict";

var _Redux = Redux,
    createStore = _Redux.createStore,
    applyMiddleware = _Redux.applyMiddleware,
    compose = _Redux.compose;


var finalCreateStore = compose(applyMiddleware(ReduxThunk.default), window.devToolsExtension ? window.devToolsExtension() : function (f) {
    return f;
})(createStore);

var configureDiaryStore = function configureDiaryStore(initialState) {
    return finalCreateStore(nightlyDiaryRootReducer, initialState);
};