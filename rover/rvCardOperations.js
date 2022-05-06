/* eslint-disable angular/timeout-service */
var CardOperation = function() {
    // class for handling operations with payment device

    var that = this;
    // function for start reading from device
    // Note down: Currently it is recursive

    this.writeKeyDataDebug = function(options) {
        // Simulating the write function for easy testing. May be removed in production.
        var successCallBack = options["successCallBack"] ? options["successCallBack"] : null;
        var successCallBackParameters = options["successCallBackParameters"] ? options["successCallBackParameters"] : null;
        var mechineResponse = { };

        setTimeout(function() {
            successCallBack(mechineResponse, successCallBackParameters);
        }, 1000);

    };

    this.observeCBADeviceConnection = function(options) {
        options = options || {};
        options['shouldCallRecursively'] = true;
        options['service'] = "RVCardPlugin";
        options['action'] = "observeCBADeviceConnection";
        that.callCordovaService(options);
    };


    this.startReader = function(options) {
        // the repeated calls for observeForSwipe method is now moved to the cardReaderCtrl which would be run within the controllers
        that.listenForSingleSwipe(options);
    };

    // function used to call cordova services
    this.callCordovaService = function(options) {
        // cordova.exec function require success and error call back
        var successCallBack = options["successCallBack"] ? options["successCallBack"] : null;
        var failureCallBack = options["failureCallBack"] ? options["failureCallBack"] : null;

        // This variable is used to keep as a flag for the timeout handling scenarios
        var isExecuting = true;

        // CICO-40735 In case options has a timeout key, then the JS methods will call failure callback if the callbacks haven't
        // been executed before the timeout duration
        var timeoutDuration = options["timeout"] || null;

        // if success call back require additional parameters
        var successCallBackParameters = options["successCallBackParameters"] ? options["successCallBackParameters"] : null;

        // if error call back require additional parameters
        var failureCallBackParameters =  options["failureCallBackParameters"] ? options["failureCallBackParameters"] : null;

        var service = options["service"] ? options["service"] : null;
        var action = options["action"] ? options["action"] : null;
        var arguments = options["arguments"] ? options["arguments"] : [];

        if (successCallBack === null) {
            return false;
        }
        else if (failureCallBack === null) {
            return false;
        }
        else if (service === null) {
            return false;
        }
        else if (action === null) {
            return false;
        }

        // calling cordova service
        try {
            cordova.exec(
                // if success call back require any parameters
                function(data) {
                    // This flag could have been set false if the timeout happens from the UI
                    if (isExecuting) {
                        isExecuting = false;

                        if (successCallBackParameters !== null) {
                            successCallBack(data, successCallBackParameters);
                            that.callRecursively(options);
                        }
                        else {
                            successCallBack(data);
                            that.callRecursively(options);
                        }
                    }
                },
                // if failure/error call back require any parameters
                function(error) {
                    // This flag could have been set false if the timeout happens from the UI
                    if (isExecuting) {
                        isExecuting = false;
                        if (failureCallBackParameters !== null) {
                            failureCallBack(error, failureCallBackParameters);
                        }
                        else {
                            failureCallBack(error);
                        }
                        /**
                         * CICO-29248
                         * Observe for swipe is not valid for CBA devices; as they cant be tokenized;
                         * Hence; there is no point in recursively calling if cordovaAPI return 100
                         * RVErrorCode : "100",
                         * RVErrorDesc : "Device does not support the feature."
                         */
                        if (!error || (error.RVErrorCode !== 100 && error.RVErrorCode !== "100")) {
                            that.callRecursively(options);
                        }
                    }
                },

                // service name
                service,
                // function name
                action,
                // arguments to native
                arguments
            );

        } catch (e) {
            // eslint-disable-next-line no-console,angular/log
            console.log(e);
            isExecuting = false;
        }

        if (timeoutDuration) {
            setTimeout(function() {
                if (isExecuting) {
                    isExecuting = false;
                    failureCallBack({
                        RVErrorCode: null,
                        RVErrorDesc: 'Request timed out: ' + action
                    });
                }
            }, timeoutDuration);
        }
    };

    this.callRecursively = function(options) {
        // TODO: Have to find better way of implementing this if not.
        var shouldCallRecursively = options["shouldCallRecursively"] ? options["shouldCallRecursively"] : false;

        if (shouldCallRecursively) {
            that.callCordovaService(options);
        }
    };

    // function for get single swipe
    this.listenForSingleSwipe = function(options) {
        options['service'] = "RVCardPlugin";
        options['action'] = "observeForSwipe";
        that.callCordovaService(options);
    };

    // function for writing the key data
    this.writeKeyData = function(options) {
        options['service'] = "RVCardPlugin";
        options['action'] = "processKeyWriteOperation";
        // CICO-40735 Timeout of 30s from in cordova method; Adding 1s or UI timeout
        options["timeout"] = 31000;
        that.callCordovaService(options);
    };

    // function for stop reading from device
    this.stopReader = function(options) {
        options['service'] = "RVCardPlugin";
        options['action'] = "cancelSwipeObservation";
        that.callCordovaService(options);

    };

    /**
    * method for stop/cancel writing operation
    */
    this.cancelWriteOperation = function(options) {
        options['service'] = "RVCardPlugin";
        options['action'] = "cancelWriteOperation";
        that.callCordovaService(options);
    };
    /**
    * method To set the wrist band type- fixed amount/open room charge
    */
    this.setBandType = function(options) {
        options['service'] = "RVCardPlugin";
        options['action'] = "setBandType";
        // CICO-40735 Timeout of 30s from in cordova method; Adding 1s or UI timeout
        options["timeout"] = 31000;
        that.callCordovaService(options);
    };

    this.setBandTypeDebug = function(options) {
        var successCallBack = options["successCallBack"] ? options["successCallBack"] : null;
        var successCallBackParameters = options["successCallBackParameters"] ? options["successCallBackParameters"] : null;
        var failureCallBack = options["failureCallBack"] ? options["failureCallBack"] : null;
        // we are simulating the process by calling the success call back after some time

        setTimeout(function() {
                successCallBack();
        }, 1000);

    };
    /**
    * method for checking the device connected status
    * will call success call back if it is fail or connected (bit confusing?)
    * success call back with data as false if disconnected
    * success call back with data as true if connected
    */
    // function to check device status
    this.checkDeviceConnected = function(options) {
        options['service'] = "RVCardPlugin";
        options['action'] = "checkDeviceConnectionStatus";
        that.callCordovaService(options);
    };

    // debug mode of check device connection checking
    // please check above method (checkDeviceConnected) for further description
    this.checkDeviceConnectedDebug = function(options) {
        // Simulating the write function for easy testing. May be removed in production.
        var successCallBack = options["successCallBack"] ? options["successCallBack"] : null;
        var successCallBackParameters = options["successCallBackParameters"] ? options["successCallBackParameters"] : null;
        var failureCallBack = options["failureCallBack"] ? options["failureCallBack"] : null;
        var deviceStatus = true;
        // we are simulating the process by calling the success call back after some time

        setTimeout(function() {
                successCallBack(deviceStatus, successCallBackParameters);
        }, 1000);
    };

    /**
    * method for retrieving the UID (Unique ID) from Card for Safe lock
    * will call the success call back with user id
    * if any error occured, will call the error call back
    */
    this.retrieveUserID = function(options) {
        options['service'] = "RVCardPlugin";
        options['action'] = "getCLCardUID";
        // CICO-40735 Timeout of 30s from in cordova method; Adding 1s or UI timeout
        options["timeout"] = 31000;
        that.callCordovaService(options);
    };
    // debug mode of retrieving the Unique id
    // please check above method (retrieveUserID) for further description
    this.retrieveUserIDDebug = function(options) {
        var retUserID = "CB94C49T"; // Sample ID
        var successCallBack = options["successCallBack"] ? options["successCallBack"] : null;
        // we are simulating the process by calling the success call back after some time period

        setTimeout(function() {
            successCallBack(retUserID);
        }, 1000);
    };


    /**
    * method for retrieving the UID (User ID) from Card for Safe lock
    * will call the success call back with user id
    * if any error occured, will call the error call back
    */
    this.retrieveCardInfo = function(options) {
        options['service'] = "RVCardPlugin";
        options['action'] = "getCLCardInfo";
        // CICO-40735 Timeout of 30s from in cordova method; Adding 1s or UI timeout
        options["timeout"] = 31000;
        that.callCordovaService(options);
    };

    // debug mode of retrieving the card info
    this.retrieveCardInfoDebug = function(options) {
        // TODO: replace with sample hash
        var retCardInfo = {
                            "card_uid": "E3C33C7E",
                            "card_type": "3",
                            "card_size": "1024",
                            "cs": "912D8F4A79C1"
                            }; // Sample card info
        var successCallBack = options["successCallBack"] ? options["successCallBack"] : null;
        // we are simulating the process by calling the success call back after some time period

        setTimeout(function() {
            successCallBack(retCardInfo);
        }, 1000);
    };


    // function for linking iBeacon
    this.linkiBeacon = function(options) {
        options['service'] = "RVCardPlugin";
        options['action'] = "writeBeaconID";
        that.callCordovaService(options);
    };

    // function for getting Device UUID
    this.getDeviceId = function(options) {
        options['service'] = "RVCardPlugin";
        options['action'] = "UUIDforDevice";
        options['timeout'] = 31000;
        that.callCordovaService(options);
    };

    this.getConnectedDeviceDetails = function (options) {
        options['service'] = "RVDevicePlugin";
        options['action'] = "getDevicesStates";
        options['timeout'] = 31000;

        that.callCordovaService(options);
    };

    this.doDeviceAction = function (options) {
        options['timeout'] = 31000;
        that.callCordovaService(options);
    };

};
