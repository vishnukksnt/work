sntRover.controller('rvGroupAllowancesCtrl',
	['$scope', 'rvAccountTransactionsSrv', 'ngDialog', function($scope, rvAccountTransactionsSrv, ngDialog) {
		BaseCtrl.call(this, $scope, ngDialog);
		
		$scope.keys = Object.keys;

		$scope.isActivitiesTabOpen = true;
		$scope.isGroupedByDate = true;
		$scope.shareQuery = {
			query: ''
		};
		$scope.shareData = [];
		$scope.filteredShareData = [];
		$scope.shared = [];
		$scope.groupedSharedAllowances = {};
		$scope.sharedAllowances = {};
		$scope.errorMessage = '';
		$scope.successMessage = '';

		$scope.statusMap = {
			'RESERVED': 'arrival',
			'PRE_CHECKIN': 'pre-check-in',
			'CHECKEDIN': 'check-in',
			'CHECKEDOUT': 'check-out',
			'NOSHOW': 'no-show',
			'CANCELED': 'cancel'
		};

		$scope.toggleMode = function() {
			$scope.isActivitiesTabOpen = !$scope.isActivitiesTabOpen;
			if (!$scope.isActivitiesTabOpen) {
				$scope.onQueryUpdate();
			}
		};

		$scope.toggleGrouping = function() {
			$scope.isGroupedByDate = !$scope.isGroupedByDate;
		};
		
		$scope.toggleChecked = function(id, allowanceId) {
			var roomIdx = _.findIndex($scope.shared, function(r) {
				return r.id === id;
			});

			var alwIdx = _.findIndex($scope.shared[roomIdx].allowances, function(a) {
				return a.id === allowanceId;
			});

			$scope.shared[roomIdx].allowances[alwIdx].checked = !$scope.shared[roomIdx].allowances[alwIdx].checked;
		};


		$scope.closeDialog = function() {
			ngDialog.close();
		};

		$scope.filterShareData = function() {
			$scope.filteredShareData = _.filter($scope.shareData, function(i) {
				return ['CHECKEDIN', 'RESERVED'].indexOf(i.reservation_status.value) !== -1
					&& !$scope.hasAllAllowancesShared(i.id, i.allowances_count);
			});
		};

		$scope.hasAllAllowancesShared = function(id, count) {
			const flatShares = _.flatten(
				Array.from(Object.values($scope.groupedSharedAllowances))
			);
			const foundCount = _.filter(flatShares, function(s) {
				return s.item_id === id && s.checked === true;
			}).length;

			return foundCount === count;
		};

		$scope.saveSharing = function() {
			$scope.errorMessage = '';

			const saveData = {};

			_.each($scope.groupedSharedAllowances, function(allowanceItems) {
				saveData[allowanceItems[0].id] = {
					to_reservation_ids: _.map(_.filter(allowanceItems, function(faI) {
						return $scope.isChecked(faI.item_id, faI.id);
					}), function(aI) { return aI.item_id; }),
					allowance: {
						id: allowanceItems[0].id,
						name: allowanceItems[0].name,
						description: allowanceItems[0].description
					}
				};
			});
		
			$scope.callAPI(rvAccountTransactionsSrv.saveAllowanceShares, {
				params: {
					groupId: $scope.groupId,
					type: $scope.type,
					data: saveData
				},
				successCallBack: function (response) {
					if (response.allowance_data.errors.length) {
						$scope.errorMessage = response.allowance_data.errors.join('. ');
						return;
					}

					$scope.onQueryUpdate();
					
					if (response.allowance_data.success_messages.length) {
						$scope.successMessage = response.allowance_data.success_messages.join('. ');
					}			
				},
				failureCallBack: function (error) {
					$scope.error = error;
				}
			});
		};

		$scope.onSelect = function(item, event) {
			if (event) {
				event.preventDefault();
				event.stopImmediatePropagation();	
				$scope.shared = _.filter($scope.shared, function(s) {
					return s.id !== item.id;
				});
			}

			item.allowances = _.map(item.allowances, function(r) {
				r.checked = true;
				return r;
			});
			var mapped;

			$scope.shared.push(item);
			try {
				if (event) {
					mapped = _.map($scope.shared, function(s) {
						var obj = s.allowances;

						_.each(obj, function(v, k) {
							obj[k].id = v.id;
							obj[k].item_id = s.id;
							obj[k].firstname = s.firstname;
							obj[k].lastname = s.lastname;
							obj[k].room = s.room;
							obj[k].reservation_status = s.reservation_status.value;
						});
						return obj;
					});
				} else {
					mapped = _.map($scope.shared, function(result) {
						var obj = _.flatten(_.map(result.shared_allowances, function(sA) {
							return sA.allowances;
						}));

						_.each(obj, function(v, k) {
							obj[k].id = v.id;
							obj[k].firstname = result.firstname;
							obj[k].lastname = result.lastname;
							obj[k].item_id = result.id;
							obj[k].room = result.room;
							obj[k].reservation_status = result.reservation_status.value;
							obj[k].checked = true;
						});
						return obj;
					});					
				}

				$scope.groupedSharedAllowances = _.groupBy(_.flatten(mapped), function(item) {
					return item.id;
				});
			} catch (e) {
				console.error(e);
			}
			$scope.filterShareData();
			return false;		
		};

		$scope.isChecked = function(id, allowanceId) {
			var roomIdx = _.findIndex($scope.shared, function(r) {
				return r.id === id;
			});

			if (roomIdx === -1) {
				return false;
			}

			var alwIdx = _.findIndex($scope.shared[roomIdx].allowances, function(a) {
				return a.id === allowanceId;
			});

			return $scope.shared[roomIdx].allowances[alwIdx] && $scope.shared[roomIdx].allowances[alwIdx].checked;
		};

		$scope.onQueryUpdate = function() {
			$scope.callAPI(rvAccountTransactionsSrv.searchAllowanceShares, {
				params: {
					groupId: $scope.groupId,
					query: $scope.shareQuery.query,
					type: $scope.type
				},
				successCallBack: function (response) {
					$scope.shared = [];
					$scope.shareData = response.allowance_data.results;
					$scope.filterShareData();

					_.each(response.allowance_data.results, function(r) {
						if (r.shared_allowances.length > 0) {
							$scope.onSelect(r);
						}
					});

					var mapped = _.map(response.allowance_data.results, function(result) {
						var obj = _.flatten(_.map(result.shared_allowances, function(sA) {
							return sA.allowances;
						}));
						
						_.each(obj, function(v, k) {
							obj[k].id = v.id;
							obj[k].firstname = result.firstname;
							obj[k].lastname = result.lastname;
							obj[k].item_id = result.id;
							obj[k].room = result.room;
							obj[k].reservation_status = result.reservation_status.value;
							obj[k].checked = true;
						});
						return obj;
					});

					try {
						$scope.groupedSharedAllowances = _.groupBy(_.flatten(mapped), function(item) {
							return item.id;
						});
						$scope.successMessage = '';
					} catch (e) {
						console.error(e);
					}				

				},
				failureCallBack: function () {
					$scope.groupedAllowanceData = false;
					$scope.sharedData = [];
					$scope.shared = [];
				}
			});
		};

	$scope.debounceQueryUpdate = _.debounce($scope.onQueryUpdate, 500);
	$scope.onQueryUpdate();
		
}]);