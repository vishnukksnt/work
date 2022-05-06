'use strict';

sntRover.controller('RVQuickTextController', ['$scope', '$rootScope', 'quicktextdata', '$sce', function ($scope, $rootScope, quicktextdata, $sce) {
    BaseCtrl.call(this, $scope);
    // -------------------------------------------------------------------------------------------------------------- B. Local Methods
    var init = function init() {
        $scope.iframeEndpoint = $sce.trustAsResourceUrl(quicktextdata.iframe_url);
    };

    // -------------------------------------------------------------------------------------------------------------- B. Scope Variables
    init();
}]);