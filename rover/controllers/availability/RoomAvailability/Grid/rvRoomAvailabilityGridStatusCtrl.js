angular.module('sntRover')
    .controller('rvRoomAvailabilityGridStatusController', [
        '$scope',
        'rvAvailabilitySrv',
        '$q',
        '$window',
        '$timeout',
        'ngDialog',
        function ($scope, rvAvailabilitySrv, $q, $window, $timeout, ngDialog) {
            var AVAILABILITY_GRID_PERIOD_14 = 14,
                AVAILABILITY_GRID_PERIOD_30 = 30;


            /*
            * Function to set all toggle to close
            */
            var initToggleStatus = function () {
                $scope.toggleStatusOf = {};
                $scope.toggleStatusOf['availableRooms'] = false;
                $scope.toggleStatusOf['roomsSold'] = false;
                $scope.toggleStatusOf['overbooking'] = false;
                $scope.toggleStatusOf['occupancy'] = false;
                $scope.toggleStatusOf['roomInventory'] = false;
                $scope.toggleStatusOf['bar'] = false;
                $scope.showShowGroupAllotmentTotals = false;
            };

            // we need horizonat scroller so adding option 'scrollX', also need to get the click event on toggling button on available room
            var init = function () {
                var scrollerOptions = {
                    scrollX: true,
                    preventDefault: false
                };

                $scope.setScroller('room_availability_scroller', scrollerOptions);

                $scope.hideMeBeforeFetching = false;
                $scope.isIncludeOverbooking = false;
                $scope.propertyGroups = [];
                $scope.shouldShowThisHotel = true;
                $scope.idsOfOpenedPropertyGroups = [];

                initToggleStatus();
                $scope.data = rvAvailabilitySrv.getGridData();

                // if already fetched we will show without calling the API
                if ( !isEmptyObject($scope.data) ) {
                    $scope.refreshScroller('room_availability_scroller');
                    $scope.hideMeBeforeFetching = true;
                    $scope.$emit('hideLoader');
                }
            };

            /** ------------------------------------------------------------------------------ */
            /**
             * NOTE: The below three methods handle the Expanded view of the Availability Grid
             * To start with A. Occupancy B. Available Rooms C. Rooms Sold are collapsed
             * The data required to show these sections are catered through different APIs.
             */
            /** ------------------------------------------------------------------------------ */

            var isSectionOpen = function(name) {
                return $scope.toggleStatusOf.hasOwnProperty(name) && !! $scope.toggleStatusOf[name];
            };

            var toggleSection = function(key, value) {
                if ( $scope.toggleStatusOf.hasOwnProperty(key) ) {
                    if ( typeof value === typeof true ) {
                        $scope.toggleStatusOf[key] = value;
                    } else {
                        $scope.toggleStatusOf[key] = ! $scope.toggleStatusOf[key];
                    }
                }
            };

            /** 
             * This is a higher order function that will generate funtion for the purpose
             * 
             * @param {string} section - name of the section to be toggled
             * @param {function} APIMethod - the deep method from the service
             * @param {function} toggleOnly - a funtion that return if we have data and the section only needs to be toggled
             * @returns {function} the actual repeated functionality as function
             */
            var toggleSectionGenerator = function (section, APIMethod, toggleOnly) {

                /** 
                 * The generated function that:
                 * either toggle to show the section, when data is present
                 * fetch data first and then toggle the section
                 *
                 * @param {boolean} open - explicity tell to open or close the section
                 * @param {boolean} multiple - explicity telling 'handleDataChange' that there are multiple data fetch in pipeline
                 * @return {object} - a promise object
                 */
                return function (open, multiple) {
                    var SCROLL = 'room_availability_scroller',
                        deferred = $q.defer(),
                        delay = 100;

                    if ( toggleOnly() ) {
                        toggleSection( section, open );
                        $scope.refreshScroller( SCROLL );
                        $timeout(deferred.resolve, delay);
                    } else {
                        $scope.invokeApi(
                            APIMethod,
                            $scope.getDateParams(),
                            function () {
                                handleDataChange(multiple);
                                toggleSection( section, true );
                                $timeout(deferred.resolve, delay);
                            }
                        );
                    }

                    return deferred.promise;
                };
            };

            var openAllSections = function () {
                var deferred = $q.defer(),
                    show = true,
                    multiple = true,
                    promises = [
                        $scope.toggleOverbooking(show),
                        $scope.toggleOccupancy(show, multiple),
                        $scope.toggleAvailableRooms(show, multiple),
                        $scope.toggleSoldRooms(show, multiple),
                        $scope.toggleShowGroupAllotmentTotals(show),
                        $scope.toggleBar(show, multiple)
                    ],
                    delay = 500;

                $q.all(promises).then(function() {
                    $scope.toggleRoomInventory(show);
                    $timeout(deferred.resolve, delay);
                });

                return deferred.promise;
            };

            var closeAllSections = function () {
                var show = false;

                $scope.toggleRoomInventory();
                /**/
                $scope.toggleOverbooking(show);
                $scope.toggleOccupancy(show);
                $scope.toggleAvailableRooms(show);
                $scope.toggleSoldRooms(show);
                $scope.toggleShowGroupAllotmentTotals(show);
                $scope.toggleBar(show);
            };

            /** ------------------------------------------------------------------------------ */
            /**
             * NOTE: The below three methods handle the Expanded view of the Availability Grid
             * To start with A. Occupancy B. Available Rooms C. Rooms Sold are collapsed
             * The data required to show these sections are catered through different APIs.
             */
            /** ------------------------------------------------------------------------------ */

            BaseCtrl.call(this, $scope);


            // -------------------------------------------------------------------------------------------------------------- GRID DETAILED VIEW
            /**
             * NOTE: The below three methods handle the Expanded view of the Availability Grid
             * To start with A. Occupancy B. Available Rooms C. Rooms Sold are collapsed
             * The data required to show these sections are catered through different APIs.
             */

            $scope.toggleOverbooking = toggleSectionGenerator(
                'overbooking',
                rvAvailabilitySrv.fetchOverbooking,
                function() {
                    return isSectionOpen('overbooking');
                }
            );

            $scope.toggleOccupancy = toggleSectionGenerator(
                'occupancy',
                rvAvailabilitySrv.fetchBARs,
                function() {
                    return isSectionOpen('occupancy');
                }
            );

            $scope.toggleAvailableRooms = toggleSectionGenerator(
                'availableRooms',
                rvAvailabilitySrv.getRoomsAvailability,
                function() {
                    return isSectionOpen('availableRooms');
                }
            );

            $scope.toggleSoldRooms = toggleSectionGenerator(
                'roomsSold',
                rvAvailabilitySrv.getOccupancyCount,
                function() {
                    return isSectionOpen('roomsSold');
                }
            );

            $scope.toggleRoomInventory = function (show) {
                toggleSection( 'roomInventory', show );
                $scope.refreshScroller('room_availability_scroller');
            };

            /**
             * Toggle the section showing the BAR
             */
            $scope.toggleBar = toggleSectionGenerator(
                'bar',
                rvAvailabilitySrv.getBestAvailableRatesByRoomType,
                function() {
                    return isSectionOpen('bar');
                }
            );

            /*
            * function to toggle the display of individual group/allotmet on clicking
            * the toogle button
            */
            $scope.toggleShowGroupAllotmentTotals = function (show) {
                var deferred = $q.defer(),
                    delay = 100;

                if (show === true) {
                    $scope.$parent.fetchGrpNAllotData().then(function () {
                        $timeout(deferred.resolve, delay);
                    });
                } else {
                    if ($scope.showShowGroupAllotmentTotals) {
                        $scope.showShowGroupAllotmentTotals = false;
                        $scope.refreshScroller('room_availability_scroller');
                        $timeout(deferred.resolve, delay);
                    } else {
                        $scope.$parent.fetchGrpNAllotData().then(function () {
                            $timeout(deferred.resolve, delay);
                        });
                    }
                }

                return deferred.promise;
            };

            // add the print orientation before printing
            var addPrintOrientation = function() {
                $( 'head' ).append( "<style id='print-orientation'>@page { size: landscape; }</style>" );
            };

            // add the print orientation after printing
            var removePrintOrientation = function() {
                $( '#print-orientation' ).remove();
            };

            // Listener hash to catch each events
            var listeners = {};

            listeners['PRINT_AVAILABILITY'] = $scope.$on('PRINT_AVAILABILITY', function (event) {
                openAllSections().then(function() {
                    var delay = 500,
                        closeDelay = 1000;

                    $( '#loading' ).addClass( 'ng-hide' );
                    addPrintOrientation();

                    var onPrintCompletion = function() {
                        $timeout(closeAllSections, closeDelay);
                        removePrintOrientation();
                    };

                    $timeout(function () {
                        if ( sntapp.cordovaLoaded ) {
                            cordova.exec(onPrintCompletion, function() {
                                onPrintCompletion();
                            }, 'RVCardPlugin', 'printWebView', []);
                        } else {
                            $window.print();
                            onPrintCompletion();
                        }
                    }, delay);
                });
            });
            // --------------------------------------------------------------------------------------------------------------

            listeners['$includeContentLoaded'] = $scope.$on('$includeContentLoaded', function (event) {
                $scope.$emit('hideLoader');
                $scope.refreshScroller('room_availability_scroller');
            });
            /*
            *  Checks whether additional data available or not
            */
            var isFullDataAvaillable = function () {
                return $scope.data.hasOwnProperty('additionalData');
            };

            var handleDataChange = function (multiple) {
                $scope.data = rvAvailabilitySrv.getGridData();
                if (!isFullDataAvaillable()) {
                    initToggleStatus();
                }
                $scope.refreshScroller('room_availability_scroller');
                $scope.hideMeBeforeFetching = true;

                if ( ! multiple ) {
                    $scope.$emit( 'hideLoader' );
                }
            };
            /**
            * when data changed from super controller, it will broadcast an event 'changedRoomAvailableData'
            */

            listeners['changedRoomAvailableData'] = $scope.$on('changedRoomAvailableData', handleDataChange);

            listeners['changedGrpNAllotData'] = $scope.$on('changedGrpNAllotData', function () {
                $scope.data.gridDataForGroupAvailability = rvAvailabilitySrv.getGridDataForGroupAvailability();
                $scope.data.gridDataForAllotmentAvailability = rvAvailabilitySrv.getGridDataForAllotmentAvailability();

                $scope.showShowGroupAllotmentTotals = true;

                $scope.refreshScroller('room_availability_scroller');
                $scope.$emit('hideLoader');
            });

            /*
            * param - Holdstatus id
            * return Hold status name
            */
            $scope.getGroupAllotmentName = function (source, id) {
                var found = _.findWhere(source.holdStatus, { id: id });

                return found && found.name;
            };

            /**
             * For iScroll, we need width of the table
             * @return {Integer} the width value
             */
            $scope.getWidthForTable = function () {

                var leftMostRowCaptionWidth = 130, // 120px cell width + 10px cell spacing
                    totalColumns = $scope.data && $scope.data.dates && $scope.data.dates.length,
                    individualColWidth = 100; // 95px cell width + 5px cell spacing

                if (!_.has($scope.data, 'dates') && totalColumns < AVAILABILITY_GRID_PERIOD_14) {
                    return 0;
                }

                if (totalColumns === AVAILABILITY_GRID_PERIOD_14 || totalColumns === AVAILABILITY_GRID_PERIOD_30) {
                    return totalColumns * individualColWidth + leftMostRowCaptionWidth;
                }
            };

            $scope.getClassForHoldStatusRow = function (source, id) {
                var group,
                    isDeduct,
                    retCls;

                if (!$scope.showShowGroupAllotmentTotals || !source) {
                    retCls = 'hide-row';
                } else {
                    group = _.findWhere(source.holdStatus, { id: id });
                    isDeduct = group && group['is_take_from_inventory'];

                    if (group && isDeduct) {
                        retCls = '';
                    } else {
                        retCls = 'hide-row';
                    }
                }

                return retCls;
            };
            // Catching INCLUDE_OVERBOOKING message from parent.
            listeners['INCLUDE_OVERBOOKING'] = $scope.$on('INCLUDE_OVERBOOKING', function( event, flag ) {
                $scope.isIncludeOverbooking = flag;
            });

            var successCallbackOfOccupancyAndAvailableRoom = function (data) {
                $scope.$emit("hideLoader");
                if (data && data.length) {
                    $scope.propertyGroups = data;
                } else {
                    $scope.propertyGroups = [];
                }
            };

            var fetchApiFailed = function (errorMessage) {
                $scope.$emit("hideLoader");
            };


            $scope.getOccupancyAndAvailableRoom = function (propertyGroupParams) {
                $timeout(function () {
                    $scope.invokeApi(rvAvailabilitySrv.fetchOccupancyAndAvailableRoom, propertyGroupParams, successCallbackOfOccupancyAndAvailableRoom, fetchApiFailed);
                }, 0);

            };

            // Catching PROPERTY_GROUPS from parent.
            listeners['PROPERTY_GROUPS'] = $scope.$on('PROPERTY_GROUPS', function (event, data) {
                $scope.shouldShowThisHotel = data.shouldShowThisHotel;

                if (data.propertyGroupSelected === "show_this_hotel") {
                    $scope.propertyGroups = [];
                } else {
                    if (data.propertyGroupSelected && data.propertyGroupSelected.length) {
                        $scope.getOccupancyAndAvailableRoom(data);
                    } else {
                        $scope.propertyGroups = [];
                    }
                }
                $scope.idsOfOpenedPropertyGroups = [];
            });

            var successCallbackPropertyGroup = function (hotelsData) {
                if (hotelsData && $scope.propertyGroups) {
                    _.each($scope.propertyGroups, function (element) {
                        if (element.id === hotelsData.id) {
                            element.hotelsData = hotelsData;
                        }
                    });
                }
                $scope.$emit("hideLoader");
            };

            var failureCallBackPropertyGroup = function (errorMessage) {
                $scope.$emit("hideLoader");
            };

            $scope.getBarOccupancyAndAailableRoomByHotelId = function (hotelGroup) {
                var data = {};
                
                data = $scope.getDateParams();
                data.hotel_id = hotelGroup.id;

                $timeout(function () {
                    $scope.invokeApi(rvAvailabilitySrv.fetchBarOccupancyAndAailableRoomByHotelId, data, successCallbackPropertyGroup, failureCallBackPropertyGroup);
                }, 0);
            };

            var successCallbackAvailableRoomType = function (data) {
                $scope.$emit("hideLoader");

                if (data && $scope.propertyGroups) {
                    _.each($scope.propertyGroups, function (element) {
                        if (element.id === data.id) {
                            element.hotelsData.roomTypeNames = data.roomTypeNames;
                            element.hotelsData.roomTypeWiseDetails = data.roomTypeWiseDetails;
                        }
                    });
                }
                $scope.refreshScroller('room_availability_scroller');
            };

            var failureCallBackAvailableRoomType = function (errorMessage) {
                $scope.$emit("hideLoader");
            };

            $scope.togglePropertyGroupAvailableRooms = function (hotelGroup) {
                var isToggleOn = false;

                _.each($scope.propertyGroups, function (element) {
                    if (element.id === hotelGroup.id) {
                        element.hiddenAvailablityRoomType = !element.hiddenAvailablityRoomType;
                        isToggleOn = element.hiddenAvailablityRoomType;
                    }
                });

                if (!isToggleOn) {
                    var data = {};
                    
                    data = $scope.getDateParams();
                    data.hotel_id = hotelGroup.id;

                    $timeout(function () {
                        $scope.invokeApi(rvAvailabilitySrv.fetchAvailableRoomTypeByHotelId, data, successCallbackAvailableRoomType, failureCallBackAvailableRoomType);
                    }, 0);
                }
            };
            
            // Handling property group expansion
            $scope.showDropDownForPropertyGroup = function (index) {
                return _.contains($scope.idsOfOpenedPropertyGroups, $scope.propertyGroups[index].id);
            };

            $scope.toggleDropDownPropertyGroup = function (index, hotelGroup) {
                if (_.contains($scope.idsOfOpenedPropertyGroups, $scope.propertyGroups[index].id)) {
                    var temp = _.filter($scope.idsOfOpenedPropertyGroups,
                        function (num) {
                            return num !== $scope.propertyGroups[index].id;
                        });

                    $scope.idsOfOpenedPropertyGroups = temp;
                } else {
                    $scope.idsOfOpenedPropertyGroups.push($scope.propertyGroups[index].id);
                    $scope.getBarOccupancyAndAailableRoomByHotelId(hotelGroup);
                }
                $scope.refreshScroller('room_availability_scroller');
            };

            init();

            // Destory listeners
            angular.forEach(listeners, function(listener) {
                $scope.$on('$destroy', listener);
            });

            /**
             * Show house events list popup
             * @param {String} date - selected date
             * @param {Number} eventsCount - events count
             * @return {void} 
             */
            $scope.showHouseEventsListPopup = function(date, eventsCount) {
                if (!eventsCount) {
                    return;
                }

                $scope.selectedEventDisplayDate = date;
                ngDialog.open({
                    template: '/assets/partials/popups/rvHouseEventsListPopup.html',
                    scope: $scope,
                    controller: 'rvHouseEventsListPopupCtrl',
                    className: 'ngdialog-theme-default',
                    closeByDocument: false,
                    closeByEscape: true
                });
            };
        }
    ]);
