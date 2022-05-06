angular.module('houseEventsModule').service('RVHouseEventsSrv', [
    '$q',
    'rvBaseWebSrvV2',
    function($q, BaseWebSrvV2) {
            var that = this,
                eventTypes;

            /**
             * Get event types
             * @return {Promise} promise
             */
            that.getEventTypes = function () {
                var deferred = $q.defer(),        
                    url = '/api/house_event_types';

                if (eventTypes) {
                    deferred.resolve(that.eventTypes);
                } else {
                    BaseWebSrvV2.getJSON(url).then(function (data) {
                        that.eventTypes = data.results;
                        deferred.resolve(that.eventTypes);
                    }, function (data) {
                        deferred.reject(data);
                    });
                }
                return deferred.promise;
            };

            /**
             * Add event
             * @param {Object} params - event data
             * @return {Promise} promise
             */
            that.addEvent = function (params) {
                var deferred = $q.defer(),
                    url = '/api/house_events';
        
                BaseWebSrvV2.postJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function(error) {
                    deferred.reject(error);
                });
            
                return deferred.promise;
            };

            /**
             * Update event
             * @param {Object} params updated event object
             * @return {Promise} promise
             */
            that.updateEvent = function (params) {
                var deferred = $q.defer(),
                    url = '/api/house_events/' + params.id;
        
                BaseWebSrvV2.putJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function(error) {
                    deferred.reject(error);
                });
            
                return deferred.promise;
            };

            /**
             * Delete event
             * @param {Object} params contains event id
             * @return {Promise} promise
             */
            that.deleteEvent = function (params) {
                var deferred = $q.defer(),
                    url = '/api/house_events/' + params.id;
        
                BaseWebSrvV2.deleteJSON(url).then(function (data) {
                    deferred.resolve(data);
                }, function(error) {
                    deferred.reject(error);
                });
            
                return deferred.promise;
            };

            /**
             * Search events
             * @param {Object} params - search data
             * @return {Promise} promise
             */
            that.searchEvents = function (params) {
                var deferred = $q.defer(),
                    url = '/api/house_events/search';

                BaseWebSrvV2.getJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function(error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

    }]);
