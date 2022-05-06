sntRover.controller('rvAngularIframeCtrl', ['$scope',
	'$rootScope',
	'$stateParams',
	'$state',
	'sntActivity',
	'sntAuthorizationSrv',
	'rvAngularIframeHelperSrv',
	'RVGAHelperSrv',
	'$vault',
	function($scope, $rootScope, $stateParams, $state, sntActivity, sntAuthorizationSrv, iframeHelperSrv, RVGAHelperSrv, $vault) {

		BaseCtrl.call(this, $scope);

		var angularIframe = $('#angular-iframe');
		// add check to have unwanted navigation if on other screens
		var isInsideIframeState = $state.current.name === 'rover.angularIframe';

		var eventMethod = window.addEventListener ?
			'addEventListener' :
			'attachEvent';
		var eventer = window[eventMethod];
		var messageEvent = eventMethod === 'attachEvent' ? 'onmessage' : 'message';

		var specialNavigationMapping = [
			'rover.reservation.staycard.reservationcard.reservationdetails'
		];
		var handleSpecialNavigations = function(state, params) {
			var stateParams;
			switch (state) {
				case 'rover.reservation.staycard.reservationcard.reservationdetails':
					RVGAHelperSrv.startEventTiming('LOAD_RESERVATION', params.reservationID, params.confirmationID);
					$rootScope.goToReservationCalled = true;
					$scope.$emit('GUESTCARDVISIBLE', false);
					$vault.set('isBulkCheckinSelected', params.isBulkCheckinSelected.toString());
					stateParams = {
						id: params.reservationID,
						confirmationId: params.confirmationID,
						isrefresh: true,
						isBulkCheckoutSelected: params.isBulkCheckoutSelected,
						isAllowOpenBalanceCheckoutSelected: params.allowOpenBalanceCheckout,
						isBulkCheckinSelected: params.isBulkCheckinSelected
					}
					break;
				default:
					break;
			}
			$state.go(state, stateParams);
		};
		
		var windowEventHandlerFromIFrame = function(e) {
			console.log('%c NG1 app received message from NG2 app ', 'background: #222; color: #bada55');
			console.info(e.data);
			// if (e.origin !== iframeHelperSrv.baseUrl){
			// 	return;
			// }
			if (isInsideIframeState && e.data.type && e.data.type === 'NAVIGATION') {
				if (specialNavigationMapping.includes(e.data.target.state)) {
					handleSpecialNavigations(e.data.target.state, e.data.target.params)
				} else {
					$state.go(e.data.target.state, e.data.target.params);
				}

			} else if (isInsideIframeState && e.data.type === 'UPDATE_DATA') { //
			} else if (isInsideIframeState && e.data.type === 'UPDATE_DOCUMENT_TITLE') {
				$scope.setTitle(e.data.title);
			}
		};

		eventer(
			messageEvent,
			windowEventHandlerFromIFrame,
			false
		);

		$scope.$on('$destroy', function() {
			// iframeHelperSrv.iframePageActions(true);
			window.removeEventListener(messageEvent, windowEventHandlerFromIFrame, false);
		});

		$scope.$on('PASS_DATA_TO_ANGULAR_APP', function(evt, data) {
			data = {
				PARENT_PAGE: 'PMS_STAFF',
				EVENT: data
			};
			// TODO: uncomment this and delete below to specify target 
			// angularIframe[0].contentWindow.postMessage(data, iframeHelperSrv.baseUrl);
			angularIframe[0].contentWindow.postMessage(data, '*');
		});

		(function() {
			$scope.ifameURL = iframeHelperSrv.retrieveIframeURL();
			sntActivity.start('LOADIG_ANGULAR_APP');
			angularIframe.on('load', function()  {
				sntActivity.stop('LOADIG_ANGULAR_APP');
				// pass all required initial data to new app to avoid duplicate requests
				$scope.$emit('PASS_DATA_TO_ANGULAR_APP', {
					EVENT_TYPE: 'INITIAL_DATA',
					DATA: {
						INITIAL_STATE: iframeHelperSrv.getHotelInitialState(),
						INITIAL_APP_DATA: iframeHelperSrv.getHotelInitialData(),
						HOTEL_UUID: sntAuthorizationSrv.getProperty(),
						JWT: localStorage.getItem('jwt') // might not be needed in real app, can use for running angular app in different port during development
					}
				});
			});
		}());
	}
]);