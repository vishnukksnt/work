"use strict";

var _React = React,
    createClass = _React.createClass;


var NightlyDiaryMoveRoomComponent = createClass({
    getStyles: function getStyles() {
        var width = this.props.uar_data.style.width;
        var position = this.props.uar_data.style.transform;
        var style = {
            width: width,
            transform: position
        };

        return style;
    },
    render: function render() {
        var _this = this;

        return React.createElement(
            "div",
            { style: this.getStyles(),
                className: "reservation unassigned",
                onClick: function onClick() {
                    return _this.props.moveRoom(_this.props.roomDetails, _this.props.availableSlotsForAssignRooms);
                }
            },
            React.createElement(
                "div",
                { className: "reservation-data" },
                "MOVE TO",
                React.createElement(
                    "span",
                    { className: "name" },
                    this.props.roomDetails.room_number
                )
            )
        );
    }
});