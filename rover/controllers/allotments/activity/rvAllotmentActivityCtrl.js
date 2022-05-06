sntRover.controller('rvAllotmentActivityCtrl', [
	'$scope',
	'$rootScope',
	'$filter',
	'$stateParams',
	'rvAllotmentAccountActivitySrv',
	function($scope, $rootScope, $filter, $stateParams, rvAllotmentAccountActivitySrv) {
		BaseCtrl.call(this, $scope);

		/**
		 * initialisation and basic configuration
		 * @return {none}
		 */
		$scope.init = function() {
			var allotmentDataExists = !!$scope.allotmentConfigData;

			$scope.selectedAllotmentOrAccountId = (allotmentDataExists) ? $scope.allotmentConfigData.summary.allotment_id : $scope.accountConfigData.summary.posting_account_id;
			var params = {
				"id": $scope.selectedAllotmentOrAccountId,
				"page": 1,
				"type": (allotmentDataExists) ? "allotment" : "account",
				"per_page": 50
			};
			var fetchCompleted = function(data) {
				$scope.$broadcast('PopulateLogData', data);
			};

			$scope.invokeApi(rvAllotmentAccountActivitySrv.fetchActivityLog, params, fetchCompleted);
		};
		$scope.$on('updateLogdata', function(e, params) {
				params["id"] = $scope.selectedAllotmentOrAccountId;
				params["type"] = !!$scope.allotmentConfigData ? "allotment" : "account";
				var fetchCompleted = function(data) {
					$scope.$broadcast('PopulateLogData', data);
				};

				$scope.invokeApi(rvAllotmentAccountActivitySrv.fetchActivityLog, params, fetchCompleted);

			});

		/**
		 * When there is a TAB switch, we will get this. We will initialize things from here
		 * @param  {Object} event
		 * @param  {String} currentTab - Active tab in the view
		 * @return undefined
		 */
		$scope.$on ('ALLOTMENT_TAB_SWITCHED', function(event, currentTab) {
			if (currentTab === "ACTIVITY") {
				$scope.init();
			}
		});

		/**
		 * When there is a TAB switch, we will get this. We will initialize things from here
		 * @param  {Object} event
		 * @param  {String} currentTab - Active tab in the view
		 * @return undefined
		 */
		$scope.$on ('ACCOUNT_TAB_SWITCHED', function(event, currentTab) {
			if (currentTab === "ACTIVITY") {
				$scope.init();
			}
		});

	}
]);