var GlobalApp = function() {
    var that = this;

    this.browser = "other";
    this.cordovaLoaded = false;
    this.cardReader = null;
    this.iBeaconLinker = null;
    this.enableURLChange = true;
    this.uuidService = null;
    try {
        this.desktopCardReader = new DesktopCardOperations();
        this.MLIOperator = new MLIOperation();
    }
    catch (er) {
        console.log(er);
    }


    this.DEBUG = true;

    // say hello to fellow developers
    // and with them new year!
    console.log("\n\n  _    _      _ _          _____ _   _ _______   _____                 _                           \n | |  | |    | | |        / ____| \\ | |__   __| |  __ \\               | |                          \n | |__| | ___| | | ___   | (___ |  \\| |  | |    | |  | | _____   _____| | ___  _ __   ___ _ __ ___ \n |  __  |/ _ \\ | |/ _ \\   \\___ \\| . ` |  | |    | |  | |/ _ \\ \\ / / _ \\ |/ _ \\| '_ \\ / _ \\ '__/ __|\n | |  | |  __/ | | (_) |  ____) | |\\  |  | |    | |__| |  __/\\ V /  __/ | (_) | |_) |  __/ |  \\__ \\ \n |_|  |_|\\___|_|_|\\___/  |_____/|_| \\_|  |_|    |_____/ \\___| \\_/ \\___|_|\\___/| .__/ \\___|_|  |___/\n                                                                              | |                  \n                                                                              |_|                  \n\nMay your stories be no worries, and bugs with no hurries!\n");


    this.setBrowser = function(browser) {


        var url = "/ui/pms-ui/shared/cordova.js";

        if (typeof browser === 'undefined' || browser === '') {
            that.browser = "other";
        } else if (browser === 'rv_native_android' || browser === 'rv_native_ios') {
            that.browser = 'rv_native';
            that.cordovaLoaded = true;
        } else {
            that.browser = browser;
        }

        if (browser === 'rv_native' && !that.cordovaLoaded) {
            that.loadScript(url);
        }

    };

    this.loadCordovaWithVersion = function(version) {
        var script_node = document.createElement('script');

        script_node.setAttribute('src', '/ui/pms-ui/shared/cordova/' + version + '/cordova.js');
        script_node.setAttribute('type', 'application/javascript');
        document.body.appendChild(script_node);
        document.addEventListener('deviceready', function() {
            that.cordovaLoaded = true;
            that.browser = 'rv_native';
            that.cardReader = new CardOperation();
        }, false);
    };

    this.loadScript = function(url) {
            /* Using XHR instead of $HTTP service, to avoid angular dependency, as this will be invoked from
             * webview of iOS / Android.
             */
            var xhr = new XMLHttpRequest(); // LATER: IE support?

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4 && xhr.status === 200) {
                      that.fetchCompletedOfCordovaPlugins(xhr.responseText);
                } else {
                    that.fetchFailedOfCordovaPlugins();
                }
            };
            xhr.open("GET", url, true);

            xhr.send(); // LATER: Loading indicator
    };

    this.notifyDeviceStateChange = function(device_name, type, value) {
        var displayString;

        if (type === 'device_battery_below_threshold') {
            displayString = device_name + ': Battery low (' + value + '%)';
        } else {
            displayString = device_name + ': ' + value;
        }

        document.dispatchEvent(new CustomEvent('OBSERVE_DEVICE_STATUS_CHANGE', {'detail': displayString}));
    };

    // success function of coddova plugin's appending
    this.fetchCompletedOfCordovaPlugins = function(script) {
        that.cordovaLoaded = true;       

        var script_node = document.createElement('script');

        script_node.innerHTML = script;

        document.body.appendChild(script_node);
        try {
            that.cardReader = new CardOperation();
            that.iBeaconLinker = new iBeaconOperation();
        }
        catch (er) {
            console.log(er);
        }
    };

    // success function of coddova plugin's appending
    this.fetchFailedOfCordovaPlugins = function() {
        that.cordovaLoaded = false;
    };

    this.enableCardSwipeDebug = function() {
        that.cardSwipeDebug = true; // Mark it as true to debug cardSwype opertations
        that.cardReader = new MockCardOperation();
    };

    this.reInitCardOperations = function() {
        var checkDeviceConnection = function() {
            console.log('deviceready listener...');
            sntapp.cardReader = new CardOperation();
            window.setTimeout(function() {
                document.dispatchEvent(new Event('OBSERVE_FOR_SWIPE'));
            }, 300);
            document.removeEventListener("deviceready", checkDeviceConnection, false);
        };

        sntCordovaInit();
        document.addEventListener("deviceready", checkDeviceConnection, false);
    };

    // IMPORTANT: The below variable will be used in admin and Staff Apps.
    
    // Some features may not be completed by the end of a sprint
    // and reverting will be painful. So in those cases, we can temperorily disable 
    // such features (like a toggle button) in production and release
    
    var url = window.location;
    var isInDevEnv = false;

    if (url.hostname) {
        if (typeof url.hostname === typeof 'str') {
            if (url.hostname.indexOf('pms-dev') !== -1 ||
                url.hostname.indexOf('pms-prod-test') !== -1 ||
                url.hostname.indexOf('192.168.1') !== -1 ||
                url.hostname.indexOf('localhost') !== -1) {
                isInDevEnv = true;
            }
        }
    }
    this.environment = isInDevEnv ? 'DEV' : 'PROD';
};

sntapp = new GlobalApp();
// sntapp.enableCardSwipeDebug();