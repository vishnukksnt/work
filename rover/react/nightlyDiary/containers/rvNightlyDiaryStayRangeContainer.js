"use strict";

var _ReactRedux = ReactRedux,
    connect = _ReactRedux.connect;
/*
 * To convert current selected reservation params to use in stay range component
 * @param object currentSelectedReservation
 */

var convertCurrentSelectedReservation = function convertCurrentSelectedReservation(currentSelectedReservation, selectedReservationId, dateFormat, isMoveRoomViewActive) {

    var stayRangeArrivalClass = "grid-stay-range";

    if (isMoveRoomViewActive) {
        stayRangeArrivalClass += " disable-element";
    }

    if (selectedReservationId) {
        currentSelectedReservation.arrivalStyle = {};
        currentSelectedReservation.departureStyle = {};
        currentSelectedReservation.arrivalStyle.transform = 'translateX(' + currentSelectedReservation.arrivalPosition + ')';
        currentSelectedReservation.departureStyle.transform = 'translateX(' + currentSelectedReservation.departurePosition + ')';
        // TO DO: Add momentjs and do date formatting using momentjs
        // We have to show date in hotel's date format
        currentSelectedReservation.arrivalDate = moment(currentSelectedReservation.arrival_date, "YYYY-MM-DD").format(dateFormat.toUpperCase());
        currentSelectedReservation.deptDate = moment(currentSelectedReservation.dept_date, "YYYY-MM-DD").format(dateFormat.toUpperCase());
        currentSelectedReservation.class = stayRangeArrivalClass;
        currentSelectedReservation.arrivalClass = currentSelectedReservation.isArrivalFlagVisible ? "handle arrival left" : "handle arrival left hidden";
        currentSelectedReservation.departureClass = currentSelectedReservation.isDepartureFlagVisible ? "handle departure" : "handle departure hidden";
        currentSelectedReservation.dateFormat = dateFormat;
    }
    return currentSelectedReservation;
};

var mapStateToNightlyDiaryStayRangeContainerProps = function mapStateToNightlyDiaryStayRangeContainerProps(state) {
    return {
        currentSelectedReservation: convertCurrentSelectedReservation(state.currentSelectedReservation, state.selectedReservationId, state.dateFormat, state.isMoveRoomViewActive),
        extendShortenReservation: state.callBackFromAngular.extendShortenReservation,
        showOrHideSaveChangesButton: state.callBackFromAngular.showOrHideSaveChangesButton,
        checkReservationAvailability: state.callBackFromAngular.checkReservationAvailability,
        numberOfDays: state.numberOfDays,
        isPmsProductionEnvironment: state.isPmsProductionEnvironment,
        isMoveRoomViewActive: state.isMoveRoomViewActive

    };
};

var NightlyDiaryStayRangeContainer = connect(mapStateToNightlyDiaryStayRangeContainerProps)(NightlyDiaryStayRangeComponent);