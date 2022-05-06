/**
 * Function that can be used to extend controllers to observeForSwipe
 * @param {object} $scope
 * @param {object} $rootScope
 * @param {object} $timeout
 * @param {object} $interval
 * @param {object} $log
 * @returns {undefined}
 * @constructor
 */
function CardReaderCtrl($scope, $rootScope, $timeout, $interval, $log) {

    var self = this;

    self.cardReaderInitiationAttempts = 0;
    self.cardReaderInitiationMaxAttempts = 2;
    self.cardReaderInitiationAttemptInterval = 2000;
    self.refreshIntervalInMilliSeconds = 10000;
    self.isObserveResetOnHold = false;


    self.initiateCardReader = function () {
        $log.info('trying to initiate an observeForSwipe request...');

        if (sntapp.cardSwipeDebug) {
            $log.info('to simulate a card swipe run conistance.callSuccess() from browser console!');
            sntapp.cardReader.startReaderDebug(self.options);
            $log.info('card swipe set to work on debug mode...!');
        } else if (sntapp.cordovaLoaded && 'rv_native' === sntapp.browser) {
            sntapp.cardReader.startReader(self.options);
            $log.info('request made to observe for swipe!');
        } else {
            // If cordova not loaded in server, or page is not yet loaded completely
            // One second delay is set so that call will repeat in 1 sec delay
            if (self.cardReaderInitiationAttempts < self.cardReaderInitiationMaxAttempts) {
                $log.warn($scope.$state.current.name);
                $log.info('cordova not loaded in server! Next attempt in ' + self.cardReaderInitiationAttemptInterval + 'ms');
                self.timeoutHandle = $timeout(function () {
                    self.cardReaderInitiationAttempts++;
                    self.initiateCardReader();
                }, self.cardReaderInitiationAttemptInterval);
            } else {
                $log.info('cordova not loaded! Max attempts to connect reached!');
            }
        }
    };

    self.clear = function () {
        $log.warn('timeout cleared? ' + $timeout.cancel(self.timeoutHandle));
    };

    $scope.observeForSwipe = function (numAttempts) {
        $log.warn('initiate attempts to observe for swipe from ' + $scope.$state.current.name);
        self.cardReaderInitiationMaxAttempts = numAttempts || self.cardReaderInitiationMaxAttempts;
        self.cardReaderInitiationAttempts++;
        self.initiateCardReader();
    };

    /**
     * This handles the HOLD_OBSERVE_FOR_SWIPE_RESETS event coming in from the child controllers
     * We would need this because we will have to stop sending obeservSwipe requests when other actions like key card read/write are anticipated
     */
    self.listenerHold = $scope.$on('HOLD_OBSERVE_FOR_SWIPE_RESETS', function () {
        self.isObserveResetOnHold = true;
        $log.info('HOLD_OBSERVE_FOR_SWIPE_RESETS');
        self.clear();
    });

    /**
     * This handles the RESUME_OBSERVE_FOR_SWIPE_RESETS event coming in from the child controllers
     */
    self.listenerResume = $scope.$on('RESUME_OBSERVE_FOR_SWIPE_RESETS', function () {
        self.isObserveResetOnHold = false;
        $log.info('RESUME_OBSERVE_FOR_SWIPE_RESETS');
        self.initiateCardReader();
    });

    (function () {
        self.options = {
            'successCallBack': function (data) {
                $rootScope.$emit('BROADCAST_SWIPE_ACTION', data);
                $log.info($scope.$state.current.name + ' SUCCESS callback received from cordova...', data);
                // In case the callback is for a earlier request before the observeSwipe requests are put on Hold!
                if (!self.isObserveResetOnHold) {
                    self.initiateCardReader();
                }
            },
            'failureCallBack': function (errorMessage) {
                $scope.errorMessage = errorMessage;
                $log.info($scope.$state.current.name + 'FAILURE callback received from cordova...', errorMessage);
                // In case the callback is for a earlier request before the observeSwipe requests are put on Hold!
                if (!self.isObserveResetOnHold) {
                    self.initiateCardReader();
                }
            }
        };
    })();

    //  ----------------------------------------------------------------------------------------------------------------
    $scope.$on('$destroy', function () {
        self.clear();
        $log.warn('stopping listening to observe for swipe from ' + $scope.$state.current.name);
        self.options = null;
    });

    $scope.$on('$destroy', self.listenerHold);
    $scope.$on('$destroy', self.listenerResume);
}
