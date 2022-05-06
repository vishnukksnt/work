var TimelineResizeGrip = React.createClass({
	__dbMouseMove: undefined,
	__onMouseDown: function(e) {
		var page_offset, model, props = this.props;

		e.stopPropagation();
		e.preventDefault();
		e = e.changedTouches ? e.changedTouches[0] : e;

		props.iscroll.timeline.disable();

		this._setMoveEventListners();

		page_offset = ReactDOM.findDOMNode(this).getBoundingClientRect();

		this.setState({
			mouse_down: true,
			origin_x: e.pageX,
			element_x: page_offset.left - props.display.x_0 - props.iscroll.grid.x
		});

		if ( props.reservatonFlow.cannotResizeDuration() ) {
			props.reservatonFlow.showNotAllowedMsg();
		} else {
			document.addEventListener(this.mouseLeavingEvent, this.__onMouseUp);
			document.addEventListener(this.mouseMovingEvent, this.__onMouseMove);
		}
	},
	__onMouseMove: function(e) {
		e.stopPropagation();
		e.preventDefault();
		e = e.changedTouches ? e.changedTouches[0] : e;
		var props = 				this.props,
			state = 				this.state,
			display = 				props.display,
			delta_x = 				e.pageX - state.origin_x,
			x_origin = 				(display.x_n instanceof Date ? display.x_n.getTime() : display.x_n),
			px_per_int = 			display.px_per_int,
			px_per_ms = 			display.px_per_ms,
			model = 				state.currentResizeItem,
			direction = 			props.itemProp,
			newValue = ((((state.element_x + delta_x) / px_per_ms) + x_origin) / 900000).toFixed() * 900000,
			opposite =      		((direction === 'departure') ? 'arrival' : 'departure'),
			isResizable =			this.__whetherResizable( opposite, newValue),
			last_left;


		if (!isResizable) {
			newValue = model[direction];
		}

		if (!state.resizing &&
		   state.mouse_down &&
		   (Math.abs(delta_x) > 10)) {

			this.setState({
				resizing: true,
				currentResizeItem: model
			}, function() {
				this.props.__onResizeStart(undefined, model);
			});

			this.props.__onResizeCommand(model);
		} else if (state.resizing) {
			last_left = model[direction];

			model[direction] = newValue;

			this.setState({
				currentResizeItem: model
			}, function() {
				props.__onResizeCommand(model);
			});
		}
	},
	__onMouseUp: function(e) {
		e.stopPropagation();
		e.preventDefault();
		e = e.changedTouches ? e.changedTouches[0] : e;
		var props = 		this.props,
			state = 		this.state,
			display = 		props.display,
			delta_x = 		e.pageX - state.origin_x,
			px_per_int = 	display.px_per_int,
			px_per_ms =     display.px_per_ms,
			x_origin =      display.x_n,
			model = 		state.currentResizeItem,
			m =      		props.meta.occupancy,
			direction = 	props.itemProp;

		this._removeEventListeners(false);

		if (this.state.resizing) {
			props.iscroll.timeline.enable();

			setTimeout(function() {
				props.iscroll.timeline.refresh();
			}, 250);

			this.setState({
				mouse_down: false,
				resizing: false,
				currentResizeItem: model
			}, function() {
				props.__onResizeEnd(state.row, model);

				props.__onResizeCommand(model);
			});
		}

	},
	__whetherResizable: function(opposite, value) {
		var props = 				this.props,
			state =					this.state,
			original_item = 		state.currentResizeItem,
			direction = 			props.itemProp.toUpperCase(),
			fifteenMin =			900000,
			reservation_status = 	original_item.reservation_status.toUpperCase(),
			difference	= (opposite === 'departure' ? (original_item[opposite] - value) : (value - original_item[opposite]) );

		if ((difference) < (fifteenMin)) {
			return false;
		}
		else if ((reservation_status === "RESERVED" || reservation_status === "CHECK-IN" ||
			reservation_status === "AVAILABLE" )) {
			return true;
		}
		else if ( (reservation_status === "INHOUSE" || reservation_status === "CHECK-OUT") && direction === "DEPARTURE") {
			return true;
		}
		else if ((reservation_status === "INHOUSE" || reservation_status === "CHECK-OUT") && direction === "ARRIVAL") {
			return false;
		}
		return false;
	},
	getDefaultProps: function() {
		return {
			handle_width: 50
		};
	},
	getInitialState: function() {
		return {
			stop_resize: false,
			resizing: false,
			mode: undefined,
			mouse_down: false,
			currentResizeItem: this.props.currentResizeItem,
			currentResizeItemRow: this.props.currentResizeItemRow
		};
	},

    componentWillMount: function() {
        this.__dbMouseMove = _.throttle(this.__onMouseMove, 10);
    },

    componentWillUnmount: function() {
        this._removeEventListeners(true);
    },


    /**
     * Find if browser supports touch events or not. handles most cases
     * @return {Boolean} supports touch or not
     */
    _hasTouchSupport: function () {
        var hasSupport = false;

        try {
            if (navigator.maxTouchPoints !== undefined) {
                // for modern browsers
                // even if touchpoints test is supported event support is also needed
                hasSupport = navigator.maxTouchPoints > 0 && 'ontouchstart' in window;
            } else {
                // for browsers with no support of navigator.maxTouchPoints
                hasSupport = 'ontouchstart' in window;
            }
        } catch (e) {
            hasSupport = 'ontouchstart' in window;
        }

        return hasSupport;
    },

    /**
     * Remove events for safty
     * @param  {Boolean} removeStartEvent flag to remove click event
     * @return {undfefined} none
     */
    _removeEventListeners: function (removeStartEvent) {
        try {
            if (removeStartEvent) {
                document.removeEventListener('touchstart', this.__onMouseDown);
                document.removeEventListener('mousedown', this.__onMouseDown);
            }

            document.removeEventListener('touchend', this.__onMouseUp);
            document.removeEventListener('mouseup', this.__onMouseUp);
            document.removeEventListener('mousemove', this.__onMouseMove); 
            document.removeEventListener('touchmove', this.__onMouseMove);
        } catch (e) {
            // noop
        }
    },

    _setMoveEventListners: function () {
        document.addEventListener (this.mouseLeavingEvent, this.__onMouseUp);
        document.addEventListener (this.mouseMovingEvent, this.__onMouseMove);

        // CICO-36620 - handle devices with touch and mouse inputs
        // PointerEvent could do it if supported on all platforms 
        if (this.isTouchEnabled && this.isMouseEnabled) {
            document.addEventListener ('mouseup', this.__onMouseUp);
            document.addEventListener ('mousemove', this.__onMouseMove);
        }
    },

    _setClickEventListners: function () {
        var node = this.getDOMNode();

        this.isTouchEnabled = this._hasTouchSupport();
        this.isMouseEnabled = 'onmousemove' in window;
        this.mouseStartingEvent = this.isTouchEnabled ? 'touchstart' : 'mousedown';
        this.mouseMovingEvent = this.isTouchEnabled ? 'touchmove' : 'mousemove';
        this.mouseLeavingEvent = this.isTouchEnabled ? 'touchend' : 'mouseup';

        // CICO-36620 - handle devices with touch and mouse inputs
        // PointerEvent could do it if supported on all platforms
        if (this.isTouchEnabled && this.isMouseEnabled) {
            node.addEventListener(this.mouseStartingEvent, this.__onMouseDown);
            node.addEventListener('mousedown', this.__onMouseDown);
        } else {
            node.addEventListener(this.mouseStartingEvent, this.__onMouseDown);
        }
    },

    componentDidMount: function() {
        this._removeEventListeners(true);
        this._setClickEventListners();	
    },

	componentWillReceiveProps: function(nextProps) {
		var model,
			props 		= this.props,
			state  		= this.state,
			display 	= props.display,
			direction 	= this.props.itemProp,
			px_per_ms 	= display.px_per_ms,
			x_origin 	= display.x_n, // instanceof Date ? display.x_n.getTime() : display.x_n),
			m 			= props.meta.occupancy;

		if (!this.state.resizing) {
			if (!props.currentResizeItem && nextProps.currentResizeItem) {
				model = nextProps.currentResizeItem;
				if (nextProps.edit.passive) {
					this.setState({
						mode: model[props.meta.occupancy.id],
						currentResizeItem: model,
						currentResizeItemRow: model[props.meta.occupancy.id]
					});
					var scrollToPos = (model[m.start_date] - x_origin - 7200000) * px_per_ms;

					if (scrollToPos < 0) {
						scrollToPos = 0;
					}
					props.iscroll.grid.scrollTo(-scrollToPos, 0, 0, 1000);
            		props.iscroll.timeline.scrollTo(-scrollToPos, 0, 0, 1000);
            		props.iscroll.rooms.scrollTo(0, props.iscroll.rooms.y, 0, 1000);
            		props.iscroll.rooms._scrollFn();
            		props.iscroll.rooms.refresh();

				} else {
					this.setState({
						mode: undefined,
						currentResizeItem: model,
						currentResizeItemRow: nextProps.currentResizeItemRow
					});
				}
			} else if (this.props.currentResizeItem && !nextProps.currentResizeItem) {
				this.setState({
					mode: undefined,
					currentResizeItem: undefined,
					currentResizeItemRow: undefined
				});
			}
			else if (this.props.currentResizeItem && nextProps.currentResizeItem) {
				this.setState({
					mode: undefined,
					currentResizeItem: nextProps.currentResizeItem,
					currentResizeItemRow: nextProps.currentResizeItemRow
				});
			}
		}
	},
	render: function() {
			var self = this,
				props 				= this.props,
				direction 			= props.itemProp,
				currentResizeItem 	= this.state.currentResizeItem,
				x_origin 			= (props.display.x_n instanceof Date ? props.display.x_n.getTime() : props.display.x_n),
				px_per_ms 			= props.display.px_per_ms,
				label       		= (direction === 'arrival' ? 'ARRIVE' : 'DEPART'),
				label_class         = (direction === 'arrival' ? 'arrival' : 'departure'),
				left 				= (currentResizeItem ? (currentResizeItem[direction] - x_origin) * px_per_ms : 0),
				count_txt           = props.meta.availability_count.total > 0 ? props.meta.availability_count.total : false,
				classes             = "set-times " + label_class,
				time_txt            = '';

			if (currentResizeItem) {
				var dateDirection = new Date(currentResizeItem[direction]);

				time_txt = dateDirection.toComponents().time.toString(true);
				var display_start_time = (props.display.x_n instanceof Date ? props.display.x_n : new Date (props.display.x_n) );

				if (display_start_time.isOnDST() === false && dateDirection.isOnDST() === true ) {
					var dateForCalculatingLeft = new Date(currentResizeItem[direction]);

					dateForCalculatingLeft.setMinutes(dateForCalculatingLeft.getMinutes() + dateForCalculatingLeft.getDSTDifference());
					left = (dateForCalculatingLeft.getTime() - x_origin) * px_per_ms;

				}

				else if (display_start_time.isOnDST() === true && dateDirection.isOnDST() === false ) {
					var dateForCalculatingLeft = new Date(currentResizeItem[direction]);

					dateForCalculatingLeft.setMinutes(dateForCalculatingLeft.getMinutes() + dateForCalculatingLeft.getDSTDifference());
					left = (dateForCalculatingLeft.getTime() - x_origin) * px_per_ms;
					// The special case adjustment
					if (dateForCalculatingLeft.isOnDST()) {
						left = (dateForCalculatingLeft.getTime() + 3600000 - x_origin) * px_per_ms;
					}
				}
			}

			if (this.props.edit.active) {
				classes += " editing";
				// CICO-73467 : Disable ext-shortening for Night Components in Edit Mode.
				if (!this.props.edit.originalItem.is_hourly) {
					classes += ' disable-element';
				}
			}

			return React.DOM.div({
					className: classes,
					style: {
						left: left + 'px'
					}
				},
				React.DOM.span({
					className: 'title'
				},
					React.DOM.span({}, label),
					React.DOM.span({
						className: 'time'
					}, time_txt)
				),
				React.DOM.span({
					className: 'line',
					style: {
						display: this.props.edit.active ? 'inline' : 'none'
					}
				})
			);
		}
});
