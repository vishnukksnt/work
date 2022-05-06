angular.module('sntRover').service('rvAvailabilitySrv', ['$q', 'rvBaseWebSrvV2', 'RVHotelDetailsSrv', 'dateFilter', 'rvUtilSrv',
    function($q, rvBaseWebSrvV2, RVHotelDetailsSrv, dateFilter, rvUtilSrv) {

    var that = this;

    var availabilityGridDataFromAPI = null;

    this.data = {};
    this.propertyGroupData = {};

    this.getGraphData = function() {
        return that.data.hasOwnProperty('gridData') && that.data.gridData.additionalGraphData;
    };
    this.getGridData = function() {
        return that.data.gridData;
    };

    this.getGridDataForGroupAvailability = function() {
        return that.data.gridDataForGroupAvailability;
    };
    this.getGridDataForAllotmentAvailability = function() {
        return that.data.gridDataForAllotmentAvailability;
    };

    this.updateData = function(data) {
        that.data = data;
    };

    var formGraphData = function(availabilityAdditionalFromAPI, occupancyDataFromAPI) {
        // returning object
        var graphData = {};

        // array to keep all data, we will append these to above dictionary after calculation
        var dates 				= [];
        var bookableRooms 		= [];
        var outOfOrderRooms 	= [];
        var reservedRooms 		= [];
        var availableRooms 		= [];
        var occupanciesActual	= [];
        var occupanciesTargeted = [];

        // used to show/hide the occupancy target checkbox
        var IsOccupancyTargetSetBetween = false;

        // variables for single day calculation
        var bookableRoomForADay 		= '';
        var outOfOrderRoomForADay 		= '';
        var reservedRoomForADay			= '';
        var availableRoomForADay		= '';
        var occupanciesActualForADay	= '';
        var occupanciesTargetedForADay 	= '';
        var date 						= '';
        var totalRoomCount = availabilityAdditionalFromAPI.physical_count;
        var currentRow = null;

        for (var i = 0; i < availabilityAdditionalFromAPI.results.length; i++) {
            currentRow = availabilityAdditionalFromAPI.results[i];

            // date for th day
            date = { 'dateObj': new tzIndependentDate(currentRow.date) };

            // forming bookable room data for a day
            // total number of rooms - outoforder for that day
            bookableRoomForADay = totalRoomCount - currentRow.house.out_of_order;
            bookableRoomForADay = ( bookableRoomForADay / totalRoomCount ) * 100;

            // forming outoforder room data for a day
            outOfOrderRoomForADay = ( currentRow.house.out_of_order / totalRoomCount ) * 100;

            // forming reserved room data for a day
            reservedRoomForADay = ( currentRow.house.sold / totalRoomCount ) * 100;

            // forming available room for a day
            availableRoomForADay = (currentRow.house.availability / totalRoomCount ) * 100;

            // pusing all these to array
            dates.push(date);
            bookableRooms.push(bookableRoomForADay);
            outOfOrderRooms.push(outOfOrderRoomForADay);
            reservedRooms.push(reservedRoomForADay);
            availableRooms.push(availableRoomForADay);
        }

        // since occupancy data is from another API, results may have length  lesser/greater than availability
        for (i = 0; i < occupancyDataFromAPI.results.length; i++) {
            currentRow = occupancyDataFromAPI.results[i];
            occupanciesActualForADay = escapeNull(currentRow.actual) === "" ? 0 : currentRow.actual;
            occupanciesTargetedForADay = escapeNull(currentRow.target) === "" ? 0 : currentRow.target;
            occupanciesActual.push(occupanciesActualForADay);
            occupanciesTargeted.push(occupanciesTargetedForADay);
            if (occupanciesTargetedForADay > 0) {
                IsOccupancyTargetSetBetween = true;
            }
        }

        // forming data to return
        graphData = {
            'dates': dates,
            'bookableRooms': bookableRooms,
            'outOfOrderRooms': outOfOrderRooms,
            'reservedRooms': reservedRooms,
            'availableRooms': availableRooms,
            'occupanciesActual': occupanciesActual,
            'occupanciesActual': occupanciesActual,
            'occupanciesTargeted': occupanciesTargeted,
            'totalRooms': totalRoomCount

        };
        return graphData;

    };
    /*
    * param - Object from api/group_availability response
    * return - Object
    */
    var formGridDataForGroupAvailability = function(datafromApi) {
        var gridDataForGroupAvailability = {};
        var dates = [];
        var groupTotalRooms = [];
        var groupTotalPickedUps = [];
        var holdstatus = [];
        var groupDetails = [];
        var groupDetail = [];

        _.each(datafromApi.results, function(element, index, lis) {
            var temp = [];
            // Extracting date detail
            var dateToCheck = tzIndependentDate(element.date),
                isWeekend = rvUtilSrv.isWeekendDay(datafromApi.weekend_days, dateToCheck);

            dates.push({'date': element.date, 'isWeekend': isWeekend, 'dateObj': new Date(element.date)});
            // Extracting groupTotalRooms
            groupTotalRooms.push(element.group_total_rooms);
            // Extracting groupTotal picked ups
            groupTotalPickedUps.push(element.group_total_pickups);
            holdstatus.push(element.hold_status);
            // Forms array(temp) of details of groups date wise
            _.each(element.group_availability, function(ele, ind, list) {
                var detail = {
                    "id": ele.group_id,
                    "Name": ele.name,
                    "date": element.date,
                    "total_blocked_rooms": ele.total_blocked_rooms,
                    "total_pickedup_rooms": ele.total_pickedup_rooms
                };

                temp.push(detail);
            });
            // Forms two dimensional array[datewise][groupwise]
            groupDetail.push(temp);
        });
        // Forms groupwise Details.
        _.each(datafromApi.results[0].group_availability, function(element, index, list) {
            var groupdetail = {
                "name": element.name,
                "id": element.group_id,
                "holdStatusName": getGroupName(element.hold_status_id, datafromApi.hold_status),
                "details": _.zip.apply(null, groupDetail)[index]
            };

            groupDetails.push(groupdetail);
        });

        gridDataForGroupAvailability = {
            'dates': dates,
            'groupTotalRooms': groupTotalRooms,
            'groupTotalPickedUps': groupTotalPickedUps,
            'holdstatuses': _.zip.apply(null, holdstatus),
            'groupDetails': groupDetails,
            'holdStatus': datafromApi.hold_status
        };
        return gridDataForGroupAvailability;
    };
    /*
    * param - Group id
    * return Group name
    */
    var getGroupName = function(GroupId, holdstatuses) {
        var grp = _.find(holdstatuses, function(elem) {
            return (elem.id === GroupId) ? true : false;
        });

        return !!grp ? grp.name : '';
    };
    /**
    * function to fetch group availability between from date & to date
    */

    this.fetchGroupAvailabilityDetails = function(params) {
        var firstDate 	= (params.from_date);
        var secondDate 	= (params.to_date);

        var dataForWebservice = {
            from_date: firstDate,
            to_date: secondDate
        };

        // Webservice calling section
        var deferred = $q.defer();
        var url = 'api/group_availability';

        rvBaseWebSrvV2.getJSON(url, dataForWebservice).then(function(resultFromAPI) {
            // storing response temporarily in that.data, will change in occupancy call
            that.data.gridDataForGroupAvailability = formGridDataForGroupAvailability(resultFromAPI);
            deferred.resolve(that.data);
        }, function(data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };
    /**
    * function to re-structure API response to UI data model.
    */
    var formGridData = function(roomAvailabilityData) {
        var gridData = {};

        // array to keep all data, we will append these to above dictionary after calculation
        var dates 				= [],
        overbooking				= [],
        occupancies  			= [],
        availableRooms   		= [],
        bookedRooms  			= [],
        nonGroupRooms 			= [],
        groupAndAllotments 		= [],
        outOfOrder  			= [],
        inventory				= [],
        roomToSell				= [],
        roomTypes               = [];

        var isHourlyRateOn 		= RVHotelDetailsSrv.hotelDetails.is_hourly_rate_on;

        _.each(roomAvailabilityData.availability_details_by_date, function(item) {

            // Extracting date detail
            var dateToCheck = tzIndependentDate(item.date),
                isWeekend = rvUtilSrv.isWeekendDay(roomAvailabilityData.weekend_days, dateToCheck);

            dates.push({'date': item.date, 'isWeekend': isWeekend, 'dateObj': new Date(item.date)});

            // Extracting overbooking details
            overbooking.push(item.house_sell_limit);

            // Extracting Occupancy details
            occupancies.push(item.occupancy.percentage);

            // Extracting Availability details
            availableRooms.push(item.available_rooms);

            // Extracting Availability details
            nonGroupRooms.push(item.non_group_rooms);

            groupAndAllotments.push(item.group_and_allotment);

            // Extracting inventory count
            inventory.push(item.physical_room_count);

            // Extracting OOO
            outOfOrder.push(item.occupancy.out_of_order);

            // Extracting room to sell
            roomToSell.push(item.rooms_to_sell);


            // CICO-13590
            // we are enabling this for non-hourly hotels only
            if (!isHourlyRateOn) {
                bookedRooms.push (item.rooms_sold);
            }
        });

        gridData = {
            'dates': dates,
            'overbooking': overbooking,
            'occupancies': occupancies,
            'availableRooms': availableRooms,
            'nonGroupRooms': nonGroupRooms,
            'groupAndAllotments': groupAndAllotments,
            'outOfOrder': outOfOrder,
            'inventory': inventory,
            'roomTypes': roomAvailabilityData['room_types'],
            'roomToSell': roomToSell
        };
        // CICO-13590
        if (!isHourlyRateOn) {
            _.extend (gridData,
            {
                'bookedRooms': bookedRooms
            });
        }
        return gridData;
    };
    /**
    * function to add additional data to UI data model.
    */
    var formGridAdditionalData = function(roomAvailabilityAdditionalData) {
        var additionalData = {};
        var roomtypeDetails = [];
        var roomTypeNames = [],
            bestAvailabilityRate = [],
            adultsChildrenCounts = [];

        var adultsCount,
            childrenCount;

        _.each(roomAvailabilityAdditionalData.results, function(item) {
            // Extracts roomtype details
            roomtypeDetails.push(item.detailed_room_types);

            // Extracts adult child count
            // the count could be nothing
            adultsCount   = item.adults_count || 0;
            childrenCount = item.children_count || 0;
            adultsChildrenCounts.push({
                'bothCount': adultsCount + '/' + childrenCount,
                'isWarning': ( 5 >= adultsCount && 5 >= childrenCount ),
                'isUnavailable': ( 0 >= adultsCount && 0 >= childrenCount )
            });

            // Extracts BAR details
            bestAvailabilityRate.push( (0 == item.best_available_rate_amount.rate_amount) ? 'C' : item.best_available_rate_amount.rate_amount );

        });

        // Forms roomtype names array
        _.each(roomAvailabilityAdditionalData.results[0].detailed_room_types, function(item) {
            // var roomTypeName;
            var roomTypeData = {};

            _.map(roomAvailabilityAdditionalData.room_types, function(roomType) {
                if (roomType.id === item.id) {
                    roomTypeData.name = roomType.name;
                    roomTypeData.is_suite = roomType.is_suite;
                }
            });
            roomTypeNames.push(roomTypeData);
        });


        additionalData = {
            'roomTypeWiseDetails': _.zip.apply(null, roomtypeDetails),
            'roomTypeNames': roomTypeNames,
            'adultsChildrenCounts': adultsChildrenCounts,
            'bestAvailabilityRate': bestAvailabilityRate
        };

        return additionalData;
    };
    /**
    * function to fetch allotment availability between from date & to date
    */

    this.fetchAllotmentAvailabilityDetails = function(params) {
        var firstDate 	= (params.from_date);
        var secondDate 	= (params.to_date);

        var dataForWebservice = {
            from_date: firstDate,
            to_date: secondDate
        };

        // Webservice calling section
        var deferred = $q.defer();
        var url = 'api/allotment_availability';

        rvBaseWebSrvV2.getJSON(url, dataForWebservice)
            .then(function(resultFromAPI) {
                // storing response temporarily in that.data, will change in occupancy call
                that.data.gridDataForAllotmentAvailability = formGridDataForAllotmentAvailability(resultFromAPI);
                deferred.resolve(that.data);
            }, function(data) {
                deferred.reject(data);
            });
        return deferred.promise;
    };

    /*
    * param - Group id
    * return Group name
    */
    var getAllotmentName = function(GroupId, holdstatuses) {
        var grp = _.find(holdstatuses, function(elem) {
            return (elem.id === GroupId) ? true : false;
        });

        return !!grp ? grp.name : '';
    };

    /*
    * param - Object from api/group_availability response
    * return - Object
    */
    var formGridDataForAllotmentAvailability = function(datafromApi) {
        var gridDataForAllotmentAvailability = {};
        var dates = [];
        var groupTotalRooms = [];
        var groupTotalPickedUps = [];
        var holdstatus = [];
        var groupDetails = [];
        var groupDetail = [];

        _.each(datafromApi.results, function(element, index, lis) {
            var temp = [];

            // Extracting date detail
            var dateToCheck = tzIndependentDate(element.date),
                isWeekend = rvUtilSrv.isWeekendDay(datafromApi.weekend_days, dateToCheck);

            dates.push({'date': element.date, 'isWeekend': isWeekend, 'dateObj': new Date(element.date)});

            // Extracting groupTotalRooms
            groupTotalRooms.push(element.total_rooms);

            // Extracting groupTotal picked ups
            groupTotalPickedUps.push(element.total_pickups);
            holdstatus.push(element.hold_status);

            // Forms array(temp) of details of groups date wise
            _.each(element.availability, function(ele, ind, list) {
                var detail = {
                    "id": ele.id,
                    "Name": ele.name,
                    "date": element.date, // is needed, not in API
                    "total_blocked_rooms": ele.total_blocked_rooms,
                    "total_pickedup_rooms": ele.total_pickedup_rooms
                };

                temp.push(detail);
            });

            // Forms two dimensional array[datewise][groupwise]
            groupDetail.push(temp);
        });

        // Forms groupwise Details.
        _.each(datafromApi.results[0].availability, function(element, index, list) {
            var groupdetail = {
                "name": element.name,
                "id": element.id,
                "holdStatusName": getAllotmentName(element.hold_status_id, datafromApi.hold_status),
                "details": _.zip.apply(null, groupDetail)[index]
            };

            groupDetails.push(groupdetail);
        });

        gridDataForAllotmentAvailability = {
            'dates': dates,
            'groupTotalRooms': groupTotalRooms,
            'groupTotalPickedUps': groupTotalPickedUps,
            'holdstatuses': _.zip.apply(null, holdstatus),
            'groupDetails': groupDetails,
            'holdStatus': datafromApi.hold_status
        };

        return gridDataForAllotmentAvailability;
    };


    /**
    * function to fetch availability between from date & to date
    */
    this.fetchAvailabilityDetails = function(params) {
        var firstDate 	= params.from_date;
        var secondDate 	= params.to_date;

        var dataForWebservice = {
            from_date: firstDate,
            to_date: secondDate,
            is_include_overbooking: params.is_include_overbooking
        };

        // Webservice calling section
        var deferred = $q.defer();
        var url = 'api/availability_main';

        rvBaseWebSrvV2.getJSON(url, dataForWebservice).then(function(resultFromAPI) {
            that.data.gridData = {};
            that.data.gridData = formGridData(resultFromAPI);
            deferred.resolve(resultFromAPI);
        }, function(data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };

    this.fetchBARs = function(params) {
        var payLoad = {
                'from_date': params.from_date,
                'to_date': params.to_date
            },
            deferred = $q.defer(),
            url = 'api/availability/best_rates';

        rvBaseWebSrvV2.getJSON(url, payLoad).then(function(response) {
            var BARs = [];

            _.each(response.dates, function(day) {
                BARs.push((null == day.amount) ? 'C' : day.amount);
            });

            that.data.gridData.bestAvailabilityRates = BARs;

            deferred.resolve(BARs);

        }, function(errorMessage) {
            deferred.reject(errorMessage);
        });
        return deferred.promise;
    };

    /**
    * function to fetch availability between from date & to date
    */
    this.fetchAvailabilityAdditionalDetails = function(params) {
        var dataForWebservice = {
            'from_date': params.from_date,
            'to_date': params.to_date,
            'is_from_availability_screen': true
        };

        // Webservice calling section
        var deferred = $q.defer();
        var url = 'api/calendar_availability';

        rvBaseWebSrvV2.getJSON(url, dataForWebservice)
            .then(function(availabilityAdditionalFromAPI) {

                that.fetchOccupancyDetails(params)
                    .then(function(occupancyDataFromAPI) {
                        _.extend(that.data.gridData, {
                            'additionalData': formGridAdditionalData( availabilityAdditionalFromAPI ),
                            'additionalGraphData': formGraphData( availabilityAdditionalFromAPI, occupancyDataFromAPI )
                        });

                        // passing on gridData is a waste, sort of.
                        // but we sure gotta resolve!
                        deferred.resolve(that.data.gridData);
                    }, function(data) {
                        deferred.reject(data);
                    });

            }, function(data) {
                deferred.reject(data);
            });

        return deferred.promise;
    };

    /*
    * function to fetch occupancy details date wise
    */
    this.fetchOccupancyDetails = function(params) {
        var dataForWebservice = {
            'from_date': params.from_date,
            'to_date': params.to_date
        };

        var deferred = $q.defer();
        var url = 'api/daily_occupancies';

        rvBaseWebSrvV2.getJSON(url, dataForWebservice)
            .then(function(responseFromAPI) {
                deferred.resolve(responseFromAPI);
            }, function(data) {
                deferred.reject(data);
            });

        return deferred.promise;
    };

    var getHouseStatistics = function(params) {
        var deferred = $q.defer();
        var url = '/api/availability/house_statistics';

        delete params['business_date'];

        rvBaseWebSrvV2.getJSON(url, params).then(function(data) {
            deferred.resolve(data);
        }, function(data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };

    var getHouseAvailability = function(params) {
        var deferred = $q.defer();
        var url = '/api/availability/house';

        delete params['business_date'];

        rvBaseWebSrvV2.getJSON(url, params).then(function(data) {
            deferred.resolve(data.results);
        }, function(data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };

    /**
    * function to fetch Occupancy and Available Rooms by Hotel_ID for Multi Property
    */
    var getOccupencyAndAvailableRoom = function(params) {
        var deferred = $q.defer();
        var url = '/api/availability_main/occupancy_and_available_rooms';

        rvBaseWebSrvV2.getJSON(url, params).then(function(data) {
            deferred.resolve(data);
        }, function(data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };

    this.fetchOccupancyAndAvailableRoom = function(params) {
        var deferred = $q.defer(), promises = [], propertyGroups = [];

        _.each(params.propertyGroupSelected, function (element) {
            promises.push(getOccupencyAndAvailableRoom(
                {
                    "date": params.date,
                    "is_include_overbooking": params.is_include_overbooking,
                    "hotel_id": element.id
                }
            ).then(function (response) {
                if (response) {
                    propertyGroups.push({
                        "id": element.id,
                        "name": element.name,
                        "color": element.color,
                        "occupancy": response.occupancy_and_available_rooms_details[0].occupancy,
                        "available_rooms": response.occupancy_and_available_rooms_details[0].available_rooms,
                        "hiddenAvailablityRoomType": true
                    });
                }
            }));
        });

        $q.all(promises).then(function () {
            // This will be executed when all promises inside the array have been resolved
            deferred.resolve(propertyGroups);
        }, function(errorMessage) {
            deferred.reject(errorMessage);
        });

        return deferred.promise;
    };

    /**
    * function to fetch Occupancy and Available Room details by Hotel_ID for Multi Property
    */
    var getOccupancyAndAvailableRoomsByHotelId = function(params) {
        var deferred = $q.defer();
        var url = '/api/availability_main/occupancy_and_available_rooms';

        rvBaseWebSrvV2.getJSON(url, params).then(function (data) {
            deferred.resolve(data);
        }, function (data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };

    /**
    * function to fetch Bar details by Hotel_ID for Multi Property
    */
    var getBarRatesByHotelId = function(params) {
        var deferred = $q.defer();
        var url = '/api/availability/best_rates';

        rvBaseWebSrvV2.getJSON(url, params).then(function (data) {
            deferred.resolve(data);
        }, function (data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };

    this.fetchBarOccupancyAndAailableRoomByHotelId = function (params) {
        var deferred = $q.defer(), promises = [], occupancyAndAvailableRoomsData = [], barRatesData = [],
            hotelsData = {
                "id": params.hotel_id,
                "bar": [],
                "occupancy": [],
                "availableRooms": []
            };

        // This call gets the Occupancy and Available Rooms data
        promises.push(getOccupancyAndAvailableRoomsByHotelId(params).then(function (response) {
            if (response) {
                that.propertyGroupData.roomTypes = response.room_types;
                occupancyAndAvailableRoomsData = response.occupancy_and_available_rooms_details;

                if (occupancyAndAvailableRoomsData && occupancyAndAvailableRoomsData.length) {
                    _.each(occupancyAndAvailableRoomsData, function (element, index, lis) {
                        hotelsData.occupancy.push(element.occupancy);
                        hotelsData.availableRooms.push(element.available_rooms);
                    });
                }
            }
        }));

        // This call gets the Bar data
        promises.push(getBarRatesByHotelId(params).then(function (response) {
            barRatesData = response.dates;

            if (barRatesData && barRatesData.length) {
                _.each(barRatesData, function (element, index, lis) {
                    hotelsData.bar.push(element.amount === null ? 0 : element.amount);
                });
            }
        }));

        $q.all(promises).then(function () {
            // Resolve after parsing to a bindable object
            deferred.resolve(hotelsData);
        }, function (errorMessage) {
            deferred.reject(errorMessage);
        });

        return deferred.promise;
    };

    this.fetchAvailableRoomTypeByHotelId = function(params) {
        var deferred = $q.defer(),
            url = '/api/availability/room_types';

        rvBaseWebSrvV2.getJSON(url, params).then(function (response) {
            var roomTypeNames = [], availableRoomTypeDetails = {};

            if (response.results.length > 0) {
                // Inorder to get the room type names in the order of display fetch the first result set
                var firstDayRoomDetails = response.results[0].room_types,
                    idsInOrder = _.pluck(firstDayRoomDetails, 'id');

                _.each(idsInOrder, function (roomTypeId) {
                    var roomTypeData = {};

                    roomTypeData.name = _.find(that.propertyGroupData.roomTypes, {
                        id: roomTypeId
                    }).name;
                    roomTypeData.is_suite = _.find(that.propertyGroupData.roomTypes, {
                        id: roomTypeId
                    }).is_suite;
                    roomTypeNames.push(roomTypeData);
                });
            }

            _.extend(availableRoomTypeDetails, {
                'roomTypeWiseDetails': _.zip.apply(null, _.pluck(response.results, 'room_types')),
                'roomTypeNames': roomTypeNames,
                'id': params.hotel_id
            });

            deferred.resolve(availableRoomTypeDetails);
        }, function (data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };

    this.fetchHouseStatusDetails = function(params) {
        var deferred = $q.defer(),
            promises = [],
            businessDate = tzIndependentDate(params['business_date']).clone(),
            houseAvailability, houseStatistics, roomCount;

        // This call gets the sold and availability data
        promises.push(getHouseAvailability(params).then(function(response) {
            houseAvailability = response;
        }));

        // This call gets the adr, arrived, arriving, departed, departing and total_rev
        promises.push(getHouseStatistics(params).then(function(response) {
            houseStatistics = response.results;
            roomCount = response.physical_count;
        }));

        $q.all(promises).then(function() {
            // Merge sold and availability count with the houseStatistics object
            _.each(houseAvailability, function(availability, idx) {
                _.extend(houseStatistics[idx], availability.house);
            });
            // Resolve after parsing to a bindable object
            deferred.resolve(that.restructureHouseDataForUI(houseStatistics, roomCount, businessDate));
        }, function(errorMessage) {
            deferred.reject(errorMessage);
        });

        return deferred.promise;
    };

    /**
    *Manipulates the house availability response to a format that would suit UI rendering
    * (Which supports rendering calendar row by row)
    */
    this.restructureHouseDataForUI = function(data, houseTotal, businessDate) {
        var houseDetails = {};

        houseDetails.physical_count = houseTotal;
        houseDetails.dates = [];
        houseDetails.total_rooms_occupied = {};
        houseDetails.total_guests_inhouse = {};
        houseDetails.departues_expected = {};
        houseDetails.departures_actual = {};
        houseDetails.arrivals_expected = {};
        houseDetails.arrivals_actual = {};
        houseDetails.available_tonight = {};
        houseDetails.occupied_tonight = {};
        houseDetails.total_room_revenue = {};
        houseDetails.avg_daily_rate = {};

        var houseStatus;
        var dateDetails;
        var totalDepartures;
        var totalArrivals;

        angular.forEach(data, function(dayInfo, i) {
            // Creates the hash of date details
            // Consists of the day info - today, tomorrow or yesterday and the date
            dateDetails = {};
            dateDetails.date = dayInfo.date;
            var date = tzIndependentDate(dayInfo.date);
            // Set if the day is yesterday/today/tomorrow

            if (date.getTime() ===  businessDate.getTime()) {
                dateDetails.day = "TODAY";
            } else if (date.getTime() < businessDate.getTime()) {
                dateDetails.day = "YESTERDAY";
            } else {
                dateDetails.day = "TOMORROW";
            }
            houseDetails.dates.push(dateDetails);

            // Total rooms occupied
            // value - Actual value - will be displayed in the colum near to graph
            // percent - Used for graph plotting
            houseDetails.total_rooms_occupied[dayInfo.date] = {};
            houseDetails.total_rooms_occupied[dayInfo.date].value = dayInfo.sold;
            houseDetails.total_rooms_occupied[dayInfo.date].percent = dayInfo.sold / houseTotal * 100;
            /* total guests inhouse - not used now. May be added in future
            houseDetails.total_guests_inhouse[dayInfo.date] = {};
            houseDetails.total_guests_inhouse[dayInfo.date].value = dayInfo.house.in_house;*/

            totalDepartures = dayInfo.departing + dayInfo.departed;
            // Departures Expected
            houseDetails.departues_expected[dayInfo.date] = {};
            houseDetails.departues_expected[dayInfo.date].value = dayInfo.departing;
            houseDetails.departues_expected[dayInfo.date].percent = dayInfo.departing / totalDepartures * 100;
            // Departures Actual
            houseDetails.departures_actual[dayInfo.date] = {};
            houseDetails.departures_actual[dayInfo.date].value = dayInfo.departed;
            houseDetails.departures_actual[dayInfo.date].percent = dayInfo.departed / totalDepartures * 100;

            totalArrivals = dayInfo.arriving + dayInfo.arrived;
            // Arrivals Expected
            houseDetails.arrivals_expected[dayInfo.date] = {};
            houseDetails.arrivals_expected[dayInfo.date].value = dayInfo.arriving;
            houseDetails.arrivals_expected[dayInfo.date].percent = dayInfo.arriving / totalArrivals * 100;
            // Arrivals Actual
            houseDetails.arrivals_actual[dayInfo.date] = {};
            houseDetails.arrivals_actual[dayInfo.date].value = dayInfo.arrived;
            houseDetails.arrivals_actual[dayInfo.date].percent = dayInfo.arrived / totalArrivals * 100;

            // Available tonight
            houseDetails.available_tonight[dayInfo.date] = {};
            houseDetails.available_tonight[dayInfo.date].value = Math.round(dayInfo.availability / houseTotal * 100);
            houseDetails.available_tonight[dayInfo.date].percent = Math.round(dayInfo.availability / houseTotal * 100);

            // Occupied tonight
            houseDetails.occupied_tonight[dayInfo.date] = {};
            houseDetails.occupied_tonight[dayInfo.date].value = Math.round(dayInfo.sold / houseTotal * 100);
            houseDetails.occupied_tonight[dayInfo.date].percent = Math.round(dayInfo.sold / houseTotal * 100);
            // Total room revenue
            houseDetails.total_room_revenue[dayInfo.date] = dayInfo.total_room_revenue;
            // Average daily rate
            houseDetails.avg_daily_rate[dayInfo.date] = dayInfo.average_daily_rate;


        });

    return houseDetails;
    };

    this.fetchGrpNAllotAvailDetails = function(params) {
        var deferred = $q.defer();
        var count = 2;

        var shallWeResolve = function() {
            if ( count == 0 ) {
                deferred.resolve();
            }
        };

        var success = function() {
            count--;
            shallWeResolve();
        };

        var failed = function() {
            count--;
            shallWeResolve();
        };

        that.fetchGroupAvailabilityDetails({
            from_date: params.from_date,
            to_date: params.to_date
        }).then(success, failed);

        that.fetchAllotmentAvailabilityDetails({
            from_date: params.from_date,
            to_date: params.to_date
        }).then(success, failed);

        return deferred.promise;
    };


    //* ** CICO-17073 : Code for Item Inventory **//

    this.getGridDataForInventory = function () {
        return that.data.gridDataForItemInventory;
    };


    /**
     * This method returns an array of rates including the from and to Date provided to it
     * @param fromDate String in yyyy-MM-dd format
     * @param toDate String in yyyy-MM-dd format
     * @returns {Array}
     */
   var getDateRange = function(fromDate, toDate, weekendDays) {
        var dates = [],
            currDate = new tzIndependentDate(fromDate) * 1,
            lastDate = new tzIndependentDate(toDate) * 1;

        for (; currDate <= lastDate; currDate += (24 * 3600 * 1000)) {
            var dateObj = new tzIndependentDate(currDate),
                isWeekend = rvUtilSrv.isWeekendDay(weekendDays, dateObj);

            dates.push({
                date: dateFilter(dateObj, 'yyyy-MM-dd'),
                isWeekend: isWeekend
            });
        }
        return dates;
    };

    /**
    * function to fetch item inventory between from date & to date
    */
    this.fetchItemInventoryDetails = function (params) {
        var firstDate  = (params.from_date),
            secondDate = (params.to_date);

        var dataForWebservice = {
            from_date: firstDate,
            to_date: secondDate
        };

        // Webservice calling section
        var deferred = $q.defer(),
            url = '/api/availability/addons';

        rvBaseWebSrvV2.getJSON(url, dataForWebservice).then(function (resultFromAPI) {
            that.data.gridDataForItemInventory = {
                "addons": resultFromAPI.addons,
                "dates": getDateRange(firstDate, secondDate, resultFromAPI.weekend_days)
            };
            deferred.resolve(that.data);
        }, function(data) {
            deferred.reject(data);
        });

        return deferred.promise;
    };

        this.getRoomsAvailability = function(dateRange) {
            var deferred = $q.defer(),
                url = '/api/availability/room_types';

            rvBaseWebSrvV2.getJSON(url, dateRange).then(function(response) {
                var roomTypeNames = [];

                if (!that.data.gridData.additionalData) {
                    that.data.gridData.additionalData = {};
                }

                if (response.results.length > 0) {
                    // Inorder to get the room type names in the order of display fetch the first result set
                    var firstDayRoomDetails = response.results[0].room_types,
                        idsInOrder = _.pluck(firstDayRoomDetails, 'id');

                    _.each(idsInOrder, function(roomTypeId) {
                        var roomTypeData = {};

                        roomTypeData.name = _.find(that.data.gridData.roomTypes, {
                            id: roomTypeId
                        }).name;
                        roomTypeData.is_suite = _.find(that.data.gridData.roomTypes, {
                            id: roomTypeId
                        }).is_suite;
                        roomTypeNames.push(roomTypeData);
                    });
                }
                _.extend(that.data.gridData.additionalData, {
                    'roomTypeWiseDetails': _.zip.apply(null, _.pluck(response.results, 'room_types')),
                    'roomTypeNames': roomTypeNames
                });
                deferred.resolve(true);
            }, function(data) {
                deferred.reject(data);
            });
            return deferred.promise;
        };

        this.fetchOverbooking = function(dateRange) {
            var deferred = $q.defer(),
                url = '/api/availability/room_type_sell_limits';

            rvBaseWebSrvV2.getJSON(url, dateRange).then(function(response) {
                var roomTypeNames = [];

                if (!that.data.gridData.additionalData) {
                    that.data.gridData.additionalData = {};
                }

                if (response.results.length > 0) {
                    // Inorder to get the room type names in the order of display fetch the first result set
                    var firstDayRoomDetails = response.results[0].room_types,
                        idsInOrder = _.pluck(firstDayRoomDetails, 'id');

                    _.each(idsInOrder, function(roomTypeId) {
                        var roomTypeData = {};

                        roomTypeData.name = _.find(that.data.gridData.roomTypes, {
                            id: roomTypeId
                        }).name;
                        roomTypeData.is_suite = _.find(that.data.gridData.roomTypes, {
                            id: roomTypeId
                        }).is_suite;
                        roomTypeNames.push(roomTypeData);
                    });
                }
                _.extend(that.data.gridData.additionalData, {
                    'roomTypeWiseOverbookingDetails': _.zip.apply(null, _.pluck(response.results, 'room_types')),
                    'roomTypeNamesOverbooking': roomTypeNames
                });
                deferred.resolve(true);
            }, function(data) {
                deferred.reject(data);
            });
            return deferred.promise;
        };

        this.getGuestOccupancies = function(dateRange) {
            var deferred = $q.defer(),
                url = '/api/daily_occupancies/guest_counts';

            rvBaseWebSrvV2.getJSON(url, dateRange).then(function(response) {
                var adultsChildrenCounts = [];

                if (!that.data.gridData.additionalData) {
                    that.data.gridData.additionalData = {};
                }
                _.each(response.results, function(occupancy) {
                    adultsChildrenCounts.push({
                        'bothCount': occupancy.adults + '/' + occupancy.children
                    });
                });

                _.extend(that.data.gridData.additionalData, {
                    'adultsChildrenCounts': adultsChildrenCounts
                });

                deferred.resolve(true);
            }, function(data) {
                deferred.reject(data);
            });
            return deferred.promise;
        };

        this.getOccupancyCount = function(dateRange) {
            var deferred = $q.defer(),
                promises = [];

            if (!that.data.gridData.additionalData || !that.data.gridData.additionalData.roomTypeWiseDetails) {
                promises.push(that.getRoomsAvailability(dateRange));
            }
            promises.push(that.getGuestOccupancies(dateRange));

            $q.all(promises).then(function() {
                deferred.resolve(true);
            }, function(errorMessage) {
                deferred.reject(errorMessage);
            });

            return deferred.promise;
        };

        /**
         * Fetch main availability and best available rates
         * @param  {Object }params datae params
         * @return {Promise}
         */
        this.fetchAvailabilityAndBestAvailableRates = function (params) {
            var deferred = $q.defer(),
                promises = [];

            that.fetchAvailabilityDetails(params).then(function(data) {
                promises.push(that.fetchBARs(params));
                promises.push(that.fetchHouseEventsCount(params));

                $q.all(promises).then(function() {
                    deferred.resolve(data);
                }, function(errorMessage) {
                    deferred.reject(errorMessage);
                });
                
            }, function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        };

        /**
         * Fetch best available rates by room type
         * @param {Object} params date params
         * @return {Promise}
         */
        this.getBestAvailableRatesByRoomType = function (params) {
            var deferred = $q.defer(),
                url = '/api/availability/bar_for_room_types';

            rvBaseWebSrvV2.getJSON(url, params).then(function (response) {
                var roomTypeNames = [];

                if (!that.data.gridData.additionalData) {
                    that.data.gridData.additionalData = {};
                }

                if (response.results.length > 0) {
                    // Inorder to get the room type names in the order of display fetch the first result set
                    var firstDayRoomDetails = response.results[0].room_types,
                        idsInOrder = _.pluck(firstDayRoomDetails, 'id');

                    _.each(idsInOrder, function (roomTypeId) {
                        var roomTypeData = {};

                        roomTypeData.name = _.find(that.data.gridData.roomTypes, {
                            id: roomTypeId
                        }).name;
                        roomTypeData.is_suite = _.find(that.data.gridData.roomTypes, {
                            id: roomTypeId
                        }).is_suite;
                        roomTypeNames.push(roomTypeData);
                    });
                }
                _.extend(that.data.gridData.additionalData, {
                    'roomTypeBar': _.zip.apply(null, _.pluck(response.results, 'room_types')),
                    'roomTypeList': roomTypeNames
                });
                deferred.resolve(true);
            }, function (data) {
                deferred.reject(data);
            });
            
            return deferred.promise;
        };

        /**
         * Fetch house events count for a date range
         * @param {Object} params - hold the request params
         * @return {Promise}
         */
        this.fetchHouseEventsCount = function(params) {
            var url = '/api/house_events/count_per_day',
                deferred = $q.defer(),
                requestParams = {
                    start_date: params.from_date,
                    end_date: params.to_date
                };

            rvBaseWebSrvV2.getJSON(url, requestParams).then(function(response) {
                var formattedData = {};

                _.each(response.data, function(event) {
                    formattedData[event.date] = event.count;
                });
            
                that.data.gridData.eventsCount = formattedData;
                deferred.resolve({});
            }, function(error) {
                deferred.reject(error);
            });

            return deferred.promise;
        };

    }]);
