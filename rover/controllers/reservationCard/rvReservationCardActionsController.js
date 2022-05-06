"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

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
        angular.module('sntRover').controller('rvReservationCardActionsController', ['$scope', '$filter', '$rootScope', 'ngDialog', 'rvActionTasksSrv', 'RVReservationCardSrv', 'rvUtilSrv', 'dateFilter', '$timeout', 'sntActivity', 'rvPermissionSrv', function ($scope, $filter, $rootScope, ngDialog, rvActionTasksSrv, RVReservationCardSrv, rvUtilSrv, dateFilter, $timeout, sntActivity, rvPermissionSrv) {

            BaseCtrl.call(this, $scope);
            $scope.reservationNotes = "";
            /*
             *To save the reservation note and update the ui accordingly
             */
            $scope.errorMessage = '';
            $scope.actionsCount = 'none'; // none, pending, all-completed
            $scope.actions = {};
            $scope.newAction = {};
            $scope.actions.totalCount = 0;
            $scope.actions.arrivalDateString = '';
            $scope.actions.departureDateString = '';
            $scope.selectedAction = {};
            $scope.selectedAction.created_by_null = false;
            $scope.openingPopup = false;
            $scope.refreshing = false;
            $scope.refreshToEmpty = false;
            $scope.newAction.department = { 'value': '' };
            $scope.hotel_time = "4:00 A.M";
            $scope.departmentSelect = {};
            $scope.timeSelectorList = rvUtilSrv.getListForTimeSelector(15, 12);
            $scope.timeFieldValues = rvActionTasksSrv.getTimeFieldValues();
            $scope.selectedActionMessage = '';
            $scope.selectedDepartment = '';
            $scope.actionsSyncing = false;
            $scope.reservationId = '';
            $scope.isStandAlone = true;
            $scope.starting = false;
            $scope.actionsSyncd = false;
            $scope.editingDescriptionInline = false;
            $scope.lastSelectedItemId = '';
            $scope.actionSelected = 'none';
            $scope.isRefreshing = false;

            var setInitialActionsCount = function setInitialActionsCount() {
                $scope.actions.totalCount = $scope.reservationListData.action_count;
                $scope.actions.pendingCount = $scope.reservationListData.pending_action_count;
                $scope.actionsCount = rvActionTasksSrv.getActionsClassName($scope.actions.totalCount, $scope.actions.pendingCount);
            };

            $scope.lastSavedDescription = '';
            $scope.updateActionDescription = function (description_old, description_new) {
                var params = {
                    'reservation_id': $scope.$parent.reservationData.reservation_card.reservation_id,
                    'action_task': {
                        'id': $scope.selectedAction.id
                    }
                };

                params.action_task.description = description_new;

                var onSuccess = function onSuccess(response) {
                    $scope.lastSavedDescription = response.data.description;
                    $scope.savingDescription = false;
                    $scope.$emit('hideLoader');
                };
                var onFailure = function onFailure(response) {
                    $scope.savingDescription = false;
                    $scope.$emit('hideLoader');
                };

                if ($scope.savingDescription) {
                    if ($scope.lastSavedDescription !== description_new) {
                        if (description_new && description_new !== '') {
                            $scope.callAPI(rvActionTasksSrv.updateNewAction, params, {
                                params: params,
                                successCallBack: onSuccess,
                                failureCallBack: onFailure
                            });
                        } else {
                            $scope.selectedAction.description = $scope.lastSavedDescription;
                            $scope.editingDescriptionValue = $scope.lastSavedDescription;
                        }
                    }
                }
            };
            $scope.savingDescription = false;

            $scope.stopEditClick = function (ent) {
                if (!$scope.starting || ent) {
                    // ent = enter on keyboard hit, user was in txt input and hits enter, forcing a save request
                    setTimeout(function () {
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

            $scope.startEditDescription = function () {
                $scope.starting = true;
                if (!$scope.isStandAlone) {
                    if ($scope.isTrace($scope.selectedAction.action_task_type)) {
                        // only overlay traces for now (sprint 37) CICO-17112
                        $scope.editingDescriptionInline = true;
                    }
                    $scope.starting = false;
                    $scope.editingDescriptionValue = $scope.selectedAction.description;
                } else {
                    $scope.starting = false;
                    $scope.editingDescriptionInline = false;
                }
            };

            $scope.syncActions = function (id) {
                /*
                 * method to sync action count for the staycard
                 * this reaches out to
                 */
                var onSuccess = function onSuccess(data) {
                    $scope.actions.totalCount = data.total_count;
                    $scope.actions.pendingCount = data.pending_count;
                    $scope.actionsCount = rvActionTasksSrv.getActionsClassName($scope.actions.totalCount, $scope.actions.pendingCount);

                    $scope.actionsSyncd = true;
                    // Update the actionsCount variable in $scope; This is used to manage the style of the actions button
                    setInitialActionsCount();
                };

                var onFailure = function onFailure() {
                    $scope.actionsSyncd = true;
                };

                $scope.callAPI(rvActionTasksSrv.syncActionCount, {
                    params: id,
                    successCallBack: onSuccess,
                    failureCallBack: onFailure
                });
            };

            var refreshScroller = function refreshScroller() {
                $scope.refreshScroller('rvActionListScroller');
            };

            var getArDeDateStr = function getArDeDateStr(dateStr, timeStr) {
                var aDay = rvActionTasksSrv.getDateFromDate(dateStr),
                    aDayString = ' ';

                dateStr = dateStr || ' ';
                timeStr = timeStr || ' ';

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
                    return aDayString + $filter('date')(new tzIndependentDate(dateStr), $rootScope.dateFormat) + '  ' + timeStr;
                }

                return timeStr;
            };

            var setActionsHeaderInfo = function setActionsHeaderInfo() {
                var arDate = $scope.reservationData.reservation_card.arrival_date,
                    arTime = $scope.reservationData.reservation_card.arrival_time,
                    arrivalDayString = getArDeDateStr(arDate, arTime),
                    deDate = $scope.reservationData.reservation_card.departure_date,
                    deTime = $scope.reservationData.reservation_card.departure_time,
                    departureDayString = getArDeDateStr(deDate, deTime);

                $scope.hasArrivalDate = !!arrivalDayString;
                $scope.hasDepartureDate = !!departureDayString;
                $scope.actions.arrivalDateString = arrivalDayString;
                $scope.actions.departureDateString = departureDayString;
            };

            var fetchDepartments = function fetchDepartments(cb) {
                $scope.callAPI(rvActionTasksSrv.fetchDepartments, {
                    successCallBack: function successCallBack(data) {
                        $scope.departments = data.data.departments;
                        $scope.departmentsCount = $scope.departments.length;
                        typeof cb === 'function' && cb();
                    },
                    failureCallBack: function failureCallBack() {
                        $scope.departmentsCount = 0;
                    }
                });
            };

            $scope.selectAction = function (a) {
                var action = a;

                if (action) {
                    $scope.selectedAction = action;
                    if (action.description) {
                        $scope.lastSavedDescription = action.description;
                    }

                    // CICO-55027 - Restore the original status if nothing is done after opting for delete
                    if ($scope.selectedAction.originalStatus) {
                        $scope.selectedAction.action_status = $scope.selectedAction.originalStatus;
                    }
                }

                $scope.setRightPane('selected');
                $scope.refreshScroller('actionSummaryScroller');
                $scope.clearAssignSection();
            };

            // For mobile view while one action selected
            $scope.onActionSelected = function () {
                $scope.showLeftSideViewForMobile = false;
            };

            // For mobile view while Back button clicked
            $scope.onBackButtonClicked = function () {
                $scope.showLeftSideViewForMobile = true;
            };

            $scope.setRightPane = function (toView) {
                // selected, new, assign, comment
                $scope.actionSelected = toView;
            };

            $scope.clearNewAction = function () {
                $scope.closeSelectedCalendar();
                $scope.closeNewCalendar();
                $scope.newAction.notes = '';
                $scope.newAction.department = { 'value': '' };
                $scope.newAction.time_due = '';
                $scope.actionsSelectedDate = $rootScope.businessDate;
                $scope.newAction.hasDate = false;
                $scope.setFreshDate();
            };

            $scope.$watch('newAction.department', function (now) {
                $scope.departmentSelected = !!now;
            });

            $scope.clearErrorMessage = function () {
                $scope.errorMessage = '';
            };

            $scope.postAction = function () {
                $scope.selectedAction = 'selected';
                var onSuccess = function onSuccess(response) {
                    if (response.status === 'failure') {
                        if (response.errors && response.errors[0]) {
                            $scope.errorMessage = response.errors[0];
                        }
                    }
                    $scope.fetchActionsList();
                    $scope.refreshScroller("rvActionListScroller");
                };
                var onFailure = function onFailure(data) {
                    $scope.errorMessage = data;
                    $scope.$parent.$emit('hideLoader');
                };
                // reservation_id=1616903&action_task[description]=test
                var params = {
                    'reservation_id': $scope.$parent.reservationData.reservation_card.reservation_id,
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

                    params['due_at'] = $filter('date')(dateObj, $rootScope.dateFormatForAPI) + ($scope.newAction.time_due ? "T" + $scope.newAction.time_due + ":00" : "");
                }

                $scope.callAPI(rvActionTasksSrv.postNewAction, {
                    params: params,
                    successCallBack: onSuccess,
                    failureCallBack: onFailure
                });
            };

            $scope.reformatDateOption = function (d, spl, newSpl) {
                // expecting ie. 01/09/2015 (month, day, yr)
                var spl = d.split(spl);
                var month = spl[0],
                    day = spl[1],
                    year = spl[2];

                return month + newSpl + day + newSpl + year;
            };

            $scope.setUpData = function () {
                var businessDate = tzIndependentDate($rootScope.businessDate);
                var nd = new Date(businessDate);
                var day = ("0" + nd.getDate()).slice(-2);
                var month = ("0" + (nd.getMonth() + 1)).slice(-2);
                var fromDateStr = nd.getFullYear() + '-' + month + '-' + day;

                $scope.fromDate = fromDateStr;
            };

            $scope.setFreshDate = function () {

                $scope.newAction.hasDate = true;
                // CICO-27905
                // In the stay card, the date due for a new action should default to the greater of the arrival date / business date
                var businessDate = new tzIndependentDate($rootScope.businessDate),
                    arrivalDate = new tzIndependentDate($scope.reservationParentData.arrivalDate);

                $scope.newAction.dueDateObj = businessDate > arrivalDate ? businessDate : arrivalDate;
                $scope.newAction.date_due = $filter('date')($scope.newAction.dueDateObj, $rootScope.dateFormat);
                if (!$scope.newAction.time_due) {
                    $scope.newAction.time_due = rvUtilSrv.roundToNextQuarter(parseInt($filter('date')($scope.hotel_time, "HH"), 10), parseInt($filter('date')($scope.hotel_time, "mm"), 10));
                }
            };

            $scope.actionsDateOptions = {
                firstDay: 1,
                changeYear: true,
                changeMonth: true,
                dateFormat: $rootScope.jqDateFormat,
                minDate: tzIndependentDate($rootScope.businessDate),
                yearRange: "0:+10",
                onSelect: function onSelect(date, dateObj) {
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

            $scope.onTimeChange = function () {
                $scope.updateAction();
            };

            $scope.updateAction = function () {
                var onSuccess = function onSuccess() {
                    $scope.refreshActionList();
                    $scope.refreshScroller("rvActionListScroller");
                };
                var onFailure = function onFailure(data) {
                    if (data[0]) {
                        $scope.errorMessage = 'Internal Error Occured';
                    }
                };

                var params = {
                    'reservation_id': $scope.$parent.reservationData.reservation_card.reservation_id,
                    'action_task': {
                        'id': $scope.selectedAction.id
                    }
                };

                $scope.lastSelectedItemId = $scope.selectedAction.id;
                if (_typeof($scope.selectedAction.due_at_date) === _typeof('string') || _typeof($scope.selectedAction.due_at_date) === _typeof(12345)) {
                    var dateObj = $scope.selectedAction.dueDateObj || new tzIndependentDate($scope.selectedAction.due_at_str);

                    params['due_at'] = $filter('date')(dateObj, $rootScope.dateFormatForAPI) + ($scope.selectedAction.due_at_time ? "T" + $scope.selectedAction.due_at_time + ":00" : "");
                    $scope.callAPI(rvActionTasksSrv.updateNewAction, {
                        params: params,
                        successCallBack: onSuccess,
                        failureCallBack: onFailure
                    });
                }
            };

            $scope.showCalendar = function () {
                ngDialog.open({
                    template: '/assets/partials/reservationCard/Actions/rvReservationCardActionsCalendar.html' });
            };

            $scope.usingCalendar = false;
            $scope.getDateObj = function (dateStr, delim) {
                var year, month, day;
                var spl = dateStr.split(delim);

                day = spl[1];
                month = spl[0];
                year = spl[2];

                return { day: day,
                    month: month,
                    year: year };
            };
            $scope.showSelectCalendar = function () {
                // to ensure same day due to utc hour, set utc hour to 0100
                // if newAction = set start date to today, otherwise set it to the selectedAction due date
                var fmObj = tzIndependentDate($scope.selectedAction.due_at_str);

                $scope.actionsSelectedDate = $filter('date')(fmObj, "yyyy-MM-dd");
                $scope.usingCalendar = true;
                $scope.dateSelection = 'select';
                $scope.selectCalendarShow = true;
            };

            $scope.closeSelectedCalendar = function () {
                $scope.usingCalendar = false;
                $scope.dateSelection = null;
                $scope.selectCalendarShow = false;
            };

            $scope.showNewCalendar = function () {
                $scope.dateSelection = 'new';
                $scope.newCalendarShow = true;
                $scope.usingCalendar = true;
            };

            $scope.closeNewCalendar = function () {
                $scope.dateSelection = null;
                $scope.newCalendarShow = false;
                $scope.usingCalendar = false;
            };

            $scope.initNewAction = function () {
                $scope.clearNewAction();
                $scope.setRightPane('new');
                $scope.showLeftSideViewForMobile = false;
            };

            $scope.getDefaultDueDate = function () {
                return new Date();
            };

            $scope.cancelNewAction = function () {
                // switch back to selected view of lastSelected
                // just change the view to selected
                if ($scope.actions.totalCount > 0) {
                    if ($scope.lastSelectedItemId) {
                        $scope.selectAction($scope.actions[$scope.lastSelectedItemId]);
                    }
                    $scope.setRightPane('selected'); // goes back to last screen if actions exist
                } else {
                    $scope.setRightPane('none'); // goes back to All is Good if no actions
                }

                $scope.clearNewAction();
                $scope.showLeftSideViewForMobile = true;
            };

            $scope.refreshingList = function () {
                return $scope.refreshing || $scope.refreshToEmpty;
            };

            $scope.refreshingToNonEmpty = function () {
                return $scope.refreshing && !$scope.refreshToEmpty;
            };

            $scope.showActionsList = function () {
                return ($scope.actions.totalCount > 0 || $scope.refreshing) && !$scope.refreshToEmpty;
            };

            $scope.showErrMsg = function () {
                return $scope.errorMessage !== '';
            };

            $scope.isOverlayRequest = function (action) {
                return !$scope.isStandAlone && $scope.isRequest(action.action_task_type);
            };

            $scope.isStandAloneAction = function (action) {
                return !$scope.isTrace(action.action_task_type) && !$scope.isRequest(action.action_task_type) && !$scope.isAlert(action.action_task_type);
            };

            $scope.showActionSummary = function () {
                return $scope.actionSelected === 'selected' || $scope.actionSelected === 'selected' && $scope.refreshing;
            };

            $scope.showNewAction = function () {
                return $scope.actionSelected === 'new' || $scope.refreshing;
            };

            $scope.showNewActionOnly = function () {
                return $scope.actions.totalCount === 0 && $scope.actionSelected === 'new' && !$scope.refreshToEmpty;
            };

            $scope.showEmptyActions = function () {
                return $scope.actions.totalCount === 0 && $scope.actionSelected === 'none' || $scope.refreshToEmpty;
            };

            $scope.postActionEnabled = function () {
                return !$scope.newAction.hasDate || !$scope.newAction.notes || !$scope.departmentSelected && !$scope.isStandAlone;
            };

            $scope.showAssignScreen = function () {
                return $scope.actionSelected === 'assign' || $scope.actionSelected === 'assign' && $scope.refreshing;
            };

            $scope.refreshActionList = function (del, selected) {
                fetchDepartments(); // store this to use in assignments of department
                var onSuccess = function onSuccess(data) {
                    var splitTimeString = data.business_date_time.split("T");

                    $scope.hotel_time = splitTimeString[0] + "T" + splitTimeString[1].split(/[+-]/)[0];

                    var list = data.data;
                    // if doing a refresh, dont replace the actions array, since it will cause the UI to flash
                    // and look like a bug, instead go through the objects and update them

                    $scope.actions.totalCount = data.action_count;
                    $scope.actions.pendingCount = data.pending_action_count;
                    $scope.actionsCount = rvActionTasksSrv.getActionsClassName($scope.actions.totalCount, $scope.actions.pendingCount);

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
                                        if (del === 'delete' && selected) {
                                            // flag to delete an item (overlay)
                                            if (selected.id === listItem.id) {
                                                inActions = true; // skips
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

                    setActionsHeaderInfo();
                    $scope.showLeftSideViewForMobile = true;
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
                                            for (var i in $scope.actions) {
                                                // select next non-deleted action
                                                if (!$scope.actions[i].is_deleted) {
                                                    $scope.selectAction($scope.actions[i]);
                                                    $scope.$parent.$emit('hideLoader');
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
                };

                var onFailure = function onFailure(data) {
                    $scope.$parent.$emit('hideLoader');
                    $scope.refreshToEmpty = false;
                    $scope.refreshing = false;
                    $scope.showLeftSideViewForMobile = true;
                };

                $scope.callAPI(rvActionTasksSrv.getActionsTasksList, {
                    params: {
                        id: $scope.$parent.reservationData.reservation_card.reservation_id
                    },
                    successCallBack: onSuccess,
                    failureCallBack: onFailure
                });
            };

            $scope.hasActionStatus = function () {
                if (!$scope.actions) {
                    return false;
                } else if ($scope.actionSelected === "none" || $scope.actionSelected === "new") {
                    return true;
                } else if (!(($scope.actions.totalCount > 0 || $scope.refreshing) && !$scope.refreshToEmpty) && !($scope.actions.totalCount === 0 && $scope.actionSelected === "none" || $scope.refreshToEmpty)) {
                    return false;
                }
                return true;
            };

            $scope.isDeletePending = function (id, a) {
                for (var i in a) {
                    if (a[i] === id) {
                        return true;
                    }
                }
                return false;
            };

            var isSameString = function isSameString(str, val) {
                str = str || '';
                val = val || '';
                return str.toUpperCase() === val.toUpperCase();
            };

            $scope.isAlert = function (v) {
                return isSameString('ALERT', v);
            };

            $scope.isRequest = function (v) {
                return isSameString('REQUEST', v);
            };

            $scope.isTrace = function (v) {
                return isSameString('TRACE', v);
            };

            $scope.isMessage = function (v) {
                return isSameString('MESSAGE', v);
            };

            $scope.fetchActionsList = function () {
                sntActivity.start('FETCH_ACTIONS_LIST');

                var onSuccess = function onSuccess(data) {
                    var splitTimeString = data.business_date_time.split('T');

                    $scope.hotel_time = splitTimeString[0] + 'T' + splitTimeString[1].split(/[+-]/)[0];

                    $scope.actions = data.data;

                    $scope.actions.totalCount = data.action_count;
                    $scope.actions.pendingCount = data.pending_action_count;
                    $scope.actionsCount = rvActionTasksSrv.getActionsClassName($scope.actions.totalCount, $scope.actions.pendingCount);

                    if ($scope.actions.totalCount === 0) {
                        $scope.actionSelected = 'none';
                    }

                    setActionsHeaderInfo();

                    // CICO-45902 Removed the timeout here as it is causing delay while adding a new action
                    if ($scope.actions[0]) {
                        $scope.selectAction($scope.actions[0]);
                    }
                    refreshScroller();

                    if ($scope.openingPopup) {

                        initPopup();
                        // The Existing logic of opening the popup before API calls and
                        // based on timeout is not right way and is to be changed
                        // For now, Adding fix for CICO-51610, ie to show the loading indicator till the popup is opened
                        sntActivity.stop('FETCH_ACTIONS_LIST');
                    } else {
                        sntActivity.stop('FETCH_ACTIONS_LIST');
                    }

                    $scope.openingPopup = false;
                    $scope.showLeftSideViewForMobile = true;
                };

                var onFailure = function onFailure() {
                    setActionsHeaderInfo();
                    sntActivity.stop('FETCH_ACTIONS_LIST');
                    $scope.showLeftSideViewForMobile = true;
                };

                fetchDepartments(function () {
                    $scope.callAPI(rvActionTasksSrv.getActionsTasksList, {
                        params: { id: $scope.$parent.reservationData.reservation_card.reservation_id },
                        successCallBack: onSuccess,
                        failureCallBack: onFailure
                    });
                });
            };

            $scope.setDefaultActionSelected = function (index) {
                index = index || 0; // first action selected by default
                if ($scope.actions[index]) {
                    $scope.selectAction($scope.actions[index]);
                }
            };

            $scope.populateTimeFieldValue = function () {
                var getFormattedTime = function getFormattedTime(fourDigitTime) {
                    var hours24 = parseInt(fourDigitTime.substring(0, 2));
                    var hours = (hours24 + 11) % 12 + 1;
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

            var initPopup = function initPopup() {
                var templateUrl = '/assets/partials/reservationCard/actions/rvReservationCardActionsPopup.html';

                if (!$rootScope.isStandAlone) {
                    templateUrl = '/assets/partials/reservationCard/actions/overlay/rvReservationCardActionsPopupOverlay.html';
                }

                ngDialog.open({
                    template: templateUrl,
                    className: 'ngdialog-theme-default',
                    scope: $scope,
                    closeByDocument: false,
                    closeByEscape: false
                });
            };

            $scope.openActionsPopup = function () {
                $scope.openingPopup = true;
                $scope.fetchActionsList();
            };

            $scope.clearAssignSection = function () {
                $scope.departmentSelect.selected = {};
                $scope.closeSelectedCalendar();
                $scope.closeNewCalendar();
            };

            /**
             * Update the selected action with the edited data
             * @param {Object} params holding the updated action details
             * @return {void}
             */
            var updateSelectedAction = function updateSelectedAction(params) {

                var onSuccess = function onSuccess() {
                    $scope.showLeftSideViewForMobile = true;
                    // switch back to selected
                    $scope.actionSelected = 'selected';
                    $scope.lastSelectedItemId = params.action_task.id;
                    $scope.refreshActionList();
                    $scope.clearAssignSection();
                };
                var onFailure = function onFailure(data) {
                    // show failed msg, so user can try again-?
                    if (data[0]) {
                        $scope.errorMessage = 'Internal Error Occured';
                    }
                    $scope.$parent.$emit('hideLoader');
                };

                $scope.callAPI(rvActionTasksSrv.updateNewAction, {
                    params: params,
                    successCallBack: onSuccess,
                    failureCallBack: onFailure
                });
            };

            $scope.departmentSelect = {};

            var initRefresh = function initRefresh(del) {
                var deleting = del === 'delete';

                $scope.isRefreshing = true;

                var removingLastAction = $scope.actions.totalCount - 1 <= 0;

                if (deleting && removingLastAction) {
                    $scope.refreshToEmpty = true;
                    $scope.actionSelected = 'none';
                    $scope.actions.totalCount = 0;
                    $scope.recountAfterDelete = true;
                } else {
                    // complete action (non-delete)
                    $scope.refreshing = true;
                    $scope.refreshToEmpty = false;
                    $scope.actionSelected = 'selected';
                }
            };

            $scope.completeAction = function (del, selected) {
                // mark the selected action as complete, notify the api
                var params = $scope.getBaseParams();

                params.action_task.id = $scope.selectedAction.id;
                params.is_complete = true;
                initRefresh(del);

                var onSuccess = function onSuccess() {
                    $scope.actions.totalCount--;
                    $scope.lastSelectedItemId = params.action_task.id;
                    $scope.refreshActionList(del, selected);

                    if ($scope.actions.totalCount - 1 <= 1 && del !== 'delete') {
                        $scope.actionSelected = 'selected';
                    }
                    $scope.isRefreshing = false;
                    $scope.refreshScroller('actionSummaryScroller');
                };
                var onFailure = function onFailure(data) {
                    $scope.errorMessage = data;
                    $scope.$parent.$emit('hideLoader');
                    $scope.isRefreshing = false;
                };

                $scope.callAPI(rvActionTasksSrv.completeAction, {
                    params: params,
                    successCallBack: onSuccess,
                    failureCallBack: onFailure
                });
            };

            $scope.getBaseParams = function () {
                return {
                    'reservation_id': $scope.$parent.reservationData.reservation_card.reservation_id,
                    'action_task': {}
                };
            };

            // Get the action status info
            $scope.getActionStatusInfo = function (action) {
                var status = action.action_status;

                if (status === 'delete') {
                    status = 'Delete Action?';
                } else if (action.over_due && status !== 'COMPLETED') {
                    status = 'OVERDUE';
                }

                return status;
            };

            // Checks whether edit/complete btn should be shown or not
            $scope.shouldShowEditAndCompleteBtns = function (action) {
                return ['UNASSIGNED', 'ASSIGNED'].indexOf(action.action_status) > -1;
            };

            // Checks whether the delete action btn should be shown or not
            $scope.shouldShowDeleteBtn = function (action) {
                return ['UNASSIGNED', 'ASSIGNED', 'COMPLETED'].indexOf(action.action_status) > -1;
            };

            // Prepare the edit action screen
            $scope.prepareEditAction = function (action) {
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
                    dueDateObj: action.time_due_str ? new tzIndependentDate(action.time_due_str.split('T')[0]) : '',
                    hasDate: true,
                    notes: action.description,
                    actionId: action.id
                };
            };

            // Get the params required for updating an action
            var getUpdateRequestParams = function getUpdateRequestParams() {
                var params = $scope.getBaseParams();

                params.action_task.id = $scope.newAction.actionId;

                if ($scope.newAction.department) {
                    params.assigned_to = $scope.newAction.department.value;
                } else {
                    params.assigned_to = '';
                }

                if ($scope.newAction.dueDateObj) {
                    var dateObj = $scope.newAction.dueDateObj;

                    params.due_at = $filter('date')(dateObj, $rootScope.dateFormatForAPI) + ($scope.newAction.time_due ? "T" + $scope.newAction.time_due + ":00" : "");
                }

                if ($scope.newAction.notes) {
                    params.action_task.description = $scope.newAction.notes;
                }

                return params;
            };

            // Handler for the update action
            $scope.handleActionUpdate = function () {
                var params = getUpdateRequestParams();

                updateSelectedAction(params);
            };

            // Cancel the action edit operation
            $scope.cancel = function () {
                $scope.showLeftSideViewForMobile = true;
                $scope.actionSelected = $scope.actions.totalCount ? 'selected' : 'none';
            };

            // Checks the permission to edit action
            $scope.hasPermissionToEditAction = function () {
                return rvPermissionSrv.getPermissionValue('EDIT_ACTION');
            };

            // Prepare delete Action
            $scope.prepareDeletAction = function () {
                $scope.selectedAction.originalStatus = $scope.selectedAction.action_status;
                $scope.selectedAction.action_status = 'delete';
            };

            // Delete action
            $scope.deleteAction = function () {
                var onSuccess = function onSuccess() {
                    $scope.fetchActionsList();
                    $scope.refreshScroller("rvActionListScroller");
                },
                    onFailure = function onFailure(data) {
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
            $scope.hasPermissionToDeleteAction = function () {
                return rvPermissionSrv.getPermissionValue('DELETE_ACTION');
            };

            // Cancel delete operation
            $scope.cancelDelete = function () {
                $scope.selectedAction.action_status = $scope.selectedAction.originalStatus;
                $scope.showLeftSideViewForMobile = true;
            };

            // Get action status based class name
            $scope.getActionStatusClass = function (action) {
                return action.action_status === 'delete' ? action.originalStatus : action.action_status;
            };

            $scope.addListener('UPDATE_COMPANY_NAME_IN_STAYCARD', function (event, data) {
                $scope.reservationData.reservation_card.company_card_name = data.name;
            });

            $scope.addListener('UPDATE_TA_NAME_IN_STAYCARD', function (event, data) {
                $scope.reservationData.reservation_card.travel_agent_card_name = data.name;
            });

            (function () {
                var scrollOptions = {
                    scrollbars: true,
                    preventDefault: false,
                    fadeScrollbars: true,
                    click: true
                };

                $scope.isStandAlone = $rootScope.isStandAlone;
                // Toggle for showing Left/Right content on Mobile view
                $scope.showLeftSideViewForMobile = true;

                if ($scope.$parent.reservationData.reservation_card.reservation_id) {
                    $scope.reservationId = $scope.$parent.reservationData.reservation_card.reservation_id;
                }
                $scope.populateTimeFieldValue();
                $scope.setScroller('rvActionListScroller', scrollOptions);
                $scope.setScroller('actionSummaryScroller', scrollOptions);
                $scope.setScroller("reservation-card-actions-scroller", scrollOptions);
                $scope.setUpData();

                if (!$scope.isStandAlone) {
                    $scope.syncActions($scope.reservationId);
                }

                setInitialActionsCount();
                $timeout(function () {
                    $scope.refreshScroller('reservation-card-actions-scroller');
                }, 500);
            })();
        }]);
    }, {}] }, {}, [1]);