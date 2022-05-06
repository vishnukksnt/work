angular.module('overBookingModule', []).
    config(function($stateProvider, $urlRouterProvider, $translateProvider) {
        // define module-specific routes here
        $stateProvider.state('rover.overbooking', {
            url: '/overbooking',
            templateUrl: '/assets/partials/overBooking/rvOverBookingMain.html',
            controller: 'RvOverBookingMainCtrl',
            params: {
                start_date: null
            },
            resolve: {
                completeRoomTypeListData: function(rvOverBookingSrv) {
                    return rvOverBookingSrv.getAllRoomTypes();
                },
                overBookingGridData: function(
                    rvOverBookingSrv, completeRoomTypeListData, $rootScope,
                    $stateParams) {
                    var startDate = '',
                        DATE_SHIFT_LIMIT = 13;

                    if ($stateParams.start_date) {
                        startDate = $stateParams.start_date;
                    }
                    else {
                        startDate = $rootScope.businessDate;
                    }

                    return rvOverBookingSrv.fetchOverBookingGridData({
                        'start_date': moment(tzIndependentDate(startDate)).
                            format('YYYY-MM-DD'),
                        'end_date': moment(tzIndependentDate(startDate)).
                            add(DATE_SHIFT_LIMIT, 'd').
                            format('YYYY-MM-DD'),
                        'show_rooms_left_to_sell': true,
                        'room_type_ids': _.pluck(
                            completeRoomTypeListData.isCheckedTrue, 'id')
                    });

                }
            },
            lazyLoad: function($transition$) {
                return $transition$.injector().get('jsMappings').
                    fetchAssets(['rover.overbooking', 'directives']);
            }
        });
    });