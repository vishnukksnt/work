angular.module('sntRover').service('RVSettingsSrv', ['$q', 'RVBaseWebSrv', function( $q, RVBaseWebSrv) {

 /*
    * To fetch user details
    * @return {object} user details
    */
this.fetchUserInfo = function() {
		var deferred = $q.defer();
		var url =  'admin/user/get_user_name_and_email.json';

		RVBaseWebSrv.getJSON(url).then(function(data) {
			deferred.resolve(data);
		}, function(data) {
			deferred.reject(data);
		});
		return deferred.promise;
};

 /*
    * To update user details
    * @param {object} user details
    */
this.updateUserInfo = function(data) {
		var deferred = $q.defer();
		var url =  'admin/user/change_password';

		RVBaseWebSrv.postJSON(url, data).then(function(data) {
			deferred.resolve(data);
		}, function(data) {
			deferred.reject(data);
		});
		return deferred.promise;
};


}]);