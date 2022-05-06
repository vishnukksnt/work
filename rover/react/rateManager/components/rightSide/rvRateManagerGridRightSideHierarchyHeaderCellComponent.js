'use strict';

var RateManagerGridRightSideHierarchyHeaderCellComponent = function RateManagerGridRightSideHierarchyHeaderCellComponent(_ref) {
    var onTdClick = _ref.onTdClick,
        restrictionSummary = _ref.restrictionSummary,
        dateList = _ref.dateList;
    return React.createElement(
        'tr',
        null,
        restrictionSummary.length && restrictionSummary[0].restrictionList.map(function (eachDayRestrictions, colIndex) {
            return React.createElement(
                'td',
                { onClick: function onClick(e) {
                        return onTdClick(e, colIndex);
                    }, key: 'key-' + colIndex, className: 'cell' },
                React.createElement(
                    'div',
                    { className: 'cell-container ' + (dateList[colIndex].isWeekEnd ? 'weekend_day' : '') },
                    React.createElement(
                        'div',
                        { className: 'cell-content ' + (dateList[colIndex].isPastDate ? 'isHistory-cell-content' : '') },
                        eachDayRestrictions.map(function (restriction, restrictionIndex) {
                            return React.createElement(RateManagerRestrictionIconComponent, {
                                key: 'key-' + restrictionIndex,
                                className: '' + restriction.className,
                                text: restriction.days });
                        })
                    )
                )
            );
        })
    );
};