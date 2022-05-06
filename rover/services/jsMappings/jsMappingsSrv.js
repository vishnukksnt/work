angular.module('sntRover').service('jsMappings',
    ['$q', 'rvBaseWebSrvV2', '$ocLazyLoad', '$log',
        function($q, rvBaseWebSrvV2, $ocLazyLoad, $log) {

            var mappingList = null,
                paymentMappingList = undefined,
                service = this;

            /**
             * [fetchMappingList description]
             * @return {[type]} [description]
             */
            this.fetchMappingList = function() {
                var deferred = $q.defer();
                // if you are updating the url, make sure that same in rover's gulp task
                var url = '/ui/pms-ui/asset_list/____generatedStateJsMappings/____generatedrover/____generatedroverStateJsMappings.json?time=' + new Date();

                rvBaseWebSrvV2.getJSON(url).then(function(data) {
                    mappingList = data;
                    deferred.resolve(data);
                }, function(error) {
                    deferred.reject(error);
                });
                return deferred.promise;
            };

            /**
             * This method runs through the assets and injects using $ocLazyLoad provider
             * @param keys
             * @param modules_to_inject
             * @param deferred
             */
            function injectAssets(keys, modules_to_inject, deferred) {
                for (var i = 0, promises = []; i < keys.length; i++) {
                    promises.push($ocLazyLoad.load({
                        serie: true,
                        files: mappingList[keys[i]]
                    }));
                }

                $q.all(promises).then(function () {
                    if (typeof modules_to_inject !== 'undefined') {
                        $ocLazyLoad.inject(modules_to_inject);
                    }

                    deferred.resolve(true);
                });
            }

            /**
             * [fetchAssetList description]
             * @param  {array} keys               [description]
             * @param  {[type]} modules_to_inject [description]
             * @return {[type]}                   [description]
             */
            this.fetchAssets = function (keys, modules_to_inject) {
                var deferred = $q.defer();

                if (mappingList) {
                    injectAssets(keys, modules_to_inject, deferred);
                } else {
                    service.fetchMappingList().then(function () {
                        injectAssets(keys, modules_to_inject, deferred);
                    }, function () {
                        $log.error('something wrong, mapping list is not filled yet, please ensure that flow/variables are correct');
                        deferred.reject(false);
                    });
                }

                return deferred.promise;
            };


            this.loadPaymentMapping = function() {
                var locMappingFile,
                    deferred = $q.defer();

                if (!!paymentMappingList) {
                    deferred.resolve(paymentMappingList);
                } else {
                    locMappingFile = "/ui/pms-ui/asset_list/____generatedgatewayJsMappings/____generatedpayment/____" +
                        "generatedpaymentTemplateJsMappings.json?time=" + new Date();

                    rvBaseWebSrvV2.getJSON(locMappingFile).then(function(data) {
                        paymentMappingList = data;
                        deferred.resolve(paymentMappingList);
                    }, function() {
                        $log.error('something wrong, make sure the payment mapping file is in exact place or name is correct');
                        deferred.reject('something wrong, make sure the payment mapping file is in exact place or name is correct');
                    });
                }

                return deferred.promise;
            };

            /**
             * [loadPaymentModule description]
             * @param  {array} keys               [description]
             * @param  {[type]} modules_to_inject [description]
             * @return {[type]}                   [description]
             */
            this.loadPaymentModule = function(keys) {
                var deferred = $q.defer(),
                    promises = [],
                    i, j;

                if (!paymentMappingList) {
                    $log.error('something wrong, mapping list is not filled yet, please ensure that loadPaymentMapping is called first');
                    return;
                }

                if (!keys) {
                    keys = ['common'];
                }

                for (i = 0, j = keys.length; i < j; i++) {
                    promises.push($ocLazyLoad.load({
                        serie: true,
                        files: paymentMappingList.js[keys[i]]
                    }));
                }

                $q.all(promises).then(function() {
                    return $ocLazyLoad.load({
                        serie: true,
                        files: paymentMappingList.template,
                        rerun: true
                    }).then(function() {
                        $ocLazyLoad.inject(['sntPayConfig', 'sntPay']);
                        deferred.resolve();
                    }, function(err) {
                        $log.log('Error on loading Payment Module', err);
                    });

                }, function(err) {
                    $log.error('Error on loading Payment Module', err);

                });

                return deferred.promise;

            };

        }
    ]
);
