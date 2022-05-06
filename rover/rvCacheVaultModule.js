angular.module('cacheVaultModule', [])
    .factory('$vault', ['$cacheFactory', '$timeout', function($cacheFactory, $timeout) {
        var factory = {},
            $_store = $cacheFactory( 'cache-vault' ),
            setOnceTracker = [];

        // will only accept numbers and strings
        factory.set = function(key, value) {
            if ( 'number' === typeof value || 'string' === typeof value ) {
                $_store.put( key, value );
            } else {
                console.warn( 'Not allowed to save "' + key + '" with typeof "' + typeof value + '" type into cacheVault!' );
            }
        };

        factory.setUpto = function(key, value, min) {
            var min = min || 3;
            // $_store.put( key, value );

            factory.set(key, value);
            $timeout(function() {
                $_store.remove(key);
            }, 1000 * 60 * min);
        };

        factory.setOnce = function(key, value) {
            var index = _.indexOf(setOnceTracker, key);

            if ( index < 0 ) {
                setOnceTracker.push(key);
            }
            
            factory.set(key, value);
        };

        factory.get = function(key) {
            var index = _.indexOf(setOnceTracker, key),
                ret = !!$_store.get( key ) ? $_store.get( key ) : "";

            if ( index > -1 ) {
                setOnceTracker = [].concat(
                    setOnceTracker.slice(0, index),
                    setOnceTracker.slice(index + 1)
                );

                factory.remove(key);
            }

            return ret;
        };

        factory.remove = function(key) {
            $_store.remove( key );
        };

        return factory;
    }]);