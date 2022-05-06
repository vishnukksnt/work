'use strict';

var DailyProductionByDemographicsTableRows = React.createClass({
  displayName: 'DailyProductionByDemographicsTableRows',

  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    this.setState(nextProps);
  },
  render: function render() {
    var className = '',
        totalColumnsVisible = 13,
        header = this.props.header,
        colText = '',
        visibleColCounter = 0,
        businessDate = new Date(this.props.businessDate);

    if (!header.showRevenue) {
      totalColumnsVisible = totalColumnsVisible - 8; // we are hiding 3 columns
    } else if (!header.showAvailable) {
      totalColumnsVisible = totalColumnsVisible - 2; // we are hiding 2 column
    }
    var rows = _.map(this.props.data.listing, function (row, index) {

      return React.DOM.tr({}, _.map(row.valueList, function (colData, colIndex) {
        className = '';

        if ((visibleColCounter + 1) % totalColumnsVisible === 0) {
          className = 'day-end';
        }
        if (_.indexOf(['future_revenue', 'adr', 'rate_revenue', 'fnb_actual_revenue', 'fnb_future_revenue', 'others_actual_revenue', 'others_future_revenue', 'total_future_revenue', 'total_actual_revenue'], colData.key) >= 0 && !header.showRevenue) {
          className += ' hidden';
        } else if (_.indexOf(['available', 'res_count'], colData.key) >= 0 && !header.showAvailable) {
          className += ' hidden';
        } else {
          visibleColCounter++;
        }

        if (new Date(row) < new Date(businessDate.getFullYear(), businessDate.getMonth(), businessDate.getDate())) {
          if (colData.key === 'future_revenue' && header.showRevenue) {
            className += ' hidden';
            visibleColCounter--;
          }
        } else {
          if (colData.key === 'rate_revenue' && header.showRevenue) {
            className += ' hidden';
            visibleColCounter--;
          }
        }

        colText = row.showInBold ? React.DOM.strong({}, colData.value) : colData.value;
        return React.DOM.td({ className: className }, colText);
      }));
    });

    return React.DOM.tbody({}, rows);
  }
});