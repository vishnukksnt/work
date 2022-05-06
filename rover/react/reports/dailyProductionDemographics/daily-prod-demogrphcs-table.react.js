'use strict';

var DailyProductionByDemographicsTable = React.createClass({
    displayName: 'DailyProductionByDemographicsTable',

    componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
        this.setState(nextProps);
    },

    render: function render() {
        var headerProps = {
            header: this.props.header,
            data: this.props.data,
            businessDate: this.props.businessDate
        },
            rowProps = {
            header: this.props.header,
            data: this.props.data,
            businessDate: this.props.businessDate
        };

        return React.DOM.table({
            className: 'statistics-reports'
        }, React.createElement(DailyProductionByDemographicsTableHeader, headerProps), React.createElement(DailyProductionByDemographicsTableRows, rowProps));
    }
});