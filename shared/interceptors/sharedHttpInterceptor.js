// specifically written for this application
// adding an OWS check Interceptor here and business date change
// but should be moved to higher up above in root level
angular.module('sharedHttpInterceptor', []).
    config(function($provide) {
        $provide.decorator('$http', function($delegate, $q) {
            var pendingRequests = {};
            var $http = $delegate;

            /**
             * Generates a hash of the API call so that duplicates can be identified
             * @param {string} str configuration of the http call as string
             * @returns {string} hash
             */
            function hash(str) {
                var h = 0,
                    size = str.length;

                if (size === 0) {
                    return h;
                }
                for (var i = 0, n; i < size; ++i) {
                    n = str.charCodeAt(i);
                    h = ((h << 5) - h) + n;
                    h = h & h;
                }
                return h >>> 0;
            }

            /**
             * Helper to generate a unique identifier for a request
             */
            function getRequestIdentifier(config) {
                var str = config.method + config.url;

                if (config.params && typeof config.params === 'object') {
                    str += angular.toJson(config.params);
                }
                if (config.data && typeof config.data === 'object') {
                    str += angular.toJson(config.data);
                }
                return hash(str);
            }

            /**
             *
             * @param config
             */
            function log(config, attempts) {
                var style = 'background: orange; color: white; display: block;',
                    request = config.method + ': ' + config.url;

                // using console.warn as $log provider won't be ready by the time this configuration runs
                // https://stackoverflow.com/questions/28620927/angularjs-provider-dependency-injection-using-log-in-provider
                console.warn('%c' + '[WARN_DUP_REQ][' + attempts + ']>>> ' + request, style);

                if (window['dataLayer']) {
                    window['dataLayer'].push({
                        event: 'sntDuplicateRequest',
                        attributes: {
                            request: config.method + ': ' + config.url,
                            count: attempts
                        }
                    });
                }
            }

            /**
             * Modified $http service
             */
            function $duplicateRequestsFilter(config) {
                // Get unique request identifier
                var identifier = getRequestIdentifier(config);

                // Ignore for this request?
                if (config.ignoreDuplicateRequest) {
                    return $http(config);
                }

                // Check if such a request is pending already
                if (pendingRequests[identifier]) {

                    pendingRequests[identifier].attempts = pendingRequests[identifier].attempts || 0;
                    // increment the attempts count
                    pendingRequests[identifier].attempts++;
                    log(config, pendingRequests[identifier].attempts);

                    if (config.rejectDuplicateRequest) {
                        return $q.reject({
                            data: '',
                            headers: {},
                            status: config.rejectDuplicateStatusCode || 400,
                            config: config
                        });
                    }
                    return pendingRequests[identifier];
                }

                // Create promise using $http and make sure it's reset when resolved
                pendingRequests[identifier] = $http(config);

                pendingRequests[identifier].finally(function() {
                    delete pendingRequests[identifier];
                });

                // Return promise
                return pendingRequests[identifier];
            }

            // Map rest of methods
            Object.keys($http).
                filter(function(key) {
                    return (typeof $http[key] === 'function');
                }).
                forEach(function(key) {
                    $duplicateRequestsFilter[key] = $http[key];
                });

            return $duplicateRequestsFilter;
        });
    });

angular.module('sharedHttpInterceptor').service('sntAuthorizationSrv', [
    '$q',
    '$log',
    function($q, $log) {

        var service = this,
            uuid = null;

        service.status = function(log) {
            $log.info(log || 'property! ' + service.getProperty());
        };

        service.setProperty = function(currentUuid) {
            uuid = currentUuid;
        };

        service.unsetProperty = function() {
            uuid = null;
        };

        service.getProperty = function() {
            return uuid;
        };
    }
]);

angular.module('sharedHttpInterceptor').factory('sharedHttpInterceptor', [
    '$rootScope',
    '$q',
    '$window',
    'sntAuthorizationSrv',
    function($rootScope, $q, $window, sntAuthorizationSrv) {

        return {
            request: function(config) {
                var hotel = sntAuthorizationSrv.getProperty(),
                    jwt = $window.localStorage.getItem('jwt');

                if (hotel) {
                    config.headers['Hotel-UUID'] = hotel;
                }

                if (jwt) {
                    config.headers['Auth-Token'] = jwt;
                }
                return config;
            },
            response: function(response) {
                const jwt = response.headers('Auth-Token');

                // if manual bussiness date change is in progress alert user.
                if (response.data.is_eod_in_progress && !$rootScope.isCurrentUserChangingBussinessDate) {
                    $rootScope.$emit('bussinessDateChangeInProgress');
                }
                if (response.data.hasOwnProperty('is_eod_in_progress')) {
                    $rootScope.isEodRunning = response.data.is_eod_in_progress;
                }
                if (response.data.hasOwnProperty('is_eod_failed')) {
                    $rootScope.isEodProcessFailed = response.data.is_eod_failed;
                }
                if (response.data.hasOwnProperty('is_eod_process_running')) {
                    $rootScope.isEodProcessRunning = response.data.is_eod_process_running;
                }

                if (response.headers('Business-Date') && $rootScope.businessDate && (response.headers('Business-Date') !== $rootScope.businessDate)) {
                    $rootScope.showBussinessDateChangedPopup && $rootScope.showBussinessDateChangedPopup();
                }

                if (jwt) {
                    $window.localStorage.setItem('jwt', jwt);
                }

                return response || $q.when(response);
            },
            responseError: function(rejection) {
                rejection.handledCodes = rejection.handledCodes || [];

                if (rejection.status === 401 && !rejection.handledCodes.includes(401)) { // 401- Unauthorized
                    // CICO-61147
                    $window.localStorage.removeItem('jwt');
                    // so lets redirect to login page
                    $window.location.href = '/logout';
                }
                if (rejection.status === 520 && rejection.config.url !== '/admin/test_pms_connection') {
                    $rootScope.showOWSError && $rootScope.showOWSError();
                }
                /** as per CICO-9089 **/
                if (rejection.status === 503) {
                    $window.location.href = '/500';
                }
                /**
                 * CICO-48362
                 * Both 502 and 504 should be handled as time-out
                 */
                if (rejection.status === 502 || rejection.status === 504) {
                    $rootScope.showTimeoutError && $rootScope.showTimeoutError();
                    return;
                }
                /*
                 we can't handle 500, 501 since we need to show custom error messages on that scope.

                 **/
                return $q.reject(rejection);
            }
        };
    }
]);
