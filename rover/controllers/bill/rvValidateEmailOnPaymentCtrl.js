sntRover.controller('RVValidateEmailOnPaymentCtrl', ['$scope', '$state', 'ngDialog', 'RVContactInfoSrv',  function( $scope, $state, ngDialog, RVContactInfoSrv) {

	BaseCtrl.call(this, $scope);

	$scope.saveData = {};
	$scope.saveData.email = "";
	// To handle ignore & goto checkout click
	$scope.cancelEmailUpdate = function() {

		ngDialog.close();
	};
	// To handle submit & goto checkout click
	$scope.submitAndTriggerEmail = function() {
		if ($scope.saveData.email === "") {
			return false;
		}

		$scope.$emit("AUTO_TRIGGER_EMAIL_AFTER_PAYMENT", $scope.saveData.email);
	};
}]);