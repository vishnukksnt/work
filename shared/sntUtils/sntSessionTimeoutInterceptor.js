angular.module('snt.utils').service('sessionTimeoutHandlerSrv', [ 
    '$timeout',
    function ($timeout) {
        var service = this,
            worker,        
            sessionTimeout,
            loginEmail;
           
        service.initWorker = function () {
            worker = new Worker('/ui/pms-ui/shared/sntUtils/workers/sessionTimeoutWorker.js');
            $timeout(function () {
                worker.postMessage('init');
            }, 500);
            
        };
    
        service.getWorker = function() {
            return worker;
        };
    
        service.resetTimer = function () {
            worker.postMessage(
                {
                    cmd: 'START_TIMER', 
                    interval: sessionTimeout
                }
            ); 
        };
    
        service.showSessionTimeoutPopup = function(isApiTokenExpired) {
            worker.postMessage(
                {
                    cmd: 'SHOW_TIMEOUT_POPUP',
                    isApiTokenExpired: isApiTokenExpired
                }
            );
            
        };

        service.hideLoader = function() {
            worker.postMessage(
                {
                    cmd: 'HIDE_LOADER'
                }
            );
        };

        service.stopTimer = function () {
            worker.postMessage(
                {
                    cmd: 'STOP_TIMER'
                }
            );
        };

        service.setAutoLogoutDelay = function (delay) {
            sessionTimeout = delay;
        };

        service.getAutoLogoutDelay = function () {
            return sessionTimeout;
        };

        service.setLoginEmail = function (email) {
            loginEmail = email;
        };

        service.getLoginEmail = function () {
            return loginEmail;
        };
    
}]);

angular.module('snt.utils').service('sntSharedLoginSrv', [
    '$q',     
    'sntBaseWebSrv',
    function ($q, sntBaseWebSrv ) {
        var service = this, 
            loginDetails;            
    
        service.login = function (loginData) {
            var deferred = $q.defer();
    
            sntBaseWebSrv.postJSON('/login/submit', loginData).then(function (response) {
                if (response.status === "success") {
                    deferred.resolve(response);
                } else {
                    // please note the type of error expecting is array
                    deferred.reject(response);
                }
            }, function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        };

        /**
         * Handles logout
         */
        service.logout = function () {
            return sntBaseWebSrv.getJSON('/logout');
        };

        /**
         * Get the details of the current session
         */
        service.getSessionDetails = function () {
            var deferred = $q.defer(),
                url = '/api/users/login_details';

            if (loginDetails) {
                deferred.resolve(loginDetails);
            } else {
                sntBaseWebSrv.getJSON(url).then(function (response) {
                    loginDetails = response;
                    deferred.resolve(response);
                });
            }

            return deferred.promise;
        };

        /**
         * Refresh the JWT token with a new one
         */
        service.refreshToken = function () {
            var deferred = $q.defer(),
                url = '/login/validate';
            
            sntBaseWebSrv.getJSON(url).then(function (response) {
                deferred.resolve(response);
            });

            return deferred.promise;
        };
    
}]);

angular.module('snt.utils').factory('sharedSessionTimeoutInterceptor', [
    '$q',
    '$window',
    'sessionTimeoutHandlerSrv',
    '$injector',
    function($q, $window, sessionTimeoutHandlerSrv, $injector) {
        
        return {
            request: function(config) {
                return config;
            },
            response: function(response) {
                if (response.headers('Auth-Token') && sessionTimeoutHandlerSrv.getWorker() && sessionTimeoutHandlerSrv.getAutoLogoutDelay()) {
                    sessionTimeoutHandlerSrv.resetTimer();
                }
                return response;
            },
            responseError: function(rejection) {
                rejection.handledCodes = rejection.handledCodes || [];
                var currentState = $injector.get('$state');

                // This state check is done inorder to exclude this behaviour, when the browser is refreshed from both admin and rover, also logout action
                if (rejection.status === 401 && 
                        currentState.current.name !== 'top' &&
                        currentState.current.name !== '' && 
                        rejection.config.url !== '/logout' ) { 
                    $window.localStorage.removeItem('jwt');
                    sessionTimeoutHandlerSrv.showSessionTimeoutPopup(true);
                    rejection.handledCodes.push(401);
                }
                
                return $q.reject(rejection);
            }
        };
    }
]);
