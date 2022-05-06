'use strict';

angular.module('sntRover').controller('rvRateManagerHierarchyRestrictionSearchSetOnDetailsCtrl', ['$scope', 'rvRateManagerHierarchyRestrictionsSrv', '$timeout', function ($scope, hierarchySrv, $timeout) {
    BaseCtrl.call(this, $scope);
    var apiMethod = '';
    var apiParams = {};
    var initialSetOnListData = [];

    var setscroller = function setscroller() {
        $scope.setScroller('searchSetOnDetailsScroll');
    };

    var refreshScroller = function refreshScroller() {
        $timeout(function () {
            $scope.refreshScroller('searchSetOnDetailsScroll');
        }, 500);
    };

    setscroller();
    refreshScroller();

    var processSearchListData = function processSearchListData(response) {
        var resultArray = response.results || response;

        if ($scope.popUpView === 'EDIT') {
            _.each(resultArray, function (resultArrayItem) {
                _.each($scope.selectedRestriction.setOnValuesList, function (setOnValuesListItem) {
                    if (resultArrayItem.id === setOnValuesListItem.id) {
                        $scope.searchObj.selectedList.push(resultArrayItem);
                        resultArray = resultArray.filter(function (item) {
                            return item.id !== setOnValuesListItem.id;
                        });
                    }
                });
            });
            $scope.restrictionObj.selectedSetOnIds = _.pluck($scope.searchObj.selectedList, 'id');
        }
        $scope.searchObj.results = resultArray;
        initialSetOnListData = angular.copy(resultArray);
    };

    // Fetch comeplete list for set on filter/search.
    var fetchSetOnData = function fetchSetOnData() {
        var fetchSetOnSuccessCallback = function fetchSetOnSuccessCallback(response) {
            processSearchListData(response);
        };
        var fetchSetOnFailureCallback = function fetchSetOnFailureCallback(errorMessage) {
            $scope.errorMessage = errorMessage;
        };

        var options = {
            params: apiParams,
            onSuccess: fetchSetOnSuccessCallback,
            failureCallBack: fetchSetOnFailureCallback
        };

        $scope.callAPI(apiMethod, options);
    };

    var init = function init() {
        $scope.searchObj = {
            query: '',
            results: [],
            selectedList: [],
            headerLabel: '',
            noticeLabel: '',
            placeholder: '',
            isShowResults: false
        };
        $scope.restrictionObj.selectedSetOnIds = [];

        switch ($scope.ngDialogData.hierarchyLevel) {
            case 'RoomType':
                $scope.searchObj.headerLabel = 'Set on Room Type(s)';
                $scope.searchObj.noticeLabel = 'Applies to All Room Types!';
                $scope.searchObj.placeholder = 'Select or Search by Name/Code';
                apiMethod = hierarchySrv.fetchAllRoomTypes;
                // API: /api/room_types.json?exclude_pseudo=true&query=roomtype
                apiParams = {
                    exclude_pseudo: true
                };
                break;
            case 'RateType':
                $scope.searchObj.headerLabel = 'Set on Rate Type(s)';
                $scope.searchObj.noticeLabel = 'Applies to All Rate Types!';
                $scope.searchObj.placeholder = 'Select or Search by Rate Type Name';
                apiMethod = hierarchySrv.fetchAllRateTypes;
                // API: /api/rate_types/active?query=group
                apiParams = {};
                break;
            case 'Rate':
                $scope.searchObj.headerLabel = 'Set on Rate(s)';
                $scope.searchObj.noticeLabel = 'Applies to All Rates!';
                $scope.searchObj.placeholder = 'Search by Rate Name or Code';
                apiMethod = hierarchySrv.fetchAllRates;
                // API: /api/rates?is_fully_configured=true&is_active=true&query=ratename&exclude_locked_restriction_id=5
                apiParams = {
                    is_fully_configured: true,
                    is_active: true,
                    exclude_locked_restriction_id: $scope.selectedRestriction.type === 'number' ? $scope.selectedRestriction.id : ''
                };
                break;
            default:
                break;
        }

        fetchSetOnData();
        refreshScroller();
        $scope.$emit('REFRESH_FORM_SCROLL');
    };

    var updateSetOnIdList = function updateSetOnIdList() {
        $scope.restrictionObj.selectedSetOnIds = _.pluck($scope.searchObj.selectedList, 'id');
    };

    /*
     *  Handle list item click
     *  @param {Object} [clicked item data]
     */
    $scope.clickedOnResult = function (clickedItem) {
        $scope.searchObj.selectedList.push(clickedItem);
        $scope.searchObj.query = '';
        initialSetOnListData = initialSetOnListData.filter(function (item) {
            return item.id !== clickedItem.id;
        });
        $scope.searchObj.results = initialSetOnListData;
        updateSetOnIdList();
        $scope.$emit('REFRESH_FORM_SCROLL');
        $scope.searchObj.isShowResults = false;
    };

    /*
     *  Handle Remove action.
     *  @param {Number} [index value]
     */
    $scope.clickedOnRemoveItem = function (index) {
        initialSetOnListData.push($scope.searchObj.selectedList[index]);
        $scope.searchObj.selectedList.splice(index, 1);
        updateSetOnIdList();
        $scope.$emit('REFRESH_FORM_SCROLL');
    };
    // Handle ON ALL checkbox toggle.
    $scope.clickedOnAllCheckBox = function () {
        $scope.restrictionObj.isSetOnAllActive = !$scope.restrictionObj.isSetOnAllActive;
        $scope.$emit('REFRESH_FORM_SCROLL');
        if ($scope.restrictionObj.isSetOnAllActive) {
            $scope.restrictionObj.selectedSetOnIds = [];
            $scope.searchObj.selectedList = [];
        }
    };
    // Handle query entered on change event.
    $scope.queryEntered = function () {
        $scope.$emit('REFRESH_FORM_SCROLL');
        refreshScroller();
        var displayResults = [];

        if ($scope.searchObj.query && $scope.searchObj.query.length > 0) {
            displayResults = initialSetOnListData.filter(function (item) {
                // check if the querystring is number or string
                var result = isNaN($scope.searchObj.query) && item.name && item.name.toUpperCase().includes($scope.searchObj.query.toUpperCase()) || isNaN($scope.searchObj.query) && item.code && item.code.toUpperCase().includes($scope.searchObj.query.toUpperCase());

                return result;
            });

            $scope.searchObj.results = displayResults;
        } else {
            $scope.searchObj.results = initialSetOnListData;
        }
        $scope.searchObj.isShowResults = true;
    };

    $scope.showResults = function () {
        $scope.searchObj.isShowResults = true;
        refreshScroller();
        $scope.$emit('REFRESH_FORM_SCROLL');
    };

    $scope.hideResults = function () {
        $scope.searchObj.isShowResults = false;
        $scope.$emit('REFRESH_FORM_SCROLL');
    };

    $scope.addListener('INIT_SET_ON_SEARCH', init);
}]);