'use strict';

angular.module('sntRover').controller('rvDailyProdByDemographics.Controller', ['$scope', 'RVReportParserFac', '$timeout', 'RVReportMsgsConst', '$rootScope', function ($scope, reportParser, $timeout, reportMsgs, $rootScope) {
    var DELAY_50 = 50;
    var DELAY_10 = 10;
    var DELAY_100 = 100;
    var MULTI = 2;

    var startedRendering = function startedRendering() {
        $timeout(function () {
            $scope.$emit('showLoader');
        }, 0);
    };

    var completedRendering = function completedRendering() {
        $timeout(function () {
            $scope.$emit('hideLoader');
        }, 0);
    };

    var completedUpdating = function completedUpdating() {
        $timeout(function () {
            $scope.$emit('hideLoader');
        }, MULTI * $scope.results.dates.length);
    };

    var renderReport = function renderReport() {
        var props = {
            data: $scope.results,
            businessDate: $rootScope.businessDate,
            startedRendering: startedRendering,
            completedRendering: completedRendering,
            completedUpdating: completedUpdating
        };

        startedRendering();
        ReactDOM.render(
        // eslint-disable-next-line no-undef
        React.createElement(DailyProductionByDemographics, props),
        // eslint-disable-next-line angular/document-service
        document.getElementById('daily-prod-demographics'));
    };

    var reRenderReport = function reRenderReport() {
        $timeout(renderReport, DELAY_100);
    };

    var initializeMe = function initializeMe() {
        $timeout(renderReport, DELAY_10);
    };

    var reportSubmited = $scope.$on(reportMsgs['REPORT_SUBMITED'], function () {
        $timeout(renderReport, DELAY_50);
    });
    var reportPrinting = $scope.$on(reportMsgs['REPORT_PRINTING'], renderReport);
    var reportUpdated = $scope.$on(reportMsgs['REPORT_UPDATED'], reRenderReport);
    var reportPageChanged = $scope.$on(reportMsgs['REPORT_PAGE_CHANGED'], reRenderReport);
    var reloadResultsListner = $rootScope.$on('RELOAD_RESULTS', reRenderReport);

    $scope.$on('$destroy', reportSubmited);
    $scope.$on('$destroy', reportUpdated);
    $scope.$on('$destroy', reportPrinting);
    $scope.$on('$destroy', reportPageChanged);
    $scope.$on('$destroy', reloadResultsListner);

    BaseCtrl.call(this, $scope);

    initializeMe();
}]);