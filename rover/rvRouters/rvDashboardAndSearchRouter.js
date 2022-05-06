angular.module('dashboardModule', []).config(function($stateProvider, $urlRouterProvider, $translateProvider) {

        $stateProvider.state('rover.search', {
            // as we dont have a status called Mobile checkin, we still need to pass as PRE_CHECKIN
            // along with that we will pass is mobile checkin variable. This will be null if not send
            url: '/search',
            templateUrl: '/assets/partials/search/rvSearchReservation.html',
            controller: 'rvReservationSearchController',
            params: {
                type: null,
                from_page: null,
                useCache: null,
                isMobileCheckin: null,
                isBulkCheckoutSelected: null,
                isAllowOpenBalanceCheckoutSelected: null,
                isBulkCheckinSelected: null                
            },
            resolve: {
                searchResultdata: function(RVSearchSrv, $stateParams) {
                    var oldType = "";
                    var dataDict = {};

                    oldType = $stateParams.type;

                    if ( oldType !== null && oldType !== '' && oldType !== "RESET") {
                        if (oldType === "LATE_CHECKOUT") {
                            dataDict.is_late_checkout_only = true;
                        } else if (oldType === "QUEUED_ROOMS") {
                        	dataDict.is_queued_rooms_only = true;
                        }
                        else if (oldType === "VIP") {
                            dataDict.vip = true;
                        }
                        else {
                            dataDict.status = oldType;
                        }
                        // The pagination should be set to page=1. for navigations from dashboard buttons.
                        if ($stateParams.from_page === "DASHBOARD") {
                            RVSearchSrv.page = 1;
                        }

                        if ($stateParams.isBulkCheckoutSelected) {
                            var params = {
                                allow_open_balance_checkout: !!$stateParams.isAllowOpenBalanceCheckoutSelected,
                                per_page: RVSearchSrv.searchPerPage,
                                page: RVSearchSrv.page
                            };

                            return RVSearchSrv.fetchReservationsForBulkCheckout(params); 
                        } else {
                            // calling the webservice
                            return RVSearchSrv.fetch(dataDict, $stateParams.useCache);
                        }
                        
                    } else if ( !!$stateParams.useCache && oldType !== "RESET") {
                        return RVSearchSrv.fetch({}, $stateParams.useCache);
                    } else {
                        var results = [];

                        return results;
                    }
                }
            }
        });
        /**
        * IMPORTANT: 'rover.dashboardFromAdmin' state points to dashboard screen
        * It is needed for opening sub-menu popup actions('EOD' and 'postcharge') on navigating from admin to rover.
        * All future changes made in 'rover.dashboard' state are required for that state too
        **/
        $stateProvider.state('rover.dashboard', {
            url: '/dashboard',
            templateUrl: '/assets/partials/dashboard/rvDashboardRoot.html',
            controller: 'RVdashboardController',
            resolve: {
                dashBoarddata: function(RVDashboardSrv) {
                    return RVDashboardSrv.fetchDashboardDetails();
                },
                roomTypes: function(RVHkRoomStatusSrv) {
                    return RVHkRoomStatusSrv.fetchRoomTypes();
                }
            }
        });
        $stateProvider.state('rover.dashboard.manager', {
            url: '/manager/:onlyLoadAnalytics/:loadInNg1',
            templateUrl: '/assets/partials/dashboard/rvManagerDashboard.html',
            controller: 'RVmanagerDashboardController',
            resolve: {
                marketData: function(rvAnalyticsSrv) {
                    return rvAnalyticsSrv.fetchMarketCodes();
                },
                sourceData: function(rvAnalyticsSrv) {
                    return rvAnalyticsSrv.fetchSourceCodes();
                },
                segmentData: function(rvAnalyticsSrv) {
                    return rvAnalyticsSrv.fetchSegmantCodes();
                },
                originData: function(rvAnalyticsSrv) {
                    return rvAnalyticsSrv.fetchOriginCodes();
                }
            },
            params: {
                onlyLoadAnalytics: null,
                loadInNg1: null
            }
        });
        $stateProvider.state('rover.dashboard.frontoffice', {
            url: '/frontoffice/:onlyLoadAnalytics/:loadInNg1',
            templateUrl: '/assets/partials/dashboard/rvFrontDeskDashboard.html',
            params: {
                onlyLoadAnalytics: null,
                loadInNg1: null
            }
        });
        $stateProvider.state('rover.dashboard.housekeeping', {
            url: '/housekeeping/:onlyLoadAnalytics/:loadInNg1',  // TODO: check can we reduced it to hk?
            templateUrl: '/assets/partials/dashboard/rvHouseKeepingDashboard.html',
            params: {
                onlyLoadAnalytics: null,
                loadInNg1: null
            }
        });

        /**
        * adding extra state to be initiated when user is in admin screens
        **/
        $stateProvider.state('rover.dashboardFromAdmin', {
            url: '/dashboard/:type',
            templateUrl: '/assets/partials/dashboard/rvDashboardRoot.html',
            controller: 'RVdashboardController',
            resolve: {
                dashBoarddata: function(RVDashboardSrv) {
                    return RVDashboardSrv.fetchDashboardDetails();
                },
                roomTypes: function(RVHkRoomStatusSrv) {
                    return RVHkRoomStatusSrv.fetchRoomTypes();
                }
            },
             onEnter: function (ngDialog, $stateParams, dashBoarddata, jsMappings) {

               if ($stateParams.type === 'changeBussinessDate') {
                    jsMappings.fetchAssets(['endofday']).then(function() {
                        ngDialog.open({
                            template: '/assets/partials/endOfDay/rvEndOfDayModal.html',
                            controller: 'RVEndOfDayModalController'
                        });
                    });
               }
               else if ($stateParams.type === 'postCharge') {
                    jsMappings.fetchAssets(['postcharge', 'directives']).then(function() {
                        ngDialog.open({
                            template: '/assets/partials/postCharge/rvPostChargeV2.html',
                            controller: 'RVOutsidePostChargeController'
                        });
                    });
               }
               else if ($stateParams.type === 'currencyExchange') {
                    jsMappings.fetchAssets(['rover.financials']).then(function() {
                        ngDialog.open({
                            template: '/assets/partials/financials/currencyExchange/rvCurrencyExchange.html',
                            controller: 'RVCurrencyExchangeModalController'
                        });
                    });
               }

            }
        });

        /**
        * A state to load new angular app inside iframe, pass state params after stringifying
        **/
        $stateProvider.state('rover.angularIframe', {
            url: '/angularIframe/:route/:params',
            template: '<iframe ng-src="{{ifameURL}}" id="angular-iframe"></iframe>',
            controller: 'rvAngularIframeCtrl',
            params: {
                route: '',
                params: ''
            }
        });
});
