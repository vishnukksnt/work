'use strict';

var callBackReducer = function callBackReducer() {
    var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    var action = arguments[1];

    switch (action.type) {
        case 'DIARY_VIEW_CHANGED':
            return action.callBackFromAngular;
        case 'RESERVATION_SELECTED':
            return state.callBackFromAngular;
        default:
            return state.callBackFromAngular;
    }
};