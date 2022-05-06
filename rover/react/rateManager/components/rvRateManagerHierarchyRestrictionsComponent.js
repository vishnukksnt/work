'use strict';

var _React = React,
    createClass = _React.createClass;


var RateManagerHierarchyRestrictionsComponent = createClass({
    selectRestriction: function selectRestriction(event) {
        var value = event.target.value;

        this.props.changedHeirarchyRestriction(value);
    },
    render: function render() {
        var _this = this;

        return React.createElement(
            'div',
            { className: 'select' },
            React.createElement(
                'select',
                { onChange: function onChange() {
                        return _this.selectRestriction(event);
                    } },
                this.props.listValues.map(function (item) {
                    return React.createElement(
                        'option',
                        { key: item.value, value: item.value },
                        item.name
                    );
                })
            )
        );
    }
});