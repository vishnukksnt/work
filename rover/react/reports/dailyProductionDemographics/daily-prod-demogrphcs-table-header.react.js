'use strict';

var DailyProductionByDemographicsTableHeader = React.createClass({
    displayName: 'DailyProductionByDemographicsTableHeader',

    componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
        this.setState(nextProps);
    },

    render: function render() {
        var header = this.props.header,
            dateHeaderProp = {
            dataCell: 'colspan',
            colSpan: header.colspan
        },
            indvdlColumns = [React.DOM.th({
            className: header.showAvailable ? '' : 'hidden',
            style: { whiteSpace: 'nowrap' }
        }, 'Rooms#'), React.DOM.th({
            className: header.showAvailable ? '' : 'hidden',
            style: { whiteSpace: 'nowrap' }
        }, 'Avl. Rooms'), React.DOM.th({
            className: header.showRevenue ? '' : 'hidden',
            style: { whiteSpace: 'nowrap' }
        }, 'Rate Rev.'), React.DOM.th({
            className: header.showRevenue ? '' : 'hidden',
            style: { whiteSpace: 'nowrap' }
        }, 'ADR'), React.DOM.th({
            className: header.showRevenue ? '' : 'hidden',
            style: { whiteSpace: 'nowrap' }
        }, 'Actual Rev.'), React.DOM.th({
            style: { whiteSpace: 'nowrap' }
        }, 'Arrivals'), React.DOM.th({
            style: { whiteSpace: 'nowrap' }
        }, 'Adults'), React.DOM.th({
            style: { whiteSpace: 'nowrap' }
        }, 'Children'), React.DOM.th({
            className: header.showRevenue ? '' : 'hidden',
            style: { whiteSpace: 'nowrap' }
        }, 'Forecast F&B Rev.'), React.DOM.th({
            className: header.showRevenue ? '' : 'hidden',
            style: { whiteSpace: 'nowrap' }
        }, 'Actual F&B Rev.'), React.DOM.th({
            className: header.showRevenue ? '' : 'hidden',
            style: { whiteSpace: 'nowrap' }
        }, 'Forecast Other Rev.'), React.DOM.th({
            className: header.showRevenue ? '' : 'hidden',
            style: { whiteSpace: 'nowrap' }
        }, 'Actual Other Rev.'), React.DOM.th({
            className: header.showRevenue ? '' : 'hidden',
            style: { whiteSpace: 'nowrap' }
        }, 'Forecast Total Rev.'), React.DOM.th({
            className: header.showRevenue ? '' : 'hidden',
            style: { whiteSpace: 'nowrap' }
        }, 'Actual Total Rev.')],
            dates = [],
            indvdlColumnsWithinDateList = [],
            businessDate = new Date(this.props.businessDate);

        _.map(this.props.data.dates, function (row, index) {
            dates.push(React.DOM.th(dateHeaderProp, tzIndependentDate(row).toComponents().date.toShortDateString()));
            var indvdlColumnsCopy = indvdlColumns.slice();

            if (new Date(row) < new Date(businessDate.getFullYear(), businessDate.getMonth(), businessDate.getDate())) {
                indvdlColumnsCopy.splice(2, 1);
            } else {
                indvdlColumnsCopy.splice(4, 1);
            }
            indvdlColumnsWithinDateList = indvdlColumnsWithinDateList.concat(indvdlColumnsCopy);
        });

        return React.DOM.thead({}, React.DOM.tr({}, dates), React.DOM.tr({ className: 'bottom-row' }, indvdlColumnsWithinDateList));
    }
});