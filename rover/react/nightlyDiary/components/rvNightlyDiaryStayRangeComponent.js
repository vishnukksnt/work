'use strict';

var NightlyDiaryStayRangeComponent = createClass({
    getInitialState: function getInitialState() {
        var currentSelectedReservation = this.props.currentSelectedReservation,
            departurePosition = parseInt(currentSelectedReservation.arrivalPosition) + currentSelectedReservation.duration,
            minAllowedPositionForDeparture = this.props.numberOfDays === NIGHTLY_DIARY_CONST.DAYS_21 ? NIGHTLY_DIARY_CONST.DAYS_POSITION_ADD_21 : NIGHTLY_DIARY_CONST.DAYS_POSITION_ADD_7,
            daysMode = this.props.numberOfDays,
            oneDayWidth = NIGHTLY_DIARY_CONST.RESERVATION_ROW_WIDTH / daysMode,
            oneNightDeparturePosition = parseInt(currentSelectedReservation.arrivalPositionInt) + NIGHTLY_DIARY_CONST.RESERVATION_ROW_WIDTH / daysMode - minAllowedPositionForDeparture;

        /*
         *  Set up initial state in component
         */
        return {
            isArrivalDragging: false,
            isDepartureDragging: false,
            mouseClikedX: 0,
            mouseLastPositionX: 0,
            arrivalStyle: currentSelectedReservation.arrivalStyle,
            departureStyle: currentSelectedReservation.departureStyle,
            departureDate: currentSelectedReservation.deptDate,
            // this.props.currentSelectedReservation.arrivalPosition / departurePosition is in the form of xxPX
            arrivalPosition: parseInt(currentSelectedReservation.arrivalPosition),
            arrivalDate: currentSelectedReservation.arrivalDate,
            maxArrivalFlagPos: Math.min(departurePosition, NIGHTLY_DIARY_CONST.RESERVATION_ROW_WIDTH) - oneDayWidth,
            minArrivalFlagPos: NIGHTLY_DIARY_CONST.DAYS_7_OFFSET,
            maxDepartureFlagPos: (daysMode - 1) * (NIGHTLY_DIARY_CONST.RESERVATION_ROW_WIDTH / daysMode),
            minDepartureFlagPos: Math.max(oneNightDeparturePosition, minAllowedPositionForDeparture),
            departurePosition: departurePosition,
            reservationDuration: currentSelectedReservation.duration,
            daysMode: daysMode,
            oneDayWidth: oneDayWidth,
            dateFormat: currentSelectedReservation.dateFormat,
            oneNightDeparturePosition: oneNightDeparturePosition,
            isZeroNightReservation: currentSelectedReservation.arrivalDate === currentSelectedReservation.deptDate ? true : false
        };
    },
    /*
     * Add event listeners on component mount
     * Event listeners added for both arrival and departure flag
     */
    componentDidMount: function componentDidMount() {
        var _this = this;

        this.isTouchEnabled = 'ontouchstart' in window;
        this.mouseStartingEvent = this.isTouchEnabled ? 'touchstart' : 'mousedown';
        this.mouseMovingEvent = this.isTouchEnabled ? 'touchmove' : 'mousemove';
        this.mouseLeavingEvent = this.isTouchEnabled ? 'touchend' : 'mouseup';
        var flagarea = this.flagarea;

        this.arrivalFlag.addEventListener(this.mouseStartingEvent, function (e) {
            return _this.arrivalFlagMouseDown(e);
        });
        this.departureFlag.addEventListener(this.mouseStartingEvent, function (e) {
            return _this.departureFlagMouseDown(e);
        });
        flagarea.addEventListener(this.mouseMovingEvent, function (e) {
            return _this.mouseMove(e);
        });
        flagarea.addEventListener(this.mouseLeavingEvent, function (e) {
            return _this.mouseLeave(e);
        });
        flagarea.addEventListener('mouseleave', function (e) {
            return _this.mouseLeave(e);
        });
    },
    /*
     * Mouse down event handling
     * setting up initial position of arrival flag in state
     */
    arrivalFlagMouseDown: function arrivalFlagMouseDown(e) {
        var state = this.state;

        e.preventDefault();
        e.stopPropagation();
        e = this.isTouchEnabled ? e.changedTouches[0] : e;
        state.isArrivalDragging = true;
        state.mouseClikedX = e.clientX;
        state.mouseLastPositionX = e.clientX;
    },

    /*
     * Mouse down event handling
     * setting up initial position of departure flag in state
     */
    departureFlagMouseDown: function departureFlagMouseDown(e) {
        var state = this.state;

        e.preventDefault();
        e.stopPropagation();
        e = this.isTouchEnabled ? e.changedTouches[0] : e;
        state.isDepartureDragging = true;
        state.mouseClikedX = e.clientX;
        state.mouseLastPositionX = e.clientX;
    },

    /*
     * Handle mouse moving event
     * On each move reservation and flag updated with the new position
     */
    mouseMove: function mouseMove(e) {
        e.preventDefault();
        e.stopPropagation();
        e = this.isTouchEnabled ? e.changedTouches[0] : e;
        var state = this.state,
            diff = e.clientX - this.state.mouseLastPositionX;

        if (state.isArrivalDragging) {
            this.moveArrivalFlag(diff);
        }
        if (state.isDepartureDragging) {
            this.moveDepartureFlag(diff);
        }
        this.state.mouseLastPositionX = e.clientX;
    },

    /*
     * Mouse leave event handling
     * removing event listeners on mouse leaving
     */
    mouseLeave: function mouseLeave(e) {
        var state = this.state,
            flagarea = this.flagarea;

        e.preventDefault();
        e.stopPropagation();
        if (state.isArrivalDragging) {
            state.isArrivalDragging = false;
            setTimeout(this.calculateArrivalDate, 500);
        }
        if (state.isDepartureDragging) {
            state.isDepartureDragging = false;
            setTimeout(this.calculateDepartureDate, 500);
        }
        flagarea.removeEventListener(this.mouseMovingEvent, function () {});
        flagarea.removeEventListener(this.mouseLeavingEvent, function () {});
        this.updateFlagRanges();
    },

    /*
     * Handle mouse moving event of arrival flag
     * Update reservation and flag
     */
    moveArrivalFlag: function moveArrivalFlag(diff) {
        var state = this.state,
            props = this.props,
            initialArrivalPosition = parseInt(props.currentSelectedReservation.arrivalPosition),
            differenceInPosition = state.arrivalPosition - initialArrivalPosition,
            differenceInDays = Math.ceil(differenceInPosition / state.oneDayWidth),
            curentPosition = state.arrivalPosition + diff,
            currentDay = moment(props.currentSelectedReservation.arrivalDate, state.dateFormat.toUpperCase()).add(differenceInDays - 1, 'days').format(state.dateFormat.toUpperCase());

        if (curentPosition < state.minArrivalFlagPos) {
            curentPosition = state.minArrivalFlagPos;
        }

        if (curentPosition > state.maxArrivalFlagPos) {
            curentPosition = state.maxArrivalFlagPos;
        }
        if (state.isArrivalDragging) {
            this.props.extendShortenReservation(curentPosition, state.departurePosition);
            this.setState({
                arrivalStyle: {
                    transform: 'translateX(' + curentPosition + 'px)'
                },
                arrivalPosition: curentPosition,
                arrivalDate: currentDay
            });
        }
    },

    /*
     * Handle mouse moving event of departure flag
     * Update reservation and flag
     */
    moveDepartureFlag: function moveDepartureFlag(diff) {
        var state = this.state,
            props = this.props,
            curentPosition = state.departurePosition + diff,
            initialDeparturePosition = parseInt(props.currentSelectedReservation.arrivalPosition) + props.currentSelectedReservation.duration,
            differenceInPosition = state.departurePosition - initialDeparturePosition,
            differenceInDays = Math.ceil(differenceInPosition / state.oneDayWidth),
            currentDay = moment(props.currentSelectedReservation.deptDate, state.dateFormat.toUpperCase()).add(differenceInDays - 1, 'days').format(state.dateFormat.toUpperCase());

        if (curentPosition > state.maxDepartureFlagPos) {
            curentPosition = state.maxDepartureFlagPos;
        }
        if (curentPosition < state.minDepartureFlagPos) {
            curentPosition = state.minDepartureFlagPos;
        }

        if (state.isDepartureDragging) {
            this.props.extendShortenReservation(state.arrivalPosition, curentPosition);
            this.setState({
                departureStyle: {
                    transform: 'translateX(' + curentPosition + 'px)'
                },
                departurePosition: curentPosition,
                departureDate: currentDay
            });
        }
    },

    /*
     * Function to calculate departure date
     * state is set to new position
     * Duration of reservation also updated with respect to new position
     */
    calculateDepartureDate: function calculateDepartureDate() {
        var state = this.state,
            props = this.props,
            initialDeparturePosition = parseInt(props.currentSelectedReservation.arrivalPosition) + props.currentSelectedReservation.duration,
            differenceInPosition = state.departurePosition - initialDeparturePosition,
            differenceInDays = Math.round(differenceInPosition / state.oneDayWidth),
            curentPosition = initialDeparturePosition + differenceInDays * state.oneDayWidth,
            addDays = state.isZeroNightReservation ? differenceInDays + 1 : differenceInDays,
            currentDay = moment(props.currentSelectedReservation.deptDate, state.dateFormat.toUpperCase()).add(addDays, 'days').format(state.dateFormat.toUpperCase());

        if (differenceInDays !== 0 || differenceInDays === 0 && differenceInPosition < 0) {
            props.showOrHideSaveChangesButton(true);
        } else {
            props.showOrHideSaveChangesButton(false);
        }

        // If flag moved to set for 0 night stay
        if (state.departurePosition === state.oneNightDeparturePosition) {

            if (props.currentSelectedReservation.isArrivalFlagVisible) {
                currentDay = state.arrivalDate;
            } else {
                currentDay = moment(props.currentSelectedReservation.deptDate, state.dateFormat.toUpperCase()).add(parseInt(addDays) - 1, 'days').format(state.dateFormat.toUpperCase());
            }

            curentPosition = state.oneNightDeparturePosition;
        } else {
            curentPosition = curentPosition + (this.props.numberOfDays === NIGHTLY_DIARY_CONST.DAYS_21 ? NIGHTLY_DIARY_CONST.EXTEND_21_DAYS : NIGHTLY_DIARY_CONST.EXTEND_7_DAYS);
        }
        props.extendShortenReservation(state.arrivalPosition, curentPosition);
        props.checkReservationAvailability(state.arrivalDate, currentDay);
        this.setState({
            departureStyle: {
                transform: 'translateX(' + curentPosition + 'px)'
            },
            departurePosition: curentPosition,
            departureDate: currentDay

        });
    },

    /*
     * Function to calculate arrival date
     * state is set to new position
     * Duration of reservation also updated with respect to new position
     */
    calculateArrivalDate: function calculateArrivalDate() {
        var state = this.state,
            props = this.props,
            initialArrivalPosition = parseInt(props.currentSelectedReservation.arrivalPosition),
            differenceInPosition = state.arrivalPosition - initialArrivalPosition,
            differenceInDays = Math.round(differenceInPosition / state.oneDayWidth),
            curentPosition = initialArrivalPosition + differenceInDays * state.oneDayWidth,
            currentDay = moment(props.currentSelectedReservation.arrivalDate, state.dateFormat.toUpperCase()).add(differenceInDays, 'days').format(state.dateFormat.toUpperCase());

        if (differenceInDays !== 0) {
            props.showOrHideSaveChangesButton(true, true);
        } else {
            props.showOrHideSaveChangesButton(false, true);
        }

        props.extendShortenReservation(curentPosition, state.departurePosition);
        props.checkReservationAvailability(currentDay, state.departureDate);

        this.setState({
            arrivalStyle: {
                transform: 'translateX(' + curentPosition + 'px)'
            },
            arrivalPosition: curentPosition,
            arrivalDate: currentDay
        });
    },

    /*
     * Update the flag ranges after moving the flags to different position
     */
    updateFlagRanges: function updateFlagRanges() {
        this.state.maxArrivalFlagPos = this.state.departurePosition - this.state.oneDayWidth;
        this.state.minDepartureFlagPos = this.state.arrivalPosition + this.state.oneDayWidth - (this.props.numberOfDays === NIGHTLY_DIARY_CONST.DAYS_21 ? NIGHTLY_DIARY_CONST.DAYS_POSITION_ADD_21 : NIGHTLY_DIARY_CONST.DAYS_POSITION_ADD_7);
    },
    render: function render() {
        var _this2 = this;

        var arrivalStyle = this.state.arrivalStyle,
            departureStyle = this.state.departureStyle,
            reservationClass = this.props.currentSelectedReservation.class;

        return React.createElement(
            'div',
            { className: reservationClass, ref: function ref(node) {
                    return _this2.flagarea = node;
                } },
            React.createElement(
                'a',
                { style: arrivalStyle, className: this.props.currentSelectedReservation.arrivalClass },
                React.createElement(
                    'span',
                    { className: 'title', ref: function ref(node) {
                            return _this2.arrivalFlag = node;
                        } },
                    'Arrival',
                    React.createElement(
                        'span',
                        { className: 'date' },
                        this.state.arrivalDate
                    )
                ),
                React.createElement('span', { className: 'line' })
            ),
            React.createElement(
                'a',
                { style: departureStyle, className: this.props.currentSelectedReservation.departureClass },
                React.createElement(
                    'span',
                    { className: 'title', ref: function ref(node) {
                            return _this2.departureFlag = node;
                        } },
                    'Departure',
                    React.createElement(
                        'span',
                        { className: 'date' },
                        this.state.departureDate
                    )
                ),
                React.createElement('span', { className: 'line' })
            )
        );
    }
});

var _React = React,
    PropTypes = _React.PropTypes;


NightlyDiaryStayRangeComponent.propTypes = {
    currentSelectedReservation: PropTypes.currentSelectedReservation
};