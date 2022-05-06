angular.module('allotmentModule', [])
.config([
    '$stateProvider',
    '$urlRouterProvider',
    '$translateProvider',
    function($stateProvider, $urlRouterProvider, $translateProvider) {
    // define module-specific routes here
        // group
        $stateProvider.state('rover.allotments', {
            url: '/allotments',
            abstract: true,
            templateUrl: '/assets/partials/allotments/rvAllotmentRoot.html',
            params: {
                origin: ''
            },
            controller: 'rvAllotmentRootCtrl',
            resolve: {
                allotmentAssets: function(jsMappings) {
                    return jsMappings.fetchAssets(['rover.allotments', 'directives']);
                }
            }
        });

        // company card details
        $stateProvider.state('rover.allotments.search', {
            url: '/search',
            templateUrl: '/assets/partials/allotments/search/rvAllotmentSearch.html',
            controller: 'rvAllotmentSearchCtrl',
            resolve: {
                // to tackle from coming admin app to rover, see the injection in next resolve function
                businessDate: ['rvAllotmentSrv', 'allotmentAssets', function(rvAllotmentSrv, allotmentAssets) {
                    return rvAllotmentSrv.fetchHotelBusinessDate();
                }],
                // to tackle from coming admin app to rover
                initialAllotmentListing: ['rvAllotmentSrv', 'businessDate', 'allotmentAssets',
                    function(rvAllotmentSrv, businessDate, allotmentAssets) {
                        // as per CICO-13899, initially we are looking for groups which has from & to date equal
                        // to business date
                        var params = {
                            'query': '',
                            'from_date': businessDate.business_date,
                            'to_date': '',
                            'per_page': rvAllotmentSrv.DEFAULT_PER_PAGE,
                            'page': rvAllotmentSrv.DEFAULT_PAGE
                        };

                        return rvAllotmentSrv.getAllotmentList(params);
                    }
                ]
            }
        });

        // group summary : CICO-12790
        $stateProvider.state('rover.allotments.config', {
            url: '/config',
            templateUrl: '/assets/partials/allotments/rvAllotmentConfiguration.html',
            controller: 'rvAllotmentConfigurationCtrl',
            params: {
                id: 'NEW_ALLOTMENT',
                activeTab: 'SUMMARY',
                newAllotmentName: ''
            },
            resolve: {
                loadPaymentMapping: function (jsMappings) {
                    return jsMappings.loadPaymentMapping();
                },
                loadPaymentModule: function (jsMappings, loadPaymentMapping) {
                    return jsMappings.loadPaymentModule();
                },
                // to tackle from coming admin app to rover
                summaryData: function(rvAllotmentConfigurationSrv, $stateParams, allotmentAssets, loadPaymentModule) {
                    var isInAddMode = ($stateParams.id === "NEW_ALLOTMENT");
                    var params = {
                        allotmentId: $stateParams.id
                    };

                    return rvAllotmentConfigurationSrv.getAllotmentSummary (params);
                },
                holdStatusList: function (rvAllotmentConfigurationSrv, allotmentAssets, loadPaymentModule) {
                    var params = {
                        is_group: false
                    };

                    return rvAllotmentConfigurationSrv.getHoldStatusList (params);
                },
                hotelSettings: function (RVReservationBaseSearchSrv, allotmentAssets) {
                    return RVReservationBaseSearchSrv.fetchHotelReservationSettings();
                }

            }

        });
}]);
