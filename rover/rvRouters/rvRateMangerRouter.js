angular.module('rateManagerModule', [])
    .config(function ($stateProvider, $urlRouterProvider, $translateProvider) {
        $stateProvider.state('rover.rateManager', {
            url: '/ratemanager/',
            templateUrl: '/assets/partials/rateManager_/rvRateManagerRoot.html',
            controller: 'rvRateManagerCtrl_',
            resolve: {
                restrictionTypes: function (rvRateManagerCoreSrv) {
                    return rvRateManagerCoreSrv.fetchRestrictionTypes();
                }
            },
            lazyLoad: function ($transition$) {
                return $transition$.injector().get('jsMappings')
                    .fetchAssets(['react.files', 'directives', 'redux.files', 'rover.rateManager'], ['react']);
            }
        });

    });
