'use strict';

angular.module('sntRover').controller('RVTravelAgentsCommissionReportCtrl', ['$scope', 'RVReportParserFac', '$timeout', 'RVReportMsgsConst', 'RVreportsSubSrv', function ($scope, reportParser, $timeout, reportMsgs, RVreportsSubSrv) {

    var SCROLL_NAME = 'report-details-scroll';

    var refreshScroll = function refreshScroll() {
        $timeout(function () {
            $scope.refreshScroller(SCROLL_NAME);
            $scope.myScroll[SCROLL_NAME].scrollTo(0, 0, 100);
        }, 1000);
    };
    // Param added - only to refresh these TA agent's reservation
    // While click on the pagination
    var selectedTAAgentId;
    var successFetch = function successFetch(response) {
        $scope.results = _.each($scope.results, function (travelAgents) {
            $scope.$emit('hideLoader');
            if (travelAgents.travel_agent_id === selectedTAAgentId) {
                travelAgents.reservation_details = response;
            }
            return travelAgents;
        });

        refreshScroll();
    };

    // Invoke API to fetch reservations of the selected TA
    // Pagination
    $scope.$on("updateReservations", function (e, paramsToApi) {
        selectedTAAgentId = paramsToApi.travel_agent_id;
        $scope.invokeApi(RVreportsSubSrv.getReservationsOfTravelAgents, paramsToApi, successFetch);
    });
    // To fix the issue, view is not getting updated on main pagination
    // After clicks on any inside reservations pagination
    $scope.$on("UPDATE_RESULTS", function (e, results) {
        $scope.results = results;
        refreshScroll();
    });
    refreshScroll();
}]);