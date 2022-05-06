sntRover.controller('RVDiaryConfirmationCtrl', ['$scope',
    '$rootScope',
    '$state',
    '$vault',
    'ngDialog',
    'rvDiarySrv',
    'rvDiaryUtil',
    '$filter',
    '$timeout',
    'RVReservationBaseSearchSrv',
    function($scope, $rootScope, $state, $vault, ngDialog, rvDiarySrv, util, $filter, $timeout, RVReservationBaseSearchSrv) {
        BaseCtrl.call(this, $scope);

        $scope.title = ($scope.selectedReservations.length > 1 ? 'these rooms' : 'this room');

        $scope.initSelections = function() {
            (function() {
                var convertTimeFormat = function(fn, obj) {
                        var arrival = new Date(obj.arrival),
                            departure = new Date(obj.departure);

                        return fn(arrival.toComponents(),
                            departure.toComponents());
                    },
                    dFormat = function(arrival, departure) {
                        var arrival_date   = tzIndependentDate(arrival.date.toDateString().replace(/-/g, '/')),
                            arrival_date   =  $filter('date')(arrival_date, $rootScope.fullDateFullMonthYear),

                            departure_date = tzIndependentDate(departure.date.toDateString().replace(/-/g, '/')),
                            departure_date =  $filter('date')(departure_date, $rootScope.fullDateFullMonthYear);


                        return {
                            arrival_time: arrival.time.toString(true),

                            arrival_date: arrival_date,
                            departure_time: departure.time.toString(true),
                            departure_date: departure_date

                        };
                    },

                    vFormat = function(arrival, departure) {
                        return {
                            arrival_date: arrival.date.year + '/' + (arrival.date.month + 1) + '/' + arrival.date.day,
                            arrival_time: arrival.time.toReservationFormat(false),
                            departure_date: departure.date.year + '/' + (departure.date.month + 1) + '/' + departure.date.day,
                            departure_time: departure.time.toReservationFormat(false)
                        };
                    },
                    occupancy = ($scope.selectedReservations.length > 0) ? $scope.selectedReservations[0].occupancy : undefined;

                $scope.selection = {
                    rooms: []
                };

                $scope.vaultSelections = {
                    rooms: []
                };

                if (occupancy) {
                    $scope.reservationsSettings = rvDiarySrv.ArrivalFromCreateReservation();

                    _.extend($scope.vaultSelections, convertTimeFormat(vFormat, occupancy));
                    _.extend($scope.selection, convertTimeFormat(dFormat, occupancy));
                    var selected_type;

                    _.each($scope.selectedReservations, function(obj, idx, list) {
                        var item = {
                                room_id: obj.room.id,
                                room_no: obj.room.room_no,
                                room_type: obj.room.room_type_name,
                                amount: parseFloat(obj.occupancy.amount).toFixed(2),
                                rateId: obj.occupancy.rate_id,
                                numAdults: ($scope.reservationsSettings ? $scope.reservationsSettings.adults : 1),
                                numChildren: ($scope.reservationsSettings ? $scope.reservationsSettings.children : 0),
                                numInfants: ($scope.reservationsSettings ? $scope.reservationsSettings.infants : 0)
                            },
                            local_version = util.shallowCopy({}, item);

                        if ( $scope.gridProps.filter.rate_type === 'Corporate') {
                            selected_type = $scope.gridProps.filter.rate.type;
                            if (selected_type === "COMPANY") {
                                item.company_card_id = $scope.gridProps.filter.rate.id;
                            }
                            if (selected_type === "TRAVELAGENT") {
                                item.travel_agent_id = $scope.gridProps.filter.rate.id;
                            }
                            item.contract_id = $scope.gridProps.contractId;
                        }
                        $scope.vaultSelections.rooms.push(item);

                        local_version.amount = $scope.currencySymbol + ' ' + local_version.amount;

                        $scope.selection.rooms.push(local_version);
                    });
                }
            })();
        };

        $scope.initSelections();

        $scope.closeWithAnimation = function () {
            // to add stjepan's popup showing animation
            $rootScope.modalOpened = false;
            $timeout(function() {
                ngDialog.close();
            }, 300);
        };

        $scope.selectAdditional = function() {
            $scope.closeWithAnimation ();
        };

        $scope.removeSelectedOccupancy = function(idx) {
            var removed = $scope.selectedReservations.splice(idx, 1);

            removed[0].occupancy.selected = false;

            if ($scope.selectedReservations.length === 0) {
                ngDialog.close();
            } else {
                this.initSelections();
            }

            $scope.renderGrid();
        };

        $scope.routeToSummary = function() {

            var fetchSuccess = function(isAddonsConfigured) {
                $scope.saveToVault('temporaryReservationDataFromDiaryScreen', $scope.vaultSelections);
                // CICO-9429
                if ( !$rootScope.isHourlyRateOn && $rootScope.isAddonOn && isAddonsConfigured && $rootScope.hotelDiaryConfig.mode !== 'FULL' ) {
                    var arrival_date = $scope.vaultSelections.arrival_date;
                    var departure_date = $scope.vaultSelections.departure_date;

                    $state.go('rover.reservation.staycard.mainCard.addons', {
                        "from_date": arrival_date,
                        "to_date": departure_date,
                        "reservation": 'HOURLY'
                    });
                } else {
                    $state.go('rover.reservation.staycard.mainCard.summaryAndConfirm', {
                        reservation: 'HOURLY'
                    });
                }
                $scope.closeWithAnimation ();
            };
            var fetchFailed = function(errorMessage) {
                $scope.errorMessage = errorMessage;
                $scope.closeWithAnimation();
            };
            var params = {};

                params.from_date = $scope.vaultSelections.arrival_date;
                params.to_date = $scope.vaultSelections.departure_date;
                params.is_active = true;
            // Fetches whether any configured addons are available.
            // CICO-16874
            $scope.invokeApi(RVReservationBaseSearchSrv.hasAnyConfiguredAddons, params, fetchSuccess, fetchFailed); // CICO-16874
        };

        // save data to $vault
        // @param {String} - 'key', the name
        // @param {Object} - 'value', to be saved
        // @return {String} - saved value in $vault
        $scope.saveToVault = function(key, value) {
            // $vault.set will only accept numbers & strings
            $vault.set(key, JSON.stringify(value));

            // return the same value string back
            return $vault.get(key) || false;
        };

        // read data from $vault
        // @param {String} - 'key', the name
        // @return {Object} - parsed, saved value from $value
        $scope.readFromVault = function(key) {
            return !!$vault.get(key) ? JSON.parse($vault.get(key)) : false;
        };

        // may be moved to utils or to a deeper scope into react
        $scope.dateToMs = function(date) {
            return Object.prototype.toString.apply(date) === '[object Date]' ? date.getTime() : false;
        };
        $scope.msToDate = function(ms) {
            return Object.prototype.toString.apply(new Date(ms)) === '[object Date]' ? new Date(ms) : false;
        };

        $scope.cancelSelection = function() {
            var removed = $scope.selectedReservations.pop();

            if ( !! removed ) {
                removed.occupancy.selected = false;
            }

            $scope.closeWithAnimation();
            $scope.renderGrid();
        };

    }
]);
