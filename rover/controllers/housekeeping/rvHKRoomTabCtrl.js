angular.module('sntRover').controller('RVHKRoomTabCtrl', [
    '$scope',
    '$rootScope',
    '$state',
    '$stateParams',
    '$filter',
    'RVHkRoomDetailsSrv',
    'ngDialog',
    'rvUtilSrv',
    '$timeout',
    'rvPermissionSrv',
    function($scope, $rootScope, $state, $stateParams, $filter, RVHkRoomDetailsSrv, ngDialog, util, $timeout, rvPermissionSrv) {

        BaseCtrl.call(this, $scope);
        var intervalForTimeSelector = 15,
            mode = 12;
        // original room status when user opened room tab
        var $_originalStatusId = $scope.roomDetails.room_reservation_hk_status;

        // in service id, copy paste from server; what if it changes in future?
        var $_inServiceId = 1;

        $scope.setClass = function(day) {
            return [true, $scope.serviceStatus[$filter('date')(tzIndependentDate(day), 'yyyy-MM-dd')]
            && $scope.serviceStatus[$filter('date')(tzIndependentDate(day), 'yyyy-MM-dd')].id > 1 ? 'room-out' : ''];
        };
        var $_fetchSavedStausCallback = function (data) {
            $scope.showSaved = true;
            $scope.$emit('hideLoader');
            $scope.refreshScroller('room-tab-scroll');
            angular.extend($scope.serviceStatus, data.service_status);
            $scope.onViewDateChanged($scope.serviceStatus);
        };


        var fetchAllServiceStatus = function() {
            /**
             * allServiceStatus success callback
             * @param {Object} data holds data object
             * @returns {void}
             */
            function $_allServiceStatusCallback(data) {
                // fetch callback of saved oo/os details
                $scope.allServiceStatus = data;
                $scope.invokeApi(RVHkRoomDetailsSrv.getRoomServiceStatus, {
                    room_id: $scope.roomDetails.id,
                    from_date: $scope.updateService.selected_date
                }, $_fetchSavedStausCallback);
                $scope.refreshScroller('room-tab-scroll');
                $scope.$emit('hideLoader');
            }
            $scope.invokeApi(RVHkRoomDetailsSrv.fetchAllServiceStatus, {}, $_allServiceStatusCallback);
        };

        var fetchMaintenanceReasons = function() {

            /**
             * fetch callback of maintenance reasons
             * @param {Object} data The first number.
             * @returns {void}
             */
            function $_maintenanceReasonsCallback(data) {
                $scope.$emit('hideLoader');
                $scope.maintenanceReasonsList = data;
                $scope.refreshScroller('room-tab-scroll');
            }
            $scope.invokeApi(RVHkRoomDetailsSrv.fetchMaintenanceReasons, {}, $_maintenanceReasonsCallback);
        };

        $scope.$watch('updateService.room_service_status_id', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                $scope.prev_room_service_status_id = oldValue;
            }
        });


        // when user changes the room status from top dropdown
        $scope.statusChange = function() {
            // CICO-48261
            $scope.updateService.selected_date = $filter('date')(tzIndependentDate($scope.updateService.selected_date), 'yyyy-MM-dd');
            var item = _.find($scope.allServiceStatus, function(item) {
                return item.id === $scope.updateService.room_service_status_id;
            });

            $scope.ooOsTitle = item.description;
            // check if user just set it to in service
            $scope.inService = $scope.updateService.room_service_status_id === $_inServiceId;
            $scope.showInseviceOnLoad = false;
            // show update form only when the user chooses a status that is not update yet
            // eg: if original status was OO them show form only when user choose OS

            if ($_originalStatusId !== $scope.updateService.room_service_status_id) {
                var bussinesDate = tzIndependentDate($rootScope.businessDate).toDateString(),
                    selectedDate = tzIndependentDate($scope.updateService.selected_date).toDateString();

                if (bussinesDate === selectedDate) {
                    $scope.roomDetails.room_reservation_hk_status = $scope.updateService.room_service_status_id;
                }
                $scope.showSaved = false;

                // reset dates and reason and comment
                $scope.updateStatus = {
                    from_date: $filter('date')(tzIndependentDate($rootScope.businessDate), 'yyyy-MM-dd'),
                    to_date: $filter('date')(tzIndependentDate($rootScope.businessDate), 'yyyy-MM-dd'),
                    reason_id: '',
                    comment: '',
                    return_status_id: ''
                };
            } else {
                $scope.invokeApi(RVHkRoomDetailsSrv.getRoomServiceStatus, {
                    room_id: $scope.roomDetails.id,
                    from_date: $scope.updateService.selected_date,
                    to_date: $scope.updateService.selected_date
                }, $_fetchSavedStausCallback);
            }
            if (!$scope.$$phase) {
                $scope.$apply();
            }
            $scope.refreshScroller('room-tab-scroll');
        };


        /* ***** ***** ***** ***** ***** */

        $scope.closeDialog = function() {
            ngDialog.close();
        };

        var datePickerCommon = {
            dateFormat: $rootScope.jqDateFormat,
            numberOfMonths: 1,
            changeYear: true,
            changeMonth: true,
            beforeShow: function(input, inst) {
                $('#ui-datepicker-div').addClass('reservation hide-arrow');
                $('<div id="ui-datepicker-overlay">').insertAfter('#ui-datepicker-div');

                setTimeout(function() {
                    $('body').find('#ui-datepicker-overlay')
                        .on('click', function() {
                            $('#room-out-from').blur();
                            $('#room-out-to').blur();
                        });
                }, 100);
            },
            onClose: function(value) {
                $('#ui-datepicker-div').removeClass('reservation hide-arrow');
                $('#ui-datepicker-overlay').off('click').remove();
            }
        };

        var adjustDates = function() {
            if (tzIndependentDate($scope.updateService.from_date) > tzIndependentDate($scope.updateService.to_date)) {
                $scope.updateService.to_date = $filter('date')(tzIndependentDate($scope.updateService.from_date), 'yyyy-MM-dd');
            }
            $scope.untilDateOptions.minDate = $filter('date')(tzIndependentDate($scope.updateService.from_date), $rootScope.dateFormat);
        };

        $scope.fromDateOptions = angular.extend({
            minDate: $filter('date')($rootScope.businessDate, $rootScope.dateFormat),
            onSelect: adjustDates,
            beforeShowDay: $scope.setClass,
            onChangeMonthYear: function(year, month, instance) {
                $scope.updateCalendar(year, month, instance);
            }
        }, datePickerCommon);

        $scope.untilDateOptions = angular.extend({
            minDate: $filter('date')($rootScope.businessDate, $rootScope.dateFormat),
            onSelect: adjustDates,
            beforeShowDay: $scope.setClass,
            onChangeMonthYear: function(year, month, instance) {
                $scope.updateCalendar(year, month, instance);
            }
        }, datePickerCommon);

        $scope.selectDateOptions = angular.extend({
            minDate: $filter('date')($rootScope.businessDate, $rootScope.dateFormat),
            onSelect: function(dateText, inst) {
                if ($scope.serviceStatus[$filter('date')(new Date(dateText), 'yyyy-MM-dd')]) {
                    $scope.updateService.room_service_status_id = $scope.serviceStatus[$filter('date')(new Date(dateText), 'yyyy-MM-dd')].id;
                }
                fetchAllServiceStatus();
                $timeout(function() {
                    $('.room-actions').click(); }, 300);

            },
            beforeShowDay: $scope.setClass,
            onChangeMonthYear: function(year, month, instance) {
                $scope.updateCalendar(year, month, instance);
            }
        }, datePickerCommon);

        /**
         * @returns {Boolean} true if hourly rate is on
         */
        $scope.shouldShowTimeSelector = function() {
            // as per CICO-11840 we will show this for hourly hotels only
            return ($rootScope.isHourlyRateOn || $rootScope.hotelDiaryConfig.mode === 'FULL') && !$scope.inService;
        };
        /*
         * @param  {Date}
         * @return {String}
         */
        var getApiFormattedDate = function(date) {
            return $filter('date')(new tzIndependentDate(date), $rootScope.dateFormatForAPI);
        };

        /*
         * CICO-11840
         * when there is a third party api is in progress with reservation booking
         * we need to show this popup
         * @return undefined
         */
        var showWebInProgressPopup = function() {
            ngDialog.open({
                template: '/assets/partials/housekeeping/popups/roomTab/rvRoomTabWebInProgressPopup.html',
                className: '',
                scope: $scope,
                closeByDocument: false,
                closeByEscape: false
            });
        };

        /*
         * CICO-11840
         * when there is some reservation attached to room & user tries to put into OOS/OOO
         * we need to show this popup
         * @return undefined
         */
        var showAlreadyAssignedToReservationsPopup = function(reservationList) {
            var data = {
                reservations: reservationList
            };

            $scope.setScroller('reservation-list-scroller', {
                tap: true,
                preventDefault: false
            });
            
            ngDialog.open({
                template: '/assets/partials/housekeeping/popups/roomTab/rvRoomTabReservationExist.html',
                className: '',
                scope: $scope,
                data: JSON.stringify(data),
                closeByDocument: false,
                closeByEscape: false
            });
        };

        /**
         * success callback
         * @param {Object} data holds data object
         * @returns {void}
         */
        var successCallbackOfRoomStatusChangePossible = function(data) {
            var isWebInProgress = data.is_locked_room,
                alreadyAssignedToReservations = data.is_room_already_assigned;

            if (isWebInProgress) {
                showWebInProgressPopup ();
            }
            else if (alreadyAssignedToReservations) {
                showAlreadyAssignedToReservationsPopup (data.reservations);
            }
            else {
                $scope.update ();
            }

        };

        /**
         * error callback
         * @param {Object} errorMessage holds error object
         * @returns {void}
         */
        var failureCallbackOfRoomStatusChangePossible = function(errorMessage) {
            $scope.errorMessage = errorMessage;
        };

        /**
         * CICO-11840
         * check whether the room status change possible
         * when it is locked via web api interface or it is already assigned
         * @returns {void}
         */
        $scope.checkWhetherRoomStatusChangePossible = function() {
            
            // for hourly hotels as of now
            var params = {
                from_date: getApiFormattedDate($scope.updateService.from_date),
                to_date: getApiFormattedDate($scope.updateService.to_date),
                room_id: $scope.roomDetails.id
            };

            if ($rootScope.isHourlyRateOn || $rootScope.hotelDiaryConfig.mode === 'FULL') {
                params.begin_time = $scope.updateService.begin_time;
                params.end_time = $scope.updateService.end_time;
            }

            var options = {
                params: params,
                successCallBack: successCallbackOfRoomStatusChangePossible,
                failureCallBack: failureCallbackOfRoomStatusChangePossible
            };

            $scope.callAPI(RVHkRoomDetailsSrv.checkWhetherRoomStatusChangePossible, options);
        };

        /* ***** ***** ***** ***** ***** */

        /**
         * when the user chooses for force fully put room oos/ooo from popup
         * @return {[type]} [description]
         */
        $scope.forcefullyPutRoomToOOSorOOO = function() {
            $scope.closeDialog ();
            $timeout(function() {
                $scope.update();
            }, 700);
        };

        $scope.update = function() {
            var _error = function(errorMessage) {
                $scope.$emit('hideLoader');
                $scope.errorMessage = errorMessage;
                $scope.updateService.room_service_status_id = $scope.prev_room_service_status_id;
                $scope.statusChange();
                if ($scope.$parent.myScroll['room-tab-scroll'] && $scope.$parent.myScroll['room-tab-scroll'].scrollTo) {
                    $scope.$parent.myScroll['room-tab-scroll'].scrollTo(0, 0);
                }
                $scope.refreshScroller('room-tab-scroll');
            };

            var _callback = function() {
                $scope.$emit('hideLoader');
                $scope.errorMessage = '';
                // change the original status and update the 'room_reservation_hk_status' in parent
                $_originalStatusId = $scope.updateService.room_service_status_id;
                $scope.showSaved = true;
                // reset dates and reason and comment
                $scope.updateStatus = {
                    room_id: $scope.roomDetails.id,
                    from_date: $filter('date')(tzIndependentDate($rootScope.businessDate), 'yyyy-MM-dd'),
                    to_date: $filter('date')(tzIndependentDate($rootScope.businessDate), 'yyyy-MM-dd')
                };
                $scope.updateCalendar();

                $scope.$emit('REFRESH_ROOM_STATUS');
            };

            // update the dates to backend system format
            $scope.updateService.from_date = $filter('date')(tzIndependentDate($scope.updateService.from_date), 'yyyy-MM-dd');
            $scope.updateService.to_date = $filter('date')(tzIndependentDate($scope.updateService.to_date), 'yyyy-MM-dd');
            $scope.showInseviceOnLoad = false;
            // POST or PUT (read service to understand better)
            if ($_originalStatusId === $_inServiceId || !$scope.inService) {
                $scope.invokeApi(RVHkRoomDetailsSrv.postRoomServiceStatus, $scope.updateService, _callback, _error);
            } else {
                $scope.invokeApi(RVHkRoomDetailsSrv.putRoomServiceStatus, $scope.updateService, _callback, _error);
            }
        };

        $scope.edit = function() {
            if ($scope.showSaved) {
                $scope.showSaved = false;
            } else {
                if ($scope.updateService.room_service_status_id !== 1) {
                  $scope.checkWhetherRoomStatusChangePossible();  
                } else {
                    $scope.update();
                }
                
            }
        };

        $scope.generateButtonName = function() {
            return $scope.showSaved ? 'Edit' : 'Update';
        };

        $scope.updateCalendar = function(year, month, instance) {
            /**
             * success callback
             * @param {Object} data holds data object
             * @returns {void}
             */
            function onFetchSuccess(data) {
                angular.extend($scope.serviceStatus, data.service_status);

                var isNotInService 		= $scope.updateService.room_service_status_id > 1,
                    selectedServiceData = $scope.serviceStatus[getApiFormattedDate($scope.updateService.selected_date)],
                    hourlyEnabledHotel 	= $rootScope.isHourlyRateOn;

                // CICO-11840
                if (isNotInService && hourlyEnabledHotel) {
                    $scope.updateService.begin_time 	= selectedServiceData.from_time;
                    $scope.updateService.end_time 		= selectedServiceData.to_time;
                }

                // CICO-38455 - Added the fix to refresh the specific datepicker after API call
                if (!angular.isUndefined(instance) && instance.id) {
                    $('#' + instance.id).datepicker('refresh');
                } else {
                    $('.ngmodal-uidate-wrap').datepicker('refresh');

                }
                $scope.$emit('hideLoader');
            }
            /**
             * error callback
             * @param {Object} errorMessage holds error object
             * @returns {void}
             */
            function onFetchFailure() {
                $scope.$emit('hideLoader');
            }

            $scope.invokeApi(RVHkRoomDetailsSrv.fetchRoomStatus, {
                year: year || tzIndependentDate($scope.updateService.selected_date).getFullYear(),
                month: month || tzIndependentDate($scope.updateService.selected_date).getMonth(),
                room_id: $scope.roomDetails.id
            }, onFetchSuccess, onFetchFailure);
        };

        $scope.$watch('updateService.selected_date', function() {
            $scope.refreshScroller('room-tab-scroll');
        });
        var updateDateRangeForOOO = function(dateHash) {
            /**
             * https://stayntouch.atlassian.net/browse/CICO-12520?focusedCommentId=39411&page=com.atlassian.jira.plugin.system.issue
             * tabpanels:comment-tabpanel#comment-39411
             *When putting the room OOO or OOS for a date range, say 12 - 15 and going back to edit, each day shows separately,
             *i.e. 12-12, 13 - 13, 14-14, 15 - 15. It should be possible to show the same date range for each selected date?
             * TODO : If the neigbouring dates have the same status id reason and comment put them in the date range
             */
            var oneDay = 86400000; // number of milliseconds in a day

            while (dateHash[$filter('date')(tzIndependentDate($scope.updateService.from_date).getTime() - oneDay, 'yyyy-MM-dd')]) {
                var prevDate = $filter('date')(tzIndependentDate($scope.updateService.from_date).getTime() - oneDay, 'yyyy-MM-dd');
                var prevDateStatus = dateHash[prevDate];

                if (prevDateStatus.id === $scope.updateService.room_service_status_id &&
                    prevDateStatus.reason_id === $scope.updateService.reason_id &&
                    prevDateStatus.comments === $scope.updateService.comment) {
                    $scope.updateService.from_date = prevDate;
                } else {
                    break;
                }
            }

            while (dateHash[$filter('date')(tzIndependentDate($scope.updateService.to_date).getTime() + oneDay, 'yyyy-MM-dd')]) {
                var nextDate = $filter('date')(tzIndependentDate($scope.updateService.to_date).getTime() + oneDay, 'yyyy-MM-dd');
                var nextDateStatus = dateHash[nextDate];

                if (nextDateStatus.id === $scope.updateService.room_service_status_id &&
                    nextDateStatus.reason_id === $scope.updateService.reason_id &&
                    nextDateStatus.comments === $scope.updateService.comment) {
                    $scope.updateService.to_date = nextDate;
                } else {
                    break;
                }
            }
        };

        $scope.onViewDateChanged = function(dateHash) {
            $scope.updateService.selected_date = $filter('date')(tzIndependentDate($scope.updateService.selected_date), 'yyyy-MM-dd');
            $scope.updateService.room_service_status_id = dateHash[$scope.updateService.selected_date].id;
            // The $_originalStatusId flag is used to make sure that the same change is not sent back to the server -- to many flags whew...
            $_originalStatusId = $scope.updateService.room_service_status_id;

            $scope.updateService.from_date = $scope.updateService.selected_date;
            $scope.updateService.to_date = $scope.updateService.selected_date;
            $scope.inService = $scope.updateService.room_service_status_id === $_inServiceId;
            var item = _.find($scope.allServiceStatus, function(item) {
                return item.id === $scope.updateService.room_service_status_id;
            });

            $scope.ooOsTitle = item.description;

            $scope.updateService.reason_id = dateHash[$scope.updateService.selected_date].maintenance_reason_id;
            $scope.updateService.comment = dateHash[$scope.updateService.selected_date].comments;
            $scope.updateService.return_status_id = dateHash[$scope.updateService.selected_date].return_status_id;

            if ($scope.updateService.room_service_status_id !== $_inServiceId) {
                updateDateRangeForOOO(dateHash);
            }

        };

        var init = function() {
            // scroll
            $scope.setScroller('room-tab-scroll');
            // keep ref to room details in local scope
            $scope.roomDetails = $scope.$parent.roomDetails;
            $scope.showInseviceOnLoad = true;
            // by default lets assume room is in service
            $scope.inService = true;
            // by default dont show the details (disabled) form
            $scope.showSaved = false;
            // list of all posible service statuses
            $scope.allServiceStatus = [];
            // list of all possible maintainace reasons
            $scope.maintenanceReasonsList = [];
            // list of all possible return status except DND
            $scope.returnStatusList = _.reject($scope.roomDetails.hk_status_list, function (status) {
                return status.value === 'DO_NOT_DISTURB';
            });
            // param: update the new oo/os status
            // $scope.updateService.room_service_status_id serves as the model for the top dropdown
            $scope.hasPermissionPutRoomOOS = rvPermissionSrv.getPermissionValue('PUT_ROOM_OOO_OR_OOS');
            $scope.updateService = {
                room_id: $scope.roomDetails.id,
                from_date: $filter('date')(tzIndependentDate($rootScope.businessDate), 'yyyy-MM-dd'),
                to_date: $filter('date')(tzIndependentDate($rootScope.businessDate), 'yyyy-MM-dd'),
                selected_date: $filter('date')(tzIndependentDate($rootScope.businessDate), 'yyyy-MM-dd'),
                room_service_status_id: $_originalStatusId,
                begin_time: '',
                end_time: ''
            };
            // CICO-12520
            /**
             * This object would contain the service status of the room in the view
             * @type {Object}
             */
            $scope.serviceStatus = {};
            $scope.timeSelectorList = util.getListForTimeSelector (intervalForTimeSelector, mode);
            // for fixing the issue of 24 hour long OOO thing
            $scope.timeSelectorList.push ({
                text: '11:59 PM',
                value: '23:59'
            });

            fetchAllServiceStatus();
            fetchMaintenanceReasons();
        };

        init();

        $scope.$on('reloadPage', function (event, data) {
            $scope.roomDetails = data;
        });

    }
]);
