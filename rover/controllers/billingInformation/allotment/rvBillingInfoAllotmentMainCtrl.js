sntRover.controller('rvBillingInfoAllotmentMainCtrl', ['$scope', '$rootScope', '$filter', 'RVBillinginfoSrv', 'ngDialog', function($scope, $rootScope, $filter, RVBillinginfoSrv, ngDialog) {
	BaseCtrl.call(this, $scope);

	$scope.$on('UPDATE_SHOULD_SHOW_WAITING', function(e, value) {
		$scope.shouldShowWaiting = value;
	});

	$scope.closeDialog = function() {
		ngDialog.close();
        $scope.$emit('routingPopupDismissed');
	};

	$scope.dimissLoaderAndDialog = function() {
		$scope.$emit('hideLoader');
		$scope.closeDialog();
	};

    /**
     * function to set the reload option param option is boolean
     */
    $scope.setReloadOption = function(option) {
        $scope.isReloadNeeded = option;
    };

    /**
     * function to handle the pencil button click in route detail screen
     */
    $scope.deSelectEntity = function() {
        $scope.billingInfoFlags.isEntitySelected = false;
    };

    /**
     * Function to set the selected entity details
     * @param {String} entity type
     * @return {undefined}
     */
	$scope.setSelectedEntity = function(data, type) {
        $scope.errorMessage = "";

        if (type === 'RESERVATIONS') {
        	$scope.selectedEntity = _.extend (data, {
                "id": $scope.allotmentId,
                "allotment_id": $scope.allotmentId,
                'charge_routes_recipient': {
                    'id': data.id,
                    'type': 'RESERVATION'
                }
			});

        }
        else if (type === 'ACCOUNT') {
            $scope.selectedEntity = _.extend (data, {
                "id": $scope.allotmentId,
                "allotment_id": $scope.allotmentId,
                'charge_routes_recipient': {
                    'id': data.id,
                    'type': 'ACCOUNT'
                }
            });
        }
        else if (type === 'GROUP' || type === 'HOUSE') {
            $scope.selectedEntity = _.extend (data, {
                "id": $scope.allotmentId,
                "allotment_id": $scope.allotmentId,
                'charge_routes_recipient': {
                    'id': data.id,
                    'type': 'POSTING_ACCOUNT'
                }
            });
        }
	};

    /**
     * function to get the class for the 'li' according to the entity role
     */
	$scope.getEntityRole = function(route) {
    	if (route.entity_type === 'RESERVATION' &&  !route.has_accompanying_guests) {
    		return 'guest';
        }
    	else if (route.entity_type === 'RESERVATION') {
    		return 'accompany';
        }
    	else if (route.entity_type === 'TRAVEL_AGENT') {
    		return 'travel-agent';
        }
    	else if (route.entity_type === 'COMPANY_CARD') {
    		return 'company';
        }
    };

    /**
     * function to get the class for the 'icon' according to the entity role
     */
    $scope.getEntityIconClass = function(route) {
        if (route.entity_type === 'RESERVATION' &&  route.has_accompanying_guests ) {
            return 'accompany';
        }
    	else if (route.entity_type === 'RESERVATION' || route.entity_type === 'COMPANY_CARD') {
            return '';
        }
    	else if (route.entity_type === 'TRAVEL_AGENT') {
    		return 'icons icon-travel-agent';
        }
    };

    $scope.escapeNull = function(value, replaceWith) {
		return escapeNull(value, replaceWith);

    };

    /**
     * Function to check whether the routing for a group/house already exist.
     * if already exists, we cannot add new one.
     * @return {Boolean}
     */
    $scope.isRoutingForPostingAccountExist = function() {
        var routeToPostingAccountExist = false;
        var routesList = dclone($scope.routes, []);

        for (var i = 0; i < routesList.length; i++) {
            if (routesList[i].entity_type === "GROUP" || 
                routesList[i].entity_type === "HOUSE" || 
                routesList[i].entity_type === "ALLOTMENT" ) {

                routeToPostingAccountExist = true;
                return routeToPostingAccountExist;
            }
        }
        return routeToPostingAccountExist;
    };

    /**
     * function to save the new route
     */
    $scope.saveRoute = function() {
        $rootScope.$broadcast('routeSaveClicked');
    };

    /**
     * Listener to show error messages for child views
     */
    $scope.$on("displayErrorMessage", function(event, error) {
        $scope.errorMessage = error;

    });

	$scope.handleCloseDialog = function() {
		$scope.$emit('HANDLE_MODAL_OPENED');
		$scope.closeDialog();
        if (!!$scope.billingData) {// NOTE: CICO-17123 When the billing information popup is called from the Group Summary Tab, there wont be a billingData object in $scope. This was throwing "TypeError: Cannot set property 'billingInfoTitle' of undefined"
            $scope.billingData.billingInfoTitle = ($scope.routes.length > 0 ) ? $filter('translate')('BILLING_INFO_TITLE') : $filter('translate')('ADD_BILLING_INFO_TITLE');
        }
	};

    /**
     * CICO-14951 :function to delete routing info from default billing info
     */
    $scope.deleteDefaultRouting = function() {
        var successCallback = function(data) {
            $scope.$emit('hideLoader');
            $scope.$emit('BILLINGINFODELETED');
            $scope.closeDialog();
        };
        var errorCallback = function(errorMessage) {
            $scope.$emit('hideLoader');
            $scope.$emit('displayErrorMessage', errorMessage);
        };

        var data = {};

        data.id = $scope.contactInformation.id;
        $scope.invokeApi(RVBillinginfoSrv.deleteDefaultRouting, data, successCallback, errorCallback);
    };

    // CICO-14951
    $scope.deleteBillingInfo = function() {
        $scope.deleteDefaultRouting();
    };

    $scope.setDefaultRoutingDates = function() {};
    $scope.setRoutingDateOptions = function() {};

    var init = function() {

        $scope.selectedEntity = {};
        $scope.bills = [];
        $scope.routes = [];
        $scope.errorMessage = '';
        $scope.allotmentId = $scope.allotmentConfigData.summary.allotment_id;

        // Holds entity search results.
        // includes reservations, travel agent/company cards and accounts
        $scope.searchResults = {
            reservations: [],
            cards: [],
            posting_accounts: []
        };

        $scope.billingInfoFlags = {
            isEntitySelected: $scope.billingInformationPresent || false,
            shouldShowWaiting: false,
            isReloadNeeded: false
        };

        $scope.saveData = {
            payment_type: "",
            payment_type_description: "",
            newPaymentFormVisible: false
        };

    };

    init();

}]);