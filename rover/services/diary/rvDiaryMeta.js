sntRover
.factory('rvDiaryMetadata', function() {
	return Object.freeze(Object.seal({
		room: {
			id: 'id',
			number: 'room_no',
			type: 'room_type_name',
			type_id: 'room_type_id',
			row_children: 'occupancy',
			inactive_slots: 'room_inactive_slots',
			hk_status: 'room_status',
			hk_status_map: {
				'CLEAN': 'clean',
				'DIRTY': 'dirty',
                'INSPECTED': 'inspected',
				'PICKUP': 'pickup',
				'DO_NOT_DISTURB': 'dnd'
			},
			connecting_room_no: 'connecting_room_no'
		},
		room_type: {
			id: 'id'
		},
		maintenance: {
			id: 'room_type_id',
			time_span: 'housekeeping_task_completion_time'
		},
		occupancy: {
			id: 'reservation_id',
			room_id: 'room_id',
			room_type: 'room_type',
			status: 'reservation_status',
			room_status: 'room_service_status',
			guest: 'reservation_primary_guest_full_name',
			accompanying_guests: 'accompanying_guests',
			start_date: 'arrival',
			end_date: 'departure',
			maintenance: 'maintenance',
			rate: 'amount',
			room_status: 'room_service_status',
			tr_ag_name: 'travel_agent_name',
			cmp_name: 'company_card_name'
		},
		availability: {
			id: 'reservation_id',
			room_id: 'id',
			price: 'amount',
			rate_type_id: 'rate_type_id'
		},
		availability_count: {
			id: 'hour'
		},
		inactive_rooms: {
			id: 'room_id',
			status: 'service_status',
			number: 'room_no'
		}
	}));
});
