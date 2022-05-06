angular.module('sntActivityIndicator', [])
    .directive('activityIndicator',
        function () {
            return {
                restrict : 'E',
                template: '<div ng-show="hasLoader" id="loading" class="no-print"><div id="loading-spinner" ></div></div> ' +
                '<div ng-show="showTerminalActivity" id="loading">' +
                '    <div id="six-payment-loader">' +
                '        <div class="centeralign alert-box">' +
                '            WAITING FOR PAYMENT COMPLETION' +
                '        </div>' +
                '        <div class="waiting-payment">&nbsp;</div>' +
                '    </div>' +
                '</div>',
                controller: ['$log', '$scope', '$timeout', '$rootScope', 'sntActivity',
                    function ($log, $scope, $timeout, $rootScope, sntActivity) {
                        var stats = {
                            showLoader: 0,
                            hideLoader: 0
                        };

                        $scope.$on('resetLoader', function () {
                            sntActivity.resetLoader();
                        });

                        $scope.$on('showLoader', function () {
                            stats.showLoader++;
                            sntActivity.handleLegacyShow();
                        });

                        $scope.$on('hideLoader', function () {
                            $timeout(function () {
                                sntActivity.handleLegacyHide();
                            }, 100);
                            stats.hideLoader++;
                        });
                    }]
            };
        }
    )
    .service('sntActivity', ['$log', '$rootScope', '$timeout',
        function ($log, $rootScope, $timeout) {
            var service = this,
                activities = [],
                updateIndicator = function () {
                    $timeout(function () {
                        $rootScope.hasLoader = activities.length;
                    });
                };

            service.start = function (activity) {
                // Preventing the addition of same state multiple times
                if (_.indexOf(activities, activity) === -1) {
                    activities.push(activity);
                } else {
                    $log.error('Duplicate Activity');
                }
                updateIndicator();
            };

            service.stop = function (activity) {
                var index = activities.indexOf(activity);

                if (activities.length && index > -1) {
                    activities.splice(index, 1);
                    updateIndicator();
                } else if (index === -1) {
                    $log.warn('trying to stop a non-existent activity...', activity);
                }
            };

            service.toggleEMVIndicator = function () {
                $rootScope.showTerminalActivity = !$rootScope.showTerminalActivity;
            };

            service.handleLegacyHide = function () {
                updateIndicator();
            };

            service.resetLoader = function () {
                activities = [];
                updateIndicator();
            };

            service.handleLegacyShow = function () {
                $rootScope.hasLoader = true;
            };

        }
    ]);
