angular.module('sntRover').service('rvAnalyticsSrv', ['$q', 'rvBaseWebSrvV2', function($q, rvBaseWebSrvV2) {

    // This flag is used to understand the required APIs are called
    var calledHKApis = false;

    var that = this;

    // Variables for API returned data
    that.activeReservations = [];
    that.yesterdaysReservations = [];
    that.roomStatuses = null;
    that.selectedRoomType = "";
    that.hotelCheckinTime = null;
    that.hotelCheckoutTime = null;
    that.roomTypesWithShortageData = [];

    this.foChartFilterSet =  {};
    this.managerChartFilterSet = {};
    this.resetChartFilterSet = function () {
        that.selectedRoomType = "";
        that.foChartFilterSet = {
            showRemainingReservations: false,
            showPreviousDayData: false
        };
        that.managerChartFilterSet = {
            chartType: "occupancy",
            showLastYearData: false,
            lastyearType: 'SAME_DATE_LAST_YEAR',
            filtersSelected: {
                filters: {
                    room_type_id: [],
                    market_id: [],
                    source_id: [],
                    booking_origin_id: [],
                    segment_id: []
                }
            },
            aggType: "",
            gridViewActive: "",
            selectedSavedFilter: "",
            lineChartActive: false,
            datesToCompare: []
        };
    };
    /*
     * Function To Fetch Active Reservation for that day
     */
    this.fetchActiveReservation = function(params) {

        // Webservice calling section
        var deferred = $q.defer();
        var url = 'redshift/analytics/active_reservations';

        rvBaseWebSrvV2.getJSON(url, params)
            .then(function(data) {
                
                deferred.resolve(data);
            }, function(data) {
                deferred.reject(data);
            });
        return deferred.promise;
    };

    /*
     * Function To Fetch Current Room Status
     */
    this.fetchRoomStatus = function(params) {

        // Webservice calling section
        var deferred = $q.defer();
        var url = 'redshift/analytics/room_status';

        rvBaseWebSrvV2.getJSON(url, params)
            .then(function(data) {

                deferred.resolve(data);
            }, function(data) {
                deferred.reject(data);
            });
        return deferred.promise;
    };

    var getVacantRooms = function(activeReservations, rooms) {
        var assignedRoomNumbers = activeReservations.filter(function(reservation) {
            return reservation.reservation_status === 'CHECKEDIN';
        }).map(function(reservation) {
            return reservation.arrival_room_number;
        });

        rooms = rooms.filter(function(room) {
            return !assignedRoomNumbers.includes(room.room_number);
        });

        return rooms;
    };

    this.calculateShortage = function(rooms, roomType, date) {

        var reservations = roomType ? that.filterReservationsByRoomType(that.activeReservations, roomType) : that.activeReservations;
        var inspectedRooms = getInspectedRooms(rooms);
        var inspectedVacantRooms = getVacantRooms(reservations, inspectedRooms);
        var pendingArrivals = reservations.filter(function(reservation) {
            return reservation.arrival_date === date && reservation.reservation_status === 'RESERVED';
        }).length;
        var pendingDepartures = reservations.filter(function(reservation) {
            return reservation.departure_date === date && reservation.reservation_status === 'CHECKEDIN';
        }).length;
        var cleanCount = getCleanRooms(rooms).length;
        var dirtyCount = getDirtyRooms(rooms).length;
        var pickupCount = getPickupRooms(rooms).length;
        var shortage = 0;
        var overBooking = 0;
        
        // Shortage is to be collected based on available rooms in a room type those are vacant and pending departures
        if (pendingArrivals > inspectedVacantRooms.length) {
            var availableRoomsInRoomType = (cleanCount + dirtyCount + pickupCount) + pendingDepartures;

            if (availableRoomsInRoomType > (pendingArrivals - inspectedVacantRooms.length)) {
                shortage = pendingArrivals - inspectedVacantRooms.length;
            } else {
                shortage = availableRoomsInRoomType;
                overBooking = pendingArrivals - (inspectedVacantRooms.length + availableRoomsInRoomType);
            }
        }

        return {
            shortage: shortage,
            overBooking: overBooking
        };
    };

    var calculateRoomShortageByRoomType = function(date) {
        var roomTypes = _.groupBy(that.roomStatuses, 'room_type');
        var rooTypeConf = [];

        _.each(roomTypes, function(rooms, roomType) {
            var shortageData = that.calculateShortage(rooms, roomType, date);

            that.roomTypesWithShortageData.push({
                "code": roomType,
                "shortage": shortageData.shortage,
                "overBooking": shortageData.overBooking
            });
        });
    };

    var lastUpdatedTimeForReservationApis;
    
    this.initRoomAndReservationApis = function(params) {

        var deferred = $q.defer();
        var isFromFrontDesk = params.isFromFrontDesk;

        if ((!params.loadNewData && that.activeReservations && that.roomStatuses) &&
            (!isFromFrontDesk || that.yesterdaysReservations)) {
            deferred.resolve({
                lastUpatedTime: lastUpdatedTimeForReservationApis
            });
        } else {
            var promises = [];

            promises.push(that.fetchActiveReservation(params).then(function(data) {
                that.activeReservations = data;
            }));

            if (isFromFrontDesk) {
                var yesterday = moment(params.date).subtract(1, 'days')
                    .format('YYYY-MM-DD');

                promises.push(that.fetchActiveReservation({
                    date: yesterday
                }).then(function(data) {
                    that.yesterdaysReservations = data;
                }));
            }
            promises.push(that.fetchRoomStatus(params).then(function(data) {
                that.roomStatuses = data;
            }));

            $q.all(promises).then(function() {
                deferred.resolve();
            });
        }

        return deferred.promise;

    };

    /*
     * Apply filter on active reservations
     */
    this.filteredReservations = function() {
        var reservations = that.activeReservations;
        // Filter reservations by room type
        if (that.selectedRoomType) {
            reservations = that.filterReservationsByRoomType(reservations, that.selectedRoomType);
        };
        return reservations;
    };

    /*
     * Filtered yesterdays reservations
     */
    this.filteredYesterdaysReservations = function() {
        var reservations = that.yesterdaysReservations;
        // Filter reservations by room type
        if (that.selectedRoomType) {
            reservations = that.filterReservationsByRoomType(reservations, that.selectedRoomType);
        };
        return reservations;
    };

    this.filterdRoomStatuses = function() {
        var rooms = that.roomStatuses;
        // Filter reservations by room type
        if (that.selectedRoomType) {
            rooms = that.roomStatuses.filter(function(room) {
                return room.room_type === that.selectedRoomType;
            });
        }
        return rooms;
    };

    /*
     * When controller initialize set the hotel checkin and checkout time
     */
    this.setHotelCiCoTime = function(hotelDetails) {
        that.hotelCheckinTime = hotelDetails.hotel_checkin_time;
        that.hotelCheckoutTime = hotelDetails.hotel_checkout_time;
    };

    /*
     * This function will return the data structure for HK Work Priority
     */
    this.hkWorkPriority = function(date) {
        var deferred = $q.defer();

        constructHkWorkPriority(deferred, date);

        return deferred.promise;
    };

    /*
     * This function will return the data structure for HK Work Priority
     */
    this.hkOverview = function(date, isArrivalsManagement) {
        var deferred = $q.defer();

        constructHkOverview(deferred, date, isArrivalsManagement);

        return deferred.promise;
    };

    var constructHkOverview = function(deferred, date, isArrivalsManagement) {
        var hkOverview = {
            dashboard_type: 'house_keeping_overview',
            label: 'AN_HOUSEKEEPING_OVER_VIEW',
            data: []
        };
        var chartType = isArrivalsManagement ? 'ARRIVAL_MANAGEMENT' : 'OVERVIEW';
        var reservations = that.filteredReservations();
        var rooms = that.filterdRoomStatuses();

        // Pushing arrivals data structure
        hkOverview.data.push(buildArrivals(reservations, date, !isArrivalsManagement));
        // Pushing departure data structure
        hkOverview.data.push(buildDepartures(reservations, date, !isArrivalsManagement));
        // Pushing Stayovers data structure
        hkOverview.data.push(buildStayOvers(reservations, rooms, date));
        // Pushing vacant data structure
        hkOverview.data.push(buildVacants(reservations, rooms, chartType, date));
        calculateRoomShortageByRoomType(date);
        deferred.resolve(hkOverview);
    };

    /*
     * Moved the complex data structure building to front-end to help server to scale by using more load on UI
     */
    var constructHkWorkPriority = function(deferred, date) {
        var workPriority = {
            dashboard_type: 'work_priority',
            label: 'AN_WORK_PRIORITY_CHART',
            data: []
        };

        var reservations = that.filteredReservations();

        var rooms = that.filterdRoomStatuses();

        // Pushing arrivals data structure
        workPriority.data.push(buildArrivals(reservations, date, false));
        // Pushing vacant data structure
        workPriority.data.push(buildVacants(reservations, rooms, 'WORK_PRIORITY', date));
        // Pushing departure data structure
        workPriority.data.push(buildDepartures(reservations, date, false));
        calculateRoomShortageByRoomType(date);
        deferred.resolve(workPriority);
    };

    var buildDepartures = function(activeReservations, date, overview) {
        var departures = activeReservations.filter(function(reservation) {
            return reservation.departure_date === date;
        });
        var departedCount = departures.filter(function(reservation) {
            return reservation.reservation_status === 'CHECKEDOUT';
        }).length;

        var lateCheckoutCount = departures.filter(function(reservation) {
            return reservation.reservation_status === 'CHECKEDIN' && that.isLateCheckout(reservation);
        }).length;

        var remainingCount = departures.length - lateCheckoutCount - departedCount;
        var departues = {
            type: 'departures',
            label: 'AN_DEPARTURES',
            contents: {
                left_side: [{
                    type: 'perfomed',
                    count: departedCount,
                    label: 'AN_PERFOMED'
                }],
                right_side: []
            }
        };

        departues.contents.right_side.push({
            type: 'pending',
            count: remainingCount,
            label: 'AN_PENDING'
        });

        if (!overview) {
            departues.contents.right_side.push({
                type: 'late_checkout',
                count: lateCheckoutCount,
                label: 'AN_LATE_CHECKOUT'
            });
        }

        return departues;
    };

    var buildVacants = function(activeReservations, roomStatuses, chartType, date) {
        var rooms = roomStatuses;
        var dataType = 'rooms';
        var dataLabel = 'AN_ROOMS';

        rooms = getVacantRooms(activeReservations, rooms);

        if (chartType === 'WORK_PRIORITY') {
            dataType = 'vacant';
            dataLabel = 'AN_VACANT';
        }

        var inspectedCount = getInspectedRooms(rooms).length;

        var cleanCount = getCleanRooms(rooms).length;

        var dirtyCount = getDirtyRooms(rooms).length;

        var pickupCount = getPickupRooms(rooms).length;

        var vacantRoomsData = {
            type: dataType,
            label: dataLabel
        };

        if (chartType === 'OVERVIEW') {
            vacantRoomsData.contents = {
                left_side: [{
                    type: 'clean',
                    count: cleanCount,
                    label: 'AN_CLEAN'
                }, {
                    type: 'inspected',
                    count: inspectedCount,
                    label: 'AN_INSPECTED'
                }],
                right_side: [{
                    type: 'dirty',
                    count: dirtyCount,
                    label: 'AN_DIRTY'
                }, {
                    type: 'pickup',
                    count: pickupCount,
                    label: 'PICKUP'
                }]
            };
        } else {
            vacantRoomsData.contents = {
                left_side: [{
                    type: 'dirty',
                    count: dirtyCount,
                    label: 'AN_DIRTY'
                }, {
                    type: 'pickup',
                    count: pickupCount,
                    label: 'PICKUP'
                }, {
                    type: 'clean',
                    count: cleanCount,
                    label: 'AN_CLEAN'
                }],
                right_side: [{
                    type: 'inspected',
                    count: inspectedCount,
                    label: 'AN_INSPECTED'
                }]
            };
            if (chartType === 'WORK_PRIORITY' || chartType === 'ARRIVAL_MANAGEMENT') {
                var calulatedShortage = that.calculateShortage(rooms, that.selectedRoomType, date);

                var shortage = calulatedShortage.shortage;
                var overBooking = calulatedShortage.overBooking;


                if (shortage > 0 && chartType === 'WORK_PRIORITY') {
                    var pendingInspectedRooms = {
                        type: "pending_inspected_rooms",
                        count: shortage
                    };

                    vacantRoomsData.contents.right_side.push(pendingInspectedRooms);
                } else if (overBooking > 0 && chartType === 'ARRIVAL_MANAGEMENT'){
                    var pendingOverBookedRooms = {
                        type: "overbooked_rooms",
                        count: overBooking
                    };

                    vacantRoomsData.contents.right_side.push(pendingOverBookedRooms);
                }
            }
        }
        return vacantRoomsData;
    };

    var buildArrivals = function(activeReservations, date, overview) {
        var arrivals = activeReservations.filter(function(reservation) {
            return reservation.arrival_date === date;
        }); // Performed checkin that day

        var perfomedCount = arrivals.filter(function(reservation) {
            return reservation.reservation_status === 'CHECKEDIN' ||
            reservation.reservation_status === 'CHECKEDOUT';
        }).length;

        var earlyCheckinCount = 0;

        var arrivalsData = {
            type: 'arrivals',
            label: 'AN_ARRIVALS',
            contents: {
                left_side: [{
                    type: 'perfomed',
                    count: perfomedCount,
                    label: 'AN_PERFOMED'
                }],
                right_side: []
            }
        }; // For work priority we need to calculate immediate arrivals

        if (!overview) {
            earlyCheckinCount = arrivals.filter(function(reservation) {
                return reservation.reservation_status === 'RESERVED' && that.isEarlyCheckin(reservation);
            }).length;
            arrivalsData.contents.right_side.push({
                type: 'early_checkin',
                count: earlyCheckinCount,
                label: 'AN_EARLY_CHECKIN'
            });
        }

        var remainingCount = arrivals.length - perfomedCount - earlyCheckinCount;

        arrivalsData.contents.right_side.push({
            type: 'remaining',
            count: remainingCount,
            label: 'AN_REMAINING'
        });
        return arrivalsData;
    };

    var buildStayOvers = function(activeReservations, roomStatuses, date) {
        var stayOvers = getStayOvers(activeReservations, date);

        var cleanAndInspectedRooms = getCleanAndInspectedRooms(roomStatuses);

        var cleanAndInspectedStayOversCount = stayOvers.filter(function(reservation) {
            return cleanAndInspectedRooms.includes(reservation.arrival_room_number);
        }).length;

        var dirtyOrPickupRoomsCount = stayOvers.length - cleanAndInspectedStayOversCount;
        
        return {
            type: 'stayovers',
            label: 'AN_STAYOVERS',
            contents: {
                left_side: [{
                    type: 'perfomed',
                    label: 'AN_PERFOMED',
                    count: cleanAndInspectedStayOversCount
                }],
                right_side: [{
                    type: 'remaining',
                    label: 'AN_REMAINING',
                    count: dirtyOrPickupRoomsCount
                }]
            }
        };
    };

    /*
     * Function to determine if a reservation is early checkin
     */
    this.isEarlyCheckin = function(reservation) {
        var eta = moment(reservation.eta_hz);
        var hotelStdCheckinTime = moment(that.hotelCheckinTime);

        if (hotelStdCheckinTime.hours() > eta.hours()) {
            return true;
        } else if (hotelStdCheckinTime.hours() === eta.hours()) {
            return hotelStdCheckinTime.minutes() > eta.minutes();
        }
        return false;
    };

    /*
     * Function to determine if a reservation is late checkout
     */
    this.isLateCheckout = function(reservation) {
        var etd = moment(reservation.etd_hz);
        var hotelStdCheckoutTime = moment(that.hotelCheckoutTime);

        if (hotelStdCheckoutTime.hours() < etd.hours()) {
            return true;
        } else if (hotelStdCheckoutTime.hours() === etd.hours()) {
            return hotelStdCheckoutTime.minutes() < etd.minutes();
        }
        return false;
    };

    /*
     * Function to determine if a reservation is VIP or not
     */
    this.isVip = function(reservation) {
        return reservation.vip === 't';
    };

    this.filterReservationsByRoomType = function(reservations, roomType) {
      return reservations.filter(function(reservation) {
          return reservation.arrival_room_type === roomType || reservation.departure_room_type === roomType;
      });
    };

    /*
     * This method is to get the reservations based on filters
     */
    this.getReservations = function(filterArgs) {
        var reservations = that.filteredReservations();
        var date = filterArgs.date;

        switch(filterArgs.type) {
            case 'arrivals_perfomed':
                reservations = reservations.filter(function(reservation) {
                    return reservation.arrival_date === date && reservation.reservation_status !== 'RESERVED';
                });
                break;
            case 'arrivals_remaining':
                reservations = reservations.filter(function(reservation) {
                    return reservation.arrival_date === date && reservation.reservation_status === 'RESERVED';
                });
                break;
            case 'departures_pending':
                reservations = reservations.filter(function(reservation) {
                    return reservation.departure_date === date && reservation.reservation_status === 'CHECKEDIN';
                });
                break;
            case 'departures_perfomed':
                reservations = reservations.filter(function(reservation) {
                    return reservation.departure_date === date && reservation.reservation_status === 'CHECKEDOUT';
                });
                break;
            case 'stayovers_perfomed':
                var stayOvers = getStayOvers(reservations, date);
                var cleanAndInspectedRooms = getCleanAndInspectedRooms(reservations);

                reservations = stayOvers.filter(function(reservation) {
                    return cleanAndInspectedRooms.includes(reservation.arrival_room_number);
                });
                break;
            case 'stayovers_remaining':
                var stayOvers = getStayOvers(reservations, date);
                var cleanAndInspectedRooms = getCleanAndInspectedRooms(that.filterdRoomStatuses());
                reservations = stayOvers.filter(function(reservation) {
                    return !cleanAndInspectedRooms.includes(reservation.arrival_room_number);
                });
                break;
            default:
                break;
        };
        return reservations;
    };

    /*
     * This method is used for getting the rooms based on filters
     */
    this.getRooms = function(filterArgs) {
        var rooms = that.filterdRoomStatuses();

        switch (filterArgs.type) {
            case 'rooms_clean':
                rooms = getCleanRooms(rooms);
                break;
            case 'rooms_inspected':
                rooms = getInspectedRooms(rooms);
                break;
            case 'rooms_dirty':
                rooms = getDirtyRooms(rooms);
                break;
            case 'rooms_pickup':
                rooms = getPickupRooms(rooms);
                break;
            default:
                break;
        };

        return rooms;
    };

    var getStayOvers = function(reservations, date) {
        return reservations.filter(function(reservation) {
            return reservation.reservation_status === 'CHECKEDIN' && reservation.departure_date !== date;
        });
    };

    var getCleanAndInspectedRooms = function(rooms) {
        return rooms.filter(function(room) {
            return room.status === 'INSPECTED' || room.status === 'CLEAN';
        }).map(function(room) {
            return room.room_number;
        });
    };

    var getInspectedRooms = function(rooms) {
        return rooms.filter(function(room) {
            return room.status === 'INSPECTED';
        });
    };

    var getCleanRooms = function(rooms) {
        return rooms.filter(function(room) {
            return room.status === 'CLEAN';
        });
    };

    var getDirtyRooms = function(rooms) {
        return rooms.filter(function(room) {
            return room.status === 'DIRTY';
        });
    };

    var getPickupRooms = function(rooms) {
        return rooms.filter(function(room) {
            return room.status === 'PICKUP';
        });
    };

    this.fetchMarketCodes = function() {
        var url = '/api/market_segments';
     
        return rvBaseWebSrvV2.getJSON(url);
    };
    this.fetchSourceCodes = function() {
        var url = '/api/sources';
     
        return rvBaseWebSrvV2.getJSON(url);
    };
    this.fetchSegmantCodes = function() {
        var url = '/api/segments';
     
        return rvBaseWebSrvV2.getJSON(url);
    };
    this.fetchOriginCodes = function() {
        var url = '/api/booking_origins';
     
        return rvBaseWebSrvV2.getJSON(url);
    };
    this.fetchAnalyticsFilters = function(params) {
        var url = '/api/analytics_filters';

        return rvBaseWebSrvV2.getJSON(url, params);
    };
    this.saveAnalyticsFilter = function(params) {
        var url = '/api/analytics_filters';

        return rvBaseWebSrvV2.postJSON(url, params);
    };
    this.updateAnalyticsFilter = function(params) {
        var url = '/api/analytics_filters/' + params.id;

        return rvBaseWebSrvV2.putJSON(url, params);
    };
    this.deleteAnalyticsFilter = function(params) {
        var url = '/api/analytics_filters/' + params.id;

        return rvBaseWebSrvV2.deleteJSON(url, params);
    };
}]);
