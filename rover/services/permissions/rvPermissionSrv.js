/**
 * Service used to deal with various permissions in rover app
 */

angular.module('sntRover').service('rvPermissionSrv',
    ['$http', '$q', 'rvBaseWebSrvV2', '$window', 'rvAngularIframeHelperSrv',
        function ($http, $q, rvBaseWebSrvV2, $window, rvAngularIframeHelperSrv) {

            // variable for storing the permissions, will be a dictionary (object)
            var roverPermissions = null;

            /**
             * method to fetch permissions
             * will assign the permissions to 'roverPermissions'
             */
            this.fetchRoverPermissions = function () {
                var deferred = $q.defer(),

                    url = '/api/permissions';

                if (!roverPermissions) {
                    rvBaseWebSrvV2.getJSON(url).then(function (data) {
                        roverPermissions = data.permissions;
                        rvAngularIframeHelperSrv.setHotelInitialData('PERMISSIONS', roverPermissions);
                        deferred.resolve(data);
                    }, function (data) {
                        deferred.reject(data);
                    });
                } else {
                    deferred.resolve(roverPermissions); 
                }
                
                return deferred.promise;
            };

            this.checkSession = function (token) {
                var jwt = token || $window.localStorage.getItem('jwt'),
                    url = '/login/validate',
                    deferred = $q.defer();

                if (token) {
                    $window.localStorage.setItem('jwt', token);
                }

                if (jwt) {
                    $http.get(url, {'Auth-Token': token}).then(function (response) {
                        deferred.resolve(response.data);
                    }, function () {
                        $window.localStorage.removeItem('jwt');
                        deferred.resolve('');
                    });
                } else {
                    deferred.resolve('');
                }
                return deferred.promise;
            };

            /**
             * method exposed for others to check permissions
             * if not found in the list, will return false
             * will return true or false
             */
            this.getPermissionValue = function (permissionString) {
                var permission = _.findWhere(roverPermissions, {code: permissionString});

                if (permission) {
                    return permission.value;
                }
                return false;
            };


        }
    ]);
