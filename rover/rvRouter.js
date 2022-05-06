angular.module('sntRover').config([
    '$stateProvider',
    '$urlRouterProvider',
    '$translateProvider',
    function ($stateProvider, $urlRouterProvider, $translateProvider) {
        var currentTime = new Date();

        $translateProvider.useStaticFilesLoader({
            prefix: '/ui/pms-ui/rvLocales/',
            suffix: '.json?time=' + currentTime
        });
        $translateProvider.preferredLanguage('EN');
        $translateProvider.fallbackLanguage('EN');
        // default state
        $urlRouterProvider.otherwise('/auth');

        $stateProvider.state('auth', {
            url: '/auth?token&dest',
            onEnter: [
                '$window', '$state', 'session', '$timeout', '$stateParams',
                function ($window, $state, session, $timeout, $stateParams) {
                    if ($stateParams.dest) {
                        $state.go('top', {
                            uuid: $stateParams.dest
                        });
                    } else if (session.is_sp_admin) {
                        $timeout(function () {
                            $window.location.replace("/property");
                        }, 300);
                    } else {
                        $state.go('top', {
                            uuid: ''
                        });
                    }
                }
            ],
            resolve: {
                session: ['rvPermissionSrv', '$stateParams',
                    function (rvPermissionSrv, $stateParams) {
                        return rvPermissionSrv.checkSession($stateParams.token);
                    }
                ]
            }
        });

        /*
         * state added to show single url throughout the app
         */
        $stateProvider.state('top', {
            url: '/staff/h/:uuid?state&params',
            controller: 'topController'
        });

        $stateProvider.state('rover', {
            abstract: true,
            url: '/',
            templateUrl: '/assets/partials/rvRover.html',
            controller: 'roverController',
            resolve: {
                hotelDetails: function (RVHotelDetailsSrv) {
                    return RVHotelDetailsSrv.fetchHotelDetails();
                },
                userInfoDetails: function (RVDashboardSrv) {
                    return RVDashboardSrv.fetchUserInfo();
                },
                permissions: function (rvPermissionSrv) {
                    return rvPermissionSrv.fetchRoverPermissions();
                },
                features: function (Toggles) {
                    return Toggles.initialize();
                }
            },
            lazyLoad: function ($transition$) {
                return $transition$.injector().get('jsMappings')
                    .fetchMappingList();
            }
        });

    }
]);
