sntRover.controller('rvBillingInfoReservationMainCtrl', ['$scope', '$rootScope', '$filter', 'RVBillinginfoSrv', 'ngDialog', 'RVBillingInfoUtilSrv', function($scope, $rootScope, $filter, RVBillinginfoSrv, ngDialog, RVBillingInfoUtilSrv) {

    BaseCtrl.call(this, $scope);

    /**
     * Function to initialize the controller
     * @return {undefined}
     */
    var init = function() {
        $scope.attachedEntities = [];

        // Contains selected entity details. Entity is selected 
        // from all routes screen or from search entity screen.
        $scope.selectedEntity = {};

        // Holds entity search results.
        // includes reservations, travel agent/company cards and accounts
        $scope.searchResults = {
            reservations: [],
            cards: [],
            posting_accounts: []
        };

        $scope.bills = [];
        $scope.routes = [];
        $scope.routeDates = {};
        $scope.errorMessage = '';

        $scope.billingInfoFlags = {
            isInAddRoutesMode: false,
            isInitialPage: true,
            isEntitySelected: false,
            shouldShowWaiting: false,
            isReloadNeeded: false,
            showChargeCodes: false,
            isBillingGroup: true
        };

        // Payment details
        $scope.saveData = {
            payment_type: "",
            payment_type_description: "",
            newPaymentFormVisible: false
        };
        $scope.fetchRoutes();
    };

	$scope.$on('UPDATE_SHOULD_SHOW_WAITING', function(event, value) {
		$scope.billingInfoFlags.shouldShowWaiting = value;
	});

    /**
     * Function to close the billing information popup
     * @return {undefined}
     */
	$scope.closeDialog = function() {
		ngDialog.close();
        $scope.$emit('routingPopupDismissed');
	};

    /**
     * Function to dismiss loader and dialog
     * @return {undefined}
     */
	$scope.dimissLoaderAndDialog = function() {
		$scope.$emit('hideLoader');
		$scope.closeDialog();
	};

    /**
     * Function to set the reload option
     * @param {Boolean}
     * @return {undefined}
     */
    $scope.setReloadOption = function(option) {
        $scope.billingInfoFlags.isReloadNeeded = option;
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
     * Function to add new route
     * @return {undefined}
     */
	$scope.addNewRoute = function() {
        $scope.billingInfoFlags.isInAddRoutesMode = true;
        $scope.billingInfoFlags.isEntitySelected  = false;
		$scope.billingInfoFlags.isInitialPage     = false;
	};

    /**
     * Function to navigate to all routes page
     * @return {undefined}
     */
    $scope.navigateToInitialPage = function() {
        $scope.billingInfoFlags.isInitialPage = true;
        if ($scope.billingInfoFlags.isReloadNeeded) {
            $scope.billingInfoFlags.isReloadNeeded = false;
            $scope.fetchRoutes();
        }
        init();
    };

    /**
     * Function to handle the pencil button click in route detail screen
     * @return {undefined}
     */
    $scope.deSelectEntity = function() {
        $scope.billingInfoFlags.isEntitySelected = false;
    };

    /**
     * Function to set selected entity
     * @param {Object} selected entity details
     * @return {undefined}
     */
    $scope.setSelectedEntity = function(entityDetails) {
        $scope.selectedEntity = entityDetails;
    };

    /**
     * Function used in template to map the reservation status to the view expected format
     * @param {String} reservation status
     * @param {Boolean}
     * @return {String} class according to reservation status
     */
    $scope.getGuestStatusMapped = function(reservationStatus, isLateCheckoutOn) {
        return RVBillingInfoUtilSrv.getGuestStatusMapped(reservationStatus, isLateCheckoutOn);
    };

    /**
     * Function to get the class for the 'li' according to the entity role
     * @param {Object} selected route
     * @return {String} class of 'li'
     */
	$scope.getEntityRole = function(route) {
        return RVBillingInfoUtilSrv.getEntityRole(route);
    };

    /**
     * Function to get the class for the 'icon' according to the entity role
     * @param {Object} selected route
     * @return {String} class of 'icon'
     */
    $scope.getEntityIconClass = function(route) {
        return RVBillingInfoUtilSrv.getEntityIconClass(route);
    };

    /**
     * Function that converts a null value to a desired string.
     * if no replace value is passed, it returns an empty string.
     * @return {String}
     */
    $scope.escapeNull = function(value, replaceWith) {
		return escapeNull(value, replaceWith);
    };

    /**
     * Function to fetch the attached entity list
     * @return {undefined}
     */
    $scope.fetchRoutes = function () {

        var successCallback = function(data) {
             $scope.routes = data;
             $scope.fetchEntities();
        };

        var errorCallback = function(errorMessage) {
            $scope.fetchEntities();
            $scope.errorMessage = errorMessage;

        };

        $scope.invokeApi(RVBillinginfoSrv.fetchRoutes, $scope.reservationData.reservation_id, successCallback, errorCallback);
    };

    /**
     * Function to set the default routing dates for a new route.
     * @return {undefined}
     */
    $scope.setDefaultRoutingDates = function() {
        $scope.routeDates.from = $rootScope.businessDate > $scope.reservation.reservation_card.arrival_date ? 
                                 $rootScope.businessDate : $scope.reservation.reservation_card.arrival_date;
        $scope.routeDates.to   = $scope.reservation.reservation_card.departure_date;
    };

    /**
     * Function to set the date range for from and to date fields
     * @return {undefined}
     */
    $scope.setRoutingDateOptions = function() {
        $scope.routingDateFromOptions = {       
            dateFormat: 'dd-mm-yy',
            minDate: tzIndependentDate($scope.reservation.reservation_card.arrival_date),
            maxDate: tzIndependentDate($scope.reservation.reservation_card.departure_date)
        };

        $scope.routingDateToOptions = {       
            dateFormat: 'dd-mm-yy',
            minDate: tzIndependentDate($scope.reservation.reservation_card.arrival_date),
            maxDate: tzIndependentDate($scope.reservation.reservation_card.departure_date)
        };
    };

    /**
     * Function to fetch the attached cards list
     * @return {undefined}
     */
    $scope.fetchEntities = function() {

        var successCallback = function(data) {
            $scope.attachedEntities = data;
            $scope.$parent.$emit('hideLoader');
        };

        var errorCallback = function(errorMessage) {
            $scope.$emit('hideLoader');
            $scope.errorMessage = errorMessage;
        };

        $scope.invokeApi(RVBillinginfoSrv.fetchAttachedCards, $scope.reservationData.reservation_id, successCallback, errorCallback);
    };

    /**
     * Function to save the new route
     * @return {undefined}
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

    /**
     * New routes may be added or existing routes may be deleted before
     * closing the popup, so change billing info button name accordingly.
     * @return {undefined}
     */
	$scope.handleCloseDialog = function() {
		$scope.$emit('HANDLE_MODAL_OPENED');
		$scope.closeDialog();
        $scope.billingData.billingInfoTitle = ($scope.routes.length > 0 ) ? 
                                              $filter('translate')('BILLING_INFO_TITLE') :
                                              $filter('translate')('ADD_BILLING_INFO_TITLE');
	};

    init();

}]);
