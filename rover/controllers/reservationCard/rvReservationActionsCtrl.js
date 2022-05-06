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
        sntRover.controller('reservationActionsController', ['$rootScope', '$scope', 'ngDialog', '$state', 'RVReservationCardSrv', 'RVHkRoomDetailsSrv', 'RVSearchSrv', 'RVDepositBalanceSrv', '$filter', 'rvPermissionSrv', '$timeout', '$window', 'RVReservationSummarySrv', 'RVPaymentSrv', 'RVContactInfoSrv', 'rvUtilSrv', 'RVBillCardSrv', 'RVGuestCardsSrv', 'RVGAHelperSrv', '$stateParams', '$q', function ($rootScope, $scope, ngDialog, $state, RVReservationCardSrv, RVHkRoomDetailsSrv, RVSearchSrv, RVDepositBalanceSrv, $filter, rvPermissionSrv, $timeout, $window, RVReservationSummarySrv, RVPaymentSrv, RVContactInfoSrv, rvUtilSrv, RVBillCardSrv, RVGuestCardsSrv, RVGAHelperSrv, $stateParams, $q) {

            BaseCtrl.call(this, $scope);
            var that = this;

            var TZIDate = tzIndependentDate,
                reservationMainData = $scope.reservationParentData;

            var roomAndRatesState = 'rover.reservation.staycard.mainCard.room-rates';

            /*
             * The reverse checkout button is to be shown if all the following conditions are satisfied
             * -departure date <= busssiness date
             * -status === checkedout
             * -has permission
             * -is stand alone hotel
             * - hourly turned off
             */
            var departureDatePassedbusinessDate = new Date($scope.reservationData.reservation_card.departure_date) >= new Date($rootScope.businessDate) || $scope.reservationData.reservation_card.departure_date === $rootScope.businessDate,
                reservationCard = $scope.reservationData.reservation_card;

            $scope.showReverseCheckout = reservationCard.reservation_status === 'CHECKEDOUT' && departureDatePassedbusinessDate && rvPermissionSrv.getPermissionValue('REVERSE_CHECK_OUT') && $rootScope.isStandAlone && !$rootScope.isHourlyRateOn && reservationCard.is_reverse_checkout_allowed_for_hotel;
            $scope.shouldShowDemographicsInValidationPopup = false;
            $scope.shouldShowGuestInfoInValidationPopup = false;
            $scope.hasPermissionToCheckin = rvPermissionSrv.getPermissionValue("CHECK_IN_RESERVATION");

            $scope.reverseCheckout = function (reservationId, clickedButton) {
                $state.go("rover.reservation.staycard.billcard", {
                    "reservationId": reservationId,
                    "clickedButton": clickedButton,
                    "userId": $scope.guestCardData.userId
                });
            };

            // Since API is returning "true"/"false"
            // TODO: Ask Rashila to to it from the API itself
            if (typeof $scope.reservationData.reservation_card.is_rate_suppressed_present_in_stay_dates !== "boolean") {
                $scope.reservationData.reservation_card.is_rate_suppressed_present_in_stay_dates = $scope.reservationData.reservation_card.is_rate_suppressed_present_in_stay_dates === "true";
            }

            $scope.actionsCheck = {
                firstDate: $scope.reservationParentData.arrivalDate === $rootScope.businessDate
            };

            $scope.displayTime = function (status) {
                var display = false;

                if (status === 'CHECKEDIN' || status === 'CHECKING_OUT') {
                    display = true;
                }
                return display;
            };

            $scope.displayBalance = function (status) {
                var display = false;

                if (status === 'CHECKING_IN' || status === 'RESERVED' || status === 'CHECKEDIN' || status === 'CHECKING_OUT') {
                    if (status === 'CHECKING_IN' || status === 'RESERVED') {
                        /*	As per CICO-9795 :
                            Balance field should NOT show when the guest is NOT checked in.
                        */
                        display = false;
                    } else {
                        display = true;
                    }
                }
                return display;
            };

            $scope.getBalanceAmountColor = function (balance) {
                return balance > 0 ? "red" : "green";
            };

            $scope.displayAddon = function (status) {
                return status === 'RESERVED' || status === 'CHECKING_IN' || status === 'CHECKEDIN' || status === 'CHECKING_OUT';
            };

            $scope.displayAddCharge = function (status) {
                return status === 'RESERVED' || status === 'CHECKING_IN' || status === 'CHECKEDIN' || status === 'CHECKING_OUT' || status === 'NOSHOW_CURRENT';
            };

            $scope.displayArrivalTime = function (status) {
                return status === 'CHECKING_IN' || status === 'NOSHOW_CURRENT';
            };

            $scope.getTimeColor = function (time) {
                var timeColor = "";

                if (time !== null) {
                    timeColor = "time";
                }
                return timeColor;
            };

            // update the price on staycard.
            /* jslint unparam: true*/
            var postchargeAdded = $scope.$on('postcharge.added', function (event, data) {
                $scope.reservationData.reservation_card.balance_amount = parseFloat(data.total_balance_amount);
            });
            /* jslint unparam: false*/

            // the listener must be destroyed when no needed anymore
            $scope.$on('$destroy', postchargeAdded);
            $scope.creditCardTypes = [];
            $scope.paymentTypes = [];

            var openDepositPopup = function openDepositPopup() {
                if ($scope.reservationData.reservation_card.reservation_status === "RESERVED" || $scope.reservationData.reservation_card.reservation_status === "CHECKING_IN") {
                    var feeDetails = $scope.depositDetails.attached_card === undefined ? {} : $scope.depositDetails.attached_card.fees_information;
                    var passData = {
                        "reservationId": $scope.reservationData.reservation_card.reservation_id,
                        "fees_information": feeDetails,
                        "details": {
                            "firstName": $scope.guestCardData.contactInfo.first_name,
                            "lastName": $scope.guestCardData.contactInfo.last_name,
                            "isDisplayReference": $scope.ifReferanceForCC,
                            "creditCardTypes": $scope.creditCardTypes,
                            "paymentTypes": $scope.paymentTypes
                        }
                    };

                    $scope.passData = passData;
                    ngDialog.close(); // close any existing popups
                    ngDialog.open({
                        template: '/assets/partials/reservationCard/rvReservationDepositPopup.html',
                        className: '',
                        controller: 'rvReservationPendingDepositController',
                        scope: $scope,
                        closeByDocument: false,
                        closeByEscape: false
                    });
                } else {
                    return;
                }
            };

            $scope.ifReferanceForCC = false;
            $scope.depositDetails = {};

            /** ************************************************************************
             * Entering staycard we check if any deposit is left else noraml checkin
             *
             **************************************************************************/

            $scope.depositDetails.isFromCheckin = false;
            var paymentTypes = angular.copy($scope.reservationData.paymentTypes);

            $scope.paymentTypes = paymentTypes;
            $scope.creditCardTypes = [];
            paymentTypes.forEach(function (paymentType) {
                if (paymentType.name === 'CC') {
                    $scope.creditCardTypes = paymentType.values;
                }
            });

            $scope.depositDetails = angular.copy($scope.reservationData.reseravationDepositData);
            if (!!$scope.depositDetails.deposit_policy && parseInt($scope.depositDetails.deposit_amount, 10) > 0 && $rootScope.isStandAlone) {
                if (!$scope.depositPopupData.isShown) {
                    $scope.depositDetails.isFromCheckin = false;
                    if (!$scope.reservationData.justCreatedRes) {
                        openDepositPopup();
                    }
                    $scope.depositPopupData.isShown = true;
                }
            }

            var getTwentyFourHourTime = function getTwentyFourHourTime(resDate, amPmString) {
                var d = new Date(resDate + " " + amPmString);

                return d.getTime();
            };

            /**
             * //CICO-14777 Yotel - Hourly Setup: Checkin with not ready room assigned should redirect to diary
             * @return {Boolean}
             */
            var shouldRedirectToDiary = function shouldRedirectToDiary() {
                var reservationData = $scope.reservationData.reservation_card;

                var res_start = getTwentyFourHourTime(reservationData.arrival_date, reservationData.arrival_time),
                    res_end = getTwentyFourHourTime(reservationData.departure_date, reservationData.departure_time),
                    isOOORoom = false;

                // CICO-36544
                if (reservationData.ooo_array) {
                    // loop through all the ooo date and times
                    reservationData.ooo_array.forEach(function (oooTimings) {
                        var ooo_start = getTwentyFourHourTime(oooTimings.ooo_start_date, oooTimings.ooo_start_time),
                            ooo_end = getTwentyFourHourTime(oooTimings.ooo_end_date, oooTimings.ooo_end_time);

                        // if reservation time falls into/touches any of the ooo times and hk status is 3
                        if (res_start <= ooo_end && res_end >= ooo_start && reservationData.room_reservation_hk_status === 3) {
                            isOOORoom = true;
                            return;
                        }
                    });
                }

                if ((reservationData.room_status === 'NOTREADY' || isOOORoom) && (reservationData.is_hourly_reservation || $rootScope.hotelDiaryConfig.mode === 'FULL')) {
                    return true;
                }
                return false;
            };

            var gotoDiaryInEditMode = function gotoDiaryInEditMode() {
                RVReservationCardSrv.checkinDateForDiary = $scope.reservationData.reservation_card.arrival_date.replace(/-/g, '/');
                $state.go('rover.diary', {
                    reservation_id: $scope.reservationData.reservation_card.reservation_id,
                    checkin_date: $scope.reservationData.reservation_card.arrival_date,
                    is_nightly_reservation: !$scope.reservationData.reservation_card.is_hourly_reservation
                });
            };

            $scope.checkGuestInFromQueue = function () {
                $scope.initCheckInFlow();
            };

            var is_required_contact_details = function is_required_contact_details() {
                return (_.isEmpty($scope.guestCardData.contactInfo.email) || _.isEmpty($scope.guestCardData.contactInfo.phone) || _.isEmpty($scope.guestCardData.contactInfo.mobile)) && $scope.reservationData.reservation_card.is_disabled_email_phone_dialog !== "true";
            };

            var is_required_country_and_nationality_details = function is_required_country_and_nationality_details() {
                return rvUtilSrv.isEmpty($scope.guestCardData.contactInfo.nationality_id) && $rootScope.roverObj.forceNationalityAtCheckin || rvUtilSrv.isEmpty($scope.guestCardData.contactInfo.address.country_id) && $rootScope.roverObj.forceCountryAtCheckin;
            };

            $scope.reservationMissingGuestDataOrDemographics = function () {
                if (is_required_contact_details() || is_required_country_and_nationality_details()) {
                    $scope.shouldShowGuestInfoInValidationPopup = true;
                }
                var isReservationMissingGuestDataOrDemographics = is_required_contact_details() || is_required_country_and_nationality_details() || $rootScope.isStandAlone && !validateDemographicsData($scope.reservationParentData.demographics);

                return isReservationMissingGuestDataOrDemographics;
            };

            $scope.reservationIsQueued = function () {
                // checks current reservation data to see if it is in Queue or not
                if ($scope.reservationData.reservation_card.is_reservation_queued === 'true') {
                    return true;
                } else return false;
            };

            $scope.roomAssignmentNeeded = function () {
                if ($scope.reservationData.reservation_card.room_number === '' || $scope.reservationData.reservation_card.room_status === 'NOTREADY' && !$scope.hasAnySharerCheckedin() || $scope.reservationData.reservation_card.fo_status === 'OCCUPIED' && !$scope.hasAnySharerCheckedin()) {
                    if ($scope.reservationData.reservation_card.room_number === '' && $scope.putInQueueClicked) {
                        return true;
                    }
                    if ($scope.reservationData.reservation_card.room_number === '' && $scope.reservationIsQueued()) {
                        return true;
                    }
                    if ($scope.reservationData.reservation_card.room_status === 'NOTREADY' && ($scope.reservationIsQueued() || $scope.putInQueueClicked)) {
                        return false;
                    }
                    return true;
                } else return false;
            };
            $scope.upsellNeeded = function () {
                if ($scope.reservationData.reservation_card.is_force_upsell === "true" && $scope.reservationData.reservation_card.is_upsell_available === "true") {
                    return true;
                } else return false;
            };

            $scope.goToRoomAssignment = function () {
                // check if roomupgrade is available
                var reservationStatus = $scope.reservationData.reservation_card.reservation_status,
                    isUpgradeAvaiable = $scope.reservationData.reservation_card.is_upsell_available === "true" && (reservationStatus === 'RESERVED' || reservationStatus === 'CHECKING_IN'),
                    cannotMoveState = $scope.reservationData.reservation_card.cannot_move_room && $scope.reservationData.reservation_card.room_number !== "";

                $state.go("rover.reservation.staycard.roomassignment", {
                    "reservation_id": $scope.reservationData.reservation_card.reservation_id,
                    "room_type": $scope.reservationData.reservation_card.room_type_code,
                    "clickedButton": "checkinButton",
                    "upgrade_available": isUpgradeAvaiable,
                    "cannot_move_room": cannotMoveState,
                    "roomTypeId": $scope.reservationData.reservation_card.room_type_id
                });
            };
            $scope.goToBillCard = function () {
                $state.go('rover.reservation.staycard.billcard', {
                    "reservationId": $scope.reservationData.reservation_card.reservation_id,
                    "clickedButton": "checkinButton",
                    "userId": $scope.guestCardData.userId
                });
            };
            $scope.goToRoomUpgrades = function () {
                var cannotMoveState = $scope.reservationData.reservation_card.cannot_move_room && $scope.reservationData.reservation_card.room_number !== "";

                $state.go('rover.reservation.staycard.upgrades', {
                    "reservation_id": $scope.reservationData.reservation_card.reservation_id,
                    "clickedButton": "checkinButton",
                    "cannot_move_room": cannotMoveState
                });
            };
            $scope.validateEmailPhone = function () {

                $scope.showJobTitle = false;
                $scope.showNameOfFather = false;
                $scope.showNameOfMother = false;
                $scope.showPlaceOfBirth = false;
                $scope.showGender = false;
                $scope.showVehicleRegistrationNumber = false;
                $scope.showIdPlaceOfIssue = false;
                $scope.showPersonalIdNumber = false;
                $scope.showHomeTown = false;
                $scope.showPlaceOfResidence = false;
                $scope.showVehicleCountryMark = false;
                $scope.showIdCountryOfIssue = false;
                $scope.showDateOfBirth = false;
                $scope.showIdExpDate = false;

                $scope.callAPI(RVGuestCardsSrv.fetchGuestDetailsInformation, {
                    successCallBack: function successCallBack(data) {
                        $scope.guestCardData.contactInfo = data;
                        $scope.showJobTitle = $scope.guestCardData.contactInfo.guest_admin_settings.job_title.is_mandatory_on_guest_card_creation;
                        $scope.showNameOfFather = $scope.guestCardData.contactInfo.guest_admin_settings.father_name.is_mandatory_on_guest_card_creation;
                        $scope.showNameOfMother = $scope.guestCardData.contactInfo.guest_admin_settings.mother_name.is_mandatory_on_guest_card_creation;
                        $scope.showPlaceOfBirth = $scope.guestCardData.contactInfo.guest_admin_settings.birth_place.is_mandatory_on_guest_card_creation;
                        $scope.showGender = $scope.guestCardData.contactInfo.guest_admin_settings.gender.is_mandatory_on_guest_card_creation;
                        $scope.showVehicleRegistrationNumber = $scope.guestCardData.contactInfo.guest_admin_settings.registration_number.is_mandatory_on_guest_card_creation;
                        $scope.showIdPlaceOfIssue = $scope.guestCardData.contactInfo.guest_admin_settings.id_place_of_issue.is_mandatory_on_guest_card_creation;
                        $scope.showPersonalIdNumber = $scope.guestCardData.contactInfo.guest_admin_settings.personal_id_no.is_mandatory_on_guest_card_creation;
                        $scope.showHomeTown = $scope.guestCardData.contactInfo.guest_admin_settings.home_town.is_mandatory_on_guest_card_creation;
                        $scope.showPlaceOfResidence = $scope.guestCardData.contactInfo.guest_admin_settings.place_of_residence.is_mandatory_on_guest_card_creation;
                        $scope.showVehicleCountryMark = $scope.guestCardData.contactInfo.guest_admin_settings.vehicle_country_mark.is_mandatory_on_guest_card_creation && ($scope.guestCardData.contactInfo.country_code === '' || $scope.guestCardData.contactInfo.country_code === null);
                        $scope.showIdCountryOfIssue = $scope.guestCardData.contactInfo.guest_admin_settings.id_country_of_issue.is_mandatory_on_guest_card_creation && ($scope.guestCardData.contactInfo.id_country_of_issue === '' || $scope.guestCardData.contactInfo.id_country_of_issue === null);
                        $scope.showDateOfBirth = $scope.guestCardData.contactInfo.guest_admin_settings.date_of_birth.is_mandatory_on_guest_card_creation && ($scope.guestCardData.contactInfo.birthday === '' || $scope.guestCardData.contactInfo.birthday === null);
                        $scope.showIdExpDate = $scope.guestCardData.contactInfo.guest_admin_settings.id_expiration_date.is_mandatory_on_guest_card_creation && ($scope.guestCardData.contactInfo.id_expiration_date === '' || $scope.guestCardData.contactInfo.id_expiration_date === null);

                        ngDialog.open({
                            template: '/assets/partials/validateCheckin/rvValidateEmailPhone.html',
                            controller: 'RVValidateEmailPhoneCtrl',
                            scope: $scope
                        });
                    },
                    failureCallBack: function failureCallBack(errorMessage) {
                        $scope.errorMessage = errorMessage;
                        $scope.$emit('hideLoader');
                    },
                    params: $scope.guestCardData.userId
                });
            };

            $scope.promptCardAddition = function () {
                var templateUrl = '/assets/partials/cards/alerts/cardAdditionPrompt.html';

                ngDialog.open({
                    template: templateUrl,
                    className: 'ngdialog-theme-default stay-card-alerts',
                    scope: $scope,
                    closeByDocument: false,
                    closeByEscape: false
                });
            };

            $scope.initCheckInFlow = function () {
                var checkingInQueued = !$scope.reservationData.check_in_via_queue && $scope.reservationIsQueued();
                // CICO-13907 : If any sharer of the reservation is checked in, do not allow to go to room assignment or upgrades screen

                if ($scope.hasAnySharerCheckedin() || checkingInQueued) {

                    if ($scope.roomAssignmentNeeded()) {
                        $scope.goToRoomAssignment();
                        return false;
                    } else {
                        $scope.goToBillCard();
                        return false;
                    }
                }

                if (shouldRedirectToDiary()) {
                    gotoDiaryInEditMode();
                } else if ($scope.roomAssignmentNeeded()) {
                    $scope.goToRoomAssignment();
                } else if ($scope.upsellNeeded() && !$rootScope.isHourlyRateOn && !$scope.reservationData.reservation_card.is_suite) {
                    $scope.goToRoomUpgrades();
                } else {
                    $scope.goToBillCard();
                }
            };

            $scope.checkInFromQueued = function () {
                var useAdvancedQueFlow = $rootScope.advanced_queue_flow_enabled;

                if (!useAdvancedQueFlow) {
                    return false;
                }

                if (!$scope.reservationData.check_in_via_queue && $scope.reservationIsQueued()) {
                    return true;
                } else return false;
            };

            var startCheckin = function startCheckin() {
                $rootScope.queuedCheckIn = $scope.reservationIsQueued(); // pass to billcardctrl through here
                if ($scope.checkInFromQueued()) {
                    $scope.checkGuestInFromQueue();
                    return;
                } else {

                    var afterRoomUpdate = function afterRoomUpdate() {
                        if (!!$scope.guestCardData.userId) {

                            var isReservationMissingGuestDataOrDemographics = $scope.reservationMissingGuestDataOrDemographics();

                            if (isReservationMissingGuestDataOrDemographics) {

                                if ($rootScope.isStandAlone && !validateDemographicsData($scope.reservationParentData.demographics)) {
                                    $scope.shouldShowDemographicsInValidationPopup = true;
                                    setDemographics();
                                } else {
                                    $scope.shouldShowDemographicsInValidationPopup = false;
                                }

                                $scope.validateEmailPhone();
                            } else {
                                $scope.initCheckInFlow();
                            }
                        } else {
                            // Prompt user to add a Guest Card
                            $scope.promptCardAddition();
                        }
                    };

                    // NOTE: room_id is provided as string and number >.<, that why checking length/existance
                    var hasRoom = typeof $scope.reservationData.reservation_card.room_id === 'string' ? $scope.reservationData.reservation_card.room_id.length : $scope.reservationData.reservation_card.room_id;

                    // CICO-65447 : FULL Mode: Reservations should be redirected to Hourly(D) diary, 
                    // when clicking the CHECK IN button if the reservation has no room assigned or assigned room is not ready
                    if (!hasRoom && $rootScope.hotelDiaryConfig.mode === 'FULL') {
                        gotoDiaryInEditMode();
                        return false;
                    }

                    if (!hasRoom && $scope.putInQueueClicked) {
                        if ($scope.reservationMissingGuestDataOrDemographics()) {
                            $scope.$emit('showLoader');
                            $scope.validateEmailPhone();
                            return false;
                        }
                        $scope.goToRoomAssignment();
                        return false;
                    }

                    if (!!hasRoom) {
                        // Go fetch the room status again
                        // After fetch do the entire rest of it
                        $scope.$emit('showLoader');
                        RVHkRoomDetailsSrv.fetch($scope.reservationData.reservation_card.room_id).then(function (data) {
                            // Rest of the things
                            $scope.$emit('hideLoader');
                            // update the room status to reservation card
                            $scope.reservationData.reservation_card.room_ready_status = data.current_hk_status;
                            $scope.reservationData.reservation_card.room_status = data.is_ready === "true" ? 'READY' : 'NOTREADY';
                            $scope.reservationData.reservation_card.fo_status = data.is_occupied === "true" ? 'OCCUPIED' : 'VACANT';
                            $scope.reservationData.reservation_card.room_reservation_hk_status = data.room_reservation_hk_status;
                            $scope.reservationData.reservation_card.ooo_array = data.ooo_timings;

                            // CICO-14777 Yotel - Hourly Setup: Checkin with not ready room assigned should redirect to diary


                            if (shouldRedirectToDiary()) {
                                gotoDiaryInEditMode();
                            } else {
                                afterRoomUpdate();
                            }
                        }, function () {
                            $scope.$emit('hideLoader');
                        });
                    } else {
                        // just cont.
                        afterRoomUpdate();
                    }
                }
            };

            $scope.$on("PROCEED_CHECKIN", function () {
                startCheckin();
            });

            // Methods which check whether source/origin/market/segment dropdown should be shown or not
            var showMarkets = function showMarkets() {
                return $scope.otherData.marketsEnabled && $scope.otherData.markets.length > 0;
            },
                showSegments = function showSegments() {
                return $scope.otherData.segmentsEnabled && $scope.otherData.segments.length > 0;
            },
                showOrigins = function showOrigins() {
                return $scope.otherData.originsEnabled && $scope.otherData.origins.length > 0;
            },
                showSources = function showSources() {
                return $scope.otherData.sourcesEnabled && $scope.otherData.sources.length > 0;
            };

            /**
             * Checks whether all the madatory demographics fields is entered
             * @param {Object} demographicsData - holding demographics data
             * @param {Boolean} isValid - flag indicating whether form is valid or not
             */
            var validateDemographicsData = function validateDemographicsData(demographicsData) {
                var isValid = true;

                if (showMarkets() && $scope.otherData.marketIsForced) {
                    isValid = !!demographicsData.market;
                }
                if (showSources() && $scope.otherData.sourceIsForced && isValid) {
                    isValid = !!demographicsData.source;
                }
                if (showOrigins() && $scope.otherData.originIsForced && isValid) {
                    isValid = !!demographicsData.origin;
                }
                if (showSegments() && $scope.otherData.segmentsIsForced && isValid) {
                    isValid = !!demographicsData.segment;
                }

                return isValid;
            };

            // Show the demographics popup during check-in process with the mandatory fields which is not set
            var showDemographicsPopup = function showDemographicsPopup() {
                ngDialog.open({
                    template: '/assets/partials/reservationCard/rvReservationDemographicsMissingPopup.html',
                    className: '',
                    scope: $scope,
                    closeByDocument: false,
                    closeByEscape: false
                });
            };

            /**
             * Set the visibility of the demographics fields in the popup
             */
            var setDemographics = function setDemographics() {
                $scope.shouldShowReservationType = false;
                $scope.shouldShowMarket = showMarkets() && $scope.otherData.marketIsForced;
                $scope.shouldShowSource = showSources() && $scope.otherData.sourceIsForced;
                $scope.shouldShowOriginOfBooking = showOrigins() && $scope.otherData.originIsForced;
                $scope.shouldShowSegments = showSegments() && $scope.otherData.segmentsIsForced;
            };

            /**
             * Checks whether the demographics field is valid or not
             */
            $scope.isDemographicsFormValid = function () {
                return validateDemographicsData($scope.reservationParentData.demographics);
            };

            /**
             * Invoke the update reservation api to update the demographics details during check-in process
             */
            $scope.updateDemograhics = function () {
                var requestParams = {
                    'reservationId': $scope.reservationParentData.reservationId,
                    'source_id': parseInt($scope.reservationParentData.demographics.source),
                    'market_segment_id': parseInt($scope.reservationParentData.demographics.market),
                    'booking_origin_id': parseInt($scope.reservationParentData.demographics.origin),
                    'segment_id': parseInt($scope.reservationParentData.demographics.segment)
                };

                var onDemograhicsUpdateSuccess = function onDemograhicsUpdateSuccess() {
                    ngDialog.close();
                    startCheckin();
                },
                    onDemographicsUpdateFailure = function onDemographicsUpdateFailure(error) {
                    $scope.errorMessage = error;
                    ngDialog.close();
                };

                $scope.callAPI(RVReservationSummarySrv.updateReservation, {
                    successCallBack: onDemograhicsUpdateSuccess,
                    failureCallBack: onDemographicsUpdateFailure,
                    params: requestParams
                });
            };

            /** ************************************************************************
             * Before checking in we check if any deposit is left else noraml checkin
             *
             **************************************************************************/
            $scope.goToCheckin = function () {
                RVGAHelperSrv.startEventTiming('CHECKIN', $scope.reservationData.reservation_card.reservation_id, $scope.reservationData.reservation_card.confirmation_num);
                if ($rootScope.isStandAlone && $rootScope.allowCheckInToNotReadyRooms && $scope.reservationData.reservation_card.room_number && $scope.reservationData.reservation_card.room_status === 'NOTREADY' && !$scope.reservationData.check_in_via_queue) {
                    that.openRoomStatusChangePopup('', true);
                    return;
                }

                if ($scope.isGuestIdRequiredForCheckin()) {
                    $scope.toggleGuests(true);
                    return;
                }

                startCheckin();
            };
            $scope.unAvailablePopup = function () {
                ngDialog.open({
                    template: '/assets/partials/staycard/unavailablePopup.html',
                    scope: $scope
                });
            };
            /** ****************************************/
            $scope.showPutInQueue = function () {
                var isQueueRoomsOn = $scope.reservationData.reservation_card.is_queue_rooms_on,
                    isReservationQueued = $scope.reservationData.reservation_card.is_reservation_queued,
                    reservationStatus = $scope.reservationData.reservation_card.reservation_status;
                var displayPutInQueue = false;

                if (reservationStatus === 'CHECKING_IN' || reservationStatus === 'NOSHOW_CURRENT') {
                    if (isQueueRoomsOn === "true" && isReservationQueued === "false") {
                        displayPutInQueue = true;
                    }
                }
                return displayPutInQueue;
            };

            $scope.showRemoveFromQueue = function () {
                var isQueueRoomsOn = $scope.reservationData.reservation_card.is_queue_rooms_on,
                    isReservationQueued = $scope.reservationData.reservation_card.is_reservation_queued,
                    reservationStatus = $scope.reservationData.reservation_card.reservation_status;

                var displayPutInQueue = false;

                if (reservationStatus === 'CHECKING_IN' || reservationStatus === 'NOSHOW_CURRENT') {
                    if (isQueueRoomsOn === "true" && isReservationQueued === "true") {
                        displayPutInQueue = true;
                    }
                }

                return displayPutInQueue;
            };

            $scope.successPutInQueueCallBack = function () {
                $scope.$emit('hideLoader');
                $scope.reservationData.reservation_card.is_reservation_queued = "true";
                $scope.$emit('UPDATE_QUEUE_ROOMS_COUNT', 'add');
                RVReservationCardSrv.updateResrvationForConfirmationNumber($scope.reservationData.reservation_card.reservation_id, $scope.reservationData);

                var useAdvancedQueFlow = $rootScope.advanced_queue_flow_enabled;
                // as per CICO-29735
                var keySettings = $scope.reservationData.reservation_card.key_settings;

                if (useAdvancedQueFlow && keySettings !== "no_key_delivery") {
                    $rootScope.$emit('goToStayCardFromAddToQueue');
                    setTimeout(function () {
                        // then prompt for keys
                        $rootScope.$broadcast('clickedIconKeyFromQueue'); // signals rvReservationRoomStatusCtrl to init the keys popup
                    }, 500);
                } else {
                    $rootScope.$emit('goToStayCardFromAddToQueue');
                }
            };

            $scope.successRemoveFromQueueCallBack = function () {
                $scope.$emit('hideLoader');
                $scope.reservationData.reservation_card.is_reservation_queued = "false";

                RVSearchSrv.removeResultFromData($scope.reservationData.reservation_card.reservation_id);
                $scope.$emit('UPDATE_QUEUE_ROOMS_COUNT', 'remove');

                RVReservationCardSrv.updateResrvationForConfirmationNumber($scope.reservationData.reservation_card.reservation_id, $scope.reservationData);
            };

            $scope.reservationData.check_in_via_queue = false;

            $scope.putInQueue = function (reservationId) {

                var useAdvancedQueFlow = $rootScope.advanced_queue_flow_enabled;

                if (useAdvancedQueFlow) {
                    $scope.reservationData.check_in_via_queue = true; // set flag for checking in via put-in-queue
                    $scope.initAdvQueCheck();
                    $scope.goToCheckin();
                } else {
                    /*
                     * put in queue will be done later, after cc auth
                     */

                    $scope.reservationData.check_in_via_queue = false; // set flag for checking in via put-in-queue
                    var data = {
                        "reservationId": reservationId,
                        "status": "true"
                    };

                    $scope.invokeApi(RVReservationCardSrv.modifyRoomQueueStatus, data, $scope.successPutInQueueCallBack);
                }
            };

            $scope.removeFromQueue = function (reservationId) {
                // debuggin
                // $scope.putInQueue(reservationId);
                // return;
                var data = {
                    "reservationId": reservationId,
                    "status": false
                };

                $scope.invokeApi(RVReservationCardSrv.modifyRoomQueueStatus, data, $scope.successRemoveFromQueueCallBack);
            };

            var promptCancel = function promptCancel(penalty, nights, isPercent, paymentCurrencyCancellationCharge) {
                $scope.DailogeState = {};
                $scope.DailogeState.successMessage = '';
                $scope.DailogeState.failureMessage = '';
                $scope.DailogeState.sendConfirmatonMailTo = '';
                $scope.DailogeState.bookerEmail = $scope.reservationData.reservation_card.booker_email;
                $scope.DailogeState.isGuestEmailSelected = false;
                $scope.DailogeState.isBookerEmailSelected = false;
                $scope.DailogeState.guestEmail = $scope.guestCardData.contactInfo.email;

                var passData = {
                    "reservationId": $scope.reservationData.reservation_card.reservation_id,
                    "details": {
                        "firstName": $scope.guestCardData.contactInfo.first_name,
                        "lastName": $scope.guestCardData.contactInfo.last_name,
                        "creditCardTypes": $scope.creditCardTypes,
                        "paymentTypes": $scope.paymentTypes
                    }
                };

                $scope.passData = passData;
                var openCancellationPopup = function openCancellationPopup(data) {

                    $scope.languageData = data;
                    ngDialog.open({
                        template: '/assets/partials/reservationCard/rvCancelReservation.html',
                        controller: 'RVCancelReservation',
                        scope: $scope,
                        data: JSON.stringify({
                            state: 'CONFIRM',
                            cards: false,
                            penalty: penalty,
                            paymentCurrencyCancellationCharge: paymentCurrencyCancellationCharge,
                            penaltyText: function () {
                                if (nights) {
                                    return penalty + (penalty > 1 ? " nights" : " night");
                                }
                                return $rootScope.currencySymbol + $filter('number')(penalty, 2);
                            }()
                        })
                    });

                    $scope.$emit('hideLoader');
                };

                fetchGuestLanguages(openCancellationPopup);
            };

            var showCancelReservationWithDepositPopup = function showCancelReservationWithDepositPopup(deposit, isOutOfCancellationPeriod, penalty, paymentCurrencyPenalty) {
                $scope.DailogeState = {};
                $scope.DailogeState.successMessage = '';
                $scope.DailogeState.failureMessage = '';
                $scope.DailogeState.sendConfirmatonMailTo = '';
                $scope.DailogeState.bookerEmail = $scope.reservationData.reservation_card.booker_email;
                $scope.DailogeState.isGuestEmailSelected = false;
                $scope.DailogeState.isBookerEmailSelected = false;
                $scope.DailogeState.guestEmail = $scope.guestCardData.contactInfo.email;
                $scope.DailogeState.paymentCurrencyPenalty = paymentCurrencyPenalty;

                var openCancellationPopup = function openCancellationPopup(data) {

                    $scope.languageData = data;
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
                                }
                                return "Reservation outside of cancellation period. A cancellation fee of " + $rootScope.currencySymbol + $filter('number')(penalty, 2) + " will be charged, deposit not refundable";
                            }()
                        })
                    });

                    $scope.$emit('hideLoader');
                };

                fetchGuestLanguages(openCancellationPopup);
            };

            /**
             * This method handles cancelling an exisiting reservation or
             * reinstating a cancelled reservation CICO-1403 and CICO-6056(Sprint20 >>> to be implemented in the next sprint)
             */

            var cancellationCharge = 0,
                paymentCurrencyCancellationCharge = 0,
                nights = false,
                depositAmount = 0;

            $scope.toggleCancellation = function () {

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
                                // var stayDuration = $scope.reservationParentData.numNights > 0 ? $scope.reservationParentData.numNights : 1;
                                // Make sure that the cancellation value is -lte thatn the total duration
                                // cancellationCharge = stayDuration > data.results.penalty_value ? data.results.penalty_value : stayDuration;
                                cancellationCharge = data.results.calculated_penalty_amount;
                                // nights = true;
                            } else {
                                cancellationCharge = parseFloat(data.results.calculated_penalty_amount);
                            }
                            paymentCurrencyCancellationCharge = parseFloat(data.results.default_payment_currency_calculated_penalty_amount);

                            if (parseInt(depositAmount, 10) > 0) {
                                showCancelReservationWithDepositPopup(depositAmount, isOutOfCancellationPeriod, cancellationCharge, paymentCurrencyCancellationCharge);
                            } else {
                                promptCancel(cancellationCharge, nights, data.results.penalty_type === 'percent', paymentCurrencyCancellationCharge);
                            }
                        } else {
                            if (parseInt(depositAmount, 10) > 0) {
                                showCancelReservationWithDepositPopup(depositAmount, isOutOfCancellationPeriod, '', '');
                            } else {
                                promptCancel('', nights, data.results.penalty_type === 'percent', paymentCurrencyCancellationCharge);
                            }
                        }
                    };

                    var onCancellationDetailsFetchFailure = function onCancellationDetailsFetchFailure(error) {
                        $scope.$emit('hideLoader');
                        $scope.errorMessage = error;
                    };

                    var params = {
                        id: $scope.reservationData.reservation_card.reservation_id
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

            $scope.openSmartBands = function () {
                ngDialog.open({
                    template: '/assets/partials/smartbands/rvSmartBandDialog.html',
                    controller: 'RVSmartBandsController',
                    className: 'ngdialog-theme-default1',
                    closeByDocument: false,
                    closeByEscape: false,
                    scope: $scope
                });
            };

            $scope.showSmartBandsButton = function (reservationStatus, icareEnabled, hasSmartbandsAttached) {
                var showSmartBand = false;

                if (icareEnabled === "true") {
                    if (reservationStatus === 'RESERVED' || reservationStatus === 'CHECKING_IN' || reservationStatus === 'CHECKEDIN' || reservationStatus === 'CHECKING_OUT' || reservationStatus === 'NOSHOW_CURRENT' || reservationStatus === 'CHECKEDOUT' && hasSmartbandsAttached) {
                        showSmartBand = true;
                    }
                }
                return showSmartBand;
            };

            $scope.goToCheckoutButton = function (reservationId, clickedButton, smartbandHasBalance) {
                RVGAHelperSrv.startEventTiming('CHECKOUT', $scope.reservationData.reservation_card.reservation_id, $scope.reservationData.reservation_card.confirmation_num);
                // CICO-65640 Prevent user from checking out, when the reservation is already part of the bulk checkout process
                if ($scope.reservationData.reservation_card.is_bulk_checkout_in_progress) {
                    var data = {
                        message: 'BULK_CHECKOUT_PROCESS_IN_PROGRESS',
                        isFailure: true
                    };

                    ngDialog.open({
                        template: '/assets/partials/popups/rvInfoPopup.html',
                        closeByDocument: true,
                        scope: $scope,
                        data: JSON.stringify(data)
                    });

                    return;
                }
                if (smartbandHasBalance === "true") {
                    $scope.clickedButton = clickedButton;
                    ngDialog.open({
                        template: '/assets/partials/smartbands/rvSmartbandListCheckoutscreen.html',
                        controller: 'RVSmartBandsCheckoutController',
                        className: 'ngdialog-theme-default1',
                        scope: $scope
                    });
                } else {
                    $state.go("rover.reservation.staycard.billcard", {
                        "reservationId": reservationId,
                        "clickedButton": clickedButton,
                        "userId": $scope.guestCardData.userId
                    });
                }
            };
            /*
             * Show Deposit/Balance Modal
             */

            $scope.showDepositBalanceModal = function () {
                $rootScope.fromStayCard = true;
                var reservationId = $scope.reservationData.reservation_card.reservation_id;
                var dataToSrv = {
                    "reservationId": reservationId
                };

                $scope.invokeApi(RVDepositBalanceSrv.getDepositBalanceData, dataToSrv, $scope.successCallBackFetchDepositBalance);
            };
            $scope.successCallBackFetchDepositBalance = function (data) {

                $scope.$emit('hideLoader');
                $scope.depositBalanceData = data;
                /**
                 * NOTE
                 * CICO-36113
                 * The APIs requested for getting deposit balance data are different and so are their responses
                 * http://pms.dev/staff/reservations/1481599/deposit_and_balance.json - RESERVATION MODULE
                 * http://pms.dev/api/posting_accounts/245/deposit_and_balance - ACCOUNTS
                 *
                 * The former is used to resolve the required data in this controller. And its response doesn't have
                 * the primary_bill_id. As both the controllers use the same template for the modal; we are
                 * assigning the primary_bill_id in the depositBalanceData object; This would be available
                 * in the reservationData object
                 *
                 */
                $scope.depositBalanceData['primary_bill_id'] = $scope.reservationData.reservation_card.default_bill_id;

                $scope.passData = {
                    "origin": "STAYCARD",
                    "details": {
                        "firstName": $scope.data.guest_details.first_name,
                        "lastName": $scope.data.guest_details.last_name,
                        "paymentTypes": $scope.paymentTypes
                    }
                };
                ngDialog.open({
                    template: '/assets/partials/depositBalance/rvModifiedDepositBalanceModal.html',
                    controller: 'RVDepositBalanceCtrl',
                    className: 'ngdialog-theme-default1',
                    closeByDocument: false,
                    scope: $scope
                });
            };

            /**
             * wanted to show deposit & blance button?
             * @param  {String}  reservationStatus
             * @return {Boolean}
             */
            $scope.showDepositBalance = function (reservationStatus) {
                var cashDesposit = false;

                if ($scope.reservationData.reservation_card.payment_method_used !== 'CC') {
                    cashDesposit = true;
                }
                $rootScope.initFromCashDeposit = cashDesposit;

                // As per CICO-15833
                // we wanted to show the Balance & Deposit popup for DUEIN & CHECKING IN reservation only
                reservationStatus = reservationStatus.toUpperCase();
                return reservationStatus === 'RESERVED' || reservationStatus === 'CHECKING_IN';
            };

            $scope.showDepositBalanceWithSr = function (reservationStatus, isRatesSuppressed) {
                var showDepositBalanceButtonWithSR = false;

                if (reservationStatus === 'RESERVED' || reservationStatus === 'CHECKING_IN') {
                    if (isRatesSuppressed === "true") {
                        showDepositBalanceButtonWithSR = true;
                    }
                }
                return showDepositBalanceButtonWithSR;
            };

            /**
             * Checks whether there are any emails configured
             */
            $scope.hasEmails = function () {
                return !!$scope.guestCardData.contactInfo.email || !!$scope.reservationData.reservation_card.booker_email;
            };

            // Checking whether email is attached with guest card or not
            $scope.isEmailAttached = function () {
                var isEmailAttachedFlag = false;

                if (!!$scope.guestCardData.contactInfo.email && $scope.guestCardData.contactInfo.email !== null && $scope.guestCardData.contactInfo.email !== "") {
                    isEmailAttachedFlag = true;
                }
                return isEmailAttachedFlag;
            };

            $scope.ngData = {};
            $scope.ngData.failureMessage = "";
            $scope.ngData.successMessage = "";

            /**
             * Fetch the guest languages list and settings
             * @return {undefined}
             */
            var fetchGuestLanguages = function fetchGuestLanguages(callback) {
                var params = { 'reservation_id': $scope.reservationData.reservation_card.reservation_id };

                // call api
                $scope.invokeApi(RVContactInfoSrv.fetchGuestLanguages, params, callback);
            };

            // Pop up for confirmation print as well as email send
            $scope.popupForConfirmation = function () {

                $scope.ngData.sendConfirmatonMailTo = '';
                $scope.ngData.enable_confirmation_custom_text = false;
                $scope.ngData.enable_confirmation_custom_text = "";
                $scope.ngData.confirmation_custom_title = "";
                $scope.ngData.languageData = {};
                $scope.ngData.bookerEmail = $scope.reservationData.reservation_card.booker_email;
                $scope.ngData.isGuestEmailSelected = false;
                $scope.ngData.isBookerEmailSelected = false;
                $scope.ngData.successMessage = '';
                $scope.ngData.failureMessage = '';
                $scope.ngData.guestEmail = $scope.guestCardData.contactInfo.email;
                $scope.ngData.isCustomTextPerReservation = $scope.reservationData.reservation_card.is_custom_text_per_reservation;

                var openConfirmationPopup = function openConfirmationPopup(data) {

                    $scope.ngData.languageData = data;

                    ngDialog.open({
                        template: '/assets/partials/reservationCard/rvReservationConfirmationPrintPopup.html',
                        className: '',
                        scope: $scope,
                        closeByDocument: false
                    });

                    $scope.$emit('hideLoader');
                };

                fetchGuestLanguages(openConfirmationPopup);
            };

            $scope.showConfirmation = function (reservationStatus) {
                var showResendConfirmationFlag = false;

                if ($rootScope.isStandAlone && $rootScope.sendConfirmationLetter) {
                    if (reservationStatus === 'RESERVED' || reservationStatus === 'CHECKING_IN' || reservationStatus === 'CHECKEDIN' || reservationStatus === 'CHECKING_OUT') {
                        showResendConfirmationFlag = true;
                    }
                }
                return showResendConfirmationFlag;
            };

            $scope.shouldShowResendCancellation = function (reservationStatus) {
                var isCancelled = reservationStatus === 'CANCELED',
                    isStandAlone = $rootScope.isStandAlone,
                    sendCancel = $rootScope.sendCancellationLetter;

                return isStandAlone && isCancelled && sendCancel;
            };

            var succesfullEmailCallback = function succesfullEmailCallback(data) {
                $scope.$emit('hideLoader');
                $scope.ngData.successMessage = data.message;
                $scope.ngData.failureMessage = '';
            };

            var failureEmailCallback = function failureEmailCallback(error) {
                $scope.$emit('hideLoader');
                $scope.ngData.failureMessage = error[0];
                $scope.ngData.successMessage = '';
            };

            var validateEmail = function validateEmail() {
                var email = "";

                if ($scope.ngData.isGuestEmailSelected) {
                    email = $scope.ngData.guestEmail;
                }
                if ($scope.ngData.isBookerEmailSelected) {
                    email = $scope.ngData.bookerEmail;
                }
                if (!$scope.hasEmails() && $scope.ngData.sendConfirmatonMailTo) {
                    email = $scope.ngData.sendConfirmatonMailTo;
                }
                return !rvUtilSrv.isEmailValid(email);
            };

            $scope.sendConfirmationEmail = function () {
                if (validateEmail()) {
                    failureEmailCallback(['PLEASE ENTER A VALID EMAIL ID']);
                    return;
                }
                if ($scope.shouldDisableSendConfirmationEmailBtn()) {
                    return;
                }

                var postData = {
                    "type": "confirmation",
                    "enable_confirmation_custom_text": $scope.ngData.enable_confirmation_custom_text,
                    "confirmation_custom_title": $scope.ngData.confirmation_custom_title,
                    "confirmation_custom_text": $scope.ngData.confirmation_custom_text,
                    "locale": $scope.ngData.languageData.selected_language_code
                };

                if ($scope.ngData.isGuestEmailSelected) {
                    postData.primary_email = $scope.ngData.guestEmail;
                }
                if ($scope.ngData.isBookerEmailSelected) {
                    postData.booker_email = $scope.ngData.bookerEmail;
                }

                if (!$scope.hasEmails() && $scope.ngData.sendConfirmatonMailTo) {
                    postData.primary_email = $scope.ngData.sendConfirmatonMailTo;
                }

                var reservationId = $scope.reservationData.reservation_card.reservation_id,
                    data = {
                    "postData": postData,
                    "reservationId": reservationId
                };

                $scope.invokeApi(RVReservationCardSrv.sendConfirmationEmail, data, succesfullEmailCallback, failureEmailCallback);
            };

            // Print reservation confirmation.
            $scope.printReservation = function () {
                var succesfullCallback = function succesfullCallback(data) {
                    $scope.printData = data.data;
                    printPage();
                };
                var failureCallbackPrint = function failureCallbackPrint(error) {
                    $scope.ngData.failureMessage = error[0];
                };

                $scope.callAPI(RVReservationSummarySrv.fetchResservationConfirmationPrintData, {
                    successCallBack: succesfullCallback,
                    failureCallBack: failureCallbackPrint,
                    params: {
                        'reservation_id': $scope.reservationData.reservation_card.reservation_id,
                        'locale': $scope.ngData.languageData.selected_language_code
                    }

                });
            };

            // add the print orientation after printing
            var addPrintOrientation = function addPrintOrientation() {
                var orientation = 'portrait';

                $('head').append("<style id='print-orientation'>@page { size: " + orientation + "; }</style>");
            };
            // remove the print orientation after printing
            var removePrintOrientation = function removePrintOrientation() {
                $('#print-orientation').remove();
            };

            var printPage = function printPage() {
                // add the orientation
                addPrintOrientation();

                // CICO-35320: header logo needs to be hidden.
                $("header .logo").hide();
                $("header .h2").hide();

                var onPrintCompletion = function onPrintCompletion() {
                    $timeout(function () {
                        $("header .logo").show();
                        $("header .h2").show();
                        removePrintOrientation();
                    }, 100);
                };

                $timeout(function () {
                    if (sntapp.cordovaLoaded) {
                        cordova.exec(onPrintCompletion, function () {
                            onPrintCompletion();
                        }, 'RVCardPlugin', 'printWebView', []);
                    } else {
                        $window.print();
                        onPrintCompletion();
                    }
                }, 400);
                // remove the orientation after similar delay
                $timeout(removePrintOrientation, 100);
            };

            var setAllowOverbookflag = function setAllowOverbookflag() {
                // check user permission for overbook_house
                var hasOverBookHousePermission = rvPermissionSrv.getPermissionValue('OVERBOOK_HOUSE'),
                    hasOverBookRoomTypePermission = rvPermissionSrv.getPermissionValue('OVERBOOK_ROOM_TYPE');

                $scope.allowOverbook = hasOverBookHousePermission && hasOverBookRoomTypePermission;
            };

            var promptReinstate = function promptReinstate(isAvailable, isSuite, isRoomTypeInRate) {
                setAllowOverbookflag();
                ngDialog.open({
                    template: '/assets/partials/reservation/alerts/rvReinstate.html',
                    closeByDocument: false,
                    scope: $scope,
                    data: JSON.stringify({
                        isAvailable: isAvailable,
                        isSuite: isSuite,
                        isRoomTypeInRate: isRoomTypeInRate
                    })
                });
            };

            $scope.reinstateNavigateRoomAndRates = function () {
                $scope.viewState.identifier = "REINSTATE";
                if (new TZIDate(reservationMainData.arrivalDate) < new TZIDate($rootScope.businessDate)) {
                    reservationMainData.arrivalDate = $rootScope.businessDate; // Note: that if arrival date is in the past, only select from business date onwards for booking and availability request.
                }
                $state.go(roomAndRatesState, {
                    from_date: reservationMainData.arrivalDate,
                    to_date: reservationMainData.departureDate,
                    fromState: $state.current.name,
                    company_id: reservationMainData.company.id,
                    travel_agent_id: reservationMainData.travelAgent.id
                });
                $scope.closeDialog();
            };

            $scope.reinstateReservation = function (isOverBooking) {
                $scope.invokeApi(RVReservationCardSrv.reinstateReservation,
                // Params
                {
                    reservationId: $scope.reservationData.reservation_card.reservation_id,
                    is_overbook: isOverBooking
                },
                // Handle Success
                function () {
                    $stateParams.isrefresh = true;
                    $state.reload($state.$current.name);
                    $scope.closeDialog();
                },
                // Handle Failure
                function (errorMessage) {
                    $scope.$emit('hideLoader');
                    $scope.errorMessage = errorMessage;
                });
            };

            /**
             * API call to check for availability for reinstation
             */
            $scope.checkReinstationAvailbility = function () {
                $scope.invokeApi(RVReservationCardSrv.checkReinstationAvailbility,
                // Params for API Call
                $scope.reservationData.reservation_card.reservation_id,
                // Handle Success
                function (response) {
                    $scope.$emit('hideLoader');
                    promptReinstate(response.is_available, response.is_suite_room, response.is_room_type_in_rate);
                },
                // Handle Failure
                function (errorMessage) {
                    $scope.$emit('hideLoader');
                    $scope.errorMessage = errorMessage;
                });
            };

            /**
             * Method to check if the reinstate button should be showm
             * @return {Boolean}
             */
            $scope.isReinstateVisible = function () {
                var resData = $scope.reservationData.reservation_card;

                // set not visible for Hourly in 1.11
                if ($rootScope.hotelDiaryConfig.mode === 'FULL' || resData.is_hourly_reservation || resData.group_status === "Cancel" || resData.allotment_status === "Cancel") {
                    return false;
                }

                return (resData.reservation_status === 'CANCELED' || resData.reservation_status === 'NOSHOW') && // ONLY cancelled and noshow reservations  can be reinstated
                new TZIDate(resData.departure_date) >= new TZIDate($rootScope.businessDate) && // can't reinstate if the reservation's dates have passed
                rvPermissionSrv.getPermissionValue('REINSTATE_RESERVATION'); // also check for permissions
            };

            var succesfullCallbackForEmailCancellation = function succesfullCallbackForEmailCancellation(data) {
                $scope.$emit('hideLoader');
                $scope.DailogeState.successMessage = data.message;
                $scope.DailogeState.failureMessage = '';
            };
            var failureCallbackForEmailCancellation = function failureCallbackForEmailCancellation(error) {
                $scope.$emit('hideLoader');
                $scope.DailogeState.failureMessage = error[0];
                $scope.DailogeState.successMessage = '';
            };

            // Action against email button in staycard.
            $scope.sendReservationCancellation = function (locale) {
                if ($scope.shouldDisableSendCancellationEmailBtn()) {
                    return;
                }

                var postData = {
                    "type": "cancellation",
                    "locale": locale
                };

                if ($scope.DailogeState.isGuestEmailSelected) {
                    postData.primary_email = $scope.DailogeState.guestEmail;
                }

                if ($scope.DailogeState.isBookerEmailSelected) {
                    postData.booker_email = $scope.DailogeState.bookerEmail;
                }

                if (!$scope.hasEmails() && $scope.DailogeState.sendConfirmatonMailTo) {
                    postData.primary_email = $scope.DailogeState.sendConfirmatonMailTo;
                }

                var data = {
                    "postData": postData,
                    "reservationId": $scope.reservationData.reservation_card.reservation_id
                };

                $scope.invokeApi(RVReservationCardSrv.sendConfirmationEmail, data, succesfullCallbackForEmailCancellation, failureCallbackForEmailCancellation);
            };

            $scope.onResendCancellationClicked = function () {
                $scope.DailogeState = {};
                $scope.DailogeState.isCancelled = true;
                $scope.DailogeState.failureMessage = '';
                $scope.DailogeState.successMessage = '';
                $scope.DailogeState.sendConfirmatonMailTo = '';
                $scope.DailogeState.bookerEmail = $scope.reservationData.reservation_card.booker_email;
                $scope.DailogeState.isGuestEmailSelected = false;
                $scope.DailogeState.isBookerEmailSelected = false;
                $scope.DailogeState.guestEmail = $scope.guestCardData.contactInfo.email;

                var passData = {
                    "reservationId": $scope.reservationData.reservation_card.reservation_id,
                    "details": {
                        "firstName": $scope.guestCardData.contactInfo.first_name,
                        "lastName": $scope.guestCardData.contactInfo.last_name,
                        "creditCardTypes": $scope.creditCardTypes,
                        "paymentTypes": $scope.paymentTypes
                    },
                    "isCancelled": true
                };

                $scope.passData = passData;

                var openCancellationPopup = function openCancellationPopup(data) {

                    $scope.languageData = data;
                    ngDialog.open({
                        template: '/assets/partials/reservationCard/rvCancelReservation.html',
                        controller: 'RVCancelReservation',
                        scope: $scope,
                        data: JSON.stringify({ state: 'CANCELED' })
                    });

                    $scope.$emit('hideLoader');
                };

                fetchGuestLanguages(openCancellationPopup);
            };

            // Action against print button in staycard.
            $scope.printReservationCancellation = function (locale) {
                var succesfullCallback = function succesfullCallback(data) {
                    $scope.printData = data.data;
                    printPage();
                };
                var failureCallbackPrint = function failureCallbackPrint(error) {
                    $scope.ngData.failureMessage = error[0];
                };

                $scope.callAPI(RVReservationSummarySrv.fetchResservationCancellationPrintData, {
                    successCallBack: succesfullCallback,
                    failureCallBack: failureCallbackPrint,
                    params: {
                        'reservation_id': $scope.reservationData.reservation_card.reservation_id,
                        'locale': locale
                    }
                });
            };
            $scope.putInQueueClicked = false;
            $scope.initAdvQueCheck = function () {

                var adv = $rootScope.advanced_queue_flow_enabled;
                var viaQueue = $scope.reservationData.check_in_via_queue;

                if (adv && viaQueue) {
                    $scope.putInQueueClicked = true;
                } else {
                    $scope.putInQueueClicked = false;
                }
            };
            $scope.initAdvQueCheck();
            // To enable/disable the confirmation title-text fields from UI.
            $scope.enableConfirmationCustomText = function () {
                $scope.ngData.enable_confirmation_custom_text = !$scope.ngData.enable_confirmation_custom_text;
            };

            // Set the navigation for bill and charges screen
            $scope.navigateToBillAndCharges = function () {
                $state.go('rover.reservation.staycard.billcard', {
                    reservationId: $scope.reservationData.reservation_card.reservation_id,
                    clickedButton: 'viewBillButton',
                    userId: $scope.guestCardData.userId
                });
            };

            /**
             * Refreshes the current state
             */
            var refreshStaycard = function refreshStaycard() {
                $state.reload($state.$current.name);
            };

            /**
             * Update the room status based on the selection from the popup
             */
            $scope.updateRoomStatus = function () {
                /*
                * "hkstatus_id": 1 for CLEAN
                * "hkstatus_id": 2 for INSPECTED
                * "hkstatus_id": 3 for DIRTY
                */

                var hkStatus = 3,
                    promises = [];

                if ($scope.roomStatus.isReady) {
                    if ($scope.reservationData.reservation_card.checkin_inspected_only === "true") {
                        hkStatus = 2;
                    } else {
                        hkStatus = 1;
                    }
                } else {
                    var data = {
                        "reservationId": $scope.reservationData.reservation_card.reservation_id,
                        "status": "true"
                    };

                    promises.push(RVReservationCardSrv.modifyRoomQueueStatus(data));
                }

                var requestData = {
                    room_no: $scope.reservationData.reservation_card.room_number,
                    hkstatus_id: hkStatus,
                    reservation_id: $scope.reservationData.reservation_card.reservation_id
                };

                var houseKeepingStatusUpdateSuccess = function houseKeepingStatusUpdateSuccess() {
                    refreshStaycard();
                    ngDialog.close();
                },
                    houseKeepingStatusUpdateFailure = function houseKeepingStatusUpdateFailure(errorMsg) {
                    $scope.errorMessage = errorMsg;
                    ngDialog.close();
                };

                promises.push(RVBillCardSrv.changeHousekeepingStatus(requestData));
                $q.all(promises).then(houseKeepingStatusUpdateSuccess, houseKeepingStatusUpdateFailure);
            };

            /**
             * Opens room status change popup on the success of reverse check-in
             * @return {void}
             */
            that.openRoomStatusChangePopup = function (displayText, shouldShowCloseBtn) {
                $scope.roomStatus = {
                    isReady: false
                };
                ngDialog.open({
                    template: '/assets/partials/reservationCard/rvRoomStatusChangePopup.html',
                    className: '',
                    scope: $scope,
                    closeByDocument: false,
                    closeByEscape: false,
                    data: {
                        displayText: displayText,
                        shouldShowCloseBtn: shouldShowCloseBtn
                    }
                });
            };

            /**
             * Perform reverse check-in process
             * @return {void}
             */
            $scope.performReverseCheckIn = function () {
                var onSuccess = function onSuccess() {
                    that.openRoomStatusChangePopup('CHECK_IN_REVERSED', false);
                },
                    onFailure = function onFailure(errorMsg) {
                    $scope.errorMessage = errorMsg;
                };

                $scope.callAPI(RVReservationCardSrv.reverseCheckIn, {
                    successCallBack: onSuccess,
                    failureCallBack: onFailure,
                    params: {
                        reservationId: $scope.reservationData.reservation_card.reservation_id
                    }
                });
            };

            /**
             * Close the active popup
             */
            $scope.closeErrorDialog = function () {
                ngDialog.close();
            };

            /**
             * Should disable the send mail btn in email confirmation popup
             */
            $scope.shouldDisableSendConfirmationEmailBtn = function () {
                return !$scope.ngData.languageData.selected_language_code || !$scope.ngData.isGuestEmailSelected && !$scope.ngData.isBookerEmailSelected && !$scope.ngData.sendConfirmatonMailTo;
            };

            /**
             * Should disable the send email btn in the cancellation popup
             * @param {String} locale - locale chosen from the popup
             */
            $scope.shouldDisableSendCancellationEmailBtn = function () {
                return !$scope.DailogeState.isGuestEmailSelected && !$scope.DailogeState.isBookerEmailSelected && !$scope.DailogeState.sendConfirmatonMailTo;
            };
        }]);
    }, {}] }, {}, [1]);