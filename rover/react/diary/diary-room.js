var Room = React.createClass({
	getInitialState: function() {
		return {
			clickedElement: null,
			currentRoomId: null
		};
    },
	showRoomStatusUpdatePopup: function () {
		this.props.showRoomStatusAndServiceUpdatePopup(this.props.data);
	},
	onCouchIconClick: function(roomId, event) {
		this.props.setSelectedRoom(roomId, event);
		this.setState({
			clickedElement: event.target,
			currentRoomId: roomId
		});
	},
	
	renderSuiteConnectedRoomIndicatorView: function(isConnected, clickedElement, roomId, currentSelectedRoomId) {
		var self = this;
		var isSelected = currentSelectedRoomId && (currentSelectedRoomId == this.state.currentRoomId);

		if (isConnected) {
			return React.DOM.div({
				className: 'suites'
			},
			React.DOM.span({
				className: 'suite-room',
				onClick: self.onCouchIconClick.bind(self, roomId)
			},
			React.DOM.span({
				className: 'icons icon-suite-connected'
			})),
			isSelected && React.createElement(DiaryRoomsSuiteConnectedRoomTooltipComponent, {
				connectedRooms: self.props.data.connecting_room_no,
				clickedElement: clickedElement
			})
			);
			
		}
		return null;
		
	},
	render: function() {
		var props = this.props,
			room_meta = props.meta.room,
			self = this,
			connectedRooms = props.data[room_meta.connecting_room_no],
			isConnected = connectedRooms && connectedRooms.length > 0,
			clickedElement = this.state.clickedElement;

		return React.DOM.li({
			className: 'room-title' + (!(props.data[room_meta.hk_status] === "") ? ' ' + this.props.data[room_meta.hk_status] : '')
		},
		React.DOM.span({
			className: 'number',
			onClick: self.showRoomStatusUpdatePopup
		}, props.data[room_meta.number]),
		React.DOM.span({
			className: 'type'
		}, props.data[room_meta.type]),
		self.renderSuiteConnectedRoomIndicatorView(isConnected, clickedElement, props.data[room_meta.id], self.props.selectedRoomId));
	}
});
