sntRover.controller('RVdashboardController',
    ['$scope', 'ngDialog', 'RVDashboardSrv', 'RVSearchSrv', 'dashBoarddata',
        '$rootScope', '$filter', '$state', 'RVWorkstationSrv', 'roomTypes', '$timeout', '$interval', '$log',
        'RVHotelDetailsSrv', '$transitions', 'Toggles', 'rvAngularIframeHelperSrv',
        function($scope, ngDialog, RVDashboardSrv, RVSearchSrv, dashBoarddata,
                 $rootScope, $filter, $state, RVWorkstationSrv, roomTypes, $timeout, $interval, $log,
                 RVHotelDetailsSrv, $transitions, Toggles, rvAngularIframeHelperSrv) {


            // setting the heading of the screen
            $scope.heading = 'DASHBOARD_HEADING';
            $scope.dashboardFilter = {
                analyticsActive: false
            };
            // We are not showing the backbutton now, so setting as blank
            $scope.backButtonCaption = ''; // if it is not blank, backbutton will show, otherwise dont
            $scope.roomTypes = roomTypes;

            var that = this;

            $scope.shouldShowLateCheckout = true;
            $scope.shouldShowQueuedRooms = true;
            BaseCtrl.call(this, $scope);


            var init = function() {
                // setting the heading of the screen
                $scope.heading = "DASHBOARD_HEADING";
                $scope.userDetails = RVDashboardSrv.getUserDetails();
                $scope.statisticsData = dashBoarddata.dashboardStatistics;
                $scope.lateCheckoutDetails = dashBoarddata.lateCheckoutDetails;
                $rootScope.adminRole = $scope.userDetails.user_role;
                // update left nav bar
                $scope.$emit("updateRoverLeftMenu", "dashboard");
                $scope.$emit("closeDrawer");
                var scrollerOptions = {
                    click: true,
                    preventDefault: false
                };

                $scope.setScroller('dashboard_scroller', scrollerOptions);
                // Display greetings message based on current time
                var d = new Date();
                var time = d.getHours();
                // Handle Notificatin releated logic.

                initNotification();
                $scope.greetingsMessage = "";
                if (time < 12) {
                    $scope.greetingsMessage = 'GREETING_MORNING';
                }
                else if (time >= 12 && time < 16) {
                    $scope.greetingsMessage = 'GREETING_AFTERNOON';
                }
                else {
                    $scope.greetingsMessage = 'GREETING_EVENING';
                }
                // ADDED Time out since translation not working without time out
                setTimeout(function() {
                    var title = "Showing Dashboard";

                    $scope.refreshScroller('dashboard_scroller');
                    $scope.setTitle(title);
                }, 2000);

                if (!$rootScope.isWorkstationSet) {
                    setWorkStation();
                }

                // TODO: Add conditionally redirecting from API results

                reddirectToDefaultDashboard();

            };
            /*
             * Function to fetch release notes
             */
            var fetchReleaseNotes = function() {
                // Standard parameters,As of now leave it all null
                var params = {
                    hotel_uuid: null,
                    service_provider_uuid: null,
                    is_read: null
                };
                var successReleaseNotesFetch = function(data) {
                    $scope.activeNotification = data.results[0];
                    $scope.$emit('hideLoader');
                };

                $scope.invokeApi(RVDashboardSrv.fetchDashboardNotifications, params, successReleaseNotesFetch);
            };
            /*
             * Function to close release notes
             */

            $scope.closeReleaseNote = function() {
                ngDialog.close(); // close any existing popups
            };
            /*
             * Function to open link in new tab
             */
            $scope.showReleaseNote = function(activeNotification) {
                var url = activeNotification.action_source;

                if (!url.match(/^https?:\/\//i)) {
                    url = 'http://' + url + '?from=rover';
                }
                $scope.releaseActionSource = url;
                ngDialog.close(); // close any existing popups
                ngDialog.open({
                    template: '/assets/partials/dashboard/rvReleaseNotificationPopup.html',
                    className: '',
                    controller: '',
                    scope: $scope
                });
            };
            /*
             * Function to hide release notes for current login
             */
            $scope.cancelReleaseNote = function() {
                $rootScope.showNotificationForCurrentUser = false;
            };
            /*
             * Function to change status, ie is_read true
             */
            $scope.changeNotificationStatus = function(activeNotification) {
                var successCallBack = function() {
                    $rootScope.showNotificationForCurrentUser = false;
                    $scope.$emit('hideLoader');
                };

                $scope.invokeApi(RVDashboardSrv.changeNotificationStatus, activeNotification.id, successCallBack);
            };
            /*
             * Function to init notification related process.
             */
            var initNotification = function() {
                fetchReleaseNotes();
            };

            $transitions.onError({}, function () {
                $scope.errorMessage = 'Sorry the feature you are looking for is not implemented yet, or some  errors are occured!!!';
            });

            var setDeviceId = function() {
                var onGetDeviceIdSuccess = function(data) {
                        $rootScope.UUID = data;
                        invokeSetWorkstationApi();
                    },
                    onGetDeviceIdFailure = function() {
                        $rootScope.UUID = "DEFAULT";
                        invokeSetWorkstationApi();
                    };
                var options = {
                    "successCallBack": onGetDeviceIdSuccess,
                    "failureCallBack": onGetDeviceIdFailure,
                    "arguments": []
                };

                try {
                    sntapp.cardReader.getDeviceId(options);
                } catch (err) {
                    $log.info(err);
                }
            };

            var onSetWorkstationSuccess = function(data) {
                    if (!data.is_workstation_present) {
                        if ($scope.isHotelAdmin) {
                            $scope.$emit('hideLoader');
                            showWorkstationPopup();
                        } else {
                            createWorkstationForNonAdminUsers();
                        }
                    } else {
                        
                        $rootScope.workstation_id = data.id;
                        if (($rootScope.hotelPaymentConfig.paymentGateway === 'MLI' && $rootScope.hotelPaymentConfig.isEMVEnabled) ||
                            $rootScope.hotelPaymentConfig.paymentGateway === 'sixpayments') {
                            var options = {
                                params: {
                                    'hotel_id': $scope.hotelDetails.userHotelsData.current_hotel_id
                                },
                                'loader': 'none',
                                'failureCallBack': function() {
                                    // do nothing
                                }
                            };

                            $scope.callAPI(RVWorkstationSrv.cancelEMVActions, options);
                        }
                        setInfrasecDetails();
                        $scope.$emit('hideLoader');
                    }
                },
                onSetWorkstationFailure = function() {
                    $scope.$emit('hideLoader');
                };

            var setWorkStation = function() {


                // Variable to avoid calling the set work station api, when
                // its already invoked when navigating to the dashboard for the first time
                $rootScope.isWorkstationSet = true;
                if (sntapp.cordovaLoaded && 'rv_native' === sntapp.browser) {
                    // NOTE: Cordova is loaded always available
                    setDeviceId();

                } else {

                    // Check whether UUID is set from the WS response. We will check it 14 times (2800ms)
                    // in an interval of 200ms. If the UUID is not set by that time, we will use the default
                    // value 'DEFAULT'
                    if (!$scope.getDeviceId()) {
                        var count = 14;
                        var deviceIdCheckTimer = $interval(function () {
                            if ($scope.getDeviceId()) {
                                $interval.cancel(deviceIdCheckTimer);
                                invokeSetWorkstationApi();
                            } else if (!$scope.getDeviceId() && count === 0) {
                                $rootScope.UUID = 'DEFAULT';
                                $interval.cancel(deviceIdCheckTimer);
                                invokeSetWorkstationApi();
                            }
                            count--;
                        }, 200);
                    } else {
                        invokeSetWorkstationApi();
                    }
                }

            };

            var invokeSetWorkstationApi = function() {
                var requestData = {};

                requestData.rover_device_id = $scope.getDeviceId();
                $scope.invokeApi(RVWorkstationSrv.setWorkstation, requestData, onSetWorkstationSuccess, onSetWorkstationFailure);

            };

            var showWorkstationPopup = function() {
                ngDialog.close(); // close any existing popups
                ngDialog.open({
                    template: '/assets/partials/workstation/rvWorkstationPopup.html',
                    className: '',
                    controller: 'RVWorkstationController',
                    scope: $scope,
                    closeByDocument: false,
                    closeByEscape: false
                });
            };

            var createWorkstationForNonAdminUsers = function() {

                var onSaveWorkstationSuccess = function() {

                    var onSetWorkstationSuccess = function() {
                        $scope.$emit('hideLoader');
                    }, onSetWorkstationFailure = function() {
                        $scope.$emit('hideLoader');
                    };

                    var params = {};

                    params.rover_device_id = $scope.getDeviceId();
                    $scope.invokeApi(RVWorkstationSrv.setWorkstation, params, onSetWorkstationSuccess, onSetWorkstationFailure);

                };

                var requestData = {};

                requestData.rover_device_id = $scope.getDeviceId();
                requestData.auto_generate_workstation = true;

                $scope.invokeApi(RVWorkstationSrv.createWorkstation, requestData, onSaveWorkstationSuccess);

            };

            $scope.getDeviceId = function() {
                var deviceId = $rootScope.UUID;

                return deviceId;
            };


            // TODO: 49259 Move this to the router; use the redirectTo parameter (https://ui-router.github.io/guide/ng1/migrate-to-1_0#state-hook-redirectto)
            var reddirectToDefaultDashboard = function() {
                var defaultDashboardMappedWithStates = {
                    'FRONT_DESK': 'rover.dashboard.frontoffice',
                    'MANAGER': 'rover.dashboard.manager',
                    'HOUSEKEEPING': 'rover.dashboard.housekeeping'
                };

                if ($rootScope.default_dashboard in defaultDashboardMappedWithStates) {

                    // Nice Gotacha!!
                    // When returning from search/housekeeping to dashboard, the animation will be reversed
                    // but only for 'rover.search/housekeeping' to 'rover.dashboard'. We also need to make sure
                    // that the animation will be reversed for 'rover.dashboard' to 'rover.dashboard.DEFAULT_DASHBOARD'
                    if ($rootScope.isReturning()) {
                        $rootScope.setPrevState.name = defaultDashboardMappedWithStates[$rootScope.default_dashboard];
                        $rootScope.loadPrevState();
                    } else {
                        $state.go(defaultDashboardMappedWithStates[$rootScope.default_dashboard]);
                    }
                }
                else {
                    $scope.errorMessage = 'We are unable to redirect to dashboard, Please set Dashboard against this user and try again!!';
                }
            };

            init();


            $scope.gotosearch = function() {
                $state.go("rover.search");

            };


            /**
             * reciever function used to change the heading according to the current page
             * please be care to use the translation text as heading
             * param1 {object}, javascript event
             * param2 {String}, Heading to change
             */
            $scope.$on("UpdateHeading", function(event, data) {
                event.stopPropagation();
                // chnaging the heading of the page
                $scope.heading = data;
            });


            /**
             * function to handle click on backbutton in the header section
             * will broadcast an event, the logic of backbutto should be handled there
             */
            $scope.headerBackButtonClicked = function() {
                $scope.$broadcast("HeaderBackButtonClicked");
            };

            if ($rootScope.isDashboardSwipeEnabled && !$rootScope.disableObserveForSwipe) {
                CardReaderCtrl.call(this, $scope, $rootScope, $timeout, $interval, $log);
                $scope.observeForSwipe(6);
            } else if (sntapp.cordovaLoaded && 'rv_native' === sntapp.browser) {
                sntapp.cardReader.stopReader({
                    'successCallBack': function(data) {
                        $log.info('device set to offline', data);
                    },
                    'failureCallBack': function(data) {
                        $log.info('failed to set device to offline', data);
                    }
                });
            }
            /*
             * success callback of fetch infrasec details 
             */ 
            var successCallBackOfSetInfrasecDetails = function(data) {
                $rootScope.isInfrasecActivated = data.data.is_infrasec_activated_for_hotel;
                $rootScope.isInfrasecActivatedForWorkstation = data.data.is_infrasec_activated_for_workstation;      
            };

            /*
             * function to set infrasec details
             */
            var setInfrasecDetails = function() {
                var params  = {
                    workstation_id: $rootScope.workstation_id
                };

                var options = {
                    params: params,
                    successCallBack: successCallBackOfSetInfrasecDetails
                };

                $scope.callAPI(RVHotelDetailsSrv.fetchInfrasecDetails, options);
            };

            $scope.analyticsDashboardEnabled = Toggles.isEnabled('dashboard_analytics');

            if ($scope.analyticsDashboardEnabled) {
                $scope.dashboardFilter.analyticsActive = false;

                $scope.toggleAnalyticsView = function() {
                    $scope.dashboardFilter.showFilters = false;
                    $scope.$broadcast('RESET_CHART_FILTERS');
                    if ($scope.dashboardFilter.analyticsActive) {

                        var convertedStates = rvAngularIframeHelperSrv.convertedStates;
                        var currentConvertedState = _.find(convertedStates, function(state) {
                            return state.name === $state.current.name;
                        });

                        if (currentConvertedState && $rootScope.featureToggles && $rootScope.featureToggles[currentConvertedState.featureToggle]) {
                            $rootScope.$emit('NAVIGATE_TO_ANGULAR_APP', {
                                route: currentConvertedState.ng2route,
                                params: {}
                            });
                            return;
                        }
                        
                        $scope.dashboardFilter.analyticsActive = false;
                        $scope.$broadcast("showDashboardArea", true);
                    } else {
                        $scope.$broadcast('ANALYTICS_VIEW_ACTIVE');
                        $scope.dashboardFilter.analyticsActive = true;
                    }
                };

                $scope.changeAnalyticsView = function(selectedChart) {
                    $scope.dashboardFilter.selectedAnalyticsMenu = selectedChart;
                    $scope.$broadcast('ANALYTICS_MENU_CHANGED', selectedChart);
                };

                $scope.$on('SET_DEFAULT_ANALYTICS_MENU', function(e, selectedChart) {
                    $scope.dashboardFilter.selectedAnalyticsMenu = selectedChart;
                });

                $scope.dashboardFilter.datePicked = angular.copy($rootScope.businessDate);
                $scope.datePicked = moment($rootScope.businessDate).format('YYYY-MM-DD');

                $scope.$on('RESET_CHART_FILTERS', function() {
                    $scope.datePicked = moment($rootScope.businessDate).format('YYYY-MM-DD');
                });
                
               $scope.dateOptions = {
                    changeYear: true,
                    changeMonth: true,
                    yearRange: "-5:+5",
                    dateFormat: 'yy-mm-dd',
                    onSelect: function(dateText, inst) {
                        $scope.datePicked = dateText;
                        $scope.dashboardFilter.datePicked = dateText;
                        $scope.$broadcast('RELOAD_DATA_WITH_DATE_FILTER_' + $scope.dashboardFilter.selectedAnalyticsMenu);
                        ngDialog.close();
                    }
                };

                $scope.showAnalyticsDatePicker = function() {
                    $timeout(function() {
                        ngDialog.open({
                            template: '/assets/partials/search/rvDatePickerPopup.html',
                            className: '',
                            scope: $scope
                        });
                    }, 1000);
                };

                $scope.$on('ROOM_TYPE_SHORTAGE_CALCULATED', function(e, calculatedRoomTypes) {
                    $scope.roomTypesForWorkPrioriy = [];
                    _.each($scope.roomTypes, function(roomType) {
                        roomType.shortage = 0;
                        roomType.overBooking = 0;
                        _.each(calculatedRoomTypes, function(calculatedRoomType) {
                            if (roomType.code === calculatedRoomType.code) {
                                roomType.shortage = calculatedRoomType.shortage;
                                roomType.overBooking = calculatedRoomType.overBooking;
                            }
                        });
                    });
                });

                $scope.refreshAnalyticsChart = function(selectedChart) {
                    $scope.$broadcast('RESET_CHART_FILTERS');
                    $scope.$broadcast('REFRESH_ANALYTCIS_CHART_' + selectedChart);
                    $scope.dashboardFilter.showFilters = false;
                };

                $scope.onAnlayticsFilterChanged = function() {
                    $scope.$broadcast('ANALYTICS_FILTER_CHANGED');
                };

                $scope.getAppliedFilterCount = function() {
                    if ($scope.dashboardFilter.selectedAnalyticsMenu === 'DISTRIBUTION' ||
                        $scope.dashboardFilter.selectedAnalyticsMenu === 'PACE') {
                        var aggTypeFilterCount = $scope.dashboardFilter.aggType ? 1 : 0;
                        var datesToCompareCount =  ($scope.dashboardFilter.selectedAnalyticsMenu === 'PACE' && 
                                                    $scope.dashboardFilter.lineChartActive) ?
                                                    $scope.dashboardFilter.datesToCompare.length : 0;
                        
                        return $scope.dashboardFilter.selectedFilters.marketCodes.length +
                            $scope.dashboardFilter.selectedFilters.sourceCodes.length +
                            $scope.dashboardFilter.selectedFilters.segmentCodes.length +
                            $scope.dashboardFilter.selectedFilters.originCodes.length +
                            $scope.dashboardFilter.selectedFilters.roomTypes.length +
                            aggTypeFilterCount +
                            datesToCompareCount;

                    } else if ($scope.dashboardFilter.selectedAnalyticsMenu === 'PERFOMANCE') {
                        return $scope.dashboardFilter.showLastYearData ? 2 : 0;
                    } else if ($scope.dashboardFilter.selectedAnalyticsMenu === 'HK_OVERVIEW' ||
                        $scope.dashboardFilter.selectedAnalyticsMenu === 'HK_WORK_PRIRORITY' ||
                        $scope.dashboardFilter.selectedAnalyticsMenu === 'FO_ARRIVALS') {
                        return $scope.dashboardFilter.selectedRoomType ? 1 : 0;
                    } else if ($scope.dashboardFilter.selectedAnalyticsMenu === 'FO_ACTIVITY') {
                        var filterCount = 0;

                        filterCount = $scope.dashboardFilter.selectedRoomType ? 1 : 0;
                        return filterCount + ($scope.dashboardFilter.showPreviousDayData ? 1 : 0);
                    } else if ($scope.dashboardFilter.selectedAnalyticsMenu === 'FO_WORK_LOAD') {
                        var filterCount = 0;

                        filterCount = $scope.dashboardFilter.selectedRoomType ? 1 : 0;
                        return filterCount + ($scope.dashboardFilter.showRemainingReservations ? 1 : 0);
                    }
                };
            }

        }]);
