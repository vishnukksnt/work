'use strict';

var RateManagerGridLeftSideHeadButtonComponent = function RateManagerGridLeftSideHeadButtonComponent(_ref) {
    var shouldShowPagination = _ref.shouldShowPagination,
        goToPrevPage = _ref.goToPrevPage,
        goToNextPage = _ref.goToNextPage,
        isFirstPage = _ref.isFirstPage,
        isLastPage = _ref.isLastPage,
        prevPageButtonText = _ref.prevPageButtonText,
        nextPageButtonText = _ref.nextPageButtonText;
    return React.createElement(
        'div',
        { className: 'pinnedLeft-actions' },
        shouldShowPagination ? React.createElement(
            'div',
            null,
            isFirstPage ? '' : React.createElement(
                'button',
                { className: 'button blue prev',
                    onTouchEnd: function onTouchEnd(e) {
                        e.stopPropagation();
                        goToPrevPage(e);
                    },
                    onClick: function onClick(e) {
                        e.stopPropagation();
                        goToPrevPage(e);
                    } },
                prevPageButtonText
            ),
            isLastPage ? '' : React.createElement(
                'button',
                { className: 'button blue next',
                    onTouchEnd: function onTouchEnd(e) {
                        e.stopPropagation();
                        goToNextPage(e);
                    },
                    onClick: function onClick(e) {
                        e.stopPropagation();
                        goToNextPage(e);
                    } },
                nextPageButtonText
            )
        ) : ''
    );
};