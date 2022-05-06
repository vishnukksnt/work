sntRover.controller('rvAllotmentConfigurationAddonsCtrl', [
	'$scope',
	'$rootScope',
	'RVReservationAddonsSrv',
	'rvAllotmentConfigurationSrv',
	'ngDialog',
	function($scope, $rootScope, RVReservationAddonsSrv, rvAllotmentConfigurationSrv, ngDialog) {
		BaseCtrl.call(this, $scope);

		$scope.setScroller("enhanceAllotmentStays");

		$rootScope.setPrevState = {
			title: "ALLOTMENT DETAILS",
			name: 'rover.allotments.config',
			callback: 'backToAllotmentDetails',
			scope: $scope
		};

		$scope.setHeadingTitle('Add-ons & Packages');

		var refreshAddonsScroller = function() {
			$scope.refreshScroller("enhanceAllotmentStays");
		};

		// by default load Best Sellers addon
		// Best Sellers in not a real charge code [just hard coding -1 as charge allotment id to fetch best sell addons]
		// same will be overrided if with valid charge code id
		$scope.activeAddonCategoryId = -1;
		$scope.addons = [];

		$scope.selectAddonCategory = function(category, event) {
			event.stopPropagation();
			if (category !== '') {
				$scope.activeAddonCategoryId = category.id;
				$scope.fetchAddons(category.id);
			} else {
				$scope.activeAddonCategoryId = -1;
				$scope.fetchAddons();
			}
		};

		/**
		 * function to go back to reservation details
		 */
		$scope.backToAllotmentDetails = function() {
			$scope.closeAllotmentAddonsScreen();
		};

		/**
		 *
		 */
		var successCallBackFetchAddons = function(data) {
			var inclusiveAddons = _.where(data.rate_addons, {
				is_inclusive: true
			});

			$scope.allotmentConfigData.addons.inclusiveAddons = inclusiveAddons;
			$scope.addons = [];
			$scope.$emit("hideLoader");
			// remove null values
			$scope.addons = [];
			$scope.$emit("hideLoader");
			angular.forEach(data.results, function(item) {
				if (item !== null) {
					var addonItem = {};

					addonItem.id = item.id;
					addonItem.isBestSeller = item.bestseller;
					addonItem.category = item.charge_group.name;
					addonItem.title = item.name;
					addonItem.description = item.description;
					addonItem.price = item.amount;
					addonItem.taxes = item.taxes;
					addonItem.stay = "";
					if (item.amount_type !== "") {
						addonItem.stay = item.amount_type.description;
					}
					if (item.post_type !== "") {
						if (addonItem.stay !== "") {
							addonItem.stay += " / " + item.post_type.description;
						} else {
							addonItem.stay = item.post_type.description;
						}
					}
					addonItem.amountType = item.amount_type;
					addonItem.postType = item.post_type;
					addonItem.amountTypeDesc = item.amount_type.description;
					addonItem.postTypeDesc = item.post_type.description;
					addonItem.custom_nightly_selected_post_days = item.custom_nightly_selected_post_days;
					$scope.addons.push(addonItem);
				}
			});

			refreshAddonsScroller();
		};

		$scope.fetchAddons = function(paramChargeGrpId) {
			var chargeAllotmentId = paramChargeGrpId === undefined ? '' : paramChargeGrpId;
			var is_bestseller = paramChargeGrpId === undefined ? true : false;

			$scope.callAPI(RVReservationAddonsSrv.fetchAddons, {
				successCallBack: successCallBackFetchAddons,
				params: {
					'charge_group_id': chargeAllotmentId,
					'is_bestseller': is_bestseller,
					'from_date': $scope.allotmentConfigData.summary.block_from,
					'to_date': $scope.allotmentConfigData.summary.block_to,
					'is_active': true,
					'is_not_rate_only': true,
					'no_pagination': true
				}
			});
		};

		if ($scope.isInAddonSelectionMode()) {
			$scope.fetchAddons();
		}

		/**
		 * Method used open the addons popup
		 * @return undefined
		 */
		$scope.openAddonsPopup = function() {

            $scope.addonPopUpData = {
				cancelLabel: "Cancel",
                saveLabel: "Save",
                number_of_adults: 1,
                number_of_children: 1,
                duration_of_stay: 1,
                addonPostingMode: 'create_allotment'
            };

            $scope.packageData = {
                duration_of_stay: $scope.duration_of_stay
            };

            $scope.packageData.existing_packages = $scope.allotmentConfigData.selectedAddons;
            _.each($scope.packageData.existing_packages, function(item) {
                item.totalAmount = item.amount * item.addon_count;
            });

			ngDialog.open({
				template: '/assets/partials/packages/showPackages.html',
				controller: 'RVReservationPackageController',
				className: '',
				scope: $scope,
				closeByDocument: false,
				closeByEscape: false
			});
		};

		var onEnhanceSuccess = function(data) {
			$scope.allotmentConfigData.selectedAddons = data;
			$scope.computeAddonsCount();
			$scope.openAddonsPopup();
		};

		var onEnhanceFailure = function(errorMessage) {
			$scope.errorMessage = errorMessage;
		};

		$scope.selectAddon = function(addon, addonCount) {
			var params = {
				"addon_id": addon.id,
				"addon_count": parseInt(addonCount),
				"id": $scope.allotmentConfigData.summary.allotment_id
			};
			var options = {
				successCallBack: onEnhanceSuccess,
				failureCallBack: onEnhanceFailure,
				params: params
			};

			$scope.callAPI(rvAllotmentConfigurationSrv.addAllotmentEnhancement, options);
		};

		var onRemoveAddonSuccess = function(data) {
			$scope.allotmentConfigData.selectedAddons = data;
			$scope.packageData.existing_packages = $scope.allotmentConfigData.selectedAddons;
			$scope.computeAddonsCount();
		};

		var onRemoveAddonFailure = function(errorMessage) {
			$scope.errorMessage = errorMessage;
		};

		$scope.removeAddon = function(addon) {
			var params  = {
				"addon_id": addon.id,
				"id": $scope.allotmentConfigData.summary.allotment_id
			};
			var options = {
				successCallBack: onRemoveAddonSuccess,
				failureCallBack: onRemoveAddonFailure,
				params: params
			};

			$scope.callAPI(rvAllotmentConfigurationSrv.removeAllotmentEnhancement, options);
		};

		var updateAddonPosting = function() {
			var params = {
				"id": $scope.allotmentConfigData.summary.allotment_id,
				'addon_id': $scope.selectedPurchesedAddon.id,
				'post_instances': $scope.selectedPurchesedAddon.post_instances,
				'start_date': $scope.selectedPurchesedAddon.start_date,
				'end_date': $scope.selectedPurchesedAddon.end_date,
				'selected_post_days': $scope.selectedPurchesedAddon.selected_post_days
			};

			var options = {
				successCallBack: function() {
					$scope.$emit('hideLoader');
					$scope.reloadPage();
				},
				params: params
			};

			$scope.callAPI(rvAllotmentConfigurationSrv.updateAddonPosting, options);
		};

		var proceedBookingListner = $scope.$on('PROCEED_BOOKING', function(event, data) {
			if (data.addonPostingMode === 'create_allotment') {
				$scope.selectedPurchesedAddon = data.selectedPurchesedAddon;
				updateAddonPosting();
			}
		});

		var removeSelectedAddonsListner = $rootScope.$on('REMOVE_ADDON', function(event, data) {
			if (data.addonPostingMode === 'create_allotment') {
				$scope.removeAddon($scope.packageData.existing_packages[data.index]);
			}
		});

		$scope.addListener('CLOSE_ADDON_POPUP', function (event, data) {
			if (data.addonPostingMode === 'create_allotment') {
				$scope.reloadPage();
			}
		});

		$scope.$on( '$destroy', proceedBookingListner);
		$scope.$on( '$destroy', removeSelectedAddonsListner);
	}
]);