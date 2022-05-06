'use strict';

var paginationDataReducer = function paginationDataReducer() {
    var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    var action = arguments[1];

    switch (action.type) {
        case 'DIARY_VIEW_CHANGED':
            return action.paginationData;
        case 'CANCEL_RESERVATION_EDITING':
            return action.paginationData;
        default:
            return state.paginationData;
    }
};