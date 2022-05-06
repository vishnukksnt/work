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
        sntRover.controller('RVReservationAddonsCtrl', ['$scope', '$rootScope', 'addonData', '$state', 'ngDialog', 'RVReservationAddonsSrv', '$filter', '$timeout', 'RVReservationSummarySrv', '$stateParams', '$vault', 'RVReservationPackageSrv', 'RVReservationStateService', 'rvGroupConfigurationSrv', 'rvPermissionSrv', function ($scope, $rootScope, addonData, $state, ngDialog, RVReservationAddonsSrv, $filter, $timeout, RVReservationSummarySrv, $stateParams, $vault, RVReservationPackageSrv, RVReservationStateService, rvGroupConfigurationSrv, rvPermissionSrv) {
            var roomAndRatesState = 'rover.reservation.staycard.mainCard.room-rates';

            var setBackButton = function setBackButton() {
                if ($stateParams.from_screen === "staycard") {
                    $scope.fromPage = "staycard";
                    $rootScope.setPrevState = {
                        title: $filter('translate')('STAY_CARD'),
                        callback: 'goBackToStayCard',
                        scope: $scope
                    };

                    $scope.goBackToStayCard = function () {
                        $scope.addonsData.existingAddons = [];
                        var reservationId = $scope.reservationData.reservationId,
                            confirmationNumber = $scope.reservationData.confirmNum;

                        $state.go("rover.reservation.staycard.reservationcard.reservationdetails", {
                            "id": reservationId,
                            "confirmationId": confirmationNumber,
                            "isrefresh": true
                        });
                    };
                } else if ($stateParams.reservation === "HOURLY") {
                    $rootScope.setPrevState = {
                        title: $filter('translate')('DIARY'),
                        name: 'rover.diary',
                        param: {}
                    };
                } else {
                    $scope.reservationData.number_of_adults = parseInt($scope.reservationData.rooms[0].numAdults, 10);
                    $scope.reservationData.number_of_children = parseInt($scope.reservationData.rooms[0].numChildren, 10);
                    // set the previous state
                    $rootScope.setPrevState = {
                        title: $filter('translate')('ROOM_RATES'),
                        name: roomAndRatesState,
                        param: {
                            from_date: $scope.reservationData.arrivalDate,
                            to_date: $scope.reservationData.departureDate,
                            view: "ROOM_RATE",
                            company_id: $scope.reservationData.company.id,
                            travel_agent_id: $scope.reservationData.travelAgent.id,
                            fromState: 'rover.reservation.staycard.mainCard.addons',
                            group_id: $scope.reservationData.group.id,
                            room_type_id: $scope.reservationData.tabs[$scope.viewState.currentTab].roomTypeId,
                            adults: $scope.reservationData.tabs[$scope.viewState.currentTab].numAdults,
                            children: $scope.reservationData.tabs[$scope.viewState.currentTab].numChildren,
                            promotion_id: $scope.reservationData.promotionId,
                            allotment_id: $scope.reservationData.allotment.id

                        }
                    };
                }
            },
                initFromHourly = function initFromHourly() {
                $scope.reservationData.isHourly = true;
                var temporaryReservationDataFromDiaryScreen = $vault.get('temporaryReservationDataFromDiaryScreen');

                temporaryReservationDataFromDiaryScreen = JSON.parse(temporaryReservationDataFromDiaryScreen);
                if (temporaryReservationDataFromDiaryScreen) {
                    var getRoomsSuccess = function getRoomsSuccess(data) {
                        var roomsArray = {};

                        angular.forEach(data.rooms, function (value) {
                            var roomKey = value.id;

                            roomsArray[roomKey] = value;
                        });
                        $scope.populateDatafromDiary(roomsArray, temporaryReservationDataFromDiaryScreen);
                        $scope.roomDetails = getCurrentRoomDetails();
                        fetchAddons('', true);
                    };

                    $scope.invokeApi(RVReservationSummarySrv.fetchRooms, {}, getRoomsSuccess);
                }

                $scope.duration_of_stay = 1;

                $scope.is_rate_addons_fetch = false;
                $scope.addonsData.existingAddons = [];
            },
                updateAddonPostOptions = function updateAddonPostOptions() {
                $($scope.reservationData.rooms).each(function (index, room) {
                    $(room.addons).each(function (i, addon) {
                        var updatedAddon = _.find($scope.packageData.existing_packages, {
                            id: addon.id
                        });

                        if (updatedAddon) {
                            addon.selected_post_days = updatedAddon.selected_post_days;
                            addon.start_date = $filter('date')(tzIndependentDate(updatedAddon.start_date), $rootScope.dateFormatForAPI);
                            addon.end_date = $filter('date')(tzIndependentDate(updatedAddon.end_date), $rootScope.dateFormatForAPI);
                        }
                    });
                });
            },
                goToSummaryAndConfirm = function goToSummaryAndConfirm() {
                if ($scope.packageData === undefined) {
                    $scope.packageData = {
                        existing_packages: []
                    };
                }
                if ($scope.fromPage === "staycard") {
                    var saveData = {
                        reservationId: $scope.reservationData.reservationId,
                        room_types: [{
                            id: $scope.reservationData.rooms[0].roomTypeId,
                            num_rooms: 1,
                            addons: _.filter($scope.packageData.existing_packages, function (addon) {
                                addon.start_date = $filter('date')(tzIndependentDate(addon.start_date), $rootScope.dateFormatForAPI);
                                addon.end_date = $filter('date')(tzIndependentDate(addon.end_date), $rootScope.dateFormatForAPI);
                                return !addon.is_rate_addon;
                            })
                        }]
                    };

                    var successCallBack = function successCallBack() {
                        $scope.$emit('hideLoader');
                        $state.go("rover.reservation.staycard.reservationcard.reservationdetails", {
                            id: $scope.reservationData.reservationId,
                            confirmationId: $scope.reservationData.confirmNum,
                            isrefresh: true
                        });
                    };
                    var failureCallBack = function failureCallBack(errorMessage) {
                        $scope.$emit('hideLoader');
                        $scope.errorMessage = errorMessage;
                    };

                    $scope.invokeApi(RVReservationSummarySrv.updateReservation, saveData, successCallBack, failureCallBack);
                } else {
                    updateAddonPostOptions();
                    var save = function save() {
                        if ($scope.reservationData.guest.id || $scope.reservationData.company.id || $scope.reservationData.travelAgent.id || $scope.reservationData.group.id || $scope.reservationData.allotment.id) {
                            /**
                             * 1. Move check for guest / company / ta card attached to the screen before the reservation summary screen.
                             * This may either be the rooms and rates screen or the Add on screen when turned on.
                             * -- QA Comments : done, but returns to enhance stay screen.
                             *    Upon closing, user should be on summary screen
                             */
                            $state.go('rover.reservation.staycard.mainCard.summaryAndConfirm', {
                                "reservation": $stateParams.reservation
                            });
                        }
                    };

                    if (!$scope.reservationData.guest.id && !$scope.reservationData.company.id && !$scope.reservationData.travelAgent.id && !$scope.reservationData.group.id) {
                        $timeout(function () {
                            $scope.$emit('PROMPTCARD');
                        }, 500);
                        $scope.$watch("reservationData.guest.id", save);
                        $scope.$watch("reservationData.company.id", save);
                        $scope.$watch("reservationData.travelAgent.id", save);
                    } else {
                        $state.go('rover.reservation.staycard.mainCard.summaryAndConfirm', {
                            "reservation": $stateParams.reservation
                        });
                    }
                }
            },
                getCurrentRoomDetails = function getCurrentRoomDetails() {
                var currentRoomTypeId = parseInt($scope.reservationData.tabs[$scope.activeRoom].roomTypeId, 10),
                    firstIndex = _.indexOf($scope.reservationData.rooms, _.findWhere($scope.reservationData.rooms, {
                    roomTypeId: currentRoomTypeId
                })),
                    lastIndex = _.lastIndexOf($scope.reservationData.rooms, _.last(_.where($scope.reservationData.rooms, {
                    roomTypeId: currentRoomTypeId
                })));

                return {
                    roomTypeId: currentRoomTypeId,
                    firstIndex: firstIndex,
                    lastIndex: lastIndex
                };
            },
                fetchAddons = function fetchAddons(paramChargeGrpId, isInitialLoad) {
                var successCallBackFetchAddons = function successCallBackFetchAddons(data) {
                    var inclusiveAddons = [],
                        startIndex = $scope.roomDetails.firstIndex,
                        endIndex = $scope.roomDetails.lastIndex,
                        i;

                    if ($stateParams.reservation === "HOURLY") {
                        startIndex = 0;
                        endIndex = $scope.reservationData.rooms.length - 1;
                    }

                    // Hide loader anime
                    $scope.$emit("hideLoader");
                    // segregate inclusive addons and store them
                    _.each(data.rate_addons, function (item) {
                        if (item.is_inclusive) {
                            inclusiveAddons.push(item);
                        }
                    });
                    for (i = startIndex; i <= endIndex; i++) {
                        $scope.reservationData.rooms[i].inclusiveAddons = inclusiveAddons;
                    }
                    // initialize addons for display
                    $scope.addons = [];
                    var currentRate = parseInt($scope.reservationData.rooms[$scope.roomDetails.firstIndex].rateId, 10);

                    _.each(data.results, function (item) {
                        if (!!item) {
                            if (!item.allow_rate_exclusion || item.allow_rate_exclusion && _.indexOf(item.excluded_rate_ids, currentRate) < 0) {
                                $scope.addons.push(RVReservationPackageSrv.parseAddonItem(item));
                            }
                        }
                    });
                    // refresh scroller
                    $scope.refreshAddonsScroller();

                    // Clear the variables for Enhancement pop up And rooms Add ons And repopulate.
                    // Do this only in case of create reservation. i.e. dont do if reservation ID exists.
                    // CICO-16792 - DOING THIS ONLY ON INITIAL LOAD -- FOR BUG FIXING

                    if (!!isInitialLoad && (RVReservationStateService.getReservationFlag('RATE_CHANGED') || !$scope.reservationData.reservationId)) {
                        // reset flag!
                        RVReservationStateService.setReservationFlag('RATE_CHANGED', false);
                        if (!$scope.is_rate_addons_fetch) {
                            $scope.addonsData.existingAddons = [];
                            for (i = startIndex; i <= endIndex; i++) {
                                $scope.reservationData.rooms[i].addons = [];
                            }
                            // This is for addons associated with the RATE!!!
                            _.each(data.rate_addons, function (addon) {
                                // Set this flag when there is Children in reservation & addon on for child.
                                addon.is_rate_addon = true; // This is true as these addons are rate associated addons
                                var flag = addon.amount_type.value === "CHILD" && parseInt($scope.reservationData.tabs[$scope.activeRoom].numChildren) === 0 || addon.amount_type.value === "ADULT" && parseInt($scope.reservationData.tabs[$scope.activeRoom].numAdults) === 0,
                                    roomIndex;

                                if (!flag) {
                                    $scope.addonsData.existingAddons.push(RVReservationPackageSrv.parseRateAddonItem(addon, $scope.reservationData));
                                    for (roomIndex = startIndex; roomIndex <= endIndex; roomIndex++) {
                                        $scope.reservationData.rooms[roomIndex].addons.push(RVReservationPackageSrv.parseAddonItem(addon, true));
                                    }
                                }
                            });
                        }
                        $scope.is_rate_addons_fetch = true;
                    }
                    $scope.existingAddonsLength = $scope.addonsData.existingAddons.length;
                };

                $scope.invokeApi(RVReservationAddonsSrv.fetchAddons, {
                    'charge_group_id': paramChargeGrpId === undefined ? '' : paramChargeGrpId,
                    'is_bestseller': !paramChargeGrpId,
                    'from_date': $scope.reservationData.arrivalDate,
                    'to_date': $scope.reservationData.departureDate,
                    'is_active': true,
                    'is_not_rate_only': true,
                    'rate_id': $scope.reservationData.rooms[$scope.roomDetails.firstIndex].rateId,
                    'reservation_id': $scope.reservationData.reservationId === undefined ? '' : $scope.reservationData.reservationId,
                    'no_pagination': true, // Added for CICO-25066
                    'adults': $scope.reservationData.tabs[$scope.viewState.currentTab].numAdults,
                    'children': $scope.reservationData.tabs[$scope.viewState.currentTab].numChildren
                }, successCallBackFetchAddons);
            },
                insertAddon = function insertAddon(addon, addonQty) {
                var currentItem = _.find($scope.addonsData.existingAddons, {
                    id: addon.id
                }),
                    startIndex = $scope.roomDetails.firstIndex,
                    endIndex = $scope.roomDetails.lastIndex,
                    i;

                if ($stateParams.reservation === "HOURLY") {
                    startIndex = 0;
                    endIndex = $scope.reservationData.rooms.length - 1;
                }

                addonQty = parseInt(addonQty, 10) || 1;
                if (!!currentItem) {
                    // Adding count to existing addon type
                    currentItem.quantity = parseInt(currentItem.quantity, 10) + addonQty;
                    currentItem.totalAmount = currentItem.quantity * currentItem.price_per_piece;
                    var elemIndex = -1;

                    $($scope.reservationData.rooms[startIndex].addons).each(function (index, elem) {
                        if (elem.id === addon.id) {
                            elemIndex = index;
                        }
                    });
                    for (i = startIndex; i <= endIndex; i++) {
                        $scope.reservationData.rooms[i].addons[elemIndex].quantity += addonQty;
                    }
                } else {
                    // Adding a new addon type
                    $scope.addonsData.existingAddons.push({
                        id: addon.id,
                        quantity: addonQty,
                        title: addon.title,
                        totalAmount: addonQty * addon.price,
                        price_per_piece: addon.price,
                        amount_type: addon.amountType,
                        post_type: addon.postType,
                        charge_full_weeks_only: addon.chargefullweeksonly,
                        posting_frequency: addon.postType.frequency,
                        rate_currency: addon.rateCurrency,
                        start_date: tzIndependentDate($scope.reservationData.arrivalDate),
                        end_date: tzIndependentDate($scope.reservationData.departureDate),
                        is_allowance: addon.is_allowance,
                        is_consume_next_day: addon.is_consume_next_day,
                        is_inclusive: addon.is_inclusive,
                        is_rate_addon: addon.is_rate_addon,
                        post_day_of_the_week: addon.post_day_of_the_week,
                        post_day_of_the_month: addon.post_day_of_the_month,
                        frequency_type: addon.frequency_type,
                        frequency: addon.frequency,
                        custom_nightly_selected_post_days: addon.custom_nightly_selected_post_days
                    });

                    $scope.existingAddonsLength = $scope.addonsData.existingAddons.length;

                    for (i = startIndex; i <= endIndex; i++) {
                        if (!$scope.reservationData.rooms[i].addons) {
                            $scope.reservationData.rooms[i].addons = [];
                        }
                        $scope.reservationData.rooms[i].addons.push({
                            id: addon.id,
                            title: addon.title,
                            quantity: addonQty,
                            price: addon.price,
                            amountType: addon.amountType,
                            postType: addon.postType,
                            taxDetail: addon.taxes,
                            chargefullweeksonly: addon.chargefullweeksonly,
                            is_rate_addon: addon.is_rate_addon
                        });
                    }
                }
                $scope.showEnhancementsPopup();
            },
                applyAddon = function applyAddon(addon, addonQty) {
                var successCallBackApplyAddons = function successCallBackApplyAddons() {
                    fetchReservationAddons(true);
                },
                    failureCallBack = function failureCallBack(errorMessage) {
                    $scope.$emit('hideLoader');
                    $scope.errorMessage = errorMessage;
                };

                $scope.invokeApi(RVReservationPackageSrv.applyAddon, {
                    'id': $scope.reservationData.reservationId === undefined ? '' : $scope.reservationData.reservationId,
                    'addon_id': addon.id,
                    'quantity': addonQty,
                    'application': 'ROVER'
                }, successCallBackApplyAddons, failureCallBack);
            },
                addonsDataCopy = [];

            $scope.showEnhancementsPopup = function () {
                var selectedAddons = $scope.addonsData.existingAddons;

                $scope.addonPopUpData = {
                    addonPostingMode: 'reservation',
                    cancelLabel: "Cancel",
                    saveLabel: $scope.fromPage === 'staycard' ? "Save" : "Book",
                    shouldShowAddMoreButton: false,
                    number_of_adults: $scope.reservationData.number_of_adults,
                    number_of_children: $scope.reservationData.number_of_children,
                    duration_of_stay: $scope.duration_of_stay
                };

                $scope.packageData = {
                    existing_packages: []
                };

                angular.forEach($scope.addonsData.existingAddons, function (item) {
                    var addonsData = {
                        id: item.id,
                        name: item.title,
                        addon_count: item.quantity,
                        totalAmount: item.totalAmount,
                        amount: item.price_per_piece,
                        amount_type: item.amount_type,
                        post_type: item.post_type,
                        is_inclusive: item.is_inclusive,
                        is_rate_addon: item.is_rate_addon,
                        start_date: item.start_date,
                        end_date: item.end_date,
                        addon_currency: item.rate_currency,
                        charge_full_weeks_only: item.charge_full_weeks_only,
                        post_instances: item.post_instances,
                        quantity: item.quantity,
                        is_allowance: item.is_allowance,
                        is_consume_next_day: item.is_consume_next_day,
                        post_day_of_the_week: item.post_day_of_the_week,
                        post_day_of_the_month: item.post_day_of_the_month,
                        frequency_type: item.frequency_type,
                        frequency: item.frequency,
                        custom_nightly_selected_post_days: item.custom_nightly_selected_post_days
                    };

                    if ($scope.reservationData.group && $scope.reservationData.group.id) {
                        addonsData.selected_post_days = item.selected_post_days;
                    }

                    $scope.packageData.existing_packages.push(addonsData);
                });

                if (selectedAddons.length > 0) {
                    ngDialog.open({
                        template: '/assets/partials/packages/showPackages.html',
                        controller: 'RVReservationPackageController',
                        scope: $scope
                    });
                }
            };

            $scope.closePopup = function () {
                ngDialog.close();
            };

            $scope.refreshAddonsScroller = function () {
                $timeout(function () {
                    if ($scope.$parent.myScroll['enhanceStays']) {
                        $scope.$parent.myScroll['enhanceStays'].refresh();
                    }
                }, 700);
            };

            $scope.proceed = function () {
                $scope.closePopup();
                var allRatesSelected = _.reduce(_.pluck($scope.reservationData.rooms, 'rateId'), function (a, b) {
                    return !!a && !!b;
                });

                if ($stateParams.reservation === "HOURLY" || allRatesSelected) {
                    goToSummaryAndConfirm();
                } else {
                    var roomIndexWithoutRate = _.findIndex($scope.reservationData.rooms, {
                        rateId: ""
                    });

                    var tabIndexWithoutRate = _.findIndex($scope.reservationData.tabs, {
                        roomTypeId: $scope.reservationData.rooms[roomIndexWithoutRate].roomTypeId
                    });

                    $scope.viewState.currentTab = tabIndexWithoutRate;
                    $state.go(roomAndRatesState, {
                        from_date: $scope.reservationData.arrivalDate,
                        to_date: $scope.reservationData.departureDate,
                        view: "DEFAULT",
                        company_id: $scope.reservationData.company.id,
                        travel_agent_id: $scope.reservationData.travelAgent.id,
                        fromState: 'rover.reservation.staycard.mainCard.addons',
                        group_id: $scope.reservationData.group.id,
                        room_type_id: $scope.reservationData.tabs[$scope.viewState.currentTab].roomTypeId,
                        adults: $scope.reservationData.tabs[$scope.viewState.currentTab].numAdults,
                        children: $scope.reservationData.tabs[$scope.viewState.currentTab].numChildren
                    });
                }
            };

            $scope.selectAddonCategory = function (category, event) {
                event.stopPropagation();
                if (!!category) {
                    $scope.activeAddonCategoryId = category.id;
                    fetchAddons(category.id);
                } else {
                    $scope.activeAddonCategoryId = -1;
                    fetchAddons();
                }
            };

            $scope.selectAddon = function (addon, addonQty, overBook) {
                $scope.closePopup();
                if (!$rootScope.isItemInventoryOn || overBook) {
                    if ($stateParams.from_screen === "staycard") {
                        applyAddon(addon, addonQty);
                    } else {
                        insertAddon(addon, addonQty);
                    }
                } else {
                    /*
                     *  the following is for the calculation to check if the inventory limit is exeeded
                     *  as the count is dependant on duration of stay ,type and number of guests etc
                     *
                     */
                    $scope.selectedAddonName = addon.title;
                    var getTotalPostedAddons = function getTotalPostedAddons(postType, baseCount) {
                        var postingRythm = parseInt(postType.frequency, 10);

                        if (postingRythm === 0) {
                            return baseCount;
                        } else if (postingRythm === 1) {
                            return baseCount * $scope.duration_of_stay;
                        } else {
                            return baseCount * ($scope.duration_of_stay / postingRythm);
                        }
                    },
                        headCount = 0,
                        roomCount = $scope.reservationData.tabs[$scope.viewState.currentTab].roomCount;

                    if (addon.amountType.value === 'PERSON') {
                        headCount = getTotalPostedAddons(addon.postType, $scope.reservationData.number_of_adults + $scope.reservationData.number_of_children);
                    } else if (addon.amountType.value === 'ADULT') {
                        headCount = getTotalPostedAddons(addon.postType, $scope.reservationData.number_of_adults);
                    } else if (addon.amountType.value === 'CHILD') {
                        headCount = getTotalPostedAddons(addon.postType, $scope.reservationData.number_of_children);
                    } else if (addon.amountType.value === 'FLAT' || addon.amountType.value === 'ROOM') {
                        headCount = getTotalPostedAddons(addon.postType, 1);
                    }

                    // account for room-count
                    headCount = headCount * roomCount;

                    var newAddonQty = 0;

                    angular.forEach($scope.addonsData.existingAddons, function (item, index) {
                        if (item.id === addon.id) {
                            newAddonQty = parseInt(item.quantity);
                        }
                    });
                    var oldAddonQty = 0;

                    angular.forEach(addonsDataCopy, function (item, index) {
                        if (item.id === addon.id) {
                            oldAddonQty = parseInt(item.quantity);
                        }
                    });

                    var successCallBackInventoryCheck = function successCallBackInventoryCheck(response) {
                        $scope.$emit('hideLoader');
                        var availableAddonCount = response.available_count;
                        // Adjust avbl count with the deleted ones now
                        // newAddonQty => The existing count in the session
                        // oldAddonQty => The addon qty count while having come inside the screen (esp. when coming to enhance stays from the stay card)
                        var remainingCount = availableAddonCount - (newAddonQty - oldAddonQty) - headCount * addonQty;
                        /*
                         *  if the available count is less we prompts warning popup
                         */

                        if (remainingCount >= 0 || availableAddonCount === null) {
                            if ($stateParams.from_screen === "staycard") {
                                applyAddon(addon, addonQty);
                            } else {
                                insertAddon(addon, addonQty);
                            }
                        } else {
                            $scope.addon = addon;
                            $scope.addonQty = addonQty;
                            $scope.remainingCount = availableAddonCount;
                            ngDialog.open({
                                template: '/assets/partials/reservationCard/rvInsufficientInventory.html',
                                className: 'ngdialog-theme-default',
                                closeByDocument: true,
                                scope: $scope,
                                data: JSON.stringify({
                                    name: $scope.selectedAddonName,
                                    count: availableAddonCount,
                                    canOverbookInventory: rvPermissionSrv.getPermissionValue('OVERRIDE_ITEM_INVENTORY')
                                })
                            });
                        }
                    };

                    // Set the departure date for the query as the date before actual departure and in case of day reservations,
                    // make it the arrival date.
                    // Change made for CICO-21037
                    var adjustedQueryEndDate = new tzIndependentDate($scope.reservationData.arrivalDate);

                    adjustedQueryEndDate.setDate(adjustedQueryEndDate.getDate() + (($scope.reservationData.numNights || 1) - 1));

                    var paramDict = {
                        'addon_id': addon.id,
                        'from_date': $scope.reservationData.arrivalDate,
                        'to_date': $filter('date')(adjustedQueryEndDate, 'yyyy-MM-dd')
                    };

                    $scope.invokeApi(RVReservationAddonsSrv.checkInventory, paramDict, successCallBackInventoryCheck);
                }
            };

            var deleteReservationAddon = function deleteReservationAddon(addonId, index) {
                var reservationId = $scope.reservationData.reservationId;

                var successDelete = function successDelete() {
                    removeSelectedAddons(index);
                },
                    failureCallBack = function failureCallBack(errorMessage) {
                    $scope.errorMessage = errorMessage;
                },
                    addonArray = [];

                addonArray.push(addonId);
                var dataToApi = {
                    "postData": {
                        "addons": addonArray
                    },

                    "reservationId": reservationId
                };

                $scope.invokeApi(RVReservationPackageSrv.deleteAddonsFromReservation, dataToApi, successDelete, failureCallBack);
            };

            var removeSelectedAddons = function removeSelectedAddons(index) {
                var roomIndex,
                    startIndex = $scope.roomDetails.firstIndex,
                    endIndex = $scope.roomDetails.lastIndex;

                if ($stateParams.reservation === "HOURLY") {
                    startIndex = 0;
                    endIndex = $scope.reservationData.rooms.length - 1;
                }

                // subtract selected addon amount from total stay cost
                $scope.addonsData.existingAddons.splice(index, 1);
                $scope.packageData.existing_packages.splice(index, 1);

                for (roomIndex = startIndex; roomIndex <= endIndex; roomIndex++) {
                    $scope.reservationData.rooms[roomIndex].addons.splice(index, 1);
                }

                $scope.existingAddonsLength = $scope.addonsData.existingAddons.length;
                if ($scope.addonsData.existingAddons.length === 0) {
                    $scope.closePopup();
                }
            };

            var initController = function initController() {
                $scope.addons = [];
                $scope.activeRoom = $scope.viewState.currentTab;
                $scope.fromPage = "";
                $scope.duration_of_stay = $scope.reservationData.numNights || 1;
                $scope.existingAddonsLength = 0;
                $scope.setHeadingTitle('Enhance Stay');
                $scope.$parent.hideSidebar = true;

                /**
                 * Moving the below 7 lines(incl. single line comments) outside of the else block
                 * as part of CICO-66740 - Addons screen does not display the group addons list
                 *      in the left hand side when navigated via Room diary screen
                 */
                // by default load Best Sellers addon
                // Best Sellers in not a real charge code [just hard coding -1 as charge group id to fetch best sell addons]
                // same will be overrided if with valid charge code id
                $scope.activeAddonCategoryId = -1;
                $scope.roomNumber = '';
                $scope.addonCategories = addonData.addonCategories;
                $scope.bestSellerEnabled = addonData.bestSellerEnabled;

                setBackButton();

                if ($stateParams.reservation === "HOURLY") {
                    initFromHourly();
                } else {
                    $scope.roomDetails = getCurrentRoomDetails();

                    if (!RVReservationStateService.getReservationFlag('RATE_CHANGED') && !!$scope.reservationData.reservationId) {
                        fetchReservationAddons();
                    } else if (!!$scope.reservationData.group.id) {
                        $scope.is_rate_addons_fetch = true;
                        $scope.callAPI(rvGroupConfigurationSrv.getGroupEnhancements, {
                            successCallBack: setUpAssociatedAddons,
                            params: {
                                "id": $scope.reservationData.group.id
                            }
                        });
                    }

                    // first time fetch best seller addons
                    // for fetching best sellers - call method without params ie. no charge group id
                    // Best Sellers in not a real charge code [just hard coded charge group to fetch best sell addons]
                    /**
                     * CICO-16792 Sending a second parameter to the fetchAddons method to identify the initial call to the method
                     */
                    fetchAddons('', true);
                    var scrollerOptions = {
                        click: true,
                        preventDefault: false,
                        showScrollbar: true
                    };

                    $scope.setScroller("enhanceStays", scrollerOptions);
                    $timeout(function () {
                        $scope.refreshAddonsScroller();
                    }, 2000);

                    var proceedBookingListner = $scope.$on('PROCEED_BOOKING', function (event, data) {
                        if (data.addonPostingMode === 'reservation' && $scope.fromPage === 'staycard') {
                            saveAddonPosting(data.selectedPurchesedAddon);
                        } else if (data.addonPostingMode === 'reservation') {
                            $scope.proceed();
                        }
                    });

                    var removeSelectedAddonsListner = $rootScope.$on('REMOVE_ADDON', function (event, data) {
                        if (data.addonPostingMode === 'reservation' && $scope.fromPage === 'staycard') {
                            deleteReservationAddon(data.addon.id, data.index);
                        } else if (data.addonPostingMode === 'reservation') {
                            removeSelectedAddons(data.index);
                        }
                    });

                    $scope.$on('$destroy', proceedBookingListner);
                    $scope.$on('$destroy', removeSelectedAddonsListner);
                }
            };

            var saveAddonPosting = function saveAddonPosting(selectedPurchesedAddon) {

                var addonPostingSaveSuccess = function addonPostingSaveSuccess() {
                    $scope.$emit('hideLoader');
                    fetchReservationAddons(true);
                };

                var dataToApi = {
                    'addon_id': selectedPurchesedAddon.id,
                    'reservation_id': $scope.reservationData.reservationId,
                    'post_instances': selectedPurchesedAddon.post_instances,
                    'start_date': $filter('date')(tzIndependentDate(selectedPurchesedAddon.start_date), $rootScope.dateFormatForAPI),
                    'end_date': $filter('date')(tzIndependentDate(selectedPurchesedAddon.end_date), $rootScope.dateFormatForAPI),
                    'selected_post_days': selectedPurchesedAddon.selected_post_days
                };

                $scope.invokeApi(RVReservationPackageSrv.updateAddonPosting, dataToApi, addonPostingSaveSuccess);
            };

            var setUpAssociatedAddons = function setUpAssociatedAddons(data) {
                var roomIndex,
                    startIndex = $scope.roomDetails.firstIndex,
                    endIndex = $scope.roomDetails.lastIndex;

                if ($stateParams.reservation === "HOURLY") {
                    startIndex = 0;
                    endIndex = $scope.reservationData.rooms.length - 1;
                }

                $scope.$emit('hideLoader');
                $scope.roomNumber = data.room_no;
                $scope.duration_of_stay = data.duration_of_stay || $scope.reservationData.numNights;
                $scope.addonsData.existingAddons = [];
                for (roomIndex = startIndex; roomIndex <= endIndex; roomIndex++) {
                    // Reset Addons list in Room Model - CICO-20061
                    $scope.reservationData.rooms[roomIndex].addons = [];
                }
                var associatedPackages = data.existing_packages || data;

                $scope.packageData = {
                    existing_packages: []
                };
                angular.forEach(associatedPackages, function (item) {
                    var addonsData = {
                        id: item.id,
                        title: item.name,
                        quantity: item.addon_count,
                        description: item.description,
                        totalAmount: item.addon_count * parseFloat(item.amount),
                        price_per_piece: item.amount,
                        amount_type: item.amount_type,
                        post_type: item.post_type,
                        is_inclusive: item.is_inclusive,
                        is_rate_addon: item.is_rate_addon,
                        rate_currency: item.addon_currency,
                        post_instances: item.post_instances,
                        start_date: item.start_date,
                        end_date: item.end_date,
                        posting_frequency: item.post_type.frequency,
                        post_day_of_the_week: item.post_day_of_the_week,
                        post_day_of_the_month: item.post_day_of_the_month,
                        frequency_type: item.frequency_type,
                        frequency: item.frequency,
                        custom_nightly_selected_post_days: item.custom_nightly_selected_post_days
                    };

                    if ($scope.reservationData.group && $scope.reservationData.group.id) {
                        addonsData.start_date = tzIndependentDate($scope.reservationData.arrivalDate);
                        addonsData.end_date = tzIndependentDate($scope.reservationData.departureDate);
                        addonsData.selected_post_days = item.selected_post_days;
                    }
                    $scope.addonsData.existingAddons.push(addonsData);

                    $scope.packageData.existing_packages.push(addonsData);

                    for (roomIndex = startIndex; roomIndex <= endIndex; roomIndex++) {
                        $scope.reservationData.rooms[roomIndex].addons.push({
                            quantity: addonsData.quantity,
                            id: addonsData.id,
                            price: parseFloat(item.amount),
                            amountType: item.amount_type,
                            postType: item.post_type,
                            title: addonsData.title,
                            totalAmount: addonsData.totalAmount,
                            is_inclusive: addonsData.is_inclusive,
                            taxes: item.taxes,
                            is_rate_addon: item.is_rate_addon,
                            rate_currency: item.addon_currency
                        });
                    }
                });

                addonsDataCopy = angular.copy($scope.addonsData.existingAddons);
                $scope.existingAddonsLength = $scope.addonsData.existingAddons.length;
            };

            var fetchReservationAddons = function fetchReservationAddons(showAddonPopup) {
                var successCallBackAssociatedAddons = function successCallBackAssociatedAddons(data) {
                    setUpAssociatedAddons(data);
                    if (showAddonPopup) {
                        $scope.showEnhancementsPopup();
                    }
                };

                $scope.invokeApi(RVReservationPackageSrv.getReservationPackages, $scope.reservationData.reservationId, successCallBackAssociatedAddons);
            };

            $scope.goToAddons = function () {
                $scope.closePopup();
            };

            // CICO-32856
            $scope.$on('cardChanged', function (event, cardIds) {
                setBackButton();
            });

            initController();
        }]);
    }, {}] }, {}, [1]);