var BasePaymentCtrl = function($scope) {
	BaseCtrl.call(this, $scope);

	var init = function() {

		$scope.isFromAccounts = true;
		$scope.shouldShowWaiting = false;
		$scope.addmode         = true;
		$scope.savePayment     = {};
		$scope.isNewCardAdded  = false;
		$scope.isManual        = false;
		$scope.dataToSave      = {};
		$scope.showCCPage	   = false;
                        $scope.swippedCard = false;
		$scope.cardsList       = [];// guess no need to show existing cards
		$scope.errorMessage    = "";

	};

	init();

	/**
	 * change payment type action - initial add payment screen
	 */
	$scope.changePaymentType = function() {

		if ($scope.paymentGateway !== 'sixpayments') {
			$scope.showCCPage = ($scope.dataToSave.paymentType === "CC") ? true : false;
                        $scope.swippedCard = ($scope.dataToSave.paymentType === "CC") ? true : false;
			$scope.showCCPage = ($scope.dataToSave.paymentType === "CC") ? true : false;
			$scope.addmode = true;
		} else {
			$scope.isNewCardAdded = ($scope.dataToSave.paymentType === "CC" && !$scope.isManual) ? true : false;
			return;
		}
	};
	$scope.changeOnsiteCallIn = function() {
		$scope.showCCPage = ($scope.isManual) ? true : false;
		$scope.swippedCard = ($scope.isManual) ? true : false;
		$scope.addmode = true;
	};


};