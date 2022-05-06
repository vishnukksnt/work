"use strict";

var _ReactRedux = ReactRedux,
    connect = _ReactRedux.connect;


var calculateAssignRoomPositionAndDuration = function calculateAssignRoomPositionAndDuration(diaryInitialDayOfDateGrid, uarData, numberOfDays) {
    var nightDuration = NIGHTLY_DIARY_CONST.RESERVATION_ROW_WIDTH / numberOfDays;
    var diaryInitialDate = tzIndependentDate(diaryInitialDayOfDateGrid);
    var assignRoomStartDate = tzIndependentDate(uarData.fromDate);

    var oneDay = 24 * 60 * 60 * 1000;
    var diffBtwInitialAndStartDate = assignRoomStartDate.getTime() - diaryInitialDate.getTime();
    var noOfDaysBtwInitialAndArrivalDate = Math.abs(diffBtwInitialAndStartDate / oneDay);

    var assignRoomPosition = 0;

    if (noOfDaysBtwInitialAndArrivalDate > 0) {
        assignRoomPosition = noOfDaysBtwInitialAndArrivalDate * nightDuration;
    }
    if (noOfDaysBtwInitialAndArrivalDate >= 0) {
        if (numberOfDays === NIGHTLY_DIARY_CONST.DAYS_7) {
            assignRoomPosition = assignRoomPosition + NIGHTLY_DIARY_CONST.DAYS_POSITION_ADD_7;
        } else if (numberOfDays === NIGHTLY_DIARY_CONST.DAYS_21) {
            assignRoomPosition = assignRoomPosition + NIGHTLY_DIARY_CONST.DAYS_POSITION_ADD_21;
        }
    }

    var durationOfAssignRoom = 0;
    var numberOfNightsVisibleInGrid = uarData.nights <= 1 ? 1 : uarData.nights;

    durationOfAssignRoom = numberOfNightsVisibleInGrid * nightDuration;
    var returnData = {};

    returnData.numberOfNightsVisibleInGrid = numberOfNightsVisibleInGrid;
    returnData.style = {};
    returnData.style.width = durationOfAssignRoom + "px";
    returnData.style.transform = "translateX(" + assignRoomPosition + "px)";

    return returnData;
};

var mapStateToNightlyDiaryAssignRoomContainerProps = function mapStateToNightlyDiaryAssignRoomContainerProps(state) {
    return {
        uar_data: calculateAssignRoomPositionAndDuration(state.diaryInitialDayOfDateGrid, state.availableSlotsForAssignRooms, state.numberOfDays),
        assignRoom: state.callBackFromAngular.clickedAssignRoom,
        availableSlotsForAssignRooms: state.availableSlotsForAssignRooms
    };
};

var NightlyDiaryAssignRoomContainer = connect(mapStateToNightlyDiaryAssignRoomContainerProps)(NightlyDiaryAssignRoomComponent);