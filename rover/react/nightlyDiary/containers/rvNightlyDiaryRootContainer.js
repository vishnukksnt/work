'use strict';

var _ReactRedux = ReactRedux,
    connect = _ReactRedux.connect;
/*
 * utility method to get visibility status of Next Button
* @return {Bool} visibility status of next Button
*/

var getNextPageButtonStatus = function getNextPageButtonStatus(state) {
    var totalCount = state.paginationData.totalCount,
        perPage = state.paginationData.perPage,
        page = state.paginationData.page;

    if (perPage * page < totalCount) {
        return true;
    }
    return false;
};
/*
 * utility method to get visibility status of Prev Button
* @return {Bool} visibility status of Prev Button
*/
var getPrevPageButtonStatus = function getPrevPageButtonStatus(state) {
    if (state.paginationData.page === 1) {
        return false;
    }
    return true;
};
/*
 * utility method to get class for grid content
* @return {String} classnames
*/
var getClassForRootDiv = function getClassForRootDiv(state) {
    if (getNextPageButtonStatus(state) && getPrevPageButtonStatus(state)) {
        return 'grid-content scrollable dual-pagination scroll-vertical';
    } else if (getPrevPageButtonStatus(state)) {
        return 'grid-content scrollable top-pagination scroll-vertical';
    } else if (getNextPageButtonStatus(state)) {
        return 'grid-content scrollable bottom-pagination scroll-vertical';
    }
    return 'grid-content scrollable scroll-vertical';
};
/*
 * utility method to find index of room
* @return {Number} index
*/
var getRoomIndex = function getRoomIndex(selectedRoomId, roomsList) {
    return _.findLastIndex(roomsList, {
        id: selectedRoomId
    });
};
/*
 * utility method to calculate scroll position.
* @return {Number}
*/
var calculateScrollIndex = function calculateScrollIndex(state) {
    var roomindex = getRoomIndex(state.selectedRoomId, state.roomsList);

    // There is no room selected, so move to top
    if (roomindex === -1) {
        return 0;
    }
    if (getPrevPageButtonStatus(state)) {
        return roomindex + 1;
    }
    return roomindex - 10;
};

var mapStateToNightlyDiaryRootContainerProps = function mapStateToNightlyDiaryRootContainerProps(state) {
    return {
        showNextPageButton: getNextPageButtonStatus(state),
        showPrevPageButton: getPrevPageButtonStatus(state),
        ClassForRootDiv: getClassForRootDiv(state),
        index: calculateScrollIndex(state),
        page: state.paginationData.page,
        selectedReservationId: state.selectedReservationId,
        selectedRoom: state.selectedRoom
    };
};

var mapDispatchToNightlyDiaryGoToPreviousPageButtonContainer = function mapDispatchToNightlyDiaryGoToPreviousPageButtonContainer(stateProps) {
    return stateProps;
};

var NightlyDiaryRootContainer = connect(mapStateToNightlyDiaryRootContainerProps, null, mapDispatchToNightlyDiaryGoToPreviousPageButtonContainer)(NightlyDiaryRootComponent);