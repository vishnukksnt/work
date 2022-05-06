angular.module('sntRover').service('RVDashboardSrv', ['$q', 'RVBaseWebSrv', 'rvBaseWebSrvV2', 'rvAngularIframeHelperSrv', function( $q, RVBaseWebSrv, rvBaseWebSrvV2, rvAngularIframeHelperSrv) {


    var that = this;
    var userDetails = {}; // varibale to keep header_info.json's output

    this.dashBoardDetails = {};
    this.getUserDetails = function() {
        return userDetails;
    };

	/*
  	* To fetch user details
  	* @return {object} user details
  	*/
    this.fetchUserInfo = function() {
        var deferred = $q.defer();
        var url = '/api/rover_header_info.json';

        rvBaseWebSrvV2.getJSON(url).then(function(data) {
            userDetails = data.data;
            rvAngularIframeHelperSrv.setHotelInitialData('ROVER_HEADER_INFO', data.data);
            deferred.resolve(data.data);
        }, function(data) {
            deferred.reject(data);
        });

        return deferred.promise;
    };

 	this.fetchDashboardStatisticData = function() {
	    var deferred = $q.defer();

		var url = '/api/dashboards';

		rvBaseWebSrvV2.getJSON(url).then(function(data) {
			rvAngularIframeHelperSrv.setHotelInitialData('DASHBOARD_DATA', data);
			deferred.resolve(data);
		}, function(errorMessage) {
			deferred.reject(errorMessage);
		});
		return deferred.promise;
	};

	this.fetchDashboardNotifications = function() {
	    var deferred = $q.defer();
	    // var url = "ui/show?json_input=WindsurferCRS/settings.json&format=json";
		var url = '/api/staff_notifications/user';

		rvBaseWebSrvV2.getJSON(url).then(function(data) {
			deferred.resolve(data);
		}, function(errorMessage) {
			deferred.reject(errorMessage);
		});
		return deferred.promise;
	};

	this.changeNotificationStatus = function(id) {
	    var deferred = $q.defer();
	    // var url = "ui/show?json_input=WindsurferCRS/settings.json&format=json";
		var url = '/api/staff_notifications/' + id + '/user';

		rvBaseWebSrvV2.putJSON(url).then(function(data) {
			deferred.resolve(data);
		}, function(errorMessage) {
			deferred.reject(errorMessage);
		});
		return deferred.promise;
	};
   /*
    * To fetch dashboard details
    * @return {object} dashboard details
    */
   	this.fetchDashboardDetails = function() {
		var deferred = $q.defer();

		that.fetchDashboardStatisticData()
	    .then(function(data) {
	        that.dashBoardDetails.dashboardStatistics = data;
	        deferred.resolve(that.dashBoardDetails);
	    }, function(errorMessage) {
			deferred.reject(errorMessage);
		});
		return deferred.promise;
	};

	this.fetchHotelDetails = function() {
		var deferred = $q.defer();
		var url = '/api/hotel_settings.json';

		RVBaseWebSrvV2.getJSON(url).then(function(data) {
			deferred.resolve(data);
		}, function(errorMessage) {
			deferred.reject(errorMessage);
		});
		return deferred.promise;
	};

	this.fetchStatisticData = function(params) {
	    var deferred = $q.defer();

		var url = '/api/dashboards/statistics';

		rvBaseWebSrvV2.getJSON(url, params).then(function(data) {
			deferred.resolve(data);
		}, function(errorMessage) {
			deferred.reject(errorMessage);
		});
		return deferred.promise;
	};

    this.signOut = function() {
        return rvBaseWebSrvV2.getJSON('/logout');
    };

}]);
