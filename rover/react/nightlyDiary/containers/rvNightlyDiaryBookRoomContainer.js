"use strict";

var _ReactRedux = ReactRedux,
    connect = _ReactRedux.connect;


var calculateBookRoomPositionAndDuration = function calculateBookRoomPositionAndDuration(diaryInitialDayOfDateGrid, uarData, numberOfDays) {
    var nightDuration = NIGHTLY_DIARY_CONST.RESERVATION_ROW_WIDTH / numberOfDays;
    var diaryInitialDate = tzIndependentDate(diaryInitialDayOfDateGrid);
    var moveRoomStartDate = tzIndependentDate(uarData.fromDate);

    var oneDay = 24 * 60 * 60 * 1000;
    var diffBtwInitialAndStartDate = moveRoomStartDate.getTime() - diaryInitialDate.getTime();
    var noOfDaysBtwInitialAndArrivalDate = diffBtwInitialAndStartDate / oneDay;

    var moveRoomPosition = 0;

    if (noOfDaysBtwInitialAndArrivalDate > 0) {
        moveRoomPosition = noOfDaysBtwInitialAndArrivalDate * nightDuration;
    }
    if (noOfDaysBtwInitialAndArrivalDate >= 0) {
        if (numberOfDays === NIGHTLY_DIARY_CONST.DAYS_7) {
            moveRoomPosition = moveRoomPosition + NIGHTLY_DIARY_CONST.DAYS_POSITION_ADD_7;
        } else if (numberOfDays === NIGHTLY_DIARY_CONST.DAYS_21) {
            moveRoomPosition = moveRoomPosition + NIGHTLY_DIARY_CONST.DAYS_POSITION_ADD_21;
        }
    }

    var numberOfNightsVisibleInGrid = uarData.nights <= 1 ? 1 : uarData.nights;
    var durationOfMoveRoom = numberOfNightsVisibleInGrid * nightDuration;

    if (numberOfDays === NIGHTLY_DIARY_CONST.DAYS_7 && uarData.nights === 0) {
        durationOfMoveRoom = durationOfMoveRoom - NIGHTLY_DIARY_CONST.DAYS_7_OFFSET;
    } else if (numberOfDays === NIGHTLY_DIARY_CONST.DAYS_7) {
        durationOfMoveRoom = durationOfMoveRoom - NIGHTLY_DIARY_CONST.EXTEND_7_DAYS / 2;
    } else if (numberOfDays === NIGHTLY_DIARY_CONST.DAYS_21 && uarData.nights === 0) {
        durationOfMoveRoom = durationOfMoveRoom - NIGHTLY_DIARY_CONST.DAYS_7_OFFSET / 2;
    } else {
        durationOfMoveRoom = durationOfMoveRoom - NIGHTLY_DIARY_CONST.EXTEND_21_DAYS / 2;
    }

    var returnData = {};

    returnData.numberOfNightsVisibleInGrid = numberOfNightsVisibleInGrid;
    returnData.style = {};
    returnData.style.width = durationOfMoveRoom + "px";
    returnData.style.transform = "translateX(" + moveRoomPosition + "px)";

    return returnData;
};

var mapStateToNightlyDiaryBookRoomContainerProps = function mapStateToNightlyDiaryBookRoomContainerProps(state) {
    return {
        uar_data: calculateBookRoomPositionAndDuration(state.diaryInitialDayOfDateGrid, state.availableSlotsForBookRooms, state.numberOfDays),
        bookRoom: state.callBackFromAngular.clickedBookRoom,
        availableSlotsForBookRooms: state.availableSlotsForBookRooms,
        diaryMode: state.diaryMode
    };
};

var NightlyDiaryBookRoomContainer = connect(mapStateToNightlyDiaryBookRoomContainerProps)(NightlyDiaryBookRoomComponent);