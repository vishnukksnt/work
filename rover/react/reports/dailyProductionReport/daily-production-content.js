'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var DPthCell = function DPthCell(props) {
    return React.DOM.th({
        className: props.className,
        colSpan: props.colspan,
        style: { 'whiteSpace': 'nowrap' }
    }, props.data);
};

DPthCell.propTypes = {
    className: React.PropTypes.string.isRequired,
    colspan: React.PropTypes.any.isRequired,
    data: React.PropTypes.any
};
DPthCell.defaultProps = {
    className: '',
    colspan: 1,
    data: 'NA'
};

var DPHeadPanel = function DPHeadPanel(props) {
    var topRow,
        botRow,
        topRowCells = [],
        botRowCells = [],
        noPrintCell = React.DOM.th({
        className: 'only-print'
    });

    if (props.reportType === 'Daily Production') {
        topRowCells.push(noPrintCell);
        botRowCells.push(noPrintCell);
    }
    props.headerTop.map(function (item, i) {
        topRowCells.push(React.createElement(DPthCell, {
            colspan: props.colspanArray ? props.colspanArray[i] : props.colspan,
            data: item.name
        }));
    });

    props.headerBot.map(function (item) {
        botRowCells.push(React.createElement(DPthCell, {
            className: item.cls,
            data: item.name
        }));
    });

    topRow = React.DOM.tr({}, topRowCells);
    botRow = React.DOM.tr({
        'className': 'bottom-row'
    }, botRowCells);

    return React.DOM.thead({}, topRow, botRow);
};

var DPtdCell = function DPtdCell(props) {
    var tag;

    if (props.isLastRow || props.isBold) {
        tag = 'strong';
    } else if (props.isAvail) {
        tag = 'em';
    } else if (props.isRev) {
        tag = 'span';
    }

    return React.DOM.td({
        className: props.className
    }, React.DOM[tag]({}, props.data));
};

DPtdCell.propTypes = {
    isLastRow: React.PropTypes.bool,
    isBold: React.PropTypes.bool,
    isAvail: React.PropTypes.bool,
    isRev: React.PropTypes.bool,
    data: React.PropTypes.any,
    className: React.PropTypes.string
};
DPtdCell.defaultProps = {
    isRev: true,
    data: '0',
    className: ''
};

var DPBodyRow = function DPBodyRow(props) {

    var cells = [];

    if (props.reportType === 'Daily Production') {
        cells.push(React.createElement(DPtdCell, {
            className: 'only-print with-background',
            data: props.roomName,
            isLastRow: props.isLastRow
        }));
    }
    props.rowData.map(function (item, i) {
        cells.push(React.createElement(DPtdCell, {
            isLastRow: props.isLastRow,
            isAvail: item.isAvail,
            isRev: item.isRev,
            className: item.cls,
            data: item.value,
            isBold: item.isRateType
        }));
    });

    return React.DOM.tr({}, cells);
};

var DPBodyPanel = function DPBodyPanel(props) {
    var lastIndex = props.reportData.length - 1,
        rows = [];

    props.reportData.map(function (item, i) {
        rows.push(React.createElement(DPBodyRow, {
            rowData: item,
            isLastRow: props.isLastRowSum && lastIndex === i,
            roomName: props.roomNames ? props.roomNames[i] : '',
            reportType: props.reportType
        }));
    });

    return React.DOM.tbody({}, rows);
};

var DPContent = React.createClass({
    displayName: 'DPContent',

    componentDidMount: function componentDidMount() {
        if (_typeof(this.props.reactRenderDone) === _typeof(function () {})) {
            this.props.reactRenderDone();
        }

        document.getElementById('daily-production-render').style.width = this.props.rightPaneWidth;
    },

    componentDidUpdate: function componentDidUpdate() {
        if (_typeof(this.props.reactRenderDone) === _typeof(function () {})) {
            this.props.reactRenderDone();
        }

        document.getElementById('daily-production-render').style.width = this.props.rightPaneWidth;
    },

    render: function render() {
        return React.DOM.table({
            className: 'statistics-reports'
        }, React.createElement(DPHeadPanel, {
            colspan: this.props.colspan,
            headerTop: this.props.headerTop,
            headerBot: this.props.headerBot,
            colspanArray: this.props.colspanArray,
            reportType: this.props.reportType
        }), React.createElement(DPBodyPanel, {
            reportData: this.props.reportData,
            isLastRowSum: this.props.isLastRowSum,
            roomNames: this.props.roomNames,
            reportType: this.props.reportType
        }));
    }
});