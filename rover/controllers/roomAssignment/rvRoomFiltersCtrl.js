
sntRover.controller('RVRoomFiltersController', ['$scope', '$state', '$stateParams', 'RVRoomAssignmentSrv', function($scope, $state, $stateParams, RVRoomAssignmentSrv) {

	BaseCtrl.call(this, $scope);

	$scope.roomFeatures = $scope.$parent.roomFeatures;
	$scope.floor_details = $scope.$parent.floors;
	$scope.data = {};
	$scope.data.isNoFloorSelected = true;
	/**
	* Listener to set the room filters when loaded
	*/
	$scope.$on('roomFeaturesLoaded', function(event, data) {
			$scope.roomFeatures = data;
	});
	/**
	* function to handle the floor filter selection Explictily.
	*/
	$scope.selectedFloorChanged = function() {
		// resetting selected floor while selecting Show all check box
		if ($scope.data.isNoFloorSelected) {
			$scope.data.selectedFloor = '';
		}

		var floorFilterdata = {
				"isNoFloorSelected": $scope.data.isNoFloorSelected,
				"selectedFloorId": $scope.data.selectedFloor
			};

		$scope.$parent.applyFloorFilter(floorFilterdata);
		$scope.$emit('roomFeaturesUpdated', $scope.roomFeatures);
		
	};
	/**
	* function to handle the filter selection
	*/
	$scope.setSelectionForFeature = function(group, feature) {
			if (!$scope.roomFeatures[group].multiple_allowed) {
				for (var i = 0; i < $scope.roomFeatures[group].items.length; i++) {
					if (feature !== i) {
						$scope.roomFeatures[group].items[i].selected = false;
					}
				}
			}
			$scope.roomFeatures[group].items[feature].selected = !$scope.roomFeatures[group].items[feature].selected;
			$scope.$emit('roomFeaturesUpdated', $scope.roomFeatures);
	};
	/**
	* function to handle the filter clearing
	*/
	$scope.clearAllFilters = function() {
				for (var i = 0; i < $scope.roomFeatures.length; i++) {
					for (var j = 0; j < $scope.roomFeatures[i].items.length; j++) {
						$scope.roomFeatures[i].items[j].selected = false;
					}
				}
				$scope.$emit('roomFeaturesUpdated', $scope.roomFeatures);
	};

}]);