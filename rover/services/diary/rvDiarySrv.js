angular.module('sntRover').service('rvDiarySrv', ['$q', 'sntBaseWebSrv', 'rvBaseWebSrvV2', 'rvDiaryUtil', 'rvDiaryMetadata', '$vault', '$rootScope',
        function($q, sntBaseWebSrv, rvBaseWebSrvV2, util, meta, $vault, $rootScope) {
                /* DATA STORE w/ set functions */
                function STORE() {
                    if (!(this instanceof STORE)) {
                        return new STORE();
                    }
                    this.bCreated = true;
                    this.creation_time = Date.now();
                }
                STORE.prototype = {
                    constructor: STORE,
                    /* Deserves to be in a more standard util library like UTILS!*/
                    namespace: function(def) {
                        var props = def.split('.'),
                            ret = this;

                        for (var i = 0, len = props.length; i < len; i++) {
                            ret = ret[props[i]];
                        }

                        return ret;
                    },
                    set: function() {
                        var args = _.toArray(arguments),
                            setLookups = function(args) {
                                var key = args.shift(),
                                    val = args.shift();

                                if (_.isObject(val) && _.has(val, 'data')) {
                                    this[key]           = val.data;
                                    this['_' + key]     = val.index;
                                    this['__' + key]    = val.group;
                                } else {
                                    this[key]           = val;
                                }
                            }.bind(this);

                        switch (args.length) {
                            case 1:
                                if (_.isObject(args[0])) {
                                    _.each(_.pairs(args[0]),
                                           function(data) {
                                                setLookups(data);
                                    });
                                }
                            break;
                            case 2:
                                setLookups(args);
                            break;
                        }

                        return this;
                    },
                    get: function(field) {
                        var args = _.toArray(arguments);

                        switch (args.length) {
                            case 1:
                                return this.namespace(args[0]);
                            default:
                                return _.pick(this, args);
                        }
                    },
                    /* Merge [incoming] occupanices into [existing] room occupanices in
                      the data model.

                      Constraints:
                        1) Maintain ascending sorted order by 'arrival' time in ms for each occupancy
                           (Why?  When scrolling, or jumping calendar dates, memory usage can be minimized
                            by chomping left side of occupancy collection at the point were the
                            ( scroll position / time.px_per_ms ) at x_origin +- resolving distance)

                      See also:
                        Coordinate system and Viewport composition
                        -details the relatiionship between occupancy set and x_origin bounded by LSR <> RSD
                        --LSR (left spatial resolution -> how far we see into the past) and similary for RSD
                    */
                    mergeOccupancies: function(room_oc_groups) {
                        var idx,
                            r,
                            existing,
                            incoming,
                            set_difference,
                            room_ids    = _.keys(room_oc_groups);

                        for (var i = 0, len = room_ids.length; i < len; i++) {
                            idx = +room_ids[i];

                            r = _.findWhere(this.get('room'), { id: idx });

                            existing = util.copyArray(r.occupancy, existing);
                            incoming = _.sortBy(room_oc_groups[idx], 'arrival');

                            if (existing.length === 0) {
                                r.occupancy = util.copyArray(existing.concat(incoming), r.occupancy);
                            } else {
                                set_difference  = this.difference(existing, incoming, 'reservation_id');

                                if (set_difference.length > 0) {
                                    existing = this.merge(existing,
                                                          _.sortBy(set_difference, 'arrival'),
                                                          [],
                                                          'arrival');

                                    r.occupancy = util.copyArray(existing, r.occupancy);
                                }
                            }
                        }
                    },
                    update: function(existing, incoming, type) {

                    },
                    /* Calculate the difference between sets */
                    difference: function(existing, incoming, itr) {
                        var diff    = _.difference(_.pluck(incoming, itr), _.pluck(existing, itr)),
                            result = [];

                        if (diff.length > 0) {
                            result = _.filter(incoming, function(id) {
                                return diff.indexOf(id);
                            });
                        }

                        return result;
                    },
                    /* Merge two sorted lists */
                    merge: function(list_a, list_b, output, itr) {
                        var i = 0;

                        while (list_a.length > 0 && list_b.length > 0) {
                            output.push(list_b[0][itr] < list_a[0][itr] ? list_b.shift() : list_a.shift());
                        }

                        return output.concat(list_a.length > 0 ? list_a : list_b);
                    }
                };

                this.data_Store = new STORE();

                function Config(config, param_cfg, index_cfg, group_cfg, dataStore, normalizationFn, mergeFn) {
                    if (!(this instanceof Config)) {
                        return new Config(config, param_cfg, index_cfg, group_cfg, dataStore, normalizationFn, mergeFn);
                    }

                    for (var k in config) {
                        if (_.has(config, k)) {
                            this[k] = config[k];
                        }
                    }

                    this.params = {
                        descr: param_cfg || []
                    };

                    this.loaded = false;
                    this.dataStore = dataStore;
                    this.normalize = normalizationFn;
                    this.merge = mergeFn;
                    this.store = {
                        data: [],
                        index: {
                            values: Object.create(null),
                            descr: index_cfg || []
                        },
                        group: {
                            values: Object.create(null),
                            descr: group_cfg || []
                        }
                    };
                }

                Config.prototype = {
                    constructor: Config,
                    apis: {
                        GET: rvBaseWebSrvV2.getJSON.bind(rvBaseWebSrvV2)
                    },
                    read: function(params) {
                            return this.request('GET', params)();
                    },
                    request: function(type, params) {
                        return _.partial(this.apis[type], this.url, params);
                    },
                    resolve: function(data, normalizeParams) {
                        var self = this,
                            recv = (data) ? data[this.namespace] : null,
                            local_store = this.store,
                            prefix = this.key_prefix,
                            temp;

                        if (recv !== null) {
                            local_store.data = recv;

                            this.homogenizeValues();
                            this.generateIndex();
                            this.generateGroup();

                            this.dataStore.set(self.name, local_store);

                            this.normalization(normalizeParams);
                            this.mergeData();

                            this.loaded = true;
                        }
                    },
                    homogenizeValues: function() {
                        var id = this.id,
                            local_store = this.store,
                            prefix = this.key_prefix;

                        if (_.isArray(local_store.data)) {
                            _.each(local_store.data, function(datum) {
                                if (prefix) {
                                    datum.key = _.uniqueId(prefix + (datum[id] || _.random(0, 100000)) + '-');
                                }

                                for (var k in datum) {
                                    if (_.has(datum, k) && k !== 'room_no') {
                                        if (/^\d+\.?\d*$/.test(datum[k])) {
                                            datum[k] = +datum[k];
                                        }
                                    }
                                }
                            });
                        }
                    },
                    mergeData: function() {
                        var local_store = this.store;

                        if (this.merge) {
                            this.merge(local_store.data);
                        }
                    },
                    normalization: function(normalizeParams) {
                        var local_store = this.store,
                            self = this;

                        if (this.normalize) {
                            _.each(local_store.data, function(obj) {
                                if (!normalizeParams) {
                                    self.normalize.call(self, obj);
                                } else {
                                    self.normalize.apply(self, [obj].concat(normalizeParams));
                                }
                            });
                        }
                    },
                    generateIndex: function() {
                        var local_store = this.store;

                        _.each(local_store.index.descr, function(index_by) {
                            local_store.index.values[index_by] = _.indexBy(local_store.data, index_by);
                        });
                    },
                    generateGroup: function() {
                        var local_store = this.store;

                        _.each(local_store.group.descr, function(group_by) {
                                local_store.group.values[group_by] = _.groupBy(local_store.data, group_by);
                        });
                    },
                    normalizeTime: function(date, time) {
                        if (!date || !time) {
                        }
                        var std = (time.indexOf('am') > -1 || time.indexOf('pm') > -1),
                            t_a = time.slice(0, -3),
                            t_b = time.slice(-2);

                        return Date.parse(date + ' ' + (std ? t_a + ' ' + t_b : time));
                    },
                    normalizeMaintenanceInterval: function(time) {
                        var intervals = time / 15,
                            intervals_per_hr = 4;

                        return parseInt(intervals);
                    }
                };

                /* Parameterize default format dates into API formatted strings */
                function dateRange(start_date, end_date, room_type_id, rate_type) {
                    var s_comp = start_date.toComponents(),
                        e_comp = end_date.toComponents(),
                        params =  {
                            begin_time: s_comp.time.toString(),
                            end_time: e_comp.time.toString(),
                            begin_date: s_comp.date.toDateString(),
                            end_date: e_comp.date.toDateString()
                        };

                    if (room_type_id) {
                        _.extend(params, { room_type_id: room_type_id });

                    }

                    if (rate_type) {
                        _.extend(params, { rate_type: rate_type });
                    }

                    return params;
                }
                function dateRangeForDateChange(start_date, end_date) {
                    var s_comp = start_date.toComponents(),
                        e_comp = end_date.toComponents(),
                        params = {
                            begin_time: '00:00',
                            end_time: '23:59',
                            begin_date: s_comp.date.toDateString(),
                            end_date: e_comp.date.toDateString()
                        };

                    return params;
                }

                /**
                *
                */
                var InActiveRoomSlots = Config({
                    id: meta.inactive_rooms.id,
                    name: 'inactiveroom',
                    url: 'api/room_services/inactive_rooms',
                    key_prefix: 'iar-',
                    namespace: 'inactive_rooms',
                    cache: true
                },
                ['from_date', 'to_date'],
                undefined,
                ['inactive_room_id'],
                this.data_Store),

                /* ROOM Configuration Adapter
                Config(config, param_cfg, index_cfg, group_cfg, dataStore, normalizationFn, mergeFn)
                */
                Room = Config({
                    id: meta.room.id,
                    name: 'room',
                    url: 'api/rooms',
                    key_prefix: 'rm-',
                    namespace: 'rooms',
                    cache: true
                },
                undefined,
                ['id', 'room_no'],
                ['room_type_id'],
                this.data_Store,
                function(room) {

                    var room_type_id = room.room_type_id,
                        room_type = this.dataStore.get('_room_type.values.id')[room_type_id],
                        maintenance = this.dataStore.get('_maintenance.values.room_type_id')[room_type_id];

                    if (maintenance) {
                        room_type[meta.maintenance.time_span] = maintenance[meta.maintenance.time_span];
                    }
                    room.room_type = room_type;
                    room.occupancy = [];
                    room.room_inactive_slots = [];

                    var inactiveRooms   = (this.dataStore.get('inactiveroom')),
                        i               = 0,
                        startTime       = null,
                        endTime         = null,
                        time            = null,
                        date_to_pass    = null,
                        matchedRooms    = [],
                        hour            = null,
                        min             = null;

                        _.each(inactiveRooms, function(value, index) {

                           if (value.room_id === room.id) {
                                hour = value.from_time === null ? 0 : value.from_time.split(":")[0];
                                min = value.from_time === null ? 0 : value.from_time.split(":")[1];
                                startTime = new tzIndependentDate(value.from_date);
                                startTime.setHours (hour, min, 0);

                                // end time
                                hour = value.to_time === null ? 0 : value.to_time.split(":")[0];
                                min = value.to_time === null ? 0 : value.to_time.split(":")[1];
                                endTime = new tzIndependentDate(value.to_date);
                                endTime.setHours (hour, min, 0);

                                room.room_inactive_slots.push({
                                    'startTime': startTime,
                                    'endTime': endTime,
                                    'status': value.service_status
                                });
                           }

                        });

                    room[meta.room.hk_status] = meta.room.hk_status_map[room.hk_status];
                    // For Inspected Only Hotel, Adding class for clean not-inspected case
                    room[meta.room.hk_status] += ( room.hk_status === 'CLEAN' && !room.is_inspected ) ? ' not-inspected' : '';
                    // Add class when room is OOO/OOS
                    if ( room.room_service_status === 'OUT_OF_ORDER' || room.room_service_status === 'OUT_OF_SERVICE') {
                        room[meta.room.hk_status] = 'unavailable';
                    }
                    return room;
                }),

                /* ROOM TYPE Configuration Adapter */
                RoomType = Config({
                    id: meta.room_type.id,
                    name: 'room_type',
                    url: '/api/room_types.json?is_exclude_pseudo=true',
                    key_prefix: 'rt-',
                    namespace: 'results',
                    cache: true
                },
                undefined,
                ['id'],
                undefined,
                this.data_Store),

                /* ROOM MAINTENANCE Configuration Adapter */
                Maintenance = Config({
                    id: meta.maintenance.id,
                    name: 'maintenance',
                    url: '/api/room_types_task_completion_time?exclude_pseudo=true',
                    namespace: 'results',
                    cache: true
                },
                undefined,
                ['room_type_id'],
                undefined,
                this.data_Store,
                function(maintenance) {
                    var m = meta.maintenance;

                    maintenance[m.time_span] = this.normalizeMaintenanceInterval(maintenance[m.time_span]);

                    return maintenance;
                }),

                /* OCCUPANCY Configuration Adapter */
                Occupancy =  Config({
                    id: meta.occupancy.id,
                    name: 'occupancy',
                    url: 'api/hourly_occupancy',
                    key_prefix: 'oc-',
                    namespace: 'reservations'
                },
                ['start_date', 'end_date'],
                ['reservation_id'],
                ['room_id'],
                this.data_Store,
                function(occupancy) {
                    var m = meta.occupancy,
                        r = meta.room,
                        room = this.dataStore.get('_room.values.id')[occupancy.room_id],
                        room_type = room.room_type;

                    occupancy.arrival_date = occupancy.arrival_date.replace(/-/g, '/');
                    occupancy.departure_date = occupancy.departure_date.replace(/-/g, '/');
                    if (!occupancy[m.start_date]) {
                        occupancy[m.start_date]    = this.normalizeTime(occupancy.arrival_date, occupancy.arrival_time);
                    }
                    if (!occupancy[m.end_date]) {
                        occupancy[m.end_date]        = this.normalizeTime(occupancy.departure_date, occupancy.departure_time);
                    }
                    if (!occupancy[m.maintenance]) {
                    occupancy[m.maintenance]  = room_type[meta.maintenance.time_span];
                    }
                    occupancy[m.room_type]      = room_type.name.toLowerCase();
                    occupancy[m.status]         = occupancy[m.status].toLowerCase();
                    if (occupancy[m.status]          === 'reserved') {
                        occupancy[m.status]         = 'reserved';
                    } else if (occupancy[m.status]   === 'checkedin') {
                        occupancy[m.status]         = 'inhouse';
                    } else if (occupancy[m.status]   === 'checkedout') {
                        occupancy[m.status]         = 'departed';
                    } else if (occupancy[m.status]   === 'checking_out') {
                        occupancy[m.status]         = 'check-out';
                    } else if (occupancy[m.status]   ===  'checking_in') {
                        occupancy[m.status]         = 'check-in';
                    }
                    else if (occupancy[m.status]     ===  'noshow') {
                        occupancy[m.status]         = 'no-show';
                    }
                    room = _.findWhere(Room.store.data, { id: occupancy.room_id });

                    delete occupancy.arrival_time;
                    delete occupancy.arrival_date;
                    delete occupancy.departure_time;
                    delete occupancy.departure_date;

                    return occupancy;
                },
                function(incoming) {

                    this.dataStore.mergeOccupancies(this.store.group.values.room_id);
                }),

                /* AVAILABILITY Configuration Adapter */
                Availability = Config({
                    id: meta.availability.id,
                    name: 'availability',
                    url: 'api/hourly_availability',
                    key_prefix: 'av-',
                    namespace: 'availability',
                    observe_change: true
                },
                ['start_date', 'end_date', 'room_type_id', 'rate_type', 'account_id'],
                undefined,
                ['id'],
                this.data_Store,
                function() {
                    var args        = _.toArray(arguments),
                        slot        = args.shift(),
                        start_date  = args.shift(),
                        end_date    = args.shift(),
                        guid        = args.shift(),
                        selected    = args.shift(),
                        m           = meta.occupancy,
                        room        = this.dataStore.get('_room.values.id')[slot.id],
                        room_type   = room.room_type,
                        slot_statues = {
                            'WEBBOOKING': 'blocked',
                            'AVAILABLE': 'available'
                        };
                    /*
                        Configrue Available slot to mirror occupancy, execpt
                        set revervation_id for the collection so the resize
                        will work on all as a group.
                    */

                    if (!slot.room_id) {
                        slot.room_id                = room.id;
                        slot.reservation_status     = slot_statues[slot.status];
                        slot.room_service_status    = '';
                        slot.reservation_id         = guid;
                        slot.selected               = selected;
                        slot[m.start_date]          = start_date.getTime();
                        slot[m.end_date]            = end_date.getTime();
                        slot[m.maintenance]         = room_type[meta.maintenance.time_span];
                        slot[m.room_type]           = room_type.name.toLowerCase();
                    }
                    return slot;
                },
                function(incoming) {
                    this.dataStore.mergeOccupancies(this.store.group.values.id, true);
                }),

                /* AVAILABILITY COUNT Configuration Adapter */
                AvailabilityCount = Config({
                    name: 'availability_count',
                    url: 'api/hourly_availability_count',
                    key_prefix: 'ac-',
                    namespace: 'availability_count_per_hour',
                    cache: true
                },
                ['start_date', 'end_date'],
                undefined,
                undefined,
                this.data_Store),

                HourlyRate = Config({
                    id: 'min_hours',
                    name: 'min_hours',
                    url: '/api/hourly_rate_min_hours',
                    namespace: 'min_hours',
                    cache: true
                },
                undefined,
                undefined,
                undefined,
                this.data_Store);

                /* ROUTER RESOLVE - LOADING POINT FOR DIARY*/
                this.load = function(arrival_ms, create_reservation_data) {
                    var _data_Store     = this.data_Store,
                        arrival_times   = this.fetchArrivalTimes(15, []),
                        time            = util.gridTimeComponents(arrival_ms, 48),
                        q = $q.defer();

                        _data_Store.set({
                            common_reservation_data: {
                                company_id: undefined,
                                travel_Agent_id: undefined,
                                guest_first_name: undefined,
                                guest_last_name: undefined,
                                occupancy_data: {
                                    adults: 1,
                                    children: 0,
                                    infants: 0
                                }
                            }
                        });

                        if (create_reservation_data) {
                            time = util.gridTimeComponents(create_reservation_data.start_date, 48);

                            _data_Store.set({
                                filter: {
                                    arrival_time: arrival_ms.toComponents().time.toString(),
                                    min_hours: (create_reservation_data.end_date - create_reservation_data.start_date) / 3600000,
                                    room_type_id: create_reservation_data.room_type_id
                                },
                                common_reservation_data: {
                                    company_id: create_reservation_data.company_id,
                                    travel_agent_id: create_reservation_data.travel_agent_id,
                                    occupancy_details: {
                                        adults: create_reservation_data.adults,
                                        children: create_reservation_data.children,
                                        infants: create_reservation_data.infants
                                    }
                                 }
                             });
                        }
                        var start_date = time.toStartDate();
                        var end_date = time.x_p;

                        // CICO-43712
                        start_date.setHours(0, 0, 0);
                        end_date.setHours(0, 0, 0);
                        $q.all([Maintenance.read(),
                                RoomType.read(),
                                InActiveRoomSlots.read(dateRangeForDateChange(time.toShijuBugStartDate(0), time.toShijuBugEndDate(23))),
                                Room.read(),
                                Occupancy.read(dateRangeForDateChange(time.toShijuBugStartDate(0), time.toShijuBugEndDate(23))), // time.toStartDate(), time.toEndDate())),
                                AvailabilityCount.read(dateRange(start_date, end_date))])
                                .then(function(data_array) {
                                    _.reduce([
                                          Maintenance,
                                          RoomType,
                                          InActiveRoomSlots,
                                          Room,

                                          Occupancy,

                                          AvailabilityCount],
                                function(memo, obj, idx) {
                                    obj.resolve(data_array[idx]);
                            }, data_array);

                            return HourlyRate.read();
                        })
                        .then(function(data) {
                            HourlyRate.resolve(data);

                            _data_Store.set({
                                filter: {
                                    arrival_times: arrival_times,
                                    arrival_time: time.x_origin_start_time.toString(),
                                    rate: undefined,
                                    rate_id: undefined,
                                    rate_type: 'Standard',
                                    room_type: _data_Store.get('room_type'),
                                    room_type_id: create_reservation_data ? create_reservation_data.room_type_id : ''
                                },
                                display: {
                                    x_n: time.x_n,
                                    x_n_time: time.x_n_time,
                                    x_origin: time.x_0,
                                    x_origin_start_time: time.x_origin_start_time,
                                    x_p: time.x_p,
                                    x_p_time: time.x_p_time,
                                    x_offset: time.x_offset,
                                    min_hours: _data_Store.get('min_hours')
                                }
                            });

                            q.resolve(_data_Store.get(
                                'display',
                                'filter',
                                'common_reservation_data',
                                'room',
                                'availability_count'
                            ));

                        }, function(err) {
                            q.reject(err);
                        });

                    return q.promise;
                };

                // variables using for reservation transfer from one date to another
                this.isReservationMovingFromOneDateToAnother = false;
                this.movingReservationData = {
                    reservation: undefined,
                    originalRoom: undefined,
                    originalReservation: undefined
                };

                this.callOccupancyAndAvailabilityCount = function(start_date, end_date) {
                    var _data_Store = this.data_Store,
                        time        = util.gridTimeComponents(start_date, 48),
                        q           = $q.defer(),
                        __this = this;

                    $q.all([
                            InActiveRoomSlots.read(dateRangeForDateChange(time.toShijuBugStartDate(0), time.toShijuBugEndDate(23))),
                            Room.read(),
                            Occupancy.read(dateRangeForDateChange(time.toShijuBugStartDate(0), time.toShijuBugEndDate(23))), // time.toStartDate(), time.toEndDate())),
                            AvailabilityCount.read(dateRange(time.x_n, time.x_p))])
                            .then(function(data_array) {
                                // if there is any reservation transfter initiated from one day to another
                                if (__this.isReservationMovingFromOneDateToAnother) {
                                    var reservation = __this.movingReservationData.reservation;
                                    var arrival_date,
                                        res_arrival  = new Date (reservation.arrival),
                                        res_depature = new Date (reservation.departure),
                                        diff = res_depature.getTime() - res_arrival.getTime(),
                                        departure_date;

                                    arrival_date = new Date (time.x_n);
                                    arrival_date.setHours (res_arrival.getHours(), res_arrival.getMinutes(), 0);

                                    departure_date = new Date (arrival_date.getTime() + diff);

                                    reservation.arrival_date  = arrival_date.toComponents().date.toDateString();
                                    reservation.arrival_time  = arrival_date.toComponents().time.toHourAndMinute(":", 24);
                                    reservation.arrival        = arrival_date.getTime();

                                    reservation.departure_date = departure_date.toComponents().date.toDateString();
                                    reservation.departure_time  = departure_date.toComponents().time.toHourAndMinute(":", 24);
                                    reservation.departure        = departure_date.getTime();
                                    // 2 is the index of array who is having reservations
                                    var indexOfSameReservationAlreadyInList = _.findIndex (data_array[2].reservations,
                                                                    {reservation_id: reservation.reservation_id});

                                    data_array[2].reservations.push(reservation);

                                    if (indexOfSameReservationAlreadyInList >= 0) {
                                        // 2 is the index of array who is having reservations
                                        data_array[2].reservations.splice(indexOfSameReservationAlreadyInList, 1);
                                    }
                                }
                                _.reduce([
                                      InActiveRoomSlots,
                                      Room,
                                      Occupancy,
                                      AvailabilityCount],
                            function(memo, obj, idx) {
                                obj.resolve(data_array[idx]);
                        }, data_array);

                        q.resolve(_data_Store.get(
                                'room',
                                'availability_count'
                            ));
                    }, function() {
                        q.reject();
                    });


                    return q.promise;
                };

                /* Process list of arrival times that increment by "base_interval"*/
                this.fetchArrivalTimes = function(base_interval, results) {
                    var day_min = 24 * 60,
                        min, hour;

                    for (var i = 0; i < day_min; i += base_interval) {
                        min  = (i % 60);
                        hour = parseInt(i / 60, 10) ;

                        results.push((hour < 10 ? '0' + hour : hour) + ':' + (min < 10 ? '0' + min : min));
                    }

                    return results;
                };


                /* Primary Method to obtain Occupancy Slots for a given date range*/
                this.Occupancy = function(start_date, end_date) {
                    var q = $q.defer();

                    Occupancy.read(dateRange(start_date, end_date))
                    .then(function(data) {
                        console.log(data);
                        Occupancy.resolve(data);

                        q.resolve(Occupancy.store.data);
                    }, function(err) {
                        q.reject(err);
                    });

                    return q.promise;
                };

                /* Primary Method to obtain Available Slot Count for a given date range*/
                this.AvailabilityCount = function(start_date, end_date) {
                    var q = $q.defer();

                    AvailabilityCount.read(dateRange(start_date, end_date))
                    .then(function(data) {
                        AvailabilityCount.resolve(data);

                        q.resolve(AvailabilityCount.store.data);
                    }, function(err) {
                        q.reject(err);
                    });

                    return q.promise;
                };

                /* Primary Method to obtian Available Slots for a given range, room type, and optional
                  GUID*/
                this.Availability = function(params) {
                    var self               = this,
                        start_date         = params.start_date,
                        end_date           = params.end_date,
                        room_type_id       = params.room_type_id,
                        rate_type          = params.rate_type,
                        account_id         = params.account_id,
                        reservation_id     = params.reservation_id,
                        GUID               = params.GUID,
                        _data_Store        = self.data_Store,
                        q                  = $q.defer(),
                        guid               = GUID || _.uniqueId('avl-'),
                        is_unassigned_room = params.is_unassigned_room,
                        params             = dateRange(start_date, end_date, room_type_id, rate_type);

                    // If rate_type is available
                    if (rate_type) {
                        if (account_id) {
                            _.extend(params, { account_id: account_id });
                        }
                    }
                    if (reservation_id) {
                        _.extend(params, { reservation_id: reservation_id });
                    }

                    // if from unassigned room
                    if ( is_unassigned_room ) {
                        _.extend(params, { is_unassigned_room: true });
                    }

                    Availability.read(params)
                    .then(function(data) {
                        if (data && data.results) {
                            if (data.contract_id) {
                                _data_Store.set({
                                    contractId: data.contract_id
                                });
                            }
                            var availability = data.results[0].availability;
                            var roomTypes = data.results[0].room_types;
                            var match;

                            _.each(availability, function(avail) {
                                match = _.find(roomTypes, { id: avail.room_type_id });

                                if ( !! match ) {
                                    avail.physical_count = match.available_count;
                                }
                            });

                            var existing_data   = JSON.parse(JSON.stringify(Availability.store.data)),
                                existing_ids    = _.pluck(existing_data, "id"),
                                new_coming_data = JSON.parse(JSON.stringify(data.results[0].availability)),
                                new_coming_ids  = _.pluck(new_coming_data, "id"),
                                id_difference   = undefined;


                                if (existing_ids.length > 0) {
                                    id_difference = _.difference(existing_ids, new_coming_ids);

                                    var len = Availability.store.data.length;


                                    for (var i = 0; i < len; i++) {
                                       for (var k = 0; k < id_difference.length; k++) {
                                            if (Availability.store.data[i] && _.has(Availability.store.data[i], "id") &&  Availability.store.data[i].id === id_difference[k]) {
                                                Availability.store.data.splice(i);
                                                delete Availability.store.group.values.id[id_difference[k]];
                                                len--;
                                            }
                                        }
                                    }
                                }


                            Availability.resolve(data.results.shift(), [
                                start_date,
                                end_date,
                                guid,
                                false
                            ]);
                            q.resolve(Availability.store.data);
                       }
                    },
                   function(error) {
                        q.reject(error);
                   });

                    return q.promise;
                }.bind(this);

                /**
                * primary method to get availability against a room
                * usually used when reservation editing with time slot changing or room changing
                */
                this.roomAvailabilityCheckAgainstReservation = function(data) {
                    var params = {
                        room_id: data.room_id,
                        reservation_id: data.reservation_id,
                        begin_date: data.begin_date,
                        begin_time: data.begin_time,
                        end_date: data.end_date,
                        end_time: data.end_time,
                        rate_type: data.rate_type
                    };

                    if (data.rate_type === 'Corporate') {
                        if (data.account_id) {
                            _.extend(params, { account_id: data.account_id });
                        }
                    }
                    // Webservice calling section
                    var deferred = $q.defer();
                    var url = '/api/hourly_availability/room';

                    rvBaseWebSrvV2.getJSON(url, params).then(function(resultFromAPI) {
                        deferred.resolve(resultFromAPI);
                    }, function(error) {
                        deferred.reject(error);
                    });
                    return deferred.promise;
                };

                this.properDateTimeCreation = function(start_date) {
                    var data       = $vault.get('searchReservationData'),
                        arrivalFormatted;

                    start_date = start_date ? new tzIndependentDate(start_date) : new tzIndependentDate($rootScope.businessDate);

                    if (data) {
                        data = JSON.parse(data);
                        arrivalFormatted = getTimeFormated(data.arrivalTime.hh, data.arrivalTime.mm, data.arrivalTime.ampm);
                        arrivalFormatted = arrivalFormatted.split(":");
                        start_date.setHours(parseInt(arrivalFormatted[0]), parseInt(arrivalFormatted[1]));
                    } else {
                        correctTime();
                    }

                    return start_date;

                    function correctTime() {
                        var now = new Date(Date.now()),
                            hh   = now.getHours(),
                            mm   = now.getMinutes(),
                            ampm = '';

                        // first decide AMP PM
                        if ( hh > 12 ) {
                            ampm = 'PM';
                        } else {
                            ampm = 'AM';
                        }

                        // the time must be rounded to next 15min position
                        // if the guest came in at 3:10AM it should be rounded to 3:15AM
                        if ( mm > 45 && hh + 1 < 12 ) {
                            hh += 1;
                            mm = 0;
                        } else if ( mm > 45 && hh + 1 === 12 ) {
                            if ( ampm === 'AM' ) {
                                hh  = 12;
                                mm = 0;
                                ampm    = 'PM';
                            } else {
                                hh  = 12;
                                mm = 0;
                                ampm    = 'AM';
                            }
                        } else if ( mm === 15 || mm === 30 || mm === 45 ) {
                            mm += 15;
                        } else if ( Math.max(mm, 15) === 15 ) {
                            mm = 15;
                        } else if ( Math.max(mm, 30) === 30 ) {
                            mm = 30;
                        } else {
                            mm = 45;
                        }

                        start_date.setHours(hh, mm);
                    }
                };

                /**
                *   check reservation availability for another date,
                *   used to check the availability while transfering from
                *   one date to another (usually more than 2days)
                *   @param {object} with necessary params
                *   @return {promise}
                */
                this.checkAvailabilityForReservationToA_Date = function (data) {
                    var params = {
                        room_id: data.room_id,
                        reservation_id: data.reservation_id,
                        begin_date: data.begin_date,
                        begin_time: data.begin_time,
                        end_date: data.end_date,
                        end_time: data.end_time,
                        rate_type: data.rate_type
                    };

                    if (data.rate_type === 'Corporate') {
                        if (data.account_id) {
                            _.extend(params, { account_id: data.account_id });
                        }
                    }

                    // Webservice calling section
                    var deferred = $q.defer();
                    var url = '/api/hourly_availability/room_move';

                    rvBaseWebSrvV2.getJSON(url, params).then(function(resultFromAPI) {
                        deferred.resolve(resultFromAPI);
                    }, function(error) {
                        deferred.reject(error);
                    });
                    return deferred.promise;

                };

                /* Process data points set during create reservation that redirects here*/
                this.ArrivalFromCreateReservation = function() {
                    var data = $vault.get('searchReservationData');

                    if (data) {
                        data = JSON.parse(data);
                    }

                    if (data) {
                        var hoursInDay = getTotalHours(data.fromDate),
                            dstChange = hoursInDay.hasExtraHour ? 1 : (hoursInDay.hasLessHour ? -1 : 0);

                        var start_date   = parseDate(data.fromDate, data.arrivalTime, dstChange),
                            end_date     = parseDate(data.toDate, data.departureTime, dstChange),
                            __start_date = new Date(data.fromDate),
                            __end_date   = new Date(data.toDate);

                            __start_date.setHours(0);
                            __end_date.setHours(0);
                            __start_date.setMinutes(0);
                            __end_date.setMinutes(0);

                        return {
                            __start_date: __start_date,
                            __end_date: __end_date,
                            start_date: start_date,
                            end_date: end_date,
                            adults: data.adults,
                            children: data.children,
                            infants: data.infants,
                            room_type_id: data.roomTypeID,
                            guest_first_name: data.guestFirstName,
                            guest_last_name: data.guestLastName,
                            company_id: data.companyID,
                            travel_agent_id: data.TravelAgenID,
                            minHours: parseInt(data.minHours)
                        };
                    }

                    /* Method to parse object time props into MS*/
                    function parseDate(ms, timeObj, dstChange) {
                        var t_a, t_b;

                        var diffDiff = dstChange * 3600000;

                        // since the date passed from the reservation search screen will
                        // also have the hour and minutes, so lets reset that to zero
                        // update it will the passed down hours, read further
                        var ms = new tzIndependentDate(ms).setHours(0, 0, 0);

                        if (timeObj.ampm === 'PM') {
                            t_a = (12 + parseInt(timeObj.hh, 10)) * 3600000;
                        } else {
                            t_a = (parseInt(timeObj.hh, 10)) * 3600000;
                        }

                        t_b = parseInt(timeObj.mm, 10) * 60000;

                        return t_a + t_b + diffDiff + ms;
                    }

                    function getTotalHours(arrivalDate) {
                        var isDSTArrival = moment(arrivalDate).isDST(),
                            isDSTPrevious = moment(arrivalDate).add(-1, 'days').isDST(),
                            isDSTNext = moment(arrivalDate).add(1, 'days').isDST();

                        return {
                            hasExtraHour: isDSTArrival && !isDSTNext,
                            hasLessHour: isDSTArrival && !isDSTPrevious
                        };
                    }
                };

                this.fetchUnassignedRoomList = function(params) {
                    var deferred = $q.defer();
                    var url = '/api/hourly_occupancy/unassigned_list?date=' + params.date,
                        businessDate = $rootScope.businessDate;

                    rvBaseWebSrvV2.getJSON(url).then(function(data) {
                        angular.forEach(data.reservations, function(reservation) {
                            reservation.statusClass = reservation.arrival_date === businessDate ? 'guest check-in' : 'guest no-status';
                        });
                        deferred.resolve(data.reservations);
                    }, function(error) {
                        deferred.reject(error);
                    });
                    return deferred.promise;
                };

                this.fetchUnassignedRoomListCount = function(params) {
                    var deferred = $q.defer();
                    var url = '/api/hourly_occupancy/unassigned_list?date=' + params.date;

                    rvBaseWebSrvV2.getJSON(url).then(function(data) {
                        deferred.resolve(data.reservations.length);
                    }, function(error) {
                        deferred.reject(error);
                    });
                    return deferred.promise;
                };

                this.unassignRoom = function(params) {
                    var deferred = $q.defer();
                    var url = 'api/reservations/' + params.id + '/unassign_room/';

                    rvBaseWebSrvV2.postJSON(url).then(function(data) {
                        deferred.resolve(data.reservations);
                    }, function(error) {
                        deferred.reject(error);
                    });
                    return deferred.promise;
                };

                /**
                 * Fetch auto-assign status
                 */
                this.fetchAutoAssignStatus = function() {
                    var url = 'api/auto_room_assign_processes/status';

                    return sntBaseWebSrv.getJSON(url);
                };

                /**
                 * Unlock Diary after auto-assign process
                 */
                this.unlockRoomDiary = function() {
                    var url = 'api/auto_room_assign_processes/unlock_diary';

                    return sntBaseWebSrv.postJSON(url);
                };
            }]);
                // ------------------------------------------------------------------
