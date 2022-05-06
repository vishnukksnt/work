angular.module('sntRover').service('RVBillingInfoUtilSrv',
    ['$http', '$q', 'BaseWebSrvV2', 'RVBaseWebSrv',
    function($http, $q, BaseWebSrvV2, RVBaseWebSrv) {

    var guestStatusMappings = {
        'RESERVED': ['arrival'],
        'CHECKING_IN': ['check-in'],
        'CHECKEDIN': ['inhouse'],
        'CHECKEDOUT': ['departed'],
        'CHECKING_OUT': ['check-out', 'late-check-out'],
        'CANCELED': ['cancel'],
        'NOSHOW': ['no-show'],
        'NOSHOW_CURRENT': ['no-show']
    };

    /**
    * Function used in template to map the reservation status to the view expected format
    * @param {String} [reservation status]
    * @param {Boolean}
    * @return {String} [class according to reservation status]
    */
    this.getGuestStatusMapped = function(reservationStatus, isLateCheckoutOn) {
    	if (isLateCheckoutOn && "CHECKING_OUT" === reservationStatus) {
            return guestStatusMappings[reservationStatus][1];
    	}
    	else if (reservationStatus !== "" && reservationStatus !== undefined) {
    		return guestStatusMappings[reservationStatus][0];
    	}
    };

    /**
     * Returns the desired class name for the entity.
     * @param {Object} selected entity/route details
     * @return {String} class name
     */
    this.getEntityRole = function(route) {
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
     * Returns the icon class for the entity according to role
     * @param {Object} selected entity/route details
     * @return {String} class name
     */
    this.getEntityIconClass = function(route) {
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

}]);