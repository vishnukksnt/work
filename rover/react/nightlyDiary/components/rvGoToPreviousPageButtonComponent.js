"use strict";

var GoToPreviousPageButtonComponent = function GoToPreviousPageButtonComponent(_ref) {
    var goToPrevButtonClicked = _ref.goToPrevButtonClicked,
        perPage = _ref.perPage;
    return React.createElement(
        "div",
        { className: "grid-pagination top" },
        React.createElement(
            "button",
            { type: "button", className: "button blue", onClick: function onClick(e) {
                    return goToPrevButtonClicked(e);
                } },
            "Prev " + perPage + " Rooms"
        )
    );
};

var _React = React,
    PropTypes = _React.PropTypes;


GoToPreviousPageButtonComponent.propTypes = {
    goToPrevButtonClicked: PropTypes.func,
    perPage: PropTypes.number
};