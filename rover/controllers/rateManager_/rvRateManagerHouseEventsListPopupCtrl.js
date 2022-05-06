'use strict';

sntRover.controller('rvRateManagerHouseEventsListPopupCtrl', ['$scope', '$rootScope', '$timeout', 'rvRateManagerCoreSrv', 'ngDialog', '$filter', function ($scope, $rootScope, $timeout, rvRateManagerCoreSrv, ngDialog, $filter) {

    BaseCtrl.call(this, $scope);

    var EVENTS_LIST_SCROLLER = 'events-list-scroller';

    var setScroller = function setScroller() {
        var scrollerOptions = {
            tap: true,
            preventDefault: false
        };

        $scope.setScroller(EVENTS_LIST_SCROLLER, scrollerOptions);
    },
        refreshScroller = function refreshScroller() {
        $timeout(function () {
            $scope.refreshScroller(EVENTS_LIST_SCROLLER);
        }, 100);
    },
        fetchHouseEventsList = function fetchHouseEventsList() {
        var onHouseEventsFetchSuccess = function onHouseEventsFetchSuccess(data) {
            $scope.eventsData = data;
            refreshScroller();
        },
            onHouseEventsFetchFailure = function onHouseEventsFetchFailure() {
            $scope.eventsData = [];
        },
            options = {
            onSuccess: onHouseEventsFetchSuccess,
            onFailure: onHouseEventsFetchFailure,
            params: {
                date: $scope.selectedEventDisplayDate
            }
        };

        $scope.callAPI(rvRateManagerCoreSrv.fetchHouseEventsByDate, options);
    };

    // Close the dialog
    $scope.closeDialog = function () {
        document.activeElement.blur();

        $rootScope.modalClosing = true;
        $timeout(function () {
            ngDialog.close();
            $rootScope.modalClosing = false;
            window.scrollTo(0, 0);
            document.getElementById('rate-manager').scrollTop = 0;
            document.getElementsByClassName('pinnedLeft-list')[0].scrollTop = 0;
            $scope.$apply();
        }, 700);
    };

    var init = function init() {
        $scope.displayDate = $filter('date')(new tzIndependentDate($scope.selectedEventDisplayDate), 'EEEE, dd MMMM yyyy');
        setScroller();
        fetchHouseEventsList();
    };

    init();
}]);