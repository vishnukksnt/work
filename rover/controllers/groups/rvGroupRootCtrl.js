angular.module('sntRover').controller('rvGroupRootCtrl',	[
	'$scope',
	'$rootScope',
	'$filter',
    '$timeout',
	'$interval',
	'$log',
	function($scope, $rootScope, $filter, $timeout, $interval, $log) {

		BaseCtrl.call(this, $scope);
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
		
		$scope.addListener('UPDATE_HEADING', function (event, heading) {
			$scope.heading = heading;
		});
	}]);
