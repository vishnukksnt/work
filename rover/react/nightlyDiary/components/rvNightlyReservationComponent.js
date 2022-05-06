"use strict";

var _React = React,
    createClass = _React.createClass,
    PropTypes = _React.PropTypes;
var _ReactDOM = ReactDOM,
    findDOMNode = _ReactDOM.findDOMNode;

var ReservationComponent = createClass({
    setClassName: function setClassName() {
        if (this.props.isAssignRoomViewActive || this.props.showAvailableOnly) {
            return this.props.reservation.reservationClass + " " + "overlay";
        }

        return this.props.reservation.reservationClass;
    },
    render: function render() {
        var _this = this;

        return this.props.isFromStayCard && this.props.selectedReservationId === this.props.reservation.id ? React.createElement(
            "div",
            { style: this.props.reservation.style, className: this.setClassName(), onTouchEnd: function onTouchEnd() {
                    return _this.props.selectReservation("", _this.props.reservation, _this.props.selectedRoom);
                }, onClick: function onClick() {
                    return _this.props.selectReservation("", _this.props.reservation, _this.props.selectedRoom);
                } },
            React.createElement(
                "div",
                { className: "reservation-data" },
                this.props.reservation.isReservationDayStay ? React.createElement("span", { className: "day-stay-icon" }) : '',
                this.props.reservation.isReservationDayStay || this.props.reservation.numberOfNightsVisibleInGrid === 1 && (this.props.reservation.no_room_move || this.props.reservation.belongs_to_group || this.props.reservation.belongs_to_allotment) ? React.createElement(
                    "span",
                    { className: "name", "data-initials": this.props.reservation.guest_details.short_name },
                    this.props.reservation.guest_details.short_name
                ) : this.props.reservation.numberOfNightsVisibleInGrid === 0 ? React.createElement(
                    "span",
                    { className: "name", "data-initials": this.props.reservation.guest_details.short_name },
                    this.props.reservation.guest_details.short_name
                ) : React.createElement(
                    "span",
                    { className: "name" },
                    this.props.reservation.guest_details.full_name
                ),
                this.props.reservation.is_vip ? React.createElement(
                    "span",
                    { className: "vip" },
                    "VIP"
                ) : ''
            ),
            this.props.reservation.belongs_to_allotment || this.props.reservation.belongs_to_group || this.props.reservation.no_room_move || this.props.reservation.is_suite_reservation ? React.createElement(
                "div",
                { className: "reservation-icons" },
                this.props.reservation.no_room_move ? React.createElement("span", { className: "icons icon-diary-lock" }) : '',
                this.props.reservation.belongs_to_group ? React.createElement("span", { className: "icons icon-group-large" }) : '',
                this.props.reservation.belongs_to_allotment ? React.createElement("span", { className: "icons icon-allotment-large" }) : '',
                this.props.reservation.is_suite_reservation ? React.createElement(
                    "span",
                    { className: "suite-room" },
                    this.props.reservation.suite_room_details.map(function (suiteItem) {
                        return React.createElement(
                            "span",
                            null,
                            React.createElement("span", { className: "icons icon-suite-white" }),
                            suiteItem.room_no
                        );
                    })
                ) : ''
            ) : ''
        ) : React.createElement(
            "div",
            { style: this.props.reservation.style, className: this.setClassName(), onTouchEnd: function onTouchEnd(e) {
                    return _this.props.selectReservation(e, _this.props.reservation, _this.props.selectedRoom);
                }, onClick: function onClick(e) {
                    return _this.props.selectReservation(e, _this.props.reservation, _this.props.selectedRoom);
                } },
            React.createElement(
                "div",
                { className: "reservation-data" },
                this.props.reservation.isReservationDayStay ? React.createElement("span", { className: "day-stay-icon" }) : '',
                this.props.reservation.isReservationDayStay || this.props.reservation.numberOfNightsVisibleInGrid === 1 && (this.props.reservation.no_room_move || this.props.reservation.belongs_to_group || this.props.reservation.belongs_to_allotment) && this.props.gridDays === NIGHTLY_DIARY_CONST.DAYS_7 || this.props.reservation.numberOfNightsVisibleInGrid <= 2 && (this.props.reservation.no_room_move || this.props.reservation.belongs_to_group || this.props.reservation.belongs_to_allotment) && this.props.gridDays === NIGHTLY_DIARY_CONST.DAYS_21 ? React.createElement(
                    "span",
                    { className: "name", "data-initials": this.props.reservation.guest_details.short_name },
                    this.props.reservation.guest_details.short_name
                ) : this.props.reservation.numberOfNightsVisibleInGrid === 0 ? React.createElement(
                    "span",
                    { className: "name", "data-initials": this.props.reservation.guest_details.short_name },
                    this.props.reservation.guest_details.short_name
                ) : React.createElement(
                    "span",
                    { className: "name" },
                    this.props.reservation.guest_details.full_name,
                    " "
                ),
                this.props.reservation.is_vip ? React.createElement(
                    "span",
                    { className: "vip" },
                    "VIP"
                ) : ''
            ),
            this.props.reservation.belongs_to_allotment || this.props.reservation.belongs_to_group || this.props.reservation.no_room_move || this.props.reservation.is_suite_reservation ? React.createElement(
                "div",
                { className: "reservation-icons" },
                this.props.reservation.no_room_move ? React.createElement("span", { className: "icons icon-diary-lock" }) : '',
                this.props.reservation.belongs_to_group ? React.createElement("span", { className: "icons icon-group-large" }) : '',
                this.props.reservation.belongs_to_allotment ? React.createElement("span", { className: "icons icon-allotment-large" }) : '',
                this.props.reservation.is_suite_reservation ? React.createElement(
                    "span",
                    { className: "suite-room" },
                    this.props.reservation.suite_room_details.map(function (suiteItem) {
                        return React.createElement(
                            "span",
                            null,
                            React.createElement("span", { className: "icons icon-suite-white" }),
                            suiteItem.room_no
                        );
                    })
                ) : ''
            ) : ''
        );
    }
});