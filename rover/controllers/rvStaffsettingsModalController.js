sntRover.controller('RVStaffsettingsModalController', ['$scope', 'ngDialog', 'RVSettingsSrv', function($scope, ngDialog, RVSettingsSrv) {

BaseCtrl.call(this, $scope);
$scope.newPassword = '';
$scope.confirmPassword = '';
$scope.errorMessage = '';

/*
 * fetch data for settings
 */
$scope.fetchData = function() {
    var fetchUserInfoSuccessCallback = function(data) {
        $scope.userInfo = data;
        $scope.$emit('hideLoader');
    };
    var fetchUserInfoFailureCallback = function(data) {
        $scope.$emit('hideLoader');
    };

    $scope.invokeApi(RVSettingsSrv.fetchUserInfo, {}, fetchUserInfoSuccessCallback, fetchUserInfoFailureCallback);

};

$scope.fetchData();
/*
 * cancel click action
 */
$scope.cancelClicked = function() {
    ngDialog.close();

};
/*
 * function to check if the passwords matches
 */
$scope.passwordsMatch = function() {
	if ($scope.newPassword !== $scope.confirmPassword) {
		return false;
	}
	else if ($scope.newPassword.length === 0) {
		return false;
	}
	else {
		return true;
	}
};
/*
 * update settings
 */
$scope.updateSettings = function() {
	var updateUserInfoSuccessCallback = function(data) {
		$scope.cancelClicked();
	    $scope.$emit('hideLoader');
	};
	var updateUserInfoFailureCallback = function(data) {
		 $scope.errorMessage = data;
	    $scope.$emit('hideLoader');
	};

	$scope.invokeApi(RVSettingsSrv.updateUserInfo, {'new_password': $scope.newPassword}, updateUserInfoSuccessCallback, updateUserInfoFailureCallback);
	};

}]);