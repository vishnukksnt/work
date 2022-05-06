sntRover.controller('RVEndOfDayModalController', ['$scope', 'ngDialog', '$rootScope', '$filter', 'RVEndOfDayModalSrv',
	function($scope, ngDialog, $rootScope, $filter, RVEndOfDayModalSrv) {

BaseCtrl.call(this, $scope);
$scope.userName = '';
$scope.errorMessage = '';
$scope.isLoggedIn = false;
$scope.startProcess = false;
$scope.startProcessEnabled = true;
$scope.businessDate = $filter('date')($rootScope.businessDate, $rootScope.dateFormat);
$scope.nextBusinessDate = tzIndependentDate($rootScope.businessDate);
$scope.nextBusinessDate.setDate($scope.nextBusinessDate.getDate() + 1);
$scope.nextBusinessDate = $filter('date')($scope.nextBusinessDate, $rootScope.dateFormat);
$scope.isTimePastMidnight = true;
$rootScope.isCurrentUserChangingBussinessDate = true;
/*
 * cancel click action
 */
$scope.cancelClicked = function() {
   $rootScope.isCurrentUserChangingBussinessDate = false;
   ngDialog.close();
};
/*
 * verify credentials
 */
$scope.login = function() {
	$rootScope.$broadcast('showLoader');
	var loginSuccess = function(data) {
		$rootScope.$broadcast('hideLoader');
		$scope.isLoggedIn = true;
		// verify if hotel time is past midnight or not
		$scope.isTimePastMidnight = (data.is_show_warning === "true") ? false : true;
        setDisplayMode();
	};
	var loginFailure = function(data) {
		$rootScope.$broadcast('hideLoader');
		$scope.errorMessage = data;
        setDisplayMode();
	};

    $scope.invokeApi(RVEndOfDayModalSrv.login, {
        "password": $scope.userPassword
    }, loginSuccess, loginFailure);

};
$scope.startEndOfDayProcess = function() {
	$scope.startProcess = true;
    setDisplayMode();
};

$scope.yesClick = function() {
	$scope.isTimePastMidnight = true;
    setDisplayMode();
};

$scope.continueClicked = function() {

	$scope.startProcessEnabled = false;
	$rootScope.$broadcast('showLoader');
// explicitly handled error callback to set $scope.startProcessEnabled
	var startProcessFailure = function(data) {
		$rootScope.$broadcast('hideLoader');
		$scope.startProcess = false;
		$scope.errorMessage = data;
		$scope.startProcessEnabled = true;
        setDisplayMode();
	};
	var startProcessSuccess = function(data) {
		$rootScope.$broadcast('hideLoader');
		$rootScope.isBussinessDateChanging = true;
		ngDialog.close();
	};

	$scope.invokeApi(RVEndOfDayModalSrv.startProcess, {}, startProcessSuccess, startProcessFailure);
};

    var setDisplayMode = function() {
        // NOTE : This method would return to the user any one of these 4 states
        // 	1.	NOTIFY_TIME
        //	2.	PROMPT_LOGIN
        //	3.	PROMPT_CONFIRMATION
        //	4.	ALERT_START

        var displayMode = '';

        if (!$scope.isTimePastMidnight) {
            displayMode = 'NOTIFY_TIME';
        } else if (!$scope.isLoggedIn) {
            displayMode = 'PROMPT_LOGIN';
        } else {
            displayMode = !$scope.startProcess ? 'PROMPT_CONFIRMATION' : 'ALERT_START';
        }

        $scope.displayMode = displayMode;
    };

    (function() {
        setDisplayMode();
        $scope.userPassword = '';
    })();

}]);