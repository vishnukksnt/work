angular.module('sntRover').controller('RVHkAppCtrl', [
	'$rootScope',
	'$scope',
	'$state',
	'ngDialog',
	function($rootScope, $scope, $state, ngDialog) {

		BaseCtrl.call(this, $scope);
		$scope.setTitle('Housekeeping');

		// default no top filters
		// Moved this from the inner controller (RVHkRoomStatusCtrl) to persist user selection between states
		// Requirement :  CICO-8620 QA Comments
		// When switching from Employee view to All,
		// updating a room status and going back to the rooms list, the rooms list has gone back to Employee view.
		// It should stay in ALL view unless the user navigates to a different menu item or manually changes the selection criteria.
		$scope.topFilter = {
			byEmployee: -1
		};

		// when state change start happens, we need to show the activity activator to prevent further clicking
		// this will happen when prefetch the data
		$rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
			// Show a loading message until promises are not resolved
			$scope.$emit('showLoader');
		});

		$rootScope.$on('$stateChangeSuccess', function(e, curr, prev) {
			// Hide loading message
			$scope.$emit('hideLoader');
		});

		$rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
			// Hide loading message
			// TODO: Log the error in proper way
			$scope.$emit('hideLoader');
		});

		$scope.$on("filterRoomsClicked", function() {
			$scope.filterOpen = !$scope.filterOpen;
		});

		$scope.$on('showLoader', function() {
			$scope.hasLoader = true;
		});

		$scope.$on('hideLoader', function() {
			$scope.hasLoader = false;
		});


		$scope.isRoomFilterOpen = function() {
			return $scope.filterOpen;
		};

		$scope.$on("dismissFilterScreen", function() {
			$scope.filterOpen = false;
		});

		$scope.$on("showFilterScreen", function() {
			$scope.filterOpen = true;
		});
	}
]);