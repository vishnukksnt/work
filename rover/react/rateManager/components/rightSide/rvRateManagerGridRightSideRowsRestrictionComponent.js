'use strict';

var RateManagerGridRightSideRowsRestrictionComponent = function RateManagerGridRightSideRowsRestrictionComponent(_ref) {
	var onTdClick = _ref.onTdClick,
	    mode = _ref.mode,
	    restrictionRows = _ref.restrictionRows,
	    dateList = _ref.dateList,
	    showAvailability = _ref.showAvailability;
	return React.createElement(
		'tbody',
		null,
		restrictionRows.map(function (rateData, rowIndex) {
			return React.createElement(
				'tr',
				{ key: 'key-' + rowIndex,
					className: rowIndex + 1 === restrictionRows.length ? 'last' : '' },
				rateData.restrictionList.map(function (eachDayRestrictions, colIndex) {
					return React.createElement(
						'td',
						{ onClick: function onClick(e) {
								return onTdClick(e, rowIndex, colIndex);
							}, key: 'key-' + colIndex, className: 'cell' },
						React.createElement(
							'div',
							{ className: 'cell-container ' + (dateList[colIndex].isWeekEnd ? 'weekend_day' : '') },
							React.createElement(
								'div',
								{ className: 'cell-content ' + (dateList[colIndex].isPastDate ? 'isHistory-cell-content' : '') },
								showAvailability && rateData.availabilityList && rateData.availabilityList[colIndex] !== null && React.createElement(RateManagerCellAvailabilityComponent, { availability: rateData.availabilityList[colIndex] }),
								!rateData.amountList || rateData.amountList[colIndex] === null ? React.createElement(RateManagerCellsNoRateComponent, null) : React.createElement(RateManagerCellsRateComponent, {
									amount: rateData.amountList[colIndex] }),
								React.createElement(
									'div',
									{ className: 'restriction_holder' },
									eachDayRestrictions.map(function (restriction, restrictionIndex) {
										return React.createElement(RateManagerRestrictionIconComponent, {
											key: 'key-' + restrictionIndex,
											className: '' + restriction.className,
											text: restriction.days });
									})
								)
							)
						)
					);
				})
			);
		})
	);
};