angular.module('sntRover').service('RVGAHelperSrv', ['$window', '$log', function($window, $log) {
	var actionMapping = {
		'LOAD_RESERVATION': {
			id: '',
			label: '',
			startTime: ''
		},
		'CHECKIN': {
			id: '',
			label: '',
			startTime: ''
		},
		'CHECKOUT': {
			id: '',
			label: '',
			startTime: ''
		}
	};
	var resetEventType = function(eventType) {
		actionMapping[eventType] = {
			id: '',
			label: '',
			startTime: ''
		};
	};

	this.startEventTiming = function(eventType, id, label) {
		actionMapping[eventType] = {
			id: id,
			label: label,
			startTime: new Date().getTime()
		};
	};

	this.sendEventToGA = function(eventType, id, label) {
		if ((actionMapping[eventType].id === id || actionMapping[eventType].label === id) && actionMapping[eventType].startTime) {
			var eventAttributes = {
				name: eventType.replace("_", " ").toLowerCase(),
				time: ((new Date().getTime() - actionMapping[eventType].startTime) / 1000).toFixed(2),
				entity: '#' + (label ? label : actionMapping[eventType].label)
			};

			resetEventType(eventType);
			$log.info('GTM::-> ' + eventAttributes.name + ' ::-> ' + eventAttributes.entity + ' ::-> ' + eventAttributes.time);
			if ($window['dataLayer']) {
				$window['dataLayer'].push({
					event: 'trackActionTime',
					attributes: eventAttributes
				});
			}
		}
	};
}]);