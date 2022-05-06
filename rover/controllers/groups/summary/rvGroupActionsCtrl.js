sntRover.controller('rvGroupActionsCtrl', ['$scope', '$filter', '$rootScope', 'ngDialog', 'rvGroupActionsSrv', 'rvUtilSrv', 'dateFilter', 'rvPermissionSrv', 'rvActionTasksSrv',
    function($scope, $filter, $rootScope, ngDialog, rvGroupActionsSrv, rvUtilSrv, dateFilter, rvPermissionSrv, rvActionTasksSrv) {

        /*
         *To save the reservation note and update the ui accordingly
         */
        $scope.errorMessage = '';
        $scope.actionsCount = 'none';// none, pending, all-completed
        $scope.actions = {};
        $scope.newAction = {};
        $scope.actions.totalCount = 0;
        $scope.actions.arrivalDateString = '';
        $scope.actions.departureDateString = '';

        $scope.selectedAction = {};
        $scope.selectedAction.created_by_null = false;
        $scope.selectedAction.created_at;
        $scope.selectedAction.created_at_time;
        $scope.selectedAction.created_by;
        $scope.selectedAction.description;
        $scope.selectedAction.department;
        $scope.selectedAction.id;
        $scope.selectedAction.assigned;
        $scope.selectedAction.due_at_date;
        $scope.selectedAction.due_at_time;
        $scope.openingPopup = false;
        $scope.refreshing = false;
        $scope.refreshToEmpty = false;

        $scope.newAction.department = {'value': ''};

        $scope.hotel_time = "4:00 A.M";
        $scope.departmentSelect = {};
        $scope.departmentSelect.selected;

        $scope.timeSelectorList = rvUtilSrv.getListForTimeSelector (15, 12);

        $scope.selectedActionMessage = '';
        $scope.selectedDepartment = '';
        $scope.actionsSyncing = false;

        $scope.groupId = '';
        $scope.isStandAlone = true;

        $scope.editingDescriptionInline = false;

        var init = function() {
            if ($rootScope.isStandAlone) {
                $scope.isStandAlone = true;
            } else {
                $scope.isStandAlone = false;
            }

            if ($scope.groupConfigData.summary.group_id) {
                $scope.groupId = $scope.groupConfigData.summary.group_id;
            }
            $scope.populateTimeFieldValue();
            $scope.setScroller("rvActionListScroller", {
                click: true,
                preventDefault: false
            });

            $scope.setUpData();

            $scope.fetchDepartments();
            fetchActionListSuccessCallBack($scope.ngDialogData);
        };

        $scope.lastSavedDescription = '';
        $scope.updateActionDescription = function(description_old, description_new) {
            var params = {
                'group_id': $scope.groupConfigData.summary.group_id,
                'action_task': {
                    'id': $scope.selectedAction.id
                }
            };

            params.action_task.description = description_new;

            var onSuccess = function(response) {
                $scope.lastSavedDescription = response.data.description;
                $scope.savingDescription = false;
                $scope.$emit('hideLoader');
            };
            var onFailure = function(response) {
                $scope.savingDescription = false;
                $scope.$emit('hideLoader');
            };

            if ($scope.savingDescription) {
                if ($scope.lastSavedDescription !== description_new) {
                    if (description_new && description_new !== '') {
                        $scope.invokeApi(rvGroupActionsSrv.updateNewAction, params, onSuccess, onFailure);
                    } else {
                        $scope.selectedAction.description = $scope.lastSavedDescription;
                        $scope.editingDescriptionValue = $scope.lastSavedDescription;
                    }
                }
            }
        };
        $scope.savingDescription = false;


        $scope.stopEditClick = function(ent) {
            if (!$scope.starting || ent) {// ent = enter on keyboard hit, user was in txt input and hits enter, forcing a save request
                setTimeout(function() {
                    $scope.editingDescriptionInline = false;

                    if (!$scope.isStandAlone) {
                        if ($scope.lastSavedDescription !== $scope.selectedAction.description) {
                            // /push up
                            if (!$scope.savingDescription) {
                                $scope.savingDescription = true;
                                $scope.updateActionDescription($scope.editingDescriptionValue, $scope.selectedAction.description);
                            }
                        }
                    }
                }, 250);
            } else {
                $scope.startEditDescription();
            }

        };

        $scope.starting = false;
        $scope.startEditDescription = function() {
            $scope.starting = true;
            if (!$scope.isStandAlone) {
                if ($scope.isTrace($scope.selectedAction.action_task_type)) {// only overlay traces for now (sprint 37) CICO-17112
                    $scope.editingDescriptionInline = true;
                }
                $scope.starting = false;
                $scope.editingDescriptionValue = $scope.selectedAction.description;
            } else {
                $scope.starting = false;
                $scope.editingDescriptionInline = false;
            }
        };

        $scope.actionsSyncd = false;
        $scope.syncActions = function(id) {
            /*
             * method to sync action count for the staycard
             * this reaches out to
             */
            var onSuccess = function(data) {
                $scope.actions.totalCount = data.total_count;
                $scope.actions.pendingCount = data.pending_count;
                $scope.actionsSyncd = true;
                $scope.$emit('hideLoader');
            };
            var onFailure = function(response) {

                $scope.actionsSyncd = true;
            };

            $scope.invokeApi(rvGroupActionsSrv.syncActionCount, id, onSuccess, onFailure);
        };

        $scope.setInitialActionsCount = function(data) {
            if (data) {
                $scope.actions.totalCount = data.action_count;
                $scope.actions.pendingCount = data.pending_action_count;
                var pending = $scope.actions.pendingCount, total = $scope.actions.totalCount;

                if (total === 0) {
                    $scope.actionsCount = 'none';// none, pending, all-completed
                } else if (total > 0 && pending === 0) {
                    $scope.actionsCount = 'all-completed';
                } else if (total > 0 && total === pending) {
                    $scope.actionsCount = 'only-pending';
                } else {
                    $scope.actionsCount = 'pending';
                }
            }
        };

        var refreshScroller = function() {
            $scope.refreshScroller('rvActionListScroller');
        };


        $scope.hasArrivalDate = false;
        $scope.hasDepartureDate = false;

        $scope.getArDeDateStr = function(dateStr, timeStr) {
            if (!dateStr) {
                dateStr = ' ';
            }
            if (!timeStr) {
                timeStr = ' ';
            }
            var aDay = $scope.getDateFromDate(dateStr), aDayString = ' ';

            if (aDay) {
                aDay = aDay.toLowerCase();
                aDayString = aDay.substring(0, 1).toUpperCase() + aDay.substring(1, 3) + ' ';
            }
            // make sure timestring include '0' if < 10, ie. 09, 08, etc instead of 9, 8...
            if (timeStr !== ' ') {
                var timeSpl = timeStr.split(':');
                var hour = timeSpl[0];
                var hourInt = parseInt(hour);

                if (hour < 10) {
                    timeStr = '0' + hourInt + ':' + timeSpl[1];
                }
            }
            if (dateStr) {
                return aDayString +
                    $filter('date')(new tzIndependentDate(dateStr), $rootScope.dateFormat) +
                    '  ' +
                    timeStr;
            } else {
                return timeStr;
            }
        };

        $scope.setActionsHeaderInfo = function() {
            var arDate = $scope.groupConfigData.summary.block_from,
                deDate = $scope.groupConfigData.summary.block_to;

            var arrivalDayString = $scope.getArDeDateStr(arDate);

            if (!arrivalDayString) {
                $scope.hasArrivalDate = false;
            } else {
                $scope.hasArrivalDate = true;
            }

            var departureDayString = $scope.getArDeDateStr(deDate);

            if (!departureDayString) {
                $scope.hasDepartureDate = false;
            } else {
                $scope.hasDepartureDate = true;
            }
            $scope.actions.arrivalDateString = arrivalDayString;
            $scope.actions.departureDateString = departureDayString;
        };


        $scope.getActionsCountStatus = function(data) {
            $scope.actions.pendingCount = data.pending_group_action_tasks_count;
            var pending = $scope.actions.pendingCount, total = $scope.actions.totalCount;

            if (total === 0 && pending === 0) {
                $scope.actionsCount = 'none';// none, pending, all-completed
            } else if (total > 0 && pending === 0) {
                $scope.actionsCount = 'all-completed';
            } else if (total > 0 && total === pending) {
                $scope.actionsCount = 'only-pending';
            } else {
                $scope.actionsCount = 'pending';
            }
            return $scope.actionsCount;
        };
        $scope.fetchActionsCount = function() {
            var onSuccess = function(data) {
                if (!$scope.isRefreshing) {
                    $scope.refreshing = false;
                } else {
                    setTimeout(function() {
                        $scope.refreshing = false;
                        $scope.$emit('hideLoader');
                        $scope.$apply();
                    }, 500);
                }

                $scope.$emit('hideLoader');
                if (!data || data.total_group_action_tasks_count === 0) {
                    $scope.setRightPane('none');
                }
                $scope.actions.totalCount = data.total_group_action_tasks_count;
                if (!data) {
                    $scope.actions.totalCount = 0;
                }

                $scope.actionsCount = $scope.getActionsCountStatus(data);
                if ($scope.recountAfterDelete) {
                    if ($scope.actions.totalCount === 1 && $scope.actions[0].is_deleted) {
                        $scope.actions.totalCount = 0;
                        $scope.actionSelected === "none";
                        $scope.setRightPane('none');
                    }
                    $scope.recountAfterDelete = false;
                }
            };
            var onFailure = function(data) {
                $scope.$emit('hideLoader');
                $scope.refreshing = false;
            };

            if ($scope.isRefreshing) {
                $scope.refreshing = true;
            }

            var data = {id: $scope.groupConfigData.summary.group_id};

            $scope.invokeApi(rvGroupActionsSrv.getTasksCount, data, onSuccess, onFailure);
        };
        $scope.departments = [];
        $scope.fetchDepartments = function() {
            var onSuccess = function(data) {
                $scope.$emit('hideLoader');
                $scope.departments = data.data.departments;
                $scope.departmentsCount = $scope.departments.length;
            };
            var onFailure = function(data) {
                $scope.departmentsCount = 0;
                $scope.$emit('hideLoader');
            };

            var data = {id: $scope.groupConfigData.summary.group_id};

            $scope.invokeApi(rvGroupActionsSrv.fetchDepartments, data, onSuccess, onFailure);
        };
        $scope.selectAction = function(a) {
            var action = a;

            if (action) {
                $scope.selectedAction = action;
                if (action.description) {
                    $scope.lastSavedDescription = action.description;
                }
            }

            $scope.setRightPane('selected');
            $scope.clearAssignSection();
        };
        $scope.setRightPane = function(toView) {
            // selected, new, assign, comment
            $scope.actionSelected = toView;
        };
        $scope.clearNewAction = function() {
            $scope.closeSelectedCalendar();
            $scope.closeNewCalendar();
            $scope.newAction.notes = '';
            $scope.newAction.department = {'value': ''};
            $scope.newAction.time_due = '';
            $scope.actionsSelectedDate = $rootScope.businessDate;
            $scope.newAction.hasDate = false;
            $scope.setFreshDate();

        };
        $scope.departmentSelected = false;
        $scope.$watch('newAction.department', function(now, was) {
            if (!now || now === null) {
                $scope.departmentSelected = false;
            } else if (now.value === '') {
                $scope.departmentSelected = false;
            } else {
                $scope.departmentSelected = true;
            }
        });
        $scope.clearErrorMessage = function () {
            $scope.errorMessage = [];
        };
        $scope.postAction = function() {
            $scope.selectedAction = 'selected';
            var onSuccess = function(response) {
                if (response.status === 'failure') {
                    if (response.errors && response.errors[0]) {
                        $scope.errorMessage = response.errors[0];
                    }
                }
                $scope.fetchActionsList();
                $scope.$emit("SET_ACTIONS_COUNT", "new");
                $scope.refreshScroller("rvActionListScroller");
            };
            var onFailure = function(data) {
                if (data[0]) {
                    $scope.errorMessage = data[0];
                }
                $scope.$emit('hideLoader');
            };
            // group_id=1616903&action_task[description]=test
            var params = {
                'group_id': $scope.groupConfigData.summary.group_id,
                'action_task': {
                    'description': $scope.newAction.notes
                }
            };

            if ($scope.newAction.department) {
                if ($scope.newAction.department.value) {
                    params['assigned_to'] = $scope.newAction.department.value;
                }
            }

            if ($scope.newAction.date_due) {
                var dateObj = $scope.newAction.dueDateObj;

                params['due_at'] = $filter('date')(dateObj, $rootScope.dateFormatForAPI) +
                    ($scope.newAction.time_due ? "T" + $scope.newAction.time_due + ":00" : "");

            }

            $scope.invokeApi(rvGroupActionsSrv.postNewAction, params, onSuccess, onFailure);
        };

        $scope.reformatDateOption = function(d, spl, newSpl) {
            // expecting ie. 01/09/2015 (month, day, yr)
            var spl = d.split(spl);
            var month = spl[0], day = spl[1], year = spl[2];

            return month + newSpl + day + newSpl + year;
        };


        $scope.setUpData = function() {
            var businessDate = tzIndependentDate($rootScope.businessDate);
            var nd = new Date(businessDate);
            var day = ("0" + nd.getDate()).slice(-2);
            var month = ("0" + (nd.getMonth() + 1)).slice(-2);
            var fromDateStr = nd.getFullYear() + '-' + month + '-' + day;

            $scope.fromDate = fromDateStr;
        };

        $scope.setFreshDate = function() {

            $scope.newAction.hasDate = true;
             // CICO-27905
            // In the stay card, the date due for a new action should default to the greater of the block's from date / business date
            var businessDate = new tzIndependentDate($rootScope.businessDate),
                blockFromDate = new tzIndependentDate($scope.groupConfigData.summary.block_from);

            $scope.newAction.dueDateObj = businessDate > blockFromDate ? businessDate : blockFromDate;
            
            $scope.newAction.date_due = $filter('date')( $scope.newAction.dueDateObj, $rootScope.dateFormat);
            if (!$scope.newAction.time_due) {
                $scope.newAction.time_due = $filter('date')($scope.hotel_time, "HH:mm");
                $scope.newAction.time_due = rvUtilSrv.roundToNextQuarter(parseInt($filter('date')($scope.hotel_time, "HH"), 10),
                    parseInt($filter('date')($scope.hotel_time, "mm"), 10));
            }
        };

        $scope.actionsDateOptions = {
            firstDay: 1,
            changeYear: true,
            changeMonth: true,
            dateFormat: $rootScope.jqDateFormat,
            minDate: tzIndependentDate($rootScope.businessDate),
            yearRange: "0:+10",
            onSelect: function(date, dateObj) {
                var selectedDate = new tzIndependentDate(rvUtilSrv.get_date_from_date_picker(dateObj));

                if ($scope.dateSelection !== null) {
                    if ($scope.dateSelection === 'select') {
                        $scope.selectedAction.due_at_date = $filter('date')(selectedDate, $rootScope.dateFormat);

                        $scope.selectedAction.dueDateObj = selectedDate;

                        $scope.selectedAction.hasDate = true;
                        if ($scope.usingCalendar) {
                            $scope.updateAction();
                        }
                        $scope.closeSelectedCalendar();

                    } else {
                        $scope.newAction.hasDate = true;
                        $scope.newAction.date_due = $filter('date')(selectedDate, $rootScope.dateFormat);
                        $scope.newAction.dueDateObj = selectedDate;

                        if (!$scope.newAction.time_due) {
                            $scope.newAction.time_due = $scope.timeFieldValue[0];
                        }
                        // this one has a save / post button
                        $scope.closeNewCalendar();
                    }
                }
            }
        };

        $scope.onTimeChange = function() {
            $scope.updateAction();
        };

        $scope.updateAction = function() {
            var onSuccess = function() {
                $scope.$emit('hideLoader');
                $scope.refreshActionList();
                $scope.refreshScroller("rvActionListScroller");
            };
            var onFailure = function(data) {
                if (data[0]) {
                    $scope.errorMessage = 'Internal Error Occured';
                }
                $scope.$emit('hideLoader');

            };


            var params = {
                'group_id': $scope.groupConfigData.summary.group_id,
                'action_task': {
                    'id': $scope.selectedAction.id
                }
            };

            $scope.lastSelectedItemId = $scope.selectedAction.id;
            if (typeof $scope.selectedAction.due_at_date === typeof 'string' || typeof $scope.selectedAction.due_at_date === typeof 12345) {
                var dateObj = $scope.selectedAction.dueDateObj || new tzIndependentDate($scope.selectedAction.due_at_str);

                params['due_at'] = $filter('date')(dateObj, $rootScope.dateFormatForAPI) +
                    ($scope.selectedAction.due_at_time ? "T" + $scope.selectedAction.due_at_time + ":00" : "");
                $scope.invokeApi(rvGroupActionsSrv.updateNewAction, params, onSuccess, onFailure);
            }

        };

        $scope.getBasicDateInMilli = function(d, charToSplit) {
            // expecting date string ie: 02/15/2015
            if (typeof charToSplit !== typeof 'string') {
                charToSplit = '/';
            }
            var sp = d.split(charToSplit);
            var nd = new Date();

            nd.setFullYear(sp[2]);
            nd.setMonth(sp[0] - 1);
            nd.setDate(sp[1]);

            return nd.valueOf();
        };
        $scope.showCalendar = function() {
            ngDialog.open({
                template: '/assets/partials/reservationCard/Actions/rvReservationCardActionsCalendar.html' });
        };

        $scope.usingCalendar = false;
        $scope.getDateObj = function(dateStr, delim) {
            var year, month, day;
            var spl = dateStr.split(delim);

            day = spl[1];
            month = spl[0];
            year = spl[2];

            return {day: day, month: month, year: year};
        };
        $scope.showSelectCalendar = function() {
            // to ensure same day due to utc hour, set utc hour to 0100
            // if newAction = set start date to today, otherwise set it to the selectedAction due date
            var fmObj = tzIndependentDate($scope.selectedAction.due_at_str);

            $scope.actionsSelectedDate = $filter('date')(fmObj, "yyyy-MM-dd");
            $scope.usingCalendar = true;
            $scope.dateSelection = 'select';
            $scope.selectCalendarShow = true;
        };

        $scope.closeSelectedCalendar = function() {
            $scope.usingCalendar = false;
            $scope.dateSelection = null;
            $scope.selectCalendarShow = false;
        };

        $scope.showNewCalendar = function() {
            $scope.dateSelection = 'new';
            $scope.newCalendarShow = true;
            $scope.usingCalendar = true;
        };

        $scope.closeNewCalendar = function() {
            $scope.dateSelection = null;
            $scope.newCalendarShow = false;
            $scope.usingCalendar = false;
        };


        $scope.initNewAction = function() {
            $scope.clearNewAction();
            $scope.setRightPane('new');
        };
        $scope.getDefaultDueDate = function() {
            return new Date();
        };
        $scope.cancelNewAction = function() {
            // switch back to selected view of lastSelected
            // just change the view to selected
            if ($scope.actions.totalCount > 0) {
                if ($scope.lastSelectedItemId) {
                    $scope.selectAction($scope.actions[$scope.lastSelectedItemId]);
                }
                $scope.setRightPane('selected');// goes back to last screen if actions exist
            } else {
                $scope.setRightPane('none');// goes back to All is Good if no actions
            }

            $scope.clearNewAction();            
        };
        $scope.cancelAssign = function() {
            // switch back to selected view of lastSelected
            // just change the view to selected
            $scope.setRightPane('selected');
            $scope.clearAssignSection();
        };


        var getTimeObj = function(timeVal) {
            var forTime = getTimeFromDateMilli(timeVal);

            for (var i in $scope.timeFieldValue) {
                if ($scope.timeFieldValue[i].value === forTime) {
                    return $scope.timeFieldValue[i];
                }
            }
        };

        $scope.refreshingList = function() {
            if ($scope.refreshing || $scope.refreshToEmpty) {
                $scope.$emit('showLoader');
                return true;
            } else {
                setTimeout(function() {
                    $scope.$emit('hideLoader');
                }, 1200);
                return false;

            }
        };
        $scope.refreshingToNonEmpty = function() {
            if ($scope.refreshing && !$scope.refreshToEmpty) {
                return true;
            } else {
                return false;
            }

        };
        $scope.showActionsList = function() {
            if (($scope.actions.totalCount > 0 || $scope.refreshing) && !$scope.refreshToEmpty) {
                return true;
            } else return false;
        };
        $scope.showErrMsg = function() {
            if ($scope.errorMessage != '') {
                return true;
            } else return false;
        };
        $scope.isOverlayRequest = function(action) {
            if (!$scope.isStandAlone && $scope.isRequest(action.action_task_type)) {
                return true;
            } else return false;
        };
        $scope.isStandAloneAction = function(action) {
            if (action && !$scope.isTrace(action.action_task_type) &&
                !$scope.isRequest(action.action_task_type) &&
                !$scope.isAlert(action.action_task_type)) {
                return true;
            } else return false;
        };
        $scope.showActionSummary = function() {
            if ($scope.actionSelected === 'selected' || ($scope.actionSelected === 'selected' && $scope.refreshing)) {
                return true;
            } else return false;
        };
        $scope.showNewAction = function() {
            if ($scope.actionSelected === 'new' || $scope.refreshing) {
                return true;
            } else return false;
        };
        $scope.showNewActionOnly = function() {
            if ($scope.actions.totalCount === 0 && $scope.actionSelected === "new" && !$scope.refreshToEmpty) {
                return true;
            } else return false;
        };
        $scope.showEmptyActions = function() {
            if (($scope.actions.totalCount === 0 && $scope.actionSelected === "none") || $scope.refreshToEmpty) {
                return true;
            } else return false;
        };
        $scope.postActionEnabled = function() {
            if (!$scope.newAction.hasDate || !$scope.newAction.notes || (!$scope.departmentSelected && !$scope.isStandAlone)) {
                return true;
            } else return false;
        };
        $scope.showAssignScreen = function() {
            if ($scope.actionSelected === 'assign' || ($scope.actionSelected === 'assign' && $scope.refreshing))  {
                return true;
            } else return false;
        };
        $scope.lastSelectedItemId = '';
        $scope.refreshActionList = function(del, selected) {
            $scope.fetchDepartments();// store this to use in assignments of department
            var onSuccess = function(data) {
                var splitTimeString = data.business_date_time.split("T");

                $scope.hotel_time = splitTimeString[0] + "T" +  splitTimeString[1].split(/[+-]/)[0];

                var list = data.data;
                // if doing a refresh, dont replace the actions array, since it will cause the UI to flash
                // and look like a bug, instead go through the objects and update them

                var matchObj;

                for (var x in list) {
                    if (list[x].assigned_to !== null) {
                        list[x].assigned = true;
                    } else {
                        list[x].assigned = false;
                    }

                    list[x].due_at_time = list[x].time_due ? $filter('date')(list[x].due_at_str, "HH:mm") : "00:00";

                    if (typeof list[x].due_at === typeof 'string') {
                        var splitDueTimeString = list[x].due_at_str.split("T");
                        // 24 hr format for the dropdown in the right panel

                        list[x].due_at_time = dateFilter(splitDueTimeString[0] + "T" +  splitDueTimeString[1].split(/[+-]/)[0], "HH:mm");
                        // 12 hr format for binding in the list
                        list[x].due_at_time_str = dateFilter(splitDueTimeString[0] + "T" +  splitDueTimeString[1].split(/[+-]/)[0], "hh:mm a");

                        list[x].due_at_date = dateFilter(splitDueTimeString[0], $rootScope.dateFormat);
                        // list[x].due_at_date = $filter('date')(list[x].due_at_str, $rootScope.dateFormat);

                        list[x].hasDate = true;
                    } else {
                        list[x].hasDate = false;
                    }

                    if (list[x].created_at) {
                        list[x].created_at_time = getTimeFromDateStr(list[x].created_at, 'created_at_time');
                        list[x].created_at_date = getStrParsedFormattedDate(list[x].created_at);
                    }
                    if (list[x].action_status === "COMPLETED") {
                        list[x].isCompleted = true;
                        list[x].date_completed = getFormattedDate(list[x].completed_at);
                        list[x].time_completed = getCompletedTimeFromDateMilli(list[x].completed_at);
                    }

                }


                var inActions = false;
                var listItem, actionItem;

                if (list.length >= $scope.actions.length) {
                    for (var x in list) {
                        listItem = list[x];

                        inActions = false;
                        for (var i in $scope.actions) {
                            actionItem = $scope.actions[i];
                            if (actionItem.id === listItem.id) {
                                if ($scope.isStandAlone) {
                                    $scope.actions[i] = listItem;
                                    inActions = true;
                                } else if (!$scope.isStandAlone) {
                                    if (del === 'delete' && selected) {// flag to delete an item (overlay)
                                        if (selected.id === listItem.id) {
                                            inActions = true;// skips
                                        }
                                    } else {
                                        $scope.actions[i] = listItem;
                                        inActions = true;
                                    }
                                }
                            }
                        }
                        if (!inActions) {
                            $scope.actions.push(listItem);
                        }
                    }
                }

                // hide the element that was deleted; and refresh the scroller,
                // this also sets focus to the first item in the list
                for (var xi in $scope.actions) {
                    if (selected && $scope.actions[xi].id === selected.id) {
                        $scope.actions[xi].is_deleted = true;
                        refreshScroller();
                    }
                }


                $scope.fetchActionsCount();
                $scope.setActionsHeaderInfo();
                var isStandAlone = $scope.isStandAlone;

                if ($scope.lastSelectedItemId) {
                    for (var a in $scope.actions) {
                        if (isStandAlone) {
                            if ($scope.lastSelectedItemId === $scope.actions[a].id) {
                                $scope.selectAction($scope.actions[a]);
                            }
                        } else if (!$scope.isStandAlone) {
                            // overlay has some alerts which can get deleted; these are just hidden from view until the next full refresh / api call is done
                            // since the action object still exists, upon deleting an action, select the next (visible) action starting at the index (0)
                            if ($scope.lastSelectedItemId === $scope.actions[a].id && !del) {
                                $scope.selectAction($scope.actions[a]);
                            } else {
                                if (!$scope.actions[0].is_deleted) {
                                    $scope.selectAction($scope.actions[0]);
                                } else {
                                    if (!$scope.actions[a].is_deleted) {
                                        $scope.selectAction($scope.actions[a]);
                                    } else {
                                        for (var i in $scope.actions) {// select next non-deleted action
                                            if (!$scope.actions[i].is_deleted) {
                                                $scope.selectAction($scope.actions[i]);
                                                $scope.$emit('hideLoader');
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                } else {
                    $scope.setDefaultActionSelected(0);
                }
                if ($scope.refreshToEmpty) {
                    $scope.refreshToEmpty = false;
                }
                if ($scope.refreshing) {
                    $scope.refreshing = false;
                }
                // $scope.$emit('hideLoader');
            };
            var onFailure = function(data) {
                $scope.$emit('hideLoader');
                $scope.refreshToEmpty = false;
                $scope.refreshing = false;
            };

            var data = {id: $scope.groupConfigData.summary.group_id};

            $scope.invokeApi(rvGroupActionsSrv.getActionsTasksList, data, onSuccess, onFailure);

        };

        $scope.hasActionStatus = function() {
            if (!$scope.actions) {
                return false;
            } else if ($scope.actionSelected === "none" || $scope.actionSelected === "new") {
                return true;
            } else if ((!(($scope.actions.totalCount > 0 || $scope.refreshing) && !$scope.refreshToEmpty) &&
                !(($scope.actions.totalCount === 0 && $scope.actionSelected === "none") || $scope.refreshToEmpty))) {
                return false;
            } else return true;
        };
        $scope.isDeletePending = function(id, a) {
            for (var i in a) {
                if (a[i] === id) {
                    return true;
                }
            }

            return false;
        };

        $scope.capped = function(str) {
            if (str) {
                var s = str.toLowerCase();

                s[0].toUpperCase();
            }
            return s;
        };

        $scope.eitherString = function(str, val) {
            if (val) {
                if (str === val) {
                    return true;
                } else if (str === val.toUpperCase()) {
                    return true;
                } else if (str === val.toLowerCase()) {
                    return true;
                } else if (str === $scope.capped(val)) {
                    return true;
                } else return false;
            } else return false;
        };

        $scope.isAlert = function(v) {
            var str = 'ALERT';

            if ($scope.eitherString(str, v)) {// checks all cases upper/lower/first letter cap
                return true;
            }

            return false;
        };
        $scope.isRequest = function(v) {
            var str = 'REQUEST';

            if ($scope.eitherString(str, v)) {// checks all cases upper/lower/first letter cap
                return true;
            }

            return false;
        };
        $scope.isTrace = function(v) {            
            var str = 'TRACE';

            if ($scope.eitherString(str, v)) {// checks all cases upper/lower/first letter cap
                return true;
            }

            return false;
        };

        var fetchActionListSuccessCallBack = function (data) {
            var splitTimeString = data.business_date_time.split("T");

            $scope.hotel_time = splitTimeString[0] + "T" +  splitTimeString[1].split(/[+-]/)[0];

            var list = data.data;
            var matchObj;

            for (var x in list) {
                if (list[x].assigned_to !== null) {
                    list[x].assigned = true;
                } else {
                    list[x].assigned = false;
                }


                if (typeof list[x].due_at === typeof 'string') {
                    var splitDueTimeString = list[x].due_at_str.split("T");

                    // 24 hr format for the dropdown in the right panel
                    list[x].due_at_time = dateFilter(splitDueTimeString[0] + "T" +  splitDueTimeString[1].split(/[+-]/)[0], "HH:mm");
                    // 12 hr format for binding in the list
                    list[x].due_at_time_str = dateFilter(splitDueTimeString[0] + "T" +  splitDueTimeString[1].split(/[+-]/)[0], "hh:mm a");

                    list[x].due_at_date = dateFilter(splitDueTimeString[0], $rootScope.dateFormat);
                    list[x].hasDate = true;
                } else {
                    list[x].hasDate = false;
                }

                if (list[x].action_status === "COMPLETED") {
                    list[x].isCompleted = true;
                    list[x].date_completed = getFormattedDate(list[x].completed_at, 'date_completed');
                    list[x].time_completed = getCompletedTimeFromDateMilli(list[x].completed_at, 'time_completed');
                }

                if (list[x].created_at) {
                    list[x].created_at_time = $filter('date')(list[x].created_at, "hh:mm a");
                    list[x].created_at_date = $filter('date')(list[x].created_at, $rootScope.dateFormat);
                }

            }
            $scope.actions = list;
            $scope.actions.totalCount = list.length;
            if (list.length === 0) {
                $scope.actionSelected = 'none';
            }
            $scope.setActionsHeaderInfo();
            
            // CICO-48361 
            if ($scope.actions[0]) {
                $scope.selectAction($scope.actions[0]);
            } 
            refreshScroller();
        };

        var fetchActionListFailureCallBack = function (data) {
            $scope.$emit('hideLoader');
            $scope.setActionsHeaderInfo();
        };

        $scope.fetchActionsList = function() {
            $scope.fetchDepartments();// store this to use in assignments of department

            var data = {id: $scope.groupConfigData.summary.group_id};

            $scope.invokeApi(rvGroupActionsSrv.getActionsTasksList, data, fetchActionListSuccessCallBack, fetchActionListFailureCallBack);
        };

        var getTimeFromDateStr = function(d, via) {
            var date = new Date(d);

            return formatTime(date.valueOf(), via);
        };
        var getCompletedTimeFromDateMilli = function(d, via) {
            if (typeof d === typeof 'string') {
                return formatUserTime(parseInt(d), via);
            } else if (typeof d === typeof 12345) {
                return formatUserTime(d, via);
            }
        };
        var getTimeFromDateMilli = function(d) {
            if (typeof d === typeof 'string') {
                return formatTime(parseInt(d));
            } else if (typeof d === typeof 12345) {
                return formatTime(d);
            }
        };

        $scope.setDefaultActionSelected = function(index) {
            if (!index) {
                index = 0;
            }
            setTimeout(function() {
                if ($scope.actions[index]) {
                    $scope.selectAction($scope.actions[index]);// first action selected by default
                }
            }, 100);
        };
        var getFormattedDate = function(d, via) {
            var fullDate, day, month, year;

            if (typeof d === typeof 'string') {
                var dateInMilli = parseInt(d);

                fullDate = new Date(dateInMilli);

            } else if (typeof d === typeof 12345) {
                fullDate = new Date(d);
            }
            day = fullDate.getDate();
            month = fullDate.getMonth() + 1;
            year = fullDate.getFullYear();

            if (day < 10) {
                day = '0' + day;
            }
            if (month < 10) {
                month = '0' + month;
            }
            return $filter('date')(new tzIndependentDate(year + '-' + month + '-' + day), $rootScope.dateFormat);
        };
        var getStrParsedFormattedDate = function(d) {
            if (d) {
                var dateStr = d.split('T');
                var month, day, year;
                var formatDate = dateStr[0].split('-');

                year = formatDate[0];
                month = formatDate[1];
                day = formatDate[2];

                return $filter('date')(new tzIndependentDate(year + '-' + month + '-' + day), $rootScope.dateFormat);
            }

        };

        $scope.getDateFromDate = function(d) {
            var day = new Date(d);
            var dayString = day.getDay();

            switch (day.getDay()) {
                case 0:
                    return $filter('translate')('SUNDAY');
                    break;

                case 1:
                    return $filter('translate')('MONDAY');
                    break;

                case 2:
                    return $filter('translate')('TUESDAY');
                    break;

                case 3:
                    return $filter('translate')('WEDNESDAY');
                    break;

                case 4:
                    return $filter('translate')('THURSDAY');
                    break;

                case 5:
                    return $filter('translate')('FRIDAY');
                    break;

                case 6:
                    return $filter('translate')('SATURDAY');
                    break;

            }

            return dayString;
        };

        var formatUserTime = function(timeInMs, via) {
            var dt = new Date(timeInMs);
            var hours = dt.getHours();
            var minutes = dt.getMinutes();
            var seconds = dt.getSeconds();

            if (hours < 10) {
                hours = '0' + hours;
            }
            if (minutes < 10) {
                minutes = '0' + minutes;
            }
            if (seconds < 10) {
                seconds = '0' + seconds;
            }
            return getFormattedTime(hours + '' + minutes);
        };
        var formatTime = function(timeInMs, via) {
            var dt = new Date(timeInMs);
            var hours, minutes, seconds;

            if (via === 'created_at_time') {
                hours = dt.getHours();
                minutes = dt.getMinutes();
                seconds = dt.getSeconds();
            } else {
                hours = dt.getHours();
                minutes = dt.getMinutes();
                seconds = dt.getSeconds();
            }

            if (hours < 10) {
                hours = '0' + hours;
            }
            if (minutes < 10) {
                minutes = '0' + minutes;
            }
            if (seconds < 10) {
                seconds = '0' + seconds;
            }
            return getFormattedTime(hours + '' + minutes);

        };
        var getFormattedTime = function (fourDigitTime) {
            var hours24 = parseInt(fourDigitTime.substring(0, 2));
            var hours = ((hours24 + 11) % 12) + 1;
            var amPm = hours24 > 11 ? ' PM' : ' AM';
            var minutes = fourDigitTime.substring(2);

            if (typeof hours === typeof 2) {
                if (hours < 10) {
                    hours = '0' + hours;
                }
            }

            return hours + ':' + minutes + amPm;
        };

        $scope.populateTimeFieldValue = function() {
            var getFormattedTime = function (fourDigitTime) {
                var hours24 = parseInt(fourDigitTime.substring(0, 2));
                var hours = ((hours24 + 11) % 12) + 1;
                var amPm = hours24 > 11 ? ' PM' : ' AM';
                var minutes = fourDigitTime.substring(2);

                if (parseInt(hours) < 10) {
                    hours = '0' + hours;
                }
                return hours + ':' + minutes + amPm;
            };

            $scope.timeFieldValue = [];
            for (var x in $scope.timeFieldValues) {
                $scope.timeFieldValue.push({
                    'value': getFormattedTime($scope.timeFieldValues[x]),
                    'core_time': $scope.timeFieldValues[x]
                });
            }
        };
        $scope.timeFieldValue = [];
        $scope.timeFieldValues = ['0000', '0015', '0030', '0045', '0100',
            '0115', '0130', '0145', '0200',
            '0215', '0230', '0245', '0300',
            '0315', '0330', '0345', '0400',
            '0415', '0430', '0445', '0500',
            '0515', '0530', '0545', '0600',
            '0615', '0630', '0645', '0700',
            '0715', '0730', '0745', '0800',
            '0815', '0830', '0845', '0900',
            '0915', '0930', '0945', '1000',
            '1015', '1030', '1045', '1100',
            '1115', '1130', '1145', '1200',
            '1215', '1230', '1245', '1300',
            '1315', '1330', '1345', '1400',
            '1415', '1430', '1445', '1500',
            '1515', '1530', '1545', '1600',
            '1615', '1630', '1645', '1700',
            '1715', '1730', '1745', '1800',
            '1815', '1830', '1845', '1900',
            '1915', '1930', '1945', '2000',
            '2015', '2030', '2045', '2100',
            '2115', '2130', '2145', '2200',
            '2215', '2230', '2245', '2300',
            '2315', '2330', '2345'
        ];

        $scope.clearAssignSection = function() {
            $scope.departmentSelect.selected = {};
            $scope.closeSelectedCalendar();
            $scope.closeNewCalendar();
        };

        $scope.departmentSelect = {};
        $scope.assignDepartment = function() {
            var params = $scope.getBaseParams();

            if ($scope.departmentSelect.selected) {
                params['assigned_to'] = $scope.departmentSelect.selected.value;
                params.action_task.id  = $scope.selectedAction.id;

                var onSuccess = function() {
                    // switch back to selected
                    $scope.actionSelected = 'selected';
                    $scope.lastSelectedItemId = params.action_task.id;
                    $scope.refreshActionList();
                    $scope.clearAssignSection();
                };
                var onFailure = function(data) {
                    // show failed msg, so user can try again-?
                    if (data[0]) {
                        $scope.errorMessage = 'Internal Error Occured';
                    }
                    $scope.$emit('hideLoader');
                };

                $scope.invokeApi(rvGroupActionsSrv.updateNewAction, params, onSuccess, onFailure);
            }
        };

        $scope.initRefresh = function(del) {
            $scope.isRefreshing = true;

            var deleting = false;

            if (del === 'delete') {
                deleting = true;
            }

            var removingLastAction = ($scope.actions.totalCount - 1 <= 0);

            if (deleting && removingLastAction) {
                $scope.refreshToEmpty = true;
                $scope.actionSelected = 'none';
                $scope.actions.totalCount = 0;
                $scope.recountAfterDelete = true;
            } else {// complete action (non-delete)
                $scope.refreshing = true;
                $scope.refreshToEmpty = false;
                $scope.actionSelected = 'selected';
            }
        };

        $scope.endRefresh = function() {
            $scope.isRefreshing = false;
        };
        $scope.isRefreshing = true;
        $scope.completeAction = function(del, selected) {
            // mark the selected action as complete, notify the api
            var params = $scope.getBaseParams();

            params.action_task.id  = $scope.selectedAction.id;
            params.is_complete = true;

            $scope.initRefresh(del);

            var onSuccess = function() {
                if (del === 'delete') {
                    $scope.actions.totalCount--;
                }
                $scope.lastSelectedItemId = params.action_task.id;
                $scope.refreshActionList(del, selected);


                if (($scope.actions.totalCount - 1 <= 1) && del !== 'delete') {
                    $scope.actionSelected = 'selected';
                }
                $scope.isRefreshing = false;
                $scope.$emit("SET_ACTIONS_COUNT", "complete");

            };
            var onFailure = function(data) {
                if (data[0]) {
                    $scope.errorMessage = data[0];
                }
                $scope.$emit('hideLoader');
                $scope.endRefresh();
            };

            $scope.invokeApi(rvGroupActionsSrv.completeAction, params, onSuccess, onFailure);
        };

        $scope.assignAction = function() {
            $scope.actionSelected = 'assign';
        };

        $scope.reassignAction = function() {
            var assignedTo = $scope.selectedAction.assigned_to.id + '',
                department = _.findWhere($scope.departments, { value: assignedTo });

            $scope.departmentSelect.selected = department;
            $scope.actionSelected = 'assign';
        };

        $scope.getBaseParams = function() {
            var params = {
                'group_id': $scope.groupConfigData.summary.group_id,
                'action_task': {}
            };

            return params;
        };

        $scope.sortActionsList = function(list) {
            // take an actions list and sort it by due date,
            // - but also put "completed" items @ the bottom
            // step 1. make two lists, (completed, not completed)
            // step 2. sort both lists
            // step 3. join lists, completed After not completed
            var completed = [], not_completed = [];

            for (var x in list) {
                if (list[x].date_completed) {
                    completed.push(list[x]);
                } else {
                    not_completed.push(list[x]);
                }
            }


        };  

        // Close the active dialog
        $scope.closeDialog = function() {
            ngDialog.close();
        };

        /**
         * Update the selected action with the edited data
         * @param {Object} params holding the updated action details
         * @return {void}
         */
        var updateSelectedAction = function(params) {

                var onSuccess = function() {
                    // switch back to selected
                    $scope.actionSelected = 'selected';
                    $scope.lastSelectedItemId = params.action_task.id;
                    $scope.refreshActionList();
                    $scope.clearAssignSection();
                };
                var onFailure = function(data) {
                    // show failed msg, so user can try again-?
                    if (data[0]) {
                        $scope.errorMessage = 'Internal Error Occured';
                    }
                    $scope.$parent.$emit('hideLoader');
                };

                $scope.invokeApi(rvGroupActionsSrv.updateNewAction, params, onSuccess, onFailure);
           
        };
        
        // Get the action status info
        $scope.getActionStatusInfo = function(action) {
            var status = action.action_status;

            if (status === 'delete') {
                status = 'Delete Action?';
            } else if (action.over_due && status !== 'COMPLETED') {
                status = 'OVERDUE';
            }

            return status;
        };

        // Checks whether edit/complete btn should be shown or not
        $scope.shouldShowEditAndCompleteBtns = function(action) {            
            return ['UNASSIGNED', 'ASSIGNED'].indexOf(action.action_status) > -1 ;
        };

        // Checks whether the delete action btn should be shown or not
        $scope.shouldShowDeleteBtn = function(action) {            
            return ['UNASSIGNED', 'ASSIGNED', 'COMPLETED'].indexOf(action.action_status) > -1 ;
        };

        // Prepare the edit action screen
        $scope.prepareEditAction = function(action) {
            $scope.actionSelected = 'edit';
            var assignedTo = action.assigned_to,
                department = '';

            if (assignedTo && assignedTo.id) {                
                department = _.findWhere($scope.departments, { value: assignedTo.id + "" });
            }

            $scope.newAction = {
                department: department,
                time_due: action.due_at_time,
                date_due: action.due_at_date,
                hasDate: true,
                notes: action.description,
                actionId: action.id
            };
        };

        // Get the params required for updating an action
        var getUpdateRequestParams = function() {            
            var params = {
                'group_id': $scope.groupConfigData.summary.group_id,
                'action_task': {
                    'id': $scope.newAction.actionId
                }
            };            

            if ($scope.newAction.department) {
               params.assigned_to = $scope.newAction.department.value;               
            } else {
              params.assigned_to = '';  
            }

            if ($scope.newAction.date_due) {
                var dateObj = $scope.newAction.dueDateObj;

                if (!dateObj) {
                    var dateParts = $scope.newAction.date_due.split('-');
                    
                    dateObj = getTZIndependentDateFromDayMonthYear(dateParts[0], dateParts[1], dateParts[2]);
                }

                params.due_at = $filter('date')(dateObj, $rootScope.dateFormatForAPI) +
                    ($scope.newAction.time_due ? "T" + $scope.newAction.time_due + ":00" : "");
            }

            if ($scope.newAction.notes) {
                params.action_task.description = $scope.newAction.notes;
            }

            return params;
        };

        // Handler for the update action
        $scope.handleActionUpdate = function() {
            var params = getUpdateRequestParams();

            updateSelectedAction(params);
        };

        // Cancel the action edit operation
        $scope.cancel = function() {
            if ($scope.actions.totalCount === 0) {
                $scope.setRightPane("none");
            } else {
                $scope.setRightPane("selected");
            }
        };

        // Checks the permission to edit action
        $scope.hasPermissionToEditAction = function() {
            return rvPermissionSrv.getPermissionValue('EDIT_ACTION');
        };

        // Prepare delete Action
        $scope.prepareDeletAction = function() {
            $scope.selectedAction.originalStatus = $scope.selectedAction.action_status;
            $scope.selectedAction.action_status = 'delete';
        };

        // Delete action
        $scope.deleteAction = function() {
          var onSuccess = function() {                    
                    $scope.fetchActionsList();
                    $scope.refreshScroller("rvActionListScroller");
                    $scope.$emit("SET_ACTIONS_COUNT", {deletedActionStatus: $scope.selectedAction.action_status});
                },
                onFailure = function(data) {
                    // show failed msg, so user can try again-?
                    if (data[0]) {
                        $scope.errorMessage = 'Internal Error Occured';
                    }                    
                };
            var apiConfig = {
                params: $scope.selectedAction.id,
                onSuccess: onSuccess,
                onFailure: onFailure
            };

            $scope.callAPI(rvActionTasksSrv.deleteActionTask, apiConfig);            
        };

        // Checks the permission to edit action
        $scope.hasPermissionToDeleteAction = function() {
            return rvPermissionSrv.getPermissionValue('DELETE_ACTION');
        };

        // Cancel delete operation
        $scope.cancelDelete = function() {
            $scope.selectedAction.action_status = $scope.selectedAction.originalStatus;
        };

        // Get action status based class name
        $scope.getActionStatusClass = function(action) {
            var status = action.action_status;

            if (status === 'delete') {
                status = action.originalStatus;
            }

            return status;
        };
        
        init();
    }
]);