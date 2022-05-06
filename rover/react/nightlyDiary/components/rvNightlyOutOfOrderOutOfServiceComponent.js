"use strict";

var _React = React,
    createClass = _React.createClass,
    PropTypes = _React.PropTypes;
var _ReactDOM = ReactDOM,
    findDOMNode = _ReactDOM.findDOMNode;

var OutOfOrderOutOfServiceComponent = createClass({
    render: function render() {
        return React.createElement(
            "div",
            { style: this.props.ooo_oos.style, className: this.props.classForDiv },
            this.props.ooo_oos_data.hk_service_status === "OUT_OF_SERVICE" ? React.createElement(
                "span",
                { className: "name", "data-initials": "OOS" },
                "Out Of Service"
            ) : React.createElement(
                "span",
                { className: "name", "data-initials": "OOO" },
                "Out Of Order"
            )
        );
    }
});