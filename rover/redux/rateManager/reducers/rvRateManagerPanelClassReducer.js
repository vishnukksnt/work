'use strict';

var rateManagerPanelClassReducer = function rateManagerPanelClassReducer(state, action) {
    switch (action.type) {
        case RM_RX_CONST.HIERARCHY_FROZEN_PANEL_TOGGLED:
            return action.frozenPanelClosed ? '' : 'opened ';
        default:
            return state.frozenPanelClass;
    }
};