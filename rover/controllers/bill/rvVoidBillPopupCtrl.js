sntRover.controller('RVVoidBillPopupCtrl',
	['$scope', '$timeout', 'RVBillCardSrv',
	function($scope, $timeout, RVBillCardSrv) {

		BaseCtrl.call(this, $scope);

		$scope.voidData = {};
		/*
		 * Void Bill 
		 * @param voidType type void or void_and_repost
		 */
		$scope.voidBill = function(voidType) {

			var successCallBackOfVoidBill = function(data) {
					$scope.$emit("VOID_BILL_GENERATED", data.bills);
				},
				paramsToService = {
					'bill_id': ($scope.isFromAccounts) ? $scope.transactionsDetails.bills[$scope.currentActiveBill].bill_id : $scope.reservationBillData.bills[$scope.currentActiveBill].bill_id,
					'data': {
						"void_type": voidType,
						"void_reason": $scope.voidData.reason
					}
				},
				options = {
					params: paramsToService,
					successCallBack: successCallBackOfVoidBill
				};
						
			$scope.callAPI( RVBillCardSrv.generateVoidBill, options );

		};	

}]);