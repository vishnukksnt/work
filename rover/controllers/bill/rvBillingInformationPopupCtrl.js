sntRover.controller('rvBillingInformationPopupCtrl', ['$scope', '$rootScope', '$filter', 'RVBillinginfoSrv', 'ngDialog', 'rvPermissionSrv', function($scope, $rootScope, $filter, RVBillinginfoSrv, ngDialog, rvPermissionSrv) {
	BaseCtrl.call(this, $scope);

    $scope.isInAddRoutesMode = false;
	$scope.isInitialPage = true;
    $scope.isEntitySelected = false;

    $scope.selectedEntity = {};
	$scope.results = {};
    $scope.bills = [];
    $scope.isReloadNeeded = false;
    $scope.routes = [];
    $scope.errorMessage = '';
    $scope.isInitialPage = true;
    $scope.selectedEntityChanged = false;
    $scope.saveData = {};
    $scope.saveData.payment_type =  "";
    $scope.saveData.payment_type_description =  "";
    $scope.saveData.newPaymentFormVisible = false;
	$scope.shouldShowWaiting = false;

    $scope.hasPermisionToDeleteGroupBillInfo = rvPermissionSrv.getPermissionValue('GROUPS');

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
    * function to get label for all routes and add routes button
    */
	$scope.getHeaderButtonLabel = function() {
		return $scope.isInitialPage ? $filter('translate')('ADD_ROUTES_LABEL') : $filter('translate')('ALL_ROUTES_LABEL');
	};
    /**
    * function to set the reload option
    param option is boolean
    */
    $scope.setReloadOption = function(option) {
        $scope.isReloadNeeded = option;
    };

    /**
    * function to handle the click 'all routes' and 'add routes' button
    */

	$scope.headerButtonClicked = function () {
        $scope.isInAddRoutesMode = true;
        $scope.isEntitySelected = false;
		$scope.isInitialPage = !$scope.isInitialPage;
        if ($scope.billingEntity !== "ALLOTMENT_DEFAULT_BILLING") {
            setDefaultRoutingDates();
            setRoutingDateOptions();
        }
        if ($scope.isInitialPage  && $scope.isReloadNeeded) {
            $scope.isReloadNeeded = false;
            $scope.fetchRoutes();
        }
        // While moved to initial screen
        if ($scope.isInitialPage) {
            init();
        }
	};
    /**
    * function to handle the pencil button click in route detail screen
    */
    $scope.deSelectEntity = function() {
        $scope.isEntitySelected = false;
    };
    /**
    * function to handle entity selection from the 'All Routes' screen and the 'select entity' screen
    */
	$scope.selectEntity = function(index, type) {

        if ($scope.billingEntity !== "ALLOTMENT_DEFAULT_BILLING") {
            if ($scope.routes && $scope.routes[index] && $scope.routes[index].from_date) {
                $scope.arrivalDate = $scope.routes[index].from_date;
                $scope.departureDate = $scope.routes[index].to_date;
            }
            setRoutingDateOptions();
        }

        $scope.errorMessage = "";
		$scope.isEntitySelected = true;
        $scope.isInAddRoutesMode = false;
        $scope.isInitialPage = false;
        $scope.selectedEntityChanged = true;
        if (type === 'ATTACHED_ENTITY' || type === 'ROUTES') {
        	$scope.selectedEntity = $scope.routes[index];
            $scope.selectedEntity.is_new = (type === 'ATTACHED_ENTITY') ? true : false;

            if ($scope.selectedEntity.entity_type !== 'RESERVATION') {
                   $scope.selectedEntity.guest_id = null;
            }
            if ($scope.selectedEntity.entity_type === "GROUP" || $scope.selectedEntity.entity_type === "HOUSE" || $scope.selectedEntity.entity_type === "ALLOTMENT") {

            }
            else {
                $scope.selectedEntity.images[0].guest_image = $scope.selectedEntity.images[0].image;
            }
        }
        else if (type === 'RESERVATIONS') {
        	var data = $scope.results.reservations[index];

        	$scope.selectedEntity = {
			    "attached_charge_codes": [],
			    "attached_billing_groups": [],
                "images": data.images,
                "reservation_status": data.reservation_status,
                "is_opted_late_checkout": data.is_opted_late_checkout,
                "name": data.firstname + " " + data.lastname,
                "entity_type": "RESERVATION",
                "has_accompanying_guests": ( data.images.length > 1 ) ? true : false,
                "bill_no": "",
                "is_new": true,
                "credit_card_details": {}
			};
            if ($scope.billingEntity === "ALLOTMENT_DEFAULT_BILLING") {
                $scope.selectedEntity = _.extend($scope.selectedEntity, {
                    "id": $scope.allotmentId,
                    "allotment_id": $scope.allotmentId,
                    'charge_routes_recipient': {
                        'id': data.id,
                        'type': 'RESERVATION'
                    }
                });
            } else {
                $scope.selectedEntity = _.extend($scope.selectedEntity, {
                    "id": data.id
                });
            }
            $scope.selectedEntity.split_charge_by_50 = false;
        }
        else if (type === 'ACCOUNT') {
        	var data = $scope.results.accounts[index];

        	$scope.selectedEntity = {
			    "id": data.id,
			    "name": data.account_name,
			    "bill_no": "",
			    "images": [{
                    "is_primary": true,
		            "guest_image": data.company_logo
		        }],
			    "attached_charge_codes": [],
			    "attached_billing_groups": [],
                "is_new": true,
                "selected_payment": "",
                "is_allow_direct_debit": data.is_allow_direct_debit,
                "credit_card_details": {}
			};
            if ($scope.billingEntity === "ALLOTMENT_DEFAULT_BILLING") {
                $scope.selectedEntity = _.extend($scope.selectedEntity, {
                    "id": $scope.allotmentId,
                    "allotment_id": $scope.allotmentId,
                    'charge_routes_recipient': {
                        'id': data.id,
                        'type': 'ACCOUNT'
                    }
                });
            }
    		if (data.account_type === 'COMPANY') {
    			$scope.selectedEntity.entity_type = 'COMPANY_CARD';
                $scope.selectedEntity.account_address = data.account_address;
    		}
            else if (data.account_type === 'TRAVELAGENT') {
                $scope.selectedEntity.entity_type = 'TRAVEL_AGENT';
                $scope.selectedEntity.account_address = data.account_address;
            }
            $scope.selectedEntity.split_charge_by_50 = false;
        }
        else if (type === 'GROUP' || type === 'HOUSE') {
            var data = $scope.results.posting_accounts[index];

            $scope.selectedEntity = {
                "id": data.id,
                "name": data.account_name,
                "bill_no": "",
                "attached_charge_codes": [],
                "attached_billing_groups": [],
                "is_new": true,
                "selected_payment": "",
                "credit_card_details": {},
                "entity_type": data.account_type
            };
            if ($scope.billingEntity === "ALLOTMENT_DEFAULT_BILLING") {
                $scope.selectedEntity = _.extend($scope.selectedEntity, {
                    "id": $scope.allotmentId,
                    "allotment_id": $scope.allotmentId,
                    'charge_routes_recipient': {
                        'id': data.id,
                        'type': 'POSTING_ACCOUNT'
                    }
                });
            }
            $scope.selectedEntity.split_charge_by_50 = false;
        }

	};

    /* function to select the attached entity
    */
    $scope.selectAttachedEntity = function(index, type) {

            $scope.errorMessage = "";
            $scope.isEntitySelected = true;
            $scope.isInitialPage = false;
            // TODO: Remove commented out code
            $scope.selectedEntity = {


                "bill_no": "",
                "has_accompanying_guests": false,
                "attached_charge_codes": [],
                "attached_billing_groups": [],
                "is_new": true,
                "credit_card_details": {}
            };
            if ($scope.billingEntity !== "TRAVEL_AGENT_DEFAULT_BILLING" &&
                $scope.billingEntity !== "COMPANY_CARD_DEFAULT_BILLING" &&
                $scope.billingEntity !== "GROUP_DEFAULT_BILLING" &&
                $scope.billingEntity !== "ALLOTMENT_DEFAULT_BILLING") {
                $scope.selectedEntity.reservation_status = $scope.reservationData.reservation_status;
                $scope.selectedEntity.is_opted_late_checkout = $scope.reservationData.is_opted_late_checkout;
            }

            if (type === 'GUEST') {
                $scope.selectedEntity.id = $scope.reservationData.reservation_id;
                $scope.selectedEntity.guest_id = $scope.attachedEntities.primary_guest_details.id;
                $scope.selectedEntity.name = $scope.attachedEntities.primary_guest_details.name;
                $scope.selectedEntity.images = [{
                    "is_primary": true,
                    "guest_image": $scope.attachedEntities.primary_guest_details.avatar
                }];
                $scope.selectedEntity.guest_type_id = $scope.attachedEntities.primary_guest_details.guest_type_id;
                $scope.selectedEntity.entity_type = "RESERVATION";
            } else if (type === 'ACCOMPANY_GUEST') {
                $scope.selectedEntity.id = $scope.reservationData.reservation_id;
                $scope.selectedEntity.guest_id = $scope.attachedEntities.accompanying_guest_details[index].id;
                $scope.selectedEntity.name = $scope.attachedEntities.accompanying_guest_details[index].name;
                $scope.selectedEntity.images = [{
                    "is_primary": false,
                    "guest_image": $scope.attachedEntities.accompanying_guest_details[index].avatar
                }];
                $scope.selectedEntity.has_accompanying_guests = true;
                $scope.selectedEntity.entity_type = "RESERVATION";
                $scope.selectedEntity.guest_type_id = $scope.attachedEntities.accompanying_guest_details[index].guest_type_id;
            } else if (type === 'COMPANY_CARD') {
                $scope.selectedEntity.id = $scope.attachedEntities.company_card.id;
                $scope.selectedEntity.name = $scope.attachedEntities.company_card.name;
                $scope.selectedEntity.is_allow_direct_debit = $scope.attachedEntities.company_card.is_allow_direct_debit;
                $scope.selectedEntity.images = [{
                    "is_primary": true,
                    "guest_image": $scope.attachedEntities.company_card.logo
                }];
                $scope.selectedEntity.entity_type = "COMPANY_CARD";
                $scope.selectedEntity.account_address = $scope.attachedEntities.company_card.account_address;
            } else if (type === 'TRAVEL_AGENT') {
                $scope.selectedEntity.id = $scope.attachedEntities.travel_agent.id;
                $scope.selectedEntity.name = $scope.attachedEntities.travel_agent.name;
                $scope.selectedEntity.is_allow_direct_debit = $scope.attachedEntities.travel_agent.is_allow_direct_debit;
                $scope.selectedEntity.images = [{
                    "is_primary": true,
                    "guest_image": $scope.attachedEntities.travel_agent.logo
                }];
                $scope.selectedEntity.entity_type = "TRAVEL_AGENT";
                $scope.selectedEntity.account_address = $scope.attachedEntities.travel_agent.account_address;
            }
            else if (type === 'GROUP' || type === 'HOUSE') {
                $scope.selectedEntity.id = $scope.attachedEntities.posting_account.id;
                $scope.selectedEntity.name = $scope.attachedEntities.posting_account.name;
                $scope.selectedEntity.entity_type = type;
            }
            else if (type === 'ALLOTMENT') {
                $scope.allotmentId = $scope.attachedEntities.posting_account.id;
                $scope.selectedEntity.id = $scope.allotmentId;
                $scope.selectedEntity.allotment_id = $scope.allotmentId;
                $scope.selectedEntity.name = $scope.attachedEntities.posting_account.name;
                $scope.selectedEntity.entity_type = type;
            }
    };

    /*
    * function used in template to map the reservation status to the view expected format
    */
    $scope.getGuestStatusMapped = function(reservationStatus, isLateCheckoutOn) {
      var viewStatus = "";

      if (isLateCheckoutOn && "CHECKING_OUT" === reservationStatus) {
        viewStatus = "late-check-out";
        return viewStatus;
      }
      if ("RESERVED" === reservationStatus) {
        viewStatus = "arrival";
      } else if ("CHECKING_IN" === reservationStatus) {
        viewStatus = "check-in";
      } else if ("CHECKEDIN" === reservationStatus) {
        viewStatus = "inhouse";
      } else if ("CHECKEDOUT" === reservationStatus) {
        viewStatus = "departed";
      } else if ("CHECKING_OUT" === reservationStatus) {
        viewStatus = "check-out";
      } else if ("CANCELED" === reservationStatus) {
        viewStatus = "cancel";
      } else if (("NOSHOW" === reservationStatus) || ("NOSHOW_CURRENT" === reservationStatus)) {
        viewStatus = "no-show";
      }
      return viewStatus;
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
    * function to fetch the attached entity list
    */
    $scope.fetchRoutes = function() {

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

    var setDefaultRoutingDates = function () {
        if (!!$scope.reservation) {
            $scope.arrivalDate = $scope.reservation.reservation_card.arrival_date,
            $scope.departureDate = $scope.reservation.reservation_card.departure_date;
            $scope.arrivalDate = $rootScope.businessDate > $scope.arrivalDate ? $rootScope.businessDate : $scope.arrivalDate;
        }
    };

    var setRoutingDateOptions = function () {
        $scope.routeDates = {
            from: $scope.arrivalDate,
            to: $scope.departureDate
        };

        if (!!$scope.reservation) {
            $scope.routingDateFromOptions = {
                dateFormat: $rootScope.jqDateFormat,
                minDate: tzIndependentDate($scope.reservation.reservation_card.arrival_date),
                maxDate: tzIndependentDate($scope.reservation.reservation_card.departure_date)
            };

            $scope.routingDateToOptions = {
                dateFormat: $rootScope.jqDateFormat,
                minDate: tzIndependentDate($scope.reservation.reservation_card.arrival_date),
                maxDate: tzIndependentDate($scope.reservation.reservation_card.departure_date)
            };
        }
    };

    /**
    * function to fetch the attached entity list
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
    * function to save the new route
    */
    $scope.saveRoute = function() {
        $rootScope.$broadcast('CALL_SAVE_ROUTE');
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

    // CICO-36509 - Checks whether we need to show or not the delete btn in group bill info screen
    $scope.isDeleteBtnShownForGroupBillingInfo = function() {
        return ( $scope.selectedEntity.isBillingGroupsPresent || $scope.selectedEntity.isChargeCodesPresent ) && $scope.billingEntity === 'GROUP_DEFAULT_BILLING' &&
               $scope.hasPermisionToDeleteGroupBillInfo;
    };

    var init = function() {
        if ($scope.attachedEntities === undefined) {
            $scope.isInitialPage = true;
            $scope.fetchRoutes();
            $scope.attachedEntities = [];

        }
        else {
            if ($scope.billingEntity === "TRAVEL_AGENT_DEFAULT_BILLING") {
                $scope.selectAttachedEntity('', 'TRAVEL_AGENT');
            }
            else if ($scope.billingEntity === "COMPANY_CARD_DEFAULT_BILLING") {
                $scope.selectAttachedEntity('', 'COMPANY_CARD');
            }
            else if ($scope.billingEntity === "GROUP_DEFAULT_BILLING") {
                $scope.selectAttachedEntity('', 'GROUP');
            }
            else if ($scope.billingEntity === "ALLOTMENT_DEFAULT_BILLING") {
                $scope.selectAttachedEntity('', 'ALLOTMENT');
            }
            else {
                $scope.isInitialPage = true;
                $scope.fetchRoutes();
                $scope.attachedEntities = [];
            }

        }
    };

    // Get icon class based on guest type
    $scope.getGuestTypeIconClass = function(entity) {
        var iconClass = 'adult';
        var guestType = _.find($rootScope.guestTypes, {id: entity.guest_type_id});

        if (guestType.value === 'CHILDREN') {
            iconClass = 'student';
        } else if (guestType.value === 'INFANTS') {
            iconClass = 'infant';
        }
        return iconClass;
    };


    init();

}]);
