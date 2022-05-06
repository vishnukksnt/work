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
        sntRover.controller('staycardController', ['$scope', '$rootScope', 'RVGuestCardsSrv', 'ngDialog', '$timeout', 'RVContactInfoSrv', function ($scope, $rootScope, RVGuestCardsSrv, ngDialog, $timeout, RVContactInfoSrv) {

            // Browser chokes when he tries to do the following two thing at the same time:
            // 		1. Slide in staycard
            // 		2. Update the UI with all the fetched data
            // So we have the following throtel to easy the pain by display:none; staycard while browser updates the UI
            // Show after a delay which is slightly greater that @uiViewDuration + @uiViewDelay (/assets/stylesheets/less/common/01-D_mixins-animations.less)
            var delay = 700;

            $scope.staycardReady = false;
            $timeout(function () {
                $scope.staycardReady = true;
            }, delay);

            $scope.depositPopupData = {};
            $scope.depositPopupData.hasShown = false;

            $scope.countriesListForGuest = [];

            $scope.paymentData = {};

            if ($scope.reservationData.justCreatedRes) {
                $rootScope.$broadcast('reload-loyalty-section-data', {});
            }

            /*
             * To get the payment tab payments list
             */
            $scope.$on('GUESTPAYMENT', function (event, paymentData) {

                if (paymentData.user_id) {
                    $scope.paymentData = paymentData;
                }
            });

            $scope.$on('guestCardUpdateData', function (event, data) {

                $scope.guestCardData.contactInfo.avatar = data.avatar;
                $scope.guestCardData.contactInfo.vip = data.vip;

                $scope.countriesListForGuest = data.countries;

                $scope.guestCardData.userId = data.userId;
                $scope.guestCardData.guestId = data.guestId;
            });

            $scope.$on('staycardGuestData', function (event, data) {

                $scope.guestCardData.contactInfo.first_name = data.guest_details.first_name;
                $scope.guestCardData.contactInfo.last_name = data.guest_details.last_name;
                $scope.guestCardData.contactInfo.confirmation_num = data.guest_details.confirmation_num;

                $scope.guestCardData.contactInfo.avatar = data.guest_details.avatar;
                $scope.sharedReservationData = {};
                // update from api
                $scope.sharedReservationData.room_number = '';
                for (var x in data.sharers) {
                    data.sharers[x].guest_details.first_last = data.sharers[x].guest_details.last_name + ', ' + data.sharers[x].guest_details.first_name;
                }
                $scope.sharedReservationData.sharers = data.sharers;
            });
            $scope.goToSharedReservation = function (sharer) {
                if (!sharer.active) {

                    var fullname = $scope.guestCardData.contactInfo.first_name + ' ' + $scope.guestCardData.contactInfo.last_name,
                        reservation_no = sharer.guest_details.reservation_id,
                        confirmation_no = sharer.confirm_no;

                    $scope.isLoading = true;
                    $rootScope.$broadcast('showLoading');
                    $scope.$broadcast('showLoading');
                    setTimeout(function () {
                        var data = {
                            confirmation_no: confirmation_no,
                            reservation_no: reservation_no,
                            fullname: fullname
                        };

                        $rootScope.viaSharerName = fullname;
                        $rootScope.$broadcast('LOAD_SHARED_RESERVATION', data);
                    }, 200);
                }
            };

            $scope.getTimes = function (n) {
                return new Array(n);
            };

            $scope.$on('MOUSEMOVEDOVERME', function () {
                // (CICO-16893) inoreder to refresh scroller, we are broadcasting this
                $scope.$broadcast('refreshScrollerReservationDetails');
            });

            $scope.$on('reservationCardClicked', function () {
                $scope.$broadcast('reservationCardisClicked');
            });

            $scope.$on('CHANGEAVATAR', function (event, data) {

                var imageName = $scope.guestCardData.contactInfo.avatar.split('/')[$scope.guestCardData.contactInfo.avatar.split('/').length - 1];

                for (var key in avatharImgs) {
                    if (avatharImgs[key] === imageName) {
                        $scope.guestCardData.contactInfo.avatar = data;
                    }
                }
            });

            // setting the heading of the screen to "Search"
            $scope.menuImage = "back-arrow";

            $scope.$on('HeaderChanged', function (event, data) {
                /**
                 * CICO-9081
                 * $scope.heading = value was creating a heading var in local scope! Hence the title was not being set for the page.
                 * Changing code to refer the parent's heading variable to override this behaviour.
                 */
                $scope.$parent.heading = data;

                if (data === "Guest Bill") {
                    $scope.$parent.addNoPrintClass = true;
                } else if (data === "Stay Card") {
                    $scope.$parent.isLogoPrint = true;
                } else {
                    $scope.$parent.addNoPrintClass = false;
                }
            });

            $scope.$on('SHOWPAYMENTLIST', function (event, data) {
                $scope.openPaymentList(data);
            });

            /**
             * @returns {undefined}
             */
            function openPaymentListDialog() {
                ngDialog.open({
                    template: '/assets/partials/payment/rvShowPaymentList.html',
                    controller: 'RVShowPaymentListCtrl',
                    className: '',
                    scope: $scope
                });
            }

            $scope.openPaymentList = function (data) {
                $scope.dataToPaymentList = data;
                // 		In case of connectd properties, fetchProfile OWS request is made only when the guest details is fetched!
                // 		Hence, in order to get the updated list of cards against a guest, make the guest details request before
                // fetching the card details
                if (!$rootScope.isStandAlone && !RVGuestCardsSrv.isGuestFetchComplete($scope.reservationData.guest.id)) {
                    $scope.callAPI(RVContactInfoSrv.getGuestDetailsById, {
                        params: $scope.reservationData.guest.id,
                        successCallBack: function successCallBack(data) {
                            $scope.$emit("UPDATE_GUEST_CARD_DETAILS", data);
                            openPaymentListDialog();
                        },
                        failureCallBack: function failureCallBack(errorMessage) {
                            $scope.errorMessage = errorMessage;
                            $scope.$emit('hideLoader');
                        }
                    });
                } else {
                    openPaymentListDialog();
                }
            };

            $scope.showRoomSharerPopup = function () {
                ngDialog.open({
                    template: '/assets/partials/reservationCard/sharedRoom.html',

                    scope: $scope
                });
            };

            // Get reservation status based style class
            $scope.getGuestStatusIcon = function (reservationStatus, isOptedLateCheckOut) {
                var viewStatus = "";

                if ("CHECKING_OUT" === reservationStatus) {
                    viewStatus = "check-out";
                } else if ("CHECKEDOUT" === reservationStatus || "DEPARTED" === reservationStatus) {
                    viewStatus = "departed";
                } else if (("CHECKEDIN" === reservationStatus || "CHECKING_IN" === reservationStatus) && isOptedLateCheckOut === true) {
                    viewStatus = "late-check-out";
                } else if ("CHECKING_IN" === reservationStatus) {
                    viewStatus = "check-in";
                } else if ("CHECKEDIN" === reservationStatus) {
                    viewStatus = "inhouse";
                } else if ("RESERVED" === reservationStatus) {
                    viewStatus = "arrival";
                } else if ("NOSHOW" === reservationStatus || "NOSHOW_CURRENT" === reservationStatus) {
                    viewStatus = "no-show";
                } else if ("CANCELED" === reservationStatus) {
                    viewStatus = "cancel";
                } else if ("DEPARTED" === reservationStatus) {
                    viewStatus = "check-out";
                }
                return viewStatus;
            };

            $scope.$on('PRIMARY_GUEST_ID_CHANGED', function (event, data) {

                $scope.guestCardData.contactInfo.id_type = data.id_type;
                $scope.guestCardData.contactInfo.gender_id = data.gender_id;
                $scope.guestCardData.contactInfo.nationality_id = data.nationality_id;
                $scope.guestCardData.contactInfo.id_number = data.id_number;
                $scope.guestCardData.contactInfo.birthday = data.birthday;
                if (data.faceImage) {
                    $scope.guestCardData.contactInfo.avatar = data.faceImage;
                }
            });
        }]);
    }, {}] }, {}, [1]);