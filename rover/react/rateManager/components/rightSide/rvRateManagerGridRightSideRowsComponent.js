"use strict";

var _React = React,
    createClass = _React.createClass;
var _ReactDOM = ReactDOM,
    findDOMNode = _ReactDOM.findDOMNode;


var RateManagerGridRightSideRowsComponent = createClass({
	componentDidMount: function componentDidMount() {
		this.setWidth();
		this.props.hideLoader();
	},
	componentDidUpdate: function componentDidUpdate() {
		this.setWidth();
		this.props.refreshScrollers();
		this.props.hideLoader();
	},
	shouldComponentUpdate: function shouldComponentUpdate(nextProp, nextState) {
		return !(nextProp.action === RM_RX_CONST.REFRESH_SCROLLERS);
	},
	setWidth: function setWidth() {
		var myDomNode = $(findDOMNode(this)),
		    tableElement = myDomNode.parents(".rate-calendar")[0],
		    tableParentElement = myDomNode.parents(".wrapper")[0];

		tableParentElement.style.width = tableElement.offsetWidth + 'px';
	},
	render: function render() {
		var mode = this.props.mode;

		if (mode === RM_RX_CONST.RATE_VIEW_MODE || mode === RM_RX_CONST.ROOM_TYPE_VIEW_MODE || mode === RM_RX_CONST.RATE_TYPE_VIEW_MODE) {
			return React.createElement(RateManagerGridRightSideRowsRestrictionContainer, null);
		}
		if (mode === RM_RX_CONST.SINGLE_RATE_EXPANDABLE_VIEW_MODE) {
			return React.createElement(RateManagerGridRightSideRowsRestrictionListAndAmountContainer, null);
		}
	}
});