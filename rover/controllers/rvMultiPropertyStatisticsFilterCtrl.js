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
        angular.module('sntRover').controller("RVMultiPropertyStatisticsFilterController", ['$scope', '$rootScope', '$timeout', '$state', '$stateParams', 'rvCardStatisticsSrv', function ($scope, $rootScope, $timeout, $state, $stateParams, rvCardStatisticsSrv) {

            BaseCtrl.call(this, $scope);

            var PROPERTY_GROUP_SCROLLER = 'property-group-scroller',
                PROPERTY_LIST_SCROLLER = 'property-list-scroller';

            var fetchPropertyGroups = function fetchPropertyGroups() {
                var onPropertyGroupsFetchSuccess = function onPropertyGroupsFetchSuccess(data) {
                    processPropertyGroups(data.property_groups);
                },
                    onPropertyGroupFetchFailure = function onPropertyGroupFetchFailure() {
                    $scope.propertyGroups = [];
                };

                $scope.callAPI(rvCardStatisticsSrv.fetchPropertyGroups, {
                    onSuccess: onPropertyGroupsFetchSuccess,
                    onFailure: onPropertyGroupFetchFailure
                });
            },
                fetchCurrentChainHotels = function fetchCurrentChainHotels(shouldDisplayDefaultHotel) {
                var onHotelFetchSuccess = function onHotelFetchSuccess(data) {
                    $scope.currentChain.id = data.id;
                    $scope.currentChain.name = data.name;

                    if (shouldDisplayDefaultHotel) {
                        $scope.currentSelectedFilterDetails.hotelName = $rootScope.currentHotelName;
                    }

                    processHotelList(data.hotels);
                },
                    onHotelFetchFailure = function onHotelFetchFailure() {
                    $scope.hotelList = [];
                };

                $scope.callAPI(rvCardStatisticsSrv.fetchCurrentChainHotelList, {
                    onSuccess: onHotelFetchSuccess,
                    onFailure: onHotelFetchFailure
                });
            },
                fetchHotelsByPropertyGroup = function fetchHotelsByPropertyGroup(id) {
                var onSuccess = function onSuccess(data) {
                    $scope.hotelList = data.linked_properties;

                    processHotelList($scope.hotelList);
                },
                    onFailure = function onFailure() {
                    $scope.hotelList = [];
                };

                $scope.callAPI(rvCardStatisticsSrv.fetchHotelListByPropertyGroup, {
                    params: {
                        propertyGroupId: id
                    },
                    onSuccess: onSuccess,
                    onFailure: onFailure
                });
            },
                processHotelList = function processHotelList(hotelList) {
                var placeHolderEntry = {
                    id: '',
                    name: 'Select property'
                };

                hotelList.unshift(placeHolderEntry);
                $scope.hotelList = hotelList;
            },
                processPropertyGroups = function processPropertyGroups(propertyList) {
                var placeHolderEntry = {
                    id: '',
                    name: 'Select property group'
                };

                propertyList.unshift(placeHolderEntry);
                $scope.propertyGroups = propertyList;

                $timeout(function () {
                    $scope.refreshScroller(PROPERTY_GROUP_SCROLLER);
                }, 10);
            },
                configureScroller = function configureScroller() {
                $scope.setScroller(PROPERTY_GROUP_SCROLLER, {
                    'preventDefault': false,
                    'probeType': 3
                });
                $scope.setScroller(PROPERTY_LIST_SCROLLER, {
                    'preventDefault': false,
                    'probeType': 3
                });
            };

            /**
             * Handles the selection of property group
             * @param {Object} group hold the property group object
             * @return {void}
             */
            $scope.onPropertyGroupSelection = function (group) {
                $scope.filter.hotelId = '';
                $scope.currentSelectedFilterDetails.hotelName = '';

                $scope.filter.propertyGroupId = group.id;
                $scope.currentSelectedFilterDetails.propertyGroupName = group.name;
                $scope.filterViewState.displayPropertyList = !$scope.filterViewState.displayPropertyList;
                $scope.filterViewState.displayHotelList = false;

                if (group.id) {
                    fetchHotelsByPropertyGroup(group.id);
                } else {
                    fetchCurrentChainHotels();
                }

                var params = {
                    hotelId: $scope.filter.hotelId,
                    propertyGroupId: $scope.filter.propertyGroupId
                };

                $scope.$emit('UPDATE_FILTER', params);
            };

            /**
             * Handles the selection of hotel
             * @param {Object} hotel - hold the hotel object
             * @return {void}
             */
            $scope.onHotelSelection = function (hotel) {
                $scope.filter.hotelId = hotel.id;
                $scope.currentSelectedFilterDetails.hotelName = hotel.name;

                $scope.filterViewState.displayHotelList = !$scope.filterViewState.displayHotelList;
                $scope.filterViewState.displayPropertyList = false;

                var params = {
                    hotelId: $scope.filter.hotelId,
                    propertyGroupId: $scope.filter.propertyGroupId
                };

                $scope.$emit('UPDATE_FILTER', params);
            };

            /**
             * Toggles the hotel selection dropdown view
             */
            $scope.toggleHotelList = function () {
                $scope.filterViewState.displayHotelList = !$scope.filterViewState.displayHotelList;

                if ($scope.filterViewState.displayHotelList) {
                    $scope.filterViewState.displayPropertyList = false;
                    $timeout(function () {
                        $scope.refreshScroller(PROPERTY_LIST_SCROLLER);
                    }, 100);
                }
            };

            /**
             * Toggles the property selection dropdown view
             */
            $scope.togglePropertyList = function () {
                $scope.filterViewState.displayPropertyList = !$scope.filterViewState.displayPropertyList;

                if ($scope.filterViewState.displayPropertyList) {
                    $scope.filterViewState.displayHotelList = false;
                    $timeout(function () {
                        $scope.refreshScroller(PROPERTY_GROUP_SCROLLER);
                    }, 100);
                }
            };

            // Initialize the controller
            var init = function init() {
                $scope.propertyGroups = [];
                $scope.hotelList = [];
                $scope.currentChain = {};

                $scope.filter = {
                    chainId: '',
                    propertyGroupId: '',
                    hotelId: $rootScope.currentHotelId
                };

                $scope.currentSelectedFilterDetails = {
                    propertyGroupName: '',
                    hotelName: ''
                };

                $scope.filterViewState = {
                    displayHotelList: false,
                    displayPropertyList: false
                };

                configureScroller();

                fetchCurrentChainHotels(true);
                fetchPropertyGroups();
            };

            init();
        }]);
    }, {}] }, {}, [1]);