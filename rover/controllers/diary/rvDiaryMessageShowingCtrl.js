sntRover.controller('RVDiaryMessageShowingCtrl', ['$scope',
    'ngDialog',
    '$rootScope',
    '$timeout',
    function($scope, ngDialog, $rootScope, $timeout) {
    	$scope.messages = $scope.message;
    	var callBack = $scope.callBackAfterClosingMessagePopUp;

    	$scope.closeDialog = function() {
            // to add stjepan's popup showing animation
            $rootScope.modalClosing = true;
            $timeout(function() {
                $rootScope.modalClosing = false;
                ngDialog.close();
            }, 300);
    		if (callBack) {
    			$timeout(function() {
    				callBack();
    			}, 1000);

    		}
    	};

        // Use this function to just close the popup while clicking on the close btn at the top left corner
        $scope.exitPopup = function() {
           ngDialog.close(); 
        };
	}
]);