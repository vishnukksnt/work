angular.module('sntRover').controller('rvDeviceStatusCtrl', ['$scope', 'ngDialog', '$log', 'sntActivity', 'rvDeviceStatusSrv', 'rvUtilSrv', '$timeout',
    function ($scope, ngDialog, $log, sntActivity, rvDeviceStatusSrv, rvUtilSrv, $timeout) {
        var actionResponse = {};
        var callBacks = {
            'successCallBack': function (response) {
                actionResponse = response;
                $scope.screenMode = 'DISPLAY_MESSAGE';
                ngDialog.open({
                    template: '/assets/partials/settings/rvDeviceMessage.html',
                    scope: $scope,
                    className: '',
                    data: angular.toJson(response)
                });
                sntActivity.stop('RUN_DEVICE_ACTION');
            },
            'failureCallBack': function (error) {
                $log.info('Device action failed with', error.RVErrorCode);

                $scope.errorMessage = [error.RVErrorDesc];
                sntActivity.stop('RUN_DEVICE_ACTION');
            }
        };

        $scope.clearErrorMessage = function () {
            $scope.errorMessage = '';
        };

        $scope.onExecuteAction = function (device) {
            var action = _.find(device.actions, {action_name: device.selectedAction});

            $scope.errorMessage = '';
            if (!action) {
                return;
            }
            sntActivity.start('RUN_DEVICE_ACTION');
            sntapp.cardReader.doDeviceAction({
                service: action.service_name,
                action: action.action_name,
                successCallBack: callBacks['successCallBack'],
                failureCallBack: callBacks['failureCallBack']
            });
            $scope.actionDisplayName = action.display_name;
        };

        var dismissLoader = function() {
            $timeout(function() {
                $scope.$emit('hideLoader');
            }, 3000);
        };

        $scope.printReceipt = function() {
            $scope.$emit('showLoader');
            sntapp.cardReader.doDeviceAction({
                service: 'RVCardPlugin',
                action: 'printLastReceipt',
                successCallBack: function() {
                    dismissLoader();
                },
                failureCallBack: function() {
                    dismissLoader();
                }
            });
        };

        $scope.emailReceipt = function() {
            $scope.screenMode = 'EMAIL_ENTRY';
            $scope.screenData.emailId = '';
        };

        $scope.isEmailValid = function() {
            return rvUtilSrv.isEmailValid($scope.screenData.emailId);
        };

        $scope.sendEmail = function() {
            var options = {
                params: {
                    'email': $scope.screenData.emailId,
                    'message': actionResponse.message
                },
                successCallBack: function() {
                    $scope.screenMode = 'DISPLAY_MESSAGE';
                }
            };

            $scope.callAPI(rvDeviceStatusSrv.sendLastReceipt, options);
        };

        $scope.sendLogFiles = function() {
            sntapp.cardReader.doDeviceAction({
                service: 'RVCardPlugin',
                action: 'emailDeviceLogs',
                successCallBack: function() {
                    // do nothing
                },
                failureCallBack: function() {
                    // do nothing
                }
            });
        };

        // Humanize the underscore JS
        $scope.humanize = function (str) {
            return str.replace(/^[\s_]+|[\s_]+$/g, '')
                      .replace(/[_\s]+/g, ' ')
                      .replace(/^[a-z]/, function(m) { return m.toUpperCase(); });
        };

        (function () {
            $scope.screenMode = 'DISPLAY_MESSAGE';
            $scope.screenData = {
                'emailId': ''
            };
            $scope.isIpad = sntapp.browser === 'rv_native' && sntapp.cordovaLoaded;
            $scope.clearErrorMessage();
            $scope.setScroller('deviceMessage', {
                snap: false,
                scrollbars: 'custom',
                hideScrollbar: false,
                click: false,
                scrollX: false,
                scrollY: true,
                preventDefault: true,
                interactiveScrollbars: true,
                preventDefaultException: {tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT|A)$/}
            });
        })();
    }
]);
