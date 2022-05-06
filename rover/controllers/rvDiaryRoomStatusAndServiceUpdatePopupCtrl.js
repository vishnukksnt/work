'use strict';

angular.module('sntRover').controller('rvDiaryRoomStatusAndServiceUpdatePopupCtrl', ['$scope', '$rootScope', 'ngDialog', 'RVHkRoomStatusSrv', 'RVHkRoomDetailsSrv', '$timeout', '$filter', 'rvUtilSrv', 'rvPermissionSrv', function ($scope, $rootScope, ngDialog, RVHkRoomStatusSrv, RVHkRoomDetailsSrv, $timeout, $filter, util, rvPermissionSrv) {
    BaseCtrl.call(this, $scope);

    var ROOM_STATUS_SERVICE_UPDATE_SCROLLER = 'roomStatusServiceUpdateScroller',
        INTERVAL_FOR_TIME_SELECTOR = 15,
        HOUR_MODE = 12,
        IN_SERVICE_ID = 1,
        OUT_OF_ORDER_ID = 3,
        isHourly = util.getDiaryMode() === 'FULL';

    $scope.hasPermissionToPutRoomOOSOrOOO = rvPermissionSrv.getPermissionValue('PUT_ROOM_OOO_OR_OOS');

    // Closes the popup
    $scope.closeDialog = function () {
        ngDialog.close();
    };

    /**
     * Set the active tab in the popup - status | service
     * @param {String} name active tab name
     * @return {void}
     */
    $scope.setActiveSection = function (name) {
        $scope.currentActiveSection = name;
        if (name === 'service') {
            $timeout(function () {
                $scope.refreshScroller(ROOM_STATUS_SERVICE_UPDATE_SCROLLER);
            }, 1000);
        }
    };

    /**
     * Get class name based on the hk status and service status
     * @param {String} roomStatus hk status
     * @param {String} serviceStatus service status
     * @return {String} className css class
     */
    $scope.getClassNameByHkStatus = function (roomStatus, serviceStatus) {
        var className = '';

        if (serviceStatus !== 'IN_SERVICE') {
            className = 'unavailable';
        } else if (roomStatus === 'CLEAN' && $rootScope.useInspectedRoomStatus) {
            className = 'clean not-inspected';
        } else if (roomStatus === 'CLEAN' && !$rootScope.useInspectedRoomStatus) {
            className = 'clean';
        } else if (roomStatus === 'INSPECTED') {
            className = 'inspected';
        } else if (roomStatus === 'DIRTY') {
            className = 'dirty';
        } else if (roomStatus === 'PICKUP') {
            className = 'pickup';
        } else if (roomStatus === 'DO_NOT_DISTURB') {
            className = 'dnd';
        }

        return className;
    };

    /**
     * Find hk status id by value
     * @param {String} statusValue - status value
     * @return {String} id return id of the status
     */
    var findHkStatusIdByValue = function findHkStatusIdByValue(statusValue) {
        var selectedItem = _.find($scope.hkStatusList, {
            value: statusValue
        });

        return selectedItem && selectedItem.id || '';
    };

    // Fetch hk status and service list
    var fetchHkStatusAndServiceList = function fetchHkStatusAndServiceList() {

        $scope.callAPI(RVHkRoomStatusSrv.fetchHkStatusList, {
            onSuccess: function onSuccess(data) {
                $scope.hkStatusList = data;
                // Do not show DND in the following cases. The DND settings is handled at the API side
                // so DND status won't be there in the list, if setting is turned off
                if (!$rootScope.isStandAlone || isHourly || !$scope.roomInfo.is_occupied) {
                    $scope.hkStatusList = _.reject($scope.hkStatusList, function (item) {
                        return item.value === 'DO_NOT_DISTURB';
                    });
                }

                $scope.returnStatusList = _.reject($scope.hkStatusList, function (item) {
                    return item.value === 'DO_NOT_DISTURB';
                });
            }
        });

        $scope.callAPI(RVHkRoomDetailsSrv.fetchAllServiceStatus, {
            onSuccess: function onSuccess(data) {
                $scope.serviceList = data;
                IN_SERVICE_ID = _.find($scope.serviceList, { value: 'IN_SERVICE' }).id;
            }
        });
    },

    // Fetch maintanence reasons list
    fetchMaintenenceReasons = function fetchMaintenenceReasons() {
        $scope.callAPI(RVHkRoomDetailsSrv.fetchMaintenanceReasons, {
            onSuccess: function onSuccess(data) {
                $scope.maintenanceReasonsList = data;
            }
        });
    },

    // Fetch room service info
    fetchRoomServiceInfo = function fetchRoomServiceInfo(year, month, instance) {
        $scope.callAPI(RVHkRoomDetailsSrv.fetchRoomStatus, {
            params: {
                room_id: $scope.roomInfo.id,
                year: year,
                month: month
            },
            onSuccess: function onSuccess(data) {
                angular.extend($scope.serviceStatus, data.service_status);

                // Set the default value only for the first time popup loads
                if (!instance) {
                    var selectedServiceData = $scope.serviceStatus[getApiFormattedDate(tzIndependentDate($rootScope.businessDate))];

                    $scope.serviceStatusDetails.room_service_status_id = selectedServiceData.id;
                    $scope.serviceStatusDetails.reason_id = selectedServiceData.maintenance_reason_id || '';
                    $scope.serviceStatusDetails.comment = selectedServiceData.comments;
                    $scope.serviceStatusDetails.return_status_id = selectedServiceData.return_status_id || '';
                }

                if (!angular.isUndefined(instance) && instance.id) {
                    $('#' + instance.id).datepicker('refresh');
                } else {
                    $('.ngmodal-uidate-wrap').datepicker('refresh');
                }
            }
        });
    },

    // Set from and to date picker options
    setDatePickerOptions = function setDatePickerOptions() {
        $scope.setClass = function (day) {
            return [true, $scope.serviceStatus[$filter('date')(tzIndependentDate(day), 'yyyy-MM-dd')] && $scope.serviceStatus[$filter('date')(tzIndependentDate(day), 'yyyy-MM-dd')].id > 1 ? 'room-out' : ''];
        };

        var datePickerCommon = {
            dateFormat: $rootScope.jqDateFormat,
            numberOfMonths: 1,
            changeYear: true,
            changeMonth: true,
            beforeShow: function beforeShow() {
                $('#ui-datepicker-div').addClass('reservation hide-arrow');
                $('<div id="ui-datepicker-overlay">').insertAfter('#ui-datepicker-div');

                setTimeout(function () {
                    $('body').find('#ui-datepicker-overlay').on('click', function () {
                        $('#room-out-from').blur();
                        $('#room-out-to').blur();
                    });
                }, 100);
            },
            onClose: function onClose() {
                $('#ui-datepicker-div').removeClass('reservation hide-arrow');
                $('#ui-datepicker-overlay').off('click').remove();
            }
        },
            adjustDates = function adjustDates() {
            if (tzIndependentDate($scope.serviceStatusDetails.from_date) > tzIndependentDate($scope.serviceStatusDetails.to_date)) {
                $scope.serviceStatusDetails.to_date = $filter('date')(tzIndependentDate($scope.serviceStatusDetails.from_date), 'yyyy-MM-dd');
            }
            $scope.untilDateOptions.minDate = $filter('date')(tzIndependentDate($scope.serviceStatusDetails.from_date), $rootScope.dateFormat);
        };

        $scope.fromDateOptions = angular.extend({
            minDate: $filter('date')($rootScope.businessDate, $rootScope.dateFormat),
            onSelect: adjustDates,
            beforeShowDay: $scope.setClass,
            onChangeMonthYear: function onChangeMonthYear(year, month, instance) {
                fetchRoomServiceInfo(year, month, instance);
            }
        }, datePickerCommon);

        $scope.untilDateOptions = angular.extend({
            minDate: $filter('date')($rootScope.businessDate, $rootScope.dateFormat),
            onSelect: adjustDates,
            beforeShowDay: $scope.setClass,
            onChangeMonthYear: function onChangeMonthYear(year, month, instance) {
                fetchRoomServiceInfo(year, month, instance);
            }
        }, datePickerCommon);
    },

    // Get date in API date format
    getApiFormattedDate = function getApiFormattedDate(date) {
        return $filter('date')(new tzIndependentDate(date), $rootScope.dateFormatForAPI);
    };

    // Checks whether the room tab is active or not
    $scope.isRoomStatusSectionActive = function () {
        return $scope.currentActiveSection === 'room';
    };

    /**
     * Update the hk status of the given room
     * @param {String} roomNo room no
     * @return {void}
     */
    $scope.updateRoomStatus = function (roomNo) {
        $scope.callAPI(RVHkRoomDetailsSrv.updateHKStatus, {
            params: {
                room_no: roomNo,
                hkstatus_id: findHkStatusIdByValue($scope.statusInfo.hkStatus)
            },
            onSuccess: function onSuccess() {
                $scope.$emit('REFRESH_DIARY_ROOMS_AND_RESERVATIONS', $scope.roomInfo.room_id);
                $scope.closeDialog();
            },
            onFailure: function onFailure(error) {
                $scope.errorMessage = error;
            }
        });
    };

    // Checks if room is in-service
    $scope.isInService = function () {
        return $scope.serviceStatusDetails.room_service_status_id === IN_SERVICE_ID;
    };

    $scope.forcefullyPutRoomToOOSorOOO = function () {
        updateStatus();
    };

    // Handler for service status change
    $scope.onServiceStatusChange = function () {
        $scope.refreshScroller(ROOM_STATUS_SERVICE_UPDATE_SCROLLER);
    };

    // Should show time selector fields
    $scope.shouldShowTimeSelector = function () {
        return ($rootScope.isHourlyRateOn || $rootScope.hotelDiaryConfig.mode === 'FULL') && !$scope.isInService();
    };

    // Should disable service update button
    $scope.shouldDisableServiceUpdateBtn = function () {
        return !$scope.hasPermissionToPutRoomOOSOrOOO;
    };

    var successCallbackOfRoomStatusChangePossible = function successCallbackOfRoomStatusChangePossible(reservationInfo) {
        var data = {
            reservations: reservationInfo.reservations
        };

        var item = _.find($scope.serviceList, function (item) {
            return item.id === OUT_OF_ORDER_ID;
        });

        $scope.ooOsTitle = item.description;

        ngDialog.open({
            template: '/assets/partials/housekeeping/popups/roomTab/rvRoomTabReservationExist.html',
            className: '',
            scope: $scope,
            data: JSON.stringify(data),
            closeByDocument: false,
            closeByEscape: false
        });
    };

    var failureCallbackOfRoomStatusChangePossible = function failureCallbackOfRoomStatusChangePossible(errorMessage) {
        $scope.errorMessage = errorMessage;
    };

    // Update room service status
    $scope.updateServiceStatus = function () {
        var reservations;

        if ($scope.diaryData.reservationsList.rooms.length) {
            reservations = _.find($scope.diaryData.reservationsList.rooms, function (item) {
                return item.id === $scope.roomInfo.id;
            });
        }
        if ($scope.serviceStatusDetails.room_service_status_id === OUT_OF_ORDER_ID && reservations) {
            var params = {
                from_date: getApiFormattedDate($scope.serviceStatusDetails.from_date),
                to_date: getApiFormattedDate($scope.serviceStatusDetails.to_date),
                room_id: $scope.roomInfo.id
            };

            var options = {
                params: params,
                successCallBack: successCallbackOfRoomStatusChangePossible,
                failureCallBack: failureCallbackOfRoomStatusChangePossible
            };

            $scope.callAPI(RVHkRoomDetailsSrv.checkWhetherRoomStatusChangePossible, options);
        } else {
            updateStatus();
        }
    };

    var updateStatus = function updateStatus() {
        var updateServiceStatusSuccessCallBack = function updateServiceStatusSuccessCallBack() {
            $scope.$emit('REFRESH_DIARY_ROOMS_AND_RESERVATIONS', $scope.roomInfo.room_id);
            $scope.closeDialog();
        },
            params = {
            from_date: getApiFormattedDate($scope.serviceStatusDetails.from_date),
            to_date: getApiFormattedDate($scope.serviceStatusDetails.to_date),
            begin_time: "",
            end_time: "",
            reason_id: $scope.serviceStatusDetails.reason_id,
            comment: $scope.serviceStatusDetails.comment,
            room_service_status_id: $scope.serviceStatusDetails.room_service_status_id,
            return_status_id: $scope.serviceStatusDetails.return_status_id
        };

        if ($scope.shouldShowTimeSelector()) {
            params.begin_time = $scope.serviceStatusDetails.begin_time;
            params.end_time = $scope.serviceStatusDetails.end_time;
        }

        params.room_id = $scope.roomInfo.id;

        $scope.invokeApi(RVHkRoomDetailsSrv.postRoomServiceStatus, params, updateServiceStatusSuccessCallBack);
    };

    // Initialize the controller
    var init = function init() {
        $scope.currentActiveSection = 'room';
        $scope.roomInfo = $scope.ngDialogData;
        $scope.serviceStatusDetails = {
            comment: '',
            reason_id: '',
            end_time: '',
            begin_time: '',
            room_service_status_id: '',
            from_date: tzIndependentDate($rootScope.businessDate),
            to_date: tzIndependentDate($rootScope.businessDate)
        };
        $scope.statusInfo = {
            hkStatus: $scope.roomInfo.hk_status,
            // service_status - N, room_service_status - H
            serviceStatus: $scope.roomInfo.service_status || $scope.roomInfo.room_service_status
        };
        $scope.todayDate = tzIndependentDate($rootScope.businessDate);

        fetchHkStatusAndServiceList();
        fetchMaintenenceReasons();
        fetchRoomServiceInfo(tzIndependentDate($rootScope.businessDate).getFullYear(), tzIndependentDate($rootScope.businessDate).getMonth());
        setDatePickerOptions();
        $scope.setScroller(ROOM_STATUS_SERVICE_UPDATE_SCROLLER);
        $scope.timeSelectorList = util.getListForTimeSelector(INTERVAL_FOR_TIME_SELECTOR, HOUR_MODE);
        $scope.serviceStatus = {};
    };

    init();
}]);