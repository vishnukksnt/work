'use strict';

angular.module('sntRover').controller('RVBusinessOnBooksController', ['$scope', 'RVReportMsgsConst', '$timeout',
// eslint-disable-next-line max-params
function ($scope, reportMsgs, $timeout) {

    BaseCtrl.call(this, $scope);

    var LEFT_PANE_SCROLL = 'left-pane-scroll',
        RIGHT_PANE_SCROLL = 'right-pane-scroll',
        DELAY_1000 = 1000;

    // Set scrollers for left and right pane
    var setScroller = function setScroller() {
        $scope.setScroller(LEFT_PANE_SCROLL, {
            'preventDefault': false,
            'probeType': 3
        });

        $scope.setScroller(RIGHT_PANE_SCROLL, {
            'preventDefault': false,
            'probeType': 3,
            'scrollX': true
        });
    };

    // Set up scroll listeners for left and right pane
    var setupScrollListner = function setupScrollListner() {
        $scope.myScroll[LEFT_PANE_SCROLL].on('scroll', function () {
            $scope.myScroll[RIGHT_PANE_SCROLL].scrollTo(0, this.y);
        });

        $scope.myScroll[RIGHT_PANE_SCROLL].on('scroll', function () {
            $scope.myScroll[LEFT_PANE_SCROLL].scrollTo(0, this.y);
        });
    };

    // Check whether scroll is ready
    var isScrollReady = function isScrollReady() {
        if ($scope.myScroll.hasOwnProperty(LEFT_PANE_SCROLL) && $scope.myScroll.hasOwnProperty(RIGHT_PANE_SCROLL)) {
            setupScrollListner();
        } else {
            $timeout(isScrollReady, DELAY_1000);
        }
    };

    // Refresh scrollers for the left and right pane
    var refreshScrollers = function refreshScrollers() {
        if ($scope.myScroll.hasOwnProperty(LEFT_PANE_SCROLL)) {
            $scope.refreshScroller(LEFT_PANE_SCROLL);
        }

        if ($scope.myScroll.hasOwnProperty(RIGHT_PANE_SCROLL)) {
            $scope.refreshScroller(RIGHT_PANE_SCROLL);
        }
    };

    // Format data as required by the template to date array and RHS data array
    var processData = function processData() {
        $scope.dates = [];
        $scope.roomDetails = [];
        var results = $scope.results;

        _.each(results, function (result) {
            $scope.dates.push(result.date);
            $scope.roomDetails.push(result);
        });
        $timeout(function () {
            refreshScrollers();
            $scope.$emit('hideLoader');
        }, DELAY_1000);
    };

    // Initialize the controller and set up the listeners
    var init = function init() {
        setScroller();
        isScrollReady();
        processData();

        var reportSubmited = $scope.$on(reportMsgs['REPORT_SUBMITED'], processData);
        var reportPrinting = $scope.$on(reportMsgs['REPORT_PRINTING'], processData);
        var reportUpdated = $scope.$on(reportMsgs['REPORT_UPDATED'], processData);
        var reportPageChanged = $scope.$on(reportMsgs['REPORT_PAGE_CHANGED'], processData);

        $scope.$on('$destroy', reportSubmited);
        $scope.$on('$destroy', reportUpdated);
        $scope.$on('$destroy', reportPrinting);
        $scope.$on('$destroy', reportPageChanged);
    };

    init();
}]);