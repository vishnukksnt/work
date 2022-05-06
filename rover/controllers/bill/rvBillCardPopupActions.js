sntRover.controller('rvBillCardPopupCtrl',
	['$scope', '$rootScope', '$filter', 'RVBillCardSrv', 'ngDialog', '$timeout', function($scope, $rootScope, $filter, RVBillCardSrv, ngDialog, $timeout) {

	BaseCtrl.call(this, $scope);
	$scope.newAmount = '';
	$scope.warningMessage = "";
	$scope.adjustmentData = {};


	var refreshListWithData = function() {
		$timeout(function() {
			$scope.reloadCurrentActiveBill();
		}, 700);
	};

	var hideLoaderAndClosePopup = function() {			
		ngDialog.close();
		$timeout(function() {
			$scope.HIDE_LOADER_FROM_POPUP && $scope.HIDE_LOADER_FROM_POPUP();
		}, 1000);
		
	};

	var failureCallBack = function(data) {

		$scope.$emit("hideLoader");
		$scope.errorMessage = data;
	};

   /*
	 * API call remove transaction
	 */

	$scope.removeCharge = function(reason) {

		var deleteData =
		{
			data: {
				"reason": reason,
				"process": "delete"
			},
			"id": $scope.selectedTransaction.id
		};
		var transactionDeleteSuccessCallback = function(data) {
			hideLoaderAndClosePopup();
			refreshListWithData(data);

		};

		$scope.invokeApi(RVBillCardSrv.transactionDelete, deleteData, transactionDeleteSuccessCallback, failureCallBack);
	};

	$scope.showSpiltValues = function() {
		if ($scope.splitTypeisAmount) {
			$scope.displayFirstValue = $scope.selectedTransaction.amount - $scope.splitValue;
			$scope.displaySecondValue = $scope.splitValue;
		} else {
			$scope.displaySecondValue = parseFloat($scope.selectedTransaction.amount * $scope.splitValue / 100).toFixed(2);
			$scope.displayFirstValue = $scope.selectedTransaction.amount - $scope.displaySecondValue;
		}
	};
	/*
	* API call split transaction
	*/
	$scope.splitCharge = function(qty, isAmountType) {

		var split_type = isAmountType ? $rootScope.currencySymbol : '%';
		var splitData = {
			"id": $scope.selectedTransaction.id,
			"data": {
				"split_type": split_type,
   				"split_value": qty
			}

		};
		var transactionSplitSuccessCallback = function(data) {
			hideLoaderAndClosePopup();
			refreshListWithData(data);
		};

		$scope.invokeApi(RVBillCardSrv.transactionSplit, splitData, transactionSplitSuccessCallback, failureCallBack);
	};

	var transactionEditSuccessCallback = function(data) {
		hideLoaderAndClosePopup();
		refreshListWithData(data);
	};

   	/**
	 * API call edit transaction
	 * @param {string} newAmount updated charge amount
	 * @param {number} chargeCode updated charge code id
	 * @returns {undefined}
	 */

	$scope.selectedAdjReason = function() {
		$scope.warningMessage = "";
	};

	$scope.clearWarningMessage = function () {
		$scope.warningMessage = '';
	};

	$scope.editCharge = function() {
		if (!$scope.adjustmentData.adjustmentReason && $scope.showAdjustmentReason) {
			$scope.warningMessage = 'Please fill adjustment reason';
			return;
		}
		
		var params = {
			id: $scope.selectedTransaction.id,
			updatedData: {
				new_amount: $scope.newAmount || undefined,
				charge_code_id: $scope.selectedChargeCode.id,
				adjustment_reason: $scope.adjustmentData.adjustmentReason,
				reference_text: $scope.reference_text,
				show_ref_on_invoice: $scope.show_ref_on_invoice
			}
		};
		$scope.invokeApi(RVBillCardSrv.transactionEdit, params, transactionEditSuccessCallback, failureCallBack);
	};

	/*
	 * API call edit charge description
	 */
	$scope.editChargeDescription = function(newDescription) {

	    var newData = {
	        "postData": {
	            "custom_charge_description": newDescription
	        },
	        "id": $scope.selectedTransaction.id
	    };

	    var transactionEditSuccessCallback = function(data) {
	        hideLoaderAndClosePopup();
	        refreshListWithData(data);
	    };

	    $scope.invokeApi(RVBillCardSrv.transactionEditChargeDescription, newData, transactionEditSuccessCallback, failureCallBack);

	};


/* ----------------------------edit charge drop down implementation--------------------------------------*/
	$scope.chargecodeData = {};
	$scope.chargecodeData.chargeCodeSearchText = "";
	$scope.selectedChargeCode = { description: '' };
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
	          $scope.availableChargeCodes[i].is_row_visible = false;
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

	$scope.shouldDisableEditChargeCode = function() {
		return $scope.newAmount.length > 0;
	};

	$scope.shouldDisableEditChargeAmount = function() {
		return $scope.selectedChargeCode.description.length > 0;
	};

	$scope.getEditChargeButtonText = function() {
		return ($scope.chargeCodeActive) ? 'CHANGE_CHARGE_CODE' : 'CHANGE_AMOUNT';
	};

}]);