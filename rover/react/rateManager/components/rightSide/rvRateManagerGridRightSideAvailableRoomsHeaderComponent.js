"use strict";

var _React = React,
    createClass = _React.createClass;


var RateManagerGridRightSideAvailableRoomsHeaderComponent = createClass({
    render: function render() {
        return React.createElement(
            "table",
            { className: "rate-calendar rate-calendar-availability" },
            React.createElement(
                "tbody",
                null,
                React.createElement(
                    "tr",
                    { className: "last" },
                    this.props.houseAvailability && this.props.houseAvailability.map(function (availability, colIdx) {
                        return React.createElement(
                            "td",
                            { className: "cell", key: 'house-available-' + colIdx },
                            React.createElement(
                                "div",
                                { className: 'cell-container ' + availability.headerClass },
                                React.createElement(
                                    "div",
                                    { className: "cell-content" },
                                    availability.count
                                )
                            )
                        );
                    })
                )
            )
        );
    }
});