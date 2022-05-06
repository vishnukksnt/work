angular.module('sntRover').controller('RVWorkManagementStartCtrl', ['$rootScope', '$scope', 'ngDialog', '$state', 'RVWorkManagementSrv', '$timeout', '$filter',
    function($rootScope, $scope, ngDialog, $state, RVWorkManagementSrv, $timeout, $filter) {
        $scope.setHeading($filter('translate')('WORK_MANAGEMENT'));
        BaseCtrl.call(this, $scope);

        var scrollerOptions = {click: true, scrollbars: true};

        $scope.setScroller('work_management', scrollerOptions);

        $scope.refreshScroller = function (key) {
            setTimeout(function() {
                if ( !!$scope && $scope.myScroll ) {
                    if ( key in $scope.myScroll ) {
                        $scope.myScroll[key].refresh();
                    }
                }
            }, 100);
        };

        $scope.showCreateWorkSheetDialog = function() {
            ngDialog.open({
                template: '/assets/partials/workManagement/popups/rvWorkManagementCreatePopup.html',
                className: 'ngdialog-theme-default',
                closeByDocument: true,
                scope: $scope
            });
        };

        var setStats = function() {
            var onFetchSuccess = function(wmStatistics) {
                    $scope.$emit('hideLoader');
                    $scope.workStats = wmStatistics;
                    $scope.refreshScroller('work_management');

                    _.each($scope.workStats.work_types, function(type) {
                        if ( type.total_rooms_completed < type.total_rooms_assigned ) {
                            type.css_class = 'red';
                        } else {
                            type.css_class = 'green';
                        }

                        _.each(type.tasks, function(task) {
                            if ( task.total_rooms_completed < task.total_rooms_assigned ) {
                                task.css_class = 'red';
                            } else {
                                task.css_class = 'green';
                            }
                        });
                    });

                },
                onFetchFailure = function(errorMessage) {
                    $scope.errorMessage = "";
                    $scope.errorMessage = errorMessage;
                    $scope.$emit('hideLoader');
                };

            $scope.invokeApi(RVWorkManagementSrv.fetchStatistics, $scope.stateVariables.viewingDate, onFetchSuccess, onFetchFailure);
        };

        $scope.stateVariables = {
            searching: false,
            searchQuery: "",
            lastSearchQuery: "",
            employeeSearch: false, // Search can be either for rooms or an employee
            noSearchResults: false,
            viewingDate: {
                date: $rootScope.businessDate,
                work_type_id: $scope.workTypes[0].id // Default to daily cleaning [Assuming it comes in as first entry]
            },
            searchResults: {
                maids: [],
                rooms: []
            },
            newSheet: {
                user_id: "",
                work_type_id: $scope.workTypes[0].id, // Default to daily cleaning [Assuming it comes in as first entry]
                date: $rootScope.businessDate
            },
            assignRoom: {
                user_id: "",
                work_type_id: $scope.workTypes[0].id, // Default to daily cleaning [Assuming it comes in as first entry],
                rooms: []
            }
        };


        $scope.closeDialog = function() {
            $scope.errorMessage = "";
            ngDialog.close();
        };

        $scope.continueCreateWorkSheet = function() {
            var onCreateSuccess = function(data) {
                    $scope.$emit('hideLoader');
                    $state.go('rover.workManagement.singleSheet', {
                        id: data.id,
                        date: data.date,
                        from: "START"
                    });
                    $scope.closeDialog();
                },
                onCreateFailure = function(errorMessage) {
                    $scope.errorMessage = "";
                    $scope.errorMessage = errorMessage;
                    $scope.$emit('hideLoader');
                };

            $scope.invokeApi(RVWorkManagementSrv.createWorkSheet, $scope.stateVariables.newSheet, onCreateSuccess, onCreateFailure);
        };

        $scope.showWorkSheet = function(id) {
            if (id) {
                $state.go('rover.workManagement.singleSheet', {
                    date: $scope.stateVariables.viewingDate.date,
                    id: id,
                    from: "START"
                });
            }
        };

        $scope.onRoomSelect = function(room) {
            $scope.stateVariables.assignRoom.rooms = [room.id];
            if (room.work_sheet_id) {
                $state.go('rover.workManagement.singleSheet', {
                    date: $scope.stateVariables.viewingDate.date,
                    id: room.work_sheet_id,
                    from: "START"
                });
            } else { // Assign the room to an employee
                $scope.stateVariables.assignRoom.work_type_id = room.work_type_ids[0];
                ngDialog.open({
                    template: '/assets/partials/workManagement/popups/rvWorkManagementAssignRoom.html',
                    className: 'ngdialog-theme-default',
                    closeByDocument: true,
                    scope: $scope,
                    data: JSON.stringify({
                        workTypes: _.filter($scope.workTypes, function(wT) {
                            return room.work_type_ids.indexOf(wT.id) > -1;
                        })
                    })
                });
            }
        };

        $scope.assignRoom = function() {
            $scope.errorMessage = "";
            if (!$scope.stateVariables.assignRoom.work_type_id) {
                $scope.errorMessage = ['Please select a work type.'];
                return false;
            }
            if (!$scope.stateVariables.assignRoom.user_id) {
                $scope.errorMessage = ['Please select an employee.'];
                return false;
            }
            var onAssignSuccess = function(data) {
                    $scope.$emit('hideLoader');
                    $scope.stateVariables.assignRoom.user_id = "";
                    $scope.stateVariables.assignRoom.work_type_id = "";
                    var workSheet = data.touched_work_sheets && data.touched_work_sheets[0] && data.touched_work_sheets[0].work_sheet_id;

                    $scope.showWorkSheet(workSheet);
                    $scope.closeDialog();
                },
                onAssignFailure = function(errorMessage) {
                    $scope.$emit('hideLoader');
                    $scope.errorMessage = errorMessage;
                };

            $scope.invokeApi(RVWorkManagementSrv.saveWorkSheet, {
                "date": $scope.stateVariables.viewingDate.date,
                "task_id": $scope.stateVariables.assignRoom.work_type_id,
                "order": "",
                "assignments": [{
                    "assignee_id": $scope.stateVariables.assignRoom.user_id,
                    "room_ids": $scope.stateVariables.assignRoom.rooms,
                    "work_sheet_id": "",
                    "from_search": true
                }]
            }, onAssignSuccess, onAssignFailure);
        };

        $scope.showCalendar = function(controller) {
            ngDialog.open({
                template: '/assets/partials/workManagement/popups/rvWorkManagementSearchDateFilter.html',
                controller: controller,
                className: 'ngdialog-theme-default single-date-picker',
                closeByDocument: true,
                scope: $scope
            });
        };

        $scope.showCreateCalendar = function() {
            $scope.calendarDialog = ngDialog.open({
                template: '/assets/partials/workManagement/popups/rvWorkManagementCreateDatePicker.html',
                controller: 'RVWorkManagementCreateDatePickerController',
                className: 'ngdialog-theme-default single-date-picker',
                closeByDocument: true,
                scope: $scope
            });
        };

        $scope.onViewDateChanged = function() {
            if ($scope.stateVariables.searching) {
                $scope.workManagementSearch(true);
            }
            setStats();
        };

        /**
         * Fired when clicked on the reset button.
         * Resets date to buisiness date and refresh statistics.
         * @return {undefined}
         */
        $scope.resetView = function() {
            // reset to buisiness date
            $scope.stateVariables.viewingDate.date = $rootScope.businessDate;
            setStats();
        };

        $scope.toggleTasksList = function(workType) {
            workType.showTasks = workType.showTasks ? false : true;
            $scope.refreshScroller('work_management');
        };

        $scope.navigateToMultiSheet = function() {
            $state.go('rover.workManagement.multiSheet', {
                date: $scope.stateVariables.viewingDate.date
            });
        };

        var languageChangeListner = $rootScope.$on('LANGUAGE_CHANGED', function() {
			$timeout(function() {
				$scope.setHeading($filter('translate')('WORK_MANAGEMENT'));
			}, 100);
        });

        $scope.$on('$destroy', languageChangeListner);

        // Initialize statistics.
        setStats();

    }
]);