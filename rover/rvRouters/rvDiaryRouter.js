angular
.module('diaryModule', [])
.config(function($stateProvider, $urlRouterProvider, $translateProvider) {
    $stateProvider.state('rover.diary', {
        url: '/diary/?reservation_id&checkin_date&origin&is_nightly_reservation',
        templateUrl: '/assets/partials/diary/rvDiary.html',
        controller: 'rvDiaryCtrl',
        resolve: {
            propertyTime: function(RVReservationBaseSearchSrv, $stateParams) {
                if (!!$stateParams.checkin_date) {
                    return RVReservationBaseSearchSrv.fetchCurrentTime($stateParams.checkin_date);
                }
                
                return RVReservationBaseSearchSrv.fetchCurrentTime();
            },
            baseSearchData: function(RVReservationBaseSearchSrv) {
                return RVReservationBaseSearchSrv.fetchBaseSearchData();
            },
            payload: function($rootScope, rvDiarySrv, $stateParams, $vault, baseSearchData, propertyTime) {
                var start_date = propertyTime.hotel_time.date;

                if (!!$stateParams.checkin_date) {
                    start_date = $stateParams.checkin_date;
                }
                return rvDiarySrv.load(rvDiarySrv.properDateTimeCreation(start_date), rvDiarySrv.ArrivalFromCreateReservation());
            },
            houseEventsCount: function($rootScope, $filter, rvHouseEventsListSrv, propertyTime) {
                var params = {
                    start_date: $filter('date')(propertyTime.hotel_time.date, $rootScope.dateFormatForAPI),
                    end_date: $filter('date')(propertyTime.hotel_time.date, $rootScope.dateFormatForAPI)
                };

                return rvHouseEventsListSrv.fetchHouseEventsCount(params);
            }
        },
        lazyLoad: function ($transition$) {
            return $transition$.injector().get('jsMappings')
                .fetchAssets(['react.files', 'rover.diary', 'directives'], ['react']);
        }
    });

    $stateProvider.state('rover.nightlyDiary', {
        url: '/nightlyDiary/?reservation_id&room_id&start_date&origin&confirm_id&action',
        templateUrl: '/assets/partials/nightlyDiary/rvNightlyDiary.html',
        controller: 'rvNightlyDiaryMainController',
        resolve: {
            roomsList: function(RVNightlyDiarySrv, $rootScope, $stateParams) {
                var params = {};

                if ($stateParams.origin === 'STAYCARD') {
                    params = RVNightlyDiarySrv.getCache();
                }
                else {
                    params.page = 1;
                    params.per_page = 50;
                }
                return RVNightlyDiarySrv.fetchRoomsList(params);
            },
            datesList: function(RVNightlyDiarySrv, $rootScope, $stateParams) {
                var params = {};

                if ($stateParams.origin === 'STAYCARD') {
                    params = RVNightlyDiarySrv.getCache();
                }
                else {
                    if (!!$stateParams.start_date) {
                        params.start_date = $stateParams.start_date;
                    }
                    else {
                        params.start_date = moment(tzIndependentDate($rootScope.businessDate)).subtract(1, 'days')
                            .format($rootScope.momentFormatForAPI);
                    }
                    params.no_of_days = 7;
                }
                return RVNightlyDiarySrv.fetchDatesList(params);
            },
            reservationsList: function(RVNightlyDiarySrv, $rootScope, $stateParams) {
                var params = {};

                if ($stateParams.origin === 'STAYCARD') {
                    params = RVNightlyDiarySrv.getCache();
                }
                else {
                    params.start_date = $stateParams.start_date || moment(tzIndependentDate($rootScope.businessDate)).subtract(1, 'days')
                        .format($rootScope.momentFormatForAPI);
                    params.no_of_days = 7;
                    params.page = 1;
                    params.per_page = 50;
                }
                return RVNightlyDiarySrv.fetchReservationsList(params);
            },
            unassignedReservationList: function(RVNightlyDiarySrv, $rootScope, $stateParams) {
                var params = {}, cacheData = {};

                if ($stateParams.origin === 'STAYCARD') {
                    cacheData = RVNightlyDiarySrv.getCache();
                    params.date = cacheData.start_date;
                }
                else {
                    if (!!$stateParams.start_date) {
                        params.date = $stateParams.start_date;
                    }
                    else {
                        params.date = $rootScope.businessDate;
                    }
                }
                
                return RVNightlyDiarySrv.fetchUnassignedReservationList(params);
            }
        },
        lazyLoad: function($transition$) {
            return $transition$.injector().get('jsMappings')
                .fetchAssets(['react.files', 'redux.files', 'rover.nightlyDiary', 'directives'], ['react']);
        }
    });
});
