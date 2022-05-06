var GridRowItem = React.createClass({
    getInitialState: function() {
        return {
            editing: this.props.edit.active,
            resizing: this.props.resizing,
            currentResizeItem: this.props.currentResizeItem,
            currentResizeItemRow: this.props.currentResizeItemRow,
            isDragOver: false
        };
    },
    componentDidMount: function() {},

    componentWillReceiveProps: function(nextProps) {
        var meta_id = this.props.meta.occupancy.id,
            edit = nextProps.edit,
            editing = edit.active,
            creating;

        if (editing && (edit.originalItem[meta_id] === nextProps.data[meta_id])) {
            this.setState({
                editing: true,
                resizing: true,
                currentResizeItem: nextProps.currentResizeItem,
                currentResizeItemRow: nextProps.currentResizeItemRow
            });
        } else if (!editing && nextProps.currentResizeItem && (nextProps.currentResizeItem[meta_id] === nextProps.data[meta_id])) {
            this.setState({
                editing: nextProps.edit.active,
                resizing: true,
                currentResizeItem: nextProps.currentResizeItem,
                currentResizeItemRow: nextProps.currentResizeItemRow
            });
        } else if ((!this.props.edit.active && this.props.currentResizeItem && !nextProps.currentResizeItem) ||
            (this.props.edit.active && !editing)) {
            this.setState({
                editing: false,
                resizing: false,
                currentResizeItem: undefined,
                currentResizeItemRow: undefined
            });
        }
    },

    componentWillUnmount: function() {},

    __formInnerText: function(data, meta) {
        var caption,
            props = this.props,
            display = props.display,
            showRateAmount;


        try {
            var dragData = props.unassignedRoomList.dragData;

            if (!_.isEmpty(dragData) && !dragData.is_hourly) {
                showRateAmount = false;
            } else {
                showRateAmount = true;
            }
        } catch (e) {
            showRateAmount = true;
        }

        switch (data[meta.status]) {
            case 'available':
                if (showRateAmount) {
                    caption = data.rate_currency + ' ' + parseFloat(data[meta.rate]).toFixed(2) + ' | ' + data[meta.room_type];
                } else {
                    caption = data[meta.room_type];
                }
                break;
            case 'blocked':
                caption = 'Web Booking In Progress';
                break;
            default:
                caption = data[meta.guest];
                // in case of guest name is blank, we have to show account name againstg taht.
                if (!caption) {
                    caption = data[meta.tr_ag_name] ? data[meta.tr_ag_name] : data[meta.cmp_name];
                }

                // if there is any accomoanying guests
                if (!_.isEmpty(data[meta.accompanying_guests])) {
                    caption = caption + '  |  ';
                    _.each(data[meta.accompanying_guests], function(element, index, list) {
                        caption += element.guest_name;
                        if (index !== (list.length - 1)) {
                            caption += ', ';
                        }
                    });
                }
                break;
        }
        return caption;


    },

    __formHouseKeepingStyle: function(data, display, meta, end_time_ms) {

        var style = {},
            ms_fifteen_min = 900000,
            end_of_reservation;

        style.width = data[meta.maintenance] * display.px_per_int + 'px';
        end_of_reservation = data[meta.maintenance] * ms_fifteen_min + end_time_ms;

        // (CICO-12358) when the reservation end is touching the end of the grid, we are hiding the house keeping task or showing the partial
        if (end_of_reservation > display.x_p) {
            // reservation crossing the grid boundary we are hiding
            if (end_time_ms > display.x_p || !data.is_hourly) {
                style.display = 'none';
            } else {
                style.width = ((display.x_p - end_time_ms) * display.px_per_ms) + 'px';
            }
        }
        return style;

    },

    __get_class_for_reservation_span: function() {
        var props = this.props,
            state = this.state,
            data = props.data,
            m = props.meta.occupancy,
            is_temp_reservation = data[m.status] === 'available';

        //	console.log(props)

        // if not availability check, this reservation was already there
        var className = !is_temp_reservation ? 'occupied ' : '';

        // when we select a particular reservation
        className += state.editing ? ' editing' : '';

        // we have to show striped reservation when we select a availability check reservation
        className += (is_temp_reservation && data.selected) || (is_temp_reservation && this.state.isDragOver) ? ' reserved' : '';

        // guest status mapping
        // console.log(data.cannot_move_room)
        switch (data[m.status]) {

            case 'reserved':
                className += ' check-in';
                break;

            case 'checking_in':
                className += ' check-in ';
                // console.log(">++>"+data.cannot_move_room)
                // className += (data[m.cannnot_move_room] ? 'locked' : '')
                break;

            case 'checkedin':
                className += ' inhouse ';
                // className += (data[m.cannnot_move_room] ? 'locked' : '')
                break;

            case 'checkedout':
                className += ' check-out ';
                break;
            case 'checking_out':
                className += ' departed ';
                break;

            case 'noshow':
                className += ' no-show ';
                break;
            default:
                className += ' ' + data[m.status];
                break;
        }
        if (data.cannot_move_room) {
            className += ' locked';
        }
        if (typeof data.is_hourly !== 'undefined' && !data.is_hourly) {
            className += ' occupied';
        }

        return className;
        
    },

    render: function() {

        var props = this.props,
            state = this.state,
            display = props.display,
            px_per_ms = display.px_per_ms,
            px_per_int = display.px_per_int,
            x_origin = display.x_n,
            data = props.data,
            row_data = props.row_data,
            m = props.meta.occupancy,
            start_time_ms = !state.resizing ? data[m.start_date] : state.currentResizeItem[m.start_date],
            end_time_ms = !state.resizing ? data[m.end_date] : state.currentResizeItem[m.end_date],
            maintenance_time_span = data[m.maintenance] * px_per_int,
            reservation_time_span = (end_time_ms - start_time_ms) * px_per_ms,

            innerText = this.__formInnerText(data, m),

            houseKeepingTaskStyle = this.__formHouseKeepingStyle(data, display, m, end_time_ms),
            left = (start_time_ms - x_origin) * px_per_ms + 'px',
            is_balance_present = data.is_balance_present,
            is_room_locked = data.cannot_move_room,
            isNightlyReservation = (typeof data.is_hourly !== 'undefined' && !data.is_hourly),
            is_vip = data.is_vip,
            show_outstanding_indicator = (data.reservation_status === 'check-in' || data.reservation_status === 'reserved') && is_balance_present,
            row_item_class = 'occupancy-block' + (state.editing ? ' editing' : '') +
                (show_outstanding_indicator ? ' deposit-required' : '');
        
        // CICO-73467 : Disable Click,Drag and other Events for Night Components in Edit Mode.
        if (state.editing && isNightlyReservation) {
            row_item_class += ' disable-element';
        }

        if (state.editing) {
            start_time_ms = state.currentResizeItem[m.start_date];
            end_time_ms = state.currentResizeItem[m.end_date];
            left = (start_time_ms - x_origin) * px_per_ms + 'px';
        }
        var start_date = new Date(start_time_ms);

        var display_start_time = display.x_n instanceof Date ? display.x_n : new Date(display.x_n);

        if (!display_start_time.isOnDST() && start_date.isOnDST()) {
            var dateForCalculatingLeft = new Date(start_time_ms);

            dateForCalculatingLeft.setMinutes(dateForCalculatingLeft.getMinutes() + dateForCalculatingLeft.getDSTDifference());
            left = (dateForCalculatingLeft.getTime() - x_origin) * px_per_ms + 'px';
        } 
        else if (display_start_time.isOnDST() && !start_date.isOnDST()) {
            var dateForCalculatingLeft = new Date(start_time_ms);

            dateForCalculatingLeft.setMinutes(dateForCalculatingLeft.getMinutes() + dateForCalculatingLeft.getDSTDifference());

            left = (dateForCalculatingLeft.getTime() - x_origin) * px_per_ms + 'px';

            // The special case adjustment
            if (dateForCalculatingLeft.isOnDST()) {
                left = (dateForCalculatingLeft.getTime() + 3600000 - x_origin) * px_per_ms + 'px';
            }
        }

        var styleForDepositIcon = {},
            styleForRoomLocked = {},
            styleForNightlyIcon = {};
        
        if (!show_outstanding_indicator) {
            styleForDepositIcon.display = 'none';
            styleForDepositIcon.width = '0px';
        }
        if (!this.props.data.is_hourly) {
            styleForRoomLocked.display = 'none';
            styleForRoomLocked.width = '0px';
        }
        if (this.props.data.is_hourly) {
            styleForNightlyIcon.display = 'none';
            styleForNightlyIcon.width = '0px';
        }

        return React.createElement(GridRowItemDrag, {
                key: data.key,
                className: row_item_class,
                row_data: row_data,
                meta: props.meta,
                data: data,
                rateCurrency: data.rate_currency,
                display: display,
                viewport: props.viewport,
                edit: props.edit,
                unassignedRoomList: props.unassignedRoomList,
                iscroll: props.iscroll,
                angular_evt: props.angular_evt,
                __onDragStart: props.__onDragStart,
                __onDragStop: props.__onDragStop,
                __onResizeCommand: props.__onResizeCommand,
                show_outstanding_indicator: show_outstanding_indicator,
                is_room_locked: is_room_locked,
                isNightlyReservation: isNightlyReservation,
                currentDragItem: props.currentResizeItem,
                style: {
                    left: left,
                    opacity: '1'
                },
                __setDragOver: function(bool) {
                    this.__setDragOver(bool);
                }.bind(this)
            },
            React.DOM.span({
                    className: this.__get_class_for_reservation_span(),
                    style: {
                        width: reservation_time_span + 'px'
                    }
                },
                React.DOM.span({
                        className: 'name'
                    },
                    innerText,
                    React.DOM.span({
                        className: isNightlyReservation ? 'reservation-type' : '',
                        style: styleForNightlyIcon
                    }, isNightlyReservation ? '(N)' : ''),
                ''),
                React.DOM.span({
                    className: show_outstanding_indicator ? 'deposit-icon' : '',
                    style: styleForDepositIcon
                }, data.rate_currency),
                React.DOM.span({
                    className: is_room_locked ? 'icons icon-diary-lock' : '',
                    style: styleForRoomLocked
                }, ''),
                React.DOM.span({
                    className: is_vip ? 'vip' : '',
                    style: styleForRoomLocked
                }, is_vip ? 'VIP' : '')),
            React.DOM.span({
                className: 'maintenance',
                style: houseKeepingTaskStyle
            }, ' '));
    }
});
