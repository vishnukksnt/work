'use strict';

var DailyProductionRevenueToggle = React.createClass({
		displayName: 'DailyProductionRevenueToggle',

		toggleTheRevenue: function toggleTheRevenue() {
				var toggleRevenue = this.props.toggleRevenue;

				setTimeout(function () {
						toggleRevenue();
				}, 0);
		},
		componentDidMount: function componentDidMount() {
				ReactDOM.findDOMNode(this).addEventListener('click', this.toggleTheRevenue);
				ReactDOM.findDOMNode(this).checked = this.props.header.showRevenue;
		},
		componentWillUnmount: function componentWillUnmount() {
				ReactDOM.findDOMNode(this).removeEventListener('click', this.toggleTheRevenue);
		},
		componentDidUpdate: function componentDidUpdate() {
				ReactDOM.findDOMNode(this).checked = this.props.header.showRevenue;
		},
		render: function render() {

				return React.DOM.div({
						className: 'switch-button ' + (this.props.header.showRevenue ? 'on' : 'disabled'),
						id: 'report-revenue-toggle-parent'
				}, React.DOM.input({
						name: 'report-toggle',
						id: 'report-availability-toggle',
						type: 'checkbox'
				}), React.DOM.label({
						className: 'data-off'
				}, React.DOM.span({
						className: 'value'
				}, 'Revenue'), React.DOM.span({
						className: 'switch-icon'
				}, 'Hidden')), React.DOM.label({
						className: 'data-on'
				}, React.DOM.span({
						className: 'value'
				}, 'Revenue'), React.DOM.span({
						className: 'switch-icon'
				}, 'Showing')));
		}
});