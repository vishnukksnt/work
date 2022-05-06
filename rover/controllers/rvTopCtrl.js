angular.module('sntRover').controller('topController',
    [
        '$state',
        'sntAuthorizationSrv',
        '$rootScope',
        '$location',
        '$stateParams',
        '$scope',
        '$window',
        '$log',
        'RVHotelDetailsSrv',
        '$timeout',
        '$transitions',
        'sntActivity',
        function ($state, sntAuthorizationSrv, $rootScope, $location, $stateParams, $scope, $window, $log,
                  RVHotelDetailsSrv, $timeout, $transitions, sntActivity) {

            BaseCtrl.call(this, $scope);

            var routeChange = function (event) {
                event.preventDefault();
                return false;
            };

            var setPropertyAndNavigate = function (uuid) {
                sntAuthorizationSrv.setProperty(uuid);
                // Notify the session timeout directive, when the hotel is set
                $rootScope.$broadcast('SET_HOTEL');
                // Initiate listener after first URL change
                $transitions.onFinish({}, function (transition) {
                    if (transition.from().name === 'top') {
                        sntActivity.stop('STATE_CHANGE_FROM_PARAM');
                        // NOTE: This listener is not removed on $destroy on purpose!
                        $window.history.pushState("initial", "Showing Dashboard", "/staff/h/" + uuid);
                        $rootScope.$on('$locationChangeStart', routeChange);
                    }
                });

                if ($stateParams.state) {
                    var params = ($stateParams.params && angular.fromJson(decodeURI($stateParams.params))) || {};

                    sntActivity.start('STATE_CHANGE_FROM_PARAM');
                    $state.go($stateParams.state.replace(/-/g, '.'), params);
                } else {
                    $state.go('rover.dashboard');
                }
            };

            (function () {
                if ($stateParams.uuid) {
                    setPropertyAndNavigate($stateParams.uuid);
                } else {
                    $log.info('setPropertyAndNavigate');
                    $scope.callAPI(RVHotelDetailsSrv.getDefaultUUID, {
                        successCallBack: function (uuid) {
                            if (uuid) {
                                setPropertyAndNavigate(uuid);
                            } else {
                                var redirUrl = '/logout/';

                                $timeout(function () {
                                    $window.location.href = redirUrl;
                                }, 300);
                            }
                        },
                        failureCallBack: function (err) {
                            $log.info(err);
                        }
                    });
                }
            })();
        }
    ]
);
