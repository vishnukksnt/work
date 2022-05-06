'use strict';

angular.module('sntRover').controller('rvRateManagerHierarchyRestrictionsListCtrl', ['$scope', '$rootScope', 'rvRateManagerHierarchyRestrictionsSrv', 'rvRateManagerUtilitySrv', '$timeout', 'rvRateManagerEventConstants', function ($scope, $rootScope, hierarchySrv, hierarchyUtils, $timeout, rvRateManagerEventConstants) {
    BaseCtrl.call(this, $scope);

    var setscroller = function setscroller() {
        $scope.setScroller('hierarchyPopupListScroll');
    };

    var refreshScroller = function refreshScroller() {
        $timeout(function () {
            $scope.refreshScroller('hierarchyPopupListScroll');
        }, 500);
    };

    var checkEmptyOrListView = function checkEmptyOrListView(listData) {
        var isEmptyList = _.isEmpty(listData);
        var view = isEmptyList ? 'EMPTY' : 'LIST';

        return view;
    };

    var fetchRestrictionList = function fetchRestrictionList() {
        var fetchRestrictionsListSuccessCallback = function fetchRestrictionsListSuccessCallback(response) {
            $scope.errorMessage = '';
            switch ($scope.ngDialogData.hierarchyLevel) {
                case 'House':
                    $scope.restrictionObj.listData = response.house[0].restrictions;
                    $scope.restrictionObj.noticeLabel = '';
                    $scope.restrictionObj.setOnCount = 0;
                    break;
                case 'RoomType':
                    $scope.restrictionObj.listData = response.room_type[0].restrictions;
                    $scope.restrictionObj.noticeLabel = 'ALL ROOM TYPES';
                    $scope.restrictionObj.setOnCount = response.room_types_count;
                    break;
                case 'RateType':
                    $scope.restrictionObj.listData = response.rate_type[0].restrictions;
                    $scope.restrictionObj.noticeLabel = 'ALL RATE TYPES';
                    $scope.restrictionObj.setOnCount = response.rate_types_count;
                    break;
                case 'Rate':
                    $scope.restrictionObj.listData = response.rate[0].restrictions;
                    $scope.restrictionObj.noticeLabel = 'ALL RATES';
                    $scope.restrictionObj.setOnCount = response.rates_count;
                    break;
                default:
                    break;
            }
            $scope.popUpView = checkEmptyOrListView($scope.restrictionObj.listData);
            refreshScroller();
        };
        var fetchRestrictionsFailureCallback = function fetchRestrictionsFailureCallback(errorMessage) {
            $scope.errorMessage = errorMessage;
        };

        var params = {
            'from_date': $scope.ngDialogData.date,
            'to_date': $scope.ngDialogData.date,
            'levels[]': $scope.ngDialogData.hierarchyLevel
        };
        var options = {
            params: params,
            onSuccess: fetchRestrictionsListSuccessCallback,
            failureCallBack: fetchRestrictionsFailureCallback
        };

        $scope.callAPI(hierarchySrv.fetchHierarchyRestrictions, options);
    };

    /*
     *  Handle list item click
     *  @param {String} ['closed', 'close_arrival' etc.]
     *  @param {Number | null} [ index of clicked item in 'min_length_of_stay', 'max_length_of_stay' etc.]
     */
    $scope.clickedOnListItem = function (key, index) {
        if (!$scope.isPastDate()) {
            var clickedItem = {};

            $scope.popUpView = 'EDIT';
            $scope.selectedRestriction = _.find(hierarchyUtils.restrictionColorAndIconMapping, function (item) {
                return item.key === key;
            });
            $scope.selectedRestriction.activeGroupList = [];
            $scope.selectedRestriction.id = hierarchyUtils.restrictionKeyToCodeMapping[$scope.selectedRestriction.key][0];
            if ($scope.selectedRestriction.type === 'number') {
                // min_length_of_stay, min_stay_through etc.
                clickedItem = $scope.restrictionObj.listData[key][index];
                $scope.selectedRestriction.value = clickedItem.value;
                $scope.selectedRestriction.setOnValuesList = clickedItem.set_on_values;
                $scope.selectedRestriction.activeGroupList = $scope.restrictionObj.listData[key];
                $scope.selectedRestriction.activeGroupIndex = index;
            } else {
                // closed, closed_arrival and closed_departure.
                clickedItem = $scope.restrictionObj.listData[key];
                $scope.selectedRestriction.value = null;
                $scope.selectedRestriction.setOnValuesList = clickedItem.set_on_values || [];
                $scope.selectedRestriction.activeGroupList.push(clickedItem);
                $scope.selectedRestriction.activeGroupIndex = 0;
            }
            $scope.restrictionObj.isRepeatOnDates = false;
            $scope.selectedRestriction.activeGroupKey = key;
            $scope.$broadcast('INIT_SET_ON_SEARCH');
            // Handle ON ALL checkbox selection.
            if (clickedItem.set_on_values.length === $scope.restrictionObj.setOnCount) {
                $scope.restrictionObj.isSetOnAllActive = true;
            } else {
                $scope.restrictionObj.isSetOnAllActive = false;
            }
        }
    };

    /*  
     *  @param {Object} [restriction object needed to be deleted]
     *  @param {Array} [Ids of set on values to be deleted]
     */
    var callRemoveAPI = function callRemoveAPI(restrictions, setOnIdList) {
        var params = {
            from_date: $scope.ngDialogData.date,
            to_date: $scope.ngDialogData.date,
            restrictions: restrictions
        };
        var apiMethod = hierarchySrv.saveHouseRestrictions;

        if (setOnIdList.length > 0) {
            switch ($scope.ngDialogData.hierarchyLevel) {
                case 'RoomType':
                    params.room_type_ids = setOnIdList;
                    apiMethod = hierarchySrv.saveRoomTypeRestrictions;
                    break;
                case 'RateType':
                    params.rate_type_ids = setOnIdList;
                    apiMethod = hierarchySrv.saveRateTypeRestrictions;
                    break;
                case 'Rate':
                    params.rate_ids = setOnIdList;
                    apiMethod = hierarchySrv.saveRateRestrictions;
                    break;
                default:
                    break;
            }
        }

        if ($scope.restrictionObj.isRepeatOnDates) {
            var selectedWeekDays = hierarchyUtils.getSelectedWeekDays($scope.restrictionObj.daysList);

            if (selectedWeekDays.length > 0) {
                params.weekdays = selectedWeekDays;
            }
            params.to_date = $scope.restrictionObj.untilDate;
        }

        var deleteSuccessCallback = function deleteSuccessCallback() {
            fetchRestrictionList();
            $scope.$emit(rvRateManagerEventConstants.RELOAD_RESULTS);
        };

        var options = {
            params: params,
            successCallBack: deleteSuccessCallback
        };

        $scope.callAPI(apiMethod, options);
    };

    /*
     *  Handle delete button click on each item on LIST screen.
     *  @param {String} ['closed', 'close_arrival' etc.]
     *  @param {Boolean | null} [value will be false or null]
     *  @param {Array | undefined} [set on list values]
     */
    $scope.clickedOnRemove = function (key, value, setOnValuesList) {
        var restrictions = {};
        var setOnIdList = [];

        restrictions[key] = value;
        if (setOnValuesList) {
            setOnIdList = _.pluck(setOnValuesList, 'id');
        }
        callRemoveAPI(restrictions, setOnIdList);
    };
    // Check the popup date is past.
    $scope.isPastDate = function () {
        return $rootScope.businessDate > $scope.ngDialogData.date;
    };

    // Process Remove action on EDIT screen.
    var processRemoveOnDates = function processRemoveOnDates() {
        var key = $scope.selectedRestriction.key;
        var value = $scope.selectedRestriction.type === 'number' ? null : false;
        var restrictions = {};
        var setOnIdList = [];

        if ($scope.selectedRestriction.setOnValuesList) {
            setOnIdList = _.pluck($scope.selectedRestriction.setOnValuesList, 'id');
        }

        restrictions[key] = value;
        callRemoveAPI(restrictions, setOnIdList);
    };

    setscroller();
    fetchRestrictionList();

    $scope.addListener('RELOAD_RESTRICTIONS_LIST', fetchRestrictionList);
    $scope.addListener('CLICKED_REMOVE_ON_DATES', processRemoveOnDates);
}]);