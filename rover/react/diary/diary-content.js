// React.initializeTouchEvents(true);

var DiaryContent = React.createClass({
	_recalculateGridSize: function() {
		var display = _.extend({}, this.state.display),
			viewport = _.extend({}, this.state.viewport),
			iscroll =  this.state.iscroll;

		viewport.width = $(window).width() - 120;
		viewport.height = $(window).height() - 230;

		if (viewport.width !== this.state.viewport.width ||
		   viewport.height !== this.state.viewport.height) {
			display.width 		= display.hours / viewport.hours * viewport.width;
			display.px_per_hr 	= viewport.width / viewport.hours;
			display.px_per_int 	= display.px_per_hr / display.intervals_per_hour;
			display.px_per_ms 	= display.px_per_int / 900000;

            this.setState({
				viewport: viewport,
				display: display
			}, function() {
            });
		}
		// reffreshing the timeline scroller and calling the onscroll fn so that others will get corrected
		iscroll.timeline.scrollTo(iscroll.timeline.x, iscroll.timeline.y);
		iscroll.timeline.refresh();
		iscroll.timeline._scrollFn();
	},
	__toggleRows: function(state) {
		this.state.angular_evt.toggleRows(state, Math.abs(this.state.iscroll.grid.x) / this.state.display.px_per_ms + this.state.display.x_n);
	},
	__onGridScrollStart: function(iscroll_object) {

	},
	__onGridScrollEnd: function(iscroll_object) {
		this.state.angular_evt.onScrollEnd(Math.abs(this.state.iscroll.grid.x) / this.state.display.px_per_ms + this.state.display.x_n);
	},
	__onGridScroll: function(iscroll_object) {
		var el = iscroll_object, iscroll = this.state.iscroll;

		switch (el) {
			case iscroll.grid:
				iscroll.timeline.scrollTo(el.x, 0);

				iscroll.rooms.scrollTo(0, el.y);
			break;
			case iscroll.timeline:
				iscroll.grid.scrollTo(el.x, iscroll.grid.y);
			break;
			case iscroll.rooms:
				iscroll.grid.scrollTo(iscroll.grid.x, el.y);
			break;
		}

	},
	__onDragStart: function(row_data, row_item_data) {
		this.state.angular_evt.onDragStart.apply(this, Array.prototype.slice.call(arguments));
	},
	__onDragStop: function(e, left, top, row_item_data) {
		var state 			= this.state,
			props 			= this.props,
			display 		= props.display,
			rowHeight 		= display.row_height + display.row_height_margin,
			viewport 		= state.viewport.element(),
			curPos 			= e.pageY - state.iscroll.grid.y - viewport.offset().top, // e.pageY - viewport.offset().top - state.iscroll.grid.y    viewport[0].scrollTop + e.pageY - viewport.offset().top - state.iscroll.grid.y,
			rowNumber 		= Math.floor(curPos / rowHeight),
			rowNumber       = (rowNumber < 0) ? 0 : rowNumber,
			rowNumber       = (rowNumber > (display.total_rows - 1)) ? (display.total_rows - 1) : rowNumber,
			row_data 		= state.data[rowNumber],
			delta 			= Number((left - row_item_data.left).toFixed(3)),
			delta_x 		= e.pageX - state.origin_x,
			x_origin 		= (display.x_n instanceof Date ? display.x_n.getTime() : display.x_n),
			px_per_int 		= display.px_per_int,
			px_per_ms 		= display.px_per_ms;


		this.setState({
			currentResizeItem: row_item_data,
			currentResizeItemRow: row_data
		});
		this.state.angular_evt.onDragEnd(row_data, row_item_data);
	},
	/* Message transport between timeline and grid:
	  As resize controls are arranged on timeline, the positional data
	  is passed via this command, then a property update is initiated with a
	  deep copy clone of the position state from the timeline.  This update
	  propagates down the component tree and is available for rendering update
	  by the grid row item.
	*/
	__onResizeCommand: function(row_item_data) {
		this.setProps({
			currentResizeItem: row_item_data
		});
	},
	__onResizeStart: function(row_data, row_item_data) {
		this.state.angular_evt.onResizeStart.apply(this, Array.prototype.slice.call(arguments));
	},
	__onResizeEnd: function(row_data, row_item_data) {
		this.state.angular_evt.onResizeEnd.apply(this, Array.prototype.slice.call(arguments));

		this.setProps({
			currentResizeItem: row_item_data,
			currentResizeItemRow: row_data
		});
	},
	componentDidUpdate: function() {
		this.componentWillMount();

		var props = this.props,
			state = this.state,
			reset = props.edit.reset_scroll;

		var setScrollerPositions = function() {
			var scrollToPos = (reset.x_origin - reset.x_n - 7200000) * state.display.px_per_ms;

			if (scrollToPos < 0) {
				scrollToPos = 0;
			}


			var data 	= props.data,
			display = props.display,
			rowHeight = display.row_height + display.row_height_margin,
			rowNumber = state.edit.active ? _.indexOf(_.pluck(data, 'id'), props.currentResizeItem.room_id) - 2 : 0,
			rowNumber = rowNumber > 0 ? rowNumber : 0;

			var scrollYPos = rowNumber * rowHeight;

			state.iscroll.timeline.scrollTo(-scrollToPos, -scrollYPos, 0, 0);
			state.iscroll.grid.scrollTo(-scrollToPos, -scrollYPos, 0, 0);
			state.iscroll.rooms.scrollTo(0, -scrollYPos, 0, 0);
			state.iscroll.timeline.refresh();
			state.iscroll.grid.refresh();

		    state.angular_evt.onScrollEnd(Math.abs(state.iscroll.grid.x) / state.display.px_per_ms + reset.x_n);
		};

		!!reset && setTimeout( setScrollerPositions, 500 );
	},
	componentDidMount: function() {
		var self = this,
            state = this.state;

    	$(window).on('resize', _.throttle(function(e) {
    		self._recalculateGridSize();
    		setTimeout(function() {
    			self.componentWillMount();
    		}, 1000);

    	}, 10, { leading: false, trailing: true }));

        setTimeout(function() {
        	var scrollToPos = (self.state.display.x_origin - self.state.display.x_n - 7200000) * self.state.display.px_per_ms;

        	if (scrollToPos < 0) {
        		scrollToPos = 0;
        	}
            self.state.iscroll.grid.scrollTo(-scrollToPos, 0, 0, 1000);
            self.state.iscroll.timeline.scrollTo(-scrollToPos, 0, 0, 1000);
            self.state.angular_evt.onScrollEnd(Math.abs(self.state.iscroll.grid.x) / self.state.display.px_per_ms + self.state.display.x_n);
            self.state.angular_evt.completedRendering.apply(self, Array.prototype.slice.call(arguments));
        }, 1000);
  	},
  	componentWillUnmount: function() {
  		$(window).off('resize');
  	},
  	componentWillMount: function() {
  		var self = this;

    	for (var k in this.state.iscroll) {
    		if (Object.prototype.hasOwnProperty.call(this.state.iscroll, k)) {
    			if (this.state.iscroll[k] instanceof IScroll) {
    				setTimeout(function () {
    					self.state.iscroll[k].refresh();
    				}, 100);
    			}
    		}
    	}
  	},
  	componentWillReceiveProps: function(nextProps) {

  		var hops = Object.prototype.hasOwnProperty,
  			self = this;

		if (hops.call(this.props, 'stats') && this.props.stats !== nextProps.stats) {
  			this.setState({
  				stats: nextProps.stats
  			});
  		}

		if (hops.call(this.props, 'data') && this.props.data !== nextProps.data) {
  			this.setState({
  				data: nextProps.data
  			});
  		}

  		if (hops.call(this.props, 'viewport') && this.props.viewport !== nextProps.viewport) {
  			this.setState({
  				viewport: nextProps.viewport
  			});

  		}

  		if (hops.call(this.props, 'display') && this.props.display !== nextProps.display) {
  			this.setState({
  				display: nextProps.display
  			},
  			function() {
  				this._recalculateGridSize();
  			});
  		}

  		if (hops.call(this.props, 'filter') && this.props.filter !== nextProps.filter ) {
  			this.setState({
  				filter: nextProps.filter
  			});
  		}

  		if (hops.call(this.props, 'edit') && this.props.edit !== nextProps.edit) {

  			this.setState({
  				edit: nextProps.edit
  			});
  		}
  	},
	getInitialState: function() {

		var props 		= this.props,
			scope 		= props.scope,
			viewport 	= scope.gridProps.viewport,
			display 	= scope.gridProps.display,
			filter      = scope.gridProps.filter,
			s_0 		= {
							angular_evt: {
								onSelect: scope.onSelect,
								isSelected: scope.isSelected,
								isAvailable: scope.isAvailable,
								isDraggable: scope.isDraggable,
								isResizable: scope.isResizable,
								toggleRows: scope.toggleRows,
								displayFilter: scope.displayFilter,
								onDragStart: scope.onDragStart,
								onDragEnd: scope.onDragEnd,
								onResizeStart: scope.onResizeStart,
								onResizeEnd: scope.onResizeEnd,
								onScrollEnd: scope.onScrollEnd,
								onScrollLoadTriggerRight: scope.onScrollLoadTriggerRight,
								onScrollLoadTriggerLeft: scope.onScrollLoadTriggerLeft,
								completedRendering: scope.eventAfterRendering,
								saveReservationOnDrop: scope.saveReservationOnDrop,
								showRoomStatusAndServiceUpdatePopup: scope.showRoomStatusAndServiceUpdatePopup,
								showEventsList: scope.showHouseEventsListPopup
							},
							currentDragItem: props.currentDragItem,
							currentResizeItem: props.currentResizeItem,
							currentResizeItems: props.currentResizeItems,
							edit: {
								active: false,
								originalItem: undefined,
								originalRowItem: undefined
							},
							iscroll: {
				  				timeline: undefined,
				  				rooms: undefined,
				  				grid: undefined
				  			},
				  			stats: props.stats,
				  			data: props.data
						};

		display.width 				= display.hours / viewport.hours * viewport.width;
		display.height 				= '100%';
		display.px_per_hr 			= viewport.width / viewport.hours;
		display.px_per_int  		= display.px_per_hr / display.intervals_per_hour;
		display.px_per_ms 			= display.px_per_int / 900000;
		display.x_0 				= viewport.row_header_right;
		display.total_rows			= scope.gridProps.data.length;
        display.x_origin_start_time = filter.arrival_time;
        display.scrollTo            = (display.x_origin - display.x_n) * display.px_per_ms;

		return _.extend(s_0, scope.gridProps);
	},
	render: function() {

		var self = this,
			props = this.props,
			state = this.state;

		return React.DOM.div({
			className: 'diary-container ' + ((state.viewport.hours === 12) ? 'hours-12' : 'hours-24') + /* (props.currentResizeItem*/ (state.edit.active ? ' editing' : '')
		},
		React.createElement( TogglePanel, {
			__toggleRows: self.__toggleRows,
			showEventsPopup: state.angular_evt.showEventsList,
			eventsCount: props.eventsCount
		}),
		React.createElement( RoomPanel, {
			refs: 'rooms',
			viewport: state.viewport,
			display: state.display,
			meta: state.meta,
			data: state.data,
			edit: state.edit,
			filter: state.filter,
			iscroll: state.iscroll,
			__onGridScroll: self.__onGridScroll,
			__onGridScrollEnd: self.__onGridScrollEnd,
			showRoomStatusAndServiceUpdatePopup: state.angular_evt.showRoomStatusAndServiceUpdatePopup
		}),
		React.createElement( TimelinePanel, {
			refs: 'timeline',
			viewport: state.viewport,
			display: state.display,
			data: state.data,
            stats: state.stats,
			meta: state.meta,
			filter: state.filter,
			edit: state.edit,
			iscroll: state.iscroll,
			currentResizeItem: props.currentResizeItem,
			angular_evt: state.angular_evt,
			__onResizeCommand: self.__onResizeCommand,
			__onResizeStart: self.__onResizeStart,
			__onResizeEnd: self.__onResizeEnd,
			__onGridScroll: self.__onGridScroll,
			__onGridScrollEnd: self.__onGridScrollEnd,
			reservatonFlow: state.reservatonFlow
		}),
		React.createElement( GridPanel, {
			refs: 'grid',
			viewport: state.viewport,
			display: state.display,
			filter: state.filter,
			edit: state.edit,
			iscroll: state.iscroll,
			meta: state.meta,
			data: state.data,
			currentResizeItem: props.currentResizeItem,
			currentResizeItemRow: props.currentResizeItemRow,
			unassignedRoomList: props.unassignedRoomList,
			angular_evt: state.angular_evt,
			__onResizeCommand: self.__onResizeCommand,
			__onGridScroll: self.__onGridScroll,
			__onGridScrollEnd: self.__onGridScrollEnd,
			__onDragStart: self.__onDragStart,
			__onDragStop: self.__onDragStop
		}));
	}
});
