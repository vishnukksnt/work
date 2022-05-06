'use strict';

angular.module('snt.utils').service('Toggles', ['$q', 'sntBaseWebSrv', function ($q, sntBaseWebSrv) {
    var service = this,
        features;

    service.initialize = function () {
        var deferred = $q.defer();

        sntBaseWebSrv.getJSON('/api/features/list').then(function (list) {
            features = list;
            deferred.resolve(list);
        });
        return deferred.promise;
    };

    service.isEnabled = function (featureName) {
        if (!features) {
            throw new Error('Attempt to access feature toggles without initializing');
        }

        return features[featureName] === true || angular.isUndefined(features[featureName]);
    };
}]);