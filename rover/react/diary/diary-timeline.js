var Timeline = React.createClass({
    __get_property_time_line_showing_point: function() {
        var props = this.props,
            display = props.display,
            prop_time = display.property_date_time.start_date,
            start_time = display.x_n instanceof Date ? display.x_n.getTime() : display.x_n,
            end_time = display.x_p instanceof Date ? display.x_p.getTime() : display.x_p,
            point_to_plot = -1 ; // -1 do not wanted to show red line

        var diff_s_e, diff_p_s, ms_int, timeStart, timeProp, timeDiffFromStart;

        if (start_time <= prop_time <= end_time) {
            // diff of prop time & start time
            diff_s_e = end_time - start_time;
            diff_p_s = prop_time - start_time;
            ms_int = diff_s_e / (display.hours * display.intervals_per_hour);
            point_to_plot = diff_p_s / ms_int;
            point_to_plot++; // since zeroth point is considered as
            // Adjust for day light saving switches
            timeStart = new Date(start_time);
            timeProp = new Date(prop_time);
            timeDiffFromStart = timeProp.getTimezoneOffset() - timeStart.getTimezoneOffset();
            point_to_plot += timeDiffFromStart / (60 / display.intervals_per_hour);
        }
        return point_to_plot;
    },

    __get_date_for_timeline_displaying: function(dateObj) {
        return dateObj.toComponents().date.weekday + ' - ' + dateObj.toComponents().date.toShortDateString();
    },

    render: function() {
        var props = this.props,
            state = this.state,
            display = props.display,
            timeline,
            hourly_spans = [],
            segment_hour_display = [],
            interval_spans,
            px_per_int = display.px_per_int + 'px',
            px_per_hr = display.px_per_hr + 'px',
            start_time = display.x_n_time,
            self = this,
            current_time_plot_point = this.__get_property_time_line_showing_point(),
            i,
            j,
            len;

        var today = props.filter.arrival_date,
            clone = new tzIndependentDate( today.valueOf() ),
            tmrow = new tzIndependentDate( clone.setDate(clone.getDate() + 1) ),
            todayShortDate,
            tmrowShortDate,
            spanClass,
            interval_counter = 1;

        (function() {
            var startingTime = new Date(props.filter.arrival_date),
                timeBefore,
                timeChnangeDiff,
                i,
                len;

            startingTime.setHours(0, 0, 0, 0);

            for (i = 0, len = display.hours; i < len; i++) {
                timeBefore = new Date( startingTime );
                timeBefore.setHours( timeBefore.getHours() - 1);

                timeChnangeDiff = startingTime.getTimezoneOffset() - timeBefore.getTimezoneOffset();


                if ( timeChnangeDiff < 0 ) {
                    // do nothing since this hour will be forwarded to next hour
                    // the lost hour due to DST change
                }
                else if ( timeChnangeDiff > 0 ) {
                    // repeat the last hour -- the extra hour due to DST change
                    segment_hour_display.push( timeBefore.getHours() + ':00' );

                    // continue as usual
                    segment_hour_display.push( startingTime.getHours() + ':00' );
                } else {
                    segment_hour_display.push( startingTime.getHours() + ':00' );
                }

                startingTime.setHours(startingTime.getHours() + 1);
            }
        })();

        if ( today instanceof Date ) {
            todayShortDate = this.__get_date_for_timeline_displaying (today);
            tmrowShortDate = this.__get_date_for_timeline_displaying (tmrow);
        } else {
            todayShortDate = tmrowShortDate = '';
        }

        /* CREATE TIMELINE */
        for (i = 0, len = display.hours; i < len; i++) {
            interval_spans = [];

            interval_spans.push(
                React.DOM.span(
                    {
                        className: ''
                    },
                    segment_hour_display[i]
                )
            );

            if ( i % 6 === 0 ) {
                interval_spans.push(
                    React.DOM.span(
                        {
                            className: 'date'
                        },
                        i < 23 ? todayShortDate : tmrowShortDate
                    )
                );
            }

            for (j = 0; j < display.intervals_per_hour; j++, interval_counter++) {
                spanClass = 'interval-' + (j + 1);

                if (interval_counter === parseInt(current_time_plot_point, 10) ) {
                    spanClass += ' active';
                }
                interval_spans.push(
                    React.DOM.span(
                        {
                            className: spanClass,
                            style: {
                                width: px_per_int
                            }
                        }
                    )
                );
            }

            hourly_spans.push(
                React.DOM.span(
                    {
                        className: 'segment',
                        style: {
                            width: px_per_hr
                        }
                    },
                    interval_spans
                )
            );
        }

        return React.DOM.div(
            {
                className: 'wrapper',
                style: {
                    width: display.width + 'px'
                }
            },
            React.DOM.div(
                {
                    className: 'hours'
                },
                hourly_spans
            ),
            React.createElement(
                Resizable,
                {
                    display: display,
                    edit: props.edit,
                    filter: props.filter,
                    iscroll: props.iscroll,
                    meta: props.meta,
                    __onResizeCommand: props.__onResizeCommand,
                    __onResizeStart: props.__onResizeStart,
                    __onResizeEnd: props.__onResizeEnd,
                    currentResizeItem: props.currentResizeItem,
                    currentResizeItemRow: props.currentResizeItemRow,
                    reservatonFlow: props.reservatonFlow
                }
            )
        );
    }
});