var GridRow = React.createClass({
	shouldComponentUpdate: function(nextProps, nextState) {
		var render = true;

		/* if(this.props.viewport !== nextProps.viewport ||
		   this.props.display !== nextProps.display) {
			render = true;
		} else {
			if(this.props.data.reservations.length !== nextProps.data.reservations.length) {
				render = true;
			} else if(nextProps.currentResizeItem) {
				if(nextProps.data.id === nextProps.currentResizeItemRow.id) {
					render = true;
				}
				//render = true;
			} else {
				for(var i = 0, len = this.props.data.reservations.length; i < len; i++) {
					if(this.props.data.reservations[i] !== nextProps.data.reservations[i]) {
						render = true;
						return render;
					}
				}
			}
		}*/

		return render;
	},
	componentDidMount: function() {
		$(ReactDOM.findDOMNode(this)).droppable();
	},
	render: function() {
		var props 				= this.props,
			display 			= props.display,
			px_per_hr 			= display.px_per_hr + 'px',
			hourly_divs 		= [],
			room_meta 			= props.meta.room,
			room_meta_children 	= room_meta.row_children,
			room_meta_inactive	= room_meta.inactive_slots,
			room_inactives		= [],
			self 				= this;

		// drag-over
		/* Create hourly spans across each grid row*/
		for (var i = 0, len = display.hours; i < len; i++) {
			hourly_divs.push(React.DOM.span({
				className: 'hour',
				style: {
					width: px_per_hr
				}
			}));
		}

		/** Creating in active slots */
		_.each(props.data[room_meta_inactive], function(inactive_slot) {
			room_inactives.push(React.createElement(GridRowInactive, {
				data: inactive_slot,
				display: display,
				viewport: props.viewport
			}));
		});


		/* Create grid row and insert each occupany item as child into that row*/
		return React.DOM.li({
			key: props.key,
			className: props.data.is_available_for_day_use ? 'grid-row' : 'grid-row unavailable disable-element'
		},
		hourly_divs,
		room_inactives,
		_.map(props.data[room_meta_children], function(occupancy) {
			return React.createElement( GridRowItem, {
				key: occupancy.key,
				display: display,
				viewport: props.viewport,
				filter: props.filter,
				edit: props.edit,
				iscroll: props.iscroll,
				angular_evt: props.angular_evt,
				meta: props.meta,
				data: occupancy,
				row_data: props.data,
				row_offset: props.row_number * (display.row_height + display.row_height_margin),
				__onDragStart: props.__onDragStart,
				__onDragStop: props.__onDragStop,
				__onResizeCommand: props.__onResizeCommand,
				currentResizeItem: props.currentResizeItem,
				currentResizeItemRow: props.currentResizeItemRow,
				unassignedRoomList: props.unassignedRoomList
			});
		}));
	},

	__onDrop: function(e, id) {
		var el = this.getDOMNode().querySelectorAll("[data-reactid='" + id + "']");

		el[0].className = 'hour';
		console.log(this.getDOMNode());

		var isMoveWithoutRateChange = true;

		this.props.angular_evt.saveReservationOnDrop(reservation, roomDetails, isMoveWithoutRateChange);
	},
	__onDragOver: function(e, id) {
		e.preventDefault();
		var el = this.getDOMNode().querySelectorAll("[data-reactid='" + id + "']");

		el[0].className = 'hour drag-over';
	},
	__onDragLeave: function(e, id) {
		e.preventDefault();
		var el = this.getDOMNode().querySelectorAll("[data-reactid='" + id + "']");

		el[0].className = 'hour';
	}
});
