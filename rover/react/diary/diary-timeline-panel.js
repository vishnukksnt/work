var TimelinePanel = React.createClass({
	componentDidMount: function() {
		var iscroll = this.props.iscroll;

		iscroll.timeline = new IScroll('#diary-timeline', {
			probeType: 2,
			scrollbars: false,
			interactiveScrollbars: false,
			scrollX: true,
			scrollY: false,
			momentum: false,
			bounce: false,
			mouseWheel: false,
			useTransition: true,
            disablePointer: true,
			preventDefaultException: { className: /(^|\s)set-times(\s|$)/ }
		});

		iscroll.timeline._scrollFn = _.throttle(this.props.__onGridScroll.bind(null, iscroll.timeline), 10, { leading: false, trailing: true });

		iscroll.timeline.on('scroll', iscroll.timeline._scrollFn);

		setTimeout(function () {
	        iscroll.timeline.refresh();

	        if (_.isNumber(this.props.display.scrollTo)) {
	        	// scroll.timeline.scrollTo(this.props.display.scrollTo, 0);
	        }
	    }.bind(this), 1000);
	},
	componentWillUnmount: function() {
		this.props.iscroll.timeline.destroy();
		this.props.iscroll.timeline = null;
	},
	componentWillReceiveProps: function(nextProps) {

		var hops = Object.prototype.hasOwnProperty;

		if (hops.call(this.props, 'filter') && this.props.filter !== nextProps.filter ) {
  			this.setState({
  				filter: nextProps.filter
  			});
  		}
	},
	shouldComponentUpdate: function(nextProps, nextState) {
		if (this.props.viewport !== nextProps.viewport ||
		   this.props.display !== nextProps.display ||
		   !this.props.currentResizeItem && nextProps.currentResizeItem ||
		   this.props.currentResizeItem || this.props.filter !== nextProps.filter ) {
			return true;
		} else {
			return false;
		}
	},
	render: function() {
		var props = this.props,
			self = this;

		return React.DOM.div({
			id: 'diary-timeline',
			className: 'diary-timeline scrollable'
		},
		React.DOM.div({
			id: 'timeline-outer-wrapper',
			className: 'outer-wrapper',
			style: {
				position: 'relative',
				width: props.display.width + 'px'
			}
		},
		React.createElement( Timeline, {
			display: props.display,
			iscroll: props.iscroll,
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
		React.createElement( TimelineOccupancy, {
			display: props.display,
			data: props.stats
		})));
	}
});
