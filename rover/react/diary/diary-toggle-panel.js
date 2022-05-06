var TogglePanel = React.createClass({
	__onClick: function(e) {
		var self = this,
			mode = (this.state.mode === 'on') ? 'off' : 'on';

		this.setState({
			mode: mode
		}, function() {
			self.props.__toggleRows(mode);
		});

		e.preventDefault();
		e.stopPropagation();
	},
	getInitialState: function() {
		return {
			mode: 'on'
		};
	},
	shouldComponentRender: function(nextProps, nextState) {
		return this.state.mode !== nextState.mode;
	},
	render: function() {
		var self = this;

		var eventsDOM = null;

		if (this.props.eventsCount && this.props.eventsCount > 0) {
			eventsDOM = React.DOM.button({
				className: 'button white events-button',
				onClick: self.props.showEventsPopup
			},
				React.DOM.span({
					className: 'events-count'
				}, this.props.eventsCount ), ' Events');
		}

		return React.DOM.div({
			className: 'diary-toggle'
		},
		eventsDOM,
		React.createElement( Toggle, {
			mode: this.state.mode,
			__onClick: self.__onClick
		}));
	}
});
