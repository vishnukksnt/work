var Toggle = React.createClass({
	render: function() {
		var self = this;

		return React.DOM.div({
			className: 'switch-button' + (this.props.mode === 'on' ? ' on' : '')
		},
			React.DOM.input({
				className: '',
				name: 'diary-rooms-showing',
				id: 'diary-rooms-showing',
				type: 'checkbox',
				checked: undefined,
				onClick: self.props.__onClick
			}),
			React.DOM.label({
				className: 'data-off'
			},
				React.DOM.span({
					className: 'value'
				}, 'Open'),
				React.DOM.span({
					className: 'switch-icon'
				}, 'All')),
			React.DOM.label({
				className: 'data-on'
			},
				React.DOM.span({
					className: 'switch-icon'
				}, 'All'),
				React.DOM.span({
					className: 'value'
				}, 'Open'))
		);
	}
});
