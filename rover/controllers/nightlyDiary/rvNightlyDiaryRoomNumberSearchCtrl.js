'use strict';

angular.module('sntRover').controller('rvNightlyDiaryRoomNumberSearchController', ['$scope', '$filter', '$rootScope', 'RVNightlyDiaryRoomNumberSearchSrv', function ($scope, $filter, $rootScope, RVNightlyDiaryRoomNumberSearchSrv) {

    BaseCtrl.call(this, $scope);

    var init = function init() {
        BaseCtrl.call(this, $scope);
        $scope.diaryData.textInQueryBox = '';
        $scope.diaryData.totalRoomNumberSearchResults = 0;
        $scope.diaryData.showSearchResultsArea = false;
        $scope.diaryData.roomNumberSearchResults = [];
    };
    var searchRoomCall = null;

    // success callback of fetching search results
    var successCallbackFunction = function successCallbackFunction(data) {
        $scope.$emit('hideLoader');
        // $scope.diaryData is defined in (parent controller)rvNightlyDiaryController
        $scope.diaryData.roomNumberSearchResults = data.rooms;
        $scope.diaryData.totalRoomNumberSearchResults = data.total_count;
    };

    // failure callback of fetching search results
    var failureCallbackFunction = function failureCallbackFunction(error) {
        $scope.errorMessage = error;
    };
    // function to perform filtering on search.
    var displayFilteredResults = function displayFilteredResults() {
        var params = {};

        params.query = $scope.diaryData.textInQueryBox.trim();
        $scope.invokeApi(RVNightlyDiaryRoomNumberSearchSrv.fetchRoomSearchResults, params, successCallbackFunction, failureCallbackFunction);
    };

    init();
    // clear query box on clicking close button
    $scope.clearResults = function () {
        $scope.diaryData.textInQueryBox = '';
        $scope.diaryData.showSearchResultsArea = false;
        $scope.diaryData.roomNumberSearchResults = [];
        $scope.diaryData.totalRoomNumberSearchResults = 0;
    };

    // function to perform filtering data, on change-event of query box
    $scope.queryEntered = function () {
        if ($rootScope.isSingleDigitSearch || $scope.diaryData.textInQueryBox.length > 2) {
            $scope.diaryData.showSearchResultsArea = true;
            if (searchRoomCall !== null) {
                clearTimeout(searchRoomCall);
            }
            searchRoomCall = setTimeout(function () {
                if ($scope.diaryData.textInQueryBox.length !== 0) {
                    displayFilteredResults();
                } else {
                    $scope.$apply(function () {
                        $scope.diaryData.showSearchResultsArea = false;
                        $scope.diaryData.roomNumberSearchResults = [];
                        $scope.diaryData.totalRoomNumberSearchResults = 0;
                    });
                }
            }, 800);
        } else {
            $scope.diaryData.showSearchResultsArea = false;
            $scope.diaryData.roomNumberSearchResults = [];
            $scope.diaryData.totalRoomNumberSearchResults = 0;
        }
    };

    $scope.addListener('CLOSE_SEARCH_RESULT', function () {
        $scope.clearResults();
    });
}]);