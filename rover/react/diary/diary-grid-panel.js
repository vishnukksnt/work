var GridPanel = React.createClass({
	componentDidMount: function() {

	},
	render: function() {
		var props = this.props;

		return React.createElement( Grid, {
			viewport: props.viewport,
			display: props.display,
			filter: props.filter,
			edit: props.edit,
			iscroll: props.iscroll,
			meta: props.meta,
			data: props.data,
			angular_evt: props.angular_evt,
			currentResizeItem: props.currentResizeItem,
			currentResizeItemRow: props.currentResizeItemRow,
			unassignedRoomList: props.unassignedRoomList,
			__onResizeCommand: props.__onResizeCommand,
			__onGridScroll: props.__onGridScroll,
			__onGridScrollEnd: props.__onGridScrollEnd,
			__onDragStart: props.__onDragStart,
			__onDragStop: props.__onDragStop
		});
	}
});