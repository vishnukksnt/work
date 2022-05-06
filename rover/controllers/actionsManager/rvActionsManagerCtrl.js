'use strict';

sntRover.controller('RVActionsManagerController', ['$scope', '$rootScope', 'ngDialog', 'rvActionTasksSrv', 'departments', 'dateFilter', 'rvUtilSrv', '$state', 'RVreportsSubSrv', '$window', '$timeout', '$filter', 'rvPermissionSrv', function ($scope, $rootScope, ngDialog, rvActionTasksSrv, departments, dateFilter, rvUtilSrv, $state, reportsSubSrv, $window, $timeout, $filter, rvPermissionSrv) {
    BaseCtrl.call(this, $scope);

    // -------------------------------------------------------------------------------------------------------------- B. Local Methods
    var init = function init() {
        $scope.$emit("updateRoverLeftMenu", "actionManager");
        // Toggle for showing Left/Right content on Mobile view
        $scope.showLeftSideViewForMobile = true;
        var heading = 'Actions Manager';

        $scope.setScroller("rvActionListScroller", {
            scrollbars: true,
            preventDefault: false,
            fadeScrollbars: true
        });

        $scope.setScroller("create-action-scroller", {
            scrollbars: true,
            preventDefault: false,
            fadeScrollbars: true
        });

        $scope.setScroller("actionSummaryScroller", {
            scrollbars: true,
            preventDefault: false,
            fadeScrollbars: true
        });

        $scope.departments = departments.data.departments;
        if (!!$state.params.restore && !!rvActionTasksSrv.getFilterState()) {
            $scope.filterOptions = rvActionTasksSrv.getFilterState();
        }
        setHeadingAndTitle(heading);

        reportsSubSrv.getReservationStatus().then(processReservationStatus);

        reportsSubSrv.fetchHoldStatus().then(processHoldStatus);

        fetchActionsList();
    },
        setHeadingAndTitle = function setHeadingAndTitle(heading) {
        $scope.heading = heading;
        $scope.setTitle(heading);
    },
        refreshScroller = function refreshScroller() {
        $scope.refreshScroller('rvActionListScroller');
    },
        getBindabaleAction = function getBindabaleAction(response) {
        var action = angular.copy(response);

        action.department = action.assigned_to && action.assigned_to.id || "";
        var splitDueTimeString = action.due_at_str.split("T");

        action.dueDate = dateFilter(splitDueTimeString[0], $rootScope.dateFormatForAPI);
        action.dueTime = dateFilter(splitDueTimeString[0] + "T" + splitDueTimeString[1].split(/[+-]/)[0], "HH:mm");
        action.dueTimeAmPm = dateFilter(splitDueTimeString[0] + "T" + splitDueTimeString[1].split(/[+-]/)[0], "hh:mm a");
        return action;
    },
        getActionDetails = function getActionDetails() {
        if (!!$scope.filterOptions.selectedActionId) {
            $scope.callAPI(rvActionTasksSrv.getActionDetails, {
                params: $scope.filterOptions.selectedActionId,
                successCallBack: function successCallBack(response) {
                    $scope.selectedAction = getBindabaleAction(response.data);
                    $scope.selectedView = "list";
                    refreshActionSummaryScroller();
                }
            });
        }
    },
        fetchActionsList = function fetchActionsList() {
        var payLoad = {
            date: dateFilter($scope.filterOptions.selectedDay, $rootScope.dateFormatForAPI),
            per_page: $scope.filterOptions.perPage,
            page: $scope.filterOptions.page
        },
            onFetchListSuccess = function onFetchListSuccess(response) {
            // catch empty pages
            if (response.results.length === 0 && response.total_count !== 0 && $scope.filterOptions.page !== 1) {
                $scope.filterOptions.page = 1;
                fetchActionsList();
            }

            // Pagination
            $scope.filterOptions.totalCount = response.total_count;
            $scope.filterOptions.startRecord = ($scope.filterOptions.page - 1) * $scope.filterOptions.perPage + 1;
            if (response.results.length === $scope.filterOptions.perPage) {
                $scope.filterOptions.endRecord = $scope.filterOptions.page * $scope.filterOptions.perPage;
            } else {
                $scope.filterOptions.endRecord = $scope.filterOptions.startRecord + response.results.length - 1;
            }
            $scope.filterOptions.isLastPage = $scope.filterOptions.endRecord === $scope.filterOptions.totalCount;

            // Parsing
            $scope.actions = [];

            _.each(response.results, function (action) {
                $scope.actions.push(_.extend(action, {
                    assigned: !!action.department_id,
                    isCompleted: action.action_status === $scope._actionCompleted,
                    iconClass: action.action_status ? "icon-" + action.action_status.toLowerCase() : "",
                    departmentName: !!action.department_id ? _.find($scope.departments, {
                        value: action.department_id.toString()
                    }).name : ""
                }));
            });

            if (!$scope.actions.length) {
                $scope.selectedView = 'new';
            }

            if ($scope.actions.length > 0) {
                // By default the first action is selected
                // While coming back from staycard, the previously selected action is selected
                var selectedAction = _.findWhere($scope.actions, {
                    id: $scope.filterOptions.selectedActionId
                });

                if (!selectedAction) {
                    $scope.filterOptions.selectedActionId = $scope.actions[0].id;
                }
                getActionDetails();
            } else {
                $scope.$broadcast("INIT_NEW_ACTION");
            }
            refreshScroller();
            $scope.showLeftSideViewForMobile = true;
        };

        if (!!$scope.filterOptions.department) {
            payLoad.department_id = $scope.filterOptions.department.value;
        }

        if ($scope.filterOptions.selectedStatus !== "ALL") {
            payLoad.action_status = $scope.filterOptions.selectedStatus;
        }

        if ($scope.filterOptions.holdStatus !== "ALL") {
            payLoad['hold_status_ids[]'] = $scope.filterOptions.holdStatus;
        }

        if ($scope.filterOptions.reservationStatus !== "ALL") {
            payLoad['reservation_status[]'] = $scope.filterOptions.reservationStatus;
        }

        if (!!$scope.filterOptions.query) {
            payLoad.query = $scope.filterOptions.query;
        }
        if ($scope.filterOptions.selectedView == "GUEST") {
            $scope.callAPI(rvActionTasksSrv.fetchActions, {
                params: payLoad,
                successCallBack: onFetchListSuccess
            });
        } else if ($scope.filterOptions.selectedView == "GROUP") {
            $scope.callAPI(rvActionTasksSrv.fetchGroupActions, {
                params: payLoad,
                successCallBack: onFetchListSuccess
            });
        }
    },
        updateListEntry = function updateListEntry() {
        var currentAction = _.find($scope.actions, function (action) {
            return action.id === $scope.filterOptions.selectedActionId;
        }),
            departmentId = $scope.selectedAction.assigned_to && $scope.selectedAction.assigned_to.id;

        _.extend(currentAction, {
            action_status: $scope.selectedAction.action_status,
            iconClass: $scope.selectedAction.action_status ? "icon-" + $scope.selectedAction.action_status.toLowerCase() : "",
            department_id: departmentId,
            assigned: !!departmentId,
            departmentName: !!departmentId ? _.find($scope.departments, {
                value: departmentId.toString()
            }).name : "",
            isCompleted: !!$scope.selectedAction.completed_at,
            description: $scope.selectedAction.description
        });
    },
        addDatePickerOverlay = function addDatePickerOverlay() {
        angular.element("#ui-datepicker-div").after(angular.element('<div></div>', {
            id: "ui-datepicker-overlay"
        }));
    },
        removeDatePickerOverlay = function removeDatePickerOverlay() {
        angular.element("#ui-datepicker-overlay").remove();
    },
        datePickerConfig = {
        dateFormat: $rootScope.jqDateFormat,
        numberOfMonths: 1,
        beforeShow: addDatePickerOverlay,
        onClose: removeDatePickerOverlay
    },
        refreshCreateActionScroller = function refreshCreateActionScroller() {
        $scope.refreshScroller('create-action-scroller');
    },
        refreshActionSummaryScroller = function refreshActionSummaryScroller() {
        $scope.refreshScroller('actionSummaryScroller');
    };

    // -------------------------------------------------------------------------------------------------------------- B. Scope Variables

    $scope._actionCompleted = "COMPLETED";

    $scope.timeSelectorList = rvUtilSrv.getListForTimeSelector(15, 12);

    $scope.showResMultiSelect = true;

    $scope.showHoldMultiSelect = true;

    $scope.filterOptions = {
        showFilters: false,
        selectedDay: $rootScope.businessDate,
        selectedView: "GUEST",
        department: "",
        selectedStatus: "ALL", // other values "ASSIGNED", "UNASSIGNED", "COMPLETED",
        holdStatus: "ALL",
        holdStatusName: "",
        reservationStatus: "ALL",
        query: "",
        page: 1,
        perPage: 25,
        totalCount: 0,
        startRecord: 1,
        endRecord: null,
        isLastPage: false,
        selectedActionId: null
    };

    $scope.selectedAction = {
        dueTime: "00:00"
    };

    $scope.selectDateOptions = _.extend(angular.copy(datePickerConfig), {
        defaultDate: tzIndependentDate($rootScope.businessDate),
        onSelect: fetchActionsList

    });

    $scope.dueDateEditOptions = _.extend(angular.copy(datePickerConfig), {
        minDate: tzIndependentDate($rootScope.businessDate),
        onSelect: function onSelect(date, datePickerObj) {
            $scope.selectedAction.dueDate = new tzIndependentDate(rvUtilSrv.get_date_from_date_picker(datePickerObj));
            $scope.updateAction();
        }
    });

    // -------------------------------------------------------------------------------------------------------------- C.Scope Methods

    $scope.actionsFilterDateOptions = {
        firstDay: 1,
        changeYear: true,
        changeMonth: true,
        dateFormat: $rootScope.jqDateFormat,
        yearRange: "0:+10",
        onSelect: function onSelect(date, dateObj) {
            $scope.closeDateFilter();
            fetchActionsList();
        }
    };

    $scope.queryActions = function (isReset) {
        // isReset will be received as true from the template if user attempts to clears the query
        if (isReset) {
            $scope.filterOptions.query = "";
        }
        fetchActionsList();
    };

    $scope.initNewAction = function () {
        $scope.selectedView = "new";
        $scope.showLeftSideViewForMobile = false;
        refreshCreateActionScroller();
    };

    $scope.onSelectAction = function (actionId) {
        $scope.filterOptions.selectedActionId = actionId;
        $scope.showLeftSideViewForMobile = false;
        getActionDetails();
    };

    $scope.onGoBack = function () {
        $scope.showLeftSideViewForMobile = true;
    };

    $scope.setActiveFilter = function (selectedFilter) {
        $scope.filterOptions.selectedStatus = selectedFilter;
        fetchActionsList();
    };

    $scope.setReservationStatusFilter = function (reservationStatus) {
        $scope.filterOptions.reservationStatus = reservationStatus;
        fetchActionsList();
    };

    $scope.setHoldStatusFilter = function (holdStatus) {
        $scope.filterOptions.holdStatus = holdStatus;
        fetchActionsList();
    };

    $scope.toggleExtraFilters = function () {
        $scope.filterOptions.showFilters = !$scope.filterOptions.showFilters;
    };

    $scope.switchTab = function (selectedTab) {
        $scope.filterOptions.selectedView = selectedTab;
        fetchActionsList();
    };

    $scope.onDepartmentSelectionChange = function () {
        fetchActionsList();
    };

    var processReservationStatus = function processReservationStatus(data) {
        $scope.reservationStatus = angular.copy(data);

        $scope.reservationStatus.push({ id: null, value: "DUE_IN", description: "Due In" }, { id: null, value: "DUE_OUT", description: "Due Out" });

        if ($scope.reservationStatus.length > 0) {
            angular.forEach($scope.reservationStatus, function (reservationStatus) {
                if ($scope.filterOptions.reservationStatus && ($scope.filterOptions.reservationStatus === 'ALL' || $scope.filterOptions.reservationStatus.indexOf(reservationStatus.value) > -1)) {
                    reservationStatus.isSelected = true;
                }
            });
        }

        var selectedReservationStatuses = _.filter($scope.reservationStatus, function (status) {
            return status.isSelected === true;
        });

        $scope.isAllResSelected = selectedReservationStatuses && $scope.reservationStatus.length === selectedReservationStatuses.length;
        if ($scope.isAllResSelected) {
            $scope.reservationStatusCount = 'All';
        } else {
            $scope.reservationStatusCount = selectedReservationStatuses.length || 0;
        }
    };

    var processHoldStatus = function processHoldStatus(data) {
        $scope.holdStatus = angular.copy(data);
        if ($scope.holdStatus.length > 0) {
            angular.forEach($scope.holdStatus, function (holdStatus) {
                if ($scope.filterOptions.holdStatus && ($scope.filterOptions.holdStatus === 'ALL' || $scope.filterOptions.holdStatus.indexOf(holdStatus.id) > -1)) {
                    holdStatus.isSelected = true;
                }
            });
        }
        var selectedHoldStatuses = _.filter($scope.holdStatus, function (status) {
            return status.isSelected === true;
        });

        $scope.isAllHoldStatusSelected = selectedHoldStatuses && $scope.holdStatus.length === selectedHoldStatuses.length;
        if ($scope.isAllHoldStatusSelected) {
            $scope.holdStatusCount = 'All';
        } else {
            $scope.holdStatusCount = selectedHoldStatuses.length || 0;
        }
    };

    $scope.changeAssignment = function () {
        ngDialog.open({
            template: '/assets/partials/actionsManager/rvActionAssignmentPopup.html',
            scope: $scope,
            closeByDocument: true,
            closeByEscape: true
        });
    };

    $scope.updateAction = function () {
        var payLoad = {
            action_task: {
                id: $scope.selectedAction.id,
                description: $scope.selectedAction.note
            },
            due_at: dateFilter($scope.selectedAction.dueDate, $rootScope.dateFormatForAPI) + ($scope.selectedAction.dueTime ? "T" + $scope.selectedAction.dueTime + ":00" : "")
        };

        if ($scope.selectedAction.department) {
            payLoad.assigned_to = $scope.selectedAction.department.value;
        } else {
            payLoad.assigned_to = '';
        }

        if (!!$scope.selectedAction.reservation_id) {
            payLoad.reservation_id = $scope.selectedAction.reservation_id;
        } else if (!!$scope.selectedAction.group_id) {
            payLoad.group_id = $scope.selectedAction.group_id;
        }

        if ($scope.selectedAction.action_status === $scope._actionCompleted) {
            payLoad.is_complete = true;
        }
        $scope.callAPI(rvActionTasksSrv.updateNewAction, {
            params: payLoad,
            successCallBack: function successCallBack(response) {
                $scope.selectedAction = getBindabaleAction(response.data);
                $scope.selectedView = 'list';
                updateListEntry();
                $scope.showLeftSideViewForMobile = true;
            }
        });
        ngDialog.close();
    };

    $scope.completeAction = function () {
        $scope.selectedAction.action_status = $scope._actionCompleted;
        $scope.updateAction();
    };

    $scope.toStayCard = function () {
        // Store the state of the filters so that while coming back from staycard the correct page can be loaded
        rvActionTasksSrv.setFilterState($scope.filterOptions);
        $state.go('rover.reservation.staycard.reservationcard.reservationdetails', {
            "id": $scope.selectedAction.reservation_id,
            "confirmationId": $scope.selectedAction.reservation_confirm_no,
            "isrefresh": false
        });
    };

    $scope.toGroup = function () {
        // Store the state of the filters so that while coming back from staycard the correct page can be loaded
        rvActionTasksSrv.setFilterState($scope.filterOptions);
        $state.go('rover.groups.config', {
            "id": $scope.selectedAction.group_id,
            "isrefresh": false
        });
    };

    $scope.loadPrevPage = function () {
        $scope.filterOptions.page--;
        fetchActionsList();
    };

    $scope.loadNextPage = function () {
        $scope.filterOptions.page++;
        fetchActionsList();
    };

    // -------------------------------------------------------------------------------------------------------------- D. Listeners

    var listenerClosePopup = $scope.$on("CLOSE_POPUP", function () {
        ngDialog.close();
    });

    var listenerNewActionPosted = $scope.$on("NEW_ACTION_POSTED", function () {
        ngDialog.close();
        $scope.selectedView = "list";
        fetchActionsList();
    });

    // -------------------------------------------------------------------------------------------------------------- E. Cleanup

    $scope.$on('$destroy', listenerClosePopup);
    $scope.$on('$destroy', listenerNewActionPosted);

    // add the print orientation before printing
    var addPrintOrientation = function addPrintOrientation() {
        $('head').append("<style id='print-orientation'>@page { size: portrait; }</style>");
    };

    // add the print orientation after printing
    var removePrintOrientation = function removePrintOrientation() {
        $('#print-orientation').remove();
    };

    // Get the parameters required for the report
    var getReportParams = function getReportParams() {
        var params = {};

        // report id for Action manager report
        params.id = 61;
        params.from_date = $filter('date')($scope.filterOptions.selectedDay, 'yyyy/MM/dd');
        params.to_date = params.from_date;
        params.assigned_departments = [];
        params.reservation_status = [];
        params.hold_status_ids = [];

        if ($scope.filterOptions.department) {
            params.assigned_departments.push($scope.filterOptions.department.value);
        } else {
            _.each($scope.departments, function (department) {
                params.assigned_departments.push(department.value);
            });
        }

        if ($scope.filterOptions.selectedStatus === "ALL") {
            params.status = ["UNASSIGNED", "ASSIGNED", "COMPLETED"];
        } else {
            params.status = [$scope.filterOptions.selectedStatus];
        }

        if ($scope.filterOptions.reservationStatus === "ALL") {
            _.each($scope.reservationStatus, function (reservationStatus) {
                params.reservation_status.push(reservationStatus.value);
            });
        } else {
            params.reservation_status = $scope.filterOptions.reservationStatus;
        }

        if ($scope.filterOptions.holdStatus == "ALL") {
            _.each($scope.holdStatus, function (holdStatus) {
                params.hold_status_ids.push(holdStatus.id);
            });
        } else {
            params.hold_status_ids = $scope.filterOptions.holdStatus;
        }

        params.actions_by = [$scope.filterOptions.selectedView];
        params.per_page = 1000;
        params.page = 1;

        return params;
    };

    // Set the filters that are applied to the report
    var setAppliedFilter = function setAppliedFilter() {
        $scope.appliedFilter = {};

        $scope.appliedFilter.date = dateFilter($scope.filterOptions.selectedDay, $rootScope.dateFormatForAPI);
        if ($scope.filterOptions.selectedStatus === 'ALL') {
            $scope.appliedFilter.completion_status = ['ALL STATUS'];
        } else {
            $scope.appliedFilter.completion_status = [$scope.filterOptions.selectedStatus];
        }

        if ($scope.filterOptions.department) {
            $scope.appliedFilter.assigned_departments = [$scope.filterOptions.department.name];
        } else {
            $scope.appliedFilter.assigned_departments = ['ALL DEPARTMENTS'];
        }

        if ($scope.filterOptions.selectedView === 'GUEST') {
            if ($scope.filterOptions.reservationStatus === 'ALL' || $scope.filterOptions.reservationStatus === null) {
                $scope.appliedFilter.reservationStatus = ['ALL STATUS'];
            } else {
                $scope.appliedFilter.reservationStatus = [$scope.filterOptions.reservationStatus];
            }
        }

        if ($scope.filterOptions.selectedView === 'GROUP') {
            if ($scope.filterOptions.holdStatus === 'ALL' || $scope.filterOptions.holdStatus === null) {
                $scope.appliedFilter.holdStatuses = ['ALL STATUS'];
            } else {
                $scope.appliedFilter.holdStatuses = [$scope.filterOptions.holdStatusName];
            }
        }

        if ($scope.filterOptions.selectedView === 'GUEST') {
            if ($scope.filterOptions.reservationStatus === 'ALL' || $scope.filterOptions.reservationStatus === null) {
                $scope.appliedFilter.reservationStatus = ['ALL STATUS'];
            } else {
                $scope.appliedFilter.reservationStatus = [$scope.filterOptions.reservationStatus];
            }
        }

        if ($scope.filterOptions.selectedView === 'GROUP') {
            if ($scope.filterOptions.holdStatus === 'ALL' || $scope.filterOptions.holdStatus === null) {
                $scope.appliedFilter.holdStatuses = ['ALL STATUS'];
            } else {
                $scope.appliedFilter.holdStatuses = [$scope.filterOptions.holdStatusName];
            }
        }

        $scope.appliedFilter.show = [$scope.filterOptions.selectedView];

        $scope.leftColSpan = 2;
        $scope.rightColSpan = 4;
    };

    // Print the action manager report from the action manager screen
    $scope.printActionManager = function () {

        var sucessCallback = function sucessCallback(data) {

            $scope.$emit('hideLoader');
            $scope.printActionManagerData = data;
            $scope.errorMessage = "";

            // add the orientation
            addPrintOrientation();

            var onPrintCompletion = function onPrintCompletion() {
                $timeout(function () {
                    // CICO-9569 to solve the hotel logo issue
                    $("header .logo").removeClass('logo-hide');
                    $("header .h2").addClass('text-hide');
                    // remove the orientation after similar delay
                    removePrintOrientation();
                }, 200);
                $("body #loading").html('<div id="loading-spinner" ></div>');
            };
            $("body #loading").html("");
            /*
            *   ======[ READY TO PRINT ]======
            */
            // this will show the popup with full bill
            $timeout(function () {

                /*
                *   ======[ PRINTING!! JS EXECUTION IS PAUSED ]======
                */
                if (sntapp.cordovaLoaded) {
                    cordova.exec(onPrintCompletion, function () {
                        onPrintCompletion();
                    }, 'RVCardPlugin', 'printWebView', []);
                } else {
                    $window.print();
                    onPrintCompletion();
                }
            }, 200);
        };

        var failureCallback = function failureCallback(errorData) {
            $scope.$emit('hideLoader');
            $scope.errorMessage = errorData;
        };

        var apiConfig = {
            params: getReportParams(),
            onSuccess: sucessCallback,
            onFailure: failureCallback
        };

        setAppliedFilter();

        $scope.callAPI(rvActionTasksSrv.fetchReportDetails, apiConfig);
    };

    // Checks whether edit/complete btn should be shown or not
    $scope.shouldShowEditAndCompleteBtn = function (action) {
        return ["UNASSIGNED", 'ASSIGNED'].indexOf(action.action_status) > -1;
    };

    // Checks whether delete button should be shown or not
    $scope.shouldShowDeleteBtn = function (action) {
        return ["UNASSIGNED", 'ASSIGNED', 'COMPLETED'].indexOf(action.action_status) > -1;
    };

    // Prepare the view for editing action
    $scope.prepareEditAction = function () {
        $scope.selectedView = 'edit';
    };

    // Cancel the edit operation
    $scope.cancelEdit = function () {
        $scope.selectedView = 'list';
        $scope.showLeftSideViewForMobile = true;
    };

    // Checks the permission to edit action
    $scope.hasPermissionToEditAction = function () {
        return rvPermissionSrv.getPermissionValue('EDIT_ACTION');
    };

    // Checks the permission to edit action
    $scope.hasPermissionToDeleteAction = function () {
        return rvPermissionSrv.getPermissionValue('DELETE_ACTION');
    };

    // Prepare delete Action
    $scope.prepareDeletAction = function () {
        $scope.selectedAction.originalStatus = $scope.selectedAction.action_status;
        $scope.selectedAction.action_status = 'delete';
    };

    // Delete action
    $scope.deleteAction = function () {

        var onSuccess = function onSuccess() {
            fetchActionsList();
        },
            onFailure = function onFailure(data) {
            // show failed msg, so user can try again-?
            if (data[0]) {
                $scope.errorMessage = 'Internal Error Occured';
            }
            $scope.showLeftSideViewForMobile = true;
        };
        var apiConfig = {
            params: $scope.selectedAction.id,
            onSuccess: onSuccess,
            onFailure: onFailure
        };

        $scope.errorMessage = [];

        $scope.callAPI(rvActionTasksSrv.deleteActionTask, apiConfig);
    };

    // Cancel delete operation
    $scope.cancelDelete = function () {
        $scope.selectedAction.action_status = $scope.selectedAction.originalStatus;
        $scope.showLeftSideViewForMobile = true;
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

    var guestStatusMap = {
        RESERVED: "arrival",
        CHECKING_IN: "check-in",
        CHECKEDIN: "inhouse",
        CHECKEDOUT: "departed",
        CHECKING_OUT: "check-out",
        CANCELED: "cancel",
        NOSHOW: "no-show",
        NOSHOW_CURRENT: "no-show"
    };

    $scope.getGuestStatusMapped = function (reservationStatus) {
        return guestStatusMap[reservationStatus];
    };

    $scope.isResMultiSelectClicked = function () {
        $scope.showResMultiSelect = !$scope.showResMultiSelect;
    };

    $scope.isHoldStatusMultiSelectClicked = function () {
        $scope.showHoldMultiSelect = !$scope.showHoldMultiSelect;
    };

    /**
     * Toggle the select all reservation status
     */
    $scope.toggleReservationSelectAll = function () {
        angular.forEach($scope.reservationStatus, function (reservationStatus) {
            if ($scope.isAllResSelected) {
                reservationStatus.isSelected = false;
                $scope.reservationStatusCount = 0;
                $scope.filterOptions.reservationStatus = null;
            } else {
                reservationStatus.isSelected = true;
                $scope.reservationStatusCount = 'All';
                $scope.filterOptions.reservationStatus = 'ALL';
            }
        });
        $scope.isAllResSelected = !$scope.isAllResSelected;
        $scope.setReservationStatusFilter($scope.filterOptions.reservationStatus);
    };

    /**
     * Toggle the select all hold status
     */
    $scope.toggleHoldStatusSelectAll = function () {
        angular.forEach($scope.holdStatus, function (holdStatus) {
            if ($scope.isAllHoldStatusSelected) {
                holdStatus.isSelected = false;
                $scope.holdStatusCount = 0;
                $scope.filterOptions.holdStatus = null;
            } else {
                holdStatus.isSelected = true;
                $scope.holdStatusCount = 'All';
                $scope.filterOptions.holdStatus = 'ALL';
            }
        });
        $scope.isAllHoldStatusSelected = !$scope.isAllHoldStatusSelected;
        $scope.setHoldStatusFilter($scope.filterOptions.holdStatus);
    };

    $scope.toggleResStatus = function (reservationStatus) {
        var selectedItems = [],
            filterReservationStatus = [];

        reservationStatus.isSelected = !reservationStatus.isSelected;
        selectedItems = _.where($scope.reservationStatus, { 'isSelected': true });
        if (selectedItems && selectedItems.length !== $scope.reservationStatus.length) {
            $scope.isAllResSelected = false;
            $scope.reservationStatusCount = selectedItems.length;
        } else {
            $scope.isAllResSelected = true;
            $scope.reservationStatusCount = 'All';
        }

        _.each(selectedItems, function (status) {
            filterReservationStatus.push(status.value);
        });
        $scope.filterOptions.reservationStatus = filterReservationStatus.length !== 0 ? filterReservationStatus : null;
        $scope.setReservationStatusFilter($scope.filterOptions.reservationStatus);
    };

    $scope.toggleHoldStatus = function (holdStatus) {
        var selectedItems = [],
            filterHoldStatus = [],
            filterHoldStatusName = [];

        holdStatus.isSelected = !holdStatus.isSelected;
        selectedItems = _.where($scope.holdStatus, { 'isSelected': true });
        if (selectedItems && selectedItems.length !== $scope.holdStatus.length) {
            $scope.isAllHoldStatusSelected = false;
            $scope.holdStatusCount = selectedItems.length;
        } else {
            $scope.isAllHoldStatusSelected = true;
            $scope.holdStatusCount = 'All';
        }

        _.each(selectedItems, function (status) {
            filterHoldStatus.push(status.id);
            filterHoldStatusName.push(status.name);
        });
        $scope.filterOptions.holdStatus = filterHoldStatus.length !== 0 ? filterHoldStatus : null;
        $scope.filterOptions.holdStatusName = filterHoldStatusName;
        $scope.setHoldStatusFilter($scope.filterOptions.holdStatus);
    };

    init();
}]);