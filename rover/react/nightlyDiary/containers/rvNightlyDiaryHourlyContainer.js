"use strict";

var _ReactRedux = ReactRedux,
    connect = _ReactRedux.connect;


var calculateHourlyRoomsPositionAndDuration = function calculateHourlyRoomsPositionAndDuration(diaryInitialDayOfDateGrid, hourly_data, isNightlyPresent, numberOfDays) {
    var nightDuration = NIGHTLY_DIARY_CONST.RESERVATION_ROW_WIDTH / numberOfDays;
    var diaryInitialDate = tzIndependentDate(diaryInitialDayOfDateGrid);
    var arrivalTime = tzIndependentDate(hourly_data.arrival_date);
    var diffBtwInitialAndStartDate = arrivalTime.getTime() - diaryInitialDate.getTime();
    var oneDay = 24 * 60 * 60 * 1000;
    var noOfDaysBtwInitialAndArrivalDate = diffBtwInitialAndStartDate / oneDay;
    var unHourlyRoomPosition = noOfDaysBtwInitialAndArrivalDate * nightDuration;

    hourly_data.status = hourly_data.is_pre_checkin ? "PRE_CHECKIN" : hourly_data.status;
    var reservationStatusClass = getReservationStatusClass(hourly_data.status);

    // CICO-61621 : durationOfHourlydRoom = 30 or 60, maximum duration for single half. for 7/21 modes.
    var durationOfHourlydRoom = numberOfDays === NIGHTLY_DIARY_CONST.DAYS_21 ? 30 : 60;
    var returnData = {};

    returnData.style = {};
    returnData.style.width = durationOfHourlydRoom + "px";
    returnData.style.transform = "translateX(" + unHourlyRoomPosition + "px)";

    if (isNightlyPresent) {
        returnData.reservationClass = "reservation dayuse " + reservationStatusClass + " overlap-0";
    } else {
        returnData.reservationClass = "reservation dayuse " + reservationStatusClass;
    }
    return returnData;
};

var mapStateToNightlyDiaryHourlyContainerProps = function mapStateToNightlyDiaryHourlyContainerProps(state, ownProps) {
    return {
        hourly_data: calculateHourlyRoomsPositionAndDuration(state.diaryInitialDayOfDateGrid, ownProps.hourlyItem, ownProps.isNightlyPresent, state.numberOfDays),
        state: state
    };
};

var NightlyDiaryHourlyContainer = connect(mapStateToNightlyDiaryHourlyContainerProps)(NightlyDiaryHourlyComponent);