'use strict';

var RateManagerGridRightSideRowsRestrictionListAndAmountComponent = function RateManagerGridRightSideRowsRestrictionListAndAmountComponent(_ref) {
	var onTdClick = _ref.onTdClick,
	    mode = _ref.mode,
	    roomTypeRowsData = _ref.roomTypeRowsData,
	    dateList = _ref.dateList,
	    showAvailability = _ref.showAvailability;
	return React.createElement(
		'tbody',
		null,
		roomTypeRowsData.map(function (rowData, rowIndex) {
			return React.createElement(
				'tr',
				{ key: 'key-' + rowIndex,
					className: rowIndex + 1 === roomTypeRowsData.length ? 'last' : '' },
				rowData.restrictionList.map(function (eachDayRestrictionData, colIndex) {
					return React.createElement(
						'td',
						{ key: 'key-' + colIndex, onClick: function onClick(e) {
								return onTdClick(e, rowIndex, colIndex);
							}, className: 'cell' },
						React.createElement(
							'div',
							{ className: 'cell-container' + (dateList[colIndex].isWeekEnd ? ' weekend_day' : '') + (rowData.expanded ? ' expanded-cell' : '') },
							rowData.expanded ? React.createElement(
								'div',
								{ className: 'cell-content ' + (dateList[colIndex].isPastDate ? 'isHistory-cell-content' : '') },
								React.createElement(
									'div',
									{ className: 'restriction_holder' },
									eachDayRestrictionData.map(function (restriction, restrictionIndex) {
										return React.createElement(RateManagerRestrictionIconComponent, {
											key: 'key-' + restrictionIndex,
											className: 'right ' + restriction.className,
											text: restriction.days });
									})
								),
								React.createElement(
									'div',
									{ className: 'room-type-price' },
									React.createElement(
										'span',
										{ className: 'room-type-price-name' },
										'Single'
									),
									React.createElement(
										'span',
										{ className: 'room-type-price-value' + (rowData.rateDetails[colIndex].single_overridden ? ' has-override' : '') + (rowData.rateDetails[colIndex].single !== null ? '' : ' hidden') },
										rowData.rateDetails[colIndex].rate_currency,
										rowData.rateDetails[colIndex].single,
										React.createElement('span', { className: "icon-report icon-upsell" + (rowData.rateDetails[colIndex].single_overridden ? '' : ' hidden') })
									)
								),
								React.createElement(
									'div',
									{ className: 'room-type-price' },
									React.createElement(
										'span',
										{ className: 'room-type-price-name' },
										'Double'
									),
									React.createElement(
										'span',
										{ className: 'room-type-price-value' + (rowData.rateDetails[colIndex].double_overridden ? ' has-override' : '') + (rowData.rateDetails[colIndex].double !== null ? '' : ' hidden') },
										rowData.rateDetails[colIndex].rate_currency,
										rowData.rateDetails[colIndex].double,
										React.createElement('span', { className: "icon-report icon-upsell" + (rowData.rateDetails[colIndex].double_overridden ? '' : ' hidden') })
									)
								),
								React.createElement(
									'div',
									{ className: 'room-type-price' },
									React.createElement(
										'span',
										{ className: 'room-type-price-name' },
										'Extra Adult'
									),
									React.createElement(
										'span',
										{ className: 'room-type-price-value' + (rowData.rateDetails[colIndex].extra_adult_overridden ? ' has-override' : '') + (rowData.rateDetails[colIndex].extra_adult !== null ? '' : ' hidden') },
										rowData.rateDetails[colIndex].rate_currency,
										rowData.rateDetails[colIndex].extra_adult,
										React.createElement('span', { className: "icon-report icon-upsell" + (rowData.rateDetails[colIndex].extra_adult_overridden ? '' : ' hidden') })
									)
								),
								React.createElement(
									'div',
									{ className: 'room-type-price' },
									React.createElement(
										'span',
										{ className: 'room-type-price-name' },
										'Child'
									),
									React.createElement(
										'span',
										{ className: 'room-type-price-value' + (rowData.rateDetails[colIndex].child_overridden ? ' has-override' : '') + (rowData.rateDetails[colIndex].child !== null ? '' : ' hidden') },
										rowData.rateDetails[colIndex].rate_currency,
										rowData.rateDetails[colIndex].child,
										React.createElement('span', { className: "icon-report icon-upsell" + (rowData.rateDetails[colIndex].child_overridden ? '' : ' hidden') })
									)
								)
							) : React.createElement(
								'div',
								{ className: 'cell-content ' + (dateList[colIndex].isPastDate ? 'isHistory-cell-content' : '') },
								showAvailability && React.createElement(RateManagerCellAvailabilityComponent, { availability: rowData.availabilityList[colIndex] }),
								React.createElement(
									'span',
									{
										className: 'rate-single' + (rowData.rateDetails[colIndex].single_overridden || rowData.rateDetails[colIndex].child_overridden || rowData.rateDetails[colIndex].extra_adult_overridden || rowData.rateDetails[colIndex].double_overridden ? ' has-override' : '') + (rowData.rateDetails[colIndex].single !== null ? '' : ' hidden')
									},
									rowData.rateDetails[colIndex].rate_currency,
									rowData.rateDetails[colIndex].single,
									React.createElement('span', { className: "icon-report icon-upsell" + (rowData.rateDetails[colIndex].single_overridden || rowData.rateDetails[colIndex].child_overridden || rowData.rateDetails[colIndex].extra_adult_overridden || rowData.rateDetails[colIndex].double_overridden ? '' : ' hidden') })
								),
								React.createElement(
									'div',
									{ className: 'restriction_holder' },
									eachDayRestrictionData.map(function (restriction, restrictionIndex) {
										return React.createElement(RateManagerRestrictionIconComponent, {
											key: 'key-' + restrictionIndex,
											className: 'right ' + restriction.className,
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