'use strict';

var RateManagerGridLeftRowComponent = function RateManagerGridLeftRowComponent(_ref) {
	var trClassName = _ref.trClassName,
	    tdClassName = _ref.tdClassName,
	    name = _ref.name,
	    _onClick = _ref.onClick,
	    index = _ref.index,
	    leftSpanClassName = _ref.leftSpanClassName,
	    showIconBeforeText = _ref.showIconBeforeText,
	    iconClassBeforeText = _ref.iconClassBeforeText,
	    textInIconArea = _ref.textInIconArea,
	    leftSpanText = _ref.leftSpanText,
	    showRightSpan = _ref.showRightSpan,
	    rightSpanClassName = _ref.rightSpanClassName,
	    showIndicator = _ref.showIndicator;
	return React.createElement(
		'tr',
		{ className: trClassName, onTouchEnd: function onTouchEnd(e) {
				return _onClick(e, index);
			}, onClick: function onClick(e) {
				return _onClick(e, index);
			} },
		React.createElement(
			'td',
			{ className: tdClassName },
			React.createElement(
				'a',
				{ title: name },
				React.createElement(
					'span',
					{ className: leftSpanClassName },
					textInIconArea == 'B' && showIndicator ? React.createElement(
						'span',
						{ className: 'base-rate-indicator' },
						'B'
					) : '',
					leftSpanText
				),
				React.createElement('span', { className: rightSpanClassName })
			)
		)
	);
};