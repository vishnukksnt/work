var TimelineOccupancy = React.createClass({
	shouldComponentUpdate: function(nextProps) {
		return this.props.display !== nextProps.display;
	},
	render: function() {
		var props = this.props,
			px_per_hr = props.display.px_per_hr + 'px';

		return React.DOM.ul({
			className: 'occupancy'
		},
		_.map(props.data, function(item) {
			return React.DOM.li({
				style: {
					width: px_per_hr
				}
			}, item.count);
		}));
	}
});
