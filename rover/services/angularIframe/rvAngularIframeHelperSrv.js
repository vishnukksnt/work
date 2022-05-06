angular.module('sntRover').service('rvAngularIframeHelperSrv',
	function($sce, sntAuthorizationSrv, $rootScope) {
		/**
		 * Pass initial data to Angular app to avoid extra API calls for fetching initial APIs
		 
  		USER_HOTELS
           - /api/current_user_hotels

     	BUSSINESS_DATE
        - /api/business_dates/active 

     	HOTEL_SETTINGS
        - /api/hotel_settings.json
	  		
     	ROVER_HEADER_INFO
	    - /api/rover_header_info.json
		  		
		PERMISSIONS
			- /api/permissions

		DASHBOARD_DATA
			- /api/dashboards

		CLOUD_STORAGE_CONFIG
			- /api/integrations/cloudFileAttachments/settings

		ROOM_TYPES
			- /api/room_types?exclude_pseudo=true
	
		 **/
		var HotelInitialData = {};
		var angularAppInitialState = {};
		var getUrl = window.location;
		var that = this;

		this.baseUrl = getUrl.protocol + "//" + getUrl.host;

		this.setHotelInitialData = function(key, data) {
			HotelInitialData[key] = angular.copy(data);
		};
		this.getHotelInitialData = function() {
			return HotelInitialData;
		};

		this.setHotelInitialState = function(data) {
			angularAppInitialState = data;
		};
		this.getHotelInitialState = function() {
			return angularAppInitialState;
		};

		this.retrieveIframeURL = function() {
			var angularAppUrl = this.baseUrl + "/ui/pms-hotel/" + sntAuthorizationSrv.getProperty();

			// Uncomment if need to test with live reloading
			// angularAppUrl = 'http://localhost:4204/' + sntAuthorizationSrv.getProperty();


			return $sce.trustAsResourceUrl(angularAppUrl);
		};

		this.iframePageActions = function(leavingIframe) {
			angular.element(document.querySelector('.nav-toggle')).css('display', leavingIframe ? 'block' : 'none');
		};

		this.convertedStates = [{
			name: 'rover.dashboard.manager',
			ng2route: 'dashboard/manager',
			featureToggle: 'load_manager_dashboard_in_ng2'
		}, {
			name: 'rover.dashboard.frontoffice',
			ng2route: 'dashboard/frontdesk',
			featureToggle: 'load_fd_dashboard_in_ng2'
		}, {
			name: 'rover.dashboard.housekeeping',
			ng2route: 'dashboard/housekeeping',
			featureToggle: 'load_hk_dashboard_in_ng2'
		}];

		this.getConvertedState = function(toState) {
			return _.find(that.convertedStates, function(state) {
				return state.name === toState.name;
			});
		};

		this.loadStateInNewApp = function(toState, toParams) {
			var currentConvertedState = that.getConvertedState(toState, toParams);

			return (currentConvertedState && $rootScope.featureToggles && $rootScope.featureToggles[currentConvertedState.featureToggle] &&
				!toParams.loadInNg1);

		};

	});