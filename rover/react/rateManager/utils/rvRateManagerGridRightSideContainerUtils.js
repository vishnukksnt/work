'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var rvRateManagerRightSideContainerUtils = function rvRateManagerRightSideContainerUtils() {
	var self = this;

	/**
  * we need date related information in restriction list view(like is week end or past date..)
  * @param  {array} dateList
  * @param  {Object} businessDate
  * @return {array}
  */
	self.convertDateListForRestrictionView = function (dateList, businessDate, weekendDays) {
		// we will compute date related information first and will use this information in
		// the view component
		var newDateList = [],
		    copiedDate = null,
		    copiedDateComponents = null,
		    isWeekEnd = false,
		    isPastDate = false;

		dateList.map(function (date) {
			copiedDate = tzIndependentDate(date);
			copiedDateComponents = copiedDate.toComponents().date; // refer util.js in diary folder
			isWeekEnd = isWeekendDay(weekendDays, copiedDate); // util function to check if weekend day
			isPastDate = copiedDate < businessDate;
			newDateList.push({
				date: copiedDate,
				isWeekEnd: isWeekEnd,
				isPastDate: isPastDate
			});
		});

		return newDateList;
	};

	/**
  * convert data coming from reducer to props for restriction only displaying
  * @param  {array} listingData
  * @param  {array} restrictionTypes
  * @return {array}
  */
	self.convertDataForRestrictionListing = function (listingData, restrictionTypes, forPanel) {
		// adding the css class and all stuff for restriction types
		restrictionTypes = restrictionTypes.map(function (restrictionType) {
			return _extends({}, restrictionType, RateManagerRestrictionTypes[restrictionType.value]);
		});

		var restrictionTypeIDS = _.pluck(restrictionTypes, 'id'),
		    restrictionTypesBasedOnIDs = _.object(restrictionTypeIDS, restrictionTypes); // for quicker access

		var restrictionForMoreThanMaxAllowed = RateManagerRestrictionTypes['MORE_RESTRICTIONS'];

		restrictionForMoreThanMaxAllowed.days = restrictionForMoreThanMaxAllowed.defaultText;

		listingData = listingData.map(function (data) {
			data.restrictionList = data.restrictionList.map(function (dayRestrictionList, index) {
				// If we cross max restriction allowed in a single column, we will replace with single restriction
				if (forPanel) {
					if (dayRestrictionList.length > RM_RX_CONST.MAX_RESTRICTION_IN_COLUMN) {
						return [_extends({}, restrictionForMoreThanMaxAllowed)];
					}
					return dayRestrictionList.map(function (restriction) {
						var panelRestriction = _extends({}, restriction, restrictionTypesBasedOnIDs[restriction.restriction_type_id]);

						if (panelRestriction.days && panelRestriction.days.length > 1) {
							panelRestriction.days = restrictionForMoreThanMaxAllowed.days;
							panelRestriction.defaultText = restrictionForMoreThanMaxAllowed.defaultText;
							panelRestriction.description = restrictionForMoreThanMaxAllowed.description;
						} else if (panelRestriction.days && panelRestriction.days.length === 1) {
							panelRestriction.days = panelRestriction.days[0];
						}

						return panelRestriction;
					});
				}
				if (dayRestrictionList.length >= RM_RX_CONST.MAX_RESTRICTION_IN_COLUMN) {
					return [_extends({}, restrictionForMoreThanMaxAllowed)];
				}
				return dayRestrictionList.map(function (restriction) {
					return _extends({}, restriction, restrictionTypesBasedOnIDs[restriction.restriction_type_id]);
				});
			});
			return data;
		});

		return listingData;
	};

	return {
		convertDateListForRestrictionView: self.convertDateListForRestrictionView,
		convertDataForRestrictionListing: self.convertDataForRestrictionListing
	};
};