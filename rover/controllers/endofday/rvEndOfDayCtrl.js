sntRover.controller('RVEndOfDayController', ['$scope', 'ngDialog', '$rootScope', '$filter', 'RVEndOfDayModalSrv', '$state', 'rvPermissionSrv', function($scope, ngDialog, $rootScope, $filter, RVEndOfDayModalSrv, $state, rvPermissionSrv) {

    BaseCtrl.call(this, $scope);
    var init = function() {    	
    };

    $scope.hasPermissionToRunEOD = function() {
		return (rvPermissionSrv.getPermissionValue("OVERRIDE_BUSINESS_DATE_CHANGE"));
	};
    $scope.setHeadingTitle = function(heading) {
			$scope.heading = heading;
			$scope.setTitle ($filter('translate')(heading));
	};  

    init();
}]);