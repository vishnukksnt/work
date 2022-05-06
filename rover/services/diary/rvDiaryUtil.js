sntRover
.factory('rvDiaryUtil', ['rvDiaryMetadata', '$rootScope',
    function (rvDiaryMetadata, $rootScope) {
    	var meta = rvDiaryMetadata,
    		occ_meta = meta.occupancy,
    		rom_meta = meta.room,
    		avl_meta = meta.availability,
    		hops = Object.prototype.hasOwnProperty,
    		slice = Array.prototype.slice,
    		roomIndex,
    		reservationIndex,
    		copyReservation,
    		copyRoom,
    		updateRoomStatus,
    		updateReservation,
    		removeReservation,
    		clearRoomQuery,
    		reservationRoomTransfer,
			clearRowClasses,
			registerNotifictions,
			correctTime,
    		shallowCopy,
    		deepCopy,
    		copyArray,
    		mixin,
            inherit,
            gridTimeComponents;

        gridTimeComponents = function(arrival_ms, display_total_hours, display) {
            var ret,
                ms_per_day          = 43200000,
                ms_per_hr           = 3600000,
                perspective_offset  = (arrival_ms instanceof Date ? new Date(arrival_ms).toComponents().time.hours : 0),
                x_origin            = (arrival_ms instanceof Date ? arrival_ms.setHours(new Date(arrival_ms).toComponents().time.hours, new Date(arrival_ms).toComponents().time.minutes, 0) : arrival_ms),
                x_max               = (display_total_hours - perspective_offset) * ms_per_hr,
                x_min               = (display_total_hours * ms_per_hr - x_max),
                x_right             = x_origin + x_max,
                x_left              = x_origin - x_min,
                x_offset            = x_origin - (ms_per_hr * 2);

            ret = {
                x_offset: new tzIndependentDate(x_offset),
                x_origin: new tzIndependentDate(x_origin),
                x_0: new tzIndependentDate(x_origin),
                x_n: new tzIndependentDate(x_left),
                x_p: new tzIndependentDate(x_right),
                toShijuBugStartDate: function(start) {
                    return new tzIndependentDate(new tzIndependentDate(x_left).setHours(start, 0, 0));
                },
                toShijuBugEndDate: function(end) {
                    return new tzIndependentDate(new tzIndependentDate(x_right).setHours(end, 0, 0));
                },
                toStartDate: function() {
                    return new tzIndependentDate(new tzIndependentDate(x_left).setHours(0, 0, 0));
                },
                toEndDate: function() {
                    return new tzIndependentDate(new tzIndependentDate(x_right).setHours(23, 59, 0));
                }
            };

            ret.x_origin_start_time = ret.x_origin.toComponents().time.convertToReferenceInterval(15);
            ret.x_n_time = ret.x_n.toComponents().time.convertToReferenceInterval(15);
            ret.x_p_time = ret.x_p.toComponents().time.convertToReferenceInterval(15);

            if (display) {
                display.x_offset                = x_offset;
                display.x_origin                = x_origin;
                display.x_origin_start_time     = ret.x_origin_start_time;
                display.x_n                     = x_left;
                display.x_0                     = x_origin;
                display.x_n_time                = ret.x_n_time;
                display.x_p                     = x_right;
                display.x_p_time                = ret.x_p_time;

               ret.display = display;
            }

            return ret;
        };

        inherit = function(child, base) {
            child.prototype = Object.create(base.prototype);
            child.prototype.constructor = child;
        };

		mixin = function() {
			var objects = slice.call(arguments),
				i = 0,
				k,
				len = objects.length,
				base = Object.create(null);

			for (; i < len; i++) {
				for (k in objects[i]) {
					if (hops.call(objects[i], k)) {
						base[k] = objects[i][k];
					}
				}
			}

			return base;
		};

		copyArray = function(src, dest) {
    		var val;

    		dest = [];

    		for (var i = 0, len = src.length; i < len; i++) {
    			if (_.isObject(src[i])) {
    				val = deepCopy(src[i]);
    			} else if (_.isArray(src[i])) {
    				val = copyArray(src[i]);
    			} else {
    				val = src[i];
    			}

    			dest.push(val);
    		}

    		return dest;
    	};

    	shallowCopy = function(dest, src) {
    		var k;

    		for (k in src) {
    			if (hops.call(src, k) &&
    			   typeof src[k] !== 'function') {
    				dest[k] = src[k];
    			}
    		}

    		return dest;
    	};

		deepCopy = function(obj) {
			var newRes = {};

				for (var k in  obj) {
					if (hops.call(obj, k)) {
						if (obj[k] instanceof Date) {
							newRes[k] = new Date(obj[k].getTime());
						} else if (_.isArray(obj[k])) {
							newRes[k] = copyArray(obj[k]);
						} else if (_.isObject(obj[k])) {
							newRes[k] = deepCopy(obj[k]);
						} else {
							newRes[k] = obj[k];
						}
					}
				}

			return newRes;
		};

		roomIndex = function(rooms, room) {
			var idx = -1;

			for (var i = 0, len = rooms.length; i < len; i++) {
				if (rooms[i].id === room.id) {
					idx = i;
					return idx;
				}
			}

			return idx;
		};

		reservationIndex = function(room, reservation) {
			var idx = -1, occupancy = room.occupancy;

			for (var i = 0, len = occupancy.length; i < len; i++) {
				if (occupancy[i].reservation_id === reservation.reservation_id) {
					idx = i;
					return idx;
				}
			}
			return idx;
		};

		copyReservation = function(reservation) {
			return shallowCopy({}, reservation);
		};

		copyRoom = function(room) {
			return deepCopy(room);
		};

		updateRoomStatus = function(room, status) {
			room[meta.room.status] = status;
		};

		updateReservation = function(room, reservation) {
			var idx = reservationIndex(room, reservation);

			if (idx > -1) {
				room.occupancy[idx] = reservation;
			}
		};

		removeReservation = function(room, reservation) {
			var idx = reservationIndex(room, reservation);

			if (idx > -1) {
				return room.occupancy.splice(idx, 1);
			}

			return;
		};

		clearRoomQuery = function(rooms) {
			var room,
                m_status = meta.occupancy.status,
				reject = function(child) {
					return child[m_status].toLowerCase() === 'available';
				};

			for (var i = 0, len = rooms.length; i < len; i++) {
				room = rooms[i];
				room.occupancy = _.reject(room.occupancy, reject);
				room = deepCopy(room);
			}
		};

	 	reservationRoomTransfer = function(rooms, nextRoom, room, reservation) {
			var data = rooms,
				oldRoom,
				newRoom,
				idxOldRoom,
				idxNewRoom;

			oldRoom = copyRoom(room);

			if (nextRoom.id !== room.id) {
				newRoom = copyRoom(nextRoom);

				removeReservation(oldRoom, reservation);

				newRoom.occupancy.push(copyReservation(reservation));

                idxOldRoom = roomIndex(rooms, oldRoom);
                idxNewRoom = roomIndex(rooms, newRoom);


                if (idxOldRoom > -1 && idxOldRoom < data.length) {
                    data[idxOldRoom] = oldRoom;
                }

                if (idxNewRoom > -1 && idxNewRoom < data.length) {
                    data[idxNewRoom] = newRoom;
                }
			} else {
				updateReservation(oldRoom, reservation);
			}
		};

		clearRowClasses = function(rooms) {
	    	var data = rooms;

            if (data) {
    	    	for (var i = 0, len = data.length; i < len; i++) {
    	    		data[i] = deepCopy(data[i]);
    	    		data[i][meta.room.status] = '';
    	    	}
            }
	    };

	    registerNotifictions = function(obj) {
	    	if (_.isObject(obj)) {
	    		for (var k in obj) {
	    			if (hops.call(obj, k)) {
	    				switch (typeof obj[k]) {
	    					case 'function':

	    					break;
	    				}
	    			}
	    		}
	    	}
	    };


	    correctTime = function(date_string, propertyTime) {
            var hh   = parseInt(propertyTime.hotel_time.hh),
                mm   = parseInt(propertyTime.hotel_time.mm),
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

            var date         = date_string,
            	fromDate     = new tzIndependentDate(date).getTime(),
            	ms           = new tzIndependentDate(fromDate).setHours(0, 0, 0),
            	start_date   = (hh * 3600000) + (mm * 60000) + ms,
            	__start_date = new tzIndependentDate(date);

            __start_date.setHours(0, 0, 0);

            return {
        		'start_date': start_date,
        		'__start_date': __start_date,
        		'arrival_time': (hh < 10 ? '0' + hh : hh) + ':' + (mm === 0 ? '00' : mm)
        	};
        };

		return {
            gridTimeComponents: gridTimeComponents,
			clearRoomQuery: clearRoomQuery,
			removeReservation: removeReservation,
			updateReservation: updateReservation,
			updateRoomStatus: updateRoomStatus,
			copyRoom: copyRoom,
			copyReservation: copyReservation,
			reservationIndex: reservationIndex,
			roomIndex: roomIndex,
			reservationRoomTransfer: reservationRoomTransfer,
			clearRowClasses: clearRowClasses,
			shallowCopy: shallowCopy,
			copyArray: copyArray,
			deepCopy: deepCopy,
			mixin: mixin,
			correctTime: correctTime
		};
	}
]);
