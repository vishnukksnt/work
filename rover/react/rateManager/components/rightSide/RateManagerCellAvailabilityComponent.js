'use strict';

var RateManagerCellAvailabilityComponent = function RateManagerCellAvailabilityComponent(_ref) {
    var availability = _ref.availability;
    return React.createElement(
        'span',
        { className: 'cell-availability ' + (availability < 1 ? 'red' : '') },
        availability
    );
};