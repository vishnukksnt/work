'use strict';

angular.module('sntRover').controller('rvRateManagerHierarchyRestrictionsRepeatOnDatesCtrl', ['$scope', 'ngDialog', '$timeout', function ($scope, ngDialog, $timeout) {
    BaseCtrl.call(this, $scope);

    $scope.setScroller('repeatOnDatesScroller');
    var refreshScroller = function refreshScroller() {
        $timeout(function () {
            $scope.refreshScroller('repeatOnDatesScroller');
        }, 500);
    };

    $scope.checkedEachDay = function (index) {
        $scope.restrictionObj.daysList[index].isChecked = !$scope.restrictionObj.daysList[index].isChecked;
    };

    var checkAllDaysChecked = function checkAllDaysChecked() {
        var isAllDaysChecked = true;

        _.each($scope.restrictionObj.daysList, function (day) {
            if (!day.isChecked) {
                isAllDaysChecked = false;
                return isAllDaysChecked;
            }
        });

        return isAllDaysChecked;
    };

    var setAllDaysChecked = function setAllDaysChecked() {
        _.each($scope.restrictionObj.daysList, function (day) {
            day.isChecked = true;
        });
    };

    var setAllDaysUnChecked = function setAllDaysUnChecked() {
        _.each($scope.restrictionObj.daysList, function (day) {
            day.isChecked = false;
        });
    };

    $scope.generateButtonText = function () {
        var text = 'Select All';

        if (checkAllDaysChecked()) {
            text = 'Clear All';
        }
        return text;
    };

    $scope.getButtonClass = function () {
        var className = 'brand-text';

        if (checkAllDaysChecked()) {
            className = 'red-text';
        }
        return className;
    };

    $scope.clickedSelectAllOrClearAll = function () {
        if (checkAllDaysChecked()) {
            // Handle Clear All Action..
            setAllDaysUnChecked();
        } else {
            // Handle Select All Action..
            setAllDaysChecked();
        }
    };

    var datePickerDialog = {};

    $scope.addListener('UNTIL_DATE_CHANGED', function () {
        ngDialog.close(datePickerDialog.id);
    });

    $scope.addListener('SCROLL_REFRESH_REPEAT_ON_DATES', function () {
        refreshScroller();
    });

    $scope.addListener('CLICKED_REPEAT_ON_DATES', function () {
        if ($scope.restrictionObj.isRepeatOnDates) {
            refreshScroller();
            setAllDaysUnChecked();
            $scope.restrictionObj.untilDate = '';
        }
    });
    /* 
     *  Show date calendar popup for set Until Date.
     */
    $scope.clickedUntilDate = function () {
        datePickerDialog = ngDialog.open({
            template: '/assets/partials/rateManager_/popup/hierarchyRestriction/rvRateManagerHierarchyRestrictionsDatePicker.html',
            controller: 'rvRMHierarchyRestrictionsDatePickerCtrl',
            className: 'single-date-picker',
            scope: $scope
        });
    };
}]);