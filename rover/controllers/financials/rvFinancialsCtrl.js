'use strict';

sntRover.controller('RVFinancialsController', ['$scope', function ($scope) {
	BaseCtrl.call(this, $scope);
	$scope.$on('HeaderChanged', function (event, data) {
		/**
   * CICO-9081
   * $scope.heading = value was creating a heading var in local scope! Hence the title was not being set for the page.
   * Changing code to refer the parent's heading variable to override this behaviour.
   */
		$scope.$parent.heading = data;
	});
}]);