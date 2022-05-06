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
        angular.module('sntRover').service('RVReservationDataService', ['$rootScope', 'dateFilter', 'RVReservationStateService', function ($rootScope, dateFilter, RVReservationStateService) {
            var self = this;

            self.getDatesModel = function (fromDate, toDate) {
                var dates = {};

                for (var d = [], ms = new tzIndependentDate(fromDate) * 1, last = new tzIndependentDate(toDate) * 1; ms <= last; ms += 24 * 3600 * 1000) {
                    var currentDate = new tzIndependentDate(ms),
                        formattedCurrentDate = dateFilter(currentDate, 'yyyy-MM-dd');

                    // Skip the departure date if {#nights -gt 0} 
                    if (toDate === fromDate || ms < last) {
                        dates[formattedCurrentDate] = {
                            obj: currentDate
                        };
                    }
                }
                return dates;
            };

            self.getTabDataModel = function (count, roomTypes) {
                var tabs = [],
                    limit = count || 1,
                    i;

                for (i = 0; i < limit; i++) {
                    tabs.push({
                        roomTypeId: roomTypes && roomTypes[i] || '',
                        roomCount: '1',
                        numAdults: '1',
                        numChildren: '0',
                        numInfants: '0'
                    });
                }
                return tabs;
            };

            self.getRoomDataModel = function (count) {
                var rooms = [],
                    limit = count || 1,
                    i;

                for (i = 0; i < limit; i++) {
                    rooms.push({
                        numAdults: '1',
                        numChildren: '0',
                        numInfants: '0',
                        roomTypeId: '',
                        roomTypeName: '',
                        rateId: '',
                        room_id: '',
                        rateName: '',
                        rateAvg: 0,
                        rateTotal: 0,
                        associatedAddonTotal: 0,
                        addons: [],
                        varyingOccupancy: false,
                        stayDates: {},
                        isOccupancyCheckAlerted: false,
                        demographics: {
                            market: '',
                            source: '',
                            reservationType: '',
                            origin: '',
                            segment: ''
                        }
                    });
                }
                return rooms;
            };

            self.getReservationDataModel = function () {
                return {
                    isHourly: false,
                    isValidDeposit: false,
                    tabs: self.getTabDataModel(),
                    arrivalDate: '',
                    departureDate: '',
                    midStay: false, // Flag to check in edit mode if in the middle of stay
                    stayDays: [],
                    resHours: 1,
                    checkinTime: {
                        hh: '',
                        mm: '00',
                        ampm: 'AM'
                    },
                    checkoutTime: {
                        hh: '',
                        mm: '00',
                        ampm: 'AM'
                    },
                    taxDetails: {},
                    numNights: 1, // computed value, ensure to keep it updated
                    roomCount: 1, // Hard coded for now,
                    rooms: self.getRoomDataModel(),
                    totalTaxAmount: 0, // This is for ONLY exclusive taxes
                    totalStayCost: 0,
                    totalTax: 0, // CICO-10161 > This stores the tax inclusive and exclusive together
                    guest: {
                        id: null, // if new guest, then it is null, other wise his id
                        firstName: '',
                        lastName: '',
                        email: '',
                        city: '',
                        loyaltyNumber: '',
                        sendConfirmMailTo: ''
                    },
                    company: {
                        id: null, // if new company, then it is null, other wise his id
                        name: '',
                        corporateid: '' // Add different fields for company as in story
                    },
                    travelAgent: {
                        id: null, // if new , then it is null, other wise his id
                        name: '',
                        iataNumber: '' // Add different fields for travelAgent as in story
                    },
                    paymentType: {
                        type: {},
                        ccDetails: { // optional - only if credit card selected
                            number: '',
                            expMonth: '',
                            expYear: '',
                            nameOnCard: ''
                        }
                    },
                    demographics: {
                        market: '',
                        source: '',
                        reservationType: '',
                        origin: ''
                    },
                    code: {
                        id: '',
                        type: '',
                        discount: {}
                    },
                    status: '', // reservation status
                    reservationId: '',
                    confirmNum: '',
                    isSameCard: false, // Set flag to retain the card details,
                    rateDetails: [], // This array would hold the configuration information of rates selected for each room
                    isRoomRateSuppressed: false, // This variable will hold flag to check whether any of the room rates is suppressed?
                    reservation_card: {},
                    number_of_infants: 0,
                    number_of_adults: 0,
                    number_of_children: 0,
                    member: {
                        isSelected: false,
                        value: ''
                    },
                    guestMemberships: {
                        hlp: [],
                        ffp: []
                    },
                    group: {
                        id: '',
                        name: '',
                        code: '',
                        company: '',
                        travelAgent: ''
                    },
                    allotment: {
                        id: '',
                        name: '',
                        code: '',
                        company: '',
                        travelAgent: ''
                    },
                    currentSelectedRateCurrencyId: ''
                };
            };

            self.getSearchDataModel = function () {
                return {
                    guestCard: {
                        guestFirstName: '',
                        guestLastName: '',
                        guestCity: '',
                        guestLoyaltyNumber: '',
                        email: ''
                    },
                    companyCard: {
                        companyName: '',
                        companyCity: '',
                        companyCorpId: ''
                    },
                    travelAgentCard: {
                        travelAgentName: '',
                        travelAgentCity: '',
                        travelAgentIATA: ''
                    },
                    groupCard: {
                        name: '',
                        code: ''
                    }
                };
            };

            self.getReservationDetailsModel = function () {
                return {
                    guestCard: {
                        id: '',
                        futureReservations: 0
                    },
                    companyCard: {
                        id: '',
                        futureReservations: 0
                    },
                    travelAgent: {
                        id: '',
                        futureReservations: 0
                    },
                    group: {
                        id: '',
                        futureReservations: 0
                    },
                    allotment: {
                        id: '',
                        futureReservations: 0
                    }
                };
            };

            self.getEmptyAccountData = function () {
                return {
                    'address_details': {
                        'street1': null,
                        'street2': null,
                        'street3': null,
                        'city': null,
                        'state': null,
                        'postal_code': null,
                        'country_id': null,
                        'email_address': null,
                        'phone': null
                    },
                    'account_details': {
                        'account_name': null,
                        'company_logo': '',
                        'account_number': null,
                        'accounts_receivable_number': null,
                        'billing_information': null
                    },
                    'primary_contact_details': {
                        'contact_first_name': null,
                        'contact_last_name': null,
                        'contact_job_title': null,
                        'contact_phone': null,
                        'contact_email': null
                    },
                    'future_reservation_count': 0
                };
            };

            self.getTimeModel = function () {
                return {
                    hh: '',
                    mm: '00',
                    ampm: 'AM'
                };
            };

            self.parseTime = function (timeString) {
                var timeParts = timeString.trim().split(' ');
                // flooring to nearest 15th as the select element's options are in 15s
                var hourMinutes = timeParts[0].split(':');

                hourMinutes[1] = (15 * Math.round(hourMinutes[1] / 15) % 60).toString();
                return {
                    hh: hourMinutes[0].length === 1 ? '0' + hourMinutes[0] : hourMinutes[0],
                    mm: hourMinutes[1].length === 1 ? '0' + hourMinutes[1] : hourMinutes[1],
                    ampm: timeParts[1]
                };
            };

            self.sortRateAlphabet = function (a, b) {
                // Put corp; member and promoted rates on top
                if (a.isCorporate != b.isCorporate) {
                    return a.isCorporate ? -1 : 1;
                }
                if (a.isMember != b.isMember) {
                    return a.isMember ? -1 : 1;
                }
                if (a.isPromotion != b.isPromotion) {
                    return a.isPromotion ? -1 : 1;
                }

                // Sort Rates by Rate Name alphabetically
                if (a.name.toLowerCase() < b.name.toLowerCase()) {
                    return -1;
                } else if (a.name.toLowerCase() > b.name.toLowerCase()) {
                    return 1;
                }
                return 0;
            };

            self.sortRatesAsc = function (a, b) {
                var averageA = parseFloat(a.adr);
                var averageB = parseFloat(b.adr);

                if (averageA < averageB) {
                    return -1;
                }
                if (averageA > averageB) {
                    return 1;
                }
                return 0;
            };

            self.sortRatesInRoomsDESC = function (a, b) {
                // Put corp; member and promoted rates on top
                if (a.isCorporate != b.isCorporate) {
                    return a.isCorporate ? -1 : 1;
                }
                if (a.isMember != b.isMember) {
                    return a.isMember ? -1 : 1;
                }
                if (a.isPromotion != b.isPromotion) {
                    return a.isPromotion ? -1 : 1;
                }
                // descending
                if (a.adr != b.adr) {
                    return b.adr - a.adr;
                }
                return a.adr - b.adr;
            };

            self.sortRatesInRoomsASC = function (a, b) {
                // Put corp; member and promoted rates on top
                if (a.isCorporate != b.isCorporate) {
                    return a.isCorporate ? -1 : 1;
                }
                if (a.isMember != b.isMember) {
                    return a.isMember ? -1 : 1;
                }
                if (a.isPromotion != b.isPromotion) {
                    return a.isPromotion ? -1 : 1;
                }
                // ascending
                if (a.adr != b.adr) {
                    return a.adr - b.adr;
                }
                return b.adr - a.adr;
            };

            self.sortRoomTypesAscADR = function (a, b) {
                if (a.defaultRate.adr < b.defaultRate.adr) {
                    return -1;
                }
                if (a.defaultRate.adr > b.defaultRate.adr) {
                    return 1;
                }
                return 0;
            };

            self.sortRoomTypesAscLevels = function (a, b) {
                if (a.level < b.level) {
                    return -1;
                }
                if (a.level > b.level) {
                    return 1;
                }
                return 0;
            };

            self.isVaryingOccupancy = function (stayDates, arrivalDate, departureDate, numNights) {
                // If staying for just one night then there is no chance for varying occupancy
                if (numNights < 2) {
                    return false;
                }
                // If number of nights is more than one, then need to check across the occupancies
                var numInitialAdults = stayDates[arrivalDate].guests.adults,
                    numInitialChildren = stayDates[arrivalDate].guests.children,
                    numInitialInfants = stayDates[arrivalDate].guests.infants,
                    occupancySimilarity = _.filter(stayDates, function (stayDateInfo, date) {
                    return date !== departureDate && stayDateInfo.guests.adults === numInitialAdults && stayDateInfo.guests.children === numInitialChildren && stayDateInfo.guests.infants === numInitialInfants;
                });

                return occupancySimilarity.length < numNights;
            };

            self.isVaryingRates = function (stayDates, arrivalDate, departureDate, numNights) {
                if (numNights < 2) {
                    return false;
                }
                // If number of nights is more than one, then need to check across the occupancies
                var arrivalRate = stayDates[arrivalDate].rate.id,
                    similarRates = _.filter(stayDates, function (stayDateInfo, date) {
                    return date !== departureDate && stayDateInfo.rate.id === arrivalRate;
                });

                return similarRates.length < numNights;
            };

            self.parseReservationData = function (stayCard, cards) {
                var reservationData = self.getReservationDataModel(),
                    renderData = {},
                    reservationEditMode = false,
                    isManual = false,
                    showSelectedCreditCard = false;

                // ---------------------- ReservationData -------------------------------------------------------------------------//
                reservationData.status = stayCard.reservation_status; // status
                reservationData.inHouse = stayCard.reservation_status === 'CHECKEDIN';
                reservationData.group = { // group
                    id: stayCard.group_id,
                    name: stayCard.group_name,
                    company: cards.company_id || '',
                    travelAgent: cards.travel_agent_id || ''
                };
                reservationData.allotment = { // allotment
                    id: stayCard.allotment_id,
                    name: stayCard.allotment_name,
                    company: cards.company_id || '',
                    travelAgent: cards.travel_agent_id || ''
                };
                // ID
                reservationData.confirmNum = stayCard.confirmation_num;
                reservationData.reservationId = stayCard.reservation_id;
                reservationData.arrivalDate = stayCard.arrival_date;
                reservationData.departureDate = stayCard.departure_date;
                reservationData.numNights = stayCard.total_nights;
                reservationData.isHourly = stayCard.is_hourly_reservation;
                reservationData.number_of_adults = stayCard.number_of_adults;
                reservationData.number_of_children = stayCard.number_of_children;
                reservationData.number_of_infants = stayCard.number_of_infants;
                // CICO-6135
                if (stayCard.arrival_time) {
                    reservationData.checkinTime = self.parseTime(stayCard.arrival_time);
                }
                if (stayCard.is_opted_late_checkout && stayCard.late_checkout_time) {
                    // Handling late checkout
                    reservationData.checkoutTime = self.parseTime(stayCard.late_checkout_time);
                } else if (stayCard.departure_time) {
                    reservationData.checkoutTime = self.parseTime(stayCard.departure_time);
                }
                // Cards
                reservationData.company.id = cards.company_id;
                reservationData.travelAgent.id = cards.travel_agent_id;
                reservationData.guest.id = cards.guest_details.user_id;
                // Other guest details
                reservationData.guest.firstName = cards.guest_details.first_name;
                reservationData.guest.lastName = cards.guest_details.last_name;
                reservationData.guest.email = cards.guest_details.email;
                reservationData.guest.is_vip = cards.guest_details.vip;
                reservationData.guest.image = cards.guest_details.avatar;
                reservationData.guest.phone = cards.guest_details.phone;
                reservationData.guest.mobile = cards.guest_details.mobile;
                reservationData.guest.notes_count = cards.guest_details.notes_count;
                reservationData.guest.membership_type = cards.guest_details.membership_type;
                reservationData.guest.address = {
                    city: cards.guest_details.city,
                    state: cards.guest_details.state,
                    phone: cards.guest_details.phone
                };

                // Demographics
                reservationData.demographics = {
                    reservationType: stayCard.reservation_type_id || '',
                    market: stayCard.market_segment_id || '',
                    source: stayCard.source_id || '',
                    origin: stayCard.booking_origin_id || '',
                    segment: stayCard.segment_id || ''
                };
                // Cost
                reservationData.totalStayCost = stayCard.total_rate;
                // ---------------------------Room Details------------------------------------------------//
                var roomDetails = reservationData.rooms[0]; // Only a single room is possible as this is coming from stay-card

                roomDetails.rateId = [];
                roomDetails.demographics = angular.copy(reservationData.demographics);

                /** TODO : This following LOC has to change if the room number changes to an array
                 *			to handle multiple rooms in future
                 */
                roomDetails.roomNumber = stayCard.room_number;
                roomDetails.roomTypeDescription = stayCard.room_type_description;
                // cost
                roomDetails.rateAvg = stayCard.avg_daily_rate;
                roomDetails.rateTotal = stayCard.total_rate;
                roomDetails.rateName = stayCard.is_multiple_rates ? 'Multiple Rates' : stayCard.rate_name;
                roomDetails.is_package_exist = stayCard.is_package_exist; // -- Changes for CICO-17173
                roomDetails.package_count = stayCard.package_count; // -- Changes for CICO-17173

                reservationData.is_modified = false;
                angular.forEach(stayCard.stay_dates, function (item, index) {
                    reservationData.is_modified = item.rate.actual_amount !== item.rate.modified_amount;
                    reservationData.stayDays.push({
                        date: dateFilter(new tzIndependentDate(item.date), 'yyyy-MM-dd'),
                        dayOfWeek: dateFilter(new tzIndependentDate(item.date), 'EEE'),
                        day: dateFilter(new tzIndependentDate(item.date), 'dd'),
                        shouldDisable: tzIndependentDate(item.date) < tzIndependentDate($rootScope.businessDate)
                    });
                    roomDetails.stayDates[dateFilter(new tzIndependentDate(item.date), 'yyyy-MM-dd')] = {
                        guests: {
                            adults: item.adults,
                            children: item.children,
                            infants: item.infants
                        },
                        rate: {
                            id: item.rate_id
                        },
                        rateDetails: item.rate,
                        roomTypeId: item.room_type_id,
                        roomId: item.room_id
                    };
                    // TODO : Extend for each stay dates
                    roomDetails.rateId.push(item.rate_id);
                    if (index === 0) {
                        roomDetails.roomTypeId = stayCard.reservation_status === 'CHECKEDIN' ? stayCard.room_type_id : item.room_type_id;
                        roomDetails.room_id = stayCard.room_id;
                        roomDetails.roomTypeName = stayCard.room_type_description;
                        RVReservationStateService.bookMark.lastPostedRate = item.rate_id;
                    }
                });
                // appending departure date for UI handling since its not in API response IFF not a day reservation
                if (parseInt(reservationData.numNights) > 0) {
                    reservationData.stayDays.push({
                        date: reservationData.departureDate,
                        dayOfWeek: dateFilter(new tzIndependentDate(reservationData.departureDate), 'EEE'),
                        day: dateFilter(new tzIndependentDate(reservationData.departureDate), 'dd')
                    });
                    roomDetails.stayDates[reservationData.departureDate] = angular.copy(roomDetails.stayDates[reservationData.departureDate]);
                }
                // Payment
                if (stayCard.payment_method_used !== '' && stayCard.payment_method_used !== null) {
                    reservationData.paymentType.type.description = stayCard.payment_method_description;
                    reservationData.paymentType.type.value = stayCard.payment_method_used;
                    if (reservationData.paymentType.type.value === 'CC') {
                        // I dont have any idea on what the following section of code does... Originally commit d1021861 --> https://github.com/StayNTouch/pms/commit/d1021861
                        var paymentDetails = stayCard.payment_details;

                        renderData.creditCardType = paymentDetails.card_type_image.replace('.png', '').toLowerCase();
                        renderData.endingWith = paymentDetails.card_number;
                        renderData.cardExpiry = paymentDetails.card_expiry;
                        renderData.isSwiped = paymentDetails.is_swiped;
                        reservationData.selectedPaymentId = paymentDetails.id;
                        // CICO-11579 - To show credit card if C&P swiped or manual.
                        // In other cases condition in HTML will work
                        if ($rootScope.paymentGateway === 'sixpayments') {
                            if (paymentDetails.is_swiped) {
                                // can't set manual true..that is why added this flag.. Added in HTML too
                                reservationEditMode = true;
                            } else {
                                isManual = true;
                            }
                        }
                        showSelectedCreditCard = true;
                    }
                }
                /* CICO-6069
                 *  Comments from story:
                 *  We should show the first nights room type by default and the respective rate as 'Booked Rate'.
                 *  If the reservation is already in house and it is midstay, it should show the current rate. Would this be possible?
                 */
                var arrivalDateDetails = _.findWhere(stayCard.stay_dates, {
                    date: reservationData.arrivalDate
                });

                roomDetails.numAdults = arrivalDateDetails.adults;
                roomDetails.numChildren = arrivalDateDetails.children;
                roomDetails.numInfants = arrivalDateDetails.infants;

                // Find if midstay or later
                if (new tzIndependentDate(reservationData.arrivalDate) < new tzIndependentDate($rootScope.businessDate)) {
                    reservationData.midStay = true;
                    /**
                     * CICO-8504
                     * Initialize occupancy to the last day
                     * If midstay make it to that day's
                     */
                    var lastDaydetails = _.last(stayCard.stay_dates),
                        currentDayDetails = _.findWhere(stayCard.stay_dates, {
                        date: dateFilter(new tzIndependentDate($rootScope.businessDate), 'yyyy-MM-dd')
                    });

                    if (!!currentDayDetails) {
                        roomDetails.numAdults = currentDayDetails.adults;
                        roomDetails.numChildren = currentDayDetails.children;
                        roomDetails.numInfants = currentDayDetails.infants;
                    } else {
                        roomDetails.numAdults = lastDaydetails.adults;
                        roomDetails.numChildren = lastDaydetails.children;
                        roomDetails.numInfants = lastDaydetails.infants;
                    }
                }

                roomDetails.varyingOccupancy = self.isVaryingOccupancy(roomDetails.stayDates, reservationData.arrivalDate, reservationData.departureDate, reservationData.numNights);
                roomDetails.rateName = self.isVaryingRates(roomDetails.stayDates, reservationData.arrivalDate, reservationData.departureDate, reservationData.numNights) ? 'Multiple Rates Selected' : stayCard.package_description;

                // ---------------------- Tab Data -------------------------------------------------------------------------//
                var activeTab = reservationData.tabs[0];

                _.extend(activeTab, {
                    roomTypeId: roomDetails.roomTypeId,
                    numAdults: roomDetails.numAdults,
                    numChildren: roomDetails.numChildren,
                    numInfants: roomDetails.numInfants
                });

                // CICO-37005
                reservationData.groupCompanyCardId = stayCard.group_cc_id;
                reservationData.groupTravelAgentId = stayCard.group_ta_id;

                return {
                    reservationData: reservationData,
                    reservationEditMode: reservationEditMode,
                    isManual: isManual,
                    showSelectedCreditCard: showSelectedCreditCard,
                    renderData: renderData
                };
            };
        }]);
    }, {}] }, {}, [1]);