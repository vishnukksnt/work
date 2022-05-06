sntRover.controller('RVAccountTransactionsPopupCtrl',
	['$scope', '$rootScope', '$filter', 'rvAccountTransactionsSrv', 'ngDialog', '$timeout', function($scope, $rootScope, $filter, rvAccountTransactionsSrv, ngDialog, $timeout) {


	BaseCtrl.call(this, $scope);
	$scope.warningMessage = "";
	$scope.adjustmentData = {};

	var reloadBillScreen =  function() {
		$timeout(function() {
			// $scope.$emit('UPDATE_TRANSACTION_DATA'); is not working anmore, 
			$scope.UPDATE_TRANSACTION_DATA && $scope.UPDATE_TRANSACTION_DATA();
		}, 1);
	};


	var hideLoaderAndClosePopup = function() {
		ngDialog.close();
		$timeout(function() {
			$scope.HIDE_LOADER_FROM_POPUP && $scope.HIDE_LOADER_FROM_POPUP();
			reloadBillScreen();
		}, 1000);		
	};


   /*
	 * API call remove transaction
	 */

	$scope.removeCharge = function(reason) {

		$scope.$emit('showLoader');
		var params = {
			data: {
				"reason": reason,
				"process": "delete"
			},
			"id": $scope.selectedTransaction.id
		};
		
	 	var options = {
			params: params,
			loader: 'NONE',
			successCallBack: hideLoaderAndClosePopup
		};

		$scope.callAPI (rvAccountTransactionsSrv.transactionDelete, options);

	};

	/**
	 * update splitted values for display
	 * handles split by amount and split by percent
	 * @return {undefined}
	 */
	$scope.showSpiltValues = function() {
		var transaction = $scope.selectedTransaction;

		if ($scope.splitTypeisAmount) {
			$scope.displayFirstValue  = transaction.amount - $scope.splitValue;
			$scope.displaySecondValue = $scope.splitValue;
		} else {
			$scope.displaySecondValue = parseFloat(transaction.amount * $scope.splitValue / 100).toFixed(2);
			$scope.displayFirstValue  = transaction.amount - $scope.displaySecondValue;
		}
	};

   /*
	 * API call split transaction
	 */

	$scope.splitCharge = function(qty, isAmountType) {

		$scope.$emit('showLoader');
		var split_type = isAmountType ? $rootScope.currencySymbol : '%';
		var splitData = {
			"id": $scope.selectedTransaction.id,
			"data": {
				"split_type": split_type,
   				"split_value": qty
			}

		};
		var options = {
			params: splitData,
			loader: 'NONE',
			successCallBack: hideLoaderAndClosePopup
		};

		$scope.callAPI (rvAccountTransactionsSrv.transactionSplit, options);

	};

	$scope.selectedAdjReason = function() {
		$scope.warningMessage = "";
	};

	$scope.clearWarningMessage = function () {
		$scope.warningMessage = '';
	};

   /*
	 * API call edit transaction
	 */
	
	$scope.editCharge = function() {
		if (!$scope.adjustmentData.adjustmentReason && $scope.showAdjustmentReason) {
			$scope.warningMessage = 'Please fill adjustment reason';
			return;
		}
		$scope.$emit('showLoader');
		var editData =
		{
			"updatedDate":
						{
							"new_amount": $scope.newAmount,
							"charge_code_id": $scope.selectedChargeCode.id,
							"adjustment_reason": $scope.adjustmentData.adjustmentReason,
							"reference_text": $scope.reference_text,
							"show_ref_on_invoice": $scope.show_ref_on_invoice
						},
					"id": $scope.selectedTransaction.id
		};

		var options = {
			params: editData,
			loader: 'NONE',
			successCallBack: hideLoaderAndClosePopup
		};
		
		$scope.callAPI (rvAccountTransactionsSrv.transactionEdit, options);
	};

	/*
	 * API call edit charge description
	 */
	$scope.editChargeDescription = function(newDescription) {

	    var editData = {
	        "postData": {
	            "custom_charge_description": newDescription
	        },
	        "id": $scope.selectedTransaction.id
	    };

		var options = {
			params: editData,
			loader: 'NONE',
			successCallBack: hideLoaderAndClosePopup
		};

		$scope.callAPI (rvAccountTransactionsSrv.transactionEditChargeDescription, options);

	};


/* ----------------------------edit charge drop down implementation--------------------------------------*/

	$scope.chargecodeData = {};
	$scope.chargecodeData.chargeCodeSearchText = "";
	var scrollerOptionsForSearch = {click: true, preventDefault: false};

	$scope.setScroller('chargeCodesList', scrollerOptionsForSearch);

	$scope.selectChargeCode = function(id) {
		 for (var i = 0; i < $scope.availableChargeCodes.length; i++) {
		 	 if ($scope.availableChargeCodes[i].id === id) {
		 	 	$scope.selectedChargeCode = $scope.availableChargeCodes[i];
		 	 }
		 }
		$scope.showChargeCodes = false;
		$scope.chargecodeData.chargeCodeSearchText = "";
	};
		 	/**
  	* function to perform filering on results.
  	* if not fouund in the data, it will request for webservice
  	*/
  	var displayFilteredResultsChargeCodes = function() {

	    // if the entered text's length < 3, we will show everything, means no filtering
	    if ($scope.chargecodeData.chargeCodeSearchText.length < 3) {
	      // based on 'is_row_visible' parameter we are showing the data in the template
	      for (var i = 0; i < $scope.availableChargeCodes.length; i++) {
	          $scope.availableChargeCodes[i].is_row_visible = true;
	          $scope.availableChargeCodes[i].is_selected = true;
	      }
	      $scope.refreshScroller('chargeCodesList');
	      // we have changed data, so we are refreshing the scrollerbar

	    }
	    else {
	      var value = "";
	      // searching in the data we have, we are using a variable 'visibleElementsCount' to track matching
	      // if it is zero, then we will request for webservice

	      for (var i = 0; i < $scope.availableChargeCodes.length; i++) {
	        value = $scope.availableChargeCodes[i];
	        if (($scope.escapeNull(value.name).toUpperCase()).indexOf($scope.chargecodeData.chargeCodeSearchText.toUpperCase()) >= 0 ||
	            ($scope.escapeNull(value.description).toUpperCase()).indexOf($scope.chargecodeData.chargeCodeSearchText.toUpperCase()) >= 0 )
	            {
	               $scope.availableChargeCodes[i].is_row_visible = true;
	            }
	        else {
	          $scope.availableChargeCodes[i].is_row_visible = false;
	        }

	      }
	      // we have changed data, so we are refreshing the scrollerbar

	      $scope.refreshScroller('chargeCodesList');
	    }
  	};
	/**
    * function to clear the charge code search text
    */

	$scope.clearResults = function() {
	  	$scope.chargecodeData.chargeCodeSearchText = "";
	};
    /**
    * function to show available charge code list on clicking the dropdown
    */
    $scope.showAvailableChargeCodes = function() {
        $scope.clearResults ();
        displayFilteredResultsChargeCodes();
        $scope.showChargeCodes = !$scope.showChargeCodes;
    };

     /**
    * function to trigger the filtering when the search text is entered
    */
    $scope.chargeCodeEntered = function() {
        $scope.showChargeCodes = false;
	   	displayFilteredResultsChargeCodes();
	   	var queryText = $scope.chargecodeData.chargeCodeSearchText;

	    $scope.chargecodeData.chargeCodeSearchText = queryText.charAt(0).toUpperCase() + queryText.slice(1);
	};
	
	// To show or hide charge code list
    $scope.isShowChargeCodeList = function() {
    	var isShowChargeCodeList = false,
    		chargeCodeLength = $scope.availableChargeCodes.length,
    		queryLength = $scope.chargecodeData.chargeCodeSearchText.length;

    	if ($scope.showChargeCodes) {
    		isShowChargeCodeList = true;
    	}
    	else if (queryLength > 2 && chargeCodeLength !== 0) {
			for (var i = 0; i < chargeCodeLength; i++) {
			 	if ($scope.availableChargeCodes[i].is_row_visible) {
			 		isShowChargeCodeList = true;
			 		break;
			 	}
			}
		}
		return isShowChargeCodeList;
	};
    /* 
     * Method to update the button label on EDIT CHARGE screen
     */
    $scope.getEditChargeButtonText = function() {
		return ($scope.chargeCodeActive) ? 'CHANGE_CHARGE_CODE' : 'CHANGE_AMOUNT';
	};

}]);