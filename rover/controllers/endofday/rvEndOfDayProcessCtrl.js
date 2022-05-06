sntRover.controller('RVEndOfDayProcessController', ['$scope', 'ngDialog', '$rootScope', '$filter', 'RVEndOfDayModalSrv', '$state', '$timeout', function($scope, ngDialog, $rootScope, $filter, RVEndOfDayModalSrv, $state, $timeout) {

    BaseCtrl.call(this, $scope);
    var calenderMaxDate;
    var init = function() {
        setTitle();
        $scope.eodLogDetails = {};
        $scope.checkEodStatus = false;
        $scope.dateFormat = $rootScope.dateFormat;
        $scope.businessDate = $rootScope.businessDate;       
        setDefaultNextBussinessDate();
        setDefaultSelectedDate();
        calenderMaxDate = ($rootScope.hotelDetails.is_auto_change_bussiness_date) ? $scope.selectedDate : $scope.businessDate;
        setDisplayDateValues();         
        $scope.setScroller('eod_scroll');
        fetchEodLogOfSelectedDate();
    };
    var setTitle = function() {
        $scope.setHeadingTitle('End of Day');
    };
    /*
    * Function to get day, month and Year from Date(Date format is kept yyyy/mm/dd);
    */
    var setDisplayDateValues = function() {        
        var values = $scope.selectedDate.split("-");

        $scope.year = values[0];
        $scope.month = getMonthName(parseInt(values[1] - 1));
        $scope.day = values[2];
    };
    
    /*
    * Setting nextBussiness Date
    */
    var setDefaultNextBussinessDate = function() {
        $scope.nextBusinessDate = tzIndependentDate($rootScope.businessDate);
        $scope.nextBusinessDate.setDate($scope.nextBusinessDate.getDate() + 1);
        $scope.nextBusinessDate = $filter('date')($scope.nextBusinessDate, "yyyy-MM-dd");
    };
    /*
    * Function to restart a failed process.
    */

    $scope.restartFailedProcess = function(process) {
        var data = {           
            id: process.id
        };
        var restartProcessSuccess = function() {
            fetchEodLogOfSelectedDate();
        };
        var restartProcessFail = function(data) {
            $rootScope.$broadcast('hideLoader');
        };

        $scope.invokeApi(RVEndOfDayModalSrv.restartFailedProcess, data, restartProcessSuccess, restartProcessFail);
    };
    /*
    * Set Selected date as previous date of Bussines date.
    */
    var setDefaultSelectedDate = function() {       
        var previousDate = tzIndependentDate($rootScope.businessDate);

        previousDate.setDate(previousDate.getDate() - 1);              
        $scope.selectedDate = $filter('date')(previousDate, "dd-MM-yyyy").split("-").reverse().join("-");        
    };
    /*
    * Setting Date options
    */
    var setUpDateData = function() {
        $scope.date =  $scope.selectedDate;
        $scope.dateOptions = {
            changeYear: true,
            changeMonth: true,
            dateFormat: 'yy-mm-dd',
            maxDate: calenderMaxDate,
            yearRange: "-100:+0",
            onSelect: function(date, inst) {
                $scope.selectedDate = date;
                setDisplayDateValues();            
                if ($scope.selectedDate !== $scope.businessDate) {
                   fetchEodLogOfSelectedDate(); 
                }                
                ngDialog.close();
            }
        };
    };
   
    var refreshScroller = function() {
        $scope.refreshScroller('eod_scroll');
    };   

    $scope.showError = function(index) {
        $scope.eodLogDetails[index].isOpened = !$scope.eodLogDetails[index].isOpened;
        refreshScroller();
    };

    var fetchEodLogOfSelectedDate = function() {
        var data = {
            date: $scope.selectedDate
        };
        var fetchEodLogSuccess = function(data) {            
            $scope.eodLogDetails = data.eod_processes;
            $scope.nextEodRunTime = data.eod_process_time;
            $scope.lastEodRunInHours = data.last_eod_run_in_hours;
            $scope.lastEodRunInMinutes = data.last_eod_run_in_minutes;            
            $rootScope.$broadcast('hideLoader');
            $timeout(function() {
                refreshScroller();           
            }, 1000);
            // Eod status update handles here
            if (!$rootScope.isEodRunning && $scope.checkEodStatus) {
                $state.go('rover.dashboard.manager');
            } 
        };
        var fetchEodLogFailure = function() {
            $rootScope.$broadcast('hideLoader');
        };

        $scope.invokeApi(RVEndOfDayModalSrv.fetchLog, data, fetchEodLogSuccess, fetchEodLogFailure);
    };

    $scope.isLastEodRunWithin18Hr = function() {
        return ($scope.lastEodRunInMinutes == null) ? false : true;
    };
    /*
    * Show date picker
    */
    $scope.clickedDate = function() {
        setUpDateData();
        ngDialog.open({
            template: '/assets/partials/endOfDay/rvEodDatepicker.html',
            className: 'single-date-picker',
            scope: $scope
        });
    };
    /*
    * returning class name for Button.
    */
    $scope.getClassForEODButton = function() {        
        if (!$scope.isLastEodRunWithin18Hr()) {
            return "green";
        }
        if ($scope.isLastEodRunWithin18Hr() && $scope.hasPermissionToRunEOD()) {
            return "orange";
        } else {
            return "grey";
        }        
    };
    
    $scope.disableEODButton = function() {
        if ($scope.isLastEodRunWithin18Hr()) {
            return !($scope.hasPermissionToRunEOD());
        } else {
            return false;
        }        
    };
    
    $scope.updateStatus = function() {
        // we are fetching eod login, flag to handle update status
        $scope.checkEodStatus = true;
        fetchEodLogOfSelectedDate();
    };

    $scope.setSelectedDateToBussinessDate = function() {
        $scope.selectedDate = $scope.businessDate;        
        setDisplayDateValues();
    };

    $scope.showSetToTodayButton = function() {
        return (!$rootScope.hotelDetails.is_auto_change_bussiness_date || $scope.isSameSelectedAndBussiness()) ? true : false;
    };
    $scope.isSameSelectedAndBussiness = function() {
        return ($scope.selectedDate === $scope.businessDate) ? true : false;
    };
    /*
    * returning class name depends on status.
    */
    $scope.getClass = function(processLog) {
        if (processLog.status == "SUCCESS") {
            return "has-success";
        } else if (processLog.status == 'NOT_ACTIVE') {
            return "pending";
        } else if (processLog.status == 'PENDING') {
            return "";
        } else if (processLog.status == "FAILED" && processLog.isOpened) {
            return " error has-arrow toggle active";
        } else {
            return " error has-arrow toggle ";
        }
    };

    $scope.openEndOfDayPopup = function() {
        ngDialog.open({
            template: '/assets/partials/endOfDay/rvEndOfDayModal.html',
            controller: 'RVEndOfDayModalController',
            className: 'end-of-day-popup ngdialog-theme-plain'
        });
    };

    init();
}]);