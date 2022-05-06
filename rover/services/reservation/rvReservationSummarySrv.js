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
        angular.module('sntRover').service('RVReservationSummarySrv', ['$q', 'rvBaseWebSrvV2', function ($q, rvBaseWebSrvV2) {
            var that = this;

            this.reservationData = {};
            this.reservationData.demographics = {};

            var demographicsData = {};
            var sourcesData = {};
            var originsData = {};
            var reservationTypes = {};
            var segmentData = {};

            this.fetchPaymentMethods = function () {
                var deferred = $q.defer();
                var url = '/staff/payments/addNewPayment.json';

                rvBaseWebSrvV2.getJSON(url).then(function (data) {
                    deferred.resolve(data.data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.fetchLengthSegments = function () {
                var deferred = $q.defer();

                if (isEmpty(segmentData)) {
                    var url = '/api/segments?is_active=true';

                    rvBaseWebSrvV2.getJSON(url).then(function (data) {
                        segmentData = data;
                        deferred.resolve(data);
                    }, function (errorMessage) {
                        deferred.reject(errorMessage);
                    });
                } else {
                    deferred.resolve(segmentData);
                }

                return deferred.promise;
            };

            this.fetchDemographicMarketSegments = function () {
                var deferred = $q.defer();

                if (isEmpty(demographicsData)) {
                    var url = '/api/market_segments?is_active=true';

                    rvBaseWebSrvV2.getJSON(url).then(function (data) {
                        demographicsData = data;
                        deferred.resolve(demographicsData);
                    }, function (errorMessage) {
                        deferred.reject(errorMessage);
                    });
                } else {
                    deferred.resolve(demographicsData);
                }

                return deferred.promise;
            };

            this.fetchDemographicSources = function () {
                var deferred = $q.defer();

                if (isEmpty(sourcesData)) {
                    var url = '/api/sources?is_active=true'; // TODO: Whether we need active list only or all

                    rvBaseWebSrvV2.getJSON(url).then(function (data) {
                        sourcesData = data;
                        deferred.resolve(sourcesData);
                    }, function (errorMessage) {
                        deferred.reject(errorMessage);
                    });
                } else {
                    deferred.resolve(sourcesData);
                }

                return deferred.promise;
            };

            this.fetchDemographicOrigins = function () {
                var originsSuccessCallback = function originsSuccessCallback(data) {
                    // We need only the booking origins activated in the admin
                    originsData.is_use_origins = data.is_use_origins;
                    originsData.origins = [];
                    for (var i in data.booking_origins) {
                        if (data.booking_origins[i].is_active) {
                            originsData.origins.push(data.booking_origins[i]);
                        }
                    }

                    deferred.resolve(originsData);
                };
                var deferred = $q.defer();

                if (isEmpty(originsData)) {
                    var url = '/api/booking_origins';

                    rvBaseWebSrvV2.getJSON(url).then(function (data) {
                        originsSuccessCallback(data);
                    }, function (errorMessage) {
                        deferred.reject(errorMessage);
                    });
                } else {
                    deferred.resolve(originsData);
                }

                return deferred.promise;
            };

            this.fetchDemographicReservationTypes = function () {
                var reservationTypesCallback = function reservationTypesCallback(data) {
                    reservationTypes = [];
                    that.reservationData.demographics.reservationTypes = [];
                    // We need only the active reservation types
                    for (var i in data.reservation_types) {
                        if (data.reservation_types[i].is_active) {
                            reservationTypes.push(data.reservation_types[i]);
                        }
                    }
                    deferred.resolve(reservationTypes);
                };
                var deferred = $q.defer();

                if (isEmpty(reservationTypes)) {
                    var url = '/api/reservation_types.json?is_active=true';

                    rvBaseWebSrvV2.getJSON(url).then(function (data) {
                        reservationTypesCallback(data);
                    }, function (errorMessage) {
                        deferred.reject(errorMessage);
                    });
                } else {
                    deferred.resolve(reservationTypes);
                }

                return deferred.promise;
            };

            this.fetchInitialData = function () {
                var deferred = $q.defer(),
                    promises = {};

                promises['marketsData'] = that.fetchDemographicMarketSegments();
                promises['originsData'] = that.fetchDemographicOrigins();
                promises['sourcesData'] = that.fetchDemographicSources();
                promises['reservationTypesData'] = that.fetchDemographicReservationTypes();
                promises['segmentsData'] = that.fetchLengthSegments();

                $q.all(promises).then(function (response) {
                    that.reservationData.demographics.is_use_markets = response.marketsData.is_use_markets;
                    that.reservationData.demographics.markets = response.marketsData.markets;
                    that.reservationData.demographics.is_use_origins = response.originsData.is_use_origins;
                    that.reservationData.demographics.origins = response.originsData.origins;
                    that.reservationData.demographics.is_use_sources = response.sourcesData.is_use_sources;
                    that.reservationData.demographics.sources = response.sourcesData.sources;
                    that.reservationData.demographics.is_use_segments = response.segmentsData.is_use_segments;
                    that.reservationData.demographics.segments = response.segmentsData.segments;
                    that.reservationData.demographics.reservationTypes = response.reservationTypesData;

                    deferred.resolve(that.reservationData);
                }, function (errorMessage) {
                    deferred.reject(errorMessage);
                });

                return deferred.promise;
            };

            /**
             * Call API to Save the reservation
             */
            this.saveReservation = function (data) {
                var deferred = $q.defer();
                var url = '/api/reservations';

                rvBaseWebSrvV2.postJSON(url, data).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };
            /**
             * Update Billing info
             */
            this.updateBillingInformation = function (params) {
                var deferred = $q.defer(),
                    url = "api/bill_routings/update_dates";

                rvBaseWebSrvV2.postJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            /**
             * Sends the confirmation email
             */
            this.sendConfirmationEmail = function (data) {
                var deferred = $q.defer();
                var url = '/api/reservations/' + data.reservationId + '/email_confirmation';

                delete data['reservationId'];

                rvBaseWebSrvV2.postJSON(url, data).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            /**
             * Sends the confirmation email
             */
            this.sendHourlyConfirmationEmail = function (data) {
                var deferred = $q.defer();
                // /api/reservations/hourly_confirmation_emails?reservation_ids[]=1311017&reservation_ids[]=1311016&reservation_ids[]=1311018]&emails[]=shiju@stayntouch.com
                var url = '/api/reservations/hourly_confirmation_emails?';

                _.each(data.reservation_ids, function (id) {
                    url += 'reservation_ids[]=' + id + '&';
                });
                _.each(data.emails, function (mail) {
                    url += 'emails[]=' + encodeURIComponent(mail) + '&';
                });

                delete data['reservation_ids'];
                delete data['emails'];

                rvBaseWebSrvV2.postJSON(url, data).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            /**
             * Call API to Update the reservation
             */
            this.updateReservation = function (data) {
                var deferred = $q.defer();
                var url = '/api/reservations/' + data.reservationId;

                rvBaseWebSrvV2.putJSON(url, data).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            /**
             * Call API to do the payment - SIX payment
             */
            this.paymentAction = function (data) {
                var deferred = $q.defer();
                var url = '/api/ipage/store_payments';

                rvBaseWebSrvV2.postJSON(url, data).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.startPayment = function (data) {
                var deferred = $q.defer();
                var url = '/api/cc/get_token';

                rvBaseWebSrvV2.postJSON(url, data).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };
            this.fetchRooms = function () {
                var deferred = $q.defer();
                var url = '/api/rooms';

                rvBaseWebSrvV2.getJSON(url).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.getRateName = function (params) {
                var deferred = $q.defer();
                var url = '/api/rates/' + params.id;

                rvBaseWebSrvV2.getJSON(url).then(function (data) {
                    deferred.resolve(data.name);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.getRateDetails = function (params) {
                var deferred = $q.defer();
                var url = '/api/rates/' + params.id;

                rvBaseWebSrvV2.getJSON(url).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.getTaxDetails = function (rates) {
                var deferred = $q.defer();
                var url = '/api/rates/tax_information/';

                rvBaseWebSrvV2.getJSON(url, rates).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.fetchDefaultRoutingInfo = function (params) {
                var deferred = $q.defer();
                var url = '/api/default_account_routings/routings_count/';

                rvBaseWebSrvV2.postJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.applyDefaultRoutingToReservation = function (params) {
                var deferred = $q.defer();
                var url = '/api/default_account_routings/attach_reservation';

                rvBaseWebSrvV2.postJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });

                return deferred.promise;
            };

            // To fetch the confirmation email data for PRINT functionality on Rover.
            this.fetchResservationConfirmationPrintData = function (params) {
                var deferred = $q.defer(),
                    url = '/api/reservations/' + params.reservation_id + '/confirmation_email_data';

                rvBaseWebSrvV2.getJSON(url, params).then(function (data) {
                    // Converting array into String here, for display purpose.
                    data.data.addons_list = data.data.addons ? data.data.addons.toString() : "";
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            // To fetch the Cancellation email data for PRINT functionality on Rover.
            this.fetchResservationCancellationPrintData = function (params) {
                var deferred = $q.defer(),
                    url = '/api/reservations/' + params.reservation_id + '/cancellation_email_data';

                rvBaseWebSrvV2.getJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            /*
             * Call API to Update the no room move flag
             */
            this.updateNoRoomMove = function (data) {
                var deferred = $q.defer();
                var url = '/api/reservations/' + data.reservationId + '/update_no_room_move_flag';

                rvBaseWebSrvV2.postJSON(url, data).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            /*
             * Call API to Update the restrict post flag
             */
            this.updateRestrictPost = function (data) {
                var deferred = $q.defer();
                var url = '/api/reservations/' + data.reservationId + '/update_restrict_post_flag';

                rvBaseWebSrvV2.postJSON(url, data).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };
            /*
             * Save reservation tax exempt data
             */
            this.saveTaxExempt = function (data) {
                var deferred = $q.defer(),
                    url = '/api/reservations/save_tax_exempt';

                rvBaseWebSrvV2.postJSON(url, data).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.checkUpsellAvailability = function (reservationId) {
                var deferred = $q.defer(),
                    url = '/api/reservations/' + reservationId + '/upsell_availability';

                rvBaseWebSrvV2.getJSON(url).then(function (data) {
                    deferred.resolve(data.is_upsell_available);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.updateCommission = function (data) {
                var deferred = $q.defer(),
                    url = '/api/reservations/' + data.reservationId + '/update_commission';

                rvBaseWebSrvV2.putJSON(url, data).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            this.retrieveRoomPin = function (params) {
                var deferred = $q.defer(),
                    url = '/staff/reservation/get_room_pin';

                rvBaseWebSrvV2.getJSON(url, params).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };

            /**
             * Update booker email for a reservation
             * @param {Object} data contains booker email and reservation id
             * @return {Promise}
             */
            this.updateBookerEmail = function (data) {
                var deferred = $q.defer(),
                    url = '/api/reservations/' + data.reservationId + '/update_booker_email';

                rvBaseWebSrvV2.putJSON(url, data).then(function (data) {
                    deferred.resolve(data);
                }, function (data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            };
        }]);
    }, {}] }, {}, [1]);