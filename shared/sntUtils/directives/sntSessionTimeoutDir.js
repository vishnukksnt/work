angular.module('snt.utils').directive('sntSessionTimeout', function () {

    var sessionTimeoutCtrl = [
        '$scope',
        'sessionTimeoutHandlerSrv', 
        'ngDialog', 
        'sntSharedLoginSrv',
        '$rootScope',
        'sntActivity',
        '$timeout',
        'sntAuthorizationSrv',
        '$window',        
        function ($scope, sessionTimeoutHandlerSrv, ngDialog, sntSharedLoginSrv, $rootScope, sntActivity, $timeout, sntAuthorizationSrv, $window) {
            var sessionTimeoutDialog;

            $scope.loginData = {};
            var ACCOUNT_LOCKED_STR = 'account has been locked';

            
            /**
             * Show session timeout popup
             */
            var showSessionTimeoutPopup = function() {
                    $rootScope.$broadcast('resetLoader');
                    // Remove the token, when the session times out at the client side rather than when an API call is triggered
                    $window.localStorage.removeItem('jwt');

                    if (!sessionTimeoutDialog) {
                       $scope.loginData.autoLogoutDelay = Math.floor((sessionTimeoutHandlerSrv.getAutoLogoutDelay() / 1000 / 60) << 0);

                       sessionTimeoutDialog = ngDialog.open({
                            template: '/assets/partials/rvExtendSessionModal.html',
                            className: 'ngdialog-theme-default',
                            scope: $scope,
                            closeByEscape: false,
                            closeByDocument: false
                        }); 
                    }
                    
                };

            /**
             * Continue session by entering the password 
             */
            $scope.continueSession = function() {
                var user = {
                    email: sessionTimeoutHandlerSrv.getLoginEmail(),
                    password: $scope.loginData.password
                };

                $scope.hasError = false;
                $scope.errorMessage = '';
                sntActivity.start('API_REQ');
                sntSharedLoginSrv.login(user).then(function(response) {
                    if (response.status === 'success') {
                        ngDialog.close(sessionTimeoutDialog.id);
                        sessionTimeoutDialog = null;
                        $scope.loginData = {}; 
                    }
                    sntActivity.stop('API_REQ');
                }, function (error) {
                    $scope.hasError = error.status === 'failure';
                    $scope.errorMessage = _.isArray(error.errors) ? error.errors[0] : '';

                    $scope.loginData.password = '';
                    sntActivity.stop('API_REQ');

                    // This is a work around to identify the account locked scenario.
                    // Once the api provides the flag for account locked, we can use that to check this particular case
                    if ($scope.errorMessage && $scope.errorMessage.indexOf(ACCOUNT_LOCKED_STR) > -1) {
                        $timeout(function () {
                            $window.location.href = '/logout';
                        }, 500);
                        
                    }
                });
            };

            /**
             * Implements the logout functionality
             */
            $scope.logout = function () {
                sntActivity.start('API_REQ');
                sntSharedLoginSrv.logout().finally(function() {
                    $timeout(function () {
                        if (sessionTimeoutHandlerSrv.getWorker()) {
                            sessionTimeoutHandlerSrv.stopTimer();
                        }
                        sntActivity.stop('API_REQ');
                        $window.location.href = '/logout';
                    });
                });

            };

            /**
             * Fetch the login details 
             */
            var fetchLoginDetails = function() {
                var onLoginFetchSuccess = function (response) {
                    if (response.auto_logout_delay) {
                        sessionTimeoutHandlerSrv.setAutoLogoutDelay(response.auto_logout_delay * 1000);
                    }
                    sessionTimeoutHandlerSrv.setLoginEmail(response.login);

                    setUpEventListeners();

                };

                if (!sessionTimeoutHandlerSrv.getAutoLogoutDelay()) {
                    sntSharedLoginSrv.getSessionDetails().then(onLoginFetchSuccess); 
                }
                
            };

            $scope.$on('CLOSE_SESSION_TIMEOUT_POPUP', function() {
                if (sessionTimeoutDialog) {
                    sessionTimeoutDialog.close();
                }
            });

            $scope.$on('SET_HOTEL', function() {
                fetchLoginDetails();
            });

            /**
             * Refresh the token when its about to expire
             */
            var refreshToken = function () {
                sntSharedLoginSrv.refreshToken().then(function() {
                });
            };

            // Get the idle time in seconds
            var getIdleTimeSecs = function () {
                var idlTimeSecs = 0;

                if ($( document ).idleTimer("isIdle")) {
                    idlTimeSecs = Math.floor($(document).idleTimer("getElapsedTime") / 1000);
                }
                
                return idlTimeSecs;
            };

            /**
             * Check and validate the token expiry based on browser idle time
             */
            var checkAndValidateToken = function (isAPItokenExpired) {
                var autoLogoutDelaySecs = Math.floor(sessionTimeoutHandlerSrv.getAutoLogoutDelay() / 1000);
                                
                // We have added 30s here because the timer will be set after 30s when its idle as configured
                // 15 secs have been deducted as the the check will be done 15s prior to token expiry
                if ( (getIdleTimeSecs() + 30 ) > (autoLogoutDelaySecs - 15) || isAPItokenExpired) {
                    showSessionTimeoutPopup();
                } else {
                    refreshToken();
                }

            };

            /**
             * Set up the event listeners to track the various browser events to identify browser inactivity 
             */
            var setUpEventListeners = function () {

                $(document).idleTimer({
                    timeout: 30000,
                    timerSyncId: 'sntIdleTimer'
                });

                // This will be invoked when the user is idle for 30s
                $(document).on( 'idle.idleTimer', function() {
                    // This should be called only if the dialog is not already shown
                    if (!sessionTimeoutDialog) {
                        refreshToken();
                    }
                });

                $window.document.addEventListener('wheel', function() {
                    $(document).idleTimer('reset');
                }, true);
                

            };

            var init = function () {

                if (!sessionTimeoutHandlerSrv.getWorker()) {
                    sessionTimeoutHandlerSrv.initWorker();
                    $timeout(function () {
                        sessionTimeoutHandlerSrv.getWorker().addEventListener('message', function(event) {
                            var data = event.data;
        
                            switch (data.cmd) {
                                case 'SHOW_TIMEOUT_POPUP':
                                    checkAndValidateToken(data.isApiTokenExpired);
                                    break;

                                default:
        
                            }
                            
                        });
    
                    }, 500);
                }
            };

            init();

    }];

    return {
        restrict: 'EA',
        require: '^ngModel',
        controller: sessionTimeoutCtrl
    };

});
