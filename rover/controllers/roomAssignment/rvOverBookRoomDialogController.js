sntRover.controller('RVOverBookRoomDialogController', ['$scope', '$rootScope', 'ngDialog', function($scope, $rootScope, ngDialog) {
	BaseCtrl.call(this, $scope);


	$scope.closeDialog = function() {
		ngDialog.close();
	};

	$scope.clickedYesInOverBook = function() {
		$scope.overbooking.isOpted = true;
		$scope.closeDialog();
		$scope.showMaximumOccupancyDialog($scope.currentRoomObject);
	};


}]);