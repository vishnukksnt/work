"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

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
        sntRover.controller('RVReservationMainCtrl', ['$scope', '$rootScope', 'ngDialog', '$filter', 'RVCompanyCardSrv', '$state', 'dateFilter', 'baseSearchData', 'RVReservationSummarySrv', 'RVReservationCardSrv', 'RVPaymentSrv', '$timeout', '$stateParams', 'RVReservationGuestSrv', 'RVReservationStateService', 'RVReservationDataService', '$interval', '$log', '$q', 'RVContactInfoSrv', 'RVRoomRatesSrv', 'rvUtilSrv', 'rvPermissionSrv', function ($scope, $rootScope, ngDialog, $filter, RVCompanyCardSrv, $state, dateFilter, baseSearchData, RVReservationSummarySrv, RVReservationCardSrv, RVPaymentSrv, $timeout, $stateParams, RVReservationGuestSrv, RVReservationStateService, RVReservationDataService, $interval, $log, $q, RVContactInfoSrv, RVRoomRatesSrv, rvUtilSrv, rvPermissionSrv) {

            BaseCtrl.call(this, $scope);

            $scope.$emit("updateRoverLeftMenu", "createReservation");

            var title = $filter('translate')('RESERVATION_TITLE');

            $scope.setTitle(title);
            var that = this;

            var roomAndRatesState = 'rover.reservation.staycard.mainCard.room-rates';

            var RESPONSE_STATUS_470 = 470;
            var is_day_use_check_required = true;

            $scope.hasOverBookRoomTypePermission = rvPermissionSrv.getPermissionValue('OVERBOOK_ROOM_TYPE');
            $scope.hasOverBookHousePermission = rvPermissionSrv.getPermissionValue('OVERBOOK_HOUSE');
            $scope.hasBorrowFromHousePermission = rvPermissionSrv.getPermissionValue('GROUP_HOUSE_BORROW');

            // setting the main header of the screen
            $scope.heading = "Reservations";

            $scope.viewState = {
                currentTab: 0,
                isAddNewCard: false,
                pendingRemoval: {
                    status: false,
                    cardType: ""
                },
                identifier: "CREATION",
                lastCardSlot: "",
                reservationStatus: {
                    confirm: false,
                    number: null
                }
            };

            // fetching country list
            // Commenting - Another call is happening to fetch countries

            // adding extra function to reset time
            $scope.clearArrivalAndDepartureTime = function () {
                $scope.reservationData.checkinTime = RVReservationDataService.getTimeModel();
                $scope.reservationData.checkoutTime = RVReservationDataService.getTimeModel();
            };

            $scope.otherData = {};
            // needed to add an extra data variable as others were getting reset
            $scope.addonsData = {};
            $scope.addonsData.existingAddons = [];

            // to set data for reverse checkout process
            $scope.initreverseCheckoutDetails = function () {
                $scope.reverseCheckoutDetails = {
                    data: {
                        is_reverse_checkout_failed: false,
                        errormessage: ""
                    }
                };
            };
            $scope.initreverseCheckoutDetails();

            $scope.initReservationData = function () {

                RVReservationStateService.bookMark.lastPostedRate = null;
                $scope.hideSidebar = false;
                $scope.addonsData.existingAddons = [];
                // intialize reservation object
                $scope.reservationData = RVReservationDataService.getReservationDataModel();
                $scope.searchData = RVReservationDataService.getSearchDataModel();
                // default max value if max_adults, max_children, max_infants is not configured
                var defaultMaxvalue = 5;
                var guestMaxSettings = baseSearchData.settings.max_guests;
                var maxRoomCount = parseInt(baseSearchData.settings.max_room_quantity, 10) || 5; // Defaulting to 5

                /**
                 *   We have moved the fetching of 'baseData' form 'rover.reservation' state
                 *   to the states where it actually requires it.
                 *
                 *   Now we do want to bind the baseData so we have created a 'callFromChildCtrl' (last method).
                 *
                 *   Once that state controller fetch 'baseData', it will find this controller
                 *   by climbing the $socpe.$parent ladder and will call 'callFromChildCtrl' method.
                 */

                $scope.otherData.taxesMeta = [];
                $scope.otherData.promotionTypes = [{
                    value: "v1",
                    description: "The first"
                }, {
                    value: "v2",
                    description: "The Second"
                }];
                $scope.otherData.maxAdults = guestMaxSettings.max_adults === null || guestMaxSettings.max_adults === '' ? defaultMaxvalue : guestMaxSettings.max_adults;
                $scope.otherData.maxChildren = guestMaxSettings.max_children === null || guestMaxSettings.max_children === '' ? defaultMaxvalue : guestMaxSettings.max_children;
                $scope.otherData.maxInfants = guestMaxSettings.max_infants === null || guestMaxSettings.max_infants === '' ? defaultMaxvalue : guestMaxSettings.max_infants;
                $scope.otherData.maxRoomCount = maxRoomCount;

                $scope.otherData.roomTypes = baseSearchData.roomTypes;
                $scope.reservationData.roomsMeta = {};
                _.each(baseSearchData.roomTypes, function (room) {
                    $scope.reservationData.roomsMeta[room.id] = room;
                });

                $scope.otherData.fromSearch = false;
                $scope.otherData.recommendedRateDisplay = baseSearchData.settings.recommended_rate_display;
                $scope.otherData.defaultRateDisplayName = baseSearchData.settings.default_rate_display_name;
                $scope.otherData.businessDate = baseSearchData.businessDate;
                $scope.otherData.additionalEmail = "";
                $scope.otherData.isGuestPrimaryEmailChecked = false;
                $scope.otherData.isGuestAdditionalEmailChecked = false;
                $scope.otherData.reservationCreated = false;

                $scope.otherData.marketIsForced = baseSearchData.settings.force_market_code;
                $scope.otherData.sourceIsForced = baseSearchData.settings.force_source_code;
                $scope.otherData.originIsForced = baseSearchData.settings.force_origin_of_booking;
                $scope.otherData.reservationTypeIsForced = baseSearchData.settings.force_reservation_type;
                $scope.otherData.segmentsIsForced = baseSearchData.settings.force_segments;
                // CICO-17731 Force Adjustment Reasons
                $scope.otherData.forceAdjustmentReason = baseSearchData.settings.force_rate_adjustment_reason;
                // CICO-12562 Zoku - Overbooking Alert
                $scope.otherData.showOverbookingAlert = baseSearchData.settings.show_overbooking_alert;

                $scope.otherData.isAddonEnabled = baseSearchData.settings.is_addon_on;
                $scope.otherData.booking_max_stay_length = baseSearchData.settings.max_stay_length || 92;

                $scope.guestCardData = {};
                $scope.guestCardData.cardHeaderImage = "/ui/pms-ui/images/avatar-trans.png";
                $scope.guestCardData.contactInfo = {};
                $scope.guestCardData.userId = '';

                $scope.guestCardData.contactInfo.birthday = '';

                $scope.reservationListData = {};

                $scope.reservationDetails = RVReservationDataService.getReservationDetailsModel();
            };

            $scope.initReservationDetails = function () {
                // Initiate All Cards
                $scope.reservationDetails = RVReservationDataService.getReservationDetailsModel();

                $scope.viewState = {
                    currentTab: 0,
                    isAddNewCard: false,
                    pendingRemoval: {
                        status: false,
                        cardType: ""
                    },
                    identifier: "CREATION",
                    lastCardSlot: "",
                    reservationStatus: {
                        confirm: false,
                        number: null
                    }
                };
            };

            // CICO-7641
            var isOccupancyConfigured = function isOccupancyConfigured(roomIndex) {
                var rateConfigured = true;

                if (typeof $scope.reservationData.rateDetails[roomIndex] !== "undefined") {
                    _.each($scope.reservationData.rateDetails[roomIndex], function (d, dateIter) {
                        if (dateIter !== $scope.reservationData.departureDate && $scope.reservationData.rooms[roomIndex].stayDates[dateIter].rate.id !== '' && parseFloat($scope.reservationData.rooms[roomIndex].stayDates[dateIter].rateDetails.actual_amount) !== 0.00) {
                            var rateToday = d[$scope.reservationData.rooms[roomIndex].stayDates[dateIter].rate.id] ? d[$scope.reservationData.rooms[roomIndex].stayDates[dateIter].rate.id].rateBreakUp : null;
                            var numAdults = parseInt($scope.reservationData.rooms[roomIndex].stayDates[dateIter].guests.adults);
                            var numChildren = parseInt($scope.reservationData.rooms[roomIndex].stayDates[dateIter].guests.children);

                            if (rateToday && rateToday.single === null && rateToday.double === null && rateToday.extra_adult === null && rateToday.child === null) {
                                rateConfigured = false;
                            } else {
                                // Step 2: Check for the other constraints here
                                // Step 2 A : Children
                                if (rateToday) {
                                    if (numChildren > 0 && rateToday.child === null) {
                                        rateConfigured = false;
                                    } else if (numAdults === 1 && rateToday.single === null) {
                                        // Step 2 B: one adult - single needs to be configured
                                        rateConfigured = false;
                                    } else if (numAdults >= 2 && rateToday.double === null) {
                                        // Step 2 C: more than one adult - double needs to be configured
                                        rateConfigured = false;
                                    } else if (numAdults > 2 && rateToday.extra_adult === null) {
                                        // Step 2 D: more than two adults - need extra_adult to be configured
                                        rateConfigured = false;
                                    }
                                }
                            }
                        }
                    });
                }
                return rateConfigured;
            };

            $scope.checkOccupancyLimit = function (date, reset, index, roomTypeId) {
                // CICO-11716
                if ($scope.reservationData.isHourly) {
                    return false;
                } else {
                    var roomIndex = index || 0;

                    if (isOccupancyConfigured(roomIndex)) {
                        $scope.reservationData.rooms[roomIndex].varyingOccupancy = RVReservationDataService.isVaryingOccupancy($scope.reservationData.rooms[roomIndex].stayDates, $scope.reservationData.arrivalDate, $scope.reservationData.departureDate, $scope.reservationData.numNights);

                        if (reset) {
                            $scope.saveReservation(false, false, roomIndex);
                        }
                        var activeRoom = $scope.reservationData.rooms[roomIndex].roomTypeId;
                        var currOccupancy = parseInt($scope.reservationData.rooms[roomIndex].numChildren) + parseInt($scope.reservationData.rooms[roomIndex].numAdults);

                        if (date) {
                            // If there is an date sent as a param the occupancy check has to be done for the particular day
                            currOccupancy = parseInt($scope.reservationData.rooms[roomIndex].stayDates[date].guests.adults) + parseInt($scope.reservationData.rooms[roomIndex].stayDates[date].guests.children);
                        }

                        var getMaxOccupancy = function getMaxOccupancy(roomId) {
                            var max = -1;
                            var name = "";

                            $($scope.otherData.roomTypes).each(function (i, d) {
                                if (parseInt(roomId) === d.id) {
                                    max = d.max_occupancy;
                                    name = d.name;
                                }
                            });
                            return {
                                max: max,
                                name: name
                            };
                        };

                        // CICO-44842
                        if (!activeRoom && roomTypeId) {
                            activeRoom = roomTypeId;
                        }

                        var roomPref = getMaxOccupancy(activeRoom);

                        if (typeof activeRoom === 'undefined' || activeRoom === null || activeRoom === "" || roomPref.max === null || roomPref.max >= currOccupancy) {
                            return true;
                        }
                        // CICO-9575: The occupancy warning should pop up only once during the reservation process if no changes are being made to the room type.
                        if ((!$scope.reservationData.rooms[roomIndex].isOccupancyCheckAlerted || $scope.reservationData.rooms[roomIndex].isOccupancyCheckAlerted !== activeRoom) && $state.current.name !== "rover.reservation.staycard.reservationcard.reservationdetails") {
                            ngDialog.open({
                                template: '/assets/partials/reservation/alerts/occupancy.html',
                                className: 'ngdialog-theme-default',
                                scope: $scope,
                                closeByDocument: false,
                                closeByEscape: false,
                                data: JSON.stringify({
                                    roomType: roomPref.name,
                                    roomMax: roomPref.max
                                })
                            });
                            // CICO-9575: The occupancy warning should pop up only once during the reservation process if no changes are being made to the room type.
                            $scope.reservationData.rooms[roomIndex].isOccupancyCheckAlerted = activeRoom;
                        }

                        return true;
                    } else {
                        // TODO: 7641
                        // prompt user that the room doesn't have a rate configured for the current availability
                        ngDialog.open({
                            template: '/assets/partials/reservation/alerts/notConfiguredOccupancy.html',
                            className: 'ngdialog-theme-default',
                            scope: $scope,
                            closeByDocument: false,
                            closeByEscape: false,
                            data: JSON.stringify({
                                roomIndex: roomIndex
                            })
                        });
                    }
                }
            };

            $scope.resetRoomSelection = function (roomIndex) {
                $scope.editRoomRates(roomIndex);
                $scope.closeDialog();
            };

            $scope.editRoomRates = function (roomIdx) {
                // TODO: Navigate back to roomtype selection screen after resetting the current room options
                $scope.reservationData.rooms[roomIdx].roomTypeId = '';
                $scope.reservationData.rooms[roomIdx].roomTypeName = '';
                $scope.reservationData.rooms[roomIdx].rateId = '';
                $scope.reservationData.rooms[roomIdx].rateName = '';
                $scope.reservationData.demographics = {
                    market: '',
                    source: '',
                    reservationType: '',
                    origin: ''
                };

                // Redo the staydates array
                for (var d = [], ms = new tzIndependentDate($scope.reservationData.arrivalDate) * 1, last = new tzIndependentDate($scope.reservationData.departureDate) * 1; ms <= last; ms += 24 * 3600 * 1000) {
                    $scope.reservationData.rooms[roomIdx].stayDates[dateFilter(new tzIndependentDate(ms), 'yyyy-MM-dd')].rate = {
                        id: ''
                    };
                }

                $state.go(roomAndRatesState, {
                    from_date: $scope.reservationData.arrivalDate,
                    to_date: $scope.reservationData.departureDate,
                    fromState: 'rover.reservation.search',
                    company_id: $scope.reservationData.company.id,
                    travel_agent_id: $scope.reservationData.travelAgent.id
                });
            };

            $scope.updateOccupancy = function (roomIdx) {
                for (var d = [], ms = new tzIndependentDate($scope.reservationData.arrivalDate) * 1, last = new tzIndependentDate($scope.reservationData.departureDate) * 1; ms <= last; ms += 24 * 3600 * 1000) {
                    $scope.reservationData.rooms[roomIdx].stayDates[dateFilter(new tzIndependentDate(ms), 'yyyy-MM-dd')].guests = {
                        adults: parseInt($scope.reservationData.rooms[roomIdx].numAdults),
                        children: parseInt($scope.reservationData.rooms[roomIdx].numChildren),
                        infants: parseInt($scope.reservationData.rooms[roomIdx].numInfants)
                    };
                }
            };

            /*
                This function is called once the stay card loads and
                populates the $scope.reservationData object with the current reservation's data.
                 This is done to enable use of the $scope.reservationData object in the subsequent screens in
                the flow from the staycards
            */

            $scope.populateDataModel = function (reservationDetails) {
                var parsedStayCardData = RVReservationDataService.parseReservationData(reservationDetails.reservation_card, $scope.reservationListData);

                _.extend($scope.reservationData, parsedStayCardData.reservationData);
                // CICO-50125 - Added because the update reservation request params is
                // making use of the paymentMethods object
                $scope.reservationData.paymentMethods = reservationDetails.paymentMethods;
                // Not sure why the below four are being dumped to the scope
                // Ref original commit at https://github.com/StayNTouch/pms/commit/d1021861
                $scope.isManual = parsedStayCardData.isManual;
                $scope.reservationEditMode = parsedStayCardData.reservationEditMode;
                $scope.showSelectedCreditCard = parsedStayCardData.showSelectedCreditCard;
                $scope.renderData = parsedStayCardData.renderData;
            };

            /**
             * Event handler for the left menu staydates click action
             * We should display the calendar screen
             */
            $scope.stayDatesClicked = function () {
                var fromState = $state.current.name;
                // If we are already in state for calendar/rooms&rates,
                // then we only need to switch the vuew type to calendar


                $state.go(roomAndRatesState, {
                    from_date: $scope.reservationData.arrivalDate,
                    to_date: $scope.reservationData.departureDate,
                    view: "DEFAULT",
                    fromState: fromState,
                    company_id: $scope.reservationData.company.id,
                    travel_agent_id: $scope.reservationData.travelAgent.id,
                    group_id: $scope.reservationData.group.id
                });
            };

            $scope.$on("guestEmailChanged", function (e) {
                $scope.$broadcast('updateGuestEmail');
            });

            /**
             *   Validation conditions
             *
             *   Either adults or children can be 0,
             *   but one of them will have to have a value other than 0.
             *
             *   Infants should be excluded from this validation.
             */
            $scope.validateOccupant = function (room, from) {

                // just in case
                if (!room) {
                    return;
                }

                var numAdults = parseInt(room.numAdults),
                    numChildren = parseInt(room.numChildren);

                if ((from === 'adult' || from === "numAdults") && numAdults === 0 && numChildren === 0) {
                    room.numChildren = 1;
                } else if ((from === 'children' || from === "numChildren") && numChildren === 0 && numAdults === 0) {
                    room.numAdults = 1;
                }
            };

            $scope.initReservationData();

            $scope.$on('REFRESHACCORDIAN', function () {
                $scope.$broadcast('GETREFRESHACCORDIAN');
            });

            $scope.$on('PROMPTCARD', function () {
                $scope.$broadcast('PROMPTCARDENTRY');
            });

            /**
             *   We have moved the fetching of 'baseData' form 'rover.reservation' state
             *   to the states where it actually requires it.
             *
             *   Now we do want to bind the baseData so we have created a 'callFromChildCtrl' method here.
             *
             *   Once that state controller fetch 'baseData', it will find this controller
             *   by climbing the $socpe.$parent ladder and will call this method.
             */
            $scope.callFromChildCtrl = function (baseData) {
                // update these datas.
                $scope.otherData.marketsEnabled = baseData.demographics.is_use_markets;
                $scope.otherData.markets = baseData.demographics.markets;
                $scope.otherData.sourcesEnabled = baseData.demographics.is_use_sources;
                $scope.otherData.sources = baseData.demographics.sources;
                $scope.otherData.originsEnabled = baseData.demographics.is_use_origins;
                $scope.otherData.origins = baseData.demographics.origins;
                $scope.otherData.reservationTypes = baseData.demographics.reservationTypes;
                // call this. no sure how we can pass date from here
                //
                $scope.otherData.segmentsEnabled = baseData.demographics.is_use_segments;
                $scope.otherData.segments = baseData.demographics.segments;
            };

            var openRateAdjustmentPopup = function openRateAdjustmentPopup(room, index, lastReason) {
                var arrivalDate = tzIndependentDate(Object.keys(room.stayDates)[0]),
                    businessDate = tzIndependentDate($rootScope.businessDate),
                    showDate = Object.keys(room.stayDates)[0];

                if (arrivalDate < businessDate) {
                    showDate = $rootScope.businessDate;
                }

                var popUpData = JSON.stringify({
                    room: room,
                    index: index,
                    lastReason: lastReason,
                    showDate: showDate
                });

                // Checks if two dates are equal
                $scope.isDateEqual = function (date1, date2) {
                    return Date.parse(date1) === Date.parse(date2);
                };

                // Get object length based on no of keys
                $scope.getObjectLength = function (obj) {
                    return getObjectLength(obj);
                };

                ngDialog.open({
                    template: '/assets/partials/reservation/rvEditRates.html',
                    className: 'ngdialog-theme-default',
                    scope: $scope,
                    closeByDocument: false,
                    controller: 'RVEditRatesCtrl',
                    closeByEscape: false,
                    data: popUpData
                });
            };

            /**
             * success callback of fetch last rate adjustment reason
             * @return undefined
             */
            var successCallBackOffetchLastRateAdjustReason = function successCallBackOffetchLastRateAdjustReason(data, successcallbackParams) {
                var room = successcallbackParams.room,
                    index = successcallbackParams.index,
                    reason = data.reason;

                openRateAdjustmentPopup(room, index, reason);
            };

            /**
             * we need to show last rate adjustment reason in the popup of rate adjustment
             * @return undefined
             */
            var fetchLastRateAdjustReason = function fetchLastRateAdjustReason(room, index) {
                var params = {
                    reservation_id: $scope.reservationData.reservationId
                };

                var options = {
                    params: params,
                    successCallBack: successCallBackOffetchLastRateAdjustReason,
                    successCallBackParameters: {
                        room: room,
                        index: index
                    }
                };

                $scope.callAPI(RVReservationCardSrv.getLastRateAdjustmentReason, options);
            };

            $scope.editReservationRates = function (room, index) {
                // as per CICO-14354, we need to show the last rate adjustment in comment textbox,
                // so fetching that, we will show the popup in successcallback
                fetchLastRateAdjustReason(room, index);
            };

            var setPaymentData = function setPaymentData(skipPaymentData, data) {
                if (!skipPaymentData) {
                    data.payment_type = {};
                    if ($scope.reservationData.paymentType.type.value !== null) {
                        angular.forEach($scope.reservationData.paymentMethods, function (item, index) {
                            if ($scope.reservationData.paymentType.type.value === item.name) {
                                if ($scope.reservationData.paymentType.type.value === "CC") {
                                    data.payment_type.payment_method_id = $scope.reservationData.selectedPaymentId;
                                } else {
                                    data.payment_type.type_id = item.id;
                                }
                            }
                        });
                        data.payment_type.expiry_date = $scope.reservationData.paymentType.ccDetails.expYear === "" || $scope.reservationData.paymentType.ccDetails.expYear === "" ? "" : "20" + $scope.reservationData.paymentType.ccDetails.expYear + "-" + $scope.reservationData.paymentType.ccDetails.expMonth + "-01";
                        data.payment_type.card_name = $scope.reservationData.paymentType.ccDetails.nameOnCard;
                    }
                }
            },
                setConfirmationEmailData = function setConfirmationEmailData(skipConfirmationEmails, data) {
                if (!skipConfirmationEmails) {
                    data.confirmation_emails = [];
                    if ($scope.otherData.isGuestPrimaryEmailChecked && $scope.reservationData.guest.email !== "") {
                        data.confirmation_emails.push($scope.reservationData.guest.email);
                    }
                    if ($scope.otherData.isGuestAdditionalEmailChecked && $scope.otherData.additionalEmail !== "") {
                        data.confirmation_emails.push($scope.otherData.additionalEmail);
                    }
                }
            },
                setCcTaAllotmentGroupDetails = function setCcTaAllotmentGroupDetails(data) {
                data.company_id = $scope.reservationData.company.id || $scope.reservationData.group.company || $scope.reservationData.allotment.company;
                data.travel_agent_id = $scope.reservationData.travelAgent.id || $scope.reservationData.group.travelAgent || $scope.reservationData.allotment.travelAgent;
                // CICO-65314 - Should pass the group id only when the user choose the group rate from the recommended tab
                // If the user selects a rate from the rates tab, it should be created as a normal reservation
                if (RVRoomRatesSrv.getRoomAndRateActiveTab() !== 'RATE') {
                    data.group_id = $scope.reservationData.group.id;
                }

                data.allotment_id = $scope.reservationData.allotment.id;
            },
                setDemoGraphicsInfo = function setDemoGraphicsInfo(data, demographicsData) {
                data.reservation_type_id = parseInt(demographicsData.reservationType);
                data.source_id = parseInt(demographicsData.source);
                data.market_segment_id = parseInt(demographicsData.market);
                data.booking_origin_id = parseInt(demographicsData.origin);
                data.segment_id = parseInt(demographicsData.segment);
            },
                setRoomTypes = function setRoomTypes(data, shouldWeIncludeRoomTypeArray) {
                angular.forEach($scope.reservationData.tabs, function (tab, tabIndex) {
                    // addons
                    var firstIndex = _.indexOf($scope.reservationData.rooms, _.findWhere($scope.reservationData.rooms, {
                        roomTypeId: parseInt(tab.roomTypeId, 10)
                    })),
                        addonsForRoomType = [];

                    if (!!RVReservationStateService.getReservationFlag('RATE_CHANGED') || !$scope.reservationData.rooms[firstIndex].is_package_exist || // is_package_exist flag is set only while editing a reservation! -- Changes for CICO-17173
                    $scope.reservationData.rooms[firstIndex].is_package_exist && $scope.reservationData.rooms[firstIndex].addons.length === parseInt($scope.reservationData.rooms[firstIndex].package_count)) {
                        // -- Changes for CICO-17173
                        if (tabIndex === $scope.reservationData.tabs.length - 1) {
                            RVReservationStateService.setReservationFlag('RATE_CHANGED', false);
                        }
                        _.each($scope.reservationData.rooms[firstIndex].addons, function (addon) {
                            // skip rate associated addons on create/update calls --> they will be taken care off by API
                            if (!addon.is_rate_addon) {
                                addonsForRoomType.push({
                                    id: addon.id,
                                    selected_post_days: addon.selected_post_days,
                                    start_date: addon.start_date,
                                    end_date: addon.end_date,
                                    quantity: addon.quantity || 1
                                });
                            }
                        });
                    }
                    if (shouldWeIncludeRoomTypeArray) {
                        data.room_types.push({
                            id: parseInt(tab.roomTypeId, 10),
                            num_rooms: parseInt(tab.roomCount, 10),
                            addons: addonsForRoomType
                        });
                    }
                });
            },
                setRoomInfo = function setRoomInfo(data, roomIndex) {
                data.room_id = [];

                angular.forEach($scope.reservationData.rooms, function (room, currentRoomIndex) {
                    if (typeof roomIndex === 'undefined' || currentRoomIndex === roomIndex) {
                        // CICO-32021 - API expects null if room id not there.
                        room.room_id = room.room_id !== "" ? room.room_id : null;
                        data.room_id.push(room.room_id);
                    }
                });
            },
                getDuplicateRateId = function getDuplicateRateId(currentRoom, arrivalDate) {
                var rateId = "";

                if (currentRoom.stayDates && arrivalDate) {
                    rateId = currentRoom.stayDates[arrivalDate].rate.id;
                }
                return rateId;
            },
                setReservationStayDateDetails = function setReservationStayDateDetails(data, currentRoom) {
                var reservationStayDetails = [],
                    roomTypeId = '';

                _.each(currentRoom.stayDates, function (staydetailInfo, date) {

                    // CICO-59948 For inhouse reservation, set room type id to that of the current stay dates
                    if ($scope.reservationData.inHouse) {
                        roomTypeId = staydetailInfo.roomTypeId || '';
                    } else {
                        roomTypeId = currentRoom.roomTypeId;
                    }

                    var stayDetails = staydetailInfo;
                    var rateId = String(stayDetails.rate.id).match(/_CUSTOM_/) ? null : stayDetails.rate.id;

                    rateId = rateId === "" ? getDuplicateRateId(currentRoom, data.arrival_date) : rateId;
                    reservationStayDetails.push({
                        date: date,
                        // in case of custom rates (rates without IDs send them as null.... the named ids used within the UI controllers are just for tracking and arent saved)
                        rate_id: rateId,
                        room_type_id: roomTypeId,
                        room_id: $scope.reservationData.inHouse ? staydetailInfo.roomId : currentRoom.room_id,
                        adults_count: parseInt(stayDetails.guests.adults),
                        children_count: parseInt(stayDetails.guests.children),
                        infants_count: parseInt(stayDetails.guests.infants),
                        rate_amount: parseFloat(stayDetails.rateDetails && stayDetails.rateDetails.modified_amount || 0),
                        contract_id: rateId === null ? null : stayDetails.contractId
                    });
                });

                // For inhouse reservation, setting departure date data to that of the previous date
                if ($scope.reservationData.inHouse) {
                    var departureDate = reservationStayDetails[reservationStayDetails.length - 1].date;

                    reservationStayDetails[reservationStayDetails.length - 1] = JSON.parse(JSON.stringify(reservationStayDetails[reservationStayDetails.length - 2]));
                    reservationStayDetails[reservationStayDetails.length - 1].date = departureDate;
                }

                return reservationStayDetails;
            },
                setPromotionDetails = function setPromotionDetails(data, roomIndex, applicableRate) {
                if ($scope.reservationData.rateDetails && $scope.reservationData.rateDetails[roomIndex] && $scope.reservationData.rateDetails[roomIndex][$scope.reservationData.arrivalDate][applicableRate] && $scope.reservationData.rateDetails[roomIndex][$scope.reservationData.arrivalDate][applicableRate].applyPromotion) {
                    data.promotion_id = $scope.reservationData.rateDetails[roomIndex][$scope.reservationData.arrivalDate][applicableRate].appliedPromotion.id;
                    data.promotion_status = !!_.findWhere($scope.reservationData.rateDetails[roomIndex][$scope.reservationData.arrivalDate][applicableRate].restrictions, {
                        key: 'INVALID_PROMO'
                    }) ? 'OVERRIDE' : 'VALID';
                } else {
                    data.promotion_id = $scope.reservationData.promotionId;
                }
            };

            // Populate the reservation update request with required fields
            $scope.getReservationDataforUpdate = function (skipPaymentData, skipConfirmationEmails, roomIndex) {
                var data = {},
                    isCurrentlyInStayCard = $state.current.name === "rover.reservation.staycard.reservationcard.reservationdetails",
                    shouldWeIncludeRoomTypeArray = !isCurrentlyInStayCard && !$scope.reservationData.isHourly;

                data.is_hourly = $scope.reservationData.isHourly;
                data.arrival_date = $scope.reservationData.arrivalDate;
                data.arrival_time = '';
                data.is_reinstate = $scope.viewState.identifier === "REINSTATE";
                // Check if the check-in time is set by the user. If yes, format it to the 24hr format and build the API data.
                if ($scope.reservationData.checkinTime.hh !== '' && $scope.reservationData.checkinTime.mm !== '' && $scope.reservationData.checkinTime.ampm !== '') {
                    data.arrival_time = getTimeFormated($scope.reservationData.checkinTime.hh, $scope.reservationData.checkinTime.mm, $scope.reservationData.checkinTime.ampm);
                }
                data.departure_date = $scope.reservationData.departureDate;
                data.departure_time = '';
                // Check if the checkout time is set by the user. If yes, format it to the 24hr format and build the API data.
                if ($scope.reservationData.checkoutTime.hh !== '' && $scope.reservationData.checkoutTime.mm !== '' && $scope.reservationData.checkoutTime.ampm !== '') {
                    data.departure_time = getTimeFormated($scope.reservationData.checkoutTime.hh, $scope.reservationData.checkoutTime.mm, $scope.reservationData.checkoutTime.ampm);
                }

                data.adults_count = parseInt($scope.reservationData.rooms[roomIndex].numAdults);
                data.children_count = parseInt($scope.reservationData.rooms[roomIndex].numChildren);
                data.infants_count = parseInt($scope.reservationData.rooms[roomIndex].numInfants);

                // CICO - 8320 Rate to be handled in room level
                data.room_type_id = parseInt($scope.reservationData.rooms[roomIndex].roomTypeId);
                // Guest details
                data.guest_detail = {};
                // Send null if no guest card is attached, empty string causes server internal error
                data.guest_detail.id = $scope.reservationData.guest.id === "" ? null : $scope.reservationData.guest.id;
                // New API changes
                data.guest_detail_id = data.guest_detail.id;
                data.guest_detail.first_name = $scope.reservationData.guest.firstName;
                data.guest_detail.last_name = $scope.reservationData.guest.lastName;
                data.guest_detail.email = $scope.reservationData.guest.email;

                setPaymentData(skipPaymentData, data);

                // CICO-7077 Confirmation Mail to have tax details

                data.tax_details = [];
                _.each($scope.reservationData.taxDetails, function (taxDetail) {
                    data.tax_details.push(taxDetail);
                });

                data.tax_total = $scope.reservationData.totalTaxAmount;

                // guest emails to which confirmation emails should send

                setConfirmationEmailData(skipConfirmationEmails, data);

                //  CICO-8320
                //  The API request payload changes
                var stay = [];

                data.room_id = [];

                var currentRoom = $scope.reservationData.rooms[roomIndex];

                var applicableRate = currentRoom.stayDates[$scope.reservationData.arrivalDate].rate.id;

                setPromotionDetails(data, roomIndex, applicableRate);

                RVReservationStateService.bookMark.lastPostedRate = currentRoom.stayDates[$scope.reservationData.arrivalDate].rate.id;

                stay.push(setReservationStayDateDetails(data, currentRoom));

                //  end of payload changes
                data.stay_dates = stay;

                setCcTaAllotmentGroupDetails(data);

                // DEMOGRAPHICS
                var demographicsData = $scope.reservationData.demographics;

                if (typeof roomIndex !== 'undefined') {
                    demographicsData = $scope.reservationData.rooms[roomIndex].demographics;
                }

                // CICO-11755
                if ((typeof demographicsData === "undefined" ? "undefined" : _typeof(demographicsData)) !== undefined) {
                    setDemoGraphicsInfo(data, demographicsData);
                }

                data.confirmation_email = $scope.reservationData.guest.sendConfirmMailTo;
                data.room_id = [];
                if (shouldWeIncludeRoomTypeArray) {
                    data.room_types = [];
                }
                setRoomTypes(data, shouldWeIncludeRoomTypeArray);
                setRoomInfo(data, roomIndex);

                // This senario is currently discharged for now, may be in future
                // 'is_outside_group_stay_dates' will always be sent as 'false' from server
                // data.outside_group_stay_dates = RVReservationStateService.getReservationFlag('outsideStaydatesForGroup');

                data.borrow_for_groups = RVReservationStateService.getReservationFlag('borrowForGroups');

                // to delete ends here
                return data;
            };

            $scope.computeReservationDataforUpdate = function (skipPaymentData, skipConfirmationEmails, roomIndex) {
                var data = {},
                    isInStayCard = $state.current.name === "rover.reservation.staycard.reservationcard.reservationdetails",
                    shouldWeIncludeRoomTypeArray = !isInStayCard && typeof roomIndex === 'undefined';

                data.is_hourly = $scope.reservationData.isHourly;
                data.arrival_date = $scope.reservationData.arrivalDate;
                data.arrival_time = '';
                data.is_reinstate = $scope.viewState.identifier === "REINSTATE";
                // Check if the check-in time is set by the user. If yes, format it to the 24hr format and build the API data.
                if ($scope.reservationData.checkinTime.hh !== '' && $scope.reservationData.checkinTime.mm !== '' && $scope.reservationData.checkinTime.ampm !== '') {
                    data.arrival_time = getTimeFormated($scope.reservationData.checkinTime.hh, $scope.reservationData.checkinTime.mm, $scope.reservationData.checkinTime.ampm);
                }
                data.departure_date = $scope.reservationData.departureDate;
                data.departure_time = '';
                // Check if the checkout time is set by the user. If yes, format it to the 24hr format and build the API data.
                if ($scope.reservationData.checkoutTime.hh !== '' && $scope.reservationData.checkoutTime.mm !== '' && $scope.reservationData.checkoutTime.ampm !== '') {
                    data.departure_time = getTimeFormated($scope.reservationData.checkoutTime.hh, $scope.reservationData.checkoutTime.mm, $scope.reservationData.checkoutTime.ampm);
                }

                data.adults_count = parseInt($scope.reservationData.rooms[0].numAdults);
                data.children_count = parseInt($scope.reservationData.rooms[0].numChildren);
                data.infants_count = parseInt($scope.reservationData.rooms[0].numInfants);
                // CICO - 8320 Rate to be handled in room level
                data.room_type_id = parseInt($scope.reservationData.rooms[0].roomTypeId);
                // Guest details
                data.guest_detail = {};
                // Send null if no guest card is attached, empty string causes server internal error
                data.guest_detail.id = $scope.reservationData.guest.id === "" ? null : $scope.reservationData.guest.id;
                // New API changes
                data.guest_detail_id = data.guest_detail.id;
                data.guest_detail.first_name = $scope.reservationData.guest.firstName;
                data.guest_detail.last_name = $scope.reservationData.guest.lastName;
                data.guest_detail.email = $scope.reservationData.guest.email;

                setPaymentData(skipPaymentData, data);

                // CICO-7077 Confirmation Mail to have tax details
                data.tax_details = [];
                _.each($scope.reservationData.taxDetails, function (taxDetail) {
                    data.tax_details.push(taxDetail);
                });

                data.tax_total = $scope.reservationData.totalTaxAmount;

                // guest emails to which confirmation emails should send
                setConfirmationEmailData(skipConfirmationEmails, data);

                //  CICO-8320
                //  The API request payload changes
                var stay = [];

                data.room_id = [];
                _.each($scope.reservationData.rooms, function (room, currentRoomIndex) {
                    var applicableRate = room.stayDates[$scope.reservationData.arrivalDate].rate.id;

                    setPromotionDetails(data, currentRoomIndex, applicableRate);

                    RVReservationStateService.bookMark.lastPostedRate = room.stayDates[$scope.reservationData.arrivalDate].rate.id;

                    if (typeof roomIndex === 'undefined' || currentRoomIndex === roomIndex) {
                        stay.push(setReservationStayDateDetails(data, room));
                    }
                });
                //  end of payload changes
                data.stay_dates = stay;

                setCcTaAllotmentGroupDetails(data);

                // DEMOGRAPHICS
                var demographicsData = $scope.reservationData.demographics;

                if (typeof roomIndex !== 'undefined') {
                    demographicsData = $scope.reservationData.rooms[roomIndex].demographics;
                }

                // CICO-11755
                if ((typeof demographicsData === "undefined" ? "undefined" : _typeof(demographicsData)) !== undefined) {
                    setDemoGraphicsInfo(data, demographicsData);
                }

                data.confirmation_email = $scope.reservationData.guest.sendConfirmMailTo;
                data.room_id = [];
                if (shouldWeIncludeRoomTypeArray) {
                    data.room_types = [];
                }

                if ($scope.reservationData.hasOwnProperty('has_reason')) {
                    data.has_reason = $scope.reservationData.has_reason;
                }

                setRoomTypes(data, shouldWeIncludeRoomTypeArray);
                setRoomInfo(data, roomIndex);

                // This senario is currently discharged for now, may be in future
                // 'is_outside_group_stay_dates' will always be sent as 'false' from server
                // data.outside_group_stay_dates = RVReservationStateService.getReservationFlag('outsideStaydatesForGroup');

                data.borrow_for_groups = RVReservationStateService.getReservationFlag('borrowForGroups');
                // CICO-71977 - while borrowing from house in the case of a group reservation, we have set this flag
                data.forcefully_overbook = RVReservationStateService.getForceOverbookForGroup();
                RVReservationStateService.setForceOverbookFlagForGroup(false);
                // to delete ends here
                return data;
            };

            var cancellationCharge = 0;
            var nights = false;
            var depositAmount = 0;

            $scope.creditCardTypes = [];
            $scope.paymentTypes = [];

            var promptCancel = function promptCancel(penalty, nights) {
                var openCancelPopup = function openCancelPopup(data) {
                    $scope.languageData = data;
                    $scope.DailogeState = {};
                    $scope.DailogeState.isGuestEmailSelected = false;
                    $scope.DailogeState.guestEmail = $scope.guestCardData.contactInfo.email;
                    $scope.DailogeState.sendConfirmatonMailTo = '';

                    var passData = {
                        "reservationId": $scope.reservationData.reservationId,
                        "details": {
                            "firstName": $scope.guestCardData.contactInfo.first_name,
                            "lastName": $scope.guestCardData.contactInfo.last_name,
                            "creditCardTypes": $scope.creditCardTypes,
                            "paymentTypes": $scope.paymentTypes
                        }
                    };

                    $scope.passData = passData;
                    ngDialog.open({
                        template: '/assets/partials/reservationCard/rvCancelReservation.html',
                        controller: 'RVCancelReservation',
                        scope: $scope,
                        data: JSON.stringify({
                            state: 'CONFIRM',
                            cards: false,
                            penalty: penalty,
                            penaltyText: function () {
                                if (nights) {
                                    return penalty + (penalty > 1 ? " nights" : " night");
                                } else {
                                    return $rootScope.currencySymbol + $filter('number')(penalty, 2);
                                }
                            }()
                        })
                    });
                };

                var successCallback = function successCallback(data) {
                    $scope.$emit('hideLoader');
                    $scope.paymentTypes = data;
                    data.forEach(function (item) {
                        if (item.name === 'CC') {
                            $scope.creditCardTypes = item.values;
                        }
                    });

                    var params = { 'reservation_id': $scope.reservationData.reservationId },
                        options = {
                        params: params,
                        successCallBack: openCancelPopup
                    };

                    // Fetch Laungage data for cancellation
                    $scope.callAPI(RVContactInfoSrv.fetchGuestLanguages, options);
                };

                $scope.invokeApi(RVPaymentSrv.renderPaymentScreen, "", successCallback);
            };

            $scope.cancelReservation = function () {
                var checkCancellationPolicy = function checkCancellationPolicy() {
                    var onCancellationDetailsFetchSuccess = function onCancellationDetailsFetchSuccess(data) {
                        $scope.$emit('hideLoader');

                        // Sample Response from api/reservations/:id/policies inside the results hash
                        // calculated_penalty_amount: 40


                        depositAmount = data.results.deposit_amount;
                        var isOutOfCancellationPeriod = !data.results.is_inside_cancellation_period;

                        if (isOutOfCancellationPeriod) {
                            if (data.results.penalty_type === 'day') {
                                // To get the duration of stay
                                var stayDuration = $scope.reservationData.numNights > 0 ? $scope.reservationData.numNights : 1;
                                // Make sure that the cancellation value is -lte thatn the total duration

                                cancellationCharge = stayDuration > data.results.penalty_value ? data.results.penalty_value : stayDuration;
                                nights = true;
                            } else {
                                cancellationCharge = parseFloat(data.results.calculated_penalty_amount);
                            }
                            if (parseInt(depositAmount) > 0) {
                                showDepositPopup(depositAmount, isOutOfCancellationPeriod, cancellationCharge);
                            } else {
                                promptCancel(cancellationCharge, nights);
                            }
                        } else {
                            if (parseInt(depositAmount) > 0) {
                                showDepositPopup(depositAmount, isOutOfCancellationPeriod, '');
                            } else {
                                promptCancel('', nights);
                            }
                        }
                    };
                    var onCancellationDetailsFetchFailure = function onCancellationDetailsFetchFailure(error) {
                        $scope.$emit('hideLoader');
                        $scope.errorMessage = error;
                    };

                    var params = {
                        id: $scope.reservationData.reservationId
                    };

                    $scope.invokeApi(RVReservationCardSrv.fetchCancellationPolicies, params, onCancellationDetailsFetchSuccess, onCancellationDetailsFetchFailure);
                };

                /**
                 * If the reservation is within cancellation period, no action will take place.
                 * If the reservation is outside of the cancellation period, a screen will display to show the cancellation rule.
                 * [Cancellation period is the date and time set up in the cancellation rule]
                 */

                checkCancellationPolicy();
            };

            var showDepositPopup = function showDepositPopup(deposit, isOutOfCancellationPeriod, penalty) {
                var params = { 'reservation_id': $scope.reservationData.reservationId },
                    openDepositPopup = function openDepositPopup(data) {
                    $scope.languageData = data;

                    $scope.DailogeState = {};
                    $scope.DailogeState.successMessage = '';
                    $scope.DailogeState.failureMessage = '';
                    $scope.DailogeState.isGuestEmailSelected = false;
                    $scope.DailogeState.guestEmail = $scope.guestCardData.contactInfo.email;
                    $scope.DailogeState.sendConfirmatonMailTo = '';
                    ngDialog.open({
                        template: '/assets/partials/reservationCard/rvCancelReservationDeposits.html',
                        controller: 'RVCancelReservationDepositController',
                        scope: $scope,
                        data: JSON.stringify({
                            state: 'CONFIRM',
                            cards: false,
                            penalty: penalty,
                            deposit: deposit,
                            depositText: function () {
                                if (!isOutOfCancellationPeriod) {
                                    return "Within Cancellation Period. Deposit of " + $rootScope.currencySymbol + $filter('number')(deposit, 2) + " is refundable.";
                                } else {
                                    return "Reservation outside of cancellation period. A cancellation fee of " + $rootScope.currencySymbol + $filter('number')(penalty, 2) + " will be charged, deposit not refundable";
                                }
                            }()
                        })
                    });
                },
                    options = {
                    params: params,
                    successCallBack: openDepositPopup
                };

                // Fetch Laungage data for cancellation
                $scope.callAPI(RVContactInfoSrv.fetchGuestLanguages, options);
            };

            var nextState = '';
            var nextStateParameters = '';

            this.showConfirmRoutingPopup = function (type, id) {
                $timeout(function () {
                    ngDialog.open({
                        template: '/assets/partials/reservation/alerts/rvBillingInfoConfirmPopup.html',
                        className: 'ngdialog-theme-default',
                        scope: $scope
                    });
                }, 1000);
            };

            this.showConflictingRoutingPopup = function (type, id) {
                $timeout(function () {
                    ngDialog.open({
                        template: '/assets/partials/reservation/alerts/rvBillingInfoConflictingPopup.html',
                        className: 'ngdialog-theme-default',
                        scope: $scope
                    });
                }, 1000);
            };

            this.hasTravelAgent = function () {
                hasTravelAgent = false;
                if ($scope.reservationData.travelAgent.id !== null && $scope.reservationData.travelAgent.id !== undefined) {
                    hasTravelAgent = true;
                }
                return hasTravelAgent;
            };

            this.hasCompanyCard = function () {
                hasCompanyCard = false;
                if ($scope.reservationData.company.id !== null && $scope.reservationData.company.id !== undefined) {
                    hasCompanyCard = true;
                }
                return hasCompanyCard;
            };

            $scope.applyRoutingToReservation = function () {
                var routingApplySuccess = function routingApplySuccess(data) {
                    $scope.$emit("hideLoader");
                    $scope.$broadcast('BILLINGINFOADDED');
                    ngDialog.close();

                    if ($scope.contractRoutingType === 'TRAVEL_AGENT' && that.hasCompanyCard() && $scope.routingInfo.company.routings_count > 0) {

                        $scope.contractRoutingType = "COMPANY";
                        that.showConfirmRoutingPopup($scope.contractRoutingType, $scope.reservationData.company.id);
                        return false;
                    }
                    /*
                     *Proceed with reservation creation flow
                     */
                };

                var params = {};

                params.account_id = $scope.contractRoutingType === 'TRAVEL_AGENT' ? $scope.reservationData.travelAgent.id : $scope.reservationData.company.id;
                params.reservation_ids = [];
                for (var i in $scope.reservationData.reservations) {
                    params.reservation_ids.push($scope.reservationData.reservations[i].id);
                }
                $scope.invokeApi(RVReservationSummarySrv.applyDefaultRoutingToReservation, params, routingApplySuccess);
            };

            $scope.noRoutingToReservation = function () {
                ngDialog.close();

                if ($scope.contractRoutingType === 'TRAVEL_AGENT' && that.hasCompanyCard() && $scope.routingInfo.company.routings_count > 0) {

                    $scope.contractRoutingType = "COMPANY";
                    that.showConfirmRoutingPopup($scope.contractRoutingType, $scope.reservationData.company.id);
                    return false;
                }
                /*
                 *Proceed with reservation creation flow
                 */
            };

            $scope.okClickedForConflictingRoutes = function () {
                ngDialog.close();
            };

            this.attachCompanyTACardRoutings = function () {
                // CICO-20161
                /**
                 * In this case there does not need to be any prompt for Rate or Billing Information to copy,
                 * since all primary reservation information should come from the group itself.
                 */
                if (!!$scope.reservationData.group.id || !!$scope.reservationData.allotment.id) {
                    return false;
                }

                var fetchSuccessofDefaultRouting = function fetchSuccessofDefaultRouting(data) {
                    $scope.$emit("hideLoader");
                    $scope.routingInfo = data;
                    if (data.has_conflicting_routes) {
                        $scope.conflict_cards = [];
                        if (that.hasTravelAgent() && data.travel_agent.routings_count > 0) {
                            $scope.conflict_cards.push($scope.reservationData.travelAgent.name);
                        }
                        if (that.hasCompanyCard() && data.company.routings_count > 0) {
                            $scope.conflict_cards.push($scope.reservationData.company.name);
                        }

                        that.showConflictingRoutingPopup();

                        return false;
                    }

                    if (that.hasTravelAgent() && data.travel_agent.routings_count > 0) {
                        $scope.contractRoutingType = "TRAVEL_AGENT";
                        that.showConfirmRoutingPopup($scope.contractRoutingType, $scope.reservationData.travelAgent.id);
                        return false;
                    }
                    if (that.hasCompanyCard() && data.company.routings_count > 0) {
                        $scope.contractRoutingType = "COMPANY";
                        that.showConfirmRoutingPopup($scope.contractRoutingType, $scope.reservationData.company.id);
                        return false;
                    }
                };

                if (that.hasTravelAgent() || that.hasCompanyCard()) {
                    var params = {};

                    params.reservation_id = $scope.reservationData.reservationId;
                    params.travel_agent_id = $scope.reservationData.travelAgent.id;
                    params.company_id = $scope.reservationData.company.id;
                    $scope.invokeApi(RVReservationSummarySrv.fetchDefaultRoutingInfo, params, fetchSuccessofDefaultRouting);
                }
            };

            var updateConfirmationData = function updateConfirmationData(key, reservation) {
                var successCallBackOfGetConfirmationData = function successCallBackOfGetConfirmationData(response) {

                    var targetObject = {
                        "numAdults": response.data.stay_dates[0].adult_count,
                        "numChildren": response.data.stay_dates[0].child_count,
                        "numInfants": response.data.stay_dates[0].infant_count,
                        "rateAvg": response.data.rate_per_night,
                        "rateTotal": response.data.total_rate,
                        "taxInformation": response.data.tax_details,
                        "addons": response.data.addons,
                        "total_stay_cost": response.data.total_stay_cost,
                        "total_tax": response.data.total_tax
                    };

                    $scope.reservationData.rooms[key] = Object.assign($scope.reservationData.rooms[key], targetObject);
                    $scope.reservationData.totalStayCost = _.reduce($scope.reservationData.rooms, function (memo, roomData) {
                        return parseFloat(memo) + parseFloat(roomData.total_stay_cost);
                    }, 0);
                    $scope.reservationData.totalTax = _.reduce($scope.reservationData.rooms, function (memo, roomData) {
                        return memo + roomData.total_tax;
                    }, 0);

                    $scope.$broadcast("REFRESH_SCROLL_SUMMARY");
                },
                    params = {
                    reservation_id: reservation.id
                };

                var options = {
                    params: params,
                    successCallBack: successCallBackOfGetConfirmationData
                };

                $scope.callAPI(RVReservationCardSrv.getConfirmationData, options);
            };

            $rootScope.$on("allowanceNotConsume", function () {
                is_day_use_check_required = false;
                $scope.saveReservation();
            });

            $rootScope.$on("goBackToRoomAndRates", function () {
                $state.go(roomAndRatesState, $rootScope.setPrevState.param);
            });

            $scope.saveReservation = function (navigateTo, stateParameters, index) {
                $scope.$emit('showLoader');
                nextState = navigateTo;
                nextStateParameters = stateParameters;
                /**
                 * CICO-10321
                 * Move check for guest / company / ta card attached to the screen before the reservation summary screen.
                 * This may either be the rooms and rates screen or the Add on screen when turned on.
                 */
                if (!$scope.reservationData.guest.id && !$scope.reservationData.company.id && !$scope.reservationData.travelAgent.id && !$scope.reservationData.group.id && !$scope.reservationData.allotment.id) {
                    $scope.$emit('PROMPTCARD');
                } else {
                    /**
                     * CICO-10321
                     * 3. Once hitting the BOOK button and cards have been attached, issue the confirmation number and move to reservation summary screen
                     * NOTE :
                     *     Exisiting implementation : Confirmation number gets generated when the submit reservation button in the summary screen is clicked
                     */

                    var postData = $scope.computeReservationDataforUpdate(true, true);

                    if (is_day_use_check_required) {
                        postData.is_day_use_check_required = true;
                    } else {
                        postData.is_day_use_check_required = false;
                    }

                    var saveSuccess = function saveSuccess(data) {
                        $scope.closeDialog();
                        // Update reservation type
                        $rootScope.$broadcast('UPDATERESERVATIONTYPE', data.reservations[0].reservation_type_id);
                        var totalDeposit = 0,
                            totalPaymentDeposit = 0;
                        // calculate sum of each reservation deposits

                        $scope.reservationsListArray = data;
                        var keyIndex = 0;

                        angular.forEach(data.reservations, function (reservation) {

                            totalDeposit = parseFloat(totalDeposit) + parseFloat(reservation.deposit_amount);
                            updateConfirmationData(keyIndex, reservation);
                            totalPaymentDeposit = parseFloat(totalPaymentDeposit) + parseFloat(reservation.deposit_payment_amount);
                            keyIndex++;
                        });

                        $scope.reservationData.depositAmount = parseFloat(totalDeposit).toFixed(2);
                        $scope.reservationData.depositPaymentAmount = parseFloat(totalPaymentDeposit).toFixed(2);
                        $scope.reservationData.depositEditable = data.allow_deposit_edit !== null && data.allow_deposit_edit ? true : false;
                        $scope.reservationData.isValidDeposit = parseInt($scope.reservationData.depositAmount) > 0;

                        if (typeof data.reservations !== 'undefined' && data.reservations instanceof Array) {
                            $scope.reservationData.reservationIds = [];
                            angular.forEach(data.reservations, function (reservation, key) {
                                $scope.reservationData.reservationIds.push(reservation.id);
                                if (!$scope.reservationData.isHourly) {
                                    $scope.reservationData.rooms[key].confirm_no = reservation.confirm_no; // For NIGHTLY the API is supposed to hand over the rooms in the same order as requested
                                } else {
                                    angular.forEach($scope.reservationData.rooms, function (room, key) {
                                        if (parseInt(reservation.room_id) === parseInt(room.room_id)) {
                                            room.confirm_no = reservation.confirm_no;
                                        }
                                    });
                                }
                            });
                            $scope.reservationData.reservations = data.reservations;
                            $scope.reservationData.reservationId = $scope.reservationData.reservations[0].id;
                            $scope.reservationData.confirmNum = $scope.reservationData.reservations[0].confirm_no;
                            $scope.reservationData.status = $scope.reservationData.reservations[0].status;
                            $scope.viewState.reservationStatus.number = $scope.reservationData.reservations[0].id;
                            $scope.reservationData.is_custom_text_per_reservation = $scope.reservationData.reservations[0].is_custom_text_per_reservation;
                        } else {
                            $scope.reservationData.reservationId = data.id;
                            $scope.reservationData.confirmNum = data.confirm_no;
                            $scope.reservationData.rooms[0].confirm_no = data.confirm_no;
                            $scope.reservationData.status = data.status;
                            $scope.viewState.reservationStatus.number = data.id;
                            $scope.reservationData.is_custom_text_per_reservation = data.is_custom_text_per_reservation;
                        }

                        /*
                         * TO DO:ends here
                         */

                        /*
                         * Comment out .if existing cards needed remove comments
                         */

                        $scope.successPaymentList = function (data) {
                            $scope.$emit("hideLoader");
                            $scope.cardsList = data.existing_payments;
                            angular.forEach($scope.cardsList, function (value, key) {
                                value.mli_token = value.ending_with; // For common payment HTML to work - Payment modifications story
                                value.card_expiry = value.expiry_date; // Same comment above
                            });
                        };

                        $scope.invokeApi(RVPaymentSrv.getPaymentList, $scope.reservationData.reservationId, $scope.successPaymentList);

                        $scope.viewState.reservationStatus.confirm = true;
                        $scope.reservationData.is_routing_available = false;
                        // Change mode to stay card as the reservation has been made!
                        $scope.viewState.identifier = "CONFIRM";

                        $scope.reservation = {
                            reservation_card: {}
                        };

                        $scope.reservation.reservation_card.arrival_date = $scope.reservationData.arrivalDate;
                        $scope.reservation.reservation_card.departure_date = $scope.reservationData.departureDate;

                        $scope.$broadcast('PROMPTCARDENTRY');

                        $scope.$emit('hideLoader');
                        that.attachCompanyTACardRoutings();

                        if (nextState) {
                            if (!nextStateParameters) {
                                nextStateParameters = {};
                            }
                            $state.go(nextState, nextStateParameters);
                        }
                    };

                    var saveFailure = function saveFailure(data) {
                        if (data.results && data.results.status === RESPONSE_STATUS_470 && data.results.is_borrowed) {
                            var results = data.results;

                            $scope.borrowData = {};

                            if (!results.room_overbooked && !results.house_overbooked) {
                                $scope.borrowData.isBorrowFromHouse = true;
                            }

                            if (results.room_overbooked && !results.house_overbooked) {
                                $scope.borrowData.shouldShowOverBookBtn = $scope.hasOverBookRoomTypePermission;
                                $scope.borrowData.isRoomTypeOverbooked = true;
                            } else if (!results.room_overbooked && results.house_overbooked) {
                                $scope.borrowData.shouldShowOverBookBtn = $scope.hasOverBookHousePermission;
                                $scope.borrowData.isHouseOverbooked = true;
                            } else if (results.room_overbooked && results.house_overbooked) {
                                $scope.borrowData.shouldShowOverBookBtn = $scope.hasOverBookRoomTypePermission && $scope.hasOverBookHousePermission;
                                $scope.borrowData.isHouseAndRoomTypeOverbooked = true;
                            }

                            ngDialog.open({
                                template: '/assets/partials/common/group/rvGroupBorrowPopup.html',
                                className: '',
                                closeByDocument: false,
                                closeByEscape: true,
                                scope: $scope
                            });
                        } else if (data.results && data.results.alert_user) {
                            ngDialog.open({
                                template: '/assets/partials/reservation/allowanceNotConsumableDialog.html',
                                controller: 'AllowanceNotConsumableDialogCtrl',
                                className: '',
                                closeByDocument: false,
                                closeByEscape: false,
                                scope: $scope,
                                data: { data: data.results, message: data.results.alert_message, isChangeStayDatesPage: false }
                            });
                        } else {
                            $scope.errorMessage = data;
                            $scope.$broadcast('FAILURE_SAVE_RESERVATION', data);
                        }

                        $scope.$emit('hideLoader');
                    };

                    // Close borrow popup
                    $scope.closeBorrowPopup = function (shouldClearData) {
                        if (shouldClearData) {
                            $scope.borrowData = {};
                        }
                        ngDialog.close();
                        $scope.$broadcast('SHOW_ROOM_AND_RATES_AFTER_BORROW_DECLINE');
                    };

                    // Handles the borrow action
                    $scope.performBorrowFromHouse = function () {
                        if ($scope.borrowData.isBorrowFromHouse) {
                            RVReservationStateService.setForceOverbookFlagForGroup(true);
                            $scope.$broadcast('CREATE_RESERVATION_AFTER_BORROW');
                            ngDialog.close();
                        } else {
                            ngDialog.close();
                            ngDialog.open({
                                template: '/assets/partials/common/group/rvGroupOverbookPopup.html',
                                className: '',
                                closeByDocument: false,
                                closeByEscape: true,
                                scope: $scope
                            });
                        }
                    };

                    // Closes the current borrow dialog
                    $scope.closeOverbookPopup = function () {
                        $scope.borrowData = {};
                        ngDialog.close();
                        $scope.$broadcast('SHOW_ROOM_AND_RATES_AFTER_BORROW_DECLINE');
                    };

                    // Perform overbook
                    $scope.performOverBook = function () {
                        RVReservationStateService.setForceOverbookFlagForGroup(true);
                        $scope.$broadcast('CREATE_RESERVATION_AFTER_BORROW');
                        ngDialog.close();
                    };

                    var updateFailure = function updateFailure(data) {
                        $scope.errorMessage = data;
                        $scope.$broadcast('FAILURE_UPDATE_RESERVATION', data);
                        $scope.$emit('hideLoader');
                    };

                    var updateSuccess = function updateSuccess(data) {
                        // CICO-47877 - When there are multiple reservations, we have an array of responses
                        var responseData = data;

                        data = _.isArray(data) ? data[0] : data;

                        var totalDepositOnRateUpdate = 0;

                        /**
                         * CICO-10195 : While extending a hourly reservation from
                         * diary the reservationListArray would be undefined
                         * Hence.. at this point as it is enough to just update
                         * reservation.deposit_amount
                         * totalDepositOnRateUpdate for just the single reservation.
                         */

                        if ($scope.reservationsListArray) {
                            var keyIndex = 0;

                            angular.forEach($scope.reservationsListArray.reservations, function (reservation, key) {
                                if (!index && !_.isNumber(index) || key === index) {
                                    reservation.deposit_amount = data.deposit_amount;
                                    totalDepositOnRateUpdate = parseFloat(totalDepositOnRateUpdate) + parseFloat(data.deposit_amount);
                                } else {
                                    totalDepositOnRateUpdate = parseFloat(totalDepositOnRateUpdate) + parseFloat(reservation.deposit_amount);
                                }

                                updateConfirmationData(keyIndex, reservation);
                                keyIndex++;
                            });
                        } else {
                            totalDepositOnRateUpdate = parseFloat(data.deposit_amount);
                        }

                        // CICO-47877
                        if (_.isArray(responseData)) {
                            totalDepositOnRateUpdate = 0;
                            _.each(responseData, function (reservationDetailsObj, idx) {
                                if ($scope.reservationsListArray.reservations[idx]) {
                                    $scope.reservationsListArray.reservations[idx].deposit_amount = reservationDetailsObj.deposit_amount;
                                }
                                totalDepositOnRateUpdate = parseFloat(totalDepositOnRateUpdate) + parseFloat(reservationDetailsObj.deposit_amount);
                            });
                        }

                        $scope.reservationData.depositAmount = parseFloat(totalDepositOnRateUpdate).toFixed(2);
                        $scope.reservationData.depositEditable = !!data.allow_deposit_edit;
                        $scope.reservationData.isValidDeposit = parseInt($scope.reservationData.depositAmount) > 0;
                        $scope.reservationData.fees_details = data.fees_details;

                        $scope.$broadcast('UPDATEFEE');
                        $scope.viewState.identifier = "UPDATED";
                        $scope.reservationData.is_routing_available = data.is_routing_available;

                        $scope.reservationData.status = data.reservation_status;

                        // resetting borrowForGroups anyway
                        RVReservationStateService.setReservationFlag('borrowForGroups', false);

                        if (nextState) {
                            if ($state.$current.name === nextState) {
                                $state.reload(nextState);
                            } else {
                                $state.go(nextState, nextStateParameters || {});
                            }
                        } else {
                            $scope.$emit('hideLoader');
                        }
                    };

                    if ($scope.reservationData.reservationId !== "" && $scope.reservationData.reservationId !== null && typeof $scope.reservationData.reservationId !== "undefined") {
                        if (typeof index !== 'undefined') {

                            // CICO-15795 : Fix by Shiju, UI team to review.
                            if ($scope.reservationsListArray) {
                                postData.reservationId = $scope.reservationsListArray.reservations[index].id;
                            } else {
                                postData.reservationId = $scope.reservationData.reservationId;
                            }

                            var roomId = postData.room_id[index];

                            postData.room_id = [];
                            postData.room_id.push(roomId);
                        } else {
                            postData.reservationId = $scope.reservationData.reservationId;
                        }

                        var promises = [];

                        // CICO-47877
                        if ($scope.reservationData.reservationIds && $scope.reservationData.reservationIds.length > 1) {
                            _.each($scope.reservationData.reservationIds, function (resId, index) {
                                var requestData = $scope.getReservationDataforUpdate(true, true, index);

                                requestData.reservationId = resId;
                                promises.push(RVReservationSummarySrv.updateReservation(requestData));
                            });

                            $q.all(promises).then(updateSuccess, updateFailure);
                        } else {
                            $scope.invokeApi(RVReservationSummarySrv.updateReservation, postData, updateSuccess, updateFailure);
                        }
                    } else {
                        // CICO-63737 : Set Arrival, dep time while booking.
                        if ($scope.reservationData.isFromNightlyDiary) {
                            postData.arrival_time = $scope.reservationData.tabs[0].checkinTime;
                            postData.departure_time = $scope.reservationData.tabs[0].checkoutTime;

                            var checkinTimeObj = rvUtilSrv.extractHhMmAmPm($scope.reservationData.tabs[0].checkinTime),
                                checkoutTimeObj = rvUtilSrv.extractHhMmAmPm($scope.reservationData.tabs[0].checkoutTime);

                            if (checkinTimeObj.hh === '00') {
                                checkinTimeObj.hh = '12';
                            }
                            if (checkoutTimeObj.hh === '00') {
                                checkoutTimeObj.hh = '12';
                            }

                            $scope.reservationData.checkinTime = checkinTimeObj;
                            $scope.reservationData.checkoutTime = checkoutTimeObj;
                            postData.room_type_id = $scope.reservationData.roomTypeIdFromNightlyDiary;
                            $log.log(postData);
                        }
                        $scope.invokeApi(RVReservationSummarySrv.saveReservation, postData, saveSuccess, saveFailure);
                    }
                    // CICO-16959 We use a flag to indicate if the reservation is extended outside staydate range for the group, if it is a group reservation. Resetting this flag after passing the flag to the API.
                    RVReservationStateService.setReservationFlag('outsideStaydatesForGroup', false);
                }
            };

            $scope.fetchDemoGraphics = function () {

                var fetchSuccess = function fetchSuccess(data) {
                    $scope.otherData.marketsEnabled = data.demographics.is_use_markets;
                    $scope.otherData.markets = data.demographics.markets;
                    $scope.otherData.sourcesEnabled = data.demographics.is_use_sources;
                    $scope.otherData.sources = data.demographics.sources;
                    $scope.otherData.originsEnabled = data.demographics.is_use_origins;
                    $scope.otherData.origins = data.demographics.origins;
                    $scope.otherData.reservationTypes = data.demographics.reservationTypes;
                    $scope.otherData.segmentsEnabled = data.demographics.is_use_segments;
                    $scope.otherData.segments = data.demographics.segments;
                    $scope.$emit('hideLoader');
                };
                var fetchFailure = function fetchFailure(data) {
                    $scope.errorMessage = data;
                    $scope.$emit('hideLoader');
                };

                $scope.invokeApi(RVReservationSummarySrv.fetchInitialData, {}, fetchSuccess, fetchFailure);
            };

            $scope.resetAddons = function () {
                angular.forEach($scope.reservationData.rooms, function (room) {
                    room.addons = [];
                });
            };

            // CICO-11716
            $scope.onOccupancyChange = function (type, tabIndex) {
                var currentRoomTypeId = parseInt($scope.reservationData.tabs[tabIndex].roomTypeId, 10) || "",
                    firstIndex = _.indexOf($scope.reservationData.rooms, _.findWhere($scope.reservationData.rooms, {
                    roomTypeId: currentRoomTypeId
                })),
                    lastIndex = _.lastIndexOf($scope.reservationData.rooms, _.last(_.where($scope.reservationData.rooms, {
                    roomTypeId: currentRoomTypeId
                }))),
                    i;

                for (i = firstIndex; i <= lastIndex; i++) {
                    $scope.reservationData.rooms[i][type] = parseInt($scope.reservationData.tabs[tabIndex][type], 10);
                    if (!$scope.reservationData.isHourly) {
                        $scope.validateOccupant($scope.reservationData.rooms[i], type);
                        if (!!$scope.reservationData.rooms[i].rateId) {
                            $scope.checkOccupancyLimit(null, true, i);
                        }
                    }
                    $scope.updateOccupancy(i);
                }
                $scope.$broadcast('SIDE_BAR_OCCUPANCY_UPDATE');
                devlogRoomsArray();
            };

            $scope.removeTab = function (tabIndex) {

                var firstIndex = _.indexOf($scope.reservationData.rooms, _.findWhere($scope.reservationData.rooms, {
                    roomTypeId: parseInt($scope.reservationData.tabs[tabIndex].roomTypeId, 10) || ""
                }));
                var currentCount = parseInt($scope.reservationData.tabs[tabIndex].roomCount, 10);

                $scope.reservationData.tabs.splice(tabIndex, 1);
                $scope.reservationData.rooms.splice(firstIndex, currentCount);

                if ($scope.viewState.currentTab == tabIndex) {
                    $scope.viewState.currentTab = 0; // In case of deleting current tab, reset to first
                }

                $scope.$broadcast('TABS_MODIFIED');
                devlogRoomsArray();
            };

            var devlogRoomsArray = function devlogRoomsArray() {
                console.log({
                    size: $scope.reservationData.rooms.length,
                    contents: $scope.reservationData.rooms
                });
            };

            // CICO-62890 : showValidationPopup
            var showValidationPopup = function showValidationPopup() {
                ngDialog.open({
                    template: '/assets/partials/reservation/alerts/reseravtionFromDiaryValidation.html',
                    scope: $scope,
                    className: '',
                    closeByDocument: false,
                    closeByEscape: false
                });
            },
                resetRoomDetailsIfInvalid = function resetRoomDetailsIfInvalid() {
                $scope.reservationData.tabs[0].room_id = null;
                $scope.reservationData.rooms[0].room_id = null;

                $scope.reservationData.tabs[0].roomName = null;
                $scope.reservationData.rooms[0].roomName = null;
            },
                isShowPopopForRoomCount = false;

            $scope.onRoomCountChange = function (tabIndex) {
                var currentCount = parseInt($scope.reservationData.tabs[tabIndex].roomCount, 10),
                    currentRoomTypeId = parseInt($scope.reservationData.tabs[tabIndex].roomTypeId, 10) || "",
                    firstIndex = _.indexOf($scope.reservationData.rooms, _.findWhere($scope.reservationData.rooms, {
                    roomTypeId: currentRoomTypeId
                })),
                    lastIndex = _.lastIndexOf($scope.reservationData.rooms, _.last(_.where($scope.reservationData.rooms, {
                    roomTypeId: currentRoomTypeId
                }))),
                    totalCount = lastIndex - firstIndex + 1;

                var isRoomDetailsInvalidated = $scope.reservationData.tabs[0].room_id === null;

                // CICO-62890 : Fix issue on change room count.
                if ($stateParams.fromState === 'NIGHTLY_DIARY' && currentCount > 1 && !isShowPopopForRoomCount && !isRoomDetailsInvalidated) {
                    $scope.validationMsg = 'Room number will be unassigned by changing the room count';
                    isShowPopopForRoomCount = true;
                    resetRoomDetailsIfInvalid();
                    showValidationPopup();
                }

                if (totalCount < currentCount) {
                    var copy, i;

                    for (i = 0; i < currentCount - totalCount; i++) {
                        copy = angular.copy($scope.reservationData.rooms[firstIndex]);
                        $scope.reservationData.rooms.splice(lastIndex, 0, copy);
                    }
                } else {
                    $scope.reservationData.rooms.splice(firstIndex, totalCount - currentCount);
                }

                $scope.$broadcast('TABS_MODIFIED');
                devlogRoomsArray();
            };

            // Copy the amount for one date to all the dates during the stay
            $scope.copySingleValueToOtherCells = function (modifiedAmt, stayDates) {
                _.each(stayDates, function (stayDateInfo, stayDate) {
                    if (Date.parse(stayDate) >= Date.parse($rootScope.businessDate)) {
                        stayDateInfo.rateDetails.modified_amount = modifiedAmt;
                    }
                });
            };
            if (!$rootScope.disableObserveForSwipe) {
                CardReaderCtrl.call(this, $scope, $rootScope, $timeout, $interval, $log);
                $scope.observeForSwipe();
            }

            /**
             * Checks whether there are any emails configured
             */
            $scope.hasEmails = function () {
                return !!$scope.guestCardData.contactInfo.email;
            };

            /**
             * Should disable the send email btn in the cancellation popup
             * @param {String} locale - locale chosen from the popup
             */
            $scope.shouldDisableSendCancellationEmailBtn = function () {
                return !$scope.DailogeState.isGuestEmailSelected && !$scope.DailogeState.sendConfirmatonMailTo;
            };
        }]);
    }, {}] }, {}, [1]);