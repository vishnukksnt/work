sntRover.controller('rvBillingInfoRoutesListCtrl', ['$scope', '$rootScope', '$filter', 'RVBillinginfoSrv', 'ngDialog', function($scope, $rootScope, $filter, RVBillinginfoSrv, ngDialog) {

    BaseCtrl.call(this, $scope);

    // Initialize controller
    var init = function() {
        // set scrollers
        var scrollerOptions = { preventDefault: false };

        $scope.setScroller('routes', scrollerOptions);

        setTimeout(function() {
            $scope.refreshScroller('routes');
        }, 500);
    };

    /**
     * Function to get the charge code or billing group description, to reflect in UI
     * @param {Object} route from routes list
     * @return {String} charge code or billing group description
     */
    $scope.getCharges = function(route) {
    	if (route.attached_charge_codes.length > 1 || route.attached_billing_groups.length > 1) {
    		return 'Multiple';
    	} 
        else if (route.attached_charge_codes.length > 0) {
    		return route.attached_charge_codes[0].charge_code + ', ' +
                   route.attached_charge_codes[0].description;
    	} 
        else if (route.attached_billing_groups.length > 0) {
            return route.attached_billing_groups[0].name ;
        }
    };

    /**
     * Function to get the charge type
     * @param {Object} route from routes list
     * @return {String} charge type
     */
    $scope.getRouteType = function(route) {
        if ((route.attached_charge_codes.length > 0 && 
            route.attached_billing_groups.length > 0) || 
            route.attached_charge_codes.length > 0) {

            return 'CHARGE CODE(S)';
        } 
        else {
            return 'BILLING GROUP(S)';
        }
    };

    /**
     * Function to delete route
     * @param {Number} index of route to delete
     * @return {undefined}
     */
    $scope.deleteRoute = function(index) {

        var successCallback = function (data) {
            $scope.routes.splice(index, 1);
            $scope.$parent.$emit('hideLoader');
            $scope.$parent.$emit('BILLINGINFODELETED', $scope.routes);
        };

        var errorCallback = function (errorMessage) {
            $scope.$parent.$emit('hideLoader');
            $scope.$emit('displayErrorMessage', errorMessage);
        };

        var data = {};

        data.id  = $scope.reservationData.reservation_id;
        data.from_bill = $scope.routes[index].from_bill;
        data.to_bill   = $scope.routes[index].to_bill;

        $scope.invokeApi(RVBillinginfoSrv.deleteRoute, data, successCallback, errorCallback);
    };

    /**
     * Function to handle entity selection from the 'All Routes' screen
     * @param {Number} index of selected entity
     * @return {undefined}
     */
    $scope.selectEntityFromRoutesList = function(index) {

        if ($scope.routes[index].from_date) {
            $scope.routeDates.from = $scope.routes[index].from_date;
            $scope.routeDates.to   = $scope.routes[index].to_date;
        }
        $scope.setRoutingDateOptions();

        $scope.billingInfoFlags.isEntitySelected  = true;
        $scope.billingInfoFlags.isInAddRoutesMode = false;
        $scope.billingInfoFlags.isInitialPage     = false;

        var selectedEntityDetails = $scope.routes[index];

        $scope.setSelectedEntity(selectedEntityDetails);
        $scope.selectedEntity.is_new = false;

        if ($scope.selectedEntity.entity_type === "RESERVATION") {
            $scope.selectedEntity.images[0].guest_image = $scope.selectedEntity.images[0].image;
        }
        else {
            $scope.selectedEntity.guest_id = null;
        }
    };

    init();

}]);
