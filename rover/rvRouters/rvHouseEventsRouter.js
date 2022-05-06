angular.module('houseEventsModule', []).config(function($stateProvider) {
    
          $stateProvider.state('rover.houseEvents', {
              url: '/events',
              templateUrl: '/assets/partials/houseEvents/rvHouseEvents.html',
              controller: 'houseEventsController',
              resolve: {
                  eventTypes: function (RVHouseEventsSrv) {
                    return RVHouseEventsSrv.getEventTypes();
                  }
              },
              lazyLoad: function($transition$) {
                return $transition$.injector().get('jsMappings').
                    fetchAssets(['rover.houseEvents', 'directives']);
              }              
          });
          
  });
  