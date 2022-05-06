"use strict";

(function () {
	function r(e, n, t) {
		function o(i, f) {
			if (!n[i]) {
				if (!e[i]) {
					var c = "function" == typeof require && require;if (!f && c) return c(i, !0);if (u) return u(i, !0);var a = new Error("Cannot find module '" + i + "'");throw a.code = "MODULE_NOT_FOUND", a;
				}var p = n[i] = { exports: {} };e[i][0].call(p.exports, function (r) {
					var n = e[i][1][r];return o(n || r);
				}, p, p.exports, r, e, n, t);
			}return n[i].exports;
		}for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) {
			o(t[i]);
		}return o;
	}return r;
})()({ 1: [function (require, module, exports) {
		angular.module('sntRover').controller('companyCardDetailsContactCtrl', ['$scope', '$q', 'jsMappings', 'RVCompanyCardSrv', 'rvPermissionSrv', '$state', '$stateParams', 'ngDialog', '$rootScope', function ($scope, $q, jsMappings, RVCompanyCardSrv, rvPermissionSrv, $state, $stateParams, ngDialog, $rootScope) {
			BaseCtrl.call(this, $scope);

			$scope.setScroller('companyCardDetailsContactCtrl');

			$scope.$on("contactTabActive", function () {
				refreshScroller();
			});

			$scope.isEmpty = function (obj) {
				return _.isEmpty(obj);
			};
			/*
    * Toggle commission
    * Show popup when disabled
    */
			$scope.toggleCommission = function () {
				$scope.contactInformation.commission_details.is_on = !$scope.contactInformation.commission_details.is_on;
			};

			// trigger the billing information popup
			$scope.openBillingInformation = function (accountType) {

				if ($scope.contactInformation.id === null || $scope.contactInformation.id === undefined) {
					$scope.$emit("OUTSIDECLICKED");
					return false;
				}
				if (accountType === 'TRAVELAGENT') {
					$scope.attachedEntities = {};
					$scope.attachedEntities.travel_agent = {};
					$scope.attachedEntities.travel_agent.id = $scope.contactInformation.id;
					$scope.attachedEntities.travel_agent.name = $scope.contactInformation.account_details.account_name;
					$scope.attachedEntities.travel_agent.logo = $scope.contactInformation.account_details.company_logo;
					$scope.billingEntity = "TRAVEL_AGENT_DEFAULT_BILLING";
				} else if (accountType === 'COMPANY') {
					$scope.attachedEntities = {};
					$scope.attachedEntities.company_card = {};
					$scope.attachedEntities.company_card.id = $scope.contactInformation.id;
					$scope.attachedEntities.company_card.name = $scope.contactInformation.account_details.account_name;
					$scope.attachedEntities.company_card.logo = $scope.contactInformation.account_details.company_logo;
					$scope.billingEntity = "COMPANY_CARD_DEFAULT_BILLING";
				} else {
					return false;
				}

				$scope.$emit('showLoader');
				jsMappings.fetchAssets(['addBillingInfo', 'directives']).then(function () {
					$scope.$emit('hideLoader');
					if ($rootScope.UPDATED_BI_ENABLED_ON['CARDS']) {
						console.log("##Billing-info updated version");
						ngDialog.open({
							template: '/assets/partials/billingInformation/cards/rvBillingInfoCardsMain.html',
							controller: 'rvBillingInfoCardsMainCtrl',
							className: '',
							scope: $scope
						});
					} else {
						console.log("##Billing-info old version");
						ngDialog.open({
							template: '/assets/partials/bill/rvBillingInformationPopup.html',
							controller: 'rvBillingInformationPopupCtrl',
							className: '',
							scope: $scope
						});
					}
				});
			};

			$scope.$on("setCardContactErrorMessage", function ($event, errorMessage) {
				$scope.errorMessage = errorMessage;
			});

			$scope.$on("clearCardContactErrorMessage", function () {
				$scope.errorMessage = "";
			});

			var refreshScroller = function refreshScroller() {
				$scope.refreshScroller('companyCardDetailsContactCtrl');
			};

			$scope.$on("BILLINGINFODELETED", function () {
				$scope.contactInformation.account_details.routes_count = 0;
			});

			$scope.$on("BILLINGINFOADDED", function () {
				$scope.contactInformation.account_details.routes_count = 1;
			});

			// trigger the edit properties commissions popup
			$scope.openPropertiesPopup = function () {
				ngDialog.open({
					template: '/assets/partials/companyCard/rvTACardPropertiesCommissionsPopup.html',
					controller: 'rvTACardPropertiesCommissionsPopupCtrl',
					className: '',
					scope: $scope
				});
			};

			$scope.toggleGlobalCommission = function () {
				$scope.displayShowPropertiesButton = !$scope.contactInformation.commission_details.is_global_commission;
			};

			/*
    * "Show Properties" Button should be displayed only when: 
    * the user is chain admin user and 
    * the account type is 'Travel agent card' and 
    * TA card is global and 
    * commission is not global
    */
			$scope.displayShowPropertiesButtonFn = function () {
				return $scope.displayShowPropertiesButton && $scope.account_type === 'TRAVELAGENT' && !$scope.isEmpty($scope.contactInformation.commission_details) && $scope.contactInformation.is_global_enabled && $rootScope.isAnMPHotel && $rootScope.hotelDetails.userHotelsData.hotel_list.length > 0 && rvPermissionSrv.getPermissionValue('MULTI_PROPERTY_SWITCH') && rvPermissionSrv.getPermissionValue('GLOBAL_CARD_UPDATE') && !$scope.isUpdateEnabledForTravelAgent();
			};

			$scope.showGlobalCommissionCheckbox = function () {
				return $scope.contactInformation.is_global_enabled && $rootScope.hotelDetails.userHotelsData.hotel_list.length > 0 && rvPermissionSrv.getPermissionValue('MULTI_PROPERTY_SWITCH');
			};
		}]);
	}, {}] }, {}, [1]);