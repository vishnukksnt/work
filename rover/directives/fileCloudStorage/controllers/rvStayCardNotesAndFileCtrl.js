'use strict';

sntRover.controller('rvStayCardNotesAndFileCtrl', ['$scope', 'rvFileCloudStorageSrv', 'RVHotelDetailsSrv', '$controller', function ($scope, rvFileCloudStorageSrv, RVHotelDetailsSrv, $controller) {

	$scope.screenModeChanged = function (selectedType) {
		$scope.$broadcast('FETCH_' + selectedType);
	};

	$scope.$on('$destroy', function () {
		rvFileCloudStorageSrv.activeCardType = angular.copy(rvFileCloudStorageSrv.previousActiveCardType);
	});

	(function () {
		rvFileCloudStorageSrv.previousActiveCardType = angular.copy(rvFileCloudStorageSrv.activeCardType);
		var cardType = 'stay_card';
		var cardId = $scope.reservationData.reservation_card.reservation_id;

		$scope.cardId = cardId;
		$scope.cardType = cardType;
		$scope.cardData = {
			notesViewOn: true,
			cloudType: RVHotelDetailsSrv.hotelDetails.cloud_storage_config.cloud_storage_type
		};
		$scope.showFiles = $scope.isCloudStorageEnabledForCardType(cardType);
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

		$scope.setScroller('card_file_list_scroller', scrollOptions);
	})();
}]);