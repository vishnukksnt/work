"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _React = React,
    PropTypes = _React.PropTypes;

var NightlyDiaryRoomsSuitTooltipComponent = function (_React$Component) {
    _inherits(NightlyDiaryRoomsSuitTooltipComponent, _React$Component);

    function NightlyDiaryRoomsSuitTooltipComponent(props) {
        _classCallCheck(this, NightlyDiaryRoomsSuitTooltipComponent);

        return _possibleConstructorReturn(this, (NightlyDiaryRoomsSuitTooltipComponent.__proto__ || Object.getPrototypeOf(NightlyDiaryRoomsSuitTooltipComponent)).call(this, props));
    }

    _createClass(NightlyDiaryRoomsSuitTooltipComponent, [{
        key: "componentDidMount",
        value: function componentDidMount() {
            if (this.shouldAddTopClassName()) {
                $(this.props.clickedElement).parent().parent().find(".suites-rooms").addClass("top");
            } else {
                $(this.props.clickedElement).parent().parent().find(".suites-rooms").removeClass("top");
            }
        }
    }, {
        key: "shouldAddTopClassName",
        value: function shouldAddTopClassName() {
            var shouldAdd = false,
                $this = $(this.props.clickedElement),
                $suites = $(this.props.clickedElement).parent().parent().find('.suites-rooms'),
                top = $this.offset().top,
                timelineTop = $(".grid-timeline").offset().top,
                difference = top - timelineTop,
                suitesHeight = $suites.height();

            if (suitesHeight > difference) {
                shouldAdd = true;
            }

            return shouldAdd;
        }
    }, {
        key: "getRoomIndicatorContainerDivClassName",
        value: function getRoomIndicatorContainerDivClassName(isConnected, isSuite) {
            var className = 'suites-rooms';

            if (isConnected && isSuite) {
                className += ' is-suite connected';
            } else if (isConnected) {
                className += ' connected';
            } else if (isSuite) {
                className += ' is-suite';
            }

            return className;
        }
    }, {
        key: "renderConnectedRooms",
        value: function renderConnectedRooms(connectedRooms) {
            return React.createElement(
                "div",
                { className: "connected-indicator" },
                React.createElement(
                    "strong",
                    null,
                    "Connected Rooms"
                ),
                React.createElement(
                    "div",
                    { "class": "rooms" },
                    connectedRooms.map(function (roomNo) {
                        return React.createElement(
                            "span",
                            { className: "suite-room" },
                            React.createElement("span", { className: "icons icon-suite-connected" }),
                            " ",
                            roomNo
                        );
                    })
                )
            );
        }
    }, {
        key: "renderConnectedView",
        value: function renderConnectedView(isConnected, isSuite) {
            return React.createElement(
                "div",
                { className: this.getRoomIndicatorContainerDivClassName(isConnected, isSuite) },
                this.renderConnectedRooms(this.props.connectedRooms)
            );
        }
    }, {
        key: "renderSuiteView",
        value: function renderSuiteView(isConnected, isSuite) {
            return React.createElement(
                "div",
                { className: this.getRoomIndicatorContainerDivClassName(isConnected, isSuite) },
                React.createElement(
                    "strong",
                    null,
                    "Suite Rooms"
                ),
                React.createElement(
                    "div",
                    { className: "rooms" },
                    this.props.suites.map(function (suiteItem) {
                        return React.createElement(
                            "span",
                            { className: "suite-room" },
                            React.createElement("span", { className: "icons icon-suite-white" }),
                            " ",
                            React.createElement(
                                "span",
                                null,
                                suiteItem.room_no
                            )
                        );
                    })
                )
            );
        }
    }, {
        key: "renderSuiteAndConnectedView",
        value: function renderSuiteAndConnectedView(isConnected, isSuite) {
            return React.createElement(
                "div",
                { className: this.getRoomIndicatorContainerDivClassName(isConnected, isSuite) },
                React.createElement(
                    "div",
                    { className: "suite-indicator" },
                    React.createElement(
                        "strong",
                        null,
                        "Suite Rooms"
                    ),
                    React.createElement(
                        "div",
                        { className: "rooms" },
                        this.props.suites.map(function (suiteItem) {
                            return React.createElement(
                                "span",
                                { className: "suite-room" },
                                React.createElement("span", { className: "icons icon-suite-white" }),
                                " ",
                                React.createElement(
                                    "span",
                                    null,
                                    suiteItem.room_no
                                )
                            );
                        })
                    )
                ),
                this.renderConnectedRooms(this.props.connectedRooms)
            );
        }
    }, {
        key: "render",
        value: function render() {
            var isConnected = this.props.connectedRooms.length > 0;
            var isSuite = this.props.suites.length > 0;
            var template = '';

            if (isConnected && isSuite) {
                template = this.renderSuiteAndConnectedView(isConnected, isSuite);
            } else if (isConnected) {
                template = this.renderConnectedView(isConnected, isSuite);
            } else if (isSuite) {
                template = this.renderSuiteView(isConnected, isSuite);
            }

            return template;
        }
    }]);

    return NightlyDiaryRoomsSuitTooltipComponent;
}(React.Component);

NightlyDiaryRoomsSuitTooltipComponent.propTypes = {
    suites: PropTypes.array.isRequired,
    connectedRooms: PropTypes.array.isRequired,
    clickedElement: PropTypes.isRequired
};