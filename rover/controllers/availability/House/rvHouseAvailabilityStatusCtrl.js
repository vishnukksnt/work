angular.module('sntRover').controller('RVHouseAvailabilityStatusCtrl', [
	'$scope',
	'$timeout',
	'ngDialog',
	'$rootScope',
	'$filter',
	'rvAvailabilitySrv',
	function($scope, $timeout, ngDialog, $rootScope, $filter, rvAvailabilitySrv) {

		$scope.$on('$includeContentLoaded', function(event) {
			$scope.$emit("hideLoader");
		});

		var init = function() {
			$scope.page.title = "House Status";
			$scope.houseStatus = {};
			fetchHouseStatus();
			$scope.setScroller('house-status-grid');
			$scope.houseDetailsFetched = false;
		};

		var fetchHouseStatus = function() {
			var houseStatusFetchSuccess = function(data) {
				$scope.$emit("hideLoader");
				$scope.houseDetails = data;
				$scope.houseDetailsFetched = true;
				$timeout(function() {
					$scope.refreshScroller('house-status-grid');
					// CICO-10617 The refresh scroller is not working in this case... On first check found that the scope is different.
					// Applying a quick resolution now... Will have to debug and apply fix later
					$scope.$parent.myScroll['house-status-grid'].refresh();
				}, 300);

			};
			var businessDate = tzIndependentDate($rootScope.businessDate);
			// We need to display only 3 days information
			var fromDate = businessDate.clone();

			fromDate.setDate(fromDate.getDate() - 1);

			var toDate = businessDate.clone();

			toDate.setDate(toDate.getDate() + 1);

			var dataForWebservice = {
				'from_date': $filter('date')(fromDate, $rootScope.dateFormatForAPI),
				'to_date': $filter('date')(toDate, $rootScope.dateFormatForAPI),
				'business_date': $rootScope.businessDate
			};

			$scope.invokeApi(rvAvailabilitySrv.fetchHouseStatusDetails, dataForWebservice, houseStatusFetchSuccess);
		};

		init();
	}
]);