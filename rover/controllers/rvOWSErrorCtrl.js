angular.module('sntRover').controller('RVOWSErrorCtrl', ['$scope', 'RVOWSTestSrv', '$rootScope', 'ngDialog',
    function($scope, RVOWSTestSrv, $rootScope, ngDialog) {

        /**
         * Call API to test the OWS connection
         * @returns {undefined}
         */
        $scope.tryAgainButtonClicked = function() {
            $scope.$parent.$emit('showLoader');

            RVOWSTestSrv.checkOWSConnection().then(function() {
                $scope.$parent.$emit('hideLoader');
                $scope.closeThisDialog();
                $rootScope.$broadcast('OWSConnectionRetrySuccesss');
            }, function() {
                $scope.$parent.$emit('hideLoader');
            });
        };

        $scope.closeThisDialog = function() {
            $rootScope.isOWSErrorShowing = false;
            ngDialog.close();
        };

    }
]);