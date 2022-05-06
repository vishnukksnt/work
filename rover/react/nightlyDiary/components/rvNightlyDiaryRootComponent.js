"use strict";

var _React = React,
    createClass = _React.createClass,
    PropTypes = _React.PropTypes;
var _ReactDOM = ReactDOM,
    findDOMNode = _ReactDOM.findDOMNode;

var NightlyDiaryRootComponent = createClass({
    scrollToPos: function scrollToPos(pos) {
        var node = document.getElementById('diary-nightly-grid');

        node.scrollTop = pos;
    },
    scrollToNthelement: function scrollToNthelement(n) {
        var width = document.getElementsByClassName("room not-clickable")[0].clientHeight,
            scrollTo = n * width;

        this.scrollToPos(scrollTo);
    },
    componentDidUpdate: function componentDidUpdate() {
        this.scrollToNthelement(this.props.index);
    },
    render: function render() {
        return React.createElement(
            "div",
            { className: "grid-inner" },
            this.props.selectedReservationId !== undefined && this.props.selectedReservationId !== "" ? React.createElement(NightlyDiaryStayRangeContainer, null) : '',
            React.createElement(
                "div",
                { id: "diary-nightly-grid", className: this.props.ClassForRootDiv },
                React.createElement(
                    "div",
                    { className: "wrapper" },
                    this.props.showPrevPageButton ? React.createElement(GoToPreviousPageButtonContainer, null) : '',
                    this.props.showNextPageButton ? React.createElement(GoToNextPageButtonContainer, null) : '',
                    React.createElement(NightlyDiaryRoomsListContainer, null),
                    React.createElement(NightlyDiaryReservationsListContainer, null)
                )
            )
        );
    }
});

NightlyDiaryRootComponent.propTypes = {
    showNextPageButton: PropTypes.bool.isRequired,
    showPrevPageButton: PropTypes.bool.isRequired,
    ClassForRootDiv: PropTypes.string.isRequired,
    scrollTo: PropTypes.object
};