sntRover.controller('rvAllRoutesCtrl', ['$scope', '$rootScope', '$filter', 'RVBillinginfoSrv', 'ngDialog', function($scope, $rootScope, $filter, RVBillinginfoSrv, ngDialog) {
	BaseCtrl.call(this, $scope);
	$scope.isInitialPage = true;


    var scrollerOptions = { preventDefault: false};

    $scope.setScroller('routes', scrollerOptions);

    setTimeout(function() {
                $scope.refreshScroller('routes');
                },
            500);

    /**
    * function to get the charge code or billing group description, to reflect in UI
    */
    $scope.getCharges = function(route) {
    	if (route.attached_charge_codes.length > 1 || route.attached_billing_groups.length > 1) {
    		return 'Multiple';
    	} else if (route.attached_charge_codes.length > 0) {
    		return route.attached_charge_codes[0].charge_code + ', ' + route.attached_charge_codes[0].description;
    	} else if (route.attached_billing_groups.length > 0) {
            return route.attached_billing_groups[0].name ;
        }

    };
    /**
    * function to get the charge type
    */
    $scope.getRouteType = function(route) {
        if ((route.attached_charge_codes.length > 0 && route.attached_billing_groups.length > 0) || route.attached_charge_codes.length > 0) {
            return 'CHARGE CODE(S)';
        } else {
            return 'BILLING GROUP(S)';
        }

    };
    /**
    * function to delete route
    */
    $scope.deleteRoute = function(index) {
        var successCallback = function(response) {
                $scope.routes.splice(index, 1);
                $scope.$parent.$emit('hideLoader');
                $scope.$parent.$emit('BILLINGINFODELETED', $scope.routes);
                $scope.$parent.$emit('REFRESH_BILLCARD_VIEW');
                if (response && response.bill_number) {
                    $scope.reservationBillData.bills[response.bill_number - 1].routed_entity_type = response.routed_entity_type;
                    $scope.reservationBillData.bills[response.bill_number - 1].guest_image = response.guest_image;
                }
            };
            var errorCallback = function(errorMessage) {
                $scope.$parent.$emit('hideLoader');
                $scope.$emit('displayErrorMessage', errorMessage);
            };

            var data = {};

            data.id = $scope.reservationData.reservation_id;
            data.from_bill = $scope.routes[index].from_bill;
            data.to_bill = $scope.routes[index].to_bill;
            $scope.invokeApi(RVBillinginfoSrv.deleteRoute, data, successCallback, errorCallback);
    };


}]);