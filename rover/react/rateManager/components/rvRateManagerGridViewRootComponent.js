"use strict";

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _React = React,
    createClass = _React.createClass;


var RateManagerGridViewRootComponent = createClass({
	componentDidMount: function componentDidMount() {
		this.commonIScrollOptions = {
			probeType: 3,
			scrollbars: false,
			scrollX: false,
			scrollY: true,
			preventDefault: true,
			preventDefaultException: { tagName: /^(BUTTON)$/i },
			mouseWheel: true,
			deceleration: 0.0009
		};

		this.leftScrollableElement = this.rightScrollableElement = this.rightHeadScrollableElement = null;
		this.leftScroller = this.rightScroller = this.rightHeaderScroller = null;
		this.scrolling = false;
		this.startingScroll_Y_Position = 0;
		this.setScrollers();
	},
	setScrollers: function setScrollers() {
		this.setLeftScroller();
		this.setRightScroller();
		this.setRightHeadScroller();
		this.setScrollerSync();
	},
	setLeftScroller: function setLeftScroller() {
		if (this.props.shouldShow && !this.leftScrollableElement) {
			this.leftScrollableElement = $(findDOMNode(this)).find(".pinnedLeft-list")[0];
		}

		// if the left scroller become invalid
		if (this.leftScroller && this.leftScroller.wrapper instanceof Element && !document.body.contains(this.leftScroller.wrapper)) {
			this.leftScroller = null;
		}

		if (this.props.shouldShow && !this.leftScroller) {
			this.leftScroller = new IScroll(this.leftScrollableElement, this.commonIScrollOptions);
		}
	},
	setRightHeadScroller: function setRightHeadScroller() {
		if (this.props.shouldShow && !this.rightHeadScrollableElement) {
			this.rightHeadScrollableElement = $(findDOMNode(this)).find(".calendar-rate-table-days.scrollable")[0];
		}

		// if the right head scroller become invalid
		if (this.rightHeadScroller && this.rightHeadScroller.wrapper instanceof Element && !document.body.contains(this.rightHeadScroller.wrapper)) {
			this.rightHeadScroller = null;
		}

		if (this.props.shouldShow && !this.rightHeadScroller) {
			this.rightHeadScroller = new IScroll(this.rightHeadScrollableElement, _extends({}, this.commonIScrollOptions, {
				scrollX: true,
				scrollY: false,
				scrollbars: false
			}));
		}
	},
	setRightScroller: function setRightScroller() {
		if (this.props.shouldShow && !this.rightScrollableElement) {
			this.rightScrollableElement = $(findDOMNode(this)).find(".calendar-rate-table-grid.scrollable")[0];
		}

		// if the right scroller become invalid
		if (this.rightScroller && this.rightScroller.wrapper instanceof Element && !document.body.contains(this.rightScroller.wrapper)) {
			this.rightScroller = null;
		}

		if (this.props.shouldShow && !this.rightScroller) {
			this.rightScroller = new IScroll(this.rightScrollableElement, _extends({}, this.commonIScrollOptions, {
				scrollX: true,
				click: true,
				scrollbars: 'custom'
			}));
		}
	},
	setScrollerSync: function setScrollerSync() {
		var _this = this;

		if (this.rightScroller && this.leftScroller && this.rightHeadScroller) {
			this.leftScroller.on('scroll', function () {

				_this.rightScroller.scrollTo(_this.rightScroller.x, _this.leftScroller.y);
			});
			this.rightScroller.on('scroll', function () {
				_this.leftScroller.scrollTo(_this.leftScroller.x, _this.rightScroller.y);
				_this.rightHeadScroller.scrollTo(_this.rightScroller.x, _this.rightHeadScroller.y);
			});

			this.rightHeadScroller.on('scroll', function () {
				_this.rightScroller.scrollTo(_this.rightHeadScroller.x, _this.rightScroller.y);
			});
		}
	},
	refreshScrollers: function refreshScrollers() {
		var _this2 = this;

		var rightScrollerExist = this.rightScroller instanceof IScroll,
		    rightHeadScrollerExist = this.rightHeadScroller instanceof IScroll,
		    leftScrollerExist = this.leftScroller instanceof IScroll;

		if (rightScrollerExist && leftScrollerExist && rightHeadScrollerExist) {

			setTimeout(function () {
				_this2.rightScroller.refresh();
				_this2.leftScroller.refresh();
				_this2.rightHeadScroller.refresh();

				if (!!_this2.props.scrollTo) {
					var scrollTo = _this2.props.scrollTo;

					var offsetX = !!scrollTo.offsetX ? scrollTo.offsetX : undefined,
					    offsetY = !!scrollTo.offsetY ? scrollTo.offsetY : undefined;

					// right scroller
					if (!_.isUndefined(scrollTo.col)) {
						var rightHeadScrollDomNode = '.rate-calendar thead tr th:nth-child(' + scrollTo.col + ')';

						_this2.rightHeadScroller.scrollToElement(rightHeadScrollDomNode, 0, offsetX, offsetY);
						_this2.rightHeadScroller.refresh();
					}

					if (!_.isUndefined(scrollTo.row)) {
						var commonDomScrollDomNode = 'tr:nth-child(' + scrollTo.row + ')';

						// left scroller
						var leftDomScrollDomNode = '.pinnedLeft-list .rate-calendar tbody ' + commonDomScrollDomNode;

						_this2.leftScroller.scrollToElement(leftDomScrollDomNode, 0, offsetX, offsetY);
						_this2.leftScroller.refresh();

						if (!_.isUndefined(scrollTo.col)) {
							var rightBottomScrollDomNode = '#rateViewCalendar tbody ' + commonDomScrollDomNode + ' td:nth-child(' + scrollTo.col + ')';

							_this2.rightScroller.scrollToElement(rightBottomScrollDomNode, 0, offsetX, offsetY);
							_this2.rightScroller.refresh();
						}
					}
				}
			}, 200);
		}
	},
	componentDidUpdate: function componentDidUpdate() {
		this.setScrollers();
		this.refreshScrollers();
	},
	render: function render() {
		var _this3 = this;

		if (!this.props.shouldShow) {
			// this dom node related variables need to invalidate
			this.leftScrollableElement = this.rightScrollableElement = this.rightHeadScrollableElement = null;
			this.leftScroller = this.rightScroller = this.rightHeaderScroller = null;
			return false;
		}

		var shouldShowAvailability = this.props.showAvailability && (this.props.mode === RM_RX_CONST.ROOM_TYPE_VIEW_MODE || this.props.mode === RM_RX_CONST.SINGLE_RATE_EXPANDABLE_VIEW_MODE);

		return React.createElement(
			"div",
			{ className: this.props.wrapperClass + (shouldShowAvailability ? ' show-availability' : '') },
			React.createElement(RateManagerGridLeftSideContainer, null),
			!this.props.showHierarchyHeader && React.createElement(RateManagerGridRightSideHeaderContainer, null),
			this.props.showHierarchyHeader && React.createElement(RateManagerGridRightSideHierarchyHeaderContainer, null),
			this.props.showHierarchyHeader && this.props.hierarchyRestrictionClass !== '' && React.createElement("div", { onClick: function onClick() {
					return _this3.props.handleToggler();
				}, className: 'calendar-rate-table-handle ' + this.props.frozenPanelClass + this.props.hierarchyRestrictionClass }),
			React.createElement(RateManagerGridRightSideBottomComponent, {
				hierarchyRestrictionClass: this.props.frozenPanelClass + this.props.hierarchyRestrictionClass }),
			React.createElement(RateManagerBottomRestrictionListContainer, null)
		);
	}
});