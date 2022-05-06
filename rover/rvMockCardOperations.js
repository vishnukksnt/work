/* eslint-disable angular/timeout-service,no-undef */
// eslint-disable-next-line no-unused-vars
var MockCardOperation = function () {
    // class for handling operations with payment device

    var that = this;
    // function for start reading from device
    // Note down: Currently it is recursive

    var successResponses = {
        getLastReceipt: {
            'message': ' "\n' +
            'COMMONWEALTH BANK \n' +
            'EFTPOS \n' +
            'TEST\n' +
            'TERMINAL: 13600822\n' +
            'REFERENCE: 000501\n' +
            'CUSTOMER COPY\n' +
            'CARD NO: 5106(c)\n' +
            'PAN SEQ NO: 01\n' +
            'EXPIRY DATE: \n' +
            'AID: A0000000041010\n' +
            'TVR: 0000000000\n' +
            'TSI: 0000\n' +
            'ATC: 00146\n' +
            'ARQC: 301573EF760BA1A5\n' +
            'CREDIT \n' +
            'PURCHASE $1.00\n' +
            'TOTAL AUD $1.00\n' +
            '10 DEC 2016 03:26\n' +
            'DEBIT MasterCard\n' +
            '*APPROVED 08\n'
        }
    };

    var failureResponses = [{
        RVErrorCode: 104,
        RVErrorDesc: 'Device Not Connected.'
    }, {
        RVErrorCode: 148,
        RVErrorDesc: 'Transaction was not processed by PIN pad.'
    }, {
        RVErrorCode: 147,
        RVErrorDesc: 'No transaction pending.'
    }, {
        RVErrorCode: 146,
        RVErrorDesc: 'Failed to get transaction details.'
    }];

    this.startReaderDebug = function (options) {
        // Simulating the card reader function for easy testing. May be removed in production.
        coinstance = this; // Global instance to test from console.

        that.callSuccess = function (data) {
            var successCallBack = options['successCallBack'] ? options['successCallBack'] : null;
            var successCallBackParameters = options['successCallBackParameters'] ? options['successCallBackParameters'] : null;
            var carddata = {
                'RVCardReadCardType': 'AX',
                'RVCardReadTrack2': '4788250000028291=17121015432112345601',
                'RVCardReadTrack2KSN': '950067000000062002AF',
                'RVCardReadMaskedPAN': '5405220008002226',
                'RVCardReadCardName': 'Sample Name',
                'RVCardReadExpDate': '99012',
                'RVCardReadCardIIN': '002226',
                'RVCardReadIsEncrypted': 0
            };

            if (angular.isDefined(data)) {
                carddata = data;
            }
            successCallBack(carddata, successCallBackParameters);
        };

    };

    this.getConnectedDeviceDetails = function (options) {
        options['service'] = 'RVDevicePlugin';
        options['action'] = 'getDevicesStates';
        options['timeout'] = 31000;
        options['successCallBack'](
            [{
                'actions': [
                    {
                        'action_name': 'getLastReceipt',
                        'display_name': 'Last Receipt',
                        'service_name': 'RVDevicePlugin'
                    }
                ],
                'battery_percentage': 0,
                'device_connection_sate': 'Connected',
                'device_id': '13601060',
                'device_identified_name': 'TEST                -311000063601011',
                'device_short_name': 'Ingenico CBA',
                'firmware_version': 'TL0415',
                'library_name': 'PosGate',
                'library_version': '2.0.6',
                'serial_number': '21058417'
            }]
        );
    };

    this.doDeviceAction = function (options) {
        if (Math.random() > 0.5) {
            options['successCallBack'](successResponses[options.action]);
        } else {
            options['failureCallBack'](failureResponses[0]);
        }
    };
};
