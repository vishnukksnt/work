'use strict';

var RateManagerLeftHierarchyHeaderComponent = function RateManagerLeftHierarchyHeaderComponent(_ref) {
    var activeRestrictions = _ref.activeRestrictions;
    return React.createElement(
        'div',
        { className: 'pinnedLeft-select-container' },
        activeRestrictions.map(function (restrictionName, index) {
            return React.createElement(
                'div',
                { className: 'pinnedLeft-select' + (index === activeRestrictions.length - 1 ? ' last' : '') },
                React.createElement(
                    'span',
                    { className: 'name' },
                    restrictionName
                )
            );
        })
    );
};