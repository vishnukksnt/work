"use strict";

var RateManagerGridLeftRowsComponent = function RateManagerGridLeftRowsComponent(_ref) {
	var leftListingData = _ref.leftListingData,
	    onItemClick = _ref.onItemClick,
	    onItemClickActionType = _ref.onItemClickActionType;
	return React.createElement(
		"tbody",
		null,
		leftListingData.map(function (item, index) {
			return React.createElement(RateManagerGridLeftRowComponent, {
				key: item.id,
				index: index,
				name: item.name,
				trClassName: item.trClassName,
				tdClassName: item.tdClassName,
				onClick: function onClick(e, index) {
					onItemClick(e, index);
				},
				leftSpanClassName: item.leftSpanClassName,
				showIconBeforeText: item.showIconBeforeText,
				iconClassBeforeText: item.iconClassBeforeText,
				textInIconArea: item.textInIconArea,
				leftSpanText: item.leftSpanText,
				showRightSpan: item.showRightSpan,
				rightSpanClassName: item.rightSpanClassName,
				showIndicator: item.showIndicator });
		})
	);
};