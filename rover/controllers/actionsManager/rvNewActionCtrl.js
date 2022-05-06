'use strict';

sntRover.controller('RVNewActionCtrl', ['$scope', '$rootScope', 'rvUtilSrv', 'dateFilter', 'rvActionTasksSrv', function ($scope, $rootScope, rvUtilSrv, dateFilter, rvActionTasksSrv) {
    BaseCtrl.call(this, $scope);
    var init = function init() {

        $scope.__maxLengthOfNotes = 255;

        if ($scope.selectedView === 'edit') {
            var splitDueTimeString = $scope.selectedAction.due_at_str.split("T"),
                dueAtTime = dateFilter(splitDueTimeString[0] + "T" + splitDueTimeString[1].split(/[+-]/)[0], "HH:mm"),
                assignedTo = $scope.selectedAction.assigned_to && $scope.selectedAction.assigned_to.id,
                department = '';

            if (assignedTo) {
                department = _.findWhere($scope.departments, { value: assignedTo + "" });
            }

            _.extend($scope.selectedAction, {
                dueTime: dueAtTime,
                note: $scope.selectedAction.description,
                department: department
            });
        } else {
            $scope.newAction = {
                reservation: null,
                group: null,
                dueDate: $rootScope.businessDate,
                dueTime: "00:00",
                note: "",
                department: ""
            };
        }

        $scope.dueDateOptions = {
            minDate: tzIndependentDate($rootScope.businessDate),
            dateFormat: $rootScope.jqDateFormat,
            numberOfMonths: 1,
            onSelect: function onSelect(date, datePickerObj) {
                if ($scope.selectedView === 'edit') {
                    $scope.selectedAction.dueDate = new tzIndependentDate(rvUtilSrv.get_date_from_date_picker(datePickerObj));
                } else {
                    $scope.newAction.dueDate = new tzIndependentDate(rvUtilSrv.get_date_from_date_picker(datePickerObj));
                }
            },
            beforeShow: function beforeShow() {
                angular.element("#ui-datepicker-div").after(angular.element('<div></div>', {
                    id: "ui-datepicker-overlay",
                    class: $scope.ngDialogId ? "transparent" : "" // If a dialog is already open then make overlay transparent
                }));
            },
            onClose: function onClose() {
                angular.element("#ui-datepicker-overlay").remove();
            }
        };

        $scope.callAPI(rvActionTasksSrv.fetchCurrentTime, {
            successCallBack: function successCallBack(response) {
                $scope.newAction.dueTime = response;
            }
        });
    };

    $scope.saveNewAction = function () {
        var ref = $scope.newAction,
            payLoad = {
            description: ref.note,
            assigned_to: ref.department ? parseInt(ref.department, 10) : "",
            due_at: dateFilter(ref.dueDate, $rootScope.dateFormatForAPI) + "T" + ref.dueTime + ":00"
        };

        if (!!ref.reservation && !!ref.reservation.id) {
            payLoad.reservation_id = ref.reservation.id;
        } else if (!!ref.group && !!ref.group.id) {
            payLoad.group_id = ref.group.id;
        }

        $scope.callAPI(rvActionTasksSrv.postNewAction, {
            params: payLoad,
            successCallBack: function successCallBack() {
                $scope.$emit("NEW_ACTION_POSTED");
            }
        });
    };

    /**
     * http://stackoverflow.com/questions/10030921/chrome-counts-characters-wrong-in-textarea-with-maxlength-attribute
     * This method mitigates the discrepancy in the character count calculation by
     * A. The browser for text area max-length
     * B. String length JavaScript
     */
    $scope.adjustedLength = function (str) {
        return str.replace(/\r(?!\n)|\n(?!\r)/g, "\r\n").length;
    };

    var listenerInit = $scope.$on("INIT_NEW_ACTION", function () {
        init();
    });

    var listenerReservationSelect = $scope.$on("RESERVATION_SELECTED", function (e, selectedReservation) {
        // CICO-27905
        var businessDate = new tzIndependentDate($rootScope.businessDate),
            arrivalDate = new tzIndependentDate(selectedReservation.arrival_date);

        $scope.newAction.dueDate = businessDate > arrivalDate ? businessDate : arrivalDate;
    });

    var listenerGroupSelect = $scope.$on("GROUP_SELECTED", function (e, selectedGroup) {

        var businessDate = new tzIndependentDate($rootScope.businessDate),
            arrivalDate = new tzIndependentDate(selectedGroup.arrival_date);

        $scope.newAction.dueDate = businessDate > arrivalDate ? businessDate : arrivalDate;
    });

    init();

    $scope.$on('$destroy', listenerInit);
    $scope.$on('$destroy', listenerReservationSelect);
    $scope.$on('$destroy', listenerGroupSelect);
}]);