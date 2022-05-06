sntRover.controller('rvAllowancesCtrl',
	['$scope', 'RVBillCardSrv', 'ngDialog', function($scope, RVBillCardSrv, ngDialog) {
		BaseCtrl.call(this, $scope, ngDialog);
		
		$scope.keys = Object.keys;

		$scope.isActivitiesTabOpen = true;
		$scope.isGroupedByDate = true;
		$scope.shareQuery = {
			query: ''
		};
		$scope.shareData = [];
		$scope.filteredShareData = [];
		$scope.selectedRooms = [];
		$scope.groupedSelectedRooms = {};
		$scope.sharedAllowances = {};
		$scope.statusMap = {
			'RESERVED': 'arrival',
			'PRE_CHECKIN': 'pre-check-in',
			'CHECKEDIN': 'check-in',
			'CHECKEDOUT': 'check-out',
			'NOSHOW': '',
			'CANCELED': 'cancel'

		};
		$scope.errorMessage = '';
		$scope.successMessage = '';

		$scope.toggleGrouping = function() {
			$scope.isGroupedByDate = !$scope.isGroupedByDate;
		};

		$scope.switchTab = function() {
			$scope.isActivitiesTabOpen = !$scope.isActivitiesTabOpen;

			if (!$scope.isActivitiesTabOpen) {
				$scope.onQueryUpdate();
			}
		};

		$scope.closeDialog = function() {
			ngDialog.close();
		};

		$scope.filterShareData = function() {
			try {
				$scope.filteredShareData = _.filter($scope.shareData, function(i) {
					return !$scope.hasAllAllowancesShared(i);
				});			
			} catch (error) {
				console.error(error);
			}
		};

		$scope.hasAllAllowancesShared = function(item) {
			const selectedRoom = $scope.selectedRooms.find(function(r) {
				return r.id === item.id;
			});

			if (!selectedRoom) {
				return false;
			}

			const foundCount = _.filter(selectedRoom.allowances, function(a) {
				return a.checked === true;
			}).length;

			return foundCount === item.allowances_count;
		};

		$scope.toggleCheckedRoom = function(id, allowanceId) {
			var roomIdx = _.findIndex($scope.selectedRooms, function(r) {
				return r.id === id;
			});

			var alwIdx = _.findIndex($scope.selectedRooms[roomIdx].allowances, function(a) {
				return a.id === allowanceId;
			});

			$scope.selectedRooms[roomIdx].allowances[alwIdx].checked = !$scope.selectedRooms[roomIdx].allowances[alwIdx].checked;
		};

		$scope.isRoomChecked = function(id, allowanceId) {
			var roomIdx = _.findIndex($scope.selectedRooms, function(r) {
				return r.id === id;
			});

			var alwIdx = _.findIndex($scope.selectedRooms[roomIdx].allowances, function(a) {
				return a.id === allowanceId;
			});

			return $scope.selectedRooms[roomIdx].allowances[alwIdx] && $scope.selectedRooms[roomIdx].allowances[alwIdx].checked;
		};

		$scope.saveSharing = function() {
			$scope.error = '';
			var flatAllowances = _.flatten(_.map($scope.selectedRooms, function(room) {
				return {
					id: room.id,
					allowances: _.filter(room.allowances, function(a) {
						return a.checked;
					})
				};
			}));

			var allowancesPerReservation = _.map(flatAllowances, function(a) {
				return {
					to_reservation_id: a.id,
					allowances: _.map(a.allowances, function(allowance) {
						return {
							id: allowance.id,
							name: allowance.name,
							description: allowance.description
						};
					})
				};
			});

			var data = { shared_allowances: allowancesPerReservation };

			$scope.callAPI(RVBillCardSrv.saveAllowanceShares, {
				params: {
					reservationId: $scope.reservationBillData.reservation_id,
					data: data
				},
				successCallBack: function (response) {
					if (response.errors.length) {
						$scope.errorMessage.response.errors.join('. ');
						return;
					}

					$scope.onQueryUpdate();
					
					if (response.data.length) {
						$scope.successMessage = response.data;
					}
				},
				failureCallBack: function (error) {
					$scope.errorMessage = error;
				}
			});
		};

		$scope.onSelectRoom = function(room, event) {
			const roomCopy = angular.copy(room);

			if (event) {
				event.preventDefault();
				event.stopImmediatePropagation();
				$scope.selectedRooms = _.filter($scope.selectedRooms, function(s) {
					return s.id !== room.id;
				});

				roomCopy.allowances = _.map(roomCopy.allowances, function(r) {
					r.checked = true;
					return r;
				});	
			} else {
				const shared = _.map(roomCopy.shared_allowances, function(sA) { return sA.allowances; });

				roomCopy.allowances = _.map(_.flatten(shared), function(r) {
					r.checked = true;
					return r;
				});	
			}

			$scope.selectedRooms.push(roomCopy);

			var mapped;

			try {
				if (event) {
					mapped = _.map($scope.selectedRooms, function(r) {
						var obj = r.allowances;

						_.each(r.allowances, function(v, k) {
							obj[k].id = v.id;
							obj[k].room_id = r.id;
							obj[k].firstname = r.firstname;
							obj[k].lastname = r.lastname;
							obj[k].room = r.room;
							obj[k].reservation_status = r.reservation_status.value;
						});
						return obj;
					});
				} else {
					mapped = _.map($scope.selectedRooms, function(r) {
						var obj = _.flatten(_.map(r.shared_allowances, function(sA) {
							return sA.allowances;
						}));

						_.each(obj, function(v, k) {
							obj[k].id = v.id;
							obj[k].room_id = room.id;
							obj[k].firstname = r.firstname;
							obj[k].lastname = r.lastname;
							obj[k].room = r.room;
							obj[k].reservation_status = r.reservation_status.value;
							obj[k].checked = true;
						});
						return obj;
					});
				}

				$scope.groupedSelectedRooms = _.groupBy(_.flatten(mapped), function(item) {
					return item.id;
				});
			} catch (e) {
				console.error(e);
			}
			$scope.filterShareData();
			return false;		
		};

		$scope.onQueryUpdate = function() {
			$scope.callAPI(RVBillCardSrv.searchAllowanceShares, {
				params: {
					reservationId: $scope.reservationBillData.reservation_id,
					query: $scope.shareQuery.query
				},
				successCallBack: function (response) {
					$scope.selectedRooms = [];
					$scope.shareData = response.results;
					$scope.filterShareData();

					_.each(response.results, function(r) { 
						if (r.shared_allowances.length > 0) {
							$scope.onSelectRoom(r);
						}
					});

					const mapped = _.map(response.results, function(result) {
						var obj = _.flatten(_.map(result.shared_allowances, function(sA) {
							return sA.allowances;
						}));

						_.each(obj, function(v, k) {
							obj[k].id = v.id;
							obj[k].room_id = result.id;
							obj[k].firstname = result.firstname;
							obj[k].lastname = result.lastname;
							obj[k].room = result.room;
							obj[k].reservation_status = result.reservation_status.value;
							obj[k].checked = true;
						});

						return obj;
					});

					try {
						$scope.groupedSelectedRooms = _.groupBy(_.flatten(mapped), function(item) {
							return item.id;
						});
						$scope.successMessage = '';
					} catch (e) {
						console.error(e);
					}					
				},
				failureCallBack: function (error) {
					$scope.errorMessage = error;
					$scope.groupedAllowanceData = false;
					$scope.sharedData = [];
				}
			});
		};

		$scope.debounceQueryUpdate = _.debounce($scope.onQueryUpdate, 500);
		$scope.onQueryUpdate();
	
}]);