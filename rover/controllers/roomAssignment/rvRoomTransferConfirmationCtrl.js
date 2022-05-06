sntRover.controller('rvRoomTransferConfirmationCtrl', ['$scope', '$rootScope', '$filter', 'ngDialog', '$timeout',
	function($scope, $rootScope, $filter, ngDialog, $timeout) {

	BaseCtrl.call(this, $scope);

	var newRate = parseInt($scope.roomTransfer.newRoomRate);
	var oldRate = parseInt($scope.roomTransfer.oldRoomRate);

	$scope.isSmallerRate = function() {
		if (newRate < oldRate) {
			return true;
		}
		else {
			return false;
		}
	};

	$scope.isLargerRate = function() {
		if (newRate > oldRate) {
			return true;
		}
		else {
			return false;
		}
	};

	$scope.moveWithoutRateChange = function() {
		$scope.roomTransfer.withoutRateChange = true;
		$scope.assignRoom();
		$scope.closeDialog();
	};

	$scope.applyRateChange = function() {
    	$scope.roomTransfer.withoutRateChange = false;
		$scope.roomTransfer.newRoomRateChange = $scope.roomTransfer.newRoomRate;
		$scope.assignRoom();
		$scope.closeDialog();
	};

	$scope.confirm = function() {
		$scope.roomTransfer.withoutRateChange = true;
		$scope.assignRoom();
		$scope.closeDialog();
	};

}]);