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
        angular.module('sntRover').controller('guestCardController', ['$scope', '$window', 'RVCompanyCardSrv', '$q', 'RVReservationAllCardsSrv', 'RVGuestCardsSrv', 'RVContactInfoSrv', '$stateParams', '$timeout', 'ngDialog', '$rootScope', 'RVSearchSrv', 'RVReservationDataService', 'rvGroupSrv', '$state', 'rvAllotmentSrv', '$vault', 'rvPermissionSrv', 'rvFileCloudStorageSrv', 'rvUtilSrv', function ($scope, $window, RVCompanyCardSrv, $q, RVReservationAllCardsSrv, RVGuestCardsSrv, RVContactInfoSrv, $stateParams, $timeout, ngDialog, $rootScope, RVSearchSrv, RVReservationDataService, rvGroupSrv, $state, rvAllotmentSrv, $vault, rvPermissionSrv, rvFileCloudStorageSrv, rvUtilSrv) {
            var resizableMinHeight = 90,
                resizableMaxHeight = $(window).height() - resizableMinHeight,
                DEBOUNCE_DELAY = 1500,
                that = this,
                updateContactInfo = function updateContactInfo() {
                that.newUpdatedData = $scope.decloneUnwantedKeysFromContactInfo();
                if (that.newUpdatedData.email !== null && that.newUpdatedData.email !== "" && !rvUtilSrv.isEmailValid(that.newUpdatedData.email)) {
                    $timeout(function () {
                        $scope.errorMessage = ['Email is Invalid'];
                        $scope.guestCardData.contactInfo.email = currentGuestCardHeaderData.email;
                    }, 100);
                    return;
                }
                var saveUserInfoFailureCallback = function saveUserInfoFailureCallback() {
                    $scope.$emit('contactInfoError', true);
                };

                var saveUserInfoSuccessCallback = function saveUserInfoSuccessCallback(data) {
                    $scope.$emit('hideLoader');
                    $scope.reservationData.guest.email = that.newUpdatedData.email;
                    // update few of the details to searchSrv
                    $scope.updateSearchCache();
                    // This is used in contact info ctrl to prevent the extra API call while clicking outside
                    $scope.isGuestCardSaveInProgress = false;

                    // to reset current data in contcat info for determining any change
                    $scope.$broadcast("RESETCONTACTINFO", that.newUpdatedData);
                };

                // check if there is any chage in data.if so call API for updating data, CICO-46709 fix
                if (JSON.stringify($scope.getContactInfo(currentGuestCardHeaderData)) !== JSON.stringify($scope.getContactInfo(that.newUpdatedData))) {
                    currentGuestCardHeaderData = that.newUpdatedData;
                    var data = {
                        'data': currentGuestCardHeaderData,
                        'userId': $scope.guestCardData.contactInfo.user_id
                    };

                    if (typeof data.userId !== 'undefined') {
                        $scope.isGuestCardSaveInProgress = true;
                        $scope.invokeApi(RVContactInfoSrv.updateGuest, data, saveUserInfoSuccessCallback, saveUserInfoFailureCallback);
                    }
                }
            };

            $scope.dimensionsLookup = {
                resizableMaxHeight: resizableMaxHeight,
                cardTabContentOffset: 170 // Height of the tab menu and the header above.
            };

            $scope.cardVisible = false;
            // init activeCard as the companyCard
            $scope.activeCard = "companyCard";
            $scope.isPrintArStatement = false;
            var roomAndRatesState = 'rover.reservation.staycard.mainCard.room-rates',
                staycardState = 'rover.reservation.staycard.reservationcard.reservationdetails';

            BaseCtrl.call(this, $scope);
            GuestCardBaseCtrl.call(this, $scope, RVSearchSrv, RVContactInfoSrv, rvPermissionSrv, $rootScope);

            $scope.hasOverBookRoomTypePermission = rvPermissionSrv.getPermissionValue('OVERBOOK_ROOM_TYPE');
            $scope.hasOverBookHousePermission = rvPermissionSrv.getPermissionValue('OVERBOOK_HOUSE');
            $scope.hasBorrowFromHousePermission = rvPermissionSrv.getPermissionValue('GROUP_HOUSE_BORROW');

            // Initialize reservation
            var initReservation = function initReservation() {
                var fromVault = $vault.get('searchReservationData'),
                    vaultParsed = !!fromVault ? JSON.parse(fromVault) : {};

                if (!!fromVault) {
                    $scope.searchData.guestCard.guestFirstName = vaultParsed.guestFirstName;
                    $scope.searchData.guestCard.guestLastName = vaultParsed.guestLastName;

                    $vault.remove('searchReservationData');
                }
                // CICO-49175
                if ($stateParams.guestId) {
                    $scope.reservationDetails.guestCard.id = $stateParams.guestId;
                }

                if (!$scope.reservationData.isSameCard || !$scope.otherData.reservationCreated) {
                    // open search list card if any of the search fields are entered on main screen
                    var searchData = $scope.reservationData;

                    if ($scope.searchData.guestCard.guestFirstName !== '' || $scope.searchData.guestCard.guestLastName !== '' || searchData.company.id !== null || searchData.travelAgent.id !== null || !!$scope.reservationData.group.id || !!$scope.reservationData.allotment.id) {
                        // CICO-64219 - If guest card is already saved, then it should be opened upon navigation
                        if ($scope.reservationData.guest && $scope.reservationData.guest.id) {
                            $scope.openGuestCard();
                        } else if ($scope.reservationDetails.guestCard.id === '') {
                            if ($scope.searchData.guestCard.guestFirstName !== '' || $scope.searchData.guestCard.guestLastName !== '') {
                                $scope.openGuestCard();
                                $scope.searchGuest();
                            }
                        } else {
                            // CICO-49175
                            var guestDataFromVault = $vault.get('guestDetails'),
                                guestDataParsed = guestDataFromVault ? JSON.parse(guestDataFromVault) : {},
                                guestData;

                            guestData = !_.isEmpty(guestDataParsed) ? RVContactInfoSrv.parseGuestData(guestDataParsed, $scope.reservationDetails.guestCard.id) : "";

                            if (guestData) {
                                $scope.openGuestCard();
                                $scope.selectGuest(guestData);
                            }
                        }

                        if (!!searchData.company.id && !$scope.reservationData.group.id) {
                            if ($scope.searchData.guestCard.guestFirstName === '' && $scope.searchData.guestCard.guestLastName === '') {
                                if ($stateParams.reservation && $stateParams.reservation !== 'HOURLY' && $stateParams.mode && $stateParams.mode !== 'OTHER') {
                                    $scope.switchCard('company-card');
                                }
                            }
                            $scope.reservationDetails.companyCard.id = searchData.company.id;
                            $scope.initCompanyCard({
                                id: searchData.company.id
                            });
                        }
                        if (!!searchData.travelAgent.id && !$scope.reservationData.group.id) {
                            if ($scope.searchData.guestCard.guestFirstName === '' && $scope.searchData.guestCard.guestLastName === '') {
                                if ($stateParams.reservation && $stateParams.reservation !== 'HOURLY' && $stateParams.mode && $stateParams.mode !== 'OTHER') {
                                    $scope.switchCard('travel-agent-card');
                                }
                            }
                            $scope.reservationDetails.travelAgent.id = searchData.travelAgent.id;
                            $scope.initTravelAgentCard({
                                id: searchData.travelAgent.id
                            });
                        }

                        // CICO-20547 do NOT init group cards for overlays
                        if (!!$scope.reservationData.group.id && $rootScope.isStandAlone) {

                            $scope.initGroupCard($scope.reservationData.group.id);
                            if (!!$scope.reservationData.group.travelAgent) {
                                $scope.reservationDetails.travelAgent.id = $scope.reservationData.group.travelAgent;
                                $scope.initTravelAgentCard();
                            }
                            if (!!$scope.reservationData.group.company) {
                                $scope.reservationDetails.companyCard.id = $scope.reservationData.group.company;
                                $scope.initCompanyCard();
                            }
                        }

                        if (!!$scope.reservationData.allotment.id && $rootScope.isStandAlone) {

                            $scope.initAllotmentCard($scope.reservationData.allotment.id);
                            if (!!$scope.reservationData.allotment.travelAgent) {
                                $scope.reservationDetails.travelAgent.id = $scope.reservationData.allotment.travelAgent;
                                $scope.initTravelAgentCard();
                            }
                            if (!!$scope.reservationData.allotment.company) {
                                $scope.reservationDetails.companyCard.id = $scope.reservationData.allotment.company;
                                $scope.initCompanyCard();
                            }
                        }
                    }
                } else {
                    // populate cards
                    $scope.closeGuestCard();
                    if (!!$scope.reservationDetails.guestCard.id || !!$scope.reservationData.guest.id) {
                        $scope.initGuestCard({
                            id: $scope.reservationDetails.guestCard.id || $scope.reservationData.guest.id
                        });
                    }
                    if (!!$scope.reservationDetails.companyCard.id && !$scope.reservationData.group.id) {
                        $scope.initCompanyCard({
                            id: $scope.reservationDetails.companyCard.id
                        });
                    }
                    if (!!$scope.reservationDetails.travelAgent.id && !$scope.reservationData.group.id) {
                        $scope.initTravelAgentCard({
                            id: $scope.reservationDetails.travelAgent.id
                        });
                    }

                    // CICO-20547 do NOT init group cards for overlays
                    if (!!$scope.reservationData.group.id && $rootScope.isStandAlone) {
                        $scope.initGroupCard($scope.reservationData.group.id);
                        if (!!$scope.reservationData.group.travelAgent) {
                            $scope.reservationDetails.travelAgent.id = $scope.reservationData.group.travelAgent;
                            $scope.initTravelAgentCard();
                        }
                        if (!!$scope.reservationData.group.company) {
                            $scope.reservationDetails.companyCard.id = $scope.reservationData.group.company;
                            $scope.initCompanyCard();
                        }
                    }

                    if (!!$scope.reservationData.allotment.id && $rootScope.isStandAlone) {
                        $scope.initAllotmentCard($scope.reservationData.allotment.id);
                        if (!!$scope.reservationData.allotment.travelAgent) {
                            $scope.reservationDetails.travelAgent.id = $scope.reservationData.allotment.travelAgent;
                            $scope.initTravelAgentCard();
                        }
                        if (!!$scope.reservationData.allotment.company) {
                            $scope.reservationDetails.companyCard.id = $scope.reservationData.allotment.company;
                            $scope.initCompanyCard();
                        }
                    }

                    $scope.reservationData.isSameCard = false;
                }

                if ($scope.otherData.fromSearch) {
                    $scope.otherData.fromSearch = false;
                }
            };

            $scope.init = function () {
                if ($scope.viewState.identifier === "CREATION") {
                    initReservation();
                } else {
                    $scope.contactInfoError = false;
                    $scope.eventTimestamp = "";
                    var preventClicking = false;
                    if (!$scope.guestCardData.contactInfo.address.state) {
                        $scope.guestCardData.contactInfo.address.state = $scope.reservationData.guest.address.state;
                    }
                    if (!$scope.guestCardData.contactInfo.address.city) {
                        $scope.guestCardData.contactInfo.address.city = $scope.reservationData.guest.address.city;
                    }
                }
                $scope.hasPermissionToCreateTACard = rvPermissionSrv.getPermissionValue('CREATE_TRAVEL_AGENT_CARD');
                $scope.hasPermissionToCreateCCard = rvPermissionSrv.getPermissionValue('CREATE_COMPANY_CARD');
            };

            $scope.emailTabKey = function (event) {
                event.preventDefault();
                $scope.openGuestCard();
                document.getElementById('titleId') ? document.getElementById('titleId').getElementsByTagName('input')['0'].focus() : "";
            };

            $scope.$on("swipeAtGuestCard", function () {
                $scope.guestCardTabSwitch("guest-wallet");
            });

            $scope.$on("resetGuestTab", function () {
                $scope.guestCardTabSwitch("guest-contact");
            });

            $scope.$on("guest_email_updated", function (e, email) {
                $scope.guestCardData.contactInfo.email = email;
            });

            $scope.$on('reservationCardisClicked', function () {

                $("#guest-card").css("height", $scope.resizableOptions.minHeight); // against angular js practice, sorry :(
                $scope.guestCardVisible = false;
                $scope.cardVisible = false;
            });
            /**
             * for dragging of guest card
             */
            $scope.guestCardVisible = false;
            // varibale used to determine whether to show guest card's different tabs
            $scope.guestCardHeight = 90;

            /**
             * to be updated from resize directive
             */
            $scope.$watch('windowHeight', function (newValue, oldValue) {
                $scope.windowHeight = newValue;
            });

            /**
             * Every logic to disable the detach company card button.
             */
            $scope.shouldDisableCompanyCardDetachButton = function () {
                // CICO-37005
                return !!$scope.reservationData.groupCompanyCardId;
            };

            /**
             * Every logic to disable the detach TA card button.
             */
            $scope.shouldDisableTACardDetachButton = function () {
                // CICO-37005
                return !!$scope.reservationData.groupTravelAgentId;
            };

            /**
             * scroller options
             */
            $scope.resizableOptions = {
                minHeight: resizableMinHeight,
                maxHeight: resizableMaxHeight,
                handles: 's',
                resize: function resize(event, ui) {
                    if ($(this).height() > 120 && !$scope.guestCardVisible) {
                        // against angular js principle, sorry :(
                        $scope.guestCardVisible = true;
                        $scope.cardVisible = true;
                        $scope.$emit('GUESTCARDVISIBLE', true);
                        $scope.$apply();
                    } else if ($(this).height() <= 120 && $scope.guestCardVisible) {
                        $scope.guestCardVisible = false;
                        $scope.cardVisible = false;
                        $scope.handleDrawClosing();
                        $scope.$emit('GUESTCARDVISIBLE', false);
                        $scope.$apply();
                    }
                    $scope.guestCardHeight = $(this).height();
                    /**
                     * CICO-9564 -- Scrolls in the card section on dragging
                     */
                    if ($scope.UICards[0] === "guest-card") {
                        $scope.$broadcast('CONTACTINFOLOADED');
                        $scope.$broadcast('REFRESHLIKESSCROLL');
                    } else {
                        $scope.$broadcast('contactTabActive');
                        $scope.$broadcast('contractTabActive');
                        $scope.$broadcast('refreshAccountsScroll');
                    }
                },
                stop: function stop(event, ui) {
                    preventClicking = true;
                    $scope.eventTimestamp = event.timeStamp;
                },
                start: getGuestDetails
            };

            /**
             *  API call needs only rest of keys in the data
             */
            $scope.decloneUnwantedKeysFromContactInfo = function () {

                var unwantedKeys = ["birthday", "country", "is_opted_promotion_email", "job_title", "passport_expiry", "passport_number", "postal_code", "reservation_id", "title", "user_id", "works_at", "avatar"],
                    declonedData = dclone($scope.guestCardData.contactInfo, unwantedKeys);

                return declonedData;
            };

            /**
             *  init guestcard header data
             */
            var declonedData = $scope.decloneUnwantedKeysFromContactInfo(),
                currentGuestCardHeaderData = declonedData;

            $scope.current = 'guest-contact';

            /**
             *
             *to reset current data in header info for determining any change
             **/
            $scope.$on('RESETHEADERDATA', function (event, data) {
                currentGuestCardHeaderData.address = data.address;
                currentGuestCardHeaderData.phone = data.phone;
                currentGuestCardHeaderData.email = data.email;
                currentGuestCardHeaderData.first_name = data.first_name;
                currentGuestCardHeaderData.last_name = data.last_name;
            });

            /**
             * tab actions
             */
            $scope.guestCardTabSwitch = function (tab) {
                if ($scope.current === 'guest-contact' && tab !== 'guest-contact') {
                    if ($scope.viewState.isAddNewCard) {
                        $scope.$broadcast("showSaveMessage");
                    } else {
                        $scope.$broadcast('saveContactInfo');
                    }
                }
                if ($scope.current === 'guest-like' && tab !== 'guest-like') {
                    $scope.$broadcast('SAVELIKES');
                }
                if (tab === 'guest-wallet') {
                    $scope.$broadcast('PAYMENTSCROLL');
                } else if (tab === 'guest-like') {
                    $scope.$broadcast('GUESTLIKETABACTIVE');
                    $scope.$broadcast('REFRESHLIKESSCROLL');
                } else if (tab === 'guest-contact') {
                    $scope.$broadcast('CONTACTINFOLOADED');
                } else if (tab === 'activity-log') {
                    $scope.$broadcast('GUEST_ACTIVITY_LOADED');
                } else if (tab === 'guest-statistics') {
                    $scope.$broadcast('LOAD_GUEST_STATISTICS');
                }

                $scope.$broadcast('REFRESHLIKESSCROLL');
                if (!$scope.viewState.isAddNewCard) {
                    $scope.current = tab;
                }
            };

            $scope.$on('contactInfoError', function (event, value) {
                if (value) {
                    $scope.current = 'guest-contact';
                }
            });

            $scope.$on('likesInfoError', function (event, value) {
                $scope.likesInfoError = value;
            });

            $scope.updateContactInfo = function () {
                updateContactInfo();
            };

            /**
             *   In case of a click or an event occured on child elements
             *  of actual targeted element, we need to change it as the event on parent element
             *   @param {event} is the actual event
             *   @param {selector} is the selector which we want to check against that event
             *   @return {Boolean} trueif the event occured on selector or it's child elements
             *   @return {Boolean} false if not
             */
            function getParentWithSelector($event, selector) {
                var obj = $event.target,
                    matched = false;

                return selector.contains(obj);
            }

            $scope.guestCardClick = function ($event) {
                $rootScope.$emit('clearErroMessages');
                $scope.$broadcast('clearNotifications');
                var element = $event.target;

                $event.stopPropagation();
                $event.stopImmediatePropagation();
                // if the main menu is open close the same
                if ($scope.isMenuOpen()) {
                    $scope.closeDrawer();
                    return false;
                }
                if (getParentWithSelector($event, document.getElementsByClassName("ui-resizable-handle")[0])) {
                    // save contact info
                    $scope.$broadcast('saveContactInfo');
                    $scope.$broadcast('SAVELIKES');
                    if (parseInt($scope.eventTimestamp)) {
                        if ($event.timeStamp - $scope.eventTimestamp < 100) {
                            return;
                        }
                    }
                    var currentHeight = $scope.guestCardHeight;

                    if (currentHeight === resizableMinHeight || currentHeight === resizableMaxHeight) {
                        // open a closed card
                        if (!$scope.guestCardVisible) {
                            $scope.openGuestCard();
                            $scope.$broadcast('CONTACTINFOLOADED');
                            $scope.$emit('GUESTCARDVISIBLE', true);
                        } else if ($scope.guestCardVisible && currentHeight === resizableMaxHeight) {
                            // close an opened card
                            $scope.closeGuestCard();
                            $scope.$emit('GUESTCARDVISIBLE', false);
                        }
                    } else {
                        // mid way click : close guest card
                        $scope.closeGuestCard();
                        $scope.$emit('GUESTCARDVISIBLE', false);
                    }
                } else {
                    if (getParentWithSelector($event, document.getElementById("guest-card-content"))) {
                        /**
                         * handle click on tab navigation bar.
                         */
                        if ($event.target.id === 'guest-card-tabs-nav' || $event.target.id === 'cards-header') {
                            $scope.$broadcast('saveContactInfo');
                            $scope.$broadcast('SAVELIKES');
                        } else {
                            return;
                        }
                    }
                }
            };

            $scope.$on("OPEN_GUEST_CARD", function () {
                $scope.openGuestCard();
            });

            $scope.checkOutsideClick = function (targetElement) {
                if ($scope.cardVisible) {
                    $scope.$broadcast('saveContactInfo');
                    $scope.$broadcast('SAVELIKES');
                }
                if ($(targetElement).closest(".nav-bar").length < 1 && $(targetElement).closest(".stay-card-alerts").length < 1 && $(targetElement).closest(".guest-card").length < 1 && $(targetElement).closest(".ngdialog").length < 1 && $(targetElement).find("#loading").length < 1 && $(targetElement).closest("#loading").length < 1 && $(targetElement).closest('.nav-toggle').length < 1) {
                    $scope.closeGuestCard();
                }
            };

            $scope.UICards = ['guest-card', 'company-card', 'travel-agent-card', 'group-card', 'allotment-card'];

            // className based on UICards index
            var subCls = ['first', 'second', 'third', 'fourth', 'fifth'];

            $scope.UICardClass = function (from) {
                // based on from (guest-card, company-card || travel-agent-card)
                // evaluate UICards return className(s) as string
                var cls = '';

                if (from !== $scope.UICards[0]) {
                    cls = "change-card " + subCls[$scope.UICards.indexOf(from)];
                } else {
                    cls = subCls[0];
                }
                return cls;
            };

            $scope.UICardContentCls = function (from) {
                // evaluate UICards return card conten className(s) as string
                var cls = '';

                if (from !== $scope.UICards[0]) {
                    cls = "hidden";
                } else {
                    cls = 'visible';
                }
                return cls;
            };

            $scope.cardCls = function () {
                // evaluate
                var cls = $scope.UICards[0]; //  current active card

                if (cls === 'group-card') {
                    if (!!$scope.reservationData.allotment.id) {
                        cls = 'allotment-card';
                    }
                    if (!$scope.reservationData.allotment.id && !$scope.reservationData.group.id) {
                        cls = 'group-allotment-card';
                    }
                }
                if ($scope.cardVisible) {
                    cls += " open";
                }

                if ($rootScope.isHourlyRateOn || $rootScope.hotelDiaryConfig.mode === 'FULL') {
                    cls += " hourly";
                }

                if ($scope.isPrintArStatement) {
                    cls += " print-statement";
                }

                return cls;
            };

            $scope.switchCard = function (from) {
                //  based on from
                //  swap UICards array for guest-card, company-card & travel-agent-card
                var newCardIndex = $scope.UICards.indexOf(from);
                var currentCard = $scope.UICards[0];

                $scope.UICards[0] = from;
                $scope.UICards[newCardIndex] = currentCard;
                if ($scope.UICards[0] === 'company-card' || $scope.UICards[0] === 'travel-agent-card') {
                    $scope.activeCard = $scope.UICards[0] === 'company-card' ? "companyCard" : "travelAgent";
                    $scope.$broadcast('activeCardChanged');
                }
            };

            /**
             * @return {undefined}
             */
            function getGuestDetails() {
                if ($scope.reservationData.guest.id && $scope.UICards[0] === 'guest-card' && !RVGuestCardsSrv.isGuestFetchComplete($scope.reservationData.guest.id)) {
                    $scope.callAPI(RVGuestCardsSrv.fetchGuestDetailsInformation, {
                        successCallBack: function successCallBack(data) {
                            $scope.$emit("UPDATE_GUEST_CARD_DETAILS", data);
                            // Used in statistics ctrl for updating the contact info
                            $scope.$broadcast('UPDATE_CONTACT_INFO');
                        },
                        failureCallBack: function failureCallBack(errorMessage) {
                            $scope.errorMessage = errorMessage;
                            $scope.$emit('hideLoader');
                        },
                        params: $scope.reservationData.guest.id
                    });
                }
            }

            /**
             * function to open guest card
             */
            $scope.openGuestCard = function () {
                $scope.cardVisible = true;
                $scope.guestCardVisible = true;
                $scope.guestCardHeight = resizableMaxHeight;
                $scope.isGuestCardVisible = true;
                // //refresh scroll in the contact tab of the card-content view. Handled in rover/controllers/rvCompanyCardsContactCtrl.js
                $scope.$broadcast("contactTabActive");
                // //refreshing the scroller in guestcard's tab

                getGuestDetails();
            };

            /**
             * function to close guest card
             */
            $scope.closeGuestCard = function () {
                $scope.guestCardHeight = resizableMinHeight;
                // Check if pending removals - If yes remove
                $scope.handleDrawClosing();
                $scope.cardVisible = false;
                $scope.guestCardVisible = false;
            };

            $scope.handleDrawClosing = function () {
                if ($scope.viewState.pendingRemoval.status) {
                    $scope.removeCard($scope.viewState.pendingRemoval.cardType);
                }
            };

            $scope.clickedDiscardCard = function (cardType, discard) {
                discardCard(cardType, discard);
            };

            var discardCard = function discardCard(cardType, discard) {
                $scope.viewState.isAddNewCard = false;
                if (cardType === 'travel_agent') {
                    $scope.$broadcast('travelAgentDetached');
                } else if (cardType === 'company') {
                    $scope.$broadcast('companyCardDetached');
                } else if (cardType === 'guest') {
                    $scope.$broadcast('guestCardDetached');
                }
            };

            var resetReservationData = {

                resetGuest: function resetGuest() {
                    $scope.reservationData.guest.id = "";
                    $scope.reservationData.guest.firstName = "";
                    $scope.reservationData.guest.lastName = "";
                    $scope.reservationData.guest.city = "";
                    $scope.reservationData.guest.loyaltyNumber = "";
                    $scope.reservationData.guest.email = "";
                    // update current controller scope
                    $scope.guestFirstName = "";
                    $scope.guestLastName = "";
                    $scope.guestCity = "";
                    $scope.guestCardData.cardHeaderImage = "";
                },
                resetCompanyCard: function resetCompanyCard() {
                    $scope.reservationData.company.id = "";
                    $scope.reservationData.company.name = "";
                    $scope.reservationData.company.corporateid = "";
                    $scope.companyName = "";
                    $scope.companyCity = "";
                    $scope.reservationDetails.companyCard.id = "";
                },
                resetTravelAgent: function resetTravelAgent() {
                    $scope.reservationData.travelAgent.id = "";
                    $scope.reservationData.travelAgent.name = "";
                    $scope.reservationData.travelAgent.iataNumber = "";
                    $scope.travelAgentName = "";
                    $scope.travelAgentCity = "";
                    $scope.reservationDetails.travelAgent.id = "";
                }
            };

            var resetCompanyTACards = function resetCompanyTACards() {
                resetReservationData.resetCompanyCard();
                resetReservationData.resetTravelAgent();

                $scope.reservationDetails.companyCard.id = "";
                $scope.reservationDetails.travelAgent.id = "";

                $scope.$broadcast("companyCardDetached");
                $scope.$broadcast("travelAgentDetached");
            },
                removeGroupCard = function removeGroupCard() {
                resetCompanyTACards();

                if ($scope.viewState.identifier === "CREATION") {
                    // reservationCreation
                    $scope.reservationData.group = {
                        id: "",
                        name: "",
                        code: "",
                        company: "",
                        travelAgent: ""
                    };

                    $scope.showContractedRates({
                        companyCard: $scope.reservationDetails.companyCard.id,
                        travelAgent: $scope.reservationDetails.travelAgent.id
                    });
                    $scope.$broadcast("groupCardDetached");
                    $scope.closeGuestCard();
                } else {
                    // Handle group removal in stay-card
                    $scope.closeGuestCard();
                    resetReservationGroupData();
                    var options = {
                        isGroupDetachmentRequested: true
                    };

                    $scope.navigateToRoomAndRates(options);
                }
            },
                removeAllotmentCard = function removeAllotmentCard() {

                resetCompanyTACards();

                if ($scope.viewState.identifier === "CREATION") {
                    // If reservation NOT created
                    $scope.reservationData.allotment = {
                        id: "",
                        name: "",
                        code: "",
                        company: "",
                        travelAgent: ""
                    };

                    $scope.showContractedRates({
                        companyCard: $scope.reservationDetails.companyCard.id,
                        travelAgent: $scope.reservationDetails.travelAgent.id
                    });
                    $scope.$broadcast("groupCardDetached");
                    $scope.closeGuestCard();
                } else {
                    // In case reservation created with Allotment
                    detachFromAllotment();
                }
            };

            var showDetachCardsAPIErrorPopup = function showDetachCardsAPIErrorPopup() {
                ngDialog.open({
                    template: '/assets/partials/cards/popups/detachCardsAPIErrorPopup.html',
                    scope: $scope,
                    closeByDocument: false,
                    closeByEscape: false
                });
            };

            var showDetachCardsAPIWarningPopup = function showDetachCardsAPIWarningPopup(dataForPopup) {
                ngDialog.open({
                    template: '/assets/partials/cards/popups/detachCardsAPIWarningPopup.html',
                    scope: $scope,
                    closeByDocument: false,
                    closeByEscape: false,
                    data: JSON.stringify(dataForPopup)
                });
            };

            /**
             * Function to handle detaching of company card card.
             * If not in create mode, API call is made and billing info is removed
             * @return {undefined}
             */
            $scope.detachCompanyCard = function () {
                // in Create mode no API call is needed
                if ($scope.viewState.identifier === "CREATION") {
                    var resDetails = $scope.reservationDetails;

                    resetReservationData.resetCompanyCard();
                    $scope.showContractedRates({
                        companyCard: resDetails.companyCard.id,
                        travelAgent: resDetails.travelAgent.id
                    });
                    $scope.$broadcast("companyCardDetached");
                } else {
                    // billing info may be deleted; so warn user
                    var dataForPopup = {
                        cardTypeText: "Company Card",
                        cardType: "company",
                        cardId: $scope.reservationDetails.companyCard.id
                    };

                    showDetachCardsAPIWarningPopup(dataForPopup);
                }
            };

            var isCheckedOutAndDepDateisOver = function isCheckedOutAndDepDateisOver() {
                return $scope.reservationData.status === "CHECKEDOUT" && new Date($scope.userInfo.business_date) > new Date($scope.reservationData.departureDate);
            };

            $scope.detachTravelAgent = function () {
                // if the resercation is checked out and EOD has ran
                if (isCheckedOutAndDepDateisOver()) {
                    var showWarningPopup = function showWarningPopup(response) {
                        // if commission is PAID or HOLD, don't allow staff to detach TA
                        if (response.commission_info && response.commission_info.is_paid_or_held) {
                            ngDialog.open({
                                template: '/assets/partials/cards/popups/rvCommisonHoldOrPaidWarning.html',
                                className: 'ngdialog-theme-default stay-card-alerts',
                                scope: $scope,
                                closeByDocument: false,
                                closeByEscape: false
                            });
                        } else {
                            var showCommisionWarning = true;

                            $scope.detachTACard(showCommisionWarning);
                        }
                    };

                    $scope.callAPI(RVContactInfoSrv.checkIfCommisionWasRecalculated, {
                        params: {
                            reservation_id: $scope.reservationData.reservationId
                        },
                        successCallBack: showWarningPopup
                    });
                } else {
                    $scope.detachTACard();
                }
            };

            $scope.detachTACard = function (showCommisionWarning) {
                // in Create mode no API call is needed
                if ($scope.viewState.identifier === "CREATION") {
                    var resDetails = $scope.reservationDetails;

                    resetReservationData.resetTravelAgent();
                    $scope.showContractedRates({
                        companyCard: resDetails.companyCard.id,
                        travelAgent: resDetails.travelAgent.id
                    });
                    $scope.$broadcast("travelAgentDetached");
                } else {
                    // billing info may be deleted; so warn user
                    var dataForPopup = {
                        cardTypeText: "Travel Agent Card",
                        cardType: "travel_agent",
                        cardId: $scope.reservationDetails.travelAgent.id,
                        showCommisionWarning: showCommisionWarning || false
                    };

                    showDetachCardsAPIWarningPopup(dataForPopup);
                }
            };

            $scope.detachGuestCard = function () {
                // in Create mode no API call is needed
                if ($scope.viewState.identifier === "CREATION") {
                    resetReservationData.resetGuest();
                    $scope.$broadcast("guestCardDetached");
                } else {
                    var dataForPopup = {
                        cardTypeText: "Guest Card",
                        cardType: "guest",
                        cardId: $scope.reservationDetails.guestCard.id
                    };

                    ngDialog.open({
                        template: '/assets/partials/cards/alerts/detachCard.html',
                        className: 'ngdialog-theme-default stay-card-alerts',
                        scope: $scope,
                        closeByDocument: false,
                        closeByEscape: false,
                        data: JSON.stringify(dataForPopup)
                    });
                }
            };

            var broadCastDetachEvent = function broadCastDetachEvent(card) {
                if (card === 'travel_agent') {
                    $scope.$broadcast('travelAgentDetached');
                } else if (card === 'company') {
                    $scope.$broadcast('companyCardDetached');
                } else if (card === 'guest') {
                    $scope.$broadcast('guestCardDetached');
                }
            };

            $scope.deleteCard = function (cardType, cardId) {
                $scope.closeDialog();
                broadCastDetachEvent(cardType);

                $timeout(function () {
                    $scope.closeGuestCard();
                    $scope.removeCard(cardType, cardId);
                }, 700);
            };

            $scope.$on("CARD_REMOVED", function (event, card) {
                broadCastDetachEvent(card);
            });

            /**
             * Checks whether the search results should be updated or not
             * We are comparing the last searched string with the search string in the api request
             * to see whether the results should be updated or not. This is done to avoid showing
             * wrong data when the api response are not returned in the order they have been requsted
             * @param {Object} lastSearchedParams -hold the last searched strings
             * @param {Object} requestParams - hold the request params for the given request
             * @return {Boolean} results should update or not
             */
            var shouldUpdateSearchResults = function shouldUpdateSearchResults(lastSearchedParams, requestParams) {
                var status = lastSearchedParams.guestFirstName === requestParams.first_name;

                status = status && lastSearchedParams.guestLastName === requestParams.last_name;
                status = status && lastSearchedParams.guestCity === requestParams.city;
                status = status && lastSearchedParams.guestLoyaltyNumber === requestParams.membership_no;
                status = status && lastSearchedParams.email === requestParams.email;

                return status;
            };

            // init staycard header
            $scope.searchGuest = function () {
                var successCallBackFetchGuest = function successCallBackFetchGuest(response) {
                    var data = response.data,
                        params = response.params;

                    $scope.$emit("hideLoader");
                    $scope.guestSearchIntiated = true;
                    $scope.guestCardData.contactInfo = data;
                    if (shouldUpdateSearchResults($scope.searchData.guestCard, params)) {
                        if (data.results.length > 0) {
                            $scope.searchedGuests = [];
                            angular.forEach(data.results, function (item) {
                                var guestData = {};

                                guestData.id = item.id;
                                guestData.firstName = item.first_name;
                                guestData.lastName = item.last_name;
                                guestData.image = item.image_url;
                                guestData.vip = item.vip;
                                guestData.is_flagged = item.is_flagged;
                                if (item.address !== null) {
                                    guestData.address = {};
                                    guestData.address.city = item.address.city;
                                    guestData.address.state = item.address.state;
                                    guestData.address.postalCode = item.address.postal_code;
                                }
                                guestData.stayCount = item.stay_count;
                                guestData.lastStay = {};
                                guestData.phone = item.home_phone;
                                guestData.email = item.email;
                                guestData.lastStay.date = item.last_stay.date;
                                guestData.lastStay.room = item.last_stay.room;
                                guestData.lastStay.roomType = item.last_stay.room_type;
                                $scope.searchedGuests.push(guestData);
                            });
                        } else {
                            $scope.searchedGuests = [];
                        }
                    }

                    $scope.$broadcast('guestSearchInitiated');
                };

                if ($scope.searchData.guestCard.guestFirstName !== '' || $scope.searchData.guestCard.guestLastName !== '' || $scope.searchData.guestCard.guestCity !== '' || $scope.searchData.guestCard.guestLoyaltyNumber !== '' || $scope.searchData.guestCard.email !== '') {
                    var paramDict = {
                        'first_name': $scope.searchData.guestCard.guestFirstName,
                        'last_name': $scope.searchData.guestCard.guestLastName,
                        'city': $scope.searchData.guestCard.guestCity,
                        'membership_no': $scope.searchData.guestCard.guestLoyaltyNumber,
                        'email': $scope.searchData.guestCard.email
                    };

                    if (shouldSearch()) {
                        $scope.invokeApi(RVReservationAllCardsSrv.fetchGuests, paramDict, successCallBackFetchGuest);
                    }
                } else {
                    $scope.guestSearchIntiated = false;
                    $scope.searchedGuests = [];
                    $scope.$apply();
                    $scope.$broadcast('guestSearchStopped');
                }
            };

            var shouldSearch = function shouldSearch() {
                return $scope.searchData.guestCard.guestLastName.length >= 2 || $scope.searchData.guestCard.guestFirstName.length >= 1 || $scope.searchData.guestCard.guestCity !== '' || $scope.searchData.guestCard.guestLoyaltyNumber !== '' || $scope.searchData.guestCard.email !== '';
            };

            $scope.searchGroups = function () {
                var onGroupSearchSuccess = function onGroupSearchSuccess(data) {
                    $scope.searchingGroups = true;

                    // concat allotment results too into the search results
                    // NOTE: Common search area for both allotments and the groups
                    $scope.searchedGroups = _.map(data.groups, function (group) {
                        return _.extend(group, {
                            type: 'GROUP'
                        });
                    });

                    $scope.searchedGroups = $scope.searchedGroups.concat(_.map(data.allotments, function (allotment) {
                        return _.extend(allotment, {
                            type: 'ALLOTMENT'
                        });
                    }));

                    $scope.$broadcast('GROUP_SEARCH_ON');
                },
                    onGroupSearchFailure = function onGroupSearchFailure(errorMessage) {
                    $scope.errorMessage = errorMessage;
                };

                if (!!$scope.searchData.groupCard.name || !!$scope.searchData.groupCard.code) {
                    $scope.callAPI(rvGroupSrv.searchGroupCard, {
                        params: {
                            name: $scope.searchData.groupCard.name,
                            code: $scope.searchData.groupCard.code,
                            from_date: $scope.reservationData.arrivalDate,
                            to_date: $scope.reservationData.departureDate,
                            is_take_from_inventory: true // https://stayntouch.atlassian.net/browse/CICO-24923
                        },
                        successCallBack: onGroupSearchSuccess,
                        failureCallBack: onGroupSearchFailure
                    });
                } else {
                    $scope.searchingGroups = false;
                    $scope.searchedGroups = [];
                    $scope.$apply();
                    $scope.$broadcast('GROUP_SEARCH_OFF');
                }
            };

            $scope.searchCompany = function () {
                var successCallBackFetchCompanies = function successCallBackFetchCompanies(data) {
                    $scope.$emit("hideLoader");
                    $scope.companySearchIntiated = true;
                    $scope.searchedCompanies = [];
                    if (data.accounts.length > 0) {
                        angular.forEach(data.accounts, function (item) {
                            if (item.account_type === 'COMPANY') {
                                var companyData = {};

                                companyData.id = item.id;
                                companyData.account_name = item.account_name;

                                companyData.account_type = item.account_type;
                                companyData.isMultipleContracts = false;
                                if (item.current_contracts.length > 1) companyData.isMultipleContracts = true;

                                companyData.logo = item.company_logo;
                                if (item.address !== null) {
                                    companyData.address = {};
                                    companyData.address.postalCode = item.address.postal_code;
                                    companyData.address.city = item.address.city;
                                    companyData.address.state = item.address.state;
                                }
                                if (item.current_contracts.length > 0) {
                                    companyData.rateList = item.current_contracts;
                                    companyData.rate = item.current_contracts[0];
                                    if (!_.isEmpty(companyData.rate)) {
                                        companyData.contract_access_code = companyData.rate.access_code;
                                        companyData.rate.difference = function () {
                                            if (parseInt(companyData.rate.based_on && companyData.rate.based_on.value) < 0) {
                                                if (companyData.rate.based_on.type === "amount") {
                                                    return $scope.currencySymbol + (parseFloat(companyData.rate.based_on.value) * -1).toFixed(2) + " off ";
                                                } else {
                                                    return parseFloat(companyData.rate.based_on.value) * -1 + "%" + " off ";
                                                }
                                            }
                                            return "";
                                        }();

                                        companyData.rate.surplus = function () {
                                            if (parseInt(companyData.rate.based_on && companyData.rate.based_on.value) > 0) {
                                                if (companyData.rate.based_on.type === "amount") {
                                                    return " plus " + $scope.currencySymbol + parseFloat(companyData.rate.based_on.value).toFixed(2);
                                                } else {
                                                    return " plus " + parseFloat(companyData.rate.based_on.value) + "%";
                                                }
                                            }
                                            return "";
                                        }();
                                    }
                                }

                                companyData.email = item.email;
                                companyData.phone = item.phone;
                                $scope.searchedCompanies.push(companyData);
                                /* Account Address*/
                                companyData.account_address = item.account_address;
                            }
                        });
                    }
                    $scope.$broadcast('companySearchInitiated');
                };

                if ($scope.searchData.companyCard.companyName !== '' || $scope.searchData.companyCard.companyCity !== '' || $scope.searchData.companyCard.companyCorpId !== '') {
                    var paramDict = {
                        'name': $scope.searchData.companyCard.companyName,
                        'city': $scope.searchData.companyCard.companyCity,
                        'account_number': $scope.searchData.companyCard.companyCorpId,
                        'from_date': $scope.viewState.identifier === "CREATION" || $scope.viewState.identifier === "CONFIRM" ? $scope.reservationData.arrivalDate : new Date($scope.reservation.reservation_card.arrival_date).toISOString().slice(0, 10).replace(/-/g, "-"),
                        'to_date': $scope.viewState.identifier === "CREATION" || $scope.viewState.identifier === "CONFIRM" ? $scope.reservationData.departureDate : new Date($scope.reservation.reservation_card.departure_date).toISOString().slice(0, 10).replace(/-/g, "-"),
                        'reservation_id': $scope.viewState.identifier === "STAY_CARD" ? $scope.reservationData.reservationId : null
                    };

                    $scope.invokeApi(RVReservationAllCardsSrv.fetchCompaniesOrTravelAgents, paramDict, successCallBackFetchCompanies);
                } else {
                    $scope.companySearchIntiated = false;
                    $scope.searchedCompanies = [];
                    $scope.$apply();
                    $scope.$broadcast('companySearchStopped');
                }
            };

            $scope.searchTravelAgent = function () {
                var successCallBackFetchTravelAgents = function successCallBackFetchTravelAgents(data) {
                    $scope.$emit("hideLoader");
                    $scope.travelAgentSearchIntiated = true;
                    $scope.searchedtravelAgents = [];
                    if (data.accounts.length > 0) {
                        angular.forEach(data.accounts, function (item) {
                            if (item.account_type === 'TRAVELAGENT') {
                                var travelAgentData = {};

                                travelAgentData.id = item.id;
                                travelAgentData.account_name = item.account_name;
                                /* Account address*/
                                travelAgentData.account_address = item.account_address;

                                travelAgentData.account_type = item.account_type;
                                travelAgentData.isMultipleContracts = false;
                                if (item.current_contracts.length > 1) travelAgentData.isMultipleContracts = true;

                                travelAgentData.logo = item.company_logo;
                                if (item.address !== null) {
                                    travelAgentData.address = {};
                                    travelAgentData.address.postalCode = item.address.postal_code;
                                    travelAgentData.address.city = item.address.city;
                                    travelAgentData.address.state = item.address.state;
                                }
                                if (item.current_contracts.length > 0) {
                                    travelAgentData.activeContracts = item.current_contracts;
                                    travelAgentData.rate = item.current_contracts[0];
                                    if (!_.isEmpty(travelAgentData.rate)) {
                                        travelAgentData.contract_access_code = travelAgentData.rate.access_code;
                                        travelAgentData.rate.difference = function () {
                                            if (parseInt(travelAgentData.rate.based_on && travelAgentData.rate.based_on.value) < 0) {
                                                if (travelAgentData.rate.based_on.type === "amount") {
                                                    return $scope.currencySymbol + (parseFloat(travelAgentData.rate.based_on.value) * -1).toFixed(2) + " off ";
                                                } else {
                                                    return parseFloat(travelAgentData.rate.based_on.value) * -1 + "%" + " off ";
                                                }
                                            }
                                            return "";
                                        }();

                                        travelAgentData.rate.surplus = function () {
                                            if (parseInt(travelAgentData.rate.based_on && travelAgentData.rate.based_on.value) > 0) {
                                                if (travelAgentData.rate.based_on.type === "amount") {
                                                    return " plus " + $scope.currencySymbol + parseFloat(travelAgentData.rate.based_on.value).toFixed(2);
                                                } else {
                                                    return " plus " + parseFloat(travelAgentData.rate.based_on.value) + "%";
                                                }
                                            }
                                            return "";
                                        }();
                                    }
                                }
                                travelAgentData.email = item.email;
                                travelAgentData.phone = item.phone;
                                $scope.searchedtravelAgents.push(travelAgentData);
                            }
                        });
                    }
                    $scope.$broadcast('travelAgentSearchInitiated');
                };

                if ($scope.searchData.travelAgentCard.travelAgentName !== '' || $scope.searchData.travelAgentCard.travelAgentCity !== '' || $scope.searchData.travelAgentCard.travelAgentIATA !== '') {
                    var paramDict = {
                        'name': $scope.searchData.travelAgentCard.travelAgentName,
                        'city': $scope.searchData.travelAgentCard.travelAgentCity,
                        'account_number': $scope.searchData.travelAgentCard.travelAgentIATA,
                        'from_date': $scope.viewState.identifier === "CREATION" || $scope.viewState.identifier === "CONFIRM" ? $scope.reservationData.arrivalDate : new Date($scope.reservation.reservation_card.arrival_date).toISOString().slice(0, 10).replace(/-/g, "-"),
                        'to_date': $scope.viewState.identifier === "CREATION" || $scope.viewState.identifier === "CONFIRM" ? $scope.reservationData.departureDate : new Date($scope.reservation.reservation_card.departure_date).toISOString().slice(0, 10).replace(/-/g, "-"),
                        'reservation_id': $scope.viewState.identifier === "STAY_CARD" ? $scope.reservationData.reservationId : null
                    };

                    $scope.invokeApi(RVReservationAllCardsSrv.fetchCompaniesOrTravelAgents, paramDict, successCallBackFetchTravelAgents);
                } else {
                    $scope.searchedtravelAgents = [];
                    $scope.travelAgentSearchIntiated = false;
                    $scope.$broadcast('travelAgentSearchStopped');
                }
            };

            var singleRateName = '';

            /**
             * Function to get rate name, if one exists on any of the contracts
             * @return {Boolean}
             */
            $scope.getRateName = function () {
                return singleRateName;
            };

            /**
             * Function to check if multiple rates exists on any of the contracts
             * @param {Object} account the account object
            * @return {Number}
             */
            $scope.ratesCount = function (account) {
                var rateCount = 0,
                    activeContracts;

                if (account.account_type === 'TRAVELAGENT') {
                    activeContracts = account.activeContracts;
                } else if (account.account_type === 'COMPANY') {
                    activeContracts = account.rateList;
                }

                if (activeContracts && activeContracts.length !== 0) {
                    angular.forEach(activeContracts, function (contract) {
                        if (contract.contract_rates.length !== 0) {
                            rateCount += contract.contract_rates.length;
                            singleRateName = contract.contract_rates[0].rate_name;
                        }
                    });
                }
                return rateCount;
            };
            $scope.checkFuture = function (cardType, card, useCardRate) {
                // Changing this reservation only will unlink the stay card from the previous company / travel agent card and assign it to the newly selected card.
                // Changing all reservations will move all stay cards to the new card.
                // This will only apply when a new company / TA card had been selected.
                // If no new card has been selected, the change will only ever just apply to the current reservation and the above message should not display.
                // If multiple future reservations exist for the same Travel Agent / Company Card details, display message upon navigating away from the Stay Card 'Future reservations exist for the same Travel Agent / Company card.'
                // With choice of 'Change this reservation only' and 'Change all Reservations'.

                if (!$scope.isHourly) {
                    var templateUrl = '/assets/partials/cards/alerts/futureReservationsAccounts.html';

                    if (cardType === 'guest') {
                        templateUrl = '/assets/partials/cards/alerts/futureReservationsGuest.html';
                    }
                    ngDialog.open({
                        template: templateUrl,
                        className: 'ngdialog-theme-default stay-card-alerts',
                        scope: $scope,
                        closeByDocument: false,
                        closeByEscape: false,
                        useCardRate: useCardRate,
                        data: JSON.stringify({
                            cardType: cardType,
                            card: card
                        })
                    });
                }
            };

            $scope.replaceCardCaller = function (cardType, card, future, useCardRate) {
                $scope.replaceCard(cardType, card, future, useCardRate);
            };

            /**
             * [showGroupOtherRoomTypeAvailablePopup description]
             * @return {undefined}
             */
            var showGroupOtherRoomTypeAvailablePopup = function showGroupOtherRoomTypeAvailablePopup() {
                ngDialog.open({
                    template: '/assets/partials/cards/popups/group/rvResAttachingToGroupOtherRoomTypeAvailabe.html',
                    className: '',
                    scope: $scope,
                    closeByDocument: false,
                    closeByEscape: false
                });
            };

            /**
             * [showGroupNoRoomTypeAvailablePopup description]
             * @return {undefined}
             */
            var showGroupNoRoomTypeAvailablePopup = function showGroupNoRoomTypeAvailablePopup() {
                ngDialog.open({
                    template: '/assets/partials/cards/popups/group/rvResAttachingToGroupNoAvailability.html',
                    className: '',
                    scope: $scope,
                    closeByDocument: false,
                    closeByEscape: false
                });
            };

            /**
             * [showGroupNoRoomTypeAvailablePopup description]
             * @return {undefined}
             */
            var showGroupRoomTypeIsNotConfiguredPopup = function showGroupRoomTypeIsNotConfiguredPopup() {
                ngDialog.open({
                    template: '/assets/partials/cards/popups/group/rvResAttachingToGroupRoomTypeIsNotConfigured.html',
                    className: '',
                    scope: $scope,
                    closeByDocument: false,
                    closeByEscape: false
                });
            };

            /**
             * [showCreditLimitExceedPopup description]
             * @return {undefined}
             */
            var showCreditLimitExceedPopup = function showCreditLimitExceedPopup() {
                ngDialog.open({
                    template: '/assets/partials/bill/rvBillingInfoCreditLimitExceededPopup.html',
                    className: '',
                    closeByDocument: false,
                    scope: $scope
                });
            };

            /**
             * navigate to group details
             * @return {[type]} [description]
             */
            $scope.gotoGroupDetails = function () {
                $state.go('rover.groups.config', {
                    id: $scope.reservationData.group.id,
                    activeTab: 'SUMMARY'
                });
            };

            /**
             * Utility method to change the central reservation data model with our group data
             * @param  {Object} groupData
             * @return {undefined}
             */
            var updateReservationGroupData = function updateReservationGroupData(group) {
                _.extend($scope.reservationData.group, {
                    id: group.id,
                    name: group.name,
                    code: group.code,
                    company: group.company_id,
                    travelAgent: group.travel_agent_id
                });
            };

            /**
             * 
             * @param {Object} object holding various flags
             * @param {Object} selectedGroup selected group
             * @return {void}
             */
            var showBorrowFromHousePopup = function showBorrowFromHousePopup(results, selectedGroup) {

                // Close borrow popup
                $scope.closeBorrowPopup = function (shouldClearData) {
                    if (shouldClearData) {
                        $scope.borrowData = {};
                    }
                    ngDialog.close();
                };

                // Handles the borrow action
                $scope.performBorrowFromHouse = function () {
                    if ($scope.borrowData.isBorrowFromHouse) {
                        attachGroupToThisReservation(selectedGroup, true);
                        $scope.closeBorrowPopup(true);
                    } else {
                        $scope.closeBorrowPopup();
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
                };

                // Perform overbook
                $scope.performOverBook = function () {
                    attachGroupToThisReservation(selectedGroup, true);
                    $scope.closeOverbookPopup();
                };

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
            };

            /**
             * when we failed in attaching a group
             */
            var failureCallBackOfAttachGroupToReservation = function failureCallBackOfAttachGroupToReservation(error, failureCallbackParams) {
                if (error.hasOwnProperty('httpStatus')) {

                    // 470 is reserved for other room type is available
                    if (error.httpStatus === 470 && error.is_borrowed_from_house) {
                        showBorrowFromHousePopup(error, failureCallbackParams.selectedGroup);
                    } else if (error.httpStatus === 470 && !error.is_borrowed_from_house) {
                        showGroupOtherRoomTypeAvailablePopup();
                    }

                    // 471 - NO availability in group
                    else if (error.httpStatus === 471) {
                            showGroupNoRoomTypeAvailablePopup();
                        }

                        // 472 - Room type is not configured in Group
                        else if (error.httpStatus === 472) {
                                showGroupRoomTypeIsNotConfiguredPopup();
                            }
                } else {
                    $scope.errorMessage = error;
                }
            };

            /**
             * utility method to switch to normal card viewing mode
             * @return {undefined}
             */
            var switchToNomralCardViewingMode = function switchToNomralCardViewingMode() {
                $scope.viewState.isAddNewCard = false;
            };

            /**
             * when the API call is success
             * @param  {Object} success data from API
             * @return {undefined}
             */
            var successCallBackOfAttachGroupToReservation = function successCallBackOfAttachGroupToReservation(data, successCallBackParams) {
                var selectedGroup = successCallBackParams.selectedGroup;

                // updating the central reservation data model
                updateReservationGroupData(selectedGroup);

                $scope.closeGuestCard();
                // we are in card adding mode
                switchToNomralCardViewingMode();

                // we need to upadte the rate and other associated field, to do that, we are reloading the staycard
                if ($scope.isInStayCardScreen()) {
                    $scope.reloadTheStaycard(true);
                }
            };

            /**
             * [attachGroupToThisReservation description]
             * @param  {Object} selectedGroup
             * @return undefined
             */
            var attachGroupToThisReservation = function attachGroupToThisReservation(selectedGroup, forcefullyOverbook) {
                // calling the API
                var params = {
                    reservation_id: $scope.reservationData.reservationId,
                    group_id: selectedGroup.id,
                    forcefully_overbook: forcefullyOverbook
                };

                var options = {
                    params: params,
                    successCallBack: successCallBackOfAttachGroupToReservation,
                    failureCallBack: failureCallBackOfAttachGroupToReservation,
                    successCallBackParameters: {
                        selectedGroup: selectedGroup
                    },
                    failureCallBackParameters: {
                        selectedGroup: selectedGroup
                    }
                };

                $scope.callAPI(rvGroupSrv.attachGroupToReservation, options);
            };

            /**
             * when we failed in attaching a group
             */
            var failureCallBackOfDetachGroupFromThisReservation = function failureCallBackOfDetachGroupFromThisReservation(error) {
                $scope.errorMessage = error;
            };

            /**
             * utility method to switch to normal card viewing mode
             * @return {undefined}
             */
            var switchToAddCardViewMode = function switchToAddCardViewMode() {
                $scope.viewState.isAddNewCard = true;
            };

            /**
             * utility method to unset group data
             * @return {undefined}
             */
            var resetReservationGroupData = function resetReservationGroupData() {
                $scope.reservationData.group = {
                    id: "",
                    name: "",
                    code: "",
                    company: "",
                    travelAgent: ""
                };
            };

            /**
             * when the API call is success
             * @param  {Object} success data from API
             * @return {undefined}
             */
            var successCallBackOfDetachGroupFromThisReservation = function successCallBackOfDetachGroupFromThisReservation(data) {
                // updating the central reservation data model
                resetReservationGroupData();

                // we will be in card opened mode, so closing
                $scope.closeGuestCard();

                // we are in details viewing mode
                switchToAddCardViewMode();

                $scope.$broadcast("groupCardDetached");
                $rootScope.$broadcast('UPDATE_RATE_POST_GROUP_DETACH');
            };

            /**
             * [detachGroupToThisReservation description]
             * @param  {Object} selectedGroup
             * @return undefined
             */
            var detachGroupFromThisReservation = function detachGroupFromThisReservation() {
                var resData = $scope.reservationData;

                // calling the API
                var params = {
                    reservation_id: resData.reservationId,
                    group_id: resData.group.id
                };

                var options = {
                    params: params,
                    successCallBack: successCallBackOfDetachGroupFromThisReservation,
                    failureCallBack: failureCallBackOfDetachGroupFromThisReservation
                };

                $scope.callAPI(rvGroupSrv.detachGroupFromReservation, options);
            };

            var detachFromAllotment = function detachFromAllotment() {
                $scope.callAPI(rvAllotmentSrv.detachAllotmentFromReservation, {
                    params: $scope.reservationData.reservationId,
                    successCallBack: function successCallBack() {
                        // reset reservation data model
                        $scope.reservationData.allotment = {
                            id: "",
                            name: "",
                            code: "",
                            company: "",
                            travelAgent: ""
                        };
                        $scope.closeGuestCard();
                        switchToAddCardViewMode();
                        $scope.$broadcast("groupCardDetached");
                        // Need to select new rate for the reservation --> Take user to the Room & Rates screen
                        $scope.navigateToRoomAndRates();
                    },
                    failureCallBack: function failureCallBack() {
                        console.warn('Detach Allotment FAILED');
                    }
                });
            };

            /**
             * Method shared between group and allot cards!
             * Routes control to the appropriate path...
             */
            $scope.detachFromGroupORAllotment = function () {
                // Common method used across Group and Allotment cards in the reservation card headers
                // NOTE: The group and allotment cards are mutually exclusive!
                if (!!$scope.reservationData.group.id) {
                    // In case the attached card is a group
                    removeGroupCard();
                } else if (!!$scope.reservationData.allotment.id) {
                    removeAllotmentCard();
                }
            };

            $scope.selectToGroupORAllotment = function (cardDetail, $event) {
                $event.stopPropagation();
                if ($scope.viewState.identifier === "CREATION") {
                    if (cardDetail.type === 'GROUP') {
                        $scope.selectGroup(cardDetail);
                    } else if (cardDetail.type === 'ALLOTMENT') {
                        $scope.selectAllotment(cardDetail);
                    }
                } else {
                    ngDialog.open({
                        template: '/assets/partials/cards/alerts/warnCardOverride.html',
                        className: '',
                        scope: $scope,
                        closeByDocument: false,
                        closeByEscape: false,
                        data: JSON.stringify({
                            card: cardDetail
                        })
                    });
                }
            };

            $scope.selectGroup = function (group) {
                $scope.closeDialog();
                setTimeout(function () {
                    if ($scope.viewState.identifier === "CREATION") {
                        // In create reservation
                        $scope.reservationData.group = {
                            id: group.id,
                            name: group.name,
                            code: group.code,
                            company: group.company_id,
                            travelAgent: group.travel_agent_id
                        };
                        $scope.closeGuestCard();
                        $scope.viewState.isAddNewCard = false;
                        $scope.initGroupCard(group.id);
                        if (!!$scope.reservationData.group.travelAgent) {
                            $scope.reservationDetails.travelAgent.id = $scope.reservationData.group.travelAgent;
                            $scope.initTravelAgentCard();
                        }
                        if (!!$scope.reservationData.group.company) {
                            $scope.reservationDetails.companyCard.id = $scope.reservationData.group.company;
                            $scope.initCompanyCard();
                        }
                        $scope.showContractedRates({
                            companyCard: $scope.reservationDetails.companyCard.id,
                            travelAgent: $scope.reservationDetails.travelAgent.id
                        });
                        $scope.navigateToRoomAndRates();
                    } else {
                        // In staycard
                        attachGroupToThisReservation(group);
                    }
                }, 1000);
            };

            /**
             * if in create reservation mode
             * @return {Boolean}
             */
            var isInCreateReservationMode = function isInCreateReservationMode() {
                return $scope.viewState.identifier === "CREATION";
            };

            /**
             * [showAllotmentOtherRoomTypeAvailablePopup description]
             * @return {undefined}
             */
            var showAllotmentOtherRoomTypeAvailablePopup = function showAllotmentOtherRoomTypeAvailablePopup() {
                ngDialog.open({
                    template: '/assets/partials/cards/popups/allotment/rvResAttachingToAllotmentOtherRoomTypeAvailabe.html',
                    className: '',
                    scope: $scope,
                    closeByDocument: false,
                    closeByEscape: false
                });
            };

            /**
             * [showGroupNoRoomTypeAvailablePopup description]
             * @return {undefined}
             */
            var showAllotmentNoRoomTypeAvailablePopup = function showAllotmentNoRoomTypeAvailablePopup() {
                ngDialog.open({
                    template: '/assets/partials/cards/popups/allotment/rvResAttachingToAllotmentNoAvailability.html',
                    className: '',
                    scope: $scope,
                    closeByDocument: false,
                    closeByEscape: false
                });
            };

            /**
             * [showGroupNoRoomTypeAvailablePopup description]
             * @return {undefined}
             */
            var showAllotmentRoomTypeIsNotConfiguredPopup = function showAllotmentRoomTypeIsNotConfiguredPopup() {
                ngDialog.open({
                    template: '/assets/partials/cards/popups/allotment/rvResAttachingToAllotmentRoomTypeIsNotConfigured.html',
                    className: '',
                    scope: $scope,
                    closeByDocument: false,
                    closeByEscape: false
                });
            };

            /**
             * navigate to group details
             * @return {[type]} [description]
             */
            $scope.gotoAllotmentDetails = function () {
                $state.go('rover.allotments.config', {
                    id: $scope.reservationData.allotment.id,
                    activeTab: 'SUMMARY'
                });
            };

            /**
             * Utility method to change the central reservation data model with our allotment data
             * @param  {Object} allotmentData
             * @return {undefined}
             */
            var updateReservationAllotmentData = function updateReservationAllotmentData(allotment) {
                _.extend($scope.reservationData.allotment, {
                    id: allotment.id,
                    name: allotment.name,
                    code: allotment.code,
                    company: allotment.company_id,
                    travelAgent: allotment.travel_agent_id
                });
            };

            /**
             * when we failed in attaching a group
             */
            var failureCallBackOfAttachAllotmentToReservation = function failureCallBackOfAttachAllotmentToReservation(error) {
                if (error.hasOwnProperty('httpStatus')) {

                    // 470 is reserved for other room type is available
                    if (error.httpStatus === 470) {
                        showAllotmentOtherRoomTypeAvailablePopup();
                    }

                    // 471 - NO availability in group
                    else if (error.httpStatus === 471) {
                            showAllotmentNoRoomTypeAvailablePopup();
                        }

                        // 472 - Room type is not configured in Group
                        else if (error.httpStatus === 472) {
                                showAllotmentRoomTypeIsNotConfiguredPopup();
                            }

                            // 473 - Show Credit Limit exceed popup.
                            else if (error.httpStatus === 473) {
                                    showCreditLimitExceedPopup();
                                }
                } else {
                    $scope.errorMessage = error;
                }
            };

            /**
             * when the API call is success
             * @param  {Object} success data from API
             * @return {undefined}
             */
            var successCallBackOfAttachAllotmentToReservation = function successCallBackOfAttachAllotmentToReservation(data, successCallBackParams) {
                var selectedAllotment = successCallBackParams.selectedAllotment;

                // updating the central reservation data model
                updateReservationAllotmentData(selectedAllotment);

                $scope.closeGuestCard();

                // we are in card adding mode
                switchToNomralCardViewingMode();

                $scope.initAllotmentCard(selectedAllotment.id);

                // we need to upadte the rate and other associated field, to do that, we are reloading the staycard
                if ($state.current.name === staycardState) {
                    $scope.reloadTheStaycard();
                }
            };

            /**
             * [attachAllotmentToThisReservation description]
             * @param  {Object} selectedAllotment
             * @return undefined
             */
            var attachAllotmentToThisReservation = function attachAllotmentToThisReservation(selectedAllotment) {
                // calling the API
                var params = {
                    reservationId: $scope.reservationData.reservationId,
                    allotmentId: selectedAllotment.id
                };

                var options = {
                    params: params,
                    successCallBack: successCallBackOfAttachAllotmentToReservation,
                    failureCallBack: failureCallBackOfAttachAllotmentToReservation,
                    successCallBackParameters: {
                        selectedAllotment: selectedAllotment
                    }
                };

                $scope.callAPI(rvAllotmentSrv.attachAllotmentToReservation, options);
            };

            /**
             * when the user selects the allotment from the allotment search results,
             * this will trigger
             * @param {Object} - allotment object
             * @param {Object} - clicked event
             * @return {undefined}
             */
            $scope.selectAllotment = function (allotment) {
                $scope.closeDialog();
                setTimeout(function () {
                    if (isInCreateReservationMode()) {
                        $scope.reservationData.allotment = {
                            id: allotment.id,
                            name: allotment.name,
                            code: allotment.code,
                            company: allotment.company_id,
                            travelAgent: allotment.travel_agent_id
                        };
                        $scope.closeGuestCard();
                        $scope.viewState.isAddNewCard = false;
                        $scope.initAllotmentCard(allotment.id);
                        if (!!$scope.reservationData.allotment.travelAgent) {
                            $scope.reservationDetails.travelAgent.id = $scope.reservationData.allotment.travelAgent;
                            $scope.initTravelAgentCard();
                        }
                        if (!!$scope.reservationData.allotment.company) {
                            $scope.reservationDetails.companyCard.id = $scope.reservationData.allotment.company;
                            $scope.initCompanyCard();
                        }
                        $scope.showContractedRates({
                            companyCard: $scope.reservationDetails.companyCard.id,
                            travelAgent: $scope.reservationDetails.travelAgent.id
                        });
                        $scope.navigateToRoomAndRates();
                    }

                    // staycard card attaching
                    else {
                            attachAllotmentToThisReservation(allotment);
                        }
                }, 1000);
            };

            /**
             * function to search allotment
             * @return {[type]} [description]
             */
            $scope.searchAllotments = function () {
                $scope.$broadCast('FETCH_ALLOTMENT_SEARCH_DATA');
            };

            // CICO-11893
            // To show contracted Rate confirmation popup
            var showContractRatePopup = function showContractRatePopup(data) {
                $scope.cardData = data;
                ngDialog.open({
                    template: '/assets/partials/cards/alerts/contractRatesConfirmation.html',
                    className: '',
                    closeByDocument: false,
                    closeByEscape: false,
                    scope: $scope
                });
            };

            // To keep existing rate and proceed.
            // CICO-50623 : Handle keep existing state scenario
            // This flag will use in stayCardMainStrl.js
            $scope.reservationData.keepExistingRate = false;

            $scope.selectCard = function (cardData, chooseCardRate) {
                if (cardData.account_type === 'COMPANY') {
                    $scope.selectCompany(cardData, chooseCardRate);
                }
                if (cardData.account_type === 'TRAVELAGENT') {
                    $scope.selectTravelAgent(cardData, chooseCardRate);
                }

                if (!chooseCardRate) {
                    $scope.reservationData.keepExistingRate = true;
                }
            };
            // To change to contracted Rate and proceed.
            $scope.changeToContractedRate = function (cardData) {
                $scope.selectCard(cardData, true);
                // $scope.navigateToRoomAndRates();
                // ngDialog.close();
                // we will be in card opened mode, so closing
                $scope.closeGuestCard();

                /**
                 * CICO-20674: when there is more than one contracted rate we
                 * should take the user to room and rates screen after applying the routing info
                 */
                // $timeout(function() {
                //  $scope.navigateToRoomAndRates();
                // }, 3000);
                // CICO-20161
            };

            $scope.setSelectedTACard = function (cardData) {
                $scope.selectTravelAgent(cardData);
            };

            var showCommissionWarningPopup = function showCommissionWarningPopup(cardData) {
                ngDialog.open({
                    template: '/assets/partials/cards/popups/rvCommissionsWarningPopup.html',
                    className: '',
                    closeByDocument: false,
                    closeByEscape: false,
                    scope: $scope,
                    data: JSON.stringify({
                        cardData: cardData
                    })
                });
            };

            // To handle card selection from COMPANY / TA.
            $scope.selectCardType = function (cardData, $event) {
                $event.stopPropagation();
                // Card draw is closed on select
                $scope.closeGuestCard();
                if (cardData.account_type === 'COMPANY') {
                    if (!!cardData.rate && $state.current.name !== roomAndRatesState && !$scope.reservationData.group.id) {
                        showContractRatePopup(cardData);
                    } else {
                        $scope.selectCompany(cardData);
                    }
                } else if (cardData.account_type === 'TRAVELAGENT') {

                    cardData.showCommisionWarning = isCheckedOutAndDepDateisOver();

                    if (!!cardData.rate && $state.current.name !== roomAndRatesState && !$scope.reservationData.group.id) {
                        showContractRatePopup(cardData);
                    } else {
                        if (cardData.showCommisionWarning) {
                            showCommissionWarningPopup(cardData);
                        } else {
                            $scope.selectTravelAgent(cardData);
                        }
                    }
                }
            };

            // On selecting comapny card
            $scope.selectCompany = function (company, useCardRate) {
                // CICO-7792
                if ($scope.viewState.identifier === "CREATION") {
                    $scope.closeDialog();
                    $scope.reservationData.company.id = company.id;
                    $scope.showContractedRates({
                        companyCard: company.id,
                        travelAgent: $scope.reservationData.travelAgent.id
                    });
                    $scope.reservationData.company.name = company.account_name;
                    $scope.reservationData.company.corporateid = $scope.companyCorpId;

                    // update current controller scopehandleDrawClosing
                    $scope.companyName = company.account_name;
                    $scope.companyCity = company.city;
                    $scope.closeGuestCard();
                    $scope.reservationDetails.companyCard.id = company.id;
                    $scope.initCompanyCard(company);
                    $scope.viewState.isAddNewCard = false;
                    // CICO-32856
                    $scope.navigateToRoomAndRates();
                } else {
                    if (!$scope.reservationDetails.companyCard.futureReservations || $scope.reservationDetails.companyCard.futureReservations <= 0) {
                        $scope.replaceCardCaller('company', company, false, useCardRate);
                    } else {
                        $scope.closeDialog();
                        $scope.checkFuture('company', company, useCardRate);
                    }
                }
            };
            // On selecting travel agent card
            $scope.selectTravelAgent = function (travelAgent, useCardRate) {
                // CICO-7792
                if ($scope.viewState.identifier === "CREATION") {
                    $scope.closeDialog();
                    // Update main reservation scope
                    $scope.reservationData.travelAgent.id = travelAgent.id;
                    $scope.showContractedRates({
                        companyCard: $scope.reservationData.company.id,
                        travelAgent: travelAgent.id
                    });
                    $scope.reservationData.travelAgent.name = travelAgent.account_name;
                    $scope.reservationData.travelAgent.iataNumber = $scope.travelAgentIATA;

                    // update current controller scope
                    $scope.travelAgentName = travelAgent.account_name;
                    $scope.travelAgentCity = travelAgent.city;
                    $scope.closeGuestCard();
                    $scope.reservationDetails.travelAgent.id = travelAgent.id;
                    $scope.initTravelAgentCard(travelAgent);
                    $scope.viewState.isAddNewCard = false;
                    // CICO-32856
                    $scope.navigateToRoomAndRates();
                } else {
                    if (!$scope.reservationDetails.travelAgent.futureReservations || $scope.reservationDetails.travelAgent.futureReservations <= 0) {
                        $scope.replaceCardCaller('travel_agent', travelAgent, false, useCardRate);
                    } else {
                        $scope.closeDialog();
                        $scope.checkFuture('travel_agent', travelAgent, useCardRate);
                    }
                }
            };

            $scope.selectGuest = function (guest, $event) {
                if ($event) {
                    $event.stopPropagation();
                }
                if ($scope.viewState.identifier === "CREATION") {
                    $scope.reservationData.guest.id = guest.id;
                    $scope.reservationData.guest.firstName = guest.firstName;
                    $scope.reservationData.guest.lastName = guest.lastName;
                    $scope.reservationData.guest.city = guest.address ? guest.address.city : '';
                    $scope.reservationData.guest.loyaltyNumber = $scope.guestLoyaltyNumber;

                    // update current controller scope
                    $scope.guestFirstName = guest.firstName;
                    $scope.guestLastName = guest.lastName;
                    $scope.guestCity = guest.address ? guest.address.city : '';
                    $scope.guestCardData.cardHeaderImage = guest.image;
                    $scope.viewState.isAddNewCard = false;
                    $scope.reservationDetails.guestCard.id = guest.id;
                    $scope.initGuestCard(guest);

                    $scope.callAPI(RVGuestCardsSrv.fetchGuestDetailsInformation, {
                        successCallBack: function successCallBack(data) {
                            var reqs = {
                                check_validation_only: true,
                                data: data,
                                userId: guest.id
                            };

                            $scope.invokeApi(RVContactInfoSrv.updateGuest, reqs, function (resp) {
                                if (resp.mandatory_field_missing_message !== '' && resp.mandatory_field_missing_message !== null) {
                                    $scope.errorMessage = resp.mandatory_field_missing_message;
                                    $scope.$emit('contactInfoError', true);
                                }
                            }, function () {});
                            data.stayCount = guest.stayCount;
                            $scope.$emit("UPDATE_GUEST_CARD_DETAILS", data);
                            $scope.closeGuestCard();
                        },
                        failureCallBack: function failureCallBack(errorMessage) {
                            $scope.$emit('hideLoader');
                        },
                        params: guest.id
                    });
                } else {
                    if (!$scope.reservationDetails.guestCard.futureReservations || $scope.reservationDetails.guestCard.futureReservations <= 0) {
                        // CICO-41517
                        var hasMultipleReservations = $scope.reservationData && $scope.reservationData.reservationIds && $scope.reservationData.reservationIds.length;

                        $scope.replaceCardCaller('guest', guest, !!hasMultipleReservations);
                    } else {
                        $scope.checkFuture('guest', guest);
                    }
                }
            };

            $scope.refreshScroll = function (elemToBeRefreshed) {
                if (typeof $scope.$parent.myScroll !== 'undefined') {
                    $timeout(function () {
                        $scope.$parent.myScroll[elemToBeRefreshed].refresh();
                    }, 300);
                }
            };
            // CREATES
            $scope.createNewGuest = function () {

                var promises = [],
                    successCallBackForguestAdminSettings = function successCallBackForguestAdminSettings(data) {
                    $scope.guestCardData.contactInfo.guest_admin_settings = data;
                },
                    successCallBackGenderTypes = function successCallBackGenderTypes(data) {
                    $scope.guestCardData.contactInfo.genderTypeList = data;
                },
                    successCallBackIdTypes = function successCallBackIdTypes(data) {
                    $scope.idTypeList = data;
                };

                promises.push(RVGuestCardsSrv.fetchGuestAdminSettings().then(successCallBackForguestAdminSettings));

                // charge code fetch
                promises.push(RVGuestCardsSrv.fetchGenderTypes().then(successCallBackGenderTypes));

                // Get government id types
                promises.push(RVGuestCardsSrv.fetchIdTypes().then(successCallBackIdTypes));

                // Lets start the processing
                $q.all(promises).then();

                // create an empty dataModel for the guest
                var contactInfoData = {
                    'contactInfo': $scope.guestCardData.contactInfo,
                    'countries': $scope.countries,
                    'userId': "",
                    'avatar': "",
                    'guestId': "",
                    'vip': false
                };

                $scope.guestCardData.contactInfo = contactInfoData.contactInfo;
                $scope.guestCardData.contactInfo.avatar = contactInfoData.avatar;
                $scope.guestCardData.contactInfo.vip = contactInfoData.vip;
                $scope.countriesList = contactInfoData.countries;
                $scope.guestCardData.userId = contactInfoData.userId;
                $scope.guestCardData.guestId = contactInfoData.guestId;
                $scope.guestCardData.contactInfo.birthday = null;
                var guestInfo = {
                    "user_id": "",
                    "guest_id": ""
                };
                // Retain Search Keys

                $scope.guestCardData.contactInfo.first_name = $scope.searchData.guestCard.guestFirstName;
                $scope.guestCardData.contactInfo.last_name = $scope.searchData.guestCard.guestLastName;
                $scope.guestCardData.contactInfo.email = $scope.searchData.guestCard.email;

                $scope.guestCardData.contactInfo.address = {};
                $scope.guestCardData.contactInfo.address.city = $scope.searchData.guestCard.guestCity;
                $scope.guestCardData.membership_no = $scope.searchData.guestCard.guestLoyaltyNumber;
                $scope.$broadcast('guestCardAvailable');
                $scope.current = 'guest-contact';
                $scope.viewState.isAddNewCard = true;
            };

            $scope.createNewCompany = function () {
                $scope.companyContactInformation = RVReservationDataService.getEmptyAccountData();
                $scope.reservationDetails.companyCard.id = "";
                $scope.reservationDetails.companyCard.futureReservations = 0;
                $scope.viewState.isAddNewCard = true;
                $scope.$broadcast('companyCardAvailable', true);
            };

            $scope.createNewTravelAgent = function () {
                $scope.travelAgentInformation = RVReservationDataService.getEmptyAccountData();
                $scope.reservationDetails.travelAgent.id = "";
                $scope.reservationDetails.travelAgent.futureReservations = 0;
                $scope.viewState.isAddNewCard = true;
                $scope.$broadcast('travelAgentFetchComplete', true);
            };

            $scope.clickedSaveCard = function (cardType) {
                if (cardType === "guest") {
                    $scope.$broadcast("saveContactInfo");
                }
            };

            $scope.newGuestAdded = function (id) {
                $scope.viewState.isAddNewCard = false;
                $scope.viewState.pendingRemoval.status = false;
                $scope.viewState.pendingRemoval.cardType = "";
                $scope.initGuestCard({
                    id: id
                });
            };

            $scope.$on("updateGuestEmail", function (e) {
                $scope.guestCardData.contactInfo.email = $scope.reservationData.guest.email;
            });
            // Listener to update the card info from billing info
            $scope.$on("CardInfoUpdated", function (e, card_id, card_type) {
                if (card_type === 'COMPANY_CARD') {
                    $scope.reservationDetails.companyCard.id = card_id;
                    $scope.initCompanyCard();
                } else {
                    $scope.reservationDetails.travelAgent.id = card_id;
                    $scope.initTravelAgentCard();
                }
            });

            $scope.$on('PROMPTCARDENTRY', function () {
                if (!$scope.reservationDetails.guestCard.id) {
                    $scope.openGuestCard();
                }
            });

            $scope.init();

            // CICO-6049 Toggle VIP button
            $scope.vipToggleClicked = function () {
                $scope.updateContactInfo();
            };

            /**
             * Hide detach card in case of group reservations
             */
            $scope.allowDetachAgent = function () {
                return !$scope.reservationData.group.id;
            };

            $scope.allowDetachCompany = function () {
                return !$scope.reservationData.group.id;
            };

            $scope.guestCardClicked = function () {
                // save contact info
                // CICO-16965 Do IFF the card is saved - NOT in Add mode
                if (!$scope.viewState.isAddNewCard) {
                    // Call save if NOT 'AddNewCard' mode
                    $scope.$broadcast('saveContactInfo');
                }
                rvFileCloudStorageSrv.activeCardType = 'guest_card';
            };

            // CICO-25249 - Catch error from staycard main controler - card replace API.
            $scope.$on("SHOWERRORMESSAGE", function (event, errorMessage) {
                $scope.errorMessage = errorMessage;
            });

            // CICO-27364 - add class 'print-statement' if printing AR Transactions Statement.
            $scope.$on("PRINT_AR_STATEMENT", function (event, isPrintArStatement) {
                $scope.isPrintArStatement = isPrintArStatement;
            });

            /**
             * Populate guest card details
             * @param {object} data
             * @param {integer} guestId
             * @return {object} guestCardData
             */
            var getGuestCardData = function getGuestCardData(data, guestId) {
                var guestCardData = {};

                guestCardData.contactInfo = data;
                guestCardData.contactInfo.avatar = guestId ? "/ui/pms-ui/images/avatar-trans.png" : "";
                guestCardData.contactInfo.vip = guestId ? data.vip : "";
                guestCardData.userId = guestId;
                guestCardData.guestId = guestId;
                guestCardData.contactInfo.birthday = guestId ? data.birthday : null;
                guestCardData.contactInfo.user_id = guestId ? guestId : "";
                guestCardData.contactInfo.guest_id = guestId ? guestId : "";

                return guestCardData;
            };

            // Listener for setting the guestData information
            var guestCardSetListener = $scope.$on('SET_GUEST_CARD_DATA', function (event, data) {
                $scope.guestCardData.contactInfo = $scope.getUpdatedContactInfo(data.contactInfo, data.guestId);
            });

            $scope.$on('$destroy', guestCardSetListener);

            // CICO-65967
            $scope.addListener('DETACH_GROUP_FROM_RESERVATION', function () {
                detachGroupFromThisReservation();
            });
        }]);
    }, {}] }, {}, [1]);