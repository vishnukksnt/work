angular.module('SocialLobbyModule', [])
    .config(function($stateProvider, $urlRouterProvider, $translateProvider) {

        $stateProvider.state('rover.socialLobby', {
            url: '/socialLobby',
            abstract: false,
            templateUrl: '/assets/partials/socialLobby/rvSLPosts.html',
            controller: 'RVSocialLobbyCtrl',
            lazyLoad: function ($transition$) {
                return $transition$.injector().get('jsMappings').
                    fetchAssets(['sociallobby']);
            }
        });

    });