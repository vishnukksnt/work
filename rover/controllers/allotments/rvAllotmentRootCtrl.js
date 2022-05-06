angular.module('sntRover').controller('rvAllotmentRootCtrl',	[
	'$scope',
	'$rootScope',
	'$filter',
    '$timeout',
	'$interval',
	'$log',
	function($scope, $rootScope, $filter, $timeout, $interval, $log) {

		/**
		* function to set Headinng
		* @return - {None}
		*/
		$scope.setHeadingTitle = function(heading) {
			$scope.heading = heading;
			$scope.setTitle ($filter('translate')(heading));
		};

		if (!$rootScope.disableObserveForSwipe) {
            CardReaderCtrl.call(this, $scope, $rootScope, $timeout, $interval, $log);
            $scope.observeForSwipe();
        }
	}]);
