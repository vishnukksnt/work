sntRover.controller('RVAddonDatePickerController', 
    ['$scope',
    function($scope) {

    var minDateSelected = '',
        maxDateSelected = '';
    
    $scope.data = {};

    if ($scope.datePickerFor === 'start_date') {
        $scope.data.selectedDate = tzIndependentDate($scope.selectedPurchesedAddon.startDateObj);
        minDateSelected = tzIndependentDate($scope.addonPostingDate.startDate);
        maxDateSelected = tzIndependentDate($scope.selectedPurchesedAddon.endDateObj);
    }
    else {
        $scope.data.selectedDate = tzIndependentDate($scope.selectedPurchesedAddon.endDateObj);
        minDateSelected = tzIndependentDate($scope.selectedPurchesedAddon.startDateObj);
        maxDateSelected = tzIndependentDate($scope.addonPostingDate.endDate);
    }

    $scope.setUpData = function() {
        $scope.dateOptions = {
            changeYear: true,
            changeMonth: true,
            yearRange: "0:+10",
            minDate: minDateSelected,
            maxDate: maxDateSelected,
            onSelect: function() {
                if ($scope.datePickerFor === 'start_date') {
                    $scope.selectedPurchesedAddon.startDateObj = tzIndependentDate($scope.data.selectedDate);
                }
                else {
                    $scope.selectedPurchesedAddon.endDateObj = tzIndependentDate($scope.data.selectedDate);
                }
                $scope.dateSelected($scope.data.selectedDate);
                $scope.closeCalendar();
            }
        };
    };
    $scope.setUpData();
}]);