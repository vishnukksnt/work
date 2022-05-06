'use strict';

var DailyProductionLeftSide = React.createClass({
  displayName: 'DailyProductionLeftSide',

  componentDidMount: function componentDidMount() {
    var scroll = this.props.scroll.left = new IScroll($('#stats-report-heading-scroll')[0], {
      probeType: 3,
      scrollbars: 'custom',
      scrollX: false,
      scrollY: true,
      mouseWheel: true,
      useTransition: true,
      interactiveScrollbars: true
    });

    setTimeout(function () {
      scroll.refresh();
    }, 150);
  },

  componentDidUpdate: function componentDidUpdate() {
    var scroll = this.props.scroll.left;

    setTimeout(function () {
      scroll.refresh();
    }, 150);
  },

  render: function render() {
    return React.DOM.div({
      className: 'statistics-headings',
      id: 'stats-report-heading'
    }, React.DOM.div({
      className: 'scrollable',
      id: 'stats-report-heading-scroll'
    }, React.createElement(DailyProductionListDemographics, {
      data: this.props.data.listing,
      header: this.props.header,
      toggleRevenue: this.props.toggleRevenue,
      toggleAvailability: this.props.toggleAvailability
    })));
  }
});