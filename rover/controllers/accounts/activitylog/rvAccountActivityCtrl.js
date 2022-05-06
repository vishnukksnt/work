sntRover.controller('rvAccountActivityCtrl', [
	'$scope',
	'$rootScope',
	'$filter',
	'$stateParams',
	'rvGroupAccountActivitySrv',
	function($scope, $rootScope, $filter, $stateParams, rvGroupAccountActivitySrv) {
		BaseCtrl.call(this, $scope);

		/**
		 * initialisation and basic configuration
		 * @return {none}
		 */
		$scope.init = function() {
			$scope.selectedGroupOrAccountId = $scope.$parent.accountConfigData.summary.posting_account_id;
			 var params = {
			 	"id": $scope.selectedGroupOrAccountId,
			 	"page": 1,
			 	"type": "account",
			 	"per_page": 50
			 };
			var fetchCompleted = function(data) {
				$scope.$broadcast('PopulateLogData', data);
			};

			$scope.invokeApi(rvGroupAccountActivitySrv.fetchActivityLog, params, fetchCompleted);
		};
		$scope.$on('updateLogdata', function(e, params) {
			params["id"] = $scope.selectedGroupOrAccountId;
			params["type"] = "account";
			var fetchCompleted = function(data) {
				$scope.$broadcast('PopulateLogData', data);
			};

			$scope.invokeApi(rvGroupAccountActivitySrv.fetchActivityLog, params, fetchCompleted);

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