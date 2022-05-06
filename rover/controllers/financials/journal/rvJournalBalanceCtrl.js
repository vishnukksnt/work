'use strict';

sntRover.controller('RVJournalBalanceController', ['$scope', '$rootScope', 'RVJournalSrv', '$timeout', '$state', function ($scope, $rootScope, RVJournalSrv, $timeout, $state) {
    BaseCtrl.call(this, $scope);

    var initBalanceData = function initBalanceData() {
        var successCallBackFetchBalanceData = function successCallBackFetchBalanceData(data) {
            $scope.balanceData = data;
        };

        var postData = {
            "date": $scope.data.balanceDate
        };

        $scope.invokeApi(RVJournalSrv.fetchBalanceTabDetails, postData, successCallBackFetchBalanceData);
    };

    $scope.clickedNavigationToSearch = function (clickedType) {
        var stateParams = { 'type': clickedType, 'from_page': 'JOURNAL' };

        $state.go('rover.search', stateParams);
    };

    // To handle date updation on summary tab
    $scope.addListener('balanceDateChanged', function () {
        initBalanceData();
    });

    initBalanceData();
}]);