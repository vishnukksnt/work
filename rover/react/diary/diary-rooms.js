var Rooms = React.createClass({
	getInitialState: function() {
		return {
			clickedElement: null,
			selectedRoomId: null
		};
	},
	setSelectedRoom: function(roomId) {
		this.setState({
			selectedRoomId: roomId == this.state.selectedRoomId ? null : roomId
		});
	},
	render: function() {
		var props = this.props;

		var self = this;

		return React.DOM.ul({
			id: 'room-wrapper',
			className: 'wrapper'
		},
		_.map(props.data, function(room) {
			return React.createElement( Room, {
				meta: props.meta,
				data: room,
				showRoomStatusAndServiceUpdatePopup: props.showRoomStatusAndServiceUpdatePopup,
				setSelectedRoom: self.setSelectedRoom,
				selectedRoomId: self.state.selectedRoomId
			});
		}));
	}
});