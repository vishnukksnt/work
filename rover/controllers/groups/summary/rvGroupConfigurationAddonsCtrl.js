angular.module('sntRover').controller('rvGroupConfigurationAddonsCtrl', [
	'$scope',
	'$rootScope',
	'RVReservationAddonsSrv',
	'rvGroupConfigurationSrv',
	'ngDialog',
	function($scope, $rootScope, RVReservationAddonsSrv, rvGroupConfigurationSrv, ngDialog) {
		BaseCtrl.call(this, $scope);

		$scope.setScroller("enhanceGroupStays");

		$rootScope.setPrevState = {
			title: "GROUP DETAILS",
			name: 'rover.groups.config',
			callback: 'backToGroupDetails',
			scope: $scope
		};

		$scope.setHeadingTitle('Add-ons & Packages');

		var refreshAddonsScroller = function() {
			$scope.refreshScroller("enhanceGroupStays");
		};

		// by default load Best Sellers addon
		// Best Sellers in not a real charge code [just hard coding -1 as charge group id to fetch best sell addons]
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
		$scope.backToGroupDetails = function() {
			$scope.closeGroupAddonsScreen();
		};

		$scope.fetchAddons = function(paramChargeGrpId) {
			var successCallBackFetchAddons = function(data) {
				var inclusiveAddons = [];

				angular.forEach(data.rate_addons, function(item) {
					if (item.is_inclusive) {
						inclusiveAddons.push(item);
					}
				});
				$scope.groupConfigData.addons.inclusiveAddons = inclusiveAddons;
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


			var chargeGroupId = paramChargeGrpId === undefined ? '' : paramChargeGrpId;
			var is_bestseller = paramChargeGrpId === undefined ? true : false;

			$scope.callAPI(RVReservationAddonsSrv.fetchAddons, {
				successCallBack: successCallBackFetchAddons,
				params: {
					'charge_group_id': chargeGroupId,
					'is_bestseller': is_bestseller,
					'from_date': $scope.groupConfigData.summary.block_from,
					'to_date': $scope.groupConfigData.summary.block_to,
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
				addonPostingMode: 'create_group',
				cancelLabel: "Cancel",
                saveLabel: "Save",
                number_of_adults: 1,
				number_of_children: 1,
				duration_of_stay: 1
            };
            $scope.packageData = {
                existing_packages: $scope.groupConfigData.selectedAddons
            };
            _.each($scope.packageData.existing_packages, function(item) {
                item.totalAmount = item.amount * item.addon_count;
            });
            ngDialog.open({ 
                template: '/assets/partials/packages/showPackages.html',
				controller: 'RVReservationPackageController',
				scope: $scope,
                closeByDocument: false,
                closeByEscape: false
			});
		};

		$scope.selectAddon = function(addon, addonCount) {
			var onEnhanceSuccess = function(data) {
					$scope.groupConfigData.selectedAddons = data;
					$scope.computeAddonsCount();
					$scope.openAddonsPopup();
				},
				onEnhanceFailure = function(errorMessage) {
					$scope.errorMessage = errorMessage;
				};

			$scope.callAPI(rvGroupConfigurationSrv.addGroupEnhancement, {
				successCallBack: onEnhanceSuccess,
				failureCallBack: onEnhanceFailure,
				params: {
					"addon_id": addon.id,
					"addon_count": parseInt(addonCount),
					"id": $scope.groupConfigData.summary.group_id
				}
			});
		};

		$scope.removeAddon = function(addon) {
			var onRemoveAddonSuccess = function(data) {
					$scope.groupConfigData.selectedAddons = data;
                    $scope.packageData.existing_packages = data;
                    _.each($scope.packageData.existing_packages, function(item) {
                        item.totalAmount = item.amount * item.addon_count;
                    });
					$scope.computeAddonsCount();
				},
				onRemoveAddonFailure = function(errorMessage) {
					$scope.errorMessage = errorMessage;
				};

			$scope.callAPI(rvGroupConfigurationSrv.removeGroupEnhancement, {
				successCallBack: onRemoveAddonSuccess,
				failureCallBack: onRemoveAddonFailure,
				params: {
					"addon_id": addon.id,
					"id": $scope.groupConfigData.summary.group_id
				}
			});
		};

		$scope.saveAddonsPosting = function() {

            var addonPostingSaveSuccess = function() {
                $scope.$emit('hideLoader');
                $scope.reloadPage();
            };
    
            var dataToApi = {
                'group_id': $scope.groupConfigData.summary.group_id,
                'addon_id': $scope.selectedPurchesedAddon.id,
                'post_instances': $scope.selectedPurchesedAddon.post_instances,
                'start_date': $scope.selectedPurchesedAddon.start_date,
                'end_date': $scope.selectedPurchesedAddon.end_date,
                'selected_post_days': $scope.selectedPurchesedAddon.selected_post_days
            };
    
            $scope.invokeApi(rvGroupConfigurationSrv.updateAddonPosting, dataToApi, addonPostingSaveSuccess);
        };
	
		var removeSelectedAddonsListner = $rootScope.$on('REMOVE_ADDON', function(event, data) {
			if (data.addonPostingMode === 'create_group') {
				$scope.removeAddon(data.addon);
			}
		});
	
		var proceedBookingListner = $scope.$on('PROCEED_BOOKING', function(event, data) {
			if (data.addonPostingMode === 'create_group') {
				$scope.selectedPurchesedAddon = data.selectedPurchesedAddon;
				$scope.saveAddonsPosting();
			}
		});

		$scope.addListener('CLOSE_ADDON_POPUP', function (event, data) {
			if (data.addonPostingMode === 'create_group') {
				$scope.reloadPage();
			}
		});

		$scope.$on( '$destroy', proceedBookingListner);
		$scope.$on( '$destroy', removeSelectedAddonsListner);

	}
]);