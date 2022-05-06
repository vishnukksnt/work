angular.module('stayCardModule', [])
    .config(function ($stateProvider, $urlRouterProvider, $translateProvider, $injector) {
        // define module-specific routes here/
        // +-----------------+--------------------------+
        // |            reservation                     |
        // |              +                             |
        // |              |                             |
        // | search   <---+----> staycard               |
        // |                       +                    |
        // |                       |                    |
        // |                       |                    |
        // |                       |                    |
        // |       maincard   <----+->  reservationcard |
        // |                                            |
        // +--------------------------------------------+

        $stateProvider.state('rover.reservation', {
            abstract: true,
            url: '/staycard',
            templateUrl: '/assets/partials/staycard/rvStaycard.html',
            controller: 'RVReservationMainCtrl', // staycardController',
            resolve: {
                loadPaymentMapping: function (jsMappings) {
                    return jsMappings.loadPaymentMapping();
                },
                loadPaymentModule: function (jsMappings, loadPaymentMapping) {
                    return jsMappings.loadPaymentModule();
                },
                baseSearchData: function (RVReservationBaseSearchSrv) {
                    return RVReservationBaseSearchSrv.fetchBaseSearchData();
                }
            },
            lazyLoad: function ($transition$) {
                return $transition$.injector().get('jsMappings')
                    .fetchAssets(['rover.reservation', 'rover.groups', 'rover.allotments',
                        'rover.accounts', 'rover.companycarddetails', 'directives', 'highcharts'], ['highcharts-ng']);
            }
        });


        $stateProvider.state('rover.reservation.search', {
            url: '/search',
            params: {
                guestId: null,
                selectedArrivalDate: null,
                selectedRoomTypeId: null,
                selectedRoomId: null,
                selectedRoomNo: null,
                startDate: null,
                fromState: null,
                selectedArrivalTime: null,
                selectedDepartureTime: null,
                numNights: null
            },
            templateUrl: '/assets/partials/reservation/rvBaseSearch.html',
            controller: 'RVReservationBaseSearchCtrl',
            resolve: {
                baseData: function (RVReservationSummarySrv) {
                    return RVReservationSummarySrv.fetchInitialData();
                },
                activeCodes: function (RVReservationBaseSearchSrv) {
                    return RVReservationBaseSearchSrv.getActivePromotions();
                },
                flyerPrograms: function (RVCompanyCardSrv) {
                    return RVCompanyCardSrv.fetchHotelLoyaltiesFfp();
                },
                loyaltyPrograms: function (RVCompanyCardSrv) {
                    return RVCompanyCardSrv.fetchHotelLoyaltiesHlps();
                },
                guestDetails: function (RVContactInfoSrv, $stateParams) {
                    var guestId = $stateParams.guestId,
                        guestDetails = {};

                    if (guestId) {
                        guestDetails = RVContactInfoSrv.getGuestDetailsById(guestId);
                    }
                    return guestDetails;
                }
            }
        });

        $stateProvider.state('rover.reservation.staycard', {
            abstract: true,
            url: '/reservation',
            templateUrl: '/assets/partials/reservation/rvMain.html',
            controller: 'staycardController',
            onExit: function ($rootScope) {
                $rootScope.stayCardStateBookMark = {
                    previousState: '',
                    previousStateParams: {}
                };
            }
        });

        $stateProvider.state('rover.reservation.staycard.mainCard', {
            abstract: true,
            url: '/mainCard',
            templateUrl: '/assets/partials/reservation/rvMainCard.html',
            controller: 'RVReservationMainCardCtrl'
        });

        $stateProvider.state('rover.reservation.staycard.mainCard.room-rates', {
            url: '/room-rates',
            params: {
                from_date: '',
                to_date: '',
                fromState: '',
                view: 'DEFAULT',
                company_id: {
                    value: null,
                    dynamic: true
                },
                travel_agent_id: {
                    value: null,
                    dynamic: true
                },
                group_id: null,
                borrow_for_groups: '',
                allotment_id: null,
                promotion_code: null,
                disable_back_staycard: '',
                adults: '',
                children: '',
                promotion_id: '',
                room_type_id: null,
                is_member: '',
                guestId: '',
                selectedRoomId: null,
                selectedRoomNo: null,
                arrivalTime: null,
                departureTime: null,
                numNights: null,
                selectedCurrencyId: '',
                isGroupDetachmentRequested: null
            },
            templateUrl: '/assets/partials/reservation/rvSelectRoomAndRate.html',
            controller: 'RVSelectRoomAndRateCtrl',
            resolve: {
                areReservationAddonsAvailable: function (RVReservationBaseSearchSrv, $stateParams) { // CICO-16874
                    return RVReservationBaseSearchSrv.hasAnyConfiguredAddons({
                        from_date: $stateParams.from_date,
                        to_date: $stateParams.to_date,
                        is_active: true
                    });
                },
                rates: function (RVRoomRatesSrv, $stateParams, RVReservationBaseSearchSrv) {
                    var params = {};

                    params.from_date = $stateParams.from_date;
                    params.to_date = $stateParams.to_date;
                    params.override_restrictions = $stateParams.override_restrictions;
                    params.adults = $stateParams.adults;
                    params.children = $stateParams.children;
                    if ($stateParams.company_id)
                        params.company_id = $stateParams.company_id;
                    if ($stateParams.travel_agent_id)
                        params.travel_agent_id = $stateParams.travel_agent_id;
                    if ($stateParams.group_id || $stateParams.allotment_id)
                        params.group_id = $stateParams.group_id || $stateParams.allotment_id;
                    if ($stateParams.promotion_code)
                        params.promotion_code = $stateParams.promotion_code;
                    if ($stateParams.promotion_id)
                        params.promotion_id = $stateParams.promotion_id;
                    if ($stateParams.room_type_id)
                        params.room_type_id = $stateParams.room_type_id;
                    if ($stateParams.is_member)
                        params.is_member = $stateParams.is_member;
                    if ($stateParams.selectedCurrencyId)
                        params.rate_currency_id = $stateParams.selectedCurrencyId;

                    var activeTab = RVReservationBaseSearchSrv.getRoomRatesDefaultView();

                    if (params.company_id || params.travel_agent_id || params.group_id || params.promotion_id || params.is_member) {
                        activeTab = 'RECOMMENDED';
                    }
                    RVRoomRatesSrv.setRoomAndRateActiveTab(activeTab);
                    return RVRoomRatesSrv.fetchRatesInitial(params);
                },
                ratesMeta: function (RVReservationBaseSearchSrv) {
                    return RVReservationBaseSearchSrv.fetchRatesMeta();
                },
                house: function (RVReservationBaseSearchSrv, $stateParams) {
                    return RVReservationBaseSearchSrv.fetchHouseAvailability({
                        from_date: $stateParams.from_date,
                        to_date: $stateParams.to_date
                    });
                },
                houseRestrictions: function (Toggles, RVReservationBaseSearchSrv, $stateParams) {
                    var isHerarchyRestrictionEnabled = ( Toggles.isEnabled('hierarchical_house_restrictions') || 
                                                Toggles.isEnabled('hierarchical_room_type_restrictions') ||
                                                Toggles.isEnabled('hierarchical_rate_type_restrictions') ||
                                                Toggles.isEnabled('hierarchical_rate_restrictions') );

                    if (isHerarchyRestrictionEnabled) {
                        return RVReservationBaseSearchSrv.fetchHouseRestrictions({
                            from_date: $stateParams.from_date,
                            to_date: $stateParams.to_date
                        });
                    }
                }
            }
        });

        $stateProvider.state('rover.reservation.staycard.mainCard.addons', {
            url: '/addons',
            templateUrl: '/assets/partials/reservation/rvAddonsList.html',
            controller: 'RVReservationAddonsCtrl',
            params: {
                from_date: '',
                to_date: '',
                reservation: 'DAILY',
                from_screen: '',
                rate_id: ''
            },
            resolve: {
                addonData: function (RVReservationAddonsSrv, $stateParams) {

                    var params = {};

                    params.from_date = $stateParams.from_date;
                    params.to_date = $stateParams.to_date;
                    params.is_active = true;
                    params.is_not_rate_only = true;
                    params.rate_id = $stateParams.rate_id;
                    return RVReservationAddonsSrv.fetchAddonData(params);
                }
            }
        });

        $stateProvider.state('rover.reservation.staycard.mainCard.summaryAndConfirm', {
            url: '/summaryAndConfirm',
            params: {
                reservation: 'DAILY',
                mode: 'OTHER'
            },
            templateUrl: '/assets/partials/reservation/rvSummaryAndConfirm.html',
            controller: 'RVReservationSummaryCtrl',
            resolve: {
                paymentMethods: function (RVReservationSummarySrv) {
                    return RVReservationSummarySrv.fetchPaymentMethods();
                }
            }
        });

        $stateProvider.state('rover.reservation.staycard.mainCard.reservationConfirm', {
            url: '/reservationConfirm/:id/:confirmationId',
            templateUrl: '/assets/partials/reservation/rvReservationConfirm.html',
            controller: 'RVReservationConfirmCtrl'
        });

        $stateProvider.state('rover.reservation.staycard.reservationcard', {
            abstract: true,
            url: '/reservationcard',
            templateUrl: '/assets/partials/reservationCard/rvReservationCard.html',
            controller: 'reservationCardController'
        });

        $stateProvider.state('rover.reservation.staycard.reservationcard.reservationdetails', {
            url: '/reservationdetails',
            templateUrl: '/assets/partials/reservationCard/rvReservationDetails.html',
            controller: 'reservationDetailsController',
            params: {
                id: null,
                confirmationId: null,
                isrefresh: true, // default to true; unless specified to read from cached response in service
                justCreatedRes: null,
                isFromCards: null,
                isOnlineRoomMove: null,
                isKeySystemAvailable: null,
                isFromTACommission: null,
                isFromGuestStatistics: null,
                isFromCardStatistics: null,
                isBulkCheckoutSelected: false,
                isAllowOpenBalanceCheckoutSelected: false,
                isGroupDetachmentRequested: null,
                isBulkCheckinSelected: null,
                isFromArTab: null                
            },
            resolve: {
                reservationListData: function (RVReservationCardSrv, $stateParams) {
                    var data = {
                        'reservationId': $stateParams.id,
                        'isRefresh': $stateParams.isrefresh
                    };

                    return RVReservationCardSrv.fetch(data);
                },
                reservationDetails: function (RVReservationCardSrv, $stateParams) {
                    var data = {
                        'confirmationNumber': $stateParams.confirmationId,
                        'isRefresh': $stateParams.isrefresh
                    };

                    return RVReservationCardSrv.fetchReservationDetails(data);
                },
                baseData: function (RVReservationSummarySrv) {
                    return RVReservationSummarySrv.fetchInitialData();
                },
                paymentTypes: function (RVPaymentSrv) {
                    return RVPaymentSrv.renderPaymentScreen();
                },
                reseravationDepositData: function (RVReservationCardSrv, $stateParams, $rootScope) {
                    return $rootScope.isStandAlone ? RVReservationCardSrv.fetchDepositDetails($stateParams.id) : {};
                },
                taxExempts: function(RVHotelDetailsSrv) {
                    return RVHotelDetailsSrv.fetchTaxExempts();
                }
            }
        });

        $stateProvider.state('rover.reservation.staycard.billcard', {
            url: '/billcard/:reservationId',
            templateUrl: '/assets/partials/bill/rvBillCard.html',
            controller: 'RVbillCardController',
            params: {
                clickedButton: '',
                userId: ''
            },
            resolve: {
                reservationBillData: function (RVBillCardSrv, $stateParams) {
                    return RVBillCardSrv.fetch($stateParams.reservationId);
                }
            },
            lazyLoad: function ($transition$) {
                return $transition$.injector().get('jsMappings')
                    .fetchAssets(['rover.reservation.staycard.billcard']);
            }
        });

        $stateProvider.state('rover.reservation.staycard.roomassignment', {
            url: '/roomassignment',
            params: {
                reservation_id: '',
                room_type: '',
                clickedButton: '',
                upgrade_available: '', 
                cannot_move_room: '',
                roomTypeId: ''
            },
            templateUrl: '/assets/partials/roomAssignment/rvRoomAssignment.html',
            controller: 'RVroomAssignmentController',
            resolve: {
                roomsList: function (RVRoomAssignmentSrv, $stateParams) {
                    var params = {
                        reservation_id: $stateParams.reservation_id,
                        page_no: 1,
                        per_page: 25,
                        room_types_ids: [$stateParams.roomTypeId],
                        use_default_guest_preferences: true
                    };

                    // params.room_type = $stateParams.room_type;
                    return RVRoomAssignmentSrv.getRoomsByRoomType(params);
                },
                roomPreferences: function (RVRoomAssignmentSrv, $stateParams) {
                    var params = {};

                    params.reservation_id = $stateParams.reservation_id;
                    return RVRoomAssignmentSrv.getPreferences(params);
                },
                roomUpgrades: function (RVUpgradesSrv, $stateParams) {
                    // check if roomupgrade is available
                    if ($stateParams.upgrade_available || $stateParams.upgrade_available === 'true') {
                        var params = {};

                        params.reservation_id = $stateParams.reservation_id;
                        return RVUpgradesSrv.getAllUpgrades(params);
                    }
                    else {
                        return [];
                    }

                }
            },
            lazyLoad: function ($transition$) {
                return $transition$.injector().get('jsMappings')
                    .fetchAssets(['rover.reservation.staycard.roomassignment', 'directives']);
            }
        });


        $stateProvider.state('rover.reservation.staycard.upgrades', {
            url: '/upgrades',
            params: {
                reservation_id: '',
                clickedButton: '',
                cannot_move_room: ''
            },
            templateUrl: '/assets/partials/upgrades/rvUpgrades.html',
            controller: 'RVUpgradesController',
            lazyLoad: function ($transition$) {
                return $transition$.injector().get('jsMappings')
                    .fetchAssets(['rover.reservation.staycard.roomassignment', 'directives']);
            }
        });

        // Change stay dates
        $stateProvider.state('rover.reservation.staycard.changestaydates', {
            url: '/changestaydates',
            params: {
                reservationId: '',
                confirmNumber: ''
            },
            templateUrl: '/assets/partials/changeStayDates/rvChangeStayDates.html',
            controller: 'RVchangeStayDatesController',
            resolve: {
                stayDateDetails: ['RVChangeStayDatesSrv', '$stateParams',
                    function (RVChangeStayDatesSrv, $stateParams) {
                        return RVChangeStayDatesSrv.fetchInitialData($stateParams.reservationId);
                    }]
            },
            lazyLoad: function ($transition$) {
                return $transition$.injector().get('jsMappings')
                    .fetchAssets(['changestaydates', 'directives'], ['ui.calendar']);
            }
        });

        $stateProvider.state('rover.reservation.staycard.billcard.details', {
            url: '/',
            params: {
                billNo: 1
            },
            templateUrl: '/assets/partials/bill_details.html',
            controller: 'billDetailsController'
        });

        $stateProvider.state('rover.reservation.staycard.activitylog', {
            url: '/activitylog/:id',
            templateUrl: '/assets/partials/activityLog/rvActivityLog.html',
            controller: 'RVActivityLogCtrl',
            resolve: {
                activityLogResponse: function (RVActivityLogSrv, $stateParams) {
                    if (RVActivityLogSrv) {
                        return RVActivityLogSrv.fetchActivityLog($stateParams.id);
                    } else {
                        return {};
                    }
                },
                activeUserList: function (RVActivityLogSrv) {
                    return RVActivityLogSrv.fetchActiveUsers();
                }
            },
            lazyLoad: function ($transition$) {
                return $transition$.injector().get('jsMappings')
                    .fetchAssets(['rover.reservation.staycard.activitylog', 'directives']);
            }
        });

        $stateProvider.state('rover.actionsManager', {
            url: '/actions',
            params: {
                restore: ''
            },
            templateUrl: '/assets/partials/actionsManager/rvActionsManager.html',
            controller: 'RVActionsManagerController',
            resolve: {
                departments: function (rvActionTasksSrv) {
                    return rvActionTasksSrv.fetchDepartments();
                }
            },
            lazyLoad: function ($transition$) {
                return $transition$.injector().get('jsMappings')
                    .fetchAssets(['rover.actionsManager', 'directives']);
            }
        });
        
        $stateProvider.state('rover.quicktext', {
            url: '/quicktext',
            templateUrl: '/assets/partials/quicktext/rvQuickText.html',
            controller: 'RVQuickTextController',
            resolve: {
                quicktextdata: function (rvQuickTextSrv) {
                    return rvQuickTextSrv.fetchQuickTextData();
                }
            },
            lazyLoad: function ($transition$) {
                return $transition$.injector().get('jsMappings')
                    .fetchAssets(['rover.quicktext', 'directives']);
            }
        });
    });
