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
		sntRover.controller('RVReservationPackageController', ['$scope', '$rootScope', '$state', '$timeout', '$filter', 'ngDialog', 'RVReservationStateService', function ($scope, $rootScope, $state, $timeout, $filter, ngDialog, RVReservationStateService) {

			// Used to toggle b/w left and right content for mobile view
			$scope.showRightContentForMobile = false;

			var shouldReloadState = false;

			$scope.setScroller('resultDetails', {
				'click': true
			});
			setTimeout(function () {
				$scope.refreshScroller('resultDetails');
			}, 2000);

			$scope.closeAddOnPopup = function () {
				// to add stjepan's popup showing animation
				$rootScope.modalOpened = false;
				$scope.$emit('CLOSE_ADDON_POPUP', {
					addonPostingMode: $scope.addonPopUpData.addonPostingMode
				});
				$timeout(function () {
					if (shouldReloadState) {
						$state.reload($state.current.name);
					}
					ngDialog.close();
					$scope.showRightContentForMobile = false;
				}, 300);
			};

			$scope.shouldHideCount = function (addon) {
				var postType = addon.post_type.value.toUpperCase();

				if ((postType === 'WEEKDAY' || postType === 'WEEKEND' || postType === 'CUSTOM') && typeof addon.post_instances === 'undefined' && $scope.showCustomPosting() && $scope.addonPopUpData.addonPostingMode === 'reservation') {
					return true;
				}
				return false;
			};

			var getApplicableAddonsCount = function getApplicableAddonsCount(amountType, numAdults, numChildren, numNights) {

				if (amountType === 'PERSON') {
					return (numAdults + numChildren) * numNights;
				} else if (amountType === 'ADULT') {
					return numAdults * numNights;
				} else if (amountType === 'CHILD') {
					return numChildren * numNights;
				} else if (amountType === 'FLAT' || amountType === 'ROOM') {
					return numNights;
				}
			};

			// Get days within a date range
			var getAddonDays = function getAddonDays(startDate, endDate, type) {
				var fromDate = moment(startDate, 'DD-MM-YYYY');
				var toDate = moment(endDate, 'DD-MM-YYYY');
				var diff = toDate.diff(fromDate, type);
				var addonDays = [];

				for (var i = 0; i < diff; i++) {
					var eachDay = moment(startDate, 'DD-MM-YYYY').add(i, type);
					var daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
					    day;

					day = daysOfWeek[eachDay.day()];
					addonDays.push(day);
				}
				return addonDays;
			};

			// Get addon count
			$scope.getAddonCount = function (addon) {
				var postingRythm = addon.post_type.frequency,
				    postType = addon.post_type.value.toUpperCase(),
				    amountType = addon.amount_type.value.toUpperCase(),
				    numAdults = $scope.addonPopUpData.number_of_adults,
				    numChildren = $scope.addonPopUpData.number_of_children,
				    numNights = $scope.addonPopUpData.duration_of_stay,
				    addonCount = 0,
				    chargeFullWeeksOnly = addon.charge_full_weeks_only,
				    postingMode = $scope.addonPopUpData.addonPostingMode,
				    fromDateObjt = getDateObject($scope.selectedPurchesedAddon.startDateObj, addon.start_date, addon.startDateObj),
				    toDateObjt = getDateObject($scope.selectedPurchesedAddon.endDateObj, addon.end_date, addon.endDateObj);

				if ($scope.showCustomPosting() && typeof addon.post_instances !== 'undefined' && addon.post_instances.length > 0) {
					numNights = _.filter(addon.post_instances, { active: true }).length;
					addonCount = getApplicableAddonsCount(amountType, numAdults, numChildren, numNights);
				} else {
					if ($scope.showCustomPosting() && typeof addon.custom_nightly_selected_post_days !== 'undefined' && (postingMode === 'reservation' || postingMode === 'staycard')) {
						// get all available days
						var reservationAddonDays = getAddonDays(fromDateObjt, toDateObjt, 'days');
						var numConfDays = 0;

						angular.forEach(reservationAddonDays, function (item) {
							// If days falls under the days selected from Admin
							if (addon.custom_nightly_selected_post_days.includes(item)) {
								numConfDays++;
							}
						});

						if (postingMode === 'reservation' && $scope.reservationData.group && $scope.reservationData.group.id && addon.selected_post_days) {
							numConfDays = 0;
							angular.forEach(reservationAddonDays, function (item) {
								if (addon.selected_post_days[item]) {
									numConfDays++;
								}
							});
						}
						if (reservationAddonDays.length === 0) {
							numConfDays = 1;
						}
						// number of addons are based on addons number of days falls under admin configured days
						numNights = numConfDays;
					}
					if (!postingRythm) {
						if (postType === 'WEEK' || postType === 'EVERY WEEK' || postType === 'WEEKLY' || postType === 'WEEKDAY' || postType === 'WEEKEND') {
							postingRythm = 7;
						} else if (postType === 'STAY' || postType === 'NIGHTLY') {
							postingRythm = 1;
						} else if (postType === 'NIGHT' || postType === 'First Night' || postType === 'LAST_NIGHT' || postType === 'CUSTOM' || postType === 'POST ON LAST NIGHT') {
							postingRythm = 0;
						}
					}
					addonCount = RVReservationStateService.getApplicableAddonsCount(amountType, postType, postingRythm, numAdults, numChildren, numNights, chargeFullWeeksOnly, postingMode);
				}
				return addonCount * addon.addon_count;
			};

			var getDateObject = function getDateObject(selectedAddonDateObj, addonDate, addonDateObj) {

				if (selectedAddonDateObj) {
					return selectedAddonDateObj;
				} else if (typeof addonDate === 'string' && addonDateObj) {
					return addonDateObj;
				} else if (typeof addonDate === 'string' && !addonDateObj) {
					return tzIndependentDate(addonDate);
				}
				return addonDate;
			};

			$scope.getAddonTotal = function (addon) {
				if ($scope.shouldHideCount(addon)) {
					return addon.amount;
				}
				return $scope.getAddonCount(addon) * addon.amount;
			};

			$scope.selectedPurchesedAddon = "";
			$scope.selectedDaysFromAdmin = [];

			$scope.selectPurchasedAddon = function (addon) {

				$scope.errorMessage = [];
				$scope.previousPostDays = {};
				$scope.daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
				if (!$rootScope.featureToggles.addons_custom_posting) {
					return;
				} else if (addon.is_rate_addon || addon.is_allowance) {
					$scope.errorMessage = ["Custom posting cannot be configured for " + (addon.is_allowance ? "allowance" : "rate") + " addons"];
					$scope.selectedPurchesedAddon = "";
				} else if (addon.post_type.value === 'STAY') {
					var addonPostingMode = $scope.addonPopUpData.addonPostingMode;

					$scope.selectedPurchesedAddon = addon;
					if (addonPostingMode === 'staycard') {
						$scope.addonPostingDate = {
							startDate: tzIndependentDate($scope.reservationData.reservation_card.arrival_date),
							endDate: tzIndependentDate($scope.reservationData.reservation_card.departure_date)
						};
					} else if (addonPostingMode === 'reservation') {
						$scope.addonPostingDate = {
							startDate: tzIndependentDate($scope.reservationData.arrivalDate),
							endDate: tzIndependentDate($scope.reservationData.departureDate)
						};
					} else if (addonPostingMode === 'allotments' || addonPostingMode === 'create_allotment') {
						$scope.addonPostingDate = {
							startDate: tzIndependentDate($scope.allotmentConfigData.summary.block_from),
							endDate: tzIndependentDate($scope.allotmentConfigData.summary.block_to)
						};
					} else {
						$scope.addonPostingDate = {
							startDate: tzIndependentDate($scope.groupConfigData.summary.block_from),
							endDate: tzIndependentDate($scope.groupConfigData.summary.block_to)
						};
					}
					$scope.selectedPurchesedAddon.start_date = $scope.addonPostingDate.startDate;
					$scope.selectedPurchesedAddon.end_date = $scope.addonPostingDate.endDate;
					// admin configured nightly custom days from API
					$scope.selectedDaysFromAdmin = $scope.selectedPurchesedAddon.custom_nightly_selected_post_days;
					// object to keep only the admin configured days enabled from the addon posting days
					if (typeof $scope.selectedPurchesedAddon.adminConfiguredDays === 'undefined') {
						$scope.selectedPurchesedAddon.adminConfiguredDays = {};
						$scope.toggleAdminConfigDaysSelectionForAddon(true);
					}

					if (typeof $scope.selectedPurchesedAddon.selected_post_days === 'undefined') {
						$scope.selectedPurchesedAddon.selected_post_days = {};
						$scope.togglePostDaysSelectionForAddon(true);
					}
					$scope.selectedPurchesedAddon.startDateObj = tzIndependentDate($scope.selectedPurchesedAddon.start_date);
					$scope.selectedPurchesedAddon.endDateObj = tzIndependentDate($scope.selectedPurchesedAddon.end_date);

					updateDaysOfWeek();

					var startDate = $filter('date')($scope.selectedPurchesedAddon.start_date, $rootScope.dateFormat),
					    endDate = $filter('date')($scope.selectedPurchesedAddon.end_date, $rootScope.dateFormat);

					$scope.selectedPurchesedAddon.start_date = startDate;
					$scope.selectedPurchesedAddon.end_date = endDate;
					$scope.selectedPurchesedAddon.nameCharLimit = $scope.selectedPurchesedAddon.name.length > 23 ? 20 : 23;
					angular.forEach($scope.selectedPurchesedAddon.post_instances, function (item) {
						var postDate = moment(item.post_date),
						    daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
						    day;

						day = daysOfWeek[postDate.day()];
						// If post instances days falls under the days selected from Admin
						if ($scope.selectedDaysFromAdmin.includes(day)) {
							$scope.selectedPurchesedAddon.selected_post_days[day] = item.active;
							$scope.selectedPurchesedAddon.adminConfiguredDays[day] = true;
						} else {
							// keep the other days inactive/disabled
							$scope.selectedPurchesedAddon.selected_post_days[day] = false;
							$scope.selectedPurchesedAddon.adminConfiguredDays[day] = false;
						}
					});

					angular.copy($scope.selectedPurchesedAddon.selected_post_days, $scope.previousPostDays);

					$timeout(function () {
						$scope.showRightContentForMobile = true;
					}, 10);
				} else {
					// $scope.errorMessage = ["Custom posting can be configured only for nightly addons"];
					$scope.selectedPurchesedAddon = addon;
					$timeout(function () {
						$scope.showRightContentForMobile = true;
					}, 10);
				}
			};

			var ordinal_suffix_of = function ordinal_suffix_of(i) {
				var j = i % 10,
				    k = i % 100;

				if (j === 1 && k !== 11) {
					return i + "st";
				}
				if (j === 2 && k !== 12) {
					return i + "nd";
				}
				if (j === 3 && k !== 13) {
					return i + "rd";
				}
				return i + "th";
			};

			$scope.getCustomPostingInfo = function () {
				var posting_info = "";

				if (typeof $scope.selectedPurchesedAddon.frequency_type === 'undefined' || typeof $scope.selectedPurchesedAddon.frequency === 'undefined') {
					posting_info = "Posts daily";
				} else if ($scope.selectedPurchesedAddon.frequency_type === "days") {
					if ($scope.selectedPurchesedAddon.frequency === 1) {
						posting_info = "Posts daily";
					} else {
						posting_info = "Posts on every " + $scope.selectedPurchesedAddon.frequency + " days.";
					}
				} else if ($scope.selectedPurchesedAddon.frequency_type === "weeks") {
					if ($scope.selectedPurchesedAddon.frequency === 1) {
						posting_info = "Posts weekly, on " + $scope.selectedPurchesedAddon.post_day_of_the_week;
					} else {
						posting_info = "Posts every " + $scope.selectedPurchesedAddon.frequency + " weeks, on " + $scope.selectedPurchesedAddon.post_day_of_the_week;
					}
				} else if ($scope.selectedPurchesedAddon.frequency_type === "months") {
					if ($scope.selectedPurchesedAddon.frequency === 1) {
						posting_info = "Posts every month, on " + ordinal_suffix_of($scope.selectedPurchesedAddon.post_day_of_the_month);
					} else {
						posting_info = "Posts every " + $scope.selectedPurchesedAddon.frequency + " months, on " + ordinal_suffix_of($scope.selectedPurchesedAddon.post_day_of_the_month);
					}
				} else {
					posting_info = "Posts daily";
				}
				return posting_info;
			};

			$scope.showCustomPosting = function () {
				return $rootScope.featureToggles.addons_custom_posting;
			};

			$scope.shouldShowSelectAllDaysOfWeek = function () {
				var shouldShowSelectAllDaysOfWeek = false;

				if (!!$scope.selectedPurchesedAddon) {
					angular.forEach($scope.daysOfWeek, function (item) {
						// If days falls under the days selected from Admin
						if ($scope.selectedDaysFromAdmin.includes(item) && $scope.selectedPurchesedAddon.selected_post_days) {
							if (!$scope.selectedPurchesedAddon.selected_post_days[item]) {
								shouldShowSelectAllDaysOfWeek = true;
							}
						}
					});
				}
				return shouldShowSelectAllDaysOfWeek;
			};

			$scope.shouldShowSelectNoDaysOfWeek = function () {
				var shouldShowSelectNoDaysOfWeek = true;

				if (!!$scope.selectedPurchesedAddon) {
					angular.forEach($scope.daysOfWeek, function (item) {
						// If days falls under the days selected from Admin
						if ($scope.selectedDaysFromAdmin.includes(item) && $scope.selectedPurchesedAddon.selected_post_days) {
							if (!$scope.selectedPurchesedAddon.selected_post_days[item]) {
								shouldShowSelectNoDaysOfWeek = false;
							}
						}
					});
				}
				return shouldShowSelectNoDaysOfWeek;
			};

			$scope.togglePostDaysSelectionForAddon = function (select) {
				angular.forEach($scope.daysOfWeek, function (item) {
					// If days falls under the days selected from Admin
					if ($scope.selectedDaysFromAdmin.includes(item)) {
						$scope.selectedPurchesedAddon.selected_post_days[item] = select;
					}
				});
			};

			// If we do not have addon posting days initially
			$scope.toggleAdminConfigDaysSelectionForAddon = function (select) {
				angular.forEach($scope.daysOfWeek, function (item) {
					// If days falls under the days selected from Admin
					if ($scope.selectedDaysFromAdmin.includes(item)) {
						$scope.selectedPurchesedAddon.adminConfiguredDays[item] = select;
					}
				});
			};

			var datePicker;

			$scope.clickedOnDatePicker = function (datePickerFor) {
				$scope.datePickerFor = datePickerFor;
				datePicker = ngDialog.open({
					template: '/assets/partials/common/rvDatePicker.html',
					controller: 'RVAddonDatePickerController',
					className: '',
					scope: $scope,
					closeByDocument: true
				});
			};

			$scope.dateSelected = function (dateText) {
				if ($scope.datePickerFor === 'start_date') {
					$scope.selectedPurchesedAddon.start_date = $filter('date')(dateText, $rootScope.dateFormat);
				} else {
					$scope.selectedPurchesedAddon.end_date = $filter('date')(dateText, $rootScope.dateFormat);
				}
				updateDaysOfWeek();
			};

			$scope.closePopup = function () {
				ngDialog.close();
				$scope.showRightContentForMobile = false;
			};

			// For Mobile view - to go back
			$scope.goBackToAddonsList = function () {
				$scope.showRightContentForMobile = false;
			};

			$scope.closeCalendar = function () {
				datePicker.close();
			};

			$scope.goToAddons = function () {
				$scope.closePopup();
				$rootScope.$broadcast('NAVIGATE_TO_ADDONS', {
					addonPostingMode: $scope.addonPopUpData.addonPostingMode
				});
			};

			$scope.removeChosenAddons = function ($event, index, addon) {
				$event.stopPropagation();
				$scope.selectedPurchesedAddon = "";

				if (addon.is_allowance && addon.is_consumed_allowance) {
					$scope.errorMessage = ["Cannot remove consumed allowance from staycard"];
				} else {
					if ($scope.packageData.existing_packages.length === 1) {
						$scope.closePopup();
					}
					$rootScope.$broadcast('REMOVE_ADDON', {
						addonPostingMode: $scope.addonPopUpData.addonPostingMode,
						index: index,
						addon: addon
					});
				}
			};

			$scope.proceedBooking = function () {
				var adminAddonDays = $scope.selectedPurchesedAddon.custom_nightly_selected_post_days;
				var numberOfAdminDays = adminAddonDays.length;
				var numDeselectedDays = 0,
				    numIncludedDays = 0;
				var reservationAddonDays = getAddonDays($scope.selectedPurchesedAddon.startDateObj, $scope.selectedPurchesedAddon.endDateObj, 'days');

				for (var i = 0; i < numberOfAdminDays; i++) {
					var eachDay = adminAddonDays[i];

					// If days falls under the days selected from Admin
					if (reservationAddonDays.includes(eachDay)) {
						numIncludedDays++;
						if ($scope.selectedPurchesedAddon.selected_post_days[eachDay] === false) {
							numDeselectedDays++;
						}
					}
				}
				// check if all included admin config days are deselected
				if (numDeselectedDays === numIncludedDays) {
					$scope.errorMessage = ["Please remove the addon if deselecting all the available days"];
				} else {
					setPostingData();
					var toDate = moment($scope.selectedPurchesedAddon.endDateObj).startOf('day'),
					    fromDate = moment($scope.selectedPurchesedAddon.startDateObj).startOf('day'),
					    datesCount = (toDate - fromDate) / 86400000,
					    dateIterator = moment($scope.selectedPurchesedAddon.startDateObj).startOf('day'),
					    allDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
					    activeStayDays = [],
					    nonActiveStayDays = [];

					// Extract post days which are present in selected date range
					for (var countIndex = 0; countIndex < datesCount; countIndex++) {
						activeStayDays.push(allDays[dateIterator.day()]);
						dateIterator.add(1, 'days');
					}

					activeStayDays = _.uniq(activeStayDays);
					// Post days which are not present in selected date range
					nonActiveStayDays = _.filter(allDays, function (day) {
						return !_.contains(activeStayDays, day);
					});

					// Dectivate post instances which are not present in the selected date range
					_.each($scope.selectedPurchesedAddon.post_instances, function (postInstance) {
						var isInstanceActive = false;

						dateIterator = moment($scope.selectedPurchesedAddon.startDate).startOf('day');

						for (var countIndex = 0; countIndex < datesCount; countIndex++) {
							if (moment(postInstance.post_date).startOf('day').isSame(dateIterator)) {
								isInstanceActive = true;
							}
							dateIterator.add(1, 'days');
						}

						if (!isInstanceActive) {
							postInstance.active = false;
						}
					});

					_.each(nonActiveStayDays, function (day) {
						$scope.selectedPurchesedAddon.selected_post_days[day] = false;
					});

					// Remove post days which are not present in the selected date range
					$scope.$emit('PROCEED_BOOKING', {
						addonPostingMode: $scope.addonPopUpData.addonPostingMode,
						selectedPurchesedAddon: $scope.selectedPurchesedAddon
					});
					$scope.closePopup();
				}
			};

			$scope.setDeafultDisplay = function () {
				angular.copy($scope.previousPostDays, $scope.selectedPurchesedAddon.selected_post_days);
				$scope.selectedPurchesedAddon = "";
			};

			$scope.shouldShowAddMoreButton = function () {
				var addonPostingMode = $scope.addonPopUpData.addonPostingMode;

				return addonPostingMode === 'staycard' || addonPostingMode === 'group' || addonPostingMode === 'allotments';
			};

			var setPostingData = function setPostingData() {
				angular.forEach($scope.packageData.existing_packages, function (existing_package) {
					if (existing_package.startDateObj) {
						existing_package.start_date = $filter('date')(tzIndependentDate(existing_package.startDateObj), $rootScope.dateFormatForAPI);
					} else {
						existing_package.start_date = $filter('date')(tzIndependentDate(existing_package.start_date), $rootScope.dateFormatForAPI);
					}
					if (existing_package.endDateObj) {
						existing_package.end_date = $filter('date')(tzIndependentDate(existing_package.endDateObj), $rootScope.dateFormatForAPI);
					} else {
						existing_package.end_date = $filter('date')(tzIndependentDate(existing_package.end_date), $rootScope.dateFormatForAPI);
					}

					angular.forEach(existing_package.post_instances, function (item) {
						var postDate = new Date(item.post_date),
						    day = $scope.daysOfWeek[postDate.getDay()];

						item.active = $scope.selectedPurchesedAddon.selected_post_days[day];
					});
				});
			};

			var updateDaysOfWeek = function updateDaysOfWeek() {

				$scope.daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
				var start_date = $scope.selectedPurchesedAddon.startDateObj,
				    end_date = $scope.selectedPurchesedAddon.endDateObj,
				    noOfDays,
				    startDayIndex;

				noOfDays = (moment(end_date).startOf('day') - moment(start_date).startOf('day')) / 86400000;
				noOfDays--;
				if (noOfDays <= 6) {
					$scope.daysOfWeekCopy = [];
					startDayIndex = start_date.getDay();
					if ($scope.selectedPurchesedAddon.is_allowance && $scope.selectedPurchesedAddon.is_consume_next_day) {
						startDayIndex++;
					}
					for (var index = 0; index <= noOfDays; index++) {

						if (startDayIndex < 7) {
							$scope.daysOfWeekCopy.push($scope.daysOfWeek[startDayIndex]);
							startDayIndex++;
						} else {
							$scope.daysOfWeekCopy.push($scope.daysOfWeek[startDayIndex - 7]);
							startDayIndex++;
						}
					}
					angular.copy($scope.daysOfWeekCopy, $scope.daysOfWeek);
				}
			};
		}]);
	}, {}] }, {}, [1]);