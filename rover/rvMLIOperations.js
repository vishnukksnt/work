var MLIOperation = function() {

    var that = this;

    // to set your merchant ID provided by Payment Gateway
    this.setMerChantID = function(id) {
        HostedForm.setMerchant(id);
    };

    // fetch MLI session details
    this.fetchMLISessionDetails = function(sessionDetails, updateSessionSuccessCallback, updateSessionFailureCallback) {

        var callback = function(response) {
            (response.status === "ok") ? updateSessionSuccessCallback(response) : updateSessionFailureCallback(response);
        };

        HostedForm.updateSession(sessionDetails, callback);
    };

};