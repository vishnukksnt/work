sntRover.controller('RVMoveChargeCtrl',
	['$scope', '$timeout', 'RVMoveChargeSrv',
	function($scope, $timeout, RVMoveChargeSrv) {

		BaseCtrl.call(this, $scope);

		var initiate = function() {
			$scope.numberQuery    = "";
			$scope.textQuery      = "";
			$scope.searchResults  = [];
			$scope.targetSelected = false;
			$scope.targetBillSelected = false;
			$scope.searching = false;
			$scope.selectedTarget = {};
			$scope.targetBillId   = "";
			$scope.setScroller('search_results');			
			$scope.billOptions = [];
			createBillOptions();
		};

		/**
         * return - An array of Bills except current acive bill
         */
		var createBillOptions = function() {
			// Bills are collected from reservationBillData or transactionsDetails		
			var bills = ($scope.reservationBillData && $scope.reservationBillData.bills) || ($scope.transactionsDetails && $scope.transactionsDetails.bills);			

			_.each(bills, function(result, index) {
				if (index !== $scope.currentActiveBill) {
					$scope.billOptions.push(result);
				}
			});
		};		

		/**
         * to run angular digest loop,
         * will check if it is not running
         * return - None
         */
        var runDigestCycle = function() {
            if (!$scope.$$phase) {
                $scope.$digest();
            }
        };

        /**
         * Handle bill selected Action
         * TODO : Disable search Portion
         */
        $scope.billSelected = function() {
        	if ($scope.selectedBillId !== "") {
        		$scope.targetBillId = parseInt($scope.selectedBillId);
        		$scope.targetBillSelected = true;
        	} else {
        		$scope.targetBillSelected = false;
        		$scope.searching = false;
        		}
        };


		$scope.getGuestStatusIcon = function(reservationStatus, isLateCheckoutOn, isPrecheckin) {
			var viewStatus = "";

			if (isLateCheckoutOn && "CHECKING_OUT" === reservationStatus) {
				viewStatus = "late-check-out";
				return viewStatus;
			}
			if ("RESERVED" === reservationStatus && !isPrecheckin) {
				viewStatus = "arrival";
			} else if ("CHECKING_IN" === reservationStatus && !isPrecheckin) {
				viewStatus = "check-in";
			} else if ("CHECKEDIN" === reservationStatus) {
				viewStatus = "inhouse";
			} else if ("CHECKEDOUT" === reservationStatus) {
				viewStatus = "departed";
			} else if ("CHECKING_OUT" === reservationStatus) {
				viewStatus = "check-out";
			} else if ("CANCELED" === reservationStatus) {
				viewStatus = "cancel";
			} else if (("NOSHOW" === reservationStatus) || ("NOSHOW_CURRENT" === reservationStatus)) {
				viewStatus = "no-show";
			} else if (isPrecheckin) {
				viewStatus = "pre-check-in";
			}
			return viewStatus;
		};


		var refreshSearchList = function() {
			$timeout(function() {
				$scope.refreshScroller('search_results');
			}, 500);
		};

		$scope.$on("NG_REPEAT_COMPLETED_RENDERING", function(event) {
			refreshSearchList ();
		});

		var unsetSearchList = function() {
			$scope.searchResults = [];
			refreshSearchList();
		};

		$scope.clearTextQuery = function() {
			$scope.textQuery = '';
			unsetSearchList();
			$scope.searching = false;
			$scope.targetSelected = false;
		};


		$scope.clearNumberQuery = function() {
			$scope.numberQuery = '';
			unsetSearchList();
			$scope.searching = false;
			$scope.targetSelected = false;
		};

		/**
		 * function to fetch reservation and account lists
		 *
		 */

		var fetchFilterdData = function() {

			var fetchSucces = function(data) {
				$scope.$emit("hideLoader");
				$scope.searchResults = data.results;
    			_.each($scope.searchResults, function(result, index) {
    				result.entity_id = index;
    				(result.type === 'RESERVATION') ? result.displaytext = result.last_name + ', ' + result.first_name : '';
    			});
    			refreshSearchList();
			};

			$scope.invokeApi(RVMoveChargeSrv.fetchSearchedItems, {"text_search": $scope.textQuery, "number_search": $scope.numberQuery, "bill_id": $scope.moveChargeData.fromBillId}, fetchSucces);
		};

		/**
		 * function to perform filtering/request data from
		 * service in change event of query box
		 */
		$scope.queryEntered = function() {
			$scope.searching = true;
			$scope.targetSelected = false;
			$timeout(function() {
				if (($scope.textQuery === "" || $scope.textQuery.length < 3) && ($scope.numberQuery === "" || $scope.numberQuery.length < 2 )) {
					$scope.searchResults = [];
					refreshSearchList();
				} else {
					fetchFilterdData();
				}
				runDigestCycle();
			}, 200);
		};


		/**
		 * function to select one item from the filtered list
		 *
		 */

		$scope.targetClicked =  function(selectedId) {

			_.each($scope.searchResults, function(result) {
				if (result.entity_id === selectedId) {
					$scope.selectedTarget               = result;
					$scope.selectedTarget.displayNumber = (result.type === "ACCOUNT" || result.type === "GROUP") ? result.account_number : result.confirm_no;
					$scope.selectedTarget.displaytext   = (result.type === "ACCOUNT" || result.type === "GROUP") ? result.account_name : (result.last_name + ' ,' + result.first_name);
					$scope.targetBillId                 = $scope.selectedTarget.bills[0].id;
					$scope.targetSelected               = true;
				}
		    });
		    $scope.searching = false;
		    $scope.targetSelected = true;
		};

		/**
		 * Discard current selection and go to search list
		 *
		 */
		$scope.changeSelection =  function() {
			$scope.selectedTarget = {};
			$scope.targetSelected = false;
			$scope.searching = true;
		};
		/**
		 * show Move/Cancel button
		 *
		 */
		$scope.showMoveButton = function() {
			return ($scope.targetSelected || $scope.targetBillSelected);
		};

		// Method to check whether all charges on the page are selected.
		$scope.isAllTransactionsSelected = function() {
			if ($scope.origin === 'ACCOUNT') {
				var totalTransactionsCount = $scope.transactionsDetails.bills[$scope.currentActiveBill].transactions.length,
					totalTransactionsSelected = $scope.moveChargeData.selectedTransactionIds.length;

				return (totalTransactionsCount === totalTransactionsSelected);
			}
		};

		/*
		 *	Logic to show Move all charges code checkbox.
		 *	It will show only when pagination exist and
		 * 	all transactions on the screen/current page is selected
		 */
		$scope.showMoveAllChargesCheckbox = function() {
			var isShowCheckbox = false;

			if ($scope.origin === 'ACCOUNT') {
				var isMoreThanOnePageExist = $scope.transactionsDetails.bills[$scope.currentActiveBill].pageOptions.totalPages > 1;

				isShowCheckbox = isMoreThanOnePageExist && $scope.isAllTransactionsSelected();
			}

			return isShowCheckbox;
		};

		/**
		 * function to move transaction codes to another
		 * reservation or account
		 *
		 */
		$scope.moveCharges = function() {

			var params = {
				 "from_bill": $scope.moveChargeData.fromBillId,
   				"to_bill": $scope.targetBillId,
    			"financial_transaction_ids": $scope.moveChargeData.selectedTransactionIds,
				  "is_move_all_charges": $scope.moveChargeData.isMoveAllCharges,
					"date": $scope.moveChargeData.date
			};
			var chargesMovedSuccess = function(response) {
				$scope.$emit("hideLoader");
				response.data.toBill = $scope.targetBillId;
				$scope.$emit('moveChargeSuccsess', response.data);
				if (!response.data.is_move_charges_inprogress) {
					$scope.closeDialog();
				}
			};
			var failureCallback = function(data) {

                $scope.errorMessage = data;
                $scope.$emit('hideLoader');
            };

			$scope.invokeApi(RVMoveChargeSrv.moveChargesToTargetEntity, params, chargesMovedSuccess, failureCallback );
		};
		initiate();

}]);