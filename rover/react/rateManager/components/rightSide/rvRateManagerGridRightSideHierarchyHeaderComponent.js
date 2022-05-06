"use strict";

var _React = React,
    createClass = _React.createClass;
var _ReactDOM = ReactDOM,
    findDOMNode = _ReactDOM.findDOMNode;


var RateManagerGridRightSideHierarchyHeaderComponent = createClass({
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
			{ className: 'calendar-rate-table calendar-rate-table-days scrollable ' + this.props.frozenPanelClass + this.props.hierarchyRestrictionClass },
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
					React.createElement(
						"tbody",
						null,
						this.props.showHouse && React.createElement(RateManagerHierarchyHouseHeaderContainer, null),
						this.props.showRoomType && React.createElement(RateManagerHierarchyRoomTypeHeaderContainer, null),
						this.props.showRateType && React.createElement(RateManagerHierarchyRateTypeHeaderContainer, null),
						this.props.showRate && React.createElement(RateManagerHierarchyRateHeaderContainer, null),
						this.props.showAllRoomTypes && React.createElement(RateManagerGridRightSideHeaderAllRoomTypesContainer, null)
					)
				),
				(this.props.mode === RM_RX_CONST.RATE_VIEW_MODE || this.props.mode === RM_RX_CONST.RATE_TYPE_VIEW_MODE) && React.createElement(RateManagerGridRightSideAvailableRoomsHeaderContainer, null)
			)
		);
	}
});