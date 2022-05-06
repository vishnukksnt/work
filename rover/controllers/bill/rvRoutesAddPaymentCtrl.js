sntRover.controller('rvRoutesAddPaymentCtrl', ['$scope', '$rootScope', '$filter', 'ngDialog', 'RVPaymentSrv', function($scope, $rootScope, $filter, ngDialog, RVPaymentSrv) {
	BaseCtrl.call(this, $scope);

	$scope.cardsList = [];
	$scope.addmode = $scope.cardsList.length > 0 ? false : true;
	$scope.hideCancelCard = true;
	$scope.isManual = false;

	/**
    * MLI session set up
    */
	var MLISessionId = "";

	try {
			HostedForm.setMerchant($rootScope.MLImerchantId);
		}
		catch (err) {}

	$scope.cancelClicked = function() {
		$scope.showPaymentList();
		$scope.saveData.payment_type =  "";
		$scope.saveData.payment_type_description =  "";
		$scope.showCCPage = false;
		$scope.swippedCard = false;
		$scope.addmode = false;
		$scope.saveData.newPaymentFormVisible = false;
		$scope.$emit("CANCELLED_PAYMENT");
	};

		/**
	* setting the scroll options for the add payment view
	*/
	var scrollerOptions = { preventDefault: false};

  	$scope.setScroller('newpaymentview', scrollerOptions);

  	$scope.$on('showaddpayment', function(event) {
  		$scope.refreshScroller('newpaymentview');
	});

  	/**
    * function to show available payment types from server
    */
  	$scope.fetchAvailablePaymentTypes = function() {

            var successCallback = function(data) {
                var indexOfDB = null;

                $scope.creditCardTypes = [];
                $scope.availablePaymentTypes = data;
                $scope.ccPaymentDetails = {};
                for (var i in data) {
                    if (data[i].name === 'CC') {
                        $scope.ccPaymentDetails = data[i];
                        $scope.creditCardTypes = data[i].values;
                    }
                }

                // CICO-36769 hide direct bill for reservations as entity.
                if ($scope.selectedEntity.entity_type === 'RESERVATION') {
                    indexOfDB = _.findIndex($scope.availablePaymentTypes, {name: 'DB'});
                    if (indexOfDB !== -1) {
                        $scope.availablePaymentTypes.splice(indexOfDB, 1);
                    }                    
                }

                $scope.$parent.$emit('hideLoader');
                $scope.refreshScroller('newpaymentview');
            };
            var errorCallback = function(errorMessage) {
                $scope.$parent.$emit('hideLoader');
                $scope.$emit('displayErrorMessage', errorMessage);
            };

			var isAllowDirectDebit = true;
			
			if (($scope.selectedEntity.entity_type === 'COMPANY_CARD' || $scope.selectedEntity.entity_type === 'TRAVEL_AGENT') && $scope.selectedEntity.is_allow_direct_debit) {
				isAllowDirectDebit = $scope.selectedEntity.is_allow_direct_debit;
			}
            var paymentParams = {"direct_bill": isAllowDirectDebit };

            $scope.invokeApi(RVPaymentSrv.renderPaymentScreen, paymentParams, successCallback, errorCallback);
    };
    $scope.fetchAvailablePaymentTypes();

  // 	/* MLI integration starts here */

     $scope.savePaymentDetails = function() {

     		if ($scope.saveData.payment_type !== "CC") {
     			$scope.savePayment();
     			return;
     		}
			 var sessionDetails = {};

			 sessionDetails.cardNumber = $scope.saveData.card_number;
			 sessionDetails.cardSecurityCode = $scope.saveData.cvv;
			 sessionDetails.cardExpiryMonth = $scope.saveData.card_expiry_month;
			 sessionDetails.cardExpiryYear = $scope.saveData.card_expiry_year;

			 var callback = function(response) {
			 	$scope.$emit("hideLoader");

			 	if (response.status === "ok") {

			 		MLISessionId = response.session;
			 		$scope.savePayment();// call save payment details WS
			 	}
			 	else {
			 		$scope.$emit('displayErrorMessage', ["There is a problem with your credit card"]);
			 	}
			 	$scope.$apply();
			 };

			try {
			    HostedForm.updateSession(sessionDetails, callback);
			    $scope.$emit("showLoader");
			}
			catch (err) {
			   $scope.$emit('displayErrorMessage', ["There was a problem connecting to the payment gateway."]);
			}

		};
		/**
	    * function to save a new payment type
	    */
		$scope.savePayment = function() {

			$scope.saveData.reservation_id = $scope.reservationData.reservation_id;
			$scope.saveData.session_id = MLISessionId;
			$scope.saveData.mli_token = $scope.saveData.card_number.substr($scope.saveData.card_number.length - 4);
			$scope.saveData.card_expiry = $scope.saveData.card_expiry_month + "/" + $scope.saveData.card_expiry_year;

			$scope.paymentAdded($scope.saveData);
		};
		/**
	    * function to set the selected payment type
	    */
		$scope.selectPaymentType = function() {
			for (var i = 0; i < $scope.availablePaymentTypes.length; i++) {
				if ($scope.availablePaymentTypes[i].name === $scope.saveData.payment_type) {
					$scope.saveData.payment_type_description = $scope.availablePaymentTypes[i].description;
				}
			}
			$scope.refreshScroller('newpaymentview');
			// if($scope.paymentGateway !== 'sixpayments'){
				$scope.showCCPage = ($scope.saveData.payment_type === "CC") ? true : false;
				$scope.swippedCard = ($scope.saveData.payment_type === "CC") ? true : false;
				$scope.saveData.newPaymentFormVisible = ($scope.saveData.payment_type === "CC") ? true : false;
				$scope.addmode = ($scope.saveData.payment_type === "CC" &&  $scope.cardsList.length === 0) ? true : false;
			// } else {
			// 	$scope.isManual = false;
			// }
		};

		$scope.changeOnsiteCallIn = function() {
			$scope.$emit('CHANGE_IS_MANUAL', $scope.isManual);
			$scope.showCCPage = ($scope.saveData.payment_type === "CC" &&  $scope.isManual) ? true : false;
			$scope.swippedCard = ($scope.saveData.payment_type === "CC" &&  $scope.isManual) ? true : false;
			$scope.addmode = ($scope.saveData.payment_type === "CC" &&  $scope.cardsList.length === 0) ? true : false;
			$scope.saveData.newPaymentFormVisible = ($scope.saveData.payment_type === "CC" &&  $scope.isManual) ? true : false;
			$scope.$broadcast('REFRESH_IFRAME');
		};
		/*
		 * on succesfully created the token
		 */
		$scope.$on("TOKEN_CREATED", function(e, tokenDetails) {
			$scope.showCCPage = false;
			$scope.swippedCard = false;
			$scope.addmode = false;
			$scope.saveData.newPaymentFormVisible = false;
			$scope.paymentAdded(tokenDetails);
		});

		$scope.$on("SUCCESS_LINK_PAYMENT", function(event, params) {
			$scope.showCCPage = false;
			$scope.swippedCard = false;
			$scope.addmode = false;
			$scope.saveData.newPaymentFormVisible = false;
			console.log(params);
			$scope.onSaveNewCard(params);
		});

		$scope.$on("RENDER_DATA_ON_BILLING_SCREEN", function(e, swipedCardDataToRender) {
			$scope.showCCPage 						 = true;
			$scope.addmode                 			 = true;
                        $scope.swippedCard = true;
			$scope.saveData.newPaymentFormVisible    = true;
			$scope.$apply();
			$scope.$broadcast("RENDER_SWIPED_DATA", swipedCardDataToRender);

		});

		$scope.$on("SWIPED_DATA_TO_SAVE", function(e, swipedCardDataToSave) {
			$scope.showCCPage = false;
			$scope.swippedCard = false;
			$scope.addmode = false;
			$scope.saveData.newPaymentFormVisible = false;
			$scope.paymentAddedThroughMLISwipe(swipedCardDataToSave);
		});
		$scope.$on('UPDATE_FLAG', function() {
			$scope.showCCPage = false;
			$scope.swippedCard = false;
		});

		$scope.$on("PAYMENT_TYPE_CHANGED", function(event, paymentType) {
			$scope.saveData.payment_type = paymentType;
			$scope.selectPaymentType();
		});

		$scope.$on("PAYMENT_ACTION_CANCELLED", $scope.cancelClicked);

	(function() {
		$scope.billNumber = $scope.getSelectedBillNumber();
		$scope.$watch("selectedEntity.to_bill", function() {
			$scope.billNumber = $scope.getSelectedBillNumber();
		});
		$scope.$watch("bills", function() {
			$scope.billNumber = $scope.getSelectedBillNumber();
		});
	})();
}]);