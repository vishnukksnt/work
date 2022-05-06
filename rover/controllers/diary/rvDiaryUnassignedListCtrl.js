angular.module('sntRover')
.controller('rvDiaryUnassignedListController',
    [
        '$scope',
        '$rootScope',
        'rvDiarySrv',
        function($scope, $rootScope, rvDiarySrv) {
            var reservationCache = [];

            /**
             * Function to fetch the unassigned reservations on loading the controller
             * 
             */
            var fetchUdReservationList = function () {
                    var successCallBackFetchList = function(data) {
                        $scope.errorMessage = '';
                        reservationCache = data;
                        $scope.arrangeReservationList();
                    },
                    postData = {
                        'date': $scope.gridProps.filter.arrival_date
                    },
                    options = {
                        params: postData,
                        successCallBack: successCallBackFetchList
                    };
    
                    $scope.callAPI(rvDiarySrv.fetchUnassignedRoomList, options);
                }, __getTimeDiff = function(arrivalDate, arrivalTime, departureDate, departureTime) {
                    var arrival = {},
                        departure = {},
                        dateParts,
                        timeParts,
                        fullArrivalDate,
                        fullDepartureDate,
                        difference,
                        hour_difference,
                        min_difference;
            
                    var arrivalTimeFix, departureTimeFix;
            
                    if ( ! arrivalTime || ! departureTime ) {
                        arrivalTimeFix = '00:00';
                        departureTimeFix = '04:00';
                    } else {
                        arrivalTimeFix = arrivalTime;
                        departureTimeFix = departureTime;
                    }
            
                    dateParts = arrivalDate.split('-');
                    arrival.year = parseInt( dateParts[0] );
                    arrival.month = parseInt( dateParts[1] ) - 1;
                    arrival.date = parseInt( dateParts[2] );
                    /**/
                    timeParts = arrivalTimeFix.split(':');
                    arrival.hour = parseInt( timeParts[0]);
                    arrival.mins = parseInt( timeParts[1]);
            
                    dateParts = departureDate.split('-');
                    departure.year = parseInt( dateParts[0] );
                    departure.month = parseInt( dateParts[1] ) - 1;
                    departure.date = parseInt( dateParts[2] );
                    /**/
                    timeParts = departureTimeFix.split(':');
                    departure.hour = parseInt( timeParts[0] );
                    departure.mins = parseInt( timeParts[1] );
            
                    fullArrivalDate = new Date(arrival.year, arrival.month, arrival.date, arrival.hour, arrival.mins);
                    fullDepartureDate = new Date(departure.year, departure.month, departure.date, departure.hour, departure.mins);
            
                    difference = Math.abs( fullDepartureDate - fullArrivalDate );
                    hour_difference = Math.floor(difference / 36e5);
                    min_difference = Math.floor((difference % 36e5) / 6e4);
            
                    return {
                        hh: hour_difference,
                        mm: min_difference,
                        hhs: hour_difference + 'h'
                    };
                },
                deselectReservation = function() {
                    $scope.selectedIndex = null;
                    $scope.gridProps.unassignedRoomList.isItemSelected = false;
                    $scope.clearAvailability();
                    $scope.resetEdit();
                    $scope.renderGrid();
                };

            BaseCtrl.call(this, $scope);

            $scope.businessDate = $rootScope.businessDate;
            $scope.queryString = '';

            /**
             * Listener for Initializing the unassigned reservations list
             */
            $scope.addListener('INITIALIZE_UNASSIGNED_LIST', fetchUdReservationList);

            /**
             * Listener for closing the unassigned reservations panel
             */
            $scope.addListener('CLOSE_UD_RESERVATION_PANEL', function() {
                reservationCache = [];
                $scope.clearList();
                deselectReservation();
            });

            /**
             * Listener for deselecting the selected unassigned reservation and reseting the grid
             */
            $scope.addListener('DESELECT_UNASSIGNED_RESERVATION', deselectReservation);

            /**
             * Function to handle the unassigned reservation selection
             */
            $scope.clickedUnassignedReservation = function(reservation) {
                if ($scope.selectedIndex === reservation.reservation_id) {
                    deselectReservation();
                }
                else {
                    $scope.selectedIndex = reservation.reservation_id;
                    $scope.gridProps.unassignedRoomList.isItemSelected = true;
                    var params = {
                        arrival_date: reservation.arrival_date,
                        arrival_time: reservation.arrival_time,
                        departure_date: reservation.departure_date,
                        departure_time: reservation.departure_time,
    
                        reservationId: reservation.reservation_id,
                        adults: reservation.adults,
                        children: reservation.children,
                        infants: reservation.infants,
                        rate_id: reservation.rate_id,
                        room_type_id: reservation.room_type_id,
                        is_hourly: reservation.is_hourly,
    
                        stay_span: __getTimeDiff(reservation.arrival_date, reservation.arrival_time, reservation.departure_date, reservation.departure_time)
                    };
    
                    $scope.$emit('UNASSIGNED_RESERVATION_SELECTED', params, reservation);
                }
            };

            /**
             * UI Search reservations
             */
            $scope.arrangeReservationList = function() {
                $scope.currentBookings = [];
                $scope.futureBookings = [];
                var displayResults = [];

                if ($scope.queryString && $scope.queryString.length > 0) {
                    displayResults = reservationCache.filter(function(reservation) {
                        // check if the querystring is number or string
                        return (isNaN($scope.queryString) &&
                            reservation.primary_guest.toUpperCase().includes($scope.queryString.toUpperCase())) ||
                            (!isNaN($scope.queryString) &&
                            reservation.confirmation_number.toString().includes($scope.queryString));
                    });
                }
                else {
                    displayResults = reservationCache;
                }
                angular.forEach(displayResults, function(reservation) {
                    if (moment($scope.gridProps.filter.arrival_date).format('YYYY-MM-DD') === reservation.arrival_date) {
                        $scope.currentBookings.push(reservation);
                    }
                    else {
                        $scope.futureBookings.push(reservation);
                    }
                });
            };

            /**
             * Check to show reservation list block
             * @return boolean
             */
            $scope.bookingsPresent = function() {
                return reservationCache.length !== 0;
            };

            /**
             * Return next date
             */
            $scope.getNextDate = function(forHeader) {
                var nextDate = moment($scope.gridProps.filter.arrival_date).add(1, 'day');

                return forHeader ? nextDate.format('DD MMM YYYY') : nextDate.format('YYYY-MM-DD');
            };

            /**
             * Return current date
             */
            $scope.getActiveDate = function(forHeader) {
                var activeDate = moment($scope.gridProps.filter.arrival_date);

                return forHeader ? activeDate.format('DD MMM YYYY') : activeDate.format('YYYY-MM-DD');
            };

            /**
             * Clear the serch results and reset the list
             */
            $scope.clearList = function() {
                $scope.queryString = '';
                $scope.arrangeReservationList();
            };
        }
    ]
);
