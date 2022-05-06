angular.module('snt.utils')
    .service('sntLoadScriptSrv', ['$q', '$timeout',
        function ($q, $timeout) {
            var service = this,
                loadedScripts = {},
                GAPI_URL = 'https://apis.google.com/js/api.js';

            service.loadScript = function (url) {
                var deferred = $q.defer();

                if (loadedScripts[url]) {
                    $timeout(function () {
                        deferred.resolve();
                    }, 100);
                } else {
                    $.getScript(url)
                        .done(function () {
                            loadedScripts[url] = true;
                            deferred.resolve();
                        })
                        .fail(function (jqxhr, settings, exception) {
                            deferred.reject(exception);
                        });
                }
                
                return deferred.promise;
            };

            // Get google javascript api url
            service.getGAPIUrl = function () {
                return GAPI_URL;
            };

        }]);