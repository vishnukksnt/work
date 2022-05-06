angular.module('sntRover').controller('RVWorkManagementCtrl', 
	['$rootScope', '$scope', 'employees', 'workTypes', 'shifts', 'floors', '$timeout',
	function($rootScope, $scope, employees, workTypes, shifts, floors, $timeout) {

		BaseCtrl.call(this, $scope);

		$scope.setHeading = function(headingText) {
			$scope.heading = headingText;
			$scope.setTitle(headingText);
		};

		$scope.setHeading("Work Management");

		$scope.$emit("updateRoverLeftMenu", "workManagement");

		$scope.workTypes = workTypes;

		$scope.employeeList = employees;

		$scope.shifts = shifts;

		$scope.floors = floors;


		// Arrived / Day Use / Due Out / Departed,Due out / Arrival,Departed / Arrival,Arrived / Departed,Due out / Departed,Arrived,Stayover,Departed,Not Defined

		$scope.reservationStatus = {
			"Due out": "check-out",
			"Departed": "check-out",
			"Stayover": "inhouse",
			"Not Reserved": "no-show",
			"Arrival": "check-in",
			"Arrived": "check-in",
			"Not Defined": "no-show",
			"Day Use": "check-out",
			"Due out / Arrival": "check-out",
			"Departed / Arrival": "check-out",
			"Arrived / Departed": "check-in",
			"Due out / Departed": "check-out",
			"Arrived / Day use / Due out": "check-in",
			"Arrived / Day use / Due out / Departed": "check-in"
		};

		$scope.arrivalClass = {
			"Arrival": "check-in",
			"Arrived": "check-in",
			"Due out": "no-show",
			"Departed": "no-show",
			"Stayover": "no-show",
			"Not Reserved": "no-show",
			"Not Defined": "no-show",
			"Day Use": "check-in",
			"Due out / Arrival": "check-in",
			"Departed / Arrival": "check-in",
			"Arrived / Departed": "check-in",
			"Due out / Departed": "no-show",
			"Arrived / Day use / Due out": "check-in",
			"Arrived / Day use / Due out / Departed": "check-in"
		};

		// CICO-12517: Changed "no-show" to "check-out"
		// since we want the count to go up anyway.
		// @CHANGED_FOR: 'Arrival', 'Arrived', 'Not Reserved', 'Not Defined'
		// @LINK: https://stayntouch.atlassian.net/browse/CICO-12517?focusedCommentId=42716&page=com.atlassian.jira.plugin.system.issuetabpanels:comment-tabpanel#comment-42716
		$scope.departureClass = {
			"Arrival": "check-out",
			"Arrived": "check-out",
			"Due out": "check-out",
			"Departed": "check-out",
			"Stayover": "inhouse",
			"Not Reserved": "check-out",
			"Not Defined": "check-out",
			"Day Use": "check-out",
			"Due out / Arrival": "check-out",
			"Departed / Arrival": "check-out",
			"Arrived / Departed": "check-out",
			"Due out / Departed": "check-out",
			"Arrived / Day use / Due out": "check-out",
			"Arrived / Day use / Due out / Departed": "check-out"
		};

		$scope.printWorkSheet = function() {
			window.print();
		};

		$scope.addDuration = function(augend, addend) {
			if (!addend) {
				return augend;
			}
			var existing = augend.split(":"),
				current = addend.split(":"),
				sumMinutes = parseInt(existing[1]) + parseInt(current[1]),
				sumHours = (parseInt(existing[0]) + parseInt(current[0]) + parseInt(sumMinutes / 60)).toString();

			return (sumHours.length < 2 ? "0" + sumHours : sumHours) +
				":" +
				((sumMinutes % 60).toString().length < 2 ? "0" + (sumMinutes % 60).toString() : (sumMinutes % 60).toString());
		};

		// so this functionality has alterred a little
		// we now have a new argument - allUnassigned
		// if the user choose the option to view all rooms - showAllRooms
		// we will be using this new argument to create the filterRooms
		// the else case is just as before, no change
		// $scope.filterUnassignedRooms = function(filter, rooms, allUnassigned, alreadyAssigned) {
		$scope.filterUnassignedRooms = function(filter, allUnassigned, allRooms) {
			var filterObj = {},
				roomDetails,
				noMatched;

			if ( filter.showAllRooms ) {
				_.each(allUnassigned, function(room) {
					room.show = true;
				});
			} else {

				if (filter.selectedFloor) {
					filterObj.floor_number = filter.selectedFloor;
				}
				if (filter.selectedReservationStatus) {
					filterObj.reservation_status = filter.selectedReservationStatus;
				}
				if (filter.vipsOnly) {
					filterObj.is_vip = true;
				}
				if (filter.selectedFOStatus) {
					filterObj.fo_status = filter.selectedFOStatus;
				}

				_.each(allUnassigned, function(room) {
					roomDetails = allRooms[room.room_index];

					noMatched = _.find(filterObj, function(value, key) {
						return roomDetails[key] !== value;
					});

					if ( ! noMatched ) {
						room.show = true;
					} else {
						room.show = false;
					}
				});


				var cib, cia, cob, coa, roomTime, filterBeforeTime, filterAfterTime;

				if ( filterHasTime() ) {
					_.each(allUnassigned, function(room) {
						var refData = allRooms[room.room_index];

						if ( roomHasTime(refData) ) {
							cib = filter.checkin.before;
							cia = filter.checkin.after;
							cob = filter.checkout.before;
							coa = filter.checkout.after;

							if ( !! cia.hh && !! cib.hh ) { // CASE 1 & 2
								roomTime = refData.checkin_time;
								filterAfterTime = cia.hh + ':' + (cia.mm || '00') + ' ' + cia.am;
								filterBeforeTime = cib.hh + ':' + (cib.mm || '00') + ' ' + cib.am;

								if ( get24hourTime(roomTime) >= get24hourTime(filterAfterTime) && get24hourTime(roomTime) <= get24hourTime(filterBeforeTime) ) {
									room.show = true;
								} else {
									room.show = false;
								}
							}
							else if ( !! cia.hh ) { // CASE 1 : Arrival After
								roomTime = refData.checkin_time;
								filterAfterTime = cia.hh + ':' + (cia.mm || '00') + ' ' + cia.am;

								if ( get24hourTime(roomTime) >= get24hourTime(filterAfterTime) ) {
									room.show = true;
								} else {
									room.show = false;
								}
							}
							else if ( !!cib.hh ) { // CASE 2 : Arrival Before
								roomTime = refData.checkin_time;
								filterBeforeTime = cib.hh + ':' + (cib.mm || '00') + " " + cib.am;

								if ( get24hourTime(roomTime) >= get24hourTime(filterBeforeTime) ) {
									room.show = true;
								} else {
									room.show = false;
								}
							}
							else if ( !! coa.hh && !! cob.hh ) { // CASE 3 & 4
								roomTime = refData.checkout_time;
								filterAfterTime = coa.hh + ':' + (coa.mm || '00') + " " + coa.am;
								filterBeforeTime = cob.hh + ':' + (cob.mm || '00') + " " + cob.am;

								if ( get24hourTime(roomTime) >= get24hourTime(filterAfterTime) && get24hourTime(roomTime) <= get24hourTime(filterBeforeTime) ) {
									room.show = true;
								} else {
									room.show = false;
								}
							}
							else if ( !! coa.hh ) { // CASE 3 : Departure After
								roomTime = refData.checkout_time;
								filterAfterTime = coa.hh + ':' + (coa.mm || '00') + " " + coa.am;

								if ( get24hourTime(roomTime) >= get24hourTime(filterAfterTime) ) {
									room.show = true;
								} else {
									room.show = false;
								}
							}
							else if ( !! cob.hh ) { // CASE 4 : Departure Before
								roomTime = refData.checkin_time;
								filterBeforeTime = cob.hh + ':' + (cob.mm || '00') + " " + cob.am;

								if ( get24hourTime(roomTime) <= get24hourTime(filterBeforeTime) ) {
									room.show = true;
								} else {
									room.show = false;
								}
							}
						}
					});
				}


				function filterHasTime () {
					return !! filter.checkin.before.hh || !! filter.checkin.after.hh || !! filter.checkout.after.hh || !! filter.checkout.after.hh;
				}

				function roomHasTime (room) {
					return ( !! room.checkin_time && (!! filter.checkin.before.hh || !! filter.checkin.after.hh) ) || ( !! room.checkout_time && (!! filter.checkout.before.hh || !! filter.checkout.after.hh) );
				}

				function get24hourTime (time) {
					var firstSplit, secondSplit, ret;

					if ( !! time ) {
						firstSplit  = time.toString().split(':');
						secondSplit = firstSplit[1].split(' ');
						ret         = firstSplit[0];

						if ( secondSplit[1].toString() && secondSplit[1].toString().toUpperCase() === 'PM' ) {
							ret = parseInt( ret ) + 12;
						} else {
							ret = ( parseInt(ret) + 12 ) % 12;
						}

						if ( ret.toString().length < 2 ) {
							ret = '0' + ret.toString();
						}

						ret += ':' + secondSplit[0];
					} else {
						ret = '00:00';
					}

					return ret;
				}
			}
		};
	}
]);
