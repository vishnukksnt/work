BaseCtrl = function($scope) {

    var _listeners = [],
        root = $scope.$root || {};

    root.__API_REQ_COUNT__ = root.__API_REQ_COUNT__ || 1;

    $scope.businessDate = '';

    $scope.fetchedCompleted = function () {
        $scope.$emit('hideLoader');
    };

    $scope.clearErrorMessage = function () {
        $scope.errorMessage = '';
        $scope.successMessage = '';
    };
    $scope.clearErrorMessage();
    $scope.showErrorMessage = function (errorMessage) {

    };

    $scope.runDigestCycle = function () {
        if (!$scope.$$phase) {
            $scope.$digest();
        }
    };

    // function that converts a null value to a desired string.
    // if no replace value is passed, it returns an empty string
    $scope.escapeNull = function (value, replaceWith) {
        var newValue = '';

        if ((typeof replaceWith !== 'undefined') && (replaceWith !== null)) {
            newValue = replaceWith;
        }
        var valueToReturn = ((value === null || typeof value === 'undefined') ? newValue : value);

        return valueToReturn;
    };

    $scope.fetchedFailed = function (errorMessage) {
        $scope.$emit('hideLoader');
        // scroll to top of the page where error message is shown
        if (angular.element(document.querySelector('.content')).find('.error_message').length) {
            angular.element(document.querySelector('.content')).scrollTop(0);
        }
        if ($scope.hasOwnProperty('errorMessage')) {
            $scope.errorMessage = errorMessage;
            $scope.successMessage = '';
        } else {
            $scope.$emit('showErrorMessage', errorMessage);
        }
        // if needed ,to be handled as per requirements in controllers (scroll to top,empty fields)
        $scope.$broadcast('scrollToErrorMessage');
    };

    $scope.invokeApi = function (serviceApi, params, successCallback, failureCallback, loaderType) {
        // loaderType options are "BLOCKER", "NONE"
        var identifier = 'API_REQ_' + ++root.__API_REQ_COUNT__;

        if (typeof loaderType === 'undefined') {
            loaderType = 'BLOCKER';
        }
        if (loaderType.toUpperCase() === 'BLOCKER') {
            // This method has to be implemented in the root controllers
            if ($scope.startActivity) {
                $scope.startActivity(identifier);
            }
        }
        successCallback = (typeof successCallback === 'undefined') ? $scope.fetchedCompleted : successCallback;
        failureCallback = (typeof failureCallback === 'undefined') ? $scope.fetchedFailed : failureCallback;

        return serviceApi(params)
            .then(successCallback, failureCallback)
            .finally(function () {
                // This method has to be implemented in the root controllers
                if ($scope.stopActivity) {
                    $scope.stopActivity(identifier);
                }
            });

    };

    $scope.callAPI = function (serviceApi, options) {
        options = options || {};

        var identifier = 'API_REQ_' + ++root.__API_REQ_COUNT__,
            params = options['params'] ? options['params'] : null,
            loader = options['loader'] ? options['loader'] : 'BLOCKER',
            showLoader = loader.toUpperCase() === 'BLOCKER',
            successCallBack = options['successCallBack'] ? options['successCallBack'] :
                (options['onSuccess'] ? options['onSuccess'] : $scope.fetchedCompleted),
            failureCallBack = options['failureCallBack'] ? options['failureCallBack'] :
                (options['onFailure'] ? options['onFailure'] : $scope.fetchedFailed),
            successCallBackParameters = options['successCallBackParameters'] ? options['successCallBackParameters'] : null,
            failureCallBackParameters = options['failureCallBackParameters'] ? options['failureCallBackParameters'] : null;

        if (showLoader) {
            // This method has to be implemented in the root controllers
            if ($scope.startActivity) {
                $scope.startActivity(identifier);
            } else {
                $scope.$emit('showLoader');
            }
        }

        return serviceApi(params).then(
            // success call back
            function (data) {
                if (showLoader) {
                    // This method has to be implemented in the root controllers
                    if ($scope.stopActivity) {
                        $scope.stopActivity(identifier);
                    } else {
                        $scope.$emit('hideLoader');
                    }
                }
                if (successCallBack) {
                    if (successCallBackParameters) {
                        successCallBack(data, successCallBackParameters);
                    } else {
                        successCallBack(data);
                    }
                }
            },
            // failure callback
            function (error) {
                if (showLoader) {
                    $scope.$emit('hideLoader');
                    // This method has to be implemented in the root controllers
                    if ($scope.stopActivity) {
                        $scope.stopActivity(identifier);
                    }
                }
                if (failureCallBack) {
                    if (failureCallBackParameters) {
                        failureCallBack(error, failureCallBackParameters);
                    } else {
                        failureCallBack(error);
                    }
                }
            }
        );
    };

    // handle drag and drop events
    $scope.hideCurrentDragItem = function (ev) {
        $(ev.target).hide();
    };

    $scope.showCurrentDragItem = function (ev) {
        $(ev.target).show();
    };

    /**
     * function to get day against a date
     * if you give today's date it will return 'Today', Tomorrow will return against tomorrow's date
     * for others, it will return week day (Sunday, Monday..)
     */

    $scope.getSimplifiedDayName = function (date) {
        var returnText = '';

        try {
            var passedDate = tzIndependentDate(date);
            var currentDate = tzIndependentDate($scope.businessDate);
            var timeDiff = (passedDate.getTime() - currentDate.getTime());
            var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

            if (diffDays === 0) {
                returnText = 'Today';
            } else if (diffDays === 1) {
                returnText = 'Tomorrow';
            } else {
                var weekday = new Array(7);

                weekday[0] = 'Sunday';
                weekday[1] = 'Monday';
                weekday[2] = 'Tuesday';
                weekday[3] = 'Wednesday';
                weekday[4] = 'Thursday';
                weekday[5] = 'Friday';
                weekday[6] = 'Saturday';
                returnText = weekday[passedDate.getDay()];
            }
            return returnText;
        }
        catch (e) {
            return date;
        }
    };

    /*
    * To set the title of each navigation
    */
    $scope.setTitle = function (title) {
        document.title = title;
    };

    $scope.goBack = function ($rootScope, $state) {

        if ($rootScope.previousStateParam) {
            $state.go($rootScope.previousState, {menu: $rootScope.previousStateParam});
        } else if ($rootScope.previousState) {
            $state.go($rootScope.previousState);
        } else {
            $state.go('admin.dashboard', {menu: 0});
        }

    };

    /*
            this is the default scroller options used by controllers
            this can be modified through setScroller function
        */
    $scope.timeOutForScrollerRefresh = 300;
    var defaultScrollerOptions = {
        snap: false,
        scrollbars: 'custom',
        hideScrollbar: false,
        click: false,
        scrollX: false,
        scrollY: true,
        preventDefault: true,
        interactiveScrollbars: true,
        preventDefaultException: {tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT|A)$/}
    };

    /*
        function to handle scroll related things
        @param1: string as key
        @param2: object as scroller options
    */
    $scope.setScroller = function (key, scrollerOptions) {
        if (typeof scrollerOptions === 'undefined') {
            scrollerOptions = {};
        }
        // we are merging the settings provided in the function call with defaults
        var tempScrollerOptions = angular.copy(defaultScrollerOptions);

        angular.extend(tempScrollerOptions, scrollerOptions); // here is using a angular function to extend,
        scrollerOptions = tempScrollerOptions;
        // checking whether scroll options object is already initilised in parent controller
        // if so we need add a key, otherwise initialise and add
        var isEmptyParentScrollerOptions = isEmptyObject($scope.$parent.myScrollOptions);

        if (isEmptyParentScrollerOptions) {
            $scope.$parent.myScrollOptions = {};
        }
        
        if (sntapp.browser === 'rv_native' && sntapp.cordovaLoaded) {
            scrollerOptions.click = false;
            scrollerOptions.tap = true;
            scrollerOptions.preventDefault = false;
            scrollerOptions.deceleration =  0.0001;
        }
        $scope.$parent.myScrollOptions[key] = scrollerOptions;
    };

    /*
        function to refresh the scroller
        @param1: string as key
    */
    $scope.refreshScroller = function (key) {
        setTimeout(function () {
            if (!!$scope.$parent && $scope.$parent.myScroll) {
                if (key in $scope.$parent.myScroll) {
                    $scope.$parent.myScroll[key].refresh();
                }
            }
            if ($scope.hasOwnProperty('myScroll') && (key in $scope.myScroll)) {
                $scope.myScroll[key].refresh();
            }
        }, $scope.timeOutForScrollerRefresh);
    };

    $scope.getScroller = function (key) {
        if (!!$scope.$parent && $scope.$parent.myScroll) {
            if (key in $scope.$parent.myScroll) {
                return $scope.$parent.myScroll[key];
            }
        }

        if ($scope.hasOwnProperty('myScroll') && (key in $scope.myScroll)) {
            return $scope.myScroll[key];
        }
        return null;
    };

    /*
    * MLI integration
    */

    $scope.fetchMLI = function (sessionDetails, successCallback, failureCallback) {

        var success = function (response) {
            $scope.$emit('hideLoader');
            successCallback(response);
            $scope.$apply();
        };
        var failure = function () {
            $scope.$emit('hideLoader');
            var errorMessage = ['There is a problem with your credit card'];

            failureCallback(errorMessage);
            $scope.$apply();
        };

        if (sessionDetails.cardNumber.length > 0) {
            try {
                $scope.$emit('showLoader');
                sntapp.MLIOperator.fetchMLISessionDetails(sessionDetails, success, failure);
            }
            catch (err) {
                $scope.$emit('hideLoader');
                var errorMessage = ['There was a problem connecting to the payment gateway.'];

                failureCallback(errorMessage);
            }
        } else {
            var errorMessage = ['There is a problem with your credit card'];

            failureCallback(errorMessage);
        }

    };

    // Refresh pagination every time the data changes
    $scope.refreshPagination = function (paginationId) {
        setTimeout(function() {
            $scope.$broadcast('updatePagination', paginationId);
        }, 100);        
    };

    // Absolute value of a number
    $scope.absVal = Math.abs;

    $scope.addListener = function(name, callback) {
        _listeners.push($scope.$on(name, callback));
    };

    $scope.$on('$destroy', function() {
        _listeners.forEach(function(handle) {
            // invoke listener's deregistration function
            handle();
        });
    });

    $scope.isEmpty = isEmpty;

    // Clear the password when the user clicks the password field
    $scope.onPasswordClick = function (dataObject, key) {
        if (dataObject) {
            dataObject[key] = '';
        }
    };

    // Delete the property if required
    $scope.deletePropertyIfRequired = function (dataObject, property) {
        if (dataObject[property] === getTemporaryDisplayPassword() ) {
            delete dataObject[property]; 
        }
    };

    // Set default password when fetching the configuration details
    $scope.setDefaultDisplayPassword = function (dataObject, property, passwordPresentKey) {
        passwordPresentKey = passwordPresentKey || 'is_password_present';
        if (dataObject[passwordPresentKey] && !dataObject.hasOwnProperty(property)) {
            dataObject[property] = getTemporaryDisplayPassword();
        }
    };

    $scope.isEmptyArray = isEmptyArray;

    /**
     * Parse a string to a float number
     */
    $scope.toFloat = function ( num ) {
        return parseFloat(num);
    };

    /**
     * Converts string to lowercase
     * @param {String} str- input string
     * @return {String} transformed string
     */
    $scope.lowercase = function (str) {
        str = str || '';
        return str.toLowerCase(); 
    };

    /**
     * Get the length of the object or array
     * @param {Object | Array} -array or object
     * @return {Number} length - length of the object or array
     */
    $scope.lengthObjArr = function (objOrArr) {
        var length;

        if (_.isObject(objOrArr)) {
            length = _.keys(objOrArr).length;
        } else if (_.isArray(objOrArr)) {
            length = objOrArr.length;
        }

        return length;
    };

};
