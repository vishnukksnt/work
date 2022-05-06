var SwipeOperation = function() {

    var that = this;
    /*
     * Function to create the token - Swipe.
     * @param {obj} swipedCardData - initial swiped data to create token
     */

    this.createDataToTokenize = function(swipedCardData) {
            var ksn = swipedCardData.RVCardReadTrack2KSN;

              if (swipedCardData.RVCardReadETBKSN !== "" && typeof swipedCardData.RVCardReadETBKSN !== "undefined") {
                ksn = swipedCardData.RVCardReadETBKSN;
            }
            var getTokenFrom = {
                'ksn': ksn,
                'pan': swipedCardData.RVCardReadMaskedPAN
            };

            if (swipedCardData.RVCardReadTrack2 !== '') {
                getTokenFrom.et2 = swipedCardData.RVCardReadTrack2;
            } else if (swipedCardData.RVCardReadETB !== "") {
                getTokenFrom.etb = swipedCardData.RVCardReadETB;
            }
            getTokenFrom.is_encrypted = true;
            if (swipedCardData.RVCardReadIsEncrypted === 0 || swipedCardData.RVCardReadIsEncrypted === '0') {
                getTokenFrom.is_encrypted = false;
            }
            return getTokenFrom;
    };
    /*
     * Function to create the data to render in screens
     */
    this.createSWipedDataToRender = function(swipedCardData) {
        var swipedCardDataToRender = {
            "cardType": swipedCardData.RVCardReadCardType,
            "cardNumber": "xxxx-xxxx-xxxx-" + swipedCardData.token.slice(-4),
            "nameOnCard": swipedCardData.RVCardReadCardName,
            "cardExpiry": swipedCardData.RVCardReadExpDate,
            "cardExpiryMonth": swipedCardData.RVCardReadExpDate.slice(-2),
            "cardExpiryYear": swipedCardData.RVCardReadExpDate.substring(0, 2),
            "et2": swipedCardData.RVCardReadTrack2,
            'ksn': swipedCardData.RVCardReadETBKSN || swipedCardData.RVCardReadTrack2KSN,
            'pan': swipedCardData.RVCardReadMaskedPAN,
            'etb': swipedCardData.RVCardReadETB,
            'swipeFrom': swipedCardData.swipeFrom,
            'token': swipedCardData.token,
            'isEncrypted': swipedCardData.RVCardReadIsEncrypted !== 0 && swipedCardData.RVCardReadIsEncrypted !== '0'
        };

        return swipedCardDataToRender;
    };
    /*
     * Function to create the data to save which is passed to API
     */
    this.createSWipedDataToSave = function(swipedCardData) {
        var swipedCardDataToSave = {
            "cardType": swipedCardData.cardType,
            "et2": swipedCardData.et2,
            "ksn": swipedCardData.ksn,
            "pan": swipedCardData.pan,
            "mli_token": swipedCardData.token,
            "payment_type": "CC",
            "expiryMonth": swipedCardData.cardExpiryMonth,
            "expiryYear": swipedCardData.cardExpiryYear,
            "cardNumber": swipedCardData.cardNumber,
            "etb": swipedCardData.etb,
            'is_encrypted': swipedCardData.isEncrypted
        };

        return swipedCardDataToSave;
    };


};
