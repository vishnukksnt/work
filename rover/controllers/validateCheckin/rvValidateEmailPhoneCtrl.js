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
        sntRover.controller('RVValidateEmailPhoneCtrl', ['$rootScope', '$scope', '$state', '$timeout', 'ngDialog', 'RVValidateCheckinSrv', 'RVGuestCardsSrv', function ($rootScope, $scope, $state, $timeout, ngDialog, RVValidateCheckinSrv, RVGuestCardsSrv) {
            BaseCtrl.call(this, $scope);

            $scope.showEmail = $scope.guestCardData.contactInfo.email === undefined || $scope.guestCardData.contactInfo.email === '' || $scope.guestCardData.contactInfo.email === null;
            $scope.showPhone = $scope.guestCardData.contactInfo.phone === undefined || $scope.guestCardData.contactInfo.phone === '' || $scope.guestCardData.contactInfo.phone === null;
            $scope.showMobile = $scope.guestCardData.contactInfo.mobile === undefined || $scope.guestCardData.contactInfo.mobile === '' || $scope.guestCardData.contactInfo.mobile === null;
            $scope.showNationality = ($scope.guestCardData.contactInfo.guest_admin_settings.nationality.is_mandatory_on_guest_card_creation || $scope.roverObj.forceNationalityAtCheckin) && ($scope.guestCardData.contactInfo.nationality_id === undefined || $scope.guestCardData.contactInfo.nationality_id === "" || $scope.guestCardData.contactInfo.nationality_id === null);
            $scope.showCountry = !$scope.guestCardData.contactInfo.address || $scope.guestCardData.contactInfo.address.country_id === undefined || $scope.guestCardData.contactInfo.address.country_id === "" || $scope.guestCardData.contactInfo.address.country_id === null;

            var showNationality = $scope.showNationality,
                showCountry = $scope.showCountry;

            $scope.saveData = {};
            $scope.saveData.email = "";
            $scope.saveData.phone = "";
            $scope.saveData.guest_id = "";
            $scope.saveData.user_id = "";
            $scope.saveData.gender_id = $scope.guestCardData.contactInfo.gender_id;
            $scope.guestCardData.contactInfo.genderTypeList = $scope.guestCardData.contactInfo.gender_list;

            $scope.putInQueue = false;

            $scope.setScroller('guestCardFields');

            var init = function init() {
                $timeout(function () {
                    $scope.refreshScroller('guestCardFields');
                }, 1500);
            };

            $scope.popupCalendar = function (calenderFor) {
                $scope.calenderFor = calenderFor;
                $scope.datePicker = ngDialog.open({
                    template: '/assets/partials/guestCard/contactInfoCalendarPopup.html',
                    controller: 'RVAllContactInfoDatePickerController',
                    className: 'single-date-picker',
                    scope: $scope
                });
            };

            // CICO-13907
            $scope.hasAnySharerCheckedin = function () {
                var isSharerCheckedin = false;

                angular.forEach($scope.reservationData.reservation_card.sharer_information, function (sharer, key) {
                    if (sharer.reservation_status === 'CHECKEDIN' || sharer.reservation_status === 'CHECKING_OUT') {
                        isSharerCheckedin = true;
                        return false;
                    }
                });
                return isSharerCheckedin;
            };

            $scope.clickCancel = function () {
                ngDialog.close();
            };

            $scope.checkGuestInFromQueue = false;
            $scope.putGuestInQueue = false;
            if (!$rootScope.reservationQueueWatch) {
                // alternative to $destroy, this is an init-once method
                $rootScope.reservationQueueWatch = 1;

                $rootScope.$on('putGuestInQueue', function () {
                    $scope.putGuestInQueue = true;
                    $rootScope.putGuestInQueue = true;

                    $scope.checkGuestInFromQueue = false;
                    $rootScope.checkGuestInFromQueue = false;
                });
                $rootScope.$on('checkGuestInFromQueue', function () {
                    $scope.checkGuestInFromQueue = true;
                    $rootScope.checkGuestInFromQueue = true;

                    $scope.putGuestInQueue = false;
                    $rootScope.putGuestInQueue = false;
                });
                $rootScope.$on('normalCheckInNotQueued', function () {
                    $scope.checkGuestInFromQueue = false;
                    $rootScope.checkGuestInFromQueue = false;

                    $scope.putGuestInQueue = false;
                    $rootScope.putGuestInQueue = false;
                });
            }
            $scope.validateEmailPhoneSuccessCallback = function (result) {
                if (result.response.mandatory_field_missing_message !== '' && result.response.mandatory_field_missing_message !== null) {
                    $scope.errorMessage = result.response.mandatory_field_missing_message;
                    $scope.$emit('parentShowError', $scope.errorMessage);
                }

                if ($scope.showPhone) {
                    $scope.guestCardData.contactInfo.phone = $scope.saveData.phone;
                }
                if ($scope.showEmail) {
                    $scope.guestCardData.contactInfo.email = $scope.saveData.email;
                }
                if ($scope.showMobile) {
                    $scope.guestCardData.contactInfo.mobile = $scope.saveData.mobile;
                }
                if ($scope.showNationality) {
                    $scope.guestCardData.contactInfo.nationality_id = $scope.saveData.nationality_id;
                }
                if ($scope.showCountry) {
                    try {
                        $scope.guestCardData.contactInfo.address.country_id = $scope.saveData.address.country_id;
                    } catch (err) {
                        $scope.guestCardData.contactInfo.address = {};
                        $scope.guestCardData.contactInfo.address.country_id = $scope.saveData.address.country_id;
                    }
                }
                if ($scope.showJobTitle) {
                    $scope.guestCardData.contactInfo.job_title = $scope.saveData.job_title;
                }
                if ($scope.showNameOfFather) {
                    $scope.guestCardData.contactInfo.father_name = $scope.saveData.father_name;
                }
                if ($scope.showNameOfMother) {
                    $scope.guestCardData.contactInfo.mother_name = $scope.saveData.mother_name;
                }
                if ($scope.showPlaceOfBirth) {
                    $scope.guestCardData.contactInfo.birth_place = $scope.saveData.birth_place;
                }
                if ($scope.showGender) {
                    $scope.guestCardData.contactInfo.gender_id = $scope.saveData.gender_id;
                }
                if ($scope.showPersonalIdNumber) {
                    $scope.guestCardData.contactInfo.personal_id_no = $scope.saveData.personal_id_no;
                }
                if ($scope.showVehicleRegistrationNumber) {
                    $scope.guestCardData.contactInfo.vehicle_registration_number = $scope.saveData.vehicle_registration_number;
                }
                if ($scope.showIdPlaceOfIssue) {
                    $scope.guestCardData.contactInfo.id_place_of_issue = $scope.saveData.id_place_of_issue;
                }
                if ($scope.showIdCountryOfIssue) {
                    $scope.guestCardData.contactInfo.id_country_id = $scope.saveData.id_country_id;
                }
                if ($scope.showHomeTown) {
                    $scope.guestCardData.contactInfo.home_town = $scope.saveData.home_town;
                }
                if ($scope.showPlaceOfResidence) {
                    $scope.guestCardData.contactInfo.place_of_residence = $scope.saveData.place_of_residence;
                }
                if ($scope.showVehicleCountryMark) {
                    $scope.guestCardData.contactInfo.country_code = $scope.saveData.country_code;
                }
                if ($scope.showDateOfBirth) {
                    $scope.guestCardData.contactInfo.birth_day = $scope.saveData.birth_day;
                }
                if ($scope.showIdExpDate) {
                    $scope.guestCardData.contactInfo.id_expiration_date = $scope.saveData.id_expiration_date;
                }
                $scope.$emit('hideLoader');
                ngDialog.close();
                $scope.goToNextView();
            };
            $scope.reservationIsQueued = function () {
                // checks current reservation data to see if it is in Queue or not
                if ($scope.reservationData.reservation_card.is_reservation_queued === 'true') {
                    return true;
                } else return false;
            };
            $scope.roomAssignmentNeeded = function () {
                if ($scope.reservationData.reservation_card.room_number === '' || $scope.reservationData.reservation_card.room_ready_status === 'DIRTY' || $scope.reservationData.reservation_card.room_status !== 'READY' || $scope.reservationData.reservation_card.fo_status !== 'VACANT') {

                    if ($scope.reservationData.reservation_card.room_number === '' && ($scope.reservationIsQueued() || $scope.putInQueue)) {
                        return true;
                    }
                    if ($scope.reservationData.reservation_card.room_status === 'NOTREADY' && ($scope.reservationIsQueued() || $scope.putInQueue)) {
                        return false;
                    }

                    return true;
                } else return false;
            };
            $scope.upsellNeeded = function () {
                if ($scope.reservationData.reservation_card.is_force_upsell === "true" && $scope.reservationData.reservation_card.is_upsell_available === "true") {

                    if ($scope.putInQueue) {
                        return true; // go to room upgrade if adding to queue
                    } else if ($scope.reservationIsQueued()) {
                        return false; // skip if already in queue and checking in
                    }

                    return true;
                } else return false;
            };
            $scope.readyToPutInQueue = function () {
                if (($scope.putGuestInQueue || $rootScope.putGuestInQueue) && !$scope.roomAssignmentNeeded() && !$scope.upsellNeeded() && !$scope.checkGuestInFromQueue) {
                    return true;
                } else return false;
            };

            $scope.goToRoomAssignment = function () {
                var reservationStatus = $scope.reservationData.reservation_card.reservation_status;
                var isUpgradeAvaiable = $scope.reservationData.reservation_card.is_upsell_available === "true" && (reservationStatus === 'RESERVED' || reservationStatus === 'CHECKING_IN');

                var cannotMoveState = $scope.reservationData.reservation_card.cannot_move_room && $scope.reservationData.reservation_card.room_number !== "";

                $state.go("rover.reservation.staycard.roomassignment", {
                    "reservation_id": $scope.reservationData.reservation_card.reservation_id,
                    "room_type": $scope.reservationData.reservation_card.room_type_code,
                    "clickedButton": "checkinButton",
                    "upgrade_available": isUpgradeAvaiable,
                    "cannot_move_room": cannotMoveState,
                    "roomTypeId": $scope.reservationData.reservation_card.room_type_id
                });
            };
            $scope.goToUpgrades = function () {
                $state.go('rover.reservation.staycard.upgrades', {
                    "reservation_id": $scope.reservationData.reservation_card.reservation_id,
                    "clickedButton": "checkinButton"
                });
            };
            $scope.goToBillCard = function () {
                $state.go('rover.reservation.staycard.billcard', {
                    "reservationId": $scope.reservationData.reservation_card.reservation_id,
                    "clickedButton": "checkinButton"
                });
            };
            $scope.emitPutGuestInQueue = function () {
                if ($scope.putGuestInQueue) {
                    setTimeout(function () {
                        $rootScope.$emit('putGuestInQueue');
                    }, 1000);
                }
            };
            $scope.goToNextView = function () {
                if ($scope.hasAnySharerCheckedin() || $scope.checkGuestInFromQueue) {
                    // straight to signature, skip room upgrades CICO-19673
                    $scope.goToBillCard();
                } else if ($scope.roomAssignmentNeeded()) {
                    // TO DO:Go to room assignemt viw
                    $scope.goToRoomAssignment();
                    $scope.emitPutGuestInQueue();
                } else if ($scope.upsellNeeded() && !$scope.checkGuestInFromQueue && !$scope.reservationData.reservation_card.is_suite) {
                    // TO DO : GO TO ROOM UPGRAFED VIEW
                    $scope.goToUpgrades();
                    $scope.emitPutGuestInQueue();
                } else {
                    $scope.goToBillCard();
                }
            };
            $scope.submitAndGoToCheckin = function () {

                if ($scope.shouldEnableSubmitButton() && $scope.isDemographicsFormValid()) {
                    $scope.saveData.guest_id = $scope.guestCardData.guestId;
                    $scope.saveData.user_id = $scope.guestCardData.userId;
                    var isValidDataExist = false;

                    if ($scope.showEmail && $scope.showPhone && $scope.showMobile) {
                        $scope.saveData = $scope.saveData;
                        if ($scope.saveData.email !== '' || $scope.saveData.phone !== '' || $scope.saveData.mobile !== '') {
                            isValidDataExist = true;
                        }
                    } else if ($scope.showPhone && $scope.showMobile) {
                        var unwantedKeys = ["email"]; // remove unwanted keys for API

                        $scope.saveData = dclone($scope.saveData, unwantedKeys);
                        if ($scope.saveData.phone !== '' || $scope.saveData.mobile !== '') {
                            isValidDataExist = true;
                        }
                    } else if ($scope.showEmail && $scope.showMobile) {
                        var unwantedKeys = ["phone"]; // remove unwanted keys for API

                        $scope.saveData = dclone($scope.saveData, unwantedKeys);
                        if ($scope.saveData.phone !== '' || $scope.saveData.mobile !== '') {
                            isValidDataExist = true;
                        }
                    } else if ($scope.showEmail && $scope.showPhone) {
                        var unwantedKeys = ["mobile"]; // remove unwanted keys for API

                        $scope.saveData = dclone($scope.saveData, unwantedKeys);
                        if ($scope.saveData.phone !== '' || $scope.saveData.mobile !== '') {
                            isValidDataExist = true;
                        }
                    } else if ($scope.showEmail) {
                        var unwantedKeys = ["mobile", "phone"]; // remove unwanted keys for API

                        $scope.saveData = dclone($scope.saveData, unwantedKeys);
                        if ($scope.saveData.phone !== '' || $scope.saveData.mobile !== '') {
                            isValidDataExist = true;
                        }
                    } else if ($scope.showPhone) {
                        var unwantedKeys = ["mobile", "email"]; // remove unwanted keys for API

                        $scope.saveData = dclone($scope.saveData, unwantedKeys);
                        if ($scope.saveData.phone !== '' || $scope.saveData.mobile !== '') {
                            isValidDataExist = true;
                        }
                    } else {
                        var unwantedKeys = ["phone", "email"]; // remove unwanted keys for API

                        $scope.saveData = dclone($scope.saveData, unwantedKeys);
                        if ($scope.saveData.email !== '') {
                            isValidDataExist = true;
                        }
                    }

                    if ($scope.showNationality) {
                        $scope.saveData.nationality_id = $scope.guestCardData.contactInfo.nationality_id;
                        isValidDataExist = true;
                    }

                    if ($scope.showCountry) {
                        $scope.saveData.address = {};

                        $scope.saveData.address.country_id = $scope.guestCardData.contactInfo.address ? $scope.guestCardData.contactInfo.address.country_id : "";
                        isValidDataExist = true;
                    }

                    $scope.saveData.reservationId = $scope.reservationParentData.reservationId;

                    if ($scope.reservationParentData.demographics.reservationType) {
                        $scope.saveData.reservation_type_id = $scope.reservationParentData.demographics.reservationType;
                    }

                    if ($scope.reservationParentData.demographics.source) {
                        $scope.saveData.source_id = $scope.reservationParentData.demographics.source;
                    }

                    if ($scope.reservationParentData.demographics.market) {
                        $scope.saveData.market_segment_id = $scope.reservationParentData.demographics.market;
                    }

                    if ($scope.reservationParentData.demographics.origin) {
                        $scope.saveData.booking_origin_id = $scope.reservationParentData.demographics.origin;
                    }

                    if ($scope.reservationParentData.demographics.segment) {
                        $scope.saveData.segment_id = $scope.reservationParentData.demographics.segment;
                    }

                    if (isValidDataExist) {
                        // CICO-15079 : Validation for phone/email data being blank.
                        $scope.invokeApi(RVGuestCardsSrv.fetchGuestAdminSettings, '', function (adminSettings) {
                            var saveData = angular.copy($scope.saveData);

                            saveData.guest_admin_settings = adminSettings;
                            $scope.invokeApi(RVValidateCheckinSrv.saveGuestDataAndReservationDemographics, saveData, $scope.validateEmailPhoneSuccessCallback);
                        });
                    } else {
                        $scope.errorMessage = ["Please fill the fields"];
                    }
                }
            };
            $scope.submitAndCheckinSuccessCallback = function (result) {
                if (result.response.mandatory_field_missing_message !== '' && result.response.mandatory_field_missing_message !== null) {
                    $scope.errorMessage = result.response.mandatory_field_missing_message;
                    $scope.$emit('parentShowError', $scope.errorMessage);
                }
                $scope.guestCardData.contactInfo.email = $scope.saveData.email;
                $scope.$emit('hideLoader');
                ngDialog.close();
            };
            $scope.submitAndCheckin = function () {
                $scope.saveData.guest_id = $scope.guestCardData.guestId;
                $scope.saveData.user_id = $scope.guestCardData.userId;
                var unwantedKeys = ["phone"]; // remove unwanted keys for API

                $scope.saveData = dclone($scope.saveData, unwantedKeys);
                // CICO-63407 - Exclude the update of the demographics in the service
                $scope.saveData.ignoreDemographicsUpdate = true;
                $scope.invokeApi(RVGuestCardsSrv.fetchGuestAdminSettings, '', function (adminSettings) {
                    var saveData = angular.copy($scope.saveData);

                    saveData.guest_admin_settings = adminSettings;
                    $scope.invokeApi(RVValidateCheckinSrv.saveGuestDataAndReservationDemographics, saveData, $scope.submitAndCheckinSuccessCallback);
                });
            };
            /* 
             * close dialog box and reset values added
             */
            $scope.closeDialog = function () {
                if (showNationality) {
                    $scope.saveData.nationality_id = "";
                    $scope.guestCardData.contactInfo.nationality_id = "";
                }
                if (showCountry) {
                    $scope.saveData.country_id = "";
                    try {
                        $scope.guestCardData.contactInfo.address.country_id = "";
                    } catch (err) {
                        $scope.guestCardData.contactInfo.address = {};
                        $scope.guestCardData.contactInfo.address.country_id = "";
                    }
                }
                ngDialog.close();
            };
            $scope.ignoreAndGoToCheckin = function () {
                $scope.closeDialog();
                $scope.goToNextView();
            };
            /*
             * Enable submit button based on data
             */
            $scope.shouldEnableSubmitButton = function () {
                if ($rootScope.roverObj.forceCountryAtCheckin && $rootScope.roverObj.forceNationalityAtCheckin) {
                    return _.isFinite($scope.guestCardData.contactInfo.nationality_id) && _.isFinite($scope.guestCardData.contactInfo.address.country_id);
                } else if ($rootScope.roverObj.forceCountryAtCheckin) {
                    return _.isFinite($scope.guestCardData.contactInfo.address.country_id);
                } else if ($rootScope.roverObj.forceNationalityAtCheckin) {
                    return _.isFinite($scope.guestCardData.contactInfo.nationality_id);
                } else {
                    return true;
                }
            };

            $scope.initAdvQueCheck = function () {
                var adv = $rootScope.advanced_queue_flow_enabled;
                var viaQueue = $scope.reservationData.check_in_via_queue;

                if (adv && viaQueue) {
                    $scope.putInQueue = true;
                } else {
                    $scope.putInQueue = false;
                }
            };
            $scope.initAdvQueCheck();
            $scope.$emit('hideLoader');
            init();
        }]);
    }, {}] }, {}, [1]);