"use strict";

var _React = React,
    createClass = _React.createClass;


var NightlyDiaryHourlyComponent = createClass({
    render: function render() {
        return React.createElement(
            "div",
            {
                style: {
                    width: this.props.hourly_data.style.width,
                    transform: this.props.hourly_data.style.transform
                },
                className: this.props.hourly_data.reservationClass
            },
            React.createElement(
                "div",
                { className: "reservation-data" },
                React.createElement("span", { className: "day-stay-icon" })
            )
        );
    }
});