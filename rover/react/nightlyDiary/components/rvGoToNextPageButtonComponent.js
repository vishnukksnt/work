"use strict";

var GoToNextPageButtonComponent = function GoToNextPageButtonComponent(_ref) {
    var goToNextButtonClicked = _ref.goToNextButtonClicked,
        nextPageItemCount = _ref.nextPageItemCount;
    return React.createElement(
        "div",
        { className: "grid-pagination bottom" },
        React.createElement(
            "button",
            { type: "button", className: "button blue", onClick: function onClick(e) {
                    return goToNextButtonClicked(e);
                } },
            'Next ' + nextPageItemCount + ' Rooms'
        )
    );
};

var _React = React,
    PropTypes = _React.PropTypes;


GoToNextPageButtonComponent.propTypes = {
    goToNextButtonClicked: PropTypes.func,
    NextPageItemCount: PropTypes.number
};