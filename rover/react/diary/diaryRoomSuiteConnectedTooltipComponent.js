var DiaryRoomsSuiteConnectedRoomTooltipComponent = React.createClass({
	
    componentDidMount: function() {
        if (this.shouldAddTopClassName()) {
            $(this.props.clickedElement)
              .parent()
              .parent()
              .find(".suites-rooms")
              .addClass("top");
        } else {
            $(this.props.clickedElement)
              .parent()
              .parent()
              .find(".suites-rooms")
              .removeClass("top");
        }
        
    },
    shouldAddTopClassName: function() {
        var shouldAdd = false,
            $this = $(this.props.clickedElement).parent(),
            $suites = $(this.props.clickedElement).parent().parent().find('.suites-rooms'),
            top = $this.offset().top,
            timelineTop = $(".diary-timeline").offset().top,
            difference = (top - timelineTop) - 20, // 20 is subtracted to consider the height of the occupancy div
            suitesHeight = $suites.height();

        if ( suitesHeight > difference ) {
            shouldAdd = true;  
        }

        return shouldAdd;
    },
    getTopLevelClassName: function(isConnected) {
        var className = 'suites-rooms';

        if (isConnected) {
            className += ' connected'; 
        } 

        return className;
    },
    renderConnectedRooms: function(connectedRooms) {
        return (
            React.DOM.div({
                className: 'connected-indicator'
            },
            React.DOM.strong({}, 'Connected Rooms'),
            React.DOM.div({
                className: 'rooms'
            },
            connectedRooms.map(function(roomNo) {
                return React.DOM.span({
                    className: 'suite-room'
                },
                React.DOM.span({
                    className: 'icons icon-suite-connected'
                }),
                React.DOM.span({}, ' ' + roomNo));
            })
            ))
        );
    },
    renderConnectedView: function(isConnected) {
        return (
            React.DOM.div({
                className: this.getTopLevelClassName(isConnected)
            },
            this.renderConnectedRooms(this.props.connectedRooms))
        );
    },
    render: function() {
        const isConnected = this.props.connectedRooms.length > 0;

        if (isConnected) {
            return this.renderConnectedView(isConnected);
        } 

    }
});
