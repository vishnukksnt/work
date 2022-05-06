angular.module('sntRover').controller('RvAllowanceNotConsumeOnStayDates', ['$scope', '$state', 'ngDialog', 'RVContactInfoSrv', '$rootScope', function ($scope, $state, ngDialog, RVContactInfoSrv, $rootScope) {

    $scope.proceedWithSameRate = function () {
        $scope.closeDialog();
    };

    $scope.proceedWithChangeRate = function () {
        $scope.closeDialog();
        $rootScope.$emit('changeRoomAndRates');
    };

    // Close the dialog
    $scope.closeDialog = function () {
        ngDialog.close();
    };
}]);