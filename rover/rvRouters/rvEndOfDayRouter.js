angular.module('EndOfDayModule', [])
    .config(function($stateProvider, $urlRouterProvider, $translateProvider) {

        $stateProvider.state('rover.endOfDay', {
            abstract: true,
            url: '/endofDay',
            templateUrl: '/assets/partials/endOfDay/rvEndofDay.html',
            controller: 'RVEndOfDayController',
            resolve: {
                jsAssets: function(jsMappings) {
                    return jsMappings.fetchAssets(['endofday']);
                }
            }
        });

        $stateProvider.state('rover.endOfDay.starteod', {
            url: '/starteod',
            templateUrl: '/assets/partials/endOfDay/rvEndOfDayProcess.html',
            controller: 'RVEndOfDayProcessController'
        });

    });
