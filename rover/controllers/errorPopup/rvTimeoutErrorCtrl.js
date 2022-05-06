sntRover.controller('RVTimeoutErrorCtrl', ['$scope', '$rootScope', 'ngDialog', '$window',  function($scope, $rootScope, ngDialog, $window) {

    $scope.closeThisDialog = function() {
        ngDialog.close();
    };

    $scope.onClickSupportLink = function () {
        if (sntapp.cordovaLoaded) {
            ngDialog.open({
                template: '/assets/partials/popups/freshdesk.html',
                className: '',
                controller: '',
                scope: $scope
            });
        } else {
            $window.open('https://stayntouch.freshdesk.com/support/home', '_blank');
        }
    };


}]);
