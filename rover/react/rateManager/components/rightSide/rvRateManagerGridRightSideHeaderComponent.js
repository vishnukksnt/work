"use strict";

var _React = React,
    createClass = _React.createClass;
var _ReactDOM = ReactDOM,
    findDOMNode = _ReactDOM.findDOMNode;


var RateManagerGridRightSideHeaderComponent = createClass({
	componentDidMount: function componentDidMount() {
		this.setWidth();
	},
	componentDidUpdate: function componentDidUpdate() {
		this.setWidth();
	},
	setWidth: function setWidth() {
		var myDomNode = $(findDOMNode(this)),
		    tableParentElement = myDomNode.find(".wrapper")[0],
		    tableElement = myDomNode.find(".rate-calendar")[0];

		tableParentElement.style.width = tableElement.offsetWidth + 'px';
	},
	render: function render() {
		var _this = this;

		return React.createElement(
			"div",
			{ className: "calendar-rate-table calendar-rate-table-days scrollable" },
			React.createElement(
				"div",
				{ className: "wrapper" },
				React.createElement(
					"table",
					{ className: "rate-calendar" },
					React.createElement(
						"thead",
						null,
						React.createElement(
							"tr",
							{ className: "cell" },
							this.props.headerDataList.map(function (headerData, index) {
								return React.createElement(
									"th",
									{ className: headerData.headerClass, key: "header-data-" + index },
									React.createElement(
										"div",
										{ className: "date-header" },
										headerData.eventCount !== 0 && React.createElement(
											"div",
											{ onClick: function onClick() {
													return _this.props.onDailyEventCountClick(headerData.date);
												}, "data-events": headerData.eventCount, className: "has-event-block border" },
											React.createElement(
												"div",
												{ className: headerData.cellClass },
												React.createElement(
													"span",
													{ className: headerData.topLabelContainerClass },
													headerData.topLabel
												),
												React.createElement(
													"span",
													{ className: headerData.bottomLabelContainerClass },
													headerData.bottomLabel
												)
											)
										),
										headerData.eventCount === 0 && React.createElement(
											"div",
											{ className: headerData.cellClass },
											React.createElement(
												"span",
												{ className: headerData.topLabelContainerClass },
												headerData.topLabel
											),
											React.createElement(
												"span",
												{ className: headerData.bottomLabelContainerClass },
												headerData.bottomLabel
											)
										)
									)
								);
							})
						)
					),
					!this.props.hideTopHeader && React.createElement(
						"tbody",
						null,
						this.props.summary.map(function (summaryData, rowIndex) {
							return React.createElement(
								"tr",
								{ key: 'key-' + rowIndex, className: rowIndex + 1 === _this.props.summary.length ? 'last' : '' },
								summaryData.restrictionList.map(function (eachDayRestrictions, colIndex) {
									return React.createElement(
										"td",
										{ onClick: function onClick(e) {
												return _this.props.onTdClick(e, rowIndex, colIndex);
											}, key: 'key-' + colIndex, className: "cell" },
										React.createElement(
											"div",
											{ className: 'cell-container ' + (_this.props.dateList[colIndex].isWeekEnd ? 'weekend_day' : '') },
											React.createElement(
												"div",
												{ className: 'cell-content ' + (_this.props.dateList[colIndex].isPastDate ? 'isHistory-cell-content' : '') },
												eachDayRestrictions.map(function (restriction, restrictionIndex) {
													return React.createElement(RateManagerRestrictionIconComponent, {
														key: 'key-' + restrictionIndex,
														className: '' + restriction.className,
														text: restriction.days });
												})
											)
										)
									);
								})
							);
						})
					)
				),
				(this.props.mode === RM_RX_CONST.RATE_VIEW_MODE || this.props.mode === RM_RX_CONST.RATE_TYPE_VIEW_MODE) && React.createElement(RateManagerGridRightSideAvailableRoomsHeaderContainer, null)
			)
		);
	}
});