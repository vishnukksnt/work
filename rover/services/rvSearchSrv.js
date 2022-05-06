angular.module("sntRover").service("RVSearchSrv", [
    "$q",
    "RVBaseWebSrv",
    "rvBaseWebSrvV2",
    "$vault",
    function($q, RVBaseWebSrv, rvBaseWebSrvV2, $vault) {
        var self = this;

        self.searchPerPage = 50;
        self.page = 1;
        self.to_date = "";
        self.from_date = "";

        this.fetch = function(dataToSend, useCache) {
            var deferred = $q.defer();

            dataToSend.fakeDataToAvoidCache = new Date();
            self.toDate = self.toDate === undefined ? "" : self.toDate;
            var url =
                "search.json?per_page=" +
                self.searchPerPage +
                "&page=" +
                self.page;

            if (useCache && !!self.data) {
                deferred.resolve(self.data);
            } else {
                RVBaseWebSrv.getJSON(url, dataToSend).then(
                    function(data) {
                        for (var i = 0; i < data.results.length; i++) {
                            data.results[i].is_row_visible = true;
                        }

                        if (dataToSend.is_queued_rooms_only === true) {
                            self.lastSearchedType = "queued";
                        } else {
                            self.lastSearchedType = "others";
                        }

                        self.data = data.results;
                        self.searchTypeStatus = dataToSend.status;
                        self.totalSearchResults = data.total_count;
                        self.totalReservationsCount = data.total_reservations_count;
                        deferred.resolve(self.data);
                    },
                    function(data) {
                        deferred.reject(data);
                    }
                );
            }

            return deferred.promise;
        };

        this.fetchReservationForBillingInfo = function(data) {
            var deferred = $q.defer();
            var url =  '/api/reservations/search_reservation_for_billing_info';
    
            RVBaseWebSrv.getJSON(url, data).then(function(data) {
                deferred.resolve(data);
            }, function(data) {
                deferred.reject(data);
            });
            return deferred.promise;
        };
    

        // update the reservation details of cached data
        this.updateRoomDetails = function(confirmation, data) {
            if (!self.data) {
                return;
            }

            // update room related details based on confirmation id
            for (var i = 0, j = self.data.length; i < j; i++) {
                if (self.data[i]["confirmation"] === confirmation) {
                    // special check since the ctrl could ask to set room number to null
                    if (data.hasOwnProperty("room")) {
                        self.data[i]["room"] = data.room;
                    }

                    if (data["reservation_status"]) {
                        self.data[i]["reservation_status"] =
                            data["reservation_status"];
                    }

                    if (data["roomstatus"]) {
                        self.data[i]["roomstatus"] = data["roomstatus"];
                    }

                    if (data["fostatus"]) {
                        self.data[i]["fostatus"] = data["fostatus"];
                    }

                    if (data["room_ready_status"]) {
                        self.data[i]["room_ready_status"] =
                            data["room_ready_status"];
                    }

                    if (data["is_reservation_queued"]) {
                        self.data[i]["is_reservation_queued"] =
                            data["is_reservation_queued"];
                    }

                    if (data["is_queue_rooms_on"]) {
                        self.data[i]["is_queue_rooms_on"] =
                            data["is_queue_rooms_on"];
                    }

                    if (data["late_checkout_time"]) {
                        self.data[i]["late_checkout_time"] =
                            data["late_checkout_time"];
                    }

                    if (data["is_opted_late_checkout"]) {
                        self.data[i]["is_opted_late_checkout"] =
                            data["is_opted_late_checkout"];
                    }
                    // Fix for CICO-33114 where the departure date in cache wasn't getting updated.
                    if (data["departure_date"]) {
                        self.data[i]["departure_date"] = data["departure_date"];
                    }
                }

                // if not then check if this room number is assigned to any other reservation
                // CICO-10123 : if both reservation having same room number and reservation status is CHECKING_IN
                // if so remove the room no from that reservation
                else if (
                    data.hasOwnProperty("room") &&
                    data["room"] === self.data[i]["room"] &&
                    self.data[i]["reservation_status"] === "CHECKING_IN" &&
                    data["reservation_status"] === "CHECKING_IN"
                ) {
                    self.data[i]["room"] = "";
                }
            }
        };
        this.removeResultFromData = function(reservationId) {
            if (self.lastSearchedType === "queued") {
                for (var i = 0, j = self.data.length; i < j; i++) {
                    if (self.data[i]["id"] === reservationId) {
                        self.data.splice(i, 1);
                        break;
                    }
                }
            }
        };

        // update the guest details of cached data
        this.updateGuestDetails = function(guestid, data) {
            if (!self.data) {
                return;
            }

            // update guest details based on the guest id(s)
            for (var i = 0, j = self.data.length; i < j; i++) {
                if (self.data[i]["guest_detail_id"] === guestid) {
                    if (data["firstname"]) {
                        self.data[i]["firstname"] = data["firstname"];
                    }

                    if (data["lastname"]) {
                        self.data[i]["lastname"] = data["lastname"];
                    }

                    if (data["location"]) {
                        self.data[i]["location"] = data["location"];
                    }

                    if (typeof data["vip"] === "boolean") {
                        self.data[i]["vip"] = data["vip"];
                    }

                    if (data["is_flagged"]) {
                        self.data[i]["is_flagged"] = data["is_flagged"];
                    }

                    // Update the primary image of the guest with the changed avatar
                    if (data["avatar"]) {
                        for (var k in self.data[i]["images"]) {
                            if (self.data[i]["images"][k].is_primary) {
                                self.data[i]["images"][k].guest_image =
                                    data["avatar"];
                            }
                        }
                    }
                }
            }
        };

        this.searchByCC = function(swipeData) {
            var deferred = $q.defer();
            var url = "/staff/payments/search_by_cc";

            RVBaseWebSrv.postJSON(url, swipeData).then(
                function(data) {
                    for (var i = 0; i < data.length; i++) {
                        data[i].is_row_visible = true;
                    }
                    deferred.resolve(data);
                    self.data = data;
                },
                function(data) {
                    deferred.reject(data);
                }
            );
            return deferred.promise;
        };
        this.fetchReservationsToPostCharge = function(dataToSrv) {
            var deferred = $q.defer();

            if (dataToSrv.refreshApi) {
                var url = "api/reservations/search_reservation";

                rvBaseWebSrvV2.postJSON(url, dataToSrv.postData).then(
                    function(data) {
                        deferred.resolve(data);
                        self.reservationsList = data;
                    },
                    function(data) {
                        deferred.reject(data);
                    }
                );
            } else {
                deferred.resolve(self.reservationsList);
            }

            return deferred.promise;
        };

        this.getGroupList = function(params) {
            var deferred = $q.defer(),
                url = "/api/groups/search";

            var data = {
                q: params.query,
                from_date: self.from_date,
                to_date: self.to_date,
                per_page: self.searchPerPage,
                page: self.page
            };

            rvBaseWebSrvV2.postJSON(url, data).then(
                function(data) {
                    self.data = data.groups;
                    deferred.resolve(self.data);
                },
                function(errorMessage) {
                    deferred.reject(errorMessage);
                }
            );

            return deferred.promise;
        };

        /**
         * Fetches the reservations eligible for bulk checkout
         * @param {Object} params request params
         * @return {Promise} promise object
         */
        this.fetchReservationsForBulkCheckout = function(params) {
            var deferred = $q.defer(),
                url = '/api/reservations/fetch_bulk_checkout_reservations';

            rvBaseWebSrvV2.getJSON(url, params).then(
                function(data) {
                    for (var i = 0; i < data.results.length; i++) {
                        data.results[i].is_row_visible = true;
                    }
                    self.bulkCheckoutReservationsCount = data.total_count;
                    deferred.resolve(data);
                },
                function(errorMessage) {
                    deferred.reject(errorMessage);
                }
            );

            return deferred.promise;
        };
        
        /**
         * Perform bulk checkout of reservations
         * @param {Object} params request params for the bulk checkout operation
         * @return {Promise} promise
         */
        this.processBulkCheckout = function (params) {
            var url = '/api/reservations/bulk_checkout.json',
                deferred = $q.defer();

            rvBaseWebSrvV2.postJSON(url, params).then(
                function (data) {
                    deferred.resolve(data);
                },
                function (data) {
                    deferred.reject(data);
                }
            );

            return deferred.promise;
        };

        /**
         * Refresh the reservtions with open balance
         * @return {Promise} promise
         */
        this.refreshReservationsWithOpenBalance = function () {
            var url = '/api/reservations/update_has_any_open_bill',
                deferred = $q.defer();

            rvBaseWebSrvV2.postJSON(url).then(
                function (data) {
                    deferred.resolve(data);
                },
                function (data) {
                    deferred.reject(data);
                }
            );

            return deferred.promise;
        };

        /**
         * Fetch the count of reservations which are eligible for bulk check-in
         * @return {Promise} promise
         */
        this.fetchBulkCheckinReservationsCount = function() {
            var deferred = $q.defer(),
                url =  'api/reservations/fetch_bulk_checkin_reservations_count';
    
            rvBaseWebSrvV2.getJSON(url).then(function(data) {
                deferred.resolve(data);
            }, function(data) {
                deferred.reject(data);
            });

            return deferred.promise;
        };

        /**
         * Perform bulk check-in of eligible reservations
         * @return {Promise} promise
         */
        this.peformBulkCheckin = function () {
            var url = '/api/reservations/bulk_checkin',
                deferred = $q.defer();

            rvBaseWebSrvV2.postJSON(url).then(
                function (data) {
                    deferred.resolve(data);
                },
                function (data) {
                    deferred.reject(data);
                }
            );

            return deferred.promise;
        };

        /**
         * Fetch the list of registration cards
         * @param {Object} params - request params
         * @returns {Promise}
         */
        this.fetchRegistrationCardList = function (params) {
            var url = '/api/registration_cards',
                deferred = $q.defer();

            rvBaseWebSrvV2.getJSON(url, params).then(function (data) {
                deferred.resolve(data);
            }, function (data) {
                deferred.reject(data);
            });

            return deferred.promise;
        };

    }
]);
