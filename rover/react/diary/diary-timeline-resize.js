var Resizable = React.createClass({
	render: function() {
		var handle_width_ms = this.props.handle_width * this.props.display.px_per_ms,
			props = this.props,
			self = this;

		return React.DOM.div({
			className: 'stay-range',
			style: {
				display: (props.edit.active || props.edit.passive) ? 'block' : 'none'
			}
		},
		React.createElement( TimelineResizeGrip, {
			key: 'resize-left-00',
			display: props.display,
			iscroll: props.iscroll,
			itemProp: 'arrival',
			filter: props.filter,
			edit: props.edit,
			meta: props.meta,
			__onResizeCommand: props.__onResizeCommand,
			__onResizeStart: props.__onResizeStart,
			__onResizeEnd: props.__onResizeEnd,
			currentResizeItem: props.currentResizeItem,
			currentResizeItemRow: props.currentResizeItemRow,
			reservatonFlow: props.reservatonFlow
		}),
		React.createElement( TimelineResizeGrip, {
			key: 'resize-right-01',
			display: props.display,
			iscroll: props.iscroll,
			filter: props.filter,
			itemProp: 'departure',
			edit: props.edit,
			meta: props.meta,
			__onResizeCommand: props.__onResizeCommand,
			__onResizeStart: props.__onResizeStart,
			__onResizeEnd: props.__onResizeEnd,
			currentResizeItem: props.currentResizeItem,
			currentResizeItemRow: props.currentResizeItemRow,
			reservatonFlow: props.reservatonFlow
		}));
	}
});
