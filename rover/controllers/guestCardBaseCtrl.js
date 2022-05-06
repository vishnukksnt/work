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
        /**
         * Base controller for guest card contact tab, can be used to share functionalities shared
         * in guest card related sections
         * @param {object} $scope Scope object
         * @param {object} RVSearchSrv Search Service
         * @return {void}
         */
        window.GuestCardBaseCtrl = function ($scope, RVSearchSrv, RVContactInfoSrv, rvPermissionSrv, $rootScope) {

            // Set the manage card button state initially as open
            $scope.manageCardState = {
                isOpen: false
            };

            // Get the contact details object with the required properties only
            $scope.getContactInfo = function (contactInfo) {
                var whiteListedKeys = ['first_name', 'last_name', 'mobile', 'phone', 'email', 'vip'],
                    contactDetails = _.pick(contactInfo, whiteListedKeys);

                contactDetails.address = {
                    state: contactInfo.address && contactInfo.address.state ? contactInfo.address.state : "",
                    city: contactInfo.address && contactInfo.address.city ? contactInfo.address.city : ""
                };

                return contactDetails;
            };

            // update guest details to RVSearchSrv via RVSearchSrv.updateGuestDetails - params: guestid, data
            $scope.updateSearchCache = function (avatarImage) {
                var dataSource = $scope.guestCardData.contactInfo;

                var data = {
                    'firstname': dataSource.first_name,
                    'lastname': dataSource.last_name,
                    'vip': dataSource.vip,
                    'is_flagged': dataSource.is_flagged
                };

                if (avatarImage) {
                    data.avatar = avatarImage;
                }

                if (dataSource.address) {
                    if ($scope.escapeNull(dataSource.address.city).toString().trim() !== '' || $scope.escapeNull(dataSource.address.state).toString().trim() !== '') {
                        data.location = dataSource.address.city + ', ' + dataSource.address.state;
                    } else {
                        data.location = false;
                    }
                }
                RVSearchSrv.updateGuestDetails($scope.guestCardData.contactInfo.user_id, data);
            };

            /**
             * Handler for removing guest details from the guest card
             * @param {Number} guestId Id of the guest
             * @return {void}
             *
             */
            $scope.removeGuestDetails = function (guestId) {
                var canGuestCardDelete = $scope.guestCardData.contactInfo.can_guest_card_delete,
                    canGuestDetailsAnonymized = $scope.guestCardData.contactInfo.can_guest_details_anonymized;

                var onSuccess = function onSuccess() {
                    if (canGuestCardDelete) {
                        $scope.navigateBack();
                    } else if (canGuestDetailsAnonymized) {
                        $scope.$broadcast('REFRESH_CONTACT_INFO', { guestId: guestId });
                        $rootScope.$broadcast('UPDATE_GUEST_CARD_ACTIONS_BUTTON_STATUS', { status: false });
                    }
                },
                    onFailure = function onFailure(error) {
                    $scope.errorMessage = error;
                },
                    options = {
                    params: guestId,
                    successCallBack: onSuccess,
                    failureCallBack: onFailure
                };

                if (canGuestCardDelete) {
                    $scope.callAPI(RVContactInfoSrv.deleteGuest, options);
                } else if (canGuestDetailsAnonymized) {
                    $scope.callAPI(RVContactInfoSrv.removeGuestDetails, options);
                }
            };

            /**
             * Fetch guest details by id
             * @param {Number} guestId id of the guest
             * @return {void}
             */
            var fetchGuestDetails = function fetchGuestDetails(guestId) {
                var onSuccess = function onSuccess(data) {
                    $rootScope.$broadcast('SET_GUEST_CARD_DATA', { contactInfo: data, guestId: guestId });
                    $rootScope.$broadcast('CONTACTINFOLOADED');
                    $rootScope.$broadcast('RESETCONTACTINFO', data);
                },
                    onFailure = function onFailure(error) {
                    $scope.errorMessage = error;
                },
                    options = {
                    params: guestId,
                    successCallBack: onSuccess,
                    failureCallBack: onFailure
                };

                $scope.callAPI(RVContactInfoSrv.getGuestDetailsById, options);
            };

            // Listener for refreshing the contact tab details
            var contactInfoRefreshListener = $scope.$on('REFRESH_CONTACT_INFO', function (event, data) {
                fetchGuestDetails(data.guestId);
            });

            $scope.$on('$destroy', contactInfoRefreshListener);

            // Checks whether the user has got the permission to remove guest details
            $scope.hasRemoveGuestDetailsPermission = function () {
                return rvPermissionSrv.getPermissionValue('REMOVE_GUEST_DETAILS');
            };

            // Toggle the state of the manage card button
            $scope.toggleCardActions = function () {
                $scope.manageCardState.isOpen = !$scope.manageCardState.isOpen;
            };

            // Checks whether the remove guest details button should be disabled or not
            $scope.shouldDisableRemoveGuestBtn = function () {
                return !$scope.guestCardData.contactInfo.can_guest_details_anonymized && !$scope.guestCardData.contactInfo.can_guest_card_delete || !$scope.hasRemoveGuestDetailsPermission();
            };

            /**
             * Get updated contact information
             * @param {Object} data contact info
             * @param {Number} guestId guest id
             * @return {Object} contactInfo updated contactinfo
             */
            $scope.getUpdatedContactInfo = function (data, guestId) {
                var contactInfo = data;

                contactInfo.avatar = guestId ? "/ui/pms-ui/images/avatar-trans.png" : "";
                contactInfo.vip = guestId ? data.vip : "";
                contactInfo.birthday = guestId ? data.birthday : null;
                contactInfo.user_id = guestId ? guestId : "";
                contactInfo.guest_id = guestId ? guestId : "";

                return contactInfo;
            };
        };
    }, {}] }, {}, [1]);