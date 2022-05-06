sntRover.controller('rvHouseEventsListPopupCtrl', [
    '$scope',
    '$rootScope',
    '$timeout',
    'rvHouseEventsListSrv',
    'ngDialog',
    '$filter',
    function($scope, $rootScope, $timeout, rvHouseEventsListSrv, ngDialog, $filter) {

        BaseCtrl.call(this, $scope);

        var EVENTS_LIST_SCROLLER = 'events-list-scroller';
        
        // Set scroller for the popup 
        var setScroller = function () {
                var scrollerOptions = {
                    tap: true,
                    preventDefault: false
                };

                $scope.setScroller(EVENTS_LIST_SCROLLER, scrollerOptions);
            },
            // Refresh scroller
            refreshScroller = function () {
                $timeout(function() {
                    $scope.refreshScroller(EVENTS_LIST_SCROLLER);
                }, 100);
            
            },
            // Fetch house events list for the given date
            fetchHouseEventsList = function() {
                var onHouseEventsFetchSuccess = function(data) {
                        $scope.eventsData = data;
                        refreshScroller();
                    },
                    onHouseEventsFetchFailure = function() {
                        $scope.eventsData = [];
                    },
                    options = {
                        onSuccess: onHouseEventsFetchSuccess,
                        onFailure: onHouseEventsFetchFailure,
                        params: {
                            date: $scope.selectedEventDisplayDate
                        }
                    };
            
                $scope.callAPI(rvHouseEventsListSrv.fetchHouseEventsByDate, options);
            };
        
        // Close the dialog
        $scope.closeDialog = function() {
            ngDialog.close();
        };
    
        // Initialize the controller
        var init = function() {
            $scope.displayDate = $filter('date')(new tzIndependentDate($scope.selectedEventDisplayDate), 'EEEE, dd MMMM yyyy');
            setScroller();
            fetchHouseEventsList();
        };

        init();
    }]);