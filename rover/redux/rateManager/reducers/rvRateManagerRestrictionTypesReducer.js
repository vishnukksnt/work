'use strict';

/**
 * to get the valid restriction type that we need to show
 * @param {array} restrictionTypes
 * @return {array} [valid restrictionTypes]
 */
var getValidRestrictionTypes = function getValidRestrictionTypes(restrictionTypes) {
  return _.chain(restrictionTypes).filter({ 'activated': true }).filter({ 'editable': false }).sortBy('id').value();
};

var rateManagerRestrictionTypesReducer = function rateManagerRestrictionTypesReducer(state, action) {

  switch (action.type) {
    case RM_RX_CONST.RATE_VIEW_CHANGED:
    case RM_RX_CONST.ROOM_TYPE_VIEW_CHANGED:
    case RM_RX_CONST.RATE_TYPE_VIEW_CHANGED:
    case RM_RX_CONST.SINGLE_RATE_EXPANDABLE_VIEW_CHANGED:
      return getValidRestrictionTypes(action.restrictionTypes);

    default:
      return state;
  }
};