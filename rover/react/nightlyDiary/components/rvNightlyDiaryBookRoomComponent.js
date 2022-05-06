'use strict';

var _React = React,
    createClass = _React.createClass;


var NightlyDiaryBookRoomComponent = createClass({
    getStyles: function getStyles() {
        var width = this.props.uar_data.style.width;
        var position = this.props.uar_data.style.transform;
        var style = {
            width: width,
            transform: position
        };

        return style;
    },
    getClassName: function getClassName() {
        var className = 'reservation unassigned ';

        if (this.props.type === 'OVERBOOK') {
            className += 'overbook';
        } else if (this.props.type === 'OVERBOOK_DISABLED') {
            className += 'overbook-disabled disable-element';
        }
        return className;
    },
    getButtonName: function getButtonName() {
        var buttonName = 'OVERBOOK';

        if (this.props.type === 'BOOK') {
            buttonName = 'BOOK';
        }
        return buttonName;
    },
    render: function render() {
        var _this = this;

        return React.createElement(
            'div',
            { style: this.getStyles(),
                className: this.getClassName(),
                onClick: function onClick() {
                    return _this.props.bookRoom(_this.props.roomDetails, _this.props.roomTypeDetails, _this.props.type);
                }
            },
            React.createElement(
                'div',
                { className: 'reservation-data' },
                React.createElement(
                    'span',
                    { className: 'name' },
                    this.getButtonName(),
                    ' ',
                    this.props.roomDetails.room_no
                )
            )
        );
    }
});