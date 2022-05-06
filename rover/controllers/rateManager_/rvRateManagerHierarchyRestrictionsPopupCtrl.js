'use strict';

angular.module('sntRover').controller('rvRateManagerHierarchyRestrictionsPopupCtrl', ['$scope', '$rootScope', '$window', 'rvRateManagerEventConstants', 'ngDialog', 'rvRateManagerUtilitySrv', 'rvRateManagerHierarchyRestrictionsSrv', '$timeout', function ($scope, $rootScope, window, rvRateManagerEventConstants, ngDialog, hierarchyUtils, hierarchySrv, $timeout) {
    BaseCtrl.call(this, $scope);

    $scope.isMobileView = window.innerWidth < 1024;
    $scope.mobileScrollLabel = $scope.isMobileView ? "repeatOnDatesScroller" : "";
    $scope.nonMobileScrollLabel = !$scope.isMobileView ? "repeatOnDatesScroller" : "";
    $scope.nonMobileHierarchyScrollLabel = !$scope.isMobileView ? "hierarchyPopupFormScroll" : "";

    var setscroller = function setscroller() {
        $scope.setScroller('hierarchyPopupFormScroll');
        $scope.setScroller('repeatOnDatesScroller');
    };

    var refreshScroller = function refreshScroller() {
        $timeout(function () {
            $scope.refreshScroller('hierarchyPopupFormScroll');
            $scope.setScroller('repeatOnDatesScroller');
        }, 500);
    };

    var checkEmptyOrListView = function checkEmptyOrListView(listData) {
        var isEmptyList = _.isEmpty(listData);
        var view = isEmptyList ? 'EMPTY' : 'LIST';

        return view;
    };

    /**
     * Function for initializing of dialogue variables
     */
    var initializeScopeVariables = function initializeScopeVariables() {
        $scope.header = {
            date: '',
            hierarchyType: '',
            disableNewRestriction: false
        };

        $scope.popUpView = 'LIST';
        $scope.selectedRestriction = {};
        $scope.restrictionStylePack = [];
        $scope.restrictionObj = {
            isRepeatOnDates: false,
            daysList: hierarchyUtils.repeatOnDatesList,
            cellDate: $scope.ngDialogData.date,
            untilDate: '',
            listData: $scope.ngDialogData.listData,
            selectedSetOnIds: [],
            isSetOnAllActive: false
        };
    },
        initialiseFirstScreen = function initialiseFirstScreen() {
        // as part of CICO-75894 we are always showing the first screen as empty.
        // the below code must be changed when the story to view restrictions is taken up.
        // There may be code, but for now, the following one line will do
        $scope.popUpView = checkEmptyOrListView($scope.restrictionObj.listData);
    };

    $scope.initiateNewRestrictionForm = function (restrictionKey) {
        if (restrictionKey) {
            // Add New action from '+' icon from sub list.
            $scope.selectedRestriction = _.find(hierarchyUtils.restrictionColorAndIconMapping, function (item) {
                return item.key === restrictionKey;
            });
            $scope.selectedRestriction.value = null;
            $scope.selectedRestriction.id = hierarchyUtils.restrictionKeyToCodeMapping[$scope.selectedRestriction.key][0];
            $scope.restrictionStylePack = angular.copy(hierarchyUtils.restrictionColorAndIconMapping);
        } else {
            $scope.selectedRestriction = {};
            $scope.selectedRestriction.activeGroupList = [];
            $scope.restrictionStylePack = hierarchyUtils.getActiveRestrictionColorAndIconMapping($scope.activeRestrictionsList);
        }
        $scope.popUpView = 'NEW';
        $scope.showRestrictionSelection = false;
        $scope.$broadcast('INIT_SET_ON_SEARCH');
        $scope.restrictionObj.isRepeatOnDates = false;
        $scope.restrictionObj.isSetOnAllActive = false;
    };

    var setRestrictionDataForPopup = function setRestrictionDataForPopup() {
        $scope.header.hierarchyType = $scope.ngDialogData.hierarchyLevel;
        $scope.header.date = moment($scope.ngDialogData.date).format('dddd, MMMM DD');
        $scope.header.disableNewRestriction = $rootScope.businessDate > $scope.ngDialogData.date;
    };

    $scope.showPlaceholder = function () {
        return !$scope.selectedRestriction.type;
    };

    $scope.disableSelectBox = function () {
        return $scope.popUpView === 'EDIT' || $scope.popUpView === 'NEW' && $scope.selectedRestriction.activeGroupList && $scope.selectedRestriction.activeGroupList.length > 0;
    };

    $scope.showNights = function () {
        return !$scope.showPlaceholder() && $scope.selectedRestriction.type === 'number';
    };

    $scope.toggleRestrictionSelection = function () {
        $scope.showRestrictionSelection = !$scope.showRestrictionSelection;
        refreshScroller();
    };

    $scope.restrictionSelected = function (restriction) {
        if (!_.isEmpty($scope.selectedRestriction)) {
            $scope.selectedRestriction.value = null;
        }
        $scope.selectedRestriction = restriction;
        $scope.selectedRestriction.id = hierarchyUtils.restrictionKeyToCodeMapping[$scope.selectedRestriction.key][0];
        $scope.toggleRestrictionSelection();
        $scope.$broadcast('SCROLL_REFRESH_REPEAT_ON_DATES');
        // To fix issues from normal ADD and the new add from sub list.
        if ($scope.selectedRestriction.activeGroupList) {
            $scope.selectedRestriction.activeGroupList = [];
            $scope.selectedRestriction.value = null;
        }
        if ($scope.ngDialogData.hierarchyLevel === 'Rate') {
            $scope.$broadcast('INIT_SET_ON_SEARCH');
        }
    };

    // Check repeat on dates fields are not valid.
    var isRepeatOnDatesNotValid = function isRepeatOnDatesNotValid() {
        return $scope.restrictionObj && $scope.restrictionObj.isRepeatOnDates && $scope.restrictionObj.untilDate === '';
    };

    // Check set on search field is not valid.
    var isSetOnSelectFormNotValid = function isSetOnSelectFormNotValid() {
        return $scope.ngDialogData.hierarchyLevel !== 'House' && !$scope.restrictionObj.isSetOnAllActive && $scope.restrictionObj.selectedSetOnIds && $scope.restrictionObj.selectedSetOnIds.length === 0;
    };

    $scope.validateForm = function () {
        var formValid;

        if ($scope.showPlaceholder() || isRepeatOnDatesNotValid() || isSetOnSelectFormNotValid()) {
            formValid = false;
        } else {
            // CICO-75894
            if ($scope.selectedRestriction.type === "boolean") {
                formValid = true;
            } else if ($scope.selectedRestriction.type === 'number') {
                // Allow zero and positive values
                formValid = /^[1-9]\d*$/.test($scope.selectedRestriction.value);
            } else {
                formValid = false;
            }
        }
        return formValid;
    };

    $scope.saveHierarchyRestriction = function () {
        var restrictions = {};
        var apiMethod = '';

        restrictions[$scope.selectedRestriction.key] = $scope.selectedRestriction.type === 'number' ? Math.round($scope.selectedRestriction.value) : true;
        var params = {
            from_date: $scope.ngDialogData.date,
            to_date: $scope.ngDialogData.date,
            associate_multiple: $scope.ngDialogData.hierarchyLevel !== 'House',
            restrictions: restrictions
        };

        switch ($scope.ngDialogData.hierarchyLevel) {
            case 'House':
                apiMethod = hierarchySrv.saveHouseRestrictions;
                break;
            case 'RoomType':
                params.room_type_ids = !$scope.restrictionObj.isSetOnAllActive ? $scope.restrictionObj.selectedSetOnIds : [];
                apiMethod = hierarchySrv.saveRoomTypeRestrictions;
                break;
            case 'RateType':
                params.rate_type_ids = !$scope.restrictionObj.isSetOnAllActive ? $scope.restrictionObj.selectedSetOnIds : [];
                apiMethod = hierarchySrv.saveRateTypeRestrictions;
                break;
            case 'Rate':
                params.rate_ids = !$scope.restrictionObj.isSetOnAllActive ? $scope.restrictionObj.selectedSetOnIds : [];
                apiMethod = hierarchySrv.saveRateRestrictions;
                break;
            default:
                break;
        }

        if ($scope.restrictionObj.isRepeatOnDates) {
            var selectedWeekDays = hierarchyUtils.getSelectedWeekDays($scope.restrictionObj.daysList);

            if (selectedWeekDays.length > 0) {
                params.weekdays = selectedWeekDays;
            }
            params.to_date = $scope.restrictionObj.untilDate;
        }

        var houseRestrictionSuccessCallback = function houseRestrictionSuccessCallback() {
            $scope.$emit(rvRateManagerEventConstants.RELOAD_RESULTS);
            $scope.$broadcast('RELOAD_RESTRICTIONS_LIST');
        };

        var options = {
            params: params,
            onSuccess: houseRestrictionSuccessCallback
        };

        $scope.callAPI(apiMethod, options);
    };

    $scope.backToInitialScreen = function () {
        $scope.selectedRestriction = {};
        initialiseFirstScreen();
    };
    /*
    * To close dialog box
    */
    $scope.closeDialog = function () {
        $rootScope.modalClosing = true;
        $timeout(function () {
            ngDialog.close();
            $rootScope.modalClosing = false;
            window.scrollTo(0, 0);
            document.getElementById("rate-manager").scrollTop = 0;
            document.getElementsByClassName("pinnedLeft-list")[0].scrollTop = 0;
        }, 700);
    };

    // Handle click on Repeat on dates checkbox.
    $scope.clickedOnRepeatOnDates = function () {
        $scope.restrictionObj.isRepeatOnDates = !$scope.restrictionObj.isRepeatOnDates;
        $scope.$broadcast('CLICKED_REPEAT_ON_DATES');
    };

    // Set the label name for SET or SET Dates button.
    $scope.getSetButtonLabel = function () {
        var label = 'Set';

        if ($scope.popUpView === 'EDIT') {
            label = 'Update';
        }
        if ($scope.restrictionObj.isRepeatOnDates) {
            label = 'Set on date(s)';
        }
        return label;
    };

    // Set the label name for Remove or Remove Dates button.
    $scope.getRemoveButtonLabel = function () {
        var label = 'Remove';

        if ($scope.restrictionObj.isRepeatOnDates) {
            label = 'Remove on date(s)';
        }
        return label;
    };
    // Check whether Remove button needed to disable.
    $scope.disableRemoveButton = function () {
        return isRepeatOnDatesNotValid();
    };
    // Handle REMOVE button click
    $scope.clickedOnRemoveButton = function () {
        $scope.$broadcast('CLICKED_REMOVE_ON_DATES');
    };
    // Handle click on '+' button in left sub list.
    $scope.clickedOnAddNew = function () {
        $scope.initiateNewRestrictionForm($scope.selectedRestriction.key);
        $scope.selectedRestriction.activeGroupIndex = null;
    };

    /*
     *  Handle click on left bar sub list items.
     *  @params {Number | null} [index value of the clicked item]
     */
    $scope.clickedOnLeftRestrictionList = function (index) {
        var clickedItem = '';

        $scope.popUpView = 'EDIT';
        if ($scope.selectedRestriction.type === 'number') {
            // min_length_of_stay, min_stay_through etc.
            clickedItem = $scope.restrictionObj.listData[$scope.selectedRestriction.activeGroupKey][index];
            $scope.selectedRestriction.value = clickedItem.value;
            $scope.selectedRestriction.setOnValuesList = clickedItem.set_on_values;
            $scope.selectedRestriction.activeGroupIndex = index;
        } else {
            // closed, closed_arrival and closed_departure.
            clickedItem = $scope.restrictionObj.listData[$scope.selectedRestriction.activeGroupKey];
            $scope.selectedRestriction.value = null;
            $scope.selectedRestriction.setOnValuesList = clickedItem.set_on_values || [];
            $scope.selectedRestriction.activeGroupIndex = 0;
        }
        $scope.restrictionObj.isRepeatOnDates = false;
        $scope.$broadcast('INIT_SET_ON_SEARCH');
        refreshScroller();
        // Handle ON ALL checkbox selection.
        if (clickedItem.set_on_values.length === $scope.restrictionObj.setOnCount) {
            $scope.restrictionObj.isSetOnAllActive = true;
        } else {
            $scope.restrictionObj.isSetOnAllActive = false;
        }
    };

    var initController = function initController() {
        initializeScopeVariables();
        setscroller();
        refreshScroller();
        setRestrictionDataForPopup();
    };

    $scope.addListener('REFRESH_FORM_SCROLL', refreshScroller);

    initController();
}]);