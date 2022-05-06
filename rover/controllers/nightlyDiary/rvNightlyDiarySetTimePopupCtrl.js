'use strict';

sntRover.controller('rvNightlyDiarySetTimePopupCtrl', ['$scope', 'ngDialog', 'rvUtilSrv', function ($scope, ngDialog, rvUtilSrv) {

    // Initialization of data set based on scenarios.
    var init = function init() {
        $scope.setTimePopupData.selectedArrivalTime = $scope.setTimePopupData.data.min_arrival_time;
        $scope.setTimePopupData.selectedDepartureTime = $scope.setTimePopupData.data.max_departure_time;
        $scope.setTimePopupData.arrivalTimeList = rvUtilSrv.generateTimeDuration($scope.setTimePopupData.data.min_arrival_time, null);
        $scope.setTimePopupData.departureTimeList = rvUtilSrv.generateTimeDuration(null, $scope.setTimePopupData.data.max_departure_time);
    };

    // Handle save and continue button click actions.
    $scope.saveAndContinueClicked = function () {
        var popupData = $scope.setTimePopupData,
            timeObj = {};

        timeObj = {
            arrival_time: popupData.selectedArrivalTime,
            departure_time: popupData.selectedDepartureTime
        };

        $scope.$emit('SET_TIME_AND_SAVE', timeObj);
    };

    // Close popup
    $scope.closeSetTimePopup = function () {
        ngDialog.close();
    };

    init();
}]);