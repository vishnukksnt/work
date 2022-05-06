sntRover.controller('rvMaximumOccupancyDialogController', ['$scope', '$rootScope', '$filter', 'ngDialog', function($scope, $rootScope, $filter, ngDialog) {
	BaseCtrl.call(this, $scope);


	$scope.closeDialog = function() {
		ngDialog.close();
	};

	$scope.dimissLoaderAndDialog = function() {
			$scope.$emit('hideLoader');
			$scope.closeDialog();
		};

	$scope.proceed = function() {
			$scope.closeDialog();
			$scope.occupancyDialogSuccess();
	};

	$scope.validate = function() {

	};

}]);