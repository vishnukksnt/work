
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
function getGuestStatusMapped(reservationStatus, isLateCheckoutOn) {
	if (isLateCheckoutOn && "CHECKING_OUT" === reservationStatus) {
        return guestStatusMappings[reservationStatus][1];
	}
	else if (reservationStatus !== "" && reservationStatus !== undefined) {
		return guestStatusMappings[reservationStatus][0];
	}
}
