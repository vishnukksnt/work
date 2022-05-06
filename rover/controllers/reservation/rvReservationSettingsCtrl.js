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
        sntRover.controller('RVReservationSettingsCtrl', ['$scope', 'RVReservationBaseSearchSrv', '$state', '$stateParams', 'dateFilter', '$timeout', 'RVReservationTabService', '$rootScope', function ($scope, RVReservationBaseSearchSrv, $state, $stateParams, dateFilter, $timeout, RVReservationTabService, $rootScope) {
            $scope.reservationSettingsVisible = false;

            var resizableMinWidth = 30;
            var resizableMaxWidth = 260;

            $scope.reservationSettingsWidth = resizableMinWidth;
            $scope.isHourly = $stateParams.reservation === 'HOURLY' ? true : false;
            /**
             * scroller options
             */
            $scope.resizableOptions = {
                minWidth: resizableMinWidth,
                maxWidth: resizableMaxWidth,
                handles: 'e',
                resize: function resize(event, ui) {},
                stop: function stop(event, ui) {
                    preventClicking = true;
                    $scope.eventTimestamp = event.timeStamp;
                }
            };

            $scope.refreshScroll = function () {
                $scope.refreshScroller('reservation-settings');
                if (!!$scope.myScroll && !!$scope.myScroll['reservation-settings']) {
                    // Hack for scroller issue. -- till a better solution is found!
                    $timeout(function () {
                        $scope.myScroll['reservation-settings'].refresh();
                    }, 300);
                }
            };

            $scope.arrivalDateOptions = {
                showOn: 'button',
                dateFormat: 'MM-dd-yyyy',
                numberOfMonths: 2,
                yearRange: '-1:',
                minDate: tzIndependentDate($scope.otherData.businessDate),
                beforeShow: function beforeShow(input, inst) {
                    $('#ui-datepicker-div').addClass('reservation arriving');
                    $('<div id="ui-datepicker-overlay" class="transparent" />').insertAfter('#ui-datepicker-div');
                },
                onClose: function onClose(dateText, inst) {
                    $('#ui-datepicker-div').removeClass('reservation arriving');
                    $('#ui-datepicker-overlay').remove();
                }
            };

            $scope.departureDateOptions = {
                showOn: 'button',
                dateFormat: 'MM-dd-yyyy',
                numberOfMonths: 2,
                yearRange: '-1:',
                minDate: tzIndependentDate($scope.otherData.businessDate),
                beforeShow: function beforeShow(input, inst) {
                    $('#ui-datepicker-div').addClass('reservation departing');
                    $('<div id="ui-datepicker-overlay" class="transparent" />').insertAfter('#ui-datepicker-div');
                },
                onClose: function onClose(dateText, inst) {
                    $('#ui-datepicker-div').removeClass('reservation departing');
                    $('#ui-datepicker-overlay').remove();
                }
            };

            var initStayDates = function initStayDates(roomNumber) {
                if (!roomNumber) {
                    $scope.reservationData.stayDays = [];

                    // Empty the stayDates array before populating it again CICO-25848            
                    _.each($scope.reservationData.rooms, function (room, idx) {
                        room.stayDates = {};
                        room.rateId = "";
                    });
                } else {
                    // Empty the stayDates array before populating it again CICO-25848
                    $scope.reservationData.rooms[roomNumber].stayDates = {};
                }

                for (var d = [], ms = new tzIndependentDate($scope.reservationData.arrivalDate) * 1, last = new tzIndependentDate($scope.reservationData.departureDate) * 1; ms <= last; ms += 24 * 3600 * 1000) {
                    if (!roomNumber) {
                        $scope.reservationData.stayDays.push({
                            date: dateFilter(new tzIndependentDate(ms), 'yyyy-MM-dd'),
                            dayOfWeek: dateFilter(new tzIndependentDate(ms), 'EEE'),
                            day: dateFilter(new tzIndependentDate(ms), 'dd')
                        });

                        _.each($scope.reservationData.rooms, function (room) {
                            room.stayDates[dateFilter(new tzIndependentDate(ms), 'yyyy-MM-dd')] = {
                                guests: {
                                    adults: parseInt(room.numAdults),
                                    children: parseInt(room.numChildren),
                                    infants: parseInt(room.numInfants)
                                },
                                rate: {
                                    id: "",
                                    name: ""
                                }
                            };
                        });
                    } else {
                        $scope.reservationData.rooms[roomNumber].stayDates[dateFilter(new tzIndependentDate(ms), 'yyyy-MM-dd')] = {
                            guests: {
                                adults: parseInt($scope.reservationData.rooms[roomNumber].numAdults),
                                children: parseInt($scope.reservationData.rooms[roomNumber].numChildren),
                                infants: parseInt($scope.reservationData.rooms[roomNumber].numInfants)
                            },
                            rate: {
                                id: "",
                                name: ""
                            }
                        };
                    }
                }
            };

            $scope.arrivalDateChanged = function () {
                $scope.reservationData.arrivalDate = dateFilter($scope.reservationData.arrivalDate, 'yyyy-MM-dd');
                $scope.setDepartureDate();
                $scope.setNumberOfNights();
                initStayDates();
                $scope.stayDatesClicked();

                if (typeof $scope.groupConfigData !== 'undefined') {
                    if ($scope.reservationData.arrivalDate < $scope.groupConfigData.summary.block_from || $scope.reservationData.departureDate > $scope.groupConfigData.summary.block_to) {
                        clearGroupSelection();
                        $rootScope.$broadcast("groupCardDetached");
                    }
                }
            };

            $scope.departureDateChanged = function () {
                $scope.reservationData.departureDate = dateFilter($scope.reservationData.departureDate, 'yyyy-MM-dd');
                $scope.setNumberOfNights();
                initStayDates();
                $scope.stayDatesClicked();

                if (typeof $scope.groupConfigData !== 'undefined') {
                    if ($scope.reservationData.arrivalDate < $scope.groupConfigData.summary.block_from || $scope.reservationData.departureDate > $scope.groupConfigData.summary.block_to) {
                        clearGroupSelection();
                        $rootScope.$broadcast("groupCardDetached");
                    }
                }
            };
            var clearGroupSelection = function clearGroupSelection() {
                if ($scope.reservationData.group && $scope.reservationData.group.id) {
                    $scope.reservationData.group = {};
                    $scope.companySearchText = "";
                    $scope.codeSearchText = "";
                }
            };

            $scope.setDepartureDate = function () {

                var dateOffset = $scope.reservationData.numNights;

                if ($scope.reservationData.numNights === null || $scope.reservationData.numNights === '') {
                    dateOffset = 1;
                }
                var newDate = tzIndependentDate($scope.reservationData.arrivalDate);

                var newDay = newDate.getDate() + parseInt(dateOffset);

                newDate.setDate(newDay);
                $scope.reservationData.departureDate = dateFilter(newDate, 'yyyy-MM-dd');
            };

            $scope.setNumberOfNights = function () {
                var arrivalDate = tzIndependentDate($scope.reservationData.arrivalDate);

                var departureDate = tzIndependentDate($scope.reservationData.departureDate);

                var dayDiff = Math.floor((Date.parse(departureDate) - Date.parse(arrivalDate)) / 86400000);

                // to make sure that the number of
                // dates the guest stays must not be less than ZERO [In order to handle day reservations!]
                if (dayDiff < 0) {

                    // user tried set the departure date
                    // before the arriaval date
                    $scope.reservationData.numNights = 1;

                    // need delay
                    $timeout($scope.setDepartureDate, 1);
                } else {
                    $scope.reservationData.numNights = dayDiff;
                }
            };

            $scope.accordionInitiallyNotCollapsedOptions = {
                header: 'a.toggle',
                heightStyle: 'content',
                collapsible: true,
                activate: function activate(event, ui) {
                    if (isEmpty(ui.newHeader) && isEmpty(ui.newPanel)) {
                        // means accordion was previously collapsed, activating..
                        ui.oldHeader.removeClass('active');
                    } else if (isEmpty(ui.oldHeader)) {
                        // means activating..
                        ui.newHeader.addClass('active');
                    }
                    $scope.refreshScroll();
                }

            };

            $scope.accordionInitiallyCollapsedOptions = {
                header: 'a.toggle',
                collapsible: true,
                heightStyle: 'content',
                active: false,
                activate: function activate(event, ui) {
                    if (isEmpty(ui.newHeader) && isEmpty(ui.newPanel)) {
                        // means accordion was previously collapsed, activating..
                        ui.oldHeader.removeClass('active');
                    } else if (isEmpty(ui.oldHeader)) {
                        // means activating..
                        ui.newHeader.addClass('active');
                    }
                    $scope.refreshScroll();
                }

            };

            /**
             * function to execute click on Guest card
             */
            $scope.clickedOnReservationSettings = function ($event) {
                if (getParentWithSelector($event, document.getElementsByClassName("ui-resizable-e")[0])) {
                    if ($scope.reservationSettingsVisible) {
                        $scope.reservationSettingsWidth = resizableMinWidth;
                        $scope.reservationSettingsVisible = false;
                    } else {
                        $scope.reservationSettingsVisible = true;
                        $scope.reservationSettingsWidth = resizableMaxWidth;
                    }
                }
            };

            $scope.$on('closeSidebar', function () {
                $scope.reservationSettingsWidth = resizableMinWidth;
                $scope.reservationSettingsVisible = false;
            });

            $scope.$on('GETREFRESHACCORDIAN', function () {
                $timeout($scope.refreshScroll, 3000);
            });

            $scope.addTabFromSidebar = function () {
                if (!$scope.reservationData.tabs[$scope.reservationData.tabs.length - 1].roomTypeId) {
                    return false; // Need to select room type before adding another row
                }
                $scope.reservationData.tabs.push(RVReservationTabService.newTab()[0]);
                $scope.reservationData.rooms.push(RVReservationTabService.newRoom()[0]);
                // init stay dates on the last of the rooms -- the most recent one added!
                initStayDates($scope.reservationData.rooms.length - 1);
                $scope.refreshScroll();
            };

            $scope.restrictMultipleBookings = function () {
                return !!$scope.reservationData.reservationId || $scope.reservationData.tabs.length === 4 || !!$scope.reservationData.group.id;
            };

            $scope.removeTabFromSidebar = function (tabIndex) {
                $scope.removeTab(tabIndex);
                $scope.refreshScroll();
            };

            $scope.setScroller('reservation-settings');
        }]);
    }, {}] }, {}, [1]);