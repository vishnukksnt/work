angular.module('sntRover')
    .controller('rvAvailabilityButtonController', [
        '$scope',
        '$timeout',
        '$filter',
        'rvAvailabilitySrv',
        'jsMappings',
        function($scope, $timeout, $filter, rvAvailabilitySrv, jsMappings) {

            var addPrintStyles = function () {
                $('html').addClass('availability-print');
            };

            var removePrintStyles = function () {
                $('html').removeClass('availability-print');
            };
            

            /**
            * Controller class for availability  button in header section,
            * will do only showing/hiding the template only.
            */

            BaseCtrl.call(this, $scope);

            // variable used to determine whether we need to show availability section or not (we will add/remove section based on this)
            $scope.showAvailability = false;

            // When closing we need to add a class to container div
            $scope.isClosing = false;

            /**
            * function to handle click on availability in the header section.
            * will call the API to fetch data with default values (from business date to 14 days)
            * and will show the availability section if successful
            */
            $scope.clickedOnAvailabilityButton = function($event) {
                // setting data loaded as null, will be using to hide the data showing area on loading in availiable room grid display
                var emptyDict = {},
                    delay = 1000;

                /*
                in order to compromise with stjepan's animation class we need write like this
                because we are removing the availability details section when not wanted,
                we need to wait some time to complete the animation and execute the removing section after that
                */

                if ($scope.showAvailability) {
                    $scope.isClosing = true;
                    $timeout(function() {
                        $scope.isClosing = false;
                        $scope.showAvailability = false;
                    }, delay);
                
                    rvAvailabilitySrv.updateData(emptyDict);

                    removePrintStyles();
                } else {
                    $scope.$emit('showLoader');
                    jsMappings.fetchAssets(['rover.availability', 'highcharts'], ['highcharts-ng'])
                        .then(function() {
                            $scope.$emit('hideLoader');
                            $timeout(function() {
                                $scope.showAvailability = true;
                            }, 0);
                        });

                    addPrintStyles();
                }

            };

            /**
            * function to get the template url for availability, it will supply only if
            * 'showAvailability' is true
            */
            $scope.getAvailabilityTemplateUrl = function() {
                if ($scope.showAvailability) {
                    return '/assets/partials/availability/availability.html';
                }
                return '';
            };

            $scope.$on('CLOSE_AVAILIBILTY_SLIDER', function(event) {
                $scope.clickedOnAvailabilityButton(null);
            });
        }
    ]);
