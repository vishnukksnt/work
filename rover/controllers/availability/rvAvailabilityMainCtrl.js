angular.module('sntRover').controller('rvAvailabilityMainController', [
	'$scope', 'rvAvailabilitySrv', '$rootScope',
	function($scope, rvAvailabilitySrv, $rootScope) {

		// variable to get/set value availabilty or house
		$scope.availabilityToShow = 'room';
		$scope.page = {};
		$scope.page.title = "Availability";


		/**
		* function to execute when switching between availability and house keeping
		*/
		$scope.setAvailability = function() {
			$scope.$emit("showLoader");
		};

		/**
		* function to load different template based the availability chosen
		*/
		$scope.getTemplateUrl = function()	{
			if ($scope.availabilityToShow === 'room') {
				return '/assets/partials/availability/roomAvailabilityMain.html';
			}
			else if ($scope.availabilityToShow === 'house') {
				return '/assets/partials/availability/houseAvailabilityStatus.html';
			}
			else if ($scope.availabilityToShow === 'item-inventory') {
				return '/assets/partials/availability/itemInventoryMain.html';
			}
			else if ($scope.availabilityToShow === 'groups') {
				return '/assets/partials/availability/groupAvailabilityMain.html';
			}
			else if ($scope.availabilityToShow === 'allotments') {
				return '/assets/partials/availability/allotmentAvailabilityMain.html';
			}
		};

		/**
		 * we will not show group in soome hotels
		 * @return {Boolean} [description]
		 */
		$scope.shouldShowGroupInSelectBox = function() {
			return (!$rootScope.isHourlyRateOn);
		};

		$scope.shouldShowAllotmentInSelectBox = function() {
			return (!$rootScope.isHourlyRateOn);
		};

}]);