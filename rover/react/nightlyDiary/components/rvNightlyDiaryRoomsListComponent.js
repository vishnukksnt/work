'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _React = React,
    PropTypes = _React.PropTypes;

/**
 * Component to display room list at left side of diary grid
 * Component with local state since it is presentational only.
 */

var NightlyDiaryRoomsListComponent = function (_React$Component) {
    _inherits(NightlyDiaryRoomsListComponent, _React$Component);

    /**
     * [constructor description]
     * @param  {[type]} props [description]
     * @return {[type]}       [description]
     */
    function NightlyDiaryRoomsListComponent(props) {
        _classCallCheck(this, NightlyDiaryRoomsListComponent);

        var _this = _possibleConstructorReturn(this, (NightlyDiaryRoomsListComponent.__proto__ || Object.getPrototypeOf(NightlyDiaryRoomsListComponent)).call(this, props));

        _this.state = {
            selectedRoom: null,
            clickedElement: null
        };
        return _this;
    }

    /**
     * [showSuitRoomsList description]
     * @param {Number} index [description]
     * @return {Undefined} [description]
     */


    _createClass(NightlyDiaryRoomsListComponent, [{
        key: 'setSelectedRoom',
        value: function setSelectedRoom(index, event) {
            this.setState({
                selectedRoom: index === this.state.selectedRoom ? null : index,
                clickedElement: event.target
            });
        }

        /**
         * Show the room status and service status update popup
         * @param {Object} item - room object
         * @return {void}
         */

    }, {
        key: 'showRoomStatusUpdatePopup',
        value: function showRoomStatusUpdatePopup(item) {
            this.props.showUpdateRoomStatusAndServicePopup(item);
        }
    }, {
        key: 'getSuiteRoomClassName',
        value: function getSuiteRoomClassName(item) {
            var className = 'suite-room';

            if (item.isSuitesAvailable && item.connecting_room_no.length > 0) {
                className += ' suite-and-connected';
            }
            return className;
        }

        /**
         * [renderRoom description]
         * @param {Object} item roomData
         * @param {Number} index item index on list
         * @return {Object} React element
         */

    }, {
        key: 'renderRoom',
        value: function renderRoom(item, index) {
            var isSelected = this.state.selectedRoom === index;
            var isSuite = item.isSuitesAvailable;
            var isConnected = item.connecting_room_no.length > 0;
            var isBothSuiteAndConnected = isSuite && isConnected;
            var clickedElement = this.state.clickedElement;

            var couchIcon = isSuite || isConnected || isBothSuiteAndConnected ? React.createElement(
                'span',
                { className: this.getSuiteRoomClassName(item), onClick: this.setSelectedRoom.bind(this, index) },
                isSuite || isBothSuiteAndConnected ? React.createElement('span', { className: 'icons icon-suite-white' }) : null,
                isConnected || isBothSuiteAndConnected ? React.createElement('span', { className: 'icons icon-suite-connected' }) : null
            ) : null;

            return React.createElement(
                'div',
                { className: item.main_room_class, key: index },
                React.createElement(
                    'span',
                    { className: item.room_class, onClick: this.showRoomStatusUpdatePopup.bind(this, item) },
                    item.room_no
                ),
                React.createElement(
                    'span',
                    { className: 'room-type' },
                    item.room_type_name
                ),
                React.createElement(
                    'div',
                    { className: 'suites' },
                    couchIcon,
                    isSelected ? React.createElement(NightlyDiaryRoomsSuitTooltipComponent, { suites: item.suite_room_details, connectedRooms: item.connecting_room_no, clickedElement: clickedElement }) : null
                )
            );
        }

        /**
         * [render description]
         * @return {[type]} [description]
         */

    }, {
        key: 'render',
        value: function render() {
            return React.createElement(
                'div',
                { className: 'grid-rooms' },
                this.props.roomListToComponent.map(this.renderRoom.bind(this))
            );
        }
    }]);

    return NightlyDiaryRoomsListComponent;
}(React.Component);

NightlyDiaryRoomsListComponent.propTypes = {
    roomListToComponent: PropTypes.array.isRequired
};