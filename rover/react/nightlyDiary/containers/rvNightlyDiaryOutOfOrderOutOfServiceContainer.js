"use strict";

var _ReactRedux = ReactRedux,
    connect = _ReactRedux.connect;


var calculateOutOfOrderOutOfServicePositionAndDuration = function calculateOutOfOrderOutOfServicePositionAndDuration(diaryInitialDayOfDateGrid, oooOosData, numberOfDays) {
    var nightDuration = NIGHTLY_DIARY_CONST.RESERVATION_ROW_WIDTH / numberOfDays;
    var diaryInitialDate = tzIndependentDate(diaryInitialDayOfDateGrid);
    var outOfOrderOutOfServiceStartDate = tzIndependentDate(oooOosData.start_date);
    var outOfOrderOutOfServiceEndDate = tzIndependentDate(oooOosData.end_date);
    var finalDayOfDiaryGrid = diaryInitialDate.getTime() + (numberOfDays - 1) * 24 * 60 * 60 * 1000; // Minusing 1 bcoz otherwise last date end value (gettime) and next days start will be same.

    var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    // Get the number of days between initial day of diary grid and arrival date
    var diffBtwInitialAndArrivalDate = outOfOrderOutOfServiceStartDate.getTime() - diaryInitialDate.getTime();
    var noOfDaysBtwInitialAndArrivalDate = 0;

    if (diffBtwInitialAndArrivalDate > 0) {
        noOfDaysBtwInitialAndArrivalDate = Math.abs(diffBtwInitialAndArrivalDate / oneDay);
    } else if (diffBtwInitialAndArrivalDate < 0) {
        noOfDaysBtwInitialAndArrivalDate = -1; // setting -ve number
    }
    // Position is calculated like this:
    // Step 1 - [ first-day - arrival-date ] = X Days
    // - Get how many X days are between arrival date and first day shown in the diary. If that number is negative (res. started in past), your position is 0 and you're done here.
    // - If the arrival date is the first day ( X == 0 ) in the grid, position is again 0 and you're done here.

    // Step 2
    // - Multiply that number by {night-duration}
    // Step 3
    // - Add 10 to that number if showing 21 days, or 15 if showing 7 days
    var outOfOrderOutOfServicePosition = 0;

    if (noOfDaysBtwInitialAndArrivalDate > 0) {
        outOfOrderOutOfServicePosition = noOfDaysBtwInitialAndArrivalDate * nightDuration;
    }
    if (noOfDaysBtwInitialAndArrivalDate >= 0) {
        if (numberOfDays === NIGHTLY_DIARY_CONST.DAYS_7) {
            outOfOrderOutOfServicePosition = outOfOrderOutOfServicePosition + NIGHTLY_DIARY_CONST.DAYS_POSITION_ADD_7;
        } else if (numberOfDays === NIGHTLY_DIARY_CONST.DAYS_21) {
            outOfOrderOutOfServicePosition = outOfOrderOutOfServicePosition + NIGHTLY_DIARY_CONST.DAYS_POSITION_ADD_21;
        }
    }

    // {duration} - Duration is calculated like this:

    // Case: Departures within the grid || Not Stay-Day Reservations

    //     Step 1
    //     - Get the number of nights (if we have an arrival-date from the past, then calculate only the nights from the first day in the grid )
    //     - Multiply {no. of nights} with {night-duration}.
    //     Step 2:
    //      Case:
    //         Position == 0 -
    //          - Add 10 to the value
    //         Position > 0
    //          - Substract 5 from the value
    // Case: Stay-Day Reservations
    //       Reservations that have the same arrival and departure date ( nights == 0 )
    //       21 Days:
    //       - {night-duration} - 10
    //       7 Days:
    //       - {night-duration} - 15
    // Case: Departures outside the grid
    //       All reservations that have their departure outside the grid
    //       {max-departure-day} : 7 (if 7days), 21 (if 21days)
    //       {arrival-day} : the day when the reservation starts (if past or first day = 1, second day = 2, ....)

    //       Step 1:
    //       - Get the number of days that are still inside the grid
    //       {max-departure-day - arrival-day + 1} // Adding the 1 night fix
    //       // Example: Arrival is the last day (7) => 7 - 7 = 0, 0 + 1 = 1 -> 1 night that we do show
    //       // Example: Arrival is the first day (1) => 7 - 1 = 6, 6 + 1 = 7 -> we want to show all the nights through the grid
    //       - Step 2:
    //       21 Days:
    //         - Substract 10 from it
    //       7 Days:
    //         - Substract 15 from it

    var durationOfOutOfOrderOutOfService = 0;
    var numberOfNightsVisibleInGrid = Math.abs((outOfOrderOutOfServiceEndDate.getTime() - outOfOrderOutOfServiceStartDate.getTime()) / oneDay);

    if (outOfOrderOutOfServiceEndDate.getTime() >= diaryInitialDate.getTime() && outOfOrderOutOfServiceEndDate.getTime() <= finalDayOfDiaryGrid && outOfOrderOutOfServiceStartDate.getTime() !== outOfOrderOutOfServiceEndDate.getTime()) {

        if (outOfOrderOutOfServiceStartDate.getTime() < diaryInitialDate.getTime()) {
            numberOfNightsVisibleInGrid = Math.abs((outOfOrderOutOfServiceEndDate.getTime() - diaryInitialDate.getTime()) / oneDay);
        }
        numberOfNightsVisibleInGrid = numberOfNightsVisibleInGrid + 1;
        durationOfOutOfOrderOutOfService = numberOfNightsVisibleInGrid * nightDuration;
        if (outOfOrderOutOfServiceStartDate.getTime() >= diaryInitialDate.getTime()) {
            // durationOfOutOfOrderOutOfService = durationOfOutOfOrderOutOfService;

            if (numberOfDays === NIGHTLY_DIARY_CONST.DAYS_7) {
                durationOfOutOfOrderOutOfService = durationOfOutOfOrderOutOfService - NIGHTLY_DIARY_CONST.DAYS_POSITION_ADD_7;
            } else if (numberOfDays === NIGHTLY_DIARY_CONST.DAYS_21) {
                durationOfOutOfOrderOutOfService = durationOfOutOfOrderOutOfService - NIGHTLY_DIARY_CONST.DAYS_POSITION_ADD_21;
            }
        }
    } else if (outOfOrderOutOfServiceStartDate.getTime() === outOfOrderOutOfServiceEndDate.getTime()) {
        if (numberOfDays === NIGHTLY_DIARY_CONST.DAYS_7) {
            durationOfOutOfOrderOutOfService = nightDuration - NIGHTLY_DIARY_CONST.DAYS_POSITION_ADD_7;
        } else if (numberOfDays === NIGHTLY_DIARY_CONST.DAYS_21) {
            durationOfOutOfOrderOutOfService = nightDuration - NIGHTLY_DIARY_CONST.DAYS_POSITION_ADD_21;
        }
    } else if (outOfOrderOutOfServiceEndDate.getTime() > finalDayOfDiaryGrid) {
        var noOfDaysBtwFinalAndArrivalDate = Math.abs((finalDayOfDiaryGrid - outOfOrderOutOfServiceStartDate.getTime()) / oneDay);
        // Considering the day when the reservation starts (if past or first day = 1, second day = 2, ....)
        // let reservationArrivalDay = noOfDaysBtwFinalAndDepartureDate + 1;
        var daysInsideTheGrid = 0;

        if (numberOfDays === NIGHTLY_DIARY_CONST.DAYS_7) {
            daysInsideTheGrid = noOfDaysBtwFinalAndArrivalDate + 1;
            durationOfOutOfOrderOutOfService = nightDuration * daysInsideTheGrid - NIGHTLY_DIARY_CONST.DAYS_POSITION_ADD_7;
        } else if (numberOfDays === NIGHTLY_DIARY_CONST.DAYS_21) {
            daysInsideTheGrid = noOfDaysBtwFinalAndArrivalDate + 1;
            durationOfOutOfOrderOutOfService = nightDuration * daysInsideTheGrid - NIGHTLY_DIARY_CONST.DAYS_POSITION_ADD_21;
        }
    }
    var returnData = {};

    returnData.numberOfNightsVisibleInGrid = numberOfNightsVisibleInGrid;
    returnData.style = {};
    returnData.style.width = durationOfOutOfOrderOutOfService + "px";
    returnData.style.transform = "translateX(" + outOfOrderOutOfServicePosition + "px)";

    return returnData;
};

var mapStateToNightlyDiaryOutOfOrderOutOfServiceContainerProps = function mapStateToNightlyDiaryOutOfOrderOutOfServiceContainerProps(state, ownProps) {
    return {
        ooo_oos: calculateOutOfOrderOutOfServicePositionAndDuration(state.diaryInitialDayOfDateGrid, ownProps.ooo_oos, state.numberOfDays),
        ooo_oos_data: ownProps.ooo_oos,
        classForDiv: ownProps.ooo_oos.hk_service_status === "OUT_OF_SERVICE" ? "reservation oos" : "reservation ooo",
        gridDays: state.numberOfDays
    };
};

var NightlyDiaryOutOfOrderOutOfServiceContainer = connect(mapStateToNightlyDiaryOutOfOrderOutOfServiceContainerProps)(OutOfOrderOutOfServiceComponent);