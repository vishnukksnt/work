'use strict';

// React.initializeTouchEvents(true);

var DailyProductionByDemographics = React.createClass({
  displayName: 'DailyProductionByDemographics',

  toggleRevenue: function toggleRevenue() {
    var curHeadr = this.state.header;

    curHeadr.showRevenue = !curHeadr.showRevenue;
    if (!curHeadr.showRevenue) {
      curHeadr.colspan = 5;
      curHeadr.showAvailable = true; // show revnue & show availability are mutulay exclusive
    } else {
      curHeadr.colspan = curHeadr.colspan + 8;
    }
    this.props.startedRendering();
    setTimeout(function () {
      this.setState({
        header: curHeadr
      });
    }.bind(this), 20);
  },

  toggleAvailability: function toggleAvailability() {
    var curHeadr = this.state.header;

    curHeadr.showAvailable = !curHeadr.showAvailable;
    if (!curHeadr.showAvailable) {
      curHeadr.colspan = 11;
      curHeadr.showRevenue = true; // show revnue & show availability are mutulay exclusive
    } else {
      curHeadr.colspan = curHeadr.colspan + 2;
    }
    this.props.startedRendering();
    setTimeout(function () {
      this.setState({
        header: curHeadr
      });
    }.bind(this), 20);
  },

  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    // only data will change from parent, we will reset ui fiter selection once we have new data
    var newState = {};

    newState.data = nextProps.data;
    newState.header = this.getInitialState().header;
    this.props.startedRendering();
    setTimeout(function () {
      this.setState(newState);
    }.bind(this), 50);
  },

  getInitialState: function getInitialState() {
    var headerProps = {
      colspan: 13,
      showAvailable: true,
      showRevenue: true
    };
    var state = {
      data: this.props.data,
      businessDate: this.props.businessDate,
      header: headerProps,
      scroll: {
        left: null,
        right: null
      },
      toggleRevenue: this.toggleRevenue,
      toggleAvailability: this.toggleAvailability
    };

    return state;
  },

  componentDidMount: function componentDidMount() {
    var leftSc = this.state.scroll.left,
        rightSc = this.state.scroll.right;

    leftSc.on('scroll', function () {
      rightSc.scrollTo(rightSc.x, leftSc.y);
    });

    rightSc.on('scroll', function () {
      leftSc.scrollTo(leftSc.x, rightSc.y);
    });

    this.props.completedRendering();
  },

  componentDidUpdate: function componentDidUpdate() {
    this.props.completedUpdating();
    var leftSc = this.state.scroll.left,
        rightSc = this.state.scroll.right;

    leftSc.scrollTo(0, 0);
    rightSc.scrollTo(0, 0);
  },

  componentWillUnmount: function componentWillUnmount() {
    var leftSc = this.state.scroll.left,
        rightSc = this.state.scroll.right;

    leftSc.off('scroll');
    rightSc.off('scroll');
    leftSc.destroy();
    rightSc.destroy();
  },

  render: function render() {
    return React.DOM.span({}, React.createElement(DailyProductionLeftSide, this.state), React.createElement(DailyProductionRightSide, this.state));
  }
});