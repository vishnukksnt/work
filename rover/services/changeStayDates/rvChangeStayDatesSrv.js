angular.module('sntRover').service('RVChangeStayDatesSrv', ['$q', 'rvBaseWebSrvV2', 'RVBaseWebSrv',
    function ($q, rvBaseWebSrvV2, RVBaseWebSrv) {

    	var that = this;

        this.changeStayDetails = {};


        // function to fetch staydate details against a reservation id
        this.fetchStayBasicDetails = function (reservationId, deferred) {
            var url = '/staff/change_stay_dates/' + reservationId + '.json';

            RVBaseWebSrv.getJSON(url).then(function(data) {
                that.changeStayDetails.details = data;
                // once this API is completed call the next one
                that.fetchCalenderDetails(reservationId, deferred);
            }, function(errorMessage) {
                deferred.reject(errorMessage);
            });
        };

    	// function to fetch calender details against a reservation id
    	this.fetchCalenderDetails = function (reservationId, deferred) {
            var url = '/staff/change_stay_dates/' + reservationId + '/calendar.json';


            RVBaseWebSrv.getJSON(url).then(function(data) {
                that.changeStayDetails.calendarDetails = data;
                deferred.resolve(that.changeStayDetails);
            }, function(errorMessage) {
                deferred.reject(errorMessage);
            });
        };


        this.fetchInitialData = function (reservationId) {
            // Please be care. Only last function should resolve the data
            var deferred = $q.defer ();

            that.fetchStayBasicDetails (reservationId, deferred);
            return deferred.promise;
        };

        this.checkUpdateAvaibale = function (data) {
            var url = '/staff/change_stay_dates/' + data.reservation_id + '/update.json';

            var data = {'arrival_date': data.arrival_date, 'dep_date': data.dep_date};
            var deferred = $q.defer ();

            RVBaseWebSrv.getJSON(url, data).then(function(data) {
                deferred.resolve(data);
            }, function(errorMessage) {
                deferred.reject(errorMessage);
            });
            return deferred.promise;
        };


        this.confirmUpdates = function(data) {
            var url = '/staff/change_stay_dates/' + data.reservation_id + '/confirm';

            var postData = {"arrival_date": data.arrival_date, "dep_date": data.dep_date, "room_number": data.room_selected, "authorize_credit_card": data.authorize_credit_card, "is_cc_authorize_for_incidentals": data.is_cc_authorize_for_incidentals };

            if (data.forcefully_overbook) {
                postData.forcefully_overbook = data.forcefully_overbook;  
            }
            var deferred = $q.defer ();

            RVBaseWebSrv.postJSON(url, postData).then(function(data) {
                deferred.resolve(data);
            }, function(errorMessage) {
                deferred.reject(errorMessage);
            });
            return deferred.promise;

        };
        this.updateBillingInformation = function (params) {
            var deferred = $q.defer();
            var url = "api/bill_routings/update_dates";
            // ie::   reservation_id=1616903&action_task[description]=test

            rvBaseWebSrvV2.postJSON(url, params).then(function (data) {
                deferred.resolve(data);
            }, function (data) {
                deferred.reject(data);
            });
            return deferred.promise;
        };
}]);
