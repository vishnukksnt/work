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
        angular.module('sntRover').controller('RVContactInfoController', ['$scope', '$rootScope', 'RVContactInfoSrv', 'ngDialog', 'dateFilter', '$timeout', 'RVSearchSrv', '$stateParams', 'rvPermissionSrv', 'RVReservationCardSrv', '$state', 'RVGuestCardsSrv', 'rvUtilSrv', function ($scope, $rootScope, RVContactInfoSrv, ngDialog, dateFilter, $timeout, RVSearchSrv, $stateParams, rvPermissionSrv, RVReservationCardSrv, $state, RVGuestCardsSrv, rvUtilSrv) {
            BaseCtrl.call(this, $scope);
            var initialGuestCardData;

            GuestCardBaseCtrl.call(this, $scope, RVSearchSrv, RVContactInfoSrv, rvPermissionSrv, $rootScope);

            var reservationDetailsState = 'rover.reservation.staycard.reservationcard.reservationdetails';

            /**
             * storing to check if data will be updated
             */
            var presentContactInfo = JSON.parse(JSON.stringify($scope.guestCardData.contactInfo)),
                dataToUpdate;

            $scope.errorMessage = '';

            $scope.$on('clearNotifications', function () {
                $scope.successMessage = '';
                $scope.$emit('contactInfoError', false);
            });
            // to reset current data in contcat info for determining any change
            $scope.$on('RESETCONTACTINFO', function (event, data) {
                presentContactInfo.address = data.address;
                presentContactInfo.phone = data.phone;
                presentContactInfo.email = data.email;
                presentContactInfo.first_name = data.first_name;
                presentContactInfo.last_name = data.last_name;
            });

            /**
             * when guest card creation failed
             * @param  {array} errorMessage
             */
            var failureOfCreateGuestCard = function failureOfCreateGuestCard(errorMessage) {
                $scope.$emit('hideLoader');
                $scope.errorMessage = errorMessage;
                $scope.saveGuestCardInfoInProgress = false;
            };
            var saveUserInfoSuccessCallback = function saveUserInfoSuccessCallback(data) {
                if (data.mandatory_field_missing_message !== '' && data.mandatory_field_missing_message !== null) {
                    $scope.errorMessage = data.mandatory_field_missing_message;
                    $scope.$emit('contactInfoError', true);
                }
                /**
                 *  CICO-9169
                 *  Guest email id is not checked when user adds Guest details in the Payment page of Create reservation
                 *  -- To have the primary email id in app/assets/rover/partials/reservation/rvSummaryAndConfirm.html checked if the user attached has one!
                 */
                if ($scope.reservationData) {
                    $scope.reservationData.guest.email = $scope.guestCardData.contactInfo.email;

                    if ($scope.reservationData.guest.email && $scope.reservationData.guest.email.length > 0) {
                        $scope.otherData.isGuestPrimaryEmailChecked = true;
                    } else {
                        // Handles cases where Guest with email is replaced with a Guest w/o an email address!
                        $scope.otherData.isGuestPrimaryEmailChecked = false;
                    }
                }

                // CICO-9169

                var avatarImage = getAvatharUrl($scope.guestCardData.contactInfo.title);

                $scope.$emit('CHANGEAVATAR', avatarImage);
                // to reset current data in header info for determining any change
                $scope.$emit('RESETHEADERDATA', $scope.guestCardData.contactInfo);
                $scope.updateSearchCache(avatarImage);
                $scope.$emit('hideLoader');
            };
            var saveUserInfoFailureCallback = function saveUserInfoFailureCallback(data) {
                $scope.$emit('hideLoader');
                $scope.errorMessage = data;
                $scope.$emit('GUESTCARDVISIBLE', true);
                $scope.$emit('contactInfoError', true);
            };

            /**
             * Attaches a primary/accompany guest to a reservation
             * @param {Number} guestId identifier for guest
             * @param {Boolean} isPrimary should be attaced as a primary/accompany guest
             * @return {void}
             */
            var attachGuestToReservation = function attachGuestToReservation(reservationId, guestId, isPrimary, guestType) {
                var onGuestLinkedToReservationSuccess = function onGuestLinkedToReservationSuccess() {};

                $scope.callAPI(RVReservationCardSrv.attachGuestToReservation, {
                    onSuccess: onGuestLinkedToReservationSuccess,
                    params: {
                        reservation_id: reservationId,
                        guest_detail_id: guestId,
                        is_primary: isPrimary,
                        guest_type: guestType
                    }
                });
            };

            // This method needs a refactor:|
            $scope.saveContactInfo = function (newGuest) {
                var createUserInfoSuccessCallback = function createUserInfoSuccessCallback(data) {
                    if (data.mandatory_field_missing_message !== '' && data.mandatory_field_missing_message !== null) {
                        $scope.errorMessage = data.mandatory_field_missing_message;
                        $scope.$emit('contactInfoError', true);
                    }
                    $scope.$emit('hideLoader');
                    if (typeof $scope.guestCardData.contactInfo.user_id === 'undefined' || $scope.guestCardData.userId === '' || $scope.guestCardData.userId === null || typeof $scope.guestCardData.userId === 'undefined') {
                        if ($scope.viewState.identifier === 'STAY_CARD' || $scope.viewState.identifier === 'CREATION' && $scope.viewState.reservationStatus.confirm) {
                            $scope.viewState.pendingRemoval.status = false;
                            $scope.viewState.pendingRemoval.cardType = '';
                            if ($scope.reservationDetails.guestCard.futureReservations <= 0) {
                                $scope.replaceCardCaller('guest', {
                                    id: data.id
                                }, false);
                            } else {
                                $scope.checkFuture('guest', {
                                    id: data.id
                                });
                            }
                        }
                    }
                    // TODO : Reduce all these places where guestId is kept and used to just ONE
                    $scope.guestCardData.contactInfo.user_id = data.id;

                    if ($scope.reservationDetails) {
                        $scope.reservationDetails.guestCard.id = data.id;
                        $scope.reservationDetails.guestCard.futureReservations = 0;
                    }

                    // dirty fix for handling multiple api call being made
                    $scope.saveGuestCardInfoInProgress = false;

                    if ($scope.reservationData && $scope.reservationData.guest) {
                        $scope.reservationData.guest.id = data.id;
                        $scope.reservationData.guest.firstName = $scope.guestCardData.contactInfo.first_name;
                        $scope.reservationData.guest.lastName = $scope.guestCardData.contactInfo.last_name;
                        // TODO : Check if this is needed here

                        $scope.reservationData.guest.phone = $scope.guestCardData.contactInfo.phone;
                        $scope.reservationData.guest.mobile = $scope.guestCardData.contactInfo.mobile;
                        $scope.reservationData.guest.is_vip = $scope.guestCardData.contactInfo.vip;
                        $scope.reservationData.guest.email = $scope.guestCardData.contactInfo.email;
                        $scope.reservationData.guest.image = $scope.guestCardData.contactInfo.avatar;
                        $scope.reservationData.guest.address = $scope.guestCardData.contactInfo.address;

                        $scope.reservationData.guest.loyaltyNumber = $scope.guestLoyaltyNumber;
                        if ($state.current.name !== reservationDetailsState && $scope.reservationData.reservationId) {
                            attachGuestToReservation($scope.reservationData.reservationId, $scope.reservationData.guest.id, true);
                        }
                    }
                    $scope.guestCardData.userId = data.id;
                    if (!$scope.isGuestCardFromMenu) {
                        $scope.showGuestPaymentList($scope.guestCardData.contactInfo);
                    }
                    $scope.newGuestAdded(data.id);
                    if ($scope.errorMessage === '' && $state.current.name !== 'rover.guest.details') {
                        $scope.closeGuestCard();
                    }

                    // CICO-51598 - Should allow the guest card to delete immediately after creation
                    $scope.guestCardData.contactInfo.can_guest_details_anonymized = true;
                    $scope.guestCardData.contactInfo.can_guest_card_delete = true;

                    if ($stateParams.fromStaycard && !$stateParams.guestId) {
                        attachGuestToReservation($stateParams.reservationId, data.id, $stateParams.isPrimary, $stateParams.guestType);
                    }
                };

                /**
                 * change date format for API call
                 */
                presentContactInfo = RVContactInfoSrv.completeContactInfoClone ? JSON.parse(JSON.stringify(RVContactInfoSrv.completeContactInfoClone)) : {};

                var dataToUpdate = JSON.parse(JSON.stringify($scope.guestCardData.contactInfo));
                var dataUpdated = false;

                if (angular.equals(dataToUpdate, presentContactInfo)) {
                    dataUpdated = true;
                } else {

                    RVContactInfoSrv.completeContactInfoClone = JSON.parse(JSON.stringify(dataToUpdate));
                    // change date format to be send to API
                    if ($scope.guestCardData.contactInfo.birthday) {
                        dataToUpdate.birthday = moment($scope.guestCardData.contactInfo.birthday).format("MM-DD-YYYY");
                    } else {
                        dataToUpdate.birthday = null;
                    }
                    if ($scope.guestCardData.contactInfo.id_issue_date) {
                        dataToUpdate.id_issue_date = moment($scope.guestCardData.contactInfo.id_issue_date).format("YYYY-MM-DD");
                    } else {
                        dataToUpdate.id_issue_date = null;
                    }
                    if ($scope.guestCardData.contactInfo.entry_date) {
                        dataToUpdate.entry_date = moment($scope.guestCardData.contactInfo.entry_date).format("YYYY-MM-DD");
                    } else {
                        dataToUpdate.entry_date = null;
                    }
                    if ($scope.guestCardData.contactInfo.id_expiration_date) {
                        dataToUpdate.id_expiration_date = moment($scope.guestCardData.contactInfo.id_expiration_date).format("YYYY-MM-DD");
                    } else {
                        dataToUpdate.id_expiration_date = null;
                    }
                    var unwantedKeys = ['guestImageBase64']; // remove unwanted keys for API

                    if (dataToUpdate.birthday === "Invalid date") {
                        dataToUpdate.birthday = null;
                        $scope.guestCardData.contactInfo.birthday = null;
                    }
                    // For guest photo upload
                    dataToUpdate.avatar = dataToUpdate.guestImageBase64 ? dataToUpdate.guestImageBase64 : "";
                    dataToUpdate = dclone(dataToUpdate, unwantedKeys);
                }

                if (typeof dataToUpdate.address === 'undefined') {
                    dataToUpdate.address = {};
                }

                var userId = $scope.guestCardData.userId || $scope.guestCardData.contactInfo.user_id;

                if (dataToUpdate.email !== "" && !rvUtilSrv.isEmailValid(dataToUpdate.email)) {
                    $timeout(function () {
                        $scope.guestCardData.contactInfo.email = $scope.reservationData.guest.email;
                    }, 100);
                }
                var data = {
                    'data': dataToUpdate,
                    'userId': userId
                };

                if (_.isUndefined($scope.viewState.identifier)) {
                    data.data.current_page = 'always';
                } else {
                    data.data.current_page = $scope.viewState.identifier === 'CREATION' || $scope.viewState.identifier === 'CONFIRM' ? 'at_booking' : 'at_checkin';
                }

                $scope.invokeApi(RVGuestCardsSrv.fetchGuestAdminSettings, '', function (adminSettings) {
                    data.data.guest_admin_settings = adminSettings;

                    // CICO-49153 - Added the additional check for user_id in the request params to prevent duplicate guest creation
                    if (newGuest && !dataToUpdate.user_id) {
                        if (typeof data.data.is_opted_promotion_email === 'undefined') {
                            data.data.is_opted_promotion_email = false;
                        }
                        if ($stateParams.guestType) {
                            data.data.guest_type = $stateParams.guestType;
                        }
                        $scope.invokeApi(RVContactInfoSrv.createGuest, data, createUserInfoSuccessCallback, failureOfCreateGuestCard);
                    } else if (!dataUpdated) {
                        if (!angular.equals(dataToUpdate, initialGuestCardData)) {
                            // CICO-46709 - Reset the guest card data to reflect the new changes made to contact details
                            initialGuestCardData = dclone(dataToUpdate, ['confirmation_num']);
                            if ($scope.isGuestCardVisible || $scope.isFromMenuGuest) {
                                $scope.invokeApi(RVContactInfoSrv.updateGuest, data, saveUserInfoSuccessCallback, saveUserInfoFailureCallback);
                            }
                        }
                    }
                }, function () {});
            };

            /**
             * to handle click actins outside this tab
             */
            $scope.$on('saveContactInfo', function () {
                $scope.errorMessage = '';
                if ($scope.reservationData && !$scope.reservationData.guest.id && !$scope.guestCardData.contactInfo.user_id || $scope.viewState.isAddNewCard) {
                    // dirty fix until we refactor the whole staycard/card
                    // isGuestCardSaveInProgress - variable in guestcontroller to prevent the api call while clicking outside
                    if (!$scope.saveGuestCardInfoInProgress && !$scope.isGuestCardSaveInProgress) {
                        $scope.saveGuestCardInfoInProgress = true;
                        $scope.saveContactInfo(true);
                    }
                } else {
                    if (!$scope.isGuestCardSaveInProgress) {
                        $scope.saveContactInfo();
                    }
                }
            });

            $scope.$on('updateEmailFromGMS', function (e, email) {
                $scope.guestCardData.contactInfo.email = email;
                var dataToUpdate = JSON.parse(JSON.stringify($scope.guestCardData.contactInfo)),
                    data = {
                    'data': dataToUpdate,
                    'userId': $scope.guestCardData.contactInfo.user_id
                };

                $scope.invokeApi(RVContactInfoSrv.updateGuest, data, saveUserInfoSuccessCallback, saveUserInfoFailureCallback);
            });

            // Error popup
            $scope.$on('showSaveMessage', function () {
                $scope.errorMessage = ['Please save the Guest Card first'];
            });

            $scope.popupCalendarForGuestContactInfoDate = function (calenderFor) {
                $scope.calenderFor = calenderFor;
                ngDialog.open({
                    template: '/assets/partials/guestCard/contactInfoCalendarPopup.html',
                    controller: 'RVAllContactInfoDatePickerController',
                    className: 'single-date-picker',
                    scope: $scope
                });
            };

            $scope.setScroller('contact_info');

            var refreshContactsScroll = function refreshContactsScroll() {
                $timeout(function () {
                    $scope.refreshScroller('contact_info');
                }, 700);
            };

            $scope.$on('CONTACTINFOLOADED', refreshContactsScroll);
            $scope.$on('REFRESHLIKESSCROLL', refreshContactsScroll);

            var successCallBackForLanguagesFetch = function successCallBackForLanguagesFetch(data) {
                $scope.$emit('hideLoader');
                $scope.languageData = data;
            };

            /**
             * Fetch the guest languages list and settings
             * @return {undefined}
             */
            var fetchGuestLanguages = function fetchGuestLanguages() {
                // call api
                $scope.invokeApi(RVContactInfoSrv.fetchGuestLanguages, {}, successCallBackForLanguagesFetch);
            };

            var init = function init() {
                // Fetch languages
                fetchGuestLanguages();
                var unwantedKeys = ['confirmation_num']; // remove unwanted keys for API

                initialGuestCardData = dclone($scope.guestCardData.contactInfo, unwantedKeys);
                $scope.hasPermissionToFlagGuest = rvPermissionSrv.getPermissionValue('FLAG_GUEST');
            };

            // This is to update the stay count after reservation guest details api is resolved
            // This is needed because there is no staycount in the guest details section in reservation details api response
            // CICO-57790
            var stayCountUpdateListener = $scope.$on('UPDATE_STAY_COUNT', function (event, data) {
                initialGuestCardData.stayCount = data.stayCount;
            });

            // Destroy the listener
            $scope.$on('$destroy', stayCountUpdateListener);

            /**
             * Get the style class for the contact info tab contents during print
             * @param {String} value - value of the input control
             * @param {String} defaultStyleClass default style class
             * @return {String} calculated style class
             */
            $scope.getStyleClassForPrint = function (value, defaultStyleClass) {
                defaultStyleClass = defaultStyleClass || '';

                if (value === "" || value === null || _.isUndefined(value)) {
                    defaultStyleClass = defaultStyleClass + ' no-print';
                }

                return defaultStyleClass;
            };

            /**
             * Toggle the blacklist flag upon click
             */
            $scope.onBlackListToggle = function () {
                $scope.guestCardData.contactInfo.is_flagged = !$scope.guestCardData.contactInfo.is_flagged;

                if (!$scope.guestCardData.contactInfo.is_flagged) {
                    $scope.guestCardData.contactInfo.flagged_reason = '';
                }
            };

            $scope.addMarginClass = function () {
                if ($scope.guestCardData.contactInfo.guest_admin_settings.id_place_of_issue.is_visible) {
                    if (!$("#place-of-issue").hasClass('margin')) {
                        return true;
                    }
                }
            };

            $scope.addMarginClassForExpirationDate = function () {
                if ($scope.guestCardData.contactInfo.guest_admin_settings.id_country_of_issue.is_visible) {
                    if (!$("#country-of-issue").hasClass('margin')) {
                        return true;
                    }
                } else {
                    var isMargin = $scope.addMarginClass();

                    return isMargin;
                }
            };

            $scope.addMarginClassForEntryDate = function () {
                if ($scope.guestCardData.contactInfo.guest_admin_settings.id_expiration_date.is_visible) {
                    if (!$("#expiry-date").hasClass('margin')) {
                        return true;
                    }
                } else {
                    var isMargin = $scope.addMarginClassForExpirationDate();

                    return isMargin;
                }
            };

            init();
        }]);
    }, {}] }, {}, [1]);