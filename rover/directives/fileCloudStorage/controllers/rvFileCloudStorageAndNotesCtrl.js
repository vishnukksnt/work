'use strict';

sntRover.controller('rvFileCloudStorageAndNotesCtrl', ['$scope', 'rvFileCloudStorageSrv', 'RVHotelDetailsSrv', '$controller', '$rootScope', function ($scope, rvFileCloudStorageSrv, RVHotelDetailsSrv, $controller, $rootScope) {

	$scope.screenModeChanged = function (selectedType) {
		$scope.$broadcast('FETCH_' + selectedType);
	};

	(function () {
		$scope.cardData = {
			notesViewOn: true,
			cloudType: RVHotelDetailsSrv.hotelDetails.cloud_storage_config.cloud_storage_type
		};
		$controller('rvCardNotesCtrl', {
			$scope: $scope
		});
		$controller('rvFileCloudStorageCtrl', {
			$scope: $scope
		});
		$scope.$broadcast('FETCH_NOTES');
		$scope.errorMessage = '';
		var scrollOptions = {
			preventDefaultException: {
				tagName: /^(INPUT|LI)$/
			},
			preventDefault: false
		};

		$scope.currentHotelName = $rootScope.currentHotelName;

		$scope.setScroller('card_file_list_scroller', scrollOptions);
	})();
}]);